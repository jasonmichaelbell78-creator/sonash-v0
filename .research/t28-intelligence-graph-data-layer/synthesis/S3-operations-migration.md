# S3: Operations & Migration Synthesis

# T28 Intelligence Graph — File-Graph Coexistence, Migration, and Solo-Dev Operations

**Synthesizer:** S3 (8 findings files) **Date:** 2026-04-07 **Sub-Questions
Covered:** D7, D9, D10-1, D10-2, D13-1, D13-2, D13-3, D15-2 **Source Material:**
168 extraction entries, 27 repo analyses, 5 website analyses

---

## 1. Executive Summary

The T28 intelligence graph is a derived index over an existing, fully-formed
file corpus — not a new data store. All 7+ independent production systems
studied (BasicMemory, Palinode, LightRAG, Obsidian, IWE, obra/knowledge-graph,
sqlite-memory) converge on the identical architectural verdict: files are
canonical, graphs are computed. This consensus is not a design preference — it
is a hard operational constraint. The graph layer can fail, be deleted, or be
corrupted without any data loss, because `t28 rebuild-graph` reconstructs it
entirely from `.research/` files in under one second at T28's scale.

Migration of the existing corpus is near-zero friction. The 168
extraction-journal entries and 27 analysis.json files map almost directly to
graph nodes with straightforward normalization. The single non-trivial migration
challenge is slug resolution: 9 of 13 repository slugs cannot be derived
algorithmically from their `source` field and require a manually constructed
`source-slug-map.json` lookup table. This is a one-time pre-migration artifact
that must be authored before the migration script can run. All other schema
normalization is mechanical (key renames, date format unification,
absencePattern polymorphism) and fits in approximately 50 lines of code.

The operational design for a solo developer on Windows prioritizes a complexity
budget of 4-5 new concepts for v1. The recommended stack — SQLite + FTS5 +
graphology — introduces graph theory, FTS5/BM25 text search, and in-memory graph
algorithms, stays entirely within budget, requires no Docker, no native
compilation, and no external services. Vectors and hybrid search are a
deliberate v2 addition, gated on FTS5 proving insufficient for real queries.
Seven synthesis operations (comparison, pattern detection, gap identification,
contradiction surfacing, lineage tracing, clustering, and subgraph serialization
for Claude) are all achievable with SQLite CTEs plus optional graphology for
community detection. The 15-entry checkpoint cycle, drawn from farzaa's personal
wiki gist, provides the ongoing maintenance rhythm: dedup, split/enrich review,
garbage collection, and VACUUM — at T28's pace of ~10 sources per day, this
fires approximately every 1-2 days.

---

## 2. File-Graph Coexistence Design

### 2.1 The Cardinal Rule: Files First

The single most critical design rule, confirmed by 7 independent production
systems with no contradicting evidence:

**Write to files first. Index into graph second. Never reverse this.**

- BasicMemory: `write_note` → file → SyncService → SQLite
- Palinode: "If every service crashes, `cat` still works."
- IWE: "All modifications through direct Markdown editing, eliminating
  dual-write complexity."
- Logseq DB version (counterexample): abandoned markdown for SQLite, then
  reverted after community rejection.

For T28, this means:

- Agent writes findings to `findings.jsonl`, `analysis.json`, or
  `value-map.json`
- `t28 absorb <path>` indexes into graph
- If absorb fails, the file survives; the next incremental sync re-processes it

### 2.2 Three-Tier Compaction Resilience Model

| Tier             | Contents                                  | Recovery Tool         |
| ---------------- | ----------------------------------------- | --------------------- |
| T1 — Filesystem  | All content, findings, metadata           | `cat`, Read tool      |
| T2 — Git history | All versions, diffs, audit trail          | `git log`, `git diff` |
| T3 — Graph index | Derived relationships, query acceleration | `t28 rebuild-graph`   |

If T3 fails: T1+T2 are intact. Rebuild restores T3 from T1. Zero data loss. This
is the safety guarantee that makes the graph layer appropriate for a solo
developer — no backup strategy needed, no separate persistence concern.

**Provenance requirement:** Every graph node must trace to a file artifact via
an EXTRACTED_FROM edge. No graph-only data that cannot be reconstructed from
files.

### 2.3 Rebuild Strategy

Standard rebuild pattern from industry:

```
delete/truncate DB → scan source files → reconstruct
```

| Operation        | Command                     | Behavior                                 |
| ---------------- | --------------------------- | ---------------------------------------- |
| Full rebuild     | `t28 rebuild-graph --force` | Delete DB, re-scan all files             |
| Incremental sync | `t28 sync`                  | Hash-compare, process changed files only |
| Session-start    | `t28 sync` (fast path)      | Near-zero cost if files unchanged        |

**Timing (extrapolated from codebase-memory-mcp benchmarks):**

- 49K nodes, 196K edges → ~6 seconds
- T28 at ~500 nodes → well under 1 second
- Full rebuild is fast enough to run on every session start

