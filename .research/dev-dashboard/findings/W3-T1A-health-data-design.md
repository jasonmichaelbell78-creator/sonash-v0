# Findings: Health & Alerts Tab — Data Schema Analysis and UI Design

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** W3-T1A

---

## Key Findings

### 1. Ecosystem Health Log Schema (Primary Health Source) [CONFIDENCE: HIGH]

**File:** `data/ecosystem-v2/ecosystem-health-log.jsonl` **Record count:** 32
entries **Date range:** 2026-03-01 to 2026-03-27 **File size:** 438.5 KB (~13.7
KB per entry)

**Top-level schema:**

| Field             | Type       | Sample                                           | Notes                                                   |
| ----------------- | ---------- | ------------------------------------------------ | ------------------------------------------------------- |
| `timestamp`       | ISO string | `"2026-03-27T17:05:29.920Z"`                     | Full UTC datetime                                       |
| `mode`            | string     | `"full"`                                         | `"full"` or `"quick"`                                   |
| `score`           | number     | `67`                                             | 0-100 composite                                         |
| `grade`           | string     | `"D"`                                            | Letter grade A-F                                        |
| `categoryScores`  | object     | see below                                        | 8-9 categories, each with `score`, `grade`, `metrics[]` |
| `dimensionScores` | object     | see below                                        | 13 dimensions, each with `score`, `grade`, `detail{}`   |
| `summary`         | object     | `{errors:4, warnings:15, info:12}`               | Rolled-up severity counts                               |
| `delta`           | object     | `{previous_score:63, change:-1, trend:"stable"}` | Score change since prior entry                          |

**Categories (8-9, varies by run):**

| Category            | Latest Score | Latest Grade |
| ------------------- | ------------ | ------------ |
| Code Quality        | 92           | A            |
| Security            | 75           | C            |
| Technical Debt      | 22           | F            |
| Infrastructure      | 50           | F            |
| Process & Workflow  | 64           | D            |
| Testing             | 0            | F            |
| Learning & Patterns | 84           | B            |
| Documentation       | 71           | C            |
| Data Effectiveness  | 76           | C            |

**Dimensions (13):** `ts-health`, `eslint-compliance`, `pattern-enforcement`,
`vulnerability-status`, `debt-aging`, `debt-velocity`, `test-pass-rate`,
`learning-effectiveness`, `hook-pipeline-health`, `session-management`,
`documentation-freshness`, `review-quality`, `workflow-compliance`

**Why the file is large (438 KB / 32 entries):** Each entry embeds full
`metrics[]` arrays inside every category (benchmarks, ratings, raw values per
metric) AND full `detail{}` objects inside every dimension. The score + grade +
delta summary is only ~500 bytes per entry; the full payload is ~13.7 KB. The
static export MUST strip these arrays.

**Score history (all 32 entries):** Ranges D/62 to D/69, with two F/59 dips on
2026-03-11. No A/B grade achieved in the tracked period. The project is
consistently "D-range" with technical debt and testing dragging the composite.

---

### 2. Health Score Log Schema (Session-Start Secondary Source) [CONFIDENCE: HIGH]

**File:** `.claude/state/health-score-log.jsonl` **Record count:** 24 entries
**File size:** 18.1 KB (~754 bytes per entry — lean)

**Top-level schema:**

| Field            | Type        | Sample                             | Notes                                   |
| ---------------- | ----------- | ---------------------------------- | --------------------------------------- |
| `timestamp`      | ISO string  | `"2026-03-26T15:08:29.954Z"`       | Full UTC datetime                       |
| `mode`           | string      | `"full"`                           | Always `"full"` in sample               |
| `grade`          | string      | `"B"`                              | Letter grade                            |
| `score`          | number      | `87`                               | 0-100 composite                         |
| `summary`        | object      | `{errors:4, warnings:15, info:12}` | Same shape as above                     |
| `categoryScores` | flat object | `{code:60, security:70, ...}`      | 37 flat numeric scores (no `metrics[]`) |

**Key structural difference from ecosystem-health-log:** `categoryScores` here
is a flat `{ [key: string]: number | null }` map with 37 short-name keys (e.g.,
`code`, `security`, `hook-health`, `velocity`, `review-quality`). Many values
are `null` when the checker hasn't run (first entry: 5 nulls out of 29). The
latest entry has 37 keys covering a much broader category set than
ecosystem-health-log.

