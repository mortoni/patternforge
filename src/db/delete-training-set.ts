/**
 * Cascade-delete a training set and all related data from IndexedDB.
 * Browser-only (Dexie). Use from console or UI to remove a set by name.
 */

import { db } from "./dexie";

/**
 * Deletes a training set and all related: exercises, cycle runs, sessions,
 * exercise attempts, mistake entries. Clears lastTrainingSetId in settings if it pointed to this set.
 */
export async function deleteTrainingSetCascade(id: string): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.trainingSets,
      db.exercises,
      db.cycleRuns,
      db.sessions,
      db.exerciseAttempts,
      db.mistakeEntries,
      db.settings,
    ],
    async () => {
      const cycleRuns = await db.cycleRuns.where("trainingSetId").equals(id).toArray();
      const cycleRunIds = cycleRuns.map((c) => c.id);

      await Promise.all([
        cycleRunIds.length > 0
          ? db.exerciseAttempts.where("cycleRunId").anyOf(cycleRunIds).delete()
          : Promise.resolve(),
        db.sessions.where("trainingSetId").equals(id).delete(),
        db.cycleRuns.where("trainingSetId").equals(id).delete(),
        db.mistakeEntries.where("trainingSetId").equals(id).delete(),
        db.exercises.where("trainingSetId").equals(id).delete(),
      ]);

      const settings = await db.settings.get("default");
      if (settings?.lastTrainingSetId === id) {
        await db.settings.put({ ...settings, lastTrainingSetId: undefined });
      }

      await db.trainingSets.delete(id);
    }
  );
}

/**
 * Finds a training set by name and cascade-deletes it.
 * No-op if no set has the given name.
 */
export async function deleteTrainingSetCascadeByName(name: string): Promise<boolean> {
  const set = await db.trainingSets.where("name").equals(name).first();
  if (!set) return false;
  await deleteTrainingSetCascade(set.id);
  return true;
}
