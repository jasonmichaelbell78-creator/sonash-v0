# 08 - Remediation Strategies for Propagation Pattern Failures

**Research Date:** 2026-03-20 **Status:** COMPLETE **Scope:** Internal codebase
analysis + external best practices

---

## Executive Summary

This codebase already has significant propagation detection infrastructure: two
dedicated scripts (`check-propagation.js`, `check-propagation-staged.js`),
pre-commit and pre-push hook integration, advisory file locking (`safe-fs.js`),
atomic write helpers, and 180+ enforced code patterns. The gaps are in
**detection coverage**, **CI enforcement**, **file integrity during concurrent
writes**, **pattern compliance breadth**, **TDMS consistency**, and **hook
pipeline performance**.

This document proposes 16 specific remediations organized by gap category, with
effort, impact, and priority ratings.

---

## 1. Internal Codebase Inventory

### 1.1 Existing Safety Helpers (`scripts/lib/`)

| File                  | What It Provides                                                                                                                                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `security-helpers.js` | `sanitizeError`, `safeWriteFile` (wx flag), `safeReadFile`, `safeGitAdd`, `safeGitCommit`, `validatePathInDir`, `refuseSymlinkWithParents`, `sanitizeFilename`, `parseCliArgs`, `validateUrl`, `safeRegexExec`, `maskEmail`, `escapeMd` |
| `sanitize-error.js`   | ESM canonical error sanitizer with SENSITIVE_PATTERNS array, `sanitizeErrorForJson`, `createSafeLogger`, `safeErrorMessage`                                                                                                             |
| `safe-fs.js`          | `safeWriteFileSync`, `safeAppendFileSync`, `safeRenameSync`, `safeAtomicWriteSync`, `readUtf8Sync`, advisory locking (`acquireLock`/`releaseLock`/`withLock`), `writeMasterDebtSync`, `appendMasterDebtSync` with rollback              |
| `read-jsonl.js`       | Per-line try/catch JSONL parsing, safe mode (returns [] on error)                                                                                                                                                                       |
| `validate-paths.js`   | `validateFilePath`, `verifyContainment`, `validateAndVerifyPath` with control char rejection, length caps, symlink-aware containment                                                                                                    |

### 1.2 Existing Propagation Detection

| Script                        | Hook                 | Mode                                   | What It Detects                                                                                                                                                                                                                   |
| ----------------------------- | -------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `check-propagation.js`        | pre-push (blocking)  | Function-level + 6 known pattern rules | Functions modified in one file but duplicated in others; `statSync` without lstat, `path.resolve` without containment, `writeFileSync` without symlink guard, `rmSync` usage, escapeCell inconsistency, `.filter(Boolean)` misuse |
| `check-propagation-staged.js` | pre-commit (warning) | Security pattern presence in siblings  | `sanitizeError`, `safeWriteFileSync`, `isSafeToWrite`, `lstatSync`, `validatePathInDir`, `refuseSymlink` patterns in staged file but not in unstaged siblings                                                                     |

### 1.3 Existing Pattern Enforcement

- **ESLint plugin (`eslint-plugin-sonash`)**: 13 custom rules covering file
  reads, symlinks, TOCTOU, atomic writes, path validation, error sanitization,
  shell injection, secrets, prototype pollution, regex safety
- **Semgrep**: 7 rules for file safety, regex state, path traversal, command
  injection, secrets, XSS
- **`npm run patterns:check`**: Enforces top-5 critical patterns as a CI gate
- **CODE_PATTERNS.md**: 180+ documented patterns with priority tiers
- **SECURITY_CHECKLIST.md**: Pre-write checklist with helper function
  cross-references

### 1.4 Existing File Integrity

- **Advisory locking** in `safe-fs.js`: `acquireLock`/`releaseLock`/`withLock`
  with stale lock detection (60s), PID-based ownership, symlink guards on lock
  files, hostname-aware cross-machine awareness
- **Atomic writes**: `safeAtomicWriteSync` (write to `.tmp`, rename),
  `atomicWriteViaTmp` (PID-suffixed tmp)
- **MASTER_DEBT dual-write**: `writeMasterDebtSync`/`appendMasterDebtSync` with
  rollback on partial failure
