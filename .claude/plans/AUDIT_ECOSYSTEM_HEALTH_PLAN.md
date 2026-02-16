# Implementation Plan: Audit Ecosystem Full Health Remediation

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-16
**Status:** PLANNED
<!-- prettier-ignore-end -->

## Summary

Full audit ecosystem health remediation: consolidate all audit docs under
`docs/audits/`, fix all skill inconsistencies, create missing infrastructure
(directories, scripts, index), update all cross-references, and ensure the
documented system matches reality on disk.

## Decision Record (from Q&A — 3 batches, 11 decisions)

| Decision                | Choice                                                            |
| ----------------------- | ----------------------------------------------------------------- |
| Multi-AI location       | Move `docs/multi-ai-audit/` → `docs/audits/multi-ai/`             |
| Tracker location        | Move `docs/AUDIT_TRACKER.md` → `docs/audits/AUDIT_TRACKER.md`     |
| Ad-hoc ai-opt results   | Move `docs/ai-optimization-audit/` → standard single-session path |
| Codification doc        | Move to `docs/audits/` as reference doc, update status            |
| Empty directories       | Scaffold all 9 single-session + comprehensive + multi-ai dirs     |
| Results index           | Auto-generated `RESULTS_INDEX.md` via script                      |
| Skill fixes             | Fix ALL skills (paths, output dirs, consistency)                  |
| Old locations           | Delete entirely after move (no pointer files)                     |
| Missing scripts         | Create all missing scripts and wire into npm                      |
| Index generation        | Auto-generated via `scripts/audit/generate-results-index.js`      |
| Cross-reference updates | Full grep + fix all refs across entire codebase                   |

---

## Current State — Problems Found

### P1: Scattered Documentation (4 locations → should be 1)

- `docs/audits/` — hub + standards (correct location)
- `docs/multi-ai-audit/` — templates + coordinator (wrong location)
- `docs/ai-optimization-audit/` — ad-hoc results (wrong location)
- `docs/plans/AUDIT_ECOSYSTEM_CODIFICATION.md` — codification plan (wrong
  location)
- `docs/AUDIT_TRACKER.md` — threshold tracker (wrong location)

### P2: Missing Directory Structure

- Only 3 of 9 single-session category dirs exist (ai-optimization, enhancements,
  process)
- `docs/audits/comprehensive/` doesn't exist
- `docs/audits/multi-ai/` doesn't exist (multi-ai results have no standard home)

### P3: Skill Inconsistencies

- Output path formats vary across skills (some use `${AUDIT_DATE}`, some use
  `[YYYY-MM-DD]`, some use `$(date`)
- `audit-engineering-productivity` output path inconsistent with standard
  pattern
- `audit-comprehensive` output goes to flat
  `docs/audits/comprehensive/COMPREHENSIVE_AUDIT_REPORT.md` (not dated subdir)

### P4: Missing npm Scripts

- `aggregate:audit-findings` → points to `scripts/aggregate-audit-findings.js`
  (exists but references old paths)
- `audit:reset` → points to `scripts/reset-audit-triggers.js` (exists)
- `audit:validate` → points to `scripts/validate-audit.js` (exists)
- **Missing:** `audit:results-index` for generating RESULTS_INDEX.md
- **Missing:** `audit:health` for checking overall audit system health

### P5: Script-to-Doc Path Mismatches

- Docs reference `scripts/debt/consolidate-all.js` — exists ✓
- Docs reference `scripts/multi-ai/extract-agent-findings.js` — exists ✓
- Docs reference `scripts/multi-ai/normalize-format.js` — exists ✓
- Docs reference `scripts/multi-ai/aggregate-category.js` — exists ✓
- Docs reference `scripts/multi-ai/unify-findings.js` — exists ✓
- Scripts in `scripts/audit/` exist but aren't referenced in audit docs

### P6: Cross-Reference Breakage Risk

- Moving `docs/multi-ai-audit/` will break refs in: all skills, COORDINATOR.md,
  README.md, AUDIT_STANDARDS.md, multi-ai skill
- Moving `docs/AUDIT_TRACKER.md` will break refs in: skills, session docs, hooks

---

## Files to Create/Modify

### New Files (3)

1. **`scripts/audit/generate-results-index.js`** — Auto-generate
   RESULTS_INDEX.md
2. **`docs/audits/RESULTS_INDEX.md`** — Generated index of all audit results
3. **`.gitkeep` files** — In 6 new empty directories

### Moved Files (4 source locations)

