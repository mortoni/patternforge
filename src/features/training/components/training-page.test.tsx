import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { TrainingPage } from "./training-page";

const mockUseActiveTraining = vi.fn();
vi.mock("../hooks/use-active-training", () => ({
  useActiveTraining: () => mockUseActiveTraining(),
}));

const mockSubmitAttempt = vi.fn();
const mockGoToNextPuzzle = vi.fn();
let simulatedMoveUci = "e2e4";
let simulatedNextFen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
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
              simulatedMoveUci,
              simulatedNextFen
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
    window.localStorage.clear();
    simulatedMoveUci = "e2e4";
    simulatedNextFen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
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
        trainingSetName: "Sample Set",
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
        trainingSetName: "Sample Set",
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
        trainingSet: { id: "set-1", name: "Sample Set" },
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
    expect(screen.getByText(/Sample Set · Cycle 1/)).toBeInTheDocument();
    expect(screen.getByTestId("training-board")).toBeInTheDocument();
    expect(screen.getByTestId("training-side-panel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip puzzle/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /check move/i })).not.toBeInTheDocument();
    expect(screen.getByText("Your turn")).toBeInTheDocument();
    expect(screen.getByText("Find the best move for white.")).toBeInTheDocument();
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
        trainingSet: { id: "set-1", name: "Sample Set" },
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
        trainingSet: { id: "set-1", name: "Sample Set" },
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
    expect(screen.getByText("Incorrect")).toBeInTheDocument();
    expect(screen.getByText(/you played:/i)).toBeInTheDocument();
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
        trainingSet: { id: "set-1", name: "Sample Set" },
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
    mockSubmitAttempt.mockResolvedValue({
      isCorrect: true,
      puzzleComplete: true,
      normalizedAttemptedMove: "e2e4",
      normalizedExpectedMove: "e2e4",
      durationMs: 100,
    });
    await act(async () => {
      screen.getByRole("button", { name: /simulate move/i }).click();
    });
    await vi.waitFor(() => {
      expect(mockSubmitAttempt).toHaveBeenCalled();
    });
    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: /next puzzle/i })).toBeInTheDocument();
    });
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.queryByText("Good move.")).not.toBeInTheDocument();
    await act(async () => {
      screen.getByRole("button", { name: /next puzzle/i }).click();
    });
    expect(mockReload).toHaveBeenCalled();
    expect(mockGoToNextPuzzle).not.toHaveBeenCalled();
  });

  it("shows puzzle comment in status panel after full correct solve", async () => {
    mockSubmitAttempt.mockResolvedValue({
      isCorrect: true,
      puzzleComplete: true,
      normalizedAttemptedMove: "e2e4",
      normalizedExpectedMove: "e2e4",
      durationMs: 100,
    });
    mockUseActiveTraining.mockReturnValue({
      state: {
        status: "ready",
        sessionId: "session-1",
        trainingSet: { id: "set-1", name: "Sample Set" },
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
          comment: "Controls the center.",
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
    await act(async () => {
      screen.getByRole("button", { name: /simulate move/i }).click();
    });
    await vi.waitFor(() => {
      expect(screen.getByText("Correct!")).toBeInTheDocument();
    });
    expect(screen.getByText("Controls the center.")).toBeInTheDocument();
  });

  it("shows SAN notation for attempted and expected moves in incorrect feedback", async () => {
    simulatedMoveUci = "f3g3";
    simulatedNextFen = "4k3/8/8/8/8/6R1/8/4K3 b - - 0 1";
    mockSubmitAttempt.mockResolvedValue({
      isCorrect: false,
      durationMs: 80,
      normalizedExpectedMove: "f3f8",
    });
    mockUseActiveTraining.mockReturnValue({
      state: {
        status: "ready",
        sessionId: "session-1",
        trainingSet: { id: "set-1", name: "Sample Set" },
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
          fen: "4k3/8/8/8/8/5Rr1/8/4K3 w - - 0 1",
          sideToMove: "w",
          solutionMoves: ["Rf8+"],
          firstMove: "f3f8",
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
    await act(async () => {
      screen.getByRole("button", { name: /simulate move/i }).click();
    });

    await vi.waitFor(() => {
      expect(screen.getByText("Incorrect")).toBeInTheDocument();
    });
    expect(screen.getByText("Rxg3")).toBeInTheDocument();
    expect(screen.getByText("Rf8+")).toBeInTheDocument();
  });
});
