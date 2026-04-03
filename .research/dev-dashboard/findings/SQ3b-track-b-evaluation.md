# Findings: Track B Evaluation Against Wave 1 Findings

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ3b

---

## Method

All nine Wave 1 findings files were read in full. ROADMAP.md (Track B section,
lines 379-430) and OPERATIONAL_VISIBILITY_SPRINT.md (Track B spec, lines
102-154) were read directly. The existing component tree (`components/dev/`,
`app/dev/`) was inspected to establish current implementation baseline. This
evaluation takes each Track B item at face value (original spec) and
cross-references it against what Wave 1 discovered about the actual data
landscape.

---

## Current State Baseline

From direct file inspection:

- **B1 and B2 complete:** `/dev` route exists with auth gate; Lighthouse script
  (`B2: PERF-001`) exists.
- **B3–B5 not started:** Lighthouse CI integration, Firestore history storage,
  Lighthouse tab are planned but not implemented.
- **B6–B9 stubbed as placeholders:** `dev-dashboard.tsx` renders
  `PlaceholderTab` components for Errors, Sessions, Docs, and Overrides tabs. No
  data pipeline wired.
- **B10–B11 not started:** System Health and Warnings Resolution tabs defined in
  ROADMAP.md but have no component files.

The track has 5 placeholder stubs plus 4 unstarted items. The data landscape is
now fully inventoried: ~163 persistent files, 36 HIGH-relevance sources, an
8,472-record debt corpus, and 30+ health categories across two overlapping log
systems.

---

## Per-Item Evaluation: B3–B11

### B3: Lighthouse CI Integration (2hr)

**Original scope:** Wire Lighthouse script (B2) into CI pipeline so scores are
captured per-merge. Depends on B1 and B2.

**Still valid?** YES — with one caveat.

**Evidence:**

- Wave 1 found no Lighthouse history log (SQ1b: no `lighthouse-history.jsonl` in
  the data inventory). CI integration produces the data that a Lighthouse tab
  needs; without it, B5 shows historical scores from a single manual run.
- The `/dev` route (B1) and script (B2) are done. B3 is the natural next step to
  generate the data layer B5 will consume.

**Recommended change:** Keep as-is. The 2hr estimate is reasonable. Add a
clarification that CI should write scores to a committed JSONL file (e.g.,
`docs/lighthouse/scores.jsonl`) readable by the static dashboard, not just an
artifact that is thrown away in CI logs.

---

### B4: Firestore History Storage (2hr)

