# PLAN: Zero-Warning Infrastructure

**Date:** 2026-03-19 **Decisions:** [DECISIONS.md](./DECISIONS.md) **Effort:**
XL (multi-session, parallel agents) **Branch:** housecleaning

---

## Wave 1: Blocking Fixes (B1-B4) — Steps 1-4

Steps 1-4 can run in parallel.

### Step 1: Fix CI Knip Failure (B1)

**Per Decision D1**

1. Verify if `hermes-parser` is used:
   `grep -r "hermes-parser" --include="*.js" --include="*.ts" --include="*.tsx"`
2. Verify if `isomorphic-dompurify` is used: same grep
3. If used outside knip scope (scripts/tests): add to `ignoreDependencies` in
   `knip.json`
4. If truly unused: `npm uninstall hermes-parser isomorphic-dompurify`
5. Also clean up knip.json: remove `react-resizable-panels` and `recharts` from
   `ignoreDependencies` if knip no longer flags them
6. Verify: `npm run deps:unused` exits 0

**Done when:** `npm run deps:unused` passes clean.

### Step 2: Fix Test Failure (B4)

**Per Decision D3 (fix everything)**

1. Edit `tests/scripts/retro-action-items.test.ts` line ~204
2. Change assertion from `normBlock.includes("!= null")` to
   `normBlock.includes("=== null") || normBlock.includes("=== undefined")`
3. Rebuild tests: `npm run test:build`
4. Verify: `npm test` — 0 failures

**Done when:** `npm test` shows 0 failures, 3851+ pass.

### Step 3: Refactor Cognitive CC Regressions (B3)

**Per Decision D3 — refactor all 6 functions**

| File                                               | Function               | Current CC | Target          |
| -------------------------------------------------- | ---------------------- | ---------- | --------------- |
| `.claude/hooks/session-start.js:631`               | regenerateHookWarnings | 50         | <=24 (baseline) |
| `.claude/skills/alerts/scripts/run-alerts.js:2734` | checkHookCompleteness  | 90         | <=67 (baseline) |
| `scripts/metrics/dedup-review-metrics.js:90`       | dedupMetrics           | 17         | <=15            |
| `scripts/test-hooks.js:565`                        | runTests               | 18         | <=15            |
| `scripts/validate-hook-manifest.js:61`             | extractBashCheckIds    | 60         | <=15            |
| `scripts/validate-hook-manifest.js:155`            | validate               | 54         | <=15            |

Approach (per D12): extract helper functions within each file. Verify:
`node scripts/check-cc.js` — 0 regressions beyond baseline.

**Done when:** `node scripts/check-cc.js` reports 0 regressions.

### Step 4: Add Cyclomatic CC Baseline Mechanism (B2)

**Per Decision D2**

1. Read `scripts/check-cc.js` to understand baseline format for cognitive CC
2. Create equivalent baseline mechanism for cyclomatic CC in the pre-push hook
3. Populate baseline with current violations (13 functions in run-alerts.js +
   others)
4. Refactor functions with CC>40:
   - `checkHookHealth` CC=54
   - `checkHookCompleteness` CC=47 (also in Step 3)
   - Any others identified by research agent
5. Verify: pre-push cyclomatic CC check passes without SKIP_CC

**Done when:** `git push --dry-run` cyclomatic CC check passes (or equivalent
direct invocation).

---

### Step 5: Audit Checkpoint — Wave 1

Run code-reviewer agent on all modified files from Steps 1-4. Verify all 4
blocking checks pass clean. **Commit:**
`fix: resolve all blocking pre-commit/pre-push/CI failures`

---

## Wave 2: CI Workflow Config (W1-W4) — Step 6

### Step 6: Fix CI Workflow Permissions (W1-W4)

**Per Decision D4**

1. Via `gh api`: enable "Allow GitHub Actions to create and approve pull
   requests"
2. Via `gh api`: enable `allow_auto_merge` on the repository
3. Update `release-please.yml` if needed for Node.js 20 deprecation warning
4. Update `auto-merge-dependabot.yml` — update `dependabot/fetch-metadata` to
   v3+ if available
5. Verify: trigger each workflow and confirm it passes
   - Release Please: `gh workflow run release-please.yml`
   - Sync README: check next ROADMAP.md change
   - Auto-merge: check next Dependabot PR
   - Pattern audit: `gh workflow run pattern-compliance-audit.yml`

**Done when:** All 4 workflows show green on their next run. **Commit:**
`fix(ci): enable PR creation permissions and auto-merge for workflows`

---

## Wave 3: Non-Blocking Warnings (N1-N14) — Steps 7-16

Steps 7-14 can run in parallel.

### Step 7: Fix Cross-Doc-Deps False Positives (N1)

**Per Decision D13**

1. Read `scripts/config/doc-dependencies.json`
2. Refine rules to distinguish internal implementation changes from user-facing
   command changes
