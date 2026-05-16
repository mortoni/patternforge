import {
  FadeIn,
  MotionCard,
  MotionPreviewFrame,
  StaggerContainer,
  StaggeredSectionHeader,
} from "@/components/shared/motion-primitives";
import { cn } from "@/lib/utils";
import { PatternResurfacingPreview } from "@/components/marketing/components/pattern-resurfacing-preview";
import { METHOD_SECTION_EDITORIAL_FEN, methodSteps } from "@/components/marketing/home-landing-data";
import { containerClass } from "@/components/marketing/layout-classes";

export function HomeMethodSection() {
  return (
    <section
      id="method"
      className={cn(
        "relative overflow-hidden bg-gradient-to-b from-muted/[0.11] via-background to-muted/[0.05] py-12 dark:from-muted/[0.09] dark:via-background dark:to-muted/[0.04] sm:py-14 md:py-[4.5rem]",
        "before:pointer-events-none before:absolute before:left-1/2 before:top-0 before:h-28 before:w-[min(112%,56rem)] before:-translate-x-1/2 before:bg-[radial-gradient(ellipse_100%_100%_at_50%_0%,color-mix(in_oklab,var(--muted-foreground)_3%,transparent),transparent_78%)]",
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

      <FadeIn className={cn(containerClass, "mt-14 sm:mt-16 md:mt-[4.5rem]")} delay={0.06}>
        <MotionPreviewFrame emphasis="ambient" className="block w-full">
          <PatternResurfacingPreview
            diagramFen={METHOD_SECTION_EDITORIAL_FEN}
            boardOrientation="white"
            positionSyncKey="method-section-editorial-diagram"
            diagramAccessibilityDescription="White to move in an illustrative tactical position for pattern resurfacing; the main diagram emphasizes squares g5 and g8, while the three cycle mini-boards show recognition unfolding with highlighted squares."
            showBoardCoordinates
          />
        </MotionPreviewFrame>
      </FadeIn>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[12%] bottom-0 z-[2] mx-auto h-px max-w-[62rem] bg-gradient-to-r from-transparent via-border/26 to-transparent dark:via-white/8"
      />
    </section>
  );
}
