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
  Activity, Sparkles, Wrench, RefreshCw, Plus, Eye,
} from "lucide-react";
import type { Run, Span, LlmCall, ToolCall, ProvenanceEntry } from "@/types";

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

  useEffect(() => {
    if (!runId) return;
    setLoading(true);
    Promise.all([
      api.getRun(runId).catch(() => null),
      api.listSpans(runId).catch(() => []),
      api.listLlmCalls(runId).catch(() => []),
      api.listToolCalls(runId).catch(() => []),
      api.getProvenance(runId).catch(() => []),
    ]).then(([r, s, l, t, p]) => {
      setRun(r);
      setSpans(s);
      setLlmCalls(l);
      setToolCalls(t);
      setProvenance(p);
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
    { lbl: "Tokens", val: formatTokens(run.totalTokens), sub: "+812 vs prev" },
    { lbl: "Cost", val: formatCost(run.totalCost), sub: "−$0.003" },
    { lbl: "Latency", val: formatDuration(run.latencyMs), sub: "+184ms" },
    { lbl: "Spans", val: String(spans.length), sub: `${spans.filter((s) => s.status === "OK").length} OK · ${spans.filter((s) => s.status === "ERROR").length} err` },
  ];

  return (
    <div className="flex flex-col gap-5">
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
          <RefButton variant="outline" icon={RefreshCw}>Replay</RefButton>
          <RefButton variant="outline" icon={Plus}>To dataset</RefButton>
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
      {tab === "evals" && <EvalTab />}
      {tab === "raw" && <RawTab run={run} />}
    </div>
  );
}
