# Findings: Process Visibility Gaps — What Stays Dark After All 6 Tabs

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ6c

---

## Scope

The 6 tabs cover the following domains:

| Tab                                        | Domain                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| Tab 1: Health & Alerts                     | Ecosystem health grades, warning lifecycle, lifecycle scores, pattern coverage |
| Tab 2: Debt Pipeline                       | MASTER_DEBT metrics, intake/resolution activity, verification queue            |
| Tab 3: Code Review Quality                 | PR review history, fix rates, retro patterns, learning routes                  |
| Tab 4: Build Pipeline & Process Compliance | Hook compliance, commit timeline, agent usage, override trends                 |
| Tab 5: Governance & Audits                 | Ecosystem audit history, agent quality, stale audit warnings                   |
| Tab 6: Planning & Research                 | Research topics, active plans, sprint board, lifecycle scores                  |

The dashboard header adds a Watch Items widget (forward-findings.jsonl).

This document identifies everything that is NOT covered: invisible workflows,
partially visible ones, and the dashboard's blind spots.

---

## Key Findings

### 1. Fully Invisible Processes (Zero Dashboard Representation) [CONFIDENCE: HIGH]

The following workflows happen regularly and leave no trace visible on any of
the 6 tabs.

**1A. In-session DAS triage reasoning**

During pr-review Step 2, every item flagged as pre-existing is scored using a
Defer/Act Score (Signal 0-2, Dependency 0-2, Risk 0-2). This scoring happens
interactively in the conversation but is NEVER written to disk in any form. Only
the final disposition (fixed/deferred/rejected) survives in the state file.

Result: The dashboard shows fix/defer/reject counts but has no way to show WHY a
decision was made, or how many items were borderline calls. A month from now, no
one can ask "why did we reject this item in PR #468?"

**1B. Suppression rule creation and aging**

When `/pr-retro` Step 9 adds suppression rules to `.gemini/styleguide.md` and
`.qodo/pr-agent.toml`, no log entry is written. There is no record of when each
rule was added, which PR triggered it, how many reviews it has since suppressed,
or when it was last triggered.

There are currently suppressions in both files with no audit trail. The
dashboard has no tab for "suppression health." This is an invisible accumulation
risk — rules can become stale or overly broad with no signal.

**1C. External reviewer raw feedback**

Users paste raw feedback from CodeRabbit, Qodo, SonarCloud, and Gemini directly
into the conversation. This raw input is never written to disk. Only the parsed
item count and final dispositions survive. The dashboard cannot show "what did
CodeRabbit actually say about PR #472?"

**1D. Debt-runner session navigation sequences**

When a user runs `/debt-runner`, the sequence of modes selected within a session
(e.g., "verify → health → plan") is not logged anywhere. No state file records
"which modes ran in session X, in what order, with what outcomes."

**1E. PR size advisory decisions**

When pr-review Step 0 detects >50 changed files and asks "Continue anyway?", the
user's yes/no decision is not recorded. The dashboard cannot show "how many PRs
did we push through despite size warnings?"

**1F. Convergence-loop intermediate reasoning**

Debt-runner modes run CL verification at every mutation stage. Only the outcome
(corrections written to staging files) is persisted. The internal reasoning
chain — which agents checked which items, what they flagged — is discarded.

**1G. Loop-detector events**

`loop-detector.js` fires when Claude hits the same build/test error 3+ times in
20 minutes. It warns Claude in-context but writes no log file. The dashboard
cannot show "AI hit an error loop today at 14:30." All detection history exists
only in conversation context and is lost when the session ends.

**1H. Session-begin health gate outcomes**

The 9 health scripts that run during `/session-begin` Phase 3 (patterns:check,
review:check, lessons:surface, etc.) output to the conversation but do NOT
persist their pass/fail status to any log file. The dashboard cannot show "did
patterns:check pass at the start of Session #244?"

**1I. Context window size and compaction events**

`post-read-handler.js` tracks context size in
`.claude/hooks/.context-tracking-state.json` and triggers auto-saves to MCP when
thresholds are hit. When `pre-compaction-save.js` fires, it writes
`handoff.json` but no "compaction occurred" event is logged to any persistent
JSONL. The dashboard has no record of how often context compaction fires, or how
large the context was when it did.

