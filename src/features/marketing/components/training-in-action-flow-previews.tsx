"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DocumentThemedMarketingSmPreview,
  type MarketingShellTone,
  type TrainingPreviewAppearance,
} from "@/components/shared/training-preview";
import {
  cycleProgressPercentRounded,
  formatCycleProgressLabel,
} from "@/features/session-summary/session-summary-helpers";
import { formatDurationMs, formatDurationMsChartAxis } from "@/lib/format-duration";
import { cn } from "@/lib/utils";

function exerciseWord(n: number): string {
  return n === 1 ? "exercise" : "exercises";
}

function ScopedAppearanceShell({
  appearance,
  children,
}: {
  appearance: TrainingPreviewAppearance;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain bg-background text-foreground",
        appearance === "dark" && "dark"
      )}
    >
      {children}
    </div>
  );
}

export interface ProgressSessionTimelineEntry {
  /** Short annotation, e.g. "Yesterday" or "2 May". */
  dayLabel: string;
  exercisesDone: number;
  durationMs: number;
}

/** Props for the “Track” (progress) landing preview — richer “active cycle” context. */
export interface ProgressMarketingPreviewProps {
  trainingSetName: string;
  cycleNumber: number;
  nextExerciseIndex: number;
  totalExercises: number;
  exercisesRemaining?: number;
  sessionCountThisCycle: number;
  lastSessionDurationMs: number;
  /** Most recent first; omit or empty to hide timeline. */
  recentSessions?: ProgressSessionTimelineEntry[];
}

