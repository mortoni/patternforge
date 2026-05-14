"use client";

import * as React from "react";
import { useSettingsContext } from "@/features/settings/context/settings-context";
import type { AppColorScheme } from "@/lib/chess/board-styles";

function readEffectiveScheme(
  theme: "light" | "dark" | "system" | undefined
): AppColorScheme {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

/** App shell theme (matches `html.dark` / settings), for scheme-aware board palettes. */
export function useEffectiveAppColorScheme(): AppColorScheme {
  const { settings } = useSettingsContext();

  const [scheme, setScheme] = React.useState<AppColorScheme>(() =>
    readEffectiveScheme(settings?.theme)
  );

  React.useLayoutEffect(() => {
    setScheme(readEffectiveScheme(settings?.theme));
  }, [settings?.theme]);

  React.useEffect(() => {
    if (settings?.theme !== "system" || typeof window.matchMedia !== "function")
      return;
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () =>
      setScheme(
        m.matches ? "dark" : "light"
      );
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, [settings?.theme]);

  return scheme;
}