**1J. `/checkpoint` mid-session saves**

Users invoke `/checkpoint` to save session state mid-work. This writes
`handoff.json` but no checkpoint log records "checkpoint taken at step X, branch
Y, goals Z." The dashboard has no checkpoint history, only the current handoff
state.

---

### 2. Partially Visible Processes (Some Steps Visible, Key Stages Dark) [CONFIDENCE: HIGH]

**2A. PR Review Lifecycle — visible: counts; dark: reasoning and raw source**

Tab 3 shows: fix/defer/reject totals, round counts, patterns from retros, fix
rate trend.

Dark stages:

- Why each item was rejected (DAS reasoning, finding 1A above)
- The raw review feedback text (finding 1C above)
- Multi-round item escalation history (when item severity changed because a
  second reviewer flagged the same issue, the escalation reasoning is lost)
- Reviewer false-positive rates by source (Qodo vs CodeRabbit vs SonarCloud vs
  Gemini — the data exists in the per-round source field but no aggregation has
  been specified)

**2B. Technical Debt Lifecycle — visible: counts and status; dark: intake
quality and resolution verification**

Tab 2 shows: severity/status breakdown, intake/resolution activity, verification
queue.

Dark stages:

- Intake quality: items were added via which intake path (manual, pr-deferred,
  sonarcloud, audit, CI) — `by_source` is in metrics.json but intake-log.jsonl
  shows per-intake records. Resolution quality: `reverify-resolved.js` exists to
  re-check that RESOLVED items are genuinely fixed, but its output
  (resolution-audit-report.json) is not surfaced on Tab 2.
- Staging file accumulation: any in-flight `staging/*.jsonl` files indicate an
  incomplete debt-runner run. The dashboard has no widget for "is there a
  debt-runner run in progress or stalled?"
- Debt drift between MASTER_DEBT and raw/deduped: the `sync-deduped.js` script
  detects count discrepancies but its results go to stdout only.

**2C. Health Scoring — visible: grades over time; dark: what triggered the
change**

Tab 1 shows: health grade trend, category scorecards, active warnings.

Dark stages:

- Grade regression root cause: Tab 1 shows the `code` category dropped from 100
  to 60 between March 19 and March 26, but has no drill-down linking the grade
  drop to specific hook events, commits, or files that caused it.
- Which session triggered a degradation: health-score-log.jsonl has timestamps
  but session IDs are stored only as Unix timestamps (e.g.,
  `session-1774738230139`), not as the human-readable `#244` counter.
  Cross-referencing "which session caused the grade drop" requires manual date
  math.
- Mid-session alert outcomes: `mid-session-alerts.js` fires after commits and
  writes to warnings.jsonl, but there is no record of whether the warning was
  seen, acted on, or ignored within that same session.

**2D. Ecosystem Audit Execution — visible: scores; dark: run frequency and
triggering**

Tab 5 shows: audit history, stale audit warnings, sub-audit scores.

Dark stages:

- Who triggered each audit run (user-initiated vs. CI vs. session-end
  automation)
- How long each audit took to run (no duration field in audit history files)
- Comprehensive audit composite report history:
  `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` is overwritten each run. There is no
  `comprehensive-audit-history.jsonl`. A user cannot ask "what was the overall
  composite score three weeks ago?"
- Doc optimizer run history: all `.claude/state/doc-optimizer/*.jsonl` files are
  deleted after each run. There is no doc-optimizer-history.jsonl. What was
  auto-fixed two months ago is unknowable.

**2E. Session Lifecycle — visible: commit activity, agent use; dark: session
start/end quality**

Tab 4 shows: commit timeline, agent invocations, override trends.

Dark stages:

- Session duration: no log records when a session began (from the user's
  perspective) or how long it lasted. `.session-state.json` tracks hook
  timestamps but is not in committed state.
- Session-begin gate outcomes (finding 1H above)
- Which sessions had an unacknowledged warning carryover at start
- No per-session summary: sessions are ephemeral groupings.
  `agent-invocations.jsonl` uses Unix timestamp session IDs. Grouping by "what
  happened in Session #244" requires correlating across 5 separate JSONL files
  by date range.

**2F. Planning Workflow — visible: tasks and status; dark: decision rationale
and execution**

