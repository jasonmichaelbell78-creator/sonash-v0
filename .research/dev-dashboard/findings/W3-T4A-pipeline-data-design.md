# Findings: Build Pipeline & Process Compliance Tab — Data Design

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** W3-T4A

---

## 1. Data Schema Analysis

### hook-runs.jsonl (120 records, 2026-03-18 to 2026-03-29)

```
{
  "hook": "pre-commit" | "pre-push",
  "timestamp": "2026-03-18T02:31:58.567Z",       // ISO 8601
  "branch": "feat/github-optimization",
  "commit": "84a68fbd",                            // short hash of last known commit
  "total_checks": 13 | 12,                         // pre-commit=13-14, pre-push=12-13
  "checks": [
    { "id": "secrets-scan", "status": "pass|fail|warn|skip|auto-fix", "duration_ms": 549 }
  ],
  "total_duration_ms": 57838,
  "outcome": "pass" | "warn" | "fail",
  "skipped_checks": ["audit-s0s1", "skill-validation", ...],
  "warnings": 1,
  "errors": 0
}
```

**Pre-commit check IDs (14):** `agent-compliance`, `audit-s0s1`,
`cross-doc-deps`, `debt-schema`, `doc-headers`, `doc-index`, `eslint`,
`jsonl-md-sync`, `lint-staged`, `pattern-compliance`, `propagation-staged`,
`secrets-scan`, `skill-validation`, `tests`

**Pre-push check IDs (13):** `circular-deps`, `code-reviewer-gate`,
`cognitive-cc`, `cyclomatic-cc`, `escalation-gate`, `hook-tests`, `npm-audit`,
`pattern-compliance-push`, `propagation`, `security-check`, `triggers`, `tsc`,
`type-check`

**No check ID is shared between pre-commit and pre-push** — they are fully
disjoint sets.

**Status values observed:** `pass`, `warn`, `fail`, `skip`, `auto-fix` (Note:
`fail` appears in schema documentation but zero `fail` records exist in the
current 120-record dataset — all actual failures result in `outcome: fail` but
individual check statuses are `warn` at worst in this window.)

### commit-log.jsonl (634 records, 2026-02-27 to 2026-03-29)

```
{
  "timestamp": "2026-02-27T16:30:00Z",
  "hash": "f34422cc612be86e34458b4e5b9d0fd4bf46e7b8",
  "shortHash": "f34422cc",
  "message": "docs: add deep-plan implementation plan...",
  "author": "jasonmichaelbell78-creator",
  "authorDate": "2026-02-27T16:30:00Z",
  "branch": "seeded",                  // ALL 634 records — seeder artifact, not real branch
  "filesChanged": 0,                   // ALL 634 records — seeder limitation
  "filesList": [],
  "session": null,                     // ALL 634 records — not captured by seeder
  "seeded": true                       // ALL 634 records
}
```

**Critical data quality finding:** Every single commit-log record has
`seeded: true`, `branch: "seeded"`, `filesChanged: 0`, and `session: null`. The
live `commit-tracker.js` hook produces richer records (with real branch,
filesChanged, session ID), but none are present in the current log — only the
historical seeding script ran. Real git history does contain branch data
(visible in `git log`), but commit-log.jsonl does not reflect it.

**Commit message prefix distribution (top 10):** `fix:` (205), `feat:` (109),
`chore:` (73), `docs:` (49), `chore(deps):` (16), `checkpoint:` (13),
`chore(ci):` (11), `refactor:` (9)

### agent-invocations.jsonl (97 records, 2026-03-25 to 2026-03-29)

```
{
  "agent": "code-reviewer",
  "description": "Review script changes",
  "sessionId": "session-1774395645045",    // Unix timestamp-based ID
  "timestamp": "2026-03-25T00:09:15.907Z"
}
```

