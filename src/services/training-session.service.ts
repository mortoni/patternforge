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

/** Serialize creation per cycle so concurrent getOrCreate cannot insert two actives. */
const creatingSessionByCycleRunId = new Map<string, Promise<ActiveSession>>();

function sessionRowToActive(s: {
  id: string;
  trainingSetId: string;
  cycleRunId: string;
  startedAt: string;
  puzzlesAttempted: number;
  correctCount: number;
  skippedCount: number;
}): ActiveSession {
  return {
    id: s.id,
    trainingSetId: s.trainingSetId,
    cycleRunId: s.cycleRunId,
    status: "active",
    startedAt: s.startedAt,
    puzzlesAttempted: s.puzzlesAttempted,
    correctCount: s.correctCount,
    skippedCount: s.skippedCount,
  };
}

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
    return sessionRowToActive(existing);
  }

  const pending = creatingSessionByCycleRunId.get(cycleRunId);
  if (pending) {
    return pending;
  }

  const work = (async (): Promise<ActiveSession> => {
    try {
      const again = await getActiveByCycleRunId(cycleRunId);
      if (again) {
        return sessionRowToActive(again);
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
    } finally {
      creatingSessionByCycleRunId.delete(cycleRunId);
    }
  })();

  creatingSessionByCycleRunId.set(cycleRunId, work);
  return work;
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
  const prevAttempted = session.puzzlesAttempted ?? 0;
  const prevSkipped = session.skippedCount ?? 0;
  const prevCorrect = session.correctCount ?? 0;
  const prevActive = session.activeTimeMs ?? 0;
  const updates: Partial<typeof session> = {
    puzzlesAttempted: prevAttempted + 1,
    activeTimeMs: prevActive + (Number.isFinite(durationMs) ? durationMs : 0),
  };
  if (result === "correct") {
    updates.correctCount = prevCorrect + 1;
  }
  if (result === "skipped") {
    updates.skippedCount = prevSkipped + 1;
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
