# S1: Backend Landscape — T28 Intelligence Graph

**Synthesizer:** S1-backend-landscape **Source files:** 15 findings files
(D1a-1, D1a-2, D1b-1, D1b-2, D2a-1, D2a-2, D2b-1, D2b-2, D3, D5a-1, D5a-2,
D5b-1, D5b-2, D8, D15-1) **Date:** 2026-04-07 **Research question:** What
storage backends, MCP servers, and knowledge tools exist for T28's intelligence
graph, and how do they compare on maturity, Windows compatibility, and risk?

---

## 1. Executive Summary

For T28's solo Windows 11 / Node.js v22 context, the data layer question
resolves clearly: **SQLite with better-sqlite3 is the correct primary store**.
Five independent findings files converge on this independently (D1a-1, D1a-2,
D1b-2, D8, D15-1), and the evidence is unambiguous. Real-world graph deployments
on SQLite have been validated up to 2.1 million nodes; T28's projected
7,300–10,950 nodes over two to three years is orders of magnitude below any
performance ceiling. The simple-graph schema (nodes + edges tables with JSON
bodies, junction table for tags) is battle-tested, and better-sqlite3 v12.8.0
bundles SQLite 3.51.3 which closes a critical WAL corruption bug. Graph-native
alternatives (LadybugDB, CozoDB) are viable upgrade paths once query complexity
outgrows recursive CTEs, but they carry non-trivial risk for a first graph
project and are not recommended for v1.

The MCP server landscape is more fragmented. The official
@modelcontextprotocol/server-memory is structurally unsuitable — it uses a JSONL
flat file with full-rewrite semantics, no tag support, O(N) search, confirmed
data corruption on concurrent sessions, and degrades unusably beyond
approximately 2,000–3,000 entities in Node.js. No single replacement server
provides all three of T28's required capabilities (flat #tag API, per-node
confidence, and contradiction detection) simultaneously. The closest pragmatic
fit, n-r-w/knowledgegraph-mcp, was disqualified by a critical-risk finding: the
maintainer has publicly stated disillusionment and last committed in
December 2024. This leaves **building a thin custom MCP layer over a direct
SQLite implementation as the lowest-risk path** for T28 v1.

Knowledge tools (Obsidian, Logseq, Dendron, Foam, Trilium, SiYuan, TiddlyWiki,
Tana, Zettlr) should not be used as T28's storage backend, but they provide a
rich harvest of architectural patterns that directly inform the design. The most
important: files canonical for human-curated content, graph derived for
agent-extracted knowledge; typed edges from day one; stable node IDs decoupled
from display names; and a three-layer Intake/Retrieval/MCP architecture
validated in production at 16,894 files with 23ms p50 query latency.

---

## 2. Comparative Backend Matrix

All candidates evaluated against four T28 criteria: Windows 11 support, Node.js
v22 compatibility, T28 scale fit (~10K nodes), and v1 readiness.

### Primary Store Candidates

