# 03 - CI Pipeline Cascade Failure Analysis

**Document Version:** 1.0 **Last Updated:** 2026-03-20 **Status:** RESEARCH
COMPLETE

---

## 1. CI Job Dependency Graph

```
                    [trigger: push to main / PR to main]
                              |
              +---------------+---------------+
              |               |               |
          [lint]          [test]        [validate]
       (10 min cap)    (15 min cap)    (10 min cap)
              |               |               |
              +-------+-------+-------+-------+
                      |               |
                  [build]             |
               (20 min cap)          |
               needs: [lint,         |
                test, validate]      |
                                     |
```

**All three of `lint`, `test`, `validate` must pass for `build` to run.**

The `build` job specifies `needs: [lint, test, validate]` (line 249 of ci.yml).

---

## 2. Required Status Checks (Branch Protection via Ruleset)

The GitHub ruleset "main protection" (ID 13352818) requires these checks to pass
before merge:

| Required Check                  | Source Workflow       | Notes             |
| ------------------------------- | --------------------- | ----------------- |
| `Lint & Format`                 | ci.yml (lint)         | Job name match    |
| `Type Check & Test`             | ci.yml (test)         | Job name match    |
| `Build`                         | ci.yml (build)        | Job name match    |
| `Dependency Review`             | dependency-review.yml | Separate workflow |
| `Analyze JavaScript/TypeScript` | codeql.yml            | CodeQL analysis   |

**`strict_required_status_checks_policy: true`** -- branch must be up-to-date
with base before merging.

---

## 3. CASCADE POINT A: Validate Job Not in Required Checks

### The Gap

The `Validate & Compliance` job is **NOT listed in required status checks**. It
runs, and `build` depends on it, but the merge-gate dependency chain is:

```
Merge requires: Build -> Build needs: [lint, test, validate] -> validate runs
```

So validate is **transitively required** via the `build` job dependency. If
validate fails, build never starts, and the `Build` required check never reports
success, blocking merge.

### Implications

1. **Validate failures ARE blocking for merge** -- but indirectly. The developer
   sees "Build" as pending/never-started, not "Validate failed." This makes
   debugging harder -- the failure is in `validate` but the visible block is
   `Build` not running.

2. **If validate is removed from `build.needs`**, it would silently become
   non-blocking. The validate job would run, could fail, and the PR would still
   merge as long as lint, test, and build pass.

3. **`continue-on-error: true` steps within validate are truly non-blocking.**
   These steps fail without failing the job:
   - **Security pattern check** (line 210) -- `TODO: Remove once validated`
   - **Documentation check** (line 214) -- templates have expected issues
   - **Audit file validation** (line 223) -- non-critical
   - **Technical debt view freshness** (line 239) -- informational

   This means: a security pattern violation can pass CI completely. The only
   gate is the pre-push hook (which is also non-blocking for this check --
   warnings only).

### Risk Level: MEDIUM

The transitive dependency works but is fragile and opaque. If someone refactors
`build.needs` to remove `validate`, the entire compliance suite becomes
advisory.

### Recommendation

Add `Validate & Compliance` to the required status checks in the GitHub ruleset.
This makes it directly required regardless of the build dependency chain, and
surfaces validate failures clearly in the PR checks UI.

---

## 4. CASCADE POINT B: Test Baseline Staleness

### How `.test-baseline.json` Works

The file lists scripts that are **known** to lack tests. The CI step
`Check test coverage completeness` (line 127) runs
`node scripts/generate-test-registry.js --check-coverage`, which:

1. Scans all scripts in covered directories
2. Checks which have corresponding test files
3. Loads `.test-baseline.json` to get the "known gaps" set
4. **Fails (exit 1) if NEW untested scripts exist that are NOT in the baseline**
5. Passes if all untested scripts are already in the baseline

### Staleness Cascade

When the baseline becomes stale (new scripts added without tests and without
baseline entries):

```
New script added without test
  -> generate-test-registry --check-coverage finds NEW gap
  -> Exit 1
  -> "Check test coverage completeness" step FAILS
  -> "test" job FAILS
  -> "build" job never starts (needs: [test])
  -> "Build" required check stays pending
  -> PR cannot merge
```

**Blast radius:** The entire CI pipeline is blocked. Not just the test job --
the build job too, since it depends on test.

### Mitigation Already in Place

