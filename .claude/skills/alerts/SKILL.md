---
name: alerts
description: |
  Intelligent health dashboard with scoring, benchmarks, trends, and interactive
  alert-by-alert workflow. Triggers: "alerts", "check alerts", "what needs
  attention", "system health", "show warnings", "pending issues". Default mode
  (--limited) checks 13 categories. Use --full for comprehensive reporting with
  all 33 categories.
---

# Alerts — Intelligent Health Dashboard

## Overview

This skill provides an intelligent health dashboard that goes beyond raw data.
It computes health scores, rates metrics against benchmarks, shows trends via
sparklines, groups related items, and uses an interactive alert-by-alert
workflow where each alert is presented individually for user decision.

**Output is v2 JSON** with `{alerts:[], context:{}}` per category, health
scores, benchmarks, trends, and session plans. Claude renders this as a rich
visual dashboard and walks through alerts one at a time.

## Usage

```
/alerts           # Limited mode (default) - quick health check (13 categories)
/alerts --full    # Full mode - comprehensive reporting (33 categories)
```

## Workflow

### Phase 1: Run & Parse

1. Run the alerts script:

```bash
node .claude/skills/alerts/scripts/run-alerts.js --limited   # or --full
```

2. Parse the v2 JSON output from stdout (progress goes to stderr).

3. Create a session decision log file:
   - Path: `.claude/tmp/alert-session-{YYYY-MM-DD-HHMM}.jsonl`
   - Create `.claude/tmp/` directory if it doesn't exist

4. Load suppression list from `.claude/state/alert-suppressions.json`
   - If file doesn't exist, treat as empty suppressions list

### Phase 2: Dashboard Overview (compact)

Present a compact 3-line header plus category scorecard:

```
Health: {grade} ({score}/100)  |  🔴 {errors} errors · 🟡 {warnings} warnings · 🔵 {info} info
```

Then show category scorecard table (compact format):

```
┌──────────────┬───────┬────────────┐
│ Category     │ Score │ Rating     │
├──────────────┼───────┼────────────┤
│ 🛡️ Security  │  100  │ 🟢 Good    │
│ 📋 Debt      │   40  │ 🔴 Poor    │
└──────────────┴───────┴────────────┘
```

Then say: **"Found N alerts to review. Walking through each one..."**

### Phase 3: Alert-by-Alert Loop

Sort all alerts: errors first, then warnings, then info.

For each alert, present a full context card:

```
━━━ Alert {n}/{total} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{severity_badge} {category_icon} {category_name}

{message}

Details: {details or benchmarks}
Trend: {sparkline if available}
Action: {suggested action}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use `AskUserQuestion` with severity-appropriate options:

**ERROR alerts:**

- Fix Now — execute the fix immediately
- Defer — add to deferred list for batch execution
- Suppress (permanent) — suppress this alert type permanently

**WARNING alerts:**

- Fix Now
- Defer
- Ignore (session) — skip for this session only
- Suppress (permanent)

**INFO alerts:**

- Acknowledge — mark as seen
- Ignore (session)
- Suppress (permanent)

**If user chooses "Suppress":**

- Ask for a reason (mandatory) via AskUserQuestion
- Write suppression entry to `.claude/state/alert-suppressions.json`

**If user chooses "Fix Now":**

- Execute the fix action immediately
- Mark as `executed: true` in the session log

**Log every decision** to the session JSONL file:

```json
{
  "alertIndex": 1,
  "category": "debt-metrics",
  "severity": "error",
  "message": "...",
  "decision": "fix_now",
  "timestamp": "...",
  "executed": true,
  "fixAction": "..."
}
```

### Phase 4: Action Plan Summary

After all alerts have been reviewed, show a summary:

```
📋 SESSION SUMMARY
  ✅ Fixed: N
  ⏳ Deferred: N
  ⏭️ Ignored: N
  🔇 Suppressed: N
