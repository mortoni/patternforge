/**
 * Evaluates user moves against puzzle solution.
 * Uses chess.js for validation and UCI for move comparison.
 * All moves are normalized to UCI (e.g. "e2e4", "e7e8q") for consistent comparison.
 */

import { Chess } from "chess.js";

export interface EvaluateFirstMoveParams {
  fen: string;
  expectedFirstMove: string;
  attemptedMove: string;
}

export interface EvaluateFirstMoveResult {
  isCorrect: boolean;
  normalizedAttemptedMove: string;
  normalizedExpectedMove: string;
}

/**
 * Parse UCI string into from, to, promotion.
 * UCI format: "e2e4" or "e7e8q" (promotion). Only accept valid square notation [a-h][1-8].
 */
function parseUci(uci: string): { from: string; to: string; promotion?: string } | null {
  const trimmed = uci.trim().toLowerCase();
  if (trimmed.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(trimmed)) {
    return { from: trimmed.slice(0, 2), to: trimmed.slice(2, 4) };
  }
  if (trimmed.length === 5 && /^[a-h][1-8][a-h][1-8][qnrb]$/.test(trimmed)) {
    return {
      from: trimmed.slice(0, 2),
      to: trimmed.slice(2, 4),
      promotion: trimmed.slice(4, 5),
    };
  }
  return null;
}

/**
 * Build UCI string from chess.js Move-like object.
 */
function toUci(from: string, to: string, promotion?: string): string {
  const p = promotion ? promotion.toLowerCase() : "";
  return `${from}${to}${p}`;
}

/**
 * Normalize a move (SAN or UCI) to UCI using the given FEN.
 * Returns null if the move is illegal.
 */
export function normalizeMoveToUci(fen: string, move: string): string | null {
  try {
    const chess = new Chess(fen);
    const parsed = parseUci(move);
    const made = parsed ? chess.move(parsed) : chess.move(move);
    if (!made) return null;
    const m = made as { from: string; to: string; promotion?: string };
    return toUci(m.from, m.to, m.promotion);
  } catch {
    return null;
  }
}

/**
 * Validate and compare the user's first move to the expected first move.
 * Both are normalized to UCI before comparison.
 * If the attempted move is illegal, returns isCorrect: false with the normalized expected move.
 */
export function evaluateFirstMove(
  params: EvaluateFirstMoveParams
): EvaluateFirstMoveResult {
  const { fen, expectedFirstMove, attemptedMove } = params;

  const normalizedExpected = normalizeMoveToUci(fen, expectedFirstMove);
  if (normalizedExpected == null) {
    return {
      isCorrect: false,
      normalizedAttemptedMove: attemptedMove,
      normalizedExpectedMove: expectedFirstMove,
    };
  }

  let attemptedUci: string | null = null;
  try {
    const chess = new Chess(fen);
    const parsed = parseUci(attemptedMove);
    const made = parsed ? chess.move(parsed) : chess.move(attemptedMove);
    if (made) {
      const m = made as { from: string; to: string; promotion?: string };
      attemptedUci = toUci(m.from, m.to, m.promotion);
    }
  } catch {
    // illegal move
  }

  if (attemptedUci == null) {
    return {
      isCorrect: false,
      normalizedAttemptedMove: attemptedMove,
      normalizedExpectedMove: normalizedExpected,
    };
  }

  return {
    isCorrect: attemptedUci === normalizedExpected,
    normalizedAttemptedMove: attemptedUci,
    normalizedExpectedMove: normalizedExpected,
  };
}
