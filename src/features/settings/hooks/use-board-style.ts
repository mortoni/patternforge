"use client";

import * as React from "react";
import { useSettingsContext } from "../context/settings-context";
import {
  parseBoardStyleId,
  resolveBoardChessStyles,
  type ResolvedBoardChessStyles,
} from "@/lib/chess/board-styles";
import { useEffectiveAppColorScheme } from "./use-effective-app-color-scheme";

/**
 * Resolved square / frame tokens for the user’s global board style preference.
 */
export function useBoardStyle(): ResolvedBoardChessStyles {
  const { settings } = useSettingsContext();
  const colorScheme = useEffectiveAppColorScheme();
  const id = parseBoardStyleId(settings?.boardStyle);
  return React.useMemo(
    () => resolveBoardChessStyles(id, { colorScheme }),
    [id, colorScheme]
  );
}
