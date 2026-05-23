/* ── Mock data for Chorus Observe (overhauled prototype) ──
   Shapes mirror chorus-studio/types/index.ts but with more
   texture for the redesigned UI: streaming runs, richer
   span trees, multi-frame metrics. */

const formatTokens = (n) => {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + "k";
  return String(n);
};
const formatCost = (n) => {
  if (n == null) return "—";
  if (n < 0.01) return "$" + n.toFixed(4);
  if (n < 1) return "$" + n.toFixed(3);
  return "$" + n.toFixed(2);
};
const formatDuration = (ms) => {
  if (ms == null) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10000 ? 2 : 1)}s`;
  const m = Math.floor(ms / 60_000), s = Math.round((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
};
const formatRel = (iso) => {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  if (diff < 60_000) return `${Math.max(1, Math.floor(diff / 1000))}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
};
const formatHM = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', hour12: false}) +
         '.' + String(d.getMilliseconds()).padStart(3, '0').slice(0,2);
};

/* ── Dashboard / aggregate ──────────────────────────────── */
const DASHBOARD = {
  totalRuns:    128471,
  runsDelta:    +12.4,
  totalTokens:  4_281_900,
  tokensDelta:  +8.2,
  totalCost:    284.27,
  costDelta:    -3.1,
  avgLatencyMs: 2418,
  latencyDelta: +5.4,
  p95LatencyMs: 8412,
  errorRate:    4.76,

  /* Sparkline points (24h, hourly buckets) */
  runsSpark:    [42, 51, 38, 44, 62, 58, 49, 71, 88, 92, 81, 73, 96, 124, 138, 142, 121, 108, 94, 88, 102, 116, 98, 84],
  tokensSpark:  [11, 14, 12, 13, 18, 17, 14, 22, 28, 31, 26, 24, 32, 41, 47, 51, 42, 36, 31, 28, 33, 39, 32, 26],
  costSpark:    [1.2, 1.4, 1.3, 1.5, 1.9, 1.8, 1.5, 2.4, 3.0, 3.3, 2.8, 2.5, 3.4, 4.5, 5.0, 5.4, 4.5, 3.8, 3.3, 3.0, 3.5, 4.1, 3.4, 2.8],
  latencySpark: [2100, 2300, 2200, 2450, 2600, 2700, 2400, 2480, 2350, 2420, 2510, 2480, 2400, 2350, 2300, 2280, 2320, 2400, 2480, 2450, 2410, 2380, 2420, 2390],

  statusBreakdown: [
    { status: 'SUCCESS', count: 121_482, pct: 94.55 },
    { status: 'ERROR',   count:   6_124, pct: 4.77 },
    { status: 'RUNNING', count:     865, pct: 0.68 },
  ],

  /* 24×7 heatmap (rows = days, cols = hours, values 0-4) */
  heatmap: Array.from({length: 7}, (_, day) =>
    Array.from({length: 24}, (_, hr) => {
      if (hr < 5 || hr > 22) return Math.random() < 0.5 ? 0 : 1;
      const peak = 14 + Math.sin(day) * 2;
      const dist = Math.abs(hr - peak);
      const v = Math.max(0, 4 - Math.floor(dist * 0.8) + (Math.random() > 0.7 ? 1 : 0));
      return Math.min(4, v);
    })
  ),

  /* Top agents */
  topAgents: [
    { id: 'ag_observability_v2', framework: 'LangGraph', runs: 38_412, cost: 84.20, p95: 4_120, errors: 124 },
    { id: 'ag_router_v3',        framework: 'Chorus',    runs: 24_180, cost: 41.80, p95: 2_840, errors: 41  },
    { id: 'ag_research',         framework: 'LangChain', runs: 18_904, cost: 92.40, p95: 14_500,errors: 312 },
    { id: 'ag_eval_judge',       framework: 'LangGraph', runs: 12_412, cost: 12.10, p95: 1_240, errors: 8   },
    { id: 'ag_summariser',       framework: 'Chorus',    runs:  9_240, cost: 24.80, p95: 3_820, errors: 24  },
  ],

  /* Top models */
  topModels: [
    { model: 'gpt-4o-mini',       provider: 'openai',    runs: 71_240, tokens: 2.1e6,  cost: 41.20 },
    { model: 'claude-3-5-sonnet', provider: 'anthropic', runs: 24_810, tokens: 1.8e6,  cost: 184.20 },
    { model: 'gpt-4o',            provider: 'openai',    runs: 18_240, tokens: 0.81e6, cost: 38.42 },
    { model: 'gemini-2.0-flash',  provider: 'google',    runs:  8_240, tokens: 0.21e6, cost: 6.18 },
  ],
};

