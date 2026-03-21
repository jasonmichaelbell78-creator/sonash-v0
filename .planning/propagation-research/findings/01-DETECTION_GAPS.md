# Propagation Detection Gaps Analysis

**Date:** 2026-03-20 **Scope:** `scripts/check-propagation.js`,
`scripts/check-pattern-compliance.js`, and all files in `scripts/`,
`.claude/skills/`, `.claude/hooks/` **Method:** Exhaustive grep of codebase,
cross-referenced with each rule's guard/exclude pattern

---

## 1. What check-propagation.js Catches

### 1A. Function-Level Propagation (Lines 172-396)

Detects when a function is modified in one file but an identical copy exists in
another file that was NOT modified. Scans `scripts/`, `.claude/skills/`,
`.claude/hooks/` for `.js` and `.mjs` files.

**Limitations:**

- Only triggers on git diff (staged or upstream comparison) -- does NOT audit
  the full codebase at rest
- Only matches function names >= 6 characters that are not in the GENERIC_NAMES
  set (166 names excluded)
- Does not detect renamed/refactored copies -- only exact function name matches
- `.ts` and `.tsx` files are excluded from the function-level scan (parseDiff
  only checks `.js` and `.mjs`)

### 1B. Known Pattern Rules (Lines 36-88) -- 6 Rules

| #   | Rule Name                             | Search Pattern                 | Guard/Exclude                                                                                              | Type     |
| --- | ------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------- | -------- |
| 1   | `statSync-without-lstat`              | `statSync(`                    | File contains `isSymbolicLink(`                                                                            | Security |
| 2   | `path-resolve-without-containment`    | `path.resolve(`                | File contains `validatePathInDir(`                                                                         | Security |
| 3   | `writeFileSync-without-symlink-guard` | `writeFileSync(`               | File contains `isSafeToWrite(` or `isSymbolicLink(` or `lstatSync(` or `guardSymlink(` or `refuseSymlink(` | Security |
| 4   | `rmSync-usage`                        | `rmSync(`                      | None (always warns)                                                                                        | Quality  |
| 5   | `escapeCell-inconsistency`            | `writeFileSync(` writing `.md` | File contains `escapeCell(`                                                                                | Quality  |
| 6   | `truthy-filter-unsafe`                | `.filter(Boolean)`             | None (always warns)                                                                                        | Quality  |

**Critical Limitation:** Pattern rules only fire when a changed file shares a
directory with an unguarded file. If nobody touches the directory, the rule
stays silent. This is a _propagation_ check, not a _compliance_ check -- it
assumes the first violation was already caught elsewhere.

---

## 2. Rule-by-Rule Codebase Audit

### Rule 1: statSync-without-lstat

**Files with bare `statSync()` (not `lstatSync`):** 24 files

**Unguarded (no `lstatSync` or `isSymbolicLink` anywhere in file):** 14 files

| File                                        | Has lstat/isSymbolicLink?                                |
| ------------------------------------------- | -------------------------------------------------------- |
| `scripts/check-content-accuracy.js`         | NO                                                       |
| `scripts/check-doc-placement.js`            | NO                                                       |
| `scripts/check-external-links.js`           | NO                                                       |
| `scripts/hook-analytics.js`                 | NO                                                       |
| `scripts/hook-report.js`                    | NO                                                       |
| `scripts/log-session-activity.js`           | NO                                                       |
| `scripts/audit/audit-health-check.js`       | NO                                                       |
| `scripts/health/checkers/documentation.js`  | NO                                                       |
| `scripts/health/lib/utils.js`               | NO                                                       |
| `scripts/velocity/track-session.js`         | NO                                                       |
| `scripts/lib/learning-router.js`            | NO                                                       |
| `scripts/reviews/validate-jsonl-schemas.js` | NO                                                       |
| `scripts/seed-commit-log.js`                | NO (uses fstatSync on fd -- different pattern)           |
| `scripts/__tests__/wave6-alerts.test.js`    | NO (test file -- would be excluded by propagation check) |

**Protected (have lstat or isSymbolicLink guard):** 10 files --
`check-docs-light.js`, `generate-documentation-index.js`,
`generate-test-registry.js`, `log-override.js`,
`audit/transform-jsonl-schema.js`, `check-propagation.js`, `lib/safe-fs.js`,
`phase-complete-check.js`, `debt/verify-resolutions.js`,
`debt/extract-scattered-debt.js`

**Gap: 13 production files with bare statSync and no symlink guard.**

### Rule 2: path-resolve-without-containment

**Files with `path.resolve()`:** 100+ files (very common -- used for ROOT
constants, \_\_dirname resolution, etc.)

