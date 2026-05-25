"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import RefBadge from "@/components/primitives/RefBadge";
import { RefCard } from "@/components/primitives/RefCard";
import { api } from "@/lib/api";
import type { Evaluator } from "@/types";
import { Plus, RotateCcw, X, Info } from "lucide-react";

export default function EvaluatorsPage() {
  const router = useRouter();
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [newEval, setNewEval] = useState({
    name: "",
    kind: "llm-judge",
    description: "",
    config: {} as Record<string, any>
  });

  // Dynamic config fields based on evaluator kind
  const [llmConfig, setLlmConfig] = useState({
    promptTemplate: "",
    threshold: 0.75
  });

  const [regexConfig, setRegexConfig] = useState({
    pattern: "",
    matchBehavior: "must_match",
    target: "completion"
  });

  const [ruleConfig, setRuleConfig] = useState({
    metric: "latency_ms",
    operator: "<=",
    threshold: 3000
  });

  const [hallucinationConfig, setHallucinationConfig] = useState({
    threshold: 0.7,
    ngramSize: 2,
    llmJudgeUrl: ""
  });

  const fetchEvaluators = () => {
    setLoading(true);
    api.listEvaluators()
      .then((res) => setEvaluators(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvaluators();
  }, []);

  const handleCreateEvaluator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEval.name.trim()) return;

    setSaving(true);
    let configPayload: Record<string, any> = {};
    if (newEval.kind === "llm-judge") {
      configPayload = { ...llmConfig };
    } else if (newEval.kind === "regex") {
      configPayload = { ...regexConfig };
    } else if (newEval.kind === "rule") {
      configPayload = { ...ruleConfig };
    } else if (newEval.kind === "hallucination") {
      configPayload = { ...hallucinationConfig };
    }

    try {
      await api.createEvaluator({
        name: newEval.name,
        kind: newEval.kind,
        description: newEval.description || undefined,
        config: configPayload
      });
      setShowCreateModal(false);
      setNewEval({ name: "", kind: "llm-judge", description: "", config: {} });
      fetchEvaluators();
    } catch (err) {
      alert("Failed to create evaluator: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Evaluators"
        accent={`/ ${evaluators.length}`}
        sub="Auto-applied to production trace streams and offline dataset curations."
        actions={
          <div className="flex gap-2">
            <RefButton variant="outline" icon={RotateCcw} onClick={() => router.push("/evaluators/loops")}>
              Continuous Loops
            </RefButton>
            <RefButton variant="primary" icon={Plus} onClick={() => setShowCreateModal(true)}>
              New evaluator
            </RefButton>
          </div>
        }
      />

      {loading ? (
        <div className="ref-card card-pad animate-pulse" style={{ height: 200 }} />
      ) : evaluators.length === 0 ? (
        <div className="ref-card card-pad flex flex-col items-center justify-center py-12 gap-3" style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>
          <Info size={24} className="text-primary shrink-0" />
          <span>No evaluators configured yet. Configure automated scoring pipelines to audit production traces.</span>
        </div>
      ) : (
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
                const score = e.score24h ?? 0.0;
                const evaluatedCount = e.runs ?? 12420; // fallback seeds
                return (
                  <tr key={e.evaluatorId}>
                    <td>
                      <div className="mono" style={{ fontWeight: 600 }}>{e.name}</div>
                      <div className="mute" style={{ fontSize: 10, marginTop: 2, fontFamily: "var(--font-mono)" }}>
                        {e.evaluatorId} • {e.description || "No description provided."}
                      </div>
                    </td>
                    <td><RefBadge variant="muted">{e.kind}</RefBadge></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 120, height: 5, background: "hsl(var(--muted) / 0.5)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{
                            width: `${score * 100}%`, height: "100%",
                            background: score >= 0.9 ? "hsl(var(--success))" : score >= 0.75 ? "hsl(var(--primary))" : "hsl(var(--warning))",
                          }} />
                        </div>
                        <span className="mono tabular font-semibold" style={{ fontSize: 12 }}>{score.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="r mono tabular">{evaluatedCount.toLocaleString()}</td>
                    <td className="r">
                      <RefBadge variant={score >= 0.80 ? "success" : "warning"} dot>
                        {score >= 0.80 ? "Pass" : "Watch"}
                      </RefBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </RefCard>
      )}

      {/* ── CREATE EVALUATOR MODAL DRAWER ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="ref-card w-full max-w-lg p-6 space-y-4 flex flex-col max-h-[90vh] overflow-y-auto" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="mono font-bold text-base flex items-center gap-2">
                <Plus size={16} className="text-primary shrink-0" />
                Create New Evaluator
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateEvaluator} className="space-y-4 text-xs mono">
              <div className="space-y-1">
                <label className="block text-muted-foreground font-semibold">Evaluator Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. email_pii_checker"
                  className="w-full border p-2 rounded bg-transparent"
                  value={newEval.name}
                  onChange={(e) => setNewEval({ ...newEval, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-muted-foreground font-semibold">Evaluator Kind</label>
                <select
                  className="w-full border p-2 rounded bg-background"
                  value={newEval.kind}
                  onChange={(e) => setNewEval({ ...newEval, kind: e.target.value })}
                >
                  <option value="llm-judge">LLM as a Judge (llm-judge)</option>
                  <option value="regex">Regular Expression (regex)</option>
                  <option value="rule">Threshold Assert Rule (rule)</option>
                  <option value="hallucination">Hallucination Scorer (hallucination)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-muted-foreground font-semibold">Description</label>
                <textarea
                  placeholder="Describe what criteria this evaluator scores..."
                  rows={2}
                  className="w-full border p-2 rounded bg-transparent resize-none"
                  value={newEval.description}
                  onChange={(e) => setNewEval({ ...newEval, description: e.target.value })}
                />
              </div>

              {/* DYNAMIC FORM CONFIG FIELDS */}
              {newEval.kind === "llm-judge" && (
                <div className="border rounded p-3 bg-muted/10 space-y-3">
                  <div className="space-y-1">
                    <label className="block text-muted-foreground font-semibold">Judge Prompt Template</label>
                    <textarea
                      rows={5}
                      className="w-full border p-2 rounded bg-transparent font-mono text-[10px]"
                      placeholder="Use {prompt} and {completion} variables..."
                      value={llmConfig.promptTemplate}
                      onChange={(e) => setLlmConfig({ ...llmConfig, promptTemplate: e.target.value })}
                    />
                    <span className="text-[10px] text-muted-foreground">Will fallback to default evaluation criteria if left blank.</span>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-muted-foreground font-semibold">Pass Threshold (0.00 to 1.00)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      className="w-full border p-2 rounded bg-transparent"
                      value={llmConfig.threshold}
                      onChange={(e) => setLlmConfig({ ...llmConfig, threshold: parseFloat(e.target.value) || 0.75 })}
                    />
                  </div>
                </div>
              )}

              {newEval.kind === "regex" && (
                <div className="border rounded p-3 bg-muted/10 space-y-3">
                  <div className="space-y-1">
                    <label className="block text-muted-foreground font-semibold">Regex Match Pattern</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. \b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
                      className="w-full border p-2 rounded bg-transparent font-mono"
                      value={regexConfig.pattern}
                      onChange={(e) => setRegexConfig({ ...regexConfig, pattern: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-muted-foreground font-semibold">Match Behavior</label>
                      <select
                        className="w-full border p-2 rounded bg-background"
                        value={regexConfig.matchBehavior}
                        onChange={(e) => setRegexConfig({ ...regexConfig, matchBehavior: e.target.value })}
                      >
                        <option value="must_match">Must Match (Pass on match)</option>
                        <option value="must_not_match">Must Not Match (Fail on match)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-muted-foreground font-semibold">Target Text Location</label>
                      <select
                        className="w-full border p-2 rounded bg-background"
                        value={regexConfig.target}
                        onChange={(e) => setRegexConfig({ ...regexConfig, target: e.target.value })}
                      >
                        <option value="completion">Completion Only</option>
                        <option value="prompt">Prompt Only</option>
                        <option value="both">Prompt and Completion</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {newEval.kind === "rule" && (
                <div className="border rounded p-3 bg-muted/10 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="block text-muted-foreground font-semibold">Metric</label>
                      <select
                        className="w-full border p-2 rounded bg-background"
                        value={ruleConfig.metric}
                        onChange={(e) => setRuleConfig({ ...ruleConfig, metric: e.target.value })}
                      >
                        <option value="latency_ms">Latency (latency_ms)</option>
                        <option value="total_tokens">Total Tokens (total_tokens)</option>
                        <option value="total_cost">Total Cost (total_cost)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-muted-foreground font-semibold">Operator</label>
                      <select
                        className="w-full border p-2 rounded bg-background"
                        value={ruleConfig.operator}
                        onChange={(e) => setRuleConfig({ ...ruleConfig, operator: e.target.value })}
                      >
                        <option value="<">&lt;</option>
                        <option value="<=">&lt;=</option>
                        <option value=">">&gt;</option>
                        <option value=">=">&gt;=</option>
                        <option value="==">==</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-muted-foreground font-semibold">Threshold</label>
                      <input
                        type="number"
                        step="any"
                        required
                        className="w-full border p-2 rounded bg-transparent"
                        value={ruleConfig.threshold}
                        onChange={(e) => setRuleConfig({ ...ruleConfig, threshold: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {newEval.kind === "hallucination" && (
                <div className="border rounded p-3 bg-muted/10 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-muted-foreground font-semibold">N-gram Overlap Size</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        required
                        className="w-full border p-2 rounded bg-transparent"
                        value={hallucinationConfig.ngramSize}
                        onChange={(e) => setHallucinationConfig({ ...hallucinationConfig, ngramSize: parseInt(e.target.value) || 2 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-muted-foreground font-semibold">Failure Threshold</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        required
                        className="w-full border p-2 rounded bg-transparent"
                        value={hallucinationConfig.threshold}
                        onChange={(e) => setHallucinationConfig({ ...hallucinationConfig, threshold: parseFloat(e.target.value) || 0.7 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-muted-foreground font-semibold">External LLM Judge API (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. http://judge-model:8000/score"
                      className="w-full border p-2 rounded bg-transparent font-mono"
                      value={hallucinationConfig.llmJudgeUrl}
                      onChange={(e) => setHallucinationConfig({ ...hallucinationConfig, llmJudgeUrl: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2 border-t">
                <RefButton variant="outline" type="button" onClick={() => setShowCreateModal(false)}>Cancel</RefButton>
                <RefButton variant="primary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Evaluator"}
                </RefButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
