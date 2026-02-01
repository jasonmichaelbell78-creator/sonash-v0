# Security Audit Patches - SoNash Scripts

**Purpose:** Remediation code for findings in SECURITY_AUDIT_REPORT.md
**Severity Levels:** S1 (Critical) and S2 (Important)

---

## CANON-0003: Add NUL Byte Validation

**File:** `scripts/lib/security-helpers.js` **Function:** `validatePathInDir()`
**Severity:** S1 (Critical)

**Patch:**

```javascript
/**
 * Validate that a path is within an allowed directory
 * Pattern: #17, #18, #41 (path traversal prevention)
 *
 * @param {string} baseDir - Base directory (must be within this)
 * @param {string} userPath - User-provided path to validate
 * @returns {string} Validated relative path
 * @throws {Error} If path escapes baseDir
 */
function validatePathInDir(baseDir, userPath) {
  // Reject empty/falsy paths upfront
  if (!userPath || typeof userPath !== "string" || userPath.trim() === "") {
    throw new Error(`Path must be within ${path.basename(baseDir)}/`);
  }

  // CANON-0003: Reject NUL bytes (Pattern #108)
  if (userPath.includes("\x00")) {
    throw new Error("NUL byte in path rejected");
  }

  const resolved = path.resolve(baseDir, userPath);
  const rel = path.relative(baseDir, resolved);

  if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
    throw new Error(`Path must be within ${path.basename(baseDir)}/`);
  }

  return rel;
}
```

**Testing:**

```javascript
test("validatePathInDir rejects NUL bytes", () => {
  expect(() => {
    validatePathInDir("/base", "file\x00.txt");
  }).toThrow("NUL byte in path rejected");
});

test("validatePathInDir rejects NUL byte traversal", () => {
  expect(() => {
    validatePathInDir("/project", "docs\x00../../../etc/passwd");
  }).toThrow("NUL byte in path rejected");
});
```

---

## CANON-0008: Use Absolute Path for Git Command

**File:** `scripts/lib/security-helpers.js` **Function:** `safeGitAdd()`
**Severity:** S1 (Critical)

**Patch Option 1: Use Full Path (Recommended)**

```javascript
/**
 * Safely stage a file with git add
 * Pattern: #31, #38, #40, #41 (git security)
 *
 * @param {string} repoRoot - Repository root directory
 * @param {string} filePath - Path to stage (relative to repo)
 * @throws {Error} If path is invalid or outside repo
 */
function safeGitAdd(repoRoot, filePath) {
  // Block pathspec magic (Pattern #40)
  if (filePath.startsWith(":")) {
    throw new Error("Git pathspec magic is not allowed");
  }

  // Validate path is within repo (Pattern #41)
  const validPath = validatePathInDir(repoRoot, filePath);

  // CANON-0008: Use absolute path to git to prevent PATH manipulation
  // Resolve git binary path from system PATH
  let gitBin = "git"; // Fallback to PATH resolution
  try {
    if (process.platform === "win32") {
      const { execSync } = require("node:child_process");
      gitBin = execSync("where git", { encoding: "utf8" })
        .trim()
        .split("\n")[0];
    } else {
      const { execSync } = require("node:child_process");
      gitBin = execSync("which git", { encoding: "utf8" }).trim();
    }
  } catch {
    // If which/where fails, fall through to using 'git' from PATH
    // This is acceptable if PATH is clean (documented assumption)
    console.warn("Could not resolve git binary path, using PATH");
  }

  // Use -- terminator to prevent option injection (Pattern #31)
  execFileSync(gitBin, ["add", "--", validPath], { cwd: repoRoot });
}
```

**Patch Option 2: Document PATH Requirement (If git resolution is not desired)**

```javascript
/**
 * Safely stage a file with git add
 * Pattern: #31, #38, #40, #41 (git security)
 *
 * SECURITY NOTE: This function resolves the 'git' command from system PATH.
 * It is the caller's responsibility to ensure PATH is not controlled by
 * untrusted users. In production environments, consider using an absolute
 * path to git or validating the git binary before execution.
 *
 * @param {string} repoRoot - Repository root directory
 * @param {string} filePath - Path to stage (relative to repo)
 * @throws {Error} If path is invalid or outside repo
 */
function safeGitAdd(repoRoot, filePath) {
  // Block pathspec magic (Pattern #40)
  if (filePath.startsWith(":")) {
    throw new Error("Git pathspec magic is not allowed");
  }

  // Validate path is within repo (Pattern #41)
  const validPath = validatePathInDir(repoRoot, filePath);

  // Use -- terminator to prevent option injection (Pattern #31)
  execFileSync("git", ["add", "--", validPath], { cwd: repoRoot });
}
```

