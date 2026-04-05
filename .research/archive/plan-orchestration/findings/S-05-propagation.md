# Findings: Propagation-Research Plan Inventory

**Searcher:** deep-research-searcher (plan inventory specialist) **Profile:**
codebase **Date:** 2026-03-24 **Sub-Question IDs:** S-05 **Plan Source:**
`.planning/propagation-research/PLAN.md` (165 lines, 14 steps, 4 waves)

---

## 1. Step Inventory Table

| Step ID | Wave | Description                                                                                        | Files Touched                                                                                                                               | Effort     | Internal Deps                              | Can Parallelize?                                  |
| ------- | ---- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------ | ------------------------------------------------- |
| Step 1  | W1   | Fix intake-audit.js TDMS data-loss vector -- replace direct file write with `appendMasterDebtSync` | `scripts/debt/intake-audit.js`, `scripts/lib/safe-fs.js`                                                                                    | S (30 min) | None                                       | Yes (w/ Steps 2,3,5)                              |
| Step 2  | W1   | Remove `continue-on-error: true` from CI security check                                            | `.github/workflows/ci.yml` (line 210)                                                                                                       | S (15 min) | None                                       | Yes (w/ Steps 1,3,5)                              |
| Step 3  | W1   | Add Validate & Compliance to GitHub required status checks                                         | GitHub repo Settings (web UI, not code)                                                                                                     | S (10 min) | None                                       | Yes (w/ Steps 1,2,5)                              |
| Step 4  | W1   | Fix CJS/ESM barrier -- create `sanitize-error.cjs` wrapper                                         | `scripts/lib/sanitize-error.cjs` (NEW)                                                                                                      | S (30 min) | None                                       | No -- Step 6 depends on this                      |
| Step 5  | W1   | Add propagation baseline exclusion -- create `known-propagation-baseline.json`                     | `known-propagation-baseline.json` (NEW), `scripts/check-propagation.js` or `scripts/check-propagation-staged.js`                            | M (60 min) | None                                       | Yes (w/ Steps 1,2,3)                              |
| Step 6  | W2   | Consolidate sanitizeError (9 inline copies to imports)                                             | Up to 55 files in `scripts/` containing inline sanitizeError (canonical: `scripts/lib/sanitize-error.js`, `.cjs`)                           | L (3 hr)   | Step 4                                     | Yes (w/ Step 7)                                   |
| Step 7  | W2   | Consolidate readJsonl (23 inline variants to canonical import)                                     | Up to 34 files in `scripts/` containing inline readJsonl (canonical: `scripts/lib/read-jsonl.js`)                                           | L (3 hr)   | None                                       | Yes (w/ Step 6)                                   |
| Step 8  | W2   | Extract ecosystem audit shared-lib                                                                 | `.claude/skills/shared-lib/` (NEW directory), 186 files across 10 ecosystem audit skill directories                                         | L (2 hr)   | None                                       | No -- touches many skill files, risk of conflicts |
| Step 9  | W3   | Migrate bypass MASTER_DEBT writers to central writer                                               | Up to 41 scripts referencing MASTER_DEBT.jsonl (plan says 3 remaining bypass writers)                                                       | M (1.5 hr) | None                                       | Yes (w/ Steps 10,11)                              |
| Step 10 | W3   | Add app code to propagation check scope                                                            | `scripts/check-propagation.js` (SEARCH_DIRS expansion to include `lib/`, `app/`, `components/`), possibly `known-propagation-baseline.json` | M (1.5 hr) | Step 5 (needs baseline for new violations) | Yes (w/ Steps 9,11)                               |
| Step 11 | W3   | Fix hook telemetry failure recording -- add EXIT trap                                              | `.husky/pre-commit`, `.husky/pre-push`, `.husky/_shared.sh`                                                                                 | M (1 hr)   | None                                       | Yes (w/ Steps 9,10)                               |
| Step 12 | W4   | Remove noisy propagation rules (filter(Boolean), rmSync)                                           | `scripts/check-propagation.js`                                                                                                              | S (30 min) | Step 5 (baseline)                          | Yes (w/ Steps 13,14)                              |
| Step 13 | W4   | Add gitleaks to CI                                                                                 | `.github/workflows/ci.yml` (NEW step)                                                                                                       | S (30 min) | None                                       | Yes (w/ Steps 12,14)                              |
| Step 14 | W4   | Optimize doc-index performance (43s to <15s)                                                       | `scripts/generate-documentation-index.js`                                                                                                   | M (1 hr)   | None                                       | Yes (w/ Steps 12,13)                              |

