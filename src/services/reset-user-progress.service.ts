/**
 * Reset user progress service. Orchestrates the DB reset and returns a typed summary.
 * Use this from UI or console when you want a "fresh user" state while keeping the puzzle library.
 *
 * Browser-only: requires IndexedDB (Dexie). Not runnable from Node scripts.
 */

import {
  resetUserProgressPreserveLibrary as dbResetUserProgress,
  type ResetUserProgressResult,
} from "@/db/reset-user-progress";

export type { ResetUserProgressResult };

/**
 * Resets user progress while preserving training sets and exercises.
 * Clears: cycle runs, sessions, attempts, mistakes, app instance.
 * Resets settings to default (theme: system, board: white, no last training set).
 *
 * Safe to call from dev Settings UI or browser console. Not exposed in production.
 *
 * @returns Summary of what was reset (counts and flags).
 */
export async function resetUserProgressPreserveLibrary(): Promise<ResetUserProgressResult> {
  return dbResetUserProgress();
}
