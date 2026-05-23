"use client";

import { useState } from "react";
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
import { ArrowLeft, RefreshCw, ExternalLink, Pause, PlayCircle, Cpu, GitBranch, Server } from "lucide-react";

function _genSpark(base: number, jitter: number, len: number) {
  return Array.from({ length: len }, (_, i) =>
    Math.max(0, Math.round(base + Math.sin(i * 0.5) * jitter + (Math.random() - 0.5) * jitter * 0.6))
  );
}

const AGENTS = [
  {
    id: "ag_observability_v2", name: "Observability Copilot",
    description: "Internal copilot that answers questions about agent traces, costs, and guardrails.",
    framework: "LangGraph", runtime: "chorus-engine4j 1.4.2", owner: "platform", ownerEmail: "platform@acme.io",
    tags: ["copilot", "internal", "observability"], version: "v2.4.0",
    deployedAt: new Date(Date.now() - 1000 * 60 * 60 * 32).toISOString(), deployedBy: "maya.nakamura",
    status: "healthy", health: 99.6, runs24h: 38_412, runs24hSpark: _genSpark(1600, 700, 24),
    latencyP50: 1_840, latencyP95: 4_120, latencyP99: 7_240, latencySpark: _genSpark(2400, 600, 24),
    cost24h: 84.20, costSpark: _genSpark(3.5, 1.2, 24), errors24h: 124, errorRate: 0.32, errorSpark: _genSpark(5, 4, 24),
    repo: "github.com/acme/observability-copilot", branch: "main@a3f12c",
    tools: [
      { name: "search_traces", calls: 28_412, p95: 240, errRate: 0.01 },
      { name: "fetch_run", calls: 18_240, p95: 80, errRate: 0.00 },
      { name: "format_report", calls: 12_104, p95: 110, errRate: 0.00 },
      { name: "compare_runs", calls: 4_820, p95: 320, errRate: 0.02 },
      { name: "extract_attrs", calls: 3_120, p95: 90, errRate: 0.00 },
    ],
    models: [
      { model: "gpt-4o-mini", provider: "openai", pct: 78, cost: 41.20 },
      { model: "gpt-4o", provider: "openai", pct: 18, cost: 38.42 },
      { model: "claude-haiku", provider: "anthropic", pct: 4, cost: 4.58 },
    ],
    deployments: [
      { version: "v2.4.0", when: "32h ago", by: "maya.nakamura", diff: "+ tool: compare_runs · prompt v17", state: "active" },
      { version: "v2.3.4", when: "4d ago", by: "leon.park", diff: "- fix: format_report markdown table escaping", state: "past" },
      { version: "v2.3.3", when: "6d ago", by: "maya.nakamura", diff: "+ guardrail: toxicity@v3", state: "past" },
      { version: "v2.3.2", when: "11d ago", by: "leon.park", diff: "~ retry policy on tool_use timeouts", state: "past" },
      { version: "v2.3.1", when: "2w ago", by: "maya.nakamura", diff: "prompt v16: tighter system message", state: "past" },
    ],
    alerts: [
      { sev: "warning", title: "p95 latency > 5s on Sonnet calls", when: "18m ago" },
    ],
  },
  {
    id: "ag_router_v3", name: "Model Router",
    description: "Routes incoming requests to the cheapest model that meets quality bar.",
    framework: "Chorus", runtime: "chorus-engine4j 1.4.2", owner: "platform", ownerEmail: "platform@acme.io",
    tags: ["router", "cost-opt"], version: "v3.1.0",
    deployedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), deployedBy: "leon.park",
    status: "healthy", health: 99.8, runs24h: 24_180, runs24hSpark: _genSpark(1000, 400, 24),
    latencyP50: 940, latencyP95: 2_840, latencyP99: 4_120, latencySpark: _genSpark(1100, 300, 24),
    cost24h: 41.80, costSpark: _genSpark(1.7, 0.6, 24), errors24h: 41, errorRate: 0.17, errorSpark: _genSpark(2, 2, 24),
    repo: "github.com/acme/model-router", branch: "main@7c8de4",
    tools: [
      { name: "classify_intent", calls: 18_412, p95: 80, errRate: 0.00 },
      { name: "price_lookup", calls: 24_180, p95: 12, errRate: 0.00 },
    ],
    models: [
      { model: "gemini-2.0-flash", provider: "google", pct: 62, cost: 4.20 },
      { model: "gpt-4o-mini", provider: "openai", pct: 32, cost: 18.10 },
      { model: "claude-haiku", provider: "anthropic", pct: 6, cost: 19.50 },
    ],
    deployments: [
      { version: "v3.1.0", when: "8h ago", by: "leon.park", diff: "+ gemini-2.0-flash routing rule", state: "active" },
      { version: "v3.0.4", when: "3d ago", by: "maya.nakamura", diff: "tighten classify_intent threshold", state: "past" },
    ],
    alerts: [],
  },
  {
    id: "ag_research", name: "Research Agent",
    description: "Long-context research and summarisation across internal docs + the web.",
    framework: "LangChain", runtime: "langchain-core 0.3", owner: "research", ownerEmail: "research@acme.io",
    tags: ["research", "long-context"], version: "v1.8.2",
    deployedAt: new Date(Date.now() - 1000 * 60 * 60 * 90).toISOString(), deployedBy: "kai.ahmed",
    status: "degraded", health: 96.4, runs24h: 18_904, runs24hSpark: _genSpark(800, 500, 24),
    latencyP50: 6_240, latencyP95: 14_500, latencyP99: 28_000, latencySpark: _genSpark(8200, 3000, 24),
    cost24h: 92.40, costSpark: _genSpark(3.9, 1.4, 24), errors24h: 312, errorRate: 1.65, errorSpark: _genSpark(13, 8, 24),
    repo: "github.com/acme/research-agent", branch: "main@2d1e4a",
    tools: [
      { name: "web_search", calls: 24_120, p95: 1_200, errRate: 0.04 },
      { name: "fetch_url", calls: 18_410, p95: 840, errRate: 0.03 },
      { name: "kb_retrieve", calls: 12_240, p95: 420, errRate: 0.01 },
      { name: "chunk_summarise", calls: 9_810, p95: 1_840, errRate: 0.02 },
      { name: "cite_extract", calls: 6_240, p95: 210, errRate: 0.00 },
    ],
    models: [
      { model: "claude-3-5-sonnet", provider: "anthropic", pct: 84, cost: 78.40 },
      { model: "gpt-4o", provider: "openai", pct: 16, cost: 14.00 },
    ],
    deployments: [
      { version: "v1.8.2", when: "4d ago", by: "kai.ahmed", diff: "+ kb_retrieve hybrid bm25/dense", state: "active" },
    ],
    alerts: [
      { sev: "error", title: "Error rate > 1.5% (last 1h)", when: "12m ago" },
      { sev: "warning", title: "p95 latency > 10s on long_context runs", when: "38m ago" },
    ],
  },
];

