"use client";

import Link from "next/link";
import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import RefBadge from "@/components/primitives/RefBadge";
import { RefCard } from "@/components/primitives/RefCard";
import { formatTokens, formatDuration, formatCost } from "@/lib/utils";
import { ExternalLink, Plus, ChevronRight, Cpu } from "lucide-react";

const AGENTS = [
  {
    id: "ag_observability_v2", name: "Observability Copilot", framework: "LangGraph",
    owner: "platform", runs24h: 38_412, latencyP95: 4_120, cost24h: 84.20, errors24h: 124,
    version: "v2.4.0", status: "healthy",
  },
  {
    id: "ag_router_v3", name: "Model Router", framework: "Chorus",
    owner: "platform", runs24h: 24_180, latencyP95: 2_840, cost24h: 41.80, errors24h: 41,
    version: "v3.1.0", status: "healthy",
  },
  {
    id: "ag_research", name: "Research Agent", framework: "LangChain",
    owner: "research", runs24h: 18_904, latencyP95: 14_500, cost24h: 92.40, errors24h: 312,
    version: "v1.8.2", status: "degraded",
  },
  {
    id: "ag_eval_judge", name: "LLM Judge", framework: "LangGraph",
    owner: "platform", runs24h: 12_412, latencyP95: 1_240, cost24h: 12.10, errors24h: 8,
    version: "v0.9.1", status: "healthy",
  },
  {
    id: "ag_summariser", name: "Summariser", framework: "Chorus",
    owner: "platform", runs24h: 9_240, latencyP95: 3_820, cost24h: 24.80, errors24h: 24,
    version: "v1.2.0", status: "healthy",
  },
];

function statusToVariant(s: string) {
  return s === "healthy" ? "success" : s === "degraded" ? "warning" : "error";
}

export default function AgentsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Agents"
        accent={`/ ${AGENTS.length}`}
        sub="Every agent emitting traces into this workspace."
        actions={
          <>
            <RefButton variant="outline" icon={ExternalLink}>Docs</RefButton>
            <Link href="/agents/register">
              <RefButton variant="primary" icon={Plus}>Register agent</RefButton>
            </Link>
          </>
        }
      />

      <RefCard style={{ overflow: "hidden" }}>
        <table className="runs-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Status</th>
              <th>Agent</th>
              <th>Framework</th>
              <th>Owner</th>
              <th className="r" style={{ width: 90 }}>Runs (24h)</th>
              <th className="r" style={{ width: 80 }}>p95</th>
              <th className="r" style={{ width: 70 }}>Cost</th>
              <th className="r" style={{ width: 70 }}>Errors</th>
              <th className="r" style={{ width: 90 }}>Version</th>
              <th style={{ width: 28 }} />
            </tr>
          </thead>
          <tbody>
            {AGENTS.map((a) => (
              <tr key={a.id}>
                <td><RefBadge variant={statusToVariant(a.status) as any} dot>{a.status}</RefBadge></td>
                <td>
                  <Link href={`/agents/${a.id}`} className="flex items-center gap-2">
                    <div style={{
                      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                      background: `hsl(var(--${a.status === "healthy" ? "tool" : a.status === "degraded" ? "warning" : "error"}) / 0.18)`,
                      display: "grid", placeItems: "center",
                      color: `hsl(var(--${a.status === "healthy" ? "tool" : a.status === "degraded" ? "warning" : "error"}))`,
                    }}>
                      <Cpu size={12} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="row-id">{a.id}</div>
                      <div className="mute" style={{ fontSize: 10, marginTop: 2 }}>{a.name}</div>
                    </div>
                  </Link>
                </td>
                <td><RefBadge variant="muted">{a.framework}</RefBadge></td>
                <td className="mute" style={{ fontSize: 11.5 }}>{a.owner}</td>
                <td className="r">{formatTokens(a.runs24h)}</td>
                <td className="r">{formatDuration(a.latencyP95)}</td>
                <td className="r">${a.cost24h.toFixed(2)}</td>
                <td className="r" style={{ color: a.errors24h > 100 ? "hsl(var(--error))" : "hsl(var(--muted-foreground))" }}>{a.errors24h}</td>
                <td className="r mono mute" style={{ fontSize: 11 }}>{a.version}</td>
                <td><ChevronRight size={13} className="mute" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </RefCard>
    </div>
  );
}
