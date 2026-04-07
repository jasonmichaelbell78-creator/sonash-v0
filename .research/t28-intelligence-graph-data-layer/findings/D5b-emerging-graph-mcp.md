# D5b: Emerging/Niche Graph MCP Servers

**Searcher:** deep-research-searcher | **Profile:** web+docs | **Date:**
2026-04-07 **Sources:** 47+ | **Confidence:** HIGH:12, MEDIUM:9, LOW:3,
UNVERIFIED:1

---

## Tier 1: Production-Ready, Highest T28 Relevance

### Graphiti/Zep (24.6K stars, Apache 2.0)

Temporal context graph engine. Bi-temporal tracking (valid_from/valid_to).
Backends: Neo4j, FalkorDB, Kuzu, Neptune. Official MCP server. Zep Cloud $25/mo
or self-hosted. arXiv:2501.13956.

### AgentMemory (574 stars)

43 MCP tools. Triple-stream retrieval: BM25 + vector + knowledge graph BFS,
fused via RRF. **Syncs with `~/.claude/projects/*/memory/MEMORY.md`** — directly
compatible with current infrastructure. Supersession chains with rollback.
Confidence scoring.

### Memento MCP (413 stars, MIT)

Neo4j-backed. **Confidence decay** — relations auto-decay to 0 over 30 days.
Adaptive search strategy selection. Full version history with point-in-time
retrieval.

### Ogham (PostgreSQL-backed)

Cross-client shared memory. 91.8% LongMemEval. **Temporal auto-compression**
(full text → key sentences → one-line + tags). RRF hybrid search.

### mind-mem (10 stars, brand new March 2026)

**Co-retrieval graph** — PageRank-style score propagation across frequently
co-retrieved blocks. Novel. **Contradiction detection as first-class feature** —
detects when stored knowledge conflicts. 17 MIND scoring kernels.
SQLite+Markdown, zero deps. 2,189 unit tests.

## Tier 2: Specialized High-Value

### Memori (13.2K stars, Apache 2.0)

SQL-native, LLM-agnostic, BYODB. Chat turns classified into
facts/preferences/rules/summaries. 81.95% LoCoMo accuracy, 67% token reduction
vs Zep.

### MemoryGraph (202 stars)

**8 backend options** including **LadybugDB**. 7 relationship categories with
semantic types. Cross-session recall. Designed for AI coding agents.

### Mnemosyne (Rust-based)

Sub-millisecond retrieval (0.88ms). Built-in 4-agent orchestration. LibSQL
storage. FTS5 + graph + vector hybrid.

### MemoryMesh

**Schema-driven auto-tool-generation** — define entity types as YAML, get
auto-generated CRUD MCP tools. Generalizable pattern for T28.

### mcp-memory-service (1.6K stars)

**Causal knowledge graph** with typed edges: causes, fixes, contradicts.
Multi-agent coordination via tag-based messaging.

## Key Insights

1. **The ecosystem is far more mature than expected.** 20+ production MCP
   servers for knowledge graphs exist as of April 2026.

2. **Three novel mechanisms for T28:**
   - mind-mem's co-retrieval graph (surfaces structural connections without
     explicit annotation)
   - Memento's confidence decay (old intelligence loses weight automatically)
   - MemoryMesh's schema-driven tool generation (define entity types, get MCP
     tools)

3. **MemoryGraph supports LadybugDB** — the only MCP server confirmed to work
   with the KuzuDB fork. This could be the bridge between embedded graph DB and
   MCP interface.

4. **AgentMemory syncs with MEMORY.md** — directly compatible with the project's
   existing auto-memory infrastructure. Lowest friction adoption path.

## Contradiction Warning

Multiple servers claim #1 on LongMemEval/LoCoMo benchmarks. Self-reported,
different methodologies. Treat all as unverified.
