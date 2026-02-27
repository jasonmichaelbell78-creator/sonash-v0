# Mining Agent 2: Pipeline Flow & Promotion Analysis

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-27
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Generated:** 2026-02-27 **Source files analyzed:** consolidation.json,
run-consolidation.js, promote-patterns.js, check-pattern-compliance.js,
CODE_PATTERNS.md, FIX_TEMPLATES.md, SECURITY_CHECKLIST.md, CLAUDE.md

---

## 1. Consolidation History

**State file:** `.claude/state/consolidation.json`

| Field                  | Value                             |
| ---------------------- | --------------------------------- |
| consolidationNumber    | 4 (per state file)                |
| lastConsolidatedReview | 406                               |
| lastDate               | 2026-02-27                        |
| threshold              | 10 reviews triggers consolidation |

However, the **Version History in CODE_PATTERNS.md** tells a different story. It
records consolidation numbers that conflict with the state file:

| Version History Entry | Consolidation #           | Reviews            | Date       |
| --------------------- | ------------------------- | ------------------ | ---------- |
| v1.0                  | Initial (from 60 reviews) | —                  | 2026-01-05 |
| v1.1                  | #6                        | #61-72             | 2026-01-06 |
| v1.2                  | #7                        | #73-82             | 2026-01-07 |
| v1.3                  | #8                        | #83-97             | 2026-01-07 |
| v1.4                  | #9                        | #98-108            | 2026-01-09 |
| v1.5                  | (manual)                  | #117-120           | 2026-01-11 |
| v1.6                  | #10                       | #109-120           | 2026-01-11 |
| v1.7                  | #11                       | #121-136           | 2026-01-12 |
| v1.8                  | #12                       | #144-153           | 2026-01-15 |
| v2.0                  | #13                       | #137-143, #154-179 | 2026-01-18 |
| v2.4                  | #15                       | #202-212           | 2026-01-29 |
| v2.5                  | #16                       | #213-224           | 2026-02-02 |
| v2.6                  | #17                       | #254-265           | 2026-02-07 |
| v2.7                  | #18                       | #266-284           | 2026-02-10 |
| v3.7                  | #2                        | #1-399             | 2026-02-27 |

**Critical finding: Consolidation numbering was RESET.** The version history
shows consolidations #6 through #18 (13 consolidation runs under the old
system). Then the state file shows consolidation #2 and #4 under the new
JSONL-based system (v2, `run-consolidation.js`). The consolidation counter was
reset when the system was rewritten, meaning the current
`consolidationNumber: 4` does NOT represent 4 total consolidations -- it
represents 4 consolidations under the new system, plus ~13 under the old system
= ~17 total consolidation runs.

