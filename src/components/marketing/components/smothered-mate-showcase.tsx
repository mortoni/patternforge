"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { EditorialDiagramBoard } from "@/components/marketing/components/editorial-diagram-board";
import { MarketingFlowArrow } from "@/components/marketing/components/marketing-flow-arrow";
import type { BoardHighlight } from "@/lib/chess/board-highlight";
import { cn } from "@/lib/utils";
import { PREMIUM_EASE } from "@/components/shared/motion-primitives";

/** Mate diagram: Nf7#, king on h8 — keep in sync with step 3 below. */
const SMOTHERED_MATE_FEN = "6rk/1p1b1Nbp/1n2B1p1/p7/Pq6/8/1P4PP/R6K b - - 1 1";

/** Step boards (1–3): ~1.4× prior widths for readability. */
const STEP_BOARD_FRAME = "w-[10.15rem] shrink-0 sm:w-[11.55rem] md:w-[12.25rem]";

/**
 * One tactical step (data-only). Swap `fen` / `highlights` when diagrams are finalized.
 */
export type SmotheredProgressionStep = {
  id: string;
  stepLabel: string;
  title: string;
  narrative: string;
  fen: string;
  highlights: BoardHighlight[];
};

const SMOTHERED_PROGRESSION_STEPS: SmotheredProgressionStep[] = [
  {
    id: "recognize-setup",
    stepLabel: "Step 1",
    title: "Recognize setup",
    narrative: "Heavy pieces eye the king; the queen can steer it toward the corner.",
    fen: "3r3k/1p1b1Qbp/1n2B1p1/p5N1/Pq6/8/1P4PP/R6K w - - 0 1",
    highlights: [
      { square: "f7", kind: "focus" },
      { square: "d8", kind: "piece" },
      { square: "g8", kind: "piece" },
    ],
  },
  {
    id: "observe-restriction",
    stepLabel: "Step 2",
    title: "Observe restriction",
    narrative:
      "The king crawls to h8 while its own pawns and rook seal every flight square.",
    fen: "6rk/1p1b2bp/1n2B1p1/p5N1/Pq6/8/1P4PP/R6K w - - 0 1",
    highlights: [
      { square: "h8", kind: "focus" },
      { square: "g8", kind: "piece" },
      { square: "g7", kind: "piece" },
      { square: "h7", kind: "piece" },
    ],
  },
  {
    id: "smothered-mate",
    stepLabel: "Step 3",
    title: "Smothered mate",
    narrative: "The knight delivers mate—the king smothered by its own army.",
    fen: SMOTHERED_MATE_FEN,
    highlights: [
      { square: "f7", kind: "piece" },
      { square: "h8", kind: "focus" },
      { square: "g8", kind: "piece" },
    ],
  },
];

const PATTERN_CRYSTALLIZED = {
  title: "Pattern crystallized",
  narrative:
    "Each repetition turns calculation into recognition. The pattern starts appearing automatically.",
} as const;

const revealEase = PREMIUM_EASE;

/** Decorative crystal — editorial accent only (no semantic meaning). */
function PatternCrystalArt({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-center px-2 py-3 sm:px-3",
        className
      )}
      aria-hidden
    >
      <Image
        src="/crystal-1.png"
        alt=""
        width={1024}
        height={1024}
        className="h-auto w-[min(16.5rem,100%)] max-w-none object-contain object-center"
        sizes="(max-width: 640px) 100vw, 16.5rem"
      />
    </div>
  );
}

