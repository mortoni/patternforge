"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettingsContext } from "@/features/settings/context/settings-context";

type EffectiveTheme = "light" | "dark";

type ViewTransitionLike = {
  ready: Promise<void>;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionLike;
};

function getEffectiveTheme(theme: "light" | "dark" | "system" | undefined): EffectiveTheme {
  if (theme === "dark" || theme === "light") return theme;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

/** Preview routes scope theme on the component tree; skip touching global `html`. */
function syncDocumentTheme(mode: EffectiveTheme) {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/preview")) {
    return;
  }
  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  try {
    localStorage.setItem("patternforge-theme", mode);
  } catch {
    /* ignore */
  }
}

const THEME_WIPE_MS = 300;
/** Short wipe: snappy end so both directions feel equally quick */
const THEME_WIPE_EASING = "cubic-bezier(0.33, 1, 0.32, 1)";

export function ThemeToggle({ className }: { className?: string }) {
  const { settings, setTheme } = useSettingsContext();
  const [effectiveTheme, setEffectiveTheme] = React.useState<EffectiveTheme>(() =>
    getEffectiveTheme(settings?.theme)
  );

  React.useEffect(() => {
    setEffectiveTheme(getEffectiveTheme(settings?.theme));
  }, [settings?.theme]);

  React.useEffect(() => {
    if (settings?.theme !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setEffectiveTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [settings?.theme]);

  const onClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const next: EffectiveTheme = effectiveTheme === "dark" ? "light" : "dark";

      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduceMotion) {
        syncDocumentTheme(next);
        void setTheme(next);
        return;
      }

      const doc = document as DocumentWithViewTransition;
      if (!doc.startViewTransition) {
        syncDocumentTheme(next);
        void setTheme(next);
        return;
      }

      const x = e.clientX || window.innerWidth / 2;
      const y = e.clientY || window.innerHeight / 2;

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = doc.startViewTransition(() => {
        /*
         * View Transition snapshots must run after the DOM reflects the next theme.
         * `setTheme` persists async (Dexie): previously `html.dark` flipped only in an effect
         * after `await`, so old/new captures matched — the circular reveal looked absent/laggy,
         * worse when Chessground slowed the async path.
         */
        syncDocumentTheme(next);
        void setTheme(next);
      });

      transition.ready.then(() => {
        /*
         * Circular ripple both ways: shrink clip on ::view-transition-old(root) so the previous
         * theme collapses toward the click and the next theme shows through (matches light→dark
         * feel on dark→light, and avoids expanding the heavy dark snapshot when going dark).
         */
        requestAnimationFrame(() => {
          document.documentElement.animate(
            [
              { clipPath: `circle(${endRadius}px at ${x}px ${y}px)` },
              { clipPath: `circle(0px at ${x}px ${y}px)` },
            ],
            {
              duration: THEME_WIPE_MS,
              easing: THEME_WIPE_EASING,
              pseudoElement: "::view-transition-old(root)",
              fill: "forwards",
            }
          );
        });
      });
    },
    [effectiveTheme, setTheme]
  );

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label="Toggle theme"
      className={cn("relative overflow-hidden", className)}
    >
      <div className="relative flex h-6 w-6 items-center justify-center">
        <svg
          data-no-icon
          aria-hidden="true"
          className="size-4"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <path d="M12 3l0 18" />
          <path d="M12 9l4.65 -4.65" />
          <path d="M12 14.3l7.37 -7.37" />
          <path d="M12 19.6l8.85 -8.85" />
        </svg>
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
