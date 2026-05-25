"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import RefBadge from "@/components/primitives/RefBadge";
import RefButton from "@/components/primitives/RefButton";
import RefTabs from "@/components/primitives/Tabs";
import Waterfall from "@/components/run-detail/Waterfall";
import SpanInspector from "@/components/run-detail/SpanInspector";
import LlmCallList from "@/components/run-detail/LlmCallList";
import ToolCallList from "@/components/run-detail/ToolCallList";
import ProvenanceDag from "@/components/run-detail/ProvenanceDag";
import EvalTab from "@/components/run-detail/EvalTab";
import RawTab from "@/components/run-detail/RawTab";
import { RefCard } from "@/components/primitives/RefCard";
import { formatTokens, formatCost, formatDuration, formatRel, formatHM } from "@/lib/utils";
import {
  ArrowLeft, ThumbsUp, ThumbsDown, GitBranch, Cpu, Server,
  Activity, Sparkles, Wrench, RefreshCw, Plus, Eye, X,
} from "lucide-react";
import type { Run, Span, LlmCall, ToolCall, ProvenanceEntry, Dataset } from "@/types";
import { Select } from "@/components/ui/select";

function StatusBadge({ status }: { status: Run["status"] }) {
  const map: Record<string, { v: string; label: string }> = {
    SUCCESS: { v: "success", label: "Success" },
    ERROR: { v: "error", label: "Error" },
    RUNNING: { v: "warning", label: "Running" },
  };
  const m = map[status] || { v: "muted", label: status };
  return <RefBadge variant={m.v as any} dot>{m.label}</RefBadge>;
}

