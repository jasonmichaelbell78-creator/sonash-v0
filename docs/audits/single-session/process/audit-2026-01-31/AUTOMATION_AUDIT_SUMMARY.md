# SoNash Automation Audit - Improvement Opportunities

**Date:** 2026-01-31 **Total Findings:** 20 improvements identified **Severity
Level:** All S3 (Medium) **Estimated Total Time Savings:** ~4-6 minutes per
developer per week

---

## Executive Summary

SoNash has comprehensive automation (29 hooks, 8 CI workflows, 60+ scripts).
Analysis revealed **20 optimization opportunities** focused on:

1. **Eliminating duplicate checks** (tests, patterns, validation running 2-3x)
2. **Consolidating overlapping scripts** (980+ lines of duplicated logic)
3. **Improving error messages** (cryptic output losing developer context)
4. **Automating manual processes** (docs:index, review checks)
5. **CI resource optimization** (caching, conditional runs)

### High-Impact Quick Wins

| Issue                                               | Savings           | Effort |
| --------------------------------------------------- | ----------------- | ------ |
| **IMPROVEMENT-001:** Cache pattern check results    | 6-9s/commit       | 10min  |
| **IMPROVEMENT-003:** Add npm cache-hit conditionals | 45-60s/CI run     | 15min  |
| **IMPROVEMENT-011:** Deduplicate test runs          | 40-60s/CI run     | 20min  |
| **IMPROVEMENT-010:** Auto-run docs:index            | 30-60s/doc update | 5min   |

---

## Findings Detail

### Category 1: Hook Consolidation (5 findings)

These improvements reduce duplicate script invocations within git hooks.

#### IMPROVEMENT-001: Duplicate Pattern Check Runs

- **Issue:** `npm run patterns:check` runs 3 times in pre-commit (with different
  outputs)
- **Current Flow:** Check → Display on fail → Silent check again → Display
  success
- **Fix:** Store output in variable, reuse
- **Impact:** 6-9s per commit saved
- **File:** `.husky/pre-commit` (line 35-42)

#### IMPROVEMENT-002: Multiple Lint Invocations

- **Issue:** `npm run lint` runs twice (silent validation + output display)
- **Current Flow:** Silent run (line 9) → Display output on failure (line 11)
- **Fix:** Capture output once with `npm run lint 2>&1` and check exit code
- **Impact:** 2-4s per commit saved
- **File:** `.husky/pre-commit` (line 9-16)

#### IMPROVEMENT-004: Redundant CANON Validation

- **Issue:** `npm run validate:canon` runs in both pre-commit hook AND CI
- **Current Flow:** Local warning → CI blocking validation (duplicate)
- **Fix:** Remove from pre-commit (CI catches issues anyway)
- **Impact:** 1-2s per commit saved
- **Files:** `.husky/pre-commit`, `.github/workflows/ci.yml`

#### IMPROVEMENT-009: Conditional Skill Validation

- **Issue:** `npm run skills:validate` only runs when skill files change, but
  skill issues affect builds unpredictably
- **Current:** Only triggers on `.claude/skills/` or `.claude/commands/` changes
- **Fix:** Always run skills:validate or expand trigger to include `.claude/`
  root changes
- **Impact:** Earlier catch of skill-related build failures
- **File:** `.husky/pre-commit` (line 107-117)

#### IMPROVEMENT-018: Incomplete Header Checks

- **Issue:** `npm run docs:headers` only checks NEW markdown files
  (diff-filter=A), skips modifications
- **Current:** Only runs on `--diff-filter=A` (Added files)
- **Fix:** Check both Added AND Modified: `--diff-filter=AM`
- **Impact:** Maintains documentation quality over time
- **File:** `.husky/pre-commit` (line 159)

---

### Category 2: CI Optimization (6 findings)

Improvements to GitHub Actions workflows for faster CI/CD.

#### IMPROVEMENT-003: npm Install Cache Optimization

- **Issue:** Multiple CI jobs install dependencies without conditional skip if
  cache hit
- **Affected Workflows:** ci.yml, backlog-enforcement.yml, docs-lint.yml,
  review-check.yml (5+ jobs total)
- **Current:** Every job runs `npm ci` even if node_modules cached
- **Fix:** Add job conditional to skip npm ci when cache-key hits
  ```yaml
  - name: Install deps
    if: steps.setup-node.outputs.cache-hit != 'true'
    run: npm ci
  ```
- **Impact:** 45-60s per CI run (saves 30-40% of dependency install time)
- **Files:** `.github/workflows/*.yml`

#### IMPROVEMENT-006: Duplicate Pattern Compliance Runs

- **Issue:** CI runs pattern check TWICE: once for changed files (PR), once for
  --all (main)
- **Current Flow:** PR: patterns:check (changed) → Main: patterns:check --all
  (duplicate step)
- **Fix:** Single step with conditional logic
  ```yaml
  - if: github.event_name == 'pull_request'
    run: node scripts/check-pattern-compliance.js -- ${{ files }}
  - if: github.event == 'push'
    run: npm run patterns:check-all
  ```
