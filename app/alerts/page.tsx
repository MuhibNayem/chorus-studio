"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import RefBadge from "@/components/primitives/RefBadge";
import { RefCard } from "@/components/primitives/RefCard";
import { api } from "@/lib/api";
import type { AlertEvent, NotificationChannel, ChannelType } from "@/types";
import { Plus, AlertCircle, CheckCircle2, X, Trash2, Zap } from "lucide-react";
import { Select } from "@/components/ui/select";

type ConfigField = { key: string; label: string; type: string; placeholder: string; required: boolean };

const CHANNEL_META: Record<ChannelType, { label: string; color: string; fields: ConfigField[] }> = {
  SLACK: {
    label: "Slack",
    color: "#4A154B",
    fields: [
      { key: "webhookUrl", label: "Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/T.../B.../...", required: true },
    ],
  },
  TEAMS: {
    label: "Teams",
    color: "#5059C9",
    fields: [
      { key: "webhookUrl", label: "Webhook URL", type: "url", placeholder: "https://xxx.webhook.office.com/webhookb2/...", required: true },
    ],
  },
  PAGERDUTY: {
    label: "PagerDuty",
    color: "#06AC38",
    fields: [
      { key: "routingKey", label: "Routing Key", type: "text", placeholder: "Integration key from PagerDuty service", required: true },
    ],
  },
  WEBHOOK: {
    label: "Webhook",
    color: "#6B7280",
    fields: [
      { key: "url", label: "Endpoint URL (HTTPS only)", type: "url", placeholder: "https://your-service.com/hooks/alerts", required: true },
      { key: "secret", label: "Signing Secret", type: "password", placeholder: "HMAC-SHA256 signing secret (optional)", required: false },
    ],
  },
  EMAIL: {
    label: "Email",
    color: "#EA4335",
    fields: [
      { key: "smtpHost", label: "SMTP Host", type: "text", placeholder: "smtp.company.com", required: true },
      { key: "smtpPort", label: "SMTP Port", type: "number", placeholder: "587", required: false },
      { key: "smtpUsername", label: "Username", type: "text", placeholder: "alerts@company.com", required: true },
      { key: "smtpPassword", label: "Password", type: "password", placeholder: "SMTP password", required: true },
      { key: "from", label: "From Address", type: "email", placeholder: "noreply@company.com", required: true },
      { key: "to", label: "To Address", type: "email", placeholder: "ops@company.com", required: true },
    ],
  },
};

function TypePill({ type }: { type: ChannelType }) {
  const { label, color } = CHANNEL_META[type];
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.05em",
      background: color + "22", color, border: `1px solid ${color}44`, flexShrink: 0,
    }}>
      {label.toUpperCase()}
    </span>
  );
}

