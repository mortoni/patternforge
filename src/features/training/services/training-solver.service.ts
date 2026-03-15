/**
 * Training solver service. Persists attempts, records mistakes, updates session, advances cycle.
 * Phase 3: session and cycle progression wired; cycle completion marks session and cycle complete.
 */

import { evaluateFirstMove } from "@/services/puzzle-evaluator.service";
import { recordFailure, recordSkip } from "@/services/mistake-review.service";
import {
  getOrCreateActiveSession,
  recordAttemptOnSession,
  completeSession,
} from "@/services/training-session.service";
import {
  advanceAfterCorrect,
  advanceAfterIncorrect,
  advanceAfterSkip,
} from "@/services/cycle-progress.service";
import { addExerciseAttempt } from "@/repositories/exercise-attempt.repository";

export interface SubmitAttemptParams {
  exerciseId: string;
  cycleRunId: string;
  trainingSetId: string;
  sessionId: string;
  fen: string;
  expectedFirstMove: string;
  attemptedMoveUci: string;
  /** Timestamp (ms) when puzzle became active; used to compute durationMs. */
  attemptStartedAt: number;
}

export interface SubmitAttemptResult {
  isCorrect: boolean;
  normalizedAttemptedMove: string;
  normalizedExpectedMove: string;
  /** Duration of this attempt in ms (for session activeTimeMs). */
  durationMs: number;
}

/**
 * Evaluate first move, persist attempt, record mistake if incorrect, and advance
 * cycle/session immediately. Refresh after resolution will load the next puzzle.
 * Next Puzzle in the UI only reloads from DB and clears local feedback state.
 */
export async function submitAttempt(
  params: SubmitAttemptParams
): Promise<SubmitAttemptResult> {
  const {
    exerciseId,
    cycleRunId,
    trainingSetId,
    sessionId,
    fen,
    expectedFirstMove,
    attemptedMoveUci,
    attemptStartedAt,
  } = params;
  const evaluation = evaluateFirstMove({
    fen,
    expectedFirstMove,
    attemptedMove: attemptedMoveUci,
  });

  const finishedAtMs = Date.now();
  const startedAtIso = new Date(attemptStartedAt).toISOString();
  const nowIso = new Date(finishedAtMs).toISOString();
  const durationMs = Math.max(0, finishedAtMs - attemptStartedAt);

  await addExerciseAttempt({
    id: crypto.randomUUID(),
    exerciseId,
    cycleRunId,
    sessionId,
    startedAt: startedAtIso,
    finishedAt: nowIso,
    durationMs,
    result: evaluation.isCorrect ? "correct" : "incorrect",
    userMoves: [evaluation.normalizedAttemptedMove],
  });

  if (!evaluation.isCorrect) {
    await recordFailure(exerciseId, trainingSetId);
  }

  await recordAttemptOnSession(
    sessionId,
    evaluation.isCorrect ? "correct" : "incorrect",
    durationMs
  );

  const advanceResult = evaluation.isCorrect
    ? await advanceAfterCorrect(cycleRunId)
    : await advanceAfterIncorrect(cycleRunId);

  if (advanceResult.status === "cycle-complete") {
    await completeSession(sessionId);
  }

  return {
    isCorrect: evaluation.isCorrect,
    normalizedAttemptedMove: evaluation.normalizedAttemptedMove,
    normalizedExpectedMove: evaluation.normalizedExpectedMove,
    durationMs,
  };
}

/**
 * Record skip: persist attempt with timing, record mistake, update session, advance cycle (and complete if at end).
 */
export async function skipPuzzle(
  exerciseId: string,
  cycleRunId: string,
  trainingSetId: string,
  sessionId: string,
  attemptStartedAt: number
): Promise<void> {
  const finishedAtMs = Date.now();
  const startedAtIso = new Date(attemptStartedAt).toISOString();
  const nowIso = new Date(finishedAtMs).toISOString();
  const durationMs = Math.max(0, finishedAtMs - attemptStartedAt);

  await addExerciseAttempt({
    id: crypto.randomUUID(),
    exerciseId,
    cycleRunId,
    sessionId,
    startedAt: startedAtIso,
    finishedAt: nowIso,
    durationMs,
    result: "skipped",
    userMoves: [],
  });
  await recordSkip(exerciseId, trainingSetId);
  await recordAttemptOnSession(sessionId, "skipped", durationMs);

  const result = await advanceAfterSkip(cycleRunId);
  if (result.status === "cycle-complete") {
    await completeSession(sessionId);
  }
}

/**
 * Advance to next puzzle (session + cycle). Used only when progression was not
 * already committed at submit (e.g. legacy). Training page commits progression
 * in submitAttempt and uses reload() on Next Puzzle click.
 */
export async function goToNextPuzzle(
  cycleRunId: string,
  wasCorrect: boolean,
  sessionId: string,
  durationMs: number = 0
): Promise<{ status: "advanced" | "cycle-complete" }> {
  await recordAttemptOnSession(
    sessionId,
    wasCorrect ? "correct" : "incorrect",
    durationMs
  );

  const result = wasCorrect
    ? await advanceAfterCorrect(cycleRunId)
    : await advanceAfterIncorrect(cycleRunId);

  if (result.status === "cycle-complete") {
    await completeSession(sessionId);
  }

  return { status: result.status };
}
