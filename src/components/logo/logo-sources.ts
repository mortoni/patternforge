/**
 * Single source of truth for logo URLs in the UI.
 * Tab / PWA icons: `pnpm run generate:icons` rasterizes `pattern-forge.svg` (light mark) on #0b0b0f.
 */
export const LOGO_SRC_ON_LIGHT_BG = "/pattern-forge-black.svg";
/** Metallic/light mark for dark UI (existing asset). */
export const LOGO_SRC_ON_DARK_BG = "/pattern-forge.svg";
/** App Router metadata uses /icon.png; kept for links that need an explicit favicon URL. */
export const FAVICON_SRC = "/icon.png";
