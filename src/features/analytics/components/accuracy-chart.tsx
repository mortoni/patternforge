"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatPercentageFromFraction } from "@/lib/format-percentage";
import { formatDateShort } from "@/lib/format-date";
import type { AccuracySeriesPoint } from "@/services/analytics.service";

export interface AccuracyChartProps {
  data: AccuracySeriesPoint[];
}

function toChartRow(
  point: AccuracySeriesPoint,
  index: number
): { index: number; label: string; accuracy: number; shortDate: string } {
  return {
    index: index + 1,
    label: point.label.length > 12 ? point.label.slice(0, 12) + "…" : point.label,
    accuracy: point.accuracy,
    shortDate: formatDateShort(point.endedAt),
  };
}

export function AccuracyChart({ data }: AccuracyChartProps) {
  const chartData = data.map(toChartRow).reverse();
  if (chartData.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)]/10 text-sm text-[var(--muted-foreground)]">
        No session data yet. Complete a training cycle to see accuracy.
      </div>
    );
  }
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            dataKey="accuracy"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            domain={[0, 1]}
            tickLine={false}
            width={36}
          />
          <Tooltip
            formatter={(value: unknown) => [
              formatPercentageFromFraction(Number(value ?? 0), 0),
              "Accuracy",
            ]}
            labelFormatter={(_, payload) =>
              payload[0]?.payload?.shortDate ?? ""
            }
          />
          <Bar
            dataKey="accuracy"
            fill="hsl(220 35% 45%)"
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill="hsl(220 35% 45%)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
