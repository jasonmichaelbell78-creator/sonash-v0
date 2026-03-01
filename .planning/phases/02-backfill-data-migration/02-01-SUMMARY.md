<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

phase: 02-backfill-data-migration plan: 01 subsystem: database tags:
[markdown-parser, zod, typescript, jsonl, review-records]

# Dependency graph

requires:

- phase: 01-storage-foundation provides: "Zod schemas (ReviewRecord, BaseRecord,
  CompletenessTier), write-jsonl, read-jsonl" provides:
- "parseArchiveFile: heading-based markdown parser for review archives"
- "parseTableArchive: table-format parser for REVIEWS_101-136.md"
- "toV2ReviewRecord: ParsedEntry to Zod-validated ReviewRecord converter"
- "KNOWN_SKIPPED_IDS: 64 known-skipped review IDs"
- "KNOWN_DUPLICATE_IDS: 4 known-duplicate review IDs (366-369)"
- "Field extractors: extractPR, extractTotal, extractCount, extractPatterns,
  extractLearnings, extractSeverity" affects:
- "02-backfill-data-migration (plans 02-05: backfill orchestrator, migration,
  dedup)"
- "03-enforcement-engine (pattern data)"

# Tech tracking

tech-stack: added: [] patterns: - "String-based severity parsing (no regex) via
parseSeverityCount adapted from sync-reviews-to-jsonl.js" - "Two-phase parser:
header detection pass + content extraction pass" - "Within-file dedup by keeping
entry with most rawLines content"

key-files: created: - scripts/reviews/lib/parse-review.ts -
scripts/reviews/**tests**/parse-review.test.ts modified: []

key-decisions:

- "Em-dash variant handled by single regex:
  /^#{2,4}\\s+Review\\s+#(\\d+)(?::|\\s+--)\\s*(.*)/"
- "Completeness tiers: full (title+pr+total+resolution), partial (title+total or
  pr), stub (id/date only)"
- "Field extractors exported individually for reuse by downstream scripts"
- "parseSeverityCount uses string-based parsing (no regex) to avoid backtracking
  issues, adapted from sync-reviews-to-jsonl.js"

patterns-established:

- "ParsedEntry interface: intermediate representation between raw markdown and
  v2 schema record"
- "toV2ReviewRecord: single conversion point with Zod validation at output
  boundary"
- "Test pattern: inline markdown fixtures with require() of compiled dist
  output"

# Metrics

duration: 6min completed: 2026-02-28

---

# Phase 2 Plan 01: Archive Parser Summary

**Markdown-to-v2-record parser with heading/table modes, 6 field extractors,
completeness-tiered output, and 46 passing tests**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-28T21:58:02Z
- **Completed:** 2026-02-28T22:04:03Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- parse-review.ts module with heading parser, table parser, 6 field extractors,
  and v2 record builder
- 46 tests covering all parser functions, completeness tier assignment, and Zod
  schema validation
- KNOWN_SKIPPED_IDS (64) and KNOWN_DUPLICATE_IDS (366-369) constants ported from
  check-review-archive.js
- toV2ReviewRecord validates every output against ReviewRecord.parse() for
  immediate schema violation detection

## Task Commits

Each task was committed atomically:

1. **Task 1: Create parse-review.ts with heading parser, table parser, and field
   extractors** - `7bad7d7d` (feat)
2. **Task 2: Create parse-review tests using real archive format samples** -
   `e71b0b10` (test)

## Files Created/Modified

- `scripts/reviews/lib/parse-review.ts` - Core parser module: heading parser,
  table parser, 6 field extractors, v2 record builder with Zod validation
- `scripts/reviews/__tests__/parse-review.test.ts` - 46 tests across 11 describe
  blocks covering all parser functions

## Decisions Made

- **Em-dash header variant:** Handled with single regex alternation
  `(?::|\\s+--)` instead of separate pass
- **Completeness tier rules:** full requires title+pr+total+resolution; partial
  requires title + at least total or pr; stub is everything else
- **Field extractors exported individually:** Allows downstream scripts
  (backfill orchestrator) to use extractors independently
- **String-based severity parsing:** Adapted parseSeverityCount from
  sync-reviews-to-jsonl.js to avoid regex backtracking issues (S5852 compliance)
- **Code fence tracking:** Lines inside ``` blocks are skipped for header
  matching but still appended to current entry's rawLines

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pre-commit hook staged extra files in Task 2 commit**

- **Found during:** Task 2 (test commit)
- **Issue:** A pre-commit hook ran a debt audit and staged additional files
  (dedup-debt.ts, dedup-debt.test.ts, MASTER_DEBT.jsonl changes, tsconfig
  changes) alongside the test file
- **Fix:** Extra files are from automated tooling and do not affect parser
  functionality. Documented as deviation rather than rewriting git history.
- **Files affected:** docs/technical-debt/MASTER_DEBT.jsonl,
  docs/technical-debt/raw/deduped.jsonl, scripts/reviews/dedup-debt.ts,
  scripts/reviews/**tests**/dedup-debt.test.ts
- **Verification:** All 46 parse-review tests pass; TypeScript compiles cleanly
- **Impact:** No impact on plan deliverables

---

**Total deviations:** 1 (pre-commit hook side effect) **Impact on plan:** No
impact on deliverables. Parser module and tests are correct and complete.

## Issues Encountered

None - plan executed as written.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- parse-review.ts ready for consumption by backfill-reviews.ts (Plan 02-02)
- All field extractors tested and validated against real archive format samples
- Completeness tier assignment ready for pipeline integration
- 46 tests provide regression safety for parser changes

---

_Phase: 02-backfill-data-migration_ _Completed: 2026-02-28_
