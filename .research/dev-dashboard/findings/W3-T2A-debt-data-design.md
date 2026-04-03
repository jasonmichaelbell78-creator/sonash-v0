# Findings: Debt Pipeline Tab — Data Design

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** W3-T2A

---

## 1. Data Schema Analysis

### 1A. `docs/technical-debt/metrics.json` (2 KB, single snapshot)

**Schema** (all fields present, generated 2026-03-27):

```
generated          string   ISO timestamp
generated_date     string   "YYYY-MM-DD"
summary.total      number   8472
summary.open       number   7282
summary.resolved   number   1116
summary.false_positives  number  74
summary.resolution_rate_pct  number  13

by_status          object   keys: NEW|VERIFIED|IN_PROGRESS|RESOLVED|FALSE_POSITIVE
by_severity        object   keys: S0|S1|S2|S3
by_category        object   keys: 9 categories (see below)
by_source          object   19 distinct source labels
alerts.s0_count    number   11
alerts.s1_count    number   1259
alerts.s0_items[]  array    objects: {id, title, file, line}  — 10 items currently
alerts.s1_items[]  array    objects: {id, title, file, line}  — first 10 only (truncated)
health.avg_age_days          number   42
health.oldest_age_days       number   56
health.oldest_item_id        string   "DEBT-0002"
health.verification_queue_size  number  2126
```

**by_category values** (with current counts):

```
code-quality: 4716    security: 723       performance: 179
documentation: 982    refactoring: 668    process: 727
engineering-productivity: 69   enhancements: 154   ai-optimization: 254
```

**Key note:** `alerts.s1_items[]` contains only the first 10 S1 items hardcoded
in the file. The `s1_count` is 1259. Do NOT use `s1_items` as an exhaustive list
— use `s1_count` only for the KPI card, and load the full S1 list from the
debt-items file.

---

### 1B. `docs/technical-debt/logs/metrics-log.jsonl` (114 entries, single schema)

**Schema** — ALL 114 entries share the same 6-field schema (no evolution):

```
timestamp    string   ISO timestamp (multiple entries per day)
total        number   cumulative total items in MASTER_DEBT
open         number   non-resolved, non-FP items
resolved     number   RESOLVED status count
s0_alerts    number   open S0 count
s1_alerts    number   open S1 count
```

**Coverage:** 49 unique dates from 2026-02-01 to 2026-03-27. Multiple entries
per day are common (deduplicate by taking last entry per date).

**Critical gap:** `metrics-log.jsonl` does NOT contain `by_severity`,
`by_category`, `by_status`, or `by_source`. These breakdown fields exist only in
the point-in-time `metrics.json`. Historical breakdown trends are not available.
The trend chart can only show: total, open, resolved, s0_alerts, s1_alerts.

**Confirmed bug from research report:** BUG-06 from debt-runner-expansion
research — `metrics-log.jsonl` is missing the breakdown fields needed for
multi-line trend charts. This is a known gap, not a design error here.

---

### 1C. `docs/technical-debt/MASTER_DEBT.jsonl` (8,472 records, 7.22 MB raw)

**All fields with coverage:**

