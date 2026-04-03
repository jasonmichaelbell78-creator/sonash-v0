# Findings: Alternative Tab Groupings (Challenger)

**Searcher:** deep-research-searcher (CHALLENGER role) **Profile:** codebase
**Date:** 2026-03-29 **Sub-Question IDs:** SQ2b

---

## Method

Read all 9 Wave 1 findings files in full, extracting every data source, update
frequency, and natural co-occurrence pattern before proposing alternatives. The
conventional domain-based grouping (Health | Debt | Reviews | Hooks | Docs) was
the hypothesis to challenge, not the starting point.

---

## The Conventional Grouping (What This Challenges)

Wave 1 findings consistently cluster data into domain-based tabs:

- Health tab (ecosystem-health-log.jsonl, health-score-log.jsonl, alerts)
- Debt tab (MASTER_DEBT.jsonl, metrics.json, metrics-log.jsonl)
- Reviews/PR tab (reviews.jsonl, review-metrics.jsonl, retros.jsonl)
- Hooks tab (hook-runs.jsonl, hook-warnings-log.jsonl, override-log.jsonl)
- Docs tab (DOCUMENTATION_INDEX.md, lifecycle-scores.jsonl)

This grouping is logical. It is also wrong for a solo developer's daily use.

---

## Key Insight From the Data

Before proposing alternatives, three patterns emerged from reading the data that
underpin every alternative option below:

**Pattern 1: Update frequency splits every domain.** Within "Health,"
ecosystem-health-log.jsonl updates once per session (slow), hook-runs.jsonl
updates per-commit (fast), and mid-session-alerts fire post-commit (real-time).
A Health tab blends three completely different temporal rhythms.

**Pattern 2: The real action unit is a PR, not a domain.** commit-log.jsonl,
hook-runs.jsonl, reviews.jsonl, review-metrics.jsonl, retros.jsonl,
MASTER_DEBT.jsonl (new S0/S1 intakes), and forward-findings.jsonl all advance
together when a PR closes. They are the same story told in different files.

**Pattern 3: There are two fundamentally different views the developer needs.**
(a) "Is right now okay?" -- hook warnings, active alerts, pre-commit failures,
current PR state, forward-findings. (b) "Are we getting better over time?" --
health score trend, debt metrics-log, review-metrics fix-rate trend,
velocity-log, lifecycle-scores. Domain-based tabs force both views into every
tab, diluting both.

---

## Alternative Option A: Temporal Grouping ("Now / Session / Trend")

### Organizing Principle

Organize by _when the data is relevant_, not what system produced it. Every
piece of data in the project has a natural time horizon.

### Tab List

**Tab 1: RIGHT NOW** Data that changes within the current hour and requires
action today.

- `data/ecosystem-v2/warnings.jsonl` -- active warning lifecycle
  (new/ack/resolved)
- `.claude/state/hook-warnings-log.jsonl` -- unacknowledged hook warnings
- `.claude/state/hook-runs.jsonl` (last 5 runs) -- most recent commit compliance
- `.claude/state/pr-review-state.json` -- active PR review progress (in-flight)
- `.claude/state/forward-findings.jsonl` -- cross-PR forward-looking issues
- `.claude/state/handoff.json` -- current task / branch / pending steps
- `.claude/state/session-start-failures.json` -- unresolved build failures
- CLI handoff: "Acknowledge Warnings" -> /alerts; "View Active PR" -> gh pr view
  N

**Tab 2: LAST SESSION** Data that answers "what did I do yesterday / this
sprint" and reflects the closed session.

- `velocity-log.jsonl` -- last session's roadmap progress
- `hook-runs.jsonl` (session boundary slice) -- all commits this session
- `commit-log.jsonl` (last 20) -- commit activity timeline
- `reviews.jsonl` + `review-metrics.jsonl` (last closed PR) -- fix/defer/reject
- `retros.jsonl` (last entry) -- retrospective findings from last PR
- `override-log.jsonl` (last 7 days) -- what gates were bypassed
- `alerts-baseline.json` -- current health grade snapshot
- CLI handoff: "Run Session Health" -> /ecosystem-health --quick

