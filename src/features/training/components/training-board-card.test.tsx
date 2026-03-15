import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { TrainingBoardCard } from "./training-board-card";

const capturedOptions: { current: Record<string, unknown> | null } = { current: null };

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
  });

  it("passes onSquareClick and onPieceDrop when not disabled", () => {
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
    expect(typeof capturedOptions.current!.onPieceDrop).toBe("function");
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
