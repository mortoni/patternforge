/**
 * Exercise attempt repository. Client-side only.
 */

import { db } from "@/db/dexie";
import type { ExerciseAttemptSchema } from "@/db/schema";

export async function getAttemptById(
  id: string
): Promise<ExerciseAttemptSchema | undefined> {
  return db.exerciseAttempts.get(id);
}

export async function getAttemptsBySessionId(
  sessionId: string
): Promise<ExerciseAttemptSchema[]> {
  return db.exerciseAttempts
    .where("sessionId")
    .equals(sessionId)
    .sortBy("startedAt");
}

export async function getAllAttempts(): Promise<ExerciseAttemptSchema[]> {
  return db.exerciseAttempts.orderBy("startedAt").toArray();
}

/** Most recent attempts across all sessions, by startedAt descending. */
export async function getRecentAttempts(
  limit: number
): Promise<ExerciseAttemptSchema[]> {
  return db.exerciseAttempts
    .orderBy("startedAt")
    .reverse()
    .limit(limit)
    .toArray();
}

export async function addExerciseAttempt(
  data: Omit<ExerciseAttemptSchema, "id"> & { id?: string }
): Promise<string> {
  const id = data.id ?? crypto.randomUUID();
  await db.exerciseAttempts.add({ ...data, id });
  return id;
}

export async function updateExerciseAttempt(
  id: string,
  patch: Partial<Omit<ExerciseAttemptSchema, "id">>
): Promise<void> {
  await db.exerciseAttempts.update(id, patch);
}
