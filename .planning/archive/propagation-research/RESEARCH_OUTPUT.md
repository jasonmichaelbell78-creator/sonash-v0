# Propagation Patterns: Research Synthesis

**Document Version:** 1.0 **Date:** 2026-03-20 **Synthesized from:** 10 research
findings by 10 parallel agents **Status:** COMPLETE

---

## Executive Summary

This codebase does not have a propagation _detection_ problem. It has a
_duplication_ problem. 150+ standalone scripts contain 50+ inline copies of
shared utility functions (sanitizeError x10, readJsonl x24, safeParse x8,
escapeCell x3, ecosystem-audit shared libraries x32 files). The primary research
cataloged ~495 file-level pattern violations across 6 rules, but the contrarian
analysis demonstrated that the genuine production-risk surface is ~50-70 files
after removing test code, archive files, ecosystem-audit template copies, and
benign path.resolve() usage. Three documented data-loss incidents all share a
single root cause: `generate-views.js` overwriting MASTER_DEBT.jsonl from stale
deduped.jsonl -- not broad propagation failures. The highest-leverage fix is not
better detection (46 hours estimated) but targeted consolidation of duplicated
code and 6 specific infrastructure fixes (~11 hours combined, addressing every
demonstrated real-world failure). The CJS/ESM module barrier is the structural
root cause of duplication: CJS scripts cannot import the ESM canonical
`sanitize-error.js`, making copy-paste the path of least resistance.

---

## The Real Problem (incorporating contrarian + outside-the-box corrections)

### What it appeared to be

A systematic propagation detection failure across ~495 files, 6 pattern rules, 5
unsafe MASTER_DEBT writers, 7 hidden critical violations under GLOBAL_EXCLUDE,
and a CI pipeline with 4 non-blocking security steps -- requiring 16
remediations over 46 hours across 4 phases.

### What it actually is

1. **A duplication problem, not a detection problem.** The codebase has 10
   copies of `sanitizeError`, 24+ copies of JSONL parsing, 8 copies of
   `safeParse`, and 32 diverged ecosystem-audit library files (5,844 lines).
   Propagation failures are a second-order symptom. Eliminating duplication
   eliminates the need for propagation detection on those patterns.

2. **A CJS/ESM barrier that blocks sharing.** The canonical `sanitize-error.js`
   is ESM, but all scripts are CJS. Scripts cannot `require()` the canonical
   version, so they copy it inline. This is the structural root cause of the
   largest duplication cluster.

3. **A calibration problem in enforcement, not a coverage problem.** The
   propagation check has a 100% bypass rate because its highest-volume rules
   (`filter(Boolean)` at ~95% false positives, `rmSync` flagging test teardown)
   make the signal indistinguishable from noise. The check catches real issues
   but is bypassed every time.

4. **An enforcement inversion.** 17,000+ lines of enforcement code protect
   36,000 lines of local CLI scripts (a 1:2 ratio). Meanwhile, 158 app-layer
   TypeScript files handling user PII have zero propagation checking, zero
   custom error sanitization in `lib/`, and 7 components accessing
   `error.message` without sanitization.

