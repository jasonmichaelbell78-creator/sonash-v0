<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-20
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Archived Reviews #285-#346

Reviews archived from AI_REVIEW_LEARNINGS_LOG.md on 2026-02-20.

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

### Review #349: PR #371 R3 — Argument Injection, Suppression Scope, Pipeline Robustness

**Date:** 2026-02-17 **Source:** Qodo PR Compliance + Code Suggestions
**PR/Branch:** PR #371

**Summary:** 7 suggestions (4 consolidated to 1 MAJOR, 2 MINOR, 1 rejected).
Main issue: unquoted `$staged_js` in the new CC pre-commit gate enabled argument
injection via crafted filenames and broke on filenames with spaces. Fixed by
switching from bare `$staged_js` expansion to `printf | xargs ... --` pattern,
which handles word-splitting safely and uses `--` to prevent `-`-prefixed
filenames from being interpreted as flags.

**Patterns Identified:**

1. **Unquoted shell variable in command arguments**: `$staged_js` was passed
   directly to `npx eslint`, enabling both argument injection (filenames
   starting with `-`) and word-splitting on spaces/newlines. Fixed with
   `printf '%s\n' "$staged_js" | xargs ... --` pattern.
2. **Qodo suppression scope mismatch**: `pr_compliance_checker` section scoped
   to `scripts/` and `.claude/hooks/` but not `docs/technical-debt/`, causing
   "Absolute path leakage" false positives to persist on TDMS data files.
3. **grep|head pipeline not fail-safe**: In a Husky hook that may run with
   `set -e`, `grep "complexity" | head -10` would terminate the script if grep
   finds no matches, before the proper error message is displayed.

**Resolution:**

- Fixed: 5 items (consolidated from 7 — 4 overlapping suggestions merged)
- Rejected: 1 item (reviews.jsonl id type — string IDs for retro entries are
  intentional and consistent across retro-367 through retro-371)
- Deferred: 0

**Key Learnings:**

- Shell variables used as command arguments must be quoted or piped through
  xargs
- The `--` separator prevents filenames from being parsed as flags
- Qodo compliance checker has separate scope from pr_reviewer — both need
  matching suppression rules
- Pipeline commands in hooks should append `|| true` when running under set -e

---

### Review #350: PR #374 R1 — Bidirectional Containment, Fail-Closed Guard, backupSwap Safety

**Date:** 2026-02-17 **Source:** Qodo PR Compliance + Code Suggestions
**PR/Branch:** PR #374

**Summary:** 15 suggestions (8 fixed, 4 deferred, 3 rejected). Key security
fixes: bidirectional path containment in resolveProjectDir(), fail-closed
symlink guard fallback restricting writes to .claude/state/ only, and backupSwap
restore-on-failure logic.

**Patterns Identified:**

1. **Bidirectional containment in resolveProjectDir()**: Original check only
   verified CWD was under CLAUDE_PROJECT_DIR but not vice versa. Added
   bidirectional check so resolved path must be ancestor or descendant of CWD.
2. **Fail-closed symlink guard fallback**: When symlink-guard.js module is
   unavailable, the fallback isSafeToWrite allowed all writes (fail-open).
   Changed to restrict writes to known .claude/state/ directory only.
3. **backupSwap missing restore on failure**: If final renameSync(tmp, dest)
   failed after backup was created, the backup was never restored, losing the
   original file. Added restore logic in catch block.
4. **Prettier formatting as CI blocker**: SUMMARY.md had trailing whitespace
   that failed the prettier check in CI.

**Resolution:**

- Fixed: 8 items (containment, fail-closed guard, backupSwap, prettier, readonly
  seed data, propagated projectDir to post-write-validator.js)
- Deferred: 4 items (stable seed IDs, build freshness detection, etc.)
- Rejected: 3 items (false positives or already handled)

**Key Learnings:**

- Path containment checks must be bidirectional to prevent both escape and
  restriction bypass
