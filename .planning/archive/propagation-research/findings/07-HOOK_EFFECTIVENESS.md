# Hook Effectiveness Analysis

**Document Version:** 1.0 **Last Updated:** 2026-03-20 **Status:** RESEARCH
FINDING

---

## 1. Complete Check Pipeline Matrix

### Pre-Commit Checks (14 checks)

| #   | Check ID             | Wave | Blocking?                                      | Condition                                      | Parallel Group                 | What It Catches                               |
| --- | -------------------- | ---- | ---------------------------------------------- | ---------------------------------------------- | ------------------------------ | --------------------------------------------- |
| 0   | `pr-creep`           | 0    | Block at 25 commits                            | Non-main branch                                | None                           | Branch growing too large for review           |
| 1   | `secrets-scan`       | 0    | **BLOCK**                                      | Always (requires gitleaks)                     | None                           | Leaked secrets (API keys, tokens)             |
| 2   | `eslint`             | 1    | **BLOCK**                                      | JS/TS files staged                             | `lint-test` (parallel)         | Lint errors in staged files                   |
| 3   | `tests`              | 1    | **BLOCK**                                      | Non-doc files staged; config changes force run | `lint-test` (parallel)         | Test failures                                 |
| 4   | `lint-staged`        | 2    | **BLOCK** (auto-fix)                           | Always                                         | None                           | Formatting issues (Prettier)                  |
| 5   | `pattern-compliance` | 3    | **BLOCK** (exit 1) / Warn (exit 0 w/ warnings) | Always                                         | `compliance-checks` (parallel) | Security anti-patterns, code patterns         |
| 6   | `audit-s0s1`         | 4    | **BLOCK**                                      | Audit JSONL files staged                       | `compliance-checks` (parallel) | S0/S1 audit findings missing verification     |
| 7   | `skill-validation`   | 6    | Warn                                           | Skill/command .md files staged                 | `compliance-checks` (parallel) | Malformed skill definitions                   |
| 8   | `propagation-staged` | 3b   | Warn                                           | Always                                         | None                           | Security pattern not applied to sibling files |
| 9   | `cross-doc-deps`     | 7    | **BLOCK**                                      | Always                                         | `doc-checks` (parallel)        | Broken cross-document references              |
| 10  | `doc-headers`        | 9    | **BLOCK**                                      | New .md files staged (diff-filter=A)           | `doc-checks` (parallel)        | Missing required headers on new docs          |
| 11  | `doc-index`          | 8    | Auto-fix                                       | .md files changed (ADM)                        | None (sequential)              | Stale DOCUMENTATION_INDEX.md                  |
| 12  | `agent-compliance`   | 10   | Warn (Block if STRICT_AGENT_CHECK)             | Always                                         | None                           | Code changed without agent review             |
| 13  | `debt-schema`        | 11   | **BLOCK**                                      | MASTER_DEBT.jsonl staged                       | None                           | Invalid tech debt schema                      |
| 14  | `jsonl-md-sync`      | 12   | Warn                                           | Planning JSONL staged                          | None                           | JSONL changed without MD regeneration         |

### Pre-Push Checks (12 checks)

