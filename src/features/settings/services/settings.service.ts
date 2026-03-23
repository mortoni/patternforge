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
import { parseBoardStyleId, type BoardStyleId } from "@/lib/chess/board-styles";

const DEFAULTS: Pick<
  AppSettingsSchema,
  | "theme"
  | "boardOrientation"
  | "boardStyle"
  | "lastTrainingSetId"
  | "autoBoardOrientation"
> = {
  theme: "system",
  boardOrientation: "white",
  boardStyle: "classic",
  lastTrainingSetId: undefined,
  autoBoardOrientation: false,
};

function normalizeSettings(row: AppSettingsSchema | undefined): AppSettingsSchema {
  if (!row) {
    return { id: "default", ...DEFAULTS };
  }
  return {
    ...row,
    theme: row.theme ?? DEFAULTS.theme,
    boardOrientation: row.boardOrientation ?? DEFAULTS.boardOrientation,
    boardStyle: parseBoardStyleId(row.boardStyle),
    lastTrainingSetId: row.lastTrainingSetId,
  };
}

export type ThemeValue = AppSettingsSchema["theme"];
export type BoardOrientationValue = AppSettingsSchema["boardOrientation"];
export type AutoBoardOrientationValue = AppSettingsSchema["autoBoardOrientation"];
export type BoardStyleValue = BoardStyleId;

/**
 * Returns current settings, creating defaults if none exist.
 */
export async function getSettingsWithDefaults(): Promise<AppSettingsSchema> {
  const existing = await getSettings();
  if (existing) return normalizeSettings(existing);
  await putSettings({
    id: "default",
    ...DEFAULTS,
  });
  return { id: "default", ...DEFAULTS };
}

/**
 * Updates theme and persists.
 */
export async function updateTheme(theme: ThemeValue): Promise<AppSettingsSchema> {
  await updateSettings({ theme });
  const next = await getSettings();
  return normalizeSettings(next ?? { id: "default", ...DEFAULTS, theme });
}

/**
 * Updates board orientation and persists.
 */
export async function updateBoardOrientation(
  boardOrientation: BoardOrientationValue
): Promise<AppSettingsSchema> {
  await updateSettings({ boardOrientation });
  const next = await getSettings();
  return normalizeSettings(next ?? { id: "default", ...DEFAULTS, boardOrientation });
}

/**
 * Updates auto board orientation and persists.
 */
export async function updateAutoBoardOrientation(
  autoBoardOrientation: AutoBoardOrientationValue
): Promise<AppSettingsSchema> {
  await updateSettings({ autoBoardOrientation });
  const next = await getSettings();
  return normalizeSettings(next ?? { id: "default", ...DEFAULTS, autoBoardOrientation });
}

/**
 * Updates global board palette and persists.
 */
export async function updateBoardStyle(
  boardStyle: BoardStyleValue
): Promise<AppSettingsSchema> {
  await updateSettings({ boardStyle });
  const next = await getSettings();
  return normalizeSettings(next ?? { id: "default", ...DEFAULTS, boardStyle });
}

export { DEFAULTS as SETTINGS_DEFAULTS };
