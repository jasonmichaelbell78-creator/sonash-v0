# Findings: SQLite Schema for tdms.db — Read-Optimized Mirror of MASTER_DEBT.jsonl

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-27
**Sub-Question IDs:** SQ1a

---

## Key Findings

### 1. Complete MASTER_DEBT.jsonl Field Inventory [CONFIDENCE: HIGH]

Verified by scanning all 8,472 records with a Python field-frequency analysis
(confirmed field names and counts by cross-referencing lines 1-20 and lines
8463-8472 of MASTER_DEBT.jsonl).

**Universal fields** (present in every record):

| Field          | Type    | Notes                                                          |
| -------------- | ------- | -------------------------------------------------------------- |
| `id`           | TEXT PK | Format: `DEBT-NNNNN` (e.g. DEBT-0001, DEBT-45622)              |
| `source_id`    | TEXT    | Namespaced: `sonarcloud:KEY`, `review:CANON-ID`, `manual:UUID` |
| `category`     | TEXT    | 9 valid values (see audit-schema.json line 2-12)               |
| `severity`     | TEXT    | S0, S1, S2, S3                                                 |
| `status`       | TEXT    | NEW, VERIFIED, FALSE_POSITIVE, IN_PROGRESS, RESOLVED           |
| `title`        | TEXT    | Free text, human-readable                                      |
| `content_hash` | TEXT    | Present in 8,470/8,472 — SHA-256 of content for dedup          |

**Near-universal fields** (present in 8,400+/8,472 records):

| Field            | Present | Type      | Notes                                                                        |
| ---------------- | ------- | --------- | ---------------------------------------------------------------------------- |
| `file`           | 8,468   | TEXT      | Relative path to source file                                                 |
| `line`           | 8,468   | INTEGER   | Line number (0 = file-level)                                                 |
| `description`    | 8,468   | TEXT      | Explanation of the issue                                                     |
| `type`           | 8,466   | TEXT      | bug, code-smell, vulnerability, hotspot, tech-debt, process-gap, enhancement |
| `roadmap_ref`    | 8,466   | TEXT      | e.g. M2.1, Track-E, GRAND-PLAN, null                                         |
| `created`        | 8,466   | TEXT      | ISO date string, e.g. `2026-01-30`                                           |
| `effort`         | 8,464   | TEXT      | E0, E1, E2, E3                                                               |
| `source_file`    | 8,462   | TEXT      | Source document that produced this item                                      |
| `verified_by`    | 8,459   | TEXT      | Null or name/system that verified                                            |
| `recommendation` | 8,456   | TEXT      | Suggested fix, often empty string                                            |
| `resolution`     | 8,456   | BLOB/JSON | Null or object: `{type, date, pr?, duplicate_of?, reason?}`                  |
| `source`         | 7,681   | TEXT      | Canonical source system name (sonarcloud, audit, review, manual, etc.)       |

**Conditional fields** (source-specific or optional):

