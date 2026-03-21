/**
 * Read-only aggregates for the Session Summary screen (end-of-session flow).
 * Volume and time only on the surface; per-session skips are shown separately from processed count.
 */

import {
  getSessionById,
  getSessionsByCycleRunId,
} from "@/repositories/session.repository";
import {
  getCycleRunById,
  getCycleRunsByTrainingSetId,
} from "@/repositories/cycle-run.repository";
import { getTrainingSetById } from "@/repositories/training-set.repository";
import { getSkippedCountsBySessionIds } from "@/repositories/exercise-attempt.repository";
import { effectiveSkippedCount } from "@/lib/training/effective-skipped-count";
import type { SessionSchema } from "@/db/schema";

export interface SessionSummaryCycleSlice {
  cycleNumber: number;
  /** Sum of `puzzlesAttempted` across sessions in this cycle (includes skips). */
  totalExercisesCompletedInCycle: number;
  /** Sum of `activeTimeMs` across those sessions (matches training set detail aggregation). */
  totalActiveTimeMsInCycle: number;
  /** Puzzles advanced in the current cycle run (Woodpecker line position; not “solved” count). */
  nextExerciseIndex: number;
  /** Total puzzles in this cycle (from active cycle run). */
  totalExercises: number;
}

export interface SessionSummaryPreviousCycle {
  cycleNumber: number;
  /** Total active time for the prior completed cycle (session sums). */
  totalActiveTimeMs: number;
}

export interface SessionSummaryData {
  trainingSetName: string;
  /** Completions this session among sessions in the same cycle (1-based, sorted by start). */
  sessionIndexInCycle: number;
  /** Count of sessions (any status) for this cycle run. */
  sessionsInCycleCount: number;
  session: {
    activeTimeMs: number;
    /** Attempts including skips (raw session counter). */
    puzzlesAttempted: number;
    skippedCount: number;
    /** Same as puzzlesAttempted: every exercise processed (incl. skips). */
    exercisesCompleted: number;
    startedAt: string;
    endedAt: string | undefined;
  };
  cycle: SessionSummaryCycleSlice;
  previousCycle: SessionSummaryPreviousCycle | null;
}

function sumSessionMetrics(sessions: SessionSchema[]) {
  return sessions.reduce(
    (acc, s) => ({
      activeTimeMs: acc.activeTimeMs + s.activeTimeMs,
      exercisesCompleted: acc.exercisesCompleted + s.puzzlesAttempted,
    }),
    { activeTimeMs: 0, exercisesCompleted: 0 }
  );
}

/**
 * Loads safe summary data for a session after it has been marked completed.
 * Returns null if the session row is missing.
 */
export async function getSessionSummaryForSession(
  sessionId: string
): Promise<SessionSummaryData | null> {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  const [trainingSet, cycle, cycleSessions] = await Promise.all([
    getTrainingSetById(session.trainingSetId),
    getCycleRunById(session.cycleRunId),
    getSessionsByCycleRunId(session.cycleRunId),
  ]);

  if (!trainingSet || !cycle) return null;

  const skipIds = [
    ...new Set([session.id, ...cycleSessions.map((s) => s.id)]),
  ];
  const skippedFromAttempts = await getSkippedCountsBySessionIds(skipIds);
  const cycleTotals = sumSessionMetrics(cycleSessions);
  const sessionsOrdered = [...cycleSessions].sort((a, b) =>
    a.startedAt.localeCompare(b.startedAt)
  );
  const sessionOrderIdx = sessionsOrdered.findIndex((s) => s.id === sessionId);
  const sessionIndexInCycle =
    sessionOrderIdx < 0 ? 1 : sessionOrderIdx + 1;

  const allCycles = await getCycleRunsByTrainingSetId(session.trainingSetId);
  const prevNumber = cycle.cycleNumber - 1;
  let previousCycle: SessionSummaryPreviousCycle | null = null;

  if (prevNumber >= 1) {
    const prior = allCycles.find(
      (c) => c.cycleNumber === prevNumber && c.status === "completed"
    );
    if (prior) {
      const priorSessions = await getSessionsByCycleRunId(prior.id);
      previousCycle = {
        cycleNumber: prevNumber,
        totalActiveTimeMs: sumSessionMetrics(priorSessions).activeTimeMs,
      };
    }
  }

  const sessionSkipped = effectiveSkippedCount(session, skippedFromAttempts);
  return {
    trainingSetName: trainingSet.name,
    sessionIndexInCycle,
    sessionsInCycleCount: cycleSessions.length,
    session: {
      activeTimeMs: session.activeTimeMs,
      puzzlesAttempted: session.puzzlesAttempted,
      skippedCount: sessionSkipped,
      exercisesCompleted: session.puzzlesAttempted,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
    },
    cycle: {
      cycleNumber: cycle.cycleNumber,
      totalExercisesCompletedInCycle: cycleTotals.exercisesCompleted,
      totalActiveTimeMsInCycle: cycleTotals.activeTimeMs,
      nextExerciseIndex: cycle.nextExerciseIndex,
      totalExercises: cycle.totalExercises,
    },
    previousCycle,
  };
}