| Candidate                   | Write Latency                    | Windows               | Node.js          | Scale Fit           | Tags/FTS              | Risk            | v1 Verdict              |
| --------------------------- | -------------------------------- | --------------------- | ---------------- | ------------------- | --------------------- | --------------- | ----------------------- |
| **SQLite + better-sqlite3** | ~18µs (53K ops/s)                | Excellent (prebuilts) | Confirmed v22    | Well within ceiling | FTS5 + junction table | LOW             | **PRIMARY CHOICE**      |
| SQLite + node:sqlite        | ~24µs (41K ops/s)                | Built-in              | v22 native       | Well within ceiling | FTS5                  | LOW (zero deps) | Viable alternative      |
| DuckDB                      | ~400–900µs/row (structural)      | x64 OK                | @duckdb/node-api | Analytical only     | Extension             | LOW             | ANALYTICAL OVERLAY ONLY |
| LibSQL/Turso                | ~35µs (28K ops/s)                | Known errors (#1797)  | Yes              | Fine                | Via compat            | MEDIUM-HIGH     | NOT RECOMMENDED         |
| PGlite                      | ~57µs in-mem, 5x slower in batch | No Windows data       | Yes              | Fine                | pg extensions         | MEDIUM          | NOT RECOMMENDED         |
| LMDB                        | ~2µs (key-value only)            | x64 OK, ARM64 no      | lmdb-js          | N/A — no SQL        | None                  | MEDIUM          | OUT OF SCOPE            |

### Graph-Native Embedded Candidates

| Candidate                    | Query Language      | FTS           | Vector        | Windows                        | Node.js          | Maturity              | Risk        | v1 Verdict           |
| ---------------------------- | ------------------- | ------------- | ------------- | ------------------------------ | ---------------- | --------------------- | ----------- | -------------------- |
| **LadybugDB v0.15.3**        | Cypher (openCypher) | BM25 built-in | HNSW built-in | CLI confirmed; NAPI unverified | @ladybug/core    | 6-month fork          | MEDIUM-HIGH | UPGRADE PATH (v2+)   |
| CozoDB                       | Datalog             | Yes           | Yes           | Confirmed                      | cozo-node        | Stalled Dec 2023      | HIGH        | RISKY                |
| Bighorn (@kineviz/kuzu-lite) | Cypher              | Yes           | Yes           | Unconfirmed                    | npm unverified   | Unknown governance    | HIGH        | NEEDS VERIFICATION   |
| DuckDB + DuckPGQ             | SQL/PGQ             | Extension     | Extension     | Excellent                      | @duckdb/node-api | Production-grade      | LOW         | READ-ONLY LAYER ONLY |
| RyuGraph                     | Cypher              | ?             | ?             | Unknown                        | No npm found     | Immature              | HIGH        | DISQUALIFIED         |
| Grafeo                       | GQL/Cypher          | BM25/HNSW     | Yes           | Unconfirmed                    | napi-rs          | HN flags AI-generated | CRITICAL    | DISQUALIFIED         |

**Note on LadybugDB npm package name:** D15-1 identifies a discrepancy — the
correct npm package is `@ladybug/core`, NOT `@ladybugdb/core` as stated in
D1b-1. Verify before installing.

**Note on Kuzu:** Archived October 10, 2025 (Apple acquisition). LadybugDB is
the community fork. Any docs or MCP servers still referencing `kuzu` should be
mapped to LadybugDB.

### Scale Benchmarks — SQLite

| Repository                         | Nodes   | Edges  | Update Latency             |
| ---------------------------------- | ------- | ------ | -------------------------- |
| FastAPI (code-review-graph)        | 6,285   | 27,117 | 128ms                      |
| Flask                              | 1,446   | 7,974  | 95ms                       |
| Django (codebase-memory-mcp)       | 49K     | 196K   | Sub-1ms queries            |
| Linux kernel (codebase-memory-mcp) | 2.1M    | 4.9M   | ~150ms dead-code detection |
| **T28 projected (3 years)**        | ~10,950 | ~20K+  | **Negligible**             |

---

## 3. MCP Server Landscape

### 3a. Official Server — Disqualified

**@modelcontextprotocol/server-memory** (83K stars in monorepo, ~103K npm
downloads/month) should not be used for T28.

Confirmed defects (open GitHub issues):

- #2415: 80K+ token files degrade severely; in Node.js single-threaded the
  effective ceiling is ~2,000–3,000 entities
- #2577: Race condition on concurrent sessions causes silent JSONL corruption —
  Windows with two Claude Code windows triggers this
- #3074: Schema validation bug breaks all reads
- No tags, no FTS, no vector, O(N) substring search, full-rewrite on every
  operation

T28 at ~10 sources/day would hit the entity ceiling around day 500 at the
latest. This server was designed as a reference implementation, not production
infrastructure.

### 3b. Established MCP Servers — Ranked for T28

| Server                            | Stars | Backend                           | Tags               | Fuzzy      | Vector            | Windows              | Risk                                | T28 Fit                            |
| --------------------------------- | ----- | --------------------------------- | ------------------ | ---------- | ----------------- | -------------------- | ----------------------------------- | ---------------------------------- |
| obra/knowledge-graph              | 56    | SQLite+FTS5+sqlite-vec+graphology | No                 | Fuzzy name | Yes (MiniLM 22MB) | Unconfirmed          | MEDIUM                              | MEDIUM — Obsidian-vault input only |
| shaneholloman/mcp-knowledge-graph | 838   | TypeScript files                  | No                 | No         | No                | Likely               | LOW-MEDIUM                          | LOW-MEDIUM                         |
| n-r-w/knowledgegraph-mcp          | 20    | SQLite/Postgres                   | YES                | YES        | No                | Confirmed            | **CRITICAL** (maintainer abandoned) | REFERENCE ONLY                     |
| gannonh/memento-mcp               | 413   | Neo4j                             | No                 | No         | Yes (OpenAI)      | Docker               | MEDIUM                              | MEDIUM — requires Docker           |
| getzep/graphiti                   | 24.6K | Neo4j/FalkorDB/Kuzu               | No                 | No         | Yes (hybrid)      | pip+file (Kuzu path) | MEDIUM                              | MEDIUM — Python, LLM required      |
| Context Portal (ConPort)          | 760   | SQLite                            | Relationship types | FTS5       | Yes               | Confirmed            | LOW                                 | MEDIUM — dev-workflow oriented     |
| graphthulhu                       | 131   | Go binary (Logseq+Obsidian)       | No                 | No         | No                | Binary available     | LOW-MEDIUM                          | LOW — vault-format input           |
| memory-graph/memory-graph         | 203   | 8 backends incl. LadybugDB        | YES                | YES        | No                | Likely               | MEDIUM (stale Dec 2024)             | MEDIUM — Python                    |
| LiteGraph MCP                     | 103   | .NET SQLite                       | Yes                | Yes        | Vector similarity | Confirmed (.bat)     | LOW-MEDIUM                          | MEDIUM — requires REST server      |

**Critical finding:** n-r-w/knowledgegraph-mcp was the best direct match on
paper (flat tags, fuzzy search, SQLite, Windows, Node.js). D15-1 disqualifies it
with a risk rating of CRITICAL: the maintainer has publicly stated
disillusionment with automated context management tools and last committed
December 16, 2024. It can be referenced for schema/API design patterns but
should not be a live dependency.

### 3c. Emerging/Heavyweight Servers

| System                   | Graph Type     | Windows Path        | Custom Types | Tags         | Confidence       | LongMemEval | Stars |
| ------------------------ | -------------- | ------------------- | ------------ | ------------ | ---------------- | ----------- | ----- |
| Graphiti+Kuzu            | Temporal KG    | pip+file (embedded) | Pydantic     | Custom field | Addable          | 63.8%       | 24.6K |
| mem0 (graph enabled)     | Entity graph   | Neo4j Desktop       | Limited      | No           | Edge threshold   | 68.4%       | 52.2K |
| rohitg00/AgentMemory     | BFS KG         | npx (Node.js)       | Implicit     | No           | Unverified       | 64%\*       | 586   |
| JordanMcCann/AgentMemory | Entity+BFS     | Explicit Windows    | No           | No           | No               | 96.2%\*\*   | 7     |
| Ogham                    | Semantic graph | Docker/uvx          | No           | No           | No               | 91.8%       | 86    |
| Neo4j agent-memory       | POLE+O KG      | .exe binary         | POLE+O       | Via Cypher   | Via Cypher       | N/A         | 115   |
| kuzu-memory-graph-mcp    | Property graph | pip (Win wheel)     | Flexible     | Observations | **Yes (native)** | N/A         | 0     |

\*Self-reported, not LongMemEval \*\*Solo claim, 7 stars, unverified

**Notable:** kuzu-memory-graph-mcp (jkear) is the only MCP server found with a
native `confidence` parameter on relationship tool signatures — T28's per-node
confidence requirement maps directly to it. However, it has 0 stars and 0
independent adoption.

### 3d. Lightweight Servers — Capability Gaps

No single lightweight server provides all three of: flat #tag API, per-node
confidence, and contradiction detection.

| Feature                 | Best Available                    | Server                       | Stars        | Gap                                   |
| ----------------------- | --------------------------------- | ---------------------------- | ------------ | ------------------------------------- |
| Flat #tags              | 5 dedicated tag tools             | deanacus/knowledge-graph-mcp | 0 (1 commit) | Zero production validation            |
| Per-node confidence     | Multi-signal formula              | knowledge-graph-rag-mcp      | N/A          | Alpha, Python                         |
| Contradiction detection | First-class (ConstraintSignature) | mind-mem                     | 10           | No flat #tag support; Python          |
| All three combined      | —                                 | —                            | —            | **Gap: no server delivers all three** |

**mind-mem** is architecturally interesting despite 10 stars: 2,189 unit tests,
constraint-signature contradiction detection, BM25+vector+RRF search, Windows
confirmed, and all mutations require `/apply` with DIFF receipt. Its limitation
for T28 is a rigid 20-category metadata taxonomy instead of free-form flat tags.

**MemoryMesh** (340 stars, Node.js v22, schema-driven auto-tool-generation) is
compelling for schema flexibility but has no meaningful search — no FTS, no
vector, no fuzzy matching. Breaks at >10K nodes due to JSON storage.

### 3e. Serverless Graph Analytics — Corrected Count

Prior research claimed only 2 serverless MCP servers offer graph analytics.
D5a-2 identifies at least 6:

| Server                   | Analytics Available                                      |
| ------------------------ | -------------------------------------------------------- |
| obra/knowledge-graph     | Louvain, PageRank, betweenness (graphology)              |
| codebase-memory-mcp      | Louvain community detection                              |
| graphthulhu              | Connected components, shortest paths, gap detection      |
| TurboVault               | Betweenness, closeness, eigenvector, cluster detection   |
| blacksmithers/vaultforge | TF-IDF clustering, BM25                                  |
| InfraNodus               | Modularity, betweenness, community detection (cloud API) |

TurboVault has a Windows incompatibility: it uses Unix sockets, requiring stdio
or HTTP transport workaround on Windows 11.

---

## 4. Knowledge Tool Patterns Worth Adopting

These tools are not recommended as T28 backends, but each contributes validated
patterns.

### Architecture Pattern: Three-Layer Pipeline (Obsidian ecosystem, validated at 16,894 files)

1. **Intake layer** — quality control, deduplication, credential scrubbing
   before embedding
2. **Retrieval layer** — hybrid BM25 + vector + RRF fusion (~23ms p50 at 16K
   files)
3. **Integration layer** — MCP server exposing tools to agents

Directly applicable to T28. Start with BM25-only (adequate under 500 nodes), add
vector at 500+.

### Schema Pattern: Files Canonical + Graph Derived (Obsidian, SiYuan, D8 synthesis)

- Human-curated content lives in Markdown files as source of truth
- Agent-extracted knowledge lives in the graph (regenerable from files)
- This boundary must be explicitly designed — bidirectional relationships and
  temporal tracking are structurally awkward in Markdown and belong in the graph
  layer
- Logseq's years-long painful migration from Markdown to SQLite is the
  cautionary example: start with a database from day one for agent-written data

### Identity Pattern: Stable IDs Decoupled from Display (Zettlr, Foam, Dendron)

- Node identity should be database-assigned UUID, not file path or display title
- Rename/move operations should update references automatically
- Path-based resolution creates brittle graphs (Dendron proved this at scale)

### Schema Pattern: Typed Edges from Day One (Dendron, D2b-2 synthesis)

- Minimum edge types for T28: `CONTAINS` (hierarchy), `REFERENCES` (explicit
  link), `INFERRED` (agent-generated), `CONTRADICTS` (conflict signal)
- Untyped undirected graphs become navigational hairballs at scale — confirmed
  by Zettlr's own documentation and PKM case studies at 8,000+ notes

### Schema Pattern: Typed Properties as First-Class Entities (Trilium, Logseq DB)

- Trilium's `attributes` table (label|relation types, isInheritable,
  targetNoteId) is the cleanest property graph schema in any PKM tool
