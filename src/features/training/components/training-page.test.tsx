import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { TrainingPage } from "./training-page";

const mockUseActiveTraining = vi.fn();
vi.mock("../hooks/use-active-training", () => ({
  useActiveTraining: () => mockUseActiveTraining(),
}));

const mockSubmitAttempt = vi.fn();
const mockGoToNextPuzzle = vi.fn();
vi.mock("../services/training-solver.service", () => ({
  submitAttempt: (...args: unknown[]) => mockSubmitAttempt(...args),
  skipPuzzle: vi.fn(),
  goToNextPuzzle: (...args: unknown[]) => mockGoToNextPuzzle(...args),
}));

vi.mock("./training-board-card", () => ({
  TrainingBoardCard: ({
    fen,
    onMove,
    correctMoveUci,
    disabled,
  }: {
    fen: string;
    onMove?: (uci: string, newFen: string) => void;
    correctMoveUci?: string;
    disabled?: boolean;
  }) => (
    <div data-testid="training-board" data-correct-move-uci={correctMoveUci ?? ""} data-disabled={disabled}>
      Board: {fen.slice(0, 20)}…
      {!disabled && (
        <button
          type="button"
          onClick={() =>
            onMove?.(
              "e2e4",
              "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
            )
          }
        >
          Simulate move
        </button>
      )}
    </div>
  ),
}));
vi.mock("./training-side-panel", () => ({
  TrainingSidePanel: (props: { puzzleState?: string; onNextPuzzle?: () => void }) => (
    <div data-testid="training-side-panel">
      Side panel
      {props.puzzleState !== "correct" && props.puzzleState !== "incorrect" && (
        <button type="button">Skip Puzzle</button>
      )}
      {(props.puzzleState === "correct" || props.puzzleState === "incorrect") && (
        <button type="button" onClick={() => props.onNextPuzzle?.()}>
          Next Puzzle
        </button>
      )}
    </div>
  ),
}));

