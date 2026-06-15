/**
 * Anonymous puzzle telemetry — content quality and Woodpecker progression analytics.
 * Wired from training services (session, solver, lifecycle); not from UI components.
 */

import type {
  PuzzleResolvedTelemetryContext,
  PuzzleTelemetryContext,
  PuzzleTelemetryEvent,
  TrainingSessionCompletedContext,
  TrainingSessionTelemetryContext,
} from "@/lib/puzzle-telemetry/types";
import {
  appendPuzzleTelemetryDebugBuffer,
  createNoopPuzzleTelemetryProvider,
  createVercelPuzzleTelemetryProvider,
  type PuzzleTelemetryProvider,
} from "@/lib/puzzle-telemetry/provider";

let providerOverride: PuzzleTelemetryProvider | null | undefined;

function resolveProvider(): PuzzleTelemetryProvider {
  if (providerOverride !== undefined) {
    return providerOverride ?? createNoopPuzzleTelemetryProvider();
  }
  if (process.env.NEXT_PUBLIC_PUZZLE_TELEMETRY === "off") {
    return createNoopPuzzleTelemetryProvider();
  }
  return createVercelPuzzleTelemetryProvider();
}

function emit(event: PuzzleTelemetryEvent): void {
  try {
    resolveProvider().send(event);
    appendPuzzleTelemetryDebugBuffer(event);
  } catch {
    // Telemetry must never affect gameplay.
  }
}

function baseFields(
  ctx: PuzzleTelemetryContext | TrainingSessionTelemetryContext
): Pick<
  PuzzleTelemetryEvent,
  "timestamp" | "sessionId" | "trainingSetId" | "cycleNumber"
> &
  Partial<Pick<PuzzleTelemetryEvent, "puzzleId" | "puzzleNumber" | "difficulty">> {
  const puzzleCtx = ctx as PuzzleTelemetryContext;
  return {
    timestamp: new Date().toISOString(),
    sessionId: ctx.sessionId,
    trainingSetId: ctx.trainingSetId,
    cycleNumber: ctx.cycleNumber,
    ...(puzzleCtx.puzzleId != null ? { puzzleId: puzzleCtx.puzzleId } : {}),
    ...(puzzleCtx.puzzleNumber != null
      ? { puzzleNumber: puzzleCtx.puzzleNumber }
      : {}),
    ...(puzzleCtx.difficulty != null ? { difficulty: puzzleCtx.difficulty } : {}),
  };
}

export function trackPuzzleStarted(ctx: PuzzleTelemetryContext): void {
  emit({
    event: "puzzle_started",
    ...baseFields(ctx),
  });
}

export function trackPuzzleCompleted(ctx: PuzzleResolvedTelemetryContext): void {
  emit({
    event: "puzzle_completed",
    ...baseFields(ctx),
    solved: ctx.solved,
    attempts: ctx.attempts,
    timeMs: ctx.timeMs,
  });

  if (ctx.timeToFirstMoveMs != null) {
    emit({
      event: "pattern_recall",
      ...baseFields(ctx),
      solved: ctx.solved,
      timeToFirstMoveMs: ctx.timeToFirstMoveMs,
    });
  }
}

export function trackPuzzleSkipped(
  ctx: PuzzleTelemetryContext & { timeMs: number }
): void {
  emit({
    event: "puzzle_skipped",
    ...baseFields(ctx),
    timeMs: ctx.timeMs,
  });
}

export function trackTrainingSessionStarted(
  ctx: TrainingSessionTelemetryContext
): void {
  emit({
    event: "training_session_started",
    ...baseFields(ctx),
  });
}

export function trackTrainingSessionCompleted(
  ctx: TrainingSessionCompletedContext
): void {
  emit({
    event: "training_session_completed",
    ...baseFields(ctx),
    timeMs: ctx.timeMs,
  });
}

/** Test-only: inject a provider or `null` for noop. */
export function setPuzzleTelemetryProviderForTests(
  provider: PuzzleTelemetryProvider | null
): void {
  providerOverride = provider;
}

export function resetPuzzleTelemetryProviderForTests(): void {
  providerOverride = undefined;
  if (typeof window !== "undefined") {
    window.__puzzleTelemetryEvents = [];
  }
}

export function getPuzzleTelemetryDebugBuffer(): PuzzleTelemetryEvent[] {
  if (typeof window === "undefined") return [];
  return window.__puzzleTelemetryEvents ?? [];
}
