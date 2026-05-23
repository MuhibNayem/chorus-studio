"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import MetricRail from "@/components/overview/MetricRail";
import LiveFeed from "@/components/overview/LiveFeed";
import ActivityHeatmap from "@/components/overview/ActivityHeatmap";
import StatusDonut from "@/components/overview/StatusDonut";
import TopAgents from "@/components/overview/TopAgents";
import TopModels from "@/components/overview/TopModels";
import RefButton from "@/components/primitives/RefButton";
import { Filter, History, Plus } from "lucide-react";
import type { DashboardMetrics, Run, TopAgent, TopModel } from "@/types";

/* Generate mock sparkline data (24h hourly buckets) */
function genSpark(base: number, jitter: number, len = 24) {
  return Array.from({ length: len }, (_, i) =>
    Math.max(0, Math.round(base + Math.sin(i * 0.5) * jitter + (Math.random() - 0.5) * jitter * 0.6))
  );
}

const MOCK_AGENTS: TopAgent[] = [
  { agentId: "ag_observability_v2", framework: "LangGraph", runs: 38_412, tokens: 2.1e6, cost: 84.20, p95: 4_120, errors: 124 },
  { agentId: "ag_router_v3", framework: "Chorus", runs: 24_180, tokens: 1.2e6, cost: 41.80, p95: 2_840, errors: 41 },
  { agentId: "ag_research", framework: "LangChain", runs: 18_904, tokens: 1.8e6, cost: 92.40, p95: 14_500, errors: 312 },
  { agentId: "ag_eval_judge", framework: "LangGraph", runs: 12_412, tokens: 0.4e6, cost: 12.10, p95: 1_240, errors: 8 },
  { agentId: "ag_summariser", framework: "Chorus", runs: 9_240, tokens: 0.3e6, cost: 24.80, p95: 3_820, errors: 24 },
];

const MOCK_MODELS: TopModel[] = [
  { model: "gpt-4o-mini", provider: "openai", runs: 71_240, tokens: 2.1e6, cost: 41.20 },
  { model: "claude-3-5-sonnet", provider: "anthropic", runs: 24_810, tokens: 1.8e6, cost: 184.20 },
  { model: "gpt-4o", provider: "openai", runs: 18_240, tokens: 0.81e6, cost: 38.42 },
  { model: "gemini-2.0-flash", provider: "google", runs: 8_240, tokens: 0.21e6, cost: 6.18 },
];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [heatmap, setHeatmap] = useState<number[][] | null>(null);
  const [recentRuns, setRecentRuns] = useState<Run[]>([]);
  const [topAgents, setTopAgents] = useState<TopAgent[]>(MOCK_AGENTS);
  const [topModels, setTopModels] = useState<TopModel[]>(MOCK_MODELS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMetrics().catch(() => null),
      api.getHeatmap().catch(() => null),
      api.listRuns({ size: "7", sort: "startTime,desc" }).catch(() => null),
      api.listModels().catch(() => []),
    ])
      .then(([m, h, r, models]) => {
        setMetrics(m);
        setHeatmap(h);
        setRecentRuns(r?.runs ?? []);
        if (m?.topAgents?.length) setTopAgents(m.topAgents);
        if (m?.topModels?.length) setTopModels(m.topModels);
        else if (models.length) setTopModels(models);
      })
      .finally(() => setLoading(false));
  }, []);

  const metricItems = metrics ? [
    {
      lbl: "Runs (24h)",
      val: metrics.totalRuns.toLocaleString(),
      delta: metrics.runsDelta ?? 12.4,
      spark: metrics.runsSpark ?? genSpark(85, 30),
      color: "hsl(var(--primary-bright))",
      fill: "hsl(var(--primary) / 0.12)",
    },
    {
      lbl: "Tokens (24h)",
      val: metrics.totalTokens >= 1_000_000
        ? `${(metrics.totalTokens / 1_000_000).toFixed(2)}M`
        : `${(metrics.totalTokens / 1_000).toFixed(1)}k`,
      delta: metrics.tokensDelta ?? 8.2,
      spark: metrics.tokensSpark ?? genSpark(28, 10),
      color: "hsl(var(--llm))",
      fill: "hsl(var(--llm) / 0.12)",
    },
    {
      lbl: "Cost (24h)",
      val: `$${metrics.totalCost.toFixed(2)}`,
      unit: "USD",
      delta: metrics.costDelta ?? -3.1,
      spark: metrics.costSpark ?? genSpark(3.5, 1.2),
      color: "hsl(var(--guardrail))",
      fill: "hsl(var(--guardrail) / 0.12)",
    },
    {
      lbl: "p95 latency",
      val: metrics.p95LatencyMs && metrics.p95LatencyMs >= 1000
        ? `${(metrics.p95LatencyMs / 1000).toFixed(1)}s`
        : `${Math.round(metrics.avgLatencyMs)}ms`,
      delta: metrics.latencyDelta ?? 5.4,
      spark: metrics.latencySpark ?? genSpark(2400, 300),
      color: "hsl(var(--tool))",
      fill: "hsl(var(--tool) / 0.12)",
    },
  ] : [
    { lbl: "Runs (24h)", val: "—", delta: 0, spark: [], color: "", fill: "" },
    { lbl: "Tokens (24h)", val: "—", delta: 0, spark: [], color: "", fill: "" },
    { lbl: "Cost (24h)", val: "—", delta: 0, spark: [], color: "", fill: "" },
    { lbl: "p95 latency", val: "—", delta: 0, spark: [], color: "", fill: "" },
  ];

  const statusData = metrics?.statusBreakdown ?? [
    { status: "SUCCESS", count: 121_482, pct: 94.55 },
    { status: "ERROR", count: 6_124, pct: 4.77 },
    { status: "RUNNING", count: 865, pct: 0.68 },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Overview"
        accent="/ last 24h"
        sub="847 runs/min sustained · 99.6% delivery"
        actions={
          <>
            <RefButton variant="outline" icon={Filter}>Filters</RefButton>
            <RefButton variant="outline" icon={History}>24h</RefButton>
            <RefButton variant="primary" icon={Plus}>New view</RefButton>
          </>
        }
      />

      <MetricRail items={metricItems} />

      {loading ? (
        <div className="ref-card" style={{ padding: 20 }}>
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-48 bg-muted rounded" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="h-5 w-16 bg-muted rounded" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-40 bg-muted rounded" />
                  <div className="h-2.5 w-32 bg-muted rounded" />
                </div>
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <LiveFeed runs={recentRuns} />
      )}

      <div className="h-4" />
      <div className="split-2">
        <ActivityHeatmap data={heatmap ?? undefined} />
        <StatusDonut data={statusData} />
      </div>

      <div className="h-4" />
      <div className="split-2">
        <TopAgents agents={topAgents.map(a => ({ id: a.agentId, framework: a.framework ?? "", runs: a.runs, cost: a.cost, p95: a.p95 ?? 0, errors: a.errors ?? 0 }))} />
        <TopModels models={topModels.map(m => ({ model: m.model, provider: m.provider ?? "", runs: m.runs, tokens: m.tokens, cost: m.cost }))} />
      </div>
    </div>
  );
}
