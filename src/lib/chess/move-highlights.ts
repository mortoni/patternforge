/**
 * Helpers for board move highlighting. UCI format: "e2e4" or "e7e8q".
 */

/**
 * Returns [fromSquare, toSquare] for a UCI move, or null if invalid.
 * Used to highlight the correct (or attempted) move on the board.
 */
export function getSquaresFromUci(uci: string): [string, string] | null {
  const t = uci.trim().toLowerCase();
  if (t.length >= 4 && /^[a-h][1-8][a-h][1-8]/.test(t)) {
    return [t.slice(0, 2), t.slice(2, 4)];
  }
  return null;
}

/**
 * Returns square ids to highlight for a move (origin and destination).
 * Use for correct-move highlight; optionally use a second call for attempted move.
 */
export function getHighlightedSquaresFromMove(uci: string): string[] {
  const pair = getSquaresFromUci(uci);
  return pair ? [pair[0], pair[1]] : [];
}

/** Arrow representation for board library (startSquare, endSquare, color). */
export interface MoveArrow {
  startSquare: string;
  endSquare: string;
  color: string;
}

const DEFAULT_ARROW_COLOR = "rgba(34, 197, 94, 0.75)";

/**
 * Returns an arrow object for the correct move (for incorrect-answer teaching).
 * Use when puzzle state is incorrect to draw the correct move on the board.
 */
export function getArrowFromUci(uci: string, color?: string): MoveArrow | null {
  const pair = getSquaresFromUci(uci);
  if (!pair) return null;
  return {
    startSquare: pair[0],
    endSquare: pair[1],
    color: color ?? DEFAULT_ARROW_COLOR,
  };
}
