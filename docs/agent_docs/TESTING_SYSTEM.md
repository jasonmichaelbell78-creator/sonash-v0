# Testing System

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-03-10
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Purpose

Comprehensive reference for SoNash's testing infrastructure. Covers the test
runner, file layout, invocation commands, coverage enforcement, test types,
registry system, and how to add new tests.

**Audience:** AI agents and developers working on the SoNash codebase.

---

## 1. Testing Architecture Overview

SoNash uses a zero-dependency test stack built on Node.js built-in modules.
There are no heavyweight test frameworks (no Jest, no Mocha, no Vitest for unit
tests).

| Component      | Package / Module | Role                                           |
| -------------- | ---------------- | ---------------------------------------------- |
| Test runner    | `node:test`      | Built-in Node.js test runner (`node --test`)   |
| Assertions     | `node:assert`    | Strict assertions via `assert/strict`          |
| Property tests | `fast-check`     | Generative / property-based testing            |
| Coverage       | `c8`             | V8-native code coverage collection & reporting |
| Path aliasing  | `tsc-alias`      | Resolves `@/*` path aliases after TS compile   |
| TS compilation | `tsc`            | Compiles TypeScript tests to `dist-tests/`     |
| Env vars       | `cross-env`      | Cross-platform env variable injection          |

### Build pipeline

```text
tests/**/*.test.ts
       |
       v
  tsc -p tsconfig.test.json     (TypeScript -> JS, outDir: dist-tests/)
       |
       v
  tsc-alias -p tsconfig.test.json   (rewrite @/* imports to relative paths)
       |
       v
  dist-tests/tests/**/*.test.js    (ready to run with node --test)
```

TypeScript tests in `tests/` must be compiled before execution. Health checker
tests and ecosystem audit tests are plain JavaScript and run directly without a
build step.

---

## 2. Test File Location Map

| Area                     | Test Directory                                 | Language | Test Types                             |
| ------------------------ | ---------------------------------------------- | -------- | -------------------------------------- |
| Health checkers          | `scripts/health/checkers/__tests__/`           | JS       | unit, property                         |
| Health lib               | `scripts/health/lib/__tests__/`                | JS       | unit, property                         |
| Hooks                    | `tests/hooks/`                                 | TS       | unit                                   |
| Hook helpers             | `tests/hooks/lib/`                             | TS       | unit                                   |
| Global hooks             | `tests/hooks/global/`                          | TS       | unit                                   |
| Debt pipeline            | `tests/scripts/debt/`                          | TS       | unit, property, idempotency, E2E       |
| Shared lib               | `tests/scripts/lib/`                           | TS       | unit, property                         |
| Audit scripts            | `tests/scripts/audit/`                         | TS       | unit                                   |
| Multi-AI                 | `tests/scripts/multi-ai/`                      | TS       | unit                                   |
| Config                   | `tests/scripts/config/`                        | TS       | unit                                   |
| Tasks                    | `tests/scripts/tasks/`                         | TS       | unit                                   |
| Velocity                 | `tests/scripts/velocity/`                      | TS       | unit                                   |
| Secrets                  | `tests/scripts/secrets/`                       | TS       | unit                                   |
| Metrics                  | `tests/scripts/metrics/`                       | TS       | unit                                   |
| Planning                 | `tests/scripts/planning/`                      | TS       | unit                                   |
| Health scripts           | `tests/scripts/health/`                        | TS       | unit                                   |
| Root scripts             | `tests/scripts/`                               | TS       | unit                                   |
| Review scripts           | `scripts/reviews/__tests__/`                   | TS       | unit                                   |
| Ecosystem audits         | `.claude/skills/*/scripts/__tests__/`          | JS       | unit, regression, scoring, integration |
| Ecosystem audit checkers | `.claude/skills/*/scripts/checkers/__tests__/` | JS       | unit, property                         |
| Ecosystem audit libs     | `.claude/skills/*/scripts/lib/__tests__/`      | JS       | property                               |
| Integration              | `tests/integration/`                           | JS       | integration                            |

### Key distinction

- **TypeScript tests** (`tests/`): compiled to `dist-tests/` via
  `npm run test:build`, then executed from the compiled output.
- **JavaScript tests** (`scripts/health/`, `.claude/skills/`): executed directly
  with `node --test` -- no build step required.

---

## 3. Ownership Matrix -- Ecosystem Audit Tests

Each ecosystem audit skill owns a standard set of 4 test files:

| Ecosystem Audit           | Test Directory                                              | Tests Owned                                                                                        |
| ------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `pr-ecosystem-audit`      | `.claude/skills/pr-ecosystem-audit/scripts/__tests__/`      | checker-regression, scoring, state-manager, integration                                            |
| `session-ecosystem-audit` | `.claude/skills/session-ecosystem-audit/scripts/__tests__/` | checker-regression, scoring, state-manager, integration                                            |
| `tdms-ecosystem-audit`    | `.claude/skills/tdms-ecosystem-audit/scripts/__tests__/`    | checker-regression, scoring, state-manager, integration                                            |
| `doc-ecosystem-audit`     | `.claude/skills/doc-ecosystem-audit/scripts/__tests__/`     | checker-regression, scoring, state-manager, integration                                            |
| `hook-ecosystem-audit`    | `.claude/skills/hook-ecosystem-audit/scripts/__tests__/`    | checker-regression, scoring, state-manager, integration                                            |
| `script-ecosystem-audit`  | `.claude/skills/script-ecosystem-audit/scripts/__tests__/`  | checker-regression, scoring, state-manager, integration                                            |
| `skill-ecosystem-audit`   | `.claude/skills/skill-ecosystem-audit/scripts/__tests__/`   | checker-regression, scoring, state-manager, integration                                            |
| `health-ecosystem-audit`  | `.claude/skills/health-ecosystem-audit/scripts/__tests__/`  | checker-regression, scoring, state-manager, integration, live-test-execution, registry-consumption |

### Standard test file pattern per audit

```text
.claude/skills/<audit-name>/scripts/__tests__/
  checker-regression.test.js       # All domain checkers run without crashing, valid output shapes
  <audit-name>-scoring.test.js     # Scoring logic produces correct grades and thresholds
  state-manager.test.js            # State persistence read/write cycle correctness
  <audit-name>-integration.test.js # End-to-end audit run produces expected structure
```

---

## 4. Invocation Guide

### npm scripts

| Command                  | What It Runs                                      | Build Step | Scope                                                                      |
| ------------------------ | ------------------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `npm test`               | Full suite -- TS build, then all tests            | Yes        | `dist-tests/tests/**` + `scripts/health/**`                                |
| `npm run test:health`    | Health checker and lib tests only                 | No         | `scripts/health/checkers/__tests__/**` + `scripts/health/lib/__tests__/**` |
| `npm run test:hooks`     | Hook tests only (builds TS first)                 | Yes        | `dist-tests/tests/hooks/**`                                                |
| `npm run test:debt`      | Debt pipeline tests only (builds TS first)        | Yes        | `dist-tests/tests/scripts/debt/**`                                         |
| `npm run test:audits`    | Ecosystem audit self-tests                        | No         | `.claude/skills/*/scripts/__tests__/*.test.js`                             |
| `npm run test:checkers`  | Ecosystem audit checker tests                     | No         | `.claude/skills/*/scripts/checkers/__tests__/*.test.js`                    |
| `npm run test:infra`     | Root + lib + audit script tests                   | Yes        | `dist-tests/tests/scripts/*.test.js` + lib + audit subdirs                 |
| `npm run test:pipeline`  | Debt + multi-AI + planning pipeline tests         | Yes        | `dist-tests/tests/scripts/debt/**` + multi-ai + planning                   |
| `npm run tests:registry` | Regenerate the test registry JSONL                | No         | Scans all 8 source types, writes `data/ecosystem-v2/test-registry.jsonl`   |
| `npm run test:coverage`  | Full suite with c8 coverage (text + HTML reports) | Yes        | Same scope as `npm test`, plus coverage                                    |

### Running a single test file

```bash
# JavaScript test (no build needed)
node --test scripts/health/checkers/__tests__/code-quality.test.js

# TypeScript test (must build first)
npm run test:build
node --test dist-tests/tests/hooks/block-push-to-main.test.js
```

### Environment variables

All test commands inject Firebase stub environment variables via `cross-env` to
prevent import errors in modules that reference `process.env.NEXT_PUBLIC_*` at
load time:

```text
NODE_ENV=test
NEXT_PUBLIC_FIREBASE_API_KEY=test
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=test
NEXT_PUBLIC_FIREBASE_PROJECT_ID=test
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=test
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=test
NEXT_PUBLIC_FIREBASE_APP_ID=test
```

---

## 5. Coverage Map

### CI enforcement

CI enforces a **65% overall line coverage** threshold. The check runs after the
full test suite:

```yaml
- name: Enforce coverage thresholds
  run: |
    npx c8 check-coverage --lines 65 || {
      echo "::error::Overall line coverage below 65% threshold"
      exit 1
    }
```