Tab 6 shows: research topics, plan phases, sprint board.

Dark stages:

- Decision rationale from `/deep-plan` sessions: the decisions array exists in
  state files, but the `rationale` field is sparsely populated. The dashboard
  shows decision counts but not the substance of decisions.
- Plan-to-branch linkage: no state file records which git branch was the
  implementation branch for a given plan. A user cannot click on a plan and see
  the associated PR history.
- Research duration: `research-index.jsonl` has no `startedAt` field. Cannot
  show "this research took 4 hours."
- In-flight research: two active research topics exist only in state files, not
  in `research-index.jsonl`. The current index gives a false complete picture.

---

### 3. Dashboard Blind Spots — Things That Can Go Wrong Without Any Signal [CONFIDENCE: HIGH]

These are the most dangerous gaps for a solo developer: situations where the
project is degrading and the dashboard would show nothing unusual.

**BLIND SPOT 1: Suppression rule accumulation**

The dashboard has no suppression health panel. `.gemini/styleguide.md` and
`.qodo/pr-agent.toml` could have 200 rules, many stale, suppressing valid
findings. The dashboard would show normal review fix rates while real issues are
being silently suppressed. No alert would fire.

**BLIND SPOT 2: Velocity is entirely broken and the dashboard will show
"unavailable"**

