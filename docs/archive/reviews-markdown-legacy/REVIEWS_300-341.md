<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-05
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Archived Reviews #300-#341

Reviews archived from AI_REVIEW_LEARNINGS_LOG.md. Repaired on 2026-03-05.

---

#### Review #300: PR #351 ROADMAP Cleanup - CI + Qodo + SonarCloud (2026-02-08)

**Source:** Mixed (CI failures, Qodo PR Suggestions, SonarCloud S5852)
**PR/Branch:** claude/cherry-pick-commits-yLnZV (PR #351) **Suggestions:** 10
total (Critical: 0, Major: 2, Minor: 6, Trivial: 0, Rejected: 2)

**Patterns Identified:**

1. [Doc lint required sections]: Tier 2 docs require `Purpose/Overview/Scope`
   and `Version History` sections — TDMS plan was missing both
   - Root cause: Plan was written before doc linting was enforced
   - Prevention: Doc header + section check runs in CI on all changed `.md`
     files
2. [ReDoS in frontmatter regex]: `[\s\S]*?` with `^---` anchor creates
   backtracking risk (SonarCloud S5852)
   - Root cause: Regex used nested `[\s\S]*?` quantifiers
   - Prevention: Use string-based parsing (indexOf + split) for frontmatter
3. [Case-insensitive installId]: Plugin matching failed when case differed
   between `claude plugin list` output and marketplace directory names
   - Root cause: Set comparison was case-sensitive
   - Prevention: Normalize to lowercase on both add and lookup
4. [CLI flag injection via user args]: User query passed directly to
   `execFileSync` args could be interpreted as flags
   - Root cause: No `--` separator before user-controlled arguments
   - Prevention: Always add `--` before user input in execFileSync calls

**Resolution:**

- Fixed: 8 items (TDMS Purpose + Version History, readFileSync try/catch ×2,
  ReDoS regex → string parsing, case-insensitive installId, empty array catch,
  `--` flag injection, args as array)
- Rejected: 2 items (`.agents` naming is correct, slice vs substring no
  difference)

**Key Learnings:**

- Auto-generated DOCUMENTATION_INDEX.md picks up
  `<!-- prettier-ignore-start -->` as description if it's the first non-heading
  line — need to fix generator
- Pattern compliance `pathExcludeList` is the correct way to handle verified
  try/catch files

---

#### Review #301: PR #342 Multi-AI Audit Data Quality - Doc Lint + Qodo (2026-02-06)

**Source:** Doc Lint + Qodo Code Suggestions **PR/Branch:**
claude/cherry-pick-commits-yLnZV (PR #342) **Suggestions:** 18 total (Doc Lint:
10, Qodo: 8; Fixed: 14, Deferred: 1, Rejected: 3)

**Patterns Identified:**

1. [SKILL.md Relative Paths]: Links in .claude/skills/ used repo-root-relative
   paths instead of ../../../ prefix
   - Root cause: Author wrote links relative to repo root, not file location
   - Prevention: Doc lint catches this automatically; run before commit

2. [JSONL Severity Standardization]: Kimi-sourced findings used P2/P3 instead of
   S2/S3
   - Root cause: Kimi model outputs non-standard severity format
   - Prevention: fix-schema.js should normalize P-severity to S-severity

3. [Duplicate CANON Entries]: 4 CANON-PERFORMANCE entries for same
   images.unoptimized finding, 1 CANON-SECURITY duplicate for App Check
   - Root cause: aggregate-category.js fingerprint matching not catching all
     variations
   - Prevention: Add fingerprint normalization (lowercase, strip punctuation)

4. [Key Naming Inconsistency]: suggested_fix vs remediation in raw JSONL
   - Root cause: Schema field was renamed but not all entries updated
   - Prevention: fix-schema.js should normalize key names

**Resolution:**

- Fixed: 14 items (SKILL.md lint x10, CANON dedup x4, severity x8, key x1)
- Deferred: 1 item (intermediate file .gitignore - architectural decision)
- Rejected: 3 items (evidence "cleanup" too minor to warrant changes)

**Key Learnings:**

- Skills in .claude/skills/ need ../../../ prefix for repo-root file links
- Kimi model outputs P-severity; add normalization to fix-schema.js pipeline
- aggregate-category.js needs more aggressive fingerprint dedup

---

#### Review #302: PR #361 R3 — Symlink Clobber, Backup-and-Replace, ESLint Loc Fallback, O(n) Index (2026-02-12)

**Source:** Qodo Compliance + Qodo Code Suggestions + SonarCloud **PR/Branch:**
PR #361 (claude/analyze-repo-install-ceMkn) **Suggestions:** 14 total (Critical:
0, Major: 3, Minor: 6, Trivial: 1, Rejected: 4)

**Patterns Identified:**

1. Symlink clobber on state writes: `saveWarnedFiles` and `appendMetrics` wrote
   to fixed paths without verifying they're not symlinks
   - Root cause: mkdirSync + writeFileSync pattern doesn't check symlinks
   - Prevention: Always lstatSync before writing to verify not a symlink
2. State loss on failed rename: delete-then-rename loses data if rename fails
   - Root cause: unlinkSync before renameSync is not atomic
   - Prevention: backup-and-replace pattern (rename old to .bak, rename new,
     delete .bak)
3. ESLint fixer crash without loc: `target.loc.start.column` crashes if loc
   missing
   - Root cause: Some parsers don't populate loc
   - Prevention: Always guard with `target.loc ? ... : fallback`

**Resolution:**

- Fixed: 10 items (3 MAJOR, 6 MINOR, 1 TRIVIAL)
- Rejected: 4 items (String.raw x2 = regex false positives, regex complexity 38
  = kept for detection accuracy, i assignment x2 = intentional skip behavior)

**Key Learnings:**

- Our own BOM-handling pattern checker missed our own new code (ironic)
- Backup-and-replace is safer than delete-then-rename for atomic writes on
  Windows
- O(n^2) nested loop in TOCTOU rule indexed to O(n) with Map

---

#### Review #303: PR #361 R4 — TOCTOU Symlink, Corrupt State Guard, Cognitive Complexity, Bug Fix (2026-02-12)

**Source:** Qodo Compliance + Qodo Code Suggestions + SonarCloud **PR/Branch:**
PR #361 (claude/analyze-repo-install-ceMkn) **Suggestions:** 20 total (Critical:
1, Major: 2, Minor: 7, Trivial: 5, Rejected: 5)

**Patterns Identified:**

1. TOCTOU in symlink check: existsSync before lstatSync is racy
   - Root cause: check-then-use pattern on filesystem
   - Prevention: Call lstatSync directly, handle ENOENT in catch
2. Corrupt state wipes graduation history: loadWarnedFiles returned {} on parse
   error
   - Root cause: Same fallback for "no file" and "corrupt file"
   - Prevention: Return null for corruption, {} for ENOENT, caller uses ??
3. `exclude` vs `pathExclude` property name bug in writefile-missing-encoding
   - Root cause: Copy-paste from different pattern format
   - Prevention: Schema validation for pattern definitions

**Resolution:**

- Fixed: 10 items
- Rejected: 5 items (String.raw x2, regex 38, i assignment x2 — repeats from
  R2/R3)

**Key Learnings:**

- existsSync+lstatSync is itself a TOCTOU; call lstatSync directly
- Extract helpers (tryUnlink, isSymlink) to reduce cognitive complexity
- Property name typos in config objects are silent bugs

---

#### Review #304: PR #361 R5 — State Wipe Prevention, Dir Symlink Guard, Fixer Safety (2026-02-12)

**Source:** Qodo Compliance + Qodo Code Suggestions + SonarCloud **PR/Branch:**
PR #361 (claude/analyze-repo-install-ceMkn) **Suggestions:** ~22 total (6 new
fixes, 5+ repeats rejected, rest compliance notes)

**Patterns Identified:**

1. Corrupt state wipe: loadWarnedFiles null + saveWarnedFiles overwrite = data
   loss
   - Root cause: applyGraduation saved even when load failed
   - Prevention: Track null vs {} separately, skip save on null
2. Directory-level symlink attacks: checking files but not parent dir
   - Root cause: Only file-level symlink check, dir can also be a symlink
   - Prevention: Check dir with isSymlink() before mkdirSync/writes

**Resolution:**

- Fixed: 6 items (state wipe prevention, dir symlink x2, isSymlink try/catch,
  ESLint fixer return removal, null title guard)