Rebuild must be idempotent. The `ON CONFLICT(path) DO UPDATE WHERE hash changed`
pattern gives this for free.

### 2.4 Incremental Indexing: Content-Hash Pattern

Industry standard: content-hash comparison (SHA-256 or XXH3), not mtime.

Two-phase sync pattern (from sqlite-memory):

1. Cleanup: remove DB entries for deleted/moved files
2. Scan: new (ingest), modified/hash mismatch (atomic replace), unchanged/hash
   match (skip)

All operations inside SAVEPOINT transactions — crash leaves DB consistent with
pre-sync state.

Store `content_hash` + `indexed_at` per SourceNode. On session start, scan
`.research/`, compare hashes, process only changed files. At T28's file count,
hash comparison of unchanged files costs microseconds.

### 2.5 Git Patterns

Add to `.gitignore` when T28 is implemented (T0 action — currently absent from
project):

```gitignore
# T28 graph database (derived, regenerable)
.research/*.db
.research/*.db-wal
.research/*.db-shm
```

WAL/SHM files auto-clean on graceful close (`sqlite3_close()`). On crash, WAL
persists safely and is incorporated on next open. Do not delete WAL files
manually on Windows — OS-level file locks may still be held.

### 2.6 PRAGMA Configuration

Set on every connection open (not persisted in DB):

```sql
PRAGMA journal_mode = WAL;       -- Concurrent reads during write
PRAGMA synchronous = NORMAL;     -- Crash-safe, faster than FULL
PRAGMA foreign_keys = ON;        -- Enforce referential integrity (must set after every open)
PRAGMA temp_store = MEMORY;      -- In-memory temp tables
```

Do NOT use `synchronous = OFF` (data loss on crash) or skip `foreign_keys = ON`
(FK violations silently accepted).

---

## 3. Migration Plan

### Overview

The migration is a one-time bootstrap from existing `.research/` files into an
empty SQLite database. Total scope: 18 SourceNodes, 167 KnowledgeNodes, 167+
edges. At T28 scale, the entire migration runs inside a single transaction in
under one second.

### Pre-Migration Prerequisite: source-slug-map.json

**This must be authored before the migration script can run.** 9 of 13
repository slugs are non-derivable from the `source` field in
`extraction-journal.jsonl`. Simple `toLowerCase().replace('/', '-')` fails for
the majority of cases.

Known irregular mappings:

| extraction-journal `source`                    | Filesystem slug                             |
| ---------------------------------------------- | ------------------------------------------- |
| teng-lin/notebooklm-py                         | teng-lin_notebooklm-py (underscore)         |
| aws-solutions-library-samples/guidance-for-... | aws-media-extraction (completely different) |
| iawia002/lux                                   | lux-video-downloader (renamed)              |
| HKUDS/CLI-Anything                             | hkuds-cli-anything                          |
| ... (9 total)                                  | ...                                         |

The lookup table format:

```json
{
  "owner/repo-name": "filesystem-slug",
  ...
}
```

All 18 sources have been verified to have corresponding `analysis.json` files on
the filesystem.

### Phase 1: SourceNodes (18 nodes)

**Input:** `analysis.json` files (11+ repo analyses + 5 website analyses) + slug
resolution from `source-slug-map.json`

**Schema normalization required (6 differences, ~50 lines total):**

| Field          | Gen A (v4.0-4.2)      | Gen B (v4.3)            | Website (v1.0)          | Normalized to                     |
| -------------- | --------------------- | ----------------------- | ----------------------- | --------------------------------- |
| Date field     | `date` (YYYY-MM-DD)   | `analyzedAt` (ISO 8601) | `meta.analyzed_at`      | `ingested_at` (ISO 8601)          |
| Schema version | absent                | `schemaVersion: "4.3"`  | `schema_version: "1.0"` | `source_schema_version` attribute |
| Name field     | `repo`                | `repo`                  | `site.title`            | `name`                            |
| URL field      | `url`                 | `url`                   | `meta.url`              | `url`                             |
| Scan depth     | `scanDepth`           | `depth`                 | `meta.depth`            | `scan_depth`                      |
| absencePattern | `{type, description}` | string                  | absent                  | stringify object form             |

**T28-era extensions (Gen B only):** `context.cluster` (A-F) →
`attributes.cluster`, `context.t28Relevance` → `attributes.t28_relevance`,
`context.notablePatterns[]` → `attributes.notable_patterns`.

**Website-specific fields preserved in `attributes`:** `value_axes{}`,
`key_claims[]`, `ecosystem_tags[]`, `tech_stack[]`.

**AWS variant:** Has additional `meta{}` wrapper and `repo{}` sub-object.
Flatten before processing.

**Validation target:** 18 SourceNodes, 0 orphans, all have `url` and `name`.

### Phase 2: KnowledgeNodes (167 nodes from extraction journal + stubs from value-maps + findings.jsonl)

