"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EditorialDiagramBoard } from "@/components/marketing/components/editorial-diagram-board";
import type { BoardHighlight } from "@/lib/chess/board-highlight";

/**
 * Authentic smothered mate: black to move is mated; white knight on f7 mates black king on h8,
 * hemmed by rook on g8 and pawns on g7/h7.
 */
const SMOTHERED_MATE_FEN = "6rk/5Npp/8/8/8/8/PPP2PPP/6K1 b - - 0 1";

/** Smothered mate main diagram (left column): focal emphasis on g5 and g8 only. */
const SMOTHERED_MATE_DIAGRAM_HIGHLIGHTS: BoardHighlight[] = [
  { square: "g5", kind: "focus" },
  { square: "g8", kind: "focus" },
];

const RESURFACING_CYCLE_2_FEN =
  "3r2Qk/1p1b2bp/1n2B1p1/p5N1/Pq6/8/1P4PP/R6K b - - 0 1";

const RESURFACING_CYCLE_3_FEN =
  "6rk/1p1b1Nbp/1n2B1p1/p7/Pq6/8/1P4PP/R6K b - - 0 1";

const RESURFACING = {
  eyebrow: "Pattern resurfacing",
  motif: "Smothered mate",
  cycles: [
    {
      n: 1,
      state: "Long calculation",
      note: "The motif still requires deliberate calculation.",
      time: "42s",
      highlights: [
        { square: "a2", kind: "piece" },
        { square: "b3", kind: "empty" },
        { square: "c4", kind: "empty" },
        { square: "d5", kind: "empty" },
        { square: "e6", kind: "empty" },
        { square: "f7", kind: "piece" },
        { square: "g8", kind: "piece" },
        { square: "g5", kind: "focus" },
      ],
    },
    {
      n: 2,
      state: "Recognized structure",
      note: "The structure begins surfacing before calculation completes.",
      time: "18s",
      fen: RESURFACING_CYCLE_2_FEN,
      highlights: [
        { square: "d8", kind: "piece" },
        { square: "f7", kind: "focus" },
        { square: "g8", kind: "piece" },
        { square: "g5", kind: "focus" },
      ],
    },
    {
      n: 3,
      state: "Immediate recall",
      note: "Recognition appears almost immediately.",
      time: "7s",
      fen: RESURFACING_CYCLE_3_FEN,
      highlights: [
        { square: "d8", kind: "empty" },
        { square: "g8", kind: "piece" },
        { square: "g5", kind: "empty" },
        { square: "f7", kind: "focus" },
      ],
    },
  ],
  closing: "Repeated exposure strengthens retrieval.",
} as const;

/** Tighter corners on mini cycle boards vs. main editorial diagram. */
const CYCLE_EDITORIAL_SHELL_CLASS = "rounded-md";