- **BOM stripping**: `readUtf8Sync` for consistent cross-platform reads

---

## 2. Gap Analysis and Remediations

### Gap 1: Detection Coverage Gaps

**Problem:** The propagation check scripts only scan `scripts/`,
`.claude/skills/`, and `.claude/hooks/`. Application source code (`lib/`,
`app/`, `components/`, `functions/src/`) is not scanned for duplicate functions
or security pattern propagation.

#### Remediation 1A: Expand SEARCH_DIRS in `check-propagation.js`

**Effort:** S (1 line change) **Impact:** Catches propagation misses in
application code (the majority of the codebase) **Priority:** Do first

```javascript
// Current
const SEARCH_DIRS = ["scripts/", ".claude/skills/", ".claude/hooks/"];

// Proposed
const SEARCH_DIRS = [
  "scripts/",
  ".claude/skills/",
  ".claude/hooks/",
  "lib/",
  "app/",
  "components/",
  "functions/src/",
];
```

**Risk:** More false positives from generic function names in app code. Mitigate
by expanding the `GENERIC_NAMES` set.

#### Remediation 1B: Add jscpd for structural clone detection

**Effort:** M (install + config + CI integration) **Impact:** Detects
copy-pasted code blocks that the function-name-based check misses **Priority:**
Do later

