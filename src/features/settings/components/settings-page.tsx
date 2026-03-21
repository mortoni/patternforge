"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { ThemeSettingCard } from "./theme-setting-card";
import { BoardOrientationCard } from "./board-orientation-card";
import { BoardStyleCard } from "./board-style-card";
import { TrainingPreferencesCard } from "./training-preferences-card";
import { DevResetProgressCard } from "./dev-reset-progress-card";
import { useSettingsContext } from "../context/settings-context";
import { parseBoardStyleId } from "@/lib/chess/board-styles";

export function SettingsPage() {
  const {
    settings,
    loading,
    error,
    setTheme,
    setBoardOrientation,
    setBoardStyle,
  } = useSettingsContext();

  if (error) {
    return (
      <>
        <PageHeader
          title="Settings"
          description="Manage your training preferences and interface settings."
        />
        <p className="text-sm text-muted-foreground">
          Failed to load settings: {error.message}
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your training preferences and interface settings."
      />
      <div className="max-w-xl space-y-6">
        <ThemeSettingCard
          value={settings?.theme ?? "system"}
          onChange={(theme) => setTheme(theme)}
          disabled={loading}
        />
        <BoardOrientationCard
          value={settings?.boardOrientation ?? "white"}
          onChange={(boardOrientation) => setBoardOrientation(boardOrientation)}
          disabled={loading}
        />
        <BoardStyleCard
          value={parseBoardStyleId(settings?.boardStyle)}
          onChange={(boardStyle) => setBoardStyle(boardStyle)}
          disabled={loading}
        />
        <TrainingPreferencesCard />
        <div className="mt-8 border-t border-border pt-8">
          <DevResetProgressCard />
        </div>
      </div>
    </>
  );
}
