import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import AppTitle from "@/components/logo/AppTitle";
import Logo from "@/components/logo/Logo";
import {
  DocumentThemedTrainingPreview,
  LG_PREVIEW_FRAME_STYLE,
} from "@/components/shared/training-preview";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  FadeIn,
  MotionCard,
  MotionScreenshot,
  StaggerContainer,
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

/** Training loop — track: active cycle feels lived-in (sessions, streak of work). */
const MARKETING_LOOP_PROGRESS_PREVIEW = {
  trainingSetName: "Woodpecker Intermediate",
  cycleNumber: 3,
  nextExerciseIndex: 142,
  totalExercises: 762,
  exercisesRemaining: 620,
  sessionCountThisCycle: 4,
  lastSessionDurationMs: 12 * 60 * 1000,
  recentSessions: [
    { dayLabel: "Today", exercisesDone: 24, durationMs: 12 * 60 * 1000 },
    { dayLabel: "Yesterday", exercisesDone: 31, durationMs: 15 * 60 * 1000 },
    { dayLabel: "12 May", exercisesDone: 18, durationMs: 9 * 60 * 1000 },
  ],
} satisfies ProgressMarketingPreviewProps;

/** Training loop — mastery: three completed cycles, descending time (insight derived below). */
const MARKETING_LOOP_MASTERY_CYCLES = [
  { cycleNumber: 1, totalTimeMs: 61 * 60 * 1000 + 45_000 },
  { cycleNumber: 2, totalTimeMs: 52 * 60 * 1000 },
  { cycleNumber: 3, totalTimeMs: 41 * 60 * 1000 + 12_000 },
] as const satisfies ReadonlyArray<MasteryMarketingPreviewProps["cycles"][number]>;

const LOOP_MASTERY_INSIGHT = `${Math.round(
  (1 - MARKETING_LOOP_MASTERY_CYCLES[2].totalTimeMs / MARKETING_LOOP_MASTERY_CYCLES[0].totalTimeMs) *
    100
)}% faster than first cycle`;

/** ~26% shorter than 932 — compact workspace silhouette (not ultra-tall phone). */
const MARKETING_HERO_SM_HEIGHT = 686;

/** Matches {@link MARKETING_HERO_SM_HEIGHT} for outer reserve box. */
const HERO_PHONE_ASPECT_CLASS = "aspect-[430/686]";

/** Anchors width; shorter frame reads as tactical workspace vs tall mock phone. */
const HERO_PHONE_SHELL_CLASS =
  "max-w-[min(100%,20.875rem)] w-full sm:max-w-[21.5rem] md:max-w-[22.25rem] lg:max-w-none lg:w-[22.75rem] xl:w-[24.75rem] 2xl:w-[26rem]";

/** Hero + “Training in action” phone — same puzzle/FEN and shell sizing */
const MARKETING_HERO_PHONE_PREVIEW = {
  screen: "sm" as const,
  puzzle: 10,
  total: 222,
  cycle: 1,
  setName: "Woodpecker Day",
  boardStyle: "blueprint",
} satisfies Omit<PreviewTrainingParams, "appearance">;

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
    body: "Pause and resume across multiple sessions without losing the thread.",
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
    body: "Work through tactical exercises with the board as the main focus.",
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
    body: "Review completed cycles and compare solving time across repetitions.",
    mode: "side",
    visual: {
      kind: "mastery",
      iframeTitle: "Training loop — mastery preview",
      preview: {
        trainingSetName: "Woodpecker Intermediate",
        cycles: [...MARKETING_LOOP_MASTERY_CYCLES],
        insightLine: LOOP_MASTERY_INSIGHT,
      },
    },
  },
];

const builtForScreensDesktopPreview = {
  screen: "lg" as const,
  puzzle: 2,
  total: 762,
  cycle: 1,
  setName: "Woodpecker Intermediate",
  boardStyle: "blueprint",
} satisfies Omit<PreviewTrainingParams, "appearance">;

const builtForScreensMobilePreview = {
  screen: "sm" as const,
  puzzle: 2,
  total: 762,
  cycle: 1,
  setName: "Woodpecker Intermediate",
  boardStyle: "blueprint",
} satisfies Omit<PreviewTrainingParams, "appearance">;