- Logseq DB's Malli-validated typed properties with cardinality schema show how
  typed metadata prevents `key:: value` fragility
- T28's per-node confidence field belongs here as a typed attribute, not a
  free-form string

### Query Pattern: SQL as Agent Query Language (SiYuan)

- If the schema is simple and well-documented, agents can write SQL queries
  directly rather than needing a custom query DSL
- SiYuan's production experience validates this for knowledge graph workloads

### Design Anti-Pattern: Build General Intelligence Infrastructure First (Dendron)

- Dendron's post-mortem: excellent technical execution, zero PMF because it was
  a power tool without an anchored user workflow
- T28 should build the graph as a subsystem serving specific agent workflows,
  not a general-purpose intelligence layer

### Pattern: No LLM Inside the Tool (obra/knowledge-graph)

- "No LLM inside the tool — the agent does the reasoning" is the right
  separation of concerns for a data layer
- The graph provides data infrastructure; Claude provides reasoning
- Mixing LLM extraction into the storage layer (as Graphiti does) creates API
  key dependencies and latency on every write

---

## 5. Risk Assessment Summary

### By Component

| Component                 | Risk Level  | Key Risk                                                                       | Mitigation                                              |
| ------------------------- | ----------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| better-sqlite3 v12.8.0    | LOW         | Windows native build on non-LTS node                                           | Prebuilts available; verify WAL is 3.51.3               |
| SQLite 3.51.3 WAL         | LOW         | Previous 3.51.0–3.51.2 had corruption bug                                      | Fixed in 3.51.3; better-sqlite3 v12.8.0 bundles it      |
| graphology v0.26.0        | LOW         | Lower release cadence                                                          | Pure JS, zero native deps, maturity signal              |
| node:sqlite (built-in)    | LOW         | FTS5 extension availability unconfirmed                                        | Use better-sqlite3 as primary                           |
| sqlite-vec v0.1.9         | MEDIUM      | Solo maintainer (Alex Garcia); had 6-month dormancy                            | Pin to v0.1.9; defer vector until Phase 2               |
| @huggingface/transformers | MEDIUM      | v3→v4 breaking changes; known cache issues                                     | Configure explicit cache path; 23MB first-run download  |
| LadybugDB v0.15.3         | MEDIUM-HIGH | 6-month fork; npm name discrepancy (`@ladybug/core`); NAPI Windows unconfirmed | Test install before committing; WASM fallback available |
| n-r-w/knowledgegraph-mcp  | CRITICAL    | Maintainer publicly abandoned; last commit Dec 2024                            | Use as reference only; do not take as dependency        |
| official server-memory    | CRITICAL    | Data corruption, no tags, 80K token ceiling                                    | Do not use for T28                                      |
| CozoDB                    | HIGH        | Stalled since Dec 2023, pre-1.0                                                | Defer unless confirmed active                           |
| DuckDB (as primary)       | HIGH        | Structural 10–500x write penalty                                               | Analytical overlay only                                 |

