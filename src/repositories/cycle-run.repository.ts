/**
 * Cycle run repository. Client-side only.
 */

import { db } from "@/db/dexie";
import type { CycleRunSchema } from "@/db/schema";

export async function getCycleRunById(
  id: string
): Promise<CycleRunSchema | undefined> {
  return db.cycleRuns.get(id);
}

export async function getActiveCycleRunForSet(
  trainingSetId: string
): Promise<CycleRunSchema | undefined> {
  return db.cycleRuns
    .where("[trainingSetId+status]")
    .equals([trainingSetId, "active"])
    .first();
}

export async function getCycleRunsByTrainingSetId(
  trainingSetId: string
): Promise<CycleRunSchema[]> {
  return db.cycleRuns
    .where("trainingSetId")
    .equals(trainingSetId)
    .sortBy("startedAt");
}

/** All completed cycles (any set). */
export async function getCompletedCycleRuns(): Promise<CycleRunSchema[]> {
  return db.cycleRuns.where("status").equals("completed").toArray();
}

/** All active cycles (any set). */
export async function getActiveCycleRuns(): Promise<CycleRunSchema[]> {
  return db.cycleRuns.where("status").equals("active").toArray();
}

/** Latest cycle by startedAt (most recent). */
export async function getLatestCycleRunByTrainingSetId(
  trainingSetId: string
): Promise<CycleRunSchema | undefined> {
  const runs = await db.cycleRuns
    .where("trainingSetId")
    .equals(trainingSetId)
    .sortBy("startedAt");
  return runs.length > 0 ? runs[runs.length - 1] : undefined;
}

/** Latest completed cycle for a set (by completedAt desc). */
export async function getLatestCompletedCycleRunByTrainingSetId(
  trainingSetId: string
): Promise<CycleRunSchema | undefined> {
  const runs = await db.cycleRuns
    .where("trainingSetId")
    .equals(trainingSetId)
    .toArray();
  const completed = runs.filter((r) => r.status === "completed");
  completed.sort((a, b) =>
    (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
  );
  return completed[0];
}

/** Alias for detail page / service. */
export const getActiveByTrainingSetId = getActiveCycleRunForSet;

export async function addCycleRun(
  data: Omit<CycleRunSchema, "id"> & { id?: string }
): Promise<string> {
  const id = data.id ?? crypto.randomUUID();
  await db.cycleRuns.add({ ...data, id });
  return id;
}

export async function updateCycleRun(
  id: string,
  patch: Partial<Omit<CycleRunSchema, "id">>
): Promise<void> {
  await db.cycleRuns.update(id, patch);
}