export default function RunDetailPage() {
  const params = useParams();
  const runId = params.runId as string;

  const [run, setRun] = useState<Run | null>(null);
  const [spans, setSpans] = useState<Span[]>([]);
  const [llmCalls, setLlmCalls] = useState<LlmCall[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [provenance, setProvenance] = useState<ProvenanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<1 | 0 | null>(null);
  const [tab, setTab] = useState("trace");
  const [selectedSpan, setSelectedSpan] = useState<Span | null>(null);

  // Add to Dataset Modal State
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [loadingDatasets, setLoadingDatasets] = useState(false);

  useEffect(() => {
    if (!runId) return;
    setLoading(true);
    Promise.all([
      api.getRun(runId).catch(() => null),
      api.listSpans(runId, 0, 500).catch(() => ({ items: [], total: 0, page: 0, size: 500 })),
      api.listLlmCalls(runId, 0, 100).catch(() => ({ items: [], total: 0, page: 0, size: 100 })),
      api.listToolCalls(runId, 0, 100).catch(() => ({ items: [], total: 0, page: 0, size: 100 })),
      api.getProvenance(runId, 0, 100).catch(() => ({ items: [], total: 0, page: 0, size: 100 })),
    ]).then(([r, s, l, t, p]) => {
      setRun(r);
      setSpans(s.items);
      setLlmCalls(l.items);
      setToolCalls(t.items);
      setProvenance(p.items);
      if (r?.status === "RUNNING") setStreaming(true);
    }).finally(() => setLoading(false));
  }, [runId]);

  useEffect(() => {
    if (!streaming || !runId) return;
    return api.streamRun(
      runId,
      (newSpan) => {
        setSpans((prev) => {
          const exists = prev.find((s) => s.spanId === newSpan.spanId);
          return exists ? prev.map((s) => (s.spanId === newSpan.spanId ? newSpan : s)) : [...prev, newSpan];
        });
      },
      () => setStreaming(false)
    );
  }, [streaming, runId]);

  const handleFeedback = (score: 1 | 0) => {
    api.submitFeedback(runId, score).catch(() => {});
    setFeedbackSent(score);
  };

  const handleReplay = async () => {
    if (!run) return;
    try {
      const res = await api.replayRun(run.runId);
      alert(`Causal replay triggered successfully! New run created: run_${res.runId}`);
    } catch (err) {
      alert(`Failed to trigger replay: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const openDatasetModal = async () => {
    setLoadingDatasets(true);
    setShowDatasetModal(true);
    try {
      const res = await api.listDatasets(0, 100);
      const items = res.items;
      setDatasets(items);
      if (items.length > 0) {
        setSelectedDatasetId(items[0].datasetId);
      }
    } catch (err) {
      alert("Failed to load datasets list.");
    } finally {
      setLoadingDatasets(false);
    }
  };

  const handleAddToDataset = async () => {
    if (!selectedDatasetId || !run) return;
    try {
      const inputStr = run.framework + " Execution with " + run.agentId;
      const outputStr = run.status + " latency: " + run.latencyMs + "ms";
      await api.addDatasetItem(selectedDatasetId, inputStr, outputStr);
      alert("Run was successfully exported as an example to the selected dataset!");
      setShowDatasetModal(false);
    } catch (err) {
      alert(`Failed to export run: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const llmBySpan = useMemo(() => {
    const map = new Map<string, LlmCall>();
    for (const c of llmCalls) map.set(c.spanId, c);
    return map;
  }, [llmCalls]);

  const toolBySpan = useMemo(() => {
    const map = new Map<string, ToolCall>();
    for (const c of toolCalls) map.set(c.spanId, c);
    return map;
  }, [toolCalls]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded animate-pulse" />)}
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!run) {
    return (
      <RefCard className="max-w-md mx-auto mt-12">
        <div className="card-pad text-center py-10">
          <p className="font-semibold">Run not found</p>
          <p className="mt-1 text-sm text-muted-foreground">No run with ID <code className="mono">{runId}</code></p>
          <Link href="/runs" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft size={13} /> All runs
          </Link>
        </div>
      </RefCard>
    );
  }

  const stats = [
    { lbl: "Tokens", val: formatTokens(run.totalTokens), sub: run.mix ? `${run.mix.find(([t]) => t === "llm")?.[1] ?? 0}% LLM` : "+812 vs prev" },
    { lbl: "Cost", val: formatCost(run.totalCost), sub: `~$${(run.totalCost / Math.max(run.totalTokens, 1) * 1000).toFixed(4)}/1k tok` },
    { lbl: "Latency", val: formatDuration(run.latencyMs), sub: `${formatDuration(run.latencyMs)} total` },
    { lbl: "Spans", val: String(spans.length), sub: `${spans.filter((s) => s.status === "OK").length} OK · ${spans.filter((s) => s.status === "ERROR").length} err` },
  ];

  return (
    <div className="flex flex-col gap-5 relative">
      {/* Back link */}
      <Link
        href="/runs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        style={{ cursor: "pointer", width: "fit-content" }}
      >
        <ArrowLeft size={13} /> All runs
      </Link>

      {/* Run header */}
      <div className="page-h" style={{ alignItems: "flex-start" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="page-title mono" style={{ fontSize: 22, letterSpacing: "-0.04em", wordBreak: "break-all" }}>
              run_{run.runId}
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={run.status} />
            {run.status === "RUNNING" && (
              <span className="live-pill"><span className="dot" />Streaming</span>
            )}
            <RefBadge variant="muted"><GitBranch size={9} />{run.framework}</RefBadge>
            <RefBadge variant="muted"><Cpu size={9} />{run.agentId}</RefBadge>
            {run.model && <RefBadge variant="muted"><Server size={9} />{run.model}</RefBadge>}
            <span className="mute" style={{ fontSize: 11, marginLeft: 6, fontFamily: "var(--font-mono)" }}>
              started {formatRel(run.startTime)} · {formatHM(run.startTime)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <RefButton
            variant={feedbackSent === 1 ? "primary" : "outline"}
            icon={ThumbsUp}
            disabled={feedbackSent !== null}
            onClick={() => handleFeedback(1)}
          >Good</RefButton>
          <RefButton
            variant={feedbackSent === 0 ? "danger" : "outline"}
            icon={ThumbsDown}
            disabled={feedbackSent !== null}
            onClick={() => handleFeedback(0)}
          >Bad</RefButton>
          <div className="sep-v" />
          <RefButton variant="outline" icon={RefreshCw} onClick={handleReplay}>Replay</RefButton>
          <RefButton variant="outline" icon={Plus} onClick={openDatasetModal}>To dataset</RefButton>
        </div>
      </div>

      {/* Stats */}
      <div className="metric-rail" style={{ marginBottom: 18 }}>
        {stats.map((s, i) => (
          <div key={i} className="metric" style={{ padding: "14px 18px" }}>
            <div className="m-lbl">{s.lbl}</div>
            <div className="m-val">{s.val}</div>
            <div className="mute" style={{ fontSize: 10, marginTop: 6, fontFamily: "var(--font-mono)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <RefTabs
        tabs={[
          { key: "trace", label: "Trace", count: spans.length, icon: Activity },
          { key: "llm", label: "LLM", count: llmCalls.length, icon: Sparkles },
          { key: "tools", label: "Tools", count: toolCalls.length, icon: Wrench },
          { key: "provenance", label: "Provenance", icon: GitBranch },
          { key: "evals", label: "Evals", count: 4, icon: Activity },
          { key: "raw", label: "Raw", icon: Activity },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "trace" && (
        <div className="split-2">
          <Waterfall run={run} spans={spans} selected={selectedSpan} onSelect={setSelectedSpan} />
          {selectedSpan ? (
            <SpanInspector
              span={selectedSpan}
              onClose={() => setSelectedSpan(null)}
              llmCall={llmBySpan.get(selectedSpan.spanId)}
              toolCall={toolBySpan.get(selectedSpan.spanId)}
            />
          ) : (
            <RefCard>
              <div className="card-pad text-center" style={{ padding: "48px 24px", color: "hsl(var(--muted-foreground))" }}>
                <Eye size={28} style={{ opacity: 0.4, marginBottom: 12 }} />
                <div style={{ fontSize: 13, fontWeight: 500, color: "hsl(var(--foreground))" }}>Select a span</div>
                <div style={{ fontSize: 11.5, marginTop: 6, maxWidth: 240, margin: "6px auto 0" }}>
                  Click any span in the trace to inspect its prompt, tool args, and attributes.
                </div>
              </div>
            </RefCard>
          )}
        </div>
      )}

      {tab === "llm" && <LlmCallList calls={llmCalls} />}
      {tab === "tools" && <ToolCallList calls={toolCalls} />}
      {tab === "provenance" && <ProvenanceDag entries={provenance} />}
      {tab === "evals" && <EvalTab runId={run.runId} />}
      {tab === "raw" && <RawTab run={run} />}

      {/* Dataset Selection Modal */}
      {showDatasetModal && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg max-w-sm w-full shadow-lg relative p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Select Target Dataset</h2>
              <button onClick={() => setShowDatasetModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={15} />
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              {loadingDatasets ? (
                <div className="text-xs text-muted-foreground py-4 text-center animate-pulse">Loading datasets list...</div>
              ) : datasets.length === 0 ? (
                <div className="text-xs text-muted-foreground py-4 text-center">No datasets found. Create one on the Datasets screen first.</div>
              ) : (
                <div>
                  <label className="text-[10px] font-medium mute block mb-1">TARGET DATASET</label>
                  <Select
                    value={selectedDatasetId}
                    onChange={(v) => setSelectedDatasetId(v as string)}
                    options={datasets.map((d) => ({ value: d.datasetId, label: `${d.name} (${d.datasetId})` }))}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <RefButton variant="outline" onClick={() => setShowDatasetModal(false)}>Cancel</RefButton>
              <RefButton variant="primary" onClick={handleAddToDataset} disabled={loadingDatasets || datasets.length === 0}>Export</RefButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
