---
name: alerts
description: |
  Intelligent health dashboard with scoring, benchmarks, trends, and session
  planning. Triggers: "alerts", "check alerts", "what needs attention", "system
  health", "show warnings", "pending issues". Default mode (--limited) checks 8
  categories. Use --full for comprehensive reporting with all 18 categories.
---

# Alerts — Intelligent Health Dashboard

## Overview

This skill provides an intelligent health dashboard that goes beyond raw data.
It computes health scores, rates metrics against benchmarks, shows trends via
sparklines, groups related items, and builds prioritized session plans.

**Output is v2 JSON** with `{alerts:[], context:{}}` per category, health
scores, benchmarks, trends, and session plans. Claude renders this as a rich
visual dashboard with progress bars, sparklines, and interactive drill-downs.

## Usage

```
/alerts           # Limited mode (default) - quick health check (8 categories)
/alerts --full    # Full mode - comprehensive reporting (18 categories)
```

## Workflow

### Step 1: Run the Script

```bash
node .claude/skills/alerts/scripts/run-alerts.js --limited   # or --full
```

The script outputs v2 JSON to stdout and progress to stderr.

### Step 2: Parse the v2 JSON

Parse the JSON output. Key fields:

- `healthScore` — `{grade, score, breakdown}` with letter grade and 0-100 score
- `categories` — Each has `{alerts:[], context:{}}` with benchmarks, ratings,
  trends, groups
- `sessionPlan` — Prioritized action list (all errors + top warnings, ~5 items)
- `delta` — (optional) Changes since first run today:
  `{scoreBefore, scoreAfter, scoreDelta, categoryChanges}`
- `summary` — `{errors, warnings, info}` counts

### Step 3: Present the Health Dashboard

Use this exact visual template. Replace values from the parsed JSON.

**CRITICAL:** Use Unicode box-drawing characters, progress bars (`████░░░░`),
sparklines (`▁▂▃▄▅▆▇█`), and emoji badges exactly as shown. This is a VISUAL
dashboard, not a text dump.

#### Main Dashboard Template

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   🏥 PROJECT HEALTH REPORT                                      ║
║                                                                  ║
║        {grade}    {score} / 100                                  ║
║   {progress_bar}  {score}%                                       ║
║                                                                  ║
║   🔴 {errors} errors  ·  🟡 {warnings} warnings  ·  🔵 {info} info  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

Progress bar: Use `█` for filled and `░` for empty. Scale to ~45 chars wide.
Example for 68%: `████████████████████████████████░░░░░░░░░░░░░░░`

If `delta` exists in the JSON (re-run), add to the header:

```
║        {grade}    {score} / 100    ↑ from {gradeBefore} ({scoreBefore})  ║
```

#### Category Scorecard

Build from `healthScore.breakdown`. Map category keys to display names and
icons:

| Key              | Icon | Display Name |
| ---------------- | ---- | ------------ |
| code             | 💻   | Code Health  |
| security         | 🛡️   | Security     |
| debt-metrics     | 📋   | Debt         |
| test-results     | 🧪   | Tests        |
| learning         | 📚   | Learning     |
| velocity         | 🎯   | Velocity     |
| review-quality   | 🔍   | Reviews      |
| agent-compliance | 🤖   | Agents       |
| docs             | 📝   | Docs         |

```
┌──────────────┬───────┬────────────┬───────────┬─────────────────┐
│ Category     │ Score │ Rating     │ Trend     │ Spark           │
├──────────────┼───────┼────────────┼───────────┼─────────────────┤
│ 🛡️ Security  │  100  │ 🟢 Good    │ → Stable  │ ▁▁▁▁▁           │
│ 🧪 Tests     │   85  │ 🟡 Average │ → Stable  │ ▃▃▅▅▅           │
│ 📚 Learning  │   80  │ 🟢 Good    │ ↗ Rising  │ ▂▃▃▅▅           │
│ 💻 Code      │   70  │ 🟡 Average │ ↑ Better  │ ▇▆▅▃▃           │
│ 📋 Debt      │   40  │ 🔴 Poor    │ ↓ Growing │ ▁▂▃▅▇           │
└──────────────┴───────┴────────────┴───────────┴─────────────────┘
```

Rating mapping from score: 90+ = 🟢 Good, 70+ = 🟡 Average, <70 = 🔴 Poor.

Trend: Look at `context.trend.direction` if available. Map:

- `stable` → `→ Stable`
- `increasing` → `↑ Rising` (for metrics where higher is bad like debt, use
  `↓ Growing`)
- `decreasing` → `↓ Falling` (for metrics where lower is bad, use `↑ Improving`)

Sparkline: Use `context.sparklines.*` or `context.trend.values` with sparkline
chars `▁▂▃▄▅▆▇█`.

