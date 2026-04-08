# Findings: Other Graph-Native Embedded Databases

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-07 **Sub-Question:** D1b-2

---

## Summary

16 candidates surveyed for embedded graph-native databases beyond LadybugDB.
Only 4 are viable for T28 (embedded + Node.js + Windows). LadybugDB remains the
top graph-native pick. DuckDB + DuckPGQ emerged as a strong pragmatic
alternative not in prior research scope. The Kuzu fork ecosystem is fragmenting
into three paths (LadybugDB, Bighorn, RyuGraph) with LadybugDB having the
strongest community signals. Most other options are either server-required, lack
Node.js bindings, or are too immature.

---

## Key Findings

### Viable for T28 (embedded + Node.js + Windows)

#### 1. LadybugDB (`@ladybugdb/core`) — TOP PICK [CONFIDENCE: HIGH]

Explicitly supports Windows 10/11, v0.15.3 (April 2026), 67 contributors,
Cypher, FTS + vector built-in. The most mature Kuzu fork. (Covered in detail by
D1b-1.)

#### 2. DuckDB + DuckPGQ (`@duckdb/node-api`) [CONFIDENCE: HIGH]

Strongest non-graph-first option. Production-grade, Windows-native, SQL/PGQ
extension. Best choice if you want SQL + graph rather than pure graph. Note:
DuckDB's OLTP write penalty (covered in D1a-2) applies — this is better suited
as a read/analytical layer than primary write store.

#### 3. Bighorn (`@kineviz/kuzu-lite`) [CONFIDENCE: MEDIUM]

Kuzu fork by Kineviz. Active, Cypher, FTS+vector. Windows support unconfirmed.
Community governance unclear. npm package details returned 403 on direct fetch —
needs verification.

#### 4. CozoDB (`cozo-node`) [CONFIDENCE: MEDIUM]

Windows supported, Datalog+graph+vector in one embedded store. **But: last
release December 2023 — stalled development is a serious concern.** Datalog
query language is powerful but unfamiliar — learning curve risk for first foray
into graph tech.

### Technically Interesting, Not Yet Viable

#### 5. RyuGraph [CONFIDENCE: LOW]

No confirmed npm package. Maven-only packages found on GitHub. Strong technical
base (Kuzu fork) but no Node.js delivery path confirmed. Cannot recommend
without Node.js bindings.

#### 6. Grafeo (`@grafeo-db/js`) [CONFIDENCE: MEDIUM]

GQL/Cypher/Gremlin/SPARQL support, BM25+HNSW, napi-rs Node.js bindings. BUT:
v0.5.x, AI-generated codebase flagged by HN community, Windows not explicitly
confirmed. Too early and too risky.

#### 7. GraphLite [CONFIDENCE: MEDIUM]

ISO GQL, ACID, Rust-based. No Node.js bindings available. Interesting technology
but not usable from Node.js.

#### 8. Nanograph (`nanograph-db`) [CONFIDENCE: MEDIUM]

"Built for agents," early-stage. No Windows confirmation. Too immature for T28.

### Disqualified

| Candidate    | Reason                                                           |
| ------------ | ---------------------------------------------------------------- |
| FalkorDBLite | Subprocess model (not truly embedded), explicitly no Windows     |
| TypeDB       | Server-required, not embeddable                                  |
| Memgraph     | Server-required, not embeddable                                  |
| ArcadeDB     | JVM-required, not embeddable in Node.js                          |
| LevelGraph   | Wrong data model (RDF triplestore, no property graph, no Cypher) |
| IndraDB      | No Node.js bindings, no standard query language                  |
| simple-graph | Schema pattern on SQLite, not a database engine, no JS bindings  |
| RuVector     | Inflated marketing, zero npm adoption, suspicious claims         |

---

## Comparison Matrix (Viable Options)

| Database       | Query Language | FTS       | Vector    | Windows     | Node.js            | Maturity       | T28 Fit            |
| -------------- | -------------- | --------- | --------- | ----------- | ------------------ | -------------- | ------------------ |
| LadybugDB      | Cypher         | BM25      | HNSW      | Confirmed   | @ladybugdb/core    | 6mo fork       | TOP PICK           |
| DuckDB+DuckPGQ | SQL/PGQ        | Extension | Extension | Excellent   | @duckdb/node-api   | Production     | READ-ONLY LAYER    |
| Bighorn        | Cypher         | Yes       | Yes       | Unconfirmed | @kineviz/kuzu-lite | Unknown        | NEEDS VERIFICATION |
| CozoDB         | Datalog        | Yes       | Yes       | Yes         | cozo-node          | Stalled (2023) | RISKY              |

---

## Sources

| #   | Title                         | Type              | Trust  |
| --- | ----------------------------- | ----------------- | ------ |
| 1   | LadybugDB GitHub              | Official repo     | HIGH   |
| 2   | DuckDB PGQ extension docs     | Official docs     | HIGH   |
| 3   | @duckdb/node-api npm          | Official package  | HIGH   |
| 4   | Bighorn/kuzu-lite GitHub      | Community repo    | MEDIUM |
| 5   | CozoDB GitHub                 | Official repo     | MEDIUM |
| 6   | RyuGraph GitHub               | Community repo    | LOW    |
| 7   | Grafeo GitHub + HN discussion | Community         | MEDIUM |
| 8   | GraphLite GitHub              | Community repo    | MEDIUM |
| 9   | Nanograph npm                 | Community package | LOW    |
| 10  | FalkorDB docs (lite mode)     | Official docs     | HIGH   |
| 11  | TypeDB docs (embedded mode)   | Official docs     | HIGH   |
| 12  | Memgraph docs                 | Official docs     | HIGH   |
| 13  | LevelGraph GitHub             | Community repo    | MEDIUM |
| 14  | IndraDB GitHub                | Community repo    | MEDIUM |

---

## Contradictions

1. **Kuzu fork ecosystem fragmentation:** LadybugDB, Bighorn, and RyuGraph all
   fork from KuzuDB but with different governance, delivery models, and
   community sizes. The "strongest embedded graph-native option" assessment
   depends on WHICH fork you evaluate. **Resolution:** LadybugDB has by far the
   strongest community signals (896 stars vs unclear for others).

---

## Gaps

1. **RyuGraph Node.js npm package existence** — unresolved, only Maven packages
   found
2. **Bighorn npm package details** — 403 on direct npm fetch, needs manual
   verification
3. **Grafeo Windows build confirmation** — absent from official docs
4. **CozoDB development status** — last release December 2023, unclear if
   abandoned or on hiatus

---

## Serendipity

1. **DuckDB+DuckPGQ** is a strong pragmatic alternative not in prior research
   scope — SQL/PGQ graph queries on a production-grade engine. Best fit as
   analytical overlay (same conclusion as D1a-2).
2. **ISO GQL 2024 standard** is becoming the differentiation axis between
   next-gen options (Grafeo, GraphLite) vs Cypher-compatible forks (LadybugDB,
   Bighorn, RyuGraph).
3. **Three-fork Kuzu ecosystem** is already fragmenting — LadybugDB is the clear
   community winner. This fragmentation itself is a risk signal for the Kuzu
   lineage long-term.
