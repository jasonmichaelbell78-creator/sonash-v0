<!-- prettier-ignore-start -->
**Document Version:** 3.0
**Last Updated:** 2026-03-10
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Decision Record: Ecosystem Expansion

**Date:** 2026-03-08 (Phase 1), 2026-03-09 (Phase 2), 2026-03-10 (Phase 3)
**Questions Asked:** 28 (+3 follow-ups, +Pass 0/2/3 research) + 19 Phase 2 skill
design questions + 29 Phase 3 testing coverage questions **Decisions Captured:**
81

## Decisions

| #   | Decision                          | Choice                                                                                                                                                                                  | Rationale                                                                                     |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Ecosystem name                    | `health-ecosystem-audit`                                                                                                                                                                | Mirrors `/ecosystem-health` skill and `scripts/health/` directory                             |
| 2   | Finding ID prefix                 | `HMS-`                                                                                                                                                                                  | Health Monitoring System — distinct from `HEA-` (hook audit)                                  |
| 3   | Domain structure                  | 6 domains, 25 categories (see Domain Detail below)                                                                                                                                      | Based on deep code analysis of actual failure modes in health monitoring system               |
| 4   | Boundary with script-ecosystem    | Both audit same files, different angles. Between the two, EVERY type of testing must be accounted for                                                                                   | Script checks code quality; health checks functional correctness. Mirrors hook/script overlap |
| 5   | Test expansion scope              | ALL possible testing angles — exhaustive, not selective                                                                                                                                 | User requirement: comprehensive coverage, no cherry-picking                                   |
| 6   | Test file location (health)       | Co-located: `scripts/health/checkers/__tests__/`                                                                                                                                        | Matches `scripts/reviews/__tests__/` pattern                                                  |
| 7   | Comprehensive audit registration  | Stage 1 (5+3 split)                                                                                                                                                                     | Health audit has no dependencies on other audits                                              |
| 8   | Execution approach                | Single plan, parallel subagents. Testing completed first since it informs ecosystem design                                                                                              | Testing feeds into ecosystem domains and categories                                           |
| 9   | Test prioritization               | No gating — all ~314 tests implemented in one focused plan                                                                                                                              | User explicitly wants comprehensive, not incremental                                          |
| 10  | Test types in scope               | All 14 test types: unit, integration, contract, regression, idempotency, property-based, boundary, perf budget, E2E, snapshot, mock accuracy, data integrity, error path, cross-system  | No exclusions                                                                                 |
| 11  | Domain weights                    | D1: Checker Infra 22%, D2: Scoring Pipeline 18%, D3: Data Persistence 20%, D4: Consumer Integration 18%, D5: Coverage & Completeness 12%, D6: Alert System 10%                          | Weights reflect risk: data persistence and checker reliability are highest-risk areas         |
| 12  | CI coverage enforcement           | 65% overall floor + 80% on new/modified files                                                                                                                                           | Progressive enforcement: prevents regression, doesn't force retroactive coverage              |
| 13  | Test dependencies                 | Add `fast-check` for property-based testing. No other new deps.                                                                                                                         | Full capability (shrinking, generators) worth the single dependency                           |
| 14  | Test scope breadth                | Tests for ALL ecosystem audit scripts + all hooks + all skill scripts + all infrastructure scripts                                                                                      | User wants comprehensive everywhere, not just health                                          |
| 15  | Health audit runs tests live      | Audit actively executes test suite during run — no reliance on stale coverage data                                                                                                      | Stale data is unacceptable; audit must verify live                                            |
| 16  | Test result reporting             | All tests must have a reporting home — no orphaned tests. Results visible in /alerts                                                                                                    | Every test result must be accessible somewhere                                                |
| 17  | /alerts ownership                 | Moves to health ecosystem                                                                                                                                                               | 90% coupled to health monitoring; user decision                                               |
| 18  | /ecosystem-health ownership       | Moves to health ecosystem                                                                                                                                                               | 100% coupled — wrapper around run-health-check.js                                             |
| 19  | Orphaned mid-session-alerts       | Wire into post-commit hook                                                                                                                                                              | Working code fills real gap — detects degradation between health checks                       |
| 20  | Staleness guard for CI results    | Configurable threshold, 24h default. If CI results exceed threshold, re-run locally. Results feed into normal output locations                                                          | Fresh data where it matters + failsafe for stale data                                         |
| 21  | Test result reporting home        | /alerts dashboard — add "Test Health" category                                                                                                                                          | Already becoming health-ecosystem-owned; has infrastructure for categories/scoring/triage     |
| 22  | Shared scoring library            | Copy from hook-ecosystem-audit (8th copy). Follow existing pattern.                                                                                                                     | Consolidation is separate initiative; copies have diverged per audit                          |
| 23  | Property-based test placement     | Co-located with unit tests. FULL COVERAGE — every applicable module gets property tests.                                                                                                | Same modules, randomized inputs. `.property.test.ts` naming next to `.test.ts`                |
| 24  | Test list verification            | Multi-pass research (Pass 0 + Pass 2 + Pass 3) completed. 314 verified test files.                                                                                                      | ~290 original → -14 dupes/dead + 42 missed = 314 verified                                     |
| 25  | Test count confirmation           | ALL ~314 tests, no deferrals                                                                                                                                                            | User wants comprehensive, no area excluded                                                    |
| 26  | Execution model                   | Phased — health tests first (inform ecosystem), then parallel dispatch for remaining areas                                                                                              | Dependencies flow from tests → ecosystem audit design                                         |
| 27  | Testing system documentation      | `docs/agent_docs/TESTING_SYSTEM.md` — architecture, location map, ownership, invocation guide, coverage map, test type glossary, adding-tests guide, result flow diagram                | User requirement: documentation is very important                                             |
| 28  | Test documentation update trigger | 3-layer: (1) `generate-test-registry.js` scans and outputs `test-registry.jsonl`, (2) pre-commit hook warns if new test not in registry, (3) health audit D5 catches undocumented tests | Automated discovery + gentle prompt + audit catches gaps                                      |
| 29  | Test registry source types        | 8 types: `test_file`, `audit_checker`, `test_protocol`, `skill_command`, `npm_validator`, `gate_check`, `ci_step`, `health_checker`                                                     | Pass 0 research revealed ~380 test sources across 8 distinct categories                       |
| 30  | Test failure during audit         | Option C + triage: failing tests surface as ERROR findings, audit continues, score penalized. Fix Now / Defer / Skip with investigation capability                                      | Stopping audit throws away diagnostic data; triage enables inline fixes                       |
| 31  | /ecosystem-health skill scope     | Moves to health ecosystem, gets tests (`run-ecosystem-health.js`)                                                                                                                       | 100% health-coupled, currently untested                                                       |
| 32  | Backup hooks                      | Exclude from testing — 7 files are dead code (superseded versions)                                                                                                                      | Pass 3 confirmed: not registered in settings.json, no references                              |
| 33  | run-alerts.js testing             | Add tests — 3,745-line monolith with zero tests. Major omission caught in Pass 3.                                                                                                       | Largest skill script in repo, moving to health ecosystem ownership                            |

