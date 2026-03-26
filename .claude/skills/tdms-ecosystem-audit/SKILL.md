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

> Read `.claude/skills/_shared/ecosystem-audit/CRITICAL_RULES.md` and follow all
> 8 rules. The rules below are summaries — the shared file is authoritative.

1. **CHECK for saved progress first** (MUST)
2. **ALWAYS run the script first** (MUST)
3. **ALWAYS display the dashboard** (MUST)
4. **Use conversational Q&A for decisions** (MUST) — NEVER use AskUserQuestion
5. **SAVE progress after every decision** (MUST)
6. **Show patch suggestions inline** (SHOULD)
7. **Create TDMS entries** (MUST) for deferred findings
8. **Save decisions** (MUST) to session log

---

## Compaction Guard

> Read `.claude/skills/_shared/ecosystem-audit/COMPACTION_GUARD.md` for the full
> compaction guard protocol (state file schema, resume, save, cleanup).

State file path: `.claude/tmp/tdms-audit-progress.json`

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

> Read `.claude/skills/_shared/ecosystem-audit/FINDING_WALKTHROUGH.md` for the
> full walkthrough protocol (finding card, decisions, patches, delegation,
> batching).

Sort findings by `impactScore` descending (highest impact first). DEBT entries
use source_id: `review:tdms-ecosystem-audit-{date}`.

---

## Phase 4: Summary & Actions

> Read `.claude/skills/_shared/ecosystem-audit/SUMMARY_AND_TRENDS.md` for the
> summary template, trend report template, and verification re-run template.

Write report to `.claude/tmp/tdms-audit-report-{YYYY-MM-DD}.md`.

**Process verification:** Run `__tests__/` suite:

```bash
node --test .claude/skills/tdms-ecosystem-audit/scripts/__tests__/*.test.js
```

---

## Phase 5: Trend Report (if previous runs exist)

> Uses trend report template from `SUMMARY_AND_TRENDS.md`.

History: `.claude/state/tdms-ecosystem-audit-history.jsonl`

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

## Benchmarks & Checker Development

> Read `.claude/skills/_shared/ecosystem-audit/CLOSURE_AND_GUARDRAILS.md` for
> scoring conventions and the checker development guide.

16 categories. Domain weights: D1=20%, D2=25%, D3=20%, D4=15%, D5=20%.

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

| Version | Date       | Description                                          |
| ------- | ---------- | ---------------------------------------------------- |
| 1.2     | 2026-03-25 | Extract shared patterns to \_shared/ecosystem-audit/ |
| 1.1     | 2026-02-24 | Add compaction guard for progress persistence        |
| 1.0     | 2026-02-23 | Initial implementation                               |