/* Generate live tick strip (last ~80 runs) */
const TICKS = Array.from({length: 80}, (_, i) => {
  const r = Math.random();
  if (i > 76 && r < 0.6) return 'r';     /* running, very recent */
  if (r < 0.045) return 'e';
  return 's';
});

/* ── Runs list ──────────────────────────────────────────── */
const RUN_IDS = [
  '8f3c2b1a-77e4-4811-a3e1-bd31c4fa61cc',
  '2d1e4a09-c84a-4f5d-8b71-3e017f2cbe44',
  '91a3f0c1-8d77-49e2-aa64-114c2db21f30',
  '3b7c9e2d-1f44-4a18-9eb3-77f8024f9d3a',
  '5e4a8c0d-2b91-4e88-bf12-8014f8e6cb20',
  '6d8b3c0e-7f44-4a31-bb22-4e0a72b14e80',
  'a012cb44-7e51-4b08-89a4-5fa172c4dac2',
  'c204b18e-94c7-4d28-b6a1-7702dc81f4a0',
  '4f7e3a91-6c22-4d80-9ab4-1f038c4bd221',
  'b1e4a209-3f0d-4cb8-8a17-fe10d24cfa30',
  '7c2d5e8a-91ab-44e3-b7c8-2014e2fb31a8',
  'e9a4c102-44b8-4d77-8a09-2cb19f4080cc',
];

