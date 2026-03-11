<!-- prettier-ignore-start -->
**Document Version:** 3.0
**Last Updated:** 2026-03-10
**Status:** APPROVED
<!-- prettier-ignore-end -->

# Implementation Plan: Ecosystem Expansion

## Summary

Seven-phase plan: (1) build repo-wide testing infrastructure (~316 test files,
registry, CI enforcement, documentation) — DONE, (2) run a new discovery &
decision round for health ecosystem audit skill design — DONE, (3) delegate
ecosystem creation to `/create-audit` — PENDING, (4) wire ecosystem into
infrastructure — PENDING, (5) testing coverage infrastructure (registry fix,
auto-detection, CI gate, baseline), (6) testing coverage expansion (~181 new
test files, parallel subagents), (7) testing coverage verification.

**Decisions:** See DECISIONS.md (81 decisions: D#1-33 testing infrastructure,
D#34-52 skill design, D#53-81 testing coverage amendment) **Effort Estimate:**
XL (multi-session, heavy parallelization)

---

## Plan Architecture

```
PHASE 1: TESTING INFRASTRUCTURE .............. Steps 1-7     [DONE]
  Build tests, registry, CI gates, documentation

PHASE 2: ECOSYSTEM DISCOVERY ................. Step 8        [DONE]
  Skill design decisions D#34-52

PHASE 3: ECOSYSTEM CREATION .................. Step 9        [DONE]
  Delegate to /create-audit (NOT built inline)

PHASE 4: WIRING & COMPLETION ................. Steps 10-11   [DONE]
  Wire ecosystem into infrastructure, verify

PHASE 5: TESTING COVERAGE INFRA .............. Step 12       [DONE]
  Registry fix, auto-detection, CI gate, baseline, npm scripts

PHASE 6: TESTING COVERAGE EXPANSION .......... Steps 13-19   [NEW]
  ~181 new test files via parallel subagents

PHASE 7: TESTING COVERAGE VERIFICATION ...... Step 20        [NEW]
  Full verification, registry clean, baseline active
```

**Phase gates:** Phases 3-4 and Phases 5-7 are INDEPENDENT — they can run in
parallel or in either order. Phase 5 MUST complete before Phase 6. Phase 6 MUST
complete before Phase 7. Phase 4 does NOT begin until `/create-audit` completes.

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

**Phase 5 dispatch:** Main context (infrastructure changes need coordination)

**Phase 6 dispatch:** 7 parallel subagents (one per area), main context for
verification

**Phase 7 dispatch:** Main context (verification needs judgment)

---

# PHASE 5: TESTING COVERAGE INFRASTRUCTURE

---

## Step 12: Auto-Detection Infrastructure

Per Decisions #57, #58, #63, #64, #68, #69, #72, #74, #79, #80, #81.

### Step 12a: Fix Test Registry Scanner

Update `scripts/generate-test-registry.js` to:

1. Fix scanning logic that produces stale entries (28 currently stale)
2. Add missing scan patterns to discover all 63 unregistered test files
3. Add `--check-coverage` flag (per D#68):
   - Scans covered directories (per D#64): `scripts/**/*.js`,
     `.claude/hooks/**/*.js`, `.claude/skills/*/scripts/**/*.js`
   - Compares against test file inventory
   - Reads `.test-baseline.json` to exclude known gaps
   - Auto-cleans baseline entries for deleted scripts (per D#80)
   - Exits non-zero if NEW untested files found (not in baseline)
   - Outputs gap report to stdout
4. Regenerate `data/ecosystem-v2/test-registry.jsonl` — clean state

**Done when:** `npm run tests:registry` produces clean JSONL with no stale
entries. `--check-coverage` correctly identifies current gaps. **Depends on:**
None

### Step 12b: Create Test Baseline

Create `.test-baseline.json` (committed to repo, per D#79):

```json
{
  "version": 1,
  "description": "Scripts without tests. Remove entries as tests are created.",
  "created": "2026-03-10",
  "entries": [
    {"path": "scripts/aggregate-audit-findings.js", "lines": 1954},
    {"path": "scripts/analyze-learning-effectiveness.js", "lines": 1326},
    ...
  ]
}
```

Populate with all currently-untested scripts from `--check-coverage` output.

**Done when:** `.test-baseline.json` committed. `--check-coverage` passes (all
gaps are baselined). **Depends on:** Step 12a

### Step 12c: Pre-Commit Hook Integration

Update `.husky/pre-commit` (per D#69):

- Add check: scan staged files for new `.js` files in covered directories
- If new script has no corresponding test, print warning (per D#63: warn, not
  block)
- Warning format: `⚠ New script scripts/foo.js has no test file`

**Done when:** Committing a new script in `scripts/` without a test produces a
warning. Existing scripts don't trigger. **Depends on:** Step 12a (needs
coverage check logic)

### Step 12d: CI Gate Integration

Update `.github/workflows/ci.yml` (per D#57, D#63):

- Add step after tests pass: "Check test coverage completeness"
- Command: `node scripts/generate-test-registry.js --check-coverage`
- Blocking: exits non-zero if NEW untested files (not in baseline)

**Done when:** CI blocks PRs that add untested scripts. PRs that add tests AND
remove baseline entries pass. **Depends on:** Steps 12a, 12b

### Step 12e: npm Scripts & tsconfig

Update `package.json` (per D#67):

```json
{
  "test:checkers": "node --test .claude/skills/*/scripts/checkers/__tests__/*.test.js",
  "test:infra": "npm run test:build && node --test dist-tests/tests/scripts/*.test.js dist-tests/tests/scripts/lib/**/*.test.js dist-tests/tests/scripts/audit/**/*.test.js",
  "test:pipeline": "npm run test:build && node --test dist-tests/tests/scripts/debt/**/*.test.js dist-tests/tests/scripts/multi-ai/**/*.test.js dist-tests/tests/scripts/planning/**/*.test.js"
}
```

Update `tsconfig.test.json` (per D#74):

- Replace specific directory includes with wildcard: `tests/**/*.ts`

**Done when:** All three new npm scripts run without error.
`tsc -p tsconfig.test.json` compiles all test directories. **Depends on:** None

### Step 12f: Investigate Orphan Test

Per D#73: Check if `promotion-pipeline.test.ts` tests `promote-patterns.ts` or a
combined pipeline. Grep imports, check test descriptions.

- If valid: rename or update to match source
- If orphaned: delete

**Done when:** Orphan resolved (renamed, reassigned, or deleted). **Depends
on:** None

---

**PHASE 5 EXIT GATE:** Registry clean (0 stale entries), `--check-coverage`
passes, pre-commit warns on new untested scripts, CI blocks new untested
scripts, npm scripts work, tsconfig wildcard, baseline committed.

---

# PHASE 6: TESTING COVERAGE EXPANSION

---

**Per Decisions #53-56, #59-62, #65-66, #70-71, #75, #77-78.**

**All Steps 13-19 can run in parallel via subagents.**

---

## Step 13: Audit Checker Unit Tests (36 files + 7 property files)

Per D#53, D#59, D#77: one test file per checker in existing `__tests__/`
directories. Per D#75, D#78: property tests co-located.

### Step 13a: Doc Ecosystem Audit Checkers (5 unit + 1 property)

Create in `.claude/skills/doc-ecosystem-audit/scripts/checkers/__tests__/`:

| Test File                          | Target                                    | Key Assertions                                             |
| ---------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `index-registry-health.test.js`    | `index-registry-health.js` (526 lines)    | Index sync validation, orphan detection, metadata accuracy |
| `link-reference-integrity.test.js` | `link-reference-integrity.js` (541 lines) | Internal links, cross-doc deps, anchor resolution          |
| `content-quality.test.js`          | `content-quality.js` (476 lines)          | Header compliance, formatting, freshness scoring           |
| `generation-pipeline.test.js`      | `generation-pipeline.js` (421 lines)      | Index correctness, doc optimizer, pre-commit checks        |
| `coverage-completeness.test.js`    | `coverage-completeness.js` (471 lines)    | Coverage calculation, agent refs, README checks            |
| `doc-checkers.property.test.js`    | All 5 checkers                            | `check()` → score ∈ [0,100], valid findings schema         |

Each unit test (per D#61, risk-proportional — all >400 lines → full template):

- Happy path with realistic mock filesystem
- Empty/missing input files
- Malformed data (corrupt JSONL, broken markdown)
- Scoring boundary tests
- Finding ID format validation (`SCA-` prefix)

### Step 13b: Hook Ecosystem Audit Checkers (6 unit + 1 property)

Create in `.claude/skills/hook-ecosystem-audit/scripts/checkers/__tests__/`:

| Test File                        | Target                      | Lines           |
| -------------------------------- | --------------------------- | --------------- |
| `config-health.test.js`          | `config-health.js`          | 590             |
| `code-quality-security.test.js`  | `code-quality-security.js`  | 712             |
| `precommit-pipeline.test.js`     | `precommit-pipeline.js`     | 774             |
| `functional-correctness.test.js` | `functional-correctness.js` | 554             |
| `state-integration.test.js`      | `state-integration.js`      | 801             |
| `cicd-pipeline.test.js`          | `cicd-pipeline.js`          | 766             |
| `hook-checkers.property.test.js` | All 6 checkers              | score ∈ [0,100] |

### Step 13c: PR Ecosystem Audit Checkers (5 unit + 1 property)

Create in `.claude/skills/pr-ecosystem-audit/scripts/checkers/__tests__/`:

- `process-compliance.test.js` (789 lines)
- `feedback-integration.test.js` (537 lines)
- `pattern-lifecycle.test.js` (592 lines)
- `effectiveness-metrics.test.js` (568 lines)
- `data-state-health.test.js` (778 lines)
- `pr-checkers.property.test.js`

### Step 13d: Script Ecosystem Audit Checkers (5 unit + 1 property)

Create in `.claude/skills/script-ecosystem-audit/scripts/checkers/__tests__/`:

- `module-consistency.test.js` (452 lines)
- `safety-error-handling.test.js` (550 lines)
- `registration-reachability.test.js` (416 lines)
- `code-quality.test.js` (456 lines)
- `testing-reliability.test.js` (407 lines)
- `script-checkers.property.test.js`

### Step 13e: Session Ecosystem Audit Checkers (5 unit + 1 property)

Create in `.claude/skills/session-ecosystem-audit/scripts/checkers/__tests__/`:

- `lifecycle-management.test.js` (726 lines)
- `state-persistence.test.js` (762 lines)
- `compaction-resilience.test.js` (690 lines)
- `cross-session-safety.test.js` (426 lines)
- `integration-config.test.js` (535 lines)
- `session-checkers.property.test.js`

### Step 13f: Skill Ecosystem Audit Checkers (5 unit + 1 property)

Create in `.claude/skills/skill-ecosystem-audit/scripts/checkers/__tests__/`:

- `structural-compliance.test.js` (430 lines)
- `cross-reference-integrity.test.js` (533 lines)
- `coverage-consistency.test.js` (488 lines)
- `staleness-drift.test.js` (467 lines)
- `agent-orchestration.test.js` (449 lines)
- `skill-checkers.property.test.js`

### Step 13g: TDMS Ecosystem Audit Checkers (5 unit + 1 property)

Create in `.claude/skills/tdms-ecosystem-audit/scripts/checkers/__tests__/`:

- `pipeline-correctness.test.js` (569 lines)
- `data-quality-dedup.test.js` (977 lines)
- `file-io-safety.test.js` (631 lines)
- `roadmap-integration.test.js` (584 lines)
- `metrics-reporting.test.js` (888 lines)
- `tdms-checkers.property.test.js`

### Step 13h: Audit Lib Property Tests (7 files)

Create `__tests__/` directories in each audit's `scripts/lib/`:

| Audit                   | File                                     | Tests                        |
| ----------------------- | ---------------------------------------- | ---------------------------- |
| doc-ecosystem-audit     | `lib/__tests__/scoring.property.test.js` | score ∈ [0,100], grade valid |
| hook-ecosystem-audit    | `lib/__tests__/scoring.property.test.js` | score ∈ [0,100], grade valid |
| pr-ecosystem-audit      | `lib/__tests__/scoring.property.test.js` | score ∈ [0,100], grade valid |
| script-ecosystem-audit  | `lib/__tests__/scoring.property.test.js` | score ∈ [0,100], grade valid |
| session-ecosystem-audit | `lib/__tests__/scoring.property.test.js` | score ∈ [0,100], grade valid |
| skill-ecosystem-audit   | `lib/__tests__/scoring.property.test.js` | score ∈ [0,100], grade valid |
| tdms-ecosystem-audit    | `lib/__tests__/scoring.property.test.js` | score ∈ [0,100], grade valid |

**Done when:** 36 checker unit test files + 7 checker property test files + 7
audit lib property test files = 50 files. All pass. **Depends on:** Step 12e
(npm scripts)

---

## Step 14: Root Script Tests (57 files + 4 property files)

Per D#54, D#60, D#61: all 57 untested root scripts, centralized in
`tests/scripts/`, risk-proportional depth.

### Step 14a: Large Root Scripts (>500 lines, full template — ~15 files)

| Test File                                | Target                            | Lines | Key Focus                                  |
| ---------------------------------------- | --------------------------------- | ----- | ------------------------------------------ |
| `aggregate-audit-findings.test.ts`       | aggregate-audit-findings.js       | 1,954 | JSONL aggregation, dedup, output format    |
| `analyze-learning-effectiveness.test.ts` | analyze-learning-effectiveness.js | 1,326 | Metric extraction, trend computation       |
| `check-pattern-compliance.test.ts`       | check-pattern-compliance.js       | 2,213 | Pattern detection, false positive handling |
| `check-review-needed.test.ts`            | check-review-needed.js            | 1,057 | Threshold computation, category matching   |
| `generate-documentation-index.test.ts`   | generate-documentation-index.js   | 1,079 | Category assignment, dependency tracking   |
| `sync-reviews-to-jsonl.test.ts`          | sync-reviews-to-jsonl.js          | 1,152 | Markdown→JSONL parsing, numbering          |
| `run-consolidation.test.ts`              | run-consolidation.js              | 825   | Pattern merging, state management          |
| `validate-audit.test.ts`                 | validate-audit.js                 | 1,027 | False positive DB, evidence checking       |
| `archive-reviews.test.ts`                | archive-reviews.js                | 816   | Date parsing, file splitting               |
| `archive-doc.test.ts`                    | archive-doc.js                    | 771   | Metadata preservation, cross-ref           |
| `check-review-archive.test.ts`           | check-review-archive.js           | 738   | Archive integrity, gap detection           |
| `check-external-links.test.ts`           | check-external-links.js           | 701   | HTTP validation, rate limiting (msw)       |
| `check-doc-placement.test.ts`            | check-doc-placement.js            | 657   | Tier rules, placement validation           |
| `log-override.test.ts`                   | log-override.js                   | 530   | Override logging, accountability           |
| `check-propagation.test.ts`              | check-propagation.js              | 546   | Duplicate detection, fix propagation       |

Each: describe per exported function, happy path, error path, boundary, mock
fs/child_process (per D#71).

### Step 14b: Medium Root Scripts (100-500 lines, minimal — ~32 files)

| Test File                            | Target                        | Lines |
| ------------------------------------ | ----------------------------- | ----- |
| `check-content-accuracy.test.ts`     | check-content-accuracy.js     | 526   |
| `check-cross-doc-deps.test.ts`       | check-cross-doc-deps.js       | 528   |
| `assign-review-tier.test.ts`         | assign-review-tier.js         | 498   |
| `log-session-activity.test.ts`       | log-session-activity.js       | 489   |
| `validate-canon-schema.test.ts`      | validate-canon-schema.js      | 478   |
| `check-document-sync.test.ts`        | check-document-sync.js        | 461   |
| `security-check.test.ts`             | security-check.js             | 463   |
| `normalize-canon-ids.test.ts`        | normalize-canon-ids.js        | 435   |
| `repair-archives.test.ts`            | repair-archives.js            | 435   |
| `suggest-pattern-automation.test.ts` | suggest-pattern-automation.js | 426   |
| `audit-s0-promotions.test.ts`        | audit-s0-promotions.js        | 416   |
| `place-unassigned-debt.test.ts`      | place-unassigned-debt.js      | 357   |
| `search-capabilities.test.ts`        | search-capabilities.js        | 357   |
| `check-session-gaps.test.ts`         | check-session-gaps.js         | 323   |
| `check-pattern-sync.test.ts`         | check-pattern-sync.js         | 310   |
| `check-hook-health.test.ts`          | check-hook-health.js          | 306   |
| `check-roadmap-health.test.ts`       | check-roadmap-health.js       | 292   |
| `hook-analytics.test.ts`             | hook-analytics.js             | 282   |
| `check-roadmap-hygiene.test.ts`      | check-roadmap-hygiene.js      | 278   |
| `reset-audit-triggers.test.ts`       | reset-audit-triggers.js       | 274   |
| `session-end-commit.test.ts`         | session-end-commit.js         | 267   |
| `verify-skill-usage.test.ts`         | verify-skill-usage.js         | 264   |
| `lighthouse-audit.test.ts`           | lighthouse-audit.js           | 255   |
| `validate-skill-config.test.ts`      | validate-skill-config.js      | 252   |
| `compute-changelog-metrics.test.ts`  | compute-changelog-metrics.js  | 229   |
| `check-triggers.test.ts`             | check-triggers.js             | 576   |
| `check-agent-compliance.test.ts`     | check-agent-compliance.js     | 195   |
| `append-hook-warning.test.ts`        | append-hook-warning.js        | 190   |
| `generate-skill-registry.test.ts`    | generate-skill-registry.js    | 164   |
| `validate-phase-completion.test.ts`  | validate-phase-completion.js  | 156   |
| `check-doc-headers.test.ts`          | check-doc-headers.js          | 269   |
| `check-backlog-health.test.ts`       | check-backlog-health.js       | 343   |

Each: 3-5 test cases, core logic + error path + edge case.

### Step 14c: Small Root Scripts (<100 lines, smoke test — ~10 files)

| Test File                                    | Target                             | Lines |
| -------------------------------------------- | ---------------------------------- | ----- |
| `cleanup-alert-sessions.test.ts`             | cleanup-alert-sessions.js          | 65    |
| `promote-patterns.test.ts`                   | promote-patterns.js                | 47    |
| `generate-claude-antipatterns.test.ts`       | generate-claude-antipatterns.js    | 38    |
| `generate-fix-template-stubs.test.ts`        | generate-fix-template-stubs.js     | 38    |
| `seed-commit-log.test.ts`                    | seed-commit-log.js                 | 486   |
| `generate-detailed-sonar-report.test.ts`     | generate-detailed-sonar-report.js  | 562   |
| `test-hooks.test.ts`                         | test-hooks.js                      | 634   |
| V1 parity: `v1-parity-consolidation.test.ts` | run-consolidation.v1.js vs .js     | 824   |
| V1 parity: `v1-parity-sync-reviews.test.ts`  | sync-reviews-to-jsonl.v1.js vs .js | 1,108 |

V1 parity tests (per D#65): run both v1 and v2 with same mock input, compare
output shapes.

Note: `seed-commit-log.js` (486), `generate-detailed-sonar-report.js` (562), and
`test-hooks.js` (634) exceed 100 lines but are listed here because they're
primarily CLI wrappers. Apply medium template (3-5 test cases) for these.

### Step 14d: Root Script Property Tests (4 files)

Per D#75: property tests for bounded-output functions in `scripts/lib/`:

| File                                                       | Target                   | Property                             |
| ---------------------------------------------------------- | ------------------------ | ------------------------------------ |
| `tests/scripts/lib/normalize-category.property.test.ts`    | normalize-category.js    | output ∈ valid category set          |
| `tests/scripts/lib/normalize-file-path.property.test.ts`   | normalize-file-path.js   | always relative, no `..`             |
| `tests/scripts/lib/generate-content-hash.property.test.ts` | generate-content-hash.js | always 64-char hex                   |
| `tests/scripts/debt/normalize-all.property.test.ts`        | normalize-all.js         | severity ∈ {S0-S3}, effort ∈ {E0-E3} |

**Done when:** 57 root script tests + 2 v1 parity tests + 4 property tests = 63
files. All pass. **Depends on:** Step 12e

---

## Step 15: Debt Pipeline Tests (28 files)

Per D#56, D#60: all 28 untested debt scripts.

Create in `tests/scripts/debt/`:

### Step 15a: Large Debt Scripts (>500 lines, full template — ~5 files)

| Test File                       | Target                   | Lines | Key Focus                                   |
| ------------------------------- | ------------------------ | ----- | ------------------------------------------- |
| `sync-sonarcloud.test.ts`       | sync-sonarcloud.js       | 922   | API mocking (msw), response parsing         |
| `verify-resolutions.test.ts`    | verify-resolutions.js    | 667   | Git history correlation, status transitions |
| `sprint-status.test.ts`         | sprint-status.js         | 548   | Multi-source aggregation, dashboard output  |
| `resolve-bulk.test.ts`          | resolve-bulk.js          | 499   | Batch operations, rollback safety           |
| `categorize-and-assign.test.ts` | categorize-and-assign.js | 485   | Sprint assignment rules, Grand Plan routing |

### Step 15b: Medium Debt Scripts (100-500 lines — ~23 files)

All remaining debt scripts: `analyze-placement.js` (362),
`assign-roadmap-refs.js` (312), `backfill-hashes.js` (168),
`check-phase-status.js` (122), `clean-intake.js` (416), `escalate-deferred.js`
(248), `extract-audits.js` (227), `extract-context-debt.js` (334),
`extract-reviews.js` (266), `extract-roadmap-debt.js` (469),
`extract-scattered-debt.js` (439), `generate-grand-plan.js` (457),
`ingest-cleaned-intake.js` (259), `intake-manual.js` (372),
`intake-pr-deferred.js` (314), `process-review-needed.js` (308),
`reconcile-roadmap.js` (421), `resolve-item.js` (408), `reverify-resolved.js`
(409), `sprint-complete.js` (435), `sprint-intake.js` (366), `sprint-wave.js`
(238), `sync-roadmap-refs.js` (179)

**Done when:** 28 debt test files. All pass. **Depends on:** Step 12e

---

## Step 16: Audit & Multi-AI Script Tests (12 files)

Per D#56, D#60.

### Step 16a: Audit Scripts (8 files)

Create in `tests/scripts/audit/`:

- `audit-health-check.test.ts` (450 lines)
- `compare-audits.test.ts` (755 lines — full template)
- `count-commits-since.test.ts` (295 lines)
- `generate-results-index.test.ts` (305 lines)
- `track-resolutions.test.ts` (463 lines)
- `transform-jsonl-schema.test.ts` (758 lines — full template)
- `validate-audit-integration.test.ts` (1,243 lines — full template)
- `validate-templates.test.ts` (436 lines)

### Step 16b: Multi-AI Scripts (4 files)

Create in `tests/scripts/multi-ai/`:

- `extract-agent-findings.test.ts` (221 lines)
- `fix-schema.test.ts` (616 lines — full template)
- `normalize-format.test.ts` (1,018 lines — full template)
- `unify-findings.test.ts` (721 lines — full template)

**Done when:** 12 files. All pass. **Depends on:** Step 12e

---

## Step 17: Lib, Planning & Remaining Script Tests (18 files)

### Step 17a: Lib Scripts (8 files)

Create in `tests/scripts/lib/`:

- `ai-pattern-checks.test.ts` (552 lines — full template)
- `generate-content-hash.test.ts` (38 lines — smoke)
- `normalize-category.test.ts` (28 lines — smoke)
- `normalize-file-path.test.ts` (61 lines — smoke)
- `read-jsonl.test.ts` (44 lines — smoke)
- `safe-fs.test.ts` (496 lines — verify existing coverage, expand if needed)
- `validate-paths.test.ts` (227 lines)
- `validate-skip-reason.test.ts` (69 lines — smoke)

### Step 17b: Planning Scripts (5 files)

Create in `tests/scripts/planning/`:

- `backfill-tenet-evidence.test.ts` (151 lines)
- `decompose-state.test.ts` (120 lines)
- `generate-decisions.test.ts` (454 lines)
- `generate-discovery-record.test.ts` (222 lines)
- `validate-jsonl-md-sync.test.ts` (91 lines — smoke)

### Step 17c: Velocity, Secrets, Health (3 files)

- `tests/scripts/velocity/generate-report.test.ts` (226 lines)
- `tests/scripts/secrets/decrypt-secrets.test.ts` (270 lines)
- `tests/scripts/health/run-health-check.test.ts` (185 lines — verify existing,
  expand)

### Step 17d: Hook Scripts (2 files)

- `tests/hooks/gsd-context-monitor.test.ts` (141 lines)
- `tests/hooks/state-utils.test.ts` (229 lines)

**Done when:** 18 files. All pass. **Depends on:** Step 12e

---

## Step 18: Review System Tests (9 files)

Per D#66.

### Step 18a: Review Script Tests (8 files)

Create in `scripts/reviews/__tests__/`:

- `build-enforcement-manifest.test.ts`
- `completeness.test.ts`
- `enforcement-manifest.test.ts`
- `generate-claude-antipatterns.test.ts`
- `generate-fix-template-stubs.test.ts`
- `promote-patterns.test.ts`
- `verify-enforcement-manifest.test.ts`
- `read-jsonl.test.ts` / `write-jsonl.test.ts` (may consolidate)

### Step 18b: Review Schema Consolidated Test (1 file)

Create `scripts/reviews/__tests__/schemas.test.ts`:

- Tests all 7 schema files (deferred-item, index, invocation, retro, review,
  shared, warning)
- Valid inputs pass, invalid inputs fail, edge cases handled

**Done when:** 9 review test files. All pass. **Depends on:** Step 12e

---

## Step 19: Skill Utility Script Tests (1 file)

Create `tests/scripts/health/run-ecosystem-health.test.ts`:

- Dashboard output format
- Dimension drill-down
- Warning integration
- Trend computation

**Done when:** 1 file. Passes. **Depends on:** Step 12e

---

**PHASE 6 EXIT GATE:** All ~181 new test files created and passing. `npm test`
runs all existing + new tests with 0 failures.

---

# PHASE 7: TESTING COVERAGE VERIFICATION

---

## Step 20: Full Verification

### Step 20a: Registry & Baseline Verification

- Run `npm run tests:registry` — regenerate registry
- Run `node scripts/generate-test-registry.js --check-coverage` — verify all new
  tests discovered, baseline shrunk to 0 (or near 0)
- Verify no stale entries in registry

### Step 20b: Full Test Suite

- `npm test` — all tests pass (existing ~1,594 + ~181 new)
- `npm run test:checkers` — audit checker tests pass
- `npm run test:infra` — infrastructure tests pass
- `npm run test:pipeline` — pipeline tests pass
- `npm run test:health` — health tests pass
- `npm run test:hooks` — hook tests pass
- `npm run test:debt` — debt tests pass
- `npm run test:audits` — ecosystem audit self-tests pass
- `npm run test:coverage` — coverage threshold still met (65%)

### Step 20c: Auto-Detection Smoke Test

- Create a temp script in `scripts/test-temp-untested.js`
- Commit: verify pre-commit warning fires
- Push: verify CI gate blocks (file not in baseline, no test)
- Delete temp script, verify clean

### Step 20d: Code Review

Run code-reviewer agent on all Phase 5-7 new/modified files:

- Security: no command injection in test scripts
- Patterns: error sanitization, path traversal guards
- Quality: consistent test patterns, no duplicate logic
- **All findings MUST be fixed before merge**

### Step 20e: Decision Coverage Audit

Cross-check D#53-81 against implemented artifacts:

- Every decision maps to a concrete file or configuration change
- No decisions silently skipped
- Document any deviations with rationale

### Step 20f: Update Documentation

- Update `docs/agent_docs/TESTING_SYSTEM.md` — add new test areas, update
  coverage map, add auto-detection section
- Update `DOCUMENTATION_INDEX.md` if needed
- Update `.planning/ecosystem-expansion/PLAN.md` — mark Phase 5-7 complete

**Done when:** Registry clean, baseline empty or near-empty, all tests pass, CI
gate works, code review clean, decisions verified, documentation updated.
**Depends on:** Steps 12-19

---

**PHASE 7 EXIT GATE:** Complete internal testing coverage achieved.
Auto-detection prevents future gaps. Ready to commit.

---

## Phase 5-7 Parallelization Guide

```
PHASE 5:
  Step 12a: Fix registry scanner (sequential)
    |
    +-- Step 12b: Create baseline (needs 12a)
    +-- Step 12e: npm scripts + tsconfig (independent)
    +-- Step 12f: Investigate orphan test (independent)
         |
         +-- Step 12c: Pre-commit hook (needs 12a)
         +-- Step 12d: CI gate (needs 12a, 12b)

PHASE 6:
  Steps 13-19 ALL run in parallel via subagents:
    +-- Step 13: Audit checker tests (1 subagent)
    +-- Step 14: Root script tests (1 subagent)
    +-- Step 15: Debt pipeline tests (1 subagent)
    +-- Step 16: Audit + multi-ai tests (1 subagent)
    +-- Step 17: Lib + planning + remaining (1 subagent)
    +-- Step 18: Review system tests (1 subagent)
    +-- Step 19: Skill utility tests (1 subagent)

PHASE 7:
  Step 20: Verification (sequential, needs all of Phase 6)
```

**Phase 6 maximum parallelism:** 7 concurrent subagents.

---

## Phase 5-7 Execution Routing

Per D#76: three-phase execution.

**Phase 5 dispatch:** Main context — infrastructure changes need coordination.

**Phase 6 dispatch:** 7 parallel subagents via Agent tool:

- Subagent 1: Step 13 (audit checkers — 50 files, JS)
- Subagent 2: Step 14 (root scripts — 63 files, TS)
- Subagent 3: Step 15 (debt pipeline — 28 files, TS)
- Subagent 4: Step 16 (audit + multi-ai — 12 files, TS)
- Subagent 5: Step 17 (lib + planning + remaining — 18 files, TS)
- Subagent 6: Step 18 (review system — 9 files, TS)
- Subagent 7: Step 19 (skill utility — 1 file, TS)

Subagent 7 is tiny — may combine with Subagent 6.

**Phase 7 dispatch:** Main context — verification needs judgment.
