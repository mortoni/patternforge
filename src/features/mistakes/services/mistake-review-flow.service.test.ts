import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getActiveMistakes,
  getMistakeReviewState,
  submitReviewAttempt,
  skipReviewAttempt,
  getMistakeSummary,
} from "./mistake-review-flow.service";

const mockRepoGetActiveMistakes = vi.fn();
const mockGetMistakeById = vi.fn();
const mockGetSummaryCounts = vi.fn();
const mockUpdateMistakeEntry = vi.fn();
const mockGetExerciseById = vi.fn();
const mockGetTrainingSetById = vi.fn();
const mockGetExercisesByIds = vi.fn();
const mockGetTrainingSetsByIds = vi.fn();
const mockGetSettings = vi.fn();
const mockEvaluateFirstMove = vi.fn();

vi.mock("@/repositories/mistake-entry.repository", () => ({
  getActiveMistakes: () => mockRepoGetActiveMistakes(),
  getMistakeById: (id: string) => mockGetMistakeById(id),
  getSummaryCounts: () => mockGetSummaryCounts(),
  updateMistakeEntry: (id: string, patch: unknown) =>
    mockUpdateMistakeEntry(id, patch),
}));
vi.mock("@/repositories/exercise.repository", () => ({
  getExerciseById: (id: string) => mockGetExerciseById(id),
  getExercisesByIds: (ids: string[]) => mockGetExercisesByIds(ids),
}));
vi.mock("@/repositories/training-set.repository", () => ({
  getTrainingSetById: (id: string) => mockGetTrainingSetById(id),
  getTrainingSetsByIds: (ids: string[]) => mockGetTrainingSetsByIds(ids),
}));
vi.mock("@/repositories/settings.repository", () => ({
  getSettings: () => mockGetSettings(),
}));
vi.mock("@/services/puzzle-evaluator.service", () => ({
  evaluateFirstMove: (params: unknown) => mockEvaluateFirstMove(params),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("mistake-review-flow.service", () => {
  describe("getActiveMistakes", () => {
    it("excludes mastered from active list", async () => {
      mockRepoGetActiveMistakes.mockResolvedValue([
        {
          id: "m1",
          exerciseId: "ex1",
          trainingSetId: "set1",
          status: "needs_review",
          failedAttempts: 1,
          solvedReviewCount: 0,
          createdAt: "",
          lastReviewedAt: "",
        },
      ]);
      mockGetExercisesByIds.mockResolvedValue([
        {
          id: "ex1",
          puzzleNumber: 1,
          source: "Lichess",
          difficulty: "easy",
        },
      ]);
      mockGetTrainingSetsByIds.mockResolvedValue([
        { id: "set1", name: "Easy Set" },
      ]);
      const result = await getActiveMistakes();
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("needs_review");
      expect(mockRepoGetActiveMistakes).toHaveBeenCalled();
    });
  });

  describe("submitReviewAttempt", () => {
    it("correct review progresses needs_review -> solved_once", async () => {
      mockGetMistakeById.mockResolvedValue({
        id: "m1",
        exerciseId: "ex1",
        trainingSetId: "set1",
        status: "needs_review",
        failedAttempts: 1,
        solvedReviewCount: 0,
        createdAt: "",
      });
      mockEvaluateFirstMove.mockReturnValue({
        isCorrect: true,
        normalizedAttemptedMove: "e2e4",
        normalizedExpectedMove: "e2e4",
      });
      const result = await submitReviewAttempt(
        "m1",
        "e2e4",
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "e2e4"
      );
      expect(result.isCorrect).toBe(true);
      expect(result.newStatus).toBe("solved_once");
      expect(mockUpdateMistakeEntry).toHaveBeenCalledWith(
        "m1",
        expect.objectContaining({
          solvedReviewCount: 1,
          status: "solved_once",
        })
      );
    });

    it("correct review progresses solved_once -> solved_twice", async () => {
      mockGetMistakeById.mockResolvedValue({
        id: "m1",
        status: "solved_once",
        solvedReviewCount: 1,
        failedAttempts: 1,
        exerciseId: "ex1",
        trainingSetId: "set1",
        createdAt: "",
      });
      mockEvaluateFirstMove.mockReturnValue({
        isCorrect: true,
        normalizedAttemptedMove: "e2e4",
        normalizedExpectedMove: "e2e4",
      });
      const result = await submitReviewAttempt("m1", "e2e4", "fen", "e2e4");
      expect(result.newStatus).toBe("solved_twice");
      expect(mockUpdateMistakeEntry).toHaveBeenCalledWith(
        "m1",
        expect.objectContaining({
          solvedReviewCount: 2,
          status: "solved_twice",
        })
      );
    });

    it("correct review progresses solved_twice -> mastered", async () => {
      mockGetMistakeById.mockResolvedValue({
        id: "m1",
        status: "solved_twice",
        solvedReviewCount: 2,
        failedAttempts: 1,
        exerciseId: "ex1",
        trainingSetId: "set1",
        createdAt: "",
      });
      mockEvaluateFirstMove.mockReturnValue({
        isCorrect: true,
        normalizedAttemptedMove: "e2e4",
        normalizedExpectedMove: "e2e4",
      });
      const result = await submitReviewAttempt("m1", "e2e4", "fen", "e2e4");
      expect(result.newStatus).toBe("mastered");
      expect(mockUpdateMistakeEntry).toHaveBeenCalledWith(
        "m1",
        expect.objectContaining({
          solvedReviewCount: 3,
          status: "mastered",
        })
      );
    });

    it("incorrect review resets to needs_review and solvedReviewCount 0", async () => {
      mockGetMistakeById.mockResolvedValue({
        id: "m1",
        status: "solved_once",
        solvedReviewCount: 1,
        failedAttempts: 1,
        exerciseId: "ex1",
        trainingSetId: "set1",
        createdAt: "",
      });
      mockEvaluateFirstMove.mockReturnValue({
        isCorrect: false,
        normalizedAttemptedMove: "e2e3",
        normalizedExpectedMove: "e2e4",
      });
      const result = await submitReviewAttempt("m1", "e2e3", "fen", "e2e4");
      expect(result.isCorrect).toBe(false);
      expect(result.newStatus).toBe("needs_review");
      expect(mockUpdateMistakeEntry).toHaveBeenCalledWith(
        "m1",
        expect.objectContaining({
          status: "needs_review",
          solvedReviewCount: 0,
          failedAttempts: 2,
        })
      );
    });
  });

  describe("skipReviewAttempt", () => {
    it("sets status to needs_review and updates lastReviewedAt", async () => {
      await skipReviewAttempt("m1");
      expect(mockUpdateMistakeEntry).toHaveBeenCalledWith(
        "m1",
        expect.objectContaining({
          status: "needs_review",
          lastReviewedAt: expect.any(String),
        })
      );
    });
  });

  describe("getMistakeSummary", () => {
    it("returns summary counts from repo", async () => {
      mockGetSummaryCounts.mockResolvedValue({
        needsReview: 2,
        solvedOnce: 1,
        solvedTwice: 0,
        mastered: 3,
        activeCount: 3,
      });
      const result = await getMistakeSummary();
      expect(result.activeCount).toBe(3);
      expect(result.mastered).toBe(3);
    });
  });
});
