"use client";

import PageHeader from "@/components/shared/PageHeader";
import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import CodeBlock from "@/components/shared/CodeBlock";

export default function SettingsPage() {
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
            {[
              ["Traces", "30 days", 0.7],
              ["LLM I/O", "14 days", 0.45],
              ["Tool I/O", "30 days", 0.7],
              ["Annotations", "forever", 1.0],
            ].map(([k, v, p]) => (
              <div key={k} className="flex flex-col gap-1">
                <div className="flex items-center justify-between" style={{ fontSize: 12 }}>
                  <span>{k}</span>
                  <span className="mono tabular mute">{v}</span>
                </div>
                <div style={{ height: 4, background: "hsl(var(--muted) / 0.5)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${(p as number) * 100}%`, height: "100%", background: "hsl(var(--primary))" }} />
                </div>
              </div>
            ))}
          </div>
        </RefCard>
      </div>
    </div>
  );
}
