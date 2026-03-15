/**
 * Session entity: a single training session.
 */

export type SessionStatus = "active" | "completed" | "abandoned";

export interface Session {
  id: string;
  trainingSetId: string;
  cycleRunId: string;
  targetPuzzleCount?: number;
  startedAt: string;
  endedAt?: string;
  activeTimeMs: number;
  puzzlesAttempted: number;
  correctCount: number;
  skippedCount: number;
  status: SessionStatus;
}