export default function AlertsPage() {
  const [tab, setTab] = useState<"events" | "channels">("events");

  // Events
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Channels
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Rule modal
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [condition, setCondition] = useState("sql:SELECT count(*) FROM runs WHERE status = 'ERROR'");
  const [threshold, setThreshold] = useState(5);
  const [severity, setSeverity] = useState<"error" | "warning" | "info">("warning");
  const [selectedChannelIds, setSelectedChannelIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  // Channel modal
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState<ChannelType>("SLACK");
  const [channelConfig, setChannelConfig] = useState<Record<string, string>>({});
  const [savingChannel, setSavingChannel] = useState(false);

  const loadEvents = useCallback(() => {
    setEventsLoading(true);
    api.listAlertEvents(0, 50)
      .then((res) => setAlerts(res.items.map((a) => ({
        eventId: a.eventId,
        ruleId: a.ruleId,
        severity: a.severity || "warning",
        title: a.title || "Alert triggered",
        sub: a.sub || `Rule ${a.ruleId} threshold exceeded`,
        evt: a.evt || "firing",
        when: a.when || "just now",
      })) as AlertEvent[]))
      .catch(() => setAlerts([]))
      .finally(() => setEventsLoading(false));
  }, []);

  const loadChannels = useCallback(() => {
    setChannelsLoading(true);
    api.listChannels()
      .then(setChannels)
      .catch(() => setChannels([]))
      .finally(() => setChannelsLoading(false));
  }, []);

  useEffect(() => {
    loadEvents();
    loadChannels();
  }, [loadEvents, loadChannels]);

  const handleResolve = async (eventId: string) => {
    try {
      await api.resolveAlertEvent(eventId);
      setAlerts((prev) => prev.map((a) => a.eventId === eventId ? { ...a, evt: "resolved" as const } : a));
    } catch { /* ignore */ }
  };

  const handleCreateRule = async () => {
    if (!ruleName.trim()) return;
    setCreating(true);
    try {
      const rule = await api.createAlertRule({
        name: ruleName,
        conditionExpr: condition,
        threshold: Number(threshold),
        severity,
        cooldownSeconds: 300,
      });
      await Promise.allSettled(
        [...selectedChannelIds].map((cid) => api.linkChannelToRule(rule.ruleId, cid))
      );
      setRuleName("");
      setCondition("sql:SELECT count(*) FROM runs WHERE status = 'ERROR'");
      setThreshold(5);
      setSeverity("warning");
      setSelectedChannelIds(new Set());
      setShowRuleModal(false);
      loadEvents();
    } catch { /* ignore */ } finally {
      setCreating(false);
    }
  };

  const handleTestChannel = async (channelId: string) => {
    setTestingId(channelId);
    try {
      const result = await api.testChannel(channelId);
      setTestResults((prev) => ({ ...prev, [channelId]: result }));
    } catch {
      setTestResults((prev) => ({ ...prev, [channelId]: { success: false, error: "Network error" } }));
    } finally {
      setTestingId(null);
      setTimeout(() => setTestResults((prev) => { const n = { ...prev }; delete n[channelId]; return n; }), 5000);
    }
  };

  const handleToggleChannel = async (ch: NotificationChannel) => {
    setTogglingId(ch.channelId);
    try {
      await api.toggleChannel(ch.channelId, !ch.enabled);
      setChannels((prev) => prev.map((c) => c.channelId === ch.channelId ? { ...c, enabled: !c.enabled } : c));
    } catch { /* ignore */ } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm("Delete this notification channel? Alert rules linked to it will stop receiving notifications.")) return;
    setDeletingId(channelId);
    try {
      await api.deleteChannel(channelId);
      setChannels((prev) => prev.filter((c) => c.channelId !== channelId));
    } catch { /* ignore */ } finally {
      setDeletingId(null);
    }
  };

  const openChannelModal = () => {
    setChannelName("");
    setChannelType("SLACK");
    setChannelConfig({});
    setShowChannelModal(true);
  };

  const handleSaveChannel = async () => {
    if (!channelName.trim()) return;
    setSavingChannel(true);
    try {
      const ch = await api.createChannel({ name: channelName, channelType, config: channelConfig });
      setChannels((prev) => [...prev, ch]);
      setShowChannelModal(false);
    } catch { /* ignore */ } finally {
      setSavingChannel(false);
    }
  };

  const requiredFieldsFilled = CHANNEL_META[channelType].fields
    .filter((f) => f.required)
    .every((f) => !!channelConfig[f.key]);

  const activeCount = alerts.filter((a) => a.evt === "firing").length;
  const enabledChannels = channels.filter((c) => c.enabled);

  return (
    <div className="flex flex-col gap-4 relative">
      <PageHeader
        title="Alerts"
        accent={activeCount > 0 ? `/ ${activeCount} active` : undefined}
        sub="Threshold + anomaly detectors, page on call."
        actions={
          tab === "events" ? (
            <RefButton variant="primary" icon={Plus} onClick={() => setShowRuleModal(true)}>
              New rule
            </RefButton>
          ) : (
            <RefButton variant="primary" icon={Plus} onClick={openChannelModal}>
              Add channel
            </RefButton>
          )
        }
      />

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid hsl(var(--border))", gap: 28, marginBottom: -4 }}>
        {(["events", "channels"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontSize: 12, fontWeight: 600, paddingBottom: 10, background: "none", border: "none",
              borderBottom: `2px solid ${tab === t ? "hsl(var(--primary))" : "transparent"}`,
              color: tab === t ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              cursor: "pointer", transition: "color 0.15s",
            }}
          >
            {t === "events"
              ? `Events${activeCount > 0 ? ` (${activeCount})` : ""}`
              : `Channels${channels.length > 0 ? ` (${channels.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* ── Events tab ── */}
      {tab === "events" && (
        <div className="flex flex-col gap-3">
          {eventsLoading ? (
            <div className="text-xs text-muted-foreground p-6 text-center animate-pulse">Loading alerts…</div>
          ) : alerts.length === 0 ? (
            <div className="text-xs text-muted-foreground p-6 text-center">
              No alert events. Create a rule and link notification channels to get started.
            </div>
          ) : alerts.map((a) => {
            const colorKey = a.evt === "resolved" ? "success" : a.severity === "error" ? "error" : "warning";
            return (
              <RefCard key={a.eventId}>
                <div className="card-pad flex items-start gap-3">
                  <div style={{
                    width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                    background: `hsl(var(--${colorKey}) / 0.15)`,
                    color: `hsl(var(--${colorKey}))`,
                    display: "grid", placeItems: "center",
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
                    <RefButton variant="outline" size="sm" onClick={() => handleResolve(a.eventId)}>
                      Resolve
                    </RefButton>
                  )}
                </div>
              </RefCard>
            );
          })}
        </div>
      )}

      {/* ── Channels tab ── */}
      {tab === "channels" && (
        <div className="flex flex-col gap-3">
          {channelsLoading ? (
            <div className="text-xs text-muted-foreground p-6 text-center animate-pulse">Loading channels…</div>
          ) : channels.length === 0 ? (
            <div className="text-xs text-muted-foreground p-6 text-center">
              No notification channels. Add Slack, Teams, PagerDuty, Webhook, or Email channels to route alerts.
            </div>
          ) : channels.map((ch) => {
            const testing = testingId === ch.channelId;
            const testResult = testResults[ch.channelId];
            const toggling = togglingId === ch.channelId;
            const deleting = deletingId === ch.channelId;
            return (
              <RefCard key={ch.channelId}>
                <div className="card-pad flex items-center gap-3 flex-wrap">
                  <TypePill type={ch.channelType} />
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{ch.name}</div>
                    {ch.lastUsedAt && (
                      <div className="mute" style={{ fontSize: 11 }}>
                        Last used {new Date(ch.lastUsedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {testResult && (
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: testResult.success ? "hsl(var(--success))" : "hsl(var(--error))",
                    }}>
                      {testResult.success ? "✓ delivered" : `✗ ${testResult.error ?? "failed"}`}
                    </span>
                  )}
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: ch.enabled ? "hsl(var(--success))" : "hsl(var(--muted-foreground))",
                  }}>
                    {ch.enabled ? "● active" : "○ disabled"}
                  </span>
                  <RefButton
                    variant="outline"
                    size="sm"
                    icon={Zap}
                    onClick={() => handleTestChannel(ch.channelId)}
                    disabled={testing}
                  >
                    {testing ? "Testing…" : "Test"}
                  </RefButton>
                  <RefButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleChannel(ch)}
                    disabled={toggling}
                  >
                    {toggling ? "…" : ch.enabled ? "Disable" : "Enable"}
                  </RefButton>
                  <button
                    onClick={() => handleDeleteChannel(ch.channelId)}
                    disabled={deleting}
                    title="Delete channel"
                    style={{
                      background: "none", border: "none", cursor: deleting ? "default" : "pointer",
                      color: "hsl(var(--muted-foreground))", padding: 4, borderRadius: 4,
                      display: "flex", alignItems: "center", opacity: deleting ? 0.5 : 1,
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </RefCard>
            );
          })}
        </div>
      )}

      {/* ── New Rule Modal ── */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-card border rounded-lg max-w-lg w-full shadow-lg p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Create Alert Rule</h2>
              <button onClick={() => setShowRuleModal(false)} className="text-muted-foreground hover:text-foreground">
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
                    onChange={(v) => setSeverity(v as "error" | "warning" | "info")}
                    options={[
                      { value: "info", label: "Info" },
                      { value: "warning", label: "Warning" },
                      { value: "error", label: "Error" },
                    ]}
                  />
                </div>
              </div>

              {/* Channel picker */}
              <div>
                <label className="text-[10px] font-medium mute block mb-1">NOTIFY CHANNELS</label>
                {enabledChannels.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-2">
                    No active channels.{" "}
                    <button
                      onClick={() => { setShowRuleModal(false); setTab("channels"); openChannelModal(); }}
                      style={{ color: "hsl(var(--primary))", background: "none", border: "none", cursor: "pointer", fontSize: 11 }}
                    >
                      Add one first →
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {enabledChannels.map((ch) => {
                      const { color, label } = CHANNEL_META[ch.channelType];
                      const checked = selectedChannelIds.has(ch.channelId);
                      return (
                        <label
                          key={ch.channelId}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                            padding: "6px 10px", borderRadius: 6,
                            background: checked ? "hsl(var(--primary) / 0.08)" : "hsl(var(--muted) / 0.4)",
                            border: `1px solid ${checked ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))"}`,
                            transition: "all 0.1s",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(selectedChannelIds);
                              e.target.checked ? next.add(ch.channelId) : next.delete(ch.channelId);
                              setSelectedChannelIds(next);
                            }}
                            style={{ accentColor: "hsl(var(--primary))" }}
                          />
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3,
                            background: color + "22", color,
                          }}>
                            {label.toUpperCase()}
                          </span>
                          <span style={{ fontSize: 12 }}>{ch.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <RefButton variant="outline" onClick={() => setShowRuleModal(false)}>Cancel</RefButton>
              <RefButton
                variant="primary"
                onClick={handleCreateRule}
                disabled={creating || !ruleName.trim()}
              >
                {creating ? "Creating…" : "Create rule"}
              </RefButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Channel Modal ── */}
      {showChannelModal && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-card border rounded-lg max-w-md w-full shadow-lg p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Add Notification Channel</h2>
              <button onClick={() => setShowChannelModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-medium mute block mb-1">CHANNEL NAME</label>
                <input
                  type="text"
                  placeholder="e.g., ops-slack-critical"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full bg-muted/50 border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium mute block mb-1">CHANNEL TYPE</label>
                <Select
                  value={channelType}
                  onChange={(v) => { setChannelType(v as ChannelType); setChannelConfig({}); }}
                  options={[
                    { value: "SLACK", label: "Slack" },
                    { value: "TEAMS", label: "Microsoft Teams" },
                    { value: "PAGERDUTY", label: "PagerDuty" },
                    { value: "WEBHOOK", label: "Webhook" },
                    { value: "EMAIL", label: "Email (SMTP)" },
                  ]}
                />
              </div>
              {CHANNEL_META[channelType].fields.map((field) => (
                <div key={field.key}>
                  <label className="text-[10px] font-medium mute block mb-1">
                    {field.label.toUpperCase()}{!field.required ? " (OPTIONAL)" : ""}
                  </label>
                  <input
                    type={field.type === "password" ? "password" : field.type === "number" ? "number" : "text"}
                    placeholder={field.placeholder}
                    value={channelConfig[field.key] ?? ""}
                    onChange={(e) => setChannelConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-muted/50 border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <RefButton variant="outline" onClick={() => setShowChannelModal(false)}>Cancel</RefButton>
              <RefButton
                variant="primary"
                onClick={handleSaveChannel}
                disabled={savingChannel || !channelName.trim() || !requiredFieldsFilled}
              >
                {savingChannel ? "Saving…" : "Save channel"}
              </RefButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
