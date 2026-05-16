"use client";

/**
 * Training marketing preview for `/preview/training` — reads query params and renders
 * {@link PreviewTrainingView}. For inline embeds use {@link TrainingPreview} or import
 * {@link PreviewTrainingView} directly.
 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { AppColorScheme, BoardStyleId } from "@/lib/chess/board-styles";
import type { PreviewScreenSize } from "@/lib/preview/preview-training-url";
import { PreviewTrainingView } from "@/features/training/components/preview-training-view";

function parsePreviewScreen(value: string | null): PreviewScreenSize {
  if (value === "md") return "md";
  if (value === "lg") return "lg";
  return "sm";
}

function parseBoardStyleParam(raw: string | null): BoardStyleId {
  if (raw === "classic" || raw === "blueprint") return raw;
  return "blueprint";
}

function PreviewTrainingInner({
  previewColorScheme,
}: {
  previewColorScheme: AppColorScheme;
}) {
  const searchParams = useSearchParams();

  const puzzleRaw = searchParams?.get("puzzle");
  const totalRaw = searchParams?.get("total");
  const cycleRaw = searchParams?.get("cycle");
  const setRaw = searchParams?.get("set");
  const screen = parsePreviewScreen(searchParams?.get("screen") ?? null);
  const boardStyleId = parseBoardStyleParam(searchParams?.get("board") ?? null);
  const fenRaw = searchParams?.get("fen");

  const puzzle =
    puzzleRaw != null && puzzleRaw.length > 0 ? Number.parseInt(puzzleRaw, 10) : 12;
  const total =
    totalRaw != null && totalRaw.length > 0 ? Number.parseInt(totalRaw, 10) : 120;
  const cycle =
    cycleRaw != null && cycleRaw.length > 0 ? Number.parseInt(cycleRaw, 10) : 3;

  const setName =
    setRaw != null && setRaw.length > 0
      ? setRaw
      : "Demo · Sample Woodpecker set";

  return (
    <PreviewTrainingView
      previewColorScheme={previewColorScheme}
      screen={screen}
      puzzle={puzzle}
      total={total}
      cycle={cycle}
      setName={setName}
      boardStyleId={boardStyleId}
      fen={fenRaw ?? null}
      embed={false}
    />
  );
}

export function PreviewTraining({
  previewColorScheme,
}: {
  previewColorScheme: AppColorScheme;
}) {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-dvh w-full max-w-full overflow-x-hidden bg-background"
          aria-busy="true"
          aria-label="Loading preview"
        >
          <div className="sr-only">Loading training preview.</div>
        </div>
      }
    >
      <PreviewTrainingInner previewColorScheme={previewColorScheme} />
    </Suspense>
  );
}
