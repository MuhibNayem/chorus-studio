"use client";

import type { RagMetrics } from "@/types";

function scoreColor(v: number | undefined): string {
  if (v == null) return "hsl(var(--muted-foreground))";
  if (v >= 0.85) return "hsl(var(--success))";
  if (v >= 0.70) return "hsl(var(--warning))";
  return "hsl(var(--error))";
}

export default function RagKpiStrip({ metrics }: { metrics: RagMetrics }) {
  const prec  = scoreColor(metrics.avgContextPrecision);
  const rec   = scoreColor(metrics.avgContextRecall);
  const faith = scoreColor(metrics.avgFaithfulness > 0 ? metrics.avgFaithfulness : undefined);

  return (
    <div className="metric-rail" style={{ marginBottom: 0 }}>
      <div className="metric">
        <div className="m-lbl">Total Queries</div>
        <div className="m-val">{metrics.queryCount.toLocaleString()}</div>
        <div className="mute" style={{ fontSize: 10, fontFamily: "var(--font-mono)", marginTop: 6 }}>
          {(metrics.hitRate * 100).toFixed(0)}% cache hit
        </div>
      </div>
      <div className="metric">
        <div className="m-lbl">Precision</div>
        <div className="m-val" style={{ color: prec }}>{(metrics.avgContextPrecision * 100).toFixed(0)}<span className="unit">%</span></div>
        <div className="mute" style={{ fontSize: 10, fontFamily: "var(--font-mono)", marginTop: 6 }}>
          Chunk relevance
        </div>
      </div>
      <div className="metric">
        <div className="m-lbl">Recall</div>
        <div className="m-val" style={{ color: rec }}>{(metrics.avgContextRecall * 100).toFixed(0)}<span className="unit">%</span></div>
        <div className="mute" style={{ fontSize: 10, fontFamily: "var(--font-mono)", marginTop: 6 }}>
          Context completeness
        </div>
      </div>
      <div className="metric">
        <div className="m-lbl">Faithfulness</div>
        <div className="m-val" style={{ color: faith }}>
          {metrics.avgFaithfulness > 0 ? (metrics.avgFaithfulness * 100).toFixed(0) : "—"}
          {metrics.avgFaithfulness > 0 && <span className="unit">%</span>}
        </div>
        <div className="mute" style={{ fontSize: 10, fontFamily: "var(--font-mono)", marginTop: 6 }}>
          Answer grounded
        </div>
      </div>
    </div>
  );
}
