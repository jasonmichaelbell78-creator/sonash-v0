# Findings: Obsidian Data Patterns and Graph Capabilities

**Searcher:** deep-research-searcher **Profile:** docs + web **Date:**
2026-04-07 **Sub-Question:** D2a-1

---

## Summary

Obsidian stores notes as plain `.md` files — no proprietary database. The
"graph" is implicit in `[[wiki links]]`, `#tags`, and YAML frontmatter,
reconstructed in-memory as MetadataCache at runtime. Graph view is
visualization-only (Pixi.js WebGL), not a query engine. Scale: clean at 1,000
nodes, functional to ~10,000-25,000, fails at 130,000. obra/knowledge-graph is
the reference implementation for headless graph analysis (SQLite + FTS5 +
sqlite-vec + graphology, no Obsidian required). Harper Reed's pipeline is a
working proof-of-concept. blakecrosley.com provides a production-validated
three-layer architecture (Intake → Retrieval → MCP) at 16,894 files. **T28
should LEARN from Obsidian's patterns, not USE Obsidian as backend.**

---

## Key Findings

### 1. Data Storage: Plain Files, Implicit Graph [CONFIDENCE: HIGH]

- Every note = `.md` file on local filesystem
- Metadata in YAML frontmatter (delimited by `---`)
- Relationships: `[[wiki links]]` (edges), `#tags`, frontmatter `[[link]]`
  entries (since v1.4.0)
- At runtime: builds MetadataCache with LinkCache, EmbedCache, TagCache,
  resolvedLinks, unresolvedLinks
- MetadataCache is plugin-only API (`app.metadataCache`) — not accessible from
  Node.js externally
- When Obsidian not running: files are just files, external tools must re-parse
  markdown

### 2. Graph View: Visualization Only [CONFIDENCE: HIGH]

- Pixi.js WebGL renderer with force-directed physics simulation
- Global graph (all notes) or local graph (N-hop neighborhood)
- Filters: text, tag, path, property, boolean operators
- Color groups, size by backlink count, toggle tags/attachments/orphans
- **Cannot:** execute programmatic queries, return structured data, expose API,
  run headlessly

### 3. Scale Limits [CONFIDENCE: MEDIUM-HIGH]

| Scale       | Behavior                                             |
| ----------- | ---------------------------------------------------- |
| 1,000 notes | Clean, minor editor lag with graph open              |
| 2,000-3,000 | Functional, ~2 sec delays in note selector           |
| 10,000      | "Expected speed" upper bound (official)              |
| 25,000      | "Practical with modern desktop" (official moderator) |
| 130,000     | Complete graph view failure, 10-min indexing         |

Prior D2a "3,000-6,000 bottleneck" likely refers to visual unreadability, not
technical crash. Performance cliff at 10,000-25,000. All bottlenecks are
single-core CPU.

### 4. Plugin Ecosystem for Graph Queries [CONFIDENCE: HIGH]

- **Dataview:** SQL-like DQL over YAML frontmatter. Can query
  `file.inlinks`/`file.outlinks`. DataviewJS for full JS API. Requires Obsidian
  running.
- **obsidian-graph-query (azuma520):** Hub detection, shortest path (BFS),
  bridge detection (Tarjan), connected components, orphan scan. Tested at 2,000+
  notes. Requires Obsidian CLI.
- **Graph Analysis plugin:** Similarity, link prediction, co-citations,
  community detection.
- **InfraNodus:** Community detection, betweenness centrality, 3D graph view.
  Cloud-dependent.

### 5. obra/knowledge-graph: The Reference Implementation [CONFIDENCE: HIGH]

Jesse Vincent's Claude Code plugin (March 2026). **Most directly relevant tool
found.**

- Parses Obsidian vaults by reading `.md` files directly (no Obsidian required)
- Extracts: YAML frontmatter, `[[wiki links]]`, `#hashtags`, enclosing paragraph
  context
- Stores in **SQLite** with `sqlite-vec` + **FTS5**
- Embeddings: `Xenova/all-MiniLM-L6-v2` via `@huggingface/transformers` — 22MB,
  384-dim, fully local
- Graph algorithms via **graphology**: Louvain community detection, betweenness
  centrality, PageRank, BFS, DFS
- 10 MCP tools: `kg_node`, `kg_search`, `kg_paths`, `kg_neighborhood`,
  `kg_community_detection`, `kg_bridges`, `kg_hubs`, `kg_shared_connections`,
  `kg_stats`, `kg_reindex`
- Design philosophy: "No LLM inside the tool — the agent does the reasoning"
- Incremental indexing by default (tracks file mtimes)

### 6. Harper Reed's Pipeline [CONFIDENCE: HIGH]

Working proof-of-concept (March 2026):

1. Granola (meeting transcription) + Muesli (Rust CLI) → ~600 meeting
   transcripts
2. Claude Code skill → structured Obsidian markdown with `[[wiki links]]`
3. Untyped co-occurrence graph (people + concepts linked by meeting co-presence)
4. Key insight: "Stop manually curating — let the system follow the work"

