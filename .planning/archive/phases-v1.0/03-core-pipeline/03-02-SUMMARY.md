<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

phase: 03-core-pipeline plan: 02 subsystem: pipeline tags: [jsonl, zod, cli,
retro, deferred-items, invocation, typescript]

# Dependency graph

requires:

- phase: 01-storage-foundation provides: Zod schemas (RetroRecord,
  DeferredItemRecord, InvocationRecord), appendRecord, findProjectRoot provides:
- write-retro-record.ts CLI + library for writing RetroRecords to retros.jsonl
- write-deferred-items.ts CLI + library for auto-creating DeferredItemRecords
- write-invocation.ts CLI + library for tracking skill/agent invocations
  affects: [04-enforcement, 05-skill-integration, 06-dashboard]

# Tech tracking

tech-stack: added: [] patterns: - "CLI + library dual export pattern
(require.main === module guard)" - "Auto-ID generation (retro-pr-{N},
{reviewId}-deferred-{N}, inv-{timestamp})" - "Temp directory test isolation with
beforeEach/afterEach cleanup"

key-files: created: - scripts/reviews/write-retro-record.ts -
scripts/reviews/write-deferred-items.ts - scripts/reviews/write-invocation.ts -
scripts/reviews/**tests**/write-retro-record.test.ts -
scripts/reviews/**tests**/write-deferred-items.test.ts -
scripts/reviews/**tests**/write-invocation.test.ts modified: -
scripts/promote-patterns.js

key-decisions:

- "Deferred item IDs use {reviewId}-deferred-{N} pattern for parent
  traceability"
- "Invocation auto-ID uses inv-{Date.now()} for uniqueness without external
  deps"
- "All writers use appendRecord() from write-jsonl.ts for consistent
  locking/validation"

patterns-established:

- "Writer pattern: exported library function + CLI entry with require.main
  guard"
- "Auto-ID pattern: derive from context (PR number, review ID, timestamp)"
- "Test pattern: temp dir isolation, require from dist, Node.js built-in test
  runner"

# Metrics

duration: 9min completed: 2026-02-28

---

# Phase 3 Plan 2: Writer CLIs Summary

**Retro writer, auto-deferred item creator, and invocation tracker CLIs with Zod
validation and 23 tests**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-28T23:06:55Z
- **Completed:** 2026-02-28T23:15:29Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- write-retro-record.ts writes Zod-validated RetroRecords with auto-ID
  (retro-pr-{N})
- write-deferred-items.ts auto-creates DeferredItemRecords with parent-derived
  IDs
- write-invocation.ts tracks skill/agent/team invocations with auto-ID and
  auto-date
- All three create target JSONL files on first use (mkdir + append)
- 23 tests across 3 test files covering validation, auto-ID, append, rejection

## Task Commits

Each task was committed atomically:

1. **Task 1: Create write-retro-record.ts and write-deferred-items.ts with
   tests** - `91f0b9fc` (feat)
2. **Task 2: Create write-invocation.ts with tests** - `66556574` (feat)

## Files Created/Modified

- `scripts/reviews/write-retro-record.ts` - CLI + library for RetroRecords to
  retros.jsonl
- `scripts/reviews/write-deferred-items.ts` - CLI + library for auto-creating
  deferred items from review findings
- `scripts/reviews/write-invocation.ts` - CLI + library for tracking skill/agent
  invocations
- `scripts/reviews/__tests__/write-retro-record.test.ts` - 6 tests for retro
  writer
- `scripts/reviews/__tests__/write-deferred-items.test.ts` - 8 tests for
  deferred items creator
- `scripts/reviews/__tests__/write-invocation.test.ts` - 9 tests for invocation
  tracker
- `scripts/promote-patterns.js` - Fixed pre-existing ESLint \_\_dirname error
  (Rule 3)

## Decisions Made

- Deferred item IDs use `{reviewId}-deferred-{N}` pattern for traceability back
  to parent review
- Invocation auto-ID uses `inv-{Date.now()}` for uniqueness without external
  dependencies
- All writers delegate to `appendRecord()` for consistent locking, symlink
  guards, and validation
- CLI entry uses `require.main === module` guard for dual library/CLI usage

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing ESLint error in
promote-patterns.js**

- **Found during:** Task 1 (commit blocked by pre-commit hook)
- **Issue:** `scripts/promote-patterns.js` had `__dirname` flagged as `no-undef`
  because ESLint treats it as ESM (sourceType: module), but it's a CommonJS file
  where `__dirname` is valid
- **Fix:** Added `/* eslint-disable no-undef */` block around the require call
- **Files modified:** scripts/promote-patterns.js
- **Verification:** `npx eslint scripts/promote-patterns.js` shows 0 errors
- **Committed in:** 91f0b9fc (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking) **Impact on plan:** Pre-existing
lint error blocked all commits. Fix was minimal (eslint-disable comment). No
scope creep.

## Issues Encountered

None beyond the pre-existing ESLint error documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three write-side CLIs complete: retro writer, deferred item creator,
  invocation tracker
- Ready for Phase 3 Plan 3+ (if any) or Phase 4 enforcement pipeline
- Skill integration (Phase 5) can now call these writers programmatically via
  exported functions

---

_Phase: 03-core-pipeline_ _Completed: 2026-02-28_
