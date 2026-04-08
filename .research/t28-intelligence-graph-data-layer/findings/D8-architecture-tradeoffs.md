# Findings: Architecture Tradeoffs for T28 Data Layer

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-07 **Sub-Question:** D8

---

## Summary

7 architecture tradeoffs evaluated + RAG-Anything investigation. SQLite CTEs
adequate for T28's scale (well under 100K nodes) — ceiling is query shape (5+
hops, pattern matching), not node count. MCP overhead real but small for local
stdio (skip below 20ms budget). Files canonical validated for human layer;
counterarguments compelling for agent-written layer → hybrid model recommended.
Embedded wins over server for solo developer. **Adopt n-r-w/knowledgegraph-mcp
for MVP**, stay TypeScript-native, migrate to LadybugDB/CozoDB when query
complexity warrants. RAG-Anything's dual-graph pattern (cross-modal + textual)
is the architectural insight, not the full stack.

---

## Key Findings

### FA-1: SQLite vs Graph-Native [CONFIDENCE: MEDIUM-HIGH]

**Ceiling is query shape, not node count.** SQLite CTEs work well to ~1M nodes
for linear traversals. Breaking points: 5+ hop traversals, cyclic dedup,
multi-edge pattern matching. T28 at ~10/day stays well under 100K nodes for
years.

**Graduation trigger:** Migrate from SQLite CTE when queries need (a) 4+ hop
cycle-safe traversal, (b) simultaneous multi-edge-type pattern matching, or (c)
query authoring complexity exceeds insight value.

**Kuzu is archived (Oct 2025, Apple acquisition).** LadybugDB (fork, v0.15.3)
and CozoDB are viable embedded alternatives.

### FA-2: MCP vs Direct Function Calls [CONFIDENCE: HIGH]

