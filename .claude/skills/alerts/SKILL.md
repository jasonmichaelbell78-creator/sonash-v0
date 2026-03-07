---
name: alerts
description: |
  Intelligent health dashboard with scoring, benchmarks, trends, and interactive
  alert-by-alert workflow. Default mode (--limited) checks 16 categories. Use
  --full for comprehensive reporting with all 36 categories.
---

# Alerts -- Intelligent Health Dashboard

## Critical Rules

1. **MUST** run the checker script before presenting any data
2. **MUST** present every alert to the user (no silent filtering)
3. **MUST** recommend an action per alert based on severity + trend
4. **MUST** log every decision to the session JSONL
5. **MUST NOT** present a health score without running checkers first

## When to Use

- User explicitly invokes `/alerts`
- User asks "check alerts", "what needs attention", "system health", "show
  warnings", "pending issues"
- Called from `session-begin` with `--limited` mode

## When NOT to Use

Use a more specific skill instead:

| Need                      | Use Instead         |
| ------------------------- | ------------------- |
| Domain-specific audit     | `/audit-code`, etc. |
| Audit system meta-check   | `/audit-health`     |
| Ecosystem-wide diagnostic | `/ecosystem-health` |
| Skill validation          | `/skill-audit`      |

## What This Skill Does NOT Do

- Infrastructure monitoring, uptime checks, or server health
- CI/CD status monitoring (use `/gh-fix-ci` for that)
- Live application metrics or APM

## Overview

Intelligence = trend detection, cross-category grouping, suppression learning,
and self-audit of checker coverage. This skill measures **project/codebase
health**, not infrastructure or server health.

**Output:** v2 JSON with `{alerts:[], context:{}}` per category, health scores,
benchmarks, trends, and session plans.

## Alert Object Schema

```json
{
  "severity": "error | warning | info",
  "category": "string",
  "message": "string",
  "details": "string | null",
  "trend": "improving | stable | declining | null",
  "action": "string | null"
}
```

## Session JSONL Record Format

File: `.claude/tmp/alert-session-{YYYY-MM-DD-HHMM}.jsonl`

```json
{
  "timestamp": "ISO-8601",
  "alert_id": "category-N",
  "category": "string",
  "severity": "error | warning | info",
  "message": "string",
  "decision": "fix_now | defer | ignore | suppress | acknowledge | delegated-accept",
  "reason": "string (MUST for suppress)"
}
```

## Usage

```
/alerts           # Limited mode (default) - 16 categories
/alerts --full    # Full mode - 36 categories
/alerts --limited # Explicit limited (used by session-begin)
```

**Context-aware mode:** When called from `session-begin`, MUST use `--limited`.
When standalone, ask user which mode if not specified.

---

## Workflow

### Warm-Up

Before Phase 1, inform the user:

- **Mode:** limited (16 categories, ~15-30s) or full (36 categories, ~30-60s)
- **What to expect:** Dashboard overview, then interactive alert-by-alert
  walkthrough
- **Expected runtime:** Kill script after 120s if no output

---

### Phase 1: Run & Parse

1. MUST run: `node .claude/skills/alerts/scripts/run-alerts.js --limited` (or
   `--full`)
2. Parse v2 JSON from stdout
3. Create session log: `.claude/tmp/alert-session-{YYYY-MM-DD-HHMM}.jsonl`
4. Load suppressions from `.claude/state/alert-suppressions.json`
5. Check for duplicate run: if session JSONL exists from <30min ago, show
   previous results and offer re-run

**Error handling:**

- Non-zero exit without JSON: report error, suggest
  `node --stack-trace-limit=50 .claude/skills/alerts/scripts/run-alerts.js`, do
  NOT proceed to Phase 2
- JSON parse fails: show raw output (first 20 lines), ask "Debug or skip?"
- Script timeout (>120s): kill process, report timeout, ask to retry or skip

---

### Phase 2: Dashboard Overview

**Scoring formula:** Start at 100, deduct 30 per error, 10 per warning.
**Grades:** A=90+, B=80+, C=70+, D=60+, F=<60.

```
Health: {grade} ({score}/100, {measuredPct}% measured)  |  {errors} errors / {warnings} warnings / {info} info
```

**Dashboard table** (sort by score ascending — worst first):

| Category | Score | Rating | Alerts | Trend |
| -------- | ----- | ------ | ------ | ----- |

Cross-reference Benchmarks section for rating thresholds.

**Cross-session trends:** If `.claude/state/alerts-history.jsonl` exists, show
last 5 sessions as sparkline in dashboard header.

