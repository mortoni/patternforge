import { Chess } from "chess.js";

interface ParsedUciMove {
  from: string;
  to: string;
  promotion?: string;
}

function parseUci(move: string): ParsedUciMove | null {
  const trimmed = move.trim().toLowerCase();
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
 * Convert a legal move (UCI or SAN) to SAN using the move context from the given FEN.
 * Returns the original move string when conversion fails.
 */
export function toSanFromFen(fen: string, move: string): string {
  if (move.trim() === "") return move;
  try {
    const chess = new Chess(fen);
    const parsed = parseUci(move);
    const made = parsed ? chess.move(parsed) : chess.move(move);
    if (!made) return move;
    return made.san;
  } catch {
    return move;
  }
}
