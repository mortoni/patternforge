import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrainingPuzzleStatusPanel } from "./training-puzzle-status-panel";

describe("TrainingPuzzleStatusPanel", () => {
  it("turn variant shows generic continuation hint", () => {
    const { rerender } = render(
      <TrainingPuzzleStatusPanel variant="turn" sideToMove="w" />
    );
    expect(screen.getByText("Your turn")).toBeInTheDocument();
    expect(
      screen.getByText("Find the best continuation.")
    ).toBeInTheDocument();
    rerender(<TrainingPuzzleStatusPanel variant="turn" sideToMove="b" />);
    expect(screen.getByText("Find the best continuation.")).toBeInTheDocument();
  });

  it("correct shows title only when no comment", () => {
    render(<TrainingPuzzleStatusPanel variant="correct" sideToMove="w" />);
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.queryByText("Good move.")).not.toBeInTheDocument();
  });

  it("correct shows comment subtitle when provided", () => {
    render(
      <TrainingPuzzleStatusPanel
        variant="correct"
        sideToMove="w"
        comment="  Tactical shot.  "
      />
    );
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.getByText("Tactical shot.")).toBeInTheDocument();
  });

  it("incorrect shows move lines like bottom panel did", () => {
    render(
      <TrainingPuzzleStatusPanel
        variant="incorrect"
        sideToMove="w"
        attemptedMove="e2e4"
        expectedMove="d7d5"
      />
    );
    expect(screen.getByText("Incorrect")).toBeInTheDocument();
    expect(screen.getByText(/you played:/i)).toBeInTheDocument();
    expect(screen.getByText(/correct move:/i)).toBeInTheDocument();
    expect(screen.getByText("e2e4")).toBeInTheDocument();
    expect(screen.getByText("d7d5")).toBeInTheDocument();
  });
});
