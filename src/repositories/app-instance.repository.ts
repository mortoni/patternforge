/**
 * App instance repository. Client-side only.
 */

import { db } from "@/db/dexie";
import type { AppInstanceSchema } from "@/db/schema";

const INSTALLATION_KEY = "installationId";

export async function getAppInstance(): Promise<AppInstanceSchema | undefined> {
  const first = await db.appInstance.toCollection().first();
  return first;
}

export async function upsertAppInstance(
  data: Omit<AppInstanceSchema, "createdAt" | "lastOpenedAt"> & {
    createdAt?: string;
    lastOpenedAt?: string;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const existing = await db.appInstance
    .where(INSTALLATION_KEY)
    .equals(data.installationId)
    .first();
  if (existing) {
    await db.appInstance.update(data.installationId, {
      lastOpenedAt: now,
    });
  } else {
    await db.appInstance.add({
      ...data,
      createdAt: data.createdAt ?? now,
      lastOpenedAt: data.lastOpenedAt ?? now,
    });
  }
}