[jscpd](https://github.com/kucherenko/jscpd) uses the Rabin-Karp algorithm to
detect duplicated blocks across 150+ languages. It works as a complement to the
function-name approach -- it finds structural duplicates even when function
names differ.

```jsonc
// .jscpd.json
{
  "threshold": 3,
  "reporters": ["console", "json"],
  "ignore": [
    "node_modules",
    "dist",
    ".next",
    "scripts/reviews/dist",
    "**/*.test.*",
    "**/*.spec.*",
  ],
  "minLines": 5,
  "minTokens": 50,
  "output": ".planning/reports",
  "format": ["javascript", "typescript", "tsx"],
}
```

Add to `package.json`:

```json
{
  "scripts": {
    "duplication:check": "jscpd --config .jscpd.json",
    "duplication:report": "jscpd --config .jscpd.json --reporters json --output .planning/reports"
  }
}
```

**Integration with SonarCloud:** SonarCloud already tracks duplication metrics.
Adding jscpd provides local pre-push detection before code reaches SonarCloud,
catching issues earlier. Set SonarCloud quality gate threshold to 1% duplicated
lines on new code (down from default 3%).

---

### Gap 2: CI Pipeline Lacks Propagation Gate

**Problem:** Propagation checks run in local hooks (pre-commit, pre-push) but
NOT in CI. If a developer bypasses hooks (e.g., `--no-verify`), propagation
misses reach the PR undetected. The `.github/workflows/ci.yml` has no
propagation step.

#### Remediation 2A: Add propagation check to CI workflow

**Effort:** S (add workflow step) **Impact:** Prevents any propagation miss from
merging, regardless of local hook status **Priority:** Do first

```yaml
# In .github/workflows/ci.yml
- name: Propagation check
  run: node scripts/check-propagation.js --blocking
```

#### Remediation 2B: Add jscpd threshold to CI quality gate

**Effort:** S (after jscpd is installed) **Impact:** Blocks PRs that introduce
significant code duplication **Priority:** Do later (after 1B)

```yaml
- name: Code duplication check
  run: npx --no-install jscpd --config .jscpd.json --threshold 3
```

#### Remediation 2C: SonarCloud quality gate tightening

**Effort:** S (configuration change) **Impact:** Enforces duplication limits at
the SonarCloud level as defense-in-depth **Priority:** Do later

Set `Duplicated Lines (%) on New Code` to 1.0% in SonarCloud quality gate
settings (the
[Sonar documentation](https://docs.sonarsource.com/sonarqube-cloud/standards/managing-quality-gates/introduction-to-quality-gates)
recommends stricter thresholds for high-quality codebases).

---

### Gap 3: JSONL File Concurrent Write Safety

**Problem:** The advisory locking in `safe-fs.js` is well-implemented but has
scope limitations:

1. Only `writeMasterDebtSync`/`appendMasterDebtSync` use it -- other JSONL
   writers (hook-runs.jsonl, hook-warnings-log.jsonl, review-metrics.jsonl) do
   NOT use locking
2. The lock mechanism uses `O_EXCL` (`wx` flag) which has known NFS race
   conditions (though not a concern for this single-machine CLI project)
3. No queuing for concurrent async writes to the same file

#### Remediation 3A: Centralize all JSONL append operations through `safe-fs.js`

**Effort:** M (audit all JSONL writers, refactor to use `withLock`) **Impact:**
Prevents data corruption in all state files (currently ~8 JSONL files at risk)
**Priority:** Do first

Create a generic `safeAppendJsonlSync` helper:

```javascript
/**
 * Append a JSON object as a JSONL line with advisory locking.
 * @param {string} filePath - Target JSONL file
 * @param {object} item - Object to serialize and append
 */
function safeAppendJsonlSync(filePath, item) {
  const line = JSON.stringify(item) + "\n";
  withLock(filePath, () => {
    safeAppendFileSync(filePath, line);
  });
}
```

Then replace all direct `appendFileSync` calls to JSONL files with this helper.

#### Remediation 3B: Consider `proper-lockfile` for cross-process safety

**Effort:** S (npm install + wrapper) **Impact:** More robust locking if
multiple processes write concurrently **Priority:** Nice to have

The [proper-lockfile](https://github.com/moxystudio/node-proper-lockfile)
library uses `mkdir` for atomic lock acquisition (works on NFS), with stale lock
detection via mtime monitoring. However, the current `safe-fs.js` implementation
is already robust for the single-machine, single-user CLI use case. Only
consider this if multi-process scenarios emerge.

#### Remediation 3C: Atomic write pattern for state files

**Effort:** S (use existing `safeAtomicWriteSync` consistently) **Impact:**
Prevents partial writes on crash/interrupt for critical state files
**Priority:** Do first

Audit all state file writers (not just MASTER_DEBT) and ensure they use
`safeAtomicWriteSync` for full-rewrite operations and `withLock` +
`safeAppendFileSync` for append operations. Key files:

- `.claude/state/review-metrics.jsonl`
- `.claude/state/hook-runs.jsonl`
- `.claude/state/hook-warnings-log.jsonl`
- `docs/technical-debt/MASTER_DEBT.jsonl` (already protected)

---

### Gap 4: Pattern Compliance Breadth

**Problem:** The `check-propagation.js` KNOWN_PATTERN_RULES array has 6 rules,
but CODE_PATTERNS.md documents 180+ patterns. Many critical patterns (error
sanitization, regex state leaks, prototype pollution, SSRF allowlisting) have no
propagation rule.

#### Remediation 4A: Expand KNOWN_PATTERN_RULES with top-priority patterns

**Effort:** M (add rules, test for false positives) **Impact:** Catches more
propagation failures for the most dangerous patterns **Priority:** Do first

Proposed additions:

```javascript
const ADDITIONAL_PATTERN_RULES = [
  {
    name: "raw-error-log",
    searchPattern: String.raw`console\.(error|warn)[[:space:]]*\([^)]*error\.(message|stack)`,
    excludeFilePattern: /sanitizeError\s*\(/,
    description: "Raw error.message in console output — use sanitizeError()",
    recommended: "Import sanitizeError from scripts/lib/sanitize-error.js",
  },
  {
    name: "exec-sync-shell",
    searchPattern: String.raw`(^|[^[:alnum:]_$])execSync[[:space:]]*\(`,
    excludeFilePattern: /execFileSync\s*\(/,
    description:
      "execSync allows shell interpretation — use execFileSync with args array",
    recommended:
      "Replace execSync() with execFileSync('cmd', ['arg1', 'arg2'])",
  },
  {
    name: "object-bracket-untrusted",
    searchPattern: String.raw`\[[[:space:]]*[a-zA-Z_$][a-zA-Z0-9_$]*Key`,
    excludeFilePattern: /(?:new Map|Object\.create\(null\))/,
    description: "Bracket notation with dynamic key — prototype pollution risk",
    recommended: "Use new Map() or Object.create(null) for untrusted keys",
  },
  {
    name: "regex-global-exec-loop",
    searchPattern: String.raw`while[[:space:]]*\([^)]*\.exec[[:space:]]*\(`,
    excludeFilePattern: /lastIndex\s*=\s*0/,
    description:
      "exec() in while loop without lastIndex reset — infinite loop risk",
    recommended: "Reset pattern.lastIndex = 0 before the loop, ensure /g flag",
  },
  {
    name: "appendFileSync-without-lock",
    searchPattern: String.raw`(^|[^[:alnum:]_$])appendFileSync[[:space:]]*\(`,
    excludeFilePattern: /(?:withLock|acquireLock)\s*\(/,
    description: "appendFileSync without advisory lock — concurrent write risk",
    recommended: "Use withLock() from safe-fs.js around append operations",
  },
];
```

#### Remediation 4B: Auto-generate propagation rules from CODE_PATTERNS.md

**Effort:** L (parser + rule generator) **Impact:** Keeps propagation rules in
sync with documented patterns automatically **Priority:** Nice to have

Build a script that parses CODE_PATTERNS.md and generates KNOWN_PATTERN_RULES
entries for patterns with priority "Critical". This eliminates the manual sync
problem between documentation and enforcement.

---

### Gap 5: TDMS (Technical Debt Management System) Consistency

**Problem:** The MASTER_DEBT dual-write system
(`writeMasterDebtSync`/`appendMasterDebtSync`) protects against split-brain
between `MASTER_DEBT.jsonl` and `deduped.jsonl`, but:

1. The rollback mechanism uses `truncateSync` which can leave partial JSON lines
2. No checksum verification after writes to confirm integrity
3. Other scripts that read MASTER_DEBT don't verify consistency with deduped

#### Remediation 5A: Add integrity verification to MASTER_DEBT operations

**Effort:** M (add checksum + line-count validation) **Impact:** Detects silent
corruption before it propagates through the TDMS pipeline **Priority:** Do later

```javascript
/**
 * Verify MASTER_DEBT and deduped.jsonl are consistent.
 * @returns {{ valid: boolean, masterCount: number, dedupedCount: number, error?: string }}
 */
function verifyDebtIntegrity(options) {
  const masterPath = options?.masterPath || DEFAULT_MASTER_PATH;
  const dedupedPath = options?.dedupedPath || DEFAULT_DEDUPED_PATH;

  const masterItems = readJsonl(masterPath, { safe: true });
  const dedupedItems = readJsonl(dedupedPath, { safe: true });

  if (masterItems.length !== dedupedItems.length) {
    return {
      valid: false,
      masterCount: masterItems.length,
      dedupedCount: dedupedItems.length,
      error: `Line count mismatch: MASTER=${masterItems.length}, deduped=${dedupedItems.length}`,
    };
  }

  return {
    valid: true,
    masterCount: masterItems.length,
    dedupedCount: dedupedItems.length,
  };
}
```

#### Remediation 5B: JSONL line-level integrity (newline-terminated writes)

**Effort:** S (verify all JSONL writers end with newline) **Impact:** Prevents
line corruption when `truncateSync` rollback splits a line **Priority:** Do
first

Audit: `writeMasterDebtSync` already appends `\n`. Ensure ALL JSONL writers
follow the same pattern. The `safeAppendJsonlSync` helper from Remediation 3A
enforces this by design.

---

### Gap 6: Hook Pipeline Performance and Architecture

**Problem:** The pre-commit hook runs checks sequentially. Adding more
propagation checks increases commit time, discouraging frequent commits.

#### Remediation 6A: Parallel check execution in hooks

**Effort:** M (refactor hook pipeline) **Impact:** Maintains fast commit times
even as checks are added **Priority:** Do later

**Option A: Custom parallel execution in bash:**

```bash
# Run independent checks in parallel
node scripts/check-propagation-staged.js &
PID_PROP=$!
node scripts/check-pattern-compliance.js &
PID_PAT=$!

# Wait and collect exit codes
wait $PID_PROP; PROP_EXIT=$?
wait $PID_PAT; PAT_EXIT=$?
```

**Option B: Migrate to [Lefthook](https://github.com/evilmartians/lefthook):**

Lefthook is a Go-based hook manager with native parallel execution support, ~10x
faster than Husky for large projects. Configuration example:

```yaml
# lefthook.yml
pre-commit:
  parallel: true
  commands:
    propagation-staged:
      run: node scripts/check-propagation-staged.js
      glob: "*.{js,mjs,ts,tsx}"
    pattern-compliance:
      run: npm run patterns:check
      glob: "*.{js,mjs,ts,tsx}"
    eslint:
      run: npx eslint {staged_files}
      glob: "*.{js,mjs,ts,tsx}"
```

**Recommendation:** Option A (custom parallel) is lower-effort and doesn't
require replacing Husky. Option B (Lefthook) is the better long-term
architecture but requires migration effort. Start with A, evaluate B when hook
count exceeds 8.

#### Remediation 6B: Incremental propagation checking

**Effort:** M (cache + diff-based optimization) **Impact:** Reduces propagation
check time from O(all files) to O(changed files) **Priority:** Nice to have

Cache the function-to-file mapping in a `.planning/cache/propagation-index.json`
file. On each run, only re-scan files that have changed since the last index
build. Invalidate on branch switch or rebase.

---

### Gap 7: Error Sanitization Duplication

**Problem:** There are THREE implementations of error sanitization:

1. `scripts/lib/sanitize-error.js` (ESM, canonical)
2. `scripts/lib/security-helpers.js` (CJS, simplified duplicate)
3. `scripts/lib/validate-paths.js` (CJS, `sanitizeFilesystemError` -- different
   approach)

Plus inline fallback implementations in `check-propagation-staged.js` and likely
other scripts. This is itself a propagation problem -- if a new sensitive
pattern is added to one sanitizer, the others miss it.

#### Remediation 7A: Consolidate to single sanitizer with CJS/ESM compatibility

**Effort:** M (refactor imports across ~30 files) **Impact:** Eliminates the
root cause of sanitization inconsistency **Priority:** Do first

**Approach:**

1. Make `sanitize-error.js` the single source of truth (it already is, per
   CLAUDE.md)
2. Add a CJS wrapper: `sanitize-error.cjs` that re-exports with `module.exports`
3. Update `security-helpers.js` to import from `sanitize-error.cjs` instead of
   reimplementing
4. Update `validate-paths.js` to use the canonical sanitizer
5. Add a propagation rule that detects `sanitizeFilesystemError` and flags it as
   non-canonical

#### Remediation 7B: Add a `patterns:check` rule for sanitizer duplication

**Effort:** S (add pattern rule) **Impact:** Catches future re-implementations
of sanitization logic **Priority:** Do first

Add to `check-pattern-compliance.js`:

```javascript
{
  name: "duplicate-sanitizer",
  pattern: /function\s+sanitize\w*Error\s*\(/,
  allowedFiles: ["scripts/lib/sanitize-error.js"],
  message: "Error sanitizer must use scripts/lib/sanitize-error.js — do not reimplement",
}
```

---

### Gap 8: Cross-File Dependency Tracking

**Problem:** When a shared helper (e.g., `safeWriteFileSync`) changes its API,
callers may break silently if they're not updated. The propagation check catches
function _name_ duplicates but not _API contract_ changes.

#### Remediation 8A: TypeScript type checking for shared helpers

**Effort:** L (add .d.ts files for CJS helpers) **Impact:** Catches API
mismatches at build time **Priority:** Nice to have

Create `.d.ts` declaration files for `security-helpers.js`, `safe-fs.js`, and
`sanitize-error.js`. The TypeScript compiler will then catch callers using stale
API signatures.

#### Remediation 8B: Import graph analysis in propagation check

**Effort:** L (dependency parser + change propagation) **Impact:** Automatically
identifies files that need review when a shared helper changes **Priority:**
Nice to have

Use Node.js module resolution to build an import graph of `scripts/lib/`
consumers. When a lib file is in the diff, flag all importers that aren't also
in the diff.

---

## 3. Remediation Priority Matrix

### Tier 1: Do First (high impact, low-medium effort)

| #   | Remediation                                | Effort | Impact                        | Fixes              |
| --- | ------------------------------------------ | ------ | ----------------------------- | ------------------ |
| 1A  | Expand SEARCH_DIRS                         | S      | Catches app-code propagation  | Detection gap      |
| 2A  | Add propagation check to CI                | S      | Prevents hook bypass          | CI cascade         |
| 3A  | Centralize JSONL append with locking       | M      | Protects ~8 state files       | File overwrite     |
| 3C  | Audit state file writers for atomic writes | S      | Prevents partial writes       | File overwrite     |
| 4A  | Expand KNOWN_PATTERN_RULES                 | M      | Catches 5+ more pattern types | Pattern compliance |
| 5B  | Verify all JSONL writers end with newline  | S      | Prevents line corruption      | TDMS trap          |
| 7A  | Consolidate error sanitizers               | M      | Eliminates root duplication   | Pattern compliance |
| 7B  | Add duplicate-sanitizer pattern rule       | S      | Prevents future re-impl       | Pattern compliance |

### Tier 2: Do Later (medium impact, medium effort)

| #   | Remediation                              | Effort | Impact                          | Fixes         |
| --- | ---------------------------------------- | ------ | ------------------------------- | ------------- |
| 1B  | Add jscpd for structural clone detection | M      | Detects non-function duplicates | Detection gap |
| 2B  | Add jscpd threshold to CI                | S      | Blocks duplication in PRs       | CI cascade    |
| 2C  | Tighten SonarCloud duplication gate      | S      | Defense-in-depth                | CI cascade    |
| 5A  | Add MASTER_DEBT integrity verification   | M      | Detects silent corruption       | TDMS trap     |
| 6A  | Parallel check execution in hooks        | M      | Maintains fast commit times     | Hook gap      |

### Tier 3: Nice to Have (high effort or niche impact)

| #   | Remediation                               | Effort | Impact                             | Fixes              |
| --- | ----------------------------------------- | ------ | ---------------------------------- | ------------------ |
| 3B  | Evaluate proper-lockfile                  | S      | More robust cross-process locks    | File overwrite     |
| 4B  | Auto-generate rules from CODE_PATTERNS.md | L      | Self-maintaining propagation rules | Pattern compliance |
| 6B  | Incremental propagation checking          | M      | Faster checks on large diffs       | Hook gap           |
| 8A  | TypeScript .d.ts for CJS helpers          | L      | Catches API contract changes       | Detection gap      |
| 8B  | Import graph analysis                     | L      | Identifies stale callers           | Detection gap      |

---

## 4. External Tools Reference

### Code Clone Detection

| Tool                                                           | Type     | Integration                        | Notes                                                                      |
| -------------------------------------------------------------- | -------- | ---------------------------------- | -------------------------------------------------------------------------- |
| [jscpd](https://github.com/kucherenko/jscpd)                   | CLI + CI | npm package, `.jscpd.json` config  | Rabin-Karp algorithm, 150+ languages, threshold-based CI gate, MCP support |
| [SonarCloud](https://www.sonarsource.com/products/sonarcloud/) | Cloud CI | Already integrated in this project | Tracks duplicated lines %, quality gate support, AI CodeFix suggestions    |
| [PMD CPD](https://pmd.github.io/)                              | CLI      | Java-based, works on JS/TS         | More configurable than jscpd, heavier setup                                |
| [CodeClimate](https://codeclimate.com/)                        | Cloud CI | GitHub integration                 | Duplication detection + maintainability scoring                            |

### File Locking / Atomic Writes

| Tool                                                                  | Pattern                                | Best For                              |
| --------------------------------------------------------------------- | -------------------------------------- | ------------------------------------- |
| Built-in `safe-fs.js`                                                 | Advisory lock via `wx` + JSON metadata | Current use case (single-user CLI)    |
| [proper-lockfile](https://github.com/moxystudio/node-proper-lockfile) | `mkdir`-based lock + mtime staleness   | Cross-process, NFS-safe scenarios     |
| [write-file-atomic](https://github.com/npm/write-file-atomic)         | tmp + rename + queue serialization     | Concurrent async writes to same file  |
| [steno](https://github.com/typicode/steno)                            | Smart queue + atomic write             | High-frequency writes (used by lowdb) |

### Hook Management

| Tool                                                 | Parallel        | Language    | Notes                                                 |
| ---------------------------------------------------- | --------------- | ----------- | ----------------------------------------------------- |
| Husky (current)                                      | No (sequential) | JS/Shell    | Industry standard for Node.js, simple setup           |
| [Lefthook](https://github.com/evilmartians/lefthook) | Yes (native)    | Go binary   | ~10x faster, parallel execution, monorepo support     |
| [Prek](https://github.com/prek-org/prek)             | Yes (native)    | Rust binary | ~7x faster than pre-commit framework, newer           |
| [pre-commit](https://pre-commit.com/)                | No (sequential) | Python      | Largest ecosystem, cross-language, no native parallel |

---

## 5. Implementation Sequence

Recommended order for maximum impact with minimum disruption:

```
Phase 1 (Sprint 1): Foundation fixes
  1A  Expand SEARCH_DIRS ................... 30 min
  2A  Add propagation to CI ................ 30 min
  5B  Audit JSONL newline termination ...... 1 hr
  7B  Add duplicate-sanitizer rule ......... 30 min
  3C  Audit state file atomic writes ....... 2 hr

Phase 2 (Sprint 2): Consolidation
  7A  Consolidate error sanitizers ......... 4 hr
  4A  Expand KNOWN_PATTERN_RULES ........... 3 hr
  3A  Centralize JSONL append with locking . 4 hr

Phase 3 (Sprint 3): Tooling
  1B  Install and configure jscpd .......... 2 hr
  2B  Add jscpd to CI ...................... 30 min
  2C  Tighten SonarCloud gate .............. 30 min
  5A  MASTER_DEBT integrity verification ... 3 hr

Phase 4 (Future): Architecture
  6A  Parallel hook execution .............. 4 hr
  6B  Incremental propagation cache ........ 4 hr
  4B  Auto-generate rules from docs ........ 8 hr
  8A  TypeScript .d.ts for CJS helpers ..... 6 hr
  8B  Import graph analysis ................ 8 hr
```

**Total estimated effort:** ~46 hours across 4 phases **Phase 1 alone:** ~4.5
hours for the highest-impact fixes

---

## 6. Key Takeaways

1. **The biggest bang-for-buck is Remediation 1A + 2A**: expanding detection
   scope and adding CI enforcement. These are each 30-minute changes that close
   the two largest gaps.

2. **Error sanitizer duplication (Gap 7) is itself a propagation failure**: the
   codebase has three implementations of the same pattern. Consolidating them is
   both a fix and a proof-of-concept for the detection system.

3. **The advisory locking in `safe-fs.js` is well-designed** but underutilized.
   Most JSONL writers bypass it. Remediation 3A centralizes through the existing
   infrastructure.

4. **jscpd fills the structural-clone gap** that function-name-based detection
   cannot cover. It's a complementary tool, not a replacement for the existing
   `check-propagation.js`.

5. **Hook performance is not yet a bottleneck** but will become one as checks
   are added. Plan for parallel execution (Remediation 6A) before the hook count
   exceeds 8 sequential checks.

---

## Sources

- [jscpd - Copy/Paste Detector](https://github.com/kucherenko/jscpd)
- [proper-lockfile - npm](https://www.npmjs.com/package/proper-lockfile)
- [write-file-atomic - GitHub](https://github.com/npm/write-file-atomic)
- [Lefthook - GitHub](https://github.com/evilmartians/lefthook)
- [SonarQube Cloud Quality Gates](https://docs.sonarsource.com/sonarqube-cloud/standards/managing-quality-gates/introduction-to-quality-gates)
- [Understanding Node.js file locking - LogRocket](https://blog.logrocket.com/understanding-node-js-file-locking/)
- [Effortless Code Quality: Pre-Commit Hooks Guide 2025](https://gatlenculp.medium.com/effortless-code-quality-the-ultimate-pre-commit-hooks-guide-for-2025-57ca501d9835)
- [Husky vs Lefthook vs lint-staged 2026](https://www.pkgpulse.com/blog/husky-vs-lefthook-vs-lint-staged-git-hooks-nodejs-2026)
- [SonarQube in 2025: Ultimate Guide](https://medium.com/@lamjed.gaidi070/sonarqube-in-2025-the-ultimate-guide-to-code-quality-ci-cd-integration-alerting-43e96018d36f)
- [DRY Principle in AI-Generated Code - Faros AI](https://www.faros.ai/blog/ai-generated-code-and-the-dry-principle)
- [What Is Code Duplication - CodeAnt](https://www.codeant.ai/blogs/stop-code-duplication-developers-guide)
