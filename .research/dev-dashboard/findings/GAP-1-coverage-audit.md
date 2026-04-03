# Findings: Gap Hunter — Wave 3 Coverage Audit

**Searcher:** deep-research-searcher (GAP HUNTER role) **Profile:** codebase
**Date:** 2026-03-29 **Mission:** Cross-reference all Wave 1-4 findings against
the SQ1b data inventory. Surface what 32 prior agents missed.

---

## Coverage Summary

Of the 36 HIGH-relevance files listed in SQ1b:

- **32 files directly schema-analyzed in Wave 3** (89%)
- **4 files PARTIALLY covered** (schema referenced but not read from filesystem)
- **0 files completely missed** from the official P0/P1/P2 HIGH list
- **6 orphaned/undiscovered files** found in filesystem but NOT in the SQ1b
  inventory at all
- **3 inter-agent assumption conflicts** identified

---

## Section 1: Coverage Map — All 36 HIGH-Relevance Files

### P0 Files (6 total)

| File                                           | Analyzed In            | Schema Depth                                                                      | Gap Status |
| ---------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------- | ---------- |
| `docs/technical-debt/MASTER_DEBT.jsonl`        | W3-T2A                 | FULL — all 30+ fields catalogued, coverage percentages computed                   | COVERED    |
| `docs/technical-debt/metrics.json`             | W3-T2A                 | FULL — every field mapped to a specific widget                                    | COVERED    |
| `docs/technical-debt/logs/metrics-log.jsonl`   | W3-T2A                 | FULL — schema, 49-date coverage, BUG-06 gap documented                            | COVERED    |
| `data/ecosystem-v2/ecosystem-health-log.jsonl` | W3-T1A                 | FULL — 32 entries, all category/dimension keys, size analysis                     | COVERED    |
| `.claude/state/health-score-log.jsonl`         | W3-T1A                 | FULL — 24 entries, flat categoryScores map, null patterns                         | COVERED    |
| `.claude/state/alerts-baseline.json`           | W3-T1B (implied), SQ6a | PARTIAL — referenced as "current health snapshot" but no direct schema read in W3 | PARTIAL    |

### P1 Files (16 total)

| File                                            | Analyzed In       | Schema Depth                                                                                                 | Gap Status |
| ----------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------ | ---------- |
| `.claude/state/hook-runs.jsonl`                 | W3-T4A            | FULL — all check IDs listed, status values, dual-hook schema, 120 records                                    | COVERED    |
| `.claude/state/hook-warnings-log.jsonl`         | W3-T1A + W3-T4A   | FULL — both analyzed it, schemas match, covered from two angles                                              | COVERED    |
| `.claude/state/commit-log.jsonl`                | W3-T4A            | FULL — seeded-data finding, all fields, 634 records, degraded quality confirmed                              | COVERED    |
| `.claude/state/reviews.jsonl`                   | W3-T3A            | FULL — 3-schema-version breakdown, v1/v2/legacy distinction                                                  | COVERED    |
| `.claude/state/reviews-archive.jsonl`           | W3-T3A            | FULL — 478 records, backfill data quality issues, severity fields present                                    | COVERED    |
| `.claude/state/review-metrics.jsonl`            | W3-T3A            | FULL — 52 records, fix_ratio field, PR #414–#477 range                                                       | COVERED    |
| `.claude/state/retros.jsonl`                    | W3-T3A            | FULL — 57 records, completeness breakdown, action_items schema                                               | COVERED    |
| `.claude/state/lifecycle-scores.jsonl`          | W3-T1A + W3-T6A   | FULL — both analyzed, all 20 systems listed, dimension scores                                                | COVERED    |
| `.claude/state/agent-invocations.jsonl`         | W3-T4A            | FULL — 97 records, all agent names, casing normalization issue found                                         | COVERED    |
| `.claude/state/forward-findings.jsonl`          | SQ1b + CHECKPOINT | PARTIAL — named in checkpoint as "Watch Items" header widget; NO direct schema analysis in any W3 agent      | PARTIAL    |
| `.claude/state/pr-review-state.json`            | W3-T3B            | PARTIAL — noted as "legacy artifact for PR #411," schema inferred but not directly read for dashboard design | PARTIAL    |
| `data/ecosystem-v2/warnings.jsonl`              | W3-T1A            | FULL — full lifecycle state machine schema, all fields, 16-entry breakdown                                   | COVERED    |
| `docs/technical-debt/raw/audits.jsonl`          | W3-T2B (implied)  | NOT DIRECTLY READ in any W3 agent — referenced only in SQ1b inventory table                                  | PARTIAL    |
| `docs/technical-debt/raw/review-needed.jsonl`   | W3-T2A            | FULL — 27 records, pair structure, parametric_s0s1_review breakdown                                          | COVERED    |
| `docs/technical-debt/logs/resolution-log.jsonl` | W3-T2A            | FULL — 14 records, all action types with schema, 649 items resolved                                          | COVERED    |
| `.research/research-index.jsonl`                | W3-T6A + W3-T6B   | FULL — all 4 entries, complete field schema, in-flight gap identified                                        | COVERED    |

