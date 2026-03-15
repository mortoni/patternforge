/**
 * Exercise entity: a single puzzle position.
 */

export interface Exercise {
  id: string;
  trainingSetId: string;
  fen: string;
  sideToMove: "w" | "b";
  solutionMoves: string[];
  source?: string;
  motifTags?: string[];
  createdAt: string;
}
