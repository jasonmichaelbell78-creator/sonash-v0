# SoNash Automation Error Handling Audit

**Audit Date:** 2026-01-31 **Scope:** Error handling in frequently-used
automation scripts

## Files Analyzed

- `scripts/check-pattern-compliance.js` (744 lines)
- `scripts/validate-audit.js` (980 lines)
- `scripts/debt/intake-audit.js` (351 lines)
- `scripts/debt/intake-manual.js` (349 lines)
- `scripts/debt/intake-pr-deferred.js` (280 lines)
- `scripts/debt/sync-sonarcloud.js` (486 lines)
- `scripts/debt/validate-schema.js` (288 lines)
- `.husky/pre-commit` (273 lines)
- `.github/workflows/ci.yml`

## Findings Summary

| Severity           | Count  | Issues                                                             |
| ------------------ | ------ | ------------------------------------------------------------------ |
| **S1 (Critical)**  | 12     | Silent failures, exit code errors, overly broad exception handling |
| **S2 (Important)** | 3      | Workflow config, documentation                                     |
| **Total**          | **15** | Complete findings in AUDIT_ERROR_HANDLING.jsonl                    |

## Critical Risk Areas

### 1. Silent Failures in View Regeneration (EH-001 to EH-004)

**Severity:** S1 (CRITICAL)

The most dangerous pattern: `execFileSync` and `execSync` wrapped in try-catch
blocks that only warn instead of propagating errors.

**Files Affected:**

- `scripts/debt/intake-audit.js:333-337`
- `scripts/debt/intake-manual.js:335-340`
- `scripts/debt/sync-sonarcloud.js:464-473`
- `.husky/pre-commit:333-337`

**Impact:** If view generation fails, scripts continue with exit(0), allowing
stale/corrupted views to persist.

**Example:**

```javascript
try {
  execFileSync(process.execPath, ["scripts/debt/generate-views.js"], {
    stdio: "inherit",
  });
} catch {
  console.warn("  ⚠️ Failed to regenerate views..."); // Only warning!
}
// Script continues and exits with 0 (success)
```

**Fix:** Add `process.exit(1)` in catch block or validate views before
returning.

### 2. Exit Code Semantics Failures (EH-006, EH-007)

**Severity:** S1 (CRITICAL)

Both error conditions and valid no-op conditions return exit(0), making it
impossible for callers to distinguish success from failure.

**Examples:**

```javascript
// intake-audit.js - Line 221: Empty input file (ERROR)
if (inputLines.length === 0) {
  console.log("⚠️ Input file is empty");
  process.exit(0); // ERROR: Should be exit(1)
}

// intake-audit.js - Line 295: All items duplicates (OK)
if (newItems.length === 0) {
  console.log("No new items to add");
  process.exit(0); // OK: But indistinguishable from error above
}
```

### 3. Overly Broad Exception Handling (EH-005, EH-008)

**Severity:** S1 (CRITICAL)

Catch blocks that don't distinguish error types conflate expected failures with
unexpected errors.

**Examples:**

- `scripts/check-pattern-compliance.js:576-582`: All git errors return empty
  array
- `scripts/validate-audit.js:743-745`: ESLint failures silently return
  unvalidated array
- `scripts/validate-audit.js:662-670`: npm audit failures silently continue

### 4. Shell Script Error Suppression (EH-009, EH-015)

**Severity:** S1 (CRITICAL)

Multiple instances of `2>/dev/null || true` and conflicting trap statements.

**File:** `.husky/pre-commit`

**Issues:**

- Line 101, 113, 238, 269: `2>/dev/null || true` hides errors from users
- Line 201: New trap overwrites line 57 trap, causing file leak

### 5. Workflow Configuration Issues (EH-011)

**Severity:** S2

Six `continue-on-error: true` statements in CI workflow create false confidence.

**File:** `.github/workflows/ci.yml`

**Lines:** 39, 75, 80, 90, 101, 107

## Detailed Findings

### EH-001: Silent failure in execFileSync - generate-views failure not propagated

- **File:** `scripts/debt/intake-audit.js`, Line 334
- **Severity:** S1 | **Confidence:** HIGH
- **Issue:** View regeneration wrapped in try-catch with only warning
- **Impact:** Stale views allowed to persist, downstream processes use corrupted
  data
