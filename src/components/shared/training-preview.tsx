"use client";

import * as React from "react";
import type { CSSProperties } from "react";
import { PreviewTrainingView } from "@/features/training/components/preview-training-view";
import type { PreviewScreenSize, PreviewTrainingParams } from "@/lib/preview/preview-training-url";
import type { BoardStyleId } from "@/lib/chess/board-styles";
import { cn } from "@/lib/utils";

export type { PreviewScreenSize } from "@/lib/preview/preview-training-url";

const PHONE_W = 430;
const PHONE_H = 932;

const DEFAULT_SET_NAME = "Demo · Sample Woodpecker set";

/**
 * Outer shell dimensions for marketing desktop preview (`screen="lg"` embed).
 * Exported so wrappers reserve the same box while switching themes.
 */
export const LG_PREVIEW_FRAME_STYLE: CSSProperties = {
  width: "min(100%, 64rem)",
  maxWidth: "100%",
  height: "min(72dvh, 52rem)",
};

/**
 * Device shells for {@link PreviewScreenSize}:
 * - `sm`: mobile phone (portrait, width-first)
 * - `md`: tablet (landscape-first, fixed height so content is not clipped)
 * - `lg`: desktop monitor frame (marketing — shorter than full viewport so sections stay compact)
 */
function previewFrameStyle(screen: PreviewScreenSize): CSSProperties {
  switch (screen) {
    case "sm":
      return {
        aspectRatio: `${PHONE_W} / ${PHONE_H}`,
        width: "min(100%, 20rem)",
        height: "auto",
        maxWidth: "100%",
      };
    case "md":
      return {
        width: "min(100%, 44rem)",
        maxWidth: "100%",
        height: "min(82dvh, 52rem)",
      };
    case "lg":
      return LG_PREVIEW_FRAME_STYLE;
  }
}

export type TrainingPreviewAppearance = "light" | "dark";

export interface TrainingPreviewProps {
  /**
   * Builds the inline preview with `pfPreview`-equivalent fields — see
   * {@link buildPreviewTrainingUrl} in `@/lib/preview/preview-training-url` for query keys.
   */
  preview?: Omit<PreviewTrainingParams, "appearance">;
  /** `iframe` title for assistive tech / debugging (no iframe is rendered). */
  title?: string;
  appearance?: TrainingPreviewAppearance;
  /**
   * Preview mode: `sm` mobile, `md` tablet, `lg` desktop. Defaults to `sm`.
   * When `preview.screen` is set, that wins unless you pass this prop to override the shell.
   */
  screen?: PreviewScreenSize;
  className?: string;
}

function resolveScreen(
  preview: Omit<PreviewTrainingParams, "appearance"> | undefined,
  screenProp: PreviewScreenSize | undefined
): PreviewScreenSize {
  return preview?.screen ?? screenProp ?? "sm";
}

function subscribeDocumentDarkClass(cb: () => void) {
  const el = document.documentElement;
  const mo = new MutationObserver(cb);
  mo.observe(el, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}

function snapshotDocumentIsDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

/**
 * Single live embed: follows `html.dark` via `useSyncExternalStore`. Prefer this on the marketing
 * page instead of stacking light+dark previews — swapping visibility can change subtree height and
 * shift layout when the theme toggles.
 */
export function DocumentThemedTrainingPreview(
  props: Omit<TrainingPreviewProps, "appearance">
) {
  const isDark = React.useSyncExternalStore(
    subscribeDocumentDarkClass,
    snapshotDocumentIsDark,
    () => false
  );
  return <TrainingPreview {...props} appearance={isDark ? "dark" : "light"} />;
}

export function TrainingPreview({
  preview,
  title,
  appearance = "dark",
  screen: screenProp,
  className,
}: TrainingPreviewProps) {
  const screen = resolveScreen(preview, screenProp);
  const p = preview ?? {};

  const previewColorScheme = appearance;
  const puzzle = p.puzzle ?? 12;
  const total = p.total ?? 120;
  const cycle = p.cycle ?? 3;
  const setName =
    p.setName != null && p.setName.length > 0 ? p.setName : DEFAULT_SET_NAME;
  const boardStyleId: BoardStyleId = p.boardStyle ?? "blueprint";
  const fen = p.fen ?? null;

  const frameClassName =
    appearance === "dark"
      ? "border-white/10 bg-white/[0.03]"
      : "border-black/12 bg-black/[0.02]";

  const outerRounded =
    screen === "lg"
      ? "rounded-xl"
      : screen === "md"
        ? "rounded-[1.35rem]"
        : "rounded-[2rem]";

  const innerRounded =
    screen === "lg"
      ? "rounded-lg"
      : screen === "md"
        ? "rounded-xl"
        : "rounded-[1.5rem]";

  return (
    <div
      className={cn(
        "relative flex min-h-0 w-full min-w-0 max-w-full shrink-0 justify-center pointer-events-none select-none",
        className
      )}
      {...(title ? ({ role: "img", "aria-label": title } as const) : {})}
    >
      <div
        style={previewFrameStyle(screen)}
        className={cn(
          "flex min-h-0 flex-col box-border max-w-full border p-2 shadow-xl transition-transform duration-300 ease-out hover:scale-[1.015]",
          outerRounded,
          frameClassName
        )}
      >
        <div
          className={cn(
            "relative min-h-0 flex-1 overflow-hidden",
            innerRounded,
            appearance === "dark" ? "bg-black/30" : "bg-neutral-200/90"
          )}
        >
          <PreviewTrainingView
            embed
            previewColorScheme={previewColorScheme}
            screen={screen}
            puzzle={puzzle}
            total={total}
            cycle={cycle}
            setName={setName}
            boardStyleId={boardStyleId}
            fen={fen}
          />
        </div>
      </div>
    </div>
  );
}
