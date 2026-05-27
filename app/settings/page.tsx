"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { RefCard } from "@/components/primitives/RefCard";
import CodeBlock from "@/components/shared/CodeBlock";
import RefButton from "@/components/primitives/RefButton";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Select } from "@/components/ui/select";
import type { RetentionPolicy, ExportConfig, SmtpConfig, PlatformInfo, ApiKeyInfo, ApiKeyCreated } from "@/types";
import {
  Settings2, Database, CloudUpload, Mail, Plus, Trash2, Save,
  Check, RefreshCw, Copy, Lock, Server, Globe, Zap, Shield,
  CheckCircle2, XCircle, AlertCircle, BarChart3, Clock, Archive,
  Eye, EyeOff, Key,
} from "lucide-react";

/* ── Design tokens ──────────────────────────────────────────── */

const NAV_ITEMS = [
  {
    id: "general",
    label: "General",
    icon: Settings2,
    accent: "250 80% 66%",
    desc: "Workspace & ingest",
  },
  {
    id: "retention",
    label: "Retention",
    icon: Database,
    accent: "142 71% 50%",
    desc: "Data lifecycle",
  },
  {
    id: "export",
    label: "Export",
    icon: CloudUpload,
    accent: "27 96% 62%",
    desc: "S3 streaming",
  },
  {
    id: "email",
    label: "Email (SMTP)",
    icon: Mail,
    accent: "217 91% 62%",
    desc: "Delivery config",
  },
] as const;

type TabId = (typeof NAV_ITEMS)[number]["id"];

const RESOURCE_TYPES = [
  { value: "traces",      label: "Traces (runs + spans)" },
  { value: "llm_calls",   label: "LLM I/O" },
  { value: "tool_calls",  label: "Tool I/O" },
  { value: "annotations", label: "Annotations / Evals" },
];

const EMPTY_SMTP: SmtpConfig = {
  host: "", port: 587, username: "", password: "", from: "noreply@chorus.observe", useTls: true, enabled: false,
};

const EMPTY_EXPORT: ExportConfig = {
  endpointUrl: "", region: "us-east-1", bucketName: "", accessKeyId: "",
  secretAccessKey: "", pathPrefix: "", enabled: false,
};

