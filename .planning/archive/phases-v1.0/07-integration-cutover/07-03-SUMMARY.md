<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

phase: 07-integration-cutover plan: 03 subsystem: infra tags: [scripts,
v1-v2-cutover, npm-scripts, session-hooks, JSONL-pipeline]

# Dependency graph

requires:

- phase: 03-core-pipeline provides: v2 JSONL-first pipeline scripts in
  scripts/reviews/
- phase: 07-01 provides: session lifecycle integration patterns provides:
- v1 fallback files for sync-reviews and run-consolidation
- v1 fallback npm aliases (reviews:sync:v1, consolidation:run:v1)
- v1/v2 cutover status documentation in session-start.js
- v1/v2 coexistence note in session-end SKILL.md affects:
  [07-06-final-validation]

# Tech tracking

tech-stack: added: [] patterns: [v1-v2-coexistence, fallback-aliases]

key-files: created: - scripts/sync-reviews-to-jsonl.v1.js -
scripts/run-consolidation.v1.js modified: - scripts/sync-reviews-to-jsonl.js -
scripts/run-consolidation.js - package.json - .claude/hooks/session-start.js -
.claude/skills/session-end/SKILL.md

key-decisions:

- "v1/v2 cutover is gradual coexistence, not full swap -- v2 handles new
  JSONL-first data, v1 bridges legacy markdown"
- "promote-patterns.js already v2 wrapper -- no cutover needed"
- "check-pattern-compliance.js stays v1 -- pre-commit gate too risky to swap"
- "run-consolidation.js stays as active v1 script -- no full v2 replacement
  exists yet, but it reads v2 JSONL data"

patterns-established:

- "v1 fallback pattern: copy to .v1.js suffix, add comment to original
  referencing fallback"
- "v1 alias pattern: add :v1 suffix npm scripts for rollback capability"

# Metrics

duration: 11min completed: 2026-03-01

---

# Phase 7 Plan 3: Script Cutover Summary

**v1/v2 script cutover with fallback files, npm aliases, and coexistence
documentation across session hooks**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-01T22:15:33Z
- **Completed:** 2026-03-01T22:26:43Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Created v1 fallback copies for sync-reviews-to-jsonl.js and
  run-consolidation.js
- Added v1 fallback npm aliases (reviews:sync:v1, consolidation:run:v1) to
  package.json
- Documented v1/v2 cutover status in session-start.js header and inline comments
- Added v1/v2 coexistence note to session-end SKILL.md review sync step
- Confirmed promote-patterns.js is already a v2 wrapper (imports from
  scripts/reviews/lib/)
- Confirmed check-pattern-compliance.js stays v1 (pre-commit gate, v2 has
  partial overlap only)

## Task Commits

Each task was committed atomically (note: parallel agents were active, so
commits are co-mingled):

1. **Task 1: Map v1 references and create v1 fallbacks** - `3bb8fe51` (feat)
2. **Task 2: Update npm scripts and session hooks to v2** - `619c7ba7` (feat)

## Files Created/Modified

- `scripts/sync-reviews-to-jsonl.v1.js` - v1 fallback copy of review sync script
- `scripts/run-consolidation.v1.js` - v1 fallback copy of consolidation script
- `scripts/sync-reviews-to-jsonl.js` - Added v1 fallback reference comment
- `scripts/run-consolidation.js` - Added v1 fallback reference comment
- `package.json` - Added reviews:sync:v1 and consolidation:run:v1 aliases
- `.claude/hooks/session-start.js` - Added v1/v2 status header and inline
  comments
- `.claude/skills/session-end/SKILL.md` - Added v1/v2 coexistence note on review
  sync step

## Decisions Made

1. **Gradual coexistence over full swap** - The v2 pipeline handles new data
   (JSONL-first) while v1 scripts bridge legacy markdown. Both pipelines coexist
   rather than doing a hard cutover.

2. **promote-patterns.js confirmed v2** - Already a CLI wrapper importing from
   `scripts/reviews/dist/lib/promote-patterns.ts`. No cutover action needed.

3. **check-pattern-compliance.js stays v1** - Used in pre-commit hook as a
   blocking gate. The v2 equivalent (verify-enforcement-manifest.ts) has partial
   overlap only. Too risky to swap in pre-commit.

4. **run-consolidation.js has no full v2 replacement** - It already reads from
   v2 JSONL data but has no TypeScript equivalent. Kept as active script with v1
   fallback for safety.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed no-redeclare ESLint error in
eslint-plugin-sonash.test.js**

- **Found during:** Task 1 (pre-commit hook failure)
- **Issue:** `const require = createRequire(import.meta.url)` triggered
  no-redeclare because `require` is now a global in the eslint config for test
  files
- **Fix:** Renamed to `const requireCjs = createRequire(import.meta.url)`
- **Files modified:** tests/eslint-plugin-sonash.test.js
- **Verification:** ESLint passes with 0 errors
- **Committed in:** 3bb8fe51

---

**Total deviations:** 1 auto-fixed (1 blocking) **Impact on plan:** Minor --
pre-existing ESLint config interaction required a variable rename in a test
file. No scope creep.

## Issues Encountered

- Parallel agents were committing simultaneously, causing HEAD ref lock
  conflicts. Resolved by waiting and retrying. Task changes were swept into
  parallel agent commits rather than getting their own isolated commits.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- v1 fallback files in place for INTG-06 reversibility
- npm scripts updated with v1 aliases for quick rollback
- Session hooks documented with cutover status
- Ready for 07-04 (E2E pipeline verification) and 07-06 (final validation)

---

_Phase: 07-integration-cutover_ _Completed: 2026-03-01_
