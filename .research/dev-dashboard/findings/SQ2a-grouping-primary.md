# Findings: Tab Grouping Proposals for Dev Dashboard

**Searcher:** deep-research-searcher **Profile:** synthesis (codebase findings)
**Date:** 2026-03-29 **Sub-Question IDs:** SQ2a

---

## Method

All 9 Wave 1 findings files were read in full. This synthesis identifies
recurring grouping signals across skill catalog data (SQ1a-1 through SQ1a-5),
the data inventory (SQ1b), and the process investigations (SQ1c-1 through
SQ1c-3). Groupings emerge from three primary lenses:

1. **Data affinity** — which files are read/written by the same skills and
   scripts
2. **User intent** — what question does a developer actually come to the
   dashboard to answer?
3. **Natural feedback loops** — which metrics are preconditions or consumers of
   other metrics?

Settled decisions applied throughout:

- D1: Lighthouse -> admin, not dev
- D4: Dev = build pipeline + dev process
- D7: Every tab gets web->CLI handoff (clipboard commands)
- D9: Desktop only

---

## Observed Grouping Signals from Wave 1

Before proposing tab options, these patterns emerged consistently across all
nine findings files:

### Signal 1: Three Distinct Data Tiers

The data inventory (SQ1b) shows clearly that not all data is equal for a
dashboard:

- **Tier P0** (always current, dashboard-native): `metrics.json`,
  `health-score-log.jsonl`, `ecosystem-health-log.jsonl`, `hook-runs.jsonl` —
  these are machine-written, append-only, and designed for consumption
- **Tier P1** (rich history, needs filtering): `reviews.jsonl` +
  `review-metrics.jsonl`, `retros.jsonl`, `commit-log.jsonl`,
  `velocity-log.jsonl`, `agent-invocations.jsonl`
- **Tier P2** (periodic snapshots): ecosystem audit history files,
  `lifecycle-scores.jsonl`, `research-index.jsonl`

This suggests a natural distinction between a **live status** tab (P0), a
**history/trend** tab (P1), and an **audit/governance** tab (P2).

### Signal 2: Two Warning Systems That Need Unification

SQ1c-3 identified two parallel warning pipelines:

- `data/ecosystem-v2/warnings.jsonl` — full lifecycle
  (new/acknowledged/resolved), richer metadata
- `.claude/state/hook-warnings-log.jsonl` — real-time hook events, more frequent

A dashboard that only shows one will miss half the picture. Any "warnings" or
"health" tab must aggregate both.

### Signal 3: The Debt Pipeline Is Fully Queryable

SQ1c-1 confirmed that `docs/technical-debt/metrics.json` is already
dashboard-ready with `summary`, `by_status`, `by_severity`, `by_category`,
`by_source`, and a `generated` timestamp. MASTER_DEBT.jsonl (8,472 items) +
`metrics-log.jsonl` (114 trend snapshots) provides both current state and trend
data. This is the richest fully-structured data source and warrants its own tab.

### Signal 4: Review Quality Has a Complete Paper Trail

From SQ1a-4 and SQ1c-1:

- `reviews.jsonl` + `reviews-archive.jsonl` = 501 review records total
- `review-metrics.jsonl` = 52 PR-level fix-rate records
- `retros.jsonl` = 57 retrospective records with action items and verify
  commands

These three files form a coherent "code review quality" narrative independent of
debt metrics. They answer: "are reviews improving? are recurring patterns being
eliminated?"

### Signal 5: Session/Hook Activity Is Continuous and Automation-Heavy

SQ1c-2 found that hooks fire on every commit, push, write, and agent invocation
— generating dense event logs. The automation footprint (`hook-runs.jsonl`,
`agent-invocations.jsonl`, `commit-log.jsonl`, `override-log.jsonl`) is a
distinct domain from health scores. These logs answer: "what happened in the
last session? what did the automation do?"

### Signal 6: Planning/Research Are Activity Feeds, Not Health Metrics

From SQ1a-3 (deep-plan, deep-research, convergence-loop): these skills produce
point-in-time artifacts (`research-index.jsonl`, plan state files) rather than
continuous metrics. They are better as an "activity feed" or "in-progress work"
view than as dashboard health charts.

### Signal 7: Ecosystem Audits Are Periodic and Low-Frequency

SQ1c-3 revealed that most ecosystem audit history files have only 1-9 entries
spanning months. Hook audit (25 entries) and skill audit (15 entries) are
exceptions. These are not daily-use data — they belong in an "audit history" or
"governance" context, not in the main operational view.

---

## Grouping Option A: "By Developer Question"

**Organizing principle:** Each tab answers exactly one operational question a
developer would ask. Tabs are question-oriented, not data-source-oriented.

### Tab A1: Status (What is the project's health right now?)

**What it shows:**

- Composite health grade (A-F) from `ecosystem-health-log.jsonl` — most recent
  entry, trend sparkline (last 10)
- Active warnings badge count from `data/ecosystem-v2/warnings.jsonl` +
  `hook-warnings-log.jsonl` (unified)