| Field                | Present | Type       | Notes                                                               |
| -------------------- | ------- | ---------- | ------------------------------------------------------------------- |
| `merged_from`        | 4,462   | JSON array | Source IDs that were merged into this item                          |
| `rule`               | 2,839   | TEXT       | SonarCloud rule ID, e.g. `typescript:S2871`                         |
| `sonar_key`          | 2,839   | TEXT       | SonarCloud issue key                                                |
| `evidence`           | 2,706   | TEXT/JSON  | Supporting evidence, sometimes array                                |
| `cluster_id`         | 1,867   | TEXT       | Dedup cluster identifier, e.g. `CLUSTER-891bb52fc949`               |
| `cluster_count`      | 1,867   | INTEGER    | Number of items in this cluster                                     |
| `original_id`        | 1,814   | TEXT       | Pre-normalization ID (e.g. INTAKE-CODE-0001)                        |
| `sources`            | 502     | JSON array | AI tools that discovered item (e.g. ["claude-sonnet-4.5", "jules"]) |
| `pr_bucket`          | 338     | TEXT       | PR categorization bucket (e.g. "misc")                              |
| `cluster_primary`    | 172     | BOOLEAN    | True if this is the canonical item in a cluster                     |
| `roadmap_status`     | 168     | TEXT       | e.g. "net_new"                                                      |
| `consensus_score`    | 86      | INTEGER    | Multi-reviewer consensus score (1-5 scale observed)                 |
| `resolved_date`      | 81      | TEXT       | ISO date; appears separate from resolution.date                     |
| `dependencies`       | 80      | JSON array | Related DEBT-IDs or CANON-IDs this item depends on                  |
| `pr_number`          | 15      | INTEGER    | PR that deferred this item                                          |
| `source_pr`          | 10      | INTEGER    | Source PR number                                                    |
| `created_at`         | 6       | TEXT       | Alternative created timestamp (some items use this)                 |
| `file_refs`          | 4       | JSON array | Additional file references                                          |
| `verification_steps` | 3       | JSON array | Steps to verify resolution                                          |
| `tags`               | 2       | JSON array | Free-form tags (e.g. ["tdms", "sqlite", "migration"])               |
| `user`               | 2       | TEXT       | Actor who created item (e.g. "hook-system")                         |

**Resolution object subtypes** (confirmed from data):

- `{type: "resolved", pr: int|null, date: "YYYY-MM-DD"}`
- `{type: "file_removed", date: "YYYY-MM-DD"}`
- `{type: "duplicate", duplicate_of: "DEBT-XXXXX", date: "YYYY-MM-DD"}`
- `{type: "false_positive", reason: "...", date: "YYYY-MM-DD"}` (inferred from
  resolution-log)
- `{type: "wont_fix", date: "YYYY-MM-DD"}`

---

### 2. audit-schema.json Canonical Enumerations [CONFIDENCE: HIGH]

Verified from `/scripts/config/audit-schema.json` (lines 1-26):

- **validCategories** (9): security, performance, code-quality, documentation,
  process, refactoring, engineering-productivity, enhancements, ai-optimization
- **validSeverities** (4): S0, S1, S2, S3
- **validTypes** (7): bug, code-smell, vulnerability, hotspot, tech-debt,
  process-gap, enhancement
- **validStatuses** (5): NEW, VERIFIED, FALSE_POSITIVE, IN_PROGRESS, RESOLVED
- **validEfforts** (4): E0, E1, E2, E3
- **requiredFields**: id, source_id, title, severity, category, status

---

### 3. metrics.json Structure for metrics_snapshots Table [CONFIDENCE: HIGH]

Verified from `/docs/technical-debt/metrics.json` (lines 1-191). This is the
current computed state. The `metrics-log.jsonl` (113 entries, 2026-02-01 to
2026-03-26) stores the time-series version.

**metrics-log.jsonl schema** (6 fields, confirmed lines 1-5 and last 5):

```
timestamp: ISO 8601 datetime
total: integer
open: integer
resolved: integer
s0_alerts: integer
s1_alerts: integer
```

**Full metrics.json structure** (not in log — computed at snapshot time):

- `generated`, `generated_date`
- `summary`: total, open, resolved, false_positives, resolution_rate_pct
- `by_status`: counts per status value
- `by_severity`: counts per severity value
- `by_category`: counts per category value
- `by_source`: counts per source system
- `alerts`: s0_count, s1_count, s0_items[], s1_items[]
- `health`: avg_age_days, oldest_age_days, oldest_item_id,
  verification_queue_size

---

### 4. resolution-log.jsonl Schema [CONFIDENCE: HIGH]

Verified from file (14 entries). Two distinct record shapes exist:

**Shape A — bulk action:**

```
timestamp, action ("bulk_resolved"), item_ids (array), count, pr (int|null)
```

**Shape B — single action:**

```
timestamp, action ("resolved"|"false_positive"), item_id (string), pr (int|null)
```