**Tab 3: TRENDS** Data that requires 3+ data points to be meaningful. Never
urgent alone.

- `ecosystem-health-log.jsonl` (32 entries) -- health grade trend chart
- `health-score-log.jsonl` (24 entries) -- per-category score heatmap over time
- `metrics-log.jsonl` (114 entries) -- debt count trend / burn-down
- `review-metrics.jsonl` (52 entries) -- fix-rate and rounds/PR over time
- `hook-ecosystem-audit-history.jsonl` (25 entries) -- hook health by audit run
- `lifecycle-scores.jsonl` (20 entries) -- data system lifecycle matrix
- `agent-invocations.jsonl` -- agent usage frequency over sessions
- CLI handoff: "Run Full Audit" -> /comprehensive-ecosystem-audit

### Why This Is Better Than Domain Grouping

A solo developer opens the dashboard at session start and needs to know if right
now is okay before starting work. With domain grouping, they must visit Health,
Hooks, and Reviews to reconstruct the current state. With temporal grouping,
"RIGHT NOW" is a single tab that answers that question entirely.

Domain grouping also buries trends inside health and debt tabs, making the
developer scroll past operational data to find charts. "TRENDS" is a dedicated
analytics view the developer opens weekly, not daily.

The temporal approach matches the actual cognitive load pattern: triage warnings
(NOW), review what happened (SESSION), understand direction (TRENDS).

### What It Sacrifices

Domain context is lost. A developer who wants to understand "everything about
debt" must visit multiple tabs. Aggregated domain views (all debt data together,
all health data together) require cross-tab navigation. For deep investigation
of a single system, domain grouping is faster.

---

## Alternative Option B: Action-Oriented Grouping ("Triage / Review / Monitor")

### Organizing Principle

Organize by _what the developer does next_, not what system produced the data.
Every piece of information on the dashboard implies one of three actions: fix
something now, review something and decide, or watch passively.

### Tab List

**Tab 1: TRIAGE** Data that requires an immediate decision or fix. Presence on
this tab means something is broken or blocking.

- `hook-warnings-log.jsonl` -- unacknowledged warnings (severity: error/warning)
- `session-start-failures.json` -- build/npm failures (blocks all work)
- `warnings.jsonl` (new/ack status only) -- health degradation alerts
- `hook-runs.jsonl` (last 3, only fails/warns) -- what broke in last commits
- `MASTER_DEBT.jsonl` S0/S1 items only -- critical debt requiring immediate
  action
- `forward-findings.jsonl` -- cross-PR issues flagged for follow-up
- `review-needed.jsonl` (docs/technical-debt/raw/) -- debt items pending human
  triage
- Empty state: "All clear -- nothing requires action" (this is the daily goal)
- CLI handoff: "Fix Warning N" -> action field from warning record; "Add to
  Debt" -> /add-debt

**Tab 2: REVIEW** Data that requires a decision but not urgency. The developer
opens this when they have 10-15 minutes to process backlog.

- `retros.jsonl` -- retrospective action items with `status: deferred` open
  items
- `reviews.jsonl` + `review-metrics.jsonl` -- closed PR statistics, patterns
- `override-log.jsonl` -- recent bypasses to review for pattern or abuse
- `lifecycle-scores.jsonl` (systems where action < 2) -- data systems needing
  consumers
- `ecosystem-audit-history` files -- audit runs with deferred findings
- `pending-refinements.jsonl` -- unresolved learning items awaiting
  classification
- CLI handoff: "Process Retro Items" -> /pr-retro --review; "Run Debt Review" ->
  /debt-runner plan

**Tab 3: MONITOR** Passive data. Developer glances at this for trend direction
but takes no action unless something unexpected appears.

- `ecosystem-health-log.jsonl` -- health score trend (last 10 sessions)
- `metrics-log.jsonl` -- debt count over time
- `review-metrics.jsonl` trend -- fix-rate direction (improving or degrading?)
- `hook-ecosystem-audit-history.jsonl` -- infrastructure health over time
- `velocity-log.jsonl` -- session velocity (broken; shows sprint label only)
- `agent-invocations.jsonl` -- agent usage summary (weekly count by type)
- `commit-log.jsonl` -- commit activity sparkline
- No CLI handoff needed for passive data -- just read

