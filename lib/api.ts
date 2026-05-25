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
  DatasetItem,
  Evaluator,
  RunEvaluation,
  AlertEvent,
  AlertRule,
  RetentionPolicy,
  PromptVersion,
  PromptTag,
  PromptAbTest,
  PlaygroundResult,
  RagMetrics,
  RagTrendPoint,
  RagCluster,
  RagDriftSnapshot,
  RagQueryEntry,
  RagQueryDetail,
  AuditLogEntry,
} from "@/types";

// All API calls go through the Next.js catch-all proxy (/api/proxy/...) which runs
// server-side and can reach the Spring Boot backend by its Docker hostname.
// The browser never needs to know the backend's address.
const API_BASE = "/api/proxy";

let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(handler: () => void) {
  sessionExpiredHandler = handler;
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest", // CSRF signal for SameSite=Lax
      ...options?.headers,
    },
    ...options,
  });

  if (res.status === 401) {
    // Try a silent refresh once before giving up
    const refreshed = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    }).catch(() => null);

    if (refreshed?.ok) {
      // Retry the original request with the refreshed cookie
      const retry = await fetch(`${API_BASE}${path}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...options?.headers,
        },
        ...options,
      });
      if (retry.ok) return retry.json() as Promise<T>;
    }

    // Refresh failed — session truly expired
    sessionExpiredHandler?.();
    throw new Error("Session expired");
  }

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

/* ── Auth — all routes go through Next.js BFF (sets httpOnly cookies) ─── */

export const authApi = {
  login: (tenantId: string, email: string, password: string) =>
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tenantId, email, password }),
    }),

  register: (email: string, password: string, displayName: string) =>
    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, displayName }),
    }),

  logout: () =>
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }),

  me: () =>
    fetch("/api/auth/me", { credentials: "include" }).then((r) => {
      if (!r.ok) throw new Error("Not authenticated");
      return r.json() as Promise<{ userId: string; email: string; displayName: string; tenantId: string; permissions: string[] }>;
    }),
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
    const controller = new AbortController();

    const startStream = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/runs/${runId}/stream`, {
          signal: controller.signal,
          credentials: "include",
          headers: {
            "Accept": "text/event-stream",
            "X-Requested-With": "XMLHttpRequest",
          },
        });

        if (!response.ok) {
          throw new Error(`SSE HTTP error: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body available for streaming");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data:")) {
              const dataContent = trimmed.substring(5).trim();
              if (dataContent) {
                try {
                  onEvent(JSON.parse(dataContent));
                } catch (parseErr) {
                  // Ignore parse errors from partial lines
                }
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        onError?.(err as Error);
      }
    };

    startStream();

    return () => {
      controller.abort();
    };
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

  createDataset: (name: string, description?: string, owner?: string, tags?: string[]) =>
    fetchJson<Dataset>("/api/v1/datasets", {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        source: "manual",
        owner: owner || "platform",
        tags: tags ? Object.fromEntries(tags.map((t) => [t, "true"])) : {},
      }),
    }),

  importDatasetJsonl: (datasetId: string, jsonLines: string[]) =>
    fetchJson<void>(`/api/v1/datasets/${datasetId}/import-jsonl`, {
      method: "POST",
      body: JSON.stringify(jsonLines),
    }),

  addDatasetItem: (datasetId: string, input: string, expectedOutput: string) =>
    fetchJson<void>(`/api/v1/datasets/${datasetId}/items`, {
      method: "POST",
      body: JSON.stringify({ input, expectedOutput, metadata: {} }),
    }),

  listDatasetItems: (datasetId: string, page = 0, size = 50) =>
    fetchJson<PagedResult<DatasetItem>>(`/api/v1/datasets/${datasetId}/items${qs({ page, size })}`),

  /* ── Evaluators ─────────────────────────────────────────── */

  listEvaluators: () =>
    fetchJson<{ evaluator: Evaluator; score24h: number }[]>("/api/v1/evaluators").then((list) =>
      list.map((item) => ({ ...item.evaluator, score24h: item.score24h }))
    ),

  createEvaluator: (body: {
    name: string;
    kind: string;
    description?: string;
    config: Record<string, unknown>;
  }) => fetchJson<Evaluator>("/api/v1/evaluators", {
    method: "POST",
    body: JSON.stringify(body),
  }),

  listEvalLoops: () => fetchJson<any[]>("/api/v1/eval-loops"),

  createEvalLoop: (body: {
    agentId: string;
    evaluatorId: string;
    samplingRate: number;
    alertThreshold: number;
  }) => fetchJson<any>("/api/v1/eval-loops", {
    method: "POST",
    body: JSON.stringify(body),
  }),

  toggleEvalLoop: (loopId: string, status: "ACTIVE" | "PAUSED") =>
    fetchJson<any>(`/api/v1/eval-loops/${loopId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  deleteEvalLoop: (loopId: string) =>
    fetchJson<void>(`/api/v1/eval-loops/${loopId}`, {
      method: "DELETE",
    }),

  getRunEvaluations: (runId: string) =>
    fetchJson<RunEvaluation[]>(`/api/v1/runs/${runId}/evaluations`),

  replayRun: (originalRunId: string, fromCheckpointSequence = 1, stateOverrides: Record<string, unknown> = {}) =>
    fetchJson<{ runId: string }>("/api/v1/replay", {
      method: "POST",
      body: JSON.stringify({ originalRunId, fromCheckpointSequence, stateOverrides }),
    }),

  /* ── Alerts ─────────────────────────────────────────────── */

  listAlertEvents: (page = 0, size = 20) =>
    fetchJson<PagedResult<AlertEvent>>(`/api/v1/alerts/events${qs({ page, size })}`),

  listAlertRules: (page = 0, size = 20) =>
    fetchJson<PagedResult<AlertRule>>(`/api/v1/alerts/rules${qs({ page, size })}`),

  resolveAlertEvent: (eventId: string) =>
    fetchJson<void>(`/api/v1/alerts/events/${eventId}/resolve`, { method: "POST" }),

  createAlertRule: (body: {
    name: string;
    conditionExpr: string;
    threshold: number;
    severity: "error" | "warning" | "info";
    webhookUrl?: string;
    email?: string;
    cooldownSeconds?: number;
  }) =>
    fetchJson<AlertRule>("/api/v1/alerts/rules", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /* ── Settings ───────────────────────────────────────────── */

  getRetentionPolicies: () => fetchJson<RetentionPolicy[]>("/api/v1/retention-policies"),

  /* ── Prompts ────────────────────────────────────────────── */

  listPromptVersions: (page = 0, size = 20) =>
    fetchJson<PagedResult<PromptVersion>>(`/api/v1/prompts${qs({ page, size })}`),

  createPromptVersion: (body: {
    name: string;
    content: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    createdBy?: string;
  }) =>
    fetchJson<PromptVersion>("/api/v1/prompts", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getPromptVersion: (versionId: string) =>
    fetchJson<PromptVersion>(`/api/v1/prompts/${versionId}`),

  deletePromptVersion: (versionId: string) =>
    fetchJson<void>(`/api/v1/prompts/${versionId}`, { method: "DELETE" }),

  addPromptTag: (versionId: string, tagName: string) =>
    fetchJson<PromptTag>(`/api/v1/prompts/${versionId}/tags`, {
      method: "POST",
      body: JSON.stringify({ tagName }),
    }),

  removePromptTag: (versionId: string, tagName: string) =>
    fetchJson<void>(`/api/v1/prompts/${versionId}/tags/${tagName}`, { method: "DELETE" }),

  createPromptAbTest: (body: { datasetId: string; promptAId: string; promptBId: string }) =>
    fetchJson<PromptAbTest>("/api/v1/prompts/ab-tests", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listPromptAbTests: (page = 0, size = 20) =>
    fetchJson<PagedResult<PromptAbTest>>(`/api/v1/prompts/ab-tests${qs({ page, size })}`),

  executePromptAbTest: (testId: string) =>
    fetchJson<any>(`/api/v1/prompts/ab-tests/${testId}/execute`, { method: "POST" }),

  /* ── Playground ─────────────────────────────────────────── */

  executePlayground: (body: {
    promptContent: string;
    model?: string;
    variables?: Record<string, string>;
  }) =>
    fetchJson<PlaygroundResult>("/api/v1/playground/execute", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /* ── RAG Analytics ──────────────────────────────────────── */

  getRagMetrics: (window?: string, collection?: string) =>
    fetchJson<RagMetrics>(`/api/v1/rag/metrics${qs({ window, collection })}`),

  getRagTrend: (window?: string, granularity?: string, collection?: string) =>
    fetchJson<RagTrendPoint[]>(`/api/v1/rag/trend${qs({ window, granularity, collection })}`),

  listRagQueries: (params?: { window?: string; collection?: string; page?: number; size?: number }) =>
    fetchJson<{ items: RagQueryEntry[]; total: number; page: number; size: number }>(
      `/api/v1/rag/queries${qs(params)}`
    ),

  getRagQuery: (queryId: string) =>
    fetchJson<RagQueryDetail>(`/api/v1/rag/queries/${queryId}`),

  getRagCollections: (window?: string) =>
    fetchJson<{ collection: string; query_count: number; avg_latency_ms: number; avg_precision: number; avg_faithfulness: number }[]>(
      `/api/v1/rag/collections${qs({ window })}`
    ),

  getRagClusters: (window?: string, collection?: string) =>
    fetchJson<RagCluster[]>(`/api/v1/rag/clusters${qs({ window, collection })}`),

  getRagDrift: (window?: string, collection?: string) =>
    fetchJson<RagDriftSnapshot[]>(`/api/v1/rag/drift${qs({ window, collection })}`),

  /* ── Audit Logs ─────────────────────────────────────────── */

  listAuditLogs: (page = 0, size = 20) =>
    fetchJson<PagedResult<AuditLogEntry>>(`/api/v1/audit-logs${qs({ page, size })}`),
};
