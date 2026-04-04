# Findings: D10a — Which items from CODE_PATTERNS.md and SECURITY_CHECKLIST.md are universal to any codebase?

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-31
**Sub-Question IDs:** D10a

---

## Key Findings

### 1. The majority of critical (red) patterns are universal [CONFIDENCE: HIGH]

Of the ~40 red-priority items across CODE_PATTERNS.md, roughly 30 apply to any
codebase regardless of framework. The primary exceptions are Firebase-specific
patterns (App Check enforcement, httpsCallable mocking, Firestore batching) and
the sonash-specific ESLint/Semgrep rule names (e.g., `sonash/no-raw-error-log`).
The underlying principle behind every one of those custom rules is universal.

Source: Direct read of CODE_PATTERNS.md lines 1-657, SECURITY_CHECKLIST.md lines
1-299, PRE_GENERATION_CHECKLIST.md lines 1-99.

---

### 2. Classification table — all items by scope [CONFIDENCE: HIGH]

#### UNIVERSAL — Any codebase would benefit

**Security / Input Handling**

| Item                                 | Rule                                                                    | Priority |
| ------------------------------------ | ----------------------------------------------------------------------- | -------- |
| No raw error.message in logs         | Sanitize errors before logging — strip file paths, user directories     | CRITICAL |
| Path traversal check                 | Use regex `/^\.\.(?:[\\/]\|$)/` NOT `startsWith('..')`                  | CRITICAL |
| Path traversal rejection             | Reject, never strip `../`                                               | CRITICAL |
| Path containment at all touch points | Validate at every operation, not just entry                             | CRITICAL |
| CLI arg validation                   | Check existence, non-empty, not another flag at parse time              | CRITICAL |
| Never trust external input in exec   | Validate before execSync/spawn                                          | CRITICAL |
| Args arrays over template strings    | `execFileSync(cmd, [arg1, arg2])` not template literals                 | CRITICAL |
| Shell interpolation                  | Sanitize ALL inputs before shell commands                               | CRITICAL |
| Prototype pollution                  | `Object.create(null)` or `new Map()` for untrusted keys                 | CRITICAL |
| Regex length limits                  | `{1,64}` not `+` for bounded user input (ReDoS)                         | CRITICAL |
| ReDoS detection                      | Heuristic detection for nested quantifiers + length limits              | CRITICAL |
| O(n²) DoS                            | Truncate inputs before quadratic operations                             | CRITICAL |
| Unicode line separator sanitization  | Include `\u2028\u2029` in log sanitization, not just `\n\r`             | CRITICAL |
| Input length DoS                     | Cap path/input at 4096 chars before processing                          | CRITICAL |
| SSRF allowlist                       | Explicit hostname allowlist + HTTPS-only enforcement                    | CRITICAL |
| URL protocol allowlist               | Validate against explicit protocol+host allowlist                       | CRITICAL |
| Markdown injection                   | Escape dynamic content in generated Markdown/docs                       | CRITICAL |
| PII masking in logs                  | Mask emails, usernames in log output                                    | CRITICAL |
| Secure error logging                 | Never log raw input content; log line numbers/char counts               | CRITICAL |
| Defense-in-depth bypass              | Multi-condition bypass; single env var should not disable prod security | CRITICAL |
| Production fail-closed               | Security features must fail-closed, not bypass                          | CRITICAL |
| Atomic state writes                  | Write to tmp file + rename; never partial write state                   | CRITICAL |
| Temp file wx flag                    | `{ flag: "wx", mode: 0o600 }` for exclusive creation                    | CRITICAL |
| Regex state leak (`/g` reset)        | Reset `lastIndex` before each iteration                                 | CRITICAL |
| Validate-then-store path             | Store the resolved form after validation, not raw input                 | CRITICAL |
| Same-path rename guard               | Check `src === dest` before destructive rename                          | CRITICAL |
| Cross-device rename safety           | Wrap renameSync in try/catch with copyFileSync fallback                 | CRITICAL |
| Backup-swap atomic write             | dest→.bak, tmp→dest, rm .bak; restore on failure                        | CRITICAL |
| git add -A prohibition               | Never use `-A` in automation; always explicit paths                     | CRITICAL |
| Git option injection                 | Strip leading dashes; use `["add", "--", path]`                         | CRITICAL |
| Git pathspec magic                   | Reject paths starting with `:`                                          | CRITICAL |
| Supply chain pinning (CI)            | Pin third-party actions/packages to full SHA                            | CRITICAL |
| Cognitive complexity cap             | Keep functions under CC 15; extract helpers                             | CRITICAL |
| Error rethrow after sanitize         | Use `process.exit(1)` not `throw err` after sanitized logging           | CRITICAL |
| Segment-based path check             | `path.relative().split(sep)[0] === ".."` not string prefix              | CRITICAL |
| Path normalize before string checks  | Normalize to POSIX before `includes()`/`startsWith()`                   | CRITICAL |
| Fail-closed realpath                 | If realpathSync fails but file exists, reject                           | CRITICAL |
| Safety flag hoist                    | Hoist guard result to function scope; check in BOTH try and catch       | CRITICAL |

