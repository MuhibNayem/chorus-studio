"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import type { RagTrendPoint } from "@/types";

const formatPeriod = (p: string) => {
  const d = new Date(p);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", hour12: false }).replace(", ", " ");
};

const LINES = [
  { key: "avg_precision",        label: "Precision",        color: "hsl(var(--primary-bright))" },
  { key: "avg_recall",           label: "Recall",           color: "hsl(var(--success))" },
  { key: "avg_faithfulness",     label: "Faithfulness",     color: "hsl(var(--warning))" },
  { key: "avg_answer_relevancy", label: "Answer Relevancy", color: "hsl(var(--rag))" },
] as const;

interface Props {
  trend: RagTrendPoint[];
  showLatency?: boolean;
}

export default function RagTrendChart({ trend, showLatency = false }: Props) {
  const data = trend.map(p => ({
    ...p,
    period: formatPeriod(p.period),
    avg_precision:        Math.round(p.avg_precision        * 1000) / 10,
    avg_recall:           Math.round(p.avg_recall           * 1000) / 10,
    avg_faithfulness:     Math.round(p.avg_faithfulness     * 1000) / 10,
    avg_answer_relevancy: Math.round(p.avg_answer_relevancy * 1000) / 10,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-muted-foreground text-xs mono">
        No trend data for this window
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.07} />
        <XAxis
          dataKey="period"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid var(--border)",
            backgroundColor: "var(--card)",
            color: "var(--card-foreground)",
            fontSize: 12,
          }}
          formatter={(v: number, name: string) => [`${v}%`, name]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        {LINES.map(({ key, label, color }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={label}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
