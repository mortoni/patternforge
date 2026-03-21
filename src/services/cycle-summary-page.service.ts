/**
 * Aggregates data for the completed-cycle summary page (`/app/cycle/:id/summary`).
 */

import {
  getCycleRunById,
  getCycleRunsByTrainingSetId,
} from "@/repositories/cycle-run.repository";
import { getTrainingSetById } from "@/repositories/training-set.repository";
import { getSessionsByCycleRunId } from "@/repositories/session.repository";
import {
  getAttemptsByCycleRunId,
  getSkippedCountsBySessionIds,
} from "@/repositories/exercise-attempt.repository";
import { getExercisesByIds } from "@/repositories/exercise.repository";
import { getByTrainingSetAndExercise } from "@/repositories/mistake-entry.repository";
import { effectiveSkippedCount } from "@/lib/training/effective-skipped-count";

export interface CycleSummarySessionRow {
  id: string;
  startedAt: string;
  endedAt: string | null;
  activeTimeMs: number;
  /** All attempts in the session (correct, incorrect, skipped — full line coverage). */
  exercisesProcessed: number;
  /** Skips in this session (subset of processed). */
  skippedCount: number;
  /** Processed minus skips (played through without skipping). */
  playedCount: number;
}

export interface CycleSummaryMistakeRow {
  exerciseId: string;
  puzzleNumber: number | null;
  /** Index label for scanning, e.g. "Puzzle 2". */
  puzzleLabel: string;
  /** Game / event line from exercise source (no commentary — that stays in review). */
  reference: string | null;
  /** Mistake entry id when one exists, for review deep link. */
  mistakeEntryId: string | null;
  firstOccurredAt: string;
}

export interface CycleSummaryViewModel {
  cycleId: string;
  trainingSetId: string;
  trainingSetName: string;
  cycleNumber: number;
  completedAt: string | null;
  totalTimeMs: number;
  sessionCount: number;
  /** Sum of skips across sessions in this cycle. */
  cycleSkippedTotal: number;
  averageSessionTimeMs: number | null;
  sessions: CycleSummarySessionRow[];
  mistakes: CycleSummaryMistakeRow[];
  /** Same set, previous completed cycle by cycle number, if any. */
  previousAttemptTimeMs: number | null;
}

export type CycleSummaryLoadResult =
  | { status: "not_found" }
  | { status: "not_completed"; cycleNumber: number; trainingSetName: string }
  | { status: "ok"; data: CycleSummaryViewModel };

export async function getCycleSummaryPageData(
  cycleId: string
): Promise<CycleSummaryLoadResult> {
  const cycle = await getCycleRunById(cycleId);
  if (!cycle) {
    return { status: "not_found" };
  }
  if (cycle.status !== "completed") {
    const set = await getTrainingSetById(cycle.trainingSetId);
    return {
      status: "not_completed",
      cycleNumber: cycle.cycleNumber,
      trainingSetName: set?.name ?? "Training set",
    };
  }

  const [trainingSet, sessions] = await Promise.all([
    getTrainingSetById(cycle.trainingSetId),
    getSessionsByCycleRunId(cycle.id),
  ]);
  const ordered = [...sessions].sort((a, b) =>
    a.startedAt.localeCompare(b.startedAt)
  );
  const skippedFromAttempts = await getSkippedCountsBySessionIds(
    ordered.map((s) => s.id)
  );

  const sessionRows: CycleSummarySessionRow[] = ordered.map((s) => {
    const skipped = effectiveSkippedCount(s, skippedFromAttempts);
    const processed = s.puzzlesAttempted;
    const played = Math.max(0, processed - skipped);
    return {
      id: s.id,
      startedAt: s.startedAt,
      endedAt: s.endedAt ?? null,
      activeTimeMs: s.activeTimeMs,
      exercisesProcessed: processed,
      skippedCount: skipped,
      playedCount: played,
    };
  });

  const totalTimeMs = ordered.reduce((sum, s) => sum + s.activeTimeMs, 0);
  const sessionCount = ordered.length;
  const averageSessionTimeMs =
    sessionCount > 0 ? Math.round(totalTimeMs / sessionCount) : null;
  const cycleSkippedTotal = sessionRows.reduce(
    (sum, r) => sum + r.skippedCount,
    0
  );

  const attempts = await getAttemptsByCycleRunId(cycle.id);
  const incorrectExerciseIds: string[] = [];
  const firstIncorrectAt = new Map<string, string>();
  for (const a of attempts) {
    if (a.result !== "incorrect") continue;
    if (!firstIncorrectAt.has(a.exerciseId)) {
      firstIncorrectAt.set(a.exerciseId, a.startedAt);
      incorrectExerciseIds.push(a.exerciseId);
    }
  }

  const exercises = await getExercisesByIds(incorrectExerciseIds);
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const setName = trainingSet?.name ?? "Training set";

  const mistakes: CycleSummaryMistakeRow[] = [];
  for (const exerciseId of incorrectExerciseIds) {
    const ex = byId.get(exerciseId);
    const mistakeEntry = await getByTrainingSetAndExercise(
      cycle.trainingSetId,
      exerciseId
    );
    const puzzleLabel =
      ex?.puzzleNumber != null
        ? `Puzzle ${ex.puzzleNumber}`
        : "Exercise";
    const ref = ex?.source?.trim();
    const reference =
      ref != null && ref.length > 0
        ? ref.length > 120
          ? `${ref.slice(0, 117)}…`
          : ref
        : null;

    mistakes.push({
      exerciseId,
      puzzleNumber: ex?.puzzleNumber ?? null,
      puzzleLabel,
      reference,
      mistakeEntryId: mistakeEntry?.id ?? null,
      firstOccurredAt: firstIncorrectAt.get(exerciseId) ?? "",
    });
  }

  let previousAttemptTimeMs: number | null = null;
  if (cycle.cycleNumber > 1) {
    const runs = await getCycleRunsByTrainingSetId(cycle.trainingSetId);
    const prev = runs.find(
      (r) =>
        r.status === "completed" && r.cycleNumber === cycle.cycleNumber - 1
    );
    if (prev) {
      const prevSessions = await getSessionsByCycleRunId(prev.id);
      previousAttemptTimeMs = prevSessions.reduce(
        (sum, s) => sum + s.activeTimeMs,
        0
      );
    }
  }

  return {
    status: "ok",
    data: {
      cycleId: cycle.id,
      trainingSetId: cycle.trainingSetId,
      trainingSetName: setName,
      cycleNumber: cycle.cycleNumber,
      completedAt: cycle.completedAt ?? null,
      totalTimeMs,
      sessionCount,
      cycleSkippedTotal,
      averageSessionTimeMs,
      sessions: sessionRows,
      mistakes,
      previousAttemptTimeMs,
    },
  };
}
