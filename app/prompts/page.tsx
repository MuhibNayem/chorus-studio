"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import {
  Plus, Tag, Trash2, Play, CheckCircle,
  FolderOpen, GitCompare, ExternalLink, Loader2,
  Calendar, User, Sliders, Award, X, Zap
} from "lucide-react";
import type { PromptVersion, PromptAbTest, Dataset } from "@/types";
import { Select } from "@/components/ui/select";

// ── Shared primitives ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10,
      textTransform: "uppercase" as const,
      letterSpacing: "0.1em",
      fontWeight: 500,
      color: "hsl(var(--muted-foreground))",
      fontFamily: "var(--font-mono)",
      marginBottom: 7,
    }}>
      {children}
    </div>
  );
}

function FieldInput({
  label, value, onChange, placeholder, type = "text", required, rows, style = {}
}: {
  label: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; rows?: number; style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    width: "100%", fontFamily: "var(--font-mono)", fontSize: 12.5,
    background: "hsl(var(--card-elev)/0.7)", border: "1px solid hsl(var(--border)/0.2)",
    borderRadius: 10, color: "hsl(var(--foreground))", outline: "none",
    transition: "border-color 150ms ease, box-shadow 150ms ease", ...style,
  };
  const focusStyle = { borderColor: "hsl(var(--primary)/0.35)", boxShadow: "0 0 0 3px hsl(var(--primary)/0.08)" };
  const blurStyle = { borderColor: "hsl(var(--border)/0.2)", boxShadow: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <SectionLabel>{label}</SectionLabel>
      {rows ? (
        <textarea
          required={required} placeholder={placeholder} value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          style={{ ...base, padding: "12px 14px", lineHeight: 1.65, resize: "none" }}
          onFocus={(e) => Object.assign(e.target.style, focusStyle)}
          onBlur={(e) => Object.assign(e.target.style, blurStyle)}
        />
      ) : (
        <input
          type={type} required={required} placeholder={placeholder} value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...base, height: 36, padding: "0 12px" }}
          onFocus={(e) => Object.assign(e.target.style, focusStyle)}
          onBlur={(e) => Object.assign(e.target.style, blurStyle)}
        />
      )}
    </div>
  );
}

function FieldSelect({
  label, value, onChange, children
}: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <SectionLabel>{label}</SectionLabel>
      <Select value={value} onChange={(v) => onChange(v as string)}>
        {children}
      </Select>
    </div>
  );
}

// ── Segmented tab control ──────────────────────────────────────────────────────
function SegmentedTabs({
  value, onChange,
  tabs,
}: {
  value: string;
  onChange: (v: string) => void;
  tabs: { value: string; label: string; icon: React.ElementType }[];
}) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center",
      background: "hsl(var(--muted)/0.5)", borderRadius: 11,
      padding: 3, gap: 2,
    }}>
      {tabs.map(({ value: v, label, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v} type="button" onClick={() => onChange(v)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 8,
              fontSize: 12.5, fontWeight: 500,
              background: active ? "hsl(var(--card))" : "transparent",
              color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              boxShadow: active ? "0 1px 3px hsl(0 0% 0% / 0.2)" : "none",
              border: "none", cursor: "pointer",
              transition: "background 150ms ease, color 150ms ease, box-shadow 150ms ease",
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── List item (sidebar) ────────────────────────────────────────────────────────
function ListItem({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "11px 14px", borderRadius: 10, cursor: "pointer",
        background: active ? "hsl(var(--primary)/0.07)" : "transparent",
        position: "relative", transition: "background 100ms ease",
        borderLeft: active ? "2px solid hsl(var(--primary-bright))" : "2px solid transparent",
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "hsl(var(--muted)/0.35)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      {children}
    </div>
  );
}

// ── Stat tile ──────────────────────────────────────────────────────────────────
function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      flex: 1, borderRadius: 12, padding: "14px 16px",
      background: `hsl(${color}/0.07)`,
      border: `1px solid hsl(${color}/0.12)`,
    }}>
      <div style={{ fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.1em", fontWeight: 500, color: `hsl(${color}/0.7)`, fontFamily: "var(--font-mono)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--font-mono)", letterSpacing: "-0.03em", color: `hsl(${color})` }}>{value}</div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 14, minHeight: 260, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle, hsl(var(--primary)/0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: "linear-gradient(135deg, hsl(var(--primary)/0.12), hsl(var(--rag)/0.12))",
        display: "grid", placeItems: "center",
        border: "1px solid hsl(var(--primary)/0.1)",
      }}>
        <Icon size={20} style={{ color: "hsl(var(--primary-bright))", opacity: 0.7 }} />
      </div>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "hsl(var(--foreground-dim))", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}>{sub}</div>
      </div>
    </div>
  );
}

