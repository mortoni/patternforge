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

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
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
  const exerciseIdsBySet: Record<string, string[]> = { easy: [], intermediate: [], advanced: [] };
  allPuzzles
    .sort((a, b) => a.puzzleNumber - b.puzzleNumber)
    .forEach((p) => {
      if (exerciseIdsBySet[p.trainingSetId]) {
        exerciseIdsBySet[p.trainingSetId].push(p.id);
      }
    });

  const sets: TrainingSetSchema[] = meta.map((m) =>
    toTrainingSet(m, exerciseIdsBySet[m.id] ?? [])
  );

  await upsertManyTrainingSets(sets);
  await upsertManyExercises(exercises);

  return { trainingSets: sets.length, exercises: exercises.length };
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
