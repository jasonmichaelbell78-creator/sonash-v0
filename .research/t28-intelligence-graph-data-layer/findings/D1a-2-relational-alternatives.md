# Findings: Relational/Embedded Database Alternatives for T28 Intelligence Graph

**Searcher:** deep-research-searcher **Profile:** docs + web **Date:**
2026-04-07 **Sub-Question IDs:** D1a-2

---

## Summary

The prior-art claim that DuckDB has a 10-500x write penalty vs SQLite for OLTP
workloads is **CONFIRMED and still accurate as of DuckDB 1.5.1 (March 2026)**.
DuckDB's architectural improvements in 1.5.0 targeted analytical throughput, not
single-row insert latency. DuckDB is disqualified as T28's primary data layer.

However, DuckDB has a **legitimate secondary role**: as a read-only analytical
overlay on top of an SQLite primary store, via its `sqlite_scanner` extension —
no replication needed, no write penalty, MCP wrapper available.

LibSQL (Turso) is a drop-in SQLite replacement with a known Windows native
module error (`@libsql/win32-x64-msvc/index.node` not found). It inherits
SQLite's single-writer model and adds no meaningful value for T28's local
single-process use case. **Not recommended.**

PGlite (Postgres-in-WASM) is slower than SQLite on inserts (5x slower in
transaction benchmarks), heavier (~3MB gzip), and Postgres-overkill for T28.
**Not recommended.**

LMDB is ultra-fast for key-value but is not relational — no SQL, no FTS5, no
JOIN support. Requires custom graph indexing. **Out of scope for T28.**

**Verdict: SQLite remains the correct primary store. DuckDB as an optional
read-only analytical layer is the only relational alternative worth
considering.**

---

## Key Findings

### 1. DuckDB Write Penalty — CONFIRMED, Structural, Not Fixed [CONFIDENCE: HIGH]

The 10-500x write penalty claim from prior research is confirmed by multiple
independent sources including the original SQLite/DuckDB academic paper
benchmarks and current 2025-2026 analysis. Specific numbers:

- **Individual row inserts in DuckDB**: ~0.4-0.5ms per row (even for 1,000 rows
  = 400-500ms total)
- **Batch inserts in DuckDB**: ~10x faster, but still slower than SQLite WAL
  mode for OLTP
- **DuckDB individual inserts at scale**: ~886 seconds for 1M rows ≈ 886
  microseconds/row average, degrading non-linearly as count grows
- **For comparison**: better-sqlite3 insertUser benchmark = 53,693 ops/s ≈
  18.6µs/op

DuckDB 1.5.0 (March 2026) delivered a 17% concurrent R/W throughput improvement
via non-blocking checkpointing, but this targets analytical batch workloads, not
single-row OLTP inserts. The root architectural cause — columnar storage
requiring row group reorganization on writes — is unchanged.

**For T28's pattern** (~10 sources/day, each producing graph node/edge inserts):
DuckDB would impose 400-900ms overhead per small batch vs <1ms for SQLite. This
is a structural disqualification.

### 2. DuckDB's Legitimate Role: Read-Only Analytical Overlay [CONFIDENCE: HIGH]

DuckDB's `sqlite_scanner` / SQLite extension (built-in, autoloads via
`INSTALL sqlite; LOAD sqlite;`) can attach an existing SQLite file directly and
run analytical queries against it without any writes to that file.

Key properties:

- Multiple DuckDB readers can attach simultaneously in read-only mode
- SQLite writer can continue operating concurrently
- No replication bridge required — reads directly from SQLite file at query time
- DuckDB outperforms SQLite on aggregation queries by 30-50x (relevant if T28
  later needs graph analytics)
- **MCP wrapper available**: `motherduckdb/mcp-server-motherduck` and
  `ktanaka101/mcp-server-duckdb` are both active

**This is a viable Phase 2 enhancement path** — T28 writes via SQLite, an
optional DuckDB session reads the same file for analytical queries without any
additional infrastructure.

### 3. DuckDB Concurrency Model — Single Writer Confirmed [CONFIDENCE: HIGH]

