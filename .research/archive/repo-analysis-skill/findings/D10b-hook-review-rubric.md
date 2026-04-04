# Findings: D10b — Rubric Items from hook-checks.json, propagation-patterns.json, and Review Learnings

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-31
**Sub-Question IDs:** D10b

---

## Key Findings

### 1. hook-checks.json: 14 Checks, 7 Universally Applicable [CONFIDENCE: HIGH]

hook-checks.json contains 14 registered pre-commit/pre-push checks across 5
categories: security, quality, testing, compliance, and docs. Each has a
`blocking` level (block / warn / auto-fix), wave ordering, and skip flags.

**Check inventory (with classification):**

| Check ID                  | Name                                        | Hook Stage | Blocking        | Category   | Classification                                   |
| ------------------------- | ------------------------------------------- | ---------- | --------------- | ---------- | ------------------------------------------------ |
| `secrets-scan`            | Secrets Scan (gitleaks)                     | pre-commit | BLOCK           | security   | UNIVERSAL                                        |
| `eslint`                  | ESLint                                      | pre-commit | BLOCK           | quality    | LANGUAGE-SPECIFIC (JS/TS)                        |
| `tests`                   | Tests (npm test)                            | pre-commit | BLOCK           | testing    | UNIVERSAL (concept), LANGUAGE-SPECIFIC (command) |
| `lint-staged`             | Prettier auto-format                        | pre-commit | BLOCK           | quality    | LANGUAGE-SPECIFIC (JS/TS)                        |
| `pattern-compliance`      | Custom pattern anti-pattern scan            | pre-commit | BLOCK           | compliance | UNIVERSAL (concept)                              |
| `audit-s0s1`              | Audit severity validation                   | pre-commit | BLOCK           | compliance | PROJECT-SPECIFIC                                 |
| `skill-validation`        | Skill config validation                     | pre-commit | WARN+escalation | quality    | PROJECT-SPECIFIC                                 |
| `cross-doc-deps`          | Cross-document link integrity               | pre-commit | BLOCK           | docs       | UNIVERSAL                                        |
| `doc-index`               | Documentation index auto-update             | pre-commit | auto-fix        | docs       | PROJECT-SPECIFIC (concept is universal)          |
| `doc-headers`             | Required doc headers on new .md files       | pre-commit | BLOCK           | docs       | UNIVERSAL                                        |
| `agent-compliance`        | Code-reviewer agent invocation check        | pre-commit | WARN+escalation | compliance | PROJECT-SPECIFIC                                 |
| `debt-schema`             | Tech debt JSONL schema validation           | pre-commit | BLOCK           | compliance | PROJECT-SPECIFIC                                 |
| `jsonl-md-sync`           | Planning JSONL → MD regeneration sync       | pre-commit | WARN+escalation | docs       | PROJECT-SPECIFIC                                 |
| `propagation-staged`      | Pattern propagation miss detection          | pre-commit | BLOCK           | quality    | UNIVERSAL (concept)                              |
| `escalation-gate`         | Block push on unacknowledged error warnings | pre-push   | BLOCK           | compliance | UNIVERSAL                                        |
| `circular-deps`           | Circular dependency detection (madge)       | pre-push   | BLOCK           | quality    | LANGUAGE-SPECIFIC (JS/TS)                        |
| `pattern-compliance-push` | Pattern compliance on push diff             | pre-push   | WARN+escalation | compliance | UNIVERSAL (concept)                              |
| `code-reviewer-gate`      | Require code review invocation before push  | pre-push   | BLOCK           | compliance | PROJECT-SPECIFIC                                 |
| `propagation`             | Full propagation check on push              | pre-push   | BLOCK           | quality    | UNIVERSAL (concept)                              |

**Universal checks (extractable as rubric items for any repo):**

1. Secrets scan at pre-commit (detect leaked credentials before they enter
   history)
2. Test suite on every commit, with smart skip for doc-only changes
3. Cross-document link integrity (broken references are a quality signal)
4. Required headers on new documentation files
5. Escalation gate: unacknowledged warnings block push (prevents warning
   fatigue)
6. Circular dependency detection
7. Pattern propagation: when a pattern is corrected in one file, scan siblings