#### Errors Section

```
🔴 ERRORS — must fix before shipping ──────────────────────────────

  ❶  {icon} {category} │ {message}
     ├── {details or group summary}
     ├── Top: {topItem.id} {topItem.file} ({topItem.effort})
     └── 💡 {contextual suggestion based on data}
     → {action}
```

Number errors with ❶❷❸❹❺. Include:

- Group summary from `context.groups` if available
- Top items from `context.topItems` if available
- A `💡` suggestion line with contextual advice (e.g., "These are mostly E0
  quick-fixes")

#### Warnings Section

```
🟡 WARNINGS — should address this session ─────────────────────────

  ❸  {icon} {category} │ {message}
     ├── {breakdown or distribution}
     ├── 💡 {suggestion}
     └── Consider: {alternative action}
     → {action}
```

Continue numbering from errors. Include:

- Distribution data from `context.groups` (e.g., "code-quality 69% ·
  documentation 26%")
- Suggestions with effort estimates where possible
- Alternative approaches (e.g., "Consider: Run /sonarcloud-sprint for batch
  cleanup")

#### Info Section

```
🔵 INFO — awareness only ──────────────────────────────────────────

  •  {icon} {category}: {concise one-liner}
```

Keep info items to single lines. Pull key numbers from `context.totals`.

#### Session Plan

```
📋 SUGGESTED SESSION PLAN ─────────────────────────────────────────

  ① {action} ({item count}, {effort hint})
     Impact: {before_emoji}→{after_emoji} Would raise {category} score from {before} → ~{after}
  ② {action}
     Impact: {description}
  ③ Continue with planned work from SESSION_CONTEXT.md

  Estimated grade after ①②③: {current_grade} ({current_score}) → {projected_grade} ({projected_score})
```

Build from `sessionPlan[]`. For each item:

- Use ①②③④⑤ circled numbers
- Estimate score impact: each error fixed = +30 to category, each warning = +10
- Show projected grade improvement

#### Delta Section (re-run only)

If `delta` exists in the JSON:

```
✅ FIXED THIS SESSION ─────────────────────────────────────────────

  ✓ {metric}: {before} → {after} ({change})    {icon} {category} {scoreBefore} → {scoreAfter} (+{delta})
  ✓ {metric}: {before} → {after}               {icon} {category} {scoreBefore} → {scoreAfter} (+{delta})

  Session impact: {summary of severity changes}
```

#### Interactive Options

Always end with options:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  a) 🔧 Start fixing {top error category} items
  b) 🔧 Fix {second priority}
  c) 🔍 Drill into a category for full details
  d) 📊 Run /alerts --full for all 18 categories
```

Adapt options based on what was found. If no errors, lead with top warnings. If
in full mode, replace option d) with another relevant action.

### Step 4: Category Drill-Down

When user asks to drill into a category, present the full context card:

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│  {icon} {CATEGORY NAME}                                          │
│                                                                   │
│     Score: {score}/100  {rating_emoji} {rating_label}            │
│     {progress_bar}  {score}%                                      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### Benchmarks Table

```
📊 BENCHMARKS vs ACTUAL
┌───────────────────┬──────────┬──────────┬──────────┬────────────┐
│ Metric            │ Actual   │ Rating   │ Target   │ Gap        │
├───────────────────┼──────────┼──────────┼──────────┼────────────┤
│ {metric_name}     │ {value}  │ {emoji}  │ {target} │ {gap}      │
└───────────────────┴──────────┴──────────┴──────────┴────────────┘
```

Build from `context.benchmarks` and `context.ratings`. Gap = target - actual.
Rating emoji: good = 🟢, average = 🟡, poor = 🔴.

#### Trends

```
📈 TRENDS (last 5 snapshots)
  {metric}: {value1} → {value2} → ... → {valueN}
            {sparkline_bar}  {direction} {delta}% {emoji}
            💡 {contextual interpretation}
```

Use sparkline chars for visual trend. Add 💡 interpretation:

- Growing debt: "Growth rate is accelerating — consider a cleanup sprint"
- Improving S0: "Good trajectory — S0 approaching zero"
- Stable tests: "Consistent pass rate — good stability"

#### Top Items (if available)

```
🔴 TOP {SEVERITY} ITEMS
┌──────────────┬─────────────────────────┬──────────────────────────┬────────┐
│ ID           │ Issue                   │ Location                 │ Effort │
├──────────────┼─────────────────────────┼──────────────────────────┼────────┤
│ {id}         │ {title}                 │ {file}                   │ {eff}  │
└──────────────┴─────────────────────────┴──────────────────────────┴────────┘
```

#### Groups (if available)

Use proportional bar charts:

```
📦 BY {GROUP_FIELD}
  {name}  {bar}  {count}  ({percent}%)
          💡 {suggestion for this group}
