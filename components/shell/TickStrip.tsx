"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardMetrics, Run } from "@/types";

function statusToTick(status: string): string {
  if (status === "ERROR" || status === "FAILED") return "e";
  if (status === "RUNNING" || status === "PENDING") return "r";
  return "s";
}

function fmtP95(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function fmtRate(totalRuns: number): string {
  const perMin = totalRuns / (24 * 60);
  if (perMin >= 1000) return `${(perMin / 1000).toFixed(1)}k`;
  return perMin >= 10 ? Math.round(perMin).toString() : perMin.toFixed(1);
}

export default function TickStrip() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = () =>
      Promise.all([
        api.getMetrics("24h").catch(() => null),
        api.listRuns({ size: "80", sort: "startTime,desc" }).catch(() => null),
      ]).then(([m, r]) => {
        if (!mounted) return;
        setMetrics(m);
        setRuns(r?.runs ?? []);
      });

    load();
    const timer = setInterval(load, 30_000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);

  const ticks = runs.length > 0
    ? [...runs].reverse().map((r) => statusToTick(r.status))
    : [];

  const hasData = metrics !== null && metrics.totalRuns > 0;
  const runsPerMin = hasData ? fmtRate(metrics!.totalRuns) : "—";
  const errPct = hasData ? `${(metrics!.errorRate ?? 0).toFixed(1)}%` : "—";
  const p95 = hasData && metrics!.p95LatencyMs != null ? fmtP95(metrics!.p95LatencyMs) : "—";

  return (
    <div className="tick-strip">
      <div className="lbl">
        <span className="live-dot" />
        {runs.length > 0 ? `LIVE · LAST ${runs.length} RUNS` : "LIVE"}
      </div>
      <div className="tick-row">
        {ticks.length > 0 ? (
          ticks.map((t, i) => (
            <div
              key={i}
              className={`tick ${t}`}
              style={{ width: 4, opacity: 0.55 + (i / ticks.length) * 0.45 }}
              title={t === "s" ? "success" : t === "e" ? "error" : "running"}
            />
          ))
        ) : (
          <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>no runs yet</span>
        )}
      </div>
      <div className="meta tabular">
        <span><b>{runsPerMin}</b>/min</span>
        <span>err <b>{errPct}</b></span>
        <span>p95 <b>{p95}</b></span>
      </div>
    </div>
  );
}
