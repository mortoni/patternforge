import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitAttempt, skipPuzzle, goToNextPuzzle } from "./training-solver.service";

const mockAddExerciseAttempt = vi.fn();
const mockRecordFailure = vi.fn();
const mockRecordSkip = vi.fn();
const mockRecordAttemptOnSession = vi.fn();
const mockCompleteSession = vi.fn();
const mockAdvanceAfterCorrect = vi.fn();
const mockAdvanceAfterIncorrect = vi.fn();
const mockAdvanceAfterSkip = vi.fn();

vi.mock("@/services/puzzle-evaluator.service", () => ({
  evaluateFirstMove: (params: { expectedFirstMove: string; attemptedMove: string }) => ({
    isCorrect: params.attemptedMove === params.expectedFirstMove,
    normalizedAttemptedMove: params.attemptedMove,
    normalizedExpectedMove: params.expectedFirstMove,
  }),
}));
vi.mock("@/repositories/exercise-attempt.repository", () => ({
  addExerciseAttempt: (data: unknown) => {
    mockAddExerciseAttempt(data);
    return Promise.resolve("attempt-id");
  },
}));
vi.mock("@/services/mistake-review.service", () => ({
  recordFailure: (...args: unknown[]) => mockRecordFailure(...args),
  recordSkip: (...args: unknown[]) => mockRecordSkip(...args),
}));
vi.mock("@/services/training-session.service", () => ({
  recordAttemptOnSession: (...args: unknown[]) => mockRecordAttemptOnSession(...args),
  completeSession: (...args: unknown[]) => mockCompleteSession(...args),
}));
vi.mock("@/services/cycle-progress.service", () => ({
  advanceAfterCorrect: (...args: unknown[]) => mockAdvanceAfterCorrect(...args),
  advanceAfterIncorrect: (...args: unknown[]) => mockAdvanceAfterIncorrect(...args),
  advanceAfterSkip: (...args: unknown[]) => mockAdvanceAfterSkip(...args),
}));

