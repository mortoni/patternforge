/**
 * Explicit exercise ordering for training sets.
 * Used by training loader, cycle resolution, and any code that indexes exercises by position.
 *
 * Rule:
 * - If any exercise has puzzleNumber, sort by puzzleNumber ascending (missing treated as 0).
 * - Otherwise stable fallback: sort by createdAt ascending, then by id for tie-break.
 *
 * TODO: Long-term, consider explicit membership/order entities per set.
 */

import type { ExerciseSchema } from "@/db/schema";

/**
 * Returns exercises in the canonical order for the set.
 * Use this whenever resolving "current exercise" by nextExerciseIndex.
 */
export function orderExercises(exercises: ExerciseSchema[]): ExerciseSchema[] {
  if (exercises.length === 0) return [];
  const hasPuzzleNumber = exercises.some((e) => e.puzzleNumber != null);
  if (hasPuzzleNumber) {
    return [...exercises].sort(
      (a, b) => (a.puzzleNumber ?? 0) - (b.puzzleNumber ?? 0)
    );
  }
  return [...exercises].sort((a, b) => {
    const byCreated = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
    if (byCreated !== 0) return byCreated;
    return (a.id ?? "").localeCompare(b.id ?? "");
  });
}
