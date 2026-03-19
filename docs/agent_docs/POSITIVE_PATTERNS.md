# Positive Pattern Templates

**Document Version:** 2.0 **Last Updated:** 2026-03-13 **Status:** ACTIVE
**Purpose:** The RIGHT way to do things. Reference this BEFORE writing code.

> Every anti-pattern in CODE_PATTERNS.md has a positive equivalent here. When in
> doubt, copy-paste from this file.

<!-- -->

> Each section ID (S1, S2, ...) is stable and referenced by code-reviewer
> anti-pattern checks. Do not renumber.

---

## Quick Reference Table

| ID  | Anti-Pattern                         | Positive Pattern                      | Import/Usage                                                         |
| --- | ------------------------------------ | ------------------------------------- | -------------------------------------------------------------------- | -------------- |
| S1  | Raw `error.message`                  | `sanitizeError()`                     | `scripts/lib/sanitize-error.js` or `scripts/lib/security-helpers.js` |
| S2  | `startsWith('..')`                   | Regex path check                      | `/^\.\.(?:[\/\\]                                                     | $)/.test(rel)` |
| S3  | `if (existsSync(f)) readFileSync(f)` | Direct try/catch read                 | `safeReadFile()` from `scripts/lib/security-helpers.js`              |
| S4  | `exec()` without `/g`                | Always `/g` + `lastIndex = 0`         | `safeRegexExec()` from `scripts/lib/security-helpers.js`             |
| S5  | `vi.mock("firebase/firestore")`      | Mock `httpsCallable`                  | `vi.mock("firebase/functions", ...)`                                 |
| S6  | `fs.writeFileSync()` bare            | `safeWriteFileSync()`                 | `scripts/lib/safe-fs.js`                                             |
| S7  | ``execSync(`cmd ${var}`)``           | `execFileSync(cmd, [args])`           | `node:child_process`                                                 |
| S8  | `JSON.parse(readFileSync(jsonl))`    | Line-by-line parse                    | `content.split(/\r?\n/)` with per-line try/catch                     |
| S9  | `filePath.includes("src/")`          | `toPosixPath()` first                 | `.replace(/\\/g, "/")` before string ops                             |
| S10 | Functions with CC > 15               | Extract helpers                       | Keep every function under CC 15                                      |
| S11 | `${{ }}` in GHA `run:`               | `env:` block                          | Pass user inputs via `env:`, not interpolation                       |
| S12 | Inline types without validation      | Zod + `BaseRecord`                    | `BaseRecord.extend().passthrough()`                                  |
| S13 | Bare `lstatSync` symlink check       | `isSafeToWrite()`                     | `scripts/lib/safe-fs.js` or `scripts/lib/security-helpers.js`        |
| S14 | `fs.appendFileSync()` on JSONL       | `withLock()` + `safeAppendFileSync()` | `scripts/lib/safe-fs.js`                                             |
| S15 | Direct Firestore write (client)      | `httpsCallable()`                     | `import { httpsCallable } from "firebase/functions"`                 |
| S16 | `console.error()` raw                | `createSafeLogger()`                  | `scripts/lib/sanitize-error.js`                                      |
| S17 | `fs.renameSync()` bare               | `safeRenameSync()`                    | `scripts/lib/safe-fs.js`                                             |
| S18 | Path from `path.resolve()` used raw  | `validatePathInDir()`                 | `scripts/lib/security-helpers.js`                                    |
| S19 | Unescaped user text in Markdown      | `escapeMd()`                          | `scripts/lib/security-helpers.js`                                    |
| S20 | `parseInt(str)`                      | `Number.parseInt(str, 10)`            | Built-in                                                             |
| S21 | `{}` as dict with untrusted keys     | `new Map()` or `Object.create(null)`  | Built-in                                                             |
| S22 | Fetch URL from external input        | `validateUrl()`                       | `scripts/lib/security-helpers.js`                                    |
| S23 | `Math.max(...arr)` on unknown size   | `reduce()` with guards                | Built-in                                                             |
| S24 | `.toDate()` without type check       | Guard with `typeof x?.toDate`         | Built-in                                                             |
| S25 | Hardcoded Unix paths                 | `path.sep` / normalize                | `node:path`                                                          |

---

## S1: Error Sanitization

**Anti-pattern:** `console.error(error.message)` -- may leak paths, secrets, PII

**Positive pattern:**

```javascript
// === OPTION A: sanitizeError from dedicated module ===
const { sanitizeError } = require("scripts/lib/sanitize-error.js");

try {
  riskyOperation();
} catch (error) {
  const safe = sanitizeError(error);
  console.error(`[${scriptName}] ${safe}`);
  process.exitCode = 1;
}

// === OPTION B: sanitizeError from security-helpers (re-exported) ===
const { sanitizeError } = require("scripts/lib/security-helpers.js");

try {
  riskyOperation();
} catch (error) {
  console.error(`Operation failed: ${sanitizeError(error)}`);
}

// === OPTION C: createSafeLogger for scripts with many log points ===
const { createSafeLogger } = require("scripts/lib/sanitize-error.js");
const log = createSafeLogger("my-script");

try {
  doSomething();
} catch (error) {
  log.error("Operation failed", error); // auto-sanitizes
}

// === OPTION D: Inline fallback (when helpers unavailable) ===
try {
  doSomething();
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`Operation failed: ${msg.slice(0, 200)}`);
}
```

**Key rules:**