const methodSteps = [
  { title: "Choose a set", body: "Pick one fixed puzzle set." },
  { title: "Complete pass one", body: "Solve every position carefully." },
  { title: "Rest briefly", body: "Reset focus between passes." },
  { title: "Repeat the set", body: "Same positions, cleaner recall." },
  { title: "Track faster cycles", body: "Watch recognition become automatic." },
] as const;

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
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-border bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/80">
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
            className="h-10 min-w-22 shrink-0 px-4 transition-[transform,opacity] hover:opacity-95"
          >
            <Link href={ROUTES.app}>Open app</Link>
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
                  Open app
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
              Inspired by The Woodpecker Method
            </p>
          </div>
        </div>
      </div>

      <div className="w-full border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-3.5 py-6 text-sm text-neutral-500 sm:px-5 md:flex-row md:items-center md:justify-between md:px-6 dark:text-neutral-400">
          <p>© 2026 PatternForge</p>
          <p className="max-w-md leading-relaxed md:max-w-none md:text-right">
            Chess improvement through disciplined repetition.
          </p>
        </div>
      </div>
    </footer>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body,
  headingId,
  className,
  eyebrowClassName,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  headingId?: string;
  className?: string;
  eyebrowClassName?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      {eyebrow ? (
        <p
          className={cn(
            "text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground/90",
            eyebrowClassName
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={headingId}
        className="mt-3 text-balance text-2xl font-medium tracking-tight text-foreground sm:text-3xl"
      >
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
        {body}
      </p>
    </div>
  );
}

function ScreenshotFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-black/10 bg-black/2 shadow-xl transition duration-300 ease-out hover:border-black/20 hover:shadow-2xl dark:border-white/10 dark:bg-white/3 dark:hover:border-white/20",
        className
      )}
    >
      {children}
    </div>
  );
}