**Input A — extraction-journal.jsonl (167 nodes):**

| Journal Field   | KnowledgeNode Property | Notes                                                       |
| --------------- | ---------------------- | ----------------------------------------------------------- |
| `candidate`     | `name`                 | Direct                                                      |
| `type`          | `labels[]`             | Normalize (see type table below)                            |
| `notes`         | `summary`              | Direct                                                      |
| `novelty`       | `attributes.novelty`   | high/medium/low                                             |
| `effort`        | `attributes.effort`    | E0/E1/E2/E3                                                 |
| `relevance`     | `attributes.relevance` | high/medium/low                                             |
| `decision`      | `status`               | Map: defer→pending, extract→active, investigate→investigate |
| `decision_date` | `ingested_at`          | Direct                                                      |
| `source`        | FK → SourceNode        | Via source-slug-map.json                                    |

Skip the 1 entry with `decision: "skip"`. Total: 167 KnowledgeNodes.

**Type normalization (9 journal types → graph labels):**

| Journal Type           | Graph Label(s)                 | Count |
| ---------------------- | ------------------------------ | ----- |
| pattern                | Pattern                        | 62    |
| anti-pattern           | AntiPattern                    | 28    |
| knowledge              | Fact                           | 29    |
| content                | Capability                     | 29    |
| design-principle       | Pattern, DesignPrinciple       | 6     |
| architecture-pattern   | Pattern, ArchitecturePattern   | 6     |
| workflow-pattern       | Pattern, WorkflowPattern       | 4     |
| tool                   | Capability, Tool               | 3     |
| implementation-pattern | Pattern, ImplementationPattern | 1     |

**Input B — value-map.json candidates (stubs):** Four candidate arrays per repo:
`patternCandidates`, `knowledgeCandidates`, `contentCandidates`,
`antiPatternCandidates`. Derive confidence from `novelty`: HIGH→0.9, MEDIUM→0.7,
LOW→0.5. Website value-maps have explicit `id` (K1, K2...) and explicit
`confidence` — use directly.

**Input C — findings.jsonl (150 entries across ~9 repos):** Map severity to
confidence: high→0.85, medium→0.70, low→0.50, info→0.60. These already have IDs
— preserve them as `external_id`.

**Validation target:** 167 journal KnowledgeNodes, count of value-map stubs,
count of findings nodes, all have `name` and `status`.

### Phase 3: Edges

**EXTRACTED_FROM (KnowledgeNode → SourceNode):**

- 167 edges from extraction-journal entries (one per non-skip entry)
- One per value-map candidate
- One per findings.jsonl entry
- This is the provenance chain — required for every KnowledgeNode

**RELATED_TO (SourceNode → SourceNode):**

- From `cross_repo_connections[]` in value-maps (only 3 repos have these)
- These are the only file-canonical inter-source edges

**SUPPORTED_BY (KnowledgeNode → KnowledgeNode):**

- From website value-map `finding_refs[]` back-references (richer schema)

**MEMBER_OF (SourceNode → ThemeNode):**

- From `context.cluster` (A-F) on T28-era repos
- Pre-seed 6 ThemeNode stubs before this phase
- Websites have NO cluster assignment

**ALSO_SEEN_IN (KnowledgeNode → KnowledgeNode):**

- Deferred to post-migration graph operations
- Not in migration script — requires semantic comparison across sources
- Cross-source dedup is a graph operation, not a migration step

**Validation target:** 167 EXTRACTED_FROM edges from journal entries, 0
KnowledgeNodes without EXTRACTED_FROM, 0 broken foreign keys.

### Phase 4: Validation

Run 7 queries post-migration:

| Query                                                 | Expected                                                       |
| ----------------------------------------------------- | -------------------------------------------------------------- |
| V1: Node count by type                                | 18 SourceNodes, 167+ KnowledgeNodes, 6 ThemeNodes              |
| V2: Edge count by relation                            | 167+ EXTRACTED_FROM, N RELATED_TO, N SUPPORTED_BY, N MEMBER_OF |
| V3: Orphaned KnowledgeNodes (no EXTRACTED_FROM)       | 0                                                              |
| V4: Orphaned SourceNodes (no edges of any type)       | 0                                                              |
| V5: EXTRACTED_FROM count matches journal (minus skip) | 167                                                            |
| V6: `PRAGMA integrity_check()`                        | 'ok'                                                           |
| V7: `PRAGMA foreign_key_check()`                      | 0 rows                                                         |

Rollback = delete `.db` file + re-run migrate.js. No WAL checkpoint or
incremental rollback needed.

---

## 4. Migration Script Architecture

Location: `scripts/t28/migrate.js`, following the
`scripts/debt/intake-manual.js` pattern.

The project already has all required helpers: `generate-content-hash.js`,
`normalize-file-path.js`, `sanitize-error.js`. No new utility code needed.

