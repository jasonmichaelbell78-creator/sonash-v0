<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

phase: 01-storage-foundation plan: 01 subsystem: database tags: [zod,
typescript, jsonl, schemas, validation]

# Dependency graph

requires: [] provides:

- "Zod schemas for all 5 JSONL file types (reviews, retros, deferred-items,
  invocations, warnings)"
- "BaseRecord with three-tier completeness model and structured Origin"
- "SCHEMA_MAP for dynamic schema lookup by file name"
- "TypeScript compilation config for scripts/reviews/" affects: [01-02, 01-03,
  02-validation, 03-migration]

# Tech tracking

tech-stack: added: [zod] patterns: [BaseRecord.extend, three-tier-completeness,
structured-origin]

key-files: created: - scripts/reviews/lib/schemas/shared.ts -
scripts/reviews/lib/schemas/review.ts - scripts/reviews/lib/schemas/retro.ts -
scripts/reviews/lib/schemas/deferred-item.ts -
scripts/reviews/lib/schemas/invocation.ts -
scripts/reviews/lib/schemas/warning.ts - scripts/reviews/lib/schemas/index.ts -
scripts/reviews/tsconfig.json modified: - tsconfig.test.json

key-decisions:

- "Override exclude in scripts/reviews/tsconfig.json to prevent inherited
  exclusion from root"

patterns-established:

- "BaseRecord.extend() pattern: all entity schemas extend shared base with
  completeness + origin"
- "Barrel export via index.ts with SCHEMA_MAP for dynamic lookup"
- "Three-tier completeness model: full/partial/stub with completeness_missing
  array"
- "Structured Origin object (never a plain string) with type, pr, round,
  session, tool"

# Metrics

duration: 3min completed: 2026-02-28

---

# Phase 1 Plan 1: Zod Schema Foundation Summary

**Zod schemas for 5 JSONL record types with shared BaseRecord, three-tier
completeness model, structured Origin, and SCHEMA_MAP barrel export**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-28T19:38:40Z
- **Completed:** 2026-02-28T19:41:39Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Defined BaseRecord with CompletenessTier (full/partial/stub),
  completeness_missing array, and structured Origin object
- Created 5 entity schemas (ReviewRecord, RetroRecord, DeferredItemRecord,
  InvocationRecord, WarningRecord) each extending BaseRecord
- Barrel export with SCHEMA_MAP enables dynamic schema lookup by JSONL file name
- TypeScript compilation configured for scripts/reviews/ with clean noEmit
  verification

## Task Commits

Each task was committed atomically:

1. **Task 1: Create directory structure, tsconfig, and shared schema** -
   `cbd5fb47` (feat)
2. **Task 2: Create all 5 entity schemas with barrel export** - `b9b16cf9`
   (feat)

## Files Created/Modified

- `scripts/reviews/lib/schemas/shared.ts` - BaseRecord, Origin, CompletenessTier
  schemas and types
- `scripts/reviews/lib/schemas/review.ts` - ReviewRecord with severity
  breakdown, patterns, per-round detail
- `scripts/reviews/lib/schemas/retro.ts` - RetroRecord with wins, misses,
  process changes, metrics
- `scripts/reviews/lib/schemas/deferred-item.ts` - DeferredItemRecord with
  status lifecycle, defer count, promotion
- `scripts/reviews/lib/schemas/invocation.ts` - InvocationRecord with
  skill/agent/team type, duration, success
- `scripts/reviews/lib/schemas/warning.ts` - WarningRecord with lifecycle
  states, severity levels
- `scripts/reviews/lib/schemas/index.ts` - Barrel re-export and SCHEMA_MAP
  constant
- `scripts/reviews/tsconfig.json` - TypeScript config extending root with
  commonjs output
- `tsconfig.test.json` - Added scripts/reviews/lib path to include array

## Decisions Made

- Added explicit `exclude: ["node_modules", "dist"]` to
  scripts/reviews/tsconfig.json because the root tsconfig.json has
  `"exclude": ["scripts"]` which was inherited and prevented compilation of the
  schemas directory

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed inherited exclude preventing compilation**

- **Found during:** Task 1 (tsconfig setup)
- **Issue:** Root tsconfig.json excludes `scripts` directory; child tsconfig
  inherited this exclusion, causing TS18003 "no inputs found"
- **Fix:** Added explicit `"exclude": ["node_modules", "dist"]` to
  scripts/reviews/tsconfig.json to override inherited exclusion
- **Files modified:** scripts/reviews/tsconfig.json
- **Verification:** `npx tsc -p scripts/reviews/tsconfig.json --noEmit` exits 0
- **Committed in:** cbd5fb47 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking) **Impact on plan:** Necessary
fix for TypeScript compilation to work. No scope creep.

## Issues Encountered

None beyond the tsconfig exclusion inheritance issue documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 5 schemas ready for use by subsequent plans (01-02 JSONL read/write, 01-03
  migration)
- SCHEMA_MAP enables generic validation in read/write utilities
- BaseRecord.extend() pattern established for any future entity types

---

_Phase: 01-storage-foundation_ _Completed: 2026-02-28_
