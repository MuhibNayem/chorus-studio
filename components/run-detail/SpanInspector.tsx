"use client";

import { RefCard } from "@/components/primitives/RefCard";
import RefBadge from "@/components/primitives/RefBadge";
import CodeBlock from "@/components/shared/CodeBlock";
import { formatDuration, formatTokens, formatCost } from "@/lib/utils";
import { Sparkles, Wrench, Shield, Database, Layers, X } from "lucide-react";
import type { Span, LlmCall, ToolCall } from "@/types";

const spanIcon = {
  llm: Sparkles,
  tool: Wrench,
  guardrail: Shield,
  rag: Database,
  default: Layers,
} as const;

function getSpanType(span: Span): string {
  const name = span.spanName.toLowerCase();
  if (name.includes("llm") || name.includes("chat") || span.attributes["gen_ai.system"]) return "llm";
  if (name.includes("tool") || span.attributes["gen_ai.tool.name"]) return "tool";
  if (name.includes("guard") || name.includes("rail")) return "guardrail";
  if (name.includes("rag") || name.includes("retriev")) return "rag";
  return "default";
}

export default function SpanInspector({
  span,
  onClose,
  llmCall,
  toolCall,
}: {
  span: Span;
  onClose: () => void;
  llmCall?: LlmCall;
  toolCall?: ToolCall;
}) {
  const type = getSpanType(span);
  const Ic = (spanIcon as any)[type] || spanIcon.default;
  const dur = span.endTime
    ? new Date(span.endTime).getTime() - new Date(span.startTime).getTime()
    : Date.now() - new Date(span.startTime).getTime();

  return (
    <RefCard>
      <div className="detail-drawer">
        <div className="dr-head">
          <RefBadge variant={type as any}>{type === "default" ? "Span" : type.toUpperCase()}</RefBadge>
          <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{span.spanName}</span>
          <RefBadge variant={span.status === "OK" ? "success" : "error"} dot>{span.status}</RefBadge>
          <span className="mute mono tabular" style={{ fontSize: 11 }}>· {formatDuration(dur)}</span>
          <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap" style={{ marginBottom: 14 }}>
          <span className="mute mono" style={{ fontSize: 10 }}>SPAN_ID</span>
          <code className="mono" style={{ fontSize: 11 }}>{span.spanId}</code>
          <span className="mute" style={{ fontSize: 10 }}>·</span>
          <span className="mute mono" style={{ fontSize: 10 }}>PARENT</span>
          <code className="mono" style={{ fontSize: 11 }}>{span.parentSpanId || "∅"}</code>
        </div>

        <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }}>
          Attributes
        </div>
        <div className="kv-grid">
          {Object.entries(span.attributes).map(([k, v]) => (
            <div key={k} className="contents">
              <div className="k">{k}</div>
              <div className="v">{typeof v === "string" && v.length > 80 ? <code>{v.slice(0, 80)}…</code> : String(v)}</div>
            </div>
          ))}
        </div>

        {span.events.length > 0 && (
          <>
            <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 14, marginBottom: 6, fontWeight: 600 }}>
              Events ({span.events.length})
            </div>
            <div className="flex flex-col gap-1">
              {span.events.map((ev, i) => (
                <div key={i} className="flex items-center gap-2 rounded px-2.5 py-1.5 text-xs" style={{ background: "hsl(var(--muted) / 0.4)" }}>
                  <span className="font-medium">{ev.name}</span>
                  <span className="text-muted-foreground tabular-nums">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {llmCall && (
          <>
            <div className="flex items-center justify-between" style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 14, marginBottom: 6, fontWeight: 600 }}>
              <span>Prompt / Completion</span>
              <span className="mono tabular" style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>
                {formatTokens(llmCall.inputTokens)} in → {formatTokens(llmCall.outputTokens)} out · {formatCost(llmCall.costUsd)}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {llmCall.prompt && (
                <CodeBlock>
                  <span className="system">system:</span> {llmCall.prompt}
                </CodeBlock>
              )}
              <CodeBlock style={{ borderColor: "hsl(var(--primary) / 0.4)", background: "hsl(var(--primary) / 0.05)" }}>
                <span className="role">assistant:</span> {llmCall.completion}
              </CodeBlock>
            </div>
          </>
        )}

        {toolCall && (
          <>
            <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 14, marginBottom: 6, fontWeight: 600 }}>
              Tool call · <code className="mono" style={{ textTransform: "none", letterSpacing: 0 }}>{toolCall.toolName}</code>
            </div>
            <div className="flex flex-col gap-2">
              <div>
                <div className="mute" style={{ fontSize: 10, marginBottom: 4 }}>arguments</div>
                <CodeBlock>{toolCall.args || "—"}</CodeBlock>
              </div>
              <div>
                <div className="mute" style={{ fontSize: 10, marginBottom: 4 }}>result</div>
                <CodeBlock>{toolCall.result || toolCall.error || "—"}</CodeBlock>
              </div>
            </div>
          </>
        )}
      </div>
    </RefCard>
  );
}