- Security fallbacks must be fail-closed (deny by default), not fail-open
- Atomic write helpers need restore-on-failure for the backup file
- Pre-commit pattern check can false-positive on atomic write patterns that span
  multiple lines — use SKIP_PATTERN_CHECK with documented reason

---

### Review #351: PR #374 R2 — Path Sep Boundary, New-File Guard, Evidence Dedup

**Date:** 2026-02-17 **Source:** Qodo PR Compliance + Code Suggestions
**PR/Branch:** PR #374

**Summary:** 3 suggestions, all fixed. Path separator boundary bypass in
containment check, isSafeToWrite crash on non-existent files, and duplicate
evidence objects in MASTER_DEBT.jsonl.

**Patterns Identified:**

1. **startsWith without path.sep boundary**: `a.startsWith(b)` matches
   `/repo/app-malicious` when checking against `/repo/app`. Must use
   `a.startsWith(b + path.sep)` or check `a === b` separately.
2. **realpathSync on non-existent files**: isSafeToWrite fallback used
   `realpathSync(path.resolve(p))` which throws on .tmp/.bak files that don't
   exist yet. Fix: realpath the parent directory and check containment there.
3. **Evidence array deduplication**: MASTER_DEBT.jsonl had duplicate evidence
   objects within items, inflating file size. Deduped 27 entries by
   JSON.stringify comparison.

**Resolution:**

- Fixed: 3/3 items
- Deferred: 0
- Rejected: 0

**Key Learnings:**

- Path containment with startsWith ALWAYS needs the separator boundary check
- When validating paths for files that may not exist yet, realpath the parent
  directory instead of the full path
- Case-insensitive comparison needed on Windows: normalize with toLowerCase()
  before startsWith checks

---

### Review #353: PR #374 R4 — Ancestor Containment Restore, Fresh Repo Guard, gitExec Trim, CI Doc Fixes

**Date:** 2026-02-18 **Source:** Qodo PR Compliance + Code Suggestions + CI
Failure **PR/Branch:** PR #374

**Summary:** 8 suggestions (6 fixed, 1 rejected, 1 pre-existing batch fix). Key
fixes: restore ancestor containment for monorepo support, prevent fallback write
lockout on fresh repos, optional trim for NUL-delimited git output, silent catch
blocks get DEBUG logging, sanitize error messages in TDMS hook, fix CI
docs:check failures.

**Patterns Identified:**

1. **Descendant-only containment too restrictive**: R3 removed ancestor
   direction, but CLAUDE_PROJECT_DIR can legitimately be a monorepo root that is
   an ancestor of cwd. Restored bidirectional check.
2. **realpathSync on non-existent directories**: Fallback isSafeToWrite used
   realpathSync on state/hooks dirs which may not exist on fresh checkouts. Fix:
   realpath the .claude dir, then path.resolve for subdirs.
3. **gitExec .trim() corrupts NUL-delimited output**: git commands with -z flag
   produce NUL-separated output that .trim() mangles. Added opts.trim=false.
4. **Silent catch blocks reduce debuggability**: Qodo compliance flagged
   try/catch blocks that swallow errors without any context. Added DEBUG-gated
   logging for non-critical paths.
5. **Raw error.message exposure**: TDMS hook logged raw error.message which
   could expose internal paths. Replaced with generic message.

**Resolution:**

- Fixed: 6 items (ancestor containment, fresh repo guard, trim flag, silent
  catches, error sanitization, CI doc fixes)
- Rejected: 1 item (seed data PII — public business listings)
- Pre-existing (batch): 7 doc files with broken links and missing sections

**Key Learnings:**

- Containment checks need both directions: descendant (resolved under cwd) AND
  ancestor (cwd under resolved) for monorepo/workspace scenarios
- Fresh repo checkouts may not have .claude/state/ or .claude/hooks/ dirs yet —
  don't realpathSync them, use path.resolve instead
- git commands using -z flag need raw output — provide opt-out from .trim()
- Review ping-pong pattern: R2→R3→R4 progressively adjusted the same containment
  logic — should have gotten bidirectional right in R1

---

