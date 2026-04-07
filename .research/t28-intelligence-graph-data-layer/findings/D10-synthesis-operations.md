# D10: Cross-Source Synthesis Operations via Knowledge Graphs

**Searcher:** deep-research-searcher | **Profile:** web+academic | **Date:**
2026-04-07 **Sources:** 28 | **Confidence:** HIGH:8, MEDIUM:2

---

## 7 Core Synthesis Operations (graphs enable, flat files cannot)

### 1. Entity Deduplication / Resolution

Same concept under different names across sources → merged into canonical node.
Cosine >0.95 threshold + LLM-guided comparison.

### 2. Conflict Detection

Graphiti triggers LLM comparison of new edges vs existing. Contradictions →
`invalid_at` timestamps on old edges. Flat files store both claims with no
mechanism to surface conflict.

### 3. Community Detection / Thematic Clustering

Leiden (GraphRAG) or Louvain (LightRAG) partitions entity graph into thematic
clusters. Each community gets LLM summary. Cross-community queries are graph
operations.

### 4. Bridge Concept Identification (Betweenness Centrality)

Nodes with high betweenness = "conceptual gateways" linking disparate clusters.
Ratio of betweenness to frequency → gateway concepts. Impossible in flat files.

### 5. Multi-Hop Chain Traversal

Path-finding across relationships: "what frameworks → what tools → what
patterns?" BFS/DFS over edges. Only exists as graph structure.

### 6. Importance Ranking (PageRank)

Which concepts are most referenced/linked across ALL sources? Structural
importance propagation. TF-IDF frequency cannot substitute.

### 7. Link Prediction / Implicit Relationship Discovery

If A→B and B→C exist but A→C is absent → surface the missing connection. Flat
files have no mechanism for inferring what's missing.

---

## 10 Things Flat Files Definitively Cannot Do

1. Resolve entity co-reference across sources
2. Detect contradictions between sources
3. Compute structural importance (PageRank)
4. Identify bridge concepts (betweenness centrality)
5. Answer global/holistic queries ("main themes across ALL sources?")
6. Multi-hop chain traversal (A→B→C reasoning)
7. Track temporal validity (when facts were/ceased to be true)
8. Pre-compute community summaries (O(1) global queries)
9. Infer missing connections (link prediction)
10. Deduplicate across source boundaries

---

## Concrete T28 Queries Requiring Graph

| Query                                                       | Graph Operation             | Flat File? |
| ----------------------------------------------------------- | --------------------------- | ---------- |
| "Most important concept across all sources?"                | PageRank on concept nodes   | No         |
| "What repos contradict each other on X?"                    | Edge conflict detection     | No         |
| "What themes bridge repo analysis and website analysis?"    | Cross-community betweenness | No         |
| "What did these 3 sources collectively conclude?"           | Community-scoped map-reduce | No         |
| "Is 'extraction pipeline' the same as 'content harvester'?" | Entity similarity merge     | Partial    |
| "What's the chain from input → output insight?"             | BFS path traversal          | No         |
| "Which concepts bridge the most disparate ideas?"           | Betweenness/frequency ratio | No         |
| "What patterns appear across ALL sources?"                  | Global Leiden + map-reduce  | No         |

---

## Empirical Validation

- **GraphRAG**: 72-83% win rate over vector RAG on comprehensiveness (p<.001,
  EMNLP 2025)
- **LightRAG**: 40% response time reduction, comparable accuracy at 10x fewer
  tokens
- **Graphiti**: 18.5% accuracy gain, 90% latency reduction on LongMemEval
- **Dynamic community selection**: 77% cost reduction at scale

## Scale-Free Emergence [MEDIUM]

Knowledge networks self-organize into scale-free distributions (α≈3.0) with
small-world properties (avg path 4.8-5.2). Bridge nodes appear linearly without
saturation — meaning every new source has potential to create new cross-source
connections. This is architecturally impossible with flat files.

## Quality Gate Pattern (CoKG, ACL 2025)

Don't synthesize from sparse/low-quality graphs. Gate synthesis on graph quality
metrics first. T28 should track: node count, edge density, community count,
average cluster size. Synthesis below thresholds should warn, not fail.
