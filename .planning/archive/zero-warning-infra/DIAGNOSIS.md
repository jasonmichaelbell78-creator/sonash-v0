# DIAGNOSIS: Zero-Warning Infrastructure

**Date:** 2026-03-19 **ROADMAP alignment:** Aligned — infrastructure health
supports all roadmap work **Reframe check:** Task is what it appears to be —
eliminate pre-existing failures

## Research Method

6 parallel research agents scanned every check surface: pre-commit (14 checks),
pre-push (12 checks), CI/CD (18 workflows), test suite (3851 tests), complexity
(209 cyclomatic + 368 cognitive), and 25 other surfaces (patterns, docs,
reviews, TDMS, ESLint, Prettier, etc.)

## Findings by Impact Tier

### Tier 1: BLOCKING (prevents clean commit/push/CI)

| #   | Surface         | Issue                                           | Impact                                                                                             |
| --- | --------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| B1  | CI (knip)       | `hermes-parser` + `isomorphic-dompurify` unused | Blocks ALL downstream CI: tests, type check, coverage, build                                       |
| B2  | Pre-push CC     | 13 functions in run-alerts.js exceed CC=15      | No baseline mechanism for cyclomatic CC                                                            |
| B3  | Pre-push CogCC  | 6 regressions beyond baseline                   | checkHookCompleteness CC=90 (baseline 67), regenerateHookWarnings CC=50 (baseline 24), 4 new files |
| B4  | Pre-commit test | intake-audit.js source_pr assertion             | Test bug: matches `!= null` but source uses `=== null`                                             |

### Tier 2: CI WORKFLOW FAILURES (non-code, repo config)

| #   | Surface                  | Issue                        | Root Cause                                            |
| --- | ------------------------ | ---------------------------- | ----------------------------------------------------- |
| W1  | Release Please           | Can't create PRs             | Repo permissions: GITHUB_TOKEN read-only              |
| W2  | Auto-merge Dependabot    | Can't auto-merge             | `allow_auto_merge` disabled on repo                   |
| W3  | Sync README Status       | Can't create PR + auto-merge | Same as W1 + W2                                       |
| W4  | Pattern Compliance Audit | Can't create issues          | GITHUB_TOKEN can't create issues in scheduled context |

### Tier 3: NON-BLOCKING WARNINGS (noisy, cause overrides)

| #   | Surface                   | Issue                                       | Count                                                                   |
| --- | ------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| N1  | Pre-commit cross-doc-deps | False positives on internal changes         | 14 overrides                                                            |
| N2  | Pre-commit doc-headers    | Fires on internal docs                      | 5 overrides                                                             |
| N3  | Pre-push patterns         | 2 medium warnings in .husky/pre-commit      | trap cleanup + xargs -r                                                 |
| N4  | CI oxlint                 | Annotation warnings in .claude/hooks/       | 11 warnings                                                             |
| N5  | ESLint security           | Security plugin in test files               | 1541 warnings                                                           |
| N6  | Prettier                  | Never bulk-formatted                        | ~~1577 files~~ FIXED Wave 6 (1496 formatted)                            |
| N7  | docs:check                | CODE_OF_CONDUCT.md errors + 100 warnings    | 1 error file                                                            |
| N8  | docs:accuracy             | Stale versions + broken paths in audit docs | ~~6 S1 + 100+ S2~~ FIXED Wave 6 (666→0)                                 |
| N9  | docs:lint                 | Markdownlint errors                         | ~~\~50 errors~~ FIXED Wave 6 (hang fixed + .markdownlintignore)         |
| N10 | reviews:check-archive     | Missing JSONL records                       | 92 missing IDs                                                          |
| N11 | reviews:validate          | Disposition integrity violations            | ~~8 violations + 3 mismatches~~ PARTIAL Wave 6 (PR #448 mismatch fixed) |
| N12 | Orphaned test files       | Stale compiled .js in dist-tests/           | 12 orphans                                                              |
| N13 | ESM warnings              | MODULE_TYPELESS_PACKAGE_JSON                | 8 scripts                                                               |
| N14 | Pattern full scan         | Historical code never passed                | 73 blocking + 408 warnings                                              |

### Tier 4: COSMETIC (informational, low noise)

docs:index orphans (357), docs:placement (3), docs:external-links (40 mostly
FP), roadmap:hygiene (8), patterns:sync (5), audit:health (3 stale baselines),
.env mismatch (11 vars), hooks:health (1 orphaned session), triggers (7 modified
skills)

## Verify Commands

```bash
# B1: npm run deps:unused
# B2: npx eslint .claude/skills/alerts/scripts/run-alerts.js --rule 'complexity: [error, 15]'
# B3: node scripts/check-cc.js
# B4: npm test 2>&1 | grep "not ok"
# W1-W4: gh run list --limit 10
# N1-N14: individual npm run commands listed per finding
```
