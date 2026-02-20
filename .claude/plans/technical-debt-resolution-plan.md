# Implementation Plan: Technical Debt Resolution & Grand Plan V2

<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-02-20
**Status:** DRAFT
<!-- prettier-ignore-end -->

## Guiding Principle

**MASTER_DEBT.jsonl is the single source of truth.** Every piece of technical
debt anywhere in the repo gets extracted, normalized to TDMS format,
deduplicated, and ingested into MASTER_DEBT. After consolidation, debt items are
REMOVED from their original scattered locations. Only then do we decide
placement (Grand Plan sprints vs Roadmap milestones). No debt lives anywhere
except MASTER_DEBT.

## Decision Record (from Q&A)

| Decision               | Choice                                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grand Plan scope       | code-quality, documentation, process, refactoring, engineering-productivity, ai-optimization → Grand Plan. Security, enhancements, performance → Roadmap |
| Sprint structure       | Keep file-based sprints. Sprints 1-3 done. Keep 4-7 structure. Add Sprint 8+ for unplaced items                                                          |
| NEW items              | Batch-verify ALL as part of this plan                                                                                                                    |
| RESOLVED items         | Automated file-check ALL 298 — flag any where issue persists                                                                                             |
| FALSE_POSITIVE items   | Automated file-check ALL 272 — confirm classification                                                                                                    |
| ROADMAP reconciliation | Full: map every checkbox → DEBT-XXXX, remove duplicates, TDMS = source of truth                                                                          |
| CANON IDs              | Replace all 55 CANON-XXXX → DEBT-XXXX in ROADMAP.md                                                                                                      |
| Pipeline               | Full rebuild (extract → normalize → dedup → generate-views → assign-roadmap-refs → metrics)                                                              |
| Plan document          | New GRAND_PLAN_V2.md + updated JSON manifests                                                                                                            |
| AI-optimization        | Goes into Grand Plan                                                                                                                                     |

## Current State (Pre-Execution)

- **MASTER_DEBT.jsonl**: 2,738 items (2,019 VERIFIED, 149 NEW, 298 RESOLVED, 272
  FALSE_POSITIVE)
- **Open items**: 2,168 (VERIFIED + NEW)
- **In Sprints 1-7**: 1,359 placed, 809 unplaced
- **Grand Plan eligible** (by category): ~1,998 open items
- **Roadmap-bound** (security/enhancement/performance): ~170 open items

### Gap Analysis: Debt NOT Yet in MASTER_DEBT

| Source                            | Location                                                | Est. New Items | Priority   |
| --------------------------------- | ------------------------------------------------------- | -------------- | ---------- |
| Code TODO/FIXME/HACK comments     | src/, scripts/, functions/                              | 35-40          | HIGH       |
| Dec 2025 audit reports (17 files) | docs/archive/2025-dec-reports/                          | 200-300        | HIGH       |
| ROADMAP.md checkbox items         | ROADMAP.md (498 checkboxes)                             | 100-200        | MEDIUM     |
| Raw pipeline review-needed        | docs/technical-debt/raw/review-needed.jsonl (313 lines) | up to 313      | HIGH       |
| SESSION_CONTEXT.md findings       | SESSION_CONTEXT.md                                      | 15-20          | MEDIUM     |
| .claude/ context files            | .claude/state/                                          | 40-50          | LOW-MEDIUM |
| Documentation gap references      | docs/\*.md (TESTING_PLAN, etc.)                         | 50-100         | LOW-MEDIUM |

**Estimated total new items to ingest: 500-1,000+ (after dedup)**

---

## Files to Create

### New Scripts (3)

1. **`scripts/debt/extract-scattered-debt.js`** — Scans entire repo for debt not
   yet in TDMS (TODOs, markdown findings, ROADMAP items, session context).
   Outputs `raw/scattered-intake.jsonl`
2. **`scripts/debt/verify-resolutions.js`** — Automated file-checker for
   RESOLVED/FALSE_POSITIVE items
3. **`scripts/debt/categorize-and-assign.js`** — Splits open items by Grand Plan
   vs Roadmap, assigns sprint numbers

### New Documents (2)

4. **`docs/technical-debt/GRAND_PLAN_V2.md`** — Human-readable Grand Plan with
   sprint breakdown, decision record, coverage stats
5. **`docs/technical-debt/logs/resolution-audit-report.json`** — Output of the
   RESOLVED/FP verification

### Modified Files (5+)

