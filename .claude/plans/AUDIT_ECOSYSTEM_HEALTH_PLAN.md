# Audit Ecosystem Full Health Remediation Plan

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-02-16
**Status:** APPROVED
**Scope:** Full audit system health — structure, skills, scripts, templates, docs, process, improvements
<!-- prettier-ignore-end -->

---

## Executive Summary

Full remediation of the audit ecosystem across 8 waves and 39 steps. Covers:
documentation/folder consolidation, 9-category alignment, TDMS pipeline bug
fixes, skill rewrites to AUDIT_STANDARDS.md compliance, missing docs creation,
process/automation fixes, cross-reference verification, and 8 forward-looking
improvements.

**Scale:** 41 issues found (7 critical, 12 high, 13 medium, 9 low) across 4
dimensions: skill health, TDMS pipeline, process/tracking, multi-AI templates.

---

## Audit Findings Summary — 41 Issues

### Dimension 1: Skill Health (17 issues)

Compliance scores against AUDIT_STANDARDS.md Section 5:

| Skill                          | Score | Issues                                                                   |
| ------------------------------ | ----- | ------------------------------------------------------------------------ |
| audit-code                     | 100%  | None                                                                     |
| audit-security                 | 100%  | None                                                                     |
| audit-performance              | 95%   | Minor output path inconsistency                                          |
| audit-process                  | 95%   | Minor output path inconsistency                                          |
| audit-ai-optimization          | 95%   | Minor output path inconsistency                                          |
| audit-engineering-productivity | 80%   | Output path writes to comprehensive/ instead of single-session/          |
| audit-enhancements             | 70%   | **Uses I0-I3 severity instead of S0-S3**; non-standard structure         |
| audit-comprehensive            | 65%   | **3 broken cross-refs to non-existent docs**; missing Stage 2.5          |
| audit-refactoring              | 57%   | **Missing Purpose, Exec Mode, Agent Architecture sections**              |
| audit-documentation            | 50%   | **v2.0 rewrite broke AUDIT_STANDARDS compliance**; Post-Audit incomplete |
| multi-ai-audit                 | 35%   | No frontmatter; structural non-compliance                                |
| audit-aggregator               | 25%   | No frontmatter; minimal structure                                        |

### Dimension 2: TDMS Pipeline (8 issues)

| Issue                                                         | Severity     | File                                |
| ------------------------------------------------------------- | ------------ | ----------------------------------- |
| `audit-schema.json` missing ai-optimization                   | **CRITICAL** | `scripts/config/audit-schema.json`  |
| `state-manager.js` VALID_CATEGORIES missing 2 cats            | **CRITICAL** | `scripts/multi-ai/state-manager.js` |
| `intake-audit.js` loses confidence field                      | HIGH         | `scripts/debt/intake-audit.js`      |
| `intake-audit.js` no verification_steps enforcement           | HIGH         | `scripts/debt/intake-audit.js`      |
| `validate-schema.js` type validation = warning not error      | HIGH         | `scripts/debt/validate-schema.js`   |
| `validate-schema.js` no source_id format validation           | MEDIUM       | `scripts/debt/validate-schema.js`   |
| `validate-schema.js` no verification_steps enforcement        | MEDIUM       | `scripts/debt/validate-schema.js`   |
| `generate-metrics.js` age calc bug: `created_at` vs `created` | **CRITICAL** | `scripts/debt/generate-metrics.js`  |

### Dimension 3: Process & Tracking (8 issues)

| Issue                                        | Severity | Location                                      |
| -------------------------------------------- | -------- | --------------------------------------------- |
| AUDIT_TRACKER.md missing ai-optimization row | HIGH     | `docs/audits/AUDIT_TRACKER.md`                |
| COORDINATOR.md stale (missing 2 newest cats) | HIGH     | `docs/audits/multi-ai/COORDINATOR.md`         |
| COORDINATOR.md baselines from 2026-01-11     | MEDIUM   | `docs/audits/multi-ai/COORDINATOR.md`         |
| No threshold enforcement hooks               | MEDIUM   | Missing                                       |
| AI_WORKFLOW.md audit references outdated     | MEDIUM   | `AI_WORKFLOW.md`                              |
| Codification doc status still PLANNED        | LOW      | `docs/audits/AUDIT_ECOSYSTEM_CODIFICATION.md` |
| Audit docs scattered across 4 locations      | HIGH     | Multiple                                      |
| Missing directory scaffold (6 of 9 dirs)     | MEDIUM   | `docs/audits/single-session/`                 |

### Dimension 4: Multi-AI Templates (8 issues)

