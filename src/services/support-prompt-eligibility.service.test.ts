import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCompletedCycleCount = vi.fn();
const mockExerciseAttemptCount = vi.fn();
const mockCompletedSessionsCount = vi.fn();

vi.mock("@/db/dexie", () => ({
  db: {
    cycleRuns: {
      where: () => ({
        equals: () => ({
          count: () => mockCompletedCycleCount(),
        }),
      }),
    },
    exerciseAttempts: {
      count: () => mockExerciseAttemptCount(),
    },
  },
}));

vi.mock("@/repositories/session.repository", () => ({
  getCompletedSessionsCount: () => mockCompletedSessionsCount(),
}));

import { meetsSupportPromptMilestone } from "./support-prompt-eligibility.service";

describe("meetsSupportPromptMilestone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCompletedCycleCount.mockResolvedValue(0);
    mockExerciseAttemptCount.mockResolvedValue(0);
    mockCompletedSessionsCount.mockResolvedValue(0);
  });

  it("returns true when at least one cycle is completed", async () => {
    mockCompletedCycleCount.mockResolvedValue(1);
    expect(await meetsSupportPromptMilestone()).toBe(true);
  });

  it("returns true when exercise attempts reach the puzzle milestone", async () => {
    mockExerciseAttemptCount.mockResolvedValue(15);
    expect(await meetsSupportPromptMilestone()).toBe(true);
  });

  it("returns true when completed sessions reach the usage milestone", async () => {
    mockCompletedSessionsCount.mockResolvedValue(2);
    expect(await meetsSupportPromptMilestone()).toBe(true);
  });

  it("returns false when no milestone is met", async () => {
    mockExerciseAttemptCount.mockResolvedValue(14);
    mockCompletedSessionsCount.mockResolvedValue(1);
    expect(await meetsSupportPromptMilestone()).toBe(false);
  });
});
