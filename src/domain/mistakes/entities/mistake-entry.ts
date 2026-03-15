/**
 * MistakeEntry entity: tracked puzzle for review.
 */

export type MistakeStatus =
  | "needs_review"
  | "solved_once"
  | "solved_twice"
  | "mastered";

export interface MistakeEntry {
  id: string;
  exerciseId: string;
  trainingSetId: string;
  createdAt: string;
  lastReviewedAt?: string;
  failedAttempts: number;
  solvedReviewCount: number;
  status: MistakeStatus;
}
