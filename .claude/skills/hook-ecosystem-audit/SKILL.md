---
name: hook-ecosystem-audit
description: |
  Comprehensive diagnostic of the hook ecosystem — 16 categories across 5
  domains with composite health scoring, trend tracking, patch suggestions, and
  interactive finding-by-finding walkthrough. Covers Claude Code hooks AND
  pre-commit pipeline.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-23
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Hook Ecosystem Audit

Deep diagnostic of the entire hook ecosystem — Claude Code hooks
(`.claude/hooks/`), shared libraries, pre-commit pipeline (`.husky/pre-commit`),
and state management. Produces per-category scores, a composite health grade
(A-F), trend tracking across runs, and an interactive walkthrough with patch
suggestions.

**Invocation:** `/hook-ecosystem-audit`

**When to use:** When you want to understand the overall health of the hook
system, identify configuration drift, security gaps, or pipeline issues.
Complementary with `/pr-ecosystem-audit` (PR audit owns workflow state; hook
audit owns hook internals).

---

## CRITICAL RULES (Read First)

1. **ALWAYS run the script first** — never generate findings without data
2. **ALWAYS display the dashboard to the user** before starting the walkthrough
3. **Present findings one at a time** using AskUserQuestion for decisions
4. **Show patch suggestions inline** with each patchable finding
5. **Create TDMS entries** for deferred findings via `/add-debt`
6. **Save decisions** to session log for audit trail

---

## Phase 1: Run & Parse

1. Run the hook test suite first to get live pass/fail data:

```bash
npm run hooks:test
```

2. Run the audit script:

```bash
node .claude/skills/hook-ecosystem-audit/scripts/run-hook-ecosystem-audit.js
```

3. Parse the v2 JSON output from stdout (progress goes to stderr).

4. Create a session decision log file:
   - Path: `.claude/tmp/hook-audit-session-{YYYY-MM-DD-HHMM}.jsonl`
   - Create `.claude/tmp/` directory if it doesn't exist

---

## Phase 2: Dashboard Overview (compact)

Present a compact header with composite grade and domain breakdown:

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
└─────────────────────────────────┴───────┴──────────┴──────────────┘
```

Rating badges: good = "Good", average = "Avg", poor = "Poor"

Then say: **"Found N findings to review. Walking through each one
(impact-weighted)..."**

---

## Phase 3: Finding-by-Finding Walkthrough

Sort all findings by `impactScore` descending (highest impact first).

For each finding, present a context card:

```
━━━ Finding {n}/{total} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{SEVERITY}  |  {domainLabel}: {categoryLabel}  |  Impact: {impactScore}/100

{message}

Evidence:
  {details}
```

If the finding has `patchable: true`, also show:

```
Patch Available:
  Target: {patch.target}
  Action: {patch.description}
  Preview:
    {patch.preview or patch.content}
```

Then use `AskUserQuestion` with options based on severity:

**ERROR findings:**

- Fix Now — execute the fix/patch immediately
- Defer — add to deferred list, create DEBT entry
- Suppress — suppress this finding type permanently

**WARNING findings:**

- Fix Now
- Defer
- Skip — acknowledge but don't track

**INFO findings:**

- Acknowledge
- Defer for later

### Handling Decisions

**Fix Now:**

1. If patch is available, apply it (edit file, run command, etc.)
2. If no patch, provide guidance for manual fix
3. Log decision to session file

**Defer:**

1. Create DEBT entry via `/add-debt` with:
   - severity: S1 (errors) or S2 (warnings)
   - category: engineering-productivity
   - source_id: "review:hook-ecosystem-audit-{date}"
2. Log decision to session file

**Suppress:**

1. Add to suppression list (not yet implemented — log for future)
2. Log decision to session file

---

## Phase 4: Summary & Actions

After all findings are reviewed, present the summary:

```
━━━ Audit Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Composite: {grade} ({score}/100)  |  {trend}

Decisions:
  Fixed:      {count} findings
  Deferred:   {count} findings → {count} DEBT entries created
  Skipped:    {count} findings
  Suppressed: {count} findings

Patches Applied: {count}/{total patchable}

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

## Phase 5: Trend Report (if previous runs exist)

If the state file has previous entries, show improvement/regression:

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

## Phase 6: Self-Audit (Verification)

After all findings are reviewed and fixes committed, re-run the audit to verify
improvements:

1. Run the hook test suite again:

```bash
npm run hooks:test
```

2. Re-run the audit script:

```bash
node .claude/skills/hook-ecosystem-audit/scripts/run-hook-ecosystem-audit.js
```

3. Compare the new score against the Phase 2 score:

```
━━━ Self-Audit Verification ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before: {previous_grade} ({previous_score}/100)
After:  {new_grade} ({new_score}/100)
Delta:  {+/-delta} points

Improved Categories:
  {category}: {before} → {after} (+{delta})

Remaining Issues:
  {count} findings still open (deferred/skipped)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

4. If the score improved, commit the audit state for trend tracking.
5. If the score did not improve, investigate why — fixes may have introduced new
   findings.

---

## Category Reference

### Domain 1: Hook Configuration Health (20% weight)

| Category                  | What It Checks                                                  |
| ------------------------- | --------------------------------------------------------------- |
| Settings-File Alignment   | Every settings.json hook entry has a matching .js file and v.v. |
| Event Coverage & Matchers | All event types have handlers, matchers are valid regex         |
| Global-Local Consistency  | Global hooks don't conflict with project hooks                  |

### Domain 2: Code Quality & Security (25% weight)

| Category                      | What It Checks                                                 |
| ----------------------------- | -------------------------------------------------------------- |
| Error Handling & Sanitization | try/catch coverage, sanitize-error.js usage, graceful failures |
| Security Patterns             | Symlink guard, path traversal checks, input validation         |
| Code Hygiene                  | Dead code, unused imports, TODO/FIXME markers                  |
| Regex Safety                  | S5852 compliance, /g flag on exec() loops, complexity          |

### Domain 3: Pre-commit Pipeline (20% weight)

| Category                      | What It Checks                                         |
| ----------------------------- | ------------------------------------------------------ |
| Stage Ordering & Completeness | All 11+ stages present, correct order, parallel safety |
| Bypass & Override Controls    | SKIP_CHECKS inventory, SKIP_REASON validation          |
| Gate Effectiveness            | Blocking gates reachable, non-blocking use warnings    |

### Domain 4: Functional Correctness (20% weight)

| Category                   | What It Checks                                                |
| -------------------------- | ------------------------------------------------------------- |
| Test Coverage              | test-hooks.js coverage vs total hooks, gap identification     |
| Output Protocol Compliance | "ok"/block/warn output format, exit codes correct             |
| Behavioral Accuracy        | Blocking hooks block, warnings warn, matchers match correctly |

### Domain 5: State & Integration (15% weight)

| Category                | What It Checks                                          |
| ----------------------- | ------------------------------------------------------- |
| State File Health       | JSONL validity, rotation working, size managed          |
| Cross-Hook Dependencies | Write-before-read ordering, no circular deps            |
| Compaction Resilience   | Layer A-D coverage, pre-compaction save, recovery chain |

---

## Benchmarks

Internal benchmarks are defined in `scripts/lib/benchmarks.js`. Each category
scores 0-100 with ratings: good (90+), average (70-89), poor (<70). The
composite grade uses weighted average across all 16 categories with domain
weights: D1=20%, D2=25%, D3=20%, D4=20%, D5=15%.

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

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-23 | Initial implementation |
