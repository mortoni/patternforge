/**
 * TrainingSet entity: a collection of exercises.
 */

export type Difficulty = "easy" | "intermediate" | "advanced" | "custom";

export interface TrainingSet {
  id: string;
  name: string;
  description?: string;
  difficulty: Difficulty;
  exerciseIds: string[];
  createdAt: string;
}