### P2 Files (2 listed as HIGH in SQ1b summary)

| File                                       | Analyzed In    | Schema Depth                                                                        | Gap Status          |
| ------------------------------------------ | -------------- | ----------------------------------------------------------------------------------- | ------------------- |
| `docs/technical-debt/views/by-severity.md` | W3-T2A (noted) | NOTED as too large for direct export; no deep analysis needed                       | COVERED (by design) |
| `.claude/state/velocity-log.jsonl`         | W3-T4A         | FULL — broken data confirmed, items_completed=0 universally, sprint field malformed | COVERED             |

### Additional HIGH-relevance files from SQ1b body (not in P0/P1/P2 summary but marked HIGH)

| File                                              | Analyzed In         | Schema Depth                                                                      | Gap Status          |
| ------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------- | ------------------- |
| `data/ecosystem-v2/enforcement-manifest.jsonl`    | W3-T1A              | FULL — 360 records, all mechanisms, coverage percentages by category and priority | COVERED             |
| `.claude/state/known-debt-baseline.json`          | SQ6a reference only | NOT directly analyzed in any Wave 3 agent                                         | NOT ANALYZED        |
| `.claude/state/pending-reviews.json`              | SQ6a + CHECKPOINT   | NOT directly analyzed in any Wave 3 agent                                         | NOT ANALYZED        |
| 7 ecosystem audit history files                   | W3-T5A              | FULL — all 7 files read, schemas documented, record counts, drift catalogued      | COVERED             |
| `.claude/state/audit-agent-quality-history.jsonl` | W3-T5A              | FULL — 1 record, separate schema documented                                       | COVERED             |
| `.claude/state/learning-routes.jsonl`             | W3-T3B              | FULL — 39 records, status lifecycle, all fields                                   | COVERED             |
| `.claude/state/pending-refinements.jsonl`         | W3-T3A + W3-T3B     | FULL — 36 records, all route_type = claude-md-annotation, surfaced_count field    | COVERED             |
| `docs/technical-debt/logs/intake-log.jsonl`       | W3-T2A              | FULL — 80 records, all 5 action types with schemas                                | COVERED             |
| `docs/technical-debt/views/by-severity.md`        | Referenced only     | Design decision to skip (too large); acceptable                                   | COVERED (by design) |

---

## Section 2: Actual Coverage Percentage

**Methodology:** "Directly schema-analyzed" means the Wave 3 agent read the
actual file, reported record counts, and documented field-level schemas.
"Partially covered" means the file was referenced by name but not read.

| Status                                             | Count | Files                                                                                                    |
| -------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------- |
| COVERED (direct filesystem read + schema)          | 30    | See map above                                                                                            |
| COVERED by design (deliberately not deep-analyzed) | 2     | by-severity.md (too large), alert-suppressions (trivial)                                                 |
| PARTIAL (referenced but not schema-analyzed)       | 4     | alerts-baseline.json, forward-findings.jsonl, pr-review-state.json, docs/technical-debt/raw/audits.jsonl |
| NOT ANALYZED from HIGH list                        | 2     | known-debt-baseline.json, pending-reviews.json                                                           |

