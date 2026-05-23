"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import CodeBlock from "@/components/shared/CodeBlock";
import { api } from "@/lib/api";
import type { RetentionPolicy } from "@/types";

const MOCK_RETENTION: RetentionPolicy[] = [
  { tier: "Traces", duration: "30 days", pct: 0.7 },
  { tier: "LLM I/O", duration: "14 days", pct: 0.45 },
  { tier: "Tool I/O", duration: "30 days", pct: 0.7 },
  { tier: "Annotations", duration: "forever", pct: 1.0 },
];

export default function SettingsPage() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>(MOCK_RETENTION);

  useEffect(() => {
    api.getRetentionPolicies()
      .then((res) => setPolicies(res.length > 0 ? res : MOCK_RETENTION))
      .catch(() => setPolicies(MOCK_RETENTION));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Settings"
        sub="Configure Chorus Observe ingest, retention, and notifications."
      />
      <div className="split-2">
        <RefCard>
          <CardHeader title="OTLP endpoint" sub="Send traces to Chorus Observe." />
          <div className="card-pad flex flex-col gap-3">
            <div>
              <div className="mute" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 4 }}>HTTP</div>
              <CodeBlock style={{ padding: 10, fontSize: 11, maxHeight: 40 }}>https://otlp.chorus.observe/v1/traces</CodeBlock>
            </div>
            <div>
              <div className="mute" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 4 }}>gRPC</div>
              <CodeBlock style={{ padding: 10, fontSize: 11, maxHeight: 40 }}>otlp.chorus.observe:4317</CodeBlock>
            </div>
            <div>
              <div className="mute" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 4 }}>Project token</div>
              <CodeBlock style={{ padding: 10, fontSize: 11, maxHeight: 40 }}>chs_prod_8f3c•••••••••••••61cc</CodeBlock>
            </div>
          </div>
        </RefCard>
        <RefCard>
          <CardHeader title="Retention" sub="Hot storage windows by tier" />
          <div className="card-pad flex flex-col gap-3">
            {policies.map((p) => (
              <div key={p.tier} className="flex flex-col gap-1">
                <div className="flex items-center justify-between" style={{ fontSize: 12 }}>
                  <span>{p.tier}</span>
                  <span className="mono tabular mute">{p.duration}</span>
                </div>
                <div style={{ height: 4, background: "hsl(var(--muted) / 0.5)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${p.pct * 100}%`, height: "100%", background: "hsl(var(--primary))" }} />
                </div>
              </div>
            ))}
          </div>
        </RefCard>
      </div>
    </div>
  );
}