**Files using `validatePathInDir()` as guard:** 5 files
(`check-cross-doc-deps.js`, `debt/validate-schema.js`, `debt/resolve-bulk.js`,
`rotate-jsonl.js`, `lib/security-helpers.js`)

**Assessment:** Most `path.resolve()` calls are for static constant resolution
(e.g., `const ROOT = path.resolve(__dirname, '..')`) which is safe. The
propagation check's guard pattern (`validatePathInDir`) is too narrow -- many
files use `startsWith(allowedDir)` or `path.relative()` checks instead of the
specific `validatePathInDir` function. This creates false negatives (files with
valid guards that don't match the exclude regex) and noise (files where the
pattern is benign).

**Gap: The exclude pattern misses alternative containment patterns. Likely 5-10
files with user-derived path.resolve but no containment check exist, obscured by
the 90+ safe constant-resolution uses.**

### Rule 3: writeFileSync-without-symlink-guard

**Files with `writeFileSync()`:** 46 files under `scripts/`

**Protected by verified-patterns.json exemptions:** 24 files (the
`write-without-symlink-guard` exemption list)

**check-pattern-compliance.js also enforces this** via the
`write-without-symlink-guard` rule (id, severity: critical), which has a much
more sophisticated 10-line lookback for guards. The propagation check is a
weaker duplicate.

**Gap: Minimal -- check-pattern-compliance.js covers this thoroughly with its
testFn-based guard detection. The propagation check provides redundant coverage
but with a coarser guard regex.**

### Rule 4: rmSync-usage

**Files with `rmSync()`:** 68 occurrences across ~30 files

| Category                                          | Count                             |
| ------------------------------------------------- | --------------------------------- |
| Test cleanup (afterAll/afterEach)                 | ~35 occurrences in ~20 test files |
| Production code                                   | ~33 occurrences in ~10 files      |
| `scripts/lib/safe-fs.js` (the safe helper itself) | 5 occurrences                     |
| `scripts/archive/` (legacy)                       | ~10 occurrences in 4 files        |

**Assessment:** This rule has no exclude pattern (`excludeFilePattern: null`)
and always warns. It catches ALL rmSync usage including legitimate test cleanup.
The rule description says "prefer rename-only atomic patterns" but many uses are
intentional (temp file cleanup in catch blocks, test teardown).

**Gap: This rule is too noisy. It flags test teardown, safe-fs.js internals, and
legitimate error-path cleanup alongside genuinely risky production uses. No
severity distinction.**

### Rule 5: escapeCell-inconsistency

**Files writing `.md` with `writeFileSync()`:** ~14 files writing markdown
tables with dynamic data

**Files using `escapeCell()` or `escapeTableCell()`:** 8 files (3 under
`scripts/planning/`, 2 under `scripts/reviews/lib/`, 1
`generate-documentation-index.js`, 1 `scripts/reviews/dist/`, 1
`check-propagation.js` itself as definition)

**Files writing markdown tables WITHOUT any pipe-escape:** At least 5 files:

- `scripts/generate-lifecycle-scores-md.js` -- uses inline
  `.replaceAll("|", ...)` (partial coverage, not using the shared helper)
- `scripts/aggregate-audit-findings.js` -- NO pipe escaping at all
- `scripts/analyze-learning-effectiveness.js` -- NO pipe escaping
- `scripts/check-skill-audit-status.js` -- NO pipe escaping (writes to stdout,
  not file -- but pattern still applies)
- `scripts/archive/archive-reviews.js` -- NO pipe escaping

**Gap: 3-5 files write markdown tables with dynamic content and have zero pipe
escaping. Additionally, `generate-lifecycle-scores-md.js` does inline escaping
rather than using the shared `escapeCell` helper, which the propagation check's
guard regex would NOT recognize as protected (it only checks for `escapeCell(`
function calls).**

### Rule 6: truthy-filter-unsafe

**Total `.filter(Boolean)` occurrences:** 183 across 100 files

| Category                                                      | Approx. Count |
| ------------------------------------------------------------- | ------------- |
| `.split("\n").filter(Boolean)` (line splitting -- safe)       | ~60           |
| `.map(...).filter(Boolean)` (null removal -- safe)            | ~30           |
| String join/concat with `.filter(Boolean)` (safe for strings) | ~20           |
| Parsing JSONL lines with `.filter(Boolean)` (safe)            | ~25           |
| Potentially risky (numeric/mixed data)                        | ~5-10         |
| `.claude/skills/` (ecosystem audit scripts)                   | ~40           |

**Assessment:** This rule has no exclude pattern and always warns. The vast
majority of `.filter(Boolean)` usage is on string arrays (line splitting, path
segments) where the behavior is correct. The rule fires on all 183 instances,
making it essentially noise.

