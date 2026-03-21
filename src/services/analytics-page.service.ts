/**
 * Aggregates data for the Analytics page (Woodpecker-aligned: volume, time, repetition).
 * Avoids correctness framing; no puzzle-level drilldown here.
 */

import { getRecentCompleted } from "@/repositories/session.repository";
import {
  getActiveCycleRuns,
  getCompletedCycleRuns,
} from "@/repositories/cycle-run.repository";
import {
  getSessionsByCycleRunId,
  getSessionsByCycleRunIds,
} from "@/repositories/session.repository";
import { getSkippedCountsBySessionIds } from "@/repositories/exercise-attempt.repository";
import { effectiveSkippedCount } from "@/lib/training/effective-skipped-count";
import {
  getTrainingSetById,
  getTrainingSetsByIds,
} from "@/repositories/training-set.repository";
import { countActive } from "@/repositories/mistake-entry.repository";
import { exercisesCompletedExcludingSkips } from "@/lib/training/exercises-completed";

export interface AnalyticsLastSession {
  activeTimeMs: number;
  /** Correct + incorrect only; skips excluded. */
  exercisesCompleted: number;
  endedAt: string;
}

export interface AnalyticsCurrentCycleSessionPoint {
  index: number;
  label: string;
  /** Completed volume (excludes skips) for this session. */
  exercises: number;
  timeMs: number;
  endedAt: string;
}

export interface AnalyticsCurrentCycle {
  cycleId: string;
  trainingSetId: string;
  trainingSetName: string;
  cycleNumber: number;
  /** Woodpecker line position in the active cycle. */
  nextExerciseIndex: number;
  totalExercises: number;
  totalTimeMs: number;
  totalExercisesCompleted: number;
  /** Sum of skips across completed sessions in this cycle (session row + attempt-derived). */
  totalSkippedForNowInCycle: number;
  sessionBars: AnalyticsCurrentCycleSessionPoint[];
}

export interface AnalyticsCycleHistoryRow {
  cycleId: string;
  cycleNumber: number;
  trainingSetName: string;
  totalTimeMs: number;
  totalExercisesCompleted: number;
  completedAt: string | null;
}

export interface AnalyticsPageData {
  lastSession: AnalyticsLastSession | null;
  currentCycle: AnalyticsCurrentCycle | null;
  cycleHistory: AnalyticsCycleHistoryRow[];
  /** Active mistakes (not mastered) — appropriate surface for analytics only. */
  mistakesToReview: number;
  longestRecentSessionMs: number | null;
  bestRecentSessionExercises: number | null;
}

/**
 * Loads all sections for `/app/analytics` in one round-trip friendly bundle.
 */