The baseline approach is intentional: it prevents test debt from silently
growing. The fix is straightforward: either write a test or add the script to
`.test-baseline.json`.

### Risk Level: LOW (by design)

This is working as intended. The cascade is the desired behavior. The only
concern is developer experience: the error message tells you exactly what to do
(`add tests or add to .test-baseline.json`).

---

## 5. CASCADE POINT C: Pre-commit vs CI Divergence

### Complete Check Comparison

| Check                             | Pre-commit | Pre-push | CI lint  | CI test  |  CI validate  |
| --------------------------------- | :--------: | :------: | :------: | :------: | :-----------: |
| Secrets scan (gitleaks)           |  BLOCKING  |    --    |    --    |    --    |      --       |
| ESLint                            |  BLOCKING  |    --    | BLOCKING |    --    |      --       |
| Tests (npm test)                  | BLOCKING\* |    --    |    --    | BLOCKING |      --       |
| Prettier (lint-staged auto-fix)   |  AUTO-FIX  |    --    |    --    |    --    |      --       |
| Prettier (format:check)           |     --     |    --    | BLOCKING |    --    |      --       |
| Oxlint (lint:fast)                |     --     |    --    | BLOCKING |    --    |      --       |
| Circular deps                     |     --     | BLOCKING | BLOCKING |    --    |      --       |
| Unused deps                       |     --     |    --    | BLOCKING |    --    |      --       |
| TypeScript check (tsc --noEmit)   |     --     | BLOCKING |    --    | BLOCKING |      --       |
| Pattern compliance (staged)       |  BLOCKING  |    --    |    --    |    --    |      --       |
| Pattern compliance (push diff)    |     --     |   WARN   |    --    |    --    |      --       |
| Pattern compliance (PR files)     |     --     |    --    |    --    |    --    |   BLOCKING    |
| Pattern compliance (push to main) |     --     |    --    |    --    |    --    |   BLOCKING    |
| Pattern test suite (unit tests)   |     --     |    --    |    --    | BLOCKING |      --       |
| Security pattern check            |     --     | BLOCKING |    --    |    --    | non-block\*\* |
| Security audit (npm audit)        |     --     |   WARN   |    --    |    --    |      --       |
| Coverage threshold (65%)          |     --     |    --    |    --    | BLOCKING |      --       |
| Test coverage completeness        |     --     |    --    |    --    | BLOCKING |      --       |
| Cross-doc deps                    |  BLOCKING  |    --    |    --    |    --    |      --       |
| Doc headers                       |  BLOCKING  |    --    |    --    |    --    |      --       |
| Doc index auto-update             |  AUTO-FIX  |    --    |    --    |    --    |      --       |
| Documentation check (docs:check)  |     --     |    --    |    --    |    --    | non-block\*\* |
| Audit S0/S1 validation            |  BLOCKING  |    --    |    --    |    --    | non-block\*\* |
| CANON schema validation           |     --     |    --    |    --    |    --    |   BLOCKING    |
| Tech debt schema                  |  BLOCKING  |    --    |    --    |    --    |   BLOCKING    |
| ROADMAP debt refs                 |     --     |    --    |    --    |    --    |   BLOCKING    |
| Tech debt views freshness         |     --     |    --    |    --    |    --    | non-block\*\* |
| Agent compliance                  |    WARN    |    --    |    --    |    --    |      --       |
| Skill validation                  |    WARN    |    --    |    --    |    --    |      --       |
| Propagation (staged security)     |    WARN    |    --    |    --    |    --    |      --       |
| Propagation (push diff)           |     --     | WARN/BLK |    --    |    --    |      --       |
| Code-reviewer gate                |     --     | BLOCKING |    --    |    --    |      --       |
| Cyclomatic complexity             |     --     | BLOCKING |    --    |    --    |      --       |
| Cognitive complexity              |     --     | BLOCKING |    --    |    --    |      --       |
| Trigger checker                   |     --     | BLOCKING |    --    |    --    |      --       |
| Hook test suite                   |     --     | BLOCKING |    --    |    --    |      --       |
| Escalation gate (warnings)        |     --     | BLOCKING |    --    |    --    |      --       |
| PR creep guard                    |  BLOCKING  |    --    |    --    |    --    |      --       |
| Review scripts build (tsc)        |     --     |    --    |    --    | BLOCKING |      --       |
| Build application                 |     --     |    --    |    --    |    --    |   --\*\*\*    |

