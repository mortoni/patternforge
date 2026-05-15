import { Chess } from "chess.js";

/**
 * Marketing `/preview/training`: 1-based `puzzle` param picks a board position
 * (`puzzle=1` → index 0). Wraps if `puzzle` is larger than the list length.
 * Override any mapped position with the `fen` query param (URL-encoded).
 */
export const PREVIEW_EXERCISE_FENS: readonly string[] = [
  /** 1 — start of game after 1. e4 */
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  /** 2 — middlegame (previous static demo) */
  "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPPQ1PPP/R1B1R1K1 w - - 0 10",
  /** 3 — central tension */
  "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4",
  /** 4 — White to move, open e-file pressure */
  "2rqkb1r/ppp2ppp/3p1n2/4p3/2BnP3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 10",
  /** 5 — Black to move, queenside pressure */
  "1q6/2r2pk1/3p2pp/2pP4/2P1PQ2/1P4PP/5BK1/8 b - - 0 41",
  /** 6 — White to move, bishop endgame */
  "8/2k5/8/4K3/5B2/8/8/8 w - - 0 1",
];

export const DEFAULT_PREVIEW_EXERCISE_FEN = PREVIEW_EXERCISE_FENS[1];

export function isLegalFen(fen: string): boolean {
  try {
    new Chess(fen);
    return true;
  } catch {
    return false;
  }
}

/** Returns a board FEN: explicit `fen` wins; else `puzzle` (1-based) maps into {@link PREVIEW_EXERCISE_FENS}. */
export function resolvePreviewTrainingFen(
  puzzleOneBased: number,
  fenFromQuery: string | null
): string {
  if (fenFromQuery != null && fenFromQuery.length > 0) {
    const cleaned = fenFromQuery.trim();
    if (isLegalFen(cleaned)) return cleaned;
  }
  const n = PREVIEW_EXERCISE_FENS.length;
  if (n === 0) return DEFAULT_PREVIEW_EXERCISE_FEN;
  const idx = (Math.max(1, puzzleOneBased) - 1) % n;
  return PREVIEW_EXERCISE_FENS[idx] ?? DEFAULT_PREVIEW_EXERCISE_FEN;
}
