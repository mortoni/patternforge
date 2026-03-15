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
import { formatDurationMs } from "@/lib/format-duration";
import { formatDateShort } from "@/lib/format-date";
import type { SessionDurationSeriesPoint } from "@/services/analytics.service";

export interface SessionDurationChartProps {
  data: SessionDurationSeriesPoint[];
}

/** Chart data row: label for axis, duration in ms, display label. */
function toChartRow(
  point: SessionDurationSeriesPoint,
  index: number
): { index: number; label: string; activeTimeMs: number; shortDate: string } {
  return {
    index: index + 1,
    label: point.label.length > 12 ? point.label.slice(0, 12) + "…" : point.label,
    activeTimeMs: point.activeTimeMs,
    shortDate: formatDateShort(point.endedAt),
  };
}

export function SessionDurationChart({ data }: SessionDurationChartProps) {
  const chartData = data.map(toChartRow).reverse();
  if (chartData.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)]/10 text-sm text-[var(--muted-foreground)]">
        No session data yet. Complete a training cycle to see durations.
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
            tick={{ fontSize: 11 }}
            tickFormatter={(ms: number) => `${Math.round(ms / 60000)}m`}
            tickLine={false}
            width={32}
          />
          <Tooltip
            formatter={(value: unknown) => [formatDurationMs(Number(value ?? 0)), "Duration"]}
            labelFormatter={(_, payload) =>
              payload[0]?.payload?.shortDate ?? ""
            }
          />
          <Bar
            dataKey="activeTimeMs"
            fill="var(--primary)"
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((_, i) => (
              <Cell
                key={i}
                fill="hsl(220 35% 45%)"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
