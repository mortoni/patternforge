"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Brain, Search, Star, Target, TimerReset, Zap, type LucideIcon } from "lucide-react";
import { FadeIn, PREMIUM_EASE, StaggerContainer, StaggeredSectionHeader } from "@/components/shared/motion-primitives";
import { cn } from "@/lib/utils";
import { SmotheredMatePatternBlock } from "@/components/marketing/sections/home-smothered-mate-section";
import { containerClass } from "@/components/marketing/layout-classes";
import { MarketingFlowArrow } from "@/components/marketing/components/marketing-flow-arrow";

const METHOD_BG = "#f6f8fa";

const methodFlowSteps: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Choose a line",
    description: "Pick a puzzle line and commit to working it cycle by cycle.",
    icon: Target,
  },
  {
    title: "Recognize motifs",
    description: "Repeated solves train your eyes to spot the key patterns instantly.",
    icon: Search,
  },
  {
    title: "Recall becomes automatic",
    description: "What once required calculation starts to happen without thinking.",
    icon: Brain,
  },
  {
    title: "Time begins collapsing",
    description: "Each cycle takes less time as recognition speed improves.",
    icon: TimerReset,
  },
  {
    title: "Pattern becomes instinct",
    description: "The pattern is now part of you — ready in any position, any time.",
    icon: Zap,
  },
];

function stepCardVariants(prefersReducedMotion: boolean | null) {
  return {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.2 : 0.48, ease: PREMIUM_EASE },
    },
  };
}

function connectorVariants(prefersReducedMotion: boolean | null) {
  return {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: prefersReducedMotion ? 0.15 : 0.35, ease: PREMIUM_EASE },
    },
  };
}

function HorizontalConnector() {
  return (
    <div className="flex w-full min-w-0 items-center justify-center pt-[2.35rem]" aria-hidden>
      <MarketingFlowArrow />
    </div>
  );
}

function StepIconCircle({
  size = "md",
  prefersReducedMotion,
  children,
}: {
  size?: "md" | "lg";
  prefersReducedMotion: boolean | null;
  children: React.ReactNode;
}) {
  const isLg = size === "lg";
  return (
    <motion.div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-white text-primary",
        "shadow-[0_12px_40px_-14px_rgba(15,23,42,0.14),0_0_0_1px_rgba(124,58,237,0.1)]",
        "ring-2 ring-primary/[0.12] dark:bg-card",
        isLg ? "size-[4.75rem]" : "size-[4.25rem]"
      )}
      whileHover={
        prefersReducedMotion ? undefined : { y: -4, transition: { duration: 0.22, ease: PREMIUM_EASE } }
      }
    >
      {children}
    </motion.div>
  );
}

