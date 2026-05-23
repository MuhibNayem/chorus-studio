import type {
  Run,
  Span,
  LlmCall,
  ToolCall,
  ProvenanceEntry,
  DashboardMetrics,
} from "@/types";

const API_BASE = process.env.CHORUS_API_URL || "http://localhost:8080";

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getMetrics: () => fetchJson<DashboardMetrics>("/api/v1/metrics/dashboard"),

  listRuns: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchJson<{ runs: Run[]; total: number; page: number; size: number }>(`/api/v1/runs${qs}`);
  },

  getRun: (runId: string) => fetchJson<Run>(`/api/v1/runs/${runId}`),

  listSpans: (runId: string) => fetchJson<Span[]>(`/api/v1/runs/${runId}/spans`),

  listLlmCalls: (runId: string) => fetchJson<LlmCall[]>(`/api/v1/runs/${runId}/llm-calls`),

  listToolCalls: (runId: string) => fetchJson<ToolCall[]>(`/api/v1/runs/${runId}/tool-calls`),

  getProvenance: (runId: string) => fetchJson<ProvenanceEntry[]>(`/api/v1/runs/${runId}/provenance`),

  submitFeedback: (runId: string, score: number) =>
    fetchJson<void>(`/api/v1/runs/${runId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ score }),
    }),

  streamRun: (runId: string, onEvent: (span: Span) => void, onError?: (err: Error) => void) => {
    const source = new EventSource(`${API_BASE}/api/v1/runs/${runId}/stream`);
    source.onmessage = (e) => {
      try {
        onEvent(JSON.parse(e.data));
      } catch (err) {
        onError?.(err as Error);
      }
    };
    source.onerror = () => {
      onError?.(new Error("SSE connection error"));
      source.close();
    };
    return () => source.close();
  },
};