1. **`docs/technical-debt/MASTER_DEBT.jsonl`** — Rebuilt by pipeline with all
   new ingestions
2. **`docs/technical-debt/logs/grand-plan-manifest.json`** — Regenerated with V2
   sprint assignments
3. **`docs/technical-debt/logs/sprint-*-ids.json`** — Updated for sprints 4-7,
   new files for 8+
4. **`ROADMAP.md`** — CANON→DEBT ID replacement, inline debt removed, Section 5
   rewrite
5. **`docs/technical-debt/METRICS.md`** — Regenerated by pipeline

### Files to Clean (debt removed after ingestion)

- `SESSION_CONTEXT.md` — inline debt findings replaced with DEBT-XXXX references
- `docs/archive/2025-dec-reports/*.md` — findings extracted, originals archived
  (not deleted, but marked as "ingested into TDMS")
- Code comments — TODO/FIXME items that become DEBT entries get annotated with
  their DEBT-XXXX ID

---

## Step 0: Exhaustive Extraction (NEW — addresses the core gap)

**Goal:** Find and extract EVERY piece of technical debt anywhere in the repo
into TDMS-format JSONL for pipeline ingestion.

### 0a: Extract Code TODO/FIXME/HACK Comments (35-40 items)

Create `scripts/debt/extract-scattered-debt.js` with a code-comment scanner:

```
Scan all *.ts, *.tsx, *.js, *.jsx, *.mjs, *.css files for:
  - TODO: / TODO(...)
  - FIXME: / FIXME(...)
  - HACK: / HACK(...)
  - XXX: / WORKAROUND:

For each match, generate a TDMS-format entry:
  {
    "id": "INTAKE-CODE-XXXX",
    "title": "<extracted comment text>",
    "file": "<file path>",
    "line": <line number>,
    "category": "code-quality",
    "severity": "S3" (default, S2 for FIXME/HACK),
    "source": "code-comment-extraction",
    "status": "NEW",
    "extracted_at": "<timestamp>"
  }
```

**Output:** Appended to `raw/scattered-intake.jsonl`

### 0b: Extract Dec 2025 Audit Report Findings (200-300 items)

Parse the 17 markdown reports in `docs/archive/2025-dec-reports/`:

```
For each report:
  - Parse sections with actionable items (numbered lists, bullet points with "should", "must", "needs", "fix", "add", "remove", "refactor")
  - Extract: title, description, category (infer from report name), severity (infer from language)
  - Skip items that are clearly already resolved or informational-only
  - Cross-reference against existing MASTER_DEBT titles to pre-flag likely duplicates
```

Key reports to process:

- ARCHITECTURE_IMPROVEMENT_PLAN.md (1,079 lines) → refactoring, code-quality
- CODE_ANALYSIS_REPORT.md (987 lines) → code-quality
- REFACTORING_ACTION_PLAN.md (802 lines) → refactoring
- LIBRARY_ANALYSIS.md (713 lines) → code-quality, performance
- XSS_PROTECTION_VERIFICATION.md (368 lines) → security
- ESLINT_WARNINGS_PLAN.md (354 lines) → code-quality

**Output:** Appended to `raw/scattered-intake.jsonl`

### 0c: Extract ROADMAP.md Debt Items (100-200 items)

Parse all 498 checkbox items from ROADMAP.md:

```
For each checkbox (- [ ] or - [x]):
  - If it already has a DEBT-XXXX or CANON-XXXX reference → skip (already tracked)
  - If it describes technical debt work (refactoring, fixing, cleanup, testing gaps):
    → Generate TDMS entry with category inferred from ROADMAP section
    → Mark as NEW
  - If it describes a feature/enhancement:
    → Skip (this is roadmap work, not debt)
  - Completed checkboxes (- [x]) without DEBT refs:
    → Generate as RESOLVED (capture the historical work)
```

**Output:** Appended to `raw/scattered-intake.jsonl`

### 0d: Extract SESSION_CONTEXT.md Findings (15-20 items)

Parse SESSION_CONTEXT.md for findings not already synced:

```
- 78 items already synced as DEBT-3132 to DEBT-3209
- Check for any findings listed but NOT in that DEBT range
- Extract validation boundary gaps, missing a11y items, etc.
```

**Output:** Appended to `raw/scattered-intake.jsonl`

### 0e: Process review-needed.jsonl (313 items)

