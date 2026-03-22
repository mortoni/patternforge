"use client";

import * as React from "react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDurationMs, formatDurationMsChartAxis } from "@/lib/format-duration";
import type { AnalyticsCycleHistoryRow } from "@/services/analytics-page.service";

function medianMs(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export interface ReflectionCyclesTimeChartProps {
  /** Completed cycles for a single training set, any order. */
  rows: AnalyticsCycleHistoryRow[];
}

type Point = {
  cycleNumber: number;
  totalTimeMs: number;
};

export function ReflectionCyclesTimeChart({ rows }: ReflectionCyclesTimeChartProps) {
  const data = React.useMemo<Point[]>(() => {
    return [...rows].sort((a, b) => {
      const n = a.cycleNumber - b.cycleNumber;
      if (n !== 0) return n;
      return (a.completedAt ?? "").localeCompare(b.completedAt ?? "");
    });
  }, [rows]);

  const med = React.useMemo(
    () => medianMs(data.map((d) => d.totalTimeMs)),
    [data]
  );

  const xDomain = React.useMemo(() => {
    if (data.length === 0) return [0, 1] as [number, number];
    const lo = Math.min(...data.map((d) => d.cycleNumber));
    const hi = Math.max(...data.map((d) => d.cycleNumber));
    const span = hi - lo;
    const pad = span === 0 ? 0.5 : Math.max(0.35, span * 0.06);
    return [lo - pad, hi + pad] as [number, number];
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-lg border border-border/60 bg-muted/10 text-sm text-muted-foreground">
        No cycles to chart yet.
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 12, left: 4, bottom: 8 }}
        >
          <XAxis
            dataKey="cycleNumber"
            type="number"
            domain={xDomain}
            ticks={[...new Set(data.map((d) => d.cycleNumber))].sort(
              (a, b) => a - b
            )}
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)", strokeOpacity: 0.45 }}
            label={{
              value: "Cycle",
              position: "insideBottom",
              offset: -4,
              style: {
                fontSize: 10,
                fill: "var(--muted-foreground)",
              },
            }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v) => formatDurationMsChartAxis(Number(v))}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || payload == null || payload.length === 0)
                return null;
              const p = payload[0]?.payload as Point | undefined;
              if (!p) return null;
              return (
                <div className="rounded-md border border-border/60 bg-card/95 px-2.5 py-2 text-xs shadow-sm backdrop-blur-sm">
                  <p className="font-medium tabular-nums text-muted-foreground">
                    Cycle {p.cycleNumber}
                  </p>
                  <p className="mt-0.5 tabular-nums text-foreground">
                    {formatDurationMs(p.totalTimeMs)}
                  </p>
                </div>
              );
            }}
          />
          {med > 0 && data.length >= 1 ? (
            <ReferenceLine
              y={med}
              stroke="var(--muted-foreground)"
              strokeOpacity={0.45}
              strokeDasharray="4 4"
              label={{
                value: "Median",
                position: "insideTopRight",
                fill: "var(--muted-foreground)",
                fontSize: 11,
              }}
            />
          ) : null}
          <Line
            type="monotone"
            dataKey="totalTimeMs"
            stroke="var(--muted-foreground)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--muted-foreground)", strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