| Field           | Coverage | Notes                                               |
| --------------- | -------- | --------------------------------------------------- |
| id              | 100%     | "DEBT-XXXXX" format                                 |
| title           | 100%     | Up to ~100 chars in practice                        |
| severity        | 100%     | S0/S1/S2/S3                                         |
| status          | 100%     | NEW/VERIFIED/IN_PROGRESS/RESOLVED/FALSE_POSITIVE    |
| category        | 100%     | 9 values (see above)                                |
| type            | 99%      | code-smell/bug/tech-debt/vulnerability/etc.         |
| file            | 99%      | Relative path string                                |
| line            | 99%      | 0 means file-level (no specific line)               |
| effort          | 99%      | E0/E1/E2/E3 (estimated effort)                      |
| status          | 100%     | see above                                           |
| roadmap_ref     | 99%      | "M2.1" milestone reference string                   |
| source          | 90%      | sonarcloud/audit/review/manual/etc.                 |
| source_id       | 100%     | raw source identifier                               |
| source_file     | 99%      | file the item was imported from                     |
| description     | 99%      | Full description text (can be long)                 |
| recommendation  | 99%      | Remediation text (can be long)                      |
| content_hash    | 99%      | SHA256 for dedup                                    |
| created         | 99%      | "YYYY-MM-DD"                                        |
| verified_by     | 99%      | "TOOL_VALIDATED" or null                            |
| resolution      | 99%      | object or null — {type, date}                       |
| rule            | 33%      | SonarCloud rule key (e.g., "typescript:S2871")      |
| sonar_key       | 33%      | SonarCloud issue UUID                               |
| merged_from     | 52%      | Array of source IDs this was merged from            |
| evidence        | 31%      | Array of evidence strings                           |
| cluster_id      | 22%      | "CLUSTER-xxxxxxxx"                                  |
| cluster_count   | 22%      | Number of items in cluster                          |
| original_id     | 21%      | "INTAKE-CODE-XXXXX" etc.                            |
| cluster_primary | 2%       | Boolean — only 172 of 8472 items                    |
| consensus_score | 1%       | Rare                                                |
| dependencies    | <1%      | Array of CANON IDs                                  |
| pr_bucket       | 3%       | "misc" etc.                                         |
| pr_number       | <1%      | PR number if linked                                 |
| resolved_date   | 1%       | "YYYY-MM-DD" for resolved items                     |
| roadmap_status  | 2%       | "net_new" etc.                                      |
| sources         | 5%       | Array of AI model names                             |
| tags            | <1%      | Array of strings                                    |
| created_at      | <1%      | Duplicate of created (legacy field, 6 records only) |

---

### 1D. `docs/technical-debt/logs/intake-log.jsonl` (80 entries)

**Action types and schemas:**

```
intake-manual (36 entries):
  {timestamp, action, item_id, file, severity, category}

intake-pr-deferred (27 entries):
  {timestamp, action, pr_number, item_id, file, severity}

intake-audit (13 entries):
  {timestamp, action, input_file, items_processed, items_added,
   duplicates_skipped, errors, first_id, last_id}

sync-sonarcloud (3 entries):
  {timestamp, actor, actor_type, outcome, action, project,
   items_checked, items_resolved}

ingest-cleaned-intake (1 entry):
  {timestamp, action, ...} (bulk ingest variant)
```

**Date range:** 2026-01-31 to 2026-03-26. 80 total entries.

---

### 1E. `docs/technical-debt/logs/resolution-log.jsonl` (14 entries)

**Action types and schemas:**

```
bulk_resolved (7 entries):
  {timestamp, action, item_ids[], count, pr}

resolved (3 entries):
  {timestamp, action, item_id, pr}

resolve-sonarcloud-stale (2 entries):
  {timestamp, actor, actor_type, outcome, action, project,
   items_checked, items_resolved}

false_positive (2 entries):
  {timestamp, action, item_id, reason}
```

**Date range:** 2026-02-02 to 2026-03-26. 14 entries, 649 total items resolved
across log history.

---

### 1F. `docs/technical-debt/raw/review-needed.jsonl` (27 items)

**Structure:** Each record is a pair, not a single item.

```
{
  reason: "parametric_s0s1_review" | "semantic_match"
  item_a: { ...full MASTER_DEBT fields... }
  item_b: { ...full MASTER_DEBT fields... }
  note: string
}
```

**Reason breakdown:** 26 parametric_s0s1_review, 1 semantic_match. All items are
S0/S1 candidates flagged as potential duplicates requiring manual decision
before auto-merge. The verification queue widget renders these as "review pairs"
not individual items.

`health.verification_queue_size` in metrics.json (2126) refers to the NEW-status
items in MASTER_DEBT awaiting triage, NOT this file. The 27 items in
review-needed.jsonl are a separate dedup review queue.

---

## 2. Field Stripping Plan

### Target: browser-loadable item tables

Raw MASTER_DEBT: **7.22 MB** — not directly usable in browser.

### Recommended display fields (13 fields)

