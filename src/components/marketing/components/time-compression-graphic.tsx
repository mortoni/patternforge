"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { formatDurationMs } from "@/lib/format-duration";
import { cn } from "@/lib/utils";

export type TimeCompressionCycle = {
  cycle: number;
  totalMs: number;
};

function sparklinePoints(
  cycles: readonly TimeCompressionCycle[],
  maxMs: number
): { x: number; y: number }[] {
  const n = cycles.length;
  return cycles.map((c, i) => {
    const x = ((i + 0.5) / n) * 100;
    const t = Math.max(c.totalMs / maxMs, 0.02);
    const y = 100 - t * 86 - 8;
    return { x, y };
  });
}

/** Minimal payoff graphic: wall-clock durations + descending bars + soft trend spine (no axes). */
export function TimeCompressionGraphic({
  cycles,
  reductionLabel,
  className,
}: {
  cycles: readonly TimeCompressionCycle[];
  reductionLabel: string;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const uidBase = useId().replace(/:/g, "");
  const gradId = `time-compression-area-${uidBase}`;
  const maxMs = Math.max(...cycles.map((c) => c.totalMs), 1);
  const pts = sparklinePoints(cycles, maxMs);
  const d = pts.reduce((acc, p, i) => {
    const prefix = i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`;
    return acc + prefix;
  }, "");
  const areaD = `${d} L ${pts.at(-1)!.x} 100 L ${pts[0]!.x} 100 Z`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-background/55 px-4 py-7 shadow-[0_28px_64px_-32px_rgba(0,0,0,0.55)] sm:px-8 sm:py-9 dark:border-border/65 dark:bg-background/45 dark:shadow-black/40",
        className
      )}
    >
      <p className="sr-only">
        Illustrative wall-clock trend for the same set across four complete cycles:{" "}
        {cycles
          .map((c) => `cycle ${c.cycle} ${formatDurationMs(c.totalMs)}`)
          .join(", ")}
        . {reductionLabel}.
      </p>
      <div
        className="pointer-events-none absolute inset-x-[8%] top-[-20%] h-[45%] rounded-full bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_oklab,var(--primary)_7%,transparent),transparent_74%)] opacity-55 blur-3xl dark:opacity-70"
        aria-hidden
      />
      <svg
        className="pointer-events-none absolute inset-x-6 bottom-[4.75rem] top-24 hidden opacity-[0.28] dark:opacity-[0.32] sm:inset-x-10 sm:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="72%" stopColor="hsl(var(--primary))" stopOpacity="0.09" />
            <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <motion.path
          d={areaD}
          fill={`url(#${gradId})`}
          className="hidden dark:block"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.95,
            delay: prefersReducedMotion ? 0 : 0.42,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
        <motion.path
          d={d}
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="0.35"
          vectorEffect="non-scaling-stroke"
          className="opacity-[0.26] dark:opacity-[0.28]"
          initial={{ pathLength: prefersReducedMotion ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.28 }}
          transition={{
            pathLength: {
              duration: prefersReducedMotion ? 0 : 1.05,
              delay: prefersReducedMotion ? 0 : 0.22,
              ease: [0.22, 1, 0.36, 1],
            },
          }}
        />
      </svg>

      <div className="relative z-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-4 sm:gap-x-4">
        {cycles.map((c, i) => {
          const hPct = (c.totalMs / maxMs) * 100;
          return (
            <div
              key={c.cycle}
              className="flex flex-col items-center text-center"
            >
              <p
                className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground/55"
                aria-hidden
              >
                Cycle {c.cycle}
              </p>
              <p className="mt-2 text-[1.35rem] font-medium leading-none tracking-[-0.02em] text-foreground tabular-nums sm:text-[1.6rem] md:text-[1.75rem]">
                {formatDurationMs(c.totalMs)}
              </p>
              <div
                className="relative mt-5 flex h-[7.5rem] w-full max-w-[4.25rem] items-end justify-center sm:mt-6 sm:h-[9rem] sm:max-w-[4.75rem]"
                aria-hidden
              >
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/55 to-transparent dark:via-white/12" />
                <motion.div
                  className="w-[46%] max-w-[2.25rem] rounded-t-[3px] bg-gradient-to-t from-muted/25 via-foreground/12 to-foreground/22 dark:from-muted/20 dark:via-foreground/10 dark:to-foreground/18"
                  initial={
                    prefersReducedMotion
                      ? { height: `${hPct}%` }
                      : { height: "0%" }
                  }
                  whileInView={{ height: `${hPct}%` }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.2 : 0.75,
                    delay: prefersReducedMotion ? 0 : 0.06 * i,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{ originY: 1 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="relative z-10 mx-auto mt-8 max-w-md text-center text-[13px] font-medium leading-relaxed text-foreground/88 sm:mt-10 sm:text-sm">
        {reductionLabel}
      </p>
    </div>
  );
}
