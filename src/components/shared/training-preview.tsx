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
function previewFrameStyle(screen: PreviewScreenSize, smAspectHeight = PHONE_H): CSSProperties {
  switch (screen) {
    case "sm":
      return {
        aspectRatio: `${PHONE_W} / ${smAspectHeight}`,
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
  shellTone?: MarketingShellTone;
  /** When `screen` is `sm`, override default phone height (defaults to 932 for 430×932). */
  smAspectHeight?: number;
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

export function useDocumentAppearance(): TrainingPreviewAppearance {
  const isDark = React.useSyncExternalStore(
    subscribeDocumentDarkClass,
    snapshotDocumentIsDark,
    () => false
  );
  return isDark ? "dark" : "light";
}

export type MarketingShellTone = "default" | "emphasis" | "muted";

export interface MarketingDeviceFrameProps {
  screen: PreviewScreenSize;
  appearance: TrainingPreviewAppearance;
  title?: string;
  className?: string;
  children: React.ReactNode;
  /** Landing / hierarchy framing: sharper centre hero vs quieter side previews. */
  shellTone?: MarketingShellTone;
  /** Phone portrait height for `screen="sm"` (default 932). */
  smAspectHeight?: number;
}

/** Shared chrome for {@link TrainingPreview} and marketing flow previews (`screen="sm"` phones). */
export function MarketingDeviceFrame({
  screen,
  appearance,
  title,
  className,
  shellTone = "default",
  smAspectHeight = PHONE_H,
  children,
}: MarketingDeviceFrameProps) {
  const tone = shellTone;

  const frameClassName =
    appearance === "dark"
      ? cn(
          "border-white/10 bg-white/[0.03]",
          tone === "emphasis" &&
            "border-white/[0.15] bg-white/[0.045] shadow-[0_26px_64px_-18px_rgba(0,0,0,0.78)] shadow-violet-500/[0.12] ring-1 ring-inset ring-white/[0.07]",
          tone === "muted" &&
            "border-white/[0.05] bg-white/[0.018] shadow-md shadow-black/55 ring-1 ring-inset ring-white/[0.03]"
        )
      : cn(
          "border-black/12 bg-black/[0.02]",
          tone === "emphasis" &&
            "border-black/15 bg-black/[0.03] shadow-[0_22px_48px_-14px_rgba(0,0,0,0.22)] ring-1 ring-inset ring-black/[0.06]",
          tone === "muted" &&
            "border-black/[0.07] bg-black/[0.012] shadow-sm shadow-black/12 ring-1 ring-inset ring-black/[0.04]"
        );

  const outerRounded =
    screen === "lg"
      ? "rounded-xl"
      : screen === "md"
        ? "rounded-[1.35rem]"
        : "rounded-[2rem]";

  /** Phone: match outer bezel radius so content reads as one continuous chassis curve. */
  const innerRounded =
    screen === "lg"
      ? "rounded-lg"
      : screen === "md"
        ? "rounded-xl"
        : outerRounded;

  const innerWellClass =
    appearance === "dark"
      ? cn(
          "bg-black/30",
          tone === "emphasis" && "bg-black/[0.20]",
          tone === "muted" && "bg-black/[0.34]"
        )
      : cn(
          "bg-neutral-200/90",
          tone === "emphasis" && "bg-neutral-200/95",
          tone === "muted" && "bg-neutral-300/85"
        );

  const hoverScale =
    tone === "emphasis"
      ? "hover:scale-[1.02]"
      : tone === "muted"
        ? "hover:scale-[1.006]"
        : "hover:scale-[1.015]";

  return (
    <div
      className={cn(
        "relative flex min-h-0 w-full min-w-0 max-w-full shrink-0 justify-center pointer-events-none select-none",
        className
      )}
      {...(title ? ({ role: "img", "aria-label": title } as const) : {})}
    >
      <div
        style={previewFrameStyle(screen, smAspectHeight)}
        className={cn(
          "flex min-h-0 flex-col box-border max-w-full border p-2 shadow-xl transition-transform duration-500 ease-out",
          hoverScale,
          outerRounded,
          frameClassName
        )}
      >
        <div
          className={cn(
            "relative min-h-0 flex-1 overflow-hidden",
            innerRounded,
            innerWellClass
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export type DocumentThemedMarketingSmPreviewProps = {
  title: string;
  className?: string;
  shellTone?: MarketingShellTone;
  render: (appearance: TrainingPreviewAppearance) => React.ReactNode;
};

/** Phone shell (`sm`) whose theme tracks `document.documentElement` — inject arbitrary marketing UI. */
export function DocumentThemedMarketingSmPreview({
  title,
  className,
  shellTone = "default",
  render,
}: DocumentThemedMarketingSmPreviewProps) {
  const appearance = useDocumentAppearance();
  return (
    <MarketingDeviceFrame
      screen="sm"
      appearance={appearance}
      title={title}
      className={className}
      shellTone={shellTone}
    >
      {render(appearance)}
    </MarketingDeviceFrame>
  );
}

/**
 * Single live embed: follows `html.dark` via `useSyncExternalStore`. Prefer this on the marketing
 * page instead of stacking light+dark previews — swapping visibility can change subtree height and
 * shift layout when the theme toggles.
 */
export function DocumentThemedTrainingPreview(
  props: Omit<TrainingPreviewProps, "appearance">
) {
  const appearance = useDocumentAppearance();
  return <TrainingPreview {...props} appearance={appearance} />;
}

export function TrainingPreview({
  preview,
  title,
  appearance = "dark",
  screen: screenProp,
  className,
  shellTone = "default",
  smAspectHeight,
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

  return (
    <MarketingDeviceFrame
      screen={screen}
      appearance={appearance}
      title={title}
      className={className}
      shellTone={shellTone}
      smAspectHeight={screen === "sm" ? (smAspectHeight ?? PHONE_H) : undefined}
    >
      <PreviewTrainingView
        embed
        shortEmbedFrame={screen === "sm" && (smAspectHeight ?? PHONE_H) < PHONE_H}
        previewColorScheme={previewColorScheme}
        screen={screen}
        puzzle={puzzle}
        total={total}
        cycle={cycle}
        setName={setName}
        boardStyleId={boardStyleId}
        fen={fen}
      />
    </MarketingDeviceFrame>
  );
}
