"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTokens, formatCost, formatDuration } from "@/lib/utils";
import TraceWaterfall from "@/components/waterfall/TraceWaterfall";
import ProvenanceDag from "@/components/dag/ProvenanceDag";
import type { Run, Span, LlmCall, ToolCall, ProvenanceEntry } from "@/types";

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

  // Real-time SSE for running traces
  useEffect(() => {
    if (!streaming || !runId) return;
    const cleanup = api.streamRun(
      runId,
      (newSpan) => {
        setSpans((prev) => {
          const exists = prev.find((s) => s.spanId === newSpan.spanId);
          if (exists) {
            return prev.map((s) => (s.spanId === newSpan.spanId ? newSpan : s));
          }
          return [...prev, newSpan];
        });
      },
      () => setStreaming(false)
    );
    return cleanup;
  }, [streaming, runId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!run) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Run Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No run found with ID {runId}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight font-mono">{run.runId}</h2>
            <Badge
              variant={
                run.status === "SUCCESS"
                  ? "success"
                  : run.status === "ERROR"
                  ? "destructive"
                  : "warning"
              }
            >
              {run.status}
            </Badge>
            {streaming && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                Live
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {run.framework} · {run.agentId} · {run.model ?? "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => api.submitFeedback(runId, 1)}>
            👍
          </Button>
          <Button variant="outline" size="sm" onClick={() => api.submitFeedback(runId, 0)}>
            👎
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Tokens</p>
            <p className="text-xl font-bold">{formatTokens(run.totalTokens)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Cost</p>
            <p className="text-xl font-bold">{formatCost(run.totalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Latency</p>
            <p className="text-xl font-bold">{formatDuration(run.latencyMs)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Spans</p>
            <p className="text-xl font-bold">{spans.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="waterfall">
        <TabsList>
          <TabsTrigger value="waterfall">Trace Waterfall</TabsTrigger>
          <TabsTrigger value="provenance">Provenance DAG</TabsTrigger>
          <TabsTrigger value="llm">LLM Calls ({llmCalls.length})</TabsTrigger>
          <TabsTrigger value="tools">Tool Calls ({toolCalls.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="waterfall">
          <TraceWaterfall run={run} spans={spans} llmCalls={llmCalls} toolCalls={toolCalls} />
        </TabsContent>

        <TabsContent value="provenance">
          <ProvenanceDag entries={provenance} />
        </TabsContent>

        <TabsContent value="llm">
          <LlmCallList calls={llmCalls} />
        </TabsContent>

        <TabsContent value="tools">
          <ToolCallList calls={toolCalls} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LlmCallList({ calls }: { calls: LlmCall[] }) {
  if (calls.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No LLM calls recorded for this run.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {calls.map((call) => (
        <Card key={call.callId}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{call.model}</CardTitle>
              <Badge variant="secondary">{call.provider}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{formatTokens(call.inputTokens)} → {formatTokens(call.outputTokens)} tokens</span>
              <span>{formatCost(call.costUsd)}</span>
              <span>{formatDuration(call.latencyMs)}</span>
            </div>
            {call.prompt && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Prompt</p>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">{call.prompt}</pre>
              </div>
            )}
            {call.completion && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Completion</p>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">{call.completion}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ToolCallList({ calls }: { calls: ToolCall[] }) {
  if (calls.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No tool calls recorded for this run.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {calls.map((call) => (
        <Card key={call.callId}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{call.toolName}</CardTitle>
              {call.error ? <Badge variant="destructive">Error</Badge> : <Badge variant="success">OK</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">{formatDuration(call.latencyMs)}</div>
            {call.args && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Arguments</p>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">{call.args}</pre>
              </div>
            )}
            {call.result && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Result</p>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">{call.result}</pre>
              </div>
            )}
            {call.error && (
              <div>
                <p className="text-xs font-medium text-destructive mb-1">Error</p>
                <pre className="text-xs bg-destructive/10 text-destructive p-3 rounded-md overflow-auto">{call.error}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
