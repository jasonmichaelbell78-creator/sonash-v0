<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

phase: 07-integration-cutover plan: 05 subsystem: testing tags: [performance,
budgets, node-test, tier-coverage, test-alongside]

# Dependency graph

requires:

- phase: 07-03 provides: Gate recalibration and pattern compliance scripts
  provides:
- Performance budget test file (TEST-04)
- 5-tier test coverage verified at 56 files (TEST-03)
- Test-alongside audit results (TEST-05) affects: [07-06]

# Tech tracking

tech-stack: added: [] patterns: [execFileSync timing for perf budgets, CJS test
files with node:test]

key-files: created: - tests/perf/budget.perf.test.js -
tests/integration/health-pipeline.integration.test.js modified: -
eslint.config.mjs

key-decisions:

- "ESLint CJS override added for tests/\*_/_.test.js (pre-existing issue blocked
  all .js test commits)"
- "Health checkers (10 files) documented as known gaps -- exercised indirectly
  via run-health-check integration tests"

patterns-established:

- "Performance budget tests: execFileSync + Date.now() timing + assert elapsed <
  budget"

# Metrics

duration: 7min completed: 2026-03-01

---

# Phase 7 Plan 5: Performance Budgets & Test Tier Audit Summary

**Performance budget tests for 4 key scripts plus 5-tier test coverage verified
at 56 files across unit/contract/integration/e2e/perf tiers**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-01T22:15:25Z
- **Completed:** 2026-03-01T22:22:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Performance budgets enforced via real tests: gate check <3s, health:quick <1s,
  health:full <5s, consolidation <10s
- 5 test tiers each populated with >= 1 file (TEST-03 satisfied)
- Test-alongside audit completed: 13 gaps identified, all either tested
  indirectly or documented as known gaps

## Task Commits

Each task was committed atomically:

1. **Task 1: Create performance budget test** - `3bb8fe51` (feat)
2. **Task 2: Audit test-alongside compliance and document tier coverage** -
   `619c7ba7` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified

- `tests/perf/budget.perf.test.js` - Performance budget assertions for 4 scripts
- `tests/integration/health-pipeline.integration.test.js` - Integration test for
  health pipeline
- `eslint.config.mjs` - Added CJS sourceType override for tests/\*_/_.test.js

## Test Tier Coverage (TEST-03)

| Tier        | Count  | Sample Files                                                                |
| ----------- | ------ | --------------------------------------------------------------------------- |
| Unit        | 45     | tests/auth-provider.test.ts, scripts/reviews/**tests**/parse-review.test.ts |
| Contract    | 7      | tests/scripts/ecosystem-v2/contracts/promotion-input.contract.test.ts       |
| Integration | 2      | tests/integration/health-pipeline.integration.test.js                       |
| E2E         | 1      | tests/e2e/pipeline-smoke.e2e.test.js                                        |
| Performance | 1      | tests/perf/budget.perf.test.js                                              |
| **Total**   | **56** | **(target: >= 39)**                                                         |

## Test-Alongside Gaps (TEST-05)

### Tested Directly

- scripts/reviews/lib/completeness.ts, enforcement-manifest.ts, parse-review.ts,
  read-jsonl.ts, write-jsonl.ts
- scripts/health/run-health-check.js

### Tested Indirectly

- scripts/reviews/lib/promote-patterns.ts (via promotion-pipeline.test.ts)
- scripts/health/checkers/\*.js (10 files, exercised via run-health-check
  integration tests)

### Known Gaps (utility/generator scripts)

- scripts/reviews/lib/generate-claude-antipatterns.ts (code generation, not
  testable in isolation)
- scripts/reviews/lib/generate-fix-template-stubs.ts (code generation, not
  testable in isolation)

## Decisions Made

- ESLint CJS override added for tests/\*_/_.test.js -- pre-existing issue where
  no-require-imports and no-undef blocked all CJS test file commits (also fixed
  e2e tests)
- Health checkers documented as known gaps rather than creating stub tests --
  they are integration-tested through run-health-check.js which exercises all 10
  checkers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint CJS configuration for test JS files**

- **Found during:** Task 1 (performance budget test creation)
- **Issue:** eslint.config.mjs treated tests/\*_/_.test.js as ESM, causing
  no-require-imports and no-undef errors on require() and \_\_dirname
- **Fix:** Added CJS sourceType override with Node.js globals for
  tests/\*_/_.test.js
- **Files modified:** eslint.config.mjs
- **Verification:** ESLint passes on all test .js files (budget.perf.test.js,
  pipeline-smoke.e2e.test.js)
- **Committed in:** 3bb8fe51 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Integration test for missing tier**

- **Found during:** Task 2 (tier audit)
- **Issue:** Integration tier had no test files initially (07-04 not yet
  executed)
- **Fix:** Created health-pipeline.integration.test.js with 3 integration
  assertions
- **Files modified:** tests/integration/health-pipeline.integration.test.js
- **Verification:** All 3 integration tests pass
- **Committed in:** 619c7ba7 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical) **Impact on
plan:** Both auto-fixes necessary for correctness. ESLint fix resolved
pre-existing issue affecting multiple test files.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All TEST-03, TEST-04, TEST-05 requirements satisfied
- Performance budgets will catch regression in CI or pre-commit
- Ready for 07-06 (final cutover)

---

_Phase: 07-integration-cutover_ _Completed: 2026-03-01_
