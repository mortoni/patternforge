/**
 * Exercise repository. Client-side only.
 */

import { db } from "@/db/dexie";
import type { ExerciseSchema } from "@/db/schema";

export async function getExercisesByTrainingSetId(
  trainingSetId: string
): Promise<ExerciseSchema[]> {
  return db.exercises
    .where("trainingSetId")
    .equals(trainingSetId)
    .sortBy("createdAt");
}

export async function getExerciseById(
  id: string
): Promise<ExerciseSchema | undefined> {
  return db.exercises.get(id);
}

export async function getExercisesByIds(
  ids: string[]
): Promise<ExerciseSchema[]> {
  if (ids.length === 0) return [];
  return db.exercises.where("id").anyOf(ids).toArray();
}

export async function countByTrainingSetId(
  trainingSetId: string
): Promise<number> {
  return db.exercises.where("trainingSetId").equals(trainingSetId).count();
}

/**
 * Find exercises by puzzleNumber across all sets.
 * Uses in-memory filtering because puzzleNumber is not indexed in Dexie schema.
 */
export async function getExercisesByPuzzleNumber(
  puzzleNumber: number
): Promise<ExerciseSchema[]> {
  const all = await db.exercises.toArray();
  return all
    .filter((e) => e.puzzleNumber === puzzleNumber)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function addExercise(
  data: Omit<ExerciseSchema, "id"> & { id?: string }
): Promise<string> {
  const id = data.id ?? crypto.randomUUID();
  await db.exercises.add({ ...data, id });
  return id;
}

export async function updateExercise(
  id: string,
  patch: Partial<Omit<ExerciseSchema, "id">>
): Promise<void> {
  await db.exercises.update(id, patch);
}

export async function deleteExercise(id: string): Promise<void> {
  await db.exercises.delete(id);
}

/** Upsert multiple exercises by id. Use for import; put overwrites existing. */
export async function upsertManyExercises(
  exercises: Array<Omit<ExerciseSchema, "createdAt"> & { createdAt?: string }>
): Promise<void> {
  const now = new Date().toISOString();
  await db.exercises.bulkPut(
    exercises.map((e) => ({ ...e, createdAt: e.createdAt ?? now }))
  );
}
