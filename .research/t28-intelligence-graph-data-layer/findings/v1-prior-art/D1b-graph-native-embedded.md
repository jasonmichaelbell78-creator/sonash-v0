# D1b: Graph-Native Embedded Databases

**Searcher:** deep-research-searcher | **Profile:** web+docs | **Date:**
2026-04-07 **Sources:** 35+ | **Confidence:** HIGH:8, MEDIUM:9, LOW:4,
UNVERIFIED:1

---

## Top Candidates

### 1. LadybugDB (KuzuDB fork) — STRONGEST GRAPH-NATIVE [HIGH]

KuzuDB was abandoned Oct 2025 (team acquired, likely by Apple). LadybugDB is the
community fork with most momentum: 894 stars, MIT, v0.15.3 (April 2026).

- **Model:** Labeled Property Graph, strongly-typed node/edge tables
- **Query:** openCypher (Cypher). Extensions for semantic spacetime, hypergraphs
- **Persistence:** Columnar WAL (.lbug file), ACID, larger-than-memory support
- **Scale:** Inherited from Kuzu — hundreds of millions of nodes, billions of
  edges
- **Node.js/TS:** `@ladybugdb/core` npm package. Cross-platform: Linux
  x64/arm64, macOS, Windows x64
- **FTS:** Native extension (full-text search + vector index)
- **Status:** Active, MIT, Discord, April 2026 releases

**Assessment:** Best embedded graph-native option. True in-process, Cypher
queries, Windows support, FTS+vector built-in. Monitor stability (6 months old
as community fork).

### 2. TypeGraph — TypeScript-First SQLite-Backed [MEDIUM]

v0.18.0 (April 6, 2026). TypeScript property graph with Zod schemas on
SQLite/libsql.

- **Model:** Property graph with ontological relationships
- **Query:** Fluent TS API (no Cypher) — `.from().traverse().to().select()`
- **Persistence:** SQLite/libsql, WAL
- **No FTS, no graph algorithms**
- **18 stars** — tiny community but philosophically aligned with T28

**Assessment:** Watch item. TypeScript-native + Zod + SQLite is appealing but
too immature.

### 3. Grafeo — Feature-Rich but Risky [MEDIUM]

Rust + napi-rs. 6 query languages, BM25+vector+hybrid search built-in.

- **Creator explicitly recommended LadybugDB over Grafeo for production**
- HN flagged ~200K lines AI-generated code in one week
- Beta status, single developer

**Assessment:** Do not adopt. Watch for 6-12 months.

### Disqualified

| Tool              | Reason                                                            |
| ----------------- | ----------------------------------------------------------------- |
| KuzuDB (original) | DEAD — archived Oct 2025                                          |
| FalkorDB Lite     | Spawns Redis process, Windows requires WSL2                       |
| TerminusDB        | Requires server                                                   |
| TypeDB            | Requires server                                                   |
| GunDB             | Wrong use case (P2P sync, not analytical graphs)                  |
| LevelGraph        | RDF triples, no TypeScript, low maintenance                       |
| Oxigraph JS       | In-memory only in Node.js                                         |
| Graphology        | Library not database — no persistence. Could serve as query layer |

## Serendipity

- **DuckDB+DuckPGQ** as dark horse: most mature embedded DB + SQL/PGQ graph
  overlay. Best for analytical queries but OLAP write penalty.
- **TypeGraph** (April 6, 2026): brand-new TS+Zod+SQLite graph. Worth watching.