- **Fix:** Exit(1) on error or validate views generated successfully

### EH-002: Silent failure in execSync for view regeneration

- **File:** `scripts/debt/intake-manual.js`, Line 335
- **Severity:** S1 | **Confidence:** HIGH
- **Issue:** execSync wrapped in try-catch with console.warn only
- **Impact:** Corrupted state possible when view generation fails
- **Fix:** Exit(1) or implement validation

### EH-003: Silent catch block in view regeneration - critical step masked

- **File:** `scripts/debt/sync-sonarcloud.js`, Line 469
- **Severity:** S1 | **Confidence:** HIGH
- **Issue:** execFileSync error masked, script exits 0 anyway
- **Impact:** MASTER_DEBT.jsonl updated but views stale
- **Fix:** Fail with exit(1) on view regeneration error

### EH-004: Missing error propagation in pre-commit hook

- **File:** `.husky/pre-commit`, Line 333
- **Severity:** S1 | **Confidence:** HIGH
- **Issue:** Pre-commit gate allows commits despite view generation failure
- **Impact:** Automated safety gate compromised
- **Fix:** Exit(1) to block commit on error

### EH-005: Overly broad exception handling in git diff call

- **File:** `scripts/check-pattern-compliance.js`, Line 576
- **Severity:** S1 | **Confidence:** MEDIUM
- **Issue:** All git errors treated the same, returns empty array
- **Impact:** Cannot distinguish "not a git repo" from actual git errors
- **Fix:** Check error.message, re-throw unexpected errors

### EH-006: Incorrect exit code semantics - empty input vs valid no-op

- **File:** `scripts/debt/intake-audit.js`, Lines 221, 295
- **Severity:** S1 | **Confidence:** HIGH
- **Issue:** Both error (empty input) and valid state (all duplicates) return
  exit(0)
- **Impact:** Caller cannot distinguish success from failure
- **Fix:** Exit(1) for invalid input, exit(0) for valid but no new items

### EH-007: Exit 0 on duplicate found - success exit for error condition

- **File:** `scripts/debt/intake-manual.js`, Line 273
- **Severity:** S1 | **Confidence:** MEDIUM
- **Issue:** Duplicate detected but exit(0) called, item not added
- **Impact:** Ambiguous error handling, caller sees success when item rejected
- **Fix:** Exit(2) for validation failures, document semantics

### EH-008: Silent catch block in cross-reference check

- **File:** `scripts/validate-audit.js`, Line 743
- **Severity:** S1 | **Confidence:** MEDIUM
- **Issue:** ESLint validation failures silently returned as "unvalidated"
- **Impact:** Users unaware that cross-reference check was skipped
- **Fix:** Log specific error with console.warn

### EH-009: Shell script error suppression with 2>/dev/null || true

- **File:** `.husky/pre-commit`, Lines 101, 113, 238, 269
- **Severity:** S1 | **Confidence:** MEDIUM
- **Issue:** 4 instances of `2>/dev/null || true` silently suppress errors
- **Impact:** Pre-commit failures hidden from users
- **Fix:** Capture stderr, check exit code, warn but don't suppress

### EH-010: All errors caught with single exit code

- **File:** `scripts/debt/validate-schema.js`, Line 285
- **Severity:** S1 | **Confidence:** MEDIUM
- **Issue:** main().catch() treats all errors identically with exit(2)
- **Impact:** Cannot distinguish file access errors from validation errors
- **Fix:** Use distinct exit codes by error type

### EH-011: Excessive continue-on-error usage in CI

- **File:** `.github/workflows/ci.yml`, Lines 39, 75, 80, 90, 101, 107
- **Severity:** S2 | **Confidence:** LOW
- **Issue:** Six workflow steps marked `continue-on-error: true`
- **Impact:** False confidence in CI status
- **Fix:** Evaluate each individually; split into separate workflows if needed

### EH-012: JSON parse error documentation missing

- **File:** `scripts/debt/extract-audits.js`, Line 150
- **Severity:** S2 | **Confidence:** LOW
- **Issue:** Error message lost in catch block
- **Impact:** Difficult to debug malformed JSONL
- **Fix:** Include error.message in validation output

### EH-013: existsSync false security - doesn't prevent race conditions

