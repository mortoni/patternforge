import Link from "next/link";
import { FadeIn, MotionEmphasisGlow } from "@/components/shared/motion-primitives";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { containerClass } from "@/components/marketing/layout-classes";

export function HomeFinalCtaSection() {
  return (
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
  );
}
