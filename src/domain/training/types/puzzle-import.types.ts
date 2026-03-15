/**
 * Types for the puzzle import pipeline (CSV → normalized JSON → Dexie).
 */

export type TrainingSetSlug = "easy" | "intermediate" | "advanced";

export type DifficultySlug = "easy" | "intermediate" | "advanced";

/** Raw row from puzzle.csv (string values). */
export interface PuzzleCsvRow {
  trainingSetId: string;
  puzzleNumber: string;
  fen: string;
  sideToMove: string;
  solutionMoves: string;
  motifTags: string;
  gameSource: string;
  difficulty: string;
}

/** Normalized puzzle ready for JSON output and Dexie. firstMove is derived from solutionMoves[0] when not provided. */
export interface NormalizedPuzzle {
  id: string;
  trainingSetId: TrainingSetSlug;
  puzzleNumber: number;
  fen: string;
  sideToMove: "w" | "b";
  solutionMoves: string[];
  /** Expected first move (UCI). Derived from solutionMoves[0] if not in source. */
  firstMove?: string;
  motifTags: string[];
  gameSource: string;
  difficulty: DifficultySlug;
  createdAt: string;
}

/** Training set metadata for generated output. */
export interface GeneratedTrainingSetMeta {
  id: TrainingSetSlug;
  name: string;
  description: string;
  difficulty: DifficultySlug;
}
