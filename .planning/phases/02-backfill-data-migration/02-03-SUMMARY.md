<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

phase: 02-backfill-data-migration plan: 03 subsystem: database tags: [dedup,
jsonl, content-hash, data-quality, idempotent]

# Dependency graph

requires:

- phase: 01-storage-foundation provides: "TypeScript compilation setup,
  tsconfig.json, test infrastructure" provides:
- "dedup-debt.ts script for content_hash-based deduplication of review-sourced
  MASTER_DEBT.jsonl entries"
- "dedupReviewSourced() pure function for testable dedup logic"
- "Clean MASTER_DEBT.jsonl with 16 duplicate entries removed (4 hash groups)"
- "raw/deduped.jsonl synced per MEMORY.md critical rule" affects: [03-pipeline,
  05-enforcement, generate-views]

# Tech tracking

tech-stack: added: [] patterns: - "content_hash dedup with lowest DEBT-NNNN ID
retention" - "title+source near-duplicate flagging (report-only, no
auto-removal)" - "atomic file write via temp + rename for JSONL files" -
"MASTER_DEBT.jsonl + raw/deduped.jsonl sync pattern"

key-files: created: - scripts/reviews/dedup-debt.ts -
scripts/reviews/**tests**/dedup-debt.test.ts modified: -
docs/technical-debt/MASTER_DEBT.jsonl - docs/technical-debt/raw/deduped.jsonl -
scripts/reviews/tsconfig.json - tsconfig.test.json

key-decisions:

- "Review sources include: review, pr-review, pr-review-366-r2, pr-deferred"
- "Title+source near-duplicates flagged but never auto-removed (too risky)"
- "Output sorted by DEBT-NNNN numeric ID for consistent ordering"

patterns-established:

- "dedupReviewSourced(items): pure dedup function returning {kept, removed,
  flagged}"
- "findProjectRoot(\_\_dirname): walk-up resolution reused from Phase 1 pattern"

# Metrics

duration: 4min completed: 2026-02-28

---

# Phase 2 Plan 3: Deduplicate MASTER_DEBT.jsonl Summary

**Content-hash dedup removing 16 duplicate review-sourced entries across 4 hash
groups, with title-based near-duplicate detection and raw/deduped.jsonl sync**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-28T21:59:03Z
- **Completed:** 2026-02-28T22:03:00Z
- **Tasks:** 1
- **Files modified:** 7

## Accomplishments

- Deduplicated MASTER_DEBT.jsonl from 8361 to 8345 entries (16 duplicates across
  4 content_hash groups)
- Created reusable dedup-debt.ts script with pure function for testable dedup
  logic
- 8 unit tests covering basic dedup, non-review preservation, no-hash handling,
  idempotency, ordering, title-based flagging, multi-source types, and
  multi-group resolution
- MASTER_DEBT.jsonl and raw/deduped.jsonl confirmed identical (sync rule
  satisfied)
- Script confirmed idempotent (second run reports 0 duplicates)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create dedup-debt.ts script and tests** - `e71b0b10` (feat)

_Note: This task's changes were committed in a prior session alongside 02-01
test work. All verification criteria confirmed met._

## Files Created/Modified

- `scripts/reviews/dedup-debt.ts` - Content-hash dedup script with
  dedupReviewSourced() pure function, findProjectRoot(), atomic file write, and
  MEMORY.md sync
- `scripts/reviews/__tests__/dedup-debt.test.ts` - 8 unit tests for dedup logic
- `scripts/reviews/__tests__/parse-review.test.ts` - Fixed pre-existing type
  errors (cast unknown types from Zod parse)
- `docs/technical-debt/MASTER_DEBT.jsonl` - Deduplicated from 8361 to 8345
  entries
- `docs/technical-debt/raw/deduped.jsonl` - Synced copy of MASTER_DEBT.jsonl
- `scripts/reviews/tsconfig.json` - Added dedup-debt.ts to include
- `tsconfig.test.json` - Added scripts/reviews/**tests** to include, overrode
  inherited exclude

## Decisions Made

- **Review source set:** Defined REVIEW_SOURCES as `review`, `pr-review`,
  `pr-review-366-r2`, `pr-deferred` based on analysis of actual source values in
  MASTER_DEBT.jsonl (654 review + 16 pr-review + 6 pr-review-366-r2 + 20
  pr-deferred entries)
- **Title-based detection is report-only:** Near-duplicates with same
  title+source but different content_hash are flagged (662 entries in 331
  groups) but never auto-removed to avoid false positive data loss
- **Consistent ID ordering:** Output always sorted by DEBT-NNNN numeric ID
  regardless of input order

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing type errors in
parse-review.test.ts**

- **Found during:** Task 1 (test compilation)
- **Issue:** `ReviewRecord.parse()` return typed as `unknown`, causing TS18046
  errors on property access at lines 517, 541, 542
- **Fix:** Added `as Record<string, unknown>` casts at parse result and
  `record.origin` access points
- **Files modified:** scripts/reviews/**tests**/parse-review.test.ts
- **Verification:** `npx tsc -p tsconfig.test.json` compiles cleanly
- **Committed in:** e71b0b10

**2. [Rule 3 - Blocking] Added exclude override to tsconfig.test.json**

- **Found during:** Task 1 (test compilation)
- **Issue:** Root tsconfig.json excludes `scripts/`, inherited by
  tsconfig.test.json. Despite adding `scripts/reviews/__tests__/**/*.ts` to
  include, the exclude took precedence and test files were not compiled
- **Fix:** Added explicit `"exclude": ["node_modules", "dist", "dist-tests"]` to
  tsconfig.test.json to override the inherited scripts exclusion
- **Files modified:** tsconfig.test.json
- **Verification:** Test files now compile to
  dist-tests/scripts/reviews/**tests**/
- **Committed in:** e71b0b10

---

**Total deviations:** 2 auto-fixed (2 blocking) **Impact on plan:** Both fixes
necessary for compilation. No scope creep.

## Issues Encountered

- The 4 duplicate content_hash groups each had 5 entries (not individual pairs),
  resulting in 16 removals (4 kept + 16 removed = 20 total duplicate entries).
  The plan's mention of "16 known duplicate content_hashes" was actually 4 hash
  groups with 16 extra copies.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- MASTER_DEBT.jsonl is clean and deduplicated, ready for Phase 3 pipeline work
- raw/deduped.jsonl is synced, so generate-views.js will not overwrite dedup
  work
- 662 title-based near-duplicates flagged for potential manual review (not
  blocking)

---

_Phase: 02-backfill-data-migration_ _Completed: 2026-02-28_