### Bus Factor Risks (Kuzu/LadybugDB lineage)

The Kuzu fork ecosystem has fragmented into at least three forks (LadybugDB,
Bighorn, RyuGraph). LadybugDB has the strongest community signals (896 stars, 67
contributors, MIT, monthly releases). However, the project leader is a single
named individual, the fork is six months old, and funding is unconfirmed. The
WASM fallback (`lbug-wasm`) significantly reduces the native-binding risk but
does not address strategic continuity.

This fragmentation itself is a risk signal. SQLite has no equivalent concern.

---

## 6. Recommendation

### v1: Build Direct, Not Adopt

**Do not adopt any existing MCP server as a primary dependency for T28 v1.**

The three best options (n-r-w — abandoned, official server-memory — structurally
broken, obra/knowledge-graph — Obsidian-vault-only) all have blocking
constraints. The correct path is:

1. **Primary store:** SQLite + better-sqlite3 v12.8.0 with WAL mode enabled
2. **Schema:** simple-graph (nodes + edges tables, JSON bodies), plus a
   `node_tags` junction table (not json_each() — Willison March 2026 benchmark
   confirms junction table is fastest for tag search)
3. **MCP layer:** Build a thin custom MCP server (TypeScript, direct
   better-sqlite3 calls) with tools shaped to T28's actual workflows — roughly
   5–8 tools initially. This avoids all current server-maintenance-risk, fits
   the Node.js v22 environment, and keeps the schema under direct control.
