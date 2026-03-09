<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-08
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Hook Ecosystem Audit — Reference

Reference material for the hook ecosystem audit skill. Contains templates,
schemas, category definitions, benchmarks, and development guides.

> **Staleness warning:** The Hook System Architecture diagram and Data Sources
> table are static snapshots. Verify against `.claude/settings.json` before
> referencing.

---

## Progress State Schema

Path: `.claude/tmp/hook-audit-progress.json`

```json
{
  "auditTimestamp": "ISO timestamp of audit run",
  "score": 85,
  "grade": "B",
  "totalFindings": 142,
  "currentFindingIndex": 8,
  "decisions": [
    {
      "findingIndex": 1,
      "category": "behavioral_accuracy",
      "message": "description of finding",
      "decision": "fix|defer|skip|acknowledge|delegated-accept",
      "note": "optional context"
    }
  ],
  "fixesApplied": ["description of fix applied"],
  "findingsData": []
}
```

---

## Session Decision Log Schema

Path: `.claude/tmp/hook-audit-session-{YYYY-MM-DD-HHMM}.jsonl`

Each line:

```json
{
  "findingIndex": 1,
  "category": "behavioral_accuracy",
  "severity": "error",
  "message": "description",
  "decision": "fix|defer|skip|acknowledge",
  "note": "optional context",
  "timestamp": "ISO timestamp"
}
```

---

## Trend History Schema

Path: `.claude/state/hook-ecosystem-audit-history.jsonl`

Each line (one per audit run, written automatically by the audit script):

```json
{
  "timestamp": "ISO timestamp",
  "score": 91,
  "grade": "A",
  "domainScores": { "config_health": 92, "...": "..." },
  "findingCounts": { "errors": 1, "warnings": 7, "info": 2 },
  "process_feedback": "optional retro feedback from user"
}
```

---

## Dashboard Template

```
Hook Ecosystem Health: {grade} ({score}/100)  |  Trend: {sparkline} ({delta})
{errors} errors · {warnings} warnings · {info} info  |  {patches} patch suggestions

┌─────────────────────────────────┬───────┬──────────┬──────────────┐
│ Category                        │ Score │ Rating   │ Trend        │
├─────────────────────────────────┼───────┼──────────┼──────────────┤
│ D1: Hook Configuration Health   │       │          │              │
│   Settings-File Alignment       │  {s}  │ {rating} │ {trend}      │
│   Event Coverage & Matchers     │  {s}  │ {rating} │ {trend}      │
│   Global-Local Consistency      │  {s}  │ {rating} │ {trend}      │
├─────────────────────────────────┼───────┼──────────┼──────────────┤
│ D2: Code Quality & Security     │       │          │              │
│   Error Handling & Sanitization │  {s}  │ {rating} │ {trend}      │
│   Security Patterns             │  {s}  │ {rating} │ {trend}      │
│   Code Hygiene                  │  {s}  │ {rating} │ {trend}      │
│   Regex Safety                  │  {s}  │ {rating} │ {trend}      │
├─────────────────────────────────┼───────┼──────────┼──────────────┤
│ D3: Pre-commit Pipeline         │       │          │              │
│   Stage Ordering & Completeness │  {s}  │ {rating} │ {trend}      │
│   Bypass & Override Controls    │  {s}  │ {rating} │ {trend}      │
│   Gate Effectiveness            │  {s}  │ {rating} │ {trend}      │
├─────────────────────────────────┼───────┼──────────┼──────────────┤
│ D4: Functional Correctness      │       │          │              │
│   Test Coverage                 │  {s}  │ {rating} │ {trend}      │
│   Output Protocol Compliance    │  {s}  │ {rating} │ {trend}      │
│   Behavioral Accuracy           │  {s}  │ {rating} │ {trend}      │
├─────────────────────────────────┼───────┼──────────┼──────────────┤
│ D5: State & Integration         │       │          │              │
│   State File Health             │  {s}  │ {rating} │ {trend}      │
│   Cross-Hook Dependencies       │  {s}  │ {rating} │ {trend}      │
│   Compaction Resilience         │  {s}  │ {rating} │ {trend}      │
├─────────────────────────────────┼───────┼──────────┼──────────────┤
│ D6: CI/CD Pipeline Health       │       │          │              │
│   Workflow↔Script Alignment     │  {s}  │ {rating} │ {trend}      │
│   Bot Configuration Freshness   │  {s}  │ {rating} │ {trend}      │
│   CI Cache Effectiveness        │  {s}  │ {rating} │ {trend}      │
└─────────────────────────────────┴───────┴──────────┴──────────────┘
```

Rating badges: good = "Good", average = "Avg", poor = "Poor"

---

## Summary Template

```
━━━ Audit Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Composite: {grade} ({score}/100)  |  {trend}

Decisions:
  Fixed:      {count} findings
  Deferred:   {count} findings → {count} DEBT entries created
  Skipped:    {count} findings

Patches Applied: {count}/{total patchable}

TDMS Entries Created:
  {list each DEBT entry with severity and source_id}

Top 3 Impact Areas:
  1. {category} — {brief description}
  2. {category} — {brief description}
  3. {category} — {brief description}

Next Steps:
  - {actionable recommendation based on worst categories}
  - {actionable recommendation}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Verification Template

```
━━━ Verification Re-run ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before: {previous_grade} ({previous_score}/100)
After:  {new_grade} ({new_score}/100)
Delta:  {+/-delta} points

Improved Categories:
  {category}: {before} → {after} (+{delta})

Remaining Issues:
  {count} findings still open (deferred/skipped)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Trend Report Template

