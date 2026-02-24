# Fix Templates for Qodo PR Review Findings

<!-- prettier-ignore-start -->
**Document Version:** 1.8
**Last Updated:** 2026-02-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Purpose

Copy-paste fix templates for the top 30 most common Qodo PR review findings in
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
# Uses a shell variable to accumulate trap commands (avoids fragile trap -p parsing)
add_exit_trap() {
  EXIT_TRAP_CHAIN="${EXIT_TRAP_CHAIN:+$EXIT_TRAP_CHAIN; }$1"
  trap "$EXIT_TRAP_CHAIN" EXIT
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

## Template 27: Secure Audit File Write (fd-based)

**Triggered by**: Qodo "TOCTOU race" / "symlink write bypass" / SonarCloud
Security Hotspot on file writes **Severity**: CRITICAL **Review frequency**: 6x
(PR #368 R1-R6, each round fixed one layer)

Security-critical file writes (audit logs, state files) need the full fd-based
defense chain. Incremental fixes (add lstatSync, then add realpathSync, then add
openSync, then add fstatSync) cause multi-round review ping-pong.

### Pattern (Before — Incremental TOCTOU-vulnerable)

```javascript
const logDir = path.join(root, ".claude");
fs.mkdirSync(logDir, { recursive: true });
const logPath = path.join(logDir, "override-log.jsonl");
// ❌ Each of these was added in a separate review round:
// R1: realpathSync check
// R2: lstatSync on file
// R4: restrictive permissions
// R5: fd-based write
// R6: fstatSync after open
fs.appendFileSync(logPath, JSON.stringify(entry) + "\n");
```

### Fix (After — Complete fd-based chain in one pass)

```javascript
const logDir = path.join(root, ".claude");
// 1. Dir symlink guard BEFORE mkdir
if (fs.existsSync(logDir) && fs.lstatSync(logDir).isSymbolicLink()) {
  throw new Error("symlink detected on log directory");
}
fs.mkdirSync(logDir, { recursive: true });

const logPath = path.join(logDir, "override-log.jsonl");

// 2. Path traversal guard via realpathSync
const realLogDir = fs.realpathSync(logDir);
const rel = path.relative(realLogDir, logPath);
if (rel.startsWith("..") || path.isAbsolute(rel)) {
  throw new Error("path traversal detected");
}

// 3. File symlink guard
if (fs.existsSync(logPath) && fs.lstatSync(logPath).isSymbolicLink()) {
  throw new Error("symlink detected on log file");
}

// 4. Atomic fd-based write with fstatSync validation
const fd = fs.openSync(logPath, "a", 0o600);
try {
  const st = fs.fstatSync(fd);
  if (!st.isFile()) {
    throw new Error("log target is not a regular file");
  }
  fs.fchmodSync(fd, 0o600);
  fs.writeSync(fd, JSON.stringify(entry) + "\n", undefined, "utf-8");
} finally {
  fs.closeSync(fd);
}
```

### Defense Chain Checklist

1. **Dir symlink check** — `lstatSync(dir).isSymbolicLink()` before `mkdirSync`
2. **Path traversal** — `realpathSync` + `path.relative` containment
3. **File symlink check** — `lstatSync(file).isSymbolicLink()` before open
4. **fd-based open** — `openSync("a", 0o600)` with restrictive permissions
5. **fstatSync validation** — `fstatSync(fd).isFile()` after open
6. **fchmodSync** — Enforce 0o600 on every write (handles umask variance)
7. **writeSync** — Write via fd, not path (eliminates TOCTOU entirely)
8. **closeSync in finally** — Always close fd even on error

### Common Mistakes When Fixing

- Fixing one layer per round (symlink → permissions → fd → fstatSync) instead of
  applying the full chain at once
- Using `writeFileSync(fd, ...)` instead of `writeSync(fd, ...)` — both work but
  `writeSync` is more explicit for fd-based writes
- Forgetting `fstatSync(fd).isFile()` — the fd could point to a FIFO, directory,
  or device node if swapped between lstatSync and openSync
- Not wrapping in try/finally — fd leak on error

---

## Template 28: Fail-Closed Catch Block

**Triggered by**: Qodo "Error Handling" / SonarCloud S1066 **Severity**: MAJOR
**Review frequency**: 3 occurrences (PR #369 R9)

Generic `catch {}` or `catch { return; }` blocks silently swallow unexpected
errors (EPERM, EIO, ENOMEM). Only ignore expected filesystem errors; treat
everything else as fatal.

### Bad Code

```javascript
try {
  const stat = fs.lstatSync(filePath);
  if (stat.isSymbolicLink()) return false;
} catch {
  // ignore — file doesn't exist
  return true;
}
```

### Good Code

```javascript
try {
  const stat = fs.lstatSync(filePath);
  if (stat.isSymbolicLink()) return false;
} catch (err) {
  const code = err && typeof err === "object" ? err.code : null;
  if (code === "ENOENT" || code === "ENOTDIR") return true;
  // Unexpected error (EPERM, EIO, ENOMEM) — fail closed
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`guardSymlink failed on ${filePath}: ${msg}`);
  process.exit(1);
}
```

### When to Use

- Any `try/catch` around `lstatSync`, `statSync`, `realpathSync`,
  `readlinkSync`, or similar filesystem probe calls
- Security-sensitive code where silently ignoring errors could bypass a guard
- Replace ALL generic `catch {}` and `catch { return; }` blocks in
  security-adjacent code

### Key Principle

**Fail closed, not open.** If you can't determine whether a path is safe, assume
it isn't. Only allow through the specific error codes you expect (typically
ENOENT for "file doesn't exist").

---

## Template 29: Validate-Then-Store Path (TOCTOU Prevention)

**Triggered by**: Qodo "TOCTOU" / "Path Traversal" **Severity**: MAJOR **Review
frequency**: 2 occurrences (PR #370 R5)

When validating a user-supplied path (CLI arg, env var, config value), always
store the resolved/validated form — never validate one form and store another.

### Bad Code

```javascript
// Validates resolved path but stores raw input — TOCTOU gap
validatePathInDir(REPO_ROOT, path.resolve(REPO_ROOT, userInput));
parsed.file = userInput; // raw input stored!
```

### Good Code

```javascript
// Resolve ONCE, validate, store the resolved form
const resolvedPath = path.resolve(REPO_ROOT, userInput);
validatePathInDir(REPO_ROOT, resolvedPath);
parsed.file = resolvedPath; // validated form stored
```

### When to Use

- Any CLI argument that specifies a file path (`--file`, `--output-json`,
  `--config`)
- Environment variable paths (`process.env.LOG_DIR`, `process.env.OUTPUT_PATH`)
- Config file values that contain paths
- Any code pattern: `validate(transform(input)); use(input)` — should be
  `const safe = transform(input); validate(safe); use(safe)`

### Path Normalization Test Matrix

When implementing any path manipulation function, test with ALL of these:

| Input                                        | Expected Behavior                  |
| -------------------------------------------- | ---------------------------------- |
| Absolute path (`/home/user/repo/file.js`)    | Strip prefix, return relative      |
| Relative path (`src/file.js`)                | Pass through unchanged             |
| Different CWD (`../other/file.js`)           | Resolve against repo root, not CWD |
| Directory with trailing slash (`scripts/`)   | Preserve trailing slash            |
| Empty string                                 | Return as-is or error              |
| Non-string input (`null`, `undefined`, `42`) | Return as-is or error              |

---

## Template 30: CC Extraction — Options Object + Helper Verification

**Triggered by**: SonarCloud "Reduce Cognitive Complexity" / "Too many
parameters" **Severity**: MAJOR **Review frequency**: 7 occurrences (PRs
#366-#371)

When extracting a function to reduce Cognitive Complexity, two common mistakes
cause follow-up review rounds:

1. The extracted helper itself exceeds CC 15
2. The extracted function has too many parameters (>7)

### Bad Code

```javascript
// Extracted to reduce main() CC, but helper has CC 33 and 10 params
function doWork(a, b, c, d, e, f, g, h, i, j) {
  // ... complex logic with CC > 15
}
```

### Good Code

```javascript
// Options object for 7+ params, sub-helpers for CC reduction
function doWork(opts) {
  const { entries, config, output } = opts;
  const prepared = prepareEntries(entries, config);
  return writeOutput(prepared, output);
}

function prepareEntries(entries, config) {
  // ... focused logic, CC < 15
}

function writeOutput(prepared, output) {
  // ... focused logic, CC < 15
}
```

### Post-Extraction Verification Checklist

After every CC extraction, run before committing:

```bash
# Verify ALL functions in modified file stay under CC 15
npx eslint --rule 'complexity: [error, 15]' <modified-file>
```

If any extracted helper exceeds CC 15, extract sub-helpers from it until all
functions are under the limit. This prevents the "fix CC in one function, create
CC in another" ping-pong pattern that caused 2+ rounds in PRs #369-#371.

### Rules

1. **7+ parameters**: Use a single options object with destructuring
2. **Verify helpers**: Run CC check on the ENTIRE file after extraction
3. **Name clearly**: Helper names should describe WHAT they do, not WHERE they
   came from (e.g., `tryLabelColonNumber` not `parseSeverityCountPart1`)
4. **Single responsibility**: Each helper should handle one concern

---

## Template 31: realpathSync Lifecycle in Guard Functions

**Triggered by**: Qodo "realpathSync crash" / "ENOENT" / "missing directory"
**Severity**: MAJOR **Review frequency**: 4 occurrences (PR #374 R1-R4)

When using `realpathSync` in filesystem guard functions (e.g., `isSafeToWrite`,
`validatePathInDir`), handle the full lifecycle — files and directories may not
exist yet.

### Bad Code

```javascript
// Crashes on non-existent files, missing parent dirs, fresh checkouts
function isSafeToWrite(filePath) {
  const real = fs.realpathSync(filePath); // throws ENOENT
  return real.startsWith(allowedDir);
}
```

### Good Code

```javascript
function isSafeToWrite(filePath) {
  try {
    // Try the full path first (fast path for existing files)
    const real = fs.realpathSync(filePath);
    return isUnderAllowedDir(real);
  } catch {
    // File doesn't exist — realpath the parent directory instead
    const parentDir = path.dirname(filePath);
    try {
      const realParent = fs.realpathSync(parentDir);
      const projected = path.join(realParent, path.basename(filePath));
      return isUnderAllowedDir(projected);
    } catch {
      // Parent doesn't exist either — resolve from a known-good ancestor
      // (e.g., .claude dir or project root)
      try {
        const ancestor = fs.realpathSync(path.resolve(projectDir, ".claude"));
        const resolved = path.resolve(
          ancestor,
          path.relative(path.resolve(projectDir, ".claude"), filePath)
        );
        return isUnderAllowedDir(resolved);
      } catch {
        return false; // fail-closed: no resolvable ancestor
      }
    }
  }
}
```

### Test Matrix (MANDATORY before committing)

| Scenario                        | Input Example                      | Expected           |
| ------------------------------- | ---------------------------------- | ------------------ |
| File exists                     | `.claude/state/handoff.json`       | Resolve, validate  |
| File doesn't exist, parent does | `.claude/state/handoff.json.tmp`   | Realpath parent    |
| Parent doesn't exist            | `.claude/state/` on fresh checkout | Resolve ancestor   |
| Fresh checkout (no .claude/)    | First-ever run                     | Fail-closed: false |
| Symlink in path                 | `.claude/state -> /tmp/evil`       | Detect, reject     |

### Ordering Rule

`mkdirSync` MUST come BEFORE `isSafeToWrite`, not after:

```javascript
// CORRECT: mkdir first, then validate, then write
fs.mkdirSync(path.dirname(filePath), { recursive: true });
if (!isSafeToWrite(filePath)) return false;
fs.writeFileSync(tmpPath, data);
```

---

## Template 32: Hoist Safety Flag to Function Scope

**Triggered by**: Qodo "fallback bypasses guard" / "catch block unsafe write"
**Severity**: CRITICAL **Review frequency**: 2 occurrences (PR #374 R1, R5)

When a try/catch block has a fallback write path, the catch block may bypass
safety guards that were checked in the try block. Hoist the guard result to a
variable at function scope so both paths respect it.

### Bad Code

```javascript
function saveJson(filePath, data) {
  try {
    if (!isSafeToWrite(filePath)) return false; // guard checked here
    fs.writeFileSync(tmpPath, JSON.stringify(data));
    fs.renameSync(tmpPath, filePath);
    return true;
  } catch {
    // DANGER: fallback write bypasses isSafeToWrite!
    fs.writeFileSync(filePath, JSON.stringify(data));
    return true;
  }
}
```

### Good Code

```javascript
function saveJson(filePath, data) {
  let safeToWrite = false; // hoisted to function scope

  try {
    safeToWrite = isSafeToWrite(filePath) && isSafeToWrite(tmpPath);
    if (!safeToWrite) return false;

    fs.writeFileSync(tmpPath, JSON.stringify(data));
    fs.renameSync(tmpPath, filePath);
    return true;
  } catch {
    // Fallback respects the same guard
    if (!safeToWrite) return false;

    fs.writeFileSync(filePath, JSON.stringify(data));
    return true;
  }
}
```

### Pattern

The general rule: **any boolean gate checked in `try` that affects `catch`
behavior must be declared BEFORE the try block.**

```javascript
let guardResult = false;
try {
  guardResult = checkGuard();
  if (!guardResult) return;
  // ... risky operation
} catch {
  if (!guardResult) return; // catch respects the same gate
  // ... fallback operation
}
```

### When to Use

- Any function with try/catch that has a fallback write/delete/rename in catch
- Functions that call `isSafeToWrite()`, `validatePath()`, or similar guards
- Any pattern where the catch block does something the try block guards against

---

## Template 33: Path Containment Decision Matrix

**Triggered by**: Qodo "path traversal" / "containment bypass" / "ancestor too
permissive" **Severity**: CRITICAL **Review frequency**: 4 occurrences (PR #374
R1-R4)

Path containment checks (`isPathUnder(candidate, root)`) have two directions.
Choosing the wrong direction or missing boundary checks causes multi-round
ping-pong as the check flip-flops between too permissive and too restrictive.

### Decision Matrix (Answer BEFORE Writing Code)

| Question                                                    | Answer   | Implication                          |
| ----------------------------------------------------------- | -------- | ------------------------------------ |
| Can the candidate be a child of root?                       | Yes/No   | Enable descendant direction          |
| Can the candidate be a parent of root? (monorepo/workspace) | Yes/No   | Enable ancestor direction            |
| Is this Windows-compatible?                                 | Yes/No   | Case-insensitive comparison          |
| What's the max ancestor depth?                              | N levels | Defense-in-depth cap (recommend: 10) |

### Bad Code

```javascript
// Missing boundary: /repo/app matches /repo/app-malicious
if (resolved.startsWith(root)) {
  /* ... */
}

// Missing direction: breaks monorepo where root is ancestor of cwd
if (!resolved.startsWith(cwd)) return fallback;
```

### Good Code

```javascript
function isContained(candidate, root) {
  const norm = (p) => (process.platform === "win32" ? p.toLowerCase() : p);
  const a = norm(fs.realpathSync(path.resolve(candidate)));
  const b = norm(fs.realpathSync(path.resolve(root)));

  // Exact match
  if (a === b) return true;

  // Descendant: candidate is under root
  const isDescendant = a.startsWith(b + path.sep);

  // Ancestor: root is under candidate (monorepo support)
  const isAncestor = b.startsWith(a + path.sep);

  if (isDescendant) return true;

  if (isAncestor) {
    // Defense-in-depth: cap ancestor depth
    const depth = b.slice(a.length).split(path.sep).filter(Boolean).length;
    return depth <= 10;
  }

  return false;
}
```

### Checklist (Verify All Before Committing)

1. **Separator boundary**: `startsWith(root + path.sep)`, not just
   `startsWith(root)`
2. **Exact match**: Check `a === b` separately from startsWith
3. **Case sensitivity**: Windows paths need `.toLowerCase()`
4. **Both directions justified**: Document why ancestor is needed (or not)
5. **Depth limit**: If ancestor direction enabled, cap at 10 levels
6. **realpathSync lifecycle**: Handle non-existent paths (see Template 31)

---

## Template 34: Evidence/Array Merge with Deep Dedup

**When to use:** Merging arrays of evidence objects (or similar structured data)
where duplicates must be eliminated using deep content comparison, not reference
equality.

**Source:** PR #379 (7 rounds of incremental evidence dedup refinement)

### Bad Code

```javascript
// Shallow dedup — misses deep duplicates
const merged = [...existing, ...incoming];
const unique = [...new Set(merged)]; // Only dedupes by reference

// No depth cap — stack overflow on circular refs
function canonicalize(obj) {
  return JSON.stringify(
    Object.keys(obj)
      .sort()
      .reduce((acc, k) => ({ ...acc, [k]: canonicalize(obj[k]) }), {})
  );
}

// Type-unstable keys — {a:1} and {a:"1"} collide
function toKey(obj) {
  return Object.values(obj).join("|");
}
```

### Good Code

```javascript
/**
 * Normalize any value to an array. Handles null, undefined, non-array.
 */
function toArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

/**
 * Produce a canonical string for deep comparison.
 * - Depth cap prevents stack overflow
 * - WeakSet detects circular references
 * - Only handles JSON-safe types (string/number/boolean/null/array/object)
 */
function canonicalize(val, depth = 0, seen = new WeakSet()) {
  if (depth > 10) return '"[MAX_DEPTH]"';
  if (val === null || val === undefined) return "null";

  const t = typeof val;
  if (t === "boolean" || t === "number") return String(val);
  if (t === "string") return JSON.stringify(val);

  if (t === "object") {
    if (seen.has(val)) return '"[CIRCULAR]"';
    seen.add(val);

    if (Array.isArray(val)) {
      return (
        "[" + val.map((v) => canonicalize(v, depth + 1, seen)).join(",") + "]"
      );
    }

    const keys = Object.keys(val).sort();
    return (
      "{" +
      keys
        .map(
          (k) => JSON.stringify(k) + ":" + canonicalize(val[k], depth + 1, seen)
        )
        .join(",") +
      "}"
    );
  }

  return '"[UNSERIALIZABLE]"'; // fallback for functions, symbols, etc.
}

/**
 * Type-stable key: prefix with type to prevent cross-type collisions.
 * e.g., "s:hello" vs "n:123" vs "b:true"
 */
function evidenceToKey(item) {
  if (item == null) return "null:null";
  if (typeof item === "string") return "s:" + item;
  if (typeof item !== "object") return typeof item + ":" + String(item);
  return "o:" + canonicalize(item);
}

/**
 * Merge two evidence arrays with Set-based dedup.
 */
function mergeEvidence(existing, incoming) {
  const arr = [...toArray(existing), ...toArray(incoming)];
  const seen = new Set();
  const result = [];

  for (const item of arr) {
    const key = evidenceToKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}
```

### Checklist (Verify All Before Committing)

1. **Depth cap**: Recursive canonicalization has `maxDepth` (default 10)
2. **Circular refs**: `WeakSet` tracks visited objects
3. **Prototype pollution**: Only iterate `Object.keys()`, never `for...in`
4. **Null/non-array input**: `toArray()` normalizes before merging
5. **Type-stable keys**: Prefix with type character to prevent `"1"` vs `1`
   collision
6. **Fallback for unserializable**: Functions, Symbols, BigInt produce
   `[UNSERIALIZABLE]` instead of throwing

---

---

### Template 35: Complete Mapping/Enumeration Audit

**Trigger:** Fixing any mapping logic (severity, priority, status, category) or
implementing dedup/enumeration across multiple boundaries.

**Problem:** Partial fixes to mapping or dedup logic cause multi-round
ping-pong. PR #382 had 3-round chains for both severity mapping (fixed 2 of 4
levels in R1) and dedup boundaries (discovered 3 boundaries across 3 rounds).

**Pre-Fix Checklist:**

1. **Mapping completeness** — List ALL possible input values and their expected
   outputs. Fix all branches in one pass, not just the reported one:

```
// BAD: Fix only the reported level
if (/critical/.test(text)) return "S0"; // fixed
if (/high/.test(text)) return "S1";     // fixed
if (/medium|low/.test(text)) return "S3"; // ← still wrong!

// GOOD: Audit all levels at once
if (/critical/.test(text)) return "S0";
if (/high/.test(text)) return "S1";
if (/\bmedium\b/.test(text)) return "S2"; // separate from low
if (/\blow\b/.test(text)) return "S3";
```

2. **Case sensitivity** — Does input come from user-generated content? If so,
   use case-insensitive matching (`[sS][0-3]` + `.toUpperCase()`).

3. **Word boundaries** — Add `\b` to prevent false matches (e.g., "medium" in
   "medium-sized" or "high" in "highlight").

4. **Cross-file propagation** — Grep for ALL files with similar mapping logic:

   ```bash
   grep -rn "detectSeverity\|mapSeverity\|severity.*match" scripts/ --include="*.js"
   ```

   Fix ALL instances in one pass.

5. **Dedup boundary enumeration** — When implementing dedup, list ALL boundaries
   before coding:
   - Cross-source (existing data in target file)
   - Within-run (same item appears twice in input)
   - Cross-batch (same item in different input batches/files) Add a hash set for
     EACH boundary.

6. **State tracking variables** — Any variable tracking context (section,
   milestone, category) must be reset when context changes:

   ```javascript
   // BAD: Only set, never reset
   if (isMatch) currentContext = heading;

   // GOOD: Reset on context change
   if (isMatch) {
     currentContext = heading;
   } else {
     currentContext = "";
   }
   ```

---

### Template 36: Atomic Dual-JSONL Write with Rollback

**When to use:** Any script that writes to TWO JSONL files that must stay in
sync (e.g., MASTER_DEBT.jsonl + raw/deduped.jsonl).

**Why:** If the first rename succeeds but the second fails, the files become
inconsistent. This was the #1 propagation miss in PR #383 — 4 scripts had
sequential writes without rollback.

```javascript
// Stage both files to .tmp
const masterTmp = MASTER_FILE + `.tmp.${process.pid}`;
const dedupedTmp = DEDUPED_FILE + `.tmp.${process.pid}`;

try {
  fs.writeFileSync(masterTmp, masterContent, "utf8");
  fs.writeFileSync(dedupedTmp, dedupedContent, "utf8");

  // Commit atomically — rename master first, then deduped
  fs.renameSync(masterTmp, MASTER_FILE);
  try {
    fs.renameSync(dedupedTmp, DEDUPED_FILE);
  } catch (renameErr) {
    console.error(
      `CRITICAL: MASTER_FILE updated but DEDUPED_FILE rename failed. ` +
        `Manually rename ${dedupedTmp} to ${DEDUPED_FILE} to restore consistency.`
    );
    throw renameErr;
  }
} catch (err) {
  // Clean up any remaining tmp files
  try {
    fs.unlinkSync(masterTmp);
  } catch {
    /* ignore */
  }
  try {
    fs.unlinkSync(dedupedTmp);
  } catch {
    /* ignore */
  }
  throw err;
}
```

**Checklist before using:**

1. Both files must have symlink guards (`isWriteSafe()` or
   `refuseSymlinkWithParents()`)
2. Both tmp paths must use `process.pid` suffix to avoid collisions
3. The CRITICAL log message must name both files so operators can manually fix
4. After any script that appends to MASTER_DEBT.jsonl, ALSO append to
   raw/deduped.jsonl (per MEMORY.md)

**Search pattern for missing dual writes:**

```bash
grep -rn 'MASTER.*write\|MASTER.*rename\|masterTmp\|MASTER_FILE' scripts/debt/ --include="*.js" | grep -v deduped
```

---

### Template 37: Lazy-Load Module with typeof Guard

**When:** Lazy-loading a shared helper via `require()` in a try/catch block
where the module might export `undefined` (e.g., module exists but named export
is missing/misspelled).

**Why:** `require()` succeeds if the file exists, even if the named export is
`undefined`. Without a typeof guard, the variable silently becomes `undefined`
and crashes at call site. The try/catch only handles missing files, not missing
exports.

**Pattern:**

```javascript
// WRONG — require succeeds, .namedExport may be undefined
let helper;
try {
  helper = require("./lib/module").namedExport;
} catch {
  helper = fallbackFn;
}
// helper is undefined if module exists but export doesn't → crash at call site

// CORRECT — typeof guard after successful require
let helper;
try {
  helper = require("./lib/module").namedExport;
  if (typeof helper !== "function") helper = fallbackFn;
} catch {
  helper = fallbackFn;
}
```

**Fallback strategy by use case:**

| Context         | Fallback                                | Why                                            |
| --------------- | --------------------------------------- | ---------------------------------------------- |
| Security guard  | `() => false` (deny by default)         | Fail-closed: reject writes when guard missing  |
| Sanitizer       | `(v) => String(v ?? "").slice(0, 1000)` | Basic truncation preserves safety              |
| Telemetry/write | `() => true` (allow by default)         | Fail-open: don't block hooks on missing helper |
| Rotation/util   | `null` + truthiness check before call   | Skip optional functionality gracefully         |

**Evidence:** PR #388 R7 [1] — `isSafeToWrite` was `undefined` after successful
`require()` because the module existed but the named export wasn't available in
a specific state. Same pattern found in `commit-failure-reporter.js` during
propagation check (both `isSafeToWrite` and `sanitizeInput`).

**Source:** PR #388 retro, Review #378

---

## Version History

| Version | Date       | Change                                                                                                    |
| ------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| 2.3     | 2026-02-24 | Add Template 37 (lazy-load module with typeof guard). Source: PR #388 retro.                              |
| 2.2     | 2026-02-22 | Add Template 36 (atomic dual-JSONL write with rollback). Source: PR #383 retro.                           |
| 2.1     | 2026-02-20 | Add Template 35 (mapping/enumeration audit). Source: PR #382 retro.                                       |
| 2.0     | 2026-02-19 | Add Template 34 (evidence/array merge with deep dedup). Source: PR #379 retro.                            |
| 1.9     | 2026-02-18 | Add Templates 31-33 (realpathSync lifecycle, safety flag hoist, path containment). Source: PR #374 retro. |
| 1.8     | 2026-02-17 | Add Template 30 (CC extraction guidelines). Source: PR #371 retro.                                        |
| 1.7     | 2026-02-17 | Add Templates 28-29 (fail-closed catch, validate-then-store path). Source: PR #369-#370 retros.           |
| 1.5     | 2026-02-16 | Add Template 27 (Secure Audit File Write fd-based chain). Source: PR #368 retro.                          |
| 1.4     | 2026-02-16 | Add Templates 25-26 (SKIP_REASON validation chain, POSIX shell portability). Source: PR #367 retro.       |
| 1.3     | 2026-02-15 | Add Template 24 (tmpPath symlink guard)                                                                   |
| 1.2     | 2026-02-15 | Add Template 23 (pattern propagation workflow)                                                            |
| 1.1     | 2026-02-14 | Add Templates 21-22 (regex complexity, atomic write)                                                      |
| 1.0     | 2026-02-11 | Initial 20 templates from Qodo review analysis                                                            |
