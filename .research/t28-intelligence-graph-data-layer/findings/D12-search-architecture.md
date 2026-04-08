# Findings: Search Architecture for T28

**Searcher:** deep-research-searcher **Profile:** docs + web **Date:**
2026-04-07 **Sub-Question:** D12

---

## Summary

Three-layer hybrid search recommended from day one: FTS5 (BM25,
porter+unicode61) + sqlite-vec (MiniLM-L6-v2, 384d, 22MB, local) + RRF fusion
(k=60). Tag filtering via junction table pre-filter. Graph expansion via 1-2 hop
BFS. Both interaction modes (Claude autonomous + user direct) use same hybrid
core. At T28's scale, vector search adds zero meaningful overhead (~11ms/note
embedding, sub-3ms combined search).

---

## Key Findings

### 1. FTS5: Production-Ready, Sub-Millisecond [CONFIDENCE: HIGH]

Optimal config: `tokenize = 'porter unicode61 remove_diacritics 2'`,
`prefix = '2 3'`, `detail = 'full'`. Column-weighted BM25 (title 10x).
Performance: 0.3ms at 49,746 chunks. T28 = effectively instantaneous.

### 2. sqlite-vec: Right Backend, Pre-v1 [CONFIDENCE: HIGH]

v0.1.9 (March 2026). Zero-dep C. Node.js npm. Windows confirmed. Pre-v1 — pin
version. vec0 virtual table with FLOAT[384] embeddings.

### 3. MiniLM-L6-v2 via Transformers.js [CONFIDENCE: HIGH]

22MB ONNX, 384d, 512 tokens, ~14.7ms/1K tokens CPU. No Python. Local. BGE-M3 is
25x larger — advantages (multilingual, 8K context) irrelevant for T28's English
technical notes.

### 4. Tag-Filtered Search [CONFIDENCE: HIGH]

Junction table CTE pre-filters before FTS5/vector search. Sub-millisecond
narrowing. Tags in UNINDEXED FTS5 column for display.

### 5. Hybrid Search with RRF [CONFIDENCE: HIGH]

`score(d) = SUM(weight_i / (k + rank_i))`, k=60. No score normalization needed.
Consistently outperforms single-mode. FTS5 catches exact terms; vector catches
semantic relatives.

### 6. Graph-Augmented Search (Land-and-Expand) [CONFIDENCE: HIGH]

Hybrid search top-K nodes, then BFS 1-2 hops for context. Zep: 18.5% accuracy
gain + 90% token reduction (115K to 1.6K). Cap at 2 hops with edge filters.

### 7. Dual Interaction Model [CONFIDENCE: MEDIUM]

Same hybrid core. Claude autonomous: structured params, JSON output, higher
latency tolerance. User direct: natural language input, human-readable snippets.
Different query construction, same retrieval algorithm.

### 8. Scale: Vector Justified From Day One [CONFIDENCE: HIGH]

Full hybrid on Raspberry Pi Zero 2W: sub-3ms. Embedding generation: ~11ms/note.
T28 search can run in-process in hooks. No threshold to wait for.

---

## Sources

| #   | Title                                              | Type       | Trust  |
| --- | -------------------------------------------------- | ---------- | ------ |
| 1   | SQLite FTS5 docs (official)                        | Docs       | HIGH   |
| 7   | sqlite-vec GitHub                                  | Official   | HIGH   |
| 8   | Zep arXiv:2501.13956                               | Academic   | HIGH   |
| 9   | Alex Garcia hybrid search blog                     | Author     | HIGH   |
| 10  | Transformers.js docs                               | Official   | HIGH   |
| 12  | Obsidian hybrid retriever (49K chunks, 83MB, 23ms) | Case study | HIGH   |
| 13  | ZeroClaw hybrid memory architecture                | Blog       | MEDIUM |

---

## Gaps

1. sqlite-vec metadata filtering with tag pre-filter needs testing
2. Windows-specific sqlite-vec benchmarks not found
3. Transformers.js ONNX Windows CPU latency not benchmarked
4. SQLite recursive CTE at thousands of edges not benchmarked
