# T28 Intelligence Graph Data Layer — Research Report

**Date:** 2026-04-07 **Session:** #267 **Topic:** T28 Intelligence Graph Data
Layer **Depth:** L1 **Version:** 1.1 (post-challenge corrections) **Agents:** 32
searcher agents + 4 synthesizers + 3 challengers (contrarian, OTB-1, OTB-2)

---

## 1. Executive Summary

The T28 intelligence graph data layer question resolves cleanly after 32
searcher agents across three domain dimensions. The correct primary store is
**SQLite with better-sqlite3 v12.8.0**, the correct custom layer is a **thin
TypeScript MCP server built directly on better-sqlite3**, and the correct schema
is a **two-node (SourceNode + KnowledgeNode), seven-edge-type (4 core + 3
agent-inferred) model with M2M junction tags and a separate node_metadata
confidence table**. No existing MCP server should be adopted as a live
dependency for v1 — the three best candidates are all disqualified on blocking
grounds (n-r-w abandoned, official server-memory structurally broken, obra
Obsidian-vault-only). Five independent findings files converge on this
conclusion without contradiction.

The core architectural invariant, confirmed by seven independent production
systems (BasicMemory, Palinode, LightRAG, IWE, obra/knowledge-graph,
sqlite-memory, Obsidian hybrid retriever), is: **files are canonical for
SourceNodes and human-curated data; agent-inferred edges (SUPERSEDES,
RELATED_TO, ALSO_SEEN_IN) are graph-canonical and must be stored in a
supplemental edges file to survive rebuild.** The SQLite database can be deleted
at any time and rebuilt from `.research/` files under one second at T28's scale.
Every graph node must trace to a file artifact via an EXTRACTED_FROM edge. No
graph-only data is permitted — except for agent-inferred edges which have an
authoritative supplemental edges file as their canonical source.

Search architecture is settled. Three-layer hybrid (FTS5 BM25 + MiniLM 384d
vectors + RRF k=60 fusion) with tag pre-filter and 1-2 hop graph expansion runs
under 3ms even on a Raspberry Pi Zero and is justified from day one at T28's
scale — there is no threshold to wait for. However, the v1 release should ship
with FTS5-only search and add vector/RRF in v2 when FTS5 proves insufficient,
keeping the solo-developer complexity budget within 4-5 new concepts. Graph
analytics follows a clear roadmap: traversal via recursive CTEs from day one,
Louvain community detection via graphology at 500-1,000 nodes (~3-6 months),
PageRank and betweenness centrality post-community.

