<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-05
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Archived Reviews #260-#299

Reviews archived from AI_REVIEW_LEARNINGS_LOG.md. Repaired on 2026-03-05.

---

#### Review #260: PR #346 Audit Trigger Reset - Round 1 Qodo + SonarCloud + CI (2026-02-07)

**Source:** Qodo PR Code Suggestions + SonarCloud Security Hotspots + CI
Failures **PR/Branch:** claude/cherry-pick-commits-yLnZV (PR #346)
**Suggestions:** 11 total (Critical: 2 CI, Major: 3, Minor: 3, Trivial: 0,
Skipped: 3)

**Patterns Identified:**

1. [execSync shell injection]: SonarCloud HIGH — `execSync` with string commands
   allows shell injection; use `execFileSync` with array args
   - Root cause: `seed-commit-log.js` used `execSync(cmd)` string form
   - Prevention: Always use `execFileSync("binary", [args])`
2. [Regex backtracking DoS]: `[^|]+` causes exponential backtracking — use
   `[^|\n]+` to bound character class
   - Root cause: `reset-audit-triggers.js` used unbounded regex quantifiers
   - Prevention: Always add `\n` to negated character classes in table parsing
3. [Object.create(null) for map objects]: Prevents prototype pollution when
   using objects as dictionaries
   - Root cause: `check-session-gaps.js` used `{}` for groupBySession
   - Prevention: Use `Object.create(null)` for any user-influenced map keys
4. [Unit Separator delimiter]: `|` in commit messages corrupts git log parsing —
   use `\x1f` (ASCII 31) as field separator
   - Root cause: Multiple scripts used `|` as git log format delimiter
   - Prevention: Always use `\x1f` for git log `--format` field separation
5. [NaN timestamp guard]: `Date.now() - new Date(null).getTime()` = NaN — must
   check before arithmetic
   - Root cause: `compact-restore.js` didn't guard null timestamp
   - Prevention: Check `Number.isNaN()` before date arithmetic
6. [Math.min on empty array]: `Math.min(...[])` = Infinity — guard with length
   check
   - Root cause: `check-review-needed.js` spread empty validTimestamps
   - Prevention: Always check `array.length > 0` before `Math.min(...array)`
7. [CI false positive exclusions]: Pre-commit `readfilesync-without-try` pattern
   flags multi-line try/catch as violations — add to pathExcludeList with audit
   - Root cause: Pattern checker doesn't detect try/catch spanning multiple
     lines
   - Prevention: Add verified false positives with audit documentation

**Resolution:**

- Fixed: 8 items (execFileSync, regex DoS ×3, Object.create(null), \x1f ×3, NaN
  guard, Math.min guard, pathExcludeList)
- Skipped: 3 items (sensitive data persistence — local-only hooks by design)

---

#### Review #261: PR #346 Audit Trigger Reset - Round 2 Qodo (2026-02-07)

**Source:** Qodo PR Code Suggestions **PR/Branch:**
claude/cherry-pick-commits-yLnZV (PR #346) **Suggestions:** 4 total (Critical:
0, Major: 2, Minor: 2, Trivial: 0)

**Patterns Identified:**

1. [Delimiter mismatch after format change]: Changed git log format to `\x1f`
   but forgot to update `split("|")` in reporting code
   - Root cause: Incomplete find-replace when changing delimiters
   - Prevention: Search for ALL occurrences of old delimiter when changing
2. [Date validation before use]: `lastMultiAIDate` could be invalid string
   causing downstream NaN
   - Root cause: No validation on parsed date from markdown
   - Prevention: Always validate dates with
     `Number.isNaN(new Date(d).getTime())`
3. [Robust category matching]: Category names in markdown may use hyphens or
   spaces — regex must handle both
   - Root cause: `reset-audit-triggers.js` displayName regex too strict
   - Prevention: Use `[-\\s]+` pattern between word parts

**Resolution:**

- Fixed: 4 items (delimiter mismatch, date validation, category matching,
  trigger message accuracy)

---

#### Review #262: PR #346 Audit Trigger Reset - Round 3 Qodo + SonarCloud (2026-02-07)

**Source:** Qodo PR Code Suggestions + SonarCloud **PR/Branch:**
claude/cherry-pick-commits-yLnZV (PR #346) **Suggestions:** 5 total (Critical:
1, Major: 2, Minor: 2, Trivial: 0)

**Patterns Identified:**

1. [execSync → execFileSync conversion]: `execSync(string)` invokes shell
   (injection risk); `execFileSync("git", [args])` bypasses shell entirely
   - Root cause: Original hooks used string-based `execSync` for git commands
   - Prevention: Always use `execFileSync` with array args for subprocess calls
2. [Timezone drift in date re-parsing]: `new Date("2026-02-07").toISOString()`
   can shift to previous day in negative UTC offsets
   - Root cause: Re-parsing YYYY-MM-DD string through Date constructor
   - Prevention: Use original date string directly, don't round-trip through
     Date
3. [getCategoryAuditDates reading wrong table]: Function was reading audit LOG
   sections (historical) instead of threshold TABLE (current)
   - Root cause: Regex matched first table with category names
   - Prevention: Read from specifically named section (fixed in R5)

**Resolution:**

- Fixed: 5 items (execFileSync ×2 files, timezone drift, regex whitespace,
  entries-based reporting)

---

#### Review #263: PR #346 Audit Trigger Reset - Round 4 Qodo (2026-02-07)

**Source:** Qodo PR Code Suggestions **PR/Branch:**
claude/cherry-pick-commits-yLnZV (PR #346) **Suggestions:** 3 total (Critical:
0, Major: 2, Minor: 1, Trivial: 0)

**Patterns Identified:**

1. [Multi-word category capitalization]: `category.charAt(0).toUpperCase()`
   only capitalizes first word — must
   `.split("-").map(w => capitalize).join("-")`
   - Root cause: Same bug as `reset-audit-triggers.js` but in different function
   - Prevention: Extract shared `toDisplayName()` helper for category names
2. [Windows atomic rename]: `fs.renameSync()` fails on Windows when dest exists
   — must `fs.rmSync(dest)` first or use backup-swap
   - Root cause: Windows does not support POSIX rename-over semantics
   - Prevention: Always add `rmSync(dest, {force:true})` before `renameSync`
3. [JSON.parse crash in reporting]: `JSON.parse()` in final console output can
   crash script on malformed entries
   - Root cause: Entries are JSON strings but could be corrupted
   - Prevention: Wrap in try-catch via safe helper function

**Resolution:**

- Fixed: 3 items (multi-word category, Windows atomic write, safeMsg helper)

---

#### Review #264: PR #346 Audit Trigger Reset - Round 5 Qodo (2026-02-07)

**Source:** Qodo PR Code Suggestions **PR/Branch:**
claude/cherry-pick-commits-yLnZV (PR #346) **Suggestions:** 6 total (Critical:
0, Major: 3, Minor: 0, Trivial: 0, Skipped: 3)

**Patterns Identified:**

1. [Section-scoped regex matching]: When parsing markdown tables, extract the
   target section first via `extractSection()` before running regex — prevents
   matching dates/names in unrelated tables
   - Root cause: `getCategoryAuditDates()` matched against entire file content
   - Prevention: Always scope markdown regex to the relevant `##` section
2. [Table-column-specific date parsing]: Use `^\|\s*(\d{4}-\d{2}-\d{2})\s*\|` to
   match dates only in first column of markdown table rows
   - Root cause: Generic `\d{4}-\d{2}-\d{2}` matches dates in comments/links
   - Prevention: Anchor date regex to table row structure
3. [Empty-result guard after validation]: When filtering entries (e.g., hash
   validation), check for empty array before writing output
   - Root cause: `seed-commit-log.js` could write empty file if all hashes fail
   - Prevention: Add length check + exit after validation loop

**Resolution:**

- Fixed: 3 items (section scoping, table date regex, empty entries guard)
- Skipped: 3 items (backup-swap over-engineering, `.filter(Boolean)` on
  hardcoded constants, case-safe rename on auto-generated file)

---

#### Review #265: PR #346 Audit Trigger Reset - Round 6 Qodo (2026-02-07)

**Source:** Qodo PR Code Suggestions **PR/Branch:**
claude/cherry-pick-commits-yLnZV (PR #346) **Suggestions:** 6 total (Critical:
0, Major: 1, Minor: 0, Trivial: 0, Already Fixed: 3, Rejected: 2)

**Patterns Identified:**

1. [Backup-swap for atomic writes]: rm+rename has a crash window where both
   files are lost; rename dest to .bak first, then rename tmp to dest, then
   clean up .bak
   - Root cause: `saveJson()` did rmSync(dest) then renameSync(tmp, dest)
   - Prevention: Use backup-swap pattern (dest→.bak, tmp→dest, rm .bak)
2. [Stale review feedback]: 3 of 6 items were already fixed in a prior commit
   (`5f3f312`) but feedback was based on older commit (`336f54d`)
   - Root cause: Automated review bots run on push, not on latest HEAD
   - Prevention: Check commit hash in feedback header against current HEAD

**Resolution:**

- Fixed: 1 item (backup-swap saveJson)
- Already Fixed: 3 items (empty entries guard, section scoping, table date regex
  — all in `5f3f312`)
- Rejected: 2 items (.filter(Boolean) on hardcoded constants, auto-generated
  DOCUMENTATION_INDEX.md)

**Key Learnings:**

- Always check the "up to commit" header in review feedback against current HEAD
- rm+rename pattern is unsafe on any OS (not just Windows) due to crash window

---

#### Review #266: PR #347 Doc-Optimizer + Artifact Cleanup - Qodo (2026-02-07)

**Source:** Qodo PR Compliance + Code Suggestions **PR/Branch:**
claude/cherry-pick-commits-yLnZV (PR #347) **Suggestions:** 4 total (Critical:
0, Major: 1, Minor: 2, Rejected: 1)

**Patterns Identified:**

1. [PII in committed JSONL data]: Absolute local file paths
   (`C:/Users/jason/...`) leaked into MASTER_DEBT.jsonl `file` field from
   doc-optimizer agents that wrote full paths instead of relative
   - Root cause: Agent findings used `path.resolve()` absolute paths
   - Prevention: intake-audit.js should strip project root from file paths
   - Fix: Python script to strip prefix from 15 entries in both JSONL files
2. [Schema field misuse]: 228 entries had human-readable text in `resolution`
   field instead of `resolution_note`
   - Root cause: Batch FALSE_POSITIVE script wrote to wrong field
   - Prevention: Validate schema on write (resolution should be null or enum)

**Resolution:**

- Fixed: 3 items (15 PII paths stripped, 228 resolution fields moved, views
  regenerated)
- Rejected: 1 item (GitHub Issues migration - architectural, TDMS is
  established)

**Key Learnings:**

- Doc-optimizer agents must output relative paths, not absolute
- Batch update scripts must target `resolution_note` not `resolution`
- JSONL files committed to git are public - treat file paths as PII

---

#### Review #267: PR #352 Config Refactor Hardening - Qodo + CI (2026-02-09)

**Source:** Qodo PR Compliance + Code Suggestions + CI Pattern Compliance
**PR/Branch:** claude/cherry-pick-and-pr-xarOL (PR #352) **Suggestions:** 13
total (Critical: 0, Major: 6, Minor: 3, Rejected: 4)

**Patterns Identified:**

1. [Config loader resilience]: Scripts consuming
   `loadConfig()`/`loadConfigWithRegex()` at module scope crash with unhelpful
   stack trace if config file is missing
   - Root cause: JSON configs are new (Session #142 refactor) — no error
     wrapping at call sites
   - Prevention: Wrap top-level config loads in try/catch with graceful fallback
     or clear exit
2. [Pattern checker false positives]: readFileSync already in try/catch still
   flagged by CI pattern compliance when `existsSync` appears nearby
   - Root cause: Regex-based pattern checker doesn't analyze scope nesting
   - Prevention: Add verified-patterns.json entries for confirmed false
     positives
3. [Per-item config reload]: `loadConfig()` called inside `transformItem()`
   function re-reads and re-parses JSON on every item in a potentially large
   JSONL batch
   - Root cause: Quick refactor moved inline constant to loadConfig without
     considering call site
   - Prevention: Cache config at module scope when used in hot loops

**Resolution:**

- Fixed: 9 items (6 CI pattern violations + 3 Qodo suggestions)
- Rejected: 4 items (2 false positives verified via code review, 1 intentional
  catch design, 1 over-engineering)

**Key Learnings:**

- New shared config system needs defensive loading at every call site
- Hooks must never crash on config load failure — use defaults
- Pattern checker false positives need verified-patterns.json entries
  immediately
- Module-scope caching is critical when loadConfig is called in loops

---

#### Review #268: PR #352 Round 2 - Qodo + CI False Positives (2026-02-09)

**Source:** Qodo PR Compliance + CI Pattern Compliance (Round 2) **PR/Branch:**
claude/cherry-pick-and-pr-xarOL (PR #352) **Suggestions:** 7 total (Critical: 0,
Major: 3, Minor: 1, Rejected: 2, Informational: 1)

**CI Blockers Fixed:**

1. `intake-pr-deferred.js:107` — readFileSync IS inside try/catch (lines
   106-112), pattern checker false positive. Added to verified-patterns.json.
2. `normalize-all.js:143` — readFileSync IS inside try/catch (lines 142-148),
   pattern checker false positive. Added to verified-patterns.json.

**Accepted Suggestions:**

3. [MAJOR] `intake-pr-deferred.js` — Changed `return []` to `process.exit(1)`
   when MASTER_DEBT.jsonl exists but can't be read. Returning empty silently
   loses duplicate detection capability.
4. [MAJOR] `transform-jsonl-schema.js` — Wrapped module-scope `loadConfig()` in
   try/catch with defaults. Unguarded module-scope call crashes with unhelpful
   stack trace if config missing.
5. [MAJOR] `transform-jsonl-schema.js` — Added `Array.isArray()` guard on
   `validSeverities` from config to validate shape before use.
6. [MINOR] `check-cross-doc-deps.js` — Added warning when no dependency rules
   loaded from config (empty rules is valid but worth flagging).

**Rejected Suggestions:**

7. `generate-skill-registry.js` composite dedup key (`source:name`) — REJECTED.
   Current name-only dedup is intentional: `.claude/skills` takes priority over
   `.agents/skills`. Composite key would allow duplicates.
8. `load-config.js` config shape validation — REJECTED. Over-engineering for
   internal dev-controlled configs. All consumers already validate what they
   need.

**Key Learnings:**

- Pattern checker line numbers shift after edits — always re-verify false
  positives after fixing nearby code
- `return []` on read failure can silently lose safety guarantees (dedup) —
  prefer `process.exit(1)` for non-optional file reads
- Module-scope `loadConfig()` needs try/catch even more than function-scope
  calls since the error surface is harder to diagnose

---

#### Review #269: PR #352 Round 3 - Qodo Security + Config Resilience (2026-02-09)

**Source:** Qodo PR Security Compliance + Code Suggestions (Round 3)
**PR/Branch:** claude/cherry-pick-and-pr-xarOL (PR #352) **Suggestions:** 7
total (Security: 1, Compliance: 1, Major: 3, Minor: 1, Informational: 1)

**Accepted Suggestions:**

1. [SECURITY] `generate-skill-registry.js` — Added `lstatSync` symlink guard
   before reading SKILL.md to prevent symlink-based file disclosure.
2. [COMPLIANCE] `generate-skill-registry.js` — Replaced silent empty catch
   blocks with `console.warn` for diagnosability (both skill-level and
   directory-level catches).
3. [MAJOR] `generate-skill-registry.js` — Fixed `parseFrontmatter` to
   `content.slice(3, end)` instead of `slice(0, end)` to skip the opening `---`
   marker line. Cleaner parsing that avoids redundant `key !== "---"` guard.
4. [MAJOR] `validate-audit-integration.js` + `check-doc-headers.js` — Wrapped
   unguarded module-scope `loadConfig` / `loadConfigWithRegex` calls in
   try/catch with `process.exit(2)` on failure. Same pattern as R2 fix for
   `transform-jsonl-schema.js`.
5. [MAJOR] `check-cross-doc-deps.js` — Fail closed (`process.exit(2)`) when no
   dependency rules loaded in non-dry-run mode. Prevents silently bypassing
   dependency enforcement if config is misconfigured.
6. [MINOR] `transform-jsonl-schema.js` — `Object.freeze` on
   `VALID_SEVERITIES_CACHED` to prevent mutation of module-scoped config cache.

**Key Learnings:**

- Every module-scope `loadConfig()` call in the codebase needs try/catch — this
  is now a systematic pattern to check in all refactored config consumers
- Symlink guards needed even for internal tooling directories (`.claude/skills`)
- Silent catch blocks prevent diagnosis — always log at least a warning
- Fail-closed is the safe default for CI enforcement hooks when config is empty

---

#### Review #270: PR #352 Round 4 - Qodo Config Guards + YAML Parsing (2026-02-09)

**Source:** Qodo PR Compliance + Code Suggestions (Round 4) **PR/Branch:**
claude/cherry-pick-and-pr-xarOL (PR #352) **Suggestions:** 7 total (Major: 4,
Minor: 1, Rejected: 1, Informational: 1)

**Accepted Suggestions:**

1. [MAJOR] `generate-skill-registry.js` — YAML block scalar indicators (`|`,
   `>`, `>-`) treated as empty values in parseFrontmatter. Prevents corrupted
   descriptions in skill-registry.json when SKILL.md uses multiline YAML.
2. [MAJOR] `search-capabilities.js` — Replaced silent empty catch with
   `console.warn` for skill registry load failures. Improves diagnosability when
   registry JSON is missing vs corrupted.
3. [MAJOR] `check-review-needed.js` — Wrapped module-scope
   `loadConfigWithRegex("audit-config")` in try/catch with `process.exit(2)`.
4. [MAJOR] `ai-pattern-checks.js` — Wrapped module-scope
   `loadConfigWithRegex("ai-patterns")` in try/catch with `process.exit(2)`.

**Rejected Suggestions:**

5. `validate-audit-integration.js` `sanitizeError` guard — REJECTED. The
   `sanitizeError` import already has a try/catch with inline fallback (lines
   31-37), guaranteeing it's always a function. Adding `typeof === "function"`
   check is redundant.

**Informational (no action):**

6. Secure logging compliance — unstructured console.warn with item.name paths.
   Acceptable for internal CLI dev tooling; no PII exposure.
7. Regex config loading — configs are dev-controlled JSON, not user input. Regex
   DoS risk is negligible for internal config files.

**Key Learnings:**

- Systematic pattern: every `loadConfig*()` at module scope across the codebase
  needs try/catch. R3 caught 2 files, R4 caught 2 more — pattern is spreading
  across all 10 refactored config consumers
- YAML block scalars (`|`, `>`) are common in SKILL.md frontmatter but the
  simple key:value parser doesn't handle multiline — treating them as empty
  values and falling through to description fallback is the correct approach

---

#### Review #271: PR #352 Round 5 - Qodo Regex + Config Guards (2026-02-09)

**Source:** Qodo PR Compliance + Code Suggestions (Round 5) **PR/Branch:**
claude/cherry-pick-and-pr-xarOL (PR #352) **Suggestions:** 7 total (Major: 4,
Minor: 2, Rejected: 1)

**Accepted Suggestions:**

1. [MAJOR] `skill-config.json` — Removed global `g` flag from 3
   `deprecatedPatterns` regex. The `g` flag makes `RegExp.test()` stateful via
   `lastIndex`, causing alternating true/false results on repeated calls.
2. [MAJOR] `agent-triggers.json` — Path-boundary anchored `excludePaths` regex:
   `(?:^|\\/)(?:__tests__|node_modules)(?:\\/|$)` prevents substring matches
   (e.g., `my__tests__helper` would incorrectly match before).
3. [MAJOR] `check-pattern-compliance.js` + `generate-documentation-index.js` +
   `surface-lessons-learned.js` — Wrapped module-scope `loadConfig` calls in
   try/catch with `process.exit(2)`. This is the final batch — all 10 refactored
   config consumers now have error handling.
4. [MINOR] `ai-pattern-checks.js` — Fail-closed when patterns config loads
   successfully but contains no patterns (prevents silent no-op).

**Rejected Suggestions:**

5. `check-review-needed.js` — 15+ lines of config shape validation (typeof
   checks on every property). Over-engineering for internal dev-controlled
   configs. The try/catch from R4 already handles missing/invalid files.

**Key Learnings:**

- Global `g` flag on regex used with `.test()` is a recurring bug pattern —
  stateful `lastIndex` causes non-deterministic results. Only use `g` with
  `matchAll()` or `exec()` loops.
- Path-matching regex needs anchoring at path boundaries, not just substring
  matching, to avoid false positives on directory/file names containing the
  pattern as a substring.
- All 10 config consumers from the Session #142 JSON extraction are now guarded
  with try/catch — this systematic sweep took 5 review rounds.

---

#### Review #272: PR #352 Round 6 — Final loadConfig Sweep (2026-02-09)

**Source:** Qodo PR Compliance + Code Suggestions (Round 6) **PR/Branch:**
claude/cherry-pick-and-pr-xarOL (PR #352) **Suggestions:** 12 total (Security:
1, Major: 8, Minor: 2, Rejected: 1)

**Approach change:** Instead of fixing one file per round, grep'd entire
codebase for unguarded `const X = loadConfig(` and fixed ALL 6 remaining in one
batch.

**Accepted:**

1. [SECURITY] `load-config.js` — Path traversal guard in config name
2. [MAJOR] 6 debt/validate scripts — try/catch around all remaining loadConfig
3. [MAJOR] `generate-skill-registry.js` — Description fallback filters YAML
   block scalars and empty description/name lines
4. [MINOR] `doc-header-config.json` — Path-boundary archive regex
5. [MINOR] `agent-triggers.json` — Exclude functions/src/ from code-reviewer

**Rejected:** audit-schema.json category rename, 3 shape validation suggestions

**Milestone:** Zero unguarded loadConfig calls remain in codebase.

---

#### Review #273: PR #353 — TDMS Pipeline Robustness (2026-02-09)

**Source:** Qodo Compliance + Qodo Code Suggestions + CI Pattern Compliance
**PR/Branch:** claude/cherry-pick-and-pr-xarOL (PR #353) **Suggestions:** 15
total (Critical: 3, Major: 5, Minor: 3, Rejected: 4)

**Patterns Identified:**

1. Contextless catch blocks: `catch { }` without capturing error loses
   debuggability
   - Root cause: execFileSync catch blocks logged generic warnings without error
     context
   - Prevention: Always capture `(err)` and include
     `err instanceof Error ? err.message : String(err)`
2. String line numbers in JSONL: `Number.isFinite("56")` returns false, causing
   items to be treated as Infinity in sorting
   - Root cause: JSONL items from external sources may have string-typed line
     numbers
   - Prevention: Normalize line values with `Number()` before `Number.isFinite`
     checks
3. PRESERVED_FIELDS overwrite: Existing values always overwrote newly computed
   values during view regeneration
   - Root cause: Condition only checked if existing had value, not if new item
     already had one
   - Prevention: Only copy preserved field when new item lacks it

**False Positives Identified:**

- [1] backfill-hashes.js:56 readFileSync - IS in try/catch (lines 55-63),
  pattern checker multi-line detection miss → added to verified-patterns.json
- [9] reviewNeeded persistence - ALREADY written at dedup-multi-pass.js:599-603
- [12] Trailing newline - ALREADY preserved through empty-line handling in
  split/join

**Resolution:**

- Fixed: 9 items (1 false positive CI fix + 2 Critical + 3 Major + 3 Minor)
- Rejected: 4 items (audit trails, secure logging, input validation, SQLite
  replacement)
- Deferred: 0

**Key Learnings:**

- Pattern checker has known multi-line try/catch detection gaps — always verify
  before fixing
- Qodo can miss existing implementations when suggesting additions — check
  surrounding code
- String-typed numbers from JSONL parsing are a common source of comparison bugs

---

#### Review #274: PR #355 — GRAND PLAN Sprint 1 Code Quality Review (2026-02-10)

**Source:** Qodo Compliance + Qodo Code Suggestions + SonarCloud + CI Pattern
Compliance **PR/Branch:** claude/branch-workflow-question-cgHVF (PR #355)
**Suggestions:** 33 total (Critical: 1, Major: 15, Minor: 10, Trivial: 2,
Rejected: 5)

**Patterns Identified:**

1. [readFileSync try/catch]: 12 readFileSync calls without try/catch (CI
   blocker)
   - Root cause: Wave refactoring preserved existsSync but didn't add try/catch
   - Prevention: Pattern checker correctly catches these
2. [Top-level await false positive]: Qodo flagged TLA in ESM files as CJS error
   - Root cause: Node v22 auto-detects ESM syntax; tsx handles TS files
   - Prevention: Check for import statements before assuming CJS
3. [Merge audit logging]: dedup-multi-pass swapOrder not reflected in log entry
   - Root cause: Log entry pushed from matchResult without updating kept/removed
   - Prevention: Always derive log fields from actual merge direction
4. [PII in geocoding logs]: Address strings logged in "no results" path
   - Root cause: Debug logging included full query string
   - Prevention: Mask or omit user data from log messages

**Resolution:**

- Fixed: 28 items
- Deferred: 0 items
- Rejected: 5 items (3 false positive TLA, 1 early return changes behavior, 1
  Set.freeze low impact)

**Key Learnings:**

- Node v22 module auto-detection makes TLA valid in .js files with imports
- readFileSync pattern remains most common CI blocker across PRs
- Qodo Impact 10 ratings can still be false positives — always verify

---

#### Review #275: PR #355 R2 — Qodo Round 2 Compliance + Suggestions (2026-02-10)

**Source:** Qodo Compliance + Qodo Code Suggestions **PR/Branch:**
claude/branch-workflow-question-cgHVF (PR #355) **Suggestions:** 17 total
(Critical: 1, Major: 4, Minor: 7, Trivial: 2, Rejected: 3)

**Patterns Identified:**

1. [const reassignment]: Destructured const then reassigned — runtime TypeError
   - Root cause: Wave 2 TLA conversion preserved const destructuring
   - Prevention: TypeScript strict mode catches this; run tsc before push
2. [TLA false positive persistence]: Same TLA false positive re-flagged
   - Root cause: Qodo doesn't detect Node v22 ESM auto-detection
   - Prevention: Document in rejection notes for future rounds
3. [Input validation at boundaries]: CLI args need validation after parseInt
   - Root cause: parseInt returns NaN for invalid input
   - Prevention: Always validate parsed numeric args with Number.isFinite

**Resolution:**

- Fixed: 14 items
- Deferred: 0 items
- Rejected: 3 items (TLA false positives — all files use import statements)

**Key Learnings:**

- const vs let destructuring is a common bug when refactoring loops
- Qodo re-flags rejected items if not explicitly marked in PR comments
- File truncation is more robust than read-compare-write for rollbacks

---

#### Review #276: PR #355 R3 — Qodo Round 3 Robustness + Coordinates (2026-02-10)

**Source:** Qodo Compliance + Qodo Code Suggestions **PR/Branch:**
claude/branch-workflow-question-cgHVF (PR #355) **Suggestions:** 14 total
(Critical: 0, Major: 5, Minor: 7, Trivial: 0, Rejected: 2)

**Patterns Identified:**

1. [Coordinate validation]: parseFloat can return NaN; always guard with
   Number.isFinite before writing to Firestore
   - Root cause: No validation between parse and write
   - Prevention: Always validate parsed numbers before DB operations
2. [Falsy coordinate check]: coordinates.lat && coordinates.lng fails for 0
   - Root cause: Using truthy check on numeric values
   - Prevention: Use typeof === "number" && Number.isFinite
3. [Fail-closed security]: isContainedRealPath should return false on any error,
   not just ENOENT
   - Root cause: R2 fix was too specific (ENOENT-only)
   - Prevention: Security functions should always fail-closed

**Resolution:**

- Fixed: 12 items
- Deferred: 0 items
- Rejected: 2 items (TLA false positive, placeholder email not real PII)

**Key Learnings:**

- Coordinate validation is a recurring pattern across geocoding scripts
- Security checkers should fail-closed (return false) not fail-open (throw)
- File truncation rollback needs both files for true atomicity

---

#### Review #277: PR #355 R4 — Qodo Round 4 Defensive Guards + Shape Validation (2026-02-10)

**Source:** Qodo Compliance + Qodo Code Suggestions **PR/Branch:**
claude/branch-workflow-question-cgHVF (PR #355) **Suggestions:** 12 total
(Critical: 0, Major: 4, Minor: 6, Trivial: 0, Rejected: 2)

**Patterns Identified:**

1. [Summary count mismatch]: check-external-links.js "Passed" count used
   results.filter which counted per-reference, not per-unique-URL
   - Fix: Use `uniqueUrlCount - failed` for consistent unique-URL counting
2. [Args shape validation]: MCP handler `args || {}` only guards null, not
   arrays or non-object types. Validate with
   `typeof === "object" && !Array.isArray`
3. [Independent rollback]: When rolling back two files, catch each truncation
   independently so one failure doesn't prevent the other
4. [Unused variable dead code]: streetClean assigned outside function that
   already computes it internally — remove outer dead assignment
5. [Enrich without zip]: Requiring zip before writing coordinates loses valid
   geo data — enrich coordinates even when zip is unavailable
6. [Compare both axes]: Cache staleness check compared only lat, missing
   longitude drift — compare both lat and lng
7. [parseInt for integer pass]: Use parseInt for dedup pass numbers to ensure
   integer keys, not floating-point from Number()
8. [MAX_SAFE_INTEGER bound]: Line number validation lacked upper bound — add
   MAX_SAFE_INTEGER check to prevent overflow
9. [TLA false positive x2]: phase-complete-check.js and sonarcloud-server.js
   both use import statements — Node v22 auto-detects ESM (REJECTED)

**Files Changed:** validate-audit.js, check-external-links.js,
assign-roadmap-refs.js, retry-failures.ts, enrich-addresses.ts,
sync-geocache.ts, sync-sonarcloud.js, sonarcloud-server.js, intake-audit.js,
intake-manual.js

---

#### Review #278: PR #355 R5 — Qodo Round 5 Critical Bug + Robustness (2026-02-10)

**Source:** Qodo Compliance + Qodo Code Suggestions **PR/Branch:**
claude/branch-workflow-question-cgHVF (PR #355) **Suggestions:** 12 total
(Critical: 1, Major: 2, Minor: 6, Trivial: 0, Rejected: 3)

**Patterns Identified:**

1. [Illegal continue in function]: `continue` is only valid inside loops, not in
   function bodies — seed-real-data.ts used `continue` inside `processLine()`
   which is a syntax error. Fix: `return null`
   - Root cause: R2 refactored const→let but didn't catch the continue
   - Prevention: Always verify control flow statements match their scope
2. [Divide-by-zero guard]: Division for percentage calculation without checking
   denominator can produce NaN — guard with `> 0` check
3. [Corrupted cache validation]: Before comparing cached vs new values with
   Math.abs, validate cached values are finite numbers — NaN produces NaN
4. [Dead variable compliance]: Unused `_rawAddr` with underscore prefix violates
   meaningful naming compliance — remove rather than prefix
5. [TLA false positive x3]: check-review-needed.js, retry-failures.ts both use
   import statements — Node v22 ESM auto-detect (REJECTED, same as R1-R4)
6. [Per-field sanitization]: Over-engineering — router shouldn't couple to
   handler-specific field names (REJECTED)

**Files Changed:** seed-real-data.ts, aggregate-audit-findings.js,
sync-geocache.ts, assign-roadmap-refs.js, normalize-canon-ids.js,
enrich-addresses.ts, transform-jsonl-schema.js

---

#### Review #279: PR #355 R6 — Qodo Round 6 Deterministic IDs + Loop Fix (2026-02-10)

**Source:** Qodo Compliance + Qodo Code Suggestions **PR/Branch:**
claude/branch-workflow-question-cgHVF (PR #355) **Suggestions:** 11 total
(Critical: 0, Major: 2, Minor: 2, Trivial: 0, Rejected: 7)

**Patterns Identified:**

1. [Break after success in geocode loop]: After a successful geocode + Firestore
   update, the inner query loop continued to next query unnecessarily, wasting
   API calls. Fix: `break` after `found = true`
   - Root cause: R5 early-return refactor removed the if block that naturally
     ended processing, but didn't add break
   - Prevention: When flattening if-else with early continue, add break at end
2. [Deterministic finding IDs]: Using `Date.now()` + `randomUUID()` for finding
   IDs makes them non-deterministic across runs, breaking dedup pipelines. Fix:
   hash stable inputs (idSuffix + relativePath) for reproducible IDs
3. [TLA false positive x5]: validate-audit.js (no TLA — standard try/catch),
   set-admin-claim.ts, seed-meetings.ts all use import → ESM auto-detect
   (REJECTED, same as R1-R5)
4. [Already-guarded null check]: validate-audit-integration.js line 369 already
   checks `!item.verification_steps` before line 380 (REJECTED — false positive)

**Files Changed:** enrich-addresses.ts, check-doc-placement.js,
aggregate-audit-findings.js, transform-jsonl-schema.js

---

#### Review #280: Qodo Evidence Deduplication in JSONL Debt Files (2026-02-10)

**Source:** Qodo Code Suggestions **PR/Branch:**
claude/analyze-repo-install-ceMkn **Suggestions:** 21 total across 2 rounds
(Critical: 0, Major: 0, Minor: 13, Trivial: 1, Rejected: 7)

**Patterns Identified:**

1. [Duplicate evidence in JSONL]: The audit pipeline's normalize/aggregate steps
   were producing duplicate `code_reference` + `description` pairs in evidence
   arrays (3-5 copies per entry). Affected 28 entries across all 3 JSONL files.
   - Root cause: Upstream aggregation script merges evidence without dedup
   - Prevention: Created `scripts/debt/dedup-evidence.js` for batch cleanup;
     consider adding dedup to the aggregation pipeline itself
2. [Meaningless merged_from]: Records with `source_id:"unknown"` also had
   `merged_from:["unknown"]` providing no provenance value
   - Fix: Script removes these automatically

**Resolution:**

- Fixed: 14 items (all via dedup script — 84 total entries fixed across 3 files)
- Deferred: 0
- Rejected: 7 (R2: stale content_hash × 5, restore merged_from, schema change)

**Key Learnings:**

- Qodo found 14 instances but the script found 28 per file — always fix
  systemically, not just the flagged instances
- Evidence deduplication should ideally happen at aggregation time, not as
  post-hoc cleanup
- R2 false positive: Qodo flagged content_hash as stale after evidence edits,
  but `generateContentHash()` uses file|line|title|description — NOT evidence.
  Always verify hash computation before recomputing

---

#### Review #281: PR #358 Sprint 2 — Shared State, Redaction, Key Stability (2026-02-10)

**Source:** Qodo Compliance + Code Suggestions **PR/Branch:**
claude/analyze-repo-install-ceMkn (PR #358) **Suggestions:** 9 total (Critical:
0, Major: 1, Minor: 7, Trivial: 1, Rejected: 0)

**Patterns Identified:**

1. [Module-level shared state bug]: `auth-error-banner.tsx` used a module-level
   `Set` for `seenMessages` — shared across all component instances and persists
   after unmount. Fix: Move to `useState` with functional updater.
   - Root cause: Module-scope variables in React components are singletons
   - Prevention: Never use module-level mutable state for per-instance data
2. [Key-name-based PII redaction]: `deepRedactValue` only checked value patterns
   (emails, tokens) but not key names (`api_key`, `password`, `secret`). Fix:
   Added `SENSITIVE_KEY_PATTERN` regex to redact by field name.
3. [Composite React keys]: Several lists used non-unique keys (`cause`, `date`,
   `resource.id`) that could collide. Fix: Composite keys with index suffix.
4. [SSR-safe reload]: `globalThis.location.reload()` can throw in SSR. Fix:
   Optional chaining `globalThis.location?.reload?.()`.

**Resolution:**

- Fixed: 9 items (1 MAJOR, 7 MINOR, 1 TRIVIAL)
- Deferred: 0
- Rejected: 0

**Key Learnings:**

- Module-scope `Set`/`Map` in React components = shared singleton bug. Always
  use `useState` or `useRef` for per-instance mutable state
- PII redaction needs both value-pattern AND key-name matching for defense in
  depth
- When lists may have duplicate values, always use composite keys
  (`${value}-${index}`)
- Guard clauses (`if (!x) return`) are cleaner than nested conditionals for
  optional parameters

---

#### Review #282: PR #358 R2 — SSR Guards, Regex Simplification, Key Stability (2026-02-10)

**Source:** SonarCloud + Qodo Code Suggestions **PR/Branch:**
claude/analyze-repo-install-ceMkn (PR #358) **Suggestions:** 26 total (Critical:
0, Major: 1, Minor: 21, Trivial: 2, Rejected: 2)

**Patterns Identified:**

1. [Regex complexity → Set lookup]: SonarCloud flagged `SENSITIVE_KEY_PATTERN`
   regex at complexity 21 (max 20). Replaced with `SENSITIVE_KEYS` Set for O(1)
   case-insensitive lookup — simpler, faster, and more extensible.
2. [typeof vs direct undefined]: SonarCloud prefers
   `globalThis.window === undefined` over
   `typeof globalThis.window === "undefined"` for property access on
   always-defined globals. Fixed 8 occurrences across 6 files.
3. [SSR guards for browser APIs]: Multiple components used `globalThis` APIs
   (addEventListener, confirm, matchMedia, navigator, location) without SSR
   guards. Added `globalThis.window === undefined` early returns and window
   refs.
4. [Unmount guards for async operations]: `handleExportCopy` in errors-tab used
   await without checking if component was still mounted. Added `isMountedRef`.

**Resolution:**

- Fixed: 24 items (1 Major, 21 Minor, 2 Trivial)
- Deferred: 0
- Rejected: 2 (auth-error-banner toast dedup — works correctly after #281 fix;
  NightReviewCard React namespace type — too minor, standard pattern)

**Key Learnings:**

- Set-based key lookup is preferable to regex for sensitive field detection —
  zero complexity cost, O(1) performance, easy to extend
- `typeof x === "undefined"` is only needed for undeclared variables; for
  properties of defined objects, direct comparison is cleaner
- When using `globalThis` for browser APIs, always guard with
  `globalThis.window === undefined` and assign `const win = globalThis.window`
  for consistent use
- Firestore queries should use `limit()` when the max result count is known

---

#### Review #283: PR #360 — IMS Pipeline Bug Fixes & Security Hardening (2026-02-11)

**Source:** Qodo Compliance + Qodo Code Suggestions + CI Failure **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 19 total (Critical: 1,
Major: 5, Minor: 8, Trivial: 1, Deferred: 4)

**Patterns Identified:**

1. **severity/impact field mismatch**: IMS items use `impact` field but
   mergeItems referenced `severity` — caused silent merge logic failure
   - Root cause: Copy from TDMS code which uses `severity` field
   - Prevention: Field name review when adapting code between systems
2. **Blank line filtering corrupts line numbers**: Filtering blank lines before
   iterating makes error line numbers wrong
   - Root cause: `content.split("\n").filter(...)` loses original line indexes
   - Prevention: Iterate all lines, skip blanks inside loop
3. **Shallow clone insufficient for prototype pollution**: safeCloneObject only
   cloned top-level — nested objects/arrays still shared
   - Root cause: Incomplete recursive implementation
   - Prevention: Always deep-clone when dealing with untrusted JSONL input

**Resolution:**

- Fixed: 15 items
- Deferred: 4 items (with TDMS tracking)
- Rejected: 0 items

**Key Learnings:**

- When adapting TDMS patterns to IMS, field names MUST be audited (severity vs
  impact)
- JSONL parsing should always preserve original line numbers
- safeCloneObject needs recursive deep clone for nested untrusted data
- Cross-source path normalization needs a dedicated normalizeFilePath function,
  not normalizeText (which strips path separators)

---

#### Review #284: PR #360 R2 — Remaining severity/impact + Security Depth (2026-02-11)

**Source:** Qodo Compliance + Qodo Code Suggestions R2 + CI Failure
**PR/Branch:** claude/new-session-NgVGX (PR #360) **Suggestions:** 12 total
(Critical: 1, Major: 3, Minor: 4, Skipped: 2, Deferred: 2)

**Patterns Identified:**

1. **Incomplete severity→impact sweep**: R1 only fixed mergeItems but missed
   hasHighImpact check, clustering primary selection, and final impact counts —
   3 more occurrences of `.severity` that should be `.impact`
   - Root cause: Searching for pattern in one function, not globally
   - Prevention: Always `grep -n .severity` across entire file after field
     rename
2. **Recursive clone without depth limit**: Deep clone can stack overflow on
   deeply-nested untrusted JSONL — need depth cap
3. **IMS routing established**: Design decisions now route to IMS (ENH-XXXX),
   technical debt routes to TDMS (DEBT-XXXX). Routing rule added to
   AI_REVIEW_PROCESS.md

**Resolution:**

- Fixed: 8 items (including 3 additional severity→impact bugs found by R2)
- Skipped: 2 items (regex lastIndex non-issue, counter_argument already tracked)
- Deferred to IMS: 2 items (ENH-0001, ENH-0002)

**Key Learnings:**

- When fixing a field rename (severity→impact), ALWAYS grep the entire file for
  ALL occurrences — not just the first function found
- Deep clone of untrusted data needs recursion depth limits
- Deferred PR items must be routed to the correct system (IMS vs TDMS) at time
  of deferral, not left as notes

---

#### Review #285: PR #360 R3 — Pre-commit Hook Fix, Final severity Sweep, Defensive Parsing (2026-02-11)

**Source:** Qodo Code Suggestions R3 + CI Failure **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 7 total (Critical: 1, Major:
2, Minor: 4)

**Patterns Identified:**

1. **DOCUMENTATION_INDEX.md Prettier CI failure (3rd occurrence!)**: Root cause
   identified — pre-commit hook regenerates the file AFTER lint-staged runs
   Prettier, so the regenerated file is unformatted. Fixed by adding
   `npx prettier --write` after `npm run docs:index` in the hook.
2. **severity→impact in resolve-item.js:220**: Yet another missed occurrence. R1
   fixed mergeItems, R2 fixed hasHighImpact/clustering/counts, R3 fixed display
   output. Lesson: field renames need `grep -rn` across the ENTIRE
   scripts/improvements/ directory, not just individual files.
3. **Object.create(null) for prototype-less clones**: Using `{}` still has
   Object.prototype, while `Object.create(null)` is truly safe for untrusted
   data.

**Resolution:**

- Fixed: 7 items
- Skipped: 0
- Deferred: 0

**Key Learnings:**

- Pre-commit hooks that regenerate files MUST re-run formatters before staging
- Field renames across a codebase need `grep -rn` on the ENTIRE directory
- Three rounds to fully sweep severity→impact proves grep-first approach is
  essential
- Object.create(null) is safer than {} for untrusted data cloning

---

#### Review #286: PR #360 R4 — Prototype Pollution, TOCTOU, Evidence Sanitization, CLI Robustness (2026-02-11)

**Source:** Qodo Compliance R4 + Qodo Code Suggestions R4 **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 11 total (Major: 2, Minor:
5, Trivial: 1, Deferred: 3 — 1 new IMS + 2 already tracked)

**Patterns Identified:**

1. **safeCloneObject must be applied immediately after JSON.parse**: The
   prototype pollution fix (safeCloneObject) was being bypassed because the raw
   parsed object was passed to validateAndNormalize before cloning. Clone at the
   earliest point possible.
2. **TOCTOU in path validation**: validateAndVerifyPath returns a realPath but
   the code was still using the original filePath for subsequent reads. Always
   use the validated realPath for file operations.
3. **Evidence array type sanitization**: Evidence arrays from JSONL may contain
   non-string values. Filter to strings + trim + deduplicate.
4. **UTF-8 BOM on first line**: Files saved from Windows editors may have BOM
   prefix that breaks JSON.parse on line 1.
5. **Absolute script paths in execFileSync**: Using relative paths like
   "scripts/improvements/..." fails if CWD is not project root. Use
   path.join(\_\_dirname, ...) instead.

**Resolution:**

- Fixed: 8 items
- Skipped: 0
- Deferred: 3 (1 new ENH-0003 Markdown injection, 2 already tracked)

**Key Learnings:**

- safeCloneObject must wrap JSON.parse output BEFORE any property access
- TOCTOU: always use validated/resolved path for all subsequent file operations
- Evidence arrays need type + trim + dedup sanitization (not just Array.isArray)
- BOM stripping is essential for cross-platform JSONL parsing
- CLI scripts must use \_\_dirname-relative paths for execFileSync portability
- Logging functions should never crash the main flow — wrap in try/catch
- Validation errors go to stderr (console.error), not stdout (console.log)

---

#### Review #287: PR #360 R5 — impactSort Falsy Bug, ID Drift, Audit Outcome, Evidence Sanitization (2026-02-11)

**Source:** Qodo Compliance R5 + Qodo Code Suggestions R5 **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 8 total (Major: 2, Minor: 5,
Deferred: 1)

**Patterns Identified:**

1. **Falsy 0 in lookup tables**: `order[a.impact] || 4` treats I0 (value 0) as
   falsy, making I0 items sort last instead of first. Use `??` (nullish
   coalescing) for numeric lookup tables.
2. **ID drift from @line: suffixes in merged_from**: Source IDs with `@line:N`
   suffixes don't match their base form during ID lookup, causing duplicate ENH
   IDs across regeneration cycles.
3. **Always sanitize, not just on merge**: Evidence arrays should be sanitized
   unconditionally, not only when secondary has items — otherwise malformed data
   in primary persists.
4. **Audit log outcome field**: Without an explicit success/failure outcome,
   downstream consumers must infer result from error counts.

**Resolution:**

- Fixed: 7 items
- Skipped: 0
- Deferred: 1 (resource exhaustion — already DEBT-2747 S2 scope)

**Key Learnings:**

- `||` vs `??` for numeric lookup: 0 is falsy, null/undefined are nullish
- merged_from IDs with @line: suffixes need base-form normalization for stable
  lookups
- Evidence sanitization must run unconditionally (no guard on secondary length)
- Audit logs need explicit outcome field (success/partial_failure/failure)
- logIntake needs same try/catch pattern as logResolution (Review #286 R4)
- BOM stripping needed in intake-audit.js too, not just validate-schema.js

---

#### Review #288: PR #360 R6 — Semantic Merge Logic, PII in Logs, Timestamp Integrity, Path Normalization (2026-02-11)

**Source:** Qodo Compliance R6 + Qodo Code Suggestions R6 **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 10 total (Major: 2, Minor:
6, Deferred: 2)

**Patterns Identified:**

1. **Flag-only vs destructive merge**: Pass 3 semantic matches were flagged for
   review AND merged simultaneously — defeating the purpose of the review flag.
   Changed to flag-only (no merge) so human review is meaningful.
2. **PII in audit logs**: Raw operator username and full input_file paths
   constitute PII. Hash the operator (SHA-256 truncated to 12 chars) and log
   only `path.basename(inputFile)`.
3. **Timestamp integrity**: `{ timestamp, ...activity }` lets the activity
   object overwrite the timestamp. Reversed spread order:
   `{ ...activity, timestamp }`.
4. **Stateful regex in loops**: `RegExp.test()` with global/sticky flags has
   stateful `lastIndex`, causing intermittent failures in loops.

**Resolution:**

- Fixed: 8 items
- Skipped: 0
- Deferred: 2 (streaming JSONL — arch change; dedup audit coverage — scope
  expansion)

**Key Learnings:**

- Semantic match Pass 3 should flag-only, not merge — uncertain items need human
  review
- PII compliance: hash usernames, log only basenames of file paths
- Spread order matters: `{ ...obj, timestamp }` protects system-generated fields
- Guard `RegExp.test()` in loops against stateful g/y flags
- `normalizeFilePath` should strip trailing `:line` suffixes for hash
  consistency
- Non-object JSON (null, arrays, primitives) can pass `JSON.parse()` — validate
  type
- Audit outcome should reflect scope: "ingested" vs "success" when downstream
  steps remain
- Empty evidence arrays should be deleted, not set to `[]`

---

#### Review #289: PR #360 R7 — Symlink Guards, Pass 3 File Grouping, Schema Hardening, Honesty Guard (2026-02-11)

**Source:** Qodo Compliance R7 + Qodo Code Suggestions R7 **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 12 total (Major: 1, Minor:
9, Deferred: 2)

**Patterns Identified:**

1. **Symlink file overwrite**: Writing to fixed JSONL paths without checking for
   symlinks enables local arbitrary file write. Added `assertNotSymlink()` guard
   using `fs.lstatSync()` before all file writes.
2. **Pass 3 file grouping**: Grouping items by file path before pairwise
   comparison reduces semantic match cost from O(n²) to O(n²/k) where k is the
   number of unique files. Partially addresses DEBT-2747.
3. **Honesty guard**: Enhancement-audit format items should require
   `counter_argument` to maintain data integrity.
4. **Schema config hardening**: Array validation should check element types, not
   just `Array.isArray()`. Confidence threshold needs range bounds (0-100).

**Resolution:**

- Fixed: 10 items
- Skipped: 0
- Deferred: 2 (evidence dedup data fix, placeholder provenance data fix —
  pipeline handles)

**Key Learnings:**

- Symlink guard pattern: `fs.lstatSync().isSymbolicLink()` before writes, ENOENT
  is safe
- File grouping for pairwise passes reduces complexity proportionally to file
  distribution
- `new RegExp(source)` drops flags — use
  `new RegExp(source, flags.replace(/g|y/g, ""))` + `lastIndex=0`
- Non-fatal operator hashing: initialize with fallback, single try/catch,
  String() coercion
- Honesty guard: `counter_argument` required for enhancement-audit format inputs
- Whitespace-only strings should be treated as missing for required fields
- Schema arrays should validate element types (isStringArray), not just
  Array.isArray
- Confidence threshold needs range validation (0-100) in schema config

---

#### Review #290: PR #360 R8 — CI Fix, Pass 0 No-File Guard, Symlink Guards Expansion, Format Precision (2026-02-11)

**Source:** Qodo Compliance R8 + Qodo Code Suggestions R8 + CI Failure
**PR/Branch:** claude/new-session-NgVGX (PR #360) **Suggestions:** 12 total
(Blocker: 2, High: 1, Minor: 8, Deferred: 1)

**Patterns Identified:**

1. **CI blocker**: Pattern checker flagged `err.message` in assertNotSymlink
   catch blocks — needed `instanceof Error` guard to satisfy automated checker.
2. **Pass 0 no-file guard**: Items without file paths were grouped together by
   empty string key, causing unrelated items to merge. Use `randomUUID()` keys.
3. **Symlink guard expansion**: logIntake() and all generate-views.js write
   paths needed assertNotSymlink() before writes.
4. **Enhancement-audit format precision**: Truthy checks on fields like `[]` or
   `""` could false-positive; need type-precise checks.
5. **Pass 3 safety cap**: 50,000 comparison cap per file group prevents hang on
   pathological inputs.

**Resolution:**

- Fixed: 11 items (2 CI blockers + 9 improvements)
- Deferred: 1 (evidence dedup data fix — pipeline handles)

**Key Learnings:**

- Pattern checker requires `instanceof Error` before `.message` — use canonical
  form
- Pass 0 parametric dedup: items without `file` must not share group keys
- `crypto.randomUUID()` creates unique keys for ungroupable items
- Enhancement-audit detection: check `typeof === "string" && trim()` and
  `Array.isArray && length > 0`
- `__dirname` for child script paths ensures CWD independence
- Fingerprint field needs type guard (`typeof !== "string"` → error, not crash)
- Number.isFinite rejects NaN/Infinity; for-loop catches sparse array holes

---

#### Review #291: PR #360 R9 — Prototype Pollution Guard, Fail-Closed Symlink, Atomic Writes (2026-02-11)

**Source:** Qodo Compliance R9 + Qodo Code Suggestions R9 **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 12 total (High: 5, Medium:
3, Low: 3, Deferred: 1)

**Patterns Identified:**

1. **Prototype pollution**: JSONL records parsed from disk need `__proto__`,
   `constructor`, `prototype` keys stripped before spread/merge —
   `safeCloneObject`.
2. **Fail-closed symlink guard**: EACCES/EPERM during lstat means we can't
   verify symlink status — must refuse write, not silently proceed.
3. **Atomic write for canonical output**: MASTER_IMPROVEMENTS.jsonl needs atomic
   write-to-tmp-then-rename in generate-views.js (already done in
   resolve-item.js).
4. **Schema-stable reviewNeeded entries**: `item_a` should always be a full item
   (or null), metadata goes in a separate `meta` field.
5. **Symlink guard coverage**: generate-metrics.js (3 write paths) and
   resolve-item.js (saveMasterImprovements + logResolution) were unguarded.

**Resolution:**

- Fixed: 10 items across 5 files
- Deferred: 1 (evidence dedup data fix — pipeline handles)

**Key Learnings:**

- `safeCloneObject` with `Object.create(null)` prevents prototype pollution from
  JSONL
- Fail-closed: if lstat throws EACCES/EPERM, throw rather than silently continue
- Atomic write pattern: writeFileSync to `.tmp.${pid}` + renameSync + finally
  cleanup
- reviewNeeded entries: consistent shape (`item_a`, `item_b`, `meta`) aids
  downstream
- Acceptance evidence: sanitize with type coercion, trim, filter, and length cap
  (500)
- BOM strip on first line + CRLF trimEnd prevents parse failures on
  Windows-edited files

---

#### Review #292: PR #360 R10 — Fail-Closed Guards, safeClone Coverage, DoS Cap, Audit Trail (2026-02-11)

**Source:** Qodo Compliance R10 + Qodo Code Suggestions R10 **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 11 code + 4 compliance
(High: 5, Medium: 4, Low: 2, Compliance: 4)

**Patterns Identified:**

1. **assertNotSymlink fail-closed**: Previous impl swallowed unknown errors —
   must rethrow to prevent silent bypass of symlink protection.
2. **safeCloneObject coverage gap**: resolve-item.js and validate-schema.js
   parsed JSONL without prototype pollution protection (dedup + generate-views
   already had it).
3. **Temp file hardening**: Atomic write tmp files need their own symlink
   check + `wx` flag to prevent TOCTOU race conditions.
4. **Algorithmic DoS**: Pass 2 (near-match) was unbounded O(n^2) — added
   5000-item cap.
5. **Audit trail**: dedup-log.jsonl lacked operator/timestamp metadata for
   traceability.
6. **Pipeline write resilience**: Append writes to
   normalized-all.jsonl/deduped.jsonl were unwrapped, risking partial state on
   I/O failure.

**Resolution:**

- Fixed: 11 items across 7 files (5 scripts + validate-schema + learnings log)
- Deferred: 1 (evidence data dedup — pipeline handles)

**Key Learnings:**

- assertNotSymlink must rethrow at end of catch to fail closed on unexpected
  errors
- `{ flag: "wx" }` prevents overwriting existing tmp files (TOCTOU defense)
- Pairwise pass cap (MAX_PAIRWISE_ITEMS=5000) prevents quadratic blowup
- run_metadata entry in dedup log enables standalone execution reconstruction
- Pipeline append writes need try/catch + process.exit(2) for controlled failure
- Sanitize BOTH existing evidence and new acceptance evidence for consistency

---

#### Review #293: PR #360 R11 — Markdown Injection, EEXIST Recovery, Windows Compat, Schema Validation (2026-02-11)

**Source:** Qodo Compliance R11 + Qodo Code Suggestions R11 **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 11 code + 2 compliance
(Security: 2, Medium: 7, Low: 2, Compliance: 2)

**Patterns Identified:**

1. **Markdown injection**: escapeMarkdown only handled pipe/newline — need HTML
   tag stripping to prevent `<script>` injection in rendered Markdown views.
2. **Stale temp files**: `wx` flag fails on EEXIST if a previous run crashed —
   need cleanup-and-retry fallback.
3. **Deep nesting**: safeCloneObject silently truncated at depth 200 — should
   throw to surface malicious/malformed input explicitly.
4. **Non-fatal fallback writes**: deduped.jsonl is regenerated by dedup
   pipeline, so write failure should warn rather than exit(2).
5. **Cross-source pollution**: MASTER_DEBT.jsonl parser lacked safeCloneObject
   protection (moved safeCloneObject to module scope).
6. **Terminal escape injection**: Untrusted content in error messages could
   inject ANSI escape sequences into terminal output.
7. **Windows compat**: fs.renameSync fails on Windows when destination exists —
   need unlink-before-rename pattern.

**Resolution:**

- Fixed: 11 items across 7 files (6 scripts + learnings log)
- Deferred: 0

**Key Learnings:**

- `<[^>]*>` regex strips HTML tags from Markdown output to prevent injection
- EEXIST recovery: unlink stale tmp + retry with wx flag
- safeCloneObject should throw on depth > 200, not silently truncate
- Fallback/regenerable files should use console.warn, not process.exit
- Terminal escape strip regex:
  `/[\u001b\u009b][[()#;?]*...[0-9A-ORZcf-nqry=><]/g`
- Windows rename compat: `if (existsSync) unlinkSync` before `renameSync`
- Schema config arrays should be validated immediately after load

---

#### Review #294: PR #360 R12 — CI Fix, TOCTOU Recheck, BiDi Strip, ID Validation, Log Decoupling (2026-02-11)

**Source:** CI Failure (ESLint no-control-regex) + Qodo Compliance R12 + Qodo
Code Suggestions R12 **PR/Branch:** claude/new-session-NgVGX (PR #360)
**Suggestions:** 12 code + 2 compliance (Security: 2, Medium: 7, Low: 3,
Compliance: 2)

**Patterns Identified:**

1. **CI failure**: `eslint-disable-next-line` doesn't work when the regex is on
   a subsequent line from `.replace(` — use block-level
   `eslint-disable`/`enable` instead.
2. **TOCTOU recheck**: assertNotSymlink must be called immediately before
   unlinkSync, not just at function entry, to close the race window.
3. **BiDi spoofing**: Unicode bidirectional control characters (\u202A-\u202E,
   \u2066-\u2069) can spoof terminal/log output — strip them.
4. **escapeMarkdown robustness**: Non-string inputs need String() coercion; \r\n
   should be normalized, not just \n.
5. **ID propagation**: Only valid ENH-XXXX IDs should populate idMap —
   invalid/legacy IDs should not be mapped for stable lookup.
6. **Log decoupling**: Separate try/catch for log vs review file writes prevents
   one failure from blocking the other.
7. **Line number strictness**: parseInt("12abc", 10) silently returns 12 — use
   digits-only regex guard.

**Resolution:**

- Fixed: 12 items across 6 scripts + learnings log
- Deferred: 0
- CI: green (0 ESLint errors)

**Key Learnings:**

- `eslint-disable-next-line` applies to the NEXT LINE only; multi-line
  `.replace()` calls put the regex on line+2, requiring block-level
  disable/enable
- Extracted `sanitizeLogSnippet()` with compiled regexes at module scope for
  reuse
- TOCTOU mitigation: re-assert symlink check immediately before destructive
  operation
- BiDi control chars: `/[\u202A-\u202E\u2066-\u2069]/g`
- `String(text)` coercion handles numeric/boolean inputs in escapeMarkdown
- `/^\d+$/.test(s)` guards parseInt from accepting malformed strings like
  "12abc"
- `toLineNumber()` should reject 0 and negative values for line numbers

---

#### Review #295: PR #359 — Unsafe err.message, Silent Catches, Full Filepath Logging (2026-02-10)

**Source:** SonarCloud + Qodo + CI Pattern Compliance **PR/Branch:** PR #359
(claude/analyze-repo-install-ceMkn) **Suggestions:** 15 total (Critical: 9,
Major: 0, Minor: 4, Trivial: 0)

**Patterns Identified:**

1. **Unsafe err.message access (recurring)**: Wave 2 agents added `console.warn`
   with `err.message` but didn't use safe pattern
   - Root cause: Agent prompt didn't specify the safe pattern explicitly
   - Prevention: Pattern checker catches this in CI; always use
     `err instanceof Error ? err.message : String(err)`
2. **Silent catch blocks**: Empty catches swallow errors, hindering debugging
   - Root cause: Defensive "don't break hooks" approach went too far
   - Prevention: Always log at minimum `console.warn` with context

**Resolution:**

- Fixed: 13 items (9 unsafe err.message, 2 silent catches, 2 filepath logging)
- Deferred: 2 items (atomic writes for state files — architectural change)
- Rejected: 1 item (SonarCloud L396 false positive — checklist text contains
  "Error" word)

**Key Learnings:**

- Agent-generated code must be validated against project pattern rules
- The `err instanceof Error ? err.message : String(err)` pattern is enforced by
  CI — new code MUST use it

---

#### Review #296: PR #359 R2 — Path Redaction, Atomic Writes, State Dir Fallback (2026-02-10)

**Source:** Qodo Compliance + Code Suggestions **PR/Branch:** PR #359
(claude/analyze-repo-install-ceMkn) **Suggestions:** 7 total (Critical: 0,
Major: 2, Minor: 5, Trivial: 0)

**Patterns Identified:**

1. **Path info leakage (conflicting reviews)**: Review #283 Qodo asked for full
   paths; Review #284 Qodo flagged full paths as security risk. Resolution: use
   `path.basename()` — security wins over debuggability
   - Root cause: Reviewers optimize for different concerns
   - Prevention: Default to `path.basename()` in hook logs
2. **Non-atomic file writes**: `writeFileSync` without tmp+rename risks
   corruption on interruption
   - Root cause: Original code used simple writeFileSync
   - Prevention: Always use tmp+rename pattern for state files

**Resolution:**

- Fixed: 7 items (2 path redaction, 4 atomic writes, 1 state dir fallback)
- Deferred: 0
- Rejected: 0

**Key Learnings:**

- When reviewers conflict, security concerns take priority
- Atomic write pattern: `writeFileSync(tmp) → renameSync(tmp, target)`
- State dir creation should fall back to projectDir on failure

---

#### Review #297: PR #359 R3 — Windows Atomic Writes, Null State Dir, Evidence Dedup (2026-02-11)

**Source:** Qodo Code Suggestions **PR/Branch:** PR #359
(claude/analyze-repo-install-ceMkn) **Suggestions:** 11 total (Critical: 0,
Major: 0, Medium: 8, Low: 3)

**Accepted (10):**

1. **state-utils.js getStateDir null fallback**: Return `null` instead of
   `projectDir` when state dir creation fails — prevents writing to wrong
   location. Updated all 4 callers with null guards.
2. **Windows-safe atomic writes (7 locations)**: Added
   `fs.rmSync(dest, {force: true})` before `fs.renameSync()` across
   session-start.js, large-context-warning.js (2x), agent-trigger-enforcer.js
   (2x), commit-tracker.js, auto-save-context.js. Also added `.tmp` cleanup in
   catch blocks where missing.
3. **DEBT-2450 evidence dedup**: Removed duplicated `code_reference` and
   `description` objects in MASTER_DEBT.jsonl and deduped.jsonl.

**Deferred (1):**

1. **merged_from unknown removal**: Removing `merged_from: ["unknown"]` could
   break downstream scripts that expect the field to always exist.

**Key Pattern:** Windows `fs.renameSync` fails if destination exists — always
`rmSync` first. This is CODE_PATTERNS.md "Windows atomic rename" pattern
(already documented).

---

#### Review #298: PR #361 — Graduation State Safety, Append Flag, JSON Parse Guards (2026-02-12)

**Source:** Qodo Compliance + SonarCloud + Qodo Code Suggestions + Doc Lint
**PR/Branch:** PR #361 (claude/analyze-repo-install-ceMkn) **Suggestions:** 19
total (Critical: 0, Major: 5, Minor: 8, Trivial: 4, Deferred: 1)

**Patterns Identified:**

1. TOCTOU in loadWarnedFiles: existsSync + readFileSync race condition
   - Root cause: Copied common Node.js pattern without thinking about atomicity
   - Prevention: Direct read in try/catch, check err.code for ENOENT
2. Non-atomic saveWarnedFiles: writeFileSync without tmp+rename
   - Root cause: "Best effort" state file didn't seem critical enough for atomic
   - Prevention: All state files should use atomic write pattern
3. Unbounded file growth via read+append pattern: readFileSync + writeFileSync
   - Root cause: Didn't know about `{ flag: 'a' }` option
   - Prevention: Use append flag for JSONL files
4. Silent catch blocks in the very file that detects them (ironic)
   - Root cause: Graduation state is "best effort" but still needs visibility
   - Prevention: At minimum log with sanitizeError
5. SonarCloud regex DoS (5 hotspots): Patterns in check-pattern-compliance.js
   - Assessment: SAFE — inputs are bounded source files, not user input
   - V8 has backtracking limits; pre-commit has timeout protections
6. ESLint auto-fix generates swallowed catch blocks
   - Root cause: Template aimed for minimal disruption, too minimal
   - Prevention: Auto-fix should re-throw to preserve failure behavior

**Resolution:**

- Fixed: 17 items
- Deferred: 1 item (consolidate regex linter into ESLint — architectural scope)
- Reviewed-Safe: 5 SonarCloud regex hotspots (bounded input, not user-facing)

**Key Learnings:**

- State persistence code needs the same rigor as production code
- Pattern checker should eat its own dog food (practice what it preaches)
- JSONL append: use `{ flag: 'a' }` not read+concatenate+write

---

#### Review #299: PR #361 R2 — Cognitive Complexity, ESLint Fixer Safety, Cross-Platform Fixes (2026-02-12)

**Source:** SonarCloud + Qodo Code Suggestions **PR/Branch:** PR #361
(claude/analyze-repo-install-ceMkn) **Suggestions:** 23 total (Critical: 3,
Major: 10, Minor: 10)

**Patterns Identified:**

1. Cognitive complexity extraction: SonarCloud flags functions at CC 16-17
   (threshold 15)
   - Root cause: Mixed concerns in single functions (formatting + logic + I/O)
   - Prevention: Extract formatting helpers (formatResultRow, printViolation,
     printSummaryFooter)
2. ESLint auto-fixer scope safety: VariableDeclaration wrapping changes variable
   scope
   - Root cause: Auto-fix assumed all statements could be wrapped in try/catch
   - Prevention: Only auto-fix ExpressionStatements, return null for others
3. Cross-platform atomic rename: renameSync fails on Windows if destination
   exists
   - Root cause: POSIX rename is atomic, Windows rename requires destination
     removal
   - Prevention: unlinkSync destination before renameSync
4. Path normalization for state tracking: backslash vs forward slash
   inconsistency
   - Root cause: Windows paths use backslash, state keys stored with mixed
     separators
   - Prevention: Normalize with replaceAll("\\", "/") before key creation
5. Parser-agnostic AST node positioning: ESLint rules using deprecated
   node.start/end
   - Root cause: Different parsers provide range or loc but not both
   - Prevention: Check range first, fall back to loc-based calculation
6. String.raw SonarCloud findings: False positive on regex literal `[\\/]`
   - Root cause: SonarCloud can't distinguish regex escapes from string escapes
   - Resolution: Reviewed-safe (regex literals, not template strings)

**Resolution:**

- Fixed: 18 items
- Reviewed-safe: 5 (3 regex complexity in detection patterns, 2 String.raw false
  positives)

**Key Learnings:**

- Extract helper functions to reduce cognitive complexity below SonarCloud
  threshold
- ESLint auto-fixers must never change variable scope (wrap only
  ExpressionStatements)
- Windows needs unlinkSync before renameSync for atomic write pattern
- Normalize path separators in state tracking keys for cross-platform
  consistency
