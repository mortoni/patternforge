import { track } from "@vercel/analytics";
import type { PuzzleTelemetryEvent } from "./types";

export interface PuzzleTelemetryProvider {
  send(event: PuzzleTelemetryEvent): void;
}

export function createNoopPuzzleTelemetryProvider(): PuzzleTelemetryProvider {
  return { send() {} };
}

/** Sends events to Vercel Analytics when available; swallows all errors. */
export function createVercelPuzzleTelemetryProvider(): PuzzleTelemetryProvider {
  return {
    send(event) {
      const { event: name, ...rest } = event;
      const data: Record<string, string | number | boolean | null> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (value !== undefined) {
          data[key] = value;
        }
      }
      if (Object.keys(data).length > 0) {
        track(name, data);
      } else {
        track(name);
      }
    },
  };
}

declare global {
  interface Window {
    __puzzleTelemetryEvents?: PuzzleTelemetryEvent[];
  }
}

/** Mirrors donation telemetry — e2e / dev can attach a buffer without Vercel. */
export function appendPuzzleTelemetryDebugBuffer(event: PuzzleTelemetryEvent): void {
  if (typeof window === "undefined") return;
  const buf = window.__puzzleTelemetryEvents ?? [];
  buf.push(event);
  window.__puzzleTelemetryEvents = buf;
}
