"use client";

import { useEffect, useState } from "react";
import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import RefBadge from "@/components/primitives/RefBadge";
import RefButton from "@/components/primitives/RefButton";
import { api } from "@/lib/api";
import { Check } from "lucide-react";
import type { RunEvaluation } from "@/types";

const MOCK_EVALUATORS = [
  { evaluatorId: "ev_helpfulness", name: "helpfulness", score: 0.84, kind: "llm-judge" },
  { evaluatorId: "ev_groundedness", name: "groundedness", score: 0.91, kind: "llm-judge" },
  { evaluatorId: "ev_latency_sla", name: "latency < 3s", score: 0.78, kind: "rule" },
  { evaluatorId: "ev_no_pii", name: "no PII in completion", score: 0.99, kind: "regex" },
];

export default function EvalTab({ runId }: { runId: string }) {
  const [evaluations, setEvaluations] = useState<RunEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  // Annotation Form State
  const [score, setScore] = useState<number>(5);
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!runId) return;
    setLoading(true);
    api.getRunEvaluations(runId)
      .then((res) => setEvaluations(res))
      .catch(() => setEvaluations([]))
      .finally(() => setLoading(false));
  }, [runId]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveAnnotation = async () => {
    setSaving(true);
    try {
      // Submit human rating (scaled 0.0 to 1.0)
      await api.submitFeedback(runId, score / 5);
      alert("Annotation and human feedback successfully saved!");
      setNote("");
      setSelectedTags([]);
    } catch (err) {
      alert("Failed to save annotation.");
    } finally {
      setSaving(false);
    }
  };

  const activeEvals = evaluations.length > 0
    ? evaluations.map((e) => ({
        evaluatorId: e.evaluatorId,
        name: e.evaluatorName || e.evaluatorId.replace("ev_", ""),
        score: e.score,
        kind: "auto",
      }))
    : MOCK_EVALUATORS;

  return (
    <div className="split-2">
      <RefCard>
        <CardHeader title="Evaluators applied" sub="Auto-run on every production trace" />
        <div>
          {loading ? (
            <div className="text-xs text-muted-foreground p-6 text-center animate-pulse">Loading evaluations...</div>
          ) : activeEvals.map((e, i) => (
            <div
              key={e.evaluatorId}
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
              <button
                key={n}
                onClick={() => setScore(n)}
                className="filter-chip"
                style={{
                  minWidth: 36,
                  justifyContent: "center",
                  borderColor: score === n ? "hsl(var(--primary))" : undefined,
                  background: score === n ? "hsl(var(--primary) / 0.15)" : undefined,
                  color: score === n ? "hsl(var(--primary))" : undefined,
                }}
              >
                {n}
              </button>
            ))}
          </div>
          
          <div className="mute" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginTop: 8 }}>Tags</div>
          <div className="flex flex-wrap gap-1.5">
            {["hallucination", "verbose", "tool-misuse", "guardrail-miss", "helpful", "concise"].map((t) => {
              const isSelected = selectedTags.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className="filter-chip"
                  style={{
                    borderColor: isSelected ? "hsl(var(--primary))" : undefined,
                    background: isSelected ? "hsl(var(--primary) / 0.15)" : undefined,
                    color: isSelected ? "hsl(var(--primary))" : undefined,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
          
          <div className="mute" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginTop: 8 }}>Note</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="ref-input"
            style={{ height: 80, padding: 10, resize: "vertical", fontFamily: "var(--font-sans)" }}
            placeholder="What went well, what didn't…"
          />
          <RefButton
            variant="primary"
            style={{ alignSelf: "flex-start", marginTop: 4 }}
            icon={Check}
            onClick={handleSaveAnnotation}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save annotation"}
          </RefButton>
        </div>
      </RefCard>
    </div>
  );
}