Migration of the existing corpus (18 SourceNodes from analysis.json files, 167
KnowledgeNodes from extraction-journal.jsonl) is near-zero friction. The single
non-trivial prerequisite is a `source-slug-map.json` lookup table for 9 of 13
repository slugs that cannot be derived algorithmically. The migration itself
runs in a single transaction under one second. The operational cycle runs at
15-entry checkpoints (~every 1-2 days at T28's pace), covering dedup,
split/enrich review, and VACUUM.

---

## 2. Primary Recommendation

**Build a thin custom MCP server over SQLite + better-sqlite3. Do not adopt any
existing MCP server as a v1 dependency.**

| Dimension               | Decision                                                                       | Confidence                                       |
| ----------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------ |
| Primary store           | SQLite + better-sqlite3 v12.8.0                                                | HIGH                                             |
| MCP layer               | Custom TypeScript, 5-8 tools, direct better-sqlite3                            | MEDIUM-HIGH (pending Neuromcp audit — see OQ-16) |
| Schema                  | SourceNode + KnowledgeNode, 7 edge types (4 core + 3 agent-inferred), M2M tags | HIGH                                             |
| In-process graph        | graphology (pure JS, Louvain/PageRank/betweenness)                             | HIGH                                             |
| v1 search               | FTS5 BM25 only                                                                 | HIGH                                             |
| v2 search               | + sqlite-vec + MiniLM + RRF k=60                                               | MEDIUM                                           |
| v2 backend upgrade path | LadybugDB HIGH RISK — see note below                                           | LOW                                              |
| Analytical overlay      | DuckDB + sqlite_scanner (read-only, Phase 2+)                                  | MEDIUM                                           |

**LadybugDB v2 risk upgraded to HIGH (OTB-1 challenge):** Kuzu was acquired by
Apple in October 2025 and its repo archived. LadybugDB is built on a frozen
upstream. Three competing forks (LadybugDB, Vela-Engineering, Bighorn/Kineviz)
remain unconsolidated. Only revisit if fork consolidation reaches v1.0 with
Windows NAPI confirmed. Prefer DuckDB+sqlite_scanner as the v2 analytical path.
**The LadybugDB npm package is `lbug`, not `@ladybug/core` or
`@ladybugdb/core`.** The project has three contradictory installation
instructions — a documentation culture signal. `npm install lbug` must be tested
on Windows 11 + Node.js v22 before any v2 planning.

**Do not use:** official @modelcontextprotocol/server-memory (data corruption,
no tags, 80K token ceiling), n-r-w/knowledgegraph-mcp (maintainer publicly
abandoned November 2025), Graphiti/Zep (requires Python + LLM per write +
Docker), mem0 (graph is add-on requiring extra LLM calls), FalkorDB/FalkorDBLite
(no Windows embedded), any server-hosted graph DB (Neo4j, Memgraph, ArangoDB —
no Docker, no port management for solo dev).

---

## 3. Backend Selection

### Comparative Matrix

| Candidate                   | Write Latency     | Windows               | Node.js v22      | Scale Fit           | Tags/FTS           | Risk        | Verdict                                        |
| --------------------------- | ----------------- | --------------------- | ---------------- | ------------------- | ------------------ | ----------- | ---------------------------------------------- |
| **SQLite + better-sqlite3** | ~18µs (53K ops/s) | Excellent (prebuilts) | Confirmed        | Well within ceiling | FTS5 + junction    | LOW         | **PRIMARY — v1**                               |
| SQLite + node:sqlite        | ~24µs (41K ops/s) | Built-in              | Native           | Well within ceiling | FTS5 (unconfirmed) | LOW         | Viable fallback                                |
| DuckDB                      | ~400–900µs/row    | x64 OK                | @duckdb/node-api | Analytical only     | Extension          | LOW         | ANALYTICAL OVERLAY ONLY                        |
| LibSQL/Turso                | ~35µs             | Known errors (#1797)  | Yes              | Fine                | Via compat         | MEDIUM-HIGH | NOT RECOMMENDED                                |
| PGlite                      | ~57µs in-mem      | No Windows data       | Yes              | Fine                | pg extensions      | MEDIUM      | NOT RECOMMENDED                                |
| LadybugDB v0.15.3           | Unverified        | CLI OK; NAPI ?        | `lbug`           | Capable             | BM25+HNSW built-in | **HIGH**    | UPGRADE PATH v2+ (HIGH RISK — frozen upstream) |
| CozoDB                      | N/A               | Confirmed             | cozo-node        | Capable             | Yes + vector       | HIGH        | RISKY (stalled Dec 2023)                       |

### Winner: SQLite + better-sqlite3

Five independent findings files (D1a-1, D1a-2, D8, D15-1, D2b-2) converge on
this choice. Verified production deployment: codebase-memory-mcp at 49,000 nodes
and 196,000 edges with sub-1ms queries. T28's projected 7,300–10,950 nodes over
three years is orders of magnitude below any performance ceiling. better-sqlite3
v12.8.0 bundles SQLite 3.51.3 which closes a critical WAL corruption bug present
in 3.51.0–3.51.2.

**Note on the 2.1M node scale figure (C-003 corrected):** Earlier synthesis
cited "2.1 million nodes / 4.9 million edges" as the headline evidence. This
figure (codebase-memory-mcp Linux kernel run) is from the same repo but was
marked UNVERIFIABLE — no primary source page confirmed it, and write latency
figures (18µs, 53K ops/s) lacked direct citation. The **verified evidence** is
codebase-memory-mcp at 49K nodes / sub-1ms queries. The conclusion (SQLite is
adequate for T28) remains unchanged — 49K verified is still 4-5x T28's ceiling.

### Runner-Up: LadybugDB (v2 upgrade path — HIGH RISK)

Upgrade trigger: when T28 needs 4+ hop cycle-safe traversal, multi-edge-type
pattern matching, or Cypher expressiveness that recursive CTEs cannot serve
efficiently. Before any upgrade planning: test `npm install lbug` on Windows
11 + Node.js v22. WASM fallback (`lbug-wasm`) exists if native binding fails.
This path has been downgraded to LOW confidence pending Kuzu upstream
resolution.

### Scale Evidence (SQLite)

| Deployment                   | Nodes   | Edges    | Latency         |
| ---------------------------- | ------- | -------- | --------------- |
| code-review-graph (FastAPI)  | 6,285   | 27,117   | 128ms update    |
| codebase-memory-mcp (Django) | 49,000  | 196,000  | sub-1ms queries |
| **T28 projected (3 years)**  | ~10,950 | ~20,000+ | **Negligible**  |

---

## 4. Schema Design

### Design Principles

1. Single SourceNode table with `source_type` discriminator — no per-type table
   explosion
2. A-MEM 7-field node pattern — keywords (retrieval), tags (classification),
   contextual_description (LLM summary) are all distinct and necessary
3. Graphiti bi-temporal event-time only — soft invalidation, never delete
4. M2M junction table for tags — Willison benchmark proves this is the correct
   tradeoff
5. Per-node confidence in a separate `node_metadata` table — keeps semantic body
   separate from tracking state

### Node Types (2)

**SourceNode** — All 28 input source types via `source_type` discriminator.
Fields: `id` (UUID), `source_type`, `url`, `title`, `author`, `content`,
`keywords` (JSON array 3-7), `summary`, `embedding` (384d BLOB — **included in
v1 schema with NULL values; populated in v2. No ALTER TABLE needed.**),
`fetched_at`, `valid_at`, `invalid_at`, `body` (JSON, type-specific), with
virtual generated columns for `confidence` and `source_tier` promoting hot
fields from body.

Source types (28): repo, pdf, arxiv, audio, video, tweet, github-issue,
github-pr, hacker-news, reddit, blog-post, newsletter, book, podcast-transcript,
youtube-transcript, notion-page, confluence-page, jira-ticket, slack-message,
email, api-response, markdown-file, csv-dataset, json-dataset, web-page,
code-snippet, meeting-note, research-note.

**KnowledgeNode** — Extracted claims, insights, facts, questions from
SourceNodes. Fields: `id`, `claim_type`
(insight/fact/opinion/question/contradiction), `content`, `keywords` (JSON),
`tags_summary` (display), `contextual_description` (LLM
topic+argument+audience), `embedding` (384d over concat of content+keywords+desc
— **included in v1 schema with NULL values; populated in v2**), `created_at`,
`valid_at`, `invalid_at`, `source_node_id`, `evolution_history` (neighbor log).

**A-MEM 7-field attribution (C-019 corrected):** A-MEM's actual 7 fields are
`{content, timestamp, keywords, tags, contextual_description, embedding, links}`.
The `valid_at`/`invalid_at` fields cited previously are Graphiti edge fields,
not A-MEM. A-MEM's 7th field is `links` (linked_memories / L_i), which is the
graph link list for LINKS_TO edges. T28 stores this as `evolution_history` (JSON
array of linked node IDs + context).

### Edge Types (4 core + 3 agent-inferred)

| edge_type      | Allowed Direction            | Description                          | Canonical Home                           |
| -------------- | ---------------------------- | ------------------------------------ | ---------------------------------------- |
| LINKS_TO       | any → any                    | Semantic connection (A-MEM L_i)      | graph (supplemental edges file)          |
| CITES          | knowledge_node → source_node | Provenance/attribution               | graph (derivable from KN.source_node_id) |
| MENTIONS       | source_node → knowledge_node | Source contains claim                | graph (derivable from EXTRACTED_FROM)    |
| SUPERSEDES     | any → any                    | Version/update replaces earlier node | **supplemental edges file**              |
| EXTRACTED_FROM | KnowledgeNode → SourceNode   | Migration provenance                 | derivable from files                     |
| RELATED_TO     | SourceNode → SourceNode      | Cross-repo connections               | **supplemental edges file**              |
| MEMBER_OF      | SourceNode → ThemeNode       | Cluster assignment                   | **supplemental edges file**              |

**File-graph hybrid boundary (contrarian challenge #3 addressed):** Files are
canonical for SourceNodes and human-curated data. Agent-inferred edges
(SUPERSEDES, RELATED_TO, ALSO_SEEN_IN, LINKS_TO between KnowledgeNodes) have no
parent file — they would violate the "no graph-only data" rule if treated as
graph-only. Resolution: agent-inferred edges are stored in a **supplemental
edges file** (e.g., `.research/graph-edges.jsonl`) which serves as their
canonical source. `t28 rebuild-graph` reads both the content files and this
supplemental edges file. The edges file is git-tracked.

**Soft invalidation for contradictions:** When a new KnowledgeNode contradicts
an existing one, set `invalid_at` on the old edge. Never delete. Query current
state: `WHERE invalid_at IS NULL`.

### Tag System (M2M Junction — Willison Benchmark Winner)

Two tables: `tags` (id, normalized name) and `node_tags` (node_id, tag_id,
composite PK). Works for both SourceNode and KnowledgeNode IDs.

**Willison benchmark at 100K rows:** Single tag 1.41ms, AND(2 tags) 2.26ms,
OR(2-5 tags) 10.69ms. JSON array alternative 40-55ms — avoid entirely.

**Keywords vs tags distinction (A-MEM):** Keywords are specific retrieval
signals stored inline — "photography", "Step 9", "FalkorDB". Tags are broad
categorical classifiers stored in junction — "#recovery", "#tools", "#2026-04".

### Per-Node Confidence (Pattern C)

Separate `node_metadata` table: `node_id`, `confidence` (0.0-1.0, default 0.5),
`source_count` (independent corroborating sources), `conf_extract`,
`conf_source` (S0-S3 tier).

Confidence formula:
`synthesis_confidence = base_confidence * min(1.0, source_count / 3)`. Hits full
confidence at 3+ independent corroborating sources.

### FTS5 Index

```sql
CREATE VIRTUAL TABLE search_index USING fts5(
  title, content, keywords, summary,
  tokenize = 'porter unicode61 remove_diacritics 2',
  prefix = '2 3', detail = 'full',
  content = 'source_nodes', content_rowid = 'rowid'
);
```

Column-weighted BM25: title 10x, keywords 5x, content 1x.

### Stable Identity

Every node gets a UUID that survives database resets. URL scheme:
`t28://source/[uuid]`, `t28://knowledge/[uuid]`, `t28://tag/[name]`.

---

## 5. Search Architecture

### Three-Layer Hybrid (Wire from Day One, Enable in v2)

The research is unambiguous: three-layer hybrid is justified from day one at
T28's scale — runs sub-3ms at 16,894 files. However, v1 ships with FTS5 only to
stay within the solo-developer complexity budget. Upgrade to full hybrid when
FTS5 proves insufficient for real queries.

```
Query Input
    │
    ├─ [Tag Pre-filter] ──── junction table CTE ──→ candidate node_ids (1.41ms)
    │
    ├─ Layer 1: FTS5 ──────── BM25 + porter ──────→ ranked list + BM25 scores
    │
    ├─ Layer 2: sqlite-vec ── MiniLM 384d cosine ──→ ranked list + cosine scores  [v2]
    │
    └─ Layer 3: RRF Fusion ── k=60 ──────────────→ unified ranked list            [v2]
                │
                └─ Layer 4: Graph Expansion ──── BFS 1-2 hops ──→ context nodes
```

### Component Decisions

**Embedding model (v2):** MiniLM-L6-v2 via `@huggingface/transformers` (v4).
22MB ONNX, 384 dimensions, ~14.7ms per 1K tokens on CPU. No Python. Local. No
API calls. Windows-confirmed. BGE-M3 is 25x larger with multilingual advantages
irrelevant for English technical notes.

**Note on package name (C-030 corrected):** The correct package is
`@huggingface/transformers` (v4). `@xenova/transformers` is the deprecated
predecessor — do not use.

**Embedding formula (A-MEM pattern):**
`embed(node) = MiniLM(concat(content, keywords, summary))` — all enriched text
fields concatenated before encoding.

**RRF k=60:** The academic standard. k=60 balanced across three retrieval
methods. k=1 (Graphiti) is intentionally aggressive for their top-position use
case, not appropriate for T28's discovery use case.

**Graph expansion:** After hybrid search returns top-K nodes, BFS 1-2 hops
through valid edges adds context nodes. Zep reports 18.5% accuracy gain + 90%
token reduction (115K → 1.6K tokens). Cap at 2 hops, 500-token injection cap
(enables prompt caching).

**Contradiction between S1 and S2 on v1 scope:** S1 (D8) recommends wiring all
three layers from day one. S3 (D15-2) recommends FTS5-only v1 for complexity
budget. Resolution: S3 wins for v1 due to solo-developer complexity budget
constraint. The hybrid architecture is fully specified and ready to implement in
v2.

---

## 6. Graph Analytics Roadmap

| Phase            | Trigger          | Technology            | Algorithms                                                                       |
| ---------------- | ---------------- | --------------------- | -------------------------------------------------------------------------------- |
| v1.0 Day One     | Always           | SQLite recursive CTEs | BFS, traversal, degree centrality, shortest paths                                |
| v1.x ~3-6 months | 500-1,000 nodes  | graphology in-memory  | Louvain community detection                                                      |
| v2.0             | Post-community   | graphology batch jobs | PageRank (+ degree fallback), betweenness centrality                             |
| v2.x+            | Quality pressure | Leiden library        | Higher-quality communities (25% fewer misassignments)                            |
| v3+              | Validated demand | MAGMA-style           | 4-graph decomposition (temporal/causal/semantic/entity), async LLM consolidation |

**Day-one traversal (recursive CTEs, adequate to ~5,000 nodes for 2-3 hops):**

- Everything connected to X within 2 hops
- All nodes tagged [#topic] linking to [#other-topic]
- Notes from last week referencing [meeting]
- Shortest path between A and B
- Basic degree centrality (COUNT edges per node, usable early PageRank
  substitute)

**Louvain at 500-1,000 nodes (graphology, obra-proven):** Load full graph from
SQLite into graphology in-memory → run Louvain → return community assignments.
Performance: ~53ms at 1,000 nodes, ~938ms at 50,000 nodes. Not incremental —
full reload required each run.

**graphology ecosystem note (C-037 corrected):** graphology has approximately
246 npm dependents (not 4,900+). The original figure incorrectly counted
graphology's own sub-packages as external dependents. Risk assessment:
LOW-MEDIUM on ecosystem size alone. Justification shifts to technical fit:
correct algorithms available, zero native deps, pure JS, MIT license, 1,600+
GitHub stars.

**Betweenness centrality (v2, C-039 corrected):** Betweenness centrality is
**structurally analogous** to bridge centrality used in addiction/mental health
network research (not "clinically identical" — the methods differ). T28's domain
has structural similarities to comorbidity network graphs where bridge nodes are
high-value. Expensive: O(E\*V). Run periodically as background job, cache
results. Never compute per-query.

**Deferred to v3+:** MAGMA 4-graph decomposition (LoCoMo 0.700 benchmark is
impressive, operational overhead is substantial), MemSkill RL infrastructure,
FluxMem Beta Mixture Model, EverMemOS.

---

## 7. File-Graph Coexistence

### The Cardinal Rule

**Write to files first. Index into graph second. Never reverse this.**

Confirmed by 7 independent production systems. BasicMemory: `write_note` → file
→ SyncService → SQLite. Palinode: "If every service crashes, `cat` still works."
IWE: "All modifications through direct Markdown editing." Logseq's painful DB
migration reversal is the cautionary counterexample.

For T28: agent writes findings → `t28 absorb <path>` indexes into graph → if
absorb fails, file survives, next incremental sync re-processes.

### Files-Canonical Hybrid Boundary

**Files are canonical for SourceNodes and human-curated data.** This is
confirmed by all 7 production systems reviewed. However, all 7 are human-facing
tools — none generate bidirectional agent-written edges.

**Graph is canonical for agent-inferred edges.** SUPERSEDES, RELATED_TO,
ALSO_SEEN_IN, and LINKS_TO edges between KnowledgeNodes have no parent file.
These are stored in `.research/graph-edges.jsonl` (supplemental edges file),
which is git-tracked and serves as the canonical source for these edges.
`t28 rebuild-graph` reads both content files and the supplemental edges file.
Rebuild is still idempotent and under one second.

### Three-Tier Compaction Resilience

| Tier             | Contents                                           | Recovery              |
| ---------------- | -------------------------------------------------- | --------------------- |
| T1 — Filesystem  | All content, findings, metadata, graph-edges.jsonl | `cat`, Read tool      |
| T2 — Git history | All versions, diffs, audit trail                   | `git log`, `git diff` |
| T3 — Graph index | Derived relationships, query acceleration          | `t28 rebuild-graph`   |

If T3 fails: T1+T2 intact, rebuild restores T3. Zero data loss. No backup
strategy needed.

### Rebuild Strategy

| Command                     | Behavior                                         | Timing                           |
| --------------------------- | ------------------------------------------------ | -------------------------------- |
| `t28 rebuild-graph --force` | Delete DB, re-scan all files + graph-edges.jsonl | Under 1 second at T28 scale      |
| `t28 sync`                  | Hash-compare, process changed files only         | Microseconds for unchanged files |
| Session-start               | `t28 sync` fast path                             | Near-zero if files unchanged     |

Full rebuild is idempotent via `ON CONFLICT(path) DO UPDATE WHERE hash changed`.
Fast enough to run on every session start.

### Incremental Indexing

Content-hash comparison (SHA-256 or XXH3), not mtime. Two-phase sync: (1)
cleanup orphans, (2) scan with hash comparison. All operations in SAVEPOINT
transactions — crash leaves DB consistent with pre-sync state.

### Git Patterns

Add to `.gitignore` before T28 implementation (currently absent from project):

```gitignore
# T28 graph database (derived, regenerable)
.research/*.db
.research/*.db-wal
.research/*.db-shm
```

Do not delete WAL files manually on Windows — OS-level file locks may still be
held. Let SQLite close them via `sqlite3_close()`.

### PRAGMA Configuration

Set on every connection open (not persisted in DB):

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA temp_store = MEMORY;
```

Do NOT use `synchronous = OFF` (data loss on crash). Do NOT skip
`foreign_keys = ON` (FK violations silently accepted).

---

## 8. Migration Plan

### Overview

One-time bootstrap from existing `.research/` files into an empty SQLite
database. Scope: 18 SourceNodes, 167 KnowledgeNodes, 167+ edges. Runs in a
single transaction under one second.

### Pre-Migration Prerequisite: source-slug-map.json

**This must be authored before the migration script can run.** 9 of 13
repository slugs are non-derivable from the `source` field in
extraction-journal.jsonl. Simple `toLowerCase().replace('/', '-')` fails for the
majority. This is the only blocking pre-migration task.

Known irregular mappings: `teng-lin/notebooklm-py` → `teng-lin_notebooklm-py`
(underscore separator), `aws-solutions-library-samples/guidance-for-...` →
`aws-media-extraction` (completely different slug), `iawia002/lux` →
`lux-video-downloader` (renamed). Full mapping of all 18 sources must be
authored before running Phase 2.

### Four Migration Phases

**Phase 1: SourceNodes (18 nodes)** — Input: analysis.json files +
source-slug-map.json. Six schema normalization differences (date field names,
schema version presence, name field, URL field, scan depth field, absencePattern
polymorphism). Gen A (v4.0-4.2), Gen B (v4.3), Website (v1.0), and AWS variant
(extra meta wrapper + repo sub-object) all handled in ~50 lines. Validation: 18
SourceNodes, 0 orphans, all have url and name.

**Phase 2: KnowledgeNodes (167 nodes)** — Input A: extraction-journal.jsonl (167
entries, skip 1 `decision:skip`). Input B: value-map.json candidates. Input C:
findings.jsonl entries. Type normalization: 9 journal types → graph labels
(pattern→Pattern, anti-pattern→AntiPattern, knowledge→Fact, content→Capability,
etc.). Confidence from novelty: HIGH→0.9, MEDIUM→0.7, LOW→0.5.

**Phase 3: Edges** — EXTRACTED_FROM (167 provenance edges, required for every
KnowledgeNode), RELATED_TO (SourceNode→SourceNode from cross_repo_connections),
SUPPORTED_BY (from website value-map finding_refs), MEMBER_OF
(SourceNode→ThemeNode from cluster A-F, pre-seed 6 ThemeNode stubs).
ALSO_SEEN_IN deferred — requires semantic comparison across sources, not a
migration step.

**Phase 4: Validation (7 queries):**

| Query                                    | Expected                                                       |
| ---------------------------------------- | -------------------------------------------------------------- |
| V1: Node count by type                   | 18 SourceNodes, 167+ KnowledgeNodes, 6 ThemeNodes              |
| V2: Edge count by relation               | 167+ EXTRACTED_FROM, N RELATED_TO, N SUPPORTED_BY, N MEMBER_OF |
| V3: Orphaned KnowledgeNodes              | 0                                                              |
| V4: Orphaned SourceNodes                 | 0                                                              |
| V5: EXTRACTED_FROM count matches journal | 167                                                            |
| V6: PRAGMA integrity_check()             | 'ok'                                                           |
| V7: PRAGMA foreign_key_check()           | 0 rows                                                         |

Rollback = delete .db file + re-run migrate.js. No incremental rollback needed.

### Migration Script Architecture

Location: `scripts/t28/migrate.js` (follows `scripts/debt/intake-manual.js`
pattern). All required helpers already exist: `generate-content-hash.js`,
`normalize-file-path.js`, `sanitize-error.js`.

```
scripts/t28/
├── migrate.js          # Entry: parse args, open DB, run phases, validate
├── phases/
│   ├── 01-schema.js    # CREATE TABLE IF NOT EXISTS (idempotent)
│   ├── 02-sources.js   # analysis.json → SourceNodes
│   ├── 03-knowledge.js # extraction-journal + value-map + findings → KnowledgeNodes
│   └── 04-edges.js     # EXTRACTED_FROM, RELATED_TO, SUPPORTED_BY, MEMBER_OF
└── validate.js         # V1-V7 queries
```

CLI flags: `--dry-run`, `--force`, `--verify-only`, `--source <slug>`,
`--verbose`. Execution: entire migration in a single `db.transaction()` with
auto-rollback on exception. Validation runs outside transaction, reads only.

---

## 9. Knowledge Maintenance

### Deduplication Pipeline (Three-Stage Funnel)

| Stage                                         | Mechanism                                         | Threshold                                                                           | Timing        |
| --------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------- |
| 1. Exact/normalized                           | Lowercase, strip punctuation, collapse whitespace | Exact match                                                                         | At absorb     |
| 2. FTS + embedding cosine (iText2KG weighted) | 0.6 name + 0.4 label weight                       | **Start at 0.7 (iText2KG default), mandatory calibration after 167-node migration** | At absorb     |
| 3. LLM resolver                               | Ambiguous pairs in 0.65-threshold cosine band     | Human-in-loop                                                                       | At checkpoint |

**Dedup threshold (C-050 corrected):** The 0.78 threshold in earlier synthesis
had no source. The iText2KG default is 0.7. Start at 0.7 and calibrate after the
167-node migration: manually review the top-20 near-threshold pairs (0.65-0.78
band) before locking the threshold. iText2KG weighting (0.6 name + 0.4 label)
prevents homonym false merges ("Python" language vs "Python" snake). The
weighting was designed for general NLP — recovery/sobriety domain may require
calibration. Industry range is 0.70-0.85.

**Merge strategy:** >= 0.90 cosine → physical merge (surviving node inherits max
confidence). 0.65-0.90 → SAME_AS edge (both preserved, deferred for
`/reorganize`). < 0.65 → no action.

### Edge Pruning

Never delete edges. Mark invalid with timestamp. Staleness threshold:
`confidence < 0.3` AND `last_seen > 180 days` AND no corroborating sources → set
`invalid_at = NOW()`. More conservative than A-MEM's 90-day threshold
(unverified, do not hardcode). OpenCTI tolerance: edges of same type between
same entities within ±30 days merge rather than creating temporal duplicates.

### Node Splitting (Anti-Cramming)

Trigger: node has >= 3 distinct edge-type clusters AND >= 8 total observations.
Detection query surfaces candidates. Do not auto-split — present candidates to
user. Splitting is a semantic operation requiring human judgment. Thresholds
from farzaa's heuristic, no published validation.

### Node Enrichment (Anti-Thinning)

Trigger: `incoming_edge_count >= 3` AND `observation_count < 4`. Options:
passive (wait for next absorb), source pull (query source archive), or active
LLM synthesis (mark `is_synthesized: true`, `confidence: 0.5`, always superseded
by source-backed observations). Never surface synthesized observations without
explicit flag.

### Checkpoint Cycle (15-Entry Cadence)

Trigger: after every 15 absorbs or manually via `/graph-checkpoint`. At T28's
pace of ~10 sources/day: fires every 1-2 days.

Steps: (1) rebuild index metadata, (2) recalculate edge counts, (3) cramming
audit (if zero new nodes → flag), (4) quality audit of 3 most-updated nodes, (5)
split check, (6) Stage 3 dedup resolution, (7) structural cluster density
review.

### Garbage Collection

Orphan threshold: > 5% of total nodes → trigger cleanup. After batch deletions:
if `freelist_count > 20%` of pages, run `PRAGMA wal_checkpoint(TRUNCATE)` then
VACUUM. VACUUM creates a full DB copy — run during off-hours, not automatically.

### Confidence Tracking

Formula: `confidence = min(1.0, source_quality_sum / 5.0)`. Store
`observation_count` + `source_quality_sum` per node. On merge: inherit max
confidence of both nodes (OpenCTI pattern).

---

## 10. Risk Assessment

### Per-Component Risk Matrix

| Component                 | Risk       | Key Risk                                                                              | Mitigation                                                       |
| ------------------------- | ---------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| better-sqlite3 v12.8.0    | LOW        | Windows native build on non-LTS node                                                  | Prebuilts available; verify WAL is 3.51.3                        |
| SQLite 3.51.3 WAL         | LOW        | Previous 3.51.0–3.51.2 had corruption bug                                             | Fixed in v12.8.0                                                 |
| graphology v0.26.0        | LOW-MEDIUM | ~246 dependents (lower than originally cited)                                         | Pure JS, zero native deps, correct algorithms                    |
| node:sqlite (built-in)    | LOW        | FTS5 availability unconfirmed                                                         | Use better-sqlite3 as primary                                    |
| sqlite-vec v0.1.9         | MEDIUM     | Solo maintainer (Alex Garcia), 6-month dormancy                                       | Pin v0.1.9; defer vector to Phase 2                              |
| @huggingface/transformers | MEDIUM     | v3→v4 breaking changes, cache issues                                                  | Configure explicit cache path; 23MB first-run                    |
| LadybugDB v0.15.3         | **HIGH**   | **Frozen upstream (Kuzu archived Oct 2025), 3-way fork split, npm package is `lbug`** | Test `npm install lbug` first; WASM fallback; prefer DuckDB path |
| n-r-w/knowledgegraph-mcp  | CRITICAL   | Maintainer publicly abandoned (last commit Nov 2025)                                  | Reference only; never take as dependency                         |
| official server-memory    | CRITICAL   | Data corruption (GitHub #2577), no tags, 80K token ceiling                            | Do not use                                                       |
| CozoDB                    | HIGH       | Stalled Dec 2023, pre-1.0                                                             | Defer unless maintenance confirmed                               |
| DuckDB (as primary)       | HIGH       | 10–500x write penalty vs SQLite                                                       | Analytical overlay only; never primary                           |

### Solo-Developer Fitness Assessment

| Factor                      | Assessment                                         |
| --------------------------- | -------------------------------------------------- |
| No Docker required          | YES — SQLite + graphology entirely local           |
| No external services        | YES — MiniLM runs local (v2), no API keys          |
| Failure recovery            | EXCELLENT — delete DB, rebuild from files in <1s   |
| Windows 11 support          | CONFIRMED for SQLite + better-sqlite3 + graphology |
| Windows 11 sqlite-vec       | UNCONFIRMED — verify before v2 vector work         |
| LadybugDB `lbug` on Windows | UNCONFIRMED — test before any v2 upgrade planning  |

### Bus Factor Risks

LadybugDB has the highest bus factor concern: Kuzu upstream archived (Apple
acquisition Oct 2025), 6-month fork age, three competing forks (LadybugDB,
Vela-Engineering multi-writer, Bighorn/Kineviz) with unresolved consolidation.
SQLite has no equivalent concern. SQLite's 30+ year track record is a
significant risk advantage.

---

## 11. Implementation Roadmap

### V1 MVP: Core Graph + FTS5 Search

**Goal:** Bootstrap existing corpus, establish daily operational loop.

1. **`scripts/t28/migrate.js`** — Bootstrap 18 SourceNodes + 167 KnowledgeNodes
   from existing `.research/` files. Prerequisite: author `source-slug-map.json`
   first.
2. **`t28 sync`** — Incremental absorb of new analyses. Content-hash comparison,
   SAVEPOINT atomicity.
3. **`t28 rebuild-graph`** — Idempotent full rebuild from files +
   graph-edges.jsonl. Compaction resilience guarantee.
4. **`t28 query`** — FTS5 search + tag pre-filter + 2-hop subgraph serialization
   for Claude.
5. **`/graph-checkpoint`** — 15-entry maintenance cycle. Dedup + split + VACUUM.
6. **`t28 absorb`** — Structured ingest with Stages 1-2 dedup. Clean graph over
   time.

Stack: SQLite + better-sqlite3 v12.8.0 + graphology + custom TypeScript MCP (5-8
tools). New concepts: ~3 (graph theory, FTS5, BM25). Within complexity budget.

**MCP tools (initial set):** `add_source`, `add_knowledge`, `link_nodes`,
`search` (FTS5 + tags), `get_neighbors` (BFS 1-2 hops), `get_node`, `list_tags`.
Total: 7 tools.

**Schema note:** Include 384d embedding column in v1 DDL with NULL values.
Populate in v2 when adding MiniLM. No ALTER TABLE needed at v2 transition.

### V2: Hybrid Search + Vectors

**Trigger:** FTS5 search proves insufficient for real queries on actual graph
data.

Additions:

- sqlite-vec v0.1.9 (verify Windows .dll first)
- `@huggingface/transformers` v4 + MiniLM-L6-v2 (22MB, local, no API)
- RRF k=60 fusion over FTS5 + vector results
- `search_index` expanded to include embedding similarity

Stack additions: ~5 new concepts total (within ceiling). Verify sqlite-vec
Windows binding before committing.

### V3: Graph-Native + Advanced Analytics

**Trigger:** Validated demand — recursive CTEs bottlenecking on query complexity
(not node count), or LadybugDB fork consolidation resolved.

Options:

- LadybugDB migration only if fork reaches v1.0 with Windows NAPI confirmed on
  `lbug` package (HIGH risk — do not plan for this until then)
- DuckDB + sqlite_scanner analytical overlay (30-50x faster aggregations, zero
  schema changes — preferred v2+ analytical path)
- Leiden community detection (higher quality than Louvain, not in graphology —
  separate library)

---

## 12. Contradictions and Open Questions

### Cross-Synthesizer Contradictions

**C1: v1 Search Scope — full hybrid day one (S2) vs FTS5-only for complexity
budget (S3)** S2 (D12, D14-3): three-layer hybrid is justified from day one. S3
(D15-2): solo-developer complexity budget constrains v1 to FTS5-only.
Resolution: S3 wins. The complexity budget constraint is not a research finding
— it is a sound engineering judgment for a first graph project. Hybrid
architecture is fully specified and ready for v2.

**C2: RRF k constant — k=1 (Graphiti) vs k=60 (academic standard)** S2 (D6-1):
Graphiti uses k=1 (intentionally aggressive). S2 (D12, D14-3): k=60 is the
validated standard. Not a contradiction about what works — a design choice for
different use cases. T28 should use k=60 for balanced discovery.

**C3: Community detection algorithm — LP vs Leiden in Graphiti** S2 (D6-1):
arXiv paper describes label propagation as primary; code uses Leiden for batch.
S2 (D14-2): opposite framing. Practical resolution: use graphology's Louvain
(available implementation). Revisit algorithm quality when community detection
is in production.

**C4: SQLite CTE scale ceiling — conservative vs generous estimates** S1
(D1a-1): adequate for T28's scale with depth caps. S1 (D8): 1M nodes for linear
traversals vs 100-1,000 for complex shapes. Both correct for different query
shapes. T28's 1-3 hop sparse traversal will be adequate past 100K nodes. Include
depth limits on all CTE traversal queries from day one.

**C5: LadybugDB npm package name (resolved):** The correct package is `lbug`.
Both `@ladybug/core` and `@ladybugdb/core` are wrong. This reflects a
documentation culture problem in the LadybugDB project. Test `npm install lbug`
on Windows 11 + Node.js v22 before any v2 planning.

### Consolidated Open Questions

**Critical (block v1 or v2 decisions):**

| #         | Question                                                                                                                  | Impact                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| OQ-1      | LadybugDB: does `npm install lbug` complete on Windows 11 + Node.js v22?                                                  | v2 upgrade path (HIGH risk)                          |
| OQ-2      | sqlite-vec Windows .dll binding stability — pre-v1, not benchmarked on Windows                                            | v2 vector work                                       |
| OQ-3      | node:sqlite FTS5 extension availability — if available, zero-dependency option exists                                     | v1 alternative                                       |
| OQ-4      | DuckDB sqlite_scanner locking — does read-only attach block concurrent SQLite WAL writes?                                 | v2+ overlay                                          |
| OQ-5      | source-slug-map.json — 9 irregular slug mappings must be manually authored before migration                               | Blocks migration                                     |
| **OQ-16** | **Neuromcp capability audit (30 min) — does it provide flat #tag API, per-node confidence, AND contradiction detection?** | **Could flip build-vs-adopt decision for MCP layer** |

**Important (affect design but not blockers):**

| #         | Question                                                                                                                                                    | Impact                                            |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| OQ-6      | Per-file vs per-section SourceNode granularity — BasicMemory uses per-file, Obsidian retriever uses per-chunk                                               | Ingestion pipeline design                         |
| OQ-7      | `@huggingface/transformers` ONNX Windows CPU latency — 14.7ms/1K tokens is macOS/Linux benchmark                                                            | Sync vs async embedding decision                  |
| OQ-8      | A-MEM k neighbors for evolution — paper says k=5-10, right value depends on average connectivity                                                            | Ingestion pipeline tuning                         |
| OQ-9      | Tag vocabulary management — user-controlled autocomplete vs LLM-suggested                                                                                   | UX design                                         |
| OQ-10     | Confidence floor for knowledge node creation — what threshold prevents low-value node proliferation                                                         | Data quality                                      |
| OQ-11     | CONTRADICTS edge creation — where in absorb pipeline does contradiction detection happen?                                                                   | Operation 4 Tier 1 usability                      |
| OQ-12     | Checkpoint "entry" unit — one absorb call = one entry (proposed, not validated)                                                                             | Checkpoint frequency                              |
| OQ-13     | SQLite-graph extension (agentflare-ai) — Cypher-style queries over SQLite via virtual tables, could eliminate verbose CTEs                                  | Developer ergonomics (worth investigating)        |
| OQ-14     | mind-mem flat tag adaptation — can ConstraintSignature be retargeted for free-form hashtags?                                                                | Contradiction detection alternative               |
| OQ-15     | Ingestion pipeline for non-text source types (audio, video, image)                                                                                          | v2 content expansion                              |
| **OQ-17** | **30-session query pattern audit — are 80%+ of queries simple FTS5 keyword lookups? If so, bi-temporal model and junction tables may be over-engineering.** | **Schema finalization — do this before building** |

---

## 13. Challenges and Limitations

_Added in v1.1 — post-challenge synthesis (2026-04-07)_

Three challenge agents reviewed the research: contrarian (pre-mortem framing),
OTB-1 (unconsidered approaches), and OTB-2 (process and assumption blind spots).

### Contrarian Challenge — 7 MAJOR Challenges

The contrarian agent identified 7 major challenges in priority order:

1. **LadybugDB package name wrong in both directions (RESOLVED in v1.1).**
   Actual package is `lbug`, not `@ladybug/core` or `@ladybugdb/core`.
   Documentation culture signal predicting instability. LadybugDB confidence
   downgraded to LOW.
2. **Primary scale justification uncitable (RESOLVED in v1.1).** "2.1M nodes"
   headline lacked a citable primary source. Replaced with verified 49K node
   benchmark. Conclusion unchanged.
3. **"Files canonical" wrong for agent-inferred edges (RESOLVED in v1.1).** All
   7 confirming systems are human-facing tools — none generate bidirectional
   agent edges. Hybrid boundary made explicit: files canonical for SourceNodes;
   supplemental edges file canonical for agent-inferred edges.
4. **Neuromcp capability audit missing (OPEN — OQ-16).** Neuromcp (glama.ai)
   potentially provides all 3 T28 requirements (trust levels, contradiction
   detection, tag support). Never investigated. "Build custom" confidence
   downgraded to MEDIUM-HIGH pending 30-minute audit.
5. **graphology dependents claim 20x wrong (RESOLVED in v1.1).** ~246 actual
   dependents vs 4,900+ claimed. Risk reassessed to LOW-MEDIUM on ecosystem
   size. Justified on technical fit instead.
6. **Schema embedding column tension unresolved (RESOLVED in v1.1).** v1 schema
   includes 384d embedding column with NULLs; populate in v2. No ALTER TABLE
   needed.
7. **A-MEM attribution error propagates into schema (RESOLVED in v1.1).**
   A-MEM's 7th field is `links` (L_i), not `valid_at`/`invalid_at`. Those are
   Graphiti edge fields. C-019 corrected.
8. **Dedup threshold 0.78 unvalidated (RESOLVED in v1.1).** Changed to "start at
   0.7 (iText2KG default), mandatory calibration after 167-node migration."

### OTB-1 Challenge — 1 Material Change

**LadybugDB upstream archived (RESOLVED in v1.1).** Kuzu Inc. acquired by Apple
Oct 2025, repo archived. LadybugDB risk upgraded from MEDIUM-HIGH to HIGH.
DuckDB+sqlite_scanner is the stronger v2 analytical path. Other alternatives
(LanceDB v2 contingency, JSONL-only epoch, Oxigraph, Datalog rules, Zettelkasten
folgezettel, no-graph flat) noted as minor or future considerations with no
changes to primary recommendation.

### OTB-2 Challenge — 1 CRITICAL Process Gap

**Query pattern audit before schema finalization (OPEN — OQ-17).** Schema was
designed without examining actual Claude query patterns. If 80%+ of real queries
are simple FTS5 keyword lookups, the bi-temporal model and junction tables are
over-engineering. **This is a 2-hour exercise that should happen before any v1
build starts.**

Additional HIGH items from OTB-2 (not yet actioned):

- Run 10 real BM25-only queries against extraction journal before committing to
  FTS5-only (trust collapse risk — if BM25 returns wrong top results, wire
  vectors in v1 instead)
- Pin MCP SDK version + document Node.js upgrade procedure before v1 ships
- Consider 2-week JSONL prototype before SQLite migration to confirm graph adds
  value

### Open Actions from Challenges

| Priority | Action                                                                                                 | Blocks                      |
| -------- | ------------------------------------------------------------------------------------------------------ | --------------------------- |
| CRITICAL | 30-session query pattern audit (OQ-17) — review actual Claude session queries                          | Schema finalization         |
| HIGH     | 30-minute Neuromcp capability audit (OQ-16)                                                            | Build-vs-adopt MCP decision |
| HIGH     | `npm install lbug` on Windows 11 + Node.js v22                                                         | Any v2 LadybugDB planning   |
| HIGH     | Dedup threshold calibration after 167-node migration (manual review of top-20 pairs in 0.65-0.78 band) | Operational quality         |
| HIGH     | Run 10 real BM25-only queries against extraction journal                                               | FTS5-only v1 confidence     |

---

## 14. Sources

### Tier 1: Official Documentation and Primary Research (HIGH reliability)

| ID    | Title                                                                        | Type     |
| ----- | ---------------------------------------------------------------------------- | -------- |
| S-001 | A-MEM arXiv:2502.12110                                                       | academic |
| S-002 | Graphiti/Zep arXiv:2501.13956                                                | academic |
| S-003 | MAGMA arXiv:2601.03236                                                       | academic |
| S-004 | MemSkill arXiv:2602.02474                                                    | academic |
| S-005 | KG Uncertainty Survey arXiv:2405.16929                                       | academic |
| S-006 | Agentic UQ arXiv:2601.15703                                                  | academic |
| S-007 | LightRAG arXiv:2410.05779                                                    | academic |
| S-008 | Graphiti source code (nodes.py, edges.py, search_utils.py)                   | codebase |
| S-009 | SQLite official docs (Recursive CTEs, WAL, JSON, FTS5, 3.51.3 release notes) | docs     |
| S-010 | better-sqlite3 GitHub + Performance Guide                                    | docs     |
| S-011 | SQLite FTS5 official docs                                                    | docs     |
| S-012 | sqlite-vec GitHub v0.1.9                                                     | repo     |
| S-013 | @huggingface/transformers docs + MiniLM model card                           | docs     |
| S-014 | graphology official docs                                                     | docs     |
| S-015 | LadybugDB GitHub (v0.15.3 release assets, `lbug` npm)                        | repo     |
| S-016 | KuzuDB archival announcement (October 2025)                                  | docs     |
| S-017 | DuckDB official docs (Concurrency, SQLite Extension, 1.5.0)                  | docs     |
| S-018 | BasicMemory official docs (7 documents) + DeepWiki analysis                  | docs     |
| S-019 | Graphiti Custom Entity/Edge Types docs                                       | docs     |
| S-020 | Palinode official repo + architecture docs                                   | repo     |
| S-021 | IWE official repo                                                            | repo     |
| S-022 | sqlite-memory repo + CRDT docs                                               | repo     |
| S-023 | obra/knowledge-graph GitHub (Jesse Vincent, March 2026)                      | repo     |
| S-024 | TriliumNext wiki + attribute system docs                                     | docs     |
| S-025 | SiYuan block management docs                                                 | docs     |
| S-026 | Dendron GitHub (maintenance announcement #3890) + Kevin Lin YC retrospective | docs     |
| S-027 | Logseq official (changelog Jan-Mar 2026, DB version docs, @logseq/cli)       | docs     |
| S-028 | n-r-w/knowledgegraph-mcp GitHub (including maintainer abandonment statement) | repo     |
| S-029 | mind-mem GitHub + Glama                                                      | repo     |
| S-030 | Louvain to Leiden (Nature)                                                   | academic |

### Tier 2: Independent Benchmarks and Community Reports (MEDIUM-HIGH reliability)

| ID    | Title                                                                                | Type     |
| ----- | ------------------------------------------------------------------------------------ | -------- |
| S-031 | Simon Willison's March 2026 SQLite tags benchmark                                    | blog     |
| S-032 | SQLite Driver Benchmark: better-sqlite3, node:sqlite, libSQL (sqg.dev, January 2026) | blog     |
| S-033 | blakecrosley.com: Obsidian as AI Infrastructure (16,894 files, 2026)                 | blog     |
| S-034 | Obsidian hybrid retriever GitHub (16,894 files, 23ms p50)                            | repo     |
| S-035 | Graphiti/Zep LongMemEval results (arXiv + GitHub)                                    | academic |
| S-036 | Bridge Centrality: Comorbidity (PubMed)                                              | academic |
| S-037 | DuckDB vs SQLite academic paper benchmarks                                           | academic |
| S-038 | code-review-graph GitHub (tirth8205) production data                                 | repo     |
| S-039 | codebase-memory-mcp (49K nodes, 196K edges benchmark)                                | repo     |
| S-040 | Graphiti GitHub issues #1299, #1111, #1086                                           | repo     |
| S-041 | Harper Reed blog (March 2026): meeting transcript → Obsidian pipeline                | blog     |
| S-042 | DoltHub Polymorphic Associations (SQLite pattern reference)                          | blog     |
| S-043 | Neo4j Labels vs Properties (David Allen)                                             | blog     |

### Tier 3: Community and Directory Sources (MEDIUM reliability)

| ID    | Title                                                                   | Type      |
| ----- | ----------------------------------------------------------------------- | --------- |
| S-044 | Context Portal (ConPort) GitHub                                         | repo      |
| S-045 | LiteGraph MCP GitHub                                                    | repo      |
| S-046 | MemoryMesh GitHub + package.json                                        | repo      |
| S-047 | deanacus/knowledge-graph-mcp GitHub                                     | repo      |
| S-048 | graphthulhu GitHub                                                      | repo      |
| S-049 | MCP server directories (TensorBlock, mcpservers.org, Glama, LobeHub)    | community |
| S-050 | FalkorDB MCPServer GitHub                                               | repo      |
| S-051 | notebooklm-py repo                                                      | repo      |
| S-052 | TurboVault (Epistates) GitHub                                           | repo      |
| S-053 | Tana funding announcement (TechCrunch, Feb 2025)                        | blog      |
| S-054 | farzaa personal wiki gist (15-entry checkpoint pattern)                 | community |
| S-055 | agentflare-ai SQLite-graph extension (Cypher-style queries over SQLite) | repo      |

---

## Methodology

**Phase 1 — Search (32 agents):** 15 findings files in S1 domain (backends, MCP
servers, knowledge tools), 9 findings files in S2 domain (schema, search,
analytics, architecture), 8 findings files in S3 domain (file-graph coexistence,
migration, synthesis operations, maintenance).

**Phase 2 — Domain synthesis (3 agents):** S1-backend-landscape synthesized 15
findings files. S2-design-patterns synthesized 9 findings files.
S3-operations-migration synthesized 8 findings files.

**Phase 3 — Meta-synthesis (1 agent):** Initial synthesis (v1.0) unified across
all three domain synthesis reports.

**Phase 3.97 — Post-challenge corrections (1 agent):** 3 challenge agents
(contrarian, OTB-1, OTB-2) produced 11 specific corrections and 4 open action
items. 9 of 11 corrections resolved in v1.1; 2 remain open (OQ-16 Neuromcp
audit, OQ-17 query pattern audit).

**Total sources identified:** 55 unique sources across all tiers.

**Confidence basis:** Claims rated HIGH where 3+ independent sources converge.
MEDIUM where 1-2 sources support with plausible reasoning. LOW where a single
source or first-principles estimate.

---

## Claim Registry

| ID    | Category     | Confidence  | Status     | Summary                                                                                       |
| ----- | ------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------- |
| C-001 | backend      | HIGH        | CONFIRMED  | SQLite + better-sqlite3 v12.8.0 is primary store for v1                                       |
| C-002 | backend      | HIGH        | CONFIRMED  | better-sqlite3 v12.8.0 bundles SQLite 3.51.3 (WAL corruption fix)                             |
| C-003 | backend      | HIGH        | CORRECTED  | SQLite validated at 49K nodes sub-1ms (not 2.1M node claim -- unverifiable)                   |
| C-004 | backend      | HIGH        | CONFIRMED  | Write latency ~18us (53K ops/s) better-sqlite3                                                |
| C-005 | backend      | HIGH        | CONFIRMED  | DuckDB 400-900us/row write penalty -- analytical overlay only                                 |
| C-006 | backend      | HIGH        | CONFIRMED  | LibSQL/Turso Windows errors issue 1797, not recommended                                       |
| C-007 | backend      | LOW         | CORRECTED  | LadybugDB HIGH RISK -- Kuzu archived Oct 2025, 3-way fork split                               |
| C-008 | backend      | HIGH        | CORRECTED  | LadybugDB npm package is lbug (not @ladybug/core or @ladybugdb/core)                          |
| C-009 | backend      | MEDIUM      | CONFIRMED  | LadybugDB Windows NAPI binding unverified on Node.js v22                                      |
| C-010 | backend      | HIGH        | CONFIRMED  | CozoDB stalled Dec 2023 -- HIGH risk                                                          |
| C-011 | backend      | HIGH        | CONFIRMED  | official server-memory: data corruption, no tags, 80K ceiling                                 |
| C-012 | backend      | HIGH        | CORRECTED  | n-r-w/knowledgegraph-mcp last commit Nov 2025 (not Dec 2024)                                  |
| C-013 | backend      | MEDIUM-HIGH | CORRECTED  | No confirmed server has all 3 T28 requirements -- Neuromcp unaudited (OQ-16)                  |
| C-014 | architecture | MEDIUM-HIGH | CONFIRMED  | Build thin custom MCP layer -- lowest risk v1 path (pending OQ-16)                            |
| C-015 | architecture | HIGH        | CORRECTED  | Files canonical for SourceNodes; agent-inferred edges go to supplemental file                 |
| C-016 | architecture | HIGH        | CONFIRMED  | SQLite DB deletable, rebuild from files + graph-edges.jsonl under 1s                          |
| C-017 | architecture | HIGH        | CONFIRMED  | Every node traces to file artifact via EXTRACTED_FROM                                         |
| C-018 | schema       | HIGH        | CONFIRMED  | Two node types: SourceNode + KnowledgeNode                                                    |
| C-019 | schema       | HIGH        | CORRECTED  | A-MEM 7 fields: content/timestamp/keywords/tags/contextual_description/embedding/links        |
| C-020 | schema       | HIGH        | CONFIRMED  | Four edge types + agent-inferred edges to supplemental edges file                             |
| C-021 | schema       | HIGH        | CONFIRMED  | M2M junction table for tags -- Willison benchmark winner                                      |
| C-022 | schema       | HIGH        | CONFIRMED  | Keywords (inline) vs tags (junction) are distinct                                             |
| C-023 | schema       | MEDIUM      | CONFIRMED  | Per-node confidence in node_metadata table, Pattern C formula                                 |
| C-024 | schema       | HIGH        | CONFIRMED  | Soft invalidation via invalid_at -- never delete                                              |
| C-025 | schema       | HIGH        | CONFIRMED  | Graphiti bi-temporal event-time only                                                          |
| C-026 | schema       | HIGH        | CONFIRMED  | Stable UUID per node, t28:// URL scheme                                                       |
| C-027 | search       | HIGH        | CONFIRMED  | FTS5 porter unicode61, prefix 2 3, BM25 weighted (title 10x, kw 5x)                           |
| C-028 | search       | HIGH        | CONFIRMED  | Three-layer hybrid sub-3ms at scale                                                           |
| C-029 | search       | HIGH        | CONFIRMED  | v1 ships FTS5-only -- complexity budget                                                       |
| C-030 | search       | HIGH        | CORRECTED  | Use @huggingface/transformers v4 (not deprecated @xenova/transformers)                        |
| C-031 | search       | HIGH        | CONFIRMED  | RRF k=60 academic standard                                                                    |
| C-032 | search       | HIGH        | CONFIRMED  | Tag pre-filter via junction table CTE                                                         |
| C-033 | search       | MEDIUM      | CONFIRMED  | Graph expansion 18.5% accuracy gain, 90% token reduction                                      |
| C-034 | search       | MEDIUM      | CONFIRMED  | 500-token injection cap enables prompt caching                                                |
| C-035 | search       | HIGH        | CONFIRMED  | SQLite recursive CTEs adequate to ~5K nodes for 2-3 hops                                      |
| C-036 | architecture | MEDIUM      | CONFIRMED  | Louvain via graphology at 500-1,000 nodes                                                     |
| C-037 | architecture | HIGH        | CORRECTED  | graphology ~246 dependents (not 4,900+) -- risk LOW-MEDIUM on ecosystem size                  |
| C-038 | architecture | MEDIUM      | CONFIRMED  | Louvain ~53ms at 1K nodes, ~938ms at 50K                                                      |
| C-039 | architecture | MEDIUM      | CORRECTED  | Betweenness centrality structurally analogous (not clinically identical) to bridge centrality |
| C-040 | architecture | MEDIUM      | CONFIRMED  | MAGMA 4-graph decomposition -- defer to v3+                                                   |
| C-041 | migration    | HIGH        | CONFIRMED  | 18 SourceNodes + 167 KnowledgeNodes + 167+ edges in single transaction                        |
| C-042 | migration    | HIGH        | CONFIRMED  | 9 of 13 slugs non-derivable -- source-slug-map.json required                                  |
| C-043 | migration    | HIGH        | CONFIRMED  | Migration follows intake-manual.js pattern, helpers exist                                     |
| C-044 | migration    | HIGH        | CONFIRMED  | 3 analysis.json schema variants + AWS variant, ~50 lines normalization                        |
| C-045 | migration    | HIGH        | CONFIRMED  | 7 post-migration validation queries, rollback = delete .db + re-run                           |
| C-046 | migration    | HIGH        | CONFIRMED  | ALSO_SEEN_IN deferred -- requires semantic comparison                                         |
| C-047 | operations   | HIGH        | CONFIRMED  | Content-hash (SHA-256/XXH3) for incremental sync, not mtime                                   |
| C-048 | operations   | HIGH        | CONFIRMED  | .research/\*.db files not in .gitignore -- add before implementation                          |
| C-049 | operations   | HIGH        | CONFIRMED  | PRAGMA WAL + NORMAL sync + foreign_keys + temp_store MEMORY                                   |
| C-050 | operations   | HIGH        | CORRECTED  | Dedup threshold start 0.7 (iText2KG default, not 0.78) + mandatory calibration                |
| C-051 | operations   | MEDIUM      | CONFIRMED  | iText2KG 0.6 name + 0.4 label prevents homonym false merges                                   |
| C-052 | operations   | MEDIUM      | CONFIRMED  | Merge: >=0.90 physical, 0.65-0.90 SAME_AS edge, <0.65 no action                               |
| C-053 | operations   | MEDIUM      | CONFIRMED  | Checkpoint every 15 absorbs, ~every 1-2 days at T28 pace                                      |
| C-054 | operations   | MEDIUM      | CONFIRMED  | Node split: >=3 edge clusters AND >=8 observations -- human decision                          |
| C-055 | operations   | MEDIUM      | CONFIRMED  | Staleness: confidence<0.3 AND last_seen>180d AND no sources                                   |
| C-056 | operations   | MEDIUM      | CONFIRMED  | Orphan >5% triggers cleanup, freelist>20% triggers VACUUM                                     |
| C-057 | operations   | MEDIUM      | CONFIRMED  | Subgraph triples 90% token reduction (Zep 115K to 1.6K)                                       |
| C-058 | operations   | HIGH        | CONFIRMED  | Pure SQL cannot detect semantic contradiction                                                 |
| C-059 | architecture | HIGH        | CONFIRMED  | MCP layer stateless -- tools call t28-core library                                            |
| C-060 | architecture | HIGH        | CONFIRMED  | LLM proposes, deterministic executor applies -- never direct SQLite write                     |
| C-061 | architecture | MEDIUM      | CONFIRMED  | A-MEM retrieve-then-judge bidirectional update pattern                                        |
| C-062 | architecture | MEDIUM      | CONFIRMED  | Chunk at semantic boundaries, not byte count                                                  |
| C-063 | risk         | HIGH        | CONFIRMED  | Graphiti/Zep over-engineered for T28 v1 -- skip                                               |
| C-064 | risk         | HIGH        | CONFIRMED  | LadybugDB 3-way fork split + frozen upstream = HIGH risk                                      |
| C-065 | risk         | MEDIUM      | CONFIRMED  | sqlite-vec v0.1.9 pre-v1, solo maintainer -- defer to v2                                      |
| C-066 | risk         | HIGH        | CONFIRMED  | BasicMemory AGPL v3 -- patterns safe, code not copyable for network use                       |
| C-067 | risk         | HIGH        | CONFIRMED  | SQLite no bus factor; LadybugDB HIGH bus factor                                               |
| C-068 | schema       | HIGH        | CONFIRMED  | Graphiti confidence/fact_rating NOT in open-source graphiti-core                              |
| C-069 | backend      | MEDIUM      | CONFIRMED  | DuckDB + sqlite_scanner 30-50x faster aggregations read-only                                  |
| C-070 | architecture | HIGH        | CONFIRMED  | Dendron anti-pattern -- build graph as subsystem serving specific workflows                   |
| C-071 | schema       | HIGH        | ADDED v1.1 | Include 384d embedding column with NULLs in v1 DDL; populate in v2                            |
| C-072 | architecture | HIGH        | ADDED v1.1 | Agent-inferred edges canonical home = .research/graph-edges.jsonl (git-tracked)               |
| C-073 | architecture | HIGH        | ADDED v1.1 | 30-session query pattern audit required before schema finalization (OQ-17)                    |

---

## Changelog

| Version | Date       | Changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2026-04-07 | Initial synthesis — 32 searchers + 4 synthesizers, 70 claims, 55 sources                                                                                                                                                                                                                                                                                                                                                                                                    |
| 1.1     | 2026-04-07 | Post-challenge: 8 corrections from contrarian, 1 from OTB-1 (LadybugDB HIGH risk), 1 from OTB-2 (query audit CRITICAL). C-003 scale figure corrected; C-008 `lbug` package; C-012 last commit Nov 2025; C-019 A-MEM fields corrected; C-030 @huggingface/transformers; C-037 ~246 dependents; C-039 "structurally analogous"; C-050 threshold 0.7 + calibration. Hybrid boundary explicit. Schema embedding column resolved. Challenges section added. OQ-16 + OQ-17 added. |
