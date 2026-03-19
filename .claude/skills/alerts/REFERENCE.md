<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-19
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Alerts Reference

Detailed workflows, schemas, benchmarks, and reference data for the `/alerts`
skill. Read by the skill caller when executing Phases 1-7.

---

## Phase 1: Run & Parse (Detail)

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

## Phase 3: Alert-by-Alert Loop (Detail)

### Context Card Format

```
[ERROR/WARNING/INFO] Category: {category}
  Message: {message}
  Details: {details}
  Trend: {trend} {sparkline}
  Benchmark: {benchmark_value} (Rating: {rating})
  Suggested: {recommendation}

  Action? (f) Fix now  (d) Defer  (i) Ignore  (s) Suppress
```

### Decision Semantics

| Decision    | Scope             | Persistence              | Effect                               |
| ----------- | ----------------- | ------------------------ | ------------------------------------ |
| Fix Now     | Immediate         | Permanent                | Execute fix, remove from future runs |
| Defer       | This session      | Re-presents next session | Log, suggest `/add-debt`             |
| Ignore      | This session only | Re-presents next session | Hide for now                         |
| Suppress    | Permanent         | Across all sessions      | Reason required (15+ chars)          |
| Acknowledge | INFO only         | Logged                   | Mark as read                         |

### Recommendation Logic

- ERROR -> recommend Fix Now
- WARNING + declining trend -> recommend Fix Now
- WARNING + stable/null trend -> recommend Defer
- INFO -> recommend Acknowledge

If trend is null or missing, treat as "stable" for recommendation purposes.

### Example Walkthrough

**Scenario:** 3 alerts (1 error, 1 warning, 1 info)

```
Phase 2 Dashboard:
  Health: D (72/100, 85% measured) | 1 error / 1 warning / 1 info

  | Category    | Score | Rating  | Alerts   | Trend     |
  | Code        | 60    | Poor    | 1 error  | stable    |
  | Hook Health | 72    | Average | 1 warning| declining |
  | Session     | 85    | Good    | 1 info   | stable    |

  Found 3 alerts. Walking through each one...

---

Phase 3 Alert-by-Alert:

  Alert 1 of 3 (0 fixed, 0 deferred, 0 ignored)
  [ERROR] Code Health: 1 TypeScript error(s)
    Details: src/app.ts:42 — Type 'unknown' not assignable...
    Trend: Stable | Benchmark: 0 errors (Poor)
    Suggested: Fix Now

  Action? (f) Fix now  (d) Defer  (s) Suppress
  -> f
  Decision logged: fix_now

  Alert 2 of 3 (1 fixed, 0 deferred, 0 ignored)
  [WARNING] Hook Health: 12 propagation failures (7d)
    Details: statSync-without-lstat in 3 files
    Trend: Declining | Benchmark: <5 warnings (Poor)
    Suggested: Fix Now

  Action? (f) Fix now  (d) Defer  (i) Ignore  (s) Suppress
  -> d
  Decision logged: defer

  Alert 3 of 3 (1 fixed, 1 deferred, 0 ignored)
  [INFO] Session State: Previous session incomplete
    Trend: Stable | Benchmark: N/A
    Suggested: Acknowledge

  Action? (a) Acknowledge  (i) Ignore  (s) Suppress
  -> a
  Decision logged: acknowledge

---

Phase 4 Review:
  Fixed: 1 | Deferred: 1 | Acknowledged: 1
  Revise any? [Y/n]
  -> n

---

Phase 7 Closure:
  Alert review complete.
  Health: D(72) -> C(78). Fixed: 1 | Deferred: 1 | Acknowledged: 1
  Session log: .claude/tmp/alert-session-2026-03-19-0130.jsonl
```

---

## File Schemas

### Session JSONL

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

### Suppression File

File: `.claude/state/alert-suppressions.json`

```json
{
  "version": 1,
  "suppressions": [
    {
      "id": "string",
      "category": "string",
      "messagePattern": "string (case-insensitive substring match)",
      "reason": "string (MUST — 15+ chars, specific)",
      "suppressedAt": "ISO-8601",
      "expiresAt": "ISO-8601 | null (null = permanent)"
    }
  ]
}
```

### Alerts History

File: `.claude/state/alerts-history.jsonl`

Written by skill caller after Phase 7. Consumed by Phase 2 dashboard for
cross-session trends and Phase 1 warm-up for learning recall.

```json
{
  "timestamp": "ISO-8601",
  "mode": "limited | full",
  "healthScore": {
    "grade": "A | B | C | D | F",
    "score": "number (0-100)",
    "measuredPct": "number (0-100)"
  },
  "categoryScores": { "code": 60, "security": 85 },
  "decisionCounts": {
    "fixed": 0,
    "deferred": 0,
    "ignored": 0,
    "suppressed": 0
  },
  "learnings": ["insight 1", "insight 2"],
  "feedback": "string | null"
}
```

### Alerts Acknowledged

