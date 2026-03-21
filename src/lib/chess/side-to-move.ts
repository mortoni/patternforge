/** Active player in standard FEN (second field). */
export const CHESS_SIDE_WHITE = "w" as const;
export const CHESS_SIDE_BLACK = "b" as const;

export type ChessSideToMove = typeof CHESS_SIDE_WHITE | typeof CHESS_SIDE_BLACK;

/**
 * Reads the side to move from a FEN string (second field, "w" | "b").
 * Invalid or missing token defaults to white so callers still get a valid side.
 */
export function parseSideToMoveFromFen(fen: string): ChessSideToMove {
  const token = fen.trim().split(/\s+/)[1];
  return token === CHESS_SIDE_BLACK ? CHESS_SIDE_BLACK : CHESS_SIDE_WHITE;
}

export function sideToMoveColorWord(side: ChessSideToMove): "White" | "Black" {
  return side === CHESS_SIDE_WHITE ? "White" : "Black";
}