### Review #352: PR #374 R3 — Descendant Containment, backupSwap Copy, mkdirSync Order, CI Fix

**Date:** 2026-02-18 **Source:** Qodo PR Compliance + Code Suggestions + CI
Failure **PR/Branch:** PR #374

**Summary:** 8 suggestions (7 fixed, 1 deferred). CI failure from orphaned
ROADMAP debt references caused by MASTER_DEBT data loss during evidence dedup.
Code fixes: descendant-only containment, backupSwap copy fallback, mkdirSync
before isSafeToWrite.

**Patterns Identified:**

1. **Ancestor containment too permissive**: `cwd.startsWith(resolved)` allowed
   resolved to be `/` or any ancestor directory. Restricted to descendant-only:
   resolved must equal CWD or be under CWD.
2. **backupSwap deletes original on rename failure**: If renameSync(file, bak)
   fails, the catch block called silentRm(file) which deletes the original.
   Changed to copyFileSync as fallback to preserve the original.
3. **mkdirSync after isSafeToWrite**: If parent dir doesn't exist, realpathSync
   in isSafeToWrite fails and saveJson silently returns false. Moved mkdirSync
   before the isSafeToWrite check.
4. **MASTER_DEBT data loss chain**: R2's evidence dedup changed deduped.jsonl,
   then generate-views.js overwrote MASTER_DEBT.jsonl from deduped.jsonl (which
   had fewer entries than main). 56 ROADMAP-referenced DEBT IDs were lost.
   Restored by merging committed + main entries.
5. **npm UA parsing crash**: npm_config_user_agent can be empty string or have
   unexpected format. Regex needed optional match with fallback to "unknown".

**Resolution:**

- Fixed: 7 items (descendant containment, backupSwap copy, mkdirSync order,
  hooks dir in fallback guard, npm UA parsing, orphaned refs restore, module
  load verification)
- Deferred: 1 item (build freshness detection — dir mtime vs file mtime)
- Rejected: 0

**Key Learnings:**

- generate-views.js OVERWRITES MASTER_DEBT.jsonl from deduped.jsonl — any
  modification to deduped.jsonl can cause data loss if entries are removed
- Path containment should be descendant-only unless there's an explicit need for
  ancestor checks
- Atomic write helpers must never delete the original file in error paths — use
  copy as fallback for backup creation
- mkdir must happen before any realpathSync calls on paths within that directory
- Always verify CI passes after data file modifications — orphaned reference
  checks catch data loss early

---

### Review #354: PR #374 R5 — saveJson Guard Bypass, NUL Trim Propagation, Ancestor Depth Limit

**Date:** 2026-02-18 **Source:** Qodo PR Compliance + Code Suggestions
**PR/Branch:** PR #374

**Summary:** 6 suggestions (5 fixed, 1 rejected). Key security fix: saveJson
fallback write path bypassed isSafeToWrite guard — hoisted safety flag to
function scope so catch block respects it. Propagation fix: all 5 git -z calls
across 3 hook files now pass {trim: false}. Defense-in-depth: ancestor
containment capped at 10 levels.

**Patterns Identified:**

1. **Fallback code bypasses safety guard**: saveJson's catch block had a direct
   writeFileSync without re-checking isSafeToWrite. Fixed by hoisting
   `safeToWrite` flag to function scope so the fallback path respects the
   initial check.
2. **Auto-trim corrupts NUL-delimited output**: gitExec always called .trim()
   which strips NUL bytes from git -z output. Fixed with auto-detect:
   `!out.includes("\0")` skips trim when NUL bytes are present.
3. **Propagation miss on {trim: false}**: R4 added the trim opt-out but only
   callers in the same file used it. 3 calls in post-read-handler.js and 1 in
   pre-compaction-save.js also use -z but were not updated. Fixed all 4.
4. **Ancestor depth unlimited**: resolveProjectDir accepted any ancestor (even
   `/`). Added depth limit: reject ancestors more than 10 levels up.

**Resolution:**

