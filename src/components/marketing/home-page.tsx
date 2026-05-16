import Link from "next/link";
import AppTitle from "@/components/logo/AppTitle";
import Logo from "@/components/logo/Logo";
import {
  DocumentThemedTrainingPreview,
  LG_PREVIEW_FRAME_STYLE,
  type MarketingShellTone,
} from "@/components/shared/training-preview";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  AmbientBreathOrb,
  FadeIn,
  HeroCascade,
  MotionCard,
  MotionEmphasisGlow,
  MotionPreviewFrame,
  MotionScreenshot,
  StaggerContainer,
  StaggeredSectionHeader,
} from "@/components/shared/motion-primitives";
import { Button } from "@/components/ui/button";
import { DOCUMENTATION_URL, ROUTES } from "@/lib/constants";
import type { PreviewTrainingParams } from "@/lib/preview/preview-training-url";
import {
  DocumentThemedProgressMarketingPreview,
  DocumentThemedMasteryMarketingPreview,
  type MasteryMarketingPreviewProps,
  type ProgressMarketingPreviewProps,
} from "@/features/marketing/components/training-in-action-flow-previews";
import { PatternResurfacingPreview } from "@/components/marketing/pattern-resurfacing-preview";
import { TimeCompressionGraphic } from "@/components/marketing/time-compression-graphic";
import { cn } from "@/lib/utils";

const containerClass = "mx-auto w-full max-w-6xl px-3.5 sm:px-5 md:px-6 lg:px-8";
/** Wider hero on desktop: uses most of the viewport up to a generous cap. */
const heroContainerClass =
  "mx-auto w-full max-w-6xl min-w-0 px-3.5 sm:px-5 md:px-6 lg:max-w-[min(100%,100rem)] lg:px-10 xl:px-14";
const headerWordmarkClass =
  "text-[11px] tracking-[0.2em] sm:text-xs sm:tracking-[0.28em] md:text-sm md:tracking-[0.35em]";
const footerWordmarkClass =
  "text-[11px] tracking-[0.2em] sm:text-xs sm:tracking-[0.28em] md:text-sm md:tracking-[0.35em]";
const navLinkClass =
  "text-sm text-muted-foreground transition-colors hover:text-foreground";
const footerLinkClass =
  "text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100";
const footerMuted = "text-sm leading-relaxed text-neutral-600 dark:text-neutral-400";
const footerHeading =
  "text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500";

type TrainingInActionVisual =
  | {
      kind: "phone";
      preview: Omit<PreviewTrainingParams, "appearance">;
      iframeTitle: string;
    }
  | {
      kind: "progress";
      iframeTitle: string;
      preview: ProgressMarketingPreviewProps;
    }
  | {
      kind: "mastery";
      iframeTitle: string;
      preview: MasteryMarketingPreviewProps;
    };

/**
 * Landing preview narrative — one active Woodpecker line (Intermediate, 762) in cycle 3 around
 * exercise ~142; completed passes 1→4 timings stay aligned with mastery + time-compression.
 */
const LANDING_SET_NAME = "Woodpecker Intermediate";
const LANDING_LINE_TOTAL = 762;
const LANDING_ACTIVE_CYCLE = 3;
const LANDING_ACTIVE_EXERCISE = 142;
const LANDING_LAST_BLOCK_MS = 12 * 60 * 1000 + 34_000;

const LANDING_TRAINING_CHROME = {
  puzzle: LANDING_ACTIVE_EXERCISE,
  total: LANDING_LINE_TOTAL,
  cycle: LANDING_ACTIVE_CYCLE,
  setName: LANDING_SET_NAME,
  boardStyle: "blueprint" as const,
} satisfies Omit<PreviewTrainingParams, "appearance">;

/** Hero + centre “Solve” column in the training loop — same preview params + default phone shell (`430×932`). */
const MARKETING_HERO_PHONE_PREVIEW = {
  screen: "sm" as const,
  ...LANDING_TRAINING_CHROME,
} satisfies Omit<PreviewTrainingParams, "appearance">;

const MARKETING_LOOP_PROGRESS_PREVIEW = {
  trainingSetName: LANDING_SET_NAME,
  cycleNumber: LANDING_ACTIVE_CYCLE,
  nextExerciseIndex: LANDING_ACTIVE_EXERCISE,
  totalExercises: LANDING_LINE_TOTAL,
  exercisesRemaining: LANDING_LINE_TOTAL - LANDING_ACTIVE_EXERCISE,
  sessionCountThisCycle: 6,
  lastSessionDurationMs: LANDING_LAST_BLOCK_MS,
  cycleStartedLabel: "9 May · picked up again after a quiet weekend pause",
  continuityHint:
    "Weekday commuter blocks mostly — uneven lengths, but the fifth pass is creeping forward steadily.",
  recentSessions: [
    {
      dayLabel: "Today · 06:52",
      exercisesDone: 24,
      durationMs: LANDING_LAST_BLOCK_MS,
    },
    {
      dayLabel: "Yesterday · 07:41",
      exercisesDone: 31,
      durationMs: 14 * 60 * 1000 + 47_000,
    },
    {
      dayLabel: "Wed 14 May · evening",
      exercisesDone: 18,
      durationMs: 9 * 60 * 1000 + 21_000,
    },
    {
      dayLabel: "Mon 12 May · desk block",
      exercisesDone: 42,
      durationMs: 23 * 60 * 1000 + 8_900,
    },
  ],
} satisfies ProgressMarketingPreviewProps;

