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
  /** Marketing / iframe: static training preview UI, no session / DB. */
  previewTraining: "/preview/training",
} as const;

/**
 * Hosted Storybook on Chromatic (product docs + workbench).
 * Sidebar “Documentation” and marketing “Documentation” open this URL in a new tab.
 *
 * Override with `NEXT_PUBLIC_DOCUMENTATION_URL` or `NEXT_PUBLIC_STORYBOOK_URL` when needed.
 * In development, defaults to `http://localhost:6006` when neither env var is set.
 */
const DEFAULT_PRODUCTION_DOCUMENTATION_URL =
  "https://6a09a2c2e687bd342f4777e5-zhyaitpeyo.chromatic.com/";

function resolveDocumentationUrl(): string {
  const fromEnv =
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_DOCUMENTATION_URL?.trim() ||
        process.env.NEXT_PUBLIC_STORYBOOK_URL?.trim())) ||
    "";
  if (fromEnv) return fromEnv;
  if (
    typeof process !== "undefined" &&
    process.env.NODE_ENV === "development"
  ) {
    return "http://localhost:6006";
  }
  return DEFAULT_PRODUCTION_DOCUMENTATION_URL;
}

export const DOCUMENTATION_URL = resolveDocumentationUrl();

/** Completed-cycle reflection report. */
export function cycleSummaryRoute(cycleId: string): string {
  return `/app/cycle/${cycleId}/summary`;
}