- **Impact:** 8-10s per CI run saved
- **File:** `.github/workflows/ci.yml` (line 59-76)

#### IMPROVEMENT-011: Duplicate Test Runs (Hook + CI)

- **Issue:** Tests run in pre-commit hook (40-60s) THEN again in CI (50s)
- **Current:** Local gate → Remote gate (both full test suites)
- **Fix:** Only run tests in CI; skip local tests (dev already runs tests
  locally)
- **OR:** Cache test results between pre-commit and CI
- **Impact:** 40-60s per CI run + better local dev experience
- **Files:** `.husky/pre-commit`, `.github/workflows/ci.yml`

#### IMPROVEMENT-016: Unused Dependency Check Optimization

- **Issue:** `npm run deps:unused` (knip) takes 3-5s but runs on every commit
- **Current:** Runs regardless of package.json/lock changes
- **Fix:** Skip if package.json and lock files not in PR
  ```yaml
  - name: Check unused deps
    if: contains(steps.changed-files.outputs.all_changed_files, 'package.json')
    run: npm run deps:unused
  ```
- **Impact:** 3-5s saved on 50% of CI runs
- **File:** `.github/workflows/ci.yml` (line 37-40)

#### IMPROVEMENT-019: Overambitious Sonarcloud Triggers

- **Issue:** Sonarcloud runs on every push, even feature branch commits
- **Current:** Triggers on: push to main, PR, workflow_dispatch
- **Fix:** Only run on main branch or PRs (skip feature branch pushes)
  ```yaml
  on:
    push:
      branches: ["main"] # Remove push trigger or add branch filter
    pull_request:
      branches: ["main"]
  ```
- **Impact:** 5-10s per feature branch commit
- **File:** `.github/workflows/sonarcloud.yml`

---

### Category 3: Script Consolidation (2 findings)

Opportunities to reduce duplicated code across scripts.

#### IMPROVEMENT-008: Overlapping Validation Scripts

- **Issue:** Multiple scripts implement same validation logic
- **Details:**
  - `validate-audit.js` (980 lines) + `audit:validate` script (npm run)
  - Pattern definitions repeated in: check-pattern-compliance.js,
    security-check.js, suggest-pattern-automation.js
  - `sanitize-error.js` exists in both .js and .ts versions
- **Fix:** Single source of truth
  - Remove `sanitize-error.ts` (use .js version only)
  - Extract pattern definitions to `lib/pattern-definitions.js`
  - Consolidate audit validation to single module
- **Impact:** Reduces maintenance overhead 10-15%, easier to update patterns
- **Files:** `scripts/lib/`, `scripts/validate-*.js`

#### IMPROVEMENT-013: Overlapping Learning Analysis

- **Issue:** Two scripts process AI review learnings similarly
- **Details:**
  - `analyze-learning-effectiveness.js` (1271 lines) - full analysis
  - `check-pattern-compliance.js` (888 lines) - uses learning patterns
- **Current:** Both parse learning logs, build pattern maps independently
- **Fix:** Extract to `lib/learning-analyzer.js`
  - Single learning log parser
  - Shared pattern matching algorithm
- **Impact:** Reduces codebase complexity, easier to fix bugs in pattern logic
- **Files:** `scripts/lib/learning-analyzer.js` (new)

---

### Category 4: Manual Process Automation (4 findings)

Processes currently requiring manual intervention that could be automated.

#### IMPROVEMENT-005: Pre-push Review Check

- **Issue:** Review triggers only checked in CI (review-check.yml), not local
- **Current:** Commit → Push → CI runs check → PR comment (no local early
  warning)
- **Fix:** Add to pre-push hook: `npm run review:check`
- **Impact:** Instant feedback before push (faster iteration)
- **File:** `.husky/pre-push`

#### IMPROVEMENT-010: Auto-Run Documentation Index

- **Issue:** When .md files change, developer must manually run
  `npm run docs:index` and stage changes
- **Current:** Manual gate blocks commit
- **Fix:** Auto-run and stage in pre-commit hook
  ```bash
  if [ -n "$CHANGED_MD_FILES" ]; then
    npm run docs:index
    git add DOCUMENTATION_INDEX.md
  fi
  ```
- **Impact:** Eliminates manual step, 30-60s per doc update
- **File:** `.husky/pre-commit`

#### IMPROVEMENT-017: Cross-Doc Dependency Auto-Fix

- **Issue:** `npm run crossdoc:check` blocks with error but provides no auto-fix
- **Current:** Block → User manually edits dependent docs → Retry
- **Fix:** Add `--auto-fix` or `--suggest` flag
  - Option 1: Auto-update dependent doc references
  - Option 2: Show exact edits needed (less risky)
- **Impact:** 5-10min saved per cross-doc violation
- **File:** `scripts/check-cross-doc-deps.js`

#### IMPROVEMENT-020: Pattern Fix Suggestions

- **Issue:** `npm run patterns:check` shows violations but generic "run
  patterns:check" help
- **Current:** Error message: "Fix pattern violations before pushing. Run: npm
  run patterns:check"
