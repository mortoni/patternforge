import { FadeIn, MotionPreviewFrame, StaggeredSectionHeader } from "@/components/shared/motion-primitives";
import { cn } from "@/lib/utils";
import { TimeCompressionGraphic } from "@/components/marketing/components/time-compression-graphic";
import {
  TIME_COMPRESSION_CYCLES,
  TIME_COMPRESSION_REDUCTION_LABEL,
} from "@/components/marketing/home-landing-data";
import { containerClass } from "@/components/marketing/layout-classes";

export function HomeTimeCompressionSection() {
  return (
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
  );
}
