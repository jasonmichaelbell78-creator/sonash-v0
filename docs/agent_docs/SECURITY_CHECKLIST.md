# Security Checklist for Scripts

**Document Version:** 1.2 **Last Updated:** 2026-03-01 **Status:** Active

**Pattern Range:** 180+ patterns (from CODE_PATTERNS.md), templates up to #36
(as of 2026-02-22) | **Recent Additions:** Patterns #31-41 (PR #310 Session #90)

---

## Quick Start

1. **Before writing code**: Scan relevant sections below (File Ops, Git, User
   Input)
2. **Use helpers**: Import from `scripts/lib/security-helpers.js` when available
3. **New patterns**: Add discoveries here AND to CODE_PATTERNS.md, then run
   `npm run patterns:sync`

---

## Purpose

Use this checklist **BEFORE writing or reviewing** any script that handles:

- File I/O operations
- Git commands
- User input / CLI arguments
- Shell commands / process execution
- Generated output (Markdown, JSON, logs)
- External requests (HTTP, API calls)
- Regular expressions with user input

This checklist is the **single source of truth** for security patterns. It's
automatically updated when new patterns are discovered during PR reviews.

---

---

## Quick Reference

| Operation           | Helper Function              | Key Patterns       |
| ------------------- | ---------------------------- | ------------------ |
| Write file (new)    | `safeWriteFile()`            | #32, #36, #39      |
| Write file (update) | `safeUpdateFile()`           | #36, #39           |
| Git add             | `safeGitAdd()`               | #31, #40, #41      |
| Git commit          | `safeGitCommit()`            | #32                |
| Parse CLI args      | `parseCliArgs()`             | #37, CLI section   |
| Sanitize for logs   | `sanitizeError()`            | #34, Error section |
| Sanitize for MD     | `escapeMd()`                 | #33, #35           |
| Validate path       | `validatePathInDir()`        | #17, #18, #41      |
| Check symlinks      | `refuseSymlinkWithParents()` | #36, #39           |
| Sanitize filename   | `sanitizeFilename()`         | #31, #37           |

---

## File Operations

### Creating New Files

- [ ] **#32 Exclusive creation**: Use `{ flag: "wx", mode: 0o600 }` — [ESLint:
      sonash/no-non-atomic-write]
- [ ] **#36 Symlink check**: Call `refuseSymlinkWithParents(path)` before write
      — [ESLint: sonash/no-stat-without-lstat] [Semgrep:
      sonash.correctness.no-race-condition-file-ops]
- [ ] **#39 Parent symlinks**: Check ALL parent directories, not just target —
      [Manual review only]
- [ ] **#37 Empty path fallback**: Provide default if sanitized name is empty —
      [ESLint: sonash/no-empty-path-check]

```javascript
// CORRECT
const { safeWriteFile } = require("./lib/security-helpers");
safeWriteFile(targetPath, content);

// MANUAL (if helper not available)
refuseSymlinkWithParents(targetPath);
writeFileSync(targetPath, content, {
  encoding: "utf-8",
  flag: "wx",
  mode: 0o600,
});
```

### Updating Existing Files

- [ ] **#36 Symlink check**: Verify target is not a symlink — [ESLint:
      sonash/no-stat-without-lstat]
- [ ] **#39 Parent symlinks**: Check parent directories too — [Manual review
      only]
- [ ] **Backup consideration**: Consider backup before destructive updates —
      [Manual review only]

### Reading Files

- [ ] **Try/catch required**: All `readFileSync` must be in try/catch — [ESLint:
      sonash/no-unguarded-file-read] [Semgrep:
      sonash.correctness.file-read-without-try-catch]
- [ ] **Path validation**: Validate path is within allowed directory first —
      [ESLint: sonash/no-path-startswith] [ESLint: sonash/no-empty-path-check]

---

## Git Operations

### git add

- [ ] **#31 Option injection**: Strip leading `-` from generated filenames —
      [Manual review only]
- [ ] **#31 Double-dash**: Always use `["add", "--", path]` — [Manual review
      only]
- [ ] **#40 Pathspec magic**: Block paths starting with `:` — [Manual review
      only]
- [ ] **#41 Repo root**: Validate path is within repository root — [Manual
      review only]
- [ ] **#38 No git add -A**: Never use `-A` in automation - explicit paths only
      — [Manual review only]

