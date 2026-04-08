# Findings: File-Graph Coexistence Patterns

**Searcher:** deep-research-searcher **Profile:** codebase + web **Date:**
2026-04-07 **Sub-Question:** D9

---

## Summary

Universal industry consensus confirmed: files canonical, graph derived. 7+
independent production systems (BasicMemory, Palinode, LightRAG, Obsidian, IWE,
sqlite-memory, obra/knowledge-graph) all make the identical architectural
choice. Rebuild from 500 source files should be sub-second (extrapolated from
codebase-memory-mcp: 49K nodes in 6 seconds). Incremental indexing via
content-hash dedup is standard (~90% savings). Git pattern: `*.db`, `*.db-wal`,
`*.db-shm` in .gitignore. Migration from existing .research/ is near-zero
friction (analysis.json fields map directly to SourceNode). Karpathy gist (same
day) validates three-layer architecture and "answers compound into wiki"
principle.

---

## Key Findings

### 1. Universal Consensus: Files Canonical [CONFIDENCE: HIGH]

Every system studied makes the same choice:

- **BasicMemory:** `basic-memory reset` rebuilds entire DB from markdown files.
  Files always preserved.
- **Palinode:** "Plain files are the source of truth." SQLite-vec/FTS5 rebuilt
  from files. "If every service crashes, cat still works."
- **LightRAG:** Upstream documents canonical. Delete WORKING_DIR + re-ingest =
  full rebuild.
- **Obsidian:** Markdown IS the vault. Graph view is computed visualization.
- **IWE:** "Single-source: Version-controlled knowledge. All modifications
  through direct Markdown editing."
- **obra/knowledge-graph:** Tracks file mtimes, reprocesses changed files.
  `--force` for full rebuild.
- **sqlite-memory:** Two-phase sync with SAVEPOINT atomicity.

### 2. Rebuild Strategy [CONFIDENCE: HIGH]

Standard pattern: delete/truncate DB → scan source files → reconstruct.

| System               | Command                       | Behavior                     |
| -------------------- | ----------------------------- | ---------------------------- |
| BasicMemory          | `basic-memory reset`          | Delete DB, re-scan all files |
| BasicMemory          | `basic-memory sync --watch`   | Realtime file watcher        |
| obra/knowledge-graph | `index --force`               | Full rebuild bypassing mtime |
| LightRAG             | Clear WORKING_DIR + re-ingest | Equivalent rebuild           |

**Timing (from codebase-memory-mcp at larger scale):**

- 49K nodes, 196K edges → ~6 seconds
- 2.1M nodes, 4.9M edges → ~3 minutes
- Single-file incremental → ~1.2 seconds
- T28 extrapolation (~500 nodes) → **well under 1 second**

Rebuild command should be idempotent and fast enough to run on every session
start.

### 3. Incremental Indexing: Content-Hash Dedup [CONFIDENCE: HIGH]

Industry standard: content-hash comparison (not just mtime).

**Two-phase sync pattern (sqlite-memory):**

1. Cleanup: remove DB entries for deleted files
2. Scan: new (ingest), modified/hash mismatch (atomic replace), unchanged/hash
   match (skip)

All operations inside SAVEPOINT transactions — crash leaves DB consistent with
pre-sync state.

**T28 implementation:** Store `content_hash` (SHA-256 or XXH3) + `indexed_at`
per file. On session start, scan `.research/`, compare hashes, process only
changed files.

### 4. Git Patterns [CONFIDENCE: HIGH]

```gitignore
# T28 graph database (derived, regenerable)
.research/*.db
.research/*.db-wal
.research/*.db-shm
```

**Current project .gitignore has NO SQLite entry** — must be added when T28 is
implemented (T0 action).

WAL/SHM files auto-clean on graceful close (`sqlite3_close()`). On crash, WAL
persists and is safely incorporated on next open.

### 5. Compaction Resilience: Three-Tier Model [CONFIDENCE: HIGH]

| Tier             | What Survives                             | Tool                  |
| ---------------- | ----------------------------------------- | --------------------- |
| T1 — Filesystem  | All content, findings, metadata           | `cat`, Read tool      |
| T2 — Git history | All versions, diffs, audit trail          | `git log`, `git diff` |
| T3 — Graph index | Derived relationships, query acceleration | Rebuild command       |

If T3 fails: T1+T2 intact. `t28 rebuild-graph` restores T3 from T1. Zero data
loss.

**Requirement:** Every graph claim must trace to a file artifact (provenance).
No graph-only data that cannot be reconstructed.

### 6. Single Write Path [CONFIDENCE: HIGH]

Write to files first, then index into graph. Never write to graph first then
export.

