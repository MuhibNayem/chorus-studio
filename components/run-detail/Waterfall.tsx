"use client";

import { useMemo, useState } from "react";
import RefButton from "@/components/primitives/RefButton";
import { RefCard } from "@/components/primitives/RefCard";
import { formatDuration } from "@/lib/utils";
import { ChevronsUpDown, Eye, Sparkles, Wrench, Shield, Database, Layers } from "lucide-react";
import type { Run, Span } from "@/types";

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

function buildTree(spans: Span[]) {
  const byParent = new Map<string | null, Span[]>();
  for (const s of spans) {
    const p = s.parentSpanId;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p)!.push(s);
  }
  const out: Array<{ span: Span; depth: number; isLast: boolean; ancestorsLast: boolean[] }> = [];
  const walk = (parent: string | null, depth: number, isLast: boolean, ancestorsLast: boolean[]) => {
    const list = byParent.get(parent) ?? [];
    list.forEach((s, i) => {
      const last = i === list.length - 1;
      out.push({ span: s, depth, isLast: last, ancestorsLast: [...ancestorsLast, isLast] });
      walk(s.spanId, depth + 1, last, [...ancestorsLast, isLast]);
    });
  };
  walk(null, 0, true, []);
  return out;
}

export default function Waterfall({
  run,
  spans,
  selected,
  onSelect,
}: {
  run: Run;
  spans: Span[];
  selected: Span | null;
  onSelect: (span: Span | null) => void;
}) {
  const t0 = new Date(run.startTime).getTime();
  const total = run.latencyMs || Math.max(1, Date.now() - t0);
  const flat = useMemo(() => buildTree(spans), [spans]);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(total * p));

  return (
    <RefCard style={{ overflow: "hidden" }}>
      <div className="wf-toolbar">
        <div className="flex items-center gap-2">
          <RefButton variant="outline" size="sm" icon={ChevronsUpDown}>Collapse all</RefButton>
          <RefButton variant="ghost" size="sm" icon={Eye}>Critical path</RefButton>
        </div>
        <div className="legend">
          {["llm", "tool", "rag", "guardrail"].map((t) => (
            <div key={t} className="leg">
              <span className="sw" style={{ background: `hsl(var(--${t}))` }} />
              <span style={{ textTransform: "capitalize" }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="wf-axis">
        <div>Span</div>
        <div className="ticks">
          {ticks.map((t, i) => (
            <span key={i} className="mono tabular">{formatDuration(t)}</span>
          ))}
        </div>
        <div style={{ textAlign: "right" }}>Duration</div>
        <div />
      </div>

      <div>
        {flat.map(({ span, depth, isLast, ancestorsLast }) => {
          const spanStart = new Date(span.startTime).getTime();
          const spanEnd = span.endTime ? new Date(span.endTime).getTime() : Date.now();
          const offset = ((spanStart - t0) / total) * 100;
          const width = ((spanEnd - spanStart) / total) * 100;
          const isSel = selected?.spanId === span.spanId;
          const type = getSpanType(span);
          const Ic = (spanIcon as any)[type] || spanIcon.default;
          const ft = span.attributes["gen_ai.time_to_first_token"]
            ? ((new Date(span.attributes["gen_ai.time_to_first_token"] as string).getTime() - spanStart) / (spanEnd - spanStart)) * 100
            : null;

          const indent = ancestorsLast.slice(1).map((al) => al ? "   " : "│  ").join("");
          const connector = depth === 0 ? "" : (ancestorsLast[ancestorsLast.length - 1] ? "└─ " : "├─ ");

          return (
            <div
              key={span.spanId}
              className={`wf-row ${isSel ? "selected" : ""}`}
              onClick={() => onSelect(isSel ? null : span)}
            >
              <div className="wf-name">
                <span className="tree-line">{indent}{connector}</span>
                <Ic size={11} style={{ color: `hsl(var(--${type === "default" ? "muted-foreground" : type}))`, flexShrink: 0 }} />
                <span className="label">{span.spanName}</span>
              </div>
              <div className="wf-track">
                <div
                  className={`wf-bar ${type}`}
                  style={{
                    left: `${Math.max(0, offset)}%`,
                    width: `${Math.max(width, 0.5)}%`,
                  }}
                >
                  {width > 8 && (
                    <span style={{ textShadow: "0 1px 2px rgb(0 0 0 / 0.3)" }}>
                      {formatDuration(spanEnd - spanStart)}
                    </span>
                  )}
                  {ft != null && (
                    <span className="first-token" style={{ left: `${ft}%` }} title="first token" />
                  )}
                </div>
              </div>
              <div className="wf-dur">{formatDuration(spanEnd - spanStart)}</div>
              <div className="wf-icon">
                {span.status === "OK"
                  ? <span style={{ color: "hsl(var(--success))", fontSize: 12 }}>✓</span>
                  : <span style={{ color: "hsl(var(--error))", fontSize: 12 }}>!</span>}
              </div>
            </div>
          );
        })}
      </div>
    </RefCard>
  );
}
