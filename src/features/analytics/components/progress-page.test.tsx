import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProgressPage } from "./progress-page";

const mockGetProgressPageData = vi.fn();

vi.mock("@/services/analytics-page.service", () => ({
  getProgressPageData: () => mockGetProgressPageData(),
}));

vi.mock("./current-cycle-sessions-chart", () => ({
  CurrentCycleSessionsChart: () => (
    <div data-testid="current-cycle-sessions-chart" />
  ),
}));

vi.mock("./reflection-cycles-time-chart", () => ({
  ReflectionCyclesTimeChart: () => (
    <div data-testid="reflection-cycles-time-chart" />
  ),
}));

const baseActiveCycle = {
  cycleId: "c1",
  trainingSetId: "t1",
  trainingSetName: "Woodpecker Easy",
  cycleNumber: 1,
  nextExerciseIndex: 120,
  totalExercises: 1128,
  exercisesRemaining: 1008,
  totalTimeMs: 3600_000,
  totalExercisesCompleted: 400,
  totalSkippedForNowInCycle: 3,
  sessionCount: 4,
  averageSessionTimeMs: 900_000,
  longestSessionMs: 1_200_000,
  sessionBars: [
    {
      index: 1,
      label: "1",
      exercises: 10,
      timeMs: 60_000,
      endedAt: "2025-03-12T09:00:00Z",
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetProgressPageData.mockResolvedValue({
    currentCycle: baseActiveCycle,
    cycleHistory: [
      {
        cycleId: "c0",
        trainingSetId: "t1",
        cycleNumber: 0,
        trainingSetName: "Woodpecker Easy",
        totalTimeMs: 1000,
        totalExercisesCompleted: 50,
        completedAt: "2025-01-01T12:00:00Z",
        sessionCount: 2,
      },
    ],
  });
});

describe("ProgressPage", () => {
  it("shows Progress mode with cycle-oriented sections when a cycle is active", async () => {
    render(<ProgressPage />);
    expect(await screen.findByText("Progress")).toBeInTheDocument();
    expect(
      screen.getByText(/track your current cycle across sessions/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Current cycle")).toBeInTheDocument();
    expect(screen.getByText("Cycle 1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sessions" })).toBeInTheDocument();
    expect(screen.getByText("Session activity")).toBeInTheDocument();
    expect(screen.getByTestId("current-cycle-sessions-chart")).toBeInTheDocument();
    expect(screen.queryByText("Reflection")).not.toBeInTheDocument();
    expect(screen.queryByText(/review mistakes/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/completed cycles/i)
    ).not.toBeInTheDocument();
  });

  it("shows skipped-for-now line when cycle has skips", async () => {
    render(<ProgressPage />);
    expect(
      await screen.findByText(/3 exercises skipped for now/i)
    ).toBeInTheDocument();
  });

  it("shows Reflection mode when there is no active cycle", async () => {
    mockGetProgressPageData.mockResolvedValueOnce({
      currentCycle: null,
      cycleHistory: [],
    });
    render(<ProgressPage />);
    expect(await screen.findByText("Reflection")).toBeInTheDocument();
    expect(
      screen.getByText(/review completed cycles and revisit your training history/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Completed cycles")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /completed cycles view/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Session activity")).not.toBeInTheDocument();
  });

  it("shows table/chart toggle and chart when Chart is selected", async () => {
    mockGetProgressPageData.mockResolvedValueOnce({
      currentCycle: null,
      cycleHistory: [
        {
          cycleId: "c1",
          trainingSetId: "set-a",
          cycleNumber: 1,
          trainingSetName: "Set A",
          totalTimeMs: 60_000,
          totalExercisesCompleted: 5,
          completedAt: "2025-01-02T12:00:00Z",
          sessionCount: 2,
        },
        {
          cycleId: "c0",
          trainingSetId: "set-a",
          cycleNumber: 0,
          trainingSetName: "Set A",
          totalTimeMs: 30_000,
          totalExercisesCompleted: 3,
          completedAt: "2025-01-01T12:00:00Z",
          sessionCount: 1,
        },
      ],
    });
    render(<ProgressPage />);
    expect(await screen.findByRole("combobox")).toBeInTheDocument();
    expect(await screen.findByRole("group", { name: /completed cycles view/i })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByTestId("reflection-cycles-time-chart")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Chart" }));
    expect(screen.getByTestId("reflection-cycles-time-chart")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("disables Chart when the selected training set has only one completed cycle", async () => {
    mockGetProgressPageData.mockResolvedValueOnce({
      currentCycle: null,
      cycleHistory: [
        {
          cycleId: "c1",
          trainingSetId: "set-a",
          cycleNumber: 1,
          trainingSetName: "Set A",
          totalTimeMs: 60_000,
          totalExercisesCompleted: 5,
          completedAt: "2025-01-02T12:00:00Z",
          sessionCount: 2,
        },
      ],
    });
    render(<ProgressPage />);
    expect(await screen.findByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chart" })).toBeDisabled();
  });
});