```javascript
// CORRECT
const { safeGitAdd } = require("./lib/security-helpers");
safeGitAdd(ROOT, relativePath);

// MANUAL
if (path.startsWith(":")) throw new Error("Pathspec magic blocked");
const resolved = path.resolve(ROOT, inputPath);
const rel = path.relative(ROOT, resolved);
if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
  throw new Error("Path outside repo");
}
execFileSync("git", ["add", "--", rel], { cwd: ROOT });
```

### git commit

- [ ] **#32 Temp file security**: Use `{ flag: "wx", mode: 0o600 }` for message
      file — [ESLint: sonash/no-non-atomic-write]
- [ ] **Cleanup**: Use `finally` block to delete temp files — [Manual review
      only]
- [ ] **Sanitize message**: No raw user input in commit messages — [Manual
      review only]

---

## User Input / CLI Arguments

### CLI Argument Parsing

- [ ] **Value validation**: Check value exists AND doesn't start with `--` —
      [Manual review only]
- [ ] **Type validation**: Parse and validate types (parseInt, etc.) — [Manual
      review only]
- [ ] **Range validation**: Check values are within expected bounds — [Manual
      review only]
- [ ] **#37 Empty fallback**: Handle empty/missing values gracefully — [ESLint:
      sonash/no-empty-path-check]

```javascript
// CORRECT
if (arg === "--since-review") {
  const next = args[i + 1];
  if (!next || next.startsWith("--")) {
    throw new Error("Missing value for --since-review");
  }
  const num = parseInt(next, 10);
  if (isNaN(num) || num < 1) {
    throw new Error("Invalid value");
  }
}
```

### User-Derived Filenames

- [ ] **#31 Strip dashes**: Remove leading `-` characters — [Manual review only]
- [ ] **Path separators**: Replace `/` and `\` with `_` — [Manual review only]
- [ ] **Special chars**: Remove or replace non-alphanumeric — [Manual review
      only]
- [ ] **#37 Length limit**: Cap at reasonable length (e.g., 60 chars) — [Manual
      review only]
- [ ] **#37 Empty fallback**: Provide default like `"UNNAMED"` — [ESLint:
      sonash/no-empty-path-check]

```javascript
const safeName =
  userInput
    .replace(/[/\\]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .replace(/^-+/, "")
    .slice(0, 60) || "UNNAMED";
```

---

## Generated Output

### Markdown Files

- [ ] **#33 Sanitize content**: Use `sanitizeDisplayString()` first — [Manual
      review only]
- [ ] **#35 Escape metacharacters**: Use `escapeMd()` for all dynamic content —
      [Manual review only]
- [ ] **#36 Symlink check**: Before writing generated Markdown — [ESLint:
      sonash/no-stat-without-lstat]

```javascript
// CORRECT - both sanitize AND escape
const { escapeMd } = require("./lib/security-helpers");
content += `## ${escapeMd(userTitle, 120)}\n`;
```

### JSON Files

- [ ] **#32 Exclusive creation**: Use `wx` flag for new files — [ESLint:
      sonash/no-non-atomic-write]
- [ ] **No sensitive data**: Don't include paths, credentials, PII — [ESLint:
      sonash/no-hardcoded-secrets]
- [ ] **#34 Relative paths**: Use relative paths, not absolute — [Manual review
      only]

### Log Output

- [ ] **#34 No absolute paths**: Use `path.relative()` before logging — [Manual
      review only]
- [ ] **Sanitize errors**: Use `sanitizeError()` for error messages — [ESLint:
      sonash/no-raw-error-log]
- [ ] **No credentials**: Never log tokens, passwords, keys — [ESLint:
      sonash/no-hardcoded-secrets]
- [ ] **Length limits**: Cap log messages to prevent DoS — [Manual review only]

---

## Path Validation

### Checking Path is Within Directory

- [ ] **#17, #18 Path traversal**: Use regex `/^\.\.(?:[\\/]|$)/` — [ESLint:
      sonash/no-path-startswith] [Semgrep: sonash.security.taint-path-traversal]
- [ ] **#41 Absolute check**: Also check `path.isAbsolute(rel)` — [ESLint:
      sonash/no-empty-path-check]
- [ ] **Empty check**: Handle `rel === ""` — [ESLint:
      sonash/no-empty-path-check]
- [ ] **Windows compatibility**: Use `[\\/]` not just `/` — [ESLint:
      sonash/no-path-startswith]

```javascript
// CORRECT
const { validatePathInDir } = require("./lib/security-helpers");
validatePathInDir(ROOT, userPath); // throws if invalid

// MANUAL
const resolved = path.resolve(baseDir, userPath);
const rel = path.relative(baseDir, resolved);
if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
  throw new Error("Path traversal blocked");
}
```

---

## Error Handling

### Error Messages

- [ ] **No raw paths**: Don't expose full filesystem paths — [Manual review
      only]
- [ ] **Sanitize errors**: Use `sanitizeError()` for logging — [ESLint:
      sonash/no-raw-error-log] [ESLint: sonash/no-unsafe-error-access]
- [ ] **Generic messages**: Use relative paths or generic descriptions — [Manual
      review only]

### Process Execution

- [ ] **execFileSync over execSync**: Avoid shell interpretation — [ESLint:
      sonash/no-shell-injection] [Semgrep:
      sonash.security.taint-user-input-to-exec]
- [ ] **Args array**: Use `["cmd", "arg1", "arg2"]` not template strings —
      [ESLint: sonash/no-shell-injection]
- [ ] **Error handling**: Catch and sanitize errors — [ESLint:
      sonash/no-unsafe-error-access]

---

## Critical Patterns (from CODE_PATTERNS.md)

These patterns cause the most severe issues. Check them first.

### Shell/Process Execution

- [ ] **printf over echo**: Use `printf '%s' "$VAR"` not `echo "$VAR"` (-n/-e
      injection) — [Manual review only]
- [ ] **Shell interpolation**: Never pass unsanitized input to shell commands —
      [ESLint: sonash/no-shell-injection] [Semgrep:
      sonash.security.taint-user-input-to-exec]
- [ ] **External input**: Never trust in execSync/spawn - validate first —
      [ESLint: sonash/no-shell-injection]
- [ ] **CLI arg separator**: Use `--` before file args: `script -- $FILES` —
      [Manual review only]
- [ ] **Quote shell arguments**: Always quote `$ARGS` in shell settings —
      [Manual review only]
- [ ] **npx --no-install**: Use `npx --no-install pkg` to prevent remote code
      fetch — [Manual review only]

```javascript
// CORRECT - args array, no shell interpretation
execFileSync("git", ["add", "--", validatedPath], { cwd: ROOT });

