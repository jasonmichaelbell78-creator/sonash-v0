# Firecrawl — Documentation Dimension

**Source:** mendableai/firecrawl · **Analyzed:** 2026-04-10 · **Session:** #273

## Top-level docs

| File            | Size              | Purpose                                                 |
| --------------- | ----------------- | ------------------------------------------------------- |
| README.md       | ~20KB             | Marketing + quick start + feature overview + SDK matrix |
| SELF_HOST.md    | ~10KB / 227 lines | Self-hosting guide — docker-compose + env config        |
| CONTRIBUTING.md | ~4KB              | Contributor guide                                       |
| CLAUDE.md       | ~1.5KB            | **AI agent instructions** — actionable, minimal         |

**CLAUDE.md is the standout.** It's 19 lines but every line is useful:
test-first is required, E2E (called "snips") is always preferred, per-provider
gating (TEST_SUITE_SELF_HOSTED, OPENAI_API_KEY, OLLAMA_BASE_URL), and mandatory
`scrapeTimeout` helper from `./lib`. No decorative prose, no repeated README
content. This is the opposite of most CLAUDE.md files (SoNash's own is 235
lines).

## API documentation

- **openapi.json** — current (v2) OpenAPI spec
- **v1-openapi.json** — v1 frozen spec
- **openapi-v0.json** — v0 frozen spec

Three OpenAPI specs at the repo root. Version-frozen specs are the contract that
the 7 SDKs rely on; this is why cross-SDK parity works without a shared package.

## Per-sub-app READMEs

Every SDK and service has its own README.md:

- `apps/elixir-sdk/README.md`
- `apps/java-sdk/README.md`
- `apps/playwright-service-ts/README.md`
- `apps/python-sdk/README.md`
- `apps/redis/README.md`
- `apps/rust-sdk/README.md`
- `apps/test-site/README.md`
- `apps/test-suite/README.md`

Each is a self-contained install/usage guide for that sub-app. This is table
stakes for a 13-app monorepo, but firecrawl actually did it.

## Architecture docs (sparse but present)

Only one architecture doc found:

- `apps/api/src/scraper/scrapeURL/README.md` — mermaid signal flow diagram for
  the fallback-engine chain, plus a "Differences from WebScraperDataProvider"
  section comparing the new scraper to its predecessor.

This is the only mermaid diagram and the only in-code architecture note. The
rest of the architecture (queues, services, auth, versioning) is **undocumented
in prose**. Contributors have to infer it from code layout and CLAUDE.md's
minimal hints.

## Examples directory (strongest output)

`examples/` has 15+ example apps, each with its own README. Notable:

- `deep-research-apartment-finder/`
- `ai-podcast-generator/`
- `aginews-ai-newsletter/`
- `deepseek-v3-company-researcher/`
- `deepseek-v3-crawler/`
- `gemini-2.5-crawler/`
- `gemini-2.5-screenshot-editor/`
- `gemini-2.5-web-extractor/`
- `gpt-4.1-company-researcher/`
- `gpt-4.1-web-crawler/`
- `llama-4-maverick-web-crawler/`
- `llama-4-maverick-web-extractor/`
- `full_example_apps/`

Each example pairs firecrawl with a specific LLM. This is product marketing in
code form — you can point a user at `gemini-2.5-crawler/` and say "this is what
your stack would look like". The examples are probably more valuable to a new
user than the README.

## Absence patterns

- **No `docs/` directory at all.** No high-level architecture doc, no queue
  architecture explainer, no auth flow diagram. You're reading from code +
  README + OpenAPI + example apps.
- **No ADR directory.** Engineering decisions aren't captured — no record of
  "why Redlock over alternatives?" or "why nuq-postgres alongside BullMQ?".
- **No API quota/limits reference doc.** Rate limits and credit accounting exist
  in code (`services/rate-limiter.ts`, `services/ledger/`) but there's no
  user-facing page explaining the limit tiers.
- **No migration guide** from v0 → v1 → v2. Three API versions coexist but
  there's no table showing "what changed between v1 and v2".

## Band: Healthy (72)

The README is strong (feature matrix, SDK coverage, copy-paste examples).
CLAUDE.md is exemplary — minimal and actionable. The `examples/` directory is a
genuine feature. But the architectural documentation debt is real: no prose
explanation of the queue layout, auth flow, or API version migration paths. A
new contributor would lean on code reading, not docs.
