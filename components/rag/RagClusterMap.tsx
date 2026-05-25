"use client";

import type { RagCluster } from "@/types";

const CLUSTER_COLORS: { dot: string; border: string; bg: string; text: string }[] = [
  { dot: "hsl(var(--llm))",      border: "hsl(var(--llm)/0.4)",      bg: "hsl(var(--llm)/0.06)",      text: "hsl(var(--llm))" },
  { dot: "hsl(var(--rag))",      border: "hsl(var(--rag)/0.4)",      bg: "hsl(var(--rag)/0.06)",      text: "hsl(var(--rag))" },
  { dot: "hsl(var(--tool))",     border: "hsl(var(--tool)/0.4)",     bg: "hsl(var(--tool)/0.06)",     text: "hsl(var(--tool))" },
  { dot: "hsl(var(--warning))",  border: "hsl(var(--warning)/0.4)",  bg: "hsl(var(--warning)/0.06)",  text: "hsl(var(--warning))" },
  { dot: "hsl(var(--error))",    border: "hsl(var(--error)/0.4)",    bg: "hsl(var(--error)/0.06)",    text: "hsl(var(--error))" },
  { dot: "hsl(var(--primary-bright))", border: "hsl(var(--primary)/0.4)", bg: "hsl(var(--primary)/0.06)", text: "hsl(var(--primary-bright))" },
  { dot: "hsl(var(--guardrail))", border: "hsl(var(--guardrail)/0.4)", bg: "hsl(var(--guardrail)/0.06)", text: "hsl(var(--guardrail))" },
  { dot: "hsl(var(--success))",  border: "hsl(var(--success)/0.4)",  bg: "hsl(var(--success)/0.06)",  text: "hsl(var(--success))" },
];

export default function RagClusterMap({
  clusters,
  onSelect,
  selected,
}: {
  clusters: RagCluster[];
  onSelect?: (cluster: RagCluster) => void;
  selected?: string | null;
}) {
  if (clusters.length === 0) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: 192, color: "hsl(var(--muted-foreground))", fontSize: 11.5,
        fontFamily: "var(--font-mono)",
      }}>
        No cluster data — embeddings computing…
      </div>
    );
  }

  const realClusters  = clusters.filter(c => c.clusterId !== "noise");
  const noiseClusters = clusters.filter(c => c.clusterId === "noise");
  const maxCount = Math.max(...clusters.map(c => c.totalQueryCount), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {realClusters.map((cluster, idx) => {
          const palette = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
          const sizePct = Math.max(12, Math.round((cluster.totalQueryCount / maxCount) * 100));
          const isSelected = selected === cluster.clusterId;
          return (
            <button
              key={cluster.clusterId}
              onClick={() => onSelect?.(cluster)}
              style={{
                fontFamily: "var(--font-mono)",
                textAlign: "left",
                border: `1px solid ${palette.border}`,
                borderRadius: "0.5rem",
                background: isSelected ? palette.bg : "hsl(var(--card))",
                padding: "10px 14px",
                minWidth: `${Math.max(140, sizePct * 2)}px`,
                flex: "0 1 auto",
                transition: "background 120ms ease, box-shadow 120ms ease",
                cursor: "pointer",
                boxShadow: isSelected ? `0 0 0 1px ${palette.border}` : undefined,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{
                  width: 9, height: 9, borderRadius: "50%",
                  background: palette.dot, flexShrink: 0,
                }} />
                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, color: palette.text }}>
                  {cluster.label}
                </span>
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "hsl(var(--foreground))", lineHeight: 1.35, marginBottom: 4, maxWidth: 200 }}>
                {cluster.representativeQuery.length > 60
                  ? cluster.representativeQuery.substring(0, 58) + "…"
                  : cluster.representativeQuery}
              </div>
              <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}>
                {cluster.memberCount} unique · {cluster.totalQueryCount.toLocaleString()} total
              </div>
            </button>
          );
        })}
      </div>

      {noiseClusters.map(noise => (
        <div key={noise.clusterId} style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)", paddingLeft: 4 }}>
          {noise.memberCount} unclustered queries
        </div>
      ))}
    </div>
  );
}
