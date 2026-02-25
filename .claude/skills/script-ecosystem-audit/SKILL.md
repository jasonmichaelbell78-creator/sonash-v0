---
name: script-ecosystem-audit
description: |
  Comprehensive diagnostic of the script infrastructure — 18 categories across
  5 domains with composite health scoring, trend tracking, patch suggestions, and
  interactive finding-by-finding walkthrough. Covers 300+ scripts for module
  consistency, safety patterns, reachability, code quality, and testing.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Script Ecosystem Audit

Deep diagnostic of the entire script infrastructure — `scripts/` directory tree,
shared libraries (`scripts/lib/`), npm script registrations (`package.json`),
and cross-script dependencies. Produces per-category scores, a composite health
grade (A-F), trend tracking across runs, and an interactive walkthrough with
patch suggestions.

**Invocation:** `/script-ecosystem-audit`

**When to use:** When you want to understand the overall health of the script
infrastructure, identify module system inconsistencies, safety gaps, unreachable
scripts, code quality issues, or testing gaps. Complementary with
`/hook-ecosystem-audit` (hook audit owns hook internals; script audit owns
`scripts/` infrastructure).

---

## When to Use

- |
- User explicitly invokes `/script-ecosystem-audit`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## CRITICAL RULES (Read First)

1. **CHECK for saved progress first** — resume from
   `.claude/tmp/script-audit-progress.json` if it exists and is < 2 hours old.
   Never re-present findings that were already decided.
2. **ALWAYS run the script first** (if no saved progress) — never generate
   findings without data
3. **ALWAYS display the dashboard to the user** before starting the walkthrough
4. **Present findings one at a time** using AskUserQuestion for decisions
5. **SAVE progress after every decision** — write updated state to progress file
   immediately
6. **Show patch suggestions inline** with each patchable finding
7. **Create TDMS entries** for deferred findings via `/add-debt`
8. **Save decisions** to session log for audit trail

---

## Compaction Guard

Audits are long-running interactive workflows vulnerable to context compaction.
To survive compaction, save progress after every decision and check for existing
progress on startup.

### State File

Path: `.claude/tmp/script-audit-progress.json`

Schema:

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
      "category": "file_io_safety",
      "message": "File I/O call without try/catch in generate-views.js",
      "decision": "skip",
      "note": "Already wrapped in outer handler"
    }
  ],
  "fixesApplied": ["added try/catch to sync-sonarcloud.js"],
  "findingsData": []
}
```

### On Skill Start (Before Phase 1)

1. Check if `.claude/tmp/script-audit-progress.json` exists and is < 2 hours old
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
4. Write the updated JSON to `.claude/tmp/script-audit-progress.json`

This ensures that if compaction occurs mid-walkthrough, the next invocation
resumes exactly where it left off — no repeated questions, no lost decisions.

### On Audit Completion (Phase 4)

After the summary is presented, delete the progress file (audit is complete).

---

## Phase 1: Run & Parse

1. Run the audit script:

```bash
node .claude/skills/script-ecosystem-audit/scripts/run-script-ecosystem-audit.js
```

2. Parse the v2 JSON output from stdout (progress goes to stderr).

3. Create a session decision log file:
   - Path: `.claude/tmp/script-audit-session-{YYYY-MM-DD-HHMM}.jsonl`
   - Create `.claude/tmp/` directory if it doesn't exist

4. Save initial progress state to `.claude/tmp/script-audit-progress.json` with
   `currentFindingIndex: 0`, the full findings data, score, and grade.

---

## Phase 2: Dashboard Overview (compact)

Present a compact header with composite grade and domain breakdown:

```
Script Ecosystem Health: {grade} ({score}/100)  |  Trend: {sparkline} ({delta})
{errors} errors · {warnings} warnings · {info} info  |  {patches} patch suggestions

┌──────────────────────────────────┬───────┬──────────┬──────────────┐
│ Category                         │ Score │ Rating   │ Trend        │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D1: Module System & Consistency  │       │          │              │
│   CJS/ESM Consistency            │  {s}  │ {rating} │ {trend}      │
│   Shebang & Entry Points         │  {s}  │ {rating} │ {trend}      │
│   Node.js API Compatibility      │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D2: Safety & Error Handling      │       │          │              │
│   File I/O Safety                │  {s}  │ {rating} │ {trend}      │
│   Error Sanitization             │  {s}  │ {rating} │ {trend}      │
│   Path Traversal Guards          │  {s}  │ {rating} │ {trend}      │
│   Exec Safety                    │  {s}  │ {rating} │ {trend}      │
│   Security Helper Usage          │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D3: Registration & Reachability  │       │          │              │
│   Package.json Coverage          │  {s}  │ {rating} │ {trend}      │
│   Cross-Script Dependencies      │  {s}  │ {rating} │ {trend}      │
│   Shared Lib Utilization         │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D4: Code Quality                 │       │          │              │
│   Documentation Headers          │  {s}  │ {rating} │ {trend}      │
│   Consistent Patterns            │  {s}  │ {rating} │ {trend}      │
│   Dead Code                      │  {s}  │ {rating} │ {trend}      │
│   Complexity                     │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D5: Testing & Reliability        │       │          │              │
│   Test Coverage                  │  {s}  │ {rating} │ {trend}      │
│   Test Freshness                 │  {s}  │ {rating} │ {trend}      │
│   Error Path Testing             │  {s}  │ {rating} │ {trend}      │
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
   - source_id: "review:script-ecosystem-audit-{date}"
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