function ThemedScreenshot({
  lightSrc,
  darkSrc,
  alt,
  width,
  height,
  sizes,
  className,
}: {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  className?: string;
}) {
  return (
    <div
      className="relative w-full max-w-full overflow-hidden bg-muted/5"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <Image
        src={lightSrc}
        alt={`${alt} (light mode)`}
        fill
        sizes={sizes}
        className={cn("object-cover dark:hidden", className)}
      />
      <Image
        src={darkSrc}
        alt={`${alt} (dark mode)`}
        fill
        sizes={sizes}
        className={cn("hidden object-cover dark:block", className)}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Header />
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden">
        <main className="flex-1">
        {/* Hero — immersive asymmetric anchor around live training preview */}
        <section
          className="relative overflow-x-clip border-b border-border/60 dark:border-white/[0.06]"
          aria-labelledby="hero-heading"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-8%] top-[14%] h-[46%] w-[58%] max-w-3xl bg-[radial-gradient(ellipse_52%_48%_at_38%_42%,color-mix(in_oklab,var(--muted-foreground)_5%,transparent),transparent_72%)] opacity-40 dark:bg-[radial-gradient(ellipse_52%_48%_at_38%_42%,color-mix(in_oklab,var(--primary)_4%,transparent),transparent_74%)] dark:opacity-55" />
            <div className="absolute right-[-6%] top-[18%] h-[48%] w-[52%] max-w-3xl bg-[radial-gradient(circle_at_56%_42%,rgba(132,104,232,0.065),rgba(132,104,232,0.022)_46%,transparent_74%)] opacity-65 blur-[28px] dark:bg-[radial-gradient(circle_at_56%_42%,rgba(132,104,232,0.1),rgba(132,104,232,0.032)_46%,transparent_74%)] md:right-0" />
          </div>
          {/* Bridges into next section */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[min(13rem,28vh)] bg-gradient-to-b from-transparent via-background/35 to-background dark:via-background/55"
          />

          <div
            className={`${heroContainerClass} relative z-[1] py-11 sm:py-14 md:py-16 lg:min-h-[min(76vh,46rem)] lg:py-[clamp(4rem,7vw,5.75rem)] xl:pb-20 xl:pt-[4.375rem]`}
          >
            <div
              className={cn(
                "mx-auto grid w-full min-w-0 gap-9 sm:gap-11 lg:grid-cols-12 lg:items-center lg:gap-x-6 lg:gap-y-10",
                "xl:gap-x-10 xl:gap-y-8"
              )}
            >
              <FadeIn className="min-w-0 justify-self-center text-center max-w-xl sm:max-w-2xl lg:col-span-5 lg:max-w-[min(100%,31rem)] lg:justify-self-start lg:self-center lg:text-left xl:col-span-5">
                <h1
                  id="hero-heading"
                  className="text-balance text-[1.625rem] font-light leading-[1.14] tracking-tight text-foreground min-[400px]:text-4xl sm:text-5xl lg:text-[clamp(2.65rem,3.5vw,3.85rem)] xl:text-[clamp(3.1rem,3.4vw,4.2rem)]"
                >
                  Train patterns, not just puzzles.
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base md:text-lg lg:mx-0 lg:mt-3.5 lg:max-w-[28rem] lg:text-[1.0625rem] lg:leading-[1.55]">
                  Build tactical recognition through repeated cycles, mistake review, and
                  focused puzzle sets.
                </p>
                <p className="mx-auto mt-2.5 max-w-xl text-sm italic leading-relaxed text-muted-foreground/85 sm:mt-3 lg:mx-0 lg:max-w-[28rem] lg:text-[0.9375rem] lg:leading-relaxed">
                  The goal is not to solve puzzles. The goal is to stop needing to think.
                </p>
                <div className="mx-auto mt-6 flex w-full max-w-md flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:justify-center sm:gap-3 lg:mx-0 lg:mt-7 lg:justify-start">
                  <Button
                    asChild
                    size="lg"
                    className="w-full min-h-11 transition-[transform,opacity] duration-200 hover:opacity-95 sm:w-auto"
                  >
                    <Link href={ROUTES.app}>Open app</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full min-h-11 border-border transition-[transform,background-color] duration-200 hover:bg-muted/40 sm:w-auto"
                  >
                    <Link href="#training-in-action">How it works</Link>
                  </Button>
                </div>
              </FadeIn>

              <FadeIn
                className="relative flex w-full min-w-0 max-w-full justify-center justify-self-center lg:col-span-7 lg:-mr-1 lg:justify-end lg:justify-self-end lg:pl-5 xl:-mr-2 xl:pl-6"
                delay={0.08}
              >
                <div
                  className="pointer-events-none absolute left-1/2 top-[6%] flex w-[104%] max-w-[26rem] -translate-x-1/2 justify-center sm:w-[102%] sm:max-w-[27rem] lg:left-[53%] lg:top-[12%] lg:w-[95%] lg:max-w-[30rem] lg:translate-x-[-50%]"
                  aria-hidden
                >
                  <div className="aspect-[430/686] w-full rounded-full bg-[radial-gradient(circle,rgba(140,92,255,0.14)_0%,rgba(120,75,255,0.046)_42%,transparent_76%)] blur-[30px] dark:bg-[radial-gradient(circle,rgba(160,120,255,0.18)_0%,rgba(120,75,255,0.055)_42%,transparent_76%)]" />
                </div>
                <div
                  className="pointer-events-none absolute left-1/2 top-[24%] w-[88%] max-w-[20rem] -translate-x-1/2 lg:left-[52%] lg:top-[30%] lg:w-[82%] lg:max-w-[24rem] lg:-translate-x-1/2"
                  aria-hidden
                >
                  <div className="h-28 w-full rounded-full bg-[radial-gradient(ellipse_80%_52%_at_50%_40%,color-mix(in_oklab,var(--foreground)_4.5%,transparent),transparent_80%)] opacity-32 blur-xl dark:opacity-28" />
                </div>

                <div className="relative z-10 origin-center max-md:scale-100 lg:origin-right lg:scale-[1.008] xl:scale-[1.015]">
                  <div className="translate-x-0 sm:translate-x-0.5 lg:translate-x-1 xl:translate-x-2">
                    <TrainingIframePair
                      className="absolute inset-0"
                      title="Pattern Forge training preview"
                      preview={MARKETING_HERO_PHONE_PREVIEW}
                      phoneAspectClassName={HERO_PHONE_ASPECT_CLASS}
                      phoneShellClassName={HERO_PHONE_SHELL_CLASS}
                      smAspectHeight={MARKETING_HERO_SM_HEIGHT}
                      smFillContainer
                      compactHeroLayout
                      preventShortEmbedFrame
                    />
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Training loop — long-horizon ritual (Track → Solve → Master) */}
        <section
          id="philosophy"
          className="relative w-full scroll-mt-4 border-t border-border/30 bg-gradient-to-b from-muted/[0.09] via-background to-background px-3.5 pb-20 pt-14 dark:border-white/[0.04] dark:from-muted/[0.06] sm:px-5 sm:pb-20 md:px-6 md:pb-28 md:pt-16 lg:px-10"
          aria-labelledby="training-in-action-heading"
        >
          <div id="training-in-action" />
          <div
            className="pointer-events-none absolute left-1/2 top-[42%] hidden h-[min(420px,48vh)] w-[min(960px,96vw)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_50%_38%_at_50%_42%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_70%)] opacity-90 dark:opacity-100 lg:block"
            aria-hidden
          />
          <div className="relative z-[1] mx-auto max-w-[min(100%,88rem)]">
            <FadeIn>
              <SectionHeader
                headingId="training-in-action-heading"
                eyebrow="TRAINING LOOP"
                eyebrowClassName="tracking-[0.11em] text-muted-foreground/55"
                title="Train. Repeat. Recognize faster."
                body="PatternForge is built around cycles that can span days or weeks. Train in short sessions, resume later, and watch recognition become faster through repetition."
              />
            </FadeIn>

            <div className="relative mx-auto mt-14 max-w-[min(100%,86rem)] sm:mt-16 lg:mt-20">
              <StaggerContainer
                as="ul"
                className="relative z-10 grid grid-cols-1 gap-12 sm:gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)_minmax(0,0.95fr)] lg:items-start lg:gap-x-6 lg:gap-y-4 xl:gap-x-12"
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
                        "flex flex-col",
                        card.role === "track" &&
                          "lg:-rotate-[2deg] lg:scale-[0.91] lg:opacity-[0.78] lg:transition-[opacity,transform] lg:duration-500 lg:ease-out lg:hover:opacity-[0.86]",
                        card.role === "solve" &&
                          "lg:z-30 lg:translate-y-9 lg:scale-[1.07] lg:opacity-100 lg:transition-[opacity,transform] lg:duration-500 lg:ease-out",
                        card.role === "master" &&
                          "lg:rotate-[2deg] lg:scale-[0.91] lg:opacity-[0.78] lg:transition-[opacity,transform] lg:duration-500 lg:ease-out lg:hover:opacity-[0.86]"
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
                            <TrainingIframePair
                              className="absolute inset-0"
                              title={card.visual.iframeTitle}
                              preview={card.visual.preview}
                            />
                          ) : card.visual.kind === "progress" ? (
                            <div
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
                            </div>
                          ) : (
                            <div
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
                            </div>
                          )}
                        </div>
                      </div>
                    </MotionCard>
                  );
                })}
              </StaggerContainer>
            </div>
          </div>
        </section>

        {/* Method */}
        <section
          id="method"
          className="border-y border-border bg-muted/20 py-16 md:py-24"
          aria-labelledby="method-heading"
        >
          <div className={containerClass}>
            <FadeIn>
              <SectionHeader
                headingId="method-heading"
                eyebrow="Method"
                title="Built around the Woodpecker Method"
                body="Same puzzles. Less time. Zero hesitation."
              />
            </FadeIn>

            <StaggerContainer as="ol" className="mx-auto mt-10 max-w-2xl space-y-3 md:hidden">
              {methodSteps.map((step, index) => (
                <MotionCard
                  as="li"
                  key={step.title}
                  hover={false}
                  staggered
                  className="flex items-start gap-3 rounded-lg border border-border bg-background/65 p-3.5"
                >
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium text-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </MotionCard>
              ))}
            </StaggerContainer>

            <StaggerContainer
              as="ol"
              className="relative mx-auto mt-12 hidden max-w-5xl grid-cols-5 gap-4 md:grid"
            >
              <div className="absolute left-0 right-0 top-5 h-px bg-border" aria-hidden />
              {methodSteps.map((step, index) => (
                <MotionCard
                  as="li"
                  key={step.title}
                  hover={false}
                  staggered
                  className="relative space-y-2.5"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-sm font-medium text-foreground">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-medium text-foreground">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </MotionCard>
              ))}
            </StaggerContainer>

            <FadeIn className="mx-auto mt-14 max-w-4xl md:mt-16">
              <MotionScreenshot>
                <div className="relative rounded-2xl border border-black/10 bg-black/2 p-4 shadow-[0_28px_70px_-24px_rgba(0,0,0,0.75)] dark:border-white/10 dark:bg-white/2">
                <div
                  className="pointer-events-none absolute inset-x-[15%] top-2 h-28 rounded-full bg-[radial-gradient(circle,rgba(129,88,255,0.22),transparent_72%)] blur-3xl"
                  aria-hidden
                />
                <ScreenshotFrame className="rounded-xl border-black/8 shadow-none dark:border-white/10">
                  <ThemedScreenshot
                    lightSrc="/images/session-summary-light.png"
                    darkSrc="/images/session-summary-dark.png"
                    alt="Cycle summary spotlight screen preview"
                    width={1024}
                    height={692}
                    sizes="(min-width: 1024px) 68vw, 96vw"
                  />
                </ScreenshotFrame>
                <div className="relative mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3 sm:gap-3">
                  <p className="rounded-lg border border-border/70 bg-background/65 px-3 py-2 text-center">
                    Cycle 1: 37s
                  </p>
                  <p className="rounded-lg border border-border/70 bg-background/65 px-3 py-2 text-center">
                    Cycle 2: 18s
                  </p>
                  <p className="rounded-lg border border-border/70 bg-background/65 px-3 py-2 text-center">
                    Cycle 3: 6s
                  </p>
                </div>
                <p className="px-3 pb-1 pt-3 text-sm text-muted-foreground">
                  Each pass records time, completed exercises, and rhythm.
                </p>
                </div>
              </MotionScreenshot>
            </FadeIn>
          </div>
        </section>

        {/* Built for screens */}
        <section
          className="border-y border-border bg-muted/15 py-16 md:py-24"
          aria-labelledby="screens-heading"
        >
          <div className={containerClass}>
            <FadeIn>
              <SectionHeader
                headingId="screens-heading"
                eyebrow="Responsive by design"
                title="Built for every screen"
                body="Start on desktop. Keep the rhythm on mobile."
              />
            </FadeIn>

            <div className="mx-auto mt-14 max-w-6xl">
              <div className="space-y-5 lg:hidden">
                <FadeIn>
                  <MotionScreenshot>
                    <div className="w-full min-w-0">
                      <TrainingIframePair
                        className="w-full"
                        title="Training preview — desktop layout"
                        preview={builtForScreensDesktopPreview}
                      />
                    </div>
                  </MotionScreenshot>
                </FadeIn>
                <div className="relative mx-auto flex justify-center pt-1">
                  <div
                    className="pointer-events-none absolute top-2 h-20 w-40 rounded-full bg-[radial-gradient(circle,rgba(124,82,255,0.18),transparent_70%)] blur-2xl"
                    aria-hidden
                  />
                  <FadeIn delay={0.08}>
                    <MotionScreenshot className="relative z-10">
                      <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-[min(100%,20rem)] justify-center">
                        <TrainingIframePair
                          className="w-full"
                          title="Training preview — mobile layout"
                          preview={builtForScreensMobilePreview}
                        />
                      </div>
                    </MotionScreenshot>
                  </FadeIn>
                </div>
              </div>

              <div className="relative hidden lg:block lg:pt-4">
                <div
                  className="pointer-events-none absolute left-1/2 top-[12%] h-48 w-[min(90%,48rem)] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,82,255,0.2),transparent_70%)] blur-3xl"
                  aria-hidden
                />
                <div className="relative z-10 mx-auto flex w-full flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-12 xl:gap-14">
                  <FadeIn className="min-w-0 w-full flex-1 lg:max-w-[min(100%,54rem)]">
                    <MotionScreenshot>
                      <div className="w-full min-w-0">
                        <TrainingIframePair
                          className="w-full"
                          title="Training preview — desktop layout"
                          preview={builtForScreensDesktopPreview}
                        />
                      </div>
                    </MotionScreenshot>
                  </FadeIn>
                  <FadeIn
                    delay={0.08}
                    className="flex w-full max-w-[min(100%,20rem)] shrink-0 justify-center"
                  >
                    <MotionScreenshot className="w-full">
                      <TrainingIframePair
                        className="w-full"
                        title="Training preview — mobile layout"
                        preview={builtForScreensMobilePreview}
                      />
                    </MotionScreenshot>
                  </FadeIn>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={`${containerClass} py-16 md:py-24`} aria-labelledby="cta-heading">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <div className="relative overflow-hidden rounded-2xl border border-border bg-background/75 px-6 py-10 text-center sm:px-10 md:py-12">
              <div
                className="pointer-events-none absolute inset-x-8 top-[-35%] h-40 rounded-full bg-[radial-gradient(circle,rgba(138,93,255,0.2),rgba(125,83,255,0.08)_45%,transparent_75%)] blur-3xl"
                aria-hidden
              />
              <h2
                id="cta-heading"
                className="relative text-2xl font-medium tracking-tight text-foreground sm:text-3xl"
              >
                Start your first cycle and feel the difference in one session
              </h2>
              <p className="relative mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Choose a set, solve with focus, and let repetition turn calculation into
                recognition.
              </p>
              <div className="relative mx-auto mt-8 flex w-full max-w-md flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
                <Button
                  asChild
                  size="lg"
                  className="w-full min-h-11 transition-[transform,opacity] duration-200 hover:opacity-95 sm:w-auto"
                >
                  <Link href={ROUTES.app}>Open app</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full min-h-11 border-border transition-[transform,background-color] duration-200 hover:bg-muted/40 sm:w-auto"
                >
                  <Link href={ROUTES.sets}>Explore training sets</Link>
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