3. Add path exclusions for `.claude/hooks/`, `.claude/skills/` internal files
4. Verify: modify an internal skill file, run cross-doc-deps check — no false
   positive

**Done when:** Cross-doc-deps check passes on internal-only changes without
override.

### Step 8: Fix Doc-Headers Exclusions (N2)

**Per Decision D17**

1. Read the doc-header check in `.husky/pre-commit` (Wave 9)
2. Add exclusion paths: `.claude/`, `.planning/`, `docs/audits/`
3. Verify: create a test .md file in `.claude/tmp/`, commit — no header warning

**Done when:** Doc-header check skips excluded paths.

### Step 9: Fix Pattern Compliance Warnings (N3)

**Per Decision D19 (fix everything)**

1. `.husky/pre-commit:326` — add `trap 'rm -f "$TMPFILE"' EXIT` after mktemp
2. `.husky/pre-commit:156` — add `-r` flag to xargs call
3. Verify: `npm run patterns:check` — 0 warnings

**Done when:** `npm run patterns:check` passes clean.

### Step 10: Refactor CI Oxlint Hook Warnings (N4)

**Per Decision D18**

Fix all 11 warnings in `.claude/hooks/` files:

- 4x `require()` without try/catch in `post-write-validator.js` (lines 24, 25,
  49, 415)
- `auditS0S1` CC=38 in `post-write-validator.js:282` — extract helpers
- Arrow function CC=16 in `lib/rotate-state.js:21` — extract helper
- `buildRecoveryHeader` CC=16 in `compact-restore.js:132` — extract helper
- `reportCommitFailure` CC=18 in `commit-tracker.js:398` — extract helper
- `main` CC=17 in `commit-tracker.js:290` — extract helper
- `writeFileSync` without atomic pattern in `check-remote-session-context.js:66`
  — use write-to-tmp-then-rename

Verify: `npm run lint:fast` on hook files — 0 warnings. Verify:
`npm run hooks:test` — 38/38 pass (no regressions).

**Done when:** Oxlint reports 0 warnings on `.claude/hooks/` files AND hook
tests pass.

### Step 11: ESLint Security Override for Tests (N5)

**Per Decision D5**

1. Add ESLint override in `.eslintrc.*` or `eslint.config.*`:
   ```
   { files: ["tests/**", "dist-tests/**", "**/*.test.*"],
     rules: { "security/detect-non-literal-fs-filename": "off",
              "security/detect-object-injection": "off",
              "security/detect-non-literal-require": "off",
              "security/detect-unsafe-regex": "off" } }
   ```
2. Verify: `npx eslint . --max-warnings 0` — significantly reduced warning count

**Done when:** ESLint test-file security warnings eliminated.

### Step 12: Fix Pattern Compliance Full Scan (N14)

**Per Decision D19 — fix ALL 73 blocking violations**

1. Run `npm run patterns:check-all` to get full list
2. Fix each blocking violation:
   - raw `error.message` → use `sanitize-error.js`
   - direct `fs.writeFileSync` in non-test code → use atomic write pattern
   - Other critical/high patterns
3. Verify: `npm run patterns:check-all` — 0 blocking violations

**Done when:** `npm run patterns:check-all` reports 0 critical/high violations.

### Step 13: Fix Documentation Issues (N7, N8, N9)

**Per Decision D7**

1. `CODE_OF_CONDUCT.md` — add Purpose/Overview, Version History, Last Updated
2. Fix version references: Next.js 16.1.1→16.2.0, Firebase 12.6.0→12.10.0,
   Tailwind 4.1.9→4.2.2, Zod 4.2.1→4.3.6
3. Fix ~50 markdownlint errors (MD037, MD049, MD053, MD051, MD028)
4. Fix docs:accuracy S1 items (6 unknown npm script references)
5. Fix docs:accuracy S2 items (broken file paths in audit docs)
6. Verify: `npm run docs:check`, `npm run docs:lint`, `npm run docs:accuracy` —
   all pass

**Done when:** All 3 doc check commands pass clean.

### Step 14: Fix Review System Integrity (N10, N11)

**Per Decision D8**