### 7. CLI/Headless Operation [CONFIDENCE: HIGH]

- **obsidian-headless (official, Feb 2026):** Sync and Publish ONLY. Does NOT
  expose MetadataCache, graph, or queries.
- **Headless vault access (filesystem-based):** Fully possible without Obsidian:
  - `mcpvault` (bitbonsai) — 14 MCP methods, pure filesystem
  - `vault-sync` — headless sync daemon + 8 MCP tools
  - `obra/knowledge-graph` — full graph analysis
  - All compatible with Node.js 18+, Windows

### 8. MCP Server Ecosystem [CONFIDENCE: HIGH]

| Server                            | Obsidian Required | Key Capabilities                                     |
| --------------------------------- | ----------------- | ---------------------------------------------------- |
| `mcpvault`                        | No                | 14 methods: R/W/patch/search/frontmatter/tags        |
| `obsidian-mcp-server` (cyanheads) | Yes               | R/W/search + in-memory cache                         |
| `obra/knowledge-graph`            | No                | 10 graph tools, semantic search, community detection |
| `MegaMem`                         | Partially         | 21 tools, Neo4j/FalkorDB backend                     |
| `vault-sync`                      | No                | 8 tools: list/R/W/search/edit/delete/move/copy       |

MegaMem is notable: Obsidian files + Neo4j graph database = best of both.

### 9. As Backend vs Inspiration [CONFIDENCE: HIGH]

**Can T28 USE Obsidian as storage?** Yes, with caveats:

- Pros: Zero-cost, human-readable, no lock-in, rich MCP ecosystem, works
  headlessly
- Cons: No typed relationships (all edges are `[[link]]`), no schema
  enforcement, YAML frontmatter fragile, graph queries need separate index layer

**Three-layer architecture from blakecrosley.com (production-validated at 16,894
files):**

1. **Intake layer** — quality control, deduplication
2. **Retrieval layer** — hybrid BM25 + vector (SQLite FTS5 + sqlite-vec), RRF
   fusion
3. **Integration layer** — MCP server

**Right abstraction for T28:** "Files = source of truth, SQLite = query layer,
agent = reasoning layer"

### 10. Scale Benchmarks (blakecrosley.com) [CONFIDENCE: HIGH]

| Scale        | Architecture         | Query Latency | Index Size   |
| ------------ | -------------------- | ------------- | ------------ |
| 50-500 notes | BM25-only sufficient | <5ms          | trivial      |
| 500-5,000    | BM25 + vector + RRF  | ~23ms (p50)   | ~83MB at 16K |
| 16,894 files | Full pipeline        | ~23ms (p50)   | 83MB         |

Incremental reindex: <10 sec. Full reindex: ~4 min. At T28's 1,000 nodes:
lightweight and fast.

---

## Sources

| #     | Title                                                      | Type               | Trust       |
| ----- | ---------------------------------------------------------- | ------------------ | ----------- |
| 1-4   | DeepWiki: MetadataCache, Links, Properties, Graph View     | Docs mirror        | HIGH        |
| 5-6   | Graph View Physics (forum), Official docs                  | Community/Official | MEDIUM-HIGH |
| 7-9   | Large vault performance reports (forum)                    | Community          | MEDIUM      |
| 10-13 | Dataview, obsidian-graph-query, Graph Analysis, InfraNodus | Plugin docs        | MEDIUM-HIGH |
| 14-15 | obra/knowledge-graph GitHub + Jesse Vincent blog           | Author/repo        | HIGH        |
| 16    | Harper Reed blog (March 2026)                              | Author blog        | HIGH        |
| 17    | obsidian-headless GitHub                                   | Official           | HIGH        |
| 18-23 | MCP server repos (mcpvault, cyanheads, MegaMem, etc.)      | Community          | MEDIUM      |
| 24-26 | blakecrosley.com Obsidian as AI Infrastructure             | Practitioner       | HIGH        |

---

## Contradictions

1. **3,000-6,000 bottleneck (prior D2a) vs this research:** No source pinpoints
   that range. Evidence shows 10,000-25,000 as functional-but-degraded. Prior
   figure likely means "visually unnavigable" not technical crash.

2. **obsidian-headless release date:** One source says "February 2024" —
   confirmed as **February 2026** per official GitHub. The 2024 date is an
   error.

---

## Gaps

1. Dataview headless execution path not confirmed
2. obra/knowledge-graph Windows 11 native binding compatibility unverified
3. MegaMem + Neo4j performance at T28 scale not found

---

## Serendipity

1. **Three-layer architecture (blakecrosley.com):** Production-validated
   Intake/Retrieval/MCP pattern directly actionable for T28
2. **MegaMem hybrid (Obsidian + Neo4j):** Phase 2 upgrade path
3. **obra/knowledge-graph "prove-claim" skill:** Ready-made claim investigation
   workflow for T28
4. **Credential filtering pattern:** Anti-pattern scrubbing (API keys, PATs)
   before embedding — adopt from day one
