"use client";

import { RefCard, CardHeader } from "@/components/primitives/RefCard";

export default function StatusDonut({ data }: {
  data: { status: string; count: number; pct?: number }[];
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const colors: Record<string, string> = {
    SUCCESS: "hsl(var(--success))",
    ERROR: "hsl(var(--error))",
    RUNNING: "hsl(var(--warning))",
  };

  if (total === 0) {
    return (
      <RefCard>
        <CardHeader title="Status" sub="Last 24h outcomes" />
        <div className="card-pad" style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>
          No runs yet in this window.
        </div>
      </RefCard>
    );
  }

  let cur = 0;
  const stops = data.map((d) => {
    const pct = (d.count / total) * 100;
    const seg = `${colors[d.status] ?? "hsl(var(--muted))"} ${cur}% ${cur + pct}%`;
    cur += pct;
    return seg;
  }).join(", ");

  const successCount = data.find((d) => d.status === "SUCCESS")?.count ?? 0;
  const okPct = ((successCount / total) * 100).toFixed(1);

  return (
    <RefCard>
      <CardHeader title="Status" sub="Last 24h outcomes" />
      <div className="card-pad">
        <div className="flex items-center gap-6">
          <div
            style={{
              width: 124, height: 124, borderRadius: "50%",
              background: `conic-gradient(${stops})`,
              position: "relative",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute", inset: 18, borderRadius: "50%",
                background: "hsl(var(--card))",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <div className="mono tabular" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.03em" }}>
                {okPct}%
              </div>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>OK</div>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-2.5">
            {data.map((d) => (
              <div key={d.status} className="flex items-center justify-between" style={{ fontSize: 12 }}>
                <div className="flex items-center gap-2">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: colors[d.status] }} />
                  <span className="mute capitalize">{d.status.toLowerCase()}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="mono tabular" style={{ fontWeight: 600 }}>{d.count.toLocaleString()}</span>
                  <span className="mono tabular mute" style={{ minWidth: 42, textAlign: "right" }}>{d.pct?.toFixed(1) ?? ((d.count / total) * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RefCard>
  );
}