- Rejected: 16 items (repeats: String.raw, regex 38, i assignment, catch naming,
  empty catch; compliance notes: acceptable risk for local dev tool)

**Key Learnings:**

- When loadWarnedFiles returns null (corruption), caller must NOT overwrite
- Directory symlinks are as dangerous as file symlinks
- ESLint auto-fix `return;` is invalid outside functions — use empty TODO block

---

#### Review #305: PR #362 R1 — IMS→TDMS Merge Cognitive Complexity + Code Quality (2026-02-12)

**Source:** SonarCloud (5 issues) + Qodo Compliance (1) + Qodo Suggestions (8)
**PR/Branch:** PR #362 (claude/new-session-uaNwX) **Suggestions:** 14 total
(Fix: 9, Defer: 3, Dismiss: 1, False Positive: 1)

**Patterns Identified:**

1. Shared helper extraction for duplicated format-mapping logic
   - Root cause: mapDocStandardsToTdms and mapEnhancementAuditToTdms had 60+
     duplicated lines
   - Prevention: Extract mapFirstFileToFile + mapCommonAuditFields shared
     helpers
2. Enhancement field preservation loop replaces 10 individual if-statements
   - Root cause: Each field checked individually → high cognitive complexity
   - Prevention: preserveEnhancementFields iterates field array
3. Format stats/warnings printing extracted from main results function
   - Root cause: printProcessingResults had 3 nested print sections
   - Prevention: printFormatStats + printFilePathWarnings helpers

**Resolution:**

- Fixed: SC-1 (complexity 47→~12), SC-2 (replaceAll), SC-3 (negated condition),
  SC-4 (complexity 33→~18), SC-5 (complexity 26→~8), QS-3 (warnings on error),
  QS-5 (store normalized path), QS-6 (skip non-string coercion), QS-8 (log
  schema)
- Deferred: QS-1 (pluggable architecture), QS-2 (shared isValidFilePath export),
  QS-7 (dotless filenames)
- False Positive: QC-1 (operator already added at L867-873)

**Key Learnings:**

- Shared helpers reduce complexity across multiple callers simultaneously
- replaceAll() preferred over replace(/pattern/g) (SonarCloud es2021 rule)
- Return warnings alongside errors for complete validation feedback

---

#### Review #306: PR #362 R2 — Edge Cases: Line 0, Falsy Fields, Windows Paths (2026-02-12)

**Source:** Qodo Compliance (5) + Qodo Suggestions (6) **PR/Branch:** PR #362
(claude/new-session-uaNwX) **Suggestions:** 11 total (Fix: 4, Dismiss: 7)

**Patterns Identified:**

1. Line 0 is falsy in JS: `if (item.line)` fails for `line: 0`
   - Prevention: Use `!== undefined` for numeric fields that can be 0
2. Empty string is falsy: truthy check drops valid empty `counter_argument`
   - Prevention: Use `!== undefined` for string fields that can be empty
3. Windows path separator not checked in `isValidFilePath`
   - Prevention: Check for `.`, `/`, AND `\\` in path validation

**Resolution:**

- Fixed: QS-1 (line 0 edge case), QS-4 (preserveEnhancementFields !==
  undefined), QS-5 (isValidFilePath trim + backslash), QS-6 (validate-schema.js
  consistency)
- Dismissed: SEC-1 (terminal escape - CLI tool), CMP-1/CMP-2 (pre-existing
  code), CMP-3 (repeat), CMP-4 (trusted input), QS-2 (contradicts R1), QS-3
  (schema guarantees)

**Key Learnings:**

- `!== undefined` is safer than truthy check for any field that accepts 0 or ""
- File path validation should handle Windows backslash separators
- Qodo R2 sometimes contradicts R1 suggestions (pr_number null vs omit)

---

#### Review #307: PR #362 R3 — SonarCloud Negated Condition + File Path Warning Guard (2026-02-12)

**Source:** Qodo Compliance (3) + Qodo Suggestions (5) + SonarCloud (1)
**PR/Branch:** PR #362 (claude/new-session-uaNwX) **Suggestions:** 9 total (Fix:
2, Dismiss: 7)

**Patterns Identified:**

1. Negated conditions reduce readability: `if (x !== undefined)` puts the
   exceptional case first
   - Prevention: Put positive/meaningful case first with `=== undefined`
2. Missing guard on file path warning: items with no `file` field get false
   "invalid path" warnings
   - Prevention: Guard with `normalizedFile &&` before validation

**Resolution:**

- Fixed: SC-1 (flip negated condition L128), QS-5 (guard file path warning)
- Dismissed: CMP-1 (operator field already present since R1), CMP-2 (historical
  JSONL data, not code), CMP-3 (warnings-not-errors by design), QS-1 (regex
  guarantees digits), QS-2 (validate-schema already guards), QS-3 (.test()
  converts to string), QS-4 (ensureValid covers types)

**Key Learnings:**

- SonarCloud "unexpected negated condition" catches real readability issues
- File validation should skip items without file fields entirely, not warn

---

#### Review #308: PR #362 R4 — ReDoS Fix, Cognitive Complexity, Cross-Validation, Atomic Writes (2026-02-12)

**Source:** SonarCloud (1 CRITICAL) + Qodo Compliance (6) + Qodo Suggestions
(11) **PR/Branch:** PR #362 (claude/new-session-uaNwX) **Suggestions:** 18 total
(Fix: 12, Dismiss: 6)

**Key Patterns:**

1. **S5852 ReDoS: Replace lazy `[^|]+?` with greedy `[^|]*` in table-parsing
   regex** (CRITICAL) — Lazy quantifiers on negated character classes create
   catastrophic backtracking. Greedy `[^|]*` is inherently safe because the
   character class can't match the delimiter.
2. **Cross-validation must APPLY mismatch, not just warn** — The old
   markdown-based scripts detected mismatches but continued using wrong values.
   Session #156 fix: replaced with `.claude/state/consolidation.json` as single
   source of truth (no cross-validation needed).
3. **Cognitive complexity reduction via function extraction** — Extract
   `crossValidateLastConsolidated()` and `parseTriggerSection()` to keep
   `getConsolidationStatus()` under 15.
4. **Backup-swap atomic write with try...finally cleanup** — Write to .tmp,
   rename existing to .bak, rename .tmp to target, clean up .bak on success.
   Restore from .bak if rename fails. Always clean up .tmp in finally block.
5. **`replaceAll` over `replace` with `/g` flag** — ES2021 `replaceAll` is
   clearer for global replacements. For literal strings, avoids regex entirely.
6. **Regex operator precedence: `^-|-$` needs `(?:^-|-$)`** — Without grouping,
   `^-|-$` is parsed as `(^-)` OR `(-$)`, not alternation of anchored patterns.
7. **Capture output once in shell hooks** — Instead of running a command twice
   (once suppressed, once to show output), capture with `$(cmd 2>&1)` and check
   `$?`. Halves execution time.

---

#### Review #309: PR #362 R5 — ReDoS Overlapping Quantifiers, Complexity Extraction, Multiline Regex (2026-02-12)

**Source:** SonarCloud (2 S5852 + 3 code smells) + Qodo Suggestions (8)
**PR/Branch:** PR #362 (claude/new-session-uaNwX) **Suggestions:** 13 total
(Fix: 9, Dismiss: 8)

**Key Patterns:**

1. **ReDoS from overlapping quantifiers: `\s*` before `[^|]*`** — Even safe
   character classes become vulnerable when preceded by `\s*` that matches the
   same whitespace. Remove redundant `\s*` when captures are `.trim()`'d anyway.
2. **Cognitive complexity reduction via standalone function extraction** —
   Extract loops and parsing logic into standalone functions (not just class
   methods) to maximize complexity reduction per extraction.
3. **`JSON.stringify()` over manual string escaping in templates** — Eliminates
   nested template literals AND handles all special characters. Safer than
   `.replaceAll('"', ...)`.
4. **Scope regex character classes to single lines with `[^\n...]`** — Generic
   negated classes like `[^|]*` or `[^,)]+` can match across newlines. Add `\n`
   to negation for line-scoped patterns.
5. **Shell `if ! var="$(cmd)"` for `set -e` safety** — Combining assignment and
   test in one statement prevents `set -e` from aborting on non-zero exit before
   the variable is set.

---

#### Review #310: Qodo PR Suggestions — Alerts v3 Health Score, Edge Cases, Path Normalization (2026-02-13)

