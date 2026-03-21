"use client";

import * as React from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDateShort } from "@/lib/format-date";
import type { AnalyticsCurrentCycleSessionPoint } from "@/services/analytics-page.service";

export interface CurrentCycleSessionsChartProps {
  data: AnalyticsCurrentCycleSessionPoint[];
}

type ChartRow = AnalyticsCurrentCycleSessionPoint & { shortDate: string };

function CurrentCycleTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartRow }>;
}) {
  if (!active || payload == null || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-md border border-border/60 bg-card/95 px-2.5 py-2 text-xs shadow-sm backdrop-blur-sm">
      <p className="font-medium tabular-nums text-muted-foreground">
        Session {row.label}
      </p>
      <p className="mt-0.5 tabular-nums text-foreground">
        {row.exercises}{" "}
        {row.exercises === 1 ? "exercise" : "exercises"}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{row.shortDate}</p>
    </div>
  );
}

export function CurrentCycleSessionsChart({ data }: CurrentCycleSessionsChartProps) {
  const chartData: ChartRow[] = data.map((p) => ({
    ...p,
    shortDate: formatDateShort(p.endedAt),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-lg border border-border bg-muted/10 text-sm text-muted-foreground">
        No sessions in this cycle yet. Training time will appear here.
      </div>
    );
  }

  return (
    <div className="h-[240px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 6, right: 4, left: 2, bottom: 2 }}
          barCategoryGap="32%"
          barGap={0}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)", strokeOpacity: 0.6 }}
            tickMargin={6}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={22}
            tickMargin={4}
          />
          <Tooltip
            content={<CurrentCycleTooltip />}
            cursor={{ fill: "var(--muted)", fillOpacity: 0.15 }}
            wrapperStyle={{ outline: "none" }}
          />
          <Bar
            dataKey="exercises"
            fill="var(--muted-foreground)"
            fillOpacity={0.35}
            maxBarSize={26}
            radius={[3, 3, 0, 0]}
            activeBar={false}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
