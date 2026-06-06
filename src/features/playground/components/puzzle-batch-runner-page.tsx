"use client";

import * as React from "react";
import { Chess } from "chess.js";
import { EmptyState } from "@/components/shared/EmptyState";
import { SideToMoveIndicator } from "@/components/shared/SideToMoveIndicator";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { parseSideToMoveFromFen } from "@/lib/chess/side-to-move";
import { tryApplySanMove } from "@/lib/chess/woodpecker-solution-utils";
import {
  loadExercisesFromWoodpeckerJson,
  type WoodpeckerSetId,
} from "@/db/seed-puzzles";
import { TrainingBoardCard } from "@/features/training/components/training-board-card";
import type { ExerciseSchema } from "@/db/schema";

const BOARD_COLUMN_CLASS =
  "w-full min-w-0 max-w-[min(100%,calc(100dvh-14rem),40rem)] self-stretch";

const AUTO_PLAY_STEP_MS = 420;
const PAUSE_BETWEEN_PUZZLES_MS = 650;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

type BatchRunState = "idle" | "playing" | "paused" | "complete";

export type PuzzleBatchRunnerPageProps = {
  woodpeckerSetIds?: readonly WoodpeckerSetId[];
  workbenchTitle?: string;
};

function buildMoveRows(exercise: ExerciseSchema) {
  try {
    const chess = new Chess(exercise.fen);
    let stillResolvable = true;
    return exercise.solutionMoves.map((san, idx) => {
      const side =
        idx % 2 === 0
          ? exercise.sideToMove
          : exercise.sideToMove === "w"
            ? "b"
            : "w";
      if (!stillResolvable) {
        return { ply: idx + 1, side, san, uci: "", status: "unresolved" as const };
      }

      const move = tryApplySanMove(chess, san);
      if (!move) {
        stillResolvable = false;
        return { ply: idx + 1, side, san, uci: "", status: "illegal" as const };
      }

      const uci = `${move.from}${move.to}${move.promotion ?? ""}`;
      return { ply: idx + 1, side, san, uci, status: "ok" as const };
    });
  } catch {
    return exercise.solutionMoves.map((san, idx) => ({
      ply: idx + 1,
      side:
        idx % 2 === 0
          ? exercise.sideToMove
          : exercise.sideToMove === "w"
            ? "b"
            : "w",
      san,
      uci: "",
      status: "illegal" as const,
    }));
  }
}