### Phase 2 Decisions (D#34-52) — Skill Design

| #   | Decision                          | Choice                                                                                                              | Rationale                                                                                          |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 34  | SKILL.md phase structure          | Modified 8-phase: add dedicated "Live Test Execution" phase between Run & Dashboard (Phase 1b→1c→2)                 | D15 live test execution is unique to this audit and deserves its own phase step                    |
| 35  | Domain presentation order         | By score ascending (worst first)                                                                                    | Matches other audits (hook-audit pattern). Most actionable domains shown first                     |
| 36  | Finding review investigation      | Full investigation — read target file, show context, generate patch, preview, apply on approval                     | Matches hook-ecosystem-audit investigation flow. Audit has all context needed                      |
| 37  | Batch decision shortcuts          | Offer batch acknowledgment after 3 INFO/WARNING findings. "You decide" always available                             | Matches existing audit pattern. Prevents fatigue on low-severity findings                          |
| 38  | Checker source pattern            | Fork scoring/state-manager from hook-audit (per D#22), build checkers fresh                                         | Scoring lib is proven; checkers audit completely different domain (health vs hooks)                |
| 39  | Live test execution strategy      | D5 checker runs `npm test` (full suite, all tests), parses results per-area. Other domain checkers do NOT run tests | User requirement: audit must run ALL tests. Only D5 does this; other checkers are filesystem scans |
| 40  | Test registry consumption API     | Shared lib with caching: `loadRegistry(rootDir)` loads once, all checkers share via context                         | Registry is read-only during audit. Avoids 6 redundant file reads                                  |
| 41  | Checker timeout handling          | Per-checker configurable: D5 gets 30s+ (live tests), others get 10s default                                         | D5 inherently slower due to live test execution. Avoids false failures on other checkers           |
| 42  | REFERENCE.md benchmarks table     | Detailed: category \| metric \| good \| average \| poor \| source/rationale                                         | Matches existing audit REFERENCE.md patterns. No "current value" column (not generated)            |
| 43  | Self-test suite scope             | 4-file standard + 2 additional: `live-test-execution.test.js` + `registry-consumption.test.js`                      | Live test execution and registry consumption are defining unique features worth dedicated tests    |
| 44  | Dashboard format                  | Markdown table + sparkline trend indicators (▲▼━)                                                                   | Conveys trend at a glance without visual noise. Matches hook-audit dashboard                       |
| 45  | History & trend tracking location | `.claude/state/health-ecosystem-audit-history.jsonl`                                                                | Consistency with all 7 other ecosystem audits. data/ecosystem-v2/ serves different purpose         |
| 46  | /alerts Test Health category      | Show last audit score + test pass rate from most recent live run + unresolved findings count                        | Live test pass rate is the unique value-add (e.g. "1,594/1,594 pass, Score: B+ (82)")              |
| 47  | /ecosystem-health ownership       | Documentation + D4 checker validates integration contracts + audit flags divergence from expected behavior          | Ownership means audit detects integration drift. D4 designed for this                              |
| 48  | Mid-session alerts wiring         | Phase 4 infrastructure — hook wiring belongs in Steps 10-11, not /create-audit                                      | /create-audit shouldn't modify hooks outside its skill directory                                   |
| 49  | Comprehensive audit registration  | Stage 1 with `--skip-live-tests` flag for speed during comprehensive runs                                           | Full test suite adds ~10s; flag lets comprehensive run structural checks fast                      |
| 50  | Test failure finding format       | One ERROR finding per failing test file + individual failures listed in details field                               | Keeps finding count manageable; details field preserves granularity for investigation              |
| 51  | Coverage threshold severity       | Graduated: >10% below threshold = ERROR, <10% below = WARNING                                                       | 64% (1% below) is different from 30%. Proportional urgency                                         |
| 52  | Staleness guard configuration     | In benchmarks.js, overridable via `HMS_STALENESS_HOURS` env var (default 24h)                                       | Keeps with other benchmarks for discoverability; env var enables CI/CD flexibility                 |

## Domain Detail (Decision #3)

### D1: Checker Infrastructure & Reliability (5 categories, 22%)

| Category                     | What It Audits                                                         |
| ---------------------------- | ---------------------------------------------------------------------- |
| Command execution robustness | Timeouts, fallbacks, tool detection (npm, gh, tsc availability)        |
| File I/O safety              | Race conditions, missing files, encoding, max file size guards         |
| Benchmark configuration      | Hardcoded thresholds, validation, versioning, drift detection          |
| Edge case handling           | Empty output, malformed JSON, NaN propagation, array bounds            |
| Error propagation            | Silent failures vs explicit errors, no_data vs zero vs NaN distinction |

### D2: Scoring Pipeline Integrity (4 categories, 18%)

| Category                      | What It Audits                                                          |
| ----------------------------- | ----------------------------------------------------------------------- |
| Composite weight validation   | 8 category weights sum to 1.0, correct per-category weighting           |
| Missing data handling         | no_data vs zero vs NaN — single broken checker shouldn't tank composite |
| Metric direction consistency  | higher-is-better vs lower-is-better interpolation correctness           |
| Category-to-dimension mapping | 13 dimensions map to correct checker fields, runtime validation         |

### D3: Data Persistence & Concurrency (5 categories, 20%)

| Category                | What It Audits                                                          |
| ----------------------- | ----------------------------------------------------------------------- |
| JSONL append atomicity  | Concurrent write safety (session hook + manual /ecosystem-health)       |
| File rotation & cleanup | Unbounded growth detection (ecosystem-health-log.jsonl, warnings.jsonl) |
| Schema validation       | Required fields present in all JSONL records, version field             |
| Timestamp consistency   | ISO format validation, timezone handling, NaN date propagation          |
| Corrupt entry detection | Silent filter vs explicit error, recovery from malformed entries        |

### D4: Consumer Integration & Versioning (4 categories, 18%)

| Category                         | What It Audits                                                          |
| -------------------------------- | ----------------------------------------------------------------------- |
| Output schema versioning         | Breaking changes between health check output and consumers              |
| Health check timeout consistency | Quick (10s) vs full modes, per-checker timeout alignment                |
| Duplicate logic detection        | /alerts has local scoring copy — drift risk from health/lib/scoring.js  |
| Downstream error handling        | /ecosystem-health and /alerts handle all output formats, missing fields |

### D5: Coverage & Completeness (4 categories, 12%)

| Category                    | What It Audits                                                         |
| --------------------------- | ---------------------------------------------------------------------- |
| Checker success aggregation | Confidence metric: how many of 10 checkers actually completed?         |
| External tool availability  | npm, gh, tsc declarations — what happens when tools missing?           |
| Test coverage verification  | Live test execution, c8 coverage data, test file existence per checker |
| Test registry completeness  | All test sources registered (8 source_types), no orphaned tests        |

### D6: Mid-Session Alert System (3 categories, 10%)

| Category                      | What It Audits                                                     |
| ----------------------------- | ------------------------------------------------------------------ |
| Cooldown state management     | Write failures, loss of state, alert fatigue risk                  |
| Warning lifecycle consistency | Resolved warnings archival, stale detection, lifecycle transitions |
| Score degradation detection   | Threshold calibration, accuracy of trend computation               |

## Verified Test Inventory Summary

| Area                                          | New Tests | Test Types                                               |
| --------------------------------------------- | --------- | -------------------------------------------------------- |
| Health checkers (`scripts/health/checkers/`)  | ~20       | Unit + property                                          |
| Health lib (`scripts/health/lib/`)            | ~12       | Unit + property                                          |
| Debt pipeline (`scripts/debt/`)               | ~44       | Unit + regression + idempotency                          |
| Hooks (`.claude/hooks/`)                      | ~22       | Unit (14 active + lib + global)                          |
| Root scripts (`scripts/`)                     | ~52       | Unit                                                     |
| Shared lib (`scripts/lib/`)                   | ~10       | Unit                                                     |
| Audit validators (`scripts/audit/`)           | ~9        | Unit                                                     |
| Multi-AI (`scripts/multi-ai/`)                | ~6        | Unit                                                     |
| Planning (`scripts/planning/`)                | ~6        | Unit                                                     |
| Velocity (`scripts/velocity/`)                | ~2        | Unit                                                     |
| Secrets (`scripts/secrets/`)                  | ~2        | Unit                                                     |
| Config/tasks/metrics                          | ~3        | Unit                                                     |
| Ecosystem audit skills (7 existing × ~4 each) | ~28       | Regression + smoke + integration                         |
| Health ecosystem audit (new)                  | ~4        | Regression + smoke + integration                         |
| run-alerts.js                                 | ~3        | Unit + integration                                       |
| run-ecosystem-health.js                       | ~1        | Unit                                                     |
| New integration tests                         | ~2        | Cross-system (health→alerts→warnings, debt pipeline E2E) |
| New performance budget tests                  | ~2        | Budget timing                                            |
| Infrastructure (registry script, CI config)   | ~2        | Utility                                                  |
| **TOTAL**                                     | **~314**  | 14 test types                                            |

### Phase 3 Decisions (D#53-81) — Complete Internal Testing Coverage

**Date:** 2026-03-10 (Session #214) **Questions Asked:** 29 (5 batches)
**Decisions Captured:** 29

| #   | Decision                            | Choice                                                                                                                                                | Rationale                                                                                            |
| --- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 53  | Audit checker unit test depth       | Full unit tests per checker — 36 new test files, ~200 test cases testing parsing, scoring, edge cases individually                                    | User requirement: comprehensive, not selective. Checkers have real logic (400-977 lines each)        |
| 54  | Root script test scope              | Test ALL 57 untested root scripts regardless of size                                                                                                  | User requirement: ALL internal testing. Small scripts = small tests = low marginal cost              |
| 55  | V1/backup script treatment          | Investigate → confirmed active fallbacks (npm scripts exist). Test both v1 scripts.                                                                   | `package.json` has `reviews:sync:v1` and `consolidation:run:v1`. Active fallback mechanism           |
| 56  | Debt pipeline test scope            | Test ALL 28 untested debt scripts — comprehensive, no gaps                                                                                            | User requirement: ALL. Debt pipeline is TDMS backbone — every script matters                         |
| 57  | Auto-detection mechanism            | Pre-commit warning + CI blocking + registry-based scanning (C+D combined)                                                                             | Pre-commit = fast feedback, CI = enforcement, registry = leverages existing infrastructure           |
| 58  | Registry cleanup approach           | Fix scanner logic + regenerate + include cleanup in this amendment (C+A combined)                                                                     | Scanner itself needs fixing (28 stale entries, 63 missing). Regeneration produces clean state        |
| 59  | Checker unit test placement         | Co-located in existing `__tests__/` directories: `.claude/skills/*/scripts/checkers/__tests__/<checker>.test.js`                                      | Matches existing `__tests__/` pattern. Checker scripts are plain JS, tests should be JS too          |
| 60  | Root/debt/other test placement      | Centralized in `tests/scripts/` matching Phase 1 pattern                                                                                              | Phase 1 established this pattern. Consistency > co-location preference. Compilation pipeline proven  |
| 61  | Test template pattern               | Risk-proportional: >500 lines = full template, <500 = minimal (3-5 cases), <100 = smoke test (mock execution)                                         | Avoids wasting effort on trivial scripts while under-testing complex ones                            |
| 62  | Property-based testing strategy     | Selective — property tests for any function where contract is "input → bounded output" (numeric, normalized string, valid set)                        | Property testing shines with clear invariants. Selective gets most value without bloat               |
| 63  | Pre-commit auto-detect behavior     | Warning locally, blocking in CI                                                                                                                       | Warns without blocking WIP commits locally. CI enforcement ensures nothing merges without tests      |
| 64  | Covered directories definition      | Convention-based globs: `scripts/**/*.js`, `.claude/hooks/**/*.js`, `.claude/skills/*/scripts/**/*.js`                                                | Self-maintaining — no config file to forget to update. New directories auto-covered                  |
| 65  | V1 script test depth                | Parity test — single test file per v1/v2 pair, validates outputs match with same input                                                                | V1 exists for fallback parity. Parity test catches v1 drift from v2, which is the actual risk        |
| 66  | Review schema testing               | Consolidated single test file for all 7 schema files + individual tests for 8 untested script files                                                   | Schema validation can break silently. One consolidated file is proportionate to 7 small schemas      |
| 67  | New npm test scripts                | Grouped: `test:checkers` (audit checkers), `test:infra` (root scripts + lib + validators), `test:pipeline` (debt + reviews + multi-ai + planning)     | 3 new scripts = good granularity without bloat. Groups align with logical test areas                 |
| 68  | CI enforcement implementation       | Extend `generate-test-registry.js` with `--check-coverage` flag that exits non-zero if gaps found                                                     | Registry scanner already knows all test files and script directories. Natural extension              |
| 69  | Pre-commit hook integration         | Add to `.husky/pre-commit` — shell-level check at commit time                                                                                         | Already runs pattern compliance and cross-doc checks. Catches ALL commits, not just Claude-assisted  |
| 70  | Tiny CLI wrapper smoke tests        | Execute with mock inputs — mock fs/child_process to prevent side effects                                                                              | Even tiny wrappers can break (wrong import, missing dep). Mocking is lightweight, validates behavior |
| 71  | Test mocking approach               | Mixed: `node:test` mock for fs/child_process, `msw` for HTTP, temp directories for integration-level tests                                            | Unit tests fast (node:test), HTTP calls clean (msw already installed), integration realistic (temp)  |
| 72  | CI gate for existing untested files | Baseline snapshot in `.test-baseline.json` — CI only blocks NEW untested files after baseline. Entries removed as tests created.                      | Gate active immediately to prevent new gaps. Baseline captures current state honestly                |
| 73  | Orphan test cleanup                 | Investigate `promotion-pipeline.test.ts` first — maybe source was renamed. Fix or delete accordingly.                                                 | Might test `promote-patterns.ts` or combined pipeline. Investigation prevents deleting a valid test  |
| 74  | tsconfig.test.json updates          | Wildcard: change include to `tests/**/*.ts` to catch everything                                                                                       | Prevents future "forgot to add directory" problems. Fixes the exact coverage gap type we're closing  |
| 75  | Property test candidates            | ALL candidates (~15 files): 36 checker check() fns, 7 audit scoring.js, normalize-category, normalize-file-path, generate-content-hash, normalize-all | User override of recommendation. Complete property coverage for all bounded-output functions         |
| 76  | Execution approach                  | Three phases: Phase A (infrastructure), Phase B (test creation via parallel subagents), Phase C (verification)                                        | Infrastructure must precede tests (auto-detection works from day one). Verification must follow      |
| 77  | Checker unit test file structure    | One test file per checker: `<checker>.test.js` in `__tests__/`. Distinguishable from `checker-regression.test.js` by name.                            | One-per-checker is cleanest for isolation and debugging. No naming collision with regression tests   |
| 78  | Property test placement             | Co-located: `<name>.property.test.js` next to `<name>.test.js`, matching existing health lib pattern                                                  | Phase 1 established this with `scoring.property.test.js`. Consistency                                |
| 79  | Baseline file management            | Committed to repo — visible, auditable, PR diffs show when entries removed (progress)                                                                 | Visibility in PRs. Manual removal is fine — shows deliberate progress                                |
| 80  | Deleted baseline entries            | Auto-clean during `--check-coverage` run — scanner prunes entries for files that no longer exist                                                      | Prevents stale entries from accumulating. Scanner already knows which files exist                    |
| 81  | Coverage threshold adjustment       | Keep at 65% — auto-detection mechanism is the real guardrail now, not the percentage                                                                  | Percentage is blunt instrument. File-level auto-detection is stronger guarantee. 65% prevents regr.  |

### Amendment Test Inventory (D#53-56, D#65-66)

| Area                                                | New Tests | Test Types                     | Placement                                       |
| --------------------------------------------------- | --------- | ------------------------------ | ----------------------------------------------- |
| Audit checker unit tests (36 checkers × 7 audits)   | ~36       | Unit                           | `.claude/skills/*/scripts/checkers/__tests__/`  |
| Audit checker property tests (36 checkers)          | ~7        | Property (1 per audit)         | `.claude/skills/*/scripts/checkers/__tests__/`  |
| Audit scoring property tests (7 × scoring.js)       | ~7        | Property                       | `.claude/skills/*/scripts/lib/__tests__/` (new) |
| Root scripts (57 untested)                          | ~57       | Unit/smoke (risk-proportional) | `tests/scripts/`                                |
| Debt pipeline (28 untested)                         | ~28       | Unit                           | `tests/scripts/debt/`                           |
| Audit scripts (8 untested)                          | ~8        | Unit                           | `tests/scripts/audit/`                          |
| Lib scripts (8 untested)                            | ~8        | Unit                           | `tests/scripts/lib/`                            |
| Multi-AI scripts (4 untested)                       | ~4        | Unit                           | `tests/scripts/multi-ai/`                       |
| Planning scripts (5 untested)                       | ~5        | Unit                           | `tests/scripts/planning/`                       |
| Velocity (1), Secrets (1), Health (1)               | ~3        | Unit                           | `tests/scripts/velocity/`, etc.                 |
| V1 parity tests (2 pairs)                           | ~2        | Parity                         | `tests/scripts/`                                |
| Review scripts (8 untested + 1 schema consolidated) | ~9        | Unit + schema validation       | `scripts/reviews/__tests__/`                    |
| Hook scripts (2 untested)                           | ~2        | Unit                           | `tests/hooks/`                                  |
| Skill scripts (run-ecosystem-health.js)             | ~1        | Unit                           | `tests/scripts/health/`                         |
| Normalization property tests                        | ~4        | Property                       | `tests/scripts/lib/`, `tests/scripts/debt/`     |
| **TOTAL**                                           | **~181**  | Unit, property, parity, smoke  |                                                 |

### Amendment Infrastructure Changes

| File/Area                                | Change                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| `scripts/generate-test-registry.js`      | Fix scanner (28 stale entries, 63 missing), add `--check-coverage` flag |
| `.test-baseline.json` (NEW)              | Baseline of currently-untested files, committed, auto-cleaned           |
| `.husky/pre-commit`                      | Add untested-file warning for covered directories                       |
| `.github/workflows/ci.yml`               | Add `--check-coverage` step after tests pass                            |
| `tsconfig.test.json`                     | Wildcard: `tests/**/*.ts`                                               |
| `package.json`                           | Add `test:checkers`, `test:infra`, `test:pipeline` scripts              |
| 7 × audit `scripts/lib/__tests__/` (NEW) | New directories for audit lib property tests                            |

## Cross-File Updates Required

| File                                          | Change                                                 |
| --------------------------------------------- | ------------------------------------------------------ |
| `comprehensive-ecosystem-audit/SKILL.md`      | Add health as #8 to Stage 1                            |
| `.claude/COMMAND_REFERENCE.md`                | Register `/health-ecosystem-audit`                     |
| `.claude/skills/SKILL_INDEX.md`               | Add health-ecosystem-audit entry                       |
| `/alerts` SKILL.md                            | Update ownership reference + Test Health category      |
| `/ecosystem-health` SKILL.md                  | Update ownership reference                             |
| `.github/workflows/ci.yml`                    | Coverage thresholds + new test directories             |
| `package.json`                                | `fast-check` dep + npm test scripts + `tests:registry` |
| `tsconfig.test.json`                          | Add new test directories                               |
| `.claude/hooks/session-start.js`              | Wire mid-session-alerts.js into post-commit            |
| `DOCUMENTATION_INDEX.md`                      | Add TESTING_SYSTEM.md                                  |
| 7 existing ecosystem audit SKILL.md files     | Reference their new `__tests__/` directories           |
| 7 existing ecosystem audit REFERENCE.md files | Add test patterns section                              |
