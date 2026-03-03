---
name: hook-ecosystem-audit
description: |
  Comprehensive diagnostic of the Claude hooks ecosystem — 19 categories
  across 6 domains with composite health scoring, trend tracking, patch suggestions,
  and interactive finding-by-finding walkthrough. Covers hook configuration, code
  quality, pre-commit pipeline, functional correctness, state integration, and
  CI/CD pipeline health.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Hook Ecosystem Audit

Deep diagnostic of the Claude hooks ecosystem — configuration files, hook
scripts (`.claude/hooks/`), pre-commit pipeline, functional correctness,
state integration, and CI/CD pipeline health. Produces per-category scores,
a composite health grade (A-F), trend tracking across runs, and an interactive
walkthrough with patch suggestions.

**Invocation:** `/hook-ecosystem-audit`

**When to use:** When you want to understand the overall health of the hooks
pipeline, identify configuration mismatches, detect hook registration errors,
or audit pre-commit stage coverage. Complementary with `/session-ecosystem-audit`
(that skill audits session lifecycle; this skill audits the hook scripts themselves).

---

## When to Use

- Tasks related to hook-ecosystem-audit
- User explicitly invokes `/hook-ecosystem-audit`
- Diagnosing hook failures, configuration drift, or pre-commit issues

## When NOT to Use

- When the task doesn't match this skill's scope — check related skills
- When a more specialized skill exists for the specific task

## CRITICAL RULES (Read First)

1. **CHECK for saved progress first** — resume from
   `.claude/tmp/hook-audit-progress.json` if it exists and is < 2 hours old.
   Never re-present findings that were already decided.
2. **ALWAYS run the script first** (if no saved progress) — never generate
   findings without data
3. **ALWAYS display the dashboard to the user** before starting the walkthrough
4. **Present findings one at a time** using AskUserQuestion for decisions
5. **SAVE progress after every decision** — write updated state to progress file
   immediately
6. **Show patch suggestions inline** with each patchable finding
7. **Create DEBT entries** for deferred findings via `/add-debt`
8. **Save decisions** to session log for audit trail

---

## Compaction Guard

Audits are long-running interactive workflows vulnerable to context compaction.
To survive compaction, save progress after every decision and check for existing
progress on startup.

### State File

Path: `.claude/tmp/hook-audit-progress.json`

Schema:

```json
{
  "auditTimestamp": "ISO timestamp of audit run",
  "score": 85,
  "grade": "B",
  "totalFindings": 42,
  "currentFindingIndex": 8,
  "decisions": [
    {
      "findingIndex": 1,
      "category": "config_health",
      "message": "finding description",
      "decision": "skip",
      "note": "reason"
    }
  ],
  "fixesApplied": ["description of fix"],
  "findingsData": []
}
```

### On Skill Start (Before Phase 1)

1. Check if `.claude/tmp/hook-audit-progress.json` exists and is < 2 hours old
2. If yes: **resume from saved position**
   - Display the dashboard from saved data (skip re-running the audit script)
   - Show: "Resuming audit from finding {n}/{total} ({n-1} already reviewed)"
   - List prior decisions briefly: "{n} fixed, {n} skipped, {n} deferred"
   - Continue the walkthrough from `currentFindingIndex`
3. If no (or stale): proceed to Phase 1 normally

### After Each Decision (During Phase 3)

After each AskUserQuestion response, immediately save progress:

1. Update `currentFindingIndex` to the next finding
2. Append the decision to the `decisions` array
3. If "Fix Now" was chosen, append to `fixesApplied`
4. Write the updated JSON to `.claude/tmp/hook-audit-progress.json`

### On Audit Completion (Phase 4)

After the summary is presented, delete the progress file (audit is complete).

---

## Phase 1: Run & Parse

1. Run the audit script:

```bash
node .claude/skills/hook-ecosystem-audit/scripts/run-hook-ecosystem-audit.js
```

2. Parse the v2 JSON output from stdout (progress goes to stderr).

3. Create a session decision log file:
   - Path: `.claude/tmp/hook-audit-session-{YYYY-MM-DD-HHMM}.jsonl`
   - Create `.claude/tmp/` directory if it doesn't exist

4. Save initial progress state to `.claude/tmp/hook-audit-progress.json` with
   `currentFindingIndex: 0`, the full findings data, score, and grade.

---

## Phase 2: Dashboard Overview (compact)

Present a compact header with composite grade and domain breakdown:

```
Hook Ecosystem Health: {grade} ({score}/100)  |  Trend: {sparkline} ({delta})
{errors} errors · {warnings} warnings · {info} info  |  {patches} patch suggestions

┌──────────────────────────────────┬───────┬──────────┬──────────────┐
│ Category                         │ Score │ Rating   │ Trend        │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D1: Configuration Health         │       │          │              │
│   Settings File Alignment        │  {s}  │ {rating} │ {trend}      │
│   Event Coverage                 │  {s}  │ {rating} │ {trend}      │
│   Global/Local Consistency       │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D2: Code Quality & Security      │       │          │              │
│   Output Protocol Compliance     │  {s}  │ {rating} │ {trend}      │
│   Input Validation               │  {s}  │ {rating} │ {trend}      │
│   Error Handling                 │  {s}  │ {rating} │ {trend}      │
│   Sensitive Data Handling        │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D3: Pre-commit Pipeline          │       │          │              │
│   Stage Coverage                 │  {s}  │ {rating} │ {trend}      │
│   Stage Ordering                 │  {s}  │ {rating} │ {trend}      │
│   Exit Code Handling             │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D4: Functional Correctness       │       │          │              │
│   Hook Registration              │  {s}  │ {rating} │ {trend}      │
│   Event Handler Coverage         │  {s}  │ {rating} │ {trend}      │
│   Timeout Compliance             │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D5: State Integration            │       │          │              │
│   Compaction Resilience          │  {s}  │ {rating} │ {trend}      │
│   Cross-Hook Dependencies        │  {s}  │ {rating} │ {trend}      │
│   State File Health              │  {s}  │ {rating} │ {trend}      │
│   Symlink Guard Coverage         │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D6: CI/CD Pipeline               │       │          │              │
│   CI Configuration Health        │  {s}  │ {rating} │ {trend}      │
│   Bot Config Freshness           │  {s}  │ {rating} │ {trend}      │
└──────────────────────────────────┴───────┴──────────┴──────────────┘
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

## Category Reference

### Domain 1: Configuration Health (18% weight)

| Category                 | What It Checks                                               |
| ------------------------ | ------------------------------------------------------------ |
| Settings File Alignment  | hooks registered in settings.json actually exist on disk     |
| Event Coverage           | All standard Claude events have at least one hook registered |
| Global/Local Consistency | global and local settings.json don't contradict each other   |

### Domain 2: Code Quality & Security (23% weight)

| Category                   | What It Checks                                                |
| -------------------------- | ------------------------------------------------------------- |
| Output Protocol Compliance | hooks output valid JSON or plain text as required by protocol |
| Input Validation           | hooks validate required input fields before use               |
| Error Handling             | hooks wrap risky operations in try/catch                      |
| Sensitive Data Handling    | hooks don't log tokens, secrets, or credentials               |

### Domain 3: Pre-commit Pipeline (18% weight)

| Category           | What It Checks                                       |
| ------------------ | ---------------------------------------------------- |
| Stage Coverage     | pre-commit hook runs linting, tests, and type-checks |
| Stage Ordering     | stages run in correct dependency order               |
| Exit Code Handling | failures in any stage correctly abort the commit     |

### Domain 4: Functional Correctness (18% weight)

| Category               | What It Checks                                                    |
| ---------------------- | ----------------------------------------------------------------- |
| Hook Registration      | all hooks in hooks/ directory are registered in settings.json     |
| Event Handler Coverage | hooks handle all expected event types for their registered events |
| Timeout Compliance     | long-running hooks respect timeout requirements                   |

### Domain 5: State Integration (13% weight)

| Category                | What It Checks                                                    |
| ----------------------- | ----------------------------------------------------------------- |
| Compaction Resilience   | hooks save and restore state around context compaction events     |
| Cross-Hook Dependencies | hook dependencies are well-defined and don't create circular deps |
| State File Health       | state files use atomic writes with symlink guards                 |
| Symlink Guard Coverage  | all file writes are protected by isSafeToWrite() checks           |

### Domain 6: CI/CD Pipeline (10% weight)

| Category                | What It Checks                                                       |
| ----------------------- | -------------------------------------------------------------------- |
| CI Configuration Health | CI workflow files are valid and cover required checks                |
| Bot Config Freshness    | bot configuration files (code review, dependency update) are current |

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

---

## Version History

| Version | Date       | Description              |
| ------- | ---------- | ------------------------ |
| 1.0     | 2026-03-01 | Ported to framework repo |