**Gap: No severity or context filtering. The rule should only fire when
`filter(Boolean)` is used on data that could contain `0` or `""` as legitimate
values (numeric arrays, form data). Currently: 100% false positive rate on
string-splitting idioms.**

---

## 3. Structural Gaps in check-propagation.js

### 3A. Scope Limitations

| Gap                                                       | Impact                                                                                                |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Only runs on pre-push** (`.husky/pre-push`)             | Violations sit undetected until push time                                                             |
| **Only checks `.js` and `.mjs`** for function propagation | `.ts`, `.tsx` files (the entire app) are invisible                                                    |
| **Pattern rules only fire when a directory is touched**   | Existing violations in untouched directories are invisible                                            |
| **SEARCH_DIRS limited to 3 directories**                  | `functions/`, `tests/`, `components/`, `lib/`, `hooks/` are all excluded from function-level scanning |
| **IGNORE_DIRS includes `__tests__`**                      | Test file propagation misses are invisible                                                            |

### 3B. Guard/Exclude Pattern Weaknesses

| Rule                                  | Weakness                                                                                                                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `statSync-without-lstat`              | Guard checks for `isSymbolicLink(` anywhere in file -- too coarse. A file could have `isSymbolicLink` in an unrelated function while its `statSync` call remains unguarded. |
| `path-resolve-without-containment`    | Guard only checks for `validatePathInDir(` -- misses `startsWith(allowedDir)`, `path.relative()` containment, `isPathContained()`, and other valid patterns                 |
| `writeFileSync-without-symlink-guard` | Guard checks for 5 different function names -- redundant with check-pattern-compliance.js's more thorough testFn                                                            |
| `escapeCell-inconsistency`            | Guard checks for `escapeCell(` -- misses inline `.replaceAll("                                                                                                              | ", ...)`escaping and alternative function names like`escapeTableCell()` |
| `rmSync-usage`                        | No guard at all -- flags everything including safe-fs.js itself                                                                                                             |
| `truthy-filter-unsafe`                | No guard at all -- flags string splitting idioms that are inherently safe                                                                                                   |

### 3C. Overlap with check-pattern-compliance.js

check-pattern-compliance.js already covers (with more precision):

- `writeFileSync` without symlink guard (id: `write-without-symlink-guard`,
  testFn-based)
- `path.resolve()` containment (id: `path-join-without-containment`, regex +
  pathExclude)
- `rmSync` usage indirectly (id: `rename-without-remove`)

The propagation check adds value only for:

- `statSync-without-lstat` (not in pattern compliance)
- `escapeCell-inconsistency` (not in pattern compliance)
- `.filter(Boolean)` (not in pattern compliance)
- Function-level duplication detection (unique to propagation check)

---

## 4. Duplicated Functions Across Scripts (Not Caught)

### 4A. `sanitizeError` -- 8 independent copies

| File                                          | Type                     |
| --------------------------------------------- | ------------------------ |
| `scripts/lib/sanitize-error.js`               | Canonical shared library |
| `scripts/lib/sanitize-error.ts`               | TypeScript source        |
| `scripts/lib/security-helpers.js`             | Inline copy              |
| `scripts/analyze-learning-effectiveness.js`   | Inline copy              |
| `scripts/check-cc.js`                         | Inline copy              |
| `scripts/archive/archive-reviews.js`          | Inline copy              |
| `scripts/archive/sync-reviews-to-jsonl.js`    | Inline copy              |
| `scripts/archive/sync-reviews-to-jsonl.v1.js` | Inline copy              |
| `scripts/run-consolidation.js`                | Inline copy              |
| `scripts/archive/run-consolidation.v1.js`     | Inline copy              |

**Why not caught:** Function name is 13 chars (passes MIN_FUNC_NAME_LENGTH=6)
and not in GENERIC_NAMES. However, the propagation check only fires on diff, so
these copies are invisible unless one is actively modified.

### 4B. `readJsonl`/`parseJsonl`/`loadJsonl` -- 15+ independent copies

41 files define some variant of a JSONL reading function. The canonical shared
version is `scripts/lib/read-jsonl.js`, but at least 15 scripts define their own
inline version.

**Why not caught:** Different function names (`readJsonl`, `parseJsonl`,
`loadJsonl`, `loadJsonlFile`, `parseJsonlFile`, `readJsonlEntries`) mean the
propagation check treats them as independent functions.

### 4C. `isSymlink` -- 4 independent copies

Defined in `check-pattern-compliance.js`, `archive/archive-reviews.js`,
`archive/sync-reviews-to-jsonl.js`, `archive/sync-reviews-to-jsonl.v1.js`.

