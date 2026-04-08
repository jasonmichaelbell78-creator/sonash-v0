# Findings: Flat Tag Systems + Confidence Tracking Schema Design

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-07 **Sub-Question:** D6-3

---

## Summary

Simon Willison's March 2026 benchmark (100K rows, 100 tags, 6.5 tags/row): M2M
junction table wins single-tag (1.41ms) and OR queries; FTS5 wins AND queries
(2.59ms) and storage (7MB vs 8.6MB). JSON+json_each() is 40x slower — avoid.
Per-node confidence: separate `node_metadata` table recommended (confidence +
source_count + timestamps). 28 source types: single `source_nodes` table with
`source_type` discriminator + JSON body for type-specific fields. Compound
queries (tag + confidence) efficient via junction table narrowing then metadata
filter.

---

## Key Findings

### 1. Willison SQLite Tags Benchmark — Full Numbers [CONFIDENCE: HIGH]

100K rows, 100 unique tags, 6.5 tags/row average.

| Strategy        | Single Tag | AND (2 tags) | OR (2-5 tags) | Storage   |
| --------------- | ---------- | ------------ | ------------- | --------- |
| JSON + Lookup   | 1.37ms     | 1.88ms       | 11.02ms       | 19.9MB    |
| **M2M Tables**  | **1.41ms** | 2.26ms       | **10.69ms**   | 8.6MB     |
| FTS5            | 3.28ms     | **2.59ms**   | 13.54ms       | **7.0MB** |
| LIKE            | 19.45ms    | 19.41ms      | 57.94ms       | 7.1MB     |
| JSON (no index) | 54.98ms    | 54.63ms      | 84.24ms       | 8.9MB     |

**M2M wins** for single-tag and OR queries. **FTS5 wins** AND queries and
storage. JSON+json_each() is 40x slower — avoid entirely.

### 2. M2M Junction Table Schema for T28 [CONFIDENCE: HIGH]

```sql
-- Tag system (junction table)
CREATE TABLE tags (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
CREATE TABLE node_tags (
  node_id TEXT REFERENCES nodes(id) ON DELETE CASCADE,
  tag_id  INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (node_id, tag_id)
);
CREATE INDEX idx_node_tags_tag_id ON node_tags(tag_id);
CREATE INDEX idx_node_tags_node_id ON node_tags(node_id);
```

~1.4ms single-tag lookup, full relational integrity, cascading deletes.

### 3. Tag Search Patterns [CONFIDENCE: HIGH]

**Exact match:** JOIN through junction table → ~1.4ms **AND (both tags):**
Double-JOIN node_tags → ~2.3ms **OR (either tag):** WHERE t.name IN (...) +
DISTINCT → ~10.7ms **Prefix (autocomplete):** `WHERE name LIKE '#graph%'` on
tags table (sufficient for <500 unique tags) **Fuzzy:** Not natively supported
in FTS5. For user-controlled tag vocabulary with autocomplete, prefix LIKE is
the right tradeoff.

### 4. Per-Node Confidence Schema [CONFIDENCE: HIGH]

**Recommended: Separate node_metadata table (Option C):**

```sql
CREATE TABLE node_metadata (
  node_id TEXT PRIMARY KEY REFERENCES nodes(id),
  confidence REAL NOT NULL DEFAULT 0.5,
  source_count INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER
);
CREATE INDEX idx_metadata_confidence ON node_metadata(confidence);
```

Reason: T28 needs confidence + source_count + timestamps together. JOIN cost
minimal at T28's node counts. Keeps semantic body JSON separate from tracking
metadata.

**Alternative: Generated virtual column** on nodes table — extracts confidence
from JSON body, indexed, no extra storage. Better if confidence is the only
metadata field needed.

### 5. Confidence Propagation Through Synthesis [CONFIDENCE: MEDIUM]

No canonical formula exists. Practical patterns:

**Pattern A — Conservative (min):** `synthesis_conf = min(source_confidences)`.
Weakest input limits conclusion.

**Pattern B — Weighted average:**
`mean(conf_i) * confidence_boost(source_count)` where boost = `1 - 1/(1+ln(n))`.

**Pattern C — Source-count adjusted (RECOMMENDED):**
`base_confidence * min(1.0, source_count / 3)`. Hits 1.0 at 3+ independent
sources (standard corroboration threshold).

