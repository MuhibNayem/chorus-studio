"use client";

import Sparkline from "@/components/primitives/Sparkline";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricItem {
  lbl: string;
  val: string;
  unit?: string;
  delta?: number;
  spark: number[];
  color: string;
  fill: string;
}

export default function MetricRail({ items }: { items: MetricItem[] }) {
  return (
    <div className="metric-rail">
      {items.map((it, i) => {
        const hasDelta = it.delta !== undefined && it.delta !== null;
        const isUp = hasDelta && it.delta! > 0;
        const goodWhenUp = i < 2;
        const goodColor = (isUp && goodWhenUp) || (!isUp && !goodWhenUp);
        return (
          <div className="metric" key={i}>
            <div className="m-lbl">{it.lbl}</div>
            <div className="m-val">
              {it.val}
              {it.unit && <span className="unit">{it.unit}</span>}
            </div>
            {hasDelta ? (
              <div className={`m-delta ${goodColor ? "up" : "dn"}`}>
                {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {isUp ? "+" : ""}{it.delta}%
              </div>
            ) : (
              <div className="m-delta" style={{ opacity: 0.3 }}>—</div>
            )}
            <div className="m-spark">
              <Sparkline data={it.spark} color={it.color} fill={it.fill} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
