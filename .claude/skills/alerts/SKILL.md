---
name: alerts
description: |
  System health and alerts reporting skill. This skill should be used at session
  start to surface pending alerts, or anytime the user wants to check system health.
  Triggers: "alerts", "check alerts", "what needs attention", "system health",
  "show warnings", "pending issues". Default mode (--limited) checks 8 categories:
  Code Health, Security, Session Context, Debt Health, Learning Health, Agent
  Compliance, Hook Warnings, and Test Results. Use --full for comprehensive
  reporting with all 18 categories.
---

# Alerts

## Overview

This skill provides comprehensive system health reporting by aggregating alerts
from 18 data sources across the project. It surfaces issues that would otherwise
be hidden in collapsed hook output or scattered across multiple files.

**This is NOT a data dump.** Claude should triage, prioritize, and offer to help
fix the most important items — making the experience interactive and actionable.

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

### Step 2: Parse and Triage

Parse the JSON output. Separate alerts into three priority tiers:

1. **Errors** (severity: "error") — Must fix before merging/shipping
2. **Warnings** (severity: "warning") — Should address this session
3. **Info** (severity: "info") — Awareness only, no action needed

### Step 3: Present Interactively

Present a **concise summary** first, then offer to drill down:

```
## System Health Summary

**8 categories checked** (limited mode)

🔴 2 errors — TypeScript failures, S0 debt items
🟡 4 warnings — ESLint, failing patterns, agent compliance, hook warnings
ℹ️ 3 info items — debt summary, test results, automation coverage

### Errors (must fix)
1. [Code] 5 TypeScript errors → Run: npx tsc --noEmit
2. [Debt] 9 S0 critical debt items → Run /task-next or fix directly

### Warnings (should address)
3. [Code] 12 ESLint warnings → Run: npm run lint
4. [Learning] 15 patterns failing → Automate top 3: Regex anchoring, Safe percentage, Windows atomic rename
5. [Agent] 2 code files changed without code-reviewer → Run /code-reviewer
6. [Hooks] Oldest warning is 5 days old → Review .claude/hook-warnings.json

Would you like me to:
  a) Fix the TypeScript errors now
  b) Run the code-reviewer agent
  c) Show full details for any category
  d) Run /alerts --full for comprehensive check
```

### Step 4: Act on User Choice

- If user picks an action, execute it immediately
- After fixing, offer to re-run `/alerts` to verify the fix
- If all errors/warnings are clear, congratulate and move to planned work

### Step 5: Session Planning (optional)

After presenting alerts, suggest a session plan based on what was found:

```
Based on the alerts, here's a suggested session plan:
1. Fix 5 TypeScript errors (est. 10 min)
2. Run code-reviewer for recent changes
3. Then continue with [user's planned work from SESSION_CONTEXT.md]
```

## Modes

### Limited Mode (Default) — 8 Categories

Quick health check covering the most critical categories:

1. **Code Health** — Test failures, TypeScript errors, ESLint, pattern
   violations, circular deps
2. **Security** — npm audit vulnerabilities, security patterns, secrets status
3. **Session Context** — Cross-session warnings, pending TODOs
4. **Debt Health** — S0/S1 counts, debt trend, resolution rate
5. **Learning Health** — Failing patterns, learning effectiveness, automation
   coverage
6. **Agent Compliance** — Required agents (code-reviewer, security-auditor) vs
   actual invocations from agent-invocations.jsonl
7. **Hook Warnings** — Deduplicated pre-commit/pre-push warnings, age tracking
8. **Test Results** — Latest test run pass/fail/error counts, staleness

### Full Mode (--full) — 18 Categories

Everything in Limited plus 10 more:

9. **Current Alerts** — Deferred PR items, Backlog S0/S1/S2, encrypted secrets
10. **Documentation Health** — CANON violations, cross-doc deps, stale
    SESSION_CONTEXT
11. **Roadmap/Planning** — Overdue items, blocked tasks
12. **Review Quality** — PR round counts, fix ratios, churn detection
13. **Consolidation Status** — Reviews since last consolidation, pending
    suggested rules
