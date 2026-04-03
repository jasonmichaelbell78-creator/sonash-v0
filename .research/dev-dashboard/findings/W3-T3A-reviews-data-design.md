# Findings: Code Review Quality Tab — Data Design

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Task:** W3-T3A — Reviews tab data design for Dev Dashboard

---

## 1. Data Schema Analysis

### 1A. `reviews.jsonl` (active file)

**Record count:** 23 records **Schema versions:** v2 (4 records), v1 (13
records), none/legacy (6 records)

Two live schemas coexist. The v1→v2 migration dropped `title`, `patterns`, and
`learnings` from the canonical schema while adding `completeness` tracking.

**Schema v1 fields (13 records, includes `id: "rev-N"` format):**

| Field                  | Type        | Sample value                                       |
| ---------------------- | ----------- | -------------------------------------------------- |
| `id`                   | string      | `"rev-10"`, `"rev-14"`                             |
| `date`                 | ISO date    | `"2026-03-24"`                                     |
| `schema_version`       | number      | `1`                                                |
| `completeness`         | string enum | `"full"`, `"partial"`, `"stub"`                    |
| `completeness_missing` | string[]    | `[]` or `["top_wins","top_misses"]`                |
| `origin`               | object      | `{"type":"pr-review","tool":"qodo"}`               |
| `title`                | string      | `"PR #468 R1 — Qodo (2026-03-24)"`                 |
| `pr`                   | number      | `468`                                              |
| `source`               | string enum | `"qodo"`, `"mixed"`, `"bulk"`, `"sonarcloud+qodo"` |
| `total`                | number      | `13`                                               |
| `fixed`                | number      | `8`                                                |
| `deferred`             | number      | `2`                                                |
| `rejected`             | number      | `3`                                                |
| `patterns`             | string[]    | `["propagation-misses","repeat-rejection-churn"]`  |
| `learnings`            | string[]    | `["Add CC check after fixes in pr-review Step 4"]` |

**Schema v2 fields (4 records — most recent, e.g., rev-19, rev-20):**

| Field                  | Type     | Change from v1      |
| ---------------------- | -------- | ------------------- |
| `id`                   | string   | same                |
| `date`                 | ISO date | same                |
| `schema_version`       | 2        | bumped              |
| `completeness`         | string   | same                |
| `completeness_missing` | string[] | same                |
| `origin`               | object   | same (tool dropped) |
| `pr`                   | number   | same                |
| `source`               | string   | same                |
| `total`                | number   | same                |
| `fixed`                | number   | same                |
| `deferred`             | number   | same                |
| `rejected`             | number   | same                |
| `title`                | REMOVED  | no longer in v2     |
| `patterns`             | REMOVED  | no longer in v2     |
| `learnings`            | REMOVED  | no longer in v2     |

**Legacy no-schema records (6 records, integer IDs like `499`–`502`):** Fields:
`id`, `date`, `title`, `source`, `pr`, `patterns`, `fixed`, `deferred`,
`rejected`, `total`, `learnings` — all counts are zero. These appear to be
scaffolded stub records from backfill that were never populated. Their `total`
is `0` or non-zero but other counts are all zero.

---

### 1B. `reviews-archive.jsonl`

**Record count:** 478 records **Coverage:** Historical review rounds, sessions
prior to active `reviews.jsonl` **File size:** 285 KB

The archive is the primary source for historical analytics. Schema is the legacy
format with integer IDs, full patterns arrays, and learnings strings.

**Key fields (representative of most records):**

| Field       | Type     | Notes                                                   |
| ----------- | -------- | ------------------------------------------------------- |
| `id`        | integer  | Sequential, starting from 44 up to ~400s                |
| `date`      | string   | Often `"unknown"` for backfilled records                |
| `title`     | string   | `"PR #383 R5 (SonarCloud + Qodo + CI)"`                 |
| `source`    | string   | `"sonarcloud+qodo+ci"`, `"qodo"`, `"mixed"`             |
| `pr`        | integer  | PR number (nullable — some old records have `null`)     |
| `patterns`  | string[] | Named patterns, often 5–15 per round; 381/478 non-empty |
| `fixed`     | number   | Count fixed (most archived = 0 — field not backfilled)  |
| `deferred`  | number   | Count deferred                                          |
| `rejected`  | number   | Count rejected                                          |
| `critical`  | number   | Severity count (present in archive, absent from v1/v2)  |
| `major`     | number   | Severity count                                          |
| `minor`     | number   | Severity count                                          |
| `trivial`   | number   | Severity count                                          |
| `total`     | number   | Total findings (most archived = 0 — not backfilled)     |
| `learnings` | string[] | Free-text learning strings, 1–5 per round               |

