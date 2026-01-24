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
 * Validate that a file path is safe and within the project directory
 *
 * @param {string} filePath - The file path to validate (can be relative or absolute)
 * @param {string} projectDir - The project directory (resolved absolute path)
 * @returns {object} { valid: boolean, error: string | null, normalized: string | null }
 */
function validateFilePath(filePath, projectDir) {
  // Reject empty paths
  if (!filePath) {
    return { valid: false, error: "Empty file path", normalized: null };
  }

  // Security: Reject option-like paths (prevent command injection)
  if (filePath.startsWith("-")) {
    return { valid: false, error: "Option-like path rejected", normalized: null };
  }

  // Security: Reject multiline paths (prevent injection)
  if (filePath.includes("\n") || filePath.includes("\r")) {
    return { valid: false, error: "Multiline path rejected", normalized: null };
  }

  // Normalize backslashes to forward slashes (Windows compatibility)
  let normalized = filePath.replace(/\\/g, "/");

  // Security: Block absolute paths
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
  const fullPath = path.resolve(projectDir, filePath);

  // Verify file exists
  if (!fs.existsSync(fullPath)) {
    return { contained: false, error: "File does not exist", realPath: null };
  }

  // Resolve symlinks (wrap in try/catch for filesystem errors)
  let realPath = "";
  let realProject = "";
  try {
    realPath = fs.realpathSync(fullPath);
    realProject = fs.realpathSync(projectDir);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { contained: false, error: `Filesystem error: ${errMsg}`, realPath: null };
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