14. **Velocity** — Items resolved per session, zero-velocity streaks
15. **Session Activity** — Files modified, commits, skills invoked last session
16. **Commit Activity** — 24h commit count, unattributed commits, last commit
    age
17. **Roadmap Validation** — `npm run roadmap:validate` errors and warnings
18. **Hook Health** — Hook registration status, session completion rate

## Alert Categories

### 1. Code Health (Limited)

| Check              | Command/Source           | Severity |
| ------------------ | ------------------------ | -------- |
| Test failures      | `npm test`               | Error    |
| TypeScript errors  | `npm run type-check`     | Error    |
| ESLint warnings    | `npm run lint`           | Warning  |
| Pattern violations | `npm run patterns:check` | Warning  |
| Circular deps      | `npm run deps:circular`  | Warning  |

### 2. Security (Limited)

| Check                   | Command/Source           | Severity |
| ----------------------- | ------------------------ | -------- |
| npm audit high/critical | `npm audit --json`       | Error    |
| Security patterns       | `npm run security:check` | Warning  |
| Encrypted secrets       | `.env.local.encrypted`   | Warning  |

### 3. Session Context (Limited)

| Check                 | Source                              | Severity |
| --------------------- | ----------------------------------- | -------- |
| Cross-session warning | `.claude/hooks/.session-state.json` | Warning  |

### 4. Debt Health (Limited)

| Check            | Source                                       | Severity |
| ---------------- | -------------------------------------------- | -------- |
| S0 critical debt | `docs/technical-debt/metrics.json`           | Error    |
| S1 high debt     | `docs/technical-debt/metrics.json`           | Warning  |
| Debt trend       | `docs/technical-debt/logs/metrics-log.jsonl` | Warning  |
| Summary          | `docs/technical-debt/metrics.json`           | Info     |

### 5. Learning Health (Limited)

| Check                  | Source                     | Severity |
| ---------------------- | -------------------------- | -------- |
| Failing patterns       | `docs/LEARNING_METRICS.md` | Warning  |
| Learning effectiveness | `docs/LEARNING_METRICS.md` | Warning  |
| Automation coverage    | `docs/LEARNING_METRICS.md` | Info     |

### 6. Agent Compliance (Limited)

| Check                        | Source                                                                                             | Severity |
| ---------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| Code changes w/o reviewer    | `.claude/state/agent-invocations.jsonl` (primary), `.claude/hooks/.session-agents.json` (fallback) | Warning  |
| Security changes w/o auditor | Same as above                                                                                      | Warning  |

### 7. Hook Warnings (Limited)

| Check                  | Source                       | Severity |
| ---------------------- | ---------------------------- | -------- |
| Error-level warnings   | `.claude/hook-warnings.json` | Error    |
| Warning-level warnings | `.claude/hook-warnings.json` | Warning  |
| Stale warnings (>3d)   | `.claude/hook-warnings.json` | Warning  |

### 8. Test Results (Limited)

| Check               | Source                         | Severity |
| ------------------- | ------------------------------ | -------- |
| Failing tests       | `.claude/test-results/*.jsonl` | Error    |
| Errored tests       | `.claude/test-results/*.jsonl` | Warning  |
| Stale results (>7d) | `.claude/test-results/*.jsonl` | Warning  |
| Summary             | `.claude/test-results/*.jsonl` | Info     |

### 9. Current Alerts (Full)

| Check             | Source                            | Severity |
| ----------------- | --------------------------------- | -------- |
| Deferred PR items | `docs/AI_REVIEW_LEARNINGS_LOG.md` | Warning  |
| Backlog S0 items  | `docs/technical-debt/INDEX.md`    | Error    |
| Backlog S1 items  | `docs/technical-debt/INDEX.md`    | Warning  |

### 10. Documentation Health (Full)

