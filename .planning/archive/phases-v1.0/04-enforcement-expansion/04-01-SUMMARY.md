<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

phase: 04-enforcement-expansion plan: 01 subsystem: static-analysis tags:
[semgrep, yaml-rules, taint-tracking, ci-workflow, security, correctness]

dependency-graph: requires: [03-04] provides: [semgrep-rules, ci-local-scan,
rule-test-annotations] affects: [04-04]

tech-stack: added: [] patterns: [semgrep-yaml-rules, taint-mode-analysis,
sarif-upload, annotation-testing]

key-files: created: -
.semgrep/rules/security/no-unsanitized-error-response.yml -
.semgrep/rules/security/taint-user-input-to-exec.yml -
.semgrep/rules/security/taint-path-traversal.yml -
.semgrep/rules/security/no-direct-firestore-write.yml -
.semgrep/rules/security/no-hardcoded-secrets.yml -
.semgrep/rules/security/no-eval-usage.yml -
.semgrep/rules/security/no-innerhtml-assignment.yml -
.semgrep/rules/security/no-dangerouslysetinnerhtml.yml -
.semgrep/rules/correctness/async-without-try-catch.yml -
.semgrep/rules/correctness/file-read-without-try-catch.yml -
.semgrep/rules/correctness/no-floating-promise.yml -
.semgrep/rules/correctness/regex-without-lastindex-reset.yml -
.semgrep/rules/correctness/no-race-condition-file-ops.yml -
.semgrep/rules/correctness/no-await-in-loop.yml -
.semgrep/rules/correctness/no-unchecked-array-access.yml -
.semgrep/rules/style/no-console-in-components.yml -
.semgrep/rules/style/no-any-type.yml -
.semgrep/rules/style/no-inline-firestore-query.yml -
.semgrep/rules/style/no-magic-numbers.yml -
.semgrep/rules/style/no-default-export.yml - .semgrep/.semgrepignore -
tests/semgrep/test-security.ts - tests/semgrep/test-correctness.ts -
tests/semgrep/test-style.ts modified: - .github/workflows/semgrep.yml -
eslint.config.mjs - .prettierignore - tsconfig.test.json -
scripts/check-pattern-compliance.js

decisions:

- id: ENFR-01-01 decision: "Semgrep test annotations use .ts extension excluded
  from tsc/ESLint/Prettier" reason: "Annotation files contain intentional code
  stubs and JSX that cannot be compiled or formatted"
- id: ENFR-01-02 decision: "Both local and cloud SARIF uploads use category
  parameter for deduplication" reason: "GitHub code scanning requires unique
  categories when uploading multiple SARIF files"
- id: ENFR-01-03 decision: "Semgrep installed via pip in CI, not added to
  package.json" reason: "Per research Pitfall 2: Semgrep is Python-based,
  CI-only, not needed locally on Windows"

metrics: duration: 14 min completed: 2026-03-01

---

# Phase 4 Plan 1: Semgrep Custom Rules Summary

**One-liner:** 20 Semgrep YAML rules across security/correctness/style with
taint tracking, CI integration, and annotation-based test files

## What Was Done

### Task 1: Semgrep Rule Directory Structure and 20 YAML Rules

Created `.semgrep/rules/` with three subdirectories containing 20 custom rules:

**Security rules (8, severity: ERROR):**

- `no-unsanitized-error-response`: Detects raw error.message/stack in HTTP
  responses; exempts sanitizeError() wrapper
- `taint-user-input-to-exec`: Taint-mode tracking from req.body/query/params to
  execSync/spawn
- `taint-path-traversal`: Taint-mode tracking from user input to
  readFileSync/writeFileSync/path.join
- `no-direct-firestore-write`: Blocks setDoc/addDoc/updateDoc/deleteDoc imports
  in app code
- `no-hardcoded-secrets`: Detects API key patterns (AIza*, sk-*, ghp\__, xoxb-_)
  in string literals
- `no-eval-usage`: Blocks eval(), Function(), string-based
  setTimeout/setInterval
- `no-innerhtml-assignment`: Detects direct innerHTML/outerHTML assignment
- `no-dangerouslysetinnerhtml`: Detects unsanitized dangerouslySetInnerHTML in
  JSX

**Correctness rules (7, severity: WARNING):**

