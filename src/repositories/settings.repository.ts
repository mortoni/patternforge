/**
 * Settings repository. Client-side only.
 */

import { db } from "@/db/dexie";
import type { AppSettingsSchema } from "@/db/schema";

const SETTINGS_ID = "default";

export async function getSettings(): Promise<AppSettingsSchema | undefined> {
  return db.settings.get(SETTINGS_ID);
}

export async function putSettings(
  data: Partial<AppSettingsSchema> & { id?: string }
): Promise<void> {
  const id = data.id ?? SETTINGS_ID;
  await db.settings.put({
    id,
    theme: data.theme ?? "system",
    boardOrientation: data.boardOrientation ?? "white",
    boardStyle: data.boardStyle ?? "classic",
    lastTrainingSetId: data.lastTrainingSetId,
    autoBoardOrientation: data.autoBoardOrientation ?? false,
  });
}

export async function updateSettings(
  patch: Partial<Omit<AppSettingsSchema, "id">>
): Promise<void> {
  const existing = await db.settings.get(SETTINGS_ID);
  if (!existing) {
    await putSettings({ ...patch, id: SETTINGS_ID });
    return;
  }
  await db.settings.update(SETTINGS_ID, patch);
}

export async function setLastTrainingSet(trainingSetId: string): Promise<void> {
  await updateSettings({ lastTrainingSetId: trainingSetId });
}

export async function upsertSettings(
  data: Partial<AppSettingsSchema> & { id?: string }
): Promise<void> {
  await putSettings(data);
}