```
scripts/t28/
├── migrate.js          # Entry: parse args, open DB, run phases, validate
├── phases/
│   ├── 01-schema.js    # CREATE TABLE IF NOT EXISTS (idempotent)
│   ├── 02-sources.js   # analysis.json → SourceNodes (handles Gen A/B/Website/AWS)
│   ├── 03-knowledge.js # extraction-journal + value-map + findings → KnowledgeNodes
│   └── 04-edges.js     # EXTRACTED_FROM, RELATED_TO, SUPPORTED_BY, MEMBER_OF
└── validate.js         # V1-V7 queries
```

**CLI flags:**

| Flag              | Behavior                                    |
| ----------------- | ------------------------------------------- |
| `--dry-run`       | Parse and validate input, no DB writes      |
| `--force`         | Delete DB + full rebuild                    |
| `--verify-only`   | Run V1-V7 queries on existing DB, no writes |
| `--source <slug>` | Migrate only one source (incremental)       |
| `--verbose`       | Log each node/edge as written               |

**Execution model:**

```javascript
const migrate = db.transaction(() => {
  runPhase("01-schema");
  runPhase("02-sources");
  runPhase("03-knowledge");
  runPhase("04-edges");
});

migrate(); // atomic: auto-rollback on exception
validate(); // runs outside transaction, reads only
```

**Error handling:**

- Wrap ALL file reads in try/catch (existsSync race condition — project rule)
- Use `sanitizeError()` from `scripts/lib/sanitize-error.js` — never log raw
  `error.message`
