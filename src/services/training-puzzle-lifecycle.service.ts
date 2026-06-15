/**
 * Training puzzle lifecycle hooks — keeps telemetry out of UI components.
 */

import { trackPuzzleStarted } from "@/services/puzzle-telemetry.service";
import type { PuzzleTelemetryContext } from "@/lib/puzzle-telemetry/types";

export type PuzzleActivationContext = PuzzleTelemetryContext;

/** Called when a puzzle becomes active for the user (new exercise or cycle). */
export function notifyPuzzleActivated(ctx: PuzzleActivationContext): void {
  trackPuzzleStarted(ctx);
}