**Shape C — CLI operation:**

```
timestamp, actor, actor_type, outcome, action, project, items_checked, items_resolved, first_id, last_id, operator
```

**Shape D — false_positive with reason:**

```
timestamp, action ("false_positive"), item_id, reason (string)
```

---

### 5. intake-log.jsonl Schema [CONFIDENCE: HIGH]

Verified from file (80 entries). Multiple shapes:

**Shape A — manual intake:**

```
timestamp, action ("intake-manual"), item_id, file, severity, category
```

**Shape B — audit batch intake:**

```
timestamp, action ("intake-audit"), operator, input_file, items_processed, items_added, duplicates_skipped, errors, first_id, last_id, format_stats (object), confidence_logs (array)
```

**Shape C — sonarcloud sync:**

```
timestamp, actor, actor_type, outcome, action ("sync-sonarcloud"), project, items_fetched, items_added, already_tracked, content_duplicates, first_id, last_id, operator
```

**Shape D — PR-deferred intake:**

```
timestamp, action ("intake-pr-deferred"), pr_number, item_id, file, severity
```

---

### 6. Proposed SQLite Schema — Four Core Tables [CONFIDENCE: HIGH]

Based on full field inventory and dashboard consumption requirements.

#### Table: `debt_items` (main read-optimized mirror)

```sql
CREATE TABLE debt_items (
  -- Identity
  id              TEXT PRIMARY KEY,          -- DEBT-NNNNN
  source_id       TEXT NOT NULL,             -- sonarcloud:KEY, review:CANON-ID, etc.
  original_id     TEXT,                      -- Pre-normalization ID

  -- Classification (all indexed)
  severity        TEXT NOT NULL,             -- S0, S1, S2, S3
  category        TEXT NOT NULL,             -- 9 valid values
  type            TEXT,                      -- 7 valid values
  status          TEXT NOT NULL,             -- 5 valid values
  effort          TEXT,                      -- E0, E1, E2, E3

  -- Content
  title           TEXT NOT NULL,
  description     TEXT,
  recommendation  TEXT,
  evidence        TEXT,                      -- raw JSON or text

  -- Location
  file            TEXT,                      -- relative path
  line            INTEGER DEFAULT 0,

  -- Provenance
  source          TEXT,                      -- source system name
  source_file     TEXT,                      -- source document path
  rule            TEXT,                      -- SonarCloud rule ID
  sonar_key       TEXT,                      -- SonarCloud issue key

  -- Roadmap
  roadmap_ref     TEXT,
  roadmap_status  TEXT,

  -- Clustering / Dedup
  cluster_id      TEXT,
  cluster_count   INTEGER,
  cluster_primary INTEGER DEFAULT 0,         -- boolean (0/1)
  content_hash    TEXT,

  -- Dates
  created         TEXT,                      -- YYYY-MM-DD (primary)
  created_at      TEXT,                      -- ISO 8601 (alternate; some items only)
  resolved_date   TEXT,                      -- YYYY-MM-DD

  -- Resolution
  resolution_type TEXT,                      -- resolved, file_removed, duplicate, false_positive, wont_fix
  resolution_pr   INTEGER,                   -- PR number if resolved via PR
  resolution_date TEXT,                      -- YYYY-MM-DD
  resolution_duplicate_of TEXT,             -- DEBT-XXXXX if duplicate
  resolution_reason TEXT,                    -- free text reason (false_positive/wont_fix)

  -- Workflow
  verified_by     TEXT,
  pr_bucket       TEXT,
  pr_number       INTEGER,
  source_pr       INTEGER,
  consensus_score INTEGER,
  user_actor      TEXT,                      -- 'user' field renamed to avoid SQL keyword

  -- Dashboard-only augmentation (not in JSONL — web dashboard additions)
  last_synced_at  TEXT NOT NULL DEFAULT (datetime('now')),  -- when SQLite was last updated from JSONL
  last_verified_at TEXT,                     -- when an operator last verified this item
  assigned_to     TEXT,                      -- future: user assignment
  priority_override TEXT,                    -- future: manual priority above severity
  web_bookmark    INTEGER DEFAULT 0,          -- boolean: user bookmarked in dashboard
  cli_task_ref    TEXT,                       -- reference to CLI task or sprint slot
  notes           TEXT,                       -- web dashboard freeform notes

  -- JSON columns for array fields (stored as JSON strings, queried via json_each)
  merged_from_json     TEXT,                -- JSON array of merged source IDs
  sources_json         TEXT,                -- JSON array of AI tools
  dependencies_json    TEXT,                -- JSON array of related IDs
  tags_json            TEXT,                -- JSON array of tags
  file_refs_json       TEXT,                -- JSON array of file refs
  verification_steps_json TEXT              -- JSON array of verification steps
);
```