### Why This Is Better Than Domain Grouping

Domain grouping mixes urgency levels. A "Health" tab shows both a chronic
pre-existing warning (low urgency) and a new security alert (high urgency) at
the same visual weight. The developer cannot tell from a tab badge which domain
is on fire.

Action-oriented grouping makes urgency explicit through tab structure. The
TRIAGE tab badge count IS the number of unresolved blocking issues. Zero means
clean. Non-zero means work before starting. This is how a production operations
dashboard works.

Domain grouping also creates false parallelism. The developer does not actually
think "I will review all health things, then all debt things." They think "what
needs fixing, what needs deciding, what can I ignore."

### What It Sacrifices

Cross-cutting system views are lost. If the developer wants to understand the
full picture of the PR review system (workflow, data quality, retro patterns),
they must visit TRIAGE (forward-findings) + REVIEW (retros, reviews) + MONITOR
(fix-rate trends). Investigation mode is harder.

This grouping also requires maintaining urgency-level metadata per warning type,
which does not currently exist as a single field. The TRIAGE/REVIEW split would
need to be defined in a config, not just by which file data came from.

---

## Alternative Option C: Signal Co-occurrence Grouping

### Organizing Principle

Group data that a developer always looks at _together_ when investigating a
problem, regardless of which domain produced it. Based on which files are
actually consulted together in the process findings (SQ1c-1, SQ1c-2).

The evidence: SQ1c-1 documented the full TDMS and PR review process flows.
SQ1c-2 documented what session-end reads and writes. Cross-referencing these
reveals which files are always co-read by the system itself -- those files
belong together on the dashboard too.

### Tab List

**Tab 1: COMMIT HEALTH** Files that advance together when a commit/push happens.
The developer opens this after every push to understand what the commit changed.

Natural co-occurrence evidence: hook-runs.jsonl (written by pre-commit/push),
hook-warnings-log.jsonl (written by post-write-validator, pre-commit),
override-log.jsonl (written when bypassing), and commit-log.jsonl (written by
commit-tracker) all advance in lockstep per commit.

- `hook-runs.jsonl` (last 20 commits) -- per-check pass/warn/fail/auto-fix
  matrix
- `hook-warnings-log.jsonl` (grouped by type) -- warning category trends
- `override-log.jsonl` -- bypass events per check type
- `commit-log.jsonl` (last 30) -- commit timeline with branch and session
- Derived: "auto-fix rate" (how many commits had silent lint/doc auto-fixes)
- Derived: "persistent warnings" (warnings present in every run, never resolved)
- CLI handoff: "Rebuild Hook Baseline" -> script; "Fix Cognitive Complexity" ->
  opens relevant files

**Tab 2: PR CYCLE** Files that the PR review workflow reads and writes in
sequence. The developer opens this when working through a PR review round or
retro.

Natural co-occurrence evidence: session-end explicitly reads reviews.jsonl,
review-metrics.jsonl, retros.jsonl, MASTER_DEBT.jsonl, and commit-log.jsonl in a
single pass. They are joined by design.

- `reviews.jsonl` + `reviews-archive.jsonl` -- PR history with severity
  breakdown
- `review-metrics.jsonl` -- fix ratio, rounds/PR, churn per PR
- `retros.jsonl` -- retrospective action items and pattern recurrence
- `forward-findings.jsonl` -- cross-PR forward-looking issues
- `MASTER_DEBT.jsonl` S0/S1 items from review sources (source_id filter) --
  review-sourced debt
- `override-log.jsonl` (reviewer type only) -- code-reviewer bypass rate
- Derived: "PR efficiency score" (fix_ratio + rounds + retro completeness
  combined)
- CLI handoff: "Start Review Round" -> /pr-review; "Run Retro" -> /pr-retro

**Tab 3: SYSTEM HEALTH** Files that the health monitoring scripts read in a
single pass when computing the composite grade. Co-occurrence is defined by the
health checker dependencies confirmed in SQ1c-3.

