"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useDocumentAppearance } from "@/components/shared/training-preview";
import { TrainingBoardCard } from "@/features/training/components/training-board-card";
import type { AppColorScheme } from "@/lib/chess/board-styles";
import { cn } from "@/lib/utils";

/**
 * Authentic smothered mate: black to move is mated; white knight on f7 mates black king on h8,
 * hemmed by rook on g8 and pawns on g7/h7.
 */
const SMOTHERED_MATE_FEN = "6rk/5Npp/8/8/8/8/PPP2PPP/6K1 b - - 0 1";

const MATING_KNIGHT_SQUARE = "f7";

const RESURFACING = {
  eyebrow: "Pattern resurfacing",
  motif: "Smothered mate",
  cycles: [
    {
      n: 1,
      state: "Long calculation",
      note: "The motif still requires deliberate calculation.",
      time: "42s",
    },
    {
      n: 2,
      state: "Recognized structure",
      note: "The structure begins surfacing before calculation completes.",
      time: "18s",
    },
    {
      n: 3,
      state: "Immediate recall",
      note: "Recognition appears almost immediately.",
      time: "7s",
    },
  ],
  closing: "Repeated exposure strengthens retrieval.",
} as const;

function progressionTone(i: number) {
  return cn(
    i === 0 && "opacity-[0.88]",
    i === 1 && "opacity-[0.95]",
    i === 2 && "opacity-100"
  );
}

function cycleMetaClass(i: number) {
  return cn(
    "font-mono text-[0.62rem] font-medium uppercase tracking-[0.14em]",
    i === 0 && "text-muted-foreground/38",
    i === 1 && "text-muted-foreground/46",
    i === 2 && "text-muted-foreground/54"
  );
}

function cycleTitleClass(i: number) {
  return cn(
    "mt-1 text-[0.8125rem] font-medium leading-snug tracking-tight sm:text-[0.875rem]",
    i === 0 && "text-foreground/76",
    i === 1 && "text-foreground/88",
    i === 2 && "text-foreground"
  );
}

function cycleNoteClass(i: number) {
  return cn(
    "mt-1.5 text-[12px] leading-relaxed sm:text-[13px]",
    i === 0 && "text-muted-foreground/66",
    i === 1 && "text-muted-foreground/74",
    i === 2 && "text-muted-foreground/82"
  );
}

const revealEase = [0.22, 1, 0.36, 1] as const;

/** Vertical gradient spine between motif and cycles — reused between cycle columns (row layout). */
const EDITORIAL_DIVIDER_SPINE =
  "pointer-events-none w-px shrink-0 self-stretch bg-gradient-to-b from-transparent via-foreground/10 to-transparent opacity-[0.65] dark:via-white/12";

/** Horizontal gradient rule for stacked splits (same via/opacity as the vertical spine). */
const EDITORIAL_DIVIDER_RULE =
  "pointer-events-none h-px w-full shrink-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent opacity-[0.65] dark:via-white/12";