/** Auto-plays solution lines puzzle-by-puzzle for batch validation (Storybook / dev). */
export function PuzzleBatchRunnerPage({
  woodpeckerSetIds = ["woodpecker-easy"],
  workbenchTitle = "Puzzle batch check",
}: PuzzleBatchRunnerPageProps = {}) {
  const [loadingBundle, setLoadingBundle] = React.useState(true);
  const [bundleError, setBundleError] = React.useState<string | null>(null);
  const [exercises, setExercises] = React.useState<ExerciseSchema[]>([]);
  const [puzzleIndex, setPuzzleIndex] = React.useState(0);
  const [loaded, setLoaded] = React.useState<ExerciseSchema | null>(null);
  const [positionFen, setPositionFen] = React.useState("");
  const [currentSolutionIndex, setCurrentSolutionIndex] = React.useState(0);
  const [runState, setRunState] = React.useState<BatchRunState>("idle");
  const [message, setMessage] = React.useState<string | null>(null);
  const [passedCount, setPassedCount] = React.useState(0);
  const [failedCount, setFailedCount] = React.useState(0);

  const runningRef = React.useRef(false);
  const runGenerationRef = React.useRef(0);

  const resetForExercise = React.useCallback((exercise: ExerciseSchema) => {
    setLoaded(exercise);
    setPositionFen(exercise.fen);
    setCurrentSolutionIndex(0);
    setMessage(null);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoadingBundle(true);
      setBundleError(null);
      try {
        const list = await loadExercisesFromWoodpeckerJson(undefined, woodpeckerSetIds);
        const sorted = [...list].sort(
          (a, b) => (a.puzzleNumber ?? 0) - (b.puzzleNumber ?? 0)
        );
        if (cancelled) return;
        if (sorted.length === 0) {
          setExercises([]);
          setLoaded(null);
          setBundleError("No puzzles found in the selected Woodpecker bundle.");
          return;
        }
        setExercises(sorted);
        setPuzzleIndex(0);
        resetForExercise(sorted[0]);
      } catch (err) {
        if (!cancelled) {
          setBundleError(
            err instanceof Error ? err.message : "Failed to load Woodpecker JSON bundle."
          );
        }
      } finally {
        if (!cancelled) setLoadingBundle(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resetForExercise, woodpeckerSetIds]);

  React.useEffect(() => {
    return () => {
      runningRef.current = false;
      runGenerationRef.current += 1;
    };
  }, []);

  const stopRun = React.useCallback(() => {
    runningRef.current = false;
    runGenerationRef.current += 1;
    setRunState("paused");
    setMessage("Stopped.");
  }, []);

  const playSolutionLine = React.useCallback(
    async (exercise: ExerciseSchema, generation: number): Promise<boolean> => {
      const chess = new Chess(exercise.fen);

      for (let ply = 0; ply < exercise.solutionMoves.length; ply++) {
        if (!runningRef.current || generation !== runGenerationRef.current) {
          return false;
        }

        const san = exercise.solutionMoves[ply];
        const move = tryApplySanMove(chess, san);
        if (!move) {
          setMessage(
            `Failed at ply ${ply + 1}: illegal SAN "${san}" on puzzle ${exercise.puzzleNumber}.`
          );
          setFailedCount((count) => count + 1);
          return false;
        }

        setPositionFen(chess.fen());
        setCurrentSolutionIndex(ply + 1);
        await sleep(AUTO_PLAY_STEP_MS);
      }

      setPassedCount((count) => count + 1);
      setMessage(`Puzzle ${exercise.puzzleNumber} OK.`);
      return true;
    },
    []
  );

  const runBatch = React.useCallback(
    async (startIndex: number) => {
      if (exercises.length === 0) return;

      const generation = runGenerationRef.current + 1;
      runGenerationRef.current = generation;
      runningRef.current = true;
      setRunState("playing");
      setMessage(null);

      for (let index = startIndex; index < exercises.length; index++) {
        if (!runningRef.current || generation !== runGenerationRef.current) {
          return;
        }

        const exercise = exercises[index];
        setPuzzleIndex(index);
        resetForExercise(exercise);
        await sleep(PAUSE_BETWEEN_PUZZLES_MS);

        const ok = await playSolutionLine(exercise, generation);
        if (!ok) {
          runningRef.current = false;
          setRunState("paused");
          return;
        }
      }

      runningRef.current = false;
      setRunState("complete");
      setMessage(`All ${exercises.length} puzzles replayed successfully.`);
    },
    [exercises, playSolutionLine, resetForExercise]
  );

  const handlePlayAll = React.useCallback(() => {
    setPassedCount(0);
    setFailedCount(0);
    void runBatch(puzzleIndex);
  }, [puzzleIndex, runBatch]);

  const handlePlayFromStart = React.useCallback(() => {
    setPassedCount(0);
    setFailedCount(0);
    setPuzzleIndex(0);
    if (exercises[0]) resetForExercise(exercises[0]);
    void runBatch(0);
  }, [exercises, resetForExercise, runBatch]);

  const handleNextPuzzle = React.useCallback(() => {
    if (runState === "playing" || exercises.length === 0) return;
    const nextIndex = Math.min(puzzleIndex + 1, exercises.length - 1);
    setPuzzleIndex(nextIndex);
    resetForExercise(exercises[nextIndex]);
    setRunState("idle");
    setMessage(null);
  }, [exercises, puzzleIndex, resetForExercise, runState]);

  const handlePrevPuzzle = React.useCallback(() => {
    if (runState === "playing" || exercises.length === 0) return;
    const prevIndex = Math.max(puzzleIndex - 1, 0);
    setPuzzleIndex(prevIndex);
    resetForExercise(exercises[prevIndex]);
    setRunState("idle");
    setMessage(null);
  }, [exercises, puzzleIndex, resetForExercise, runState]);

  const moveRows = React.useMemo(
    () => (loaded ? buildMoveRows(loaded) : []),
    [loaded]
  );

  const bundleLabel = woodpeckerSetIds.map((id) => `${id}.json`).join(", ");

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-5.5rem)] w-full max-w-5xl flex-col px-4 sm:px-6 md:min-h-[calc(100dvh-4rem)] lg:px-8">
      <header className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{workbenchTitle}</h1>
          <p className="text-sm text-muted-foreground">
            Loads <code className="text-xs">{bundleLabel}</code>, starts at puzzle 1, and can
            auto-play each solution line in order.
          </p>
        </div>
        <ThemeToggle className="hidden md:inline-flex" />
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/10 p-4">
        <Button
          type="button"
          disabled={loadingBundle || runState === "playing" || exercises.length === 0}
          onClick={handlePlayAll}
        >
          Play from current
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loadingBundle || runState === "playing" || exercises.length === 0}
          onClick={handlePlayFromStart}
        >
          Play all from start
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={runState !== "playing"}
          onClick={stopRun}
        >
          Stop
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={runState === "playing" || puzzleIndex <= 0}
          onClick={handlePrevPuzzle}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={runState === "playing" || puzzleIndex >= exercises.length - 1}
          onClick={handleNextPuzzle}
        >
          Next
        </Button>
        <p className="ml-auto text-sm text-muted-foreground">
          {loadingBundle
            ? "Loading bundle…"
            : exercises.length > 0
              ? `Puzzle ${puzzleIndex + 1} / ${exercises.length} · Passed ${passedCount} · Failed ${failedCount}`
              : "No puzzles loaded"}
        </p>
      </div>

      {bundleError ? (
        <div className="mt-6">
          <EmptyState title="Failed to load bundle" description={bundleError} />
        </div>
      ) : loaded ? (
        <div className="mt-4 flex flex-1 flex-col items-center gap-6 pb-6">
          <div className={BOARD_COLUMN_CLASS}>
            <p className="mb-1 text-xs text-muted-foreground">
              {loaded.id} · {loaded.trainingSetId} · Puzzle {loaded.puzzleNumber}
            </p>
            <SideToMoveIndicator sideToMove={parseSideToMoveFromFen(positionFen)} />
          </div>

          <div className={BOARD_COLUMN_CLASS}>
            <TrainingBoardCard
              fen={positionFen}
              positionSyncKey={`${loaded.id}-${puzzleIndex}`}
              boardOrientation="white"
              disabled
              minimal
              boardContainerClassName="w-full border-border/40 bg-[var(--muted)]/10"
            />
          </div>

          <div className={BOARD_COLUMN_CLASS}>
            <div className="rounded-md border border-border bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
              <p>
                Progress: {currentSolutionIndex} / {loaded.solutionMoves.length} plies ·{" "}
                {runState === "playing"
                  ? "Playing…"
                  : runState === "complete"
                    ? "Complete"
                    : runState === "paused"
                      ? "Paused"
                      : "Ready"}
              </p>
              {message ? <p className="mt-2 text-foreground">{message}</p> : null}
            </div>
          </div>

          <div className={BOARD_COLUMN_CLASS}>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 font-medium">Ply</th>
                    <th className="px-2 py-2 font-medium">Side</th>
                    <th className="px-2 py-2 font-medium">SAN</th>
                    <th className="px-2 py-2 font-medium">UCI</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {moveRows.map((row, idx) => {
                    const isCurrent =
                      idx === currentSolutionIndex && runState === "playing";
                    const isPlayed = idx < currentSolutionIndex;
                    return (
                      <tr
                        key={`${loaded.id}-${row.ply}`}
                        className={
                          isCurrent
                            ? "bg-primary/10"
                            : isPlayed
                              ? "border-t border-border/60 bg-muted/20"
                              : "border-t border-border/60"
                        }
                      >
                        <td className="px-2 py-1.5 tabular-nums">{row.ply}</td>
                        <td className="px-2 py-1.5">{row.side === "w" ? "White" : "Black"}</td>
                        <td className="px-2 py-1.5 font-medium text-foreground">{row.san}</td>
                        <td className="px-2 py-1.5 font-mono">{row.uci || "—"}</td>
                        <td className="px-2 py-1.5">
                          {row.status === "ok"
                            ? "ok"
                            : row.status === "illegal"
                              ? "illegal SAN"
                              : "unresolved"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title={loadingBundle ? "Loading puzzles…" : "No puzzle loaded"}
            description={
              loadingBundle
                ? "Fetching Woodpecker JSON bundle."
                : "The selected bundle has no puzzles."
            }
          />
        </div>
      )}
    </div>
  );
}
