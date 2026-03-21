import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSessionSummaryForSession } from "./session-summary.service";

const mockGetSessionById = vi.fn();
const mockGetTrainingSetById = vi.fn();
const mockGetCycleRunById = vi.fn();
const mockGetSessionsByCycleRunId = vi.fn();
const mockGetCycleRunsByTrainingSetId = vi.fn();

vi.mock("@/repositories/session.repository", () => ({
  getSessionById: (...a: unknown[]) => mockGetSessionById(...a),
  getSessionsByCycleRunId: (...a: unknown[]) => mockGetSessionsByCycleRunId(...a),
}));

vi.mock("@/repositories/cycle-run.repository", () => ({
  getCycleRunById: (...a: unknown[]) => mockGetCycleRunById(...a),
  getCycleRunsByTrainingSetId: (...a: unknown[]) =>
    mockGetCycleRunsByTrainingSetId(...a),
}));

vi.mock("@/repositories/training-set.repository", () => ({
  getTrainingSetById: (...a: unknown[]) => mockGetTrainingSetById(...a),
}));

vi.mock("@/repositories/exercise-attempt.repository", () => ({
  getSkippedCountsBySessionIds: async () => new Map<string, number>(),
}));

describe("getSessionSummaryForSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns null when session missing", async () => {
    mockGetSessionById.mockResolvedValue(undefined);
    await expect(getSessionSummaryForSession("x")).resolves.toBeNull();
  });

  it("aggregates cycle sessions and omits correct/skipped fields", async () => {
    mockGetSessionById.mockResolvedValue({
      id: "s1",
      trainingSetId: "ts1",
      cycleRunId: "c1",
      startedAt: "2025-01-01T10:00:00.000Z",
      endedAt: "2025-01-01T10:30:00.000Z",
      activeTimeMs: 120_000,
      puzzlesAttempted: 2,
      correctCount: 2,
      skippedCount: 0,
      status: "completed",
    });
    mockGetTrainingSetById.mockResolvedValue({ id: "ts1", name: "My Set" });
    mockGetCycleRunById.mockResolvedValue({
      id: "c1",
      trainingSetId: "ts1",
      cycleNumber: 2,
      status: "active",
      startedAt: "2025-01-01T09:00:00.000Z",
      totalTimeMs: 0,
      solvedCount: 0,
      totalExercises: 10,
      nextExerciseIndex: 0,
    });
    mockGetSessionsByCycleRunId.mockImplementation(async (cycleId: string) => {
      if (cycleId === "c1") {
        return [
          {
            id: "s0",
            startedAt: "2025-01-01T09:00:00.000Z",
            activeTimeMs: 60_000,
            puzzlesAttempted: 1,
            skippedCount: 0,
          },
          {
            id: "s1",
            startedAt: "2025-01-01T10:00:00.000Z",
            activeTimeMs: 180_000,
            puzzlesAttempted: 3,
            skippedCount: 0,
          },
        ];
      }
      if (cycleId === "c0") {
        return [
          { activeTimeMs: 3_600_000, puzzlesAttempted: 50, skippedCount: 0 },
        ];
      }
      return [];
    });
    mockGetCycleRunsByTrainingSetId.mockResolvedValue([
      {
        id: "c0",
        trainingSetId: "ts1",
        cycleNumber: 1,
        status: "completed",
        completedAt: "2024-12-01T00:00:00.000Z",
        startedAt: "2024-11-01T00:00:00.000Z",
        totalTimeMs: 0,
        solvedCount: 10,
        totalExercises: 10,
        nextExerciseIndex: 10,
      },
      {
        id: "c1",
        trainingSetId: "ts1",
        cycleNumber: 2,
        status: "active",
        startedAt: "2025-01-01T09:00:00.000Z",
        totalTimeMs: 0,
        solvedCount: 0,
        totalExercises: 10,
        nextExerciseIndex: 0,
      },
    ]);

    const result = await getSessionSummaryForSession("s1");
    expect(result).not.toBeNull();
    expect(result!.trainingSetName).toBe("My Set");
    expect(result!.session.puzzlesAttempted).toBe(2);
    expect(result!.session.skippedCount).toBe(0);
    expect(result!.session.exercisesCompleted).toBe(2);
    expect(result!.session.activeTimeMs).toBe(120_000);
    expect(result!.cycle.totalExercisesCompletedInCycle).toBe(4);
    expect(result!.cycle.totalActiveTimeMsInCycle).toBe(240_000);
    expect(result!.cycle.nextExerciseIndex).toBe(0);
    expect(result!.cycle.totalExercises).toBe(10);
    expect(result!.sessionsInCycleCount).toBe(2);
    expect(result!.sessionIndexInCycle).toBe(2);
    expect(result!.previousCycle).toEqual({
      cycleNumber: 1,
      totalActiveTimeMs: 3_600_000,
    });
  });

  it("counts skips in session and cycle processed totals", async () => {
    mockGetSessionById.mockResolvedValue({
      id: "s1",
      trainingSetId: "ts1",
      cycleRunId: "c1",
      startedAt: "2025-01-01T10:00:00.000Z",
      endedAt: "2025-01-01T10:30:00.000Z",
      activeTimeMs: 60_000,
      puzzlesAttempted: 4,
      correctCount: 1,
      skippedCount: 2,
      status: "completed",
    });
    mockGetTrainingSetById.mockResolvedValue({ id: "ts1", name: "Set" });
    mockGetCycleRunById.mockResolvedValue({
      id: "c1",
      trainingSetId: "ts1",
      cycleNumber: 1,
      status: "active",
      startedAt: "2025-01-01T09:00:00.000Z",
      totalTimeMs: 0,
      solvedCount: 0,
      totalExercises: 10,
      nextExerciseIndex: 0,
    });
    mockGetSessionsByCycleRunId.mockResolvedValue([
      {
        id: "s1",
        startedAt: "2025-01-01T10:00:00.000Z",
        activeTimeMs: 60_000,
        puzzlesAttempted: 4,
        skippedCount: 2,
      },
    ]);
    mockGetCycleRunsByTrainingSetId.mockResolvedValue([]);

    const result = await getSessionSummaryForSession("s1");
    expect(result!.session.exercisesCompleted).toBe(4);
    expect(result!.cycle.totalExercisesCompletedInCycle).toBe(4);
  });
});
