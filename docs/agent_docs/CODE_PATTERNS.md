# Code Review Patterns Reference

**Document Version:** 3.6 **Source:** Distilled from 347 AI code reviews **Last
Updated:** 2026-02-26

---

## Purpose

This document contains detailed code patterns and anti-patterns learned from AI
code reviews. These patterns are **enforced by `npm run patterns:check`** - this
file serves as a reference when investigating violations or understanding why a
pattern exists.

**Quick Reference**: See [claude.md](../../claude.md) Section 4 for the 5
critical patterns that apply to every session.

## Quick Start

1. Check patterns before writing code: `npm run patterns:check`
2. Reference this doc when investigating pattern violations
3. See claude.md Section 4 for quick summary

---

## Priority Tiers

| Priority | Meaning   | Criteria                                            |
| -------- | --------- | --------------------------------------------------- |
| 🔴       | Critical  | Security vulnerabilities, data loss, infinite loops |
| 🟡       | Important | Bugs, reliability issues, maintainability           |
| ⚪       | Edge case | Niche scenarios, nice-to-have                       |

---

## 🔴 Critical Patterns Quick Reference

These 5 patterns cause the most severe issues. Master them first.

### 1. Error Sanitization

**Rule:** Use `scripts/lib/sanitize-error.js` - never log raw error.message

```javascript
// ✅ CORRECT - from scripts/lib/sanitize-error.js
const SENSITIVE_PATTERNS = [
  /\/home\/[^/\s]+/gi, // Linux home directories
  /C:\\Users\\[^\\]+/gi, // Windows user directories
  // ... more patterns
];

export function sanitizeError(error, options = {}) {
  let message = error instanceof Error ? error.message : String(error);

  for (const pattern of SENSITIVE_PATTERNS) {
    pattern.lastIndex = 0; // Reset stateful regex
    message = message.replace(pattern, "[REDACTED]");
  }
  return message;
}

// ❌ WRONG
console.error(error.message); // May contain paths, secrets
```

### 2. Path Traversal Check

**Rule:** `/^\.\.(?:[\\/]|$)/.test(rel)` NOT `startsWith('..')`

```javascript
// ✅ CORRECT - from scripts/phase-complete-check.js:56
const rel = path.relative(projectRoot, resolvedPath);
if (rel === "" || /^\.\.(?:[/\\]|$)/.test(rel) || path.isAbsolute(rel)) {
  return { valid: false, reason: "Outside project root" };
}

// ❌ WRONG - false positive on files starting with ".."
if (rel.startsWith("..")) {
  reject();
}
```

### 3. File Reads with try/catch

**Rule:** Wrap ALL file reads in try/catch - existsSync has race conditions

```javascript
// ✅ CORRECT - handle errors by checking error.code (avoids TOCTOU race)
function safeReadFile(filePath, description) {
  try {
    const content = readFileSync(filePath, "utf-8");
    return { success: true, content };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { success: false, error: `${description} not found` };
    }
    return { success: false, error: `Failed to read: ${sanitizeError(error)}` };
  }
}

// ❌ WRONG - existsSync has TOCTOU race condition
if (existsSync(path)) {
  const content = readFileSync(path); // File may be deleted between check and read!
}
```

### 4. exec() Loops with /g Flag

**Rule:** Global flag `/g` REQUIRED when using exec() in while loops

```javascript
// ✅ CORRECT - from scripts/check-pattern-compliance.js:606-610
antiPattern.pattern.lastIndex = 0; // Reset before loop

let match;
while ((match = antiPattern.pattern.exec(content)) !== null) {
  // Process match - /g flag advances lastIndex each iteration
}

// ❌ WRONG - without /g, lastIndex never advances = infinite loop
const pattern = /foo/; // Missing 'g' flag!
while ((match = pattern.exec(str)) !== null) {
  /* infinite! */
}
```

### 5. Test Mocking (httpsCallable, not Firestore)

**Rule:** Mock `httpsCallable`, NOT direct Firestore writes

```javascript
// ✅ CORRECT - Mock the callable function wrapper
vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn(() => vi.fn().mockResolvedValue({ data: {} })),
}));

// ❌ WRONG - Direct Firestore mocking bypasses Cloud Function security
vi.mock("firebase/firestore"); // Bypasses App Check, rate limits, validation
```

---

## Pattern Categories