- Import from `scripts/lib/sanitize-error.js` -- never inline your own
- Use `process.exitCode = 1` not `process.exit()` (allows buffer flush)
- Never `throw err` after sanitizing -- stack trace re-exposes raw content
- Handle non-Error throws:
  `error && typeof error === "object" && "message" in error`
- The `sanitize-error.js` module uses `export` syntax (ESM). In CJS scripts, use
  the `security-helpers.js` re-export

---

## S2: Path Traversal Check

**Anti-pattern:** `rel.startsWith('..')` -- false positive on files named
`..foo`

**Positive pattern:**

```javascript
const path = require("node:path");
const { validatePathInDir } = require("scripts/lib/security-helpers.js");

// === OPTION A: Use the helper (preferred) ===
function safePath(baseDir, userPath) {
  // Throws if path escapes baseDir, is empty, or is absolute
  const rel = validatePathInDir(baseDir, userPath);
  return path.resolve(baseDir, rel);
}

// === OPTION B: Manual check (when you need custom error handling) ===
function isInsideRoot(targetPath, rootDir) {
  const resolved = path.resolve(rootDir, targetPath);
  const rel = path.relative(rootDir, resolved);

  // Three checks: empty (root itself), traversal, absolute (cross-drive)
  if (rel === "" || /^\.\.(?:[/\\]|$)/.test(rel) || path.isAbsolute(rel)) {
    return false;
  }
  return true;
}

// === OPTION C: Segment-based check (most robust) ===
function isDescendant(baseDir, targetPath) {
  const rel = path.relative(baseDir, path.resolve(targetPath));
  const firstSegment = rel.split(path.sep)[0];
  return rel !== "" && firstSegment !== ".." && !path.isAbsolute(rel);
}
```

**Key rules:**

- Always `path.resolve()` before `path.relative()`
- Check all three: empty string, `..` prefix with regex, absolute path
- On Windows, check drive letters match before `path.relative()`
- Store the resolved form, never the raw input (TOCTOU prevention)
- Cap input length: `if (userPath.length > 4096) reject()` -- prevents DoS
- Normalize backslashes BEFORE string checks: `.replace(/\\/g, "/")`

---

## S3: File Reads with try/catch

**Anti-pattern:** `if (existsSync(p)) { readFileSync(p) }` -- TOCTOU race
condition

**Positive pattern:**

```javascript
const { safeReadFile } = require("scripts/lib/security-helpers.js");

// === OPTION A: Use the helper (preferred) ===
const result = safeReadFile("/path/to/file.json", "config file");
if (result.success) {
  const data = JSON.parse(result.content);
} else {
  console.warn(result.error); // "config file not found" or sanitized error
}

// === OPTION B: Manual pattern ===
const { readFileSync } = require("node:fs");
const { sanitizeError } = require("scripts/lib/security-helpers.js");

function readFileSafe(filePath, description) {
  try {
    return { success: true, content: readFileSync(filePath, "utf-8") };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { success: false, error: `${description} not found` };
    }
    return { success: false, error: `Failed to read: ${sanitizeError(error)}` };
  }
}

// === OPTION C: JSON file loading helper ===
function loadJson(filePath) {
  try {
    return JSON.parse(require("node:fs").readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}
```

**Key rules:**

- Never use `existsSync` + `readFileSync` -- check `error.code` instead
- Only allow `ENOENT`/`ENOTDIR` through catch; other errors are fatal
- Wrap `lstatSync` in try/catch too (broken symlinks, permissions)
- Use `{ flag: "wx", mode: 0o600 }` for exclusive temp file creation
- For BOM-encoded files, use `readUtf8Sync()` from `scripts/lib/safe-fs.js`
- For binary detection, check for NUL bytes:
  `if (content.includes("\0")) skip()`
- Split on `\r?\n` not just `\n` for cross-platform line handling

---

## S4: exec() Loops with /g Flag

**Anti-pattern:** `while ((m = /pattern/.exec(str)))` -- infinite loop without
/g

**Positive pattern:**

```javascript
const { safeRegexExec } = require("scripts/lib/security-helpers.js");

// === OPTION A: Use the helper (preferred) ===
const pattern = /some-pattern/g;
const matches = safeRegexExec(pattern, content);
for (const match of matches) {
  console.log(match[0], match.index);
}

// === OPTION B: Manual pattern ===
const regex = /some-pattern/g; // /g flag REQUIRED
regex.lastIndex = 0; // Reset before each use

let match;
while ((match = regex.exec(content)) !== null) {
  // Process match -- /g advances lastIndex each iteration

  // Safety: prevent infinite loop on zero-length matches
  if (match[0].length === 0) {
    regex.lastIndex = Math.min(regex.lastIndex + 1, content.length);
  }
}
```

**Key rules:**

- Always include `/g` flag on regex used in `while (exec())` loops
- Always reset `lastIndex = 0` before the loop (stateful regex)
- `.test()` in loops has the same problem. If using `.test()` in a loop, REMOVE
  the `/g` flag
- If SonarCloud flags a regex twice, replace with string parsing (split + loop)
  -- don't patch
- For user-provided patterns, add ReDoS protection: bounded quantifiers `{1,64}`
  instead of `+`
- Lazy quantifiers (`.*?`, `.+?`) are NOT ReDoS-safe -- use `[^X]{0,N}` with
  bounds

---

## S5: Test Mocking (httpsCallable)

**Anti-pattern:** `vi.mock('firebase/firestore')` -- bypasses Cloud Function
security

**Positive pattern:**