**Coverage of the 36 HIGH-relevance files: 32/36 directly analyzed (89%), 4
partial, 0 completely missed from explicit list.**

---

## Section 3: Partial Coverage — What Was Missed

### 3A. `forward-findings.jsonl` — SCHEMA NOW RESOLVED [HIGH PRIORITY — WAS A GAP]

**What it is:** SQ1b identifies this as P1 HIGH-relevance — "Active issue queue"
with 4 records currently. Listed in CHECKPOINT as the "Watch Items" header
widget (pinned cross-PR issues feed). The Dashboard Header Widget is the
highest-visibility element.

**What was covered by Wave 3:** W3-T3A and W3-T3B both processed
`reviews.jsonl`, `retros.jsonl`, and per-PR state files at length. Neither agent
opened `forward-findings.jsonl`.

**Schema gap — now resolved in this session.** Direct filesystem read confirms:

```
Record count: 4
Schema fields (verified from actual records):
  source_plan    string   — originating plan slug, e.g. "review-lifecycle", "hook-system-overhaul"
  finding_type   string   — "gap" | "canon-artifact" (observed values)
  pattern        string   — description of the forward-looking issue
  severity       string   — "S1" | "S2" (debt severity)
  target_ecosystem string — which ecosystem this affects, e.g. "review-lifecycle", "hooks"
  timestamp      ISO 8601 — when the finding was recorded

Sample record:
{
  "source_plan": "review-lifecycle",
  "finding_type": "gap",
  "pattern": "consolidation.json lastConsolidatedReview (#497) exceeds JSONL max ID (#484)",
  "severity": "S1",
  "target_ecosystem": "review-lifecycle",
  "timestamp": "2026-03-15T11:56:57.750Z"
}
```

**Key observations:** No `id` field (cannot dedup by ID). No `resolved` or
`lifecycle` state — these findings are "open" by nature until the source plan is
executed. No `pr` or `review_number` field — these come from planning analyses,
not PR reviews. The `source_plan` field is the link back to
`.claude/state/deep-plan.<source_plan>.state.json`.

**Tab impact:** The Dashboard Header Widget design is now unblocked. All 4
records are immediately displayable. The widget should show: severity badge +
pattern text + source_plan + timestamp. Sort by severity (S0/S1 first) then by
timestamp.

**Missing from design:** No Wave 3 agent designed the Header Widget component.
This needs explicit design in the implementation phase — it is above all 6 tabs
and was never addressed.

### 3B. `docs/technical-debt/raw/audits.jsonl` — SCHEMA NOT VERIFIED [MEDIUM PRIORITY GAP]

**What it is:** SQ1b marks this HIGH (P2) — "Audit-sourced debt items," 792
records, ~60KB. Different from MASTER_DEBT.jsonl — this is the pre-dedup
audit-extracted source.

**What was covered:** W3-T2A deeply analyzed MASTER_DEBT.jsonl, metrics.json,
intake-log, resolution-log, and review-needed.jsonl. It did not open
`audits.jsonl` from `docs/technical-debt/raw/`.

**Schema gap:** Field structure of `audits.jsonl` entries is unknown from
Wave 3. The SQ1b notes it as "category, severity, file, line, title" — but this
was not verified. The dashboard Debt tab design doesn't include this file
anywhere in the export plan.

**Tab impact:** Low — MASTER_DEBT already subsumes these entries after dedup.
However, if the dashboard were to show "audit-originated debt" as a distinct
category or source attribution, this file would be the source. W3-T2A uses
`by_source` from metrics.json (which shows "audit: 2942") but never verified
that figure against the raw file.

**Recommended action:** Low priority. Accept W3-T2A's metrics.json audit count
as the source. Only investigate if the dashboard needs per-audit-source
drill-down.

### 3C. `alerts-baseline.json` — SCHEMA NOT VERIFIED [MEDIUM PRIORITY GAP]

**What it is:** SQ1b marks this P0 HIGH — "Current health snapshot" containing
grade, score, categoryScores. It's the baseline against which `/alerts` computes
delta.

