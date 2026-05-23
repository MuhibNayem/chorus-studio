"use client";

import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import RefBadge from "@/components/primitives/RefBadge";
import RefButton from "@/components/primitives/RefButton";
import { GitBranch } from "lucide-react";

export default function AgentDeploymentsTab({ deployments }: { deployments: any[] }) {
  return (
    <RefCard>
      <CardHeader title="Version history" sub="Most recent first" />
      <div style={{ position: "relative" }}>
        {deployments.map((d, i) => (
          <div key={d.version} style={{
            display: "grid",
            gridTemplateColumns: "110px 90px 1fr 130px",
            gap: 16,
            alignItems: "center",
            padding: "14px 20px",
            borderTop: i === 0 ? "none" : "1px solid hsl(var(--border))",
            position: "relative",
          }}>
            <div style={{
              position: "absolute",
              left: 24, top: 0, bottom: 0,
              width: 1, background: "hsl(var(--border))",
              zIndex: 0,
            }} />
            <div className="flex items-center gap-2" style={{ position: "relative", zIndex: 1 }}>
              <div style={{
                width: 9, height: 9, borderRadius: "50%",
                background: d.state === "active" ? "hsl(var(--success))" : "hsl(var(--muted-foreground) / 0.5)",
                boxShadow: d.state === "active" ? "0 0 0 4px hsl(var(--success) / 0.18)" : "none",
                flexShrink: 0,
              }} />
              <code className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{d.version}</code>
              {d.state === "active" && <RefBadge variant="success">live</RefBadge>}
            </div>
            <div className="mono tabular mute" style={{ fontSize: 11 }}>{d.when}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontFamily: "var(--font-mono)" }}>{d.diff}</div>
              <div className="mute" style={{ fontSize: 10, marginTop: 3 }}>
                by <span className="mono">{d.by}</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1">
              <RefButton size="sm" variant="ghost" icon={GitBranch}>diff</RefButton>
              {d.state !== "active" && <RefButton size="sm" variant="outline">Roll back</RefButton>}
            </div>
          </div>
        ))}
      </div>
    </RefCard>
  );
}