```javascript
import { vi } from "vitest";

// === Mock the callable wrapper, not Firestore directly ===
vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn(() =>
    vi.fn().mockResolvedValue({
      data: { success: true, id: "test-123" },
    })
  ),
  getFunctions: vi.fn(),
}));

// === For testing specific Cloud Function responses ===
import { httpsCallable } from "firebase/functions";

vi.mocked(httpsCallable).mockImplementation((functions, name) => {
  return vi.fn().mockResolvedValue({
    data: { success: true, id: "mock-entry-id" },
  });
});

// === For error scenarios ===
vi.mocked(httpsCallable).mockImplementation(() => {
  return vi.fn().mockRejectedValue(new Error("rate-limited"));
});
```

**Key rules:**

- Mock `httpsCallable`, never direct Firestore reads/writes
- This preserves App Check, rate limiting, and validation logic
- For admin operations, mock the Cloud Function callable interface
- NEVER mock Firestore directly for `journal`, `daily_logs`, or
  `inventoryEntries` collections

---

## S6: Safe File Writes (symlink guard)

**Anti-pattern:** `writeFileSync(path, data)` -- no symlink check, no permission
restriction

**Positive pattern:**

```javascript
const {
  safeWriteFileSync,
  safeAtomicWriteSync,
} = require("scripts/lib/safe-fs.js");

// === OPTION A: Simple safe write (checks symlinks) ===
safeWriteFileSync(targetPath, content, { encoding: "utf-8" });

// === OPTION B: Atomic write (write to .tmp, then rename) ===
// Best for critical files where partial writes could corrupt data
safeAtomicWriteSync(configPath, JSON.stringify(data, null, 2));

// === OPTION C: New file only (exclusive creation, fails if exists) ===
const { safeWriteFile } = require("scripts/lib/security-helpers.js");
safeWriteFile("/path/to/new-file.txt", content);
// With overwrite permission:
safeWriteFile("/path/to/file.txt", content, { allowOverwrite: true });
```

**For state/critical files (manual atomic write):**

```javascript
const { isSafeToWrite } = require("scripts/lib/safe-fs.js");

function atomicWrite(filePath, content) {
  const tmpPath = filePath + ".tmp";

  // Guard BOTH target AND tmp path
  if (!isSafeToWrite(filePath) || !isSafeToWrite(tmpPath)) {
    throw new Error("Symlink detected -- refusing write");
  }

  fs.writeFileSync(tmpPath, content, { mode: 0o600 });

  // Cross-device safe rename
  try {
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    if (err.code === "EXDEV" || err.code === "EPERM" || err.code === "EACCES") {
      fs.copyFileSync(tmpPath, filePath);
      fs.unlinkSync(tmpPath);
    } else {
      throw err;
    }
  }
}
```

**Key rules:**

- Use `safeWriteFileSync` from `scripts/lib/safe-fs.js` for all writes
- Guard both target AND `.tmp` path for symlink attacks
- Never use bare `renameSync` -- wrap with `copyFileSync`+`unlinkSync` fallback
- For temp files, use `{ flag: "wx", mode: 0o600 }` for exclusive creation
- Always use absolute paths
- End JSONL files with `\n`: `entries.join("\n") + "\n"`

---

## S7: Shell Command Safety

**Anti-pattern:** ``execSync(`git add ${file}`)`` -- injection via interpolation

**Positive pattern:**

```javascript
const { execFileSync } = require("node:child_process");
const {
  safeGitAdd,
  safeGitCommit,
} = require("scripts/lib/security-helpers.js");

// === OPTION A: execFileSync with args array (preferred) ===
execFileSync("git", ["log", "--oneline", "-n", "5"], {
  cwd: repoRoot,
  timeout: 30_000,
  maxBuffer: 10 * 1024 * 1024,
});

// === OPTION B: Git operations via helpers ===
safeGitAdd(repoRoot, "docs/my-file.md"); // validates path, blocks pathspec magic
safeGitCommit(repoRoot, "fix: update docs"); // temp file for message, auto-cleanup

// === OPTION C: Sanitize filenames from user input ===
const { sanitizeFilename } = require("scripts/lib/security-helpers.js");
const safeName = sanitizeFilename(userInput); // strips path separators, special chars
```

**Key rules:**

- Use `execFileSync(cmd, [args])` not ``execSync(`cmd ${var}`)``
- Always include `--` before file arguments (prevents `-filename` injection)
- Strip leading dashes: `.replace(/^-+/, "")` for git pathspecs
- Reject paths starting with `:` (git pathspec magic bypass)
- Always set `timeout` and `maxBuffer` on all exec calls
- Never use `git add -A` in automation -- use explicit file paths
- Use `npx --no-install pkg` to prevent remote code fetch in git hooks

---

## S8: JSONL Operations

**Anti-pattern:** `JSON.parse(readFileSync(file))` on JSONL -- crashes on
multi-line

**Positive pattern:**

```javascript
const { readFileSync } = require("node:fs");

// === Reading JSONL (resilient) ===
function readJsonlFile(filePath) {
  let content;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const entries = [];
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      entries.push(JSON.parse(line));
    } catch {
      // Log with line number, NOT content (may contain secrets)
      console.warn(
        `[JSONL] Skipping corrupt line ${i + 1} in ${path.basename(filePath)}`
      );
    }
  }

  return entries;
}

// === Writing JSONL ===
const { safeAppendFileSync } = require("scripts/lib/safe-fs.js");

// Always end with newline; use safe-fs for symlink guards
const line = JSON.stringify(record) + "\n";
safeAppendFileSync(targetPath, line);

// Full rewrite
const content = items.map((item) => JSON.stringify(item)).join("\n") + "\n";
safeWriteFileSync(targetPath, content);
```

