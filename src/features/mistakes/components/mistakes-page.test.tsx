import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MistakesPage } from "./mistakes-page";

const mockUseMistakesList = vi.fn();
vi.mock("../hooks/use-mistakes-list", () => ({
  useMistakesList: () => mockUseMistakesList(),
}));

describe("MistakesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state when loading", () => {
    mockUseMistakesList.mockReturnValue({
      rows: [],
      summary: null,
      loading: true,
      error: null,
      reload: vi.fn(),
    });
    render(<MistakesPage />);
    expect(screen.getByText(/loading mistakes/i)).toBeInTheDocument();
  });

  it("shows empty state when no active mistakes", async () => {
    mockUseMistakesList.mockReturnValue({
      rows: [],
      summary: {
        needsReview: 0,
        solvedOnce: 0,
        solvedTwice: 0,
        mastered: 0,
        activeCount: 0,
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });
    render(<MistakesPage />);
    expect(screen.getByText("No mistakes to review")).toBeInTheDocument();
    expect(
      screen.getByText(/incorrect and skipped puzzles will appear here/i)
    ).toBeInTheDocument();
  });

  it("shows table and summary when active mistakes exist", () => {
    mockUseMistakesList.mockReturnValue({
      rows: [
        {
          id: "m1",
          exerciseId: "ex1",
          trainingSetId: "set1",
          trainingSetName: "Sample Set",
          puzzleLabel: "1 · Lichess",
          difficulty: "easy",
          failedAttempts: 1,
          status: "needs_review",
          lastReviewedAt: null,
        },
      ],
      summary: {
        needsReview: 1,
        solvedOnce: 0,
        solvedTwice: 0,
        mastered: 0,
        activeCount: 1,
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });
    render(<MistakesPage />);
    expect(screen.getByText("Mistakes Review")).toBeInTheDocument();
    expect(screen.getAllByText("1 · Lichess").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /review puzzle/i }).length).toBeGreaterThanOrEqual(1);
  });
});