**Total: 14 steps across 4 waves. Matches PLAN.md exactly.**

---

## 2. External Touchpoints

### Files Created (NEW)

| File                                                | Created By | Purpose                                     |
| --------------------------------------------------- | ---------- | ------------------------------------------- |
| `scripts/lib/sanitize-error.cjs`                    | Step 4     | CJS wrapper for ESM canonical module        |
| `known-propagation-baseline.json`                   | Step 5     | Baseline of existing propagation violations |
| `.claude/skills/shared-lib/` (directory + contents) | Step 8     | Shared library for ecosystem audit skills   |

### Files Modified

| File                                                 | Modified By        | Nature of Change                                             |
| ---------------------------------------------------- | ------------------ | ------------------------------------------------------------ |
| `scripts/debt/intake-audit.js`                       | Step 1             | Replace direct file write with `appendMasterDebtSync` import |
| `.github/workflows/ci.yml`                           | Steps 2, 13        | Remove continue-on-error (line 210); add gitleaks step       |
| `scripts/check-propagation.js`                       | Steps 5, 10, 12    | Add baseline support; expand SEARCH_DIRS; remove noisy rules |
| `scripts/check-propagation-staged.js`                | Step 5 (likely)    | Parallel changes to staged variant                           |
| `.husky/pre-commit`                                  | Step 11            | Add EXIT trap for failure telemetry                          |
| `.husky/pre-push`                                    | Step 11            | Add EXIT trap for failure telemetry                          |
| `.husky/_shared.sh`                                  | Step 11 (possibly) | Shared hook infrastructure for EXIT trap                     |
| `scripts/generate-documentation-index.js`            | Step 14            | Performance optimization                                     |
| Up to 55 scripts in `scripts/`                       | Step 6             | Replace inline sanitizeError with import                     |
| Up to 34 scripts in `scripts/`                       | Step 7             | Replace inline readJsonl with import                         |
| Up to 186 files across `.claude/skills/*ecosystem*/` | Step 8             | Refactor to use shared-lib imports                           |
| 3 scripts writing MASTER_DEBT.jsonl directly         | Step 9             | Migrate to centralized writer                                |

### External/Non-Code Changes

| Change                                       | Step   | Nature                  |
| -------------------------------------------- | ------ | ----------------------- |
| GitHub repo Settings: required status checks | Step 3 | Web UI change, not code |

### Skills/Hooks/Agents Affected

- **10 ecosystem audit skills** modified (Step 8): doc-ecosystem-audit,
  ecosystem-health, health-ecosystem-audit, hook-ecosystem-audit,
  pr-ecosystem-audit, script-ecosystem-audit, session-ecosystem-audit,
  skill-ecosystem-audit, tdms-ecosystem-audit, comprehensive-ecosystem-audit
- **Hook scripts** modified (Step 11): `.husky/pre-commit`, `.husky/pre-push`
- **Propagation check scripts** modified (Steps 5, 10, 12):
  `scripts/check-propagation.js`, `scripts/check-propagation-staged.js`

### Config Files Changed

- `known-propagation-baseline.json` (NEW)
- `.github/workflows/ci.yml` (modified x2)

### Package.json Impact

- No new npm scripts expected, but `patterns:check` behavior changes via
  baseline (Step 5)

---

## 3. Effort Summary

| Wave                         | Steps  | Plan Estimate | Complexity | Risk Level                                                             |
| ---------------------------- | ------ | ------------- | ---------- | ---------------------------------------------------------------------- |
| W1: Critical Fixes           | 1-5    | 3 hours       | Low-Medium | LOW (surgical fixes to known issues)                                   |
| W2: Consolidation            | 6-8    | 8 hours       | HIGH       | MEDIUM-HIGH (mass refactoring across 100+ files, regression risk)      |
| W3: Infrastructure Hardening | 9-11   | 4 hours       | Medium     | MEDIUM (locking semantics, scope expansion may surface new violations) |
| W4: Cleanup                  | 12-14  | 2 hours       | Low-Medium | LOW (removing rules, adding CI step, perf optimization)                |
| **Total**                    | **14** | **~17 hours** |            |                                                                        |

### Per-Step Risk Assessment