Coverage reports (text and HTML) are uploaded as CI artifacts with 14-day
retention.

### Areas with strong coverage

| Area                            | Coverage Status | Notes                                      |
| ------------------------------- | --------------- | ------------------------------------------ |
| Health checkers                 | Strong          | 10 checker tests + 2 property tests        |
| Health scoring lib              | Strong          | Unit + property-based with fast-check      |
| Hooks                           | Strong          | 14+ hook test files, helper lib tests      |
| Debt pipeline                   | Strong          | 28 test files (unit, property, E2E)        |
| Ecosystem audit checkers        | Strong          | 84 test files across 8 audit domains       |
| Ecosystem audit libs            | Strong          | 8 property test files (scoring invariants) |
| Root scripts                    | Strong          | 60+ unit tests for standalone scripts      |
| Review scripts                  | Strong          | 18 unit tests for review pipeline          |
| Shared lib (sanitize, security) | Strong          | Core helpers + property tests              |
| Planning scripts                | Moderate        | 5 test files for planning pipeline         |
| Multi-AI scripts                | Moderate        | 4 test files for AI aggregation pipeline   |

### Areas that need more coverage

| Area                         | Coverage Status | Notes                                  |
| ---------------------------- | --------------- | -------------------------------------- |
| Application components       | Low             | React components (Next.js App Router)  |
| Firestore service functions  | Moderate        | Basic service tests exist              |
| Cloud Functions              | Low             | Server-side callable functions         |
| UI hooks (useCallback, etc.) | Moderate        | Some hook tests exist                  |
| Ecosystem v2 contracts       | Moderate        | Contract tests exist but limited scope |

---

## 6. Test Type Glossary

| Test Type         | Suffix Convention            | Description                                                                                                                     |
| ----------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Unit**          | `.test.ts` / `.test.js`      | Tests a single module's logic in isolation. Fastest, most numerous.                                                             |
| **Property**      | `.property.test.js`          | Uses `fast-check` to generate random inputs and verify invariants hold across all values. Used for scoring and composite logic. |
| **Integration**   | `.integration.test.js`       | Tests multiple modules working together. May invoke real scripts via `execFileSync`. Longer timeout (30s).                      |
| **E2E**           | `.e2e.test.ts`               | End-to-end pipeline test. Exercises the full pipeline (intake -> normalize -> dedup -> views -> metrics) with fixture data.     |
| **Idempotency**   | `idempotency.test.ts`        | Verifies that running an operation twice produces identical results. Key for debt pipeline correctness.                         |
| **Regression**    | `checker-regression.test.js` | Ensures all domain checkers run without crashing, produce valid output shapes, and that finding IDs are unique.                 |
| **Scoring**       | `*-scoring.test.js`          | Tests audit scoring logic: grade computation, threshold enforcement, metric aggregation.                                        |
| **State-manager** | `state-manager.test.js`      | Tests state persistence: read/write cycles, file rotation, corruption recovery.                                                 |
| **Protocol**      | `.protocol.json`             | Declarative UI test protocol files consumed by `/test-suite` skill. Not executable tests themselves.                            |

---

## 7. Adding New Tests

### Where to place tests

Follow the location map in Section 2. The general rule:

- Tests for **scripts** go in `tests/scripts/<area>/`
- Tests for **hooks** go in `tests/hooks/` (or `tests/hooks/lib/`,
  `tests/hooks/global/`)
- Tests for **health checkers/lib** go in `scripts/health/<area>/__tests__/`
- Tests for **ecosystem audits** go in
  `.claude/skills/<audit-name>/scripts/__tests__/`
- Tests for **cross-module flows** go in `tests/integration/`

### Naming conventions

```html
<module
  >.test.ts # Unit test (TypeScript)
  <module
    >.test.js # Unit test (JavaScript)
    <module
      >.property.test.js # Property-based test
      <module
        >.integration.test.js # Integration test
        <module>.e2e.test.ts # End-to-end test</module></module
      ></module
    ></module
  ></module
>
```

The file name should match the module being tested. For example, a test for
`scripts/health/lib/scoring.js` would be
`scripts/health/lib/__tests__/scoring.test.js`.

### Writing a new test

Use `node:test` and `node:assert/strict`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("myModule", () => {
  it("should do something", () => {
    assert.strictEqual(1 + 1, 2);
  });
});
```

For property-based tests, add `fast-check`:

```javascript
const fc = require("fast-check");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

