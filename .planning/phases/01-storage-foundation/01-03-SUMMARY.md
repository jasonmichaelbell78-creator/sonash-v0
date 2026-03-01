<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

phase: 01-storage-foundation plan: 03 subsystem: testing tags: [zod, fixtures,
contract-tests, completeness-tiers, jsonl]

# Dependency graph

requires:

- phase: 01-storage-foundation/01-01 provides: Zod schemas for all 5 entity
  types + SCHEMA_MAP
- phase: 01-storage-foundation/01-02 provides: readValidatedJsonl, appendRecord,
  hasField, validateCompleteness provides:
- 11 test fixtures covering full/partial/stub tiers for all entity types
- 7 contract tests validating data handoff points across pipeline
- Inline PromotionResult and EnforcementRule shapes for Phase 3+5 affects:
  [02-ingestion-layer, 03-analysis-engine, 05-enforcement-loop, 06-reporting]

# Tech tracking

tech-stack: added: [] patterns: - "Contract test pattern: load fixture -> parse
through schema -> assert consumer fields" - "Completeness-aware consumer
pattern: check hasField() before accessing optional data" - "Graceful
degradation: stub records return null/skip, never crash"

key-files: created: - test/fixtures/ecosystem-v2/review-full.json -
test/fixtures/ecosystem-v2/review-partial.json -
test/fixtures/ecosystem-v2/review-stub.json -
test/fixtures/ecosystem-v2/retro-full.json -
test/fixtures/ecosystem-v2/retro-partial.json -
test/fixtures/ecosystem-v2/retro-stub.json -
test/fixtures/ecosystem-v2/deferred-item-full.json -
test/fixtures/ecosystem-v2/deferred-item-partial.json -
test/fixtures/ecosystem-v2/deferred-item-stub.json -
test/fixtures/ecosystem-v2/invocation-full.json -
test/fixtures/ecosystem-v2/warning-full.json -
tests/scripts/ecosystem-v2/contracts/review-write.contract.test.ts -
tests/scripts/ecosystem-v2/contracts/deferred-write.contract.test.ts -
tests/scripts/ecosystem-v2/contracts/promotion-input.contract.test.ts -
tests/scripts/ecosystem-v2/contracts/promotion-output.contract.test.ts -
tests/scripts/ecosystem-v2/contracts/effectiveness-input.contract.test.ts -
tests/scripts/ecosystem-v2/contracts/enforcement-generation.contract.test.ts -
tests/scripts/ecosystem-v2/contracts/markdown-render.contract.test.ts modified:
[]

key-decisions:

- "Inline PromotionResult and EnforcementRule Zod shapes in contract tests --
  formalized in Phase 3/5"
- "Deferred-item stub still requires review_id and finding (entity-specific
  required fields)"
- "Contract tests simulate consumer logic (fix rate computation, markdown
  rendering) to prove data shape works"

patterns-established:

- "Contract test naming: describe('Contract: Producer -> Consumer', ...)"
- "Fixture naming: {entity}-{tier}.json (e.g., review-full.json,
  retro-stub.json)"
- "Consumer pattern: always check hasField() before accessing optional data,
  return null on missing"

# Metrics

duration: 4min completed: 2026-02-28

---

# Phase 1 Plan 3: Test Fixtures and Contract Tests Summary

**11 test fixtures across 3 completeness tiers + 7 contract tests validating all
pipeline data handoff points with 42 new test cases**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-28T19:58:53Z
- **Completed:** 2026-02-28T20:03:04Z
- **Tasks:** 2
- **Files created:** 18

## Accomplishments

- Created 11 fixture files covering full/partial/stub completeness tiers for
  reviews, retros, deferred-items, invocations, and warnings
- Created 7 contract tests that validate data shape compatibility at every
  pipeline handoff point
- Established consumer patterns: hasField()-guarded access, graceful degradation
  for partial/stub data
- Total Phase 1 test count: 84 tests across 11 test files (42 existing + 42 new
  contract tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create test fixtures for all completeness tiers** - `aa8d92d1`
   (test)
2. **Task 2: Create 7 contract tests for data handoff points** - `b5710bec`
   (test)

## Files Created/Modified

- `test/fixtures/ecosystem-v2/review-full.json` - Full-tier review with all
  fields populated
- `test/fixtures/ecosystem-v2/review-partial.json` - Partial-tier review with
  nullable fields set to null
- `test/fixtures/ecosystem-v2/review-stub.json` - Stub-tier review with minimal
  BaseRecord fields only
- `test/fixtures/ecosystem-v2/retro-full.json` - Full-tier retro with score and
  metrics
- `test/fixtures/ecosystem-v2/retro-partial.json` - Partial-tier retro without
  score/metrics
- `test/fixtures/ecosystem-v2/retro-stub.json` - Stub-tier retro with BaseRecord
  only
- `test/fixtures/ecosystem-v2/deferred-item-full.json` - Full-tier deferred with
  severity and reason
- `test/fixtures/ecosystem-v2/deferred-item-partial.json` - Partial-tier
  deferred without reason/severity
- `test/fixtures/ecosystem-v2/deferred-item-stub.json` - Stub-tier deferred with
  required fields only
- `test/fixtures/ecosystem-v2/invocation-full.json` - Full-tier invocation with
  context
- `test/fixtures/ecosystem-v2/warning-full.json` - Full-tier warning with
  related_ids
- `tests/scripts/ecosystem-v2/contracts/review-write.contract.test.ts` -
  Contract: skill -> reviews.jsonl (6 tests)
- `tests/scripts/ecosystem-v2/contracts/deferred-write.contract.test.ts` -
  Contract: review -> deferred-items.jsonl (6 tests)
- `tests/scripts/ecosystem-v2/contracts/promotion-input.contract.test.ts` -
  Contract: JSONL -> promotion (6 tests)
- `tests/scripts/ecosystem-v2/contracts/promotion-output.contract.test.ts` -
  Contract: promotion -> CODE_PATTERNS (5 tests)
- `tests/scripts/ecosystem-v2/contracts/effectiveness-input.contract.test.ts` -
  Contract: JSONL -> effectiveness (7 tests)
- `tests/scripts/ecosystem-v2/contracts/enforcement-generation.contract.test.ts` -
  Contract: promotion -> rules (7 tests)
- `tests/scripts/ecosystem-v2/contracts/markdown-render.contract.test.ts` -
  Contract: JSONL -> markdown (5 tests)

## Decisions Made

- Inline PromotionResult and EnforcementRule Zod shapes defined in contract
  tests rather than formal schema files -- these will be formalized when their
  respective phases (3 and 5) are implemented
- Contract tests simulate consumer logic (fix rate computation, severity
  weighting, markdown rendering) to prove data shape compatibility beyond just
  schema validation
- Deferred-item stub tier still requires review_id and finding as
  entity-specific required fields (not just BaseRecord)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 complete: all 3 plans executed (schemas, utilities,
  fixtures/contracts)
- 84 total tests provide safety net for Phase 2+ development
- Contract tests define exact data shapes Phase 2 ingestion must produce
- Inline shapes (PromotionResult, EnforcementRule) ready to be formalized in
  their respective phases

---

_Phase: 01-storage-foundation_ _Completed: 2026-02-28_
