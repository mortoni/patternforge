/**
 * Aggregates data for the Progress / Reflection page (cycle-oriented: volume, time, sessions).
 * No correctness framing; mistakes are not surfaced here.
 */

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
import { exercisesCompletedExcludingSkips } from "@/lib/training/exercises-completed";

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
  /** Puzzles remaining in the cycle line. */
  exercisesRemaining: number;
  totalTimeMs: number;
  totalExercisesCompleted: number;
  /** Sum of skips across sessions in this cycle. */
  totalSkippedForNowInCycle: number;
  /** Sessions recorded for this cycle run. */
  sessionCount: number;
  /** Mean active time per session (null if no sessions). */
  averageSessionTimeMs: number | null;
  longestSessionMs: number;
  sessionBars: AnalyticsCurrentCycleSessionPoint[];
}

export interface AnalyticsCycleHistoryRow {
  cycleId: string;
  trainingSetId: string;
  cycleNumber: number;
  trainingSetName: string;
  totalTimeMs: number;
  totalExercisesCompleted: number;
  completedAt: string | null;
  sessionCount: number;
}

export interface ProgressPageData {
  currentCycle: AnalyticsCurrentCycle | null;
  cycleHistory: AnalyticsCycleHistoryRow[];
}

/** @deprecated Use `ProgressPageData` */
export type AnalyticsPageData = ProgressPageData;

/**
 * Loads Progress (active cycle) and Reflection (completed cycles) data for `/app/progress`.
 */
export async function getProgressPageData(): Promise<ProgressPageData> {
  const [activeCycles, completedCycles] = await Promise.all([
    getActiveCycleRuns(),
    getCompletedCycleRuns(),
  ]);

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
      (sum, s) => sum + effectiveSkippedCount(s, skippedFromAttempts),
      0
    );
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
    const sessionCount = ordered.length;
    const longestSessionMs =
      sessionCount > 0
        ? Math.max(...ordered.map((s) => s.activeTimeMs))
        : 0;
    const averageSessionTimeMs =
      sessionCount > 0 ? Math.round(totalTimeMs / sessionCount) : null;
    const exercisesRemaining = Math.max(
      0,
      cycle.totalExercises - cycle.nextExerciseIndex
    );

    currentCycle = {
      cycleId: cycle.id,
      trainingSetId: cycle.trainingSetId,
      trainingSetName: set?.name ?? "Training set",
      cycleNumber: cycle.cycleNumber,
      nextExerciseIndex: cycle.nextExerciseIndex,
      totalExercises: cycle.totalExercises,
      exercisesRemaining,
      totalTimeMs,
      totalExercisesCompleted: totalCompleted,
      totalSkippedForNowInCycle,
      sessionCount,
      averageSessionTimeMs,
      longestSessionMs,
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
      trainingSetId: c.trainingSetId,
      cycleNumber: c.cycleNumber,
      trainingSetName: setNames.get(c.trainingSetId) ?? "Unknown",
      totalTimeMs,
      totalExercisesCompleted,
      completedAt: c.completedAt ?? null,
      sessionCount: sess.length,
    };
  });

  return {
    currentCycle,
    cycleHistory,
  };
}

/** @deprecated Use `getProgressPageData` */
export async function getAnalyticsPageData(): Promise<ProgressPageData> {
  return getProgressPageData();
}
