"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import RefBadge from "@/components/primitives/RefBadge";
import { RefCard } from "@/components/primitives/RefCard";
import { api } from "@/lib/api";
import type { Dataset, DatasetItem } from "@/types";
import {
  ExternalLink,
  Plus,
  Database,
  PlayCircle,
  Eye,
  X,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Terminal,
  Loader2,
  Sparkles
} from "lucide-react";

export default function DatasetsPage() {
  const router = useRouter();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dataset Creation Modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState("");

  // Expandable Guided Onboarding state
  const [showGuide, setShowGuide] = useState(true);

  // Dynamic Item Browse Drawer state
  const [selectedDatasetForBrowse, setSelectedDatasetForBrowse] = useState<Dataset | null>(null);
  const [datasetItems, setDatasetItems] = useState<DatasetItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showBrowseDrawer, setShowBrowseDrawer] = useState(false);

  // Manual Test Case Addition states
  const [newItemInput, setNewItemInput] = useState("");
  const [newItemOutput, setNewItemOutput] = useState("");
  const [submittingNewItem, setSubmittingNewItem] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDatasets = () => {
    setLoading(true);
    setError(null);
    api.listDatasets(0, 50)
      .then((res) => setDatasets(res.items))
      .catch(() => setError("Failed to load datasets."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      await api.createDataset(name, desc, undefined, tagList);
      setName("");
      setDesc("");
      setTags("");
      setShowModal(false);
      loadDatasets();
    } catch (err) {
      alert("Failed to create dataset: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleBrowse = async (dataset: Dataset) => {
    setSelectedDatasetForBrowse(dataset);
    setShowBrowseDrawer(true);
    setLoadingItems(true);
    try {
      const res = await api.listDatasetItems(dataset.datasetId, 0, 100);
      setDatasetItems(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleAddManualItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDatasetForBrowse || !newItemInput.trim()) return;
    setSubmittingNewItem(true);
    try {
      await api.addDatasetItem(selectedDatasetForBrowse.datasetId, newItemInput.trim(), newItemOutput.trim());
      setNewItemInput("");
      setNewItemOutput("");
      // Reload items inside drawer
      const res = await api.listDatasetItems(selectedDatasetForBrowse.datasetId, 0, 100);
      setDatasetItems(res.items);
      // Refresh datasets list in main grid to update examples count
      const updatedList = await api.listDatasets(0, 50);
      setDatasets(updatedList.items);
    } catch (err) {
      alert("Failed to add test case: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmittingNewItem(false);
    }
  };

  const handleRunEval = (dataset: Dataset) => {
    router.push(`/prompts?activeTab=ab-tests&preloadedDatasetId=${dataset.datasetId}`);
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) return;
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const inputIdx = Math.max(0, headers.findIndex((h) => h.includes("input") || h.includes("prompt") || h.includes("question")));
        const outputIdx = Math.max(1, headers.findIndex((h) => h.includes("output") || h.includes("expected") || h.includes("response") || h.includes("answer")));
        const jsonLines: string[] = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(",").map((v) => v.trim());
          if (row[inputIdx]) jsonLines.push(JSON.stringify({ input: row[inputIdx], expectedOutput: row[outputIdx] ?? "" }));
        }
        if (jsonLines.length === 0) return;
        const ds = await api.createDataset(file.name.replace(".csv", ""), `Uploaded from ${file.name}`, undefined, ["imported"]);
        await api.importDatasetJsonl(ds.datasetId, jsonLines);
        loadDatasets();
      } catch (err) {
        alert("Failed to import CSV: " + (err instanceof Error ? err.message : String(err)));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-5 relative h-full">
      <input type="file" ref={fileInputRef} onChange={handleCSVImport} accept=".csv" className="hidden" />

      <PageHeader
        title="Datasets"
        accent={`/ ${datasets.length}`}
        sub="Curate golden evaluation suites, upload CSV inputs, and run side-by-side prompt comparisons."
        actions={
          <div className="flex gap-2">
            <RefButton variant="outline" icon={ExternalLink} onClick={() => fileInputRef.current?.click()}>Import CSV</RefButton>
            <RefButton variant="primary" icon={Plus} onClick={() => setShowModal(true)}>New Dataset</RefButton>
          </div>
        }
      />

      {/* ── Collapsible Guided Onboarding Panel ── */}
      <div className="ref-card" style={{ padding: 0 }}>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors rounded-t-lg"
          style={{ textDecoration: "none" }}
        >
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-primary shrink-0" />
            <span className="mono font-bold text-xs uppercase tracking-wider">Understanding Datasets in Chorus Observe</span>
          </div>
          {showGuide ? <ChevronUp size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0" />}
        </button>

        {showGuide && (
          <div className="p-5 border-t grid grid-cols-1 md:grid-cols-3 gap-6 text-xs mono">
            <div className="space-y-2 border-r pr-4 last:border-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary shrink-0">1</div>
                <h4 className="font-bold">Production Harvesting</h4>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Slice queries directly from live trace logs in the <span className="text-foreground font-semibold">Runs</span> dashboard. Clicking "Add to Dataset" creates a golden evaluation case.
              </p>
            </div>

            <div className="space-y-2 border-r pr-4 last:border-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary shrink-0">2</div>
                <h4 className="font-bold">Welch's T-Test Evals</h4>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Evaluate prompt changes against a dataset in <span className="text-foreground font-semibold">Prompts</span>. Chorus executes prompt variants and runs Welch's t-test to measure significance.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary shrink-0">3</div>
                <h4 className="font-bold">Continuous Loops</h4>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Wire loops under <span className="text-foreground font-semibold">Evaluators</span> to automatically run dataset-based benchmarks periodically, alerting teams of metric drift.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Grid Content ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <RefCard key={i}>
              <div className="card-pad animate-pulse flex flex-col gap-3">
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
            </RefCard>
          ))}
        </div>
      ) : error ? (
        <div className="ref-card card-pad" style={{ color: "hsl(var(--error))", fontSize: 13 }}>{error}</div>
      ) : datasets.length === 0 ? (
        <div className="ref-card card-pad flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
          <Database size={48} className="stroke-1 text-primary shrink-0" />
          <div className="text-center space-y-1">
            <h4 className="mono font-bold text-foreground text-sm">No Datasets Found</h4>
            <p className="max-w-md text-xs leading-relaxed">Create a test dataset manually or import a CSV from local backups to configure prompts benchmarking.</p>
          </div>
          <div className="flex gap-2">
            <RefButton variant="outline" onClick={() => fileInputRef.current?.click()}>Import CSV</RefButton>
            <RefButton variant="primary" onClick={() => setShowModal(true)}>New Dataset</RefButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datasets.map((d) => {
            const tagKeys = Array.isArray(d.tags) ? d.tags : Object.keys(d.tags ?? {});
            return (
              <RefCard key={d.datasetId}>
                <div className="card-pad flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1" style={{ minWidth: 0, flex: 1 }}>
                        <div className="flex items-center gap-2">
                          <Database size={15} style={{ color: "hsl(var(--rag))" }} className="shrink-0" />
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{d.name}</span>
                        </div>
                        {d.description && (
                          <p style={{ fontSize: 11.5, color: "hsl(var(--muted-foreground))" }} className="line-clamp-2">{d.description}</p>
                        )}
                        <div className="mono text-muted-foreground" style={{ fontSize: 10 }}>UUID: {d.datasetId}</div>
                      </div>
                      {d.owner && <RefBadge variant="muted">{d.owner}</RefBadge>}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mono">
                      <span>
                        <span className="mono font-bold text-foreground" style={{ fontSize: 13 }}>
                          {d.examples ?? 0}
                        </span>{" "}examples
                      </span>
                      <span>updated {d.updated ?? "—"}</span>
                    </div>

                    {tagKeys.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tagKeys.map((t) => (
                          <span key={t} className="filter-chip" style={{ cursor: "default", pointerEvents: "none" }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <RefButton size="sm" variant="outline" icon={PlayCircle} onClick={() => handleRunEval(d)}>
                      Run Eval
                    </RefButton>
                    <RefButton size="sm" variant="ghost" icon={Eye} onClick={() => handleBrowse(d)}>
                      Browse
                    </RefButton>
                  </div>
                </div>
              </RefCard>
            );
          })}
        </div>
      )}

      {/* ── Create Dataset Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg max-w-md w-full shadow-lg relative p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-sm font-semibold mono">Create New Dataset</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={15} />
              </button>
            </div>
            <div className="flex flex-col gap-3 text-xs mono">
              <div>
                <label className="text-[10px] font-medium mute block mb-1">DATASET NAME</label>
                <input
                  type="text"
                  placeholder="e.g., router-smoke-tests"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-muted/50 border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium mute block mb-1">DESCRIPTION</label>
                <textarea
                  placeholder="Optional description..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full bg-muted/50 border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px]"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium mute block mb-1">TAGS (COMMA SEPARATED)</label>
                <input
                  type="text"
                  placeholder="e.g., prod, rag"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-muted/50 border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t">
              <RefButton variant="outline" onClick={() => setShowModal(false)}>Cancel</RefButton>
              <RefButton variant="primary" onClick={handleCreate} disabled={!name.trim()}>Create</RefButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Interactive Item Explorer Sidebar Drawer ── */}
      {showBrowseDrawer && selectedDatasetForBrowse && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="fixed inset-0" onClick={() => setShowBrowseDrawer(false)} />
          <div
            className="relative bg-card border-l w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
            style={{ background: "hsl(var(--card))" }}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b flex items-center justify-between bg-muted/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-primary shrink-0" />
                  <h3 className="mono font-bold text-sm">{selectedDatasetForBrowse.name}</h3>
                </div>
                <p className="text-[11px] text-muted-foreground mono">UUID: {selectedDatasetForBrowse.datasetId}</p>
              </div>
              <button
                onClick={() => setShowBrowseDrawer(false)}
                className="border p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground shrink-0"
              >
                <X size={15} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Manual Add Case Form */}
              <div className="ref-card p-4 space-y-3 bg-muted/10">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-yellow-500 shrink-0" />
                  <span className="mono font-bold text-xs uppercase">Curate Manual Test Case</span>
                </div>
                <form onSubmit={handleAddManualItem} className="space-y-3 text-xs mono">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-muted-foreground text-[10px]">INPUT QUERY</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="e.g. User query or parameter context..."
                        className="w-full bg-background border rounded p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        value={newItemInput}
                        onChange={(e) => setNewItemInput(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-muted-foreground text-[10px]">EXPECTED OUTPUT (GROUND TRUTH)</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Target response or structured output..."
                        className="w-full bg-background border rounded p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        value={newItemOutput}
                        onChange={(e) => setNewItemOutput(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <RefButton
                      variant="primary"
                      type="submit"
                      icon={submittingNewItem ? Loader2 : Plus}
                      disabled={submittingNewItem || !newItemInput.trim()}
                      style={{ padding: "6px 12px", fontSize: 11 }}
                    >
                      {submittingNewItem ? "Adding..." : "Add Test Case"}
                    </RefButton>
                  </div>
                </form>
              </div>

              {/* Items List Table */}
              <div className="space-y-2">
                <span className="mono font-bold text-xs uppercase block text-muted-foreground">Example Cases ({datasetItems.length})</span>
                {loadingItems ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="animate-spin text-primary shrink-0" size={24} />
                  </div>
                ) : datasetItems.length === 0 ? (
                  <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground text-xs mono">
                    No examples inside this dataset yet. Use the form above to add one.
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden bg-background">
                    <table className="w-full text-left border-collapse text-xs mono">
                      <thead>
                        <tr className="bg-muted/40 border-b">
                          <th className="p-3 font-semibold" style={{ width: "50%" }}>Input Context</th>
                          <th className="p-3 font-semibold" style={{ width: "50%" }}>Expected Output (Ground Truth)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datasetItems.map((item) => (
                          <tr key={item.itemId} className="border-b last:border-0 hover:bg-muted/10">
                            <td className="p-3 align-top whitespace-pre-wrap leading-relaxed">{item.input}</td>
                            <td className="p-3 align-top whitespace-pre-wrap leading-relaxed text-muted-foreground">{item.expectedOutput || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t bg-muted/10 flex justify-end">
              <RefButton variant="outline" onClick={() => setShowBrowseDrawer(false)}>Close Explorer</RefButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