4. **Graph algorithms:** graphology (pure JS, 1,600+ stars, 4,900+ dependents,
   zero native deps) for in-process traversal, community detection, and
   centrality when needed
5. **Analytical overlay (Phase 2, optional):** DuckDB + sqlite_scanner — attach
   the SQLite file read-only, run aggregation queries 30–50x faster than SQLite
   without any schema changes or replication

**Confidence: HIGH** — this recommendation is supported by all five
architecture-focused findings files (D1a-1, D1a-2, D8, D15-1, D2b-2) and is
consistent with the best-practices pattern from the most successful knowledge
tool implementations surveyed.

### v2 Upgrade Path: LadybugDB

When (and only when) T28's graph queries need 4+ hop cycle-safe traversal,
multi-edge-type pattern matching, or Cypher expressiveness that recursive CTEs
cannot serve efficiently:

- Test `npm install @ladybug/core` (note: NOT `@ladybugdb/core`) on Windows 11 +
  Node.js v22
- If native binding works, migrate; if not, use `lbug-wasm` in a worker thread
- Data migration: export SQLite nodes/edges → import to LadybugDB (both support
  JSON)
- Graduation trigger is explicit: query complexity, not timeline

**Confidence: MEDIUM** — LadybugDB is technically sound but the 6-month fork
age, single named leader, and unverified Windows NAPI binding introduce risk
that makes it inappropriate as a starting point for a first graph project.