| Field       | Include | Rationale                                          |
| ----------- | ------- | -------------------------------------------------- |
| id          | YES     | Primary key, link target, required for all actions |
| title       | YES     | Main display text in table rows                    |
| severity    | YES     | S0/S1/S2/S3 badge, filter key                      |
| status      | YES     | Status badge, filter key                           |
| category    | YES     | Category badge, filter key                         |
| type        | YES     | code-smell/bug/vulnerability — secondary badge     |
| file        | YES     | File path column (truncate to basename + path)     |
| line        | YES     | Line number column                                 |
| effort      | YES     | E0-E3 badge — planning/prioritization              |
| created     | YES     | Age calculation (days since created)               |
| roadmap_ref | YES     | Milestone grouping                                 |
| source      | YES     | Source badge (sonarcloud/audit/manual)             |
| rule        | YES     | SonarCloud rule key — useful for S1/S2 grouping    |

### Excluded fields (with rationale)

| Field              | Exclude reason                                        |
| ------------------ | ----------------------------------------------------- |
| description        | Long text, not needed for table scan. Load on demand. |
| recommendation     | Long text, load on demand (detail panel).             |
| content_hash       | Internal dedup key, no UI value                       |
| source_id          | Raw internal ID, redundant with `source` + `id`       |
| source_file        | File the item was imported from, not the code file    |
| merged_from        | Internal dedup provenance, no UI value                |
| evidence           | Long array, load on demand                            |
| cluster_id         | 22% coverage, only useful for dedup views             |
| cluster_count      | 22% coverage                                          |
| cluster_primary    | 2% coverage — too sparse to display                   |
| verified_by        | "TOOL_VALIDATED" for most — not useful in table       |
| resolution         | Object, load on demand in detail panel                |
| original_id        | Internal intake reference, no UI value                |
| sonar_key          | Internal SonarCloud UUID, no UI value                 |
| consensus_score    | 1% coverage                                           |
| dependencies       | <1% coverage                                          |
| roadmap_status     | 2% coverage                                           |
| tags               | <1% coverage                                          |
| sources            | AI model names, internal                              |
| pr_bucket          | 3% coverage                                           |
| pr_number          | <1% coverage                                          |
| resolved_date      | 1% coverage (only on resolved items)                  |
| created_at         | Duplicate legacy field, 6 records only                |
| file_refs          | <1% coverage                                          |
| user               | <1% coverage                                          |
| verification_steps | <1% coverage                                          |

### Size outcomes with 13-field strip

| File                 | Items | Size     | Notes                               |
| -------------------- | ----- | -------- | ----------------------------------- |
| debt-items-s0s1.json | 1,386 | 464 KB   | S0 + S1 all statuses                |
| debt-items-s2s3.json | 7,086 | 2,176 KB | S2 + S3, lazy-loaded                |
| debt-items-all.json  | 8,472 | 2,641 KB | Full stripped bundle (alt strategy) |

**Recommendation:** Split by severity tier. Initial load fetches only
`debt-summary.json` + `debt-alerts.json` (S0 + open S1, 432 KB). S2/S3 loaded
lazily when user expands the table or applies S2/S3 filter.

---

## 3. Static Export Plan

### File structure under `public/`

```
public/
  debt-summary.json          ~2 KB    Copy of docs/technical-debt/metrics.json
  debt-trend.json            ~12 KB   Deduplicated metrics-log (49 date points, 6 fields each)
  debt-alerts.json           ~432 KB  S0 + open S1, 13 stripped fields
  debt-items-s0s1.json       ~464 KB  All S0+S1 items (including resolved)
  debt-items-s2s3.json       ~2.2 MB  All S2+S3 items, lazy-loaded
  debt-review-queue.json     ~200 KB  review-needed.jsonl content
  debt-activity.json         ~50 KB   Combined intake-log + resolution-log
```

**Total initial load:** ~446 KB (debt-summary + debt-alerts). **Full load (all
debt):** ~3.1 MB (acceptable for dashboard, user-triggered).

### Hybrid fetch strategy (from research report recommendation)

During `npm run dev`: fetch from `/api/debt/summary` and `/api/debt/items` which
read live MASTER_DEBT.jsonl directly. Zero staleness.