```

If deferred items exist, list them numbered with their actions.

Use `AskUserQuestion` to ask: **"Execute deferred fixes now?"**

- Options: Execute all, Execute selected, Skip

### Phase 5: Batch Execution

If the user chose to execute deferred fixes:

1. Execute each deferred fix in order
2. After each: update session log with `executed: true` or `executionError`
3. Show progress: `[1/3] Fixing X... done`

### Phase 6: System Self-Audit (Final Alert)

After all individual alerts have been processed, present one final "meta-alert":
a self-audit of the alerts system itself. This is NOT from run-alerts.js —
Claude performs it live by analyzing the session's data.

**What the self-audit checks:**

1. **Checker coverage**: How many checkers returned `no_data: true`? List them.
   Surfaces gaps where data sources are missing or broken.

2. **Suppression health**: How many alerts are suppressed? Are any suppressions
   older than 90 days (stale)? Any categories entirely suppressed (masking real
   issues)?

3. **Score integrity**: Are any categories unmeasured (`measured: false`)? What
   % of total weight is unmeasured? If >20%, flag as warning.

4. **Decision balance**: From this session's decisions — what's the
   fix/defer/ignore/suppress ratio? High ignore rate may indicate alert fatigue.
   High suppress rate may indicate noisy checkers.

5. **Trend health**: Are health scores trending down over recent entries in
   `health-score-log.jsonl`? Are any categories consistently "poor"?

6. **Process gap detection**: Check if the following are missing/empty/stale:
   - `health-score-log.jsonl` (no history = can't trend)
   - `hook-warnings-log.jsonl` (no permanent record)
   - `alert-suppressions.json` (no suppression management)
   - `override-log.jsonl` (no override tracking)
   - Session decision logs in `.claude/tmp/` (no decision audit trail)

7. **Actionable suggestions**: Based on findings, suggest specific improvements:
   - "3 checkers returned no data — verify these npm scripts exist: ..."
   - "Suppression X is 120 days old — review if still valid"
   - "Health score dropped 15 points over last 5 runs — investigate category"
   - "70% of alerts were ignored — consider tuning benchmarks to reduce noise"

**Presentation**: Use `AskUserQuestion` with options:

- Acknowledge
- Create improvement task(s)
- Suppress self-audit

**Log decision** to session JSONL with `category: "system-self-audit"`.

### Phase 7: Cleanup & Verification

1. Write `.claude/alerts-acknowledged.json`:

   ```json
   {
     "acknowledgedAt": "ISO-8601",
     "alertsProcessed": N,
     "alertsFixed": N,
     "sessionLog": ".claude/tmp/alert-session-{timestamp}.jsonl"
   }
   ```

2. Write any new suppressions to `.claude/state/alert-suppressions.json`

3. Clear resolved alerts from `.claude/hook-warnings.json` (remove warnings
   whose messages match fixed alerts)

4. Offer re-run: **"Re-run /alerts to verify improvements?"**

5. If user accepts, re-run and show delta section:
   ```
   ✅ FIXED THIS SESSION
     ✓ {metric}: {before} → {after} ({change})
     Session impact: Grade {before} → {after} (+{delta})
   ```

## Suppression System

**File**: `.claude/state/alert-suppressions.json`

```json
{
  "version": 1,
  "suppressions": [
    {
      "id": "suppress-{timestamp}",
      "category": "docs",
      "messagePattern": "CANON validation",
      "reason": "Known false positive (mandatory)",
      "suppressedAt": "ISO-8601",
      "expiresAt": null
    }
  ]
}
```

Suppressions are filtered by `run-alerts.js` after all checkers run, before
health score computation. Match by `category` + regex on `message`. Expired
suppressions are skipped.

## Session Decision Log

**File pattern**: `.claude/tmp/alert-session-{YYYY-MM-DD-HHMM}.jsonl`

```json
{
  "alertIndex": 1,
  "category": "debt-metrics",
  "severity": "error",
  "message": "...",
  "decision": "defer",
  "timestamp": "...",
  "executed": false,
  "fixAction": "..."
}
```

Cleanup: `npm run alerts:cleanup` deletes session logs older than 7 days.

## Modes

### Limited Mode (Default) — 13 Categories

Quick health check:

1. **Code Health** — TS errors, ESLint, patterns, circular deps
2. **Security** — npm audit, secrets, security patterns
3. **Session Context** — Cross-session warnings
4. **Debt Health** — S0/S1 counts, trends, grouping, resolution rate
5. **Learning Health** — Failing patterns, effectiveness, automation
6. **Agent Compliance** — Required agents vs actual invocations
7. **Hook Warnings** — Deduplicated warnings, age tracking
8. **Skip Abuse** — Override tracking, trends
9. **Test Results** — Pass/fail/error counts, staleness
10. **Hook Health** — Failure analysis, override correlation, false-positive
    detection, commit noise ratio
11. **Session State** — Uncommitted files, stale branches
12. **Pattern Hotspots** — Repeat-offender files
13. **Context Usage** — Files-read count, excessive context warning

### Full Mode (--full) — 33 Categories

Everything in Limited plus 20 additional categories:

14. **Debt Intake** — 30-day intake velocity, source effectiveness
15. **Debt Resolution** — Resolution velocity, enhancement of existing checker
16. **Documentation Health** — CANON, cross-doc deps, staleness
17. **Roadmap/Planning** — Blocked/overdue items
18. **Review Quality** — PR rounds, fix ratios
19. **Consolidation** — Reviews pending, suggested rules
20. **Velocity** — Items/session, acceleration detection
21. **Session Activity** — Files, commits, skills last session
22. **Commit Activity** — 24h commits, attribution, last commit age
23. **Roadmap Validation** — `npm run roadmap:validate`
24. **Roadmap Hygiene** — `npm run roadmap:hygiene`
25. **Trigger Compliance** — `npm run triggers:check`
26. **Pattern Sync** — `npm run patterns:sync`
27. **Doc Placement** — `npm run docs:placement`
28. **External Links** — `npm run docs:external-links`
29. **Unused Deps** — `npm run deps:unused`
30. **Review Churn** — `npm run review:churn`
31. **Backlog Health** — `npm run backlog:check`
32. **GitHub Actions** — CI/CD status via `gh run list`
33. **SonarCloud** — Quality gate status

## Benchmark Reference

All ratings use three tiers: 🟢 Good, 🟡 Average, 🔴 Poor.

### Debt Benchmarks

| Metric          | 🟢 Good | 🟡 Average | 🔴 Poor | Direction        |
| --------------- | ------- | ---------- | ------- | ---------------- |
| S0 items        | 0       | —          | >0      | Lower is better  |
| S1 items        | <10     | —          | >10     | Lower is better  |
| Resolution rate | >50%    | >30%       | <10%    | Higher is better |
| Avg age (days)  | <30     | <90        | >180    | Lower is better  |

### Code Benchmarks

| Metric          | 🟢 Good | 🟡 Average | 🔴 Poor | Direction       |
| --------------- | ------- | ---------- | ------- | --------------- |
| TS errors       | 0       | <5         | >20     | Lower is better |
| ESLint warnings | 0       | <10        | >50     | Lower is better |

### Test Benchmarks

| Metric           | 🟢 Good | 🟡 Average | 🔴 Poor | Direction        |
| ---------------- | ------- | ---------- | ------- | ---------------- |
| Pass rate        | >98%    | >90%       | <80%    | Higher is better |
| Staleness (days) | <1      | <3         | >7      | Lower is better  |

### Security Benchmarks

| Metric         | 🟢 Good | 🟡 Average | 🔴 Poor | Direction       |
| -------------- | ------- | ---------- | ------- | --------------- |
| Critical vulns | 0       | 0          | >0      | Lower is better |
| High vulns     | 0       | <2         | >5      | Lower is better |

### Learning Benchmarks

| Metric              | 🟢 Good | 🟡 Average | 🔴 Poor | Direction        |
| ------------------- | ------- | ---------- | ------- | ---------------- |
| Effectiveness       | >85%    | >75%       | <60%    | Higher is better |
| Automation coverage | >40%    | >25%       | <10%    | Higher is better |
| Failing patterns    | 0       | <5         | >10     | Lower is better  |

### Velocity Benchmarks

| Metric        | 🟢 Good | 🟡 Average | 🔴 Poor | Direction        |
| ------------- | ------- | ---------- | ------- | ---------------- |
| Items/session | >5      | >2         | 0       | Higher is better |

### Review Benchmarks

| Metric     | 🟢 Good | 🟡 Average | 🔴 Poor | Direction       |
| ---------- | ------- | ---------- | ------- | --------------- |
| Fix ratio  | <15%    | <25%       | >35%    | Lower is better |
| Max rounds | <2      | <3         | >5      | Lower is better |

### Hook Health Benchmarks

| Metric           | 🟢 Good | 🟡 Average | 🔴 Poor | Direction       |
| ---------------- | ------- | ---------- | ------- | --------------- |
| Warnings (7d)    | 0       | <5         | >15     | Lower is better |
| Overrides (7d)   | 0       | <2         | >5      | Lower is better |
| False positive % | 0%      | <30%       | >60%    | Lower is better |
| Commit noise %   | 0%      | <5%        | >15%    | Lower is better |

### Other Benchmarks

| Category         | Metric           | 🟢 Good | 🟡 Average | 🔴 Poor |
| ---------------- | ---------------- | ------- | ---------- | ------- |
| Agent compliance | %                | 100%    | >80%       | <50%    |
| Hook warnings    | Age (days)       | 0       | <3         | >7      |
| Docs staleness   | Days             | <3      | <7         | >14     |
| Consolidation    | Reviews pending  | 0       | <5         | >10     |
| Roadmap          | Blocked items    | 0       | <2         | >5      |
| Commits          | Hours since last | <2      | <8         | >24     |

## Health Score

The overall health score is a weighted average of category scores:

**Core (70%):**

| Category    | Weight |
| ----------- | ------ |
| Code Health | 15%    |
| Security    | 15%    |
| Debt        | 12%    |
| Tests       | 10%    |
| Learning    | 8%     |
| Skip Abuse  | 2%     |
| Session     | 3%     |
| Agents      | 4%     |
| Hook Health | 3%     |

**New state (8%):**

| Category         | Weight |
| ---------------- | ------ |
| Session State    | 3%     |
| Pattern Hotspots | 3%     |
| Context Usage    | 2%     |

**Existing adjusted (9%):**

| Category | Weight |
| -------- | ------ |
| Velocity | 3%     |
| Reviews  | 3%     |
| Docs     | 3%     |

**Full-mode only (contribute when measured):**

| Category           | Weight |
| ------------------ | ------ |
| Debt Intake        | 2%     |
| Roadmap Hygiene    | 2%     |
| Trigger Compliance | 1%     |
| Pattern Sync       | 1%     |
| Doc Placement      | 1%     |
| External Links     | 1%     |
| Unused Deps        | 1%     |
| Review Churn       | 1%     |
| Backlog            | 1%     |
| GitHub Actions     | 2%     |
| SonarCloud         | 2%     |

All new full-mode categories use `measured: false` fallback so limited mode
scores stay stable.

**Category scoring:** Start at 100, deduct 30 per error, 10 per warning. **Grade
scale:** A = 90+, B = 80+, C = 70+, D = 60+, F = <60.

## v2 Output Schema

```json
{
  "version": 2,
  "mode": "limited|full",
  "timestamp": "ISO-8601",
  "healthScore": {
    "grade": "B",
    "score": 74,
    "breakdown": {
      "code": { "score": 70, "weight": 0.15, "measured": true },
      "security": { "score": 100, "weight": 0.15, "measured": true }
    }
  },
  "categories": {
    "debt-metrics": {
      "alerts": [
        { "severity": "error", "message": "...", "details": "...", "action": "..." }
      ],
      "context": { ... }
    }
  },
  "summary": { "errors": 2, "warnings": 4, "info": 3 },
  "sessionPlan": [ ... ],
  "delta": { ... }
}
```

## Scripts

### run-alerts.js

Main script. Outputs v2 JSON to stdout, progress to stderr.

```bash
node .claude/skills/alerts/scripts/run-alerts.js --limited
node .claude/skills/alerts/scripts/run-alerts.js --full
```

Exit code 1 if any error-level alerts, 0 otherwise.

**Delta tracking:** First run per day saves a baseline to
`.claude/state/alerts-baseline.json`. Subsequent runs compute deltas
automatically. The baseline resets daily.

### cleanup-alert-sessions.js

Deletes session decision logs older than 7 days.

```bash
npm run alerts:cleanup
```

## Integration

At session start, Claude should:

1. Run `/alerts` (limited mode) automatically
2. Walk through the interactive Phase 2-7 workflow
3. Help fix issues before starting planned work
4. After fixes, offer to re-run to verify improvements