**Pattern D — Conflicted penalty:** `mean(confs) * (1 - std_dev(confs))`.
Penalizes high variance.

**T28 recommendation:** Pattern C as primary. Store `source_count` alongside
confidence. Make formula configurable — different synthesis types may warrant
different formulas.

### 6. Tag + Confidence Compound Query [CONFIDENCE: HIGH]

```sql
SELECT n.id, nm.confidence, nm.source_count, n.body
FROM node_metadata nm
JOIN nodes n ON nm.node_id = n.id
JOIN node_tags nt ON n.id = nt.node_id
JOIN tags t ON nt.tag_id = t.id
WHERE t.name = '#graph-db'
  AND nm.confidence > 0.7
  AND nm.source_count >= 2;
```

Tag lookup narrows to small candidate set via junction index, then confidence
filters. Tag selectivity typically higher than confidence (which may match 50%+
of nodes), so tag-first indexing is correct.

### 7. 28 Source Types — Discriminator Pattern [CONFIDENCE: HIGH]

**Single-table discriminator (recommended):**

```sql
CREATE TABLE source_nodes (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,  -- 'repo'|'pdf'|'arxiv'|'audio'|...
  body JSON NOT NULL,         -- type-specific fields here
  url TEXT,
  title TEXT,
  author TEXT,
  fetched_at INTEGER,
  confidence REAL GENERATED ALWAYS AS (
    CAST(json_extract(body, '$.confidence') AS REAL)
  ) VIRTUAL
);
CREATE INDEX idx_source_type ON source_nodes(source_type);
CREATE INDEX idx_source_type_confidence ON source_nodes(source_type, confidence);
```

**Why this wins:**

- No 28-way JOIN or nullable column sprawl
- JSON body absorbs type-specific fields (tweet_id, arxiv_id, repo_stars = JSON
  paths)
- Generated columns promote hot fields to indexed columns without migration
- Easy to extend when source type 29 appears
- DoltHub analysis confirms: "tagged union" is the only pattern enforcing all
  invariants without complex CHECK constraints

---

## Sources

| #     | Title                                          | Type           | Trust       |
| ----- | ---------------------------------------------- | -------------- | ----------- |
| 1-2   | Willison SQLite Tags Benchmark (blog + GitHub) | Primary source | HIGH        |
| 3     | simple-graph schema (dpapathanasiou)           | Reference impl | HIGH        |
| 4     | LiteGraph schema + filtering                   | Implementation | MEDIUM      |
| 5-6   | SQLite FTS5, Generated Columns docs            | Official       | HIGH        |
| 7     | JSON Virtual Columns blog                      | Technical      | MEDIUM-HIGH |
| 8     | Neo4j Labels vs Properties analysis            | Technical      | HIGH        |
| 9     | DoltHub Polymorphic Associations               | Technical blog | HIGH        |
| 10-11 | IEEE/arXiv confidence propagation papers       | Academic       | HIGH        |
| 12    | SQLite Partial Indexes docs                    | Official       | HIGH        |

---

## Contradictions

1. **FTS5 vs M2M:** FTS5 wins AND queries + storage. M2M wins single-tag + OR.
   No single winner — depends on T28's access patterns.
2. **Tag-as-node vs tag-as-property:** Graph-native wisdom (tag-as-node) doesn't
   translate to SQLite where junction tables outperform JSON arrays by 40x.
3. **VIRTUAL vs STORED generated columns:** VIRTUAL saves storage, STORED may
   reduce CPU for frequent range scans. No direct benchmark found.

---

## Gaps

1. No canonical synthesis confidence formula — T28 must choose and document its
   own policy
2. No cross-schema benchmark for simple-graph + junction tables specifically
3. FTS5 + M2M hybrid sync strategy unbenchmarked
4. Tag counts per node at T28's scale unknown (benchmark used 6.5 avg)

---

## Serendipity

1. **SQLite JSONB (binary JSON)** since v3.45.0 — reduces parse overhead for
   JSON extraction. Relevant for body + generated column patterns.
2. **LiteGraph** (litegraphdb) implements exactly T28's needed pattern: Labels +
   Tags (key-value) + Data (JSON) + Vectors. MIT C# — schema portable to SQLite.
3. **FTS5 wins AND queries** — if T28's primary use is multi-tag intersection
   (#sqlite AND #performance AND #2026), FTS5's 2.59ms + 28% storage advantage
   may tip decision.