- S0 + S1 open debt count from `metrics.json` with red/amber/green threshold
- Hook compliance: last 5 pre-commits pass/fail from `hook-runs.jsonl`
- "Grade dropped N grades since YYYY-MM-DD" regression alert (derived from
  `health-score-log.jsonl`)

**Data sources:**

- `data/ecosystem-v2/ecosystem-health-log.jsonl` (32 entries, daily frequency)
- `.claude/state/health-score-log.jsonl` (24 entries — supplement for grade-drop
  detection)
- `data/ecosystem-v2/warnings.jsonl` (active warning lifecycle)
- `.claude/state/hook-warnings-log.jsonl` (real-time hook warnings)
- `docs/technical-debt/metrics.json` (S0/S1 snapshot)
- `.claude/state/hook-runs.jsonl` (last 5 entries)

**CLI handoff commands:**

```
/alerts                                          # full health check + triage
/ecosystem-health                                # deep ecosystem health dashboard
node scripts/health/run-health-check.js --full   # run health check immediately
```

**Evidence from Wave 1:**

- SQ1c-3: "Health score timeline — ecosystem-health-log.jsonl provides grade +
  36 category scores per session-end. A time-series chart...would make the A→B
  regression immediately visible." [Relevance: PRIMARY]
- SQ1b: `ecosystem-health-log.jsonl` rated P0, `health-score-log.jsonl` rated
  P0, both "HIGH dashboard relevance" [Relevance: PRIMARY]
- SQ1c-2: "Grade dropped from A (91) to B (87) between March 19 and March
  26...code dropped from 100 to 60" — exactly the kind of regression this tab
  surfaces [Relevance: CONFIRMING]
- SQ1a-3: "alerts and ecosystem-health have a two-tier health system (quick 15s
  check vs 10-15min full dashboard)...A web dashboard could mirror this tiering"
  [Relevance: ARCHITECTURAL]

**Dependencies:**

- NONE — all data sources confirmed present with real data
- Warning: `data/ecosystem-v2/warnings.jsonl` and `hook-warnings-log.jsonl` must
  be aggregated (two competing warning systems per SQ1c-3)
- Warning: `health-score-log.jsonl` vs `ecosystem-health-log.jsonl` are not
  synchronized — use `ecosystem-health-log.jsonl` as primary for trend,
  `health-score-log.jsonl` for grade-drop alerts only

---

### Tab A2: Debt (What technical debt exists and is it getting better?)

**What it shows:**

- Severity breakdown: S0 (26) / S1 (1,360) / S2 (3,445) / S3 (3,641) as stacked
  bar with trend arrows
- Status distribution: NEW vs VERIFIED vs RESOLVED vs FALSE_POSITIVE with
  resolution rate (currently 13%)
- By-source breakdown: sonarcloud / audit / review / manual as donut chart
- Debt trend line from `metrics-log.jsonl` (114 snapshots) — open count over
  time
- Active S0 items table (26 items) with age in days — S0 items should trend
  toward zero
- Verification queue depth from `raw/review-needed.jsonl` (27 items)

**Data sources:**

- `docs/technical-debt/metrics.json` (current snapshot — fully structured,
  dashboard-ready)
- `docs/technical-debt/logs/metrics-log.jsonl` (114 trend snapshots)
- `docs/technical-debt/MASTER_DEBT.jsonl` (8,472 items — field-stripped for
  browser: ~300KB)
- `docs/technical-debt/raw/review-needed.jsonl` (27 items — triage queue)

**CLI handoff commands:**

```
/debt-runner plan --severity S0,S1              # start resolution plan for critical items
/debt-runner verify                              # run debt verification pass
node scripts/debt/generate-metrics.js           # refresh metrics snapshot
/sonarcloud --sync                               # pull latest SonarCloud issues
```

**Evidence from Wave 1:**

- SQ1b: `MASTER_DEBT.jsonl` rated P0, "8,472 records, primary debt corpus";
  `metrics.json` rated P0, "current debt summary"; `metrics-log.jsonl` rated P0,
  "debt trend over time" [Relevance: PRIMARY]
- SQ1c-1: "metrics.json is already dashboard-ready — the existing file has a
  clean machine-readable structure with `generated` timestamp, `summary`,
  `by_status`, `by_severity`, `by_category`, `by_source`, and trend data. This
  is the only existing artifact explicitly structured for dashboard consumption
  without transformation." [Relevance: PRIMARY]
- SQ1c-1: "The 13% resolution rate across 8,472 items...with S0=26 and
  S1=1360...the web dashboard's single highest-impact vanity metric may be the
  S0+S1 open count with an age histogram." [Relevance: CONFIRMING]
- SQ1a-4 (sonarcloud): "SonarCloud produces the most structured, queryable
  quality data in the stack: severity distributions (S0-S3), issue categories,
  resolution rates, quality gate pass/fail, top-affected files." [Relevance:
  CONFIRMING]

**Dependencies:**

