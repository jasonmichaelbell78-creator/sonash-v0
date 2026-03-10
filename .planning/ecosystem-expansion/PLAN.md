<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-03-09
**Status:** APPROVED
<!-- prettier-ignore-end -->

# Implementation Plan: Ecosystem Expansion

## Summary

Four-phase plan: (1) build repo-wide testing infrastructure (~316 test files,
registry, CI enforcement, documentation), (2) run a new discovery & decision
round for the health ecosystem audit skill informed by the testing
infrastructure now in place, (3) delegate ecosystem creation to `/create-audit`
which owns the skill design and implementation, (4) return here to wire the new
ecosystem into testing infrastructure and verify completeness.

**Decisions:** See DECISIONS.md (33 decisions — Phase 1 testing decisions are
final; Phase 2 ecosystem decisions will be amended after Step 8 discovery)
**Effort Estimate:** XL (multi-session, heavy parallelization)

---

## Plan Architecture

```
PHASE 1: TESTING INFRASTRUCTURE .............. Steps 1-7
  Build tests, registry, CI gates, documentation

PHASE 2: ECOSYSTEM DISCOVERY ................. Step 8
  New Q&A round for health-ecosystem-audit skill design
  Inputs: existing D#1-33 + testing infra in place
  Output: amended DECISIONS.md with skill design decisions

PHASE 3: ECOSYSTEM CREATION .................. Step 9
  Delegate to /create-audit (NOT built inline)
  create-audit owns: SKILL.md, checkers, lib, self-tests

PHASE 4: WIRING & COMPLETION ................. Steps 10-11
  Wire ecosystem into infrastructure, verify, close gaps
```

**Phase gates:** Each phase has explicit entry/exit criteria. Phase 3 does NOT
begin until Phase 2 decisions are approved. Phase 4 does NOT begin until
`/create-audit` completes.

---

## Files to Create/Modify

### Phase 1 New Files (~320)