- On missing analysis.json: create stub SourceNode (don't abort)
- On unresolvable slug: hard failure with clear error message listing the
  offending entry

---

## 5. Synthesis Operations Catalog

All 7 operations confirmed achievable with SQLite CTEs + optional graphology. No
Neo4j required.

### Operation 1: Comparison (What do two sources share?)

**Mechanism:** Shared-neighbor Jaccard (two CTEs: neighbors of each node,
INTERSECT for shared) + tag intersection.

```sql
-- Jaccard similarity between two nodes
WITH neighbors_a AS (SELECT target_id node FROM edges WHERE source_id = :a
                     UNION SELECT source_id FROM edges WHERE target_id = :a),
     neighbors_b AS (SELECT target_id node FROM edges WHERE source_id = :b
                     UNION SELECT source_id FROM edges WHERE target_id = :b),
     shared AS (SELECT node FROM neighbors_a INTERSECT SELECT node FROM neighbors_b),
     total AS (SELECT node FROM neighbors_a UNION SELECT node FROM neighbors_b)
SELECT COUNT(*) * 1.0 / (SELECT COUNT(*) FROM total) AS jaccard FROM shared;
```

**Verdict:** Verbose but correct in SQLite. Adequate for T28's 100-1,000 node
scale.

### Operation 2: Pattern Detection (What patterns recur across a tag group?)

**Mechanism:** Subgraph extraction by tag (JOIN node_tags + edges) → commonality
analysis (GROUP BY relation type, ORDER BY frequency).

Steps:

1. Extract all edges among nodes sharing a tag
2. Group by relation type within that subgraph
3. For community detection within the group: export edges → graphology Louvain →
   write community assignments back

**Verdict:** SQL handles steps 1-2. graphology required for step 3 (community
detection not possible natively in SQLite).

### Operation 3: Gap Identification (What's missing?)

**Mechanism:** Three SQL-queryable metrics + LLM for expected-but-missing.

```sql
-- Orphan/near-orphan nodes
SELECT n.id, n.name, COUNT(e.id) AS degree
FROM nodes n LEFT JOIN edges e ON e.source_id = n.id OR e.target_id = n.id
GROUP BY n.id HAVING degree <= 2;

-- Sparse tag clusters
SELECT tag, COUNT(DISTINCT n.id) AS node_count,
       COUNT(DISTINCT e.id) AS edge_count,
       COUNT(DISTINCT e.id) * 1.0 / COUNT(DISTINCT n.id) AS density
FROM node_tags nt JOIN nodes n ON n.id = nt.node_id
LEFT JOIN edges e ON e.source_id = n.id OR e.target_id = n.id
GROUP BY tag ORDER BY density ASC;
```

For expected-but-missing connections: two nodes sharing tags but no edge → LLM
judgment (InfraNodus "supply vs demand graph" framing).

**Verdict:** MEDIUM confidence — third metric requires LLM. First two are
reliable SQL.

### Operation 4: Contradiction Surfacing (What conflicts exist?)

**Three tiers (in order of cost):**

| Tier | Mechanism                                            | Cost                     |
| ---- | ---------------------------------------------------- | ------------------------ |
| T1   | Query explicit CONTRADICTS edges                     | Instant (SQL)            |
| T2   | sqlite-vec cosine similarity → LLM judges opposition | Low (vectors required)   |
| T3   | 2-hop subgraph serialization → Claude prompt         | Medium (Claude API call) |

**Tier 3 pattern (Anthropic cookbook):**

1. Extract 2-hop neighborhood of claim in question
2. Serialize as triples: `(node-a) --[relation]--> (node-b)`
3. Prompt: "Identify contradictions in this knowledge graph. Cite specific
   edges."

**Important limitation:** Pure SQL cannot detect semantic contradiction. Formal
ontological rules or LLM reasoning is required. Tier 1 is a forward-looking
design — CONTRADICTS edges must be explicitly created during absorb; they do not
emerge from the data automatically.

**Verdict:** MEDIUM confidence on implementation design. Tier 1 depends on
absorb pipeline detecting contradictions at ingest time.

### Operation 5: Lineage Tracing (Where did this come from?)

**Mechanism:** Recursive CTE ancestor traversal following EXTRACTED_FROM and
DERIVED_FROM edges.

```sql
WITH RECURSIVE lineage(id, name, path, depth) AS (
  SELECT id, name, CAST(id AS TEXT), 0 FROM nodes WHERE id = :start
  UNION ALL
  SELECT n.id, n.name, l.path || ' -> ' || n.id, l.depth + 1
  FROM lineage l
  JOIN edges e ON e.source_id = l.id
  JOIN nodes n ON n.id = e.target_id
  WHERE e.relation = 'EXTRACTED_FROM' AND l.depth < 10
)
SELECT * FROM lineage ORDER BY depth;
```

Path string accumulation prevents cycles. Clean and fast in SQLite.

**Verdict:** HIGH confidence. SQLite recursive CTEs handle this natively. Every
KnowledgeNode's provenance chain terminates at a SourceNode (file artifact).

### Operation 6: Clustering / Community Detection

**Mechanism:** Hybrid SQLite + graphology.

- Connected components: pure recursive CTE (topological)
- Modularity-optimized communities (Louvain): export edges → graphology → write
  back

```javascript
// Export edges to graphology
const g = new Graph();
edges.forEach((e) => g.addEdge(e.source_id, e.target_id));

// Run Louvain
const communities = louvain(g);

// Write community assignments back to SQLite
const updateCommunity = db.prepare(
  "UPDATE nodes SET community_id = ? WHERE id = ?"
);
Object.entries(communities).forEach(([nodeId, communityId]) => {
  updateCommunity.run(communityId, nodeId);
});
```

Louvain vs Leiden: difference matters at scale (>10K nodes), not at T28's
100-1,000 nodes. Use Louvain for v1.

**Verdict:** MEDIUM confidence. graphology dependency confirmed available.
Community detection drift is a known issue — periodic full recompute safer than
incremental.

### Operation 7: Subgraph Serialization for Claude

**This is the primary synthesis delivery mechanism.** Not a query pattern — a
delivery pattern.

**90% token reduction confirmed** (Zep benchmark: 115K → 1.6K context tokens).

Protocol:

1. User asks synthesis question
2. T28 executes 2-hop neighborhood expansion (SQLite CTE)
3. Serialize subgraph as triples: `(node-a) --[relation]--> (node-b)`
4. Prompt Claude with triples + question: "Answer using ONLY the knowledge
   graph. Cite SPECIFIC EDGES."
5. Claude answers with edge citations — prevents hallucination, keeps answers
   traceable

```sql
-- 2-hop neighborhood expansion
WITH RECURSIVE neighborhood(id, depth) AS (
  SELECT :center_id, 0
  UNION ALL
  SELECT CASE WHEN e.source_id = n.id THEN e.target_id ELSE e.source_id END, n.depth + 1
  FROM neighborhood n
  JOIN edges e ON e.source_id = n.id OR e.target_id = n.id
  WHERE n.depth < 2
)
SELECT DISTINCT n.name, e.relation, n2.name
FROM neighborhood nh
JOIN nodes n ON n.id = nh.id
JOIN edges e ON e.source_id = nh.id
JOIN nodes n2 ON n2.id = e.target_id;
```

Triple format output:

```
(graphology) --[EXTRACTED_FROM]--> (obra-knowledge-graph)
(obra-knowledge-graph) --[MEMBER_OF]--> (cluster-C-tooling)
(graphology) --[ALSO_SEEN_IN]--> (karpathy-gist)
```

---

## 6. Knowledge Maintenance

### 6.1 Three-Tier Deduplication Pipeline

Applied at absorb time (Stages 1-2) and deferred to checkpoint cycle (Stage 3).

| Stage                     | Mechanism                                         | Threshold        | Cost             | Timing        |
| ------------------------- | ------------------------------------------------- | ---------------- | ---------------- | ------------- |
| 1. Exact/normalized       | Lowercase, strip punctuation, collapse whitespace | Exact match      | Near-zero        | At absorb     |
| 2. FTS + embedding cosine | iText2KG weighted: 0.6 name + 0.4 label           | 0.78 (calibrate) | Low              | At absorb     |
| 3. LLM resolver           | Ambiguous pairs (0.65-0.78 cosine band)           | Human-in-loop    | ~0-3 calls/cycle | At checkpoint |

**iText2KG weighted embedding (adopt this):** 0.6 name weight + 0.4 label weight
prevents homonym false merges ("Python" language vs "Python" snake). Single
embedding without weighting produces false positives at Stage 2.

**Cosine threshold calibration:** Start at 0.78. Industry range is 0.70-0.85.
Precise value is domain-dependent. At T28 scale, miscalibration is low cost —
easy to adjust.

### 6.2 Merge Strategy

| Confidence | Strategy       | Outcome                                                       |
| ---------- | -------------- | ------------------------------------------------------------- |
| >= 0.90    | Physical merge | Single node, all edges redirected, duplicate deleted          |
| 0.65-0.90  | SAME_AS edge   | Both nodes preserved, linked, deferred for `/reorganize` pass |
| < 0.65     | No action      | Separate nodes, no link                                       |

On physical merge: surviving node inherits max confidence of both. Duplicate
edges (same source+relation+target) deduplicated to one.

### 6.3 Edge Pruning: Temporal Invalidation

**Never delete edges.** Mark invalid with timestamp (Graphiti/Zep pattern).

Invalidation triggers:

- Contradiction: newer edge invalidates older
- Explicit retraction from source
- Confidence below floor

T28 staleness threshold: `confidence < 0.3` AND `last_seen > 180 days` AND no
corroborating sources → set `invalid_at = NOW()`. More conservative than A-MEM's
alleged 90-day threshold, which is unverified and should not be hardcoded.

OpenCTI edge dedup tolerance: edges of same type between same entities within
±30 days merge rather than creating duplicate temporal edges.

### 6.4 Node Splitting (Anti-Cramming)

**Trigger:** Node has >= 3 distinct edge-type clusters AND >= 8 total
observations.

Detection query:

```sql
SELECT n.id, n.name, COUNT(DISTINCT e.relation) AS edge_types,
       n.observation_count
FROM nodes n
JOIN edges e ON e.source_id = n.id
WHERE n.observation_count > 8
GROUP BY n.id
HAVING COUNT(DISTINCT e.relation) >= 3;
```

**Do not auto-split.** Present candidates to user for decision. Splitting is a
semantic operation requiring human judgment about which aspects belong in
separate nodes.

Node thresholds (farzaa's heuristic — no published validation): >= 3 edge-type
clusters + >= 8 observations. First-principles derivation, not empirically
validated. Treat as starting point.

### 6.5 Node Enrichment (Anti-Thinning)

**Trigger:** `incoming_edge_count >= 3` AND `observation_count < 4` = "thin but
referenced."

Enrichment options (in order of risk):

1. **Passive:** Wait for next absorb touching connected nodes
2. **Source pull:** Query source archive for unlinked mentions
3. **Active LLM synthesis:** From adjacent nodes. Mark `is_synthesized: true`,
   `confidence: 0.5`. Superseded by any source-backed observation.

Risk: LLM enrichment can hallucinate. Never surface synthesized observations
without explicit flag. Source-backed observations always take precedence.

### 6.6 Checkpoint Cycle (farzaa's 15-entry pattern)

**Trigger:** After every 15 absorbs OR manually via `/graph-checkpoint`. **At
T28's pace (~10 sources/day):** Fires every 1-2 days.

Checkpoint steps:

1. Rebuild node/edge index metadata (`indexed_at`, `edge_count` caches)
2. Recalculate `incoming_edge_count` for all nodes
3. **Cramming audit:** If zero new nodes in last 15 absorbs → flag. New info
   being collapsed into existing nodes rather than creating new ones.
4. **Quality audit:** Re-read 3 most-updated nodes for coherence
5. **Split check:** Run split detection query, present candidates
6. **Stage 3 dedup:** Resolve ambiguous pairs flagged during absorb
7. **Structural review:** Assess cluster density and connectivity

### 6.7 Graph Garbage Collection

**Orphan detection:**

```sql
SELECT n.id FROM nodes n
WHERE NOT EXISTS (SELECT 1 FROM edges e WHERE e.source_id = n.id OR e.target_id = n.id)
AND n.is_stub = 0;
```

**Threshold:** `orphan_count > 5%` of total nodes → trigger cleanup.

**After batch deletions:** If `freelist_count > 20%` of pages, run
`PRAGMA wal_checkpoint(TRUNCATE)` then `VACUUM`. VACUUM creates a copy of the
entire DB — run during off-hours or explicitly, not automatically.

### 6.8 Confidence Tracking Model

Simple formula (avoids Bayesian complexity):
`confidence = min(1.0, source_quality_sum / 5.0)`.

- Seen once with quality 0.8 → confidence 0.16
- Seen five times with quality 0.8 → confidence 0.8 (ceiling at 1.0)

Store `observation_count` + `source_quality_sum` per node. During merge: inherit
max confidence of both nodes (OpenCTI "converge towards highest confidence").

---

## 7. Solo-Developer Operational Guide

### 7.1 Technology Stack Decision

**V1 (ship this):** SQLite + FTS5 + graphology

| Component      | Role                                              | New Concepts Introduced |
| -------------- | ------------------------------------------------- | ----------------------- |
| SQLite         | Node/edge store, FTS5 search, relational queries  | FTS5/BM25 text search   |
| graphology     | In-memory graph for Louvain, traversal algorithms | Graph theory basics     |
| better-sqlite3 | Node.js synchronous SQLite driver                 | (already in use)        |

Total new concepts introduced: ~3 (graph theory, FTS5, BM25). Within complexity
budget.

**V2 (when FTS5 insufficient):** + sqlite-vec + MiniLM embeddings + RRF hybrid
scoring

**V3 (if graph traversal bottlenecks):** Evaluate LadybugDB once fork
consolidation is clearer. Currently 3 competing forks (LadybugDB community,
Vela-Engineering multi-writer, Bighorn/Kineviz). Energy split — premature to
adopt.

### 7.2 Complexity Budget

Do not exceed 4-5 new concepts for v1. The budget prevents cognitive overload
that leads to abandoned projects.

| Stack Option                      | New Concepts | Budget Verdict           |
| --------------------------------- | ------------ | ------------------------ |
| SQLite + graphology (recommended) | ~3           | Within budget            |
| + sqlite-vec + RRF                | ~8           | At ceiling — defer to v2 |
| LadybugDB + graphology            | ~4-5         | At ceiling — fork risk   |
| Graphiti + Neo4j                  | ~10+         | Exceeds budget — never   |

### 7.3 Licenses

| Component                    | License           | Risk                                      |
| ---------------------------- | ----------------- | ----------------------------------------- |
| SQLite                       | Public domain     | None                                      |
| better-sqlite3               | MIT               | None                                      |
| graphology                   | MIT               | None                                      |
| BasicMemory (pattern source) | AGPL v3           | Safe for local use; blocks productization |
| All other reference repos    | MIT or Apache 2.0 | None                                      |

Adopt BasicMemory's architecture patterns. Do not copy code. AGPL triggers
source-disclosure only when network-serving modified code — local CLI/MCP use is
safe.

### 7.4 Windows-Specific Operational Risks

| Risk                              | Severity | Mitigation                                                      |
| --------------------------------- | -------- | --------------------------------------------------------------- |
| WAL file locks beyond close()     | Low      | Don't move/delete WAL files manually; use `sqlite3_close()`     |
| sqlite-vec .dll loading           | Low      | Prebuilt package ~1 year old; verify before v2                  |
| node-gyp NODE_MODULE_VERSION      | Low      | Document Node.js version requirement; test on upgrade           |
| FSEvents vs ReadDirectoryChangesW | Low      | Watch mode not needed for v1 (session-start sync is sufficient) |

Watch mode (realtime file sync) is not required for v1. Session-start
incremental sync is sufficient at T28's pace.

### 7.5 MVP Path (Ordered by Value Delivered)

1. **`scripts/t28/migrate.js`** — bootstrap existing corpus into SQLite. First
   working graph.
2. **`t28 sync`** — incremental absorb of new analyses. Daily operational loop.
3. **`t28 rebuild-graph`** — idempotent full rebuild. Compaction resilience.
4. **`t28 query`** — FTS5 search + subgraph serialization for Claude. First
   synthesis value.
5. **`/graph-checkpoint`** — 15-entry maintenance cycle. Ongoing graph health.
6. **`t28 absorb`** — structured ingest with dedup stages 1-2. Clean graph over
   time.

### 7.6 Failure Recovery Guide

**If graph is corrupted:**

1. Delete `.research/*.db` + `.research/*.db-wal` + `.research/*.db-shm`
2. Run `scripts/t28/migrate.js --force`
3. Duration: under 1 second

**If migrate.js fails mid-run:**

- Single transaction auto-rolls back
- DB is empty or unchanged (no partial state)
- Fix root cause (usually slug resolution or missing analysis.json)
- Re-run

**If a new absorb breaks graph consistency:**

- PRAGMA foreign_key_check will catch FK violations
- Delete new node/edge insertions (transaction rollback handles this)
- File that caused the issue is unchanged and still readable

**If T28 project is abandoned:**

- Preserved: all `.research/` files (standard JSON/JSONL, readable by any tool),
  SQLite data (queryable with any SQLite client)
- Lost: graph query patterns, migration tooling, community detection assignments
- Data loss: zero. SQLite is a standard format, not a proprietary store.

### 7.7 n-r-w/knowledgegraph-mcp: Do Not Adopt

Direct quote from creator: "nearly impossible to control...always have to
manually clean up." Creator has publicly pivoted. 20 stars, last commit
December 2024. Highest abandonment risk in candidate set. Adopt BasicMemory's
rebuild pattern instead.

---

## 8. Open Questions

The following questions remain unresolved after all 8 findings files:

| #     | Question                                                                                                                                                                 | Impact                                  | Status                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------- |
| OQ-1  | Website analysis.json schema (v1.0) — exact field list not directly verified against filesystem                                                                          | Phase 1 migration accuracy              | Low risk; schema observed in multiple analyses, but no schema definition file found |
| OQ-2  | A-MEM 90-day/0.3-weight thresholds — cited in Q&A context but not verified in paper                                                                                      | Edge pruning staleness threshold        | Do not hardcode; use 180-day conservative value                                     |
| OQ-3  | SQLite-native Louvain — does any production implementation exist?                                                                                                        | Eliminates graphology dependency for v1 | No implementation found; graphology required                                        |
| OQ-4  | CONTRADICTS edge creation — where in the absorb pipeline does contradiction detection happen?                                                                            | Operation 4 tier 1 usability            | Undefined — design inference, not proven pattern                                    |
| OQ-5  | Checkpoint "entry" unit — what exactly counts as an entry for the 15-entry cycle?                                                                                        | Checkpoint frequency calibration        | Undefined; proposal: one absorb call = one entry                                    |
| OQ-6  | On-demand CONTRADICTS edge pattern — no production system found implementing this explicitly                                                                             | Contradiction surfacing reliability     | Tier 2 (vectors) and Tier 3 (LLM subgraph) are more reliable                        |
| OQ-7  | SQLite-graph extension (agentflare-ai) — Cypher-style queries over SQLite via virtual tables. Could eliminate verbose CTEs                                               | Developer ergonomics                    | Not yet evaluated; worth investigating before committing to CTE-heavy patterns      |
| OQ-8  | source-slug-map.json population — requires manual lookup of all 18 sources against filesystem                                                                            | Blocks migration                        | Pre-migration task; 9 irregular slugs identified, full mapping not yet authored     |
| OQ-9  | research-index.jsonl has two schema formats (repo vs deep-research) — migration handling undefined                                                                       | Phase 1 completeness                    | Low priority; research-index.jsonl is a session registry, not a source registry     |
| OQ-10 | `extracted_to` field population — T28's graph layer is where extraction decisions get executed; how does completing an extraction update both the journal and the graph? | Post-migration operational loop         | Undefined; likely: `t28 absorb` writes back to journal's `extracted_to` field       |

---

## Confidence Summary

| Finding                                        | Confidence | Supporting Files                        |
| ---------------------------------------------- | ---------- | --------------------------------------- |
| Files canonical, graph derived                 | HIGH       | D9 (7+ systems, no contradictions)      |
| Full rebuild under 1 second at T28 scale       | HIGH       | D9 (extrapolated from benchmarks)       |
| Content-hash dedup with SAVEPOINT atomicity    | HIGH       | D9, D13-3                               |
| Git patterns (.db in .gitignore)               | HIGH       | D9                                      |
| 9 of 13 slugs are non-derivable                | HIGH       | D13-1 (filesystem verified)             |
| Single transaction migration under 1 second    | HIGH       | D13-3                                   |
| 7 validation queries cover all integrity cases | HIGH       | D13-3                                   |
| PRAGMA configuration                           | HIGH       | D13-3                                   |
| Three-tier dedup funnel                        | HIGH       | D10-2                                   |
| Cosine threshold 0.78 (calibrate)              | MEDIUM     | D10-2 (range 0.70-0.85)                 |
| Node split thresholds (>=3 clusters, >=8 obs)  | MEDIUM     | D10-2 (no published validation)         |
| Subgraph serialization 90% token reduction     | HIGH       | D10-1 (Zep benchmark)                   |
| SQLite CTE adequacy at 2-3 hops                | HIGH       | D10-1                                   |
| Community detection requires graphology        | HIGH       | D10-1 (no SQLite-native found)          |
| 4-5 concept complexity budget                  | MEDIUM     | D15-2 (first-principles, not empirical) |
| V1 = SQLite + FTS5 + graphology                | HIGH       | D15-2 (multiple converging analyses)    |
| Website analysis schema (v1.0)                 | HIGH       | D13-2 (observed in multiple files)      |
| AWS analysis.json variant (third branch)       | HIGH       | D13-2 (filesystem verified)             |
| Contradiction detection requires LLM           | HIGH       | D10-1, D10-2                            |
| AGPL blocks productization                     | HIGH       | D15-2                                   |

---

_8 findings files synthesized: D7, D9, D10-1, D10-2, D13-1, D13-2, D13-3,
D15-2._ _Total findings deduplicated across files. Themes: file-graph
coexistence, migration, synthesis operations, knowledge maintenance, solo-dev
operations._ _Contradictions: none across files (strong consensus throughout).
Internal contradictions within individual files noted inline._