const RUNS = [
  { id: RUN_IDS[0], status: 'SUCCESS', framework: 'LangGraph',  agent: 'ag_observability_v2', model: 'gpt-4o-mini',       tokens: 8421,  cost: 0.042, latency: 2418, started: new Date(Date.now() - 1000*22).toISOString(),  spans: 7, tools: 2, llm: 2, mix: [['llm',24],['tool',8],['rag',12],['llm',48],['guardrail',6],['tool',2]] },
  { id: RUN_IDS[1], status: 'ERROR',   framework: 'LangChain',  agent: 'ag_research',         model: 'claude-3-5-sonnet', tokens: 12480, cost: 0.187, latency: 8124, started: new Date(Date.now() - 1000*60*8).toISOString(), spans: 12, tools: 5, llm: 4, mix: [['llm',18],['tool',6],['rag',8],['llm',26],['tool',9],['llm',33]] },
  { id: RUN_IDS[2], status: 'RUNNING', framework: 'Chorus',     agent: 'ag_router_v3',        model: 'gpt-4o',            tokens: 4012,  cost: 0.048, latency: 1840, started: new Date(Date.now() - 1000*60*2).toISOString(), spans: 4, tools: 1, llm: 1, mix: [['llm',32],['tool',12],['rag',4]] },
  { id: RUN_IDS[3], status: 'SUCCESS', framework: 'LangGraph',  agent: 'ag_observability_v2', model: 'gpt-4o-mini',       tokens: 6892,  cost: 0.034, latency: 1812, started: new Date(Date.now() - 1000*60*9).toISOString(), spans: 6, tools: 1, llm: 2, mix: [['llm',22],['tool',6],['llm',38],['guardrail',4]] },
  { id: RUN_IDS[4], status: 'SUCCESS', framework: 'Chorus',     agent: 'ag_router_v3',        model: 'gpt-4o',            tokens: 3724,  cost: 0.045, latency: 2104, started: new Date(Date.now() - 1000*60*14).toISOString(), spans: 5, tools: 2, llm: 1, mix: [['llm',38],['tool',10],['tool',8]] },
  { id: RUN_IDS[5], status: 'SUCCESS', framework: 'LangChain',  agent: 'ag_research',         model: 'claude-3-5-sonnet', tokens: 18420, cost: 0.276, latency: 14_812, started: new Date(Date.now() - 1000*60*22).toISOString(), spans: 18, tools: 7, llm: 5, mix: [['llm',12],['rag',14],['tool',8],['llm',22],['tool',6],['llm',28],['tool',4],['llm',8]] },
  { id: RUN_IDS[6], status: 'SUCCESS', framework: 'LangGraph',  agent: 'ag_eval_judge',       model: 'gpt-4o-mini',       tokens: 2104,  cost: 0.011, latency: 940,    started: new Date(Date.now() - 1000*60*38).toISOString(), spans: 3, tools: 0, llm: 1, mix: [['llm',82],['guardrail',12]] },
  { id: RUN_IDS[7], status: 'ERROR',   framework: 'Chorus',     agent: 'ag_router_v3',        model: 'gpt-4o',            tokens: 880,   cost: 0.011, latency: 320,    started: new Date(Date.now() - 1000*60*51).toISOString(), spans: 2, tools: 0, llm: 1, mix: [['llm',100]] },
  { id: RUN_IDS[8], status: 'SUCCESS', framework: 'LangGraph',  agent: 'ag_summariser',       model: 'gpt-4o-mini',       tokens: 5210,  cost: 0.026, latency: 1240,   started: new Date(Date.now() - 1000*60*72).toISOString(), spans: 5, tools: 1, llm: 2, mix: [['llm',38],['tool',12],['llm',42]] },
  { id: RUN_IDS[9], status: 'SUCCESS', framework: 'Chorus',     agent: 'ag_router_v3',        model: 'gemini-2.0-flash',  tokens: 1820,  cost: 0.004, latency: 612,    started: new Date(Date.now() - 1000*60*91).toISOString(), spans: 4, tools: 1, llm: 1, mix: [['llm',56],['tool',14]] },
  { id: RUN_IDS[10],status: 'SUCCESS', framework: 'LangGraph',  agent: 'ag_observability_v2', model: 'gpt-4o-mini',       tokens: 7240,  cost: 0.036, latency: 2080,   started: new Date(Date.now() - 1000*60*102).toISOString(), spans: 7, tools: 2, llm: 2, mix: [['llm',24],['tool',9],['rag',8],['llm',44],['guardrail',5]] },
  { id: RUN_IDS[11],status: 'SUCCESS', framework: 'LangChain',  agent: 'ag_research',         model: 'claude-3-5-sonnet', tokens: 14820, cost: 0.222, latency: 11_412,  started: new Date(Date.now() - 1000*60*138).toISOString(), spans: 14, tools: 6, llm: 4, mix: [['llm',16],['rag',18],['tool',8],['llm',22],['tool',6],['llm',24]] },
];

/* ── Span tree for RUNS[0] ──────────────────────────────── */
const RUN_SPANS = (() => {
  const t0 = new Date(RUNS[0].started).getTime();
  const t = (off) => new Date(t0 + off).toISOString();
  return [
    { id: 's_root',  parent: null,     name: 'agent.run',                  status: 'OK', start: t(0),    end: t(2418), type: 'default',  attrs: { 'gen_ai.system': 'openai', 'agent.id': 'ag_observability_v2', 'agent.framework': 'langgraph', 'run.tokens.total': 8421 } },
    { id: 's_plan',  parent: 's_root', name: 'llm.plan',                   status: 'OK', start: t(60),   end: t(520),  type: 'llm',      attrs: { 'gen_ai.model': 'gpt-4o-mini', 'tokens.input': 612, 'tokens.output': 142, 'cost.usd': 0.0011 } },
    { id: 's_tool1', parent: 's_root', name: 'tool.search_traces',         status: 'OK', start: t(540),  end: t(720),  type: 'tool',     attrs: { 'tool.name': 'search_traces', 'tool.args': '{"window":"1h","limit":25}' } },
    { id: 's_rag',   parent: 's_root', name: 'rag.retrieve',               status: 'OK', start: t(740),  end: t(910),  type: 'rag',      attrs: { 'rag.k': 8, 'rag.collection': 'incident_postmortems_v3' } },
    { id: 's_chat',  parent: 's_root', name: 'llm.chat',                   status: 'OK', start: t(940),  end: t(2240), type: 'llm',      attrs: { 'gen_ai.model': 'gpt-4o-mini', 'tokens.input': 4220, 'tokens.output': 1844, 'cost.usd': 0.0309, 'temperature': 0.2 }, firstToken: t(1180) },
    { id: 's_guard', parent: 's_chat', name: 'guardrail.toxicity',         status: 'OK', start: t(2250), end: t(2310), type: 'guardrail',attrs: { 'guard.policy': 'toxicity@v3', 'guard.score': 0.012 } },
    { id: 's_tool2', parent: 's_root', name: 'tool.format_report',         status: 'OK', start: t(2320), end: t(2410), type: 'tool',     attrs: { 'tool.name': 'format_report', 'tool.format': 'markdown' } },
  ];
})();