- `metrics.json` exists and is confirmed dashboard-ready (no gap)
- MASTER_DEBT.jsonl needs field-stripping for browser use (7.3MB raw → ~300KB
  stripped): required fields are
  `{id, severity, category, status, effort, file, title, created}`
- `metrics-log.jsonl` format confirmed:
  `{total, open, resolved, s0_alerts, s1_alerts}` per entry

---

### Tab A3: Reviews (How healthy is the PR review process?)

**What it shows:**

- Active PR review: current PR#, round, items remaining from
  `pr-review-state.json`
- Fix rate trend: per-PR fix/defer/reject ratio from `review-metrics.jsonl` (52
  records)
- Round count distribution: how many PRs needed R2, R3, R4+ from
  `review-metrics.jsonl`
- Recurring patterns: top 3 most frequent findings from `retros.jsonl` (57
  records)
- Action item backlog: unverified retro action items with verify commands
- PRs missing retros: list of recent PRs with no retro entry (requires
  cross-referencing reviews.jsonl and retros.jsonl)

**Data sources:**

- `.claude/state/reviews.jsonl` + `reviews-archive.jsonl` (501 total review
  records)
- `.claude/state/review-metrics.jsonl` (52 PR-level metrics)
- `.claude/state/retros.jsonl` (57 retrospective records)
- `.claude/state/pr-review-state.json` (current PR status)

**CLI handoff commands:**

```
/pr-review --pr {N} --round 1                   # start new PR review
/pr-retro {N}                                   # run retrospective for PR
/pr-retro --dashboard                           # open interactive retro dashboard
```

**Evidence from Wave 1:**

- SQ1a-4 (pr-review): "Review cycle data (rounds, fix rates, severity trends,
  rejection patterns) is exactly the kind of structured historical data a
  dashboard can visualize." [Relevance: PRIMARY]
- SQ1a-4 (pr-retro): "Action item completion rates, recurring pattern frequency,
  cross-PR churn analysis...are natural dashboard widgets." [Relevance: PRIMARY]
- SQ1b: `reviews.jsonl` + `reviews-archive.jsonl` rated HIGH, "PR churn trends";
  `review-metrics.jsonl` rated HIGH, "fix-rate trends"; `retros.jsonl` rated
  HIGH, "quality retrospectives" [Relevance: PRIMARY]
- SQ1c-1: "Per-PR fix/defer/reject ratios across all rounds. Review round counts
  per PR...Fix rate trend: PR #411 had 415 items across 9 batches; PR #461 had 7
  items in R1" — the trend data exists and is meaningful [Relevance: CONFIRMING]

**Dependencies:**

- All data sources confirmed present with real data
- Minor gap: SQ1c-1 notes `retros.jsonl`'s verify-command re-verification
  results "are computed but it is not clear...that they are persisted as a
  distinct record" — action item freshness data may require re-verification at
  dashboard load time

---

### Tab A4: Activity (What happened in this session and recently?)

**What it shows:**

- Session timeline: last 20 commits from `commit-log.jsonl` with branch,
  message, timestamp
- Agent invocations: last session's agents used from `agent-invocations.jsonl`
  (92 records)
- Hook compliance this session: auto-fix count, warn count, fail count from
  `hook-runs.jsonl`
- Override log: last 10 overrides from `override-log.jsonl` with check name,
  reason, branch
- "Persistent warnings" table: hook warning types that appear in every session
  (e.g., `cognitive-cc` pre-push)

**Data sources:**

- `.claude/state/commit-log.jsonl` (634 records)
- `.claude/state/agent-invocations.jsonl` (92 records)
- `.claude/state/hook-runs.jsonl` (114 records)
- `.claude/override-log.jsonl` (committed, redacted user/cwd)

**CLI handoff commands:**

```
/session-begin                                  # start a new session with health preflight
/session-end                                    # run session closure + metrics pipeline
/checkpoint                                     # save current session state
node scripts/log-override.js                    # log a hook override with reason
```

**Evidence from Wave 1:**

- SQ1c-2: "Hook Compliance Heatmap — hook-runs.jsonl provides per-check
  pass/warn/fail/skip/auto-fix per commit. A matrix of check vs. date with color
  coding would surface persistent warnings (cognitive-cc) vs. intermittent
  ones." [Relevance: PRIMARY]
- SQ1c-2: "Override Audit Log — override-log.jsonl is clean and committed. A
  table of recent overrides with check, reason, branch, and date would help
  track bypass patterns." [Relevance: PRIMARY]
- SQ1c-2: "Agent Compliance Summary — agent-invocations.jsonl records agent
  name, sessionId, timestamp. A per-session summary of 'agents invoked this
  session' would be dashboard-ready." [Relevance: PRIMARY]
- SQ1c-2: "Auto-Fix Counter — hook-runs.jsonl status: 'auto-fix' events are
  unacknowledged silent remediations. A weekly count of auto-fixes surfaces
  hygiene work that is currently invisible." [Relevance: SUPPORTING]
- SQ1b: `commit-log.jsonl` rated HIGH (634 records, per-commit),
  `agent-invocations.jsonl` rated HIGH [Relevance: CONFIRMING]