**Key rules:**

- Parse line-by-line with try/catch -- single bad line must not crash
- Use `\r?\n` for cross-platform line splitting
- Always end JSONL files with `\n` (trailing newline)
- Log warnings on unparseable lines -- never silently filter with
  `.filter(Boolean)`
- Use `safeAppendFileSync` from `scripts/lib/safe-fs.js` for append operations
- Use `path.basename(filePath)` in warnings, not the full path

---

## S9: Cross-Platform Path Handling

**Anti-pattern:** `filePath.includes('src/utils')` -- fails on Windows backslash

**Positive pattern:**

```javascript
const path = require("node:path");

// Normalize to POSIX before ANY string comparison
function toPosixPath(p) {
  return p.replace(/\\/g, "/");
}

// CORRECT: normalize first
const posixPath = toPosixPath(filePath);
if (posixPath.includes("src/utils")) {
  /* ... */
}

// For Set lookups
const pathSet = new Set(files.map(toPosixPath));
if (pathSet.has(toPosixPath(candidate))) {
  /* ... */
}

// Platform-aware root detection
const root = path.parse(dir).root; // "C:\" on Windows, "/" on Unix

// Cross-platform isAbsolute
if (path.isAbsolute(filePath)) {
  /* ... */
} // NOT filePath.startsWith("/")

// Line ending normalization
const lines = content.replace(/\r\n/g, "\n").split("\n");
// Or: content.split(/\r?\n/)
```

**Key rules:**

- Call `toPosixPath()` BEFORE `includes()`, `endsWith()`, `has()`,
  `startsWith()`
- Use `path.sep` or normalize with `.replace(/\\/g, '/')` for comparisons
- Use `path.isAbsolute()` not `startsWith('/')` (Windows: `C:\...`)
- Use `path.parse(dir).root` not hardcoded `/` for root detection
- Use `\r?\n` for line splitting (Windows CRLF)
- Normalize CRLF + trim before comparing file content

---

## S10: Cognitive Complexity

**Anti-pattern:** Functions with CC > 15 -- #1 churn driver across PRs

**Positive pattern:**

```javascript
// WRONG: one giant function with nested if/for/try
function processAll(items, config) {
  // CC: 25+ ...nested logic...
}

// RIGHT: extract focused helpers
function validateItem(item) {
  /* CC: 3 */
}
function transformItem(item, config) {
  /* CC: 4 */
}
function processAll(items, config) {
  // CC: 5
  return items.filter(validateItem).map((i) => transformItem(i, config));
}

// For 7+ parameters, use options object
// WRONG: function extract(a, b, c, d, e, f, g, h) { ... }
// RIGHT:
function extract(opts) {
  const { source, target, format, limit, offset, filter, sort, verbose } = opts;
  // ...
}
```

**Key rules:**

- Keep every function under CC 15 (pre-commit hook blocks CC > 15)
- After extracting helpers, re-run CC check on the ENTIRE file
- Extracted helpers inherit complexity -- verify they're also under 15
- Use options object for 7+ parameters (SonarCloud max-params rule)

---

## S11: GitHub Actions Safety

**Anti-pattern:** `${{ github.event.pull_request.body }}` in `run:` -- injection

**Positive pattern:**

```yaml
# Pass user inputs via env:, not ${{ }} interpolation
- name: Process PR
  env:
    PR_BODY: ${{ github.event.pull_request.body }}
    PR_TITLE: ${{ github.event.pull_request.title }}
  run: |
    # Safe: shell escaping automatic in env vars
    printf '%s\n' "$PR_TITLE"

# Pin third-party actions to full SHA
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
  # NOT: actions/checkout@v4

# Use process.env in JS steps, not ${{ }}
- uses: actions/github-script@v7
  env:
    ISSUE_BODY: ${{ github.event.issue.body }}
  with:
    script: |
      const body = process.env.ISSUE_BODY;  // Safe
      // NOT: const body = `${{ github.event.issue.body }}`;  // Injection!
```

**Key rules:**

- Pin third-party actions to full SHA: `action@abc123 # vX.Y.Z`
- Pass user inputs via `env:` block, never direct `${{ }}` interpolation
- Use `process.env.VAR` in JS scripts, not `${{ }}` template literals
- Use exit codes for command failure detection, not output parsing

---

## S12: Zod Schema Standards (SWS Forward-Compat)

**Anti-pattern:** Inline type definitions without validation

**Positive pattern:**

```typescript
import { z } from "zod";
import { BaseRecord } from "./base-record.js";

// Extend BaseRecord for SWS compatibility
export const MyRecord = BaseRecord.extend({
  type: z.literal("my-type"),
  data: z.object({
    name: z.string(),
    count: z.number().int().nonnegative(),
  }),
}).passthrough(); // D22: allow forward-compat fields

// Zod 4: explicit key schema for records
const metadata = z.record(z.string(), z.unknown()); // NOT z.record(z.unknown())

export type MyRecord = z.infer<typeof MyRecord>;
```

**Key rules:**

- Extend `BaseRecord` for all JSONL schemas
- Use `.passthrough()` for forward-compatibility (D22)
- Zod 4 requires `z.record(z.string(), z.unknown())` -- explicit key type
- Export both schema and inferred type
- Register in `SCHEMA_MAP` in `scripts/reviews/lib/schemas/index.ts`

