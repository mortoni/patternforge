import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import AppTitle from "@/components/logo/AppTitle";
import Logo from "@/components/logo/Logo";
import TrainingPreview from "@/components/TrainingPreview";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  FadeIn,
  MotionCard,
  MotionScreenshot,
  StaggerContainer,
} from "@/components/shared/motion-primitives";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const containerClass = "mx-auto w-full max-w-6xl px-3.5 sm:px-5 md:px-6 lg:px-8";
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

const trainingInActionCards = [
  {
    step: "01 Solve",
    title: "Solve the position",
    body: "Stay with the board and calculate cleanly.",
    lightSrc: "/images/solve-puzzle-light.png",
    darkSrc: "/images/solve-puzzle-dark.png",
    alt: "Solve puzzle screen preview",
    mode: "center",
  },
  {
    step: "02 Review",
    title: "See the mistake",
    body: "Spot the miss and reset the pattern.",
    lightSrc: "/images/cycle-summary-light.png",
    darkSrc: "/images/cycle-summary-dark.png",
    alt: "Review mistake screen preview",
    mode: "side",
  },
  {
    step: "03 Improve",
    title: "Lock the pattern",
    body: "Repeat with less effort and less hesitation.",
    lightSrc: "/images/progress-light.png",
    darkSrc: "/images/progress-dark.png",
    alt: "Progress screen preview",
    mode: "side",
  },
] as const;