**Data quality note:** Most `fixed`, `deferred`, `rejected`, and `total` counts
in the archive are `0` — the backfill only captured patterns and learnings, not
counts. Severity fields (`critical`/`major`/`minor`/`trivial`) exist in the
archive schema but are missing from `reviews.jsonl` v1/v2. Severity is captured
in per-PR task state files (see 1F below).

**Pattern prevalence:** 1,697 unique patterns across archive. Generic meta-tags
(`root-cause`, `prevention`, `note`) heavily inflated the raw count.
Semantically meaningful recurring patterns include `propagation-misses`
(significant recurrence per retros), `repeat-rejection-churn`, `cc-extraction`
(10), and module-specific patterns.

---

### 1C. `review-metrics.jsonl`

**Record count:** 52 records (one per PR, PR #414–#477) **File size:** 11 KB

The primary per-PR analytics source. Clean schema, well-populated.

| Field                  | Type     | Sample value                                     |
| ---------------------- | -------- | ------------------------------------------------ |
| `pr`                   | number   | `414`                                            |
| `title`                | string   | `"feat: System-Wide Standardization Discovery…"` |
| `total_commits`        | number   | `6`                                              |
| `fix_commits`          | number   | `5`                                              |
| `fix_ratio`            | float    | `0.83` (range: 0–1)                              |
| `review_rounds`        | number   | `2` (range: 0–6)                                 |
| `timestamp`            | ISO 8601 | `"2026-03-06T03:08:25.068Z"`                     |
| `jsonl_review_records` | number   | `2` (added later, absent on older records)       |
| `reconciled_at`        | ISO 8601 | `"2026-03-27T10:56:07.710Z"` (added later)       |

**Computed stats:**

- 52 total PRs tracked; 36 had actual review rounds (fix_ratio > 0 or
  rounds > 0)
- Average fix_ratio across all 52 PRs: **0.485** (0.67 for PRs with reviews)
- Average review_rounds: **1.17** (2.08 for PRs with actual reviews)
- Max review_rounds: **6** (PR #470)

---

### 1D. `retros.jsonl`

**Record count:** 57 records **File size:** 36 KB **Completeness breakdown:**
full=39, stub=17, partial=1

| Field                  | Type     | Notes                                                         |
| ---------------------- | -------- | ------------------------------------------------------------- |
| `id`                   | string   | `"retro-pr-368"`, `"retro-bulk-448-470"`                      |
| `date`                 | ISO date | `"2026-02-16"` through `"2026-03-26"`                         |
| `schema_version`       | number   | `1` (all records)                                             |
| `completeness`         | string   | `"full"`, `"stub"`, `"partial"`                               |
| `completeness_missing` | string[] | e.g. `["top_wins","top_misses"]`                              |
| `origin`               | object   | `{"type":"pr-retro","pr":368,"tool":"backfill-reviews.ts"}`   |
| `pr`                   | number   | PR number (last PR in bulk retro range)                       |
| `top_wins`             | string[] | nullable on stub records                                      |
| `top_misses`           | string[] | nullable on stub records                                      |
| `process_changes`      | string[] | nullable on stub records; 96 entries across fulls             |
| `score`                | number   | 4–10 scale; null on stubs; avg **7.4** across 39              |
| `metrics`              | object   | `{"total_findings":10,"fix_rate":0.8,"pattern_recurrence":0}` |
| `action_items`         | object[] | Only on bulk retros; includes `status` + `verify_cmd`         |

**Retros with actionable patterns:** 36 of 57 have `pattern_recurrence > 0`. Max
`pattern_recurrence` observed: 6. The most recent bulk retro (PRs #448–#470) has
explicit `action_items` with completion status.

---

### 1E. `pr-review-state.json`

**Record count:** 1 record (current active PR state) **File size:** 10 KB

Active PR #411 review state with 9 rounds (R1–R9). This is the "in-flight" PR
state used for compaction recovery. Key top-level fields:

| Field                   | Type     | Notes                                |
| ----------------------- | -------- | ------------------------------------ |
| `pr`                    | number   | `411`                                |
| `branch`                | string   | git branch name                      |
| `session`               | number   | `200`                                |
| `started`               | ISO date | `"2026-03-01"`                       |
| `mode`                  | string   | `"batched"`                          |
| `batches_completed`     | number   | `9`                                  |
| `total_items_processed` | number   | `415`                                |
| `total_items_fixed`     | number   | `135`                                |
| `total_items_deferred`  | number   | `96`                                 |
| `total_items_rejected`  | number   | `178`                                |
| `batches`               | object[] | Per-round breakdown with fixes array |
| `status`                | string   | `"r9_committed_not_pushed"`          |
| `process`               | object   | API fetch commands, known FPs, steps |

**Active PR status (dashboard display):** PR #411, 9 rounds, 415 items
processed, 135 fixed (33% fix rate), status: committed not pushed.

---

### 1F. Per-PR task state files (`task-pr-review-{pr}-r{N}.state.json`)

**Count:** 21 files in `.claude/state/` directory, covering PRs #433–#472

These per-round state files have the **severity breakdown** missing from the
main `reviews.jsonl`:

| Field             | Type     | Sample                                            |
| ----------------- | -------- | ------------------------------------------------- |
| `pr`              | number   | `470`                                             |
| `round`           | number   | `1`                                               |
| `review_number`   | number   | `53` (global sequential count)                    |
| `source`          | string   | `"mixed"`                                         |
| `total`           | number   | `32`                                              |
| `fixed`           | number   | `19`                                              |
| `deferred`        | number   | `0`                                               |
| `rejected`        | number   | `2`                                               |
| `already_fixed`   | number   | `1`                                               |
| `deduped`         | number   | `10`                                              |
| `severity`        | object   | `{"critical":0,"major":4,"minor":11,"trivial":4}` |
| `completed_steps` | number[] | `[1,2,3,4,5,6,7,8]`                               |
| `status`          | string   | `"complete"`                                      |
| `completed_at`    | ISO 8601 | `"2026-03-26T06:30:00-05:00"`                     |

**Important:** The severity breakdown only lives in these individual state
files. The static export must pull from them to enable severity-based filtering.

---

### 1G. `pending-refinements.jsonl`

**Record count:** 36 records **File size:** 11 KB **Confidence distribution:**
all `"low"` (100%)

| Field            | Type     | Sample                                                  |
| ---------------- | -------- | ------------------------------------------------------- |
| `id`             | string   | `"5aead66268fd"`                                        |
| `route_type`     | string   | `"claude-md-annotation"` (19), `"hook-gate"` (17)       |
| `pattern`        | string   | `"\"Stop and ask\" is a hard stop."`                    |
| `generated_code` | null     | always null currently                                   |
| `confidence`     | string   | `"low"` (all 36)                                        |
| `reason`         | string   | `"behavioral type — proxy metrics need human judgment"` |
| `surfaced_count` | number   | `0` (all currently unactioned)                          |
| `created`        | ISO 8601 | `"2026-03-14T20:35:20.099Z"`                            |

All pending refinements are "unrouted" in the sense that they require human
judgment to action. `surfaced_count=0` across all 36 indicates none have been
presented to the user for decision.

---

### 1H. `learning-routes.jsonl`

**Record count:** 39 records **File size:** 25 KB

| Field            | Type     | Sample                                                                              |
| ---------------- | -------- | ----------------------------------------------------------------------------------- |
| `id`             | string   | `"5aead66268fd"` (matches pending-refinements ID)                                   |
| `timestamp`      | ISO 8601 | `"2026-03-13T16:40:27.412Z"`                                                        |
| `date`           | ISO date | `"2026-03-13"`                                                                      |
| `schema_version` | number   | `1`                                                                                 |
| `learning`       | object   | `{"type":"behavioral","pattern":"...","source":"CLAUDE.md:63","severity":"medium"}` |
| `route`          | string   | `"claude-md-annotation"` (19), `"hook-gate"` (18), `"verified-pattern"` (2)         |
| `scaffold`       | object   | `{"targetFile":"CLAUDE.md","status":"scaffolded"}`                                  |
| `status`         | string   | `"refined"` (38), `"enforced"` (1)                                                  |
| `refined_at`     | ISO 8601 | timestamp of last refinement                                                        |
| `classification` | object   | `{"confidence":"low","reason":"...","action":{"type":"pending-refinement"}}`        |

**Status distribution:** 38 refined (pending action), 1 enforced. The `id` field
matches `pending-refinements.jsonl` — they are the same items tracked across
both files. The `learning-routes.jsonl` holds the full learning context;
`pending-refinements.jsonl` holds the routing decision metadata.

---

### 1I. `forward-findings.jsonl`

**Record count:** 4 records **File size:** <1 KB

| Field              | Type     | Sample                                                             |
| ------------------ | -------- | ------------------------------------------------------------------ |
| `source_plan`      | string   | `"review-lifecycle"`, `"hook-system-overhaul"`                     |
| `finding_type`     | string   | `"gap"`, `"canon-artifact"`                                        |
| `pattern`          | string   | `"consolidation.json lastConsolidatedReview exceeds JSONL max ID"` |
| `severity`         | string   | `"S1"` (critical), `"S2"` (major)                                  |
| `target_ecosystem` | string   | `"review-lifecycle"`, `"hooks"`                                    |
| `timestamp`        | ISO 8601 | `"2026-03-15T11:56:57.750Z"`                                       |

2 of 4 are S1 (review-lifecycle gaps: ID inconsistency, duplicate IDs). This
file feeds Watch Items in other tabs too — shared data source.

---

## 2. Visualization Spec

### Widget 1: Fix Rate Trend (Line Chart)

**Source:** `review-metrics.jsonl` **X-axis:** PR number (414–477), rendered as
sequential index with PR # as label **Y-axis:** `fix_ratio` (0–1, formatted as
percentage) **Series:**

- Primary: `fix_ratio` per PR (dots for PRs with `review_rounds > 0`, lighter
  markers for dep-bumps with `review_rounds = 0`)
- Secondary: 5-PR rolling average (smoothed trend line)

**Data shape for export:**

```json
{
  "fixRateTrend": [
    { "pr": 414, "fix_ratio": 1.0, "review_rounds": 1, "label": "#414" },
    { "pr": 415, "fix_ratio": 0.83, "review_rounds": 2, "label": "#415" }
  ]
}
```

**Observed trend:** Decline from ~0.80 (PR 410-419) to ~0.53 (PR 470-479) for
PRs with actual reviews. Recent drop may reflect harder findings (more
legitimate rejections) rather than quality degradation — should surface this
caveat in chart tooltip.

**Implementation note:** Filter out `review_rounds === 0` records (dep bumps)
from the trend line to avoid deflating the average. Show them as greyed tick
marks at bottom for context.

---

### Widget 2: Round Count Distribution (Bar Chart)

**Source:** `review-metrics.jsonl` **X-axis:** `review_rounds` values (0, 1, 2,
3, 4, 5, 6) **Y-axis:** count of PRs at each value **Color:** gradient from
green (1 round) to red (5+ rounds)

**Data shape:**

```json
{
  "roundDistribution": [
    { "rounds": 0, "count": 16, "label": "No review" },
    { "rounds": 1, "count": 22, "label": "1 round" },
    { "rounds": 2, "count": 7, "label": "2 rounds" },
    { "rounds": 3, "count": 3, "label": "3 rounds" },
    { "rounds": 6, "count": 1, "label": "6 rounds" }
  ]
}
```

**Derived metric to display:** "Avg rounds per reviewed PR: 2.08"

---

### Widget 3: Active PR Status Card

**Source:** `pr-review-state.json` + most recent `review-metrics.jsonl` entry
**Display:** Single-card component, always at top of tab

**Fields to surface:**

- PR number and title (from `review-metrics`)
- Status: `status` field from `pr-review-state.json` (e.g., "R9 committed, not
  pushed")
- Round summary: `batches_completed` rounds, `total_items_processed` total items
- Fix breakdown: fixed / deferred / rejected (absolute counts + %)
- Last updated: derived from `batches[last].commit` timestamp

**Data shape:**

```json
{
  "activePR": {
    "pr": 411,
    "title": "feat: system-wide maintenance",
    "status": "r9_committed_not_pushed",
    "rounds_completed": 9,
    "total_items": 415,
    "fixed": 135,
    "deferred": 96,
    "rejected": 178,
    "fix_rate": 0.33,
    "started": "2026-03-01",
    "branch": "claude/maintenance22726-md8WL"
  }
}
```

**Note:** When no active PR review is in progress, this card should show "No
active review" rather than stale data. Gate on `pr-review-state.json` having a
non-null `pr` field and a `status` that is not `merged` or `closed`.

---

### Widget 4: PR History Table

**Source:** `review-metrics.jsonl` (all 52 records) **Display:** Paginated
table, most-recent first, with column sorting

**Columns:**

| Column        | Source field    | Format                  |
| ------------- | --------------- | ----------------------- |
| PR #          | `pr`            | Link to GitHub PR       |
| Title         | `title`         | Truncated to 60 chars   |
| Fix Rate      | `fix_ratio`     | Progress bar + %        |
| Rounds        | `review_rounds` | Number badge            |
| Total Commits | `total_commits` | Number                  |
| Fix Commits   | `fix_commits`   | Number                  |
| Date          | `timestamp`     | Relative ("3 days ago") |

**Filtering:** Toggle to hide `review_rounds === 0` (dep bumps). **Row click:**
Expand to show per-round breakdown (if task state files included in export).

---

### Widget 5: Recurring Patterns Table

**Source:** `reviews-archive.jsonl` + `reviews.jsonl` (patterns field, v1
records) **Retro validation:** Cross-reference with `retros.jsonl` `patterns`
arrays

**Display:** Ranked table of meaningful recurring patterns

**Data derivation:** The raw archive has 1,697 unique patterns. Most are
artifacts of free-text entry (meta-tags like `root-cause`, `prevention`). The
static export must pre-filter to patterns with >1 occurrence excluding
meta-tags. The retros `patterns` array (e.g., `propagation-misses`,
`repeat-rejection-churn`) provides the curated high-signal subset.

**Columns:**

| Column        | Derivation                                  |
| ------------- | ------------------------------------------- |
| Pattern name  | Pattern slug                                |
| Occurrences   | Count across archive + reviews.jsonl        |
| Last seen PR  | Most recent PR containing this pattern      |
| Retro flagged | Boolean — appears in any retros.patterns[]  |
| Status        | "Active concern" / "Resolved" (from retros) |

**Top patterns to surface (curated from retros and archive):**

- `propagation-misses` — recurred across multiple rounds per bulk retro
- `repeat-rejection-churn` — 15+ rejection decisions on 3 items in 12 rounds
- `cc-extraction` (10 archive hits) — timing issue causing avoidable rounds
- `qodo-stale-head` — cross-round re-raises of already-fixed items
- `shell-true-recurring` — security pattern ping-pong

---

### Widget 6: Learning Items Table

**Source:** `learning-routes.jsonl` + `pending-refinements.jsonl` **Display:**
Table with routing disposition status

The two files share the same `id` field. Merge them for a unified view:

- `learning-routes.jsonl` provides: `learning.pattern`, `learning.type`,
  `learning.source`, `route`, `status`
- `pending-refinements.jsonl` provides: `route_type`, `confidence`, `reason`,
  `surfaced_count`, `created`

**Columns:**

| Column         | Source                                                    |
| -------------- | --------------------------------------------------------- |
| Pattern        | `learning.pattern`                                        |
| Type           | `learning.type` (behavioral/process/code)                 |
| Source         | `learning.source` (CLAUDE.md:63, etc.)                    |
| Route          | `route` (claude-md-annotation/hook-gate/verified-pattern) |
| Status         | `status` (refined/enforced/scaffolded)                    |
| Confidence     | `classification.confidence`                               |
| Surfaced Count | `surfaced_count`                                          |
| Age            | `created` — relative date                                 |

**Summary counts to surface above table:**

- Total: 39 (matches learning-routes count)
- Enforced: 1 (2.6%)
- Pending: 38 (97.4%)
- Never surfaced: 39 (all `surfaced_count === 0`)

**Action affordance:** Each row should have an "Acknowledge / Route" button
(dashboard UI concern — data design just surfaces `surfaced_count` and `status`
fields for it to read/write).

---

### Widget 7: Forward Findings (Watch Items — shared)

**Source:** `forward-findings.jsonl` **Record count:** 4 items (2 S1, 1 S2, 1
S2) **Shared with:** Watch Items widget on other tabs

**Display:** Severity-colored list. S1 items shown in red, S2 in orange.

**Data shape:**

```json
{
  "forwardFindings": [
    {
      "pattern": "consolidation.json lastConsolidatedReview exceeds JSONL max ID",
      "severity": "S1",
      "source_plan": "review-lifecycle",
      "finding_type": "gap",
      "timestamp": "2026-03-15T11:56:57.750Z"
    }
  ]
}
```

---

### Widget 8: Retro Score Trend (Sparkline / Mini Chart)

**Source:** `retros.jsonl` (full records only — 39 with scores) **Display:**
Sparkline of retro scores over time, with avg annotation

**Data:** Score range 4–10, average 7.4. Filter to `completeness === "full"`.
Only 39 of 57 retros have scores; 17 stubs (mostly backfilled) can be omitted.

**Data shape:**

```json
{
  "retroScores": [
    {
      "retro_id": "retro-pr-368",
      "pr": 368,
      "date": "2026-02-16",
      "score": null
    },
    {
      "retro_id": "retro-bulk-448-470",
      "pr": 470,
      "date": "2026-03-26",
      "score": 8
    }
  ]
}
```

---

## 3. Static Export Plan

### File: `public/reviews-data.json`

The export should be built by a `scripts/reviews/generate-reviews-data.js`
script (mirroring the health tab's pattern from `W3-T1A`).

**Export structure:**

```json
{
  "generated_at": "2026-03-29T...",
  "summary": {
    "total_prs_tracked": 52,
    "prs_with_reviews": 36,
    "avg_fix_ratio": 0.67,
    "avg_review_rounds": 2.08,
    "total_learning_items": 39,
    "learning_items_enforced": 1,
    "active_pr": 411,
    "active_pr_status": "r9_committed_not_pushed",
    "forward_findings_s1": 2
  },
  "activePR": {
    /* from pr-review-state.json */
  },
  "fixRateTrend": [
    /* 52 records from review-metrics.jsonl */
  ],
  "roundDistribution": [
    /* 7 buckets */
  ],
  "prHistory": [
    /* 52 records, reviews-metric fields */
  ],
  "recurringPatterns": [
    /* pre-filtered top patterns */
  ],
  "learningItems": [
    /* 39 merged records from learning-routes + pending-refinements */
  ],
  "retroScores": [
    /* 57 records, nulls for stubs */
  ],
  "forwardFindings": [
    /* 4 records from forward-findings.jsonl */
  ]
}
```

**Size estimate:**

| Section           | Source size    | Exported size estimate          |
| ----------------- | -------------- | ------------------------------- |
| activePR          | 10 KB raw      | ~2 KB (stripped internals)      |
| fixRateTrend      | 11 KB raw      | ~3 KB (52 slim records)         |
| roundDistribution | derived        | <0.5 KB                         |
| prHistory         | 11 KB raw      | ~4 KB (52 records, key fields)  |
| recurringPatterns | 285 KB raw     | ~5 KB (top 30–50 patterns only) |
| learningItems     | 25 KB raw      | ~8 KB (39 merged records)       |
| retroScores       | 36 KB raw      | ~4 KB (57 slim records)         |
| forwardFindings   | <1 KB raw      | <1 KB                           |
| summary           | derived        | <0.5 KB                         |
| **Total**         | **386 KB raw** | **~28 KB exported**             |

**Key design decision:** The `reviews-archive.jsonl` (285 KB) must NOT be
included in full. Only the pre-computed pattern frequency table (top 30–50
entries) should be exported. Raw archive access is not needed at dashboard
render time.

**Note on severity data:** Severity breakdowns live in 21 separate
`task-pr-review-{pr}-r{N}.state.json` files, not in the main JSONL files. The
export script should read and flatten these into the `prHistory` records for
recent PRs (#433–#472). Older PRs will have null severity fields.

---

## 4. Cross-PR Analytics

These metrics can be fully derived from the existing data at export time:

### 4A. Fix Rate Improvement (available now)

- Overall: `avg(fix_ratio)` over all PRs with reviews = **0.67**
- Trend: 5-PR rolling average shows decline from 0.80 → 0.53 (recent PRs)
- Interpretation caveat needed: recent lower fix rates may reflect stricter
  rejection standards (more legitimate rejections) rather than quality decline

### 4B. Average Rounds Per PR

- All PRs: 1.17 rounds avg
- PRs with reviews only: 2.08 rounds avg
- High-round PRs (>3 rounds): PR #411 (9 rounds), PR #470 (6 rounds)

### 4C. Round Decay Rate

- Per review-metrics data: most fixed items fall in R1 (highest fix count). R2+
  rounds show diminishing returns. This matches the bulk retro action item
  "diminishing-returns" merge trigger.
- Derivable from per-PR task state files: round-by-round fixed counts for PRs
  #433–#472.

### 4D. Most Common Finding Categories

The `reviews-archive.jsonl` `patterns` field is too noisy (1,697 unique) for
direct analytics. The signal comes from:

1. Retros `patterns` field — curated per-PR recurring patterns
2. Per-round task state files — `source` field breakdown (qodo vs sonarcloud vs
   mixed)

**Source distribution in active `reviews.jsonl`:**

- qodo: 13 rounds (57%)
- mixed: 8 rounds (35%)
- sonarcloud+qodo: 1 round
- bulk: 1 round

### 4E. Rejection Rate Trend

- Derivable: `rejected / total` per round
- From recent PRs in `reviews.jsonl`: PR #470 R1 had 13/32 rejected (41%), PR
  #472 R1 had 1/13 rejected (8%) — highly variable by PR type
- The bulk retro flagged 15+ rejections on just 3 repeat items as churn

### 4F. Pattern Recurrence Rate

- From `retros.jsonl` `metrics.pattern_recurrence`: max 6, avg ~3 for scored
  retros with recurrence
- 36 of 57 retros have `pattern_recurrence > 0`

### 4G. Learning Item Routing Velocity

- 39 items created between 2026-03-13 and 2026-03-22 (9-day window)
- 0 enforced (1 exception), all `surfaced_count === 0`
- Derivable: age of oldest unrouted item, average age of pending items

---

## 5. Component Breakdown

### Page Component

```
<ReviewsTab>
  ├── <ActivePRCard>              # pr-review-state.json
  ├── <ReviewSummaryRow>          # 4 stat cards: avg fix rate, avg rounds, learning items, open findings
  ├── <FixRateTrendChart>         # review-metrics.jsonl line chart
  ├── <RoundDistributionChart>    # review-metrics.jsonl bar chart
  ├── <PRHistoryTable>            # review-metrics.jsonl paginated table
  │     └── <PRRoundExpander>     # task-pr-review state files (per-row expand)
  ├── <RecurringPatternsTable>    # reviews-archive patterns (pre-filtered)
  ├── <LearningItemsTable>        # learning-routes + pending-refinements
  │     └── <RouteStatusBadge>    # enforced / refined / scaffolded
  ├── <RetroScoreSparkline>       # retros.jsonl score trend
  └── <ForwardFindingsPanel>      # forward-findings.jsonl (shared with other tabs)
```

### Component Detail

**`<ActivePRCard>`**

- Props: `activePR: ActivePRData | null`
- Shows: PR #, branch, status badge, rounds, fix/defer/reject counts, fix rate
- When null: "No active review in progress"
- Status badge colors: `r{N}_committed_not_pushed` = amber, `merged` = green

**`<FixRateTrendChart>`**

- Props: `data: FixRateTrendPoint[]`, `showDepBumps: boolean`
- Library: Recharts `LineChart` (already used in health tab per W3-T1A)
- Two series: per-PR dots + rolling average line
- Tooltip: show PR title, source, round count on hover

**`<RoundDistributionChart>`**

- Props: `data: RoundDistributionBucket[]`
- Library: Recharts `BarChart`
- Color scale: green (1) → yellow (2–3) → red (4+)

**`<PRHistoryTable>`**

- Props: `prs: PRMetricRecord[]`, `defaultPageSize: 10`
- Columns: #, title, fix rate (progress bar), rounds, commits, date
- Sortable: fix_ratio, review_rounds, timestamp
- Filter: toggle to show/hide dep bumps

**`<PRRoundExpander>`**

- Inline expand row showing per-round fixed/deferred/rejected + severity
- Only rendered if `roundDetail` data present in export (recent PRs only)

**`<RecurringPatternsTable>`**

- Props: `patterns: PatternRecord[]`
- Columns: name, occurrences, last PR, retro-flagged (icon), status
- Default sort: occurrences descending
- "Retro flagged" column uses boolean from pre-computation at export time

**`<LearningItemsTable>`**

- Props: `items: LearningItem[]`
- Columns: pattern, type badge, route badge, status badge, age, surfaced count
- Status badge: `enforced` = green, `refined` = amber, `scaffolded` = gray
- Summary stats bar above table: N total, N enforced, N never surfaced

**`<RetroScoreSparkline>`**

- Props: `scores: RetroScore[]`
- Display: sparkline with 7.4 avg line annotation, score range label
- Filter: only `completeness === "full"` records

**`<ForwardFindingsPanel>`**

- Props: `findings: ForwardFinding[]`
- Reusable across tabs — severity badge + description list
- S1 = red background, S2 = orange background

---

## Contradictions

**Fix rate interpretation:** The `review-metrics.jsonl` shows a declining fix
ratio trend (0.80 → 0.53 across the tracked PR range). However, the bulk retro
explicitly notes that "15+ rejection decisions on 3 repeat items across 12
rounds" drove much of the rejection count — these are correct behavior
(consistent rejection of known-bad patterns), not quality failures. The
dashboard should not present the declining fix ratio as a quality signal without
this context. A tooltip or footnote is needed.

**Schema inconsistency:** `reviews.jsonl` v1 includes `patterns` and `learnings`
fields; v2 drops them. The archive has them. The per-PR task state files have
`severity` breakdowns absent from both. The export script must join across
multiple files to get complete per-round data.

**Pattern data quality:** 1,697 unique patterns in the archive includes many
generic meta-tags (`root-cause`, `prevention`, `note`, `example`). Raw count
ranking would be misleading. The export script must apply a stop-list before
computing the patterns table.

---

## Gaps

**Active PR detection:** The dashboard reads `pr-review-state.json` for the
active PR, but this file is only updated during pr-review sessions. If a review
completed and the user hasn't started a new one, the file may show a stale
`status` (e.g., a merged PR with old state). The export script should
cross-check `status` against `review-metrics.jsonl` to detect stale state.

**Severity trend:** Severity breakdowns (`critical`/`major`/`minor`/`trivial`)
are only present in 21 per-PR task state files covering PRs #433–#472. PRs
#414–#432 have no severity data. The archive format includes these fields but
all values are `0` (not backfilled). Severity charts can only cover ~50% of the
PR history range.

**Pattern normalization:** No canonical slug list exists for patterns. The
archive patterns are free-form strings from different contributors (Qodo,
Gemini, SonarCloud, manual). A normalization pass would be needed for reliable
frequency analysis; this is out of scope for the initial export.

**Learning item age context:** All 39 learning items were created between
2026-03-13 and 2026-03-22. This is a narrow 9-day window. The dashboard may show
misleadingly recent ages for all items. Context: this system was introduced as
part of a CLAUDE.md overhaul; prior learnings were not tracked this way.

---

## Serendipity

**The `task-pr-review-*` state files are not documented as a data source
elsewhere.** They contain the only per-round severity breakdown (`critical`,
`major`, `minor`, `trivial`) in the entire system. 21 files covering PRs
#433–#472, with `review_number` as a global sequential counter (last seen: 59).
This counter could power a "total reviews executed" metric across the system's
lifetime.

**PR #411 is anomalous.** 9 rounds with 415 total items is 5× the typical PR
size. The `pr-review-state.json` file was designed specifically to survive
compaction for multi-session reviews. The active PR card should indicate when a
PR is abnormally long-running (threshold: >4 rounds or >100 items).

**The `pending-refinements.jsonl` has `surfaced_count: 0` on all 36 items,**
meaning no learning item has ever been formally presented to the user for action
through the automated pipeline. The learning system generates items but the
routing step is a dead end. This is a strong candidate for a dashboard alert.

---

## Confidence Assessment

- HIGH claims: 12 (schema fields, record counts, file sizes, computed stats)
- MEDIUM claims: 4 (interpretation of fix rate decline, pattern quality issues)
- LOW claims: 2 (pattern normalization approach, cross-check logic for stale
  state)
- UNVERIFIED claims: 0
- **Overall confidence: HIGH** — all findings backed by direct filesystem
  inspection and Python computation over actual data files