Natural co-occurrence evidence: hook-pipeline.js reads hook-warnings-log,
override-log, hook-runs. data-effectiveness.js reads lifecycle-scores.
debt-health.js reads MASTER_DEBT. All are consumed by run-health-check.js in a
single evaluation pass.

- `ecosystem-health-log.jsonl` -- composite health score trend
- `health-score-log.jsonl` -- per-category grades (code:60, hook-health:50)
- `lifecycle-scores.jsonl` -- data system effectiveness matrix
- `MASTER_DEBT.jsonl` metrics view -- S0-S3 counts and trend
- `data/ecosystem-v2/warnings.jsonl` -- active system warnings
- `enforcement-manifest.jsonl` summary -- pattern gate coverage %
- Audit recency: when each of 8 ecosystem audits last ran (from history files)
- CLI handoff: "Run Health Check" -> node scripts/health/run-health-check.js

**Tab 4: AI INFRASTRUCTURE** Files that track the AI tooling layer: agents,
skills, research, planning. These are rarely consulted urgently but reveal
systemic drift in the AI workflow.

Natural co-occurrence evidence: skill-ecosystem-audit checks agent-skill
alignment, SKILL_INDEX.md sync, and dead skill detection. audit-agent-quality
checks the same agent files. They are always read together when auditing AI
quality.

- `audit-agent-quality-history.jsonl` -- agent quality ecosystem grade
- `skill-ecosystem-audit-history.jsonl` -- skill health scores over time
- `agent-invocations.jsonl` -- agent frequency by type this week
- `learning-routes.jsonl` -- learning items and their routing disposition
- `research-index.jsonl` -- research topics with confidence distributions
- `.planning/STATE.md` + active `deep-plan.*.state.json` files -- active plans
- CLI handoff: "Run Agent Quality Audit" -> /audit-agent-quality; "Run Skill
  Audit" -> /skill-ecosystem-audit

### Why This Is Better Than Domain Grouping

Co-occurrence grouping reduces the investigation path. When a developer sees
hook-health: 50 on the health tab under domain grouping, they must then navigate
to a separate Hooks tab to understand why. Under co-occurrence grouping, COMMIT
HEALTH shows the hooks failure in the same view where they already are.

Similarly, when a PR closes badly (high rounds, many deferred items), domain
grouping splits the story across PR Reviews (rounds data), Debt (deferred
items), and potentially Hooks (patterns:check failures that caused the rounds).
PR CYCLE tab shows the whole story in one place.

This also maps to how engineers actually debug: they pull up every file that
touched the same system at the same time. The dashboard tab structure should
mirror that investigation unit.

### What It Sacrifices

The co-occurrence grouping is harder to explain than domain grouping. "Commit
Health" is less immediately obvious than "Hooks" as a tab label. New users (or
the developer after a two-week break) would need to learn the organization.

It also creates slight redundancy: override-log.jsonl appears in both COMMIT
HEALTH (bypass events per commit) and PR CYCLE (reviewer bypass rate). Showing
the same file through two different filters is technically correct but may
create confusion about which is canonical.

---

## Alternative Option D: Data-Density Hybrid ("Two Tabs Total")

### Organizing Principle

Reject tab proliferation entirely. A solo developer checking in daily does not
need 4-6 tabs. They need one status panel and one drill-down surface. The
minimum viable command center: one tab answers "is everything okay," one tab
lets you investigate anything.

### Tab List

**Tab 1: STATUS (landing page)** A single-screen status summary. Designed to
answer "can I start coding?" within 10 seconds. No scroll. No drill-down
required. Pure signal.

Rows (each row = one data source, one number, one trend arrow):

- Health grade: current letter (B), delta from last session (down from A)
- Active warnings: N unacknowledged (badge count, red if > 0)
- S0/S1 debt: N critical items (badge, red if > 0)
- Hook pass rate: last 10 commits (% passing without override)
- PR review: last closed PR round count and fix ratio (or "no PR in progress")
- Velocity: last session items completed (note: currently broken, shows 0)
- Override rate: bypasses in last 7 days

