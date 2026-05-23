"use client";

import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import RefBadge from "@/components/primitives/RefBadge";
import { RefCard } from "@/components/primitives/RefCard";
import { Plus, AlertCircle, ExternalLink } from "lucide-react";

const ALERTS = [
  { sev: "error", title: "Error rate > 5% on ag_research", sub: "Triggered 12m ago · claude-3-5-sonnet · 132 of 2k runs", evt: "firing" },
  { sev: "warning", title: "p95 latency > 5s on ag_research", sub: "Triggered 38m ago · degrading since 14:20", evt: "firing" },
  { sev: "warning", title: "Spend pacing > $400/d", sub: "Triggered 2h ago · projected $487 by midnight", evt: "firing" },
  { sev: "success", title: "Guardrail toxicity@v3 — all green", sub: "Resolved 4h ago · auto-cleared", evt: "resolved" },
];

export default function AlertsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Alerts"
        accent="/ 3 active"
        sub="Threshold + anomaly detectors, page on call."
        actions={<RefButton variant="primary" icon={Plus}>New alert</RefButton>}
      />
      <div className="flex flex-col gap-3">
        {ALERTS.map((a, i) => (
          <RefCard key={i}>
            <div className="card-pad flex items-start gap-3" style={{ alignItems: "flex-start" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 6,
                background: `hsl(var(--${a.sev === "error" ? "error" : a.sev === "warning" ? "warning" : "success"}) / 0.15)`,
                color: `hsl(var(--${a.sev === "error" ? "error" : a.sev === "warning" ? "warning" : "success"}))`,
                display: "grid", placeItems: "center", flexShrink: 0,
              }}>
                <AlertCircle size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</span>
                  <RefBadge variant={a.evt === "firing" ? "error" : "success"} dot>{a.evt}</RefBadge>
                </div>
                <div className="mute" style={{ fontSize: 11.5, marginTop: 4 }}>{a.sub}</div>
              </div>
              <RefButton variant="outline" size="sm">Silence 1h</RefButton>
              <RefButton variant="ghost" size="sm" icon={ExternalLink}>Open</RefButton>
            </div>
          </RefCard>
        ))}
      </div>
    </div>
  );
}
