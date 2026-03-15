/**
 * Analytics service. Aggregates session and attempt data for dashboard and analytics page.
 * Phase 5: timing truth, session summaries, foundational analytics.
 * All calculations are local and repository-driven.
 */

import {
  getRecentCompleted,
  getCompletedSessionsCount,
} from "@/repositories/session.repository";
import {
  getTrainingSetById,
  getTrainingSetsByIds,
} from "@/repositories/training-set.repository";
import { getAllAttempts } from "@/repositories/exercise-attempt.repository";
import { getCompletedCycleRuns, getActiveCycleRuns } from "@/repositories/cycle-run.repository";
import { countActive } from "@/repositories/mistake-entry.repository";

const DEFAULT_RECENT_LIMIT = 10;

export interface DashboardStats {
  totalPuzzlesAttempted: number;
  totalCorrect: number;
  totalSkipped: number;
  overallAccuracy: number;
  totalTrainingTimeMs: number;
  mistakesRemaining: number;
  recentSessions: RecentSessionRow[];
}

export interface RecentSessionRow {
  id: string;
  trainingSetId: string;
  trainingSetName: string;
  endedAt: string;
  puzzlesAttempted: number;
  correctCount: number;
  skippedCount: number;
  accuracy: number;
  activeTimeMs: number;
}

export interface AnalyticsSummary {
  totalSessions: number;
  totalAttempts: number;
  totalCorrect: number;
  totalSkipped: number;
  overallAccuracy: number;
  totalTrainingTimeMs: number;
  mistakesRemaining: number;
}

export interface AccuracySeriesPoint {
  label: string;
  sessionId: string;
  accuracy: number;
  endedAt: string;
}

export interface SessionDurationSeriesPoint {
  label: string;
  sessionId: string;
  activeTimeMs: number;
  endedAt: string;
}

export interface CycleSummary {
  hasActiveCycle: boolean;
  activeSetName: string | null;
  activeCycleNumber: number | null;
  activeSolvedCount: number;
  activeTotalExercises: number;
  completedCyclesCount: number;
  lastCompletedEndedAt: string | null;
}

export interface TrainingVolumeSummary {
  totalSessions: number;
  totalAttempts: number;
  totalSolved: number;
  mistakesRemaining: number;
}

/**
 * Stats for dashboard: totals from attempts, recent sessions with set names.
 */
export async function getDashboardStats(
  recentLimit: number = DEFAULT_RECENT_LIMIT
): Promise<DashboardStats> {
  const [sessions, attempts, mistakesRemaining] = await Promise.all([
    getRecentCompleted(recentLimit),
    getAllAttempts(),
    countActive(),
  ]);

  const totalPuzzlesAttempted = attempts.filter((a) => a.sessionId).length;
  const totalCorrect = attempts.filter(
    (a) => a.sessionId && a.result === "correct"
  ).length;
  const totalSkipped = attempts.filter(
    (a) => a.sessionId && a.result === "skipped"
  ).length;
  const totalTrainingTimeMs = attempts
    .filter((a) => a.sessionId)
    .reduce((sum, a) => sum + (a.durationMs ?? 0), 0);
  const overallAccuracy =
    totalPuzzlesAttempted > 0 ? totalCorrect / totalPuzzlesAttempted : 0;

  const setIds = [...new Set(sessions.map((s) => s.trainingSetId))];
  const sets = await getTrainingSetsByIds(setIds);
  const setNameById = new Map(sets.map((s) => [s.id, s.name]));

  const recentSessions: RecentSessionRow[] = sessions.map((s) => {
    const accuracy =
      s.puzzlesAttempted > 0 ? s.correctCount / s.puzzlesAttempted : 0;
    return {
      id: s.id,
      trainingSetId: s.trainingSetId,
      trainingSetName: setNameById.get(s.trainingSetId) ?? "Unknown",
      endedAt: s.endedAt ?? s.startedAt,
      puzzlesAttempted: s.puzzlesAttempted,
      correctCount: s.correctCount,
      skippedCount: s.skippedCount,
      accuracy,
      activeTimeMs: s.activeTimeMs,
    };
  });

  return {
    totalPuzzlesAttempted,
    totalCorrect,
    totalSkipped,
    overallAccuracy,
    totalTrainingTimeMs,
    mistakesRemaining,
    recentSessions,
  };
}

/**
 * Recent completed sessions for dashboard list.
 */
