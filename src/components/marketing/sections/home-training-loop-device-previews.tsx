"use client";

import type { ReactNode } from "react";
import {
  MarketingDeviceFrame,
  TrainingPreview,
  useDocumentAppearance,
  type MarketingShellTone,
} from "@/components/shared/training-preview";
import { Progress } from "@/components/ui/progress";
import { MARKETING_HERO_PHONE_PREVIEW } from "@/components/marketing/home-landing-data";
import { cn } from "@/lib/utils";

function PhoneChrome({
  title,
  shellTone,
  widthClassName,
  children,
}: {
  title: string;
  shellTone: MarketingShellTone;
  widthClassName?: string;
  children: ReactNode;
}) {
  const appearance = useDocumentAppearance();

  return (
    <MarketingDeviceFrame
      screen="sm"
      appearance={appearance}
      title={title}
      shellTone={shellTone}
      smFillContainer
      className={cn("w-full", widthClassName)}
    >
      <div
        className={cn(
          "flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden",
          "bg-background text-foreground dark:bg-[#070a10] dark:text-slate-100"
        )}
      >
        {children}
      </div>
    </MarketingDeviceFrame>
  );
}

/** Centre “Solve” — same training chrome + board as the landing hero phone preview. */
export function TrainingLoopSolveDevicePreview({
  className,
  title,
}: {
  className?: string;
  title: string;
}) {
  const appearance = useDocumentAppearance();

  return (
    <TrainingPreview
      appearance={appearance}
      title={title}
      className={className}
      smFillContainer
      preview={MARKETING_HERO_PHONE_PREVIEW}
    />
  );
}

export function TrainingLoopProgressDevicePreview({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <PhoneChrome title={title} shellTone="muted" widthClassName={className}>
      <div className="flex min-h-10 w-full items-center justify-center border-b border-black/10 px-3 py-2.5 dark:border-white/[0.07]">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
          Progress
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div
          className={cn(
            "rounded-2xl border p-3 shadow-sm",
            "border-black/10 bg-muted/40",
            "dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
          )}
        >
          <p className="text-[13px] font-semibold tracking-tight text-foreground dark:text-white">
            Track your cycle
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground dark:text-slate-400">
            Repetition powers faster recognition.
          </p>
        </div>
        <div
          className={cn(
            "space-y-2.5 rounded-2xl border p-3",
            "border-black/10 bg-muted/50",
            "dark:border-white/[0.07] dark:bg-black/25"
          )}
        >
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground dark:text-slate-500">
            Progress
          </p>
          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground dark:text-slate-400">
                Accuracy
              </span>
              <span className="text-[12px] font-semibold tabular-nums text-foreground dark:text-white">
                78%
              </span>
            </div>
            <Progress
              value={78}
              className="h-1.5 rounded-full bg-black/10 dark:bg-white/[0.06] [&>div]:rounded-full [&>div]:bg-primary"
            />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-black/10 pt-2.5 text-[11px] tabular-nums dark:border-white/[0.06]">
            <span className="text-muted-foreground dark:text-slate-500">Time / puzzle</span>
            <span className="font-medium text-foreground dark:text-slate-200">1:32</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] tabular-nums">
            <span className="text-muted-foreground dark:text-slate-500">Solved</span>
            <span className="font-medium text-foreground dark:text-slate-200">302 / 360</span>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground dark:text-slate-500">
            Recent
          </p>
          {[
            { label: "Cycle 3", stat: "78%", when: "5m ago" },
            { label: "Cycle 2", stat: "72%", when: "1d ago" },
            { label: "Cycle 1", stat: "65%", when: "3d ago" },
          ].map((row) => (
            <div
              key={row.label}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2",
                "border-black/10 bg-muted/35",
                "dark:border-white/[0.06] dark:bg-white/[0.02]"
              )}
            >
              <span className="text-[11px] text-foreground dark:text-slate-300">{row.label}</span>
              <span className="text-[11px] font-medium tabular-nums text-primary">{row.stat}</span>
              <span className="text-[10px] text-muted-foreground dark:text-slate-500">{row.when}</span>
            </div>
          ))}
        </div>
      </div>
    </PhoneChrome>
  );
}

export function TrainingLoopMasteryDevicePreview({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const cycles = [
    { n: 1, pct: 42 },
    { n: 2, pct: 58 },
    { n: 3, pct: 72 },
    { n: 4, pct: 86 },
    { n: 5, pct: 94 },
  ];

  return (
    <PhoneChrome title={title} shellTone="muted" widthClassName={className}>
      <div className="flex min-h-10 w-full items-center justify-center border-b border-black/10 px-3 py-2.5 dark:border-white/[0.07]">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
          Mastery
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div
          className={cn(
            "rounded-2xl border p-3 shadow-sm",
            "border-black/10 bg-muted/40",
            "dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
          )}
        >
          <p className="text-[13px] font-semibold tracking-tight text-foreground dark:text-white">
            Measure mastery
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground dark:text-slate-400">
            Recognition becomes faster with focus.
          </p>
        </div>
        <div
          className={cn(
            "space-y-2.5 rounded-2xl border p-3",
            "border-black/10 bg-muted/50",
            "dark:border-white/[0.07] dark:bg-black/25"
          )}
        >
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground dark:text-slate-500">
            Mastery
          </p>
          <ul className="space-y-2">
            {cycles.map((c) => (
              <li key={c.n} className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground dark:text-slate-400">
                  <span>Cycle {c.n}</span>
                  <span className="tabular-nums text-muted-foreground dark:text-slate-500">
                    {c.pct}%
                  </span>
                </div>
                <Progress
                  value={c.pct}
                  className="h-1 rounded-full bg-black/10 dark:bg-white/[0.06] [&>div]:rounded-full [&>div]:bg-primary"
                />
              </li>
            ))}
          </ul>
        </div>
        <div
          className={cn(
            "rounded-2xl border px-3 py-2.5",
            "border-black/10 bg-muted/30",
            "dark:border-white/[0.07] dark:bg-white/[0.02]"
          )}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground dark:text-slate-500">
              Avg time
            </span>
            <span className="text-[12px] font-semibold tabular-nums text-foreground dark:text-white">
              1:28
            </span>
          </div>
          <p className="mt-1 text-[10px] text-primary">−43% vs Cycle 1</p>
        </div>
      </div>
    </PhoneChrome>
  );
}