function statusToVariant(s: string) {
  return s === "healthy" ? "success" : s === "degraded" ? "warning" : "error";
}

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const agent = AGENTS.find((a) => a.id === agentId) || AGENTS[0];
  const [tab, setTab] = useState("overview");
  const [paused, setPaused] = useState(false);

  const stats = [
    { lbl: "Runs (24h)", val: formatTokens(agent.runs24h), sub: `${(agent.runs24h / 24 / 60).toFixed(1)}/min avg`, spark: agent.runs24hSpark, color: "hsl(var(--primary-bright))" },
    { lbl: "p95 latency", val: formatDuration(agent.latencyP95), sub: `p50 ${formatDuration(agent.latencyP50)} · p99 ${formatDuration(agent.latencyP99)}`, spark: agent.latencySpark, color: "hsl(var(--tool))" },
    { lbl: "Cost (24h)", val: "$" + agent.cost24h.toFixed(2), sub: `$${(agent.cost24h / agent.runs24h * 1000).toFixed(3)}/1k runs`, spark: agent.costSpark, color: "hsl(var(--guardrail))" },
    { lbl: "Error rate", val: agent.errorRate.toFixed(2) + "%", sub: `${agent.errors24h} errors`, spark: agent.errorSpark, color: agent.errorRate > 1 ? "hsl(var(--error))" : "hsl(var(--llm))" },
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
                <code className="mono mute">{agent.id}</code>
                <span className="mute">·</span>
                <code className="mono mute">{agent.version}</code>
                <span className="mute">·</span>
                <span className="mute">deployed {formatRel(agent.deployedAt)} by <code className="mono">{agent.deployedBy}</code></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <RefBadge variant={statusToVariant(agent.status) as any} dot>{agent.status}</RefBadge>
            {paused && <RefBadge variant="warning" dot>paused</RefBadge>}
            <RefBadge variant="muted"><GitBranch size={9} />{agent.framework}</RefBadge>
            <RefBadge variant="muted"><Server size={9} />{agent.runtime}</RefBadge>
            <RefBadge variant="primary"><Cpu size={9} />{agent.owner}</RefBadge>
            {agent.tags.map((t: string) => <RefBadge key={t} variant="muted">{t}</RefBadge>)}
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
          { key: "deployments", label: "Deployments", count: agent.deployments.length, icon: GitBranch },
          { key: "integration", label: "Integration", icon: Server },
          { key: "alerts", label: "Alerts", count: agent.alerts.length || undefined, icon: Bell },
          { key: "settings", label: "Settings", icon: Settings },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "overview" && <AgentOverviewTab agent={agent} />}
      {tab === "runs" && <AgentRunsTab agentId={agent.id} />}
      {tab === "deployments" && <AgentDeploymentsTab deployments={agent.deployments} />}
      {tab === "integration" && <AgentSnippet agent={agent} />}
      {tab === "alerts" && <AgentAlertsTab alerts={agent.alerts} />}
      {tab === "settings" && <AgentSettingsTab agent={agent} />}
    </div>
  );
}

import { Activity, List, Bell, Settings } from "lucide-react";