1. **`docs/multi-ai-audit/*`** → **`docs/audits/multi-ai/`** (all contents)
2. **`docs/AUDIT_TRACKER.md`** → **`docs/audits/AUDIT_TRACKER.md`**
3. **`docs/ai-optimization-audit/*`** → merge into
   **`docs/audits/single-session/ai-optimization/audit-2026-02-13/`**
4. **`docs/plans/AUDIT_ECOSYSTEM_CODIFICATION.md`** →
   **`docs/audits/AUDIT_ECOSYSTEM_CODIFICATION.md`**

### New Directories (6)

1. `docs/audits/single-session/code/`
2. `docs/audits/single-session/security/`
3. `docs/audits/single-session/performance/`
4. `docs/audits/single-session/refactoring/`
5. `docs/audits/single-session/documentation/`
6. `docs/audits/single-session/engineering-productivity/`
7. `docs/audits/comprehensive/`

(Note: `docs/audits/multi-ai/` created by move, single-session/ai-optimization,
enhancements, process already exist)

### Modified Files (20+)

1. **`docs/audits/README.md`** — Update all internal refs to new multi-ai/ path,
   add RESULTS_INDEX link
2. **`docs/audits/AUDIT_STANDARDS.md`** — Update multi-ai template refs, tracker
   ref, results paths
3. **`docs/audits/AUDIT_ECOSYSTEM_CODIFICATION.md`** — Update status to
   COMPLETED/REFERENCE
4. **`docs/audits/multi-ai/README.md`** (moved) — Update internal template refs
   (relative paths change)
5. **`docs/audits/multi-ai/COORDINATOR.md`** (moved) — Update template refs
6. **`.claude/skills/audit-code/SKILL.md`** — Fix output path format consistency
7. **`.claude/skills/audit-security/SKILL.md`** — Fix output path format
   consistency
8. **`.claude/skills/audit-performance/SKILL.md`** — Fix output path format
   consistency
9. **`.claude/skills/audit-refactoring/SKILL.md`** — Fix output path format
   consistency
10. **`.claude/skills/audit-documentation/SKILL.md`** — Fix output path format
    consistency
11. **`.claude/skills/audit-engineering-productivity/SKILL.md`** — Fix output
    path
12. **`.claude/skills/audit-enhancements/SKILL.md`** — Fix output path format
13. **`.claude/skills/audit-ai-optimization/SKILL.md`** — Verify paths correct
14. **`.claude/skills/audit-comprehensive/SKILL.md`** — Update multi-ai refs,
    verify all 9 domains
15. **`.claude/skills/audit-aggregator/SKILL.md`** — Update input paths
16. **`.claude/skills/multi-ai-audit/SKILL.md`** — Update all
    template/coordinator refs
17. **`.claude/skills/create-audit/SKILL.md`** — Update standards refs
18. **`package.json`** — Add `audit:results-index` npm script
19. **All files referencing `docs/multi-ai-audit/`** — Update to
    `docs/audits/multi-ai/`
20. **All files referencing `docs/AUDIT_TRACKER.md`** — Update to
    `docs/audits/AUDIT_TRACKER.md`
21. **All files referencing `docs/ai-optimization-audit/`** — Update to standard
    path

### Deleted (after move)

1. `docs/multi-ai-audit/` (entire directory)
2. `docs/ai-optimization-audit/` (entire directory)
3. `docs/plans/AUDIT_ECOSYSTEM_CODIFICATION.md` (file only)

---

## Step 1: Create Directory Scaffold

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
│   ├── code/                          (CREATE)
│   ├── security/                      (CREATE)
│   ├── performance/                   (CREATE)
│   ├── refactoring/                   (CREATE)
│   ├── documentation/                 (CREATE)
│   ├── engineering-productivity/      (CREATE)
│   ├── enhancements/                  (exists)
│   └── process/                       (exists)
├── comprehensive/                     (CREATE)
└── multi-ai/                          (will be populated by move)
    ├── README.md
    ├── COORDINATOR.md
    └── templates/
        ├── SHARED_TEMPLATE_BASE.md
        ├── AGGREGATOR.md
        └── <9 audit templates>