const mockValidatePuzzleMove = vi.fn();
const mockApplyCanonicalAutoMoves = vi.fn();
const mockIsUserMoveAtIndex = vi.fn();
vi.mock("@/lib/training/puzzle-line-validator", () => ({
  validatePuzzleMove: (...args: unknown[]) => mockValidatePuzzleMove(...args),
  applyCanonicalAutoMoves: (...args: unknown[]) => mockApplyCanonicalAutoMoves(...args),
  isPuzzleComplete: (moves: string[], idx: number) => idx >= moves.length,
  isUserMoveAtIndex: (...args: unknown[]) => mockIsUserMoveAtIndex(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockIsUserMoveAtIndex.mockImplementation((_side: string, index: number) => index % 2 === 0);
});

describe("training-solver.service", () => {
  describe("submitAttempt", () => {
    it("persists correct attempt, records session, advances cycle immediately", async () => {
      mockAdvanceAfterCorrect.mockResolvedValue({
        status: "advanced",
        nextExerciseIndex: 1,
        solvedCount: 1,
        totalExercises: 5,
      });
      const startedAt = 1000000000000;
      vi.setSystemTime(startedAt + 5000);
      const result = await submitAttempt({
        exerciseId: "ex-1",
        cycleRunId: "c1",
        trainingSetId: "set-1",
        sessionId: "s1",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        expectedFirstMove: "e2e4",
        attemptedMoveUci: "e2e4",
        attemptStartedAt: startedAt,
      });
      vi.useRealTimers();
      expect(result.isCorrect).toBe(true);
      expect(result.durationMs).toBe(5000);
      expect(mockAddExerciseAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          exerciseId: "ex-1",
          cycleRunId: "c1",
          sessionId: "s1",
          result: "correct",
          userMoves: ["e2e4"],
          durationMs: 5000,
        })
      );
      expect(mockRecordFailure).not.toHaveBeenCalled();
      expect(mockRecordAttemptOnSession).toHaveBeenCalledWith("s1", "correct", 5000);
      expect(mockAdvanceAfterCorrect).toHaveBeenCalledWith("c1");
      expect(mockAdvanceAfterIncorrect).not.toHaveBeenCalled();
      expect(mockCompleteSession).not.toHaveBeenCalled();
    });

    it("persists incorrect attempt, records mistake, advances cycle immediately", async () => {
      mockAdvanceAfterIncorrect.mockResolvedValue({
        status: "advanced",
        nextExerciseIndex: 1,
        solvedCount: 0,
        totalExercises: 5,
      });
      const startedAt = 1000000000000;
      vi.setSystemTime(startedAt + 100);
      const result = await submitAttempt({
        exerciseId: "ex-1",
        cycleRunId: "c1",
        trainingSetId: "set-1",
        sessionId: "s1",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        expectedFirstMove: "e2e4",
        attemptedMoveUci: "e2e3",
        attemptStartedAt: startedAt,
      });
      vi.useRealTimers();
      expect(result.isCorrect).toBe(false);
      expect(mockAddExerciseAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          result: "incorrect",
          sessionId: "s1",
          userMoves: ["e2e3"],
          durationMs: 100,
        })
      );
      expect(mockRecordFailure).toHaveBeenCalledWith("ex-1", "set-1");
      expect(mockRecordAttemptOnSession).toHaveBeenCalledWith("s1", "incorrect", 100);
      expect(mockAdvanceAfterIncorrect).toHaveBeenCalledWith("c1");
      expect(mockAdvanceAfterCorrect).not.toHaveBeenCalled();
      expect(mockCompleteSession).not.toHaveBeenCalled();
    });

    it("completes session when correct resolution advances to cycle-complete", async () => {
      mockAdvanceAfterCorrect.mockResolvedValue({
        status: "cycle-complete",
        nextExerciseIndex: 5,
        solvedCount: 5,
        totalExercises: 5,
      });
      const startedAt = 1000000000000;
      vi.setSystemTime(startedAt + 500);
      await submitAttempt({
        exerciseId: "ex-1",
        cycleRunId: "c1",
        trainingSetId: "set-1",
        sessionId: "s1",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        expectedFirstMove: "e2e4",
        attemptedMoveUci: "e2e4",
        attemptStartedAt: startedAt,
      });
      vi.useRealTimers();
      expect(mockCompleteSession).toHaveBeenCalledWith("s1");
    });

    it("one-move puzzle marks solved immediately after correct move", async () => {
      mockAdvanceAfterCorrect.mockResolvedValue({ status: "advanced", nextExerciseIndex: 1, solvedCount: 1, totalExercises: 5 });
      const result = await submitAttempt({
        exerciseId: "ex-1",
        cycleRunId: "c1",
        trainingSetId: "set-1",
        sessionId: "s1",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        expectedFirstMove: "e2e4",
        attemptedMoveUci: "e2e4",
        attemptStartedAt: Date.now() - 1000,
      });
      expect(result.isCorrect).toBe(true);
      expect(result.puzzleComplete).toBe(true);
      expect(mockAddExerciseAttempt).toHaveBeenCalledTimes(1);
    });

    it("multi-move puzzle does NOT persist or advance after first correct move", async () => {
      mockValidatePuzzleMove.mockReturnValue({
        isCorrect: true,
        normalizedAttemptedMove: "e2e4",
        normalizedExpectedMove: "e2e4",
        nextIndex: 1,
      });
      mockApplyCanonicalAutoMoves.mockReturnValue({
        newFen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
        nextIndex: 2,
        movesPlayed: ["e7e5"],
      });
      const result = await submitAttempt({
        exerciseId: "ex-1",
        cycleRunId: "c1",
        trainingSetId: "set-1",
        sessionId: "s1",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        expectedFirstMove: "e2e4",
        attemptedMoveUci: "e2e4",
        attemptStartedAt: Date.now() - 500,
        solutionMoves: ["e4", "e5", "Nf3"],
        sideToMove: "w",
        currentSolutionIndex: 0,
        accumulatedUserMoves: [],
      });
      expect(result.isCorrect).toBe(true);
      expect(result.puzzleComplete).toBe(false);
      expect(result.nextFen).toBeDefined();
      expect(result.nextSolutionIndex).toBe(2);
      expect(result.autoPlayedMoves).toEqual(["e7e5"]);
      expect(mockAddExerciseAttempt).not.toHaveBeenCalled();
      expect(mockRecordAttemptOnSession).not.toHaveBeenCalled();
      expect(mockAdvanceAfterCorrect).not.toHaveBeenCalled();
    });

    it("normalizes solutionMoves from string to array (space-separated)", async () => {
      mockValidatePuzzleMove.mockReturnValue({
        isCorrect: true,
        normalizedAttemptedMove: "e2e4",
        normalizedExpectedMove: "e2e4",
        nextIndex: 1,
      });
      mockApplyCanonicalAutoMoves.mockReturnValue({
        newFen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
        nextIndex: 2,
        movesPlayed: ["e7e5"],
      });
      const result = await submitAttempt({
        exerciseId: "ex-1",
        cycleRunId: "c1",
        trainingSetId: "set-1",
        sessionId: "s1",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        expectedFirstMove: "e2e4",
        attemptedMoveUci: "e2e4",
        attemptStartedAt: Date.now() - 500,
        solutionMoves: "e4 e5 Nf3" as unknown as string[],
        sideToMove: "w",
        currentSolutionIndex: 0,
        accumulatedUserMoves: [],
      });
      expect(result.isCorrect).toBe(true);
      expect(result.puzzleComplete).toBe(false);
      expect(mockValidatePuzzleMove).toHaveBeenCalledWith(
        expect.objectContaining({ solutionMoves: ["e4", "e5", "Nf3"] })
      );
    });

    it("multi-move puzzle wrong second user move fails and persists", async () => {
      mockValidatePuzzleMove.mockReturnValue({
        isCorrect: false,
        normalizedAttemptedMove: "g1e3",
        normalizedExpectedMove: "g1f3",
        nextIndex: 2,
      });
      const result = await submitAttempt({
        exerciseId: "ex-1",
        cycleRunId: "c1",
        trainingSetId: "set-1",
        sessionId: "s1",
        fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
        expectedFirstMove: "e2e4",
        attemptedMoveUci: "g1e3",
        attemptStartedAt: Date.now() - 200,
        solutionMoves: ["e4", "e5", "Nf3"],
        sideToMove: "w",
        currentSolutionIndex: 2,
        accumulatedUserMoves: ["e2e4"],
      });
      expect(result.isCorrect).toBe(false);
      expect(mockAddExerciseAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          result: "incorrect",
          userMoves: ["e2e4", "g1e3"],
        })
      );
      expect(mockRecordFailure).toHaveBeenCalledWith("ex-1", "set-1");
      expect(mockAdvanceAfterIncorrect).toHaveBeenCalled();
    });
  });

  describe("skipPuzzle", () => {
    it("persists skipped attempt with durationMs, records skip, records session with duration, advances cycle", async () => {
      mockAdvanceAfterSkip.mockResolvedValue({
        status: "advanced",
        nextExerciseIndex: 1,
        solvedCount: 0,
        totalExercises: 5,
      });
      const startedAt = 1000000000000;
      vi.setSystemTime(startedAt + 3000);
      await skipPuzzle("ex-1", "c1", "set-1", "s1", startedAt);
      vi.useRealTimers();
      expect(mockAddExerciseAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          exerciseId: "ex-1",
          sessionId: "s1",
          result: "skipped",
          userMoves: [],
          durationMs: 3000,
        })
      );
      expect(mockRecordSkip).toHaveBeenCalledWith("ex-1", "set-1");
      expect(mockRecordAttemptOnSession).toHaveBeenCalledWith("s1", "skipped", 3000);
      expect(mockAdvanceAfterSkip).toHaveBeenCalledWith("c1");
      expect(mockCompleteSession).not.toHaveBeenCalled();
    });

    it("completes session when skip advances to cycle-complete", async () => {
      mockAdvanceAfterSkip.mockResolvedValue({
        status: "cycle-complete",
        nextExerciseIndex: 5,
        solvedCount: 0,
        totalExercises: 5,
      });
      await skipPuzzle("ex-1", "c1", "set-1", "s1", Date.now());
      expect(mockCompleteSession).toHaveBeenCalledWith("s1");
    });
  });

  describe("goToNextPuzzle", () => {
    it("records attempt on session with durationMs and advances after correct", async () => {
      mockAdvanceAfterCorrect.mockResolvedValue({
        status: "advanced",
        nextExerciseIndex: 1,
        solvedCount: 1,
        totalExercises: 5,
      });
      const result = await goToNextPuzzle("c1", true, "s1", 4200);
      expect(mockRecordAttemptOnSession).toHaveBeenCalledWith("s1", "correct", 4200);
      expect(mockAdvanceAfterCorrect).toHaveBeenCalledWith("c1");
      expect(mockAdvanceAfterIncorrect).not.toHaveBeenCalled();
      expect(result.status).toBe("advanced");
    });

    it("records attempt on session and advances after incorrect", async () => {
      mockAdvanceAfterIncorrect.mockResolvedValue({
        status: "advanced",
        nextExerciseIndex: 1,
        solvedCount: 0,
        totalExercises: 5,
      });
      const result = await goToNextPuzzle("c1", false, "s1", 1000);
      expect(mockRecordAttemptOnSession).toHaveBeenCalledWith("s1", "incorrect", 1000);
      expect(mockAdvanceAfterIncorrect).toHaveBeenCalledWith("c1");
      expect(mockAdvanceAfterCorrect).not.toHaveBeenCalled();
      expect(result.status).toBe("advanced");
    });

    it("completes session when advance returns cycle-complete", async () => {
      mockAdvanceAfterCorrect.mockResolvedValue({
        status: "cycle-complete",
        nextExerciseIndex: 5,
        solvedCount: 5,
        totalExercises: 5,
      });
      await goToNextPuzzle("c1", true, "s1", 0);
      expect(mockCompleteSession).toHaveBeenCalledWith("s1");
    });
  });
});