**Dependencies:**

- `velocity-log.jsonl` is BROKEN — all sampled entries show `items_completed: 0`
  (SQ1c-2 confirmed). Do NOT include velocity metrics in this tab until the
  underlying `track-session.js` extraction is fixed.
- `commit-log.jsonl` has data quality variation: some entries show
  `session: null` and `filesChanged: 0` for seeded commits. Dashboard should
  handle null gracefully.

---

### Tab A5: Planning (What work is in progress or planned?)

**What it shows:**

- Active research topics from `research-index.jsonl` (4 topics) with depth,
  confidence distribution
- Active plans: deep-plan state files with phase and decision count (scan
  `.claude/state/deep-plan.*.state.json`)
- Sprint board: ROADMAP.md task status (completed / blocked / ready) via
  `resolve-dependencies.js`
- Lifecycle score matrix: 20 data systems from `lifecycle-scores.jsonl` with
  capture/storage/recall/action scores

**Data sources:**

- `.research/research-index.jsonl` (4 entries, compact)
- `.claude/state/deep-plan.*.state.json` (12 files, scan for active phases)
- `ROADMAP.md` (parsed for checkbox states and dependency annotations)
- `.claude/state/lifecycle-scores.jsonl` (20 systems, lifecycle dimensions)

**CLI handoff commands:**

```
/deep-research [topic]                          # start new research session
/deep-plan [topic]                              # start new planning session
/task-next                                      # show unblocked ROADMAP tasks
/debt-runner plan                               # generate S0/S1 resolution plan
```

**Evidence from Wave 1:**

- SQ1a-3 (deep-research): "The research index (research-index.jsonl) is the most
  dashboard-relevant artifact — it's a compact registry of all research topics,
  dates, and depths." [Relevance: PRIMARY]
- SQ1a-5 (task-next): "ROADMAP.md is a persistent artifact. A dashboard 'Sprint
  Board' could read ROADMAP.md task status, completion counts, and dependency
  chains." [Relevance: PRIMARY]
- SQ1b: `lifecycle-scores.jsonl` rated HIGH, "system lifecycle matrix";
  `research-index.jsonl` rated MEDIUM [Relevance: SUPPORTING]
- SQ1a-5 (data-effectiveness-audit): "lifecycle-scores.jsonl is a ready-made
  per-system health dataset...one of the cleanest data sources in the project."
  [Relevance: SUPPORTING]

**Dependencies:**

- ROADMAP.md sprint board requires `resolve-dependencies.js --json` output
  written to a state file (currently no persistent JSON output — SQ1a-5 noted
  this as "Tier 2 — dashboardable with minor changes")
- `deep-plan.*.state.json` files are not tagged as "active vs archived" — the
  dashboard must infer activity from `currentPhase` field or timestamp recency

---

### Option A Summary

| Tab          | Organizing Question | P0 Data Sources                               | Confidence | Complexity  |
| ------------ | ------------------- | --------------------------------------------- | ---------- | ----------- |
| A1: Status   | Health right now?   | ecosystem-health-log, metrics.json, hook-runs | HIGH       | Medium      |
| A2: Debt     | Debt trends?        | MASTER_DEBT, metrics-log, metrics.json        | HIGH       | Medium-High |
| A3: Reviews  | Review quality?     | reviews.jsonl, review-metrics, retros.jsonl   | HIGH       | Medium      |
| A4: Activity | What happened?      | commit-log, agent-invocations, hook-runs      | HIGH       | Low         |
| A5: Planning | What's next?        | research-index, ROADMAP.md, lifecycle-scores  | MEDIUM     | Medium      |

**Pros:**

- Tabs map to questions a developer actually asks — natural navigation
- Data boundaries are clean (each tab has minimal overlap with others)
- A2 and A3 are independently valuable; don't require each other
- A4 is low-data-complexity (no large file parsing) — fastest to implement

**Cons:**

- 5 tabs may be too many for a command-center feel; adds navigation overhead
- A5 (Planning) is MEDIUM confidence and has two unfulfilled dependency gaps
- Health data (A1) and Debt data (A2) are conceptually linked but separated;
  developer may have to context-switch between them for diagnosis

---

## Grouping Option B: "By Temporal Horizon"

**Organizing principle:** Each tab covers a different time window — what's
happening now, what happened recently, what's the long-term trend.

### Tab B1: Now (Real-time status — last 24 hours)

**What it shows:**

- Composite health grade badge (current + grade delta from 7 days ago)
- Active warning count with severity breakdown (aggregated from both warning
  systems)
- Hook compliance: today's pre-commit/pre-push results from `hook-runs.jsonl`
- Open S0/S1 debt count with "new since last session" delta from
  `metrics-log.jsonl`
- Current session state: active branch from `handoff.json`, last commit
  timestamp
- Agent activity today: count from `agent-invocations.jsonl` filtered to today

**Data sources:** Same as A1 + A4 (intersection of real-time sources)

**CLI handoff commands:**

```
/alerts                                         # live health check
/session-begin                                  # start session
```