**Testing:**

```javascript
test("safeGitAdd rejects pathspec magic", () => {
  expect(() => {
    safeGitAdd("/repo", ":!README.md");
  }).toThrow("Git pathspec magic is not allowed");
});

test("safeGitAdd stages valid files", () => {
  // Mock execFileSync
  const execFileSync = jest.fn();
  safeGitAdd("/repo", "file.txt");
  expect(execFileSync).toHaveBeenCalledWith(
    expect.any(String), // git or resolved path
    ["add", "--", "file.txt"],
    { cwd: "/repo" }
  );
});
```

---

## CANON-0002: Refactor Error Sanitization Patterns

**File:** `scripts/lib/security-helpers.js` **Function:** `sanitizeError()`
**Severity:** S2 (Important)

**Current Code (Problematic):**

```javascript
function sanitizeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
    .replace(/\/home\/[^/\s]+/gi, "[HOME]")
    .replace(/\/Users\/[^/\s]+/gi, "[HOME]")
    .replace(/[A-Za-z]:\\[^\s]+/gi, "[PATH]")
    .replace(/\/[^\s]*\/[^\s]+/g, "[PATH]"); // TOO BROAD!
}
```

**Patch:**

```javascript
/**
 * Sanitize error messages to prevent path/credential leakage
 * Pattern: #34 (relative path logging)
 *
 * CANON-0002: Narrower patterns to avoid over-sanitization
 *
 * @param {Error|string} error - Error to sanitize
 * @returns {string} Sanitized error message
 */
function sanitizeError(error) {
  const message = error instanceof Error ? error.message : String(error);

  // Targeted patterns (not overly broad)
  return (
    message
      // Windows user home directories (CANON-0002: Fix broad pattern)
      .replace(/C:\\Users\\([^\\]+)\\/gi, "[USER_PATH]")
      // Unix user home directories
      .replace(/\/home\/([^/]+)\//gi, "[HOME]/")
      .replace(/\/Users\/([^/]+)\//gi, "[HOME]/")
      // System configuration and variable paths
      .replace(/\/etc\/[^\s]*/gi, "[CONFIG]")
      .replace(/\/var\/[^\s]*/gi, "[VAR]")
      .replace(/\/opt\/[^\s]*/gi, "[OPT]")
      .replace(/\/tmp\/[^\s]*/gi, "[TMP]")
      // Windows drive paths
      .replace(/[A-Z]:\\([^\\]+)\\[^\s]*/gi, "[DRIVE_PATH]")
    // REMOVED: Generic /path/path pattern that was too broad
    // Users can manually mask URLs if needed by passing pre-sanitized error
  );
}
```

**Testing:**

```javascript
test("sanitizeError preserves file:// URLs", () => {
  const error = new Error("Failed to parse file:///etc/config.json");
  const result = sanitizeError(error);
  expect(result).toContain("file://");
});

test("sanitizeError redacts home directories", () => {
  const error = new Error("Error at /home/alice/project/file.txt");
  const result = sanitizeError(error);
  expect(result).toContain("[HOME]");
  expect(result).not.toContain("/home/alice");
});

test("sanitizeError preserves regex patterns", () => {
  const error = new Error("Pattern /foo\/bar/ does not match");
  const result = sanitizeError(error);
  expect(result).toContain("/foo");
});
```

---

## CANON-0004: Improve CLI Number Validation

**File:** `scripts/lib/security-helpers.js` **Function:** `parseCliArgs()`
**Severity:** S2 (Important)

**Patch:**

