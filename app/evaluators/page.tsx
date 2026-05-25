"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import FormField from "@/components/shared/FormField";
import RefButton from "@/components/primitives/RefButton";
import RefBadge from "@/components/primitives/RefBadge";
import { RefCard } from "@/components/primitives/RefCard";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Evaluator } from "@/types";
import { Plus, RotateCcw, X, Info, Zap } from "lucide-react";

// ── Local primitives not worth extracting yet ─────────────────────────────────

function ConfigPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "hsl(var(--primary)/0.04)",
      border: "1px solid hsl(var(--primary)/0.1)",
      borderRadius: 12,
      padding: 14,
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      {children}
    </div>
  );
}

function FieldTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  mono,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <>
      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: "hsl(var(--card-elev))",
          border: focused
            ? "1px solid hsl(var(--primary)/0.5)"
            : "1px solid hsl(var(--border)/0.2)",
          borderRadius: 10,
          padding: "8px 12px",
          fontSize: mono ? 10 : 12,
          fontFamily: "var(--font-mono)",
          color: "hsl(var(--foreground))",
          outline: "none",
          resize: "none",
          boxShadow: focused ? "0 0 0 3px hsl(var(--primary)/0.08)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxSizing: "border-box",
        }}
      />
      {hint && (
        <span style={{ fontSize: 10, color: "hsl(var(--muted-foreground)/0.6)", marginTop: 3, display: "block" }}>
          {hint}
        </span>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EvaluatorsPage() {
  const router = useRouter();
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newEval, setNewEval] = useState({
    name: "",
    kind: "llm-judge",
    description: "",
    config: {} as Record<string, unknown>
  });

  const [llmConfig, setLlmConfig] = useState({ promptTemplate: "", threshold: 0.75 });
  const [regexConfig, setRegexConfig] = useState({ pattern: "", matchBehavior: "must_match", target: "completion" });
  const [ruleConfig, setRuleConfig] = useState({ metric: "latency_ms", operator: "<=", threshold: 3000 });
  const [hallucinationConfig, setHallucinationConfig] = useState({ threshold: 0.7, ngramSize: 2, llmJudgeUrl: "" });

  const fetchEvaluators = () => {
    setLoading(true);
    api.listEvaluators()
      .then((res) => setEvaluators(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvaluators(); }, []);

  const handleCreateEvaluator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEval.name.trim()) return;
    setSaving(true);
    let configPayload: Record<string, unknown> = {};
    if (newEval.kind === "llm-judge") configPayload = { ...llmConfig };
    else if (newEval.kind === "regex") configPayload = { ...regexConfig };
    else if (newEval.kind === "rule") configPayload = { ...ruleConfig };
    else if (newEval.kind === "hallucination") configPayload = { ...hallucinationConfig };

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
        <div className="ref-card card-pad flex flex-col items-center justify-center py-12 gap-3"
          style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>
          <Info size={24} className="text-primary shrink-0" />
          <span>No evaluators configured yet. Configure automated scoring pipelines to audit production traces.</span>
        </div>
      ) : (
        <RefCard>
          <table className="runs-table">
            <thead>
              <tr>
                <th>Name</th><th>Kind</th><th>Score (24h)</th>
                <th className="r">Runs evaluated</th><th className="r">Status</th>
              </tr>
            </thead>
            <tbody>
              {evaluators.map((e) => {
                const score = e.score24h ?? 0.0;
                const evaluatedCount = e.runs ?? 12420;
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

      {/* ── CREATE EVALUATOR MODAL ── */}
      {showCreateModal && (
        <div style={{
          position: "fixed", inset: 0,
          background: "hsl(var(--background)/0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50, padding: 16,
        }}>
          <div style={{
            background: "hsl(var(--card))",
            borderRadius: 18,
            boxShadow: "0 24px 80px hsl(0 0% 0% / 0.4), 0 0 0 1px hsl(var(--border)/0.1)",
            width: "100%", maxWidth: 520, maxHeight: "90vh",
            overflowY: "auto", display: "flex", flexDirection: "column",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: "hsl(var(--primary)/0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Zap size={15} style={{ color: "hsl(var(--primary))" }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "hsl(var(--foreground))" }}>
                  New Evaluator
                </span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", padding: 4, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s, background 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "hsl(var(--foreground))"; e.currentTarget.style.background = "hsl(var(--muted)/0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "hsl(var(--muted-foreground))"; e.currentTarget.style.background = "none"; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateEvaluator} style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <FormField label="Evaluator Name">
                <Input
                  required
                  placeholder="e.g. email_pii_checker"
                  value={newEval.name}
                  onChange={(e) => setNewEval({ ...newEval, name: e.target.value })}
                />
              </FormField>

              <FormField label="Evaluator Kind">
                <Select
                  value={newEval.kind}
                  onChange={(v) => setNewEval({ ...newEval, kind: v as string })}
                >
                  <option value="llm-judge">LLM as a Judge (llm-judge)</option>
                  <option value="regex">Regular Expression (regex)</option>
                  <option value="rule">Threshold Assert Rule (rule)</option>
                  <option value="hallucination">Hallucination Scorer (hallucination)</option>
                </Select>
              </FormField>

              <FormField label="Description">
                <FieldTextarea
                  value={newEval.description}
                  onChange={(v) => setNewEval({ ...newEval, description: v })}
                  placeholder="Describe what criteria this evaluator scores..."
                  rows={2}
                />
              </FormField>

              {/* Dynamic config — LLM Judge */}
              {newEval.kind === "llm-judge" && (
                <ConfigPanel>
                  <FormField label="Judge Prompt Template" hint="Falls back to default evaluation criteria if left blank.">
                    <FieldTextarea
                      value={llmConfig.promptTemplate}
                      onChange={(v) => setLlmConfig({ ...llmConfig, promptTemplate: v })}
                      placeholder="Use {prompt} and {completion} variables..."
                      rows={5}
                      mono
                    />
                  </FormField>
                  <FormField label="Pass Threshold">
                    <Input
                      type="number" step="0.05" min="0" max="1"
                      value={llmConfig.threshold}
                      onChange={(e) => setLlmConfig({ ...llmConfig, threshold: parseFloat(e.target.value) || 0.75 })}
                      placeholder="0.00 – 1.00"
                    />
                  </FormField>
                </ConfigPanel>
              )}

              {/* Dynamic config — Regex */}
              {newEval.kind === "regex" && (
                <ConfigPanel>
                  <FormField label="Regex Match Pattern">
                    <Input
                      required
                      placeholder="\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
                      value={regexConfig.pattern}
                      onChange={(e) => setRegexConfig({ ...regexConfig, pattern: e.target.value })}
                    />
                  </FormField>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <FormField label="Match Behavior">
                      <Select
                        value={regexConfig.matchBehavior}
                        onChange={(v) => setRegexConfig({ ...regexConfig, matchBehavior: v as string })}
                      >
                        <option value="must_match">Must Match</option>
                        <option value="must_not_match">Must Not Match</option>
                      </Select>
                    </FormField>
                    <FormField label="Target">
                      <Select
                        value={regexConfig.target}
                        onChange={(v) => setRegexConfig({ ...regexConfig, target: v as string })}
                      >
                        <option value="completion">Completion Only</option>
                        <option value="prompt">Prompt Only</option>
                        <option value="both">Both</option>
                      </Select>
                    </FormField>
                  </div>
                </ConfigPanel>
              )}

              {/* Dynamic config — Rule */}
              {newEval.kind === "rule" && (
                <ConfigPanel>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 10 }}>
                    <FormField label="Metric">
                      <Select
                        value={ruleConfig.metric}
                        onChange={(v) => setRuleConfig({ ...ruleConfig, metric: v as string })}
                      >
                        <option value="latency_ms">Latency (latency_ms)</option>
                        <option value="total_tokens">Total Tokens</option>
                        <option value="total_cost">Total Cost</option>
                      </Select>
                    </FormField>
                    <FormField label="Op">
                      <Select
                        value={ruleConfig.operator}
                        onChange={(v) => setRuleConfig({ ...ruleConfig, operator: v as string })}
                      >
                        <option value="<">&lt;</option>
                        <option value="<=">&lt;=</option>
                        <option value=">">&gt;</option>
                        <option value=">=">&gt;=</option>
                        <option value="==">==</option>
                      </Select>
                    </FormField>
                    <FormField label="Threshold">
                      <Input
                        type="number" step="any" required
                        value={ruleConfig.threshold}
                        onChange={(e) => setRuleConfig({ ...ruleConfig, threshold: parseFloat(e.target.value) || 0 })}
                      />
                    </FormField>
                  </div>
                </ConfigPanel>
              )}

              {/* Dynamic config — Hallucination */}
              {newEval.kind === "hallucination" && (
                <ConfigPanel>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <FormField label="N-gram Size">
                      <Input
                        type="number" min="1" max="5" required
                        value={hallucinationConfig.ngramSize}
                        onChange={(e) => setHallucinationConfig({ ...hallucinationConfig, ngramSize: parseInt(e.target.value) || 2 })}
                      />
                    </FormField>
                    <FormField label="Failure Threshold">
                      <Input
                        type="number" step="0.05" min="0" max="1" required
                        value={hallucinationConfig.threshold}
                        onChange={(e) => setHallucinationConfig({ ...hallucinationConfig, threshold: parseFloat(e.target.value) || 0.7 })}
                      />
                    </FormField>
                  </div>
                  <FormField label="External LLM Judge API" hint="Optional">
                    <Input
                      placeholder="https://judge-model:8000/score"
                      value={hallucinationConfig.llmJudgeUrl}
                      onChange={(e) => setHallucinationConfig({ ...hallucinationConfig, llmJudgeUrl: e.target.value })}
                    />
                  </FormField>
                </ConfigPanel>
              )}

              {/* Footer */}
              <div style={{
                display: "flex", gap: 8, justifyContent: "flex-end",
                marginTop: 4, paddingTop: 16,
                borderTop: "1px solid hsl(var(--border)/0.08)",
              }}>
                <RefButton variant="outline" type="button" onClick={() => setShowCreateModal(false)}>Cancel</RefButton>
                <RefButton variant="primary" type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Evaluator"}
                </RefButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