### 2. propagation-patterns.json: 10 Patterns, Security-Critical Ones Are UNIVERSAL [CONFIDENCE: HIGH]

The registry contains 10 propagation patterns. Each was added after 4-6+
recurrences in PR reviews — these are empirically validated recurring issues.

**Pattern inventory with classification:**

| Pattern ID        | Description                                                    | Severity | Source                         | Classification                                                      |
| ----------------- | -------------------------------------------------------------- | -------- | ------------------------------ | ------------------------------------------------------------------- |
| `sanitize-error`  | Use `sanitizeError()` not raw `error.message`                  | BLOCK    | PR #431, #448 (6x)             | UNIVERSAL — raw error.message leaks stack/path info in any language |
| `safe-to-write`   | `isSafeToWrite()` symlink guard before writes                  | BLOCK    | PR #368, #374, #397 (6x)       | UNIVERSAL — symlink attacks are cross-platform                      |
| `lstat-symlink`   | TOCTOU: use `lstatSync` + `isSymbolicLink`, not `statSync`     | BLOCK    | PR #388, #397 (6x)             | UNIVERSAL — TOCTOU race condition is a universal security class     |
| `validate-path`   | Path containment: `validatePathInDir()` after `path.resolve()` | BLOCK    | PR #374, #388, #389, #448 (6x) | UNIVERSAL — path traversal is cross-language                        |
| `escape-cell`     | Markdown injection: `escapeCell()` for dynamic table content   | WARN     | PR #415 (6x, 3-round chain)    | UNIVERSAL — injection in output formats applies anywhere            |
| `exec-path`       | Use `process.execPath` not hardcoded `'node'`                  | WARN     | PR #420 (4x)                   | LANGUAGE-SPECIFIC (Node.js)                                         |
| `safe-write-file` | `safeWriteFileSync()` with symlink guard                       | BLOCK    | PR #368, #374                  | UNIVERSAL (concept) — safe write wrappers with guard are universal  |
| `path-traversal`  | Regex test for `..` traversal, not `startsWith('..')`          | BLOCK    | PR #374, #389                  | UNIVERSAL — traversal check correctness is language-agnostic        |
| `refuse-symlink`  | Use `refuseSymlink()` helpers                                  | BLOCK    | PR #397                        | UNIVERSAL (concept)                                                 |
| `number-nan`      | Use `Number.NaN` not bare `NaN`                                | WARN     | PR #448 R2 (7 instances)       | LANGUAGE-SPECIFIC (JS/TS)                                           |

**Universal rubric items from propagation patterns:**

1. Raw error messages must be sanitized before logging (prevents path/stack
   leakage)
2. File writes must check for symlink attacks before writing
3. TOCTOU: file-stat used for security decisions must use lstat + symlink check
4. Path resolution must be followed by containment validation
5. Dynamic content inserted into structured formats (markdown, HTML, CSV) must
   be escaped
6. Path traversal must be checked with correct regex, not naive string prefix
   checks

### 3. Review Learnings: Recurring Cross-Review Issues Worth Detecting [CONFIDENCE: HIGH]

Analysis of Reviews #53–#60 (PRs #459–#477, 2026-03-21 to 2026-03-28) plus
Reviews #486–#502 (PRs #448, #456, #457, #466, #468, 2026-03-18 to 2026-03-24)
reveals a consistent set of recurring issue categories.

**Security issues (UNIVERSAL):**

| Issue                                                                | Reviews                    | Classification |
| -------------------------------------------------------------------- | -------------------------- | -------------- |
| Path traversal in CLI/script args                                    | #486, #488, #487, #60, #58 | UNIVERSAL      |
| Symlink guards missing on write operations                           | #489, #486                 | UNIVERSAL      |
| API keys in subprocess argv (visible in `ps`)                        | #53                        | UNIVERSAL      |
| Archive extraction zip-slip (no subdirectory containment)            | #60                        | UNIVERSAL      |
| `eval` in bash scripts                                               | #58                        | UNIVERSAL      |
| Token/secret embedded in strings, not caught by word-split redaction | #496                       | UNIVERSAL      |
| Raw `error.message` passed through instead of sanitized              | #489                       | UNIVERSAL      |
| Allowlist missing on generic data-access methods                     | #496                       | UNIVERSAL      |

