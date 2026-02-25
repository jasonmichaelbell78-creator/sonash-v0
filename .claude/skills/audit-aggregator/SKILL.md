---
name: audit-aggregator
description: Aggregate and deduplicate findings from multiple audit reports
supports_parallel: false
fallback_available: false
estimated_time_parallel: 10 min
estimated_time_sequential: 10 min
---

# Audit Aggregator Agent

**Purpose:** Merge findings from 9 domain-specific audit reports into a single
comprehensive, priority-ranked report with cross-domain insights and
deduplication.

**Input:** Multiple audit report files (markdown format) **Output:**
`COMPREHENSIVE_AUDIT_REPORT.md` + `comprehensive-findings.jsonl`

---

## When to Use

- User explicitly invokes `/audit-aggregator`
- Called automatically by `audit-comprehensive` after all 9 domain audits

## When NOT to Use

- When a more specialized skill exists for the specific task

## Pre-Audit Validation

1. **Check input files** — At least 5 of 9 domain reports in
   `docs/audits/comprehensive/audit-YYYY-MM-DD/`
2. **Load false positives** — Read `docs/technical-debt/FALSE_POSITIVES.jsonl`
3. **Check prior aggregations** — Search episodic memory for previous results
4. **Verify output directory** exists

**If fewer than 5 reports:** Warn user. Proceed with Markdown only, mark as
**PARTIAL -- TDMS SKIPPED**. Do NOT generate JSONL or run Post-Audit steps.

---

## Input Requirements

**Expected Files** (9 reports in `docs/audits/comprehensive/audit-YYYY-MM-DD/`):
`audit-code-report.md`, `audit-security-report.md`,
`audit-performance-report.md`, `audit-documentation-report.md`,
`audit-refactoring-report.md`, `audit-process-report.md`,
`audit-engineering-productivity-report.md`, `audit-enhancements-report.md`,
`audit-ai-optimization-report.md`

**Required Finding Format:**
`### [ID] [Title] (Severity: S0-S3, Effort: E0-E3, Confidence: High/Medium/Low)`
with File, Category, Description, Evidence, Recommendation fields.

---

## Processing Steps

### Step 1: Parse All Reports

Extract findings into structured format. See [examples.md](examples.md) for
schema. ID format: `{DOMAIN}-{NUMBER}`. Handle missing fields with defaults: S2,
E1, Medium, "General".

### Step 2: Deduplicate Findings

Group by `(file, line)` pair. For duplicates, merge using:

- **Severity:** worst (S0 > S1 > S2 > S3)
- **Effort:** highest (E3 > E2 > E1 > E0)
- **Confidence:** highest (High > Medium > Low)
- **Title/Description:** combine unique values with domain labels
- **Category:** use `mapPrimaryCategory` — if 2+ domains, use highest-severity
  domain's category (priority: security > performance > code-quality > others)

See [examples.md](examples.md) for deduplication code and merge examples.

### Step 3: Identify Cross-Cutting Patterns

Detect: **A.** Hotspot files (3+ audits), **B.** Related findings (same file,
different concerns), **C.** Domain overlap counts, **D.** Category patterns.

### Step 4: Priority Ranking

`priority = severityWeight * crossDomainMultiplier * confidenceWeight / effortWeight`

S0 Critical always rank first. Cross-domain findings bubble up. See
[examples.md](examples.md) for formula weights and example scores.

### Step 5: Generate Executive Summary

Statistics, severity breakdown, effort estimates, 3-5 key insights, recommended
fix order (4 phases). See [examples.md](examples.md) for templates.

### Step 6: Generate Full Report

**Output:** `docs/audits/comprehensive/COMPREHENSIVE_AUDIT_REPORT.md`

Structure: Executive Summary, Priority-Ranked Top 20, Cross-Domain Insights
(hotspots, overlaps, categories), Full Findings by severity, Appendix.

Also produce JSONL: `comprehensive-findings.jsonl` with all deduplicated
findings. See [examples.md](examples.md) for schema.

---

## Category Mapping (`mapPrimaryCategory`)