```
- Read docs/technical-debt/raw/review-needed.jsonl
- For each item: auto-accept if it matches an existing audit finding
- Flag items that need manual review
- Move accepted items into the intake pipeline
```

**Output:** Items moved from review-needed to pipeline

### 0f: Extract .claude/ Context Debt (40-50 items)

Scan `.claude/state/agent-research-results.md` and other state files:

```
- Parse gap analysis sections, testing coverage gaps, known issues
- Generate TDMS entries for actionable items
- Skip informational/status items
```

**Output:** Appended to `raw/scattered-intake.jsonl`

### 0g: SonarCloud Fresh Sync (NEW — added per PR #379 ecosystem audit)

Run a full SonarCloud sync to capture any issues not yet in MASTER_DEBT. The
SonarCloud API may have new issues from recent CI runs that haven't been
ingested.

```bash
# Decrypt MCP tokens if needed (SonarCloud API requires SONAR_TOKEN)
node scripts/secrets/decrypt-secrets.js

# Run full sync: fetch new issues + mark resolved ones
node scripts/debt/sync-sonarcloud.js --full --force
```

**What this does:**

1. **Fetches all open issues** from SonarCloud API for the project
2. **Diffs against MASTER_DEBT.jsonl** — only adds genuinely new issues
3. **Marks resolved** — items in MASTER_DEBT that are no longer flagged by
   SonarCloud get marked as RESOLVED with evidence
4. **Regenerates views** automatically

**Why in Phase 1:** SonarCloud issues are a high-signal debt source that the
extraction pipeline (0a-0f) doesn't cover. Running this sync ensures the
pipeline rebuild (Step 1) starts from a complete picture. Previous syncs may
have missed issues added since the last run, and the resolve pass cleans stale
entries.

**Output:** New items added directly to `MASTER_DEBT.jsonl` (SonarCloud uses the
intake-manual path, not scattered-intake.jsonl)

**Estimated new items:** 10-50 (depending on how recently last sync ran)

### Step 0 Totals

**Expected output:** `raw/scattered-intake.jsonl` with 500-1,000 raw items
(before cleaning) + SonarCloud sync items directly in MASTER_DEBT

---

## Step 0h: Intake Cleaning (Dedup, Verify, Filter) — BEFORE Pipeline

**Goal:** Clean the raw extraction output BEFORE it enters the TDMS pipeline. No
garbage in.

### Deduplication (multi-method)

Run 4 dedup passes against BOTH the new intake AND existing MASTER_DEBT items:

1. **Exact title match** — If a new intake item's title exactly matches an
   existing DEBT-XXXX title → mark as DUPLICATE, link to existing ID
2. **Fuzzy phrase match** — Normalize titles (lowercase, strip punctuation, stem
   words), compare with Levenshtein distance ≤ 3 or Jaccard similarity ≥ 0.8 →
   flag as LIKELY_DUPLICATE for review
3. **Same file + line** — If a new item references the same file path AND
   overlapping line range (±5 lines) as an existing item → mark as DUPLICATE
   regardless of title
4. **Keyword overlap** — Extract key technical terms from title+description,
   compare. If ≥ 70% keyword overlap AND same file → flag as LIKELY_DUPLICATE

**Output:** Each intake item tagged as: UNIQUE, DUPLICATE (auto-removed), or
LIKELY_DUPLICATE (kept but flagged)

### False Positive Detection

For each UNIQUE intake item, check:

- **Informational-only:** Items that describe how things work, not what's broken
  (e.g., "The app uses React 18" is not debt)
- **Aspirational:** Items that suggest nice-to-haves without a concrete issue
  (e.g., "Consider using TypeScript strict mode")
- **Already-standard:** Items flagging patterns that are actually the project's
  chosen approach
- **External dependencies:** Issues in node_modules or third-party code we don't
  control

Tag as FALSE_POSITIVE with reason. Keep in intake for audit trail but mark for
exclusion.

### Completed Work Detection

Cross-reference intake items against:

- **Archived files:** If the item references a file that was deliberately
  archived (moved to docs/archive/), check if the work was COMPLETED before
  archiving or if the file was archived WITH the issue unresolved
- **Git history:** For items referencing specific code patterns, check if a
  recent commit (last 90 days) already fixed the issue
- **Existing RESOLVED items in MASTER_DEBT:** If an intake item describes work
  that an existing RESOLVED DEBT item already covers → mark as ALREADY_RESOLVED

Tag as RESOLVED with evidence (commit hash, archive date, existing DEBT-XXXX
that covers it).

