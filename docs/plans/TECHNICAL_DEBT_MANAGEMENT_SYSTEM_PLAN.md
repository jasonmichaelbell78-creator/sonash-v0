# Technical Debt Management System (TDMS) - Implementation Plan

<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Created:** 2026-01-30 (Session #117)
**Last Updated:** 2026-01-31
**Status:** APPROVED - Ready for Implementation
**Related:** [ROADMAP.md](../../ROADMAP.md), [Consolidation Plan Memory](#memory-reference)
<!-- prettier-ignore-end -->

---

## Executive Summary

This plan establishes a unified Technical Debt Management System (TDMS) for the
SoNash project. It consolidates ~1,700 raw technical debt items from 15+ sources
into a single canonical location with standardized processes for intake,
verification, resolution, and tracking.

**Expected Outcome:** ~400-600 unique, verified technical debt items with full
traceability, integrated into ROADMAP, with enforcement mechanisms to maintain
system integrity.

---

## Table of Contents

1. [Current State](#1-current-state)
2. [Target State](#2-target-state)
3. [Consolidation Plan](#3-consolidation-plan)
4. [System Architecture](#4-system-architecture)
5. [Intake Procedures](#5-intake-procedures)
6. [Verification Workflow](#6-verification-workflow)
7. [Resolution Tracking](#7-resolution-tracking)
8. [Enforcement Mechanisms](#8-enforcement-mechanisms)
9. [ROADMAP Integration](#9-roadmap-integration)
10. [Metrics & Reporting](#10-metrics--reporting)
11. [Implementation Phases](#11-implementation-phases)
12. [File Structure](#12-file-structure)
13. [Skills & Scripts Reference](#13-skills--scripts-reference)

---

## 1. Current State

### 1.1 Source Inventory

| Source                        | Location                                       | Items             | Format  |
| ----------------------------- | ---------------------------------------------- | ----------------- | ------- |
| SonarCloud/Qodo               | `docs/analysis/`                               | 921 + 77 hotspots | JSON    |
| Aggregation MASTER_ISSUE_LIST | `docs/aggregation/`                            | 284               | JSONL   |
| Aggregation net-new           | `docs/aggregation/`                            | 171               | JSONL   |
| Canonical MASTER_FINDINGS     | `docs/audits/canonical/`                       | 203               | JSONL   |
| 2026-Q1 CANON-\* files        | `docs/reviews/2026-Q1/canonical/`              | 118               | JSONL   |
| 2026-Q1 DEDUPED_FINDINGS      | `docs/reviews/2026-Q1/canonical/tier2-output/` | 15                | JSONL   |
| Single-session audits         | `docs/audits/single-session/`                  | 93                | JSONL   |
| Multi-AI performance          | `docs/audits/multi-ai/`                        | 28                | JSONL   |
| Comprehensive audits          | `docs/audits/comprehensive/`                   | 209               | MD/JSON |
| TECHNICAL_DEBT_MASTER         | `docs/`                                        | 112               | MD      |
| FALSE_POSITIVES               | `docs/audits/`                                 | 20                | JSONL   |
| ROADMAP embedded refs         | `ROADMAP.md`, `ROADMAP_FUTURE.md`              | Various           | MD      |
| **Raw Total**                 |                                                | **~1,700+**       |         |

### 1.2 Current Problems

1. **Multiple "canonical" locations** - No single source of truth
2. **Inconsistent ID schemes** - CANON-_, DEDUP-_, EFF-_, PERF-_, M2.3-REF-_,
   SEC-_, CODE-\*
3. **Heavy duplication** - Same issues recorded multiple times
4. **No verification status** - Unknown if items are real issues or false
   positives
5. **No intake process** - New debt added inconsistently
6. **No resolution tracking** - Items marked done in ROADMAP but not in source
7. **PR deferred items lost** - Identified during review but never tracked

---

## 2. Target State

### 2.1 Single Source of Truth

```
docs/technical-debt/
├── MASTER_DEBT.jsonl           # THE canonical source
├── FALSE_POSITIVES.jsonl       # Confirmed non-issues
├── INDEX.md                    # Human-readable index
├── METRICS.md                  # Auto-generated metrics
├── metrics.json                # Machine-readable for dashboard
├── PROCEDURE.md                # System documentation
├── views/
│   ├── by-severity.md
│   ├── by-category.md
│   ├── by-status.md
│   └── verification-queue.md
└── logs/
    ├── dedup-log.jsonl
    ├── intake-log.jsonl
    └── resolution-log.jsonl
```

### 2.2 Unified Schema

```jsonl
{
  "id": "DEBT-0001",
  "source_id": "sonarcloud:AZQ123|CANON-0042|manual",
  "source_file": "docs/analysis/sonarqube-all-issues-complete.json",
  "category": "security|performance|code-quality|documentation|process|refactoring",
  "severity": "S0|S1|S2|S3",
  "type": "bug|code-smell|vulnerability|hotspot|tech-debt|process-gap",
  "file": "components/admin/users-tab.tsx",
  "line": 84,
  "title": "Short description",
  "description": "Detailed description",
  "effort": "E0|E1|E2|E3",
  "status": "NEW|VERIFIED|FALSE_POSITIVE|IN_PROGRESS|RESOLVED",
  "roadmap_ref": "Track-D|M2.3|null",
  "created": "2026-01-30",
  "verified_by": "null|human|ai",
  "resolution": "null|PR-123|commit-abc123"
}
```

### 2.3 Universal ID Scheme

- **Format:** `DEBT-XXXX` (4-digit, zero-padded)
- **Scope:** All technical debt regardless of source
- **Legacy mapping:** Original IDs preserved in `source_id` field
- **ROADMAP usage:** All references use DEBT-XXXX

### 2.4 Severity Mapping

| SonarCloud | Audit Files | Unified |
| ---------- | ----------- | ------- |
| BLOCKER    | CRITICAL    | S0      |
| CRITICAL   | HIGH        | S1      |
| MAJOR      | MEDIUM      | S2      |
| MINOR/INFO | LOW         | S3      |

---

## 3. Consolidation Plan

### Phase 1: Source Mapping & Schema Analysis

**Goal:** Document each source's format for normalization

**Deliverable:** Normalization spec per source type

### Phase 2: Define Target Schema

**Goal:** Finalize JSONL schema (see Section 2.2)

**Deliverable:** Schema documentation with validation rules

### Phase 3: Build Extraction Scripts

| Script                  | Source                            | Output                 |
| ----------------------- | --------------------------------- | ---------------------- |
| `extract-sonarcloud.js` | `docs/analysis/*.json`            | `raw/sonarcloud.jsonl` |
| `extract-audits.js`     | `docs/audits/**/*.jsonl`          | `raw/audits.jsonl`     |
| `extract-reviews.js`    | `docs/reviews/**/*.jsonl`         | `raw/reviews.jsonl`    |
| `extract-markdown.js`   | Various `.md` files               | `raw/markdown.jsonl`   |
| `extract-roadmap.js`    | `ROADMAP.md`, `ROADMAP_FUTURE.md` | `raw/roadmap.jsonl`    |

**Output:** ~1,700 items in `raw/` folder

### Phase 4: Normalization Pass

**Script:** `normalize-all.js`

- Apply schema transformations
- Standardize severities
- Normalize file paths
- Parse line numbers
- Generate deterministic hash for dedup

**Output:** `normalized/all-items.jsonl`

### Phase 5: Multi-Pass Deduplication

| Pass | Method                                             | Action            |
| ---- | -------------------------------------------------- | ----------------- |
| 1    | Exact match (file + line + message hash)           | Merge, keep first |
| 2    | Near match (file + line ±5 + message >80% similar) | Flag for review   |
| 3    | Semantic match (same file + similar title)         | Flag for review   |
| 4    | Cross-source match (SonarCloud ↔ audit finding)    | Flag for review   |

**Output:**

- `deduped/master.jsonl` - Unique items
- `deduped/duplicates-log.jsonl` - Merge history
- `deduped/review-needed.jsonl` - Uncertain matches

### Phase 6: ROADMAP Cross-Reference

**Script:** `crossref-roadmap.js`

- Parse ROADMAP.md for all item references
- Match items to roadmap tracks/milestones
- Flag items not in ROADMAP → `unplaced-items.md`
- Flag orphaned ROADMAP refs → `orphaned-refs.md`

### Phase 6.5: Placement Pass

- Review `unplaced-items.md`
- Assign `roadmap_ref` to each unplaced item
- Update ROADMAP.md with new DEBT-XXXX references

### Phase 7: Generate Outputs

- `MASTER_DEBT.jsonl` - Final canonical source
- `INDEX.md` - Human-readable index
- `views/*.md` - Filtered views
- `LEGACY_ID_MAPPING.json` - Old ID → DEBT-XXXX mapping

### Phase 8: Archive Source Documents

**Move to:** `docs/archive/technical-debt-sources-2026-01/`

> **⚠️ EXCEPTION:** `docs/AUDIT_TRACKER.md` is NOT archived. It remains in place
> because it tracks **audit trigger thresholds** (when to run next audit), which
> is separate from debt findings tracking. The `check-review-needed.js` script
> reads audit dates from this file. See Session #119 decision.

```
├── MANIFEST.md                    # What was archived and why
├── aggregation/                   # Former docs/aggregation/
├── analysis/                      # Former docs/analysis/
├── audits/                        # Former docs/audits/ (except new canonical)
├── reviews-2026-Q1/               # Former docs/reviews/2026-Q1/
└── legacy-docs/
    ├── AUDIT_FINDINGS_BACKLOG.md
    ├── SONARCLOUD_TRIAGE.md
    └── TECHNICAL_DEBT_MASTER.md

# NOTE: AUDIT_TRACKER.md is NOT archived - it remains at docs/AUDIT_TRACKER.md
# Reason: It tracks audit trigger thresholds (when to run next audit), which is
# separate from debt findings tracking. The check-review-needed.js script reads
# audit dates from this file to calculate triggers.
```

### Phase 9: Update Skills & Enforcement

- Update all audit skills with canonical output format
- Add enforcement hooks (pre-commit, CI)
- Create new intake/verification skills

### Phase 10: Dev Dashboard Integration

- Output `metrics.json` for dashboard consumption
- Add debt summary widget to dev dashboard
- Include S0/S1 alerts, burn-down chart data

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TECHNICAL DEBT LIFECYCLE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   DISCOVERY        INTAKE         VERIFICATION      RESOLUTION   │
│   ─────────────────────────────────────────────────────────────  │
│                                                                  │
│   ┌─────────┐    ┌─────────┐     ┌─────────┐     ┌─────────┐   │
│   │ Audits  │───▶│         │     │         │     │         │   │
│   │ PR Rev  │    │  MASTER │────▶│ VERIFIED│────▶│RESOLVED │   │
│   │ Qodo    │───▶│  DEBT   │     │  QUEUE  │     │ ARCHIVE │   │
│   │ Manual  │    │ .jsonl  │     │         │     │         │   │
│   └─────────┘    └─────────┘     └─────────┘     └─────────┘   │
│                       │                │               │        │
│                       ▼                ▼               ▼        │
│                  ┌─────────┐     ┌─────────┐    ┌─────────┐    │
│                  │ ROADMAP │     │  FALSE  │    │ METRICS │    │
│                  │  REFS   │     │POSITIVES│    │ REPORTS │    │
│                  └─────────┘     └─────────┘    └─────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Status Flow

```
NEW ──────▶ VERIFIED ──────▶ IN_PROGRESS ──────▶ RESOLVED
  │              │
  │              ▼
  │         FALSE_POSITIVE ──────▶ (moved to FALSE_POSITIVES.jsonl)
  │
  ▼
DUPLICATE ──────▶ (merged with existing, logged)
```

---

## 5. Intake Procedures

### 5.1 Audit-Generated Debt (Automatic)

**Trigger:** Audit skill completion

**Process:**

1. Audit skill outputs findings to canonical JSONL format
2. Skill instructs Claude to run
   `node scripts/debt/intake-audit.js ./output.jsonl`
3. Script validates schema, checks duplicates, assigns DEBT-XXXX IDs
4. Appends to MASTER_DEBT.jsonl, regenerates views

**Skills to update:**

- `audit-code.md`
- `audit-security.md`
- `audit-performance.md`
- `audit-documentation.md`
- `audit-process.md`
- `audit-refactoring.md`
- All multi-AI templates

### 5.2 PR Review Deferred Items

**Trigger:** PR review identifies deferrable debt

**Process:**

1. Reviewer documents deferred items in PR
2. Reviewer runs `add-deferred-debt` skill with item details
3. Skill calls `scripts/debt/intake-pr-deferred.js`
4. Item added to MASTER_DEBT.jsonl with `source_id: "PR-{number}-{item}"`

**PR Review Skill Update Required:**

```markdown
## Deferred Items (Mandatory Section)

If ANY items are deferred during review:

1. List each with: file, line, severity, description, suggested ROADMAP track
2. Run `add-deferred-debt` skill for each item
3. Verify items appear in MASTER_DEBT.jsonl

**No PR review is complete until deferred items are tracked.**
```

### 5.3 SonarCloud/Qodo Sync (On-Demand Skill)

**Trigger:** User invokes `sync-sonarcloud-debt` skill

**Process:**

1. Skill fetches current issues from SonarCloud API
2. Normalizes to canonical schema
3. Diffs against existing items (by source_id)
4. Reports: new items, resolved items, unchanged
5. User confirms additions/resolutions

### 5.4 Manual Entry (Skill)

**Trigger:** User invokes `add-manual-debt` skill

**Process:**

1. Skill prompts for required fields (file, line, title, severity, category)
2. Validates input
3. Calls `scripts/debt/intake-manual.js`
4. Confirms addition

---

## 6. Verification Workflow

### 6.1 Verification Skill

**Skill:** `verify-technical-debt`

**Process:**

1. Read items from `verification-queue.md` (status = NEW)
2. For each item:
   - Read referenced file:line
   - Determine if issue still exists
   - Classify: VERIFIED, FALSE_POSITIVE, DUPLICATE, or RESOLVED
3. Update MASTER_DEBT.jsonl
4. Move FALSE_POSITIVEs to FALSE_POSITIVES.jsonl with reason
5. Merge DUPLICATEs, log in dedup-log.jsonl
6. Generate verification report

### 6.2 Verification Trigger (Hybrid)

**Session-start check:**

```
IF verification-queue.md has >25 NEW items:
  Alert: "Verification backlog at {count} items"

IF >3 days since last verification:
  Alert: "Verification overdue ({days} days)"

Either condition → Prompt: "Consider running verify-technical-debt skill"
```

### 6.3 Verification Batching

| Batch | Focus                   | Estimated Items |
| ----- | ----------------------- | --------------- |
| 1     | S0 (Critical)           | ~10-20          |
| 2     | S1 (High)               | ~50-80          |
| 3     | S2 (Medium) by category | ~150-250        |
| 4     | S3 (Low) by category    | ~200-300        |

### 6.4 Future: Domain-Specific Verification

Start with generic skill, evolve to domain-specific as patterns emerge:

- `verify-security-debt`
- `verify-performance-debt`
- `verify-code-quality-debt`

---

## 7. Resolution Tracking

### 7.1 PR-Based Resolution (GitHub Action)

**PR Template Addition:**

```markdown
## Technical Debt

Resolves: <!-- List DEBT-XXXX IDs, comma-separated, or "none" -->
```

**GitHub Action:** `.github/workflows/resolve-debt.yml`

```yaml
name: Resolve Technical Debt

on:
  pull_request:
    types: [closed]

jobs:
  resolve-debt:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Extract DEBT IDs from PR body
        id: extract
        run: |
          DEBT_IDS=$(echo "${{ github.event.pull_request.body }}" | \
            grep -oP 'DEBT-\d+' | sort -u | tr '\n' ' ')
          echo "debt_ids=$DEBT_IDS" >> $GITHUB_OUTPUT

      - name: Resolve debt items
        if: steps.extract.outputs.debt_ids != ''
        run: |
          for id in ${{ steps.extract.outputs.debt_ids }}; do
            node scripts/debt/resolve-item.js $id --pr ${{ github.event.pull_request.number }}
          done

      - name: Regenerate views
        if: steps.extract.outputs.debt_ids != ''
        run: node scripts/debt/generate-views.js

      - name: Commit updates
        if: steps.extract.outputs.debt_ids != ''
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add docs/technical-debt/
          git commit -m "chore: resolve debt items from PR #${{ github.event.pull_request.number }}"
          git push
```

### 7.2 Manual Resolution

**Script:** `scripts/debt/resolve-item.js`

```bash
node scripts/debt/resolve-item.js DEBT-0042 --pr 456
```

**Bulk Resolution:**

```bash
node scripts/debt/resolve-bulk.js --pr 456 DEBT-0042 DEBT-0043 DEBT-0044
```

---

## 8. Enforcement Mechanisms

### 8.1 Pre-Commit Hooks

**Add to `.husky/pre-commit`:**

```bash
# Validate technical debt schema
if git diff --cached --name-only | grep -q "MASTER_DEBT.jsonl"; then
  echo "▶ Validating technical debt schema..."
  node scripts/debt/validate-schema.js
fi

# Warn if findings added outside canonical location
if git diff --cached --name-only | grep -E 'findings|issues|debt' | grep -v 'docs/technical-debt/'; then
  echo "⚠️  Warning: Debt-related files modified outside docs/technical-debt/"
  echo "   Canonical location: docs/technical-debt/MASTER_DEBT.jsonl"
fi
```

### 8.2 CI Checks

```yaml
- name: Validate Technical Debt Schema
  run: node scripts/debt/validate-schema.js

- name: Check ROADMAP References
  run: node scripts/debt/sync-roadmap-refs.js --check-only

- name: Verify Views Are Current
  run: |
    node scripts/debt/generate-views.js
    git diff --exit-code docs/technical-debt/views/
```

### 8.3 Audit Skill Enforcement

All audit skills must include:

```markdown
## Output Requirements

- MUST output findings to canonical JSONL format
- MUST run intake script as final step
- MUST NOT create separate findings files outside canonical location
```

---

## 9. ROADMAP Integration

### 9.1 Reference Format

**Individual items:**

```markdown
- [ ] DEBT-0042: Fix unbounded Firestore query (S0)
```

**Bulk items:**

```markdown
- [ ] DEBT-0201 through DEBT-0215: SonarCloud code smells in /scripts (S3, bulk
      fix)
```

### 9.2 ROADMAP Sync

**Script:** `scripts/debt/sync-roadmap-refs.js`

**CI Check:** Runs on any PR touching ROADMAP.md

**Reports:**

- Orphaned refs (in ROADMAP but not in canonical)
- Unplaced items (in canonical but not in ROADMAP)
- Status mismatches (done in ROADMAP but not RESOLVED in canonical)

### 9.3 ID Migration

During consolidation, all existing ROADMAP references will be updated:

```
Before: - [ ] CANON-0042: Fix query
After:  - [ ] DEBT-0042: Fix query
```

Legacy ID mapping preserved in `LEGACY_ID_MAPPING.json`.

---

## 10. Metrics & Reporting

### 10.1 Auto-Generated Views

| View                    | Content                 | Regeneration                    |
| ----------------------- | ----------------------- | ------------------------------- |
| `INDEX.md`              | Full listing with stats | On any MASTER_DEBT.jsonl change |
| `by-severity.md`        | Grouped S0/S1/S2/S3     | On any change                   |
| `by-category.md`        | Grouped by category     | On any change                   |
| `by-status.md`          | Grouped by status       | On any change                   |
| `verification-queue.md` | NEW items only          | On any change                   |
| `METRICS.md`            | Summary metrics         | Session-end hook                |
| `metrics.json`          | Dashboard data          | Session-end hook                |

### 10.2 Metrics Trigger

**Primary:** Session-end hook

**Failsafe:** Session-start check

```javascript
if (!lastSessionEndRan || commitsSinceLastMetrics >= 5) {
  console.log("📊 Regenerating metrics (failsafe)...");
  execSync("node scripts/debt/generate-metrics.js");
}
```

### 10.3 Dev Dashboard Integration

**metrics.json output:**

```json
{
  "generated": "2026-01-30T12:00:00Z",
  "summary": {
    "total": 487,
    "by_status": { "NEW": 45, "VERIFIED": 312, "IN_PROGRESS": 28, "RESOLVED": 102 },
    "by_severity": { "S0": 8, "S1": 82, "S2": 249, "S3": 148 },
    "by_category": { ... }
  },
  "trend_30d": { "added": 23, "resolved": 45, "net": -22 },
  "alerts": { "s0_open": 2, "verification_overdue": false }
}
```

**Dashboard widget displays:**

- Current debt summary
- S0/S1 alert if any open
- 30-day trend chart
- Link to full INDEX.md

---

## 11. Implementation Phases

| Phase  | Description                        | Dependencies        | Estimated Effort |
| ------ | ---------------------------------- | ------------------- | ---------------- |
| **1**  | Execute Consolidation (Phases 1-7) | -                   | E3 (large)       |
| **2**  | Create PROCEDURE.md                | Phase 1             | E1               |
| **3**  | Build intake scripts               | Phase 1             | E2               |
| **4**  | Build validation scripts           | Phase 1             | E1               |
| **5**  | Update audit skills                | Phases 2-4          | E2               |
| **6**  | Create intake skills               | Phases 3-4          | E2               |
| **7**  | Add pre-commit hooks               | Phase 4             | E1               |
| **8**  | Add CI checks                      | Phase 4             | E1               |
| **9**  | Create verification skill          | Phase 1             | E2               |
| **10** | Create GitHub Action               | -                   | E1               |
| **11** | Update PR template                 | -                   | E0               |
| **12** | Update pr-review skill             | Phase 6             | E1               |
| **13** | Archive source documents           | Phases 1-9 verified | E1               |
| **14** | Dev dashboard integration          | Phases 1, 10        | E2               |
| **15** | Run verification batches           | Phase 9             | E3 (ongoing)     |
| **16** | **Final doc sync & enforcement**   | All phases          | E1               |
| **17** | **Final System Audit**             | Phase 16            | E1               |

### Phase Audit Requirements (MANDATORY)

After completing EACH implementation phase:

1. **Create Audit Report** - `docs/technical-debt/PHASE_N_AUDIT.md`
   - List all requirements from the plan for that phase
   - Mark each as PASS, FAIL, or DEFERRED
   - Document any deviations with justification
   - Include summary statistics where applicable

2. **Commit All Changes** - Include audit report in commit
   - Use message format: `feat: complete TDMS Phase N - [description]`

3. **Run Checkpoint** - Invoke `/checkpoint` skill after commit
   - Creates session checkpoint for recovery
   - Documents phase completion in SESSION_CONTEXT.md

4. **Update Plan Status** - Mark phase as complete in Approval section (bottom)

**Audit Report Template:**

```markdown
# TDMS Phase N Audit Report

**Audit Date:** YYYY-MM-DD **Phase:** Implementation Phase N ([description])
**Status:** PASS | PASS with deviations | FAIL

## Requirements Checklist

| Requirement | Status             | Notes |
| ----------- | ------------------ | ----- |
| ...         | PASS/FAIL/DEFERRED | ...   |

## Deviations Summary

| Item | Deviation | Impact | Resolution |
| ---- | --------- | ------ | ---------- |

## Audit Verdict

[PASS/FAIL with explanation]
```

---

### Phase 16: Final Doc Sync & Enforcement (MANDATORY)

After completing all implementation phases, the following documents MUST be
updated:

**Navigation & Reference Docs:**

- [ ] `docs/PLAN_MAP.md` - Update Tier 1 hierarchy, Quick Navigation, Sync
      Triggers
- [ ] `docs/README.md` - Update Quick Reference, Documentation Statistics
- [ ] `SESSION_CONTEXT.md` - Add implementation summary
- [ ] `DOCUMENTATION_INDEX.md` - Regenerate (`npm run docs:index`)

**Process & Dependency Docs:**

- [ ] `docs/DOCUMENT_DEPENDENCIES.md` - Add TDMS sync triggers
- [ ] `scripts/check-cross-doc-deps.js` - Add enforcement rules for
      `docs/technical-debt/`
- [ ] `.claude/COMMAND_REFERENCE.md` - Add new skills reference

**Archive Manifest:**

- [ ] `docs/archive/technical-debt-sources-2026-01/MANIFEST.md` - Document what
      was archived

**Cross-Reference Updates:**

- [ ] All audit skill files - Verify canonical output references
- [ ] `docs/audits/canonical/README.md` - Update migration status
- [ ] `ROADMAP.md` - Update all DEBT-XXXX references

---

### Phase 17: Final System Audit (MANDATORY)

After all phases complete, conduct a final system-wide audit:

**Audit Checklist:**

- [ ] All 16 phases audited with PASS status
- [ ] All phase audit reports exist in `docs/technical-debt/`
- [ ] MASTER_DEBT.jsonl schema validates
- [ ] All views regenerate without errors
- [ ] ROADMAP.md contains valid DEBT-XXXX references
- [ ] No orphaned references in ROADMAP
- [ ] All intake scripts functional
- [ ] All validation scripts functional
- [ ] Pre-commit hooks active
- [ ] CI checks passing
- [ ] Dev dashboard displaying metrics
- [ ] Archive manifest complete
- [ ] All dependent docs updated per Phase 16

**Final Audit Report:** `docs/technical-debt/FINAL_SYSTEM_AUDIT.md`

**Sign-off:** Update Approval section with final completion date

**Post-Audit:** Invoke `/checkpoint` skill with summary of entire TDMS
implementation

---

## 12. File Structure

### New Files

```
docs/technical-debt/
├── MASTER_DEBT.jsonl
├── FALSE_POSITIVES.jsonl
├── INDEX.md
├── METRICS.md
├── metrics.json
├── PROCEDURE.md
├── LEGACY_ID_MAPPING.json
├── views/
│   ├── by-severity.md
│   ├── by-category.md
│   ├── by-status.md
│   └── verification-queue.md
└── logs/
    ├── dedup-log.jsonl
    ├── intake-log.jsonl
    └── resolution-log.jsonl

scripts/debt/
├── intake-audit.js
├── intake-pr-deferred.js
├── intake-manual.js
├── sync-sonarcloud.js
├── resolve-item.js
├── resolve-bulk.js
├── validate-schema.js
├── generate-views.js
├── generate-metrics.js
├── sync-roadmap-refs.js
└── extract-*.js (consolidation scripts)

.claude/skills/
├── sync-sonarcloud-debt.md      # NEW
├── add-manual-debt.md           # NEW
├── add-deferred-debt.md         # NEW
├── verify-technical-debt.md     # NEW
├── pr-review.md                 # UPDATE
├── audit-*.md                   # UPDATE (all audit skills)
└── multi-ai-*.md                # UPDATE

.github/
├── PULL_REQUEST_TEMPLATE.md     # UPDATE (add Resolves: field)
└── workflows/
    └── resolve-debt.yml         # NEW
```

### Archived Files

```
docs/archive/technical-debt-sources-2026-01/
├── MANIFEST.md
├── aggregation/
├── analysis/
├── audits/
├── reviews-2026-Q1/
└── legacy-docs/
```

---

## 13. Skills & Scripts Reference

### New Skills

| Skill                   | Purpose                  | Trigger                    |
| ----------------------- | ------------------------ | -------------------------- |
| `sync-sonarcloud-debt`  | Sync with SonarCloud API | On-demand                  |
| `add-manual-debt`       | Add ad-hoc debt item     | On-demand                  |
| `add-deferred-debt`     | Add PR deferred item     | During PR review           |
| `verify-technical-debt` | Verify items in queue    | Scheduled (hybrid trigger) |

### Updated Skills

| Skill        | Change                                          |
| ------------ | ----------------------------------------------- |
| `pr-review`  | Add mandatory deferred item tracking section    |
| `audit-*`    | Add canonical output format, intake script step |
| `multi-ai-*` | Add canonical output format, intake script step |

### Scripts

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

---

## Memory Reference

This plan is stored in Claude memory under:

- **Entity:** `TechnicalDebtConsolidationPlan`
- **Entity:** `TechnicalDebtSources`

To retrieve in future sessions:

```
"Recall the TechnicalDebtConsolidationPlan from memory"
```

---

## Approval & Sign-off

- [x] Consolidation approach approved (2026-01-30)
- [x] ID scheme (DEBT-XXXX) approved (2026-01-30)
- [x] Verification trigger (hybrid: >25 items OR >3 days) approved (2026-01-30)
- [x] Metrics trigger (session-end + failsafe) approved (2026-01-30)
- [x] Dev dashboard integration approved (2026-01-30)
- [x] Implementation started (2026-01-30)
- [x] **Phase 1 complete** (Consolidation) - Audited 2026-01-30, PASS with
      deviations
- [x] **Phase 2 complete** (PROCEDURE.md) - Audited 2026-01-30, PASS
- [x] **Phase 3 complete** (Intake scripts) - Audited 2026-01-30, PASS
- [x] **Phase 4 complete** (Validation scripts) - Audited 2026-01-30, PASS
- [x] **Phase 5 complete** (Update audit skills) - Audited 2026-01-30, PASS
- [ ] Phase 6 complete (Create intake skills)
- [ ] Phase 7 complete (Pre-commit hooks)
- [ ] Phase 8 complete (CI checks)
- [ ] Phase 9 complete (Verification skill)
- [ ] Phase 10 complete (GitHub Action)
- [ ] Phase 11 complete (PR template)
- [ ] Phase 12 complete (pr-review skill)
- [ ] Phase 13 complete (Archive)
- [ ] Phase 14 complete (Dev dashboard)
- [ ] Phase 15 ongoing (Verification batches)
- [ ] Phase 16 complete (Final doc sync)
- [ ] **Phase 17 complete** (Final System Audit)

---

_End of Plan_