**File Operations**

| Item                            | Rule                                                            | Priority |
| ------------------------------- | --------------------------------------------------------------- | -------- |
| File reads in try/catch         | ALL `readFileSync` must be in try/catch (TOCTOU race)           | CRITICAL |
| Symlink write guard             | Check symlink on target AND all parent directories before write | CRITICAL |
| Atomic write tmp guard          | Guard both target AND `.tmp` path against symlinks              | CRITICAL |
| Symlink escape via realpathSync | `realpathSync()` after `resolve()` to verify real path          | CRITICAL |
| Log target type validation      | `fstatSync(fd).isFile()` before writing to log files            | CRITICAL |

**Shell/Process**

| Item                       | Rule                                                     | Priority  |
| -------------------------- | -------------------------------------------------------- | --------- |
| printf over echo           | `printf '%s' "$VAR"` not `echo "$VAR"` (-n/-e injection) | CRITICAL  |
| exec() loops need /g flag  | Global flag REQUIRED in while loops                      | CRITICAL  |
| Exit code capture          | `if ! OUT=$(cmd)` not `cmd; if [ $? -ne 0 ]`             | IMPORTANT |
| File iteration with spaces | `while IFS= read -r file` not `for file in $list`        | IMPORTANT |
| Subshell scope             | Use temp file or process substitution, not pipe          | IMPORTANT |
| Temp file cleanup          | `trap 'rm -f "$TMPFILE"' EXIT`                           | IMPORTANT |
| set -o pipefail            | Add before pipes in validation scripts                   | IMPORTANT |
| Shell redirection order    | `> file 2>&1` not `2>&1 > file`                          | IMPORTANT |
| EXIT trap chaining         | Use helper not multiple `trap ... EXIT` overwrites       | IMPORTANT |
| POSIX shell compliance     | No bash-isms in scripts that run under `/bin/sh`         | IMPORTANT |

**Regex / Parsing**

| Item                      | Rule                                          | Priority  |
| ------------------------- | --------------------------------------------- | --------- |
| Regex anchoring for enums | `^E[0-3]$` not `E[0-3]`                       | IMPORTANT |
| Regex operator precedence | Use `^(a\|b\|c)$` not `^a\|b\|c$`             | IMPORTANT |
| Non-greedy JSON extract   | `[\s\S]*?` not `[\s\S]*`                      | IMPORTANT |
| Regex two-strikes         | If flagged twice, replace with string parsing | CRITICAL  |
| CRLF in regex             | `\r?\n` not `\n` for cross-platform           | IMPORTANT |
| Binary file detection     | Skip files with NUL bytes                     | IMPORTANT |

**Data Safety**

| Item                          | Rule                                                      | Priority  |
| ----------------------------- | --------------------------------------------------------- | --------- |
| JSONL parse resilience        | try/catch per line, continue on error                     | IMPORTANT |
| Silent parse prevention       | Warn on unparseable lines, don't silently filter          | IMPORTANT |
| Silent catch prevention       | Always add warning/comment in catch blocks                | IMPORTANT |
| Fail-fast validation          | Abort on parse errors to prevent silent data loss         | IMPORTANT |
| Entity escaping order         | Escape `&` FIRST, then `<`, `>`, quotes                   | IMPORTANT |
| Fail-closed validation        | Security functions return `false` on error, never throw   | IMPORTANT |
| Fail-closed catch             | Only allow ENOENT/ENOTDIR through catch; all others fatal | CRITICAL  |
| Null vs falsy in metrics      | `== null` not `!value` when 0 is a valid value            | IMPORTANT |
| Self-referential set guard    | Exclusion sets never built from the data being filtered   | IMPORTANT |
| Number.isFinite guards        | Guard numeric inputs before math operations               | IMPORTANT |
| Safe percentage helper        | Division-by-zero guard before percentage calculations     | IMPORTANT |
| Array.isArray guards          | Check before array operations on external data            | IMPORTANT |
| UTC date arithmetic           | `setUTCDate()` not `setDate()` for timezone safety        | IMPORTANT |
| Atomic file write cleanup     | `rmSync(tmpPath)` in catch after failed atomic write      | IMPORTANT |
| Multi-file rollback           | If second write fails, undo first                         | IMPORTANT |
| Module-scope config try/catch | Wrap module-level load calls                              | IMPORTANT |
| Trailing newline JSONL        | End JSONL files with `\n`                                 | IMPORTANT |
| Content normalization         | Normalize CRLF before comparing file content              | IMPORTANT |

