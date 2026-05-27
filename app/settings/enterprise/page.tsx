"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import FormField from "@/components/shared/FormField";
import RefButton from "@/components/primitives/RefButton";
import { RefCard } from "@/components/primitives/RefCard";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { AuditLogEntry, SsoProvider, ProviderHealth, SpMetadata, RoleMapping, PiiRule, PiiConfig } from "@/types";
import {
  Shield, FileText, Key, EyeOff, Plus, Loader2, Lock,
  Copy, Check, Globe, Zap, Trash2, Eye, AlertTriangle,
  CreditCard, Mail, Hash, Fingerprint, Phone, Server,
  CheckCircle2, XCircle, Activity, ChevronRight, RotateCcw,
  Save, Settings, RefreshCw, ShieldCheck, Database, UserCheck,
  AlertCircle, Filter, Layers, Terminal,
} from "lucide-react";

// ── Default PII rule library ───────────────────────────────────────────────────

const DEFAULT_PII_RULES: PiiRule[] = [
  { ruleId: "pii_cc",    name: "Credit Card Numbers",     category: "financial", regexPattern: "\\b(?:\\d[ -]*?){13,16}\\b",                                          replacement: "[REDACTED_CC]",    enabled: true,  severity: "high"   },
  { ruleId: "pii_ssn",   name: "Social Security Numbers", category: "identity",  regexPattern: "\\b\\d{3}-\\d{2}-\\d{4}\\b",                                          replacement: "[REDACTED_SSN]",   enabled: true,  severity: "high"   },
  { ruleId: "pii_email", name: "Email Addresses",         category: "identity",  regexPattern: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b",             replacement: "[REDACTED_EMAIL]", enabled: true,  severity: "medium" },
  { ruleId: "pii_phone", name: "Phone Numbers",           category: "identity",  regexPattern: "\\b(?:\\+?1[-.]?)?(?:\\(\\d{3}\\)|\\d{3})[-.]?\\d{3}[-.]?\\d{4}\\b", replacement: "[REDACTED_PHONE]", enabled: false, severity: "medium" },
  { ruleId: "pii_key",   name: "API / Secret Keys",       category: "technical", regexPattern: "\\b(?:sk|pk|key|secret|token)[-_][a-zA-Z0-9]{16,}\\b",                replacement: "[REDACTED_KEY]",   enabled: true,  severity: "high"   },
  { ruleId: "pii_ip",    name: "IPv4 Addresses",          category: "technical", regexPattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b",                                    replacement: "[REDACTED_IP]",    enabled: false, severity: "low"    },
];

// ── Constants ──────────────────────────────────────────────────────────────────

const EMPTY_SAML: Partial<SsoProvider> = {
  protocol: "SAML", defaultRole: "VIEWER",
  roleMappings: [], allowedDomains: [], attributeMappings: {},
  signingCertThumbprint: "", entityId: "", signOnUrl: "",
};
const EMPTY_OIDC: Partial<SsoProvider> = {
  protocol: "OIDC", defaultRole: "VIEWER",
  roleMappings: [], allowedDomains: [], attributeMappings: {},
  scopes: ["openid", "email", "profile"],
};

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string; accent: string }> = {
  financial: { label: "Financial",  icon: CreditCard,  color: "hsl(38 92% 50%)",             accent: "38 92% 50%"  },
  identity:  { label: "Identity",   icon: Fingerprint, color: "hsl(var(--primary))",         accent: "250 80% 66%" },
  technical: { label: "Technical",  icon: Terminal,    color: "hsl(162 60% 44%)",            accent: "162 60% 44%" },
  custom:    { label: "Custom",     icon: Hash,        color: "hsl(var(--muted-foreground))", accent: "var(--muted-foreground)" },
};

const SEVERITY_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  high:   { bg: "hsl(0 72% 51% / 0.1)",  text: "hsl(0 72% 51%)",  border: "hsl(0 72% 51% / 0.25)"  },
  medium: { bg: "hsl(var(--warning) / 0.1)", text: "hsl(var(--warning))", border: "hsl(var(--warning) / 0.25)" },
  low:    { bg: "hsl(var(--muted) / 0.4)",   text: "hsl(var(--muted-foreground))", border: "hsl(var(--border))" },
};

const DEFAULT_PREVIEW_TEXT =
  "Contact jane.smith@company.com or call +1-555-012-3456.\n" +
  "Billing: CC 4532-0151-1283-0366 · SSN 123-45-6789\n" +
  "API key: key_demo_aBcDeFgHiJkLmNoPqRsTuVwX";

// ── Sidebar nav items ──────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "audit-logs", label: "Audit Trail",    icon: FileText,    accent: "38 90% 55%",  desc: "Activity log" },
  { id: "sso",        label: "SSO / Identity", icon: UserCheck,   accent: "250 80% 66%", desc: "Providers & health" },
  { id: "pii",        label: "PII Redaction",  icon: ShieldCheck, accent: "6 78% 57%",   desc: "Trace data gates" },
] as const;
type TabId = (typeof NAV_ITEMS)[number]["id"];

// ── Shared primitives ──────────────────────────────────────────────────────────

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
          width: 38, height: 38, borderRadius: 11,
          background: `hsl(${accent} / 0.15)`,
          border: `1px solid hsl(${accent} / 0.3)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 0 12px hsl(${accent} / 0.12)`,
        }}>
          <Icon size={17} style={{ color: `hsl(${accent})` }} />
        </div>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "hsl(var(--foreground))" }}>{title}</div>
          {sub && <div style={{ fontSize: 11.5, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function TabContent({ children, tabKey }: { children: React.ReactNode; tabKey: string }) {
  return (
    <div key={tabKey} style={{ animation: "settingsFadeIn 0.22s ease-out" }}>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string; dot: string }> = {
    ok:       { bg: "hsl(var(--success) / 0.12)", text: "hsl(var(--success))",      dot: "hsl(var(--success))" },
    error:    { bg: "hsl(0 72% 51% / 0.12)",      text: "hsl(0 72% 51%)",           dot: "hsl(0 72% 51%)" },
    disabled: { bg: "hsl(var(--muted) / 0.4)",    text: "hsl(var(--muted-foreground))", dot: "hsl(var(--muted-foreground))" },
    idle:     { bg: "hsl(var(--warning) / 0.12)", text: "hsl(var(--warning))",      dot: "hsl(var(--warning))" },
    warning:  { bg: "hsl(var(--warning) / 0.12)", text: "hsl(var(--warning))",      dot: "hsl(var(--warning))" },
  };
  const s = colors[status] ?? colors.idle;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", background: s.bg, color: s.text, fontFamily: "var(--font-mono)" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {status.toUpperCase()}
    </span>
  );
}

// ── Toggle switch ──────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label, size = "md" }: {
  checked: boolean; onChange: (v: boolean) => void; label?: string; size?: "sm" | "md";
}) {
  const w = size === "sm" ? 30 : 40;
  const h = size === "sm" ? 18 : 22;
  const r = h / 2;
  const d = size === "sm" ? 14 : 16;
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        width: w, height: h, borderRadius: r, padding: 0, border: "none",
        background: checked ? "hsl(var(--success))" : "hsl(var(--muted) / 0.5)",
        cursor: "pointer", position: "relative", flexShrink: 0,
        transition: "background 0.2s",
        boxShadow: checked ? "0 0 0 1px hsl(var(--success) / 0.5)" : "0 0 0 1px hsl(var(--border) / 0.3)",
      }}
    >
      <span style={{
        position: "absolute", top: (h - d) / 2,
        left: checked ? w - d - (h - d) / 2 : (h - d) / 2,
        width: d, height: d, borderRadius: d / 2,
        background: "white",
        transition: "left 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 1px 3px hsl(0 0% 0% / 0.3)",
      }} />
    </button>
  );
}

