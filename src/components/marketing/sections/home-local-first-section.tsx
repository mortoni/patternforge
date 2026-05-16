import { FadeIn, StaggeredSectionHeader } from "@/components/shared/motion-primitives";
import { cn } from "@/lib/utils";
import { containerClass } from "@/components/marketing/layout-classes";

const LOCAL_FIRST_CUES = [
  "Works offline",
  "Saved on your device",
  "Instant resume",
  "Installable as an app",
] as const;

function LocalFirstCueStrip({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 text-balance text-center font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/42 sm:gap-x-2.5 lg:text-[10.5px] lg:tracking-[0.13em]",
        className
      )}
    >
      {LOCAL_FIRST_CUES.map((label, i) => (
        <span key={label} className="inline-flex items-center gap-x-2 sm:gap-x-2.5">
          {i > 0 ? (
            <span className="select-none text-muted-foreground/22" aria-hidden>
              ·
            </span>
          ) : null}
          <span>{label}</span>
        </span>
      ))}
    </p>
  );
}

export function HomeLocalFirstTrainingSection() {
  return (
    <section
      id="local-first"
      className={cn(
        "relative scroll-mt-4 overflow-hidden bg-background py-[3.875rem] sm:py-16 md:py-[5.75rem]",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[min(10rem,24vh)] before:bg-[radial-gradient(ellipse_75%_100%_at_50%_0%,color-mix(in_oklab,var(--primary)_3.5%,transparent),transparent_76%)] before:opacity-45 dark:before:opacity-55"
      )}
      aria-labelledby="local-first-heading"
    >
      <div className={containerClass}>
        <StaggeredSectionHeader
          headingId="local-first-heading"
          eyebrow="LOCAL-FIRST"
          eyebrowClassName="tracking-[0.12em] text-muted-foreground/58"
          title="Your training is always ready"
          body="Open PatternForge and you are back in your last pass right away—even when you are offline. Your cycles stay on the device you are using, so nothing needs to sync down before you can move. If you train on another phone or browser too, each one keeps its own history—there is no automatic syncing across devices."
          className="max-w-2xl sm:max-w-3xl [&_p]:max-w-2xl [&_p]:text-pretty [&_p]:leading-relaxed [&_p]:text-[0.9375rem] sm:[&_p]:text-base"
        />

        <FadeIn className="mt-6 flex justify-center sm:mt-7 md:mt-8" delay={0.04}>
          <LocalFirstCueStrip />
        </FadeIn>
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
  );
}
