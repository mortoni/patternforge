import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOrCreateActiveSession,
  recordAttemptOnSession,
  completeSession,
} from "./training-session.service";

const mockGetActiveByCycleRunId = vi.fn();
const mockAddSession = vi.fn();
const mockGetSessionById = vi.fn();
const mockUpdateSession = vi.fn();

vi.mock("@/repositories/session.repository", () => ({
  getActiveByCycleRunId: (id: string) => mockGetActiveByCycleRunId(id),
  addSession: (data: unknown) => mockAddSession(data),
  getSessionById: (id: string) => mockGetSessionById(id),
  updateSession: (id: string, patch: unknown) => mockUpdateSession(id, patch),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const existingSession = {
  id: "existing-1",
  trainingSetId: "set-1",
  cycleRunId: "cycle-1",
  status: "active" as const,
  startedAt: "2025-01-01T00:00:00Z",
  activeTimeMs: 0,
  puzzlesAttempted: 3,
  correctCount: 2,
  skippedCount: 1,
};

describe("training-session.service", () => {
  describe("getOrCreateActiveSession", () => {
    it("reuses active session when one exists for the cycle", async () => {
      mockGetActiveByCycleRunId.mockResolvedValue(existingSession);
      const result = await getOrCreateActiveSession("set-1", "cycle-1");
      expect(result.id).toBe("existing-1");
      expect(result.puzzlesAttempted).toBe(3);
      expect(result.correctCount).toBe(2);
      expect(mockAddSession).not.toHaveBeenCalled();
    });

    it("creates new session when none exists", async () => {
      mockGetActiveByCycleRunId.mockResolvedValue(undefined);
      mockAddSession.mockResolvedValue("new-session-id");
      const result = await getOrCreateActiveSession("set-1", "cycle-1");
      expect(result.id).toBe("new-session-id");
      expect(result.puzzlesAttempted).toBe(0);
      expect(result.correctCount).toBe(0);
      expect(mockAddSession).toHaveBeenCalledWith(
        expect.objectContaining({
          trainingSetId: "set-1",
          cycleRunId: "cycle-1",
          status: "active",
          puzzlesAttempted: 0,
          correctCount: 0,
          skippedCount: 0,
        })
      );
    });

    it("dedupes concurrent creators into one addSession", async () => {
      mockGetActiveByCycleRunId.mockResolvedValue(undefined);
      mockAddSession.mockResolvedValue("new-session-id");
      const [a, b] = await Promise.all([
        getOrCreateActiveSession("set-1", "cycle-1"),
        getOrCreateActiveSession("set-1", "cycle-1"),
      ]);
      expect(a.id).toBe(b.id);
      expect(mockAddSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("recordAttemptOnSession", () => {
    it("increments puzzlesAttempted and correctCount for correct", async () => {
      mockGetSessionById.mockResolvedValue(existingSession);
      await recordAttemptOnSession("existing-1", "correct");
      expect(mockUpdateSession).toHaveBeenCalledWith(
        "existing-1",
        expect.objectContaining({
          puzzlesAttempted: 4,
          correctCount: 3,
        })
      );
    });

    it("increments only puzzlesAttempted for incorrect", async () => {
      mockGetSessionById.mockResolvedValue(existingSession);
      await recordAttemptOnSession("existing-1", "incorrect");
      expect(mockUpdateSession).toHaveBeenCalledWith(
        "existing-1",
        expect.objectContaining({
          puzzlesAttempted: 4,
        })
      );
      expect(mockUpdateSession.mock.calls[0][1].correctCount).toBeUndefined();
    });

    it("increments puzzlesAttempted and skippedCount for skipped", async () => {
      mockGetSessionById.mockResolvedValue(existingSession);
      await recordAttemptOnSession("existing-1", "skipped");
      expect(mockUpdateSession).toHaveBeenCalledWith(
        "existing-1",
        expect.objectContaining({
          puzzlesAttempted: 4,
          skippedCount: 2,
        })
      );
    });

    it("treats missing skippedCount as zero when recording a skip", async () => {
      mockGetSessionById.mockResolvedValue({
        ...existingSession,
        skippedCount: undefined as unknown as number,
      });
      await recordAttemptOnSession("existing-1", "skipped");
      expect(mockUpdateSession).toHaveBeenCalledWith(
        "existing-1",
        expect.objectContaining({
          puzzlesAttempted: 4,
          skippedCount: 1,
        })
      );
    });

    it("adds durationMs to activeTimeMs", async () => {
      mockGetSessionById.mockResolvedValue({ ...existingSession, activeTimeMs: 5000 });
      await recordAttemptOnSession("existing-1", "correct", 3000);
      expect(mockUpdateSession).toHaveBeenCalledWith(
        "existing-1",
        expect.objectContaining({
          puzzlesAttempted: 4,
          correctCount: 3,
          activeTimeMs: 8000,
        })
      );
    });
  });

  describe("completeSession", () => {
    it("sets status completed and endedAt", async () => {
      await completeSession("existing-1");
      expect(mockUpdateSession).toHaveBeenCalledWith(
        "existing-1",
        expect.objectContaining({
          status: "completed",
          endedAt: expect.any(String),
        })
      );
    });
  });
});
