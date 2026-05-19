import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CycleSummaryPage } from "./cycle-summary-page";

const mockGetCycleSummaryPageData = vi.fn();
const mockGetActiveCycleRunForSet = vi.fn();

vi.mock("@/services/cycle-summary-page.service", () => ({
  getCycleSummaryPageData: (cycleId: string) =>
    mockGetCycleSummaryPageData(cycleId),
}));

vi.mock("@/repositories/cycle-run.repository", () => ({
  getActiveCycleRunForSet: (trainingSetId: string) =>
    mockGetActiveCycleRunForSet(trainingSetId),
}));

const mockCanShow = vi.fn();
const mockMeetsMilestone = vi.fn();

vi.mock("@/lib/support-prompt-storage", () => ({
  canShowSupportPrompt: () => mockCanShow(),
  dismissSupportPrompt: vi.fn(),
  markUserAsSupported: vi.fn(),
  recordSupportPromptShown: vi.fn(),
}));

vi.mock("@/services/support-prompt-eligibility.service", () => ({
  meetsSupportPromptMilestone: () => mockMeetsMilestone(),
}));

const completedSummary = {
  status: "ok" as const,
  data: {
    trainingSetId: "set-1",
    cycleNumber: 1,
    trainingSetName: "Woodpecker Easy",
    completedAt: "2026-05-01T12:00:00Z",
    sessionCount: 3,
    totalTimeMs: 3600_000,
    averageSessionTimeMs: 1_200_000,
    cycleSkippedTotal: 0,
    previousAttemptTimeMs: null,
    sessions: [],
    mistakes: [],
  },
};

describe("CycleSummaryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanShow.mockReturnValue(true);
    mockMeetsMilestone.mockResolvedValue(true);
    mockGetCycleSummaryPageData.mockResolvedValue(completedSummary);
    mockGetActiveCycleRunForSet.mockResolvedValue(undefined);
  });

  it("shows support prompt on a completed cycle summary", async () => {
    render(<CycleSummaryPage cycleId="cycle-1" />);
    expect(await screen.findByText("Cycle Summary")).toBeInTheDocument();
    expect(
      await screen.findByTestId("support-patternforge-prompt")
    ).toBeInTheDocument();
  });

  it("does not show support prompt when cycle is not completed", async () => {
    mockGetCycleSummaryPageData.mockResolvedValue({
      status: "not_completed",
      cycleNumber: 1,
      trainingSetName: "Woodpecker Easy",
    });
    render(<CycleSummaryPage cycleId="cycle-1" />);
    expect(
      await screen.findByText(/still active or not finished yet/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("support-patternforge-prompt")
    ).not.toBeInTheDocument();
  });
});
