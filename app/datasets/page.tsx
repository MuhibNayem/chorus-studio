"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { RefCard, CardHeader, CardPad } from "@/components/primitives/RefCard";
import RefButton from "@/components/primitives/RefButton";
import RefBadge from "@/components/primitives/RefBadge";
import PageHeader from "@/components/shared/PageHeader";
import type { Dataset, DatasetItem } from "@/types";
import {
  ExternalLink, Plus, Database, PlayCircle, Eye, X,
  BookOpen, ChevronDown, ChevronUp, Loader2, Sparkles,
  Search, Upload, Hash, Clock, Tag,
} from "lucide-react";

/* ── Helpers ─────────────────────────────────────────────── */

function Card({ dataset, onRunEval, onBrowse }: {
  dataset: Dataset;
  onRunEval: (d: Dataset) => void;
  onBrowse: (d: Dataset) => void;
}) {
  const tagKeys = Array.isArray(dataset.tags) ? dataset.tags : Object.keys(dataset.tags ?? {});
  return (
    <RefCard style={{ display: "flex", flexDirection: "column" }}>
      <CardPad>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Top: name + desc + owner */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "0.5rem",
                background: "linear-gradient(135deg, hsl(var(--rag)), hsl(var(--primary)))",
                display: "grid", placeItems: "center", flexShrink: 0,
              }}>
                <Database size={15} style={{ color: "white" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {dataset.name}
                </div>
                <div className="mono" style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
                  {dataset.datasetId}
                </div>
              </div>
            </div>
            {dataset.owner && (
              <RefBadge variant="muted" style={{ flexShrink: 0 }}>{dataset.owner}</RefBadge>
            )}
          </div>
          {dataset.description && (
            <p style={{ fontSize: "0.6875rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.5 }}>
              {dataset.description}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <div className="mono tabular" style={{ fontSize: "1.375rem", fontWeight: 600, color: "hsl(var(--foreground))", lineHeight: 1 }}>
              {dataset.examples ?? 0}
            </div>
            <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              examples
            </div>
          </div>
          {dataset.updated && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}>
              <Clock size={10} />
              {dataset.updated}
            </div>
          )}
        </div>

        {/* Tags */}
        {tagKeys.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {tagKeys.map((t) => (
              <span key={t} className="filter-chip" style={{ cursor: "default", pointerEvents: "none", fontSize: 10 }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="ref-btn sm ghost"
            style={{ color: "hsl(var(--primary-bright))", fontWeight: 500 }}
            onClick={() => onRunEval(dataset)}
          >
            <PlayCircle size={13} />
            Run Eval
          </button>
          <div className="sep-v" style={{ alignSelf: "center", height: 14 }} />
          <button
            className="ref-btn sm ghost"
            onClick={() => onBrowse(dataset)}
          >
            <Eye size={13} />
            Browse
          </button>
        </div>
        </div>
      </CardPad>
    </RefCard>
  );
}

/* ── Create Modal ────────────────────────────────────────── */

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      await api.createDataset(name, desc, undefined, tagList);
      onCreated();
      onClose();
    } catch (err) {
      alert("Failed to create dataset: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgb(0 0 0 / 0.5)", backdropFilter: "blur(4px)" }}>
      <div className="ref-card" style={{ width: "100%", maxWidth: 420 }}>
        <CardHeader title="New Dataset" />
        <CardPad>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, color: "hsl(var(--muted-foreground))", display: "block", marginBottom: 5 }}>
                Name
              </label>
              <input className="ref-input" placeholder="e.g. router-smoke-tests" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, color: "hsl(var(--muted-foreground))", display: "block", marginBottom: 5 }}>
                Description
              </label>
              <textarea
                className="ref-input"
                placeholder="Optional description of this dataset..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                style={{ height: 70, padding: "10px 12px", resize: "vertical", fontSize: "0.75rem", fontFamily: "var(--font-sans)" }}
              />
            </div>
            <div>
              <label className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, color: "hsl(var(--muted-foreground))", display: "block", marginBottom: 5 }}>
                Tags
              </label>
              <input className="ref-input" placeholder="prod, rag (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <RefButton variant="outline" onClick={onClose}>Cancel</RefButton>
              <RefButton variant="primary" onClick={handleCreate} disabled={loading || !name.trim()}>
                {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={13} />}
                Create
              </RefButton>
            </div>
          </div>
        </CardPad>
      </div>
    </div>
  );
}