- Fixed: 5 items (saveJson guard bypass, gitExec NUL auto-detect,
  post-read-handler -z trim, pre-compaction-save -z trim, ancestor depth limit)
- Rejected: 1 item (CLAUDE_PROJECT_DIR attacker-controlled — env is set by
  Claude runtime, not user input; if attacker controls env they have code exec)

**Key Learnings:**

- Fallback/catch paths MUST respect the same safety guards as the happy path —
  hoisting a boolean flag is the cleanest pattern
- When adding opt-out behavior to shared utilities, propagation check must cover
  ALL callers across all files, not just the file being modified
- Auto-detect (checking for NUL bytes) is more robust than opt-in flags for
  preventing trim corruption — callers can't forget to pass the flag
- Defense-in-depth for path traversal: even when the threat model doesn't
  support attacker control, cheap mitigations (depth limit) are worth adding

---

### Review #355: PR #378 R1 — Exit Code Coercion, TOCTOU Race, Absolute Paths, Checklist Gaps

**Date:** 2026-02-18 **Source:** Qodo PR Compliance + Code Suggestions
**PR/Branch:** PR #378

**Summary:** 11 suggestions (7 fixed, 4 rejected). Key bug fix: exit code from
hook JSON could be string, causing `=== 0` to always fail — added `Number()`
coercion with `Number.isFinite()` guard. TOCTOU fix: removed `existsSync` +
`statSync` double-check, catching `ENOENT` instead. Stripped 41 absolute paths
from agent research results. Added missing Domain 0/3/9 checks to system-test
skill.

**Patterns Identified:**

1. **String-to-number coercion on exit codes**: JSON-parsed exit codes may
   arrive as strings. `"0" === 0` is false in JS — always coerce with `Number()`
   and guard with `Number.isFinite()`.
2. **TOCTOU on file existence**: `existsSync()` + `statSync()` has a race
   window. Better: single `statSync()` in try/catch, handle `ENOENT`.
3. **Absolute paths in committed artifacts**: Agent research output contained 41
   instances of `/home/user/sonash-v0/` — use relative paths only.
4. **Checklist completeness**: System test domains should cover query
   complexity/DoS (Firestore) and skipped/todo tests (test suite).

**Resolution:**

- Fixed: 7 items (exit code coercion, TOCTOU race, absolute paths, finding ID,
  Domain 0 check, Domain 3 skipped tests, Domain 9 query complexity)
- Rejected: 4 items (log exposure — log is in .gitignore; log exfiltration —
  attacker can't influence log path; PWA caching — app is SPA not PWA; state
  file removal — file serves a purpose)

**Key Learnings:**

- Hook argument JSON has no type guarantees — always coerce numeric fields
- Prefer single-operation + catch over exists-check + operation patterns
- Research artifacts should use relative paths for portability

---

### Review #356: PR #378 R2 — GIT_DIR Resolution, Broken Table Row

**Date:** 2026-02-19 **Source:** Qodo PR Compliance + Code Suggestions
**PR/Branch:** PR #378

**Summary:** 6 suggestions (2 fixed, 3 rejected, 1 deferred). Key fix: hardcoded
`.git` path replaced with `GIT_DIR`-aware resolution for worktree and
non-standard git directory support.

**Patterns Identified:**

1. **GIT_DIR env var for git directory resolution**: `process.cwd() + ".git"` is
   fragile — fails in worktrees or when `GIT_DIR` is set. Use `GIT_DIR` env var
   with fallback.
2. **Auto-generated file quirks**: `DOCUMENTATION_INDEX.md` is regenerated by
   `npm run docs:index`. Generator had a broken table row — fixed manually but
   root cause is in the generator.

**Resolution:**

- Fixed: 2 items (GIT_DIR-aware path resolution, broken markdown table row)
- Rejected: 3 items (log exposure — repeat from R1; stderr for errors — defeats
  hook's purpose since Claude Code reads stdout; err.code guard —
  over-engineering for Node.js fs errors)
- Deferred: 1 item (exclude transient docs from index — requires generator
  changes)

**Key Learnings:**