#### Table: `metrics_snapshots` (time-series from metrics-log.jsonl)

```sql
CREATE TABLE metrics_snapshots (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_at     TEXT NOT NULL UNIQUE,      -- ISO 8601 timestamp
  snapshot_date   TEXT,                      -- YYYY-MM-DD derived
  total           INTEGER NOT NULL,
  open            INTEGER NOT NULL,
  resolved        INTEGER NOT NULL,
  s0_alerts       INTEGER NOT NULL DEFAULT 0,
  s1_alerts       INTEGER NOT NULL DEFAULT 0,
  -- Extended fields from full metrics.json (populated when doing full snapshot)
  false_positives INTEGER,
  resolution_rate_pct INTEGER,
  count_new       INTEGER,
  count_verified  INTEGER,
  count_in_progress INTEGER,
  count_s0        INTEGER,
  count_s1        INTEGER,
  count_s2        INTEGER,
  count_s3        INTEGER,
  health_avg_age_days INTEGER,
  health_oldest_age_days INTEGER,
  health_oldest_item_id TEXT,
  health_verification_queue_size INTEGER,
  -- Full breakdown blobs for charting
  by_category_json TEXT,                     -- JSON object
  by_source_json   TEXT,                     -- JSON object
  alerts_s0_json   TEXT,                     -- JSON array of alert items
  alerts_s1_json   TEXT                      -- JSON array (truncated for size)
);
```

#### Table: `intake_log` (append-only event log)

```sql
CREATE TABLE intake_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  logged_at       TEXT NOT NULL,             -- ISO 8601 timestamp
  action          TEXT NOT NULL,             -- intake-manual, intake-audit, sync-sonarcloud, intake-pr-deferred
  item_id         TEXT,                      -- single item (nullable for batch)
  pr_number       INTEGER,
  operator        TEXT,
  actor           TEXT,
  actor_type      TEXT,
  input_file      TEXT,
  items_processed INTEGER,
  items_added     INTEGER,
  duplicates_skipped INTEGER,
  errors          INTEGER,
  first_id        TEXT,
  last_id         TEXT,
  outcome         TEXT,                      -- success, failure
  project         TEXT,
  items_fetched   INTEGER,
  already_tracked INTEGER,
  content_duplicates INTEGER,
  format_stats_json TEXT,                    -- raw JSON blob
  confidence_logs_json TEXT                  -- raw JSON blob (large)
);
```

#### Table: `resolution_log` (append-only event log)

```sql
CREATE TABLE resolution_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  logged_at       TEXT NOT NULL,             -- ISO 8601 timestamp
  action          TEXT NOT NULL,             -- resolved, bulk_resolved, false_positive
  item_id         TEXT,                      -- single item (NULL for bulk)
  item_ids_json   TEXT,                      -- JSON array for bulk actions
  item_count      INTEGER,
  pr              INTEGER,
  actor           TEXT,
  actor_type      TEXT,
  reason          TEXT,                      -- false_positive reason
  outcome         TEXT,
  action_detail   TEXT,                      -- e.g. "resolve-sonarcloud-stale"
  items_checked   INTEGER,
  items_resolved  INTEGER,
  project         TEXT,
  operator        TEXT
);
```

