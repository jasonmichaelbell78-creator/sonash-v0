# Findings: Emerging Lightweight/Embedded Graph MCP Servers

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-07 **Sub-Question:** D5b-2

---

## Summary

8 lightweight MCP servers surveyed. **No single server provides all three of:
flat #tag API + per-node confidence + contradiction detection.** Best tag
implementation: deanacus/knowledge-graph-mcp (5 dedicated tag tools, Kuzu
backend) but 0 stars/1 commit. Pragmatic alternative: n-r-w/knowledgegraph-mcp
(117 commits, Windows confirmed, tags + fuzzy). Best contradiction detection:
mind-mem (first-class governance with propose/approve/rollback). Best
confidence: knowledge-graph-rag-mcp (multi-signal formula). Key discovery:
LadybugDB = Kuzu rebranding.

---

## Comparative Matrix

| Server          | Tags                           | Search              | Confidence               | Contradiction    | Windows    | Language | Stars |
| --------------- | ------------------------------ | ------------------- | ------------------------ | ---------------- | ---------- | -------- | ----- |
| mind-mem        | 20-cat taxonomy (no flat #tag) | BM25+vector+RRF+RM3 | P1/P2/P3 Bayesian        | **First-class**  | YES        | Python   | 10    |
| MemoryMesh      | None                           | None (JSON scan)    | weight 0-1               | None             | YES        | Node.js  | 340   |
| MemoryGraph     | Fixed 3-field                  | Fuzzy+NL            | importance 0.3-1.0       | CONTRADICTS type | Likely     | Python   | 203   |
| memento         | Unconfirmed                    | FTS5+vector 1024d   | 5 importance levels      | None             | UNVERIFIED | Node.js  | 10    |
| deanacus/kg-mcp | **BEST: 5 tag tools**          | Entity/obs search   | None                     | None             | Likely     | Node.js  | 0     |
| n-r-w/kg-mcp    | Good: array, any/all           | Fuzzy+exact         | None                     | None             | **YES**    | Node.js  | 20    |
| kg-rag-mcp      | Array tags                     | Hybrid graph+vec    | **Multi-signal formula** | None             | YES        | Python   | N/A   |
| MemPalace       | Auto-classification            | Semantic (ChromaDB) | None                     | Experimental     | Unverified | Python   | 16.4K |

---

## Key Findings

### 1. mind-mem — First-Class Contradiction Detection [CONFIDENCE: HIGH]

10 stars. Python 3.10+. SQLite WAL + Markdown. 21 MCP tools. **Contradiction
detection via ConstraintSignature matching** (domain+subject+predicate). Three
governance modes: detect_only → propose → enforce. All mutations require
explicit `/apply` with DIFF receipt + rollback. Co-retrieval graph with
PageRank-like propagation (1-hop 0.3x, 2-hop 0.1x). BM25F + optional vector +
RRF + RM3 query expansion. **2,189 unit tests.** Windows confirmed (msvcrt+fcntl
locking). **Gap: No flat #hashtag API** — structured metadata only.

### 2. MemoryMesh — Schema-Driven Auto-Tool-Generation [CONFIDENCE: HIGH]

~340 stars. Node.js v22. JSON storage. Each `.schema.json` auto-generates
`add_/update_/delete_` tools. 11 pre-built schemas. Node weight 0-1. **Critical
gap: No meaningful search** (no FTS, no vector, no fuzzy). JSON breaks at >10K
nodes.

### 3. MemoryGraph — 8 Backends, 28 Relationship Types [CONFIDENCE: HIGH]

203 stars. Python. 8 backends including **LadybugDB** (= Kuzu, 896 stars,
v0.15.3). 7 relationship categories (Causal, Solution, Context, Learning,
Similarity, Workflow, Quality) with 28 named types. Importance 0.3-1.0. Fuzzy+NL
recall. **Tag taxonomy too rigid** (fixed project/tech/category fields, not
free-form).

### 4. iAchilles/memento — Near-Ideal Architecture, Windows Unverified [CONFIDENCE: MEDIUM-HIGH]

10 stars. Node.js. SQLite + FTS5 + sqlite-vec (1024d BGE-M3, offline). 10 tools.
`set_importance` (5 levels). **Windows unverified** — README shows macOS/Linux
only, sqlite-vec .dll path not documented. Last commit Oct 2025 (6-month gap).
BGE-M3 download ~1.0-1.5GB first run. D3's "near-perfect T28 match" assessment
appears **overstated** due to Windows gap.

### 5. deanacus/knowledge-graph-mcp — Best Tag Implementation [CONFIDENCE: HIGH]

0 stars, 1 commit. Node.js. **Kuzu/LadybugDB embedded backend.** 15 MCP tools
including 5 dedicated tag tools: `tag_entity`, `tag_observation`,
`get_entities_by_tag`, `get_all_tags`, `get_tag_usage`,
`remove_tags_from_entity`. **Directly maps to T28's flat #tag requirement.**
Fatal: no production validation (0 stars, 1 commit).

### 6. n-r-w/knowledgegraph-mcp — Pragmatic Choice [CONFIDENCE: HIGH]

20 stars, 117 commits. Node.js. SQLite or PostgreSQL. 6 tools. `add_tags`
(string arrays), `search_knowledge` with `exactTags` filtering (any/all mode),
`fuzzyThreshold` configurable. **Windows confirmed.** Missing: no per-node
confidence, no vector search.

### 7. knowledge-graph-rag-mcp — Only Multi-Signal Confidence [CONFIDENCE: MEDIUM]

PyPI v0.1.2. Python. SQLite + sqlite-vec (EmbeddingGemma 512d). **Confidence
formula:**
`0.45×semantic + 0.25×string + 0.15×type_prior + 0.10×context + 0.05×popularity`.
Document watcher for auto-ingestion. 6 tools. Windows stated OS-independent.
Alpha quality.

### 8. MemPalace — High Momentum, Disputed Benchmarks [CONFIDENCE: MEDIUM]

16.4K stars. Python. SQLite + ChromaDB. 19 MCP tools. Temporal validity
(`valid_from/valid_until`). Experimental `fact_checker.py`. Benchmark: 96.6% R@5
LongMemEval (raw), 84.2% (compression). Claims of 100% disputed. ChromaDB
dependency adds weight.

---

## Key Discovery: LadybugDB = Kuzu

The "LadybugDB" backend in MemoryGraph and the engine in
deanacus/knowledge-graph-mcp are the **same technology** — Kuzu, rebranded as
LadybugDB in Oct 2025. High-performance embedded C++ graph database: native FTS,
vector indices, Cypher queries, WASM bindings, 896 stars, v0.15.3 April 2026.

---

## Sources

| #     | Title                              | Type               | Trust       |
| ----- | ---------------------------------- | ------------------ | ----------- |
| 1-2   | mind-mem (GitHub, Glama)           | Official/directory | HIGH        |
| 3-4   | MemoryMesh (GitHub, package.json)  | Official           | HIGH        |
| 5     | MemoryGraph GitHub                 | Official           | HIGH        |
| 6-8   | memento (GitHub, Glama, MCPmarket) | Official/directory | HIGH/MEDIUM |
| 9     | deanacus/kg-mcp GitHub             | Official           | HIGH        |
| 10    | n-r-w/kg-mcp GitHub                | Official           | HIGH        |
| 11    | LadybugDB GitHub                   | Official           | HIGH        |
| 12-13 | MemPalace (GitHub, HN)             | Official/community | HIGH/MEDIUM |
| 14    | kg-rag-mcp PyPI                    | Package registry   | HIGH        |

---

## Contradictions

1. **memento tool count:** GitHub shows 10, Glama shows 11 (add_tags). Cannot
   confirm without running.
2. **MemoryMesh star count:** 202-340 across sources (snapshot timing).
3. **Two "memory-graph" projects:** memory-graph/memory-graph (Python, 203
   stars) vs aaronsb/memory-graph (Node.js, 21 stars).
4. **LadybugDB = Kuzu:** Rebranding causes confusion across documentation.
5. **MemPalace benchmarks:** 100% claim disputed. Actual held-out: 98.4%.
   Compression: 84.2%.

---

## Gaps

1. memento Windows sqlite-vec .dll verification — blocking for T28
2. deanacus/kg-mcp production viability (0 stars, 1 commit)
3. mind-mem flat #tag adaptation feasibility
4. MemoryMesh search internals undocumented
5. kg-rag-mcp NER quality on T28's domain
6. BGE-M3 first-run download size (~1.5GB) for memento

---

## Serendipity

1. **LadybugDB = Kuzu** — both MemoryGraph and deanacus/kg-mcp have access to a
   far more capable graph engine than their MCP wrappers expose
2. **MemPalace temporal validity** — `valid_from/valid_until` on facts is unique
   feature
3. **aaronsb/memory-graph** — distinct Node.js memory-graph with Mermaid
   visualization, 21 stars
4. **kg-rag-mcp auto-ingestion** — only project with continuous document
   watching matching T28's pattern
