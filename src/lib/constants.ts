/**
 * App-wide constants.
 * Primary visual direction: dark navy.
 */

export const APP_NAME = "PatternForge";

export const COLORS = {
  primary: {
    navy: "hsl(220 35% 12%)",
    navyForeground: "hsl(210 40% 98%)",
    navyMuted: "hsl(220 25% 18%)",
  },
} as const;

export const ROUTES = {
  home: "/",
  privacy: "/privacy",
  terms: "/terms",
  docs: "/docs",
  app: "/app",
  training: "/app/training",
  /** Post–end-session checkpoint; query: `?sessionId=` */
  trainingSessionSummary: "/app/training/session-summary",
  session: "/app/session",
  sets: "/app/sets",
  mistakes: "/app/mistakes",
  progress: "/app/progress",
  /** Legacy path; redirects to {@link ROUTES.progress}. */
  analytics: "/app/analytics",
  settings: "/app/settings",
  debug: "/app/debug",
} as const;

/** Completed-cycle reflection report. */
export function cycleSummaryRoute(cycleId: string): string {
  return `/app/cycle/${cycleId}/summary`;
}
