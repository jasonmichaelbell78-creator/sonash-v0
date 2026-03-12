<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

phase: 03-core-pipeline plan: 03 subsystem: pipeline tags: [ typescript,
pattern-detection, code-patterns, claude-md, fix-templates, promotion, ]

# Dependency graph

requires:

- phase: 01-storage-foundation provides: readValidatedJsonl, ReviewRecord
  schema, JSONL infrastructure
- phase: 02-backfill-data-migration provides: 360 reviews in
  data/ecosystem-v2/reviews.jsonl provides:
- promote-patterns.ts: recurrence detection (N>=3, M>=2 PRs) with CODE_PATTERNS
  promotion
- generate-claude-antipatterns.ts: CLAUDE.md Section 4 auto-updater with
  marker-delimited regions
- generate-fix-template-stubs.ts: FIX_TEMPLATES.md stub generator with
  auto-numbering
- Rule skeleton generation for check-pattern-compliance.js affects:
  [04-enforcement, 05-compliance, 07-integration]

# Tech tracking

tech-stack: added: [] patterns: - "Marker-delimited auto-managed regions
(AUTO-ANTIPATTERNS-START/END)" - "CLI wrapper pattern: JS entry point delegates
to compiled TS in dist/" - "Recurrence detection with dual threshold (count +
distinct PRs)"

key-files: created: - scripts/reviews/lib/promote-patterns.ts -
scripts/reviews/lib/generate-claude-antipatterns.ts -
scripts/reviews/lib/generate-fix-template-stubs.ts -
scripts/generate-claude-antipatterns.js -
scripts/generate-fix-template-stubs.js -
scripts/reviews/**tests**/promotion-pipeline.test.ts modified: -
scripts/promote-patterns.js - scripts/reviews/tsconfig.json

key-decisions:

- "TS source in scripts/reviews/lib/ with JS CLI wrappers in scripts/ -- follows
  existing project pattern"
- "Reused readValidatedJsonl and ReviewRecord from Phase 1 infrastructure"
- "promote-patterns.ts replaces the old JS promote-patterns.js with v2 data
  source"
- "CLAUDE.md auto-updater uses marker comments for safe content replacement"
- "FIX_TEMPLATES stubs use fuzzy matching to skip already-documented patterns"

patterns-established:

- "CLI wrapper pattern: scripts/\*.js requires compiled TS from
  scripts/reviews/dist/"
- "Marker-delimited auto-managed regions for safe doc updates"

# Metrics

duration: 15min completed: 2026-02-28

---

# Phase 3 Plan 3: Promotion Pipeline Summary

**Merged promotion pipeline with recurrence detection, CODE_PATTERNS promotion,
CLAUDE.md anti-patterns auto-updater, and FIX_TEMPLATES stub generator -- all
with dry-run modes and 27 tests**

## Performance

- **Duration:** 15 min
- **Started:** 2026-02-28T23:07:14Z
- **Completed:** 2026-02-28T23:22:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Recurrence detection pipeline that identifies patterns appearing N>=3 times
  across M>=2 distinct PRs
- CODE_PATTERNS.md auto-promotion with category-based section insertion and
  dedup
- CLAUDE.md Section 4 auto-updater with marker-delimited regions for safe
  replacement
- FIX_TEMPLATES.md stub generator with auto-numbering and existing-pattern
  detection
- Enforcement rule skeleton generation for check-pattern-compliance.js
- All three scripts support --dry-run for safe preview before writing

## Task Commits

Each task was committed atomically:

1. **Task 1: Create promote-patterns.ts with recurrence detection and
   CODE_PATTERNS promotion** - `91f0b9fc` (feat)
2. **Task 2: Create CLAUDE.md and FIX_TEMPLATES auto-generators** - `7f748906`
   (feat)

## Files Created/Modified

- `scripts/reviews/lib/promote-patterns.ts` - Core promotion pipeline:
  recurrence detection, filtering, categorization, rule skeletons
- `scripts/reviews/lib/generate-claude-antipatterns.ts` - CLAUDE.md Section 4
  auto-updater with marker-delimited regions
- `scripts/reviews/lib/generate-fix-template-stubs.ts` - FIX_TEMPLATES.md stub
  generator with auto-numbering
- `scripts/promote-patterns.js` - CLI wrapper (replaced old JS version with TS
  delegation)
- `scripts/generate-claude-antipatterns.js` - CLI wrapper for CLAUDE.md updater
- `scripts/generate-fix-template-stubs.js` - CLI wrapper for FIX_TEMPLATES stub
  generator
- `scripts/reviews/__tests__/promotion-pipeline.test.ts` - 27 tests covering all
  pipeline functions
- `scripts/reviews/tsconfig.json` - Added **tests** to include paths

## Decisions Made

- **TS source location:** Placed TypeScript source in `scripts/reviews/lib/`
  where the existing tsconfig.json compilation infrastructure exists, with JS
  CLI wrappers in `scripts/` for backward compatibility
- **Old promote-patterns.js replaced:** The existing JS version read from
  `.claude/state/reviews.jsonl` (v1 data). New version reads from
  `data/ecosystem-v2/reviews.jsonl` (v2 data) via readValidatedJsonl
- **Marker-based CLAUDE.md updates:** Uses `<!-- AUTO-ANTIPATTERNS-START -->` /
  `<!-- AUTO-ANTIPATTERNS-END -->` markers to safely replace only the
  auto-managed region
- **Fuzzy dedup in FIX_TEMPLATES:** Uses normalized pattern names (lowercase,
  hyphens to spaces) for matching against existing template content
- **run-consolidation.js untouched:** Both pipelines coexist during transition
  per research pitfall #5

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed NaN in CLI argument parsing**

- **Found during:** Task 1 (promote-patterns.ts CLI mode)
- **Issue:** `args.indexOf("--min-occurrences") + 1` returned `args[0]` when
  flag not present (index -1 + 1 = 0), parsing "--dry-run" as a number = NaN
- **Fix:** Added explicit index check before parsing:
  `minOccIdx !== -1 && args[minOccIdx + 1]`
- **Files modified:** scripts/reviews/lib/promote-patterns.ts
- **Verification:** --dry-run shows "minOccurrences=3" (default) instead of NaN

---

**Total deviations:** 1 auto-fixed (1 bug) **Impact on plan:** Minor argument
parsing fix. No scope creep.

## Issues Encountered

- Task 1 test initially failed because two patterns with equal count were
  expected in a specific order, but the sort was alphabetical as secondary sort.
  Fixed test expectations to match alphabetical ordering.
- Current reviews.jsonl data has few reviews with both patterns AND distinct PR
  numbers (most backfilled reviews have null PRs), so --dry-run with default
  thresholds (N>=3, M>=2) returns 0 patterns. This is correct behavior --
  lowering thresholds with --min-occurrences 1 --min-prs 1 shows 41 patterns.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Promotion pipeline ready for integration with Phase 4 enforcement
- Rule skeletons provide input format for check-pattern-compliance.js
- CLAUDE.md markers ready for auto-update on subsequent pipeline runs
- Blocking: As more reviews accumulate with PR numbers, the default thresholds
  will start producing results

---

_Phase: 03-core-pipeline_ _Completed: 2026-02-28_
