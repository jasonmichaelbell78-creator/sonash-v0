# Deep Read — getzep/graphiti

What the repo knows beyond code. Artifacts read; knowledge cataloged; items
deferred to Content Eval (Phase 3.5).

## Artifacts Read

| Artifact                           | Path                 | Status                                                                                                             |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| README.md                          | /                    | Read (676 lines)                                                                                                   |
| CLAUDE.md                          | /                    | Read                                                                                                               |
| AGENTS.md                          | /                    | Read                                                                                                               |
| OTEL_TRACING.md                    | /                    | Read                                                                                                               |
| CONTRIBUTING.md                    | /                    | Partial (first 50 lines — governance + RFC process)                                                                |
| mcp_server/README.md               | mcp_server/          | Read (lines 1-449)                                                                                                 |
| mcp_server/docs/cursor_rules.md    | mcp_server/docs/     | Read (full)                                                                                                        |
| spec/driver-operations-redesign.md | spec/                | Partial — first 60 lines (architecture intent)                                                                     |
| examples/quickstart/README.md      | examples/quickstart/ | Partial (first 60 lines)                                                                                           |
| examples/ — inventory              | examples/            | Full directory listing, one-level                                                                                  |
| graphiti_core/ layout              | —                    | Full (submodules: driver, embedder, llm_client, prompts, search, cross_encoder, namespaces, migrations, telemetry) |
| tests/ layout                      | tests/               | Full listing; key files sized (test_graphiti_mock.py = 2053 LOC)                                                   |
| .github/workflows/                 | /                    | Listed 13 workflows                                                                                                |

## Artifacts Deferred to Phase 3.5

Structured-content candidates surfaced here, evaluated for relevance in Content
Eval:

- arXiv paper 2501.13956 — "Zep: A Temporal Knowledge Graph Architecture for
  Agent Memory" — the underlying research