**Process Management**

| Item                          | Rule                                                     | Priority  |
| ----------------------------- | -------------------------------------------------------- | --------- |
| Process identity verification | Allowlist + name + command line match before termination | CRITICAL  |
| Graceful before forced        | SIGTERM before SIGKILL                                   | IMPORTANT |
| Security event audit trails   | Log termination attempts with timestamp/PID/decision     | IMPORTANT |
| execSync limits               | Add `{ timeout: 30000, maxBuffer: 10MB }`                | IMPORTANT |

**CI / Automation**

| Item                     | Rule                                                    | Priority  |
| ------------------------ | ------------------------------------------------------- | --------- |
| CI installs use lockfile | `npm ci` (or equivalent) not `npm install`              | IMPORTANT |
| Atomic file writes in CI | Write to `.tmp` then rename                             | CRITICAL  |
| Per-item error handling  | try/catch around individual job items                   | IMPORTANT |
| JSON output isolation    | Guard `console.error` when JSON mode active             | IMPORTANT |
| Stable ID preservation   | Never reassign IDs once allocated                       | IMPORTANT |
| API pagination           | Always check for pagination; fetch all pages            | IMPORTANT |
| Glob self-inclusion      | Explicit file lists, not globs that include output file | IMPORTANT |
| Delimiter consistency    | Use `\x1f` (Unit Separator) not `\|` for git log format | IMPORTANT |
| Empty entries guard      | Check `entries.length === 0` before writing output      | IMPORTANT |

**Behavioral / Process**

| Item                        | Rule                                             | Priority  |
| --------------------------- | ------------------------------------------------ | --------- |
| Read before edit            | Must read file before modifying                  | CRITICAL  |
| Understand before changing  | Understand existing purpose before altering      | IMPORTANT |
| Tests pass before commit    | Run relevant tests first                         | IMPORTANT |
| No regressions              | Existing tests must pass                         | IMPORTANT |
| Shared utility caller audit | After modifying shared utility, grep ALL callers | IMPORTANT |

---

#### LANGUAGE-SPECIFIC — Universal within JS/TS/Node.js

| Item                                              | Scope Reason                       |
| ------------------------------------------------- | ---------------------------------- |
| `global` `/g` flag on regex exec() in while loops | JS regex state mechanism           |
| `path.relative()` cross-platform path safety      | Node.js `path` module              |
| `lstatSync` for symlinks (vs `statSync`)          | Node.js fs API                     |
| `Number.parseInt(str, 10)` explicit radix         | JS parseInt default-base ambiguity |
| `??` over `\|\|` for 0/"" valid values            | JS nullish coalescing operator     |
| `typeof window !== 'undefined'` SSR guard         | JS/Next.js SSR context             |
| `globalThis.window` over `window`                 | JS universal globals               |
| `process.exitCode` not `process.exit()`           | Node.js buffer flush               |
| CRLF line normalization (`\r\n` → `\n`)           | JS string processing on Windows    |
| `node:fs`, `node:path` module prefixes            | Node.js SonarQube S6803            |
| Error cause preservation `{ cause: err }`         | JS ES2022 Error API                |
| `Math.max(...arr)` call stack limit               | JS spread operator limits          |
| Nullish coalescing for 0/"" valid                 | JS falsy vs nullish                |
| Set iteration order non-deterministic             | JS Set specification               |
| `Array.from(set)` + sort for determinism          | JS Set/Array interop               |
| `Number.isInteger(n) && n > 0` for PIDs           | JS parseInt/NaN edge cases         |
| execFileSync args array over template strings     | Node.js child_process API          |

