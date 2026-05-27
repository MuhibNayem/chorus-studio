"use client";

import { useMemo, useCallback, useState } from "react";
import {
  ReactFlow,
  Handle,
  Position,
  Controls,
  Background,
  MarkerType,
  type NodeProps,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import {
  X,
  Database,
  Cpu,
  Wrench,
  ShieldCheck,
  HelpCircle,
  Clock,
  Maximize2,
  Sparkles,
} from "lucide-react";
import type { ProvenanceEntry } from "@/types";

/* ─── Layout Constants ───────────────────────────────────── */
const NODE_WIDTH = 210;
const NODE_HEIGHT = 60;
const LEVEL_SEP = 100;
const NODE_SEP = 50;
const CANVAS_HEIGHT = 520;

/* ─── Type Helpers ───────────────────────────────────────── */
type NodeCategory = "llm" | "tool" | "rag" | "guardrail" | "default";

type NodeData = {
  entry: ProvenanceEntry;
  category: NodeCategory;
};

function classifyNode(decisionType: string): NodeCategory {
  const dt = decisionType.toLowerCase();
  if (dt.includes("llm") || dt.includes("chat") || dt.includes("plan")) return "llm";
  if (dt.includes("tool")) return "tool";
  if (dt.includes("guard")) return "guardrail";
  if (dt.includes("rag") || dt.includes("retriev")) return "rag";
  return "default";
}

/* ─── Category Theme Map ─────────────────────────────────── */
const THEMES: Record<
  NodeCategory,
  {
    label: string;
    icon: typeof Cpu;
    gradient: string;
    border: string;
    glow: string;
    text: string;
    bg: string;
    edgeColor: string;
  }
> = {
  llm: {
    label: "LLM",
    icon: Cpu,
    gradient: "linear-gradient(135deg, hsl(217 91% 62% / 0.15), hsl(217 91% 62% / 0.05))",
    border: "hsl(217 91% 62% / 0.55)",
    glow: "0 0 20px hsl(217 91% 62% / 0.2)",
    text: "hsl(217 91% 70%)",
    bg: "hsl(217 91% 62%)",
    edgeColor: "hsl(217 91% 62%)",
  },
  tool: {
    label: "Tool",
    icon: Wrench,
    gradient: "linear-gradient(135deg, hsl(142 71% 50% / 0.15), hsl(142 71% 50% / 0.05))",
    border: "hsl(142 71% 50% / 0.55)",
    glow: "0 0 20px hsl(142 71% 50% / 0.2)",
    text: "hsl(142 71% 55%)",
    bg: "hsl(142 71% 50%)",
    edgeColor: "hsl(142 71% 50%)",
  },
  rag: {
    label: "RAG",
    icon: Database,
    gradient: "linear-gradient(135deg, hsl(270 91% 68% / 0.15), hsl(270 91% 68% / 0.05))",
    border: "hsl(270 91% 68% / 0.55)",
    glow: "0 0 20px hsl(270 91% 68% / 0.2)",
    text: "hsl(270 91% 72%)",
    bg: "hsl(270 91% 68%)",
    edgeColor: "hsl(270 91% 68%)",
  },
  guardrail: {
    label: "Guard",
    icon: ShieldCheck,
    gradient: "linear-gradient(135deg, hsl(27 96% 62% / 0.15), hsl(27 96% 62% / 0.05))",
    border: "hsl(27 96% 62% / 0.55)",
    glow: "0 0 20px hsl(27 96% 62% / 0.2)",
    text: "hsl(27 96% 66%)",
    bg: "hsl(27 96% 62%)",
    edgeColor: "hsl(27 96% 62%)",
  },
  default: {
    label: "Step",
    icon: HelpCircle,
    gradient: "linear-gradient(135deg, hsl(240 5% 58% / 0.15), hsl(240 5% 58% / 0.05))",
    border: "hsl(240 5% 58% / 0.45)",
    glow: "0 0 12px hsl(240 5% 58% / 0.12)",
    text: "hsl(240 5% 68%)",
    bg: "hsl(240 5% 58%)",
    edgeColor: "hsl(240 5% 58%)",
  },
};

/* ─── Derive Clean Node Label ────────────────────────────── */
function deriveLabel(entry: ProvenanceEntry, category: NodeCategory): string {
  try {
    if (category === "rag") {
      if (entry.output) {
        const out = typeof entry.output === "string" ? JSON.parse(entry.output) : entry.output;
        if (out.documents_found !== undefined) return `RAG Query → ${out.documents_found} docs`;
      }
      return "Semantic Retrieval";
    }
    if (category === "llm") {
      if (entry.output) {
        const out = typeof entry.output === "string" ? JSON.parse(entry.output) : entry.output;
        if (out.action_required) return `Synthesize → ${out.action_required}`;
        if (out.confidence !== undefined) return `LLM Call (${(out.confidence * 100).toFixed(0)}%)`;
      }
      return "LLM Model Call";
    }
    if (category === "tool") {
      if (entry.inputState) {
        const inp = typeof entry.inputState === "string" ? JSON.parse(entry.inputState) : entry.inputState;
        if (inp.action) return inp.action;
      }
      return "Tool Execution";
    }
    if (category === "guardrail") {
      return entry.reasoning ? `Guard: ${entry.reasoning.substring(0, 28)}` : "Guardrail Check";
    }
  } catch {
    // fallthrough
  }
  return entry.decisionType || "Step";
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Custom Mermaid-Style Node
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function MermaidNode({ data }: NodeProps & { data: NodeData }) {
  const { entry, category } = data;
  const theme = THEMES[category];
  const Icon = theme.icon;
  const label = deriveLabel(entry, category);
  const latency = (entry.metadata?.latency_ms || entry.metadata?.latencyMs) as
    | string
    | number
    | undefined;

  return (
    <div className="mermaid-node" data-category={category}>
      <Handle type="target" position={Position.Left} className="mermaid-handle" />

      {/* Colored accent bar */}
      <div className="mermaid-node-accent" />

      {/* Content */}
      <div className="mermaid-node-content">
        <div className="mermaid-node-row">
          <Icon size={13} className="mermaid-node-icon" />
          <span className="mermaid-node-category">{theme.label}</span>
          {latency && (
            <span className="mermaid-node-latency">
              <Clock size={9} />
              {latency}ms
            </span>
          )}
        </div>
        <div className="mermaid-node-label">{label}</div>
      </div>

      <Handle type="source" position={Position.Right} className="mermaid-handle" />
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Dagre Layout Engine
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function layout(entries: ProvenanceEntry[]): { nodes: Node<NodeData>[]; edges: Edge[] } {
  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return { nodes: [], edges: [] };
  }

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", ranksep: LEVEL_SEP, nodesep: NODE_SEP });

  for (const e of entries) {
    if (e?.entryId) {
      g.setNode(e.entryId, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }
  }
  for (const e of entries) {
    if (e?.entryId && e.parentIds && Array.isArray(e.parentIds)) {
      for (const parentId of e.parentIds) {
        if (parentId && entries.some((x) => x?.entryId === parentId)) {
          g.setEdge(parentId, e.entryId);
        }
      }
    }
  }

  try {
    dagre.layout(g);
  } catch (err) {
    console.error("Dagre layout error", err);
  }

  const nodes: Node<NodeData>[] = entries
    .filter((e) => e?.entryId)
    .map((e) => {
      const pos = g.node(e.entryId) || { x: 0, y: 0 };
      const category = classifyNode(e.decisionType || "");
      return {
        id: e.entryId,
        type: "mermaid",
        position: {
          x: pos.x - NODE_WIDTH / 2,
          y: pos.y - NODE_HEIGHT / 2,
        },
        data: { entry: e, category },
      };
    });

  const edges: Edge[] = [];
  for (const e of entries) {
    if (e?.entryId && e.parentIds && Array.isArray(e.parentIds)) {
      for (let i = 0; i < e.parentIds.length; i++) {
        const parentId = e.parentIds[i];
        if (!parentId) continue;
        const parentNode = entries.find((x) => x?.entryId === parentId);
        if (!parentNode) continue;
        const parentCategory = classifyNode(parentNode.decisionType || "");
        const theme = THEMES[parentCategory];

        edges.push({
          id: `${parentId}->${e.entryId}${i > 0 ? `_${i}` : ""}`,
          source: parentId,
          target: e.entryId,
          type: "smoothstep",
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: theme.edgeColor,
          },
          style: {
            stroke: theme.edgeColor,
            strokeWidth: 2,
            filter: `drop-shadow(0 0 4px ${theme.edgeColor})`,
          },
        });
      }
    }
  }

  return { nodes, edges };
}

/* ─── Time Formatter ─────────────────────────────────────── */
function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Main Component
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function ProvenanceDag({ entries }: { entries: ProvenanceEntry[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => layout(entries), [entries]);
  const nodeTypes = useMemo(() => ({ mermaid: MermaidNode }), []);

  const selectedEntry =
    selectedId && Array.isArray(entries)
      ? entries.find((e) => e?.entryId === selectedId) ?? null
      : null;

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedId(node.id === selectedId ? null : node.id);
    },
    [selectedId]
  );

  const onPaneClick = useCallback(() => setSelectedId(null), []);

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return (
      <RefCard>
        <div
          className="card-pad text-center"
          style={{ padding: "48px 24px", color: "hsl(var(--muted-foreground))" }}
        >
          No provenance entries for this run. Provenance tracking requires Chorus Engine runs.
        </div>
      </RefCard>
    );
  }

  return (
    <RefCard>
      <CardHeader
        title="Execution Provenance Graph"
        sub="Interactive causal flowchart — click any node to inspect."
        right={
          <div className="flex items-center gap-2">
            <span className="ref-badge primary">
              <Sparkles size={11} className="mr-1" />
              Flowchart
            </span>
          </div>
        }
      />
      <div className="card-pad" style={{ padding: 0 }}>
        {/* ─── Legend Strip ─── */}
        <div className="mermaid-legend">
          {(Object.entries(THEMES) as [NodeCategory, (typeof THEMES)[NodeCategory]][])
            .filter(([cat]) => cat !== "default")
            .map(([cat, theme]) => {
              const Icon = theme.icon;
              return (
                <span key={cat} className="mermaid-legend-item">
                  <span className="mermaid-legend-dot" style={{ background: theme.bg }} />
                  <Icon size={11} style={{ color: theme.text }} />
                  <span>{theme.label}</span>
                </span>
              );
            })}
        </div>

        {/* ─── Graph + Detail Split ─── */}
        <div style={{ display: "flex" }}>
          <div
            className="mermaid-canvas"
            style={{ flex: selectedEntry ? "1 1 65%" : "1 1 100%", height: CANVAS_HEIGHT }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              fitView
              fitViewOptions={{ padding: 0.22 }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable
              minZoom={0.2}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Controls
                className="mermaid-controls"
                position="bottom-right"
                showInteractive={false}
              />
              <Background gap={24} size={1} color="hsl(var(--border) / 0.18)" />
            </ReactFlow>
          </div>

          {/* ─── Inspector Sidebar ─── */}
          {selectedEntry && (
            <div className="mermaid-inspector">
              <div className="mermaid-inspector-head">
                <span className="mermaid-inspector-title">
                  <Maximize2 size={12} style={{ color: "hsl(var(--primary-bright))" }} />
                  <span>Node Inspector</span>
                </span>
                <button onClick={() => setSelectedId(null)} className="mermaid-inspector-close">
                  <X size={13} />
                </button>
              </div>

              <div className="mermaid-inspector-body">
                <InspectorField label="Decision Type" value={selectedEntry.decisionType} mono bold />
                <InspectorField label="Agent" value={selectedEntry.agentId} mono muted />
                {selectedEntry.timestamp && (
                  <InspectorField label="Timestamp" value={formatTime(selectedEntry.timestamp)} mono />
                )}
                {selectedEntry.inputState && (
                  <InspectorPre label="Input Context" value={selectedEntry.inputState} />
                )}
                {selectedEntry.reasoning && (
                  <InspectorPre label="Reasoning" value={selectedEntry.reasoning} highlight />
                )}
                {selectedEntry.output && (
                  <InspectorPre label="Output" value={selectedEntry.output} />
                )}
                {selectedEntry.parentIds &&
                  Array.isArray(selectedEntry.parentIds) &&
                  selectedEntry.parentIds.length > 0 && (
                    <div className="mermaid-inspector-section">
                      <div className="mermaid-inspector-label">Causal Parents</div>
                      <div className="mermaid-inspector-tags">
                        {selectedEntry.parentIds.map((pid) => (
                          <span key={pid} className="mermaid-inspector-tag">
                            {pid && pid.length > 18 ? pid.substring(0, 16) + "…" : pid}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Mermaid-Inspired Styles
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <style jsx>{`
        /* ─── Legend ─── */
        .mermaid-legend {
          display: flex;
          gap: 22px;
          padding: 11px 20px;
          border-bottom: 1px solid hsl(var(--border) / 0.45);
          background: hsl(var(--card-elev) / 0.35);
          font-size: 11px;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
        }
        .mermaid-legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .mermaid-legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ─── Canvas ─── */
        .mermaid-canvas {
          position: relative;
          background:
            radial-gradient(ellipse 70% 50% at 50% 0%, hsl(var(--primary) / 0.04), transparent 70%),
            hsl(var(--background) / 0.35);
        }

        /* ━━━ Mermaid-style Node ━━━ */
        .mermaid-node {
          position: relative;
          display: flex;
          align-items: center;
          width: ${NODE_WIDTH}px;
          height: ${NODE_HEIGHT}px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 180ms cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        /* Glassmorphism background */
        .mermaid-node::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 12px;
          background: hsl(var(--card));
          border: 1.5px solid hsl(var(--border-bright) / 0.35);
          z-index: 0;
          transition: border-color 180ms ease, box-shadow 180ms ease;
        }
        /* Per-category styles */
        .mermaid-node[data-category="llm"]::before {
          border-color: hsl(217 91% 62% / 0.45);
          background: linear-gradient(135deg, hsl(217 91% 62% / 0.08), hsl(var(--card)));
        }
        .mermaid-node[data-category="tool"]::before {
          border-color: hsl(142 71% 50% / 0.45);
          background: linear-gradient(135deg, hsl(142 71% 50% / 0.08), hsl(var(--card)));
        }
        .mermaid-node[data-category="rag"]::before {
          border-color: hsl(270 91% 68% / 0.45);
          background: linear-gradient(135deg, hsl(270 91% 68% / 0.08), hsl(var(--card)));
        }
        .mermaid-node[data-category="guardrail"]::before {
          border-color: hsl(27 96% 62% / 0.45);
          background: linear-gradient(135deg, hsl(27 96% 62% / 0.08), hsl(var(--card)));
        }

        /* Hover glow */
        .mermaid-node:hover::before {
          border-color: hsl(var(--foreground-dim) / 0.5);
          box-shadow: 0 8px 32px -4px rgb(0 0 0 / 0.4);
        }
        .mermaid-node[data-category="llm"]:hover::before {
          border-color: hsl(217 91% 62% / 0.8);
          box-shadow: 0 0 24px hsl(217 91% 62% / 0.25), 0 8px 32px -4px rgb(0 0 0 / 0.35);
        }
        .mermaid-node[data-category="tool"]:hover::before {
          border-color: hsl(142 71% 50% / 0.8);
          box-shadow: 0 0 24px hsl(142 71% 50% / 0.25), 0 8px 32px -4px rgb(0 0 0 / 0.35);
        }
        .mermaid-node[data-category="rag"]:hover::before {
          border-color: hsl(270 91% 68% / 0.8);
          box-shadow: 0 0 24px hsl(270 91% 68% / 0.25), 0 8px 32px -4px rgb(0 0 0 / 0.35);
        }
        .mermaid-node[data-category="guardrail"]:hover::before {
          border-color: hsl(27 96% 62% / 0.8);
          box-shadow: 0 0 24px hsl(27 96% 62% / 0.25), 0 8px 32px -4px rgb(0 0 0 / 0.35);
        }

        .mermaid-node:hover {
          transform: translateY(-2px) scale(1.02);
        }

        /* Accent bar (left side) */
        .mermaid-node-accent {
          position: absolute;
          left: 0;
          top: 8px;
          bottom: 8px;
          width: 3px;
          border-radius: 0 3px 3px 0;
          z-index: 1;
          opacity: 0.85;
        }
        .mermaid-node[data-category="llm"] .mermaid-node-accent { background: hsl(217 91% 62%); }
        .mermaid-node[data-category="tool"] .mermaid-node-accent { background: hsl(142 71% 50%); }
        .mermaid-node[data-category="rag"] .mermaid-node-accent { background: hsl(270 91% 68%); }
        .mermaid-node[data-category="guardrail"] .mermaid-node-accent { background: hsl(27 96% 62%); }
        .mermaid-node[data-category="default"] .mermaid-node-accent { background: hsl(var(--border-bright)); }

        /* Content wrapper */
        .mermaid-node-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px 14px 10px 14px;
          width: 100%;
        }

        /* Top row: icon + category + latency */
        .mermaid-node-row {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .mermaid-node-icon {
          flex-shrink: 0;
        }
        .mermaid-node[data-category="llm"] .mermaid-node-icon { color: hsl(217 91% 70%); }
        .mermaid-node[data-category="tool"] .mermaid-node-icon { color: hsl(142 71% 55%); }
        .mermaid-node[data-category="rag"] .mermaid-node-icon { color: hsl(270 91% 72%); }
        .mermaid-node[data-category="guardrail"] .mermaid-node-icon { color: hsl(27 96% 66%); }
        .mermaid-node[data-category="default"] .mermaid-node-icon { color: hsl(var(--muted-foreground)); }

        .mermaid-node-category {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
          color: hsl(var(--muted-foreground));
          flex: 1;
        }
        .mermaid-node-latency {
          display: flex;
          align-items: center;
          gap: 2px;
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 600;
          color: hsl(var(--muted-foreground) / 0.8);
          background: hsl(var(--muted) / 0.35);
          padding: 1px 5px;
          border-radius: 4px;
        }

        /* Main label */
        .mermaid-node-label {
          font-size: 12px;
          font-weight: 600;
          color: hsl(var(--foreground));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: -0.01em;
          line-height: 1.3;
        }

        /* Handles — small elegant dots */
        .mermaid-handle {
          width: 8px !important;
          height: 8px !important;
          border: 2px solid hsl(var(--border-bright)) !important;
          background: hsl(var(--card)) !important;
          box-shadow: 0 0 0 2px hsl(var(--background)) !important;
          transition: all 140ms ease !important;
        }
        .mermaid-node:hover .mermaid-handle {
          border-color: hsl(var(--foreground-dim)) !important;
          transform: scale(1.15);
        }

        /* ─── Controls ─── */
        .mermaid-controls {
          background: hsl(var(--card)) !important;
          border: 1px solid hsl(var(--border) / 0.4) !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 24px -8px rgb(0 0 0 / 0.5) !important;
          overflow: hidden !important;
        }
        .mermaid-controls button {
          background: transparent !important;
          border: 0 !important;
          color: hsl(var(--muted-foreground)) !important;
          fill: hsl(var(--muted-foreground)) !important;
        }
        .mermaid-controls button:hover {
          background: hsl(var(--muted) / 0.5) !important;
          color: hsl(var(--foreground)) !important;
        }

        /* ─── Inspector Sidebar ─── */
        .mermaid-inspector {
          width: 320px;
          flex-shrink: 0;
          border-left: 1px solid hsl(var(--border));
          background: hsl(var(--card-elev));
          display: flex;
          flex-direction: column;
          height: ${CANVAS_HEIGHT}px;
          overflow-y: auto;
          animation: inspectorSlideIn 160ms cubic-bezier(0, 0, 0.2, 1);
        }
        @keyframes inspectorSlideIn {
          from { transform: translateX(10px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .mermaid-inspector-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid hsl(var(--border));
          position: sticky;
          top: 0;
          background: hsl(var(--card-elev));
          z-index: 10;
        }
        .mermaid-inspector-title {
          font-size: 12px;
          font-weight: 600;
          color: hsl(var(--foreground));
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .mermaid-inspector-close {
          display: grid;
          place-items: center;
          width: 24px;
          height: 24px;
          border-radius: 5px;
          color: hsl(var(--muted-foreground));
          cursor: pointer;
          transition: background 100ms ease;
        }
        .mermaid-inspector-close:hover {
          background: hsl(var(--muted) / 0.5);
          color: hsl(var(--foreground));
        }
        .mermaid-inspector-body {
          flex: 1;
        }
        .mermaid-inspector-section {
          padding: 12px 16px;
          border-bottom: 1px solid hsl(var(--border) / 0.5);
        }
        .mermaid-inspector-section:last-child {
          border-bottom: 0;
        }
        .mermaid-inspector-label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
          color: hsl(var(--muted-foreground));
          margin-bottom: 5px;
        }
        .mermaid-inspector-value {
          font-size: 12px;
          color: hsl(var(--foreground));
          line-height: 1.4;
        }
        .mermaid-inspector-value.mono {
          font-family: var(--font-mono);
        }
        .mermaid-inspector-value.bold {
          font-weight: 600;
        }
        .mermaid-inspector-value.muted {
          color: hsl(var(--muted-foreground));
        }
        .mermaid-inspector-pre {
          font-family: var(--font-mono);
          font-size: 10.5px;
          line-height: 1.5;
          padding: 8px 10px;
          background: hsl(var(--background) / 0.7);
          border-radius: 6px;
          border: 1px solid hsl(var(--border) / 0.5);
          color: hsl(var(--foreground-dim));
          white-space: pre-wrap;
          word-break: break-word;
          max-height: 140px;
          overflow-y: auto;
          margin: 0;
        }
        .mermaid-inspector-pre.highlight {
          border-color: hsl(var(--primary) / 0.3);
          background: hsl(var(--primary) / 0.03);
          color: hsl(var(--foreground));
        }
        .mermaid-inspector-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .mermaid-inspector-tag {
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 2px 6px;
          background: hsl(var(--muted) / 0.55);
          border: 1px solid hsl(var(--border) / 0.5);
          border-radius: 4px;
          color: hsl(var(--foreground-dim));
        }
      `}</style>
    </RefCard>
  );
}

/* ─── Inspector Helper Components ────────────────────────── */
function InspectorField({
  label,
  value,
  mono,
  bold,
  muted,
}: {
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
  muted?: boolean;
}) {
  const classes = [
    "mermaid-inspector-value",
    mono && "mono",
    bold && "bold",
    muted && "muted",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mermaid-inspector-section">
      <div className="mermaid-inspector-label">{label}</div>
      <div className={classes}>{value}</div>
    </div>
  );
}

function InspectorPre({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="mermaid-inspector-section">
      <div className="mermaid-inspector-label">{label}</div>
      <pre className={`mermaid-inspector-pre${highlight ? " highlight" : ""}`}>{value}</pre>
    </div>
  );
}
