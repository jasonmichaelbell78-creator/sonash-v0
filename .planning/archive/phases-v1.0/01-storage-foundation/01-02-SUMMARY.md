<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

phase: 01-storage-foundation plan: 02 subsystem: database tags: [zod,
typescript, jsonl, validation, safe-fs, completeness]

# Dependency graph

requires:

- phase: 01-storage-foundation/01 provides: "Zod schemas for all 5 JSONL file
  types, SCHEMA_MAP, BaseRecord" provides:
- "appendRecord() validated write utility composing on safe-fs.js"
- "readValidatedJsonl() graceful reader with Zod safeParse warnings"
- "hasField() and validateCompleteness() completeness helpers"
- "42 passing tests covering schemas, write, read, and completeness" affects:
  [01-03, 02-validation, 03-migration]

# Tech tracking

tech-stack: added: [] patterns: [ validated-jsonl-write,
graceful-read-with-warnings, completeness-field-check, ]

key-files: created: - scripts/reviews/lib/write-jsonl.ts -
scripts/reviews/lib/read-jsonl.ts - scripts/reviews/lib/completeness.ts -
tests/scripts/ecosystem-v2/schemas.test.ts -
tests/scripts/ecosystem-v2/write-jsonl.test.ts -
tests/scripts/ecosystem-v2/read-jsonl.test.ts -
tests/scripts/ecosystem-v2/completeness.test.ts modified: - eslint.config.mjs

key-decisions:

- "read-jsonl.js exports function directly (not named), adjusted require()
  accordingly"
- "Tests use findProjectRoot() walk-up pattern for reliable path resolution from
  dist-tests"

patterns-established:

- "appendRecord(filePath, record, schema): validate-then-write with advisory
  locking"
- "readValidatedJsonl(filePath, schema, options): never-throw reader returning
  {valid, warnings}"
- "hasField(record, field): completeness_missing-based field presence check"
- "findProjectRoot(\_\_dirname): walk-up resolution for test files in nested
  dist-tests"

# Metrics

duration: 10min completed: 2026-02-28

---

# Phase 1 Plan 2: JSONL Utilities and Tests Summary

**Validated JSONL write/read utilities composing on safe-fs.js and
read-jsonl.js, completeness helpers, and 42 passing tests across 4 test files**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-28T19:45:29Z
- **Completed:** 2026-02-28T19:55:20Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- appendRecord() validates via Zod schema, uses safe-fs.js withLock +
  isSafeToWrite for safe JSONL writes
- readValidatedJsonl() wraps read-jsonl.js with Zod safeParse, returns {valid,
  warnings}, never throws
- hasField() distinguishes null values (valid data) from completeness_missing
  entries (never captured)
- 42 tests pass across 4 files: schemas (18), write-jsonl (5), read-jsonl (5),
  completeness (10), SCHEMA_MAP (4)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create write-jsonl, read-jsonl, and completeness utilities** -
   `1eadf3e5` (feat)
2. **Task 2: Create tests for schemas, write-jsonl, read-jsonl, and
   completeness** - `501a0395` (test)

## Files Created/Modified

- `scripts/reviews/lib/write-jsonl.ts` - appendRecord() with Zod validation +
  safe-fs.js locking
- `scripts/reviews/lib/read-jsonl.ts` - readValidatedJsonl() with graceful
  safeParse + warnings
- `scripts/reviews/lib/completeness.ts` - hasField() and validateCompleteness()
  helpers
- `tests/scripts/ecosystem-v2/schemas.test.ts` - 18 tests for all 5 entity
  schemas + SCHEMA_MAP
- `tests/scripts/ecosystem-v2/write-jsonl.test.ts` - 5 tests for validated
  append utility
- `tests/scripts/ecosystem-v2/read-jsonl.test.ts` - 5 tests for graceful reader
- `tests/scripts/ecosystem-v2/completeness.test.ts` - 10 tests for completeness
  helpers
- `eslint.config.mjs` - Added scripts/reviews/dist/\*\* to ignores

## Decisions Made

- Used `const readJsonl = require(...)` instead of destructured import because
  read-jsonl.js exports the function directly via `module.exports = readJsonl`
- Adopted `findProjectRoot(__dirname)` walk-up pattern in tests for reliable
  resolution from both source and dist-tests directories (the existing
  2-level-up pattern doesn't work for the deeper `ecosystem-v2/` nesting)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed read-jsonl.js require pattern**

- **Found during:** Task 1 (write utility creation)
- **Issue:** Plan specified `const { readJsonl } = require(...)` but
  read-jsonl.js uses `module.exports = readJsonl` (direct export, not named)
- **Fix:** Used `const readJsonl = require(...)` instead of destructured import
- **Files modified:** scripts/reviews/lib/read-jsonl.ts
- **Verification:** TypeScript compiles, tests pass
- **Committed in:** 1eadf3e5 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed PROJECT_ROOT resolution for nested test
directory**

- **Found during:** Task 2 (test creation)
- **Issue:** Existing 2-level-up PROJECT_ROOT pattern doesn't work from
  `dist-tests/tests/scripts/ecosystem-v2/` (4 levels deep)
- **Fix:** Replaced with `findProjectRoot()` that walks up until it finds
  package.json
- **Files modified:** All 4 test files
- **Verification:** All tests pass from dist-tests
- **Committed in:** 501a0395 (Task 2 commit)

**3. [Rule 3 - Blocking] Fixed compiled output path in test requires**

- **Found during:** Task 2 (test execution)
- **Issue:** Tests referenced `scripts/reviews/dist/lib/` but tsc outputs to
  `scripts/reviews/dist/` without the `lib/` prefix (since `lib/` is the include
  root)
- **Fix:** Removed `/lib` from all require paths in test files
- **Files modified:** All 4 test files
- **Verification:** All tests pass
- **Committed in:** 501a0395 (Task 2 commit)

**4. [Rule 3 - Blocking] Added scripts/reviews/dist/** to ESLint ignores\*\*

- **Found during:** Task 2 (commit attempt)
- **Issue:** ESLint was scanning compiled JS in scripts/reviews/dist/, finding
  `__dirname` errors in CommonJS output
- **Fix:** Added `"scripts/reviews/dist/**"` to eslint.config.mjs ignores array
- **Files modified:** eslint.config.mjs
- **Verification:** `npm run lint` exits 0
- **Committed in:** 501a0395 (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking) **Impact on plan:** All
fixes necessary for correct operation and test execution. No scope creep.

## Issues Encountered

None beyond the deviations documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 3 utility modules ready for Plan 01-03 (migration, file operations)
- 42 tests provide regression safety for schema and utility changes
- Tests establish ecosystem-v2 test directory and patterns for future test files
- ESLint properly configured to ignore compiled output

---

_Phase: 01-storage-foundation_ _Completed: 2026-02-28_
