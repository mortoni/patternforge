/**
 * Types for the puzzle import pipeline (CSV → normalized JSON → Dexie).
 */

/** CSV column `trainingSetId`: any stable group key (e.g. `easy`, `test`, `magnus`). */
export type TrainingSetGroupId = string;

/** CSV column `difficulty` / DB exercise difficulty. */
export type ImportDifficulty =
  | "easy"
  | "intermediate"
  | "advanced"
  | "custom";

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
  comment?: string;
}

/** Normalized puzzle ready for JSON output and Dexie. firstMove is derived from solutionMoves[0] when not provided. */
export interface NormalizedPuzzle {
  id: string;
  trainingSetId: TrainingSetGroupId;
  puzzleNumber: number;
  fen: string;
  sideToMove: "w" | "b";
  solutionMoves: string[];
  /** Expected first move (UCI). Derived from solutionMoves[0] if not in source. */
  firstMove?: string;
  motifTags: string[];
  gameSource: string;
  difficulty: ImportDifficulty;
  /** Optional comment / explanation from source (e.g. woodpecker dataset). */
  comment?: string;
  createdAt: string;
}

/** Training set metadata for generated output. */
export interface GeneratedTrainingSetMeta {
  id: TrainingSetGroupId;
  name: string;
  description: string;
  difficulty: ImportDifficulty;
}
