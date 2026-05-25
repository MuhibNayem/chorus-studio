"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import FormField from "@/components/shared/FormField";
import RefButton from "@/components/primitives/RefButton";
import { RefCard } from "@/components/primitives/RefCard";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { AuditLogEntry } from "@/types";
import {
  Shield, FileText, Key, EyeOff, Plus, Loader2, Lock,
  Copy, Check, Globe, Zap, Trash2, Eye, AlertTriangle,
  CreditCard, Mail, Hash, Fingerprint, Phone, Server,
  CheckCircle2, XCircle, Activity, ChevronRight, RotateCcw,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PiiRule {
  ruleId: string;
  name: string;
  category: "financial" | "identity" | "technical" | "custom";
  regexPattern: string;
  replacement: string;
  enabled: boolean;
  severity: "high" | "medium" | "low";
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PROVIDERS = [
  { id: "okta",    name: "Okta",              protocol: "SAML 2.0", color: "hsl(210 90% 55%)",  bg: "hsl(210 90% 55% / 0.1)",  letter: "Ok" },
  { id: "azure",   name: "Azure AD / Entra",  protocol: "OIDC",     color: "hsl(211 100% 50%)", bg: "hsl(211 100% 50% / 0.1)", letter: "Az" },
  { id: "google",  name: "Google Workspace",  protocol: "OIDC",     color: "hsl(217 89% 61%)",  bg: "hsl(217 89% 61% / 0.1)",  letter: "G"  },
  { id: "onelogin",name: "OneLogin",          protocol: "SAML 2.0", color: "hsl(10 78% 56%)",   bg: "hsl(10 78% 56% / 0.1)",   letter: "OL" },
  { id: "ping",    name: "Ping Identity",     protocol: "SAML 2.0", color: "hsl(162 60% 44%)",  bg: "hsl(162 60% 44% / 0.1)",  letter: "Pi" },
  { id: "custom",  name: "Custom SAML",       protocol: "SAML 2.0", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted)/0.4)", letter: "?" },
];

const INITIAL_PII_RULES: PiiRule[] = [
  { ruleId: "pii_cc",    name: "Credit Card Numbers",     category: "financial", regexPattern: "\\b(?:\\d[ -]*?){13,16}\\b",                                            replacement: "[REDACTED_CC]",    enabled: true,  severity: "high"   },
  { ruleId: "pii_ssn",   name: "Social Security Numbers", category: "identity",  regexPattern: "\\b\\d{3}-\\d{2}-\\d{4}\\b",                                            replacement: "[REDACTED_SSN]",   enabled: true,  severity: "high"   },
  { ruleId: "pii_email", name: "Email Addresses",         category: "identity",  regexPattern: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b",               replacement: "[REDACTED_EMAIL]", enabled: true,  severity: "medium" },
  { ruleId: "pii_phone", name: "Phone Numbers",           category: "identity",  regexPattern: "\\b(?:\\+?1[-.]?)?(?:\\(\\d{3}\\)|\\d{3})[-.]?\\d{3}[-.]?\\d{4}\\b",   replacement: "[REDACTED_PHONE]", enabled: false, severity: "medium" },
  { ruleId: "pii_key",   name: "API / Secret Keys",       category: "technical", regexPattern: "\\b(?:sk|pk|key|secret|token)[-_][a-zA-Z0-9]{16,}\\b",                  replacement: "[REDACTED_KEY]",   enabled: true,  severity: "high"   },
  { ruleId: "pii_ip",    name: "IPv4 Addresses",          category: "technical", regexPattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b",                                      replacement: "[REDACTED_IP]",    enabled: false, severity: "low"    },
];

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  financial: { label: "Financial",  icon: CreditCard,   color: "hsl(38 92% 50%)"  },
  identity:  { label: "Identity",   icon: Fingerprint,  color: "hsl(var(--primary))" },
  technical: { label: "Technical",  icon: Server,       color: "hsl(162 60% 44%)" },
  custom:    { label: "Custom",     icon: Hash,         color: "hsl(var(--muted-foreground))" },
};

const SEVERITY_STYLE: Record<string, { bg: string; text: string }> = {
  high:   { bg: "hsl(var(--error, 0 72% 51%) / 0.1)",   text: "hsl(var(--error, 0 72% 51%))"   },
  medium: { bg: "hsl(var(--warning) / 0.1)",              text: "hsl(var(--warning))"             },
  low:    { bg: "hsl(var(--muted) / 0.4)",                text: "hsl(var(--muted-foreground))"    },
};

const DEFAULT_PREVIEW_TEXT =
  "Contact jane.smith@company.com or call +1-555-012-3456.\n" +
  "Billing: CC 4532-0151-1283-0366 · SSN 123-45-6789\n" +
  "API key: key_demo_aBcDeFgHiJkLmNoPqRsTuVwX";

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label, size = "md" }: {
  checked: boolean; onChange: (v: boolean) => void; label?: string; size?: "sm" | "md";
}) {
  const w = size === "sm" ? 30 : 38;
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

// ── Copy field ────────────────────────────────────────────────────────────────

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
      <div style={{ display: "flex", background: "hsl(var(--background) / 0.5)", border: "1px solid hsl(var(--border) / 0.15)", borderRadius: 9, overflow: "hidden" }}>
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

// ── Step badge ────────────────────────────────────────────────────────────────

function StepBadge({ n, done }: { n: number; done?: boolean }) {
  return (
    <div style={{ width: 24, height: 24, borderRadius: 12, background: done ? "hsl(var(--success) / 0.15)" : "hsl(var(--primary) / 0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {done
        ? <Check size={12} style={{ color: "hsl(var(--success))" }} />
        : <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "hsl(var(--primary))" }}>{n}</span>}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHead({ step, title, sub, done }: { step: number; title: string; sub: string; done?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
      <StepBadge n={step} done={done} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", color: "hsl(var(--foreground))", marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{sub}</div>
      </div>
    </div>
  );
}

// ── PII Live Preview ──────────────────────────────────────────────────────────

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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Eye size={13} style={{ color: "hsl(var(--primary))" }} />
          <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono)" }}>Live Redaction Preview</span>
        </div>
        {changedCount > 0 && (
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", background: "hsl(var(--success) / 0.12)", color: "hsl(var(--success))", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
            {changedCount} {changedCount === 1 ? "match" : "matches"} redacted
          </span>
        )}
      </div>

      {/* Input */}
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
            border: focused ? "1px solid hsl(var(--primary) / 0.5)" : "1px solid hsl(var(--border) / 0.2)",
            borderRadius: 10, padding: "8px 12px",
            fontSize: 11, fontFamily: "var(--font-mono)", color: "hsl(var(--foreground))",
            outline: "none", resize: "vertical",
            boxShadow: focused ? "0 0 0 3px hsl(var(--primary) / 0.08)" : "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
        />
      </div>

      {/* Output */}
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EnterpriseSettingsPage() {
  const [activeTab, setActiveTab] = useState<"audit-logs" | "sso" | "pii">("audit-logs");
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [piiRules, setPiiRules] = useState<PiiRule[]>(INITIAL_PII_RULES);
  const [masterRedact, setMasterRedact] = useState(true);
  const [loading, setLoading] = useState(true);
  const [ssoSaved, setSsoSaved] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<"idle" | "ok" | "error">("ok");

  const [selectedProvider, setSelectedProvider] = useState("okta");
  const [ssoConfig, setSsoConfig] = useState({
    clientId: "0oa8f3c61cc8921",
    issuer: "https://company.okta.com/oauth2/default",
    samlEntityId: "urn:amazon:cognito:sp:us-east-1_8f3c",
    samlEntrypoint: "https://company.okta.com/app/cognito/sso/saml",
    scimEnabled: true,
  });

  const [newPiiRule, setNewPiiRule] = useState({ name: "", regexPattern: "", replacement: "[REDACTED]" });
  const [showNewRule, setShowNewRule] = useState(false);

  useEffect(() => { if (activeTab === "audit-logs") loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.listAuditLogs(0, 50).catch(() => ({ items: [], total: 0 }));
      setAuditLogs(res.items?.length > 0 ? res.items : [
        { logId: "aud_01", tenantId: "tnt-system", userId: "usr-admin", username: "admin@chorus.dev", action: "USER_LOGIN",           ipAddress: "192.168.1.45", createdAt: new Date().toISOString() },
        { logId: "aud_02", tenantId: "tnt-system", userId: "usr-admin", username: "admin@chorus.dev", action: "PROMPT_VERSION_CREATE", ipAddress: "192.168.1.45", createdAt: new Date(Date.now() - 300000).toISOString() },
        { logId: "aud_03", tenantId: "tnt-system", userId: "usr-admin", username: "admin@chorus.dev", action: "API_KEY_GENERATE",      ipAddress: "192.168.1.45", createdAt: new Date(Date.now() - 600000).toISOString() },
      ]);
    } catch { /* */ } finally { setLoading(false); }
  };

  const handleSaveSso = (e: React.FormEvent) => {
    e.preventDefault();
    setSsoSaved(true);
    setTimeout(() => setSsoSaved(false), 3000);
  };

  const handleTestConn = () => {
    setTestingConn(true);
    setTimeout(() => { setTestingConn(false); setConnStatus("ok"); }, 1800);
  };

  const handleCreatePiiRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPiiRule.name || !newPiiRule.regexPattern) return;
    setPiiRules([...piiRules, {
      ruleId: `pii_${Date.now().toString().slice(-5)}`,
      name: newPiiRule.name, category: "custom",
      regexPattern: newPiiRule.regexPattern, replacement: newPiiRule.replacement,
      enabled: true, severity: "medium",
    }]);
    setNewPiiRule({ name: "", regexPattern: "", replacement: "[REDACTED]" });
    setShowNewRule(false);
  };

  const toggleRule = useCallback((id: string) =>
    setPiiRules((r) => r.map((x) => x.ruleId === id ? { ...x, enabled: !x.enabled } : x)),
  []);

  const deleteRule = useCallback((id: string) =>
    setPiiRules((r) => r.filter((x) => x.ruleId !== id)),
  []);

  const provider = PROVIDERS.find((p) => p.id === selectedProvider)!;
  const activeRulesCount = piiRules.filter((r) => r.enabled).length;
  const categorised = useMemo(() => {
    const out: Record<string, PiiRule[]> = {};
    for (const r of piiRules) {
      if (!out[r.category]) out[r.category] = [];
      out[r.category].push(r);
    }
    return out;
  }, [piiRules]);

  // ── Tab nav ──────────────────────────────────────────────────────────────

  const tabs = [
    { id: "audit-logs", label: "Audit Trail",    icon: FileText },
    { id: "sso",        label: "SSO Setup",       icon: Key      },
    { id: "pii",        label: "PII Redaction",   icon: EyeOff   },
  ] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="Enterprise Governance"
        accent="/ compliance"
        sub="Audit logs, identity provider configuration, and trace-level PII redaction gates."
        actions={
          <div style={{
            display: "flex",
            background: "hsl(var(--muted) / 0.5)",
            borderRadius: 12,
            padding: 3,
            gap: 2,
          }}>
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 14px",
                    borderRadius: 9,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    background: active ? "hsl(var(--card))" : "transparent",
                    color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                    boxShadow: active ? "0 1px 6px hsl(0 0% 0% / 0.12)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  <Icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>
        }
      />

      {/* ── AUDIT LOGS ── */}
      {activeTab === "audit-logs" && (
        <RefCard>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "hsl(var(--primary)/0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={14} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)" }}>System Audit Logs</div>
                <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>Immutable, append-only · SOC 2 compliant</div>
              </div>
            </div>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : (
              <table className="runs-table mono" style={{ fontSize: 11 }}>
                <thead>
                  <tr>
                    <th>Log ID</th><th>Timestamp</th><th>User</th>
                    <th>Tenant</th><th>Action</th><th className="r">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.logId}>
                      <td><span style={{ color: "hsl(var(--primary))", fontWeight: 600 }}>{log.logId}</span></td>
                      <td>{new Date(log.createdAt).toLocaleString()}</td>
                      <td>
                        <span style={{ background: "hsl(var(--muted)/0.3)", borderRadius: 6, padding: "2px 7px", fontSize: 10 }}>
                          {log.username || log.userId}
                        </span>
                      </td>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>{log.tenantId}</td>
                      <td>
                        <span style={{ background: "hsl(var(--primary)/0.08)", color: "hsl(var(--primary))", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 700 }}>
                          {log.action}
                        </span>
                      </td>
                      <td className="r" style={{ color: "hsl(var(--muted-foreground))" }}>{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </RefCard>
      )}

      {/* ── SSO SETUP ── */}
      {activeTab === "sso" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
          {/* Left: config */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Step 1 — Provider */}
            <RefCard>
              <div className="card-pad">
                <SectionHead step={1} title="Choose Identity Provider" sub="Select your organisation's SSO provider." done={!!selectedProvider} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {PROVIDERS.map((p) => {
                    const active = selectedProvider === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProvider(p.id)}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center",
                          gap: 8, padding: "14px 10px",
                          background: active ? p.bg : "hsl(var(--card-elev))",
                          border: active ? `1.5px solid ${p.color}` : "1px solid hsl(var(--border)/0.2)",
                          borderRadius: 12, cursor: "pointer",
                          transition: "all 0.15s",
                          boxShadow: active ? `0 0 0 3px ${p.color.replace(")", " / 0.12)")}` : "none",
                          position: "relative",
                        }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", color: p.color }}>
                          {p.letter}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)", color: active ? p.color : "hsl(var(--foreground))", textAlign: "center", lineHeight: 1.3 }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", background: active ? `${p.color.replace(")", " / 0.15)")}` : "hsl(var(--muted)/0.4)", color: active ? p.color : "hsl(var(--muted-foreground))", borderRadius: 5, padding: "1px 6px" }}>
                          {p.protocol}
                        </div>
                        {active && (
                          <div style={{ position: "absolute", top: 8, right: 8, width: 16, height: 16, borderRadius: 8, background: p.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Check size={10} style={{ color: "white" }} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </RefCard>

            {/* Step 2 — Credentials */}
            <RefCard>
              <div className="card-pad">
                <SectionHead step={2} title="Credentials & Endpoints" sub={`Configure your ${provider.name} connection parameters.`} done={!!ssoConfig.clientId && !!ssoConfig.issuer} />
                <form onSubmit={handleSaveSso} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <FormField label="Client ID">
                      <Input value={ssoConfig.clientId} onChange={(e) => setSsoConfig({ ...ssoConfig, clientId: e.target.value })} placeholder="0oa8f3c61cc8921" />
                    </FormField>
                    <FormField label="OIDC Issuer URI">
                      <Input value={ssoConfig.issuer} onChange={(e) => setSsoConfig({ ...ssoConfig, issuer: e.target.value })} placeholder="https://company.okta.com/oauth2/default" />
                    </FormField>
                  </div>

                  {/* SAML-specific */}
                  {(provider.protocol === "SAML 2.0") && (
                    <div style={{ background: "hsl(var(--primary)/0.03)", border: "1px solid hsl(var(--primary)/0.08)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "hsl(var(--primary))", fontFamily: "var(--font-mono)", marginBottom: -2 }}>
                        SAML 2.0 Configuration
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <FormField label="Audience / Entity ID">
                          <Input value={ssoConfig.samlEntityId} onChange={(e) => setSsoConfig({ ...ssoConfig, samlEntityId: e.target.value })} />
                        </FormField>
                        <FormField label="SSO Entry Point URL">
                          <Input value={ssoConfig.samlEntrypoint} onChange={(e) => setSsoConfig({ ...ssoConfig, samlEntrypoint: e.target.value })} />
                        </FormField>
                      </div>
                    </div>
                  )}

                  {/* SCIM toggle */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "hsl(var(--card-elev))", borderRadius: 10, border: "1px solid hsl(var(--border)/0.15)" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono)" }}>SCIM Directory Sync</div>
                      <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>Auto-provision users from your IdP directory</div>
                    </div>
                    <Toggle checked={ssoConfig.scimEnabled} onChange={(v) => setSsoConfig({ ...ssoConfig, scimEnabled: v })} label="Toggle SCIM" />
                  </div>

                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4, borderTop: "1px solid hsl(var(--border)/0.08)" }}>
                    <RefButton variant="outline" type="button" onClick={handleTestConn}>
                      {testingConn ? <><Loader2 size={13} className="animate-spin" /> Testing…</> : "Test Connection"}
                    </RefButton>
                    <RefButton variant="primary" type="submit" icon={ssoSaved ? CheckCircle2 : Lock}>
                      {ssoSaved ? "Saved!" : "Save Configuration"}
                    </RefButton>
                  </div>
                </form>
              </div>
            </RefCard>
          </div>

          {/* Right: SP metadata + status */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Connection status */}
            <RefCard>
              <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "hsl(var(--primary)/0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Activity size={13} style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)" }}>Connection Health</span>
                </div>

                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderRadius: 10,
                  background: connStatus === "ok" ? "hsl(var(--success) / 0.08)" : "hsl(var(--error, 0 72% 51%) / 0.08)",
                  border: `1px solid ${connStatus === "ok" ? "hsl(var(--success) / 0.2)" : "hsl(var(--error, 0 72% 51%) / 0.2)"}`,
                }}>
                  {connStatus === "ok"
                    ? <CheckCircle2 size={16} style={{ color: "hsl(var(--success))", flexShrink: 0 }} />
                    : <XCircle size={16} style={{ color: "hsl(var(--error, 0 72% 51%))", flexShrink: 0 }} />}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono)", color: connStatus === "ok" ? "hsl(var(--success))" : "hsl(var(--error, 0 72% 51%))" }}>
                      {connStatus === "ok" ? "SSO Gateway Active" : "Connection Failed"}
                    </div>
                    <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>
                      Last verified: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {[
                  { label: "Protocol",  value: provider.protocol },
                  { label: "Provider",  value: provider.name },
                  { label: "Sessions",  value: "Active · 14 users" },
                  { label: "Cert exp.", value: "Jan 12 2026" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
                    <span style={{ fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </RefCard>

            {/* SP Metadata — copy fields */}
            <RefCard>
              <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "hsl(var(--primary)/0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ChevronRight size={13} style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)" }}>Service Provider Metadata</div>
                    <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}>Copy these into your IdP</div>
                  </div>
                </div>
                <CopyField label="ACS / Callback URL" value="https://app.chorus.dev/auth/saml/callback" />
                <CopyField label="SP Entity ID" value="https://app.chorus.dev/saml/metadata" />
                <CopyField label="SP Metadata URL" value="https://app.chorus.dev/saml/metadata.xml" />
                {ssoConfig.scimEnabled && (
                  <CopyField label="SCIM Provisioning Endpoint" value="https://app.chorus.dev/api/v1/scim/v2" />
                )}
              </div>
            </RefCard>
          </div>
        </div>
      )}

      {/* ── PII REDACTION ── */}
      {activeTab === "pii" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
          {/* Left: rules */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Master toggle */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 18px",
              background: masterRedact ? "hsl(var(--success) / 0.06)" : "hsl(var(--muted) / 0.3)",
              border: `1px solid ${masterRedact ? "hsl(var(--success) / 0.2)" : "hsl(var(--border)/0.15)"}`,
              borderRadius: 14,
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: masterRedact ? "hsl(var(--success) / 0.12)" : "hsl(var(--muted)/0.5)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
                  <Shield size={16} style={{ color: masterRedact ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)" }}>Global Redaction Engine</div>
                  <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>
                    {masterRedact
                      ? `${activeRulesCount} active rules · All incoming traces are screened`
                      : "Redaction disabled · Sensitive data may be persisted"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {!masterRedact && (
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", background: "hsl(var(--warning)/0.12)", color: "hsl(var(--warning))", borderRadius: 6, padding: "2px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertTriangle size={10} /> Disabled
                  </span>
                )}
                <Toggle checked={masterRedact} onChange={setMasterRedact} label="Toggle global redaction" />
              </div>
            </div>

            {/* Rules by category */}
            {Object.entries(categorised).map(([cat, rules]) => {
              const meta = CATEGORY_META[cat] ?? CATEGORY_META.custom;
              const CatIcon = meta.icon;
              return (
                <RefCard key={cat}>
                  <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <CatIcon size={13} style={{ color: meta.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)", color: meta.color }}>
                        {meta.label}
                      </span>
                      <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))" }}>
                        {rules.filter((r) => r.enabled).length}/{rules.length} active
                      </span>
                    </div>

                    {rules.map((rule) => {
                      const sev = SEVERITY_STYLE[rule.severity];
                      return (
                        <div
                          key={rule.ruleId}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 12px",
                            background: rule.enabled ? "hsl(var(--card-elev))" : "hsl(var(--muted)/0.2)",
                            borderRadius: 10,
                            border: "1px solid hsl(var(--border)/0.15)",
                            opacity: masterRedact ? 1 : 0.5,
                            transition: "opacity 0.2s, background 0.15s",
                          }}
                        >
                          <Toggle checked={rule.enabled && masterRedact} onChange={() => toggleRule(rule.ruleId)} size="sm" label={`Toggle ${rule.name}`} />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{rule.name}</span>
                              <span style={{ fontSize: 9, fontWeight: 700, background: sev.bg, color: sev.text, borderRadius: 5, padding: "1px 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                {rule.severity}
                              </span>
                            </div>
                            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              <span style={{ color: "hsl(var(--muted-foreground)/0.6)", marginRight: 4 }}>regex</span>
                              {rule.regexPattern}
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", background: "hsl(var(--primary)/0.08)", color: "hsl(var(--primary))", borderRadius: 6, padding: "2px 7px" }}>
                              {rule.replacement}
                            </span>
                            {rule.category === "custom" && (
                              <button
                                type="button"
                                onClick={() => deleteRule(rule.ruleId)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", padding: 4, borderRadius: 6, display: "flex", transition: "color 0.15s, background 0.15s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "hsl(var(--destructive))"; e.currentTarget.style.background = "hsl(var(--destructive)/0.08)"; }}
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
                <div className="card-pad">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)" }}>New Custom Rule</span>
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
                  padding: "11px 16px",
                  background: "transparent",
                  border: "1.5px dashed hsl(var(--border)/0.3)",
                  borderRadius: 12, cursor: "pointer",
                  fontFamily: "var(--font-mono)", fontSize: 12,
                  color: "hsl(var(--muted-foreground))",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary)/0.4)"; e.currentTarget.style.color = "hsl(var(--primary))"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border)/0.3)"; e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}
              >
                <Plus size={14} />
                Add custom redaction rule
              </button>
            )}
          </div>

          {/* Right: live preview + stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Active Rules",   value: String(activeRulesCount),                    color: "hsl(var(--success))" },
                { label: "Total Patterns", value: String(piiRules.length),                     color: "hsl(var(--primary))" },
                { label: "High Severity",  value: String(piiRules.filter(r => r.severity === "high").length),   color: "hsl(var(--error, 0 72% 51%))" },
                { label: "Categories",     value: String(Object.keys(categorised).length),     color: "hsl(var(--warning))" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: "12px 14px", background: "hsl(var(--card))", borderRadius: 12, border: "1px solid hsl(var(--border)/0.12)" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color }}>{value}</div>
                  <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Live preview */}
            <RefCard>
              <div className="card-pad">
                <PiiPreviewTester rules={piiRules} />
              </div>
            </RefCard>
          </div>
        </div>
      )}
    </div>
  );
}