```
━━━ Trend Report ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Composite Trend: {sparkline}  {direction} ({delta})

Improving:
  {category}: {before} → {after} (+{delta})

Declining:
  {category}: {before} → {after} ({delta})

Stable:
  {category}: {score} (no change)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Category Reference

### Domain 1: Hook Configuration Health (18% weight)

| Category                  | What It Checks                                                  |
| ------------------------- | --------------------------------------------------------------- |
| Settings-File Alignment   | Every settings.json hook entry has a matching .js file and v.v. |
| Event Coverage & Matchers | All event types have handlers, matchers are valid regex         |
| Global-Local Consistency  | Global hooks don't conflict with project hooks                  |

### Domain 2: Code Quality & Security (23% weight)

| Category                      | What It Checks                                                 |
| ----------------------------- | -------------------------------------------------------------- |
| Error Handling & Sanitization | try/catch coverage, sanitize-error.js usage, graceful failures |
| Security Patterns             | Symlink guard, path traversal checks, input validation         |
| Code Hygiene                  | Dead code, unused imports, TODO/FIXME markers                  |
| Regex Safety                  | S5852 compliance, /g flag on exec() loops, complexity          |

### Domain 3: Pre-commit Pipeline (18% weight)

| Category                      | What It Checks                                         |
| ----------------------------- | ------------------------------------------------------ |
| Stage Ordering & Completeness | All 11+ stages present, correct order, parallel safety |
| Bypass & Override Controls    | SKIP_CHECKS inventory, SKIP_REASON validation          |
| Gate Effectiveness            | Blocking gates reachable, non-blocking use warnings    |

### Domain 4: Functional Correctness (18% weight)

| Category                   | What It Checks                                                |
| -------------------------- | ------------------------------------------------------------- |
| Test Coverage              | test-hooks.js coverage vs total hooks, gap identification     |
| Output Protocol Compliance | "ok"/block/warn output format, exit codes correct             |
| Behavioral Accuracy        | Blocking hooks block, warnings warn, matchers match correctly |

### Domain 5: State & Integration (13% weight)

| Category                | What It Checks                                          |
| ----------------------- | ------------------------------------------------------- |
| State File Health       | JSONL validity, rotation working, size managed          |
| Cross-Hook Dependencies | Write-before-read ordering, no circular deps            |
| Compaction Resilience   | Layer A-D coverage, pre-compaction save, recovery chain |

### Domain 6: CI/CD Pipeline Health (10% weight)

| Category                    | What It Checks                                                       |
| --------------------------- | -------------------------------------------------------------------- |
| Workflow↔Script Alignment   | GitHub Actions `run:` steps reference valid npm scripts/commands     |
| Bot Configuration Freshness | Qodo, Gemini review bot configs exist and reference current patterns |
| CI Cache Effectiveness      | Cache keys reference current lock files, no stale patterns           |

---

## Benchmarks

Internal benchmarks are defined in `scripts/lib/benchmarks.js`. Each category
scores 0-100 with ratings: good (90+), average (70-89), poor (<70). The
composite grade uses weighted average across all 19 categories with domain
weights: D1=18%, D2=23%, D3=18%, D4=18%, D5=13%, D6=10%.

---

## Checker Development Guide

### Adding a New Category

1. Choose the appropriate domain checker in `scripts/checkers/`
2. Add a new check function following the pattern of existing categories
3. Add benchmarks to `scripts/lib/benchmarks.js`
4. Add weight to `CATEGORY_WEIGHTS` in benchmarks.js (adjust existing weights)
5. Add labels to the orchestrator's `CATEGORY_LABELS` and `CATEGORY_DOMAIN_MAP`
6. Test: `node scripts/run-hook-ecosystem-audit.js --summary`

### Data Sources

| Source              | Path                        | Content                       |
| ------------------- | --------------------------- | ----------------------------- |
| Hook settings       | `.claude/settings.json`     | Hook registrations & matchers |
| Hook source code    | `.claude/hooks/*.js`        | 18 hook implementations       |
| Hook libraries      | `.claude/hooks/lib/*.js`    | 6 shared utilities            |
| Global hooks        | `.claude/hooks/global/*.js` | 2 global hooks                |
| Pre-commit pipeline | `.husky/pre-commit`         | 11+ stage POSIX sh script     |
| Hook test suite     | `scripts/test-hooks.js`     | Hook functional tests         |
| State files         | `.claude/state/*.jsonl`     | Hook state and logs           |

### Hook System Architecture

```
settings.json (hook registry)
  ├── SessionStart
  │   ├── session-start.js
  │   ├── check-mcp-servers.js
  │   ├── check-remote-session-context.js
  │   ├── stop-serena-dashboard.js
  │   ├── global/gsd-check-update.js
  │   └── compact-restore.js (matcher: "compact")
  ├── PreCompact
  │   └── pre-compaction-save.js
  ├── PostToolUse
  │   ├── post-write-validator.js (matcher: write/edit/multiedit)
  │   ├── post-read-handler.js (matcher: read)
  │   ├── decision-save-prompt.js (matcher: askuserquestion)
  │   ├── commit-tracker.js (matcher: bash)
  │   ├── commit-failure-reporter.js (matcher: bash)
  │   └── track-agent-invocation.js (matcher: task)
  ├── UserPromptSubmit
  │   ├── user-prompt-handler.js
  │   ├── analyze-user-request.js
  │   ├── plan-mode-suggestion.js
  │   └── session-end-reminder.js
  └── Notification
      └── global/statusline.js
```