1. Sync 92 missing JSONL records: run review lifecycle sync
2. Fix 8 disposition integrity violations (totals don't match sums)
3. Fix 3 cross-database mismatches (round counts)
4. Verify: `npm run reviews:check-archive` — 0 findings
5. Verify: `npm run reviews:validate` — 0 violations

**Done when:** Both review check commands pass clean.

### Step 15: Clean Up Orphaned Test Files + ESM Warnings (N12, N13)

**Per Decisions D14, D15**

1. Delete 12 orphaned files from `dist-tests/`:
   - `archive-reviews.test.js`, `place-unassigned-debt.test.js`,
     `sync-reviews-to-jsonl.test.js`, `v1-parity-consolidation.test.js`,
     `v1-parity-sync-reviews.test.js`
   - `debt/analyze-placement.test.js`, `debt/categorize-and-assign.test.js`,
     `debt/generate-grand-plan.test.js`, `debt/sprint-complete.test.js`,
     `debt/sprint-intake.test.js`, `debt/sprint-status.test.js`,
     `debt/sprint-wave.test.js`
2. Add `rimraf dist-tests` as pre-step to `test:build` in package.json
3. Create per-directory `package.json` with `{"type": "module"}` in:
   - `scripts/lib/`, `scripts/metrics/`, `scripts/multi-ai/`,
     `scripts/planning/lib/`, `scripts/health/lib/`
4. Verify: `npm test` — no ESM warnings, 0 failures
5. Verify: `npm run test:build` cleans dist-tests first

**Done when:** `npm test` runs clean without MODULE_TYPELESS_PACKAGE_JSON
warnings.

### Step 16: Prettier Bulk Format (N6)

**Per Decisions D6, D11**

1. Run `npx prettier --write .`
2. Verify: `npx prettier --check .` — 0 files need formatting
3. **Separate commit:** `style: bulk format with Prettier`

**Done when:** `npx prettier --check .` passes clean.

---

### Step 17: Audit Checkpoint — Wave 3

Run code-reviewer agent on all modified files from Steps 7-16. **Commits** (per
D21, ~7 logical groups):

- `fix: resolve cross-doc-deps false positives and doc-header exclusions`
- `fix: refactor hook files for oxlint compliance`
- `fix: ESLint security overrides for test files`
- `fix: pattern compliance full scan — 73 blocking violations`
- `fix: documentation drift — accuracy, lint, headers`
- `fix: review system integrity — sync + disposition math`
- `chore: clean orphaned tests, ESM warnings, rimraf dist-tests`
- `style: bulk format with Prettier`

---

## Wave 4: Cosmetic Fixes — Step 18

### Step 18: Cosmetic Cleanup (Tier 4)

1. `docs:placement` — move 3 misplaced files
2. `roadmap:hygiene` — mark 8 completed items
3. `patterns:sync` — sync 5 pattern gaps
4. `audit:health` — update 3 stale baselines
5. Verify each: run the corresponding npm check command

**Done when:** All cosmetic check commands pass. **Commit:**
`chore: cosmetic cleanup — doc placement, roadmap hygiene, patterns sync`

---

## Wave 5: SWS/ROADMAP Cleanup — Step 19

### Step 19: Cross-Reference and Clean Up (D16)

**Per Decision D16**

1. Search ROADMAP.md for references to each fixed issue
2. Search `.planning/` for any SWS tasks/plans related to fixed items
3. Mark completed items as done, remove if appropriate
4. Verify: no stale references remain

**Done when:** ROADMAP.md and SWS artifacts reflect completed work. **Commit:**
`chore: update ROADMAP.md — mark zero-warning-infra items complete`

---

## Wave 6: Verification — Steps 20-21

### Step 20: Full Re-Research Verification (D9, D23)

**Per Decisions D9, D23**

Launch 6 parallel research agents (same scope as Phase 0):

1. Pre-commit agent — verify all 14 checks pass
2. Pre-push agent — verify all 12 checks pass
3. CI/CD agent — verify all 18 workflows pass
4. Test suite agent — verify 0 failures, 0 unexpected skips
5. Complexity agent — verify 0 regressions, baseline coverage
6. Other surfaces agent — verify all 25+ check commands pass

Additionally, run every npm check script and capture output:

```bash
npm run deps:unused && npm run deps:circular && npm run patterns:check &&
npm run patterns:check-all && npm run docs:check && npm run docs:lint &&
npm run docs:accuracy && npm run docs:placement && npm run reviews:check-archive &&
npm run reviews:validate && npm run backlog:check && npm run cc:check-all &&
npm run hooks:test && npm run hooks:health && npm run audit:health &&
npm test
```

Compile verification matrix: command → before status → after status.

**Done when:** All 6 agents report clean AND all npm commands pass.

### Step 21: Final Audit Checkpoint

Run code-reviewer on full diff (housecleaning vs main). Verify no security
issues introduced. Verify no untracked files.

**Done when:** Code review clean, `git status` shows no surprises. **Final
commit if needed:** `chore: verification cleanup`

---

## Summary

| Wave         | Steps        | Parallelizable   | Estimated Commits |
| ------------ | ------------ | ---------------- | ----------------- |
| 1: Blocking  | 1-4          | Yes (all 4)      | 1                 |
| 2: CI Config | 6            | Single           | 1                 |
| 3: Warnings  | 7-16         | Yes (8 parallel) | ~7                |
| 4: Cosmetic  | 18           | Single           | 1                 |
| 5: ROADMAP   | 19           | Single           | 1                 |
| 6: Verify    | 20-21        | Partially        | 0-1               |
| **Total**    | **21 steps** |                  | **~11 commits**   |
