"use client";

import { useMemo } from "react";

function generateTicks() {
  return Array.from({ length: 80 }, (_, i) => {
    const r = Math.random();
    if (i > 76 && r < 0.6) return "r";
    if (r < 0.045) return "e";
    return "s";
  });
}

export default function TickStrip() {
  const ticks = useMemo(() => generateTicks(), []);

  return (
    <div className="tick-strip">
      <div className="lbl">
        <span className="live-dot" />
        LIVE · LAST 80 RUNS
      </div>
      <div className="tick-row">
        {ticks.map((t, i) => (
          <div
            key={i}
            className={`tick ${t}`}
            style={{ width: 4, opacity: 0.55 + (i / ticks.length) * 0.45 }}
            title={t === "s" ? "success" : t === "e" ? "error" : "running"}
          />
        ))}
      </div>
      <div className="meta tabular">
        <span><b>847</b>/min</span>
        <span>err <b>0.4%</b></span>
        <span>p95 <b>2.4s</b></span>
      </div>
    </div>
  );
}
