# Chorus Studio

Enterprise observability UI for Chorus Observe. Built with Next.js 15, React 19, TypeScript, and Tailwind CSS.

## Quick Start

```bash
# Install dependencies
npm install

# Dev server (requires Chorus Observe backend)
npm run dev

# Build for production
npm run build
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `CHORUS_API_URL` | `http://localhost:8080` | Chorus Observe REST API endpoint |
| `PORT` | `3000` | Next.js server port |

## Docker

```bash
# Build and run
 docker build -t chorus-studio .
 docker run -p 3000:3000 -e CHORUS_API_URL=http://host.docker.internal:8080 chorus-studio

# Or use Docker Compose
 docker compose up -d
```

## Features

- **Dashboard** — Cost/token trends, status breakdown, recent runs overview
- **Run List** — Filterable, sortable, paginated table of all agent runs
- **Trace Waterfall** — LLM-aware span visualization with real-time streaming
- **Provenance DAG** — Causal decision graph (Chorus Engine runs only)
- **LLM / Tool Call Detail** — Inline prompt, completion, args, and results

## Architecture

```
Chorus Studio (Next.js 15)
    │ REST API + SSE
    ▼
Chorus Observe Server (Spring Boot)
    │ JDBC / ClickHouse
    ▼
PostgreSQL / ClickHouse
```

## Technology Stack

- **Next.js 15** — App Router, RSC, standalone output
- **React 19** — Concurrent rendering
- **TypeScript** — Strict mode
- **Tailwind CSS 4** — Utility-first styling
- **Recharts** — Metric charts
- **React Flow** — Graph visualization

## License

Apache 2.0
