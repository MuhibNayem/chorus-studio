"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import RefBadge from "@/components/primitives/RefBadge";
import { RefCard } from "@/components/primitives/RefCard";
import { api } from "@/lib/api";
import type { Evaluator } from "@/types";
import { Plus } from "lucide-react";

const MOCK_EVALUATORS: Evaluator[] = [
  { evaluatorId: "ev_helpfulness", name: "helpfulness", score24h: 0.84, runs: 12_420, kind: "llm-judge" },
  { evaluatorId: "ev_groundedness", name: "groundedness", score24h: 0.91, runs: 12_420, kind: "llm-judge" },
  { evaluatorId: "ev_latency_sla", name: "latency < 3s", score24h: 0.78, runs: 12_420, kind: "rule" },
  { evaluatorId: "ev_no_pii", name: "no PII in completion", score24h: 0.99, runs: 12_420, kind: "regex" },
];

export default function EvaluatorsPage() {
  const [evaluators, setEvaluators] = useState<Evaluator[]>(MOCK_EVALUATORS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listEvaluators()
      .then((res) => setEvaluators(res.length > 0 ? res : MOCK_EVALUATORS))
      .catch(() => setEvaluators(MOCK_EVALUATORS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Evaluators"
        accent={`/ ${evaluators.length}`}
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
            {evaluators.map((e) => {
              const score = e.score24h ?? 0;
              return (
                <tr key={e.evaluatorId}>
                  <td>
                    <div className="mono" style={{ fontWeight: 500 }}>{e.name}</div>
                    <div className="mute" style={{ fontSize: 10, marginTop: 2, fontFamily: "var(--font-mono)" }}>{e.evaluatorId}</div>
                  </td>
                  <td><RefBadge variant="muted">{e.kind}</RefBadge></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 120, height: 5, background: "hsl(var(--muted) / 0.5)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                          width: `${score * 100}%`, height: "100%",
                          background: score >= 0.9 ? "hsl(var(--success))" : score >= 0.8 ? "hsl(var(--primary))" : "hsl(var(--warning))",
                        }} />
                      </div>
                      <span className="mono tabular" style={{ fontWeight: 600 }}>{score.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="r">{(e.runs ?? 0).toLocaleString()}</td>
                  <td className="r"><RefBadge variant={score >= 0.85 ? "success" : "warning"} dot>{score >= 0.85 ? "Pass" : "Watch"}</RefBadge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </RefCard>
    </div>
  );
}
