import { Chess } from "chess.js";

export type SolutionFields = {
  mainLine: string[];
  uci: string[];
  fullLine: Array<{ move: string; uci: string }>;
};

export function tryApplySanMove(chess: Chess, san: string) {
  try {
    const strict = chess.move(san);
    if (strict) return strict;
  } catch {
    // Fallback below.
  }
  try {
    return (
      chess as unknown as { move: (m: string, opts?: unknown) => ReturnType<Chess["move"]> }
    ).move(san, { sloppy: true });
  } catch {
    return null;
  }
}

export function replayMainLine(fen: string, mainLine: string[]): boolean {
  try {
    const chess = new Chess(fen);
    for (const san of mainLine) {
      if (!tryApplySanMove(chess, san)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function buildSolutionFromMainLine(fen: string, mainLine: string[]): SolutionFields | null {
  try {
    const chess = new Chess(fen);
    const uci: string[] = [];
    const fullLine: SolutionFields["fullLine"] = [];

    for (const san of mainLine) {
      const move = tryApplySanMove(chess, san);
      if (!move) return null;
      const moveUci = `${move.from}${move.to}${move.promotion ?? ""}`.toLowerCase();
      uci.push(moveUci);
      fullLine.push({ move: san, uci: moveUci });
    }

    return { mainLine, uci, fullLine };
  } catch {
    return null;
  }
}

export function inferPrefixMove(
  fen: string,
  sideToMove: "w" | "b",
  opponentSan: string
): string | null {
  try {
    const chess = new Chess(fen);
    if (chess.turn() !== sideToMove) return null;

    const legalSans = chess.moves();
    for (const candidate of legalSans) {
      const trial = new Chess(fen);
      if (!tryApplySanMove(trial, candidate)) continue;
      if (tryApplySanMove(trial, opponentSan)) return candidate;
    }
    return null;
  } catch {
    return null;
  }
}