| Step | Risk   | Rationale                                                                     |
| ---- | ------ | ----------------------------------------------------------------------------- |
| 1    | LOW    | Well-understood fix; `appendMasterDebtSync` already exists in 5 other scripts |
| 2    | LOW    | One-line removal; TODO comment confirms intent                                |
| 3    | LOW    | GitHub UI change; easily reversible                                           |
| 4    | LOW    | New file, no existing file modification                                       |
| 5    | MEDIUM | Must calibrate baseline correctly or new violations get masked                |
| 6    | MEDIUM | 55 files potentially touched; must verify each import works (CJS vs ESM)      |
| 7    | MEDIUM | 34 files; multiple inline variants may have subtle differences                |
| 8    | HIGH   | 186 files across 10 skill directories; highest regression surface             |
| 9    | MEDIUM | Locking semantics; must verify concurrent access patterns                     |
| 10   | MEDIUM | Expanding scope will surface new violations requiring baseline or fixes       |
| 11   | LOW    | Shell scripting; testable with deliberate failure                             |
| 12   | LOW    | Removing rules; protected by baseline from Step 5                             |
| 13   | LOW    | Additive CI step; well-documented gitleaks setup                              |
| 14   | MEDIUM | Performance optimization; must not break output correctness                   |

---

## 4. Pre/Post Conditions

### Pre-Conditions (must be true before plan starts)

1. **`appendMasterDebtSync` exists in `scripts/lib/safe-fs.js`** -- VERIFIED:
   exists, used by 5 scripts already
2. **`scripts/lib/sanitize-error.js` is the canonical ESM module** -- VERIFIED:
   exists at that path
3. **`scripts/lib/read-jsonl.js` is the canonical module** -- VERIFIED: exists
   at that path
4. **CI workflow has the `continue-on-error: true` on security check** --
   VERIFIED: `.github/workflows/ci.yml` line 210
5. **Propagation check currently scopes to `scripts/`, `.claude/skills/`,
   `.claude/hooks/`** -- VERIFIED: SEARCH_DIRS in `check-propagation.js` line 26
6. **Hook scripts exist at `.husky/pre-commit` and `.husky/pre-push`** --
   VERIFIED: both exist
7. **`scripts/generate-documentation-index.js` exists** -- VERIFIED: exists
   (NOTE: plan calls it `generate-doc-index.js` which is a name discrepancy --
   see Gaps)
8. **No `gitleaks` in CI currently** -- VERIFIED: no matches in
   `.github/workflows/`
9. **No `sanitize-error.cjs` wrapper exists** -- VERIFIED: only `.js` and
   `.d.ts` exist
10. **No `known-propagation-baseline.json` exists** -- VERIFIED: no matches

### Post-Conditions (will be true after plan completes)

1. TDMS data-loss vector eliminated (intake-audit uses centralized writer)
2. CI security check is blocking (no more `continue-on-error`)
3. GitHub required status checks include Validate & Compliance
4. CJS scripts can import canonical `sanitizeError` via `.cjs` wrapper
5. Propagation check uses baseline (only new violations trigger)
6. Zero inline `sanitizeError` copies outside `scripts/lib/`
7. Zero inline `readJsonl` copies outside `scripts/lib/`
8. Ecosystem audit skills share a common library (`.claude/skills/shared-lib/`)
9. All MASTER_DEBT writers use centralized writer with locking
10. Propagation check covers `lib/`, `app/`, `components/` (TypeScript app code)
11. Hook failures are recorded in `hook-runs.jsonl` via EXIT traps
12. `filter(Boolean)` and `rmSync` removed from propagation rules
13. Gitleaks runs in CI as a blocking step
14. Doc-index generation completes in <15 seconds

### Other Plans That Benefit From This Plan Completing First

| Plan                                  | Benefit                                                                                                                                         |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **repo-cleanup**                      | Some overlap with cleanup targets; propagation fixes reduce cleanup scope                                                                       |
| **system-wide-standardization (SWS)** | Consolidated shared-lib (Step 8) provides canonical patterns SWS would standardize; baseline (Step 5) gives SWS a clean propagation foundation  |
| **agent-environment-analysis**        | Hook telemetry fix (Step 11) gives better data for agent environment analysis; ecosystem audit shared-lib (Step 8) improves agent skill quality |
| **passive-surfacing-remediation**     | Hook telemetry fix (Step 11) feeds better data into passive surfacing alerts                                                                    |

---

## 5. Gaps

### No DECISIONS.md

The propagation-research plan has no DECISIONS.md. Decisions that remain unmade
or implicit:

1. **Baseline granularity:** Step 5 creates `known-propagation-baseline.json`
   but the plan does not specify what structure this file takes (per-file?
   per-rule? per-violation hash?). This is an implementation decision.

2. **Step 8 shared-lib scope:** "Extract duplicated code across 32 ecosystem
   audit files" -- the plan says 32 files but the actual ecosystem audit skill
   directories contain 186 files. The "32" likely refers to specific
   library/utility files with duplicated code, not all files. The exact
   extraction scope needs scoping during implementation.

3. **Step 9 bypass writer identification:** Plan says "3 remaining scripts" but
   does not name them. The grep for `writeFileSync.*MASTER_DEBT` found 0 matches
   (they may use different write patterns). The actual bypass writers need
   identification.

4. **Step 14 optimization strategy:** The plan sets a target (<15s) but does not
   specify the optimization approach. The script name in the plan
   (`generate-doc-index.js`) differs from the actual file
   (`generate-documentation-index.js`) -- minor but worth noting.

5. **Wave sequencing rigidity:** Plan says "All 4 waves in one run, sequential"
   but several steps across waves could technically parallelize (e.g., Step 13
   gitleaks has no dependency on Wave 3). The sequential constraint may be
   overly conservative.

6. **Test strategy:** Each wave has an "AUDIT CHECKPOINT" but there's no
   explicit test creation plan. Some steps (6, 7, 8) involve touching dozens of
   files and would benefit from automated regression tests beyond "grep finds 0
   inline copies."

7. **Rollback strategy:** No rollback plan defined for the mass-refactoring
   waves (W2 especially). Given Step 8 touches 186 files, a failed attempt could
   be costly.

### Ambiguities Requiring Resolution Before Execution

1. **Step 2 scope:** CI has 4 `continue-on-error` instances in ci.yml (lines
   210, 214, 223, 239) plus others in other workflows. Plan says "Remove
   continue-on-error from the CI security check step" (singular), targeting only
   the security check at line 210. But should the others (documentation check
   line 214, audit validate line 223, debt views line 239) also be addressed?

2. **Step 6 actual count:** Plan says "9 inline copies" of sanitizeError but
   grep found 55 files containing sanitizeError patterns. The 55 includes test
   files, the canonical source, and files that import rather than inline. The
   exact set of files requiring changes needs triage.

3. **Step 7 actual count:** Plan says "23 inline variants" of readJsonl but grep
   found 34 files. Same triage needed as Step 6.

4. **Step 10 baseline interaction:** When propagation check scope expands to app
   code (Step 10), all existing app violations need to either be fixed or
   baselined. The plan says "Any new violations baselined or fixed" but doesn't
   estimate how many violations exist in the 158 unchecked app files.

---

## Convergence Loop Results

### Verification 1: Step Count

- PLAN.md contains exactly 14 steps (Steps 1-14) across 4 waves
- Inventory table contains exactly 14 rows
- **MATCH: 14/14**

### Verification 2: File Path Spot-Checks

| Path Referenced                                 | Exists?            | Notes                                                                    |
| ----------------------------------------------- | ------------------ | ------------------------------------------------------------------------ |
| `scripts/debt/intake-audit.js`                  | YES                | Confirmed via Glob                                                       |
| `scripts/lib/sanitize-error.js`                 | YES                | Confirmed; `.cjs` does NOT exist yet (correct per plan)                  |
| `scripts/lib/sanitize-error.cjs`                | NO (to be created) | Correct -- Step 4 creates this                                           |
| `scripts/lib/read-jsonl.js`                     | YES                | Confirmed via Glob                                                       |
| `.claude/skills/shared-lib/`                    | NO (to be created) | Correct -- Step 8 creates this                                           |
| `.github/workflows/ci.yml`                      | YES                | Confirmed; continue-on-error at line 210 verified                        |
| `known-propagation-baseline.json`               | NO (to be created) | Correct -- Step 5 creates this                                           |
| `scripts/generate-doc-index.js` (plan name)     | NO                 | **MISMATCH** -- actual file is `scripts/generate-documentation-index.js` |
| `scripts/generate-documentation-index.js`       | YES                | This is the actual file for Step 14                                      |
| `scripts/check-propagation.js`                  | YES                | Confirmed; SEARCH_DIRS verified                                          |
| `.husky/pre-commit`                             | YES                | Confirmed                                                                |
| `.husky/pre-push`                               | YES                | Confirmed                                                                |
| `scripts/lib/safe-fs.js` (appendMasterDebtSync) | YES                | Contains centralized writer; used by 5 scripts                           |