### Tab B2: Week (Session-level trends — last 7-14 days)

**What it shows:**

- Health score sparkline: last 10 entries from `ecosystem-health-log.jsonl`
- Commits per day bar chart from `commit-log.jsonl` (last 14 days)
- PR review activity: reviews opened, closed, rounds from `reviews.jsonl`
- Hook performance: pass rate per check over 14 days from `hook-runs.jsonl`
- Override frequency: overrides per week from `override-log.jsonl`

### Tab B3: Quarter (Long-term metrics — all time or 90 days)

**What it shows:**

- Debt burn-down: open debt count trend from `metrics-log.jsonl` (114 snapshots)
- Review quality improvement: fix rate per PR over time from
  `review-metrics.jsonl`
- Ecosystem audit history: last run date and score per sub-audit from history
  files
- Resolution rate trend: resolved/total ratio over time from `metrics-log.jsonl`

**Option B Summary:**

| Tab         | Time Window        | Key Data                                  | Confidence | Overlap with A? |
| ----------- | ------------------ | ----------------------------------------- | ---------- | --------------- |
| B1: Now     | Last 24h           | Health grade, warnings, S0/S1             | HIGH       | A1 + A4         |
| B2: Week    | Last 7-14 days     | Commit activity, PR flow, hook rates      | HIGH       | A4 + A3         |
| B3: Quarter | 90 days / all-time | Debt trend, audit history, review quality | HIGH       | A2 + A3         |

**Pros:**

- Only 3 tabs — minimal navigation overhead
- Natural for a command-center dashboard: "glance now, investigate week, plan
  quarter"
- Data sources slot cleanly into time windows

**Cons:**

- Many developers care about debt (quarter-scale) AND today's health
  simultaneously — the temporal split forces cross-tab navigation for related
  concerns
- The "Week" tab has significant overlap with both B1 and B3 — its identity is
  weak
- Debt (the richest data source) only appears at quarterly scale; gets buried

---

## Grouping Option C: "By Process Domain"

**Organizing principle:** Each tab owns a distinct engineering process — not a
question, not a time window, but a process with its own metrics, CLI skills, and
feedback loops.

### Tab C1: Health & Alerts

**What it shows:**

- Composite health grade + trend from `ecosystem-health-log.jsonl`
- Per-category scorecards for top 10 categories (code, security, debt-metrics,
  hook-health, hook-warnings, reviews-sync, crossdoc, etc.)
- Active warnings unified from both warning systems (new/acknowledged/resolved
  lifecycle)
- Lifecycle score matrix: 20 systems from `lifecycle-scores.jsonl` as action-gap
  heatmap
- Grade regression alert: "grade dropped N levels since YYYY-MM-DD"

**Data sources:**

- `data/ecosystem-v2/ecosystem-health-log.jsonl`
- `data/ecosystem-v2/warnings.jsonl` + `.claude/state/hook-warnings-log.jsonl`
- `.claude/state/lifecycle-scores.jsonl`
- `.claude/state/health-score-log.jsonl`

**CLI handoff commands:**

```
/alerts                                         # health check + warning triage
/ecosystem-health                               # full health dashboard
/comprehensive-ecosystem-audit                  # full 8-audit system check (30 min)
```

**Evidence:** SQ1c-3: "Health Monitoring: Three-Layer Architecture" establishes
this as a coherent process domain with its own data layer
(`data/ecosystem-v2/`). SQ1a-3: alerts + ecosystem-health have "direct consumer
relationship" and "two-tier health system." [Relevance: HIGH]

---

### Tab C2: Debt Pipeline

**What it shows:**

- TDMS status: severity distribution, resolution rate, status breakdown from
  `metrics.json`
- Debt trend: open count over time from `metrics-log.jsonl`
- Intake activity: recent debt additions from `intake-log.jsonl` (80 records)
- Resolution activity: recent resolutions from `resolution-log.jsonl` (14
  records)
- Pipeline health: verification queue depth (27 items), staging file count
  (incomplete runs)
- SonarCloud sync status: last sync timestamp from `intake-log.jsonl`
- High-priority queue: S0 items table (26 items) with age

**Data sources:**

- `docs/technical-debt/metrics.json`
- `docs/technical-debt/logs/metrics-log.jsonl`
- `docs/technical-debt/logs/intake-log.jsonl`
- `docs/technical-debt/logs/resolution-log.jsonl`
- `docs/technical-debt/raw/review-needed.jsonl`
- `docs/technical-debt/MASTER_DEBT.jsonl` (field-stripped)

**CLI handoff commands:**

```
/debt-runner verify                             # verify stale/resolved items
/debt-runner plan --severity S0,S1             # generate resolution plan
/debt-runner dedup                              # deduplication pass
/sonarcloud --sync                              # pull SonarCloud issues
node scripts/debt/generate-metrics.js          # refresh metrics
```

**Evidence:** SQ1c-1: The TDMS lifecycle is a fully self-contained process with
29 scripts and 6 distinct pipeline stages. SQ1b: 3 P0 files are all TDMS-owned.
SQ1a-4 (sonarcloud): HIGH relevance, "primary data ingestion point for TDMS."
[Relevance: HIGH]

