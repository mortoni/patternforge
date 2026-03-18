import { describe, it, expect, afterEach } from "vitest";
import {
  getPuzzleProgress,
  setPuzzleProgress,
  clearPuzzleProgress,
} from "./puzzle-progress-storage";

describe("puzzle-progress-storage", () => {
  const cycleRunId = "cycle-1";
  const exerciseId = "ex-1";

  afterEach(() => {
    clearPuzzleProgress(cycleRunId, exerciseId);
  });

  it("returns null when no progress stored", () => {
    expect(getPuzzleProgress(cycleRunId, exerciseId)).toBeNull();
  });

  it("returns stored progress after set", () => {
    const progress = {
      currentFen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
      currentSolutionIndex: 2,
      accumulatedUserMoves: ["e2e4", "e7e5"],
    };
    setPuzzleProgress(cycleRunId, exerciseId, progress);
    expect(getPuzzleProgress(cycleRunId, exerciseId)).toEqual(progress);
  });

  it("refresh restores board and solution index from sessionStorage", () => {
    const afterAutoPlay = {
      currentFen: "r7/1pp3k1/1b6/p2P1p2/P1N1pn2/2P2PP1/BP3R2/4R2K b - - 0 2",
      currentSolutionIndex: 2,
      accumulatedUserMoves: ["h8h2"],
    };
    setPuzzleProgress(cycleRunId, exerciseId, afterAutoPlay);
    const restored = getPuzzleProgress(cycleRunId, exerciseId);
    expect(restored).not.toBeNull();
    expect(restored!.currentFen).toBe(afterAutoPlay.currentFen);
    expect(restored!.currentSolutionIndex).toBe(2);
    expect(restored!.accumulatedUserMoves).toEqual(["h8h2"]);
  });

  it("clears progress", () => {
    setPuzzleProgress(cycleRunId, exerciseId, {
      currentFen: "somefen",
      currentSolutionIndex: 1,
      accumulatedUserMoves: ["e2e4"],
    });
    clearPuzzleProgress(cycleRunId, exerciseId);
    expect(getPuzzleProgress(cycleRunId, exerciseId)).toBeNull();
  });
});
