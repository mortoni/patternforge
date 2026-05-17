"use client";

import { FadeIn, MotionPreviewFrame } from "@/components/shared/motion-primitives";
import { PatternResurfacingPreview } from "@/components/marketing/components/pattern-resurfacing-preview";
import { METHOD_SECTION_EDITORIAL_FEN } from "@/components/marketing/home-landing-data";
import { containerClass } from "@/components/marketing/layout-classes";
import { cn } from "@/lib/utils";

const SECTION_BG = "#f6f8fa";

const patternPreviewProps = {
  diagramFen: METHOD_SECTION_EDITORIAL_FEN,
  boardOrientation: "white" as const,
  positionSyncKey: "method-section-editorial-diagram",
  diagramAccessibilityDescription:
    "White to move in an illustrative tactical position for pattern resurfacing; the main diagram emphasizes squares g5 and g8, while the three cycle mini-boards show recognition unfolding with highlighted squares.",
  showBoardCoordinates: true,
};

/**
 * Smothered-mate / pattern resurfacing boards — use inside {@link HomeMethodSection}
 * (between the step timeline and the bottom callout).
 */
export function SmotheredMatePatternBlock({ className }: { className?: string }) {
  return (
    <FadeIn className={cn(containerClass, "relative z-[1] max-w-7xl", className)} delay={0.06}>
      <MotionPreviewFrame emphasis="ambient" className="block w-full">
        <PatternResurfacingPreview {...patternPreviewProps} />
      </MotionPreviewFrame>
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
        "relative overflow-x-hidden py-12 sm:py-14 md:py-16",
        "bg-[var(--smothered-section-bg)] dark:bg-background",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-border/25 before:to-transparent dark:before:via-white/10"
      )}
      style={{ ["--smothered-section-bg" as string]: SECTION_BG }}
      aria-label="Smothered mate: pattern resurfacing across training cycles"
    >
      <SmotheredMatePatternBlock />
    </section>
  );
}