/** Completed cycles (oldest first) shared with mastery + payoff graphic (`totalMs` mildly imperfect). */
const MARKETING_LANDING_COMPLETED_PASSES_MS = [
  { cycleNumber: 1, totalTimeMs: 105 * 60 * 1000 },
  { cycleNumber: 2, totalTimeMs: 58 * 60 * 1000 },
  { cycleNumber: 3, totalTimeMs: 32 * 60 * 1000 },
  { cycleNumber: 4, totalTimeMs: 17 * 60 * 1000 + 53_000 },
] as const satisfies ReadonlyArray<MasteryMarketingPreviewProps["cycles"][number]>;

const LANDING_CYCLE_COMPRESSION_PCT = Math.round(
  (1 -
    MARKETING_LANDING_COMPLETED_PASSES_MS[3].totalTimeMs /
      MARKETING_LANDING_COMPLETED_PASSES_MS[0].totalTimeMs) *
    100
);

const LOOP_MASTERY_INSIGHT = `About ${LANDING_CYCLE_COMPRESSION_PCT}% less wall-clock from first pass to fourth`;

const LOOP_MASTERY_RECOGNITION_LINE =
  "Fourth pass dipped under eighteen minutes—wall-clock collapsing as motifs move from search to fluent recognition.";

const trainingInActionCards: Array<{
  role: "track" | "solve" | "master";
  step: string;
  title: string;
  body: string;
  mode: "center" | "side";
  visual: TrainingInActionVisual;
}> = [
  {
    role: "track",
    step: "01 TRACK",
    title: "Track the cycle",
    body:
      "One roster, resumed across weeks: session bookmarks hold your place while repeated exposure compounds recall.",
    mode: "side",
    visual: {
      kind: "progress",
      iframeTitle: "Training loop — progress / current cycle preview",
      preview: MARKETING_LOOP_PROGRESS_PREVIEW,
    },
  },
  {
    role: "solve",
    step: "02 SOLVE",
    title: "Solve the position",
    body:
      "A bounded tactical line—not an endless novelty feed—so motifs return often enough for patterns to settle.",
    mode: "center",
    visual: {
      kind: "phone",
      iframeTitle: "Training loop — active exercise preview",
      preview: MARKETING_HERO_PHONE_PREVIEW,
    },
  },
  {
    role: "master",
    step: "03 MASTER",
    title: "Measure mastery",
    body:
      "Full-pass durations trend down cycle to cycle—a quiet chart of recognition accelerating where brute search used to linger.",
    mode: "side",
    visual: {
      kind: "mastery",
      iframeTitle: "Training loop — mastery preview",
      preview: {
        trainingSetName: LANDING_SET_NAME,
        cycles: [...MARKETING_LANDING_COMPLETED_PASSES_MS],
        insightLine: LOOP_MASTERY_INSIGHT,
        recognitionLine: LOOP_MASTERY_RECOGNITION_LINE,
      },
    },
  },
];

/**
 * Continue-anywhere section: identical cycle / set / exercise on both previews so live UI reads as
 * one session carried across contexts (continuity cues in meta + board position).
 */
const CONTINUE_ANYWHERE_DESKTOP_PREVIEW = {
  screen: "lg" as const,
  ...LANDING_TRAINING_CHROME,
} satisfies Omit<PreviewTrainingParams, "appearance">;

const CONTINUE_ANYWHERE_MOBILE_PREVIEW = {
  screen: "sm" as const,
  ...LANDING_TRAINING_CHROME,
} satisfies Omit<PreviewTrainingParams, "appearance">;

/** How recognition shifts over repeated cycles (psychological arc, not UI steps). */
const methodSteps = [
  {
    title: "Choose a line",
    body: "Commit to a small tactical set you will revisit again and again.",
  },
  {
    title: "Recognition slows calculation",
    body: "The first passes feel effortful. Each move still asks for deliberate, conscious calculation.",
  },
  {
    title: "Patterns start resurfacing",
    body: "Positions begin to feel familiar before the full calculation has finished.",
  },
  {
    title: "Recall becomes immediate",
    body: "The right ideas show up faster, with less conscious effort holding the thread.",
  },
  {
    title: "Time begins collapsing",
    body: "The same cycle needs a fraction of the wall-clock and attention it once did.",
  },
] as const;

/** Full-set times reused from {@link MARKETING_LANDING_COMPLETED_PASSES_MS}. */
const TIME_COMPRESSION_CYCLES = MARKETING_LANDING_COMPLETED_PASSES_MS.map((c) => ({
  cycle: c.cycleNumber,
  totalMs: c.totalTimeMs,
}));

const TIME_COMPRESSION_REDUCTION_LABEL = `~${LANDING_CYCLE_COMPRESSION_PCT}% less wall-clock after four cycles`;

/** Soft horizontal hairline — reads gentler than `border-b` across full width. */
const sectionHairline =
  "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-border/35 after:to-transparent dark:after:via-white/10";

