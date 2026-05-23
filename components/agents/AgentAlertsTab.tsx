"use client";

import { RefCard } from "@/components/primitives/RefCard";
import RefBadge from "@/components/primitives/RefBadge";
import RefButton from "@/components/primitives/RefButton";
import { AlertCircle, Check, ExternalLink } from "lucide-react";

export default function AgentAlertsTab({ alerts }: { alerts: any[] }) {
  if (alerts.length === 0) {
    return (
      <RefCard>
        <div className="card-pad text-center" style={{ padding: "40px 24px" }}>
          <Check size={28} style={{ color: "hsl(var(--success))", opacity: 0.6 }} />
          <div style={{ marginTop: 10, fontSize: 13, fontWeight: 500 }}>No active alerts</div>
          <div className="mute" style={{ fontSize: 11.5, marginTop: 4 }}>
            Detectors are green across runs, cost, and latency.
          </div>
        </div>
      </RefCard>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {alerts.map((a, i) => (
        <RefCard key={i}>
          <div className="card-pad flex items-start gap-3" style={{ alignItems: "flex-start" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: `hsl(var(--${a.sev === "error" ? "error" : "warning"}) / 0.15)`,
              color: `hsl(var(--${a.sev === "error" ? "error" : "warning"}))`,
              display: "grid", placeItems: "center", flexShrink: 0,
            }}>
              <AlertCircle size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</span>
                <RefBadge variant={a.sev === "error" ? "error" : "warning"} dot>firing</RefBadge>
              </div>
              <div className="mute" style={{ fontSize: 11.5, marginTop: 4 }}>Triggered {a.when}</div>
            </div>
            <RefButton variant="outline" size="sm">Silence 1h</RefButton>
            <RefButton variant="ghost" size="sm" icon={ExternalLink}>Investigate</RefButton>
          </div>
        </RefCard>
      ))}
    </div>
  );
}
