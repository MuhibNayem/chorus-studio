"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import { RefCard, CardHeader, CardPad } from "@/components/primitives/RefCard";
import RagKpiStrip from "@/components/rag/RagKpiStrip";
import RagTrendChart from "@/components/rag/RagTrendChart";
import RagLatencyBreakdown from "@/components/rag/RagLatencyBreakdown";
import RagClusterMap from "@/components/rag/RagClusterMap";
import RagDriftBanner from "@/components/rag/RagDriftBanner";
import RagQueryDrawer from "@/components/rag/RagQueryDrawer";
import {
  Activity, RefreshCw, Loader2, TrendingUp,
  Clock, Database, ChevronLeft, ChevronRight, Layers
} from "lucide-react";
import type {
  RagMetrics, RagTrendPoint, RagCluster,
  RagDriftSnapshot, RagQueryEntry
} from "@/types";
import { Select } from "@/components/ui/select";

const WINDOWS = ["1h", "6h", "24h", "7d", "30d"];
const GRANULARITIES: Record<string, string> = { "1h": "hour", "6h": "hour", "24h": "hour", "7d": "day", "30d": "day" };

function ScoreBadge({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="mono" style={{ fontSize: 10.5, color: "hsl(var(--muted-foreground))" }}>—</span>;
  const pct = (value * 100).toFixed(0);
  const v = value >= 0.85 ? "success" : value >= 0.70 ? "warning" : "error";
  return (
    <span className={`ref-badge ${v}`}>
      <span className="dot" />
      {pct}%
    </span>
  );
}

export default function RagPage() {
  const [window, setWindow]             = useState("24h");
  const [collection, setCollection]     = useState<string>("");
  const [metrics, setMetrics]           = useState<RagMetrics | null>(null);
  const [trend, setTrend]               = useState<RagTrendPoint[]>([]);
  const [clusters, setClusters]         = useState<RagCluster[]>([]);
  const [drift, setDrift]               = useState<RagDriftSnapshot[]>([]);
  const [queries, setQueries]           = useState<RagQueryEntry[]>([]);
  const [queryTotal, setQueryTotal]     = useState(0);
  const [queryPage, setQueryPage]       = useState(0);
  const [loading, setLoading]           = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [activeQueryId, setActiveQueryId]     = useState<string | null>(null);

  const coll = collection || undefined;
  const gran = GRANULARITIES[window] ?? "day";

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [m, t, c, d, q] = await Promise.all([
        api.getRagMetrics(window, coll),
        api.getRagTrend(window, gran, coll),
        api.getRagClusters(window, coll),
        api.getRagDrift("30d", coll),
        api.listRagQueries({ window, collection: coll, page: 0, size: 20 }),
      ]);
      setMetrics(m);
      setTrend(t);
      setClusters(c);
      setDrift(d);
      setQueries(q.items);
      setQueryTotal(q.total);
      setQueryPage(0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [window, coll, gran]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadPage = async (page: number) => {
    try {
      const r = await api.listRagQueries({ window, collection: coll, page, size: 20 });
      setQueries(r.items);
      setQueryPage(page);
    } catch (e) {
      console.error(e);
    }
  };

  const collectionOptions = metrics?.collections ?? [];

  return (
    <div className="flex flex-col gap-5" style={{ paddingBottom: 40 }}>
      <PageHeader
        title="RAG Diagnostics"
        accent="/ retrieval analytics"
        sub="Precision · recall · faithfulness · relevancy · embedding drift · semantic query clusters"
        actions={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Select
              value={collection}
              onChange={(v) => setCollection(v as string)}
              style={{ width: 180 }}
              options={[
                { value: "", label: "All Collections" },
                ...collectionOptions.map(c => ({ value: c.collection, label: c.collection })),
              ]}
            />
            <Select
              value={window}
              onChange={(v) => setWindow(v as string)}
              style={{ width: 130 }}
              options={WINDOWS.map(w => ({
                value: w,
                label: w === "1h" ? "Last 1h" : w === "6h" ? "Last 6h" : w === "24h" ? "Last 24h" : w === "7d" ? "Last 7d" : "Last 30d",
              }))}
            />
            <RefButton variant="outline" icon={RefreshCw} onClick={loadAll}>Refresh</RefButton>
          </div>
        }
      />

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="rounded animate-pulse" style={{ height: 160, background: "hsl(var(--muted))" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="rounded animate-pulse" style={{ height: 320, background: "hsl(var(--muted))" }} />
            <div className="rounded animate-pulse" style={{ height: 320, background: "hsl(var(--muted))" }} />
          </div>
        </div>
      ) : !metrics ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", color: "hsl(var(--muted-foreground))" }}>
          <Activity size={48} style={{ opacity: 0.25, marginBottom: 12 }} />
          <p style={{ fontSize: "0.8125rem" }}>Failed to load RAG metrics.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Drift alert strip */}
          {drift.length > 0 && <RagDriftBanner snapshots={drift} />}

          {/* Primary metric-rail: Queries · Precision · Recall · Faithfulness */}
          <RagKpiStrip metrics={metrics} />

          {/* Secondary metric-rail: Latency · Relevancy · Chunks · Hit Rate */}
          <div className="metric-rail">
            <div className="metric" style={{ padding: "14px 20px" }}>
              <div className="m-lbl">Avg Latency</div>
              <div className="m-val" style={{ fontSize: "1.5rem" }}>{Math.round(metrics.avgLatencyMs)}<span className="unit">ms</span></div>
              <div className="mute" style={{ fontSize: 10, fontFamily: "var(--font-mono)", marginTop: 6 }}>
                P95 {Math.round(metrics.p95LatencyMs)}ms · P99 {Math.round(metrics.p99LatencyMs)}ms
              </div>
            </div>
            <div className="metric" style={{ padding: "14px 20px" }}>
              <div className="m-lbl">Answer Relevancy</div>
              <div className="m-val" style={{ fontSize: "1.5rem", color: scoreColor(metrics.avgAnswerRelevancy) }}>{(metrics.avgAnswerRelevancy * 100).toFixed(0)}<span className="unit">%</span></div>
              <div className="mute" style={{ fontSize: 10, fontFamily: "var(--font-mono)", marginTop: 6 }}>
                Query ↔ answer alignment
              </div>
            </div>
            <div className="metric" style={{ padding: "14px 20px" }}>
              <div className="m-lbl">Avg Chunks</div>
              <div className="m-val" style={{ fontSize: "1.5rem" }}>{metrics.avgChunkCount.toFixed(1)}</div>
              <div className="mute" style={{ fontSize: 10, fontFamily: "var(--font-mono)", marginTop: 6 }}>
                Retrieved per query
              </div>
            </div>
            <div className="metric" style={{ padding: "14px 20px" }}>
              <div className="m-lbl">Cache Hit Rate</div>
              <div className="m-val" style={{ fontSize: "1.5rem", color: "hsl(var(--llm))" }}>{(metrics.hitRate * 100).toFixed(0)}<span className="unit">%</span></div>
              <div className="mute" style={{ fontSize: 10, fontFamily: "var(--font-mono)", marginTop: 6 }}>
                Embedding cache reuse
              </div>
            </div>
          </div>

          {/* Charts row: Quality Trend + Latency Distribution */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <RefCard>
              <CardHeader title="Quality Trend" sub="Precision · Recall · Faithfulness · Relevancy" />
              <CardPad>
                <RagTrendChart trend={trend} />
              </CardPad>
            </RefCard>
            <RefCard>
              <CardHeader title="Latency Distribution" sub="P50 · P95 · P99" />
              <CardPad>
                <RagLatencyBreakdown metrics={metrics} />
              </CardPad>
            </RefCard>
          </div>

          {/* Clusters + Collections row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <RefCard>
              <CardHeader title="Semantic Query Clusters" sub={`${clusters.filter(c => c.clusterId !== "noise").length} clusters`} />
              <CardPad>
                <RagClusterMap
                  clusters={clusters}
                  selected={selectedCluster}
                  onSelect={c => setSelectedCluster(prev => prev === c.clusterId ? null : c.clusterId)}
                />
              </CardPad>
            </RefCard>
            <RefCard>
              <CardHeader title="Collection Performance" />
              <CardPad>
                <div style={{ border: "1px solid hsl(var(--border))", borderRadius: "0.375rem", overflow: "hidden" }}>
                  <table className="runs-table">
                    <thead>
                      <tr>
                        <th>Collection</th>
                        <th className="r">Queries</th>
                        <th className="r">Precision</th>
                        <th className="r">Faithfulness</th>
                        <th className="r">Avg Lat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collectionOptions.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: "center", padding: "24px 14px", color: "hsl(var(--muted-foreground))", fontSize: "0.75rem" }}>No collection data</td></tr>
                      ) : collectionOptions.map(c => (
                        <tr key={c.collection} onClick={() => setCollection(prev => prev === c.collection ? "" : c.collection)}>
                          <td style={{ fontWeight: 500, fontFamily: "var(--font-mono)" }}>{c.collection}</td>
                          <td className="r">{Number(c.query_count).toLocaleString()}</td>
                          <td className="r"><ScoreBadge value={Number(c.avg_precision)} /></td>
                          <td className="r"><ScoreBadge value={Number(c.avg_faithfulness)} /></td>
                          <td className="r">{Math.round(Number(c.avg_latency_ms))}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardPad>
            </RefCard>
          </div>

          {/* Query log + drawer */}
          <div style={{ display: "grid", gridTemplateColumns: activeQueryId ? "3fr 2fr" : "1fr", gap: 18 }}>
            <RefCard>
              <CardHeader title="Query Log" sub={`${queryTotal.toLocaleString()} queries`} />
              <CardPad>
                <div style={{ border: "1px solid hsl(var(--border))", borderRadius: "0.375rem", overflow: "hidden" }}>
                  <table className="runs-table">
                    <thead>
                      <tr>
                        <th>Query</th>
                        <th>Collection</th>
                        <th className="r">Latency</th>
                        <th className="r">Precision</th>
                        <th className="r">Recall</th>
                        <th className="r">Faithfulness</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queries.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: "center", padding: "24px 14px", color: "hsl(var(--muted-foreground))", fontSize: "0.75rem" }}>No queries in this window</td></tr>
                      ) : queries.map(q => (
                        <tr
                          key={q.queryId}
                          onClick={() => setActiveQueryId(prev => prev === q.queryId ? null : q.queryId)}
                          style={activeQueryId === q.queryId ? { background: "hsl(var(--primary)/0.08)" } : undefined}
                        >
                          <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }} title={q.query}>{q.query}</td>
                          <td style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)", fontSize: "0.6875rem" }}>{q.collection ?? "—"}</td>
                          <td className="r">{q.latencyMs}ms</td>
                          <td className="r"><ScoreBadge value={q.contextPrecision} /></td>
                          <td className="r"><ScoreBadge value={q.contextRecall} /></td>
                          <td className="r"><ScoreBadge value={q.faithfulness} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "hsl(var(--muted-foreground))" }}>
                  <span>Page {queryPage + 1} of {Math.max(1, Math.ceil(queryTotal / 20))}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="icon-btn" disabled={queryPage === 0} onClick={() => loadPage(queryPage - 1)}><ChevronLeft size={14} /></button>
                    <button className="icon-btn" disabled={(queryPage + 1) * 20 >= queryTotal} onClick={() => loadPage(queryPage + 1)}><ChevronRight size={14} /></button>
                  </div>
                </div>
              </CardPad>
            </RefCard>
            {activeQueryId && <RagQueryDrawer queryId={activeQueryId} onClose={() => setActiveQueryId(null)} />}
          </div>
        </div>
      )}
    </div>
  );
}

function scoreColor(v: number | undefined): string {
  if (v == null) return "hsl(var(--muted-foreground))";
  if (v >= 0.85) return "hsl(var(--success))";
  if (v >= 0.70) return "hsl(var(--warning))";
  return "hsl(var(--error))";
}
