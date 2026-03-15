import { describe, it, expect, vi, beforeEach } from "vitest";
import { getActionLabel, startNextCycle } from "./training-sets.service";

const mockGetTrainingSetById = vi.fn();
const mockCountByTrainingSetId = vi.fn();
const mockGetCycleRunsByTrainingSetId = vi.fn();
const mockAddCycleRun = vi.fn();
const mockSetLastTrainingSet = vi.fn();

vi.mock("@/repositories/training-set.repository", () => ({
  getTrainingSetById: (id: string) => mockGetTrainingSetById(id),
}));
vi.mock("@/repositories/exercise.repository", () => ({
  countByTrainingSetId: (id: string) => mockCountByTrainingSetId(id),
}));
vi.mock("@/repositories/cycle-run.repository", () => ({
  getCycleRunsByTrainingSetId: (id: string) =>
    mockGetCycleRunsByTrainingSetId(id),
  addCycleRun: (data: unknown) => mockAddCycleRun(data),
}));
vi.mock("@/repositories/settings.repository", () => ({
  setLastTrainingSet: (id: string) => mockSetLastTrainingSet(id),
}));

describe("getActionLabel", () => {
  it('returns "No exercises" when exerciseCount is 0', () => {
    expect(getActionLabel(false, false, null, 0)).toBe("No exercises");
    expect(getActionLabel(false, true, 1, 0)).toBe("No exercises");
    expect(getActionLabel(true, true, 1, 0)).toBe("No exercises");
  });

  it('returns "Continue Training" when there is an active cycle and exercises exist', () => {
    expect(getActionLabel(true, true, 1, 5)).toBe("Continue Training");
    expect(getActionLabel(true, true, 2, 5)).toBe("Continue Training");
  });

  it('returns "Start Cycle 1" when no cycle exists', () => {
    expect(getActionLabel(false, false, null, 5)).toBe("Start Cycle 1");
    expect(getActionLabel(false, false, undefined as unknown as number, 5)).toBe(
      "Start Cycle 1"
    );
  });

  it('returns "Start Cycle 1" when currentCycleNumber is null', () => {
    expect(getActionLabel(false, true, null, 5)).toBe("Start Cycle 1");
  });

  it('returns "Start Next Cycle" when only completed cycles exist', () => {
    expect(getActionLabel(false, true, 1, 5)).toBe("Start Next Cycle");
    expect(getActionLabel(false, true, 3, 5)).toBe("Start Next Cycle");
  });
});

describe("startNextCycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCycleRunsByTrainingSetId.mockResolvedValue([]);
    mockSetLastTrainingSet.mockResolvedValue(undefined);
  });

  it("throws when training set has no exercises", async () => {
    mockGetTrainingSetById.mockResolvedValue({
      id: "set-1",
      name: "Empty",
      exerciseIds: [],
    });
    mockCountByTrainingSetId.mockResolvedValue(0);
    await expect(startNextCycle("set-1")).rejects.toThrow(
      "Cannot start cycle: training set has no exercises"
    );
    expect(mockAddCycleRun).not.toHaveBeenCalled();
  });

  it("creates cycle when set has exercises", async () => {
    mockGetTrainingSetById.mockResolvedValue({
      id: "set-1",
      name: "With Exercises",
      exerciseIds: ["e1", "e2"],
    });
    mockCountByTrainingSetId.mockResolvedValue(2);
    mockAddCycleRun.mockImplementation((data: { id: string }) =>
      Promise.resolve(data.id)
    );
    const result = await startNextCycle("set-1");
    expect(result.success).toBe(true);
    expect(mockAddCycleRun).toHaveBeenCalledWith(
      expect.objectContaining({
        trainingSetId: "set-1",
        totalExercises: 2,
        nextExerciseIndex: 0,
      })
    );
  });
});