/* ── Shared primitives ─────────────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", color: "hsl(var(--muted-foreground))",
      display: "block", marginBottom: 5,
    }}>
      {children}
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = "text", disabled,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: "100%", padding: "7px 12px",
        background: "hsl(var(--input))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 7, fontSize: 12.5,
        color: "hsl(var(--foreground))",
        outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
        boxSizing: "border-box",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "hsl(var(--primary))";
        e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.12)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "hsl(var(--border))";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

function Toggle({
  checked, onChange, label,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11, border: "none", padding: 0,
          background: checked ? "hsl(var(--primary))" : "hsl(var(--muted))",
          cursor: "pointer", position: "relative", flexShrink: 0,
          transition: "background 0.2s",
          boxShadow: checked ? "0 0 0 1px hsl(var(--primary) / 0.4)" : "none",
        }}
      >
        <span style={{
          position: "absolute", top: 3,
          left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: 8,
          background: "white",
          transition: "left 0.18s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
        }} />
      </button>
      <span style={{ fontSize: 13, color: "hsl(var(--foreground))" }}>{label}</span>
    </label>
  );
}

function StatusChip({
  ok, label,
}: {
  ok: boolean; label?: string;
}) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 20,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
      background: ok
        ? "hsl(var(--success) / 0.12)"
        : "hsl(var(--muted) / 0.6)",
      color: ok
        ? "hsl(var(--success))"
        : "hsl(var(--muted-foreground))",
      border: `1px solid ${ok ? "hsl(var(--success) / 0.25)" : "hsl(var(--border))"}`,
    }}>
      {ok ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
      {label ?? (ok ? "Active" : "Inactive")}
    </span>
  );
}

function SectionHeader({
  icon: Icon, title, sub, accent, action,
}: {
  icon: React.ElementType; title: string; sub?: string;
  accent: string; action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `hsl(${accent} / 0.15)`,
          border: `1px solid hsl(${accent} / 0.3)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={16} style={{ color: `hsl(${accent})` }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--foreground))" }}>{title}</div>
          {sub && <div style={{ fontSize: 11.5, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function SaveRow({
  onSave, saving, saved, extra,
}: {
  onSave: () => void; saving: boolean; saved: boolean; extra?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
      <button
        onClick={onSave}
        disabled={saving}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 16px", borderRadius: 7,
          background: saving ? "hsl(var(--primary) / 0.7)" : "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          border: "none", cursor: saving ? "not-allowed" : "pointer",
          fontSize: 12.5, fontWeight: 600,
          transition: "background 0.15s, transform 0.1s",
          transform: saving ? "scale(0.98)" : "scale(1)",
        }}
      >
        <Save size={13} />
        {saving ? "Saving…" : "Save changes"}
      </button>
      {saved && (
        <span style={{
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 11.5, fontWeight: 600, color: "hsl(var(--success))",
          animation: "fadeIn 0.2s ease-out",
        }}>
          <CheckCircle2 size={13} />
          Changes saved
        </span>
      )}
      {extra}
    </div>
  );
}

/* ── Animated fade wrapper for tab content ─────────────────── */
function TabContent({ children, tabKey }: { children: React.ReactNode; tabKey: string }) {
  return (
    <div
      key={tabKey}
      style={{ animation: "settingsFadeIn 0.22s ease-out" }}
    >
      {children}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("general");
  const [copied, setCopied] = useState(false);

  // Platform / General
  const [platform, setPlatform] = useState<PlatformInfo | null>(null);
  const [platformLoading, setPlatformLoading] = useState(false);
  const [publicUrlDraft, setPublicUrlDraft] = useState("");
  const [platformSaving, setPlatformSaving] = useState(false);
  const [platformSaved, setPlatformSaved] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["read"]);
  const [creatingKey, setCreatingKey] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null);
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revokingHash, setRevokingHash] = useState<string | null>(null);

  // Retention
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policiesLoaded, setPoliciesLoaded] = useState(false);
  const [showNewPolicy, setShowNewPolicy] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    name: "", resourceType: "traces", retentionDays: 30, archiveEnabled: false, archiveLocation: "",
  });
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Export
  const [exportConfig, setExportConfig] = useState<ExportConfig>(EMPTY_EXPORT);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSaving, setExportSaving] = useState(false);
  const [exportSaved, setExportSaved] = useState(false);

  // SMTP
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(EMPTY_SMTP);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpSaved, setSmtpSaved] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadPlatform = useCallback(() => {
    setPlatformLoading(true);
    api.getPlatformInfo()
      .then((p) => { setPlatform(p); setPublicUrlDraft(p.configuredPublicUrl ?? ""); })
      .catch(() => {})
      .finally(() => setPlatformLoading(false));
  }, []);

  const loadApiKeys = useCallback(() => {
    setApiKeysLoading(true);
    api.listApiKeys()
      .then(setApiKeys)
      .catch(() => setApiKeys([]))
      .finally(() => setApiKeysLoading(false));
  }, []);

  const loadRetention = useCallback(() => {
    setPoliciesLoading(true);
    api.getRetentionPolicies()
      .then(setPolicies)
      .catch(() => setPolicies([]))
      .finally(() => { setPoliciesLoading(false); setPoliciesLoaded(true); });
  }, []);

  const loadExport = useCallback(() => {
    setExportLoading(true);
    api.getExportConfig()
      .then((c) => setExportConfig(c ?? EMPTY_EXPORT))
      .catch(() => setExportConfig(EMPTY_EXPORT))
      .finally(() => setExportLoading(false));
  }, []);

  const loadSmtp = useCallback(() => {
    setSmtpLoading(true);
    api.getSmtpConfig()
      .then((c) => setSmtpConfig(c ?? EMPTY_SMTP))
      .catch(() => setSmtpConfig(EMPTY_SMTP))
      .finally(() => setSmtpLoading(false));
  }, []);

  // Load platform info once on mount (General tab is default)
  useEffect(() => { loadPlatform(); loadApiKeys(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === "retention" && !policiesLoaded) loadRetention();
    if (tab === "export" && !exportLoading && exportConfig === EMPTY_EXPORT) loadExport();
    if (tab === "email" && !smtpLoading && smtpConfig === EMPTY_SMTP) loadSmtp();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleCreatePolicy = async () => {
    if (!newPolicy.name.trim()) return;
    setSavingPolicy(true);
    try {
      await api.createRetentionPolicy({
        name: newPolicy.name,
        resourceType: newPolicy.resourceType,
        retentionDays: newPolicy.retentionDays,
        archiveEnabled: newPolicy.archiveEnabled,
        archiveLocation: newPolicy.archiveLocation || undefined,
      });
      setNewPolicy({ name: "", resourceType: "traces", retentionDays: 30, archiveEnabled: false, archiveLocation: "" });
      setShowNewPolicy(false);
      loadRetention();
    } catch { /* ignore */ } finally {
      setSavingPolicy(false);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm("Delete this retention policy?")) return;
    setDeletingId(policyId);
    try {
      await api.deleteRetentionPolicy(policyId);
      setPolicies((prev) => prev.filter((p) => p.policyId !== policyId));
    } catch { /* ignore */ } finally {
      setDeletingId(null);
    }
  };

  const handleSaveExport = async () => {
    setExportSaving(true);
    try {
      const saved = await api.saveExportConfig({
        endpointUrl: exportConfig.endpointUrl,
        region: exportConfig.region,
        bucketName: exportConfig.bucketName,
        accessKeyId: exportConfig.accessKeyId,
        secretAccessKey: exportConfig.secretAccessKey,
        pathPrefix: exportConfig.pathPrefix,
        enabled: exportConfig.enabled,
      });
      setExportConfig(saved);
      setExportSaved(true);
      setTimeout(() => setExportSaved(false), 3000);
    } catch { /* ignore */ } finally {
      setExportSaving(false);
    }
  };

  const handleSaveSmtp = async () => {
    setSmtpSaving(true);
    try {
      const saved = await api.saveSmtpConfig(smtpConfig);
      setSmtpConfig(saved);
      setSmtpSaved(true);
      setTimeout(() => setSmtpSaved(false), 3000);
    } catch { /* ignore */ } finally {
      setSmtpSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setSmtpTesting(true);
    setSmtpTestResult(null);
    try {
      const res = await api.testSmtpConfig();
      setSmtpTestResult({ ok: true, msg: res.message });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Test failed";
      setSmtpTestResult({ ok: false, msg });
    } finally {
      setSmtpTesting(false);
      setTimeout(() => setSmtpTestResult(null), 8000);
    }
  };

  const handleSavePlatform = async () => {
    setPlatformSaving(true);
    try {
      await api.savePlatformInfo(publicUrlDraft);
      await loadPlatform();
      setPlatformSaved(true);
      setTimeout(() => setPlatformSaved(false), 3000);
    } catch { /* ignore */ } finally {
      setPlatformSaving(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const created = await api.createApiKey(newKeyName.trim(), newKeyScopes);
      setCreatedKey(created);
      setNewKeyName("");
      setNewKeyScopes(["read"]);
      setShowKeySecret(false);
      setCopiedKey(false);
      await loadApiKeys();
    } catch { /* ignore */ } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyHash: string) => {
    if (!confirm("Revoke this API key? It will stop working immediately.")) return;
    setRevokingHash(keyHash);
    try {
      await api.revokeApiKey(keyHash);
      setApiKeys((prev) => prev.filter((k) => k.keyHash !== keyHash));
    } catch { /* ignore */ } finally {
      setRevokingHash(null);
    }
  };

  const activeNav = NAV_ITEMS.find((n) => n.id === tab)!;

  return (
    <>
      <style>{`
        @keyframes settingsFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .settings-nav-item:hover {
          background: hsl(var(--muted) / 0.5) !important;
        }
      `}</style>

      <PageHeader
        title="Settings"
        sub="Configure workspace, retention, export, and email delivery."
      />

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginTop: 4 }}>

        {/* ── Left nav sidebar ── */}
        <div style={{
          width: 200, flexShrink: 0,
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: 12,
          padding: 8,
          position: "sticky", top: 80,
        }}>
          {NAV_ITEMS.map((item) => {
            const active = item.id === tab;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className="settings-nav-item"
                onClick={() => setTab(item.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", borderRadius: 8, border: "none",
                  cursor: "pointer", textAlign: "left",
                  marginBottom: 2,
                  background: active
                    ? `hsl(${item.accent} / 0.12)`
                    : "transparent",
                  transition: "background 0.15s",
                  outline: active ? `1px solid hsl(${item.accent} / 0.3)` : "none",
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: active ? `hsl(${item.accent} / 0.2)` : "hsl(var(--muted) / 0.5)",
                  transition: "background 0.15s",
                }}>
                  <Icon
                    size={14}
                    style={{ color: active ? `hsl(${item.accent})` : "hsl(var(--muted-foreground))" }}
                  />
                </div>
                <div>
                  <div style={{
                    fontSize: 12.5, fontWeight: active ? 600 : 500,
                    color: active ? `hsl(${item.accent})` : "hsl(var(--foreground))",
                    lineHeight: 1.2,
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <TabContent tabKey={tab}>

            {/* ── General ── */}
            {tab === "general" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <SectionHeader
                  icon={Settings2}
                  title="Workspace"
                  sub="Identity, ingest endpoints, and platform info"
                  accent="250 80% 66%"
                />

                {/* Workspace ID */}
                {user && (
                  <RefCard>
                    <div style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <Shield size={13} style={{ color: "hsl(250 80% 66%)" }} />
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: "hsl(var(--foreground))" }}>Workspace ID</span>
                        <span style={{
                          marginLeft: "auto", fontSize: 9.5, fontWeight: 700,
                          letterSpacing: "0.06em", textTransform: "uppercase",
                          padding: "2px 7px", borderRadius: 20,
                          background: "hsl(250 80% 66% / 0.1)",
                          color: "hsl(250 80% 66%)",
                          border: "1px solid hsl(250 80% 66% / 0.25)",
                        }}>
                          Required for sign-in
                        </span>
                      </div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", borderRadius: 8,
                        background: "hsl(var(--muted) / 0.4)",
                        border: "1px solid hsl(var(--border))",
                      }}>
                        <code style={{
                          flex: 1, fontFamily: "monospace", fontSize: 13,
                          color: "hsl(var(--foreground))", wordBreak: "break-all",
                          letterSpacing: "0.02em",
                        }}>
                          {user.tenantId}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.tenantId);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          style={{
                            flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
                            padding: "5px 12px", borderRadius: 6,
                            background: copied ? "hsl(var(--success) / 0.15)" : "hsl(var(--card))",
                            border: `1px solid ${copied ? "hsl(var(--success) / 0.3)" : "hsl(var(--border))"}`,
                            color: copied ? "hsl(var(--success))" : "hsl(var(--foreground))",
                            fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {copied ? <Check size={11} /> : <Copy size={11} />}
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p style={{ fontSize: 11.5, color: "hsl(var(--muted-foreground))", marginTop: 8 }}>
                        Share with teammates so they can sign in. Keep it confidential — it's a per-tenant identifier.
                      </p>
                    </div>
                  </RefCard>
                )}

                {/* Public URL config */}
                <RefCard>
                  <div style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <Globe size={13} style={{ color: "hsl(250 80% 66%)" }} />
                      <span style={{ fontSize: 11.5, fontWeight: 600 }}>Public URL</span>
                      <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginLeft: "auto" }}>
                        Used to derive OTLP endpoints shown to SDK users
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Input
                        value={publicUrlDraft}
                        onChange={setPublicUrlDraft}
                        placeholder={platform?.resolvedPublicUrl ?? "https://your-server.example.com"}
                      />
                      <SaveRow onSave={handleSavePlatform} saving={platformSaving} saved={platformSaved} />
                    </div>
                    {platform && (
                      <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 8 }}>
                        Currently resolved to: <code style={{ fontFamily: "monospace" }}>{platform.resolvedPublicUrl}</code>
                      </p>
                    )}
                  </div>
                </RefCard>

                {/* OTLP Endpoints + Platform side by side */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <RefCard>
                    <div style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <Globe size={13} style={{ color: "hsl(var(--llm))" }} />
                        <span style={{ fontSize: 11.5, fontWeight: 600 }}>OTLP Endpoints</span>
                        {platformLoading && <RefreshCw size={11} style={{ color: "hsl(var(--muted-foreground))", animation: "spin 1s linear infinite" }} />}
                      </div>
                      {platform ? ([
                        { label: "HTTP/traces", value: platform.otlpHttpUrl, icon: Globe },
                        ...(platform.grpcEnabled && platform.otlpGrpcEndpoint
                          ? [{ label: "gRPC", value: platform.otlpGrpcEndpoint, icon: Server }]
                          : []),
                      ] as { label: string; value: string; icon: React.ElementType }[]).map(({ label, value, icon: Icon }) => (
                        <div key={label} style={{ marginBottom: 10 }}>
                          <div style={{
                            fontSize: 9.5, fontWeight: 700, textTransform: "uppercase",
                            letterSpacing: "0.08em", color: "hsl(var(--muted-foreground))",
                            display: "flex", alignItems: "center", gap: 4, marginBottom: 4,
                          }}>
                            <Icon size={9} />
                            {label}
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <CodeBlock style={{ flex: 1, padding: "6px 10px", fontSize: 11 }}>{value}</CodeBlock>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(value);
                                setCopiedEndpoint(label);
                                setTimeout(() => setCopiedEndpoint(null), 2000);
                              }}
                              title="Copy"
                              style={{
                                flexShrink: 0, padding: "5px 8px", borderRadius: 5, border: "1px solid hsl(var(--border))",
                                background: copiedEndpoint === label ? "hsl(var(--success) / 0.1)" : "hsl(var(--card))",
                                color: copiedEndpoint === label ? "hsl(var(--success))" : "hsl(var(--muted-foreground))",
                                cursor: "pointer", lineHeight: 1,
                              }}
                            >
                              {copiedEndpoint === label ? <Check size={11} /> : <Copy size={11} />}
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
                          {platformLoading ? "Loading…" : "—"}
                        </div>
                      )}
                    </div>
                  </RefCard>

                  <RefCard>
                    <div style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <BarChart3 size={13} style={{ color: "hsl(var(--rag))" }} />
                        <span style={{ fontSize: 11.5, fontWeight: 600 }}>Platform</span>
                      </div>
                      {platform ? ([
                        { label: "Version",  value: platform.version,        color: "hsl(var(--foreground))" },
                        { label: "Ingest",   value: platform.ingestModes,    color: "hsl(var(--llm))" },
                        { label: "Storage",  value: platform.storageBackend, color: "hsl(var(--tool))" },
                        { label: "gRPC port", value: String(platform.grpcPort), color: "hsl(var(--foreground))" },
                        { label: "Auth",     value: "JWT + SSO",              color: "hsl(var(--guardrail))" },
                      ] as { label: string; value: string; color: string }[]).map(({ label, value, color }) => (
                        <div key={label} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "6px 0", borderBottom: "1px solid hsl(var(--border) / 0.5)",
                        }}>
                          <span style={{ fontSize: 11.5, color: "hsl(var(--muted-foreground))" }}>{label}</span>
                          <span style={{ fontSize: 11.5, fontFamily: "monospace", fontWeight: 600, color }}>
                            {value}
                          </span>
                        </div>
                      )) : (
                        <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
                          {platformLoading ? "Loading…" : "—"}
                        </div>
                      )}
                    </div>
                  </RefCard>
                </div>

                {/* API Keys section */}
                <SectionHeader
                  icon={Key}
                  title="API Keys"
                  sub="Create ingest or read keys for SDK integrations"
                  accent="250 80% 66%"
                />

                {/* Created key one-time reveal */}
                {createdKey && (
                  <RefCard>
                    <div style={{ padding: "16px 20px", background: "hsl(142 71% 50% / 0.05)", borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <CheckCircle2 size={14} style={{ color: "hsl(var(--success))" }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: "hsl(var(--success))" }}>
                          Key created — copy it now, it won't be shown again
                        </span>
                        <button
                          onClick={() => setCreatedKey(null)}
                          style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", fontSize: 16, lineHeight: 1 }}
                        >×</button>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <code style={{
                          flex: 1, fontFamily: "monospace", fontSize: 12,
                          padding: "8px 12px", borderRadius: 7,
                          background: "hsl(var(--muted) / 0.4)",
                          border: "1px solid hsl(var(--border))",
                          wordBreak: "break-all",
                          filter: showKeySecret ? "none" : "blur(6px)",
                          userSelect: showKeySecret ? "auto" : "none",
                        }}>
                          {createdKey.key}
                        </code>
                        <button
                          onClick={() => setShowKeySecret((v) => !v)}
                          title={showKeySecret ? "Hide" : "Reveal"}
                          style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", cursor: "pointer", color: "hsl(var(--muted-foreground))", lineHeight: 1 }}
                        >
                          {showKeySecret ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          onClick={() => { navigator.clipboard.writeText(createdKey.key); setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 6,
                            background: copiedKey ? "hsl(var(--success) / 0.15)" : "hsl(var(--primary))",
                            border: `1px solid ${copiedKey ? "hsl(var(--success) / 0.3)" : "transparent"}`,
                            color: copiedKey ? "hsl(var(--success))" : "hsl(var(--primary-foreground))",
                            fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          {copiedKey ? <Check size={11} /> : <Copy size={11} />}
                          {copiedKey ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </RefCard>
                )}

                {/* Create new key form */}
                <RefCard>
                  <div style={{ padding: "16px 20px" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 12 }}>Create new key</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <div style={{ flex: 1 }}>
                        <Field label="Key name">
                          <Input
                            value={newKeyName}
                            onChange={setNewKeyName}
                            placeholder="e.g. Production ingest"
                          />
                        </Field>
                      </div>
                      <div style={{ width: 160 }}>
                        <Field label="Scopes">
                          <select
                            value={newKeyScopes[0] ?? "read"}
                            onChange={(e) => {
                              const v = e.target.value;
                              setNewKeyScopes(v === "admin" ? ["admin"] : v === "write" ? ["read", "write"] : ["read"]);
                            }}
                            style={{
                              width: "100%", padding: "7px 10px",
                              background: "hsl(var(--input))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: 7, fontSize: 12.5,
                              color: "hsl(var(--foreground))", outline: "none",
                            }}
                          >
                            <option value="read">Read only</option>
                            <option value="write">Read + Write</option>
                            <option value="admin">Admin</option>
                          </select>
                        </Field>
                      </div>
                      <button
                        onClick={handleCreateApiKey}
                        disabled={creatingKey || !newKeyName.trim()}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "7px 14px", borderRadius: 7,
                          background: creatingKey || !newKeyName.trim() ? "hsl(var(--muted))" : "hsl(var(--primary))",
                          color: creatingKey || !newKeyName.trim() ? "hsl(var(--muted-foreground))" : "hsl(var(--primary-foreground))",
                          border: "none", cursor: creatingKey || !newKeyName.trim() ? "not-allowed" : "pointer",
                          fontSize: 12.5, fontWeight: 600, flexShrink: 0,
                          marginBottom: 0,
                        }}
                      >
                        <Plus size={13} />
                        {creatingKey ? "Creating…" : "Create"}
                      </button>
                    </div>
                  </div>
                </RefCard>

                {/* Existing keys list */}
                {apiKeysLoading ? (
                  <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", padding: "8px 0" }}>Loading keys…</div>
                ) : apiKeys.length === 0 ? (
                  <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", padding: "8px 0" }}>No active API keys.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {apiKeys.map((k) => (
                      <RefCard key={k.keyHash}>
                        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                            background: "hsl(250 80% 66% / 0.1)",
                            border: "1px solid hsl(250 80% 66% / 0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Key size={14} style={{ color: "hsl(250 80% 66%)" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{k.name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                              {k.keyPrefix && (
                                <code style={{ fontSize: 11, fontFamily: "monospace", color: "hsl(var(--muted-foreground))" }}>
                                  {k.keyPrefix}…
                                </code>
                              )}
                              {k.scopes.map((s) => (
                                <span key={s} style={{
                                  fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                                  padding: "1px 6px", borderRadius: 20,
                                  background: "hsl(var(--muted) / 0.5)", color: "hsl(var(--muted-foreground))",
                                  border: "1px solid hsl(var(--border))",
                                }}>{s}</span>
                              ))}
                              <span style={{ fontSize: 10.5, color: "hsl(var(--muted-foreground))" }}>
                                Created {new Date(k.createdAt).toLocaleDateString()}
                              </span>
                              {k.lastUsedAt && (
                                <span style={{ fontSize: 10.5, color: "hsl(var(--muted-foreground))" }}>
                                  · Last used {new Date(k.lastUsedAt).toLocaleDateString()}
                                </span>
                              )}
                              {k.expired && <StatusChip ok={false} label="Expired" />}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRevokeApiKey(k.keyHash)}
                            disabled={revokingHash === k.keyHash}
                            title="Revoke key"
                            style={{
                              flexShrink: 0, padding: "5px 10px", borderRadius: 6,
                              background: "hsl(var(--destructive) / 0.08)",
                              border: "1px solid hsl(var(--destructive) / 0.2)",
                              color: "hsl(var(--destructive))",
                              cursor: revokingHash === k.keyHash ? "not-allowed" : "pointer",
                              fontSize: 11.5, fontWeight: 600,
                              display: "flex", alignItems: "center", gap: 5,
                            }}
                          >
                            <Trash2 size={11} />
                            {revokingHash === k.keyHash ? "…" : "Revoke"}
                          </button>
                        </div>
                      </RefCard>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Retention ── */}
            {tab === "retention" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <SectionHeader
                  icon={Database}
                  title="Retention Policies"
                  sub="Configure hot-storage windows per data tier"
                  accent="142 71% 50%"
                  action={
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={loadRetention}
                        disabled={policiesLoading}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "6px 10px", borderRadius: 7, border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--card))", cursor: "pointer",
                          color: "hsl(var(--muted-foreground))", fontSize: 11.5,
                          transition: "all 0.15s",
                        }}
                      >
                        <RefreshCw size={11} style={{ animation: policiesLoading ? "spin 1s linear infinite" : undefined }} />
                        Refresh
                      </button>
                      <button
                        onClick={() => setShowNewPolicy((v) => !v)}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "6px 14px", borderRadius: 7, border: "none",
                          background: "hsl(142 71% 50%)",
                          color: "white", fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                          transition: "opacity 0.15s",
                        }}
                      >
                        <Plus size={12} />
                        Add policy
                      </button>
                    </div>
                  }
                />

                {showNewPolicy && (
                  <RefCard>
                    <div style={{ padding: "16px 20px" }}>
                      <div style={{
                        fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.07em", color: "hsl(142 71% 50%)",
                        marginBottom: 14, display: "flex", alignItems: "center", gap: 5,
                      }}>
                        <Plus size={10} /> New Policy
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <Field label="Policy name">
                          <Input value={newPolicy.name} onChange={(v) => setNewPolicy((p) => ({ ...p, name: v }))} placeholder="e.g., traces-30d" />
                        </Field>
                        <Field label="Resource type">
                          <Select
                            value={newPolicy.resourceType}
                            onChange={(v) => setNewPolicy((p) => ({ ...p, resourceType: v as string }))}
                            options={RESOURCE_TYPES}
                          />
                        </Field>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <Field label="Retention (days)">
                          <Input type="number" value={String(newPolicy.retentionDays)} onChange={(v) => setNewPolicy((p) => ({ ...p, retentionDays: Number(v) }))} placeholder="30" />
                        </Field>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <Toggle
                          checked={newPolicy.archiveEnabled}
                          onChange={(v) => setNewPolicy((p) => ({ ...p, archiveEnabled: v }))}
                          label="Archive data before deletion"
                        />
                      </div>
                      {newPolicy.archiveEnabled && (
                        <div style={{ marginBottom: 12 }}>
                          <Field label="Archive location (S3 URI)">
                            <Input value={newPolicy.archiveLocation} onChange={(v) => setNewPolicy((p) => ({ ...p, archiveLocation: v }))} placeholder="s3://my-bucket/archive/" />
                          </Field>
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={handleCreatePolicy}
                          disabled={savingPolicy || !newPolicy.name.trim()}
                          style={{
                            padding: "6px 16px", borderRadius: 7, border: "none",
                            background: savingPolicy ? "hsl(142 71% 50% / 0.7)" : "hsl(142 71% 50%)",
                            color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          {savingPolicy ? "Creating…" : "Create policy"}
                        </button>
                        <button
                          onClick={() => setShowNewPolicy(false)}
                          style={{
                            padding: "6px 14px", borderRadius: 7,
                            border: "1px solid hsl(var(--border))",
                            background: "transparent", fontSize: 12,
                            color: "hsl(var(--muted-foreground))", cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </RefCard>
                )}

                <RefCard>
                  {policiesLoading ? (
                    <div style={{ padding: "32px 20px", textAlign: "center" }}>
                      <RefreshCw size={20} style={{ color: "hsl(var(--muted-foreground))", animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
                      <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>Loading policies…</div>
                    </div>
                  ) : policies.length === 0 ? (
                    <div style={{ padding: "32px 20px", textAlign: "center" }}>
                      <Database size={28} style={{ color: "hsl(var(--muted-foreground))", margin: "0 auto 10px" }} />
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "hsl(var(--foreground))" }}>No retention policies</div>
                      <div style={{ fontSize: 11.5, color: "hsl(var(--muted-foreground))", marginTop: 4 }}>
                        Add a policy to control how long each data tier is retained.
                      </div>
                    </div>
                  ) : (
                    <div>
                      {policies.map((p, i) => (
                        <div key={p.policyId} style={{
                          display: "flex", alignItems: "center",
                          padding: "14px 20px",
                          borderBottom: i < policies.length - 1 ? "1px solid hsl(var(--border) / 0.5)" : undefined,
                          gap: 16,
                          transition: "background 0.1s",
                        }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                            background: "hsl(142 71% 50%)",
                            boxShadow: "0 0 6px hsl(142 71% 50% / 0.5)",
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{p.tier}</span>
                              <span style={{
                                fontSize: 10, padding: "1px 7px", borderRadius: 20,
                                background: "hsl(var(--muted) / 0.5)",
                                color: "hsl(var(--muted-foreground))",
                                border: "1px solid hsl(var(--border))",
                              }}>
                                {p.resourceType}
                              </span>
                              {p.archiveEnabled && (
                                <span style={{
                                  fontSize: 10, padding: "1px 7px", borderRadius: 20,
                                  background: "hsl(var(--warning) / 0.1)",
                                  color: "hsl(var(--warning))",
                                  border: "1px solid hsl(var(--warning) / 0.25)",
                                  display: "flex", alignItems: "center", gap: 3,
                                }}>
                                  <Archive size={8} /> Archived
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{
                                flex: 1, height: 4, borderRadius: 2,
                                background: "hsl(var(--muted) / 0.5)",
                                overflow: "hidden",
                              }}>
                                <div style={{
                                  height: "100%", borderRadius: 2,
                                  width: `${Math.min(100, p.pct * 100)}%`,
                                  background: `linear-gradient(90deg, hsl(142 71% 50%), hsl(217 91% 62%))`,
                                  transition: "width 0.6s ease-out",
                                }} />
                              </div>
                              <span style={{ fontSize: 11.5, fontFamily: "monospace", fontWeight: 600, flexShrink: 0 }}>
                                {p.retentionDays}d
                              </span>
                              <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", flexShrink: 0 }}>
                                {p.duration}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePolicy(p.policyId)}
                            disabled={deletingId === p.policyId}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "hsl(var(--muted-foreground))", padding: 6,
                              borderRadius: 6, transition: "color 0.15s, background 0.15s",
                              display: "flex",
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.color = "hsl(var(--destructive))";
                              e.currentTarget.style.background = "hsl(var(--destructive) / 0.08)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.color = "hsl(var(--muted-foreground))";
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </RefCard>
              </div>
            )}

            {/* ── Export ── */}
            {tab === "export" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <SectionHeader
                  icon={CloudUpload}
                  title="S3 Export"
                  sub="Stream processed data to your own S3-compatible bucket"
                  accent="27 96% 62%"
                  action={<StatusChip ok={!!exportConfig.enabled} label={exportConfig.enabled ? "Export active" : "Disabled"} />}
                />

                <RefCard>
                  <div style={{ padding: "20px 24px" }}>
                    {exportLoading ? (
                      <div style={{ padding: "24px 0", textAlign: "center" }}>
                        <div className="animate-pulse" style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>Loading config…</div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                          <Field label="Endpoint URL (blank = AWS S3)">
                            <Input
                              value={exportConfig.endpointUrl ?? ""}
                              onChange={(v) => setExportConfig((p) => ({ ...p, endpointUrl: v }))}
                              placeholder="https://s3.amazonaws.com"
                            />
                          </Field>
                          <Field label="Region">
                            <Input
                              value={exportConfig.region ?? "us-east-1"}
                              onChange={(v) => setExportConfig((p) => ({ ...p, region: v }))}
                              placeholder="us-east-1"
                            />
                          </Field>
                        </div>

                        <Field label="Bucket name">
                          <Input
                            value={exportConfig.bucketName ?? ""}
                            onChange={(v) => setExportConfig((p) => ({ ...p, bucketName: v }))}
                            placeholder="my-chorus-exports"
                          />
                        </Field>

                        <div style={{
                          padding: "14px 16px",
                          background: "hsl(var(--muted) / 0.25)",
                          borderRadius: 8, border: "1px solid hsl(var(--border))",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                            <Lock size={11} style={{ color: "hsl(27 96% 62%)" }} />
                            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "hsl(27 96% 62%)" }}>
                              Credentials (AES-256-GCM encrypted at rest)
                            </span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <Field label="Access key ID">
                              <Input
                                value={exportConfig.accessKeyId ?? ""}
                                onChange={(v) => setExportConfig((p) => ({ ...p, accessKeyId: v }))}
                                placeholder="AKIA…"
                              />
                            </Field>
                            <Field label="Secret access key">
                              <Input
                                type="password"
                                value={exportConfig.secretAccessKey ?? ""}
                                onChange={(v) => setExportConfig((p) => ({ ...p, secretAccessKey: v }))}
                                placeholder="••••••••"
                              />
                            </Field>
                          </div>
                        </div>

                        <Field label="Path prefix (optional)">
                          <Input
                            value={exportConfig.pathPrefix ?? ""}
                            onChange={(v) => setExportConfig((p) => ({ ...p, pathPrefix: v }))}
                            placeholder="chorus/exports/"
                          />
                        </Field>

                        <Toggle
                          checked={!!exportConfig.enabled}
                          onChange={(v) => setExportConfig((p) => ({ ...p, enabled: v }))}
                          label="Enable automatic export jobs"
                        />

                        <SaveRow
                          onSave={handleSaveExport}
                          saving={exportSaving}
                          saved={exportSaved}
                        />
                      </div>
                    )}
                  </div>
                </RefCard>
              </div>
            )}

            {/* ── Email ── */}
            {tab === "email" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <SectionHeader
                  icon={Mail}
                  title="Email Delivery (SMTP)"
                  sub="Used for workspace lookup emails and alert notifications"
                  accent="217 91% 62%"
                  action={
                    <StatusChip
                      ok={smtpConfig.enabled && !!smtpConfig.host}
                      label={smtpConfig.enabled && smtpConfig.host ? "Connected" : "Not configured"}
                    />
                  }
                />

                <RefCard>
                  <div style={{ padding: "20px 24px" }}>
                    {smtpLoading ? (
                      <div style={{ padding: "24px 0", textAlign: "center" }}>
                        <div className="animate-pulse" style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>Loading config…</div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
                          <Field label="SMTP host">
                            <Input
                              value={smtpConfig.host}
                              onChange={(v) => setSmtpConfig((p) => ({ ...p, host: v }))}
                              placeholder="smtp.company.com"
                            />
                          </Field>
                          <Field label="Port">
                            <Input
                              type="number"
                              value={String(smtpConfig.port)}
                              onChange={(v) => setSmtpConfig((p) => ({ ...p, port: Number(v) }))}
                              placeholder="587"
                            />
                          </Field>
                        </div>

                        <div style={{
                          padding: "14px 16px",
                          background: "hsl(var(--muted) / 0.25)",
                          borderRadius: 8, border: "1px solid hsl(var(--border))",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                            <Lock size={11} style={{ color: "hsl(217 91% 62%)" }} />
                            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "hsl(217 91% 62%)" }}>
                              Authentication
                            </span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <Field label="Username">
                              <Input
                                value={smtpConfig.username}
                                onChange={(v) => setSmtpConfig((p) => ({ ...p, username: v }))}
                                placeholder="alerts@company.com"
                              />
                            </Field>
                            <Field label="Password">
                              <Input
                                type="password"
                                value={smtpConfig.password ?? ""}
                                onChange={(v) => setSmtpConfig((p) => ({ ...p, password: v }))}
                                placeholder="••••••••"
                              />
                            </Field>
                          </div>
                        </div>

                        <Field label="From address">
                          <Input
                            value={smtpConfig.from}
                            onChange={(v) => setSmtpConfig((p) => ({ ...p, from: v }))}
                            placeholder="noreply@company.com"
                          />
                        </Field>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <Toggle
                            checked={smtpConfig.useTls}
                            onChange={(v) => setSmtpConfig((p) => ({ ...p, useTls: v }))}
                            label="Use STARTTLS / TLS encryption"
                          />
                          <Toggle
                            checked={smtpConfig.enabled}
                            onChange={(v) => setSmtpConfig((p) => ({ ...p, enabled: v }))}
                            label="Enable email delivery"
                          />
                        </div>

                        <div style={{
                          height: 1, background: "hsl(var(--border))", margin: "4px 0",
                        }} />

                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <SaveRow
                            onSave={handleSaveSmtp}
                            saving={smtpSaving}
                            saved={smtpSaved}
                          />
                          <button
                            onClick={handleTestSmtp}
                            disabled={smtpTesting || !smtpConfig.enabled}
                            style={{
                              display: "flex", alignItems: "center", gap: 6,
                              padding: "7px 14px", borderRadius: 7,
                              border: "1px solid hsl(217 91% 62% / 0.4)",
                              background: "hsl(217 91% 62% / 0.08)",
                              color: smtpConfig.enabled ? "hsl(217 91% 62%)" : "hsl(var(--muted-foreground))",
                              fontSize: 12.5, fontWeight: 600, cursor: smtpConfig.enabled ? "pointer" : "not-allowed",
                              opacity: smtpConfig.enabled ? 1 : 0.5,
                              transition: "all 0.15s",
                            }}
                          >
                            <Zap size={12} />
                            {smtpTesting ? "Sending…" : "Send test email"}
                          </button>
                        </div>

                        {smtpTestResult && (
                          <div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "10px 14px", borderRadius: 8,
                            background: smtpTestResult.ok
                              ? "hsl(var(--success) / 0.1)"
                              : "hsl(var(--destructive) / 0.08)",
                            border: `1px solid ${smtpTestResult.ok
                              ? "hsl(var(--success) / 0.25)"
                              : "hsl(var(--destructive) / 0.25)"}`,
                            animation: "fadeIn 0.2s ease-out",
                          }}>
                            {smtpTestResult.ok
                              ? <CheckCircle2 size={14} style={{ color: "hsl(var(--success))", flexShrink: 0 }} />
                              : <AlertCircle size={14} style={{ color: "hsl(var(--destructive))", flexShrink: 0 }} />
                            }
                            <span style={{
                              fontSize: 12.5, fontWeight: 500,
                              color: smtpTestResult.ok
                                ? "hsl(var(--success))"
                                : "hsl(var(--destructive))",
                            }}>
                              {smtpTestResult.msg}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </RefCard>

                {/* Delivery use cases info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { icon: Shield, label: "Workspace lookup", desc: "Sends workspace IDs when users forget them", accent: "250 80% 66%" },
                    { icon: Clock, label: "Alert notifications", desc: "Delivers alert rule email notifications", accent: "217 91% 62%" },
                  ].map(({ icon: Icon, label, desc, accent }) => (
                    <div key={label} style={{
                      padding: "12px 16px", borderRadius: 8,
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      display: "flex", gap: 12, alignItems: "flex-start",
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: `hsl(${accent} / 0.12)`,
                        border: `1px solid hsl(${accent} / 0.25)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon size={13} style={{ color: `hsl(${accent})` }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </TabContent>
        </div>
      </div>
    </>
  );
}