- https://help.getzep.com/graphiti — external docs (guides, API reference)
- LangGraph integration guide
  (https://help.getzep.com/graphiti/integrations/lang-graph-agent)
- Blog: "State of the Art in Agent Memory"
  (https://blog.getzep.com/state-of-the-art-agent-memory/)
- 9 example directories (azure-openai, data, ecommerce, gliner2,
  langgraph-agent, opentelemetry, podcast, quickstart, wizard_of_oz)
- 4 MCP config YAML templates
- 13 CI workflows (include 2x Claude Code review workflows — relevant to home
  CC-OS work)
- Cross-encoder rerankers (BGE / OpenAI / Gemini) — technical pattern
- Entity-types config pattern
  (Preference/Requirement/Procedure/Event/Location/Organization/Document/Topic/Object)

---

## Knowledge Not Visible From Code

### 1. Bi-temporal fact model with "invalidate, never delete"

Every fact (edge) in the graph carries a validity window: when it became true,
when (if ever) it was superseded. Contradictions don't destroy history — the old
fact is invalidated but preserved. Queries can ask "what's true now" or "what
was true on 2024-03-15." This is the defining idea of the project and the reason
for its temporal framing vs. ordinary knowledge graphs. **Source:** README
§"What is a Context Graph?", §"Why Graphiti?"

### 2. Episodes as provenance ground truth

Every derived entity or edge traces back to one or more "episodes" — the raw
ingested data (text, messages, or JSON) that produced it. This gives full
lineage, which is uncommon in RAG systems that synthesize over chunks without
source tracking. **Source:** README §"What is a Context Graph?"; CLAUDE.md §"Key
features"

### 3. Prescribed + learned ontology

Entity and edge types can be declared upfront via Pydantic models (prescribed),
OR emerge from unstructured data (learned). The MCP server ships a baseline
ontology of 9 entity types: `Preference`, `Requirement`, `Procedure`,
`Location`, `Event`, `Organization`, `Document`, `Topic`, `Object`. This
ontology is customizable via `config.yaml` by editing descriptions. **Source:**
mcp_server/README.md §"Entity Types"

### 4. Hybrid retrieval with no LLM summarization

Retrieval combines semantic embeddings + BM25 keyword + graph traversal,
reranked by cross-encoder. Critically, there's no batch LLM summarization step
(unlike GraphRAG) — sub-second latency is the stated target. Search recipes live
in `graphiti_core/search/search_config_recipes.py` as reusable strategies.
**Source:** README §"Why Graphiti?", §"Graphiti vs. GraphRAG"; code inventory
(`search_config_recipes.py` 223 LOC, `search_utils.py` 2064 LOC)

### 5. The "cursor rules" pattern for AI assistant memory

`mcp_server/docs/cursor_rules.md` is a 34-line prompt handed to AI clients
telling them HOW to use the knowledge graph as agent memory. The discipline:

- Search first (search_nodes + search_facts) before doing work
- Filter by entity type (Preference / Procedure / Requirement)
- Save new info immediately via `add_memory`
- Split long requirements into chunks
- Follow discovered procedures step-by-step
- Be proactive — store observed patterns as preferences

This is effectively a shared operating protocol for any AI client wired into the
graph. Highly relevant to home CLAUDE.md-style operating docs. **Source:**
mcp_server/docs/cursor_rules.md

### 6. SEMAPHORE_LIMIT as the real concurrency dial

Ingestion uses asyncio semaphores with a default of 10 concurrent episodes. But
each episode issues multiple LLM calls (entity extract, dedupe, summarize), so
real concurrent API calls are a multiple of this. mcp_server/README provides a
per-provider tuning table: OpenAI Tier 1 (3 RPM) → SEMAPHORE_LIMIT=1-2; Tier 3
(500 RPM) → 10-15; Tier 4 → 20-50; Anthropic default → 5-8; Ollama → 1-5.
**Source:** mcp_server/README.md §"Concurrency and LLM Provider 429 Rate Limit
Errors"; README §"Default to Low Concurrency"

### 7. The driver-operations redesign (in-progress spec)

`spec/driver-operations-redesign.md` describes a migration from scattered DB
logic on data classes to a clean 3-layer architecture:

```
Graphiti Client
  └── Namespace Wrappers (thin: embeddings, tracing)
        └── Operations ABCs (pure DB I/O)
              └── GraphDriver (connection + query)
```

User-facing API becomes `graphiti.nodes.entity.save(node)` instead of
`node.save(driver)`. Phase 1 is non-breaking. Transactions via
`async with driver.transaction() as tx`. Notable design decision:
`QueryExecutor` ABC passed explicitly to ops, not the full driver, to avoid
import cycles. **Source:** spec/driver-operations-redesign.md

### 8. Opt-out telemetry with stated boundaries

Telemetry is opt-out via `GRAPHITI_TELEMETRY_ENABLED=false`, uses PostHog,
collects: anon UUID (stored in `~/.cache/graphiti/telemetry_anon_id`),
OS/Python/version, LLM/DB/embedder provider names. Does NOT collect: content,
API keys, IPs, hostnames, file paths, queries, graph data. Auto-disabled when
pytest is detected. Points users at the source file
(`graphiti_core/telemetry/telemetry.py`). **Source:** README §"Telemetry"

### 9. Structured Output is a hard floor

The README explicitly warns: Graphiti "works best with LLM services that support
Structured Output (such as OpenAI and Gemini). Using other services may result
in incorrect output schemas and ingestion failures. This is particularly
problematic when using smaller models." This constrains LLM provider choice in
ways that aren't obvious from the pluggable-client facade. **Source:** README
§"Installation"

### 10. Test conventions: `_int` suffix + env-gated drivers

Integration tests use an `_int` suffix (e.g., `test_edge_int.py`). `make test`
excludes them by default AND disables alternate drivers:
`DISABLE_FALKORDB=1 DISABLE_KUZU=1 DISABLE_NEPTUNE=1 uv run pytest -m "not integration"`.
`asyncio_mode = auto` in pytest.ini. `docker-compose.test.yml` spins up local
backing services. Mock test file is 2053 LOC — substantial investment in
testable surface. **Source:** AGENTS.md §"Testing Guidelines"; CLAUDE.md
§"Testing"; pytest.ini via AGENTS.md

### 11. Versioned LLM model catalog in CLAUDE.md

CLAUDE.md carries a dated ("as of November 2025") catalog of LLM models: GPT-5
family (reasoning, temperature=0 required), GPT-4.1 family, Claude 4.5 / 3.7 /
3.5 with pinned dates, Gemini 2.5 / 2.0 / 1.5. This is a maintenance commitment
— someone has to keep this accurate. Pattern worth noting: model names
pre-declared so AI-assisted edits don't "correct" them to older names.
**Source:** CLAUDE.md §"LLM Provider Support"

### 12. RFC-before-PR for new features

CONTRIBUTING.md requires a GitHub issue (RFC) before submitting a PR for: new
database drivers, new LLM clients, new embedder clients, new API endpoints. Bug
fixes don't need RFCs and are prioritized. **Source:** CONTRIBUTING.md §"RFC
Required..."

### 13. CI matrix has 13 workflows including 2 Claude Code review workflows

`.github/workflows/` contains: ai-moderator, cla, **claude-code-review,
claude-code-review-manual, claude**, codeql, lint, pr-triage, 3× release
(graphiti-core, mcp-server, server-container), typecheck, unit_tests. The
presence of THREE Claude-flavored workflows signals active AI-assisted dev
tooling — relevant to home CC-OS goals. **Source:** directory listing
`.github/workflows/`

### 14. OTEL tracing with zero-overhead default

OpenTelemetry is optional — without a tracer, operations use no-op
implementations with zero overhead. Simple injection pattern: pass a `tracer` +
optional `trace_span_prefix` into the `Graphiti()` constructor. Works with the
in-memory Kuzu driver for tracing without a network DB. **Source:**
OTEL_TRACING.md; code inventory `graphiti_core/tracer.py`,
`graphiti_core/telemetry/`

### 15. Examples catalog — what scenarios covered

9 examples, in increasing specificity: `quickstart` (all 4 DB backends: neo4j,
falkordb, neptune, + dense_vs_normal_ingestion), `azure-openai`,
`opentelemetry`, `gliner2` (entity extraction), `langgraph-agent` (agentic
integration), `podcast` (long-form ingestion with transcript parsing),
`ecommerce` (product graph with sample manybirds data), `wizard_of_oz` (classic
NER test — parse + runner). A clear "low ceremony → domain-specific" ladder.
**Source:** directory listing under `examples/`

### 16. Commercial-OSS split ("Zep" vs "Graphiti")

README has an explicit Zep-vs-Graphiti table. Zep = managed platform with SDKs
(Python/TS/Go), dashboard, SLA, sub-200ms retrieval. Graphiti = the OSS engine
underneath. Clear boundary: Zep handles users/threads/messages + governance +
scale; Graphiti gives you the primitives. This means the OSS is a genuine
engine, not a lead-gen teaser — but "build your own tools" is literal.
**Source:** README §"Graphiti and Zep", §"Zep vs Graphiti"

### 17. Concurrency ceilings by provider (operational intelligence)

Per-LLM-provider guidance isn't theory — it's in the mcp_server README as a
table. OpenAI Tier-by-Tier with suggested SEMAPHORE_LIMIT values; Anthropic
default-vs-high-tier; Ollama "hardware dependent." Symptoms-based diagnosis
("429 errors = too high; slow throughput = too low"). Tells you where to look:
LLM provider dashboard + server logs + token/cost tracking. **Source:**
mcp_server/README.md §"Concurrency and LLM Provider..."

### 18. Namespaces + group_id for multi-tenancy

`graphiti_core/namespaces/` + `group_id` parameter enable multi-tenant graphs in
a single instance. MCP server exposes `--group-id` flag (default: "main"). Not
heavily documented in the root README but surfaces in mcp_server CLI and
AGENTS.md. **Source:** graphiti_core/ layout; mcp_server/README.md CLI args

### 19. Cross-encoder rerankers as first-class citizens

`graphiti_core/cross_encoder/` exposes three rerankers: BGE (local), OpenAI
(boolean classification via log-probs), Gemini (same pattern, different model:
gemini-2.5-flash-lite default). This is a specific technical pattern — using
log-probs on a boolean classification prompt to rank relevance, rather than a
dedicated reranker model. **Source:** README §"Using Graphiti with Google
Gemini"; directory listing

### 20. Type-check discipline

`make lint` runs ruff + pyright. Pyright mode: `basic` for graphiti_core,
`standard` for server/. Line length 100, single quotes, snake_case files/funcs,
PascalCase Pydantic models. Enforced via Makefile. **Source:** AGENTS.md
§"Coding Style"; CLAUDE.md §"Code Style"

---

## Feed-Forward to Creator View

Creator View §2 ("What's Relevant To Your Work") should reference specifically:

- Entry #5 — cursor_rules.md pattern (maps onto CLAUDE.md philosophy)
- Entry #3 — entity-types ontology (maps onto MEMORY.md types:
  user/feedback/project/reference)
- Entry #11 — versioned model catalog in CLAUDE.md (maps onto home "Stack
  Versions" table)
- Entry #1 — bi-temporal model (adjacent to episodic-memory skill's "memory
  records decay" note)
- Entry #8 — opt-out telemetry + content-exclusion boundary (pattern for any
  local tool)
- Entry #7 — driver-operations redesign (pattern-quality reference for CC-OS
  internal refactors)

Creator View §6 ("What's Worth Avoiding") should reference:

- Entry #9 — Structured Output floor (warn: not all providers are equal in
  pluggable systems)
- Entry #16 — OSS-alongside-commercial-SaaS framing (risk: "build your own
  tools" = real dev cost)
