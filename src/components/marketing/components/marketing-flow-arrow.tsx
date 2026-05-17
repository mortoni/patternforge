"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type MarketingFlowArrowProps = {
  className?: string;
  /** Horizontal points right; vertical points down (for stacked timelines). */
  orientation?: "horizontal" | "vertical";
  /** Stronger glow and stroke for tactical progressions (e.g. smothered mate steps). */
  emphasis?: "default" | "strong";
};

/**
 * Gold/amber editorial flow arrow (stroke + chevron + soft SVG glow).
 * Used between cycle boards and method timeline steps.
 */
export function MarketingFlowArrow({
  className,
  orientation = "horizontal",
  emphasis = "default",
}: MarketingFlowArrowProps) {
  const uid = React.useId().replace(/:/g, "");
  const arrowGlowId = `pf-mflow-arrowGlow-${uid}`;
  const softGlowId = `pf-mflow-softGlow-${uid}`;
  const isStrong = emphasis === "strong";

  return (
    <svg
      width={30}
      height={7}
      viewBox="0 0 72 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn(
        "block shrink-0 text-[#C6923B] dark:text-[#F6D38B]",
        isStrong ? "h-[8px] w-[2.125rem]" : "h-[7px] w-[1.875rem]",
        orientation === "vertical" && "origin-center rotate-90",
        className
      )}
    >
      <defs>
        <linearGradient
          id={arrowGlowId}
          x1="0"
          y1="8"
          x2="72"
          y2="8"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="currentColor" stopOpacity={0} />
          <stop
            offset="0.45"
            stopColor="currentColor"
            stopOpacity={isStrong ? 0.58 : 0.45}
          />
          <stop offset="1" stopColor="currentColor" stopOpacity={isStrong ? 1 : 0.95} />
        </linearGradient>

        <filter
          id={softGlowId}
          x="-20"
          y="-20"
          width="112"
          height="56"
          filterUnits="userSpaceOnUse"
        >
          <feGaussianBlur stdDeviation={isStrong ? 3.75 : 3} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values={
              isStrong
                ? "1 0 0 0 0.96  0 1 0 0 0.69  0 0 1 0 0.30  0 0 0 0.88 0"
                : "1 0 0 0 0.96  0 1 0 0 0.69  0 0 1 0 0.30  0 0 0 0.75 0"
            }
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d="M4 8H64"
        stroke={`url(#${arrowGlowId})`}
        strokeWidth={isStrong ? 1.75 : 1.5}
        strokeLinecap="round"
        filter={`url(#${softGlowId})`}
      />

      <path
        d="M58 3L65 8L58 13"
        stroke="currentColor"
        strokeWidth={isStrong ? 1.75 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${softGlowId})`}
      />
    </svg>
  );
}