---

## S13: Symlink Guards

**Anti-pattern:** Only checking the target file for symlinks, not parent
directories

**Positive pattern:**

```javascript
const { isSafeToWrite } = require("scripts/lib/safe-fs.js");
// OR
const {
  isSafeToWrite,
  refuseSymlinkWithParents,
} = require("scripts/lib/security-helpers.js");

// === OPTION A: Boolean check (fail-closed) ===
if (!isSafeToWrite(filePath)) {
  throw new Error(
    `Refusing to write to symlinked path: ${path.basename(filePath)}`
  );
}
fs.writeFileSync(filePath, content);

// === OPTION B: Throwing check ===
refuseSymlinkWithParents(filePath); // Throws if symlink found in path or parents
fs.writeFileSync(filePath, content);

// === OPTION C: Guard for atomic writes (both target AND tmp) ===
const tmpPath = `${filePath}.tmp`;
if (!isSafeToWrite(filePath) || !isSafeToWrite(tmpPath)) {
  throw new Error("Symlink detected in write path");
}
fs.writeFileSync(tmpPath, content);
safeRenameSync(tmpPath, filePath);
```

**Key rules:**

- `isSafeToWrite()` checks the file AND all ancestor directories. Returns
  `false` (fail-closed) on any error
- Hoist the `isSafeToWrite()` result to function scope; check it in BOTH try and
  catch paths -- catch-block fallback bypasses guard if flag is scoped inside
  try
- Use `lstatSync` (not `statSync`) for symlink detection -- `statSync` follows
  symlinks and misses them
- `realpathSync()` throws on non-existent paths. Use `mkdirSync` for parent dirs
  before calling guards on new files
- Guard BOTH target AND `.tmp` path for atomic writes

---

## S14: Advisory Locking (JSONL Appends)

**Anti-pattern:** Multiple processes appending to the same JSONL file without
coordination

**Positive pattern:**

```javascript
const {
  withLock,
  safeAppendFileSync,
  acquireLock,
  releaseLock,
} = require("scripts/lib/safe-fs.js");

// === OPTION A: withLock wrapper (preferred -- auto-releases) ===
withLock("/path/to/data.jsonl", () => {
  const entry = JSON.stringify({ id: "abc", timestamp: Date.now() });
  safeAppendFileSync("/path/to/data.jsonl", entry + "\n");
});

// === OPTION B: Manual lock management ===
acquireLock("/path/to/data.jsonl", 5000); // 5s timeout
try {
  safeAppendFileSync("/path/to/data.jsonl", newLine + "\n");
} finally {
  releaseLock("/path/to/data.jsonl");
}

// === OPTION C: Dual-write to MASTER + deduped (debt pipeline) ===
const { appendMasterDebtSync } = require("scripts/lib/safe-fs.js");
appendMasterDebtSync([newItem1, newItem2]); // Handles locking + rollback internally
```

**Key rules:**

- Default lock timeout is 5 seconds. Stale locks (>60s) are automatically broken
- Lock files are named `${filePath}.lock` containing
  `{ pid, timestamp, hostname }`
- Locks are advisory only -- they coordinate cooperating processes but do not
  block raw `fs` calls
- For multi-file writes (e.g., MASTER + deduped), use `appendMasterDebtSync()`
  which handles rollback on partial failure
- Always use `withLock()` over manual `acquireLock`/`releaseLock` to guarantee
  cleanup via try/finally

---

## S15: Direct Firestore Writes (Client-side)

**Anti-pattern:** Writing directly to `journal`, `daily_logs`, or
`inventoryEntries` from the client

**Positive pattern:**

```typescript
// === Cloud Function invocation (required for protected collections) ===
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const createEntry = httpsCallable(functions, "createJournalEntry");

try {
  const result = await createEntry({
    content: "Today's entry...",
    date: "2026-03-13",
    mood: 7,
  });

  if (result.data.success) {
    toast.success("Entry saved");
  }
} catch (error) {
  // Handle 429 (rate limit) gracefully with sonner toast
  if (error.code === "functions/resource-exhausted") {
    toast.error("Too many requests. Please wait a moment.");
  } else {
    toast.error("Failed to save entry");
  }
}

// === For read operations, use the repository pattern ===
// Add queries to lib/firestore-service.ts, NOT inline in components
import { getJournalEntries } from "@/lib/firestore-service";
const entries = await getJournalEntries(userId, { limit: 50 });
```

**Key rules:**

- NO DIRECT WRITES to `journal`, `daily_logs`, `inventoryEntries` -- use Cloud
  Functions (`httpsCallable`)
- All Cloud Functions verify App Check tokens
- Handle `429` rate limit errors with user-facing toasts (`sonner`), not silent
  failures
- `migrateAnonymousUserData` handles anonymous-to-authenticated data merges --
  never merge manually
- For batch operations, chunk under the 500-op Firestore batch limit
- Add new queries to `lib/firestore-service.ts`, not inline in components

---

## S16: Structured Logging (No Raw console.\*)

**Anti-pattern:** `console.log("processing", filePath)` -- leaks paths, no
structure

**Positive pattern:**

