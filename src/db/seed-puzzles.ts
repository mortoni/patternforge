/**
 * Seed puzzles from Woodpecker JSON bundles (fetched from /data/woodpecker/ in browser).
 * Call seedPuzzlesFromGeneratedJson() from a dev-only UI or console.
 * Does not wipe DB by default. Use resetPuzzleDataForDevelopment() to clear puzzle data.
 */

import { db } from "@/db/dexie";
import { upsertManyTrainingSets } from "@/repositories/training-set.repository";
import { upsertManyExercises } from "@/repositories/exercise.repository";
import type { TrainingSetSchema } from "@/db/schema";
import type { ExerciseSchema } from "@/db/schema";

const BASE = "/data/woodpecker";
const WOODPECKER_SET_IDS = [
  "woodpecker-easy",
  "woodpecker-intermediate",
  "woodpecker-advanced",
] as const;
type WoodpeckerSetId = (typeof WOODPECKER_SET_IDS)[number];

interface WoodpeckerPuzzle {
  id: string;
  puzzleNumber: number;
  fen: string;
  sideToMove: "w" | "b";
  difficulty: "easy" | "intermediate" | "advanced";
  solution: {
    mainLine: string[];
    uci: string[];
    fullLine: Array<{ move: string; uci: string }>;
  };
  metadata: {
    motifTags: string[];
    gameSource: string;
    comment?: string;
  };
  validation: {
    status: "unverified";
    engineScore: null;
    alternativeFirstMoves: string[];
  };
}

interface WoodpeckerSetBundle {
  trainingSetId: WoodpeckerSetId;
  puzzles: WoodpeckerPuzzle[];
}

const WOODPECKER_SET_META: Record<
  WoodpeckerSetId,
  { name: string; description: string; difficulty: "easy" | "intermediate" | "advanced" }
> = {
  "woodpecker-easy": {
    name: "Woodpecker Easy",
    description: "Woodpecker method - easier positions.",
    difficulty: "easy",
  },
  "woodpecker-intermediate": {
    name: "Woodpecker Intermediate",
    description: "Woodpecker method - intermediate level.",
    difficulty: "intermediate",
  },
  "woodpecker-advanced": {
    name: "Woodpecker Advanced",
    description: "Woodpecker method - advanced positions.",
    difficulty: "advanced",
  },
};

/** Cache-bust so we always load the latest bundle JSON in development. */
function cacheBust(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}_t=${Date.now()}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = cacheBust(path);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch ${path}: ${res.status} ${res.statusText}. Check that public/data/woodpecker/ exists and run pnpm run validate:woodpecker.`
    );
  }
  return res.json();
}

/**
 * Map woodpecker puzzle to Exercise schema.
 * firstMove prefers UCI (solution.uci[0]) and falls back to SAN.
 */
function toExercise(setId: WoodpeckerSetId, p: WoodpeckerPuzzle): ExerciseSchema {
  const firstNonEmptyUci = p.solution.uci.find((m) => m.trim().length > 0);
  const firstMainLine = p.solution.mainLine.find((m) => m.trim().length > 0);

  return {
    id: p.id,
    trainingSetId: setId,
    fen: p.fen,
    sideToMove: p.sideToMove,
    solutionMoves: p.solution.mainLine,
    firstMove: firstNonEmptyUci ?? firstMainLine,
    source: p.metadata.gameSource || undefined,
    motifTags: p.metadata.motifTags.length > 0 ? p.metadata.motifTags : undefined,
    createdAt: new Date().toISOString(),
    puzzleNumber: p.puzzleNumber,
    difficulty: p.difficulty,
    comment: p.metadata.comment,
  };
}

/**
 * Build TrainingSet schema from known Woodpecker metadata.
 */
function toTrainingSet(setId: WoodpeckerSetId, exerciseIds: string[]): TrainingSetSchema {
  const meta = WOODPECKER_SET_META[setId];
  return {
    id: setId,
    name: meta.name,
    description: meta.description,
    difficulty: meta.difficulty,
    exerciseIds,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Load Woodpecker JSON bundles from public/data/woodpecker and seed into Dexie.
 * Safe to call multiple times; upserts by id.
 */
export async function seedPuzzlesFromGeneratedJson(
  baseUrl: string = BASE
): Promise<{ trainingSets: number; exercises: number }> {
  const bundles = await Promise.all(
    WOODPECKER_SET_IDS.map((setId) =>
      fetchJson<WoodpeckerSetBundle>(`${baseUrl}/${setId}.json`)
    )
  );

  const exercises: ExerciseSchema[] = bundles.flatMap((bundle) =>
    bundle.puzzles.map((p) => toExercise(bundle.trainingSetId, p))
  );
  const exerciseIdsBySet: Record<string, string[]> = {};
  for (const bundle of bundles) {
    const sorted = [...bundle.puzzles].sort((a, b) => a.puzzleNumber - b.puzzleNumber);
    exerciseIdsBySet[bundle.trainingSetId] = sorted.map((p) => p.id);
  }

  const sets: TrainingSetSchema[] = WOODPECKER_SET_IDS.map((setId) =>
    toTrainingSet(setId, exerciseIdsBySet[setId] ?? [])
  );

  await upsertManyTrainingSets(sets);
  await upsertManyExercises(exercises);

  return { trainingSets: sets.length, exercises: exercises.length };
}

/**
 * If IndexedDB has no training sets, fetch `public/data/woodpecker/*.json` and upsert into Dexie.
 * Runs in production (first visit) and development. No-op when sets already exist.
 * Safe to call multiple times.
 */