---

### Tab C3: Code Review Quality

**What it shows:**

- Active PR: current PR number, round, items remaining, severity breakdown from
  `pr-review-state.json`
- Fix rate trend: per-PR fix/defer/reject breakdown from `review-metrics.jsonl`
  (52 records)
- Round inflation: PRs requiring R3+ (quality signal — fewer rounds = faster
  convergence)
- Recurring patterns: top 5 most common findings across retros from
  `retros.jsonl`
- Action item board: pending retro action items with verify commands and
  pass/fail status
- Reviewer source effectiveness: items by source (SonarCloud / Qodo / Gemini /
  CodeRabbit) — from `reviews.jsonl` `source` field
- Suppression accumulation: count of suppressed reviewer patterns (flag for
  suppression drift)

**Data sources:**

- `.claude/state/reviews.jsonl` + `reviews-archive.jsonl`
- `.claude/state/review-metrics.jsonl`
- `.claude/state/retros.jsonl`
- `.claude/state/pr-review-state.json`

**CLI handoff commands:**

```
/pr-review --pr {N} --round {N}                # open/continue PR review
/pr-retro {N}                                  # run PR retrospective
/pr-retro --dashboard                          # interactive retro action-item review
```

**Evidence:** SQ1a-4: pr-review (HIGH), pr-retro (HIGH), both explicitly group
with each other. SQ1c-1: "Review Cycle Health" section identifies these three
files as the complete picture. SQ1b: `reviews.jsonl` (HIGH),
`review-metrics.jsonl` (HIGH), `retros.jsonl` (HIGH) all rated independently.
[Relevance: HIGH]

---

### Tab C4: Build Pipeline & Session Hygiene

**What it shows:**

- Session activity: last 5 sessions with health grade at close from joining
  `velocity-log.jsonl` + `health-score-log.jsonl`
- Hook compliance heatmap: per-check (14 pre-commit, 12 pre-push)
  pass/warn/fail/auto-fix over last 30 runs — `hook-runs.jsonl`
- Auto-fix summary: "N silent auto-fixes this week" from `hook-runs.jsonl`
  status: "auto-fix"
- Override log: last 20 overrides with check name, reason, branch from
  `override-log.jsonl`
- Agent invocations: recent agent activity by session from
  `agent-invocations.jsonl`
- Commit activity: commits per day (last 30) from `commit-log.jsonl`
- Hook warning trend: recurring warning types from `hook-warnings-log.jsonl`

**Data sources:**

- `.claude/state/hook-runs.jsonl`
- `.claude/override-log.jsonl`
- `.claude/state/agent-invocations.jsonl`
- `.claude/state/commit-log.jsonl`
- `.claude/state/hook-warnings-log.jsonl`

**CLI handoff commands:**

```
/session-begin                                  # start session
/session-end                                    # close session + metrics
/pre-commit-fixer                               # diagnose/fix hook failures
/checkpoint                                     # save session state
```

**Evidence:** SQ1c-2: "Hook Compliance Heatmap", "Override Audit Log", "Agent
Compliance Summary", "Auto-Fix Counter" all explicitly proposed as dashboard
panels. SQ1b: `hook-runs.jsonl` (P1, HIGH), `agent-invocations.jsonl` (P1,
HIGH), `commit-log.jsonl` (P1, HIGH). SQ1a-4: session-end (HIGH dashboard
relevance), session-begin (MEDIUM). [Relevance: HIGH]

---

### Tab C5: Governance & Audits (On-Demand)

**What it shows:**

- Ecosystem audit recency: last run date + score for each of 8 sub-audits (from
  history files)
- Sub-audit comparison: all 8 scores side-by-side with trend arrows
- Stale audit warnings: "doc audit last ran 35 days ago, TDMS audit last ran 33
  days ago"
- Data effectiveness matrix: lifecycle-scores.jsonl (already shown in C1, but
  deeper drill-down here)
- Audit action items: deferred findings promoted to TDMS from audit runs

**Data sources:**

- `.claude/state/*-ecosystem-audit-history.jsonl` (7 files)
- `.claude/state/lifecycle-scores.jsonl`
- `.claude/state/audit-agent-quality-history.jsonl`

**CLI handoff commands:**

```
/comprehensive-ecosystem-audit                  # run all 8 audits in parallel
/hook-ecosystem-audit                           # run hook infrastructure audit
/skill-ecosystem-audit                          # run skill quality audit
/doc-ecosystem-audit                            # run documentation audit
/tdms-ecosystem-audit                           # run TDMS pipeline audit
```

**Evidence:** SQ1c-3: "Audit run timeline — When was each sub-audit last run?
Show recency indicators: hook audit last ran 2026-03-19, doc audit last ran
2026-02-25 (over a month ago)." SQ1a-2: all 8 ecosystem audits share the same
history file pattern and are designed for trend-over-time analysis. SQ1b: audit
history files rated MEDIUM or LOW individually but collectively form a
governance view. [Relevance: MEDIUM-HIGH]

