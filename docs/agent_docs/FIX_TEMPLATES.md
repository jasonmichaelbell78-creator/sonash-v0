# Fix Templates for Qodo PR Review Findings

<!-- prettier-ignore-start -->
**Document Version:** 1.4
**Last Updated:** 2026-02-16
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Purpose

Copy-paste fix templates for the top 26 most common Qodo PR review findings in
the SoNash codebase. Each template is self-contained: paste the "Good Code"
block directly into the flagged location. Project-specific helpers are
referenced where available.

Helpers used throughout:

- `sanitizeError()` from `scripts/lib/sanitize-error.js` (ESM) or
  `scripts/lib/security-helpers.js` (CJS)
- `safeCloneObject()` inline pattern (deep clone without prototype)
- `safeReadFile()`, `validatePathInDir()`, `refuseSymlinkWithParents()`,
  `escapeMd()`, `safeRegexExec()` from `scripts/lib/security-helpers.js`

---

## Template 1: readFileSync Without try/catch

**Triggered by**: Qodo "Secure File I/O" / "Error Handling" **Severity**:
CRITICAL **Review frequency**: 23 occurrences

### Bad Code

```javascript
const data = fs.readFileSync(filePath, "utf-8");
```

### Good Code

```javascript
const { safeReadFile } = require("./lib/security-helpers");

const result = safeReadFile(filePath, "config file");
if (!result.success) {
  console.warn(`[script-name] ${result.error}`);
  return fallbackValue;
}
const data = result.content;
```

Or without the helper:

```javascript
let data;
try {
  data = fs.readFileSync(filePath, "utf-8");
} catch (err) {
  if (err.code === "ENOENT") {
    console.warn(`[script-name] File not found: ${path.basename(filePath)}`);
    return fallbackValue;
  }
  throw err;
}
```

### Common Mistakes When Fixing

- Using `existsSync()` before `readFileSync()` -- this is a TOCTOU race
  (Template 11)
- Logging the full file path in the catch block -- triggers PII finding
  (Template 15)
- Swallowing the error with an empty catch -- triggers silent catch finding
  (Template 10)

---

## Template 2: Path Traversal Using startsWith("..")

**Triggered by**: Qodo "Path Traversal Prevention" **Severity**: CRITICAL
**Review frequency**: 18 occurrences

### Bad Code

```javascript
if (rel.startsWith("..")) {
  throw new Error("Path traversal detected");
}
```

### Good Code

```javascript
const { validatePathInDir } = require("./lib/security-helpers");

// Throws if path escapes baseDir
const safePath = validatePathInDir(baseDir, userPath);
```

Or inline:

```javascript
const rel = path.relative(baseDir, path.resolve(baseDir, userPath));
if (/^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
  throw new Error("Path traversal detected");
}
```

### Common Mistakes When Fixing

- Forgetting to handle the empty-string case (`rel === ""` means same dir)
- Using `startsWith()` with a separator but not both `\` and `/` on Windows
- Not resolving the path before calling `path.relative()`

---

## Template 3: Unsafe error.message Access

**Triggered by**: Qodo "Secure Error Handling" **Severity**: CRITICAL **Review
frequency**: 16 occurrences

### Bad Code

```javascript
} catch (err) {
  console.error("Failed:", err.message);
}
```

### Good Code

```javascript
// ESM scripts
import { sanitizeError } from "./lib/sanitize-error.js";

} catch (err) {
  console.error("Failed:", sanitizeError(err));
}
```

```javascript
// CJS scripts
const { sanitizeError } = require("./lib/security-helpers");

} catch (err) {
  console.error("Failed:", sanitizeError(err));
}
```

### Common Mistakes When Fixing

- Calling `err.message` inside `sanitizeError()` -- pass the whole error object
- Using `String(err)` instead of the helper -- still leaks paths and stack
- Using template literals that include the raw error before sanitization

---

## Template 4: Unguarded loadConfig() Calls

**Triggered by**: Qodo "Error Handling" / "Resilient Configuration"
**Severity**: MAJOR **Review frequency**: 15 occurrences

### Bad Code

```javascript
const config = loadConfig();
doWork(config.setting);
```

### Good Code

```javascript
let config;
try {
  config = loadConfig();
} catch (err) {
  console.warn(
    `[script-name] Config load failed, using defaults: ${sanitizeError(err)}`
  );
  config = { setting: defaultValue };
}
doWork(config.setting);
```

### Common Mistakes When Fixing

- Defining defaults that do not match the config schema shape
- Catching but then still accessing `config.setting` when config is undefined
- Not logging the fallback -- makes debugging silent failures harder

---

## Template 5: Symlink Attack via Missing lstatSync()

**Triggered by**: Qodo "Symlink Protection" / "TOCTOU File Safety" **Severity**:
CRITICAL **Review frequency**: 14 occurrences

### Bad Code

```javascript
if (fs.statSync(filePath).isFile()) {
  fs.writeFileSync(filePath, content);
}
```

### Good Code

```javascript
const {
  refuseSymlinkWithParents,
  safeWriteFile,
} = require("./lib/security-helpers");

