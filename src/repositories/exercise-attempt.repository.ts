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

export async function getAttemptsByCycleRunId(
  cycleRunId: string
): Promise<ExerciseAttemptSchema[]> {
  return db.exerciseAttempts
    .where("cycleRunId")
    .equals(cycleRunId)
    .sortBy("startedAt");
}

/** Skipped-attempt counts per session (truthy when sessionId was stored on attempts). */
export async function getSkippedCountsBySessionIds(
  sessionIds: string[]
): Promise<Map<string, number>> {
  if (sessionIds.length === 0) return new Map();
  const map = new Map<string, number>();
  for (const id of sessionIds) {
    map.set(id, 0);
  }
  const attempts = await db.exerciseAttempts
    .where("sessionId")
    .anyOf(sessionIds)
    .toArray();
  for (const a of attempts) {
    if (a.sessionId == null || a.result !== "skipped") continue;
    map.set(a.sessionId, (map.get(a.sessionId) ?? 0) + 1);
  }
  return map;
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
