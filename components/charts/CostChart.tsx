"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CostChart({
  data,
}: {
  data: { date: string; count: number; tokens: number; cost: number }[];
}) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid hsl(214.3 31.8% 91.4%)" }}
          formatter={(value: number, name: string) => [
            name === "cost" ? `$${value.toFixed(3)}` : value.toLocaleString(),
            name === "cost" ? "Cost" : "Tokens",
          ]}
        />
        <Area
          type="monotone"
          dataKey="cost"
          stroke="hsl(217 91% 60%)"
          fillOpacity={1}
          fill="url(#colorCost)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="tokens"
          stroke="hsl(142 71% 45%)"
          fillOpacity={1}
          fill="url(#colorTokens)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