function TrainingIframePair({
  className,
  title,
  preview,
  phoneShellClassName,
  phoneAspectClassName,
  smAspectHeight,
  smFillContainer,
  compactHeroLayout,
  preventShortEmbedFrame,
  shellTone,
}: {
  className?: string;
  title: string;
  preview: Omit<PreviewTrainingParams, "appearance">;
  /** Overrides the default mobile shell sizing (e.g. hero larger frame). */
  phoneShellClassName?: string;
  /** Overrides default `aspect-[430/932]` when using a non-default `smAspectHeight`. */
  phoneAspectClassName?: string;
  smAspectHeight?: number;
  smFillContainer?: boolean;
  compactHeroLayout?: boolean;
  preventShortEmbedFrame?: boolean;
  shellTone?: MarketingShellTone;
}) {
  const isSm = preview.screen === "sm";
  const isLg = preview.screen === "lg";

  const positioned =
    isSm || isLg ? cn(className, "absolute inset-0") : className;

  const tree = (
    <DocumentThemedTrainingPreview
      className={positioned}
      title={title}
      preview={preview}
      smAspectHeight={smAspectHeight}
      smFillContainer={smFillContainer}
      compactHeroLayout={compactHeroLayout}
      preventShortEmbedFrame={preventShortEmbedFrame}
      shellTone={shellTone}
    />
  );

  if (isSm) {
    return (
      <div
        className={cn(
          phoneAspectClassName ?? "aspect-[430/932]",
          "relative isolate mx-auto w-full shrink-0 max-w-[20rem] lg:w-[20rem]",
          phoneShellClassName
        )}
      >
        {tree}
      </div>
    );
  }

  if (isLg) {
    return (
      <div
        className="relative isolate mx-auto shrink-0"
        style={LG_PREVIEW_FRAME_STYLE}
      >
        {tree}
      </div>
    );
  }

  return tree;
}

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-border/55 bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/80 dark:border-white/8">
      <div
        className={`${containerClass} flex items-center justify-between gap-2 py-3 md:gap-6 md:py-3.5`}
      >
        <Link
          href={ROUTES.home}
          className="flex min-w-0 items-center gap-2 sm:gap-2.5 md:gap-3"
        >
          <span className="shrink-0 md:hidden">
            <Logo size={36} />
          </span>
          <span className="hidden shrink-0 md:inline">
            <Logo size={40} />
          </span>
          <AppTitle className={headerWordmarkClass} />
        </Link>
        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          <nav
            className="hidden flex-wrap items-center justify-end gap-x-5 gap-y-2 md:flex"
            aria-label="Marketing"
          >
            <Link href="#philosophy" className={navLinkClass}>
              Philosophy
            </Link>
            <Link href="#method" className={navLinkClass}>
              Method
            </Link>
            {DOCUMENTATION_URL ? (
              <a
                href={DOCUMENTATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={navLinkClass}
              >
                Documentation
              </a>
            ) : null}
            <Link href={ROUTES.sets} className={navLinkClass}>
              Training Sets
            </Link>
            <Link href={ROUTES.privacy} className={navLinkClass}>
              Privacy
            </Link>
            <Link href={ROUTES.terms} className={navLinkClass}>
              Terms
            </Link>
          </nav>
          <ThemeToggle />
          <Button
            asChild
            size="sm"
            className="h-10 min-w-22 shrink-0 px-4 transition-[opacity,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-95 hover:-translate-y-px hover:shadow-[0_8px_24px_-10px_color-mix(in_oklab,var(--primary)_38%,transparent)] active:translate-y-0 motion-reduce:transform-none motion-reduce:hover:shadow-none"
          >
            <Link href={ROUTES.app}>Start training</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="w-full border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl px-3.5 py-12 sm:px-5 md:px-6 md:py-12">
        <div className="flex flex-col gap-12 text-left md:grid md:grid-cols-4 md:gap-8 md:text-left">
          <div className="space-y-5">
            <Link
              href={ROUTES.home}
              className="inline-flex max-w-full items-center gap-2.5 transition-opacity hover:opacity-85 sm:gap-3"
            >
              <span className="shrink-0 md:hidden">
                <Logo size={40} />
              </span>
              <span className="hidden shrink-0 md:inline">
                <Logo size={44} />
              </span>
              <AppTitle className={footerWordmarkClass} />
            </Link>
            <p className={`max-w-md md:max-w-xs ${footerMuted}`}>
              Structured chess training inspired by deliberate repetition.
            </p>
          </div>
          <div>
            <h3 className={footerHeading}>Product</h3>
            <ul className="mt-4 space-y-3 md:mt-5 md:space-y-3.5">
              <li>
                <Link href={ROUTES.app} className={`${footerLinkClass} block py-0.5`}>
                  Start training
                </Link>
              </li>
              <li>
                <Link href={ROUTES.sets} className={`${footerLinkClass} block py-0.5`}>
                  Training sets
                </Link>
              </li>
              <li>
                <Link href="/#method" className={`${footerLinkClass} block py-0.5`}>
                  Method
                </Link>
              </li>
              <li>
                <Link href="/#philosophy" className={`${footerLinkClass} block py-0.5`}>
                  Philosophy
                </Link>
              </li>
              {DOCUMENTATION_URL ? (
                <li>
                  <a
                    href={DOCUMENTATION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${footerLinkClass} block py-0.5`}
                  >
                    Documentation
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
          <div>
            <h3 className={footerHeading}>Legal</h3>
            <ul className="mt-4 space-y-3 md:mt-5 md:space-y-3.5">
              <li>
                <Link href={ROUTES.privacy} className={`${footerLinkClass} block py-0.5`}>
                  Privacy
                </Link>
              </li>
              <li>
                <Link href={ROUTES.terms} className={`${footerLinkClass} block py-0.5`}>
                  Terms
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className={footerHeading}>About</h3>
            <p className={`mt-4 md:mt-5 ${footerMuted}`}>
              Rooted in Axel Smith and Hans Tikkanen&apos;s Woodpecker Method: fixed sets, iterative passes,
              deliberate practice—not endless random puzzles.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-3.5 py-6 text-sm text-neutral-500 sm:px-5 md:flex-row md:items-center md:justify-between md:px-6 dark:text-neutral-400">
          <p>© 2026 PatternForge</p>
          <p className="max-w-md leading-relaxed md:max-w-none md:text-right">
            Long-horizon pattern retention through cycle-based repetition.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Header />
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden">
        <main className="relative flex-1 isolate">
        {/* Hero — immersive asymmetric anchor around live training preview */}
        <section
          className={cn(
            "relative overflow-x-clip overflow-y-visible",
            sectionHairline
          )}
          aria-labelledby="hero-heading"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-8%] top-[14%] h-[46%] w-[58%] max-w-3xl bg-[radial-gradient(ellipse_52%_48%_at_38%_42%,color-mix(in_oklab,var(--muted-foreground)_5%,transparent),transparent_72%)] opacity-40 dark:bg-[radial-gradient(ellipse_52%_48%_at_38%_42%,color-mix(in_oklab,var(--primary)_4%,transparent),transparent_74%)] dark:opacity-55" />
            <div className="absolute right-[-6%] top-[18%] h-[48%] w-[52%] max-w-3xl bg-[radial-gradient(circle_at_56%_42%,rgba(132,104,232,0.042),rgba(132,104,232,0.018)_46%,transparent_74%)] opacity-60 blur-[26px] dark:bg-[radial-gradient(circle_at_56%_42%,rgba(132,104,232,0.08),rgba(132,104,232,0.026)_46%,transparent_74%)] md:right-0" />
          </div>
          {/* Bridges into next section */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[min(14rem,30vh)] bg-gradient-to-b from-transparent via-background/42 to-background dark:via-background/58"
          />

          <div
            className={`${heroContainerClass} relative z-[1] py-11 sm:py-14 md:py-16 lg:min-h-[min(78vh,48rem)] lg:py-[clamp(4rem,7vw,5.75rem)] xl:pb-20 xl:pt-[4.375rem]`}
          >
            <div
              className={cn(
                "mx-auto grid w-full min-w-0 gap-9 sm:gap-11 lg:grid-cols-12 lg:items-center lg:gap-x-6 lg:gap-y-10",
                "xl:gap-x-10 xl:gap-y-8"
              )}
            >
              <HeroCascade
                className="min-w-0 justify-self-center text-center max-w-xl sm:max-w-2xl lg:col-span-5 lg:max-w-[min(100%,31rem)] lg:justify-self-start lg:self-center lg:text-left xl:col-span-5"
                title={
                <h1
                  id="hero-heading"
                  className="text-balance text-[1.625rem] font-light leading-[1.14] tracking-tight text-foreground min-[400px]:text-4xl sm:text-5xl lg:text-[clamp(2.65rem,3.5vw,3.85rem)] xl:text-[clamp(3.1rem,3.4vw,4.2rem)]"
                >
                  Train patterns, not just puzzles.
                </h1>
                }
                lead={
                <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base md:text-lg lg:mx-0 lg:mt-3.5 lg:max-w-[28rem] lg:text-[1.0625rem] lg:leading-[1.55]">
                  Repeat tactical patterns until the right ideas feel immediate. Recognition sharpens
                  through repetition, not an endless stream of unrelated puzzles.
                </p>
                }
                tagline={
                <p className="mx-auto mt-2.5 max-w-xl text-sm italic leading-relaxed text-muted-foreground/85 sm:mt-3 lg:mx-0 lg:max-w-[28rem] lg:text-[0.9375rem] lg:leading-relaxed">
                  Over time, calculation gives way to recognition.
                </p>
                }
                actions={
                <div className="mx-auto mt-6 flex w-full max-w-md flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:justify-center sm:gap-3 lg:mx-0 lg:mt-7 lg:justify-start">
                  <Button
                    asChild
                    size="lg"
                    className="w-full min-h-11 transition-[opacity,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-95 hover:-translate-y-px hover:shadow-[0_12px_32px_-12px_color-mix(in_oklab,var(--primary)_42%,transparent)] active:translate-y-0 motion-reduce:transform-none motion-reduce:hover:shadow-none sm:w-auto"
                  >
                    <Link href={ROUTES.app}>Start training</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full min-h-11 border-border transition-[transform,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-muted/42 hover:-translate-y-px hover:shadow-[0_10px_28px_-14px_color-mix(in_oklab,var(--foreground)_14%,transparent)] active:translate-y-0 motion-reduce:transform-none motion-reduce:hover:shadow-none sm:w-auto"
                  >
                    <Link href="#training-in-action">How it works</Link>
                  </Button>
                </div>
                }
              />

              <FadeIn
                className="relative flex w-full min-w-0 max-w-full justify-center justify-self-center lg:col-span-7 lg:-mr-1 lg:justify-end lg:justify-self-end lg:pl-5 xl:-mr-2 xl:pl-6"
                delay={0.08}
              >
                <div
                  className="pointer-events-none absolute left-1/2 top-[6%] flex w-[104%] max-w-[26rem] -translate-x-1/2 justify-center sm:w-[102%] sm:max-w-[27rem] lg:left-[53%] lg:top-[12%] lg:w-[95%] lg:max-w-[30rem] lg:translate-x-[-50%]"
                  aria-hidden
                >
                  <AmbientBreathOrb
                    emphasis="medium"
                    className="aspect-[430/932] w-full rounded-full bg-[radial-gradient(circle,rgba(140,92,255,0.12)_0%,rgba(120,75,255,0.04)_42%,transparent_76%)] blur-[28px] dark:bg-[radial-gradient(circle,rgba(160,120,255,0.16)_0%,rgba(120,75,255,0.048)_42%,transparent_76%)]"
                  />
                </div>
                <div
                  className="pointer-events-none absolute left-1/2 top-[24%] w-[88%] max-w-[20rem] -translate-x-1/2 lg:left-[52%] lg:top-[30%] lg:w-[82%] lg:max-w-[24rem] lg:-translate-x-1/2"
                  aria-hidden
                >
                  <AmbientBreathOrb
                    emphasis="mist"
                    className="h-28 w-full rounded-full bg-[radial-gradient(ellipse_80%_52%_at_50%_40%,color-mix(in_oklab,var(--foreground)_4.5%,transparent),transparent_80%)] blur-xl"
                  />
                </div>

                <div className="relative z-10 w-full max-w-[min(100%,22.5rem)] lg:ml-auto lg:mr-[-0.25rem] lg:max-w-[min(104%,29rem)] xl:mr-[-0.35rem]">
                  {/* No overflow:hidden + scale — that clips frame + board edges. Nudge tension with offset only. */}
                  <div className="w-full max-lg:mx-auto lg:translate-x-1 xl:translate-x-1.5">
                    <MotionPreviewFrame
                      emphasis="hero"
                      className="relative z-10 w-full max-md:scale-100"
                    >
                      <div className="w-full">
                        <TrainingIframePair
                          className="absolute inset-0"
                          title="Training loop — active exercise preview"
                          preview={MARKETING_HERO_PHONE_PREVIEW}
                        />
                      </div>
                    </MotionPreviewFrame>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Training loop — long-horizon ritual (Track → Solve → Master) */}
        <section
          id="philosophy"
          className={cn(
            "relative w-full scroll-mt-4 bg-gradient-to-b from-muted/[0.105] via-background via-[42%] to-background px-3.5 pt-11 pb-[4.75rem] dark:from-muted/[0.078] dark:via-background sm:px-5 sm:pt-12 sm:pb-[5rem] md:px-6 md:pt-14 md:pb-28 lg:px-10",
            /** Bridge from hero veil — faint lift at top centre */
            "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[min(9rem,20vh)] before:bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,color-mix(in_oklab,var(--muted-foreground)_4%,transparent),transparent_74%)] before:opacity-70 dark:before:opacity-85"
          )}
          aria-labelledby="training-in-action-heading"
        >
          <div id="training-in-action" />
          <AmbientBreathOrb
            emphasis="section"
            className="pointer-events-none absolute left-1/2 top-[48%] hidden h-[min(380px,44vh)] w-[min(880px,92vw)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_48%_36%_at_50%_44%,color-mix(in_oklab,var(--primary)_5.5%,transparent),transparent_72%)] lg:block"
          />
          <div className="relative z-[1] mx-auto max-w-[min(100%,88rem)]">
            <StaggeredSectionHeader
              headingId="training-in-action-heading"
              eyebrow="TRAINING LOOP"
              eyebrowClassName="tracking-[0.11em] text-muted-foreground/55"
              title="Train. Repeat. Recognize faster."
              body="PatternForge stages Woodpecker-style cycles you can stretch across days or weeks: short blocks, resumed sessions, the same motifs on loop until recall edges out heavy search—not a treadmill of unrelated positions."
            />

            <div className="relative mx-auto mt-10 max-w-[min(100%,86rem)] sm:mt-11 md:mt-12 lg:mt-14">
              <StaggerContainer
                as="ul"
                className="relative z-10 grid grid-cols-1 gap-11 sm:gap-12 lg:grid-cols-3 lg:items-start lg:gap-x-6 lg:gap-y-6 xl:gap-x-8 xl:gap-y-5"
              >
                {trainingInActionCards.map((card) => {
                  const isCenter = card.mode === "center";
                  const frameWidth =
                    card.visual.kind === "phone"
                      ? undefined
                      : isCenter
                        ? "w-[min(100%,23rem)] max-w-[23rem]"
                        : "w-[min(100%,17.75rem)] max-w-[17.75rem]";

                  return (
                    <MotionCard
                      as="li"
                      key={card.role}
                      y={isCenter ? 20 : 12}
                      duration={isCenter ? 0.55 : 0.42}
                      staggered
                      hover={false}
                      className={cn(
                        "flex min-w-0 w-full flex-col lg:overflow-visible",
                        /**
                         * Avoid CSS scale/rotate on cards that wrap Chessground previews: descendant
                         * `getBoundingClientRect()` no longer matches layout `%` squares→pixel drift.
                         */
                        card.role === "track" &&
                          "lg:opacity-[0.78] lg:transition-opacity lg:duration-500 lg:ease-out lg:hover:opacity-[0.86]",
                        card.role === "solve" &&
                          "lg:z-30 lg:translate-y-9 lg:opacity-100 lg:transition-opacity lg:duration-500 lg:ease-out",
                        card.role === "master" &&
                          "lg:opacity-[0.78] lg:transition-opacity lg:duration-500 lg:ease-out lg:hover:opacity-[0.86]"
                      )}
                    >
                      <div className="space-y-4 sm:space-y-5">
                        <div className="space-y-1.5">
                          <h3
                            className={cn(
                              "text-base font-medium text-foreground",
                              isCenter && "text-[17px] sm:text-lg"
                            )}
                          >
                            {card.title}
                          </h3>
                          <p
                            className={cn(
                              "max-w-prose text-sm leading-relaxed text-muted-foreground",
                              !isCenter && "lg:text-[13px] lg:leading-relaxed lg:text-muted-foreground/88"
                            )}
                          >
                            {card.body}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/45">
                            {card.step}
                          </p>
                          {card.visual.kind === "phone" ? (
                            <div className="flex w-full justify-center">
                              <MotionPreviewFrame
                                emphasis={isCenter ? "hero" : "standard"}
                                className="relative shrink-0"
                              >
                                <TrainingIframePair
                                  className="absolute inset-0"
                                  title={card.visual.iframeTitle}
                                  preview={card.visual.preview}
                                  shellTone="muted"
                                />
                              </MotionPreviewFrame>
                            </div>
                          ) : card.visual.kind === "progress" ? (
                            <MotionPreviewFrame
                              emphasis="ambient"
                              className={cn(
                                "marketing-loop-frame relative isolate mx-auto aspect-[430/932] shrink-0",
                                frameWidth
                              )}
                            >
                              <DocumentThemedProgressMarketingPreview
                                title={card.visual.iframeTitle}
                                className="absolute inset-0"
                                shellTone="muted"
                                {...card.visual.preview}
                              />
                            </MotionPreviewFrame>
                          ) : (
                            <MotionPreviewFrame
                              emphasis="standard"
                              className={cn(
                                "marketing-loop-frame relative isolate mx-auto aspect-[430/932] shrink-0",
                                frameWidth
                              )}
                            >
                              <DocumentThemedMasteryMarketingPreview
                                title={card.visual.iframeTitle}
                                className="absolute inset-0"
                                shellTone="muted"
                                {...card.visual.preview}
                              />
                            </MotionPreviewFrame>
                          )}
                        </div>
                      </div>
                    </MotionCard>
                  );
                })}
              </StaggerContainer>
            </div>
          </div>

          {/* Tonal descent + faint hair — bridges into Method */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-40 bg-gradient-to-b from-transparent via-background/25 to-muted/[0.085] dark:via-background/35 dark:to-muted/[0.07]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[5%] bottom-0 z-[2] mx-auto h-px max-w-[76rem] bg-gradient-to-r from-transparent via-border/30 to-transparent dark:via-white/9"
          />
        </section>

        {/* Method — denser “how it works”; mid-page focus */}
        <section
          id="method"
          className={cn(
            "relative overflow-hidden bg-gradient-to-b from-muted/[0.11] via-background to-muted/[0.05] py-12 dark:from-muted/[0.09] dark:via-background dark:to-muted/[0.04] sm:py-14 md:py-[4.5rem]",
            /** Ambient tether to training loop upward */
            "before:pointer-events-none before:absolute before:left-1/2 before:top-0 before:h-28 before:w-[min(112%,56rem)] before:-translate-x-1/2 before:bg-[radial-gradient(ellipse_100%_100%_at_50%_0%,color-mix(in_oklab,var(--muted-foreground)_3%,transparent),transparent_78%)]",
            /** Soft bleed into payoff (time compression) */
            "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-28 after:bg-gradient-to-b after:from-transparent after:to-background"
          )}
          aria-labelledby="method-heading"
        >
          <div className={containerClass}>
            <StaggeredSectionHeader
              headingId="method-heading"
              eyebrow="WOODPECKER METHOD"
              title="Built around disciplined repetition"
              body="Repeated exposure changes what recognition feels like. The work favors familiarity and steadier recall—not an endless stream of novelty."
              className="max-w-2xl sm:max-w-3xl [&_p]:max-w-2xl [&_p]:text-pretty"
            />

            <StaggerContainer as="ol" className="mx-auto mt-10 max-w-2xl list-none space-y-4 pl-0 md:hidden">
              {methodSteps.map((step, index) => (
                <MotionCard
                  as="li"
                  key={step.title}
                  hover={false}
                  staggered
                  className="flex items-start gap-3.5 rounded-xl border border-border/45 bg-background/50 px-4 py-4 dark:border-white/[0.08] dark:bg-background/35"
                >
                  <span
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/55 bg-background/70 text-[10px] font-medium tabular-nums text-muted-foreground dark:border-white/12 dark:bg-background/45"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 space-y-2">
                    <h3 className="text-sm font-medium leading-snug tracking-tight text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                </MotionCard>
              ))}
            </StaggerContainer>

            <StaggerContainer
              as="ol"
              className="relative mx-auto mt-11 hidden max-w-5xl list-none grid-cols-5 gap-x-5 gap-y-6 pl-0 md:grid lg:mt-12 lg:gap-x-6"
            >
              <div
                className="pointer-events-none absolute left-[3%] right-[3%] top-4 h-px bg-gradient-to-r from-transparent via-border/22 to-transparent opacity-80 dark:via-white/[0.055]"
                aria-hidden
              />
              {methodSteps.map((step, index) => (
                <MotionCard
                  as="li"
                  key={step.title}
                  hover={false}
                  staggered
                  className="relative z-[1] flex flex-col gap-3.5"
                >
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-background/65 text-[11px] font-medium tabular-nums text-muted-foreground dark:border-white/[0.1] dark:bg-background/40"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <h3 className="text-[13px] font-medium leading-snug tracking-tight text-foreground lg:text-sm">
                    {step.title}
                  </h3>
                  <p className="text-[13px] leading-[1.55] text-muted-foreground lg:text-sm lg:leading-relaxed">
                    {step.body}
                  </p>
                </MotionCard>
              ))}
            </StaggerContainer>
          </div>

          <FadeIn
            className="mx-auto mt-14 w-full max-w-[min(100%,56rem)] px-3.5 sm:mt-16 sm:px-5 md:mt-[4.5rem] md:px-6"
            delay={0.06}
          >
            <MotionPreviewFrame emphasis="ambient" className="block">
              <PatternResurfacingPreview />
            </MotionPreviewFrame>
          </FadeIn>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[12%] bottom-0 z-[2] mx-auto h-px max-w-[62rem] bg-gradient-to-r from-transparent via-border/26 to-transparent dark:via-white/8"
          />
        </section>

        {/* Time compression — payoff: wall-clock drops as recall compounds (illustrative) */}
        <section
          className={cn(
            "relative overflow-hidden bg-background py-12 sm:py-14 md:py-[4.75rem]",
            "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[min(8rem,18vh)] before:bg-[radial-gradient(ellipse_72%_100%_at_50%_0%,color-mix(in_oklab,var(--muted-foreground)_3%,transparent),transparent_78%)] before:opacity-75 dark:before:opacity-95"
          )}
          aria-labelledby="time-compression-heading"
        >
          <div className={containerClass}>
            <StaggeredSectionHeader
              headingId="time-compression-heading"
              eyebrow="COMPOUNDING"
              eyebrowClassName="tracking-[0.12em] text-muted-foreground/58"
              title="Faster every cycle"
              body="The roster stays fixed; what changes is how little wall-clock a full pass needs as fluency replaces slow search. That compression is the point of the loop."
              className="max-w-2xl sm:max-w-3xl [&_p]:max-w-2xl [&_p]:text-pretty"
            />

            <FadeIn className="mx-auto mt-10 max-w-4xl sm:mt-11 md:mt-12" delay={0.08}>
              <MotionPreviewFrame emphasis="ambient" className="block">
                <TimeCompressionGraphic
                  cycles={TIME_COMPRESSION_CYCLES}
                  reductionLabel={TIME_COMPRESSION_REDUCTION_LABEL}
                />
              </MotionPreviewFrame>
            </FadeIn>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[10%] bottom-0 mx-auto h-px max-w-[62rem] bg-gradient-to-r from-transparent via-border/26 to-transparent dark:via-white/8"
          />
        </section>

        {/* Continue anywhere — same cycle across desktop focus + mobile touchpoints */}
        <section
          className={cn(
            "relative overflow-hidden bg-background py-[3.875rem] sm:py-16 md:py-[5.75rem]",
            "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[min(10rem,24vh)] before:bg-[radial-gradient(ellipse_75%_100%_at_50%_0%,color-mix(in_oklab,var(--primary)_3.5%,transparent),transparent_76%)] before:opacity-45 dark:before:opacity-55"
          )}
          aria-labelledby="continue-anywhere-heading"
        >
          <div className={containerClass}>
            <StaggeredSectionHeader
              headingId="continue-anywhere-heading"
              eyebrow="CONTINUITY"
              eyebrowClassName="tracking-[0.12em] text-muted-foreground/60"
              title="Continue anywhere"
              body="When you have quiet space, settle in with the full board. When you only have a moment, reopen the same pass on your phone—the set, cycle, and position stay aligned so deliberate-practice continuity survives real life."
              className="max-w-2xl sm:max-w-3xl [&_p]:max-w-2xl [&_p]:text-pretty"
            />

            <div className="mx-auto mt-11 max-w-7xl sm:mt-12 lg:mt-14">
              <div className="space-y-10 lg:hidden">
                <FadeIn>
                  <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55">
                    Deep focus
                  </p>
                  <MotionScreenshot>
                    <div className="w-full min-w-0">
                      <MotionPreviewFrame emphasis="standard" className="block w-full">
                        <TrainingIframePair
                          className="w-full"
                          title="PatternForge — desktop workspace, same training pass (cycle 3)"
                          preview={CONTINUE_ANYWHERE_DESKTOP_PREVIEW}
                        />
                      </MotionPreviewFrame>
                    </div>
                  </MotionScreenshot>
                </FadeIn>
                <div className="relative mx-auto flex flex-col items-center pt-1">
                  <div
                    className="pointer-events-none absolute top-2 h-20 w-40 rounded-full bg-[radial-gradient(circle,rgba(124,82,255,0.12),transparent_72%)] blur-2xl"
                    aria-hidden
                  />
                  <FadeIn delay={0.08}>
                    <p className="relative z-10 mb-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55">
                      Same cycle, continued
                    </p>
                    <MotionScreenshot className="relative z-10 w-full">
                      <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-[18.5rem] justify-center sm:max-w-[19rem]">
                        <MotionPreviewFrame emphasis="standard" className="flex w-full justify-center">
                          <TrainingIframePair
                            className="w-full"
                            title="PatternForge — continue the same training pass on mobile (cycle 3)"
                            preview={CONTINUE_ANYWHERE_MOBILE_PREVIEW}
                            phoneShellClassName="max-w-full sm:max-w-[19rem]"
                            phoneAspectClassName="aspect-[430/680]"
                            smAspectHeight={680}
                            smFillContainer={false}
                            compactHeroLayout
                            preventShortEmbedFrame
                          />
                        </MotionPreviewFrame>
                      </div>
                    </MotionScreenshot>
                  </FadeIn>
                </div>
              </div>

              <div className="relative hidden pb-28 pt-2 lg:block xl:pb-[8.75rem]">
                <div
                  className="pointer-events-none absolute left-[14%] top-[6%] h-[min(420px,48%)] w-[min(92%,52rem)] rounded-full bg-[radial-gradient(ellipse_at_50%_40%,rgba(124,82,255,0.11),transparent_70%)] blur-3xl dark:bg-[radial-gradient(ellipse_at_50%_40%,rgba(124,82,255,0.14),transparent_70%)]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute right-[14%] top-[52%] z-[8] hidden h-px w-[min(26%,13rem)] -translate-y-1/2 bg-gradient-to-r from-transparent via-border/45 to-transparent opacity-90 xl:block dark:via-white/12"
                  aria-hidden
                />
                <FadeIn>
                  <MotionScreenshot>
                    <div className="relative z-10 mx-auto flex w-full justify-center px-2">
                      <MotionPreviewFrame emphasis="standard" className="w-full max-w-[min(100%,64rem)]">
                        <TrainingIframePair
                          className="w-full max-w-[min(100%,64rem)]"
                          title="PatternForge — desktop workspace, same training pass (cycle 3)"
                          preview={CONTINUE_ANYWHERE_DESKTOP_PREVIEW}
                        />
                      </MotionPreviewFrame>
                    </div>
                  </MotionScreenshot>
                </FadeIn>
                <FadeIn delay={0.1}>
                  <MotionScreenshot className="absolute bottom-0 right-[max(0.5rem,2%)] z-20 w-[min(94%,17.5rem)] origin-bottom-right scale-[0.88] xl:bottom-2 xl:right-[max(1rem,3%)] xl:scale-[0.9]">
                    <div className="overflow-hidden rounded-[1.85rem] shadow-[0_22px_48px_-14px_rgba(0,0,0,0.48)] ring-1 ring-border/40 dark:shadow-[0_26px_56px_-16px_rgba(0,0,0,0.65)] dark:ring-border/35">
                      <MotionPreviewFrame emphasis="ambient" className="block">
                        <TrainingIframePair
                          className="w-full"
                          title="PatternForge — continue the same training pass on mobile (cycle 3)"
                          preview={CONTINUE_ANYWHERE_MOBILE_PREVIEW}
                          phoneShellClassName="max-w-full lg:max-w-[17.5rem] lg:w-[17.5rem]"
                          phoneAspectClassName="aspect-[430/640]"
                          smAspectHeight={640}
                          smFillContainer={false}
                          compactHeroLayout
                          preventShortEmbedFrame
                        />
                      </MotionPreviewFrame>
                    </div>
                  </MotionScreenshot>
                </FadeIn>
              </div>
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[9.5rem] bg-gradient-to-t from-muted/[0.06] to-transparent dark:from-muted/[0.05]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[8%] bottom-0 z-[1] mx-auto h-px max-w-[76rem] bg-gradient-to-r from-transparent via-border/28 to-transparent dark:via-white/8"
          />
        </section>

        {/* Final CTA — quiet resolve; echoes hero without competing */}
        <section
          className={cn(
            containerClass,
            "relative py-14 md:py-[4.75rem]",
            "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-24 before:bg-gradient-to-b before:from-muted/[0.05] before:to-transparent dark:before:from-muted/[0.04]"
          )}
          aria-labelledby="cta-heading"
        >
          <div className="mx-auto max-w-5xl">
            <FadeIn delay={0.04}>
              <div className="relative overflow-hidden rounded-2xl border border-border/85 bg-background/80 px-6 py-10 text-center shadow-[0_1px_0_0] shadow-border/25 transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:border-border motion-safe:hover:shadow-[0_28px_60px_-28px_rgba(0,0,0,0.38)] motion-safe:hover:-translate-y-px motion-reduce:transform-none dark:border-border dark:bg-background/70 dark:shadow-black/35 dark:motion-safe:hover:shadow-[0_32px_70px_-30px_rgba(0,0,0,0.55)] sm:px-10 md:py-[2.875rem]">
              <MotionEmphasisGlow className="pointer-events-none absolute inset-x-8 top-[-32%] h-36 rounded-full bg-[radial-gradient(circle,rgba(138,93,255,0.13),rgba(125,83,255,0.06)_42%,transparent_76%)] blur-3xl" />
              <h2
                id="cta-heading"
                className="relative text-2xl font-medium tracking-tight text-foreground sm:text-3xl"
              >
                Open a cycle on a line you will revisit
              </h2>
              <p className="relative mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Pick a puzzle line, work the first pass with care, then let structured repetition weld
                the motifs into long-term recall.
              </p>
              <div className="relative mx-auto mt-8 flex w-full max-w-md flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
                <Button
                  asChild
                  size="lg"
                  className="w-full min-h-11 transition-[opacity,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-95 hover:-translate-y-px hover:shadow-[0_12px_32px_-12px_color-mix(in_oklab,var(--primary)_42%,transparent)] active:translate-y-0 motion-reduce:transform-none motion-reduce:hover:shadow-none sm:w-auto"
                >
                  <Link href={ROUTES.app}>Start training</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full min-h-11 border-border transition-[transform,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-muted/42 hover:-translate-y-px hover:shadow-[0_10px_28px_-14px_color-mix(in_oklab,var(--foreground)_14%,transparent)] active:translate-y-0 motion-reduce:transform-none motion-reduce:hover:shadow-none sm:w-auto"
                >
                  <Link href={ROUTES.sets}>Choose a puzzle line</Link>
                </Button>
              </div>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>
      <Footer />
      </div>
    </div>
  );
}
