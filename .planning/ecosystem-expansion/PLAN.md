<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-08
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Implementation Plan: Ecosystem Expansion

## Summary

Create the 8th ecosystem audit (`health-ecosystem-audit`) for the health
monitoring system, implement ~314 new test files across all infrastructure
areas, build a test registry tracking ~380+ validation sources, add CI coverage
enforcement, and produce human-readable testing documentation.

**Decisions:** See DECISIONS.md (33 decisions) **Effort Estimate:** XL
(multi-session, heavy parallelization)

## Files to Create/Modify

### New Files (~330)

1. **Health ecosystem audit skill** (~15 files)
   - `.claude/skills/health-ecosystem-audit/SKILL.md`
   - `.claude/skills/health-ecosystem-audit/REFERENCE.md`
   - `.claude/skills/health-ecosystem-audit/scripts/run-health-ecosystem-audit.js`
   - `.claude/skills/health-ecosystem-audit/scripts/lib/benchmarks.js`
   - `.claude/skills/health-ecosystem-audit/scripts/lib/scoring.js`
   - `.claude/skills/health-ecosystem-audit/scripts/lib/state-manager.js`
   - `.claude/skills/health-ecosystem-audit/scripts/lib/patch-generator.js`
   - `.claude/skills/health-ecosystem-audit/scripts/checkers/checker-infrastructure.js`
   - `.claude/skills/health-ecosystem-audit/scripts/checkers/scoring-pipeline.js`
   - `.claude/skills/health-ecosystem-audit/scripts/checkers/data-persistence.js`
   - `.claude/skills/health-ecosystem-audit/scripts/checkers/consumer-integration.js`
   - `.claude/skills/health-ecosystem-audit/scripts/checkers/coverage-completeness.js`
   - `.claude/skills/health-ecosystem-audit/scripts/checkers/alert-system.js`
   - `.claude/skills/health-ecosystem-audit/scripts/__tests__/checker-regression.test.js`
   - `.claude/skills/health-ecosystem-audit/scripts/__tests__/health-audit-integration.test.js`

2. **Test infrastructure** (~5 files)
   - `scripts/generate-test-registry.js`
   - `data/ecosystem-v2/test-registry.jsonl`
   - `docs/agent_docs/TESTING_SYSTEM.md`
   - `tests/scripts/health/checkers/` (directory)
   - `tests/hooks/` (directory)

3. **~314 test files** (see Step-by-Step below)

### Modified Files (~20)