| Issue                                                   | Severity     | Location                            |
| ------------------------------------------------------- | ------------ | ----------------------------------- |
| Template naming inconsistency (\_PLAN.md vs \_AUDIT.md) | MEDIUM       | `docs/audits/multi-ai/templates/`   |
| SHARED_TEMPLATE_BASE incomplete                         | HIGH         | `templates/SHARED_TEMPLATE_BASE.md` |
| 7 of 9 templates missing quality guardrails             | HIGH         | Various templates                   |
| No template compliance validation                       | MEDIUM       | Missing                             |
| 3 referenced docs in comprehensive don't exist          | **CRITICAL** | `audit-comprehensive/SKILL.md`      |
| audit-comprehensive only covers 7 domains (needs 9)     | **CRITICAL** | `audit-comprehensive/SKILL.md`      |
| audit-aggregator expects 7 reports (needs 9)            | **CRITICAL** | `audit-aggregator/SKILL.md`         |
| Output path inconsistencies across skills               | HIGH         | Multiple SKILL.md files             |

---

## Decision Record (5 Q&A Batches + Improvements)

| #   | Decision                      | Choice                                                                             |
| --- | ----------------------------- | ---------------------------------------------------------------------------------- |
| 1   | Multi-AI location             | Move `docs/audits/multi-ai/` -> `docs/audits/multi-ai/`                            |
| 2   | Tracker location              | Move `docs/audits/AUDIT_TRACKER.md` -> `docs/audits/AUDIT_TRACKER.md`              |
| 3   | Ad-hoc ai-opt results         | Move `docs/audits/single-session/ai-optimization/` -> standard single-session path |
| 4   | Codification doc              | Move to `docs/audits/` as reference doc, update status                             |
| 5   | Empty directories             | Scaffold all 9 single-session + comprehensive + multi-ai dirs                      |
| 6   | Results index                 | Auto-generated `RESULTS_INDEX.md` via script                                       |
| 7   | Skill fixes                   | Fix ALL skills (paths, output dirs, consistency)                                   |
| 8   | Old locations                 | Delete entirely after move (no pointer files)                                      |
| 9   | Missing scripts               | Create all missing scripts and wire into npm                                       |
| 10  | Index generation              | Auto-generated via `scripts/audit/generate-results-index.js`                       |
| 11  | Cross-reference updates       | Full grep + fix all refs across entire codebase                                    |
| 12  | Severity scale conflict       | Standardize to S0-S3 everywhere (fix I0-I3 in audit-enhancements)                  |
| 13  | Non-compliant skill approach  | Full rewrite to match AUDIT_STANDARDS.md Section 5                                 |
| 14  | Threshold enforcement         | Session-start warnings (not auto-trigger)                                          |
| 15  | Missing referenced docs       | Create all 3 non-existent docs that comprehensive references                       |
| 16  | TDMS script bugs              | Fix all bugs (intake, validate, metrics)                                           |
| 17  | npm scripts                   | Add all missing audit-related npm scripts                                          |
| 18  | Scope                         | Full remediation — everything audit-related                                        |
| 19  | Post-audit automation         | YES — create script to auto-intake, auto-views, auto-commit                        |
| 20  | Commit counter                | YES — hook-based threshold enforcement                                             |
| 21  | Pre-audit check               | YES — verify prerequisites before running audit                                    |
| 22  | Trend/diff tracking           | YES — compare findings across audit runs                                           |
| 23  | Context recovery standard     | YES — standardize context recovery in all audit skills                             |
| 24  | Audit health skill            | YES — /audit-health meta-check                                                     |
| 25  | Resolution feedback loop      | YES — track which findings get fixed                                               |
| 26  | Template compliance validator | YES — automated template standard check                                            |
| 27  | Multi-AI category scoping     | Modify existing skill to allow 1, N, or all categories                             |

---

## Wave 1: Structure (Steps 1-3)

### Step 1: Scaffold All Directories

Create the complete target directory structure before moving anything.

```
docs/audits/
├── README.md                          (exists)
├── AUDIT_STANDARDS.md                 (exists)
├── AUDIT_TRACKER.md                   (will be moved here)
├── AUDIT_ECOSYSTEM_CODIFICATION.md    (will be moved here)
├── RESULTS_INDEX.md                   (will be generated)
├── single-session/
│   ├── ai-optimization/               (exists)
│   ├── code/                          (CREATE + .gitkeep)
│   ├── security/                      (CREATE + .gitkeep)
│   ├── performance/                   (CREATE + .gitkeep)
│   ├── refactoring/                   (CREATE + .gitkeep)
│   ├── documentation/                 (CREATE + .gitkeep)
│   ├── engineering-productivity/      (CREATE + .gitkeep)
│   ├── enhancements/                  (exists)
│   └── process/                       (exists)
├── comprehensive/                     (CREATE + .gitkeep)
└── multi-ai/                          (will be populated by move)
```

Create 7 new directories with `.gitkeep` files.

### Step 2: Move All Files (4 Source Locations -> Consolidated)

**2a: Move `docs/audits/multi-ai/*` -> `docs/audits/multi-ai/`**

