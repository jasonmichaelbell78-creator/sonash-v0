# Findings: Popular/Established Graph MCP Servers

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-07 **Sub-Question:** D5a-1

---

## Summary

9 established graph MCP servers surveyed. **n-r-w/knowledgegraph-mcp** is the
best direct match for T28 (flat #tags, fuzzy search, SQLite+Postgres, Windows,
Node.js). obra/knowledge-graph has the best architecture
(SQLite+FTS5+sqlite-vec+graphology+graph analytics) but is Obsidian-vault-only.
Graphiti has strongest temporal capabilities but requires Neo4j/FalkorDB
infrastructure. The official @modelcontextprotocol/server-memory is inadequate
(JSONL, no tags, no fuzzy). Code-specific servers (code-review-graph,
codebase-memory-mcp) are not relevant.

---

## Comparison Table

| Server                            | Stars    | Backend             | Tags | Fuzzy      | Vector       | Node.js/Win     | T28 Fit    |
| --------------------------------- | -------- | ------------------- | ---- | ---------- | ------------ | --------------- | ---------- |
| server-memory (official)          | 83K repo | JSONL file          | No   | No         | No           | Yes/Yes         | LOW        |
| n-r-w/knowledgegraph-mcp          | 20       | PG+SQLite           | YES  | YES        | No           | Yes/Yes         | **HIGH**   |
| obra/knowledge-graph              | 56       | SQLite+vec+FTS5     | No   | Fuzzy name | YES (local)  | Yes/Unconfirmed | MEDIUM     |
| shaneholloman/mcp-knowledge-graph | 838      | TS files            | No   | No         | No           | Yes/Likely      | LOW-MEDIUM |
| gannonh/memento-mcp               | 413      | Neo4j               | No   | No         | YES (OpenAI) | Yes+Docker      | MEDIUM     |
| getzep/graphiti                   | 24.6K    | Neo4j/FalkorDB/Kuzu | No   | No         | YES (hybrid) | Python+Docker   | MEDIUM     |
| memory-graph/memory-graph         | 203      | 8 backends          | YES  | YES        | No           | Python          | MEDIUM     |
| code-review-graph                 | 4.2-5.9K | SQLite              | No   | No         | Optional     | Python          | NONE       |
| codebase-memory-mcp               | 1.3K     | SQLite (C)          | No   | No         | No           | C binary        | NONE       |

---

## Key Findings

### 1. @modelcontextprotocol/server-memory [CONFIDENCE: HIGH]

Official reference. JSONL flat file, 9 tools, substring search only. ~103K npm
downloads/month (mostly tutorial followers). Windows supported. **Inadequate for
T28** — no tags, no fuzzy, no vector, JSONL doesn't scale.

### 2. obra/knowledge-graph [CONFIDENCE: MEDIUM-HIGH]

56 stars, March 2026. SQLite + better-sqlite3 + sqlite-vec + FTS5. 10 MCP tools
including graph analytics (PageRank, Louvain community detection, betweenness
centrality via graphology). Local embeddings (22MB MiniLM). **"No LLM inside the
tool"** design. **Obsidian-vault-only** — parses `[[wiki links]]` from `.md`
files. Windows unconfirmed. Architecture is ideal for T28 but data model
constraint is a blocker unless T28 stores data as Obsidian vault.

### 3. n-r-w/knowledgegraph-mcp [CONFIDENCE: HIGH]

20 stars, 117 commits. Enhanced official server with **flat tags** (exact-match,
case-sensitive), **fuzzy search**, dual backend (PostgreSQL + SQLite). 8+ tools.
Entity limit defaults to 10K (configurable to 100K). Windows explicit support.
Node.js. **Best direct match for T28 requirements.** Low star count is a
maintenance risk.

### 4. getzep/graphiti [CONFIDENCE: HIGH]

24.6K stars. Temporal knowledge graphs with bi-temporal tracking. Backends:
Neo4j, FalkorDB, Kuzu, Neptune. 7 MCP tools (experimental). Requires LLM API for
ingestion. Strongest temporal capabilities but heavy infrastructure. **Overkill
for T28 v1** unless temporal fact tracking is required.

### 5. gannonh/memento-mcp [CONFIDENCE: HIGH]

413 stars. Neo4j-backed. 16 tools including semantic search (OpenAI embeddings),
temporal features (point-in-time graph, confidence decay with 30-day half-life).
Via Docker. Rich but heavyweight.

### 6. memory-graph/memory-graph [CONFIDENCE: MEDIUM]

203 stars. Python. 8 backends including embedded options (FalkorDBLite,
LadybugDB). Tag filtering + fuzzy search. 7 relationship categories with named
types. **Last commit Dec 2024** — recency concern. Python-based (not Node.js).

### 7. shaneholloman/mcp-knowledge-graph [CONFIDENCE: MEDIUM-HIGH]

838 stars. Fork of official server. Multi-database isolation (project-scoped).
10 tools. No tags, no fuzzy beyond baseline. Moderate enhancement.

### 8-9. Code-specific (code-review-graph, codebase-memory-mcp) [CONFIDENCE: HIGH]

Not relevant for T28. Code intelligence only.

---

## Sources

| #     | Title                                                      | Type           | Trust       |
| ----- | ---------------------------------------------------------- | -------------- | ----------- |
| 1-3   | Official server-memory (GitHub, npm, MCP directory)        | Official       | HIGH        |
| 4-6   | obra/knowledge-graph (GitHub, author blog, repo analysis)  | Author/repo    | HIGH        |
| 7-9   | n-r-w/knowledgegraph-mcp (GitHub, LobeHub, mcpservers.org) | Repo/directory | HIGH        |
| 10-12 | code-review-graph, codebase-memory-mcp                     | GitHub repos   | HIGH        |
| 13-15 | Graphiti (GitHub, MCP README)                              | Official       | HIGH        |
| 16-18 | memento-mcp, memory-graph, shaneholloman                   | GitHub repos   | MEDIUM-HIGH |

---

## Contradictions

1. **code-review-graph star count:** 4.2K vs 5.9K across sources — likely
   scraping date difference.
2. **server-memory stars:** 83.2K is monorepo-wide, not memory-specific.
3. **Graphiti MCP tool count:** 5-7 per official README vs more in directory
   listings (community forks).

---

## Gaps

1. obra/knowledge-graph Windows compatibility unconfirmed (sqlite-vec native
   binaries)
2. n-r-w/knowledgegraph-mcp Node.js minimum version not documented
3. obra/knowledge-graph adaptability to non-Obsidian data not documented
4. deanacus/knowledge-graph-mcp mentioned as having explicit tag operations —
   not deeply investigated

---

## Serendipity

1. **FalkorDB embedded (FalkorDBLite)** — multiple servers support it. Lighter
   than Neo4j with native Cypher.
2. **Local 22MB embedding models** now viable — zero cloud cost semantic search
   (MiniLM-L6-v2 via @huggingface/transformers).
3. **"No LLM inside the tool"** design from obra — pure data infrastructure,
   agent does reasoning. Maps to T28's dual interaction model.
4. **deanacus/knowledge-graph-mcp** has explicit `tag_entity()` and
   `get_entities_by_tag()` — potential flat-tag candidate worth follow-up.