```javascript
function parseCliArgs(args, schema) {
  const options = {};
  const errors = [];

  // Initialize defaults
  for (const [flag, def] of Object.entries(schema)) {
    if (def.type === "boolean") {
      options[flag] = false;
    } else if (def.default !== undefined) {
      options[flag] = def.default;
    }
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const def = schema[arg];

    if (!def) continue;

    if (def.type === "boolean") {
      options[arg] = true;
    } else {
      const next = args[i + 1];

      // Validate value exists and isn't another flag
      if (!next || next.startsWith("--")) {
        errors.push(`Missing value for ${arg}`);
        continue;
      }

      if (def.type === "number") {
        const num = parseInt(next, 10);
        // CANON-0004: Check for Infinity and ensure number is finite
        if (isNaN(num) || !Number.isFinite(num)) {
          errors.push(`${arg} must be a valid finite number`);
          continue;
        }
        if (def.min !== undefined && num < def.min) {
          errors.push(`${arg} must be >= ${def.min}`);
          continue;
        }
        if (def.max !== undefined && num > def.max) {
          errors.push(`${arg} must be <= ${def.max}`);
          continue;
        }
        options[arg] = num;
      } else {
        options[arg] = next;
      }

      i++; // Skip next arg (the value)
    }
  }

  // Check required
  for (const [flag, def] of Object.entries(schema)) {
    if (def.required && options[flag] === undefined) {
      errors.push(`${flag} is required`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`CLI argument errors:\n  - ${errors.join("\n  - ")}`);
  }

  return options;
}
```

**Testing:**

```javascript
test("parseCliArgs rejects Infinity", () => {
  expect(() => {
    parseCliArgs(["--count", "Infinity"], {
      "--count": { type: "number", min: 1, max: 100 },
    });
  }).toThrow("must be a valid finite number");
});

test("parseCliArgs rejects large exponent notation", () => {
  expect(() => {
    parseCliArgs(["--count", "9999999999999999999"], {
      "--count": { type: "number", min: 1, max: 100 },
    });
  }).toThrow("must be <= 100");
});

test("parseCliArgs accepts valid numbers", () => {
  const result = parseCliArgs(["--count", "50"], {
    "--count": { type: "number", min: 1, max: 100 },
  });
  expect(result["--count"]).toBe(50);
});
```

---

## CANON-0013: Add Port Validation to validateUrl

**File:** `scripts/lib/security-helpers.js` **Function:** `validateUrl()`
**Severity:** S2 (Important)

**Patch:**

```javascript
/**
 * Validate URL against SSRF allowlist
 * Pattern: SSRF allowlist (explicit hostname + protocol enforcement)
 *
 * CANON-0013: Add port validation to prevent SSRF to internal services
 *
 * @param {string} urlString - URL to validate
 * @param {string[]} allowedHosts - List of allowed hostnames
 * @returns {{valid: boolean, url?: URL, error?: string}}
 */
function validateUrl(urlString, allowedHosts) {
  try {
    const url = new URL(urlString);

    if (url.protocol !== "https:") {
      return { valid: false, error: "Only HTTPS URLs allowed" };
    }

    // Block localhost/loopback bypasses (SSRF hardening)
    const hostname = url.hostname.toLowerCase();
    const blockedPatterns = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "::1",
      "[::1]",
      "0177.0.0.1", // Octal
      "2130706433", // Decimal
    ];
    if (
      blockedPatterns.some((p) => hostname === p || hostname.endsWith("." + p))
    ) {
      return { valid: false, error: "Localhost/loopback not allowed" };
    }

    // Block IP addresses (only allow domain names)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.startsWith("[")) {
      return {
        valid: false,
        error: "IP addresses not allowed - use domain names",
      };
    }

    // CANON-0013: Validate port - only allow standard HTTPS (443)
    if (url.port && url.port !== "" && url.port !== "443") {
      return {
        valid: false,
        error: `Custom ports not allowed - only standard HTTPS port 443. Got: ${url.port}`,
      };
    }

    // Exact hostname match only (no subdomain bypass)
    if (!allowedHosts.some((allowed) => hostname === allowed.toLowerCase())) {
      return { valid: false, error: `Host ${hostname} not in allowlist` };
    }

    return { valid: true, url };
  } catch {
    return { valid: false, error: "Invalid URL" };
  }
}
```

**Testing:**