refuseSymlinkWithParents(filePath);
safeWriteFile(filePath, content, { allowOverwrite: true });
```

Or inline:

```javascript
const stat = fs.lstatSync(filePath);
if (stat.isSymbolicLink()) {
  throw new Error("Refusing to write through symlink");
}
if (stat.isFile()) {
  fs.writeFileSync(filePath, content, { mode: 0o600 });
}
```

### Common Mistakes When Fixing

- Only checking the file itself, not parent directories (use
  `refuseSymlinkWithParents` to check the full chain)
- Using `statSync` instead of `lstatSync` -- `statSync` follows symlinks
- Checking lstat but then writing with a race window between check and write

---

## Template 6: Stateful /g Flag with .test()

**Triggered by**: Qodo "Regex State Leak" **Severity**: MAJOR **Review
frequency**: 13 occurrences

### Bad Code

```javascript
const pattern = /foo/g;
if (pattern.test(str1)) {
  /* ... */
}
if (pattern.test(str2)) {
  /* UNRELIABLE - lastIndex carried over */
}
```

### Good Code

Option A -- Remove `/g` flag when using `.test()`:

```javascript
const pattern = /foo/;
if (pattern.test(str1)) {
  /* ... */
}
if (pattern.test(str2)) {
  /* works correctly */
}
```

Option B -- Reset `lastIndex` before each use:

```javascript
const pattern = /foo/g;
pattern.lastIndex = 0;
if (pattern.test(str1)) {
  /* ... */
}
pattern.lastIndex = 0;
if (pattern.test(str2)) {
  /* works correctly */
}
```

### Common Mistakes When Fixing

- Removing `/g` from a pattern that is also used in `exec()` loops elsewhere
- Sharing a global-scoped regex across multiple functions without resetting
- Using `matchAll()` on a regex without `/g` -- it throws

---

## Template 7: Atomic Writes Missing tmp+rename

**Triggered by**: Qodo "Atomic File Writes" **Severity**: MAJOR **Review
frequency**: 13 occurrences

### Bad Code

```javascript
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
```

### Good Code

```javascript
const os = require("node:os");
const tmpFile = path.join(
  os.tmpdir(),
  `${path.basename(outputPath)}.${process.pid}.${Date.now()}.tmp`
);

try {
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
  fs.renameSync(tmpFile, outputPath);
} catch (err) {
  // Clean up temp file on failure
  try {
    fs.unlinkSync(tmpFile);
  } catch {
    /* ignore cleanup error */
  }
  throw err;
}
```

### Common Mistakes When Fixing

- Placing the tmp file in the same directory without cleanup on error
- Using `copyFileSync` + `unlinkSync` instead of `renameSync` (not atomic)
- Cross-device rename failure -- tmp file must be on the same filesystem as
  target (use `path.dirname(outputPath)` instead of `os.tmpdir()` if needed)

---

## Template 8: Prototype Pollution via Object.assign on Parsed JSON

**Triggered by**: Qodo "Prototype Pollution Prevention" **Severity**: CRITICAL
**Review frequency**: 12 occurrences

### Bad Code

```javascript
const parsed = JSON.parse(line);
const merged = Object.assign({}, defaults, parsed);
```

### Good Code

```javascript
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function safeCloneObject(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  const result = {};
  for (const key of Object.keys(obj)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    const val = obj[key];
    result[key] =
      typeof val === "object" && val !== null ? safeCloneObject(val) : val;
  }
  return result;
}

