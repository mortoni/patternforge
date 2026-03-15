/**
 * Training Sets feature service. Wires repositories for overview, cycle start, continue.
 * Client-side only.
 */

import {
  getAllTrainingSets,
  getTrainingSetById,
} from "@/repositories/training-set.repository";
import { countByTrainingSetId } from "@/repositories/exercise.repository";
import {
  getActiveCycleRunForSet,
  getLatestCycleRunByTrainingSetId,
  getCycleRunsByTrainingSetId,
  addCycleRun,
} from "@/repositories/cycle-run.repository";
import { setLastTrainingSet } from "@/repositories/settings.repository";
import { createId } from "@/lib/ids";
import { toISOString } from "@/lib/dates";
import {
  seedTrainingSetsIfEmpty,
  seedDefaultSettingsIfMissing,
} from "@/db/seed-training-sets";
import type { TrainingSetOverview } from "../types";
import type { ContinueTrainingResult, StartNextCycleResult } from "../types";

/** Exported for unit tests. Empty sets (exerciseCount 0) cannot start a cycle; label reflects that. */
export function getActionLabel(
  hasActive: boolean,
  hasAnyCycle: boolean,
  currentCycleNumber: number | null,
  exerciseCount: number
): TrainingSetOverview["actionLabel"] {
  if (exerciseCount === 0) return "No exercises";
  if (hasActive) return "Continue Training";
  if (!hasAnyCycle || currentCycleNumber == null) return "Start Cycle 1";
  return "Start Next Cycle";
}

/**
 * Seeds sample data only when no training sets exist. Development only.
 * Call on Training Sets page mount. No-op in production.
 */
export async function ensureSeededForDevelopment(): Promise<boolean> {
  if (process.env.NODE_ENV === "production") return false;
  await seedDefaultSettingsIfMissing();
  return seedTrainingSetsIfEmpty();
}

/**
 * Returns UI-ready overview for each training set.
 * Deduplicates by training set id so the same set never appears twice (e.g. after strict mode double-mount or multiple load runs).
 */
export async function getTrainingSetsOverview(): Promise<TrainingSetOverview[]> {
  const sets = await getAllTrainingSets();
  const byId = new Map<string, TrainingSetOverview>();

  for (const set of sets) {
    const exerciseCount =
      set.exerciseIds?.length ??
      (await countByTrainingSetId(set.id));
    const totalExercises = exerciseCount;

    const active = await getActiveCycleRunForSet(set.id);
    const latest = await getLatestCycleRunByTrainingSetId(set.id);
    const runs = await getCycleRunsByTrainingSetId(set.id);
    const hasAnyCycle = runs.length > 0;
    const currentCycle = active ?? latest ?? null;

    const solvedCount = currentCycle?.solvedCount ?? 0;
    const currentCycleNumber = currentCycle?.cycleNumber ?? null;
    const cycleStatus = currentCycle?.status ?? null;

    const completionPercentage =
      totalExercises > 0 ? (solvedCount / totalExercises) * 100 : 0;

    const overview: TrainingSetOverview = {
      trainingSetId: set.id,
      name: set.name,
      description: set.description,
      difficulty: set.difficulty,
      source: set.source,
      tags: set.tags ?? [],
      exerciseCount,
      currentCycleNumber,
      cycleStatus,
      solvedCount,
      totalExercises,
      completionPercentage,
      actionLabel: getActionLabel(
        !!active,
        hasAnyCycle,
        currentCycleNumber,
        exerciseCount
      ),
    };
    byId.set(set.id, overview);
  }

  return Array.from(byId.values());
}

/**
 * Saves lastTrainingSetId and returns route for navigation.
 */
export async function continueTraining(
  trainingSetId: string
): Promise<ContinueTrainingResult> {
  await setLastTrainingSet(trainingSetId);
  return { success: true, route: "/app/training" };
}

/**
 * Creates a new cycle if needed, updates settings, returns result.
 * Blocks cycle creation for empty sets (0 exercises).
 */
export async function startNextCycle(
  trainingSetId: string
): Promise<StartNextCycleResult> {
  const set = await getTrainingSetById(trainingSetId);
  if (!set) throw new Error("Training set not found");

  const exerciseCount =
    set.exerciseIds?.length ?? (await countByTrainingSetId(trainingSetId));
  if (exerciseCount === 0) {
    throw new Error("Cannot start cycle: training set has no exercises");
  }

  const totalExercises = exerciseCount;

  const runs = await getCycleRunsByTrainingSetId(trainingSetId);
  const nextCycleNumber =
    runs.length === 0 ? 1 : Math.max(...runs.map((r) => r.cycleNumber)) + 1;

  const now = toISOString(new Date());
  const cycleRun = {
    id: createId(),
    trainingSetId,
    cycleNumber: nextCycleNumber,
    status: "active" as const,
    startedAt: now,
    totalTimeMs: 0,
    solvedCount: 0,
    totalExercises,
    nextExerciseIndex: 0,
  };
  await addCycleRun(cycleRun);
  await setLastTrainingSet(trainingSetId);

  return {
    success: true,
    cycleRunId: cycleRun.id,
    route: "/app/training",
  };
}
