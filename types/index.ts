export interface Run {
  runId: string;
  framework: string;
  agentId: string;
  model: string | null;
  startTime: string;
  endTime: string | null;
  status: "RUNNING" | "SUCCESS" | "ERROR";
  tags: Record<string, string>;
  metadata: Record<string, unknown>;
  totalTokens: number;
  totalCost: number;
  latencyMs: number;
}

export interface Span {
  spanId: string;
  runId: string;
  parentSpanId: string | null;
  spanName: string;
  kind: "INTERNAL" | "SERVER" | "CLIENT" | "PRODUCER" | "CONSUMER";
  startTime: string;
  endTime: string | null;
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
  finishReasons: string[];
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

export interface DashboardMetrics {
  totalRuns: number;
  totalTokens: number;
  totalCost: number;
  avgLatencyMs: number;
  runsByDay: { date: string; count: number; tokens: number; cost: number }[];
  topModels: { model: string; calls: number; tokens: number; cost: number }[];
  topAgents: { agentId: string; runs: number; tokens: number; cost: number }[];
  statusBreakdown: { status: string; count: number }[];
}

export interface RunFilters {
  framework?: string;
  agentId?: string;
  model?: string;
  status?: string;
  from?: string;
  to?: string;
  search?: string;
}