```javascript
const { createSafeLogger } = require("scripts/lib/sanitize-error.js");
const {
  sanitizeDisplayString,
  maskEmail,
} = require("scripts/lib/security-helpers.js");

// === OPTION A: Script-level safe logger ===
const log = createSafeLogger("my-script");

log.info("Processing started");
log.error("Failed to process file", error); // auto-sanitizes error
log.warn("Skipping invalid entry", error);

// === OPTION B: Relative path logging ===
const path = require("node:path");
const ROOT = process.cwd();

// Log relative paths, never absolute
console.log(`Processing: ${path.relative(ROOT, targetPath)}`);
// Or use basename for maximum safety
console.warn(`Failed to read: ${path.basename(filePath)}`);

// === OPTION C: Structured audit logging ===
const crypto = require("node:crypto");
const hashedOp = crypto
  .createHash("sha256")
  .update(operatorName)
  .digest("hex")
  .slice(0, 8);

const auditEntry = {
  timestamp: new Date().toISOString(),
  operator: hashedOp, // never raw username
  action: "file_write",
  target: path.basename(filePath),
  result: "success",
};
console.log(JSON.stringify(auditEntry));

// === OPTION D: PII masking ===
console.log(`User: ${maskEmail(userEmail)}`); // "u***@d***.com"
```

**Key rules:**

- Never log raw input content. Log line numbers and character counts instead
- Use `sanitizeDisplayString(str, maxLength)` for display -- strips code blocks,
  normalizes whitespace, truncates
- For file-derived content, strip control characters:
  `/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g`
- Include `\u2028` and `\u2029` (Unicode line separators) in sanitization, not
  just `\n`/`\r`
- Use `path.basename()` or `path.relative()` before logging paths -- never full
  absolute paths
- Hash operator identity for audit trails:
  `crypto.createHash('sha256').update(name).digest('hex').slice(0,8)`
- Filter `Authorization`, `Bearer`, `token` fields from hook/agent output

---

## S17: Cross-Device Rename Safety

**Anti-pattern:** Bare `fs.renameSync(src, dest)` -- fails cross-device, fails
on Windows when dest exists

**Positive pattern:**

```javascript
const { safeRenameSync } = require("scripts/lib/safe-fs.js");

// === OPTION A: Use the helper (handles all edge cases) ===
safeRenameSync(srcPath, destPath);
// Handles: symlink check, EXDEV cross-device, Windows EPERM/EACCES/EEXIST

// === OPTION B: Manual safe rename ===
function safeRename(src, dest) {
  const absSrc = path.resolve(src);
  const absDest = path.resolve(dest);

  // CRITICAL: same-path rename deletes the only copy
  if (absSrc === absDest) return;

  try {
    fs.renameSync(absSrc, absDest);
  } catch (err) {
    if (err.code === "EXDEV") {
      fs.copyFileSync(absSrc, absDest);
      fs.unlinkSync(absSrc);
    } else if (
      err.code === "EPERM" ||
      err.code === "EACCES" ||
      err.code === "EEXIST"
    ) {
      fs.copyFileSync(absSrc, absDest);
      fs.unlinkSync(absSrc);
    } else {
      throw err;
    }
  }
}
```

**Key rules:**

- CRITICAL: Check `src === dest` before any destructive rename -- self-rename
  after `rmSync` deletes the only copy
- Never use bare `fs.renameSync()` -- always wrap with
  `copyFileSync`+`unlinkSync` fallback
- `safeRenameSync` in `scripts/lib/safe-fs.js` also checks both src and dest for
  symlinks
- Clean up `.tmp` files in catch blocks:
  `try { fs.rmSync(tmpPath, { force: true }) } catch {}`

---

## S18: Path Containment Validation

**Anti-pattern:** Using `path.resolve()` without verifying the result stays
within bounds

**Positive pattern:**

```javascript
const path = require("node:path");
const { validatePathInDir } = require("scripts/lib/security-helpers.js");

// === OPTION A: Helper-based validation (preferred) ===
try {
  const rel = validatePathInDir(projectRoot, userPath);
  const resolved = path.resolve(projectRoot, rel);
  // Use `resolved` -- it's guaranteed within projectRoot
} catch (error) {
  console.error("Invalid path");
}

// === OPTION B: Full manual validation chain ===
function containPath(baseDir, userPath) {
  if (!userPath || userPath.length > 4096) throw new Error("Invalid path");

  const resolved = path.resolve(baseDir, userPath);
  const rel = path.relative(baseDir, resolved);

  if (rel === "" || /^\.\.(?:[/\\]|$)/.test(rel) || path.isAbsolute(rel)) {
    throw new Error("Path escapes base directory");
  }

  return resolved; // Store resolved form, not raw input
}

// === OPTION C: Canonical path with realpath ===
const { realpathSync, existsSync } = require("node:fs");

function strictContainPath(baseDir, targetPath) {
  const resolved = path.resolve(baseDir, targetPath);

  try {
    const real = realpathSync(resolved);
    const rel = path.relative(baseDir, real);
    return rel !== "" && !/^\.\.(?:[/\\]|$)/.test(rel) && !path.isAbsolute(rel);
  } catch {
    // Fail-closed: if realpathSync fails but file exists, reject
    if (existsSync(resolved)) return false;
    // File doesn't exist -- validate against resolved path for new file creation
    const rel = path.relative(baseDir, resolved);
    return rel !== "" && !/^\.\.(?:[/\\]|$)/.test(rel) && !path.isAbsolute(rel);
  }
}
```

**Key rules:**

- Decide upfront: descendant-only vs bidirectional. Document with `@containment`
  comment
- Apply validation at ALL touch points, not just the entry point
- Normalize backslashes with `.replace(/\\/g, "/")` BEFORE `includes()`,
  `endsWith()`, `has()`, `startsWith()`
