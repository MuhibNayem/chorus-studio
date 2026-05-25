"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProvenanceEntry } from "@/types";

export default function ProvenanceDag({ entries }: { entries: ProvenanceEntry[] }) {
  const nodes = useMemo(() => {
    return entries.map((e) => ({
      id: e.entryId,
      label: e.decisionType,
      agentId: e.agentId,
      input: e.inputState,
      output: e.output,
      timestamp: e.timestamp,
      parentIds: e.parentIds,
    }));
  }, [entries]);

  const edges = useMemo(() => {
    const result: { from: string; to: string }[] = [];
    for (const entry of entries) {
      for (const parentId of entry.parentIds) {
        result.push({ from: parentId, to: entry.entryId });
      }
    }
    return result;
  }, [entries]);

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No provenance entries for this run. Provenance tracking requires Chorus Engine runs.
        </CardContent>
      </Card>
    );
  }

  // Simple hierarchical layout
  const levels = new Map<string, number>();
  function assignLevel(id: string, level: number) {
    const current = levels.get(id) ?? 0;
    if (level > current) {
      levels.set(id, level);
      const children = edges.filter((e) => e.from === id).map((e) => e.to);
      for (const child of children) assignLevel(child, level + 1);
    }
  }

  const roots = nodes.filter((n) => !edges.some((e) => e.to === n.id));
  for (const root of roots) assignLevel(root.id, 0);
  for (const node of nodes) if (!levels.has(node.id)) assignLevel(node.id, 0);

  const maxLevel = Math.max(...levels.values(), 0);
  const levelWidth = 100 / (maxLevel + 1);

  const levelNodes = new Map<number, typeof nodes>();
  for (const node of nodes) {
    const lvl = levels.get(node.id) ?? 0;
    if (!levelNodes.has(lvl)) levelNodes.set(lvl, []);
    levelNodes.get(lvl)!.push(node);
  }

  const canvasHeight = Math.max(nodes.length * 80, 400);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Causal Provenance DAG</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-auto" style={{ minHeight: 400, height: canvasHeight }}>
          <svg width="100%" height={canvasHeight} className="absolute inset-0">
            {/* Edges */}
            {edges.map((edge, i) => {
              const fromNode = nodes.find((n) => n.id === edge.from);
              const toNode = nodes.find((n) => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              const fromLvl = levels.get(fromNode.id) ?? 0;
              const toLvl = levels.get(toNode.id) ?? 0;
              const fromIdx = levelNodes.get(fromLvl)!.findIndex((n) => n.id === fromNode.id);
              const toIdx = levelNodes.get(toLvl)!.findIndex((n) => n.id === toNode.id);

              const fromX = (fromLvl + 0.5) * levelWidth;
              const fromHeight = canvasHeight / Math.max(levelNodes.get(fromLvl)!.length, 1);
              const fromY = (fromIdx + 0.5) * fromHeight;

              const toX = (toLvl + 0.5) * levelWidth;
              const toHeight = canvasHeight / Math.max(levelNodes.get(toLvl)!.length, 1);
              const toY = (toIdx + 0.5) * toHeight;

              return (
                <line
                  key={i}
                  x1={`${fromX}%`}
                  y1={fromY}
                  x2={`${toX}%`}
                  y2={toY}
                  stroke="hsl(var(--muted-foreground) / 0.45)"
                  strokeWidth={1.5}
                  markerEnd="url(#arrow)"
                />
              );
            })}
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="hsl(var(--muted-foreground) / 0.45)" />
              </marker>
            </defs>
          </svg>

          {/* Nodes */}
          <div className="relative w-full h-full">
            {Array.from(levelNodes.entries()).map(([lvl, ns]) =>
              ns.map((node, idx) => {
                const cellHeight = canvasHeight / Math.max(ns.length, 1);
                const nodeTop = idx * cellHeight + (cellHeight - 80) / 2;
                return (
                  <div
                    key={node.id}
                    className="absolute"
                    style={{
                      left: `${lvl * levelWidth}%`,
                      width: `${levelWidth}%`,
                      top: `${nodeTop}px`,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <div className="bg-card border rounded-lg p-3 shadow-sm w-48 hover:shadow-md transition-shadow relative z-10">
                      <p className="text-[11px] font-semibold text-primary truncate" title={node.label}>{node.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate" title={node.agentId}>{node.agentId}</p>
                      {node.output && (
                        <p className="text-[10px] text-muted-foreground mt-1 truncate" title={node.output}>{node.output}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
