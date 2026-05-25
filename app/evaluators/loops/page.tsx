"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import RefBadge from "@/components/primitives/RefBadge";
import { RefCard } from "@/components/primitives/RefCard";
import { api } from "@/lib/api";
import type { Agent, Evaluator } from "@/types";
import {
  Plus,
  TrendingDown,
  Bell,
  Loader2,
  AlertCircle
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface EvalLoop {
  loopId: string;
  agentId: string;
  evaluatorId: string;
  samplingRate: number;
  alertThreshold: number;
  status: "ACTIVE" | "PAUSED";
  createdAt: string;
  lastRunAt?: string;
}

export default function EvalLoopsPage() {
  const [loops, setLoops] = useState<EvalLoop[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newLoop, setNewLoop] = useState({
    agentId: "",
    evaluatorId: "",
    samplingRate: 100,
    alertThreshold: 0.85,
  });

  // Score drift mock visualization data (last 7 days)
  const driftData = [
    { date: "May 18", helpfulness: 0.88, groundedness: 0.92 },
    { date: "May 19", helpfulness: 0.87, groundedness: 0.91 },
    { date: "May 20", helpfulness: 0.89, groundedness: 0.93 },
    { date: "May 21", helpfulness: 0.84, groundedness: 0.92 }, // Breach threshold
    { date: "May 22", helpfulness: 0.86, groundedness: 0.90 },
    { date: "May 23", helpfulness: 0.87, groundedness: 0.89 },
    { date: "May 24", helpfulness: 0.88, groundedness: 0.91 }
  ];

  const refreshData = () => {
    setLoading(true);
    Promise.all([
      api.listAgents().catch(() => []),
      api.listEvaluators().catch(() => []),
      api.listEvalLoops().catch(() => [])
    ])
      .then(([aData, eData, lData]) => {
        setAgents(aData);
        setEvaluators(eData);
        setLoops(lData);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleCreateLoop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoop.agentId || !newLoop.evaluatorId) return;

    setSaving(true);
    try {
      await api.createEvalLoop({
        agentId: newLoop.agentId,
        evaluatorId: newLoop.evaluatorId,
        samplingRate: newLoop.samplingRate,
        alertThreshold: newLoop.alertThreshold
      });
      setShowCreateModal(false);
      setNewLoop({ agentId: "", evaluatorId: "", samplingRate: 100, alertThreshold: 0.85 });
      refreshData();
    } catch (err) {
      alert("Failed to create loop: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const toggleLoopStatus = async (loopId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await api.toggleEvalLoop(loopId, nextStatus);
      refreshData();
    } catch (err) {
      alert("Failed to update status: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const deleteLoop = async (loopId: string) => {
    if (!confirm("Are you sure you want to delete this continuous evaluation schedule?")) return;
    try {
      await api.deleteEvalLoop(loopId);
      refreshData();
    } catch (err) {
      alert("Failed to delete loop: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      <PageHeader
        title="Continuous Evaluation"
        accent="/ loops"
        sub="Schedule automated evaluation metrics on production run streams, analyze performance drift, and alert on breaches."
        actions={
          <RefButton variant="primary" icon={Plus} onClick={() => setShowCreateModal(true)}>
            Schedule Loop
          </RefButton>
        }
      />

      {loading && loops.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary shrink-0" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Performance Drift Visualizer Chart */}
          <RefCard>
            <div className="card-pad flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b pb-4 mb-2">
                <TrendingDown size={16} className="text-primary shrink-0" />
                <span className="mono font-semibold" style={{ fontSize: 13 }}>Production Evaluation Drift (Last 7 Days)</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={driftData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradHelp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradGround" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.08} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
                  />
                  <YAxis
                    domain={[0.7, 1.0]}
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
                  <Area
                    type="monotone"
                    dataKey="helpfulness"
                    name="Helpfulness Score"
                    stroke="hsl(var(--primary))"
                    fill="url(#gradHelp)"
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="groundedness"
                    name="Groundedness Score"
                    stroke="hsl(var(--success))"
                    fill="url(#gradGround)"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </RefCard>

          {/* Loops Registry Table */}
          {loops.length === 0 ? (
            <div className="ref-card card-pad flex flex-col items-center justify-center py-12 gap-3" style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>
              <AlertCircle size={24} className="text-primary shrink-0" />
              <span>No continuous evaluation schedules mapped yet. Click 'Schedule Loop' to map an agent stream to an evaluator ruleset.</span>
            </div>
          ) : (
            <RefCard>
              <table className="runs-table mono" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Loop Identifier</th>
                    <th>Target Agent</th>
                    <th>Evaluator Rule</th>
                    <th>Sampling Rate</th>
                    <th>Alert Bound</th>
                    <th>Status</th>
                    <th className="r">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loops.map((l) => (
                    <tr key={l.loopId} className="hover:bg-muted/10">
                      <td>
                        <span className="font-semibold text-primary">{l.loopId}</span>
                        <div className="text-[10px] text-muted-foreground">
                          Last run: {l.lastRunAt ? new Date(l.lastRunAt).toLocaleTimeString() : "Never triggered"}
                        </div>
                      </td>
                      <td>{l.agentId}</td>
                      <td>
                        <span className="badge-count" style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))", padding: "2px 6px" }}>
                          {l.evaluatorId}
                        </span>
                      </td>
                      <td className="tabular font-semibold">{l.samplingRate}% of runs</td>
                      <td>
                        <span className="flex items-center gap-1 text-yellow-500 font-semibold tabular">
                          <Bell size={10} className="shrink-0" />
                          &lt; {l.alertThreshold.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <RefBadge variant={l.status === "ACTIVE" ? "success" : "muted"} dot>
                          {l.status}
                        </RefBadge>
                      </td>
                      <td className="r space-x-1">
                        <RefButton
                          variant="outline"
                          style={{ padding: "4px 8px", fontSize: 11 }}
                          onClick={() => toggleLoopStatus(l.loopId, l.status)}
                        >
                          {l.status === "ACTIVE" ? "Pause" : "Resume"}
                        </RefButton>
                        <RefButton
                          variant="outline"
                          style={{ padding: "4px 8px", fontSize: 11, color: "hsl(var(--destructive))" }}
                          onClick={() => deleteLoop(l.loopId)}
                        >
                          Delete
                        </RefButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </RefCard>
          )}
        </div>
      )}

      {/* ── CREATE LOOP DRAWER MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="ref-card w-full max-w-md p-6 space-y-4" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="mono font-bold text-base">Schedule Continuous Loop</h3>
            </div>
            <form onSubmit={handleCreateLoop} className="space-y-4 text-xs mono">
              <div className="space-y-1">
                <label className="block text-muted-foreground font-semibold">Target Agent</label>
                <select
                  required
                  className="w-full border p-2 rounded bg-background"
                  value={newLoop.agentId}
                  onChange={(e) => setNewLoop({ ...newLoop, agentId: e.target.value })}
                >
                  <option value="">Select Target Agent...</option>
                  {agents.map((a) => (
                    <option key={a.agentId} value={a.agentId}>{a.name} ({a.agentId})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-muted-foreground font-semibold">Active Evaluator</label>
                <select
                  required
                  className="w-full border p-2 rounded bg-background"
                  value={newLoop.evaluatorId}
                  onChange={(e) => setNewLoop({ ...newLoop, evaluatorId: e.target.value })}
                >
                  <option value="">Select Evaluator Rule...</option>
                  {evaluators.map((ev) => (
                    <option key={ev.evaluatorId} value={ev.evaluatorId}>{ev.name} ({ev.kind})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Sampling Rate (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full border p-2 rounded bg-transparent"
                    value={newLoop.samplingRate}
                    onChange={(e) => setNewLoop({ ...newLoop, samplingRate: parseInt(e.target.value) || 100 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Breach Alert Threshold</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    className="w-full border p-2 rounded bg-transparent"
                    value={newLoop.alertThreshold}
                    onChange={(e) => setNewLoop({ ...newLoop, alertThreshold: parseFloat(e.target.value) || 0.85 })}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t">
                <RefButton variant="outline" type="button" onClick={() => setShowCreateModal(false)}>Cancel</RefButton>
                <RefButton variant="primary" type="submit" disabled={saving}>
                  {saving ? "Scheduling..." : "Schedule"}
                </RefButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