```

Create missing dirs with `.gitkeep` files.

---

## Step 2: Move Files to Consolidated Locations

### 2a: Move multi-ai-audit → docs/audits/multi-ai/

```bash
git mv docs/multi-ai-audit/* docs/audits/multi-ai/
# Includes: README.md, COORDINATOR.md, templates/ (with all 11 template files)
```

### 2b: Move AUDIT_TRACKER.md → docs/audits/

```bash
git mv docs/AUDIT_TRACKER.md docs/audits/AUDIT_TRACKER.md
```

### 2c: Merge ai-optimization-audit into standard location

The standard location
`docs/audits/single-session/ai-optimization/audit-2026-02-13/` already exists.
Check if it has the same content as `docs/ai-optimization-audit/`. If not,
merge. Then delete the ad-hoc location.

### 2d: Move AUDIT_ECOSYSTEM_CODIFICATION.md → docs/audits/

```bash
git mv docs/plans/AUDIT_ECOSYSTEM_CODIFICATION.md docs/audits/AUDIT_ECOSYSTEM_CODIFICATION.md
```

Update status from `PLANNED` to `COMPLETED` and add note that it's now a
reference doc.

---

## Step 3: Fix All Cross-References (Full Codebase Grep)

### 3a: Fix multi-ai-audit references

```bash
# Find all files referencing old path
grep -rl "docs/multi-ai-audit" . --include="*.md" --include="*.js" --include="*.json"
# Replace: docs/multi-ai-audit → docs/audits/multi-ai
```

**Expected hits:** audit skills, docs, scripts, possibly hooks

### 3b: Fix AUDIT_TRACKER references

```bash
grep -rl "docs/AUDIT_TRACKER\|\.\.\/AUDIT_TRACKER" . --include="*.md" --include="*.js"
# Update relative paths based on new location
```

### 3c: Fix ai-optimization-audit references

```bash
grep -rl "docs/ai-optimization-audit" . --include="*.md" --include="*.js"
# Replace with docs/audits/single-session/ai-optimization/
```

### 3d: Fix AUDIT_ECOSYSTEM_CODIFICATION references

```bash
grep -rl "plans/AUDIT_ECOSYSTEM_CODIFICATION" . --include="*.md"
# Replace with docs/audits/AUDIT_ECOSYSTEM_CODIFICATION
```

### 3e: Fix internal relative paths in moved docs

After moving `docs/multi-ai-audit/` → `docs/audits/multi-ai/`, all relative
paths in those files that reference `../technical-debt/`,
`../../AI_WORKFLOW.md`, etc. need depth adjustment (they're now one level
deeper).

---

## Step 4: Standardize All Audit Skill Output Paths

Ensure every audit skill uses the same date format pattern for output
directories.

**Standard pattern:** `docs/audits/single-session/<category>/audit-YYYY-MM-DD/`

| Skill                          | Current Pattern                                                  | Fix Needed              |
| ------------------------------ | ---------------------------------------------------------------- | ----------------------- |
| audit-code                     | `docs/audits/single-session/code/` (no date dir)                 | Add date subdir         |
| audit-security                 | `docs/audits/single-session/security/` (no date dir)             | Add date subdir         |
| audit-performance              | `docs/audits/single-session/performance/` (no date dir)          | Add date subdir         |
| audit-refactoring              | `docs/audits/single-session/refactoring/` (no date dir)          | Add date subdir         |
| audit-documentation            | `docs/audits/single-session/documentation/audit-[YYYY-MM-DD]/`   | Normalize format        |
| audit-process                  | `docs/audits/single-session/process/audit-${AUDIT_DATE}`         | OK (uses variable)      |
| audit-engineering-productivity | Inconsistent path                                                | Fix to standard pattern |
| audit-enhancements             | `docs/audits/single-session/enhancements/audit-$(date`           | Normalize format        |
| audit-ai-optimization          | `docs/audits/single-session/ai-optimization/audit-${AUDIT_DATE}` | OK                      |

For each skill, ensure:

1. Output path uses `docs/audits/single-session/<category>/audit-YYYY-MM-DD/`
   consistently
2. Date variable format is consistent (`${AUDIT_DATE}` preferred)
3. Post-audit section references correct TDMS intake paths

---

## Step 5: Fix audit-comprehensive Output Structure

Current: outputs to flat
`docs/audits/comprehensive/COMPREHENSIVE_AUDIT_REPORT.md` Target:
`docs/audits/comprehensive/audit-YYYY-MM-DD/` with per-domain reports inside

Update the skill to:

1. Create dated subdirectory for each run
2. Place per-domain reports inside dated dir
3. Place aggregated COMPREHENSIVE_AUDIT_REPORT.md inside dated dir
4. Update aggregator to read from dated dir

---

## Step 6: Create generate-results-index.js Script

**File:** `scripts/audit/generate-results-index.js`

Scans `docs/audits/` and generates `docs/audits/RESULTS_INDEX.md`:

```markdown
# Audit Results Index

<!-- AUTO-GENERATED — do not edit manually -->
<!-- Run: npm run audit:results-index -->

## Single-Session Audits

| Category        | Date       | Findings              | Report            |
| --------------- | ---------- | --------------------- | ----------------- |
| ai-optimization | 2026-02-14 | [findings.jsonl](...) | [REPORT.md](...)  |
| ai-optimization | 2026-02-13 | [findings.jsonl](...) | [SUMMARY.md](...) |
| enhancements    | 2026-02-11 | ...                   | ...               |
| process         | 2026-02-09 | ...                   | ...               |

## Comprehensive Audits

| Date       | Domains | Report |
| ---------- | ------- | ------ |
| (none yet) |         |        |

## Multi-AI Audits

| Session    | Date | Category | Report |
| ---------- | ---- | -------- | ------ |
| (none yet) |      |          |        |
```

Logic:

1. Walk `docs/audits/single-session/*/audit-*/` for single-session results
2. Walk `docs/audits/comprehensive/audit-*/` for comprehensive results
3. Walk `docs/audits/multi-ai/*/` for multi-AI results (skip templates/)
4. Sort by date descending
5. Write to `docs/audits/RESULTS_INDEX.md`

---

## Step 7: Wire Up npm Scripts

**In `package.json`:**

```json
"audit:results-index": "node scripts/audit/generate-results-index.js"
```

Also verify these existing scripts still work after the moves:

- `aggregate:audit-findings` — may reference old `docs/multi-ai-audit/` paths
- `audit:validate` — verify it checks the right locations
- `audit:reset` — verify it updates `docs/audits/AUDIT_TRACKER.md` (new path)

---

## Step 8: Update Governance Documents

### 8a: docs/audits/README.md

- Update multi-ai template links to `./multi-ai/templates/...` (from
  `../multi-ai-audit/templates/...`)
- Update AUDIT_TRACKER link to `./AUDIT_TRACKER.md` (from `../AUDIT_TRACKER.md`)
- Add RESULTS_INDEX.md to key references
- Add AUDIT_ECOSYSTEM_CODIFICATION.md to key references
- Verify mermaid diagram paths still accurate

### 8b: docs/audits/AUDIT_STANDARDS.md

- Update multi-ai template standard ref paths
- Update AUDIT_TRACKER reference
- Verify all section cross-references

### 8c: docs/audits/AUDIT_ECOSYSTEM_CODIFICATION.md (moved)

- Change status from `PLANNED` to `COMPLETED/REFERENCE`
- Add note: "This document captures the original design decisions. For current
  standards see AUDIT_STANDARDS.md"

### 8d: docs/audits/multi-ai/README.md (moved)

- Fix all relative paths (one level deeper now)
- Template links: `./templates/...` (unchanged, still relative)
- External refs: `../../technical-debt/...`, `../../../AI_WORKFLOW.md`, etc.

### 8e: docs/audits/multi-ai/COORDINATOR.md (moved)

- Fix all relative template paths
- Fix external doc references

---

## Step 9: Update docs/audits/multi-ai/ Template Internal Refs

Each of the 11 template files in `docs/audits/multi-ai/templates/` may reference
sibling files, parent docs, or external docs. After the move, relative paths to
anything outside `docs/audits/multi-ai/` need updating.

Quick grep for `../` patterns in each template and fix.

---

## Step 10: Verify Script Path References

Check all scripts in `scripts/debt/`, `scripts/multi-ai/`, `scripts/audit/` for
hardcoded paths that reference old locations:

```bash
grep -rn "multi-ai-audit\|ai-optimization-audit\|AUDIT_TRACKER" scripts/
```

Fix any hits to point to new locations.

---

## Step 11: Full Cross-Reference Verification

### 11a: Path Reference Verification

- Grep ALL `.claude/skills/audit-*/SKILL.md` for path references
- Verify every referenced path exists on disk
- Verify every referenced script exists

### 11b: Skill Cross-References

- Verify audit-comprehensive references all 9 domain audit skill names
- Verify audit-aggregator references match comprehensive output structure
- Verify multi-ai template count matches actual files
- Verify SKILL_INDEX.md lists all audit skills

### 11c: TDMS Integration Verification

- Verify `intake-audit.js` recognizes all 9 categories
- Verify `validate-schema.js` accepts all 9 categories
- Verify FALSE_POSITIVES path is consistent everywhere

### 11d: Documentation Cross-References

- `npm run crossdoc:check` — verify no broken dependencies
- `npm run docs:check` — verify docs pass
- `npm run docs:headers` — verify headers
- `npm run skills:validate` — verify skills
- `npm run patterns:check` — no violations

### 11e: npm Script Verification

- Run each audit-related npm script with `--dry-run` or minimal input
- Verify `audit:results-index` generates valid output
- Verify `aggregate:audit-findings` works with new paths

---

## Execution Strategy

```
Wave 1 — Structure (parallel, no dependencies):
  [Step 1: Create directory scaffold]
  [Step 6: Create generate-results-index.js]

