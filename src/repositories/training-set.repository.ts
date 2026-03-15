/**
 * Training set repository. Client-side only.
 */

import { db } from "@/db/dexie";
import type { TrainingSetSchema } from "@/db/schema";

export async function getAllTrainingSets(): Promise<TrainingSetSchema[]> {
  return db.trainingSets.orderBy("createdAt").reverse().toArray();
}

export async function getTrainingSetById(
  id: string
): Promise<TrainingSetSchema | undefined> {
  return db.trainingSets.get(id);
}

/** Fetch multiple training sets by id (batch; avoids N+1). */
export async function getTrainingSetsByIds(
  ids: string[]
): Promise<TrainingSetSchema[]> {
  if (ids.length === 0) return [];
  return db.trainingSets.where("id").anyOf(ids).toArray();
}

export async function addTrainingSet(
  data: Omit<TrainingSetSchema, "id"> & { id?: string }
): Promise<string> {
  const id = data.id ?? crypto.randomUUID();
  await db.trainingSets.add({ ...data, id });
  return id;
}

export async function updateTrainingSet(
  id: string,
  patch: Partial<Omit<TrainingSetSchema, "id">>
): Promise<void> {
  await db.trainingSets.update(id, patch);
}

export async function deleteTrainingSet(id: string): Promise<void> {
  await db.trainingSets.delete(id);
}

/** Upsert multiple training sets. Skips if id exists (put overwrites). */
export async function upsertManyTrainingSets(
  sets: Array<Omit<TrainingSetSchema, "createdAt"> & { createdAt?: string }>
): Promise<void> {
  const now = new Date().toISOString();
  await db.trainingSets.bulkPut(
    sets.map((s) => ({ ...s, createdAt: s.createdAt ?? now }))
  );
}