`*` Tests in pre-commit are conditional (skip for doc-only changes, config
triggers full run) `**` `continue-on-error: true` in CI `***` Build is a
separate job (job 4)

### Critical Divergence Points

#### A. Things that pass pre-commit but fail CI

1. **Oxlint (lint:fast)**: CI runs oxlint before ESLint. Pre-commit does NOT run
   oxlint. If oxlint catches something ESLint misses, the commit passes locally
   but fails CI.

2. **Prettier format:check**: Pre-commit auto-fixes via lint-staged, but CI runs
   `format:check` (which fails on unformatted code). If lint-staged silently
   fails or doesn't catch a file, CI catches it. This is a SAFETY NET, not a
   gap.

3. **Unused dependencies (deps:unused)**: Only CI checks this. A new unused
   dependency passes pre-commit and pre-push, but fails CI lint.

4. **Coverage thresholds**: Pre-commit runs tests but does NOT check coverage
   percentages. CI enforces 65% line coverage. A test that passes but reduces
   coverage below 65% passes pre-commit but fails CI.

5. **Test coverage completeness**: Only CI checks for new untested scripts vs
   baseline. New scripts committed without tests pass pre-commit.

6. **CANON schema validation**: Removed from pre-commit (comment line 433:
   "fires ~1-2% of commits, non-blocking, CI validates the same thing").

#### B. Things that pass CI but fail pre-commit/pre-push

1. **Secrets scan (gitleaks)**: Only pre-commit. CI has NO secrets scanning. A
   CI-only workflow (e.g., direct push to main by admin, or a GitHub Action
   creating a commit) would bypass secrets scanning entirely.

2. **Code-reviewer gate**: Only pre-push. CI does not verify that code-reviewer
   was invoked for script changes.

3. **Cyclomatic/Cognitive complexity**: Only pre-push. CI does not check
   complexity. A direct push or PR from a fork could have high-complexity code
   pass CI.

4. **Propagation check**: Only pre-push. CI does not check for propagation
   misses in duplicate function copies.

5. **PR creep guard**: Only pre-commit. CI has no concept of branch commit
   count.

6. **Escalation gate**: Only pre-push. CI does not check for unacknowledged
   error-level warnings.

### Risk Assessment

The most dangerous divergence is **secrets scanning (gitleaks) having no CI
equivalent**. Any code path that bypasses local hooks (direct push, GitHub UI
edit, fork PR, Dependabot) gets no secrets check.

The second most dangerous is **security pattern check being non-blocking in CI
(`continue-on-error: true`)**. The pre-push hook is blocking for security
violations in new code, but CI lets them through.

---

## 6. `continue-on-error: true` Analysis

Four steps in the validate job use `continue-on-error: true`:

| Step                     | Line | Why Non-blocking                        | Risk if it Fails Silently        |
| ------------------------ | ---- | --------------------------------------- | -------------------------------- |
| Security pattern check   | 210  | "TODO: Remove once validated" (PR #457) | Security violations slip to main |
| Documentation check      | 214  | Templates/stubs have expected issues    | Low -- cosmetic                  |
| Audit file validation    | 223  | Non-critical metadata                   | Low -- audit trail quality       |
| Tech debt view freshness | 239  | Generated views can be regenerated      | Low -- stale dashboard only      |

**The security pattern check is the only HIGH-RISK non-blocking step.** The TODO
comment indicates this was meant to be temporary.

---

## 7. `if: always()` / `if: failure()` Analysis

**There are ZERO `if: always()` or `if: failure()` conditions in ci.yml.**

This means:

- Upload steps (Codecov, coverage artifact) use `if: success()` -- they only run
  on success. This is correct behavior (no point uploading broken coverage).
- There is no cleanup or notification on failure. If the pipeline fails, the
  only signal is the GitHub check status on the PR.

---

## 8. Proposed Fixes

### FIX 1: Add Validate to Required Status Checks (Priority: HIGH)

**Problem:** Validate is transitively required via build, making failures
opaque. **Fix:** Add `Validate & Compliance` to the GitHub ruleset's
required_status_checks. **Impact:** Direct visibility of validate failures in PR
checks. Safety net if build.needs is refactored. **Effort:** 1 minute -- ruleset
UI change.

### FIX 2: Promote Security Pattern Check to Blocking (Priority: HIGH)

**Problem:** `continue-on-error: true` on security-check.js means security
pattern violations pass CI silently. **Fix:** Remove `continue-on-error: true`
from the security pattern check step once PR #457 validation is complete. If not
ready, add a deadline comment. **Impact:** Security violations block merge.
**Effort:** 1 line change + validation run.

### FIX 3: Add Secrets Scanning to CI (Priority: HIGH)

**Problem:** gitleaks only runs in pre-commit hook. CI has no secrets scanning.
Fork PRs, GitHub UI edits, Dependabot PRs, and admin pushes bypass it. **Fix:**
Add a gitleaks step to the CI lint job or create a separate workflow. GitHub's
built-in secret scanning is another option if available. **Effort:** ~10 lines
of workflow YAML.

### FIX 4: Add Complexity Checks to CI (Priority: MEDIUM)

**Problem:** Cyclomatic and cognitive complexity are only checked in pre-push.
**Fix:** Add complexity check steps to the CI validate or test job. Use
`continue-on-error: true` initially, then promote to blocking. **Impact:**
Prevents high-complexity code from merging via paths that bypass local hooks.
**Effort:** ~15 lines of workflow YAML.

### FIX 5: Should Pre-commit Match CI Exactly? (Priority: LOW -- NO)

Pre-commit and CI serve different purposes:

- **Pre-commit:** Fast feedback loop. Checks staged files only. Runs in seconds.
  Auto-fixes where possible (Prettier, doc index).
- **CI:** Comprehensive validation. Checks entire codebase. Runs in minutes. No
  auto-fix (read-only).

Making them identical would either slow pre-commit unacceptably (adding unused
dep checks, coverage thresholds, oxlint) or weaken CI (removing comprehensive
checks). The current split is reasonable with two exceptions:

1. Secrets scanning must exist in BOTH (Fix 3).
2. Security pattern check must be blocking in BOTH (Fix 2 aligns CI with hooks).

### FIX 6: Validate Job Failure UX (Priority: LOW)

**Problem:** When validate fails, developers see "Build" as pending, not
"Validate failed." **Fix:** Already addressed by Fix 1 (adding validate to
required checks). The validate job will show its own red/green status directly.

---

## 9. Summary: Cascade Risk Matrix

| Cascade Point                     | Severity | Likelihood | Current Mitigation         | Fix  |
| --------------------------------- | -------- | ---------- | -------------------------- | ---- |
| Validate not in required checks   | MEDIUM   | LOW        | Transitive via build       | #1   |
| Security check non-blocking in CI | HIGH     | MEDIUM     | Pre-push hook (bypassable) | #2   |
| No secrets scanning in CI         | HIGH     | LOW        | Pre-commit hook only       | #3   |
| Complexity not checked in CI      | MEDIUM   | LOW        | Pre-push hook only         | #4   |
| Test baseline staleness           | LOW      | MEDIUM     | Clear error message        | None |
| Pre-commit/CI divergence          | LOW      | --         | Intentional by design      | #5   |

---

## 10. Appendix: Full CI Job Details

### Job 1: `lint` (Lint & Format)

- Steps: checkout, setup-node, npm ci, oxlint, eslint, prettier, circular deps,
  unused deps
- All steps blocking (no continue-on-error)
- Timeout: 10 min

### Job 2: `test` (Type Check & Test)

- Steps: checkout, setup-node, npm ci, tsc --noEmit, build review scripts,
  test:coverage, coverage threshold (65%), test coverage completeness, pattern
  test suite, GitHub optimization wave tests, Codecov upload, artifact upload
- All test/check steps blocking; upload steps conditional on success
- Timeout: 15 min

### Job 3: `validate` (Validate & Compliance)

- Steps: checkout (full history), setup-node, npm ci, get changed files, pattern
  compliance (PR mode or push-to-main mode), security pattern check
  (NON-BLOCKING), docs check (NON-BLOCKING), CANON schema, audit validation
  (NON-BLOCKING), tech debt schema, ROADMAP debt refs, tech debt views
  (NON-BLOCKING)
- 4 of 8+ substantive steps are non-blocking
- Timeout: 10 min

### Job 4: `build` (Build)

- Steps: checkout, setup-node, npm ci, npm run build
- Depends on: [lint, test, validate]
- Timeout: 20 min
