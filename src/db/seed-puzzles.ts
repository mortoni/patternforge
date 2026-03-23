/**
 * Seed puzzles from generated JSON (fetched from /data/generated/ in browser).
 * Call seedPuzzlesFromGeneratedJson() from a dev-only UI or console.
 * Does not wipe DB by default. Use resetPuzzleDataForDevelopment() to clear puzzle data.
 */

import { db } from "@/db/dexie";
import { upsertManyTrainingSets } from "@/repositories/training-set.repository";
import { upsertManyExercises } from "@/repositories/exercise.repository";
import type { NormalizedPuzzle } from "@/domain/training/types/puzzle-import.types";
import type { GeneratedTrainingSetMeta } from "@/domain/training/types/puzzle-import.types";
import type { TrainingSetSchema } from "@/db/schema";
import type { ExerciseSchema } from "@/db/schema";

const BASE = "/data/generated";

/** Cache-bust so we always load the latest generated data after refresh-data. */
function cacheBust(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}_t=${Date.now()}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = cacheBust(path);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status} ${res.statusText}. Check that public/data/generated/ exists and run pnpm run refresh-data.`);
  }
  return res.json();
}

/**
 * Map normalized puzzle to Exercise schema (source = gameSource).
 * firstMove: use p.firstMove or derive from solutionMoves[0].
 */
function toExercise(p: NormalizedPuzzle): ExerciseSchema {
  return {
    id: p.id,
    trainingSetId: p.trainingSetId,
    fen: p.fen,
    sideToMove: p.sideToMove,
    solutionMoves: p.solutionMoves,
    firstMove: p.firstMove ?? (p.solutionMoves.length > 0 ? p.solutionMoves[0] : undefined),
    source: p.gameSource || undefined,
    motifTags: p.motifTags.length > 0 ? p.motifTags : undefined,
    createdAt: p.createdAt,
    puzzleNumber: p.puzzleNumber,
    difficulty: p.difficulty,
    comment: p.comment,
  };
}

/**
 * Map metadata to TrainingSet schema. exerciseIds filled after exercises are loaded.
 */
function toTrainingSet(m: GeneratedTrainingSetMeta, exerciseIds: string[]): TrainingSetSchema {
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    difficulty: m.difficulty,
    exerciseIds,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Load generated JSON from public/data/generated and seed into Dexie.
 * Run after npm run import:puzzles (or generate:puzzles) so JSON is in public.
 * Safe to call multiple times; upserts by id.
 */
export async function seedPuzzlesFromGeneratedJson(
  baseUrl: string = BASE
): Promise<{ trainingSets: number; exercises: number }> {
  const [meta, allPuzzles] = await Promise.all([
    fetchJson<GeneratedTrainingSetMeta[]>(`${baseUrl}/training-sets-meta.json`),
    fetchJson<NormalizedPuzzle[]>(`${baseUrl}/all-puzzles.json`),
  ]);

  const exercises = allPuzzles.map(toExercise);
  const exerciseIdsBySet: Record<string, string[]> = {};
  const byGroup = new Map<string, typeof allPuzzles>();
  for (const p of allPuzzles) {
    const list = byGroup.get(p.trainingSetId) ?? [];
    list.push(p);
    byGroup.set(p.trainingSetId, list);
  }
  for (const [setId, list] of byGroup) {
    list.sort((a, b) => a.puzzleNumber - b.puzzleNumber);
    exerciseIdsBySet[setId] = list.map((p) => p.id);
  }

  const sets: TrainingSetSchema[] = meta.map((m) =>
    toTrainingSet(m, exerciseIdsBySet[m.id] ?? [])
  );

  await upsertManyTrainingSets(sets);
  await upsertManyExercises(exercises);

  return { trainingSets: sets.length, exercises: exercises.length };
}

/**
 * If IndexedDB has no training sets, fetch `public/data/generated/*.json` and upsert into Dexie.
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
      "[PatternForge] Failed to load training library from /data/generated. Commit public/data/generated/ and redeploy, or run pnpm run refresh-data locally.",
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

  const ids = ["easy", "intermediate", "advanced"];
  const sets = await db.trainingSets.where("id").anyOf(ids).toArray();
  const exerciseIds = sets.flatMap((s) => s.exerciseIds);

  await db.exercises.bulkDelete(exerciseIds);
  await db.trainingSets.bulkDelete(ids);
}

/**
 * Remove ALL training sets and all related data (exercises, cycles, sessions, attempts, mistakes).
 * Dev only. Use before loading from generated JSON so only the 3 Woodpecker sets remain.
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