export async function getRecentSessions(
  limit: number = DEFAULT_RECENT_LIMIT
): Promise<RecentSessionRow[]> {
  const stats = await getDashboardStats(limit);
  return stats.recentSessions;
}

/**
 * Summary for analytics page header cards.
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [attempts, totalSessions, mistakesRemaining] = await Promise.all([
    getAllAttempts(),
    getCompletedSessionsCount(),
    countActive(),
  ]);
  const withSession = attempts.filter((a) => a.sessionId);
  const totalAttempts = withSession.length;
  const totalCorrect = withSession.filter((a) => a.result === "correct").length;
  const totalSkipped = withSession.filter((a) => a.result === "skipped").length;
  const totalTrainingTimeMs = withSession.reduce(
    (sum, a) => sum + (a.durationMs ?? 0),
    0
  );
  const overallAccuracy =
    totalAttempts > 0 ? totalCorrect / totalAttempts : 0;
  return {
    totalSessions,
    totalAttempts,
    totalCorrect,
    totalSkipped,
    overallAccuracy,
    totalTrainingTimeMs,
    mistakesRemaining,
  };
}

/**
 * Accuracy per session for chart (most recent first).
 */
export async function getAccuracySeries(
  limit: number = 20
): Promise<AccuracySeriesPoint[]> {
  const sessions = await getRecentCompleted(limit);
  const setIds = [...new Set(sessions.map((s) => s.trainingSetId))];
  const sets = await getTrainingSetsByIds(setIds);
  const setNameById = new Map(sets.map((s) => [s.id, s.name]));

  return sessions.map((s) => {
    const accuracy =
      s.puzzlesAttempted > 0 ? s.correctCount / s.puzzlesAttempted : 0;
    return {
      label: setNameById.get(s.trainingSetId) ?? `Session ${s.id.slice(0, 8)}`,
      sessionId: s.id,
      accuracy: Math.round(accuracy * 100) / 100,
      endedAt: s.endedAt ?? s.startedAt,
    };
  });
}

/**
 * Duration per session for chart (most recent first).
 */
export async function getSessionDurationSeries(
  limit: number = 20
): Promise<SessionDurationSeriesPoint[]> {
  const sessions = await getRecentCompleted(limit);
  const setIds = [...new Set(sessions.map((s) => s.trainingSetId))];
  const sets = await getTrainingSetsByIds(setIds);
  const setNameById = new Map(sets.map((s) => [s.id, s.name]));

  return sessions.map((s) => ({
    label: setNameById.get(s.trainingSetId) ?? `Session ${s.id.slice(0, 8)}`,
    sessionId: s.id,
    activeTimeMs: s.activeTimeMs,
    endedAt: s.endedAt ?? s.startedAt,
  }));
}

/**
 * Current active cycle if any, plus completed cycle count.
 */
export async function getCycleSummary(): Promise<CycleSummary> {
  const [activeCycles, completedCycles] = await Promise.all([
    getActiveCycleRuns(),
    getCompletedCycleRuns(),
  ]);
  const active = activeCycles[0] ?? null;
  const completed = completedCycles.sort(
    (a, b) =>
      (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
  );
  let activeSetName: string | null = null;
  if (active) {
    const set = await getTrainingSetById(active.trainingSetId);
    activeSetName = set?.name ?? null;
  }
  return {
    hasActiveCycle: !!active,
    activeSetName,
    activeCycleNumber: active?.cycleNumber ?? null,
    activeSolvedCount: active?.solvedCount ?? 0,
    activeTotalExercises: active?.totalExercises ?? 0,
    completedCyclesCount: completed.length,
    lastCompletedEndedAt:
      completed.length > 0 ? completed[0].completedAt ?? null : null,
  };
}

/**
 * Training volume: sessions, attempts, solved, mistakes remaining.
 */
export async function getTrainingVolumeSummary(): Promise<TrainingVolumeSummary> {
  const [totalSessions, attempts, mistakesRemaining] = await Promise.all([
    getCompletedSessionsCount(),
    getAllAttempts(),
    countActive(),
  ]);
  const withSession = attempts.filter((a) => a.sessionId);
  const totalAttempts = withSession.length;
  const totalSolved = withSession.filter((a) => a.result === "correct").length;
  return {
    totalSessions,
    totalAttempts,
    totalSolved,
    mistakesRemaining,
  };
}