No charts. No tables. Just the 7 numbers. If all green, close the dashboard and
start working. If any red, click through to INVESTIGATE.

CLI handoff: Row-level "Fix" button routes to the right slash command.

**Tab 2: INVESTIGATE** A single tab with sections that collapse/expand. The
developer opens this when STATUS shows a red indicator and they need to
understand why.

Sections (collapsed by default, expand on click):

- "Health Details" -> ecosystem-health-log per-category heatmap
- "Active Warnings" -> hook-warnings-log + warnings.jsonl full list
- "Debt Explorer" -> MASTER_DEBT.jsonl with severity/category/status filters
- "Hook Compliance" -> hook-runs.jsonl full commit history matrix
- "PR History" -> reviews, metrics, retros combined timeline
- "Audit Status" -> last-run date and score for each of 8 ecosystem audits
- "AI Infrastructure" -> agent invocations, research index, active plans

CLI handoff: Each section footer has the relevant slash command or script.

### Why This Is Better Than Domain Grouping

Domain grouping with 5-6 tabs creates a daily overhead: the developer opens the
dashboard, visits all tabs to check status, reconstructs a mental model of
overall health. Each tab visit is a decision point: is this tab data concerning?
This is cognitive friction for a solo operator who already holds the system
model in their head.

Two-tab design eliminates that. STATUS tab answers the daily question in 10
seconds. INVESTIGATE tab is rarely opened -- only when something is wrong. Most
days, the developer opens STATUS, sees all green, and never opens INVESTIGATE at
all.

This matches the actual usage pattern of a solo developer: quick daily check
plus occasional deep investigation. Not equal-weight domain review every
session.

### What It Sacrifices

Power users who want to browse trends, explore patterns, or review audit history
have no dedicated surface for that. The INVESTIGATE tab's collapse/expand UX is
more complex to build than flat tab content. There is also no "wandering" mode:
a developer who wants to casually review hook trends for interest (not because
something is wrong) has no natural place to do that.

The two-tab design also assumes the developer KNOWS what they are looking for
when they open INVESTIGATE. If they do not know what is wrong, the collapsed
sections offer less discovery than a dedicated per-domain tab with visible
charts.

---

## Alternative Option E: The Unexpected Merge -- "Session Hygiene" as a First-Class Tab

### Organizing Principle

This is the option that the primary grouping agent is most likely to miss
because it requires recognizing an implicit pattern rather than grouping obvious
domains.

The insight: there is a category of data that measures _how well the developer
follows their own process_, independent of any domain. This is not health, not
debt, not reviews. It is process compliance.

Data that measures process compliance:

- `override-log.jsonl` -- did you bypass gates? How often? For what reason?
- `hook-runs.jsonl` (skip column) -- what checks were silently skipped?
- `agent-invocations.jsonl` -- did you invoke the required agents
  (code-reviewer, systematic-debugging) or skip them?
- `session-start-failures.json` -- did the session start clean?
- `velocity-log.jsonl` -- are you completing roadmap items or just committing?
- Pre-commit compliance data from hook-runs.jsonl pre-commit-agent-compliance
  check results
- `retros.jsonl` action item completion rate -- did you follow through on retro
  items?

No domain-based tab would collect this data. A "Health" tab shows whether the
codebase is healthy. A "Session Hygiene" tab would show whether the developer is
operating with discipline -- whether the process is being followed or slowly
eroded through bypass accumulation.

### Why This Matters More Than It Seems

SQ1c-2 found that `cognitive-cc` is flagged on every single pre-push run but
never resolved -- it has become background noise. SQ1c-2 also found that
`override-log.jsonl` shows `reviewer` and `doc-header` as the most common
bypasses. These are not health degradations -- they are process erosions that
eventually cause health score drops.

A dedicated "Hygiene" tab would surface this drift before it becomes a health
score drop. It is a leading indicator, not a lagging one.

The tab would also surface the velocity-log structural break (items_completed: 0
in all 50 entries) prominently -- a broken tracking system is itself a process
compliance issue.

### Tab Content

**Session Hygiene tab:**

