import Link from "next/link";
import AppTitle from "@/components/logo/AppTitle";
import Logo from "@/components/logo/Logo";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

const containerClass =
  "mx-auto w-full max-w-6xl px-3.5 sm:px-5 md:px-6 lg:px-8";

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

const philosophyCards = [
  {
    title: "Deliberate repetition",
    body: "Solve the same ideas across cycles to turn calculation support into pattern memory.",
  },
  {
    title: "Speed with accuracy",
    body: "Train to recognise critical motifs faster without reducing chess to guesswork.",
  },
  {
    title: "Built for real play",
    body: "The purpose is practical board vision under pressure, not just a high puzzle streak.",
  },
] as const;

const methodSteps = [
  {
    title: "Choose a set",
    body: "Start with a curated training set sized to your level and available time.",
  },
  {
    title: "Complete Cycle 1",
    body: "Solve the full set carefully over your initial training window.",
  },
  {
    title: "Rest briefly",
    body: "Step away, reset, and prepare for the next pass.",
  },
  {
    title: "Repeat faster",
    body: "Solve the same set again, aiming to reduce the total time while maintaining quality.",
  },
  {
    title: "Build automaticity",
    body: "Over repeated cycles, patterns surface faster and with less mental friction.",
  },
] as const;

const productCards = [
  {
    title: "Cycles",
    body: "Organise training around repeated passes through a fixed set.",
  },
  {
    title: "Sets",
    body: "Build or choose collections that match your current strength.",
  },
  {
    title: "Mistake review",
    body: "Revisit failed positions and convert misses into patterns.",
  },
  {
    title: "Progress",
    body: "Track speed, consistency, and training rhythm over time.",
  },
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
        <div className="flex shrink-0 items-center gap-3 md:gap-6">
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
          <Button
            asChild
            size="sm"
            className="h-10 min-w-[5.5rem] shrink-0 px-4 transition-[transform,opacity] hover:opacity-95"
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
                <Link href={`${ROUTES.docs}/philosophy`} className={`${footerLinkClass} block py-0.5`}>
                  Philosophy (docs)
                </Link>
              </li>
              <li>
                <Link href={`${ROUTES.docs}/woodpecker-method`} className={`${footerLinkClass} block py-0.5`}>
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

export default function HomePage() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <Header />
      <main>
        {/* Hero */}
        <section
          className={`${containerClass} border-b border-border py-12 md:py-28 lg:py-32`}
          aria-labelledby="hero-heading"
        >
          <div className="mx-auto max-w-3xl text-center">
            <h1
              id="hero-heading"
              className="text-balance text-[1.625rem] font-light leading-[1.18] tracking-tight text-foreground min-[400px]:text-4xl sm:text-5xl md:text-6xl"
            >
              Train patterns, not just puzzles.
            </h1>
            <p className="mx-auto mt-5 max-w-[34rem] text-pretty text-[15px] leading-relaxed text-muted-foreground sm:mt-7 sm:text-base md:mt-8 md:max-w-2xl md:text-lg">
              PatternForge helps chess players build fast, reliable pattern
              recognition through disciplined repetition inspired by the
              Woodpecker Method.
            </p>
            <div className="mx-auto mt-8 flex w-full max-w-md flex-col items-stretch justify-center gap-3 md:mt-10 md:max-w-none md:flex-row md:items-center md:justify-center">
              <Button
                asChild
                size="lg"
                className="w-full min-h-11 transition-[transform,opacity] duration-200 hover:opacity-95 md:w-auto md:min-h-10"
              >
                <Link href={ROUTES.app}>Open app</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full min-h-11 border-border transition-[transform,background-color] duration-200 hover:bg-muted/40 md:w-auto md:min-h-10"
              >
                <Link href="#method">Learn the method</Link>
              </Button>
            </div>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground md:mt-8">
              Built for deliberate tactical training, not endless random puzzle
              grinding.
            </p>
          </div>
        </section>

        {/* Philosophy */}
        <section
          id="philosophy"
          className={`${containerClass} scroll-mt-20 py-14 md:scroll-mt-24 md:py-28`}
          aria-labelledby="philosophy-heading"
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="philosophy-heading"
              className="text-xl font-medium tracking-tight text-foreground sm:text-2xl md:text-3xl"
            >
              A different philosophy of chess training
            </h2>
            <p className="mt-5 text-left text-[15px] leading-relaxed text-muted-foreground sm:mt-7 sm:text-base md:mt-8 md:text-center">
              Most tactical training is consumed like entertainment: solve a
              puzzle, move on, forget the pattern. PatternForge takes a
              different approach. Improvement comes from returning to the same
              ideas until recognition becomes faster, clearer, and more
              automatic. The goal is not to collect solved positions. The goal
              is to change what you see over the board.
            </p>
          </div>
          <ul className="mx-auto mt-10 grid max-w-5xl gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 md:mt-16 lg:grid-cols-3">
            {philosophyCards.map((card) => (
              <li
                key={card.title}
                className="rounded-lg border border-border bg-background p-5 transition-[border-color,box-shadow] hover:border-foreground/12 hover:shadow-sm sm:p-6"
              >
                <h3 className="text-sm font-medium text-foreground">
                  {card.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:mt-3">
                  {card.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Method */}
        <section
          id="method"
          className="border-y border-border bg-muted/25 py-14 md:py-28"
          aria-labelledby="method-heading"
        >
          <div className={containerClass}>
            <div className="mx-auto max-w-3xl text-center">
              <h2
                id="method-heading"
                className="text-xl font-medium tracking-tight text-foreground sm:text-2xl md:text-3xl"
              >
                Inspired by the Woodpecker Method
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground sm:mt-7 sm:text-base md:mt-8">
                PatternForge draws on the training philosophy of solving a fixed
                set of exercises repeatedly, reducing total time each cycle,
                until motifs become increasingly automatic.
              </p>
            </div>
            <ol className="mx-auto mt-10 grid max-w-md grid-cols-1 gap-9 sm:mt-14 sm:max-w-6xl sm:gap-10 md:mt-16 md:grid-cols-5 md:gap-6">
              {methodSteps.map((step, index) => (
                <li
                  key={step.title}
                  className="relative mx-auto w-full max-w-sm text-center md:mx-0 md:max-w-none md:px-1"
                >
                  <div className="mb-3 flex justify-center md:mb-4">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-sm font-medium tabular-nums text-foreground"
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
            <blockquote className="mx-auto mt-10 max-w-2xl border-l-2 border-foreground/20 py-1 pl-5 text-left sm:mt-14 sm:pl-6 md:mt-16">
              <p className="text-base font-light italic leading-snug text-foreground sm:text-lg md:text-xl">
                The point is not novelty. The point is recognition.
              </p>
            </blockquote>
          </div>
        </section>

        {/* Product */}
        <section
          className={`${containerClass} py-14 md:py-28`}
          aria-labelledby="product-heading"
        >
          <h2
            id="product-heading"
            className="text-center text-xl font-medium tracking-tight text-foreground sm:text-2xl md:text-3xl"
          >
            Designed for structured tactical work
          </h2>
          <ul className="mx-auto mt-10 grid max-w-5xl gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 md:mt-16">
            {productCards.map((card) => (
              <li
                key={card.title}
                className="rounded-lg border border-border p-5 transition-[border-color,box-shadow] hover:border-foreground/12 hover:shadow-sm sm:p-6"
              >
                <h3 className="text-sm font-medium text-foreground">
                  {card.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:mt-3">
                  {card.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Docs */}
        <section
          className={`${containerClass} border-t border-border py-14 md:py-28`}
          aria-labelledby="docs-heading"
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="docs-heading"
              className="text-xl font-medium tracking-tight text-foreground sm:text-2xl md:text-3xl"
            >
              Understand the system
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:mt-7 sm:text-base md:mt-8">
              PatternForge is built around a structured training system inspired
              by the Woodpecker Method. Explore the philosophy, lifecycle, and
              architecture behind it.
            </p>
          </div>
          <ul className="mx-auto mt-10 grid max-w-2xl gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 md:mt-16">
            <li>
              <Link
                href={`${ROUTES.docs}/philosophy`}
                className="block rounded-lg border border-border bg-background p-5 text-left transition-[border-color,box-shadow] hover:border-foreground/12 hover:shadow-sm sm:p-6"
              >
                <h3 className="text-sm font-medium text-foreground">
                  Philosophy
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  The thinking behind the approach
                </p>
              </Link>
            </li>
            <li>
              <Link
                href={`${ROUTES.docs}/woodpecker-method`}
                className="block rounded-lg border border-border bg-background p-5 text-left transition-[border-color,box-shadow] hover:border-foreground/12 hover:shadow-sm sm:p-6"
              >
                <h3 className="text-sm font-medium text-foreground">Method</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  How the training method works
                </p>
              </Link>
            </li>
            <li>
              <Link
                href={`${ROUTES.docs}/lifecycle`}
                className="block rounded-lg border border-border bg-background p-5 text-left transition-[border-color,box-shadow] hover:border-foreground/12 hover:shadow-sm sm:p-6"
              >
                <h3 className="text-sm font-medium text-foreground">
                  Lifecycle
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Cycles, sessions, and progress
                </p>
              </Link>
            </li>
            <li>
              <Link
                href={ROUTES.docs}
                className="block rounded-lg border border-border bg-background p-5 text-left transition-[border-color,box-shadow] hover:border-foreground/12 hover:shadow-sm sm:p-6"
              >
                <h3 className="text-sm font-medium text-foreground">Docs</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Full documentation
                </p>
              </Link>
            </li>
          </ul>
        </section>

        {/* Final CTA */}
        <section
          className="border-t border-border bg-muted/20 py-14 md:py-24"
          aria-labelledby="cta-heading"
        >
          <div className={`${containerClass} text-center`}>
            <h2
              id="cta-heading"
              className="text-xl font-medium tracking-tight text-foreground sm:text-2xl md:text-3xl"
            >
              Start forging your tactical vision
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground sm:mt-6 sm:text-base">
              Build a cycle. Train the patterns. Take them to the board.
            </p>
            <div className="mx-auto mt-8 flex w-full max-w-md flex-col items-stretch justify-center gap-3 md:mt-10 md:max-w-none md:flex-row md:items-center md:justify-center">
              <Button
                asChild
                size="lg"
                className="w-full min-h-11 transition-[transform,opacity] duration-200 hover:opacity-95 md:w-auto md:min-h-10"
              >
                <Link href={ROUTES.app}>Open app</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full min-h-11 border-border transition-[transform,background-color] duration-200 hover:bg-muted/40 md:w-auto md:min-h-10"
              >
                <Link href={ROUTES.sets}>Explore training sets</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
