# Findings: Migration Tooling, Validation, and Rollback

**Searcher:** deep-research-searcher **Profile:** web + codebase **Date:**
2026-04-07 **Sub-Question:** D13-3

---

## Summary

Single `db.transaction()` wrapping all phases (atomic). Order: SourceNodes →
KnowledgeNodes → edges (foreign keys require referenced rows first). SHA-256
content-hash dedup with upsert pattern (idempotent). Rollback = delete DB +
re-run (<1 second at T28 scale). PRAGMA: WAL, synchronous=NORMAL,
foreign_keys=ON. 7 validation queries post-migration. Standalone script at
`scripts/t28/migrate.js` following intake-manual.js pattern. Project already has
all needed helpers (generate-content-hash, normalize-file-path, sanitize-error).

---

## Key Findings

### 1. Single Transaction [CONFIDENCE: HIGH]

`db.transaction()` wrapping all 3 phases. Auto-rollback on exception. ~400 total
rows — no chunking needed.

### 2. Ordering [CONFIDENCE: HIGH]

SourceNodes first (no FK deps) → KnowledgeNodes (reference SourceNodes) → Edges
(reference both). `PRAGMA foreign_keys = ON` enforces this. ThemeNodes come
post-migration via community detection.

### 3. Content-Hash Dedup [CONFIDENCE: HIGH]

SHA-256 on file content (not mtime).
`ON CONFLICT(path) DO UPDATE WHERE hash changed` — idempotent re-runs at
near-zero cost.

### 4. Rollback: Delete DB + Re-Run [CONFIDENCE: HIGH]

Files are canonical. DB is derived. Delete `.db` file, run `migrate.js` again.
<1 second at T28 scale. No WAL checkpoints, backups, or incremental rollback
needed.

### 5. PRAGMAs [CONFIDENCE: HIGH]

```
journal_mode = WAL (concurrent reads)
synchronous = NORMAL (crash-safe, faster than FULL)
foreign_keys = ON (enforce referential integrity)
temp_store = MEMORY
```

Do NOT use synchronous=OFF. foreign_keys must be set after every connection
open.

### 6. Validation Queries [CONFIDENCE: HIGH]

V1: Node count by type. V2: Edge count by relation. V3: Orphaned KnowledgeNodes
(no EXTRACTED_FROM). V4: Orphaned SourceNodes. V5: EXTRACTED_FROM count matches
journal. V6: `pragma_integrity_check()` = 'ok'. V7: `pragma_foreign_key_check()`
= 0 rows.

### 7. Script Architecture [CONFIDENCE: HIGH]

```
scripts/t28/
├── migrate.js          # Entry: parse args, open DB, run phases, validate
├── phases/
│   ├── 01-schema.js    # CREATE TABLE IF NOT EXISTS
│   ├── 02-sources.js   # analysis.json → SourceNodes
│   ├── 03-knowledge.js # extraction-journal + value-map + findings → KnowledgeNodes
│   └── 04-edges.js     # EXTRACTED_FROM + ALSO_SEEN_IN
└── validate.js         # V1-V7 queries
```

CLI flags: `--dry-run`, `--force` (delete+rebuild), `--verify-only`, `--source`,
`--verbose`.

Follows `scripts/debt/intake-manual.js` pattern: argv parsing, --dry-run,
sanitizeError(), try/catch on reads, content hashing.

---

## Sources

| #     | Title                                        | Type     | Trust       |
| ----- | -------------------------------------------- | -------- | ----------- |
| 1     | PDQ bulk insert benchmark                    | Blog     | MEDIUM-HIGH |
| 2     | oneuptime.com Node.js SQLite                 | Blog     | MEDIUM-HIGH |
| 3     | better-sqlite3 transaction patterns (#49)    | Official | HIGH        |
| 4     | powersync.com SQLite optimizations           | Blog     | MEDIUM-HIGH |
| 5     | SQLite PRAGMA reference                      | Official | HIGH        |
| 6-7   | Data integrity validation guides             | Various  | MEDIUM      |
| 10-14 | T28 D7, D9, D1a findings + codebase patterns | Internal | HIGH        |

---

## Serendipity

1. **Project already has all helpers:** generate-content-hash.js,
   normalize-file-path.js, sanitize-error.js. Zero new utility code.
2. **intake-manual.js is a near-perfect template** for the migration script.
3. **`ON CONFLICT DO UPDATE WHERE hash changed`** gives idempotency for free —
   re-run costs only hash computation.
4. **PRAGMA foreign_key_check** is a free post-migration integrity test.
