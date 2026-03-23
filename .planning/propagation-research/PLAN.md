# Plan: Propagation Patterns Remediation

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-23
**Status:** APPROVED
<!-- prettier-ignore-end -->

**Effort:** L (single session, ~17 hours across 4 waves) **Source:**
[RESEARCH_OUTPUT.md](./RESEARCH_OUTPUT.md) (10-agent deep analysis)
**Execution:** All 4 waves in one run, sequential.

---

## Wave 1: Critical Fixes (3 hours)

### Step 1: Fix intake-audit.js TDMS data-loss vector

Fix `scripts/debt/intake-audit.js` to use `appendMasterDebtSync` instead of
direct file write. Only remaining active TDMS data-loss vector (3 documented
incidents).

**Done when:** intake-audit.js uses centralized writer, no direct
MASTER_DEBT.jsonl writes.

### Step 2: Remove continue-on-error from CI security check

Remove `continue-on-error: true` from the CI security check step. Security
violations currently pass CI silently. TODO comment from PR #457 indicates this
was meant to be temporary.

**Done when:** Security check failures block CI merge.

### Step 3: Add Validate & Compliance to GitHub required status checks

Add `Validate & Compliance` to GitHub required status checks. Validate failures
currently show as "Build pending" — opaque.

**Done when:** Validate failures directly visible in PR checks. **Note:** This
is a GitHub Settings change, not a code change.

### Step 4: Fix CJS/ESM barrier with sanitize-error.cjs wrapper

Create `scripts/lib/sanitize-error.cjs` wrapper that re-exports the canonical
module for CJS consumers. Root cause of the largest duplication cluster (10
copies of sanitizeError).

**Done when:** CJS scripts can `require('./lib/sanitize-error.cjs')` and get the
canonical implementation.

### Step 5: Add propagation baseline exclusion

Create `known-propagation-baseline.json` that captures existing violations.
Propagation check only flags NEW violations, reducing 100% bypass rate to ~0%.

**Done when:** `npm run patterns:check` propagation section uses baseline, only
new violations trigger warnings.

**AUDIT CHECKPOINT — Wave 1:** All 5 critical fixes verified. Run
`npm run patterns:check`, CI dry-run, and test suite to confirm no regressions.

---

## Wave 2: Consolidation (8 hours)

### Step 6: Consolidate sanitizeError (9 inline copies → imports)

Replace 9 inline copies of sanitizeError across scripts with imports from the
canonical `scripts/lib/sanitize-error.js` (or .cjs wrapper from Step 4).

**Depends on:** Step 4 (CJS/ESM barrier fix) **Done when:** grep finds 0 inline
sanitizeError implementations outside scripts/lib/.

### Step 7: Consolidate readJsonl (23 inline variants → canonical import)

Replace 23 inline variants of readJsonl parsing with imports from a canonical
`scripts/lib/read-jsonl.js` utility.

**Done when:** grep finds 0 inline readJsonl implementations outside
scripts/lib/.

### Step 8: Extract ecosystem audit shared-lib

Extract duplicated code across 32 ecosystem audit files into
`.claude/skills/shared-lib/`. Eliminates 5,844 lines of diverged duplicate code.

**Done when:** Ecosystem audit skills import from shared-lib, no inline
duplicates. All audit skills still function correctly.

**AUDIT CHECKPOINT — Wave 2:** Run full test suite + all ecosystem audits that
were modified to confirm no regressions. Code-review all consolidated files.

---

## Wave 3: Infrastructure Hardening (4 hours)

### Step 9: Migrate bypass MASTER_DEBT writers to central writer

Migrate 3 remaining scripts that write directly to MASTER_DEBT.jsonl to use the
centralized writer with locking + dual-file write.

**Done when:** All 13 MASTER_DEBT writers use centralized writer. grep finds 0
direct writeFileSync to MASTER_DEBT.jsonl outside the central writer.

### Step 10: Add app code to propagation check scope

Add `lib/`, `app/`, `components/` directories and `.ts`/`.tsx` extensions to
propagation check scope. Currently 158 app files are completely unchecked.

**Done when:** Propagation check covers app TypeScript files. Any new violations
baselined or fixed.

### Step 11: Fix hook telemetry failure recording

Add EXIT trap to hook scripts so failures are recorded in hook-runs.jsonl.
Currently 0 recorded failures out of 96 runs — telemetry blind spot.

**Done when:** A deliberately failing hook run produces a failure record in
hook-runs.jsonl.

**AUDIT CHECKPOINT — Wave 3:** Verify MASTER_DEBT locking works under concurrent
scenarios. Verify propagation check covers app files. Verify hook failure
telemetry records correctly.

---

## Wave 4: Cleanup (2 hours)

### Step 12: Remove noisy propagation rules

Remove `filter(Boolean)` and `rmSync` from propagation rules (~95% false
positive rate). Improves signal-to-noise for remaining rules.

**Depends on:** Step 5 (baseline — so removed rules don't re-trigger) **Done
when:** Propagation check runs without false positive noise from these rules.

### Step 13: Add gitleaks to CI

Add gitleaks as a CI step for defense-in-depth. No secrets scanning in CI
currently — reasonable even for solo dev.

**Done when:** CI workflow includes gitleaks step that blocks on detected
secrets.

### Step 14: Optimize doc-index performance

Optimize `scripts/generate-doc-index.js` — currently 43s median dominates
pre-commit time (pre-commit is 28-33s without it).

**Done when:** doc-index runs in <15s (target: 40-50% reduction).

**FINAL AUDIT CHECKPOINT:** Full test suite, all pre-commit checks pass,
pre-push checks pass, CI dry-run passes. Code-review all modified files.

---

## Execution Summary

| Wave             | Steps  | Effort   | Focus                                     |
| ---------------- | ------ | -------- | ----------------------------------------- |
| 1: Critical      | 1-5    | 3h       | Data-loss, CI gaps, ESM barrier, baseline |
| 2: Consolidation | 6-8    | 8h       | Eliminate 80% of propagation risk surface |
| 3: Hardening     | 9-11   | 4h       | Locking, coverage, telemetry              |
| 4: Cleanup       | 12-14  | 2h       | Noise reduction, CI defense, performance  |
| **Total**        | **14** | **~17h** |                                           |
