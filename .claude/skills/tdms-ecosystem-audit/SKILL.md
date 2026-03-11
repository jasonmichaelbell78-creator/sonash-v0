---
name: tdms-ecosystem-audit
description: |
  Comprehensive diagnostic of the Technical Debt Management System — 16 categories
  across 5 domains with composite health scoring, trend tracking, patch suggestions,
  and interactive finding-by-finding walkthrough. Covers all 37 TDMS scripts, data
  files, pipeline integrity, and reporting accuracy.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-23
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# TDMS Ecosystem Audit

Deep diagnostic of the entire Technical Debt Management System — pipeline
scripts (`scripts/debt/`), data files (`MASTER_DEBT.jsonl`,
`raw/deduped.jsonl`), views, metrics, sprint integration, and roadmap
cross-references. Produces per-category scores, a composite health grade (A-F),
trend tracking across runs, and an interactive walkthrough with patch
suggestions.

**Invocation:** `/tdms-ecosystem-audit`

**When to use:** When you want to understand the overall health of the TDMS
pipeline, identify data quality issues, sync drift between master and deduped
files, broken roadmap cross-references, or metrics accuracy problems.
Complementary with the verification queue workflow (that verifies individual
DEBT items; this skill audits the SYSTEM itself).

---

## When to Use

- Tasks related to tdms-ecosystem-audit
- User explicitly invokes `/tdms-ecosystem-audit`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## CRITICAL RULES (Read First)

1. **CHECK for saved progress first** — resume from
   `.claude/tmp/tdms-audit-progress.json` if it exists and is < 2 hours old.
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

Path: `.claude/tmp/tdms-audit-progress.json`

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
      "category": "script_execution_order",
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

1. Check if `.claude/tmp/tdms-audit-progress.json` exists and is < 2 hours old
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
4. Write the updated JSON to `.claude/tmp/tdms-audit-progress.json`

### On Audit Completion (Phase 4)

After the summary is presented, delete the progress file (audit is complete).

---

## Phase 1: Run & Parse

1. Run the audit script:

```bash
node .claude/skills/tdms-ecosystem-audit/scripts/run-tdms-ecosystem-audit.js
```

2. Parse the v2 JSON output from stdout (progress goes to stderr).

3. Create a session decision log file:
   - Path: `.claude/tmp/tdms-audit-session-{YYYY-MM-DD-HHMM}.jsonl`
   - Create `.claude/tmp/` directory if it doesn't exist

4. Save initial progress state to `.claude/tmp/tdms-audit-progress.json` with
   `currentFindingIndex: 0`, the full findings data, score, and grade.

---

## Phase 2: Dashboard Overview (compact)

Present a compact header with composite grade and domain breakdown:

```
TDMS Ecosystem Health: {grade} ({score}/100)  |  Trend: {sparkline} ({delta})
{errors} errors · {warnings} warnings · {info} info  |  {patches} patch suggestions

┌──────────────────────────────────┬───────┬──────────┬──────────────┐
│ Category                         │ Score │ Rating   │ Trend        │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D1: Pipeline Correctness         │       │          │              │
│   Script Execution Order         │  {s}  │ {rating} │ {trend}      │
│   Data Flow Integrity            │  {s}  │ {rating} │ {trend}      │
│   Intake Pipeline                │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D2: Data Quality & Deduplication │       │          │              │
│   Dedup Algorithm Health         │  {s}  │ {rating} │ {trend}      │
│   Schema Compliance              │  {s}  │ {rating} │ {trend}      │
│   Content Hash Integrity         │  {s}  │ {rating} │ {trend}      │
│   ID Uniqueness & Ref Integrity  │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D3: File I/O & Safety            │       │          │              │
│   Error Handling Coverage        │  {s}  │ {rating} │ {trend}      │
│   Master-Deduped Sync            │  {s}  │ {rating} │ {trend}      │
│   Backup & Atomicity             │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D4: Roadmap Integration          │       │          │              │
│   Track Assignment Rules         │  {s}  │ {rating} │ {trend}      │
│   ROADMAP-DEBT Cross-Reference   │  {s}  │ {rating} │ {trend}      │
│   Sprint File Alignment          │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D5: Metrics & Reporting          │       │          │              │
│   View Generation Accuracy       │  {s}  │ {rating} │ {trend}      │
│   Metrics Dashboard Correctness  │  {s}  │ {rating} │ {trend}      │
│   Audit Trail Completeness       │  {s}  │ {rating} │ {trend}      │
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
   - source_id: "review:tdms-ecosystem-audit-{date}"
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

**Process verification:** Run `__tests__/` suite to confirm audit integrity:

```bash
node --test .claude/skills/tdms-ecosystem-audit/scripts/__tests__/*.test.js
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

### Domain 1: Pipeline Correctness (20% weight)

| Category               | What It Checks                                                                    |
| ---------------------- | --------------------------------------------------------------------------------- |
| Script Execution Order | consolidate-all.js calls scripts in correct dependency order; no circular deps    |
| Data Flow Integrity    | Outputs from each stage match expected inputs of next stage                       |
| Intake Pipeline        | All 4 intake scripts produce valid format, write to BOTH master and deduped files |

### Domain 2: Data Quality & Deduplication (25% weight)

| Category                      | What It Checks                                                        |
| ----------------------------- | --------------------------------------------------------------------- |
| Dedup Algorithm Health        | 6-pass dedup accuracy, merge relationships, cluster consistency       |
| Schema Compliance             | All items conform to audit-schema.json; required fields; valid enums  |
| Content Hash Integrity        | content_hash fields match recomputed SHA256                           |
| ID Uniqueness & Ref Integrity | DEBT-XXXX IDs unique; merged_from refs valid; LEGACY_ID_MAPPING clean |

### Domain 3: File I/O & Safety (20% weight)

| Category                | What It Checks                                                                 |
| ----------------------- | ------------------------------------------------------------------------------ |
| Error Handling Coverage | All 37 scripts wrap file reads in try/catch; JSON.parse protected              |
| Master-Deduped Sync     | MASTER_DEBT.jsonl and raw/deduped.jsonl in sync (Session #134 critical bug)    |
| Backup & Atomicity      | Scripts use temp files for atomic writes; backup before destructive overwrites |

### Domain 4: Roadmap Integration (15% weight)

| Category                     | What It Checks                                                   |
| ---------------------------- | ---------------------------------------------------------------- |
| Track Assignment Rules       | roadmap_ref values use valid tracks and phases                   |
| ROADMAP-DEBT Cross-Reference | DEBT-XXXX refs in ROADMAP.md exist in MASTER_DEBT and vice versa |
| Milestone File Alignment     | Milestone assignments match item statuses; no stale refs         |

### Domain 5: Metrics & Reporting (20% weight)

| Category                      | What It Checks                                                  |
| ----------------------------- | --------------------------------------------------------------- |
| View Generation Accuracy      | Generated views match MASTER_DEBT aggregation counts            |
| Metrics Dashboard Correctness | METRICS.md numbers match computed totals and trend data         |
| Audit Trail Completeness      | intake-log, dedup-log, resolution-log have entries; valid JSONL |

---

## Benchmarks

Internal benchmarks are defined in `scripts/lib/benchmarks.js`. Each category
scores 0-100 with ratings: good (90+), average (70-89), poor (<70). The
composite grade uses weighted average across all 16 categories with domain
weights: D1=20%, D2=25%, D3=20%, D4=15%, D5=20%.

---

## Checker Development Guide

### Adding a New Category

1. Choose the appropriate domain checker in `scripts/checkers/`
2. Add a new check function following the pattern of existing categories
3. Add benchmarks to `scripts/lib/benchmarks.js`
4. Add weight to `CATEGORY_WEIGHTS` in benchmarks.js (adjust existing weights)
5. Add labels to the orchestrator's `CATEGORY_LABELS` and `CATEGORY_DOMAIN_MAP`
6. Test: `node scripts/run-tdms-ecosystem-audit.js --summary`

### Data Sources

| Source         | Path                                    | Content                                  |
| -------------- | --------------------------------------- | ---------------------------------------- |
| TDMS scripts   | `scripts/debt/*.js`                     | 37 pipeline and utility scripts          |
| Canonical data | `docs/technical-debt/MASTER_DEBT.jsonl` | 4,500+ technical debt items              |
| Deduped source | `docs/technical-debt/raw/deduped.jsonl` | Must stay in sync with master            |
| Views          | `docs/technical-debt/views/*.md`        | Generated severity/category/status views |
| Metrics        | `docs/technical-debt/METRICS.md`        | Dashboard with totals and trends         |
| Logs           | `docs/technical-debt/logs/*.jsonl`      | Intake, dedup, resolution logs           |
| Schema         | `scripts/config/audit-schema.json`      | Canonical field definitions              |
| ROADMAP        | `ROADMAP.md`                            | Milestone tracks with DEBT refs          |

### TDMS Pipeline Architecture

```
Discovery (extract-*.js)
  → Intake (intake-*.js, sync-sonarcloud.js)
    → Normalization (normalize-all.js)
      → Deduplication (dedup-multi-pass.js, 6 passes)
        → Views (generate-views.js)
          → Metrics (generate-metrics.js)

Critical invariant: MASTER_DEBT.jsonl == raw/deduped.jsonl
  (Session #134 bug: generate-views.js reads deduped, overwrites master)
```

---

## Version History

| Version | Date       | Description                                   |
| ------- | ---------- | --------------------------------------------- |
| 1.0     | 2026-02-23 | Initial implementation                        |
| 1.1     | 2026-02-24 | Add compaction guard for progress persistence |
