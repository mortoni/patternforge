"use client";

import * as React from "react";
import type { useRouter } from "next/navigation";
import { cycleSummaryRoute } from "@/lib/constants";
import { parseSideToMoveFromFen } from "@/lib/chess/side-to-move";
import { submitAttempt, skipPuzzle } from "../services/training-solver.service";
import {
  setPuzzleProgress,
  clearPuzzleProgress,
} from "../services/puzzle-progress-storage";
import type { ReadyTrainingState, TrainingPuzzleUiState } from "./use-sync-puzzle-from-ready-state";

const AUTO_PLAY_DELAY_MS = 500;
const EXERCISE_TRANSITION_MS = 1000;

type AppRouter = ReturnType<typeof useRouter>;

export interface TrainingBoardRefs {
  currentFenRef: React.MutableRefObject<string>;
  currentSolutionIndexRef: React.MutableRefObject<number>;
  accumulatedUserMovesRef: React.MutableRefObject<string[]>;
  solvingSideRef: React.MutableRefObject<"w" | "b">;
  boardMoveInFlightRef: React.MutableRefObject<boolean>;
  attemptStartedAtRef: React.MutableRefObject<number>;
  autoPlayTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  exerciseTransitionTimerRef: React.MutableRefObject<
    ReturnType<typeof setTimeout> | null
  >;
}

export function useClearExerciseTransitionTimerOnUnmount(
  exerciseTransitionTimerRef: React.MutableRefObject<
    ReturnType<typeof setTimeout> | null
  >
): void {
  React.useEffect(() => {
    return () => {
      if (exerciseTransitionTimerRef.current) {
        clearTimeout(exerciseTransitionTimerRef.current);
        exerciseTransitionTimerRef.current = null;
      }
    };
  }, [exerciseTransitionTimerRef]);
}

export function useTrainingBoardActions(
  readyState: ReadyTrainingState | null,
  baseFen: string,
  puzzleState: TrainingPuzzleUiState,
  reload: () => Promise<void>,
  router: AppRouter,
  refs: TrainingBoardRefs,
  setters: {
    setPositionFen: React.Dispatch<React.SetStateAction<string | null>>;
    setPuzzleState: React.Dispatch<React.SetStateAction<TrainingPuzzleUiState>>;
    setCurrentSolutionIndex: React.Dispatch<React.SetStateAction<number>>;
    setAccumulatedUserMoves: React.Dispatch<React.SetStateAction<string[]>>;
  }
): { handleBoardMove: (uci: string, newFen: string) => Promise<void>; handleSkip: () => Promise<void> } {
  const {
    currentFenRef,
    currentSolutionIndexRef,
    accumulatedUserMovesRef,
    solvingSideRef,
    boardMoveInFlightRef,
    attemptStartedAtRef,
    autoPlayTimerRef,
    exerciseTransitionTimerRef,
  } = refs;
  const {
    setPositionFen,
    setPuzzleState,
    setCurrentSolutionIndex,
    setAccumulatedUserMoves,
  } = setters;

  useClearExerciseTransitionTimerOnUnmount(exerciseTransitionTimerRef);

  const handleBoardMove = React.useCallback(
    async (uci: string, newFen: string) => {
      if (!readyState || !readyState.sessionId) return;
      if (boardMoveInFlightRef.current) return;
      boardMoveInFlightRef.current = true;
      const fenBefore = currentFenRef.current;
      solvingSideRef.current = parseSideToMoveFromFen(fenBefore);
      setPositionFen(newFen);
      setPuzzleState("checking");
      const indexToUse = currentSolutionIndexRef.current;
      const accumulatedToUse = [...accumulatedUserMovesRef.current];
      const fenToUse = fenBefore || baseFen;
      try {
        const result = await submitAttempt({
          exerciseId: readyState.exercise.id,
          cycleRunId: readyState.cycleRun.id,
          trainingSetId: readyState.trainingSet.id,
          sessionId: readyState.sessionId,
          fen: fenToUse,
          expectedFirstMove:
            readyState.exercise.firstMove ??
            readyState.exercise.solutionMoves[0] ??
            "",
          attemptedMoveUci: uci,
          attemptStartedAt: attemptStartedAtRef.current,
          solutionMoves: readyState.exercise.solutionMoves,
          sideToMove: readyState.exercise.sideToMove,
          currentSolutionIndex: indexToUse,
          accumulatedUserMoves: accumulatedToUse,
        });

        if (!result.isCorrect) {
          clearPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id);
          setPuzzleState("transitioning");
          if (exerciseTransitionTimerRef.current) {
            clearTimeout(exerciseTransitionTimerRef.current);
          }
          const cycleRunId = readyState.cycleRun.id;
          exerciseTransitionTimerRef.current = setTimeout(() => {
            exerciseTransitionTimerRef.current = null;
            if (result.cycleComplete) {
              router.replace(cycleSummaryRoute(cycleRunId));
            } else {
              void reload();
            }
          }, EXERCISE_TRANSITION_MS);
          return;
        }

        if (result.puzzleComplete) {
          clearPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id);
          setPuzzleState("transitioning");
          if (exerciseTransitionTimerRef.current) {
            clearTimeout(exerciseTransitionTimerRef.current);
          }
          const cycleRunId = readyState.cycleRun.id;
          exerciseTransitionTimerRef.current = setTimeout(() => {
            exerciseTransitionTimerRef.current = null;
            if (result.cycleComplete) {
              router.replace(cycleSummaryRoute(cycleRunId));
            } else {
              void reload();
            }
          }, EXERCISE_TRANSITION_MS);
          return;
        }

        const nextFen = result.nextFen ?? newFen;
        const nextIndex = result.nextSolutionIndex ?? indexToUse + 1;
        const nextAccumulated = [
          ...accumulatedToUse,
          result.normalizedAttemptedMove,
        ];

        currentSolutionIndexRef.current = nextIndex;
        accumulatedUserMovesRef.current = nextAccumulated;
        currentFenRef.current = nextFen;

        setPositionFen(nextFen);
        setAccumulatedUserMoves(nextAccumulated);
        setCurrentSolutionIndex(nextIndex);
        setPuzzleState("correct_so_far");

        setPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id, {
          currentFen: nextFen,
          currentSolutionIndex: nextIndex,
          accumulatedUserMoves: nextAccumulated,
        });

        if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = setTimeout(() => {
          autoPlayTimerRef.current = null;
          setPuzzleState("idle");
        }, AUTO_PLAY_DELAY_MS);
      } catch {
        setPuzzleState("idle");
        setPositionFen(currentFenRef.current || baseFen);
      } finally {
        boardMoveInFlightRef.current = false;
      }
    },
    // Refs and setState dispatchers are stable; keep deps aligned with the page’s contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readyState, baseFen, reload, router]
  );

  const handleSkip = React.useCallback(async () => {
    if (!readyState || !readyState.sessionId) return;
    if (puzzleState === "checking" || puzzleState === "transitioning") return;
    setPuzzleState("checking");
    clearPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id);
    try {
      const { cycleComplete } = await skipPuzzle(
        readyState.exercise.id,
        readyState.cycleRun.id,
        readyState.trainingSet.id,
        readyState.sessionId,
        attemptStartedAtRef.current
      );
      if (cycleComplete) {
        router.replace(cycleSummaryRoute(readyState.cycleRun.id));
      } else {
        await reload();
      }
    } catch {
      setPuzzleState("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyState, puzzleState, reload, router]);

  return { handleBoardMove, handleSkip };
}