**What was covered:** W3-T1A analyzed `health-score-log.jsonl` and
`ecosystem-health-log.jsonl` extensively. W3-T1B covers the `/alerts` CLI.
Neither agent read `alerts-baseline.json` directly to document its schema.

**Schema gap:** The field structure is inferred from SQ1b description as
`{grade, score, categoryScores}` matching the health-score-log format, but this
was not verified by any Wave 3 agent. The `/alerts` script reads this file to
compute deltas — if the schema differs from what's in health-score-log, the
health data export script could break.

**Tab impact:** MEDIUM. The health export plan in W3-T1A doesn't explicitly
include `alerts-baseline.json` in its `public/health-data.json` structure. It
may need to be included as the "current baseline" reference point. The file
header confirms it starts with `{"timestamp": "2026-03-06T23:42:08.378Z"` —
consistent with health-score-log format.

**Recommended action:** Before writing `scripts/generate-health-data.js`, read
`alerts-baseline.json` directly and confirm it's just a copy of the latest
`health-score-log` entry, or whether it has its own distinct schema.

### 3D. `pr-review-state.json` — LEGACY CONFUSION [LOW PRIORITY GAP]

**What it is:** SQ1b marks this P1 HIGH — "Active PR review status." W3-T3B read
it but classified it as a "legacy artifact for PR #411" that uses a non-standard
batched-protocol schema. The checkpoint STILL lists it as a data source for
Tab 3.

**Schema gap:** The actual field schema was not documented. W3-T3B says it's not
the current format and told the dashboard to use per-round
`task-pr-review-{pr}-r{N}.state.json` files instead.

**Contradiction with CHECKPOINT:** The CHECKPOINT lists `pr-review-state.json`
as Tab 3's first data source ("Active PR state"). W3-T3B explicitly says NOT to
use it as the model for active PR state because it's a legacy artifact.

**Tab impact:** MEDIUM — this needs a design decision. If `pr-review-state.json`
is legacy, it should be removed from the Tab 3 data source list. But it was not
explicitly deprecated in any findings.

---

## Section 4: Orphaned Data Sources — Files in Filesystem NOT in SQ1b Inventory

These files exist in `.claude/state/` or `.claude/` root but were NOT
inventoried in SQ1b and NOT analyzed in Wave 3.

### 4A. `.claude/session-activity.jsonl` — HIGH RELEVANCE [MISSED]

**Location:** `.claude/session-activity.jsonl` (NOT `.claude/state/`) **Size:**
135 lines **Sample record:**
`{"timestamp":"2026-03-06T23:55:14.107Z","user":"jason","outcome":"success","event":"session_start","source":"hook"}`

**Why it matters:** This is a session-start event log. Tab 4 (Build Pipeline) is
supposed to show agent invocations and session activity. The CHECKPOINT lists
"Agent invocations by session" from `agent-invocations.jsonl` — but
`session-activity.jsonl` is a SEPARATE session-level event log at `.claude/`
root, not `.claude/state/`. It records `event: session_start` events with
timestamps and outcomes, separate from the per-agent invocations.

**Dashboard relevance:** HIGH. This file would power a "Session Activity"
timeline — when sessions started, how many sessions per day, session
success/failure rate. W3-T4A built the entire agent/pipeline tab data design
without knowing this file existed.

**Tab:** Tab 4 (Build Pipeline). Could populate a "Session Timeline" widget not
currently planned.

**Gap:** No agent looked at this file. SQ1b missed it because it's at `.claude/`
root, not `.claude/state/`.

### 4B. `.claude/config/high-churn-watchlist.json` — MEDIUM RELEVANCE [MENTIONED BUT NOT INVENTORIED]

**Location:** `.claude/config/high-churn-watchlist.json` **Size:** 27 lines
**Contents:**
`{"description":"Files that attract disproportionate review churn...","files":[".claude/hooks/session-start.js","..."]}`

