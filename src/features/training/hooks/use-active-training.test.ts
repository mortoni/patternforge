import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
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
});