const LLM_CALLS = [
  { id: 'l1', spanId: 's_plan', model: 'gpt-4o-mini', provider: 'openai',
    input: 612, output: 142, cost: 0.0011, latency: 460,
    messages: [
      { role: 'system',  text: 'You are an observability copilot for an AI platform team. Plan a series of tool calls to answer the user.' },
      { role: 'user',    text: 'Summarise the slowest agent runs in the last hour and flag any guardrail failures.' },
    ],
    completion: "I'll start by querying recent runs ordered by latency, then cross-reference each with guardrail spans and present a markdown table.",
  },
  { id: 'l2', spanId: 's_chat', model: 'gpt-4o-mini', provider: 'openai',
    input: 4220, output: 1844, cost: 0.0309, latency: 1300,
    messages: [
      { role: 'system', text: 'Format the trace findings as a markdown report with sections: Summary, Slowest Runs, Guardrail Activity.' },
      { role: 'user',   text: 'data: { runs: [...] }' },
    ],
    completion: "## Slowest runs (last 1h)\n\n| Run | Latency | Model | Guardrail |\n|---|---|---|---|\n| run_2d1e… | 8.12s | claude-3-5-sonnet | toxicity@v3 ✓ |\n| run_6d8b… | 14.81s | claude-3-5-sonnet | toxicity@v3 ✓ |\n\n**Summary** — both slow runs are research agent calls against Sonnet. P95 is 2.1× target.",
  },
];

const TOOL_CALLS = [
  { id: 't1', spanId: 's_tool1', name: 'search_traces', latency: 180, ok: true,
    args:   { window: '1h', orderBy: 'latencyMs', limit: 25 },
    result: [{ runId: 'run_2d1e…', latencyMs: 8124, model: 'claude-3-5-sonnet' }, { runId: 'run_6d8b…', latencyMs: 14_812, model: 'claude-3-5-sonnet' }, '…3 more' ],
  },
  { id: 't2', spanId: 's_tool2', name: 'format_report', latency: 90, ok: true,
    args:   { format: 'markdown', include: ['slowest', 'guardrails'] },
    result: '"## Slowest runs (last 1h)…"',
  },
];

/* DAG nodes for provenance view */
const DAG_NODES = [
  { id: 'plan',   label: 'llm.plan',          type: 'llm',       x: 40,  y: 24,  meta: '460ms · 754 tok' },
  { id: 'search', label: 'tool.search_traces',type: 'tool',      x: 250, y: 24,  meta: '180ms · 25 hits' },
  { id: 'rag',    label: 'rag.retrieve',      type: 'rag',       x: 250, y: 130, meta: '170ms · k=8' },
  { id: 'chat',   label: 'llm.chat',          type: 'llm',       x: 480, y: 80,  meta: '1.3s · 6064 tok' },
  { id: 'guard',  label: 'guardrail.toxicity',type: 'guardrail', x: 710, y: 80,  meta: '60ms · pass' },
];
const DAG_EDGES = [
  ['plan', 'search'],
  ['plan', 'rag'],
  ['search', 'chat'],
  ['rag', 'chat'],
  ['chat', 'guard'],
];