---

#### PROJECT-SPECIFIC — Only applies to sonash

| Item                                        | Why It's Project-Specific                      |
| ------------------------------------------- | ---------------------------------------------- |
| Test mocking httpsCallable not Firestore    | Firebase Cloud Functions architecture          |
| Firebase App Check enforcement              | Firebase-specific security layer               |
| Firebase `defineString()` not `process.env` | Firebase Cloud Functions env system            |
| `getIdTokenResult(true)` force refresh      | Firebase auth token mechanism                  |
| Firestore batch chunking (500 limit)        | Firestore-specific write limit                 |
| Firestore Timestamp `.toDate()` safety      | Firebase Firestore Timestamp type              |
| `migrateAnonymousUserData` merges           | Sonash-specific anonymous auth pattern         |
| Google OAuth COOP/COEP headers              | Sonash Firebase hosting config                 |
| `sanitize-error.js` specific helper path    | Sonash `scripts/lib/` path                     |
| `security-helpers.js` helper functions      | Sonash `scripts/lib/` path                     |
| `sonash/no-*` ESLint rule names             | Sonash custom ESLint plugin                    |
| `TDMS DEBT entry consistency`               | Sonash tech-debt pipeline schema               |
| `SKIP_REASON` validation chain              | Sonash hook automation contract                |
| `.claude/commands/*.md` YAML frontmatter    | Sonash Claude skills system                    |
| `npm run patterns:check` command            | Sonash custom script                           |
| `SonarCloud` Sonar rules references         | Sonash CI configuration                        |
| Suppressing internal tooling security noise | Sonash pattern-check false positive management |
| Dev dashboard Firestore `write: if false`   | Sonash-specific dev tooling                    |
| TDMS OWASP field format                     | Sonash TDMS pipeline schema                    |
| CANON ID normalization                      | Sonash security audit canon files              |

---

### 3. Universal quality rubric — analysis dimensions for external repos [CONFIDENCE: HIGH]

The universal items cluster into 8 analysis dimensions. Each dimension has a
clear "what to look for" question and a set of specific checks drawn directly
from the classified patterns above.

---

#### Dimension A: Input Validation and Injection Prevention

**Question:** Does the codebase validate untrusted inputs before they reach
sensitive operations?

Checks:

- Path traversal: uses regex test not `startsWith('..')` for containment
- CLI args: validates existence, non-empty, not-a-flag before use
- Process execution: uses args arrays not template string interpolation
- Shell: sanitizes inputs before any exec/spawn call
- Path containment applied at all touch points, not just entry point
- Paths normalized to POSIX before string comparisons
- Resolved (canonical) path stored after validation, not raw input

---

#### Dimension B: Error Handling and Information Leakage

**Question:** Does the codebase prevent sensitive information from reaching logs
or user-facing output?

Checks:

- Error messages sanitized before logging (no raw `error.message`)
- No absolute paths in log output (use `path.relative()`)
- No raw input content in error logs (log line numbers/char counts instead)
- Generic user-facing error messages; internal codes logged separately
- PII (emails, usernames) masked in logs
- Unicode line separators included in sanitization patterns
- After sanitized log, `process.exit(1)` not `throw err` (prevents stack trace)

---

#### Dimension C: File System Security

**Question:** Does the codebase handle file operations safely against race
conditions and symlink attacks?

Checks:

- All file reads wrapped in try/catch (TOCTOU race prevention)
- Symlink check on target AND parent directories before write
- Both target AND `.tmp` path guarded for symlinks
- `realpathSync()` used to verify canonical path
- Exclusive file creation flag (`wx`) and restrictive permissions (`0o600`)
- Atomic writes via tmp file + rename
- Cross-device rename handled with copy+delete fallback
- Same-path rename guard (would delete only copy)
- Multi-file operations roll back on partial failure

---

#### Dimension D: Regex Safety

**Question:** Does the codebase use regexes safely?

Checks:

- `/g` flag present on regexes used in `while` + `exec()` loops
- `lastIndex` reset before each use of stateful regex
- Length limits (`{1,N}`) not unbounded `+` for user-controlled input
- Anchored patterns for enum/type validation (`^value$`)
- Alternation operator precedence explicit: `^(a|b|c)$` not `^a|b|c$`
- Non-greedy matching where greedy can backtrack on malformed input
- When flagged twice by static analysis, replaced with string parsing

---