/* ── Sidebar Item Card ───────────────────────────────────── */

function ItemCard({ item }: { item: DatasetItem }) {
  return (
    <div style={{
      border: "1px solid hsl(var(--border)/0.25)",
      borderRadius: "0.5rem",
      background: "hsl(var(--card))",
      overflow: "hidden",
      transition: "border-color 120ms ease",
    }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid hsl(var(--border)/0.15)" }}>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "hsl(var(--muted-foreground))", marginBottom: 6 }}>
          Input
        </div>
        <div className="code-block" style={{ border: 0, background: "transparent", padding: 0, maxHeight: 120, fontSize: 11.5, color: "hsl(var(--foreground))" }}>
          {item.input}
        </div>
      </div>
      <div style={{ padding: "12px 14px", background: "hsl(var(--background)/0.3)" }}>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "hsl(var(--muted-foreground))", marginBottom: 6 }}>
          Expected Output
        </div>
        <div className="code-block" style={{ border: 0, background: "transparent", padding: 0, maxHeight: 120, fontSize: 11.5, color: "hsl(var(--muted-foreground))" }}>
          {item.expectedOutput || "—"}
        </div>
      </div>
    </div>
  );
}

/* ── Browse Sidebar ──────────────────────────────────────── */

function BrowseSidebar({
  dataset,
  onClose,
}: {
  dataset: Dataset;
  onClose: () => void;
}) {
  const [items, setItems] = useState<DatasetItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [search, setSearch] = useState("");
  const [newInput, setNewInput] = useState("");
  const [newOutput, setNewOutput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const res = await api.listDatasetItems(dataset.datasetId, 0, 200);
      setItems(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  }, [dataset.datasetId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInput.trim()) return;
    setSubmitting(true);
    try {
      await api.addDatasetItem(dataset.datasetId, newInput.trim(), newOutput.trim());
      setNewInput("");
      setNewOutput("");
      setShowAddForm(false);
      await loadItems();
    } catch (err) {
      alert("Failed to add: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = search
    ? items.filter((i) => i.input.toLowerCase().includes(search.toLowerCase()) || (i.expectedOutput ?? "").toLowerCase().includes(search.toLowerCase()))
    : items;

  const tagKeys = Array.isArray(dataset.tags) ? dataset.tags : Object.keys(dataset.tags ?? {});

  return (
    <>
      <div className="fixed inset-0" onClick={onClose} style={{ zIndex: 49 }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(640px, 100vw)", zIndex: 50,
        background: "hsl(var(--card))",
        borderLeft: "1px solid hsl(var(--border)/0.35)",
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px -12px rgb(0 0 0 / 0.5)",
        animation: "slideInRight 0.2s ease-out",
      }}>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid hsl(var(--border)/0.25)", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "0.5rem",
            background: "linear-gradient(135deg, hsl(var(--rag)), hsl(var(--primary)))",
            display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2,
          }}>
            <Database size={16} style={{ color: "white" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "hsl(var(--foreground))", marginBottom: 2 }}>
              {dataset.name}
            </div>
            <div className="mono" style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}>
              {dataset.datasetId}
            </div>
            {dataset.description && (
              <p style={{ fontSize: "0.6875rem", color: "hsl(var(--muted-foreground))", marginTop: 4, lineHeight: 1.4 }}>
                {dataset.description}
              </p>
            )}
          </div>
          <button className="icon-btn" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Stats + tags bar */}
        <div style={{ padding: "10px 20px", borderBottom: "1px solid hsl(var(--border)/0.15)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span className="mono tabular" style={{ fontSize: "1.125rem", fontWeight: 600, color: "hsl(var(--foreground))" }}>
              {items.length}
            </span>
            <span style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              cases
            </span>
          </div>
          {tagKeys.length > 0 && (
            <div style={{ display: "flex", gap: 4 }}>
              {tagKeys.map((t) => (
                <span key={t} className="filter-chip" style={{ fontSize: 10, cursor: "default", pointerEvents: "none" }}>{t}</span>
              ))}
            </div>
          )}
          <div style={{ flex: 1 }} />
          <RefButton size="sm" variant="ghost" icon={Plus} onClick={() => setShowAddForm(!showAddForm)}>
            Add Case
          </RefButton>
        </div>

        {/* Add case form (collapsible) */}
        {showAddForm && (
          <form onSubmit={handleAdd} style={{ padding: "14px 20px", borderBottom: "1px solid hsl(var(--border)/0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Sparkles size={13} style={{ color: "hsl(var(--warning))" }} />
              <span className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>
                New Test Case
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>
                  Input query
                </div>
                <textarea
                  className="ref-input"
                  rows={3}
                  placeholder="User query or context..."
                  value={newInput}
                  onChange={(e) => setNewInput(e.target.value)}
                  required
                  style={{ height: 72, padding: "8px 10px", resize: "vertical", fontSize: "0.6875rem", fontFamily: "var(--font-sans)" }}
                />
              </div>
              <div>
                <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>
                  Expected output
                </div>
                <textarea
                  className="ref-input"
                  rows={3}
                  placeholder="Target response..."
                  value={newOutput}
                  onChange={(e) => setNewOutput(e.target.value)}
                  style={{ height: 72, padding: "8px 10px", resize: "vertical", fontSize: "0.6875rem", fontFamily: "var(--font-sans)" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <RefButton variant="primary" size="sm" type="submit" icon={submitting ? Loader2 : Plus} disabled={submitting || !newInput.trim()}>
                {submitting ? "Adding..." : "Add"}
              </RefButton>
            </div>
          </form>
        )}

        {/* Search */}
        <div style={{ padding: "10px 20px", borderBottom: "1px solid hsl(var(--border)/0.15)" }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))", pointerEvents: "none" }} />
            <input
              className="ref-input"
              placeholder="Search cases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 30 }}
            />
          </div>
        </div>

        {/* Item list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
          {loadingItems ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded animate-pulse" style={{ height: 120, background: "hsl(var(--muted))" }} />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", color: "hsl(var(--muted-foreground))", gap: 8 }}>
              <Search size={24} style={{ opacity: 0.3 }} />
              <div className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{search ? "No matching cases" : "No test cases yet"}</div>
              <div style={{ fontSize: 11 }}>{search ? "Try a different search term." : "Add your first test case above."}</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredItems.map((item) => (
                <ItemCard key={item.itemId} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid hsl(var(--border)/0.25)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="mono" style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}>
            {filteredItems.length} of {items.length} cases
          </span>
          <RefButton variant="outline" size="sm" onClick={onClose}>Close</RefButton>
        </div>
      </div>
    </>
  );
}

/* ── Main Page ───────────────────────────────────────────── */

export default function DatasetsPage() {
  const router = useRouter();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [browsing, setBrowsing] = useState<Dataset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDatasets = useCallback(() => {
    setLoading(true);
    setError(null);
    api.listDatasets(0, 50)
      .then((res) => setDatasets(res.items))
      .catch(() => setError("Failed to load datasets."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadDatasets(); }, [loadDatasets]);

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
        const ds = await api.createDataset(file.name.replace(".csv", ""), `Imported from ${file.name}`, undefined, ["imported"]);
        await api.importDatasetJsonl(ds.datasetId, jsonLines);
        loadDatasets();
      } catch (err) {
        alert("Failed to import CSV: " + (err instanceof Error ? err.message : String(err)));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const totalExamples = datasets.reduce((sum, d) => sum + (d.examples ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 }}>
      <input type="file" ref={fileInputRef} onChange={handleCSVImport} accept=".csv" style={{ display: "none" }} />

      <PageHeader
        title="Datasets"
        accent={datasets.length > 0 ? `/ ${datasets.length}` : undefined}
        sub="Curate golden evaluation suites, import CSV inputs, and run prompt comparisons."
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <RefButton variant="outline" icon={Upload} onClick={() => fileInputRef.current?.click()}>Import CSV</RefButton>
            <RefButton variant="primary" icon={Plus} onClick={() => setShowModal(true)}>New Dataset</RefButton>
          </div>
        }
      />

      {!loading && !error && datasets.length > 0 && (
        <div className="metric-rail" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 0 }}>
          <div className="metric" style={{ padding: "12px 18px" }}>
            <div className="m-lbl">Datasets</div>
            <div className="m-val" style={{ fontSize: "1.5rem" }}>{datasets.length}</div>
          </div>
          <div className="metric" style={{ padding: "12px 18px" }}>
            <div className="m-lbl">Total Examples</div>
            <div className="m-val" style={{ fontSize: "1.5rem" }}>{totalExamples}</div>
          </div>
          <div className="metric" style={{ padding: "12px 18px" }}>
            <div className="m-lbl">Tags</div>
            <div className="m-val" style={{ fontSize: "1.5rem" }}>
              {new Set(datasets.flatMap((d) => Array.isArray(d.tags) ? d.tags : Object.keys(d.tags ?? {}))).size}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <RefCard key={i}>
              <CardPad>
                <div className="animate-pulse" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="rounded" style={{ height: 16, width: "60%", background: "hsl(var(--muted))" }} />
                  <div className="rounded" style={{ height: 12, width: "40%", background: "hsl(var(--muted))" }} />
                  <div className="rounded" style={{ height: 10, width: "30%", background: "hsl(var(--muted))" }} />
                </div>
              </CardPad>
            </RefCard>
          ))}
        </div>
      ) : error ? (
        <div className="card-pad" style={{ color: "hsl(var(--error))", fontSize: 13 }}>{error}</div>
      ) : datasets.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0", gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "1rem",
            background: "linear-gradient(135deg, hsl(var(--rag)/0.2), hsl(var(--primary)/0.2))",
            display: "grid", placeItems: "center",
          }}>
            <Database size={28} style={{ color: "hsl(var(--primary-bright))", opacity: 0.7 }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "hsl(var(--foreground))", marginBottom: 4 }}>
              No datasets yet
            </div>
            <p style={{ fontSize: "0.8125rem", color: "hsl(var(--muted-foreground))", maxWidth: 420, lineHeight: 1.5 }}>
              Create a test dataset manually or import a CSV to start benchmarking prompts and running evaluations.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <RefButton variant="outline" icon={Upload} onClick={() => fileInputRef.current?.click()}>Import CSV</RefButton>
            <RefButton variant="primary" icon={Plus} onClick={() => setShowModal(true)}>New Dataset</RefButton>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
          {datasets.map((d) => (
            <Card
              key={d.datasetId}
              dataset={d}
              onRunEval={(ds) => router.push(`/prompts?activeTab=ab-tests&preloadedDatasetId=${ds.datasetId}`)}
              onBrowse={setBrowsing}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && <CreateModal onClose={() => setShowModal(false)} onCreated={loadDatasets} />}

      {/* Browse Sidebar */}
      {browsing && (
        <BrowseSidebar dataset={browsing} onClose={() => setBrowsing(null)} />
      )}
    </div>
  );
}