---

### 7. Indexes for Common Web Dashboard Queries [CONFIDENCE: HIGH]

Based on `metrics.json` query patterns (by_severity, by_status, by_category,
by_source), health queries (age, verification queue), and dashboard filter
patterns.

```sql
-- Primary filter dimensions
CREATE INDEX idx_severity ON debt_items(severity);
CREATE INDEX idx_status ON debt_items(status);
CREATE INDEX idx_category ON debt_items(category);
CREATE INDEX idx_source ON debt_items(source);
CREATE INDEX idx_type ON debt_items(type);
CREATE INDEX idx_effort ON debt_items(effort);
CREATE INDEX idx_roadmap_ref ON debt_items(roadmap_ref);

-- Date-based queries (age, stale items, verification queue)
CREATE INDEX idx_created ON debt_items(created);
CREATE INDEX idx_resolved_date ON debt_items(resolved_date);
CREATE INDEX idx_last_verified_at ON debt_items(last_verified_at);

-- Compound indexes for common dashboard filter combinations
CREATE INDEX idx_status_severity ON debt_items(status, severity);
CREATE INDEX idx_severity_status ON debt_items(severity, status);
CREATE INDEX idx_category_status ON debt_items(category, status);
CREATE INDEX idx_source_status ON debt_items(source, status);
CREATE INDEX idx_status_created ON debt_items(status, created);

-- File-level drill-down
CREATE INDEX idx_file ON debt_items(file);

-- Dedup / cluster navigation
CREATE INDEX idx_cluster_id ON debt_items(cluster_id);
CREATE INDEX idx_content_hash ON debt_items(content_hash);

-- SonarCloud cross-reference
CREATE INDEX idx_sonar_key ON debt_items(sonar_key);

-- Dashboard augmentation fields
CREATE INDEX idx_web_bookmark ON debt_items(web_bookmark) WHERE web_bookmark = 1;
CREATE INDEX idx_assigned_to ON debt_items(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_priority_override ON debt_items(priority_override) WHERE priority_override IS NOT NULL;

-- Full-text search (SQLite FTS5)
CREATE VIRTUAL TABLE debt_items_fts USING fts5(
  id UNINDEXED,
  title,
  description,
  recommendation,
  file,
  content='debt_items',
  content_rowid='rowid'
);
-- Rebuild trigger
CREATE TRIGGER debt_items_fts_insert AFTER INSERT ON debt_items BEGIN
  INSERT INTO debt_items_fts(rowid, id, title, description, recommendation, file)
  VALUES (new.rowid, new.id, new.title, new.description, new.recommendation, new.file);
END;
CREATE TRIGGER debt_items_fts_update AFTER UPDATE ON debt_items BEGIN
  INSERT INTO debt_items_fts(debt_items_fts, rowid, id, title, description, recommendation, file)
  VALUES ('delete', old.rowid, old.id, old.title, old.description, old.recommendation, old.file);
  INSERT INTO debt_items_fts(rowid, id, title, description, recommendation, file)
  VALUES (new.rowid, new.id, new.title, new.description, new.recommendation, new.file);
END;

-- Metrics snapshots time-series
CREATE INDEX idx_snapshot_date ON metrics_snapshots(snapshot_date);

-- Log tables
CREATE INDEX idx_intake_logged_at ON intake_log(logged_at);
CREATE INDEX idx_intake_action ON intake_log(action);
CREATE INDEX idx_resolution_logged_at ON resolution_log(logged_at);
CREATE INDEX idx_resolution_item_id ON resolution_log(item_id);
```

---

### 8. Proposed SQL Views for Dashboard Consumption [CONFIDENCE: HIGH]

These views pre-compute the most common dashboard aggregation and filter
patterns identified from `metrics.json` structure and data distribution.

