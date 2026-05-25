"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import type { RagMetrics } from "@/types";

const BUCKET_COLORS: Record<string, string> = {
  "<50ms":     "hsl(var(--success))",
  "50–100ms":  "hsl(var(--success)/0.55)",
  "100–200ms": "hsl(var(--primary-bright))",
  "200–500ms": "hsl(var(--warning))",
  ">500ms":    "hsl(var(--error))",
};

export default function RagLatencyBreakdown({ metrics }: { metrics: RagMetrics }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10 }}>
        {[
          { label: "P50", value: metrics.p50LatencyMs, accent: "hsl(var(--success))" },
          { label: "P95", value: metrics.p95LatencyMs, accent: "hsl(var(--warning))" },
          { label: "P99", value: metrics.p99LatencyMs, accent: "hsl(var(--error))" },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            style={{
              flex: 1,
              background: "linear-gradient(180deg, hsl(var(--card-elev)), hsl(var(--card)))",
              border: `1px solid hsl(var(--border)/0.35)`,
              borderTop: `2px solid ${accent}`,
              borderRadius: "0.375rem",
              padding: "10px 12px",
              textAlign: "center",
              fontFamily: "var(--font-mono)",
            }}
          >
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, color: "hsl(var(--muted-foreground))", marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontSize: "1.375rem", fontWeight: 700, lineHeight: 1, color: accent, fontVariantNumeric: "tabular-nums" }}>
              {Math.round(value)}ms
            </div>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={metrics.latencyDistribution}
          margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.06} />
          <XAxis
            dataKey="bucket"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "currentColor", opacity: 0.45 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "currentColor", opacity: 0.45 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid hsl(var(--border)/0.35)",
              backgroundColor: "hsl(var(--card))",
              color: "hsl(var(--card-foreground))",
              fontSize: 12,
            }}
            formatter={(v: number) => [v.toLocaleString(), "Queries"]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {metrics.latencyDistribution.map((entry, idx) => (
              <Cell
                key={idx}
                fill={BUCKET_COLORS[entry.bucket] ?? "hsl(var(--primary-bright))"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
