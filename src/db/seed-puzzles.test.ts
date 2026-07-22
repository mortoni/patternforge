import { afterEach, describe, expect, it, vi } from "vitest";
import { seedPuzzlesFromGeneratedJson, WOODPECKER_SET_IDS } from "./seed-puzzles";
import { upsertManyTrainingSets } from "@/repositories/training-set.repository";
import { upsertManyExercises } from "@/repositories/exercise.repository";

vi.mock("./dexie", () => ({ db: {} }));
vi.mock("@/repositories/training-set.repository", () => ({
  upsertManyTrainingSets: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/repositories/exercise.repository", () => ({
  upsertManyExercises: vi.fn().mockResolvedValue(undefined),
}));

/**
 * The service worker precaches /data/woodpecker/*.json by exact URL so
 * first-run seeding works offline (see src/app/sw.ts). A cache-busting query
 * param on the production fetch bypasses that cache entirely — this suite
 * pins the fetch URLs so the offline path can't silently regress.
 */

function stubFetchCapturingUrls(urls: string[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      urls.push(String(url));
      const setId = String(url)
        .split("/")
        .pop()!
        .split(".json")[0];
      return {
        ok: true,
        json: async () => ({ trainingSetId: setId, puzzles: [] }),
      } as unknown as Response;
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("seedPuzzlesFromGeneratedJson fetch URLs", () => {
  it("fetches plain bundle URLs in production (service worker precache must hit)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const urls: string[] = [];
    stubFetchCapturingUrls(urls);

    await seedPuzzlesFromGeneratedJson();

    expect(urls.sort()).toEqual(
      [...WOODPECKER_SET_IDS].map((id) => `/data/woodpecker/${id}.json`).sort()
    );
  });

  it("cache-busts bundle URLs outside production so edited JSON reloads in dev", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const urls: string[] = [];
    stubFetchCapturingUrls(urls);

    await seedPuzzlesFromGeneratedJson();

    expect(urls).toHaveLength(WOODPECKER_SET_IDS.length);
    for (const url of urls) {
      expect(url).toMatch(/\/data\/woodpecker\/[a-z-]+\.json\?_t=\d+/);
    }
  });
});

describe("seedPuzzlesFromGeneratedJson zod validation", () => {
  function stubFetchReturning(json: unknown) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => json }) as unknown as Response)
    );
  }

  it("rejects a bundle whose shape is invalid and writes nothing", async () => {
    // Missing `puzzles` and unknown trainingSetId — must fail the schema.
    stubFetchReturning({ trainingSetId: "not-a-real-set" });

    await expect(seedPuzzlesFromGeneratedJson()).rejects.toThrow(
      /Invalid Woodpecker bundle/
    );
    expect(upsertManyTrainingSets).not.toHaveBeenCalled();
    expect(upsertManyExercises).not.toHaveBeenCalled();
  });

  it("rejects a bundle with a malformed puzzle (bad puzzleNumber)", async () => {
    stubFetchReturning({
      trainingSetId: "woodpecker-easy",
      puzzles: [
        {
          id: "exercise-0001",
          puzzleNumber: -3, // must be a positive int
          fen: "8/8/8/8/8/8/8/8 w - - 0 1",
          sideToMove: "w",
          difficulty: "easy",
          solution: { mainLine: ["e4"], uci: ["e2e4"], fullLine: [] },
          metadata: { motifTags: [], gameSource: "x" },
          validation: {
            status: "unverified",
            engineScore: null,
            alternativeFirstMoves: [],
          },
        },
      ],
    });

    await expect(seedPuzzlesFromGeneratedJson()).rejects.toThrow(
      /Invalid Woodpecker bundle/
    );
    expect(upsertManyExercises).not.toHaveBeenCalled();
  });
});