describe("myModule property tests", () => {
  it("invariant holds for all inputs", () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        const result = myFunction(n);
        assert.ok(result >= 0, "result must be non-negative");
      })
    );
  });
});
```

### Registering in the test registry

After adding a test file, regenerate the registry:

```bash
npm run tests:registry
```

This scans all test directories defined in `scripts/generate-test-registry.js`
and writes `data/ecosystem-v2/test-registry.jsonl`. The registry is regenerated
automatically -- new files in recognized directories are picked up without
manual registration.

If your test lives in a **new directory** not listed in the scanner's `patterns`
array, add it to the `scanTestFiles()` function in
`scripts/generate-test-registry.js`:

```javascript
{ dir: 'tests/scripts/<new-area>', owner: '<owner>', type: 'unit' },
```

### TypeScript test checklist

1. Add the test file in the appropriate `tests/` subdirectory.
2. Verify the directory is included in `tsconfig.test.json` `include` array. If
   not, add it.
3. Run `npm run test:build` to confirm compilation succeeds.
4. Run `node --test dist-tests/tests/<path-to-compiled-test>.test.js` to verify
   locally.
5. Run `npm run tests:registry` to update the registry.

### JavaScript test checklist

1. Add the test file with `"use strict";` at the top.
2. Use `require("node:test")` and `require("node:assert/strict")`.
3. Run `node --test <path-to-test-file>` to verify locally.
4. Run `npm run tests:registry` to update the registry.

---

## 8. Test Result Flow Diagram

```text
Developer pushes code
        |
        v
  CI: .github/workflows/ci.yml
        |
        +--> Lint (oxlint, eslint, prettier)
        +--> Type check (tsc --noEmit)
        +--> Pattern compliance
        |
        v
  npm run test:coverage
        |
        +--> npm run test:build        (tsc + tsc-alias)
        +--> node --test "dist-tests/tests/**/*.test.js"
        |                              (TypeScript tests)
        +--> node --test "scripts/health/**/*.test.js"
        |                              (JavaScript health tests)
        v
  c8 collects V8 coverage data
        |
        +--> Text report (stdout)
        +--> HTML report (coverage/)
        v
  npx c8 check-coverage --lines 65
        |
        +--> PASS: CI continues to build step
        +--> FAIL: CI fails with "Overall line coverage below 65%" error
        v
  Coverage artifact uploaded (14-day retention)
        |
        v
  Health scoring system
        |
        +--> scripts/health/checkers/test-coverage.js
        |    reads coverage data and scores it
        +--> Composite health score includes test coverage dimension
        v
  /alerts skill surfaces failures and regressions
