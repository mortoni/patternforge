/**
 * Mistake review flow: active list, review state, submit/skip with mastery progression.
 * One MistakeEntry per exerciseId (deduplicated in recordFailure/recordSkip).
 */

import { evaluateFirstMove } from "@/services/puzzle-evaluator.service";
import {
  getActiveMistakes as repoGetActiveMistakes,
  getMistakeById,
  getSummaryCounts,
  updateMistakeEntry,
} from "@/repositories/mistake-entry.repository";
import {
  getExerciseById,
  getExercisesByIds,
} from "@/repositories/exercise.repository";
import {
  getTrainingSetById,
  getTrainingSetsByIds,
} from "@/repositories/training-set.repository";
import { getSettings } from "@/repositories/settings.repository";
import type { MistakeListRow, MistakeSummary, MistakeReviewState } from "../types";
import type { MistakeEntrySchema } from "@/db/schema";

/**
 * Active mistakes = status !== mastered.
 * Returns list with training set name and puzzle label for display.
 */
export async function getActiveMistakes(): Promise<MistakeListRow[]> {
  const mistakes = await repoGetActiveMistakes();
  const exerciseIds = [...new Set(mistakes.map((m) => m.exerciseId))];
  const setIds = [...new Set(mistakes.map((m) => m.trainingSetId))];
  const [exercises, sets] = await Promise.all([
    getExercisesByIds(exerciseIds),
    getTrainingSetsByIds(setIds),
  ]);
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const setNameById = new Map(sets.map((s) => [s.id, s.name]));

  return mistakes.map((m) => {
    const exercise = exerciseById.get(m.exerciseId);
    const puzzleLabel = exercise
      ? [exercise.puzzleNumber, exercise.source].filter(Boolean).join(" · ") ||
        exercise.id
      : m.exerciseId;
    return {
      id: m.id,
      exerciseId: m.exerciseId,
      trainingSetId: m.trainingSetId,
      trainingSetName: setNameById.get(m.trainingSetId) ?? m.trainingSetId,
      puzzleLabel,
      difficulty: exercise?.difficulty ?? "custom",
      failedAttempts: m.failedAttempts,
      status: m.status,
      lastReviewedAt: m.lastReviewedAt ?? null,
    };
  });
}

/**
 * Load mistake, exercise, and training set for the review page.
 */
export async function getMistakeReviewState(
  mistakeId: string
): Promise<MistakeReviewState | null> {
  const mistake = await getMistakeById(mistakeId);
  if (!mistake) return null;
  const [exercise, trainingSet, settings] = await Promise.all([
    getExerciseById(mistake.exerciseId),
    getTrainingSetById(mistake.trainingSetId),
    getSettings(),
  ]);
  if (!exercise || !trainingSet) return null;
  const boardOrientation =
    settings?.boardOrientation === "black" ? "black" : "white";
  const autoBoardOrientation = settings?.autoBoardOrientation ?? false;
  return {
    mistake,
    exercise: {
      id: exercise.id,
      fen: exercise.fen,
      sideToMove: exercise.sideToMove,
      firstMove: exercise.firstMove ?? exercise.solutionMoves[0],
      solutionMoves: exercise.solutionMoves,
      puzzleNumber: exercise.puzzleNumber,
      source: exercise.source,
      comment: exercise.comment,
      difficulty: exercise.difficulty,
    },
    trainingSet: { id: trainingSet.id, name: trainingSet.name },
    boardOrientation,
    autoBoardOrientation
  };
}

export interface SubmitReviewAttemptResult {
  isCorrect: boolean;
  normalizedAttemptedMove: string;
  normalizedExpectedMove: string;
  newStatus: MistakeEntrySchema["status"];
}

/**
 * Submit a review attempt (first-move check).
 * Correct: progress mastery (needs_review -> solved_once -> solved_twice -> mastered).
 * Incorrect: reset to needs_review, solvedReviewCount = 0, failedAttempts += 1.
 */
export async function submitReviewAttempt(
  mistakeId: string,
  attemptedMoveUci: string,
  fen: string,
  expectedFirstMove: string
): Promise<SubmitReviewAttemptResult> {
  const mistake = await getMistakeById(mistakeId);
  if (!mistake) throw new Error("Mistake not found");

  const evaluation = evaluateFirstMove({
    fen,
    expectedFirstMove,
    attemptedMove: attemptedMoveUci,
  });

  const now = new Date().toISOString();
  let newStatus: MistakeEntrySchema["status"] = mistake.status;

  if (evaluation.isCorrect) {
    const nextSolved = mistake.solvedReviewCount + 1;
    if (mistake.status === "needs_review") newStatus = "solved_once";
    else if (mistake.status === "solved_once") newStatus = "solved_twice";
    else if (mistake.status === "solved_twice") newStatus = "mastered";
    await updateMistakeEntry(mistakeId, {
      solvedReviewCount: nextSolved,
      status: newStatus,
      lastReviewedAt: now,
    });
  } else {
    await updateMistakeEntry(mistakeId, {
      status: "needs_review",
      solvedReviewCount: 0,
      failedAttempts: mistake.failedAttempts + 1,
      lastReviewedAt: now,
    });
    newStatus = "needs_review";
  }

  return {
    isCorrect: evaluation.isCorrect,
    normalizedAttemptedMove: evaluation.normalizedAttemptedMove,
    normalizedExpectedMove: evaluation.normalizedExpectedMove,
    newStatus,
  };
}

/**
 * Skip review: status = needs_review, solvedReviewCount unchanged, lastReviewedAt updated.
 */
export async function skipReviewAttempt(mistakeId: string): Promise<void> {
  const now = new Date().toISOString();
  await updateMistakeEntry(mistakeId, {
    status: "needs_review",
    lastReviewedAt: now,
  });
}

export async function getMistakeSummary(): Promise<MistakeSummary> {
  return getSummaryCounts();
}
