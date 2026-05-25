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
  Play,
  RotateCcw,
  Sliders,
  TrendingDown,
  Bell,
  CheckCircle,
  Loader2,
  Calendar
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
  lastRunAt: string;
}

const INITIAL_LOOPS: EvalLoop[] = [
  { loopId: "lp_helpfulness_prod", agentId: "ag_observability_v2", evaluatorId: "ev_helpfulness", samplingRate: 20, alertThreshold: 0.85, status: "ACTIVE", lastRunAt: new Date().toISOString() },
  { loopId: "lp_groundedness_prod", agentId: "ag_router_v3", evaluatorId: "ev_groundedness", samplingRate: 50, alertThreshold: 0.90, status: "ACTIVE", lastRunAt: new Date().toISOString() },
  { loopId: "lp_pii_prod", agentId: "ag_research", evaluatorId: "ev_no_pii", samplingRate: 100, alertThreshold: 0.95, status: "ACTIVE", lastRunAt: new Date().toISOString() }
];

export default function EvalLoopsPage() {
  const [loops, setLoops] = useState<EvalLoop[]>(INITIAL_LOOPS);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [newLoop, setNewLoop] = useState({
    agentId: "",
    evaluatorId: "",
    samplingRate: 20,
    alertThreshold: 0.85,
  });

  // Mock score drift data for visualization
  const driftData = [
    { date: "May 18", helpfulness: 0.88, groundedness: 0.92 },
    { date: "May 19", helpfulness: 0.87, groundedness: 0.91 },
    { date: "May 20", helpfulness: 0.89, groundedness: 0.93 },
    { date: "May 21", helpfulness: 0.84, groundedness: 0.92 }, // Drop below 0.85 threshold!
    { date: "May 22", helpfulness: 0.86, groundedness: 0.90 },
    { date: "May 23", helpfulness: 0.87, groundedness: 0.89 },
    { date: "May 24", helpfulness: 0.88, groundedness: 0.91 }
  ];

  useEffect(() => {
    Promise.all([
      api.listAgents().catch(() => []),
      api.listEvaluators().catch(() => [])
    ])
      .then(([aData, eData]) => {
        setAgents(aData);
        setEvaluators(eData.length > 0 ? eData : [
          { evaluatorId: "ev_helpfulness", name: "helpfulness", score24h: 0.84, runs: 12420, kind: "llm-judge" },
          { evaluatorId: "ev_groundedness", name: "groundedness", score24h: 0.91, runs: 12420, kind: "llm-judge" },
          { evaluatorId: "ev_no_pii", name: "no PII in completion", score24h: 0.99, runs: 12420, kind: "regex" }
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreateLoop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoop.agentId || !newLoop.evaluatorId) return;
    const l: EvalLoop = {
      loopId: `lp_${newLoop.evaluatorId.replace("ev_", "")}_${Date.now().toString().slice(-4)}`,
      agentId: newLoop.agentId,
      evaluatorId: newLoop.evaluatorId,
      samplingRate: newLoop.samplingRate,
      alertThreshold: newLoop.alertThreshold,
      status: "ACTIVE",
      lastRunAt: new Date().toISOString()
    };
    setLoops([l, ...loops]);
    setShowCreateModal(false);
    setNewLoop({ agentId: "", evaluatorId: "", samplingRate: 20, alertThreshold: 0.85 });
  };

  const toggleLoopStatus = (loopId: string) => {
    setLoops(loops.map(l => l.loopId === loopId ? { ...l, status: l.status === "ACTIVE" ? "PAUSED" : "ACTIVE" } : l));
  };

  const deleteLoop = (loopId: string) => {
    if (!confirm("Delete this continuous evaluation schedule?")) return;
    setLoops(loops.filter(l => l.loopId !== loopId));
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      <PageHeader
        title="Continuous Evaluation"
        accent="/ loops"
        sub="Schedule automated evaluation metrics on production run streams, analyze performance drift, and alert on dropouts."
        actions={
          <RefButton variant="primary" icon={Plus} onClick={() => setShowCreateModal(true)}>
            Schedule Loop
          </RefButton>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary shrink-0" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Drift Graph */}
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

          {/* Loops List Grid */}
          <div className="grid grid-cols-1 gap-4">
            <RefCard>
              <table className="runs-table mono" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Loop Config</th>
                    <th>Target Agent</th>
                    <th>Evaluator</th>
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
                        <div className="text-[10px] text-muted-foreground">Last run: {new Date(l.lastRunAt).toLocaleTimeString()}</div>
                      </td>
                      <td>{l.agentId}</td>
                      <td>
                        <span className="badge-count" style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))" }}>
                          {l.evaluatorId.replace("ev_", "")}
                        </span>
                      </td>
                      <td>{l.samplingRate}% of runs</td>
                      <td>
                        <span className="flex items-center gap-1 text-yellow-500 font-semibold">
                          <Bell size={10} className="shrink-0" />
                          &lt; {l.alertThreshold}
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
                          onClick={() => toggleLoopStatus(l.loopId)}
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
          </div>
        </div>
      )}

      {/* ── Create Loop Modal Drawer ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="ref-card w-full max-w-md p-6 space-y-4" style={{ background: "hsl(var(--card))" }}>
            <h3 className="mono font-bold text-lg">Schedule Continuous Loop</h3>
            <form onSubmit={handleCreateLoop} className="space-y-4 text-xs mono">
              <div className="space-y-1">
                <label className="block text-muted-foreground">Select Agent</label>
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
                  {agents.length === 0 && (
                    <>
                      <option value="ag_observability_v2">ag_observability_v2</option>
                      <option value="ag_router_v3">ag_router_v3</option>
                      <option value="ag_research">ag_research</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-muted-foreground">Select Evaluator</label>
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
                  <label className="block text-muted-foreground">Inference Sampling (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full border p-2 rounded bg-transparent"
                    value={newLoop.samplingRate}
                    onChange={(e) => setNewLoop({ ...newLoop, samplingRate: parseInt(e.target.value) || 20 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-muted-foreground">Alert Score Bounds</label>
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

              <div className="flex gap-2 justify-end pt-2">
                <RefButton variant="outline" type="button" onClick={() => setShowCreateModal(false)}>Cancel</RefButton>
                <RefButton variant="primary" type="submit">Schedule</RefButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