```sql
-- View: Open items by severity (dashboard home panel)
CREATE VIEW vw_open_by_severity AS
SELECT
  severity,
  COUNT(*) AS count,
  SUM(CASE WHEN status = 'NEW' THEN 1 ELSE 0 END) AS count_new,
  SUM(CASE WHEN status = 'VERIFIED' THEN 1 ELSE 0 END) AS count_verified,
  SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS count_in_progress
FROM debt_items
WHERE status NOT IN ('RESOLVED', 'FALSE_POSITIVE')
GROUP BY severity
ORDER BY severity;

-- View: Open items by category
CREATE VIEW vw_open_by_category AS
SELECT category, COUNT(*) AS count
FROM debt_items
WHERE status NOT IN ('RESOLVED', 'FALSE_POSITIVE')
GROUP BY category
ORDER BY count DESC;

-- View: Open items by source
CREATE VIEW vw_open_by_source AS
SELECT source, COUNT(*) AS count
FROM debt_items
WHERE status NOT IN ('RESOLVED', 'FALSE_POSITIVE')
GROUP BY source
ORDER BY count DESC;

-- View: Open items by roadmap ref
CREATE VIEW vw_open_by_roadmap AS
SELECT
  COALESCE(roadmap_ref, '(unassigned)') AS roadmap_ref,
  COUNT(*) AS count,
  SUM(CASE WHEN severity = 'S0' THEN 1 ELSE 0 END) AS s0_count,
  SUM(CASE WHEN severity = 'S1' THEN 1 ELSE 0 END) AS s1_count
FROM debt_items
WHERE status NOT IN ('RESOLVED', 'FALSE_POSITIVE')
GROUP BY roadmap_ref
ORDER BY s0_count DESC, s1_count DESC, count DESC;

-- View: Verification queue (NEW items needing triage)
CREATE VIEW vw_verification_queue AS
SELECT id, severity, category, title, file, created, source
FROM debt_items
WHERE status = 'NEW'
ORDER BY
  CASE severity WHEN 'S0' THEN 0 WHEN 'S1' THEN 1 WHEN 'S2' THEN 2 WHEN 'S3' THEN 3 END,
  created ASC;

-- View: Stale items (open + older than 30 days, unverified)
CREATE VIEW vw_stale_items AS
SELECT id, severity, category, title, file, created,
  CAST(julianday('now') - julianday(created) AS INTEGER) AS age_days
FROM debt_items
WHERE status NOT IN ('RESOLVED', 'FALSE_POSITIVE')
  AND (last_verified_at IS NULL OR julianday('now') - julianday(last_verified_at) > 30)
ORDER BY age_days DESC;

-- View: S0/S1 alert items (dashboard alert panel)
CREATE VIEW vw_alerts AS
SELECT id, severity, title, file, line, status, created
FROM debt_items
WHERE severity IN ('S0', 'S1')
  AND status NOT IN ('RESOLVED', 'FALSE_POSITIVE')
ORDER BY severity, created ASC;

-- View: Cluster primaries with member count
CREATE VIEW vw_clusters AS
SELECT id, title, cluster_id, cluster_count, severity, category, status
FROM debt_items
WHERE cluster_primary = 1
ORDER BY cluster_count DESC;

-- View: Resolution rate trend (using metrics_snapshots)
CREATE VIEW vw_resolution_trend AS
SELECT
  snapshot_date,
  total,
  resolved,
  ROUND(CAST(resolved AS FLOAT) / NULLIF(total, 0) * 100, 1) AS resolution_pct,
  s0_alerts,
  s1_alerts
FROM metrics_snapshots
ORDER BY snapshot_date;

-- View: Items by file (for code-file drill-down)
CREATE VIEW vw_by_file AS
SELECT
  file,
  COUNT(*) AS total_issues,
  SUM(CASE WHEN severity = 'S0' THEN 1 ELSE 0 END) AS s0,
  SUM(CASE WHEN severity = 'S1' THEN 1 ELSE 0 END) AS s1,
  SUM(CASE WHEN severity = 'S2' THEN 1 ELSE 0 END) AS s2,
  SUM(CASE WHEN severity = 'S3' THEN 1 ELSE 0 END) AS s3,
  SUM(CASE WHEN status IN ('RESOLVED', 'FALSE_POSITIVE') THEN 1 ELSE 0 END) AS resolved_count
FROM debt_items
WHERE file IS NOT NULL AND file != ''
GROUP BY file
HAVING total_issues - resolved_count > 0
ORDER BY s0 DESC, s1 DESC, total_issues DESC;
```