// ── Copy field ─────────────────────────────────────────────────────────────────

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "hsl(var(--muted-foreground))", marginBottom: 5, fontFamily: "var(--font-mono)" }}>
        {label}
      </div>
      <div style={{ display: "flex", background: "hsl(var(--background) / 0.5)", border: "1px solid hsl(var(--border) / 0.2)", borderRadius: 9, overflow: "hidden" }}>
        <span style={{ flex: 1, padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
          {value}
        </span>
        <button type="button" onClick={copy} style={{ padding: "7px 12px", background: copied ? "hsl(var(--success) / 0.12)" : "hsl(var(--muted) / 0.3)", border: "none", borderLeft: "1px solid hsl(var(--border) / 0.15)", cursor: "pointer", color: copied ? "hsl(var(--success))" : "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: "var(--font-mono)", transition: "background 0.15s, color 0.15s", flexShrink: 0 }}>
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

// ── Step badge ─────────────────────────────────────────────────────────────────

function StepBadge({ n, done, accent = "var(--primary)" }: { n: number; done?: boolean; accent?: string }) {
  return (
    <div style={{ width: 26, height: 26, borderRadius: 13, background: done ? "hsl(var(--success) / 0.15)" : `hsl(${accent} / 0.12)`, border: done ? "1px solid hsl(var(--success) / 0.25)" : `1px solid hsl(${accent} / 0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {done
        ? <Check size={12} style={{ color: "hsl(var(--success))" }} />
        : <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: `hsl(${accent})` }}>{n}</span>}
    </div>
  );
}

function SectionHead({ step, title, sub, done, accent = "250 80% 66%" }: { step: number; title: string; sub: string; done?: boolean; accent?: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
      <StepBadge n={step} done={done} accent={accent} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", color: "hsl(var(--foreground))", marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{sub}</div>
      </div>
    </div>
  );
}

// ── PII Live Preview ───────────────────────────────────────────────────────────

function PiiPreviewTester({ rules }: { rules: PiiRule[] }) {
  const [input, setInput] = useState(DEFAULT_PREVIEW_TEXT);
  const [focused, setFocused] = useState(false);

  const redacted = useMemo(() => {
    let text = input;
    for (const rule of rules.filter((r) => r.enabled)) {
      try { text = text.replace(new RegExp(rule.regexPattern, "gi"), rule.replacement); }
      catch { /* invalid regex */ }
    }
    return text;
  }, [input, rules]);

  const changedCount = useMemo(() => {
    const matches: string[] = [];
    for (const rule of rules.filter((r) => r.enabled)) {
      try { const m = input.match(new RegExp(rule.regexPattern, "gi")); if (m) matches.push(...m); }
      catch { /* */ }
    }
    return matches.length;
  }, [input, rules]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "hsl(6 78% 57% / 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Eye size={11} style={{ color: "hsl(6 78% 57%)" }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)", color: "hsl(var(--foreground))" }}>Live Redaction Preview</span>
        </div>
        {changedCount > 0 && (
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", background: "hsl(var(--success) / 0.12)", color: "hsl(var(--success))", borderRadius: 20, padding: "3px 10px", fontWeight: 600, border: "1px solid hsl(var(--success) / 0.2)" }}>
            {changedCount} {changedCount === 1 ? "match" : "matches"} redacted
          </span>
        )}
      </div>

      <div>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))", marginBottom: 5 }}>
          Sample Input
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={4}
          style={{
            width: "100%", boxSizing: "border-box",
            background: "hsl(var(--card-elev))",
            border: focused ? "1px solid hsl(6 78% 57% / 0.5)" : "1px solid hsl(var(--border) / 0.2)",
            borderRadius: 10, padding: "8px 12px",
            fontSize: 11, fontFamily: "var(--font-mono)", color: "hsl(var(--foreground))",
            outline: "none", resize: "vertical",
            boxShadow: focused ? "0 0 0 3px hsl(6 78% 57% / 0.08)" : "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
        />
      </div>

      <div>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))", marginBottom: 5 }}>
          Redacted Output
        </div>
        <div style={{
          background: changedCount > 0 ? "hsl(var(--success) / 0.04)" : "hsl(var(--background) / 0.5)",
          border: "1px solid " + (changedCount > 0 ? "hsl(var(--success) / 0.15)" : "hsl(var(--border) / 0.15)"),
          borderRadius: 10, padding: "8px 12px",
          fontSize: 11, fontFamily: "var(--font-mono)", color: "hsl(var(--foreground))",
          whiteSpace: "pre-wrap", wordBreak: "break-all",
          minHeight: 78, lineHeight: 1.6,
          transition: "border-color 0.2s, background 0.2s",
        }}>
          {redacted.split(/(\[REDACTED[^\]]*\])/g).map((part, i) =>
            part.startsWith("[REDACTED")
              ? <mark key={i} style={{ background: "hsl(var(--success) / 0.15)", color: "hsl(var(--success))", borderRadius: 4, padding: "1px 4px", fontWeight: 600 }}>{part}</mark>
              : part
          )}
        </div>
      </div>

      <button type="button" onClick={() => setInput(DEFAULT_PREVIEW_TEXT)} style={{ alignSelf: "flex-end", fontSize: 10, fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
        <RotateCcw size={9} /> Reset sample
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function EnterpriseSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("audit-logs");

  // ── Audit logs ────────────────────────────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // ── SSO ───────────────────────────────────────────────────────────────────────
  const [providers, setProviders] = useState<SsoProvider[]>([]);
  const [providerHealth, setProviderHealth] = useState<ProviderHealth[]>([]);
  const [spMetadata, setSpMetadata] = useState<SpMetadata | null>(null);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoError, setSsoError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<SsoProvider | null>(null);
  const [formProtocol, setFormProtocol] = useState<"SAML" | "OIDC">("SAML");
  const [formData, setFormData] = useState<Partial<SsoProvider>>(EMPTY_SAML);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaved, setFormSaved] = useState(false);
  const [metadataXml, setMetadataXml] = useState("");

  // ── PII ───────────────────────────────────────────────────────────────────────
  const [piiRules, setPiiRules] = useState<PiiRule[]>(DEFAULT_PII_RULES);
  const [masterRedact, setMasterRedact] = useState(false);
  const [piiLoading, setPiiLoading] = useState(false);
  const [piiDirty, setPiiDirty] = useState(false);
  const [piiSaving, setPiiSaving] = useState(false);
  const [piiSaved, setPiiSaved] = useState(false);
  const [newPiiRule, setNewPiiRule] = useState({ name: "", regexPattern: "", replacement: "[REDACTED]" });
  const [showNewRule, setShowNewRule] = useState(false);

  // ── Load audit logs ────────────────────────────────────────────────────────────
  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await api.listAuditLogs(0, 50);
      setAuditLogs(res.items ?? []);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  // ── Load SSO ───────────────────────────────────────────────────────────────────
  const loadSso = useCallback(async () => {
    setSsoLoading(true);
    setSsoError(null);
    try {
      const [provs, health, meta] = await Promise.allSettled([
        api.listSsoProviders(),
        api.getSsoHealth(),
        api.getSpMetadata(),
      ]);
      if (provs.status === "fulfilled") setProviders(provs.value);
      if (health.status === "fulfilled") setProviderHealth(health.value);
      if (meta.status === "fulfilled") setSpMetadata(meta.value);
    } finally {
      setSsoLoading(false);
    }
  }, []);

  // ── Load PII config ────────────────────────────────────────────────────────────
  const loadPii = useCallback(async () => {
    setPiiLoading(true);
    try {
      const config = await api.getPiiConfig();
      setMasterRedact(config.masterEnabled);
      setPiiRules(config.rules.length > 0 ? config.rules : DEFAULT_PII_RULES);
    } catch {
      // API not yet available — keep default rules, master off
    } finally {
      setPiiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "audit-logs") loadAuditLogs();
    if (activeTab === "sso") loadSso();
    if (activeTab === "pii") loadPii();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── SSO form helpers ───────────────────────────────────────────────────────────
  const openAddForm = (protocol: "SAML" | "OIDC" = "SAML") => {
    setEditingProvider(null);
    setFormProtocol(protocol);
    setFormData(protocol === "SAML" ? { ...EMPTY_SAML } : { ...EMPTY_OIDC });
    setFormError(null);
    setFormSaved(false);
    setMetadataXml("");
    setShowForm(true);
  };

  const openEditForm = (p: SsoProvider) => {
    setEditingProvider(p);
    setFormProtocol(p.protocol);
    setFormData({ ...p });
    setFormError(null);
    setFormSaved(false);
    setMetadataXml("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProvider(null);
    setFormData(EMPTY_SAML);
    setFormError(null);
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaving(true);
    setFormError(null);
    try {
      const payload = { ...formData, protocol: formProtocol } as SsoProvider;
      let saved: SsoProvider;
      if (editingProvider?.id) {
        saved = formProtocol === "SAML"
          ? await api.updateSamlProvider(editingProvider.id, payload)
          : await api.updateOidcProvider(editingProvider.id, payload);
      } else {
        saved = formProtocol === "SAML"
          ? await api.createSamlProvider(payload)
          : await api.createOidcProvider(payload);
      }
      if (formProtocol === "SAML" && metadataXml.trim() && saved.id) {
        await api.uploadSamlMetadata(saved.id, metadataXml.trim());
      }
      setFormSaved(true);
      setTimeout(() => { setFormSaved(false); closeForm(); loadSso(); }, 1500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteProvider = async (p: SsoProvider) => {
    if (!p.id) return;
    if (!confirm(`Delete SSO provider "${p.providerName}"? This will disable login for all users on this provider.`)) return;
    await api.deleteProvider(p.id, p.protocol);
    loadSso();
  };

  const handleToggleProvider = async (p: SsoProvider) => {
    if (!p.id) return;
    await api.toggleProvider(p.id, p.protocol, !p.enabled);
    loadSso();
  };

  // ── PII helpers ────────────────────────────────────────────────────────────────
  const handleSavePii = async () => {
    setPiiSaving(true);
    try {
      await api.savePiiConfig({ masterEnabled: masterRedact, rules: piiRules });
      setPiiDirty(false);
      setPiiSaved(true);
      setTimeout(() => setPiiSaved(false), 3000);
    } catch { /* surface error if needed */ } finally {
      setPiiSaving(false);
    }
  };

  const toggleRule = useCallback((id: string) => {
    setPiiRules((r) => r.map((x) => x.ruleId === id ? { ...x, enabled: !x.enabled } : x));
    setPiiDirty(true);
  }, []);

  const deleteRule = useCallback((id: string) => {
    setPiiRules((r) => r.filter((x) => x.ruleId !== id));
    setPiiDirty(true);
  }, []);

  const handleMasterToggle = (v: boolean) => {
    setMasterRedact(v);
    setPiiDirty(true);
  };

  const handleCreatePiiRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPiiRule.name || !newPiiRule.regexPattern) return;
    setPiiRules([...piiRules, {
      ruleId: `pii_${Date.now().toString().slice(-8)}`,
      name: newPiiRule.name, category: "custom",
      regexPattern: newPiiRule.regexPattern, replacement: newPiiRule.replacement,
      enabled: true, severity: "medium",
    }]);
    setNewPiiRule({ name: "", regexPattern: "", replacement: "[REDACTED]" });
    setShowNewRule(false);
    setPiiDirty(true);
  };

  const activeRulesCount = piiRules.filter((r) => r.enabled).length;

  const categorised = useMemo(() => {
    const out: Record<string, PiiRule[]> = {};
    for (const r of piiRules) {
      if (!out[r.category]) out[r.category] = [];
      out[r.category].push(r);
    }
    return out;
  }, [piiRules]);

  const activeNav = NAV_ITEMS.find((n) => n.id === activeTab)!;

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
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .ent-nav-item:hover {
          background: hsl(var(--muted) / 0.5) !important;
        }
        .audit-row:hover td { background: hsl(var(--muted) / 0.15); }
        .rule-row:hover { border-color: hsl(6 78% 57% / 0.25) !important; }
        .provider-card:hover { border-color: hsl(250 80% 66% / 0.3) !important; }
      `}</style>

      <PageHeader
        title="Enterprise Governance"
        accent="/ compliance"
        sub="Audit logs, identity provider configuration, and trace-level PII redaction gates."
      />

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginTop: 4 }}>

        {/* ── Left nav sidebar ── */}
        <div style={{
          width: 200, flexShrink: 0,
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: 14,
          padding: 8,
          position: "sticky", top: 80,
          boxShadow: "0 2px 12px hsl(0 0% 0% / 0.04)",
        }}>
          {/* Mini header */}
          <div style={{ padding: "6px 8px 10px", marginBottom: 4, borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}>
              Governance
            </div>
          </div>

          {NAV_ITEMS.map((item) => {
            const active = item.id === activeTab;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className="ent-nav-item"
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", borderRadius: 9, border: "none",
                  cursor: "pointer", textAlign: "left",
                  marginBottom: 2,
                  background: active ? `hsl(${item.accent} / 0.12)` : "transparent",
                  transition: "background 0.15s",
                  outline: active ? `1px solid hsl(${item.accent} / 0.3)` : "none",
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: active ? `hsl(${item.accent} / 0.2)` : "hsl(var(--muted) / 0.5)",
                  transition: "background 0.15s",
                  boxShadow: active ? `0 0 8px hsl(${item.accent} / 0.2)` : "none",
                }}>
                  <Icon size={14} style={{ color: active ? `hsl(${item.accent})` : "hsl(var(--muted-foreground))" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: active ? 600 : 500, color: active ? `hsl(${item.accent})` : "hsl(var(--foreground))", lineHeight: 1.2 }}>
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
          <TabContent tabKey={activeTab}>

            {/* ────────────────────────────────────────────────────────────── */}
            {/* AUDIT TRAIL                                                    */}
            {/* ────────────────────────────────────────────────────────────── */}
            {activeTab === "audit-logs" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <SectionHeader
                  icon={FileText}
                  title="System Audit Trail"
                  sub="Immutable, append-only · SOC 2 compliant activity log"
                  accent="38 90% 55%"
                  action={
                    <RefButton variant="outline" icon={RefreshCw} onClick={loadAuditLogs}>
                      Refresh
                    </RefButton>
                  }
                />

                {/* Stats bar */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { label: "Total Events", value: String(auditLogs.length), icon: Database,  accent: "38 90% 55%" },
                    { label: "Unique Users",  value: String(new Set(auditLogs.map(l => l.userId).filter(Boolean)).size), icon: UserCheck, accent: "250 80% 66%" },
                    { label: "Audit Level",  value: "SOC 2",                  icon: ShieldCheck, accent: "162 60% 44%" },
                  ].map(({ label, value, icon: Icon, accent }) => (
                    <div key={label} style={{ padding: "14px 16px", background: "hsl(var(--card))", borderRadius: 12, border: "1px solid hsl(var(--border) / 0.12)", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: `hsl(${accent} / 0.12)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={14} style={{ color: `hsl(${accent})` }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)", color: `hsl(${accent})` }}>{value}</div>
                        <div style={{ fontSize: 10.5, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>{label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <RefCard>
                  <div style={{ padding: "0" }}>
                    {/* Card header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1px solid hsl(var(--border) / 0.1)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "hsl(38 90% 55%)", animation: "pulse-dot 2s infinite" }} />
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)" }}>Live Audit Log</span>
                      <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))", background: "hsl(var(--muted) / 0.4)", padding: "2px 8px", borderRadius: 6 }}>
                        last 50 events
                      </span>
                    </div>

                    {auditLoading ? (
                      <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "hsl(38 90% 55%)" }} />
                      </div>
                    ) : auditLogs.length === 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "64px 24px" }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: "hsl(38 90% 55% / 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FileText size={22} style={{ color: "hsl(38 90% 55%)" }} />
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, fontFamily: "var(--font-mono)" }}>No audit events yet</div>
                        <div style={{ fontSize: 11.5, color: "hsl(var(--muted-foreground))", textAlign: "center", maxWidth: 300 }}>
                          Events appear here as users interact with the platform — login, config changes, key revocations, and more.
                        </div>
                      </div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5, fontFamily: "var(--font-mono)" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid hsl(var(--border) / 0.1)" }}>
                              {["Log ID", "Timestamp", "User", "Action", "Resource", "IP"].map((h) => (
                                <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap", background: "hsl(var(--muted) / 0.2)" }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {auditLogs.map((log) => (
                              <tr key={log.logId} className="audit-row" style={{ borderBottom: "1px solid hsl(var(--border) / 0.07)", transition: "background 0.12s" }}>
                                <td style={{ padding: "9px 16px", whiteSpace: "nowrap" }}>
                                  <span style={{ color: "hsl(38 90% 55%)", fontWeight: 600, fontSize: 11 }}>{log.logId.slice(0, 8)}…</span>
                                </td>
                                <td style={{ padding: "9px 16px", color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap", fontSize: 11 }}>
                                  {new Date(log.createdAt).toLocaleString()}
                                </td>
                                <td style={{ padding: "9px 16px" }}>
                                  <span style={{ background: "hsl(var(--muted) / 0.4)", borderRadius: 6, padding: "2px 8px", fontSize: 10.5 }}>
                                    {log.username || log.userId || "—"}
                                  </span>
                                </td>
                                <td style={{ padding: "9px 16px" }}>
                                  <span style={{ background: "hsl(38 90% 55% / 0.1)", color: "hsl(38 90% 55%)", borderRadius: 6, padding: "2px 8px", fontSize: 10.5, fontWeight: 700 }}>
                                    {log.action}
                                  </span>
                                </td>
                                <td style={{ padding: "9px 16px", color: "hsl(var(--muted-foreground))", fontSize: 11 }}>
                                  {log.resourceType}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ""}
                                </td>
                                <td style={{ padding: "9px 16px", color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap", fontSize: 11 }}>
                                  {log.ipAddress || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </RefCard>
              </div>
            )}

            {/* ────────────────────────────────────────────────────────────── */}
            {/* SSO / IDENTITY                                                 */}
            {/* ────────────────────────────────────────────────────────────── */}
            {activeTab === "sso" && (
              ssoLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                  <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "hsl(250 80% 66%)" }} />
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>
                  {/* Left */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <SectionHeader
                      icon={UserCheck}
                      title="Identity Providers"
                      sub={providers.length === 0 ? "No providers configured" : `${providers.filter(p => p.enabled).length} of ${providers.length} active`}
                      accent="250 80% 66%"
                      action={
                        <div style={{ display: "flex", gap: 8 }}>
                          <RefButton variant="outline" icon={RefreshCw} onClick={loadSso}>Refresh</RefButton>
                          <RefButton variant="outline" onClick={() => openAddForm("OIDC")}>+ OIDC</RefButton>
                          <RefButton variant="primary" icon={Plus} onClick={() => openAddForm("SAML")}>Add SAML</RefButton>
                        </div>
                      }
                    />

                    {/* Empty state */}
                    {providers.length === 0 && !showForm && (
                      <RefCard>
                        <div style={{ padding: "52px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
                          <div style={{ width: 56, height: 56, borderRadius: 16, background: "hsl(250 80% 66% / 0.1)", border: "1px solid hsl(250 80% 66% / 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Key size={24} style={{ color: "hsl(250 80% 66%)" }} />
                          </div>
                          <div style={{ fontSize: 14.5, fontWeight: 700, fontFamily: "var(--font-mono)" }}>No SSO providers configured</div>
                          <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", maxWidth: 340 }}>
                            Add a SAML 2.0 or OIDC provider to enable enterprise single sign-on. Multiple providers are supported simultaneously.
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            <RefButton variant="outline" onClick={() => openAddForm("OIDC")}>Add OIDC Provider</RefButton>
                            <RefButton variant="primary" icon={Plus} onClick={() => openAddForm("SAML")}>Add SAML Provider</RefButton>
                          </div>
                        </div>
                      </RefCard>
                    )}

                    {/* Provider cards */}
                    {providers.map((p) => {
                      const health = providerHealth.find(h => h.id === p.id);
                      const isSaml = p.protocol === "SAML";
                      const protoAccent = isSaml ? "210 90% 55%" : "162 60% 44%";
                      return (
                        <RefCard key={p.id}>
                          <div className="provider-card" style={{ padding: "16px 18px", transition: "border-color 0.15s" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                              {/* Protocol badge */}
                              <div style={{ width: 44, height: 44, borderRadius: 12, background: `hsl(${protoAccent} / 0.12)`, border: `1px solid hsl(${protoAccent} / 0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <span style={{ fontSize: 9, fontWeight: 800, fontFamily: "var(--font-mono)", color: `hsl(${protoAccent})`, letterSpacing: "0.05em" }}>
                                  {p.protocol}
                                </span>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                                  <span style={{ fontSize: 13.5, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{p.providerName}</span>
                                  <StatusBadge status={p.enabled ? (health?.status ?? "ok") : "disabled"} />
                                </div>
                                <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginBottom: 10, fontFamily: "var(--font-mono)" }}>
                                  {isSaml ? `Entity: ${p.entityId || "—"}` : `Issuer: ${p.issuerUri || "—"}`}
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                  <span style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", background: "hsl(var(--muted)/0.5)", color: "hsl(var(--muted-foreground))", padding: "2px 8px", borderRadius: 20, border: "1px solid hsl(var(--border) / 0.2)" }}>
                                    Default: {p.defaultRole}
                                  </span>
                                  {p.roleMappings.length > 0 && (
                                    <span style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", background: "hsl(250 80% 66% / 0.1)", color: "hsl(250 80% 66%)", padding: "2px 8px", borderRadius: 20, border: "1px solid hsl(250 80% 66% / 0.2)" }}>
                                      {p.roleMappings.length} role mapping{p.roleMappings.length !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                  {p.allowedDomains.length > 0 && (
                                    <span style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", background: "hsl(162 60% 44% / 0.1)", color: "hsl(162 60% 44%)", padding: "2px 8px", borderRadius: 20, border: "1px solid hsl(162 60% 44% / 0.2)" }}>
                                      {p.allowedDomains.length} domain{p.allowedDomains.length !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                <Toggle checked={p.enabled} onChange={() => handleToggleProvider(p)} label={`Toggle ${p.providerName}`} size="sm" />
                                <button type="button" onClick={() => openEditForm(p)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid hsl(var(--border)/0.2)", background: "hsl(var(--card-elev))", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
                                  <Settings size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
                                </button>
                                <button type="button" onClick={() => handleDeleteProvider(p)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid hsl(0 72% 51% / 0.2)", background: "hsl(0 72% 51% / 0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
                                  <Trash2 size={13} style={{ color: "hsl(0 72% 51%)" }} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </RefCard>
                      );
                    })}

                    {/* Add / Edit form */}
                    {showForm && (
                      <RefCard>
                        <div style={{ padding: "18px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 9, background: "hsl(250 80% 66% / 0.12)", border: "1px solid hsl(250 80% 66% / 0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Key size={14} style={{ color: "hsl(250 80% 66%)" }} />
                              </div>
                              <span style={{ fontSize: 13.5, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                                {editingProvider ? `Edit · ${editingProvider.providerName}` : "Add Identity Provider"}
                              </span>
                            </div>
                            {!editingProvider && (
                              <div style={{ display: "flex", background: "hsl(var(--muted)/0.4)", borderRadius: 9, padding: 3, gap: 2 }}>
                                {(["SAML", "OIDC"] as const).map((proto) => (
                                  <button key={proto} type="button"
                                    onClick={() => { setFormProtocol(proto); setFormData(proto === "SAML" ? { ...EMPTY_SAML } : { ...EMPTY_OIDC }); }}
                                    style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)", padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer", background: formProtocol === proto ? "hsl(var(--card))" : "transparent", color: formProtocol === proto ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", boxShadow: formProtocol === proto ? "0 1px 3px hsl(0 0% 0%/0.1)" : "none", transition: "all 0.15s" }}>
                                    {proto}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {formError && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "hsl(0 72% 51% / 0.08)", border: "1px solid hsl(0 72% 51% / 0.2)", borderRadius: 10, marginBottom: 16 }}>
                              <XCircle size={14} style={{ color: "hsl(0 72% 51%)", flexShrink: 0 }} />
                              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "hsl(0 72% 51%)" }}>{formError}</span>
                            </div>
                          )}

                          <form onSubmit={handleSaveProvider} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {/* Common: provider name + default role */}
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                              <FormField label="Provider Name">
                                <Input required value={formData.providerName ?? ""} onChange={(e) => setFormData({ ...formData, providerName: e.target.value })} placeholder="e.g. Okta-Production" />
                              </FormField>
                              <FormField label="Default Role">
                                <select value={formData.defaultRole ?? "VIEWER"} onChange={(e) => setFormData({ ...formData, defaultRole: e.target.value })}
                                  style={{ width: "100%", height: 36, padding: "0 10px", borderRadius: 8, border: "1px solid hsl(var(--border)/0.3)", background: "hsl(var(--card-elev))", fontSize: 12, fontFamily: "var(--font-mono)", color: "hsl(var(--foreground))", cursor: "pointer" }}>
                                  <option value="VIEWER">VIEWER</option>
                                  <option value="MEMBER">MEMBER</option>
                                  <option value="ADMIN">ADMIN</option>
                                </select>
                              </FormField>
                            </div>

                            {/* SAML-specific fields */}
                            {formProtocol === "SAML" && (
                              <div style={{ background: "hsl(210 90% 55% / 0.04)", border: "1px solid hsl(210 90% 55% / 0.12)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "hsl(210 90% 55%)", fontFamily: "var(--font-mono)" }}>SAML 2.0 Configuration</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                  <FormField label="IdP Entity ID">
                                    <Input value={formData.entityId ?? ""} onChange={(e) => setFormData({ ...formData, entityId: e.target.value })} placeholder="https://idp.example.com/metadata" />
                                  </FormField>
                                  <FormField label="IdP SSO URL">
                                    <Input value={formData.signOnUrl ?? ""} onChange={(e) => setFormData({ ...formData, signOnUrl: e.target.value })} placeholder="https://idp.example.com/sso/saml" />
                                  </FormField>
                                  <FormField label="ACS URL">
                                    <Input value={formData.acsUrl ?? ""} onChange={(e) => setFormData({ ...formData, acsUrl: e.target.value })} placeholder="https://chorus.example.com/login/saml2/sso/..." />
                                  </FormField>
                                  <FormField label="Cert SHA-256 Thumbprint (optional)">
                                    <Input value={formData.signingCertThumbprint ?? ""} onChange={(e) => setFormData({ ...formData, signingCertThumbprint: e.target.value })} placeholder="aa:bb:cc:..." />
                                  </FormField>
                                </div>
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 600, fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    IdP Certificate — choose one:
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <FormField label="Metadata URL (auto-fetch)">
                                      <Input value={formData.metadataUrl ?? ""} onChange={(e) => setFormData({ ...formData, metadataUrl: e.target.value })} placeholder="https://idp.example.com/metadata.xml" />
                                    </FormField>
                                    <FormField label="Direct PEM Certificate">
                                      <textarea value={formData.idpCertPem ?? ""} onChange={(e) => setFormData({ ...formData, idpCertPem: (e.target as HTMLTextAreaElement).value })} placeholder={"-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"}
                                        style={{ width: "100%", minHeight: 72, padding: "8px 10px", borderRadius: 8, border: "1px solid hsl(var(--border)/0.3)", background: "hsl(var(--card-elev))", fontSize: 11, fontFamily: "var(--font-mono)", resize: "vertical", color: "hsl(var(--foreground))" }} />
                                    </FormField>
                                    <FormField label="Metadata XML (upload/paste)">
                                      <textarea value={metadataXml} onChange={(e) => setMetadataXml((e.target as HTMLTextAreaElement).value)} placeholder="Paste your IdP metadata XML here…"
                                        style={{ width: "100%", minHeight: 72, padding: "8px 10px", borderRadius: 8, border: "1px solid hsl(var(--border)/0.3)", background: "hsl(var(--card-elev))", fontSize: 11, fontFamily: "var(--font-mono)", resize: "vertical", color: "hsl(var(--foreground))" }} />
                                    </FormField>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* OIDC-specific fields */}
                            {formProtocol === "OIDC" && (
                              <div style={{ background: "hsl(162 60% 44% / 0.04)", border: "1px solid hsl(162 60% 44% / 0.12)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "hsl(162 60% 44%)", fontFamily: "var(--font-mono)" }}>OIDC / OAuth2 Configuration</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                  <FormField label="Client ID">
                                    <Input required value={formData.clientId ?? ""} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} placeholder="Client ID from your IdP" />
                                  </FormField>
                                  <FormField label="Client Secret">
                                    <Input type="password" required value={formData.clientSecret ?? ""} onChange={(e) => setFormData({ ...formData, clientSecret: (e.target as HTMLInputElement).value })} placeholder="••••••••••••" />
                                  </FormField>
                                </div>
                                <FormField label="Issuer URI (OIDC Discovery endpoint base)">
                                  <Input required value={formData.issuerUri ?? ""} onChange={(e) => setFormData({ ...formData, issuerUri: e.target.value })} placeholder="https://accounts.google.com" />
                                </FormField>
                                <FormField label="Scopes (comma-separated)">
                                  <Input value={(formData.scopes ?? []).join(", ")} onChange={(e) => setFormData({ ...formData, scopes: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="openid, email, profile, groups" />
                                </FormField>
                              </div>
                            )}

                            {/* Role Mappings */}
                            <div style={{ border: "1px solid hsl(var(--border)/0.15)", borderRadius: 12, overflow: "hidden" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "hsl(var(--muted)/0.3)", borderBottom: "1px solid hsl(var(--border)/0.08)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                  <Layers size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
                                  <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)" }}>Role Mappings</div>
                                </div>
                                <button type="button" onClick={() => setFormData({ ...formData, roleMappings: [...(formData.roleMappings ?? []), { claim: "groups", value: "", role: "VIEWER" }] })}
                                  style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "hsl(250 80% 66%)", background: "hsl(250 80% 66% / 0.1)", border: "1px solid hsl(250 80% 66% / 0.2)", borderRadius: 6, cursor: "pointer", padding: "3px 10px" }}>
                                  + Add
                                </button>
                              </div>
                              <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                                {(formData.roleMappings ?? []).length === 0 ? (
                                  <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)", textAlign: "center", padding: "10px 0" }}>
                                    No mappings · users get default role
                                  </div>
                                ) : (formData.roleMappings ?? []).map((rm, idx) => (
                                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px auto", gap: 6, alignItems: "center" }}>
                                    <Input value={rm.claim} onChange={(e) => { const m = [...(formData.roleMappings ?? [])]; m[idx] = { ...m[idx], claim: e.target.value }; setFormData({ ...formData, roleMappings: m }); }} placeholder="Claim (e.g. groups)" style={{ fontSize: 11, height: 30 }} />
                                    <Input value={rm.value} onChange={(e) => { const m = [...(formData.roleMappings ?? [])]; m[idx] = { ...m[idx], value: e.target.value }; setFormData({ ...formData, roleMappings: m }); }} placeholder="Value (e.g. admins)" style={{ fontSize: 11, height: 30 }} />
                                    <select value={rm.role} onChange={(e) => { const m = [...(formData.roleMappings ?? [])]; m[idx] = { ...m[idx], role: e.target.value }; setFormData({ ...formData, roleMappings: m }); }}
                                      style={{ height: 30, padding: "0 6px", borderRadius: 7, border: "1px solid hsl(var(--border)/0.3)", background: "hsl(var(--card-elev))", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                                      <option>VIEWER</option><option>MEMBER</option><option>ADMIN</option>
                                    </select>
                                    <button type="button" onClick={() => { const m = [...(formData.roleMappings ?? [])]; m.splice(idx, 1); setFormData({ ...formData, roleMappings: m }); }}
                                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "hsl(0 72% 51%)" }}>
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Allowed Domains */}
                            <FormField label="Allowed Email Domains (leave empty to allow all)">
                              <Input value={(formData.allowedDomains ?? []).join(", ")} onChange={(e) => setFormData({ ...formData, allowedDomains: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="company.com, acme.org" />
                            </FormField>

                            {/* Attribute Mappings */}
                            <div style={{ border: "1px solid hsl(var(--border)/0.15)", borderRadius: 12, overflow: "hidden" }}>
                              <div style={{ padding: "10px 14px", background: "hsl(var(--muted)/0.3)", borderBottom: "1px solid hsl(var(--border)/0.08)", display: "flex", alignItems: "center", gap: 7 }}>
                                <Filter size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
                                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                                  Attribute / Claim Mappings
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 400, color: "hsl(var(--muted-foreground))", marginLeft: 4 }}>override default claim names</span>
                              </div>
                              <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                                {[
                                  { key: "email",  placeholder: formProtocol === "OIDC" ? "email"  : "http://schemas.xmlsoap.org/.../emailaddress" },
                                  { key: "name",   placeholder: formProtocol === "OIDC" ? "name"   : "http://schemas.xmlsoap.org/.../displayname"  },
                                  { key: "groups", placeholder: formProtocol === "OIDC" ? "groups" : "groups" },
                                ].map(({ key, placeholder }) => (
                                  <div key={key} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 8, alignItems: "center" }}>
                                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))" }}>{key}</span>
                                    <Input value={(formData.attributeMappings ?? {})[key] ?? ""} onChange={(e) => setFormData({ ...formData, attributeMappings: { ...(formData.attributeMappings ?? {}), [key]: e.target.value } })} placeholder={placeholder} style={{ fontSize: 11, height: 30 }} />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 6, borderTop: "1px solid hsl(var(--border)/0.08)" }}>
                              <RefButton variant="outline" type="button" onClick={closeForm}>Cancel</RefButton>
                              <RefButton variant="primary" type="submit" icon={formSaved ? CheckCircle2 : Lock} disabled={formSaving}>
                                {formSaving
                                  ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
                                  : formSaved ? "Saved!" : (editingProvider ? "Update Provider" : "Create Provider")}
                              </RefButton>
                            </div>
                          </form>
                        </div>
                      </RefCard>
                    )}
                  </div>

                  {/* Right: SP metadata + health */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* Provider health */}
                    {providerHealth.length > 0 && (
                      <RefCard>
                        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: "hsl(250 80% 66% / 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Activity size={12} style={{ color: "hsl(250 80% 66%)" }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)" }}>Provider Health</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {providerHealth.map((h, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "hsl(var(--muted) / 0.2)", borderRadius: 8 }}>
                                <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: h.status === "ok" ? "hsl(var(--success))" : h.status === "disabled" ? "hsl(var(--muted-foreground))" : "hsl(var(--warning))" }} />
                                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.providerName}</span>
                                <StatusBadge status={h.status} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </RefCard>
                    )}

                    {/* SP Metadata */}
                    <RefCard>
                      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: "hsl(250 80% 66% / 0.1)", border: "1px solid hsl(250 80% 66% / 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Globe size={13} style={{ color: "hsl(250 80% 66%)" }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)" }}>Service Provider Metadata</div>
                            <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}>Configure in your IdP</div>
                          </div>
                        </div>

                        {spMetadata ? (
                          <>
                            <CopyField label="ACS URL" value={spMetadata.acsUrl} />
                            <CopyField label="SP Entity ID" value={spMetadata.entityId} />
                            {spMetadata.scimEndpoint && (
                              <CopyField label="SCIM Endpoint" value={spMetadata.scimEndpoint} />
                            )}
                            {spMetadata.spCertPem && (
                              <div>
                                <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)", marginBottom: 4 }}>SP Signing Certificate</div>
                                <textarea readOnly value={spMetadata.spCertPem}
                                  style={{ width: "100%", minHeight: 80, padding: "8px 10px", borderRadius: 8, border: "1px solid hsl(var(--border)/0.3)", background: "hsl(var(--card-elev))", fontSize: 9, fontFamily: "var(--font-mono)", resize: "none", color: "hsl(var(--muted-foreground))" }} />
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))", padding: "12px 0", textAlign: "center" }}>
                            Metadata unavailable · check backend connectivity
                          </div>
                        )}
                        <RefButton variant="outline" onClick={loadSso} style={{ width: "100%", justifyContent: "center" }}>
                          Refresh
                        </RefButton>
                      </div>
                    </RefCard>

                    {/* Key rotation */}
                    <RefCard>
                      <div style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 7, background: "hsl(38 90% 55% / 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <RotateCcw size={12} style={{ color: "hsl(38 90% 55%)" }} />
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)" }}>SP Key Rotation</div>
                        </div>
                        <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginBottom: 12, lineHeight: 1.5 }}>
                          Rotate the SAML signing key. Update the SP certificate in all IdPs after rotation.
                        </div>
                        <RefButton variant="outline" icon={RotateCcw} onClick={async () => { if (confirm("Rotate SP signing key? You must update the new certificate in all IdPs.")) { await api.rotateSpKey(); loadSso(); } }}>
                          Rotate Key
                        </RefButton>
                      </div>
                    </RefCard>
                  </div>
                </div>
              )
            )}

            {/* ────────────────────────────────────────────────────────────── */}
            {/* PII REDACTION                                                  */}
            {/* ────────────────────────────────────────────────────────────── */}
            {activeTab === "pii" && (
              piiLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                  <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "hsl(6 78% 57%)" }} />
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
                  {/* Left: rules */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <SectionHeader
                      icon={ShieldCheck}
                      title="PII Redaction Engine"
                      sub={`${activeRulesCount} active rules · Scan and redact sensitive data at ingest`}
                      accent="6 78% 57%"
                    />

                    {/* Master toggle */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "16px 20px",
                      background: masterRedact
                        ? "linear-gradient(135deg, hsl(var(--success) / 0.06) 0%, hsl(162 60% 44% / 0.04) 100%)"
                        : "hsl(var(--muted) / 0.2)",
                      border: `1.5px solid ${masterRedact ? "hsl(var(--success) / 0.2)" : "hsl(var(--border)/0.15)"}`,
                      borderRadius: 14,
                      transition: "all 0.25s",
                      boxShadow: masterRedact ? "0 4px 20px hsl(var(--success) / 0.06)" : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 11, background: masterRedact ? "hsl(var(--success) / 0.12)" : "hsl(var(--muted)/0.5)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.25s", border: masterRedact ? "1px solid hsl(var(--success) / 0.2)" : "1px solid hsl(var(--border) / 0.2)" }}>
                          <Shield size={18} style={{ color: masterRedact ? "hsl(var(--success))" : "hsl(var(--muted-foreground))", transition: "color 0.25s" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, fontFamily: "var(--font-mono)" }}>Global Redaction Engine</div>
                          <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
                            {masterRedact
                              ? `${activeRulesCount} active rules · All incoming traces are screened`
                              : "Redaction disabled · Sensitive data may be persisted in traces"}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {!masterRedact && (
                          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", background: "hsl(var(--warning)/0.12)", color: "hsl(var(--warning))", borderRadius: 20, padding: "3px 10px", display: "flex", alignItems: "center", gap: 5, border: "1px solid hsl(var(--warning) / 0.2)" }}>
                            <AlertTriangle size={10} /> Disabled
                          </span>
                        )}
                        <Toggle checked={masterRedact} onChange={handleMasterToggle} label="Toggle global redaction" />
                      </div>
                    </div>

                    {/* Rules by category */}
                    {Object.entries(categorised).map(([cat, rules]) => {
                      const meta = CATEGORY_META[cat] ?? CATEGORY_META.custom;
                      const CatIcon = meta.icon;
                      return (
                        <RefCard key={cat}>
                          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, paddingBottom: 10, borderBottom: "1px solid hsl(var(--border) / 0.08)" }}>
                              <div style={{ width: 26, height: 26, borderRadius: 7, background: `hsl(${meta.accent} / 0.12)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <CatIcon size={12} style={{ color: meta.color }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-mono)", color: meta.color }}>
                                {meta.label}
                              </span>
                              <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "var(--font-mono)", background: "hsl(var(--muted) / 0.4)", color: "hsl(var(--muted-foreground))", padding: "2px 8px", borderRadius: 20 }}>
                                {rules.filter((r) => r.enabled).length}/{rules.length} active
                              </span>
                            </div>

                            {rules.map((rule) => {
                              const sev = SEVERITY_STYLE[rule.severity];
                              return (
                                <div
                                  key={rule.ruleId}
                                  className="rule-row"
                                  style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    padding: "10px 12px",
                                    background: rule.enabled ? "hsl(var(--card-elev))" : "hsl(var(--muted)/0.15)",
                                    borderRadius: 10,
                                    border: "1px solid hsl(var(--border)/0.12)",
                                    opacity: masterRedact ? 1 : 0.55,
                                    transition: "opacity 0.2s, background 0.15s, border-color 0.15s",
                                  }}
                                >
                                  <Toggle checked={rule.enabled && masterRedact} onChange={() => toggleRule(rule.ruleId)} size="sm" label={`Toggle ${rule.name}`} />

                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                                      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{rule.name}</span>
                                      <span style={{ fontSize: 9, fontWeight: 700, background: sev.bg, color: sev.text, borderRadius: 20, padding: "1px 7px", textTransform: "uppercase", letterSpacing: "0.05em", border: `1px solid ${sev.border}` }}>
                                        {rule.severity}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      <span style={{ opacity: 0.5, marginRight: 4 }}>regex</span>
                                      {rule.regexPattern}
                                    </div>
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", background: "hsl(6 78% 57% / 0.08)", color: "hsl(6 78% 57%)", borderRadius: 6, padding: "2px 8px", border: "1px solid hsl(6 78% 57% / 0.15)" }}>
                                      {rule.replacement}
                                    </span>
                                    {rule.category === "custom" && (
                                      <button
                                        type="button"
                                        onClick={() => deleteRule(rule.ruleId)}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", padding: 4, borderRadius: 6, display: "flex", transition: "color 0.15s, background 0.15s" }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = "hsl(0 72% 51%)"; e.currentTarget.style.background = "hsl(0 72% 51% / 0.08)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = "hsl(var(--muted-foreground))"; e.currentTarget.style.background = "none"; }}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </RefCard>
                      );
                    })}

                    {/* Add rule */}
                    {showNewRule ? (
                      <RefCard>
                        <div style={{ padding: "16px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 26, height: 26, borderRadius: 7, background: "hsl(6 78% 57% / 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Plus size={12} style={{ color: "hsl(6 78% 57%)" }} />
                              </div>
                              <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: "var(--font-mono)" }}>New Custom Rule</span>
                            </div>
                            <button type="button" onClick={() => setShowNewRule(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                              Cancel
                            </button>
                          </div>
                          <form onSubmit={handleCreatePiiRule} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                              <FormField label="Rule Name">
                                <Input required placeholder="API Access Tokens" value={newPiiRule.name} onChange={(e) => setNewPiiRule({ ...newPiiRule, name: e.target.value })} />
                              </FormField>
                              <FormField label="Replacement Token">
                                <Input required value={newPiiRule.replacement} onChange={(e) => setNewPiiRule({ ...newPiiRule, replacement: e.target.value })} />
                              </FormField>
                            </div>
                            <FormField label="Regex Pattern">
                              <Input required placeholder="e.g. sk_[a-zA-Z0-9]{32}" value={newPiiRule.regexPattern} onChange={(e) => setNewPiiRule({ ...newPiiRule, regexPattern: e.target.value })} />
                            </FormField>
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                              <RefButton variant="primary" type="submit" icon={Plus}>Add Rule</RefButton>
                            </div>
                          </form>
                        </div>
                      </RefCard>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowNewRule(true)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "12px 16px",
                          background: "transparent",
                          border: "1.5px dashed hsl(var(--border)/0.3)",
                          borderRadius: 12, cursor: "pointer",
                          fontFamily: "var(--font-mono)", fontSize: 12,
                          color: "hsl(var(--muted-foreground))",
                          transition: "border-color 0.15s, color 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(6 78% 57% / 0.4)"; e.currentTarget.style.color = "hsl(6 78% 57%)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border)/0.3)"; e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}
                      >
                        <Plus size={14} />
                        Add custom redaction rule
                      </button>
                    )}

                    {/* Save bar */}
                    {piiDirty && (
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px",
                        background: "hsl(var(--card))",
                        border: "1.5px solid hsl(6 78% 57% / 0.25)",
                        borderRadius: 12,
                        boxShadow: "0 4px 20px hsl(6 78% 57% / 0.08)",
                        animation: "fadeIn 0.2s ease-out",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <AlertCircle size={13} style={{ color: "hsl(6 78% 57%)" }} />
                          <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))" }}>
                            Unsaved changes — rules are not active yet.
                          </span>
                        </div>
                        <RefButton variant="primary" icon={piiSaved ? CheckCircle2 : Save} onClick={handleSavePii} disabled={piiSaving}>
                          {piiSaving ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : piiSaved ? "Saved!" : "Save Rules"}
                        </RefButton>
                      </div>
                    )}
                  </div>

                  {/* Right: stats + preview */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* Stats grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { label: "Active Rules",   value: String(activeRulesCount),                                     accent: "var(--success)",   icon: CheckCircle2 },
                        { label: "Total Patterns", value: String(piiRules.length),                                      accent: "250 80% 66%",      icon: Layers       },
                        { label: "High Severity",  value: String(piiRules.filter((r) => r.severity === "high").length),  accent: "0 72% 51%",       icon: AlertTriangle },
                        { label: "Categories",     value: String(Object.keys(categorised).length),                      accent: "38 90% 55%",       icon: Database     },
                      ].map(({ label, value, accent, icon: Icon }) => (
                        <div key={label} style={{ padding: "14px 14px", background: "hsl(var(--card))", borderRadius: 12, border: "1px solid hsl(var(--border)/0.12)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <Icon size={11} style={{ color: accent.startsWith("var") ? `hsl(${accent})` : `hsl(${accent})` }} />
                            <span style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>{label}</span>
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: accent.startsWith("var") ? `hsl(${accent})` : `hsl(${accent})` }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Live preview */}
                    <RefCard>
                      <div style={{ padding: "16px 18px" }}>
                        <PiiPreviewTester rules={piiRules} />
                      </div>
                    </RefCard>

                    {/* Compliance note */}
                    <div style={{ padding: "14px 16px", background: "hsl(6 78% 57% / 0.04)", border: "1px solid hsl(6 78% 57% / 0.15)", borderRadius: 12 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <ShieldCheck size={14} style={{ color: "hsl(6 78% 57%)", flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ fontSize: 11.5, fontWeight: 700, fontFamily: "var(--font-mono)", marginBottom: 4 }}>Compliance Note</div>
                          <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", lineHeight: 1.6 }}>
                            Redaction is applied at ingest time before data is stored. Patterns are evaluated in order — enable global redaction to activate all rules.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

          </TabContent>
        </div>
      </div>
    </>
  );
}