| #   | Check ID                  | Wave | Blocking?                                                         | Condition                                   | What It Catches                                 |
| --- | ------------------------- | ---- | ----------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------- |
| 0   | `escalation-gate`         | 0    | **BLOCK**                                                         | Non-CI, unacknowledged error-level warnings | Accumulated errors that were never fixed        |
| 1   | `circular-deps`           | 1    | **BLOCK**                                                         | App code (lib/components/app/) changed      | Circular imports                                |
| 2   | `pattern-compliance-push` | 2    | Warn                                                              | JS/mjs files in push diff                   | Pattern issues in review-fix commits            |
| 3   | `code-reviewer-gate`      | 3    | **BLOCK** (bypassable w/ SKIP_REVIEWER)                           | scripts/.claude/hooks/.husky/ changed       | Script changes without code-reviewer invocation |
| 4   | `propagation`             | 4    | **BLOCK** (bypassable w/ SKIP_PROPAGATION)                        | Script .js files in push diff               | Duplicated functions not propagated to copies   |
| 5   | `hook-tests`              | 5    | **BLOCK**                                                         | .claude/hooks/\*.js changed                 | Broken hook scripts                             |
| 6   | `security-check`          | 6    | **BLOCK** (CRITICAL/HIGH) / Warn (MEDIUM/LOW)                     | JS/TS in diff, diff-only scan               | Security violations in new code                 |
| 7   | `type-check` (tsc)        | 7    | **BLOCK**                                                         | TS/TSX files in push diff                   | TypeScript type errors                          |
| 8   | `cyclomatic-cc`           | 7    | **BLOCK**                                                         | Always (parallel with tsc)                  | Functions with CC > 15 (baseline-aware)         |
| 9   | `cognitive-cc`            | 7    | **BLOCK** (exit 1) / Warn (exit 2+)                               | Always (parallel with tsc)                  | Functions with cognitive complexity > 15        |
| 10  | `npm-audit`               | 8    | Warn                                                              | Always                                      | High/critical npm vulnerabilities               |
| 11  | `triggers`                | 9    | **BLOCK** (exit 1, security triggers) / Warn (exit 0 w/ warnings) | Always                                      | Security file changes, consolidation needs      |

All pre-push checks skip on rebase-only pushes (no content changes vs upstream).

---

## 2. Cross-Layer Coverage Matrix: Hooks vs CI

| Check Category                 | Pre-Commit                        | Pre-Push                              | CI                                            | Gap Analysis                                                |
| ------------------------------ | --------------------------------- | ------------------------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| **ESLint**                     | BLOCK (staged)                    | --                                    | BLOCK (full)                                  | CI also runs `oxlint` (fast check); hooks only run ESLint   |
| **Tests**                      | BLOCK (conditional)               | --                                    | BLOCK (with coverage)                         | CI enforces 65% coverage threshold; hooks skip for doc-only |
| **Formatting (Prettier)**      | AUTO-FIX (lint-staged)            | --                                    | BLOCK (`format:check`)                        | Good layering: auto-fix locally, verify in CI               |
| **Type Check (tsc)**           | --                                | BLOCK (TS files in diff)              | BLOCK (full)                                  | OK: push-level + CI                                         |
| **Circular Deps**              | --                                | BLOCK (app code changed)              | BLOCK (full)                                  | OK: push-level + CI                                         |
| **Unused Deps/Exports**        | --                                | --                                    | BLOCK (`deps:unused`)                         | **HOLE**: Only CI catches unused dependencies               |
| **Pattern Compliance**         | BLOCK (staged)                    | Warn (push diff)                      | BLOCK (changed files on PR, all on main push) | Triple-layered; push is warning only                        |
| **Security Patterns**          | --                                | BLOCK (diff-only, CRIT/HIGH)          | Non-blocking (`continue-on-error: true`)      | **INVERSION**: Hooks more strict than CI                    |
| **Secrets Scan**               | BLOCK (gitleaks)                  | --                                    | --                                            | **HOLE**: No CI secrets scan (relies on local gitleaks)     |
| **Propagation**                | Warn (staged siblings)            | BLOCK (push diff scripts)             | --                                            | **HOLE**: No CI propagation check                           |
| **Code Review Gate**           | --                                | BLOCK (script changes)                | --                                            | **HOLE**: No CI equivalent; purely local enforcement        |
| **Documentation Check**        | BLOCK (headers, cross-doc, index) | --                                    | Non-blocking (`continue-on-error`)            | CI is lenient for templates/stubs                           |
| **CANON Validation**           | Removed from hooks (C7-G3)        | --                                    | BLOCK (`validate:canon`)                      | OK: Fires rarely, CI validates                              |
| **Audit Validation**           | BLOCK (staged S0/S1)              | --                                    | Non-blocking (`continue-on-error`)            | **MISMATCH**: Hook stricter than CI                         |
| **Tech Debt Schema**           | BLOCK (MASTER_DEBT staged)        | --                                    | BLOCK (if file exists)                        | OK: Both enforce                                            |
| **ROADMAP Debt Refs**          | --                                | --                                    | BLOCK (if debt file exists)                   | **HOLE**: Only CI checks                                    |
| **Test Coverage Completeness** | --                                | --                                    | BLOCK (`check-coverage`)                      | **HOLE**: Only CI catches new untested scripts              |
| **Build**                      | --                                | --                                    | BLOCK (`npm run build`)                       | **HOLE**: No local build check                              |
| **npm Audit**                  | --                                | Warn                                  | --                                            | Informational only; never blocks                            |
| **Complexity (CC)**            | --                                | BLOCK (cyclomatic) / Warn (cognitive) | --                                            | **HOLE**: No CI complexity check                            |
| **Agent Compliance**           | Warn                              | --                                    | --                                            | Purely local informational check                            |
| **Trigger System**             | --                                | BLOCK (security) / Warn (others)      | --                                            | **HOLE**: No CI equivalent                                  |

