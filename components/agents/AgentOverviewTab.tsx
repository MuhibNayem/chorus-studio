"use client";

import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import AgentActivityChart from "./AgentActivityChart";
import { formatTokens, formatDuration } from "@/lib/utils";
import { Wrench } from "lucide-react";

export default function AgentOverviewTab({ agent }: { agent: any }) {
  const maxCalls = Math.max(...agent.tools.map((t: any) => t.calls));

  return (
    <div className="flex flex-col gap-4">
      <RefCard>
        <CardHeader title="Activity" sub="Runs + latency · last 24h" right={
          <div className="flex items-center gap-3" style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
            <span className="flex items-center gap-1">
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "hsl(var(--primary) / 0.35)" }} />
              Runs
            </span>
            <span className="flex items-center gap-1">
              <span style={{ width: 14, height: 2, background: "hsl(var(--primary-bright))" }} />
              p95 latency
            </span>
          </div>
        } />
        <div className="card-pad" style={{ paddingTop: 10 }}>
          <div style={{ height: 220 }}>
            <AgentActivityChart runsSpark={agent.runs24hSpark} latencySpark={agent.latencySpark} />
          </div>
        </div>
      </RefCard>

      <div className="split-2">
        <RefCard>
          <CardHeader title="Tool usage" sub={`${agent.tools.length} tools registered`} />
          <div>
            {agent.tools.length === 0 ? (
              <div className="card-pad mute" style={{ fontSize: 12, padding: "24px 20px" }}>This agent makes no tool calls.</div>
            ) : agent.tools.map((t: any, i: number) => (
              <div key={t.name} style={{
                display: "grid",
                gridTemplateColumns: "1fr 70px 50px",
                gap: 12,
                alignItems: "center",
                padding: "12px 20px",
                borderTop: i === 0 ? "none" : "1px solid hsl(var(--border))",
              }}>
                <div style={{ minWidth: 0 }}>
                  <div className="flex items-center gap-2">
                    <Wrench size={11} style={{ color: "hsl(var(--tool))" }} />
                    <code className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{t.name}()</code>
                  </div>
                  <div style={{ marginTop: 6, height: 4, background: "hsl(var(--muted) / 0.5)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${(t.calls / maxCalls) * 100}%`, height: "100%", background: "hsl(var(--tool))", opacity: 0.85 }} />
                  </div>
                </div>
                <div className="mono tabular mute" style={{ textAlign: "right", fontSize: 11 }}>{formatDuration(t.p95)}</div>
                <div className="mono tabular" style={{ textAlign: "right", fontSize: 11,
                  color: t.errRate > 0.02 ? "hsl(var(--error))" : t.errRate > 0 ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))" }}>
                  {(t.errRate * 100).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </RefCard>

        <RefCard>
          <CardHeader title="Model distribution" sub="By share of runs" />
          <div className="card-pad" style={{ paddingTop: 14 }}>
            <div style={{ display: "flex", height: 24, borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
              {agent.models.map((m: any, i: number) => {
                const c = m.provider === "openai" ? "hsl(var(--tool))" :
                  m.provider === "anthropic" ? "hsl(var(--guardrail))" :
                  "hsl(var(--llm))";
                return <div key={m.model} style={{ width: `${m.pct}%`, background: c, opacity: 0.9 }} title={`${m.model} · ${m.pct}%`} />;
              })}
            </div>
            <div className="flex flex-col gap-2">
              {agent.models.map((m: any) => {
                const c = m.provider === "openai" ? "hsl(var(--tool))" :
                  m.provider === "anthropic" ? "hsl(var(--guardrail))" :
                  "hsl(var(--llm))";
                return (
                  <div key={m.model} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                      <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{m.model}</span>
                      <span className="mute" style={{ fontSize: 10 }}>{m.provider}</span>
                    </div>
                    <div className="flex items-center gap-4" style={{ fontSize: 11 }}>
                      <span className="mono tabular mute">{m.pct}%</span>
                      <span className="mono tabular" style={{ fontWeight: 500, minWidth: 50, textAlign: "right" }}>${m.cost.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </RefCard>
      </div>
    </div>
  );
}
