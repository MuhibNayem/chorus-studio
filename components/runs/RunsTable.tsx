"use client";

import Link from "next/link";
import RefBadge from "@/components/primitives/RefBadge";
import MiniTrace from "@/components/primitives/MiniTrace";
import { formatTokens, formatCost, formatDuration, formatRel } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
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

export default function RunsTable({ runs }: { runs: Run[] }) {
  return (
    <table className="runs-table">
      <thead>
        <tr>
          <th style={{ width: 80 }}>Status</th>
          <th>Run ID</th>
          <th>Agent</th>
          <th>Model</th>
          <th style={{ width: 110 }}>Span mix</th>
          <th className="r" style={{ width: 80 }}>Tokens</th>
          <th className="r" style={{ width: 70 }}>Cost</th>
          <th className="r" style={{ width: 80 }}>Latency</th>
          <th className="r" style={{ width: 80 }}>Started</th>
          <th style={{ width: 28 }} />
        </tr>
      </thead>
      <tbody>
        {runs.map((r) => (
          <tr key={r.runId}>
            <td><StatusBadge status={r.status} /></td>
            <td>
              <Link href={`/runs/${r.runId ?? ""}`} className="row-id block">
                run_{(r.runId ?? "").slice(0, 18)}…
              </Link>
              <div className="mute" style={{ fontSize: 10, marginTop: 1, fontFamily: "var(--font-mono)" }}>{r.framework}</div>
            </td>
            <td className="mono">{r.agentId}</td>
            <td className="mono mute">{r.model}</td>
            <td><MiniTrace mix={[["llm", 24], ["tool", 8], ["rag", 12], ["llm", 48], ["guardrail", 6], ["tool", 2]]} /></td>
            <td className="r">{formatTokens(r.totalTokens)}</td>
            <td className="r">{formatCost(r.totalCost)}</td>
            <td className="r">{formatDuration(r.latencyMs)}</td>
            <td className="r mute">{formatRel(r.startTime)}</td>
            <td><ChevronRight size={13} className="mute" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