- Store validated/resolved form immediately. Never re-derive from raw input
  later
- After modifying shared validation utilities, grep ALL callers for
  compatibility

---

## S19: Markdown Injection Prevention

**Anti-pattern:** Inserting raw user/file content into generated Markdown

**Positive pattern:**

```javascript
const {
  escapeMd,
  sanitizeDisplayString,
} = require("scripts/lib/security-helpers.js");

// === Escape user-provided text for Markdown ===
const safeTitle = escapeMd(rawTitle, 200); // escapes []()_*`#>!- and more
const safeDesc = sanitizeDisplayString(rawDescription, 500); // strips code, truncates

// === Building a Markdown table row ===
const row = `| ${escapeMd(name)} | ${escapeMd(status)} | ${escapeMd(notes)} |`;

// === Entity escaping order (HTML) ===
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;") // & FIRST -- order matters!
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
```

**Key rules:**

- `escapeMd()` handles backticks -- important for template literal injection
- `sanitizeDisplayString()` strips code blocks, inline code, normalizes
  whitespace, truncates
- Escape `&` FIRST in HTML entity escaping -- wrong order turns `&lt;` into
  `&amp;lt;`
- For Markdown links, encode parentheses: `encodeURI()` doesn't encode `()`
  which breaks `[text](url)`
- Apply sanitization to ALL fields in generated Markdown, not just user-visible
  ones

---

## S20: Number Safety

**Anti-pattern:** `parseInt(str)`, `Math.max(...arr)`, `value || 0` treating 0
as falsy

**Positive pattern:**

```javascript
// === parseInt with explicit radix ===
const num = Number.parseInt(str, 10); // NOT parseInt(str)

// === Safe max/min on arrays ===
function safeMax(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  // For large arrays, use reduce (spread overflows at ~65k args)
  return arr.reduce((max, val) => {
    const n = Number(val);
    return Number.isFinite(n) && n > max ? n : max;
  }, -Infinity);
}

// === Division-by-zero guard ===
function safePercent(numerator, denominator) {
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return 0;
  }
  return (numerator / denominator) * 100;
}

// === NaN-safe sorting ===
arr.sort((a, b) => (Number(a) || 0) - (Number(b) || 0));

// === Nullish coalescing (0 and "" are valid) ===
const count = value ?? 0; // keeps 0 as valid
// NOT: const count = value || 0;  // treats 0 as falsy

// === Null vs falsy for metrics ===
if (field == null) {
  /* truly missing */
}
// NOT: if (!field) { /* rejects valid 0 */ }

// === Guard numeric inputs ===
if (!Number.isFinite(input)) {
  return fallback;
}

// === Range clamping ===
const clamped = Math.max(0, Math.min(100, value));
```

**Key rules:**

- Always pass radix to `Number.parseInt(str, 10)`
- Use `??` not `||` when 0 or `""` are valid values
- Use `== null` for metrics/numeric fields, not `!field` (rejects valid 0)
- Guard with `Number.isFinite(n)` before math operations
- Use `reduce()` for large arrays, not `Math.max(...arr)` (stack overflow at
  ~65k)

---

## S21: Prototype Pollution Prevention

**Anti-pattern:** Using plain `{}` as dictionary with untrusted keys
(`__proto__` attack)

**Positive pattern:**

```javascript
// === OPTION A: Map (preferred for untrusted keys) ===
const lookup = new Map();
for (const item of untrustedData) {
  lookup.set(item.key, item.value); // "__proto__" is just a normal key
}

// === OPTION B: Null-prototype object ===
const dict = Object.create(null);
for (const item of untrustedData) {
  dict[item.key] = item.value; // No prototype chain to pollute
}

// === OPTION C: isPlainObject guard for deep operations ===
function isPlainObject(obj) {
  return Object.getPrototypeOf(obj) === Object.prototype;
}

function safeRedact(obj) {
  if (!isPlainObject(obj)) return obj; // Don't corrupt Date/Timestamp
  // ... proceed with redaction
}
```

**Key rules:**

- `Object.create(null)` has no `toString`/`hasOwnProperty` -- use
  `Object.hasOwn(dict, key)` instead
- For JSON parsed from files, validate structure before using keys as property
  access
- Use `isPlainObject()` guard before recursing into objects for
  redaction/transformation

---

## S22: SSRF/URL Validation

**Anti-pattern:** Fetching URLs from external input without validation

**Positive pattern:**

```javascript
const { validateUrl } = require("scripts/lib/security-helpers.js");

const ALLOWED_HOSTS = ["api.github.com", "registry.npmjs.org"];

const result = validateUrl(userProvidedUrl, ALLOWED_HOSTS);
if (!result.valid) {
  console.error(`URL rejected: ${result.error}`);
  return;
}