**Latest score:** B/87 on 2026-03-26 — significantly different from
ecosystem-health-log's D/67 on 2026-03-27. These two systems score differently:
health-score-log runs the `/health-check` script (37 process/workflow
categories, session-context aware), while ecosystem-health-log runs the
ecosystem orchestrator (8 technical categories — debt, code quality, testing,
etc.).

---

### 3. Warnings Schema — Lifecycle State Machine [CONFIDENCE: HIGH]

**File:** `data/ecosystem-v2/warnings.jsonl` **Record count:** 16 entries **File
size:** 6.1 KB

**Schema:**

| Field                  | Type           | Sample                                       | Notes                             |
| ---------------------- | -------------- | -------------------------------------------- | --------------------------------- |
| `id`                   | string         | `"warn-1773224172235-debt-aging"`            | Format: `warn-{epoch}-{category}` |
| `date`                 | date string    | `"2026-03-11"`                               | YYYY-MM-DD, no time               |
| `schema_version`       | number         | `1`                                          | Schema versioning                 |
| `completeness`         | string         | `"full"`                                     | Data quality flag                 |
| `completeness_missing` | array          | `[]`                                         | Missing fields list               |
| `origin`               | object         | `{type:"manual", tool:"health-check"}`       | Source of warning                 |
| `category`             | string         | `"debt-aging"`                               | Warning category                  |
| `message`              | string         | `"debt-aging scored F/25 — below threshold"` | Human-readable                    |
| `severity`             | string         | `"error"` / `"warning"`                      | Two-level severity                |
| `lifecycle`            | string         | `"new"` / `"resolved"`                       | State machine state               |
| `resolved_date`        | string or null | `"2026-03-23"`                               | Date resolved, null if open       |
| `source_script`        | string         | `"health-check"`                             | Originating script                |
| `related_ids`          | null or array  | `null`                                       | Cross-reference to other warnings |

**Lifecycle states found:** `new` (6 open), `resolved` (10 resolved)
**Categories in file:** `debt-aging`, `debt-velocity`, `hook-pipeline-health`,
`pattern-enforcement`, `review-quality`, `session-management`, `test-pass-rate`,
`workflow-compliance` **Severity breakdown:** `error` (more severe categories),
`warning` (D-grade categories)

---

### 4. Hook Warnings Log Schema — Flat Event Stream [CONFIDENCE: HIGH]

**File:** `.claude/state/hook-warnings-log.jsonl` **Record count:** 87 entries
**File size:** 27.2 KB

**Schema:**

| Field                   | Type           | Sample                                                         | Notes                      |
| ----------------------- | -------------- | -------------------------------------------------------------- | -------------------------- |
| `hook`                  | string         | `"pre-push"` / `"pre-commit"` / `"pre-tool"`                   | Which hook fired           |
| `type`                  | string         | `"trigger"` / `"firestore-rules-guard"` / `"deploy-safeguard"` | Behavioral category        |
| `severity`              | string         | `"warning"` / `"info"` / `"error"`                             | Three-level severity       |
| `message`               | string         | `"WARNING TRIGGERS (recommended actions):"`                    | Human-readable             |
| `action`                | null or string | `null`                                                         | Required action, if any    |
| `timestamp`             | ISO string     | `"2026-03-24T16:46:16.186Z"`                                   | Full UTC datetime          |
| `occurrences`           | number         | `9`                                                            | Total lifetime occurrences |
| `occurrences_since_ack` | number         | `9`                                                            | Since last acknowledgment  |
| `actor`                 | string         | `"hook-system"`                                                | Who generated the warning  |
| `user`                  | string         | `"jason"` / `"jbell"`                                          | User context               |
| `outcome`               | string         | `"warned"`                                                     | What happened              |

**Hook breakdown:** `pre-tool` (37), `pre-push` (27), `pre-commit` (16),
`post-tool` (2), `loop-detector` (3), `test-tracker` (1) **Type breakdown:**
`firestore-rules-guard` (18), `deploy-safeguard` (14), `trigger` (19),
`propagation-staged` (10), `pr-creep` (4), `network-error` (4),
`settings-guardian` (3), `governance` (2), `error-loop` (3), `reviewer` (3),
`missing-tool` (1), `agent` (1), `audit` (1), `large-file-gate` (2),
`test-failure` (1) **Severity:** warning (42), error (36), info (9)

