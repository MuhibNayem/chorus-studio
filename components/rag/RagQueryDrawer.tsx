"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { X, Database, ExternalLink } from "lucide-react";
import { RefCard } from "@/components/primitives/RefCard";
import type { RagQueryDetail } from "@/types";

function pct(v: number | null | undefined) {
  return v != null ? `${(v * 100).toFixed(1)}%` : "—";
}

function ScoreRow({ label, value }: { label: string; value: number | null | undefined }) {
  if (value == null) return null;
  const w = Math.round(value * 100);
  const accent = value >= 0.85 ? "hsl(var(--success))" : value >= 0.70 ? "hsl(var(--warning))" : "hsl(var(--error))";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span className="mono" style={{ fontSize: "0.6875rem", color: "hsl(var(--muted-foreground))", width: 144, flexShrink: 0 }}>{label}</span>
      <div className="eval-bar">
        <span style={{ background: accent }} />
      </div>
      <span className="mono tabular" style={{ fontSize: "0.6875rem", width: 40, textAlign: "right", color: accent }}>{pct(value)}</span>
    </div>
  );
}

export default function RagQueryDrawer({ queryId, onClose }: { queryId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<RagQueryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getRagQuery(queryId).then(setDetail).catch(console.error).finally(() => setLoading(false));
  }, [queryId]);

  return (
    <RefCard style={{ maxHeight: "calc(100vh - 120px)", overflow: "auto" }}>
      <div style={{ padding: "14px 18px 18px", background: "hsl(var(--card-elev))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Database size={14} style={{ color: "hsl(var(--primary-bright))", flexShrink: 0 }} />
          <span className="mono" style={{ fontWeight: 600, fontSize: "0.8125rem", color: "hsl(var(--foreground))" }}>Query Detail</span>
          <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={onClose}><X size={14} /></button>
        </div>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0", color: "hsl(var(--muted-foreground))", fontSize: "0.75rem" }}>Loading…</div>
        )}

        {!loading && detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, color: "hsl(var(--muted-foreground))", marginBottom: 6 }}>Query</div>
              <pre className="code-block">{detail.query}</pre>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "hsl(var(--muted-foreground))" }}>
              {detail.collection && <span className="ref-badge primary" style={{ fontFamily: "var(--font-mono)" }}>{detail.collection}</span>}
              <span>{detail.latencyMs}ms</span>
              <span style={{ color: "hsl(var(--border-bright))" }}>·</span>
              <span>{detail.chunkCount} / {detail.topK} chunks</span>
              <a href={`/runs/${detail.runId}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "hsl(var(--primary-bright))", marginLeft: "auto" }}>
                <ExternalLink size={11} /> View Run
              </a>
            </div>

            <div>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, color: "hsl(var(--muted-foreground))", marginBottom: 10 }}>RAGAS Scores</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <ScoreRow label="Context Precision" value={detail.contextPrecision} />
                <ScoreRow label="Context Recall" value={detail.contextRecall} />
                <ScoreRow label="Faithfulness" value={detail.faithfulness} />
                <ScoreRow label="Answer Relevancy" value={detail.answerRelevancy} />
              </div>
            </div>

            {detail.retrievedChunks.length > 0 && (
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, color: "hsl(var(--muted-foreground))", marginBottom: 8 }}>
                  Retrieved Chunks ({detail.retrievedChunks.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {detail.retrievedChunks.map((chunk, idx) => {
                    const score = detail.similarityScores?.[idx];
                    const scoreAccent = score != null
                      ? score >= 0.85 ? "hsl(var(--success))" : score >= 0.70 ? "hsl(var(--warning))" : "hsl(var(--error))"
                      : null;
                    return (
                      <div key={idx} style={{
                        padding: "8px 10px", border: "1px solid hsl(var(--border)/0.3)", borderRadius: "0.5rem",
                        background: "hsl(var(--background)/0.35)", fontFamily: "var(--font-mono)", fontSize: "0.6875rem",
                        display: "flex", alignItems: "flex-start", gap: 10, lineHeight: 1.55,
                      }}>
                        <span style={{ flex: 1, wordBreak: "break-all", color: "hsl(var(--foreground-dim))" }}>{chunk}</span>
                        {score != null && (
                          <span className="tabular" style={{ flexShrink: 0, fontWeight: 600, fontSize: "0.6875rem", color: scoreAccent ?? undefined }}>
                            {(score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </RefCard>
  );
}
