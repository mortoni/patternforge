/**
 * Training Set Detail feature service. Composes repository data into detail view model.
 * Phase 6: set detail page, cycle history, actions.
 */

import { getTrainingSetById } from "@/repositories/training-set.repository";
import { countByTrainingSetId } from "@/repositories/exercise.repository";
import {
  getCycleRunsByTrainingSetId,
  getActiveCycleRunForSet,
} from "@/repositories/cycle-run.repository";
import { getSessionsByCycleRunIds } from "@/repositories/session.repository";
import { getActionLabel } from "./training-sets.service";
import type {
  TrainingSetDetailViewModel,
  TrainingSetDetailSet,
  TrainingSetDetailActiveCycle,
  TrainingSetDetailCycleHistoryRow,
  TrainingSetDetailActions,
  DifficultyLabel,
} from "../types";
import type { TrainingSetSchema } from "@/db/schema";
import type { CycleRunSchema } from "@/db/schema";

function mapSetToDetailSet(
  set: TrainingSetSchema,
  exerciseCount: number
): TrainingSetDetailSet {
  return {
    id: set.id,
    name: set.name,
    description: set.description,
    source: set.source,
    difficulty: set.difficulty as DifficultyLabel,
    tags: set.tags ?? [],
    exerciseCount,
    createdAt: set.createdAt,
  };
}

function buildActions(
  hasActive: boolean,
  hasAnyCycle: boolean,
  currentCycleNumber: number | null,
  exerciseCount: number
): TrainingSetDetailActions {
  const primaryActionLabel = getActionLabel(
    hasActive,
    hasAnyCycle,
    currentCycleNumber,
    exerciseCount
  );
  return {
    primaryActionLabel,
    canContinue: hasActive,
    canStartNextCycle: !hasActive && exerciseCount > 0,
  };
}

/**
 * Returns full detail view model for the training set detail page.
 * Returns null if set not found.
 */
export async function getTrainingSetDetail(
  trainingSetId: string
): Promise<TrainingSetDetailViewModel | null> {
  const set = await getTrainingSetById(trainingSetId);
  if (!set) return null;

  const exerciseCount =
    set.exerciseIds?.length ?? (await countByTrainingSetId(trainingSetId));

  const [activeCycle, cycles] = await Promise.all([
    getActiveCycleRunForSet(trainingSetId),
    getCycleRunsByTrainingSetId(trainingSetId),
  ]);

  const cycleRunIds = cycles.map((c) => c.id);
  const allSessions = await getSessionsByCycleRunIds(cycleRunIds);
  const sessionsByCycleRunId = new Map<string, typeof allSessions>();
  for (const s of allSessions) {
    const list = sessionsByCycleRunId.get(s.cycleRunId) ?? [];
    list.push(s);
    sessionsByCycleRunId.set(s.cycleRunId, list);
  }

  const cycleHistory: TrainingSetDetailCycleHistoryRow[] = [];
  let totalTrainingTimeMs = 0;

  for (const cycle of cycles) {
    const sessions = sessionsByCycleRunId.get(cycle.id) ?? [];
    sessions.sort((a, b) => (a.startedAt ?? "").localeCompare(b.startedAt ?? ""));
    const sessionCount = sessions.length;
    const cycleTimeMs = sessions.reduce((sum, s) => sum + s.activeTimeMs, 0);
    totalTrainingTimeMs += cycleTimeMs;

    const cycleTotal = cycle.totalExercises;
    const completionPercentage =
      cycleTotal > 0 ? (cycle.solvedCount / cycleTotal) * 100 : 0;

    cycleHistory.push({
      id: cycle.id,
      cycleNumber: cycle.cycleNumber,
      status: cycle.status,
      solvedCount: cycle.solvedCount,
      totalExercises: cycle.totalExercises,
      completionPercentage: completionPercentage,
      startedAt: cycle.startedAt,
      completedAt: cycle.completedAt,
      totalTimeMs: cycleTimeMs,
      sessionCount,
    });
  }

  // Sort history: most recent first (by startedAt desc, then by completedAt for completed)
  cycleHistory.sort((a, b) => {
    const aEnd = a.completedAt ?? a.startedAt;
    const bEnd = b.completedAt ?? b.startedAt;
    return bEnd.localeCompare(aEnd);
  });

  const activeCycleVm: TrainingSetDetailActiveCycle | null =
    activeCycle != null
      ? {
          id: activeCycle.id,
          cycleNumber: activeCycle.cycleNumber,
          status: "active",
          solvedCount: activeCycle.solvedCount,
          totalExercises: activeCycle.totalExercises,
          completionPercentage:
            activeCycle.totalExercises > 0
              ? (activeCycle.solvedCount / activeCycle.totalExercises) * 100
              : 0,
          startedAt: activeCycle.startedAt,
        }
      : null;

  const hasAnyCycle = cycles.length > 0;
  const currentCycleNumber = activeCycle?.cycleNumber ?? cycles[cycles.length - 1]?.cycleNumber ?? null;

  return {
    trainingSet: mapSetToDetailSet(set, exerciseCount),
    activeCycle: activeCycleVm,
    cycleHistory,
    actions: buildActions(!!activeCycle, hasAnyCycle, currentCycleNumber, exerciseCount),
    totalCompletedCycles: cycles.filter((c: CycleRunSchema) => c.status === "completed").length,
    totalTrainingTimeMs,
  };
}

/**
 * Returns cycle history for a set (same as detail.cycleHistory).
 * Convenience when only history is needed.
 */
export async function getTrainingSetCycleHistory(
  trainingSetId: string
): Promise<TrainingSetDetailViewModel["cycleHistory"]> {
  const detail = await getTrainingSetDetail(trainingSetId);
  return detail?.cycleHistory ?? [];
}

/**
 * Returns a minimal summary for embedding (e.g. cards). Uses same data as detail.
 */
export async function getTrainingSetSummary(
  trainingSetId: string
): Promise<Pick<
  TrainingSetDetailViewModel,
  "trainingSet" | "activeCycle" | "totalCompletedCycles" | "actions" | "totalTrainingTimeMs"
> | null> {
  const detail = await getTrainingSetDetail(trainingSetId);
  if (!detail) return null;
  return {
    trainingSet: detail.trainingSet,
    activeCycle: detail.activeCycle,
    totalCompletedCycles: detail.totalCompletedCycles,
    actions: detail.actions,
    totalTrainingTimeMs: detail.totalTrainingTimeMs,
  };
}