export async function getAnalyticsPageData(): Promise<AnalyticsPageData> {
  const [recentSessions, activeCycles, completedCycles, mistakesToReview] =
    await Promise.all([
      getRecentCompleted(30),
      getActiveCycleRuns(),
      getCompletedCycleRuns(),
      countActive(),
    ]);

  let lastSession: AnalyticsLastSession | null = null;
  if (recentSessions.length >= 1) {
    const cur = recentSessions[0];
    lastSession = {
      activeTimeMs: cur.activeTimeMs,
      exercisesCompleted: exercisesCompletedExcludingSkips(
        cur.puzzlesAttempted,
        cur.skippedCount ?? 0
      ),
      endedAt: cur.endedAt ?? cur.startedAt,
    };
  }

  const window20 = recentSessions.slice(0, 20);
  const longestRecentSessionMs = window20.length
    ? Math.max(...window20.map((s) => s.activeTimeMs))
    : null;
  const bestRecentSessionExercises = window20.length
    ? Math.max(
        ...window20.map((s) =>
          exercisesCompletedExcludingSkips(
            s.puzzlesAttempted,
            s.skippedCount ?? 0
          )
        )
      )
    : null;

  let currentCycle: AnalyticsCurrentCycle | null = null;
  if (activeCycles.length > 0) {
    const cycle = [...activeCycles].sort((a, b) =>
      b.startedAt.localeCompare(a.startedAt)
    )[0];
    const [set, sessions] = await Promise.all([
      getTrainingSetById(cycle.trainingSetId),
      getSessionsByCycleRunId(cycle.id),
    ]);
    const ordered = [...sessions].sort((a, b) =>
      a.startedAt.localeCompare(b.startedAt)
    );
    const skippedFromAttempts = await getSkippedCountsBySessionIds(
      ordered.map((s) => s.id)
    );
    const totalTimeMs = ordered.reduce((sum, s) => sum + s.activeTimeMs, 0);
    const totalCompleted = ordered.reduce(
      (sum, s) =>
        sum +
        exercisesCompletedExcludingSkips(
          s.puzzlesAttempted,
          effectiveSkippedCount(s, skippedFromAttempts)
        ),
      0
    );
    const totalSkippedForNowInCycle = ordered.reduce(
      (sum, s) =>
        sum + effectiveSkippedCount(s, skippedFromAttempts),
      0
    );
    /** Omit completed rows with no work — duplicates from old getOrCreate races looked like extra "sessions". */
    const forChart = ordered.filter(
      (s) =>
        s.status === "active" ||
        s.puzzlesAttempted > 0 ||
        s.activeTimeMs > 0
    );
    const sessionBars: AnalyticsCurrentCycleSessionPoint[] = forChart.map(
      (sess, i) => {
        const skipped = effectiveSkippedCount(sess, skippedFromAttempts);
        return {
          index: i + 1,
          label: String(i + 1),
          exercises: exercisesCompletedExcludingSkips(
            sess.puzzlesAttempted,
            skipped
          ),
          timeMs: sess.activeTimeMs,
          endedAt: sess.endedAt ?? sess.startedAt,
        };
      }
    );
    currentCycle = {
      cycleId: cycle.id,
      trainingSetId: cycle.trainingSetId,
      trainingSetName: set?.name ?? "Training set",
      cycleNumber: cycle.cycleNumber,
      nextExerciseIndex: cycle.nextExerciseIndex,
      totalExercises: cycle.totalExercises,
      totalTimeMs,
      totalExercisesCompleted: totalCompleted,
      totalSkippedForNowInCycle,
      sessionBars,
    };
  }

  const sortedCompleted = [...completedCycles].sort((a, b) =>
    (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
  );
  const historyIds = sortedCompleted.map((c) => c.id);
  const allHistorySessions = await getSessionsByCycleRunIds(historyIds);
  const sessionsByCycle = new Map<string, typeof allHistorySessions>();
  for (const s of allHistorySessions) {
    const list = sessionsByCycle.get(s.cycleRunId) ?? [];
    list.push(s);
    sessionsByCycle.set(s.cycleRunId, list);
  }
  const historySetIds = [...new Set(sortedCompleted.map((c) => c.trainingSetId))];
  const historySets = await getTrainingSetsByIds(historySetIds);
  const setNames = new Map(historySets.map((s) => [s.id, s.name]));

  const cycleHistory: AnalyticsCycleHistoryRow[] = sortedCompleted.map((c) => {
    const sess = sessionsByCycle.get(c.id) ?? [];
    const totalTimeMs = sess.reduce((a, s) => a + s.activeTimeMs, 0);
    const totalExercisesCompleted = sess.reduce(
      (a, s) =>
        a +
        exercisesCompletedExcludingSkips(
          s.puzzlesAttempted,
          s.skippedCount ?? 0
        ),
      0
    );
    return {
      cycleId: c.id,
      cycleNumber: c.cycleNumber,
      trainingSetName: setNames.get(c.trainingSetId) ?? "Unknown",
      totalTimeMs,
      totalExercisesCompleted,
      completedAt: c.completedAt ?? null,
    };
  });

  return {
    lastSession,
    currentCycle,
    cycleHistory,
    mistakesToReview,
    longestRecentSessionMs,
    bestRecentSessionExercises,
  };
}