---

## 3. Identified Holes

### 3A. Checks in CI but NOT in hooks (things that slip through locally)

1. **Unused dependencies/exports** (`deps:unused`) -- Only CI catches; could
   catch dead code earlier
2. **ROADMAP debt references** (`sync-roadmap-refs.js --check-only`) -- CI-only
3. **Test coverage completeness** (`generate-test-registry.js --check-coverage`)
   -- CI-only; new untested files slip through
4. **Build verification** (`npm run build`) -- No local build gate at all
5. **oxlint fast check** -- CI has it as a fast-feedback step; hooks skip it

### 3B. Checks in hooks but NOT in CI (things only caught locally)

1. **Propagation check** -- No CI equivalent for detecting un-propagated fixes
2. **Code-reviewer gate** -- No CI enforcement; purely relies on agent
   invocation tracking
3. **Complexity (cyclomatic + cognitive CC)** -- No CI complexity check
4. **Trigger system** -- No CI trigger check
5. **npm audit** -- No CI security audit step
6. **Agent compliance** -- No CI equivalent

### 3C. Warning-level checks (informational, non-blocking)

1. `pattern-compliance-push` (pre-push) -- Warns but does not block
2. `propagation-staged` (pre-commit) -- Warns about sibling files missing
   security patterns
3. `skill-validation` (pre-commit) -- Warns about malformed skill definitions
4. `agent-compliance` (pre-commit) -- Warns about unreviewed code changes
5. `jsonl-md-sync` (pre-commit) -- Warns about missing MD regeneration
6. `npm-audit` (pre-push) -- Warns about vulnerabilities; never blocks
7. `cognitive-cc` (pre-push, exit 2+) -- Errors degrade to warnings
8. `triggers` (pre-push, exit 0 with warnings) -- Non-security triggers are
   warnings

### 3D. Checks that should be blocking but currently are not