- Always use `GIT_DIR` env var when resolving git directory paths in hooks
- Claude Code PostToolUse hooks communicate via stdout — stderr is invisible
- When rejecting reviewer suggestions, verify the tool's communication protocol
  before accepting "best practice" advice that would break functionality

---

### Review #357: PR #379 R3 — Prototype Pollution, Path Normalization, Type-Stable Keys

**Date:** 2026-02-20 **Source:** SonarCloud + Qodo PR Compliance + Code
Suggestions **PR/Branch:** PR #379

**Summary:** 18 raw suggestions → 12 unique after dedup. 6 fixed, 4 rejected, 2
deferred. Key fixes: prototype pollution prevention in canonicalize, source_file
now uses full normalizeFilePath(), type-stable evidence dedup keys, circular
reference protection, path-segment-boundary matching for repo root stripping.

**Patterns Identified:**

1. **Prototype pollution in Object.create({})**: When building objects from
   untrusted keys, use `Object.create(null)` and skip `__proto__`/constructor.
2. **normalizeFilePath reuse**: When a normalization function exists, use it
   everywhere — don't do partial normalization (backslash-only) on some fields.
3. **Type-stable dedup keys**: Prefix keys with `str:`, `prim:`, `json:` to
   prevent collisions between `"1"` (string) and `1` (number).
4. **Path segment boundary**: `indexOf("sonash-v0/")` matches
   `not-sonash-v0/...` — use regex with `(?:^|/)` anchor.

**Resolution:**

- Fixed: 6 items (prototype pollution, normalizeFilePath for source_file,
  replaceAll, path segment regex, circular ref protection, type-stable keys)
- Rejected: 4 items (Date/RegExp/Set/Map handling — impossible from JSON.parse;
  WeakMap unserializable IDs — over-engineering; operator "root" as PII — it's a
  role; missing outcome field — items_processed/errors already present)
- Deferred: 2 items (JSONL schema migration for sentinel files/evidence
  types/resolution types — pre-existing, complex, needs systematic approach)

**Key Learnings:**

- Object.create(null) is the standard defense against prototype pollution
- Evidence data from JSON.parse can never contain Date/RegExp/Set/Map — reject
  suggestions that add handling for impossible types
- When normalizing paths, always use path-segment boundaries not substring match

---

### Review #358: PR #379 R4 — Circular Ref Fix, Regex Escaping, Internal Dedup

**Date:** 2026-02-20 **Source:** Qodo PR Compliance + Code Suggestions
**PR/Branch:** PR #379

**Summary:** 6 suggestions → 4 unique. 3 fixed, 2 rejected (repeats), 1 deferred
(architectural). Key fixes: try/finally for correct circular reference tracking,
regex escaping for env var in RegExp, internal dedup within incoming evidence
arrays.

**Patterns Identified:**

1. **WeakSet circular detection needs try/finally**: Without `seen.delete(v)` in
   finally, shared object references (same obj in two properties) are
   misidentified as circular. Always use try/finally to clean up the seen set.
2. **Always escape user input before RegExp constructor**: Even "trusted" env
   vars can contain regex metacharacters (e.g., repo names with dots).
3. **Dedup incoming AND existing**: When merging arrays, dedup within the
   incoming array too — not just against the existing set.

**Resolution:**

- Fixed: 3 items (try/finally circular ref, regex escaping, internal dedup)
- Rejected: 2 items (compliance repeats from R3 — intake-manual user ID,
  operator "root" label)
- Deferred: 1 item (created timestamp mutation on re-normalization —
  architectural, requires pipeline-level first-seen tracking)

**Key Learnings:**

- WeakSet-based cycle detection must use try/finally to delete after recursion
- `new RegExp(untrustedString)` is always a security/robustness concern
- Array dedup must handle both cross-array and intra-array duplicates

---

### Review #359: PR #379 R5 — CC Extraction, String Coercion, String.raw

**Date:** 2026-02-20 **Source:** SonarCloud + Qodo PR Suggestions **PR/Branch:**
PR #379

