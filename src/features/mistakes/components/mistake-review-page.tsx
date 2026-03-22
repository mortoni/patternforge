"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMistakeReview } from "../hooks/use-mistake-review";
import { TrainingBoardCard } from "@/features/training/components/training-board-card";
import { TrainingFeedbackPanel } from "@/features/training/components/training-feedback-panel";
import { MistakeReviewSidePanel } from "./mistake-review-side-panel";
import type { ReviewInteractionState } from "./mistake-review-side-panel";
import { getHighlightedSquaresFromMove } from "@/lib/chess/move-highlights";
import {
  parseSideToMoveFromFen,
  type ChessSideToMove,
} from "@/lib/chess/side-to-move";
import {
  submitReviewAttempt,
  skipReviewAttempt,
  getActiveMistakes,
} from "../services/mistake-review-flow.service";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export interface MistakeReviewPageProps {
  mistakeId: string;
}

export function MistakeReviewPage({ mistakeId }: MistakeReviewPageProps) {
  const router = useRouter();
  const { state, loading, error } = useMistakeReview(mistakeId);

  const [positionFen, setPositionFen] = React.useState<string | null>(null);
  const [attemptedMoveUci, setAttemptedMoveUci] = React.useState<string | null>(null);
  const [puzzleState, setPuzzleState] = React.useState<ReviewInteractionState>("idle");
  const [feedbackExpectedMove, setFeedbackExpectedMove] = React.useState<string | undefined>();
  const solvingSideRef = React.useRef<ChessSideToMove>(
    parseSideToMoveFromFen("")
  );

  const baseFen = state?.exercise.fen ?? "";
  const displayFen = positionFen ?? baseFen;

  React.useEffect(() => {
    if (state) {
      setPositionFen(null);
      setAttemptedMoveUci(null);
      setPuzzleState("idle");
      setFeedbackExpectedMove(undefined);
      solvingSideRef.current = parseSideToMoveFromFen(state.exercise.fen);
    }
  }, [state?.mistake.id]); // eslint-disable-line react-hooks/exhaustive-deps -- mistake identity only

  /** Move = submit: same as training flow. */
  const handleBoardMove = React.useCallback(
    async (uci: string, newFen: string) => {
      if (!state) return;
      const fenBefore = positionFen ?? baseFen;
      solvingSideRef.current = parseSideToMoveFromFen(fenBefore);
      setPositionFen(newFen);
      setAttemptedMoveUci(uci);
      setPuzzleState("checking");
      try {
        const result = await submitReviewAttempt(
          state.mistake.id,
          uci,
          baseFen,
          state.exercise.firstMove ?? state.exercise.solutionMoves[0] ?? ""
        );
        setFeedbackExpectedMove(result.normalizedExpectedMove);
        setPuzzleState(result.isCorrect ? "correct" : "incorrect");
      } catch {
        setPuzzleState("idle");
        setPositionFen(null);
        setAttemptedMoveUci(null);
      }
    },
    [state, baseFen, positionFen]
  );

  const handleSkip = React.useCallback(async () => {
    if (!state) return;
    setPuzzleState("checking");
    try {
      await skipReviewAttempt(state.mistake.id);
      router.push(ROUTES.mistakes);
    } catch {
      setPuzzleState(attemptedMoveUci ? "move-selected" : "idle");
    }
  }, [state, attemptedMoveUci, router]);

  const handleNextMistake = React.useCallback(async () => {
    const list = await getActiveMistakes();
    const idx = list.findIndex((r) => r.id === mistakeId);
    const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
    if (next) {
      router.push(`${ROUTES.mistakes}/${next.id}`);
    } else {
      router.push(ROUTES.mistakes);
    }
  }, [mistakeId, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-5 md:px-5">
        <div className="flex items-center justify-center rounded-lg border border-border bg-muted/20 p-12">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-5 md:px-5">
        <EmptyState
          title="Mistake not found"
          description="This review may have been removed or already mastered."
        >
          <Button asChild variant="default">
            <Link href={ROUTES.mistakes}>Back to Mistakes</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  const resolved = puzzleState === "correct" || puzzleState === "incorrect";
  const correctMoveSquares =
    puzzleState === "incorrect" && feedbackExpectedMove
      ? getHighlightedSquaresFromMove(feedbackExpectedMove)
      : undefined;
  const attemptedMoveSquares =
    puzzleState === "incorrect" && attemptedMoveUci
      ? getHighlightedSquaresFromMove(attemptedMoveUci)
      : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(260px,300px)]">
        <div className="min-w-0 space-y-3">
          <div>
            <TrainingBoardCard
              fen={displayFen}
              boardOrientation={state.boardOrientation}
              onMove={handleBoardMove}
              disabled={
                puzzleState === "checking" ||
                puzzleState === "correct" ||
                puzzleState === "incorrect"
              }
              correctMoveSquares={correctMoveSquares}
              attemptedMoveSquares={attemptedMoveSquares}
              correctMoveUci={
                puzzleState === "incorrect" ? feedbackExpectedMove : undefined
              }
              minimal
              boardContainerClassName="w-full border-border/40 bg-[var(--muted)]/10"
            />
          </div>
          {resolved && (
            <TrainingFeedbackPanel
              state={puzzleState === "correct" ? "correct" : "incorrect"}
              attemptedMove={attemptedMoveUci ?? undefined}
              expectedMove={feedbackExpectedMove}
            />
          )}
        </div>
        <div>
          <MistakeReviewSidePanel
            trainingSetName={state.trainingSet.name}
            status={state.mistake.status}
            failedAttempts={state.mistake.failedAttempts}
            solvedReviewCount={state.mistake.solvedReviewCount}
            gameSource={state.exercise.source}
            gameContextNote={state.exercise.comment}
            puzzleState={puzzleState}
            onSkip={handleSkip}
            onNextMistake={handleNextMistake}
          />
        </div>
      </div>
    </div>
  );
}