- `async-without-try-catch`: Async functions with await but no try/catch
- `file-read-without-try-catch`: readFileSync outside try/catch (TOCTOU
  prevention)
- `no-floating-promise`: Async calls without await/then/catch
- `regex-without-lastindex-reset`: /g regex in loop without lastIndex reset
- `no-race-condition-file-ops`: existsSync followed by readFileSync without
  try/catch
- `no-await-in-loop`: Sequential await in for/while loops
- `no-unchecked-array-access`: Array index access without length check

**Style rules (5, severity: INFO):**

- `no-console-in-components`: Console usage in app/components directories
- `no-any-type`: TypeScript `: any` annotations (excludes tests and .d.ts)
- `no-inline-firestore-query`: getDoc/getDocs outside lib/firestore-service.ts
- `no-magic-numbers`: Large numeric literals in setTimeout/setInterval
- `no-default-export`: Default exports in lib/components/scripts (excludes
  Next.js pages)

All rules include `sonash.*` prefixed IDs, `code-pattern-ref` metadata linking
to CODE_PATTERNS.md, and `paths.exclude` for false positive reduction.

### Task 2: CI Workflow Update and Test Annotation Files

Updated `.github/workflows/semgrep.yml`:

- Added `pip install semgrep` step
- Added local custom rules scan:
  `semgrep --config .semgrep/rules/ --error --sarif`
- Added rule test step: `semgrep --test --config .semgrep/rules/ tests/semgrep/`
- Preserved existing cloud-managed rules (returntocorp/semgrep-action)
- Both SARIF files uploaded with separate categories

Created three test annotation files:

- `tests/semgrep/test-security.ts`: 16 test cases (8 violations + 8 safe
  patterns)
- `tests/semgrep/test-correctness.ts`: 14 test cases (7 violations + 7 safe
  patterns)
- `tests/semgrep/test-style.ts`: 12 test cases (5 violations + 7 safe patterns)

Exclusions added for annotation files (they contain intentional violations):

- `eslint.config.mjs`: `tests/semgrep/**` in ignores
- `.prettierignore`: `tests/semgrep/` directory
- `tsconfig.test.json`: `tests/semgrep` in exclude array
- `scripts/check-pattern-compliance.js`: `tests/semgrep/` in GLOBAL_EXCLUDE

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint/Prettier/TSC parsing Semgrep annotation files**

- **Found during:** Task 2
- **Issue:** Test annotation files contain intentional code stubs (incomplete
  functions, JSX, TypeScript type annotations) that ESLint, Prettier, and tsc
  cannot parse
- **Fix:** Added exclusions to eslint.config.mjs, .prettierignore,
  tsconfig.test.json, and check-pattern-compliance.js
- **Files modified:** eslint.config.mjs, .prettierignore, tsconfig.test.json,
  scripts/check-pattern-compliance.js

**2. [Rule 3 - Blocking] Pattern compliance checker flagging annotation file
violations**

- **Found during:** Task 2
- **Issue:** check-pattern-compliance.js CRITICAL rules matched the intentional
  security violation examples in test-security.ts
- **Fix:** Added `tests/semgrep/` to GLOBAL_EXCLUDE in
  check-pattern-compliance.js
- **Files modified:** scripts/check-pattern-compliance.js

**3. [Rule 3 - Blocking] Parallel agent commit race condition**

- **Found during:** Task 1 commit
- **Issue:** Parallel 04-02 agent committed first, causing HEAD lock mismatch.
  The 04-02 commit included the .semgrep/ rule files alongside its ESLint rules.
- **Fix:** Verified rules were committed correctly in 903480a8, proceeded to
  Task 2 for remaining files
- **Impact:** Task 1 commit attributed to 903480a8 (shared with 04-02 agent)

## Verification Results

| Check                           | Result             |
| ------------------------------- | ------------------ |
| Rule count (20+)                | 20 rules           |
| All rules have sonash.\* prefix | Yes (0 violations) |
| All rules have code-pattern-ref | 20/20              |
| CI workflow scans local rules   | Yes                |
| Test annotation files exist     | 3 files            |
| No Semgrep in package.json      | Confirmed          |
| ESLint passes                   | 0 errors           |
| Tests pass                      | 414/414            |

## Next Phase Readiness

ENFR-01 satisfied. Semgrep rules ready for enforcement manifest tracking in
04-04.
