import { describe, it, expect, vi, beforeEach } from "vitest";
import { getActiveTrainingState } from "./training-loader.service";

const mockGetSettings = vi.fn();
const mockGetTrainingSetById = vi.fn();
const mockGetActiveCycleRunForSet = vi.fn();
const mockGetLatestCycleRunByTrainingSetId = vi.fn();
const mockGetExercisesByTrainingSetId = vi.fn();
const mockGetOrCreateActiveSession = vi.fn();

vi.mock("@/repositories/settings.repository", () => ({
  getSettings: () => mockGetSettings(),
}));
vi.mock("@/repositories/training-set.repository", () => ({
  getTrainingSetById: (id: string) => mockGetTrainingSetById(id),
}));
vi.mock("@/repositories/cycle-run.repository", () => ({
  getActiveCycleRunForSet: (id: string) => mockGetActiveCycleRunForSet(id),
  getLatestCycleRunByTrainingSetId: (id: string) =>
    mockGetLatestCycleRunByTrainingSetId(id),
}));
vi.mock("@/repositories/exercise.repository", () => ({
  getExercisesByTrainingSetId: (id: string) =>
    mockGetExercisesByTrainingSetId(id),
}));
vi.mock("@/services/training-session.service", () => ({
  getOrCreateActiveSession: (_tid: string, _cid: string) =>
    mockGetOrCreateActiveSession(),
}));

describe("getActiveTrainingState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns "no-training-set" when settings have no lastTrainingSetId', async () => {
    mockGetSettings.mockResolvedValue({ boardOrientation: "white" });
    const result = await getActiveTrainingState();
    expect(result).toEqual({ status: "no-training-set" });
    expect(mockGetTrainingSetById).not.toHaveBeenCalled();
  });

  it('returns "no-training-set" when settings are undefined', async () => {
    mockGetSettings.mockResolvedValue(undefined);
    const result = await getActiveTrainingState();
    expect(result).toEqual({ status: "no-training-set" });
  });

  it('returns "no-active-cycle" when training set exists but no active cycle', async () => {
    mockGetSettings.mockResolvedValue({
      lastTrainingSetId: "set-1",
      boardOrientation: "white",
    });
    mockGetTrainingSetById.mockResolvedValue({
      id: "set-1",
      name: "Sample Set",
    });
    mockGetActiveCycleRunForSet.mockResolvedValue(undefined);
    mockGetLatestCycleRunByTrainingSetId.mockResolvedValue(undefined);
    const result = await getActiveTrainingState();
    expect(result).toEqual({
      status: "no-active-cycle",
      trainingSetId: "set-1",
      trainingSetName: "Sample Set",
    });
  });

  it('returns "cycle-complete" when nextExerciseIndex is past end of exercises', async () => {
    mockGetSettings.mockResolvedValue({
      lastTrainingSetId: "set-1",
      boardOrientation: "white",
    });
    mockGetTrainingSetById.mockResolvedValue({
      id: "set-1",
      name: "Sample Set",
    });
    mockGetActiveCycleRunForSet.mockResolvedValue({
      id: "cycle-1",
      trainingSetId: "set-1",
      cycleNumber: 1,
      status: "active",
      nextExerciseIndex: 99,
      totalExercises: 5,
      solvedCount: 0,
    });
    mockGetExercisesByTrainingSetId.mockResolvedValue([
      { id: "ex-1", fen: "fen1", sideToMove: "w", solutionMoves: [], createdAt: "" },
      { id: "ex-2", fen: "fen2", sideToMove: "b", solutionMoves: [], createdAt: "" },
    ]);
    const result = await getActiveTrainingState();
    expect(result).toEqual({
      status: "cycle-complete",
      trainingSetId: "set-1",
      trainingSetName: "Sample Set",
      cycleNumber: 1,
      solvedCount: 0,
      totalExercises: 5,
    });
  });

  it('returns "ready" with exercise and no sessionId (loader does not create session)', async () => {
    mockGetSettings.mockResolvedValue({
      lastTrainingSetId: "set-1",
      boardOrientation: "black",
    });
    mockGetTrainingSetById.mockResolvedValue({
      id: "set-1",
      name: "Sample Set",
      description: "Easy puzzles",
    });
    mockGetActiveCycleRunForSet.mockResolvedValue({
      id: "cycle-1",
      trainingSetId: "set-1",
      cycleNumber: 1,
      status: "active",
      nextExerciseIndex: 0,
      totalExercises: 5,
      solvedCount: 0,
      startedAt: "2025-01-01T00:00:00Z",
    });
    mockGetExercisesByTrainingSetId.mockResolvedValue([
      {
        id: "ex-1",
        trainingSetId: "set-1",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        sideToMove: "w",
        solutionMoves: ["e2e4"],
        source: "Lichess",
        difficulty: "easy",
        createdAt: "2025-01-01T00:00:00Z",
      },
    ]);
    const result = await getActiveTrainingState();
    expect(result.status).toBe("ready");
    expect(mockGetOrCreateActiveSession).not.toHaveBeenCalled();
    if (result.status === "ready") {
      expect(result.sessionId).toBeUndefined();
      expect(result.trainingSet.name).toBe("Sample Set");
      expect(result.cycleRun.cycleNumber).toBe(1);
      expect(result.exercise.fen).toContain("rnbqkbnr");
      expect(result.exercise.sideToMove).toBe("w");
      expect(result.boardOrientation).toBe("black");
      expect(result.exerciseIndex).toBe(0);
      expect(result.totalExercises).toBe(1);
    }
  });
});