**Key structural difference from warnings.jsonl:** No `id`, no `lifecycle`, no
`date` (has `timestamp`), no `category`. This is a raw event log; warnings.jsonl
is the curated state machine.

---

### 5. Lifecycle Scores Schema [CONFIDENCE: HIGH]

**File:** `.claude/state/lifecycle-scores.jsonl` **Record count:** 20 entries
**File size:** 9.8 KB

**Schema:**

| Field                  | Type           | Sample                                           | Notes                                         |
| ---------------------- | -------------- | ------------------------------------------------ | --------------------------------------------- |
| `id`                   | string         | `"ls-004"`                                       | Sequential ID                                 |
| `date`                 | date string    | `"2026-03-13"`                                   | Assessment date                               |
| `schema_version`       | number         | `1`                                              | Schema version                                |
| `completeness`         | string         | `"full"`                                         | Data quality                                  |
| `completeness_missing` | array          | `[]`                                             | Missing fields                                |
| `system`               | string         | `"Technical Debt"`                               | System name (display)                         |
| `category`             | string         | `"technical-debt"`                               | Slug for programmatic use                     |
| `files`                | array          | `["docs/technical-debt/MASTER_DEBT.jsonl", ...]` | Files supporting this system                  |
| `capture`              | number         | `3`                                              | Score 1-3: how well data is captured          |
| `storage`              | number         | `3`                                              | Score 1-3: how well data is stored            |
| `recall`               | number         | `2`                                              | Score 1-3: how well data is retrieved         |
| `action`               | number         | `2`                                              | Score 1-3: how well data drives action        |
| `total`                | number         | `10`                                             | Sum of capture+storage+recall+action (max 12) |
| `gap`                  | string         | `"Minor: debt resolution pipeline..."`           | Known gap description                         |
| `remediation`          | string or null | `null`                                           | Planned fix                                   |
| `wave_fixed`           | string or null | `"W4"`                                           | Which wave addressed this                     |

**Score range observed:** 5 (`ls-019`) to 10 (`ls-004`, `ls-012`). Max possible
is 12.

**Systems covered (all 20):** Pattern Rules (9), Review Learnings (7), Retro
Findings (8), Technical Debt (10), Hook Warnings (8), Override Audit Trail (7),
Health Scores (8), Behavioral Rules (9), Security Checklist (7), Fix Templates
(7), Memory (8), Session Context (10), Agent Tracking (7), Velocity Tracking
(9), Commit Log (8), Learning Routes (9), Planning Data (6), Audit Findings (6),
Aggregation Data (5), Ecosystem Deferred Items (6)

---

### 6. Enforcement Manifest Schema — Pattern Gate Coverage [CONFIDENCE: HIGH]

**File:** `data/ecosystem-v2/enforcement-manifest.jsonl` **Record count:** 360
entries **File size:** 119.6 KB

**Schema:**

| Field           | Type        | Sample                                                           | Notes                                                  |
| --------------- | ----------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| `pattern_id`    | string      | `"error-sanitization"`                                           | Unique slug                                            |
| `pattern_name`  | string      | `"Error Sanitization"`                                           | Display name                                           |
| `priority`      | string      | `"critical"` / `"important"` / `"edge"`                          | Three-tier priority                                    |
| `category`      | string      | `"Critical Patterns"`                                            | 13 categories                                          |
| `mechanisms`    | object      | `{regex:"none", eslint:"active:...", semgrep:"active:...", ...}` | Per-mechanism status; `"none"` or `"active:rule-name"` |
| `coverage`      | string      | `"automated"` / `"manual-only"` / `"ai-assisted"`                | Rollup coverage level                                  |
| `status`        | string      | `"active"`                                                       | Pattern status                                         |
| `last_verified` | date string | `"2026-03-01"`                                                   | Last verification date                                 |

**Mechanisms tracked:** `regex`, `eslint`, `semgrep`, `cross_doc`, `hooks`,
`ai`, `manual`

**Coverage breakdown (360 total):**

- `automated`: 62 (17.2%)
- `manual-only`: 297 (82.5%)
- `ai-assisted`: 1 (0.3%)

**Priority breakdown:**

- `critical`: 87 (24.2%)
- `important`: 247 (68.6%)
- `edge`: 26 (7.2%)

**Category automation rates:**

- Critical Patterns: 100% automated (5/5) — all 5 are fully gated
- Security: 22% (20/90) — largest category, mostly manual
- JavaScript/TypeScript: 23% (18/78)
- GitHub Actions: 0% (0/14) — entirely manual
- Documentation: 3% (1/30) — near entirely manual
- npm/Dependencies: 0% (0/5) — entirely manual

