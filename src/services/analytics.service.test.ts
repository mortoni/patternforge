import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getDashboardStats,
  getAnalyticsSummary,
  getAccuracySeries,
  getSessionDurationSeries,
  getCycleSummary,
  getTrainingVolumeSummary,
} from "./analytics.service";

const mockGetRecentCompleted = vi.fn();
const mockGetTrainingSetById = vi.fn();
const mockGetAllAttempts = vi.fn();
const mockGetCompletedCycleRuns = vi.fn();
const mockGetActiveCycleRuns = vi.fn();
const mockCountActive = vi.fn();
const mockGetCompletedSessionsCount = vi.fn();

vi.mock("@/repositories/session.repository", () => ({
  getRecentCompleted: (...args: unknown[]) => mockGetRecentCompleted(...args),
  getCompletedSessionsCount: () => mockGetCompletedSessionsCount(),
}));
vi.mock("@/repositories/training-set.repository", () => ({
  getTrainingSetById: (id: string) => mockGetTrainingSetById(id),
  getTrainingSetsByIds: (ids: string[]) =>
    Promise.resolve(ids.map((id) => ({ id, name: `Set ${id}` }))),
}));
vi.mock("@/repositories/exercise-attempt.repository", () => ({
  getAllAttempts: () => mockGetAllAttempts(),
}));
vi.mock("@/repositories/cycle-run.repository", () => ({
  getCompletedCycleRuns: () => mockGetCompletedCycleRuns(),
  getActiveCycleRuns: () => mockGetActiveCycleRuns(),
}));
vi.mock("@/repositories/mistake-entry.repository", () => ({
  countActive: () => mockCountActive(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTrainingSetById.mockImplementation((id: string) =>
    Promise.resolve({ id, name: `Set ${id}` })
  );
  mockGetCompletedSessionsCount.mockResolvedValue(0);
  mockCountActive.mockResolvedValue(0);
});

describe("analytics.service", () => {
  describe("getDashboardStats", () => {
    it("computes overall accuracy from attempts", async () => {
      mockGetRecentCompleted.mockResolvedValue([]);
      mockGetAllAttempts.mockResolvedValue([
        { sessionId: "s1", result: "correct", durationMs: 1000 },
        { sessionId: "s1", result: "incorrect", durationMs: 2000 },
        { sessionId: "s1", result: "correct", durationMs: 500 },
      ]);
      const stats = await getDashboardStats(10);
      expect(stats.totalPuzzlesAttempted).toBe(3);
      expect(stats.totalCorrect).toBe(2);
      expect(stats.overallAccuracy).toBeCloseTo(2 / 3);
    });

    it("computes total training time from attempt durationMs", async () => {
      mockGetRecentCompleted.mockResolvedValue([]);
      mockGetAllAttempts.mockResolvedValue([
        { sessionId: "s1", result: "correct", durationMs: 10000 },
        { sessionId: "s1", result: "skipped", durationMs: 5000 },
      ]);
      const stats = await getDashboardStats(10);
      expect(stats.totalTrainingTimeMs).toBe(15000);
    });

    it("returns recent sessions with set names", async () => {
      mockGetRecentCompleted.mockResolvedValue([
        {
          id: "s1",
          trainingSetId: "set-1",
          endedAt: "2025-03-12T10:00:00Z",
          startedAt: "2025-03-12T09:00:00Z",
          puzzlesAttempted: 10,
          correctCount: 8,
          skippedCount: 1,
          activeTimeMs: 300000,
          status: "completed",
        },
      ]);
      mockGetAllAttempts.mockResolvedValue([]);
      const stats = await getDashboardStats(10);
      expect(stats.recentSessions).toHaveLength(1);
      expect(stats.recentSessions[0].trainingSetName).toBe("Set set-1");
      expect(stats.recentSessions[0].accuracy).toBe(0.8);
      expect(stats.recentSessions[0].activeTimeMs).toBe(300000);
    });
  });

  describe("getAnalyticsSummary", () => {
    it("computes total sessions from count", async () => {
      mockGetCompletedSessionsCount.mockResolvedValue(5);
      mockGetAllAttempts.mockResolvedValue([]);
      const summary = await getAnalyticsSummary();
      expect(summary.totalSessions).toBe(5);
    });

    it("builds accuracy and volume from attempts", async () => {
      mockGetCompletedSessionsCount.mockResolvedValue(2);
      mockGetAllAttempts.mockResolvedValue([
        { sessionId: "s1", result: "correct", durationMs: 100 },
        { sessionId: "s1", result: "incorrect", durationMs: 200 },
      ]);
      const summary = await getAnalyticsSummary();
      expect(summary.totalAttempts).toBe(2);
      expect(summary.totalCorrect).toBe(1);
      expect(summary.overallAccuracy).toBe(0.5);
      expect(summary.totalTrainingTimeMs).toBe(300);
    });
  });

  describe("getAccuracySeries", () => {
    it("builds chart series from completed sessions", async () => {
      mockGetRecentCompleted.mockResolvedValue([
        {
          id: "s1",
          trainingSetId: "set-1",
          endedAt: "2025-03-12T10:00:00Z",
          startedAt: "2025-03-12T09:00:00Z",
          puzzlesAttempted: 5,
          correctCount: 4,
          skippedCount: 0,
          activeTimeMs: 120000,
          status: "completed",
        },
      ]);
      const series = await getAccuracySeries(20);
      expect(series).toHaveLength(1);
      expect(series[0].accuracy).toBe(0.8);
      expect(series[0].label).toBe("Set set-1");
    });
  });

  describe("getSessionDurationSeries", () => {
    it("builds duration series from completed sessions", async () => {
      mockGetRecentCompleted.mockResolvedValue([
        {
          id: "s1",
          trainingSetId: "set-1",
          endedAt: "2025-03-12T10:00:00Z",
          startedAt: "2025-03-12T09:00:00Z",
          puzzlesAttempted: 5,
          correctCount: 4,
          skippedCount: 0,
          activeTimeMs: 180000,
          status: "completed",
        },
      ]);
      const series = await getSessionDurationSeries(20);
      expect(series).toHaveLength(1);
      expect(series[0].activeTimeMs).toBe(180000);
    });
  });

  describe("getCycleSummary", () => {
    it("reports no active cycle when none", async () => {
      mockGetActiveCycleRuns.mockResolvedValue([]);
      mockGetCompletedCycleRuns.mockResolvedValue([]);
      const summary = await getCycleSummary();
      expect(summary.hasActiveCycle).toBe(false);
      expect(summary.completedCyclesCount).toBe(0);
    });

    it("reports active cycle and completed count", async () => {
      mockGetActiveCycleRuns.mockResolvedValue([
        {
          id: "c1",
          trainingSetId: "set-1",
          cycleNumber: 2,
          status: "active",
          startedAt: "2025-03-12T09:00:00Z",
          solvedCount: 3,
          totalExercises: 10,
          nextExerciseIndex: 3,
          totalTimeMs: 0,
        },
      ]);
      mockGetCompletedCycleRuns.mockResolvedValue([
        {
          id: "c0",
          trainingSetId: "set-1",
          cycleNumber: 1,
          status: "completed",
          completedAt: "2025-03-11T10:00:00Z",
          startedAt: "2025-03-11T09:00:00Z",
          solvedCount: 10,
          totalExercises: 10,
          nextExerciseIndex: 10,
          totalTimeMs: 60000,
        },
      ]);
      const summary = await getCycleSummary();
      expect(summary.hasActiveCycle).toBe(true);
      expect(summary.activeSetName).toBe("Set set-1");
      expect(summary.activeCycleNumber).toBe(2);
      expect(summary.completedCyclesCount).toBe(1);
    });
  });

  describe("getTrainingVolumeSummary", () => {
    it("aggregates sessions, attempts, solved, mistakes", async () => {
      mockGetCompletedSessionsCount.mockResolvedValue(3);
      mockGetAllAttempts.mockResolvedValue([
        { sessionId: "s1", result: "correct" },
        { sessionId: "s1", result: "incorrect" },
        { sessionId: "s1", result: "correct" },
      ]);
      mockCountActive.mockResolvedValue(2);
      const vol = await getTrainingVolumeSummary();
      expect(vol.totalSessions).toBe(3);
      expect(vol.totalAttempts).toBe(3);
      expect(vol.totalSolved).toBe(2);
      expect(vol.mistakesRemaining).toBe(2);
    });
  });
});
