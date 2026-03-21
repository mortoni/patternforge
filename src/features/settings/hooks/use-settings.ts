"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getSettingsWithDefaults,
  updateTheme as serviceUpdateTheme,
  updateBoardOrientation as serviceUpdateBoardOrientation,
  updateBoardStyle as serviceUpdateBoardStyle,
} from "../services/settings.service";
import type { AppSettingsSchema } from "@/db/schema";
import type { BoardStyleId } from "@/lib/chess/board-styles";

export interface UseSettingsResult {
  settings: AppSettingsSchema | null;
  loading: boolean;
  error: Error | null;
  setTheme: (theme: AppSettingsSchema["theme"]) => Promise<void>;
  setBoardOrientation: (
    boardOrientation: AppSettingsSchema["boardOrientation"]
  ) => Promise<void>;
  setBoardStyle: (boardStyle: BoardStyleId) => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Loads settings with defaults and exposes updaters. Used by Settings page and theme sync.
 */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettingsSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getSettingsWithDefaults();
      setSettings(next);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setTheme = useCallback(
    async (theme: AppSettingsSchema["theme"]) => {
      const next = await serviceUpdateTheme(theme);
      setSettings((prev) => (prev ? { ...prev, theme: next.theme } : next));
    },
    []
  );

  const setBoardOrientation = useCallback(
    async (boardOrientation: AppSettingsSchema["boardOrientation"]) => {
      const next = await serviceUpdateBoardOrientation(boardOrientation);
      setSettings((prev) =>
        prev ? { ...prev, boardOrientation: next.boardOrientation } : next
      );
    },
    []
  );

  const setBoardStyle = useCallback(async (boardStyle: BoardStyleId) => {
    const next = await serviceUpdateBoardStyle(boardStyle);
    setSettings((prev) =>
      prev ? { ...prev, boardStyle: next.boardStyle } : next
    );
  }, []);

  return {
    settings,
    loading,
    error,
    setTheme,
    setBoardOrientation,
    setBoardStyle,
    reload: load,
  };
}