- BasicMemory: `write_note` → file → SyncService → SQLite
- Palinode: Files written first. Vector index populated asynchronously.
- IWE: "All modifications through direct Markdown editing, eliminating
  dual-write complexity."
- Logseq DB version (counterexample): abandoned markdown for SQLite → community
  rejected this design.

**T28 pattern:** Agent writes to `findings.jsonl` files → `t28 absorb <path>`
indexes into graph. If absorb fails, file survives; next session's incremental
sync re-processes.

### 7. Karpathy Gist (llm-wiki) [CONFIDENCE: HIGH]

Published same day (2026-04-07). Already analyzed at
`.research/website-analysis/karpathy-gist-442a6bf/SITE-ANALYSIS.md` (fit score
88/100, strategic fit 95/100).

**Key validations for T28:**

1. **Three-layer architecture:** Raw sources (immutable) → Wiki (LLM-maintained)
   → Schema (CLAUDE.md). Maps to: `.research/` → graph → skills.
2. **Compilation over retrieval:** Synthesize once, keep current. T28's graph IS
   this compilation layer.
3. **"Answers compound into wiki":** Good synthesis files back into knowledge
   base. The gap T28 should close.
4. **Index.md + log.md:** Maps to existing `EXTRACTIONS.md` (catalog) +
   `extraction-journal.jsonl` (log).
5. **No graph database in gist:** Pure files. T28's SQLite layer extends this
   pattern for query performance.

Gist's limitations (context window, contradiction resolution, multi-session
coherence) are exactly what T28's graph layer addresses.

### 8. Migration: Near-Zero Friction [CONFIDENCE: HIGH]

Existing inventory: 11+ repo analyses (analysis.json v4.3), 5+ website analyses,
168 extraction journal entries.

Every `analysis.json` has `slug`, `analyzedAt`, `ecosystem_tags`, `key_claims` —
maps directly to SourceNode without transformation.

**4-phase migration (no file modification):**

1. **Bootstrap:** Read `analysis.json` → create SourceNodes. Sub-second.
2. **Extraction:** Read `findings.jsonl`/`value-map.json` → create
   KnowledgeNodes + EXTRACTED_FROM edges.
3. **Cross-source linkage:** Read `extraction-journal.jsonl` → wire RELATED_TO
   edges. Only phase needing semantic comparison.
4. **Augmentation:** Ongoing. Graph-only edges added as synthesis discovers
   relationships.

EXTRACTIONS.md stays as-is — already a derived view of extraction-journal.jsonl.
Graph provides richer query, not replacement.

---

## Sources

| #   | Title                                     | Type      | Trust  |
| --- | ----------------------------------------- | --------- | ------ |
| 1-2 | BasicMemory (docs, GitHub)                | Official  | HIGH   |
| 3   | Palinode GitHub                           | Official  | HIGH   |
| 4   | LightRAG docs                             | Official  | HIGH   |
| 5   | Obsidian vault gitignore (forum)          | Community | MEDIUM |
| 6   | IWE single-source pattern (dev.to)        | Blog      | MEDIUM |
| 7   | obra/knowledge-graph GitHub               | Official  | HIGH   |
| 8   | codebase-memory-mcp benchmarks (arXiv)    | Academic  | HIGH   |
| 9   | sqlite-memory two-phase sync              | Official  | HIGH   |
| 10  | CocoIndex incremental indexing            | Official  | HIGH   |
| 11  | SQLite WAL documentation                  | Official  | HIGH   |
| 12  | Karpathy gist SITE-ANALYSIS.md (codebase) | Internal  | HIGH   |

---

## Contradictions

**None.** All 7+ systems converge on identical file-canonical model. Only
variation: sync trigger mechanism (watcher vs startup scan vs explicit command).

Karpathy gist uses pure files with no graph DB — complementary, not conflicting.
T28's SQLite layer is an extension for query performance.

---

## Gaps

1. BasicMemory reset timing at T28 scale (extrapolated sub-second, not measured)
2. SQLite WAL behavior under abrupt Windows process termination (low risk —
   well-tested crash recovery)
3. Watch mode performance on Windows (FSEvents vs ReadDirectoryChangesW)
4. Delta-only sync on session restart not benchmarked at T28's specific file
   count

---

## Serendipity

1. **Karpathy gist is from today** — already analyzed in codebase. Strategic fit
   95/100.
2. **.gitignore has no SQLite entry** — T0 action when T28 builds.
3. **sqlite-memory SAVEPOINT pattern** directly adoptable for compaction-safe
   incremental indexing.
4. **EXTRACTIONS.md already IS the file-canonical/derived-view pattern** — T28
   formalizes what the project does instinctively.
5. **MemPalace temporal SQLite** — even recall-optimized systems treat files as
   primary record.