export function HomeMethodSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="method"
      className={cn(
        "relative overflow-x-hidden py-14 sm:py-16 md:py-20 lg:py-[5.25rem]",
        "bg-[var(--method-section-bg)] text-foreground dark:bg-background",
        "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-border/30 after:to-transparent dark:after:via-white/10"
      )}
      style={{ ["--method-section-bg" as string]: METHOD_BG }}
      aria-labelledby="method-heading"
    >
      <div className={cn(containerClass, "relative z-[1] max-w-7xl")}>
        <StaggeredSectionHeader
          headingId="method-heading"
          eyebrow="THE METHOD"
          title="Built around disciplined repetition"
          body="Repeated exposure changes what recognition feels like. The work turns familiarity into instinct — cycle by cycle."
          className={cn(
            "mx-auto max-w-3xl",
            "[&_h2]:mt-4 [&_h2]:text-balance [&_h2]:font-bold [&_h2]:tracking-tight",
            "[&_h2]:text-[clamp(1.65rem,4vw,2.4rem)] [&_h2]:text-slate-900 dark:[&_h2]:text-foreground",
            "[&_p]:mx-auto [&_p]:max-w-[720px] [&_p]:text-pretty [&_p]:text-muted-foreground"
          )}
          eyebrowClassName="font-semibold tracking-[0.14em] text-primary"
        />
      </div>

      {/* Mobile + tablet: vertical stack / 2-col grid */}
      <div className={cn(containerClass, "relative z-[1] mt-12 max-w-7xl lg:hidden")}>
        <StaggerContainer
          as="ol"
          className="mx-auto grid list-none gap-10 max-md:max-w-lg max-md:grid-cols-1 max-md:pl-0 md:grid-cols-2 md:gap-x-10 md:gap-y-14 sm:max-w-xl md:max-w-none"
          staggerChildren={0.07}
        >
          {methodFlowSteps.flatMap((step, index) => {
            const Icon = step.icon;
            const stepItem = (
              <motion.li
                key={step.title}
                variants={stepCardVariants(prefersReducedMotion)}
                className="flex items-center gap-4 sm:gap-5 md:flex-col md:items-center md:text-center"
              >
                <div className="flex shrink-0 flex-col items-center md:items-center">
                  <StepIconCircle size="md" prefersReducedMotion={prefersReducedMotion}>
                    <Icon className="size-6" strokeWidth={1.45} aria-hidden />
                  </StepIconCircle>
                </div>
                <div className="min-w-0 flex-1 pt-0.5 md:pt-0">
                  <p className="inline-flex rounded-full border border-primary/35 bg-primary/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary md:mt-4">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-3 text-base font-semibold tracking-tight text-slate-900 dark:text-foreground sm:text-[17px]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    {step.description}
                  </p>
                </div>
              </motion.li>
            );

            if (index < methodFlowSteps.length - 1) {
              return [
                stepItem,
                <li
                  key={`${step.title}-mobile-arrow`}
                  aria-hidden
                  className="col-span-full flex list-none justify-center py-2"
                >
                  <MarketingFlowArrow orientation="vertical" className="shrink-0" />
                </li>,
              ];
            }

            return [stepItem];
          })}
        </StaggerContainer>
      </div>

      {/* Desktop: single row + flow arrows */}
      <div className={cn(containerClass, "relative z-[1] mt-14 hidden max-w-7xl lg:block lg:mt-16")}>
        <StaggerContainer
          as="ol"
          className="flex w-full list-none items-start justify-center gap-0 pl-0"
          staggerChildren={0.08}
        >
          {methodFlowSteps.flatMap((step, index) => {
            const Icon = step.icon;
            const nodes = [
              <motion.li
                key={step.title}
                variants={stepCardVariants(prefersReducedMotion)}
                className="flex min-w-0 max-w-[min(100%,13.5rem)] flex-1 flex-col items-center text-center"
              >
                <StepIconCircle size="lg" prefersReducedMotion={prefersReducedMotion}>
                  <Icon className="size-[1.65rem]" strokeWidth={1.45} aria-hidden />
                </StepIconCircle>
                <p className="mt-5 inline-flex rounded-full border border-primary/35 bg-primary/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                  Step {index + 1}
                </p>
                <h3 className="mt-3 text-[15px] font-semibold leading-snug tracking-tight text-slate-900 dark:text-foreground xl:text-base">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[13rem] text-[13px] leading-relaxed text-muted-foreground xl:text-[14px]">
                  {step.description}
                </p>
              </motion.li>,
            ];
            if (index < methodFlowSteps.length - 1) {
              nodes.push(
                <motion.li
                  key={`${step.title}-connector`}
                  aria-hidden
                  variants={connectorVariants(prefersReducedMotion)}
                  className="flex w-[min(3.5vw,2.5rem)] shrink-0 list-none justify-center xl:w-[min(4vw,3rem)]"
                >
                  <HorizontalConnector />
                </motion.li>
              );
            }
            return nodes;
          })}
        </StaggerContainer>
      </div>

      <SmotheredMatePatternBlock className="mt-14 sm:mt-16 md:mt-[4.5rem] lg:mt-16" />

      <FadeIn className={cn(containerClass, "relative z-[1] mx-auto mt-12 max-w-[760px] sm:mt-14 md:mt-16 lg:mt-20")}>
        <div
          className={cn(
            "flex gap-4 rounded-2xl border border-primary/20 bg-white/95 p-5 sm:gap-5 sm:p-6",
            "shadow-[0_0_52px_-22px_rgba(124,58,237,0.38)]",
            "dark:border-primary/25 dark:bg-card/85 dark:shadow-[0_0_40px_-16px_rgba(124,58,237,0.22)]"
          )}
        >
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md sm:size-12"
            aria-hidden
          >
            <Star className="size-5 fill-current sm:size-[1.35rem]" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-base font-semibold text-primary sm:text-lg">Discipline today. Instinct forever.</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Repetition isn&apos;t just practice — it&apos;s how patterns become part of your game.
            </p>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