// Safe to fetch -- result.url is a validated URL object
const response = await fetch(result.url.href, {
  signal: AbortSignal.timeout(10000), // Always set a timeout
});
```

**Key rules:**

- `validateUrl()` blocks localhost, loopback, octal IP, decimal IP, and raw IP
  addresses
- Use exact hostname matching, not substring (`evil.github.com` should not match
  `github.com`)
- Always set `AbortController` / `AbortSignal.timeout()` -- network calls can
  hang indefinitely
- Block `javascript:` and `data:` protocols from external APIs
- HTTPS only -- no HTTP

---

## S23: Firestore Timestamp Safety

**Anti-pattern:** Calling `.toDate()` without checking the value type

**Positive pattern:**

```typescript
// === Safe timestamp conversion ===
function toDate(value: unknown): Date | null {
  if (!value) return null;

  if (typeof (value as any)?.toDate === "function") {
    return (value as any).toDate();
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  return null;
}

// === Local date extraction (avoid UTC shift) ===
const date = new Date();
const year = date.getFullYear(); // NOT toISOString().split("T")[0]
const month = date.getMonth(); // toISOString converts to UTC first
const day = date.getDate();

// === UTC-safe date arithmetic ===
const nextDay = new Date(date);
nextDay.setUTCDate(nextDay.getUTCDate() + 1); // NOT setDate(getDate() + 1)
```

**Key rules:**

- Check `typeof x?.toDate === "function"` before calling `.toDate()`
- Timestamps may be null, undefined, Firestore Timestamp, Date, or plain string
- Use `getFullYear()`/`getMonth()`/`getDate()` for local dates, not
  `toISOString()`
- Use `setUTCDate(getUTCDate() + 1)` for timezone-safe arithmetic

---

## S24: React/Frontend Patterns

**Anti-pattern:** Various React anti-patterns (stale closures, object deps,
missing null guards)

**Positive pattern:**

```tsx
// === SSR-safe browser API access ===
if (typeof globalThis.window !== "undefined") {
  localStorage.setItem("key", value);
}

// === Primitive useEffect deps (avoid object comparison) ===
useEffect(() => {
  if (user?.uid) fetchData(user.uid);
}, [user?.uid]); // NOT [user]

// === Functional setState (avoid stale closures) ===
const handleClick = useCallback(() => {
  setItems((prev) => [...prev, newItem]);
}, [newItem]);

// === Async cleanup pattern ===
useEffect(() => {
  let isCancelled = false;

  async function load() {
    const data = await fetchData();
    if (!isCancelled) setData(data);
  }
  load();

  return () => {
    isCancelled = true;
  };
}, []);

// === Null guard at render boundary ===
if (!user) return null;

// === Accessible toggle ===
<button role="switch" aria-checked={isOn} onClick={toggle}>
  {isOn ? "On" : "Off"}
</button>;

// === Stable keys (never array index) ===
{
  items.map((item) => <ListItem key={item.id} data={item} />);
}

// === finally for loading state ===
try {
  setLoading(true);
  await saveData();
} catch (error) {
  toast.error("Save failed");
} finally {
  setLoading(false);
}

// === Module-level init flags (Strict Mode safe) ===
let didInit = false;
function MyComponent() {
  useEffect(() => {
    if (didInit) return;
    didInit = true;
    initSideEffect();
  }, []);
}

// === Claims preservation ===
// Firebase replaces entire claims object -- spread existing first
await setCustomUserClaims(uid, { ...existingClaims, newClaim: true });
```

**Key rules:**

- Use `globalThis.window` for SSR-safe browser detection, not bare `window`
- Use primitive values in dependency arrays (`user?.uid` not `user`)
- Use `setState((prev) => ...)` in useCallback to avoid stale closures
- Move side effects from setState to useEffect (called twice in Strict Mode)
- Independent try/catch for localStorage vs Firestore (one failing shouldn't
  block the other)
- Use `data-testid="{feature}-{element}"` for test selectors

---

## S25: Bash/Shell Safety

**Anti-pattern:** Various shell scripting anti-patterns

**Positive pattern:**

```bash
# === printf over echo (prevents -n/-e injection) ===
printf '%s\n' "$VAR"  # NOT echo "$VAR"

# === File iteration (safe with spaces) ===
while IFS= read -r file; do
  process "$file"
done < <(find . -name "*.js")
# NOT: for file in $list; do ...

# === Temp file cleanup ===
TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"' EXIT

# === End-of-options ===
basename -- "$PATH"

# === Retry loops ===
for i in 1 2 3; do
  cmd && break
  sleep 5
done

# === POSIX compliance in .husky/ scripts ===
# NO: $'\r', grep -P, [[ ]]
# YES: printf variables, grep -E, [ ]

# === Shell redirection order ===
cmd > file 2>&1   # CORRECT (stderr to stdout, both to file)
# NOT: cmd 2>&1 > file  (stderr goes to terminal)

# === set -o pipefail ===
set -o pipefail  # Before pipes in bash-based validation scripts

# === EXIT trap chaining ===
# Use add_exit_trap helper, NOT multiple `trap ... EXIT` overwrites

# === Process substitution for variable scope ===
count=0
while IFS= read -r line; do
  count=$((count + 1))
done < <(cmd)
# NOT: cmd | while read line; do count=$((count+1)); done  # subshell loses $count
```

**Key rules:**

- Use `printf '%s'` not `echo` (prevents `-n`/`-e` injection)
- Use `while IFS= read -r` for file iteration, not `for file in $list`
- Always `trap 'rm -f "$TMPFILE"' EXIT` for temp file cleanup
- Use process substitution `< <(cmd)` not pipe `cmd |` to preserve variables
- `.husky/` scripts run under `/bin/sh` -- avoid bash-isms
- Second `trap ... EXIT` overwrites first -- use chaining helper
- `> file 2>&1` (correct order) not `2>&1 > file`

---

## Version History

| Version | Date       | Changes                                                  |
| ------- | ---------- | -------------------------------------------------------- |
| 2.0     | 2026-03-13 | Wave 3.1 expansion: S13-S25 added, all patterns deepened |
| 1.0     | 2026-03-13 | Initial -- 12 positive patterns from CODE_PATTERNS.md    |