---

### Option C Summary

| Tab                     | Process Domain | Core Data Files                        | Dashboard Relevance | Implementation Complexity |
| ----------------------- | -------------- | -------------------------------------- | ------------------- | ------------------------- |
| C1: Health & Alerts     | Monitoring     | ecosystem-health-log, warnings         | HIGH                | Medium                    |
| C2: Debt Pipeline       | TDMS           | metrics.json, metrics-log, MASTER_DEBT | HIGH                | Medium-High               |
| C3: Code Review Quality | PR Process     | reviews.jsonl, review-metrics, retros  | HIGH                | Medium                    |
| C4: Build Pipeline      | Session/Hooks  | hook-runs, commit-log, override-log    | HIGH                | Medium                    |
| C5: Governance & Audits | Meta-process   | ecosystem-audit-history files          | MEDIUM              | Low                       |

**Pros:**

- Each tab maps directly to a `/skill` family — developer already knows the CLI
  equivalent
- C5 can be deprioritized (Low complexity, least urgent) while C1-C4 deliver
  core value
- Process-domain ownership is clear: if debt is on fire, go to C2; if hooks are
  failing, go to C4
- Tabs map cleanly to D4 decision: "Dev = build pipeline + dev process" (C4 =
  build pipeline; C1/C2/C3 = dev process)

**Cons:**

- 5 tabs is the same count as Option A
- Health (C1) and Debt (C2) are separate tabs — but the health score's
  `debt-metrics` category in C1 creates conceptual duplication
- A developer investigating a grade regression from A to B would need to
  cross-reference C1 (overall grade) with C2 (debt contribution) and C4
  (hook-health contribution)

---

## Comparative Assessment

| Criterion                                     | Option A (By Question)                        | Option B (By Time)                           | Option C (By Process)                             |
| --------------------------------------------- | --------------------------------------------- | -------------------------------------------- | ------------------------------------------------- |
| Navigation clarity                            | High — tabs are questions                     | Medium — time horizon is intuitive but fuzzy | High — tabs are named processes                   |
| Data coherence                                | High — clean per-tab data sets                | Medium — sources span tabs                   | High — each tab owns its data layer               |
| Implementation priority ordering              | Hard (all tabs similarly complex)             | Easy (B1 first, B2 second, B3 third)         | Easy (C1 first, C4 last)                          |
| CLI skill affinity                            | Moderate — tabs don't correspond to `/skills` | Low — time slices don't map to CLI           | High — each tab has obvious `/skill` entry points |
| Handles data gaps honestly                    | Yes — A5 planning tab has gaps                | Yes — B2/B3 can omit broken velocity         | Yes — C5 is clearly optional                      |
| Aligns with D4 (build pipeline + dev process) | Partially                                     | Weakly                                       | Strongly                                          |

**Recommendation: Option C (By Process Domain)** with C5 as optional/deferred

Option C most cleanly aligns with D4 and D7. Each tab has an obvious set of CLI
handoff commands, because each tab corresponds to an existing process with
existing skills. The developer's mental model ("I need to deal with debt → debt
tab") is the same mental model they already use for CLI invocation ("I need to
deal with debt → `/debt-runner`").

Option A is a close second. The key advantage of A over C is that A3 (Reviews)
and A2 (Debt) combined cover the same ground as C2 + C3 with slightly simpler
data joins.

Option B is weakest because the time-horizon framing obscures the logical data
groupings that actually exist in the codebase.

---

## Recommended Final Tab Structure (Option C with adjustments)

Based on all Wave 1 evidence, the recommended 4-tab structure (C5 deferred to
V2) is:

1. **Health** — Ecosystem health grade, warnings, lifecycle scores (C1)
2. **Debt** — TDMS severity breakdown, trend, intake/resolution pipeline (C2)
3. **Reviews** — PR review quality, retro action items, fix rate trends (C3)
4. **Pipeline** — Hook compliance, session activity, overrides, agent
   invocations (C4)

Optional V2 tab: 5. **Audits** — Ecosystem audit history, governance metrics
(C5)

This matches the D4 definition: "Dev = build pipeline (tab 4) + dev process
(tabs 1-3)."

---

## Key Data Gaps (Must Address Before Tab Works)

| Gap                                                                          | Affects                                     | Severity | Remediation                                                     |
| ---------------------------------------------------------------------------- | ------------------------------------------- | -------- | --------------------------------------------------------------- |
| `velocity-log.jsonl` always shows `items_completed: 0`                       | Pipeline tab (session velocity widget)      | HIGH     | Fix `track-session.js` extraction or drop velocity widget       |
| Two competing warning systems (`warnings.jsonl` + `hook-warnings-log.jsonl`) | Health tab                                  | MEDIUM   | Aggregate both into unified warning feed                        |
| `comprehensive-ecosystem-audit` deletes per-audit JSON at run end            | Audits tab (no JSON to parse, MD only)      | MEDIUM   | Retain JSON results OR parse markdown report                    |
| `doc-optimizer` wave JSONL deleted post-run                                  | Audits tab (doc quality scores unavailable) | LOW      | Retain `wave4-quality.jsonl` to permanent path                  |
| ROADMAP.md sprint board has no JSON output                                   | Planning context widgets                    | MEDIUM   | Add `--json` flag to `resolve-dependencies.js`                  |
| `sonarcloud` category is null in most health-score-log entries               | Health tab (category scorecard)             | LOW      | Known SonarCloud integration gap; surface as "data unavailable" |

