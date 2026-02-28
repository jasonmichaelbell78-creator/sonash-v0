---
name: alerts
description: |
  Intelligent health dashboard with scoring, benchmarks, trends, and interactive
  alert-by-alert workflow. Triggers: "alerts", "check alerts", "what needs
  attention", "system health", "show warnings", "pending issues". Default mode
  (--limited) checks 16 categories. Use --full for comprehensive reporting with
  all 36 categories.
---

# Alerts -- Intelligent Health Dashboard

## When to Use

- User explicitly invokes `/alerts`

## When NOT to Use

- When a more specialized skill exists for the specific task

## Overview

Intelligent health dashboard: computes health scores, rates against benchmarks,
shows trends via sparklines, groups related items, and uses interactive
alert-by-alert workflow.

**Output:** v2 JSON with `{alerts:[], context:{}}` per category, health scores,
benchmarks, trends, and session plans.

## Usage

```
/alerts           # Limited mode (default) - 16 categories
/alerts --full    # Full mode - 36 categories
```

## Workflow

### Phase 1: Run & Parse

1. `node .claude/skills/alerts/scripts/run-alerts.js --limited` (or `--full`)
2. Parse v2 JSON from stdout
3. Create session log: `.claude/tmp/alert-session-{YYYY-MM-DD-HHMM}.jsonl`
4. Load suppressions from `.claude/state/alert-suppressions.json`

### Phase 2: Dashboard Overview

```
Health: {grade} ({score}/100)  |  {errors} errors / {warnings} warnings / {info} info
```

Category scorecard table (Category | Score | Rating), then: "Found N alerts.
Walking through each one..."

### Phase 3: Alert-by-Alert Loop

Sort: errors first, then warnings, then info. For each alert show context card
with severity badge, category, message, details, trend, suggested action.

AskUserQuestion options by severity:

- **ERROR:** Fix Now | Defer | Suppress (permanent)
- **WARNING:** Fix Now | Defer | Ignore (session) | Suppress
- **INFO:** Acknowledge | Ignore (session) | Suppress

Suppress requires reason. Fix Now executes immediately. Log every decision to
session JSONL.

### Phase 4: Action Plan Summary

Show: Fixed N, Deferred N, Ignored N, Suppressed N. If deferred items: list
them, ask "Execute deferred fixes now?" (Execute all / selected / Skip).

### Phase 5: Batch Execution

Execute deferred fixes in order, update session log with results.

### Phase 6: System Self-Audit

Claude performs live analysis checking: checker coverage (no_data), suppression
health (stale >90d), score integrity (unmeasured weight), decision balance
(fix/defer/ignore/suppress ratio), trend health (declining scores), process gaps
(missing log files). Present with AskUserQuestion: Acknowledge / Create tasks /
Suppress.

### Phase 7: Cleanup & Verification

1. Write `.claude/alerts-acknowledged.json`
2. Save new suppressions
3. Clear resolved warnings from `.claude/hook-warnings.json`
4. Offer re-run with delta display

## Suppression System

File: `.claude/state/alert-suppressions.json`. Match by category + regex on
message. Expired suppressions skipped. Filtered after checkers run, before score
computation.

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

**Scoring:** Start at 100, deduct 30/error, 10/warning. **Grades:** A=90+,
B=80+, C=70+, D=60+, F=<60.

## Scripts

```bash
node .claude/skills/alerts/scripts/run-alerts.js --limited   # or --full
npm run alerts:cleanup   # Delete session logs >7 days
```

Exit code 1 if error-level alerts. Delta tracking: first run/day saves baseline
to `.claude/state/alerts-baseline.json`.

## Integration

At session start: run `/alerts` (limited), walk through workflow, fix issues,
offer re-run to verify.

---

## Version History

| Version | Date       | Description                                               |
| ------- | ---------- | --------------------------------------------------------- |
| 1.1     | 2026-02-25 | Trim to <500 lines: condense benchmark tables and weights |
| 1.0     | 2026-02-25 | Initial implementation                                    |
