/**
 * Anonymous puzzle / session telemetry — content quality and training analytics only.
 * No PII, move sequences, or per-position board snapshots.
 */

export type PuzzleTelemetryEventName =
  | "puzzle_started"
  | "puzzle_completed"
  | "puzzle_skipped"
  | "training_session_started"
  | "training_session_completed"
  | "pattern_recall";

export interface PuzzleTelemetryEvent {
  event: PuzzleTelemetryEventName;
  timestamp: string;
  sessionId: string;
  trainingSetId: string;
  puzzleId?: string;
  puzzleNumber?: number;
  difficulty?: string;
  cycleNumber?: number;
  solved?: boolean;
  attempts?: number;
  timeMs?: number;
  /** Woodpecker pattern recall — ms from puzzle shown to first user move. */
  timeToFirstMoveMs?: number;
}

export interface PuzzleTelemetryContext {
  sessionId: string;
  trainingSetId: string;
  puzzleId: string;
  puzzleNumber?: number;
  difficulty?: string;
  cycleNumber?: number;
}

export interface TrainingSessionTelemetryContext {
  sessionId: string;
  trainingSetId: string;
  cycleNumber?: number;
}

export interface TrainingSessionCompletedContext extends TrainingSessionTelemetryContext {
  /** Active time accumulated on the session (ms). */
  timeMs?: number;
  puzzlesAttempted?: number;
  correctCount?: number;
  skippedCount?: number;
}

export interface PuzzleResolvedTelemetryContext extends PuzzleTelemetryContext {
  solved: boolean;
  attempts: number;
  timeMs: number;
  /** When the user made their first move on this puzzle presentation. */
  timeToFirstMoveMs?: number;
}
