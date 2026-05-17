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

const BOARD_COLUMN_SM_HERO_EMBED_CLASS =
  "w-full min-w-0 max-w-full self-center";


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
  /**
   * Shorter than the default 430×932 marketing phone (e.g. landing “Solve” column).
   * Tightens header/meta padding and hides the skip row so the board fits without clipping.
   */
  shortEmbedFrame?: boolean;
  /**
   * Embedded hero (`TrainingPreview`): denser chrome and vertical rhythm — board-forward without
   * hiding Skip / End session (unlike {@link shortEmbedFrame} alone).
   */
  compactHeroLayout?: boolean;
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
  shortEmbedFrame = false,
  compactHeroLayout = false,
}: PreviewTrainingViewProps) {
  const safePuzzle = Number.isFinite(puzzleRaw) && puzzleRaw > 0 ? puzzleRaw : 12;
  const safeTotal = Number.isFinite(totalRaw) && totalRaw > 0 ? totalRaw : 120;
  const safeCycle = Number.isFinite(cycleRaw) && cycleRaw > 0 ? cycleRaw : 3;

  const displayFen = resolvePreviewTrainingFen(safePuzzle, fenRaw);

  const mainPadMobile = "px-3 pb-5 pt-1 sm:px-4";
  const mainPadMobileShortEmbed = "px-2 pb-1.5 pt-0 sm:px-2";
  const mainPadTabletDesktop = "px-4 pb-5 pt-2 md:px-7 md:pb-6";
  const mainPad =
    screen === "sm"
      ? embed && compactHeroLayout && !shortEmbedFrame
        ? "min-h-0 px-2 pb-2 pt-1 sm:px-2.5 sm:pb-2 sm:pt-1.5"
        : embed && shortEmbedFrame
          ? mainPadMobileShortEmbed
          : cn(mainPadMobile, embed && !shortEmbedFrame && "pt-1.5 sm:pt-2")
      : mainPadTabletDesktop;

  const metaText =
    "text-[11px] leading-snug text-muted-foreground sm:text-xs";

  const sideToMove = parseSideToMoveFromFen(displayFen);
  const boardOrientation = getsideToMove(sideToMove);

  /** Phone-frame embed (`TrainingPreview` sm): bounded height — square board must shrink to fit. */
  const embedSmBoardFit = embed && screen === "sm";
  const shortSmEmbed = embedSmBoardFit && shortEmbedFrame;
  const heroCompactEmbed = embedSmBoardFit && compactHeroLayout && !shortSmEmbed;

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
        : heroCompactEmbed
          ? BOARD_COLUMN_SM_HERO_EMBED_CLASS
          : BOARD_COLUMN_CLASS;

  const rootH = embed
    ? "h-full min-h-0 w-full max-w-full"
    : "min-h-dvh w-full max-w-full";

  const themeScope = previewColorScheme === "dark" ? "dark" : "";

  const embeddedSquareBoardProps = {
    fen: displayFen,
    positionSyncKey: `landing-preview-${displayFen}`,
    boardOrientation,
    boardStyleId,
    previewColorScheme,
    disabled: true as const,
    minimal: true as const,
    showCoordinates: false as const,
    marketingEmbed: embed,
    boardContainerClassName:
      "mx-auto aspect-square max-h-full max-w-full min-h-0 w-full overflow-visible border-border/40 bg-[var(--muted)]/10 pb-px",
  } as const;

  const standaloneBoardProps = {
    fen: displayFen,
    positionSyncKey: `landing-preview-${displayFen}`,
    boardOrientation,
    boardStyleId,
    previewColorScheme,
    disabled: true as const,
    minimal: true as const,
    showCoordinates: false as const,
    marketingEmbed: embed,
    boardContainerClassName:
      "mx-auto w-full max-w-full border-border/40 bg-[var(--muted)]/10",
  } as const;

  const embeddedSquareBoardShort = (
    <TrainingBoardCard
      {...embeddedSquareBoardProps}
      className="min-h-0 min-w-0 w-full justify-start"
    />
  );

  const embeddedSquareBoardTightRing = (
    <TrainingBoardCard
      {...embeddedSquareBoardProps}
      className="min-h-0 w-full shrink min-w-0"
    />
  );

  /** Full-viewport `/preview/training` mobile (non-embedded) layout. */
  const nonEmbeddedSmBoardBlock = (
    <div className={boardOuterClass}>
      <div className="min-h-[1.75rem] w-full shrink-0">
        <SideToMoveIndicator sideToMove={sideToMove} />
      </div>
      <div className="relative min-h-0 w-full">
        <TrainingBoardCard {...standaloneBoardProps} className="w-full" />
      </div>
    </div>
  );

  const mdLgBoardBlock = (
    <div className={boardOuterClass}>
      <div className="min-h-[1.75rem] w-full shrink-0">
        <SideToMoveIndicator sideToMove={sideToMove} />
      </div>
      <div className="relative min-h-0 w-full">
        <TrainingBoardCard {...standaloneBoardProps} className="w-full" />
      </div>
    </div>
  );

  const shortEmbedBoardBlock = (
    <div className="flex min-h-0 w-full min-w-0 max-w-full shrink flex-1 basis-0 flex-col items-stretch gap-1">
      <div className="min-h-[1.75rem] w-full shrink-0">
        <SideToMoveIndicator sideToMove={sideToMove} />
      </div>
      <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col items-stretch justify-start overflow-visible pb-0.5 pt-0">
        <div className="relative min-h-0 w-full">{embeddedSquareBoardShort}</div>
      </div>
    </div>
  );

  const skipPrimary = (
    <div className={boardColumnClass}>
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled
          tabIndex={-1}
          aria-label="Skip this puzzle"
          className="h-auto px-2 py-0.5 text-xs text-muted-foreground sm:text-sm"
        >
          Skip
        </Button>
      </div>
    </div>
  );

  /** Embedded ≥430×932: vertically center `{ side to move · board · skip }` as a unit. */
  const embeddedPhoneChromeCentered = (
    <div
      className={cn(
        "flex min-h-0 min-w-0 w-full flex-1 flex-col items-center justify-center gap-1 px-0 pb-1.5 pt-0",
        heroCompactEmbed && "gap-0.5 pb-1 pt-0",
        boardColumnClass
      )}
    >
      <div className="w-full shrink-0">
        <SideToMoveIndicator
          sideToMove={sideToMove}
          className={cn(
            heroCompactEmbed && "text-lg font-medium leading-snug sm:text-xl"
          )}
        />
      </div>
      <div className="relative w-full shrink min-h-0 min-w-0 overflow-visible px-px">
        {embeddedSquareBoardTightRing}
      </div>
      {skipPrimary}
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

            <div className="flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col items-center justify-center gap-2 pb-3 pt-0 sm:gap-2">
              {mdLgBoardBlock}
              {skipPrimary}
            </div>
          </main>
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col bg-background text-foreground",
            shortSmEmbed ? "overflow-hidden" : "overflow-x-hidden",
            themeScope,
            rootH
          )}
        >
          <h1 className="sr-only">Preview training</h1>

          <header className="sticky top-0 z-40 w-full max-w-full shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div
              className={cn(
                "grid w-full max-w-full items-center",
                shortSmEmbed
                  ? "h-11 grid-cols-[1.75rem_1fr_1.75rem] gap-1 px-2"
                  : heroCompactEmbed
                    ? "h-10 grid-cols-[1.75rem_1fr_1.75rem] gap-1 px-1.5 sm:px-2"
                    : "h-14 grid-cols-[2.5rem_1fr_2.5rem] gap-2 px-3"
              )}
            >
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center justify-self-start",
                  shortSmEmbed ? "h-8 w-8" : heroCompactEmbed ? "h-8 w-8" : "h-10 w-10"
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-md text-muted-foreground opacity-80",
                    shortSmEmbed ? "h-8 w-8" : heroCompactEmbed ? "h-8 w-8" : "h-9 w-9"
                  )}
                  aria-hidden
                >
                  <Menu
                    className={cn(
                      "pointer-events-none",
                      shortSmEmbed ? "h-4 w-4" : heroCompactEmbed ? "h-4 w-4" : "h-5 w-5"
                    )}
                  />
                </span>
              </div>
              <Link
                href={ROUTES.home}
                aria-label="PatternForge — back to home"
                className="flex min-w-0 max-w-full items-center justify-center gap-1 justify-self-center text-foreground no-underline transition-opacity hover:opacity-85"
              >
                <Logo size={shortSmEmbed ? 20 : heroCompactEmbed ? 21 : 24} className="shrink-0" />
                <AppTitle
                  className={cn(
                    "min-w-0 truncate whitespace-nowrap tracking-[0.12em]",
                    shortSmEmbed ? "text-[10px]" : heroCompactEmbed ? "text-[10.5px] sm:text-[11px]" : "text-[11px]"
                  )}
                />
              </Link>
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center justify-self-end",
                  shortSmEmbed ? "h-8 w-8" : heroCompactEmbed ? "h-8 w-8" : "h-10 w-10"
                )}
              >
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main
            className={cn(
              "flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col items-center",
              shortSmEmbed && "overflow-hidden",
              mainPad
            )}
          >
            <header
              className={cn(
                "flex w-full max-w-full shrink-0 flex-col",
                shortSmEmbed ? "mb-1.5 gap-y-1 text-[10px] leading-snug text-muted-foreground" : "gap-y-1.5",
                heroCompactEmbed &&
                  "mb-1.5 gap-y-1 text-[11px] leading-snug text-muted-foreground sm:text-[12px]",
                !shortSmEmbed && !heroCompactEmbed && embedSmBoardFit && "mb-2",
                !shortSmEmbed && !heroCompactEmbed && !embedSmBoardFit && "mb-3 sm:mb-4",
                !shortSmEmbed && !heroCompactEmbed && metaText
              )}
            >
              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span
                  className={cn(
                    "min-w-0 max-w-full shrink truncate font-medium text-muted-foreground",
                    heroCompactEmbed && "sm:font-semibold"
                  )}
                  title={setName}
                >
                  {setName}
                </span>
                <span className="text-muted-foreground" aria-hidden>
                  ·
                </span>
                <span
                  className={cn(
                    "shrink-0 tabular-nums font-medium text-muted-foreground",
                    heroCompactEmbed && "sm:font-semibold"
                  )}
                >
                  Cycle {safeCycle}
                </span>
              </div>
              <div
                className={cn(
                  "flex min-w-0 items-center gap-x-2 gap-y-0.5",
                  shortSmEmbed ? "justify-start" : "justify-between"
                )}
              >
                <span
                  className={cn(
                    "shrink-0 tabular-nums text-muted-foreground",
                    heroCompactEmbed &&
                      "text-[12px] font-semibold text-foreground/95 dark:text-slate-100 sm:text-[13px]"
                  )}
                >
                  Exercise {safePuzzle} / {safeTotal}
                </span>
                {!shortSmEmbed ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled
                    tabIndex={-1}
                    aria-hidden
                    className={cn(
                      "h-auto shrink-0 px-2 py-1 text-xs text-muted-foreground sm:text-sm",
                      heroCompactEmbed && "py-0.5 text-[11px] sm:text-[12px]"
                    )}
                  >
                    End session
                  </Button>
                ) : null}
              </div>
            </header>

            <div
              className={cn(
                "flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col items-center justify-center",
                embedSmBoardFit && shortSmEmbed && "justify-start",
                embedSmBoardFit && !shortSmEmbed && "min-h-0"
              )}
            >
              {embedSmBoardFit
                ? shortSmEmbed
                  ? shortEmbedBoardBlock
                  : embeddedPhoneChromeCentered
                : nonEmbeddedSmBoardBlock}
              {embedSmBoardFit && !shortSmEmbed ? null : !shortSmEmbed ? skipPrimary : null}
            </div>
          </main>
    </div>
  );
}
