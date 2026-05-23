# Chorus Studio

<p align="center">
  <img src="public/logo.svg" width="64" height="64" alt="Chorus Studio logo">
  <br>
  <strong>Enterprise observability UI for LLM agents</strong>
</p>

Chorus Studio is the frontend for **Chorus Observe** — a production-grade observability platform for tracing, evaluating, and governing LLM agent systems. Built with Next.js 15, React 19, TypeScript, and Tailwind CSS.

---

## Features

### Authentication & Authorization
- **Self-registration** — New tenants are auto-created on signup; first user becomes admin
- **JWT-based sessions** — Secure Bearer token auth with `localStorage` persistence
- **Login** — Tenant-scoped email/password authentication
- **User menu** — Avatar dropdown with tenant info, permissions, and one-click logout
- **Auth-aware shell** — Login/register pages render without sidebar/topbar chrome

### Dashboard (`/`)
- **Metric rail** — Live runs, tokens, cost, and p95 latency with sparkline trends
- **Live feed** — Real-time run stream with status badges, mini-trace bars, and timestamps
- **Activity heatmap** — 7×24 hourly activity grid (color-coded by volume)
- **Status donut** — Success/error/running breakdown with percentage labels
- **Top agents** — Ranked by runs, cost, latency, and error rate
- **Top models** — Cost and token volume by model/provider

### Runs (`/runs`)
- **Paginated table** — Sortable, filterable list of all agent executions
- **Client-side filtering** — By status, framework, and free-text search
- **Pagination** — Prev/next with page counter
- **Skeleton loaders** — Graceful loading states

### Run Detail (`/runs/[runId]`)
- **Run header** — Status badge, framework, model, agent, and live streaming indicator
- **Feedback** — Thumbs up/down human feedback per run
- **Stats rail** — Tokens, cost, latency, and span count
- **Trace waterfall** — LLM-aware span visualization with color-coded bars (LLM / Tool / Guardrail / RAG)
- **Span inspector** — Click any span to inspect attributes, LLM prompts, tool args, and outputs
- **LLM calls tab** — Full prompt/completion viewer with token counts and cost
- **Tool calls tab** — Tool name, arguments, and result snippets
- **Provenance tab** — Causal decision graph (Chorus Engine runs)
- **Evals tab** — Auto-evaluator scores and pass/fail status
- **Raw tab** — Full JSON run payload
- **Real-time streaming** — SSE-connected live trace updates for running executions

### Agents (`/agents`)
- **Agent directory** — Health status, framework, owner, runs, latency, cost, errors
- **Agent detail** — Overview, runs, deployments, integration snippet, alerts, and settings
- **Metrics sparklines** — Per-agent 24h trends for runs, latency, cost, and error rate
- **Tool usage** — Call volume, p95 latency, and error rate per tool
- **Model distribution** — Percentage and cost breakdown by model
- **Deployment history** — Version timeline with diff summaries
- **Alerts tab** — Firing alerts scoped to this agent
- **Integration snippet** — Copy-paste SDK setup for the agent framework
- **Pause/Resume** — Toggle agent execution state

### Agent Registration (`/agents/register`)
- **Multi-step wizard** — Name, ID, framework, description, owner, tags
- **Validation** — Real-time form validation with error messages

### Datasets (`/datasets`)
- **Dataset cards** — Name, example count, owner, tags, and last updated
- **Actions** — Run evaluation and browse (placeholder)
- **Import** — CSV import flow (placeholder)

### Evaluators (`/evaluators`)
- **Evaluator list** — LLM-judge, rule-based, and regex evaluators
- **Score bars** — Visual score indicator with color-coded thresholds
- **Pass/Watch badges** — Automatic status based on score threshold (0.85)
- **Runs evaluated** — Volume of traces evaluated in last 24h

### Models (`/models`)
- **Model leaderboard** — Runs, tokens, and cost by model/provider
- **Provider breakdown** — OpenAI, Anthropic, Google, etc.

### Alerts (`/alerts`)
- **Alert feed** — Firing and resolved alert events with severity icons
- **Severity badges** — Error, warning, and info levels
- **Silence action** — Temporary suppression (placeholder)
- **Active count** — Real-time count of firing alerts in header

### Provenance (`/provenance`)
- **DAG visualization** — Interactive decision graph with LLM, tool, RAG, and guardrail nodes
- **Node types** — Color-coded by operation type
- **Recompute** — Refresh graph from latest traces

### Settings (`/settings`)
- **OTLP endpoints** — HTTP and gRPC ingest URLs with project token
- **Retention policies** — Visual bar charts for trace, LLM I/O, tool I/O, and annotation retention
- **Copy-to-clipboard** — One-click copy for endpoints and tokens

