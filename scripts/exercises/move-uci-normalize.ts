/**
 * Replay imported move tokens from a FEN using chess.js, producing true UCI strings.
 *
 * **Import vs machine:** CSV tokens are editorial (`rawMoves` in the contract). This module
 * produces the machine-verified UCI sequence in `moves` with `format: "uci"`.
 *
 * Parsing order per token:
 * - Trim and strip harmless trailing punctuation (does not change stored `rawMoves`).
 * - If the token looks like strict UCI (`e2e4`, `e7e8q`), try that first.
 * - Otherwise try SAN/algebraic with `{ sloppy: true }`.
 *
 * Never throws; collects `normalizationIssues` and sets `normalizationStatus` appropriately.
 */

import { Chess } from "chess.js";
import type {
  ExerciseSolution,
  SolutionNormalizationStatus,
} from "../../src/domain/training/types/exercise-record";

const UCI_LIKE = /^[a-h][1-8][a-h][1-8][qrbn]?$/i;

function moveObjectToUci(m: { from: string; to: string; promotion?: string }): string {
  return `${m.from}${m.to}${m.promotion ?? ""}`;
}

/** Trim and strip trailing sentence punctuation only (safe noise for puzzle CSV). */
export function sanitizeMoveTokenForParse(token: string): string {
  return token.trim().replace(/[.,;:!?…]+$/u, "").trim();
}

/** Apply one UCI string to a mutable {@link Chess} instance (mutates position). */
export function playUciOnChess(chess: Chess, uci: string): ReturnType<Chess["move"]> | null {
  const lower = uci.trim().toLowerCase();
  if (!UCI_LIKE.test(lower)) return null;
  const from = lower.slice(0, 2) as `${string}${string}`;
  const to = lower.slice(2, 4) as `${string}${string}`;
  const promotion = lower.length >= 5 ? (lower[4] as "q" | "r" | "b" | "n") : undefined;
  try {
    return chess.move({ from, to, promotion });
  } catch {
    return null;
  }
}

export interface NormalizeMovesResult {
  uciMoves: string[];
  normalizationStatus: SolutionNormalizationStatus;
  normalizationIssues: string[];
}

/**
 * Convert ordered imported tokens to UCI by replaying from `fen`.
 */
export function normalizeImportedTokensToUci(
  fen: string,
  rawMoves: string[]
): NormalizeMovesResult {
  const issues: string[] = [];

  if (rawMoves.length === 0) {
    return {
      uciMoves: [],
      normalizationStatus: "failed",
      normalizationIssues: ["No raw move tokens to normalize."],
    };
  }

  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    issues.push(`Invalid FEN; cannot normalize moves: ${msg}`);
    return {
      uciMoves: [],
      normalizationStatus: "failed",
      normalizationIssues: issues,
    };
  }

  const uciMoves: string[] = [];

  for (let i = 0; i < rawMoves.length; i++) {
    const tokenRaw = rawMoves[i] ?? "";
    const token = sanitizeMoveTokenForParse(tokenRaw);
    if (token === "") {
      issues.push(`Empty move token at index ${i} after trim/sanitize; stopping normalization.`);
      break;
    }

    let made: ReturnType<Chess["move"]> = null;
    if (UCI_LIKE.test(token)) {
      made = playUciOnChess(chess, token);
    }
    if (made === null) {
      try {
        made = chess.move(token, { sloppy: true });
      } catch {
        made = null;
      }
    }

    if (made === null) {
      issues.push(
        `Could not parse or play token ${i + 1}/${rawMoves.length}: "${tokenRaw.trim()}"`
      );
      break;
    }

    uciMoves.push(moveObjectToUci(made));
  }

  let normalizationStatus: SolutionNormalizationStatus;
  if (uciMoves.length === rawMoves.length) {
    normalizationStatus = "normalized";
  } else if (uciMoves.length > 0) {
    normalizationStatus = "partial";
  } else {
    normalizationStatus = "failed";
  }

  return {
    uciMoves,
    normalizationStatus,
    normalizationIssues: issues,
  };
}

/**
 * Build {@link ExerciseSolution}: preserves `rawMoves` exactly as imported; fills UCI `moves`
 * and normalization fields from chess.js replay.
 */
export function buildSolutionWithUciNormalization(
  rawMoves: string[],
  fen: string
): ExerciseSolution {
  const { uciMoves, normalizationStatus, normalizationIssues } =
    normalizeImportedTokensToUci(fen, rawMoves);

  return {
    rawMoves: [...rawMoves],
    moves: uciMoves,
    format: "uci",
    normalizationStatus,
    ...(normalizationIssues.length > 0 ? { normalizationIssues } : {}),
  };
}