velocity-log.jsonl has `items_completed: 0` across all 50 sessions (Sessions
#148–#243). The underlying extraction script (`track-session.js`) is not parsing
completed ROADMAP items. The dashboard correctly shows "data unavailable" for
velocity — but this means there is zero historical insight into whether
development is accelerating or stalling. This is not a dashboard design flaw; it
is a broken data pipeline that pre-exists the dashboard.

**BLIND SPOT 3: debt-runner runs stalling silently**

If a debt-runner session is interrupted mid-run, staging files accumulate in
`docs/technical-debt/staging/`. The dashboard has no widget showing "staging
directory has N files that are older than 24 hours." A developer could run
debt-runner, encounter an error, never complete the cleanup pass, and the
dashboard would show the MASTER_DEBT counts as if everything were consistent —
while staging/\*.jsonl files contain uncommitted corrections.

**BLIND SPOT 4: Two health log files diverging**

`health-score-log.jsonl` (in `.claude/state/`) and `ecosystem-health-log.jsonl`
(in `data/ecosystem-v2/`) track health scores independently with different entry
counts (24 vs 32). The dashboard uses `ecosystem-health-log.jsonl` as primary,
but `session-start.js` reads `health-score-log.jsonl` for grade-drop detection.
These two files can diverge silently. If they are out of sync, the session-start
gate could fire on a grade drop that the dashboard's trend chart does not
reflect.

**BLIND SPOT 5: SonarCloud is consistently null**

`sonarcloud` category appears as `null` in virtually every
health-score-log.jsonl entry. The dashboard will show SonarCloud as perpetually
unavailable. Meanwhile, SonarCloud could be accumulating new issues between
sessions. The ecosystem-integration checker calls `npm run sonar:check` but this
consistently fails. If this is a connectivity issue, the developer has no live
SonarCloud signal in the dashboard.

**BLIND SPOT 6: Incomplete audit coverage**

`doc-ecosystem-audit-history.jsonl` has 1 entry (2026-02-25 — over 33 days ago).
`tdms-ecosystem-audit-history.jsonl` has 1 entry.
`session-ecosystem-audit-history.jsonl` has 1 entry. Tab 5 will show "stale
audit" warnings for these, which is good — but the warning is the last signal
available. If audits remain stale, the system has no mechanism to automatically
re-run them. The blind spot is ongoing: the project could accumulate doc link
rot, TDMS drift, and session hygiene problems for months with a single stale
entry as the only evidence.

**BLIND SPOT 7: Loop-detector history is ephemeral**

`loop-detector.js` detects groundhog-day errors (3+ identical errors in 20 min)
and warns Claude in-context. The frequency of these events is completely
unknowable from the dashboard. A developer who notices they spend a lot of time
debugging the same errors has no data to prove the pattern or track whether it's
getting better. This is the most invisible form of productivity waste.

**BLIND SPOT 8: Retro action item follow-through**

Tab 4 includes a "Retro Follow-Through" widget, but it was marked "No data
source" in the W3-T4A design. `retros.jsonl` contains action items with
`verify_cmd` fields, but no file tracks whether those commands were run, when,
and with what outcome. The dashboard would show this as null/unavailable — but
the actual situation could be that 15 accepted action items have never been
verified.

**BLIND SPOT 9: Session-begin warning gate carryover**

When `session-start.js` writes `hook-warnings.json` (unacknowledged warnings),
the session-begin Phase 4 requires acknowledging them before proceeding. If a
developer regularly dismisses warnings without acting, the pattern is invisible.
`override-log.jsonl` captures hook bypasses but not warning dismissals. The
dashboard shows override trends (Tab 4) but not "how often warnings were
dismissed without action."

**BLIND SPOT 10: Commit data quality degradation**

`commit-log.jsonl` has 634 records, all seeded with `branch: "seeded"`,
`filesChanged: 0`, `session: null`. The live `commit-tracker.js` hook is
supposed to enrich new commits, but the current dataset has ZERO live tracker
records. If `commit-tracker.js` silently fails to append new records (due to a
Node version issue, hook error, etc.), the dashboard commit timeline will simply
never grow after launch. No alert would fire because there is no check for "live
tracker records exist."

---

### 4. Recommended New Data Capture — Minimum Viable Instrumentation [CONFIDENCE: HIGH]

Ranked by impact for a solo developer's daily workflow. Each item is minimal —
an append to an existing JSONL file or a new small file.

**Priority 1 (Critical — fills biggest daily blind spots):**

**REC-1: Suppression audit log**

When `/pr-retro` Step 9 writes to `.gemini/styleguide.md` or
`.qodo/pr-agent.toml`, append to a new `.claude/state/suppression-log.jsonl`:

```json
{
  "timestamp": "ISO 8601",
  "file": ".gemini/styleguide.md",
  "rule": "rule text",
  "reason": "user-provided reason",
  "triggered_by_pr": 472,
  "source": "gemini"
}
```

Tab 3 would then show a "Suppression Health" panel: total rules by source, age
distribution, rules not triggered in last 10 PRs (staleness signal).

**REC-2: Retro action item verification log**

When `/pr-retro` Step 2.5 re-runs `verify_cmd` for prior action items, append
results to a new `.claude/state/retro-verifications.jsonl`:

```json
{
  "timestamp": "ISO 8601",
  "retro_pr": 468,
  "action_item": "Add CC check after fixes",
  "verify_cmd": "grep -c ...",
  "passed": true,
  "checked_in_retro_pr": 472
}
```

Tab 4 Retro Follow-Through widget would become functional.

**REC-3: Session-begin gate outcome log**

After `/session-begin` Phase 4 gates resolve, append a summary to
`.claude/state/session-gates-log.jsonl`:

```json
{
  "session_number": 244,
  "timestamp": "ISO 8601",
  "gates_triggered": ["hook-warnings", "build-failures"],
  "gates_cleared": ["hook-warnings"],
  "gates_bypassed": [],
  "warnings_acknowledged": 3,
  "build_failures": 0
}
```

Tab 4 or Tab 1 would show "session start quality" trend — how often sessions
begin with active warnings vs. clean state.

**Priority 2 (High value — fills key health blind spots):**

**REC-4: Loop-detector persistent log**

Modify `loop-detector.js` to append to `.claude/state/loop-events.jsonl`:

```json
{
  "timestamp": "ISO 8601",
  "error_pattern": "ENOENT: no such file",
  "occurrences": 3,
  "window_minutes": 20,
  "branch": "feat/dashboard",
  "session_id": "session-1774738230139"
}
```

Tab 4 would show "Error Loop Events" — frequency, patterns, branches affected.

**REC-5: Comprehensive audit history file**

When `/comprehensive-ecosystem-audit` completes, instead of only writing
`COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` (which is overwritten), also append to
`.claude/state/comprehensive-audit-history.jsonl`:

```json
{
  "timestamp": "ISO 8601",
  "composite_score": 87,
  "grade": "B",
  "sub_audits": {
    "hook": { "score": 95, "grade": "A" },
    "skill": { "score": 82, "grade": "B" },
    ...
  }
}
```

Tab 5 would have trend data for the composite score. Currently Tab 5 can only
show individual sub-audit histories.

**REC-6: Debt-runner staging sentinel**

When `debt-runner` starts a mutation mode, write a sentinel file:
`.claude/state/debt-runner-active.json`:

```json
{
  "started": "ISO 8601",
  "mode": "verify",
  "staging_files": ["staging/verify-corrections.jsonl"],
  "pid": 12345
}
```

Delete on clean completion. If the file exists and `started` is >2 hours ago,
Tab 2 shows a "Stalled debt-runner run" warning.

**Priority 3 (Useful for trend analysis, not daily urgent):**

**REC-7: PR size advisory log**

In `/pr-review` Step 0, when a size warning fires, append to
`.claude/state/pr-size-advisories.jsonl`:

```json
{
  "timestamp": "ISO 8601",
  "pr": 472,
  "file_count": 73,
  "decision": "continue",
  "session_number": 244
}
```

Tab 3 would surface "PRs pushed through despite size warnings" as a metric.

**REC-8: Session-begin health script results**

After the 9 health scripts in `/session-begin` Phase 3 run, append to
`.claude/state/session-health-checks.jsonl`:

```json
{
  "session_number": 244,
  "timestamp": "ISO 8601",
  "checks": {
    "patterns_check": "pass",
    "review_check": "warn",
    "lessons_surface": "pass",
    ...
  }
}
```

Tab 1 would show "Session Start Health" trend — which checks are consistently
warning at session start.

---

### 5. Priority Ranking for a Solo Developer's Daily Workflow [CONFIDENCE: HIGH]

The solo developer use case prioritizes: "What do I need to look at today?" and
"Is something breaking that I haven't noticed?"

**Tier 1 — Act on these if they fire (daily-impact blind spots):**

| Blind Spot                                        | Risk                                            | Fix                                    |
| ------------------------------------------------- | ----------------------------------------------- | -------------------------------------- |
| Suppression rule accumulation (BS-1)              | Silently suppressing valid findings in every PR | REC-1                                  |
| Debt-runner stalled run (BS-3)                    | MASTER_DEBT counts misleading; staging drift    | REC-6                                  |
| Commit tracker not producing live records (BS-10) | Dashboard growth stops silently                 | Add health check for live record count |
| Retro action items unverified (BS-8)              | Accepted improvements never implemented         | REC-2                                  |

**Tier 2 — Weekly review signals:**

| Blind Spot                             | Risk                                       | Fix                          |
| -------------------------------------- | ------------------------------------------ | ---------------------------- |
| Loop-detector history invisible (BS-7) | Hidden productivity waste                  | REC-4                        |
| Session-begin gate outcomes (BS-9)     | Warning dismissal pattern invisible        | REC-3                        |
| Velocity entirely broken (BS-2)        | No sprint progress signal                  | Fix extraction script        |
| SonarCloud perpetually null (BS-5)     | Real security issues accumulating silently | Fix sonar:check connectivity |

**Tier 3 — Audit cycle signals (monthly):**

| Blind Spot                                         | Risk                                        | Fix                            |
| -------------------------------------------------- | ------------------------------------------- | ------------------------------ |
| Stale ecosystem audits (BS-6)                      | Doc rot, TDMS drift accumulating undetected | REC-5 + run audits             |
| Comprehensive audit composite trend missing (BS-6) | Cannot tell if overall health is improving  | REC-5                          |
| DAS reasoning lost (BS-1A, PR review)              | Cannot reconstruct decisions                | Low priority (quality of life) |

**Tier 4 — Nice to have (no daily risk):**

- PR size advisory history (REC-7)
- Session-begin script results (REC-8)
- Research duration tracking (planning gap)
- Plan-to-branch linkage (planning gap)

---

## Sources

| #   | Source                                                             | Type            | Trust | CRAAP | Date       |
| --- | ------------------------------------------------------------------ | --------------- | ----- | ----- | ---------- |
| 1   | `.research/dev-dashboard/findings/SQ1c-1-process-debt-review.md`   | Prior research  | HIGH  | 4.8/5 | 2026-03-29 |
| 2   | `.research/dev-dashboard/findings/SQ1c-2-process-session-hooks.md` | Prior research  | HIGH  | 4.8/5 | 2026-03-29 |
| 3   | `.research/dev-dashboard/findings/SQ1c-3-process-health-audits.md` | Prior research  | HIGH  | 4.8/5 | 2026-03-29 |
| 4   | `.research/dev-dashboard/findings/CHECKPOINT-tab-decisions.md`     | Decision record | HIGH  | 5/5   | 2026-03-29 |
| 5   | `.research/dev-dashboard/findings/W3-T4A-pipeline-data-design.md`  | Prior research  | HIGH  | 4.8/5 | 2026-03-29 |
| 6   | `.research/dev-dashboard/findings/W3-T6A-planning-data-design.md`  | Prior research  | HIGH  | 4.8/5 | 2026-03-29 |
| 7   | `.research/dev-dashboard/findings/W3-T5A-audits-data-design.md`    | Prior research  | HIGH  | 4.8/5 | 2026-03-29 |
| 8   | `.research/dev-dashboard/findings/W3-T3A-reviews-data-design.md`   | Prior research  | HIGH  | 4.8/5 | 2026-03-29 |

---

## Contradictions

**Velocity widget treatment:** The CHECKPOINT-tab-decisions.md says velocity
will show "data unavailable" (acknowledged broken state). This is correct and
not in conflict with any other source. The finding here (BS-2) is that velocity
being broken is itself a deeper problem — the extraction script is broken and
has been for Sessions #148–#243 without any signal forcing it to be fixed.

**Two health log files:** SQ1c-3 notes these as a contradiction to resolve. The
tab decision uses `ecosystem-health-log.jsonl` as primary. The blind spot (BS-4)
is that `session-start.js` uses the OTHER file for grade-drop detection. Both
sources agree this is a divergence risk; neither resolves the root issue.

---

## Gaps

1. **DAS scoring schema** — the DAS fields (Signal/Dependency/Risk) are computed
   during pr-review but the exact schema is not documented in any SKILL.md or
   state file spec. Whether these could be added to the state file without major
   skill changes was not investigated.

2. **Suppression file current state** — the actual size/content of
   `.gemini/styleguide.md` and `.qodo/pr-agent.toml` was not measured in this
   research. The count of accumulated rules and their ages is unknown.

3. **commit-tracker.js failure modes** — why commit-log.jsonl has zero live
   records (all seeded) was not fully root-caused. Whether the tracker is
   silently failing or simply hasn't fired since the seeder ran is unconfirmed.

4. **retros.jsonl `verify_cmd` execution status** — whether these commands are
   being run automatically by the skill or only when manually triggered was not
   confirmed from the SKILL.md text alone.

---

## Serendipity

**The biggest invisible process is the process compliance process itself.** The
dashboard has a whole Tab 4 section for "Process Compliance" — but the most
important compliance question ("are we actually following the pr-review,
pr-retro, debt-runner protocols correctly?") is unanswerable from existing data.
The DAS reasoning, retro follow-through, and suppression audit are the three
missing pieces that would make Tab 3 and Tab 4 actually tell the story of
protocol adherence.

**Velocity is the most visible broken thing, but suppression accumulation is the
most dangerous invisible thing.** A broken velocity widget shows "unavailable"
and the developer knows about it. Suppression rule accumulation is completely
silent — every review could be getting artificially inflated fix rates while
suppressions eat valid findings. Of all the blind spots identified, this is the
one most likely to cause a real quality problem without any alert.

**The session-to-JSONL cross-reference problem is structural.** Seven different
JSONL files all use different session ID formats (human counter #244, Unix
timestamp session-1774738230139, or no session ID at all). This makes "what
happened in Session #244" a manual investigation instead of a dashboard query.
The lowest-effort fix is adding a `session_number` integer field to
agent-invocations.jsonl, commit-log.jsonl, hook-runs.jsonl, and
override-log.jsonl going forward. Session numbers are available from
`SESSION_CONTEXT.md` at session-begin time.

---

## Confidence Assessment

- HIGH claims: 5 (Findings 1-5 all HIGH)
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH — all findings derived from direct analysis of
  canonical skill definitions, live state files, and tab design decisions. No
  web search or training data relied upon.
