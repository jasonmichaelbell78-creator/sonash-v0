# Findings: Established Graph-Capable MCP Servers — Extended Landscape

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-07 **Sub-Question:** D5a-2

---

## Summary

Extended survey of graph-capable MCP servers beyond the top 5-6. **Prior claim
"only 2 serverless graph analytics MCP servers" is FALSE** — at least 6 found.
283 servers in the knowledge/memory MCP category total; ~15-20 have real graph
capabilities. Key discoveries: graphthulhu (131 stars, Go binary,
Logseq+Obsidian, Windows binary), TurboVault (109 stars, Rust, centrality
algorithms, Unix socket limitation on Windows), Context Portal (760 stars,
SQLite, project-scoped). Neo4j has 3 MCP repos but all require running server.
LiteGraph has 145+ tools but requires REST server.

---

## Serverless Graph Analytics Correction

Prior research claimed only 2 serverless MCP servers offer graph analytics. This
survey found **at least 6:**

| Server                   | Analytics                                              | Backend           | Stars |
| ------------------------ | ------------------------------------------------------ | ----------------- | ----- |
| obra/knowledge-graph     | Louvain, PageRank, betweenness                         | SQLite+graphology | 56    |
| codebase-memory-mcp      | Louvain community detection                            | SQLite (C binary) | 1,300 |
| graphthulhu              | Connected components, shortest paths, gap detection    | Go binary         | 131   |
| TurboVault               | Betweenness, closeness, eigenvector, cluster detection | Rust              | 109   |
| blacksmithers/vaultforge | TF-IDF clustering, BM25                                | Node.js           | 6     |
| InfraNodus               | Modularity, betweenness, community detection           | SaaS API          | 77    |

---

## Key Findings

### 1. LiteGraph MCP [CONFIDENCE: HIGH]

103 stars. .NET SQLite property graph. **145+ tools.** DFS, route finding, GEXF
export, vector similarity, tag/label filtering. **Requires REST server** (not
serverless for MCP). Windows confirmed (.bat scripts). MIT. Strong CRUD but no
community detection or centrality.

### 2. graphthulhu [CONFIDENCE: HIGH]

131 stars. Go binary. **Supports both Logseq AND Obsidian** — only MCP server
with dual support. 37 tools across 9 categories. Connected components, shortest
paths, knowledge gap detection. **Windows binary available.** MIT. Last commit
Jan 2026.

### 3. TurboVault [CONFIDENCE: HIGH]

109 stars. Rust. 44 tools. Betweenness, closeness, eigenvector centrality +
cluster detection. Operates on markdown vaults directly. **Windows limitation:
Unix sockets only on Unix/macOS/Linux** — must use stdio or HTTP transport. No
Obsidian required.

### 4. Neo4j MCP Ecosystem [CONFIDENCE: HIGH]

3 repos, all require running Neo4j:

- `neo4j/mcp` (official, 204 stars) — 4 tools, schema + Cypher
- `neo4j-contrib/mcp-neo4j` (labs, 932 stars) — 4 sub-servers
- `neo4j-contrib/gds-agent` (77 stars) — full GDS algorithm library via MCP

Neo4j Aura Graph Analytics has serverless cloud mode (65+ algorithms on pandas
DataFrames) but no dedicated MCP server.

### 5. Context Portal (ConPort) [CONFIDENCE: HIGH]

760 stars. SQLite per workspace. 30+ tools.
`link_conport_items`/`get_linked_items` with relationship types. Vector
embeddings + FTS5. Windows confirmed. Apache-2.0. Project-scoped knowledge graph
— strong for dev workflows.

### 6. FalkorDB MCPServer [CONFIDENCE: HIGH]

33 stars. Requires running FalkorDB (Redis-compatible). OpenCypher queries.
Shortest path, WCC, CDLP community detection. Windows unconfirmed.

### 7. memory-graph Clarification [CONFIDENCE: HIGH]

203 stars. **Backends: SQLite, Neo4j, FalkorDB, FalkorDBLite, LadybugDB, Turso,
Cloud.** Prior research's "MemGraph" claim is UNVERIFIED — MemGraph does not
appear in this repo's documentation. Last commit Dec 2024 (stale).

### 8. Specialized/Niche Servers

| Server                   | Stars | Backend           | Notable                                    |
| ------------------------ | ----- | ----------------- | ------------------------------------------ |
| novyx-mcp                | 27    | SQLite            | 107 tools, triple storage, 14 months stale |
| mcp-duckdb-memory-server | 55    | DuckDB embedded   | SQL-powered graph queries                  |
| agent-recall             | 9     | SQLite bitemporal | Historical slot queries, time-travel       |
| LightRAG MCP servers     | 0-30  | LightRAG+LLM      | Graph-RAG hybrid, server required          |
| ArangoDB MCP             | 3     | ArangoDB Docker   | 46 tools, multi-model                      |

### 9. mcpvault — NOT a Graph MCP [CONFIDENCE: HIGH]

1,000 stars but file operations + tag management only. No backlinks, forward
links, or path finding. Essentially a file browser. Does not qualify as graph
MCP.

---

## Sources

| #     | Title                                          | Type         | Trust  |
| ----- | ---------------------------------------------- | ------------ | ------ |
| 1-2   | LiteGraph (GitHub, website)                    | Official     | HIGH   |
| 3     | memory-graph (gregorydickson)                  | GitHub       | HIGH   |
| 4-6   | Neo4j MCP repos (official, contrib, gds-agent) | Official     | HIGH   |
| 7     | Neo4j Aura Graph Analytics docs                | Official     | HIGH   |
| 8     | obra/knowledge-graph                           | Community    | MEDIUM |
| 9     | codebase-memory-mcp                            | Community    | HIGH   |
| 10    | graphthulhu                                    | Community    | HIGH   |
| 11    | TurboVault (Epistates)                         | Community    | HIGH   |
| 12    | InfraNodus MCP                                 | Official     | HIGH   |
| 13    | mcpvault (bitbonsai)                           | Community    | HIGH   |
| 14    | FalkorDB MCPServer                             | Official     | HIGH   |
| 15-17 | Context Portal, novyx-mcp, ArangoDB MCP        | Community    | MEDIUM |
| 18    | TensorBlock awesome-mcp-servers list           | Curated list | MEDIUM |

---

## Contradictions

1. **"Only 2 serverless graph analytics"** — directly contradicted. At least 5-6
   found. Prior claim used narrow definition or landscape changed.
2. **memory-graph MemGraph claim** — MemGraph not in repo documentation. Prior
   research error or confusion with different repo.
3. **mcpvault star count** — badge claims 1,000 but last commit 14 months ago.

---

## Gaps

1. obra/knowledge-graph Windows Node.js testing unverified
2. FalkorDB MCPServer Windows compatibility unconfirmed
3. Cognee MCP tool count not confirmed
4. LiteGraph embedded SDK vs MCP server distinction matters for T28

---

## Serendipity

1. **graphthulhu supports Logseq AND Obsidian** — only dual-support MCP found.
   Windows binary available.
2. **283 servers in knowledge/memory MCP category** — largest MCP category.
   Graph-analytics-capable is ~15-20 (underserved).
3. **Neo4j Aura Analytics can run on pandas DataFrames without any Neo4j DB** —
   serverless graph analytics as cloud API.
4. **TurboVault Unix socket Windows limitation** — non-obvious incompatibility
   for Windows users.
5. **codebase-memory-mcp architecture** (SQLite+Louvain in static C binary) is a
   template adaptable for general knowledge graphs.
