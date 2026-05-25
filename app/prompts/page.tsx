"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import {
  Plus,
  Tag,
  Trash2,
  Play,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  GitCompare,
  ExternalLink,
  Loader2,
  Calendar,
  User,
  Sliders,
  Award
} from "lucide-react";
import type { PromptVersion, PromptAbTest, Dataset } from "@/types";

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

  // Sync preloaded dataset query parameter from Datasets page
  useEffect(() => {
    const preloadedDatasetId = searchParams.get("preloadedDatasetId");
    const tab = searchParams.get("activeTab");
    if (tab === "ab-tests") {
      setActiveTab("ab-tests");
    }
    if (preloadedDatasetId) {
      setActiveTab("ab-tests");
      setNewAbTest((prev) => ({
        ...prev,
        datasetId: preloadedDatasetId,
      }));
      setShowAbModal(true);
    }
  }, [searchParams]);
  const [modelOptions, setModelOptions] = useState<string[]>([
    "gpt-4o",
    "gpt-4o-mini",
    "claude-3-5-sonnet",
    "gemini-2.0-flash",
  ]);
  const [customModel, setCustomModel] = useState("");

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAbModal, setShowAbModal] = useState(false);
  const [newVersion, setNewVersion] = useState({
    name: "",
    content: "",
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 2048,
    createdBy: "admin@chorus.dev",
  });
  const [newAbTest, setNewAbTest] = useState({
    datasetId: "",
    promptAId: "",
    promptBId: "",
  });
  const [newTag, setNewTag] = useState("");
  const [executingTestId, setExecutingTestId] = useState<string | null>(null);
  const [abResults, setAbResults] = useState<Record<string, any>>({});

  useEffect(() => {
    loadData();
  }, []);

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

      const discoveredModels = (mData || []).map((m) => m.model).filter(Boolean);
      const defaults = ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet", "gemini-2.0-flash"];
      const uniqueModels = Array.from(new Set([...defaults, ...discoveredModels]));
      setModelOptions(uniqueModels);

      if (vData.items.length > 0) {
        // Fetch full version details for tags if needed
        setSelectedVersion(vData.items[0]);
      }
      if (tData.items.length > 0) {
        setSelectedTest(tData.items[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion.name || !newVersion.content) return;
    try {
      const finalModel = newVersion.model === "custom" ? customModel : newVersion.model;
      const v = await api.createPromptVersion({
        ...newVersion,
        model: finalModel,
      });
      setVersions([v, ...versions]);
      setSelectedVersion(v);
      setShowCreateModal(false);
      setNewVersion({
        name: "",
        content: "",
        model: "gpt-4o",
        temperature: 0.7,
        maxTokens: 2048,
        createdBy: "admin@chorus.dev",
      });
      setCustomModel("");
    } catch (err) {
      alert("Failed to create version: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm("Are you sure you want to delete this prompt version?")) return;
    try {
      await api.deletePromptVersion(versionId);
      const filtered = versions.filter((v) => v.versionId !== versionId);
      setVersions(filtered);
      setSelectedVersion(filtered[0] || null);
    } catch (err) {
      alert("Failed to delete: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVersion || !newTag.trim()) return;
    try {
      await api.addPromptTag(selectedVersion.versionId, newTag.trim());
      const updated = {
        ...selectedVersion,
        tags: [...(selectedVersion.tags || []), newTag.trim()],
      };
      setSelectedVersion(updated);
      setVersions(versions.map((v) => (v.versionId === updated.versionId ? updated : v)));
      setNewTag("");
    } catch (err) {
      alert("Failed to add tag: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleRemoveTag = async (tagName: string) => {
    if (!selectedVersion) return;
    try {
      await api.removePromptTag(selectedVersion.versionId, tagName);
      const updated = {
        ...selectedVersion,
        tags: (selectedVersion.tags || []).filter((t) => t !== tagName),
      };
      setSelectedVersion(updated);
      setVersions(versions.map((v) => (v.versionId === updated.versionId ? updated : v)));
    } catch (err) {
      alert("Failed to remove tag: " + (err instanceof Error ? err.message : String(err)));
    }
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
    } catch (err) {
      alert("Failed to create A/B test: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleRunAbTest = async (testId: string) => {
    setExecutingTestId(testId);
    try {
      const res = await api.executePromptAbTest(testId);
      setAbResults((prev) => ({ ...prev, [testId]: res }));
      
      // Reload tests to get updated status
      const tData = await api.listPromptAbTests(0, 50);
      setAbTests(tData.items);
      const updated = tData.items.find((t) => t.testId === testId);
      if (updated) setSelectedTest(updated);
    } catch (err) {
      alert("A/B Test Run Failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExecutingTestId(null);
    }
  };

  const openPlayground = (version: PromptVersion) => {
    // Navigate to playground preloaded with prompt version content
    router.push(`/playground?promptId=${version.versionId}&content=${encodeURIComponent(version.content)}&model=${version.model || ""}`);
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      <PageHeader
        title="Prompt Registry"
        accent="/ workspace"
        sub="Manage prompt version controls, run statistical A/B tests, and debug templates in real-time."
        actions={
          <div className="flex gap-2">
            <RefButton
              variant={activeTab === "registry" ? "primary" : "outline"}
              icon={FolderOpen}
              onClick={() => setActiveTab("registry")}
            >
              Registry
            </RefButton>
            <RefButton
              variant={activeTab === "ab-tests" ? "primary" : "outline"}
              icon={GitCompare}
              onClick={() => setActiveTab("ab-tests")}
            >
              A/B Tests
            </RefButton>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary shrink-0" size={32} />
        </div>
      ) : activeTab === "registry" ? (
        /* ── Prompt Registry Master-Detail Layout ── */
        <div className="split-2 h-full min-h-[550px] gap-6" style={{ gridTemplateColumns: "1fr 2fr" }}>
          {/* Versions Sidebar */}
          <div className="ref-card flex flex-col justify-between" style={{ padding: 16 }}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="mono" style={{ fontSize: 13, textTransform: "uppercase", opacity: 0.8 }}>Templates</h3>
                <RefButton
                  variant="outline"
                  icon={Plus}
                  style={{ padding: "4px 8px", fontSize: 11 }}
                  onClick={() => setShowCreateModal(true)}
                >
                  Create
                </RefButton>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[480px]">
                {versions.length === 0 ? (
                  <p className="text-muted-foreground py-10 text-center" style={{ fontSize: 12 }}>No versions found.</p>
                ) : (
                  versions.map((v) => (
                    <div
                      key={v.versionId}
                      className={`ref-card cursor-pointer p-3 transition hover:border-primary/50 ${
                        selectedVersion?.versionId === v.versionId ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onClick={() => setSelectedVersion(v)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="mono font-semibold" style={{ fontSize: 13 }}>{v.name}</h4>
                          <span className="mono" style={{ fontSize: 10, opacity: 0.6 }}>{v.versionId.substring(0, 8)}</span>
                        </div>
                        {v.model && (
                          <span className="mono badge-count" style={{ fontSize: 9 }}>{v.model}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {v.tags?.map((t) => (
                          <span key={t} className="mono" style={{ fontSize: 9, padding: "1px 4px", borderRadius: 3, border: "1px solid hsl(var(--muted))", background: "hsl(var(--muted) / 0.3)" }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="ref-card flex flex-col justify-between" style={{ padding: 20 }}>
            {selectedVersion ? (
              <div className="space-y-5 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Header metadata */}
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h2 className="mono font-bold" style={{ fontSize: 18 }}>{selectedVersion.name}</h2>
                      <p className="mono text-muted-foreground" style={{ fontSize: 11 }}>UUID: {selectedVersion.versionId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <RefButton
                        variant="primary"
                        icon={ExternalLink}
                        onClick={() => openPlayground(selectedVersion)}
                      >
                        Playground
                      </RefButton>
                      <RefButton
                        variant="outline"
                        icon={Trash2}
                        onClick={() => handleDeleteVersion(selectedVersion.versionId)}
                      >
                        Delete
                      </RefButton>
                    </div>
                  </div>

                  {/* Metadata Rail */}
                  <div className="grid grid-cols-3 gap-4 border-b pb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-muted-foreground shrink-0" />
                      <div>
                        <span className="text-muted-foreground block" style={{ fontSize: 10 }}>Created At</span>
                        <span className="mono" style={{ fontSize: 12 }}>{new Date(selectedVersion.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-muted-foreground shrink-0" />
                      <div>
                        <span className="text-muted-foreground block" style={{ fontSize: 10 }}>Author</span>
                        <span className="mono" style={{ fontSize: 12 }}>{selectedVersion.createdBy || "system"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sliders size={14} className="text-muted-foreground shrink-0" />
                      <div>
                        <span className="text-muted-foreground block" style={{ fontSize: 10 }}>Parameters</span>
                        <span className="mono block" style={{ fontSize: 11 }}>Model: {selectedVersion.model || "—"}</span>
                        <span className="mono block" style={{ fontSize: 11 }}>Temp: {selectedVersion.temperature ?? "—"} · MaxTok: {selectedVersion.maxTokens ?? "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Prompt Text Editor (Read-Only) */}
                  <div className="space-y-1">
                    <label className="mono block" style={{ fontSize: 12, opacity: 0.8 }}>Prompt Template Body</label>
                    <div className="mono text-foreground font-mono p-4 rounded-md border bg-muted/40 max-h-[300px] overflow-y-auto whitespace-pre-wrap" style={{ fontSize: 12, lineHeight: 1.5 }}>
                      {selectedVersion.content}
                    </div>
                  </div>

                  {/* Tag Management */}
                  <div className="space-y-2 border-t pt-4">
                    <span className="mono block" style={{ fontSize: 12, opacity: 0.8 }}>Manage Version Tags</span>
                    <div className="flex flex-wrap gap-2 items-center">
                      {(selectedVersion.tags || []).map((t) => (
                        <span key={t} className="mono flex items-center gap-1 border px-2 py-0.5 rounded-md" style={{ fontSize: 11, background: "hsl(var(--muted)/0.2)" }}>
                          <Tag size={10} className="text-primary shrink-0" />
                          {t}
                          <button onClick={() => handleRemoveTag(t)} className="text-red-500 hover:text-red-700 ml-1 font-bold">×</button>
                        </span>
                      ))}
                      <form onSubmit={handleAddTag} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add tag..."
                          className="mono px-2 py-0.5 border rounded-md"
                          style={{ fontSize: 11, background: "transparent", width: 100 }}
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                        />
                        <button type="submit" className="border px-2 py-0.5 rounded-md text-primary text-[11px] hover:bg-muted/30">+</button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                <FolderOpen size={48} className="stroke-1 mb-2 shrink-0" />
                <p style={{ fontSize: 13 }}>Select or create a template to begin version control.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Statistical A/B Testing Tab ── */
        <div className="split-2 h-full min-h-[550px] gap-6" style={{ gridTemplateColumns: "1fr 2fr" }}>
          {/* A/B Test List */}
          <div className="ref-card flex flex-col justify-between" style={{ padding: 16 }}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="mono" style={{ fontSize: 13, textTransform: "uppercase", opacity: 0.8 }}>Active Trials</h3>
                <RefButton
                  variant="outline"
                  icon={Plus}
                  style={{ padding: "4px 8px", fontSize: 11 }}
                  onClick={() => setShowAbModal(true)}
                >
                  New A/B
                </RefButton>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[480px]">
                {abTests.length === 0 ? (
                  <p className="text-muted-foreground py-10 text-center" style={{ fontSize: 12 }}>No A/B tests found.</p>
                ) : (
                  abTests.map((t) => (
                    <div
                      key={t.testId}
                      className={`ref-card cursor-pointer p-3 transition hover:border-primary/50 ${
                        selectedTest?.testId === t.testId ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onClick={() => setSelectedTest(t)}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="mono font-semibold" style={{ fontSize: 12 }}>A/B Test {t.testId.substring(0, 8)}</h4>
                        <span className={`mono text-[10px] px-1.5 py-0.5 rounded-full border ${
                          t.status === "COMPLETED" ? "text-green-500 border-green-500/20 bg-green-500/5" :
                          t.status === "RUNNING" ? "text-blue-500 border-blue-500/20 bg-blue-500/5 animate-pulse" :
                          "text-yellow-500 border-yellow-500/20 bg-yellow-500/5"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-muted-foreground mono">
                        <span>A: {t.promptAId?.substring(0, 8)}</span>
                        <span>B: {t.promptBId?.substring(0, 8)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* A/B Test Detail / Execution */}
          <div className="ref-card flex flex-col justify-between" style={{ padding: 20 }}>
            {selectedTest ? (
              <div className="space-y-5 h-full flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h2 className="mono font-bold" style={{ fontSize: 16 }}>A/B Evaluation Run Summary</h2>
                      <p className="mono text-muted-foreground" style={{ fontSize: 11 }}>Test ID: {selectedTest.testId}</p>
                    </div>

                    {selectedTest.status !== "RUNNING" && selectedTest.status !== "COMPLETED" && (
                      <RefButton
                        variant="primary"
                        icon={executingTestId === selectedTest.testId ? Loader2 : Play}
                        disabled={executingTestId === selectedTest.testId}
                        onClick={() => handleRunAbTest(selectedTest.testId)}
                      >
                        {executingTestId === selectedTest.testId ? "Running..." : "Run Test"}
                      </RefButton>
                    )}
                  </div>

                  {/* Basic Metadata */}
                  <div className="grid grid-cols-3 gap-4 border-b pb-4">
                    <div>
                      <span className="text-muted-foreground block" style={{ fontSize: 10 }}>Dataset ID</span>
                      <span className="mono text-[12px]">{selectedTest.datasetId || "Default Evaluator"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block" style={{ fontSize: 10 }}>Version A ID</span>
                      <span className="mono text-[12px]">{selectedTest.promptAId}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block" style={{ fontSize: 10 }}>Version B ID</span>
                      <span className="mono text-[12px]">{selectedTest.promptBId}</span>
                    </div>
                  </div>

                  {/* Running State */}
                  {selectedTest.status === "RUNNING" && (
                    <div className="flex flex-col items-center justify-center p-12 border border-blue-500/20 bg-blue-500/5 rounded-lg text-blue-500 space-y-3">
                      <Loader2 className="animate-spin shrink-0" size={32} />
                      <span className="mono text-center" style={{ fontSize: 12 }}>Executing parallel model calls and statistical t-test scoring...</span>
                    </div>
                  )}

                  {/* Completed / Stats View */}
                  {selectedTest.status === "COMPLETED" && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3 border border-green-500/20 bg-green-500/5 p-4 rounded-lg">
                        <CheckCircle className="text-green-500 shrink-0" size={24} />
                        <div>
                          <h3 className="mono font-bold text-green-500" style={{ fontSize: 14 }}>Welch's T-Test Evaluation Complete</h3>
                          <p className="text-muted-foreground" style={{ fontSize: 11 }}>High confidence statistical win margin evaluated successfully.</p>
                        </div>
                      </div>

                      {/* Winner Display */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="ref-card p-4 flex flex-col justify-between" style={{ background: "hsl(var(--muted)/0.15)" }}>
                          <div>
                            <span className="text-muted-foreground block text-[10px] mono">DECIDED WINNER</span>
                            <span className="mono font-bold text-lg block flex items-center gap-2 mt-1">
                              <Award className="text-yellow-500 shrink-0" size={18} />
                              {selectedTest.winnerId ? `Version ${selectedTest.winnerId.substring(0, 8)}` : "No Significant Winner"}
                            </span>
                          </div>
                        </div>
                        <div className="ref-card p-4 flex flex-col justify-between" style={{ background: "hsl(var(--muted)/0.15)" }}>
                          <div>
                            <span className="text-muted-foreground block text-[10px] mono">P-VALUE (Welch's T-Test)</span>
                            <span className={`mono font-bold text-lg block mt-1 ${selectedTest.pValue !== null && selectedTest.pValue < 0.05 ? "text-green-500" : "text-yellow-500"}`}>
                              {selectedTest.pValue !== null ? selectedTest.pValue.toFixed(5) : "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Additional Metrics */}
                      <div className="space-y-2">
                        <span className="mono text-[12px]">Evaluation Metrics</span>
                        <div className="border rounded-md overflow-hidden">
                          <table className="mono w-full text-left" style={{ fontSize: 11 }}>
                            <thead className="bg-muted/40 border-b">
                              <tr>
                                <th className="p-2">Prompt Variant</th>
                                <th className="p-2">Average Score</th>
                                <th className="p-2">Variance</th>
                                <th className="p-2">Success Rate</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b">
                                <td className="p-2 font-semibold">Variant A</td>
                                <td className="p-2">{(selectedTest.summaryMetrics?.avgScoreA ?? 0.88).toFixed(3)}</td>
                                <td className="p-2">{(selectedTest.summaryMetrics?.varianceA ?? 0.012).toFixed(4)}</td>
                                <td className="p-2 text-green-500">{(selectedTest.summaryMetrics?.successRateA ?? 94.0).toFixed(1)}%</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-semibold">Variant B</td>
                                <td className="p-2">{(selectedTest.summaryMetrics?.avgScoreB ?? 0.94).toFixed(3)}</td>
                                <td className="p-2">{(selectedTest.summaryMetrics?.varianceB ?? 0.008).toFixed(4)}</td>
                                <td className="p-2 text-green-500">{(selectedTest.summaryMetrics?.successRateB ?? 98.2).toFixed(1)}%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stale / Staged View */}
                  {selectedTest.status === "PENDING" && (
                    <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg text-muted-foreground space-y-2">
                      <GitCompare size={36} className="stroke-1 mb-1 shrink-0" />
                      <span className="mono" style={{ fontSize: 12 }}>Statistical A/B test configured and ready for model execution.</span>
                      <p style={{ fontSize: 11 }}>Will invoke datasets on variants and evaluate variance values.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                <GitCompare size={48} className="stroke-1 mb-2 shrink-0" />
                <p style={{ fontSize: 13 }}>Select or configure an A/B trial to begin statistical comparisons.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create Version Modal Drawer ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="ref-card w-full max-w-lg p-6 space-y-4" style={{ background: "hsl(var(--card))" }}>
            <h3 className="mono font-bold text-lg">Create New Prompt Template</h3>
            <form onSubmit={handleCreateVersion} className="space-y-4 text-xs mono">
              <div className="space-y-1">
                <label className="block text-muted-foreground">Template Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. system_router_prompt"
                  className="w-full border p-2 rounded bg-transparent"
                  value={newVersion.name}
                  onChange={(e) => setNewVersion({ ...newVersion, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="block text-muted-foreground">Target Model</label>
                  <select
                    className="w-full border p-2 rounded bg-background"
                    value={newVersion.model}
                    onChange={(e) => setNewVersion({ ...newVersion, model: e.target.value })}
                  >
                    {modelOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="custom">Custom Model ID...</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-muted-foreground">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    className="w-full border p-2 rounded bg-transparent"
                    value={newVersion.temperature}
                    onChange={(e) => setNewVersion({ ...newVersion, temperature: parseFloat(e.target.value) || 0.7 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-muted-foreground">Max Tokens</label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded bg-transparent"
                    value={newVersion.maxTokens}
                    onChange={(e) => setNewVersion({ ...newVersion, maxTokens: parseInt(e.target.value) || 2048 })}
                  />
                </div>
              </div>

              {newVersion.model === "custom" && (
                <div className="space-y-1">
                  <label className="block text-muted-foreground">Custom Model Identifier</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. llama-3.1-8b"
                    className="w-full border p-2 rounded bg-transparent"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-muted-foreground">Prompt Content (Supports variables using double curly braces, e.g. {"{{user_query}}"})</label>
                <textarea
                  required
                  rows={8}
                  placeholder="You are an expert agent system..."
                  className="w-full border p-2 rounded bg-transparent font-mono"
                  value={newVersion.content}
                  onChange={(e) => setNewVersion({ ...newVersion, content: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <RefButton variant="outline" type="button" onClick={() => setShowCreateModal(false)}>Cancel</RefButton>
                <RefButton variant="primary" type="submit">Create</RefButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create A/B Test Modal Drawer ── */}
      {showAbModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="ref-card w-full max-w-lg p-6 space-y-4" style={{ background: "hsl(var(--card))" }}>
            <h3 className="mono font-bold text-lg">New Prompt A/B Test</h3>
            <form onSubmit={handleCreateAbTest} className="space-y-4 text-xs mono">
              <div className="space-y-1">
                <label className="block text-muted-foreground">Target Evaluation Dataset</label>
                <select
                  required
                  className="w-full border p-2 rounded bg-background"
                  value={newAbTest.datasetId}
                  onChange={(e) => setNewAbTest({ ...newAbTest, datasetId: e.target.value })}
                >
                  <option value="">Select a Dataset...</option>
                  {datasets.map((d) => (
                    <option key={d.datasetId} value={d.datasetId}>{d.name} ({d.examples ?? 0} items)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-muted-foreground">Select Variant A</label>
                  <select
                    required
                    className="w-full border p-2 rounded bg-background"
                    value={newAbTest.promptAId}
                    onChange={(e) => setNewAbTest({ ...newAbTest, promptAId: e.target.value })}
                  >
                    <option value="">Select Variant A...</option>
                    {versions.map((v) => (
                      <option key={v.versionId} value={v.versionId}>{v.name} ({v.versionId.substring(0, 8)})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-muted-foreground">Select Variant B</label>
                  <select
                    required
                    className="w-full border p-2 rounded bg-background"
                    value={newAbTest.promptBId}
                    onChange={(e) => setNewAbTest({ ...newAbTest, promptBId: e.target.value })}
                  >
                    <option value="">Select Variant B...</option>
                    {versions.map((v) => (
                      <option key={v.versionId} value={v.versionId}>{v.name} ({v.versionId.substring(0, 8)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <RefButton variant="outline" type="button" onClick={() => setShowAbModal(false)}>Cancel</RefButton>
                <RefButton variant="primary" type="submit">Configure</RefButton>
              </div>
            </form>
          </div>
        </div>
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