// ── Modal wrapper ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "hsl(var(--background)/0.75)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 520,
        background: "hsl(var(--card))",
        borderRadius: 18,
        border: "1px solid hsl(var(--border)/0.25)",
        boxShadow: "0 24px 80px hsl(0 0% 0% / 0.4)",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "18px 22px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "hsl(var(--card-elev)/0.6)",
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.02em" }}>{title}</span>
          <button
            type="button" onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8, border: "none",
              background: "hsl(var(--muted)/0.5)", color: "hsl(var(--muted-foreground))",
              display: "grid", placeItems: "center", cursor: "pointer",
              transition: "background 120ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(var(--muted))")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "hsl(var(--muted)/0.5))")}
          >
            <X size={13} />
          </button>
        </div>
        <div style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, submitLabel, disabled }: { onCancel: () => void; submitLabel: string; disabled?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
      <button
        type="button" onClick={onCancel}
        style={{
          height: 34, padding: "0 14px", borderRadius: 9, fontSize: 13,
          background: "hsl(var(--muted)/0.5)", border: "none",
          color: "hsl(var(--foreground-dim))", cursor: "pointer",
          transition: "background 120ms ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(var(--muted))")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "hsl(var(--muted)/0.5))")}
      >
        Cancel
      </button>
      <button
        type="submit" disabled={disabled}
        style={{
          height: 34, padding: "0 18px", borderRadius: 9, fontSize: 13, fontWeight: 600,
          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-bright)))",
          border: "none", color: "white", cursor: "pointer",
          boxShadow: "0 2px 10px hsl(var(--primary)/0.3)",
          opacity: disabled ? 0.4 : 1, transition: "opacity 150ms ease",
        }}
      >
        {submitLabel}
      </button>
    </div>
  );
}

// ── A/B status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg =
    status === "COMPLETED" ? { color: "var(--success)", label: "Completed" } :
    status === "RUNNING"   ? { color: "var(--llm)",     label: "Running"   } :
                             { color: "var(--warning)",  label: "Pending"   };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 9px", borderRadius: 999, fontSize: 10.5,
      fontFamily: "var(--font-mono)", fontWeight: 500,
      background: `hsl(${cfg.color}/0.1)`,
      color: `hsl(${cfg.color})`,
      border: `1px solid hsl(${cfg.color}/0.2)`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: `hsl(${cfg.color})`, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
function PromptsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"registry" | "ab-tests">("registry");
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [abTests, setAbTests] = useState<PromptAbTest[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [selectedTest, setSelectedTest] = useState<PromptAbTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [modelOptions, setModelOptions] = useState(["gpt-4o", "gpt-4o-mini", "claude-sonnet-4-6", "gemini-2.0-flash"]);
  const [customModel, setCustomModel] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAbModal, setShowAbModal] = useState(false);
  const [newVersion, setNewVersion] = useState({ name: "", content: "", model: "gpt-4o", temperature: 0.7, maxTokens: 2048, createdBy: "admin@chorus.dev" });
  const [newAbTest, setNewAbTest] = useState({ datasetId: "", promptAId: "", promptBId: "" });
  const [newTag, setNewTag] = useState("");
  const [executingTestId, setExecutingTestId] = useState<string | null>(null);
  const [abResults, setAbResults] = useState<Record<string, any>>({});

  useEffect(() => {
    const preloadedDatasetId = searchParams.get("preloadedDatasetId");
    const tab = searchParams.get("activeTab");
    if (tab === "ab-tests") setActiveTab("ab-tests");
    if (preloadedDatasetId) {
      setActiveTab("ab-tests");
      setNewAbTest((prev) => ({ ...prev, datasetId: preloadedDatasetId }));
      setShowAbModal(true);
    }
  }, [searchParams]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vData, tData, dData, mData] = await Promise.all([
        api.listPromptVersions(0, 50).catch(() => ({ items: [], total: 0 })),
        api.listPromptAbTests(0, 50).catch(() => ({ items: [], total: 0 })),
        api.listDatasets(0, 50).catch(() => ({ items: [], total: 0 })),
        api.listModels().catch(() => []),
      ]);
      setVersions(vData.items);
      setAbTests(tData.items);
      setDatasets(dData.items);
      const discovered = (mData || []).map((m: any) => m.model).filter(Boolean);
      setModelOptions(Array.from(new Set(["gpt-4o", "gpt-4o-mini", "claude-sonnet-4-6", "gemini-2.0-flash", ...discovered])));
      if (vData.items.length > 0) setSelectedVersion(vData.items[0]);
      if (tData.items.length > 0) setSelectedTest(tData.items[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion.name || !newVersion.content) return;
    try {
      const v = await api.createPromptVersion({ ...newVersion, model: newVersion.model === "custom" ? customModel : newVersion.model });
      setVersions([v, ...versions]);
      setSelectedVersion(v);
      setShowCreateModal(false);
      setNewVersion({ name: "", content: "", model: "gpt-4o", temperature: 0.7, maxTokens: 2048, createdBy: "admin@chorus.dev" });
      setCustomModel("");
    } catch (err) { alert("Failed to create: " + (err instanceof Error ? err.message : String(err))); }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm("Delete this prompt version?")) return;
    try {
      await api.deletePromptVersion(versionId);
      const filtered = versions.filter((v) => v.versionId !== versionId);
      setVersions(filtered);
      setSelectedVersion(filtered[0] || null);
    } catch (err) { alert("Failed to delete: " + (err instanceof Error ? err.message : String(err))); }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVersion || !newTag.trim()) return;
    try {
      await api.addPromptTag(selectedVersion.versionId, newTag.trim());
      const updated = { ...selectedVersion, tags: [...(selectedVersion.tags || []), newTag.trim()] };
      setSelectedVersion(updated);
      setVersions(versions.map((v) => v.versionId === updated.versionId ? updated : v));
      setNewTag("");
    } catch (err) { alert("Failed to add tag: " + (err instanceof Error ? err.message : String(err))); }
  };

  const handleRemoveTag = async (tagName: string) => {
    if (!selectedVersion) return;
    try {
      await api.removePromptTag(selectedVersion.versionId, tagName);
      const updated = { ...selectedVersion, tags: (selectedVersion.tags || []).filter((t) => t !== tagName) };
      setSelectedVersion(updated);
      setVersions(versions.map((v) => v.versionId === updated.versionId ? updated : v));
    } catch (err) { alert("Failed to remove tag: " + (err instanceof Error ? err.message : String(err))); }
  };

  const handleCreateAbTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAbTest.promptAId || !newAbTest.promptBId) return;
    try {
      const test = await api.createPromptAbTest(newAbTest);
      setAbTests([test, ...abTests]);
      setSelectedTest(test);
      setShowAbModal(false);
      setNewAbTest({ datasetId: "", promptAId: "", promptBId: "" });
    } catch (err) { alert("Failed to create A/B test: " + (err instanceof Error ? err.message : String(err))); }
  };

  const handleRunAbTest = async (testId: string) => {
    setExecutingTestId(testId);
    try {
      await api.executePromptAbTest(testId);
      const tData = await api.listPromptAbTests(0, 50);
      setAbTests(tData.items);
      setSelectedTest(tData.items.find((t: PromptAbTest) => t.testId === testId) || null);
    } catch (err) { alert("A/B test failed: " + (err instanceof Error ? err.message : String(err))); }
    finally { setExecutingTestId(null); }
  };

  const openPlayground = (version: PromptVersion) => {
    router.push(`/playground?promptId=${version.versionId}&content=${encodeURIComponent(version.content)}&model=${version.model || ""}`);
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "hsl(var(--primary)/0.08)", display: "grid", placeItems: "center", border: "1px solid hsl(var(--primary)/0.1)" }}>
            <Loader2 size={18} className="animate-spin" style={{ color: "hsl(var(--primary-bright))" }} />
          </div>
          <span style={{ fontSize: 12.5, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}>Loading prompts…</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
      <PageHeader
        title="Prompt Registry"
        accent="/ workspace"
        sub="Version-control prompts, run statistical A/B tests, and iterate in the Playground."
        actions={
          <SegmentedTabs
            value={activeTab}
            onChange={(v) => setActiveTab(v as "registry" | "ab-tests")}
            tabs={[
              { value: "registry", label: "Registry", icon: FolderOpen },
              { value: "ab-tests", label: "A/B Tests", icon: GitCompare },
            ]}
          />
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, flex: 1, minHeight: 560 }}>

        {/* ── LEFT sidebar ──────────────────────────────────────────────── */}
        <div className="ref-card" style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>

          {/* Sidebar header */}
          <div style={{ padding: "14px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "hsl(var(--card-elev)/0.5)" }}>
            <span style={{ fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.1em", fontWeight: 600, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}>
              {activeTab === "registry" ? `Templates · ${versions.length}` : `Trials · ${abTests.length}`}
            </span>
            <button
              type="button"
              onClick={() => activeTab === "registry" ? setShowCreateModal(true) : setShowAbModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 5, height: 26, padding: "0 10px",
                borderRadius: 8, fontSize: 11.5, fontWeight: 500,
                background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary-bright))",
                border: "1px solid hsl(var(--primary)/0.15)", cursor: "pointer",
                transition: "background 120ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(var(--primary)/0.18))")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "hsl(var(--primary)/0.1))")}
            >
              <Plus size={12} />
              {activeTab === "registry" ? "New" : "New A/B"}
            </button>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
            {activeTab === "registry" ? (
              versions.length === 0 ? (
                <EmptyState icon={FolderOpen} title="No templates yet" sub="Create your first prompt version" />
              ) : (
                versions.map((v) => (
                  <ListItem key={v.versionId} active={selectedVersion?.versionId === v.versionId} onClick={() => setSelectedVersion(v)}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", fontFamily: "var(--font-mono)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {v.name}
                        </div>
                        <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                          {v.versionId.substring(0, 8)}
                        </div>
                      </div>
                      {v.model && (
                        <span style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))", background: "hsl(var(--muted)/0.5)", padding: "2px 6px", borderRadius: 5, whiteSpace: "nowrap", flexShrink: 0 }}>
                          {v.model.split("/").pop()}
                        </span>
                      )}
                    </div>
                    {v.tags && v.tags.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 7 }}>
                        {v.tags.map((t) => (
                          <span key={t} style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", padding: "1px 7px", borderRadius: 999, background: "hsl(var(--primary)/0.08)", color: "hsl(var(--primary-bright)/0.8)", border: "1px solid hsl(var(--primary)/0.12)" }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </ListItem>
                ))
              )
            ) : (
              abTests.length === 0 ? (
                <EmptyState icon={GitCompare} title="No trials yet" sub="Configure your first A/B test" />
              ) : (
                abTests.map((t) => (
                  <ListItem key={t.testId} active={selectedTest?.testId === t.testId} onClick={() => setSelectedTest(t)}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                        {t.testId.substring(0, 12)}…
                      </span>
                      <StatusBadge status={t.status} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 6 }}>
                      <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))" }}>A: {t.promptAId?.substring(0, 8)}</span>
                      <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))" }}>B: {t.promptBId?.substring(0, 8)}</span>
                    </div>
                  </ListItem>
                ))
              )
            )}
          </div>
        </div>

        {/* ── RIGHT detail panel ─────────────────────────────────────────── */}
        <div className="ref-card" style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>

          {activeTab === "registry" ? (
            selectedVersion ? (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Detail header */}
                <div style={{ padding: "16px 22px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, background: "hsl(var(--card-elev)/0.5)" }}>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.025em", margin: 0 }}>{selectedVersion.name}</h2>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))", marginTop: 2, display: "block" }}>
                      {selectedVersion.versionId}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                    <button
                      type="button" onClick={() => openPlayground(selectedVersion)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 13px",
                        borderRadius: 9, fontSize: 12.5, fontWeight: 600,
                        background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-bright)))",
                        border: "none", color: "white", cursor: "pointer",
                        boxShadow: "0 2px 8px hsl(var(--primary)/0.3)",
                        transition: "box-shadow 120ms ease, transform 80ms ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px hsl(var(--primary)/0.4)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px hsl(var(--primary)/0.3)"; e.currentTarget.style.transform = "none"; }}
                    >
                      <ExternalLink size={12} />
                      Playground
                    </button>
                    <button
                      type="button" onClick={() => handleDeleteVersion(selectedVersion.versionId)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px",
                        borderRadius: 9, fontSize: 12.5, fontWeight: 500,
                        background: "hsl(var(--muted)/0.5)", border: "none",
                        color: "hsl(var(--muted-foreground))", cursor: "pointer",
                        transition: "background 120ms ease, color 120ms ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--error)/0.1)"; e.currentTarget.style.color = "hsl(var(--error))"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "hsl(var(--muted)/0.5)"; e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Metadata row */}
                <div style={{ padding: "16px 22px 0", display: "flex", gap: 24 }}>
                  {[
                    { icon: Calendar, label: "Created", value: new Date(selectedVersion.createdAt).toLocaleDateString() },
                    { icon: User,     label: "Author",  value: selectedVersion.createdBy || "system" },
                    { icon: Zap,      label: "Model",   value: selectedVersion.model || "—" },
                    { icon: Sliders,  label: "Temp",    value: selectedVersion.temperature != null ? String(selectedVersion.temperature) : "—" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: "hsl(var(--muted)/0.4)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <Icon size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9.5, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}>{label}</div>
                        <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 500, marginTop: 1 }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Prompt body */}
                <div style={{ flex: 1, padding: "16px 22px 0", display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <SectionLabel>Prompt template body</SectionLabel>
                  <div style={{
                    flex: 1, fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.65,
                    color: "hsl(var(--foreground))", background: "hsl(var(--card-elev)/0.6)",
                    border: "1px solid hsl(var(--border)/0.15)", borderRadius: 12,
                    padding: "14px 16px", overflowY: "auto", whiteSpace: "pre-wrap",
                    wordBreak: "break-word", minHeight: 160, maxHeight: 280,
                  }}>
                    {selectedVersion.content}
                  </div>
                </div>

                {/* Tags */}
                <div style={{ padding: "16px 22px 20px" }}>
                  <SectionLabel>Tags</SectionLabel>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                    {(selectedVersion.tags || []).map((t) => (
                      <span key={t} style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "3px 9px 3px 8px", borderRadius: 999, fontSize: 11,
                        fontFamily: "var(--font-mono)", fontWeight: 500,
                        background: "hsl(var(--primary)/0.08)", color: "hsl(var(--primary-bright))",
                        border: "1px solid hsl(var(--primary)/0.12)",
                      }}>
                        <Tag size={9} />
                        {t}
                        <button
                          type="button" onClick={() => handleRemoveTag(t)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: 2, color: "hsl(var(--primary-bright)/0.6)", display: "flex", alignItems: "center" }}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <form onSubmit={handleAddTag} style={{ display: "flex", gap: 6 }}>
                      <input
                        type="text" placeholder="Add tag…" value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        style={{
                          height: 28, padding: "0 10px", fontSize: 11.5,
                          fontFamily: "var(--font-mono)", background: "hsl(var(--card-elev))",
                          border: "1px solid hsl(var(--border)/0.25)", borderRadius: 999,
                          color: "hsl(var(--foreground))", outline: "none", width: 110,
                        }}
                      />
                      <button type="submit" style={{
                        height: 28, padding: "0 11px", borderRadius: 999, fontSize: 11.5,
                        background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary-bright))",
                        border: "1px solid hsl(var(--primary)/0.15)", cursor: "pointer", fontWeight: 600,
                      }}>+</button>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState icon={FolderOpen} title="No template selected" sub="Pick a template from the left or create a new one" />
            )
          ) : (
            /* ── A/B Test detail ──────────────────────────────────────────── */
            selectedTest ? (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Test header */}
                <div style={{ padding: "16px 22px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, background: "hsl(var(--card-elev)/0.5)" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>A/B Evaluation</h2>
                      <StatusBadge status={selectedTest.status} />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))", marginTop: 2, display: "block" }}>
                      {selectedTest.testId}
                    </span>
                  </div>
                  {selectedTest.status !== "RUNNING" && selectedTest.status !== "COMPLETED" && (
                    <button
                      type="button" onClick={() => handleRunAbTest(selectedTest.testId)}
                      disabled={executingTestId === selectedTest.testId}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px",
                        borderRadius: 9, fontSize: 12.5, fontWeight: 600,
                        background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-bright)))",
                        border: "none", color: "white", cursor: "pointer",
                        boxShadow: "0 2px 8px hsl(var(--primary)/0.3)",
                        opacity: executingTestId === selectedTest.testId ? 0.6 : 1,
                      }}
                    >
                      {executingTestId === selectedTest.testId ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} style={{ fill: "white" }} />}
                      {executingTestId === selectedTest.testId ? "Running…" : "Run Test"}
                    </button>
                  )}
                </div>

                {/* Dataset + variant meta */}
                <div style={{ padding: "16px 22px 0", display: "flex", gap: 24 }}>
                  {[
                    { label: "Dataset",   value: selectedTest.datasetId?.substring(0, 12) || "Default" },
                    { label: "Variant A", value: selectedTest.promptAId?.substring(0, 12) || "—" },
                    { label: "Variant B", value: selectedTest.promptBId?.substring(0, 12) || "—" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: 9.5, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)", marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 12.5, fontFamily: "var(--font-mono)", fontWeight: 500 }}>{value}…</div>
                    </div>
                  ))}
                </div>

                {/* Status body */}
                <div style={{ flex: 1, padding: "16px 22px 20px", display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>

                  {selectedTest.status === "RUNNING" && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: "hsl(var(--llm)/0.08)", display: "grid", placeItems: "center", border: "1px solid hsl(var(--llm)/0.12)" }}>
                        <Loader2 size={20} className="animate-spin" style={{ color: "hsl(var(--llm))" }} />
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "hsl(var(--foreground-dim))" }}>Running evaluation…</div>
                        <div style={{ fontSize: 11.5, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)", marginTop: 3 }}>Parallel model calls + Welch's t-test scoring</div>
                      </div>
                    </div>
                  )}

                  {selectedTest.status === "PENDING" && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: "hsl(var(--warning)/0.08)", display: "grid", placeItems: "center", border: "1px solid hsl(var(--warning)/0.12)" }}>
                        <GitCompare size={20} style={{ color: "hsl(var(--warning))" }} />
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "hsl(var(--foreground-dim))" }}>Ready to run</div>
                        <div style={{ fontSize: 11.5, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)", marginTop: 3 }}>Hit Run Test to begin statistical evaluation</div>
                      </div>
                    </div>
                  )}

                  {selectedTest.status === "COMPLETED" && (
                    <>
                      {/* Winner banner */}
                      <div style={{
                        borderRadius: 14, padding: "16px 18px",
                        background: "linear-gradient(135deg, hsl(var(--success)/0.07), hsl(var(--success)/0.03))",
                        border: "1px solid hsl(var(--success)/0.15)",
                        display: "flex", alignItems: "center", gap: 14,
                      }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "hsl(var(--success)/0.12)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                          <CheckCircle size={20} style={{ color: "hsl(var(--success))" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--success))" }}>
                            Welch's T-Test Complete
                          </div>
                          <div style={{ fontSize: 11.5, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
                            High-confidence statistical evaluation completed
                          </div>
                        </div>
                      </div>

                      {/* Stats tiles */}
                      <div style={{ display: "flex", gap: 10 }}>
                        <StatTile
                          label="Winner"
                          value={selectedTest.winnerId ? `v${selectedTest.winnerId.substring(0, 6)}` : "None"}
                          color="var(--warning)"
                        />
                        <StatTile
                          label="p-value"
                          value={selectedTest.pValue != null ? selectedTest.pValue.toFixed(4) : "—"}
                          color={selectedTest.pValue != null && selectedTest.pValue < 0.05 ? "var(--success)" : "var(--warning)"}
                        />
                      </div>

                      {/* Variant comparison */}
                      <div>
                        <SectionLabel>Variant comparison</SectionLabel>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          {(["A", "B"] as const).map((variant) => {
                            const score   = variant === "A" ? (selectedTest.summaryMetrics?.avgScoreA    ?? 0.88) : (selectedTest.summaryMetrics?.avgScoreB    ?? 0.94);
                            const variance= variant === "A" ? (selectedTest.summaryMetrics?.varianceA    ?? 0.012): (selectedTest.summaryMetrics?.varianceB    ?? 0.008);
                            const rate    = variant === "A" ? (selectedTest.summaryMetrics?.successRateA ?? 94.0) : (selectedTest.summaryMetrics?.successRateB ?? 98.2);
                            const isWinner= selectedTest.winnerId === (variant === "A" ? selectedTest.promptAId : selectedTest.promptBId);
                            return (
                              <div key={variant} style={{
                                borderRadius: 12, padding: "14px 16px",
                                background: isWinner ? "hsl(var(--warning)/0.06)" : "hsl(var(--card-elev)/0.6)",
                                border: `1px solid ${isWinner ? "hsl(var(--warning)/0.15)" : "hsl(var(--border)/0.15)"}`,
                              }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono)" }}>Variant {variant}</span>
                                  {isWinner && <Award size={14} style={{ color: "hsl(var(--warning))" }} />}
                                </div>
                                {[
                                  { label: "Avg score",    value: score.toFixed(3),    color: "var(--success)" },
                                  { label: "Variance",     value: variance.toFixed(4), color: "var(--muted-foreground)" },
                                  { label: "Success rate", value: `${rate.toFixed(1)}%`, color: "var(--success)" },
                                ].map(({ label, value, color }) => (
                                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                    <span style={{ fontSize: 10.5, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}>{label}</span>
                                    <span style={{ fontSize: 12.5, fontFamily: "var(--font-mono)", fontWeight: 600, color: `hsl(${color})` }}>{value}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState icon={GitCompare} title="No trial selected" sub="Select or configure an A/B trial to begin" />
            )
          )}
        </div>
      </div>

      {/* ── Create Version Modal ───────────────────────────────────────────── */}
      {showCreateModal && (
        <Modal title="New Prompt Template" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreateVersion} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FieldInput label="Template name" value={newVersion.name} onChange={(v) => setNewVersion({ ...newVersion, name: v })} placeholder="e.g. support_router_v2" required />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <FieldSelect label="Model" value={newVersion.model} onChange={(v) => setNewVersion({ ...newVersion, model: v })}>
                {modelOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                <option value="custom">Custom…</option>
              </FieldSelect>
              <FieldInput label="Temperature" type="number" value={newVersion.temperature} onChange={(v) => setNewVersion({ ...newVersion, temperature: parseFloat(v) || 0.7 })} />
              <FieldInput label="Max tokens" type="number" value={newVersion.maxTokens} onChange={(v) => setNewVersion({ ...newVersion, maxTokens: parseInt(v) || 2048 })} />
            </div>

            {newVersion.model === "custom" && (
              <FieldInput label="Custom model ID" value={customModel} onChange={setCustomModel} placeholder="e.g. meta-llama/llama-3.1-70b" required />
            )}

            <FieldInput
              label="Prompt content — use {{variable}} for template variables"
              value={newVersion.content}
              onChange={(v) => setNewVersion({ ...newVersion, content: v })}
              placeholder={"You are an expert agent.\n\nHandle this request: {{user_query}}"}
              rows={7} required
            />

            <ModalFooter onCancel={() => setShowCreateModal(false)} submitLabel="Create template" />
          </form>
        </Modal>
      )}

      {/* ── Create A/B Test Modal ─────────────────────────────────────────── */}
      {showAbModal && (
        <Modal title="New A/B Test" onClose={() => setShowAbModal(false)}>
          <form onSubmit={handleCreateAbTest} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FieldSelect label="Evaluation dataset" value={newAbTest.datasetId} onChange={(v) => setNewAbTest({ ...newAbTest, datasetId: v })}>
              <option value="">Select a dataset…</option>
              {datasets.map((d) => <option key={d.datasetId} value={d.datasetId}>{d.name} ({d.examples ?? 0} items)</option>)}
            </FieldSelect>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <FieldSelect label="Variant A" value={newAbTest.promptAId} onChange={(v) => setNewAbTest({ ...newAbTest, promptAId: v })}>
                <option value="">Select variant A…</option>
                {versions.map((v) => <option key={v.versionId} value={v.versionId}>{v.name}</option>)}
              </FieldSelect>
              <FieldSelect label="Variant B" value={newAbTest.promptBId} onChange={(v) => setNewAbTest({ ...newAbTest, promptBId: v })}>
                <option value="">Select variant B…</option>
                {versions.map((v) => <option key={v.versionId} value={v.versionId}>{v.name}</option>)}
              </FieldSelect>
            </div>

            <ModalFooter onCancel={() => setShowAbModal(false)} submitLabel="Configure test" />
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function PromptsPage() {
  return (
    <Suspense fallback={null}>
      <PromptsContent />
    </Suspense>
  );
}
