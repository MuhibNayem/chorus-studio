"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import ProvenanceDag from "@/components/run-detail/ProvenanceDag";
import { Search, RefreshCw, ArrowRight } from "lucide-react";
import type { ProvenanceEntry } from "@/types";

export default function ProvenancePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProvenanceContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="flex flex-col gap-4" style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: 22, paddingBottom: 16, borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="rounded animate-pulse" style={{ height: 36, width: 260, background: "hsl(var(--muted))", marginBottom: 8 }} />
        <div className="rounded animate-pulse" style={{ height: 14, width: 380, background: "hsl(var(--muted))" }} />
      </div>
      <div className="rounded animate-pulse" style={{ height: 400, background: "hsl(var(--muted))" }} />
    </div>
  );
}

function ProvenanceContent() {
  const params = useSearchParams();
  const router = useRouter();
  const initialRunId = params.get("runId") ?? "";

  const [runIdInput, setRunIdInput] = useState(initialRunId);
  const [runId, setRunId] = useState(initialRunId);
  const [entries, setEntries] = useState<ProvenanceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProvenance = useCallback(
    async (id: string) => {
      if (!id.trim()) return;
      setRunId(id.trim());
      setLoading(true);
      setError(null);
      try {
        const res = await api.getProvenance(id.trim(), 0, 100);
        setEntries(res.items);
        if (res.items.length === 0) {
          setError("No provenance entries found for this run. The run may not have provenance tracking enabled.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load provenance");
        setEntries([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (initialRunId) {
      fetchProvenance(initialRunId);
    }
  }, [initialRunId, fetchProvenance]);

  const handleLookup = () => {
    const trimmed = runIdInput.trim();
    if (trimmed) {
      router.replace(`/provenance?runId=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLookup();
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Provenance graph"
        sub="Explore causal decision paths from Chorus Engine runs."
        actions={
          <RefButton
            variant="outline"
            icon={RefreshCw}
            disabled={!runId || loading}
            onClick={() => runId && fetchProvenance(runId)}
          >
            Refresh
          </RefButton>
        }
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div style={{ flex: 1, maxWidth: 420 }}>
          <input
            className="ref-input"
            placeholder="Enter a run ID (e.g. run_prod_abc123)"
            value={runIdInput}
            onChange={(e) => setRunIdInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <RefButton variant="primary" icon={ArrowRight} onClick={handleLookup} disabled={!runIdInput.trim()}>
          Explore
        </RefButton>
      </div>

      {!runId && !loading && (
        <div
          className="text-center"
          style={{
            padding: "64px 24px",
            color: "hsl(var(--muted-foreground))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            background: "hsl(var(--card))",
          }}
        >
          <Search size={40} style={{ opacity: 0.25, margin: "0 auto 16px" }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: 6 }}>
            Explore a run&apos;s provenance
          </div>
          <div style={{ fontSize: 12, maxWidth: 360, margin: "0 auto", lineHeight: 1.5 }}>
            Enter a run ID above to visualize its causal decision graph. Provenance tracks every
            decision the agent made — LLM calls, tool uses, RAG retrievals, and guardrails.
          </div>
        </div>
      )}

      {loading && (
        <div
          className="space-y-3"
          style={{
            padding: "48px 24px",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            background: "hsl(var(--card))",
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded animate-pulse"
              style={{
                height: 24,
                backgroundColor: "hsl(var(--muted))",
                width: `${Math.max(20, 80 - i * 14)}%`,
              }}
            />
          ))}
        </div>
      )}

      {error && runId && (
        <div
          style={{
            padding: "18px 20px",
            border: "1px solid hsl(var(--error) / 0.3)",
            borderRadius: "0.5rem",
            background: "hsl(var(--error) / 0.08)",
            color: "hsl(var(--error))",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && runId && (
        <ProvenanceDag entries={entries} />
      )}
    </div>
  );
}