**Summary:** 7 suggestions → 5 unique after dedup. 3 fixed, 2 rejected
(impossible types from JSON.parse, compliance repeat). Key fixes: extracted 3
functions from mergeItems to reduce CC from 18 to under 15, added String
coercion and empty env var guard in normalizeFilePath, used String.raw and
replaceAll per SonarCloud es2021 rules.

**Patterns Identified:**

1. **Extract helpers early to avoid CC creep**: Accumulated R1-R4 changes to
   evidence merge logic inside mergeItems pushed CC to 18. Extracting
   canonicalize, evidenceToKey, mergeEvidence as standalone functions resolved
   cleanly.
2. **String.raw for regex escape replacements**: SonarCloud es2021 flags
   `"\\$&"` — use `String.raw` template literal instead to avoid escape
   confusion.
3. **Always coerce + trim env vars**: Non-string inputs and whitespace-only env
   vars should be handled defensively at the top of path normalization.

**Resolution:**

- Fixed: 3 items (CC extraction, String coercion + env var guard, String.raw +
  replaceAll)
- Rejected: 2 items (safeStringify for impossible types, compliance repeat)

**Key Learnings:**

- When iterative review rounds add logic to the same function, check CC before
  committing — extract helpers proactively
- `String.raw` is the idiomatic way to write regex replacement strings with
  backslashes
- Always validate env vars with trim check, not just truthiness

---

### Review #360: PR #379 R6 — Depth Cap, Evidence Wrapping, Fallback Keys

**Date:** 2026-02-20 **Source:** Qodo Security + PR Suggestions **PR/Branch:**
PR #379

**Summary:** 7 suggestions → 3 unique after dedup. 3 fixed, 4 rejected
(compliance repeat x1, impossible types x1, replaceAll compat x1,
over-engineered path guard x1). Key fixes: depth cap on canonicalize to prevent
algorithmic DoS, non-array evidence wrapping to prevent data loss, richer
fallback keys for unserializable objects.

**Patterns Identified:**

1. **Always cap recursive traversal depth**: Even when input is "trusted" JSONL,
   adding a depth parameter is cheap insurance against DoS. Cap at 20 levels.
2. **Wrap non-array scalars defensively**: When merging arrays, if existing
   value is a non-null scalar, wrap it in `[value]` rather than discarding.
3. **Qodo repeat rejection pattern**: Same Date/RegExp/Map/Set suggestion
   rejected 4 consecutive rounds (R3-R6) — impossible from JSON.parse.

**Resolution:**

- Fixed: 3 items (depth cap, evidence wrapping, richer fallback key)
- Rejected: 4 items (compliance repeat, impossible types, replaceAll compat,
  over-engineered path guard)

**Key Learnings:**

- Recursive traversal functions should always have a depth parameter
- Defensive wrapping of non-array values prevents silent data loss
- Track repeated rejections to identify persistent false positive patterns

---

### Review #361: PR #379 R7 — Nested Ternary Extraction, Incoming Evidence Wrapping

**Date:** 2026-02-20 **Source:** SonarCloud + Qodo PR Suggestions **PR/Branch:**
PR #379

**Summary:** 8 suggestions → 2 unique after dedup. 2 fixed, 6 rejected (5
repeats from R3-R6, 1 would corrupt evidence ordering). Key fixes: extracted
nested ternary into toArray() helper per SonarCloud, wrapped non-array incoming
evidence symmetrically with existing evidence handling.

**Patterns Identified:**

1. **Nested ternaries from defensive coding**: Adding
   `existing == null ? [] : [existing]` to a ternary creates SonarCloud-flagged
   nesting. Extract to a named helper function immediately.
2. **Symmetric defensive wrapping**: If you wrap one side (existing) of a merge
   defensively, wrap the other side (incoming) too for consistency.

**Resolution:**

- Fixed: 2 items (toArray helper, incoming evidence wrapping)
- Rejected: 6 items (DoS repeat, compliance repeat x5, impossible types x5,
  array sorting would corrupt semantics, fallback key diminishing returns, key
  length cap over-engineering)