1. Re-run the audit script:

```bash
node .claude/skills/script-ecosystem-audit/scripts/run-script-ecosystem-audit.js
```

2. Compare the new score against the Phase 2 score:

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

3. If the score improved, commit the audit state for trend tracking.
4. If the score did not improve, investigate why — fixes may have introduced new
   findings.

---

## Category Reference

### Domain 1: Module System & Consistency (20% weight)

| Category                  | What It Checks                                                        |
| ------------------------- | --------------------------------------------------------------------- |
| CJS/ESM Consistency       | Directories use consistent module system (all CJS or all ESM)         |
| Shebang & Entry Points    | npm script file refs exist, shebangs are correct                      |
| Node.js API Compatibility | No deprecated APIs (fs.exists, new Buffer, url.parse without 2nd arg) |

### Domain 2: Safety & Error Handling (25% weight)

| Category              | What It Checks                                                          |
| --------------------- | ----------------------------------------------------------------------- |
| File I/O Safety       | All fs.readFileSync/writeFileSync wrapped in try/catch                  |
| Error Sanitization    | Scripts use sanitize-error.js, don't log raw error.message              |
| Path Traversal Guards | Correct regex pattern, not startsWith('..')                             |
| Exec Safety           | All regex.exec() in loops have /g flag                                  |
| Security Helper Usage | Scripts doing file I/O, git ops, or CLI args import security-helpers.js |

### Domain 3: Registration & Reachability (20% weight)

| Category                  | What It Checks                                                    |
| ------------------------- | ----------------------------------------------------------------- |
| Package.json Coverage     | Scripts reachable via npm scripts or internal require/import      |
| Cross-Script Dependencies | All require/import references resolve to existing files           |
| Shared Lib Utilization    | Scripts use shared libs instead of reimplementing common patterns |

### Domain 4: Code Quality (20% weight)

| Category              | What It Checks                                                  |
| --------------------- | --------------------------------------------------------------- |
| Documentation Headers | JSDoc or block comment at top of each script                    |
| Consistent Patterns   | Scripts in same directory follow similar structure              |
| Dead Code             | Exported functions are actually imported elsewhere              |
| Complexity            | Scripts under 300 lines or have adequate function decomposition |

### Domain 5: Testing & Reliability (15% weight)

| Category           | What It Checks                                                         |
| ------------------ | ---------------------------------------------------------------------- |
| Test Coverage      | Each script has a corresponding .test.js file                          |
| Test Freshness     | Tests updated within 30 days of source changes                         |
| Error Path Testing | Test files include error scenario coverage (toThrow, rejects, mocking) |

---

## Benchmarks

Internal benchmarks are defined in `scripts/lib/benchmarks.js`. Each category
scores 0-100 with ratings: good (90+), average (70-89), poor (<70). The
composite grade uses weighted average across all 18 categories with domain
weights: D1=20%, D2=25%, D3=20%, D4=20%, D5=15%.

---

## Checker Development Guide

### Adding a New Category

1. Choose the appropriate domain checker in `scripts/checkers/`
2. Add a new check function following the pattern of existing categories
3. Add benchmarks to `scripts/lib/benchmarks.js`
4. Add weight to `CATEGORY_WEIGHTS` in benchmarks.js (adjust existing weights)
5. Add labels to the orchestrator's `CATEGORY_LABELS` and `CATEGORY_DOMAIN_MAP`
6. Test: `node scripts/run-script-ecosystem-audit.js --summary`

### Data Sources

| Source              | Path                    | Content                           |
| ------------------- | ----------------------- | --------------------------------- |
| Script source code  | `scripts/**/*.js`       | 300+ script implementations       |
| Shared libraries    | `scripts/lib/*.js`      | Shared utilities (sanitize, etc.) |
| Package config      | `package.json`          | npm scripts section               |
| Test files          | `scripts/**/__tests__`  | Script test suites                |
| Pre-commit pipeline | `.husky/pre-commit`     | Pre-commit stage references       |
| State files         | `.claude/state/*.jsonl` | Audit state and history           |

### Script Infrastructure Architecture

```
scripts/
  ├── lib/                    # Shared libraries
  │   ├── sanitize-error.js   # Error sanitization
  │   ├── security-helpers.js # Security utilities
  │   └── ...                 # Other shared modules
  ├── __tests__/              # Test files
  │   ├── *.test.js           # Unit/integration tests
  │   └── ...
  ├── ci/                     # CI/CD scripts
  ├── eval/                   # Evaluation pipeline
  ├── audit/                  # Audit scripts
  └── *.js                    # Top-level scripts
```

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-24 | Initial implementation |
