"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAnalyticsSummary,
  getAccuracySeries,
  getSessionDurationSeries,
} from "@/services/analytics.service";
import { AnalyticsSummaryCards } from "./analytics-summary-cards";
import { SessionDurationChart } from "./session-duration-chart";
import { AccuracyChart } from "./accuracy-chart";

export function AnalyticsPage() {
  const [summary, setSummary] = React.useState<Awaited<
    ReturnType<typeof getAnalyticsSummary>
  > | null>(null);
  const [durationSeries, setDurationSeries] = React.useState<Awaited<
    ReturnType<typeof getSessionDurationSeries>
  > | null>(null);
  const [accuracySeries, setAccuracySeries] = React.useState<Awaited<
    ReturnType<typeof getAccuracySeries>
  > | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      getAnalyticsSummary(),
      getSessionDurationSeries(20),
      getAccuracySeries(20),
    ]).then(([s, d, a]) => {
      if (!cancelled) {
        setSummary(s);
        setDurationSeries(d);
        setAccuracySeries(a);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <PageHeader
        title="Training Analytics"
        description="Track your recent training volume, accuracy, and progress."
      />
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--muted-foreground)]">
            Summary
          </h2>
          {loading ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Loading…
            </p>
          ) : (
            <AnalyticsSummaryCards summary={summary} />
          )}
        </section>
        <section>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Session duration over time
              </CardTitle>
              <p className="text-sm text-[var(--muted-foreground)]">
                Active solving time per completed session
              </p>
            </CardHeader>
            <CardContent>
              <SessionDurationChart data={durationSeries ?? []} />
            </CardContent>
          </Card>
        </section>
        <section>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Accuracy over time
              </CardTitle>
              <p className="text-sm text-[var(--muted-foreground)]">
                Correct rate per completed session
              </p>
            </CardHeader>
            <CardContent>
              <AccuracyChart data={accuracySeries ?? []} />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
