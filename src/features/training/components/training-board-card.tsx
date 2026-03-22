"use client";

import * as React from "react";
import { Chess } from "chess.js";
import {
  Chessboard,
  ChessboardProvider,
  useChessboardContext,
} from "react-chessboard";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getArrowFromUci } from "@/lib/chess/move-highlights";
import { useBoardStyle } from "@/features/settings/hooks/use-board-style";
import { MOVE_ANIMATION_MS } from "@/features/training/training-board-timing";

type TrainingSquare = string;

export interface TrainingBoardCardProps {
  /** Current position FEN (controlled). Updates after user makes a move. */
  fen: string;
  boardOrientation: "white" | "black";
  /** Called when user makes a legal move. Receives UCI and new FEN so parent can update. */
  onMove?: (uci: string, newFen: string) => void;
  /** When true, board is not interactive (e.g. after puzzle resolved). */
  disabled?: boolean;
  /** Square ids to highlight as the correct move (e.g. after incorrect result). */
  correctMoveSquares?: string[];
  /** Optional: square ids for the user's attempted move (subtle different style). */
  attemptedMoveSquares?: string[];
  /** UCI of the correct move when showing incorrect feedback; used to draw arrow. */
  correctMoveUci?: string;
  className?: string;
  /**
   * When true, omit the Card wrapper for a quieter layout (e.g. Training page).
   * Board interaction logic is unchanged.
   */
  minimal?: boolean;
  /**
   * Classes for the square board container (aspect-square). Use for responsive sizing, e.g.
   * `w-[min(92vw,calc(100dvh-14rem))]` so the board fits the viewport with header/footer.
   */
  boardContainerClassName?: string;
}

function isPawnPromotion(pieceType: string | undefined, targetSquare: string): boolean {
  if (!pieceType) return false;
  const rank = targetSquare[1];
  // react-chessboard uses wP / bP; FEN-style P / p also possible
  if (pieceType === "wP" || pieceType === "P")
    return rank === "8";
  if (pieceType === "bP" || pieceType === "p") return rank === "1";
  return false;
}

/** react-chessboard piece codes are wP, bK, … not single-letter FEN. */
function isOwnPiece(pieceType: string, turn: "w" | "b"): boolean {
  if (pieceType.startsWith("w")) return turn === "w";
  if (pieceType.startsWith("b")) return turn === "b";
  if (turn === "w") return pieceType === pieceType.toUpperCase();
  return pieceType === pieceType.toLowerCase();
}

function parseUci(uci: string): { from: string; to: string; promotion?: string } | null {
  const t = uci.trim().toLowerCase();
  if (t.length === 4) return { from: t.slice(0, 2), to: t.slice(2, 4) };
  if (t.length === 5 && /^[a-h][1-8][a-h][1-8][qnrb]$/.test(t)) {
    return { from: t.slice(0, 2), to: t.slice(2, 4), promotion: t[4] };
  }
  return null;
}

type LegalClickTargets = {
  legalTargetSquares: TrainingSquare[];
  captureSquares: Set<string>;
  moveForDestination: (to: TrainingSquare) => {
    uci: string;
    newFen: string;
  } | null;
};

/**
 * Legal moves from one square via chess.js (single source for click + drag hints).
 */
function getLegalInfo(fen: string, sourceSquare: TrainingSquare): LegalClickTargets {
  try {
    const chess = new Chess(fen);
    const verbose = chess.moves({
      square: sourceSquare as Parameters<Chess["moves"]>[0]["square"],
      verbose: true,
    });
    const legalTargetSquares = [...new Set(verbose.map((m) => m.to))];
    const captureSquares = new Set<string>();
    for (const m of verbose) {
      if (m.captured) captureSquares.add(m.to);
    }
    const moveMap = new Map<string, { uci: string; newFen: string }>();
    for (const m of verbose) {
      const uci = m.promotion
        ? `${m.from}${m.to}${m.promotion}`
        : `${m.from}${m.to}`;
      const c = new Chess(fen);
      c.move(m);
      moveMap.set(m.to, { uci, newFen: c.fen() });
    }
    return {
      legalTargetSquares,
      captureSquares,
      moveForDestination: (to: TrainingSquare) => moveMap.get(to) ?? null,
    };
  } catch {
    return {
      legalTargetSquares: [] as TrainingSquare[],
      captureSquares: new Set<string>(),
      moveForDestination: (to: TrainingSquare) => {
        void to;
        return null;
      },
    };
  }
}