**Critical finding:** Only 17% of patterns are automated gates. 82.5% rely on
manual review or AI suggestion. Among critical-priority patterns, only 5 of 87
are fully automated.

---

## Dual Health Log Resolution

### The Two Systems [CONFIDENCE: HIGH]

| Attribute       | `ecosystem-health-log.jsonl`                       | `health-score-log.jsonl`                                          |
| --------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| Location        | `data/ecosystem-v2/`                               | `.claude/state/`                                                  |
| Record count    | 32                                                 | 24                                                                |
| Size            | 438 KB                                             | 18 KB                                                             |
| Categories      | 8-9 technical (Code Quality, Security, Debt, etc.) | 37 process/workflow (hook-health, velocity, review-quality, etc.) |
| Category format | `{score, grade, metrics[]}` (rich)                 | `{[key]: number \| null}` (flat)                                  |
| Trend field     | `delta.{previous_score, change, trend}`            | Not present                                                       |
| Triggered by    | `/ecosystem-health` skill, ecosystem orchestrator  | `session-start` hook (quick mode)                                 |
| Latest score    | D/67 (2026-03-27)                                  | B/87 (2026-03-26)                                                 |
| Confirmed by    | `SQ1c-3` findings (Layer B orchestrator)           | `SQ1c-3` findings (Layer A health check)                          |

**They measure different things.** Ecosystem-health-log measures artifact
quality (code, debt, tests). Health-score-log measures process health (are
sessions being managed well? are hooks working? is learning captured?). The D/67
vs B/87 split is real and meaningful, not a data error.

**Recommendation:** Treat both as canonical for different facets. Do NOT pick
one or discard the other.

