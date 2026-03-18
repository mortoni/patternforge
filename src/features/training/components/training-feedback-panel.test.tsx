import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrainingFeedbackPanel } from "./training-feedback-panel";

describe("TrainingFeedbackPanel", () => {
  it("shows Correct! and Good move when correct and no comment", () => {
    render(<TrainingFeedbackPanel state="correct" />);
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.getByText("Good move.")).toBeInTheDocument();
  });

  it("shows Correct! and comment when correct with comment", () => {
    render(
      <TrainingFeedbackPanel
        state="correct"
        comment="Black would have been lost without this resource."
      />
    );
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(
      screen.getByText("Black would have been lost without this resource.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Good move.")).not.toBeInTheDocument();
  });

  it("shows Incorrect with attempted and correct move when incorrect", () => {
    render(
      <TrainingFeedbackPanel
        state="incorrect"
        attemptedMove="e2e4"
        expectedMove="e7e5"
      />
    );
    expect(screen.getByText("Incorrect")).toBeInTheDocument();
    expect(screen.getByText(/you played:/i)).toBeInTheDocument();
    expect(screen.getByText(/correct move:/i)).toBeInTheDocument();
    expect(screen.getByText(/e2e4/)).toBeInTheDocument();
    expect(screen.getByText(/e7e5/)).toBeInTheDocument();
  });

  it("does not show You played when attemptedMove is empty", () => {
    render(
      <TrainingFeedbackPanel state="incorrect" expectedMove="e7e5" />
    );
    expect(screen.getByText("Incorrect")).toBeInTheDocument();
    expect(screen.queryByText(/you played:/i)).not.toBeInTheDocument();
    expect(screen.getByText(/correct move:/i)).toBeInTheDocument();
  });

});