**Reliability issues (UNIVERSAL):**

| Issue                                                              | Reviews    | Classification               |
| ------------------------------------------------------------------ | ---------- | ---------------------------- |
| Synchronous I/O on render/hot path blocking execution              | #53        | UNIVERSAL                    |
| Missing `Array.isArray()` check before iterating JSON fields       | #53        | UNIVERSAL                    |
| Goroutine/async task that never completes before process exit      | #55        | UNIVERSAL                    |
| Ignored I/O errors (MkdirAll, WriteFile, Unmarshal)                | #54        | UNIVERSAL                    |
| `Promise.allSettled` vs `Promise.all` — single failure kills batch | #487       | UNIVERSAL                    |
| `z.coerce.number()` silently converts `null` to `0`                | #500, #501 | LANGUAGE-SPECIFIC (Zod/TS)   |
| Timestamp string comparison instead of Date objects                | #486       | UNIVERSAL                    |
| Lockfile drift after dependency change                             | #500       | LANGUAGE-SPECIFIC (npm/yarn) |
| Quadratic dedup — needs Map index for O(N)                         | #487       | UNIVERSAL                    |

**Code quality issues (UNIVERSAL/LANGUAGE-SPECIFIC):**

| Issue                                                             | Reviews        | Classification              |
| ----------------------------------------------------------------- | -------------- | --------------------------- |
| Cognitive complexity exceeds threshold — extract helpers          | #53, #56, #490 | UNIVERSAL                   |
| `[[` vs `[` in bash scripts (SonarCloud flags `[` as Major)       | #58            | LANGUAGE-SPECIFIC (bash)    |
| `replaceAll()` with string args vs `.replace()` with regex        | #496, #487     | LANGUAGE-SPECIFIC (JS)      |
| Binary/generated artifacts committed to git                       | #58            | UNIVERSAL                   |
| Formatter (Prettier) failures when CI runs it                     | #485           | UNIVERSAL (concept)         |
| CJS/ESM interop guard (`?.default ??`) missing on dynamic require | #54            | LANGUAGE-SPECIFIC (Node.js) |
| Orphaned references in roadmap/docs to moved items                | #499           | UNIVERSAL                   |

**Documentation issues (UNIVERSAL):**

| Issue                                                              | Reviews | Classification   |
| ------------------------------------------------------------------ | ------- | ---------------- |
| Cross-document link rot (broken references not caught pre-commit)  | #485    | UNIVERSAL        |
| Missing try/catch on file reads (race between existsSync and read) | #485    | UNIVERSAL        |
| Malformed markdown table headers                                   | #497    | UNIVERSAL        |
| Version tables sorting newest-first violated                       | #53     | PROJECT-SPECIFIC |

---

## Rubric Summary: Classified Items

### UNIVERSAL (applies to any repo/language)

**Security:**

- S1: Secrets scan before commit enters history
- S2: Raw error messages sanitized before logging (no stack/path leakage)
- S3: File writes guarded against symlink attacks
- S4: TOCTOU: lstat + symbolic link check for security-sensitive stat calls
- S5: Path resolution followed by containment validation
- S6: Dynamic content in structured formats (markdown, HTML) escaped
- S7: Path traversal checked with correct regex, not naive `startsWith('..')`
- S8: API secrets never passed through subprocess argv
- S9: Archive extraction uses contained subdirectory (zip-slip prevention)
- S10: `eval` in shell scripts replaced with direct execution pattern
- S11: Token/secret redaction uses regex match, not whitespace-split
- S12: Allowlists on generic data-access methods (defense in depth)

**Reliability:**

- R1: Synchronous I/O never on render/hot path
- R2: Array.isArray() before iterating parsed JSON fields
- R3: Async tasks that must complete before process exit run synchronously
- R4: File write/mkdir errors explicitly checked (not silently ignored)
- R5: Batch operations use Promise.allSettled to isolate failures
- R6: Date comparisons use Date objects, not string comparisons
- R7: O(N²) deduplication replaced with Map index

**Quality:**

