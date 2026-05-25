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
  support: "/support",
  supportSuccess: "/support/success",
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
 * Chromatic project app id (Chromatic → Manage → Configure → permalinks).
 * Stable across builds — use branch permalinks, not per-build preview URLs.
 */
export const CHROMATIC_APP_ID = "6a09a2c2e687bd342f4777e5";

/** Default Storybook docs entry opened from in-app “Documentation” links. */
export const CHROMATIC_DOCS_INTRO_PATH = "/docs/introduction--docs";

/** Stable Chromatic Storybook URL for a branch (always serves the latest publish on that branch). */
export function chromaticStorybookUrl(
  appId: string,
  options?: { branch?: string; storyPath?: string }
): string {
  const branch = options?.branch?.trim() || "main";
  const storyPath = options?.storyPath?.trim() ?? CHROMATIC_DOCS_INTRO_PATH;
  const base = `https://${branch}--${appId}.chromatic.com/`;
  if (!storyPath) return base;
  return `${base}?path=${encodeURIComponent(storyPath)}`;
}

/**
 * Hosted Storybook on Chromatic (product docs + workbench).
 * Sidebar “Documentation” and marketing “Documentation” open this URL in a new tab.
 *
 * Override with `NEXT_PUBLIC_DOCUMENTATION_URL` or `NEXT_PUBLIC_STORYBOOK_URL` when needed.
 * Override app id with `NEXT_PUBLIC_CHROMATIC_APP_ID` if the Chromatic project changes.
 * In development, defaults to `http://localhost:6006` when neither env var is set.
 */
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
  const appId =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_CHROMATIC_APP_ID?.trim()) ||
    CHROMATIC_APP_ID;
  return chromaticStorybookUrl(appId);
}

export const DOCUMENTATION_URL = resolveDocumentationUrl();

/** Completed-cycle reflection report. */
export function cycleSummaryRoute(cycleId: string): string {
  return `/app/cycle/${cycleId}/summary`;
}
