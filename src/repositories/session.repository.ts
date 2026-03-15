/**
 * Session repository. Client-side only.
 */

import { db } from "@/db/dexie";
import type { SessionSchema } from "@/db/schema";

export async function getSessionById(
  id: string
): Promise<SessionSchema | undefined> {
  return db.sessions.get(id);
}

export async function getActiveSession(): Promise<SessionSchema | undefined> {
  return db.sessions.where("status").equals("active").first();
}

export async function getSessionsByCycleRunId(
  cycleRunId: string
): Promise<SessionSchema[]> {
  return db.sessions
    .where("cycleRunId")
    .equals(cycleRunId)
    .sortBy("startedAt");
}

/** Fetch all sessions for the given cycle run IDs (batch; avoids N+1). */
export async function getSessionsByCycleRunIds(
  cycleRunIds: string[]
): Promise<SessionSchema[]> {
  if (cycleRunIds.length === 0) return [];
  const seen = new Set(cycleRunIds);
  const all = await db.sessions
    .where("cycleRunId")
    .anyOf(cycleRunIds)
    .toArray();
  return all.filter((s) => seen.has(s.cycleRunId));
}

/** Active session for a cycle, if any. */
export async function getActiveByCycleRunId(
  cycleRunId: string
): Promise<SessionSchema | undefined> {
  const sessions = await db.sessions
    .where("cycleRunId")
    .equals(cycleRunId)
    .filter((s) => s.status === "active")
    .toArray();
  return sessions[0];
}

export async function getRecentSessions(limit: number): Promise<SessionSchema[]> {
  return db.sessions
    .orderBy("startedAt")
    .reverse()
    .limit(limit)
    .toArray();
}

/** Recent completed sessions only, sorted by endedAt descending. */
export async function getRecentCompleted(
  limit: number
): Promise<SessionSchema[]> {
  const sessions = await db.sessions
    .where("status")
    .equals("completed")
    .toArray();
  sessions.sort(
    (a, b) =>
      (b.endedAt ?? "").localeCompare(a.endedAt ?? "")
  );
  return sessions.slice(0, limit);
}

/** Count of completed sessions. */
export async function getCompletedSessionsCount(): Promise<number> {
  return db.sessions.where("status").equals("completed").count();
}

export async function addSession(
  data: Omit<SessionSchema, "id"> & { id?: string }
): Promise<string> {
  const id = data.id ?? crypto.randomUUID();
  await db.sessions.add({ ...data, id });
  return id;
}

export async function updateSession(
  id: string,
  patch: Partial<Omit<SessionSchema, "id">>
): Promise<void> {
  await db.sessions.update(id, patch);
}

/** Count sessions for a cycle run (e.g. for cycle history). */
export async function countByCycleRunId(
  cycleRunId: string
): Promise<number> {
  return db.sessions.where("cycleRunId").equals(cycleRunId).count();
}
