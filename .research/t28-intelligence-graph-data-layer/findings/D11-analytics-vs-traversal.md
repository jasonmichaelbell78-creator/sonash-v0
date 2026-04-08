# Findings: Graph Analytics vs Traversal+Search

**Searcher:** deep-research-searcher **Profile:** web + academic **Date:**
2026-04-07 **Sub-Question:** D11

---

## Summary

Analytics and traversal are **complementary, not competing**. Traversal answers
"find related things to X" (requires knowing what to look for). Analytics
answers "what patterns exist I didn't know about?" (surfaces hidden structure).
Community detection (Louvain) is the highest-value first analytics capability —
surfaces emergent clusters you can't find by traversal. PageRank needs hundreds+
of well-connected nodes. Betweenness centrality finds structural bridges but is
expensive (run periodically). **Recommendation: Start traversal+search from day
one, add Louvain at 500-1,000 nodes (~3-6 months), then PageRank +
betweenness.** Implementation: SQLite + graphology (the obra/knowledge-graph
pattern).

---

## Key Findings

### 1. Complementary, Not Competing [CONFIDENCE: HIGH]

Traversal+search: "What exists? How are things connected? Find me X." Requires
starting point. Analytics: "What patterns are hidden in the structure?" Works on
global graph, no starting point needed.

obra/knowledge-graph (3,300 nodes) makes this explicit: SQLite handles
persistence+search, graphology runs analytics. Two systems in tandem.

### 2. Traversal+Search Use Cases [CONFIDENCE: HIGH]

- "Everything connected to X within 2 hops"
- "Shortest path between A and B"
- "All nodes tagged [coping strategy] linking to [trigger]"
- "Notes from last week referencing [meeting]"
- Semantic search: "Notes about shame without the word shame" (vector)
- Keyword: "Every mention of Step 9" (FTS5)

SQLite recursive CTEs: practical to ~5,000 nodes for 2-3 hops. Degradation on 5+
hops or dense multi-path graphs.

### 3. Graph Analytics by Algorithm [CONFIDENCE: HIGH]

**PageRank — "Which concepts are most important?"** Assigns importance based on
who links to it AND how important those linkers are. Use case: "Top 10 most
important concepts weighted by reference quality, not just count." Limitation:
fails to converge on disconnected graphs (obra falls back to degree centrality).
Valuable at hundreds+ well-connected nodes; at early stage, degree centrality
produces near-identical rankings.

**Louvain Community Detection — "What natural clusters exist?"** Groups nodes
more densely connected to each other than the rest. Use case: "What theme
clusters emerged without me organizing them?" Can't be found via traversal — you
can't traverse to discover communities you don't know exist. Performance: ~53ms
at 1,000 nodes, ~938ms at 50,000. Limitation: up to 25% badly connected
communities (Leiden fixes this but not in graphology).

**Betweenness Centrality — "Which concepts are bridges?"** Counts shortest paths
passing through each node. Use case: "Which concept connects my 'AA community'
cluster to 'mental health' cluster?" Finds structural bridges you may not
recognize. Clinical bridge centrality research in addiction/mental health is
structurally identical to T28's use case. Limitation: O(E\*V) — most expensive
algorithm. Run periodically, cache results.

**Closeness Centrality** — average shortest path to all nodes. Less intuitive
for PKM. obra doesn't implement it.

**Eigenvector Centrality** — similar to PageRank. If PageRank is implemented,
eigenvector is redundant.

### 4. Scale Thresholds [CONFIDENCE: MEDIUM]

- obra: analytics useful at 3,300 nodes
- InfraNodus: useful at 1,200+ notes
- At 100 nodes with sparse connections: community detection may return trivial
  results
- At 1,000+ with active cross-linking: genuinely insightful
- T28 (~10/day): analytics likely yields signal around month 3-6 (hundreds of
  well-connected nodes)
- Disconnected graph concern: early-stage PKMs are often highly disconnected —
  PageRank/Louvain degrade. Start with degree centrality.

