import { describe, it, expect, vi, beforeEach } from "vitest";
import { getContinueTrainingCard } from "./dashboard.service";

const mockGetSettings = vi.fn();
const mockGetTrainingSetById = vi.fn();
const mockGetActiveCycleRunForSet = vi.fn();

vi.mock("@/repositories/settings.repository", () => ({
  getSettings: () => mockGetSettings(),
}));
vi.mock("@/repositories/training-set.repository", () => ({
  getTrainingSetById: (id: string) => mockGetTrainingSetById(id),
}));
vi.mock("@/repositories/cycle-run.repository", () => ({
  getActiveCycleRunForSet: (id: string) => mockGetActiveCycleRunForSet(id),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getContinueTrainingCard", () => {
  it("returns null when no lastTrainingSetId", async () => {
    mockGetSettings.mockResolvedValue({});
    expect(await getContinueTrainingCard()).toBeNull();
    expect(mockGetTrainingSetById).not.toHaveBeenCalled();
  });

  it("returns null when no active cycle", async () => {
    mockGetSettings.mockResolvedValue({ lastTrainingSetId: "set-1" });
    mockGetTrainingSetById.mockResolvedValue({ id: "set-1", name: "Woodpecker" });
    mockGetActiveCycleRunForSet.mockResolvedValue(undefined);
    expect(await getContinueTrainingCard()).toBeNull();
  });

  it("returns active training card when set and active cycle exist", async () => {
    mockGetSettings.mockResolvedValue({ lastTrainingSetId: "set-1" });
    mockGetTrainingSetById.mockResolvedValue({
      id: "set-1",
      name: "Woodpecker Easy",
    });
    mockGetActiveCycleRunForSet.mockResolvedValue({
      id: "c1",
      cycleNumber: 1,
      solvedCount: 3,
      totalExercises: 5,
    });
    const result = await getContinueTrainingCard();
    expect(result).toEqual({
      trainingSetId: "set-1",
      name: "Woodpecker Easy",
      cycleNumber: 1,
      solvedCount: 3,
      totalExercises: 5,
    });
  });
});
