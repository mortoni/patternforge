/**
 * Mistakes feature view models and types.
 */

import type { MistakeEntrySchema } from "@/db/schema";

export type MistakeStatus = MistakeEntrySchema["status"];

export interface MistakeListRow {
  id: string;
  exerciseId: string;
  trainingSetId: string;
  trainingSetName: string;
  puzzleLabel: string;
  difficulty: string;
  failedAttempts: number;
  status: MistakeStatus;
  lastReviewedAt: string | null;
}

export interface MistakeSummary {
  needsReview: number;
  solvedOnce: number;
  solvedTwice: number;
  mastered: number;
  activeCount: number;
}

export interface MistakeReviewState {
  mistake: MistakeEntrySchema;
  exercise: {
    id: string;
    fen: string;
    sideToMove: "w" | "b";
    firstMove?: string;
    solutionMoves: string[];
    puzzleNumber?: number;
    source?: string;
    comment?: string;
    difficulty?: string;
  };
  trainingSet: { id: string; name: string };
  boardOrientation: "white" | "black";
  autoBoardOrientation: boolean;
}