Wave 2 — Moves (sequential, needs dirs from Wave 1):
  [Step 2a: Move multi-ai-audit]
  [Step 2b: Move AUDIT_TRACKER]
  [Step 2c: Merge ai-optimization-audit]
  [Step 2d: Move AUDIT_ECOSYSTEM_CODIFICATION]

Wave 3 — Fix References (parallel, needs moves from Wave 2):
  [Step 3: All cross-reference fixes]
  [Step 4: Standardize skill output paths]
  [Step 5: Fix comprehensive output structure]
  [Step 8: Update governance documents]
  [Step 9: Update template internal refs]
  [Step 10: Verify script paths]

Wave 4 — Wiring (needs Wave 3):
  [Step 7: Wire npm scripts]

Wave 5 — Verification (needs all prior):
  [Step 11: Full cross-reference verification]
  [Generate RESULTS_INDEX.md using new script]
```

Estimated: ~30-45 minutes with parallel execution.

---

## Final Target State

```
docs/audits/                              ← SINGLE HUB for everything audit
├── README.md                             ← Ecosystem overview, mermaid diagram
├── AUDIT_STANDARDS.md                    ← Canonical standards
├── AUDIT_TRACKER.md                      ← Threshold tracking (moved from docs/)
├── AUDIT_ECOSYSTEM_CODIFICATION.md       ← Reference doc (moved from docs/plans/)
├── RESULTS_INDEX.md                      ← Auto-generated results index
├── single-session/                       ← All single-session audit results
│   ├── ai-optimization/
│   │   ├── audit-2026-02-13/
│   │   └── audit-2026-02-14/
│   ├── code/                             ← (empty, scaffolded)
│   ├── security/                         ← (empty, scaffolded)
│   ├── performance/                      ← (empty, scaffolded)
│   ├── refactoring/                      ← (empty, scaffolded)
│   ├── documentation/                    ← (empty, scaffolded)
│   ├── engineering-productivity/         ← (empty, scaffolded)
│   ├── enhancements/
│   │   └── audit-2026-02-11/
│   └── process/
│       └── audit-2026-02-09/
├── comprehensive/                        ← Full-sweep results (scaffolded)
└── multi-ai/                             ← Multi-AI system (moved from docs/)
    ├── README.md
    ├── COORDINATOR.md
    └── templates/
        ├── SHARED_TEMPLATE_BASE.md
        ├── AGGREGATOR.md
        ├── CODE_REVIEW_PLAN.md
        ├── SECURITY_AUDIT_PLAN.md
        ├── PERFORMANCE_AUDIT_PLAN.md
        ├── REFACTORING_AUDIT.md
        ├── DOCUMENTATION_AUDIT.md
        ├── PROCESS_AUDIT.md
        ├── ENGINEERING_PRODUCTIVITY_AUDIT.md
        ├── ENHANCEMENT_AUDIT.md
        └── AI_OPTIMIZATION_AUDIT.md

