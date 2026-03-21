"use client";

import * as React from "react";

export type SidebarMode = "expanded" | "collapsed" | "hidden";
type NonHiddenMode = Exclude<SidebarMode, "hidden">;

const SIDEBAR_PREFERENCE_KEY = "patternforge.sidebarPreference";

function readPreferredMode(): NonHiddenMode {
  if (typeof window === "undefined") return "expanded";
  try {
    const raw = window.localStorage.getItem(SIDEBAR_PREFERENCE_KEY);
    if (raw === "collapsed" || raw === "expanded") return raw;
  } catch {
    // Ignore localStorage errors (private mode, etc).
  }
  return "expanded";
}

type SidebarContextValue = {
  /** Current global mode, including `hidden` for training focus. */
  mode: SidebarMode;
  /** Persisted user preference used after leaving training focus. */
  preferredMode: NonHiddenMode;
  /** Whether an overlay sidebar is currently open (only used when mode is `hidden`). */
  overlayOpen: boolean;
  /** Overlay uses a temporary display mode (can still be toggled). */
  overlayMode: NonHiddenMode;

  setExpanded: () => void;
  setCollapsed: () => void;
  toggleCollapsed: () => void;

  /** Enter training focus: sidebar hidden and any overlay closed. */
  enterHiddenMode: () => void;
  /** Leave training focus: restore sidebar based on preferredMode. */
  exitHiddenMode: () => void;

  /** Open overlay while in hidden mode. */
  openOverlay: () => void;
  /** Close overlay and return to hidden mode. */
  closeOverlay: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function SidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fixed defaults on server + first client render avoid hydration mismatch
  // (SSR has no localStorage; reading it in useState() diverges from the server HTML).
  const [preferredMode, setPreferredMode] =
    React.useState<NonHiddenMode>("expanded");
  const [mode, setMode] = React.useState<SidebarMode>("expanded");
  const [overlayOpen, setOverlayOpen] = React.useState(false);
  const [overlayMode, setOverlayMode] = React.useState<NonHiddenMode>("expanded");
  const preferenceHydratedRef = React.useRef(false);

  React.useEffect(() => {
    const stored = readPreferredMode();
    setPreferredMode(stored);
    setMode((current) => (current === "hidden" ? current : stored));
    preferenceHydratedRef.current = true;
  }, []);

  React.useEffect(() => {
    if (!preferenceHydratedRef.current) return;
    try {
      window.localStorage.setItem(
        SIDEBAR_PREFERENCE_KEY,
        preferredMode
      );
    } catch {
      // Ignore persistence errors.
    }
  }, [preferredMode]);

  const setExpanded = React.useCallback(() => {
    setPreferredMode("expanded");
    if (mode !== "hidden") setMode("expanded");
    if (overlayOpen) setOverlayMode("expanded");
  }, [mode, overlayOpen]);

  const setCollapsed = React.useCallback(() => {
    setPreferredMode("collapsed");
    if (mode !== "hidden") setMode("collapsed");
    if (overlayOpen) setOverlayMode("collapsed");
  }, [mode, overlayOpen]);

  const toggleCollapsed = React.useCallback(() => {
    const next: NonHiddenMode = preferredMode === "expanded" ? "collapsed" : "expanded";
    setPreferredMode(next);
    if (mode !== "hidden") setMode(next);
    if (overlayOpen) setOverlayMode(next);
  }, [preferredMode, mode, overlayOpen]);

  const enterHiddenMode = React.useCallback(() => {
    setMode("hidden");
    setOverlayOpen(false);
  }, []);

  const exitHiddenMode = React.useCallback(() => {
    setMode(preferredMode);
    setOverlayOpen(false);
  }, [preferredMode]);

  const openOverlay = React.useCallback(() => {
    // Woodpecker training focus: start from expanded for immediate access.
    setOverlayMode("expanded");
    setOverlayOpen(true);
  }, []);

  const closeOverlay = React.useCallback(() => {
    setOverlayOpen(false);
    setMode("hidden");
  }, []);

  const value: SidebarContextValue = {
    mode,
    preferredMode,
    overlayOpen,
    overlayMode,
    setExpanded,
    setCollapsed,
    toggleCollapsed,
    enterHiddenMode,
    exitHiddenMode,
    openOverlay,
    closeOverlay,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}