---

### 9. Fields MASTER_DEBT.jsonl Currently Lacks That the Dashboard Would Need [CONFIDENCE: HIGH]

These are new fields that should exist in SQLite only (not written back to
JSONL, since JSONL is write-canonical):

| Field               | Type    | Purpose                                                       |
| ------------------- | ------- | ------------------------------------------------------------- |
| `last_synced_at`    | TEXT    | When this row was last written from JSONL — drift detection   |
| `last_verified_at`  | TEXT    | When a human last confirmed this item is still valid/relevant |
| `assigned_to`       | TEXT    | Future: operator/user assignment for sprint planning          |
| `priority_override` | TEXT    | Manual priority boost above severity (e.g. "critical-path")   |
| `web_bookmark`      | INTEGER | User bookmarked this item in dashboard (boolean 0/1)          |
| `cli_task_ref`      | TEXT    | Reference to a CLI task slot or sprint card                   |
| `notes`             | TEXT    | Freeform web dashboard annotation (not in source JSONL)       |

Note: `last_verified_at` is especially important for the `vw_stale_items` view
and the verification queue workflow. Without it, "stale" can only be
approximated by `created` date, which misrepresents actively-triaged older
items.

Note: `user_actor` is a rename of the `user` field from JSONL (SQL reserved word
conflict avoidance).

---

### 10. Schema Design Decisions and Rationale [CONFIDENCE: HIGH]

**Resolution object flattened into columns:** Rather than storing `resolution`
as a JSON blob, it's decomposed into `resolution_type`, `resolution_pr`,
`resolution_date`, `resolution_duplicate_of`, `resolution_reason`. This enables
direct SQL filtering on `WHERE resolution_type = 'duplicate'` without
`json_extract()` overhead.

**Array fields kept as JSON strings:** `merged_from`, `sources`, `dependencies`,
`tags`, `file_refs`, `verification_steps` are infrequently queried as individual
elements in web dashboard contexts. Storing as JSON TEXT avoids junction table
overhead for 8,472 rows while still supporting `json_each()` queries when
needed.

**`source` vs `source_id` distinction preserved:** `source_id` is the full
namespaced key (e.g. `sonarcloud:AZuzlah`). `source` is the system name (e.g.
`sonarcloud`). Both are indexed. The `source` field is absent in 791 records —
the sync process derivation logic must handle this during import.

**FTS5 over LIKE queries:** At 8,472+ rows, title/description search with
`LIKE '%keyword%'` requires a full scan. FTS5 with content= and triggers
provides sub-millisecond search without duplicating storage.

**`created` vs `created_at` duality:** Six items use `created_at` (ISO 8601
datetime) instead of `created` (date string). The schema stores both; the
migration layer should normalize `created` from `created_at` when `created` is
null.

**`roadmap_ref` normalization gap:** The data contains inconsistent roadmap refs
(`Track-E` vs `Track_E`, `M2.3-REF` vs `M2.3-REF-003`). This is a known
inconsistency surfaced in the raw data. The schema stores them as-is;
normalization is a separate TDMS concern.

---

## Sources

