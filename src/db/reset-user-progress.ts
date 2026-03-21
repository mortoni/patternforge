/**
 * Reset user progress while preserving the training-set library and exercises.
 * Browser-only (IndexedDB/Dexie). Safe to call from app or console in development.
 *
 * Preserves: trainingSets, exercises
 * Clears: cycleRuns, sessions, exerciseAttempts, mistakeEntries, appInstance
 * Resets: settings to default (theme: system, boardOrientation: white, boardStyle: classic, no lastTrainingSetId)
 */

import { db } from "./dexie";

const DEFAULT_SETTINGS_ID = "default";

/** Default app settings state after reset. */
const DEFAULT_SETTINGS = {
  id: DEFAULT_SETTINGS_ID,
  theme: "system" as const,
  boardOrientation: "white" as const,
  boardStyle: "classic" as const,
  lastTrainingSetId: undefined as string | undefined,
};

export interface ResetUserProgressResult {
  cycleRunsDeleted: number;
  sessionsDeleted: number;
  attemptsDeleted: number;
  mistakesDeleted: number;
  appInstanceReset: number;
  settingsReset: boolean;
}

/**
 * Resets all user progress and user-specific state. Does NOT delete training sets or exercises.
 * Runs in a single Dexie transaction. After reset, settings exist with default values
 * and the app can boot normally; appInstance will be recreated by bootstrap on next use.
 */
export async function resetUserProgressPreserveLibrary(): Promise<ResetUserProgressResult> {
  const result = await db.transaction(
    "rw",
    [
      db.cycleRuns,
      db.sessions,
      db.exerciseAttempts,
      db.mistakeEntries,
      db.appInstance,
      db.settings,
    ],
    async () => {
      const [
        cycleRunsDeleted,
        sessionsDeleted,
        attemptsDeleted,
        mistakesDeleted,
        appInstanceCount,
      ] = await Promise.all([
        db.cycleRuns.count(),
        db.sessions.count(),
        db.exerciseAttempts.count(),
        db.mistakeEntries.count(),
        db.appInstance.count(),
      ]);

      await Promise.all([
        db.cycleRuns.clear(),
        db.sessions.clear(),
        db.exerciseAttempts.clear(),
        db.mistakeEntries.clear(),
        db.appInstance.clear(),
      ]);

      await db.settings.put(DEFAULT_SETTINGS);

      return {
        cycleRunsDeleted,
        sessionsDeleted,
        attemptsDeleted,
        mistakesDeleted,
        appInstanceReset: appInstanceCount,
        settingsReset: true,
      };
    }
  );

  return result;
}