### Verification 3: Effort Estimates

- Plan states ~17 hours total: W1=3h, W2=8h, W3=4h, W4=2h
- My per-step effort breakdowns sum to approximately the same
- W2 at 8 hours is appropriate given 100+ files touched
- **GROUNDED: Yes, effort estimates match plan text**

### Verification 4: Missed Steps/Sub-steps

- 4 AUDIT CHECKPOINTS noted in plan (one per wave) -- these are verification
  gates, not separate steps. Captured in the notes but not as separate inventory
  rows. This is correct.
- No conditional branches in the plan -- all steps are unconditional
- **NO MISSED STEPS**

### Corrections Made During CL

1. Step 14 file name corrected: Plan says `generate-doc-index.js`, actual file
   is `generate-documentation-index.js`. Flagged in Gaps section.
2. Step 6 file count refined: Plan says "9 inline copies" but grep shows 55
   files with sanitizeError patterns (many are imports/tests, not inline
   copies). Flagged in Gaps section.
3. Step 7 file count refined: Plan says "23 inline variants" but grep shows 34
   files. Flagged in Gaps section.
4. Step 8 file count refined: Plan says "32 ecosystem audit files" but actual
   ecosystem skill directories contain 186 files. The "32" likely refers to
   library files specifically, not all files.

---

## Sources

| #   | Path/URL                                            | Type                   | Trust        | Notes                                         |
| --- | --------------------------------------------------- | ---------------------- | ------------ | --------------------------------------------- |
| 1   | `.planning/propagation-research/PLAN.md`            | Plan document          | HIGH         | Primary source, 165 lines                     |
| 2   | `.planning/propagation-research/RESEARCH_OUTPUT.md` | Research output        | HIGH         | 10-agent deep analysis backing the plan       |
| 3   | `.planning/plan-orchestration/DIAGNOSIS.md`         | Orchestration context  | HIGH         | Lists propagation as M-L effort, Ready status |
| 4   | `.github/workflows/ci.yml`                          | CI config (filesystem) | GROUND TRUTH | Verified continue-on-error at line 210        |
| 5   | `scripts/check-propagation.js`                      | Script (filesystem)    | GROUND TRUTH | Verified SEARCH_DIRS scope                    |
| 6   | `scripts/lib/safe-fs.js`                            | Script (filesystem)    | GROUND TRUTH | Verified appendMasterDebtSync exists          |
| 7   | `scripts/debt/intake-audit.js`                      | Script (filesystem)    | GROUND TRUTH | Verified it does NOT use appendMasterDebtSync |
| 8   | Glob/Grep results                                   | Filesystem scan        | GROUND TRUTH | File existence and pattern verification       |

## Contradictions

1. **File name mismatch:** Plan Step 14 references
   `scripts/generate-doc-index.js` but the actual file is
   `scripts/generate-documentation-index.js`. The `package.json` script
   `docs:index` runs `node scripts/generate-documentation-index.js`. This is
   likely a shorthand in the plan text, not a real conflict, but could cause
   confusion during execution.

2. **File count discrepancies:** Plan claims specific counts (9 sanitizeError
   copies, 23 readJsonl variants, 32 ecosystem files) but grep-based
   verification shows different numbers (55, 34, 186 respectively). The plan
   counts likely refer to "files needing modification" after filtering out
   tests, imports, and archives, while grep counts show all files containing the
   pattern. The actual work scope may differ from plan estimates.

## Serendipity

1. **ci.yml has 4 `continue-on-error` instances, not just 1.** The security
   check (Step 2's target) is the most critical, but the documentation check
   (line 214), audit validate (line 223), and debt views (line 239) also use
   continue-on-error. These may be candidates for future hardening beyond this
   plan's scope.

2. **`appendMasterDebtSync` adoption pattern.** 5 of the ~41
   MASTER_DEBT-referencing scripts already use the centralized writer. This
   means the migration pattern (Step 9) is well-established and can follow
   existing examples.

3. **Propagation check is ESM (`import` syntax).** The check-propagation.js
   script itself uses ESM imports (line 21), meaning it could serve as a
   reference for migrating other scripts from CJS to ESM, which would eliminate
   the need for the `.cjs` wrapper long-term.

---

## Confidence Assessment

- HIGH claims: 10 (file existence verifications, step count, pre/post
  conditions)
- MEDIUM claims: 6 (effort estimates, file counts needing triage, cross-plan
  benefits)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**