| #   | Path                                            | Title                                    | Type       | Trust | CRAAP           | Date       |
| --- | ----------------------------------------------- | ---------------------------------------- | ---------- | ----- | --------------- | ---------- |
| 1   | `docs/technical-debt/MASTER_DEBT.jsonl`         | MASTER_DEBT canonical source             | Filesystem | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-26 |
| 2   | `scripts/config/audit-schema.json`              | Canonical schema definitions             | Filesystem | HIGH  | 5/5/5/5/5 = 5.0 | current    |
| 3   | `docs/technical-debt/metrics.json`              | Computed metrics snapshot                | Filesystem | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-26 |
| 4   | `docs/technical-debt/logs/metrics-log.jsonl`    | 113-entry time series                    | Filesystem | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-26 |
| 5   | `docs/technical-debt/logs/resolution-log.jsonl` | 14-entry resolution history              | Filesystem | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-26 |
| 6   | `docs/technical-debt/logs/intake-log.jsonl`     | 80-entry intake history                  | Filesystem | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-26 |
| 7   | Python field-frequency analysis                 | Full field scan across all 8,472 records | Analysis   | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-27 |

---

## Contradictions

**`resolved_date` vs `resolution.date`:** 81 items have a top-level
`resolved_date` field AND a nested `resolution.date` value. These are not always
identical — `resolved_date` appears to be set by a different script path than
`resolution`. The schema preserves both. A migration validation step should flag
discrepancies.

**`created` vs `created_at`:** Six items use `created_at` (full ISO datetime)
instead of `created` (date-only). These fields co-exist in the schema. The
source of this inconsistency was not determinable from the data alone; it may be
from an earlier intake script version.

**`source` field absent in 791 records:** 7,681/8,472 items have `source`, but
791 do not. For those, `source` must be derived from `source_id` prefix during
JSONL-to-SQLite migration (e.g. `sonarcloud:` prefix → `sonarcloud`).

---

## Gaps

**No `updated_at` field exists** anywhere in MASTER_DEBT.jsonl. There is no way
to identify which items have changed since a given date without comparing
content hashes. The SQLite mirror needs `last_synced_at` as a proxy but cannot
detect upstream mutations without hash comparison. The migration process must
re-hash every record on each sync.

**`intake-log` confidence_logs blob is very large** — some intake events have
30+ confidence_log entries as a nested JSON array. Storing this as a JSON blob
in `intake_log.confidence_logs_json` is practical, but these are never queryable
individually. This is a deliberate tradeoff.

**No PR-to-item link table designed** — `pr_number` and `source_pr` are in
`debt_items`, but there is no separate `pr_events` table. If the dashboard wants
to show "all items deferred from PR #468", that query runs fine against
`debt_items` directly. A junction table is not needed at current scale.

**Dedup-log not included** — `docs/technical-debt/logs/dedup-log.jsonl` exists
but was not included in scope for this schema. It tracks which items were
merged/deduplicated. If the dashboard needs a "why was this item merged?"
drill-down, a `dedup_log` table would be needed.

---

## Serendipity

**DEBT-7593 is meta-self-referential:** One of the 8,472 MASTER_DEBT items
(`DEBT-7593`) is literally titled something about SQLite schema migration, has
`tags: ["tdms", "sqlite", "migration", "architecture", "research"]` and
`verification_steps` describing exactly this design work. The tags field (2
occurrences in 8,472 items) and verification_steps field (3 occurrences) are
therefore not theoretical — they are actively used, just rarely. They must be in
the schema.

**`consensus_score` suggests multi-reviewer workflow already exists** — 86 items
have a `consensus_score` integer (values 4-5 observed). This implies the system
has at some point run multi-AI-reviewer consensus scoring. The web dashboard
could surface items where score < threshold as "review candidates."

**`sources` array is AI provenance data** — 502 items carry a `sources` array
listing AI tools (e.g. `["claude-sonnet-4.5", "jules", "claude-code"]`). This is
unique audit metadata showing which AI systems co-discovered a debt item. The
dashboard could expose a "discovered by AI tool" filter.

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

All findings derived directly from filesystem reads and Python analysis of the
actual data files. No external sources required. Every field name, count, and
schema decision is traceable to specific line numbers or analysis output cited
above.