| Check                 | Command/Source           | Severity |
| --------------------- | ------------------------ | -------- |
| CANON violations      | `npm run validate:canon` | Warning  |
| Cross-doc violations  | `npm run crossdoc:check` | Warning  |
| Stale SESSION_CONTEXT | File modification date   | Warning  |

### 11. Roadmap/Planning (Full)

| Check                 | Source                       | Severity |
| --------------------- | ---------------------------- | -------- |
| Overdue roadmap items | `ROADMAP.md` dates           | Warning  |
| Blocked tasks         | `ROADMAP.md` blocked markers | Warning  |

### 12. Review Quality (Full)

| Check          | Source                               | Severity |
| -------------- | ------------------------------------ | -------- |
| High-churn PRs | `.claude/state/review-metrics.jsonl` | Warning  |
| Fix ratio      | `.claude/state/review-metrics.jsonl` | Warning  |

### 13. Consolidation Status (Full)

| Check                       | Source                                    | Severity |
| --------------------------- | ----------------------------------------- | -------- |
| Reviews since consolidation | `docs/AI_REVIEW_LEARNINGS_LOG.md`         | Warning  |
| Suggested rules pending     | `consolidation-output/suggested-rules.md` | Info     |

### 14. Velocity (Full)

| Check                | Source                             | Severity |
| -------------------- | ---------------------------------- | -------- |
| Avg items/session    | `.claude/state/velocity-log.jsonl` | Info     |
| Zero-velocity streak | `.claude/state/velocity-log.jsonl` | Info     |

### 15. Session Activity (Full)

| Check               | Source                           | Severity |
| ------------------- | -------------------------------- | -------- |
| Last session stats  | `.claude/session-activity.jsonl` | Info     |
| Missing session-end | `.claude/session-activity.jsonl` | Info     |

### 16. Commit Activity (Full)

| Check                 | Source                           | Severity |
| --------------------- | -------------------------------- | -------- |
| 24h commit count      | `.claude/state/commit-log.jsonl` | Info     |
| Unattributed commits  | `.claude/state/commit-log.jsonl` | Info     |
| Last commit age (>4h) | `.claude/state/commit-log.jsonl` | Info     |

### 17. Roadmap Validation (Full)

| Check               | Command/Source             | Severity |
| ------------------- | -------------------------- | -------- |
| Validation errors   | `npm run roadmap:validate` | Error    |
| Validation warnings | `npm run roadmap:validate` | Warning  |

### 18. Hook Health (Full)

| Check                    | Command/Source         | Severity |
| ------------------------ | ---------------------- | -------- |
| Hook registration status | `npm run hooks:health` | Info     |
| Session completion rate  | `npm run hooks:health` | Info     |
| Hook errors              | `npm run hooks:health` | Warning  |

## Output Format

The script outputs JSON to stdout with this structure:

```json
{
  "mode": "limited",
  "timestamp": "2026-02-12T...",
  "categories": {
    "code": [{ "severity": "error", "message": "...", "details": null, "action": "..." }],
    "security": [...],
    ...
  },
  "summary": { "errors": 2, "warnings": 4, "info": 3 }
}
```

**Presentation rules:**

1. Always show the **summary counts** first (errors/warnings/info)
2. Group by severity: Errors first, then Warnings, then Info
3. Each actionable item MUST include a `->` action line
4. Keep info items to a single line each — don't over-explain
5. Offer numbered choices for what to fix next
6. After fixing something, offer to re-run alerts to verify

## Scripts

### scripts/run-alerts.js

Main script that runs all checks and outputs JSON results. Usage:

```bash
node .claude/skills/alerts/scripts/run-alerts.js --limited
node .claude/skills/alerts/scripts/run-alerts.js --full
```

Progress messages go to stderr. JSON results go to stdout. Exit code 1 if any
error-level alerts exist, 0 otherwise.

## Integration

This skill integrates with the Session Start Protocol in `claude.md`. At session
start, Claude should:

1. Run `/alerts` (limited mode) automatically
2. Present the interactive summary (Step 3 above)
3. Offer to run `/alerts --full` for comprehensive check
4. Help fix top issues before starting planned work
