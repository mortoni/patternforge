/**
 * Mistake review service. Records failures and skips, fetches active mistakes.
 * Client-side only.
 */

import {
  getByTrainingSetAndExercise,
  getMistakeById,
  addMistakeEntry,
  updateMistakeEntry,
} from "@/repositories/mistake-entry.repository";

/**
 * Create or update a mistake entry for a failed attempt.
 * Uniqueness is by (trainingSetId, exerciseId): same exercise in another set is a separate entry.
 */
export async function recordFailure(
  exerciseId: string,
  trainingSetId: string
): Promise<void> {
  const existing = await getByTrainingSetAndExercise(trainingSetId, exerciseId);
  const now = new Date().toISOString();
  if (existing) {
    await updateMistakeEntry(existing.id, {
      failedAttempts: existing.failedAttempts + 1,
      lastReviewedAt: now,
    });
  } else {
    await addMistakeEntry({
      id: crypto.randomUUID(),
      exerciseId,
      trainingSetId,
      createdAt: now,
      lastReviewedAt: now,
      failedAttempts: 1,
      solvedReviewCount: 0,
      status: "needs_review",
    });
  }
}

/**
 * Record a skipped puzzle (counts as failure for mistake tracking).
 */
export async function recordSkip(
  exerciseId: string,
  trainingSetId: string
): Promise<void> {
  await recordFailure(exerciseId, trainingSetId);
}

/**
 * Mark a mistake as solved once during review. TODO: Phase 3+.
 */
export async function recordSolvedReview(mistakeEntryId: string): Promise<void> {
  const entry = await getMistakeById(mistakeEntryId);
  if (!entry) return;
  await updateMistakeEntry(mistakeEntryId, {
    solvedReviewCount: entry.solvedReviewCount + 1,
    lastReviewedAt: new Date().toISOString(),
  });
}

/**
 * Get mistakes needing review. TODO: filter by training set when needed.
 */
export async function getActiveMistakes(
  _trainingSetId?: string
): Promise<unknown[]> {
  return [];
}