**Key Learnings:**

- When adding defensive wrapping, apply symmetrically to both sides of a merge
- Extract complex ternaries to named helpers immediately to avoid SonarCloud
  flags
- 5 consecutive rejections of Date/RegExp/Map/Set suggestion — clear false
  positive pattern

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

---

#### Review #342: PR #369 R8 — CC buildResults+statusIcon, guardSymlink+safeRename, Symlink Walk, detectAndMapFormat (2026-02-17)

**Source:** SonarCloud (3 Issues) + Qodo Security (1) + Qodo Compliance (2) +
Qodo Suggestions (7) **PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR
\#369) **Suggestions:** 13 total (Fixed: 8, Rejected: 5)

**Patterns Identified:**

1. **Extract buildResults()+statusIcon() for CC reduction** —
   count-commits-since.js main() CC 17→~8 by extracting the commit-counting loop
   and nested ternary into named helpers.
2. **Extract guardSymlink()+safeRename() for CC reduction** —
   track-resolutions.js writeMasterDebt() CC 20→~6 by extracting symlink guard
   and cross-platform rename into reusable helpers.
3. **Skip symlinks in directory walk** — generate-results-index.js walk()
   traversed symlinks, risking infinite loops or path traversal.
   `entry.isSymbolicLink()` check added before `isDirectory()`.
4. **Restrict fstatSync scan to openSync** — Pattern compliance checker's
   forward scan for fstatSync should only trigger for openSync calls (not
   writeFileSync), and should start from current line `i` not `backStart`.
5. **Sequential format detection** — intake-audit.js detectAndMapFormat
   refactored from mutating let variables to early-return pattern, preventing
   accidental remapping of already-TDMS items.
6. **Error field as string** — JSON output error field changed from boolean to
   descriptive string "Failed to count commits" for consumer clarity.
7. **Silent error in --json mode** — printNoData now outputs
   `{"error":"message"}` instead of `{}` so callers can distinguish failure from
   "no thresholds exceeded".

**Resolution Stats:** 8/13 fixed (62%), 5/13 rejected (JSONL data quality x3,
file/line normalization x1, state-manager dedup x1)

---

#### Review #343: PR #369 R9 — Fail-Closed guardSymlink, Non-Object Guard, Pattern Recognizer, Source ID Regex (2026-02-17)