### Item Verification

For each remaining UNIQUE, non-false-positive, non-resolved item:

- **File exists check:** Does the referenced file still exist in the repo?
- **Line validity check:** Does the referenced line range exist and contain
  relevant code?
- **Pattern presence check:** Can we detect the described issue at the
  referenced location?
- **Category validation:** Is the assigned category correct given the file type
  and issue description?
- **Severity sanity check:** Is S0-S3 assignment reasonable? (S0 should be
  security/data-loss risks only)

Items that pass verification → status: NEW (ready for pipeline) Items that fail
→ status: NEEDS_TRIAGE with failure reason

### Intake Cleaning Summary

```
Raw extraction:      500-1,000 items
After dedup:         ~400-700 (remove exact/file+line duplicates)
After FP detection:  ~350-600 (remove informational/aspirational)
After completed:     ~300-550 (remove already-resolved work)
After verification:  ~250-500 genuinely new, verified items
```

**Output:** `raw/scattered-intake-cleaned.jsonl` — ready for pipeline ingestion

---

## Step 1: Full TDMS Pipeline Rebuild (Clean Slate)

**This runs AFTER Step 0h** — rebuild MASTER_DEBT from ALL sources including the
cleaned intake.

First, register the cleaned intake file in the pipeline:

```bash
# Add scattered-intake-cleaned.jsonl as an additional source for normalize-all.js
# Then run the full pipeline
node scripts/debt/consolidate-all.js
```

Pipeline executes:

1. `extract-audits.js` → rebuild `raw/audits.jsonl` from
   `docs/audits/**/*.jsonl`
2. `extract-reviews.js` → rebuild `raw/reviews.jsonl`
3. `normalize-all.js` → rebuild `raw/normalized-all.jsonl` (NOW INCLUDING
   scattered-intake-cleaned.jsonl)
4. `dedup-multi-pass.js` → rebuild `raw/deduped.jsonl` (6-pass dedup — second
   pass catches any remaining cross-source duplicates)
5. `generate-views.js` → rebuild MASTER_DEBT.jsonl + views/\*.md + INDEX.md
6. `assign-roadmap-refs.js` → assign roadmap_ref to all items
7. `generate-metrics.js` → rebuild METRICS.md + metrics.json
8. `validate-schema.js --strict` → validate final output

**Output:** A freshly rebuilt MASTER_DEBT.jsonl containing ALL known debt from
ALL sources, fully deduped and validated.

**Expected item count:** 3,000-3,500 total (up from 2,738)

---

## Step 2: Source Cleanup (Debt Lives ONLY in MASTER_DEBT)

After Step 1 confirms all items are in MASTER_DEBT, clean the original sources:

### 2a: Annotate Code Comments

For each code TODO/FIXME that was ingested:

```
// TODO: Create a userIdHash → uid lookup collection  →
// DEBT-XXXX: Create a userIdHash → uid lookup collection
```

