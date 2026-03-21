"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resetUserProgressPreserveLibrary } from "@/services/reset-user-progress.service";

const isDev = process.env.NODE_ENV === "development";

/**
 * Development-only card to reset user progress while preserving the puzzle library.
 * Not rendered in production. Includes confirmation before running.
 */
export function DevResetProgressCard() {
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!isDev || typeof window === "undefined") return;
    const w = window as unknown as {
      resetUserProgress?: typeof resetUserProgressPreserveLibrary;
    };
    w.resetUserProgress = resetUserProgressPreserveLibrary;
    return () => {
      delete w.resetUserProgress;
    };
  }, []);

  const handleReset = async () => {
    if (!isDev) return;
    const message =
      "Reset all progress (cycles, sessions, attempts, mistakes) and restore default settings? Training sets and exercises will be kept.";
    if (!window.confirm(message)) return;
    setRunning(true);
    try {
      const result = await resetUserProgressPreserveLibrary();
      const summary = [
        `Cycles: ${result.cycleRunsDeleted}`,
        `Sessions: ${result.sessionsDeleted}`,
        `Attempts: ${result.attemptsDeleted}`,
        `Mistakes: ${result.mistakesDeleted}`,
        `App instance: ${result.appInstanceReset}`,
        `Settings: reset to default`,
      ].join("\n");
      window.alert(`Progress reset.\n\n${summary}\n\nReload the app to see a fresh state.`);
    } catch (e) {
      window.alert(`Reset failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRunning(false);
    }
  };

  if (!isDev) return null;

  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardHeader>
        <h3 className="text-sm font-medium text-amber-700 dark:text-amber-400">
          Reset user progress (dev only)
        </h3>
        <p className="text-xs text-muted-foreground">
          Clears cycles, sessions, attempts, mistakes, and resets settings. Training sets and
          exercises are preserved. Reload after reset.
        </p>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={running}
          className="border-amber-500/50 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
        >
          {running ? "Resetting…" : "Reset user progress"}
        </Button>
      </CardContent>
    </Card>
  );
}
