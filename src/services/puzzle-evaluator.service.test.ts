import { describe, it, expect } from "vitest";
import { evaluateFirstMove } from "./puzzle-evaluator.service";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("evaluateFirstMove", () => {
  it("returns isCorrect true when attempted UCI matches expected UCI", () => {
    const result = evaluateFirstMove({
      fen: STARTING_FEN,
      expectedFirstMove: "e2e4",
      attemptedMove: "e2e4",
    });
    expect(result.isCorrect).toBe(true);
    expect(result.normalizedAttemptedMove).toBe("e2e4");
    expect(result.normalizedExpectedMove).toBe("e2e4");
  });

  it("returns isCorrect false when attempted move is wrong", () => {
    const result = evaluateFirstMove({
      fen: STARTING_FEN,
      expectedFirstMove: "e2e4",
      attemptedMove: "e2e3",
    });
    expect(result.isCorrect).toBe(false);
    expect(result.normalizedExpectedMove).toBe("e2e4");
  });

  it("normalizes SAN expected move to UCI and compares", () => {
    const result = evaluateFirstMove({
      fen: STARTING_FEN,
      expectedFirstMove: "e4",
      attemptedMove: "e2e4",
    });
    expect(result.isCorrect).toBe(true);
    expect(result.normalizedExpectedMove).toBe("e2e4");
  });

  it("returns isCorrect false when attempted move is illegal", () => {
    const result = evaluateFirstMove({
      fen: STARTING_FEN,
      expectedFirstMove: "e2e4",
      attemptedMove: "e2e5",
    });
    expect(result.isCorrect).toBe(false);
  });
});
