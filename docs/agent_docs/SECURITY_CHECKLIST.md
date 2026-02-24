# Security Checklist for Scripts

**Document Version:** 1.1 **Last Updated:** 2026-02-23 **Status:** Active

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

- [ ] **#32 Exclusive creation**: Use `{ flag: "wx", mode: 0o600 }`
- [ ] **#36 Symlink check**: Call `refuseSymlinkWithParents(path)` before write
- [ ] **#39 Parent symlinks**: Check ALL parent directories, not just target
- [ ] **#37 Empty path fallback**: Provide default if sanitized name is empty

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

- [ ] **#36 Symlink check**: Verify target is not a symlink
- [ ] **#39 Parent symlinks**: Check parent directories too
- [ ] **Backup consideration**: Consider backup before destructive updates

### Reading Files

- [ ] **Try/catch required**: All `readFileSync` must be in try/catch
- [ ] **Path validation**: Validate path is within allowed directory first

---

## Git Operations

### git add

- [ ] **#31 Option injection**: Strip leading `-` from generated filenames
- [ ] **#31 Double-dash**: Always use `["add", "--", path]`
- [ ] **#40 Pathspec magic**: Block paths starting with `:`
- [ ] **#41 Repo root**: Validate path is within repository root
- [ ] **#38 No git add -A**: Never use `-A` in automation - explicit paths only

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
      file
- [ ] **Cleanup**: Use `finally` block to delete temp files
- [ ] **Sanitize message**: No raw user input in commit messages

---

## User Input / CLI Arguments

### CLI Argument Parsing

- [ ] **Value validation**: Check value exists AND doesn't start with `--`
- [ ] **Type validation**: Parse and validate types (parseInt, etc.)
- [ ] **Range validation**: Check values are within expected bounds
- [ ] **#37 Empty fallback**: Handle empty/missing values gracefully

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

- [ ] **#31 Strip dashes**: Remove leading `-` characters
- [ ] **Path separators**: Replace `/` and `\` with `_`
- [ ] **Special chars**: Remove or replace non-alphanumeric
- [ ] **#37 Length limit**: Cap at reasonable length (e.g., 60 chars)
- [ ] **#37 Empty fallback**: Provide default like `"UNNAMED"`

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

- [ ] **#33 Sanitize content**: Use `sanitizeDisplayString()` first
- [ ] **#35 Escape metacharacters**: Use `escapeMd()` for all dynamic content
- [ ] **#36 Symlink check**: Before writing generated Markdown

```javascript
// CORRECT - both sanitize AND escape
const { escapeMd } = require("./lib/security-helpers");
content += `## ${escapeMd(userTitle, 120)}\n`;
```

### JSON Files

- [ ] **#32 Exclusive creation**: Use `wx` flag for new files
- [ ] **No sensitive data**: Don't include paths, credentials, PII
- [ ] **#34 Relative paths**: Use relative paths, not absolute

### Log Output

- [ ] **#34 No absolute paths**: Use `path.relative()` before logging
- [ ] **Sanitize errors**: Use `sanitizeError()` for error messages
- [ ] **No credentials**: Never log tokens, passwords, keys
- [ ] **Length limits**: Cap log messages to prevent DoS

---

## Path Validation

### Checking Path is Within Directory

- [ ] **#17, #18 Path traversal**: Use regex `/^\.\.(?:[\\/]|$)/`
- [ ] **#41 Absolute check**: Also check `path.isAbsolute(rel)`
- [ ] **Empty check**: Handle `rel === ""`
- [ ] **Windows compatibility**: Use `[\\/]` not just `/`

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

- [ ] **No raw paths**: Don't expose full filesystem paths
- [ ] **Sanitize errors**: Use `sanitizeError()` for logging
- [ ] **Generic messages**: Use relative paths or generic descriptions

### Process Execution

- [ ] **execFileSync over execSync**: Avoid shell interpretation
- [ ] **Args array**: Use `["cmd", "arg1", "arg2"]` not template strings
- [ ] **Error handling**: Catch and sanitize errors

---

## 🔴 Critical Patterns (from CODE_PATTERNS.md)

These patterns cause the most severe issues. Check them first.

### Shell/Process Execution

- [ ] **🔴 printf over echo**: Use `printf '%s' "$VAR"` not `echo "$VAR"` (-n/-e
      injection)
- [ ] **🔴 Shell interpolation**: Never pass unsanitized input to shell commands
- [ ] **🔴 External input**: Never trust in execSync/spawn - validate first
- [ ] **🔴 CLI arg separator**: Use `--` before file args: `script -- $FILES`
- [ ] **🔴 Quote shell arguments**: Always quote `$ARGS` in shell settings
- [ ] **🔴 npx --no-install**: Use `npx --no-install pkg` to prevent remote code
      fetch

```javascript
// ✅ CORRECT - args array, no shell interpretation
execFileSync("git", ["add", "--", validatedPath], { cwd: ROOT });