/* Datasets */
const DATASETS = [
  { id: 'ds_eval_router_v3',  name: 'router-v3 regression',   examples: 482,  updated: '2h ago',  owner: 'platform',  tags: ['regression', 'router'] },
  { id: 'ds_guardrail_red',   name: 'guardrail-red-team',     examples: 1240, updated: '1d ago',  owner: 'safety',    tags: ['safety', 'jailbreak'] },
  { id: 'ds_obs_smoke',       name: 'observability-smoke',    examples: 64,   updated: '5h ago',  owner: 'platform',  tags: ['smoke'] },
  { id: 'ds_research_long',   name: 'research-long-context',  examples: 218,  updated: '3d ago',  owner: 'research',  tags: ['long-context'] },
];

/* Evaluators */
const EVALUATORS = [
  { id: 'ev_helpfulness',  name: 'helpfulness',         score: 0.84, runs: 12_420, kind: 'llm-judge' },
  { id: 'ev_groundedness', name: 'groundedness',        score: 0.91, runs: 12_420, kind: 'llm-judge' },
  { id: 'ev_latency_sla',  name: 'latency < 3s',        score: 0.78, runs: 12_420, kind: 'rule' },
  { id: 'ev_no_pii',       name: 'no PII in completion',score: 0.99, runs: 12_420, kind: 'regex' },
];

/* ── Agent details ───────────────────────────────────────
   Per-agent metadata: deployments, tool inventory, model
   distribution, version history, owners, latency sparks. */

const _genSpark = (base, jitter, len) =>
  Array.from({length: len}, (_, i) => Math.max(0, Math.round(base + Math.sin(i * 0.5) * jitter + (Math.random() - 0.5) * jitter * 0.6)));

