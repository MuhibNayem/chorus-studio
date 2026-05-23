"use client";

import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import RefBadge from "@/components/primitives/RefBadge";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function generateHeatmap(): number[][] {
  return Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hr) => {
      if (hr < 5 || hr > 22) return Math.random() < 0.5 ? 0 : 1;
      const peak = 14 + Math.sin(day) * 2;
      const dist = Math.abs(hr - peak);
      const v = Math.max(0, 4 - Math.floor(dist * 0.8) + (Math.random() > 0.7 ? 1 : 0));
      return Math.min(4, v);
    })
  );
}

function normalizeGrid(data: number[][]): number[][] {
  const flat = data.flat();
  const max = Math.max(...flat, 1);
  return data.map((row) => row.map((v) => Math.min(4, Math.round((v / max) * 4))));
}

export default function ActivityHeatmap({ data }: { data?: number[][] }) {
  const heatmap = data && data.length === 7 && data[0]?.length === 24
    ? normalizeGrid(data)
    : generateHeatmap();

  return (
    <RefCard>
      <CardHeader title="Activity" sub="Run volume by hour, last 7 days" right={<RefBadge variant="muted">PT</RefBadge>} />
      <div className="card-pad">
        <div style={{ display: "grid", gridTemplateColumns: "36px 1fr", gap: 6 }}>
          <div />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(24, 1fr)", gap: 3, marginBottom: 2 }}>
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", textAlign: "center", fontFamily: "var(--font-mono)" }}>
                {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
              </div>
            ))}
          </div>
          {DAYS.map((day, di) => (
            <div key={day} className="contents">
              <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", fontWeight: 500, alignSelf: "center" }}>{day}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(24, 1fr)", gap: 3 }}>
                {heatmap[di].map((v, hi) => (
                  <div
                    key={hi}
                    className="heatmap-cell"
                    data-v={v}
                    style={{
                      display: "block",
                      aspectRatio: "1.2/1",
                      borderRadius: 2,
                      background: v === 0 ? "hsl(var(--muted) / 0.4)" : `hsl(var(--primary) / ${0.18 + v * 0.18})`,
                    }}
                    title={`${day} ${String(hi).padStart(2, "0")}:00 — ${v} runs`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1.5" style={{ marginTop: 12, fontSize: 10, color: "hsl(var(--muted-foreground))" }}>
          <span>less</span>
          {[0, 1, 2, 3, 4].map((v) => (
            <div
              key={v}
              style={{
                width: 12, height: 12, borderRadius: 2,
                background: v === 0 ? "hsl(var(--muted) / 0.4)" : `hsl(var(--primary) / ${0.18 + v * 0.18})`,
              }}
            />
          ))}
          <span>more</span>
        </div>
      </div>
    </RefCard>
  );
}
