"use client";

import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import RefBadge from "@/components/primitives/RefBadge";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function normalizeGrid(data: number[][]): { level: number; count: number }[][] {
  const flat = data.flat();
  const max = Math.max(...flat, 1);
  return data.map((row) =>
    row.map((count) => ({ count, level: Math.min(4, Math.round((count / max) * 4)) }))
  );
}

export default function ActivityHeatmap({ data }: { data?: number[][] }) {
  const hasData = data && data.length === 7 && data[0]?.length === 24;
  const totalRuns = hasData ? data!.flat().reduce((s, v) => s + v, 0) : 0;

  if (!hasData || totalRuns === 0) {
    return (
      <RefCard>
        <CardHeader title="Activity" sub="Run volume by hour, last 7 days" right={<RefBadge variant="muted">PT</RefBadge>} />
        <div className="card-pad" style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>
          No run data yet for this window.
        </div>
      </RefCard>
    );
  }

  const heatmap = normalizeGrid(data!);

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
                {heatmap[di].map(({ level, count }, hi) => (
                  <div
                    key={hi}
                    className="heatmap-cell"
                    data-v={level}
                    style={{
                      display: "block",
                      aspectRatio: "1.2/1",
                      borderRadius: 2,
                      background: level === 0 ? "hsl(var(--muted) / 0.4)" : `hsl(var(--primary) / ${0.18 + level * 0.18})`,
                    }}
                    title={`${day} ${String(hi).padStart(2, "0")}:00 — ${count} runs`}
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
