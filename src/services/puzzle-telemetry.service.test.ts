import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getPuzzleTelemetryDebugBuffer,
  resetPuzzleTelemetryProviderForTests,
  setPuzzleTelemetryProviderForTests,
  trackPuzzleCompleted,
  trackPuzzleSkipped,
  trackPuzzleStarted,
  trackTrainingSessionCompleted,
  trackTrainingSessionStarted,
} from "@/services/puzzle-telemetry.service";
import type { PuzzleTelemetryProvider } from "@/lib/puzzle-telemetry/provider";

const baseCtx = {
  sessionId: "session-1",
  trainingSetId: "woodpecker-easy",
  puzzleId: "wp-easy-37",
  puzzleNumber: 37,
  difficulty: "easy",
  cycleNumber: 3,
};

describe("puzzle-telemetry.service", () => {
  const sent: import("@/lib/puzzle-telemetry/types").PuzzleTelemetryEvent[] = [];
  const provider: PuzzleTelemetryProvider = {
    send(event) {
      sent.push(event);
    },
  };

  beforeEach(() => {
    sent.length = 0;
    resetPuzzleTelemetryProviderForTests();
    setPuzzleTelemetryProviderForTests(provider);
  });

  afterEach(() => {
    resetPuzzleTelemetryProviderForTests();
  });

  it("emits puzzle_started with puzzle metadata", () => {
    trackPuzzleStarted(baseCtx);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      event: "puzzle_started",
      sessionId: baseCtx.sessionId,
      trainingSetId: baseCtx.trainingSetId,
      puzzleId: baseCtx.puzzleId,
      puzzleNumber: 37,
      difficulty: "easy",
      cycleNumber: 3,
    });
    expect(sent[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("emits puzzle_completed and pattern_recall when first-move timing is present", () => {
    trackPuzzleCompleted({
      ...baseCtx,
      solved: true,
      attempts: 1,
      timeMs: 12_000,
      timeToFirstMoveMs: 4_500,
    });
    expect(sent.map((e) => e.event)).toEqual([
      "puzzle_completed",
      "pattern_recall",
    ]);
    expect(sent[0]).toMatchObject({
      event: "puzzle_completed",
      solved: true,
      attempts: 1,
      timeMs: 12_000,
    });
    expect(sent[1]).toMatchObject({
      event: "pattern_recall",
      puzzleId: baseCtx.puzzleId,
      puzzleNumber: 37,
      cycleNumber: 3,
      timeToFirstMoveMs: 4_500,
      solved: true,
    });
  });

  it("emits puzzle_completed without pattern_recall when no first move", () => {
    trackPuzzleCompleted({
      ...baseCtx,
      solved: false,
      attempts: 1,
      timeMs: 800,
    });
    expect(sent).toHaveLength(1);
    expect(sent[0].event).toBe("puzzle_completed");
  });

  it("emits puzzle_skipped with time on puzzle", () => {
    trackPuzzleSkipped({ ...baseCtx, timeMs: 3_200 });
    expect(sent[0]).toMatchObject({
      event: "puzzle_skipped",
      puzzleNumber: 37,
      timeMs: 3_200,
    });
  });

  it("emits training session lifecycle events", () => {
    trackTrainingSessionStarted({
      sessionId: "session-1",
      trainingSetId: "woodpecker-intermediate",
      cycleNumber: 2,
    });
    trackTrainingSessionCompleted({
      sessionId: "session-1",
      trainingSetId: "woodpecker-intermediate",
      cycleNumber: 2,
      timeMs: 540_000,
    });
    expect(sent.map((e) => e.event)).toEqual([
      "training_session_started",
      "training_session_completed",
    ]);
    expect(sent[1].timeMs).toBe(540_000);
  });

  it("swallows provider errors without throwing", () => {
    setPuzzleTelemetryProviderForTests({
      send() {
        throw new Error("provider down");
      },
    });
    expect(() => trackPuzzleStarted(baseCtx)).not.toThrow();
  });

  it("mirrors events to the debug buffer in browser", () => {
    trackPuzzleStarted(baseCtx);
    expect(getPuzzleTelemetryDebugBuffer()).toHaveLength(1);
  });
});
