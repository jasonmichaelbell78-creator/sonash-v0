# D5a: Popular Graph MCP Servers for Knowledge Graphs

**Searcher:** deep-research-searcher | **Profile:** web+docs | **Date:**
2026-04-07 **Sources:** 19 | **Confidence:** HIGH:4, MEDIUM:12, LOW:3,
UNVERIFIED:1

---

## Ranked for T28 Fit

### Tier 1: Strong Candidates (serverless, graph+search)

**BasicMemory** (2,800 stars, AGPL v3)

- Markdown files + SQLite + FastEmbed. MCP-native (primary interface).
- Hybrid semantic+FTS search. `memory://` URL graph traversal.
- Zero infrastructure. **AGPL license is the main concern.**

**obra/knowledge-graph** (55 stars, Claude Code plugin)

- Obsidian vault → SQLite+sqlite-vec+FTS5. Local MiniLM model (no API key).
- Graph analytics: PageRank, Louvain communities, betweenness centrality, BFS
  paths.
- Designed as Claude Code plugin with auto-start MCP.
- **Low adoption (55 stars) but strongest graph analytics in serverless tier.**

**knowledge-graph-rag-mcp** (PyPI only, no GitHub)

- Auto-ingestion: watch dir → normalize → chunk → entity extract → vectorize →
  SQLite.
- Hybrid: vector prefilter → BFS graph expansion → re-ranking.
- Single binary, zero external deps. **Needs verification — no GitHub repo
  found.**

### Tier 2: Best Integration but Dependencies

**bobmatnyc/kuzu-memory** (22 stars, MIT)

- **Only MCP server with Claude Code hook system** (UserPromptSubmit + Stop
  hooks for auto-learning).
- Cognitive memory taxonomy (SEMANTIC, PROCEDURAL, EPISODIC, etc.), importance
  scores, temporal retention.
- ~3ms recall, <25MB RAM, git-shareable <10MB databases.
- **RISK: Upstream KuzuDB archived Oct 2025.** Uses ryugraph fork.

### Tier 3: Requires Server Infrastructure

**memento-mcp** (413 stars, MIT) — Neo4j + OpenAI. Best metadata richness
(confidence levels, temporal decay, version history). Requires Neo4j + OpenAI
API.

**neo4j-contrib/mcp-neo4j** (932 stars, Apache 2.0) — Most mature. 4
sub-servers. GDS algorithms. Requires Neo4j infrastructure.

### Tier 4: Insufficient for T28

**Official Anthropic memory** (83K monorepo) — JSONL file, no vector search, no
scale path. Proof-of-concept only.

**shaneholloman/mcp-knowledge-graph** (838 stars) — JSONL, no vector search.
Good for per-project isolation, not intelligence graph.

**n-r-w/knowledgegraph-mcp** (20 stars) — SQLite/PostgreSQL, no vector search.
Low adoption.

## Key Insight

Only 2 serverless MCP servers offer graph analytics (community detection,
centrality, PageRank): obra/knowledge-graph and neo4j-contrib/mcp-neo4j (via
GDS). If T28 needs to surface content clusters automatically, options narrow
significantly.

## Serendipity

- bobmatnyc/kuzu-memory's Claude Code hook system could automate T28 graph
  updates without explicit tool calls
- knowledge-graph-rag-mcp implements T28's exact pipeline
  (ingest→extract→graph→retrieve) as single binary
