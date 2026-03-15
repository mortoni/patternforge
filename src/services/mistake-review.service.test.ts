import { describe, it, expect, vi, beforeEach } from "vitest";
import { recordFailure, recordSkip } from "./mistake-review.service";

const mockGetByTrainingSetAndExercise = vi.fn();
const mockAddMistakeEntry = vi.fn();
const mockUpdateMistakeEntry = vi.fn();

vi.mock("@/repositories/mistake-entry.repository", () => ({
  getByTrainingSetAndExercise: (tid: string, eid: string) =>
    mockGetByTrainingSetAndExercise(tid, eid),
  addMistakeEntry: (data: unknown) => mockAddMistakeEntry(data),
  updateMistakeEntry: (id: string, patch: unknown) =>
    mockUpdateMistakeEntry(id, patch),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("mistake-review.service", () => {
  describe("recordFailure", () => {
    it("creates new entry when none exists for (trainingSetId, exerciseId)", async () => {
      mockGetByTrainingSetAndExercise.mockResolvedValue(undefined);
      mockAddMistakeEntry.mockResolvedValue("new-id");
      await recordFailure("ex-1", "set-1");
      expect(mockGetByTrainingSetAndExercise).toHaveBeenCalledWith("set-1", "ex-1");
      expect(mockAddMistakeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          exerciseId: "ex-1",
          trainingSetId: "set-1",
          failedAttempts: 1,
          solvedReviewCount: 0,
          status: "needs_review",
        })
      );
      expect(mockUpdateMistakeEntry).not.toHaveBeenCalled();
    });

    it("updates existing entry when one exists for same set+exercise (deduplication)", async () => {
      mockGetByTrainingSetAndExercise.mockResolvedValue({
        id: "existing-1",
        exerciseId: "ex-1",
        trainingSetId: "set-1",
        failedAttempts: 2,
        solvedReviewCount: 0,
        status: "needs_review",
        createdAt: "",
      });
      await recordFailure("ex-1", "set-1");
      expect(mockUpdateMistakeEntry).toHaveBeenCalledWith(
        "existing-1",
        expect.objectContaining({
          failedAttempts: 3,
        })
      );
      expect(mockAddMistakeEntry).not.toHaveBeenCalled();
    });

    it("creates separate entry when same exercise fails in different set", async () => {
      mockGetByTrainingSetAndExercise.mockResolvedValue(undefined);
      mockAddMistakeEntry.mockResolvedValue("new-id-2");
      await recordFailure("ex-1", "set-2");
      expect(mockGetByTrainingSetAndExercise).toHaveBeenCalledWith("set-2", "ex-1");
      expect(mockAddMistakeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          exerciseId: "ex-1",
          trainingSetId: "set-2",
        })
      );
    });
  });

  describe("recordSkip", () => {
    it("calls recordFailure so skip uses same set+exercise uniqueness", async () => {
      mockGetByTrainingSetAndExercise.mockResolvedValue(undefined);
      mockAddMistakeEntry.mockResolvedValue("new-id");
      await recordSkip("ex-2", "set-1");
      expect(mockGetByTrainingSetAndExercise).toHaveBeenCalledWith("set-1", "ex-2");
      expect(mockAddMistakeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          exerciseId: "ex-2",
          trainingSetId: "set-1",
        })
      );
    });
  });
});