**Source:** Qodo PR Code Suggestions **PR/Branch:**
claude/read-session-commits-ZpJLX **Suggestions:** 4 total (Critical: 0, Major:
1, Minor: 2, Architectural: 1)

**Patterns Identified:**

1. Health score inflation: Normalizing by available weight instead of total
   weight inflates scores when categories are missing.
   - Root cause: `continue` on missing categories + dynamic `totalWeight`
   - Prevention: Always normalize against fixed total possible weight
2. Initial commit edge case: `git diff HEAD~1 HEAD` fails on first commit.
   - Root cause: No parent commit to diff against
   - Prevention: Fallback to empty tree hash
     (`4b825dc642cb6eb9a060e54bf8d69288fbee4904`)
3. Backslash path separators: Windows-style `\\` in JSONL source_file fields.
   - Root cause: Audit tool outputs Windows paths
   - Prevention: Normalize at ingest time

**Resolution:**

- Fixed: 3 items (health score normalization, git diff fallback, path separators
  in 740 lines across 3 JSONL files)
- Deferred: 1 item (architectural — decompose monolithic run-alerts.js, flagged
  to user)

**Key Learnings:**

- Health score functions should normalize against fixed total weight, not
  dynamic available weight
- Git operations should handle initial-commit edge cases with empty tree hash
- JSONL data files should normalize path separators at ingest time for
  cross-platform consistency

---

#### Review #311: SonarCloud + Qodo — PR #365 Audit Ecosystem Branch (2026-02-14)

