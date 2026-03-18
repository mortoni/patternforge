import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { normalizeMoveToUci } from "@/services/puzzle-evaluator.service";
import {
  isUserMoveAtIndex,
  getExpectedMoveAtIndex,
  isPuzzleComplete,
  isPuzzleSolved,
  isUsersTurnAtSolutionIndex,
  validatePuzzleMove,
  applyCanonicalAutoMoves,
  advanceThroughSolutionLine,
} from "./puzzle-line-validator";

describe("puzzle-line-validator", () => {
  describe("isUserMoveAtIndex", () => {
    it("index 0 is user when user (black) to move", () => {
      expect(isUserMoveAtIndex("b", 0)).toBe(true);
      expect(isUserMoveAtIndex("w", 0)).toBe(true);
    });
    it("index 1 is opponent", () => {
      expect(isUserMoveAtIndex("b", 1)).toBe(false);
      expect(isUserMoveAtIndex("w", 1)).toBe(false);
    });
    it("index 2 is user again", () => {
      expect(isUserMoveAtIndex("b", 2)).toBe(true);
      expect(isUserMoveAtIndex("w", 2)).toBe(true);
    });
  });

  describe("getExpectedMoveAtIndex", () => {
    it("returns move at index", () => {
      const line = ["Rxh2+", "Kxh2", "Rh8#"];
      expect(getExpectedMoveAtIndex(line, 0)).toBe("Rxh2+");
      expect(getExpectedMoveAtIndex(line, 1)).toBe("Kxh2");
      expect(getExpectedMoveAtIndex(line, 2)).toBe("Rh8#");
      expect(getExpectedMoveAtIndex(line, 3)).toBeUndefined();
    });
  });

  describe("isPuzzleComplete", () => {
    it("true when nextIndex >= length", () => {
      expect(isPuzzleComplete(["a", "b"], 2)).toBe(true);
      expect(isPuzzleComplete(["a", "b"], 3)).toBe(true);
    });
    it("false when nextIndex < length", () => {
      expect(isPuzzleComplete(["a", "b"], 0)).toBe(false);
      expect(isPuzzleComplete(["a", "b"], 1)).toBe(false);
    });
  });

  describe("validatePuzzleMove", () => {
    const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    it("accepts correct first move (e4)", () => {
      const result = validatePuzzleMove({
        fen: startFen,
        solutionMoves: ["e4", "e5", "Nf3"],
        currentSolutionIndex: 0,
        sideToMove: "w",
        attemptedMoveUci: "e2e4",
      });
      expect(result.isCorrect).toBe(true);
      expect(result.nextIndex).toBe(1);
    });

    it("rejects wrong first move", () => {
      const result = validatePuzzleMove({
        fen: startFen,
        solutionMoves: ["e4", "e5", "Nf3"],
        currentSolutionIndex: 0,
        sideToMove: "w",
        attemptedMoveUci: "e2e3",
      });
      expect(result.isCorrect).toBe(false);
      expect(result.nextIndex).toBe(0);
    });
  });

  describe("applyCanonicalAutoMoves", () => {
    it("applies single opponent move and advances index", () => {
      const fenAfterE4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
      const result = applyCanonicalAutoMoves(
        fenAfterE4,
        ["e4", "e5", "Nf3"],
        1,
        "w"
      );
      expect(result.nextIndex).toBe(2);
      expect(result.movesPlayed.length).toBe(1);
      expect(result.movesPlayed[0]).toBe("e7e5");
    });

    it("returns same fen and index when already user turn", () => {
      const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
      const result = applyCanonicalAutoMoves(
        fen,
        ["e4", "e5", "Nf3"],
        2,
        "w"
      );
      expect(result.nextIndex).toBe(2);
      expect(result.movesPlayed.length).toBe(0);
      expect(result.newFen).toBe(fen);
    });
  });

  describe("acceptance: Black to solve Rxh2+ Kxh2 Rh8#", () => {
    const puzzleFen = "r6r/1pp3k1/1b6/p2P1p2/P1N1pn2/2P2PP1/BP5P/4RR1K b - - 0 1";
    const solutionMoves = ["Rxh2+", "Kxh2", "Rh8#"];

    it("index 0 is user (Black), index 1 is opponent (White), index 2 is user", () => {
      expect(isUsersTurnAtSolutionIndex("b", 0)).toBe(true);
      expect(isUsersTurnAtSolutionIndex("b", 1)).toBe(false);
      expect(isUsersTurnAtSolutionIndex("b", 2)).toBe(true);
    });

    it("validates first move Rxh2+ (UCI h8h2) as correct", () => {
      const result = validatePuzzleMove({
        fen: puzzleFen,
        solutionMoves,
        currentSolutionIndex: 0,
        sideToMove: "b",
        attemptedMoveUci: "h8h2",
      });
      expect(result.isCorrect).toBe(true);
      expect(result.nextIndex).toBe(1);
    });

    it("normalize Kxh2 from position after Rxh2+ yields h1h2", () => {
      const chess = new Chess(puzzleFen);
      chess.move({ from: "h8", to: "h2" });
      const fenAfterRxh2 = chess.fen();
      const uci = normalizeMoveToUci(fenAfterRxh2, "Kxh2");
      expect(uci).toBe("h1h2");
    });

    it("auto-plays Kxh2 after user plays Rxh2+, board updates to position after Kxh2", () => {
      const chess = new Chess(puzzleFen);
      chess.move({ from: "h8", to: "h2" });
      const fenAfterRxh2 = chess.fen();
      const result = applyCanonicalAutoMoves(
        fenAfterRxh2,
        solutionMoves,
        1,
        "b"
      );
      expect(result.nextIndex).toBe(2);
      expect(result.movesPlayed.length).toBe(1);
      expect(result.movesPlayed[0]).toBe("h1h2");
      const afterKxh2 = new Chess(result.newFen);
      expect(afterKxh2.turn()).toBe("b");
    });

    it("advanceThroughSolutionLine: first move correct returns nextFen after auto-play, puzzle not complete", () => {
      const result = advanceThroughSolutionLine({
        fen: puzzleFen,
        solutionMoves,
        currentSolutionIndex: 0,
        sideToMove: "b",
        attemptedMoveUci: "h8h2",
      });
      expect(result.validation.isCorrect).toBe(true);
      expect(result.puzzleComplete).toBe(false);
      expect(result.nextIndex).toBe(2);
      expect(result.autoPlayedMoves).toEqual(["h1h2"]);
      const board = new Chess(result.nextFen);
      expect(board.turn()).toBe("b");
    });

    it("wrong move after auto-play fails (user plays wrong second move)", () => {
      const chess = new Chess(puzzleFen);
      chess.move({ from: "h8", to: "h2" });
      chess.move({ from: "h1", to: "h2" });
      const fenBeforeRh8 = chess.fen();
      const result = advanceThroughSolutionLine({
        fen: fenBeforeRh8,
        solutionMoves,
        currentSolutionIndex: 2,
        sideToMove: "b",
        attemptedMoveUci: "a8a1",
      });
      expect(result.validation.isCorrect).toBe(false);
      expect(result.puzzleComplete).toBe(false);
    });

    it("second user move Rh8# completes the puzzle", () => {
      const chess = new Chess(puzzleFen);
      chess.move({ from: "h8", to: "h2" });
      chess.move({ from: "h1", to: "h2" });
      const fenBeforeRh8 = chess.fen();
      const uciRh8 = normalizeMoveToUci(fenBeforeRh8, "Rh8#");
      expect(uciRh8).toBe("a8h8");
      const result = advanceThroughSolutionLine({
        fen: fenBeforeRh8,
        solutionMoves,
        currentSolutionIndex: 2,
        sideToMove: "b",
        attemptedMoveUci: uciRh8!,
      });
      expect(result.validation.isCorrect).toBe(true);
      expect(result.puzzleComplete).toBe(true);
      expect(isPuzzleSolved(solutionMoves, result.nextIndex)).toBe(true);
    });
  });

  describe("isPuzzleSolved", () => {
    it("matches isPuzzleComplete", () => {
      expect(isPuzzleSolved(["a", "b"], 2)).toBe(true);
      expect(isPuzzleSolved(["a", "b"], 1)).toBe(false);
    });
  });
});