### What to Skip Entirely

- **Graphiti/Zep:** Strongest temporal graph capabilities, but requires Python
  runtime, external LLM API on every write, and Neo4j or Docker. Over-engineered
  for T28 v1.
- **mem0:** 52.2K stars is primarily adoption of the vector-first system; graph
  is an add-on requiring additional LLM calls per operation. Not graph-native.
- **FalkorDB/FalkorDBLite:** FalkorDBLite explicitly excludes Windows. FalkorDB
  requires Docker on Windows.
- **Server-hosted graph DBs (Neo4j, Memgraph, ArangoDB):** No server, no Docker,
  no port management — embedded wins for solo developer. LadybugDB/Kuzu
  benchmarks show 18x faster ingestion and 180x faster path-finding vs Neo4j
  Community Edition.

---

## 7. Contradictions Found

### C1: SQLite CTE Scale Ceiling — Conservative vs Generous Estimates

- D1a-1: SQLite recursive CTEs adequate for T28's scale (~10K nodes), with depth
  caps
- D8: "1M nodes for linear traversals" (generous) vs "100–1,000 documents"
  (conservative) — different query complexity assumptions
- **Resolution:** Both are correct for different query shapes. T28's traversal
  patterns (1–3 hop, sparsely connected) will be adequate well past 100K nodes.
  The ceiling is query shape (5+ hops, cyclic multi-path dedup), not raw node
  count. T28 should include depth limits on all CTE traversal queries from day
  one.