// WRONG - shell interpolation
execSync(`git add ${userPath}`); // Command injection risk!
```

### Regular Expressions

- [ ] **exec() loops with /g flag**: Global flag REQUIRED when using exec() in
      while loops — [Semgrep: sonash.correctness.regex-without-lastindex-reset]
- [ ] **Regex state leak**: Reset lastIndex before each iteration — [Semgrep:
      sonash.correctness.regex-without-lastindex-reset]
- [ ] **ReDoS protection**: Add heuristic detection for user-provided patterns —
      [ESLint: sonash/no-unbounded-regex]
- [ ] **Regex length limits**: Use `{1,64}` not `+` for bounded user input —
      [ESLint: sonash/no-unbounded-regex] [ESLint:
      sonash/no-unescaped-regexp-input]

```javascript
// CORRECT - reset lastIndex and use /g flag
antiPattern.pattern.lastIndex = 0;
let match;
while ((match = antiPattern.pattern.exec(content)) !== null) {
  // Process match
}

// WRONG - without /g, lastIndex never advances = infinite loop
const pattern = /foo/; // Missing 'g' flag!
while ((match = pattern.exec(str)) !== null) {
  /* infinite! */
}
```

### Symlink Guard Checklist

When adding ANY file operation (read, write, copy, delete, directory creation):

- [ ] **Use `resolve()` + containment check** — NOT `is_symlink()` alone.
      `is_symlink()` misses junctions and multi-hop symlinks. Always resolve the
      path and verify it stays within the expected directory tree.
- [ ] **Cover ALL operation types** — reads (`readFileSync`, `copyFileSync`),
      writes (`writeFileSync`, `renameSync`), deletes (`unlinkSync`, `rmSync`),
      and directory creation (`mkdirSync`).
- [ ] **Check directories too** — not just files. `lstatSync` on the target
      directory before creating/writing inside it.
- [ ] **Check parent directories** — symlinks anywhere in the path chain can
      redirect. Use `refuseSymlinkWithParents()` or manually check each
      ancestor.

```javascript
// CORRECT — resolve + containment (Python equivalent: resolve() + relative_to())
const resolved = path.resolve(baseDir, userPath);
const real = fs.realpathSync(resolved);
const rel = path.relative(baseDir, real);
if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
  throw new Error("Path escapes allowed directory");
}

