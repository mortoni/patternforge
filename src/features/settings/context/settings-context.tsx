"use client";

import * as React from "react";
import { useSettings } from "../hooks/use-settings";
import type { AppSettingsSchema } from "@/db/schema";
import type { BoardStyleId } from "@/lib/chess/board-styles";

type ThemeValue = AppSettingsSchema["theme"];
type BoardOrientationValue = AppSettingsSchema["boardOrientation"];
type AutoBoardOrientationValue = AppSettingsSchema["autoBoardOrientation"];

interface SettingsContextValue {
  settings: AppSettingsSchema | null;
  loading: boolean;
  error: Error | null;
  setTheme: (theme: ThemeValue) => Promise<void>;
  setBoardOrientation: (boardOrientation: BoardOrientationValue) => Promise<void>;
  setBoardStyle: (boardStyle: BoardStyleId) => Promise<void>;
  reload: () => Promise<void>;
  setAutoBoardOrientation: (autoBoardOrientation: AutoBoardOrientationValue) => Promise<void>;
}

const SettingsContext = React.createContext<SettingsContextValue | null>(null);

function isPreviewDocument(): boolean {
  return (
    typeof window !== "undefined" && window.location.pathname.startsWith("/preview")
  );
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const value = useSettings();
  const themeMode = value.settings?.theme;

  React.useEffect(() => {
    if (isPreviewDocument()) return;
    if (typeof document === "undefined" || !value.settings) return;
    const { theme } = value.settings;
    const root = document.documentElement;
    const getEffective = (): "light" | "dark" => {
      if (theme !== "system") return theme;
      if (typeof window.matchMedia !== "function") return "light";
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    };
    const effective = getEffective();
    if (effective === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("patternforge-theme", effective);
    } catch {
      /* ignore */
    }
  }, [value.settings]);

  React.useEffect(() => {
    if (isPreviewDocument()) return;
    if (themeMode !== "system" || typeof window.matchMedia !== "function")
      return;
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const root = document.documentElement;
      if (m.matches) root.classList.add("dark");
      else root.classList.remove("dark");
    };
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, [themeMode]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext(): SettingsContextValue {
  const ctx = React.useContext(SettingsContext);
  if (!ctx) throw new Error("useSettingsContext must be used within SettingsProvider");
  return ctx;
}
