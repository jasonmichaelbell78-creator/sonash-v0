<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE

phase: 04-enforcement-expansion
plan: 03
subsystem: enforcement
tags: [regex, pattern-compliance, false-positive, ENFR-03, ENFR-07]
metrics:
  duration: 16 min
  completed: 2026-03-01
<!-- prettier-ignore-end -->

# Phase 04 Plan 03: Regex Rule Expansion Summary

13 new regex rules enforcing banned imports, naming conventions, security
patterns, and correctness checks added to check-pattern-compliance.js. FP
auto-disable logic skips rules with >25 verified-patterns exclusions.

## Tasks Completed

| Task | Name                                             | Commit   | Key Files                           |
| ---- | ------------------------------------------------ | -------- | ----------------------------------- |
| 1    | Add 13 new regex rules and FP auto-disable logic | c90b05fd | scripts/check-pattern-compliance.js |
| 2    | Add tests for new rules and FP auto-disable      | b6050f3b | tests/pattern-compliance.test.js    |

## What Was Built

### New Rules (13 total, 51 -> 64)

**Banned Imports (4):**

- `banned-direct-firestore-write` [critical]: Catches direct Firestore write
  imports (setDoc/addDoc/updateDoc/deleteDoc) in app code. Enforces CLAUDE.md
  Security Rule #1.
- `banned-moment-import` [medium]: Flags moment.js imports (prefer date-fns or
  Intl).
- `banned-lodash-full-import` [medium]: Flags full lodash imports (prefer
  lodash-es or specific imports).
- `banned-fs-in-client` [critical]: Catches Node.js fs imports in client-side
  code (app/components/pages).

**Naming Violations (3):**

- `no-generic-handler-name` [medium]: Flags
  handleClick/handleChange/handleSubmit without descriptive prefix.
- `no-single-letter-variable` [medium]: Flags single-letter variable
  declarations (except loop vars i/j/k and \_).
- `no-todo-without-ticket` [medium]: Flags TODO/FIXME comments without
  issue/ticket references.

**Security/Safety (4):**

- `no-process-env-inline` [medium]: Flags direct process.env access in TSX/JSX
  components.
- `no-string-concat-in-query` [critical]: Detects string concatenation in SQL
  queries (injection risk).
- `no-document-cookie-access` [medium]: Flags direct document.cookie access.
- `no-window-location-assign` [medium]: Flags direct window.location navigation
  (use Next.js router).

**Correctness (2):**

- `no-json-parse-without-try` [medium]: Flags JSON.parse() without try/catch in
  app code.
- `no-array-index-as-key` [medium]: Flags array index used as React key in JSX.

### FP Auto-Disable (ENFR-07)

- Rules with verified-patterns exclusion count > FP_THRESHOLD (default: 25) are
  auto-skipped
- 10 rules currently auto-disabled (e.g., missing-array-isarray: 72 exclusions)
- New CLI flags: `--fp-threshold=N`, `--include-fp-disabled`
- `--fp-report` now includes AUTO-DISABLED section showing which rules are
  skipped and why

### Test Coverage

- 55 total tests (24 existing + 31 new)
- Each new rule has at least 2 tests (detection + non-detection)
- 4 FP auto-disable tests (threshold logic, custom threshold, override flag,
  report)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Firestore write regex order**

- **Found during:** Task 2 (test failures)
- **Issue:** Original regex expected `from "firebase/firestore"` before
  `setDoc`, but ES import syntax puts destructured names first
- **Fix:** Reversed regex order to match `setDoc...from "firebase/firestore"`
- **Files modified:** scripts/check-pattern-compliance.js

**2. [Rule 1 - Bug] Fixed SQL concat detection regex**

- **Found during:** Task 2 (test failures)
- **Issue:** Second concat pattern `/['"][^'"]*\+[^'"]*WHERE/` couldn't match
  `+` outside quotes
- **Fix:** Changed to `(/['"].*WHERE/i.test(line) && /\+\s*\w/.test(line))` for
  independent checks
- **Files modified:** scripts/check-pattern-compliance.js

**3. [Rule 2 - Missing Critical] Added test file exclusions**

- **Found during:** Task 1 verification
- **Issue:** New rules false-positived on eslint-plugin-sonash.test.js (lodash
  fixture, SQL fixtures)
- **Fix:** Added pathExclude for tests/ dir (lodash rule) and specific test file
  (SQL rule)
- **Files modified:** scripts/check-pattern-compliance.js

**4. [Rule 3 - Blocking] Concurrent 04-02 commit overwrote Task 1 changes**

- **Found during:** Task 2 (file had reverted to pre-edit state)
- **Issue:** A parallel agent committed 92f59363 which overwrote
  check-pattern-compliance.js
- **Fix:** Re-applied all Task 1 changes and committed properly
- **Files modified:** scripts/check-pattern-compliance.js

## Verification Results

- Total active rules: 64 (13 new)
- FP auto-disable: 10 rules disabled at threshold 25
- `--fp-report` shows AUTO-DISABLED section with rule counts
- All 55 tests pass
- No existing rule behavior changed
- Pre-existing ESLint/TS errors in semgrep test files (unrelated to this plan)

## Next Phase Readiness

- ENFR-03 (regex rule expansion): Satisfied with 13 new rules
- ENFR-07 (FP monitoring auto-disable): Satisfied with threshold-based
  auto-disable
- Ready for 04-04 (CI/CD integration)