// WRONG — is_symlink() alone (misses junctions, multi-hop)
if (fs.lstatSync(p).isSymbolicLink()) {
  /* insufficient */
}
```

**Source:** PR #419 retro (3 rounds of symlink hardening), PR #423 retro (3
rounds: is_symlink → resolve+relative_to upgrade).

### Path Security (Comprehensive)

- [ ] **Path containment check**: After resolve(), verify result stays within
      root — [ESLint: sonash/no-path-startswith] [Semgrep:
      sonash.security.taint-path-traversal]
- [ ] **Symlink escape**: Use `realpathSync()` after resolve() — [ESLint:
      sonash/no-stat-without-lstat]
- [ ] **Fail-closed realpath**: If realpathSync fails but file exists, reject —
      [Manual review only]
- [ ] **Normalize backslashes**: `.replace(/\\/g, '/')` before security checks —
      [Manual review only]
- [ ] **Cross-platform paths**: Use `path.relative()` not `startsWith()` —
      [ESLint: sonash/no-path-startswith]
- [ ] **Empty path edge case**: Check `rel === ''` — [ESLint:
      sonash/no-empty-path-check]
- [ ] **Windows cross-drive**: Check drive letters match before path.relative()
      — [Manual review only]
- [ ] **path.relative() trap**: `".."` returned without separator for `/a` to
      `/` — [Manual review only]

```javascript
// CORRECT - comprehensive path validation
const resolved = path.resolve(baseDir, userPath);
const rel = path.relative(baseDir, resolved);

// Check all edge cases
if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
  throw new Error("Path traversal blocked");
}

// Also check symlinks
refuseSymlinkWithParents(resolved);

