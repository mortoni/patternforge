/**
 * Training solver service. Persists attempts, records mistakes, updates session, advances cycle.
 * Supports multi-move puzzles: only persists and advances cycle when puzzle is fully solved or failed.
 */

import { evaluateFirstMove } from "@/services/puzzle-evaluator.service";
import {
  validatePuzzleMove,
  applyCanonicalAutoMoves,
  isPuzzleComplete,
  isUserMoveAtIndex,
} from "@/lib/training/puzzle-line-validator";
import { recordFailure, recordSkip } from "@/services/mistake-review.service";
import {
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
  /** Full solution line (SAN or UCI). If length > 1, multi-move validation is used. */
  solutionMoves?: string[] | string;
  /** Side to move at puzzle start ("w" | "b"). Required when solutionMoves is used. */
  sideToMove?: "w" | "b";
  /** Index of the next expected move in solutionMoves (0 = first move). Used for in-progress multi-move. */
  currentSolutionIndex?: number;
  /** User moves played so far in this puzzle (UCI). Used when failing to record full attempt. */
  accumulatedUserMoves?: string[];
}

export interface SubmitAttemptResult {
  isCorrect: boolean;
  normalizedAttemptedMove: string;
  normalizedExpectedMove: string;
  /** Duration of this attempt in ms (for session activeTimeMs). */
  durationMs: number;
  /** True when this attempt finished the whole Woodpecker cycle. */
  cycleComplete?: boolean;
  /** True when the full solution line was completed (puzzle solved). */
  puzzleComplete?: boolean;
  /** FEN after user move + auto-played opponent moves. Set when correct and more moves remain. */
  nextFen?: string;
  /** Next expected move index. Set when correct and more moves remain. */
  nextSolutionIndex?: number;
  /** Opponent moves auto-played (UCI) for UI animation. */
  autoPlayedMoves?: string[];
}

/**
 * Submit a move attempt. For single-move puzzles (or first move only legacy), persists and advances immediately.
 * For multi-move: validates against solutionMoves[currentSolutionIndex]; only persists and advances on full solve or failure.
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
    solutionMoves: rawSolutionMoves = [],
    sideToMove = "w",
    currentSolutionIndex = 0,
    accumulatedUserMoves = [],
  } = params;

  const solutionMoves = Array.isArray(rawSolutionMoves)
    ? rawSolutionMoves
    : typeof rawSolutionMoves === "string"
      ? rawSolutionMoves
          .trim()
          .split(/\s+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const useMultiMove =
    solutionMoves.length > 1 &&
    currentSolutionIndex < solutionMoves.length &&
    isUserMoveAtIndex(sideToMove, currentSolutionIndex);

  const finishedAtMs = Date.now();
  const durationMs = Math.max(0, finishedAtMs - attemptStartedAt);
  const startedAtIso = new Date(attemptStartedAt).toISOString();
  const nowIso = new Date(finishedAtMs).toISOString();

  if (useMultiMove) {
    const validation = validatePuzzleMove({
      fen,
      solutionMoves,
      currentSolutionIndex,
      sideToMove,
      attemptedMoveUci,
    });

    if (!validation.isCorrect) {
      const userMoves = [...accumulatedUserMoves, validation.normalizedAttemptedMove];
      await addExerciseAttempt({
        id: crypto.randomUUID(),
        exerciseId,
        cycleRunId,
        sessionId,
        startedAt: startedAtIso,
        finishedAt: nowIso,
        durationMs,
        result: "incorrect",
        userMoves,
      });
      await recordFailure(exerciseId, trainingSetId);
      await recordAttemptOnSession(sessionId, "incorrect", durationMs);
      const advanceResult = await advanceAfterIncorrect(cycleRunId);
      if (advanceResult.status === "cycle-complete") {
        await completeSession(sessionId);
      }
      return {
        isCorrect: false,
        normalizedAttemptedMove: validation.normalizedAttemptedMove,
        normalizedExpectedMove: validation.normalizedExpectedMove,
        durationMs,
        cycleComplete: advanceResult.status === "cycle-complete",
      };
    }

    const { Chess } = await import("chess.js");
    const chessAfterUser = new Chess(fen);
    const u = validation.normalizedAttemptedMove;
    chessAfterUser.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.length === 5 ? u[4] : undefined });
    const fenAfterUser = chessAfterUser.fen();

    let nextFen = fenAfterUser;
    let nextIndex = validation.nextIndex;
    let autoPlayedMoves: string[] = [];

    if (nextIndex < solutionMoves.length) {
      const auto = applyCanonicalAutoMoves(fenAfterUser, solutionMoves, nextIndex, sideToMove);
      nextFen = auto.newFen;
      nextIndex = auto.nextIndex;
      autoPlayedMoves = auto.movesPlayed;
    }

    if (nextIndex < solutionMoves.length) {
      return {
        isCorrect: true,
        normalizedAttemptedMove: validation.normalizedAttemptedMove,
        normalizedExpectedMove: validation.normalizedExpectedMove,
        durationMs,
        puzzleComplete: false,
        nextFen,
        nextSolutionIndex: nextIndex,
        autoPlayedMoves,
      };
    }

    const allUserMoves = [...accumulatedUserMoves, validation.normalizedAttemptedMove];
    await addExerciseAttempt({
      id: crypto.randomUUID(),
      exerciseId,
      cycleRunId,
      sessionId,
      startedAt: startedAtIso,
      finishedAt: nowIso,
      durationMs,
      result: "correct",
      userMoves: allUserMoves,
    });
    await recordAttemptOnSession(sessionId, "correct", durationMs);
    const advanceResult = await advanceAfterCorrect(cycleRunId);
    if (advanceResult.status === "cycle-complete") {
      await completeSession(sessionId);
    }
    return {
      isCorrect: true,
      normalizedAttemptedMove: validation.normalizedAttemptedMove,
      normalizedExpectedMove: validation.normalizedExpectedMove,
      durationMs,
      puzzleComplete: true,
      cycleComplete: advanceResult.status === "cycle-complete",
    };
  }

  const evaluation = evaluateFirstMove({
    fen,
    expectedFirstMove,
    attemptedMove: attemptedMoveUci,
  });

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
    puzzleComplete: evaluation.isCorrect,
    cycleComplete: advanceResult.status === "cycle-complete",
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
): Promise<{ cycleComplete: boolean }> {
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
  return { cycleComplete: result.status === "cycle-complete" };
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
