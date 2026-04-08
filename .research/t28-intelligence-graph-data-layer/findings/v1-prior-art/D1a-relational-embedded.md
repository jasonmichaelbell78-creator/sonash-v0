# D1a: Embedded/Serverless Relational Databases for Graph Storage

**Searcher:** deep-research-searcher | **Profile:** web+docs | **Date:**
2026-04-07 **Sources:** 34 | **Confidence:** HIGH:8, MEDIUM:9, LOW:3,
UNVERIFIED:1

---

## Key Findings

### 1. SQLite + Recursive CTEs: Mature, Cross-Platform, OLTP-Optimal [HIGH]

- **Graph model:** Two-table adjacency list (nodes + edges), both with JSON
  columns. Pattern used by simple-graph, code-review-graph, codebase-memory-mcp.
- **Traversal:** Recursive CTEs with UNION for cycle detection, depth limiting,
  indexed source/target columns mandatory.
- **Performance:** Comfortable to ~100K nodes/edges. Dense graphs degrade
  quadratically with CTE re-visits.
- **FTS:** FTS5 built-in, BM25-scored, handles ~500K docs. Combined with
  sqlite-vec for vector+keyword hybrid search.
- **Rich metadata:** JSON columns + virtual generated columns allow indexing
  JSON fields without schema migration.
- **MCP integration:** CONFIRMED. mcp-server-sqlite (PyPI), code-review-graph,
  codebase-memory-mcp all proven.
- **Cross-platform:** Most cross-platform DB in existence. WAL mode has Windows
  AV caveat (exclude .db from scanning).

### 2. DuckDB: Analytically Superior but OLAP-Oriented [HIGH]

- **Graph:** Standard adjacency + DuckPGQ extension (SQL:2023, Cypher-style
  MATCH). USING KEY (May 2025) fixes CTE memory explosion.
- **Critical mismatch:** DuckDB is OLAP (columnar). T28 growth is OLTP
  (incremental inserts). 10-500x write slowdown vs SQLite for point inserts.
- **FTS:** Extension-based BM25, persisted to disk. Hybrid FTS+vector
  demonstrated.
- **MCP:** Two wrappers exist (ktanaka101, MotherDuck).
- **Best as:** Read-only analytical layer querying SQLite-populated data, not
  primary write store.

### 3. graphqlite: Cypher on SQLite [MEDIUM]

- v0.4.3 (March 2026), 255 stars. Adds Cypher + PageRank/Louvain/Dijkstra to
  SQLite.
- Windows DLL reliability unverified. No MCP wrapper. Early-stage risk.
- **Assessment:** Extension dependency outweighs benefit vs plain SQLite CTEs
  for T28.

### 4. simple-graph Pattern: Proven Minimal Schema [HIGH]

```sql
CREATE TABLE nodes (id TEXT PRIMARY KEY, body JSON NOT NULL);
CREATE TABLE edges (source TEXT, target TEXT, properties JSON,
  FOREIGN KEY(source) REFERENCES nodes(id),
  FOREIGN KEY(target) REFERENCES nodes(id));
```

Adequate for "several thousand nodes." Exactly T28's scale.

### 5. SERENDIPITY: Kuzu — Embedded Graph Database [HIGH]

Purpose-built embedded OLAP graph database. "DuckDB of graph databases."

- Cypher-native, file-based, serverless
- Python/JS/Rust bindings
- MCP wrappers already built (kuzu-memory, kuzu-memory-graph-mcp)
- Vector embeddings + FTS natively
- 18x faster than Neo4j on ingestion
- Interoperates with DuckDB and Parquet natively
- **Strong unlisted candidate for T28**

## Recommendation

**Primary:** SQLite + recursive CTEs + FTS5 + sqlite-vec **Graph-native
alternative:** Kuzu (embedded Cypher, MCP wrappers exist) **Analytical layer:**
DuckDB read-only for aggregation queries **Avoid:** graphqlite (unproven
Windows), DuckDB as primary write store
