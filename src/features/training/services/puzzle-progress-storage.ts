/**
 * Persist in-progress multi-move puzzle state so refresh restores position and solution index.
 * Uses sessionStorage keyed by cycleRunId + exerciseId.
 */

const KEY_PREFIX = "patternforge:puzzleProgress:";

export interface PuzzleProgress {
  currentFen: string;
  currentSolutionIndex: number;
  /** User moves played so far (UCI) for this puzzle. */
  accumulatedUserMoves: string[];
}

function storageKey(cycleRunId: string, exerciseId: string): string {
  return `${KEY_PREFIX}${cycleRunId}:${exerciseId}`;
}

export function getPuzzleProgress(
  cycleRunId: string,
  exerciseId: string
): PuzzleProgress | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(cycleRunId, exerciseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "currentFen" in parsed &&
      "currentSolutionIndex" in parsed &&
      "accumulatedUserMoves" in parsed &&
      typeof (parsed as PuzzleProgress).currentFen === "string" &&
      typeof (parsed as PuzzleProgress).currentSolutionIndex === "number" &&
      Array.isArray((parsed as PuzzleProgress).accumulatedUserMoves)
    ) {
      return parsed as PuzzleProgress;
    }
  } catch {
    // ignore
  }
  return null;
}

export function setPuzzleProgress(
  cycleRunId: string,
  exerciseId: string,
  progress: PuzzleProgress
): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      storageKey(cycleRunId, exerciseId),
      JSON.stringify(progress)
    );
  } catch {
    // ignore
  }
}

export function clearPuzzleProgress(
  cycleRunId: string,
  exerciseId: string
): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(cycleRunId, exerciseId));
  } catch {
    // ignore
  }
}
