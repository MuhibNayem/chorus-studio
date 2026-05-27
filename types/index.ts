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

export interface DatasetItem {
  itemId: string;
  datasetId: string;
  input: string;
  expectedOutput?: string;
  metadata: Record<string, any>;
  tags: Record<string, string>;
  createdAt: string;
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

export type ChannelType = "SLACK" | "TEAMS" | "PAGERDUTY" | "WEBHOOK" | "EMAIL";

export interface NotificationChannel {
  channelId: string;
  tenantId: string;
  name: string;
  channelType: ChannelType;
  config: Record<string, unknown>;
  enabled: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationDelivery {
  deliveryId: string;
  eventId: string;
  channelId: string;
  status: "pending" | "sent" | "failed" | "dlq";
  attemptCount: number;
  lastError?: string;
  sentAt?: string;
  createdAt: string;
}

/* ── Settings / Retention ─────────────────────────────────── */

export interface RetentionPolicy {
  policyId: string;
  tier: string;
  resourceType: string;
  retentionDays: number;
  duration: string;
  pct: number;
  archiveEnabled?: boolean;
  archiveLocation?: string;
}

export interface ExportConfig {
  configId?: string;
  endpointUrl?: string;
  region?: string;
  bucketName?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  pathPrefix?: string;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  from: string;
  useTls: boolean;
  enabled: boolean;
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

/* ── Prompts ──────────────────────────────────────────────── */

export interface PromptVersion {
  versionId: string;
  name: string;
  content: string;
  model: string | null;
  temperature: number | null;
  maxTokens: number | null;
  createdBy: string | null;
  createdAt: string;
  tags?: string[];
}

export interface PromptTag {
  tagId: string;
  versionId: string;
  tagName: string;
}

export interface PromptAbTest {
  testId: string;
  datasetId: string;
  promptAId: string;
  promptBId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  winnerId: string | null;
  pValue: number | null;
  summaryMetrics: Record<string, any> | null;
  createdAt: string;
}

/* ── Playground ───────────────────────────────────────────── */

export interface PlaygroundResult {
  output: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

/* ── RAG Metrics ──────────────────────────────────────────── */

export interface RagMetrics {
  queryCount: number;
  avgContextPrecision: number;
  avgContextRecall: number;
  avgFaithfulness: number;
  avgAnswerRelevancy: number;
  hitRate: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  avgChunkCount: number;
  latencyDistribution: { bucket: string; count: number }[];
  topQueries: {
    query: string;
    count: number;
    avg_score: number;
    avg_faithfulness: number;
    avg_latency_ms: number;
  }[];
  collections: {
    collection: string;
    query_count: number;
    avg_latency_ms: number;
    avg_precision: number;
    avg_faithfulness: number;
  }[];
}

export interface RagTrendPoint {
  period: string;
  query_count: number;
  avg_precision: number;
  avg_recall: number;
  avg_faithfulness: number;
  avg_answer_relevancy: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
}

export interface RagCluster {
  clusterId: string;
  label: string;
  representativeQuery: string;
  memberCount: number;
  totalQueryCount: number;
  members: string[];
}

export interface RagDriftSnapshot {
  snapshot_id: string;
  collection: string;
  period_start: string;
  period_end: string;
  mean_cosine_shift: number;
  query_volume_delta: number;
  precision_delta: number;
  alert_level: "none" | "warning" | "critical";
}

export interface RagQueryEntry {
  queryId: string;
  runId: string;
  spanId: string;
  query: string;
  collection: string | null;
  latencyMs: number;
  chunkCount: number;
  topK: number;
  contextPrecision: number | null;
  contextRecall: number | null;
  faithfulness: number | null;
  answerRelevancy: number | null;
  metadata: Record<string, unknown>;
}

export interface RagQueryDetail extends RagQueryEntry {
  retrievedChunks: string[];
  similarityScores: number[];
}

/* ── Enterprise / SSO ────────────────────────────────────── */

export interface RoleMapping {
  claim: string;
  value: string;
  role: string;
}

export interface SsoProvider {
  id?: string;
  providerName: string;
  protocol: "SAML" | "OIDC";
  enabled: boolean;
  // SAML-specific
  entityId?: string;
  signOnUrl?: string;
  signingCertThumbprint?: string;
  metadataUrl?: string;
  acsUrl?: string;
  // OIDC-specific
  clientId?: string;
  /** Only sent on create/update — never returned by the server */
  clientSecret?: string;
  issuerUri?: string;
  scopes?: string[];
  /** SAML: direct PEM cert — only sent on create/update */
  idpCertPem?: string;
  /** SAML: metadata XML — sent separately via metadata-upload endpoint */
  idpMetadataXml?: string;
  // Common
  defaultRole: string;
  roleMappings: RoleMapping[];
  allowedDomains: string[];
  attributeMappings: Record<string, string>;
  hasCertPem: boolean;
  hasMetadataXml: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderHealth {
  id?: string;
  providerName: string;
  protocol: string;
  status: "ok" | "error" | "disabled" | "idle";
  metadataUrl?: string;
  message?: string;
}

export interface SpMetadata {
  acsUrl: string;
  entityId: string;
  scimEndpoint?: string;
  spCertPem?: string;
}

/** @deprecated Use SsoProvider — kept for backward-compatibility with any remaining callers */
export interface SsoConfig {
  provider: string;
  clientId: string;
  issuer: string;
  samlEntityId: string;
  samlEntrypoint: string;
  scimEnabled: boolean;
}

/** @deprecated Use ProviderHealth */
export interface SsoHealth {
  status: "ok" | "error" | "idle";
  sessionCount?: number;
  certExpiry?: string;
  lastVerified?: string;
  message?: string;
}

/* ── PII Redaction ────────────────────────────────────────── */

export interface PiiRule {
  ruleId: string;
  name: string;
  category: "financial" | "identity" | "technical" | "custom";
  regexPattern: string;
  replacement: string;
  enabled: boolean;
  severity: "high" | "medium" | "low";
}

export interface PiiConfig {
  masterEnabled: boolean;
  rules: PiiRule[];
}

/* ── Platform / API Keys ──────────────────────────────────── */

export interface PlatformInfo {
  configuredPublicUrl: string | null;
  resolvedPublicUrl: string;
  otlpHttpUrl: string;
  otlpGrpcEndpoint: string | null;
  grpcPort: number;
  grpcEnabled: boolean;
  version: string;
  storageBackend: string;
  ingestModes: string;
}

export interface ApiKeyInfo {
  keyHash: string;
  name: string;
  keyPrefix: string | null;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  expired: boolean;
}

export interface ApiKeyCreated {
  keyHash: string;
  name: string;
  keyPrefix: string;
  key: string;
  scopes: string[];
  createdAt: string;
}

/* ── Audit Logs ───────────────────────────────────────────── */

export interface AuditLogEntry {
  logId: string;
  tenantId: string;
  userId: string | null;
  username: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  details: Record<string, unknown>;
  createdAt: string;
}

