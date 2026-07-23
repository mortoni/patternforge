import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MistakeReviewGameContext } from "./mistake-review-game-context";

const SOLUTION_NOTE = "1.Rf8+ Bxf8 2.d6+ Be6 3.Bxe6 mate";

describe("MistakeReviewGameContext", () => {
  it("renders game source as primary title", () => {
    render(
      <MistakeReviewGameContext gameSource="Wilhelm Steinitz – George Barry, Dublin (simul) 1865" />
    );
    expect(screen.getByText("Game context")).toBeInTheDocument();
    expect(
      screen.getByText(/Wilhelm Steinitz – George Barry, Dublin \(simul\) 1865/i)
    ).toBeInTheDocument();
  });

  it("hides the source note behind a Show solution toggle", () => {
    render(
      <MistakeReviewGameContext gameSource="A – B, Paris 1900" note={SOLUTION_NOTE} />
    );

    // The game title is not a spoiler and stays visible …
    expect(screen.getByText(/A – B, Paris 1900/i)).toBeInTheDocument();
    // … but the solution line must not be readable before asking for it.
    expect(screen.queryByText(SOLUTION_NOTE)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show solution/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("reveals and re-hides the note when the toggle is used", () => {
    render(
      <MistakeReviewGameContext gameSource="A – B, Paris 1900" note={SOLUTION_NOTE} />
    );

    fireEvent.click(screen.getByRole("button", { name: /show solution/i }));
    expect(screen.getByText(SOLUTION_NOTE)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /hide solution/i }));
    expect(screen.queryByText(SOLUTION_NOTE)).not.toBeInTheDocument();
  });

  it("reveals the note automatically once the attempt is resolved", () => {
    render(
      <MistakeReviewGameContext
        gameSource="A – B, Paris 1900"
        note={SOLUTION_NOTE}
        revealed
      />
    );
    expect(screen.getByText(SOLUTION_NOTE)).toBeInTheDocument();
  });

  it("shows the generic context note without a toggle when there is no source note", () => {
    render(<MistakeReviewGameContext gameSource="A – B, Paris 1900" />);
    expect(screen.getByText(/focus on the tactical idea/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /solution/i })).not.toBeInTheDocument();
  });
});