All contents including: README.md, COORDINATOR.md, templates/ (11 files:
SHARED_TEMPLATE_BASE.md, AGGREGATOR.md, CODE_REVIEW_PLAN.md,
SECURITY_AUDIT_PLAN.md, PERFORMANCE_AUDIT_PLAN.md, REFACTORING_AUDIT.md,
DOCUMENTATION_AUDIT.md, PROCESS_AUDIT.md, ENGINEERING_PRODUCTIVITY_AUDIT.md,
ENHANCEMENT_AUDIT.md, AI_OPTIMIZATION_AUDIT.md).

```bash
git mv docs/audits/multi-ai/* docs/audits/multi-ai/
rmdir docs/audits/multi-ai
```

**2b: Move `docs/audits/AUDIT_TRACKER.md` -> `docs/audits/AUDIT_TRACKER.md`**

```bash
git mv docs/audits/AUDIT_TRACKER.md docs/audits/AUDIT_TRACKER.md
```

**2c: Merge `docs/audits/single-session/ai-optimization/` into standard
location**

Check if `docs/audits/single-session/ai-optimization/audit-2026-02-13/` already
has the same content. If not, merge findings and summary. Then delete the ad-hoc
location.

```bash
# Compare and merge
# Then: git rm -r docs/audits/single-session/ai-optimization/
```

**2d: Move `docs/audits/AUDIT_ECOSYSTEM_CODIFICATION.md` -> `docs/audits/`**

```bash
git mv docs/audits/AUDIT_ECOSYSTEM_CODIFICATION.md docs/audits/AUDIT_ECOSYSTEM_CODIFICATION.md
```

Update status from `PLANNED` to `COMPLETED/REFERENCE`.

### Step 3: Fix All Cross-References from Moves

Full codebase grep and fix for every moved path:

**3a: Fix `docs/audits/multi-ai` references**

```bash
grep -rl "docs/audits/multi-ai" . --include="*.md" --include="*.js" --include="*.json"
# Replace: docs/audits/multi-ai -> docs/audits/multi-ai
```

Expected hits: all audit skills, README files, AUDIT_STANDARDS.md, scripts,
possibly hooks.

**3b: Fix `docs/audits/AUDIT_TRACKER` references**

```bash
grep -rl "AUDIT_TRACKER" . --include="*.md" --include="*.js"
# Update relative paths based on new location at docs/audits/AUDIT_TRACKER.md
```

**3c: Fix `docs/audits/single-session/ai-optimization` references**

```bash
grep -rl "ai-optimization-audit" . --include="*.md" --include="*.js"
# Replace with docs/audits/single-session/ai-optimization/
```

**3d: Fix `audits/AUDIT_ECOSYSTEM_CODIFICATION` references**

```bash
grep -rl "AUDIT_ECOSYSTEM_CODIFICATION" . --include="*.md"
# Replace with docs/audits/AUDIT_ECOSYSTEM_CODIFICATION
```

**3e: Fix internal relative paths in moved docs**

After moving `docs/audits/multi-ai/` -> `docs/audits/multi-ai/`, all relative
paths in those files that reference `../technical-debt/`,
`../../AI_WORKFLOW.md`, etc. need depth adjustment (one level deeper now).

Similarly fix relative paths in AUDIT_TRACKER.md and CODIFICATION.md.

---

## Wave 2: Category Alignment (Steps 4-5)

### Step 4: Fix 9-Category Definitions Everywhere

The 9 canonical categories: `code-quality`, `security`, `performance`,
`refactoring`, `documentation`, `process`, `engineering-productivity`,
`enhancements`, `ai-optimization`.

**4a: `scripts/config/audit-schema.json`** — Currently has 8 categories. Add
`ai-optimization`.

**4b: `scripts/multi-ai/state-manager.js`** — `VALID_CATEGORIES` array (lines
33-41) only has 7 entries. Add `enhancements` AND `ai-optimization`. This is a
**CRITICAL BLOCKER** — without this fix, 2 of 9 audit types cannot run through
the multi-AI pipeline.

**4c: `scripts/debt/intake-audit.js`** — Verify category validation accepts all
9 categories. Add `ai-optimization` if missing.

**4d: `scripts/debt/validate-schema.js`** — Verify category enum includes all 9
categories. Add missing ones.

**4e: `scripts/debt/extract-audits.js`** — Verify category normalization handles
all 9.

### Step 5: Standardize Enhancement Severity Scale

`audit-enhancements/SKILL.md` uses `I0-I3` (Impact scale) instead of the
standard `S0-S3` (Severity scale) defined in AUDIT_STANDARDS.md Section 4.

- Rewrite the severity section to use S0-S3
- Update all agent prompts within the skill to reference S0-S3
- Add mapping guidance: I0->S0, I1->S1, I2->S2, I3->S3