During production build (`npm run build`): all `/api/*` routes absent (static
export). Fall back to `public/debt-*.json` snapshot files.

**Implementation pattern:**

```typescript
const isDev = process.env.NODE_ENV === "development";
const summaryUrl = isDev ? "/api/debt/summary" : "/debt-summary.json";
const alertsUrl = isDev ? "/api/debt/alerts" : "/debt-alerts.json";
```

### Build script (`scripts/generate-debt-export.js`)

Reads from `docs/technical-debt/` → writes to `public/debt-*.json`. Run manually
or as part of pre-build step when snapshot refresh is needed. Add to
`package.json` as `"debt:export": "node scripts/generate-debt-export.js"`.

---

## 4. Visualization Spec

### Widget 1: Summary KPI Strip (from `debt-summary.json`)

4 KPI cards in a horizontal strip:

| Card            | Value source                  | Format       |
| --------------- | ----------------------------- | ------------ |
| Total Items     | `summary.total`               | Large number |
| Open            | `summary.open`                | Large number |
| Resolved        | `summary.resolved`            | Large number |
| Resolution Rate | `summary.resolution_rate_pct` | "13%"        |

Secondary row (2 alert cards with red/orange treatment):

| Card      | Value                    | Severity color |
| --------- | ------------------------ | -------------- |
| S0 Alerts | `alerts.s0_count` = 11   | Red/critical   |
| S1 Alerts | `alerts.s1_count` = 1259 | Orange/high    |

---

### Widget 2: Severity Breakdown (from `debt-summary.json`)

**Chart type:** Donut chart with legend. **Data source:** `by_severity` object.

```
S0: 26    (red)
S1: 1,360 (orange)
S2: 3,445 (yellow)
S3: 3,641 (gray/low)
```

Centerpiece: total count (8,472). Click segment to filter table below.

---

### Widget 3: Status Breakdown (from `debt-summary.json`)

**Chart type:** Horizontal stacked bar or 5-segment donut. **Data source:**
`by_status` object.

```
NEW:          2,126  (blue — unverified)
VERIFIED:     5,156  (teal — triaged)
IN_PROGRESS:      0  (purple)
RESOLVED:     1,116  (green)
FALSE_POSITIVE:  74  (gray)
```

Note: `IN_PROGRESS = 0` — omit from chart or show as empty segment.

---

### Widget 4: Category Breakdown (from `debt-summary.json`)

**Chart type:** Horizontal bar chart (9 bars, sorted descending). **Data
source:** `by_category` object.

```
code-quality: 4,716
security: 723
documentation: 982
refactoring: 668
process: 727
performance: 179
ai-optimization: 254
enhancements: 154
engineering-productivity: 69
```

---

### Widget 5: Debt Trend Line (from `debt-trend.json`)

**Chart type:** Multi-line chart with time X-axis. **Data source:** Deduplicated
metrics-log (49 date points, 2026-02-01 to 2026-03-27).

**Available series:**

- `total` (blue) — total items in MASTER_DEBT
- `open` (orange) — open/unresolved items
- `resolved` (green) — resolved count (monotonically increasing)
- `s0_alerts` (red) — S0 open count
- `s1_alerts` (amber) — S1 open count

**Default view:** Show total + open + resolved. Toggle S0/S1 lines.