File: `.claude/alerts-acknowledged.json`

Written by Phase 7. Consumed by session-begin to check if alerts already
processed this session.

```json
{
  "timestamp": "ISO-8601",
  "sessionLogPath": "string",
  "totalAlerts": 0,
  "decisionCounts": {
    "fixed": 0,
    "deferred": 0,
    "ignored": 0,
    "suppressed": 0,
    "delegatedAccept": 0
  }
}
```

### Health Score Log (script-managed)

File: `.claude/state/health-score-log.jsonl`

Written by run-alerts.js after each run. Score-only history; does NOT include
learnings or feedback (those go in alerts-history.jsonl).

```json
{
  "timestamp": "ISO-8601",
  "mode": "limited | full",
  "grade": "A | B | C | D | F",
  "score": "number",
  "summary": { "errors": 0, "warnings": 0, "info": 0 },
  "categoryScores": { "code": 60, "security": 85 }
}
```

### Delta Field (in script output)

Added to v2 JSON when baseline exists for current day:

```json
{
  "delta": {
    "healthScore": { "before": 72, "after": 78, "change": 6 },
    "categories": {
      "code": { "before": 60, "after": 75, "change": 15 }
    }
  }
}
```

---

## Suppression System

File: `.claude/state/alert-suppressions.json`. Match by category +
case-insensitive substring on message. Expired suppressions skipped. Filtered
after checkers run, before score computation. Reason field MUST be present in
every record and shown during Phase 6 stale review.

---

## Modes

**Limited (18 categories):** Code Health, Security, Session Context, Debt,
Learning, Agent Compliance, Hook Warnings, Skip Abuse, Test Results, Hook
Health, Hook Completeness, Session State, Pattern Hotspots, Context Usage,
Reviews Sync, Review Archive Health, Cross-Document Dependencies, Velocity
Regression.

**Full (+24 categories):** Debt Intake/Resolution, Doc Health, Roadmap Planning,
Review Quality, Consolidation, Velocity, Session/Commit Activity, Roadmap
Validation/Hygiene, Trigger Compliance, Pattern Sync, Doc Placement, External
Links, Unused Deps, Review Churn, Backlog, GitHub Actions, SonarCloud, Stale
Planning Data, Deferred Items Staleness, Commit Patterns, Enforcement
Verification, Pending Refinements.

---

## Benchmarks

All ratings: Good / Average / Poor. Poor -> error alert, Average -> warning,
Good -> no alert (unless other conditions).

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

---

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

---

## Hook Data Drill-Down (SHOULD — opt-in)

When dashboard shows hook-related alerts (skip-abuse, hook-health, or
hook-warning-trends), offer drill-down:

```
Hook alerts detected. Drill down into hook data? [Y/n]
```

**If yes**, read and summarize:

1. **Override log** (`.claude/state/override-log.jsonl`): Top 3 most-overridden
   checks (7d), total count, trend vs previous week
2. **Hook warnings log** (`.claude/state/hook-warnings-log.jsonl`): Top 3
   warning types (7d), auto-escalation status, any with 15+ occurrences
3. **Health score log** (`.claude/state/health-score-log.jsonl`): Last 3 grades
   with timestamps, categories scoring below 70

**Output format:**

```
Hook Drill-Down (7d):
  Overrides: 18 total (cognitive-complexity: 12, propagation: 4, security: 2)
    Trend: +125% vs prev week
  Warnings: 8 total (propagation: 5, pattern-compliance: 2, canon: 1)
    Auto-escalated: propagation (5+ occurrences -> warning)
  Health: F(59) <- C(76) <- B(80) -- declining
    Below 70: code(60), security(70), debt-metrics(60), hook-health(50)
```

---

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

---

## Learning Loop

### Auto-Learnings (MUST)

Generate 2-3 deterministic insights after each run:

- **Top regressing checker:** highest alert count increase week-over-week
- **Most common alert type:** category+severity combo with highest count this
  session
- **Recurring blind spot:** checker returning `no_data` in 2+ consecutive runs

Save to `.claude/state/alerts-history.jsonl` as `learnings` field.

### User Feedback (SHOULD)

After Phase 6 self-audit: "Any observations about checker quality or false
positives?" Accept multi-line or "none". Save as `feedback` field in
alerts-history entry.

### Recall (MUST)

On next startup: read last 3 entries from alerts-history.jsonl. Surface
auto-learnings and user feedback: "Previous insights: [category] was declining,
[category] had blind spots."

---

## Test Health Category (D#21, D#46)

Shows data from the most recent `/health-ecosystem-audit` run:

- **Last audit score:** Composite grade and numeric score (e.g., "B+ (82)")
- **Test pass rate:** From most recent live test execution
- **Unresolved findings:** Count of ERROR/WARNING findings not yet fixed

Data source: `.claude/state/health-ecosystem-audit-history.jsonl` (most recent
entry). If missing or stale >1 day, note `[stale]` in dashboard. If missing
entirely, omit this category.
