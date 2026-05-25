"use client";

import { AlertTriangle, AlertOctagon, CheckCircle } from "lucide-react";
import type { RagDriftSnapshot } from "@/types";

interface Props {
  snapshots: RagDriftSnapshot[];
}

export default function RagDriftBanner({ snapshots }: Props) {
  const critical = snapshots.filter(s => s.alert_level === "critical");
  const warnings = snapshots.filter(s => s.alert_level === "warning");

  if (critical.length === 0 && warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-md border border-green-500/20 bg-green-500/5 text-green-500 mono text-xs">
        <CheckCircle size={13} className="shrink-0" />
        <span>No embedding drift detected across {snapshots.filter(s=>s.alert_level==="none").length} collection snapshots</span>
      </div>
    );
  }

  const topAlerts = [...critical, ...warnings].slice(0, 3);

  return (
    <div className="flex flex-col gap-1.5">
      {topAlerts.map(s => (
        <div
          key={s.snapshot_id}
          className={`flex items-start gap-2.5 px-4 py-2.5 rounded-md border mono text-xs ${
            s.alert_level === "critical"
              ? "border-red-500/20 bg-red-500/5 text-red-400"
              : "border-yellow-500/20 bg-yellow-500/5 text-yellow-400"
          }`}
        >
          {s.alert_level === "critical"
            ? <AlertOctagon size={13} className="shrink-0 mt-0.5" />
            : <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          }
          <div className="flex-1 min-w-0">
            <span className="font-semibold">
              {s.alert_level === "critical" ? "Critical" : "Warning"} drift
            </span>
            {" — "}
            <span className="opacity-90">{s.collection}</span>
            {": "}
            cosine shift {(s.mean_cosine_shift * 100).toFixed(1)}%
            {s.precision_delta !== 0 && (
              <span className={s.precision_delta < 0 ? "text-red-400" : "text-green-400"}>
                {" "}· precision {s.precision_delta > 0 ? "+" : ""}{(s.precision_delta * 100).toFixed(1)}%
              </span>
            )}
          </div>
          <span className="text-[10px] opacity-60 shrink-0">
            {new Date(s.period_end).toLocaleDateString()}
          </span>
        </div>
      ))}
      {critical.length + warnings.length > 3 && (
        <div className="text-[11px] text-muted-foreground mono px-1">
          +{critical.length + warnings.length - 3} more drift events
        </div>
      )}
    </div>
  );
}
