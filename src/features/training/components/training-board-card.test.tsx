import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { TrainingBoardCard } from "./training-board-card";

const capturedOptions: { current: Record<string, unknown> | null } = { current: null };

vi.mock("@/features/settings/hooks/use-board-style", () => ({
  useBoardStyle: () => ({
    lightSquareStyle: { backgroundColor: "#F0D9B5" },
    darkSquareStyle: { backgroundColor: "#B58863" },
    boardStyle: undefined,
    frame: null,
    interaction: undefined,
    notation: undefined,
    pieces: undefined,
  }),
}));

vi.mock("react-chessboard", () => ({
  ChessboardProvider: ({
    options,
    children,
  }: {
    options: Record<string, unknown>;
    children: React.ReactNode;
  }) => {
    capturedOptions.current = options;
    return <div data-testid="chessboard-provider">{children}</div>;
  },
  Chessboard: () => <div data-testid="chessboard" />,
  useChessboardContext: () => ({ draggingPiece: null }),
}));

describe("TrainingBoardCard", () => {
  const defaultFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  beforeEach(() => {
    capturedOptions.current = null;
  });

  it("renders and passes position and boardOrientation to the board", () => {
    render(
      <TrainingBoardCard
        fen={defaultFen}
        boardOrientation="white"
      />
    );
    expect(capturedOptions.current).not.toBeNull();
    expect(capturedOptions.current!.position).toBe(defaultFen);
    expect(capturedOptions.current!.boardOrientation).toBe("white");
    expect(capturedOptions.current!.lightSquareStyle).toEqual({
      backgroundColor: "#F0D9B5",
    });
    expect(capturedOptions.current!.darkSquareStyle).toEqual({
      backgroundColor: "#B58863",
    });
  });

  it("passes click/drag handlers and drag activation when not disabled", () => {
    const onMove = vi.fn();
    render(
      <TrainingBoardCard
        fen={defaultFen}
        boardOrientation="white"
        onMove={onMove}
        disabled={false}
      />
    );
    expect(typeof capturedOptions.current!.onSquareClick).toBe("function");
    expect(typeof capturedOptions.current!.onPieceClick).toBe("function");
    expect(typeof capturedOptions.current!.onPieceDrag).toBe("function");
    expect(typeof capturedOptions.current!.onPieceDrop).toBe("function");
    expect(typeof capturedOptions.current!.canDragPiece).toBe("function");
    expect(capturedOptions.current!.dragActivationDistance).toBe(8);
    expect(capturedOptions.current!.animationDurationInMs).toBe(220);
    expect(capturedOptions.current!.showAnimations).toBe(true);
  });

  it("passes arrows when correctMoveUci is set", () => {
    render(
      <TrainingBoardCard
        fen={defaultFen}
        boardOrientation="white"
        correctMoveUci="e2e4"
      />
    );
    expect(capturedOptions.current!.arrows).toEqual([
      expect.objectContaining({
        startSquare: "e2",
        endSquare: "e4",
        color: expect.any(String),
      }),
    ]);
  });

  it("does not pass arrows when correctMoveUci is undefined", () => {
    render(
      <TrainingBoardCard
        fen={defaultFen}
        boardOrientation="white"
      />
    );
    expect(capturedOptions.current!.arrows).toBeUndefined();
  });

  it("passes squareStyles for correct and attempted move when provided", () => {
    render(
      <TrainingBoardCard
        fen={defaultFen}
        boardOrientation="white"
        correctMoveSquares={["e2", "e4"]}
        attemptedMoveSquares={["e2", "e3"]}
      />
    );
    const styles = capturedOptions.current!.squareStyles as Record<string, unknown>;
    expect(styles).toBeDefined();
    expect(Object.keys(styles)).toContain("e2");
    expect(Object.keys(styles)).toContain("e4");
    expect(Object.keys(styles)).toContain("e3");
  });

  it("sets allowDragging false when disabled", () => {
    render(
      <TrainingBoardCard
        fen={defaultFen}
        boardOrientation="white"
        onMove={vi.fn()}
        disabled={true}
      />
    );
    expect(capturedOptions.current!.allowDragging).toBe(false);
  });
});
