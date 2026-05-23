import type {
  Run,
  Span,
  LlmCall,
  ToolCall,
  ProvenanceEntry,
  DashboardMetrics,
  PagedResult,
  Agent,
  AgentMetrics,
  AgentToolUsage,
  AgentModelDistribution,
  AgentDeployment,
  AgentAlert,
  ModelMetrics,
  Dataset,
  Evaluator,
  RunEvaluation,
  AlertEvent,
  AlertRule,
  RetentionPolicy,
} from "@/types";

const API_BASE = process.env.CHORUS_API_URL || "http://localhost:8080";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("chorus_auth_token");
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

function qs(params?: Record<string, string | number | undefined>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

/* ── Auth ─────────────────────────────────────────────────── */

export const authApi = {
  login: (tenantId: string, email: string, password: string) =>
    fetch("http://localhost:8080/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, email, password }),
    }),

  register: (email: string, password: string, displayName: string) =>
    fetch("http://localhost:8080/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    }),

  me: () => fetchJson<{ userId: string; email: string; displayName: string; tenantId: string; permissions: string[] }>("/api/v1/auth/me"),
};

/* ── Dashboard ────────────────────────────────────────────── */

export const api = {
  getMetrics: (window?: "24h" | "7d" | "30d") =>
    fetchJson<DashboardMetrics>(`/api/v1/metrics/dashboard${qs({ window })}`),

  getHeatmap: (window?: "24h" | "7d" | "30d") =>
    fetchJson<number[][]>(`/api/v1/metrics/heatmap${qs({ window })}`),

  /* ── Runs ───────────────────────────────────────────────── */

  listRuns: (params?: Record<string, string | number | undefined>) =>
    fetchJson<{ runs: Run[]; total: number; page: number; size: number }>(`/api/v1/runs${qs(params)}`),

  getRun: (runId: string) => fetchJson<Run>(`/api/v1/runs/${runId}`),

  listSpans: (runId: string, page = 0, size = 100) =>
    fetchJson<PagedResult<Span>>(`/api/v1/runs/${runId}/spans${qs({ page, size })}`),

  listLlmCalls: (runId: string, page = 0, size = 100) =>
    fetchJson<PagedResult<LlmCall>>(`/api/v1/runs/${runId}/llm-calls${qs({ page, size })}`),

  listToolCalls: (runId: string, page = 0, size = 100) =>
    fetchJson<PagedResult<ToolCall>>(`/api/v1/runs/${runId}/tool-calls${qs({ page, size })}`),

  getProvenance: (runId: string, page = 0, size = 100) =>
    fetchJson<PagedResult<ProvenanceEntry>>(`/api/v1/runs/${runId}/provenance${qs({ page, size })}`),

  submitFeedback: (runId: string, score: number) =>
    fetchJson<void>(`/api/v1/runs/${runId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ score, source: "human" }),
    }),

  streamRun: (runId: string, onEvent: (span: Span) => void, onError?: (err: Error) => void) => {
    const token = getToken();
    const source = new EventSource(`${API_BASE}/api/v1/runs/${runId}/stream`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    } as EventSourceInit);
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

  /* ── Agents ─────────────────────────────────────────────── */

  listAgents: () => fetchJson<Agent[]>("/api/v1/agents"),

  getAgent: (agentId: string) => fetchJson<Agent>(`/api/v1/agents/${agentId}`),

  getAgentRuns: (agentId: string, page = 0, size = 20) =>
    fetchJson<{ runs: Run[]; total: number; page: number; size: number }>(
      `/api/v1/agents/${agentId}/runs${qs({ page, size })}`
    ),

  getAgentMetrics: (agentId: string) =>
    fetchJson<AgentMetrics>(`/api/v1/agents/${agentId}/metrics`),

  getAgentTools: (agentId: string) =>
    fetchJson<AgentToolUsage[]>(`/api/v1/agents/${agentId}/tools`),

  getAgentModels: (agentId: string) =>
    fetchJson<AgentModelDistribution[]>(`/api/v1/agents/${agentId}/models`),

  getAgentDeployments: (agentId: string) =>
    fetchJson<AgentDeployment[]>(`/api/v1/agents/${agentId}/deployments`),

  getAgentAlerts: (agentId: string) =>
    fetchJson<AgentAlert[]>(`/api/v1/agents/${agentId}/alerts`),

  registerAgent: (body: {
    name: string;
    agentId: string;
    description?: string;
    framework: string;
    owner?: string;
    tags?: string[];
  }) => fetchJson<Agent>("/api/v1/agents", { method: "POST", body: JSON.stringify(body) }),

  updateAgent: (agentId: string, body: Partial<Agent>) =>
    fetchJson<Agent>(`/api/v1/agents/${agentId}`, { method: "PATCH", body: JSON.stringify(body) }),

  deleteAgent: (agentId: string) =>
    fetchJson<void>(`/api/v1/agents/${agentId}`, { method: "DELETE" }),

  /* ── Models ─────────────────────────────────────────────── */

  listModels: () => fetchJson<ModelMetrics[]>("/api/v1/models"),

  /* ── Datasets ───────────────────────────────────────────── */

  listDatasets: (page = 0, size = 20) =>
    fetchJson<PagedResult<Dataset>>(`/api/v1/datasets${qs({ page, size })}`),

  /* ── Evaluators ─────────────────────────────────────────── */

  listEvaluators: () => fetchJson<Evaluator[]>("/api/v1/evaluators"),

  getRunEvaluations: (runId: string) =>
    fetchJson<RunEvaluation[]>(`/api/v1/runs/${runId}/evaluations`),

  /* ── Alerts ─────────────────────────────────────────────── */

  listAlertEvents: (page = 0, size = 20) =>
    fetchJson<PagedResult<AlertEvent>>(`/api/v1/alerts/events${qs({ page, size })}`),

  listAlertRules: (page = 0, size = 20) =>
    fetchJson<PagedResult<AlertRule>>(`/api/v1/alerts/rules${qs({ page, size })}`),

  resolveAlertEvent: (eventId: string) =>
    fetchJson<void>(`/api/v1/alerts/events/${eventId}/resolve`, { method: "POST" }),

  /* ── Settings ───────────────────────────────────────────── */

  getRetentionPolicies: () => fetchJson<RetentionPolicy[]>("/api/v1/retention-policies"),
};