const CORRECT_HIGHLIGHT: React.CSSProperties = {
  backgroundColor: "rgba(34, 197, 94, 0.35)",
};
const ATTEMPTED_HIGHLIGHT: React.CSSProperties = {
  backgroundColor: "rgba(239, 68, 68, 0.25)",
};
const SELECTED_SQUARE: React.CSSProperties = {
  backgroundColor: "rgba(59, 130, 246, 0.18)",
  boxShadow: "inset 0 0 0 2px rgba(59, 130, 246, 0.4)",
};
const LEGAL_DOT: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at center, rgba(148, 163, 184, 0.35) 0%, rgba(148, 163, 184, 0.35) 12%, transparent 13%)",
};
const LEGAL_CAPTURE_RING: React.CSSProperties = {
  boxShadow: "inset 0 0 0 3px rgba(248, 113, 113, 0.7)",
  borderRadius: "50%",
};

function ClearSelectionAfterDrag({
  onDragEnded,
}: {
  onDragEnded: () => void;
}) {
  const { draggingPiece } = useChessboardContext();
  const prev = React.useRef(draggingPiece);
  React.useEffect(() => {
    if (prev.current != null && draggingPiece === null) {
      onDragEnded();
    }
    prev.current = draggingPiece;
  }, [draggingPiece, onDragEnded]);
  return null;
}

