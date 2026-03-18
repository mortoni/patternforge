import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrainingSetDetailPage } from "./training-set-detail-page";

const mockUseTrainingSetDetail = vi.fn();
vi.mock("../hooks/use-training-set-detail", () => ({
  useTrainingSetDetail: (id: string | null) => mockUseTrainingSetDetail(id),
}));

const mockContinueTraining = vi.fn();
const mockStartNextCycle = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("../services/training-sets.service", () => ({
  continueTraining: (...args: unknown[]) => mockContinueTraining(...args),
  startNextCycle: (...args: unknown[]) => mockStartNextCycle(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TrainingSetDetailPage", () => {
  it("shows loading state", () => {
    mockUseTrainingSetDetail.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      reload: vi.fn(),
    });
    render(<TrainingSetDetailPage trainingSetId="set-1" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows not found when data is null and not loading", () => {
    mockUseTrainingSetDetail.mockReturnValue({
      data: null,
      loading: false,
      error: new Error("Not found"),
      reload: vi.fn(),
    });
    render(<TrainingSetDetailPage trainingSetId="set-1" />);
    expect(screen.getByText("Set not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to training sets/i })).toHaveAttribute(
      "href",
      "/app/sets"
    );
  });

  it("renders detail when data is present and has no cycles", () => {
    mockUseTrainingSetDetail.mockReturnValue({
      data: {
        trainingSet: {
          id: "set-1",
          name: "Sample Set",
          description: "First cycle",
          source: "Sample",
          difficulty: "intermediate",
          tags: ["tactics", "mixed"],
          exerciseCount: 5,
          createdAt: "2025-03-12T10:00:00Z",
        },
        activeCycle: null,
        cycleHistory: [],
        actions: {
          primaryActionLabel: "Start Cycle 1",
          canContinue: false,
          canStartNextCycle: true,
        },
        totalCompletedCycles: 0,
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });
    render(<TrainingSetDetailPage trainingSetId="set-1" />);
    expect(screen.getByText("Sample Set")).toBeInTheDocument();
    expect(screen.getByText("First cycle")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Start Cycle 1" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("No cycles started yet.")).toBeInTheDocument();
  });

  it("shows no exercises empty state when set has zero exercises", () => {
    mockUseTrainingSetDetail.mockReturnValue({
      data: {
        trainingSet: {
          id: "set-1",
          name: "Empty Set",
          difficulty: "custom",
          tags: [],
          exerciseCount: 0,
          createdAt: "2025-03-12T10:00:00Z",
        },
        activeCycle: null,
        cycleHistory: [],
        actions: {
          primaryActionLabel: "Start Cycle 1",
          canContinue: false,
          canStartNextCycle: true,
        },
        totalCompletedCycles: 0,
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });
    render(<TrainingSetDetailPage trainingSetId="set-1" />);
    expect(screen.getByText("No exercises")).toBeInTheDocument();
  });

  it("renders active cycle panel when active cycle exists", () => {
    mockUseTrainingSetDetail.mockReturnValue({
      data: {
        trainingSet: {
          id: "set-1",
          name: "Active Set",
          difficulty: "easy",
          tags: [],
          exerciseCount: 3,
          createdAt: "2025-03-12T10:00:00Z",
        },
        activeCycle: {
          id: "c1",
          cycleNumber: 1,
          status: "active",
          solvedCount: 1,
          totalExercises: 3,
          completionPercentage: 33.33,
          startedAt: "2025-03-12T10:00:00Z",
        },
        cycleHistory: [],
        actions: {
          primaryActionLabel: "Continue Training",
          canContinue: true,
          canStartNextCycle: false,
        },
        totalCompletedCycles: 0,
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });
    render(<TrainingSetDetailPage trainingSetId="set-1" />);
    expect(screen.getByText("Cycle 1 · Active")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Continue Training" }).length).toBeGreaterThanOrEqual(1);
  });
});