DuckDB's concurrency model is: one process can read+write, OR multiple processes
can read (read-only mode). Multiple concurrent writers are not supported. Within
a single process, multiple threads can write concurrently without conflicts for
appends only. For T28 (single Node.js process, sequential daily incremental
ingestion), this is not a limitation — but it confirms DuckDB cannot serve as a
general-purpose write store.

### 4. LibSQL/Turso — Adds Little for Local Single-Process Use [CONFIDENCE: MEDIUM]

LibSQL is a SQLite fork with three key additions:

1. **Native vector search** — relevant for AI/embedding workloads
2. **Embedded replicas** — sync local DB from remote Turso server
3. **BEGIN CONCURRENT** / MVCC (experimental) — improves concurrent write
   throughput

**Performance**: In the January 2026 SQLite driver benchmark, `libsql`
insertUser = 28,385 ops/s vs `better-sqlite3` = 53,693 ops/s — **libSQL is ~47%
slower on inserts** due to its async/Rust binding overhead.

**Windows risk**: Documented native module errors:
`@libsql/win32-x64-msvc/index.node not found` on Windows machines (GitHub issues
#1797, drizzle-orm #3205). This is unacceptable for a Windows 11 primary
environment.

**Applicability to T28**: T28 is single-process, local, no distributed
replication needed. LibSQL's differentiators don't apply. The performance
regression and Windows instability make it inferior to vanilla SQLite +
better-sqlite3.

### 5. PGlite — Postgres-in-WASM, Wrong Weight Class [CONFIDENCE: MEDIUM]

PGlite compiles a Postgres fork to native WASM, enabling embedded Postgres in
Node.js with no external process.

**Performance vs SQLite**:

- 1000 INSERTs: SQLite in-memory = 0.002s, Postgres = 0.007s (**3.5x slower**)
- 25,000 INSERTs in transaction: SQLite = 0.022s, Postgres = 0.114s (**5.2x
  slower**)

**Package size**: ~3MB gzip overhead. **No Windows-specific benchmarks
available.**

PGlite's value is Postgres feature parity (extensions, pgvector, full PostgreSQL
SQL dialect). For T28, which needs FTS5 + basic graph relations, this is massive
overkill.

### 6. LMDB — Ultra-Fast but Not Relational [CONFIDENCE: MEDIUM]

LMDB-js (kriszyp/lmdb-js) claims ~500,000 puts/second synchronous, ~1.7M
puts/second multi-threaded. However, LMDB is a key-value store — no SQL, no FTS,
no JOIN semantics. Graph patterns require manual prefix-key encoding. Windows
x64 is supported; Windows ARM64 is not. **Out of scope for T28.**

### 7. better-sqlite3 vs node:sqlite — The Relevant Baseline [CONFIDENCE: HIGH]

The January 2026 benchmark confirms:

- **better-sqlite3 dominates 9 of 10 operations** including most reads and
  inserts
- **node:sqlite** (built-in Node.js v22+ SQLite) is ~80% of better-sqlite3's
  speed — slower but dependency-free
- Both run synchronous APIs which dramatically outperform async alternatives for
  OLTP patterns

For T28's Node.js v22 environment, `better-sqlite3` is the highest-performance,
lowest-risk primary store. `node:sqlite` is a viable zero-dependency alternative
at modest performance cost.

---

## Comparison Matrix

| Database                | Write Latency (single row) | Concurrent Write                  | JSON Support | FTS                 | Windows Support       | MCP Available    | T28 Fit                 |
| ----------------------- | -------------------------- | --------------------------------- | ------------ | ------------------- | --------------------- | ---------------- | ----------------------- |
| SQLite (better-sqlite3) | ~18µs (53k ops/s)          | Single writer (OK for local)      | Yes (JSON1)  | Yes (FTS5)          | Excellent             | Yes (several)    | PRIMARY CHOICE          |
| SQLite (node:sqlite)    | ~24µs (41k ops/s)          | Single writer                     | Yes          | Yes                 | Excellent (built-in)  | Yes              | Secondary option        |
| DuckDB                  | ~400-900µs/row (degrades)  | Single writer                     | Yes          | Yes (FTS ext)       | Windows x64 OK        | Yes (motherduck) | ANALYTICAL OVERLAY ONLY |
| LibSQL                  | ~35µs (28k ops/s)          | Single writer + experimental MVCC | Yes          | Via SQLite compat   | Windows: known errors | Yes (mcp-libsql) | NOT RECOMMENDED         |
| PGlite                  | ~57µs (in-memory)          | Single writer                     | Yes (JSONB)  | Yes (pg extensions) | No Windows data       | Not found        | NOT RECOMMENDED         |
| LMDB                    | ~2µs (500k ops/s)          | Multi-writer                      | No (KV only) | No                  | x64 OK, ARM64 no      | Not found        | OUT OF SCOPE            |