/** Method-section preview: editorial recognition arc around a real mating pattern (no card chrome). */
export function PatternResurfacingPreview({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const documentAppearance = useDocumentAppearance();
  const previewColorScheme: AppColorScheme =
    documentAppearance === "dark" ? "dark" : "light";

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
        "relative mx-auto w-full max-w-[min(100%,56rem)] overflow-visible rounded-3xl bg-gradient-to-br from-muted/[0.08] via-background/25 to-muted/[0.04] px-5 py-6 sm:px-7 sm:py-7 md:px-8 md:py-8 dark:from-muted/[0.06] dark:via-background/15 dark:to-muted/[0.05]",
        className
      )}
    >
      <p className="sr-only">
        Illustrative narrative for the motif {RESURFACING.motif}: the board shows an authentic
        smothered mate—black is checkmated with a white knight on f7, king trapped on h8 by black
        rook and pawns. Four passes on the same tactical line; fourteen times this motif has appeared.
        Cycle 1 {RESURFACING.cycles[0].state}, about {RESURFACING.cycles[0].time}; cycle 2{" "}
        {RESURFACING.cycles[1].state}, about {RESURFACING.cycles[1].time}; cycle 3{" "}
        {RESURFACING.cycles[2].state}, about {RESURFACING.cycles[2].time}. {RESURFACING.closing}
      </p>

      <div
        className="pointer-events-none absolute inset-x-[8%] top-1/2 h-[72%] max-h-[22rem] -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_85%_75%_at_33%_48%,color-mix(in_oklab,var(--muted-foreground)_6%,transparent),transparent_70%)] opacity-50 blur-3xl dark:opacity-70"
        aria-hidden
      />
      {!prefersReducedMotion ? (
        <motion.div
          className="pointer-events-none absolute left-[6%] top-[18%] h-[46%] w-[38%] max-w-[14rem] rounded-full bg-[radial-gradient(circle_at_45%_50%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_68%)] blur-3xl"
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

      <div className="relative z-1 flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-x-5 xl:gap-x-7">
        {/* Motif memory anchor — text baseline-aligned with board center on large screens */}
        <div className="relative flex min-w-0 flex-col gap-3 lg:w-[min(100%,17rem)] lg:shrink-0 lg:gap-2.5 xl:w-[18rem]">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[0.62rem] font-medium uppercase tracking-[0.18em] text-muted-foreground/42">
              {RESURFACING.eyebrow}
            </p>
            <h3 className="text-balance text-[1.45rem] font-medium leading-[1.1] tracking-tight text-foreground sm:text-2xl">
              {RESURFACING.motif}
            </h3>
            <p className="text-[12px] leading-snug text-muted-foreground/75 sm:text-[13px]">
              <span className="tabular-nums">14</span> encounters · same line · four passes
            </p>
          </div>

          <figure className="relative mx-auto w-full max-w-[14rem] sm:mx-0 sm:max-w-[15rem] lg:max-w-[15.5rem] xl:max-w-[16rem]">
            <div
              className="pointer-events-none absolute -inset-3 rounded-2xl bg-[radial-gradient(ellipse_at_50%_35%,color-mix(in_oklab,var(--foreground)_6%,transparent),transparent_75%)] opacity-70"
              aria-hidden
            />
            <TrainingBoardCard
              fen={SMOTHERED_MATE_FEN}
              positionSyncKey="pattern-resurfacing-smothered-mate"
              boardOrientation="black"
              boardStyleId="blueprint"
              previewColorScheme={previewColorScheme}
              disabled
              minimal
              showCoordinates={false}
              marketingEmbed={false}
              editorialBoard
              editorialAccentSquares={[MATING_KNIGHT_SQUARE]}
              boardContainerClassName="aspect-square w-full"
              className="w-full"
            />
            <figcaption className="sr-only">
              Diagram: final position after white delivers smothered mate; the black king on h8 cannot
              escape; the mating piece is the white knight on f7.
            </figcaption>
          </figure>

          <div
            className="pointer-events-none absolute -right-2 top-[58%] hidden h-px w-8 bg-gradient-to-r from-foreground/20 to-transparent lg:block xl:-right-1 xl:w-12 dark:from-white/18"
            aria-hidden
          />
        </div>

        <div
          className={cn(EDITORIAL_DIVIDER_SPINE, "hidden lg:block")}
          aria-hidden
        />

        <div className="relative flex min-w-0 flex-1 flex-col justify-center gap-5 lg:pl-4 xl:pl-5">
          <p className="font-mono text-[0.62rem] font-medium uppercase tracking-[0.14em] text-muted-foreground/38">
            Recognition unfolding
          </p>

          <div className="flex flex-col md:flex-row md:items-stretch md:gap-0">
            {RESURFACING.cycles.flatMap((c, i) => {
              const column = (
                <motion.div
                  key={c.n}
                  className={cn(
                    "min-w-0 flex-1 pb-4 pt-4 first:pt-0 md:pb-0.5 md:pt-0.5 lg:pl-7 lg:pr-4",
                    i === 0 && "md:pl-0 md:pr-3",
                    i > 0 && "md:pl-6 md:pr-3",
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
                  <div className={progressionTone(i)}>
                    <p className={cycleMetaClass(i)}>Cycle {c.n}</p>
                    <p className={cycleTitleClass(i)}>
                      <span>{c.state}</span>
                      <span className="font-normal text-muted-foreground/52">
                        {" "}
                        · <span className="tabular-nums">{c.time}</span>
                      </span>
                    </p>
                    <p className={cycleNoteClass(i)}>{c.note}</p>
                  </div>
                </motion.div>
              );
              if (i === 0) return [column];
              return [
                <div
                  key={`cycle-div-${i}-rule`}
                  className={cn(EDITORIAL_DIVIDER_RULE, "md:hidden")}
                  aria-hidden
                />,
                <div
                  key={`cycle-div-${i}-spine`}
                  className={cn(EDITORIAL_DIVIDER_SPINE, "hidden md:block")}
                  aria-hidden
                />,
                column,
              ];
            })}
          </div>
        </div>
      </div>

      <motion.p
        className="relative z-1 mx-auto mt-6 max-w-lg text-center text-[12px] leading-relaxed text-muted-foreground/78 sm:mt-7 sm:text-[13px]"
        initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{
          duration: prefersReducedMotion ? 0.12 : 0.42,
          delay: prefersReducedMotion ? 0 : 0.24,
          ease: revealEase,
        }}
      >
        {RESURFACING.closing}
      </motion.p>
    </motion.div>
  );
}