### 5. Implementation: SQLite + Graphology [CONFIDENCE: HIGH]

The obra/knowledge-graph pattern (confirmed working at 3,300 nodes):

- SQLite stores nodes, edges, metadata, vectors (sqlite-vec), FTS (FTS5)
- On analytics query: load graph from SQLite into graphology in-memory → run
  algorithm → return results
- Graphology covers: Louvain, betweenness, PageRank, BFS, simple paths,
  connected components
- No server required. TypeScript-native with type declarations.
- Full graph reload needed for analytics (not incremental) — but fast at T28
  scale

### 6. Three Questions Only Analytics Can Answer [CONFIDENCE: MEDIUM]

1. "What concepts naturally cluster together across all notes that I never
   organized?" — Community detection only.
2. "Which concept is the most influential hub, accounting for linker
   importance?" — PageRank only.
3. "Which concept is the only bridge between two disconnected areas?" —
   Betweenness only.

For each: traversal would require knowing the answer before formulating the
query.

---

## Decision Guidance

**Minimum viable:** Start with traversal+search (SQLite CTEs + FTS5 + vector).
Covers 90% of day-to-day patterns from day one.

**Add at 500-1,000 nodes (~3-6 months):** graphology + Louvain community
detection. Highest-value first analytics — surfaces emergent structure.

**Add after community detection works:** PageRank (with degree-centrality
fallback for disconnected components) + betweenness centrality (periodic batch,
cached).

**Architecture:** SQLite + graphology, analytics as periodic batch operations
(not per-insert), full graph load from SQLite each run. Matches "files
canonical, graph derived."

---

## Comparison Table

| Dimension                   | Traversal+Search              | Graph Analytics                                       |
| --------------------------- | ----------------------------- | ----------------------------------------------------- |
| What it answers             | "Find related things to X"    | "What patterns exist I didn't know?"                  |
| Computational cost          | Low (SQL, O(hops\*branching)) | Medium-high (Louvain O(E log E), betweenness O(E\*V)) |
| Implementation              | Low — recursive CTEs          | Medium — graphology + memory load                     |
| Requires full graph         | No — local neighborhood       | Yes — community/centrality need whole graph           |
| Value from day one          | Yes                           | Modest until hundreds of connected nodes              |
| Incremental vs batch        | Works incrementally           | Best as periodic batch                                |
| Handles disconnected graphs | Yes                           | Degrades (PageRank convergence, Louvain quality)      |
| Can surprise you            | Rarely                        | Yes — that's the point                                |

---

## Sources

| #   | Title                                   | Type            | Trust       |
| --- | --------------------------------------- | --------------- | ----------- |
| 1   | obra/knowledge-graph (blog + GitHub)    | Project         | MEDIUM-HIGH |
| 4   | InfraNodus PKM Graph Analytics          | Commercial/docs | MEDIUM      |
| 5   | From Louvain to Leiden (Nature)         | Academic        | HIGH        |
| 6   | SQLite Recursive CTEs (official)        | Official        | HIGH        |
| 8   | Graphology Louvain docs                 | Official        | HIGH        |
| 9   | Bridge Centrality: Comorbidity (PubMed) | Peer-reviewed   | HIGH        |
| 10  | Neo4j GDS Betweenness docs              | Official        | HIGH        |

---

## Serendipity

1. **Clinical bridge centrality** in addiction/mental health networks is
   structurally identical to T28's domain — same research, same graph patterns.
2. **obra/knowledge-graph is a clonable proof of concept** for T28's exact stack
   (SQLite + graphology, 3,300 nodes, Louvain + betweenness + PageRank + FTS5 +
   vector).
3. **Community detection's killer use case is gap detection** — surfacing absent
   connections, not just present clusters.
4. **obra reruns community detection on full graph each time** — partial
   community detection produces inferior results. Plan for periodic full
   analytics runs.