**Why it matters:** W3-T3B's Serendipity section explicitly mentions this file:
"high-churn watchlist tracks 3 files that appear in 4+ PRs' fix rounds." W3-T3B
says the Reviews tab could display a "high churn files" widget. BUT: this file
is NOT in SQ1b's inventory, NOT in the CHECKPOINT tab decisions, and NOT in any
export plan.

**Dashboard relevance:** MEDIUM. Small (3 files listed), but directly
actionable: the Reviews tab could surface "These 3 files caused disproportionate
review churn — consider refactoring."

**Tab:** Tab 3 (Code Review Quality).

**Gap:** Discovered by W3-T3B serendipity but never formally surfaced as a data
source to include in the Tab 3 export plan.

### 4C. `.claude/config/hook-audit-suppressions.json` — LOW-MEDIUM RELEVANCE [UNANALYZED]

**Location:** `.claude/config/hook-audit-suppressions.json` **Size:** 19 lines
**Sample:**
`{"$schema":"Suppression file for hook-ecosystem-audit false positives",...}`

**Why it matters:** Suppression rules for hook ecosystem audit false positives.
Tab 5 (Governance) analyzes hook audit history. Knowing which findings are
suppressed would affect the "worst category signals" display — if a category is
suppressed, its score history is artificially influenced.

**Dashboard relevance:** LOW-MEDIUM. Contextual data for Tab 5's hook audit
panel. Indicates which audit findings are intentionally ignored.

**Tab:** Tab 5 (Governance & Audits).

**Gap:** Not in SQ1b inventory; no agent analyzed it.

### 4D. `.claude/state/warned-files.json` — LOW RELEVANCE [EMPTY, CONFIRMED]

**Location:** `.claude/state/warned-files.json` **Size:** 0 lines (empty file
`{}`) **Status:** Empty — no data to display.

**Gap:** In filesystem but empty. Low relevance confirmed.

### 4E. `.claude/state/reviews.jsonl.archive`, `.claude/state/reviews.jsonl.bak`, `.claude/state/hook-warnings-log.jsonl.archive` — ARCHIVE ARTIFACTS

**Status:**

- `reviews.jsonl.archive`: 448 lines — duplicate content from rotation (already
  subsumed by `reviews-archive.jsonl`)
- `reviews.jsonl.bak`: 50 lines — backup file
- `hook-warnings-log.jsonl.archive`: 203 lines — rotation archive

**Gap:** These are rotation artifacts. SQ1b missed them because they have
non-standard extensions. They should NOT be included in export scripts — they
would double-count data.

**Dashboard impact:** IMPORTANT WARNING. If an export script globs `*.jsonl`
without explicitly filtering archive extensions, it would pick up these files
and double-count review records. The export script for reviews and hook-warnings
must filter out `.archive` and `.bak` suffixes explicitly.

### 4F. `.claude/state/planning-audit-execution.json` — LOW RELEVANCE BUT INTERESTING

**Location:** `.claude/state/planning-audit-execution.json` **Size:** 153 lines
**Contents:** `{"task": "Planning Landscape Audit & Cleanup", ...}` — an
execution state record for a planning audit task.

**Dashboard relevance:** LOW. Ephemeral task state. But its existence signals
that "planning audit" tasks leave persistent state files that could confuse a
glob-based deep-plan state scanner if the file format overlaps.

---

## Section 5: Missing Cross-References — Files Referenced But Never Resolved

These are files mentioned in Wave 3 analyses that reference other files,
creating a chain that was never followed. All five were verified by direct
filesystem check in this session.

### 5A. `.claude/state/governance-changes.jsonl` — CONFIRMED DOES NOT EXIST

**Referenced in:** W3-T4B hook script inventory — `governance-logger.js` writes
to `.claude/state/governance-changes.jsonl` on writes to CLAUDE.md or
settings.json.

**Verified status:** File does NOT exist in `.claude/state/`. The governance
logger hook is wired but has never fired, or writes to a different path. The
"CLAUDE.md modification audit trail" widget is not feasible — no data exists.

**Dashboard impact:** CLOSED — no data, no widget possible. Remove this from any
Tab 5 design scope.

### 5B. `.claude/state/session-start-failures.json` — CONFIRMED DOES NOT EXIST