export async function ensureGeneratedPuzzlesInDbIfEmpty(): Promise<boolean> {
  const count = await db.trainingSets.count();
  if (count > 0) return false;
  try {
    await seedPuzzlesFromGeneratedJson();
    return true;
  } catch (err) {
    console.error(
      "[PatternForge] Failed to load training library from /data/woodpecker. Commit public/data/woodpecker/ and redeploy, or run pnpm run validate:woodpecker locally.",
      err
    );
    return false;
  }
}

/**
 * Reset puzzle-related data for development (easy, intermediate, advanced sets and their exercises).
 * Does not call automatically. Use from dev console or a guarded dev-only button.
 */
export async function resetPuzzleDataForDevelopment(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;

  const ids = [...WOODPECKER_SET_IDS];
  const sets = await db.trainingSets.where("id").anyOf(ids).toArray();
  const exerciseIds = sets.flatMap((s) => s.exerciseIds);

  await db.exercises.bulkDelete(exerciseIds);
  await db.trainingSets.bulkDelete(ids);
}

/**
 * Remove ALL training sets and all related data (exercises, cycles, sessions, attempts, mistakes).
 * Dev only. Use before loading from Woodpecker JSON bundles so only the 3 Woodpecker sets remain.
 */
export async function clearAllTrainingSetsForDevelopment(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;

  const sets = await db.trainingSets.toArray();
  const setIds = sets.map((s) => s.id);
  if (setIds.length === 0) return;

  const cycleRuns = await db.cycleRuns.where("trainingSetId").anyOf(setIds).toArray();
  const cycleRunIds = cycleRuns.map((c) => c.id);

  await db.transaction(
    "rw",
    [
      db.exerciseAttempts,
      db.sessions,
      db.cycleRuns,
      db.mistakeEntries,
      db.exercises,
      db.trainingSets,
      db.settings,
    ],
    async () => {
      if (cycleRunIds.length > 0) {
        await db.exerciseAttempts.where("cycleRunId").anyOf(cycleRunIds).delete();
      }
      await db.sessions.where("trainingSetId").anyOf(setIds).delete();
      await db.cycleRuns.where("trainingSetId").anyOf(setIds).delete();
      await db.mistakeEntries.where("trainingSetId").anyOf(setIds).delete();
      await db.exercises.where("trainingSetId").anyOf(setIds).delete();
      await db.trainingSets.bulkDelete(setIds);

      const settings = await db.settings.get("default");
      if (settings && settings.lastTrainingSetId != null) {
        await db.settings.put({ ...settings, lastTrainingSetId: undefined });
      }
    }
  );
}
