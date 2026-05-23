"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import RefButton from "@/components/primitives/RefButton";
import RefBadge from "@/components/primitives/RefBadge";
import MiniTrace from "@/components/primitives/MiniTrace";
import { formatTokens, formatCost, formatDuration, formatRel } from "@/lib/utils";
import { api } from "@/lib/api";
import { ArrowRight } from "lucide-react";
import type { Run } from "@/types";

const MOCK_RUNS: Run[] = [
  { runId: "8f3c2b1a-77e4-4811-a3e1-bd31c4fa61cc", framework: "LangGraph", agentId: "ag_observability_v2", model: "gpt-4o-mini", startTime: new Date(Date.now() - 1000 * 22).toISOString(), endTime: new Date(Date.now() - 1000 * 20).toISOString(), status: "SUCCESS", tags: {}, metadata: {}, totalTokens: 8421, totalCost: 0.042, latencyMs: 2418 },
  { runId: "3b7c9e2d-1f44-4a18-9eb3-77f8024f9d3a", framework: "LangGraph", agentId: "ag_observability_v2", model: "gpt-4o-mini", startTime: new Date(Date.now() - 1000 * 60 * 9).toISOString(), endTime: new Date(Date.now() - 1000 * 60 * 8).toISOString(), status: "SUCCESS", tags: {}, metadata: {}, totalTokens: 6892, totalCost: 0.034, latencyMs: 1812 },
  { runId: "c204b18e-94c7-4d28-b6a1-7702dc81f4a0", framework: "LangGraph", agentId: "ag_observability_v2", model: "claude-3-5-sonnet", startTime: new Date(Date.now() - 1000 * 60 * 8).toISOString(), endTime: new Date(Date.now() - 1000 * 60 * 6).toISOString(), status: "ERROR", tags: {}, metadata: {}, totalTokens: 12480, totalCost: 0.187, latencyMs: 8124 },
];

export default function AgentRunsTab({ agentId }: { agentId: string }) {
  const [runs, setRuns] = useState<Run[]>(MOCK_RUNS);

  useEffect(() => {
    api.getAgentRuns(agentId, 0, 20)
      .then((r) => setRuns(r.runs.length ? r.runs : MOCK_RUNS))
      .catch(() => {});
  }, [agentId]);

  return (
    <RefCard style={{ overflow: "hidden" }}>
      <div className="card-h">
        <div className="card-title"><span className="h-bullet" />Recent runs</div>
        <Link href="/runs">
          <RefButton size="sm" variant="outline" icon={ArrowRight}>All runs from this agent</RefButton>
        </Link>
      </div>
      {runs.length === 0 ? (
        <div className="card-pad mute" style={{ fontSize: 12, padding: "24px 20px" }}>No recent runs.</div>
      ) : (
        <table className="runs-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Status</th>
              <th>Run ID</th>
              <th>Model</th>
              <th style={{ width: 100 }}>Span mix</th>
              <th className="r" style={{ width: 70 }}>Tokens</th>
              <th className="r" style={{ width: 70 }}>Cost</th>
              <th className="r" style={{ width: 70 }}>Latency</th>
              <th className="r" style={{ width: 80 }}>Started</th>
              <th style={{ width: 28 }} />
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.runId}>
                <td><RefBadge variant={r.status === "SUCCESS" ? "success" : r.status === "ERROR" ? "error" : "warning"} dot>{r.status}</RefBadge></td>
                <td className="row-id">run_{r.runId.slice(0, 18)}…</td>
                <td className="mono mute">{r.model || "—"}</td>
                <td><MiniTrace mix={[["llm", 24], ["tool", 8], ["rag", 12], ["llm", 48], ["guardrail", 6], ["tool", 2]]} /></td>
                <td className="r">{formatTokens(r.totalTokens)}</td>
                <td className="r">{formatCost(r.totalCost)}</td>
                <td className="r">{formatDuration(r.latencyMs)}</td>
                <td className="r mute">{formatRel(r.startTime)}</td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </RefCard>
  );
}
