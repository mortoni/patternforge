"use client";

/**
 * Presentational training marketing UI — used inline on the landing page and on
 * `/preview/training`. Theme is scoped with a `dark` class wrapper (does not touch `document`).
 */

import Link from "next/link";
import { Menu } from "lucide-react";
import AppTitle from "@/components/logo/AppTitle";
import Logo from "@/components/logo/Logo";
import { SideToMoveIndicator } from "@/components/shared/SideToMoveIndicator";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { TrainingBoardCard } from "@/features/training/components/training-board-card";
import { getsideToMove, parseSideToMoveFromFen } from "@/lib/chess/side-to-move";
import type { AppColorScheme, BoardStyleId } from "@/lib/chess/board-styles";
import type { PreviewScreenSize } from "@/lib/preview/preview-training-url";
import { ROUTES } from "@/lib/constants";
import { resolvePreviewTrainingFen } from "@/lib/preview/preview-exercise-fens";
import { cn } from "@/lib/utils";

const BOARD_OUTER_CLASS =
  "flex w-full max-w-[min(100%,calc(100dvh-14rem),40rem)] flex-col items-center gap-1";

const BOARD_COLUMN_CLASS =
  "w-full min-w-0 max-w-[min(100%,calc(100dvh-14rem),40rem)] self-center";

const BOARD_OUTER_MD_CLASS =
  "flex w-full max-w-[min(100%,42rem)] flex-col items-center gap-1";

const BOARD_COLUMN_MD_CLASS =
  "w-full min-w-0 max-w-[min(100%,42rem)] self-center";

const BOARD_OUTER_LG_CLASS =
  "flex w-full max-w-[min(100%,52rem)] flex-col items-center gap-1";

const BOARD_COLUMN_LG_CLASS =
  "w-full min-w-0 max-w-[min(100%,52rem)] self-center";

export interface PreviewTrainingViewProps {
  previewColorScheme: AppColorScheme;
  screen: PreviewScreenSize;
  puzzle: number;
  total: number;
  cycle: number;
  setName: string;
  boardStyleId: BoardStyleId;
  /** Raw FEN from query or prop; null uses preset from `puzzle`. */
  fen: string | null;
  /**
   * `true` when embedded in {@link TrainingPreview} — fills the device shell (`h-full`).
   * `false` on `/preview/training` — full viewport height.
   */
  embed?: boolean;
}

