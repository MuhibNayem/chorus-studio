"use client";

import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import RefBadge from "@/components/primitives/RefBadge";
import CodeBlock from "@/components/shared/CodeBlock";
import { formatTokens, formatCost, formatDuration } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import type { LlmCall } from "@/types";

export default function LlmCallList({ calls }: { calls: LlmCall[] }) {
  if (calls.length === 0) {
    return (
      <RefCard>
        <div className="card-pad text-center" style={{ padding: "48px 24px", color: "hsl(var(--muted-foreground))" }}>
          No LLM calls recorded for this run.
        </div>
      </RefCard>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {calls.map((c) => (
        <RefCard key={c.callId}>
          <div className="card-h" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-2">
              <RefBadge variant="llm"><Sparkles size={9} /> LLM</RefBadge>
              <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{c.model}</span>
              <RefBadge variant="muted">{c.provider}</RefBadge>
            </div>
            <div className="flex items-center gap-3 mono tabular mute" style={{ fontSize: 11 }}>
              <span>{formatTokens(c.inputTokens)} → {formatTokens(c.outputTokens)} tok</span>
              <span>{formatCost(c.costUsd)}</span>
              <span>{formatDuration(c.latencyMs)}</span>
            </div>
          </div>
          <div className="card-pad flex flex-col gap-2">
            {c.prompt && (
              <CodeBlock>
                <span className="system">system:</span> {c.prompt}
              </CodeBlock>
            )}
            {c.completion && (
              <CodeBlock style={{ borderColor: "hsl(var(--primary) / 0.4)", background: "hsl(var(--primary) / 0.05)" }}>
                <span className="role">assistant:</span> {c.completion}
              </CodeBlock>
            )}
          </div>
        </RefCard>
      ))}
    </div>
  );
}
