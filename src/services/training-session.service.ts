/**
 * Training session service. Get/create active session, record attempts, complete session.
 * Phase 3: lightweight session per active cycle; no full timing/analytics yet.
 */

import {
  getActiveByCycleRunId,
  addSession,
  updateSession,
  getSessionById,
} from "@/repositories/session.repository";

export interface ActiveSession {
  id: string;
  trainingSetId: string;
  cycleRunId: string;
  status: "active";
  startedAt: string;
  puzzlesAttempted: number;
  correctCount: number;
  skippedCount: number;
}

/**
 * Find active session for this cycle, or create one.
 * Reuse existing so attempts are grouped under one session.
 */
export async function getOrCreateActiveSession(
  trainingSetId: string,
  cycleRunId: string
): Promise<ActiveSession> {
  const existing = await getActiveByCycleRunId(cycleRunId);
  if (existing) {
    return {
      id: existing.id,
      trainingSetId: existing.trainingSetId,
      cycleRunId: existing.cycleRunId,
      status: "active",
      startedAt: existing.startedAt,
      puzzlesAttempted: existing.puzzlesAttempted,
      correctCount: existing.correctCount,
      skippedCount: existing.skippedCount,
    };
  }
  const now = new Date().toISOString();
  const id = await addSession({
    id: crypto.randomUUID(),
    trainingSetId,
    cycleRunId,
    startedAt: now,
    activeTimeMs: 0,
    puzzlesAttempted: 0,
    correctCount: 0,
    skippedCount: 0,
    status: "active",
  });
  return {
    id,
    trainingSetId,
    cycleRunId,
    status: "active",
    startedAt: now,
    puzzlesAttempted: 0,
    correctCount: 0,
    skippedCount: 0,
  };
}

/**
 * Increment session counters and active time after an attempt.
 * Phase 5: durationMs is added to session.activeTimeMs.
 */
export async function recordAttemptOnSession(
  sessionId: string,
  result: "correct" | "incorrect" | "skipped",
  durationMs: number = 0
): Promise<void> {
  const session = await getSessionById(sessionId);
  if (!session) return;
  const updates: Partial<typeof session> = {
    puzzlesAttempted: session.puzzlesAttempted + 1,
    activeTimeMs: session.activeTimeMs + (Number.isFinite(durationMs) ? durationMs : 0),
  };
  if (result === "correct") {
    updates.correctCount = session.correctCount + 1;
  }
  if (result === "skipped") {
    updates.skippedCount = session.skippedCount + 1;
  }
  await updateSession(sessionId, updates);
}

/**
 * Mark session completed (e.g. when cycle ends).
 */
export async function completeSession(sessionId: string): Promise<void> {
  const now = new Date().toISOString();
  await updateSession(sessionId, {
    status: "completed",
    endedAt: now,
  });
}