**Zero alerts path:** If zero alerts found, show dashboard, skip Phases 3-5, go
directly to Phase 6 (Self-Audit).

Then: "Found N alerts. Walking through each one..."

---

### Phase 3: Alert-by-Alert Loop

Sort: errors first, then warnings, then info.

**Alert grouping:** If 3+ alerts share same category + severity, group them.
Show first example in full, then: "Apply same decision to all N similar alerts?"

**Progress indicator:** Show `Alert N of M (X fixed, Y deferred, Z ignored)`

**Context card format per alert:**

```
[ERROR/WARNING/INFO] Category: {category}
  Message: {message}
  Details: {details}
  Trend: {trend} {sparkline}
  Benchmark: {benchmark_value} (Rating: {rating})
  Suggested: {recommendation}

  Options: [Fix Now] [Defer] [Ignore] [Suppress]
```

**Recommendation per alert:**

- ERROR: recommend Fix Now
- WARNING + declining trend: recommend Fix Now
- WARNING + stable trend: recommend Defer
- INFO: recommend Acknowledge

**Delegation protocol:** If user says "you decide" or similar, apply all
recommendations automatically, record each as `delegated-accept`, show summary.

AskUserQuestion options by severity:

- **ERROR:** Fix Now | Defer | Suppress (permanent, requires reason)
- **WARNING:** Fix Now | Defer | Ignore (session) | Suppress
- **INFO:** Acknowledge | Ignore (session) | Suppress

Suppress MUST include reason. Fix Now executes immediately. Log every decision
to session JSONL.

**Mid-workflow escape hatch:** After every 10 alerts, offer: "Skip to summary?
(remaining default to Defer)"

**Scope guard:** If a fix would take >5min or touch >3 files, pause and ask:
"Continue inline or create task for later?"

**Inline fix guidance:** <2min fix: do it inline. >2min: defer and suggest the
appropriate skill (e.g., `/audit-code` for code issues).

Follow CLAUDE.md Section 6 project conventions for all inline fixes.

---

### Phase 4: Decision Review & Action Plan Summary

**Decision revision gate:** Before executing, review all decisions: "Review all
decisions. Revise any before executing?"

Show: Fixed N, Deferred N, Ignored N, Suppressed N.

If deferred items exist: list them, ask "Execute deferred fixes now?" (Execute
all / selected / Skip).

---

### Phase 5: Batch Execution

Execute deferred fixes in order. Update session log with results.

**Done-when gate:** Phase 5 is done when all selected fixes have been executed
and results logged.

---

### Phase 6: System Self-Audit

Claude performs live analysis checking:

- **Checker coverage:** Categories with `no_data` — surface as blind spots
- **Suppression health:** Stale suppressions >90 days — warn if >50% suppressed
- **Score integrity:** Unmeasured weight percentage
- **Decision balance:** Fix/defer/ignore/suppress ratio
- **Trend health:** Categories with declining scores across sessions
- **Process gaps:** Missing log files, dead data sources
- **Baseline staleness:** If baseline >7 days old, note and offer reset

**Checker failure handling:** Any checker that returned `no_data` or error MUST
be surfaced as an INFO alert in the self-audit. These represent blind spots.

**Suppression ratio guard:** If >50% of alerts are suppressed, emit WARNING.

Present findings with AskUserQuestion: Acknowledge / Create tasks / Suppress.

**Done-when gate:** Phase 6 is done when all self-audit findings are presented
and decided.

---

### Phase 7: Cleanup & Verification

1. Write `.claude/alerts-acknowledged.json`
2. Save new suppressions (with reason field MUST be present)
3. Clear resolved warnings from `.claude/hook-warnings.json`
4. Extract summary stats to `.claude/state/alerts-history.jsonl` (never cleaned)
5. Offer re-run with delta display

**Closure summary format:**

```
Health: {before_grade} ({before_score}) -> {after_grade} ({after_score})
Fixed: N | Deferred: N | Ignored: N | Suppressed: N
Session log: .claude/tmp/alert-session-{timestamp}.jsonl
```

**Done-when gate:** Phase 7 is done when files are written and closure summary
is presented.

---

**Phase separators:** Use `---` between all phases in output.

---

## Suppression System

File: `.claude/state/alert-suppressions.json`. Match by category + regex on
message. Expired suppressions skipped. Filtered after checkers run, before score
computation. Reason field MUST be present in every suppression record and shown
during Phase 6 stale review.

## Modes

