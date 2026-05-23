"use client";

import Link from "next/link";
import RefBadge from "@/components/primitives/RefBadge";
import RefButton from "@/components/primitives/RefButton";
import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import MiniTrace from "@/components/primitives/MiniTrace";
import { formatTokens, formatCost, formatDuration, formatRel } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import type { Run } from "@/types";

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
            <MiniTrace mix={[["llm", 24], ["tool", 8], ["rag", 12], ["llm", 48], ["guardrail", 6], ["tool", 2]]} />
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
