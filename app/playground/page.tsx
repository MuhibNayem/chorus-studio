"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import {
  Play, Sparkles, Loader2, Clock,
  Layers, DollarSign, AlertCircle, Zap,
  ChevronDown, Hash
} from "lucide-react";
import { Select } from "@/components/ui/select";
import type { PlaygroundResult } from "@/types";

// ── Stat pill ──────────────────────────────────────────────────────────────────
function StatPill({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 11px 5px 8px",
        borderRadius: 999,
        background: `hsl(${color}/0.1)`,
        border: `1px solid hsl(${color}/0.18)`,
        fontSize: 11.5,
        fontFamily: "var(--font-mono)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <Icon size={12} style={{ color: `hsl(${color})`, flexShrink: 0 }} />
      <span style={{ color: `hsl(${color})`, fontWeight: 600 }}>{value}</span>
      <span style={{ color: `hsl(${color}/0.6)`, fontSize: 10 }}>{label}</span>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        minHeight: 260,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow sphere */}
      <div
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, hsl(var(--primary)/0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background:
            "linear-gradient(135deg, hsl(var(--primary)/0.15), hsl(var(--rag)/0.15))",
          display: "grid",
          placeItems: "center",
          border: "1px solid hsl(var(--primary)/0.12)",
        }}
      >
        <Sparkles size={20} style={{ color: "hsl(var(--primary-bright))", opacity: 0.7 }} />
      </div>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "hsl(var(--foreground-dim))",
            marginBottom: 4,
          }}
        >
          Awaiting your first run
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "hsl(var(--muted-foreground))",
            fontFamily: "var(--font-mono)",
          }}
        >
          Write a prompt on the left, then hit Run
        </div>
      </div>
    </div>
  );
}

// ── Loading state ──────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        minHeight: 260,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "hsl(var(--primary)/0.08)",
          display: "grid",
          placeItems: "center",
          border: "1px solid hsl(var(--primary)/0.12)",
        }}
      >
        <Loader2
          size={18}
          className="animate-spin"
          style={{ color: "hsl(var(--primary-bright))" }}
        />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "hsl(var(--foreground-dim))" }}>
          Generating…
        </div>
        <div
          style={{
            fontSize: 11,
            color: "hsl(var(--muted-foreground))",
            fontFamily: "var(--font-mono)",
            marginTop: 3,
          }}
        >
          Waiting for model completion
        </div>
      </div>
    </div>
  );
}

// ── Error state ────────────────────────────────────────────────────────────────
function ErrorState({ error }: { error: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "18px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "14px 16px",
          borderRadius: 12,
          background: "hsl(var(--error)/0.06)",
          border: "1px solid hsl(var(--error)/0.14)",
        }}
      >
        <AlertCircle size={15} style={{ color: "hsl(var(--error))", flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "hsl(var(--error))", marginBottom: 3 }}>
            Execution failed
          </div>
          <div style={{ fontSize: 12, color: "hsl(var(--error)/0.8)", fontFamily: "var(--font-mono)", lineHeight: 1.5 }}>
            {error}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Response output ───────────────────────────────────────────────────────────
function ResponseOutput({ output }: { output: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0, minHeight: 0 }}>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase" as const,
          letterSpacing: "0.1em",
          fontWeight: 500,
          color: "hsl(var(--muted-foreground))",
          fontFamily: "var(--font-mono)",
          marginBottom: 8,
        }}
      >
        Response
      </div>
      <div
        style={{
          flex: 1,
          fontFamily: "var(--font-mono)",
          fontSize: 12.5,
          lineHeight: 1.7,
          color: "hsl(var(--foreground))",
          background: "hsl(var(--background)/0.6)",
          borderRadius: 12,
          padding: "16px 18px",
          border: "1px solid hsl(var(--border)/0.15)",
          whiteSpace: "pre-wrap",
          overflowY: "auto",
          minHeight: 160,
          maxHeight: 340,
          letterSpacing: "-0.01em",
        }}
      >
        {output}
      </div>
    </div>
  );
}

// ── Section label ──────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        textTransform: "uppercase" as const,
        letterSpacing: "0.1em",
        fontWeight: 500,
        color: "hsl(var(--muted-foreground))",
        fontFamily: "var(--font-mono)",
        marginBottom: 7,
      }}
    >
      {children}
    </div>
  );
}

