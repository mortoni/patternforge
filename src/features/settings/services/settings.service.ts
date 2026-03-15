/**
 * Settings service. Loads and updates user preferences from AppSettings.
 * Ensures defaults exist when missing.
 */

import {
  getSettings,
  updateSettings,
  putSettings,
} from "@/repositories/settings.repository";
import type { AppSettingsSchema } from "@/db/schema";

const DEFAULTS: Pick<
  AppSettingsSchema,
  "theme" | "boardOrientation" | "lastTrainingSetId"
> = {
  theme: "system",
  boardOrientation: "white",
  lastTrainingSetId: undefined,
};

export type ThemeValue = AppSettingsSchema["theme"];
export type BoardOrientationValue = AppSettingsSchema["boardOrientation"];

/**
 * Returns current settings, creating defaults if none exist.
 */
export async function getSettingsWithDefaults(): Promise<AppSettingsSchema> {
  const existing = await getSettings();
  if (existing) return existing;
  await putSettings({
    id: "default",
    ...DEFAULTS,
  });
  return { id: "default", ...DEFAULTS };
}

/**
 * Updates theme and persists.
 */
export async function updateTheme(
  theme: ThemeValue
): Promise<AppSettingsSchema> {
  await updateSettings({ theme });
  const next = await getSettings();
  return next ?? { id: "default", ...DEFAULTS, theme };
}

/**
 * Updates board orientation and persists.
 */
export async function updateBoardOrientation(
  boardOrientation: BoardOrientationValue
): Promise<AppSettingsSchema> {
  await updateSettings({ boardOrientation });
  const next = await getSettings();
  return next ?? { id: "default", ...DEFAULTS, boardOrientation };
}

export { DEFAULTS as SETTINGS_DEFAULTS };
