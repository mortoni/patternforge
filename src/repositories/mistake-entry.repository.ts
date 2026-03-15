/**
 * Mistake entry repository. Client-side only.
 */

import { db } from "@/db/dexie";
import type { MistakeEntrySchema } from "@/db/schema";

export async function getMistakeById(
  id: string
): Promise<MistakeEntrySchema | undefined> {
  return db.mistakeEntries.get(id);
}

/** Lookup by exerciseId only (legacy). Prefer getByTrainingSetAndExercise for uniqueness. */
export async function getMistakesByExerciseId(
  exerciseId: string
): Promise<MistakeEntrySchema | undefined> {
  return db.mistakeEntries.where("exerciseId").equals(exerciseId).first();
}

/** Uniqueness: one MistakeEntry per (trainingSetId, exerciseId). Use for recordFailure/recordSkip. */
export async function getByTrainingSetAndExercise(
  trainingSetId: string,
  exerciseId: string
): Promise<MistakeEntrySchema | undefined> {
  return db.mistakeEntries
    .where("[trainingSetId+exerciseId]")
    .equals([trainingSetId, exerciseId])
    .first();
}

export async function getMistakesByTrainingSetId(
  trainingSetId: string
): Promise<MistakeEntrySchema[]> {
  return db.mistakeEntries
    .where("trainingSetId")
    .equals(trainingSetId)
    .sortBy("createdAt");
}

export async function getMistakesByStatus(
  status: MistakeEntrySchema["status"]
): Promise<MistakeEntrySchema[]> {
  return db.mistakeEntries.where("status").equals(status).toArray();
}

/** Active mistakes: status !== mastered, for review list. Most recently reviewed first. */
export async function getActiveMistakes(): Promise<MistakeEntrySchema[]> {
  const list = await db.mistakeEntries
    .where("status")
    .noneOf(["mastered"])
    .sortBy("lastReviewedAt");
  return list.reverse();
}

export async function countByStatus(
  status: MistakeEntrySchema["status"]
): Promise<number> {
  return db.mistakeEntries.where("status").equals(status).count();
}

/** Count of active (non-mastered) mistakes. */
export async function countActive(): Promise<number> {
  return db.mistakeEntries.where("status").noneOf(["mastered"]).count();
}

export interface MistakeSummaryCounts {
  needsReview: number;
  solvedOnce: number;
  solvedTwice: number;
  mastered: number;
  activeCount: number;
}

/** Count mistakes by status for summary cards. */
export async function getSummaryCounts(): Promise<MistakeSummaryCounts> {
  const [needsReview, solvedOnce, solvedTwice, mastered] = await Promise.all([
    countByStatus("needs_review"),
    countByStatus("solved_once"),
    countByStatus("solved_twice"),
    countByStatus("mastered"),
  ]);
  return {
    needsReview,
    solvedOnce,
    solvedTwice,
    mastered,
    activeCount: needsReview + solvedOnce + solvedTwice,
  };
}

export async function addMistakeEntry(
  data: Omit<MistakeEntrySchema, "id"> & { id?: string }
): Promise<string> {
  const id = data.id ?? crypto.randomUUID();
  await db.mistakeEntries.add({ ...data, id });
  return id;
}

export async function updateMistakeEntry(
  id: string,
  patch: Partial<Omit<MistakeEntrySchema, "id">>
): Promise<void> {
  await db.mistakeEntries.update(id, patch);
}