1. **`propagation-staged`** -- Currently warn-only. Given that propagation
   misses cause multi-round review churn (documented as "8x recommended across
   PRs #366-#388"), this should be blocking when security patterns are involved
2. **`npm-audit`** -- High/critical vulnerabilities are warning-only. CI has no
   audit either. Should at least block on critical
3. **Security pattern check in CI** -- Has `continue-on-error: true`, meaning it
   can never block CI. This is weaker than the hook

---

## 4. Hook Execution Time Analysis

### Data Source

96 entries in `.claude/state/hook-runs.jsonl` spanning 2026-03-17 to 2026-03-20.

### Pre-Commit Timing (from hook-runs.jsonl)

| Metric                 | Duration                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Median total**       | ~55-75s (with doc-index), ~28-33s (without)                                                                  |
| **Fastest observed**   | 8.6s (doc-only, ESLint+tests skipped)                                                                        |
| **Slowest observed**   | 132.7s (large doc-index regen: 105s)                                                                         |
| **Biggest bottleneck** | `doc-index` auto-fix: 27-105s (median ~43s)                                                                  |
| **Second bottleneck**  | `eslint` + `tests` parallel: 17-30s each                                                                     |
| **Fast checks**        | pattern-compliance (~280ms), propagation-staged (~310ms), agent-compliance (~290ms), cross-doc-deps (~250ms) |

### Pre-Push Timing

| Metric                 | Duration                                                    |
| ---------------------- | ----------------------------------------------------------- |
| **Median total**       | ~13-15s (full checks), ~7-8s (rebase/skip mode)             |
| **Fastest observed**   | 6.2s (most checks skipped due to no relevant changes)       |
| **Slowest observed**   | 23.2s (full check suite with hook-tests)                    |
| **Biggest bottleneck** | `hook-tests` when triggered: 4.5-5.8s                       |
| **Second bottleneck**  | `tsc` / `cyclomatic-cc` / `cognitive-cc` parallel: 3.5-4.5s |
| **Fast checks**        | escalation-gate (~200ms), propagation (~260ms when running) |

### Timeout Configuration

- Per hook-checks.json, individual check timeouts range from 5s to 60s
- No overall hook timeout is configured
- No evidence of timeout-related failures in the data

### Smart Skipping Effectiveness

The conditional skip system is highly effective:

- Doc-only pre-commits save ~50s by skipping tests
- Rebase-only pre-pushes save ~15s by skipping all code analysis
- File-type filtering prevents unnecessary ESLint/tsc runs

---

## 5. Hook Failure Analysis

### From hook-runs.jsonl (96 entries)

| Outcome | Count | Percentage |
| ------- | ----- | ---------- |
| pass    | ~35   | ~36%       |
| warn    | ~61   | ~64%       |
| fail    | 0     | 0%         |

**Zero recorded failures in 96 hook runs.** Every hook run either passed or
passed with warnings. This raises a question: are the blocking checks effective,
or are failures not being recorded? The JSONL data only records successful hook
completions (the write happens at the end of the hook). A hook that exits early
on failure would not write to the JSONL file. This is a **telemetry blind spot**
-- we have no data on how often hooks actually block commits/pushes.

### Warning Frequency (from hook-warnings-log.jsonl, 53 entries)

| Warning Type                      | Occurrences               | Trend                                 |
| --------------------------------- | ------------------------- | ------------------------------------- |
| `trigger` (pre-push)              | 13 (most frequent)        | Occurring on almost every push        |
| `audit/npm-audit` (pre-push)      | 10                        | Persistent -- vulnerability not fixed |
| `reviewer` (pre-push)             | 7                         | Frequent bypass of code-reviewer gate |
| `propagation` (pre-push)          | 7 (6 bypass + 1 detected) | Mix of bypasses and real catches      |
| `propagation-staged` (pre-commit) | 6                         | Regular detection of sibling misses   |
| `patterns` (pre-push)             | 3                         | Occasional pattern compliance issues  |
| `agent` (pre-commit)              | 2                         | Code changes without agent review     |
| `hook-tests` (pre-push)           | 1                         | Single occurrence                     |
| `network-error` (pre-push)        | 1                         | npm audit network failure             |

### Most Common Warning Patterns

1. **Trigger warnings are wallpaper.** 13 occurrences, never acknowledged. The
   "WARNING TRIGGERS (recommended actions)" message fires on nearly every push
   and is routinely ignored. This is the textbook case of alert fatigue.
2. **npm audit warnings are persistent.** 10 occurrences tracking the same
   unfixed vulnerability. Warning but never blocking means it gets ignored.
3. **Code-reviewer bypass is common.** 7 bypasses -- the gate is blocking but
   the skip path (SKIP_REVIEWER=1) is used frequently. The bypass log mechanism
   works, but there is no escalation for repeated bypasses.
4. **Propagation warnings are the most actionable.** The warnings include
   specific file paths and pattern names (e.g., `statSync-without-lstat`,
   `path-resolve-without-containment`), making them easy to act on.

---

## 6. The Propagation Check Specifically

### Architecture

Two separate propagation checks exist:

1. **`propagation-staged`** (pre-commit, warn-only) -- Checks if security
   patterns applied to staged files exist in un-staged sibling files in the same
   directory. Fast (~300ms).
2. **`propagation`** (pre-push, blocking with SKIP_PROPAGATION bypass) -- Runs
   `check-propagation.js --blocking` on script .js files in the push diff.
   Checks known pattern rules (statSync-without-lstat,
   path-resolve-without-containment, etc.). Slower (~250ms-1.6s).

### Has It Caught Real Propagation Misses?

**Yes, confirmed.** From the warnings log:

- **statSync-without-lstat**: Detected in
  `scripts/analyze-learning-effectiveness.js:45`,
  `scripts/archive/archive-reviews.js:72`,
  `scripts/archive/run-consolidation.v1.js:89` (2026-03-19)
- **path-resolve-without-containment**: Detected in
  `.claude/hooks/block-push-to-main.js:32`,
  `.claude/hooks/commit-tracker.js:268`,
  `scripts/audit/validate-audit-integration.js:1074` (2026-03-17)
- **propagation-staged** has fired 6 times on pre-commit, detecting sibling-file
  security pattern misses

However, all of these were **bypassed** (SKIP_PROPAGATION=1) rather than fixed
before push. The propagation check catches real issues but the bypass escape
hatch is used every time.

### Should It Be Elevated to Blocking?

The pre-push propagation check is already declared as `"blocking": "block"` in
hook-checks.json and uses `--blocking` flag + `exit 1` in the hook script.
However:

- It is trivially bypassable via
  `SKIP_PROPAGATION=1 SKIP_REASON="reason" git push`
- Every instance in the data was bypassed, not fixed
- The pre-commit `propagation-staged` check is warn-only and serves as an early
  signal

**Recommendation**: The blocking level is correct but the bypass rate (100%)
indicates the check may be too noisy for its current pattern set. The fix is not
to elevate the warning -- it is already blocking -- but rather to:

1. Add baseline exclusion for known debt (like cyclomatic-cc uses
   `known-debt-baseline.json`)
2. Reduce false positives so real issues are not drowned in known debt noise
3. Consider making `propagation-staged` (pre-commit) blocking once baseline
   exclusion exists

---

## 7. Skip/Bypass Analysis

### SKIP_CHECKS Mechanism

All skips require `SKIP_REASON` with:

- Minimum 10 characters
- Maximum 500 characters
- No "pre-existing" as a reason (banned)
- No control characters or multi-line
- Logged to override audit trail via `log-override.js`

This is well-designed. The audit trail exists. However:

### --no-verify Usage

- Explicitly banned in DEVELOPMENT.md and REVIEW_POLICY_QUICK_REF.md
- Known tech debt item (DEBT-1902, DEBT-10338): `sync-readme.yml` workflow uses
  `--no-verify`
- Claude Code behavioral guardrail 9 routes to `/pre-commit-fixer` instead of
  `--no-verify`
- No evidence of `--no-verify` in actual hook-runs data (since bypassed hooks
  would not log)

### Bypass Frequency

The `SKIP_REVIEWER=1` bypass was used 7 times in 10 days. The
`SKIP_PROPAGATION=1` bypass was used at least 6 times. This suggests these
checks fire too often for their current configuration, leading to bypass
normalization.

---

## 8. Parallelization Analysis

### Current Parallelization

Pre-commit already parallelizes well:

- **Wave 1**: ESLint + Tests run in parallel (saves ~15-25s)
- **Wave 3**: pattern-compliance + audit-s0s1 + skill-validation run in parallel
- **Wave 7**: cross-doc-deps + doc-headers run in parallel
- **Wave 8**: doc-index runs sequentially (modifies staged files)

Pre-push parallelizes:

- **Wave 7**: tsc + cyclomatic-cc + cognitive-cc run in parallel (saves ~5-8s)

### Opportunities for Further Parallelization

1. **doc-index is the biggest bottleneck** at 27-105s. It runs sequentially
   because it modifies staged files. Could it be moved to an auto-fix step that
   runs before the main checks?
2. **Pre-push checks 1-6 run sequentially** (circular-deps,
   pattern-compliance-push, code-reviewer-gate, propagation, hook-tests,
   security-check). Some of these could run in parallel since they have no
   shared state.
3. **The biggest win would be fixing doc-index performance** rather than
   parallelizing more checks. At 43s median, it dominates the pre-commit time.

---

## 9. Telemetry Blind Spots

### Critical: No failure recording

Hook-runs.jsonl is written at the end of the hook via `write_hook_runs_jsonl()`.
If the hook exits early (on failure), this function is never called. The data
shows 0 failures out of 96 runs, which is almost certainly inaccurate. We have
no data on:

- How often do commits get blocked?
- Which check fails most often?
- How long do failed runs take before failing?

**Recommendation**: Move the JSONL write to an EXIT trap so failures are also
recorded. The `add_exit_trap` mechanism already exists.

### Missing: Hook skip tracking

When someone uses `--no-verify`, no record is created at all. This is inherent
to git's design but means we cannot track bypass frequency.

---

## 10. Improvement Recommendations

### Priority 1: Fix telemetry (Low effort, High value)

- Move `write_hook_runs_jsonl` into an EXIT trap so failures are recorded
- Add an "exit_code" field to distinguish clean pass from fail
- This provides data to evaluate all other recommendations

### Priority 2: Reduce doc-index bottleneck (Medium effort, High value)

- `doc-index` auto-fix takes 27-105s (median 43s), dominating pre-commit time
- Investigate why `npm run docs:index` is so slow
- Consider incremental index updates instead of full regeneration
- Alternative: Move doc-index to pre-push or a separate hook

### Priority 3: Add propagation baseline (Medium effort, Medium value)

- Both propagation checks fire on known pre-existing issues
- Add baseline exclusion (like `known-debt-baseline.json` for CC) so only NEW
  propagation misses are caught
- This would reduce bypass rate from 100% to near 0%

### Priority 4: Address alert fatigue (Low effort, Medium value)

- `trigger` warnings fire on 13/14 pushes -- this is wallpaper
- `npm-audit` warns persistently about the same vulnerability
- Either fix the root cause, add to a baseline, or increase the severity
  threshold

### Priority 5: Add CI complexity check (Low effort, Medium value)

- Cyclomatic and cognitive complexity are only checked in pre-push hooks
- Add `scripts/check-cyclomatic-cc.js` and `scripts/check-cc.js` to CI validate
  job
- This catches complexity regressions even if hooks are bypassed

### Priority 6: Add CI propagation check (Medium effort, Medium value)

- Propagation is only checked locally; no CI equivalent
- Add to CI validate job for PRs, especially for script changes

### Priority 7: Fix CI security check (Low effort, Medium value)

- CI security pattern check has `continue-on-error: true` (non-blocking)
- Pre-push hook is stricter (blocks on CRITICAL/HIGH)
- Remove `continue-on-error` once baseline is clean, or add baseline exclusion

### Priority 8: Pre-push parallelization (Medium effort, Low value)

- Checks 1-6 (circular-deps through security-check) run sequentially
- Could save ~3-5s by running independent checks in parallel
- Low value because pre-push is already fast (7-15s typical)

### Not recommended

- **Making npm-audit blocking**: Network failures would block pushes; better to
  fix the actual vulnerability
- **Removing propagation-staged from pre-commit**: It is fast (~300ms) and
  provides early warning signal
- **Adding build check to hooks**: Build takes 20+ seconds and CI already
  catches it; not worth the developer time cost

---

## 11. Summary Scorecard

| Dimension                | Score | Notes                                                        |
| ------------------------ | ----- | ------------------------------------------------------------ |
| Coverage breadth         | 8/10  | 26 distinct checks across 2 hooks + CI; few genuine holes    |
| Blocking effectiveness   | 6/10  | Good gates exist but bypass is easy and frequent             |
| Warning signal-to-noise  | 4/10  | Trigger + npm-audit warnings are wallpaper (alert fatigue)   |
| Execution speed          | 5/10  | doc-index bottleneck (43s median) makes pre-commit feel slow |
| Telemetry                | 3/10  | No failure recording; bypass tracking impossible             |
| Propagation specifically | 7/10  | Catches real issues; needs baseline to reduce noise          |
| Parallelization          | 7/10  | Good for pre-commit; pre-push could improve slightly         |
| Skip discipline          | 8/10  | Reason required, banned phrases, audit trail, length limits  |

**Overall: The pipeline is architecturally sound but has execution-level issues:
alert fatigue, a doc-index bottleneck, telemetry blind spots, and bypass
normalization on propagation/reviewer checks.**