**Output directory:** `consolidation-output/suggested-rules.md` exists with 22
suggested patterns from the most recent consolidation (Reviews #1-#399). These
are TODO templates -- none have been converted to actual compliance checker
rules.

**Yield per consolidation:** The version history records specific pattern
counts:

- Consolidation #6: 10 patterns (Documentation)
- Consolidation #7: 9 patterns
- Consolidation #8: 6 patterns (Security Audit)
- Consolidation #9: 18 patterns
- Consolidation #10: 5 patterns
- Consolidation #11: 15 patterns
- Consolidation #12: 23 patterns
- Consolidation #13: 22 patterns
- Consolidation #14: 50 patterns
- Consolidation #15: 11 patterns (React + Security)
- Consolidation #16: 22 patterns
- Consolidation #17: 23 patterns
- Consolidation #18: 7 patterns
- New system Consolidation #2: 6 patterns

**Total patterns added via consolidation: ~227 patterns across ~17 runs.**

---

## 2. Pattern Promotion Audit

### CODE_PATTERNS.md Stats

- **Document Version:** 3.7
- **Source:** 347 AI code reviews (per header)
- **Total sections:** 12 category sections (Bash/Shell, npm/Dependencies,
  Security, GitHub Actions, JavaScript/TypeScript, CI/Automation, Git, Process
  Management, Documentation, Security Audit, React/Frontend, General)
- **Total subsection patterns (### headings):** 11 (5 critical quick-ref + 6
  auto-added by consolidation #2)

The patterns are organized in two formats:

1. **Table rows** -- the bulk of patterns, organized in
   `| Priority | Pattern | Rule | Why |` tables within each section
2. **### Headings** -- a few patterns added by consolidation as standalone
   subsections

### Pattern Counts by Section (table-row patterns)

| Section               | Approximate Row Count       |
| --------------------- | --------------------------- |
| Bash/Shell            | 22                          |
| npm/Dependencies      | 5                           |
| Security              | 91                          |
| GitHub Actions        | 8                           |
| JavaScript/TypeScript | 38                          |
| CI/Automation         | 27                          |
| Git                   | 5                           |
| Process Management    | 12                          |
| Documentation         | 17                          |
| Security Audit        | 8                           |
| React/Frontend        | 22                          |
| General               | 14                          |
| **Total**             | **~269 table-row patterns** |

Plus 6 consolidation-added patterns (Refactor, Fail Closed, CC Reduction,
Propagation, Gemini, Cross Platform) = **~275 total patterns**.

### Auto-Promoted vs Manually Added

**promote-patterns.js** (`scripts/promote-patterns.js`) is the dedicated
promotion tool. It:

- Reads `reviews.jsonl`, counts pattern slugs across all reviews
- Filters by minimum occurrence threshold (default: 3)
- Fuzzy-matches against existing CODE_PATTERNS.md slugs to avoid duplicates
- Appends new patterns to an "Auto-Promoted Patterns" section

**Auto-promoted patterns found in CODE_PATTERNS.md:** 6 patterns (added by
consolidation #2 on 2026-02-27):

- Cross Platform (4 reviews)
- Refactor (3 reviews)
- Fail Closed (4 reviews)
- CC Reduction (4 reviews)
- Propagation (3 reviews)
- Gemini (4 reviews)

**All other ~269 patterns were manually added** through PR retros, session
discoveries, and consolidation-but-manually-curated additions. The
auto-promotion pathway was only recently deployed and has only run once
successfully.

**No promotion log or history file exists.** There is no persistent record of
promotion decisions (accepted, rejected, already-documented). The only trace is
the version history in CODE_PATTERNS.md itself.

---

## 3. Enforcement Coverage

### check-pattern-compliance.js Stats

**Active pattern checker IDs (from `id:` fields):** 43 distinct patterns

| ID                             | Severity Category |
| ------------------------------ | ----------------- |
| exit-code-capture              | Bash              |
| for-file-iteration             | Bash              |
| missing-trap                   | Bash              |
| retry-loop-no-success-tracking | Bash              |
| npm-install-automation         | npm               |
| regex-global-test-loop         | JS                |
| unsafe-interpolation           | Security          |
| hardcoded-temp-path            | Security          |
| implicit-if-expression         | JS                |
| fragile-bot-detection          | CI                |
| simple-path-traversal-check    | Security          |
| unsanitized-error-response     | Security          |
| missing-rate-limit-comment     | App               |
| path-join-without-containment  | Security          |
| error-without-first-line       | JS                |
| console-log-file-content       | Security          |
| split-newline-without-cr-strip | JS                |
| regex-newline-lookahead        | JS                |
| path-split-without-normalize   | JS                |
| auto-mode-slice-truncation     | JS                |
| readline-no-close              | JS                |
| missing-array-isarray          | JS                |
| exec-without-global            | JS                |
| git-without-separator          | Security          |
| process-exit-without-cleanup   | JS                |
| missing-bom-handling           | JS                |
| unbounded-file-read            | JS                |
| startswith-slash-check         | Security          |
| git-diff-no-filter             | Git               |
| xargs-without-guard            | Bash              |
| unanchored-enum-regex          | JS                |
| rename-without-remove          | JS                |
| throw-after-sanitize           | Security          |
| write-without-symlink-guard    | Security          |
| atomic-write-missing-tmp-guard | Security          |
| no-raw-fs-write                | Security          |
| jsonl-parse-no-try-catch       | JS                |
| rename-no-fallback             | JS                |
| session-id-no-validation       | Security          |
| happy-path-only                | Quality           |
| ai-todo-markers                | Quality           |
| session-boundary               | Quality           |
| overconfident-security         | Quality           |
| naive-data-fetch               | Quality           |
| unbounded-query                | Quality           |
| unsection-scoped-table-regex   | JS                |
| audit-log-missing-context      | Security          |
| logical-or-numeric-fallback    | JS                |
| regex-complexity-s5852         | Security          |

**Migrated to ESLint (no longer in regex checker):** 22 patterns moved to custom
ESLint rules under `sonash/` prefix:

- no-unsafe-error-access, no-catch-console-error, no-path-startswith,
  no-hardcoded-secrets, no-unsafe-innerhtml, no-sql-injection,
  no-unguarded-file-read, no-empty-path-check, no-test-mock-firestore,
  no-unguarded-loadconfig, no-non-atomic-write, no-object-assign-json,
  no-unbounded-regex, no-unescaped-regexp-input, no-raw-error-log,
  no-shell-injection, no-writefile-missing-encoding, no-index-key,
  no-div-onclick-no-role, no-math-max-spread, no-unsafe-division,
  no-trivial-assertions, no-hallucinated-api

**Total enforced patterns: 43 (regex) + 22 (ESLint) = 65 patterns with automated
enforcement.**

### Enforcement Coverage Rate

- **Total documented patterns in CODE_PATTERNS.md:** ~275
- **Total enforced patterns:** ~65
- **Coverage rate: ~24%**

This means **~76% of documented patterns have NO automated enforcement** -- they
rely entirely on the AI agent reading CODE_PATTERNS.md and following
instructions.

### Patterns Enforced vs Not Enforced (sampling)

**Enforced (examples):**

- Error sanitization (unsanitized-error-response)
- Path traversal (simple-path-traversal-check, path-join-without-containment)
- exec() /g flag (exec-without-global)
- Git -- separator (git-without-separator)
- Symlink guards (write-without-symlink-guard, atomic-write-missing-tmp-guard)
- File read try/catch (migrated to ESLint no-unguarded-file-read)

**NOT enforced (examples):**

- Prototype pollution (documented but no checker)
- SSRF allowlist (documented but no checker)
- PII masking (documented but no checker)
- Defense-in-depth bypass (documented but no checker)
- Unicode line separators (documented but no checker)
- Most React/Frontend patterns (22 patterns, only 2 migrated to ESLint)
- Most Process Management patterns (12 patterns, 0 enforced)
- All Documentation patterns (17 patterns, 0 enforced)
- All Security Audit patterns (8 patterns, 0 enforced)

---

## 4. Pattern Sync Analysis

### Cross-file Consistency Check

| Pattern              | CLAUDE.md S4 | CODE_PATTERNS.md    | check-pattern-compliance.js          | SECURITY_CHECKLIST.md   | FIX_TEMPLATES.md            |
| -------------------- | ------------ | ------------------- | ------------------------------------ | ----------------------- | --------------------------- |
| Error sanitization   | Yes          | Yes (Critical #1)   | Yes (unsanitized-error-response)     | Yes (Error section)     | Yes (Template #3, #15)      |
| Path traversal       | Yes          | Yes (Critical #2)   | Yes (simple-path-traversal-check)    | Yes (Path section)      | Yes (Template #2, #9)       |
| Test mocking         | Yes          | Yes (Critical #5)   | Migrated to ESLint                   | No                      | No                          |
| File reads try/catch | Yes          | Yes (Critical #3)   | Migrated to ESLint                   | Yes (File Read section) | Yes (Template #1)           |
| exec() /g flag       | Yes          | Yes (Critical #4)   | Yes (exec-without-global)            | Yes (Regex section)     | Yes (Template #18)          |
| Regex two-strikes    | Yes          | No explicit pattern | Yes (regex-complexity-s5852)         | No                      | Yes (Template #21)          |
| Symlink guards       | No (in S4)   | Yes (Security)      | Yes (write-without-symlink-guard)    | Yes (File Ops section)  | Yes (Template #5, #24)      |
| Atomic writes        | No (in S4)   | Yes (Security, CI)  | Yes (atomic-write-missing-tmp-guard) | Yes (implied)           | Yes (Template #7, #22, #24) |
| Prototype pollution  | No           | Yes (Security)      | No                                   | Yes (Data Safety)       | Yes (Template #8)           |
| Fail-closed catch    | No           | Yes (Security)      | No                                   | Yes (implied)           | Yes (Template #28)          |

### Gaps Identified

1. **Test mocking** (CLAUDE.md top-5) has NO mention in SECURITY_CHECKLIST.md or
   FIX_TEMPLATES.md
2. **Regex two-strikes** (CLAUDE.md top-5) has NO explicit pattern in
   CODE_PATTERNS.md -- it's only implicitly covered by the S5852 template
3. **Prototype pollution** -- documented in CODE_PATTERNS.md and
   SECURITY_CHECKLIST.md, has a FIX_TEMPLATE (#8), but NO automated checker
4. **SSRF allowlist** -- documented in CODE_PATTERNS.md and
   SECURITY_CHECKLIST.md but NO automated checker and NO FIX_TEMPLATE
5. **22 ESLint-migrated patterns** are NOT documented in SECURITY_CHECKLIST.md
   as migrated; the checklist still shows manual check items for patterns now
   handled by ESLint

---

## 5. FIX_TEMPLATES Usage

### Template Count

**Total templates in FIX_TEMPLATES.md:** 34 templates (Template #1 through #34)

| Template # | Name                                    | Matching CODE_PATTERNS Pattern? |
| ---------- | --------------------------------------- | ------------------------------- |
| 1          | readFileSync Without try/catch          | Yes (Critical #3)               |
| 2          | Path Traversal Using startsWith("..")   | Yes (Critical #2)               |
| 3          | Unsafe error.message Access             | Yes (Critical #1)               |
| 4          | Unguarded loadConfig() Calls            | Yes (migrated to ESLint)        |
| 5          | Symlink Attack via Missing lstatSync()  | Yes (Security)                  |
| 6          | Stateful /g Flag with .test()           | Yes (General, Critical #4)      |
| 7          | Atomic Writes Missing tmp+rename        | Yes (Security)                  |
| 8          | Prototype Pollution via Object.assign   | Yes (Security)                  |
| 9          | Path Containment via startsWith()       | Yes (Security)                  |
| 10         | Silent Catch Blocks                     | Yes (implied)                   |
| 11         | TOCTOU Race in File Operations          | Yes (Security)                  |
| 12         | Regex DoS via Unbounded Quantifiers     | Yes (Security)                  |
| 13         | Missing BOM Handling in JSONL           | Yes (JS/TS)                     |
| 14         | Markdown Injection in Output            | Yes (Security)                  |
| 15         | PII via Raw Error Messages              | Yes (Security)                  |
| 16         | Missing Array.isArray Guard             | Yes (JS/TS)                     |
| 17         | Regex with Missing Escape               | Yes (implied)                   |
| 18         | Missing /g Flag in exec() Loop          | Yes (Critical #4)               |
| 19         | Unbounded Input DoS                     | Yes (Security)                  |
| 20         | Git Command Without -- Separator        | Yes (Security)                  |
| 21         | SonarCloud Regex Complexity (S5852)     | Yes (implied via two-strikes)   |
| 22         | Windows-Safe Atomic Write               | Yes (CI/Automation)             |
| 23         | Pattern Propagation (Codebase-Wide Fix) | Yes (General)                   |
| 24         | Atomic Write tmpPath Symlink Guard      | Yes (Security)                  |
| 25         | SKIP_REASON Full Validation Chain       | Yes (Security)                  |
| 26         | POSIX Shell Portability                 | Yes (Bash/Shell)                |
| 27         | Secure Audit File Write (fd-based)      | Yes (Security)                  |
| 28         | Fail-Closed Catch Block                 | Yes (Security)                  |
| 29         | Validate-Then-Store Path                | Yes (Security)                  |
| 30         | CC Extraction Options Object            | Yes (JS/TS)                     |
| 31         | realpathSync Lifecycle                  | Yes (Security)                  |
| 32         | Hoist Safety Flag                       | Yes (Security)                  |
| 33         | Path Containment Decision Matrix        | Yes (Security)                  |
| 34         | Evidence/Array Merge with Deep Dedup    | Weak match                      |

### Coverage Analysis

- **All 34 templates map to at least one CODE_PATTERNS.md pattern** (no orphaned
  templates)
- **Patterns WITHOUT templates** (significant gaps):
  - SSRF allowlist (Security, high severity)
  - Defense-in-depth bypass (Security, critical)
  - All 22 React/Frontend patterns (0 templates)
  - All 12 Process Management patterns (0 templates)
  - All 8 Security Audit canonical patterns (0 templates)
  - Git pathspec magic (Security, critical)
  - Git option injection (Security, critical)

---

## 6. Top-5 Critical Validation

### CLAUDE.md Section 4 "Critical Anti-Patterns"

The current top-5 are:

| #   | Pattern              | In CLAUDE.md    |
| --- | -------------------- | --------------- |
| 1   | Error sanitization   | Yes             |
| 2   | Path traversal       | Yes             |
| 3   | Test mocking         | Yes             |
| 4   | File reads try/catch | Yes             |
| 5   | exec() loops /g flag | Yes             |
| 6   | Regex two-strikes    | Yes (bonus 6th) |

### Cross-reference with Actual Recurrence Data

From `consolidation-output/suggested-rules.md` (data-driven recurrence counts
across 399 reviews):

| Pattern Tag               | Mention Count | In Top-5?                      |
| ------------------------- | ------------- | ------------------------------ |
| qodo                      | 100           | No (meta-tag, not a pattern)   |
| ci                        | 49            | No (meta-tag)                  |
| security                  | 39            | No (meta-tag)                  |
| sonarcloud                | 38            | No (meta-tag)                  |
| compliance                | 29            | No (meta-tag)                  |
| documentation             | 20            | No (meta-tag)                  |
| symlink                   | 20            | **No -- should it be?**        |
| cc (cognitive complexity) | 12            | No                             |
| validation                | 11            | No                             |
| atomic write              | 8             | No                             |
| sanitiz                   | 5             | Partially (error sanitization) |
| cc reduction              | 4             | No                             |
| cross-platform            | 4             | No                             |
| fail-closed               | 4             | No                             |
| error handling            | 4             | Partially                      |
| prototype pollution       | 3             | No                             |
| redos                     | 3             | No                             |

### Assessment

The suggested-rules data is **not useful for validating the top-5** because:

1. The consolidation extracts pattern tags from `review.patterns[]` arrays,
   which are mostly **meta-categories** (qodo, ci, security, sonarcloud) rather
   than specific anti-patterns
2. The tag granularity is too coarse -- "security" appears 39 times but doesn't
   distinguish between path traversal, injection, SSRF, etc.
3. The actual recurrence of specific patterns like "error sanitization" or "exec
   /g flag" is not trackable from this data

**However, symlink patterns (20 mentions across reviews #253-#348) are notably
high-recurrence and are NOT in the CLAUDE.md top-5.** Given that symlink-related
findings drove ~20 review rounds (R316-R323 being the most intense), this
pattern arguably deserves top-5 status. The existing top-5 entry for "file reads
try/catch" (only 5 mentions as "sanitiz") appears less impactful by raw count.

The top-5 was likely curated based on **severity** (security impact) rather than
**recurrence** (frequency). Both are valid criteria, but the data doesn't
definitively validate the current selection.

---

## Summary Findings

### Pipeline Flow

```
reviews.jsonl (406 entries)
    |
    v
run-consolidation.js (every 10 reviews)
    |
    +-- consolidation.json (state tracking)
    +-- consolidation-output/suggested-rules.md (TODO templates)
    +-- CODE_PATTERNS.md (auto-append recurring patterns)
    +-- AI_REVIEW_LEARNINGS_LOG.md (consolidation record)
    |
    v
promote-patterns.js (reviews.jsonl -> CODE_PATTERNS.md)
    |
    v
check-pattern-compliance.js (43 regex + 22 ESLint rules)
```

### Key Metrics

| Metric                         | Value                      |
| ------------------------------ | -------------------------- |
| Total consolidation runs       | ~17 (13 old + 4 new)       |
| Total documented patterns      | ~275                       |
| Total enforced patterns        | ~65 (43 regex + 22 ESLint) |
| Enforcement coverage           | ~24%                       |
| Fix templates                  | 34                         |
| Template coverage of patterns  | ~12%                       |
| Auto-promoted patterns         | 6 (all from one run)       |
| Manually added patterns        | ~269                       |
| Suggested rules pending review | 22 (all TODO stubs)        |

### Critical Issues

1. **Consolidation number discontinuity** -- state file says #4 but version
   history shows #18 historical consolidations. The counter was reset without
   documentation.
2. **Low enforcement coverage (24%)** -- 3/4 of documented patterns rely on AI
   reading docs, not automated checking.
3. **Suggested rules are dead-ends** --
   `consolidation-output/suggested-rules.md` generates TODO templates but nobody
   converts them to actual compliance rules.
4. **Auto-promotion is essentially unused** -- only 6 patterns auto-promoted,
   all in one batch. The `promote-patterns.js` tool exists but is not integrated
   into any workflow.
5. **Cross-document sync gaps** -- test mocking missing from SECURITY_CHECKLIST
   and FIX_TEMPLATES; regex two-strikes not explicitly in CODE_PATTERNS; 22
   ESLint migrations not reflected in SECURITY_CHECKLIST.
6. **Pattern tag granularity** -- the `patterns[]` field in reviews.jsonl uses
   coarse categories (qodo, security, ci) rather than specific pattern IDs,
   making data-driven promotion unreliable.
