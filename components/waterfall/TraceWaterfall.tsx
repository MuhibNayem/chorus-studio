"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import type { Run, Span, LlmCall, ToolCall } from "@/types";

const KIND_COLORS: Record<string, string> = {
  INTERNAL: "bg-slate-400",
  SERVER: "bg-blue-400",
  CLIENT: "bg-blue-500",
  PRODUCER: "bg-purple-400",
  CONSUMER: "bg-purple-500",
};

const SPAN_TYPE_COLORS: Record<string, string> = {
  llm: "bg-llm",
  tool: "bg-tool",
  guardrail: "bg-guardrail",
  rag: "bg-rag",
  default: "bg-slate-400",
};

function getSpanType(span: Span): string {
  const name = span.spanName.toLowerCase();
  if (name.includes("llm") || name.includes("chat") || span.attributes["gen_ai.system"]) return "llm";
  if (name.includes("tool") || span.attributes["gen_ai.tool.name"]) return "tool";
  if (name.includes("guard") || name.includes("rail")) return "guardrail";
  if (name.includes("rag") || name.includes("retriev")) return "rag";
  return "default";
}

function buildSpanTree(spans: Span[]): Span[][] {
  const byParent = new Map<string | null, Span[]>();
  for (const span of spans) {
    const parent = span.parentSpanId;
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent)!.push(span);
  }

  const rows: Span[][] = [];
  function walk(parentId: string | null, depth: number) {
    const children = byParent.get(parentId) ?? [];
    for (const span of children) {
      while (rows.length <= depth) rows.push([]);
      rows[depth].push(span);
      walk(span.spanId, depth + 1);
    }
  }
  walk(null, 0);
  return rows;
}

export default function TraceWaterfall({
  run,
  spans,
  llmCalls,
  toolCalls,
}: {
  run: Run;
  spans: Span[];
  llmCalls: LlmCall[];
  toolCalls: ToolCall[];
}) {
  const [selectedSpan, setSelectedSpan] = useState<Span | null>(null);

  const runStart = useMemo(() => new Date(run.startTime).getTime(), [run.startTime]);
  const runEnd = useMemo(
    () => (run.endTime ? new Date(run.endTime).getTime() : Date.now()),
    [run.endTime]
  );
  const totalDuration = Math.max(runEnd - runStart, 1);

  const tree = useMemo(() => buildSpanTree(spans), [spans]);

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

  if (spans.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No spans recorded for this run.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="space-y-1">
            {tree.map((row, depth) =>
              row.map((span) => {
                const spanStart = new Date(span.startTime).getTime();
                const spanEnd = span.endTime ? new Date(span.endTime).getTime() : runEnd;
                const offset = ((spanStart - runStart) / totalDuration) * 100;
                const width = ((spanEnd - spanStart) / totalDuration) * 100;
                const type = getSpanType(span);
                const llm = llmBySpan.get(span.spanId);
                const tool = toolBySpan.get(span.spanId);

                return (
                  <div
                    key={span.spanId}
                    className="flex items-center gap-3 group cursor-pointer hover:bg-accent/30 rounded px-2 py-1 transition-colors"
                    style={{ paddingLeft: `${depth * 24 + 8}px` }}
                    onClick={() => setSelectedSpan(span)}
                  >
                    <div className="w-48 shrink-0 truncate text-xs font-medium">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${SPAN_TYPE_COLORS[type]}`} />
                      {span.spanName}
                    </div>
                    <div className="flex-1 relative h-6 bg-muted/50 rounded overflow-hidden">
                      <div
                        className={`absolute top-1 h-4 rounded ${SPAN_TYPE_COLORS[type]} opacity-80 group-hover:opacity-100 transition-opacity`}
                        style={{ left: `${offset}%`, width: `${Math.max(width, 0.5)}%` }}
                      />
                    </div>
                    <div className="w-20 text-right text-xs text-muted-foreground shrink-0">
                      {formatDuration(spanEnd - spanStart)}
                    </div>
                    {(llm || tool) && (
                      <div className="w-32 text-right text-xs text-muted-foreground shrink-0 truncate">
                        {llm && `${llm.inputTokens}→${llm.outputTokens} tok`}
                        {tool && `${tool.toolName}`}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Span Detail Panel */}
      {selectedSpan && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{selectedSpan.spanName}</h3>
                <Badge variant={selectedSpan.status === "OK" ? "success" : selectedSpan.status === "ERROR" ? "destructive" : "secondary"}>
                  {selectedSpan.status}
                </Badge>
              </div>
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedSpan(null)}
              >
                Close
              </button>
            </div>
            <div className="text-xs text-muted-foreground font-mono">{selectedSpan.spanId}</div>
            {Object.keys(selectedSpan.attributes).length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1">Attributes</p>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64">
                  {JSON.stringify(selectedSpan.attributes, null, 2)}
                </pre>
              </div>
            )}
            {selectedSpan.events.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1">Events ({selectedSpan.events.length})</p>
                <div className="space-y-1">
                  {selectedSpan.events.map((ev, i) => (
                    <div key={i} className="text-xs bg-muted p-2 rounded">
                      <span className="font-medium">{ev.name}</span>{" "}
                      <span className="text-muted-foreground">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {llmBySpan.get(selectedSpan.spanId) && (
              <div>
                <p className="text-xs font-medium mb-1">LLM Call</p>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                  {JSON.stringify(llmBySpan.get(selectedSpan.spanId), null, 2)}
                </pre>
              </div>
            )}
            {toolBySpan.get(selectedSpan.spanId) && (
              <div>
                <p className="text-xs font-medium mb-1">Tool Call</p>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                  {JSON.stringify(toolBySpan.get(selectedSpan.spanId), null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
