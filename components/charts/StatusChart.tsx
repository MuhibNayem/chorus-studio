"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = {
  SUCCESS: "hsl(142 71% 45%)",
  ERROR: "hsl(0 84% 60%)",
  RUNNING: "hsl(38 92% 50%)",
};

export default function StatusChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  const formatted = data.map((d) => ({
    name: d.status,
    value: d.count,
    color: COLORS[d.status as keyof typeof COLORS] ?? "hsl(214.3 31.8% 91.4%)",
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={formatted}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
          dataKey="value"
        >
          {formatted.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid hsl(214.3 31.8% 91.4%)" }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