### C2: n-r-w/knowledgegraph-mcp — Best Fit vs CRITICAL Risk

- D5a-1, D5b-2: rates n-r-w as HIGH fit — flat tags, fuzzy, SQLite, Windows,
  Node.js
- D15-1: rates n-r-w as CRITICAL risk — maintainer publicly abandoned it, last
  commit Dec 2024
- **Resolution:** D15-1 wins. A server whose maintainer has explicitly
  disengaged is not a viable dependency regardless of feature fit. Use it as an
  API design reference only.

### C3: LadybugDB npm Package Name

- D1b-1, D5b-1: reference `@ladybugdb/core`
- D15-1: states the correct package is `@ladybug/core` (NOT `@ladybugdb/core`)
- **Resolution:** Verify on npmjs.com before installing. D15-1 is the most
  recent findings file and specifically investigated this; treat `@ladybug/core`
  as authoritative until confirmed.

### C4: memento (iAchilles) — "Near-Perfect T28 Match" vs Windows Unverified

- D3: rates iAchilles/memento as HIGH fit — SQLite+FTS5+sqlite-vec+offline
  embeddings
- D5b-2: downgrades assessment — README shows macOS/Linux only, sqlite-vec .dll
  path undocumented, last commit Oct 2025 (6-month gap)
- **Resolution:** D5b-2's assessment is better-grounded (more specific
  evidence). memento is architecturally ideal but has a blocking Windows gap
  that needs hands-on verification before relying on it.

### C5: Official MCP Server-Memory Star Count

- D5a-1: "83K monorepo stars"
- **Resolution:** This is the entire MCP repo star count, not
  memory-server-specific. The distinction matters for assessing community
  adoption of the specific server.

### C6: Serverless Graph Analytics Count

- D5a-1 (implicitly): narrow landscape implied
- D5a-2: explicitly corrects to at least 6 serverless graph analytics MCP
  servers
- **Resolution:** D5a-2 directly contradicts the prior claim. At least 6
  confirmed, likely more as the 283-server knowledge/memory MCP category
  continues growing.

### C7: Obsidian Scale Bottleneck

- D2a-1 finding references prior "3,000–6,000 bottleneck" claim from earlier
  research
- D2a-1 itself: bottleneck is at 10,000–25,000 (functional but degraded);
  130,000 is total failure
- **Resolution:** "3,000–6,000" refers to visual unnavigability, not technical
  crash. Technical performance cliff is an order of magnitude higher.

---

## 8. Open Questions Remaining

1. **LadybugDB NAPI on Windows 11 + Node.js v22:** Does
   `npm install @ladybug/core` complete without native build errors? The WASM
   fallback exists but adds worker-thread overhead. Needs a 5-minute local test
   before T28 v2 planning.

2. **node:sqlite FTS5 extension availability:** Is FTS5 available in Node.js
   v22's built-in `node:sqlite`? If yes, this becomes a zero-dependency option.
   If no, better-sqlite3 is required.

3. **obra/knowledge-graph Windows compatibility:** The sqlite-vec + graphology
   toolchain has confirmed Windows support individually, but obra's full
   pipeline has not been tested on Windows 11 end-to-end. If adapted for
   non-Obsidian input (T28 stores data differently), it could provide graph
   analytics immediately.

4. **DuckDB sqlite_scanner locking behavior:** When DuckDB attaches a SQLite
   file in read-only mode, does any lock get acquired that would block
   concurrent SQLite WAL writes? Needs hands-on validation before recommending
   the analytical overlay pattern.