- `ecosystem-health-log.jsonl` = **Technical Health** (the "what is the code
  like" score)
- `health-score-log.jsonl` = **Process Health** (the "how is the workflow being
  followed" score)

Display both on the Health & Alerts tab, labeled distinctly. A user seeing only
D/67 without B/87 context would misread the dashboard.

---

## Warning Aggregation Strategy

### Join Key and Deduplication [CONFIDENCE: HIGH]

The two warning systems have incompatible schemas. They cannot be joined on a
shared key — there is no `id` in hook-warnings-log, and no `timestamp` (only
`date`) in warnings.jsonl. Unification requires a **normalization layer**, not a
join.

**Proposed unified warning shape:**

```typescript
interface UnifiedWarning {
  // Normalized identity
  displayId: string; // warnings.jsonl: id field; hook-warnings: "{hook}-{type}-{epoch}"
  source: "lifecycle" | "hook"; // which system it came from

  // Shared display fields
  timestamp: string; // ISO datetime; warnings.jsonl uses date string, pad to midnight UTC
  severity: "error" | "warning" | "info";
  message: string;
  category: string; // warnings.jsonl: category field; hook-warnings: type field

  // Lifecycle state (lifecycle warnings only)
  lifecycle?: "new" | "resolved";
  resolvedDate?: string;

  // Hook context (hook warnings only)
  hook?: string; // pre-commit, pre-push, pre-tool, etc.
  occurrences?: number;
  occurrencesSinceAck?: number;
  user?: string;
}
```

**Deduplication strategy:**

- Hook warnings do NOT have a `lifecycle` concept — they are raw events. The
  same warning type can appear 10+ times (e.g., `firestore-rules-guard` appears
  18 times).
- For the unified feed: **deduplicate hook warnings by `{hook}-{type}`, keeping
  the most recent entry and using `occurrences_since_ack` as a badge count.**
  This collapses 87 raw events into ~15 distinct warning types.
- Lifecycle warnings are already deduplicated (one entry per category per
  occurrence window). Show all open lifecycle warnings; resolved ones are
  archive-only.

**Default feed sort order:** `severity` (error first) then `timestamp` (newest
first) within severity tier.

**Active vs historical filter:**

- Lifecycle warnings: `lifecycle === "new"` = active; `lifecycle === "resolved"`
  = historical
- Hook warnings: all are "active" by nature (no lifecycle tracking); show with
  `occurrences_since_ack` badge

---

## Visualization Spec

### Widget Inventory for Health & Alerts Tab

| Widget                          | Data Source                                            | Chart Type                               | Notes                                                                                     |
| ------------------------------- | ------------------------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Technical Health Grade Card     | `ecosystem-health-log` (latest entry)                  | KPI Card                                 | Grade letter (D), score (67/100), delta badge (+/-N, trend arrow), timestamp              |
| Process Health Grade Card       | `health-score-log` (latest entry)                      | KPI Card                                 | Grade letter (B), score (87/100), summary.errors/warnings counts                          |
| Technical Health Trend          | `ecosystem-health-log` (all 32 entries)                | Sparkline / mini line chart              | Score over time, date range 2026-03-01 to 2026-03-27                                      |
| Category Scorecards (Technical) | `ecosystem-health-log` (latest categoryScores)         | Horizontal bar chart or badge grid       | 9 categories, color-coded by grade (A=green, F=red)                                       |
| Category Scorecards (Process)   | `health-score-log` (latest categoryScores)             | Heatmap or badge grid                    | 37 categories (too many for bars — heatmap preferred), null = gray                        |
| Warning Feed                    | `warnings.jsonl` + `hook-warnings-log.jsonl` (unified) | Sorted list / feed                       | Grouped by severity; open lifecycle warnings + deduplicated hook warnings                 |
| Lifecycle Score Matrix          | `lifecycle-scores.jsonl` (all 20 entries)              | Table or radar/spider                    | 20 systems x 4 dimensions (capture/storage/recall/action), total score as sortable column |
| Pattern Gate Coverage           | `enforcement-manifest.jsonl` (all 360 entries)         | Stacked bar per category + summary donut | Auto% per category; donut showing 17% automated / 82% manual overall                      |

**Specific chart decisions:**

- **Technical Health Trend:** Use a line chart with 32 data points, x-axis =
  date, y-axis = 0-100. Mark the two F/59 dips (2026-03-11) with a different
  color. Average line at ~64 shows stability.
- **Category Scorecards (Technical):** 9 items — horizontal bar chart is
  readable. Color bands: A (green, 90+), B (teal, 80-89), C (yellow, 70-79), D
  (orange, 60-69), F (red, <60).
- **Category Scorecards (Process):** 37 items is too many for bars. Use a
  compact heatmap grid (6-7 columns x 6 rows). Nulls render as light gray. Sort
  by score ascending to surface worst first.
- **Lifecycle Score Matrix:** Table with columns: System, Category, Capture,
  Storage, Recall, Action, Total, Wave. Sortable by Total. Color the Total
  column (10+ = green, 7-9 = yellow, <7 = red). Max possible is 12.
- **Pattern Gate Coverage:** Two views — a per-category stacked bar (auto vs
  manual count per category) and a summary donut (17% auto / 82% manual / 0.3%
  AI across 360 patterns). Filter by priority (critical/important/edge).

---

## Static Export Plan

### `public/health-data.json` Field Selection

**Goal:** Static file fetched by the Next.js dashboard. Must be small enough for
fast page load. Estimated production update: on each `/ecosystem-health` run or
daily cron.

**Size analysis of raw files:**

- `ecosystem-health-log.jsonl`: 438 KB (bulk due to embedded `metrics[]` and
  `detail{}`)
- `enforcement-manifest.jsonl`: 120 KB (360 entries, metadata-heavy)
- `health-score-log.jsonl`: 18 KB (lean flat format)
- `hook-warnings-log.jsonl`: 27 KB (87 raw events, deduplicatable to ~15)
- `lifecycle-scores.jsonl`: 10 KB (20 entries, already compact)
- `warnings.jsonl`: 6 KB (16 entries, already compact)

**Total raw: ~619 KB. Target exported: <50 KB.**

**Export field plan:**

```json
{
  "generated": "ISO timestamp",
  "technicalHealth": {
    "latest": {
      "timestamp": "...",
      "score": 67,
      "grade": "D",
      "delta": { "previous_score": 63, "change": -1, "trend": "stable" },
      "summary": { "errors": 4, "warnings": 15, "info": 12 },
      "categoryScores": {
        "Code Quality": { "score": 92, "grade": "A" },
        "..."
      },
      "dimensionScores": {
        "ts-health": { "score": 88, "grade": "B" },
        "..."
      }
    },
    "history": [
      { "timestamp": "2026-03-01", "score": 63, "grade": "D" }
    ]
  },
  "processHealth": {
    "latest": {
      "timestamp": "...",
      "score": 87,
      "grade": "B",
      "summary": { "errors": 4, "warnings": 15, "info": 12 },
      "categoryScores": { "code": 60, "security": 70, "..." }
    }
  },
  "warnings": {
    "lifecycle": [ /* all 16 entries, full schema — 6.1 KB */ ],
    "hooks": [ /* deduplicated to ~15 entries, ~3 KB */ ]
  },
  "lifecycleScores": [ /* all 20 entries, no metrics[] to strip — 10 KB */ ],
  "patternGateSummary": {
    "total": 360,
    "automated": 62,
    "manualOnly": 297,
    "aiAssisted": 1,
    "byCategory": {
      "Security": { "total": 90, "automated": 20, "manualOnly": 70 },
      "..."
    },
    "byPriority": {
      "critical": { "total": 87, "automated": 5 },
      "important": { "total": 247, "automated": 56 },
      "edge": { "total": 26, "automated": 1 }
    }
  }
}
```

**What is stripped from `ecosystem-health-log`:** `categoryScores[*].metrics[]`
(benchmark arrays), `dimensionScores[*].detail{}` (per-metric detail). Only
`score` and `grade` per category/dimension are kept.

**History retention:** Full 32-entry score+grade array for the trend chart —
~200 bytes per entry stripped of metrics = ~6.4 KB.

**Enforcement manifest:** Do NOT include raw 360-entry manifest. Export only the
pre-aggregated `byCategory` and `byPriority` summary (~3 KB).

**Estimated exported size: ~30-35 KB** (within target).

---

## Component Breakdown

### React Components for Health & Alerts Tab

```
<HealthAlertsTab>
  ├── <HealthGradeRow>                     — Side-by-side KPI cards
  │     ├── <HealthGradeCard type="technical">   — D/67, delta, last run time
  │     └── <HealthGradeCard type="process">     — B/87, summary counts
  │
  ├── <TechnicalHealthTrend>               — Line chart, 32 data points
  │     └── uses: technicalHealth.history[]
  │
  ├── <CategoryScorecardSection>           — Two sub-panels
  │     ├── <CategoryBarChart title="Technical (8 categories)">
  │     │     └── uses: technicalHealth.latest.categoryScores
  │     └── <CategoryHeatmap title="Process (37 categories)">
  │           └── uses: processHealth.latest.categoryScores
  │
  ├── <UnifiedWarningFeed>                 — Combined warning list
  │     ├── <WarningFilterBar>             — Filter: source, severity, lifecycle
  │     ├── <WarningItem type="lifecycle"> — with lifecycle badge (new/resolved)
  │     └── <WarningItem type="hook">      — with occurrences badge, hook name
  │
  ├── <LifecycleScoreMatrix>               — Table of 20 systems
  │     ├── <ScoreMatrixRow>               — System row with 4 dimension scores
  │     └── <ScoreMatrixSortBar>           — Sort by dimension or total
  │
  └── <PatternGateCoverage>               — Coverage overview
        ├── <CoverageSummaryDonut>         — 17% auto / 82% manual / 0.3% AI
        ├── <CategoryCoverageBar>          — Stacked bars per category
        └── <PriorityFilterTabs>          — Filter: all / critical / important / edge
```

**Props contract for `HealthGradeCard`:**

```typescript
interface HealthGradeCardProps {
  type: "technical" | "process";
  grade: string;
  score: number;
  delta?: { change: number; trend: "stable" | "improving" | "degrading" };
  summary?: { errors: number; warnings: number; info: number };
  lastRunAt: string;
}
```

**Props contract for `UnifiedWarningFeed`:**

```typescript
interface UnifiedWarningFeedProps {
  lifecycleWarnings: LifecycleWarning[]; // from warnings.jsonl
  hookWarnings: HookWarning[]; // from hook-warnings-log.jsonl (deduplicated)
  defaultFilter?: "active" | "all"; // default: "active"
}
```

---

## Contradictions

**Contradiction 1: Composite score interpretation**

`ecosystem-health-log` reports D/67 on 2026-03-27. `health-score-log` reports
B/87 on 2026-03-26. These are genuinely different measurement systems measuring
different aspects. The dashboard must label each clearly or users will be
confused. The SQ1c-3 findings confirm these are intentionally separate systems
(Layer A vs Layer B in the three-layer architecture).

**Contradiction 2: Pattern gate "critical" automation claim vs reality**

The CLAUDE.md Section 5 lists "Top 5 (enforced by `npm run patterns:check`)"
critical patterns, implying they are well-covered. The enforcement manifest
shows only 5 of 87 critical-priority patterns are automated (5.7% of critical).
The 5 "top" patterns are fully automated, but the remaining 82 critical-priority
patterns are manual-only or AI-assisted. The dashboard should show this nuance:
"5 critical patterns gate-enforced; 82 critical patterns manual review only."

---

## Gaps

1. **No `lifecycle` field in hook-warnings-log:** There is no way to mark a hook
   warning as "resolved" — it is a raw append-only event log. The deduplication
   strategy (collapse by `{hook}-{type}`, use `occurrences_since_ack` as badge)
   is a UI-layer approximation, not data-layer resolution.

2. **No history for `health-score-log` categories over time:** The file has only
   the flat score per category per entry; there is no `delta` field. Trend
   analysis for process health (e.g., "did `hook-health` improve this week?")
   would require the dashboard to compute deltas at read time from the 24-entry
   history.

3. **`enforcement-manifest.jsonl` `last_verified` is stale:** All 360 entries
   show `last_verified: "2026-03-01"`. The static export plan assumes this is a
   periodic snapshot; there is no mechanism to know if patterns have been added
   or removed since March 1.

4. **No per-dimension trend in `ecosystem-health-log`:** The `delta` field only
   tracks composite score change. Individual dimension/category trends are not
   pre-computed. The dashboard must compute these from the 32-entry history at
   build time.

5. **`hook-warnings-log.jsonl` `message` field is generic:** Many hook warning
   messages are `"WARNING TRIGGERS (recommended actions):"` — they describe the
   warning class, not the specific trigger. Actionable detail is likely in the
   hook output but not captured in this log. The warning feed may need to
   surface `type` and `hook` as the primary identifier instead of `message`.

---

## Serendipity

**Serendipitous finding: The B/87 vs D/67 gap is a communication opportunity.**
The project scores dramatically differently depending on which health system you
look at. Process/workflow is in good shape (B/87) but technical artifact quality
is poor (D/67 dragged by Testing:0/F, Technical Debt:22/F). A well-designed
dashboard should make this split obvious and actionable rather than hiding it
behind a single composite.

**Serendipitous finding: Testing:0/F is an outlier.** The Testing category in
ecosystem-health-log scores 0 out of 100 at every data point. This appears to be
a data collection failure (the test runner isn't being invoked or isn't
returning data) rather than a genuine 0% pass rate. If true, it is suppressing
the composite score by approximately 5-8 points. This is worth flagging in the
dashboard as "data gap" rather than "critical failure."

---

## Sources

| #   | Path                                                               | Title                           | Type         | Trust | CRAAP        | Date       |
| --- | ------------------------------------------------------------------ | ------------------------------- | ------------ | ----- | ------------ | ---------- |
| 1   | `data/ecosystem-v2/ecosystem-health-log.jsonl`                     | Ecosystem Health Log            | filesystem   | HIGH  | 5/5/5/5/5=25 | 2026-03-27 |
| 2   | `.claude/state/health-score-log.jsonl`                             | Session Health Score Log        | filesystem   | HIGH  | 5/5/5/5/5=25 | 2026-03-26 |
| 3   | `data/ecosystem-v2/warnings.jsonl`                                 | Lifecycle Warning State Machine | filesystem   | HIGH  | 5/5/5/5/5=25 | 2026-03-27 |
| 4   | `.claude/state/hook-warnings-log.jsonl`                            | Hook Warning Event Log          | filesystem   | HIGH  | 5/5/5/5/5=25 | 2026-03-27 |
| 5   | `.claude/state/lifecycle-scores.jsonl`                             | Data Lifecycle Scores           | filesystem   | HIGH  | 5/5/5/5/5=25 | 2026-03-13 |
| 6   | `data/ecosystem-v2/enforcement-manifest.jsonl`                     | Pattern Enforcement Manifest    | filesystem   | HIGH  | 5/5/5/5/5=25 | 2026-03-01 |
| 7   | `.research/dev-dashboard/findings/SQ1c-3-process-health-audits.md` | Health Process Context          | findings doc | HIGH  | 5/5/5/5/5=25 | 2026-03-29 |

---

## Confidence Assessment

- HIGH claims: 6
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are derived directly from filesystem inspection of the actual data
files with record-level schema verification. No training data or web sources
were consulted. File sizes, record counts, field names, and sample values are
verified.
