# Findings: BasicMemory Architecture Deep Dive

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-07 **Sub-Question:** D14-1

---

## Summary

BasicMemory's core decision: markdown files are authoritative, SQLite is a
disposable rebuilt-on-demand index. SyncService uses SHA-256 checksums +
watchfiles for incremental sync. `memory://` URLs provide stable graph traversal
via recursive CTEs. Hybrid search uses custom score-fusion (30% bonus for
dual-match, NOT RRF). MCP-first with 17+ tools. AGPL v3 restricts code copying
but architecture patterns are safe to adopt. 7 specific patterns recommended for
T28 with Node.js adaptations mapped.

---

## Key Findings

### 1. Files-Canonical + SQLite Index [CONFIDENCE: HIGH]

Markdown = source of truth. SQLite = disposable index. `basic-memory reset`
deletes DB, rebuilds from files. Files never touched during reset.

SyncService pipeline: watchfiles detection (~1s latency) → SHA-256 checksum
comparison → skip unchanged → EntityParser (YAML frontmatter, `[category]`
observations, `[[WikiLink]]` relations) → SQLite persist with
`last_scan_timestamp` watermark.

### 2. memory:// URL Scheme [CONFIDENCE: HIGH]

`memory://note-permalink` — stable reference decoupled from file path. Survives
file renames/moves.

Resolution: project normalization → permalink lookup → recursive CTE traversal
(depth-bounded, default 1, recommend 2-3) → timeframe filtering (7d, 30d).

### 3. Hybrid Search: Score-Fusion (Not RRF) [CONFIDENCE: HIGH]

FTS5 (BM25) + sqlite-vec (384d, bge-small-en-v1.5 via FastEmbed ONNX). Custom
fusion: dual-match items rank highest. Weaker signal adds **30% bonus** to
primary score. Items found by only one method keep original score.

Simpler than RRF, avoids score normalization problems.

### 4. MCP-Native: 17+ Tools [CONFIDENCE: HIGH]

Content (5): write/read/edit/move/delete note. Navigation (3): build_context,
recent_activity, list_directory. Search (2): search_notes (multi-mode), search.
Project (3+): list/create/delete projects. Schema (3): infer/validate/diff.
Visualization (1): canvas.

Key: `edit_note` supports incremental ops (append, prepend, find_replace,
section-replace) — LLMs never rewrite full files.

### 5. Entity/Relation Model [CONFIDENCE: HIGH]

Three tables: Entities (title, permalink, file_path, checksum, external_id
UUID), Observations ([category] facts), Relations (directed `[[WikiLink]]` with
relation type).

**external_id UUID** remains stable across DB resets — critical for external
integrations.

### 6. Reset/Rebuild [CONFIDENCE: HIGH]

`basic-memory reset`: delete DB → rescan all files → rebuild everything. Files
preserved. Supplementary: `bm reindex --embeddings`, `bm reindex --search`.
Proves files-canonical is operationally viable.

### 7. AGPL v3 [CONFIDENCE: MEDIUM]

**Can't:** Copy/adapt source code, re-export via MCP wrapper. **Can:** Adopt
architecture patterns, API/protocol concepts, data model taxonomy. Architecture
inspiration without code copying is safe.

---

## T28 Adaptation Guidance

### Adopt Directly (Architecture Patterns)

1. **Files-canonical** — SQLite always disposable. Add `t28 reset`.
2. **Incremental sync via checksum** — SHA-256 per file, last_scan watermark,
   skip unchanged.
3. **External UUID stability** — every entity gets UUID that survives DB resets.
4. **`t28://` URL scheme** — stable references decoupled from file path.
5. **Recursive CTE traversal** — depth-bounded (2-3), timeframe filtering.
6. **Score-based fusion** — 30% bonus for dual-match, simpler than RRF.
7. **Incremental edit ops** — append, prepend, find_replace, section-replace.

### Adapt for Node.js

| BasicMemory (Python) | T28 (Node.js)                        |
| -------------------- | ------------------------------------ |
| watchfiles           | chokidar                             |
| FastEmbed (ONNX)     | @xenova/transformers                 |
| FTS5 via aiosqlite   | FTS5 via better-sqlite3              |
| FastMCP              | @modelcontextprotocol/sdk            |
| SQLAlchemy async     | better-sqlite3 (sync) or drizzle-orm |

### Avoid

- PostgreSQL dual-backend complexity
- Cloud bisync (OAuth, per-project routing)
- schema_infer/validate/diff without clear use case

---

## Sources

| #   | Title                                                                                                         | Type                  | Trust  |
| --- | ------------------------------------------------------------------------------------------------------------- | --------------------- | ------ |
| 1   | BasicMemory DeepWiki Analysis                                                                                 | Third-party technical | HIGH   |
| 2-7 | BasicMemory official docs (semantic search, knowledge format, MCP tools, config, troubleshooting, user guide) | Official              | HIGH   |
| 8-9 | What/Why BasicMemory (official docs)                                                                          | Official              | HIGH   |
| 10  | GitHub README                                                                                                 | Official              | HIGH   |
| 11  | BasicMachines blog                                                                                            | Official              | HIGH   |
| 12  | OSPO AGPL Q&A                                                                                                 | Legal                 | MEDIUM |

---

## Gaps

1. `basic-memory reset` performance not benchmarked publicly
2. sqlite-vec Node.js Windows binding stability unconfirmed
3. Concurrent watcher + MCP write safety undocumented
4. Source code not directly accessible (GitHub 404s)

---

## Serendipity

1. **External UUID pattern** — underrated but critical. Makes reset
   non-destructive for integrations.
2. **`skip_initialization_sync` flag** — skip startup scan when DB known-good.
   Design into T28 from day one.
3. **Schema drift detection** — late-stage but valuable. Graph schema evolves;
   drift detection > rigid enforcement.
4. **No Obsidian constraint** — BasicMemory's WikiLink/frontmatter choices are
   Obsidian-compatibility-driven. T28 can be more opinionated about file format.