**Critical gap:** Historical `by_severity`/`by_category` not in trend log.
Cannot chart "S2 count over time" or "code-quality trend" from existing data.
Document this limitation in the UI (tooltip: "Breakdown history not tracked
before BUG-06 fix").

**Inflection annotations:** Major events visible at 2026-02-06 (+991 items),
2026-02-26 (+3739 items), 2026-03-19 (-204 open, +630 resolved). Consider
milestone markers on the chart.

---

### Widget 6: Source Breakdown (from `debt-summary.json`)

**Chart type:** Horizontal bar chart, top 8 sources by count. **Data source:**
`by_source` object (19 sources).

Top sources: audit (2942), sonarcloud (2561), unknown (766), dec-2025-report
(641), review (623), process (727), context (252), sonarcloud-paste (286).

Collapse long tail (sources with <50 items) into "other" bucket.

---

### Widget 7: S0 Alert Table (from `debt-alerts.json`)

**Chart type:** Table — always-visible, no pagination. **Data:**
`alerts.s0_items` from `debt-summary.json` — 10/11 S0 items shown.

Columns: ID (link), Title (truncated), File, Line, Status badge. Row background:
red tint. Sort: severity then ID.

**Note:** metrics.json `alerts.s0_items` has 10 entries but `s0_count = 11`. One
item (DEBT-11283) is the 11th — it IS included in the current snapshot (counting
shows 10 in s0_items array, 11 in s0_count). Load S0 items from
`debt-alerts.json` which pulls from full MASTER_DEBT (26 total S0, filtered to
open only = 11). Use the debt-alerts file, not the truncated s0_items array.

---

### Widget 8: MASTER_DEBT Table (from `debt-alerts.json` + lazy `debt-items-s2s3.json`)

**Chart type:** Virtualized table with server-side-style pagination. **Initial
state:** Show S0 + open S1 only (432 KB payload). "Load all" button.

Columns:

```
ID          short, monospace, link to GitHub search or detail panel
Severity    S0/S1/S2/S3 badge (color-coded)
Status      NEW/VERIFIED/etc. badge
Category    category badge
Type        code-smell/bug/etc. (secondary)
File        basename (hover = full path tooltip)
Line        number, right-aligned
Effort      E0-E3 pill
Created     relative age ("42d ago")
Source      source label
Rule        SonarCloud rule key (nullable)
```

Filters (multi-select dropdowns): Severity, Status, Category, Source. Sort:
default by severity ASC then ID ASC. User-sortable by any column.

---

### Widget 9: Intake Activity Timeline (from `debt-activity.json`)

**Chart type:** Activity timeline / event list (reverse-chronological).
**Data:** intake-log.jsonl (80 entries).

Display format: date + action label + item count or item_id. Group by action
type (color-coded dots):

- intake-manual (green)
- intake-pr-deferred (blue)
- intake-audit (purple)
- sync-sonarcloud (gray)

Show last 20 events by default, "load more" for history.

---

### Widget 10: Resolution Activity Timeline (from `debt-activity.json`)

**Chart type:** Activity timeline (same component as intake, different color).
**Data:** resolution-log.jsonl (14 entries).

Action labels:

- bulk_resolved (green) — show count
- resolved (green) — single item
- false_positive (gray) — show reason snippet
- resolve-sonarcloud-stale (gray) — show items_checked

---

### Widget 11: Verification Queue (from `debt-review-queue.json`)

**Chart type:** Card list showing duplicate pairs. **Data:** review-needed.jsonl
(27 items).

Each card shows: reason label + item_a title + item_b title + "Review" button.
KPI above list: "27 pairs awaiting dedup review".

**Render note:** These are pairs, not individual items. Each card needs to show
both sides of the potential duplicate.

---

### Widget 12: Health Stats (from `debt-summary.json`)

3 small stat cards:

```
Avg Age          health.avg_age_days = 42 days
Oldest Item      health.oldest_item_id = DEBT-0002 (56 days)
Verification Queue  health.verification_queue_size = 2,126 NEW-status items
```

---

## 5. `metrics.json` Consumption — Field-to-Widget Mapping

Full mapping of every `metrics.json` field to a UI widget:

| `metrics.json` field             | Widget                          | Display                          |
| -------------------------------- | ------------------------------- | -------------------------------- |
| `generated_date`                 | Tab header                      | "Last updated: Mar 27"           |
| `summary.total`                  | Widget 1 (KPI strip)            | "8,472 total"                    |
| `summary.open`                   | Widget 1 (KPI strip)            | "7,282 open"                     |
| `summary.resolved`               | Widget 1 (KPI strip)            | "1,116 resolved"                 |
| `summary.false_positives`        | Widget 1 (KPI strip, secondary) | "74 false positives"             |
| `summary.resolution_rate_pct`    | Widget 1 (KPI strip)            | "13% resolved"                   |
| `by_status.NEW`                  | Widget 3 (Status breakdown)     | Blue segment                     |
| `by_status.VERIFIED`             | Widget 3 (Status breakdown)     | Teal segment                     |
| `by_status.IN_PROGRESS`          | Widget 3 (Status breakdown)     | Purple (empty = 0)               |
| `by_status.RESOLVED`             | Widget 3 (Status breakdown)     | Green segment                    |
| `by_status.FALSE_POSITIVE`       | Widget 3 (Status breakdown)     | Gray segment                     |
| `by_severity.S0`                 | Widget 2 (Severity donut)       | Red segment                      |
| `by_severity.S1`                 | Widget 2 (Severity donut)       | Orange segment                   |
| `by_severity.S2`                 | Widget 2 (Severity donut)       | Yellow segment                   |
| `by_severity.S3`                 | Widget 2 (Severity donut)       | Gray segment                     |
| `by_category.*`                  | Widget 4 (Category bar chart)   | 9 horizontal bars                |
| `by_source.*`                    | Widget 6 (Source breakdown)     | Top 8 bars + "other"             |
| `alerts.s0_count`                | Widget 1 (alert KPI, red)       | "11 S0 critical"                 |
| `alerts.s1_count`                | Widget 1 (alert KPI, orange)    | "1,259 S1 high"                  |
| `alerts.s0_items[]`              | Widget 7 (S0 table) — reference | Use debt-alerts.json instead     |
| `alerts.s1_items[]`              | NOT used directly               | Truncated to 10, use debt-alerts |
| `health.avg_age_days`            | Widget 12 (Health stats)        | "42 days avg age"                |
| `health.oldest_age_days`         | Widget 12 (Health stats)        | "56 days oldest"                 |
| `health.oldest_item_id`          | Widget 12 (Health stats)        | Link to DEBT-0002                |
| `health.verification_queue_size` | Widget 12 (Health stats)        | "2,126 awaiting triage"          |

---

## 6. Component Breakdown

### Page component

```
DebtPipelineTab
  └── fetches: debt-summary.json, debt-trend.json, debt-alerts.json
  └── lazy-fetches: debt-items-s2s3.json (on demand)
```

### Component tree

```
DebtPipelineTab
  ├── DebtSummaryStrip          (Widget 1 — KPI cards from summary.total/open/resolved)
  │     ├── KpiCard (×4 primary)
  │     └── AlertKpiCard (×2 — S0/S1 counts, red/orange)
  │
  ├── DebtChartsRow             (Widgets 2-4 side by side)
  │     ├── SeverityDonut       (Widget 2 — by_severity)
  │     ├── StatusBreakdown     (Widget 3 — by_status)
  │     └── CategoryBarChart    (Widget 4 — by_category)
  │
  ├── DebtTrendChart            (Widget 5 — metrics-log time series)
  │     └── uses Recharts LineChart
  │     └── series toggle: total/open/resolved/s0/s1
  │
  ├── SourceBreakdown           (Widget 6 — by_source, lazy render)
  │
  ├── S0AlertTable              (Widget 7 — always visible, no pagination)
  │     └── 10-26 rows, red tint
  │
  ├── DebtItemsTable            (Widget 8 — virtualized, paginated)
  │     ├── DebtTableFilters    (severity, status, category, source dropdowns)
  │     ├── DebtTableRow        (single row, memoized)
  │     └── DebtDetailPanel     (slide-out panel, loads description/recommendation on demand)
  │
  ├── DebtActivityFeed          (Widgets 9+10 — combined intake + resolution timeline)
  │     └── ActivityEvent (×N, color-coded by action type)
  │
  ├── VerificationQueue         (Widget 11 — review-needed pairs)
  │     └── ReviewPairCard (×27 max)
  │
  └── DebtHealthStats           (Widget 12 — 3 health cards)
```

### Recharts dependency note

Per debt-runner-expansion research report: **Recharts and shadcn chart
components are NOT currently installed** and must be added before development.
Add: `npm install recharts` and the shadcn chart wrapper.

### Data loading hooks

```typescript
// Primary data (fetched at tab mount)
useDebtSummary()     → debt-summary.json or /api/debt/summary
useDebtTrend()       → debt-trend.json or /api/debt/trend
useDebtAlerts()      → debt-alerts.json or /api/debt/alerts

// Lazy data (fetched on user demand)
useDebtItemsS2S3()   → debt-items-s2s3.json (triggered by filter or "Load all")
useDebtActivity()    → debt-activity.json (intake + resolution log)
useDebtReviewQueue() → debt-review-queue.json (review-needed pairs)
```

---

## Contradictions

**1. `s0_count` vs `s0_items` array length in metrics.json**

`alerts.s0_count = 11` but `alerts.s0_items[]` has 10 entries. The 11th S0 item
(DEBT-11283, fast-xml-parser DoS vulnerability) does appear in the file but was
apparently not included in the s0_items snippet. The full set of open S0 items
should be loaded from `debt-alerts.json` (which reads MASTER_DEBT directly), not
from the `s0_items` array.

**2. `health.verification_queue_size` (2126) vs `review-needed.jsonl` (27
items)**

These are different queues. The 2,126 figure is NEW-status items in MASTER_DEBT
awaiting triage status change. The 27 items in `review-needed.jsonl` are
potential duplicate pairs requiring human review before merge. Both exist
simultaneously and track different workflow stages. Display both, labeled
distinctly.

**3. MASTER_DEBT line count (8472) vs `summary.total` (8472)**

These match exactly. The metrics.json `generated` timestamp is 2026-03-27,
matching the last MASTER_DEBT modification. No drift.

---

## Gaps

**1. Historical breakdown data not in metrics-log**

`metrics-log.jsonl` only captures 6 fields. There is no historical record of
`by_severity`, `by_category`, or `by_status` over time. The only point-in-time
breakdown available is the current `metrics.json`. The trend chart will be
limited to total/open/resolved/s0/s1 series only.

**2. No effort-to-resolve tracking**

The resolution-log records which items were resolved but not how much time was
spent. Cannot build a "velocity" or "time-to-resolution" chart from existing
data.

**3. `alerts.s1_items[]` truncated to 10**

The s1_items array in metrics.json only shows the first 10 S1 items by ID order.
The actual 1,259 S1 open items must be loaded from the debt-alerts.json export.
Do not use metrics.json for the S1 item list.

**4. BUG-01 warning (from research report)**

The debt-runner-expansion research confirmed BUG-01: some CLI scripts write
lowercase status strings (e.g., "resolved" instead of "RESOLVED"). If these
exist in MASTER_DEBT, status filters on the UI will miss items. Recommend adding
a normalization step in the data loading layer: `status.toUpperCase()` before
filtering.

---

## Serendipity

**Massive total inflation from two bulk imports**

The metrics-log reveals that ~4,700 of the 8,472 total items were added in just
two events: Feb 6 (+991) and Feb 26 (+3,739). This implies the debt pipeline was
essentially bootstrapped from legacy data dumps, not organic item-by-item
discovery. The "42-day average age" metric is misleading — most items have
artificial creation dates from the import date, not when the debt was actually
introduced. Worth surfacing in the UI (tooltip or footnote on health stats).

**S2/S3 dominance makes S0/S1 the only actionable view**

S0+S1 = 1,386 items (16%). S2+S3 = 7,086 (84%). Given the 13% resolution rate,
the practical working surface is S0/S1 only. The table should default to S0+S1
filter on tab open, not "all items." This matches the alert-first design.

**`IN_PROGRESS` count is exactly 0**

No items are currently in-progress status. Either the status is never set by CLI
scripts (possible BUG), or all work progresses directly from VERIFIED to
RESOLVED. Worth flagging in the UI or omitting the IN_PROGRESS segment from the
status chart entirely to reduce noise.

---

## Confidence Assessment

- HIGH claims: 14 (all schema fields, sizes, and counts verified by direct file
  inspection)
- MEDIUM claims: 4 (component naming, lazy-load threshold recommendations)
- LOW claims: 1 (BUG-01 normalization — from research report, not directly
  verified in this pass)
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All size figures are computed from actual file reads. All field coverage
percentages are from a full scan of all 8,472 MASTER_DEBT records.
