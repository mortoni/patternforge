/**
 * AppSettings entity: user preferences.
 */

export type Theme = "light" | "dark" | "system";
export type BoardOrientation = "white" | "black";

export interface AppSettings {
  id: string;
  theme: Theme;
  boardOrientation: BoardOrientation;
  lastTrainingSetId?: string;
  autoBoardOrientation: boolean;
}
