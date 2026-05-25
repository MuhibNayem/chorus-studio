"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import {
  Play,
  Sparkles,
  Loader2,
  Terminal,
  Cpu,
  Clock,
  Layers,
  DollarSign,
  AlertCircle
} from "lucide-react";
import type { PlaygroundResult } from "@/types";

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const [promptContent, setPromptContent] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [modelOptions, setModelOptions] = useState<string[]>([
    "gpt-4o",
    "gpt-4o-mini",
    "claude-3-5-sonnet",
    "gemini-2.0-flash",
  ]);
  const [customModel, setCustomModel] = useState("");

  // Load dynamically discovered models on mount
  useEffect(() => {
    api.listModels()
      .then((mData) => {
        const discoveredModels = (mData || []).map((m) => m.model).filter(Boolean);
        const defaults = ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet", "gemini-2.0-flash"];
        const uniqueModels = Array.from(new Set([...defaults, ...discoveredModels]));
        setModelOptions(uniqueModels);
      })
      .catch((e) => console.error("Failed to load models for playground", e));
  }, []);

  // Preload from query params if coming from Prompt Registry
  useEffect(() => {
    const qContent = searchParams.get("content");
    const qModel = searchParams.get("model");
    if (qContent) setPromptContent(qContent);
    if (qModel) {
      setModel(qModel);
      setModelOptions((prev) => {
        if (prev.includes(qModel) || qModel === "custom") return prev;
        return [...prev, qModel];
      });
    }
  }, [searchParams]);

  // Extract variables (any words inside double curly braces, e.g. {{query}})
  const parsedVariables = useMemo(() => {
    const regex = /\{\{([a-zA-Z0-9_-]+)\}\}/g;
    const found: string[] = [];
    let match;
    while ((match = regex.exec(promptContent)) !== null) {
      if (!found.includes(match[1])) {
        found.push(match[1]);
      }
    }
    return found;
  }, [promptContent]);

  // Sync variable states when parsed variables change
  useEffect(() => {
    const nextVars: Record<string, string> = {};
    parsedVariables.forEach((v) => {
      nextVars[v] = variables[v] || "";
    });
    setVariables(nextVars);
  }, [parsedVariables]);

  const handleVariableChange = (name: string, val: string) => {
    setVariables((prev) => ({ ...prev, [name]: val }));
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptContent.trim()) return;
    setExecuting(true);
    setError(null);
    try {
      const finalModel = model === "custom" ? customModel : model;
      const res = await api.executePlayground({
        promptContent,
        model: finalModel,
        variables,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExecuting(false);
    }
  };

  // Reconstruct resolved prompt preview for visualization
  const resolvedPreview = useMemo(() => {
    let text = promptContent;
    Object.entries(variables).forEach(([k, v]) => {
      text = text.replaceAll(`{{${k}}}`, v || `[${k}]`);
    });
    return text;
  }, [promptContent, variables]);

  return (
    <div className="flex flex-col gap-5 h-full">
      <PageHeader
        title="Prompt Playground"
        accent="/ debugger"
        sub="Draft, refine, and compare model completions dynamically before deploying them to your production pipeline."
      />

      <div className="split-2 h-full min-h-[550px] gap-6" style={{ gridTemplateColumns: "1.1fr 0.9fr" }}>
        {/* Editor Workspace (Left) */}
        <div className="ref-card flex flex-col justify-between" style={{ padding: 20 }}>
          <form onSubmit={handleExecute} className="space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              {/* Header options */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-primary shrink-0" />
                  <span className="mono font-semibold" style={{ fontSize: 13 }}>Execution Config</span>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <select
                    className="mono border p-1 rounded-md bg-background text-[11px]"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    {modelOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="custom">Custom Model ID...</option>
                  </select>
                  {model === "custom" && (
                    <input
                      type="text"
                      required
                      placeholder="Enter model ID..."
                      className="mono border px-2 py-0.5 rounded-md bg-background text-[11px] w-36 mt-1"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                    />
                  )}
                </div>
              </div>

              {/* Raw text-area prompt canvas */}
              <div className="space-y-1">
                <label className="mono block" style={{ fontSize: 11, opacity: 0.8 }}>Prompt Template Editor</label>
                <textarea
                  className="mono w-full border p-3 rounded-md bg-muted/20 font-mono text-[12px] focus:border-primary focus:ring-1 focus:ring-primary"
                  rows={10}
                  placeholder="You are a helpful routing agent... Output a routing decision for: {{user_query}}"
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                />
              </div>

              {/* Parsed Variables Form */}
              {parsedVariables.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <span className="mono block text-primary" style={{ fontSize: 12, fontWeight: "semibold" }}>Auto-Extracted Variables</span>
                  <div className="grid grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-1">
                    {parsedVariables.map((v) => (
                      <div key={v} className="space-y-1 mono text-[11px]">
                        <label className="block text-muted-foreground font-semibold">{"{{" + v + "}}"}</label>
                        <input
                          type="text"
                          required
                          placeholder={`Enter ${v}...`}
                          className="w-full border p-2 rounded bg-transparent"
                          value={variables[v] || ""}
                          onChange={(e) => handleVariableChange(v, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4 flex justify-end">
              <RefButton
                variant="primary"
                type="submit"
                icon={executing ? Loader2 : Play}
                disabled={executing || !promptContent.trim()}
              >
                {executing ? "Executing Model..." : "Run Playground"}
              </RefButton>
            </div>
          </form>
        </div>

        {/* Results Panel (Right) */}
        <div className="ref-card flex flex-col justify-between" style={{ padding: 20 }}>
          <div className="space-y-5 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-4">
                <Terminal size={16} className="text-primary shrink-0" />
                <span className="mono font-semibold" style={{ fontSize: 13 }}>Response & Metrics</span>
              </div>

              {/* Stats rail */}
              {result && (
                <div className="grid grid-cols-4 gap-2 border-b pb-4 mono">
                  <div className="border p-2 rounded-md bg-muted/10 text-center">
                    <span className="text-muted-foreground block text-[9px]">LATENCY</span>
                    <span className="font-bold text-[12px] flex items-center justify-center gap-1 mt-1 text-blue-500">
                      <Clock size={11} className="shrink-0" />
                      {result.latencyMs}ms
                    </span>
                  </div>
                  <div className="border p-2 rounded-md bg-muted/10 text-center">
                    <span className="text-muted-foreground block text-[9px]">IN TOKENS</span>
                    <span className="font-bold text-[12px] flex items-center justify-center gap-1 mt-1 text-purple-500">
                      <Layers size={11} className="shrink-0" />
                      {result.inputTokens}
                    </span>
                  </div>
                  <div className="border p-2 rounded-md bg-muted/10 text-center">
                    <span className="text-muted-foreground block text-[9px]">OUT TOKENS</span>
                    <span className="font-bold text-[12px] flex items-center justify-center gap-1 mt-1 text-purple-500">
                      <Layers size={11} className="shrink-0" />
                      {result.outputTokens}
                    </span>
                  </div>
                  <div className="border p-2 rounded-md bg-muted/10 text-center">
                    <span className="text-muted-foreground block text-[9px]">COST (EST)</span>
                    <span className="font-bold text-[12px] flex items-center justify-center gap-1 mt-1 text-green-500">
                      <DollarSign size={11} className="shrink-0" />
                      ${result.estimatedCost.toFixed(5)}
                    </span>
                  </div>
                </div>
              )}

              {/* Resolved Prompt Preview */}
              <div className="space-y-1">
                <span className="mono text-muted-foreground block text-[10px]">RESOLVED TEMPLATE PREVIEW</span>
                <div className="mono text-[11px] border p-2 rounded bg-muted/20 text-muted-foreground max-h-[80px] overflow-y-auto whitespace-pre-wrap">
                  {resolvedPreview || "Variables will populate dynamically."}
                </div>
              </div>

              {/* Output Content */}
              <div className="space-y-1 flex-1">
                <span className="mono text-muted-foreground block text-[10px]">GENERATED RESPONSE</span>
                {executing ? (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg text-muted-foreground bg-muted/5 space-y-2">
                    <Loader2 className="animate-spin text-primary shrink-0" size={24} />
                    <span className="mono" style={{ fontSize: 11 }}>Generating text from model catalog...</span>
                  </div>
                ) : error ? (
                  <div className="flex items-center gap-2 p-3 border border-red-500/20 bg-red-500/5 rounded-md text-red-500 text-xs">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>Error: {error}</span>
                  </div>
                ) : result ? (
                  <div className="mono text-foreground font-mono p-4 rounded-md border bg-black text-[12px] whitespace-pre-wrap leading-relaxed min-h-[160px] max-h-[220px] overflow-y-auto">
                    {result.output}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg text-muted-foreground bg-muted/5">
                    <Sparkles size={28} className="stroke-1 mb-2 shrink-0" />
                    <span className="mono" style={{ fontSize: 11 }}>Awaiting execution trial...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense>
      <PlaygroundContent />
    </Suspense>
  );
}
