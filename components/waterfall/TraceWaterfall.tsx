"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDuration } from "@/lib/utils";
import { X } from "lucide-react";
import type { Run, Span, LlmCall, ToolCall } from "@/types";

const SPAN_TYPE_CLASSES: Record<string, { bar: string; dot: string; label: string }> = {
  llm:       { bar: "bg-blue-500",   dot: "bg-blue-500",   label: "LLM" },
  tool:      { bar: "bg-emerald-500",dot: "bg-emerald-500",label: "Tool" },
  guardrail: { bar: "bg-amber-500",  dot: "bg-amber-500",  label: "Guard" },
  rag:       { bar: "bg-purple-500", dot: "bg-purple-500", label: "RAG" },
  default:   { bar: "bg-slate-400",  dot: "bg-slate-400",  label: "" },
};

function getSpanType(span: Span): string {
  const name = span.spanName.toLowerCase();
  if (name.includes("llm") || name.includes("chat") || span.attributes["gen_ai.system"]) return "llm";
  if (name.includes("tool") || span.attributes["gen_ai.tool.name"]) return "tool";
  if (name.includes("guard") || name.includes("rail")) return "guardrail";
  if (name.includes("rag") || name.includes("retriev")) return "rag";
  return "default";
}

function buildFlatSpanList(spans: Span[]): Array<{ span: Span; depth: number }> {
  const byParent = new Map<string | null, Span[]>();
  for (const span of spans) {
    const parent = span.parentSpanId;
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent)!.push(span);
  }

  const result: Array<{ span: Span; depth: number }> = [];
  function walk(parentId: string | null, depth: number) {
    const children = byParent.get(parentId) ?? [];
    for (const span of children) {
      result.push({ span, depth });
      walk(span.spanId, depth + 1);
    }
  }
  walk(null, 0);
  return result;
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

  const flat = useMemo(() => buildFlatSpanList(spans), [spans]);

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
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        No spans recorded for this run.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Waterfall */}
      <Card>
        <CardContent className="p-4 overflow-x-auto">
          {/* Timeline header */}
          <div className="mb-3 flex items-center gap-3 text-[10px] text-muted-foreground pl-2">
            <div className="w-44 shrink-0" />
            <div className="flex-1 flex justify-between">
              <span>0ms</span>
              <span>{formatDuration(totalDuration)}</span>
            </div>
            <div className="w-16 shrink-0" />
          </div>

          <div className="space-y-px min-w-[480px]">
            {flat.map(({ span, depth }) => {
              const spanStart = new Date(span.startTime).getTime();
              const spanEnd = span.endTime ? new Date(span.endTime).getTime() : runEnd;
              const offset = ((spanStart - runStart) / totalDuration) * 100;
              const width = ((spanEnd - spanStart) / totalDuration) * 100;
              const type = getSpanType(span);
              const style = SPAN_TYPE_CLASSES[type];
              const llm = llmBySpan.get(span.spanId);
              const tool = toolBySpan.get(span.spanId);
              const isSelected = selectedSpan?.spanId === span.spanId;

              return (
                <div
                  key={span.spanId}
                  className={`flex items-center gap-3 rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/10 ring-1 ring-primary/30"
                      : "hover:bg-muted/50"
                  }`}
                  style={{ paddingLeft: `${depth * 20 + 8}px` }}
                  onClick={() => setSelectedSpan(isSelected ? null : span)}
                >
                  {/* Span name */}
                  <div className="w-44 shrink-0 flex items-center gap-1.5 min-w-0 truncate">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${style.dot}`} />
                    <span className="text-xs font-medium truncate">{span.spanName}</span>
                  </div>

                  {/* Timeline bar */}
                  <div className="flex-1 relative h-5 rounded overflow-hidden bg-muted/40">
                    <div
                      className={`absolute top-0.5 h-4 rounded ${style.bar} opacity-75`}
                      style={{
                        left: `${Math.max(0, offset)}%`,
                        width: `${Math.max(width, 0.5)}%`,
                      }}
                    />
                  </div>

                  {/* Duration */}
                  <div className="w-14 text-right text-[11px] text-muted-foreground tabular-nums shrink-0">
                    {formatDuration(spanEnd - spanStart)}
                  </div>

                  {/* Annotation */}
                  <div className="w-24 text-right text-[11px] text-muted-foreground shrink-0 truncate hidden md:block">
                    {llm && `↕${llm.inputTokens + llm.outputTokens} tok`}
                    {tool && tool.toolName}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Span detail panel */}
      {selectedSpan && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  <h3 className="font-semibold text-sm">{selectedSpan.spanName}</h3>
                  <Badge variant={selectedSpan.status === "OK" ? "success" : selectedSpan.status === "ERROR" ? "destructive" : "secondary"} dot>
                    {selectedSpan.status}
                  </Badge>
                </div>
                <code className="mt-1 block text-[11px] text-muted-foreground">{selectedSpan.spanId}</code>
              </div>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
                onClick={() => setSelectedSpan(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <Separator />

            {Object.keys(selectedSpan.attributes).length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Attributes</p>
                <pre className="overflow-auto rounded-lg bg-muted/60 p-3 text-[11px] font-mono max-h-56 leading-relaxed">
                  {JSON.stringify(selectedSpan.attributes, null, 2)}
                </pre>
              </div>
            )}

            {selectedSpan.events.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Events ({selectedSpan.events.length})
                </p>
                <div className="space-y-1">
                  {selectedSpan.events.map((ev, i) => (
                    <div key={i} className="flex items-center gap-2 rounded bg-muted/40 px-2.5 py-1.5 text-[11px]">
                      <span className="font-medium">{ev.name}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {llmBySpan.get(selectedSpan.spanId) && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">LLM Call</p>
                <pre className="overflow-auto rounded-lg bg-muted/60 p-3 text-[11px] font-mono max-h-48 leading-relaxed">
                  {JSON.stringify(llmBySpan.get(selectedSpan.spanId), null, 2)}
                </pre>
              </div>
            )}

            {toolBySpan.get(selectedSpan.spanId) && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Tool Call</p>
                <pre className="overflow-auto rounded-lg bg-muted/60 p-3 text-[11px] font-mono max-h-48 leading-relaxed">
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
