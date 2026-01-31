# Technical Debt Management System - Procedure Guide

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-01-30
**Status:** ACTIVE
**Parent Plan:** [TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md](../plans/TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md)
<!-- prettier-ignore-end -->

---

## Purpose

This document provides step-by-step procedures for managing technical debt using
the TDMS (Technical Debt Management System). All technical debt items use the
canonical format stored in `MASTER_DEBT.jsonl`.

---

## Quick Start

**I want to...**

| Task                       | Procedure                                              |
| -------------------------- | ------------------------------------------------------ |
| View all technical debt    | Read `docs/technical-debt/INDEX.md`                    |
| View critical items (S0)   | Read `docs/technical-debt/views/by-severity.md`        |
| Add debt from audit        | Run `node scripts/debt/intake-audit.js <file>`         |
| Add debt manually          | Use `add-manual-debt` skill                            |
| Add deferred PR item       | Use `add-deferred-debt` skill                          |
| Sync with SonarCloud       | Use `sync-sonarcloud-debt` skill                       |
| Verify items in queue      | Use `verify-technical-debt` skill                      |
| Mark item as resolved      | Run `node scripts/debt/resolve-item.js DEBT-XXXX`      |
| Check verification backlog | Read `docs/technical-debt/views/verification-queue.md` |

---

## AI Instructions

When working with technical debt:

1. **Always check INDEX.md** before starting work to understand current debt
   status
2. **Use DEBT-XXXX IDs** when referencing items (not legacy IDs)
3. **Run intake scripts** after audits complete
4. **Update views** after any MASTER_DEBT.jsonl changes
5. **Never create separate findings files** - all debt goes through TDMS

---

## 1. Technical Debt Lifecycle

```
DISCOVERY        INTAKE         VERIFICATION      RESOLUTION
─────────────────────────────────────────────────────────────

┌─────────┐    ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Audits  │───▶│         │     │         │     │         │
│ PR Rev  │    │  MASTER │────▶│ VERIFIED│────▶│RESOLVED │
│ Qodo    │───▶│  DEBT   │     │  QUEUE  │     │ ARCHIVE │
│ Manual  │    │ .jsonl  │     │         │     │         │
└─────────┘    └─────────┘     └─────────┘     └─────────┘
```

### Status Flow

| Status           | Meaning                                         | Next States                         |
| ---------------- | ----------------------------------------------- | ----------------------------------- |
| `NEW`            | Just added, needs verification                  | VERIFIED, FALSE_POSITIVE, DUPLICATE |
| `VERIFIED`       | Confirmed as real technical debt                | IN_PROGRESS, RESOLVED               |
| `IN_PROGRESS`    | Actively being worked on                        | RESOLVED                            |
| `RESOLVED`       | Fixed and closed                                | (terminal)                          |
| `FALSE_POSITIVE` | Not actual debt, moved to FALSE_POSITIVES.jsonl | (terminal)                          |
| `DUPLICATE`      | Merged with existing item                       | (terminal)                          |

---

## 2. Adding Technical Debt

### 2.1 From Audit Results (Automatic)

After completing any audit skill (`audit-code`, `audit-security`, etc.):

```bash
# Run the intake script with audit output
node scripts/debt/intake-audit.js ./path/to/audit-output.jsonl
```

The script will:

- Validate schema compliance
- Check for duplicates
- Assign DEBT-XXXX IDs
- Append to MASTER_DEBT.jsonl
- Regenerate all views

**Required audit output format:**

```json
{
  "title": "Description of the issue",
  "severity": "S0|S1|S2|S3",
  "category": "security|performance|code-quality|refactoring|documentation|process",
  "file": "path/to/file.ts",
  "line": 42,
  "description": "Detailed explanation",
  "recommendation": "How to fix"
}
```

### 2.2 From PR Reviews (Deferred Items)

When a PR review identifies items to defer:

1. **Document in PR** - Add to Deferred Items section
2. **Use the skill:**

```
Use the add-deferred-debt skill with:
- File: path/to/file.ts
- Line: 42
- Severity: S2
- Title: Description of deferred issue
- PR Number: 123
```

3. **Verify** - Check that item appears in INDEX.md

### 2.3 From SonarCloud/Qodo (Sync)

To sync current SonarCloud issues:

```
Use the sync-sonarcloud-debt skill
```

The skill will:

- Fetch current issues from SonarCloud API
- Diff against existing items
- Report new, resolved, and unchanged items
- Prompt for confirmation before changes

### 2.4 Manual Entry

For ad-hoc technical debt discovery:

```
Use the add-manual-debt skill with:
- File: path/to/file.ts
- Line: 42
- Title: Issue description
- Severity: S1
- Category: code-quality
- Description: Detailed explanation
- Recommendation: Suggested fix
```

Or use the script directly:

```bash
node scripts/debt/intake-manual.js \
  --file "path/to/file.ts" \
  --line 42 \
  --title "Issue description" \
  --severity S1 \
  --category code-quality
```

---

## 3. Verification Process

### 3.1 When to Verify

Verification is triggered when:

- Verification queue has >25 NEW items
- > 3 days since last verification
- Session-start hook will alert you

### 3.2 Running Verification

```
Use the verify-technical-debt skill
```

For each item, the skill will:

1. Read the referenced file:line
2. Determine if issue still exists
3. Classify as: VERIFIED, FALSE_POSITIVE, DUPLICATE, or RESOLVED
4. Update MASTER_DEBT.jsonl
5. Generate verification report

### 3.3 Verification Batching