---

## Sources

| #   | Source File                                                         | Type                      | Trust | CRAAP Score |
| --- | ------------------------------------------------------------------- | ------------------------- | ----- | ----------- |
| 1   | `.research/dev-dashboard/findings/SQ1a-1-audit-skills.md`           | Prior research (codebase) | HIGH  | 5/5         |
| 2   | `.research/dev-dashboard/findings/SQ1a-2-ecosystem-audit-skills.md` | Prior research (codebase) | HIGH  | 5/5         |
| 3   | `.research/dev-dashboard/findings/SQ1a-3-operational-skills-am.md`  | Prior research (codebase) | HIGH  | 5/5         |
| 4   | `.research/dev-dashboard/findings/SQ1a-4-operational-skills-nz.md`  | Prior research (codebase) | HIGH  | 5/5         |
| 5   | `.research/dev-dashboard/findings/SQ1a-5-remaining-skills.md`       | Prior research (codebase) | HIGH  | 5/5         |
| 6   | `.research/dev-dashboard/findings/SQ1b-data-inventory.md`           | Prior research (codebase) | HIGH  | 5/5         |
| 7   | `.research/dev-dashboard/findings/SQ1c-1-process-debt-review.md`    | Prior research (codebase) | HIGH  | 5/5         |
| 8   | `.research/dev-dashboard/findings/SQ1c-2-process-session-hooks.md`  | Prior research (codebase) | HIGH  | 5/5         |
| 9   | `.research/dev-dashboard/findings/SQ1c-3-process-health-audits.md`  | Prior research (codebase) | HIGH  | 5/5         |

All sources are direct codebase research findings from 2026-03-29. No web search
or training data used.

---

## Contradictions

**Health log duplication:** Both `health-score-log.jsonl` (.claude/state, 24
entries) and `ecosystem-health-log.jsonl` (data/ecosystem-v2, 32 entries) record
health scores. They are not synchronized and serve different consumers. The
dashboard should use `ecosystem-health-log.jsonl` as primary for trend charts
(richer data, same date range) and `health-score-log.jsonl` only for grade-drop
detection at session start.

**Warning system duplication:** `warnings.jsonl` (lifecycle state machine) vs
`hook-warnings-log.jsonl` (flat event log) overlap in purpose. The Tab C1 / Tab
A1 health tabs will need to aggregate both — but the aggregation logic does not
exist yet and would need to be built.

---

## Gaps

1. **No single "session summary" JSONL** — session-level data is spread across
   velocity-log, handoff.json, and commit-log. A join key (session number or
   date) would be needed to build a per-session view.
2. **Velocity tracking is broken** — the highest-value productivity metric
   (items completed per session) shows 0 in all records. Any "velocity" widget
   must either fix the underlying script or be omitted.
3. **Retro action item verification freshness** — it is unclear whether
   verify-command pass/fail results from retros are stored persistently. The
   action item board in C3 would need to re-run verify commands at render time
   or surface unverified items as a "run this" prompt.
4. **ROADMAP.md structured output** — the sprint board concept in A5/C5 requires
   `resolve-dependencies.js --json` output to a state file, which does not
   currently exist.

---

## Serendipity

- **`forward-findings.jsonl`** (4 records currently) is a pre-aggregated "things
  to watch" feed — cross-PR forward-looking findings with severity. It would
  make an excellent pinned "Watch Items" widget at the top of any tab without
  needing complex filtering. Small now but grows with retro activity.
- **`enforcement-manifest.jsonl`** (360 records) contains pattern enforcement
  coverage data — which patterns have ESLint gates, which are behavioral-only. A
  "pattern coverage" widget (% of patterns with automated gate vs
  behavioral-only) was not in the original dashboard concept but would be
  uniquely valuable.
- **Multi-locale data is in the warning logs** — hook-warnings-log.jsonl shows
  entries from `user: jason`, `user: jbell`, `user: redacted`. A dashboard
  "locale comparison" panel could show which locale generates more warnings —
  potentially revealing environment-specific issues invisible to single-locale
  monitoring.

---

## Confidence Assessment

- HIGH claims: 12 (tab-to-data-source mappings, data gap identifications)
- MEDIUM claims: 4 (option comparison, recommendation, planning tab structure)
- LOW claims: 1 (Option B temporal horizon recommendation — insufficient direct
  evidence for its usability)
- UNVERIFIED claims: 0
- Overall confidence: **HIGH** — all findings derived from direct inspection of
  Wave 1 research findings, which were themselves derived from direct codebase
  inspection.