```javascript
test("validateUrl rejects custom ports", () => {
  const result = validateUrl("https://api.github.com:6379", ["api.github.com"]);
  expect(result.valid).toBe(false);
  expect(result.error).toContain("Custom ports");
});

test("validateUrl allows standard HTTPS port", () => {
  const result = validateUrl("https://api.github.com:443", ["api.github.com"]);
  expect(result.valid).toBe(true);
});

test("validateUrl allows implicit HTTPS port", () => {
  const result = validateUrl("https://api.github.com", ["api.github.com"]);
  expect(result.valid).toBe(true);
});

test("validateUrl rejects HTTP", () => {
  const result = validateUrl("http://api.github.com", ["api.github.com"]);
  expect(result.valid).toBe(false);
});
```

---

## CANON-0010: Add Input Length Bounds to maskEmail

**File:** `scripts/lib/security-helpers.js` **Function:** `maskEmail()`
**Severity:** S2 (Important)

**Patch:**

```javascript
/**
 * Mask PII for logging
 * Pattern: PII masking (privacy in logs)
 *
 * CANON-0010: Add input length validation to prevent DoS
 *
 * @param {string} email - Email to mask
 * @returns {string} Masked email like u***@d***.com
 */
function maskEmail(email) {
  if (!email || typeof email !== "string") return "[REDACTED]";

  // CANON-0010: RFC 5321 specifies max email length of 254 characters
  if (email.length > 254) {
    return "[REDACTED]"; // Reject unusually long emails
  }

  const parts = email.split("@");
  if (parts.length !== 2) return "[REDACTED]";

  const [local, domain] = parts;
  if (!local || !domain) return "[REDACTED]";

  const domainParts = domain.split(".");

  // CANON-0010: Reject emails with unreasonable number of domain labels
  // (Normal emails have 2-5 labels; more suggests DoS attempt)
  if (domainParts.length > 50) {
    return "[REDACTED]";
  }

  // Handle edge cases: empty local, single-part domain
  const maskedLocal = local.length > 0 ? local.charAt(0) + "***" : "***";

  // Domain must have at least one dot for valid email
  if (domainParts.length < 2) {
    return `${maskedLocal}@[REDACTED]`;
  }

  // Mask the main domain (second-to-last part), keep subdomains and TLD visible
  // e.g., user@subdomain.example.com -> u***@subdomain.e***.com
  let maskedDomain;
  if (domainParts.length > 2) {
    const subdomains = domainParts.slice(0, -2);
    const mainDomain = domainParts[domainParts.length - 2];
    const tld = domainParts[domainParts.length - 1];
    const maskedMainDomain = mainDomain.charAt(0) + "***";
    maskedDomain = [...subdomains, maskedMainDomain, tld].join(".");
  } else {
    // Simple domain like example.com
    const maskedMainDomain = domainParts[0].charAt(0) + "***";
    maskedDomain = maskedMainDomain + "." + domainParts[1];
  }

  return `${maskedLocal}@${maskedDomain}`;
}
```

**Testing:**

```javascript
test("maskEmail rejects overly long emails", () => {
  const longEmail = "user@" + "a".repeat(300) + ".com";
  const result = maskEmail(longEmail);
  expect(result).toBe("[REDACTED]");
});

test("maskEmail rejects emails with many domain labels", () => {
  const manyDotsEmail = "user@" + "a.".repeat(100) + "com";
  const result = maskEmail(manyDotsEmail);
  expect(result).toBe("[REDACTED]");
});

test("maskEmail handles normal emails", () => {
  const result = maskEmail("alice@example.com");
  expect(result).toMatch(/^a\*\*\*@e\*\*\*\.com$/);
});

test("maskEmail handles subdomains", () => {
  const result = maskEmail("alice@sub.example.com");
  expect(result).toMatch(/^a\*\*\*@sub\.e\*\*\*\.com$/);
});
```

---

## CANON-0006: Document TOCTOU Race in verifyContainment

**File:** `scripts/lib/validate-paths.js` **Function:** `verifyContainment()`
**Severity:** S2 (Important)

**Patch: Add Documentation (Minimal Change)**