**Source:** Qodo Suggestions (9) **PR/Branch:**
claude/cherry-pick-recent-commits-X1eKD (PR \#369) **Suggestions:** 9 total
(Fixed: 5, Rejected: 4)

**Patterns Identified:**

1. **Fail-closed guardSymlink** — Generic catch in guardSymlink silently
   swallows unexpected errors (EPERM, EIO). Only ignore ENOENT/ENOTDIR; treat
   all others as fatal. Propagated to both track-resolutions.js and
   generate-results-index.js.
2. **Non-object guard in detectAndMapFormat** — Malformed JSONL lines can parse
   to primitives/arrays. Added plain-object check with "invalid" format marker.
3. **Recognize guardSymlink in pattern checker** — New guardSymlink function
   wasn't listed as a recognized guard pattern in check-pattern-compliance.js,
   causing false positives on compliant code.
4. **Source ID regex alignment** — validate-schema.js regex allowed both colon
   and hyphen separators but warning message only documented colons. Tightened
   regex to match documented format.
5. **File path normalization warning** — Non-empty file paths that normalize to
   empty were silently ignored. Added explicit warning for unnormalizable paths.

**Resolution Stats:** 5/9 fixed (56%), 4/9 rejected (JSONL data quality x4)

---

#### Review #344: PR #370 R2 — resolve-bulk.js hardening, MASTER_DEBT data quality, orphaned ROADMAP refs (2026-02-17)

**Source:** SonarCloud (1) + Qodo Compliance (3) + Qodo Suggestions (5) + CI (2)
**PR/Branch:** claude/new-session-6kCvR (PR #370) **Suggestions:** 11 total
(Fixed: 10, Deferred: 1)

**Patterns Identified:**

1. **Path traversal on CLI --output-json** — Arbitrary file write via
   user-supplied path. Fix: validatePathInDir to restrict within repo root.
2. **SonarCloud i assignment** — `parsed.outputJson = args[++i]` flagged. Fix:
   separate increment from assignment.
3. **Duplicated write blocks** — Two identical writeFileSync blocks triggered
   7.4% SonarCloud duplication. Fix: extract `writeOutputJson` helper with
   atomic tmp+rename, path validation, and timestamp.
4. **Orphaned ROADMAP DEBT refs** — sync-roadmap-refs CI check catches refs to
   DEBT IDs not in MASTER_DEBT.jsonl.
5. **lint-staged evidence loss** — Large JSONL changes (dedup + path fix) lost
   during lint-staged backup/restore cycle. Fix: re-apply and commit carefully.
6. **generate-views.js overwrites MASTER_DEBT** — Running generate-views.js
   after manually adding items to MASTER_DEBT.jsonl destroys those additions
   because it rebuilds from raw/deduped.jsonl. Fix: add items after view
   generation, or add to raw/deduped.jsonl source.

**Resolution Stats:** 10/11 fixed (91%), 1/11 deferred (docs:check 36
pre-existing errors → DEBT tracking)

---

#### Review #345: PR #370 R3 — parseArgs CC+i refactor, writeOutputJson hardening, generate-views preservation (2026-02-17)

**Source:** SonarCloud (4) + Qodo Suggestions (6) + User Request (1)
**PR/Branch:** claude/new-session-6kCvR (PR #370) **Suggestions:** 11 total
(Fixed: 11, Deferred: 0)

**Patterns Identified:**

1. **for-loop i assignment** — SonarCloud flags `i += 1` in for-loop body. Fix:
   convert to while-loop where i management is explicit.
2. **CC reduction via extraction** — parseArgs CC 16>15. Fix: extract
   `validateOutputJsonPath` and `validatePrNumber` validators.
3. **Symlink check ordering** — Must check parent symlinks BEFORE mkdirSync, not
   after. Also clean up tmp file on error.
4. **generate-views.js overwrites** — Manual additions to MASTER_DEBT.jsonl lost
   when generate-views rebuilds from raw/deduped.jsonl. Fix: preserve existing
   items not present in deduped input.
5. **Cross-platform rename** — Pre-remove destination before renameSync for
   Windows compatibility.
6. **Source data normalization** — Absolute paths in raw/deduped.jsonl propagate
   to MASTER_DEBT.jsonl and views on every regeneration. Fix: normalize at
   source AND add normalizeFilePath guard in generate-views.js pipeline.

**Resolution Stats:** 11/11 fixed (100%), 0 deferred

---

#### Review #346: PR #370 R4 — dynamic path prefix, merged defaults, unknown arg guard, negated condition (2026-02-17)

**Source:** SonarCloud (1) + Qodo Suggestions (5) + Qodo Compliance (5)
**PR/Branch:** claude/new-session-6kCvR (PR #370) **Suggestions:** 11 total
(Fixed: 8, Rejected: 3)

**Patterns Identified:**

1. **Hard-coded path prefix** — `normalizeFilePath` used literal
   `"home/user/sonash-v0/"` instead of dynamic `path.resolve(__dirname)`.
   Non-portable across environments.
2. **Merged items bypass pipeline** — `mergeManualItems` pushed items without
   calling `ensureDefaults()`, so path normalization was skipped.
3. **Unknown args silently ignored** — parseArgs dropped unrecognized flags
   without warning, making typos in CI invisible.
4. **Negated condition readability** — SonarCloud flags `if (!x.includes(y))` as
   harder to read. Flip to positive condition first.

**Rejected:** [8,11] Actor in JSON (captured in resolution-log.jsonl), [9]
Unstructured logs (pre-existing architectural pattern across all TDMS scripts)

**Resolution Stats:** 8/11 fixed (73%), 3/11 rejected

---
