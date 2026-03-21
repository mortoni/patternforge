import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MistakeReviewGameContext } from "./mistake-review-game-context";

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

  it("renders source comment when available", () => {
    render(
      <MistakeReviewGameContext
        gameSource="A – B, Paris 1900"
        note="Black would have been lost without this resource."
      />
    );
    expect(
      screen.getByText(/Black would have been lost without this resource/i)
    ).toBeInTheDocument();
  });
});