const parsed = JSON.parse(line);
const safe = safeCloneObject(parsed);
const merged = { ...defaults, ...safe };
```

### Common Mistakes When Fixing

- Only filtering top-level keys -- nested `__proto__` still pollutes
- Using `structuredClone()` -- it preserves prototype-polluting keys
- Forgetting to handle arrays inside the recursive clone

---

## Template 9: Path Containment via startsWith() Without Separator

**Triggered by**: Qodo "Path Containment Bypass" **Severity**: CRITICAL **Review
frequency**: 11 occurrences

### Bad Code

```javascript
const resolved = path.resolve(userPath);
if (!resolved.startsWith(allowedDir)) {
  throw new Error("Access denied");
}
// BUG: "/allowed-dir-extra/secret" passes the check
```

### Good Code

```javascript
const { validatePathInDir } = require("./lib/security-helpers");

const safePath = validatePathInDir(allowedDir, userPath);
// safePath is a validated relative path within allowedDir
```

Or inline:

```javascript
const resolved = path.resolve(userPath);
const rel = path.relative(allowedDir, resolved);
if (!rel || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
  throw new Error("Access denied");
}
```

### Common Mistakes When Fixing

- Adding a trailing separator to `allowedDir` -- breaks on Windows backslash
- Using `includes()` instead of `path.relative()` -- still bypassable
- Not normalizing both paths before comparison

---

## Template 10: Silent Catch Blocks

**Triggered by**: Qodo "Silent Error Suppression" **Severity**: MAJOR **Review
frequency**: 11 occurrences

### Bad Code

```javascript
try {
  doSomething();
} catch {
  // silently swallowed
}
```

### Good Code

```javascript
try {
  doSomething();
} catch (err) {
  console.warn(`[script-name] doSomething failed: ${sanitizeError(err)}`);
}
```

If the silence is truly intentional (e.g., cleanup), add an explicit comment:

```javascript
try {
  fs.unlinkSync(tmpFile);
} catch {
  // Intentional: cleanup failure is non-critical
}
```

### Common Mistakes When Fixing

- Logging raw `err.message` -- triggers unsafe error access finding (Template 3)
- Using `console.error` for non-fatal errors -- use `console.warn` instead
- Adding logging to intentional silence (e.g., optional cleanup) that clutters
  output

---

## Template 11: TOCTOU Race in File Operations

**Triggered by**: Qodo "TOCTOU Race Condition" **Severity**: MAJOR **Review
frequency**: 10 occurrences

### Bad Code

```javascript
if (fs.existsSync(filePath)) {
  const data = fs.readFileSync(filePath, "utf-8");
  process(data);
}
```

### Good Code

```javascript
const { safeReadFile } = require("./lib/security-helpers");

const result = safeReadFile(filePath, "data file");
if (result.success) {
  process(result.content);
}
```

Or inline:

```javascript
let data;
try {
  data = fs.readFileSync(filePath, "utf-8");
} catch (err) {
  if (err.code === "ENOENT") return; // File does not exist
  throw err;
}
process(data);
```

### Common Mistakes When Fixing

- Catching all errors instead of checking `err.code` -- hides permission errors
- Replacing `existsSync` in a write path but not using atomic writes
  (Template 7)
- Using `accessSync` as a replacement -- same TOCTOU problem

---

## Template 12: Regex DoS via Unbounded Quantifiers

**Triggered by**: Qodo "ReDoS Prevention" **Severity**: MAJOR **Review
frequency**: 10 occurrences

### Bad Code

```javascript
const pattern = /^(a+)+$/;
const userPattern = new RegExp(`.*${userInput}.*`);
```

### Good Code

```javascript
// Bound quantifiers
const pattern = /^a{1,100}$/;

