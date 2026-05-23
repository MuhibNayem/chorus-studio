"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTokens, formatCost, formatDuration } from "@/lib/utils";
import CostChart from "@/components/charts/CostChart";
import StatusChart from "@/components/charts/StatusChart";
import Link from "next/link";
import type { DashboardMetrics, Run } from "@/types";

function StatCard({
  title,
  value,
  subtitle,
  loading,
}: {
  title: string;
  value: string;
  subtitle?: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentRuns, setRecentRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getMetrics().catch((e) => {
        setError(e.message);
        return null;
      }),
      api.listRuns({ size: "5", sort: "startTime,desc" }).catch(() => null),
    ])
      .then(([m, r]) => {
        setMetrics(m);
        setRecentRuns(r?.runs ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Connection Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Ensure the Chorus Observe server is running at {process.env.CHORUS_API_URL || "http://localhost:8080"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your agent runs and costs.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Runs"
          value={metrics ? `${metrics.totalRuns.toLocaleString()}` : "—"}
          loading={loading}
        />
        <StatCard
          title="Total Tokens"
          value={metrics ? formatTokens(metrics.totalTokens) : "—"}
          loading={loading}
        />
        <StatCard
          title="Total Cost"
          value={metrics ? formatCost(metrics.totalCost) : "—"}
          loading={loading}
        />
        <StatCard
          title="Avg Latency"
          value={metrics ? formatDuration(metrics.avgLatencyMs) : "—"}
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cost & Tokens Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <CostChart data={metrics?.runsByDay ?? []} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <StatusChart data={metrics?.statusBreakdown ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Runs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Runs</CardTitle>
            <CardDescription>Latest agent executions</CardDescription>
          </div>
          <Link href="/runs" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : recentRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No runs yet. Send OTLP traces to get started.</p>
          ) : (
            <div className="divide-y">
              {recentRuns.map((run) => (
                <Link
                  key={run.runId}
                  href={`/runs/${run.runId}`}
                  className="flex items-center justify-between py-3 hover:bg-accent/50 px-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        run.status === "SUCCESS"
                          ? "success"
                          : run.status === "ERROR"
                          ? "destructive"
                          : "warning"
                      }
                    >
                      {run.status}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{run.runId}</p>
                      <p className="text-xs text-muted-foreground">
                        {run.framework} · {run.agentId} · {run.model ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{formatTokens(run.totalTokens)} tokens</p>
                    <p>{formatCost(run.totalCost)} · {formatDuration(run.latencyMs)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