export function PreviewTrainingView({
  previewColorScheme,
  screen,
  puzzle: puzzleRaw,
  total: totalRaw,
  cycle: cycleRaw,
  setName,
  boardStyleId,
  fen: fenRaw,
  embed = false,
}: PreviewTrainingViewProps) {
  const safePuzzle = Number.isFinite(puzzleRaw) && puzzleRaw > 0 ? puzzleRaw : 12;
  const safeTotal = Number.isFinite(totalRaw) && totalRaw > 0 ? totalRaw : 120;
  const safeCycle = Number.isFinite(cycleRaw) && cycleRaw > 0 ? cycleRaw : 3;

  const displayFen = resolvePreviewTrainingFen(safePuzzle, fenRaw);

  const mainPadMobile = "px-3 pb-5 pt-1 sm:px-4";
  const mainPadTabletDesktop = "px-4 pb-5 pt-2 md:px-7 md:pb-6";
  const mainPad = screen === "sm" ? mainPadMobile : mainPadTabletDesktop;
  const metaText =
    "text-[11px] leading-snug text-muted-foreground sm:text-xs";

  const sideToMove = parseSideToMoveFromFen(displayFen);
  const boardOrientation = getsideToMove(sideToMove);

  const boardOuterClass =
    screen === "lg"
      ? BOARD_OUTER_LG_CLASS
      : screen === "md"
        ? BOARD_OUTER_MD_CLASS
        : BOARD_OUTER_CLASS;

  const boardColumnClass =
    screen === "lg"
      ? BOARD_COLUMN_LG_CLASS
      : screen === "md"
        ? BOARD_COLUMN_MD_CLASS
        : BOARD_COLUMN_CLASS;

  const rootH = embed
    ? "h-full min-h-0 w-full max-w-full"
    : "min-h-dvh w-full max-w-full";

  const themeScope = previewColorScheme === "dark" ? "dark" : "";

  /** Phone-frame embed (`TrainingPreview` sm): bounded height — square board must shrink to fit. */
  const embedSmBoardFit = embed && screen === "sm";

  const boardBlock = (
    <div
      className={cn(
        boardOuterClass,
        embedSmBoardFit && "min-h-0 shrink basis-0 flex-1"
      )}
    >
      <div className="min-h-7 w-full shrink-0">
        <SideToMoveIndicator sideToMove={sideToMove} />
      </div>
      <div
        className={cn(
          "flex min-h-0 min-w-0 w-full",
          embedSmBoardFit ? "flex-1 items-center justify-center" : ""
        )}
      >
        <TrainingBoardCard
          fen={displayFen}
          positionSyncKey={`landing-preview-${displayFen}`}
          boardOrientation={boardOrientation}
          boardStyleId={boardStyleId}
          previewColorScheme={previewColorScheme}
          disabled
          minimal
          className={cn("w-full", embedSmBoardFit && "min-h-0 min-w-0")}
          boardContainerClassName={
            embedSmBoardFit
              ? "mx-auto aspect-square max-h-full max-w-full min-h-0 w-full border-border/40 bg-[var(--muted)]/10"
              : "mx-auto w-full max-w-full border-border/40 bg-[var(--muted)]/10"
          }
        />
      </div>
    </div>
  );

  const skipBlock = (
    <div className={boardColumnClass}>
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled
          tabIndex={-1}
          aria-label="Skip this puzzle"
          className="h-auto px-2 py-1 text-xs text-muted-foreground sm:text-sm"
        >
          Skip
        </Button>
      </div>
    </div>
  );

  return screen === "md" || screen === "lg" ? (
        <div
          className={cn(
            "flex flex-col overflow-x-hidden bg-background text-foreground",
            themeScope,
            rootH
          )}
        >
          <h1 className="sr-only">Preview training</h1>
          <main
            className={cn(
              "flex h-full min-h-0 w-full max-w-full min-w-0 flex-1 flex-col items-center",
              mainPad
            )}
          >
            <header className="mb-3 flex w-full shrink-0 flex-col gap-y-2 text-[11px] leading-snug text-muted-foreground sm:mb-4 sm:text-xs md:flex-row md:flex-wrap md:items-center md:justify-end md:gap-x-2 md:gap-y-1 md:text-right md:text-sm">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 md:contents">
                <span
                  className="min-w-0 max-w-full shrink truncate font-medium text-muted-foreground"
                  title={setName}
                >
                  {setName}
                </span>
                <span className="text-muted-foreground" aria-hidden>
                  ·
                </span>
                <span className="shrink-0 tabular-nums font-medium text-muted-foreground">
                  Cycle {safeCycle}
                </span>
              </div>
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 md:contents">
                <span className="hidden text-muted-foreground md:inline" aria-hidden>
                  ·
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  Exercise {safePuzzle} / {safeTotal}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled
                  tabIndex={-1}
                  aria-hidden
                  className="h-auto shrink-0 px-2 py-1 text-xs text-muted-foreground sm:text-sm"
                >
                  End session
                </Button>
                <ThemeToggle className="inline-flex" />
              </div>
            </header>

            <div className="flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col items-center justify-center gap-3 pb-4 pt-0 sm:gap-4">
              {boardBlock}
              {skipBlock}
            </div>
          </main>
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col overflow-x-hidden bg-background text-foreground",
            themeScope,
            rootH
          )}
        >
          <h1 className="sr-only">Preview training</h1>

          <header className="sticky top-0 z-40 w-full max-w-full shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="grid h-14 w-full max-w-full grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 px-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center justify-self-start">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground opacity-80"
                  aria-hidden
                >
                  <Menu className="h-5 w-5 pointer-events-none" />
                </span>
              </div>
              <Link
                href={ROUTES.home}
                aria-label="PatternForge — back to home"
                className="flex min-w-0 max-w-full items-center justify-center gap-1.5 justify-self-center text-foreground no-underline transition-opacity hover:opacity-85"
              >
                <Logo size={24} className="shrink-0" />
                <AppTitle className="min-w-0 truncate whitespace-nowrap text-[11px] tracking-[0.12em]" />
              </Link>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center justify-self-end">
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main
            className={cn(
              "flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col items-center",
              mainPad
            )}
          >
            <header
              className={cn(
                "flex w-full max-w-full shrink-0 flex-col gap-y-1.5",
                embedSmBoardFit ? "mb-2" : "mb-3 sm:mb-4",
                metaText
              )}
            >
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <span
                  className="min-w-0 max-w-full shrink truncate font-medium text-muted-foreground"
                  title={setName}
                >
                  {setName}
                </span>
                <span className="text-muted-foreground" aria-hidden>
                  ·
                </span>
                <span className="shrink-0 tabular-nums font-medium text-muted-foreground">
                  Cycle {safeCycle}
                </span>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-x-3 gap-y-1">
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  Exercise {safePuzzle} / {safeTotal}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled
                  tabIndex={-1}
                  aria-hidden
                  className="h-auto shrink-0 px-2 py-1 text-xs text-muted-foreground sm:text-sm"
                >
                  End session
                </Button>
              </div>
            </header>

            <div
              className={cn(
                "flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col items-center",
                embedSmBoardFit
                  ? "justify-between gap-2 pb-2 pt-0"
                  : "justify-center gap-6 pb-6 pt-1 sm:gap-8 sm:pt-0"
              )}
            >
              {boardBlock}
              {skipBlock}
            </div>
          </main>
    </div>
  );
}