- [Bash/Shell](#bashshell)
- [npm/Dependencies](#npmdependencies)
- [Security](#security)
- [GitHub Actions](#github-actions)
- [JavaScript/TypeScript](#javascripttypescript)
- [CI/Automation](#ciautomation)
- [Git](#git)
- [Process Management](#process-management)
- [Documentation](#documentation)
- [Security Audit (Canonical Findings)](#security-audit-canonical-findings)
- [React/Frontend](#reactfrontend)
- [General](#general)

---

## Bash/Shell

| Priority | Pattern                          | Rule                                                                                    | Why                                                    |
| -------- | -------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| 🟡       | Exit code capture                | `if ! OUT=$(cmd); then` NOT `OUT=$(cmd); if [ $? -ne 0 ]`                               | Captures assignment exit, not command                  |
| ⚪       | HEAD~N commits                   | Use `COMMIT_COUNT - 1` as max                                                           | HEAD~N needs N+1 commits                               |
| 🟡       | File iteration                   | `while IFS= read -r file` NOT `for file in $list`                                       | Spaces break for loop                                  |
| 🟡       | Subshell scope                   | Use temp file or `while read; done < <(cmd)`                                            | <code>cmd &#124; while read</code> loses variables     |
| 🟡       | Temp file cleanup                | `trap 'rm -f "$TMPFILE"' EXIT`                                                          | Guaranteed cleanup                                     |
| ⚪       | Exit code semantics              | 0=success, 1=action-needed, 2=error                                                     | Check explicitly                                       |
| 🟡       | Retry loops                      | `for i in 1 2 3; do cmd && break; sleep 5; done`                                        | Race condition handling                                |
| 🔴       | printf over echo                 | `printf '%s' "$VAR"` NOT `echo "$VAR"`                                                  | -n/-e injection risk                                   |
| 🟡       | End-of-options                   | `basename -- "$PATH"`                                                                   | Prevents `-` as options                                |
| ⚪       | Portable word boundaries         | `(^[^[:alnum:]])(word)([^[:alnum:]]$)` NOT `\b`                                         | Not portable ERE                                       |
| 🟡       | Pipeline failure                 | Add <code>&#124;&#124; VAR=""</code> fallback                                           | Commands may fail with pipefail                        |
| 🟡       | Terminal sanitization            | `tr -cd '[:alnum:] ,_-'`                                                                | Strip ANSI escapes                                     |
| ⚪       | grep --exclude                   | `--exclude="storage.ts"` NOT `--exclude="lib/utils/storage.ts"`                         | Matches basename only                                  |
| 🟡       | Process substitution (Bash-only) | `while IFS= read -r line; do ...; done < <(cmd)` NOT <code>cmd &#124; while read</code> | Preserves exit codes + safe reads                      |
| ⚪       | Bash wrapper for scripts         | Wrap bash-specific code in `bash -lc '...'` with quote escaping                         | Avoids breaking POSIX sh                               |
| 🟡       | set -o pipefail (Bash/Zsh/Ksh)   | Add before pipes in bash-based validation scripts                                       | Catch pipe failures                                    |
| 🟡       | Shell redirection order          | `> file 2>&1` (correct) NOT `2>&1 > file` (stderr goes to terminal)                     | Redirections are processed left-to-right (Review #225) |
| 🟡       | Here-string interpolation        | Use `<<<` with proper quoting: `cmd <<< "$VAR"` not `echo "$VAR"                        | cmd`                                                   | Avoids subshell + preserves exit codes (Review #265) |
| 🟡       | POSIX shell compliance           | No `$'\r'`, `grep -P`, `[[` in `.husky/` scripts; use `printf` variables and `grep -E`  | Hooks run under `/bin/sh` not bash (Review #330)       |
| 🟡       | EXIT trap chaining               | Use `add_exit_trap` helper NOT multiple `trap ... EXIT` overwrites                      | Second trap overwrites first cleanup (Review #327)     |

---

## npm/Dependencies

| Priority | Pattern             | Rule                                                 | Why                           |
| -------- | ------------------- | ---------------------------------------------------- | ----------------------------- |
| 🟡       | CI installs         | `npm ci` NOT `npm install`                           | Prevents lockfile drift       |
| ⚪       | Adding packages     | Ask "does project actually use X?"                   | Avoid unnecessary deps        |
| 🟡       | Peer deps           | Must be in lockfile                                  | `npm ci` fails in Cloud Build |
| 🟡       | Husky CI            | <code>husky &#124;&#124; echo 'not available'</code> | Graceful degradation          |
| 🟡       | Lockfile corruption | `rm package-lock.json && npm install && npm ci`      | Regenerate and verify         |

---

## Security

| Priority | Pattern                      | Rule                                                                                                         | Why                                                                                                    |
| -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------ |
| 🔴       | File path validation         | Validate within repo root before operations                                                                  | Prevent traversal                                                                                      |
| 🔴       | Path traversal check         | <code>/^\.\.(?:[\\/]&#124;$)/.test(rel)</code> NOT `startsWith('..')`                                        | Avoids false positives                                                                                 |
| 🔴       | Reject traversal             | `if [[ "$PATH" == *"../"* ]]; then exit; fi`                                                                 | Don't strip `../`                                                                                      |
| 🔴       | Containment                  | Apply path validation at ALL touch points                                                                    | Not just entry point                                                                                   |
| 🔴       | CLI arg validation           | Check existence, non-empty, not another flag at parse                                                        | <code>if (!arg &#124;&#124; arg.startsWith('--')) { reject; }</code>                                   |
| 🟡       | Empty path edge case         | Check `rel === ''`                                                                                           | Resolving `.` gives empty relative                                                                     |
| 🟡       | Windows cross-drive          | Check drive letters match                                                                                    | Before path.relative() checks                                                                          |
| 🔴       | Shell interpolation          | Sanitize inputs                                                                                              | Command injection risk                                                                                 |
| 🔴       | External input               | Never trust in execSync/spawn                                                                                | Command injection                                                                                      |
| 🔴       | Markdown output              | Escape backticks, `${{ }}`                                                                                   | Injection risk                                                                                         |
| 🟡       | Word boundary keywords       | <code>(^[^[:alnum:]])(auth&#124;token&#124;...)([^[:alnum:]]$)</code>                                        | "monkey" shouldn't match "key"                                                                         |
| 🟡       | Bound output                 | Limit count (e.g., `jq '.[0:50]'`) and length (`${VAR:0:500}`)                                               | Prevent DoS                                                                                            |
| 🔴       | Hook output                  | Only output safe metadata                                                                                    | Never expose secrets                                                                                   |
| 🔴       | .env files                   | Never recommend committing                                                                                   | Use environment vars                                                                                   |
| 🔴       | Symlink write guard          | Use `isSafeToWrite(path)` from `lib/symlink-guard.js` before ALL writes                                      | Checks file + ancestor dirs for symlinks (Review #316-323)                                             |
| 🔴       | guardSymlink pattern         | Use `guardSymlink(path)` or `refuseSymlinkWithParents(path)` as recognized guards                            | Both are valid symlink guard functions (PR #369 R7-R9)                                                 |
| 🔴       | Atomic write tmp guard       | Guard BOTH target AND `.tmp` path: `isSafeToWrite(file) && isSafeToWrite(tmpFile)`                           | Tmp path is also a symlink attack vector (Review #322-323)                                             |
| 🔴       | Symlink escape               | `realpathSync()` after resolve()                                                                             | Verify real path in project                                                                            |
| 🔴       | Fail-closed realpath         | If realpathSync fails but file exists, reject                                                                | `catch { if (existsSync(path)) return false; }`                                                        |
| 🔴       | Fail-closed catch            | Only allow ENOENT/ENOTDIR through catch; all other errors are fatal                                          | Generic `catch {}` silently swallows EPERM/EIO (FIX_TEMPLATES #28)                                     |
| 🔴       | Validate-then-store path     | After `validatePathInDir()` or `path.resolve()`, store resolved form, not raw input                          | TOCTOU: validating one form, storing another (FIX_TEMPLATES #29)                                       |
| 🔴       | PII masking                  | `maskEmail()` → `u***@d***.com`                                                                              | Privacy in logs                                                                                        |
| 🟡       | Audit logging                | JSON with timestamp, operator, action, target, result                                                        | Structured logs                                                                                        |
| 🔴       | Regex state leak             | Reset lastIndex before each iteration with /g + .exec()                                                      | Stateful lastIndex skips matches                                                                       |
| 🔴       | ReDoS user patterns          | Add heuristic detection (nested quantifiers, length limits)                                                  | User regex can have catastrophic backtracking                                                          |
| 🔴       | Path containment check       | After resolve(), verify result stays within root                                                             | resolve() doesn't guarantee containment                                                                |
| 🟡       | JSONL parse resilience       | try/catch per line, continue with valid entries                                                              | Single bad line shouldn't crash script                                                                 |
| 🔴       | Prototype pollution          | Use `new Map()` or `Object.create(null)` for untrusted keys                                                  | `__proto__` can pollute Object.prototype                                                               |
| 🔴       | Secure error logging         | Never log raw input content; log line numbers and char counts                                                | Input may contain secrets or PII                                                                       |
| 🟡       | Fail-fast validation         | Abort on parse errors to prevent silent data loss                                                            | Malformed data shouldn't be silently dropped                                                           |
| 🟡       | Entity escaping order        | Escape `&` FIRST, then `<`, `>`, quotes                                                                      | `&lt;` becomes `&amp;lt;` if ampersand escaped last                                                    |
| 🔴       | SSRF allowlist               | Explicit hostname allowlist + protocol enforcement (HTTPS only)                                              | Environment variables alone insufficient                                                               |
| 🟡       | External request timeout     | Use `AbortController` with explicit timeout on all fetch/HTTP calls                                          | Network calls can hang indefinitely                                                                    |
| 🟡       | IPv6-safe IP parsing         | Only strip port from IPv4 (contains `.`); preserve full IPv6                                                 | Splitting by `:` breaks IPv6 addresses                                                                 |
| 🔴       | Third-party PII hygiene      | Set `captureToSentry: false` for logs containing IP/PII                                                      | Internal logs flow to third parties                                                                    |
| 🔴       | Defense-in-depth bypass      | Multi-condition: <code>bypass = flagSet && (isEmulator &#124;&#124; !isProd)</code>                          | Single env var shouldn't disable prod security                                                         |
| 🔴       | Production fail-closed       | Security features (reCAPTCHA) fail-closed in production                                                      | Degraded security should fail, not bypass                                                              |
| 🟡       | Firestore batch chunking     | Chunk batch operations under 500-op limit                                                                    | Firestore batch write limit                                                                            |
| 🟡       | Sensitive file filtering     | Filter sensitive paths before passing to external tools                                                      | Don't expose secrets to code review tools                                                              |
| 🔴       | URL protocol allowlist       | Validate external URLs against explicit protocol+host allowlist                                              | Prevents javascript:/data: injection from APIs                                                         |
| 🔴       | Regex length limits          | Use `{1,64}` not `+` for bounded user input                                                                  | Prevents ReDoS catastrophic backtracking                                                               |
| 🟡       | Email regex RFC 5321         | `{1,64}@{1,253}\.[A-Z]{2,63}` with all three bounds                                                          | Local max 64, domain max 253, TLD max 63                                                               |
| 🟡       | Large input guards           | Reject inputs exceeding size threshold before processing                                                     | Prevents DoS/UI freeze on crafted payloads                                                             |
| 🟡       | Sanitizer whitespace         | `input?.trim()` before empty check; trim before processing                                                   | Whitespace-only strings can bypass validation                                                          |
| ⚪       | Nullable utility types       | Accept <code>string &#124; null &#124; undefined</code> for optional data handlers                           | Explicit API contract for edge cases                                                                   |
| 🟡       | Firebase defineString        | Use `defineString()` not `process.env` in Cloud Functions                                                    | process.env doesn't work in deployed functions                                                         |
| ⚪       | Prettier-linter conflict     | Use `// prettier-ignore` when formatters conflict with linters                                               | Prevents CI ping-pong between tools                                                                    |
| 🟡       | Force token refresh          | `getIdTokenResult(true)` when checking fresh admin claims                                                    | Cached tokens miss recent claim changes                                                                |
| 🟡       | Dev data client-only         | Dev dashboards: Firestore rules `write: if false` for clients                                                | Writes should only come from Admin SDK/CI                                                              |
| 🟡       | isPlainObject guard          | Check `Object.getPrototypeOf(obj) === Object.prototype`                                                      | Prevents corrupting Date/Timestamp in redaction                                                        |
| 🔴       | O(n²) algorithm DoS          | Truncate inputs to MAX_LENGTH before O(n²) ops (Levenshtein)                                                 | Quadratic complexity exploitable at scale                                                              |
| 🔴       | npx --no-install             | Use `npx --no-install pkg` to prevent remote code fetch                                                      | Supply chain security in git hooks                                                                     |
| 🟡       | Self-scanner exclusion       | Security scanners exclude their own source from pattern matching                                             | Prevents false positives on pattern examples                                                           |
| 🔴       | Unicode line separators      | Include `\u2028\u2029` in log sanitization regex, not just `\n\r`                                            | Unicode line separators bypass ASCII-only filters (Review #200)                                        |
| 🔴       | Input length DoS             | Cap projectDir and filePath at 4096 chars before processing                                                  | Prevents memory exhaustion from extremely long paths (Review #200)                                     |
| 🔴       | Segment-based path check     | Use `path.relative().split(path.sep)[0] === ".."` not string prefix matching                                 | More robust than startsWith for path containment (Review #200)                                         |
| 🔴       | Git option injection         | Strip leading dashes `.replace(/^-+/, "")` + use `["add", "--", path]`                                       | Filenames starting with `-` become git options (Review #201)                                           |
| 🔴       | Temp file wx flag            | Use `{ flag: "wx", mode: 0o600 }` for exclusive creation + restrictive permissions                           | Prevents TOCTOU symlink attacks on temp files (Review #201)                                            |
| 🔴       | Markdown injection           | Apply `sanitizeDisplayString()` to all fields in generated Markdown                                          | Generated docs are injection vectors (Review #201)                                                     |
| 🔴       | git add -A prohibition       | Never use `git add -A` in automation - always use explicit paths                                             | Can stage .env, credentials accidentally (Review #201)                                                 |
| 🔴       | Git pathspec magic           | Reject paths starting with `:` before git operations                                                         | `--` terminator doesn't prevent pathspec magic (Review #201)                                           |
| 🔴       | Symlink parent traversal     | Walk up directory tree checking each segment for symlinks                                                    | Bypass via symlinked parent directory (Review #201)                                                    |
| 🔴       | Template literal regex       | Include backticks in quote patterns: `["'\`]`                                                                | Regex only matching quotes misses template literals (Review #194)                                      |
| 🟡       | Binary file detection        | Skip files containing NUL bytes: `if (content.includes("\0"))`                                               | NUL byte detection is simplest binary filter (Review #200)                                             |
| 🟡       | Relative path logging        | Use `path.relative(ROOT, targetPath)` before logging paths                                                   | Absolute paths in logs expose filesystem structure (Review #201)                                       |
| 🟡       | Markdown char escaping       | Create `escapeMd()` that escapes `[]\()_*\`#>!-` characters                                                  | Generated Markdown needs both sanitization AND escaping (Review #201)                                  |
| 🟡       | Empty filename fallback      | Add fallback like `safeName                                                                                  |                                                                                                        | "UNNAMED_PATTERN"` after sanitization | Sanitization can produce empty filenames (Review #201) |
| 🟡       | Atomic file writes           | Use temp file + rename for security-critical writes                                                          | Prevents race conditions on permissions (Review #191)                                                  |
| 🟡       | Hidden passphrase input      | Use `process.stdin.setRawMode(true)` for password entry                                                      | readline.question() echoes input (Review #191)                                                         |
| 🟡       | Secure file permissions      | `fs.chmodSync(path, 0o600)` after writing secrets files                                                      | Prevent other users from reading (Review #191)                                                         |
| 🟡       | Buffer length validation     | Check minimum length before slicing crypto buffers                                                           | Prevents confusing errors on corrupt files (Review #191)                                               |
| 🟡       | Placeholder detection        | Check for patterns like "your\_", "\_here", "example", "xxx"                                                 | Detect unfilled templates before use (Review #191)                                                     |
| 🟡       | Confidence cap negatives     | Cap audit confidence at MEDIUM for existence/absence assertions                                              | Absence of evidence ≠ evidence of absence (Review #205)                                                |
| 🟡       | Verify existence claims      | Include actual `ls`/`cat` output when claiming files exist/don't exist                                       | AI audits can have false positives without evidence (Review #205)                                      |
| 🔴       | Subshell variable leak       | Use temp file + `while read` instead of pipe for counting in subshell                                        | Pipe subshells can't modify parent shell variables (Review #204)                                       |
| 🟡       | UTC date arithmetic          | Use `setUTCDate(getUTCDate()+1)` not `setDate(getDate()+1)` for timezone safety                              | Local date arithmetic shifts across DST boundaries (Review #204)                                       |
| 🟡       | CRLF regex compatibility     | Use `\r?\n` not `\n` for cross-platform line splitting                                                       | Windows files have CRLF line endings (Review #211)                                                     |
| 🔴       | Atomic state writes          | Write to tmp file + `fs.renameSync()` for state files                                                        | Prevents partial writes on crash/interrupt (Review #210)                                               |
| 🟡       | Detached HEAD handling       | Check `git symbolic-ref HEAD` before assuming branch name exists                                             | CI may run in detached HEAD state (Review #209)                                                        |
| 🟡       | Session identity check       | Validate sessionId matches expected format before state operations                                           | Prevents cross-session state pollution (Review #209)                                                   |
| 🟡       | execSync limits              | Add `{ timeout: 30000, maxBuffer: 10*1024*1024 }` to all execSync calls                                      | Prevents hanging/OOM on runaway processes (Review #209)                                                |
| 🟡       | PII in audit reports         | Strip emails/usernames from generated reports; use hashed identifiers                                        | Audit reports are shared artifacts — PII leaks via git (Review #260)                                   |
| 🟡       | Operator identity hashing    | Use `crypto.createHash('sha256').update(name).digest('hex').slice(0,8)` for operator                         | Audit trail without exposing names in repo (Review #260)                                               |
| 🔴       | Backup-swap atomic write     | dest→.bak, tmp→dest, rm .bak; restore .bak if tmp rename fails                                               | rm+rename has crash window where both files lost (Review #265)                                         |
| 🟡       | Token exposure prevention    | Filter `Authorization`, `Bearer`, `token` fields from hook/agent output                                      | Hook output flows to logs visible to all session users (Review #261)                                   |
| 🟡       | SKIP_REASON validation chain | Use shared `validateSkipReason()`: type, trim, empty, newlines, control chars, length                        | Prevents log injection + DoS (PR #367 retro)                                                           |
| 🔴       | realpathSync lifecycle       | Guard functions must handle: existing path, non-existent file, non-existent parent, fresh checkout, symlinks | realpathSync throws on non-existent paths; mkdirSync before guard (FIX_TEMPLATES #31, PR #374 R2-R5)   |
| 🔴       | Path containment direction   | Decide upfront: descendant-only vs bidirectional; document with `@containment` tag                           | Flip-flopping between ancestor/descendant checks causes multi-round churn (FIX_TEMPLATES #33, PR #374) |
| 🔴       | Safety flag hoist            | Hoist `isSafeToWrite()` result to function scope; check in BOTH try and catch paths                          | Catch-block fallback bypasses guard when flag is try-scoped (FIX_TEMPLATES #32, PR #374 R1)            |
| 🟡       | Shared utility caller audit  | After modifying shared utility behavior, grep ALL callers across all files                                   | Callers may pass args the utility didn't previously validate (PR #374 R3-R5)                           |

---

## GitHub Actions

| Priority | Pattern              | Rule                                                       | Why                                                |
| -------- | -------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| 🔴       | Supply chain pinning | Pin third-party actions to full SHA: `action@SHA # vX.Y.Z` | Tag retargeting attacks (CVE-2025-30066)           |
| 🔴       | JS template literals | `process.env.VAR` NOT `${{ }}`                             | Injection risk                                     |
| 🟡       | Command failure      | Use exit codes, not output parsing                         | Reliable detection                                 |
| 🟡       | File list separator  | `separator: "\n"` with `while IFS= read -r`                | Proper iteration                                   |
| 🟡       | Separate stderr      | `cmd 2>err.log`                                            | Keep JSON parseable                                |
| 🟡       | if conditions        | Explicit `${{ }}`                                          | YAML parser issues                                 |
| 🟡       | Retry loops          | Track success explicitly                                   | Don't assume loop exit = success                   |
| ⚪       | Output comparison    | `== '4'` not `== 4`                                        | Outputs are strings                                |
| ⚪       | Label auto-creation  | Check getLabel, create on 404                              | Fresh repos/forks                                  |
| ⚪       | Event-specific       | `context.payload.action === 'opened'`                      | Avoid spam on synchronize                          |
| 🟡       | API error tolerance  | Catch 404/422 on removeLabel                               | Label may be gone                                  |
| 🟡       | Boolean outputs      | Use dedicated boolean output instead of multiline string   | Multiline values break string comparison           |
| 🔴       | Script injection     | Pass user inputs via `env:` not `${{ }}` interpolation     | PR body/issue title injection (Review #224 S7630)  |
| 🔴       | User input env vars  | `env: PR_BODY: ${{ github.event.pull_request.body }}`      | Shell escaping automatic in env vars (Review #224) |

---

## JavaScript/TypeScript

| Priority | Pattern                             | Rule                                                                                                                | Why                                                                                               |
| -------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --- | ----- | ------------------------------------------------------------ |
| 🔴       | Error sanitization                  | Use `scripts/lib/sanitize-error.js`                                                                                 | Strip sensitive paths                                                                             |
| 🟡       | Error first line                    | `.split('\n')[0].replace(/\r$/, '')`                                                                                | Handles CRLF                                                                                      |
| 🟡       | Control char strip                  | `/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g`                                                                               | Preserves \t\n\r                                                                                  |
| 🟡       | OSC escape strip                    | <code>/\x1B\][^\x07\x1B]\*(?:\x07&#124;\x1B\\)/g</code>                                                             | With ANSI CSI                                                                                     |
| 🟡       | File-derived content                | Strip control chars before console.log                                                                              | Not just errors                                                                                   |
| 🟡       | Safe error handling                 | `error instanceof Error ? error.message : String(error)`                                                            | Non-Error throws                                                                                  |
| 🟡       | Robust non-Error                    | `error && typeof error === 'object' && 'message' in error`                                                          | Full check                                                                                        |
| 🔴       | Cross-platform paths                | `path.relative()` not `startsWith()`                                                                                | Path validation                                                                                   |
| 🟡       | path.relative() trap                | `".."` returned without separator for `/a` → `/`                                                                    | Check `rel === '..'` too                                                                          |
| 🔴       | Normalize backslashes               | `.replace(/\\/g, '/')` before security checks                                                                       | Path traversal                                                                                    |
| 🟡       | CRLF in regex                       | `\r?\n` instead of `\n`                                                                                             | Cross-platform                                                                                    |
| 🟡       | Windows cross-drive                 | Check for `/^[A-Za-z]:/` in relative output                                                                         | Absolute path returned                                                                            |
| 🟡       | Windows path sanitize               | `.replace(/[A-Z]:\\Users\\[^\\]+/gi, '[HOME]')`                                                                     | gi flag                                                                                           |
| 🟡       | Markdown links                      | `.replace(/\\/g, '/')`                                                                                              | Normalize backslashes                                                                             |
| 🟡       | lstatSync                           | Wrap in try-catch                                                                                                   | Permission denied, broken symlinks                                                                |
| 🔴       | File reads                          | Wrap ALL in try/catch                                                                                               | existsSync race, permissions                                                                      |
| 🟡       | Main module detect                  | Wrap in try-catch with fallback                                                                                     | Unusual paths throw                                                                               |
| 🟡       | maxBuffer                           | `10 * 1024 * 1024` for execSync                                                                                     | Large output                                                                                      |
| 🔴       | Global flag for exec()              | `/g` REQUIRED in while loops                                                                                        | No /g = infinite loop                                                                             |
| 🟡       | Regex brace matching                | `[^}]` not `[\s\S]`                                                                                                 | Single-brace-level                                                                                |
| 🟡       | Path boundary anchor                | <code>(?:^&#124;[\\/])</code> prefix                                                                                | Prevent substring matches                                                                         |
| 🟡       | Falsy vs missing check              | <code>=== undefined &#124;&#124; === null</code> for numeric fields                                                 | `!field` returns true for 0                                                                       |
| ⚪       | Node.js module prefix               | `node:fs`, `node:path`, `node:url`                                                                                  | SonarQube S6803 best practice                                                                     |
| 🟡       | Number.parseInt radix               | `Number.parseInt(str, 10)` not `parseInt(str)`                                                                      | Strings starting with 0 misinterpret                                                              |
| 🟡       | Dead code after throw               | Code after realpathSync success is unreachable                                                                      | realpathSync throws on missing files                                                              |
| 🟡       | SSR-safe browser APIs               | Guard with `typeof window !== 'undefined'`                                                                          | Prevent SSR crashes                                                                               |
| 🔴       | Cognitive complexity                | Keep functions under CC 15; extract helpers. **Pre-commit hook blocks CC >15 on staged files.**                     | SonarQube S3776. #1 churn driver across PRs #366-#371 (~20 avoidable rounds)                      |
| 🔴       | CC post-extraction verify           | After extracting helpers to reduce CC, re-run CC check on ENTIRE file to verify helpers also <15                    | Extracted helpers inherit CC from parents (PR #371: CC 33+17 in new helpers)                      |
| 🟡       | Options object for 7+ params        | Use single `opts` object with destructuring when extracting functions with 7+ parameters                            | SonarCloud max-params rule. See FIX_TEMPLATES Template 30 (PR #371 R2)                            |
| 🟡       | lstatSync for symlinks              | Use `lstatSync` to detect symlinks without following                                                                | `statSync` follows symlinks, misses escapes                                                       |
| 🟡       | NaN-safe numeric sorting            | `Number(a) - Number(b)` with <code>&#124;&#124; 0</code> fallback                                                   | NaN in sort comparator causes undefined order                                                     |
| 🟡       | path.relative() empty               | Include `rel === ''` in containment checks                                                                          | Resolving `.` gives empty relative path                                                           |
| 🟡       | Error cause preservation            | Use `new Error(msg, { cause: originalError })`                                                                      | Preserves error chain for debugging                                                               |
| 🟡       | globalThis over window              | Use `globalThis.window` for SSR-safe browser detection                                                              | `window` throws in Node.js                                                                        |
| 🟡       | Array.isArray guards                | Check `Array.isArray()` before array operations                                                                     | External data may not match expected type                                                         |
| 🟡       | Cross-platform isAbsolute           | Use `path.isAbsolute(file)` NOT `file.startsWith("/")`                                                              | Windows paths are `C:\...` not `/...`                                                             |
| 🟡       | CRLF line normalization             | `content.replace(/\r\n/g, "\n").replace(/\r/g, "\n")`                                                               | Windows files have CRLF, breaks regex with `$`                                                    |
| 🟡       | Cross-platform path.sep             | Use `path.sep` or normalize with `.replace(/\\/g, "/")`                                                             | Backslash on Windows, forward slash on Unix                                                       |
| ⚪       | listDocuments() for IDs             | Use `listDocuments()` when only document IDs needed                                                                 | Avoids reading full document data                                                                 |
| 🟡       | Non-greedy JSON extract             | Use `[\s\S]*?` not `[\s\S]*` for JSON extraction                                                                    | Greedy can backtrack on malformed input                                                           |
| 🟡       | Next.js env var bundling            | Use static `process.env.NEXT_PUBLIC_*` not dynamic lookup                                                           | Dynamic `process.env[key]` not inlined                                                            |
| 🟡       | Union type property access          | Cast to specific type: `(entry as MoodEntry).data.mood`                                                             | TS2339: Property doesn't exist on union type                                                      |
| 🟡       | Discriminated union helpers         | Use specific types in helper props: `{ data: MoodEntry["data"] }`                                                   | Avoids union type narrowing issues in components                                                  |
| 🔴       | Args arrays over templates          | Use `execFileSync(cmd, [arg1, arg2])` not `execSync(\`cmd ${var}\`)`                                                | Eliminates injection vectors even with validated inputs (Review #199)                             |
| 🔴       | Log target type validation          | Use `fstatSync(fd).isFile()` (Unix) or `lstatSync().isFile()` (Win)                                                 | Log files can be replaced with dirs/FIFOs (Review #199)                                           |
| 🔴       | Secure audit file write             | Full fd-based chain: dir symlink→path traversal→file symlink→openSync→fstatSync→fchmodSync→writeSync→closeSync      | Incremental fixes cause 4+ review rounds (PR #368 R1-R6). See FIX_TEMPLATES Template 27           |
| 🟡       | Signal error code semantics         | Check `error.code === 'ESRCH'` specifically for process signals                                                     | ESRCH = gone, EPERM = exists but no permission (Review #199)                                      |
| 🟡       | Process disappearance race          | When inspection fails, verify with `kill(pid, 0)` and treat ESRCH as success                                        | Distinguish "target disappeared" from "failed" (Review #199)                                      |
| 🟡       | PowerShell JSON edge cases          | Check for `"null"` string, use `Array.isArray()`, validate object                                                   | PowerShell can return null, arrays, or malformed JSON (Review #199)                               |
| 🟡       | Subprocess NaN prevention           | Filter PIDs with `Number.isInteger(n) && n > 0` after parsing                                                       | parseInt on unexpected input produces NaN (Review #199)                                           |
| 🟡       | Set vs Array migration              | When changing Array→Set, update all `.length` and `[index]` consumers                                               | `Array.from()` needed for iteration (Review #189)                                                 |
| 🟡       | Deterministic Set iteration         | Sort after `Array.from(set)` for reproducible order                                                                 | Set iteration order is undefined in JS (Review #190)                                              |
| 🟡       | Firestore Timestamp safety          | Check `typeof x?.toDate === "function"` before calling `.toDate()`                                                  | Timestamps may be null, undefined, or plain objects (Review #189)                                 |
| 🟡       | Cross-platform newline split        | Use `/\r?\n/` regex for splitting subprocess output                                                                 | Windows uses CRLF, Unix uses LF (Review #199)                                                     |
| 🟡       | Math.max empty array                | Check `arr.length > 0` before `Math.max(...arr)`                                                                    | `Math.max(...[])` returns -Infinity (Review #216)                                                 |
| 🟡       | Spread operator limits              | Use `reduce()` for large arrays, not `Math.max(...arr)`                                                             | Spread can overflow call stack (~65k args) (Review #216)                                          |
| 🟡       | Nullish coalescing                  | Use `??` not `\|\|` when 0 or "" are valid values                                                                   | `\|\|` treats 0/"" as falsy (Review #219)                                                         |
| 🟡       | Gap-safe counting                   | Use Set-based counting, not arithmetic subtraction                                                                  | Gaps in numbering break `highest - last` (Review #215)                                            |
| 🟡       | statSync race condition             | Wrap statSync in try/catch after readdirSync                                                                        | File can be deleted between readdir and stat (Review #224)                                        |
| 🟡       | Range clamping                      | Clamp values before operations: `Math.max(0, Math.min(100, value))`                                                 | Out-of-range values crash `.repeat()` etc (Review #224)                                           |
| 🟡       | Platform root detection             | Use `path.parse(dir).root` not hardcoded "/"                                                                        | Windows root is `C:\` not `/` (Review #214)                                                       |
| 🟡       | Regex anchoring for enums           | Use `^E[0-3]$` not `E[0-3]` for enum validation                                                                     | Unanchored matches partial strings like E12 (Review #219)                                         |
| 🟡       | Regex operator precedence           | In `/^a                                                                                                             | b                                                                                                 | c$/`, alternation has lowest precedence. Use `/^(a | b   | c)$/` | Unintended partial matches across alternatives (Review #225) |
| 🟡       | Safe percentage                     | Use `safePercent(n, total)` helper with division-by-zero guard                                                      | `(n/total)*100` throws or returns NaN/Infinity when total=0 (Review #226)                         |
| 🟡       | Section-scoped regex parsing        | Extract markdown section with `extractSection()` before matching table rows                                         | Regex on full doc matches wrong table sections (Review #263)                                      |
| 🟡       | Empty entries guard                 | Check `entries.length === 0` before writing to output file                                                          | Empty array writes blank file, corrupts data (Review #263)                                        |
| 🟡       | Multi-word capitalization           | `.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join("-")`                                                   | Single `.replace()` misses multi-word patterns (Review #262)                                      |
| 🟡       | Safe JSON parse helper              | `function loadJson(f) { try { return JSON.parse(readFileSync(f)) } catch { return null } }`                         | Avoids repeated try/catch for config files (Review #264)                                          |
| 🟡       | Brace depth tracking                | Count `{` and `}` for nested brace matching, not single `[^}]`                                                      | Single-level `[^}]` fails on nested objects (Review #261)                                         |
| 🟡       | Multi-line JSON reassembly          | Accumulate lines until balanced braces before `JSON.parse()`                                                        | Split JSONL can have multi-line entries (Review #261)                                             |
| 🟡       | Table-column date parsing           | Use `^\|\s*(\d{4}-\d{2}-\d{2})\s*\|` to match dates only in first table col                                         | Generic date regex matches wrong columns (Review #263)                                            |
| 🔴       | Canonical path resolution           | Use `git rev-parse --show-toplevel` + `path.relative()` + traversal guard + `replaceAll("\\","/")`                  | SonarCloud flags cwd-relative paths; Windows backslashes break JSONL (PR #365)                    |
| 🔴       | Regex two-strikes                   | If SonarCloud flags a regex twice, replace with string parsing (split lines + loop). Do NOT incrementally patch.    | PR #365: 4 rounds to fix 1 regex in check-roadmap-health.js                                       |
| 🔴       | Error rethrow after sanitize        | After `console.error(sanitized)`, use `process.exit(1)` NOT `throw err` — throw re-exposes the full stack           | Stack trace leakage to user output (PR #365)                                                      |
| 🟡       | File-size budgets                   | Add BOTH floor (skip tiny) AND ceiling (skip huge) guards before regex scanning user/state files                    | ReDoS on crafted large input; wasted cycles on empty files (PR #365)                              |
| 🟡       | Self-referential set guard          | Verify filter/exclusion sets are populated from an INDEPENDENT data source, never from the same data being filtered | Set built from filtered data makes check always pass (PR #388 R2: mergedFromIds bug)              |
| 🟡       | Null vs falsy in metrics            | Use `== null` or `=== null` instead of truthy checks (`!value`) when 0 or "" are valid metric values                | `!0` is true — truthy checks reject valid zero/empty (PR #388 R4: 5 locations)                    |
| 🔴       | Path normalize before string checks | Call `toPosixPath()` BEFORE `includes()`, `endsWith()`, `has()`, `startsWith()` on file paths                       | Windows backslash breaks string matching; ./ prefix breaks Set.has() (PR #392, 3 consecutive PRs) |

---

## CI/Automation

| Priority | Pattern                       | Rule                                                                       | Why                                                                      |
| -------- | ----------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 🟡       | CI mode                       | Check ALL, no truncation                                                   | Limits for interactive only                                              |
| 🟡       | Invalid files                 | Fail on exists && !valid && required                                       | Not just missing                                                         |
| 🟡       | Explicit flags                | Fail explicitly if flag target missing                                     | Even interactive                                                         |
| 🟡       | Readline close                | Create helper, call on all paths                                           | Prevent hang                                                             |
| 🟡       | File moves                    | grep for filename in .github/, scripts/                                    | Update CI refs                                                           |
| 🟡       | JSON output isolation         | Guard all console.error when JSON mode active                              | Mixed output breaks parsers                                              |
| 🟡       | Empty-state guards            | Handle "no prior data" case in triggers                                    | Prevents false positives on fresh projects                               |
| 🟡       | Unimplemented CLI flags       | Block with error message, exit code 2                                      | Silent acceptance = false confidence                                     |
| 🔴       | CLI arg separator             | Use `--` before file args: `script -- $FILES`                              | Prevents `-filename` injection                                           |
| 🔴       | Quote shell arguments         | Always quote `$ARGS` in shell hook settings                                | Command injection prevention                                             |
| 🔴       | Project dir validation        | Validate cwd is within expected project root                               | Prevent traversal in hooks                                               |
| 🟡       | Cross-platform paths          | Use `path.sep` and normalize backslashes                                   | Windows compatibility                                                    |
| 🟡       | Exit code best practice       | Use `process.exitCode` not `process.exit()`                                | Allows buffer flush                                                      |
| 🟡       | Per-item error handling       | try/catch around individual job items                                      | One failure shouldn't abort entire job                                   |
| 🟡       | Complete cleanup loops        | Loop until no documents match, not one batch                               | Cleanup jobs may have more than 500 items                                |
| 🟡       | Pre-push file selection       | Use `git diff @{u}...HEAD` for pushed commits                              | Pre-commit uses staged, pre-push uses diff                               |
| 🟡       | JSONL line parsing            | Parse line-by-line with try/catch, track line numbers                      | Single corrupt line shouldn't crash script (Review #218)                 |
| 🔴       | Atomic file writes            | Write to `.tmp` then `fs.renameSync` for critical files                    | Interrupted write leaves corrupt file (Review #218, #224)                |
| 🟡       | Stable ID preservation        | Never reassign IDs once allocated; IDs are immutable                       | Downstream consumers depend on stable refs (Review #218)                 |
| 🟡       | API pagination                | Always check for pagination in external APIs; fetch all                    | APIs default to partial results (Review #218)                            |
| 🟡       | Multi-file rollback           | If second write fails, undo first to maintain consistency                  | Partial writes leave inconsistent state (Review #223)                    |
| 🟡       | Glob self-inclusion           | Use explicit file lists, not globs that include output file                | `cat *.jsonl > merged.jsonl` includes output (Review #221)               |
| 🟡       | Windows atomic rename         | Use `fs.rmSync()` before `fs.renameSync()` on Windows                      | Windows rename fails if destination exists (Review #224)                 |
| 🟡       | Parallel agent review         | For 50+ review items, spawn specialized agents by concern area in parallel | Sequential review misses cross-cutting issues (Review #225)              |
| 🟡       | Delimiter consistency         | Use `\x1f` (Unit Separator) not `\|` for git log format fields             | Commit messages containing `\|` corrupt parsing (Review #264)            |
| 🟡       | pathExcludeList updates       | When deleting scripts, remove their entries from `pathExcludeList` arrays  | Stale excludes mask new violations (Review #260)                         |
| 🟡       | Fence block handling          | Track ``` state to skip code blocks during markdown parsing                | Pattern matchers fire on code examples (Review #261)                     |
| 🟡       | Rename fallback guard         | try/catch around `fs.renameSync` with `fs.writeFileSync` fallback          | Cross-drive renames fail on Windows (Review #265)                        |
| 🟡       | Trailing newline JSONL        | End JSONL files with `\n`: `entries.join("\n") + "\n"`                     | Missing trailing newline breaks append operations (Review #264)          |
| 🟡       | Content normalization         | Normalize CRLF + trim before comparing file content for changes            | Whitespace differences cause false-positive diffs (Review #262)          |
| 🟡       | Silent parse prevention       | Log warning on unparseable JSONL lines instead of silently filtering       | `.filter(Boolean)` hides data corruption (Review #263)                   |
| 🟡       | Stale review detection        | Compare review "up to commit" against current HEAD before acting           | Multi-round reviews may repeat already-fixed items (Review #260)         |
| 🟡       | Module-scope config try/catch | Wrap module-level `loadConfig()` in try/catch with fallback defaults       | Module scope has no caller to propagate errors to (Reviews #267-#272)    |
| 🟡       | Path info redaction           | Use `path.basename(filePath)` in error/warning logs, not full path         | Full paths leak directory structure to output (Reviews #266, #284)       |
| 🟡       | Silent catch prevention       | Always add `console.warn()` or explanatory comment in catch blocks         | Empty catches hide bugs and reduce debuggability (Reviews #269, #283)    |
| 🟡       | Number.isFinite guards        | Guard numeric inputs with `Number.isFinite(n)` before math operations      | NaN/Infinity propagate silently through calculations (Reviews #275-#277) |
| 🟡       | Fail-closed validation        | Security validation functions must return `false` on error, never throw    | Exceptions bypass security checks entirely (Reviews #269, #271, #276)    |
| 🟡       | Atomic write cleanup          | Add `try { fs.rmSync(tmpPath, { force: true }) } catch {}` in write catch  | Failed atomic writes leave orphan .tmp files (Reviews #283, #284)        |

---

## Git

| Priority | Pattern          | Rule                            | Why                |
| -------- | ---------------- | ------------------------------- | ------------------ |
| 🟡       | File renames     | grep for old terminology        | Not just filenames |
| 🟡       | Lockfile changes | `rm -rf node_modules && npm ci` | Verify clean       |

---

## Process Management

| Priority | Pattern                       | Rule                                                                                | Why                                                            |
| -------- | ----------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 🔴       | Cross-platform termination    | Use Node.js with `process.platform` detection for kill/signal commands              | PowerShell vs lsof/kill - hooks must support all platforms     |
| 🔴       | Process identity verification | Use allowlist validation + process name + command line matching before termination  | Port collision could kill wrong process (Review #198)          |
| 🔴       | Listener state targeting      | Filter for LISTENING state only (`-State Listen` / `-sTCP:LISTEN`)                  | Target listeners, not established connections (Review #198)    |
| 🟡       | Security event audit trails   | Log all termination attempts with timestamp, PID, decision to audit log             | Security operations require audit trails (Review #198)         |
| 🟡       | Graceful before forced        | Try graceful (`SIGTERM`/`taskkill`) before forced (`SIGKILL`/`taskkill /F`)         | Give processes chance to clean up (Review #198)                |
| 🟡       | Process tree termination      | Use `taskkill /T` to terminate entire process tree on Windows                       | Child processes can be orphaned without /T (Review #199)       |
| 🟡       | Graceful shutdown polling     | Poll `process.kill(pid, 0)` in loop until process exits, with timeout               | Use polling instead of fixed delays (Review #198)              |
| 🟡       | Process matching precision    | Exact name matching via Set + word-boundary regex (`/\bserena\b/`) for command line | Substring matching can hit unrelated processes (Review #199)   |
| 🟡       | Deprecated command removal    | Remove WMIC fallback, use PowerShell Get-CimInstance directly                       | WMIC deprecated on Windows 11+ (Review #199)                   |
| 🟡       | User context in audit logs    | Include `USER_CONTEXT` and `SESSION_ID` in security log entries                     | Audit logs need accountability context (Review #198)           |
| ⚪       | Native process signaling      | Use `process.kill(pid, 'SIGTERM')` instead of `execSync('kill')`                    | Prefer Node.js native APIs over shell (Review #198)            |
| ⚪       | Cross-platform sleep          | Use `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)`              | Avoid external sleep command dependency (Review #198)          |
| 🟡       | Trigger validation coverage   | Test both met and unmet conditions for threshold-based triggers                     | One-sided testing misses false-positive triggers (Review #262) |
| 🟡       | Operator tracking design      | Separate operator identity from action logging; hash for privacy                    | Design audit trails with privacy from start (Review #260)      |
| 🟡       | Design decision docs          | Document rejected alternatives in decision log, not just chosen approach            | Prevents re-evaluating same options next session (Review #264) |

---

## Documentation

| Priority | Pattern                      | Rule                                                                          | Why                                                        |
| -------- | ---------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 🟡       | Relative paths in subdirs    | Files in `docs/templates/` use `../file.md` NOT `docs/file.md`                | Path relative to file location                             |
| 🟡       | Path calculation             | From `docs/reviews/2026-Q1/`: to `docs/` = `../../`, to root = `../../../`    | Count directory levels                                     |
| 🟡       | Link verification            | `test -f path` from target directory before committing                        | Prevent broken links                                       |
| 🟡       | Template placeholders        | Replace ALL tokens before use (`[e.g., X]`, `YYYY-MM-DD`, `16.1.1`)           | Fill with actual values                                    |
| 🟡       | Archived doc paths           | Moving `docs/X.md` → `docs/archive/X.md` requires `./file` → `../file`        | Path prefix adjustment                                     |
| ⚪       | Version history dates        | Use actual commit date, not template creation date                            | Accurate audit trail                                       |
| 🟡       | Security doc explicitness    | "NEVER use X" NOT "if using X on client"                                      | Explicit prohibitions                                      |
| 🟡       | Tech-appropriate checks      | Adapt security checklists to stack (Firestore ≠ SQL)                          | Avoid irrelevant checks                                    |
| ⚪       | Model name accuracy          | Verify exact model identifiers against provider docs; avoid invented names    | Prevent invalid/ambiguous model selection                  |
| 🟡       | Stale review detection       | <code>git log --oneline COMMIT..HEAD &#124; wc -l</code> - if >5, verify each | Review may be outdated                                     |
| 🟡       | Relative path depth          | Test links from actual file location; count `../` for each level up           | Most common link breakage source (8+ occurrences #73-82)   |
| 🟡       | Metadata synchronization     | Update ranges/counts/dates atomically with content changes                    | 6 consecutive reviews caught drift (#73-79)                |
| 🟡       | Unicode property escapes     | Use `\p{Extended_Pictographic}` not emoji character lists                     | Reduces regex complexity (SonarCloud, Review #213)         |
| 🟡       | Markdown parentheses         | `encodeURI()` doesn't encode `()` - use custom encoding                       | Breaks `[text](url)` markdown links (Review #213)          |
| 🟡       | Pre-commit ADM filter        | Use `--diff-filter=ADM` not just `A` for doc checks                           | Catch modified/deleted docs too (Review #213)              |
| ⚪       | Model name consistency       | Use API identifiers: `gpt-4o` not `GPT-4o` or `ChatGPT-4o`                    | Standardization across all docs                            |
| 🟡       | JSON/JSONL validity          | All schema examples must be valid, parseable JSON/JSONL                       | Enable copy-paste testing with jq                          |
| ⚪       | NO-REPO MODE output          | Specify "header + zero lines" not placeholder text                            | Prevents parser-breaking invalid JSONL                     |
| ⚪       | Template placeholders format | Use `[Date]` not `YYYY-MM-DD`, use `null` not `X` in JSON                     | Clear, valid examples                                      |
| 🟡       | Update Dependencies sections | Tightly-coupled docs need explicit "also update X" instructions               | Prevents sync misses                                       |
| ⚪       | Verify AI reviewer claims    | AI tools can miss content in large files; verify via git/grep                 | Prevents wasted effort on false positives                  |
| ⚪       | Threshold reset policy       | Document at point of use: single-session = NO reset                           | Prevents confusion on audit semantics                      |
| 🟡       | YAML frontmatter required    | All `.claude/commands/*.md` need `---\ndescription: ...\n---`                 | Commands not recognized without frontmatter                |
| 🟡       | xargs hang prevention        | Use `while IFS= read -r f` instead of piping to xargs                         | xargs can hang on empty input                              |
| 🟡       | Cross-doc sync checkpoints   | Verify all summary counts match across documents after milestones             | Multi-document tracking needs explicit sync (Review #197)  |
| 🟡       | Handoff next steps staleness | Update Next Step field when transitioning between tasks or milestones         | Handoff docs become stale faster than other fields         |
| 🟡       | Placement status consistency | Update both "where from" and "where going" docs in same commit                | Placement metadata must stay synchronized (Review #197)    |
| 🟡       | AI reviewer verification     | Always verify AI claims about "missing" or "empty" via git/grep               | AI tools can misinterpret section content (Review #197)    |
| 🟡       | Linked-list insertion order  | Each item references previous ID for deterministic processing                 | "Create M..." is ambiguous; use specific IDs (Review #195) |
| 🟡       | Controlled vocabulary        | Use machine-readable codes (NEW, BUNDLED_WITH:<ID>) vs free-form text         | Enables robust automation vs manual parsing (Review #196)  |

---

## Security Audit (Canonical Findings)

| Priority | Pattern                      | Rule                                                                                             | Why                                               |
| -------- | ---------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| 🟡       | OWASP field format           | Use JSON arrays `["A01", "A05"]` not strings `"A01/A05"`                                         | Machine parsing, filtering, aggregation           |
| 🟡       | severity_normalization       | Add field when models disagree: `{"canonical": "S0", "reported": ["S0", "S1"], "reason": "..."}` | Audit trail for adjudication decisions            |
| 🟡       | Conditional risk acceptance  | Include `dependencies` array and `contingency` note for risk-accepted findings                   | Risk acceptance valid only when prerequisites met |
| ⚪       | file_globs vs files          | Use `files` for concrete paths, `file_globs` for search patterns                                 | Globs for searching, paths for linking            |
| 🟡       | Schema design for automation | Design fields for machine parsing from start (arrays over strings)                               | Enables automated aggregation and filtering       |
| 🟡       | Severity divergence tracking | Document when AI models assign different severities                                              | Transparency in multi-model audit process         |
| 🟡       | CANON ID normalization       | When renumbering IDs, update ALL references: `dependencies`, `contingency`, `notes` fields       | Broken references cause traceability loss         |
| 🟡       | ID format consistency        | Use `CANON-XXXX` (4 digits) across all CANON files                                               | Enables cross-file validation and sorting         |
| 🟡       | Duplicate ID detection       | Validate no duplicate `canonical_id` within or across files                                      | Each finding needs unique identifier              |

---

## React/Frontend

| Priority | Pattern                         | Rule                                                                                      | Why                                                                      |
| -------- | ------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 🟡       | Accessible toggle switches      | Use `<button role="switch" aria-checked>` not `<div onClick>`                             | Keyboard support, screen readers                                         |
| 🟡       | Local date extraction           | Use `getFullYear()/getMonth()/getDate()` not `toISOString()`                              | toISOString() converts to UTC, shifts dates                              |
| 🟡       | Preference spread on update     | `{ ...existing.preferences, [field]: value }` not direct assign                           | Prevents losing unmodified fields                                        |
| 🟡       | useEffect state dependency      | Avoid state vars in deps that trigger re-subscriptions                                    | Creates multiple subscriptions                                           |
| 🟡       | Firestore Timestamp handling    | Check for `.toDate()` method on timestamp fields                                          | Data may be Timestamp object or string                                   |
| 🟡       | Module-level init flags         | `let didInit = false` outside component for side effects                                  | Prevents double-init in React Strict Mode                                |
| 🟡       | Async cleanup pattern           | `let isCancelled = false` with `return () => { isCancelled = true }`                      | Prevents state updates after unmount                                     |
| 🟡       | useMemo for derived data        | Memoize arrays mapped with derived fields                                                 | Prevents recalculation every render                                      |
| 🟡       | Null guards at render boundary  | Check `if (!user) return null` even if state "guarantees" it                              | Defense in depth for edge cases                                          |
| 🟡       | finally for state cleanup       | Use `finally { setLoading(false) }` not duplicate in try/catch                            | Consistent cleanup regardless of success/failure                         |
| 🟡       | Error user-facing messages      | Generic messages to user; log errorCode only                                              | Firebase errors can leak implementation details                          |
| 🟡       | Cursor pagination batch jobs    | Use `startAfter(lastDoc)` not `hasMore = size === limit`                                  | Prevents infinite loops when items fail                                  |
| 🟡       | Firestore-first operation       | Write Firestore before Auth/external services                                             | Easier rollback on external failure                                      |
| 🟡       | Capture before transaction      | Store original values before transaction for rollback                                     | Full restoration if post-transaction steps fail                          |
| 🟡       | Primitive useEffect deps        | Use `user?.uid` not `user` object in dependency array                                     | Prevents unnecessary re-renders                                          |
| 🟡       | Functional setState updates     | Use `setState((prev) => ...)` in useCallback                                              | Avoids stale closure state                                               |
| ⚪       | data-testid for test selectors  | Use `data-testid="{feature}-{element}"` on key interactive elements                       | Stable selectors for automated UI testing protocols                      |
| 🟡       | Claims preservation             | `setCustomUserClaims({ ...existing, newClaim })` spread first                             | Firebase replaces entire claims object                                   |
| 🟡       | React state updaters pure       | Move side effects (localStorage/Firestore) from setState to useEffect                     | State updaters called twice in Strict Mode (Review #207)                 |
| 🟡       | Storage operations isolation    | Independent try/catch for localStorage vs Firestore saves                                 | One failing shouldn't block the other (Review #207)                      |
| 🟡       | npm script arg separator        | Use `npm run script -- --flag` to pass args to underlying command                         | Args before `--` go to npm, after go to script (Review #207)             |
| 🟡       | React key stability             | Use stable identifiers (`id`, unique field) not array index for keys                      | Index keys cause state bugs on list reorder/filter (Reviews #281, #282)  |
| 🟡       | Lazy-load typeof guard          | After `require().namedExport`, add `if (typeof x !== "function") x = fallback`            | `require()` succeeds but export may be undefined (PR #388 R7)            |
| 🔴       | Self-referential set filter     | Never build a filter/dedup set from the same data being filtered — use independent source | Filtering set built from input data = no-op filter (PR #388 R4)          |
| 🟡       | Null vs falsy in metrics        | Use `field == null` for numeric fields, not `!field`                                      | `!field` rejects valid `0` values in metrics/counts (PR #388 R5)         |
| 🔴       | Lazy quantifiers NOT ReDoS-safe | `.*?` and `.+?` are still unbounded — use `[^X]{0,N}` with bounded quantifiers            | Lazy ≠ safe; backtracking still explodes on crafted input (PR #394 R11)  |
| 🔴       | Generic AST walker > hand-enum  | Use `Object.keys(node).filter(k => k !== "parent")` + recurse, not hand-enumerating types | Hand-enumerated types miss LogicalExpression, etc. (PR #394 R1-R5)       |
| 🔴       | Per-access instanceof guard     | In ESLint rules, verify guard at EACH `.message` access, not once per catch block         | Block-level check misses unguarded access in else branches (PR #394 R11) |
| 🔴       | Fix-one-audit-all for AST utils | After fixing any AST utility, grep ALL other AST utilities for the same gap               | Same gap in 3+ locations = 3+ avoidable rounds (PR #394 Chains 1,3,4)    |

---

## General

| Priority | Pattern                       | Rule                                                                                                                                                   | Why                                                                   |
| -------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 🟡       | UNDERSTAND FIRST              | Ask "Does project use X?" before adding                                                                                                                | One correct fix > ten wrong                                           |
| 🟡       | package.json changes          | What's the REAL error? Peer dep?                                                                                                                       | Think before changing                                                 |
| 🔴       | .test() in loops              | Remove `g` flag                                                                                                                                        | Stateful lastIndex                                                    |
| 🟡       | AI path suggestions           | `ls -la path` first                                                                                                                                    | Verify existence                                                      |
| ⚪       | Nested code fences            | Use `````or`~~~`                                                                                                                                       | When content has ```                                                  |
| ⚪       | Effort estimates              | Verify rollup = sum of components                                                                                                                      | Catch stale estimates                                                 |
| 🟡       | Pattern fix audit             | Audit entire file                                                                                                                                      | Partial fixes = false confidence                                      |
| 🟡       | Complete TODOs immediately    | Don't leave placeholder functions with TODO comments                                                                                                   | Deferred forever = forgotten                                          |
| 🟡       | Smart fallbacks               | Use dynamic defaults (e.g., git log for dates) not hardcoded                                                                                           | Graceful degradation                                                  |
| 🔴       | Severity mapping completeness | When fixing severity/priority mapping, audit ALL levels AND ALL files with similar logic in one pass                                                   | Partial fixes cause 3-round ping-pong (PR #382 R1→R2→R3)              |
| 🔴       | Same-file regex DoS sweep     | After fixing one regex DoS (S5852), grep the same file for all other potentially vulnerable regexes                                                    | Second regex in same file causes avoidable round (PR #382 R1→R2)      |
| 🟡       | Dedup boundary enumeration    | When implementing dedup logic, enumerate ALL boundaries (cross-source, within-run, cross-batch) before coding                                          | Incremental discovery causes multi-round hardening (PR #382 R1→R2→R3) |
| 🟡       | State variable reset          | Context-tracking variables (currentSection, currentMilestone) must be reset when context changes, not just set when matching                           | Stale attribution in output data (PR #382 R3)                         |
| 🟡       | POSIX ERE in git grep         | Use `[[:space:]]` not `\s`; for word boundaries prefer `git grep -w` or explicit groups like `(^\|[^[:alnum:]_])..([^[:alnum:]_]\|$)` (don't use `\b`) | `git grep -E` uses POSIX ERE, not Perl regex (PR #388 R6)             |

---

## Enforcement

These patterns are automatically enforced by:

- `npm run patterns:check` - Pre-commit hook
- `npm run patterns:check-all` - Full repo scan
- `.claude/hooks/pattern-check.sh` - PostToolUse hook

When a violation is flagged, reference this document (🔴 = critical patterns)
for the pattern details and fix guidance.

**See also:** [FIX_TEMPLATES.md](./FIX_TEMPLATES.md) — Copy-paste fix templates
for the top 20 most common Qodo PR review findings, using project-specific
helpers.

---

## Version History

| Version | Date       | Changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.6     | 2026-02-26 | Add 4 patterns: lazy quantifiers ReDoS, generic AST walker, per-access guard, fix-one-audit-all. Source: PR #394 retro.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 3.5     | 2026-02-25 | Add path normalization before string checks pattern (🔴). Source: PR #392 retro (3 consecutive PRs).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 3.4     | 2026-02-24 | Added 4 patterns: lazy-load typeof guard, self-referential set filter, null vs falsy in metrics (JS/TS); POSIX ERE in git grep (General). Source: PR #388 retro.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 3.3     | 2026-02-20 | Added 4 General patterns: severity mapping completeness, same-file regex DoS sweep, dedup boundary enumeration, state variable reset. Source: PR #382 retro.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 3.2     | 2026-02-17 | Added 4 Security patterns: realpathSync lifecycle, path containment direction, safety flag hoist, shared utility caller audit. Source: PR #374 retro.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 3.1     | 2026-02-17 | Upgraded CC to 🔴 (pre-commit enforced). Added CC post-extraction verify + options object patterns. Source: PR #371 retro.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 3.0     | 2026-02-17 | Added 3 Security patterns: guardSymlink recognition, fail-closed catch, validate-then-store path. Source: PR #369-#370 retros.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2.9     | 2026-02-16 | Added 3 patterns: 2 Bash/Shell (POSIX compliance, EXIT trap chaining), 1 Security (SKIP_REASON validation chain). Source: PR #367 retro (7 review rounds, input validation ping-pong).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2.8     | 2026-02-15 | Added 2 Security patterns: isSafeToWrite shared symlink guard, atomic write tmp path guard. Source: PR #366 retro (8 review rounds, symlink ping-pong).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2.7     | 2026-02-10 | **CONSOLIDATION #18: Reviews #266-284** (19 reviews). Added 7 patterns: 6 CI/Automation (module-scope config try/catch, path info redaction, silent catch prevention, Number.isFinite guards, fail-closed validation, atomic write cleanup); 1 React/Frontend (key stability). Source: Sprint 3 .claude/hooks fixes, PR #358/#359 reviews (Qodo/SonarCloud rounds).                                                                                                                                                                                                                                                                                                                                                     |
| 2.6     | 2026-02-07 | **CONSOLIDATION #17: Reviews #254-265** (12 reviews). Added 23 patterns: 4 Security (PII in reports, operator hashing, backup-swap atomic write, token exposure); 7 JS/TS (section-scoped parsing, empty entries guard, multi-word capitalization, safe JSON helper, brace tracking, multi-line JSON, table-column dates); 8 CI/Automation (delimiter consistency, pathExcludeList, fence handling, rename fallback, trailing newline, content normalization, silent parse prevention, stale review detection); 3 Process Management (trigger validation, operator tracking, design decision docs); 1 Bash/Shell (here-string interpolation). Source: PR #346 Audit Trigger Reset reviews (Qodo/SonarCloud rounds 1-6). |
| 2.5     | 2026-02-02 | **CONSOLIDATION #16: Reviews #213-224** (12 reviews). Added 22 patterns: 2 GitHub Actions CRITICAL (script injection via env vars); 9 JS/TS (Math.max empty array, spread limits, nullish coalescing, gap-safe counting, statSync race, range clamping, platform root, regex anchoring); 8 CI/Automation (JSONL line parsing, atomic writes, stable IDs, API pagination, multi-file rollback, glob self-inclusion, Windows atomic rename); 3 Documentation (Unicode property escapes, Markdown parentheses, ADM filter). Source: TDMS PR #328, Cross-Platform Config, Process Audit, Doc Compliance reviews.                                                                                                            |
| 2.4     | 2026-01-29 | **CONSOLIDATION #15: Reviews #202-212** (11 reviews). Added React/Frontend patterns (11 new patterns), Security patterns (12 new patterns). Source: Audit sessions #114-#115, Learning Effectiveness Analyzer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2.3     | 2026-01-24 | **CONSOLIDATION #14: Reviews #180-201** (22 reviews). Added 50 new patterns across 6 categories: NEW Process Management section (12 patterns - cross-platform termination, allowlist validation, audit trails, graceful shutdown); Security (20 patterns - Unicode sanitization, input DoS, git injection, temp file hardening, Markdown injection, symlink parent traversal); JS/TS (11 patterns - args arrays, signal semantics, PowerShell JSON, Set migration, Timestamp safety); Documentation (6 patterns - cross-doc sync, linked-list IDs, controlled vocabulary). Source: Reviews #180-201 from SonarCloud Sprint, Hookify Infrastructure, Expansion Evaluation, Security Hardening sessions.                  |
| 2.2     | 2026-01-19 | Added 2 TypeScript patterns from PR #2 SonarCloud Sprint: Union type property access (cast to specific type), Discriminated union helpers (use specific types in helper props). Source: Review #185 TypeScript S3776 complexity reduction.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2.1     | 2026-01-18 | RESTRUCTURE: Removed 2 duplicates (URL allowlist, cognitive complexity). Fixed 12 corrupted table rows. Added priority tiers (🔴/🟡/⚪) to all 180+ patterns. Added Quick Reference section with 5 critical patterns + code examples extracted from codebase. Updated 7 dependent docs/hooks.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2.0     | 2026-01-18 | CONSOLIDATION #13: Reviews #137-143, #154-179 (33 reviews). Added 22 patterns: 6 React/Frontend (cursor pagination, Firestore-first, capture before tx, primitive deps, functional setState, claims preservation); 5 Security (isPlainObject, O(n²) DoS, npx --no-install, URL allowlist, self-scanner exclusion); 4 JS/TS (listDocuments, non-greedy JSON, Next.js bundling, cognitive complexity); 3 CI (per-item error, complete loops, pre-push); 2 Docs (YAML frontmatter, xargs hang); 1 GitHub Actions (boolean outputs)                                                                                                                                                                                         |
| 1.9     | 2026-01-17 | Session #71: Added 3 cross-platform patterns (isAbsolute for path detection, CRLF line normalization, path.sep usage) learned from Windows test failures in check-docs-light.js                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.8     | 2026-01-15 | CONSOLIDATION #12: Reviews #144-153 - Added 23 patterns (11 React/Frontend NEW: accessible toggles, local dates, preference spread, useEffect deps, Timestamp handling, init flags, async cleanup, useMemo, null guards, finally cleanup, error messages; 12 Security: URL allowlist, regex limits, RFC email, large input guards, whitespace, nullable types, defineString, prettier-ignore, token refresh, client-only dev data)                                                                                                                                                                                                                                                                                      |
| 1.7     | 2026-01-12 | CONSOLIDATION #11: Reviews #121-136 - Added 15 patterns (6 Security: IPv6, PII, bypass, fail-closed, batch, filtering; 4 JS/TS: path.relative, Error.cause, globalThis, Array.isArray; 5 CI: arg separator, quote args, project validation, cross-platform, exit code; 1 GitHub Actions: supply chain)                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.6     | 2026-01-11 | CONSOLIDATION #10: Reviews #109-120 - Added 5 patterns (3 Security: entity escaping, SSRF allowlist, timeouts; 2 JS/TS: lstatSync symlinks, NaN-safe sorting). Updated CANON ID patterns.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1.5     | 2026-01-11 | Added prototype pollution, secure logging, fail-fast patterns from Reviews #117-120                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.4     | 2026-01-09 | CONSOLIDATION #9: Reviews #98-108 - Added 18 patterns (6 JS/TS, 4 Security, 3 CI/Automation, 3 Documentation, 2 General)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 1.3     | 2026-01-07 | CONSOLIDATION #8: Reviews #83-97 - Added Security Audit category (6 patterns)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.2     | 2026-01-07 | CONSOLIDATION #7: Reviews #73-82 - Added 9 patterns (3 Bash/Shell, 6 Documentation) from Multi-AI Audit and Doc Linter reviews                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 1.1     | 2026-01-06 | CONSOLIDATION #6: Reviews #61-72 - Added Documentation category (10 patterns)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.0     | 2026-01-05 | Initial extraction from claude.md Section 4 (90+ patterns from 60 reviews)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

---

**END OF DOCUMENT**
