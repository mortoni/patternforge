"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { SupportPatternForgePrompt } from "@/components/shared/SupportPatternForgePrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { formatDateAu } from "@/lib/format-date";
import { formatDurationMs } from "@/lib/format-duration";
import { getCycleSummaryPageData } from "@/services/cycle-summary-page.service";
import { getActiveCycleRunForSet } from "@/repositories/cycle-run.repository";

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card className="border-border/60 bg-muted/5 shadow-none">
      <CardContent className="px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export interface CycleSummaryPageProps {
  cycleId: string;
}

export function CycleSummaryPage({ cycleId }: CycleSummaryPageProps) {
  const [load, setLoad] = React.useState<
    Awaited<ReturnType<typeof getCycleSummaryPageData>> | null
  >(null);
  const [canStartNext, setCanStartNext] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void getCycleSummaryPageData(cycleId).then(async (r) => {
      if (cancelled) return;
      setLoad(r);
      if (r.status === "ok") {
        const active = await getActiveCycleRunForSet(r.data.trainingSetId);
        if (!cancelled) setCanStartNext(active == null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [cycleId]);

  if (load == null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (load.status === "not_found") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <PageHeader title="Cycle Summary" description="This cycle could not be found." />
        <Button asChild variant="outline" className="mt-8">
          <Link href={ROUTES.progress}>Back to Progress</Link>
        </Button>
      </div>
    );
  }

  if (load.status === "not_completed") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <PageHeader
          title="Cycle Summary"
          description={`Cycle ${load.cycleNumber} in ${load.trainingSetName} is still active or not finished yet.`}
        />
        <Button asChild variant="outline" className="mt-8">
          <Link href={ROUTES.training}>Go to training</Link>
        </Button>
      </div>
    );
  }

  const d = load.data;

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10 md:px-6">
      <header className="space-y-6 border-b border-border/40 pb-10">
        <PageHeader title="Cycle Summary">
          <div className="space-y-1 text-sm leading-relaxed text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">
                Cycle {d.cycleNumber}
              </span>
              <span> · {d.trainingSetName}</span>
            </p>
            {d.completedAt != null ? (
              <p>Completed {formatDateAu(d.completedAt)}</p>
            ) : null}
            <p className="text-xs text-muted-foreground/70">
              Completed in {d.sessionCount}{" "}
              {d.sessionCount === 1 ? "session" : "sessions"}
              {" · "}
              {d.mistakes.length === 0
                ? "no mistakes recorded"
                : `${d.mistakes.length} mistake${d.mistakes.length === 1 ? "" : "s"} recorded`}
            </p>
          </div>
        </PageHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {canStartNext ? (
            <Button asChild className="w-full sm:w-auto">
              <Link href={`${ROUTES.sets}/${d.trainingSetId}`}>
                Start next cycle
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={ROUTES.progress}>Back to Progress</Link>
          </Button>
        </div>
      </header>

      {d.previousAttemptTimeMs != null && d.previousAttemptTimeMs > 0 ? (
        <p className="text-sm text-muted-foreground">
          <span className="tabular-nums">
            Previous attempt: {formatDurationMs(d.previousAttemptTimeMs)}
          </span>
          <span className="mx-2 text-muted-foreground/50">·</span>
          <span className="tabular-nums">
            This cycle: {formatDurationMs(d.totalTimeMs)}
          </span>
        </p>
      ) : null}

      <section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total time"
            value={formatDurationMs(d.totalTimeMs)}
          />
          <MetricCard label="Sessions" value={String(d.sessionCount)} />
          <MetricCard
            label="Avg. session"
            value={
              d.averageSessionTimeMs != null
                ? formatDurationMs(d.averageSessionTimeMs)
                : "—"
            }
          />
          <MetricCard
            label="Skipped"
            value={String(d.cycleSkippedTotal)}
          />
        </div>
      </section>

      <section className="space-y-4 pt-1">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Sessions
        </h2>
        <Card className="border-border/60 bg-muted/5 shadow-none">
          <CardContent className="px-0 py-0">
            {d.sessions.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">
                No sessions were recorded for this cycle.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 text-xs font-medium text-muted-foreground">
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3 text-right tabular-nums">
                        Duration
                      </th>
                      <th className="px-5 py-3 text-right tabular-nums">
                        Exercises
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.sessions.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-border/40 last:border-0"
                      >
                        <td className="px-5 py-3 text-muted-foreground">
                          {formatDateAu(s.endedAt ?? s.startedAt)}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-foreground">
                          {formatDurationMs(s.activeTimeMs)}
                        </td>
                        <td className="px-5 py-3 text-right align-top">
                          <div className="inline-flex flex-col items-end gap-0.5 tabular-nums">
                            <span className="text-foreground">
                              {s.exercisesProcessed}
                            </span>
                            {s.skippedCount > 0 ? (
                              <span className="text-[11px] font-normal leading-tight text-muted-foreground/80">
                                {s.playedCount} played · {s.skippedCount}{" "}
                                skipped
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Mistakes
        </h2>
        <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/5">
          {d.mistakes.length === 0 ? (
            <p className="px-4 py-5 text-sm text-muted-foreground">
              No mistakes were recorded for this cycle.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left">
                    <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Exercise
                    </th>
                    <th className="w-24 px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {d.mistakes.map((m) => (
                    <tr
                      key={m.exerciseId}
                      className="border-b border-border/40 last:border-b-0"
                    >
                      <td className="min-w-0 px-4 py-2.5 align-middle">
                        {m.reference != null ? (
                          <div className="min-w-0 space-y-0.5">
                            <p
                              className="truncate font-medium text-foreground"
                              title={m.reference}
                            >
                              {m.reference}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {m.puzzleLabel}
                            </p>
                          </div>
                        ) : (
                          <p className="font-medium text-foreground">
                            {m.puzzleLabel}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right align-middle">
                        {m.mistakeEntryId != null ? (
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                          >
                            <Link
                              href={`${ROUTES.mistakes}/${m.mistakeEntryId}`}
                            >
                              Review
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-xs tabular-nums text-muted-foreground/60">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <SupportPatternForgePrompt source="cycle_completion" />
    </div>
  );
}