The comment stays (it's useful context at the code site) but now references its
DEBT ID.

### 2b: Mark Dec 2025 Reports as Ingested

Add a header to each processed report:

```markdown
<!-- TDMS: All actionable findings from this report have been ingested into
     MASTER_DEBT.jsonl. This file is archived for historical reference only.
     Do not add new findings here — use the TDMS intake process. -->
```

### 2c: Clean SESSION_CONTEXT.md

Replace inline finding lists with DEBT-XXXX references:

```markdown
## Known Issues

See MASTER_DEBT.jsonl for all tracked items. Key references:

- Validation boundaries: DEBT-3150 through DEBT-3165
- Accessibility gaps: DEBT-3170 through DEBT-3180 ...
```

### 2d: Clean Scattered Debt References in docs/

For any docs/\*.md files that contain inline debt lists, replace with DEBT
references.

**After this step:** MASTER_DEBT.jsonl is the ONLY place debt item details live.
Everything else is either a reference (DEBT-XXXX) or archived.

---

## Step 3: Verify NEW Items

Batch-verify ALL NEW-status items on the freshly rebuilt data.

**Actions:**

- Read all items with `status: "NEW"` from the rebuilt MASTER_DEBT.jsonl (now
  includes items from Step 0)
- For each: check if the referenced `file` exists in the repo and the `line`
  range is relevant
- System-test items (82) already ACCEPTED in REVIEW_DECISIONS.md → promote to
  VERIFIED
- Step 0 intake items: verify file+line exists → promote valid ones to VERIFIED
- Flag invalid items for triage
- Log all promotions into `intake-log.jsonl`
- Update MASTER_DEBT.jsonl in-place

**Output:** NEW items reclassified

---

## Step 4: Audit RESOLVED Items (298 items)

Create and run `scripts/debt/verify-resolutions.js` against the rebuilt
MASTER_DEBT.

**Script logic:**

```javascript
// For each RESOLVED item:
// 1. Check if item.file exists in repo
//    - If file deleted → CONFIRMED (issue removed with file)
//    - If file exists → check if item.line still contains issue pattern
// 2. Use item.title + item.description to derive a search pattern
// 3. Grep for pattern near item.line (±10 lines)
//    - Pattern found → FLAG as "possibly unresolved"
//    - Pattern not found → CONFIRMED resolved
// 4. Items without file/line references → check by title keyword search
```

**Output:** `resolution-audit-report.json` with:

- `confirmed_resolved`: items verified gone
- `possibly_unresolved`: items where issue may persist (reopen to VERIFIED)
- `file_deleted`: items where entire file was removed
- `unable_to_verify`: items without enough metadata

---

## Step 5: Audit FALSE_POSITIVE Items (272 items)

Same script, different mode. For FALSE_POSITIVE items:

- If the referenced file no longer exists → confirmed (moot point)
- If the file exists but the pattern is NOT found → confirmed false positive
- If the file exists AND the pattern IS found → flag for re-review (may have
  been incorrectly dismissed)

**Output:** Appended to same `resolution-audit-report.json`

---

## Step 6: Apply Audit Corrections to MASTER_DEBT

Based on Steps 4-5 results:

- Reopen any RESOLVED items flagged as "possibly unresolved" → set status back
  to VERIFIED
- Reopen any FALSE_POSITIVE items flagged as "still present" → set status back
  to VERIFIED
- Log all status changes to `resolution-log.jsonl`
- Re-run `generate-views.js` and `generate-metrics.js` to reflect corrections

---

## Step 7: Categorize & Assign Sprint Placement

Create and run `scripts/debt/categorize-and-assign.js`.

**Logic:**

```
For each open item (VERIFIED/NEW) in MASTER_DEBT:

  IF category in [security, enhancements, performance]:
    → Mark as roadmap_destination (NOT Grand Plan)
    → Assign roadmap_ref based on:
      - security → "Track-S" or "M4.5"
      - enhancements → appropriate M3-M10 milestone
      - performance → "M2" or relevant milestone

  ELSE (code-quality, documentation, process, refactoring,
        engineering-productivity, ai-optimization):
    → Mark as grand_plan_destination
    → IF already in Sprint 4-7 → keep assignment
    → ELSE assign to new sprint by file path:
      - Sprint 8: scripts/ overflow
      - Sprint 9: .claude/ + docs/
      - Sprint 10: .github/ + .husky/ + config files
      - Sprint 11+: remaining scattered + cross-cutting

  ALSO: Remove security/enhancement/performance items from Sprints 4-7
         (move them to Roadmap placements)
```

Note: Sprint counts may change now that we have more items from Step 0. The
script will auto-size sprints to keep them manageable (~150-200 items each).

**Output:**

- Updated `grand-plan-manifest.json` with all sprints
- New `sprint-8-ids.json` through `sprint-N-ids.json`
- Updated `sprint-4-ids.json` through `sprint-7-ids.json` (minus roadmap-bound
  items)
- List of roadmap-bound items with milestone assignments

---

## Step 8: Generate GRAND_PLAN_V2.md

Write the comprehensive Grand Plan V2 document:

```markdown
# GRAND PLAN V2: Technical Debt Elimination

## Overview

- Total items in MASTER_DEBT: [count]
- Grand Plan items: [count] across N sprints
- Roadmap-bound items: [count] across M milestones
- Completed (Sprints 1-3): [count]
- Categories covered by Grand Plan: 6
- Categories routed to Roadmap: 3

## Decision Record

[Full table from Q&A sessions]

## Sprint Summary Table

| Sprint | Focus | Items | S0 | S1 | S2 | S3 | Status | ...

## Sprint Details (each sprint section includes):

- Item count and severity breakdown
- File/directory groups
- Dependencies on other sprints
- Execution notes

## Roadmap-Bound Items

[Items routed to Roadmap by category with milestone assignments]

## Coverage Report

- Total open items: X
- Placed in Grand Plan: Y (Z%)
- Placed in Roadmap: A (B%)
- Unplaced: 0 (0%) ← MANDATORY target
```

---

## Step 9: ROADMAP.md Reconciliation

### 9a: Replace CANON → DEBT IDs

- Read `LEGACY_ID_MAPPING.json`
- Find all 55 CANON-XXXX references in ROADMAP.md
- Replace each with corresponding DEBT-XXXX ID
- Verify all mappings exist (flag any unmapped CANON IDs)

### 9b: Add Roadmap-Bound Debt Items

- For each roadmap-bound item (security/enhancement/performance):
  - Find the appropriate Roadmap section/milestone
  - Add a checkbox item with DEBT-XXXX reference if not already present
  - Group by sub-section (e.g., Track S items go under Security track)

### 9c: Remove Inline Debt from ROADMAP

- ROADMAP checkbox items that were ingested in Step 0c:
  - If the item is pure debt (not a feature), remove the checkbox and note "See
    DEBT-XXXX"
  - If the item is mixed (feature + debt), keep the feature checkbox, add
    DEBT-XXXX reference
- This ensures ROADMAP tracks features/milestones, not debt details

### 9d: Deduplicate ROADMAP Items

- Identify remaining ROADMAP checkboxes that overlap with DEBT items
- For duplicates: keep the one with the DEBT-XXXX reference, remove the other
- Add DEBT-XXXX cross-references to items that match but weren't explicitly
  linked

### 9e: Update Section 5 (Grand Plan Overview)

- Rewrite the Grand Plan overview section with V2 data
- Update the sprint table with all active sprints
- Update completion percentages
- Reference GRAND_PLAN_V2.md as the authoritative document

---

## Step 10: Final Validation & Metrics

1. Re-run full pipeline: `generate-views.js` → `generate-metrics.js`
2. Run coverage check: verify EVERY open item has either a Grand Plan sprint OR
   Roadmap milestone assignment
3. Run `validate-schema.js --strict` on final MASTER_DEBT.jsonl
4. Verify source cleanup: grep entire repo for orphaned debt references not
   linked to DEBT-XXXX
5. Generate before/after summary report

**Expected final state:**

- **0 unplaced open items** — every item has a home
- **0 scattered debt** — MASTER_DEBT is the only source of truth
- **All CANON IDs replaced** with DEBT IDs everywhere
- **GRAND_PLAN_V2.md** is authoritative for debt elimination sprints
- **ROADMAP.md** is authoritative for feature/security/enhancement milestones
- **MASTER_DEBT.jsonl** is the single source of truth for ALL item data
- **Source documents** cleaned — debt removed, DEBT-XXXX references added

---

## Execution Order

```
Step 0 (EXHAUSTIVE EXTRACTION — scan entire repo, ingest everything)
  ├── 0a: Code TODO/FIXME extraction
  ├── 0b: Dec 2025 audit report extraction
  ├── 0c: ROADMAP.md debt item extraction
  ├── 0d: SESSION_CONTEXT.md extraction
  ├── 0e: review-needed.jsonl processing
  ├── 0f: .claude/ context extraction
  └── 0g: SonarCloud fresh sync (--full)
        │
Step 0h (INTAKE CLEANING — dedup, false-positive, completed-work, verify)
  ├── Multi-method dedup (exact title, fuzzy phrase, file+line, keyword overlap)
  ├── False positive detection (informational, aspirational, external)
  ├── Completed work detection (archived, git history, existing RESOLVED)
  └── Item verification (file exists, line valid, pattern present, category/severity)
        │
Step 1 (FULL PIPELINE REBUILD — all cleaned sources → MASTER_DEBT)
        │
Step 2 (SOURCE CLEANUP — remove debt from original locations)
        │
Step 3 ─────────┐
Step 4 ─────────┤ (Steps 3-5 can run in parallel)
Step 5 ─────────┘
        │
Step 6 (apply corrections from audit results)
        │
Step 7 (categorize & assign sprints)
        │
Step 8 ─────────┐ (Steps 8-9 can run in parallel)
Step 9 ─────────┘
        │
Step 10 (final validation — zero unplaced, zero scattered)
```

**Estimated scope:** 5 new files, 5+ modified files, 3 new scripts, 10 execution
steps **Estimated new items ingested:** 300-600 (after dedup with existing
2,738) **Expected final MASTER_DEBT size:** 3,000-3,500 items