**Agent distribution:** `general-purpose` (37), `deep-research-searcher` (26),
`explore` (12), `Explore` (9), `code-reviewer` (7), `deep-research-synthesizer`
(4), `claude-code-guide` (2)

Note: `explore` and `Explore` are the same agent with inconsistent casing —
requires normalization before display.

**Unique sessions:** 8 sessions (all from 2026-03-25 to 2026-03-29)

### override-log.jsonl (33 records, 2026-03-21 to 2026-03-29)

```
{
  "timestamp": "2026-03-21T14:51:29.639Z",
  "check": "tests",
  "reason": "phase-complete-check home-dir-exposure test fails on both HEAD...",
  "user": "Owner",                    // "Owner", "redacted", or locale name
  "cwd": "C:\\Users\\Owner\\workspace\\sonash",
  "git_branch": "housecleaning"
}
```

**Override distribution by check:** `reviewer` (12), `doc-header` (12),
`triggers` (5), `cross-doc-deps` (2), `tests` (1), `propagation` (1)

Note: `doc-header` in override-log maps to `doc-headers` in hook-runs checks.
`reviewer` maps to `code-reviewer-gate`.

### hook-warnings-log.jsonl (87 records, 2026-03-14 to 2026-03-29)

```
{
  "hook": "pre-push" | "pre-commit" | "pre-tool" | "post-tool" | ...,
  "type": "trigger" | "firestore-rules-guard" | "deploy-safeguard" | ...,
  "severity": "warning" | "error" | "info",
  "message": "WARNING TRIGGERS (recommended actions):",
  "action": null | "string suggestion",
  "timestamp": "2026-03-14T23:26:53.874Z",
  "occurrences": 11,
  "occurrences_since_ack": 11,
  "actor": "hook-system",
  "user": "jason" | "jbell" | "redacted" | "unknown",
  "outcome": "warned"
}
```

**Warning type distribution:** `trigger` (19), `firestore-rules-guard` (18),
`deploy-safeguard` (14), `propagation-staged` (10), `pr-creep` (4),
`network-error` (4), `reviewer` (3), `settings-guardian` (3), `error-loop` (3),
others (<3 each)

**By hook:** `pre-tool` (37), `pre-push` (27), `pre-commit` (16),
`loop-detector` (3), `post-tool` (2)

**Severity:** `warning` (42), `error` (36), `info` (9)

### velocity-log.jsonl (50 records, sessions 148–243)

```
{
  "session": 148,
  "date": "2026-02-11",
  "items_completed": 0,
  "item_ids": [],
  "tracks": [],
  "sprint": "M1 - Foundation** | Complete | 100% | ..."
}
```

**Confirmed broken:** `items_completed` is `0` across all 50 records. `item_ids`
and `tracks` are empty arrays universally. Sessions span #148 to #243 (no
session >= #244 present). The `sprint` field incorrectly contains full markdown
table row text, not a clean sprint name.

---

## 2. Visualization Spec

### 2.1 Hook Compliance Heatmap

**Purpose:** Show which checks are persistently problematic vs. intermittently
skipped vs. always green.

**Dimensions:**

- Rows: Check IDs (27 total across both hooks; recommend separate sub-tables for
  pre-commit and pre-push)
- Columns: Dates (11 active days in current dataset: 2026-03-18 to 2026-03-29)
- Cell value: Worst status across all runs on that date (aggregation rule:
  fail > warn > auto-fix > pass > skip)

**Color encoding:** | Status | Color | Hex | |--------|-------|-----| | `fail` |
Red | `#ef4444` | | `warn` | Amber | `#f59e0b` | | `auto-fix` | Blue | `#3b82f6`
| | `pass` | Green | `#22c55e` | | `skip` | Gray | `#6b7280` | | `N/A` | Light
gray | `#e5e7eb` (no runs that day) |

**Labeling:** Check ID as row label, MM-DD as column label. Cell tooltip: "check
/ date: status (N runs)"

