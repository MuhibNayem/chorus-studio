/* ── Core telemetry types ─────────────────────────────────── */

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface Run {
  runId: string;
  framework: string;
  agentId: string;
  model: string | null;
  startTime: string;
  endTime: string | null;
  status: "RUNNING" | "SUCCESS" | "ERROR" | "CANCELLED";
  tags: Record<string, string>;
  metadata: Record<string, unknown>;
  totalTokens: number;
  totalCost: number;
  latencyMs: number;
  mix?: [string, number][];
}

export interface Span {
  spanId: string;
  runId: string;
  parentSpanId: string | null;
  spanName: string;
  kind: "INTERNAL" | "SERVER" | "CLIENT" | "PRODUCER" | "CONSUMER";
  spanType?: "llm" | "tool" | "rag" | "guardrail" | "default";
  startTime: string;
  endTime: string | null;
  firstTokenAt?: string | null;
  attributes: Record<string, unknown>;
  events: SpanEvent[];
  status: "UNSET" | "OK" | "ERROR";
}

export interface SpanEvent {
  name: string;
  timestamp: string;
  attributes: Record<string, unknown>;
}

export interface LlmCall {
  callId: string;
  spanId: string;
  runId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  prompt: string | null;
  completion: string | null;
  messages?: LlmMessage[];
  finishReasons: string[];
}

export interface LlmMessage {
  role: string;
  text: string;
}

export interface ToolCall {
  callId: string;
  spanId: string;
  runId: string;
  toolName: string;
  args: string | null;
  result: string | null;
  latencyMs: number;
  error: string | null;
}

export interface ProvenanceEntry {
  entryId: string;
  runId: string;
  agentId: string;
  decisionType: string;
  inputState: string | null;
  reasoning: string | null;
  output: string | null;
  parentIds: string[];
  timestamp: string;
  metadata: Record<string, unknown>;
}

/* ── Dashboard metrics ────────────────────────────────────── */

export interface DashboardMetrics {
  totalRuns: number;
  totalTokens: number;
  totalCost: number;
  avgLatencyMs: number;
  p95LatencyMs?: number;
  errorRate?: number;
  runsDelta?: number;
  tokensDelta?: number;
  costDelta?: number;
  latencyDelta?: number;
  runsSpark?: number[];
  tokensSpark?: number[];
  costSpark?: number[];
  latencySpark?: number[];
  runsByDay: { date: string; count: number; tokens: number; cost: number }[];
  topModels: TopModel[];
  topAgents: TopAgent[];
  statusBreakdown: StatusBreakdown[];
  heatmap?: number[][];
}

export interface TopModel {
  model: string;
  provider?: string;
  runs: number;
  tokens: number;
  cost: number;
}

export interface TopAgent {
  agentId: string;
  framework?: string;
  runs: number;
  tokens: number;
  cost: number;
  p95?: number;
  errors?: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  pct?: number;
}

/* ── Agents ───────────────────────────────────────────────── */

export interface Agent {
  agentId: string;
  name: string;
  description?: string;
  framework: string;
  runtime?: string;
  owner: string;
  ownerEmail?: string;
  tags: string[];
  version: string;
  deployedAt?: string;
  deployedBy?: string;
  status: "healthy" | "degraded" | "error";
  health?: number;
  runs24h?: number;
  latencyP50?: number;
  latencyP95?: number;
  latencyP99?: number;
  cost24h?: number;
  errors24h?: number;
  errorRate?: number;
  repo?: string;
  branch?: string;
}

export interface AgentMetrics {
  runs24hSpark: number[];
  latencySpark: number[];
  costSpark: number[];
  errorSpark: number[];
}

export interface AgentToolUsage {
  name: string;
  calls: number;
  p95: number;
  errRate: number;
}

export interface AgentModelDistribution {
  model: string;
  provider: string;
  pct: number;
  cost: number;
}

export interface AgentDeployment {
  version: string;
  when: string;
  by: string;
  diff: string;
  state: "active" | "past";
}

export interface AgentAlert {
  sev: "error" | "warning";
  title: string;
  when: string;
}

/* ── Models ───────────────────────────────────────────────── */

export interface ModelMetrics {
  model: string;
  provider: string;
  runs: number;
  tokens: number;
  cost: number;
}

/* ── Datasets ─────────────────────────────────────────────── */

export interface Dataset {
  datasetId: string;
  name: string;
  description?: string;
  examples: number;
  updated: string;
  owner: string;
  tags: string[];
}

/* ── Evaluators ───────────────────────────────────────────── */

export interface Evaluator {
  evaluatorId: string;
  name: string;
  kind: "llm-judge" | "rule" | "regex";
  description?: string;
  score24h?: number;
  runs?: number;
}

export interface RunEvaluation {
  evaluationId: string;
  runId: string;
  evaluatorId: string;
  evaluatorName?: string;
  score: number;
  passed: boolean;
  details?: Record<string, unknown>;
}

/* ── Alerts ───────────────────────────────────────────────── */

export interface AlertEvent {
  eventId: string;
  ruleId: string;
  ruleName?: string;
  severity: "error" | "warning" | "info";
  title: string;
  sub: string;
  evt: "firing" | "resolved";
  when: string;
}

export interface AlertRule {
  ruleId: string;
  name: string;
  conditionExpr: string;
  threshold: number;
  severity: "error" | "warning" | "info";
  webhookUrl?: string;
  email?: string;
  cooldownSeconds: number;
}

/* ── Settings / Retention ─────────────────────────────────── */

export interface RetentionPolicy {
  tier: string;
  duration: string;
  pct: number;
}

export interface Setting {
  key: string;
  value: string;
  description?: string;
}

/* ── Filters ──────────────────────────────────────────────── */

export interface RunFilters {
  framework?: string;
  agentId?: string;
  model?: string;
  status?: string;
  from?: string;
  to?: string;
  search?: string;
}
