import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentSessionsList } from "./recent-sessions-list";

describe("RecentSessionsList", () => {
  it("shows empty state when no sessions", () => {
    render(<RecentSessionsList sessions={[]} />);
    expect(screen.getByText(/no sessions yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to training/i })).toHaveAttribute(
      "href",
      "/app/training"
    );
  });

  it("renders recent sessions from real data", () => {
    const sessions = [
      {
        id: "s1",
        trainingSetId: "set-1",
        trainingSetName: "Woodpecker Easy",
        endedAt: "2025-03-12T10:00:00Z",
        puzzlesAttempted: 10,
        correctCount: 8,
        skippedCount: 1,
        accuracy: 0.8,
        activeTimeMs: 300000,
      },
    ];
    render(<RecentSessionsList sessions={sessions} />);
    expect(screen.getByText("Woodpecker Easy")).toBeInTheDocument();
    expect(screen.getByText(/10 attempted/)).toBeInTheDocument();
    expect(screen.getByText(/80% correct/)).toBeInTheDocument();
    expect(screen.getByText("5m")).toBeInTheDocument();
  });
});