// Cap input length before regex
const safeInput = userInput.slice(0, 200);
const escaped = safeInput.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const userPattern = new RegExp(escaped);
```

### Common Mistakes When Fixing

- Setting bounds too high (e.g., `{0,100000}`) -- still slow on adversarial
  input
- Escaping the input but not bounding the overall match length
- Using `.*` in the replacement pattern -- add `{0,N}` bounds instead

---

## Template 13: Missing BOM Handling in JSONL

**Triggered by**: Qodo "BOM-Safe File Parsing" **Severity**: MINOR **Review
frequency**: 9 occurrences

### Bad Code

```javascript
const lines = fs.readFileSync(filePath, "utf-8").split("\n");
for (const line of lines) {
  const obj = JSON.parse(line); // throws on BOM-prefixed first line
}
```

### Good Code

```javascript
let raw;
try {
  raw = fs.readFileSync(filePath, "utf-8");
} catch (err) {
  console.warn(`[script-name] Failed to read file: ${sanitizeError(err)}`);
  return;
}

// Strip BOM if present
if (raw.charCodeAt(0) === 0xfeff) {
  raw = raw.slice(1);
}

const lines = raw.split("\n").filter((l) => l.trim());
for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    // process obj
  } catch {
    console.warn(`[script-name] Skipping malformed JSONL line`);
  }
}
```

### Common Mistakes When Fixing

- Only stripping BOM on the raw string but not trimming individual lines
- Using `line.replace(/^\uFEFF/, "")` on every line -- wasteful, BOM only
  appears on the first line
- Not filtering empty lines from `split("\n")` -- causes `JSON.parse("")` errors

---

## Template 14: Markdown Injection in Output

**Triggered by**: Qodo "Markdown Injection Prevention" **Severity**: MINOR
**Review frequency**: 9 occurrences

### Bad Code

```javascript
const row = `| ${item.title} | ${item.description} |`;
output += row + "\n";
```

### Good Code

```javascript
const { escapeMd } = require("./lib/security-helpers");

