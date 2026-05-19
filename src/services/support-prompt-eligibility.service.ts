import { db } from "@/db/dexie";
import { getCompletedSessionsCount } from "@/repositories/session.repository";

/** At least one finished cycle. */
export const SUPPORT_PROMPT_MIN_COMPLETED_CYCLES = 1;
/** Meaningful puzzle volume without a full cycle yet. */
export const SUPPORT_PROMPT_MIN_EXERCISE_ATTEMPTS = 15;
/** Repeated training usage across sessions. */
export const SUPPORT_PROMPT_MIN_COMPLETED_SESSIONS = 2;

/**
 * Show support prompts only after the user has meaningful training history.
 * Any one threshold is enough.
 */
export async function meetsSupportPromptMilestone(): Promise<boolean> {
  const [completedCycles, completedSessions, exerciseAttempts] =
    await Promise.all([
      db.cycleRuns.where("status").equals("completed").count(),
      getCompletedSessionsCount(),
      db.exerciseAttempts.count(),
    ]);

  return (
    completedCycles >= SUPPORT_PROMPT_MIN_COMPLETED_CYCLES ||
    exerciseAttempts >= SUPPORT_PROMPT_MIN_EXERCISE_ATTEMPTS ||
    completedSessions >= SUPPORT_PROMPT_MIN_COMPLETED_SESSIONS
  );
}