Verify items by priority:

| Batch | Focus         | Items    |
| ----- | ------------- | -------- |
| 1     | S0 (Critical) | ~10-20   |
| 2     | S1 (High)     | ~50-80   |
| 3     | S2 (Medium)   | ~150-250 |
| 4     | S3 (Low)      | ~200-300 |

### 3.4 Marking False Positives

If an item is not actual technical debt:

```bash
node scripts/debt/resolve-item.js DEBT-0042 --false-positive --reason "Not applicable because..."
```

The item will be moved to `FALSE_POSITIVES.jsonl` with the reason.

---

## 4. Resolution Tracking

### 4.1 Via Pull Request

When fixing technical debt in a PR:

1. **Add to PR description:**

```markdown
## Technical Debt

Resolves: DEBT-0042, DEBT-0043
```

2. **On merge**, the GitHub Action will:
   - Extract DEBT-XXXX IDs from PR body
   - Run resolve script for each ID
   - Regenerate views
   - Commit the updates

### 4.2 Manual Resolution

If resolving outside of PR workflow:

```bash
# Single item
node scripts/debt/resolve-item.js DEBT-0042 --pr 123

# Multiple items
node scripts/debt/resolve-bulk.js --pr 123 DEBT-0042 DEBT-0043 DEBT-0044
```

---

## 5. Available Scripts

| Script                  | Purpose                             |
| ----------------------- | ----------------------------------- |
| `intake-audit.js`       | Process audit output into canonical |
| `intake-pr-deferred.js` | Add PR deferred items               |
| `intake-manual.js`      | Add manual entries                  |
| `sync-sonarcloud.js`    | Sync with SonarCloud                |
| `resolve-item.js`       | Mark item resolved                  |
| `resolve-bulk.js`       | Bulk resolution                     |
| `validate-schema.js`    | Schema validation                   |
| `generate-views.js`     | Regenerate MD views                 |
| `generate-metrics.js`   | Generate metrics report             |
| `sync-roadmap-refs.js`  | Check ROADMAP consistency           |
| `consolidate-all.js`    | Run full consolidation pipeline     |

All scripts are located in `scripts/debt/`.

---

## 6. Available Skills

| Skill                   | Purpose                  | When to Use               |
| ----------------------- | ------------------------ | ------------------------- |
| `sync-sonarcloud-debt`  | Sync with SonarCloud API | On-demand                 |
| `add-manual-debt`       | Add ad-hoc debt item     | When discovering new debt |
| `add-deferred-debt`     | Add PR deferred item     | During PR review          |
| `verify-technical-debt` | Verify items in queue    | When backlog builds up    |

---

## 7. File Locations

### Canonical Data

| File                     | Purpose                            |
| ------------------------ | ---------------------------------- |
| `MASTER_DEBT.jsonl`      | Single source of truth (all items) |
| `FALSE_POSITIVES.jsonl`  | Items confirmed as not real debt   |
| `LEGACY_ID_MAPPING.json` | Maps old IDs to DEBT-XXXX          |

### Generated Views

| File                          | Purpose                         |
| ----------------------------- | ------------------------------- |
| `INDEX.md`                    | Human-readable index with stats |
| `views/by-severity.md`        | Items grouped by S0/S1/S2/S3    |
| `views/by-category.md`        | Items grouped by category       |
| `views/by-status.md`          | Items grouped by status         |
| `views/verification-queue.md` | NEW items needing verification  |

### Logs

| File                        | Purpose                     |
| --------------------------- | --------------------------- |
| `logs/dedup-log.jsonl`      | Merge/deduplication history |
| `logs/intake-log.jsonl`     | Intake activity log         |
| `logs/resolution-log.jsonl` | Resolution activity log     |

---

## 8. ROADMAP Integration

### Referencing Debt in ROADMAP

**Individual items:**

```markdown
- [ ] DEBT-0042: Fix unbounded Firestore query (S0)
```

**Bulk items:**

```markdown
- [ ] DEBT-0201 through DEBT-0215: SonarCloud code smells in /scripts (S3, bulk
      fix)
```

### Checking ROADMAP Consistency

```bash
node scripts/debt/sync-roadmap-refs.js --check-only
```

Reports:

- Orphaned refs (in ROADMAP but not in canonical)
- Unplaced items (in canonical but not in ROADMAP)
- Status mismatches (done in ROADMAP but not RESOLVED)

---

## 9. Severity Definitions

| Severity | Name     | Definition                                                    |
| -------- | -------- | ------------------------------------------------------------- |
| S0       | Critical | Security vulnerability, data loss risk, or production blocker |
| S1       | High     | Significant bug, performance issue, or code quality problem   |
| S2       | Medium   | Moderate issue that should be addressed in normal course      |
| S3       | Low      | Minor improvement, nice-to-have, or code smell                |

---

## 10. Category Definitions

| Category        | Scope                                           |
| --------------- | ----------------------------------------------- |
| `security`      | Authentication, authorization, input validation |
| `performance`   | Runtime performance, memory, bundle size        |
| `code-quality`  | Complexity, duplication, maintainability        |
| `refactoring`   | Architecture, patterns, large-scale changes     |
| `documentation` | Missing or outdated documentation               |
| `process`       | CI/CD, automation, tooling                      |

---

## Version History

| Version | Date       | Changes                                     |
| ------- | ---------- | ------------------------------------------- |
| 1.0     | 2026-01-30 | Initial PROCEDURE.md created (TDMS Phase 2) |

---

**END OF PROCEDURE GUIDE**