// ── Main playground ────────────────────────────────────────────────────────────
function PlaygroundContent() {
  const searchParams = useSearchParams();
  const [promptContent, setPromptContent] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelOptions, setModelOptions] = useState([
    "gpt-4o",
    "gpt-4o-mini",
    "claude-sonnet-4-6",
    "gemini-2.0-flash",
  ]);
  const [customModel, setCustomModel] = useState("");

  useEffect(() => {
    api
      .listModels()
      .then((mData) => {
        const discovered = (mData || []).map((m) => m.model).filter(Boolean);
        const defaults = ["gpt-4o", "gpt-4o-mini", "claude-sonnet-4-6", "gemini-2.0-flash"];
        setModelOptions(Array.from(new Set([...defaults, ...discovered])));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const qContent = searchParams.get("content");
    const qModel = searchParams.get("model");
    if (qContent) setPromptContent(qContent);
    if (qModel) {
      setModel(qModel);
      setModelOptions((prev) =>
        prev.includes(qModel) || qModel === "custom" ? prev : [...prev, qModel]
      );
    }
  }, [searchParams]);

  const parsedVariables = useMemo(() => {
    const regex = /\{\{([a-zA-Z0-9_-]+)\}\}/g;
    const found: string[] = [];
    let match;
    while ((match = regex.exec(promptContent)) !== null) {
      if (!found.includes(match[1])) found.push(match[1]);
    }
    return found;
  }, [promptContent]);

  useEffect(() => {
    const next: Record<string, string> = {};
    parsedVariables.forEach((v) => { next[v] = variables[v] || ""; });
    setVariables(next);
  }, [parsedVariables]);

  const handleVariableChange = (name: string, val: string) =>
    setVariables((prev) => ({ ...prev, [name]: val }));

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptContent.trim()) return;
    setExecuting(true);
    setError(null);
    try {
      const finalModel = model === "custom" ? customModel : model;
      const res = await api.executePlayground({ promptContent, model: finalModel, variables });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExecuting(false);
    }
  };

  const resolvedPreview = useMemo(() => {
    let text = promptContent;
    Object.entries(variables).forEach(([k, v]) => {
      text = text.replaceAll(`{{${k}}}`, v || `[${k}]`);
    });
    return text;
  }, [promptContent, variables]);

  const charCount = promptContent.length;

  return (
    <form
      onSubmit={handleExecute}
      style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}
    >
      <PageHeader
        title="Playground"
        accent="/ prompt studio"
        sub="Draft, iterate, and evaluate model completions before deploying to production."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: 18,
          flex: 1,
          minHeight: 560,
        }}
      >
        {/* ── LEFT: Editor panel ─────────────────────────────────────────── */}
        <div
          className="ref-card"
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            padding: 0,
          }}
        >
          {/* Model selector bar */}
          <div
            style={{
              padding: "14px 20px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "hsl(var(--card-elev)/0.5)",
            }}
          >
            <Select
              value={model}
              onChange={(v) => setModel(v as string)}
              style={{ width: 220, flex: "0 0 auto" }}
              options={[
                ...modelOptions.map((opt) => ({ value: opt, label: opt })),
                { value: "custom", label: "Custom model ID…" },
              ]}
            />

            {model === "custom" && (
              <input
                type="text"
                required
                placeholder="e.g. meta-llama/llama-3.1-70b"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                style={{
                  height: 34,
                  padding: "0 12px",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  background: "hsl(var(--card-elev))",
                  border: "1px solid hsl(var(--primary)/0.25)",
                  borderRadius: 10,
                  color: "hsl(var(--foreground))",
                  outline: "none",
                  flex: 1,
                  minWidth: 160,
                }}
              />
            )}

            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 9px",
                borderRadius: 999,
                background: "hsl(var(--muted)/0.4)",
                fontSize: 10.5,
                fontFamily: "var(--font-mono)",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              <Hash size={10} style={{ opacity: 0.6 }} />
              {charCount.toLocaleString()}
            </div>
          </div>

          {/* Editor textarea */}
          <div
            style={{
              flex: 1,
              padding: "0 20px",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <SectionLabel>Prompt template</SectionLabel>
            <textarea
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              placeholder={
                "You are a helpful routing agent.\n\nRoute the following query to the correct handler:\n\n{{user_query}}"
              }
              style={{
                flex: 1,
                width: "100%",
                minHeight: 240,
                resize: "none",
                outline: "none",
                fontFamily: "var(--font-mono)",
                fontSize: 12.5,
                lineHeight: 1.7,
                color: "hsl(var(--foreground))",
                background: "hsl(var(--card-elev)/0.6)",
                border: "1px solid hsl(var(--border)/0.15)",
                borderRadius: 12,
                padding: "14px 16px",
                transition: "border-color 150ms ease, box-shadow 150ms ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "hsl(var(--primary)/0.35)";
                e.target.style.boxShadow = "0 0 0 3px hsl(var(--primary)/0.08)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "hsl(var(--border)/0.15)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Variables section */}
          {parsedVariables.length > 0 && (
            <div style={{ padding: "14px 20px 0" }}>
              <div
                style={{
                  background: "hsl(var(--primary)/0.04)",
                  border: "1px solid hsl(var(--primary)/0.1)",
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      height: 14,
                      borderRadius: 2,
                      background: "hsl(var(--primary-bright))",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.1em",
                      fontWeight: 600,
                      color: "hsl(var(--primary-bright))",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Variables · {parsedVariables.length} detected
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 10,
                    maxHeight: 180,
                    overflowY: "auto",
                  }}
                >
                  {parsedVariables.map((v) => (
                    <div key={v} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontFamily: "var(--font-mono)",
                          color: "hsl(var(--primary-bright)/0.8)",
                          fontWeight: 500,
                        }}
                      >
                        {`{{${v}}}`}
                      </span>
                      <input
                        type="text"
                        placeholder={`Enter ${v}…`}
                        value={variables[v] || ""}
                        onChange={(e) => handleVariableChange(v, e.target.value)}
                        style={{
                          height: 32,
                          padding: "0 10px",
                          fontSize: 12,
                          fontFamily: "var(--font-mono)",
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border)/0.3)",
                          borderRadius: 8,
                          color: "hsl(var(--foreground))",
                          outline: "none",
                          transition: "border-color 120ms ease",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "hsl(var(--primary)/0.4)")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = "hsl(var(--border)/0.3)")
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Run button */}
          <div style={{ padding: 20 }}>
            <button
              type="submit"
              disabled={executing || !promptContent.trim()}
              style={{
                width: "100%",
                height: 40,
                borderRadius: 11,
                background: executing
                  ? "hsl(var(--primary)/0.6)"
                  : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-bright)))",
                border: "none",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                cursor: executing || !promptContent.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                transition: "opacity 150ms ease, transform 80ms ease, box-shadow 150ms ease",
                boxShadow: promptContent.trim() && !executing
                  ? "0 2px 12px hsl(var(--primary)/0.35)"
                  : "none",
                opacity: !promptContent.trim() ? 0.4 : 1,
              }}
              onMouseEnter={(e) => {
                if (!executing && promptContent.trim()) {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 4px 20px hsl(var(--primary)/0.45)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 2px 12px hsl(var(--primary)/0.35)";
                (e.currentTarget as HTMLButtonElement).style.transform = "none";
              }}
            >
              {executing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={13} style={{ fill: "white" }} />
              )}
              {executing ? "Running…" : "Run"}
            </button>
          </div>
        </div>

        {/* ── RIGHT: Output panel ────────────────────────────────────────── */}
        <div
          className="ref-card"
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            padding: 0,
          }}
        >
          {/* Stats row — only after first run */}
          {result && (
            <div
              style={{
                padding: "14px 20px 12px",
                display: "flex",
                alignItems: "center",
                gap: 7,
                flexWrap: "wrap",
                background: "hsl(var(--card-elev)/0.5)",
              }}
            >
              <StatPill
                icon={Clock}
                value={`${result.latencyMs}ms`}
                label="latency"
                color="var(--llm)"
              />
              <StatPill
                icon={Layers}
                value={result.inputTokens.toLocaleString()}
                label="in"
                color="var(--rag)"
              />
              <StatPill
                icon={Layers}
                value={result.outputTokens.toLocaleString()}
                label="out"
                color="var(--rag)"
              />
              <StatPill
                icon={DollarSign}
                value={`$${result.estimatedCost.toFixed(5)}`}
                label="est."
                color="var(--success)"
              />
            </div>
          )}

          {/* Main output area */}
          <div
            style={{
              flex: 1,
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            {!result && !executing && !error && <EmptyState />}
            {executing && <LoadingState />}
            {error && <ErrorState error={error} />}
            {result && !executing && <ResponseOutput output={result.output} />}
          </div>

          {/* Resolved preview footer */}
          {promptContent.trim() && (
            <div
              style={{
                padding: "0 20px 18px",
                borderTop: "1px solid hsl(var(--border)/0.1)",
                paddingTop: 14,
              }}
            >
              <SectionLabel>Resolved preview</SectionLabel>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11.5,
                  lineHeight: 1.55,
                  color: "hsl(var(--muted-foreground))",
                  background: "hsl(var(--card-elev)/0.7)",
                  borderRadius: 9,
                  padding: "9px 12px",
                  maxHeight: 68,
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {resolvedPreview || "—"}
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense>
      <PlaygroundContent />
    </Suspense>
  );
}
