# D2a: Obsidian/Logseq as Graph Backend

**Searcher:** deep-research-searcher | **Profile:** web+docs | **Date:**
2026-04-07 **Sources:** 21 | **Confidence:** HIGH:8, MEDIUM:3

---

## Obsidian: Strong Fit for T28

### Graph Capabilities

- Every `.md` file = node, every `[[wiki-link]]` = directed edge
- Live metadata cache (`app.metadataCache.resolvedLinks`) queryable from JS
- `obra/knowledge-graph` tool (March 2026): exports vault to SQLite + vector +
  graphology, exposes PageRank, Louvain, betweenness centrality, BFS as MCP
  tools

### API Access

- **Local REST API plugin:** Full CRUD, surgical patch (append/prepend at
  heading/block/frontmatter), Dataview DQL queries, tag enumeration. HTTPS +
  Bearer token. **Requires Obsidian desktop running.**
- **Official CLI (GA Feb 2026):** `obsidian eval` for arbitrary JS against live
  vault
- **Filesystem-direct MCP servers:** MCPVault (725 stars), obsidian-mcp (650
  stars) — work WITHOUT Obsidian running

### Query Layer

- **Dataview (3M downloads):** DQL query language + full JS API with TypeScript
  typings. Mature, reliable.
- **Datacore (beta v0.1.28):** Faster, React-based API, not yet stable
- **Obsidian Bases (core, v1.9.0+):** Auto-generated dynamic table views from
  YAML queries. Fastest, no code, but table-only.

### Scale

- Editor/API: 10,000+ notes clean
- Graph view renderer: bottlenecks at 3,000-6,000 densely-linked notes
- At T28's 1,000 nodes: everything works
- Beyond 2,000: skip built-in graph view, use external graph engines

### Metadata

- YAML frontmatter fully supported, indexed by Dataview/Bases/MCP servers
- Typed relationship metadata (source type, domain, trust score, extraction
  candidates, date) works natively

### MCP / Claude Code Integration (PROVEN)

- `cyanheads/obsidian-mcp-server` (TypeScript, 400+ stars)
- `mcp-obsidian` (Python, 3,000+ stars)
- `obra/knowledge-graph` — purpose-built Claude Code plugin, 10 graph operations
- `obsidian-graph-query` skill — uses CLI eval for BFS/bridge/orphan analysis
- Integration is **production-ready**

### Graph Visualization

- Juggl (typed edges, multiple layouts) + Breadcrumbs (typed directional
  hierarchies) = best combo
- Graph Analysis plugin: centrality metrics in WASM
- InfraNodus: semantic/topic-modeling (SaaS)

### Sync

- Git: natural fit for developer vault, same toolchain, free, audit trail
- Obsidian Sync ($4/mo) for multi-device including mobile

### Serendipity

- **Harper Reed's pipeline (March 2026):** Claude Code parses sources → Obsidian
  nodes via wiki-links. Working T28 proof-of-concept.
- `obsidian cli eval` against `app.metadataCache.resolvedLinks` = graph queries
  from Claude Code with zero infrastructure
- Obsidian Bases `.base` files could auto-populate as dynamic source registries

---

## Logseq: NOT Recommended

- Block-level linking is richer (sub-note granularity)
- Datalog query engine is powerful
- BUT: DB version **abandons plain-text markdown** for SQLite — violates T28's
  markdown-native preference
- File-based version in maintenance mode
- Plugin ecosystem 10x smaller, sync is DIY
- mcp-logseq requires Logseq running, weaker ecosystem

---

## Gaps

- Datacore stable release timeline unknown
- obra/knowledge-graph at 1,000+ nodes untested (released March 2026)
- Obsidian CLI reliability in headless/CI environments unconfirmed
- Graph view at exactly 1,000-3,000 nodes needs direct testing