5. **mind-mem flat tag adaptation:** Can mind-mem's ConstraintSignature
   contradiction detection be retargeted for flat #hashtags rather than its
   20-category structured metadata taxonomy? If yes, it provides the only
   production-tested contradiction detection in the MCP ecosystem.

6. **CozoDB maintenance status:** Last release December 2023. Is it abandoned or
   on deliberate hiatus? The Datalog query model and confirmed Windows + Node.js
   binding are attractive, but committing to an abandoned project for a first
   graph project is higher risk than SQLite.

7. **T28 human vs agent write boundary:** The hybrid architecture (files
   canonical for human, graph canonical for agent-written) requires an explicit
   design decision about which data crosses which boundary. This is a product
   question, not a research question, but it must be resolved before schema
   design.

8. **Graphiti+Kuzu on Windows 11:** Can `pip install graphiti-core[kuzu]` + file
   path run end-to-end on Windows 11 without Docker? D5b-1 assesses it as
   "architecturally plausible" but unconfirmed. If it works, Graphiti's temporal
   graph extraction becomes accessible without Docker.

---

## Appendix: Source Inventory

All unique sources referenced across the 15 findings files. Trust levels as
assessed by original finders.

### Tier 1: Official Documentation and Primary Sources (HIGH trust)

- SQLite official docs: Recursive CTEs, WAL, JSON Functions, 3.51.3 release
  notes
- better-sqlite3 GitHub + Performance Guide
- LadybugDB GitHub (v0.15.3 release assets, @ladybug/core npm)
- KuzuDB archival announcement (October 2025)
- DuckDB official docs: Concurrency, SQLite Extension, 1.5.0 announcement
- Logseq official: changelog (Jan–Mar 2026), DB version docs, @logseq/cli npm,
  advanced queries hub
- Obsidian: official headless GitHub (Feb 2026), MetadataCache docs
- graphology official docs
- Dendron GitHub (maintenance announcement #3890), Kevin Lin YC retrospective
- Foam GitHub + Wikilinks docs
- Graphiti GitHub + Zep docs
- obra/knowledge-graph GitHub (Jesse Vincent, March 2026)
- TriliumNext wiki + attribute system docs
- SiYuan block management docs
- Tana funding announcement (TechCrunch, Feb 2025, $25M)
- Neo4j MCP repos (official + contrib)
- n-r-w/knowledgegraph-mcp GitHub
- mind-mem GitHub + Glama
- MemoryMesh GitHub + package.json
- deanacus/knowledge-graph-mcp GitHub
- Context Portal GitHub
- graphthulhu GitHub
- TurboVault (Epistates) GitHub
- LiteGraph GitHub
- FalkorDB MCPServer GitHub
- mcp-memory-enhanced fork
- Trilium/TriliumNext SQLite schema docs

### Tier 2: Independent Benchmarks and Community Reports (MEDIUM-HIGH trust)

- Simon Willison's March 2026 SQLite tags benchmark (directly relevant to T28
  tag search)
- SQLite Driver Benchmark: better-sqlite3, node:sqlite, libSQL (sqg.dev,
  January 2026)
- DuckDB vs SQLite academic paper benchmarks (analyticsvidhya + timestored)
- blakecrosley.com: Obsidian as AI Infrastructure (production-validated at
  16,894 files, 2026)
- Harper Reed blog (March 2026): meeting transcript → structured Obsidian
  pipeline
- Graphiti/Zep LongMemEval results (arXiv + GitHub)
- MemPalace benchmark analysis (HN community response)
- SQLite forum: BFS traversal + CTE vs manual joins discussions
- code-review-graph GitHub (tirth8205): production performance data

### Tier 3: Community and Directory Sources (MEDIUM trust)

- MCP server directories (TensorBlock awesome-mcp-servers, mcpservers.org,
  Glama, LobeHub)
- DeepWiki sources (Obsidian MetadataCache, Logseq architecture, Foam
  architecture)
- Various PKM comparison blogs and forum discussions
- Individual project npm registries