| Domain                     | TDMS Category              |
| -------------------------- | -------------------------- |
| `code`                     | `code-quality`             |
| `security`                 | `security`                 |
| `performance`              | `performance`              |
| `refactoring`              | `refactoring`              |
| `documentation`            | `documentation`            |
| `process`                  | `process`                  |
| `engineering-productivity` | `engineering-productivity` |
| `enhancements`             | `enhancements`             |
| `ai-optimization`          | `ai-optimization`          |

---

## Output Validation

1. Verify dedup: unique vs raw counts, no duplicate file:line pairs
2. Verify ranking: S0 in top 20, cross-domain rank higher
3. Verify cross-cutting: hotspots have 3+ mentions
4. Verify completeness: unique + duplicates = raw total

---

## MASTER_DEBT Cross-Reference (MANDATORY)

Before presenting findings for review, cross-reference against
`docs/technical-debt/MASTER_DEBT.jsonl` by file path, title similarity, and root
cause. Classify as: **Already Tracked** (skip) | **New** (review) | **Possibly
Related** (flag). Write `DEDUP_VS_MASTER_DEBT.md`. Only pass New and Possibly
Related to Interactive Review.

---

## Interactive Review (MANDATORY)

Present **only new/possibly-related** findings in batches of 10, sorted by
severity then confidence. For each:

```
[N/TOTAL] FINGERPRINT
  Title | Severity | Effort | Confidence | Category | Domains
  Files | Description | Suggested Fix
  Action? [keep / drop / adjust-severity / adjust-effort / edit]
```

After each batch show running tally. Post-review: write drops to
`FALSE_POSITIVES.jsonl`, apply adjustments to JSONL.

---

## Post-Audit (5-Step TDMS Checklist)

1. `node scripts/debt/validate-schema.js <findings.jsonl>`
2. `node scripts/debt/intake-audit.js <findings.jsonl> --source "audit-comprehensive-YYYY-MM-DD"`
3. `node scripts/debt/generate-views.js`
4. `node scripts/debt/generate-metrics.js`
5. `node scripts/debt/sync-roadmap-refs.js`

All 5 must pass before aggregation is complete.

---

## Triage & Roadmap Integration

After TDMS intake: prioritize items in 3+ domain audits, S0/S1, or blocking
dependencies. Auto-assign tracks by category + file patterns (see
[examples.md](examples.md) for track assignment rules). Update ROADMAP.md,
validate with `node scripts/debt/sync-roadmap-refs.js --check-only`.

**Review cadence:** Full triage after comprehensive audit, category triage after
single audit, weekly check unplaced-items.md, pre-sprint review S0/S1.

---

## Error Handling

- **Missing report:** Note in report, continue with available audits
- **Parse failure:** Log, skip malformed finding, note in report
- **Empty dedup result:** Verify inputs, fall back to showing all findings

---

## Dependency Constraints

Runs sequentially after all 9 domain audit agents complete (Stage 3 of
`audit-comprehensive`). No internal parallel agents.

## Related Skills

- `audit-comprehensive` (parent orchestrator)
- `/audit-code`, `/audit-security`, `/audit-performance`, `/audit-refactoring`
- `/audit-documentation`, `/audit-process`, `/audit-engineering-productivity`
- `/audit-enhancements`, `/audit-ai-optimization`
- `/create-audit`

## Documentation References

- [PROCEDURE.md](docs/technical-debt/PROCEDURE.md) - Full TDMS workflow
- [JSONL_SCHEMA_STANDARD.md](docs/templates/JSONL_SCHEMA_STANDARD.md) - Output
  format
- [DOCUMENTATION_STANDARDS.md](docs/DOCUMENTATION_STANDARDS.md) - 5-tier
  hierarchy

---

## Version History

| Version | Date       | Description                                               |
| ------- | ---------- | --------------------------------------------------------- |
| 1.6     | 2026-02-24 | Trim to <500 lines: extract code examples to examples.md  |
| 1.5     | 2026-02-22 | Add mandatory MASTER_DEBT cross-reference step            |
| 1.4     | 2026-02-17 | Add mandatory Interactive Review phase before TDMS intake |
| 1.3     | 2026-02-16 | AUDIT_STANDARDS compliance: Pre-Audit, JSONL, Post-Audit  |
| 1.2     | 2026-02-14 | 9-domain coverage                                         |
| 1.1     | 2026-02-03 | Added Triage & Roadmap Integration section                |
| 1.0     | 2026-01-28 | Initial skill creation                                    |
