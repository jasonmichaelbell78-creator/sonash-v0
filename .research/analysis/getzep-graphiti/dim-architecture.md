# Architecture Analysis — getzep/graphiti

_Note: Agent ran in read-only mode; content captured from agent result and
persisted manually per CLAUDE.md §4.15._

## Summary

Graphiti is a **plugin-driven temporal knowledge graph framework** built on
**layered abstractions** with clean provider interfaces for databases (Neo4j,
FalkorDB, Kuzu, Neptune), LLMs (OpenAI, Anthropic, Gemini, Groq), and embedders
(OpenAI, Voyage, Gemini). The architecture prioritizes **incremental, streaming
data updates** with bi-temporal semantics (transaction time + valid time) and
**hybrid retrieval** combining semantic, keyword, and graph-traversal search. It
maintains strong separation of concerns: core library (`graphiti_core/`)
provides the engine, REST API (`server/`) wraps it in FastAPI, and MCP server
(`mcp_server/`) exposes tools to AI assistants. The design is coherent and
extensible — new providers plug in via abstract base classes with no core
changes needed.

## Module Map

- **graphiti_core/** — Core temporal graph engine
  - `graphiti.py` — Main `Graphiti` class orchestrator
  - `nodes.py` — Entity, Episode, Community, Saga abstractions
  - `edges.py` — EntityEdge, EpisodicEdge, CommunityEdge, HasEpisodeEdge
    abstractions
  - `driver/` — `GraphDriver` ABC + Neo4j, FalkorDB, Kuzu, Neptune
    implementations
  - `llm_client/` — `LLMClient` ABC + OpenAI, Anthropic, Gemini, Groq, Azure,
    GliNER2 implementations
  - `embedder/` — `EmbedderClient` ABC + OpenAI, Voyage, Gemini, Azure
    implementations
  - `search/` — Hybrid retrieval with strategy pattern (cosine, bm25, bfs, RRF,
    MMR, cross-encoder)
  - `tracer.py` — OpenTelemetry integration with no-op default
  - `decorators.py` — `@handle_multiple_group_ids` for FalkorDB multi-group
    handling
  - `helpers.py` — `semaphore_gather` for async concurrency control, validation
- **server/** — REST API wrapper (FastAPI)
  - `graph_service/main.py` — FastAPI app with lifespan context manager
  - Routers for `/ingest` (POST) and `/retrieve` (GET)
- **mcp_server/** — Model Context Protocol server (FastMCP)
  - ~15 tools (add_memory, search_nodes, search_facts, etc.)
  - Factories for database, LLM, embedder provider instantiation

## Core Abstractions

**Episodes** — Raw ingested data (text, JSON, messages); immutable ground truth
stored in `EpisodicNode`. Every derived node/edge traces back via
`HasEpisodeEdge`. Temporal validity windows (`valid_from`, `valid_to`).

**Nodes** — `EntityNode` (custom Pydantic attributes), `EpisodicNode` (raw
data), `CommunityNode` (emergent clusters), `SagaNode` (named threads). Base
class `Node` in `nodes.py`.

**Edges** — `EntityEdge` (facts with validity windows), `EpisodicEdge` (temporal
sequence), `CommunityEdge` (node to community), `HasEpisodeEdge` (provenance).
Fact invalidation: old edges marked `valid_to=now` when contradicted, not
deleted.

**Drivers** — `GraphDriver` ABC with async query execution. Four
implementations: Neo4j (default), FalkorDB, Kuzu, Neptune. Optional
`graph_operations_interface` and `search_interface` for provider-specific
optimizations.

**LLM Clients** — `LLMClient` ABC with structured-output support (Pydantic
`response_model`). Automatic exponential backoff retries on 5xx/rate-limit.
`TokenUsageTracker` for accounting.

**Embedders** — `EmbedderClient` ABC (`create()`, optional `create_batch()`).
Configurable `embedding_dim` (default 1024).

**Search Config** — Strategy pattern with enums: `NodeSearchMethod`
(cosine_similarity, bm25, bfs), rerankers (RRF, node_distance, mmr,
cross_encoder). Pre-baked recipes (`COMBINED_HYBRID_SEARCH_CROSS_ENCODER`,
`EDGE_HYBRID_SEARCH_RRF`).

## Extensibility Model

- **New Database Driver**: subclass `GraphDriver`, implement `execute_query()`,
  `execute_write()`, `close()`; pass via `graph_driver` kwarg. No core changes.
  (`driver/driver.py:90-100`)
- **New LLM Provider**: subclass `LLMClient`, implement
  `_generate_response(messages, response_model, max_tokens, model_size)`.
  Structured output handled per provider.
  (`llm_client/openai_base_client.py:200-250`, `anthropic_client.py:70-90`)
- **New Embedder**: subclass `EmbedderClient`, implement `async def create()`
  returning `list[float]`. (`embedder/openai.py`)
- **Custom Entity Types**: define Pydantic models, pass dict to
  `Graphiti.add_episode(..., entity_types=custom_types)`. Extraction prompts
  auto-serialize schema to JSON Schema for LLM.

## Server & MCP Architecture

```
Claude/Cursor -> (MCP stdio) -> mcp_server -> graphiti_core -> driver -> Graph DB
HTTP Clients  -> (FastAPI)     -> server     -> graphiti_core -> driver -> Graph DB
```

- **REST API** (`server/`): FastAPI with lifespan init of Graphiti singleton.
  `/ingest` and `/retrieve` routes. DTOs ensure HTTP contracts. No core
  modifications.
- **MCP Server** (`mcp_server/`): FastMCP-based, HTTP default (stdio supported).
  ~15 tools exposing Graphiti functionality. Factories decouple provider
  instantiation. `SEMAPHORE_LIMIT` env var (default 10) bounds concurrent
  episode processing.

## Observability

- **OpenTelemetry** (`tracer.py`): opt-in via `tracer` kwarg. `NoOpTracer`
  default (zero overhead). Spans prefixed with `trace_span_prefix` (default
  `graphiti`). `add_attributes()`, `set_status()`, `record_exception()`.
- **PostHog Telemetry**: optional `capture_event()` for anonymous usage logging
  (e.g., `graphiti_initialized` logs provider types — content never captured).
- **Token Tracking**: `TokenUsageTracker` accumulates prompt/completion tokens
  per prompt type. Access via `graphiti.token_tracker.get_usage()`.

## Async/Concurrency

- **Async-First**: all I/O (DB, LLM, embeddings) is `async def`. No blocking
  paths.
- **Semaphore Back-Pressure** (`helpers.semaphore_gather()`): bounds concurrent
  LLM/embedding calls. `SEMAPHORE_LIMIT` env var (default 20 core, 10 MCP).
  Graceful degradation under load. (`helpers.py:123-133`)
- **Bulk Operations**: `extract_nodes_and_edges_bulk()`,
  `add_nodes_and_edges_bulk()`, `dedupe_nodes_bulk()`, `dedupe_edges_bulk()`
  with batch + semaphore pattern.

## Key Design Decisions (with evidence)

1. **Bi-temporal Semantics** — every edge has `valid_from`/`valid_to`.
   Invalidated, not deleted. (`edges.py:54`, README.md)
2. **Episodes as Immutable Provenance** — `EpisodicNode` never modified; derived
   nodes/edges link via `HasEpisodeEdge`. (`graphiti.py:114-120`,
   `nodes.py:54-88`)
3. **Provider-Agnostic Drivers via ABC** — no coupling to `Graphiti` class.
   (`driver/driver.py:90-100`)
4. **Configurable Search Strategy** — `SearchConfig` + pre-baked recipes.
   (`search_config.py:80-119`, `search_config_recipes.py`)
5. **Structured Output for LLM Extraction** — entities as Pydantic models, not
   free text. Per-provider native handling. (`openai_base_client.py:200-250`,
   `anthropic_client.py:70-90`)
6. **Optional Tracing with No-Op Default** — zero overhead when absent.
   (`tracer.py:159-193`, `graphiti.py:229-230`)
7. **Multi-Group Isolation (Partition Key)** — `group_id` tags; FalkorDB
   multi-group via decorator. (`decorators.py:29-98`, `graphiti.py:138-150`)
8. **Lazy Default Client Init** — defaults on `Graphiti.__init__` if not
   provided. (`graphiti.py:216-227`)
9. **Namespace API** — `graphiti.nodes.entity.save()` vs raw driver access.
   (`namespaces/`, `graphiti.py:243-245`)
10. **Chunking Gated by Entity Density** — chunking only if density > threshold
    (default 0.15 entities per 1000 tokens). (`helpers.py:41-55`)

## Band

**Strong** — Abstract provider patterns enable DB/LLM/embedder swapping with
zero core changes; layered isolation separates temporal data model, driver
abstraction, and server/MCP integration; domain-anchored abstractions (Episodes,
Entities, Facts, Communities); extensibility hooks without framework
invasiveness. Concurrency is carefully managed via semaphore-bounded gathering;
tracing is truly optional. Minor rough edges: FalkorDB group_id decorator is
somewhat ad-hoc. These don't undermine coherence.
