/**
 * Landing page for Pattern Forge.
 *
 * This page communicates the product philosophy: Pattern Forge is a focused
 * Woodpecker-method tactical training tool, not a generic chess puzzle app.
 * It sets expectations for deliberate, repetition-based practice and a calm,
 * distraction-free training experience.
 */

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  LandingSection,
  LandingSectionHeading,
  LandingSectionBody,
  LandingList,
} from "./_components/landing-section";

export default function LandingPage() {
  return (
    <article className="flex flex-col">
      {/* Hero */}
      <header className="border-b border-[var(--border)]/60 pb-16 pt-4 md:pb-24 md:pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] md:text-4xl md:leading-tight">
            Train patterns until they become instinct.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--muted-foreground)]">
            Pattern Forge is a focused tactical training space built around the
            Woodpecker Method: repeated exposure to the same curated puzzle set,
            across cycles, until recognition becomes faster, cleaner, and more
            automatic.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="min-w-[140px]">
              <Link href={ROUTES.training}>Start Training</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[140px]">
              <Link href="#how-it-works">How It Works</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* A training space, not a puzzle arcade */}
      <LandingSection id="how-it-works" narrow>
        <LandingSectionHeading>
          A training space, not a puzzle arcade.
        </LandingSectionHeading>
        <LandingSectionBody>
          <p>
            Pattern Forge is designed for deliberate tactical practice. You work
            through a fixed set of predefined puzzles, repeat that same set
            across multiple cycles, and sharpen your ability to recognize key
            patterns under real thinking conditions.
          </p>
          <p>
            There are no hints, no engine lines during training, and no streak
            mechanics pushing you to move quickly for the sake of speed. The
            goal is not to rush. The goal is to see better.
          </p>
        </LandingSectionBody>
      </LandingSection>

      {/* Built for repetition with purpose (Woodpecker Method) */}
      <LandingSection id="woodpecker-method" narrow>
        <LandingSectionHeading>
          Built for repetition with purpose.
        </LandingSectionHeading>
        <LandingSectionBody>
          <p>
            The Woodpecker Method is based on a simple idea: solve the same
            tactical exercises again and again over multiple cycles, reducing
            effort through familiarity and strengthening pattern recognition
            through repetition.
          </p>
          <p>
            Pattern Forge supports that process with a focused interface that
            helps you:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[var(--muted-foreground)]">
            <li>work through a fixed training set in order</li>
            <li>resume your cycle without friction</li>
            <li>stop and continue sessions intentionally</li>
            <li>review cycle-level progress outside the solving flow</li>
          </ul>
          <p className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 px-4 py-3 text-sm italic text-[var(--muted-foreground)]">
            You are not here to collect novelty. You are here to carve patterns
            deeper.
          </p>
        </LandingSectionBody>
      </LandingSection>

      {/* Training should feel quiet, demanding, and clear */}
      <LandingSection narrow>
        <LandingSectionHeading>
          Training should feel quiet, demanding, and clear.
        </LandingSectionHeading>
        <LandingSectionBody>
          <p>
            While solving, Pattern Forge stays out of your way.
          </p>
          <p>
            You will not be coached move by move. You will not be nudged with
            hints. You will not be pushed by timers or rewarded for streaks. The
            training board is intentionally restrained so your attention stays
            where it belongs: on the position in front of you.
          </p>
          <p>This is a space for recall, focus, and repetition.</p>
        </LandingSectionBody>
      </LandingSection>

      {/* What Pattern Forge is / is not — two columns on desktop */}
      <LandingSection className="border-t border-[var(--border)]/60">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <LandingSectionHeading>What Pattern Forge is</LandingSectionHeading>
            <LandingList
              items={[
                "A structured training environment for predefined tactical puzzles",
                "A repetition-based system built for cycles over days",
                "A focused interface designed to reduce friction and interruption",
                "A place to strengthen pattern recognition through deliberate practice",
                "A tool for measuring cycle progress without polluting the solving experience",
              ]}
            />
          </div>
          <div>
            <LandingSectionHeading>
              What Pattern Forge is not
            </LandingSectionHeading>
            <LandingList
              items={[
                "Not a puzzle rush mode",
                "Not a streak-driven game",
                "Not an engine analysis board",
                "Not a hint-based learning tool during solving",
                "Not a random stream of novelty puzzles",
                "Not a place where the interface does the thinking for you",
              ]}
            />
          </div>
        </div>
      </LandingSection>

      {/* Core philosophy */}
      <LandingSection narrow>
        <LandingSectionHeading>Core philosophy</LandingSectionHeading>
        <LandingSectionBody>
          <p>
            Expose the mind to the same patterns repeatedly, with minimal
            interference, until recognition becomes automatic.
          </p>
          <p>
            That principle shapes every feature in Pattern Forge. If something
            distracts from focus, interrupts recall, or replaces effort with
            convenience, it does not belong in the training flow.
          </p>
        </LandingSectionBody>
      </LandingSection>

      {/* Train in sessions. Reflect between them. */}
      <LandingSection narrow>
        <LandingSectionHeading>
          Train in sessions. Reflect between them.
        </LandingSectionHeading>
        <LandingSectionBody>
          <p>
            Pattern Forge separates solving from reflection.
          </p>
          <p>
            During a session, the board stays clean and concentrated. When you
            stop, you can step into analytics to understand how your cycle is
            progressing, compare against previous cycles, and decide when your
            mind feels sharp enough to continue.
          </p>
          <p>
            Training and analysis each have their place. They should not compete
            for attention.
          </p>
        </LandingSectionBody>
      </LandingSection>

      {/* Final CTA */}
      <LandingSection className="border-t border-[var(--border)]/60">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] md:text-2xl">
            Ready to begin your first cycle?
          </h2>
          <p className="mt-4 text-[var(--muted-foreground)] leading-relaxed">
            Start with a fixed set. Solve seriously. Repeat the cycle. Let the
            patterns settle deeper each time.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="min-w-[140px]">
              <Link href={ROUTES.training}>Start Training</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-w-[160px]"
            >
              <Link href="#woodpecker-method">Explore the Method</Link>
            </Button>
          </div>
        </div>
      </LandingSection>
    </article>
  );
}
