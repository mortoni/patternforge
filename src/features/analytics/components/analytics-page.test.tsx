import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalyticsPage } from "./analytics-page";

const mockGetAnalyticsPageData = vi.fn();

vi.mock("@/services/analytics-page.service", () => ({
  getAnalyticsPageData: () => mockGetAnalyticsPageData(),
}));

vi.mock("./current-cycle-sessions-chart", () => ({
  CurrentCycleSessionsChart: () => <div data-testid="current-cycle-sessions-chart" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnalyticsPageData.mockResolvedValue({
    lastSession: {
      activeTimeMs: 120_000,
      exercisesCompleted: 5,
      endedAt: "2025-03-12T10:00:00Z",
    },
    currentCycle: {
      cycleId: "c1",
      trainingSetId: "t1",
      trainingSetName: "Woodpecker Easy",
      cycleNumber: 1,
      nextExerciseIndex: 120,
      totalExercises: 1128,
      totalTimeMs: 3600_000,
      totalExercisesCompleted: 400,
      totalSkippedForNowInCycle: 3,
      sessionBars: [
        {
          index: 1,
          label: "1",
          exercises: 10,
          timeMs: 60_000,
          endedAt: "2025-03-12T09:00:00Z",
        },
      ],
    },
    cycleHistory: [
      {
        cycleId: "c0",
        cycleNumber: 0,
        trainingSetName: "Woodpecker Easy",
        totalTimeMs: 1000,
        totalExercisesCompleted: 50,
        completedAt: "2025-01-01T12:00:00Z",
      },
    ],
    mistakesToReview: 2,
    longestRecentSessionMs: 180_000,
    bestRecentSessionExercises: 12,
  });
});

describe("AnalyticsPage", () => {
  it("shows woodpecker-aligned header when loaded", async () => {
    render(<AnalyticsPage />);
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(
      screen.getByText(/repetition, volume, and time/i)
    ).toBeInTheDocument();
    await screen.findByText("Last session");
    expect(screen.getByText("Most recent session")).toBeInTheDocument();
    expect(
      screen.getByText(/A quick session — consistency matters/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Current cycle")).toBeInTheDocument();
    expect(screen.getByText("Cycle 1")).toBeInTheDocument();
    expect(screen.getAllByText(/woodpecker easy/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows solid-session feedback for medium-length last session", async () => {
    mockGetAnalyticsPageData.mockResolvedValueOnce({
      lastSession: {
        activeTimeMs: 12 * 60 * 1000,
        exercisesCompleted: 8,
        endedAt: "2025-03-12T10:00:00Z",
      },
      currentCycle: null,
      cycleHistory: [],
      mistakesToReview: 0,
      longestRecentSessionMs: null,
      bestRecentSessionExercises: null,
    });
    render(<AnalyticsPage />);
    expect(await screen.findByText(/^Solid session\.$/)).toBeInTheDocument();
  });

  it("shows great-focus feedback for longer last session", async () => {
    mockGetAnalyticsPageData.mockResolvedValueOnce({
      lastSession: {
        activeTimeMs: 30 * 60 * 1000,
        exercisesCompleted: 20,
        endedAt: "2025-03-12T10:00:00Z",
      },
      currentCycle: null,
      cycleHistory: [],
      mistakesToReview: 0,
      longestRecentSessionMs: null,
      bestRecentSessionExercises: null,
    });
    render(<AnalyticsPage />);
    expect(await screen.findByText(/^Great focus session\.$/)).toBeInTheDocument();
  });

  it("shows review mistakes and learning room link", async () => {
    render(<AnalyticsPage />);
    await screen.findByText(/review mistakes/i);
    expect(
      screen.getByRole("link", { name: /go to learning room/i })
    ).toHaveAttribute("href", "/app/mistakes");
  });

  it("shows cycle history section", async () => {
    render(<AnalyticsPage />);
    await screen.findByText(/cycles you've completed/i);
    expect(screen.getByRole("columnheader", { name: /cycle/i })).toBeInTheDocument();
  });

  it("shows subtle skipped-for-now line when cycle has skips", async () => {
    render(<AnalyticsPage />);
    expect(
      await screen.findByText(/3 exercises skipped for now/i)
    ).toBeInTheDocument();
  });
});