/** One wide panel: Step 3 (text + board) | Pattern crystallized (crystal + text). */
function SmotheredStep3CrystallizedPanel({
  step,
  motionOff,
}: {
  step: SmotheredProgressionStep;
  motionOff: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: motionOff ? 1 : 0, y: motionOff ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: motionOff ? 0.18 : 0.48,
        delay: motionOff ? 0 : 0.12,
        ease: revealEase,
      }}
      className={cn(
        "relative w-full min-h-0 overflow-hidden rounded-xl border",
        "border-primary/45 bg-gradient-to-br from-primary/[0.08] via-card/90 to-amber-500/[0.06]",
        "dark:border-primary/50 dark:from-primary/[0.12] dark:via-card/30 dark:to-amber-500/[0.07]"
      )}
    >
      <div className="flex min-h-0 w-full flex-col md:flex-row md:items-center">
        {/* Left half — Step 3 */}
        <div className="flex min-h-0 flex-1 flex-row gap-4 p-4 sm:gap-5 sm:p-5">
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <span
              className={cn(
                "inline-flex w-fit rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]",
                "bg-amber-500/22 text-amber-950 dark:bg-amber-400/18 dark:text-amber-50"
              )}
            >
              {step.stepLabel}
            </span>
            <h3 className="mt-2.5 text-base font-semibold leading-snug tracking-tight text-foreground sm:text-[17px]">
              {step.title}
            </h3>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
              {step.narrative}
            </p>
          </div>
          <div className={cn(STEP_BOARD_FRAME, "self-center")}>
            <EditorialDiagramBoard
              fen={step.fen}
              highlights={step.highlights}
              boardOrientation="white"
              positionSyncKey={`smothered-grid-${step.id}`}
              boardStyleId="blueprint"
              showCoordinates={false}
              editorialHighlightTone="smotheredHero"
              editorialBoardShellClassName="rounded-md ring-1 ring-black/[0.05] dark:ring-white/[0.06]"
              boardContainerClassName="aspect-square w-full"
              className="w-full"
            />
          </div>
        </div>

        {/* Right half — Pattern crystallized */}
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row sm:items-center">
          <div className="flex w-full shrink-0 justify-center sm:w-auto">
            <PatternCrystalArt />
          </div>
          <div className="flex flex-1 flex-col justify-center px-4 py-4 sm:px-5 sm:py-5 md:px-6">
            <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground sm:text-[17px]">
              {PATTERN_CRYSTALLIZED.title}
            </h3>
            <p className="mt-2.5 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
              {PATTERN_CRYSTALLIZED.narrative}
            </p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function SmotheredGridStepCard({
  step,
  stepIndex,
  motionOff,
  className,
}: {
  step: SmotheredProgressionStep;
  stepIndex: number;
  motionOff: boolean;
  className?: string;
}) {
  return (
    <motion.article
      initial={{ opacity: motionOff ? 1 : 0, y: motionOff ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: motionOff ? 0.18 : 0.48,
        delay: motionOff ? 0 : 0.06 + stepIndex * 0.05,
        ease: revealEase,
      }}
      className={cn(
        "relative flex h-full min-h-0 flex-row gap-4 rounded-xl border p-4 sm:gap-5 sm:p-5",
        "border-border/55 bg-card/80 shadow-none dark:border-white/[0.08] dark:bg-card/40",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center pr-0">
        <span
          className={cn(
            "inline-flex w-fit rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]",
            "bg-amber-500/22 text-amber-950 dark:bg-amber-400/18 dark:text-amber-50"
          )}
        >
          {step.stepLabel}
        </span>
        <h3 className="mt-2.5 text-base font-semibold leading-snug tracking-tight text-foreground sm:text-[17px]">
          {step.title}
        </h3>
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
          {step.narrative}
        </p>
      </div>
      <div className={cn(STEP_BOARD_FRAME, "self-center")}>
        <EditorialDiagramBoard
          fen={step.fen}
          highlights={step.highlights}
          boardOrientation="white"
          positionSyncKey={`smothered-grid-${step.id}`}
          boardStyleId="blueprint"
          showCoordinates={false}
          editorialHighlightTone="default"
          editorialBoardShellClassName="rounded-md ring-1 ring-black/[0.05] dark:ring-white/[0.06]"
          boardContainerClassName="aspect-square w-full"
          className="w-full"
        />
      </div>
    </motion.article>
  );
}

export function SmotheredMateShowcase({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const motionOff = Boolean(prefersReducedMotion);

  const [step1, step2, step3] = SMOTHERED_PROGRESSION_STEPS;

  return (
    <div className={cn("relative w-full", className)} data-pf-smothered-showcase>
      <p className="sr-only">
        Smothered mate: recognize setup, observe king restriction, then one wide panel
        with the knight delivering mate beside pattern crystallization through repetition.
      </p>

      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.32] dark:opacity-[0.44]"
        aria-hidden
      >
        <div className="absolute left-[8%] top-[20%] h-[45%] w-[40%] max-w-md rounded-full bg-[radial-gradient(circle_at_40%_40%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_74%)] blur-3xl dark:bg-[radial-gradient(circle_at_40%_40%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_72%)]" />
        <div className="absolute bottom-[12%] right-[5%] h-[38%] w-[35%] max-w-sm rounded-full bg-[radial-gradient(circle_at_60%_50%,color-mix(in_oklab,var(--muted-foreground)_7%,transparent),transparent_76%)] blur-3xl dark:opacity-75" />
      </div>

      <motion.div
        initial={{ opacity: motionOff ? 1 : 0, y: motionOff ? 0 : 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{
          duration: motionOff ? 0.2 : 0.55,
          ease: revealEase,
        }}
        className="mx-auto mb-10 max-w-3xl text-center sm:mb-12"
      >
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Signature pattern
        </p>
        <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-[2rem] lg:leading-tight">
          Smothered mate
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
          Setup, restriction, knight—then the pattern you never unsee.
        </p>
      </motion.div>

      {/* Row 1: step1 · arrow · step2. Row 2: single card — Step 3 | Pattern crystallized. */}
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 md:gap-6 lg:gap-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-stretch md:gap-4 lg:gap-5">
          <SmotheredGridStepCard
            step={step1}
            stepIndex={0}
            motionOff={motionOff}
            className="min-w-0 flex-1"
          />
          <div
            className="flex items-center justify-center py-1 md:w-11 md:shrink-0 lg:w-12"
            aria-hidden
          >
            <MarketingFlowArrow
              orientation="vertical"
              emphasis="strong"
              className="md:hidden"
            />
            <MarketingFlowArrow emphasis="strong" className="hidden md:block" />
          </div>
          <SmotheredGridStepCard
            step={step2}
            stepIndex={1}
            motionOff={motionOff}
            className="min-w-0 flex-1"
          />
        </div>

        <div
          className="flex justify-center py-1 md:hidden"
          aria-hidden
        >
          <MarketingFlowArrow orientation="vertical" emphasis="strong" />
        </div>

        <SmotheredStep3CrystallizedPanel step={step3} motionOff={motionOff} />
      </div>
    </div>
  );
}