```

Bar: Scale largest group to ~35 chars of `█`, others proportionally. Add 💡
per-group suggestion:

- code-quality: "Largest bucket — /sonarcloud-sprint can batch-fix"
- E0 items: "Start here — each takes <5 min"

#### Drill-Down Options

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  a) 🔧 Fix the {count} {severity} items (grouped by type)
  b) 📊 Show {other_severity} breakdown
  c) 🏃 Run {relevant sprint/cleanup command}
  d) ← Back to dashboard
```

### Step 5: Post-Fix Flow

After the user fixes issues:

1. Offer to re-run `/alerts` to verify improvements
2. On re-run, the script auto-computes delta from baseline
3. Show the delta section highlighting what improved
4. Update session plan with remaining items
5. If all errors cleared, congratulate and suggest moving to planned work

## Modes

### Limited Mode (Default) — 8 Categories

Quick health check:

1. **Code Health** — TS errors, ESLint, patterns, circular deps
2. **Security** — npm audit, secrets, security patterns
3. **Session Context** — Cross-session warnings
4. **Debt Health** — S0/S1 counts, trends, grouping, resolution rate
5. **Learning Health** — Failing patterns, effectiveness, automation
6. **Agent Compliance** — Required agents vs actual invocations
7. **Hook Warnings** — Deduplicated warnings, age tracking
8. **Test Results** — Pass/fail/error counts, staleness

### Full Mode (--full) — 18 Categories

Everything in Limited plus: 9. **Current Alerts** — Deferred PR items 10.
**Documentation Health** — CANON, cross-doc deps, staleness 11.
**Roadmap/Planning** — Blocked/overdue items 12. **Review Quality** — PR rounds,
fix ratios 13. **Consolidation** — Reviews pending, suggested rules 14.
**Velocity** — Items/session, acceleration detection 15. **Session Activity** —
Files, commits, skills last session 16. **Commit Activity** — 24h commits,
attribution, last commit age 17. **Roadmap Validation** —
`npm run roadmap:validate` 18. **Hook Health** — Registration status, session
completion rate

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

| Category    | Weight |
| ----------- | ------ |
| Code Health | 20%    |
| Security    | 20%    |
| Debt        | 15%    |
| Tests       | 15%    |
| Learning    | 10%    |
| Velocity    | 5%     |
| Reviews     | 5%     |
| Agents      | 5%     |
| Docs        | 5%     |

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
      "code": { "score": 70, "weight": 0.20 },
      "security": { "score": 100, "weight": 0.20 }
    }
  },
  "categories": {
    "debt-metrics": {
      "alerts": [
        { "severity": "error", "message": "...", "details": "...", "action": "..." }
      ],
      "context": {
        "benchmarks": { ... },
        "ratings": { ... },
        "trend": { "open": { "direction": "increasing", "values": [...], "delta": 5, "deltaPercent": 3 } },
        "sparklines": { "open": "▁▂▃▅▇" },
        "groups": { "by_category": [...], "by_effort": [...] },
        "topItems": { "s0": [...] },
        "totals": { "total": 2190, "open": 1786, "resolved": 162, "s0": 9, "s1": 363, "resRate": 7 },
        "by_severity": { "S0": 27, "S1": 388, "S2": 968, "S3": 807 }
      }
    }
  },
  "summary": { "errors": 2, "warnings": 4, "info": 3 },
  "sessionPlan": [
    {
      "priority": 1,
      "category": "debt-metrics",
      "action": "Fix S0 critical items",
      "message": "9 S0 items...",
      "impact": "high"
    }
  ],
  "delta": {
    "scoreBefore": 68,
    "gradeBefore": "C",
    "scoreAfter": 72,
    "gradeAfter": "C",
    "scoreDelta": 4,
    "categoryChanges": { ... }
  }
}
```

## Scripts

### scripts/run-alerts.js

Main script. Outputs v2 JSON to stdout, progress to stderr.

```bash
node .claude/skills/alerts/scripts/run-alerts.js --limited
node .claude/skills/alerts/scripts/run-alerts.js --full
```

Exit code 1 if any error-level alerts, 0 otherwise.

**Delta tracking:** First run per day saves a baseline to
`.claude/state/alerts-baseline.json`. Subsequent runs compute deltas
automatically. The baseline resets daily.

## Integration

At session start, Claude should:

1. Run `/alerts` (limited mode) automatically
2. Present the visual dashboard (Step 3 above)
3. Offer interactive options including drill-down and fixes
4. Help fix top issues before starting planned work
5. After fixes, offer to re-run to verify improvements
