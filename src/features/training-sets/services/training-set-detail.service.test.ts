import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getTrainingSetDetail,
  getTrainingSetCycleHistory,
  getTrainingSetSummary,
} from "./training-set-detail.service";

const mockGetTrainingSetById = vi.fn();
const mockCountByTrainingSetId = vi.fn();
const mockGetActiveCycleRunForSet = vi.fn();
const mockGetCycleRunsByTrainingSetId = vi.fn();
const mockGetSessionsByCycleRunIds = vi.fn();

vi.mock("@/repositories/training-set.repository", () => ({
  getTrainingSetById: (id: string) => mockGetTrainingSetById(id),
}));
vi.mock("@/repositories/exercise.repository", () => ({
  countByTrainingSetId: (id: string) => mockCountByTrainingSetId(id),
}));
vi.mock("@/repositories/cycle-run.repository", () => ({
  getActiveCycleRunForSet: (id: string) => mockGetActiveCycleRunForSet(id),
  getCycleRunsByTrainingSetId: (id: string) =>
    mockGetCycleRunsByTrainingSetId(id),
}));
vi.mock("@/repositories/session.repository", () => ({
  getSessionsByCycleRunIds: (ids: string[]) =>
    mockGetSessionsByCycleRunIds(ids),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockCountByTrainingSetId.mockResolvedValue(5);
  mockGetSessionsByCycleRunIds.mockResolvedValue([]);
});

describe("training-set-detail.service", () => {
  describe("getTrainingSetDetail", () => {
    it("returns null when set not found", async () => {
      mockGetTrainingSetById.mockResolvedValue(undefined);
      const result = await getTrainingSetDetail("set-1");
      expect(result).toBeNull();
    });

    it("returns correct detail view model with set metadata", async () => {
      mockGetTrainingSetById.mockResolvedValue({
        id: "set-1",
        name: "Sample Set",
        description: "First cycle",
        difficulty: "intermediate",
        exerciseIds: ["e1", "e2", "e3", "e4", "e5"],
        createdAt: "2025-03-12T10:00:00Z",
        source: "Sample",
        tags: ["tactics", "mixed"],
      });
      mockGetActiveCycleRunForSet.mockResolvedValue(undefined);
      mockGetCycleRunsByTrainingSetId.mockResolvedValue([]);

      const result = await getTrainingSetDetail("set-1");
      expect(result).not.toBeNull();
      expect(result!.trainingSet.id).toBe("set-1");
      expect(result!.trainingSet.name).toBe("Sample Set");
      expect(result!.trainingSet.source).toBe("Sample");
      expect(result!.trainingSet.tags).toEqual(["tactics", "mixed"]);
      expect(result!.trainingSet.exerciseCount).toBe(5);
      expect(result!.activeCycle).toBeNull();
      expect(result!.cycleHistory).toHaveLength(0);
      expect(result!.actions.primaryActionLabel).toBe("Start Cycle 1");
      expect(result!.actions.canContinue).toBe(false);
      expect(result!.totalCompletedCycles).toBe(0);
    });

    it("handles no cycles - Start Cycle 1 when exercises exist", async () => {
      mockGetTrainingSetById.mockResolvedValue({
        id: "set-1",
        name: "New Set",
        difficulty: "easy",
        exerciseIds: ["e1"],
        createdAt: "2025-03-12T10:00:00Z",
      });
      mockGetActiveCycleRunForSet.mockResolvedValue(undefined);
      mockGetCycleRunsByTrainingSetId.mockResolvedValue([]);

      const result = await getTrainingSetDetail("set-1");
      expect(result!.actions.primaryActionLabel).toBe("Start Cycle 1");
      expect(result!.actions.canStartNextCycle).toBe(true);
    });

    it("handles empty set - No exercises and canStartNextCycle false", async () => {
      mockGetTrainingSetById.mockResolvedValue({
        id: "set-1",
        name: "Empty Set",
        difficulty: "custom",
        exerciseIds: [],
        createdAt: "2025-03-12T10:00:00Z",
      });
      mockCountByTrainingSetId.mockResolvedValue(0);
      mockGetActiveCycleRunForSet.mockResolvedValue(undefined);
      mockGetCycleRunsByTrainingSetId.mockResolvedValue([]);

      const result = await getTrainingSetDetail("set-1");
      expect(result!.trainingSet.exerciseCount).toBe(0);
      expect(result!.actions.primaryActionLabel).toBe("No exercises");
      expect(result!.actions.canStartNextCycle).toBe(false);
    });

    it("handles active cycle - Continue Training", async () => {
      mockGetTrainingSetById.mockResolvedValue({
        id: "set-1",
        name: "Active Set",
        difficulty: "easy",
        exerciseIds: ["e1", "e2"],
        createdAt: "2025-03-12T10:00:00Z",
      });
      mockGetActiveCycleRunForSet.mockResolvedValue({
        id: "cycle-1",
        trainingSetId: "set-1",
        cycleNumber: 1,
        status: "active",
        startedAt: "2025-03-12T10:00:00Z",
        solvedCount: 1,
        totalExercises: 2,
        nextExerciseIndex: 1,
        totalTimeMs: 0,
      });
      mockGetCycleRunsByTrainingSetId.mockResolvedValue([
        {
          id: "cycle-1",
          trainingSetId: "set-1",
          cycleNumber: 1,
          status: "active",
          startedAt: "2025-03-12T10:00:00Z",
          solvedCount: 1,
          totalExercises: 2,
          nextExerciseIndex: 1,
          totalTimeMs: 0,
        },
      ]);

      const result = await getTrainingSetDetail("set-1");
      expect(result!.activeCycle).not.toBeNull();
      expect(result!.activeCycle!.cycleNumber).toBe(1);
      expect(result!.activeCycle!.solvedCount).toBe(1);
      expect(result!.actions.primaryActionLabel).toBe("Continue Training");
      expect(result!.actions.canContinue).toBe(true);
    });

    it("maps completed cycles into history with session count and time", async () => {
      mockGetTrainingSetById.mockResolvedValue({
        id: "set-1",
        name: "Completed Set",
        difficulty: "easy",
        exerciseIds: ["e1", "e2"],
        createdAt: "2025-03-12T10:00:00Z",
      });
      mockGetActiveCycleRunForSet.mockResolvedValue(undefined);
      mockGetCycleRunsByTrainingSetId.mockResolvedValue([
        {
          id: "cycle-1",
          trainingSetId: "set-1",
          cycleNumber: 1,
          status: "completed",
          startedAt: "2025-03-12T09:00:00Z",
          completedAt: "2025-03-12T10:00:00Z",
          solvedCount: 2,
          totalExercises: 2,
          nextExerciseIndex: 2,
          totalTimeMs: 0,
        },
      ]);
      mockGetSessionsByCycleRunIds.mockResolvedValue([
        { id: "s1", activeTimeMs: 60000, cycleRunId: "cycle-1" },
      ]);

      const result = await getTrainingSetDetail("set-1");
      expect(result!.cycleHistory).toHaveLength(1);
      expect(result!.cycleHistory[0].cycleNumber).toBe(1);
      expect(result!.cycleHistory[0].status).toBe("completed");
      expect(result!.cycleHistory[0].sessionCount).toBe(1);
      expect(result!.cycleHistory[0].totalTimeMs).toBe(60000);
      expect(result!.actions.primaryActionLabel).toBe("Start Next Cycle");
      expect(result!.totalCompletedCycles).toBe(1);
    });
  });

  describe("getTrainingSetCycleHistory", () => {
    it("returns empty when set not found", async () => {
      mockGetTrainingSetById.mockResolvedValue(undefined);
      const result = await getTrainingSetCycleHistory("set-1");
      expect(result).toEqual([]);
    });
  });

  describe("getTrainingSetSummary", () => {
    it("returns null when set not found", async () => {
      mockGetTrainingSetById.mockResolvedValue(undefined);
      const result = await getTrainingSetSummary("set-1");
      expect(result).toBeNull();
    });

    it("returns subset of detail", async () => {
      mockGetTrainingSetById.mockResolvedValue({
        id: "set-1",
        name: "Summary Set",
        difficulty: "custom",
        exerciseIds: [],
        createdAt: "2025-03-12T10:00:00Z",
      });
      mockGetActiveCycleRunForSet.mockResolvedValue(undefined);
      mockGetCycleRunsByTrainingSetId.mockResolvedValue([]);

      const result = await getTrainingSetSummary("set-1");
      expect(result).not.toBeNull();
      expect(result!.trainingSet.name).toBe("Summary Set");
      expect(result).not.toHaveProperty("cycleHistory");
    });
  });
});
