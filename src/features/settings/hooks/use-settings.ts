"use client";

import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import {
  getSettingsWithDefaults,
  getStaticPreviewAppSettings,
  updateTheme as serviceUpdateTheme,
  updateBoardOrientation as serviceUpdateBoardOrientation,
  updateBoardStyle as serviceUpdateBoardStyle,
  updateAutoBoardOrientation as serviceAutoUpdateBoardOrientation,
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
  setAutoBoardOrientation: (
    autoBoardOrientation: AppSettingsSchema["autoBoardOrientation"]
  ) => Promise<void>;
}

/**
 * Loads settings with defaults and exposes updaters. Used by Settings page and theme sync.
 */
function isPreviewPath(): boolean {
  return (
    typeof window !== "undefined" && window.location.pathname.startsWith("/preview")
  );
}

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
    if (isPreviewPath()) {
      setSettings(getStaticPreviewAppSettings());
      setLoading(false);
      setError(null);
      return;
    }
    void load();
  }, [load]);

  const setTheme = useCallback(async (theme: AppSettingsSchema["theme"]) => {
    if (isPreviewPath()) {
      flushSync(() => {
        setSettings((prev) =>
          prev ? { ...prev, theme } : { ...getStaticPreviewAppSettings(), theme }
        );
      });
      return;
    }

    /** Capture before optimistic update so we can roll back if Dexie persist fails. */
    let revertTheme: AppSettingsSchema["theme"] | undefined;
    flushSync(() => {
      setSettings((prev) => {
        if (!prev) return prev;
        revertTheme = prev.theme;
        return { ...prev, theme };
      });
    });

    try {
      const next = await serviceUpdateTheme(theme);
      setSettings((prev) => (prev ? { ...prev, theme: next.theme } : next));
    } catch (e) {
      flushSync(() => {
        setSettings((prev) =>
          prev && revertTheme !== undefined ? { ...prev, theme: revertTheme } : prev
        );
      });
      throw e;
    }
  }, []);

  const setBoardOrientation = useCallback(
    async (boardOrientation: AppSettingsSchema["boardOrientation"]) => {
      if (isPreviewPath()) {
        setSettings((prev) =>
          prev
            ? { ...prev, boardOrientation }
            : { ...getStaticPreviewAppSettings(), boardOrientation }
        );
        return;
      }
      const next = await serviceUpdateBoardOrientation(boardOrientation);
      setSettings((prev) =>
        prev ? { ...prev, boardOrientation: next.boardOrientation } : next
      );
    },
    []
  );

  const setAutoBoardOrientation = useCallback(
    async (autoBoardOrientation: AppSettingsSchema["autoBoardOrientation"]) => {
      if (isPreviewPath()) {
        setSettings((prev) =>
          prev
            ? { ...prev, autoBoardOrientation }
            : { ...getStaticPreviewAppSettings(), autoBoardOrientation }
        );
        return;
      }
      const next = await serviceAutoUpdateBoardOrientation(autoBoardOrientation);
      setSettings((prev) =>
        prev ? { ...prev, autoBoardOrientation: next.autoBoardOrientation } : next
      );
    },
    []
  );

  const setBoardStyle = useCallback(async (boardStyle: BoardStyleId) => {
    if (isPreviewPath()) {
      setSettings((prev) =>
        prev
          ? { ...prev, boardStyle }
          : { ...getStaticPreviewAppSettings(), boardStyle }
      );
      return;
    }
    const next = await serviceUpdateBoardStyle(boardStyle);
    setSettings((prev) => (prev ? { ...prev, boardStyle: next.boardStyle } : next));
  }, []);

  const reload = useCallback(async () => {
    if (isPreviewPath()) {
      setSettings(getStaticPreviewAppSettings());
      setLoading(false);
      setError(null);
      return;
    }
    await load();
  }, [load]);

  return {
    settings,
    loading,
    error,
    setTheme,
    setBoardOrientation,
    setAutoBoardOrientation,
    setBoardStyle,
    reload,
  };
}