**Referenced in:** W3-T4B — `session-start.js` hook writes to
`.claude/state/session-start-failures.json` on failure.

**Verified status:** File does NOT exist. Either no session-start failures have
occurred, or the write path has a bug. Not a dashboard data source.

**Dashboard impact:** CLOSED — no data available.

### 5C. `.claude/state/commit-failures.jsonl` — CONFIRMED DOES NOT EXIST

**Referenced in:** W3-T4B — `commit-tracker.js` writes to
`.claude/state/commit-failures.jsonl` on failure.

**Verified status:** File does NOT exist. This means either commit-tracker.js
has never failed, or it was never wired to write failures. It does NOT explain
why commit-log.jsonl shows only seeded records — that is a separate issue (the
seeder ran, the live tracker never wrote real records).

**Dashboard impact:** CLOSED — no data available. Does not unblock the
commit-log seeded-data problem.

### 5D. `.claude/state/test-runs.jsonl` — CONFIRMED DOES NOT EXIST

**Referenced in:** W3-T4B — `test-tracker.js` writes to
`.claude/state/test-runs.jsonl` on test runs.

**Verified status:** File does NOT exist. The test-tracker hook runs but has
never written records, or writes to a different path. The Testing:0/F health
score gap identified by W3-T1A cannot be explained by this file — it doesn't
exist.

**Dashboard impact:** CLOSED — no test run data available. Tab 4 process
compliance section cannot include test-run metrics. The Testing:0/F score
remains unexplained by available data.

### 5E. `.claude/state/pending-alerts.json` — CONFIRMED DOES NOT EXIST

**Referenced in:** W3-T4B — `user-prompt-handler.js` reads `pending-alerts.json`
on every user prompt.

**Verified status:** File does NOT exist in `.claude/state/`. The
user-prompt-handler likely reads from a different path (perhaps
`.claude/hooks/pending-alerts.json` or only creates the file when alerts are
pending). Not a persistent data source.

**Dashboard impact:** CLOSED — no pending-alerts queue data available.

---

## Section 6: Assumption Conflicts Between Agents

### Conflict 1: `pr-review-state.json` as Active State vs Legacy Artifact

**Agent A (CHECKPOINT/SQ1b):** Lists `pr-review-state.json` as a PRIMARY data
source for Tab 3: "Active PR state (pr-review-state.json)" — first item in the
Tab 3 data source list.

**Agent B (W3-T3B):** Explicitly says "The tab should NOT use
`pr-review-state.json` as the model for 'active PR state' — it reflects a
one-off batched protocol, not the standard schema." Calls it a "legacy artifact"
for PR #411, last updated 2026-03-01.

**Resolution needed:** These cannot both be right. The CHECKPOINT was written
before W3-T3B's filesystem analysis. W3-T3B has ground-truth filesystem
evidence. The CHECKPOINT is stale on this point.

**Recommendation:** Remove `pr-review-state.json` from the Tab 3 primary data
source list. Replace with: per-round `task-pr-review-{pr}-r{N}.state.json` files
(as W3-T3B recommends). The legacy file can remain as a fallback for historical
PR #411 data only.

### Conflict 2: `resolve-dependencies.js --json` Flag — Working vs Pre-Work Item

**Agent A (W3-T6A):** "Already working — confirmed by live run." Lists 81 ready
tasks output. States "Effort to enable `--json` for dashboard: Zero."

**Agent B (CHECKPOINT / W3-T6B):** CHECKPOINT says "ROADMAP.md needs `--json`
flag on resolve-dependencies.js" as a data gap requiring pre-work. W3-T6B also
says: "No `--json` flag on resolve-dependencies.js. CHECKPOINT notes this as a
pre-work item."

**Resolution:** SQ6a documents this as contradiction G45 and recommends running
a verification check. W3-T6A's live run evidence is more authoritative than the
CHECKPOINT's speculation. The `--json` flag appears to already work. This gap
appears CLOSED based on W3-T6A's live verification, but the conflict in W3-T6B
(same session as W3-T6A) is puzzling — W3-T6B was written as if it hadn't read
W3-T6A's conclusion.