**Key insight from data:** `cognitive-cc` warns 27/49 runs (55% warn rate),
`triggers` 25/49 (51%), `propagation-staged` 24/67 (36%), `pattern-compliance`
17/71 (24%). These are the chronic problem rows.

**Recommended split:** Pre-commit heatmap (14 rows) above pre-push heatmap (13
rows), with a divider label. This prevents a 27-row table that becomes
unreadable.

### 2.2 Commit Timeline

**Purpose:** Show development velocity as daily commit volume.

**Chart type:** Bar chart (vertical bars, one per day)

**Data source:** `commit-log.jsonl` grouped by `timestamp[:10]`

**Range:** Last 30 days (selectable; default 30)

**Data reality:** All 634 commits are seeded with `branch: "seeded"`. The bar
chart will correctly show commit counts per day but cannot show branch breakdown
or files-changed heatmaps because those fields are empty.

**Tooltip:** "DD MMM: N commits"

**Note for implementation:** When live `commit-tracker.js` eventually produces
non-seeded records, they will include real `branch`, `filesChanged`, `session`,
and `author` — design the chart to support optional branch color stacking but
degrade gracefully when only seeded data is present.

### 2.3 Agent Usage Bar Chart

**Purpose:** Show which agent types are being invoked and how frequently.

**Chart type:** Horizontal bar chart sorted by count descending

**Data:** `agent-invocations.jsonl` grouped by normalized agent name (lowercase,
deduplicated `Explore`/`explore`)

**Normalized agent counts:**

- `general-purpose`: 37
- `deep-research-searcher`: 26
- `explore`: 21 (merging both casings)
- `code-reviewer`: 7
- `deep-research-synthesizer`: 4
- `claude-code-guide`: 2

**Tooltip:** "Agent: N invocations across M sessions"

**Time filter:** Last 30 days (all current data is 2026-03-25 to 2026-03-29, so
effectively last 5 days)

### 2.4 Override Trends Line Chart

**Purpose:** Show bypass behavior over time to detect abuse patterns or
legitimate usage spikes.

**Chart type:** Multi-series line chart (one line per check type)

**Data source:** `override-log.jsonl` grouped by `check` and `timestamp[:10]`

**Active series (checks with >1 override):** `reviewer`, `doc-header`,
`triggers`, `cross-doc-deps`

**Observed pattern:** `reviewer` and `doc-header` dominate. `reviewer` bypasses
were highest 2026-03-22 (7 in one day). Both `triggers` and `reviewer` have
declined since 2026-03-22, suggesting those bypass reasons may have been
resolved.

**Tooltip:** "Check / Date: N overrides"

**Bypass rate display:** Show both absolute count (line) AND total rate
(annotated number top-right: "21.6% overall bypass rate")

### 2.5 Process Compliance Section

This is a metrics panel (not a chart), shown as KPI cards + a detail table.

**KPI Cards:**

| Metric                    | Value | Source                                        |
| ------------------------- | ----- | --------------------------------------------- |
| Overall bypass rate       | 21.6% | 33 overrides / (120 hook runs + 33 overrides) |
| Auto-fix count (last 30d) | 123   | hook-runs.jsonl checks with status=auto-fix   |
| Agent compliance rate     | 97.2% | agent-compliance check: 69 pass / 71 runs     |
| Chronic skip checks       | 3     | audit-s0s1, jsonl-md-sync, tsc (never ran)    |

**Bypass rate by check type detail table:** | Check | Overrides | Hook Runs |
Bypass Rate | |-------|-----------|-----------|-------------| | doc-header | 12
| 13 | 48.0% | | reviewer | 12 | 20 | 37.5% | | propagation | 1 | 6 | 14.3% | |
triggers | 5 | 43 | 10.4% | | tests | 1 | 31 | 3.1% | | cross-doc-deps | 2 | 69
| 2.8% |

**Chronic skip list panel:** A small table showing checks that never run (always
`skip` across all recorded dates), with a note explaining the skip reason if
derivable (e.g., `tsc` skips when no TypeScript changes staged).