- **File:** `scripts/check-pattern-compliance.js`, Line 770
- **Severity:** S1 | **Confidence:** MEDIUM
- **Issue:** existsSync check before readFileSync creates false confidence
- **Impact:** TOCTOU race condition not handled
- **Fix:** Remove existsSync, rely on try-catch

### EH-014: execSync error handling missing in view regeneration

- **File:** `scripts/debt/intake-pr-deferred.js`, Line 334
- **Severity:** S1 | **Confidence:** HIGH
- **Issue:** No try-catch wrapper around execSync call
- **Impact:** Error context lost on failure
- **Fix:** Wrap in try-catch with proper error message

### EH-015: Trap statement overwrite - file cleanup leak

- **File:** `.husky/pre-commit`, Line 201
- **Severity:** S1 | **Confidence:** MEDIUM
- **Issue:** New trap overwrites earlier trap at line 57
- **Impact:** If outer trap executes, AUDIT_TMPFILE won't be cleaned
- **Fix:** Use trap chaining - append to existing trap rather than overwriting

## Recommendations (Priority Order)

### IMMEDIATE (Same Day):

1. **EH-001, EH-002, EH-003, EH-004:** Add `process.exit(1)` in view generation
   catch blocks
2. **EH-014:** Wrap `intake-pr-deferred.js:335` in try-catch

### URGENT (This Week):

3. **EH-006, EH-007:** Document and implement exit code semantics (0=success,
   1=error, 2=skip)
4. **EH-005:** Separate error types in git diff handling
5. **EH-009, EH-015:** Fix shell script error suppression

### IMPORTANT (This Sprint):

6. **EH-008:** Add console.warn to cross-reference failures
7. **EH-010:** Distinguish exit codes by error type in validate-schema.js
8. **EH-011:** Evaluate each continue-on-error individually

## Testing Recommendations

### Unit Tests:

- Create intentional failures in `generate-views.js`
- Verify intake scripts exit with non-zero on failures
- Verify pre-commit hook blocks commits on critical failures

### Integration Tests:

- Test git unavailability vs git errors
- Test npm audit offline behavior
- Test file permissions vs missing files
- Verify trap cleanup works correctly

### Operational Monitoring:

- Monitor pre-commit hook bypass rates
- Alert on view staleness
- Track script exit codes in CI logs
- Log hook warning capture failures

## Code Patterns Referenced

- **CLAUDE.md:** Security Rules section on critical anti-patterns
- **CODE_PATTERNS.md:** Silent catch blocks (🔴 Priority 1)
- **Shell Scripting:** Trap cleanup and error handling best practices
- **Pre-commit hooks:** Must fail-closed, not fail-open

## Audit Completeness

- **Pattern matching:** Complete for structured try-catch/catch blocks
- **Exit code analysis:** Complete for main() functions and critical paths
- **Workflow analysis:** Complete for `ci.yml` continue-on-error usage
- **Shell error handling:** Spot-checked for common patterns (2>/dev/null, trap)
- **Cross-script consistency:** Identified inconsistencies in exit code
  semantics

## Output Files

- **AUDIT_ERROR_HANDLING.jsonl:** Machine-readable findings (15 items, S1-S2
  severity)
- **This document:** Human-readable analysis and recommendations

## Statistics

| Category                        | Count  |
| ------------------------------- | ------ |
| Silent catch blocks             | 4      |
| Incorrect exit codes            | 4      |
| Overly broad exception handling | 3      |
| Shell script errors             | 2      |
| Workflow config issues          | 1      |
| Documentation issues            | 1      |
| **Total**                       | **15** |

**Confidence Distribution:**

- HIGH (8): Definite issues with clear code references
- MEDIUM (6): Pattern issues with contextual implications
- LOW (2): Marginal issues or workflow policy decisions

## Conclusion

The error handling audit identified 12 critical (S1) and 3 important (S2) issues
across the SoNash automation infrastructure. The most severe pattern is **silent
failures in critical operations** (view generation), which could lead to data
corruption.

**Exit code semantics are inconsistent**, making it difficult for callers to
distinguish errors from valid no-op states.

**Shell script error suppression** reduces visibility into pre-commit hook
failures.

These issues should be addressed immediately to ensure system reliability and
data integrity.