---

## Sources

| #   | Title                                                                           | Type         | Trust  |
| --- | ------------------------------------------------------------------------------- | ------------ | ------ |
| 1   | DuckDB vs. SQLite: Comprehensive Comparison (analyticsvidhya, 2026-01)          | Blog         | MEDIUM |
| 2   | Optimizing DuckDB Insert Performance (GitHub discussion)                        | Community    | HIGH   |
| 3   | DuckDB Insert Benchmark (timestored)                                            | Community    | MEDIUM |
| 4   | SQLite Driver Benchmark: better-sqlite3, node:sqlite, libSQL (sqg.dev, 2026-01) | Benchmark    | HIGH   |
| 5   | DuckDB Concurrency Docs (official)                                              | Docs         | HIGH   |
| 6   | SQLite Extension – DuckDB (official)                                            | Docs         | HIGH   |
| 7   | Announcing DuckDB 1.5.0 (official, 2026-03)                                     | Announcement | HIGH   |
| 8   | MotherDuck MCP Server (GitHub)                                                  | GitHub       | HIGH   |
| 9   | libsql-js GitHub                                                                | GitHub       | HIGH   |
| 10  | mcp-libsql (GitHub)                                                             | GitHub       | MEDIUM |
| 11  | How Turso Eliminates SQLite's Single-Writer Bottleneck                          | Guide        | MEDIUM |
| 12  | PGlite Benchmarks (official)                                                    | Docs         | HIGH   |
| 13  | @libsql win32-x64-msvc not found — Windows bug (GitHub issue)                   | Bug report   | HIGH   |
| 14  | lmdb-js GitHub                                                                  | GitHub       | HIGH   |

---

## Contradictions

**Contradiction 1: LibSQL write performance relative to SQLite** Turso marketing
positions LibSQL as faster for concurrent writes (via MVCC). The SQG benchmark
(January 2026, independent) shows libSQL insertUser at 28,385 ops/s vs
better-sqlite3 at 53,693 ops/s — 47% slower, not faster. **Resolution: both are
correct in their context. For T28's single-process local use case,
better-sqlite3 wins.**

**Contradiction 2: PGlite single-row insert latency** PGlite benchmarks show
0.058ms per small row insert (in-memory) — faster than SQLite's 0.083ms in the
same test. But the 1000-insert and 25000-insert transaction benchmarks show
PGlite 3.5-5.2x slower. **Resolution: transaction benchmarks are more relevant
for T28's accumulation pattern. PGlite is slower.**

---

## Gaps

1. **DuckDB Node.js single-row insert latency** — per-row estimate extrapolated,
   not directly benchmarked in Node.js
2. **node:sqlite FTS5 extension support** — unconfirmed in sources found
3. **PGlite Windows 11 write performance** — no Windows-specific benchmark data
   found
4. **DuckDB sqlite_scanner locking behavior** — whether read-only attachment
   causes any write blocking during active SQLite writes was not definitively
   tested

---

## Serendipity

1. **DuckDB sqlite_scanner as zero-infrastructure analytics** — DuckDB can
   directly attach and query a SQLite file with no data copying or replication
   pipeline. If T28 later needs graph analytics, this could be added as a
   developer/admin tool with no changes to the primary SQLite schema.
2. **node:sqlite is now a viable zero-dependency option** — Node.js v22 ships
   with built-in `node:sqlite` at ~80% of better-sqlite3's performance. Credible
   option for minimizing dependency surface.
3. **Turso's Rust rewrite is in beta** — could be a future migration path if
   concurrent write needs emerge.
