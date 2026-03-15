import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MistakeReviewPage } from "./mistake-review-page";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUseMistakeReview = vi.fn();
const mockSubmitReviewAttempt = vi.fn();
const mockGetActiveMistakes = vi.fn();

vi.mock("../hooks/use-mistake-review", () => ({
  useMistakeReview: (id: string | null) => mockUseMistakeReview(id),
}));
vi.mock("../services/mistake-review-flow.service", () => ({
  submitReviewAttempt: (...args: unknown[]) => mockSubmitReviewAttempt(...args),
  skipReviewAttempt: vi.fn(),
  getActiveMistakes: () => mockGetActiveMistakes(),
}));
vi.mock("@/features/training/components/training-board-card", () => ({
  TrainingBoardCard: ({
    onMove,
    disabled,
    correctMoveUci,
  }: {
    onMove?: (uci: string, fen: string) => void;
    disabled?: boolean;
    correctMoveUci?: string;
  }) => (
    <div data-testid="board" data-correct-move-uci={correctMoveUci ?? ""}>
      <button
        type="button"
        onClick={() => onMove?.("e2e4", "fen-after")}
        disabled={disabled}
      >
        Make move
      </button>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MistakeReviewPage", () => {
  it("shows loading when state is loading", () => {
    mockUseMistakeReview.mockReturnValue({
      state: null,
      loading: true,
      error: null,
      reload: vi.fn(),
    });
    render(<MistakeReviewPage mistakeId="m1" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows not found when state is null", () => {
    mockUseMistakeReview.mockReturnValue({
      state: null,
      loading: false,
      error: null,
      reload: vi.fn(),
    });
    render(<MistakeReviewPage mistakeId="m1" />);
    expect(screen.getByText("Mistake not found")).toBeInTheDocument();
  });

  it("submits on move and shows correct feedback", async () => {
    mockUseMistakeReview.mockReturnValue({
      state: {
        mistake: {
          id: "m1",
          status: "needs_review",
          failedAttempts: 1,
          solvedReviewCount: 0,
          exerciseId: "ex1",
          trainingSetId: "set1",
          createdAt: "",
        },
        exercise: {
          id: "ex1",
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          sideToMove: "w",
          firstMove: "e2e4",
          solutionMoves: ["e2e4"],
        },
        trainingSet: { id: "set1", name: "Easy Set" },
        boardOrientation: "white",
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });
    mockSubmitReviewAttempt.mockResolvedValue({
      isCorrect: true,
      normalizedAttemptedMove: "e2e4",
      normalizedExpectedMove: "e2e4",
      newStatus: "solved_once",
    });
    render(<MistakeReviewPage mistakeId="m1" />);
    fireEvent.click(screen.getByRole("button", { name: /make move/i }));
    expect(mockSubmitReviewAttempt).toHaveBeenCalled();
    expect(await screen.findByText("Correct!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next mistake/i })).toBeInTheDocument();
  });

  it("passes correctMoveUci to board when attempt is incorrect", async () => {
    mockUseMistakeReview.mockReturnValue({
      state: {
        mistake: {
          id: "m1",
          status: "needs_review",
          failedAttempts: 1,
          solvedReviewCount: 0,
          exerciseId: "ex1",
          trainingSetId: "set1",
          createdAt: "",
        },
        exercise: {
          id: "ex1",
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          sideToMove: "w",
          firstMove: "e2e4",
          solutionMoves: ["e2e4"],
        },
        trainingSet: { id: "set1", name: "Easy Set" },
        boardOrientation: "white",
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });
    mockSubmitReviewAttempt.mockResolvedValue({
      isCorrect: false,
      normalizedAttemptedMove: "e2e3",
      normalizedExpectedMove: "e2e4",
      newStatus: "needs_review",
    });
    render(<MistakeReviewPage mistakeId="m1" />);
    fireEvent.click(screen.getByRole("button", { name: /make move/i }));
    expect(await screen.findByText(/incorrect/i)).toBeInTheDocument();
    const board = screen.getByTestId("board");
    expect(board).toHaveAttribute("data-correct-move-uci", "e2e4");
  });
});
