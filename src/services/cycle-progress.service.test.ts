import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  advanceAfterCorrect,
  advanceAfterIncorrect,
  advanceAfterSkip,
} from "./cycle-progress.service";

const mockGetCycleRunById = vi.fn();
const mockUpdateCycleRun = vi.fn();

vi.mock("@/repositories/cycle-run.repository", () => ({
  getCycleRunById: (id: string) => mockGetCycleRunById(id),
  updateCycleRun: (id: string, patch: unknown) => mockUpdateCycleRun(id, patch),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const cycle = {
  id: "c1",
  trainingSetId: "set-1",
  cycleNumber: 1,
  status: "active" as const,
  startedAt: "2025-01-01T00:00:00Z",
  totalTimeMs: 0,
  solvedCount: 2,
  totalExercises: 5,
  nextExerciseIndex: 2,
};

describe("cycle-progress.service", () => {
  describe("advanceAfterCorrect", () => {
    it("increments solvedCount and nextExerciseIndex", async () => {
      mockGetCycleRunById.mockResolvedValue(cycle);
      const result = await advanceAfterCorrect("c1");
      expect(result.status).toBe("advanced");
      expect(result.nextExerciseIndex).toBe(3);
      expect(result.solvedCount).toBe(3);
      expect(result.totalExercises).toBe(5);
      expect(mockUpdateCycleRun).toHaveBeenCalledWith(
        "c1",
        expect.objectContaining({
          nextExerciseIndex: 3,
          solvedCount: 3,
        })
      );
      expect(mockUpdateCycleRun.mock.calls[0][1]).not.toHaveProperty("status");
    });

    it("marks cycle completed when reaching end", async () => {
      mockGetCycleRunById.mockResolvedValue({
        ...cycle,
        nextExerciseIndex: 4,
        solvedCount: 4,
      });
      const result = await advanceAfterCorrect("c1");
      expect(result.status).toBe("cycle-complete");
      expect(result.nextExerciseIndex).toBe(5);
      expect(result.solvedCount).toBe(5);
      expect(mockUpdateCycleRun).toHaveBeenCalledWith(
        "c1",
        expect.objectContaining({
          nextExerciseIndex: 5,
          solvedCount: 5,
          status: "completed",
          completedAt: expect.any(String),
        })
      );
    });
  });

  describe("advanceAfterIncorrect", () => {
    it("increments only nextExerciseIndex, not solvedCount", async () => {
      mockGetCycleRunById.mockResolvedValue(cycle);
      const result = await advanceAfterIncorrect("c1");
      expect(result.status).toBe("advanced");
      expect(result.nextExerciseIndex).toBe(3);
      expect(result.solvedCount).toBe(2);
      expect(mockUpdateCycleRun).toHaveBeenCalledWith(
        "c1",
        expect.objectContaining({
          nextExerciseIndex: 3,
          solvedCount: 2,
        })
      );
    });
  });

  describe("advanceAfterSkip", () => {
    it("increments only nextExerciseIndex, not solvedCount", async () => {
      mockGetCycleRunById.mockResolvedValue(cycle);
      const result = await advanceAfterSkip("c1");
      expect(result.status).toBe("advanced");
      expect(result.nextExerciseIndex).toBe(3);
      expect(result.solvedCount).toBe(2);
      expect(mockUpdateCycleRun).toHaveBeenCalledWith(
        "c1",
        expect.objectContaining({
          nextExerciseIndex: 3,
          solvedCount: 2,
        })
      );
    });
  });
});
