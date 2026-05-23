"use client";

import Link from "next/link";
import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import RefButton from "@/components/primitives/RefButton";
import RefBadge from "@/components/primitives/RefBadge";
import MiniTrace from "@/components/primitives/MiniTrace";
import { formatTokens, formatCost, formatDuration, formatRel } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

const RUNS = [
  { id: "8f3c2b1a-77e4-4811-a3e1-bd31c4fa61cc", status: "SUCCESS", model: "gpt-4o-mini", tokens: 8421, cost: 0.042, latency: 2418, started: new Date(Date.now() - 1000 * 22).toISOString() },
  { id: "3b7c9e2d-1f44-4a18-9eb3-77f8024f9d3a", status: "SUCCESS", model: "gpt-4o-mini", tokens: 6892, cost: 0.034, latency: 1812, started: new Date(Date.now() - 1000 * 60 * 9).toISOString() },
  { id: "c204b18e-94c7-4d28-b6a1-7702dc81f4a0", status: "ERROR", model: "claude-3-5-sonnet", tokens: 12480, cost: 0.187, latency: 8124, started: new Date(Date.now() - 1000 * 60 * 8).toISOString() },
];

export default function AgentRunsTab({ agentId }: { agentId: string }) {
  const agentRuns = RUNS;

  return (
    <RefCard style={{ overflow: "hidden" }}>
      <div className="card-h">
        <div className="card-title"><span className="h-bullet" />Recent runs</div>
        <Link href="/runs">
          <RefButton size="sm" variant="outline" icon={ArrowRight}>All runs from this agent</RefButton>
        </Link>
      </div>
      {agentRuns.length === 0 ? (
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
            {agentRuns.map((r) => (
              <tr key={r.id}>
                <td><RefBadge variant={r.status === "SUCCESS" ? "success" : "error"} dot>{r.status}</RefBadge></td>
                <td className="row-id">run_{r.id.slice(0, 18)}…</td>
                <td className="mono mute">{r.model}</td>
                <td><MiniTrace mix={[["llm", 24], ["tool", 8], ["rag", 12], ["llm", 48], ["guardrail", 6], ["tool", 2]]} /></td>
                <td className="r">{formatTokens(r.tokens)}</td>
                <td className="r">{formatCost(r.cost)}</td>
                <td className="r">{formatDuration(r.latency)}</td>
                <td className="r mute">{formatRel(r.started)}</td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </RefCard>
  );
}
