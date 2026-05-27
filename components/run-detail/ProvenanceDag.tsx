"use client";

import { useMemo, useCallback, useState } from "react";
import {
  ReactFlow,
  Handle,
  Position,
  Controls,
  Background,
  type NodeProps,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import RefBadge from "@/components/primitives/RefBadge";
import { X } from "lucide-react";
import type { ProvenanceEntry } from "@/types";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 64;
const LEVEL_SEP = 80;
const NODE_SEP = 50;
const MIN_HEIGHT = 320;

type NodeData = { label: string; meta: string; badgeType: string; timestamp: string };

function getType(decisionType: string): string {
  const dt = decisionType.toLowerCase();
  if (dt.includes("llm") || dt.includes("chat") || dt.includes("plan")) return "llm";
  if (dt.includes("tool")) return "tool";
  if (dt.includes("guard")) return "guardrail";
  if (dt.includes("rag") || dt.includes("retriev")) return "rag";
  return "default";
}

function ProvenanceNode({ data }: NodeProps & { data: NodeData }) {
  return (
    <>
      <Handle type="target" position={Position.Left} className="dag-handle" />
      <div className={`dag-flow-node dag-flow-${data.badgeType}`}>
        <span className="dag-flow-dot" />
        <div className="dag-flow-body">
          <div className="dag-flow-label">{data.label}</div>
          <div className="dag-flow-meta">{data.meta}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="dag-handle" />
    </>
  );
}

function layout(
  entries: ProvenanceEntry[]
): { nodes: Node<NodeData>[]; edges: Edge[] } {
  if (!entries || !Array.isArray(entries)) {
    return { nodes: [], edges: [] };
  }

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", ranksep: LEVEL_SEP, nodesep: NODE_SEP });

  for (const e of entries) {
    if (e && e.entryId) {
      g.setNode(e.entryId, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }
  }
  for (const e of entries) {
    if (e && e.entryId && e.parentIds && Array.isArray(e.parentIds)) {
      for (const parentId of e.parentIds) {
        if (parentId && entries.some((x) => x && x.entryId === parentId)) {
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
    .filter((e) => e && e.entryId)
    .map((e) => {
      const pos = g.node(e.entryId) || { x: 0, y: 0, width: NODE_WIDTH, height: NODE_HEIGHT };
      const dt = e.decisionType || "";
      const shortLabel = dt.length > 22 ? dt.substring(0, 20) + ".." : dt;
      return {
        id: e.entryId,
        type: "provenance",
        position: {
          x: pos.x - (pos.width || NODE_WIDTH) / 2,
          y: pos.y - (pos.height || NODE_HEIGHT) / 2,
        },
        data: {
          label: shortLabel,
          meta: e.agentId || "",
          badgeType: getType(dt),
          timestamp: e.timestamp || "",
        },
      };
    });

  const edges: Edge[] = [];
  for (const e of entries) {
    if (e && e.entryId && e.parentIds && Array.isArray(e.parentIds)) {
      for (let i = 0; i < e.parentIds.length; i++) {
        const parentId = e.parentIds[i];
        if (!parentId) continue;
        if (!entries.some((x) => x && x.entryId === parentId)) continue;
        edges.push({
          id: `${parentId}->${e.entryId}${i > 0 ? `_${i}` : ""}`,
          source: parentId,
          target: e.entryId,
          type: "smoothstep",
          animated: false,
          style: {
            stroke: "hsl(var(--muted-foreground) / 0.5)",
            strokeWidth: 1.5,
          },
        });
      }
    }
  }

  return { nodes, edges };
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function ProvenanceDag({ entries }: { entries: ProvenanceEntry[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => layout(entries), [entries]);
  const nodeTypes = useMemo(() => ({ provenance: ProvenanceNode }), []);

  const selectedEntry = selectedId && Array.isArray(entries) ? entries.find((e) => e && e.entryId === selectedId) ?? null : null;

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedId(node.id === selectedId ? null : node.id);
    },
    [selectedId]
  );

  const onPaneClick = useCallback(() => setSelectedId(null), []);

  const canvasHeight = Math.max(
    MIN_HEIGHT,
    Math.max(...nodes.map((n) => n.position.y), 0) + NODE_HEIGHT + 60
  );

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return (
      <RefCard>
        <div
          className="card-pad text-center"
          style={{ padding: "48px 24px", color: "hsl(var(--muted-foreground))" }}
        >
          No provenance entries for this run. Provenance tracking requires Chorus Engine
          runs.
        </div>
      </RefCard>
    );
  }

  return (
    <RefCard>
      <CardHeader
        title="Provenance"
        sub="Causal decision graph from Chorus Engine"
        right={<RefBadge variant="primary">chorus-engine4j</RefBadge>}
      />
      <div className="card-pad" style={{ padding: 0 }}>
        <div className="dag-legend">
          <span className="dag-legend-item">
            <span className="dag-legend-swatch dag-legend-llm" />
            LLM
          </span>
          <span className="dag-legend-item">
            <span className="dag-legend-swatch dag-legend-tool" />
            Tool
          </span>
          <span className="dag-legend-item">
            <span className="dag-legend-swatch dag-legend-rag" />
            RAG
          </span>
          <span className="dag-legend-item">
            <span className="dag-legend-swatch dag-legend-guardrail" />
            Guardrail
          </span>
          <span className="dag-legend-item">
            <span className="dag-legend-swatch dag-legend-default" />
            Default
          </span>
        </div>

        <div style={{ display: "flex" }}>
          <div
            style={{ flex: selectedEntry ? "1 1 65%" : "1 1 100%", height: canvasHeight, position: "relative" }}
            className="dag-flow-wrapper"
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              minZoom={0.3}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Controls
                className="dag-flow-controls"
                position="bottom-right"
                showInteractive={false}
              />
              <Background
                gap={20}
                size={1}
                color="hsl(var(--border) / 0.4)"
              />
            </ReactFlow>
          </div>

          {selectedEntry && (
            <div className="dag-detail-panel">
              <div className="dag-detail-head">
                <span className="dag-detail-title">Node detail</span>
                <button onClick={() => setSelectedId(null)} className="dag-detail-close">
                  <X size={14} />
                </button>
              </div>

              <div className="dag-detail-section">
                <div className="dag-detail-label">Decision type</div>
                <div className="dag-detail-value mono">{selectedEntry.decisionType}</div>
              </div>

              <div className="dag-detail-section">
                <div className="dag-detail-label">Agent</div>
                <div className="dag-detail-value mono">{selectedEntry.agentId}</div>
              </div>

              <div className="dag-detail-section">
                <div className="dag-detail-label">Run</div>
                <div className="dag-detail-value mono" style={{ fontSize: 11 }}>
                  {selectedEntry.runId}
                </div>
              </div>

              {selectedEntry.timestamp && (
                <div className="dag-detail-section">
                  <div className="dag-detail-label">Timestamp</div>
                  <div className="dag-detail-value" style={{ fontSize: 11 }}>
                    {formatTime(selectedEntry.timestamp)}
                  </div>
                </div>
              )}

              {selectedEntry.inputState && (
                <div className="dag-detail-section">
                  <div className="dag-detail-label">Input state</div>
                  <pre className="dag-detail-pre">{selectedEntry.inputState}</pre>
                </div>
              )}

              {selectedEntry.reasoning && (
                <div className="dag-detail-section">
                  <div className="dag-detail-label">Reasoning</div>
                  <pre className="dag-detail-pre">{selectedEntry.reasoning}</pre>
                </div>
              )}

              {selectedEntry.output && (
                <div className="dag-detail-section">
                  <div className="dag-detail-label">Output</div>
                  <pre className="dag-detail-pre">{selectedEntry.output}</pre>
                </div>
              )}

              {selectedEntry && selectedEntry.parentIds && Array.isArray(selectedEntry.parentIds) && selectedEntry.parentIds.length > 0 && (
                <div className="dag-detail-section">
                  <div className="dag-detail-label">Parents</div>
                  <div className="dag-detail-tags">
                    {selectedEntry.parentIds.map((pid) => (
                      <span key={pid} className="dag-detail-tag">
                        {pid && pid.length > 18 ? pid.substring(0, 16) + ".." : pid}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dag-legend {
          display: flex;
          gap: 16px;
          padding: 10px 18px;
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--card-elev) / 0.6);
          font-size: 11px;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
        }
        .dag-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dag-legend-swatch {
          width: 9px;
          height: 9px;
          border-radius: 2px;
        }
        .dag-legend-llm {
          background: hsl(var(--llm));
        }
        .dag-legend-tool {
          background: hsl(var(--tool));
        }
        .dag-legend-rag {
          background: hsl(var(--rag));
        }
        .dag-legend-guardrail {
          background: hsl(var(--guardrail));
        }
        .dag-legend-default {
          background: hsl(var(--border-bright));
        }

        .dag-flow-wrapper {
          background: hsl(var(--background) / 0.4);
        }

        .dag-flow-node {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 12px;
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border-bright));
          border-radius: 0.375rem;
          font-family: var(--font-mono);
          font-size: 11.5px;
          box-shadow: 0 4px 12px -2px rgb(0 0 0 / 0.4);
          transition: border-color 120ms ease, box-shadow 120ms ease;
          cursor: pointer;
          width: 100%;
          height: 100%;
        }
        .dag-flow-node:hover {
          box-shadow: 0 12px 28px -6px rgb(0 0 0 / 0.5);
        }
        .dag-flow-llm {
          border-color: hsl(var(--llm) / 0.55);
        }
        .dag-flow-tool {
          border-color: hsl(var(--tool) / 0.55);
        }
        .dag-flow-rag {
          border-color: hsl(var(--rag) / 0.55);
        }
        .dag-flow-guardrail {
          border-color: hsl(var(--guardrail) / 0.55);
        }
        .dag-flow-default {
          border-color: hsl(var(--border-bright));
        }
        .dag-flow-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .dag-flow-llm .dag-flow-dot {
          background: hsl(var(--llm));
        }
        .dag-flow-tool .dag-flow-dot {
          background: hsl(var(--tool));
        }
        .dag-flow-rag .dag-flow-dot {
          background: hsl(var(--rag));
        }
        .dag-flow-guardrail .dag-flow-dot {
          background: hsl(var(--guardrail));
        }
        .dag-flow-default .dag-flow-dot {
          background: hsl(var(--border-bright));
        }
        .dag-flow-body {
          min-width: 0;
          flex: 1;
        }
        .dag-flow-label {
          font-weight: 500;
          color: hsl(var(--foreground));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: -0.01em;
        }
        .dag-flow-meta {
          font-size: 9.5px;
          color: hsl(var(--muted-foreground));
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dag-handle {
          width: 6px !important;
          height: 6px !important;
          border: 1px solid hsl(var(--border-bright)) !important;
          background: hsl(var(--card)) !important;
          border-radius: 50% !important;
        }

        .dag-flow-controls {
          background: hsl(var(--card)) !important;
          border: 1px solid hsl(var(--border)/0.35) !important;
          border-radius: 0.375rem !important;
          box-shadow: 0 8px 24px -8px rgb(0 0 0 / 0.5) !important;
          bottom: 10px !important;
          right: 10px !important;
        }
        .dag-flow-controls button {
          background: transparent !important;
          border: 0 !important;
          color: hsl(var(--muted-foreground)) !important;
          fill: hsl(var(--muted-foreground)) !important;
        }
        .dag-flow-controls button:hover {
          background: hsl(var(--muted) / 0.5) !important;
          color: hsl(var(--foreground)) !important;
          fill: hsl(var(--foreground)) !important;
        }

        .dag-detail-panel {
          width: 280px;
          flex-shrink: 0;
          border-left: 1px solid hsl(var(--border));
          background: hsl(var(--card-elev));
          display: flex;
          flex-direction: column;
          max-height: 420px;
          overflow-y: auto;
        }
        .dag-detail-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-bottom: 1px solid hsl(var(--border));
          position: sticky;
          top: 0;
          background: hsl(var(--card-elev));
          z-index: 1;
        }
        .dag-detail-title {
          font-size: 12px;
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        .dag-detail-close {
          display: grid;
          place-items: center;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          color: hsl(var(--muted-foreground));
          cursor: pointer;
          transition: background 100ms ease;
        }
        .dag-detail-close:hover {
          background: hsl(var(--muted) / 0.5);
          color: hsl(var(--foreground));
        }
        .dag-detail-section {
          padding: 10px 14px;
          border-bottom: 1px solid hsl(var(--border) / 0.6);
        }
        .dag-detail-section:last-child {
          border-bottom: 0;
        }
        .dag-detail-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          margin-bottom: 4px;
        }
        .dag-detail-value {
          font-size: 12px;
          color: hsl(var(--foreground));
          line-height: 1.4;
        }
        .dag-detail-pre {
          font-family: var(--font-mono);
          font-size: 10.5px;
          line-height: 1.5;
          padding: 8px 10px;
          background: hsl(var(--background) / 0.6);
          border-radius: 4px;
          border: 1px solid hsl(var(--border) / 0.5);
          color: hsl(var(--foreground-dim));
          white-space: pre-wrap;
          word-break: break-word;
          max-height: 120px;
          overflow-y: auto;
          margin: 0;
        }
        .dag-detail-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .dag-detail-tag {
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 2px 6px;
          background: hsl(var(--muted) / 0.5);
          border: 1px solid hsl(var(--border) / 0.5);
          border-radius: 3px;
          color: hsl(var(--foreground-dim));
        }
      `}</style>
    </RefCard>
  );
}
