# Findings: Graph Traversal Patterns for On-Demand Synthesis

**Searcher:** deep-research-searcher **Profile:** web + academic **Date:**
2026-04-07 **Sub-Question:** D10-1

---

## Summary

7 synthesis operations mapped to concrete SQL/graph patterns. Comparison:
shared-neighbor Jaccard + tag intersection (SQLite CTEs). Pattern detection:
subgraph extraction by tag + commonality analysis. Gap identification: degree
count + sparse cluster density + LLM for expected-but-missing. Contradiction:
explicit CONTRADICTS edges + semantic similarity + LLM reasoning (SQL alone
cannot detect semantic contradiction). Lineage: recursive CTE ancestor
traversal. Clustering: must use graphology/NetworkX (not SQLite-native). **Key
pattern: Subgraph serialization for Claude** — 2-hop extraction → triple
serialization → Claude reasons with edge citations. SQLite CTEs are adequate for
all operations except community detection and semantic contradiction.

---

## Key Findings

### 1. Comparison Queries [CONFIDENCE: HIGH]

**Shared-neighbor analysis (Jaccard):** Two CTEs to get neighbors of each node,
INTERSECT for shared, compute Jaccard = |intersection| / |union|. Verbose but
works in SQLite.

**Tag intersection:** CTE for each node's tags, UNION + LEFT JOIN to show
shared/unique tags. Direct flat-tag query.

### 2. Pattern Detection Across Tag Group [CONFIDENCE: HIGH]

Two sub-operations:

1. **Subgraph extraction by tag:** JOIN node_tags + edges to get all edges among
   tagged nodes
2. **Commonality analysis:** GROUP BY relation type within subgraph, ORDER BY
   frequency

For community detection within a tag group: export edges → graphology/NetworkX
Louvain → write back.

### 3. Gap Identification [CONFIDENCE: MEDIUM]

Three metrics (all SQL-queryable):

- **Orphan/near-orphan nodes:** LEFT JOIN edges, HAVING degree <= 2
- **Sparse tag clusters:** Tag node count + inter-node edge density ratio
- **Expected-but-missing connections:** LLM judgment on candidates (two nodes
  sharing tags but no edge)

InfraNodus frames this as "supply graph vs demand graph" — what exists vs what
should exist.

### 4. Contradiction Surfacing (On-Demand) [CONFIDENCE: MEDIUM]

**Tier 1 — Explicit CONTRADICTS edges:** Store when detected, query with simple
WHERE. No production SQLite-native system found.

**Tier 2 — Semantic similarity + opposing conclusions:** sqlite-vec cosine
similarity to find similar claims → LLM judges opposition.

**Tier 3 — LLM over serialized subgraph:** Anthropic cookbook pattern —
serialize 2-hop triples, prompt: "Identify contradictions. Cite specific edges."

Academic consensus: KG consistency checking requires formal ontological rules OR
LLM reasoning — pure SQL cannot determine semantic contradiction.

### 5. Lineage Tracing [CONFIDENCE: HIGH]

Recursive CTE ancestor traversal following EXTRACTED_FROM/DERIVED_FROM edges.
Path string accumulation prevents cycles. Clean and fast in SQLite.

**Design requirement:** Every node must have EXTRACTED_FROM edge to source
document. This is the provenance chain.

### 6. Clustering / Community Detection [CONFIDENCE: MEDIUM]

**Not possible natively in SQLite.** Connected components via recursive CTE
(topological only, not modularity-optimized).

Practical: export edges to graphology/NetworkX → Louvain → write community
assignments back to SQLite. obra/knowledge-graph implements exactly this.

### 7. Query Language Comparison [CONFIDENCE: HIGH]

| Operation                     | SQLite CTEs               | Cypher                   | Datalog           |
| ----------------------------- | ------------------------- | ------------------------ | ----------------- |
| Comparison (shared neighbors) | Verbose, possible         | Elegant                  | Concise           |
| Pattern detection (subgraph)  | JOIN-heavy, works         | Natural pattern matching | Rule definition   |
| Gap identification            | GROUP BY + COUNT          | GDS library              | Not natural       |
| Contradiction (semantic)      | Not possible alone        | Not possible alone       | Possible with OWL |
| Lineage (ancestor tracing)    | WITH RECURSIVE — clean    | Path patterns — elegant  | Native recursion  |
| Community detection           | Connected components only | GDS (Louvain, Leiden)    | Not built-in      |

**Easy in SQLite CTEs:** lineage, degree counting, subgraph extraction,
connected components, basic paths. **Hard but possible:** shared-neighbor
comparison (verbose), tag intersection (multiple CTEs). **Not possible in SQLite
alone:** community detection, semantic contradiction, vector similarity.

### 8. Recommended Pattern: Subgraph Serialization for Claude [CONFIDENCE: HIGH]

Anthropic cookbook pattern for T28's on-demand synthesis:

1. User asks comparison/synthesis question
2. Claude executes 2-hop neighborhood expansion (SQLite CTE)
3. Serialize subgraph as triples: `(node-a) --[relation]--> (node-b)`
4. Prompt Claude with triples + question: "Answer using ONLY the knowledge
   graph. Cite SPECIFIC EDGES."
5. Claude answers with edge citations — prevents hallucination, keeps answers
   traceable

**90% token reduction** (Zep: 115K → 1.6K) — directly bounds Claude's context
cost.

---

## Sources

| #   | Title                                         | Type     | Trust  |
| --- | --------------------------------------------- | -------- | ------ |
| 1   | SQLite Recursive CTEs (official)              | Docs     | HIGH   |
| 2   | Anthropic cookbook knowledge graph guide      | Official | HIGH   |
| 3   | SQLite for Graph Models (db-news.com)         | Blog     | MEDIUM |
| 4-5 | Neo4j Node Similarity, Common Neighbors       | Official | HIGH   |
| 6   | obra/knowledge-graph GitHub                   | Repo     | HIGH   |
| 7   | Microsoft GraphRAG docs                       | Official | HIGH   |
| 10  | GQL Expressiveness (arXiv:2409.01102)         | Academic | HIGH   |
| 13  | Knowledge Conflicts EMNLP 2024                | Academic | HIGH   |
| 15  | Dealing with Inconsistency (arXiv:2502.19023) | Academic | HIGH   |

---

## Contradictions

1. **SQLite adequacy:** Some sources say "potent graph backend," others
   recommend Neo4j for "deep traversals." Truth: SQLite comparable at 2-3 hops,
   degrades at 6+.
2. **Louvain vs Leiden:** GraphRAG uses Leiden; most Python tooling defaults to
   Louvain. Difference matters at scale, not at T28's 100-1,000 nodes.
3. **Contradiction detection:** Academic survey says "solved with formal
   ontology." Practical systems use LLM reasoning. Middle ground: Anthropic
   cookbook heuristic.

---

## Gaps

1. No SQLite-native Louvain implementation found
2. simple-graph traverse() internals not fully documented
3. On-demand CONTRADICTS edge pattern is design inference, not proven production
   pattern
4. Semantic contradiction detection without embeddings: no lightweight method
   found

---

## Serendipity

1. **obra/knowledge-graph** — near-exact reference implementation for T28's
   synthesis operations
2. **sqlite-graph extension** (agentflare-ai) — Cypher-style queries over SQLite
   via virtual tables. Could eliminate verbose CTEs.
3. **Subgraph serialization > direct graph querying for LLM synthesis** —
   Anthropic cookbook validates this
4. **GQL ISO standard is LESS expressive than recursive SQL** — T28's SQLite CTE
   approach is theoretically more expressive than Cypher-native graph DBs
