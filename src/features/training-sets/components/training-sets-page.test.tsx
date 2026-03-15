import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrainingSetsPage } from "./training-sets-page";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("../services/training-sets.service", () => ({
  ensureSeededForDevelopment: vi.fn().mockResolvedValue(false),
  getTrainingSetsOverview: vi.fn(),
  continueTraining: vi.fn().mockResolvedValue({ success: true, route: "/app/training" }),
  startNextCycle: vi.fn().mockResolvedValue({ success: true, cycleRunId: "c1", route: "/app/training" }),
}));

import { getTrainingSetsOverview } from "../services/training-sets.service";

describe("TrainingSetsPage", () => {
  beforeEach(() => {
    vi.mocked(getTrainingSetsOverview).mockResolvedValue([
      {
        trainingSetId: "set-1",
        name: "Tactical Fundamentals",
        description: "Core tactics.",
        difficulty: "easy",
        exerciseCount: 5,
        currentCycleNumber: 1,
        cycleStatus: "active",
        solvedCount: 2,
        totalExercises: 5,
        completionPercentage: 40,
        actionLabel: "Continue Training",
      },
    ]);
  });

  it("shows loading state then renders training set content", async () => {
    render(<TrainingSetsPage />);
    expect(screen.getByText(/loading training sets/i)).toBeInTheDocument();
    const names = await screen.findAllByText("Tactical Fundamentals");
    expect(names.length).toBeGreaterThanOrEqual(1);
    const descriptions = screen.getAllByText("Core tactics.");
    expect(descriptions.length).toBeGreaterThanOrEqual(1);
    const buttons = screen.getAllByRole("button", { name: /continue training/i });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no sets returned", async () => {
    vi.mocked(getTrainingSetsOverview).mockResolvedValue([]);
    render(<TrainingSetsPage />);
    const empty = await screen.findByText(/no training sets/i);
    expect(empty).toBeInTheDocument();
  });
});