**Source:** SonarCloud Issues/Hotspots + Qodo PR Suggestions + Qodo Compliance
**PR/Branch:** claude/read-session-commits-ZpJLX (PR #365) **Suggestions:** 34
total (Critical: 1, Major: 5, Minor: 21, Security Hotspots: 7)

**Patterns Identified:**

1. Global regex lastIndex bug: Using `/g` regex with `.test()` in loops causes
   skipped matches due to persistent `lastIndex` state
   - Root cause: PATTERN_KEYWORDS array uses `/gi` flags
   - Prevention: Always reset `lastIndex = 0` or use `exec()` pattern
2. Windows cross-platform gaps: Path sanitization rejecting colons, backslash
   normalization missing in fast-path hooks
   - Root cause: Unix-first development, untested Windows paths
   - Prevention: Always normalize with `replaceAll("\\", "/")` in hooks
3. Regex complexity accumulation: pathExclude lists grow unbounded as new files
   are added, exceeding SonarCloud's complexity limit of 20
   - Root cause: Using single regex alternation for file exclusion lists
   - Prevention: Use `pathExcludeList` (string array) instead of regex
4. Unbounded `\s*` in markdown parsing regex: SonarCloud flags backtracking risk
   - Root cause: `\s*` matches unlimited whitespace including newlines
   - Prevention: Use bounded `\s{0,10}` or `[ ]*` (space-only) where newlines
     aren't expected

**Resolution:**

- Fixed: 33 items across 13 files
- Rejected: 1 item (streaming for reviews.jsonl — file is always <1KB)
- Deferred: 0

**Key Learnings:**

- `pathExcludeList` is the preferred mechanism for file exclusions (avoids regex
  complexity limits)
- Persist state cleanup (warned-files.json TTL purge was in-memory only)
- `spawnSync("git", ["rev-parse", "--show-toplevel"])` is the reliable way to
  find repo root

---

#### Review #312: CI Regex Complexity + Qodo R2 — PR #365 (2026-02-14)

**Source:** SonarCloud Code Smell + Qodo PR Suggestions **PR/Branch:**
claude/read-session-commits-ZpJLX (PR #365) **Suggestions:** 8 total (Critical:
0, Major: 1 CI-blocking, Minor: 7)

**Patterns Identified:**

1. SonarCloud regex complexity 21 > 20: Milestones Overview lookahead had too
   many alternatives
   - Root cause: `(?=\r?\n\r?\n|\r?\n##|\r?\n---)` — 3 alternatives with shared
     prefix
   - Fix: `(?=\r?\n(?:\r?\n|##|---))` — factor out common `\r?\n`
2. Document Version regex anchoring: Matching version in full content could
   match Version History table entries
   - Root cause: Regex not constrained to header area
   - Prevention: Slice content to header area (first 4000 chars) before matching

**Resolution:**

- Fixed: 8 items across 5 files
- Rejected: 0
- Deferred: 0

**Key Learnings:**

- `spawnSync` without timeout can hang in pre-push hooks — always add
  `timeout: 3000`
- `maxBuffer` on `execFileSync` prevents crash on large diffs — add
  `maxBuffer: 5 * 1024 * 1024`
- `isTrivialChange()` needs file-type awareness: `#` lines in .sh are comments
  (trivial) but headings in .md (non-trivial)

---

#### Review #313: CI Feedback + Qodo R3 — Orphaned DEBT + Bounded Regex (2026-02-14)

**Source:** CI Failures + Qodo PR Suggestions **PR/Branch:**
claude/read-session-commits-ZpJLX (PR #365) **Suggestions:** 11 total (Critical:
0, Major: 3, Minor: 6, Compliance: 2)

**Patterns Identified:**

1. Dedup removing referenced DEBT entries: consolidate-all.js dedup removed 9
   entries still referenced by ROADMAP.md
   - Root cause: Dedup heuristic too aggressive on similar entries
   - Prevention: Cross-check ROADMAP.md references before dedup
2. Prototype pollution in config objects: `FILE_OVERRIDES` from JSON config
   could contain `__proto__` keys
   - Root cause: Direct object spread from parsed config
   - Prevention: Use `Object.create(null)` + skip dangerous keys
3. Emoji-tolerant section matching: Section headers may have emoji prefixes that
   break `##\s+Name` patterns
   - Root cause: Regex assumes `##` directly followed by whitespace+text
   - Prevention: Use `##\s*(?:[^\w\r\n]+\s*)?Name` for emoji tolerance

**Resolution:**

- Fixed: 11 items (restored 9 DEBT entries from git history, 5 code fixes)
- Rejected: 0
- Deferred: 0

**Key Learnings:**

- MEMORY.md critical bug: changes to MASTER_DEBT.jsonl MUST sync to
  raw/deduped.jsonl
- Atomic writes (`write .tmp` + `rename`) prevent corruption on crash
- Context-aware trivial detection: `#` is a comment in .sh/.yml but a heading in
  .md

---

#### Review #314: SonarCloud Regex Hotspots + Qodo Robustness R4 — PR #365 (2026-02-14)

**Source:** SonarCloud Security Hotspots (S5852) + Qodo PR Suggestions + Qodo
Compliance **PR/Branch:** claude/read-session-commits-ZpJLX (PR #365)
**Suggestions:** 13 total (Critical: 0, Major: 5, Minor: 6, Compliance: 2)

**Patterns Identified:**

1. Dead code harboring regex complexity: `checkMilestoneItemCounts` had a
   complex regex for a check disabled since Review #213 — SonarCloud still
   flagged it
   - Root cause: Function kept as stub but regex not removed
   - Prevention: When disabling a check, remove the regex too
2. Incremental line counting bug: `lastIdx` must advance past the full match,
   not just to `match.index`, to avoid double-counting newlines
   - Root cause: Off-by-one in O(n) optimization from Review #255
   - Prevention: Always set `lastIdx = match.index + match[0].length`
3. Regex lookahead factoring: `(?=\r?\n##\s|\r?\n---\s*$|$)` has redundant
   `\r?\n` prefix in each alternative — factor to `(?=\r?\n(?:##\s|---\s*$)|$)`
   - Root cause: Alternatives added incrementally without refactoring
   - Prevention: Factor common prefixes in regex alternations
4. Non-global regex guard: `exec()` loops require `/g` flag — missing flag
   causes infinite loop
   - Root cause: Pattern definitions could theoretically omit `/g`
   - Prevention: Defensive `flags.includes("g")` check before exec loop

**Resolution:**

- Fixed: 13 items across 6 files
- Rejected: 0
- Deferred: 0

**Key Learnings:**

- Remove regex from disabled checks — dead code still triggers SonarCloud
- `\s*` → `\s+` is a simple backtracking reduction when at least one space is
  always present
- File size guards before `readFileSync` prevent local DoS on state files
- Repo-relative paths (`path.relative(cwd, abs)`) are more reliable than raw
  string normalization for git diff

---

#### Review #315: SonarCloud + Qodo R5 — Residual Regex, Stack Traces, Windows Compat (2026-02-14)

**Source:** SonarCloud Security Hotspots (S5852) + Qodo PR Suggestions + Qodo
Compliance **PR/Branch:** claude/read-session-commits-ZpJLX (PR #365)
**Suggestions:** 13 total (Critical: 0, Major: 4, Minor: 7, Trivial: 2)

**Patterns Identified:**

1. Stack trace leakage via rethrown errors: Sanitizing the message but then
   `throw err` still exposes full stack to user
   - Root cause: Incomplete sanitization — caught + logged but then rethrown
   - Prevention: Use `process.exit(1)` instead of `throw` when error is fatal
2. Complex regex where string parsing suffices: Version History section
   extraction used regex with `[\s\S]{0,20000}?` when line-by-line scan works
   - Root cause: Regex was the initial tool; never reconsidered as complexity
     grew
   - Prevention: For section extraction, prefer split-and-scan over regex
3. Windows `renameSync` fails when destination exists: Unlike POSIX, Windows
   `rename()` does not atomically overwrite — must remove target first
   - Root cause: Pattern added in Review #255 without Windows testing
   - Prevention: Always `unlinkSync(dest)` before `renameSync(src, dest)`
4. File-size budgets for regex scanning: Inline pattern checker had no upper
   bound on input size, allowing ReDoS on crafted large files
   - Root cause: Only lower bound (8KB skip) was added, not upper bound
   - Prevention: Add both floor AND ceiling guards on file-size-gated operations

**Resolution:**

- Fixed: 13 items across 8 files
- Deferred: 0
- Rejected: 0

**Key Learnings:**

- `path.basename()` for log output prevents leaking user home directory paths
- `git rev-parse --show-toplevel` is more reliable than `process.cwd()` for repo
  root
- Block comment interior lines (`* ...`) should be treated as trivial in diff
  analysis
- Memoizing `isTrivialChange` with a Map avoids redundant git diff calls per
  file

---

#### Review #316: PR #366 R1 — SonarCloud Regex + Qodo Robustness + CI Blockers (2026-02-14)

**Source:** SonarCloud Security Hotspots (S5852) + Qodo PR Suggestions + Qodo
Compliance + CI Failures **PR/Branch:** claude/read-session-commits-ZpJLX (PR
#366) **Suggestions:** 21 total (Critical: 0, Major: 4, Minor: 11, Deferred: 6)

**Patterns Identified:**

1. SonarCloud S5852 two-strikes rule: Both flagged regexes replaced with
   string-based parsing (check-pattern-compliance.js `testFn`, track-session.js
   line-by-line scan)
   - New: `testFn` alternative to `pattern` field in pattern compliance checker
2. Atomic file writes: 3 hooks (alerts-reminder, check-remote-session-context,
   cooldown files) now use tmp+rmSync+rename pattern (Review #289 standard)
3. Unbounded state growth: 2 state files now have pruning (directive-dedup.json
   24h TTL, suggestedAgents 30-day expiry)
4. CI broken links: ~30 links in AUDIT_TRACKER.md pointed to non-existent audit
   reports. Replaced link markup with plain text + annotation.
5. MASTER_DEBT.jsonl sync: 5 entries lost due to generate-views.js overwrite bug
   (MEMORY.md documents this). Restored from deduped.jsonl.

**Resolutions:**

- [1] check-pattern-compliance.js: Added `testFn` support + replaced regex
- [2] track-session.js: Line-by-line string parsing for sprint name
- [9] analyze-user-request.js: 24h TTL pruning for directive dedup state
- [10] post-read-handler.js: Skip save when context state unchanged
- [12] log-override.js: process.exit(0) after quick mode
- [13] run-alerts.js: Rating key `no_reason` → `no_reason_pct`
- [14] commit-tracker.js: Branch regex simplified
- [15] pre-compaction-save.js: NUL-separated git status (-z flag)
- [16] alerts-reminder.js: Atomic cooldown write
- [17] rotate-state.js: Math.max(1) prevents truncation to 0
- [18] check-remote-session-context.js: Atomic cache write + init order fix
- [19] post-write-validator.js: 30-day agent suggestion pruning
- [20] AUDIT_TRACKER.md: ~30 broken doc links fixed (agent)
- [21] ROADMAP.md + MASTER_DEBT.jsonl: Orphaned DEBT refs + missing entries
  (agent)

**Deferred (6 items):**

- [3-7] Qodo compliance (symlink audit trails, integration tests, audit logging)
  → DEBT-2951 through DEBT-2955
- [8] HookRunner framework proposal → DEBT-2956

---

#### Review #317: PR #366 R2 — SonarCloud Two-Strikes + Qodo Robustness (2026-02-15)

**Source:** SonarCloud Security Hotspots (S5852) + Qodo PR Suggestions + Qodo
Compliance **PR/Branch:** claude/read-session-commits-ZpJLX (PR #366)
**Suggestions:** 14 total (Critical: 0, Major: 3, Minor: 8, Deferred: 3)

**Key Patterns:**

1. **SonarCloud S5852 two-strikes rule applied**: track-session.js flagged again
   for remaining regexes in the R1 string-parsing replacement code. Replaced
   both `/^(?:Active Sprint|Current Sprint)[:\s-]*/i` and
   `/M1[.\d]*\s*[-–]\s*(.+)/` with pure string parsing (indexOf, startsWith,
   character scanning).
2. **Git status --porcelain -z rename/copy parse bug**: pre-compaction-save.js
   `for...of` loop failed to consume the second NUL-separated path field for R/C
   entries. Fixed with indexed loop + `i++` skip.
3. **Defensive state shape normalization**: post-write-validator.js agent
   trigger state could crash if JSON was corrupted (non-object, missing
   suggestedAgents).
4. **Atomic write consistency**: user-prompt-handler.js cooldown was non-atomic
   — aligned with the write-tmp-rm-rename pattern used elsewhere.
5. **Number.isFinite guard for timestamp purging**: analyze-user-request.js
   directive dedup would never purge entries with corrupted non-numeric
   timestamps.

**Fixed (11):** Two-strikes regex→string (2), rename/copy parse (1), sprint type
guard (1), atomic write (1), state normalization (1), logOverride fail-fast (1),
cache null guard + mkdirSync (1), Number.isFinite guard (1), Array.isArray
testFn guard (1), mkdirSync cooldown dir (1)

**Deferred (3):** DEBT-2957 (project dir escape — architectural), DEBT-2958
(audit trails — generic compliance), DEBT-2959 (secure logging — generic
compliance)

---

#### Review #318: PR #366 R3 — Atomic Write Hardening + State Normalization (2026-02-15)

**Source:** Qodo PR Compliance + Code Suggestions **PR/Branch:**
claude/read-session-commits-ZpJLX (PR #366) **Suggestions:** 15 total (Critical:
0, Major: 0, Minor: 10, Deferred: 4, Rejected: 1)

**Key Patterns:**

1. **Backup-swap atomic writes**: post-read-handler.js saveJson upgraded from
   rm+rename to backup-swap pattern (write tmp → rename original to .bak →
   rename tmp to original → rm .bak) with rollback on failure.
2. **mkdirSync before atomic write**: user-prompt-handler.js cooldown and
   directive state writes now create parent directory first — prevents failure
   on first run in clean environment.
3. **State shape normalization**: Three files now validate JSON state shape
   after parse — post-write-validator.js (numeric uses/phase),
   post-read-handler.js (contextState fields), analyze-user-request.js (data
   object check).
4. **Git porcelain record validation**: pre-compaction-save.js now validates
   line length and format before parsing XY fields, preventing crashes on
   malformed git output.
5. **Number.isFinite guards**: alerts-reminder.js cooldown timestamp and
   post-write-validator.js state.uses/phase now validate numeric types before
   arithmetic.

**Fixed (10):** mkdirSync cooldown dir (1), atomic directive writes (1), numeric
state normalization (1), data shape validation + atomic writes (2), porcelain
validation (1), backup-swap atomic write (1), contextState normalization (1),
Number.isFinite cooldown (1), Number.isFinite uses/phase (1)

**Deferred (4):** DEBT-2960 (symlink overwrite in rotate-state.js —
architectural), DEBT-2958 (audit trails — already tracked R2), DEBT-2959 (secure
logging — already tracked R2), context export sensitivity (acceptable risk —
sanitizeContextData already strips fields)

**Rejected (1):** Chunk-based line counting for large-context-warning.js — byte
estimation is sufficient for the warning threshold (overcount is acceptable)

---

#### Review #319: PR #366 R4 — Symlink Guard + Future Timestamp + Skip-Abuse Bug (2026-02-15)

**Source:** Qodo PR Compliance + Code Suggestions **PR/Branch:**
claude/read-session-commits-ZpJLX (PR #366) **Suggestions:** 9 total (Critical:
0, Major: 1, Minor: 5, Already-tracked: 3)

**Key Patterns:**

1. **Symlink write guard in saveJson**: post-read-handler.js now checks
   `lstatSync().isSymbolicLink()` before writing — prevents symlink-based file
   redirect attacks on state files.
2. **Future timestamp defense**: alerts-reminder.js cooldown now checks
   `ageMs >= 0` — a future timestamp from clock skew would no longer permanently
   disable the hook.
3. **Skip-abuse alert 24h/7d data mismatch bug**: run-alerts.js "By type"
   breakdown was using 7d data in a 24h alert message. Split into byType24h and
   byType7d for accurate reporting.
4. **CRLF JSONL parsing on Windows**: post-write-validator.js JSONL parser now
   trims each line before JSON.parse to handle `\r\n` endings.
5. **Consistent caps on file lists**: pre-compaction-save.js staged/uncommitted
   arrays now capped at 50 (matching existing untracked cap of 20).

**Fixed (6):** Symlink guard (1), future timestamp (1), skip-abuse bug (1), CRLF
trim (1), file list caps (1), Number.isFinite cooldown (1)

**Already tracked (3):** DEBT-2957 (env path trust), DEBT-2958 (audit trails),
DEBT-2959 (secure logging)

---

#### Review #320: PR #366 R5 — Parent Dir Symlink + Clock Skew + Prototype Pollution (2026-02-15)

**Source:** Qodo PR Compliance + Code Suggestions **PR/Branch:**
claude/read-session-commits-ZpJLX (PR #366) **Suggestions:** 9 total (Critical:
0, Major: 0, Minor: 8, Already-tracked: 1)

**Batch rule applied:** Same files appearing 3+ consecutive rounds — holistic
fix approach.

**Patterns Identified:**

1. **Parent directory symlink attack** — Checking file symlinks is insufficient;
   parent directory can also be a symlink redirecting writes. Added
   `path.dirname()` + `lstatSync()` check to saveJson in post-read-handler.js.
2. **Clock skew defense** — Future timestamps (`ageMs < 0`) should trigger
   cooldown, not bypass it. Applied to alerts-reminder.js (nested if with
   `ageMs < 0 || ageMs < COOLDOWN_MS`).
3. **Prototype pollution via counter objects** — `{}` as counter with external
   keys allows `__proto__` injection. Use `Object.create(null)` + `String(key)`.
   Applied to run-alerts.js skip-abuse counters.
4. **Symlink check on reads** — getContent() in post-write-validator.js reads
   files without symlink check, allowing arbitrary file content injection.
5. **Size-based rotation guard** — Entry-count rotation on every append is
   wasteful; gate behind `fs.statSync()` size threshold (64KB).

**Resolution:** 8 fixed, 1 already-tracked (DEBT-2957/2958/2959)

| #   | Issue                          | Severity | Action          | Origin              |
| --- | ------------------------------ | -------- | --------------- | ------------------- |
| 1   | Parent dir symlink in saveJson | Minor    | Fixed           | This-PR             |
| 2   | Cooldown symlink check         | Minor    | Fixed           | This-PR             |
| 3   | Object.create(null) counters   | Minor    | Fixed           | This-PR             |
| 4   | Clock skew cooldown            | Minor    | Fixed           | This-PR             |
| 5   | getContent symlink check       | Minor    | Fixed           | This-PR             |
| 6   | statePath/reviewQueue symlink  | Minor    | Fixed           | This-PR             |
| 7   | Fetch cache Number.isFinite    | Minor    | Fixed           | This-PR             |
| 8   | Size-based rotation threshold  | Minor    | Fixed           | This-PR             |
| 9   | Compliance: symlink writes     | —        | Already-tracked | DEBT-2957/2958/2959 |

---

#### Review #321: PR #366 R6 — Shared Symlink Guard + Self-Healing Cooldown + Bug Fixes (2026-02-15)

**Source:** Qodo PR Compliance + Code Suggestions **PR/Branch:**
claude/read-session-commits-ZpJLX (PR #366) **Suggestions:** 14 total (Critical:
0, Major: 2, Minor: 9, Trivial: 1, Rejected: 2)

**Architectural fix:** Created shared `.claude/hooks/lib/symlink-guard.js` with
`isSafeToWrite()` that checks file + all ancestor directories. Applied to all
hook write paths to stop symlink ping-pong across review rounds.

**Patterns Identified:**

1. **Shared symlink helper** — Each round found more write paths missing symlink
   guards. Root cause fix: centralized `isSafeToWrite()` with ancestor
   traversal.
2. **Self-healing future timestamps** — `ageMs < 0` deletes corrupt cooldown
   instead of permanently blocking the hook.
3. **TOCTOU race** — `existsSync` + `lstatSync` wrapped in try/catch,
   fail-closed.
4. **Milestone string bug** — Off-by-one slice replaced with template literal.
5. **Hook output protocol** — Must print "ok" even when suppressing directives.

**Resolution:** 11 fixed, 2 rejected

| #   | Issue                            | Severity | Action                | Origin       |
| --- | -------------------------------- | -------- | --------------------- | ------------ |
| 2   | recordDirective symlink guard    | Minor    | Fixed (shared helper) | This-PR      |
| 3   | saveJson ancestor traversal      | Minor    | Fixed (shared helper) | This-PR      |
| 4   | Self-healing future timestamp    | Major    | Fixed                 | This-PR      |
| 5   | statePath TOCTOU try/catch       | Minor    | Fixed                 | This-PR      |
| 6   | Milestone string bug             | Major    | Fixed                 | Pre-existing |
| 7   | Directive "ok" output            | Minor    | Fixed                 | This-PR      |
| 8   | updateFetchCache symlink guard   | Minor    | Fixed (shared helper) | This-PR      |
| 9   | Cooldown write symlink (alerts)  | Minor    | Fixed (shared helper) | This-PR      |
| 10  | lstatSync for file size          | Minor    | Fixed                 | This-PR      |
| 11  | Cooldown write symlink (handler) | Minor    | Fixed (shared helper) | This-PR      |
| 12  | reviewQueue TOCTOU try/catch     | Minor    | Fixed                 | This-PR      |
| 13  | NUL delimiter for git log        | Trivial  | Fixed                 | Pre-existing |

**Rejected:** [1] Bidirectional containment removal — breaks cwd-inside-project
setups. [14] saveJson error leaking — dev-only CLI output, aids debugging.

---

#### Review #322: PR #366 R7 — Comprehensive Symlink Guard Hardening (2026-02-15)

**Source:** Qodo PR Compliance + Code Suggestions **PR/Branch:**
claude/read-session-commits-ZpJLX (PR #366) **Suggestions:** 12 total (Fixed: 9,
Rejected: 3 compliance)

**Key pattern:** Every atomic write needs `isSafeToWrite()` on BOTH the target
file AND the `.tmp` file. R6 created the shared helper but missed tmp paths.

**Fixes applied:**

- `symlink-guard.js`: Added `path.isAbsolute()` check — reject relative paths
- `post-write-validator.js`: Replaced 2 inline TOCTOU checks with shared
  `isSafeToWrite` import
- `analyze-user-request.js`: Added `isSafeToWrite` import + guard on directive
  write (standalone file missed in R6)
- `rotate-state.js`: Added `isSafeToWrite` guards on all 4 atomic write paths
- `log-override.js`: Added symlink guard + `lstatSync` instead of `statSync`
- `check-remote-session-context.js`, `post-read-handler.js`,
  `user-prompt-handler.js`: Added `isSafeToWrite(tmpPath)` guards
- `commit-tracker.js`: Restored `author`/`authorDate` fields in git log format

**Rejected:** 3 compliance items (silent catch blocks are intentional fail-safe,
sanitizeFilesystemError already sanitizes, log snippets are code not PII)

**Lesson:** When introducing a shared security helper, audit ALL write paths in
one pass — including tmp files, backup files, and standalone copies of
consolidated functions.

---

#### Review #324: PR #367 R1 — Alerts Overhaul Security + Code Quality (2026-02-16)

**Source:** SonarCloud (24) + Qodo PR Compliance (6) + Qodo Code Suggestions
(14) **PR/Branch:** claude/read-session-commits-ZpJLX (PR #367) **Suggestions:**
49 total (Fixed: 36, Deferred: 7, Rejected: 7)

**Patterns Identified:**

1. `runCommandSafe` options spread allows `shell: true` injection — hardened
   with explicit allowlist
2. `parseInt` → `Number.parseInt` consistency (6 instances across 3 files)
3. `.replace(/x/g, y)` → `.replaceAll("x", y)` modernization (10 instances)
4. Empty regex `new RegExp("")` matches everything — must guard in suppression
   filter
5. Symlink write guards missing in 2 new utility scripts (propagation check
   caught)

**Key Learnings:**

- Parallel 3-agent review processing (security / code quality / hooks+docs)
- First use of propagation check on new scripts added in same PR
- SonarCloud cognitive complexity deferrals (6 items, all pre-existing CC 16-64)

**Resolution Stats:** 36 fixed, 7 deferred (cognitive complexity), 7 rejected
(false positives/design choices). 3 parallel agents, 10 files modified.

---

#### Review #325: PR #367 R2 — Trend Bug, Suppression Logic, Security Hardening (2026-02-16)

**Source:** CI (Prettier) + SonarCloud (15) + Qodo PR Compliance (5) + Qodo Code
Suggestions (20) **PR/Branch:** claude/read-session-commits-ZpJLX (PR #367)
**Suggestions:** 40 total (Fixed: 21, Deferred: 6, Rejected: 5)

**Patterns Identified:**

1. **R1 agent incomplete fixes** — 3 parallel agents in R1 missed several items
   (trend bug, suppressions, runCommandSafe). Verification pass didn't catch
   them.
2. **EXIT trap overwrite** — Shell scripts using multiple mktemp calls each set
   their own trap, overwriting previous cleanup.
3. **Category-wide suppression blocked** — Empty messagePattern returned false
   instead of true, preventing category-level suppression.

**Key Learnings:**

- Parallel agent results need explicit verification against the original item
  list
- Shell EXIT trap chaining requires capturing previous trap with `trap -p EXIT`
- SonarCloud cognitive complexity items are consistently pre-existing (CC 16-64)

**Resolution Stats:** 21 fixed (7 major, 12 minor, 2 trivial), 6 deferred
(cognitive complexity, pre-existing), 5 rejected (false positives/design). 3
parallel agents, 12 files modified.

---

#### Review #326: PR #367 R3 — Weight Normalization, CC Reduction, Symlink Guards (2026-02-16)

**Source:** SonarCloud (11) + Qodo PR Compliance (2) + Qodo Code Suggestions (8)
**PR/Branch:** claude/read-session-commits-ZpJLX (PR #367) **Suggestions:** 21
total (Fixed: 8, Already Deferred: 6, Already Rejected: 3, New Rejected: 4)

**Patterns Identified:**

1. **Tool conflict resolution** — SonarCloud wants `Math.max()` but pattern
   compliance blocks it; resolved by classifying as REJECT with documented
   reason
2. **CC reduction via extraction** — Moving symlink checks outside try blocks or
   into helper functions reduces nesting-based cognitive complexity
3. **Type-safe defensive coding** — `typeof x === "string"` before `.trim()`,
   `Array.isArray()` before `.reduce()` prevents crashes from malformed JSON
   data

**Key Learnings:**

- When tools conflict (SonarCloud vs pattern compliance), document the conflict
  and reject the item with a clear rationale rather than flip-flopping
- Health score weight normalization is already handled by `measuredWeight`
  division, but keeping raw weights summing to 1.0 prevents confusion
- Deduplicating extracted learnings with a Set prevents data quality issues in
  JSONL consumption files

---

#### Review #327: PR #367 R4 — Fail Closed, Log Injection, Trap Chaining, Input Normalization (2026-02-16)

**Source:** SonarCloud (9) + Qodo PR Compliance (5) + Qodo Code Suggestions (10)
**PR/Branch:** claude/read-session-commits-ZpJLX (PR #367) **Suggestions:** 24
total (Fixed: 13, Already Deferred: 6, Already Fixed: 1, Rejected: 4)

**Patterns Identified:**

1. **Fail-closed security** — `isSafeToWrite = () => true` fallback changed to
   `() => false` across all 5 files
2. **Log injection prevention** — SKIP_REASON newline guard added to pre-commit
   and pre-push hooks
3. **Shell trap chaining** — Second `trap ... EXIT` overwrites first; use
   `trap -p EXIT` to capture and chain

**Key Learnings:**

- Fail-open fallbacks for security modules are a recurring anti-pattern
- Shell EXIT traps must be chained, not overwritten
- `handoff.json` field types vary; normalize with `toCount()` helper
- Running validate-audit.js twice is wasteful; capture output once

---

#### Review #328: PR #367 R5 — Suppression Validation, POSIX Portability, Newline Propagation (2026-02-16)

**Source:** SonarCloud (8) + Qodo PR Compliance (5) + Qodo Code Suggestions (9)
**PR/Branch:** claude/read-session-commits-ZpJLX (PR #367) **Suggestions:** 22
total (Fixed: 9, Already Deferred: 6, Already Rejected: 2, Rejected: 5)

**Patterns Identified:**

1. **Suppression type guard** — filterSuppressedAlerts crashed on non-object
   entries in suppressions JSON; added defensive filter
2. **POSIX portability** — `grep -P` not available on all systems; replaced with
   `wc -l` + `grep -q $'\r'` for newline detection
3. **Propagation miss** — R4 added newline guards to shell hooks but missed JS
   scripts (check-triggers.js, check-cross-doc-deps.js, check-doc-headers.js)
4. **ENOENT preservation** — string error codes from execFileSync lost in catch;
   now appended to stderr for debugging

**Key Learnings:**

- Propagation checks must cover BOTH shell hooks AND JS scripts that handle the
  same env vars
- `grep -P` (Perl regex) is a GNU extension, not POSIX — use `wc -l` for newline
  counting
- `typeof error.code === "string"` captures ENOENT/EACCES while numeric check
  captures exit codes
- Suppression files are external input — always validate entry types before
  property access

---

#### Review #329: PR #367 R6 — Control Chars, suppressAll, POSIX CR Fix, Severity Normalization (2026-02-16)

**Source:** SonarCloud (8) + Qodo Compliance (3) + Qodo Suggestions (5)
**PR/Branch:** claude/read-session-commits-ZpJLX (PR #367) **Suggestions:** 16
total (Fixed: 5, Already Deferred: 6, Already Rejected: 2, Rejected: 3)

**Patterns Identified:**

1. **Control char + length validation** — SKIP_REASON can contain control chars
   beyond CR/LF; added `[\u0000-\u001f\u007f]` check and 500-char max
2. **suppressAll explicit flag** — Empty messagePattern was suppressing entire
   categories; now requires `suppressAll: true` for category-wide suppression
3. **POSIX CR detection** — `$'\r'` is bash-specific; use `printf '\r'` variable
4. **Severity normalization** — Unexpected severity values in warnings caused
   NaN counts; clamp to known values

**Key Learnings:**

- Control character validation catches more injection vectors than just CR/LF
- Category-wide suppression is a dangerous footgun — require explicit opt-in
- Shell portability: `$'...'` ANSI-C quoting is bash-only, not POSIX sh
- Propagation of validation patterns across all 3 JS scripts + 2 shell hooks

---

#### Review #330: PR #367 R7 — codePointAt, suppressAll Category Guard, Code Fence Parsing, EXIT Trap (2026-02-16)

**Source:** SonarCloud (11) + Qodo Compliance (2) + Qodo Suggestions (8)
**PR/Branch:** claude/read-session-commits-ZpJLX (PR #367) **Suggestions:** 21
total (Fixed: 8, Already Deferred: 6, Already Rejected: 2, Rejected: 5)

**Patterns Identified:**

1. **codePointAt vs charCodeAt** — `charCodeAt` doesn't handle multi-byte
   Unicode correctly; `codePointAt` is the safer default for character code
   comparisons
2. **suppressAll requires category** — suppressAll without a category would
   suppress ALL alerts across ALL categories; now requires valid category string
3. **Code fence awareness** — Markdown parser incorrectly matched review headers
   inside fenced code blocks; skip lines when `inFence` is true
4. **POSIX EXIT trap chaining** — Manual `trap -p EXIT | sed` is brittle and
   non-portable; `add_exit_trap` helper safely chains cleanup commands
5. **Shell control char validation** — Propagated from JS scripts to shell hooks
   using POSIX `LC_ALL=C grep -q '[[:cntrl:]]'`

**Key Learnings:**

- `codePointAt` handles surrogate pairs and astral Unicode correctly
- Category-wide suppression needs both `suppressAll: true` AND a valid category
- Markdown parsing must account for code fences to avoid false header matches
- Shell trap chaining via sed is fragile; a helper function is more maintainable
- Always propagate validation patterns from JS to shell hooks and vice versa

---

#### Review #331: PR #368 R3 — Symlink Hardening, shell:true Elimination, Ternary Extract (2026-02-16)

**Source:** SonarCloud (1) + Qodo Compliance (5) + Qodo Suggestions (7)
**PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR #368)
**Suggestions:** 13 total (Fixed: 12, Duplicate: 1)

**Patterns Identified:**

1. **Symlink guard must check file AND directory** — realpathSync on logDir
   alone doesn't prevent the file itself being a symlink; use lstatSync on the
   file too
2. **shell:true → .cmd suffix on Windows** — Instead of `shell: true` for
   npm/npx/gh on Windows, directly invoke `bin.cmd` to eliminate shell injection
   surface entirely
3. **Nested ternaries are SonarCloud code smells** — Extract to if/else
   statements for maintainability
4. **Capture error in catch blocks** — Bare `catch {}` hinders debugging; at
   minimum log to stderr
5. **Truncate user-supplied audit fields** — Cap `reason` at 200 chars to
   prevent accidental secret persistence
6. **spawnSync needs status/error checks** — Check `res.error` and `res.status`
   before trusting stdout; set explicit stdio to prevent interactive hangs

**Key Learnings:**

- Round 2 found the symlink guard from R1 was incomplete (checked dir but not
  file). Pattern: security reviews iterate until every attack vector is
  addressed.
- The shell:true issue persisted across 4 compliance rounds because the fix was
  always "add a comment explaining it's safe" instead of eliminating the risk.
  Qodo's imp:9 suggestion to use `.cmd` suffix was the correct resolution.
- Non-canonical categories in TDMS examples (`cross-domain`) would break
  downstream automation. Template examples must use real enum values.

---

#### Review #332: PR #368 R4 — DoS Length Check, Fingerprint Stability, File Perms (2026-02-16)

**Source:** SonarCloud (2) + Qodo Compliance (5) + Qodo Suggestions (5)
**PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR #368)
**Suggestions:** 12 total (Fixed: 8, Rejected: 4)

**Patterns Identified:**

1. **Length check before expensive iteration** — validate-skip-reason iterated
   all chars via `[...reason].some()` before checking length, enabling DoS.
   Always check length first for bounded-input functions.
2. **Deterministic fingerprint generation** — Sorting findings before generating
   the cross-domain ID ensures stable deduplication across runs. Without
   sorting, non-deterministic input order produces different IDs for the same
   findings.
3. **Restrictive file permissions on audit logs** — New files created via
   `appendFileSync` inherit umask (often 0o644). Explicitly creating with 0o600
   prevents info leaks on shared systems.
4. **Schema alignment: fingerprint vs id** — TDMS schema uses `fingerprint` as
   canonical key; using `id` for the same purpose creates pipeline mismatches.

**Key Learnings:**

- Qodo compliance continues to flag SKIP_REASON persistence as a risk across
  multiple rounds ([3], [6], [7]). This is by-design: audit logs MUST contain
  the reason to be useful. The `.claude/` directory is gitignored. Truncation
  (200 chars) is sufficient mitigation. Rejecting these consistently prevents
  ping-pong.
- The symlink guard ancestor-directory claim is incorrect — `realpathSync`
  already resolves all symlinks in the entire path chain. Validating each claim
  before accepting saves unnecessary code churn.

---

#### Review #333: PR #368 R5 — TOCTOU fd-Write, Argument Injection, Symlink Directory Guard (2026-02-16)

**Source:** Qodo Compliance (3) + Qodo Suggestions (9) + SonarCloud (1)
**PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR #368)
**Suggestions:** 12 total (Fixed: 8, Rejected: 4)

**Patterns Identified:**

1. **TOCTOU in file creation + write** — Separate `existsSync` +
   `openSync("wx")`
   - `appendFileSync` has a race window. Using a single `openSync("a", 0o600)` +
     `fchmodSync` + `writeFileSync(fd)` + `closeSync(fd)` eliminates the race
     entirely.
2. **Argument injection via concatenated flags** — `--reason=${reason}` lets a
   reason starting with `-` be parsed as a flag. Passing `"--reason", reason` as
   separate args prevents this.
3. **Symlink directory pre-check** — Check `lstatSync(dir).isSymbolicLink()`
   BEFORE `mkdirSync({ recursive: true })` to prevent `mkdirSync` from creating
   directories through a symlinked path.
4. **Don't propagate invalid input** — When validation rejects oversized input,
   return empty string instead of echoing the full oversized value back.

**Key Learnings:**

- SonarCloud Security Hotspot matched the TOCTOU race already identified by Qodo
  suggestion [1]. Cross-referencing tools prevents duplicate work.
- Qodo compliance continues to flag SKIP_REASON stdout logging (R3, R4, R5) —
  consistently rejecting as by-design prevents ping-pong.
- The `e?.cause?.code` pattern for Node.js error chain traversal improves
  robustness when ENOENT wrapping varies across Node versions.

---

#### Review #334: PR #368 R6 — fstatSync fd Validation, Empty-Reason-on-Failure, EXIT Trap Robustness (2026-02-16)

**Source:** Qodo Compliance (3) + Qodo Suggestions (7) + SonarCloud (2 Hotspots)
**PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR #368)
**Suggestions:** 10 total (Fixed: 8, Rejected: 3 — 1 overlap with fix)

**Patterns Identified:**

1. **fstatSync after fd open** — After `openSync`, verify via
   `fstatSync(fd).isFile()` that the descriptor points to a regular file. This
   closes the remaining TOCTOU window between pre-open lstatSync checks and the
   actual write. Also use `writeSync(fd, ...)` instead of
   `writeFileSync(fd, ...)` for consistency.
2. **Never return unsafe values on validation failure** — All failure paths in
   validators should return sanitized (empty) values, not echo back the invalid
   input. Callers may log the returned `reason` field without re-checking
   `valid`.
3. **Shell trap chaining via variable accumulation** — Parsing `trap -p EXIT`
   output with `sed` is fragile across shells. Using a shell variable
   (`EXIT_TRAP_CHAIN`) to accumulate commands is simpler and more portable.
4. **Propagation: template changes must update live code** — When a template
   (FIX_TEMPLATES.md) is updated, the live implementation (.husky/pre-commit)
   must be updated in the same commit to stay in sync.

**Key Learnings:**

- SonarCloud 2 Security Hotspots were the same TOCTOU/symlink pattern from R5.
  The fstatSync fix closes the remaining gap after fd-based write was introduced
  in R5. Cross-referencing tools continues to prevent duplicate work.
- Qodo compliance continues to flag SKIP_REASON persistence (R3-R6) — by-design,
  consistently rejecting.
- Pseudocode in SKILL.md needs the same rigor as production code — `groupBy`
  returns an object, `Object.values()` is needed to iterate correctly.

---

#### Review #336: PR #369 R2 — CC Reduction, Push Batching, Symlink Guards, Line Normalization (2026-02-17)

**Source:** SonarCloud (18 Issues + 3 Hotspots) + Qodo Compliance (5) + Qodo
Suggestions (14) **PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR
#369) **Suggestions:** 38 total (Fixed: 24, Rejected: 14)

**Patterns Identified:**

1. **CC extraction helpers** — SonarCloud CC 20>15 flags resolved by extracting
   `findThresholdTableStart()`/`extractTableRows()` (count-commits-since),
   `collectSingleSessionAudits()`/`collectComprehensiveAudits()`/`collectMultiAiAudits()`
   (generate-results-index), `exitWithError()`/`validateAllTemplates()`
   (validate-templates).
2. **Array#push batching** — SonarCloud flags consecutive `.push()` calls. Fix:
   batch into single `.push(a, b, c)`. Applied across 4 files (compare-audits,
   post-audit, validate-templates).
3. **normalizeRepoRelPath** — File paths with `:lineNumber` suffix (e.g.
   `file.js:123`) cause false "file deleted" classifications. Strip with
   `.replace(/:(\d+)$/, "")` before fs/git operations.
4. **Table column alignment** — Markdown table parsing with
   `.filter(c => c.length > 0)` silently drops empty cells, shifting column
   indices. Use `.slice(1, -1)` instead.
5. **Number.isFinite for line 0** — Truthy check `if (finding.line)` skips
   line 0. Use `Number.isFinite()` for line number checks.

**Key Rejections (14):**

- S5852 regex DoS (3): Linear regex `(\d+)\s+commits` has no backtracking risk
- S4036 PATH lookup (2): Dev CLI tools, not production server code
- TOCTOU race: Acceptable for local dev tooling
- JSONL data quality (6): Pre-existing entries outside PR diff scope
- state-manager.js CLI parsing: Pre-existing, not touched by this PR

**Resolution Stats:** 24/38 fixed (63%), 14/38 rejected with justification

---

#### Review #337: PR #369 R3 — Repo Containment, Canonical Categories, Date Validation, Write Guard (2026-02-17)

**Source:** SonarCloud (1 Hotspot + 2 Issues) + Qodo Compliance (3) + Qodo
Suggestions (7) **PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR #369)
**Suggestions:** 12 total (Fixed: 7, Rejected: 5)

**Patterns Identified:**

1. **Repo containment for CLI input** — `post-audit.js` accepted arbitrary paths
   via `path.resolve()`. Added `startsWith(REPO_ROOT + path.sep)` check.
2. **Dir-to-canonical category mapping** — `generate-results-index.js` used raw
   directory names (e.g. `code`) instead of canonical categories
   (`code-quality`). Added `DIR_TO_CANONICAL` lookup map.
3. **sinceDate validation** — `track-resolutions.js` passed unsanitized date
   strings to `git log --since=`. Added `/^\d{4}-\d{2}-\d{2}$/` format check.
4. **writeFileSync try/catch** — `generate-results-index.js` documented exit
   code 2 for write errors but didn't catch them. Added try/catch wrapper.
5. **String line normalization in getFileRef** — Consistent with findingKey fix
   from R2, applied same `typeof === "string" ? parseInt()` pattern.

**Resolution Stats:** 7/12 fixed (58%), 5/12 rejected (S5852 repeat, audit trail
architectural, 3x JSONL data quality pre-existing)

---

#### Review #338: PR #369 R4 — realpathSync Hardening, Atomic Write, Fail-Fast JSONL (2026-02-17)

**Source:** SonarCloud (1 Hotspot) + Qodo Suggestions (11) **PR/Branch:**
claude/cherry-pick-recent-commits-X1eKD (PR #369) **Suggestions:** 12 total
(Fixed: 6, Rejected: 6)

**Patterns Identified:**

1. **realpathSync + lstatSync for path containment** — Simple `startsWith` check
   can be bypassed via symlinks. Use `realpathSync` to resolve canonical paths,
   then `lstatSync` to reject symlinked inputs, then `path.relative` check.
2. **Atomic write pattern** — `writeFileSync` directly to target has TOCTOU
   window. Write to `.tmp-${process.pid}` then `renameSync` to target. Clean up
   tmp on error.
3. **Fail fast on invalid JSONL** — Best-effort processing of malformed input
   can cascade errors through pipeline. Exit immediately with clear error.
4. **Early return on invalid date** — If `sinceDate` is provided but malformed,
   return -1 immediately instead of running `git log` without `--since=` (which
   returns full history and causes misclassification).

**Resolution Stats:** 6/12 fixed (50%), 6/12 rejected (S5852 repeat x3, 5x JSONL
data quality pre-existing)

---

#### Review #339: PR #369 R5 — CC Extraction, tmpFile Symlink, ISO Date Normalization (2026-02-17)

**Source:** SonarCloud (1 CC Issue) + Qodo Security (1) + Qodo Compliance (1) +
Qodo Suggestions (9) **PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR
\#369) **Suggestions:** 12 total (Fixed: 7, Rejected: 5)

**Patterns Identified:**

1. **Extract validateInputPath() for CC reduction** — SonarCloud CC 20>15 on
   main(). Extracted path resolution, symlink check, and containment validation
   into a dedicated helper.
2. **tmpFile symlink guard** — Atomic write pattern writes to tmp path without
   checking if it's a pre-existing symlink. Add `lstatSync` check before
   `writeFileSync` on the tmp path.
3. **ISO timestamp normalization** — `sinceDate` from MASTER_DEBT.jsonl may be
   full ISO (2026-02-16T...). Use `.trim().slice(0, 10)` before YYYY-MM-DD
   validation.
4. **Guard --apply loop against closed/filtered items** — The update loop
   iterated over `allItems` ignoring filters applied to `openItems`. Added
   status and category guards to prevent re-resolving already-closed items.
5. **Cross-platform atomic rename** — `fs.renameSync` may fail on Windows if
   destination exists. Added fallback: `rmSync(dest)` then retry rename.

**Resolution Stats:** 7/12 fixed (58%), 5/12 rejected (JSONL data quality x3,
title case preservation, state-manager CLI parsing)

---

#### Review #340: PR #369 R6 — CC Extraction x2, wx Flag, Atomic writeMasterDebt, Collision Detection (2026-02-17)

**Source:** SonarCloud (2 CC Issues) + Qodo Security (1) + Qodo Suggestions (8)
**PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR \#369)
**Suggestions:** 11 total (Fixed: 7, Rejected: 4)

**Patterns Identified:**

1. **Extract guardSymlink() + atomicWrite() for CC reduction** —
   generate-results-index.js main() CC 17→~5 by extracting symlink guards and
   atomic write into reusable helpers.
2. **Extract classifyOpenItems() + applyResolutions() for CC reduction** —
   track-resolutions.js main() CC 22→~8 by extracting classification loop and
   --apply logic into separate functions.
3. **Exclusive-create flag "wx"** — Using `{ flag: "wx" }` in writeFileSync
   atomically prevents TOCTOU/symlink races on tmp files, eliminating the need
   for a separate lstatSync guard.
4. **Atomic write for writeMasterDebt()** — Replaced direct writeFileSync with
   tmp+rename pattern (wx flag + cross-platform fallback) to close TOCTOU
   window.
5. **Return canonical path** — validateInputPath() was returning resolvedInput
   (pre-realpath) instead of inputReal (post-realpath), undermining containment.
6. **Finding key collision detection** — Map.set() silently overwrites duplicate
   keys. Added has() check + warning to prevent silent data loss in comparisons.

**Resolution Stats:** 7/11 fixed (64%), 4/11 rejected (JSONL data quality x4)

---

#### Review #341: PR #369 R7 — CC indexByKey, Ancestor Symlink, fstatSync Forward Scan, Error -1 (2026-02-17)

**Source:** SonarCloud (1 CC Issue) + Qodo Security (2) + Qodo Compliance (2) +
Qodo Suggestions (5) **PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR
\#369) **Suggestions:** 10 total (Fixed: 7, Rejected: 3)

**Patterns Identified:**

1. **Extract indexByKey() for CC reduction** — compare-audits.js
   compareFindings() CC 17→~10 by extracting collision-aware Map indexing into a
   reusable helper.
2. **Ancestor symlink containment** — Checking only outputDir and outputFile for
   symlinks misses ancestor path components. Use `realpathSync` +
   `path.relative` to verify the resolved path stays within repo root.
3. **Dir + dest symlink guards in fallback** — The Windows cross-platform rename
   fallback path (rmSync + rename) lacked symlink re-checks. Added lstatSync
   guards on both directory and destination before rmSync.
4. **fstatSync forward scan** — Pattern compliance checker only looked backward
   for fstatSync guards, but fd-based chains (openSync→fstatSync) place the
   guard after the open. Added forward scan to avoid false positives.
5. **Return -1 on git error** — Returning 0 from countCommitsSince on error
   masks failures as "no commits needed". Return -1 and surface as ERROR in
   output.

**Resolution Stats:** 7/10 fixed (70%), 3/10 rejected (JSONL data quality x2,
state-manager dedup)