- Override rate trend (by check type, last 30 days) -- which gates are eroding?
- Hook auto-fix rate (silent remediations per commit) -- how much is being
  hidden?
- Agent compliance: required-agent rate (code-reviewer invoked before commit?)
- Skip rate per check in hook-runs.jsonl -- persistent chronic skips
  (cognitive-cc)
- Retro action item completion: `status: deferred` items that never resolved
- Velocity tracking health: is velocity-log.jsonl actually capturing data?
- `pending-refinements.jsonl` age distribution -- learning items aging unrouted

CLI handoff: "Fix Chronic Skip" -> opens relevant source file; "Rebuild Velocity
Tracking" -> opens track-session.js issue.

### Why This Beats Domain Grouping

No domain tab would catch this data. The signals are split across Hooks
(override-log, hook-runs), Health (agent-compliance score), and Reviews (retro
completion) in a domain grouping. They are only coherent together when framed as
"is the developer following the process?"

This tab would also have a useful psychological effect: making bypasses and
skips visible as a _pattern_ (not individual events) creates accountability. The
developer would see "I bypassed reviewer 8 times this month" as a trend chart,
not just individual log entries buried in a hooks tab.

### What It Sacrifices

This tab requires the developer to engage with uncomfortable data about their
own habits. If implemented naively it could feel punitive rather than
informative. It also competes conceptually with the Health score -- some of
these signals already feed health-score-log.jsonl, so there is metric overlap.
The developer would need to understand the distinction between "system health"
(output quality) and "process hygiene" (workflow compliance).

---

## Comparison Matrix

| Option                | Tabs      | Primary Organizing Axis           | Requires New Data? | Best For                   |
| --------------------- | --------- | --------------------------------- | ------------------ | -------------------------- |
| Conventional          | 5-6       | Domain (what system)              | No                 | Comprehensive reference    |
| A: Temporal           | 3         | When data is relevant             | No                 | Daily check-in             |
| B: Action             | 3         | What to do next                   | Urgency metadata   | Triage-focused operators   |
| C: Co-occurrence      | 4         | What is always consulted together | No                 | Investigation workflows    |
| D: Two-tab            | 2         | Status vs drill-down              | No                 | Minimal cognitive friction |
| E: Hygiene (additive) | +1 to any | Process compliance                | No                 | Long-term habit tracking   |

---

## Recommended Combinations

These alternatives are not mutually exclusive. Two pairings are compelling:

**Pairing 1: Option A + Option E** Three temporal tabs (NOW / SESSION / TRENDS)
plus a Hygiene tab. Four tabs total. The temporal structure answers daily
questions while Hygiene catches process drift. All data in the project maps
cleanly to one of these four contexts with no overlap.

**Pairing 2: Option D + Option E** Two-tab (STATUS + INVESTIGATE) with Hygiene
rolled into STATUS as a "Process" section. Minimum tabs while preserving the
leading-indicator value of process compliance data. Best for a developer who
values simplicity over browsability.

**Anti-pattern to avoid (found in conventional grouping):** Do not create a
"Docs" tab. Documentation data has LOW dashboard relevance (SQ1a-3 confirmed
docs-maintain produces no machine-readable history). DOCUMENTATION_INDEX.md
stats (726 docs, 104 archived) are interesting once and then static. Doc health
belongs as one row in STATUS or one item in the Health section of INVESTIGATE,
not a first-class tab.

---

## Sources