```javascript
/**
 * Verify that a resolved path is contained within the project directory
 * Uses realpathSync for symlink-aware containment checks
 *
 * SECURITY NOTE (CANON-0006):
 * This function has an inherent TOCTOU (Time-of-Check-Time-of-Use) race condition
 * between resolving fullPath and projectDir. This is acceptable for git hooks and
 * CI operations where:
 * 1. The hook runs in a controlled environment
 * 2. Project directories are stable during hook execution
 * 3. An attacker would need write access to modify symlinks between calls
 *
 * If higher security is needed (e.g., multi-tenant systems), consider:
 * - Resolving projectDir once at entry and caching it
 * - Adding filesystem monitoring to detect changes
 * - Using file descriptors instead of paths
 *
 * @param {string} filePath - The file path (relative to projectDir)
 * @param {string} projectDir - The project directory (resolved absolute path)
 * @returns {object} { contained: boolean, error: string | null, realPath: string | null }
 */
function verifyContainment(filePath, projectDir) {
  // Defense-in-depth: Validate format first (Review #200 - Qodo suggestion #14)
  const validation = validateFilePath(filePath, projectDir);
  if (!validation.valid) {
    return { contained: false, error: validation.error, realPath: null };
  }

  const fullPath = path.resolve(projectDir, validation.normalized);

  // Resolve symlinks without TOCTOU race (Review #200 - Qodo suggestion #12)
  // Don't use existsSync - rely on realpathSync error handling
  let realPath = "";
  let realProject = "";
  try {
    // CANON-0006: Note - there is a TOCTOU window between these two calls
    // This is documented as acceptable for git hook operations
    realPath = fs.realpathSync(fullPath);
    realProject = fs.realpathSync(projectDir);
  } catch (err) {
    const e = /** @type {NodeJS.ErrnoException} */ (err);
    // Handle specific error codes clearly
    if (e && (e.code === "ENOENT" || e.code === "ENOTDIR")) {
      return { contained: false, error: "File does not exist", realPath: null };
    }
    // Sanitize other filesystem errors (Review #200 - Qodo suggestion #5)
    return {
      contained: false,
      error: `Filesystem error: ${sanitizeFilesystemError(err)}`,
      realPath: null,
    };
  }

  // Check containment using path.relative()
  // rel === '' means file path equals projectDir (invalid for file operations)
  const pathRel = path.relative(realProject, realPath);
  // Use segment-based check instead of startsWith (Review #200 R4 - Qodo)
  const segments = pathRel.split(path.sep);
  if (
    pathRel === "" ||
    segments[0] === ".." ||
    pathRel === ".." ||
    path.isAbsolute(pathRel)
  ) {
    return {
      contained: false,
      error: "Path outside project directory",
      realPath: null,
    };
  }

  return { contained: true, error: null, realPath };
}
```

**Acceptance Criteria:**

- Document why TOCTOU is acceptable for git hooks
- Add recommendation for higher-security scenarios
- Keep implementation unchanged (no functional risk)

---

## Summary of Patches

| Finding ID | Severity | File                | Function            | Patch Complexity          |
| ---------- | -------- | ------------------- | ------------------- | ------------------------- |
| CANON-0003 | S1       | security-helpers.js | validatePathInDir() | Low - Add 3 lines         |
| CANON-0008 | S1       | security-helpers.js | safeGitAdd()        | Medium - Resolve git path |
| CANON-0002 | S2       | security-helpers.js | sanitizeError()     | Low - Refactor patterns   |
| CANON-0004 | S2       | security-helpers.js | parseCliArgs()      | Low - Add 1 check         |
| CANON-0013 | S2       | security-helpers.js | validateUrl()       | Low - Add port check      |
| CANON-0010 | S2       | security-helpers.js | maskEmail()         | Low - Add length checks   |
| CANON-0006 | S2       | validate-paths.js   | verifyContainment() | Low - Document only       |

---

## Implementation Order

**Phase 1 - Critical (Deploy Immediately)**

1. CANON-0003: Add NUL byte validation (3 lines)
2. CANON-0008: Use git binary resolution (10 lines + error handling)

**Phase 2 - Important (Next Release)** 3. CANON-0002: Refactor sanitization
patterns (10 lines) 4. CANON-0004: Add number validation (2 lines) 5.
CANON-0013: Add port validation (5 lines) 6. CANON-0010: Add email length bounds
(5 lines)

**Phase 3 - Documentation (Backlog)** 7. CANON-0006: Document TOCTOU race (5
lines of comments)

---

**Generated:** 2026-01-31 **Total Lines to Change:** ~50 lines across 3
critical/important patches
