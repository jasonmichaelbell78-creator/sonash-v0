# Code Review Patterns Reference

**Document Version:** 2.1 **Source:** Distilled from 179 AI code reviews **Last
Updated:** 2026-01-18

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

## AI Instructions

When working with code patterns:

- Run patterns:check before committing
- Add new patterns here when identified in reviews
- Keep claude.md Section 4 in sync

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
- [Documentation](#documentation)
- [Security Audit (Canonical Findings)](#security-audit-canonical-findings)
- [React/Frontend](#reactfrontend)
- [General](#general)

---

## Bash/Shell

| Priority | Pattern                          | Rule                                                            | Why                                   |
| -------- | -------------------------------- | --------------------------------------------------------------- | ------------------------------------- | --------------------------------- | ------------------------------- |
| 🟡       | Exit code capture                | `if ! OUT=$(cmd); then` NOT `OUT=$(cmd); if [ $? -ne 0 ]`       | Captures assignment exit, not command |
| ⚪       | HEAD~N commits                   | Use `COMMIT_COUNT - 1` as max                                   | HEAD~N needs N+1 commits              |
| 🟡       | File iteration                   | `while IFS= read -r file` NOT `for file in $list`               | Spaces break for loop                 |
| 🟡       | Subshell scope                   | Use temp file or `while read; done < <(cmd)`                    | `cmd                                  | while read` loses variables       |
| 🟡       | Temp file cleanup                | `trap 'rm -f "$TMPFILE"' EXIT`                                  | Guaranteed cleanup                    |
| ⚪       | Exit code semantics              | 0=success, 1=action-needed, 2=error                             | Check explicitly                      |
| 🟡       | Retry loops                      | `for i in 1 2 3; do cmd && break; sleep 5; done`                | Race condition handling               |
| 🔴       | printf over echo                 | `printf '%s' "$VAR"` NOT `echo "$VAR"`                          | -n/-e injection risk                  |
| 🟡       | End-of-options                   | `basename -- "$PATH"`                                           | Prevents `-` as options               |
| ⚪       | Portable word boundaries         | `(^[^[:alnum:]])(word)([^[:alnum:]]$)` NOT `\b`                 | Not portable ERE                      |
| 🟡       | Pipeline failure                 | Add `                                                           |                                       | VAR=""` fallback                  | Commands may fail with pipefail |
| 🟡       | Terminal sanitization            | `tr -cd '[:alnum:] ,_-'`                                        | Strip ANSI escapes                    |
| ⚪       | grep --exclude                   | `--exclude="storage.ts"` NOT `--exclude="lib/utils/storage.ts"` | Matches basename only                 |
| 🟡       | Process substitution (Bash-only) | `while IFS= read -r line; do ...; done < <(cmd)` NOT `cmd       | while read`                           | Preserves exit codes + safe reads |
| ⚪       | Bash wrapper for scripts         | Wrap bash-specific code in `bash -lc '...'` with quote escaping | Avoids breaking POSIX sh              |
| 🟡       | set -o pipefail (Bash/Zsh/Ksh)   | Add before pipes in bash-based validation scripts               | Catch pipe failures                   |

---

## npm/Dependencies

| Priority | Pattern             | Rule                                            | Why                           |
| -------- | ------------------- | ----------------------------------------------- | ----------------------------- | --------------------- | -------------------- |
| 🟡       | CI installs         | `npm ci` NOT `npm install`                      | Prevents lockfile drift       |
| ⚪       | Adding packages     | Ask "does project actually use X?"              | Avoid unnecessary deps        |
| 🟡       | Peer deps           | Must be in lockfile                             | `npm ci` fails in Cloud Build |
| 🟡       | Husky CI            | `husky                                          |                               | echo 'not available'` | Graceful degradation |
| 🟡       | Lockfile corruption | `rm package-lock.json && npm install && npm ci` | Regenerate and verify         |

---

## Security

| Priority | Pattern                  | Rule                                                                | Why                                                 |
| -------- | ------------------------ | ------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------- | ---------------------------------------------- |
| 🔴       | File path validation     | Validate within repo root before operations                         | Prevent traversal                                   |
| 🔴       | Path traversal check     | `/^\.\.(?:[\\/]\|$)/.test(rel)` NOT `startsWith('..')`              | Avoids false positives                              |
| 🔴       | Reject traversal         | `if [[ "$PATH" == *"../"* ]]; then exit; fi`                        | Don't strip `../`                                   |
| 🔴       | Containment              | Apply path validation at ALL touch points                           | Not just entry point                                |
| 🔴       | CLI arg validation       | Check existence, non-empty, not another flag at parse               | `if (!arg                                           |                                       | arg.startsWith('--')) { reject; }`             |
| 🟡       | Empty path edge case     | Check `rel === ''`                                                  | Resolving `.` gives empty relative                  |
| 🟡       | Windows cross-drive      | Check drive letters match                                           | Before path.relative() checks                       |
| 🔴       | Shell interpolation      | Sanitize inputs                                                     | Command injection risk                              |
| 🔴       | External input           | Never trust in execSync/spawn                                       | Command injection                                   |
| 🔴       | Markdown output          | Escape backticks, `${{ }}`                                          | Injection risk                                      |
| 🟡       | Word boundary keywords   | `(^[^[:alnum:]])(auth\|token\|...)([^[:alnum:]]$)`                  | "monkey" shouldn't match "key"                      |
| 🟡       | Bound output             | Limit count (e.g., `jq '.[0:50]'`) and length (`${VAR:0:500}`)      | Prevent DoS                                         |
| 🔴       | Hook output              | Only output safe metadata                                           | Never expose secrets                                |
| 🔴       | .env files               | Never recommend committing                                          | Use environment vars                                |
| 🔴       | Symlink escape           | `realpathSync()` after resolve()                                    | Verify real path in project                         |
| 🔴       | Fail-closed realpath     | If realpathSync fails but file exists, reject                       | `catch { if (existsSync(path)) return false; }`     |
| 🔴       | PII masking              | `maskEmail()` → `u***@d***.com`                                     | Privacy in logs                                     |
| 🟡       | Audit logging            | JSON with timestamp, operator, action, target, result               | Structured logs                                     |
| 🔴       | Regex state leak         | Reset lastIndex before each iteration with /g + .exec()             | Stateful lastIndex skips matches                    |
| 🔴       | ReDoS user patterns      | Add heuristic detection (nested quantifiers, length limits)         | User regex can have catastrophic backtracking       |
| 🔴       | Path containment check   | After resolve(), verify result stays within root                    | resolve() doesn't guarantee containment             |
| 🟡       | JSONL parse resilience   | try/catch per line, continue with valid entries                     | Single bad line shouldn't crash script              |
| 🔴       | Prototype pollution      | Use `new Map()` or `Object.create(null)` for untrusted keys         | `__proto__` can pollute Object.prototype            |
| 🔴       | Secure error logging     | Never log raw input content; log line numbers and char counts       | Input may contain secrets or PII                    |
| 🟡       | Fail-fast validation     | Abort on parse errors to prevent silent data loss                   | Malformed data shouldn't be silently dropped        |
| 🟡       | Entity escaping order    | Escape `&` FIRST, then `<`, `>`, quotes                             | `&lt;` becomes `&amp;lt;` if ampersand escaped last |
| 🔴       | SSRF allowlist           | Explicit hostname allowlist + protocol enforcement (HTTPS only)     | Environment variables alone insufficient            |
| 🟡       | External request timeout | Use `AbortController` with explicit timeout on all fetch/HTTP calls | Network calls can hang indefinitely                 |
| 🟡       | IPv6-safe IP parsing     | Only strip port from IPv4 (contains `.`); preserve full IPv6        | Splitting by `:` breaks IPv6 addresses              |
| 🔴       | Third-party PII hygiene  | Set `captureToSentry: false` for logs containing IP/PII             | Internal logs flow to third parties                 |
| 🔴       | Defense-in-depth bypass  | Multi-condition: `bypass = flagSet && (isEmulator                   |                                                     | !isProd)`                             | Single env var shouldn't disable prod security |
| 🔴       | Production fail-closed   | Security features (reCAPTCHA) fail-closed in production             | Degraded security should fail, not bypass           |
| 🟡       | Firestore batch chunking | Chunk batch operations under 500-op limit                           | Firestore batch write limit                         |
| 🟡       | Sensitive file filtering | Filter sensitive paths before passing to external tools             | Don't expose secrets to code review tools           |
| 🔴       | URL protocol allowlist   | Validate external URLs against explicit protocol+host allowlist     | Prevents javascript:/data: injection from APIs      |
| 🔴       | Regex length limits      | Use `{1,64}` not `+` for bounded user input                         | Prevents ReDoS catastrophic backtracking            |
| 🟡       | Email regex RFC 5321     | `{1,64}@{1,253}\.[A-Z]{2,63}` with all three bounds                 | Local max 64, domain max 253, TLD max 63            |
| 🟡       | Large input guards       | Reject inputs exceeding size threshold before processing            | Prevents DoS/UI freeze on crafted payloads          |
| 🟡       | Sanitizer whitespace     | `input?.trim()` before empty check; trim before processing          | Whitespace-only strings can bypass validation       |
| ⚪       | Nullable utility types   | Accept `string                                                      | null                                                | undefined` for optional data handlers | Explicit API contract for edge cases           |
| 🟡       | Firebase defineString    | Use `defineString()` not `process.env` in Cloud Functions           | process.env doesn't work in deployed functions      |
| ⚪       | Prettier-linter conflict | Use `// prettier-ignore` when formatters conflict with linters      | Prevents CI ping-pong between tools                 |
| 🟡       | Force token refresh      | `getIdTokenResult(true)` when checking fresh admin claims           | Cached tokens miss recent claim changes             |
| 🟡       | Dev data client-only     | Dev dashboards: Firestore rules `write: if false` for clients       | Writes should only come from Admin SDK/CI           |
| 🟡       | isPlainObject guard      | Check `Object.getPrototypeOf(obj) === Object.prototype`             | Prevents corrupting Date/Timestamp in redaction     |
| 🔴       | O(n²) algorithm DoS      | Truncate inputs to MAX_LENGTH before O(n²) ops (Levenshtein)        | Quadratic complexity exploitable at scale           |
| 🔴       | npx --no-install         | Use `npx --no-install pkg` to prevent remote code fetch             | Supply chain security in git hooks                  |
| 🟡       | Self-scanner exclusion   | Security scanners exclude their own source from pattern matching    | Prevents false positives on pattern examples        |

---

## GitHub Actions

| Priority | Pattern              | Rule                                                       | Why                                      |
| -------- | -------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| 🔴       | Supply chain pinning | Pin third-party actions to full SHA: `action@SHA # vX.Y.Z` | Tag retargeting attacks (CVE-2025-30066) |
| 🔴       | JS template literals | `process.env.VAR` NOT `${{ }}`                             | Injection risk                           |
| 🟡       | Command failure      | Use exit codes, not output parsing                         | Reliable detection                       |
| 🟡       | File list separator  | `separator: "\n"` with `while IFS= read -r`                | Proper iteration                         |
| 🟡       | Separate stderr      | `cmd 2>err.log`                                            | Keep JSON parseable                      |
| 🟡       | if conditions        | Explicit `${{ }}`                                          | YAML parser issues                       |
| 🟡       | Retry loops          | Track success explicitly                                   | Don't assume loop exit = success         |
| ⚪       | Output comparison    | `== '4'` not `== 4`                                        | Outputs are strings                      |
| ⚪       | Label auto-creation  | Check getLabel, create on 404                              | Fresh repos/forks                        |
| ⚪       | Event-specific       | `context.payload.action === 'opened'`                      | Avoid spam on synchronize                |
| 🟡       | API error tolerance  | Catch 404/422 on removeLabel                               | Label may be gone                        |
| 🟡       | Boolean outputs      | Use dedicated boolean output instead of multiline string   | Multiline values break string comparison |

---

## JavaScript/TypeScript

| Priority | Pattern                   | Rule                                                       | Why                                            |
| -------- | ------------------------- | ---------------------------------------------------------- | ---------------------------------------------- | ---------------------------- | --------------------------------------------- |
| 🔴       | Error sanitization        | Use `scripts/lib/sanitize-error.js`                        | Strip sensitive paths                          |
| 🟡       | Error first line          | `.split('\n')[0].replace(/\r$/, '')`                       | Handles CRLF                                   |
| 🟡       | Control char strip        | `/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g`                      | Preserves \t\n\r                               |
| 🟡       | OSC escape strip          | `/\x1B\][^\x07\x1B]*(?:\x07\|\x1B\\)/g`                    | With ANSI CSI                                  |
| 🟡       | File-derived content      | Strip control chars before console.log                     | Not just errors                                |
| 🟡       | Safe error handling       | `error instanceof Error ? error.message : String(error)`   | Non-Error throws                               |
| 🟡       | Robust non-Error          | `error && typeof error === 'object' && 'message' in error` | Full check                                     |
| 🔴       | Cross-platform paths      | `path.relative()` not `startsWith()`                       | Path validation                                |
| 🟡       | path.relative() trap      | `".."` returned without separator for `/a` → `/`           | Check `rel === '..'` too                       |
| 🔴       | Normalize backslashes     | `.replace(/\\/g, '/')` before security checks              | Path traversal                                 |
| 🟡       | CRLF in regex             | `\r?\n` instead of `\n`                                    | Cross-platform                                 |
| 🟡       | Windows cross-drive       | Check for `/^[A-Za-z]:/` in relative output                | Absolute path returned                         |
| 🟡       | Windows path sanitize     | `.replace(/[A-Z]:\\Users\\[^\\]+/gi, '[HOME]')`            | gi flag                                        |
| 🟡       | Markdown links            | `.replace(/\\/g, '/')`                                     | Normalize backslashes                          |
| 🟡       | lstatSync                 | Wrap in try-catch                                          | Permission denied, broken symlinks             |
| 🔴       | File reads                | Wrap ALL in try/catch                                      | existsSync race, permissions                   |
| 🟡       | Main module detect        | Wrap in try-catch with fallback                            | Unusual paths throw                            |
| 🟡       | maxBuffer                 | `10 * 1024 * 1024` for execSync                            | Large output                                   |
| 🔴       | Global flag for exec()    | `/g` REQUIRED in while loops                               | No /g = infinite loop                          |
| 🟡       | Regex brace matching      | `[^}]` not `[\s\S]`                                        | Single-brace-level                             |
| 🟡       | Path boundary anchor      | `(?:^\|[\\/])` prefix                                      | Prevent substring matches                      |
| 🟡       | Falsy vs missing check    | `=== undefined                                             |                                                | === null` for numeric fields | `!field` returns true for 0                   |
| ⚪       | Node.js module prefix     | `node:fs`, `node:path`, `node:url`                         | SonarQube S6803 best practice                  |
| 🟡       | Number.parseInt radix     | `Number.parseInt(str, 10)` not `parseInt(str)`             | Strings starting with 0 misinterpret           |
| 🟡       | Dead code after throw     | Code after realpathSync success is unreachable             | realpathSync throws on missing files           |
| 🟡       | SSR-safe browser APIs     | Guard with `typeof window !== 'undefined'`                 | Prevent SSR crashes                            |
| 🟡       | Cognitive complexity      | Keep functions under 15; extract helpers                   | SonarQube S3776 threshold                      |
| 🟡       | lstatSync for symlinks    | Use `lstatSync` to detect symlinks without following       | `statSync` follows symlinks, misses escapes    |
| 🟡       | NaN-safe numeric sorting  | `Number(a) - Number(b)` with `                             |                                                | 0` fallback                  | NaN in sort comparator causes undefined order |
| 🟡       | path.relative() empty     | Include `rel === ''` in containment checks                 | Resolving `.` gives empty relative path        |
| 🟡       | Error cause preservation  | Use `new Error(msg, { cause: originalError })`             | Preserves error chain for debugging            |
| 🟡       | globalThis over window    | Use `globalThis.window` for SSR-safe browser detection     | `window` throws in Node.js                     |
| 🟡       | Array.isArray guards      | Check `Array.isArray()` before array operations            | External data may not match expected type      |
| 🟡       | Cross-platform isAbsolute | Use `path.isAbsolute(file)` NOT `file.startsWith("/")`     | Windows paths are `C:\...` not `/...`          |
| 🟡       | CRLF line normalization   | `content.replace(/\r\n/g, "\n").replace(/\r/g, "\n")`      | Windows files have CRLF, breaks regex with `$` |
| 🟡       | Cross-platform path.sep   | Use `path.sep` or normalize with `.replace(/\\/g, "/")`    | Backslash on Windows, forward slash on Unix    |
| ⚪       | listDocuments() for IDs   | Use `listDocuments()` when only document IDs needed        | Avoids reading full document data              |
| 🟡       | Non-greedy JSON extract   | Use `[\s\S]*?` not `[\s\S]*` for JSON extraction           | Greedy can backtrack on malformed input        |
| 🟡       | Next.js env var bundling  | Use static `process.env.NEXT_PUBLIC_*` not dynamic lookup  | Dynamic `process.env[key]` not inlined         |

---

## CI/Automation

| Priority | Pattern                 | Rule                                          | Why                                        |
| -------- | ----------------------- | --------------------------------------------- | ------------------------------------------ |
| 🟡       | CI mode                 | Check ALL, no truncation                      | Limits for interactive only                |
| 🟡       | Invalid files           | Fail on exists && !valid && required          | Not just missing                           |
| 🟡       | Explicit flags          | Fail explicitly if flag target missing        | Even interactive                           |
| 🟡       | Readline close          | Create helper, call on all paths              | Prevent hang                               |
| 🟡       | File moves              | grep for filename in .github/, scripts/       | Update CI refs                             |
| 🟡       | JSON output isolation   | Guard all console.error when JSON mode active | Mixed output breaks parsers                |
| 🟡       | Empty-state guards      | Handle "no prior data" case in triggers       | Prevents false positives on fresh projects |
| 🟡       | Unimplemented CLI flags | Block with error message, exit code 2         | Silent acceptance = false confidence       |
| 🔴       | CLI arg separator       | Use `--` before file args: `script -- $FILES` | Prevents `-filename` injection             |
| 🔴       | Quote shell arguments   | Always quote `$ARGS` in shell hook settings   | Command injection prevention               |
| 🔴       | Project dir validation  | Validate cwd is within expected project root  | Prevent traversal in hooks                 |
| 🟡       | Cross-platform paths    | Use `path.sep` and normalize backslashes      | Windows compatibility                      |
| 🟡       | Exit code best practice | Use `process.exitCode` not `process.exit()`   | Allows buffer flush                        |
| 🟡       | Per-item error handling | try/catch around individual job items         | One failure shouldn't abort entire job     |
| 🟡       | Complete cleanup loops  | Loop until no documents match, not one batch  | Cleanup jobs may have more than 500 items  |
| 🟡       | Pre-push file selection | Use `git diff @{u}...HEAD` for pushed commits | Pre-commit uses staged, pre-push uses diff |

---

## Git

| Priority | Pattern          | Rule                            | Why                |
| -------- | ---------------- | ------------------------------- | ------------------ |
| 🟡       | File renames     | grep for old terminology        | Not just filenames |
| 🟡       | Lockfile changes | `rm -rf node_modules && npm ci` | Verify clean       |

---

## Documentation

| Priority | Pattern                      | Rule                                                                       | Why                                                      |
| -------- | ---------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------- |
| 🟡       | Relative paths in subdirs    | Files in `docs/templates/` use `../file.md` NOT `docs/file.md`             | Path relative to file location                           |
| 🟡       | Path calculation             | From `docs/reviews/2026-Q1/`: to `docs/` = `../../`, to root = `../../../` | Count directory levels                                   |
| 🟡       | Link verification            | `test -f path` from target directory before committing                     | Prevent broken links                                     |
| 🟡       | Template placeholders        | Replace ALL tokens before use (`[e.g., X]`, `YYYY-MM-DD`, `16.1.1`)        | Fill with actual values                                  |
| 🟡       | Archived doc paths           | Moving `docs/X.md` → `docs/archive/X.md` requires `./file` → `../file`     | Path prefix adjustment                                   |
| ⚪       | Version history dates        | Use actual commit date, not template creation date                         | Accurate audit trail                                     |
| 🟡       | Security doc explicitness    | "NEVER use X" NOT "if using X on client"                                   | Explicit prohibitions                                    |
| 🟡       | Tech-appropriate checks      | Adapt security checklists to stack (Firestore ≠ SQL)                       | Avoid irrelevant checks                                  |
| ⚪       | Model name accuracy          | Verify exact model identifiers against provider docs; avoid invented names | Prevent invalid/ambiguous model selection                |
| 🟡       | Stale review detection       | `git log --oneline COMMIT..HEAD                                            | wc -l` - if >5, verify each                              | Review may be outdated |
| 🟡       | Relative path depth          | Test links from actual file location; count `../` for each level up        | Most common link breakage source (8+ occurrences #73-82) |
| 🟡       | Metadata synchronization     | Update ranges/counts/dates atomically with content changes                 | 6 consecutive reviews caught drift (#73-79)              |
| ⚪       | Model name consistency       | Use API identifiers: `gpt-4o` not `GPT-4o` or `ChatGPT-4o`                 | Standardization across all docs                          |
| 🟡       | JSON/JSONL validity          | All schema examples must be valid, parseable JSON/JSONL                    | Enable copy-paste testing with jq                        |
| ⚪       | NO-REPO MODE output          | Specify "header + zero lines" not placeholder text                         | Prevents parser-breaking invalid JSONL                   |
| ⚪       | Template placeholders format | Use `[Date]` not `YYYY-MM-DD`, use `null` not `X` in JSON                  | Clear, valid examples                                    |
| 🟡       | Update Dependencies sections | Tightly-coupled docs need explicit "also update X" instructions            | Prevents sync misses                                     |
| ⚪       | Verify AI reviewer claims    | AI tools can miss content in large files; verify via git/grep              | Prevents wasted effort on false positives                |
| ⚪       | Threshold reset policy       | Document at point of use: single-session = NO reset                        | Prevents confusion on audit semantics                    |
| 🟡       | YAML frontmatter required    | All `.claude/commands/*.md` need `---\ndescription: ...\n---`              | Commands not recognized without frontmatter              |
| 🟡       | xargs hang prevention        | Use `while IFS= read -r f` instead of piping to xargs                      | xargs can hang on empty input                            |

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

| Priority | Pattern                        | Rule                                                                 | Why                                              |
| -------- | ------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------ |
| 🟡       | Accessible toggle switches     | Use `<button role="switch" aria-checked>` not `<div onClick>`        | Keyboard support, screen readers                 |
| 🟡       | Local date extraction          | Use `getFullYear()/getMonth()/getDate()` not `toISOString()`         | toISOString() converts to UTC, shifts dates      |
| 🟡       | Preference spread on update    | `{ ...existing.preferences, [field]: value }` not direct assign      | Prevents losing unmodified fields                |
| 🟡       | useEffect state dependency     | Avoid state vars in deps that trigger re-subscriptions               | Creates multiple subscriptions                   |
| 🟡       | Firestore Timestamp handling   | Check for `.toDate()` method on timestamp fields                     | Data may be Timestamp object or string           |
| 🟡       | Module-level init flags        | `let didInit = false` outside component for side effects             | Prevents double-init in React Strict Mode        |
| 🟡       | Async cleanup pattern          | `let isCancelled = false` with `return () => { isCancelled = true }` | Prevents state updates after unmount             |
| 🟡       | useMemo for derived data       | Memoize arrays mapped with derived fields                            | Prevents recalculation every render              |
| 🟡       | Null guards at render boundary | Check `if (!user) return null` even if state "guarantees" it         | Defense in depth for edge cases                  |
| 🟡       | finally for state cleanup      | Use `finally { setLoading(false) }` not duplicate in try/catch       | Consistent cleanup regardless of success/failure |
| 🟡       | Error user-facing messages     | Generic messages to user; log errorCode only                         | Firebase errors can leak implementation details  |
| 🟡       | Cursor pagination batch jobs   | Use `startAfter(lastDoc)` not `hasMore = size === limit`             | Prevents infinite loops when items fail          |
| 🟡       | Firestore-first operation      | Write Firestore before Auth/external services                        | Easier rollback on external failure              |
| 🟡       | Capture before transaction     | Store original values before transaction for rollback                | Full restoration if post-transaction steps fail  |
| 🟡       | Primitive useEffect deps       | Use `user?.uid` not `user` object in dependency array                | Prevents unnecessary re-renders                  |
| 🟡       | Functional setState updates    | Use `setState((prev) => ...)` in useCallback                         | Avoids stale closure state                       |
| 🟡       | Claims preservation            | `setCustomUserClaims({ ...existing, newClaim })` spread first        | Firebase replaces entire claims object           |

---

## General

| Priority | Pattern                    | Rule                                                         | Why                              |
| -------- | -------------------------- | ------------------------------------------------------------ | -------------------------------- |
| 🟡       | UNDERSTAND FIRST           | Ask "Does project use X?" before adding                      | One correct fix > ten wrong      |
| 🟡       | package.json changes       | What's the REAL error? Peer dep?                             | Think before changing            |
| 🔴       | .test() in loops           | Remove `g` flag                                              | Stateful lastIndex               |
| 🟡       | AI path suggestions        | `ls -la path` first                                          | Verify existence                 |
| ⚪       | Nested code fences         | Use `````or`~~~`                                             | When content has ```             |
| ⚪       | Effort estimates           | Verify rollup = sum of components                            | Catch stale estimates            |
| 🟡       | Pattern fix audit          | Audit entire file                                            | Partial fixes = false confidence |
| 🟡       | Complete TODOs immediately | Don't leave placeholder functions with TODO comments         | Deferred forever = forgotten     |
| 🟡       | Smart fallbacks            | Use dynamic defaults (e.g., git log for dates) not hardcoded | Graceful degradation             |

---

## Enforcement

These patterns are automatically enforced by:

- `npm run patterns:check` - Pre-commit hook
- `npm run patterns:check-all` - Full repo scan
- `.claude/hooks/pattern-check.sh` - PostToolUse hook

When a violation is flagged, reference this document (🔴 = critical patterns)
for the pattern details and fix guidance.

---

## Version History

| Version | Date       | Changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1     | 2026-01-18 | RESTRUCTURE: Removed 2 duplicates (URL allowlist, cognitive complexity). Fixed 12 corrupted table rows. Added priority tiers (🔴/🟡/⚪) to all 180+ patterns. Added Quick Reference section with 5 critical patterns + code examples extracted from codebase. Updated 7 dependent docs/hooks.                                                                                                                                                                                                                                   |
| 2.0     | 2026-01-18 | CONSOLIDATION #13: Reviews #137-143, #154-179 (33 reviews). Added 22 patterns: 6 React/Frontend (cursor pagination, Firestore-first, capture before tx, primitive deps, functional setState, claims preservation); 5 Security (isPlainObject, O(n²) DoS, npx --no-install, URL allowlist, self-scanner exclusion); 4 JS/TS (listDocuments, non-greedy JSON, Next.js bundling, cognitive complexity); 3 CI (per-item error, complete loops, pre-push); 2 Docs (YAML frontmatter, xargs hang); 1 GitHub Actions (boolean outputs) |
| 1.9     | 2026-01-17 | Session #71: Added 3 cross-platform patterns (isAbsolute for path detection, CRLF line normalization, path.sep usage) learned from Windows test failures in check-docs-light.js                                                                                                                                                                                                                                                                                                                                                 |
| 1.8     | 2026-01-15 | CONSOLIDATION #12: Reviews #144-153 - Added 23 patterns (11 React/Frontend NEW: accessible toggles, local dates, preference spread, useEffect deps, Timestamp handling, init flags, async cleanup, useMemo, null guards, finally cleanup, error messages; 12 Security: URL allowlist, regex limits, RFC email, large input guards, whitespace, nullable types, defineString, prettier-ignore, token refresh, client-only dev data)                                                                                              |
| 1.7     | 2026-01-12 | CONSOLIDATION #11: Reviews #121-136 - Added 15 patterns (6 Security: IPv6, PII, bypass, fail-closed, batch, filtering; 4 JS/TS: path.relative, Error.cause, globalThis, Array.isArray; 5 CI: arg separator, quote args, project validation, cross-platform, exit code; 1 GitHub Actions: supply chain)                                                                                                                                                                                                                          |
| 1.6     | 2026-01-11 | CONSOLIDATION #10: Reviews #109-120 - Added 5 patterns (3 Security: entity escaping, SSRF allowlist, timeouts; 2 JS/TS: lstatSync symlinks, NaN-safe sorting). Updated CANON ID patterns.                                                                                                                                                                                                                                                                                                                                       |
| 1.5     | 2026-01-11 | Added prototype pollution, secure logging, fail-fast patterns from Reviews #117-120                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 1.4     | 2026-01-09 | CONSOLIDATION #9: Reviews #98-108 - Added 18 patterns (6 JS/TS, 4 Security, 3 CI/Automation, 3 Documentation, 2 General)                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.3     | 2026-01-07 | CONSOLIDATION #8: Reviews #83-97 - Added Security Audit category (6 patterns)                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.2     | 2026-01-07 | CONSOLIDATION #7: Reviews #73-82 - Added 9 patterns (3 Bash/Shell, 6 Documentation) from Multi-AI Audit and Doc Linter reviews                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.1     | 2026-01-06 | CONSOLIDATION #6: Reviews #61-72 - Added Documentation category (10 patterns)                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.0     | 2026-01-05 | Initial extraction from claude.md Section 4 (90+ patterns from 60 reviews)                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

---

**END OF DOCUMENT**
