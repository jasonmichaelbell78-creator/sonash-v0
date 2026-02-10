/**
 * Security Helpers Library
 *
 * Reusable secure implementations for common operations.
 * Use these instead of implementing security patterns from scratch.
 *
 * Pattern references are from CODE_PATTERNS.md
 *
 * @module security-helpers
 */

const { existsSync, lstatSync, writeFileSync, unlinkSync } = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { tmpdir } = require("node:os");

/**
 * Sanitize error messages to prevent path/credential leakage
 * Pattern: #34 (relative path logging)
 *
 * @param {Error|string} error - Error to sanitize
 * @returns {string} Sanitized error message
 */
function sanitizeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
    .replace(/\/home\/[^/\s]+/gi, "[HOME]")
    .replace(/\/Users\/[^/\s]+/gi, "[HOME]")
    .replace(/[A-Z]:\\[^\s]+/gi, "[PATH]")
    .replace(/\/[^\s]*\/[^\s]+/g, "[PATH]");
}

/**
 * Sanitize display strings (for logs, console output)
 * Pattern: #34 (relative path logging)
 *
 * @param {string} str - String to sanitize
 * @param {number} maxLength - Maximum length (default 100)
 * @returns {string} Sanitized string
 */
function sanitizeDisplayString(str, maxLength = 100) {
  if (!str) return "";

  const sanitized = String(str)
    .replace(/```[\s\S]*?```/g, "[CODE]")
    .replace(/`[^`]+`/g, "[CODE]")
    .replace(/C:\\Users\\[^\s]+/gi, "[PATH]")
    .replace(/\/home\/[^\s]+/gi, "[PATH]")
    .replace(/\/Users\/[^\s]+/gi, "[PATH]")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized.length > maxLength ? sanitized.substring(0, maxLength) + "..." : sanitized;
}

/**
 * Escape Markdown metacharacters to prevent injection
 * Pattern: #33, #35 (Markdown injection prevention)
 *
 * @param {string} str - String to escape
 * @param {number} maxLength - Maximum length (default 100)
 * @returns {string} Escaped string safe for Markdown
 */
function escapeMd(str, maxLength = 100) {
  const sanitized = sanitizeDisplayString(str, maxLength);
  // Escape all Markdown metacharacters including backslash
  return sanitized.replace(/[\\[\]()_*`#>!-]/g, "\\$&");
}

/**
 * Check if path or any parent directory is a symlink
 * Pattern: #36, #39 (symlink protection including parents)
 *
 * @param {string} filePath - Path to check
 * @throws {Error} If path or any parent is a symlink
 */
function refuseSymlinkWithParents(filePath) {
  let current = path.resolve(filePath);

  while (true) {
    if (existsSync(current)) {
      const st = lstatSync(current);
      if (st.isSymbolicLink()) {
        throw new Error(`Refusing to write through symlink: ${current}`);
      }
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

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

  const resolved = path.resolve(baseDir, userPath);
  const rel = path.relative(baseDir, resolved);

  if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
    throw new Error(`Path must be within ${path.basename(baseDir)}/`);
  }

  return rel;
}

/**
 * Safely write a new file with security hardening
 * Pattern: #32, #36, #39 (exclusive creation, symlink protection)
 *
 * @param {string} filePath - Path to write
 * @param {string} content - Content to write
 * @param {object} options - Additional options
 * @param {boolean} options.allowOverwrite - Allow overwriting existing files
 * @throws {Error} If file exists (unless allowOverwrite) or symlink detected
 */
function safeWriteFile(filePath, content, options = {}) {
  refuseSymlinkWithParents(filePath);

  if (options.allowOverwrite) {
    // For overwrites, recheck symlink status immediately before write (TOCTOU mitigation)
    if (existsSync(filePath)) {
      const stat = lstatSync(filePath);
      if (stat.isSymbolicLink()) {
        throw new Error(`Refusing to write through symlink: ${filePath}`);
      }
    }
    writeFileSync(filePath, content, {
      encoding: "utf-8",
      flag: "w",
      mode: 0o600,
    });
  } else {
    // For new files, use atomic wx flag (fails if file exists)
    try {
      writeFileSync(filePath, content, {
        encoding: "utf-8",
        flag: "wx",
        mode: 0o600,
      });
    } catch (error) {
      if (error.code === "EEXIST") {
        throw new Error(`Refusing to overwrite existing file: ${filePath}`);
      }
      throw error;
    }
  }
}

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

  // Use -- terminator to prevent option injection (Pattern #31)
  execFileSync("git", ["add", "--", validPath], { cwd: repoRoot });
}

/**
 * Safely create a git commit with temp file handling
 * Pattern: #32 (temp file security)
 *
 * @param {string} repoRoot - Repository root directory
 * @param {string} message - Commit message
 * @returns {boolean} True if commit succeeded
 */
