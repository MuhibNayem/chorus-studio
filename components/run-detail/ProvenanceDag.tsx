"use client";

import { useMemo } from "react";
import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import RefBadge from "@/components/primitives/RefBadge";
import type { ProvenanceEntry } from "@/types";

export default function ProvenanceDag({ entries }: { entries: ProvenanceEntry[] }) {
  const nodes = useMemo(() => {
    const byIdMap = Object.fromEntries(entries.map(e => [e.entryId, e]));
    const levels: Record<string, number> = {};
    
    function getLevel(id: string): number {
      if (id in levels) return levels[id];
      const entry = byIdMap[id];
      if (!entry || !entry.parentIds || entry.parentIds.length === 0) {
        levels[id] = 0;
        return 0;
      }
      let maxParentLvl = 0;
      for (const pid of entry.parentIds) {
        maxParentLvl = Math.max(maxParentLvl, getLevel(pid));
      }
      levels[id] = maxParentLvl + 1;
      return levels[id];
    }
    
    for (const entry of entries) {
      getLevel(entry.entryId);
    }
    
    const nodesByLevel: Record<number, string[]> = {};
    for (const entry of entries) {
      const lvl = levels[entry.entryId] ?? 0;
      if (!nodesByLevel[lvl]) nodesByLevel[lvl] = [];
      nodesByLevel[lvl].push(entry.entryId);
    }
    
    return entries.map((e) => {
      const lvl = levels[e.entryId] ?? 0;
      const idx = nodesByLevel[lvl].indexOf(e.entryId);
      const levelCount = nodesByLevel[lvl].length;
      
      const x = 40 + lvl * 220;
      const totalHeight = 280;
      const spacing = 70;
      const startY = (totalHeight - (levelCount * 36 + (levelCount - 1) * (spacing - 36))) / 2;
      const y = Math.max(20, startY + idx * spacing);
      
      return {
        id: e.entryId,
        label: e.decisionType,
        type: getType(e.decisionType),
        x,
        y,
        meta: e.agentId,
      };
    });
  }, [entries]);

  const edges = useMemo(() => {
    const result: [string, string][] = [];
    for (const entry of entries) {
      for (const parentId of entry.parentIds) {
        result.push([parentId, entry.entryId]);
      }
    }
    return result;
  }, [entries]);

  if (entries.length === 0) {
    return (
      <RefCard>
        <div className="card-pad text-center" style={{ padding: "48px 24px", color: "hsl(var(--muted-foreground))" }}>
          No provenance entries for this run. Provenance tracking requires Chorus Engine runs.
        </div>
      </RefCard>
    );
  }

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <RefCard>
      <CardHeader title="Provenance" sub="Causal decision graph from Chorus Engine"
        right={<RefBadge variant="primary">chorus-engine4j</RefBadge>}
      />
      <div className="card-pad">
        <div className="dag-canvas">
          <svg viewBox="0 0 800 280" preserveAspectRatio="none" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill="hsl(var(--muted-foreground) / 0.6)" />
              </marker>
            </defs>
            {edges.map(([a, b], i) => {
              const A = byId[a], B = byId[b];
              if (!A || !B) return null;
              const x1 = A.x + 120, y1 = A.y + 18;
              const x2 = B.x, y2 = B.y + 18;
              const mx = (x1 + x2) / 2;
              return (
                <path key={i}
                  d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2 - 6},${y2}`}
                  stroke="hsl(var(--muted-foreground) / 0.55)"
                  strokeWidth="1.4"
                  fill="none"
                  markerEnd="url(#arrow)"
                  strokeDasharray={i === 4 ? "3 3" : "none"}
                />
              );
            })}
          </svg>
          {nodes.map((n) => (
            <div key={n.id} className={`dag-node ${n.type}`}
              style={{ left: n.x, top: n.y, width: 120 }}>
              <span className="ndot" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.label}</div>
                <div className="meta">{n.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </RefCard>
  );
}

function getType(decisionType: string): string {
  const dt = decisionType.toLowerCase();
  if (dt.includes("llm") || dt.includes("chat") || dt.includes("plan")) return "llm";
  if (dt.includes("tool")) return "tool";
  if (dt.includes("guard")) return "guardrail";
  if (dt.includes("rag") || dt.includes("retriev")) return "rag";
  return "default";
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