const methodSteps = [
  { title: "Choose a set", body: "Pick one fixed puzzle set." },
  { title: "Complete pass one", body: "Solve every position carefully." },
  { title: "Rest briefly", body: "Reset focus between passes." },
  { title: "Repeat the set", body: "Same positions, cleaner recall." },
  { title: "Track faster cycles", body: "Watch recognition become automatic." },
] as const;

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/80">
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
            <Link href={ROUTES.docs} className={navLinkClass}>
              Docs
            </Link>
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
              <li>
                <Link
                  href={`${ROUTES.docs}/philosophy`}
                  className={`${footerLinkClass} block py-0.5`}
                >
                  Philosophy (docs)
                </Link>
              </li>
              <li>
                <Link
                  href={`${ROUTES.docs}/woodpecker-method`}
                  className={`${footerLinkClass} block py-0.5`}
                >
                  Method (docs)
                </Link>
              </li>
              <li>
                <Link href={ROUTES.docs} className={`${footerLinkClass} block py-0.5`}>
                  Docs
                </Link>
              </li>
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
}: {
  eyebrow?: string;
  title: string;
  body: string;
  headingId?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground/90">
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
    <>
      <Image
        src={lightSrc}
        alt={`${alt} (light mode)`}
        width={width}
        height={height}
        className={cn("h-auto w-full object-cover dark:hidden", className)}
        sizes={sizes}
      />
      <Image
        src={darkSrc}
        alt={`${alt} (dark mode)`}
        width={width}
        height={height}
        className={cn("hidden h-auto w-full object-cover dark:block", className)}
        sizes={sizes}
      />
    </>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <Header />
      <main>
        {/* Hero */}
        <section className="border-b border-border" aria-labelledby="hero-heading">
          <div className={`${containerClass} py-16 md:py-24`}>
            <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_minmax(470px,1fr)] lg:items-center lg:gap-14">
              <FadeIn className="text-center lg:text-left">
                <h1
                  id="hero-heading"
                  className="text-balance text-[1.625rem] font-light leading-[1.16] tracking-tight text-foreground min-[400px]:text-4xl sm:text-5xl lg:text-[3.65rem]"
                >
                  Train patterns, not just puzzles.
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base md:text-lg lg:mx-0">
                  Build tactical recognition through repeated cycles, mistake review, and
                  focused puzzle sets.
                </p>
                <p className="mx-auto mt-3 max-w-xl text-sm italic leading-relaxed text-muted-foreground/85 lg:mx-0">
                  The goal is not to solve puzzles. The goal is to stop needing to think.
                </p>
                <div className="mx-auto mt-8 flex w-full max-w-md flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:mx-0">
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
                className="relative mx-auto flex w-full max-w-lg items-center justify-center lg:max-w-none"
                delay={0.08}
              >
                <div
                  className="pointer-events-none absolute inset-x-[10%] top-[8%] h-[72%] rounded-full bg-[radial-gradient(circle,rgba(140,92,255,0.24)_0%,rgba(120,75,255,0.08)_45%,transparent_75%)] blur-3xl"
                  aria-hidden
                />
                <TrainingPreview
                  theme="light"
                  className="relative z-10 max-w-[410px] sm:max-w-[455px] lg:max-w-[500px] dark:hidden"
                />
                <TrainingPreview
                  theme="dark"
                  className="relative z-10 hidden max-w-[410px] sm:max-w-[455px] lg:max-w-[500px] dark:block"
                />
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Training in action */}
        <section
          id="philosophy"
          className={`${containerClass} py-16 md:py-24`}
          aria-labelledby="training-in-action-heading"
        >
          <div id="training-in-action" />
          <FadeIn>
            <SectionHeader
              headingId="training-in-action-heading"
              eyebrow="Training flow"
              title="Training in action"
              body="A focused loop where solving is primary and each step supports better recognition."
            />
          </FadeIn>
          <div className="relative mx-auto mt-12 max-w-6xl">
            <StaggerContainer as="ul" className="grid gap-6 lg:grid-cols-3 lg:items-end">
              {trainingInActionCards.map((card) => {
                const isCenter = card.mode === "center";
                return (
                  <MotionCard
                    as="li"
                    key={card.title}
                    y={isCenter ? 20 : 16}
                    duration={isCenter ? 0.5 : 0.42}
                    staggered
                    className={cn(
                      "space-y-3",
                      card.mode === "center" && "order-1",
                      card.step === "02 Review" && "order-2",
                      card.step === "03 Improve" && "order-3",
                      isCenter
                        ? "lg:order-2 lg:z-10 lg:scale-110"
                        : "lg:scale-95 lg:opacity-80",
                      card.step === "02 Review" && "lg:order-1 lg:-rotate-2",
                      card.step === "03 Improve" && "lg:order-3",
                      card.step === "03 Improve" && "lg:rotate-2"
                    )}
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {card.step}
                    </p>
                    <ScreenshotFrame className="overflow-hidden rounded-[1.3rem]">
                      <ThemedScreenshot
                        lightSrc={card.lightSrc}
                        darkSrc={card.darkSrc}
                        alt={card.alt}
                        width={390}
                        height={844}
                        className="h-auto object-contain"
                        sizes={
                          isCenter
                            ? "(min-width: 1024px) 36vw, 92vw"
                            : "(min-width: 1024px) 25vw, 88vw"
                        }
                      />
                    </ScreenshotFrame>
                    <div className="space-y-1">
                      <h3 className="text-base font-medium text-foreground">{card.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                    </div>
                  </MotionCard>
                );
              })}
            </StaggerContainer>
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
                    <ScreenshotFrame>
                      <ThemedScreenshot
                        lightSrc="/images/solve-puzzle-desktop-light.png"
                        darkSrc="/images/solve-puzzle-desktop-dark.png"
                        alt="Desktop training view"
                        width={1365}
                        height={768}
                        sizes="96vw"
                      />
                    </ScreenshotFrame>
                  </MotionScreenshot>
                </FadeIn>
                <div className="relative mx-auto flex justify-center pt-1">
                  <div
                    className="pointer-events-none absolute top-2 h-20 w-40 rounded-full bg-[radial-gradient(circle,rgba(124,82,255,0.18),transparent_70%)] blur-2xl"
                    aria-hidden
                  />
                  <FadeIn delay={0.08}>
                    <MotionScreenshot className="relative z-10">
                      <ScreenshotFrame className="max-w-56 shadow-2xl">
                        <ThemedScreenshot
                          lightSrc="/images/solve-puzzle-light.png"
                          darkSrc="/images/solve-puzzle-dark.png"
                          alt="Mobile training view"
                          width={390}
                          height={844}
                          sizes="64vw"
                        />
                      </ScreenshotFrame>
                    </MotionScreenshot>
                  </FadeIn>
                </div>
              </div>

              <div className="relative hidden lg:block lg:pt-4">
                <div
                  className="pointer-events-none absolute right-[10%] top-[8%] h-40 w-44 rounded-full bg-[radial-gradient(circle,rgba(124,82,255,0.2),transparent_70%)] blur-3xl"
                  aria-hidden
                />
                <FadeIn>
                  <MotionScreenshot>
                    <ScreenshotFrame className="w-[78%]">
                      <ThemedScreenshot
                        lightSrc="/images/solve-puzzle-desktop-light.png"
                        darkSrc="/images/solve-puzzle-desktop-dark.png"
                        alt="Desktop training view"
                        width={1365}
                        height={768}
                        sizes="(min-width: 1280px) 68vw, 64vw"
                      />
                    </ScreenshotFrame>
                  </MotionScreenshot>
                </FadeIn>
                <FadeIn delay={0.08} className="absolute right-[2%] top-[10%] z-10 w-[20%]">
                  <MotionScreenshot>
                    <ScreenshotFrame className="shadow-2xl">
                      <ThemedScreenshot
                        lightSrc="/images/solve-puzzle-light.png"
                        darkSrc="/images/solve-puzzle-dark.png"
                        alt="Mobile training view"
                        width={390}
                        height={844}
                        sizes="(min-width: 1280px) 18vw, 24vw"
                      />
                    </ScreenshotFrame>
                  </MotionScreenshot>
                </FadeIn>
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
  );
}