**Original scope:** Store dashboard history data in Firestore so tabs can show
trends over time. Listed as a shared dependency for B5–B9 (all tabs "depend:
B4").

**Still valid?** PARTIALLY — the premise needs re-evaluation.

**Evidence:**

- Wave 1 (SQ1b) discovered that the project already has ~163 persistent files
  including rich time-series JSONL data: `ecosystem-health-log.jsonl` (32
  entries), `hook-runs.jsonl` (114 entries), `commit-log.jsonl` (634 entries),
  `reviews.jsonl` + `reviews-archive.jsonl` (501 combined entries),
  `velocity-log.jsonl` (50 entries), `health-score-log.jsonl` (24 entries),
  `metrics-log.jsonl` (114 entries), `MASTER_DEBT.jsonl` (8,472 records).
- All of these already exist on disk. Writing them _again_ to Firestore doubles
  the storage model, introduces sync overhead, and creates a secondary source of
  truth that can drift from the canonical JSONL files.
- The static export strategy (SQ1b) identified that field-stripped JSONL files
  can be bundled into the Next.js static build directly: MASTER_DEBT strips from
  7.3MB to ~300KB; health/hook files are 10–25KB each. Total static payload is
  feasible without Firestore.
- The OPERATIONAL_VISIBILITY_SPRINT.md spec (week 2 text box) says B4 is
  "PERF-003 - Firestore History Storage" — it was originally conceived to store
  Lighthouse CI results, not the full data ecosystem. But ROADMAP.md generalized
  it to be the dependency for all B5–B9 tabs.

**Recommended change:** Modify scope significantly. B4 should be split:

- **B4a (keep):** Persist Lighthouse CI scores to a committed file
  (`docs/lighthouse/scores.jsonl`) so B5 can read them. This is the original
  intent.
- **B4b (new question):** Determine the data access model for ALL tabs: static
  files bundled into the Next.js build vs. read from Firestore vs. read via an
  API route at runtime. This is an architecture decision that Track B did not
  make explicitly. Wave 1 shows the data already exists as local JSONL — a
  static bundle approach is simpler and avoids Firestore for dev-internal data.

The broad "store dashboard history in Firestore" framing is now superseded by
the known-data landscape. Firestore is unnecessary overhead for data that
already lives on disk and doesn't need cloud sync.

---

### B5: Lighthouse Dashboard Tab (3hr)

**Original scope:** Build the Lighthouse tab UI showing performance scores with
historical trends. Depends on B3, B4.

**Still valid?** YES.

**Evidence:**

- Lighthouse is a clean, bounded data domain that has no equivalent in the JSONL
  state files. It does not overlap with any of the richer data sources Wave 1
  found.
- The placeholder component is already stubbed
  (`activeTab === "lighthouse" && <LighthouseTab />` — actually this IS
  implemented, not a placeholder. `<LighthouseTab>` component file exists).
  Checking the component file: `app/dev/` has `lighthouse-tab.tsx`. The tab
  renders.
- Need to verify whether `lighthouse-tab.tsx` is populated with real data or a
  stub. But the B5 item is the most self-contained tab in the set.

**Recommended change:** Keep as-is. Note that if B4a (Lighthouse-specific
history file) is delivered, B5 should consume that file rather than live
Firestore data.

---

### B6: Error Tracing Tab (2hr)

**Original scope:** Local error aggregation + Sentry link; npm audit security
results display; filter by severity and component. Depends on B4.

**Still valid?** PARTIALLY — the data model needs expansion.

**Evidence from Wave 1:**

- SQ1a-4 (sonarcloud skill): `MASTER_DEBT.jsonl` (8,472 records) tracks code
  quality issues with severity S0–S3, category, file, and status. This is far
  richer error/issue data than "local error aggregation + Sentry link."
- SQ1a-4 (pr-review): `reviews.jsonl` + `reviews-archive.jsonl` (501 combined
  entries) track per-PR fix/defer/reject counts with severity breakdowns
  (critical/major/minor/trivial).
- SQ1c-1 (debt lifecycle): `metrics.json` is already dashboard-ready with
  `by_severity`, `by_category`, `by_status`, `by_source`, and trend data.
- SQ1b: `docs/technical-debt/logs/metrics-log.jsonl` (114 entries) is the debt
  trend-over-time file — burn-down chart data already exists.
- SQ1a-5 (forward-findings): `forward-findings.jsonl` (4 records, growing) is a
  pre-aggregated "things to watch" feed — exactly the kind of active-issue
  surface B6 was imagining.

The original B6 was limited to "Sentry errors + npm audit." Wave 1 reveals this
should expand to cover the full quality issue picture: S0/S1 debt items, active
review-deferred items, npm audit results, and forward-findings.

**Recommended change:** Modify scope. Rename to "Quality & Issues Tab" or
"Debt + Errors Tab." Expand data sources to include:

1. `metrics.json` summary (S0/S1/S2/S3 counts with trend from
   `metrics-log.jsonl`)
2. `forward-findings.jsonl` (active escalated concerns)
3. `raw/review-needed.jsonl` (27 triage-queue items)
4. npm audit results (keep from original spec)
5. Sentry link (keep from original spec)
6. Estimated effort increase: 3–4hr instead of 2hr given broader data scope.

---

### B7: Session Activity Tab (2hr)

**Original scope:** Session activity monitoring. Depends on B4. Original
OPERATIONAL_VISIBILITY_SPRINT spec does not elaborate further — the B7
description is a one-liner.

**Still valid?** PARTIALLY — the data is richer than anticipated, but the tab
concept is valid.

**Evidence from Wave 1:**

- SQ1c-2 (session/hooks): `velocity-log.jsonl` has structural gaps —
  `items_completed: 0` in all 50 sampled records. Session activity via velocity
  is currently broken (track-session.js extraction failure). A Session Activity
  tab built on velocity-log.jsonl would show nothing meaningful today.
- SQ1b: `commit-log.jsonl` (634 entries) is the richest session-activity proxy:
  branch, message, session ID (sometimes null for seeded commits), timestamps.
  Git activity IS tracked.
- SQ1b: `agent-invocations.jsonl` (92 entries) tracks agent name, sessionId,
  timestamp — agent activity per session is dashboardable.
- SQ1c-2: `hook-runs.jsonl` (114 entries) shows per-commit hook pass/fail/warn
  with check-level breakdown. This is a session-quality signal per commit, not
  per session.
- SQ1b: `handoff.json` provides the current session snapshot (branch, pending
  tasks, git state).
- SQ1c-2: No session duration tracking exists. No log of when sessions begin/end
  from user perspective.

The original "Session Activity Tab" concept is valid but the velocity angle is
broken. The tab should pivot to commit-centric activity rather than
session-centric.

**Recommended change:** Modify scope. Rename to "Activity Tab" and pivot to:

1. `commit-log.jsonl` — commit timeline (last 30 commits) with branch, message,
   hook outcome
2. `agent-invocations.jsonl` — agent activity feed (last 50 invocations with
   timestamps)
3. `hook-runs.jsonl` — hook compliance timeline (pass/warn/fail per commit)
4. `velocity-log.jsonl` — display sprint name even if item count is broken
   (surface the broken state so it can be fixed, not hidden)
5. `handoff.json` — current session in-progress widget (branch + pending steps)

Note: velocity-log.jsonl extraction is a known gap (SQ1c-2) that a future fix
can unlock. Designing the tab around it now means the most interesting metric
will be zero indefinitely.

---

### B8: Document Sync Tab (1hr)

**Original scope:** Document sync status display. Depends on B4. One-liner in
ROADMAP.md.

**Still valid?** PARTIALLY — but data availability is limited and requires new
persistence work.

**Evidence from Wave 1:**

- SQ1c-3 (docs-maintain): `docs:sync-check` produces only stdout (exit 0/1/2) —
  no persistent output. There is no `doc-sync-history.jsonl`. A dashboard cannot
  show "sync status last Tuesday" without running the check live.
- SQ1c-3 (DOCUMENTATION_INDEX.md): 726 active docs, 104 archived. This is
  regenerated on every commit by pre-commit hook. Doc count stats are readable
  from the current file but not historical.
- SQ1a-3 (docs-maintain skill): Dashboard relevance rated LOW because no
  structured machine-readable output exists for sync health.
- SQ1c-3 (doc-ecosystem-audit-history.jsonl): Only 1 entry (2026-02-25) — doc
  audit has run once in total. Sparse history.
- SQ1b: `docs/technical-debt/raw/review-needed.jsonl` (27 items) and
  `docs/technical-debt/views/` provide indirect doc quality signals.

The Document Sync tab as originally conceived (1hr) is underpowered because:

1. No persistent sync-check history exists — you cannot show trends
2. The only dashboardable doc data is: current `DOCUMENTATION_INDEX.md` stats
   (726/104 count), debt items in the docs category from `MASTER_DEBT.jsonl`,
   and the 1-entry audit history.

**Recommended change:** Modify scope or merge. Options:

- **Option A:** Reduce to a "Docs Health Widget" (not a full tab) — one panel
  showing: active doc count, archived count, doc-category debt items count, last
  audit date. Estimate: 30min.
- **Option B:** Merge into a broader "Ecosystem Audit Tab" alongside other
  ecosystem audits. This is the stronger design (see Missing from Track B
  section).
- **Option C:** Keep as a tab but redesign it as a live doc-optimizer trigger
  surface (run the check, show results, link to TDMS debt items). Estimate: 2hr
  with live-check approach.

The 1hr estimate is too low if real data pipeline work is included; 30min if
it's a static widget.

---

### B9: Override Audit Tab (1hr)

**Original scope:** Override audit trail display. Depends on B4.

**Still valid?** YES — this is the most data-ready tab in the unimplemented set.

**Evidence from Wave 1:**

- SQ1c-2 (override log): `override-log.jsonl` (committed file, SQ1b confirms it
  exists) has a clean schema:
  `{timestamp, check, reason, user: "redacted", cwd: "redacted", git_branch}`.
  This is already committed, privacy-preserving, and machine-readable.
- SQ1c-2: Recent overrides show `reviewer` and `doc-header` as most common
  bypass reasons. The data exists and is growing.
- SQ1b: The override-log schema is confirmed as dashboardable with no
  transformation needed.
- SQ1c-2: The `/alerts` skill reads override-log.jsonl for "50%+ override trend
  spike" detection. A dashboard showing the override rate over time makes this
  trend visible without needing an alert to fire first.

**Recommended change:** Keep as-is, but the 1hr estimate may be low if the goal
is trend visualization (override rate over time, by check type). A simple table
of recent overrides is 1hr; a trend chart with breakdown by check type is 2hr.
The data fully supports both.

---

### B10: System Health Tab (3hr)

**Original scope:** Pattern compliance status, CI gate status, script test
coverage, pre-commit timing, backlog health from `check-backlog-health.js`,
agent compliance from `.session-agents.json`, historical trends.

**Still valid?** PARTIALLY — some sub-items are misaligned with Wave 1 findings.

**Evidence from Wave 1:**

Sub-item analysis:

1. **"Pattern compliance status (0 violations — zero baseline achieved)"** — The
   ROADMAP.md note says zero baseline achieved. SQ1c-2 shows `hook-runs.jsonl`
   records pattern compliance checks per commit. SQ1c-3 shows
   `enforcement-manifest.jsonl` (360 records) tracks which patterns have ESLint
   gates vs. behavioral-only enforcement. This sub-item is valid but the data
   source is `hook-runs.jsonl` + `enforcement-manifest.jsonl`, not a standalone
   "pattern compliance status" file.

2. **"CI gate status, script test coverage"** — These are Track D items (D4,
   D10), not dashboard data sources. CI gate status requires GitHub API
   (`gh run list`) or a CI-side artifact. Script test coverage percentage is not
   tracked in any persistent file discovered by Wave 1. Both require new data
   production before they can be displayed.

3. **"Pre-commit timing, agent compliance"** — SQ1c-2 shows:
   - Pre-commit timing: `hook-runs.jsonl` has `total_duration_ms` per hook run.
     Data exists.
   - Agent compliance: `.session-agents.json` is _deleted at session-end_. It is
     ephemeral. A dashboard cannot read it after the session closes.
     `agent-invocations.jsonl` is the persistent alternative.

4. **"Backlog health from check-backlog-health.js"** — SQ1c-1: `metrics.json`
   and `metrics-log.jsonl` provide debt backlog health. The
   check-backlog-health.js script output is not separately persisted. The TDMS
   metrics are the right data source.

5. **"Historical trends"** — Wave 1 revealed two overlapping health log systems:
   - `.claude/state/health-score-log.jsonl` (24 entries, 36 categories)
   - `data/ecosystem-v2/ecosystem-health-log.jsonl` (32 entries, richer format)
     Both are trend data. The dual-log problem (SQ1c-3) means a dashboard must
     decide which to consume.

**Recommended change:** Keep as a tab but rationalize the data sources:

- Replace "agent compliance from .session-agents.json" →
  `agent-invocations.jsonl` (persistent)
- Replace "backlog health from check-backlog-health.js" → `metrics.json` +
  `metrics-log.jsonl`
- Replace "CI gate status" → GitHub API call (requires runtime fetch, not static
  file)
- Replace "pattern compliance" → `hook-runs.jsonl` pattern-check status +
  `enforcement-manifest.jsonl`
- Add "health score trend" → `ecosystem-health-log.jsonl` (the primary rich
  source)
- Resolve dual-log confusion: standardize on
  `data/ecosystem-v2/ecosystem-health-log.jsonl`
- Effort estimate should increase from 3hr to 4–5hr given data source
  rationalization work.

This tab is the most conceptually important but currently has the most internal
inconsistencies between what Track B specified and what the data actually looks
like.

---

### B11: Warnings Resolution Tab (3hr)

**Original scope:** Display unresolved hook warnings; resolution actions
(Acknowledge/Resolve/Suppress); connect to `false-positive.json` system; aging
alerts (>7 days); session warning history. Depends on B4, E1.

**Still valid?** YES — with data model clarification.

**Evidence from Wave 1:**

SQ1c-2 (hook warning schema):

```json
{
  "hook": "pre-push|pre-commit|post-write|...",
  "type": "trigger|reviewer|propagation-staged|...",
  "severity": "error|warning|info",
  "message": "...",
  "action": "...|null",
  "timestamp": "ISO 8601",
  "occurrences": 13,
  "occurrences_since_ack": 13,
  "actor": "hook-system",
  "user": "jason|jbell|redacted",
  "outcome": "warned"
}
```

- `hook-warnings-log.jsonl` (68 entries, HIGH relevance) is the data source.
  Schema is confirmed and machine-readable.
- `hook-warnings-ack.json` contains the `lastCleared` timestamp used for
  acknowledgment.
- SQ1c-2: The warning system distinguishes between `occurrences` and
  `occurrences_since_ack` — supporting the aging and recurrence tracking the tab
  needs.
- SQ1c-2: Most persistent warning is `cognitive-cc` on pre-push (every single
  pre-push run). A dashboard trend would make this chronic nature explicit.
- The `false-positive.json` reference in the original spec is not confirmed in
  Wave 1's inventory. The closest equivalent is
  `.claude/state/alert-suppressions.json` (suppression rules) and
  `data/ecosystem-v2/warnings.jsonl` (warning lifecycle tracking via
  warning-lifecycle.js).

**Dependency on E1:** Track B11 depends on E1 (Warning Collector Hook). E1 was
moved to SWS Phase 3 (Hooks ecosystem). This creates a blocker for B11 if E1 is
not delivered first. However, SQ1c-2 confirms that `hook-warnings-log.jsonl` is
already being written by `post-write-validator.js` and
`pre-commit-agent-compliance.js` without needing E1. The data exists; E1 was
meant to _improve_ collection, not create it.

**Recommended change:** Keep as-is, clarify the E1 dependency. B11 can be built
against the existing `hook-warnings-log.jsonl` data today. E1 (if delivered)
would enrich the data source but is not a hard prerequisite. The
`false-positive.json` reference should be mapped to `alert-suppressions.json` or
`data/ecosystem-v2/deferred-items.jsonl`.

---

## Missing from Track B

Wave 1 discovered the following HIGH-relevance dashboard capabilities that Track
B does not cover:

### Gap 1: Ecosystem Health Overview (PRIMARY)

**What's missing:** No dedicated tab for the composite health score system.

**Data available:**

- `data/ecosystem-v2/ecosystem-health-log.jsonl` (32 entries, 30+ category
  scores) — health trend
- `data/ecosystem-v2/warnings.jsonl` (16 active warnings) — active warning queue
  with lifecycle
- `.claude/state/alerts-baseline.json` — current baseline for comparison
- `.claude/state/health-score-log.jsonl` (24 entries, 36 categories) — parallel
  health tracking
- `data/ecosystem-v2/lifecycle-scores.jsonl` (20 systems) — data system health
  matrix

This is the single most data-rich, dashboard-native gap. The `/alerts` skill and
`/ecosystem-health` skill produce exactly the kind of time-series data (grade
A/B/C/D/F, per-category scores, trend direction) that should be the hero widget
on any developer command center. Track B has no tab for this.

**Suggested addition:** "Health Overview" tab (or top-level dashboard panel) —
composite score card, per-category sparklines, active warning count, trend
direction indicator. Estimated effort: 4hr.

---

### Gap 2: TDMS Debt Dashboard

**What's missing:** No dedicated tab for technical debt analytics.

**Data available:**

- `docs/technical-debt/metrics.json` — already dashboard-ready summary
  (S0/S1/S2/S3 counts)
- `docs/technical-debt/logs/metrics-log.jsonl` (114 entries) — debt trend over
  time (burn-down)
- `docs/technical-debt/MASTER_DEBT.jsonl` (8,472 records, 8 categories) — full
  debt corpus
- `data/ecosystem-v2/warnings.jsonl` — debt-aging warnings
- `docs/technical-debt/raw/review-needed.jsonl` (27 items) — triage queue

The TDMS corpus is the largest, most structured data source in the entire
project. Track B mentions it only obliquely in B10 (backlog health). There is no
tab dedicated to visualizing debt severity distribution, category breakdown,
trend over time, or active S0/S1 count. The 13% resolution rate across 8,472
items (noted serendipitously in SQ1c-1) is a dashboard metric that doesn't exist
anywhere in the current UI.

**Suggested addition:** "Debt" tab — current S0/S1/S2/S3 counts with trend line,
category heatmap, resolution rate, top debt files. Estimated effort: 3–4hr.

---

### Gap 3: PR Review Analytics

**What's missing:** No tab for PR review quality trends.

**Data available:**

- `reviews.jsonl` + `reviews-archive.jsonl` (501 combined entries) — full review
  history
- `review-metrics.jsonl` (52 entries) — per-PR fix_ratio, review_rounds
- `retros.jsonl` (57 entries) — retrospective action items, recurring patterns
- `forward-findings.jsonl` (4 records, growing) — active escalated concerns

SQ1a-4 rated pr-review and pr-retro as HIGH dashboard relevance. Fix rates,
rejection patterns, recurring issues across PRs, and retro action item
completion are all time-series data that Track B completely ignores. The B6
"Error Tracing Tab" partially overlaps (npm audit, Sentry errors) but doesn't
address the PR/review analytics dimension.

**Suggested addition:** "Reviews" tab — review rounds per PR trend,
fix/defer/reject ratio, recurring pattern frequency (from retros.jsonl), active
forward-findings. Estimated effort: 3hr.

---

### Gap 4: Ecosystem Audit Coverage

**What's missing:** No tab showing audit history and staleness.

**Data available:**

- 7 `*-ecosystem-audit-history.jsonl` files (hook: 25 entries, skill: 15
  entries, script: 9 entries)
- `audit-agent-quality-history.jsonl` (1 entry)
- Comprehensive audit report: `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md`
  (refreshed each run)
- Weighted composite: Hook 14%, Skill 18%, TDMS 14%, PR 14%, Script 12%, Health
  10%, Session 9%, Doc 9%

SQ1c-3 found that doc, session, and TDMS ecosystem audit histories have only 1
entry each — these audits have barely been run. A dashboard showing "last run
date" per audit type would surface the staleness problem that is currently
invisible. No part of Track B captures this audit cadence signal.

**Suggested addition:** "Audits" panel (possibly merged with Health Overview) —
last-run date per audit type, current grade per audit, stale-audit warnings (>30
days since last run). Estimated effort: 2hr.

---

### Gap 5: Activity/Velocity Feed (Accurate Version)

**What's missing:** Track B's B7 (Session Activity) is conceptualized around
velocity-log.jsonl, which Wave 1 found to be broken (`items_completed: 0`
everywhere). The actual activity data is in commit-log.jsonl (634 entries) and
agent-invocations.jsonl (92 entries), which Track B does not reference.

This is addressed in the B7 modification recommendation above, but it's worth
flagging as a gap because the original B7 concept is built on a data source that
doesn't work.

---

## Track B vs Wave 1 Groupings

### Track B's Implicit Groupings

Track B organizes tabs around _types of problems visible to the developer_:

- Performance (B3–B5: Lighthouse)
- Errors (B6: Error Tracing)
- Process (B7: Sessions, B8: Docs, B9: Overrides)
- System health (B10: System Health, B11: Warnings)

This is a feature-surface grouping — organized by "what would I look at as a
developer?"

### Wave 1's Implicit Groupings

Wave 1 (SQ1a-3 cross-skill analysis, SQ1a-4 clusters) organizes around _data
domains_:

**Cluster A: Health & Quality (Primary Panel)**

- ecosystem-health, alerts, debt-runner
- Data: `ecosystem-health-log.jsonl`, `MASTER_DEBT.jsonl`, `metrics.json`,
  `warnings.jsonl`

**Cluster B: Code Quality Pipeline**

- sonarcloud, pr-review, pr-retro
- Data: `MASTER_DEBT.jsonl`, `reviews.jsonl`, `retros.jsonl`,
  `review-metrics.jsonl`

**Cluster C: Session Health & Velocity**

- session-end, session-begin
- Data: `velocity-log.jsonl`, `ecosystem-health-log.jsonl`,
  `hook-warnings-log.jsonl`

**Cluster D: Point-in-Time Audits**

- system-test, pre-commit-fixer, ecosystem audits
- Data: `hook-runs.jsonl`, `*-audit-history.jsonl`

### Alignment Analysis

| Track B Tab          | Wave 1 Cluster Alignment               | Coverage                               |
| -------------------- | -------------------------------------- | -------------------------------------- |
| B5: Lighthouse       | No cluster — isolated domain           | Adequate (self-contained)              |
| B6: Error Tracing    | Cluster B (partial)                    | Undercovers; ignores debt/retro angle  |
| B7: Session Activity | Cluster C (partial)                    | Built on broken data source            |
| B8: Docs Sync        | No cluster — doc data is LOW relevance | Overweighted in Track B                |
| B9: Override Audit   | Cluster C partial (override-log)       | Well-matched; data is ready            |
| B10: System Health   | Cluster A + D (partial)                | Concept correct but data sources wrong |
| B11: Warnings        | Cluster C (hook warnings)              | Data-ready and well-matched            |
| MISSING              | Cluster A: Health Overview             | No Track B tab                         |
| MISSING              | Cluster B: TDMS Debt                   | No Track B tab                         |
| MISSING              | Cluster B: PR Review Analytics         | No Track B tab                         |

### Key Misalignments

1. **B8 (Docs Sync) is overweighted.** Track B assigns it a dedicated tab. Wave
   1 found docs sync produces no persistent history data — only live CLI output.
   The doc dimension is LOW dashboard relevance compared to health and debt.
   Track B probably should have one fewer tab here.

2. **Health monitoring is missing entirely.** The `/ecosystem-health` +
   `/alerts` system (the most analytics-rich system in the project, with 32+
   entries and 30 categories) has no tab in Track B. This is the biggest
   structural gap.

3. **TDMS debt is buried in B10.** With 8,472 records and a dedicated metrics
   system, debt deserves its own tab, not a line item in the System Health
   checklist.

4. **B6 was sized too small.** "Error Tracing + npm audit" at 2hr missed that
   the same tab should anchor to the full S0/S1 debt surface — a much larger
   data scope that needs more implementation time.

---

## Verdict

**Should Track B be kept, replaced, or used as a starting point?**

**Use as a starting point, with structural revision.**

### What to Keep From Track B

- B1, B2: Complete — keep as-is.
- B3: Lighthouse CI integration — keep as-is, clarify output format to JSONL.
- B4a: Lighthouse-specific history storage — keep but scope down from "store
  everything in Firestore" to "write Lighthouse scores to a committed JSONL
  file."
- B5: Lighthouse tab — keep as-is.
- B9: Override Audit tab — keep as-is. Data is ready, concept is well-matched.
- B11: Warnings Resolution tab — keep as-is, with E1 dependency clarified as
  non-blocking.

### What to Modify in Track B

- B4b: Make an explicit architecture decision: static JSONL bundle vs. runtime
  API vs. Firestore. Wave 1's data inventory makes the static-file approach
  viable for most tabs.
- B6: Expand from "Error Tracing + npm audit" to "Quality & Issues" — TDMS
  S0/S1, forward-findings, review-needed queue, npm audit, Sentry link. Increase
  effort estimate from 2hr to 3–4hr.
- B7: Pivot from session-velocity (broken) to commit/agent activity feed. Rename
  to "Activity."
- B8: Scope down to a health widget (30min) or merge into an Ecosystem Audits
  tab. A full dedicated tab for docs sync is not warranted by the data.
- B10: Rationalize data sources — replace `.session-agents.json` (ephemeral)
  with `agent-invocations.jsonl`, replace `check-backlog-health.js` with
  `metrics.json` data, resolve dual-health-log confusion in favor of
  `ecosystem-health-log.jsonl`. Keep the concept but re-spec the implementation
  details.

### What to Add to Track B

Three new items justified by Wave 1 that Track B is missing:

- **B-Health (new):** Ecosystem Health Overview tab — composite health score
  timeline, per-category scorecards, active warnings feed, lifecycle score
  matrix. Effort: 4hr. Priority: HIGH (most data-rich gap).
- **B-Debt (new):** Technical Debt Dashboard tab — S0/S1/S2/S3 counts with trend
  line, category heatmap, resolution rate, triage queue. Effort: 3–4hr.
  Priority: HIGH (8,472-record corpus invisible in current UI).
- **B-Reviews (new):** PR Review Analytics tab — review round trends,
  fix/defer/reject ratios, recurring patterns (retros.jsonl), forward-findings
  feed. Effort: 3hr. Priority: MEDIUM.

### What to Drop

- B4 (broad Firestore storage): The premise of writing all dashboard data to
  Firestore is superseded by the existence of ~163 local JSONL files. The
  architecture question it raised must be resolved, but the
  Firestore-as-history-store approach should not proceed without explicit
  justification.

### Revised Track B Summary

| Item      | Status   | Change                                              |
| --------- | -------- | --------------------------------------------------- |
| B1        | Done     | Keep                                                |
| B2        | Done     | Keep                                                |
| B3        | Keep     | Add JSONL output format spec                        |
| B4a       | Modified | Scope to Lighthouse-specific file only              |
| B4b       | New      | Architecture decision: static vs. Firestore vs. API |
| B5        | Keep     | No change                                           |
| B6        | Modified | Expand to Quality+Issues tab, 3–4hr                 |
| B7        | Modified | Pivot to Activity feed, rename                      |
| B8        | Modified | Scope down to widget or merge into Audits tab       |
| B9        | Keep     | No change, data is ready                            |
| B10       | Modified | Rationalize data sources (4–5hr)                    |
| B11       | Keep     | Clarify E1 dependency is non-blocking               |
| B-Health  | NEW      | Ecosystem Health Overview tab (4hr)                 |
| B-Debt    | NEW      | Technical Debt Dashboard tab (3–4hr)                |
| B-Reviews | NEW      | PR Review Analytics tab (3hr)                       |

---

## Sources

| #   | Path                                                               | Title                            | Type                  | Trust | Date       |
| --- | ------------------------------------------------------------------ | -------------------------------- | --------------------- | ----- | ---------- |
| 1   | `ROADMAP.md` lines 379–430                                         | Track B specification            | codebase-canonical    | HIGH  | 2026-03-19 |
| 2   | `docs/OPERATIONAL_VISIBILITY_SPRINT.md` lines 102–154              | Track B full spec                | codebase-canonical    | HIGH  | 2026-02-23 |
| 3   | `.research/dev-dashboard/findings/SQ1b-data-inventory.md`          | Full data landscape (~163 files) | prior-research        | HIGH  | 2026-03-29 |
| 4   | `.research/dev-dashboard/findings/SQ1a-3-operational-skills-am.md` | Skills A-M data catalog          | prior-research        | HIGH  | 2026-03-29 |
| 5   | `.research/dev-dashboard/findings/SQ1a-4-operational-skills-nz.md` | Skills N-Z data catalog          | prior-research        | HIGH  | 2026-03-29 |
| 6   | `.research/dev-dashboard/findings/SQ1a-5-remaining-skills.md`      | Remaining skills catalog         | prior-research        | HIGH  | 2026-03-29 |
| 7   | `.research/dev-dashboard/findings/SQ1c-1-process-debt-review.md`   | Debt + PR review processes       | prior-research        | HIGH  | 2026-03-29 |
| 8   | `.research/dev-dashboard/findings/SQ1c-2-process-session-hooks.md` | Session lifecycle + hooks        | prior-research        | HIGH  | 2026-03-29 |
| 9   | `.research/dev-dashboard/findings/SQ1c-3-process-health-audits.md` | Health monitoring processes      | prior-research        | HIGH  | 2026-03-29 |
| 10  | `components/dev/dev-dashboard.tsx`                                 | Current implementation state     | codebase-ground-truth | HIGH  | current    |
| 11  | `components/dev/dev-tabs.tsx`                                      | Current tab structure            | codebase-ground-truth | HIGH  | current    |

---

## Contradictions

**B4 premise vs. data reality:** Track B treats Firestore as the necessary
persistence layer (B4 as dependency for B5–B9). Wave 1 reveals ~163 local JSONL
files already exist with rich historical data. These are fundamentally different
architectures. The Track B spec cannot be partially followed without first
resolving this architectural fork.

**B10 agent compliance source vs. reality:** Track B says "agent compliance from
`.session-agents.json`" (SQ1c-2 confirms this file is deleted at session-end).
The data is not available post-session. `agent-invocations.jsonl` is the
surviving alternative, but it has different schema and granularity.

**B11 E1 dependency vs. existing data:** Track B marks B11 as depending on E1
(Warning Collector Hook). E1 was moved to SWS Phase 3 (blocking). But SQ1c-2
confirms `hook-warnings-log.jsonl` is already being written by existing hooks
without E1. The dependency is overstated.

**velocity-log.jsonl broken state:** Track B's B7 concept (Session Activity)
implicitly assumes velocity tracking works. Wave 1 (SQ1c-2) found
`items_completed: 0` in all 50 sampled records. The primary data source for
"session activity" is broken.

---

## Gaps

1. **Lighthouse tab current state:** `lighthouse-tab.tsx` exists but its
   implementation was not read in this research. Unknown whether it shows real
   data or a stub. If it's still a stub, B5 may be partially incomplete.

2. **B4 Firestore vs. static architecture decision:** Wave 1 surfaces the
   question but does not resolve it. The decision requires knowing: How is the
   `/dev` route deployed? Does it have server components or is it purely static
   export? What is the Firebase cost implication of reading state JSONL files
   via Cloud Functions vs. bundling them at build time?

3. **track-session.js root cause:** Why does velocity-log.jsonl show
   `items_completed: 0` for all 50 sampled entries? Understanding the root cause
   would determine whether B7 (Activity tab) can rely on velocity data in the
   future or whether the data source needs replacement.

4. **`.session-agents.json` lifetime gap:** The pre-commit agent compliance hook
   reads `.session-agents.json` at commit time, but the file is deleted at
   session-end. If a commit is made after session-end (or without session-end),
   compliance cannot be verified from the dashboard. The coverage gap size is
   unknown.

---

## Serendipity

**`metrics.json` is the only existing deliberately dashboard-ready artifact.**
Of 163 files inventoried, `docs/technical-debt/metrics.json` is the only one
whose schema was explicitly designed for machine consumption with keys like
`generated`, `summary`, `by_status`, `by_severity`, `by_category`, `by_source`,
and `alerts`. All other data sources require varying amounts of transformation.
The TDMS team already solved the "how do you make JSONL dashboard-friendly?"
problem. The answer they arrived at (pre-aggregated JSON summary + raw JSONL for
drill-down) should be the template for every other data domain.

**The dual health-log problem is a pre-existing architectural debt.**
`.claude/state/health-score-log.jsonl` and
`data/ecosystem-v2/ecosystem-health-log.jsonl` both track health scores but in
different formats with different record counts (24 vs. 32). Any dashboard
consuming health data will encounter this immediately. Resolving which is
canonical (the `data/ecosystem-v2/` one is the richer, newer format) should be a
prerequisite for the Health tab, not a discovery during implementation.

**Multi-locale operation is baked into the warning data.**
`hook-warnings-log.jsonl` contains entries from `user: jason`, `user: jbell`,
and `user: redacted` on consecutive days. The dashboard will surface warnings
from two work machines. Filtering or faceting by locale (machine origin) may be
a useful feature that Track B did not anticipate.

**`enforcement-manifest.jsonl` (360 records) is a pattern-coverage dataset no
one has visualized.** This file (discovered serendipitously in SQ1b) maps each
security/quality pattern to its enforcement mechanism (ESLint gate vs.
behavioral-only). A "pattern coverage" widget showing "X% of patterns are
gate-enforced" versus "Y% are behavioral-only" would be a compelling governance
metric that currently exists nowhere. It was not in Track B's scope at all.

---

## Confidence Assessment

- HIGH claims: 18 (all data source findings cross-verified against multiple Wave
  1 files and direct component inspection)
- MEDIUM claims: 6 (scope/effort estimates and architectural recommendations
  involve judgment)
- LOW claims: 1 (lighthouse-tab.tsx implementation status not verified by
  reading the file)
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**
