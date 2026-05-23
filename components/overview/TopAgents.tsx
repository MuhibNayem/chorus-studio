"use client";

import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import { formatTokens, formatDuration } from "@/lib/utils";

export default function TopAgents({ agents }: {
  agents: { id: string; framework: string; runs: number; cost: number; p95: number; errors: number }[];
}) {
  const maxRuns = agents[0]?.runs ?? 1;

  return (
    <RefCard>
      <CardHeader title="Top agents" sub="By volume · last 24h" />
      <div>
        {agents.map((a, i) => (
          <div
            key={a.id}
            style={{
              display: "grid",
              gridTemplateColumns: "20px 1fr 60px 60px 60px",
              gap: 12,
              alignItems: "center",
              padding: "10px 20px",
              borderTop: i === 0 ? "none" : "1px solid hsl(var(--border))",
              fontSize: 12,
            }}
          >
            <div className="mono tabular mute">{String(i + 1).padStart(2, "0")}</div>
            <div style={{ minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 11.5, fontWeight: 500 }}>{a.id}</div>
              <div className="flex items-center gap-1.5" style={{ marginTop: 2 }}>
                <span style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}>{a.framework}</span>
                <div style={{ height: 3, flex: 1, background: "hsl(var(--muted) / 0.5)", borderRadius: 2, overflow: "hidden", maxWidth: 120 }}>
                  <div style={{
                    width: `${(a.runs / maxRuns) * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-bright)))",
                  }} />
                </div>
              </div>
            </div>
            <div className="mono tabular" style={{ textAlign: "right" }}>{formatTokens(a.runs)}</div>
            <div className="mono tabular mute" style={{ textAlign: "right" }}>{formatDuration(a.p95)}</div>
            <div className="mono tabular" style={{ textAlign: "right", color: a.errors > 100 ? "hsl(var(--error))" : "hsl(var(--muted-foreground))" }}>
              {a.errors}
            </div>
          </div>
        ))}
      </div>
    </RefCard>
  );
}