const AGENTS = [
  {
    id: 'ag_observability_v2',
    name: 'Observability Copilot',
    description: 'Internal copilot that answers questions about agent traces, costs, and guardrails.',
    framework: 'LangGraph',
    runtime: 'chorus-engine4j 1.4.2',
    owner: 'platform',
    ownerEmail: 'platform@acme.io',
    tags: ['copilot', 'internal', 'observability'],
    version: 'v2.4.0',
    deployedAt: new Date(Date.now() - 1000 * 60 * 60 * 32).toISOString(),
    deployedBy: 'maya.nakamura',
    status: 'healthy',
    health: 99.6,
    runs24h: 38_412,
    runs24hSpark: _genSpark(1600, 700, 24),
    latencyP50: 1_840,
    latencyP95: 4_120,
    latencyP99: 7_240,
    latencySpark: _genSpark(2400, 600, 24),
    cost24h: 84.20,
    costSpark: _genSpark(3.5, 1.2, 24),
    errors24h: 124,
    errorRate: 0.32,
    errorSpark: _genSpark(5, 4, 24),
    repo: 'github.com/acme/observability-copilot',
    branch: 'main@a3f12c',
    tools: [
      { name: 'search_traces',    calls: 28_412, p95: 240, errRate: 0.01 },
      { name: 'fetch_run',        calls: 18_240, p95: 80,  errRate: 0.00 },
      { name: 'format_report',    calls: 12_104, p95: 110, errRate: 0.00 },
      { name: 'compare_runs',     calls:  4_820, p95: 320, errRate: 0.02 },
      { name: 'extract_attrs',    calls:  3_120, p95: 90,  errRate: 0.00 },
    ],
    models: [
      { model: 'gpt-4o-mini',  provider: 'openai',  pct: 78, cost: 41.20 },
      { model: 'gpt-4o',       provider: 'openai',  pct: 18, cost: 38.42 },
      { model: 'claude-haiku', provider: 'anthropic', pct: 4, cost: 4.58 },
    ],
    deployments: [
      { version: 'v2.4.0', when: '32h ago',  by: 'maya.nakamura', diff: '+ tool: compare_runs · prompt v17', state: 'active' },
      { version: 'v2.3.4', when: '4d ago',   by: 'leon.park',     diff: '- fix: format_report markdown table escaping', state: 'past' },
      { version: 'v2.3.3', when: '6d ago',   by: 'maya.nakamura', diff: '+ guardrail: toxicity@v3', state: 'past' },
      { version: 'v2.3.2', when: '11d ago',  by: 'leon.park',     diff: '~ retry policy on tool_use timeouts',   state: 'past' },
      { version: 'v2.3.1', when: '2w ago',   by: 'maya.nakamura', diff: 'prompt v16: tighter system message', state: 'past' },
    ],
    alerts: [
      { sev: 'warning', title: 'p95 latency > 5s on Sonnet calls', when: '18m ago' },
    ],
  },
  {
    id: 'ag_router_v3',
    name: 'Model Router',
    description: 'Routes incoming requests to the cheapest model that meets quality bar.',
    framework: 'Chorus',
    runtime: 'chorus-engine4j 1.4.2',
    owner: 'platform',
    ownerEmail: 'platform@acme.io',
    tags: ['router', 'cost-opt'],
    version: 'v3.1.0',
    deployedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    deployedBy: 'leon.park',
    status: 'healthy',
    health: 99.8,
    runs24h: 24_180,
    runs24hSpark: _genSpark(1000, 400, 24),
    latencyP50: 940, latencyP95: 2_840, latencyP99: 4_120,
    latencySpark: _genSpark(1100, 300, 24),
    cost24h: 41.80, costSpark: _genSpark(1.7, 0.6, 24),
    errors24h: 41, errorRate: 0.17, errorSpark: _genSpark(2, 2, 24),
    repo: 'github.com/acme/model-router',
    branch: 'main@7c8de4',
    tools: [
      { name: 'classify_intent', calls: 18_412, p95: 80,  errRate: 0.00 },
      { name: 'price_lookup',    calls: 24_180, p95: 12,  errRate: 0.00 },
    ],
    models: [
      { model: 'gemini-2.0-flash', provider: 'google',    pct: 62, cost: 4.20 },
      { model: 'gpt-4o-mini',      provider: 'openai',    pct: 32, cost: 18.10 },
      { model: 'claude-haiku',     provider: 'anthropic', pct: 6,  cost: 19.50 },
    ],
    deployments: [
      { version: 'v3.1.0', when: '8h ago', by: 'leon.park',     diff: '+ gemini-2.0-flash routing rule', state: 'active' },
      { version: 'v3.0.4', when: '3d ago', by: 'maya.nakamura', diff: 'tighten classify_intent threshold', state: 'past' },
    ],
    alerts: [],
  },
  {
    id: 'ag_research',
    name: 'Research Agent',
    description: 'Long-context research and summarisation across internal docs + the web.',
    framework: 'LangChain',
    runtime: 'langchain-core 0.3',
    owner: 'research',
    ownerEmail: 'research@acme.io',
    tags: ['research', 'long-context'],
    version: 'v1.8.2',
    deployedAt: new Date(Date.now() - 1000 * 60 * 60 * 90).toISOString(),
    deployedBy: 'kai.ahmed',
    status: 'degraded',
    health: 96.4,
    runs24h: 18_904,
    runs24hSpark: _genSpark(800, 500, 24),
    latencyP50: 6_240,  latencyP95: 14_500, latencyP99: 28_000,
    latencySpark: _genSpark(8200, 3000, 24),
    cost24h: 92.40, costSpark: _genSpark(3.9, 1.4, 24),
    errors24h: 312, errorRate: 1.65, errorSpark: _genSpark(13, 8, 24),
    repo: 'github.com/acme/research-agent',
    branch: 'main@2d1e4a',
    tools: [
      { name: 'web_search',     calls: 24_120, p95: 1_200, errRate: 0.04 },
      { name: 'fetch_url',      calls: 18_410, p95:   840, errRate: 0.03 },
      { name: 'kb_retrieve',    calls: 12_240, p95:   420, errRate: 0.01 },
      { name: 'chunk_summarise',calls:  9_810, p95: 1_840, errRate: 0.02 },
      { name: 'cite_extract',   calls:  6_240, p95:   210, errRate: 0.00 },
    ],
    models: [
      { model: 'claude-3-5-sonnet', provider: 'anthropic', pct: 84, cost: 78.40 },
      { model: 'gpt-4o',            provider: 'openai',    pct: 16, cost: 14.00 },
    ],
    deployments: [
      { version: 'v1.8.2', when: '4d ago', by: 'kai.ahmed', diff: '+ kb_retrieve hybrid bm25/dense', state: 'active' },
    ],
    alerts: [
      { sev: 'error',   title: 'Error rate > 1.5% (last 1h)',           when: '12m ago' },
      { sev: 'warning', title: 'p95 latency > 10s on long_context runs',when: '38m ago' },
    ],
  },
  {
    id: 'ag_eval_judge',
    name: 'LLM Judge',
    description: 'Evaluates completions against rubric prompts for offline + online scoring.',
    framework: 'LangGraph',
    runtime: 'chorus-engine4j 1.4.2',
    owner: 'platform',
    ownerEmail: 'platform@acme.io',
    tags: ['eval', 'offline'],
    version: 'v0.9.1',
    deployedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    deployedBy: 'maya.nakamura',
    status: 'healthy',
    health: 99.9,
    runs24h: 12_412,
    runs24hSpark: _genSpark(500, 200, 24),
    latencyP50: 380, latencyP95: 1_240, latencyP99: 2_100,
    latencySpark: _genSpark(450, 120, 24),
    cost24h: 12.10, costSpark: _genSpark(0.5, 0.15, 24),
    errors24h: 8, errorRate: 0.06, errorSpark: _genSpark(0.3, 0.3, 24),
    repo: 'github.com/acme/eval-judge',
    branch: 'main@a012cb',
    tools: [],
    models: [
      { model: 'gpt-4o-mini', provider: 'openai', pct: 100, cost: 12.10 },
    ],
    deployments: [
      { version: 'v0.9.1', when: '18h ago', by: 'maya.nakamura', diff: 'add rubric: groundedness_v3', state: 'active' },
    ],
    alerts: [],
  },
  {
    id: 'ag_summariser',
    name: 'Summariser',
    description: 'Compresses long transcripts and traces into short briefs.',
    framework: 'Chorus',
    runtime: 'chorus-engine4j 1.4.2',
    owner: 'platform',
    ownerEmail: 'platform@acme.io',
    tags: ['summary'],
    version: 'v1.2.0',
    deployedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    deployedBy: 'leon.park',
    status: 'healthy',
    health: 99.4,
    runs24h: 9_240,
    runs24hSpark: _genSpark(380, 150, 24),
    latencyP50: 1_200, latencyP95: 3_820, latencyP99: 6_100,
    latencySpark: _genSpark(1400, 400, 24),
    cost24h: 24.80, costSpark: _genSpark(1.0, 0.3, 24),
    errors24h: 24, errorRate: 0.26, errorSpark: _genSpark(1, 0.8, 24),
    repo: 'github.com/acme/summariser',
    branch: 'main@5e4a8c',
    tools: [
      { name: 'chunk_text', calls: 9_240, p95: 40, errRate: 0.00 },
    ],
    models: [
      { model: 'gpt-4o-mini', provider: 'openai', pct: 100, cost: 24.80 },
    ],
    deployments: [
      { version: 'v1.2.0', when: '4d ago', by: 'leon.park', diff: '~ chunk strategy: token-aware', state: 'active' },
    ],
    alerts: [],
  },
];

const AGENT_FRAMEWORKS = [
  { id: 'chorus',    name: 'Chorus Engine', sub: 'chorus-engine4j',           snippet: 'chorus' },
  { id: 'langgraph', name: 'LangGraph',     sub: 'langgraph 0.4',             snippet: 'langgraph' },
  { id: 'langchain', name: 'LangChain',     sub: 'langchain-core 0.3',        snippet: 'langchain' },
  { id: 'llamaidx',  name: 'LlamaIndex',    sub: 'llama-index 0.12',          snippet: 'llamaindex' },
  { id: 'crewai',    name: 'CrewAI',        sub: 'crewai 0.8',                snippet: 'crewai' },
  { id: 'custom',    name: 'Custom',        sub: 'Direct OTLP via SDK',       snippet: 'otlp' },
];

Object.assign(window, {
  formatTokens, formatCost, formatDuration, formatRel, formatHM,
  DASHBOARD, TICKS, RUNS, RUN_SPANS, LLM_CALLS, TOOL_CALLS,
  DAG_NODES, DAG_EDGES, DATASETS, EVALUATORS,
  AGENTS, AGENT_FRAMEWORKS,
});