| #   | Path                                                                | Title                  | Trust | Notes                                              |
| --- | ------------------------------------------------------------------- | ---------------------- | ----- | -------------------------------------------------- |
| 1   | `.research/dev-dashboard/findings/SQ1a-3-operational-skills-am.md`  | Operational Skills A-M | HIGH  | Session/process grouping clusters                  |
| 2   | `.research/dev-dashboard/findings/SQ1a-4-operational-skills-nz.md`  | Operational Skills N-Z | HIGH  | PR cycle data sources                              |
| 3   | `.research/dev-dashboard/findings/SQ1a-2-ecosystem-audit-skills.md` | Ecosystem Audit Skills | HIGH  | Audit history file analysis                        |
| 4   | `.research/dev-dashboard/findings/SQ1b-data-inventory.md`           | Data Inventory         | HIGH  | File record counts and update frequencies          |
| 5   | `.research/dev-dashboard/findings/SQ1c-1-process-debt-review.md`    | Debt/Review Processes  | HIGH  | Process flow co-occurrence evidence                |
| 6   | `.research/dev-dashboard/findings/SQ1c-2-process-session-hooks.md`  | Session/Hook Processes | HIGH  | Hook data touchpoints, velocity-log structural gap |
| 7   | `.research/dev-dashboard/findings/SQ1c-3-process-health-audits.md`  | Health/Audit Processes | HIGH  | Health checker co-occurrence evidence              |
| 8   | `.research/dev-dashboard/findings/admin-audit.md`                   | Admin vs Dev Audit     | HIGH  | Existing tab structure + settled decisions         |

---

## Contradictions

**Option A vs Option B (urgency assignment):** In temporal grouping (Option A),
`forward-findings.jsonl` belongs in NOW (it is active and actionable). In
action-oriented grouping (Option B), it belongs in TRIAGE. These groupings agree
on urgency but differ on whether temporal relevance or action type is the
primary axis. This is not a data contradiction but a design philosophy choice.

**Velocity-log reliability:** SQ1c-2 confirmed `velocity-log.jsonl` shows
`items_completed: 0` in all 50 sampled entries -- a broken extraction script.
Any grouping that surfaces velocity data must flag this prominently. Including a
broken metric on a STATUS tab (Option D) would be worse than omitting it.
Options that show velocity should show it with a "data unavailable" state, not
zero.

---

## Gaps

1. The conventional grouping the primary agent proposes was not read before
   writing this document -- by design. The challenger produces alternatives
   independently, not in reaction to the primary. If the primary independently
   converges on Option C (co-occurrence), that is evidence for confidence in
   that grouping.

2. User task frequency was not directly measured. The temporal grouping (Option
   A) assumes daily NOW checks and weekly TRENDS reviews -- these are inferences
   from the solo-developer context, not observed usage data.

3. `velocity-log.jsonl` broken state was confirmed but root cause was not
   traced. Any grouping that includes session productivity data must account for
   this gap.

---

## Serendipity

**The velocity-log structural break is a dashboard anti-pattern to make
explicit.** SQ1c-2 found that all 50 velocity-log entries show
`items_completed: 0`. This is not a missing feature -- it is a silent failure.
Any dashboard that shows velocity data without flagging the broken source would
create false confidence (always showing 0 looks like "nothing got done" rather
than "tracking is broken"). A well-designed dashboard should distinguish between
"metric is 0" and "metric is unavailable due to extraction failure."

**The two-warning-system problem creates a natural INVESTIGATE tab
opportunity.** SQ1c-3 found that `data/ecosystem-v2/warnings.jsonl` and
`.claude/state/hook-warnings-log.jsonl` are parallel but non-overlapping warning
systems. A developer checking warnings under domain grouping would need to
consult both files manually. Under Option D (two-tab), the INVESTIGATE tab's
"Active Warnings" section could aggregate both into a unified warning feed --
solving a real operational gap that domain grouping would never expose.

**`enforcement-manifest.jsonl`** (360 records, 122KB) contains pattern-to-gate
coverage data and was flagged as serendipitous in SQ1b. No proposed grouping
(conventional or alternative) has naturally claimed it. It best fits Option C's
COMMIT HEALTH tab (which gates fire on which commits) or Option E's Hygiene tab
(what fraction of patterns are actually gated vs behavioral-only).

---

## Confidence Assessment

- HIGH claims: 8 (co-occurrence evidence from process findings, data update
  frequencies from SQ1b, velocity-log structural gap from SQ1c-2)
- MEDIUM claims: 4 (daily usage pattern inferences, option pairings as
  recommendations -- these are design judgments, not data facts)
- LOW claims: 1 (psychological effect of Hygiene tab -- speculative)
- UNVERIFIED claims: 0
- Overall confidence: HIGH for evidence; MEDIUM for recommendations (design
  choices involve values not just facts)
