# Firecrawl — Architecture Dimension

**Source:** mendableai/firecrawl · **Analyzed:** 2026-04-10 · **Session:** #273

## Monorepo structure (13 sub-apps)

```
apps/
  api/                    # TypeScript API + workers (primary service)
  ui/                     # Next.js ingestion UI
  js-sdk/                 # JavaScript/TypeScript SDK
  python-sdk/             # Python SDK (pyproject.toml)
  rust-sdk/               # Rust SDK (Cargo.toml)
  go-html-to-md-service/  # Go microservice for HTML → Markdown
  java-sdk/               # Java SDK
  elixir-sdk/             # Elixir SDK (mix.exs)
  playwright-service-ts/  # Playwright browser-rendering service
  nuq-postgres/           # Postgres-backed queue variant (nuq)
  redis/                  # Redis config/scripts
  test-site/              # Reference scrape target
  test-suite/             # Load/E2E test harness
```

This is unusually wide SDK coverage — 7 language SDKs plus 2 auxiliary services
(Go HTML→MD, Playwright rendering). Most OSS scraping projects ship one SDK and
let the community port the rest. Firecrawl treats polyglot SDK parity as a core
product feature.

## API engine (apps/api/src/)

### API versioning — parallel v0/v1/v2 trees

```
src/controllers/
  v0/  — legacy crawl, liveness, readiness, search
  v1/  — crawl, extract, types, urlValidation
  v2/  — types, x402-search, agent-status, browser-billing
```

Three versions coexist with their own test fixtures (`e2e_v1_withAuth`,
`snips/v0`, `snips/v1`, `snips/v2`). New features land on v2; v0 stays alive for
backward compat. This matches the "slow-deprecation" pattern.

### Scraping engine abstraction (core value)

`apps/api/src/scraper/scrapeURL/` — explicitly documented in README with a
mermaid signal flow. The fallback-chain pattern:

```
scrapeURL → buildFallbackList → scrapeURLWithEngine → parseMarkdown → (success?)
   ↑                                      │
   └──── try next engine ─────────────────┘
```

Engines live in `engines/`:

- `document/` — generic document parsing
- `fetch/` — plain HTTP fetch
- `fire-engine/` — proprietary scraping engine (main)
- `index/` — indexing integration
- `pdf/` — PDF → Markdown via LlamaParse
- `playwright/` — JS-rendering fallback
- `wikipedia/` — Wikipedia-specific parser
- `utils/` — shared engine utilities

Each engine is a plugin. `buildFallbackList` selects an ordered set per request,
and `scrapeURLWithEngine` tries them in order. If all fail, `NoEnginesLeftError`
is thrown. This is the right abstraction for "the web is hostile and
heterogeneous".

### Queue infrastructure (BullMQ + custom nuq)

```
services/
  queue-service.ts, queue-worker.ts, queue-jobs.ts
  extract-queue.ts, extract-worker.ts
  worker/
    nuq-worker.ts, nuq-prefetch-worker.ts, nuq-reconciler-worker.ts
  indexing/
    index-worker.ts
```

Seven distinct worker types. `nuq-*` workers and the `nuq-postgres` sub-app
suggest a custom Postgres-backed queue (probably "Non-Uniform Queue") that
coexists with BullMQ/Redis. This is likely a migration or a hybrid for different
job classes.

### Service layer

`apps/api/src/services/` has 14+ sub-modules: alerts, autumn (billing
integration), billing, idempotency, indexing, ledger (credit ledger), logging,
notification, webhook, subscription, system-monitor. Each is a dedicated
subdirectory — services are first-class, not scattered helpers.

### Distributed coordination

- **Redlock** for distributed locks (`services/redlock.ts`)
- **Redis** shared between rate limiter + ACUC cache + BullMQ
- **Supabase** as the durable store
- **Postgres (nuq)** as a queue backend

Four distinct backing stores is high for a single service but matches the
operational profile (low-latency cache, durable cred store, queue backbone,
alternative queue).

## Branding, deep-research, extract libs

`apps/api/src/lib/` — pluggable libraries, each with their own subdir:

- `branding/` — fire-engine branding isolation
- `deep-research/` — deep research subsystem (with dedicated test dir)
- `extract/` — structured data extraction
- `generate-llmstxt/` — llms.txt generator
- `scrape-interact/` — click/scroll/type/wait primitives for agent interaction

The `deep-research` library has its own `__tests__` tree — it's essentially a
sub-product within the API.

## Absence patterns

- **No shared package/workspace** between the SDKs — each SDK re-implements the
  wire contract. Cross-SDK consistency lives in the OpenAPI specs (openapi.json,
  v1-openapi.json, openapi-v0.json).
- **No visible domain model layer** — controllers seem to flow directly into
  services/scrapers. This is fine for an API, less fine for long-lived business
  logic.
- **No visible feature-flag layer.** Branching is done via env vars and version
  paths.

## Band: Healthy (75)

A well-shaped monorepo for its domain: engine pluggability is clean, version
parallelism is disciplined, worker separation is explicit. The debt signal is in
the queue layer (BullMQ + nuq-postgres coexistence suggests in-progress
migration) and the 7-SDK duplication cost. The engine fallback pattern is the
transferable idea.
