import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrainingSidePanel } from "./training-side-panel";

describe("TrainingSidePanel", () => {
  const defaultProps = {
    exerciseIndex: 0,
    totalExercises: 5,
    trainingSetName: "Sample Set",
    cycleNumber: 1,
    solvedCount: 0,
    sideToMove: "w" as const,
    puzzleState: "idle" as const,
  };

  it("shows Skip Puzzle when not resolved and no Check Move button", () => {
    render(
      <TrainingSidePanel {...defaultProps} puzzleState="idle" onSkipPuzzle={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: /skip puzzle/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /check move/i })).not.toBeInTheDocument();
  });

  it("disables Skip Puzzle when checking", () => {
    render(
      <TrainingSidePanel
        {...defaultProps}
        puzzleState="checking"
        onSkipPuzzle={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /skip puzzle/i })).toBeDisabled();
  });

  it("shows Next Puzzle when correct", () => {
    render(
      <TrainingSidePanel {...defaultProps} puzzleState="correct" onNextPuzzle={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: /next puzzle/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /check move/i })).not.toBeInTheDocument();
  });

  it("shows Next Puzzle when incorrect", () => {
    render(
      <TrainingSidePanel {...defaultProps} puzzleState="incorrect" onNextPuzzle={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: /next puzzle/i })).toBeInTheDocument();
  });

  it("shows Finish the combination and does not show Next when correct_so_far", () => {
    render(
      <TrainingSidePanel {...defaultProps} puzzleState="correct_so_far" />
    );
    expect(screen.getByText(/finish the combination/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /next puzzle/i })).not.toBeInTheDocument();
  });
});