const row = `| ${escapeMd(item.title)} | ${escapeMd(item.description)} |`;
output += row + "\n";
```

Or inline:

```javascript
function escapeMd(str) {
  return String(str || "")
    .replace(/[\\[\]()_*`#>!-]/g, "\\$&")
    .slice(0, 100);
}

const row = `| ${escapeMd(item.title)} | ${escapeMd(item.description)} |`;
output += row + "\n";
```

### Common Mistakes When Fixing

- Only escaping `|` for tables but not other Markdown metacharacters
- Not truncating user input -- long strings break table layout
- Escaping content that will be rendered as code blocks (double-escaping)

---

## Template 15: PII via Raw Error Messages in Logs

**Triggered by**: Qodo "Secure Logging Practices" / "PII in Logs" **Severity**:
CRITICAL **Review frequency**: 9 occurrences

### Bad Code

```javascript
console.error(`Operation failed for ${email}: ${err.message}`);
console.log(`Processing file: ${filePath}`);
```

### Good Code

```javascript
const { sanitizeError, maskEmail } = require("./lib/security-helpers");

console.error(
  `Operation failed for ${maskEmail(email)}: ${sanitizeError(err)}`
);
console.log(`Processing file: ${path.basename(filePath)}`);
```

### Common Mistakes When Fixing

- Using `sanitizeError` on the error but still logging full file paths
- Masking in console output but not in structured log objects
- Logging user IDs that can be correlated back to PII in other systems

---

## Template 16: Missing Array.isArray Guard

**Triggered by**: Qodo "Type Safety" / "Defensive Programming" **Severity**:
MINOR **Review frequency**: 8 occurrences

### Bad Code

```javascript
const items = config.items;
items.forEach((item) => process(item));
```

### Good Code

```javascript
const items = config.items;
if (!Array.isArray(items)) {
  console.warn(
    "[script-name] Expected items to be an array, got:",
    typeof items
  );
  return;
}
items.forEach((item) => process(item));
```

### Common Mistakes When Fixing

- Using `typeof items === "object"` -- arrays and null are both objects
- Defaulting to `[]` silently without logging -- hides config errors
- Not guarding downstream `.length` or `.map()` calls on the same variable

---

## Template 17: Regex with Missing Escape

**Triggered by**: Qodo "Regex Injection Prevention" **Severity**: MAJOR **Review
frequency**: 8 occurrences

### Bad Code

```javascript
const pattern = new RegExp(userInput);
if (pattern.test(content)) {
  /* ... */
}
```

### Good Code

```javascript
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const safeInput = escapeRegex(userInput.slice(0, 200));
const pattern = new RegExp(safeInput);
if (pattern.test(content)) {
  /* ... */
}
```

### Common Mistakes When Fixing

- Escaping but not bounding the input length -- still allows ReDoS (Template 12)
- Using the escaped string in a template with unescaped quantifiers around it
- Forgetting to escape the backslash itself (must be first in the character
  class or handled separately)

---

## Template 18: Missing /g Flag in exec() Loop

**Triggered by**: Qodo "Infinite Loop Prevention" / "Regex exec() Safety"
**Severity**: CRITICAL **Review frequency**: 7 occurrences

### Bad Code

```javascript
const pattern = /(\w+)=(\w+)/; // missing /g
let match;
while ((match = pattern.exec(content)) !== null) {
  // INFINITE LOOP: lastIndex never advances without /g
}
```

### Good Code

```javascript
const { safeRegexExec } = require("./lib/security-helpers");

const pattern = /(\w+)=(\w+)/g;
const matches = safeRegexExec(pattern, content);
for (const match of matches) {
  console.log(match[1], match[2]);
}
```

Or use `matchAll()`:

```javascript
const pattern = /(\w+)=(\w+)/g;
for (const match of content.matchAll(pattern)) {
  console.log(match[1], match[2]);
}
```

### Common Mistakes When Fixing

- Adding `/g` but reusing the same regex object across calls without resetting
  `lastIndex` (Template 6)
- Using `safeRegexExec` without the `/g` flag -- it throws by design
- Not handling zero-length matches which can also cause infinite loops even with
  `/g`

---

## Template 19: Unbounded Input DoS

**Triggered by**: Qodo "Input Size Limits" / "DoS Prevention" **Severity**:
MAJOR **Review frequency**: 7 occurrences

### Bad Code

```javascript
const content = fs.readFileSync(inputPath, "utf-8");
const parsed = JSON.parse(content);
```

### Good Code

```javascript
const MAX_FILE_SIZE = 50 * 1024; // 50 KB
const MAX_STRING_LENGTH = 4096;

let content;
try {
  const stat = fs.statSync(inputPath);
  if (stat.size > MAX_FILE_SIZE) {
    throw new Error(`File exceeds ${MAX_FILE_SIZE} byte limit`);
  }
  content = fs.readFileSync(inputPath, "utf-8");
} catch (err) {
  console.warn(`[script-name] Read failed: ${sanitizeError(err)}`);
  return;
}

const parsed = JSON.parse(content);

// Truncate string fields from parsed input
if (typeof parsed.description === "string") {
  parsed.description = parsed.description.slice(0, MAX_STRING_LENGTH);
}
```

### Common Mistakes When Fixing

- Checking file size but not bounding individual string fields after parsing
- Using `stat.size` check but still reading the entire file into memory first
- Setting limits too generous for the use case (e.g., 100MB for a config file)

---

## Template 20: Git Command Without -- Separator

**Triggered by**: Qodo "Git Command Injection" / "Option Injection"
**Severity**: MAJOR **Review frequency**: 7 occurrences

### Bad Code

```javascript
execSync(`git add ${filePath}`);
execSync(`git log ${branch}`);
```

### Good Code

```javascript
const { safeGitAdd } = require("./lib/security-helpers");

// For git add
safeGitAdd(repoRoot, filePath);

// For other git commands, use execFileSync with -- separator
const { execFileSync } = require("node:child_process");
execFileSync("git", ["log", "--", branch], { cwd: repoRoot });
execFileSync("git", ["diff", "--", filePath], { cwd: repoRoot });
```

### Common Mistakes When Fixing

- Using `execSync` with string interpolation -- still vulnerable to shell
  injection; use `execFileSync` with an array of arguments
- Placing `--` before flags instead of before file/path arguments
- Not validating that `filePath` does not start with `-` (use pathspec magic
  check: reject paths starting with `:`)
- Not passing `cwd` to git commands -- operates on wrong repo

---

## Template 21: SonarCloud Regex Complexity (S5852)

**Triggered by**: SonarCloud "Regular expression complexity" **Severity**: MAJOR
(CI-blocking) **Review frequency**: 5 occurrences in PR #365

### Strategy (Two-Strikes Rule)

1. First flag: Factor common prefixes, use bounded quantifiers `{0,N}`
2. Second flag on same regex: **REPLACE with string parsing** — do not patch

### Bad Code (complex regex for section extraction)

```javascript
const match = content.match(
  /## Version History[\s\S]{0,20000}?(?=\r?\n##|\r?\n---|$)/
);
```

### Good Code (line-by-line string parsing)

```javascript
const lines = content.split(/\r?\n/);
let sectionStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (/^##\s/.test(lines[i]) && /version history/i.test(lines[i])) {
    sectionStart = i;
    break;
  }
}
// Scan from sectionStart+1 until next ## or ---
let sectionEnd = lines.length;
for (let i = sectionStart + 1; i < lines.length; i++) {
  if (/^##\s/.test(lines[i]) || /^---/.test(lines[i])) {
    sectionEnd = i;
    break;
  }
}
const section = lines.slice(sectionStart, sectionEnd).join("\n");
```

---

## Template 22: Windows-Safe Atomic Write

**Triggered by**: Qodo "Atomic write" / "rename fails on Windows" **Severity**:
MINOR **Review frequency**: 3 occurrences in PR #365

### Bad Code

```javascript
writeFileSync(targetPath, data);
// OR (fails on Windows when target exists):
writeFileSync(tmpPath, data);
renameSync(tmpPath, targetPath);
```

### Good Code

```javascript
const tmpPath = `${targetPath}.tmp`;
writeFileSync(tmpPath, data, "utf-8");
if (existsSync(targetPath)) unlinkSync(targetPath);
renameSync(tmpPath, targetPath);
```

### Common Mistakes When Fixing

- Not cleaning up the temp file on error (use try/finally)
- Using `rmSync` instead of `unlinkSync` for single files
- Forgetting that `renameSync` across different drives/volumes always fails on
  Windows

---

## Template 23: Pattern Propagation (Codebase-Wide Fix)

**Triggered by**: Qodo finds the same issue in a new file each review round
**Severity**: PROCESS **Review frequency**: PR #366 R4-R7 symlink guard
ping-pong (4 rounds, ~40 items for what should have been 1 round)

This is NOT a code template — it's a **workflow template** for when a fix needs
to be applied everywhere, not just where Qodo pointed.

### When to Use

- Qodo flags a missing guard/check/pattern in file A
- The same unguarded pattern exists in files B, C, D, ..., N
- Fixing only file A guarantees Qodo will flag file B next round

### Workflow

```bash
# 1. Fix the reported instance first
# 2. Determine what the UNFIXED pattern looks like
# 3. Search the entire codebase for all instances:

# Example: find all atomic writes missing symlink guard
grep -rn "writeFileSync\|renameSync\|appendFileSync" \
  .claude/hooks/ scripts/ --include="*.js" | grep -v "isSafeToWrite"

# Example: find all readFileSync without try/catch
grep -rn "readFileSync" .claude/hooks/ scripts/ --include="*.js" \
  -B2 | grep -v "try"

# 4. Fix ALL instances in one commit
# 5. If you created a shared helper, verify every file imports it
```

### Common Search Patterns

| Issue                 | Search for unfixed instances                       |
| --------------------- | -------------------------------------------------- |
| Missing symlink       | `writeFileSync` without nearby `isSafeToWrite`     |
| Missing try/catch     | `readFileSync` without surrounding `try`           |
| statSync vs lstatSync | `statSync` (should be `lstatSync`)                 |
| Inline vs shared      | Old inline check that should use new shared helper |
| Missing validation    | Function calls without preceding guard             |

### Common Mistakes

- Fixing only the reported file, not searching codebase-wide
- Searching the target file but not the `.tmp` file path
- Applying a shared helper to consolidated files but missing standalone copies
- Not checking files in `scripts/` when the fix was in `.claude/hooks/`

---

## Template 24: Atomic Write — tmpPath Symlink Guard

**Triggered by**: "Guard temporary state-file writes" or "symlink guard on tmp
path" **Severity**: MAJOR **Review frequency**: 5x (PR #366 R4-R8)

Every atomic write (tmp + rm + rename) needs `isSafeToWrite()` on **both** the
target file AND the `.tmp` file. Missing the tmp guard is the most common miss.

### Pattern (Before — Missing tmp guard)

```javascript
const tmpPath = `${statePath}.tmp`;
try {
  if (!isSafeToWrite(statePath)) return; // Target guarded
  // ❌ tmpPath NOT guarded — symlink attack vector
  fs.writeFileSync(tmpPath, JSON.stringify(data));
  fs.rmSync(statePath, { force: true });
  fs.renameSync(tmpPath, statePath);
```

### Fix (After — Both guarded)

```javascript
const tmpPath = `${statePath}.tmp`;
try {
  if (!isSafeToWrite(statePath)) return;
  if (!isSafeToWrite(tmpPath)) return; // ✅ BOTH paths guarded
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(tmpPath, JSON.stringify(data));
  try {
    fs.rmSync(statePath, { force: true });
  } catch {
    /* best-effort */
  }
  fs.renameSync(tmpPath, statePath);
} catch {
  try {
    fs.rmSync(tmpPath, { force: true });
  } catch {
    /* cleanup */
  }
}
```

### Import

```javascript
const { isSafeToWrite } = require("./lib/symlink-guard");
// or for scripts:
const { isSafeToWrite } = require("../.claude/hooks/lib/symlink-guard");
```

### Propagation Check

After applying this fix, search for ALL atomic write paths:

```bash
grep -rn '\.tmp[`"'"'"']' .claude/hooks/ scripts/ --include="*.js" | grep -v isSafeToWrite
```

---

## Template 25: SKIP_REASON Full Validation Chain

**Triggered by**: Qodo "Input Validation" / SonarCloud "codePointAt"
**Severity**: MAJOR **Review frequency**: PR #367 R4-R7 (4 rounds of progressive
hardening)

### Bad Code (incomplete validation)

```javascript
if (!process.env.SKIP_REASON) {
  console.error("Need a reason");
  process.exit(1);
}
```

### Good Code (shared module)

```javascript
const { validateSkipReason } = require("./lib/validate-skip-reason");

const result = validateSkipReason(process.env.SKIP_REASON, "SKIP_CHECK_NAME=1");
if (!result.valid) {
  console.error(result.error);
  process.exit(1);
}
const reason = result.reason; // trimmed, validated
```

### What the Shared Module Validates

1. **Type check** — `typeof rawReason === "string"`
2. **Trim** — Strips whitespace
3. **Empty check** — Requires non-empty after trim
4. **Single-line** — Rejects CR/LF (prevents JSONL injection)
5. **Control chars** — Rejects `\u0000-\u001f` and `\u007f` via `codePointAt`
6. **Length limit** — Max 500 chars (prevents DoS)

### Shell Equivalent (for .husky/ hooks)

```bash
# Reject control characters (POSIX-safe)
if printf '%s' "$SKIP_REASON" | LC_ALL=C grep -q '[[:cntrl:]]'; then
  echo "  ❌ SKIP_REASON must not contain control characters"
  exit 1
fi
# Length limit
skip_len=${#SKIP_REASON}
if [ "$skip_len" -gt 500 ]; then
  echo "  ❌ SKIP_REASON must be <= 500 characters (got $skip_len)"
  exit 1
fi
```

### Propagation Check

After applying this fix, search for ALL SKIP_REASON consumers:

```bash
grep -rn 'SKIP_REASON' scripts/ .claude/hooks/ .husky/ --include="*.js" --include="*.sh"
```

---

## Template 26: POSIX Shell Portability

**Triggered by**: Qodo "Shell Compatibility" / SonarCloud POSIX warnings
**Severity**: MINOR **Review frequency**: PR #367 R4-R6 (3 rounds of progressive
POSIX fixes)

### Common Non-POSIX Constructs

| Non-POSIX (Bash-only)    | POSIX Replacement                                |
| ------------------------ | ------------------------------------------------ |
| `grep -P '\r'`           | `cr="$(printf '\r')"; grep -q "$cr"`             |
| `$'\r'` (ANSI-C quoting) | `cr="$(printf '\r')"`                            |
| `[[ ... ]]`              | `[ ... ]`                                        |
| `grep -P` (Perl regex)   | `grep -E` (ERE) or `LC_ALL=C grep '[[:cntrl:]]'` |
| `local` in non-function  | Define in function scope only                    |
| `source file`            | `. file`                                         |

### CR Detection (Correct)

```bash
# ✅ POSIX-safe — works in dash, ash, sh
cr="$(printf '\r')"
if printf '%s' "$VAR" | grep -Fq "$cr"; then
  echo "Contains carriage return"
fi
```

### Control Character Detection (Correct)

```bash
# ✅ POSIX-safe — LC_ALL=C ensures [:cntrl:] works consistently
if printf '%s' "$VAR" | LC_ALL=C grep -q '[[:cntrl:]]'; then
  echo "Contains control characters"
fi
```

### EXIT Trap Chaining (Correct)

```bash
# ✅ POSIX-safe helper — chains without overwriting
add_exit_trap() {
  prev="$(trap -p EXIT 2>/dev/null || true)"
  case "$prev" in
    *"EXIT"*)
      prev_cmd=$(printf '%s' "$prev" | sed "s/^[^']*'\(.*\)'[^']*EXIT.*/\1/")
      trap "${prev_cmd}; $1" EXIT
      ;;
    *)
      trap "$1" EXIT
      ;;
  esac
}

TMPFILE="$(mktemp)" || { echo "Failed to create temp file"; exit 1; }
add_exit_trap 'rm -f "$TMPFILE" 2>/dev/null'
```

### Propagation Check

After fixing POSIX issues, verify all hook scripts:

```bash
# Check for bash-specific constructs in POSIX sh scripts
grep -rn '\$'"'"'\\' .husky/ --include="*.sh" 2>/dev/null  # ANSI-C quoting
grep -rn 'grep -P' .husky/ scripts/ --include="*.sh" 2>/dev/null  # Perl regex
grep -rn '\[\[' .husky/ --include="*.sh" 2>/dev/null  # Double brackets
```

---

## Version History

| Version | Date       | Change                                                                                              |
| ------- | ---------- | --------------------------------------------------------------------------------------------------- |
| 1.4     | 2026-02-16 | Add Templates 25-26 (SKIP_REASON validation chain, POSIX shell portability). Source: PR #367 retro. |
| 1.3     | 2026-02-15 | Add Template 24 (tmpPath symlink guard)                                                             |
| 1.2     | 2026-02-15 | Add Template 23 (pattern propagation workflow)                                                      |
| 1.1     | 2026-02-14 | Add Templates 21-22 (regex complexity, atomic write)                                                |
| 1.0     | 2026-02-11 | Initial 20 templates from Qodo review analysis                                                      |