- Q1: Test suite runs on every non-doc commit
- Q2: Circular dependency detection
- Q3: Pattern propagation: when a pattern is corrected, scan all similar files
- Q4: Cognitive complexity thresholds enforced via extract-helper refactors
- Q5: Binary/generated artifacts caught by gitignore before commit
- Q6: Linter/formatter failures treated as blocking

**Docs:**

- D1: Cross-document reference integrity checked at commit time
- D2: Required headers enforced on new documentation files
- D3: Malformed markdown (tables, headers) caught pre-merge

### LANGUAGE-SPECIFIC (JS/TS/Node.js)

- LS1: `Number.NaN` vs bare `NaN`
- LS2: `replaceAll()` with string args preferred over `.replace()` with regex
  for clarity
- LS3: `process.execPath` not hardcoded `'node'`
- LS4: CJS/ESM interop: `?.default ??` guard when using `createRequire`
- LS5: `z.coerce.number()` silently converts `null` to `0` — use
  `z.number().nullable()` or preprocess
- LS6: Lockfile must be updated when package.json dependency changes
- LS7: Circular dependency detection (madge for JS/TS)

### LANGUAGE-SPECIFIC (bash)

- LS8: `[[` for conditionals, not `[` (POSIX vs bash)
- LS9: `eval` never used — replace with `"$@"` direct execution

### PROJECT-SPECIFIC (sonash-v0 only)

- PS1: S0/S1 audit severity validation
- PS2: Skill configuration schema validation
- PS3: AI agent invocation required before push on script changes
- PS4: Technical debt JSONL schema validation
- PS5: Planning JSONL → MD regeneration sync check
- PS6: Version tables sort newest-first
- PS7: PLAN.md provenance: archive findings rather than delete

---

## Sources

| #   | File                                       | Title                           | Type         | Trust | Date                      |
| --- | ------------------------------------------ | ------------------------------- | ------------ | ----- | ------------------------- |
| 1   | `scripts/config/hook-checks.json`          | Hook Check Contract Registry    | local-config | HIGH  | 2026-03-16 (generated)    |
| 2   | `scripts/config/propagation-patterns.json` | Propagation Pattern Registry    | local-config | HIGH  | 2026-03-30 (updated)      |
| 3   | `docs/AI_REVIEW_LEARNINGS_LOG.md`          | AI Review Learnings Log v17.116 | local-docs   | HIGH  | 2026-03-26 (last updated) |

All three sources are first-party artifacts from the codebase itself. Trust is
HIGH — these are canonical runtime-enforced contracts and empirical audit
trails, not aspirational documentation.

---

## Contradictions

None. The three sources are complementary:

- hook-checks.json = formal contract (what is enforced)
- propagation-patterns.json = recurring violation registry (what was missed
  repeatedly)
- review learnings = human-flagged patterns (what reviewers catch that hooks
  miss)

The review learnings contain several items (symlink guards, path traversal,
sanitize-error) that are also present in propagation-patterns.json, confirming
these are the highest-recurrence issues.

---

## Gaps

- hook-checks.json does not include the `ai-patterns.json` file contents
  (referenced as the pattern source for `pattern-compliance`). That file likely
  contains additional rubric items not captured here.
- Review learnings older than 2026-03-18 were not read. Earlier reviews may
  contain additional unique patterns.
- The review learnings contain Go-specific findings (Reviews #53–#56 covering
  the statusline binary) that may represent a distinct sub-domain not fully
  represented in the classification above.

---

## Serendipity

The propagation-patterns.json `_meta` description contains an AI instruction:
"AI: during /pr-retro, when a propagation miss is identified, propose adding it
here." This means the registry is designed to be AI-maintained and grows
automatically from PR retro sessions. For a repo-analysis skill, this suggests a
rubric item: **does the repo have a mechanism to automatically capture recurring
violations into a searchable registry?** That meta-capability is itself a
quality signal absent from most repos.

The hook-checks.json `escalation-gate` design (unacknowledged warnings block
push) is a notable anti-warning-fatigue mechanism. Most repos either fail-hard
or warn silently. The escalation model (warn → require acknowledgment → escalate
to block) is a third option worth noting.

---

## Confidence Assessment

- HIGH claims: 3
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings sourced directly from codebase files read in this session. No
inference from training data required.
