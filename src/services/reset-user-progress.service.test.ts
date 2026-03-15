import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetUserProgressPreserveLibrary } from "./reset-user-progress.service";

const mockDbReset = vi.fn();

vi.mock("@/db/reset-user-progress", () => ({
  resetUserProgressPreserveLibrary: (...args: unknown[]) =>
    mockDbReset(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("reset-user-progress.service", () => {
  it("calls db reset and returns its result", async () => {
    const summary = {
      cycleRunsDeleted: 1,
      sessionsDeleted: 2,
      attemptsDeleted: 5,
      mistakesDeleted: 0,
      appInstanceReset: 1,
      settingsReset: true,
    };
    mockDbReset.mockResolvedValue(summary);

    const result = await resetUserProgressPreserveLibrary();

    expect(mockDbReset).toHaveBeenCalledTimes(1);
    expect(result).toEqual(summary);
  });
});
