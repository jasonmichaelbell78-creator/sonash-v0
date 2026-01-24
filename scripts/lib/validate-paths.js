#!/usr/bin/env node
/**
 * validate-paths.js - Shared path validation utilities for hooks
 *
 * Used by multiple hooks to ensure consistent security checks for:
 * - Path traversal prevention
 * - Option injection prevention
 * - Multiline path rejection
 * - Containment verification
 *
 * Quick Win #3: Consolidates duplicate validation logic from 5+ hooks
 */

const path = require("node:path");
const fs = require("node:fs");

/**
 * Sanitize filesystem error messages to prevent information leakage
 * @param {unknown} err - The error to sanitize
 * @returns {string} - Safe error message
 */
function sanitizeFilesystemError(err) {
  const message = err instanceof Error ? err.message : String(err);
  // Redact system paths and sensitive details (handle paths with spaces - Review #200 Round 2)
  return message
    .replace(/\/home\/[^\n\r]+/g, "[HOME]")
    .replace(/\/Users\/[^\n\r]+/g, "[HOME]")
    .replace(/C:\\Users\\[^\n\r]+/g, "[HOME]")
    .replace(/\/etc\/[^\n\r]+/g, "[CONFIG]")
    .replace(/\/var\/[^\n\r]+/g, "[VAR]")
    .replace(/\/private\/[^\n\r]+/g, "[PRIVATE]")
    .replace(/\/opt\/[^\n\r]+/g, "[OPT]")
    .replace(/[A-Z]:\\[^\n\r]+/g, "[DRIVE]"); // Other Windows drives
}

/**
 * Validate that a file path is safe and within the project directory
 *
 * @param {string} filePath - The file path to validate (can be relative or absolute)
 * @param {string} projectDir - The project directory (resolved absolute path)
 * @returns {object} { valid: boolean, error: string | null, normalized: string | null }
 */
function validateFilePath(filePath, projectDir) {
  // Reject non-string paths early (Review #200 - Qodo suggestion #11)
  if (typeof filePath !== "string") {
    return { valid: false, error: "Non-string file path rejected", normalized: null };
  }

  // Normalize trivial bypasses (Review #200 Round 2 - Qodo suggestion #4)
  filePath = filePath.trim();

  // Reject empty paths
  if (!filePath) {
    return { valid: false, error: "Empty file path", normalized: null };
  }

  // Security: Reject control chars (defense-in-depth - Review #200 Round 2 - Qodo suggestion #4)
  // Control characters: 0x00-0x1F, 0x7F-0x9F (excluding tab, newline, carriage return which are checked separately)
  // eslint-disable-next-line no-control-regex -- Intentional control character validation for security
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(filePath)) {
    return { valid: false, error: "Control character rejected", normalized: null };
  }

  // Security: Reject option-like paths (prevent command injection)
  if (filePath.startsWith("-")) {
    return { valid: false, error: "Option-like path rejected", normalized: null };
  }

  // Security: Reject multiline paths (prevent injection)
  if (filePath.includes("\n") || filePath.includes("\r")) {
    return { valid: false, error: "Multiline path rejected", normalized: null };
  }

  // Security: Reject NUL bytes (Review #200 - Qodo suggestion #9)
  if (filePath.includes("\0")) {
    return { valid: false, error: "NUL byte rejected", normalized: null };
  }

  const projectRoot = path.resolve(projectDir);

  // Allow absolute paths only if they are contained in projectDir (Review #200 - Qodo suggestion #10)
  if (path.isAbsolute(filePath)) {
    const abs = path.resolve(filePath);
    const rel = path.relative(projectRoot, abs);
    if (rel === "" || rel.startsWith(".." + path.sep) || rel === ".." || path.isAbsolute(rel)) {
      return { valid: false, error: "Absolute path outside project directory", normalized: null };
    }
    filePath = rel;
  }

  // Normalize backslashes to forward slashes (Windows compatibility)
  const normalized = filePath.replace(/\\/g, "/");

  // Defense-in-depth: reject anchored paths after normalization (Review #200 Round 2 - Qodo suggestion #2)
  if (
    normalized.startsWith("/") ||
    normalized.startsWith("//") ||
    /^[A-Za-z]:\//.test(normalized)
  ) {
    return { valid: false, error: "Absolute path rejected", normalized: null };
  }

  // Security: Block path traversal using regex (handles .., ../, ..\ edge cases)
  if (
    normalized.includes("/../") ||
    /^\.\.(?:[\\/]|$)/.test(normalized) ||
    normalized.endsWith("/..")
  ) {
    return { valid: false, error: "Path traversal detected", normalized: null };
  }

  return { valid: true, error: null, normalized };
}

/**
 * Verify that a resolved path is contained within the project directory
 * Uses realpathSync for symlink-aware containment checks
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
  if (
    pathRel === "" ||
    pathRel.startsWith(".." + path.sep) ||
    pathRel === ".." ||
    path.isAbsolute(pathRel)
  ) {
    return { contained: false, error: "Path outside project directory", realPath: null };
  }

  return { contained: true, error: null, realPath };
}

/**
 * Combined validation: safe path format + containment check
 *
 * @param {string} filePath - The file path to validate
 * @param {string} projectDir - The project directory
 * @returns {object} { valid: boolean, error: string | null, normalized: string | null, realPath: string | null }
 */
function validateAndVerifyPath(filePath, projectDir) {
  // Step 1: Validate path format
  const validation = validateFilePath(filePath, projectDir);
  if (!validation.valid) {
    return { ...validation, realPath: null };
  }

  // Step 2: Verify containment
  const containment = verifyContainment(validation.normalized, projectDir);
  if (!containment.contained) {
    return {
      valid: false,
      error: containment.error,
      normalized: validation.normalized,
      realPath: null,
    };
  }

  return {
    valid: true,
    error: null,
    normalized: validation.normalized,
    realPath: containment.realPath,
  };
}

module.exports = {
  validateFilePath,
  verifyContainment,
  validateAndVerifyPath,
};
