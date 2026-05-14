import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { TrainingBoardCard } from "./training-board-card";
import type { PatternBoardProps } from "./pattern-board";

const capturedProps: { current: PatternBoardProps | null } = { current: null };

import { resolveBoardChessStyles } from "@/lib/chess/board-styles";

const classicLightSurface = resolveBoardChessStyles("classic", {
  colorScheme: "light",
});

vi.mock("@/features/settings/hooks/use-board-style", () => ({
  useBoardStyle: (): import("@/lib/chess/board-styles").ResolvedBoardChessStyles =>
    classicLightSurface,
}));

vi.mock("./pattern-board", () => ({
  PatternBoard: (props: PatternBoardProps) => {
    capturedProps.current = props;
    return <div data-testid="pattern-board" />;
  },
}));

describe("TrainingBoardCard", () => {
  const defaultFen =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  beforeEach(() => {
    capturedProps.current = null;
  });

  it("renders PatternBoard with fen and boardOrientation", () => {
    render(
      <TrainingBoardCard
        fen={defaultFen}
        boardOrientation="white"
      />
    );
    expect(capturedProps.current).not.toBeNull();
    expect(capturedProps.current!.fen).toBe(defaultFen);
    expect(capturedProps.current!.boardOrientation).toBe("white");
    expect(capturedProps.current!.surface.lightSquareStyle).toEqual(
      classicLightSurface.lightSquareStyle
    );
    expect(capturedProps.current!.surface.darkSquareStyle).toEqual(
      classicLightSurface.darkSquareStyle
    );
  });

  it("passes move callbacks when not disabled", () => {
    const onMove = vi.fn();
    render(
      <TrainingBoardCard
        fen={defaultFen}
        boardOrientation="white"
        onMove={onMove}
        disabled={false}
      />
    );
    expect(typeof capturedProps.current!.onMove).toBe("function");
    expect(capturedProps.current!.disabled).toBe(false);
  });

  it("passes correctMoveUci for drawable hint layer", () => {
    render(
      <TrainingBoardCard
        fen={defaultFen}
        boardOrientation="white"
        correctMoveUci="e2e4"
      />
    );
    expect(capturedProps.current!.correctMoveUci).toBe("e2e4");
  });

  it("omits correctMoveUci when unset", () => {
    render(
      <TrainingBoardCard
        fen={defaultFen}
        boardOrientation="white"
      />
    );
    expect(capturedProps.current!.correctMoveUci).toBeUndefined();
  });

  it("passes highlight square ids when provided", () => {
    render(
      <TrainingBoardCard
        fen={defaultFen}
        boardOrientation="white"
        correctMoveSquares={["e2", "e4"]}
        attemptedMoveSquares={["e2", "e3"]}
      />
    );
    expect(capturedProps.current!.correctMoveSquares).toEqual(["e2", "e4"]);
    expect(capturedProps.current!.attemptedMoveSquares).toEqual(["e2", "e3"]);
  });

  it("sets disabled on PatternBoard when disabled", () => {
    render(
      <TrainingBoardCard
        fen={defaultFen}
        boardOrientation="white"
        onMove={vi.fn()}
        disabled={true}
      />
    );
    expect(capturedProps.current!.disabled).toBe(true);
  });
});
