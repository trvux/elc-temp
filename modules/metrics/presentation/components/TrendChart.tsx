"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/shared/components/ui/chart";

import { formatBytes, formatDateTime } from "../../domain/format";
import type { ChartData, ChartUnit } from "../../domain/types";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
// Distinct dash patterns as well as colours, so lines stay distinguishable
// without colour vision (WCAG 1.4.1).
const DASHES = [undefined, "6 3", "2 3", "10 4 2 4", "1 4"];

const nf = (digits: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits });

// Unit is a string key (not a function) because this component is rendered
// from a server component and functions can't cross that boundary.
function formatValue(unit: ChartUnit, v: number): string {
  switch (unit) {
    case "bytes":
      return formatBytes(v);
    case "milliseconds":
      return v >= 1000 ? `${nf(1).format(v / 1000)} giây` : `${nf(0).format(v)} ms`;
    case "percent":
      return `${nf(1).format(v)}%`;
    case "count":
      return nf(v < 10 ? 1 : 0).format(v);
  }
}

function sampleRows(points: ChartData["points"], max: number): ChartData["points"] {
  if (points.length <= max) return points;
  const out: ChartData["points"] = [];
  for (let i = 0; i < max; i++) out.push(points[Math.round((i * (points.length - 1)) / (max - 1))]);
  return out;
}

export function TrendChart({ chart }: { chart: ChartData }) {
  const config: ChartConfig = Object.fromEntries(chart.series.map((s, i) => [s.key, { label: s.label, color: COLORS[i % COLORS.length] }]));

  // A text summary of the first series for people who can't see the line.
  const lead = chart.series[0];
  const leadValues = chart.points.map((p) => p[lead.key]).filter((v): v is number => typeof v === "number");
  const summary =
    leadValues.length > 0
      ? `${lead.label}: mới nhất ${formatValue(chart.unit, leadValues[leadValues.length - 1])}, cao nhất ${formatValue(chart.unit, Math.max(...leadValues))}, thấp nhất ${formatValue(chart.unit, Math.min(...leadValues))}.`
      : "Chưa có số liệu.";

  const rows = sampleRows(chart.points, 12);
  const headingId = `chart-${chart.id}`;

  return (
    <figure className="flex flex-col gap-3 rounded-xl border bg-card p-4" aria-labelledby={headingId}>
      <figcaption>
        <h3 id={headingId} className="text-base font-semibold">
          {chart.title}
        </h3>
        <p className="text-sm text-muted-foreground">{chart.description}</p>
        <p className="mt-1 text-sm">{summary}</p>
      </figcaption>

      <ChartContainer
        config={config}
        className="aspect-auto h-64 w-full [&_.recharts-surface:focus-visible]:outline-2 [&_.recharts-surface:focus-visible]:outline-solid [&_.recharts-surface:focus-visible]:outline-offset-2 [&_.recharts-surface:focus-visible]:outline-ring"
      >
        <LineChart data={chart.points} accessibilityLayer margin={{ left: 8, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickLine={false} axisLine={false} tickMargin={8} minTickGap={48} tickFormatter={(t: number) => formatDateTime(t)} />
          <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => formatValue(chart.unit, v)} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => (payload?.[0] ? formatDateTime(payload[0].payload.t as number) : "")} formatter={(value) => formatValue(chart.unit, Number(value))} />} />
          <ChartLegend content={<ChartLegendContent />} />
          {chart.series.map((s, i) => (
            // No animation: avoids motion for people who ask the OS to reduce it.
            <Line key={s.key} dataKey={s.key} name={s.label} type="monotone" stroke={`var(--color-${s.key})`} strokeWidth={2} strokeDasharray={DASHES[i % DASHES.length]} dot={false} connectNulls isAnimationActive={false} />
          ))}
        </LineChart>
      </ChartContainer>

      <details className="text-sm">
        <summary className="min-h-11 cursor-pointer rounded-md py-2 font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">Xem số liệu dạng bảng</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-96 border-collapse text-left">
            <caption className="pb-2 text-left text-muted-foreground">{chart.title}: {rows.length} mốc thời gian được chọn đều trong khoảng đã chọn.</caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="py-2 pr-4 font-semibold">Thời điểm</th>
                {chart.series.map((s) => (
                  <th key={s.key} scope="col" className="py-2 pr-4 font-semibold">{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.t as number} className="border-b last:border-0">
                  <th scope="row" className="py-2 pr-4 font-normal">{formatDateTime(row.t as number)}</th>
                  {chart.series.map((s) => (
                    <td key={s.key} className="py-2 pr-4 tabular-nums">{typeof row[s.key] === "number" ? formatValue(chart.unit, row[s.key] as number) : "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