function safeGitCommit(repoRoot, message) {
  const msgFile = path.join(tmpdir(), `COMMIT_MSG_${process.pid}_${Date.now()}.txt`);

  try {
    // Sanitize message content
    const safeMessage = sanitizeDisplayString(message, 5000);

    writeFileSync(msgFile, safeMessage, {
      encoding: "utf-8",
      flag: "wx",
      mode: 0o600,
    });

    execFileSync("git", ["commit", "-F", msgFile], { cwd: repoRoot });
    return true;
  } catch (error) {
    console.warn("Could not create commit:", sanitizeError(error));
    return false;
  } finally {
    try {
      unlinkSync(msgFile);
    } catch {
      // Ignore cleanup failures
    }
  }
}

/**
 * Sanitize a user-provided name for use as filename
 * Pattern: #31, #37 (filename sanitization)
 *
 * @param {string} name - User-provided name
 * @param {object} options - Options
 * @param {number} options.maxLength - Maximum length (default 60)
 * @param {string} options.fallback - Fallback if empty (default "UNNAMED")
 * @returns {string} Safe filename component
 */
function sanitizeFilename(name, options = {}) {
  const { maxLength = 60, fallback = "UNNAMED" } = options;

  const safe = String(name || "")
    .replace(/[/\\]/g, "_") // Remove path separators
    .replace(/\s+/g, "_") // Spaces to underscores
    .replace(/[^a-zA-Z0-9_.-]/g, "") // Remove special chars
    .replace(/^-+/, "") // Strip leading dashes (Pattern #31)
    .slice(0, maxLength);

  return safe || fallback;
}

/**
 * Parse CLI arguments with validation
 * Pattern: CLI validation from PR #310 R5-R6
 *
 * @param {string[]} args - Command line arguments
 * @param {object} schema - Schema defining expected arguments
 * @returns {object} Parsed and validated options
 *
 * Schema format:
 * {
 *   "--flag": { type: "boolean" },
 *   "--option": { type: "string", required: false },
 *   "--count": { type: "number", min: 1, max: 100 }
 * }
 */
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
      const next = args[++i]; // Consume next arg (the value)

      // Validate value exists and isn't another flag
      if (!next || next.startsWith("--")) {
        errors.push(`Missing value for ${arg}`);
        continue;
      }

      if (def.type === "number") {
        const num = Number.parseInt(next, 10);
        if (Number.isNaN(num)) {
          errors.push(`${arg} must be a number`);
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

/**
 * TOCTOU-safe file read
 * Pattern: File reads with try/catch (avoids existsSync race condition)
 *
 * @param {string} filePath - Path to read
 * @param {string} description - Description for error messages
 * @returns {{success: boolean, content?: string, error?: string}}
 */
function safeReadFile(filePath, description) {
  try {
    const content = require("node:fs").readFileSync(filePath, "utf-8");
    return { success: true, content };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { success: false, error: `${description} not found` };
    }
    return { success: false, error: sanitizeError(error) };
  }
}

/**
 * Validate URL against SSRF allowlist
 * Pattern: SSRF allowlist (explicit hostname + protocol enforcement)
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
    if (blockedPatterns.some((p) => hostname === p || hostname.endsWith("." + p))) {
      return { valid: false, error: "Localhost/loopback not allowed" };
    }

    // Block IP addresses (only allow domain names)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.startsWith("[")) {
      return { valid: false, error: "IP addresses not allowed - use domain names" };
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

/**
 * Safely execute regex in loop with proper state management
 * Pattern: Regex state leak prevention (reset lastIndex)
 *
 * @param {RegExp} pattern - Pattern with /g flag
 * @param {string} content - Content to search
 * @returns {RegExpExecArray[]} All matches
 */
function safeRegexExec(pattern, content) {
  if (!pattern.global) {
    throw new Error("Pattern must have /g flag for safe iteration");
  }

  pattern.lastIndex = 0;
  const matches = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    matches.push(match);

    // Prevent infinite loops on zero-length matches
    if (match[0].length === 0) {
      pattern.lastIndex = Math.min(pattern.lastIndex + 1, content.length);
    }
  }

  return matches;
}

/**
 * Mask PII for logging
 * Pattern: PII masking (privacy in logs)
 *
 * @param {string} email - Email to mask
 * @returns {string} Masked email like u***@d***.com
 */
function maskEmail(email) {
  if (!email || typeof email !== "string") return "[REDACTED]";

  const parts = email.split("@");
  if (parts.length !== 2) return "[REDACTED]";

  const [local, domain] = parts;
  if (!local || !domain) return "[REDACTED]";

  const domainParts = domain.split(".");

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

module.exports = {
  // Error/string handling
  sanitizeError,
  sanitizeDisplayString,
  escapeMd,

  // File operations
  refuseSymlinkWithParents,
  validatePathInDir,
  safeWriteFile,
  safeReadFile,

  // Git operations
  safeGitAdd,
  safeGitCommit,

  // Input sanitization
  sanitizeFilename,
  parseCliArgs,

  // Security utilities
  validateUrl,
  safeRegexExec,
  maskEmail,
};