```

### How failures surface

1. **CI failure**: GitHub checks block the PR merge.
2. **Health scoring**: The `test-coverage` health checker reads coverage
   metrics. Low coverage degrades the composite health score.
3. **Mid-session alerts**: Mid-session alert scripts can flag test failures
   during active development sessions.
4. **Ecosystem audits**: Each audit's `checker-regression.test.js` ensures
   domain checkers do not silently break.

---

## 9. Test Registry

### Overview

The test registry is a JSONL file at `data/ecosystem-v2/test-registry.jsonl`
that catalogs every validation source in the project. It is generated by
`scripts/generate-test-registry.js`.

### Source types

The registry scans for 8 distinct source types:

| Source Type      | What It Captures                                         | Example                                                                    |
| ---------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- |
| `test_file`      | `.test.js`, `.test.ts`, `.property.test.js` files        | `tests/hooks/block-push-to-main.test.ts`                                   |
| `audit_checker`  | Ecosystem audit domain checker scripts                   | `.claude/skills/pr-ecosystem-audit/scripts/checkers/process-compliance.js` |
| `test_protocol`  | `.protocol.json` UI test protocol files                  | `.claude/test-protocols/journal-dailylog.protocol.json`                    |
| `skill_command`  | Skill `SKILL.md` files (invocable skills)                | `.claude/skills/deep-plan/SKILL.md`                                        |
| `npm_validator`  | npm scripts that validate, check, lint, or test          | `npm run patterns:check`                                                   |
| `gate_check`     | CI workflow steps that enforce quality gates             | `Enforce coverage thresholds`                                              |
| `ci_step`        | All CI workflow steps (including non-gate informational) | `Checkout code`                                                            |
| `health_checker` | Health monitoring checker scripts                        | `scripts/health/checkers/code-quality.js`                                  |

### Registry entry schema

Each line in the JSONL file is a JSON object with these fields:

```json
{
  "path": "tests/hooks/block-push-to-main.test.ts",
  "source_type": "test_file",
  "type": "unit",
  "owner": "hooks",
  "target": "block-push-to-main",
  "description": "unit test for block-push-to-main"
}
```

| Field         | Description                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| `path`        | Relative path from project root                                                                       |
| `source_type` | One of the 8 source types listed above                                                                |
| `type`        | Granular test type (unit, property, integration, e2e, checker, gate, ci, npm-script, skill, protocol) |
| `owner`       | Owning subsystem (hooks, health, debt, ci, npm, etc.)                                                 |
| `target`      | The module or concept being tested                                                                    |
| `description` | Human-readable description                                                                            |

### How the scanner works

`scripts/generate-test-registry.js` runs 7 scan functions in sequence:

1. **`scanTestFiles()`** -- Walks predefined directories recursively, identifies
   files matching `*.test.{js,ts,mjs}` patterns, and classifies them by type
   (unit, property, integration, e2e) based on filename suffixes.
2. **`scanAuditCheckers()`** -- Finds `*.js` files in each ecosystem audit's
   `scripts/checkers/` directory.
3. **`scanTestProtocols()`** -- Finds `*.protocol.json` files in `tests/` and
   `.claude/skills/`.
4. **`scanSkillCommands()`** -- Finds `SKILL.md` files in `.claude/skills/*/`.
5. **`scanNpmValidators()`** -- Reads `package.json` scripts matching
   validation-related prefixes (`test`, `lint`, `check`, `validate`, `verify`,
   `audit`, `format`, `security`, `patterns`, `review`, `docs:`, `roadmap:`,
   `skills:`).
6. **`scanCiSteps()`** -- Parses `.github/workflows/ci.yml` for `- name:` lines.
   Steps matching quality keywords (`check`, `lint`, `test`, `validate`,
   `coverage`, `audit`, `format`, `pattern`, `compliance`, `verify`) are tagged
   as `gate_check`; all others as `ci_step`.
7. **`scanHealthCheckers()`** -- Finds `*.js` files in
   `scripts/health/checkers/`.

### Regenerating the registry

```bash
npm run tests:registry
```

Output: `data/ecosystem-v2/test-registry.jsonl`

The command prints a summary showing total entries and counts by source type.

---

## 10. Auto-Detection Pipeline

The auto-detection pipeline prevents untested scripts from entering the codebase
without explicit acknowledgment.

### How it works

```text
New script added to scripts/, .claude/hooks/, or .claude/skills/*/scripts/
        |
        v
  Pre-commit hook (check #13)
  Warns: "New script X has no test file"
        |
        v
  --check-coverage mode (CI gate)
  node scripts/generate-test-registry.js --check-coverage
        |
        +--> Scans covered directories for scripts
        +--> Compares against test inventory
        +--> Reads .test-baseline.json for known gaps
        v
  NEW gaps found?
        |
        +--> YES: Exit 1 (CI blocks)
        +--> NO: Exit 0 (pass)
```

### Baseline file

`.test-baseline.json` tracks scripts that are known to lack tests. The file
schema:

```json
{
  "version": 1,
  "description": "Scripts without tests. Remove entries as tests are created.",
  "created": "2026-03-10",
  "entries": [
    { "path": "scripts/example.js", "lines": 100 },
    { "path": "scripts/complex.js", "lines": 500, "note": "optional context" }
  ]
}
```

- **New scripts** not in the baseline cause `--check-coverage` to fail
- **Adding a test** for a baselined script: remove its entry from the baseline
- **Intentionally untested scripts**: add to `.test-baseline.json` with a `note`
  explaining why

### Covered directories

The scanner checks these directories for untested scripts:

- `scripts/` (root-level scripts)
- `.claude/hooks/` (hook scripts)
- `.claude/skills/*/scripts/` (ecosystem audit scripts)

---

## Quick Reference

| Fact                    | Value                                   |
| ----------------------- | --------------------------------------- |
| Total tests             | ~3,640                                  |
| Test files              | ~310 files across all test directories  |
| Test failures           | 0                                       |
| Coverage threshold (CI) | 65% line coverage                       |
| Test runner             | `node:test` (Node.js built-in)          |
| Coverage tool           | `c8` (V8-native)                        |
| Property test library   | `fast-check`                            |
| TS compilation target   | `dist-tests/`                           |
| Registry output         | `data/ecosystem-v2/test-registry.jsonl` |
| Registry source types   | 8                                       |
| Baseline file           | `.test-baseline.json`                   |

---

## Version History

| Version | Date       | Changes                                                      |
| ------- | ---------- | ------------------------------------------------------------ |
| 2.0     | 2026-03-10 | Phase 5-7: auto-detection, expanded coverage map, 3640 tests |
| 1.0     | 2026-03-09 | Initial documentation                                        |
