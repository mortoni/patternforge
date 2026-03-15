/**
 * Loads active training state from Dexie for the Training page.
 * Read-only: composes settings, training set, active cycle, current exercise.
 * Does NOT create or update sessions; the interaction layer (useActiveTraining) does that when entering training.
 */

import { getSettings } from "@/repositories/settings.repository";
import { getTrainingSetById } from "@/repositories/training-set.repository";
import {
  getActiveCycleRunForSet,
  getLatestCycleRunByTrainingSetId,
} from "@/repositories/cycle-run.repository";
import { getExercisesByTrainingSetId } from "@/repositories/exercise.repository";
import { orderExercises } from "@/lib/training/exercise-order";
import type { ActiveTrainingState } from "../types";

/**
 * Resolves the full active training state for the Training page.
 * Uses lastTrainingSetId from settings, then active cycle, then current exercise by nextExerciseIndex.
 */
export async function getActiveTrainingState(): Promise<ActiveTrainingState> {
  const settings = await getSettings();
  const lastTrainingSetId = settings?.lastTrainingSetId;
  if (!lastTrainingSetId) {
    return { status: "no-training-set" };
  }

  const trainingSet = await getTrainingSetById(lastTrainingSetId);
  if (!trainingSet) {
    return { status: "no-training-set" };
  }

  const activeCycle = await getActiveCycleRunForSet(lastTrainingSetId);
  if (!activeCycle) {
    const latest = await getLatestCycleRunByTrainingSetId(lastTrainingSetId);
    if (
      latest?.status === "completed" &&
      latest.nextExerciseIndex >= latest.totalExercises
    ) {
      return {
        status: "cycle-complete",
        trainingSetId: lastTrainingSetId,
        trainingSetName: trainingSet.name,
        cycleNumber: latest.cycleNumber,
        solvedCount: latest.solvedCount,
        totalExercises: latest.totalExercises,
      };
    }
    return {
      status: "no-active-cycle",
      trainingSetId: lastTrainingSetId,
      trainingSetName: trainingSet.name,
    };
  }

  const rawExercises = await getExercisesByTrainingSetId(lastTrainingSetId);
  const orderedExercises = orderExercises(rawExercises);
  const nextIndex = activeCycle.nextExerciseIndex;
  const exercise = orderedExercises[nextIndex];

  if (!exercise) {
    if (nextIndex >= orderedExercises.length) {
      return {
        status: "cycle-complete",
        trainingSetId: lastTrainingSetId,
        trainingSetName: trainingSet.name,
        cycleNumber: activeCycle.cycleNumber,
        solvedCount: activeCycle.solvedCount,
        totalExercises: activeCycle.totalExercises,
      };
    }
    return {
      status: "exercise-not-found",
      trainingSetId: lastTrainingSetId,
      cycleRunId: activeCycle.id,
    };
  }

  const boardOrientation =
    settings?.boardOrientation === "black" ? "black" : "white";

  return {
    status: "ready",
    sessionId: undefined,
    trainingSet: {
      id: trainingSet.id,
      name: trainingSet.name,
      description: trainingSet.description,
    },
    cycleRun: {
      id: activeCycle.id,
      cycleNumber: activeCycle.cycleNumber,
      solvedCount: activeCycle.solvedCount,
      totalExercises: activeCycle.totalExercises,
      nextExerciseIndex: activeCycle.nextExerciseIndex,
      status: "active",
    },
    exercise: {
      id: exercise.id,
      puzzleNumber: exercise.puzzleNumber,
      fen: exercise.fen,
      sideToMove: exercise.sideToMove,
      solutionMoves: exercise.solutionMoves,
      firstMove: exercise.firstMove ?? (exercise.solutionMoves.length > 0 ? exercise.solutionMoves[0] : undefined),
      gameSource: exercise.source,
      difficulty: exercise.difficulty,
    },
    exerciseIndex: nextIndex,
    totalExercises: orderedExercises.length,
    boardOrientation,
  };
}