describe("TrainingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state when loading", () => {
    mockUseActiveTraining.mockReturnValue({
      state: null,
      loading: true,
      error: null,
      reload: vi.fn(),
    });
    render(<TrainingPage />);
    expect(screen.getByText(/loading training/i)).toBeInTheDocument();
  });

  it("shows empty state when no training set selected", async () => {
    mockUseActiveTraining.mockReturnValue({
      state: { status: "no-training-set" },
      loading: false,
      error: null,
      reload: vi.fn(),
    });
    render(<TrainingPage />);
    expect(screen.getByText("No active training selected")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /go to training sets/i })
    ).toHaveAttribute("href", "/app/sets");
  });

  it("shows empty state when no active cycle", () => {
    mockUseActiveTraining.mockReturnValue({
      state: {
        status: "no-active-cycle",
        trainingSetId: "set-1",
        trainingSetName: "Woodpecker Easy",
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });
    render(<TrainingPage />);
    expect(screen.getByText("No active cycle found")).toBeInTheDocument();
  });

  it("shows empty state when exercise not found", () => {
    mockUseActiveTraining.mockReturnValue({
      state: {
        status: "exercise-not-found",
        trainingSetId: "set-1",
        cycleRunId: "cycle-1",
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });
    render(<TrainingPage />);
    expect(screen.getByText("Current exercise not found")).toBeInTheDocument();
  });

  it("shows cycle complete when cycle is finished", () => {
    mockUseActiveTraining.mockReturnValue({
      state: {
        status: "cycle-complete",
        trainingSetId: "set-1",
        trainingSetName: "Woodpecker Easy",
        cycleNumber: 1,
        solvedCount: 5,
        totalExercises: 5,
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });
    render(<TrainingPage />);
    expect(screen.getByText("Cycle complete")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to training sets/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return to dashboard/i })).toBeInTheDocument();
  });

  it("renders training screen with board and side panel when ready", () => {
    mockUseActiveTraining.mockReturnValue({
      state: {
        status: "ready",
        sessionId: "session-1",
        trainingSet: { id: "set-1", name: "Woodpecker Easy" },
        cycleRun: {
          id: "c1",
          cycleNumber: 1,
          solvedCount: 0,
          totalExercises: 5,
          nextExerciseIndex: 0,
          status: "active",
        },
        exercise: {
          id: "ex-1",
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          sideToMove: "w",
          solutionMoves: [],
          gameSource: "Lichess",
          difficulty: "easy",
        },
        exerciseIndex: 0,
        totalExercises: 5,
        boardOrientation: "white",
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });
    render(<TrainingPage />);
    expect(screen.getByText("Training")).toBeInTheDocument();
    expect(screen.getByText(/Woodpecker Easy · Cycle 1/)).toBeInTheDocument();
    expect(screen.getByTestId("training-board")).toBeInTheDocument();
    expect(screen.getByTestId("training-side-panel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip puzzle/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /check move/i })).not.toBeInTheDocument();
  });

  it("submits attempt when user makes a move on the board", async () => {
    mockSubmitAttempt.mockResolvedValue({
      isCorrect: true,
      durationMs: 100,
      normalizedExpectedMove: "e2e4",
    });
    mockUseActiveTraining.mockReturnValue({
      state: {
        status: "ready",
        sessionId: "session-1",
        trainingSet: { id: "set-1", name: "Woodpecker Easy" },
        cycleRun: {
          id: "c1",
          cycleNumber: 1,
          solvedCount: 0,
          totalExercises: 5,
          nextExerciseIndex: 0,
          status: "active",
        },
        exercise: {
          id: "ex-1",
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          sideToMove: "w",
          solutionMoves: ["e4"],
          firstMove: "e2e4",
          gameSource: "Lichess",
          difficulty: "easy",
        },
        exerciseIndex: 0,
        totalExercises: 5,
        boardOrientation: "white",
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });
    render(<TrainingPage />);
    const simulateBtn = screen.getByRole("button", { name: /simulate move/i });
    await act(async () => {
      simulateBtn.click();
    });
    await vi.waitFor(() => {
      expect(mockSubmitAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          exerciseId: "ex-1",
          attemptedMoveUci: "e2e4",
          sessionId: "session-1",
        })
      );
    });
  });

  it("passes correctMoveUci to board when attempt is incorrect", async () => {
    mockSubmitAttempt.mockResolvedValue({
      isCorrect: false,
      durationMs: 50,
      normalizedExpectedMove: "e2e4",
    });
    mockUseActiveTraining.mockReturnValue({
      state: {
        status: "ready",
        sessionId: "session-1",
        trainingSet: { id: "set-1", name: "Woodpecker Easy" },
        cycleRun: {
          id: "c1",
          cycleNumber: 1,
          solvedCount: 0,
          totalExercises: 5,
          nextExerciseIndex: 0,
          status: "active",
        },
        exercise: {
          id: "ex-1",
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          sideToMove: "w",
          solutionMoves: ["e4"],
          firstMove: "e2e4",
          gameSource: "Lichess",
          difficulty: "easy",
        },
        exerciseIndex: 0,
        totalExercises: 5,
        boardOrientation: "white",
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });
    render(<TrainingPage />);
    const simulateBtn = screen.getByRole("button", { name: /simulate move/i });
    await act(async () => {
      simulateBtn.click();
    });
    await vi.waitFor(() => {
      expect(mockSubmitAttempt).toHaveBeenCalled();
    });
    const board = screen.getByTestId("training-board");
    expect(board).toHaveAttribute("data-correct-move-uci", "e2e4");
  });

  it("Next Puzzle only reloads (progression already committed on resolve)", async () => {
    const mockReload = vi.fn();
    mockSubmitAttempt.mockResolvedValue({
      isCorrect: true,
      durationMs: 100,
      normalizedExpectedMove: "e2e4",
    });
    mockUseActiveTraining.mockReturnValue({
      state: {
        status: "ready",
        sessionId: "session-1",
        trainingSet: { id: "set-1", name: "Woodpecker Easy" },
        cycleRun: {
          id: "c1",
          cycleNumber: 1,
          solvedCount: 0,
          totalExercises: 5,
          nextExerciseIndex: 0,
          status: "active",
        },
        exercise: {
          id: "ex-1",
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          sideToMove: "w",
          solutionMoves: ["e4"],
          firstMove: "e2e4",
          gameSource: "Lichess",
          difficulty: "easy",
        },
        exerciseIndex: 0,
        totalExercises: 5,
        boardOrientation: "white",
      },
      loading: false,
      error: null,
      reload: mockReload,
    });
    render(<TrainingPage />);
    await act(async () => {
      screen.getByRole("button", { name: /simulate move/i }).click();
    });
    await vi.waitFor(() => {
      expect(mockSubmitAttempt).toHaveBeenCalled();
    });
    expect(screen.getByRole("button", { name: /next puzzle/i })).toBeInTheDocument();
    await act(async () => {
      screen.getByRole("button", { name: /next puzzle/i }).click();
    });
    expect(mockReload).toHaveBeenCalled();
    expect(mockGoToNextPuzzle).not.toHaveBeenCalled();
  });
});
