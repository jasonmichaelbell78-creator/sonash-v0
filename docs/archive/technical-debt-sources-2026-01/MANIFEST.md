# Technical Debt Sources Archive Manifest

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Archived Date:** 2026-02-01 **Session:** #123 **Phase:** TDMS Phase 13

---

## Purpose

This archive contains the original source documents that were consolidated into
the Technical Debt Management System (TDMS). These files are preserved for
historical reference and audit trails.

**Canonical Location:** `docs/technical-debt/MASTER_DEBT.jsonl`

---

## What Was Archived

### 1. Aggregation Directory (`aggregation/`)

Former location: `docs/aggregation/`

| File                         | Items | Description                         |
| ---------------------------- | ----- | ----------------------------------- |
| MASTER_ISSUE_LIST.jsonl      | 284   | Aggregated issues from all sources  |
| net-new-findings.jsonl       | 171   | Net-new findings for roadmap        |
| normalized-findings.jsonl    | -     | Normalized format of findings       |
| unique-findings.jsonl        | -     | Deduplicated findings               |
| IMPLEMENTATION_PLAN.md       | -     | Original aggregation implementation |
| NET_NEW_ROADMAP_PLACEMENT.md | -     | Roadmap placement recommendations   |

### 2. Analysis Directory (`analysis/`)

Former location: `docs/analysis/`

| File                                  | Description              |
| ------------------------------------- | ------------------------ |
| sonarqube-all-issues-complete.json    | Full SonarCloud export   |
| sonarqube-issues.json                 | Filtered issues          |
| sonarqube-issues-by-file.json         | Issues grouped by file   |
| sonarqube-maintainability-issues.json | Maintainability category |
| sonarqube-reliability-issues.json     | Reliability category     |
| sonarqube-security-hotspots.json      | Security hotspots        |

### 3. Reviews Directory (`reviews-2026-Q1/`)

Former location: `docs/reviews/2026-Q1/`

Contains canonical review files from Q1 2026 code reviews, including:

- CANON-\* JSONL files (118 items)
- DEDUPED_FINDINGS.jsonl (15 items)
- Tier processing outputs

### 4. Audits Directory (`audits/`)

Former location: `docs/audits/` (partial)

| Subdirectory/File                   | Description                        |
| ----------------------------------- | ---------------------------------- |
| `canonical/`                        | Old canonical findings (203 items) |
| `comprehensive/`                    | Comprehensive audit structure      |
| `multi-ai/`                         | Multi-AI performance audit (28)    |
| `sonarcloud-snapshots/`             | SonarCloud point-in-time snapshots |
| `FALSE_POSITIVES.jsonl`             | Dismissed findings                 |
| `sonarcloud-dismissals.md`          | Dismissal documentation            |
| `sonarcloud-fixes.md`               | Fix documentation                  |
| `ENGINEERING_PRODUCTIVITY_AUDIT...` | Productivity audit results         |

**Note:** `docs/audits/single-session/` was NOT archived - it remains active for
new single-session audits.

### 5. Legacy Documents (`legacy-docs/`)

Former location: `docs/`

| File                        | Superseded By                           |
| --------------------------- | --------------------------------------- |
| AUDIT_FINDINGS_PROCEDURE.md | `docs/technical-debt/PROCEDURE.md`      |
| SONARCLOUD_TRIAGE.md        | `sync-sonarcloud-debt` skill + TDMS     |
| TECHNICAL_DEBT_MASTER.md    | `docs/technical-debt/MASTER_DEBT.jsonl` |

---

## Why Archived

These documents were archived because:

1. **Consolidation Complete**: All findings have been extracted, deduplicated,
   and ingested into `MASTER_DEBT.jsonl`

2. **Single Source of Truth**: TDMS now serves as the canonical location for all
   technical debt tracking

3. **Reduced Confusion**: Multiple sources led to inconsistent tracking and
   duplicate entries

4. **Verified Ingestion**: TDMS Phases 1-9b verified all data was successfully
   migrated

---

## What Remains Active

| Location                      | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| `docs/technical-debt/`        | TDMS canonical location                 |
| `docs/audits/single-session/` | New single-session audit outputs        |
| `docs/AUDIT_TRACKER.md`       | Audit trigger thresholds (not archived) |

---

## Recovery Instructions

If you need to reference original data:

```bash
# View original aggregation data
cat docs/archive/technical-debt-sources-2026-01/aggregation/MASTER_ISSUE_LIST.jsonl

# View original SonarCloud export
cat docs/archive/technical-debt-sources-2026-01/analysis/sonarqube-all-issues-complete.json

# View original canonical findings
cat docs/archive/technical-debt-sources-2026-01/audits/canonical/MASTER_FINDINGS.jsonl
```

**Note:** Do NOT modify archived files. If data needs correction, update
`MASTER_DEBT.jsonl` instead.

---

## Related Documents

- [TDMS PROCEDURE.md](../../technical-debt/PROCEDURE.md)
- [TDMS Implementation Plan](../../plans/TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md)
- [PHASE_13_AUDIT.md](../../technical-debt/PHASE_13_AUDIT.md)
