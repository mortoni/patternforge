/**
 * Multi-move puzzle line validation.
 * solutionMoves is the canonical ordered line (SAN or UCI); move index 0 is the first move from the starting FEN side.
 * User plays moves for their side only; opponent moves are auto-played from the line.
 */

import { Chess } from "chess.js";
import { normalizeMoveToUci } from "@/services/puzzle-evaluator.service";

export type Side = "w" | "b";

/**
 * Whether the move at solutionMoves[index] is played by the user (sideToMove at puzzle start).
 * Index 0 = first move = sideToMove (user); 1 = opponent; 2 = user; ...
 */
export function isUserMoveAtIndex(sideToMove: Side, index: number): boolean {
  return index % 2 === 0;
}

/** Alias for isUserMoveAtIndex. */
export const isUsersTurnAtSolutionIndex = isUserMoveAtIndex;

/**
 * Get the expected move at index (SAN or UCI from solutionMoves).
 */
export function getExpectedMoveAtIndex(
  solutionMoves: string[],
  index: number
): string | undefined {
  return solutionMoves[index];
}

/**
 * Check if the full solution line has been consumed (next index is past the end).
 */
export function isPuzzleComplete(solutionMoves: string[], nextIndex: number): boolean {
  return nextIndex >= solutionMoves.length;
}

/** Alias for isPuzzleComplete. */
export const isPuzzleSolved = isPuzzleComplete;

/** Alias for validatePuzzleMove. */
export const validateUserMoveAgainstSolution = validatePuzzleMove;

/** Alias for applyCanonicalAutoMoves. */
export const applyAutoPlayMoves = applyCanonicalAutoMoves;

export interface ValidatePuzzleMoveParams {
  fen: string;
  solutionMoves: string[];
  currentSolutionIndex: number;
  sideToMove: Side;
  attemptedMoveUci: string;
}

export interface ValidatePuzzleMoveResult {
  isCorrect: boolean;
  normalizedAttemptedMove: string;
  normalizedExpectedMove: string;
  /** If correct, the index after this move (1 + currentSolutionIndex). */
  nextIndex: number;
}

/**
 * Validate the user's move against the expected move at currentSolutionIndex.
 * currentSolutionIndex must point to a user move (isUserMoveAtIndex(sideToMove, currentSolutionIndex) === true).
 */
export function validatePuzzleMove(
  params: ValidatePuzzleMoveParams
): ValidatePuzzleMoveResult {
  const { fen, solutionMoves, currentSolutionIndex, sideToMove, attemptedMoveUci } = params;

  const expectedSan = getExpectedMoveAtIndex(solutionMoves, currentSolutionIndex);
  if (expectedSan == null) {
    return {
      isCorrect: false,
      normalizedAttemptedMove: attemptedMoveUci,
      normalizedExpectedMove: attemptedMoveUci,
      nextIndex: currentSolutionIndex,
    };
  }

  const normalizedExpected = normalizeMoveToUci(fen, expectedSan);
  if (normalizedExpected == null) {
    return {
      isCorrect: false,
      normalizedAttemptedMove: attemptedMoveUci,
      normalizedExpectedMove: expectedSan,
      nextIndex: currentSolutionIndex,
    };
  }

  let attemptedUci: string | null = null;
  try {
    const chess = new Chess(fen);
    const u = attemptedMoveUci.trim().toLowerCase();
    const from = u.slice(0, 2);
    const to = u.slice(2, 4);
    const promotion = u.length === 5 ? u[4] : undefined;
    const move = chess.move({ from, to, promotion });
    if (move) {
      const m = move as { from: string; to: string; promotion?: string };
      attemptedUci = `${m.from}${m.to}${m.promotion ?? ""}`;
    }
  } catch {
    // illegal
  }

  if (attemptedUci == null) {
    return {
      isCorrect: false,
      normalizedAttemptedMove: attemptedMoveUci,
      normalizedExpectedMove: normalizedExpected,
      nextIndex: currentSolutionIndex,
    };
  }

  const isCorrect = attemptedUci === normalizedExpected;
  return {
    isCorrect,
    normalizedAttemptedMove: attemptedUci,
    normalizedExpectedMove: normalizedExpected,
    nextIndex: isCorrect ? currentSolutionIndex + 1 : currentSolutionIndex,
  };
}

export interface AutoPlayResult {
  /** FEN after applying all opponent moves. */
  newFen: string;
  /** Index of the next move to be played (user's move) or solutionMoves.length if line ended. */
  nextIndex: number;
  /** UCI moves that were applied (for animation). */
  movesPlayed: string[];
}

/**
 * From the given FEN and solution index, apply all consecutive opponent moves from the canonical line.
 * Stops when the next move is user's or the line ends.
 */
export function applyCanonicalAutoMoves(
  fen: string,
  solutionMoves: string[],
  fromIndex: number,
  sideToMove: Side
): AutoPlayResult {
  const movesPlayed: string[] = [];
  let currentFen = fen;
  let index = fromIndex;

  while (index < solutionMoves.length && !isUserMoveAtIndex(sideToMove, index)) {
    const san = solutionMoves[index];
    const uci = normalizeMoveToUci(currentFen, san);
    if (uci == null) break;
    try {
      const chess = new Chess(currentFen);
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length === 5 ? uci[4] : undefined;
      const move = chess.move({ from, to, promotion });
      if (!move) break;
      currentFen = chess.fen();
      movesPlayed.push(uci);
      index++;
    } catch {
      break;
    }
  }

  return { newFen: currentFen, nextIndex: index, movesPlayed };
}

export interface AdvanceThroughSolutionLineParams {
  fen: string;
  solutionMoves: string[];
  currentSolutionIndex: number;
  sideToMove: Side;
  attemptedMoveUci: string;
}

export interface AdvanceThroughSolutionLineResult {
  validation: ValidatePuzzleMoveResult;
  /** FEN after user move and any auto-played opponent moves. */
  nextFen: string;
  nextIndex: number;
  autoPlayedMoves: string[];
  puzzleComplete: boolean;
}

/**
 * Validate the user move and, if correct, advance through the solution line by
 * applying the user move then auto-playing all consecutive opponent moves.
 * Use this for a single place to compute next board state and completion.
 */
export function advanceThroughSolutionLine(
  params: AdvanceThroughSolutionLineParams
): AdvanceThroughSolutionLineResult {
  const { fen, solutionMoves, currentSolutionIndex, sideToMove, attemptedMoveUci } = params;
  const validation = validatePuzzleMove({
    fen,
    solutionMoves,
    currentSolutionIndex,
    sideToMove,
    attemptedMoveUci,
  });

  if (!validation.isCorrect) {
    return {
      validation,
      nextFen: fen,
      nextIndex: currentSolutionIndex,
      autoPlayedMoves: [],
      puzzleComplete: false,
    };
  }

  const chess = new Chess(fen);
  const u = validation.normalizedAttemptedMove;
  chess.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.length === 5 ? u[4] : undefined });
  let nextFen = chess.fen();
  let nextIndex = validation.nextIndex;
  const autoPlayedMoves: string[] = [];

  if (nextIndex < solutionMoves.length) {
    const auto = applyCanonicalAutoMoves(nextFen, solutionMoves, nextIndex, sideToMove);
    nextFen = auto.newFen;
    nextIndex = auto.nextIndex;
    autoPlayedMoves.push(...auto.movesPlayed);
  }

  return {
    validation,
    nextFen,
    nextIndex,
    autoPlayedMoves,
    puzzleComplete: nextIndex >= solutionMoves.length,
  };
}