**20ms threshold rule:** Skip MCP for <20ms latency budget. For local stdio
(T28's case), overhead is serialization, not network.

**T28 at <5 tools initially:** MCP governance layer adds complexity without
benefit. **Recommended:** Implement as direct function calls, shape interfaces
to MCP contract, migrate when tool count justifies it.

### FA-3: Files Canonical + Graph Derived [CONFIDENCE: MEDIUM-HIGH]

**Files canonical validated for human-curated layer:**

- Resilience: files survive any DB failure
- Portability: works with any editor/tool/era
- Obsidian/SiYuan precedent: proven durable at scale
- Logseq lesson: DB-canonical created sync complexity

**Counterarguments compelling for agent-written layer:**

- Bidirectional relationships require file updates (friction)
- Agent write path: parsing/serializing Markdown is lossy round-trip
- Temporal tracking (valid_at/invalid_at) is structurally unnatural in Markdown

**Verdict: Hybrid.** Human curation in files. Agent-extracted knowledge in graph
store. Boundary needs explicit design.

### FA-4: Embedded vs Server [CONFIDENCE: HIGH]

**Embedded wins for solo developer:**

- No Docker, no server process, no port management
- LadybugDB/Kuzu benchmarks: 18x faster ingestion, 180x faster path-finding vs
  Neo4j CE
- T28's single-user, single-machine context makes server benefits irrelevant

**FalkorDBLite Windows gap:** Linux x64 + macOS arm64 only. No Windows native.
WSL2 required. **Blocking constraint.**

**CozoDB on Windows:** Confirmed. Node.js binding, Windows x86_64. Pre-1.0
(v0.7).

### FA-5: Build vs Adopt [CONFIDENCE: MEDIUM]

**Recommended path:** Adopt n-r-w/knowledgegraph-mcp for MVP (TypeScript,
SQLite, zero friction). Layer custom extraction on top. Migrate to LadybugDB or
CozoDB when query complexity warrants.

| Option                   | Language   | Storage          | Fit              | Risk                    |
| ------------------------ | ---------- | ---------------- | ---------------- | ----------------------- |
| n-r-w/knowledgegraph-mcp | TypeScript | SQLite/PG        | High — works now | Limited graph depth     |
| LadybugDB + custom MCP   | TypeScript | Embedded Cypher  | Medium-High      | Fork sustainability     |
| CozoDB + custom MCP      | TypeScript | Embedded Datalog | High             | Pre-1.0, learning curve |
| Graphiti (Python) + MCP  | Python     | Neo4j/FalkorDB   | High features    | Language boundary       |

### FA-6: Node.js vs Python [CONFIDENCE: HIGH]

Most graph MCP servers are Python (Graphiti, LightRAG, RAG-Anything). MCP
partially abstracts boundary (JSON-RPC over stdio). Cost: 200-500ms cold start,
1-5ms serialization, Python venv management on Windows.

**TypeScript graph libraries exist:** graphology, n-r-w, CozoDB Node.js,
LadybugDB npm.

**Recommendation:** Start TypeScript-native. If Graphiti's temporal extraction
or RAG-Anything's multimodal pipeline is needed, run as separate Python MCP
sidecar.

### FA-7: Portability vs Queryability [CONFIDENCE: MEDIUM-HIGH]

SiYuan (files + index) vs Logseq DB (SQLite canonical). Logseq community: "if
you do not need DB improvements, continue using MD version."

**T28's query needs** (find related, trace lineage, surface co-occurrences) work
equally well whether files-canonical or graph-canonical. Portability strongly
favors files-canonical for human layer. Agent-derived layer can be
graph-canonical because it's regenerable.

### RAG-Anything (HKUDS) [CONFIDENCE: MEDIUM]

"1+3+N" architecture: knowledge graph engine + modal processors (Image, Table,
Equation). Dual-graph: cross-modal relationships + textual semantics. Built on
LightRAG (EMNLP 2025).

**Not a direct T28 fit:** Requires LLM API (GPT-4o-mini), cloud embeddings,
MinerU parser. Enterprise/research-oriented. Python-only.

**What T28 takes from it:** Dual-graph pattern (separate relationship graph +
semantic graph that cross-reference) is the core insight. T28 doesn't need the
full stack — needs this pattern at simpler scale.

---

## Sources

| #     | Title                                         | Type           | Trust       |
| ----- | --------------------------------------------- | -------------- | ----------- |
| 1     | SQLite-Graph Cypher Analysis                  | Blog           | MEDIUM      |
| 2     | SQLite Recursive CTEs (official)              | Official       | HIGH        |
| 3     | Embedded DB: Kuzu Study                       | Technical blog | HIGH        |
| 4     | KuzuDB Abandoned (The Register)               | News           | HIGH        |
| 5     | LadybugDB GitHub                              | Repo           | HIGH        |
| 6-8   | MCP Architecture docs, tradeoffs, limitations | Official/blogs | HIGH/MEDIUM |
| 9     | Logseq MD vs DB forum                         | Community      | MEDIUM      |
| 10    | Graphiti GitHub                               | Repo           | HIGH        |
| 13-15 | FalkorDBLite, CozoDB, FalkorDB docs           | Official       | HIGH        |
| 16-19 | n-r-w, Graphiti MCP, MCP SDK comparison       | Various        | MEDIUM-HIGH |
| 25-27 | RAG-Anything (arXiv + GitHub), LightRAG       | Academic/repo  | HIGH        |

---

## Contradictions

1. **Kuzu viability:** Graphiti still lists Kuzu as supported backend (stale
   docs). Kuzu is archived. Use LadybugDB.
2. **LadybugDB Windows:** npm package exists, no explicit Windows platform
   confirmation. Unresolved.
3. **MCP overhead threshold:** 20ms rule is for network MCP. Local stdio is
   lower overhead.
4. **SQLite CTE ceiling:** "1M nodes" (generous) vs "100-1000 documents"
   (conservative) — different query complexity assumptions.

---

## Gaps

1. LadybugDB Windows native binary unverified
2. CozoDB v1.0 timeline unknown
3. RAG-Anything internal graph DB unspecified
4. n-r-w graph traversal depth capabilities unconfirmed
5. SQLite CTE benchmark at T28's specific scale (5K-50K nodes, 3-hop) missing

---

## Serendipity

1. **DuckPGQ** — SQL/PGQ graph queries over DuckDB. Not production-ready but
   excellent Node.js + Windows support. Future option.
2. **FalkorDB "SQLite moment" positioning** — right goal, Windows gap blocks
   adoption.
3. **CozoDB sleeper candidate** — Datalog, confirmed Windows, Node.js binding,
   "hippocampus for AI." Pre-1.0 risk but best-fit embedded graph that actually
   works on Windows today.
4. **Graphiti temporal insight** — even without adopting Graphiti, validity
   windows (X true from date A to B) apply to T28's accumulation use case.
5. **Kuzu Apple acquisition context** — LadybugDB emerged within weeks under
   experienced leadership, lowering fork risk.