Deleted (no traces):
  docs/multi-ai-audit/                    ← gone
  docs/ai-optimization-audit/             ← gone
  docs/plans/AUDIT_ECOSYSTEM_CODIFICATION.md ← gone
  docs/AUDIT_TRACKER.md                   ← gone
```

---

## Verification Checklist

1. [ ] All audit docs live under `docs/audits/` — no stragglers
2. [ ] All 9 single-session category dirs exist
3. [ ] `docs/audits/comprehensive/` exists
4. [ ] `docs/audits/multi-ai/` has all templates + coordinator
5. [ ] Old locations deleted: `docs/multi-ai-audit/`,
       `docs/ai-optimization-audit/`
6. [ ] Zero grep hits for `docs/multi-ai-audit` in codebase
7. [ ] Zero grep hits for `docs/ai-optimization-audit` in codebase
8. [ ] Zero grep hits for `docs/AUDIT_TRACKER.md` (old path) in codebase
9. [ ] All audit skills use consistent output path format
10. [ ] `npm run audit:results-index` generates valid index
11. [ ] `npm run crossdoc:check` passes
12. [ ] `npm run skills:validate` passes
13. [ ] `npm run docs:headers` passes
14. [ ] RESULTS_INDEX.md reflects all existing audit results
15. [ ] AUDIT_ECOSYSTEM_CODIFICATION.md status updated to COMPLETED
