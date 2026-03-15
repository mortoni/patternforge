/**
 * ExerciseAttempt entity: one user attempt at an exercise.
 */

export type AttemptResult = "correct" | "incorrect" | "skipped";

export interface ExerciseAttempt {
  id: string;
  exerciseId: string;
  cycleRunId: string;
  sessionId: string;
  startedAt: string;
  finishedAt?: string;
  durationMs: number;
  result: AttemptResult;
  userMoves: string[];
}
