"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Calm, confident easing — reused across marketing motion. */
export const PREMIUM_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const DEFAULT_EASE = PREMIUM_EASE;

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.52,
  y = 14,
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -10% 0px" }}
      transition={{
        duration: prefersReducedMotion ? 0.2 : duration,
        delay,
        ease: DEFAULT_EASE,
      }}
    >
      {children}
    </motion.div>
  );
}

/** Hero copy with a short vertical cascade — single focal column only. */
export function HeroCascade({
  title,
  lead,
  tagline,
  actions,
  className,
}: {
  title: ReactNode;
  lead: ReactNode;
  tagline: ReactNode;
  actions: ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const viewport = { once: true as const, amount: 0.35, margin: "0px 0px -8% 0px" };
  const t = (delay: number) => ({
    duration: prefersReducedMotion ? 0.18 : 0.52,
    delay: prefersReducedMotion ? 0 : delay,
    ease: DEFAULT_EASE,
  });

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={t(0)}
      >
        {title}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={t(0.07)}
      >
        {lead}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={t(0.13)}
      >
        {tagline}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={t(0.19)}
      >
        {actions}
      </motion.div>
    </div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
  as?: "div" | "ul" | "ol";
}

export function StaggerContainer({
  children,
  className,
  delayChildren = 0.04,
  staggerChildren = 0.098,
  as = "div",
}: StaggerContainerProps) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = as === "ul" ? motion.ul : as === "ol" ? motion.ol : motion.div;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -10% 0px" }}
      variants={{
        hidden: { opacity: 1 },
        show: {
          opacity: 1,
          transition: {
            delayChildren,
            staggerChildren: prefersReducedMotion ? 0 : staggerChildren,
          },
        },
      }}
    >
      {children}
    </MotionTag>
  );
}

interface MotionCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  hover?: boolean;
  staggered?: boolean;
  as?: "div" | "li";
}

export function MotionCard({
  children,
  className,
  delay = 0,
  duration = 0.5,
  y = 14,
  hover = true,
  staggered = false,
  as = "div",
}: MotionCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = as === "li" ? motion.li : motion.div;

  return (
    <MotionTag
      className={className}
      variants={{
        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : y },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: prefersReducedMotion ? 0.2 : duration,
            ease: DEFAULT_EASE,
          },
        },
      }}
      {...(staggered
        ? {}
        : {
            initial: "hidden" as const,
            whileInView: "show" as const,
            viewport: {
              once: true,
              amount: 0.18,
              margin: "0px 0px -10% 0px",
            },
            transition: {
              duration: prefersReducedMotion ? 0.2 : duration,
              delay,
              ease: DEFAULT_EASE,
            },
          })}
      whileHover={
        hover && !prefersReducedMotion
          ? {
              y: -2,
              transition: { duration: 0.4, ease: DEFAULT_EASE },
            }
          : undefined
      }
    >
      {children}
    </MotionTag>
  );
}

interface MotionScreenshotProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function MotionScreenshot({
  children,
  className,
  delay = 0,
  duration = 0.52,
}: MotionScreenshotProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 14 },
        show: { opacity: 1, y: 0 },
      }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -8% 0px" }}
      transition={{
        duration: prefersReducedMotion ? 0.2 : duration,
        delay,
        ease: DEFAULT_EASE,
      }}
      whileHover={
        prefersReducedMotion
          ? undefined
          : {
              y: -2,
              transition: { duration: 0.45, ease: DEFAULT_EASE },
            }
      }
    >
      {children}
    </motion.div>
  );
}

interface StaggeredSectionHeaderProps {
  eyebrow?: string;
  title: string;
  body: string;
  headingId?: string;
  className?: string;
  eyebrowClassName?: string;
}

/** Section headings + descriptions with a restrained stagger (marketing). */
export function StaggeredSectionHeader({
  eyebrow,
  title,
  body,
  headingId,
  className,
  eyebrowClassName,
}: StaggeredSectionHeaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const viewport = {
    once: true as const,
    amount: 0.35,
    margin: "0px 0px -10% 0px" as const,
  };
  const t = (delay: number) => ({
    duration: prefersReducedMotion ? 0.18 : 0.5,
    delay: prefersReducedMotion ? 0 : delay,
    ease: DEFAULT_EASE,
  });

  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      {eyebrow ? (
        <motion.p
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={t(0)}
          className={cn(
            "text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground/90",
            eyebrowClassName
          )}
        >
          {eyebrow}
        </motion.p>
      ) : null}
      <motion.h2
        id={headingId}
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={t(eyebrow ? 0.06 : 0)}
        className="mt-3 text-balance text-2xl font-medium tracking-tight text-foreground sm:mt-3.5 sm:text-3xl"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={t(eyebrow ? 0.12 : 0.07)}
        className="mx-auto mt-3.5 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-base"
      >
        {body}
      </motion.p>
    </div>
  );
}

/** Ultra-subtle float + breath — live previews only; honours reduced motion. */
export function MotionPreviewFrame({
  children,
  className,
  emphasis = "standard",
}: {
  children: ReactNode;
  className?: string;
  emphasis?: "ambient" | "standard" | "hero";
}) {
  const prefersReducedMotion = useReducedMotion();

  const drift =
    emphasis === "hero"
      ? 2.75
      : emphasis === "standard"
        ? 2
        : 1.35;
  const period = emphasis === "hero" ? 12 : emphasis === "standard" ? 15 : 18;

  return (
    <motion.div
      className={cn("will-change-transform", className)}
      initial={false}
      animate={
        prefersReducedMotion
          ? undefined
          : {
              // Only translate — CSS `scale` / `rotate` on an ancestor breaks Chessground,
              // which caches piece geometry until layout resize events fire.
              y: [0, -drift, 0],
            }
      }
      transition={{
        duration: period,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

interface AmbientBreathOrbProps {
  className?: string;
  emphasis?: "quiet" | "medium" | "section" | "mist";
}

/** Very slow radial glow modulation — atmospheric only; keep extremely subtle. */
export function AmbientBreathOrb({ className, emphasis = "quiet" }: AmbientBreathOrbProps) {
  const prefersReducedMotion = useReducedMotion();

  const spec =
    emphasis === "medium"
      ? { opacity: [0.86, 1, 0.86] as const, duration: 11 }
      : emphasis === "section"
        ? { opacity: [0.58, 0.68, 0.58] as const, duration: 14 }
        : emphasis === "mist"
          ? { opacity: [0.28, 0.36, 0.28] as const, duration: 16 }
          : { opacity: [0.9, 1, 0.9] as const, duration: 15 };

  const restOpacity =
    (spec.opacity[1] ?? spec.opacity[0] ?? 1) as number;

  return (
    <motion.div
      aria-hidden
      className={className}
      initial={{ opacity: restOpacity }}
      animate={
        prefersReducedMotion ? { opacity: restOpacity } : { opacity: [...spec.opacity] }
      }
      transition={{
        duration: prefersReducedMotion ? 0 : spec.duration,
        repeat: prefersReducedMotion ? 0 : Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

interface MotionEmphasisGlowProps {
  className?: string;
}

/** CTA / spotlight card — restrained inner glow modulation. */
export function MotionEmphasisGlow({ className }: MotionEmphasisGlowProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden
      className={className}
      animate={
        prefersReducedMotion
          ? undefined
          : {
              opacity: [0.88, 0.97, 0.88],
              scale: [1, 1.018, 1],
            }
      }
      transition={{
        duration: 13,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
