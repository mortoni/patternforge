import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CycleHistoryTable } from "./cycle-history-table";

describe("CycleHistoryTable", () => {
  it("shows reflection empty copy when there are no rows", () => {
    render(<CycleHistoryTable rows={[]} />);
    expect(
      screen.getByText(/no completed cycles yet/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/finish a cycle from training sets/i)
    ).toBeInTheDocument();
  });

  it("hides the training set column when showTrainingSetColumn is false", () => {
    render(
      <CycleHistoryTable
        rows={[
          {
            cycleId: "c1",
            trainingSetId: "ts-a",
            cycleNumber: 1,
            trainingSetName: "Set A",
            totalTimeMs: 60_000,
            totalExercisesCompleted: 5,
            completedAt: "2025-01-01T12:00:00Z",
            sessionCount: 3,
          },
        ]}
        showTrainingSetColumn={false}
      />
    );
    expect(
      screen.queryByRole("columnheader", { name: "Training set" })
    ).not.toBeInTheDocument();
  });

  it("shows table with session count and summary link when rows exist", () => {
    render(
      <CycleHistoryTable
        rows={[
          {
            cycleId: "c1",
            trainingSetId: "ts-a",
            cycleNumber: 1,
            trainingSetName: "Set A",
            totalTimeMs: 60_000,
            totalExercisesCompleted: 5,
            completedAt: "2025-01-01T12:00:00Z",
            sessionCount: 3,
          },
        ]}
      />
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Set A")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /view cycle summary/i });
    expect(link).toHaveAttribute("href", "/app/cycle/c1/summary");
  });
});
