<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

phase: 03-core-pipeline plan: 04 subsystem: pipeline tags: [skills, jsonl,
pr-review, pr-retro, fix-templates, security, wiring]

# Dependency graph

requires:

- phase: 01-storage-foundation provides: JSONL read/write infrastructure,
  appendRecord(), auto-ID
- phase: 03-core-pipeline plans 01-03 provides: write-review-record.ts,
  write-retro-record.ts, write-deferred-items.ts, write-invocation.ts CLI
  scripts provides:
- pr-review SKILL.md wired to invoke write-review-record, write-deferred-items,
  write-invocation after each review
- pr-retro SKILL.md wired with dual-write (JSONL source of truth + legacy
  markdown) and invocation tracking
- 3 authored security FIX_TEMPLATES (#46-#48) for error sanitization, path
  traversal, symlink guards affects: [04-enforcement, 05-compliance,
  07-integration]

# Tech tracking

tech-stack: added: [] patterns:

- Skill JSONL wiring: CLI template commands in SKILL.md that Claude fills with
  actual values at runtime
- Dual-write pattern: JSONL as source of truth, legacy markdown maintained
  during transition

key-files: created: [] modified:

- .claude/skills/pr-review/SKILL.md
- .claude/skills/pr-retro/SKILL.md
- docs/agent_docs/FIX_TEMPLATES.md

key-decisions:

- "JSONL pipeline step inserted as Step 7.5 (between LEARNING and SUMMARY) to
  preserve all existing steps"
- "pr-retro dual-write uses sub-steps 4.1-4.4 within existing Step 4 rather than
  adding a new top-level step"
- "Security templates #46-#48 authored as full code examples with propagation
  greps, not stubs"

patterns-established:

- "Skill wiring pattern: CLI template with placeholder values that executing
  agent fills in"
- "Dual-write during transition: JSONL source of truth + legacy format coexist"

# Metrics

duration: 4min completed: 2026-02-28

---

# Phase 3 Plan 4: Skill Wiring & Security Templates Summary

**JSONL pipeline wired into pr-review (Step 7.5) and pr-retro (dual-write Step
4.1-4.4) skills, plus 3 authored security FIX_TEMPLATES for error sanitization,
path traversal, and symlink guards**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-28T23:27:12Z
- **Completed:** 2026-02-28T23:31:13Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- pr-review SKILL.md now directs Claude to write review JSONL records, create
  deferred items, and track invocations after every review
- pr-retro SKILL.md now writes retro JSONL (source of truth) AND legacy markdown
  (dual-write) with invocation tracking
- 3 substantive security FIX_TEMPLATES (#46-#48) covering the most common
  security patterns from CODE_PATTERNS.md

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire JSONL writes into pr-review and pr-retro skills** - `917732d8`
   (feat)
2. **Task 2: Author 3 security FIX_TEMPLATES** - `99d6399e` (feat)

## Files Created/Modified

- `.claude/skills/pr-review/SKILL.md` - Added Step 7.5 (JSONL PIPELINE) with
  write-review-record, write-deferred-items, write-invocation; updated protocol
  diagram; bumped to v3.6
- `.claude/skills/pr-retro/SKILL.md` - Restructured Step 4 into sub-steps
  4.1-4.4 with JSONL dual-write and invocation tracking; bumped to v3.3
- `docs/agent_docs/FIX_TEMPLATES.md` - Added Templates #46 (Error Sanitization
  Guard), #47 (Path Traversal Prevention), #48 (Symlink Guard for File Writes);
  bumped to v2.8

## Decisions Made

- Step 7.5 inserted between existing Steps 7 and 8 in pr-review to avoid
  renumbering all downstream steps
- pr-retro uses sub-steps (4.1-4.4) within existing Step 4 rather than adding a
  new top-level step, keeping the document compact
- Security templates authored as full copy-paste-ready code with edge case
  tables, propagation greps, and references to project helpers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 (Core Pipeline) is now complete (all 4 plans executed)
- All JSONL writers exist (Plans 01-03) and are wired into skills (Plan 04)
- Promotion pipeline, CLAUDE.md auto-updater, and FIX_TEMPLATES generator ready
  for Phase 4 enforcement integration
- 48 FIX_TEMPLATES available for review automation

---

_Phase: 03-core-pipeline_ _Completed: 2026-02-28_
