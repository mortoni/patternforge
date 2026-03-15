import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetUserProgressPreserveLibrary } from "./reset-user-progress";

const mockTransaction = vi.fn();
const mockCount = vi.fn();
const mockClear = vi.fn();
const mockPut = vi.fn();

vi.mock("./dexie", () => ({
  db: {
    transaction: (
      _mode: "r" | "rw",
      _tables: unknown[],
      callback: () => Promise<unknown>
    ) => {
      mockTransaction(_mode, _tables);
      return callback();
    },
    cycleRuns: { count: () => mockCount(), clear: () => mockClear() },
    sessions: { count: () => mockCount(), clear: () => mockClear() },
    exerciseAttempts: { count: () => mockCount(), clear: () => mockClear() },
    mistakeEntries: { count: () => mockCount(), clear: () => mockClear() },
    appInstance: { count: () => mockCount(), clear: () => mockClear() },
    settings: { put: (data: unknown) => mockPut(data) },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockCount.mockResolvedValue(0);
  mockClear.mockResolvedValue(undefined);
  mockPut.mockResolvedValue(undefined);
});

describe("reset-user-progress", () => {
  it("clears cycleRuns, sessions, exerciseAttempts, mistakeEntries, appInstance", async () => {
    mockCount
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    const result = await resetUserProgressPreserveLibrary();

    expect(mockTransaction).toHaveBeenCalledWith("rw", expect.any(Array));
    expect(mockTransaction.mock.calls[0][1]).toHaveLength(6);
    expect(result.cycleRunsDeleted).toBe(2);
    expect(result.sessionsDeleted).toBe(3);
    expect(result.attemptsDeleted).toBe(10);
    expect(result.mistakesDeleted).toBe(1);
    expect(result.appInstanceReset).toBe(1);
    expect(result.settingsReset).toBe(true);
    expect(mockClear).toHaveBeenCalledTimes(5);
    expect(mockPut).toHaveBeenCalledTimes(1);
  });

  it("resets settings to default (theme system, board white, no lastTrainingSetId)", async () => {
    await resetUserProgressPreserveLibrary();

    expect(mockPut).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "default",
        theme: "system",
        boardOrientation: "white",
        lastTrainingSetId: undefined,
      })
    );
  });

  it("does not touch trainingSets or exercises", async () => {
    await resetUserProgressPreserveLibrary();

    const tablesArg = mockTransaction.mock.calls[0][1] as unknown[];
    const tableNames = tablesArg.map((t: { _name?: string }) => t?.constructor?.name ?? t);
    expect(tablesArg.length).toBe(6);
    expect(mockClear).toHaveBeenCalledTimes(5);
    expect(mockPut).toHaveBeenCalledTimes(1);
  });

  it("returns zero counts when all tables are empty", async () => {
    const result = await resetUserProgressPreserveLibrary();

    expect(result.cycleRunsDeleted).toBe(0);
    expect(result.sessionsDeleted).toBe(0);
    expect(result.attemptsDeleted).toBe(0);
    expect(result.mistakesDeleted).toBe(0);
    expect(result.appInstanceReset).toBe(0);
    expect(result.settingsReset).toBe(true);
  });
});
