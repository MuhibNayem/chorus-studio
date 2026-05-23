"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "#10b981",
  ERROR:   "#ef4444",
  RUNNING: "#f59e0b",
};

export default function StatusChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  const formatted = data.map((d) => ({
    name: d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] ?? "#94a3b8",
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={formatted}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {formatted.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid var(--border)",
            backgroundColor: "var(--card)",
            color: "var(--card-foreground)",
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => [value.toLocaleString(), name]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
          formatter={(value) => value.charAt(0) + value.slice(1).toLowerCase()}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
