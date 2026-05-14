/**
 * Shared chess.js helpers for the training board (Chessground + solver hooks).
 */

import { Chess, type Move, type Square } from "chess.js";
import type { Dests, Key } from "chessground/types";

export type TrainingSquare = string;

export function parseUci(
  uci: string
): { from: string; to: string; promotion?: string } | null {
  const t = uci.trim().toLowerCase();
  if (t.length === 4) return { from: t.slice(0, 2), to: t.slice(2, 4) };
  if (t.length === 5 && /^[a-h][1-8][a-h][1-8][qnrb]$/.test(t)) {
    return { from: t.slice(0, 2), to: t.slice(2, 4), promotion: t[4] };
  }
  return null;
}

/** Full legal destinations map for Chessground `movable.dests`. */
export function buildLegalDests(fen: string): Dests {
  const dests: Dests = new Map();
  try {
    const chess = new Chess(fen);
    const verbose = chess.moves({ verbose: true });
    for (const m of verbose) {
      const list = dests.get(m.from as Key) ?? [];
      if (!list.includes(m.to as Key)) list.push(m.to as Key);
      dests.set(m.from as Key, list);
    }
  } catch {
    /* invalid FEN */
  }
  return dests;
}

/**
 * Pick the chess.js move for orig→dest. Defaults promotion to queen when ambiguous.
 */
export function pickVerboseMove(
  fen: string,
  orig: TrainingSquare,
  dest: TrainingSquare
): Move | null {
  try {
    const chess = new Chess(fen);
    const candidates = chess
      .moves({ square: orig as Square, verbose: true })
      .filter((m) => m.to === dest);
    if (candidates.length === 0) return null;
    const queenPromo = candidates.find((m) => m.promotion === "q");
    return queenPromo ?? candidates[0];
  } catch {
    return null;
  }
}

export function uciFromMove(m: Pick<Move, "from" | "to" | "promotion">): string {
  return m.promotion ? `${m.from}${m.to}${m.promotion}` : `${m.from}${m.to}`;
}

export function newFenAfterVerbose(fen: string, move: Move): string | null {
  try {
    const c = new Chess(fen);
    const made = c.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });
    if (!made) return null;
    return c.fen();
  } catch {
    return null;
  }
}