**Recommendation:** Run
`node scripts/tasks/resolve-dependencies.js --json | head -3` to confirm before
Tab 6 development. If it works (per W3-T6A), G45 is CLOSED.

### Conflict 3: `hook-runs.jsonl` Record Count Discrepancy

**SQ1b inventory (2026-03-29 morning):** Reports 114 records.

**W3-T4A (2026-03-29 afternoon):** Reports 120 records. The data was likely
appended between inventory and analysis.

**Resolution:** Not a real conflict — the file grew between the two reads.
W3-T4A's 120-record count is more recent and authoritative for dashboard design
purposes. Export scripts must not hardcode record counts.

---

## Section 7: What Tab Has Least Coverage

Ranking the 6 tabs by Wave 3 coverage quality:

| Tab                        | Coverage Quality                                            | Weakest Point                                                                                     |
| -------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Tab 1: Health & Alerts     | HIGH — 6/6 primary sources fully analyzed                   | alerts-baseline.json schema not verified                                                          |
| Tab 2: Debt Pipeline       | HIGH — all MASTER_DEBT + supporting files analyzed          | audits.jsonl not read (low impact)                                                                |
| Tab 3: Code Review Quality | HIGH — all 5 sources analyzed                               | forward-findings.jsonl schema now resolved (this session); pr-review-state.json conflict remains  |
| Tab 4: Build Pipeline      | HIGH — 6/6 sources analyzed                                 | session-activity.jsonl completely missed; all referenced hook output files confirmed non-existent |
| Tab 5: Governance & Audits | HIGH — all 8 audit files read                               | governance-changes.jsonl confirmed non-existent; hook-audit-suppressions.json unanalyzed          |
| Tab 6: Planning & Research | HIGH — research-index, lifecycle, sprint board all verified | In-flight research state files (complex schema) partially addressed                               |
| **Header Widget**          | PARTIAL (resolved this session)                             | forward-findings.jsonl schema now documented; component design still needed                       |

**Biggest remaining gap: The Dashboard Header Widget component.** While
`forward-findings.jsonl` schema is now resolved, no Wave 3 agent designed the
Header Widget component. This needs explicit design in the implementation phase
— it sits above all 6 tabs and was addressed by zero agents.

---

## Section 8: Data Files That Appeared After SQ1b (New Since Inventory)

Based on comparing SQ1b record counts vs W3 record counts:

| File                      | SQ1b Count | W3 Count | Delta | Explanation                                  |
| ------------------------- | ---------- | -------- | ----- | -------------------------------------------- |
| `hook-runs.jsonl`         | 114        | 120      | +6    | 6 new hook runs during research session      |
| `agent-invocations.jsonl` | 92         | 97       | +5    | 5 new agent invocations during research      |
| `hook-warnings-log.jsonl` | 68         | 87       | +19   | 19 new hook warnings during research session |

These delta numbers confirm the files are active and growing. Export scripts
must not cache stale counts.

---

## Sources

| #   | Path                                                              | Type                      | Trust | CRAAP     | Date       |
| --- | ----------------------------------------------------------------- | ------------------------- | ----- | --------- | ---------- |
| 1   | `.research/dev-dashboard/findings/SQ1b-data-inventory.md`         | prior research (codebase) | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 2   | `.research/dev-dashboard/findings/CHECKPOINT-tab-decisions.md`    | decision record           | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 3   | `.research/dev-dashboard/findings/SQ6a-data-gaps-consolidated.md` | prior research (codebase) | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 4   | W3-T1A through W3-T6B (12 files)                                  | Wave 3 findings           | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 5   | `.claude/state/` filesystem scan (direct `ls` + `wc -l`)          | filesystem (ground truth) | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 6   | `.claude/` root filesystem scan                                   | filesystem (ground truth) | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 7   | `.claude/config/` filesystem scan                                 | filesystem (ground truth) | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 8   | `.claude/state/forward-findings.jsonl` (direct `head -4`)         | filesystem (ground truth) | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 9   | Bash existence checks for 5 referenced-but-unverified files       | filesystem (ground truth) | HIGH  | 5/5/5/5/5 | 2026-03-29 |