1. **Test infrastructure** (~5 files)
   - `scripts/generate-test-registry.js`
   - `data/ecosystem-v2/test-registry.jsonl`
   - `docs/agent_docs/TESTING_SYSTEM.md`
   - `scripts/health/checkers/__tests__/` (directory, co-located per D#6)
   - `scripts/health/lib/__tests__/` (directory, co-located per D#6)
   - `tests/hooks/` (directory)

2. **~316 test files** (see Steps 2-6)

### Phase 1 Modified Files (~10)

1. `.github/workflows/ci.yml` — coverage thresholds + test dirs
2. `package.json` — fast-check, npm scripts, tests:registry
3. `tsconfig.test.json` — new test directories
4. `DOCUMENTATION_INDEX.md` — add TESTING_SYSTEM.md
5. 7x ecosystem audit SKILL.md — reference their new `__tests__/`
6. 7x ecosystem audit REFERENCE.md — test patterns section

### Phase 3 New Files (created by /create-audit, ~15)

- `.claude/skills/health-ecosystem-audit/SKILL.md`
- `.claude/skills/health-ecosystem-audit/REFERENCE.md`
- `.claude/skills/health-ecosystem-audit/scripts/run-health-ecosystem-audit.js`
- `.claude/skills/health-ecosystem-audit/scripts/lib/` (benchmarks, scoring,
  state-manager, patch-generator)
- `.claude/skills/health-ecosystem-audit/scripts/checkers/` (6 domain checkers)
- `.claude/skills/health-ecosystem-audit/scripts/__tests__/` (4-file test suite)

### Phase 4 Modified Files (~10)

1. `comprehensive-ecosystem-audit/SKILL.md` — add health #8 to Stage 1
2. `.claude/COMMAND_REFERENCE.md` — register skill
3. `.claude/skills/SKILL_INDEX.md` — add entry
4. `.claude/skills/alerts/SKILL.md` — ownership + Test Health category
5. `.claude/skills/ecosystem-health/SKILL.md` — ownership
6. `.claude/hooks/session-start.js` — wire mid-session-alerts
7. `data/ecosystem-v2/test-registry.jsonl` — add new ecosystem's tests

---

# PHASE 1: TESTING INFRASTRUCTURE

---

## Step 1: Install Dependencies & Configure Infrastructure

Add `fast-check` and configure test infrastructure.

**1a. Add fast-check:**

```bash
npm install --save-dev fast-check
```

**1b. Update `package.json` npm scripts:**

```json
{
  "tests:registry": "node scripts/generate-test-registry.js",
  "test:health": "node --test scripts/health/checkers/__tests__/**/*.test.* scripts/health/lib/__tests__/**/*.test.*",
  "test:hooks": "node --test dist-tests/tests/hooks/**/*.test.js",
  "test:debt": "node --test dist-tests/tests/scripts/debt/**/*.test.js",
  "test:audits": "node --test .claude/skills/*/scripts/__tests__/*.test.js"
}
```

**1c. Update `tsconfig.test.json`:** Add `tests/hooks/`, `tests/scripts/debt/`,
`scripts/health/checkers/__tests__/`, `scripts/health/lib/__tests__/` to
includes.

**1d. Update `.github/workflows/ci.yml`:**

- Add overall coverage threshold: 65% line coverage (fail CI if below)
- Add per-file coverage for changed files: 80% (fail CI if new/modified files
  below)
- Add new test directories to test command glob

**1e. Test naming conventions (global standard per Decision #23):**

All steps (2-6) follow these naming conventions:

- Unit tests: `<module>.test.ts`
- Property-based tests: `<module>.property.test.ts` (co-located with unit tests,
  uses `fast-check`)
- Integration tests: `<module>.integration.test.ts`
- Regression tests: `<area>/regression.test.ts`

The test registry (Step 7a) must scan for all four patterns.

**Done when:** `npm install` succeeds, `npm test` still passes, CI config valid.
**Depends on:** None **Triggers:** All subsequent steps

---

## Step 2: Health System Tests

Create tests for the health monitoring system.

**Steps 2a-2f can run in parallel.**

### Step 2a: Health Checker Unit Tests

Create unit tests for all 10 checkers in `scripts/health/checkers/__tests__/`
(co-located per Decision #6):

| Test File                        | Target                                              | Key Assertions                                                     |
| -------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| `code-quality.test.ts`           | `scripts/health/checkers/code-quality.js`           | Metric extraction from tsc/eslint output, scoring, edge cases      |
| `debt-health.test.ts`            | `scripts/health/checkers/debt-health.js`            | JSONL item counting, severity distribution, staleness scoring      |
| `documentation.test.ts`          | `scripts/health/checkers/documentation.js`          | File count, staleness calc, freshness scoring                      |
| `ecosystem-integration.test.ts`  | `scripts/health/checkers/ecosystem-integration.js`  | Cross-ecosystem validation, dependency checks, integration scoring |
| `hook-pipeline.test.ts`          | `scripts/health/checkers/hook-pipeline.js`          | JSONL parsing, time-binned filtering, 12 metrics                   |
| `learning-effectiveness.test.ts` | `scripts/health/checkers/learning-effectiveness.js` | Regex extraction from LEARNING_METRICS.md                          |
| `pattern-enforcement.test.ts`    | `scripts/health/checkers/pattern-enforcement.js`    | warned-files.json parsing, hotspot detection                       |
| `security.test.ts`               | `scripts/health/checkers/security.js`               | npm audit JSON parsing, vulnerability scoring                      |
| `session-management.test.ts`     | `scripts/health/checkers/session-management.js`     | Git output parsing, session gap calc                               |
| `test-coverage.test.ts`          | `scripts/health/checkers/test-coverage.js`          | JSONL result parsing, staleness                                    |

Each test file includes:

- Unit tests for metric extraction functions
- Boundary tests (empty output, missing files, malformed data)
- Error path tests (tool not found, timeout)
- Property-based tests where applicable (scoring always 0-100)

**Done when:** All 10 checker test files pass. Each checker has >=5 test cases
covering happy path, edge cases, and error paths. **Depends on:** Step 1

### Step 2b: Health Lib Unit Tests

Create/expand tests for health library modules in
`scripts/health/lib/__tests__/` (co-located per Decision #6):

| Test File            | Target                             | Key Assertions                                                          |
| -------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| `composite.test.ts`  | `scripts/health/lib/composite.js`  | Weight sum = 1.0, no_data handling, NaN safety                          |
| `dimensions.test.ts` | `scripts/health/lib/dimensions.js` | All 13 dimensions map correctly, getDimensionDetail edge cases          |
| `scoring.test.ts`    | `scripts/health/lib/scoring.js`    | scoreMetric directions, computeGrade boundaries (79.5->?), computeTrend |
| `health-log.test.ts` | `scripts/health/lib/health-log.js` | Append atomicity, read with corrupt entries, trend from empty log       |

Property-based tests (`fast-check`) for:

- `scoreMetric(value, benchmark, direction)` -> score always in [0, 100]
- `compositeScore(scores, weights)` -> score always in [0, 100]
- `computeGrade(score)` -> always returns valid grade string

**Done when:** All lib test files pass with property-based coverage. **Depends
on:** Step 1

### Step 2c: Health Integration Tests

Expand existing `tests/integration/health-pipeline.integration.test.js`:

- All 10 checkers run and produce valid output structure
- Composite score computed correctly from real checker data
- Warning lifecycle integration: health score drop -> alert -> warning created
- Add `tests/integration/health-alerts-warnings-lifecycle.integration.test.js`

**Done when:** Integration tests exercise full health->alerts->warnings flow.
**Depends on:** Step 1

### Step 2d: Health Performance Budget Tests

Add to `tests/perf/budget.perf.test.js`:

- Quick mode completes in <10s
- Full mode completes in <60s
- Individual checker timeout: <15s each

**Done when:** Budget assertions pass on current hardware. **Depends on:** Step
1

### Step 2e: Health Regression Tests

Create `scripts/health/__tests__/regression.test.ts`:

- Composite score with all-no_data categories doesn't crash
- Single broken checker doesn't tank composite below threshold
- Trend computation with <2 entries returns null gracefully

**Done when:** Known failure modes have regression tests. **Depends on:** Step 1

### Step 2f: run-alerts.js & run-ecosystem-health.js Tests

Per Decision #33, the 3,745-line `run-alerts.js` needs tests:

- `tests/scripts/health/run-alerts.test.ts` — alert categorization, scoring,
  suppression filtering, session JSONL output schema
- `tests/scripts/health/run-ecosystem-health.test.ts` — dashboard output format,
  dimension drill-down, warning integration

**Done when:** Core alert and ecosystem-health logic tested. **Depends on:**
Step 1

---

## Step 3: Debt Pipeline Tests

**Steps 3a-3c can run in parallel.**

### Step 3a: Debt Script Unit Tests

Create unit tests in `tests/scripts/debt/` for all 37 scripts. Each test file:

- Tests core logic (parsing, transformation, validation)
- Mocks file I/O (fs.readFileSync, fs.writeFileSync)
- Tests error paths (missing files, corrupt JSONL)

Key scripts requiring special attention:

- `consolidate-all.js` — orchestrator, test sequencing logic
- `dedup-multi-pass.js` — dedup algorithm, test with known duplicates
- `generate-views.js` — **REGRESSION TEST for Session #134 bug** (must read from
  deduped.jsonl, not overwrite MASTER_DEBT.jsonl)
- `intake-audit.js` — schema validation, dedup key generation
- `validate-schema.js` — schema enforcement

**Done when:** All 37 debt scripts have unit tests. Session #134 regression test
exists and passes. **Depends on:** Step 1

### Step 3b: Debt Pipeline Idempotency Tests

Create `tests/scripts/debt/idempotency.test.ts`:

- `consolidate-all.js` run twice -> identical MASTER_DEBT.jsonl
- `dedup-multi-pass.js` run twice -> zero new dedup removals
- `sync-deduped.js` run twice -> no changes

**Done when:** Pipeline produces identical output on re-run. **Depends on:**
Step 1

### Step 3c: Debt Pipeline E2E Test

Create `tests/e2e/debt-pipeline.e2e.test.js`:

- Full pipeline: intake -> normalize -> dedup -> generate-views ->
  generate-metrics
- Uses fixture data, validates end-to-end output
- Verifies MASTER_DEBT.jsonl and deduped.jsonl stay in sync

**Done when:** E2E pipeline test exercises real scripts with fixture data.
**Depends on:** Step 1

---

## Step 4: Hook Tests

Create unit tests in `tests/hooks/` for all 14 active hooks + 6 lib utilities.

### Step 4a: Hook Lib Tests

`tests/hooks/lib/`:

- `git-utils.test.ts`
- `sanitize-input.test.ts`
- `rotate-state.test.ts`
- `state-utils.test.ts`
- `symlink-guard.test.ts`
- `inline-patterns.test.ts` (if exists)

Each tests: core functions, error paths, edge cases.

### Step 4b: Hook Unit Tests

`tests/hooks/`:

- One test file per active hook (14 files)
- Mock stdin/stdout with fixture data
- Validate exit codes, side effects (state file writes)
- Test error conditions (missing files, invalid JSON, timeout)
- **Exclusion (per Decision #32):** Skip unregistered/backup hooks — only test
  hooks referenced in `.claude/settings.json`. Files not in settings.json are
  dead code (Pass 3 confirmed: 7 superseded files with no references)

### Step 4c: Hook Global Tests

`tests/hooks/global/`:

- `gsd-check-update.test.ts`
- `statusline.test.ts`

**Done when:** All 22 hook test files pass. Each hook has >=3 test cases.
**Depends on:** Step 1 **Can run in parallel with:** Steps 3, 5, 6

---

## Step 5: Ecosystem Audit Tests

Create test suites for all existing ecosystem audit skills at time of execution,
following the hook-ecosystem-audit pattern.

**Steps 5a-5g can run in parallel.**

For each ecosystem audit, create in `.claude/skills/{name}/scripts/__tests__/`:

| File                         | Purpose                                                         |
| ---------------------------- | --------------------------------------------------------------- |
| `checker-regression.test.js` | All checkers run without crash, score 0-100, finding IDs unique |
| `{name}-scoring.test.js`     | Weights sum to 1.0, composite computation correct               |
| `state-manager.test.js`      | History JSONL append/read, baseline save/load                   |
| `{name}-integration.test.js` | Full audit run with `--summary`, validate v2 JSON output schema |

### Step 5a: PR ecosystem audit tests (~4 files)

### Step 5b: Script ecosystem audit tests (~4 files)

### Step 5c: Session ecosystem audit tests (~4 files)

### Step 5d: Skill ecosystem audit tests (~4 files)

### Step 5e: TDMS ecosystem audit tests (~4 files)

### Step 5f: Doc ecosystem audit tests (~4 files)

### Step 5g: Update hook ecosystem audit tests (expand existing)

**Done when:** All existing ecosystem audits have 4 test files each. All pass.
**Depends on:** Step 1 **Can run in parallel with:** Steps 3, 4, 6

---

## Step 6: Root Script + Remaining Tests

### Step 6a: Root Scripts (52 untested)

Create unit tests in `tests/scripts/` for all 52 untested root scripts. Focus
on: input validation, output format, error handling.

### Step 6b: Shared Lib Tests (10 files)

Create `tests/scripts/lib/` for utilities in `scripts/lib/`:

- `sanitize-error.test.ts`
- `security-helpers.test.ts`
- `safe-fs.test.ts` (exists, verify coverage)
- Others as identified

### Step 6c: Remaining Directories

| Directory               | Test Location             | Files |
| ----------------------- | ------------------------- | ----- |
| `scripts/audit/` (9)    | `tests/scripts/audit/`    | 9     |
| `scripts/multi-ai/` (6) | `tests/scripts/multi-ai/` | 6     |
| `scripts/planning/` (6) | `tests/scripts/planning/` | 6     |
| `scripts/velocity/` (2) | `tests/scripts/velocity/` | 2     |
| `scripts/secrets/` (2)  | `tests/scripts/secrets/`  | 2     |
| `scripts/config/` (1)   | `tests/scripts/config/`   | 1     |
| `scripts/tasks/` (1)    | `tests/scripts/tasks/`    | 1     |
| `scripts/metrics/` (1)  | `tests/scripts/metrics/`  | 1     |

**Done when:** All root and subdirectory scripts have unit tests. **Depends
on:** Step 1 **Can run in parallel with:** Steps 3, 4, 5

---

## Step 7: Test Infrastructure & Documentation

### Step 7a: Test Registry Script

Create `scripts/generate-test-registry.js`:

- Scans for all 8 source types (per Decision #29): `test_file`, `audit_checker`,
  `test_protocol`, `skill_command`, `npm_validator`, `gate_check`, `ci_step`,
  `health_checker`
- Outputs `data/ecosystem-v2/test-registry.jsonl`
- Each entry: `{path, source_type, type, owner, target, description}`
- Run via `npm run tests:registry`

**Done when:** Registry script produces complete JSONL covering all ~380+
sources. `npm run tests:registry` runs without error. **Depends on:** Steps 2-6
(needs test files to exist to discover them)

### Step 7b: Pre-Commit Hook Integration

Update pre-commit to detect new `.test.` files without corresponding
test-registry.jsonl update. Non-blocking warning.

**Done when:** Committing a new test file without registry update produces
warning. **Depends on:** Step 7a

### Step 7c: Testing System Documentation

Create `docs/agent_docs/TESTING_SYSTEM.md`:

1. Testing architecture overview (framework, runner, coverage tool)
2. Test file location map (area -> directory -> test types)
3. Ownership matrix (ecosystem audit -> owned tests)
4. Invocation guide (npm scripts, CI, audit-triggered)
5. Coverage map (tested vs untested, by area)
6. Test type glossary (14 types, what each means in this repo)
7. Adding new tests guide (placement, naming, patterns)
8. Test result flow diagram (CI -> /alerts -> health scoring)
9. Test registry documentation (8 source types, how to register)

**Done when:** TESTING_SYSTEM.md is comprehensive, accurate, and referenced from
DOCUMENTATION_INDEX.md. **Depends on:** Steps 2-6, 7a

### Step 7d: Phase 1 Verification

Run code-reviewer agent on all Phase 1 new/modified files.

- Security: no command injection in test scripts, no hardcoded paths
- Patterns: error sanitization, path traversal guards, exec /g flag
- Quality: consistent test patterns, no duplicate logic
- Coverage: verify ~316 test files actually created and passing
- **All findings must be FIXED before Phase 1 closes** — no TDMS deferral

**Done when:** Code reviewer passes clean. All ~316 tests pass. CI coverage
thresholds met. **Depends on:** Steps 1-7c

---

**PHASE 1 EXIT GATE:** All tests pass, CI thresholds enforced, test-registry
complete, TESTING_SYSTEM.md published. Phase 1 can be committed independently.

---

# PHASE 2: ECOSYSTEM DISCOVERY

---

## Step 8: Health Ecosystem Audit — Discovery & Decisions

Run a new discovery and decision round for the health-ecosystem-audit skill
design. This is NOT implementation — it produces an amended DECISIONS.md that
`/create-audit` will consume.

### Step 8a: Context Review

Review what exists after Phase 1:

- Existing decisions D#1-33 (ecosystem name, domains, weights, prefix, etc.)
- Testing infrastructure now in place (what tests exist, what patterns emerged)
- Test registry contents (what's covered, what's not)
- Insights from building 316 tests (failure modes discovered, patterns learned)

### Step 8b: New Discovery Questions

Topics that could NOT be decided before Phase 1 but CAN be decided now:

- **Skill design:** SKILL.md interactive walkthrough flow, step structure,
  domain presentation order, finding review format
- **D5 refinement:** Now that health tests exist, what specific test patterns
  should D5 verify? What coverage thresholds are realistic based on actual data?
- **Triage UX:** Decision #30 defined Fix Now/Defer/Skip — what does the full
  interaction look like? How does inline investigation work?
- **Checker implementation:** Which existing patterns from the 7 other ecosystem
  audits should be followed vs diverged from?
- **REFERENCE.md content:** Templates, schemas, benchmarks table, dashboard
  format
- **Self-test scope:** Standard 4-file suite, or additional tests given this
  audit runs live tests (meta-testing)?
- **Integration with testing infrastructure:** How does the audit consume
  test-registry.jsonl? What's the API contract?

Format: Same Q&A batches as Phase 1 discovery. Offer defaults, save after each
batch.

### Step 8c: Amend DECISIONS.md

Add new decisions (D#34+) to DECISIONS.md covering all skill design choices.
These become the input specification for `/create-audit`.

**Done when:** DECISIONS.md amended with skill design decisions. User approves
amended decisions. **Depends on:** Phase 1 complete (Step 7d passed)

---

**PHASE 2 EXIT GATE:** Amended DECISIONS.md approved. All skill design choices
made. Ready to hand off to `/create-audit`.

---

# PHASE 3: ECOSYSTEM CREATION

---

## Step 9: Create Health Ecosystem Audit via /create-audit

**Delegate to `/create-audit`.** This plan does NOT specify the skill
implementation — that is `/create-audit`'s responsibility.

### What /create-audit receives:

- DECISIONS.md (D#1-33 from Phase 1 + D#34+ from Phase 2)
- DIAGNOSIS.md (system inventory, existing patterns)
- Testing infrastructure context (test-registry.jsonl, TESTING_SYSTEM.md)

### What /create-audit produces:

- `SKILL.md` — interactive walkthrough, domains, categories
- `REFERENCE.md` — templates, schemas, benchmarks, dashboard
- `scripts/run-health-ecosystem-audit.js` — orchestrator
- `scripts/lib/` — benchmarks.js, scoring.js, state-manager.js,
  patch-generator.js
- `scripts/checkers/` — 6 domain checkers (per D#3) using `HMS-` prefix (per
  D#2)
- `scripts/__tests__/` — standard 4-file test suite (checker-regression,
  scoring, state-manager, integration)

### What this plan explicitly requires of /create-audit:

1. The 4-file test suite MUST be created as part of the skill (not deferred)
2. Finding IDs MUST use `HMS-` prefix (Decision #2)
3. Domain weights MUST match Decision #11
4. D5 checker MUST implement live test execution (Decision #15) with test
   failure triage UX (Decision #30: Fix Now / Defer / Skip)
5. Staleness guard for CI results MUST use configurable threshold, 24h default
   (Decision #20)
6. Scoring library MUST be forked from hook-ecosystem-audit (Decision #22)

**Done when:** `/create-audit` completes. Skill runs successfully:
`node .claude/skills/health-ecosystem-audit/scripts/run-health-ecosystem-audit.js --summary`
produces valid v2 JSON. All 4 self-tests pass. **Depends on:** Step 8

---

**PHASE 3 EXIT GATE:** Skill created, self-tests pass, `--summary` produces
valid output. Ready to wire into infrastructure.

---

# PHASE 4: WIRING & COMPLETION

---

## Step 10: Wire Ecosystem into Infrastructure

### Step 10a: Ownership Transfers

Update `/alerts` SKILL.md and `/ecosystem-health` SKILL.md:

- Add ownership reference: "Part of health-ecosystem-audit ecosystem"
- `/alerts`: Add "Test Health" category (per Decision #21)

### Step 10b: Ecosystem Registration

- `comprehensive-ecosystem-audit/SKILL.md` — add health to Stage 1 (per D#7)
- `.claude/COMMAND_REFERENCE.md` — add `/health-ecosystem-audit`
- `.claude/skills/SKILL_INDEX.md` — add entry
- `DOCUMENTATION_INDEX.md` — update if needed

### Step 10c: Test Infrastructure Wiring

- Run `npm run tests:registry` — verify new ecosystem's tests auto-discovered
- If not auto-discovered, update `scripts/generate-test-registry.js` scan paths
- Verify `test:audits` npm script glob picks up new `__tests__/` directory
- Update `TESTING_SYSTEM.md` ownership matrix with new ecosystem

### Step 10d: Wire Mid-Session Alerts

Per Decision #19, wire the orphaned `mid-session-alerts.js` into the hook
system.

- Update `.claude/hooks/session-start.js` to call `runMidSessionChecks()` after
  post-commit events (or create a new post-commit hook)
- Verify cooldown system works (1h per alert type)
- Verify alerts surface via warning lifecycle

### Step 10e: Existing Ecosystem Audit Updates

For all existing ecosystem audits (including the new health one):

- Update SKILL.md to reference their `__tests__/` directory
- Update REFERENCE.md with test patterns section

**Done when:** All registration files updated. `/health-ecosystem-audit` appears
in comprehensive orchestrator. Test registry includes new ecosystem's tests.
Mid-session alerts wired. **Depends on:** Step 9

---

## Step 11: Final Verification & Gap Analysis

### Step 11a: Code Review

Run code-reviewer agent on all Phase 3-4 new/modified files.

- Security: no command injection, no hardcoded paths
- Patterns: error sanitization, path traversal guards, exec /g flag
- Quality: consistent patterns with other ecosystem audits
- **All findings MUST be fixed before merge — NO TDMS deferral.** A new skill
  ships clean or it doesn't ship.

### Step 11b: Decision Coverage Gap Analysis

Cross-check DECISIONS.md (all decisions, D#1 through final) against implemented
artifacts:

- Every decision maps to a concrete implementation
- No decisions were silently skipped or reinterpreted
- Any deviations documented with rationale

### Step 11c: Full Test Run

- `npm test` — all existing + new tests pass
- `npm run test:health` — health-specific tests pass
- `npm run test:audits` — all ecosystem audit self-tests pass (including new)
- `npm run tests:registry` — registry is complete, no orphaned tests
- CI coverage thresholds still met

### Step 11d: Integration Smoke Test

- Run `/health-ecosystem-audit` end-to-end — verify all 6 domains produce
  findings
- Run `/comprehensive-ecosystem-audit` — verify health audit appears in Stage 1
  and completes
- Verify `/alerts` shows "Test Health" category
- Verify mid-session alerts fire on simulated score degradation

**Done when:** Code review clean. Gap analysis clean. All tests pass. Smoke
tests pass. **Depends on:** Step 10

---

**PHASE 4 EXIT GATE:** Everything verified. Ready to commit and merge.

---

## Parallelization Guide

```
PHASE 1:
  Step 1: Infrastructure (sequential — everything depends on this)
    |
    +-- Step 2a-2f: Health tests (parallel within)
    +-- Step 3a-3c: Debt tests (parallel within)
    +-- Step 4a-4c: Hook tests (parallel within)
    +-- Step 5a-5g: Ecosystem audit tests (parallel within)
    +-- Step 6a-6c: Root script tests (parallel within)
         |
         |  (Steps 2-6 all run in parallel with each other)
         |
         +-- Step 7a: Test registry (needs Steps 2-6 complete)
         +-- Step 7b: Pre-commit hook (needs 7a)
         +-- Step 7c: Documentation (needs Steps 2-6, 7a)
         +-- Step 7d: Phase 1 verification (needs 7a-7c)

PHASE 2:
  Step 8: Discovery & decisions (sequential, interactive)

PHASE 3:
  Step 9: /create-audit (sequential, interactive)

PHASE 4:
  Step 10a-10e: Wiring (mostly parallel)
    |
    +-- Step 11: Verification (needs all of Step 10)
```

**Phase 1 maximum parallelism:** Steps 2-6 = 5 concurrent workstreams, each with
2-7 internal parallel tasks. With subagents, up to ~25 parallel tasks.

**Phases 2-3** are interactive (user Q&A) and sequential by nature.

**Phase 4** has moderate parallelism in Step 10 (5 substeps, mostly
independent).

---

## Execution Routing

Per Decision #8: single plan, parallel subagent execution for Phase 1.

**Phase 1 dispatch:**

- **5 subagents for Steps 2-6** (one per area, parallel)
- **1 subagent for Step 7a-7c** (after 2-6 complete)
- **Main context for Step 7d** (verification needs judgment)

**Phase 2 dispatch:** Main context (interactive Q&A with user)

**Phase 3 dispatch:** Invoke `/create-audit` skill (interactive)

**Phase 4 dispatch:** Main context for wiring + verification
(coordination-heavy)