// WRONG - incomplete checks
if (rel.startsWith("..")) {
  // False positive on files starting with ".."
  reject();
}
```

### Validator Design Principle

- [ ] **Dry-run mode from start** — Design validators and migration scripts with
      `--dry-run` mode from the beginning. This allows safe testing before
      destructive operations. Retrofitting dry-run is harder than building it
      in. Pattern: `if (dryRun) { console.log(\`Would: ${action}\`); } else {
      execute(); }`

### Data Safety

- [ ] **Prototype pollution**: Use `new Map()` or `Object.create(null)` for
      untrusted keys — [ESLint: sonash/no-object-assign-json]
- [ ] **Secure error logging**: Never log raw input content; log line numbers
      and char counts — [ESLint: sonash/no-raw-error-log]
- [ ] **JSONL parse resilience**: try/catch per line, continue with valid
      entries — [Manual review only]
- [ ] **Fail-fast validation**: Abort on parse errors to prevent silent data
      loss — [Manual review only]

```javascript
// CORRECT - safe key storage
const userPrefs = new Map();
userPrefs.set(untrustedKey, value);

// WRONG - prototype pollution risk
const userPrefs = {};
userPrefs[untrustedKey] = value; // __proto__ can pollute Object.prototype
```

### External Requests

- [ ] **SSRF allowlist**: Explicit hostname allowlist + protocol enforcement
      (HTTPS only) — [Manual review only]
- [ ] **URL protocol allowlist**: Validate against explicit protocol+host
      allowlist — [Manual review only]
- [ ] **External request timeout**: Use `AbortController` with explicit timeout
      on all fetch — [Manual review only]

```javascript
// CORRECT - explicit allowlist
const ALLOWED_HOSTS = ["api.github.com", "registry.npmjs.org"];
const url = new URL(userUrl);
if (!ALLOWED_HOSTS.includes(url.hostname) || url.protocol !== "https:") {
  throw new Error("URL not allowed");
}

// With timeout
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);
try {
  const res = await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timeout);
}
```

### Output Security

- [ ] **Markdown output**: Escape backticks, `${{ }}` — [Manual review only]
- [ ] **Hook output**: Only output safe metadata - never expose secrets —
      [ESLint: sonash/no-hardcoded-secrets]
- [ ] **.env files**: Never recommend committing - use environment vars —
      [Manual review only]
- [ ] **PII masking**: Use `maskEmail()` for privacy — [Manual review only]
- [ ] **Entity escaping order**: Escape `&` FIRST, then `<`, `>`, quotes —
      [Manual review only]
- [ ] **Bound output**: Limit count (e.g., `jq '.[0:50]'`) and length
      (`${VAR:0:500}`) — [Manual review only]

### File Read Safety

- [ ] **File reads with try/catch**: Wrap ALL file reads - existsSync has race
      conditions — [ESLint: sonash/no-unguarded-file-read] [ESLint:
      sonash/no-toctou-file-ops] [Semgrep:
      sonash.correctness.file-read-without-try-catch]
- [ ] **lstatSync**: Wrap in try-catch (permission denied, broken symlinks) —
      [ESLint: sonash/no-stat-without-lstat]
- [ ] **maxBuffer**: Set `10 * 1024 * 1024` for execSync with large output —
      [Manual review only]

```javascript
// CORRECT - handle errors by checking error.code
function safeReadFile(filePath, description) {
  try {
    return { success: true, content: readFileSync(filePath, "utf-8") };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { success: false, error: `${description} not found` };
    }
    return { success: false, error: sanitizeError(error) };
  }
}

// WRONG - existsSync has TOCTOU race condition
if (existsSync(path)) {
  const content = readFileSync(path); // File may be deleted between check and read!
}
```

### Production Safety

- [ ] **Defense-in-depth bypass**: Multi-condition:
      `bypass = flagSet && (isEmulator || !isProd)` — [Manual review only]
- [ ] **Production fail-closed**: Security features fail-closed in production —
      [Manual review only]
- [ ] **Third-party PII hygiene**: Set `captureToSentry: false` for logs
      containing IP/PII — [Manual review only]
- [ ] **O(n^2) algorithm DoS**: Truncate inputs to MAX_LENGTH before O(n^2)
      operations — [Manual review only]

---

## Enforcement Summary

**Last synced:** 2026-03-01 (Phase 6 GATE-06)

| Enforcement        | Items | Coverage |
| ------------------ | ----- | -------- |
| ESLint (sonash/\*) | 34    | 49%      |
| Semgrep            | 8     | 12%      |
| Manual review      | 38    | 55%      |

_Note: Some items have both ESLint and Semgrep enforcement (defense in depth).
Total annotations exceed 100% due to overlap._

**ESLint rules providing enforcement (eslint-plugin-sonash):**

- `sonash/no-unguarded-file-read` — File read try/catch
- `sonash/no-stat-without-lstat` — Symlink checks
- `sonash/no-toctou-file-ops` — TOCTOU race conditions
- `sonash/no-non-atomic-write` — Exclusive file creation
- `sonash/no-empty-path-check` — Empty path edge cases
- `sonash/no-path-startswith` — Cross-platform path validation
- `sonash/no-raw-error-log` — Error sanitization
- `sonash/no-unsafe-error-access` — Safe error.message access
- `sonash/no-shell-injection` — Shell command injection
- `sonash/no-hardcoded-secrets` — No hardcoded credentials
- `sonash/no-object-assign-json` — Prototype pollution
- `sonash/no-unbounded-regex` — ReDoS protection
- `sonash/no-unescaped-regexp-input` — Regex input escaping

**Semgrep rules providing enforcement:**

- `sonash.correctness.file-read-without-try-catch` — File read safety
- `sonash.correctness.no-race-condition-file-ops` — TOCTOU/symlink checks
- `sonash.correctness.regex-without-lastindex-reset` — Regex state leak
- `sonash.security.taint-path-traversal` — Path traversal detection
- `sonash.security.taint-user-input-to-exec` — Command injection
- `sonash.security.no-hardcoded-secrets` — Hardcoded secrets
- `sonash.security.no-innerhtml-assignment` — XSS via innerHTML

**Items requiring manual review only (no automated enforcement):**

- Git operation patterns (#31, #38, #40, #41) — helper-enforced via
  `safeGitAdd()`
- CLI argument parsing/validation — no automated static analysis
- Markdown sanitization/escaping — helper-enforced via `escapeMd()`
- SSRF/URL allowlisting — application-specific
- Production safety patterns — runtime behavior
- Shell script patterns (printf, quoting) — not lintable via ESLint

---

## Checklist Maintenance

When a PR review discovers a new security pattern:

1. **Add to this checklist** under the appropriate section
2. **Add to CODE_PATTERNS.md** with pattern number
3. **Add to check-pattern-compliance.js** if automatable
4. **Add to security-helpers.js** if reusable
5. **Run `/check-pattern-sync`** to verify consistency

---

## Version History

| Version | Date       | Patterns Added | Description                                                      |
| ------- | ---------- | -------------- | ---------------------------------------------------------------- |
| 1.2     | 2026-03-01 | --             | Add enforcement annotations (ESLint/Semgrep/Manual) per GATE-06  |
| 1.1     | 2026-02-23 | --             | Note templates up to #36 (as of 2026-02-22), update Last Updated |
| 1.1     | 2026-01-24 | 180+ patterns  | Enhanced with critical patterns from CODE_PATTERNS.md            |
| 1.0     | 2026-01-24 | #31-41         | Initial checklist from PR #310 review                            |