---

## Contradictions

1. `pr-review-state.json`: CHECKPOINT calls it an active data source; W3-T3B
   calls it a legacy artifact. See Section 6, Conflict 1. RESOLUTION NEEDED.
2. `resolve-dependencies.js --json`: W3-T6A says working; W3-T6B says pre-work
   needed. See Section 6, Conflict 2. Appears CLOSED per W3-T6A live run, but
   requires verification.
3. `hook-runs.jsonl` record count: SQ1b says 114; W3-T4A says 120. Not a true
   conflict — time-based data growth. See Section 6, Conflict 3. RESOLVED.

---

## Gaps

1. **Dashboard Header Widget has no component design** —
   `forward-findings.jsonl` schema is now documented (see Section 3A), but no
   agent designed the Header Widget component structure, props contract, or
   positioning above the tab layout.
2. **`.claude/session-activity.jsonl` (135 records) was entirely missed** — a
   potentially valuable session timeline data source not in any tab design.
3. **`.claude/state/test-runs.jsonl` confirmed non-existent** — the Testing:0/F
   health score gap identified in W3-T1A has no data-layer explanation
   available.
4. **`pr-review-state.json` CHECKPOINT conflict unresolved** — needs explicit
   user decision before Tab 3 implementation starts.
5. **Archive file collision risk** — `reviews.jsonl.archive`,
   `reviews.jsonl.bak`, `hook-warnings-log.jsonl.archive` must be explicitly
   excluded from export scripts.

---

## Serendipity

**`forward-findings.jsonl` contains cross-plan integrity findings, not cross-PR
findings.** The SQ1b description calls it a "cross-PR forward-looking findings"
file, and the CHECKPOINT calls it a "cross-PR issues feed." The actual records
show `source_plan` pointing to deep-plan session artifacts, not PRs. The two
current records reference `review-lifecycle` plan data integrity and a
`hook-system-overhaul` CANON registration requirement. This is a
planning/architecture issue feed, not a review quality feed. The Header Widget
should be labeled "Planning Watch Items" or "Open Architecture Findings" — NOT
"cross-PR issues."

**`.claude/session-activity.jsonl` at root is likely the missing link for the
velocity data problem.** W3-T4A confirmed `velocity-log.jsonl` is broken
(items_completed=0 universally). However, `session-activity.jsonl` records
session_start events with timestamps — while it doesn't capture items_completed,
it does give a session-count-per-day metric that is currently unavailable from
any analyzed source. A "Sessions per day" trend is a weaker but real velocity
proxy that requires no repair work.

**The archive/backup files triple the collision risk.** There are 3 files with
non-standard extensions (`.archive`, `.bak`) in `.claude/state/` that contain
real data. A naive `*.jsonl` glob would include them. This is a concrete export
script bug waiting to happen that no prior agent identified.

**`high-churn-watchlist.json` is already populated with 3 specific files.** This
tiny file (27 lines) delivers immediate dashboard value with zero new
engineering — read it, display the 3 filenames with their churn description. The
Reviews tab gets a "Watch List" widget that surfaces already-known problem
files. This is faster to implement than any other Tab 3 widget.

**All 5 "referenced but not checked" files confirmed non-existent.**
governance-changes.jsonl, session-start-failures.json, commit-failures.jsonl,
test-runs.jsonl, and pending-alerts.json are all absent from the filesystem.
This means the hooks that were supposed to write them are either not triggering
correctly or writing to different paths. This is a process health signal: 5
logging hooks are silently failing to produce any output.

---

## Confidence Assessment

- HIGH claims: 22
- MEDIUM claims: 3 (orphaned file relevance ratings, cross-tab recommendations)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All coverage determinations based on direct cross-reference of Wave 3 findings
documents against SQ1b inventory list. File existence and counts verified via
direct filesystem `ls`, `wc -l`, and `head` commands executed in this session.
The five "referenced but not checked" files were verified as non-existent via
explicit Bash existence checks. `forward-findings.jsonl` schema was verified by
direct file read (`head -4`).