#### Dimension E: Data Integrity and Parsing Resilience

**Question:** Does the codebase handle malformed or unexpected data without
silently losing it?

Checks:

- Per-line try/catch in JSONL/stream parsing
- Warnings logged on parse failures (not silent `.filter(Boolean)`)
- Empty collection guard before writing output files
- Null vs falsy distinction when 0/"" are valid values
- Fail-fast on parse errors; no silent data loss
- UTC date arithmetic for timezone safety
- Exclusion sets built from independent source (not data being filtered)
- Module-level config loads wrapped in try/catch

---

#### Dimension F: Atomic Operations and State Consistency

**Question:** Does the codebase protect critical writes against interruption?

Checks:

- Atomic writes via `.tmp` + `fs.renameSync()` pattern
- Backup-swap pattern for destructive updates (dest→.bak, tmp→dest)
- Tmp file cleanup in catch block after failed atomic write
- Stable IDs never reassigned once allocated
- Multi-write operations roll back on failure
- Files end with trailing newline for JSONL append safety

---

#### Dimension G: Process and Command Execution Safety

**Question:** Does the codebase execute subprocesses safely?

Checks:

- execFileSync with args array not shell-interpolated strings
- `--` separator before file args in shell commands
- Shell arguments always quoted
- execSync calls have explicit timeout and maxBuffer limits
- Process identity verified before termination operations
- Graceful shutdown before forced kill

---

#### Dimension H: Behavioral / Code Quality

**Question:** Does the codebase reflect disciplined development practices?

Checks:

- Functions have cognitive complexity <= 15 (enforceable)
- Options object pattern when extracting functions with 7+ params
- Pre-commit tests run; regressions caught before merge
- Silent catch blocks absent (always log or comment why)
- Shared utilities audited across all callers after modification
- `null` vs `""` for optional fields consistent in schemas (machine parsing)

---

## Sources

| #   | File                                          | Type                        | Trust | Date       |
| --- | --------------------------------------------- | --------------------------- | ----- | ---------- |
| 1   | `docs/agent_docs/CODE_PATTERNS.md`            | Project docs (ground truth) | HIGH  | 2026-02-26 |
| 2   | `docs/agent_docs/SECURITY_CHECKLIST.md`       | Project docs (ground truth) | HIGH  | 2026-03-12 |
| 3   | `docs/agent_docs/PRE_GENERATION_CHECKLIST.md` | Project docs (ground truth) | HIGH  | 2026-03-14 |

All sources are filesystem ground truth — read directly via Read tool.

---

## Contradictions

None. The three documents are consistent and cross-referencing.
SECURITY_CHECKLIST.md explicitly refers to CODE_PATTERNS.md pattern numbers
(e.g., "#32", "#36") and the same rules appear in both. No conflicting guidance
found.

---

## Gaps

- CODE_PATTERNS.md extends beyond line 657 but coverage is comprehensive for
  classification purposes. The React/Frontend section (lines 642+) was partially
  read; those patterns are nearly all LANGUAGE-SPECIFIC or PROJECT-SPECIFIC.
- The "Security Audit Canonical Findings" section is entirely PROJECT-SPECIFIC
  (TDMS/CANON schema fields) and was not classified further.
- SECURITY_CHECKLIST.md was read to line 299; remaining content covers External
  Requests and Regex sections which follow the same patterns already classified.
- The behavioral items in PRE_GENERATION_CHECKLIST.md are process patterns, not
  code patterns — they are UNIVERSAL in principle but cannot be checked via
  static analysis on an external repo.

---

## Serendipity

**The "two-strikes" rule is a meta-pattern.** The "regex two-strikes" item (if
SonarCloud flags a regex twice, replace with string parsing) is not about regex
at all — it is a general principle: when a static analysis tool flags the same
class of construct twice, the fix is to eliminate the construct entirely rather
than incrementally patch it. This could generalize as a dimension: "does the
codebase have recurring SCA findings in the same category?"

**Dimension H (behavioral) is the hardest to automate.** The
PRE_GENERATION_CHECKLIST.md patterns (read-before-edit,
understand-before-changing) are enforced by the Edit tool rejecting blind edits.
For external repos there is no equivalent enforcement mechanism — these items
can only be observed via PR review history and commit patterns (e.g., large
edits with minimal context reads).

---

## Confidence Assessment

- HIGH claims: 3
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All claims derive from direct filesystem reads of the source files. No inference
or external source required.
