"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import {
  Activity,
  Layers,
  Clock,
  Sparkles,
  TrendingUp,
  Award,
  Loader2,
  Calendar
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import type { RagMetrics } from "@/types";

export default function RagPage() {
  const [window, setWindow] = useState("24h");
  const [metrics, setMetrics] = useState<RagMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [window]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getRagMetrics(window);
      setMetrics(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      <PageHeader
        title="RAG Diagnostics"
        accent="/ retrieval metrics"
        sub="Track vector search latency spreads, context recall/precision stats, and identify semantic retrieval queries."
        actions={
          <div className="flex gap-2">
            <select
              className="mono border p-2 rounded-md bg-background text-xs"
              value={window}
              onChange={(e) => setWindow(e.target.value)}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <RefButton variant="outline" icon={Calendar} onClick={loadData}>
              Sync
            </RefButton>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary shrink-0" size={32} />
        </div>
      ) : metrics ? (
        <div className="space-y-6">
          {/* Metrics KPIs Row */}
          <div className="grid grid-cols-5 gap-4">
            <div className="ref-card p-4 flex flex-col justify-between mono">
              <div>
                <span className="text-muted-foreground block text-[9px]">TOTAL RAG RUNS</span>
                <span className="font-bold text-xl block mt-1 text-primary">
                  {metrics.queryCount.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-2 block">Direct vector searches</span>
            </div>

            <div className="ref-card p-4 flex flex-col justify-between mono">
              <div>
                <span className="text-muted-foreground block text-[9px]">CONTEXT PRECISION</span>
                <span className="font-bold text-xl block mt-1 text-green-500">
                  {(metrics.avgContextPrecision * 100).toFixed(1)}%
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-2 block">Relevance of retrieved chunks</span>
            </div>

            <div className="ref-card p-4 flex flex-col justify-between mono">
              <div>
                <span className="text-muted-foreground block text-[9px]">CONTEXT RECALL</span>
                <span className="font-bold text-xl block mt-1 text-green-500">
                  {(metrics.avgContextRecall * 100).toFixed(1)}%
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-2 block">Completeness of source context</span>
            </div>

            <div className="ref-card p-4 flex flex-col justify-between mono">
              <div>
                <span className="text-muted-foreground block text-[9px]">CACHE HIT RATE</span>
                <span className="font-bold text-xl block mt-1 text-blue-500">
                  {(metrics.hitRate * 100).toFixed(1)}%
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-2 block">Embedding cache reuse rate</span>
            </div>

            <div className="ref-card p-4 flex flex-col justify-between mono">
              <div>
                <span className="text-muted-foreground block text-[9px]">AVERAGE LATENCY</span>
                <span className="font-bold text-xl block mt-1 text-purple-500">
                  {metrics.avgLatencyMs}ms
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-2 block">Vector DB search time</span>
            </div>
          </div>

          <div className="split-2 gap-6" style={{ gridTemplateColumns: "1.1fr 0.9fr" }}>
            {/* Latency Distribution Chart */}
            <div className="ref-card" style={{ padding: 20 }}>
              <div className="flex items-center gap-2 border-b pb-4 mb-4">
                <Clock size={16} className="text-primary shrink-0" />
                <span className="mono font-semibold" style={{ fontSize: 13 }}>Search Latency Distribution</span>
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={metrics.latencyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.08} />
                  <XAxis
                    dataKey="bucket"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--card)",
                      color: "var(--card-foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary-bright))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Retrieval Queries */}
            <div className="ref-card" style={{ padding: 20 }}>
              <div className="flex items-center gap-2 border-b pb-4 mb-4">
                <TrendingUp size={16} className="text-primary shrink-0" />
                <span className="mono font-semibold" style={{ fontSize: 13 }}>Top retrieval queries</span>
              </div>

              <div className="border rounded-md overflow-hidden">
                <table className="mono w-full text-left" style={{ fontSize: 11 }}>
                  <thead className="bg-muted/40 border-b">
                    <tr>
                      <th className="p-2">Query Text</th>
                      <th className="p-2">Frequency</th>
                      <th className="p-2">Avg Relevance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.topQueries.map((q, idx) => (
                      <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/10">
                        <td className="p-2 font-semibold font-mono truncate max-w-[200px]" title={q.query}>
                          {q.query}
                        </td>
                        <td className="p-2">{q.count.toLocaleString()}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            q.avgScore >= 0.85 ? "text-green-500 bg-green-500/5 border border-green-500/10" : "text-yellow-500 bg-yellow-500/5 border border-yellow-500/10"
                          }`}>
                            {(q.avgScore * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
          <Activity size={48} className="stroke-1 mb-2 shrink-0" />
          <p style={{ fontSize: 13 }}>Failed to load retrieval metrics.</p>
        </div>
      )}
    </div>
  );
}
