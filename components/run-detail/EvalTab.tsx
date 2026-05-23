"use client";

import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import RefBadge from "@/components/primitives/RefBadge";
import RefButton from "@/components/primitives/RefButton";
import { Check } from "lucide-react";

const EVALUATORS = [
  { id: "ev_helpfulness", name: "helpfulness", score: 0.84, runs: 12_420, kind: "llm-judge" },
  { id: "ev_groundedness", name: "groundedness", score: 0.91, runs: 12_420, kind: "llm-judge" },
  { id: "ev_latency_sla", name: "latency < 3s", score: 0.78, runs: 12_420, kind: "rule" },
  { id: "ev_no_pii", name: "no PII in completion", score: 0.99, runs: 12_420, kind: "regex" },
];

export default function EvalTab() {
  return (
    <div className="split-2">
      <RefCard>
        <CardHeader title="Evaluators applied" sub="Auto-run on every production trace" />
        <div>
          {EVALUATORS.map((e, i) => (
            <div
              key={e.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 60px 50px",
                alignItems: "center",
                gap: 12,
                padding: "14px 20px",
                borderTop: i === 0 ? "none" : "1px solid hsl(var(--border))",
              }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{e.name}</span>
                  <RefBadge variant="muted">{e.kind}</RefBadge>
                </div>
                <div className="eval-bar" style={{ marginTop: 8 }}>
                  <span style={{ width: `${e.score * 100}%` }} />
                </div>
              </div>
              <div className="mono tabular" style={{ fontSize: 16, fontWeight: 600, textAlign: "right" }}>
                {e.score.toFixed(2)}
              </div>
              <RefBadge variant={e.score >= 0.85 ? "success" : e.score >= 0.7 ? "warning" : "error"} dot>
                {e.score >= 0.85 ? "Pass" : e.score >= 0.7 ? "Watch" : "Fail"}
              </RefBadge>
            </div>
          ))}
        </div>
      </RefCard>

      <RefCard>
        <CardHeader title="Annotate" sub="Capture human feedback for this run" />
        <div className="eval-card">
          <div className="mute" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Score</div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} className="filter-chip" style={{ minWidth: 36, justifyContent: "center" }}>{n}</button>
            ))}
          </div>
          <div className="mute" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginTop: 8 }}>Tags</div>
          <div className="flex flex-wrap gap-1.5">
            {["hallucination", "verbose", "tool-misuse", "guardrail-miss", "helpful", "concise"].map((t) => (
              <button key={t} className="filter-chip">{t}</button>
            ))}
          </div>
          <div className="mute" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginTop: 8 }}>Note</div>
          <textarea
            className="ref-input"
            style={{ height: 80, padding: 10, resize: "vertical", fontFamily: "var(--font-sans)" }}
            placeholder="What went well, what didn't…"
          />
          <RefButton variant="primary" style={{ alignSelf: "flex-start", marginTop: 4 }} icon={Check}>Save annotation</RefButton>
        </div>
      </RefCard>
    </div>
  );
}