5. **One active data-loss vector.** `intake-audit.js` writes to `deduped.jsonl`
   without writing to `MASTER_DEBT.jsonl`, creating orphaned entries that get
   destroyed on the next `writeMasterDebtSync` call. The 3 historical data-loss
   incidents (Sessions ~#179, Reviews #339, #348) were all caused by this
   dual-file desync pattern.

---

## Findings by Priority

### Critical (fix now -- demonstrated real-world impact)

**C1: `intake-audit.js` writes to deduped.jsonl without MASTER_DEBT.jsonl**

- Source: Findings 04, 06
- Evidence: 3 documented data-loss incidents (5 entries lost in Review #339,
  ROADMAP IDs lost in Review #348, S0 demotions reverted in Session ~#179)
- Current state: `intake-audit.js` lines 862-870 write to `deduped.jsonl` and
  `normalized-all.jsonl` but not `MASTER_DEBT.jsonl`. The next
  `writeMasterDebtSync` call destroys deduped-only items.
- Fix: Replace direct writes with `appendMasterDebtSync(newItems)`

**C2: CI security pattern check is non-blocking (`continue-on-error: true`)**

- Source: Findings 03, 07
- Evidence: ci.yml line 210 has `continue-on-error: true` with a TODO comment
  "Remove once validated" from PR #457. The pre-push hook blocks on
  CRITICAL/HIGH security violations, but CI lets them through silently.
- Fix: Remove `continue-on-error: true` from the security pattern check step

### High (fix soon -- significant risk with low effort)

**H1: CJS/ESM barrier causes structural duplication**

- Source: Finding 10
- Evidence: `sanitize-error.js` is ESM; `security-helpers.js` (CJS) reimplements
  `sanitizeError` because it cannot `require()` the ESM version. 8+ other
  scripts do the same.
- Fix: Add `sanitize-error.cjs` wrapper, update all CJS consumers to import it
- Effort: 1 hour for the wrapper; 2-3 hours for import migration

**H2: Propagation check needs baseline exclusion (100% bypass rate)**

- Source: Findings 07, 09
- Evidence: Every propagation detection in `hook-warnings-log.jsonl` was
  bypassed via `SKIP_PROPAGATION=1`. The `filter(Boolean)` rule has ~95% false
  positives (173 of 183 occurrences are safe string-splitting idioms). The
  `rmSync` rule flags test teardown.
- Fix: Add `known-propagation-baseline.json` (analogous to existing
  `known-debt-baseline.json` for cyclomatic complexity). Only NEW violations
  trigger blocking.
- Effort: 2-3 hours

**H3: 3 MASTER_DEBT bypass writers lack locking**

- Source: Findings 04, 06
- Evidence: `reverify-resolved.js`, `verify-resolutions.js`, and
  `audit-s0-promotions.js` write to both MASTER_DEBT and deduped via manual
  tmp+rename without calling `acquireLock`. The central writer
  (`writeMasterDebtSync`) provides locking + dual-file write + rollback.
- Contrarian correction: These are CLI tools run manually by a solo developer.
  True concurrent execution is extremely unlikely. Classify as engineering
  hygiene, not urgent security.
- Fix: Replace manual write blocks with `writeMasterDebtSync(items)` calls
- Effort: 2 hours

**H4: App code has zero propagation checking**

- Source: Finding 10
- Evidence: `check-propagation.js` only scans `.js`/`.mjs` files in `scripts/`,
  `.claude/skills/`, `.claude/hooks/`. The 158 TypeScript files in `lib/`,
  `app/`, `components/` are completely unchecked. 7 component files access
  `error.message` directly; 14 lib files have no error sanitization.
- Fix: Add `lib/`, `app/`, `components/` to SEARCH_DIRS; add `.ts`/`.tsx` to
  file extension filter
- Effort: 1 hour

### Medium (fix when convenient -- theoretical risk or noisy tooling)

**M1: Hook telemetry does not record failures**

- Source: Finding 07
- Evidence: `hook-runs.jsonl` is written at the end of the hook. If the hook
  exits early on failure, the write never happens. The data shows 0 failures out
  of 96 runs, which is almost certainly inaccurate.
- Fix: Move `write_hook_runs_jsonl` to an EXIT trap; add `exit_code` field
- Effort: 1 hour

**M2: doc-index bottleneck (43s median) dominates pre-commit time**

- Source: Finding 07
- Evidence: Pre-commit takes 55-75s with doc-index, 28-33s without. The
  `doc-index` auto-fix step runs `npm run docs:index` which takes 27-105s.
- Fix: Investigate and optimize `generate-documentation-index.js` performance,
  or move to pre-push
- Effort: 2-3 hours

**M3: GLOBAL_EXCLUDE contains 30+ files with blanket immunity**

- Source: Finding 05
- Contrarian correction: The 7 "critical violations" in GLOBAL_EXCLUDE are
  actually containment guards that PREVENT path traversal (using
  `startsWith("..")` to reject paths outside the repo root). The GLOBAL_EXCLUDE
  is correctly suppressing false positives. The one genuine violation is
  `startsWith('/')` in `generate-documentation-index.js` line 439.
- Fix: Audit GLOBAL_EXCLUDE and move pre-existing-debt files to per-pattern
  exemptions in `verified-patterns.json`. Keep meta-detection files globally
  excluded.
- Effort: 2-3 hours

**M4: `Validate & Compliance` job not in GitHub required status checks**

- Source: Finding 03
- Evidence: Validate is transitively required via `build.needs`, but if someone
  refactors `build.needs`, validate silently becomes non-blocking. Validate
  failures show as "Build pending" in the PR UI, not as "Validate failed."
- Fix: Add `Validate & Compliance` to the GitHub ruleset
- Effort: 1 minute (UI change)

**M5: No secrets scanning in CI**

- Source: Finding 03
- Contrarian correction: This is a solo-developer private repo. All secrets are
  in gitignored/encrypted env files. Fork PRs from external contributors do not
  exist. Classify as defense-in-depth (P3), not urgent security (P1).
- Fix: Add gitleaks step to CI lint job
- Effort: 30 minutes

### Low (monitor -- correctly working or acceptable risk)

**L1: ~495 file-level violations (inflated count)**

- Source: Findings 01, 02; corrected by Finding 09
- Reality: After removing ecosystem-audit template copies (7x inflation), test
  files, archive files, and benign `path.resolve()` usage, the genuine
  production-risk surface is ~50-70 files. The production application (Next.js +
  Firebase) has zero violations in `app/`, `components/`, or `lib/`.

**L2: Pattern auto-disable threshold (3 patterns disabled at 25+ exemptions)**

- Source: Finding 05
- Assessment: `rename-without-remove` (34 exemptions), `missing-array-isarray`
  (29), `missing-bom-handling` (28) are auto-disabled. Exemptions are committed
  to git and auditable. Gaming risk is low for a solo developer.

**L3: Test baseline staleness cascade**

- Source: Finding 03
- Assessment: Working as designed. New scripts without tests block CI until
  either a test is written or the script is added to `.test-baseline.json`.
  Error messages are clear and actionable.

**L4: Warning fatigue (trigger warnings, npm audit)**

- Source: Finding 07
- Assessment: 13 of 14 pushes produce trigger warnings; 10 persistent npm audit
  warnings for the same unfixed vulnerability. These are wallpaper. Fix the
  underlying vulnerability or raise the severity threshold.

---

## The Root Cause Analysis

### Primary root cause: Duplication, not detection (Finding 10)

The codebase has 150+ standalone scripts with copy-pasted utility functions.
This happened because:

1. **CJS/ESM split creates a sharing barrier.** The canonical
   `sanitize-error.js` is ESM, but all scripts are CJS. `require()` cannot
   import ESM modules. The result: 10 inline copies of `sanitizeError` across
   CJS scripts.

2. **AI-generated code favors local copies.** Claude tends to copy working code
   from nearby files rather than importing shared modules, especially when the
   shared module has import complexity (ESM/CJS mismatch).

3. **Ecosystem audit template pattern deliberately duplicated code.** 9 skills
   each scaffold their own copy of 4 shared library files. These 32 files (5,844
   lines) have already diverged and can no longer be reconciled by simple copy.

4. **No refactoring discipline for scripts.** Scripts were treated as disposable
   utilities, not production code. Each was written to solve a specific problem
   and never consolidated.

### Secondary root cause: Enforcement inversion (Finding 10)

17,000+ lines of enforcement infrastructure protect 36,000 lines of local CLI
scripts (1:2 ratio). The app code handling user PII has standard
ESLint/TypeScript coverage but zero custom propagation checking, zero error
sanitization in `lib/`, and no pattern compliance beyond standard rules. The
enforcement effort is concentrated on the lowest-risk layer.

### Tertiary root cause: Check calibration failure (Findings 07, 09)

The propagation check fires on every push and is wrong >90% of the time for its
highest-volume rules. This produces a 100% bypass rate, which means the check
catches zero real issues in practice despite detecting them in theory.

---

## Recommended Action Plan

### Phase 1: Critical fixes (3 hours)

| #   | Action                                                                 | Why                                                                                                                | Effort | Impact                                                               | Dependencies |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------ | -------------------------------------------------------------------- | ------------ |
| 1   | Fix `intake-audit.js` to use `appendMasterDebtSync`                    | Only remaining active TDMS data-loss vector (3 documented incidents)                                               | 1h     | Eliminates the dual-file desync that caused all historical data loss | None         |
| 2   | Remove `continue-on-error: true` from CI security check                | Security violations currently pass CI silently; TODO comment from PR #457 indicates this was meant to be temporary | 5 min  | Security violations block merge                                      | None         |
| 3   | Add `Validate & Compliance` to GitHub required status checks           | Validate failures are opaque (show as "Build pending"); safety net against refactoring `build.needs`               | 1 min  | Direct visibility of validate failures                               | None         |
| 4   | Fix CJS/ESM barrier: add `sanitize-error.cjs` wrapper                  | Unblocks all sharing; root cause of the largest duplication cluster (10 copies of sanitizeError)                   | 1h     | Enables Phase 2 consolidation                                        | None         |
| 5   | Add propagation baseline exclusion (`known-propagation-baseline.json`) | Reduces 100% bypass rate to ~0% by only flagging NEW violations                                                    | 2h     | Propagation check becomes actionable instead of wallpaper            | None         |

### Phase 2: Consolidation (8 hours)

| #   | Action                                                                     | Why                                                                              | Effort | Impact                                            | Dependencies |
| --- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------ | ------------------------------------------------- | ------------ |
| 6   | Consolidate `sanitizeError` (replace 9 inline copies with imports)         | Eliminates the most-documented propagation risk; enforced by CLAUDE.md Section 5 | 2h     | 9 fewer propagation points for error sanitization | Phase 1 #4   |
| 7   | Consolidate `readJsonl` (replace 23 inline variants with canonical import) | Eliminates the largest single source of utility duplication                      | 2h     | 23 fewer propagation points for JSONL parsing     | None         |
| 8   | Extract ecosystem audit shared-lib to `.claude/skills/shared-lib/`         | Eliminates 5,844 lines of diverged duplicate code across 32 files                | 4h     | 88% reduction in ecosystem audit duplication      | None         |

### Phase 3: Infrastructure hardening (4 hours)

| #   | Action                                                                | Why                                                                             | Effort | Impact                                                             | Dependencies |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------ | ------------ |
| 9   | Migrate 3 bypass MASTER_DEBT writers to central writer                | Engineering hygiene; prevents future issues if concurrent execution ever occurs | 2h     | All 13 MASTER_DEBT writers use locking + dual-file write           | None         |
| 10  | Add `lib/`, `app/`, `components/` + `.ts`/`.tsx` to propagation check | Closes the biggest coverage gap (158 app files completely unchecked)            | 1h     | App code gets propagation checking for the first time              | None         |
| 11  | Fix hook telemetry to record failures (EXIT trap)                     | Currently 0 recorded failures out of 96 runs -- telemetry blind spot            | 1h     | Data to evaluate check effectiveness and calibrate blocking levels | None         |

### Phase 4: Cleanup (2 hours, optional)

| #   | Action                                                       | Why                                                                                  | Effort | Impact                                                     | Dependencies          |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------ | ---------------------------------------------------------- | --------------------- |
| 12  | Remove noisy propagation rules (`filter(Boolean)`, `rmSync`) | ~95% false positive rate; removing them improves signal-to-noise for remaining rules | 30 min | Fewer bypassed warnings, cleaner hook output               | Phase 1 #5 (baseline) |
| 13  | Add gitleaks to CI as defense-in-depth                       | No secrets scanning in CI; reasonable even for solo dev                              | 30 min | Catches secrets in any code path that bypasses local hooks | None                  |
| 14  | Optimize doc-index performance                               | 43s median dominates pre-commit time; pre-commit is 28-33s without it                | 1h     | 40-50% reduction in pre-commit wall time                   | None                  |

**Total: ~17 hours across 4 phases.** Phase 1 alone (3 hours) addresses every
demonstrated real-world failure. Phase 2 (8 hours) permanently eliminates 80% of
the propagation risk surface. Phases 3-4 (6 hours) are engineering hygiene.

---

## What We Got Wrong Initially

| Claim                                          | Primary finding | Contrarian correction                                                                                                                                                                                                      | Confidence in correction                                                                                                 |
| ---------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| ~495 file-level violations                     | Findings 01, 02 | Inflated ~7x. Actual production-risk surface: ~50-70 files. Ecosystem-audit templates, test files, archive files, and benign `path.resolve()` account for ~85% of the count.                                               | HIGH -- the contrarian examined each category and provided revised counts                                                |
| 5 bypass writers = HIGH risk                   | Finding 04      | Theoretical concurrency in a single-developer, single-terminal CLI workflow. The 3 historical data-loss incidents were caused by `generate-views.js` overwrite, not concurrent writer races.                               | HIGH -- confirmed by examining execution contexts and documented incidents                                               |
| 7 critical violations hidden by GLOBAL_EXCLUDE | Finding 05      | These are containment guards that PREVENT path traversal (`startsWith("..")` used to reject paths outside repo root). The GLOBAL_EXCLUDE is correctly suppressing false positives. Only 1 of the 7 is a genuine violation. | HIGH -- the contrarian examined the actual code in all 3 files                                                           |
| 100% bypass rate = developer laziness          | Finding 07      | Product design failure, not discipline failure. The `filter(Boolean)` rule has ~95% false positives; `rmSync` flags test teardown. The check is miscalibrated, making bypass the rational response.                        | HIGH -- corroborated by false positive analysis in Finding 01                                                            |
| No CI secrets scanning = HIGH severity         | Finding 03      | Solo-developer private repo with all secrets in gitignored/encrypted env files. Defense-in-depth is reasonable but classify as P3, not P1.                                                                                 | MEDIUM -- the risk model is sound but "better safe than sorry" is a valid counterargument                                |
| 16 remediations / 46 hours needed              | Finding 08      | Over-engineered. Several remediations address problems that do not exist in practice (expanding SEARCH_DIRS to `app/` where zero violations exist, `proper-lockfile` for a single-machine CLI tool).                       | HIGH -- the contrarian identified 6 targeted fixes at ~9 hours; outside-the-box extended to ~11 hours with consolidation |

---

## What We Almost Missed

These findings came from the outside-the-box analysis (Finding 10) and were not
surfaced by any of the 8 primary research agents:

1. **The CJS/ESM barrier is the structural root cause of duplication.** All 8
   primary findings treated duplication as a given and proposed better
   detection. None asked _why_ duplication exists. The answer: CJS scripts
   cannot `require()` ESM modules, making copy-paste the path of least
   resistance. A 1-hour `.cjs` wrapper fix unblocks all sharing.

2. **The enforcement-to-implementation ratio is approaching 1:2.** 17,000+ lines
   of enforcement code for 36,000 lines of scripts. Each new check adds
   maintenance burden and warning fatigue. The research proposed adding 5+ new
   propagation rules and 16 remediations -- which would push the ratio further.
   The better approach is consolidation (which eliminates the need for rules)
   and pruning noisy rules (which reduces fatigue).

3. **App code is the biggest blind spot.** All 8 findings focused on `scripts/`
   and `.claude/`. The actual Next.js application -- 158 TypeScript files
   handling user PII -- has zero propagation checking. 7 components access
   `error.message` without sanitization. 14 lib files have no error
   sanitization. This is higher-risk than any script-layer finding.

4. **Ecosystem audit shared libraries have already diverged.** The 32 template
   copies across 8 skills are not identical -- they range from 93 to 329 lines
   each for the same logical file. This is not a theoretical propagation risk.
   It is a propagation failure that has already occurred.

5. **The doc-index bottleneck (43s median) has more user impact than any
   propagation fix.** It makes every pre-commit feel slow, contributing to
   bypass normalization. Fixing it improves developer experience more than any
   detection improvement.

---

## Self-Audit

### Source count across all findings

| Finding                 | Sources cited                                                                              | Primary evidence type                       |
| ----------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------- |
| 01 - Detection Gaps     | 6 rules, 14 unguarded files enumerated, 183 filter(Boolean) instances counted              | Codebase grep, line-by-line audit           |
| 02 - PR453 Deferred     | 4 DEBT items, 6 patterns, 5 subsequent PRs checked                                         | State files, DEBT registry, git history     |
| 03 - CI Cascades        | ci.yml full analysis, GitHub ruleset ID 13352818, 35-line check comparison matrix          | Workflow YAML, GitHub API                   |
| 04 - File Overwrite     | 13 MASTER_DEBT writers enumerated, 6 JSONL files analyzed, 3 race condition scenarios      | Code audit, safe-fs.js analysis             |
| 05 - Pattern Compliance | 50+ patterns, GLOBAL_EXCLUDE audit, FP threshold analysis                                  | check-pattern-compliance.js (2,174 lines)   |
| 06 - TDMS Trap          | 8,461 vs 3,915 line counts, 3 historical incidents, 4 failure scenarios                    | File system state, review archive documents |
| 07 - Hook Effectiveness | 96 hook-runs.jsonl entries, 53 warnings, 14+12 check matrix                                | JSONL telemetry data, hook source code      |
| 08 - Remediation        | 16 remediations, 6 external tools referenced, 5 external sources                           | Codebase inventory + external research      |
| 09 - Contrarian         | Challenged 7 claims with codebase evidence                                                 | Re-examination of primary evidence          |
| 10 - Outside-the-Box    | 5,844 lines counted across 32 files, CJS/ESM barrier documented, app blind spot identified | Structural analysis, lateral reasoning      |

### Cross-consistency check

| Topic                                | Agents that agree  | Agents that disagree                     | Resolution                                                                                                                                          |
| ------------------------------------ | ------------------ | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| TDMS dual-file write is a real risk  | 04, 06, 08, 09, 10 | None (09 agrees but downgrades priority) | **Consensus: Fix it.** Contrarian downgrades from P1 to P3 for the locking gap, but all agree `intake-audit.js` is the active vector.               |
| CI security check should be blocking | 03, 07, 08, 09, 10 | None                                     | **Unanimous.**                                                                                                                                      |
| ~495 violations is inflated          | 09, 10             | 01, 02 (reported the raw counts)         | **Contrarian is correct.** Primary agents reported raw grep counts without risk-tier filtering. Actual production risk: ~50-70 files.               |
| Propagation check needs baseline     | 07, 09, 10         | 08 (proposes expanding rules instead)    | **Baseline is correct.** Adding more rules without a baseline will increase the bypass rate further.                                                |
| Duplication is the root cause        | 10                 | 01-08 (treat it as a given)              | **Outside-the-box is correct.** No primary agent questioned why duplication exists.                                                                 |
| App code is a blind spot             | 10                 | 01-08 (focused on scripts)               | **Outside-the-box is correct.** This was the research's biggest gap.                                                                                |
| GLOBAL_EXCLUDE hides real violations | 05                 | 09                                       | **Contrarian is mostly correct.** 6 of 7 "violations" are containment guards doing the right thing. 1 genuine violation (`startsWith('/')`) exists. |

### Confidence assessment per finding

| Finding                                 | Confidence      | Notes                                                                                        |
| --------------------------------------- | --------------- | -------------------------------------------------------------------------------------------- |
| C1: intake-audit.js data loss vector    | **HIGH**        | 3 documented incidents with specific review IDs; code path confirmed                         |
| C2: CI security check non-blocking      | **HIGH**        | Single line in ci.yml with TODO comment; trivially verifiable                                |
| H1: CJS/ESM barrier                     | **HIGH**        | Module system behavior is deterministic; verified by examining imports                       |
| H2: Propagation baseline needed         | **HIGH**        | 100% bypass rate in telemetry data; false positive analysis is rigorous                      |
| H3: MASTER_DEBT bypass writers          | **MEDIUM**      | The code gap is real but probability of concurrent execution is very low                     |
| H4: App code blind spot                 | **HIGH**        | `.ts`/`.tsx` exclusion is explicit in check-propagation.js; grep confirms 0 app-layer checks |
| M1-M5: Medium priority items            | **MEDIUM-HIGH** | All verified against codebase; some (M3, M5) have contrarian corrections                     |
| L1-L4: Low priority items               | **HIGH**        | All correctly classified after contrarian recalibration                                      |
| Root cause (duplication, not detection) | **HIGH**        | Supported by file counts, CJS/ESM analysis, and ecosystem audit divergence evidence          |
| Outside-the-box enforcement inversion   | **MEDIUM**      | The 1:2 ratio is real but the counterargument (discipline transfer to AI) has merit          |

---

## Version History

| Version | Date       | Changes                          |
| ------- | ---------- | -------------------------------- |
| 1.0     | 2026-03-20 | Initial synthesis of 10 findings |
