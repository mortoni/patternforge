import { cn } from "@/lib/utils";
import {
  sideToMoveColorWord,
  type ChessSideToMove,
} from "@/lib/chess/side-to-move";

export interface SideToMoveIndicatorProps {
  sideToMove: ChessSideToMove;
  className?: string;
}

/**
 * Quiet, board-adjacent line: who is to move. Stateless; pass side from FEN or game state.
 */
export function SideToMoveIndicator({
  sideToMove,
  className,
}: SideToMoveIndicatorProps) {
  const color = sideToMoveColorWord(sideToMove);
  return (
    <p
      className={cn("text-base leading-snug sm:text-lg", className)}
      aria-live="polite"
    >
      <span className="font-semibold text-foreground">{color}</span>
      <span className="font-normal text-muted-foreground"> to move</span>
    </p>
  );
}
