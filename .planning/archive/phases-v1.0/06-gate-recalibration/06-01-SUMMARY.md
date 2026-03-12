<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

phase: 06-gate-recalibration plan: 01 subsystem: infra tags: [cross-doc-deps,
pre-commit, auto-fix, diffPattern, gate-recalibration]

# Dependency graph

requires:

- phase: 04-enforcement-expansion provides: "Pattern compliance and enforcement
  infrastructure" provides:
- "Recalibrated cross-doc dependency rules with diffPattern filters on 4 rules"
- "Auto-fix mode for trivial cross-doc violations (--auto-fix flag)"
- "15 tests covering auto-fix, trigger matching, and diffPattern filtering"
  affects: [06-gate-recalibration]

# Tech tracking

tech-stack: added: [] patterns: - "diffPattern filtering: JSON regex descriptors
converted to RegExp at load time" - "Auto-fix with sync comment injection for
trivial doc dependency violations" - "module.exports + require.main guard for
testable CLI scripts"

key-files: created: - "tests/cross-doc-deps.test.js" modified: -
"scripts/config/doc-dependencies.json" - "scripts/check-cross-doc-deps.js"

key-decisions:

- "Auto-fix only handles sync comment injection; ROADMAP.md and
  COMMAND_REFERENCE.md require manual fixes"
- "diffPattern added to 3 new rules (ROADMAP, hooks, tech-debt) -- total 4 with
  existing package.json rule"
- "gitFilter AD added to functions/src/admin rule to stop triggering on
  modifications"

patterns-established:

- "attemptAutoFix pattern: try fix, return { fixed, file, action } for caller to
  decide"

# Metrics

duration: 20min completed: 2026-03-01

---

# Phase 6 Plan 1: Cross-Doc Dependency Recalibration Summary

**diffPattern filters on 4 highest-override rules plus --auto-fix mode for
trivial sync comment violations**

## Performance

- **Duration:** 20 min
- **Started:** 2026-03-01T20:30:42Z
- **Completed:** 2026-03-01T20:50:44Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Recalibrated 4 rules in doc-dependencies.json with diffPattern and gitFilter
  to reduce false triggers
- Added --auto-fix flag to check-cross-doc-deps.js that handles trivial sync
  comment violations
- Created 15 tests covering auto-fix logic, trigger matching, dependent
  detection, and diffPattern filtering
- Exported key functions (attemptAutoFix, matchesTrigger, isDependentStaged,
  checkDiffPattern) for testability

## Task Commits

Each task was committed atomically:

1. **Task 1: Recalibrate doc-dependencies.json rules** - `939404fa` (feat) --
   Note: config changes auto-staged into `ca7e392f` by parallel agent
2. **Task 2: Add --auto-fix mode with tests** - `b8714c6c` (feat) -- Note:
   script + test changes auto-staged into `b8714c6c` by parallel agent

## Files Created/Modified

- `scripts/config/doc-dependencies.json` - Added diffPattern to rules 1, 4, 11;
  gitFilter to rule 8
- `scripts/check-cross-doc-deps.js` - Added attemptAutoFix function, --auto-fix
  flag, module.exports
- `tests/cross-doc-deps.test.js` - 15 tests for auto-fix, matching, and
  diffPattern filtering

## Decisions Made

- Auto-fix limited to sync comment injection only (append/update
  `<!-- Last synced: YYYY-MM-DD -->`)
- ROADMAP.md and COMMAND_REFERENCE.md dependents never auto-fixed (require human
  judgment)
- Used safeWriteFile from security-helpers for file writes (per CLAUDE.md
  security rules)
- Used eslint-disable directive for CJS require in test file (tests/\*_/_.js
  config added by hook)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Parallel agent commits included task files**

- **Found during:** Tasks 1 and 2
- **Issue:** Pre-commit hooks auto-staged task files into parallel agents'
  commits (06-02, 06-03)
- **Fix:** Verified changes are correctly committed despite being in different
  commit hashes
- **Files modified:** All task files
- **Verification:** All verification criteria pass, tests pass

---

**Total deviations:** 1 (parallel execution artifact, not a code issue) **Impact
on plan:** No functional impact -- all changes are committed and verified

## Issues Encountered

- Pre-commit hook failures due to pre-existing ESLint errors from parallel
  agents' work
- Pre-commit hook reverted working tree changes on failure, requiring
  re-application
- Parallel agents auto-staged task files into their commits via pre-commit hooks

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Cross-doc dependency gate now has diffPattern filtering on 4 rules (up from 1)
- Auto-fix mode available for trivial violations via --auto-fix flag
- Ready for 06-02 (override analytics) and remaining phase 6 plans

---

_Phase: 06-gate-recalibration_ _Completed: 2026-03-01_
