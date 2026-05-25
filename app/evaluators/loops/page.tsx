"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import FormField from "@/components/shared/FormField";
import RefButton from "@/components/primitives/RefButton";
import RefBadge from "@/components/primitives/RefBadge";
import { RefCard } from "@/components/primitives/RefCard";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Agent, Evaluator } from "@/types";
import { Plus, TrendingDown, Bell, Loader2, AlertCircle, RepeatIcon, X } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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

const driftData = [
  { date: "May 18", helpfulness: 0.88, groundedness: 0.92 },
  { date: "May 19", helpfulness: 0.87, groundedness: 0.91 },
  { date: "May 20", helpfulness: 0.89, groundedness: 0.93 },
  { date: "May 21", helpfulness: 0.84, groundedness: 0.92 },
  { date: "May 22", helpfulness: 0.86, groundedness: 0.90 },
  { date: "May 23", helpfulness: 0.87, groundedness: 0.89 },
  { date: "May 24", helpfulness: 0.88, groundedness: 0.91 },
];

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

  const refreshData = () => {
    setLoading(true);
    Promise.all([
      api.listAgents().catch(() => []),
      api.listEvaluators().catch(() => []),
      api.listEvalLoops().catch(() => []),
    ])
      .then(([aData, eData, lData]) => {
        setAgents(aData);
        setEvaluators(eData);
        setLoops(lData);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { refreshData(); }, []);

  const handleCreateLoop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoop.agentId || !newLoop.evaluatorId) return;
    setSaving(true);
    try {
      await api.createEvalLoop({
        agentId: newLoop.agentId,
        evaluatorId: newLoop.evaluatorId,
        samplingRate: newLoop.samplingRate,
        alertThreshold: newLoop.alertThreshold,
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
    try {
      await api.toggleEvalLoop(loopId, currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE");
      refreshData();
    } catch (err) {
      alert("Failed to update status: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const deleteLoop = async (loopId: string) => {
    if (!confirm("Delete this continuous evaluation schedule?")) return;
    try {
      await api.deleteEvalLoop(loopId);
      refreshData();
    } catch (err) {
      alert("Failed to delete loop: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="flex flex-col gap-5">
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
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Drift chart */}
          <RefCard>
            <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "hsl(var(--primary)/0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <TrendingDown size={14} style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                    Production Evaluation Drift
                  </div>
                  <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>
                    Last 7 days
                  </div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center" }}>
                  {[
                    { label: "Helpfulness", color: "hsl(var(--primary))" },
                    { label: "Groundedness", color: "hsl(var(--success))" },
                  ].map(({ label, color }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
                      <div style={{ width: 20, height: 2, background: color, borderRadius: 1 }} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={driftData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradHelp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradGround" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.06} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false}
                    tick={{ fontSize: 10, fill: "currentColor", opacity: 0.45 }} />
                  <YAxis domain={[0.7, 1.0]} tickLine={false} axisLine={false}
                    tick={{ fontSize: 10, fill: "currentColor", opacity: 0.45 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border)/0.2)",
                      boxShadow: "0 8px 24px hsl(0 0% 0% / 0.2)",
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))", marginBottom: 4 }}
                    itemStyle={{ color: "hsl(var(--muted-foreground))" }}
                  />
                  <Area type="monotone" dataKey="helpfulness" name="Helpfulness"
                    stroke="hsl(var(--primary))" fill="url(#gradHelp)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="groundedness" name="Groundedness"
                    stroke="hsl(var(--success))" fill="url(#gradGround)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </RefCard>

          {/* Loops table */}
          {loops.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 12, padding: "48px 24px",
              background: "hsl(var(--card))", borderRadius: 14,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "hsl(var(--primary)/0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <AlertCircle size={22} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)", marginBottom: 4 }}>
                  No loops scheduled
                </div>
                <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", maxWidth: 340 }}>
                  Map an agent stream to an evaluator ruleset to start continuous scoring.
                </div>
              </div>
              <RefButton variant="primary" icon={Plus} onClick={() => setShowCreateModal(true)}>
                Schedule Loop
              </RefButton>
            </div>
          ) : (
            <RefCard>
              <table className="runs-table mono" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Loop ID</th>
                    <th>Agent</th>
                    <th>Evaluator</th>
                    <th>Sampling</th>
                    <th>Alert bound</th>
                    <th>Status</th>
                    <th className="r">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loops.map((l) => (
                    <tr key={l.loopId}>
                      <td>
                        <span style={{ fontWeight: 600, color: "hsl(var(--primary))" }}>{l.loopId}</span>
                        <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
                          Last run: {l.lastRunAt ? new Date(l.lastRunAt).toLocaleTimeString() : "Never triggered"}
                        </div>
                      </td>
                      <td>{l.agentId}</td>
                      <td>
                        <span style={{
                          fontSize: 11, fontFamily: "var(--font-mono)",
                          background: "hsl(var(--primary)/0.08)",
                          color: "hsl(var(--primary))",
                          borderRadius: 6, padding: "2px 7px",
                        }}>
                          {l.evaluatorId}
                        </span>
                      </td>
                      <td className="tabular" style={{ fontWeight: 600 }}>{l.samplingRate}%</td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "hsl(var(--warning))", fontWeight: 600 }}>
                          <Bell size={10} />
                          &lt; {l.alertThreshold.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <RefBadge variant={l.status === "ACTIVE" ? "success" : "muted"} dot>
                          {l.status}
                        </RefBadge>
                      </td>
                      <td className="r" style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <RefButton
                          variant="outline"
                          style={{ padding: "3px 10px", fontSize: 11 }}
                          onClick={() => toggleLoopStatus(l.loopId, l.status)}
                        >
                          {l.status === "ACTIVE" ? "Pause" : "Resume"}
                        </RefButton>
                        <RefButton
                          variant="outline"
                          style={{ padding: "3px 10px", fontSize: 11, color: "hsl(var(--destructive))" }}
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

      {/* ── SCHEDULE LOOP MODAL ── */}
      {showCreateModal && (
        <div style={{
          position: "fixed", inset: 0,
          background: "hsl(var(--background)/0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50, padding: 16,
        }}>
          <div style={{
            background: "hsl(var(--card))",
            borderRadius: 18,
            boxShadow: "0 24px 80px hsl(0 0% 0% / 0.4), 0 0 0 1px hsl(var(--border)/0.1)",
            width: "100%", maxWidth: 460,
            display: "flex", flexDirection: "column",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: "hsl(var(--primary)/0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <RepeatIcon size={15} style={{ color: "hsl(var(--primary))" }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "hsl(var(--foreground))" }}>
                  Schedule Loop
                </span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", padding: 4, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s, background 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "hsl(var(--foreground))"; e.currentTarget.style.background = "hsl(var(--muted)/0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "hsl(var(--muted-foreground))"; e.currentTarget.style.background = "none"; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateLoop} style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <FormField label="Target Agent">
                <Select
                  required
                  value={newLoop.agentId}
                  onChange={(v) => setNewLoop({ ...newLoop, agentId: v as string })}
                >
                  <option value="">Select agent…</option>
                  {agents.map((a) => (
                    <option key={a.agentId} value={a.agentId}>{a.name} ({a.agentId})</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Evaluator Rule">
                <Select
                  required
                  value={newLoop.evaluatorId}
                  onChange={(v) => setNewLoop({ ...newLoop, evaluatorId: v as string })}
                >
                  <option value="">Select evaluator…</option>
                  {evaluators.map((ev) => (
                    <option key={ev.evaluatorId} value={ev.evaluatorId}>{ev.name} ({ev.kind})</option>
                  ))}
                </Select>
              </FormField>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FormField label="Sampling Rate (%)" hint="1–100">
                  <Input
                    type="number" min="1" max="100"
                    value={newLoop.samplingRate}
                    onChange={(e) => setNewLoop({ ...newLoop, samplingRate: parseInt(e.target.value) || 100 })}
                  />
                </FormField>
                <FormField label="Breach Threshold" hint="0.00–1.00">
                  <Input
                    type="number" step="0.05" min="0" max="1"
                    value={newLoop.alertThreshold}
                    onChange={(e) => setNewLoop({ ...newLoop, alertThreshold: parseFloat(e.target.value) || 0.85 })}
                  />
                </FormField>
              </div>

              {/* Footer */}
              <div style={{
                display: "flex", gap: 8, justifyContent: "flex-end",
                marginTop: 4, paddingTop: 16,
                borderTop: "1px solid hsl(var(--border)/0.08)",
              }}>
                <RefButton variant="outline" type="button" onClick={() => setShowCreateModal(false)}>Cancel</RefButton>
                <RefButton variant="primary" type="submit" disabled={saving}>
                  {saving ? "Scheduling…" : "Schedule"}
                </RefButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
