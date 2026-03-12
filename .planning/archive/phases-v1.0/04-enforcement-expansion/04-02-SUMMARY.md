<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Phase 04 Plan 02: ESLint AST Rules Summary

**One-liner:** 7 new ESLint AST rules for React hooks misuse, unsafe patterns,
and component anti-patterns with full RuleTester coverage

## What Was Done

### Task 1: Create 7 New ESLint AST Rules

Created 7 new rules in `eslint-plugin-sonash/rules/` following existing
conventions (`"use strict"`, meta with type/docs/messages, AST visitor pattern,
shared `ast-utils.js` utilities):

| Rule                        | Type       | Detects                                                            |
| --------------------------- | ---------- | ------------------------------------------------------------------ |
| no-effect-missing-cleanup   | problem    | useEffect with setInterval/setTimeout but no cleanup return        |
| no-unsafe-spread            | suggestion | Unknown object spread into JSX props (can override critical props) |
| no-state-update-in-render   | problem    | setState/dispatch in component render body (infinite loop)         |
| no-async-component          | problem    | Async function components (not supported in React client)          |
| no-missing-error-boundary   | suggestion | Suspense without ErrorBoundary wrapper                             |
| no-unbounded-array-in-state | problem    | useState array growth via spread/concat without .slice() limit     |
| no-callback-in-effect-dep   | problem    | Inline function in useEffect dependency array                      |

All 7 rules registered in `eslint-plugin-sonash/index.js` (require, rules
object, recommended config). Plugin version bumped from 3.0.0 to 4.0.0. Total
rules: 32 (25 existing + 7 new).

### Task 2: RuleTester Test Cases

Added test blocks for all 7 new rules to `tests/eslint-plugin-sonash.test.js`:

- Each rule has 2-3 valid cases and 2-3 invalid cases
- Uses existing `ruleTester` (standard) and `jsxRuleTester` (JSX-enabled)
  instances
- Total tests: 43 (all passing)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Semgrep test fixtures causing ESLint errors**

- **Found during:** Task 2 commit attempt
- **Issue:** The 04-01 plan's semgrep test fixture files (`tests/semgrep/`) were
  committed in Task 1 (swept up from prior staging), but `eslint.config.mjs`
  didn't have them in ignores
- **Fix:** Added `tests/semgrep/**` to ESLint ignores in `eslint.config.mjs`
- **Files modified:** eslint.config.mjs
- **Commit:** 92f59363

**2. [Rule 3 - Blocking] Semgrep test fixtures triggering pattern compliance**

- **Found during:** Task 2 commit attempt
- **Issue:** `scripts/check-pattern-compliance.js` flagged intentionally bad
  code in semgrep test fixtures as critical violations
- **Fix:** Added `tests/semgrep/` to GLOBAL_EXCLUDE in pattern compliance script
- **Files modified:** scripts/check-pattern-compliance.js
- **Commit:** 92f59363

## Verification Results

- 32 rule files in `eslint-plugin-sonash/rules/` (25 existing + 7 new)
- All 7 new rules registered in `eslint-plugin-sonash/index.js` (3 references
  each)
- `npx vitest run tests/eslint-plugin-sonash.test.js` passes (43/43 tests)
- Each new rule uses `ast-utils.js` shared utilities (getCalleeName) where
  applicable

## Decisions

- Plugin version bumped to 4.0.0 for Phase 3 rules
- no-unsafe-spread allows 'rest' and 'restProps' identifiers as known-safe
- no-state-update-in-render detects both setX pattern and dispatch calls
- no-async-component uses PascalCase + JSX return detection for component
  identification
- tests/semgrep/ must be excluded from ESLint and pattern compliance (test
  fixtures)

## Key Files

**Created:**

- `eslint-plugin-sonash/rules/no-effect-missing-cleanup.js`
- `eslint-plugin-sonash/rules/no-unsafe-spread.js`
- `eslint-plugin-sonash/rules/no-state-update-in-render.js`
- `eslint-plugin-sonash/rules/no-async-component.js`
- `eslint-plugin-sonash/rules/no-missing-error-boundary.js`
- `eslint-plugin-sonash/rules/no-unbounded-array-in-state.js`
- `eslint-plugin-sonash/rules/no-callback-in-effect-dep.js`

**Modified:**

- `eslint-plugin-sonash/index.js`
- `tests/eslint-plugin-sonash.test.js`
- `eslint.config.mjs`
- `scripts/check-pattern-compliance.js`

## Next Phase Readiness

No blockers. Plans 04-03 and 04-04 can proceed. The 32-rule ESLint plugin
provides comprehensive AST-level enforcement complementing Semgrep's pattern
matching.