### 4D. `safeParse` -- 8 independent copies

JSON.parse with try/catch wrapper defined independently in 8 files across
`scripts/` and `.claude/skills/`.

### 4E. `escapeCell` -- 3 independent definitions

- `scripts/planning/lib/read-jsonl.js` (shared)
- `scripts/reviews/lib/generate-claude-antipatterns.ts` (inline)
- `scripts/debt/generate-views.js` (inline, different name: anonymous inline
  `.replaceAll()`)

---

## 5. Patterns That SHOULD Be Propagation Rules But Are Not

### 5A. Security-Sensitive Patterns Missing from Propagation Check

| Candidate Pattern                                | Occurrences                            | Risk                               | Currently Enforced?                                                                    |
| ------------------------------------------------ | -------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `execSync` with template literal interpolation   | 0 in scripts (good!)                   | Command injection                  | Yes, by pattern-compliance `unsafe-interpolation`                                      |
| `appendFileSync` without lock/guard              | 5 files                                | TOCTOU race on concurrent appends  | Only via pattern-compliance `write-without-symlink-guard` -- misses concurrency aspect |
| `JSON.parse` on JSONL without per-line try/catch | 5+ exempted files                      | Single corrupt line crashes script | Yes, by pattern-compliance `jsonl-parse-no-try-catch`                                  |
| `renameSync` without cross-device fallback       | 9 exempted files                       | Fails on cross-drive moves         | Yes, by pattern-compliance `rename-no-fallback`                                        |
| Inline `sanitizeError` copies                    | 8 files                                | Drift from canonical version       | NO -- not checked by any tool                                                          |
| Inline `readJsonl` copies                        | 15+ files                              | Drift, missing BOM/try-catch fixes | NO -- not checked by any tool                                                          |
| Inline `safeParse` copies                        | 8 files                                | Drift from canonical version       | NO -- not checked by any tool                                                          |
| `replaceAll("                                    | ", ...)`inline vs shared`escapeCell()` | 3+ files                           | Inconsistent escaping logic                                                            | NO -- propagation check misses inline escaping |

### 5B. Error Handling Patterns

| Pattern                          | Count                                                                  | Issue                                                  |
| -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| `readFileSync` without try/catch | Previously tracked but REMOVED from pattern-compliance (92 exclusions) | Migrated to ESLint `sonash/no-unguarded-file-read`     |
| `statSync` without try/catch     | ~20 files                                                              | NOT checked -- a statSync on a nonexistent file throws |
| `readdirSync` without try/catch  | ~15 files                                                              | NOT checked                                            |

### 5C. Cross-Platform Patterns

| Pattern                                          | Count                                  | Issue                                                       |
| ------------------------------------------------ | -------------------------------------- | ----------------------------------------------------------- |
| `toPosixPath` / path normalization               | Only 1 standalone definition (in test) | Ad-hoc `.replaceAll("\\", "/")` scattered across many files |
| `startsWith('/')` instead of `path.isAbsolute()` | Checked by pattern-compliance          | Good coverage                                               |
| `.split("\n")` without CRLF handling             | Checked by pattern-compliance          | Good coverage                                               |

---

## 6. Summary of Detection Gaps

### High Priority (security-relevant, no existing enforcement)

1. **13 files with bare `statSync` and no symlink guard** -- the propagation
   rule exists but only fires on directory overlap with changes
2. **3-5 files write markdown tables with zero pipe escaping** -- escapeCell
   rule exists but limited to `writeFileSync(*.md)` matches
3. **8 inline copies of `sanitizeError`** -- no tool detects drift from
   canonical version
4. **15+ inline copies of JSONL parsing** -- no tool detects drift

### Medium Priority (quality, existing partial coverage)

5. **`.filter(Boolean)` rule is 95%+ false positives** -- needs context-aware
   filtering or removal
6. **`rmSync` rule flags all usage including safe test teardown** -- needs test
   file exclusion
7. **Pattern rules silent on untouched directories** -- a full-codebase audit
   mode is missing
8. **`.ts`/`.tsx` excluded from function propagation** -- the entire app layer
   is invisible

### Low Priority (redundant coverage or edge cases)

9. **`writeFileSync` symlink guard overlap** between propagation and
   pattern-compliance
10. **`path.resolve` guard pattern too narrow** -- misses alternative
    containment patterns
11. **No detection of `statSync`/`readdirSync` without try/catch** wrapping

---

## Version History

| Version | Date       | Changes                         |
| ------- | ---------- | ------------------------------- |
| 1.0     | 2026-03-20 | Initial detection gaps analysis |
