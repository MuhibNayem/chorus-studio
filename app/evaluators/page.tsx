"use client";

import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import RefBadge from "@/components/primitives/RefBadge";
import { RefCard } from "@/components/primitives/RefCard";
import { Plus } from "lucide-react";

const EVALUATORS = [
  { id: "ev_helpfulness", name: "helpfulness", score: 0.84, runs: 12_420, kind: "llm-judge" },
  { id: "ev_groundedness", name: "groundedness", score: 0.91, runs: 12_420, kind: "llm-judge" },
  { id: "ev_latency_sla", name: "latency < 3s", score: 0.78, runs: 12_420, kind: "rule" },
  { id: "ev_no_pii", name: "no PII in completion", score: 0.99, runs: 12_420, kind: "regex" },
];

export default function EvaluatorsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Evaluators"
        accent={`/ ${EVALUATORS.length}`}
        sub="Auto-applied to every production trace."
        actions={<RefButton variant="primary" icon={Plus}>New evaluator</RefButton>}
      />

      <RefCard>
        <table className="runs-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Kind</th>
              <th>Score (24h)</th>
              <th className="r">Runs evaluated</th>
              <th className="r">Status</th>
            </tr>
          </thead>
          <tbody>
            {EVALUATORS.map((e) => (
              <tr key={e.id}>
                <td>
                  <div className="mono" style={{ fontWeight: 500 }}>{e.name}</div>
                  <div className="mute" style={{ fontSize: 10, marginTop: 2, fontFamily: "var(--font-mono)" }}>{e.id}</div>
                </td>
                <td><RefBadge variant="muted">{e.kind}</RefBadge></td>
                <td>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 120, height: 5, background: "hsl(var(--muted) / 0.5)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        width: `${e.score * 100}%`, height: "100%",
                        background: e.score >= 0.9 ? "hsl(var(--success))" : e.score >= 0.8 ? "hsl(var(--primary))" : "hsl(var(--warning))",
                      }} />
                    </div>
                    <span className="mono tabular" style={{ fontWeight: 600 }}>{e.score.toFixed(2)}</span>
                  </div>
                </td>
                <td className="r">{e.runs.toLocaleString()}</td>
                <td className="r"><RefBadge variant={e.score >= 0.85 ? "success" : "warning"} dot>{e.score >= 0.85 ? "Pass" : "Watch"}</RefBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </RefCard>
    </div>
  );
}
