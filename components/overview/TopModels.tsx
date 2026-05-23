"use client";

import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import { formatTokens } from "@/lib/utils";

export default function TopModels({ models }: {
  models: { model: string; provider: string; runs: number; tokens: number; cost: number }[];
}) {
  const maxCost = Math.max(...models.map((x) => x.cost));

  return (
    <RefCard>
      <CardHeader title="Top models" sub="By spend · last 24h" />
      <div>
        {models.map((m, i) => {
          const provColor =
            m.provider === "openai" ? "hsl(var(--tool))" :
            m.provider === "anthropic" ? "hsl(var(--guardrail))" :
            "hsl(var(--llm))";
          return (
            <div
              key={m.model}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 80px",
                gap: 12,
                alignItems: "center",
                padding: "12px 20px",
                borderTop: i === 0 ? "none" : "1px solid hsl(var(--border))",
                fontSize: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div className="flex items-center gap-2">
                  <span style={{ width: 6, height: 6, borderRadius: 2, background: provColor }} />
                  <span className="mono" style={{ fontWeight: 500 }}>{m.model}</span>
                  <span className="mute" style={{ fontSize: 10 }}>{m.provider}</span>
                </div>
                <div style={{ marginTop: 6, height: 4, background: "hsl(var(--muted) / 0.5)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    width: `${(m.cost / maxCost) * 100}%`,
                    height: "100%",
                    background: provColor,
                    opacity: 0.85,
                  }} />
                </div>
              </div>
              <div className="mono tabular mute" style={{ textAlign: "right" }}>{formatTokens(m.tokens)}</div>
              <div className="mono tabular" style={{ textAlign: "right", fontWeight: 500 }}>${m.cost.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
    </RefCard>
  );
}