### Shell & Navigation
- **Sidebar** — Workspace and platform sections with keyboard shortcuts (G O, G R, etc.)
- **Breadcrumbs** — Context-aware path navigation in top bar
- **Command palette** — ⌘K global search (placeholder)
- **Theme toggle** — Light/dark mode with next-themes
- **Live tick strip** — Animated status bar with pulse indicator
- **Project switcher** — Tenant/environment context display

---

## Architecture

```
┌─────────────────────────────────────┐
│      Chorus Studio (Next.js 15)      │
│  ┌─────────┐  ┌───────────────────┐  │
│  │  Pages  │  │   Components      │  │
│  │ (App    │  │ • AppShell        │  │
│  │  Router)│  │ • Sidebar / TopBar│  │
│  └────┬────┘  │ • Waterfall / DAG │  │
│       │       │ • MetricRail /    │  │
│       ▼       │   Sparkline       │  │
│  ┌─────────┐  └───────────────────┘  │
│  │  hooks  │  ┌───────────────────┐  │
│  │ useAuth │  │   lib/api.ts      │  │
│  └─────────┘  │ • fetchJson + JWT │  │
│               │ • authApi / api   │  │
│               └───────────────────┘  │
└──────────────┬────────────────────────┘
               │ REST API + SSE
               ▼
┌─────────────────────────────────────┐
│  Chorus Observe Server (Spring Boot) │
│  • Auth (JWT + API Key)              │
│  • OTLP ingest (gRPC + HTTP)         │
│  • Metrics / Alerts / Evals          │
└──────────────┬────────────────────────┘
               │ JDBC / ClickHouse
               ▼
        PostgreSQL / ClickHouse
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, RSC, standalone output) |
| UI Library | React 19 (Concurrent rendering) |
| Language | TypeScript 5.8 (Strict mode) |
| Styling | Tailwind CSS 4 (Utility-first, CSS variables) |
| Icons | Lucide React |
| Theming | next-themes (light/dark/system) |
| Charts | Recharts |
| Graphs | React Flow |
| Fonts | Inter + JetBrains Mono |

---

## Quick Start

```bash
# Install dependencies
npm install

# Dev server (requires Chorus Observe backend on :8080)
npm run dev

# Build for production
npm run build

# Type check
npx tsc --noEmit
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `CHORUS_API_URL` | `http://localhost:8080` | Chorus Observe REST API endpoint |
| `PORT` | `3000` | Next.js server port |

---

## Docker

```bash
# Build and run
docker build -t chorus-studio .
docker run -p 3000:3000 -e CHORUS_API_URL=http://host.docker.internal:8080 chorus-studio

# Or use Docker Compose
docker compose up -d
```

---

## Project Structure

```
app/
  ├── page.tsx                 # Dashboard overview
  ├── layout.tsx               # Root layout with AuthProvider + ThemeProvider
  ├── login/page.tsx           # Authentication (sign in)
  ├── register/page.tsx        # Authentication (sign up)
  ├── runs/page.tsx            # Run list + filters
  ├── runs/[runId]/page.tsx    # Run detail + trace waterfall
  ├── agents/page.tsx          # Agent directory
  ├── agents/register/page.tsx # Agent registration wizard
  ├── agents/[agentId]/page.tsx # Agent detail + metrics
  ├── datasets/page.tsx        # Dataset cards
  ├── evaluators/page.tsx      # Evaluator list
  ├── models/page.tsx          # Model leaderboard
  ├── alerts/page.tsx          # Alert feed
  ├── provenance/page.tsx      # Provenance DAG
  └── settings/page.tsx        # OTLP endpoints + retention

components/
  ├── AppShell.tsx             # Auth-aware layout wrapper
  ├── shell/
  │   ├── Sidebar.tsx          # Navigation + user footer
  │   ├── TopBar.tsx           # Breadcrumbs + search + user menu
  │   ├── TickStrip.tsx        # Live status bar
  │   └── CommandPalette.tsx   # ⌘K search overlay
  ├── overview/                # Dashboard widgets
  ├── runs/                    # Run list components
  ├── run-detail/              # Trace, LLM, tool, eval tabs
  ├── agents/                  # Agent detail tabs + wizard
  ├── dag/                     # Provenance graph
  ├── waterfall/               # Trace waterfall
  ├── charts/                  # Recharts wrappers
  ├── primitives/              # Reusable UI (buttons, cards, badges, tabs)
  └── shared/                  # CodeBlock, KvGrid, PageHeader

hooks/
  └── useAuth.tsx              # JWT auth context (login/register/logout/me)

lib/
  ├── api.ts                   # API client with Bearer token injection
  └── utils.ts                 # Formatting helpers

types/
  └── index.ts                 # Shared TypeScript interfaces
```

---

## License

Apache 2.0
