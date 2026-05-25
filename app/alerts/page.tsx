"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import RefBadge from "@/components/primitives/RefBadge";
import { RefCard } from "@/components/primitives/RefCard";
import { api } from "@/lib/api";
import type { AlertEvent } from "@/types";
import { Plus, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Select } from "@/components/ui/select";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [condition, setCondition] = useState("sql:SELECT count(*) FROM runs WHERE status = 'ERROR'");
  const [threshold, setThreshold] = useState(5);
  const [severity, setSeverity] = useState<"error" | "warning" | "info">("warning");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);

  const loadAlerts = () => {
    setLoading(true);
    api.listAlertEvents(0, 50)
      .then((res) => {
        // Map backend AlertEvent structure to matches of types/index.ts
        const items = res.items.map(a => ({
          eventId: a.eventId,
          ruleId: a.ruleId,
          severity: a.severity || "warning",
          title: a.title || "Alert triggered",
          sub: a.sub || `Rule threshold exceeded: ${a.ruleId}`,
          evt: a.evt || "firing",
          when: a.when || "just now",
        })) as AlertEvent[];
        setAlerts(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleResolve = async (eventId: string) => {
    try {
      await api.resolveAlertEvent(eventId);
      alert("Alert event has been marked as resolved in the database.");
      setAlerts((prev) =>
        prev.map((a) => (a.eventId === eventId ? { ...a, evt: "resolved" } : a))
      );
    } catch (err) {
      alert("Failed to resolve alert event.");
    }
  };

  const handleCreateRule = async () => {
    if (!ruleName.trim()) return;
    setCreating(true);
    try {
      await api.createAlertRule({
        name: ruleName,
        conditionExpr: condition,
        threshold: Number(threshold),
        severity,
        email: email || undefined,
        cooldownSeconds: 300,
      });
      alert("Alert Rule registered successfully!");
      setRuleName("");
      setCondition("sql:SELECT count(*) FROM runs WHERE status = 'ERROR'");
      setThreshold(5);
      setSeverity("warning");
      setEmail("");
      setShowModal(false);
      loadAlerts();
    } catch (err) {
      alert("Failed to register alert rule.");
    } finally {
      setCreating(false);
    }
  };

  const activeCount = alerts.filter((a) => a.evt === "firing").length;

  return (
    <div className="flex flex-col gap-4 relative">
      <PageHeader
        title="Alerts"
        accent={`/ ${activeCount} active`}
        sub="Threshold + anomaly detectors, page on call."
        actions={
          <RefButton variant="primary" icon={Plus} onClick={() => setShowModal(true)}>
            New alert rule
          </RefButton>
        }
      />
      
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-xs text-muted-foreground p-6 text-center animate-pulse">Loading alerts...</div>
        ) : alerts.map((a) => (
          <RefCard key={a.eventId}>
            <div className="card-pad flex items-start gap-3" style={{ alignItems: "flex-start" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 6,
                background: `hsl(var(--${a.evt === "resolved" ? "success" : a.severity === "error" ? "error" : "warning"}) / 0.15)`,
                color: `hsl(var(--${a.evt === "resolved" ? "success" : a.severity === "error" ? "error" : "warning"}))`,
                display: "grid", placeItems: "center", flexShrink: 0,
              }}>
                {a.evt === "resolved" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</span>
                  <RefBadge variant={a.evt === "firing" ? "error" : "success"} dot>{a.evt}</RefBadge>
                </div>
                <div className="mute" style={{ fontSize: 11.5, marginTop: 4 }}>{a.sub}</div>
              </div>
              
              {a.evt === "firing" && (
                <RefButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolve(a.eventId)}
                >
                  Resolve
                </RefButton>
              )}
            </div>
          </RefCard>
        ))}
      </div>

      {/* New Alert Rule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg max-w-md w-full shadow-lg relative p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Register SQL Alert Rule</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={15} />
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-medium mute block mb-1">RULE NAME</label>
                <input
                  type="text"
                  placeholder="e.g., high-error-rate"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full bg-muted/50 border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium mute block mb-1">SQL CONDITION EXPRESSION</label>
                <input
                  type="text"
                  placeholder="sql:SELECT count(*) FROM runs WHERE status = 'ERROR'"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full bg-muted/50 border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium mute block mb-1">THRESHOLD VALUE</label>
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full bg-muted/50 border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium mute block mb-1">SEVERITY</label>
                  <Select
                    value={severity}
                    onChange={(v) => setSeverity(v as any)}
                    options={[
                      { value: "info", label: "Info" },
                      { value: "warning", label: "Warning" },
                      { value: "error", label: "Error" },
                    ]}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium mute block mb-1">NOTIFICATION EMAIL</label>
                <input
                  type="email"
                  placeholder="ops-alerts@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-muted/50 border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <RefButton variant="outline" onClick={() => setShowModal(false)}>Cancel</RefButton>
              <RefButton variant="primary" onClick={handleCreateRule} disabled={creating || !ruleName.trim()}>
                {creating ? "Registering..." : "Register"}
              </RefButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