**Limited (16 categories):** Code Health, Security, Session Context, Debt,
Learning, Agent Compliance, Hook Warnings, Skip Abuse, Test Results, Hook
Health, Session State, Pattern Hotspots, Context Usage, Reviews Sync, Review
Archive Health, Cross-Document Dependencies.

**Full (+20 categories):** Debt Intake/Resolution, Doc Health, Roadmap, Review
Quality, Consolidation, Velocity, Session/Commit Activity, Roadmap
Validation/Hygiene, Trigger Compliance, Pattern Sync, Doc Placement, External
Links, Unused Deps, Review Churn, Backlog, GitHub Actions, SonarCloud.

## Benchmarks

All ratings: Good / Average / Poor.

| Category    | Metric              | Good | Average | Poor |
| ----------- | ------------------- | ---- | ------- | ---- |
| Debt        | S0 items            | 0    | --      | >0   |
| Debt        | S1 items            | <10  | --      | >10  |
| Debt        | Resolution rate     | >50% | >30%    | <10% |
| Code        | TS errors           | 0    | <5      | >20  |
| Code        | ESLint warnings     | 0    | <10     | >50  |
| Tests       | Pass rate           | >98% | >90%    | <80% |
| Security    | Critical vulns      | 0    | 0       | >0   |
| Security    | High vulns          | 0    | <2      | >5   |
| Learning    | Effectiveness       | >85% | >75%    | <60% |
| Learning    | Automation coverage | >40% | >25%    | <10% |
| Velocity    | Items/session       | >5   | >2      | 0    |
| Reviews     | Fix ratio           | <15% | <25%    | >35% |
| Reviews     | Max rounds          | <2   | <3      | >5   |
| Hook Health | Warnings (7d)       | 0    | <5      | >15  |
| Hook Health | False positive %    | 0%   | <30%    | >60% |
| Agents      | Compliance %        | 100% | >80%    | <50% |
| Docs        | Staleness (days)    | <3   | <7      | >14  |

## Health Score Weights

**Core (70%):** Code 15%, Security 15%, Debt 12%, Tests 10%, Learning 8%, Agents
4%, Session 3%, Hook Health 3%, Skip Abuse 2%.

**New state (8%):** Session State 3%, Pattern Hotspots 3%, Context Usage 2%.

**Existing (9%):** Velocity 3%, Reviews 3%, Docs 3%.

**Full-mode only (13%):** Debt Intake 2%, Roadmap 2%, GitHub Actions 2%,
SonarCloud 2%, plus 1% each for Trigger Compliance, Pattern Sync, Doc Placement,
External Links, Unused Deps, Review Churn, Backlog.

**Operational (7%):** Hook Warnings 1%, Roadmap 1%, Consolidation 1%, Roadmap
Health 1%, Debt Resolution 1%, Session Activity 1%, Commit Activity 1%.

## Integration

**Neighbors:**

- `/audit-health` — meta-audit of audit system health
- `/ecosystem-health` — ecosystem-wide diagnostic
- `session-begin` — calls `/alerts --limited` automatically

**Input:** Checker script JSON output, suppression file, baseline file.

**Output artifacts:** Session JSONL, acknowledged alerts, updated suppressions,
alerts-history.jsonl.

**Skill routing in suggested actions:** Map alert actions to specific skills:

- Code issues: `/audit-code`
- Security alerts: `/audit-security`
- Review quality: `/pr-retro {pr_number}`
- Debt items: `/sprint`
- Hook issues: `/hook-ecosystem-audit`

## Scripts

```bash
node .claude/skills/alerts/scripts/run-alerts.js --limited   # or --full
npm run alerts:cleanup   # Delete session logs >7 days
```

**Script dependencies:** npm scripts (`lint`, `patterns:check`,
`roadmap:validate`), data files (`.claude/state/*.jsonl`), hooks that feed data
(`post-read-handler`, `track-agent-invocation`).

**Script timeout guidance:** Limited ~15-30s, full ~30-60s, kill after 120s.

Exit code 1 if error-level alerts. Delta tracking: first run/day saves baseline
to `.claude/state/alerts-baseline.json`.

## Learning Loop

Feedback about checker quality is recorded in
`.claude/state/alerts-history.jsonl` as feedback records, consumed by Phase 6
self-audit to detect recurring blind spots and declining coverage.

---

## Version History

| Version | Date       | Description                                                 |
| ------- | ---------- | ----------------------------------------------------------- |
| 2.0     | 2026-03-07 | Full rewrite from skill audit (51 decisions, 10 categories) |
| 1.1     | 2026-02-25 | Trim to <500 lines: condense benchmark tables and weights   |
| 1.0     | 2026-02-25 | Initial implementation                                      |
