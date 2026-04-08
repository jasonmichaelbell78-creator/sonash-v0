# Findings: MCP Memory Server Internals

**Searcher:** deep-research-searcher **Profile:** docs + codebase **Date:**
2026-04-07 **Sub-Question:** D3

---

## Summary

@modelcontextprotocol/server-memory is a ~300-line JSONL flat file with full
rewrite on every operation, O(N) substring search, no file locking, no tags, no
FTS, no vector. Degrades at ~80K tokens (confirmed in issue #2415). Race
condition causes silent data corruption on concurrent sessions (confirmed in
#2577). Schema validation bug (#3074) breaks read operations. **Completely
unsuitable for T28.** Multiple production-grade replacements exist:
iAchilles/memento (SQLite+FTS5+sqlite-vec+offline embeddings),
n-r-w/knowledgegraph-mcp (tags+fuzzy+SQLite/Postgres), mcp-memory-enhanced (250x
faster, API-compatible).

---

## Key Findings

### 1. Architecture: JSONL Flat File, Full Rewrite Every Operation [CONFIDENCE: HIGH]

Every operation executes complete load-modify-write cycle:

- `loadGraph()` reads entire file, parses every line, reconstructs full
  in-memory graph
- `saveGraph()` converts all entities+relations to JSON, overwrites entire file
- No append-only, no partial-write, no caching between operations
- Single dependency: `@modelcontextprotocol/sdk`
- No database, no FTS, no vector library

### 2. Data Model: Three-Type Flat Schema, No Metadata [CONFIDENCE: HIGH]

```typescript
interface Entity {
  name: string; // unique identifier
  entityType: string; // free-form, no enum
  observations: string[]; // append-only unstructured strings
}
interface Relation {
  from: string;
  to: string;
  relationType: string;
}
```

**No:** createdAt, updatedAt, confidence, source, tags, weight. Flat `#tags`
cannot be stored natively. entityType is single string, not array.

### 3. Performance: 80K+ Token Degradation Confirmed [CONFIDENCE: HIGH]

GitHub issue #2415: "Large memory files (80k+ tokens) result in expensive
queries." Community fork benchmarked at 10K entities: **250x faster entity
creation** (3.5s JSON vs 0.014s SQLite), 15x faster search, 79% less memory.

T28 projection: ~1,825 nodes/year → unusable from ~day 500 onward.

### 4. Search: O(N) Case-Insensitive Substring Scan [CONFIDENCE: HIGH]

`search_nodes()` does `includes()` matching across entity name, type, and every
observation string. **No:** FTS index, vector/semantic, fuzzy matching,
relevance ranking, tag filtering, field-scoped queries, date/recency filtering.

### 5. Concurrency: No File Locking, Data Corruption Confirmed [CONFIDENCE: HIGH]

Zero concurrency protection. No file lock, mutex, atomic write, or transaction.
Issue #2577: concurrent sessions produce malformed JSONL →
`MCP error -32603: Unexpected non-whitespace character after JSON`. Corruption
is silent until next read. **On Windows, two Claude Code windows = corrupted
file.**

### 6. Known GitHub Issues [CONFIDENCE: HIGH]

| Issue    | Problem                                           | Status           |
| -------- | ------------------------------------------------- | ---------------- |
| #220     | Default file in npm cache dir, deleted on updates | Partially fixed  |
| #1018    | MEMORY_FILE_PATH env var ignored                  | Fixed in 0.6.3   |
| #2415    | 80K+ token files too expensive                    | Open, no fix     |
| #2577    | Race condition, file corruption                   | Open             |
| #3074    | Schema validation error breaks all reads          | Open             |
| PR #2160 | Fix default path                                  | Open, not merged |

### 7. Not Extensible — Must Be Replaced [CONFIDENCE: MEDIUM]

Single ~300-line file with no plugin system, no storage abstraction, no backend
interface. All improvements require forking and rewriting the storage layer.

### 8. Production-Grade Replacements Exist [CONFIDENCE: HIGH]

| Project                     | Storage    | FTS   | Vector                      | Tags         | Concurrent | T28 Fit  |
| --------------------------- | ---------- | ----- | --------------------------- | ------------ | ---------- | -------- |
| iAchilles/memento           | SQLite+PG  | FTS5  | sqlite-vec (offline BGE-M3) | Via metadata | WAL        | **HIGH** |
| n-r-w/knowledgegraph-mcp    | SQLite+PG  | Fuzzy | No                          | YES (exact)  | Yes        | **HIGH** |
| mcp-memory-enhanced         | SQLite     | No    | No                          | No           | WAL        | MEDIUM   |
| gannonh/memento-mcp         | Neo4j      | Yes   | Native                      | Custom tags  | Yes        | MEDIUM   |
| memory-graph/memory-graph   | 8 backends | Fuzzy | Relationship                | Yes          | Yes        | MEDIUM   |
| doobidoo/mcp-memory-service | SQLite-vec | BM25  | ONNX offline                | Agent-scoped | Yes        | MEDIUM   |

---

## Sources

| #     | Title                                                   | Type            | Trust  |
| ----- | ------------------------------------------------------- | --------------- | ------ |
| 1     | server-memory index.ts (raw source)                     | Official source | HIGH   |
| 2     | server-memory package.json                              | Official source | HIGH   |
| 3     | server-memory README                                    | Official docs   | HIGH   |
| 4     | Issue #2415 (80K tokens)                                | GitHub issue    | HIGH   |
| 5     | Issue #2577 (race condition)                            | GitHub issue    | HIGH   |
| 6     | Issue #3074 (schema validation)                         | GitHub issue    | HIGH   |
| 7     | Issue #220, #1018, #2361 (path/naming)                  | GitHub issues   | HIGH   |
| 8     | PR #2160 (path fix, still open)                         | GitHub PR       | HIGH   |
| 9     | SQLite WAL fix analysis (dev.to)                        | Community       | MEDIUM |
| 10    | mcp-memory-enhanced (fork)                              | Community       | MEDIUM |
| 11-16 | Alternative MCP servers (memento, knowledgegraph, etc.) | Community repos | MEDIUM |
| 17    | mem0 enterprise analysis                                | Community blog  | MEDIUM |

---

## Contradictions

None significant. All sources consistently describe the same limitations. Minor:
npm version `2026.1.26` vs package.json `0.6.3` — calendar versioning for
releases, semver for source.

---

## Gaps

1. No official performance benchmarks from Anthropic — 80K threshold is
   user-reported
2. Issue #2415 had zero official comments at research time
3. PR #2160 (path fix) still open, no reviewers assigned
4. Schema bug #3074 fix status unclear for 2026.1.26 release
5. Whether `entityType` abuse as tag field survives #3074 schema validation —
   untested

---

## Serendipity

1. **iAchilles/memento** — near-perfect T28 match not in prior research.
   SQLite + FTS5 + offline BGE-M3 embeddings (1024d, no API key).
2. **Race condition is Windows-specific trap** — npm cache path + no file lock.
   Don't even use for "day-to-day" on Windows without explicit MEMORY_FILE_PATH.
3. **Performance degrades well before 80K tokens** — probably ~2K-3K entities in
   Node.js single-threaded. Token threshold and compute threshold are different
   failure modes; both hit T28.
