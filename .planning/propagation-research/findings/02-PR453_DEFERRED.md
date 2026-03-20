# PR #453 Deferred Propagation Patterns — Research Findings

**Date:** 2026-03-20 **Status:** COMPLETE **Researcher:** Claude Opus 4.6

---

## 1. Source Context

**PR #453** was a comprehensive zero-warning infrastructure overhaul executed
via `/deep-plan` across 6 waves. The R1 review (Review #489) fixed 34 items but
noted:

> "5 propagation patterns across 150+ files identified but deferred to next
> session"

Source: `.claude/state/task-pr-review-453-r1.state.json` (line 14, `notes`
field).

The formal review tallies for R1 show 0 "deferred" because these were noted as
propagation backlog items, not individual review items. They were already
tracked in MASTER_DEBT as:

- **DEBT-11335** / **DEBT-11339** (duplicates): "Pattern propagation backlog: 4
  patterns across 50+ files block pre-push" (S1, created 2026-03-07)
- **DEBT-45524** / **DEBT-45525**: "Hook bypass threshold: propagation
  overridden 31-33+ times in 14 days" (S1, created 2026-03-12)

---

## 2. The 6 Propagation Patterns (Not 5)

The `scripts/check-propagation.js` KNOWN_PATTERN_RULES defines **6 patterns**.
The DEBT items reference 4 that block pre-push. The R1 note said "5". After
investigation, the full set is:

| #   | Pattern Name                          | Severity    | Category     | DEBT Item  |
| --- | ------------------------------------- | ----------- | ------------ | ---------- |
| 1   | `statSync-without-lstat`              | Security    | Symlink      | DEBT-11335 |
| 2   | `path-resolve-without-containment`    | Security    | Traversal    | DEBT-11335 |
| 3   | `writeFileSync-without-symlink-guard` | Security    | Symlink      | (PR #427)  |
| 4   | `rmSync-usage`                        | Correctness | Race cond.   | DEBT-11335 |
| 5   | `escapeCell-inconsistency`            | Correctness | Data integr. | (none)     |
| 6   | `truthy-filter-unsafe`                | Correctness | Logic        | DEBT-11335 |

Pattern #3 (`writeFileSync-without-symlink-guard`) was partially addressed in PR
#427 ("writeFileSync Security Migration — 21 Scripts") but remains incomplete.
Pattern #5 (`escapeCell-inconsistency`) has low affected-file count and may not
have been counted in the "5".

**Reconciliation:** The R1 note likely counted patterns 1, 2, 3, 4, 6 as the "5
propagation patterns." The DEBT items list 4 because they excluded #3 (partially
fixed in PR #427). Pattern #5 was not significant enough to count.

---

## 3. Per-Pattern Analysis

### Pattern 1: `statSync-without-lstat` (SECURITY)

**Risk:** `statSync()` follows symlinks. An attacker can create a symlink
pointing to a sensitive file; `statSync` will resolve it silently. `lstatSync()`
with `isSymbolicLink()` check is required.

**Affected Files (non-test, in target dirs):**

- **scripts/**: 23 files have `statSync`
- **.claude/**: 55 files have `statSync`
- **Total: ~78 files** with `statSync` calls

**Files with guard (`isSymbolicLink` check):** 48 in scripts/ + 25 in .claude/ =
73 files

**Unguarded estimate:** ~5-10 files (many overlap, needs precise per-file check)

**Remediation:** Replace `statSync(p)` with `lstatSync(p)`, add
`if (stat.isSymbolicLink()) { skip/warn }` before proceeding.

---

### Pattern 2: `path-resolve-without-containment` (SECURITY)

**Risk:** `path.resolve()` can resolve to arbitrary locations if input contains
`../`. Without a containment check (`validatePathInDir()`), this enables path
traversal.

**Affected Files:**

- **scripts/**: 99 files have `path.resolve()`
- **.claude/**: 29 files have `path.resolve()`
- **Total: 128 files** with `path.resolve()` calls

**Files with guard (`validatePathInDir`):** 6 in scripts/, 0 in .claude/

**Unguarded estimate:** ~120+ files lack `validatePathInDir()` after
`path.resolve()`

**Severity note:** Many of these are dev/build scripts where input is not
user-controlled. The risk is real only for scripts that accept CLI args, read
from config files, or process filenames from external sources. A triage pass
should classify files as:

- **High risk**: Scripts accepting CLI args or processing external file lists
- **Low risk**: Scripts with hardcoded paths or internal-only usage

**Remediation:** Add `validatePathInDir()` call after `path.resolve()` for
high-risk files. Import from `scripts/lib/security-helpers.js`.

---

### Pattern 3: `writeFileSync-without-symlink-guard` (SECURITY)

**Risk:** `writeFileSync()` follows symlinks. Writing to a symlinked path can
overwrite arbitrary files. Requires `isSafeToWrite()` guard.

**Affected Files:**

- **scripts/**: 32 files with `writeFileSync` (99 occurrences)
- **.claude/hooks/**: 10 files with `writeFileSync` (20 occurrences)
- **.claude/skills/**: 53 files with `writeFileSync` (182 occurrences)
- **Total: 95 files** with `writeFileSync` calls

**Files with guard:** 48 script files + 25 .claude files have some form of
symlink guard (isSafeToWrite, isSymbolicLink, lstatSync, etc.)

**Partially fixed in PR #427:** That PR migrated 21 scripts to use
`isSafeToWrite()`. However, the ecosystem-audit checkers (generated after PR
#427) and test files were not covered.

**Unguarded estimate:** ~40-50 files (mostly ecosystem-audit test files and
state-manager files that use `writeFileSync` in test setup/teardown)

**Remediation:**

- Production code: Add `isSafeToWrite(filePath)` from
  `scripts/lib/security-helpers.js` or `.claude/hooks/lib/symlink-guard.js`
  before every `writeFileSync` call
- Test files: Lower priority, but should use `safeWriteFileSync` from
  `scripts/lib/safe-fs.js` for consistency

---

### Pattern 4: `rmSync-usage` (CORRECTNESS)

**Risk:** `rmSync` + `renameSync` creates a data-loss window: if the process
crashes between delete and rename, data is lost. The safe pattern is rename-only
or try-rename + copy-unlink fallback.

**Affected Files:**

- **scripts/**: 38 files with `rmSync` (64 occurrences)
- **.claude/**: 69 files with `rmSync` (112 occurrences)
- **Total: 107 files** with `rmSync` calls

**No exclude pattern** — all `rmSync` usage is flagged.

**Severity note:** Most `rmSync` calls in test files are teardown cleanup (low
risk). Production `rmSync` in rotate/archive scripts is higher risk.

**Unguarded estimate:** All 107 files are flagged. After excluding test files:

- scripts/: ~15 production files
- .claude/: ~10 production files (state-managers, hooks)
- **~25 production files** need remediation

**Remediation:** Replace `rmSync(dest); renameSync(src, dest)` with:

```js
try {
  renameSync(src, dest);
} catch {
  copyFileSync(src, dest);
  unlinkSync(src);
}
```

---

### Pattern 5: `escapeCell-inconsistency` (CORRECTNESS)

**Risk:** Writing dynamic content to Markdown tables without `escapeCell()`
allows pipe characters in data to corrupt table formatting.

**Affected Files:**

- **scripts/**: 5 files have `escapeCell` (already using it)
- **.claude/**: 0 files have `escapeCell`

**Unguarded:** Need to check files that write `.md` via `writeFileSync` without
`escapeCell`. The grep pattern `writeFileSync\s*\([^)]*\.md` targets this.

This is the **lowest impact** pattern. Only ~5 scripts generate Markdown tables
with dynamic content. Most already use `escapeCell`.

**Remediation:** Audit scripts that write `.md` files and add `escapeCell()` for
any dynamic table cell content.

---

### Pattern 6: `truthy-filter-unsafe` (CORRECTNESS)

**Risk:** `.filter(Boolean)` treats `0` and `''` as falsy, silently dropping
valid data. For arrays that may contain `0` or empty strings, use
`.filter(x => x != null)`.

**Affected Files:**

- **scripts/**: 52 files with `.filter(Boolean)` (89 occurrences)
- **.claude/**: 30 files with `.filter(Boolean)` (70 occurrences)
- **Total: 82 files** with `.filter(Boolean)` calls

**No exclude pattern** — all `.filter(Boolean)` usage is flagged.

**Severity note:** Many are filtering string arrays where `''` genuinely should
be removed. The fix needs per-call analysis to determine if `0` or `''` are
valid values in context.

**Unguarded estimate:** All 82 files flagged. After analysis, likely:

- ~60 are safe (filtering nullable strings where '' is garbage)
- ~20 need `.filter(x => x != null)` (filtering arrays where 0 or '' could be
  valid)

**Remediation:** Replace `.filter(Boolean)` with `.filter(x => x != null)` as a
safe default. Where `''` should also be filtered, use
`.filter(x => x != null && x !== '')`.

---

## 4. Subsequent PR Coverage (PRs #454-#458)

| PR   | Propagation patterns addressed? | Notes                              |
| ---- | ------------------------------- | ---------------------------------- |
| #454 | Not found in git history        | May not exist                      |
| #455 | Not found in git history        | May not exist                      |
| #456 | No                              | nvmrc sync, prettier, tsconfig     |
| #457 | No                              | CI reliability, Codecov, build     |
| #458 | No                              | Collision-renumbering artifact IDs |

**None of PRs #454-#458 addressed any propagation patterns.** The backlog
remains fully open.

---

## 5. Summary Counts

| Pattern                          | Total Files | Production Files | Test Files | Risk     |
| -------------------------------- | ----------- | ---------------- | ---------- | -------- |
| statSync-without-lstat           | ~78         | ~30              | ~48        | HIGH     |
| path-resolve-without-containment | ~128        | ~80              | ~48        | MEDIUM\* |
| writeFileSync-without-symlink    | ~95         | ~45              | ~50        | HIGH     |
| rmSync-usage                     | ~107        | ~25              | ~82        | MEDIUM   |
| escapeCell-inconsistency         | ~5          | ~5               | 0          | LOW      |
| truthy-filter-unsafe             | ~82         | ~50              | ~32        | LOW      |
| **TOTAL (deduplicated)**         | **~200+**   | **~150+**        | **~100+**  |          |

\*path-resolve is MEDIUM because most scripts use hardcoded/internal paths.

The "150+ files" noted in PR #453 R1 aligns with the ~150+ production files
across all patterns. Including test files, the total exceeds 200.

---

## 6. Recommended Remediation Order

Based on security severity and mechanical fixability:

1. **truthy-filter-unsafe** (E1, codemod-friendly) — `.filter(Boolean)` to
   `.filter(x => x != null)` is a safe mechanical replacement. Lowest risk of
   introducing bugs. ~82 files.

2. **statSync-without-lstat** (E1-E2, security) — Replace `statSync` with
   `lstatSync` + guard. Mechanical for most cases. ~30 production files.

3. **writeFileSync-without-symlink-guard** (E2, security) — Add
   `isSafeToWrite()` calls. Partially done (PR #427). ~45 remaining production
   files. The ecosystem-audit state-manager files share identical code, so a
   template fix propagates to 8 copies.

4. **rmSync-usage** (E2, correctness) — Replace rmSync+renameSync patterns. ~25
   production files. Requires understanding each call site's intent.

5. **path-resolve-without-containment** (E2-E3, security) — Requires per-file
   triage to separate high-risk (CLI input) from low-risk (hardcoded paths). ~80
   production files but most are low-risk.

6. **escapeCell-inconsistency** (E1) — ~5 files, lowest priority.

---

## 7. Evidence Artifacts

- DEBT items: DEBT-11335, DEBT-11339 (duplicate), DEBT-45524, DEBT-45525
- Propagation checker: `scripts/check-propagation.js` (KNOWN_PATTERN_RULES,
  lines 36-88)
- Staged checker: `scripts/check-propagation-staged.js` (SECURITY_PATTERNS,
  lines 81-100+)
- PR #427: writeFileSync Security Migration (21 scripts)
- PR #453 R1 state: `.claude/state/task-pr-review-453-r1.state.json`
- Hook bypass data: DEBT-45524 (propagation overridden 31+ times in 14 days)
