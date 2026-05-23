"use client";

import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import RefButton from "@/components/primitives/RefButton";
import { AlertCircle, Pause, X, Plus } from "lucide-react";

export default function AgentSettingsTab({ agent }: { agent: any }) {
  const fields = [
    { lbl: "Agent ID", v: agent.id, mono: true, readonly: true },
    { lbl: "Display name", v: agent.name },
    { lbl: "Description", v: agent.description },
    { lbl: "Framework", v: agent.framework, readonly: true },
    { lbl: "Runtime", v: agent.runtime, mono: true, readonly: true },
    { lbl: "Repository", v: agent.repo, mono: true },
    { lbl: "Branch", v: agent.branch, mono: true },
  ];

  return (
    <div className="split-2">
      <RefCard>
        <CardHeader title="Identity" sub="How this agent shows up everywhere" />
        <div className="card-pad flex flex-col gap-3">
          {fields.map(({ lbl, v, mono, readonly }) => (
            <div key={lbl}>
              <div className="mute" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 5 }}>
                {lbl}
                {readonly && <span style={{ marginLeft: 6, opacity: 0.6, textTransform: "none" }}>· locked</span>}
              </div>
              <input
                className="ref-input"
                style={{
                  fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
                  fontSize: mono ? 11.5 : 13,
                  color: readonly ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
                }}
                defaultValue={v}
                readOnly={readonly}
              />
            </div>
          ))}
        </div>
      </RefCard>

      <div className="flex flex-col gap-4">
        <RefCard>
          <CardHeader title="Ownership" />
          <div className="card-pad flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="mute" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Team</div>
                <div style={{ fontSize: 13, marginTop: 4, fontFamily: "var(--font-mono)" }}>{agent.owner}</div>
              </div>
              <div>
                <div className="mute" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>On-call</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{agent.ownerEmail}</div>
              </div>
            </div>
            <div>
              <div className="mute" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 6 }}>Tags</div>
              <div className="flex flex-wrap gap-1.5">
                {agent.tags.map((t: string) => <span key={t} className="filter-chip">{t}</span>)}
                <button className="filter-chip" style={{ borderStyle: "dashed" }}><Plus size={10} />Tag</button>
              </div>
            </div>
          </div>
        </RefCard>

        <RefCard>
          <CardHeader title="Retention" sub="Per-agent overrides" />
          <div className="card-pad flex flex-col gap-3">
            {[
              ["Traces", "30 days", 0.7],
              ["LLM I/O", "14 days", 0.45],
              ["Tool I/O", "30 days", 0.7],
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

        <RefCard>
          <div className="card-pad flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} style={{ color: "hsl(var(--error))" }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Danger zone</span>
            </div>
            <div className="mute" style={{ fontSize: 11.5 }}>
              Pausing stops ingest for this agent. Deletion removes it from the workspace; traces are retained per policy.
            </div>
            <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
              <RefButton variant="outline" icon={Pause}>Pause ingest</RefButton>
              <RefButton variant="danger" icon={X}>Delete agent</RefButton>
            </div>
          </div>
        </RefCard>
      </div>
    </div>
  );
}
