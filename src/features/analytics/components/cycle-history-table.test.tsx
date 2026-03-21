import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CycleHistoryTable } from "./cycle-history-table";

describe("CycleHistoryTable", () => {
  it("shows Option A copy on cycle 1 with in-progress hint", () => {
    render(<CycleHistoryTable rows={[]} activeCycleNumber={1} />);
    expect(
      screen.getByText(/You're in your first cycle/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Cycle 1 in progress/i)).toBeInTheDocument();
  });

  it("shows Option B copy when not on cycle 1 or no active cycle", () => {
    render(<CycleHistoryTable rows={[]} activeCycleNumber={null} />);
    expect(
      screen.getByText(/Cycle history will appear once your first cycle is complete/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/in progress/i)).not.toBeInTheDocument();
  });

  it("shows Option B and in-progress line for cycle 2+", () => {
    render(<CycleHistoryTable rows={[]} activeCycleNumber={2} />);
    expect(
      screen.getByText(/Cycle history will appear once your first cycle is complete/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Cycle 2 in progress/i)).toBeInTheDocument();
  });

  it("shows table when rows exist", () => {
    render(
      <CycleHistoryTable
        rows={[
          {
            cycleId: "c1",
            cycleNumber: 1,
            trainingSetName: "Set A",
            totalTimeMs: 60_000,
            totalExercisesCompleted: 5,
            completedAt: "2025-01-01T12:00:00Z",
          },
        ]}
      />
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Set A")).toBeInTheDocument();
  });
});
