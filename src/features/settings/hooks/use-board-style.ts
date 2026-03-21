"use client";

import * as React from "react";
import { useSettingsContext } from "../context/settings-context";
import {
  parseBoardStyleId,
  resolveBoardChessStyles,
  type ResolvedBoardChessStyles,
} from "@/lib/chess/board-styles";
import { MT_MODEL_PIECES } from "@/lib/chess/mt-model-pieces";

/**
 * Resolved square / frame tokens for the user’s global board style preference.
 */
export function useBoardStyle(): ResolvedBoardChessStyles {
  const { settings } = useSettingsContext();
  const id = parseBoardStyleId(settings?.boardStyle);
  return React.useMemo(() => {
    const base = resolveBoardChessStyles(id);
    return {
      ...base,
      pieces: id === "mtModel" ? MT_MODEL_PIECES : undefined,
    };
  }, [id]);
}
