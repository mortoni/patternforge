"use client";

import * as React from "react";
import { Chess } from "chess.js";
import { Chessboard, ChessboardProvider } from "react-chessboard";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getArrowFromUci } from "@/lib/chess/move-highlights";

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
}

function isPawnPromotion(pieceType: string | undefined, targetSquare: string): boolean {
  if (!pieceType) return false;
  const rank = targetSquare[1];
  return (
    (pieceType === "p" && rank === "8") || (pieceType === "P" && rank === "1")
  );
}

function parseUci(uci: string): { from: string; to: string; promotion?: string } | null {
  const t = uci.trim().toLowerCase();
  if (t.length === 4) return { from: t.slice(0, 2), to: t.slice(2, 4) };
  if (t.length === 5 && /^[a-h][1-8][a-h][1-8][qnrb]$/.test(t)) {
    return { from: t.slice(0, 2), to: t.slice(2, 4), promotion: t[4] };
  }
  return null;
}

/**
 * Renders the puzzle position. When onMove is provided and not disabled,
 * user can make one move; the move is validated with chess.js and reported as UCI.
 */
const CORRECT_HIGHLIGHT: React.CSSProperties = {
  backgroundColor: "rgba(34, 197, 94, 0.35)",
};
const ATTEMPTED_HIGHLIGHT: React.CSSProperties = {
  backgroundColor: "rgba(239, 68, 68, 0.25)",
};
const SELECTED_SQUARE: React.CSSProperties = {
  backgroundColor: "rgba(59, 130, 246, 0.5)",
};
const LEGAL_TARGET: React.CSSProperties = {
  backgroundColor: "rgba(59, 130, 246, 0.25)",
};

/** Returns true if piece is for the side to move (white = uppercase, black = lowercase). */
function isOwnPiece(pieceType: string, turn: "w" | "b"): boolean {
  if (turn === "w") return pieceType === pieceType.toUpperCase();
  return pieceType === pieceType.toLowerCase();
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
}: TrainingBoardCardProps) {
  const [selectedSquare, setSelectedSquare] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSelectedSquare(null);
  }, [fen, disabled]);

  const { legalDestinationSquares, moveForDestination } = React.useMemo(() => {
    if (!selectedSquare) return { legalDestinationSquares: [] as string[], moveForDestination: (_: string) => null as { uci: string; newFen: string } | null };
    try {
      const chess = new Chess(fen);
      const verbose = chess.moves({ square: selectedSquare as Parameters<Chess["moves"]>[0]["square"], verbose: true });
      const dests = verbose.map((m) => m.to);
      const moveMap = new Map<string, { uci: string; newFen: string }>();
      for (const m of verbose) {
        const uci = m.promotion ? `${m.from}${m.to}${m.promotion}` : `${m.from}${m.to}`;
        const c = new Chess(fen);
        c.move(m);
        moveMap.set(m.to, { uci, newFen: c.fen() });
      }
      return {
        legalDestinationSquares: dests,
        moveForDestination: (to: string) => moveMap.get(to) ?? null,
      };
    } catch {
      return { legalDestinationSquares: [] as string[], moveForDestination: (_: string) => null };
    }
  }, [fen, selectedSquare]);

  const squareStyles = React.useMemo(() => {
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
    if (selectedSquare && !disabled) {
      out[selectedSquare] = SELECTED_SQUARE;
      for (const sq of legalDestinationSquares) {
        if (!out[sq]) out[sq] = LEGAL_TARGET;
      }
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }, [correctMoveSquares, attemptedMoveSquares, selectedSquare, legalDestinationSquares, disabled]);

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

  const onSquareClick = React.useCallback(
    ({ piece, square }: { piece: { pieceType: string } | null; square: string }) => {
      if (disabled || !onMove) return;
      let chess: Chess;
      try {
        chess = new Chess(fen);
      } catch {
        return;
      }
      const turn = chess.turn();
      const own = piece ? isOwnPiece(piece.pieceType, turn) : false;

      if (selectedSquare) {
        if (square === selectedSquare) {
          setSelectedSquare(null);
          return;
        }
        if (legalDestinationSquares.includes(square)) {
          const moveData = moveForDestination(square);
          if (moveData) {
            onMove(moveData.uci, moveData.newFen);
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
    [fen, disabled, onMove, selectedSquare, legalDestinationSquares, moveForDestination]
  );

  const options = React.useMemo(
    () => ({
      position: fen,
      boardOrientation,
      allowDragging: !disabled,
      allowDrawingArrows: false,
      onPieceDrop,
      onSquareClick,
      ...(squareStyles && { squareStyles }),
      ...(arrows?.length && { arrows }),
    }),
    [fen, boardOrientation, disabled, onPieceDrop, onSquareClick, squareStyles, arrows]
  );

  return (
    <Card
      className={cn(
        "overflow-hidden border border-border bg-card",
        className
      )}
    >
      <CardContent className="flex flex-col items-center p-4 md:p-6">
        <div className="w-full max-w-[min(100%,28rem)] aspect-square rounded-md overflow-hidden border border-border bg-muted/30">
          <ChessboardProvider options={options}>
            <Chessboard />
          </ChessboardProvider>
        </div>
      </CardContent>
    </Card>
  );
}
