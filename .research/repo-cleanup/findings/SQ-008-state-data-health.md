# SQ-008: State & Data File Health Audit

**Audit Date:** 2026-03-23 **Scope:** .claude/state/, .claude/hooks/ state,
data/ecosystem-v2/, docs/technical-debt/

---

## Executive Summary

56 files audited. **3 critical gaps** in rotation policy. 8 bloated files
(>100KB). 2 dead files. Core data management is healthy but has accumulated
orphans and incomplete migrations.

---

## Bloated Files (>100KB)

| File                                           | Size | Lines | Status               |
| ---------------------------------------------- | ---- | ----- | -------------------- |
| docs/technical-debt/raw/normalized-all.jsonl   | 4.6M | 5,662 | ACTIVE (regenerated) |
| docs/technical-debt/raw/deduped.jsonl          | 3.4M | 3,841 | ACTIVE (regenerated) |
| docs/technical-debt/MASTER_DEBT.jsonl.bak      | 4.3M | 4,576 | ORPHAN backup        |
| docs/technical-debt/raw/audits.jsonl           | 780K | 792   | ACTIVE               |
| data/ecosystem-v2/ecosystem-health-log.jsonl   | 352K | 26    | ACTIVE               |
| .claude/state/reviews-archive.jsonl            | 276K | 1,056 | ACTIVE (rotated)     |
| .claude/state/commit-log.jsonl                 | 212K | 3,061 | ROTATION ISSUE       |
| docs/technical-debt/raw/scattered-intake.jsonl | 320K | 503   | No rotation          |

---

## Missing Rotation (CRITICAL)

| File                                           | Size | Writer              |      In Rotation Policy?      |
| ---------------------------------------------- | ---- | ------------------- | :---------------------------: |
| .claude/state/hook-runs.jsonl                  | 44K  | pre-commit/pre-push |            **NO**             |
| .claude/state/commit-log.jsonl                 | 212K | commit-tracker.js   | Listed but may not be working |
| docs/technical-debt/raw/scattered-intake.jsonl | 320K | intake scripts      |            **NO**             |

---

## Dead/Orphan Files

| File                                      | Size | Issue                                  | Action            |
| ----------------------------------------- | ---- | -------------------------------------- | ----------------- |
| docs/technical-debt/raw/reviews.jsonl     | 1K   | Empty (just newline), no writer/reader | Delete            |
| docs/technical-debt/MASTER_DEBT.jsonl.bak | 4.3M | Manual backup, nothing reads it        | Delete or archive |

---

## Stale Files (>30 days since last entry)

| File                                | Last Entry  | Age      |
| ----------------------------------- | ----------- | -------- |
| .claude/state/velocity-log.jsonl    | 2026-02-14  | ~37 days |
| .claude/state/learning-routes.jsonl | ~2026-02-12 | ~39 days |

---

## Duplicate Data Concerns

| Data Type   | Files                                                                                       | Issue                                      |
| ----------- | ------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Tech debt   | normalized-all.jsonl + deduped.jsonl + MASTER_DEBT.jsonl                                    | Overlapping content across pipeline stages |
| Reviews     | .claude/state/reviews.jsonl + reviews-archive.jsonl + docs/technical-debt/raw/reviews.jsonl | 3 files, unclear sync                      |
| Health logs | ecosystem-health-log.jsonl + health-score-log.jsonl                                         | Two separate systems                       |

---

## Weakly-Maintained Files (writer exists, no/minimal readers)

- pending-refinements.jsonl — no readers found
- velocity-log.jsonl — readers unclear
- alert-suppressions.json — no active writers/readers
- data/ecosystem-v2/deferred-items.jsonl — 3 entries, minimal use
- data/ecosystem-v2/warnings.jsonl — 12 entries, no clear writer

---

## Action Items (Priority Order)

1. **CRITICAL:** Add hook-runs.jsonl to rotation-policy.json (operational, 30
   days)
2. **CRITICAL:** Verify commit-log.jsonl rotation is working
3. **HIGH:** Delete docs/technical-debt/raw/reviews.jsonl (empty orphan)
4. **HIGH:** Delete or archive MASTER_DEBT.jsonl.bak (4.3M backup)
5. **MEDIUM:** Consolidate health logging (choose canonical system)
6. **MEDIUM:** Add cleanup step to debt pipeline for intermediate files
7. **LOW:** Document retention purpose for deferred-items.jsonl and
   warnings.jsonl

---

## Statistics

| Category              | Count |
| --------------------- | ----- |
| Total files audited   | 56    |
| Files >100KB          | 8     |
| Actively read+written | 18    |
| No reader found       | 7     |
| No writer found       | 4     |
| Stale (>30 days)      | 2     |
| Dead/empty            | 2     |
| Unrotated high-volume | 3     |