export function ProgressMarketingPreviewInner({
  appearance,
  trainingSetName,
  cycleNumber,
  nextExerciseIndex,
  totalExercises,
  exercisesRemaining: exercisesRemainingProp,
  sessionCountThisCycle,
  lastSessionDurationMs,
  recentSessions = [],
}: ProgressMarketingPreviewProps & {
  appearance: TrainingPreviewAppearance;
}) {
  const progressTotal = totalExercises;
  const progressMax = progressTotal > 0 ? progressTotal : 100;
  const progressValue = Math.min(Math.max(0, nextExerciseIndex), progressTotal);
  const progressLabel = formatCycleProgressLabel(nextExerciseIndex, progressTotal);
  const progressPercent = cycleProgressPercentRounded(nextExerciseIndex, progressTotal);
  const exercisesRemaining =
    exercisesRemainingProp ?? Math.max(0, progressTotal - nextExerciseIndex);

  const lastShort = formatDurationMsChartAxis(lastSessionDurationMs);
  const timeline = recentSessions.slice(0, 3);

  return (
    <ScopedAppearanceShell appearance={appearance}>
      <div className="border-b border-border/40 px-3 pb-2.5 pt-3">
        <h2 className="text-base font-semibold tracking-tight text-foreground">Progress</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Track your current cycle across sessions.
        </p>
      </div>

      <div className="space-y-3 px-3 py-3">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Current cycle
          </p>
          <div className="flex flex-col items-end gap-0.5 text-right">
            <p className="text-[10px] text-muted-foreground/90 tabular-nums">
              Last session · {lastShort}
            </p>
            <p className="text-[10px] text-muted-foreground/75 tabular-nums">
              {sessionCountThisCycle} sessions this cycle
            </p>
          </div>
        </div>

        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-0.5 pb-2 pt-3.5">
            <CardTitle className="text-[15px] font-semibold text-foreground">
              Cycle {cycleNumber}
            </CardTitle>
            <CardDescription className="text-[11px] leading-snug">{trainingSetName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 px-3.5 pb-4 pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                <span className="font-medium uppercase tracking-wide">Line progress</span>
                {progressPercent != null ? (
                  <span className="tabular-nums text-foreground/80">{progressPercent}%</span>
                ) : null}
              </div>
              <Progress
                value={progressValue}
                max={progressMax}
                className="h-[7px] rounded-full bg-muted/80 [&>div]:rounded-full [&>div]:bg-primary/90"
              />
              <p className="text-[11px] tabular-nums text-muted-foreground">
                <span>{progressLabel}</span>
              </p>
            </div>
            <div className="rounded-md border border-border/45 bg-muted/15 px-2.5 py-2">
              <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground/85">
                Remaining
              </p>
              <p className="mt-1 text-[13px] font-semibold tabular-nums text-foreground">
                {exercisesRemaining}{" "}
                <span className="text-[11px] font-medium text-muted-foreground">
                  {exerciseWord(exercisesRemaining)}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {timeline.length > 0 ? (
          <div className="rounded-lg border border-border/35 bg-muted/10 px-2.5 py-2">
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground/80">
              Recent activity
            </p>
            <ul className="mt-2 space-y-2" aria-label="Recent sessions in this cycle">
              {timeline.map((s, idx) => (
                <li key={`${s.dayLabel}-${idx}`} className="relative flex gap-2.5 pl-1">
                  <div className="flex flex-col items-center pt-1">
                    <span className="size-1.5 shrink-0 rounded-full bg-primary/55" />
                    {idx < timeline.length - 1 ? (
                      <span className="mt-0.5 block w-px grow min-h-[10px] bg-border/50" />
                    ) : null}
                  </div>
                  <div className="min-w-0 pb-0.5">
                    <p className="text-[10px] text-muted-foreground">
                      <span className="font-medium text-foreground/90">{s.dayLabel}</span>
                      <span className="text-muted-foreground/55"> · </span>
                      <span className="tabular-nums">
                        {s.exercisesDone} {s.exercisesDone === 1 ? "exercise" : "exercises"}
                      </span>
                      <span className="text-muted-foreground/55"> · </span>
                      <span className="tabular-nums">
                        {formatDurationMsChartAxis(s.durationMs)}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </ScopedAppearanceShell>
  );
}

function MasteryCycleTimeBars({
  cyclesChronological,
}: {
  /** Oldest cycle first → builds “time to finish” shrinking across repetitions. */
  cyclesChronological: Array<{ cycleNumber: number; totalTimeMs: number }>;
}) {
  if (cyclesChronological.length === 0) return null;

  const maxMs = Math.max(...cyclesChronological.map((c) => c.totalTimeMs));

  return (
    <div className="space-y-3 rounded-lg border border-border/40 bg-muted/10 px-2.5 py-3">
      {cyclesChronological.map((c) => {
        const widthPct = maxMs > 0 ? Math.max(10, Math.round((c.totalTimeMs / maxMs) * 100)) : 100;
        return (
          <div key={c.cycleNumber} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium tabular-nums text-foreground">
                Cycle {c.cycleNumber}
              </span>
              <span className="shrink-0 text-[11px] tabular-nums tracking-tight text-muted-foreground">
                {formatDurationMs(c.totalTimeMs)}
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-border/40 dark:bg-white/[0.08]"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-primary/65 dark:bg-violet-400/45"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className="border-t border-border/30 pt-2.5 text-[10px] leading-snug text-muted-foreground/90">
        Each row is full-set time across the cycle — shorter bars usually mean faster recognition,
        not rushed solving.
      </p>
    </div>
  );
}

/** Landing-only “mastery” snapshot: cycles, trend, short insight — not the full Reflection page. */
export interface MasteryMarketingPreviewProps {
  trainingSetName: string;
  /** Completed cycles, oldest first (e.g. cycle 1 → 3). */
  cycles: Array<{ cycleNumber: number; totalTimeMs: number }>;
  /** One-line narrative, e.g. “61% faster than first cycle”. */
  insightLine: string;
}

export function MasteryMarketingPreviewInner({
  appearance,
  trainingSetName,
  cycles,
  insightLine,
}: MasteryMarketingPreviewProps & {
  appearance: TrainingPreviewAppearance;
}) {
  const cyclesChronological = [...cycles].sort((a, b) => a.cycleNumber - b.cycleNumber);

  return (
    <ScopedAppearanceShell appearance={appearance}>
      <div className="border-b border-border/40 px-3 pb-2.5 pt-3">
        <h2 className="text-base font-semibold tracking-tight text-foreground">Mastery</h2>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
          Recognition compounding across repetitions.
        </p>
        <p className="mt-2 truncate text-[10px] text-muted-foreground/90" title={trainingSetName}>
          <span className="font-medium text-foreground/85">{trainingSetName}</span>
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col space-y-3 px-3 pb-3 pt-3">
        <div className="space-y-2">
          <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground/80">
            Time to finish each cycle
          </p>
          <MasteryCycleTimeBars cyclesChronological={cyclesChronological} />
        </div>

        <p className="mt-auto rounded-md border border-border/35 bg-muted/12 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground">
          <span className="font-medium text-foreground/90">{insightLine}</span>
        </p>
      </div>
    </ScopedAppearanceShell>
  );
}

export function DocumentThemedProgressMarketingPreview(
  props: ProgressMarketingPreviewProps & {
    title: string;
    className?: string;
    shellTone?: MarketingShellTone;
  }
) {
  const { title, className, shellTone, ...rest } = props;
  return (
    <DocumentThemedMarketingSmPreview
      title={title}
      className={className}
      shellTone={shellTone}
      render={(appearance) => (
        <ProgressMarketingPreviewInner appearance={appearance} {...rest} />
      )}
    />
  );
}

export function DocumentThemedMasteryMarketingPreview(
  props: MasteryMarketingPreviewProps & {
    title: string;
    className?: string;
    shellTone?: MarketingShellTone;
  }
) {
  const { title, className, shellTone, ...rest } = props;
  return (
    <DocumentThemedMarketingSmPreview
      title={title}
      className={className}
      shellTone={shellTone}
      render={(appearance) => <MasteryMarketingPreviewInner appearance={appearance} {...rest} />}
    />
  );
}
