import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveAppEntryRoute } from "./entry-routing.service";

const mockGetActiveCycleRuns = vi.fn();

vi.mock("@/repositories/cycle-run.repository", () => ({
  getActiveCycleRuns: () => mockGetActiveCycleRuns(),
}));

describe("resolveAppEntryRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes to training when an active cycle exists", async () => {
    mockGetActiveCycleRuns.mockResolvedValue([
      {
        id: "c1",
        trainingSetId: "set1",
        cycleNumber: 1,
        status: "active",
        startedAt: "2026-03-19T10:00:00.000Z",
        completedAt: undefined,
        totalTimeMs: 0,
        solvedCount: 0,
        totalExercises: 100,
        nextExerciseIndex: 3,
      },
    ]);
    await expect(resolveAppEntryRoute()).resolves.toBe("/app/training");
  });

  it("routes to training sets when no active cycle exists", async () => {
    mockGetActiveCycleRuns.mockResolvedValue([]);
    await expect(resolveAppEntryRoute()).resolves.toBe("/app/sets");
  });
});
