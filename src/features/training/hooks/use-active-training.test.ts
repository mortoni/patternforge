import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useActiveTraining } from "./use-active-training";

const mockGetActiveTrainingState = vi.fn();
const mockGetOrCreateActiveSession = vi.fn();

vi.mock("../services/training-loader.service", () => ({
  getActiveTrainingState: () => mockGetActiveTrainingState(),
}));
vi.mock("@/services/training-session.service", () => ({
  getOrCreateActiveSession: (tid: string, cid: string) =>
    mockGetOrCreateActiveSession(tid, cid),
}));

describe("useActiveTraining", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates session in interaction layer when state is ready without sessionId", async () => {
    mockGetActiveTrainingState.mockResolvedValue({
      status: "ready",
      sessionId: undefined,
      trainingSet: { id: "set-1", name: "Set 1" },
      cycleRun: { id: "cycle-1", cycleNumber: 1, solvedCount: 0, totalExercises: 5, nextExerciseIndex: 0, status: "active" },
      exercise: { id: "ex-1", fen: "fen", sideToMove: "w", solutionMoves: [] },
      exerciseIndex: 0,
      totalExercises: 5,
      boardOrientation: "white",
    });
    mockGetOrCreateActiveSession.mockResolvedValue({ id: "session-1" });

    const { result } = renderHook(() => useActiveTraining());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetOrCreateActiveSession).toHaveBeenCalledWith("set-1", "cycle-1");
    expect(result.current.state?.status).toBe("ready");
    if (result.current.state?.status === "ready") {
      expect(result.current.state.sessionId).toBe("session-1");
    }
  });

  it("does not call getOrCreateActiveSession when state is no-training-set", async () => {
    mockGetActiveTrainingState.mockResolvedValue({ status: "no-training-set" });

    const { result } = renderHook(() => useActiveTraining());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetOrCreateActiveSession).not.toHaveBeenCalled();
    expect(result.current.state?.status).toBe("no-training-set");
  });

  it("reuses the same sessionId on reload for the same cycle (does not call getOrCreate again)", async () => {
    const ready = {
      status: "ready" as const,
      sessionId: undefined,
      trainingSet: { id: "set-1", name: "Set 1" },
      cycleRun: {
        id: "cycle-1",
        cycleNumber: 1,
        solvedCount: 0,
        totalExercises: 5,
        nextExerciseIndex: 1,
        status: "active" as const,
      },
      exercise: { id: "ex-1", fen: "fen", sideToMove: "w" as const, solutionMoves: [] as string[] },
      exerciseIndex: 1,
      totalExercises: 5,
      boardOrientation: "white" as const,
    };
    mockGetActiveTrainingState.mockResolvedValue(ready);
    mockGetOrCreateActiveSession.mockResolvedValue({ id: "session-1" });

    const { result } = renderHook(() => useActiveTraining());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetOrCreateActiveSession).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.reload();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetOrCreateActiveSession).toHaveBeenCalledTimes(1);
    if (result.current.state?.status === "ready") {
      expect(result.current.state.sessionId).toBe("session-1");
    }
  });

  it("reload({ silent: true }) does not toggle loading (board can stay mounted)", async () => {
    mockGetActiveTrainingState.mockResolvedValue({
      status: "ready",
      sessionId: undefined,
      trainingSet: { id: "set-1", name: "Set 1" },
      cycleRun: {
        id: "cycle-1",
        cycleNumber: 1,
        solvedCount: 0,
        totalExercises: 5,
        nextExerciseIndex: 0,
        status: "active",
      },
      exercise: { id: "ex-1", fen: "fen", sideToMove: "w", solutionMoves: [] },
      exerciseIndex: 0,
      totalExercises: 5,
      boardOrientation: "white",
    });
    mockGetOrCreateActiveSession.mockResolvedValue({ id: "session-1" });

    const { result } = renderHook(() => useActiveTraining());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const p = result.current.reload({ silent: true });
      expect(result.current.loading).toBe(false);
      await p;
    });

    expect(result.current.loading).toBe(false);
    expect(mockGetActiveTrainingState).toHaveBeenCalledTimes(2);
  });
});
