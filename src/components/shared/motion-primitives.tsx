"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const DEFAULT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
  duration = 0.45,
  y = 16,
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
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
  delayChildren = 0,
  staggerChildren = 0.08,
  as = "div",
}: StaggerContainerProps) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = as === "ul" ? motion.ul : as === "ol" ? motion.ol : motion.div;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
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
  duration = 0.45,
  y = 16,
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
            viewport: { once: true, amount: 0.2 },
            transition: {
              duration: prefersReducedMotion ? 0.2 : duration,
              delay,
              ease: DEFAULT_EASE,
            },
          })}
      whileHover={
        hover && !prefersReducedMotion
          ? {
              y: -4,
              transition: { duration: 0.25, ease: "easeOut" },
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
  duration = 0.45,
}: MotionScreenshotProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
        show: { opacity: 1, y: 0 },
      }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: prefersReducedMotion ? 0.2 : duration,
        delay,
        ease: DEFAULT_EASE,
      }}
      whileHover={
        prefersReducedMotion
          ? undefined
          : {
              y: -6,
              scale: 1.01,
              transition: { duration: 0.25, ease: "easeOut" },
            }
      }
    >
      {children}
    </motion.div>
  );
}