/** User-provided cycle arrow (stroke + chevron + SVG soft glow). */
function CycleBoardArrow() {
  const uid = React.useId().replace(/:/g, "");
  const arrowGlowId = `pf-arrowGlow-${uid}`;
  const softGlowId = `pf-softGlow-${uid}`;

  return (
    <svg
      width={30}
      height={7}
      viewBox="0 0 72 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="block h-[7px] w-[1.875rem] shrink-0 text-[#C6923B] dark:text-[#F6D38B]"
    >
      <defs>
        <linearGradient
          id={arrowGlowId}
          x1="0"
          y1="8"
          x2="72"
          y2="8"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="currentColor" stopOpacity={0} />
          <stop offset="0.45" stopColor="currentColor" stopOpacity={0.45} />
          <stop offset="1" stopColor="currentColor" stopOpacity={0.95} />
        </linearGradient>

        <filter
          id={softGlowId}
          x="-20"
          y="-20"
          width="112"
          height="56"
          filterUnits="userSpaceOnUse"
        >
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0.96  0 1 0 0 0.69  0 0 1 0 0.30  0 0 0 0.75 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d="M4 8H64"
        stroke={`url(#${arrowGlowId})`}
        strokeWidth={1.5}
        strokeLinecap="round"
        filter={`url(#${softGlowId})`}
      />

      <path
        d="M58 3L65 8L58 13"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${softGlowId})`}
      />
    </svg>
  );
}

function progressionTone(i: number) {
  return cn(
    i === 0 && "opacity-[0.88]",
    i === 1 && "opacity-[0.95]",
    i === 2 && "opacity-100"
  );
}

function cycleMetaClass(i: number) {
  return cn(
    "text-[10px] font-medium uppercase tracking-[0.12em] sm:text-[0.62rem] sm:tracking-[0.14em]",
    i === 0 && "text-muted-foreground/52",
    i === 1 && "text-muted-foreground/60",
    i === 2 && "text-muted-foreground/68"
  );
}

function cycleTitleClass(i: number) {
  return cn(
    "mt-2 text-[0.8125rem] font-medium leading-snug tracking-tight sm:text-[0.875rem]",
    i === 0 && "text-foreground/76",
    i === 1 && "text-foreground/88",
    i === 2 && "text-foreground"
  );
}

function cycleNoteClass(i: number) {
  return cn(
    "mt-2 text-[12px] leading-relaxed sm:text-[13px]",
    i === 0 && "text-muted-foreground/66",
    i === 1 && "text-muted-foreground/74",
    i === 2 && "text-muted-foreground/82"
  );
}

const revealEase = [0.22, 1, 0.36, 1] as const;

const SMOTHERED_MATE_FIGCAPTION =
  "Diagram: final position after white delivers smothered mate; the black king on h8 cannot escape; the mating piece is the white knight on f7.";

export type PatternResurfacingPreviewProps = {
  className?: string;
  diagramFen?: string;
  /** Premium glow overlays on the **main** diagram (cycles use per-cycle `highlights`). */
  highlights?: readonly BoardHighlight[];
  boardOrientation?: "white" | "black";
  positionSyncKey?: string;
  /** Overrides figcaption + diagram portion of screen-reader summary. */
  diagramAccessibilityDescription?: string;
  /** Optional callout under the main diagram (left column). */
  diagramCaptionTitle?: string;
  diagramCaptionBody?: string;
  showBoardCoordinates?: boolean;
};

function cycleDiagramFen(
  cycle: (typeof RESURFACING.cycles)[number],
  mainFen: string
): string {
  if ("fen" in cycle && cycle.fen) return cycle.fen;
  return mainFen;
}

/** Chessground re-sync key fragment — varies when a cycle’s placement differs. */
function cycleBoardSyncKeyFragment(
  cycle: (typeof RESURFACING.cycles)[number],
  mainFen: string
): string {
  const fenPart = cycleDiagramFen(cycle, mainFen).replace(/\s/g, "_").slice(0, 40);
  const hl = cycle.highlights
    .map((h) => `${h.square}:${h.kind}`)
    .sort()
    .join("-");
  return `${fenPart}__${hl}`.slice(0, 96);
}

/** Method-section preview: pattern resurfacing narrative — full-width two-column layout (desktop). */
export function PatternResurfacingPreview({
  className,
  diagramFen = SMOTHERED_MATE_FEN,
  highlights = SMOTHERED_MATE_DIAGRAM_HIGHLIGHTS,
  boardOrientation = "black",
  positionSyncKey = "pattern-resurfacing-smothered-mate",
  diagramAccessibilityDescription,
  diagramCaptionTitle,
  diagramCaptionBody,
  showBoardCoordinates = false,
}: PatternResurfacingPreviewProps) {
  const prefersReducedMotion = useReducedMotion();

  const diagramSummary =
    diagramAccessibilityDescription ??
    `Illustrative narrative for the motif ${RESURFACING.motif}: the board shows an authentic smothered mate—black is checkmated with a white knight on f7, king trapped on h8 by black rook and pawns. Four passes on the same tactical line; fourteen times this motif has appeared.`;

  const figCaption =
    diagramAccessibilityDescription ?? SMOTHERED_MATE_FIGCAPTION;

  const showDiagramCaption = Boolean(diagramCaptionTitle ?? diagramCaptionBody);

  return (
    <motion.div
      role="region"
      aria-label="Pattern resurfacing: how recognition of a tactical motif deepens across repeated encounters."
      initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{
        duration: prefersReducedMotion ? 0.2 : 0.65,
        ease: revealEase,
      }}
      className={cn(
        "relative w-full max-w-none cursor-default overflow-visible rounded-3xl bg-gradient-to-br from-muted/[0.08] via-background/25 to-muted/[0.04] px-5 py-6 sm:px-7 sm:py-8 md:px-8 md:py-9 dark:from-muted/[0.06] dark:via-background/15 dark:to-muted/[0.05]",
        className
      )}
      data-pf-pattern-resurfacing
    >
      <p className="sr-only">
        {diagramSummary} Cycle 1 {RESURFACING.cycles[0].state}, about {RESURFACING.cycles[0].time};
        cycle 2 {RESURFACING.cycles[1].state}, about {RESURFACING.cycles[1].time}; cycle 3{" "}
        {RESURFACING.cycles[2].state}, about {RESURFACING.cycles[2].time}. {RESURFACING.closing}
      </p>

      <div
        className="pointer-events-none absolute inset-x-[4%] top-1/2 h-[72%] max-h-[24rem] -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_85%_75%_at_33%_48%,color-mix(in_oklab,var(--muted-foreground)_6%,transparent),transparent_70%)] opacity-50 blur-3xl dark:opacity-70"
        aria-hidden
      />
      {!prefersReducedMotion ? (
        <motion.div
          className="pointer-events-none absolute left-[4%] top-[14%] h-[42%] w-[32%] max-w-[18rem] rounded-full bg-[radial-gradient(circle_at_45%_50%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_68%)] blur-3xl"
          aria-hidden
          animate={{
            opacity: [0.32, 0.5, 0.32],
            scale: [1, 1.04, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/8 to-transparent dark:via-white/[0.06]" />

      <div className="relative z-[1] grid w-full grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-x-8 lg:gap-y-0 xl:gap-x-10">
        {/* Left ~40%: typographic anchor + main diagram */}
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-5">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[0.62rem] font-medium uppercase tracking-[0.18em] text-muted-foreground/54">
              {RESURFACING.eyebrow}
            </p>
            <h3 className="text-balance text-[1.45rem] font-medium leading-[1.1] tracking-tight text-foreground sm:text-2xl lg:text-[1.6rem]">
              {RESURFACING.motif}
            </h3>
            <p className="text-[12px] leading-snug text-muted-foreground/75 sm:text-[13px]">
              <span className="tabular-nums">14</span> encounters · same line · four passes
            </p>
          </div>

          <figure className="relative w-full max-w-[min(100%,22rem)] sm:max-w-[min(100%,24rem)] lg:max-w-full">
            <div
              className="pointer-events-none absolute -inset-3 rounded-2xl bg-[radial-gradient(ellipse_at_50%_35%,color-mix(in_oklab,var(--foreground)_6%,transparent),transparent_75%)] opacity-70"
              aria-hidden
            />
            <EditorialDiagramBoard
              fen={diagramFen}
              highlights={highlights}
              boardOrientation={boardOrientation}
              positionSyncKey={positionSyncKey}
              boardStyleId="blueprint"
              showCoordinates={showBoardCoordinates}
              boardContainerClassName="aspect-square w-full"
              className="w-full"
            />
            <figcaption className="sr-only">{figCaption}</figcaption>
          </figure>

          {showDiagramCaption ? (
            <div className="flex max-w-lg gap-3 border-l-2 border-primary pl-3.5">
              <div className="min-w-0 space-y-1">
                {diagramCaptionTitle ? (
                  <p className="text-sm font-medium tracking-tight text-foreground">
                    {diagramCaptionTitle}
                  </p>
                ) : null}
                {diagramCaptionBody ? (
                  <p className="text-[13px] leading-relaxed text-muted-foreground/80">
                    {diagramCaptionBody}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Right ~60%: recognition arc + cycle previews (placeholders for mini boards — layout pass) */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7 lg:pl-2 xl:pl-4">
          <p className="font-mono text-[0.62rem] font-medium uppercase tracking-[0.14em] text-muted-foreground/52">
            Recognition unfolding
          </p>

          <>
            {/* Mobile: stacked cycles (no arrows — boards aren’t in one row) */}
            <div className="flex w-full flex-col gap-10 md:hidden">
              {RESURFACING.cycles.map((c, i) => (
                <motion.div
                  key={c.n}
                  className="flex flex-col text-center"
                  initial={{
                    opacity: prefersReducedMotion ? 1 : 0,
                    y: prefersReducedMotion ? 0 : 8,
                  }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.12 : 0.48,
                    delay: prefersReducedMotion ? 0 : 0.09 + i * 0.08,
                    ease: revealEase,
                  }}
                >
                  <div>
                    <p className={cycleMetaClass(i)}>Cycle {c.n}</p>
                    <div className={progressionTone(i)}>
                      <p className={cycleTitleClass(i)}>
                        <span>{c.state}</span>
                        <span className="font-normal text-muted-foreground/52">
                          {" "}
                          · <span className="tabular-nums">{c.time}</span>
                        </span>
                      </p>
                      <p className={cycleNoteClass(i)}>{c.note}</p>
                    </div>
                  </div>
                  <div className="flex w-full justify-center pt-4">
                    <div className="w-full max-w-[8.75rem] sm:max-w-[9.25rem]">
                      <EditorialDiagramBoard
                        fen={cycleDiagramFen(c, diagramFen)}
                        highlights={c.highlights}
                        boardOrientation={boardOrientation}
                        positionSyncKey={`${positionSyncKey}-cycle-${c.n}-${cycleBoardSyncKeyFragment(c, diagramFen)}`}
                        boardStyleId="blueprint"
                        showCoordinates={false}
                        boardContainerClassName="aspect-square w-full"
                        editorialBoardShellClassName={CYCLE_EDITORIAL_SHELL_CLASS}
                        className="w-full"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* md+: text row, then boards + arrows centered in the gap between boards */}
            <div
              className={cn(
                "hidden w-full md:grid",
                "md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]",
                "md:gap-x-1 md:gap-y-4 lg:gap-x-2"
              )}
            >
              {RESURFACING.cycles.map((c, i) => (
                <motion.div
                  key={`${c.n}-meta`}
                  className={cn(
                    "min-w-0 text-left",
                    i === 0 && "md:col-start-1 md:row-start-1",
                    i === 1 && "md:col-start-3 md:row-start-1",
                    i === 2 && "md:col-start-5 md:row-start-1"
                  )}
                  initial={{
                    opacity: prefersReducedMotion ? 1 : 0,
                    y: prefersReducedMotion ? 0 : 8,
                  }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.12 : 0.48,
                    delay: prefersReducedMotion ? 0 : 0.09 + i * 0.08,
                    ease: revealEase,
                  }}
                >
                  <div>
                    <p className={cycleMetaClass(i)}>Cycle {c.n}</p>
                    <div className={progressionTone(i)}>
                      <p className={cycleTitleClass(i)}>
                        <span>{c.state}</span>
                        <span className="font-normal text-muted-foreground/52">
                          {" "}
                          · <span className="tabular-nums">{c.time}</span>
                        </span>
                      </p>
                      <p className={cycleNoteClass(i)}>{c.note}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              <div
                className="mx-0.5 w-[1.875rem] md:col-start-2 md:row-start-2 md:flex md:self-stretch md:items-center md:justify-center"
                aria-hidden
              >
                <CycleBoardArrow />
              </div>
              <div
                className="mx-0.5 w-[1.875rem] md:col-start-4 md:row-start-2 md:flex md:self-stretch md:items-center md:justify-center"
                aria-hidden
              >
                <CycleBoardArrow />
              </div>
              {RESURFACING.cycles.map((c, i) => (
                <motion.div
                  key={`${c.n}-board`}
                  className={cn(
                    "flex justify-center",
                    i === 0 && "md:col-start-1 md:row-start-2",
                    i === 1 && "md:col-start-3 md:row-start-2",
                    i === 2 && "md:col-start-5 md:row-start-2"
                  )}
                  initial={{
                    opacity: prefersReducedMotion ? 1 : 0,
                    y: prefersReducedMotion ? 0 : 8,
                  }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.12 : 0.48,
                    delay: prefersReducedMotion ? 0 : 0.09 + i * 0.08,
                    ease: revealEase,
                  }}
                >
                  <div className="w-full max-w-[8.75rem] sm:max-w-[9.25rem]">
                    <EditorialDiagramBoard
                      fen={cycleDiagramFen(c, diagramFen)}
                      highlights={c.highlights}
                      boardOrientation={boardOrientation}
                      positionSyncKey={`${positionSyncKey}-cycle-${c.n}-${cycleBoardSyncKeyFragment(c, diagramFen)}`}
                      boardStyleId="blueprint"
                      showCoordinates={false}
                      boardContainerClassName="aspect-square w-full"
                      editorialBoardShellClassName={CYCLE_EDITORIAL_SHELL_CLASS}
                      className="w-full"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </>

          <motion.p
            className="text-center text-[12px] leading-relaxed text-muted-foreground/78 sm:text-[13px] md:max-w-xl md:text-left lg:mx-0"
            initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{
              duration: prefersReducedMotion ? 0.12 : 0.42,
              delay: prefersReducedMotion ? 0 : 0.2,
              ease: revealEase,
            }}
          >
            {RESURFACING.closing}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