**Retro follow-through:** Not computable from available data — no retro tracking
file identified. Mark as "No data source."

**Velocity widget:** Explicitly "unavailable" — see Section 4.

---

## 3. Heatmap Data Transformation

### Input → Matrix

**Source:** `hook-runs.jsonl` (120 records, ~8 KB raw)

**Processing steps:**

1. **Parse** each record: extract `hook`, `timestamp[:10]` as date key,
   `checks[]` array.

2. **Split by hook type:** Build two separate matrices — `preCommitMatrix` and
   `prePushMatrix`.

3. **Per-cell aggregation:** For each `(checkId, date)` pair, collect all
   statuses seen across multiple runs on that date. Apply worst-wins rule:

   ```
   STATUS_RANK = { fail: 4, warn: 3, "auto-fix": 2, pass: 1, skip: 0 }
   ```

   Cell value = highest-ranked status seen that day.

4. **Fill missing days:** For dates with no hook runs for a given check, use
   `"N/A"` (rendered as light gray, not confused with `skip`).

5. **Run count metadata:** Also track `runCount[date]` for tooltip ("3 runs on
   this day").

**Data structure output:**

```json
{
  "preCommit": {
    "checks": ["agent-compliance", "audit-s0s1", ...],
    "dates": ["2026-03-18", "2026-03-19", ...],
    "cells": {
      "agent-compliance": {
        "2026-03-18": "pass",
        "2026-03-29": "warn"
      }
    },
    "runCounts": {
      "2026-03-18": 4,
      "2026-03-22": 12
    }
  },
  "prePush": { ... }
}
```

**No external library needed.** This transformation is pure JavaScript —
`Array.reduce` over the JSONL lines. No D3 data-joining needed; the matrix is
pre-computed at build time and stored in `pipeline-data.json`.

**Rendering recommendation:** Use CSS Grid for the heatmap cells (not
SVG/Canvas). 14 rows × 11 columns = 154 cells for pre-commit; 13 × 11 = 143 for
pre-push. Total: 297 cells. At 28px × 28px per cell: pre-commit grid is ~312px ×
308px. Lightweight enough for CSS.

---

## 4. "Data Unavailable" Pattern for Velocity Widget

### What is broken

`velocity-log.jsonl` has 50 records spanning sessions #148–#243. Every record
has:

- `items_completed: 0`
- `item_ids: []`
- `tracks: []`

The `sprint` field contains raw markdown table row text instead of a clean
sprint name. The extraction script (`track-session.js` in session-end) is not
successfully parsing completed ROADMAP items.

### UI Treatment

Show a dedicated velocity widget slot with a clear "data unavailable" state — do
not omit the widget entirely (absence is confusing; an empty slot with
explanation is informative).

**Recommended component state:**

```
┌─────────────────────────────────────────────────┐
│  Velocity                         ◉ Unavailable  │
│                                                  │
│  items_completed = 0 across all 50 sessions.     │
│  Extraction script not reading ROADMAP items.    │
│                                                  │
│  Source: .claude/state/velocity-log.jsonl        │
│  Sessions tracked: #148–#243                     │
│  [ View raw data ]                               │
└─────────────────────────────────────────────────┘
```

**Implementation pattern:**

```tsx
// Consistent "data unavailable" pattern for any broken widget
type DataStatus = "ok" | "unavailable" | "empty" | "stale";

interface WidgetProps {
  status: DataStatus;
  statusReason?: string;
  sourceFile?: string;
  children: React.ReactNode;
}
```

Use this same pattern for any future widget where the underlying source file
exists but produces unusable data (distinct from a file that doesn't exist at
all).

**Do not:** Show a loading spinner indefinitely, show 0 as a real value (it will
be misread as "zero velocity"), or omit the widget from the UI.

---

## 5. Static Export Plan — `public/pipeline-data.json`

### Structure

```json
{
  "meta": {
    "generatedAt": "2026-03-29T...",
    "sources": { ... file counts ... }
  },
  "heatmap": {
    "preCommit": { "checks": [...], "dates": [...], "cells": {...}, "runCounts": {...} },
    "prePush": { "checks": [...], "dates": [...], "cells": {...}, "runCounts": {...} }
  },
  "commitTimeline": [
    { "date": "2026-03-18", "count": 29 }
  ],
  "agentUsage": [
    { "agent": "general-purpose", "count": 37 }
  ],
  "overrides": [
    { "timestamp": "...", "check": "reviewer", "reason": "...", "git_branch": "..." }
    // NOTE: omit "user" and "cwd" fields (privacy — already redacted in source but be explicit)
  ],
  "warningsSummary": {
    "byType": { "trigger": 19, "firestore-rules-guard": 18, ... },
    "bySeverity": { "warning": 42, "error": 36, "info": 9 },
    "trend": [ { "date": "...", "count": N } ]
  },
  "processCompliance": {
    "totalHookRuns": 120,
    "bypassCount": 33,
    "bypassRate": 21.6,
    "autoFixCount": 123,
    "bypassByCheck": [
      { "check": "doc-header", "overrides": 12, "hookRuns": 13, "rate": 48.0 }
    ],
    "chronicSkipChecks": ["audit-s0s1", "jsonl-md-sync", "tsc"],
    "agentComplianceRate": 97.2,
    "retroFollowThrough": null,
    "velocity": {
      "status": "unavailable",
      "reason": "items_completed always 0 — extraction script broken",
      "sourceFile": ".claude/state/velocity-log.jsonl",
      "sessionRange": { "min": 148, "max": 243 }
    }
  }
}
```

### Size Estimate

| Section                      | Size       |
| ---------------------------- | ---------- |
| heatmap                      | ~8.2 KB    |
| commitTimeline               | ~1.1 KB    |
| agentUsage                   | ~0.3 KB    |
| overrides (privacy-filtered) | ~6.5 KB    |
| warningsSummary              | ~9.3 KB    |
| processCompliance            | ~0.4 KB    |
| meta                         | ~0.2 KB    |
| **Total**                    | **~26 KB** |

This is well within static file budget (target <100 KB uncompressed, <25 KB
gzip). No pagination needed at current data volumes.

### Build-time generation

The export script reads all 6 source JSONL files, performs all aggregations
(matrix building, counting, rate calculation), and writes the single JSON. It
does not run at request time. Recommended: add to the dev dashboard `build`
script as a pre-step (`scripts/generate-pipeline-data.js`).

**Privacy note on overrides:** The source file already has `user` and `cwd`
redacted for many entries, but some records show `"user": "Owner"` and actual
Windows paths. Strip `user` and `cwd` fields entirely during export — only
`timestamp`, `check`, `reason`, and `git_branch` are needed.

---

## 6. Component Breakdown

### Tab Shell

**`PipelineTab`** — tab container, orchestrates layout, fetches
`pipeline-data.json` once

### Pipeline Section

**`HookComplianceHeatmap`**

- Props: `preCommit: HeatmapData`, `prePush: HeatmapData`
- Sub-components:
  - `HeatmapGrid` — CSS Grid rendering of cells
  - `HeatmapCell` — single cell with status color + tooltip
  - `HeatmapLegend` — pass/warn/auto-fix/skip/N-A color key
- State: `activeCell` for tooltip hover
- Sizing: two stacked grids with a divider label between them

**`CommitTimeline`**

- Props: `data: CommitDay[]`, `dateRange: number` (days)
- Renders: vertical bar chart (CSS or lightweight SVG)
- State: `hoveredBar` for tooltip
- Degrade note: Shows "branch breakdown unavailable" subtitle when all records
  are seeded

**`AgentUsageChart`**

- Props: `data: AgentCount[]`
- Renders: horizontal bar chart sorted by count
- Normalization: merge `Explore`/`explore` client-side before render

**`OverrideTrendChart`**

- Props: `data: Override[]`
- Renders: multi-series line chart (one line per check type)
- State: `visibleChecks` (toggleable series)

### Process Compliance Section

**`ProcessCompliancePanel`** — section container with heading "Process
Compliance"

**`BypassRateKPI`** — single KPI card: overall bypass rate with RAG indicator
(green <10%, amber 10–25%, red >25%)

**`AutoFixKPI`** — single KPI card: auto-fix count with sparkline showing trend
if >14 days data available

**`AgentComplianceKPI`** — single KPI card: agent compliance rate (97.2% →
green)

**`BypassBreakdownTable`**

- Props: `data: BypassByCheck[]`
- Renders: sortable table with columns: Check | Overrides | Hook Runs | Bypass
  Rate | Bar indicator
- Sorted by bypass rate descending by default

**`ChronicSkipList`**

- Props: `checks: string[]`
- Renders: pill list of check IDs that always skip
- Tooltip: explain what "chronic skip" means

**`VelocityWidget`**

- Props: `velocity: VelocityData`
- Renders: Unavailable state (see Section 4 for spec)
- Do not render a chart at all when `status === "unavailable"`

**`RetroFollowThroughWidget`**

- Same unavailable pattern as VelocityWidget (no data source available)

### Shared Components (likely already exist or needed)

**`KPICard`** — reusable metric card with label, value, delta, status indicator

**`DataUnavailable`** — reusable unavailable state with reason text and source
file link

**`SectionHeading`** — consistent section header with optional info tooltip

---

## Key Findings Summary

1. **hook-runs.jsonl is clean and complete** [CONFIDENCE: HIGH] 120 records,
   consistent schema, 11 days of coverage. This is the highest-quality data
   source on the tab. The only gap: zero `fail` status values in current window
   (only `warn` at worst).

2. **commit-log.jsonl is entirely seeded — all fields degraded** [CONFIDENCE:
   HIGH] All 634 records have `seeded: true`, `branch: "seeded"`,
   `filesChanged: 0`, `session: null`. The commit timeline can show daily counts
   (real git timestamps are preserved) but cannot show branch breakdown, file
   counts, or session correlation. The dashboard should note this limitation
   inline.

3. **Pre-commit and pre-push checks are fully disjoint** [CONFIDENCE: HIGH] Zero
   check IDs are shared between the two hook types. The heatmap must be split
   into two separate sub-grids to be readable, with a clear visual separator and
   label.

4. **Chronic problem checks are clearly identifiable** [CONFIDENCE: HIGH]
   `cognitive-cc` (55% warn rate), `triggers` (51%), `propagation-staged` (36%),
   `pattern-compliance` (24%) are persistently warning. These should be visually
   emphasized in the heatmap — perhaps a "persistent warning" badge on the row
   label.

5. **velocity-log.jsonl is confirmed broken** [CONFIDENCE: HIGH] 50 records,
   sessions #148–#243, `items_completed: 0` universally. The velocity widget
   must display an explicit "unavailable" state, not a zero value.

6. **Bypass rate computation requires name mapping** [CONFIDENCE: HIGH]
   override-log uses `doc-header` and `reviewer`; hook-runs uses `doc-headers`
   and `code-reviewer-gate`. Mapping required: `doc-header → doc-headers`,
   `reviewer → code-reviewer-gate`, `propagation → propagation` (shared name).

7. **payload-data.json is ~26 KB total** [CONFIDENCE: HIGH] All 6 source files
   combined and aggregated. Fits easily in static export. No pagination needed.

8. **Agent name normalization required** [CONFIDENCE: HIGH] `explore` and
   `Explore` are the same agent with different casing across sessions. Normalize
   to lowercase before display.

---

## Sources

| #   | Path                                                               | Type                  | Trust | Date       |
| --- | ------------------------------------------------------------------ | --------------------- | ----- | ---------- |
| 1   | `.claude/state/hook-runs.jsonl`                                    | codebase-ground-truth | HIGH  | 2026-03-29 |
| 2   | `.claude/state/commit-log.jsonl`                                   | codebase-ground-truth | HIGH  | 2026-03-29 |
| 3   | `.claude/state/agent-invocations.jsonl`                            | codebase-ground-truth | HIGH  | 2026-03-29 |
| 4   | `.claude/override-log.jsonl`                                       | codebase-ground-truth | HIGH  | 2026-03-29 |
| 5   | `.claude/state/hook-warnings-log.jsonl`                            | codebase-ground-truth | HIGH  | 2026-03-29 |
| 6   | `.claude/state/velocity-log.jsonl`                                 | codebase-ground-truth | HIGH  | 2026-03-29 |
| 7   | `.research/dev-dashboard/findings/SQ1c-2-process-session-hooks.md` | research-prior        | HIGH  | 2026-03-29 |

---

## Contradictions

**commit-log.jsonl seeded state vs. live hook expectation:** SQ1c-2 research
describes `commit-tracker.js` as writing commits with real `branch`,
`filesChanged`, and `session` fields. The actual file shows all 634 records are
seeded with degraded fields. This is not a contradiction in schema (the schema
supports both) but a gap in live data availability. The seeder replicated git
history but not the live tracker's enriched metadata. No resolution possible
without waiting for live tracker to write new commits.

**override-log check name inconsistency:** Override entries use `doc-header`
(singular) but hook-runs uses `doc-headers` (plural). No authoritative canonical
name identified — treat as the same check with a display label of `doc-headers`.

---

## Gaps

1. **No `fail` status in current hook-runs window** — The color scale includes
   red/fail but no data point currently shows it. This is not a bug — the system
   is healthy — but tests using real data will never exercise the red cell
   color. Suggest adding a synthetic `fail` cell to the storybook/test.

2. **commit-log branch data unavailable** — Cannot show a branch-colored commit
   timeline until live `commit-tracker.js` writes real records. The real branch
   names ARE available in git log but not in commit-log.jsonl.

3. **No retro follow-through data source** — Mentioned in tab scope as a Process
   Compliance metric. No JSONL file identified that tracks retro action item
   resolution. Mark as gap requiring a new tracking mechanism.

4. **hook-warnings-log entries with `user: "unknown"`** — 34 of 87 records have
   unknown user. The multi-locale attribution (jason vs. jbell) cannot be
   applied to these records. Dashboard displays `user` as "unknown" for those
   cells if user breakdown is shown.

5. **No intra-session PostToolUse hook performance data** —
   post-write-validator, post-read-handler run on every file write/read but have
   no equivalent of hook-runs.jsonl. Cannot show per-session or per-file
   validation metrics.

---

## Serendipity

**`lint-staged` and `doc-index` are auto-fixing silently on almost every
commit.** `lint-staged: auto-fix` on 69/71 pre-commit runs (97%),
`doc-index: auto-fix` on 54/71 (76%). These are invisible corrections happening
before the commit completes. A "Silent Auto-Fixes" KPI card — showing 123
auto-fixes in 11 days — would make this maintenance work visible.

**`tsc` appears in pre-push checks but has skipped in 39/39 runs and only
appears in the last 10 hook records.** It was added to the pre-push hook
recently. Zero pass or fail records — pure skip. Either the TypeScript check
condition hasn't triggered yet, or there's a condition bug preventing it from
ever running.

**Override log shows `git_branch` field** — this field is not mentioned in the
SQ1c-2 schema documentation but is present in every record. It enables
"overrides per branch" analysis, which could surface that specific long-running
feature branches are generating bypass clusters.

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All findings are directly derived from live filesystem analysis using Python
data parsing against the actual JSONL files. No training data assumptions used.
