"use client";

import * as React from "react";
import { Chess } from "chess.js";
import { EmptyState } from "@/components/shared/EmptyState";
import { SideToMoveIndicator } from "@/components/shared/SideToMoveIndicator";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseSideToMoveFromFen } from "@/lib/chess/side-to-move";
import { advanceThroughSolutionLine } from "@/lib/training/puzzle-line-validator";
import { getExercisesByPuzzleNumber } from "@/repositories/exercise.repository";
import { ensureGeneratedPuzzlesInDbIfEmpty } from "@/features/training-sets/services/training-sets.service";
import { TrainingBoardCard } from "@/features/training/components/training-board-card";
import type { ExerciseSchema } from "@/db/schema";

const BOARD_COLUMN_CLASS =
  "w-full min-w-0 max-w-[min(100%,calc(100dvh-14rem),40rem)] self-stretch";

type WorkbenchPuzzleState = "idle" | "checking" | "complete";
const AUTO_PLAY_STEP_MS = 420;

function applyUciToFen(fen: string, uci: string): string | null {
  const t = uci.trim().toLowerCase();
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(t)) return null;
  try {
    const chess = new Chess(fen);
    const move = chess.move({
      from: t.slice(0, 2),
      to: t.slice(2, 4),
      ...(t.length === 5 ? { promotion: t[4] } : {}),
    });
    if (!move) return null;
    return chess.fen();
  } catch {
    return null;
  }
}