export function TrainingBoardCard({
  fen,
  boardOrientation,
  onMove,
  disabled = false,
  correctMoveSquares,
  attemptedMoveSquares,
  correctMoveUci,
  className,
  minimal = false,
  boardContainerClassName,
}: TrainingBoardCardProps) {
  const surface = useBoardStyle();

  const [selectedSquare, setSelectedSquare] =
    React.useState<TrainingSquare | null>(null);
  const selectedRef = React.useRef<TrainingSquare | null>(null);

  React.useEffect(() => {
    selectedRef.current = selectedSquare;
  }, [selectedSquare]);

  React.useEffect(() => {
    setSelectedSquare(null);
  }, [fen, disabled]);

  const { legalTargetSquares, captureSquares } = React.useMemo(() => {
      if (!selectedSquare) {
        return {
          legalTargetSquares: [] as TrainingSquare[],
          captureSquares: new Set<string>(),
        };
      }
      return getLegalInfo(fen, selectedSquare);
    }, [fen, selectedSquare]);

  const squareStyles = React.useMemo(() => {
    const sel = surface.interaction?.selectedSquare ?? SELECTED_SQUARE;
    const dot = surface.interaction?.legalDot ?? LEGAL_DOT;
    const cap = surface.interaction?.legalCapture ?? LEGAL_CAPTURE_RING;

    const out: Record<string, React.CSSProperties> = {};
    if (correctMoveSquares?.length) {
      for (const sq of correctMoveSquares) {
        out[sq] = CORRECT_HIGHLIGHT;
      }
    }
    if (attemptedMoveSquares?.length) {
      for (const sq of attemptedMoveSquares) {
        if (!out[sq]) out[sq] = ATTEMPTED_HIGHLIGHT;
      }
    }
    if (selectedSquare && !disabled && onMove) {
      out[selectedSquare] = {
        ...sel,
        ...(out[selectedSquare] ?? {}),
      };
      for (const sq of legalTargetSquares) {
        if (out[sq] && sq !== selectedSquare) continue;
        if (sq === selectedSquare) continue;
        out[sq] = captureSquares.has(sq) ? cap : dot;
      }
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }, [
    surface.interaction,
    correctMoveSquares,
    attemptedMoveSquares,
    selectedSquare,
    legalTargetSquares,
    captureSquares,
    disabled,
    onMove,
  ]);

  const clearAfterDrag = React.useCallback(() => {
    setSelectedSquare(null);
  }, []);

  const handleSquareInteraction = React.useCallback(
    (piece: { pieceType: string } | null, square: TrainingSquare) => {
      if (disabled || !onMove) return;
      let chess: Chess;
      try {
        chess = new Chess(fen);
      } catch {
        return;
      }
      const turn = chess.turn();
      const own = piece ? isOwnPiece(piece.pieceType, turn) : false;
      const sel = selectedRef.current;

      if (sel) {
        if (square === sel) {
          setSelectedSquare(null);
          return;
        }
        const { legalTargetSquares: targets, moveForDestination: moveFn } =
          getLegalInfo(fen, sel);
        if (targets.includes(square)) {
          const data = moveFn(square);
          if (data) {
            onMove(data.uci, data.newFen);
            setSelectedSquare(null);
          }
          return;
        }
        if (own) {
          setSelectedSquare(square);
          return;
        }
        setSelectedSquare(null);
        return;
      }
      if (own) setSelectedSquare(square);
    },
    [fen, disabled, onMove]
  );

  const onPieceClick = React.useCallback(
    ({
      isSparePiece,
      piece,
      square,
    }: {
      isSparePiece: boolean;
      piece: { pieceType: string };
      square: string | null;
    }) => {
      if (isSparePiece || !square) return;
      handleSquareInteraction(piece, square);
    },
    [handleSquareInteraction]
  );

  const onSquareClick = React.useCallback(
    ({
      piece,
      square,
    }: {
      piece: { pieceType: string } | null;
      square: string;
    }) => {
      handleSquareInteraction(piece, square);
    },
    [handleSquareInteraction]
  );

  const onPieceDrag = React.useCallback(
    ({
      isSparePiece,
      piece,
      square,
    }: {
      isSparePiece: boolean;
      piece: { pieceType: string };
      square: string | null;
    }) => {
      if (disabled || !onMove || isSparePiece || !square) return;
      try {
        const chess = new Chess(fen);
        if (!isOwnPiece(piece.pieceType, chess.turn())) return;
        setSelectedSquare(square);
      } catch {
        /* invalid FEN */
      }
    },
    [fen, disabled, onMove]
  );

  const canDragPiece = React.useCallback(
    ({
      isSparePiece,
      piece,
    }: {
      isSparePiece: boolean;
      piece: { pieceType: string };
      square: string | null;
    }) => {
      if (disabled || !onMove || isSparePiece) return false;
      try {
        return isOwnPiece(piece.pieceType, new Chess(fen).turn());
      } catch {
        return false;
      }
    },
    [fen, disabled, onMove]
  );

  const arrows = React.useMemo(() => {
    if (!correctMoveUci) return undefined;
    const arrow = getArrowFromUci(correctMoveUci);
    return arrow ? [arrow] : undefined;
  }, [correctMoveUci]);

  const onPieceDrop = React.useCallback(
    ({
      sourceSquare,
      targetSquare,
      piece,
    }: {
      sourceSquare: string;
      targetSquare: string | null;
      piece?: { pieceType?: string };
    }) => {
      if (disabled || !onMove || !targetSquare) return false;
      setSelectedSquare(null);
      const promotion = isPawnPromotion(piece?.pieceType, targetSquare)
        ? "q"
        : undefined;
      const uci = promotion
        ? `${sourceSquare}${targetSquare}${promotion}`
        : `${sourceSquare}${targetSquare}`;
      try {
        const chess = new Chess(fen);
        const parsed = parseUci(uci);
        const made = parsed ? chess.move(parsed) : chess.move(uci);
        if (!made) return false;
        const m = made as { from: string; to: string; promotion?: string };
        const normalizedUci = `${m.from}${m.to}${m.promotion ?? ""}`;
        onMove(normalizedUci, chess.fen());
        return true;
      } catch {
        return false;
      }
    },
    [fen, disabled, onMove]
  );

  const options = React.useMemo(
    () => ({
      position: fen,
      boardOrientation,
      animationDurationInMs: MOVE_ANIMATION_MS,
      showAnimations: true,
      lightSquareStyle: surface.lightSquareStyle,
      darkSquareStyle: surface.darkSquareStyle,
      ...(surface.boardStyle != null && { boardStyle: surface.boardStyle }),
      ...(surface.notation && {
        darkSquareNotationStyle: surface.notation.darkSquareNotationStyle,
        lightSquareNotationStyle: surface.notation.lightSquareNotationStyle,
      }),
      ...(surface.pieces && { pieces: surface.pieces }),
      allowDragging: !disabled,
      /** Default 1px makes almost every pointer move a drag; clicks never register. */
      dragActivationDistance: 8,
      allowDrawingArrows: false,
      canDragPiece,
      onPieceClick,
      onPieceDrag,
      onPieceDrop,
      onSquareClick,
      ...(squareStyles && { squareStyles }),
      ...(arrows?.length && { arrows }),
    }),
    [
      fen,
      boardOrientation,
      surface.lightSquareStyle,
      surface.darkSquareStyle,
      surface.boardStyle,
      surface.notation,
      surface.pieces,
      disabled,
      canDragPiece,
      onPieceClick,
      onPieceDrag,
      onPieceDrop,
      onSquareClick,
      squareStyles,
      arrows,
    ]
  );

  const frame = surface.frame;
  const boardShell = (
    <div
      className={cn(
        "aspect-square overflow-hidden rounded-md border",
        boardContainerClassName ??
          "w-full max-w-[min(100%,42rem)]",
        !frame && "border-border bg-muted/30",
        minimal && !frame && "rounded-sm border-border/50 bg-muted/20",
        minimal && frame && "rounded-sm",
        !minimal && frame && "rounded-md"
      )}
      style={
        frame
          ? {
              backgroundColor: frame.backgroundColor,
              borderColor: frame.borderColor,
            }
          : undefined
      }
    >
      <ChessboardProvider options={options}>
        <ClearSelectionAfterDrag onDragEnded={clearAfterDrag} />
        <Chessboard />
      </ChessboardProvider>
    </div>
  );

  if (minimal) {
    return (
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center",
          className
        )}
      >
        {boardShell}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border border-border bg-card",
        className
      )}
    >
      <CardContent className="flex flex-col items-center p-4 md:p-6">
        {boardShell}
      </CardContent>
    </Card>
  );
}
