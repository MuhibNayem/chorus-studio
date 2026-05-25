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

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [heatmap, setHeatmap] = useState<number[][] | null>(null);
  const [recentRuns, setRecentRuns] = useState<Run[]>([]);
  const [topAgents, setTopAgents] = useState<TopAgent[]>([]);
  const [topModels, setTopModels] = useState<TopModel[]>([]);
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
        setTopAgents(m?.topAgents ?? []);
        setTopModels(m?.topModels?.length ? m.topModels : models);
      })
      .finally(() => setLoading(false));
  }, []);

  const metricItems = metrics ? [
    {
      lbl: "Runs (24h)",
      val: metrics.totalRuns.toLocaleString(),
      delta: metrics.runsDelta ?? 0,
      spark: metrics.runsSpark ?? [],
      color: "hsl(var(--primary-bright))",
      fill: "hsl(var(--primary) / 0.12)",
    },
    {
      lbl: "Tokens (24h)",
      val: metrics.totalTokens >= 1_000_000
        ? `${(metrics.totalTokens / 1_000_000).toFixed(2)}M`
        : `${(metrics.totalTokens / 1_000).toFixed(1)}k`,
      delta: metrics.tokensDelta ?? 0,
      spark: metrics.tokensSpark ?? [],
      color: "hsl(var(--llm))",
      fill: "hsl(var(--llm) / 0.12)",
    },
    {
      lbl: "Cost (24h)",
      val: `$${metrics.totalCost.toFixed(2)}`,
      unit: "USD",
      delta: metrics.costDelta ?? 0,
      spark: metrics.costSpark ?? [],
      color: "hsl(var(--guardrail))",
      fill: "hsl(var(--guardrail) / 0.12)",
    },
    {
      lbl: "p95 latency",
      val: metrics.p95LatencyMs && metrics.p95LatencyMs >= 1000
        ? `${(metrics.p95LatencyMs / 1000).toFixed(1)}s`
        : `${Math.round(metrics.avgLatencyMs)}ms`,
      delta: metrics.latencyDelta ?? 0,
      spark: metrics.latencySpark ?? [],
      color: "hsl(var(--tool))",
      fill: "hsl(var(--tool) / 0.12)",
    },
  ] : [
    { lbl: "Runs (24h)", val: "—", delta: 0, spark: [], color: "", fill: "" },
    { lbl: "Tokens (24h)", val: "—", delta: 0, spark: [], color: "", fill: "" },
    { lbl: "Cost (24h)", val: "—", delta: 0, spark: [], color: "", fill: "" },
    { lbl: "p95 latency", val: "—", delta: 0, spark: [], color: "", fill: "" },
  ];

  const statusData = metrics?.statusBreakdown ?? [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Overview"
        accent="/ last 24h"
        sub={metrics
          ? `${(metrics.totalRuns / (24 * 60)).toFixed(1)} runs/min · ${(100 - (metrics.errorRate ?? 0)).toFixed(1)}% delivery`
          : "loading…"
        }
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
