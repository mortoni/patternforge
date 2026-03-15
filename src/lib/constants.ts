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
  session: "/app/session",
  sets: "/app/sets",
  mistakes: "/app/mistakes",
  analytics: "/app/analytics",
  settings: "/app/settings",
} as const;