// ❌ WRONG - shell interpolation
execSync(`git add ${userPath}`); // Command injection risk!
```

### Regular Expressions

- [ ] **🔴 exec() loops with /g flag**: Global flag REQUIRED when using exec()
      in while loops
- [ ] **🔴 Regex state leak**: Reset lastIndex before each iteration
- [ ] **🔴 ReDoS protection**: Add heuristic detection for user-provided
      patterns
- [ ] **🔴 Regex length limits**: Use `{1,64}` not `+` for bounded user input

```javascript
// ✅ CORRECT - reset lastIndex and use /g flag
antiPattern.pattern.lastIndex = 0;
let match;
while ((match = antiPattern.pattern.exec(content)) !== null) {
  // Process match
}

// ❌ WRONG - without /g, lastIndex never advances = infinite loop
const pattern = /foo/; // Missing 'g' flag!
while ((match = pattern.exec(str)) !== null) {
  /* infinite! */
}
```

### Path Security (Comprehensive)

- [ ] **🔴 Path containment check**: After resolve(), verify result stays within
      root
- [ ] **🔴 Symlink escape**: Use `realpathSync()` after resolve()
- [ ] **🔴 Fail-closed realpath**: If realpathSync fails but file exists, reject
- [ ] **🔴 Normalize backslashes**: `.replace(/\\/g, '/')` before security
      checks
- [ ] **🔴 Cross-platform paths**: Use `path.relative()` not `startsWith()`
- [ ] **🟡 Empty path edge case**: Check `rel === ''`
- [ ] **🟡 Windows cross-drive**: Check drive letters match before
      path.relative()
- [ ] **🟡 path.relative() trap**: `".."` returned without separator for `/a` →
      `/`

```javascript
// ✅ CORRECT - comprehensive path validation
const resolved = path.resolve(baseDir, userPath);
const rel = path.relative(baseDir, resolved);

// Check all edge cases
if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
  throw new Error("Path traversal blocked");
}

// Also check symlinks
refuseSymlinkWithParents(resolved);

// ❌ WRONG - incomplete checks
if (rel.startsWith("..")) {
  // False positive on files starting with ".."
  reject();
}
```

### Data Safety

- [ ] **🔴 Prototype pollution**: Use `new Map()` or `Object.create(null)` for
      untrusted keys
- [ ] **🔴 Secure error logging**: Never log raw input content; log line numbers
      and char counts
- [ ] **🟡 JSONL parse resilience**: try/catch per line, continue with valid
      entries
- [ ] **🟡 Fail-fast validation**: Abort on parse errors to prevent silent data
      loss

```javascript
// ✅ CORRECT - safe key storage
const userPrefs = new Map();
userPrefs.set(untrustedKey, value);

// ❌ WRONG - prototype pollution risk
const userPrefs = {};
userPrefs[untrustedKey] = value; // __proto__ can pollute Object.prototype
```

### External Requests

- [ ] **🔴 SSRF allowlist**: Explicit hostname allowlist + protocol enforcement
      (HTTPS only)
- [ ] **🔴 URL protocol allowlist**: Validate against explicit protocol+host
      allowlist
- [ ] **🟡 External request timeout**: Use `AbortController` with explicit
      timeout on all fetch

```javascript
// ✅ CORRECT - explicit allowlist
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

- [ ] **🔴 Markdown output**: Escape backticks, `${{ }}`
- [ ] **🔴 Hook output**: Only output safe metadata - never expose secrets
- [ ] **🔴 .env files**: Never recommend committing - use environment vars
- [ ] **🔴 PII masking**: Use `maskEmail()` → `u***@d***.com` for privacy
- [ ] **🟡 Entity escaping order**: Escape `&` FIRST, then `<`, `>`, quotes
- [ ] **🟡 Bound output**: Limit count (e.g., `jq '.[0:50]'`) and length
      (`${VAR:0:500}`)

### File Read Safety

- [ ] **🔴 File reads with try/catch**: Wrap ALL file reads - existsSync has
      race conditions
- [ ] **🟡 lstatSync**: Wrap in try-catch (permission denied, broken symlinks)
- [ ] **🟡 maxBuffer**: Set `10 * 1024 * 1024` for execSync with large output

```javascript
// ✅ CORRECT - handle errors by checking error.code
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

// ❌ WRONG - existsSync has TOCTOU race condition
if (existsSync(path)) {
  const content = readFileSync(path); // File may be deleted between check and read!
}
```

### Production Safety

- [ ] **🔴 Defense-in-depth bypass**: Multi-condition:
      `bypass = flagSet && (isEmulator || !isProd)`
- [ ] **🔴 Production fail-closed**: Security features fail-closed in production
- [ ] **🔴 Third-party PII hygiene**: Set `captureToSentry: false` for logs
      containing IP/PII
- [ ] **🔴 O(n²) algorithm DoS**: Truncate inputs to MAX_LENGTH before O(n²)
      operations

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
| 1.1     | 2026-02-23 | —              | Note templates up to #36 (as of 2026-02-22), update Last Updated |
| 1.1     | 2026-01-24 | 180+ patterns  | Enhanced with critical patterns from CODE_PATTERNS.md            |
| 1.0     | 2026-01-24 | #31-41         | Initial checklist from PR #310 review                            |