/** Interactive puzzle loader for local IndexedDB data — run inside Storybook (`pnpm storybook`). */
export function PuzzleWorkbenchPage() {
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [loaded, setLoaded] = React.useState<ExerciseSchema | null>(null);
  const [positionFen, setPositionFen] = React.useState("");
  const [currentSolutionIndex, setCurrentSolutionIndex] = React.useState(0);
  const [state, setState] = React.useState<WorkbenchPuzzleState>("idle");
  const [message, setMessage] = React.useState<string | null>(null);
  const autoPlayTimersRef = React.useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearAutoPlayTimers = React.useCallback(() => {
    for (const timer of autoPlayTimersRef.current) {
      clearTimeout(timer);
    }
    autoPlayTimersRef.current = [];
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        await ensureGeneratedPuzzlesInDbIfEmpty();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    return () => {
      clearAutoPlayTimers();
    };
  }, [clearAutoPlayTimers]);

  const resetForExercise = React.useCallback(
    (exercise: ExerciseSchema) => {
      clearAutoPlayTimers();
      setLoaded(exercise);
      setPositionFen(exercise.fen);
      setCurrentSolutionIndex(0);
      setState("idle");
      setMessage(null);
    },
    [clearAutoPlayTimers]
  );

  const handleLoadPuzzle = React.useCallback(async () => {
    const n = Number.parseInt(query.trim(), 10);
    if (!Number.isFinite(n) || n <= 0) {
      setMessage("Enter a valid puzzle number.");
      return;
    }
    const matches = await getExercisesByPuzzleNumber(n);
    if (matches.length === 0) {
      setLoaded(null);
      setMessage(`Puzzle ${n} not found in the loaded training sets.`);
      return;
    }
    if (matches.length > 1) {
      setMessage(
        `Puzzle ${n} exists in multiple sets. Loaded ${matches[0].trainingSetId} (${matches[0].id}).`
      );
    }
    resetForExercise(matches[0]);
  }, [query, resetForExercise]);

  const handleBoardMove = React.useCallback(
    async (uci: string, newFen: string) => {
      if (!loaded || state !== "idle") return;

      clearAutoPlayTimers();
      setState("checking");
      const result = advanceThroughSolutionLine({
        fen: positionFen,
        solutionMoves: loaded.solutionMoves,
        currentSolutionIndex,
        sideToMove: loaded.sideToMove,
        attemptedMoveUci: uci,
      });

      if (!result.validation.isCorrect) {
        setState("idle");
        setMessage(
          `Incorrect move. Expected: ${result.validation.normalizedExpectedMove} · got: ${result.validation.normalizedAttemptedMove}`
        );
        return;
      }

      setPositionFen(newFen);

      const autoMoves = result.autoPlayedMoves ?? [];
      if (autoMoves.length > 0) {
        let rollingFen = newFen;
        autoMoves.forEach((autoUci, idx) => {
          const timer = setTimeout(() => {
            const nextFen = applyUciToFen(rollingFen, autoUci);
            if (nextFen) {
              rollingFen = nextFen;
              setPositionFen(nextFen);
            }

            if (idx === autoMoves.length - 1) {
              setCurrentSolutionIndex(result.nextIndex);
              if (result.puzzleComplete) {
                setState("complete");
                setMessage("Puzzle line complete.");
              } else {
                setState("idle");
                setMessage(null);
              }
            }
          }, AUTO_PLAY_STEP_MS * (idx + 1));
          autoPlayTimersRef.current.push(timer);
        });
        return;
      }

      setCurrentSolutionIndex(result.nextIndex);

      if (result.puzzleComplete) {
        setState("complete");
        setMessage("Puzzle line complete.");
      } else {
        setState("idle");
        setMessage(null);
      }
    },
    [loaded, state, positionFen, currentSolutionIndex, clearAutoPlayTimers]
  );

  const moveRows = React.useMemo(() => {
    if (!loaded) return [];
    try {
      const chess = new Chess(loaded.fen);
      let stillResolvable = true;
      return loaded.solutionMoves.map((san, idx) => {
        const side = idx % 2 === 0 ? loaded.sideToMove : loaded.sideToMove === "w" ? "b" : "w";
        if (!stillResolvable) {
          return { ply: idx + 1, side, san, uci: "", status: "unresolved" as const };
        }

        let move:
          | {
              from: string;
              to: string;
              promotion?: string;
            }
          | null = null;
        try {
          const strict = chess.move(san);
          if (strict) {
            move = strict as unknown as { from: string; to: string; promotion?: string };
          }
        } catch {
          // Fallback below.
        }
        if (!move) {
          try {
            const sloppy = (
              chess as unknown as {
                move: (m: string, opts?: unknown) => { from: string; to: string; promotion?: string } | null;
              }
            ).move(san, { sloppy: true });
            move = sloppy;
          } catch {
            move = null;
          }
        }

        if (!move) {
          stillResolvable = false;
          return { ply: idx + 1, side, san, uci: "", status: "illegal" as const };
        }
        const uci = `${move.from}${move.to}${move.promotion ?? ""}`;
        return { ply: idx + 1, side, san, uci, status: "ok" as const };
      });
    } catch {
      return loaded.solutionMoves.map((san, idx) => ({
        ply: idx + 1,
        side: idx % 2 === 0 ? loaded.sideToMove : loaded.sideToMove === "w" ? "b" : "w",
        san,
        uci: "",
        status: "illegal" as const,
      }));
    }
  }, [loaded]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-5xl items-center justify-center px-4 sm:px-6">
        <p className="text-sm text-muted-foreground">Loading puzzle data…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-5.5rem)] w-full max-w-5xl flex-col px-4 sm:px-6 md:min-h-[calc(100dvh-4rem)] lg:px-8">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Puzzle workbench</h1>
          <p className="text-sm text-muted-foreground">
            Load a puzzle number and play the line with training-style interaction.
          </p>
        </div>
        <ThemeToggle className="hidden md:inline-flex" />
      </header>

      <div className="grid gap-3 rounded-md border border-border bg-muted/10 p-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-2">
          <label htmlFor="playground-puzzle-number" className="text-sm font-medium text-foreground">
            Puzzle number
          </label>
          <Input
            id="playground-puzzle-number"
            inputMode="numeric"
            placeholder="e.g. 105"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleLoadPuzzle();
              }
            }}
          />
        </div>
        <Button type="button" onClick={() => void handleLoadPuzzle()}>
          Load puzzle
        </Button>
      </div>

      {loaded ? (
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
              positionSyncKey={loaded.id}
              boardOrientation="white"
              onMove={(uci, newFen) => void handleBoardMove(uci, newFen)}
              disabled={state !== "idle"}
              minimal
              boardContainerClassName="w-full border-border/40 bg-[var(--muted)]/10"
            />
          </div>

          <div className={BOARD_COLUMN_CLASS}>
            <div className="rounded-md border border-border bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
              <p>
                Progress: {currentSolutionIndex} / {loaded.solutionMoves.length} plies
              </p>
              <p>
                Next expected SAN:{" "}
                {loaded.solutionMoves[currentSolutionIndex] ?? "(line complete)"}
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
                    const isCurrent = idx === currentSolutionIndex && state !== "complete";
                    return (
                      <tr
                        key={`${loaded.id}-${row.ply}`}
                        className={isCurrent ? "bg-primary/10" : "border-t border-border/60"}
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
            title="No puzzle loaded"
            description="Enter a puzzle number from your local training-set data."
          />
        </div>
      )}
    </div>
  );
}