---

## Wave 3: TDMS Pipeline Fixes (Steps 6-11)

### Step 6: Fix `scripts/debt/intake-audit.js`

**Bug 1: Confidence field lost during intake.** The script logs confidence to
`intake-log.jsonl` but doesn't persist it to `MASTER_DEBT.jsonl`. Fix: include
`confidence` in the output schema mapping.

**Bug 2: No verification_steps enforcement for S0/S1.** Critical and high
severity findings should require `verification_steps` field. Fix: add validation
that warns (or errors) when S0/S1 findings lack verification_steps.

### Step 7: Fix `scripts/debt/validate-schema.js`

**Bug 1: Type validation is warning, not error** (lines 94-97). The `type` field
should be validated strictly — invalid types should fail validation, not just
warn. Fix: change from `console.warn` to validation error.

**Bug 2: No `source_id` format validation.** The `source_id` field should follow
the pattern `audit-<category>-YYYY-MM-DD`. Fix: add regex validation.

**Bug 3: No `verification_steps` enforcement.** For S0/S1 severity findings,
`verification_steps` should be required. Fix: add conditional required field
check.

### Step 8: Fix `scripts/debt/generate-metrics.js`

**Bug: Age calculation uses `created_at` but MASTER_DEBT.jsonl uses `created`.**
This causes all age calculations to return NaN or 0. Fix: change field reference
from `created_at` to `created`.

### Step 9: Add Missing npm Scripts

Add to `package.json`:

```json
{
  "audit:results-index": "node scripts/audit/generate-results-index.js",
  "audit:health": "node scripts/audit/audit-health-check.js"
}
```

Also verify these existing scripts still work after Wave 1 moves:

- `aggregate:audit-findings` — may reference old `docs/audits/multi-ai/` paths
- `audit:validate` — verify correct locations
- `audit:reset` — verify uses new `docs/audits/AUDIT_TRACKER.md` path

### Step 10: Create `scripts/audit/generate-results-index.js`

New script that scans `docs/audits/` and generates
`docs/audits/RESULTS_INDEX.md`:

1. Walk `docs/audits/single-session/*/audit-*/` for single-session results
2. Walk `docs/audits/comprehensive/audit-*/` for comprehensive results
3. Walk `docs/audits/multi-ai/*/` for multi-AI results (skip `templates/`)
4. Sort by date descending
5. Generate markdown table with links to findings and reports
6. Write to `docs/audits/RESULTS_INDEX.md`

Auto-generated header: `<!-- AUTO-GENERATED -- do not edit manually -->`

### Step 11: Create `scripts/audit/audit-health-check.js`

New script that checks overall audit system health:

1. Verify all 9 category directories exist
2. Verify all audit skills pass basic structure check (frontmatter, required
   sections)
3. Verify `audit-schema.json` has all 9 categories
4. Verify `state-manager.js` VALID_CATEGORIES has all 9
5. Verify AUDIT_TRACKER.md has rows for all 9 categories
6. Verify no orphaned audit results outside standard paths
7. Check for stale baselines (>30 days old in COORDINATOR)
8. Output health report with pass/fail per check

---

## Wave 4: Skill Rewrites (Steps 12-18)

### Step 12: Rewrite `audit-refactoring/SKILL.md`

Current score: 57%. Missing: Purpose, Execution Mode Selection, Agent
Architecture sections.

Rewrite to match AUDIT_STANDARDS.md Section 5 structure:

- Add frontmatter (name, description, supports_parallel, etc.)
- Add Purpose section
- Add Execution Mode Selection table
- Add Pre-Audit Validation (episodic memory, FALSE_POSITIVES, prior results)
- Restructure Agent Architecture with proper stage definitions
- Ensure Output Format references JSONL_SCHEMA_STANDARD.md
- Add complete Post-Audit section (validate, intake, tracker, commit)

Fork structure from `audit-code/SKILL.md` (100% compliant).

### Step 13: Rewrite `audit-documentation/SKILL.md`

Current score: 50%. The v2.0 rewrite introduced 18 parallel agents but broke
AUDIT_STANDARDS compliance. Post-Audit section is incomplete.