- **Fix:** Add `--suggest` flag with specific fixes
  ```bash
  node scripts/check-pattern-compliance.js --file myfile.js --suggest
  # Output:
  # Pattern #4 (exit-code-capture): Use 'if ! OUT=$(cmd); then'
  # Location: line 42
  ```
- **Impact:** 10-20min saved per pattern violation
- **File:** `scripts/check-pattern-compliance.js`

---

### Category 5: Error Message Improvement (3 findings)

Better error output for faster developer debugging.

#### IMPROVEMENT-007: Inconsistent Error Message Quality

- **Issue:** Error output is inconsistent - some show tail, some show grep
  filtered
- **Current Examples:**
  - Pattern compliance: "tail -15" (loses first violations if output long)
  - Cross-doc check: Full output (sometimes verbose)
  - Type errors: Truncated to 10 lines
- **Fix:** Standardize format with file:line:column:message
  ```
  ❌ file.js:42:5 - Pattern #4: 'exit-code-capture' detected
     if ! OUT=$(cmd); then ...
     Use: if ! OUT=$(cmd); then
  ```
- **Impact:** Saves 5-10min debugging per error
- **Files:** `.husky/pre-commit`, `.husky/pre-push`

#### IMPROVEMENT-014: Opaque Pre-push Pattern Errors

- **Issue:** Pre-push shows 15 grep-filtered lines for pattern violations
- **Current Output:** Loses line numbers, context, which file
- **Fix:** Show full `patterns:check` output with formatting
- **Impact:** Saves 10-15min debugging per violation
- **File:** `.husky/pre-push` (line 30)

---

### Category 6: Observability/Tooling (1 finding)

#### IMPROVEMENT-012: No Hook Timing Visibility

- **Issue:** Developers don't know which hook step is slowest
- **Current:** Total hook time: 90-120s (no breakdown)
- **Fix:** Add timing per step
  ```bash
  echo "🕐 Starting $(date +%H:%M:%S)" > /tmp/hook-times.txt
  # ... each check ...
  echo "✓ Lint: $(( $(date +%s%N) - START_TIME ))ms" >> /tmp/hook-times.txt
  ```
- **Impact:** Enables data-driven optimization
- **File:** `.husky/pre-commit`, `.husky/pre-push`

---

## Implementation Priority

### Phase 1: Quick Wins (2-3 hours total)

1. **IMPROVEMENT-001** (6-9s/commit) - 10min
2. **IMPROVEMENT-002** (2-4s/commit) - 5min
3. **IMPROVEMENT-010** (30-60s/doc) - 5min
4. **IMPROVEMENT-003** (45-60s/CI) - 15min
5. **IMPROVEMENT-004** (1-2s/commit) - 3min

**Total savings: ~75-85s per commit + 45-60s per CI run**

### Phase 2: Medium Effort (3-4 hours)

6. **IMPROVEMENT-007** - Standardize error messages (20min)
7. **IMPROVEMENT-012** - Add timing measurements (15min)
8. **IMPROVEMENT-018** - Fix header check scope (5min)
9. **IMPROVEMENT-006** - Deduplicate pattern runs (20min)
10. **IMPROVEMENT-016** - Conditional knip check (10min)

### Phase 3: Larger Refactors (5-6 hours)

11. **IMPROVEMENT-008** - Consolidate validators (2h)
12. **IMPROVEMENT-013** - Extract learning analyzer (1.5h)
13. **IMPROVEMENT-017** - Auto-fix cross-doc (1h)
14. **IMPROVEMENT-020** - Add pattern suggestions (1h)

---

## Hook Complexity Baseline

Current automation footprint:

| Component           | Lines       | Checks     |
| ------------------- | ----------- | ---------- |
| `.husky/pre-commit` | 274         | 13         |
| `.husky/pre-push`   | 156         | 7          |
| 8 CI workflows      | ~2,000      | 40+        |
| 60+ scripts         | ~30,000     | Various    |
| 29 .claude hooks    | ~5,400      | Validation |
| **Total**           | **~37,600** | **60+**    |

---

## Recommendations

1. **Start with Phase 1** - low risk, immediate ROI (4-5 minutes saved per dev
   per week)
2. **Measure before/after** - add hook timing (IMPROVEMENT-012) first
3. **Consolidate during refactors** - when touching validation scripts, extract
   common logic
4. **Document trade-offs** - some optimizations (skip tests in CI) need team
   discussion
5. **Monitor for regressions** - ensure consolidations don't lose important
   checks

---

## Files Affected

Most impactful changes to:

- `.husky/pre-commit` (5 improvements)
- `.github/workflows/ci.yml` (4 improvements)
- `scripts/check-pattern-compliance.js` (2 improvements)
- `scripts/lib/` (consolidation target for 2 improvements)

---

## Success Metrics

- **Pre-commit time:** 120s → 45-50s (60% reduction)
- **CI total time:** Varies, 45-60s savings per run
- **Error resolution time:** 15-30min → 5-10min average
- **Script maintenance burden:** -200+ lines duplicate code