1. `comprehensive-ecosystem-audit/SKILL.md` — add health #8 to Stage 1
2. `.claude/COMMAND_REFERENCE.md` — register skill
3. `.claude/skills/SKILL_INDEX.md` — add entry
4. `.claude/skills/alerts/SKILL.md` — ownership + Test Health category
5. `.claude/skills/ecosystem-health/SKILL.md` — ownership
6. `.github/workflows/ci.yml` — coverage thresholds + test dirs
7. `package.json` — fast-check, npm scripts, tests:registry
8. `tsconfig.test.json` — new test directories
9. `.claude/hooks/session-start.js` — wire mid-session-alerts
10. `DOCUMENTATION_INDEX.md` — add TESTING_SYSTEM.md
11. 7× ecosystem audit SKILL.md — reference **tests**/
12. 7× ecosystem audit REFERENCE.md — test patterns section

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
  "test:health": "node --test tests/scripts/health/**/*.test.js scripts/health/**/*.test.js",
  "test:hooks": "node --test dist-tests/tests/hooks/**/*.test.js",
  "test:debt": "node --test dist-tests/tests/scripts/debt/**/*.test.js",
  "test:audits": "node --test .claude/skills/*/scripts/__tests__/*.test.js"
}
```

**1c. Update `tsconfig.test.json`:** Add `tests/hooks/`, `tests/scripts/debt/`,
`tests/scripts/health/` to includes.

**1d. Update `.github/workflows/ci.yml`:**

- Add overall coverage threshold: 65% line coverage (fail CI if below)
- Add per-file coverage for changed files: 80% (fail CI if new/modified files
  below)
- Add new test directories to test command glob

**Done when:** `npm install` succeeds, `npm test` still passes, CI config valid.
**Depends on:** None **Triggers:** All subsequent steps

---

## Step 2: Health System Tests (Phase 1 — Informs Ecosystem Design)

Create tests for the health monitoring system. This MUST complete before the
ecosystem audit skill is built (Step 8), because the audit needs to verify these
tests exist and pass.

**Steps 2a-2f can run in parallel.**

### Step 2a: Health Checker Unit Tests

Create unit tests for all 8 untested checkers in
`tests/scripts/health/checkers/`:

| Test File                        | Target                                              | Key Assertions                                                |
| -------------------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `code-quality.test.ts`           | `scripts/health/checkers/code-quality.js`           | Metric extraction from tsc/eslint output, scoring, edge cases |
| `documentation.test.ts`          | `scripts/health/checkers/documentation.js`          | File count, staleness calc, freshness scoring                 |
| `hook-pipeline.test.ts`          | `scripts/health/checkers/hook-pipeline.js`          | JSONL parsing, time-binned filtering, 12 metrics              |
| `learning-effectiveness.test.ts` | `scripts/health/checkers/learning-effectiveness.js` | Regex extraction from LEARNING_METRICS.md                     |
| `pattern-enforcement.test.ts`    | `scripts/health/checkers/pattern-enforcement.js`    | warned-files.json parsing, hotspot detection                  |
| `security.test.ts`               | `scripts/health/checkers/security.js`               | npm audit JSON parsing, vulnerability scoring                 |
| `session-management.test.ts`     | `scripts/health/checkers/session-management.js`     | Git output parsing, session gap calc                          |
| `test-coverage.test.ts`          | `scripts/health/checkers/test-coverage.js`          | JSONL result parsing, staleness                               |

Per Decision #6, co-located at `tests/scripts/health/checkers/`.

Each test file includes:

- Unit tests for metric extraction functions
- Boundary tests (empty output, missing files, malformed data)
- Error path tests (tool not found, timeout)
- Property-based tests where applicable (scoring always 0-100)

**Done when:** All 8 checker test files pass. Each checker has ≥5 test cases
covering happy path, edge cases, and error paths. **Depends on:** Step 1

### Step 2b: Health Lib Unit Tests

Create/expand tests for health library modules in `tests/scripts/health/lib/`:

| Test File            | Target                             | Key Assertions                                                         |
| -------------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| `composite.test.ts`  | `scripts/health/lib/composite.js`  | Weight sum = 1.0, no_data handling, NaN safety                         |
| `dimensions.test.ts` | `scripts/health/lib/dimensions.js` | All 13 dimensions map correctly, getDimensionDetail edge cases         |
| `scoring.test.ts`    | `scripts/health/lib/scoring.js`    | scoreMetric directions, computeGrade boundaries (79.5→?), computeTrend |
| `health-log.test.ts` | `scripts/health/lib/health-log.js` | Append atomicity, read with corrupt entries, trend from empty log      |

Property-based tests (`fast-check`) for:

- `scoreMetric(value, benchmark, direction)` → score always in [0, 100]
- `compositeScore(scores, weights)` → score always in [0, 100]
- `computeGrade(score)` → always returns valid grade string

**Done when:** All lib test files pass with property-based coverage. **Depends
on:** Step 1

### Step 2c: Health Integration Tests

Expand existing `tests/integration/health-pipeline.integration.test.js`:

- All 10 checkers run and produce valid output structure
- Composite score computed correctly from real checker data
- Warning lifecycle integration: health score drop → alert → warning created
- Add `tests/integration/health-alerts-warnings-lifecycle.integration.test.js`

**Done when:** Integration tests exercise full health→alerts→warnings flow.
**Depends on:** Step 1

### Step 2d: Health Performance Budget Tests

Add to `tests/perf/budget.perf.test.js`:

- Quick mode completes in <10s
- Full mode completes in <60s
- Individual checker timeout: <15s each

**Done when:** Budget assertions pass on current hardware. **Depends on:** Step
1

### Step 2e: Health Regression Tests

Create `tests/scripts/health/regression.test.ts`:

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

- `consolidate-all.js` run twice → identical MASTER_DEBT.jsonl
- `dedup-multi-pass.js` run twice → zero new dedup removals
- `sync-deduped.js` run twice → no changes

**Done when:** Pipeline produces identical output on re-run. **Depends on:**
Step 1

### Step 3c: Debt Pipeline E2E Test

Create `tests/e2e/debt-pipeline.e2e.test.js`:

- Full pipeline: intake → normalize → dedup → generate-views → generate-metrics
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

### Step 4c: Hook Global Tests

`tests/hooks/global/`:

- `gsd-check-update.test.ts`
- `statusline.test.ts`

**Done when:** All 22 hook test files pass. Each hook has ≥3 test cases.
**Depends on:** Step 1 **Can run in parallel with:** Steps 3, 5, 6

---

## Step 5: Ecosystem Audit Tests

Create test suites for all 7 existing ecosystem audit skills, following the
hook-ecosystem-audit pattern.

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

**Done when:** All 7 ecosystem audits have 4 test files each. All pass.
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
2. Test file location map (area → directory → test types)
3. Ownership matrix (ecosystem audit → owned tests)
4. Invocation guide (npm scripts, CI, audit-triggered)
5. Coverage map (tested vs untested, by area)
6. Test type glossary (14 types, what each means in this repo)
7. Adding new tests guide (placement, naming, patterns)
8. Test result flow diagram (CI → /alerts → health scoring)
9. Test registry documentation (8 source types, how to register)

**Done when:** TESTING_SYSTEM.md is comprehensive, accurate, and referenced from
DOCUMENTATION_INDEX.md. **Depends on:** Steps 2-6, 7a

---

## Step 8: Health Ecosystem Audit Skill

Build the ecosystem audit skill. This step depends on Steps 2 (health tests
exist) and Steps 3-6 (broader test coverage exists for D5 verification).

### Step 8a: Skill Structure

Create directory and core files, forked from hook-ecosystem-audit:

- `SKILL.md` — 6 domains, 25 categories, interactive walkthrough with deep-plan
  Q&A format, live test execution in D5
- `REFERENCE.md` — templates, schemas, checker development guide, benchmarks
  table, dashboard template
- `scripts/lib/benchmarks.js` — 25 category weights summing to 1.0
- `scripts/lib/scoring.js` — forked from hook-ecosystem-audit
- `scripts/lib/state-manager.js` — forked from hook-ecosystem-audit
- `scripts/lib/patch-generator.js` — auto-fix suggestions

### Step 8b: Domain Checkers

Create 6 checker files per Decision #3:

| Checker                     | Domain | Categories | Key Checks                                                                             |
| --------------------------- | ------ | ---------- | -------------------------------------------------------------------------------------- |
| `checker-infrastructure.js` | D1     | 5          | Command robustness, file I/O, benchmarks, edge cases, error propagation                |
| `scoring-pipeline.js`       | D2     | 4          | Weight validation, missing data, direction consistency, dimension mapping              |
| `data-persistence.js`       | D3     | 5          | JSONL atomicity, rotation, schema, timestamps, corrupt entries                         |
| `consumer-integration.js`   | D4     | 4          | Output versioning, timeouts, duplicate logic, downstream errors                        |
| `coverage-completeness.js`  | D5     | 4          | Checker aggregation, tool availability, **live test execution**, registry completeness |
| `alert-system.js`           | D6     | 3          | Cooldown management, warning lifecycle, degradation detection                          |

**D5 coverage-completeness.js** is special (per Decision #15):

- Runs `npm run test:health` live during audit
- Reads c8 coverage data (fresh or from CI with staleness guard per Decision
  #20)
- Checks test-registry.jsonl for undocumented tests
- Scores based on pass rate, coverage %, and completeness

### Step 8c: Run Script (Orchestrator)

Create `run-health-ecosystem-audit.js`:

- Loads all 6 checkers
- Computes composite score with Decision #11 weights
- v2 JSON output (same schema as other ecosystem audits)
- CLI modes: `--check`, `--summary`, `--batch`, `--save-baseline`
- Finding deduplication
- Trend computation from history JSONL

### Step 8d: Audit Self-Tests

Create `.claude/skills/health-ecosystem-audit/scripts/__tests__/`:

- `checker-regression.test.js` — all 6 checkers run, scores valid
- `health-audit-integration.test.js` — full audit run, v2 JSON schema valid

**Done when:**
`node .claude/skills/health-ecosystem-audit/scripts/run-health-ecosystem-audit.js --summary`
runs and produces valid v2 JSON. All self-tests pass. **Depends on:** Steps 2-6,
7a

---

## Step 9: Wire Mid-Session Alerts

Per Decision #19, wire the orphaned `mid-session-alerts.js` into the hook
system.

- Update `.claude/hooks/session-start.js` to call `runMidSessionChecks()` after
  post-commit events (or create a new post-commit hook)
- Verify cooldown system works (1h per alert type)
- Verify alerts surface via warning lifecycle

**Done when:** Mid-session alerts fire on score degradation. Cooldown prevents
alert fatigue. **Depends on:** Step 2c (health integration tests verify the
flow)

---

## Step 10: Ownership & Registration Updates

### Step 10a: Ownership Transfers

Update `/alerts` SKILL.md and `/ecosystem-health` SKILL.md:

- Add ownership reference: "Part of health-ecosystem-audit ecosystem"
- `/alerts`: Add "Test Health" category (per Decision #21)

### Step 10b: Ecosystem Registration

- `comprehensive-ecosystem-audit/SKILL.md` — add health to Stage 1 (5+3)
- `.claude/COMMAND_REFERENCE.md` — add `/health-ecosystem-audit`
- `.claude/skills/SKILL_INDEX.md` — add entry
- `DOCUMENTATION_INDEX.md` — add TESTING_SYSTEM.md

### Step 10c: Existing Ecosystem Audit Updates

For all 7 existing ecosystem audits:

- Update SKILL.md to reference their new `__tests__/` directory
- Update REFERENCE.md with test patterns section

**Done when:** All registration files updated. `/health-ecosystem-audit` appears
in comprehensive orchestrator. **Depends on:** Step 8

---

## Step 11: Audit Checkpoint

Run code-reviewer agent on all new/modified files.

Focus areas:

- Security: no command injection in test scripts, no hardcoded paths
- Patterns: error sanitization, path traversal guards, exec /g flag
- Quality: consistent test patterns, no duplicate logic
- Coverage: verify ~314 test files actually created and passing

**Done when:** All code-reviewer findings addressed or tracked in TDMS.
**Depends on:** All implementation steps (1-10)

---

## Parallelization Guide

```
Step 1: Infrastructure (sequential — everything depends on this)
  │
  ├── Step 2a-2f: Health tests (parallel within)
  ├── Step 3a-3c: Debt tests (parallel within)
  ├── Step 4a-4c: Hook tests (parallel within)
  ├── Step 5a-5g: Ecosystem audit tests (parallel within)
  └── Step 6a-6c: Root script tests (parallel within)
       │
       │  (Steps 2-6 all run in parallel with each other)
       │
       ├── Step 7a: Test registry (needs Steps 2-6 complete)
       ├── Step 7b: Pre-commit hook (needs 7a)
       └── Step 7c: Documentation (needs Steps 2-6, 7a)
            │
            └── Step 8: Health ecosystem audit skill (needs Steps 2-6, 7a)
                 │
                 ├── Step 9: Wire mid-session alerts (needs 2c)
                 └── Step 10: Registration updates (needs 8)
                      │
                      └── Step 11: Audit checkpoint (needs all)
```

**Maximum parallelism:** Steps 2-6 = 5 concurrent workstreams, each with 2-7
internal parallel tasks. With subagents, up to ~25 parallel tasks.

---

## Execution Routing

Per Decision #8: single plan, parallel subagent execution.

**Recommended dispatch:**

- **6 subagents for Steps 2-6** (one per area)
- **1 subagent for Step 7** (after 2-6 complete)
- **1 subagent for Step 8** (after 7 complete)
- **Sequential for Steps 9-11** (low parallelism, high coordination)

Total: 8 subagent dispatches across 3 waves.
