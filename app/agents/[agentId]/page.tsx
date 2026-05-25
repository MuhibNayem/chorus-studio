"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import RefBadge from "@/components/primitives/RefBadge";
import RefButton from "@/components/primitives/RefButton";
import RefTabs from "@/components/primitives/Tabs";
import AgentOverviewTab from "@/components/agents/AgentOverviewTab";
import AgentRunsTab from "@/components/agents/AgentRunsTab";
import AgentDeploymentsTab from "@/components/agents/AgentDeploymentsTab";
import AgentSnippet from "@/components/agents/AgentSnippet";
import AgentAlertsTab from "@/components/agents/AgentAlertsTab";
import AgentSettingsTab from "@/components/agents/AgentSettingsTab";
import Sparkline from "@/components/primitives/Sparkline";
import { formatTokens, formatDuration, formatRel } from "@/lib/utils";
import { api } from "@/lib/api";
import { ArrowLeft, RefreshCw, ExternalLink, Pause, PlayCircle, Cpu, GitBranch, Server, Activity, List, Bell, Settings } from "lucide-react";
import type { Agent, AgentMetrics, AgentToolUsage, AgentModelDistribution, AgentDeployment, AgentAlert } from "@/types";

function statusToVariant(s: string) {
  return s === "healthy" ? "success" : s === "degraded" ? "warning" : "error";
}

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [tools, setTools] = useState<AgentToolUsage[]>([]);
  const [models, setModels] = useState<AgentModelDistribution[]>([]);
  const [deployments, setDeployments] = useState<AgentDeployment[]>([]);
  const [alerts, setAlerts] = useState<AgentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState("overview");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!agentId) return;
    setLoading(true);
    Promise.all([
      api.getAgent(agentId).catch(() => null),
      api.getAgentMetrics(agentId).catch(() => null),
      api.getAgentTools(agentId).catch(() => []),
      api.getAgentModels(agentId).catch(() => []),
      api.getAgentDeployments(agentId).catch(() => []),
      api.getAgentAlerts(agentId).catch(() => []),
    ]).then(([a, m, t, mo, d, al]) => {
      if (!a) { setNotFound(true); return; }
      setAgent(a);
      setMetrics(m);
      setTools(t ?? []);
      setModels(mo ?? []);
      setDeployments(d ?? []);
      setAlerts(al ?? []);
    }).finally(() => setLoading(false));
  }, [agentId]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded animate-pulse" />)}
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (notFound || !agent) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/agents" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" style={{ width: "fit-content" }}>
          <ArrowLeft size={13} /> All agents
        </Link>
        <div className="ref-card card-pad" style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>
          Agent <code className="mono">{agentId}</code> not found. It may not be registered yet.
        </div>
      </div>
    );
  }

  const sparks = {
    runs: metrics?.runs24hSpark ?? [],
    latency: metrics?.latencySpark ?? [],
    cost: metrics?.costSpark ?? [],
    error: metrics?.errorSpark ?? [],
  };

  const stats = [
    { lbl: "Runs (24h)", val: formatTokens(agent.runs24h ?? 0), sub: `${((agent.runs24h ?? 0) / 24 / 60).toFixed(1)}/min avg`, spark: sparks.runs, color: "hsl(var(--primary-bright))" },
    { lbl: "p95 latency", val: formatDuration(agent.latencyP95 ?? 0), sub: `p50 ${formatDuration(agent.latencyP50 ?? 0)} · p99 ${formatDuration(agent.latencyP99 ?? 0)}`, spark: sparks.latency, color: "hsl(var(--tool))" },
    { lbl: "Cost (24h)", val: "$" + (agent.cost24h ?? 0).toFixed(2), sub: `$${((agent.cost24h ?? 0) / Math.max(agent.runs24h ?? 1, 1) * 1000).toFixed(3)}/1k runs`, spark: sparks.cost, color: "hsl(var(--guardrail))" },
    { lbl: "Error rate", val: (agent.errorRate ?? 0).toFixed(2) + "%", sub: `${agent.errors24h ?? 0} errors`, spark: sparks.error, color: (agent.errorRate ?? 0) > 1 ? "hsl(var(--error))" : "hsl(var(--llm))" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Link href="/agents" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors" style={{ cursor: "pointer", width: "fit-content" }}>
        <ArrowLeft size={13} /> All agents
      </Link>

      <div className="page-h" style={{ alignItems: "flex-start" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="flex items-center gap-3 flex-wrap">
            <div style={{
              width: 40, height: 40, borderRadius: 8, flexShrink: 0,
              background: `hsl(var(--${agent.status === "healthy" ? "tool" : agent.status === "degraded" ? "warning" : "error"}) / 0.18)`,
              color: `hsl(var(--${agent.status === "healthy" ? "tool" : agent.status === "degraded" ? "warning" : "error"}))`,
              display: "grid", placeItems: "center",
            }}>
              <Cpu size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 className="page-title" style={{ fontSize: 26, lineHeight: 1.05 }}>{agent.name}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap" style={{ fontSize: 11.5 }}>
                <code className="mono mute">{agent.agentId}</code>
                {agent.version && <><span className="mute">·</span><code className="mono mute">{agent.version}</code></>}
                {agent.deployedAt && <><span className="mute">·</span><span className="mute">deployed {formatRel(agent.deployedAt)} {agent.deployedBy ? <>by <code className="mono">{agent.deployedBy}</code></> : null}</span></>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <RefBadge variant={statusToVariant(agent.status) as any} dot>{agent.status}</RefBadge>
            {paused && <RefBadge variant="warning" dot>paused</RefBadge>}
            {agent.framework && <RefBadge variant="muted"><GitBranch size={9} />{agent.framework}</RefBadge>}
            {agent.runtime && <RefBadge variant="muted"><Server size={9} />{agent.runtime}</RefBadge>}
            {agent.owner && <RefBadge variant="primary"><Cpu size={9} />{agent.owner}</RefBadge>}
            {(agent.tags ?? []).map((t: string) => <RefBadge key={t} variant="muted">{t}</RefBadge>)}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <RefButton variant="outline" icon={RefreshCw}>Replay last run</RefButton>
          <RefButton
            variant={paused ? "primary" : "outline"}
            icon={paused ? PlayCircle : Pause}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? "Resume" : "Pause"}
          </RefButton>
          <RefButton variant="outline" icon={ExternalLink}>Repo</RefButton>
        </div>
      </div>

      <div className="metric-rail" style={{ marginBottom: 18 }}>
        {stats.map((s, i) => (
          <div key={i} className="metric">
            <div className="m-lbl">{s.lbl}</div>
            <div className="m-val">{s.val}</div>
            <div className="mute" style={{ fontSize: 10, marginTop: 6, fontFamily: "var(--font-mono)" }}>{s.sub}</div>
            <div className="m-spark">
              <Sparkline data={s.spark} color={s.color} fill={`${s.color.replace(")", " / 0.15)")}`} />
            </div>
          </div>
        ))}
      </div>

      <RefTabs
        tabs={[
          { key: "overview", label: "Overview", icon: Activity },
          { key: "runs", label: "Runs", count: 3, icon: List },
          { key: "deployments", label: "Deployments", count: deployments.length || undefined, icon: GitBranch },
          { key: "integration", label: "Integration", icon: Server },
          { key: "alerts", label: "Alerts", count: alerts.length || undefined, icon: Bell },
          { key: "settings", label: "Settings", icon: Settings },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "overview" && <AgentOverviewTab agent={{ ...agent, tools, models, runs24hSpark: sparks.runs, latencySpark: sparks.latency, costSpark: sparks.cost, errorSpark: sparks.error }} />}
      {tab === "runs" && <AgentRunsTab agentId={agent.agentId} />}
      {tab === "deployments" && <AgentDeploymentsTab deployments={deployments} />}
      {tab === "integration" && <AgentSnippet agent={{ id: agent.agentId, framework: agent.framework, version: agent.version }} />}
      {tab === "alerts" && <AgentAlertsTab alerts={alerts} />}
      {tab === "settings" && <AgentSettingsTab agent={agent} />}
    </div>
  );
}
