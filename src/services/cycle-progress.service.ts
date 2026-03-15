/**
 * Cycle progress service. Advances cycle run and marks completion.
 * Phase 3: correct increments solvedCount; incorrect/skip do not; all advance nextExerciseIndex.
 */

import { getCycleRunById, updateCycleRun } from "@/repositories/cycle-run.repository";

export type AdvanceResultStatus = "advanced" | "cycle-complete";

export interface AdvanceResult {
  status: AdvanceResultStatus;
  nextExerciseIndex: number;
  solvedCount: number;
  totalExercises: number;
}

/**
 * Advance after a correct answer: solvedCount += 1, nextExerciseIndex += 1.
 * If nextExerciseIndex >= totalExercises, mark cycle completed.
 */
export async function advanceAfterCorrect(
  cycleRunId: string
): Promise<AdvanceResult> {
  return advance(cycleRunId, true);
}

/**
 * Advance after incorrect: solvedCount unchanged, nextExerciseIndex += 1.
 */
export async function advanceAfterIncorrect(
  cycleRunId: string
): Promise<AdvanceResult> {
  return advance(cycleRunId, false);
}

/**
 * Advance after skip: solvedCount unchanged, nextExerciseIndex += 1.
 */
export async function advanceAfterSkip(
  cycleRunId: string
): Promise<AdvanceResult> {
  return advance(cycleRunId, false);
}

async function advance(
  cycleRunId: string,
  incrementSolved: boolean
): Promise<AdvanceResult> {
  const cycle = await getCycleRunById(cycleRunId);
  if (!cycle) {
    throw new Error("Cycle run not found");
  }
  const nextIndex = cycle.nextExerciseIndex + 1;
  const totalExercises = cycle.totalExercises;
  const newSolvedCount = incrementSolved
    ? cycle.solvedCount + 1
    : cycle.solvedCount;

  const isComplete = nextIndex >= totalExercises;
  const now = new Date().toISOString();

  if (isComplete) {
    await updateCycleRun(cycleRunId, {
      nextExerciseIndex: nextIndex,
      solvedCount: newSolvedCount,
      status: "completed",
      completedAt: now,
    });
    return {
      status: "cycle-complete",
      nextExerciseIndex: nextIndex,
      solvedCount: newSolvedCount,
      totalExercises,
    };
  }

  await updateCycleRun(cycleRunId, {
    nextExerciseIndex: nextIndex,
    solvedCount: newSolvedCount,
  });
  return {
    status: "advanced",
    nextExerciseIndex: nextIndex,
    solvedCount: newSolvedCount,
    totalExercises,
  };
}
