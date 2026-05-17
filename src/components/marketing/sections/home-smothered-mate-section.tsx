"use client";

import { FadeIn } from "@/components/shared/motion-primitives";
import { SmotheredMateShowcase } from "@/components/marketing/components/smothered-mate-showcase";
import { containerClass } from "@/components/marketing/layout-classes";
import { cn } from "@/lib/utils";

const SECTION_BG = "#f6f8fa";

/**
 * Smothered-mate tactical story — use inside {@link HomeMethodSection}
 * (between the step timeline and the bottom callout).
 */
export function SmotheredMatePatternBlock({ className }: { className?: string }) {
  return (
    <FadeIn className={cn(containerClass, "relative z-[1] max-w-7xl", className)} delay={0.06}>
      <SmotheredMateShowcase className="w-full" />
    </FadeIn>
  );
}

/**
 * Same pattern preview as a standalone section (e.g. alternate page layouts).
 */
export function HomeSmotheredMateSection() {
  return (
    <section
      id="smothered-mate"
      className={cn(
        "relative overflow-x-hidden py-16 sm:py-20 md:py-24",
        "bg-[var(--smothered-section-bg)] dark:bg-background",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-border/25 before:to-transparent dark:before:via-white/10"
      )}
      style={{ ["--smothered-section-bg" as string]: SECTION_BG }}
      aria-label="Smothered mate: three tactical steps and pattern crystallization"
    >
      <SmotheredMatePatternBlock />
    </section>
  );
}