- Restore proper frontmatter
- Add missing Execution Mode Selection
- Ensure Pre-Audit Validation is complete
- Fix Post-Audit section (add TDMS intake steps, tracker update)
- Keep the 18-agent architecture (it's good) but format to standard
- Ensure output path uses
  `docs/audits/single-session/documentation/audit-YYYY-MM-DD/`

### Step 14: Rewrite `audit-aggregator/SKILL.md`

Current score: 25%. Minimal structure, no frontmatter.

- Add full frontmatter
- Add Purpose section
- Restructure to standard format
- **Update to expect 9 domain reports** (currently expects 7)
- Fix input paths to read from `docs/audits/comprehensive/audit-YYYY-MM-DD/`
- Add enhancements + ai-optimization to merge/dedup logic
- Add category mapping for all 9 categories

### Step 15: Rewrite `audit-engineering-productivity/SKILL.md`

Current score: 80%. Main issue: output path writes to `comprehensive/` instead
of `single-session/engineering-productivity/`.

- Fix output path to
  `docs/audits/single-session/engineering-productivity/audit-YYYY-MM-DD/`
- Standardize frontmatter values
- Ensure Post-Audit section is complete

### Step 16: Standardize Output Paths Across All Skills

Ensure every audit skill uses the standard pattern:
`docs/audits/single-session/<category>/audit-YYYY-MM-DD/`

| Skill                  | Current                      | Fix                     |
| ---------------------- | ---------------------------- | ----------------------- |
| audit-code             | No date subdir               | Add `audit-YYYY-MM-DD/` |
| audit-security         | No date subdir               | Add `audit-YYYY-MM-DD/` |
| audit-performance      | No date subdir               | Add `audit-YYYY-MM-DD/` |
| audit-refactoring      | No date subdir               | Add `audit-YYYY-MM-DD/` |
| audit-documentation    | Uses `[YYYY-MM-DD]` brackets | Normalize format        |
| audit-process          | Uses `${AUDIT_DATE}` — OK    | No change needed        |
| audit-eng-productivity | Points to comprehensive/     | Fix to single-session/  |
| audit-enhancements     | Uses `$(date` format         | Normalize format        |
| audit-ai-optimization  | Uses `${AUDIT_DATE}` — OK    | No change needed        |

Preferred date variable format: `${AUDIT_DATE}` (set at top of each skill).

### Step 17: Remove Duplicate Persistence Rules from Skills

Several skills contain duplicated boilerplate for context recovery / state
persistence. Deduplicate and standardize per AUDIT_STANDARDS.md.

### Step 18: Fix `audit-comprehensive/SKILL.md`

Current score: 65%. Critical issues:

**18a: Fix 3 broken cross-references** to non-existent docs. The skill
references 3 documents that were planned but never created. Either create them
(Step 19) or remove the references.

**18b: Add Stage 2.5** between current Stage 2 and Stage 3:

```
Stage 2.5: Meta & Enhancement (2 agents, parallel)
  ├─ audit-enhancements
  └─ audit-ai-optimization
```

**18c: Update to 9 domain audits** (currently only references 7).

**18d: Fix output paths** to use dated comprehensive directory:
`docs/audits/comprehensive/audit-YYYY-MM-DD/`

**18e: Update estimated times** — Parallel: ~50 -> ~65 min.

**18f: Update context recovery matrix** with Stage 2.5 recovery path.

---

## Wave 5: Missing Docs + Templates (Steps 19-22)

### Step 19: Create 3 Missing Reference Docs

`audit-comprehensive/SKILL.md` references 3 documents that don't exist. Create
them:

1. **Comprehensive audit quick-start guide** — How to run a full sweep, what to
   expect, how to interpret results
2. **Comprehensive audit results interpretation guide** — How to read aggregated
   findings, severity distributions, cross-domain patterns
3. **Audit domain reference card** — Quick reference for all 9 domains with
   scope, key files, and common finding patterns

Exact file names and locations TBD based on what the broken refs point to. Grep
`audit-comprehensive/SKILL.md` for the exact references.

### Step 20: Update `SHARED_TEMPLATE_BASE.md`

The shared template base is incomplete. Add:

- Standard quality guardrails section (confidence thresholds, evidence
  requirements, false positive awareness)
- Standard TDMS integration section (intake commands, verification steps)
- Standard aggregation process section
- Updated category list (9 categories)

### Step 21: Add Quality Guardrails to 7 Templates

7 of 9 multi-AI templates are missing a quality guardrails section. Add to each:

- Minimum confidence threshold (0.7 recommended)
- Evidence requirements (specific file paths, line numbers, code snippets)
- False positive awareness (check FALSE_POSITIVES.jsonl patterns)
- Severity calibration guidelines

Templates needing guardrails:

1. CODE_REVIEW_PLAN.md
2. SECURITY_AUDIT_PLAN.md
3. PERFORMANCE_AUDIT_PLAN.md
4. REFACTORING_AUDIT.md
5. DOCUMENTATION_AUDIT.md
6. ENGINEERING_PRODUCTIVITY_AUDIT.md
7. ENHANCEMENT_AUDIT.md

(PROCESS_AUDIT.md and AI_OPTIMIZATION_AUDIT.md already have guardrails)

### Step 22: Rename Inconsistent Templates

Current naming is mixed: some use `_PLAN.md` suffix, some use `_AUDIT.md`.

Per AUDIT_STANDARDS.md Section 9, the standard is `<NAME>_AUDIT.md`.

Rename:

- `CODE_REVIEW_PLAN.md` -> `CODE_REVIEW_AUDIT.md`
- `SECURITY_AUDIT_PLAN.md` -> `SECURITY_AUDIT.md`
- `PERFORMANCE_AUDIT_PLAN.md` -> `PERFORMANCE_AUDIT.md`

Update all references to these files after rename.

---

## Wave 6: Process & Automation (Steps 23-28)

### Step 23: Update `AUDIT_TRACKER.md`

Add ai-optimization row:

```
| AI Optimization | Never | -- | 50 commits OR skill/hook/config changes |
```

Verify all 9 categories have rows with thresholds.

### Step 24: Update `COORDINATOR.md`

- Add `enhancements` and `ai-optimization` to category lists
- Update baseline metrics (currently from 2026-01-11, over 5 weeks stale)
- Add decision tree entries for new categories
- Update audit history section

### Step 25: Update `AI_WORKFLOW.md` References

Update any audit-related references in the main AI workflow doc to point to new
locations and reflect the 9-category taxonomy.

### Step 26: Update `AUDIT_ECOSYSTEM_CODIFICATION.md` Status

Change status from `PLANNED` to `COMPLETED/REFERENCE`. Add note:

```
This document captures the original design decisions from Session #158.
For current standards see AUDIT_STANDARDS.md.
For current ecosystem state see docs/audits/README.md.
```

### Step 27: Create Threshold Enforcement Hook

Add audit threshold checking to the session-start hook. When thresholds are
exceeded, display a warning (not auto-trigger):

```
⚠️  Audit threshold exceeded:
   - Code Quality: 87 commits since last audit (threshold: 50)
   - Security: 120 commits since last audit (threshold: 50)
   Consider running: /audit-code, /audit-security
```

Implementation:

- Read `docs/audits/AUDIT_TRACKER.md` for last-audit dates and thresholds
- Count commits since last audit per category
- Display warning if any threshold exceeded
- Add to existing session-start hook chain

### Step 28: Update Governance Docs

**28a: `docs/audits/README.md`** — Update all internal refs to new `./multi-ai/`
paths, add RESULTS_INDEX.md link, add AUDIT_ECOSYSTEM_CODIFICATION.md to
references, verify mermaid diagram paths.

**28b: `docs/audits/AUDIT_STANDARDS.md`** — Update multi-ai template refs,
tracker refs, verify all section cross-references still valid.

**28c: `.claude/skills/SKILL_INDEX.md`** — Verify all audit skills listed.

---

## Wave 7: Verification (Steps 29-31)

### Step 29: Full Cross-Reference Audit

**29a: Path Reference Verification**

- Grep ALL `.claude/skills/audit-*/SKILL.md` for path references
  (`docs/audits/`, `docs/technical-debt/`, `FALSE_POSITIVES`)
- Verify every referenced path exists on disk
- Verify every referenced script exists

**29b: Skill Cross-References**

- Verify `audit-comprehensive` references all 9 domain audit skill names
- Verify `audit-aggregator` references match comprehensive output structure
- Verify multi-ai template count matches actual template files
- Verify `SKILL_INDEX.md` lists all audit skills

**29c: TDMS Integration Verification**

- Verify `intake-audit.js` recognizes all 9 categories
- Verify `validate-schema.js` accepts all 9 categories
- Verify `state-manager.js` VALID_CATEGORIES has all 9
- Verify `audit-schema.json` has all 9 categories
- Verify `FALSE_POSITIVES.jsonl` path is consistent everywhere
  (`docs/technical-debt/FALSE_POSITIVES.jsonl`)

**29d: Documentation Cross-References**

- `npm run crossdoc:check` — verify no broken dependencies
- `npm run docs:check` — verify docs pass
- `npm run docs:headers` — verify headers on all files
- `npm run skills:validate` — verify all audit skills pass
- `npm run patterns:check` — no new pattern violations

**29e: npm Script Verification**

- Run each audit-related npm script with dry-run or minimal input
- Verify `audit:results-index` generates valid output
- Verify `audit:health` runs clean
- Verify `aggregate:audit-findings` works with new paths

**29f: Orphan Check**

- Verify no audit files exist outside `docs/audits/`
- Verify no broken symlinks or empty directories (except .gitkeep)
- Verify old locations fully deleted: `docs/audits/multi-ai/`,
  `docs/audits/single-session/ai-optimization/`, `docs/audits/AUDIT_TRACKER.md`
  (old path)

### Step 30: Run All Validation Scripts

```bash
npm run skills:validate
npm run crossdoc:check
npm run docs:check
npm run docs:headers
npm run patterns:check
npm run roadmap:hygiene
npm run audit:health        # new
npm run audit:results-index  # new
```

All must pass cleanly.

### Step 31: Generate Initial RESULTS_INDEX.md

Run `npm run audit:results-index` to generate the first
`docs/audits/RESULTS_INDEX.md` from all existing audit results.

---

## Wave 8: Improvements (Steps 32-39)

### Step 32: Post-Audit Automation Script

Create `scripts/audit/post-audit.js` — runs automatically after any audit:

1. Validate JSONL output schema
2. Run TDMS intake (`intake-audit.js`)
3. Regenerate views (`generate-views.js`)
4. Regenerate metrics (`generate-metrics.js`)
5. Regenerate results index (`generate-results-index.js`)
6. Update AUDIT_TRACKER.md with run date
7. Stage and commit results

Add npm script: `"audit:post": "node scripts/audit/post-audit.js"`

### Step 33: Commit Counter for Threshold Enforcement

Create `scripts/audit/count-commits-since.js`:

- Takes a category and returns commits since last audit of that category
- Reads AUDIT_TRACKER.md for last-audit dates
- Uses `git log --oneline --since=<date> | wc -l`
- Used by the session-start threshold hook (Step 27)

### Step 34: Pre-Audit Check Command

Create `scripts/audit/pre-audit-check.js`:

1. Verify output directory exists and is writable
2. Verify FALSE_POSITIVES.jsonl is readable
3. Verify TDMS pipeline scripts exist
4. Verify JSONL_SCHEMA_STANDARD.md is accessible
5. Verify episodic memory is available (if MCP connected)
6. Report any blockers before audit begins

Add npm script: `"audit:pre-check": "node scripts/audit/pre-audit-check.js"`

### Step 35: Trend/Diff Tracking Between Audit Runs

Create `scripts/audit/compare-audits.js`:

- Compare two audit runs (by date) for the same category
- Show: new findings, resolved findings, changed severity, recurring patterns
- Output as markdown diff report
- Helps track whether the codebase is improving or degrading

Add npm script: `"audit:compare": "node scripts/audit/compare-audits.js"`

### Step 36: Context Recovery Standard for Audit Skills

Add standardized context recovery section to all audit skills:

- What to save: stage completion status, agent outputs, partial findings
- Where to save: `.claude/state/audit-<category>-<date>.state.json`
- How to recover: check for state file, resume from last completed stage
- When to discard: state older than 24 hours

Update AUDIT_STANDARDS.md Section 5 with context recovery standard.

### Step 37: Audit Health Skill (`/audit-health`)

Create `.claude/skills/audit-health/SKILL.md`:

- Runs `scripts/audit/audit-health-check.js` (Step 11)
- Checks threshold status via commit counter (Step 33)
- Reports overall audit system health
- Suggests which audits to run next based on staleness and thresholds
- Quick meta-check: "Is the audit system itself healthy?"

### Step 38: Resolution Feedback Loop

Create `scripts/audit/track-resolutions.js`:

- Cross-reference MASTER_DEBT.jsonl with git history
- Identify findings that have been resolved (file changed, pattern fixed)
- Mark as `resolved` in MASTER_DEBT.jsonl
- Track resolution rate per category over time
- Feed into metrics dashboard

Add npm script: `"audit:resolutions": "node scripts/audit/track-resolutions.js"`

### Step 39: Template Compliance Validator

Create `scripts/audit/validate-templates.js`:

- Check all multi-AI templates against AUDIT_STANDARDS.md Section 6
- Verify required sections exist (Purpose, Scope, Prompt, Sub-Categories, Output
  Format, Quality Guardrails, Aggregation, TDMS Integration)
- Verify category matches 9-category taxonomy
- Verify JSONL schema examples are valid
- Report compliance score per template

Add npm script:
`"audit:validate-templates": "node scripts/audit/validate-templates.js"`

### Step 40: Multi-AI Audit Category Scoping

Modify `.claude/skills/multi-ai-audit/SKILL.md` Phase 1 (Step 1.3) to allow
selecting one, multiple, or all categories at session start.

**Current behavior:** Shows all 9 categories, user picks one at a time via the
category-by-category loop.

**New behavior:** Add scope selection before the category menu:

```
=== Multi-AI Audit: [session_id] ===

Audit scope:
  a. All categories (full 9-category sweep)
  b. Select specific categories
  c. Single category

Enter choice:
```

- **"a" / "all"**: Sets pending list to all 9 categories, starts with first
- **"b" / "select"**: Shows numbered list, user enters comma-separated (e.g.,
  `1,3,7` or `security, performance`)
- **"c" / "single"**: Shows numbered list, user picks exactly one

**State file change:** Add `selected_categories: [...]` field to
`session-state.json`. The existing category-by-category workflow (template
output -> collect findings -> aggregate -> next category -> unify) stays exactly
the same — it just iterates over whichever categories were selected instead of
implicitly assuming all 9.

**Also update `scripts/multi-ai/state-manager.js`:** The `create` command should
accept an optional `--categories` flag:

```bash
node scripts/multi-ai/state-manager.js create --categories security,performance
```

If no flag provided, defaults to all 9 (backward compatible).

**Files modified:**

- `.claude/skills/multi-ai-audit/SKILL.md` — Add scope selection to Phase 1
- `scripts/multi-ai/state-manager.js` — Add `--categories` flag to `create`
- `docs/audits/AUDIT_STANDARDS.md` — Update multi-AI workflow description

---

## Execution Strategy

```
Wave 1 — Structure (parallel, no dependencies):
  [Step 1: Scaffold directories]
  [Step 2: Move all files]
  [Step 3: Fix all cross-references]

Wave 2 — Category Alignment (parallel, after Wave 1):
  [Step 4: Fix 9-category definitions in all scripts]
  [Step 5: Standardize enhancement severity I0-I3 -> S0-S3]

Wave 3 — TDMS Pipeline Fixes (parallel, after Wave 2):
  [Step 6: Fix intake-audit.js]
  [Step 7: Fix validate-schema.js]
  [Step 8: Fix generate-metrics.js]
  [Step 9: Add npm scripts]
  [Step 10: Create generate-results-index.js]
  [Step 11: Create audit-health-check.js]

Wave 4 — Skill Rewrites (parallel by skill, after Wave 2):
  [Step 12: Rewrite audit-refactoring]
  [Step 13: Rewrite audit-documentation]
  [Step 14: Rewrite audit-aggregator]
  [Step 15: Rewrite audit-engineering-productivity]
  [Step 16: Standardize all output paths]
  [Step 17: Remove duplicate persistence rules]
  [Step 18: Fix audit-comprehensive]

Wave 5 — Missing Docs + Templates (after Wave 4):
  [Step 19: Create 3 missing reference docs]
  [Step 20: Update SHARED_TEMPLATE_BASE]
  [Step 21: Add quality guardrails to 7 templates]
  [Step 22: Rename inconsistent templates]

Wave 6 — Process & Automation (after Wave 1):
  [Step 23: Update AUDIT_TRACKER]
  [Step 24: Update COORDINATOR]
  [Step 25: Update AI_WORKFLOW]
  [Step 26: Update CODIFICATION doc status]
  [Step 27: Create threshold enforcement hook]
  [Step 28: Update governance docs]

Wave 7 — Verification (after ALL prior waves):
  [Step 29: Full cross-reference audit]
  [Step 30: Run all validation scripts]
  [Step 31: Generate RESULTS_INDEX]

Wave 8 — Improvements (after Wave 7):
  [Step 32: Post-audit automation script]
  [Step 33: Commit counter]
  [Step 34: Pre-audit check command]
  [Step 35: Trend/diff tracking]
  [Step 36: Context recovery standard]
  [Step 37: Audit health skill]
  [Step 38: Resolution feedback loop]
  [Step 39: Template compliance validator]
  [Step 40: Multi-AI audit category scoping]
```

---

## Final Verification Checklist

1. [ ] All audit docs consolidated under `docs/audits/` — no stragglers
2. [ ] All 9 single-session category dirs exist
3. [ ] Old locations fully deleted (multi-ai-audit/, ai-optimization-audit/)
4. [ ] Zero grep hits for old paths in codebase
5. [ ] All 9 categories in audit-schema.json
6. [ ] All 9 categories in state-manager.js VALID_CATEGORIES
7. [ ] All 9 categories in intake-audit.js, validate-schema.js
8. [ ] intake-audit.js preserves confidence field
9. [ ] validate-schema.js type validation is error (not warning)
10. [ ] generate-metrics.js uses `created` (not `created_at`)
11. [ ] All audit skills score 90%+ on AUDIT_STANDARDS compliance
12. [ ] audit-comprehensive references all 9 domains with Stage 2.5
13. [ ] audit-aggregator expects and processes 9 domain reports
14. [ ] All output paths use standard `audit-YYYY-MM-DD/` pattern
15. [ ] FALSE_POSITIVES path = `docs/technical-debt/FALSE_POSITIVES.jsonl`
        everywhere
16. [ ] Template naming consistent (\_AUDIT.md pattern)
17. [ ] All templates have quality guardrails section
18. [ ] AUDIT_TRACKER has rows for all 9 categories
19. [ ] COORDINATOR reflects all 9 categories with current baselines
20. [ ] RESULTS_INDEX.md generated and accurate
21. [ ] `npm run skills:validate` passes
22. [ ] `npm run crossdoc:check` passes
23. [ ] `npm run docs:headers` passes
24. [ ] `npm run patterns:check` passes
25. [ ] `npm run audit:health` passes
26. [ ] All 8 improvement scripts created and wired into npm
27. [ ] No orphaned audit files outside standard paths
28. [ ] All new files have proper document headers
29. [ ] `/multi-ai-audit` supports single, multi, and all-category scoping

---

**END OF PLAN**
