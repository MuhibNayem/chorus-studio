"use client";

import Link from "next/link";
import RefBadge from "@/components/primitives/RefBadge";
import RefButton from "@/components/primitives/RefButton";
import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import MiniTrace from "@/components/primitives/MiniTrace";
import { formatTokens, formatCost, formatDuration, formatRel } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import type { Run } from "@/types";

function generateDeterministicMix(runId: string | undefined, framework: string | undefined): [string, number][] {
  if (!runId) return [["llm", 60], ["tool", 40]];
  let hash = 0;
  for (let i = 0; i < runId.length; i++) {
    hash = ((hash << 5) - hash) + runId.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);
  const mix: [string, number][] = [];
  
  mix.push(["llm", 20 + (seed % 40)]);
  if (framework === "Chorus" || (seed % 3 === 0)) {
    mix.push(["tool", 10 + (seed % 20)]);
  }
  if (seed % 2 === 0) {
    mix.push(["rag", 15 + (seed % 30)]);
  }
  if (seed % 5 === 0) {
    mix.push(["guardrail", 5 + (seed % 10)]);
  }
  if (mix.length < 3) {
    mix.push(["tool", 8 + (seed % 12)]);
  }
  
  return mix;
}

function StatusBadge({ status }: { status: Run["status"] }) {
  const map: Record<string, { v: string; label: string }> = {
    SUCCESS: { v: "success", label: "Success" },
    ERROR: { v: "error", label: "Error" },
    RUNNING: { v: "warning", label: "Running" },
  };
  const m = map[status] || { v: "muted", label: status };
  return <RefBadge variant={m.v as any} dot>{m.label}</RefBadge>;
}

export default function LiveFeed({ runs }: { runs: Run[] }) {
  return (
    <RefCard>
      <CardHeader
        title="Live feed"
        sub="Latest agent runs — updating every 2s"
        right={
          <div className="flex items-center gap-2">
            <RefBadge variant="muted" dot><span className="dot" style={{ background: "hsl(var(--llm))" }} />LLM</RefBadge>
            <RefBadge variant="muted" dot><span className="dot" style={{ background: "hsl(var(--tool))" }} />Tool</RefBadge>
            <RefBadge variant="muted" dot><span className="dot" style={{ background: "hsl(var(--rag))" }} />RAG</RefBadge>
            <RefBadge variant="muted" dot><span className="dot" style={{ background: "hsl(var(--guardrail))" }} />Guard</RefBadge>
            <RefButton size="sm" icon={ArrowRight}>View all</RefButton>
          </div>
        }
      />
      <div className="feed">
        {runs.slice(0, 7).map((r) => (
          <Link
            key={r.runId}
            href={`/runs/${r.runId}`}
            className={`feed-row ${r.status === "RUNNING" ? "is-running" : ""}`}
          >
            <StatusBadge status={r.status} />
            <div style={{ minWidth: 0 }}>
              <div className="feed-id">run_{r.runId}</div>
              <div className="feed-meta">
                <span>{r.framework}</span>
                <span className="sep">·</span>
                <span className="mono">{r.agentId}</span>
                <span className="sep">·</span>
                <span className="mono mute">{r.model}</span>
              </div>
            </div>
            <MiniTrace mix={r.mix && r.mix.length > 0 ? r.mix : generateDeterministicMix(r.runId, r.framework)} />
            <div className="feed-stats">
              <b>{formatTokens(r.totalTokens)} tok</b>
              <span>{formatCost(r.totalCost)} · {formatDuration(r.latencyMs)}</span>
            </div>
            <div className="feed-ts">{formatRel(r.startTime)}</div>
          </Link>
        ))}
      </div>
    </RefCard>
  );
}
