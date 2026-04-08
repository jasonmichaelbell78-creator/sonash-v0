# Findings: Risk Assessment — Solo Developer Fitness

**Searcher:** deep-research-searcher | **Date:** 2026-04-07 | **Sub-Question:**
D15-2

---

## Summary

AGPL (BasicMemory) is safe for local use, blocks any future productization. All
other candidates MIT/Apache. n-r-w/knowledgegraph-mcp's creator has publicly
moved on. LadybugDB's 3-fork fragmentation is a generalized risk. Complexity
budget: 4-5 new concepts max for first graph project. **Ship MVP (SQLite +
FTS5 + graphology) first, add vectors in v2.** If T28 fails, files are preserved
— graph layer is computed and disposable.

---

## Key Findings

### 1. AGPL v3 (BasicMemory) [CONFIDENCE: HIGH]

Safe for local CLI/MCP use. Triggers source-disclosure only when network-served
modified code. Rules out productization path. Adopt architecture patterns, not
code.

### 2. License Summary [CONFIDENCE: HIGH]

All non-BasicMemory candidates are MIT or Apache 2.0. No license surprises.

### 3. n-r-w Creator Disillusionment [CONFIDENCE: HIGH]

Direct quote: "nearly impossible to control...always have to manually clean up."
Pivoted to different approach. 20 stars, Dec 2024 last commit. shaneholloman
fork exists. **Highest abandonment risk in candidate set.**

### 4. LadybugDB Fork Risk [CONFIDENCE: MEDIUM]

3 competing forks post-KuzuDB archival: LadybugDB (community), Vela-Engineering
(multi-writer), Bighorn (Kineviz). Energy split. Any could become dominant or
die.

### 5. Graphiti + Neo4j = 6 Moving Parts [CONFIDENCE: HIGH]

Python runtime + Neo4j Docker + OpenAI API + Graphiti process + Node.js→Python
interop + Docker Desktop. Prohibitive for solo Windows developer on Node.js
project.

### 6. Windows Operational Risks [CONFIDENCE: MEDIUM]

- WAL: file locks held beyond close() (OS-level), don't move/delete WAL files
- sqlite-vec: Windows .dll loading works but prebuilt package ~1 year old
- ONNX: prebuilts available, no show-stoppers documented
- node-gyp: NODE_MODULE_VERSION mismatches on Node.js upgrades

### 7. Complexity Budget [CONFIDENCE: MEDIUM]

4-5 new concepts max for first graph project.

| Option                    | New Concepts                                              | Budget Fit         |
| ------------------------- | --------------------------------------------------------- | ------------------ |
| A: SQLite + graphology    | ~3 (graph theory, FTS5, BM25)                             | **Within budget**  |
| B: + sqlite-vec + RRF     | ~8 (+ embeddings, vectors, distance, RRF, native modules) | At ceiling         |
| C: LadybugDB + graphology | ~4-5 (+ Cypher)                                           | At ceiling         |
| D: Graphiti + Neo4j       | ~10+                                                      | **Exceeds budget** |

### 8. MVP-First: Build Incrementally [CONFIDENCE: HIGH]

**V1 (ship this):** SQLite + FTS5 + graphology. Zero native compilation, zero
Docker, zero external services.

**V2 (when FTS5 insufficient):** + sqlite-vec + MiniLM embeddings + RRF hybrid.

**V3 (if graph traversal bottlenecks):** Evaluate LadybugDB once fork
consolidation clearer.

### 9. If T28 Fails [CONFIDENCE: HIGH]

**Preserved:** All source files (standard formats), SQLite data (queryable by
any tool), FTS5 indexes (rebuildable). **Lost:** Graph-specific query patterns,
sqlite-vec embeddings (re-computable), tooling investment. **SQLite-first is
naturally failure-safe** — data format is standard, graph layer is computed not
stored separately.

---

## Sources

27 sources: GNU AGPL spec, FOSSA legal analysis, htmx complexity budget essay,
graph database guides, SQLite WAL docs, ONNX compatibility docs, GitHub repos.
