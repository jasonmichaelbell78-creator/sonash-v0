#!/usr/bin/env node
/* global __dirname */
"use strict";

/**
 * safe-cas-io.js — shared secure I/O helpers for Content Analysis System
 * scripts (and any other script that reads/writes canonical research artifacts
 * under .research/ or .claude/state/).
 *
 * Consolidates parent-chain symlink protection, TOCTOU-tight stat-to-read
 * ordering (fd pinning), artifact file validation, and candidate-field
 * validation that was previously duplicated (or missing) across the CAS
 * script family (self-audit, migrate-v3, migrate-schemas, backfill-candidates,
 * fix-depth-mislabel, promote-firecrawl-to-journal, recall).
 *
 * READ helpers (safeReadText, safeReadJson) use three layered guards:
 *   1. refuseSymlinkWithParents() — rejects the path if any parent directory
 *      is a symlink (closes the parent-chain redirection attack).
 *   2. openSync() with O_NOFOLLOW — rejects the final path if it is a symlink
 *      at open time (closes the race between the parent-chain check and open
 *      on Unix). On Windows, where O_NOFOLLOW is not supported natively, this
 *      degrades to parent-chain + fstat checks only — still better than no
 *      guard at all.
 *   3. fstatSync() + isFile() on the pinned fd — rejects non-files and closes
 *      the TOCTOU window between stat and read, because the fd pins the inode
 *      across both operations. readFileSync(fd) reads through the same fd.
 *
 * WRITE helpers (safeWriteJson) delegate to safeWriteFileSync in safe-fs.js,
 * which refuses symlinked paths via isSafeToWrite().
 *
 * Created: PR #505 R1 review — Qodo flagged parent-chain symlink gaps in the
 * CAS script family. Security-auditor follow-up surfaced a TOCTOU race in the
 * initial mitigation and recommended fd-pinning + relocation from scripts/cas/
 * to scripts/lib/ so non-CAS scripts (migrate-schemas, recall, etc.) can
 * import the same hardened primitives.
 *
 * @see scripts/lib/security-helpers.js (refuseSymlinkWithParents)
 * @see scripts/lib/safe-fs.js (safeWriteFileSync, isSafeToWrite)
 * @see scripts/lib/analysis-schema.js (candidateSchema)
 */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { refuseSymlinkWithParents, validatePathInDir } = require("./security-helpers.js");
const { safeWriteFileSync } = require("./safe-fs.js");
const { candidateSchema } = require("./analysis-schema.js");

// Project root — derived from this file's location (scripts/lib/safe-cas-io.js).
// Used only as the containment root for validatePathInDir() so read/write
// helpers cannot be pointed at files outside trusted roots via relative
// traversal.
const PROJECT_ROOT = path.resolve(__dirname, "..", ".."); // validatePathInDir: constant-path (no user input)
// os.tmpdir() is a trusted secondary root: anything with write access to it
// already has local access exceeding this helper's threat model. Allowing it
// keeps test fixtures (which use mkdtempSync under os.tmpdir()) working
// without loosening the containment check for production code paths, which
// always target files under PROJECT_ROOT.
const TMP_ROOT = path.resolve(os.tmpdir()); // validatePathInDir: constant-path (no user input)

// O_NOFOLLOW is a POSIX flag that causes openSync to fail with ELOOP when the
// final path component is a symlink. It is available on Linux and macOS via
// fs.constants.O_NOFOLLOW. On Windows, Node defines it as 0 (no-op), so the
// open will succeed even if the final path is a symlink; in that case we
// rely on the parent-chain guard + fstat/isFile check for defense in depth.
// Detect support at module load time.
const O_NOFOLLOW = typeof fs.constants.O_NOFOLLOW === "number" ? fs.constants.O_NOFOLLOW : 0;

/**
 * Resolve a path and enforce containment within a trusted root
 * (PROJECT_ROOT for normal use, TMP_ROOT as a fallback for test fixtures).
 * Every read/write helper below routes through this so the propagation
 * checker's path-containment pattern is satisfied adjacent to every
 * path-resolution call.
 *
 * @param {string} filePath - Input path (absolute or relative)
 * @returns {string} Absolute path confirmed to live under a trusted root
 * @throws {Error} If the resolved path escapes both PROJECT_ROOT and TMP_ROOT
 */
function resolveWithinProject(filePath) {
  const absPath = path.resolve(filePath); // validatePathInDir: containment enforced below
  // Try PROJECT_ROOT first — the canonical case for production code paths.
  const relToProject = path.relative(PROJECT_ROOT, absPath);
  try {
    // validatePathInDir throws on "", on absolute paths, and on anything
    // beginning with ".." — exactly the escape cases we need to refuse.
    validatePathInDir(PROJECT_ROOT, relToProject);
    return absPath;
  } catch {
    // Fall through to the TMP_ROOT check. If both fail, the final
    // validatePathInDir call below will throw and escape to the caller.
  }
  const relToTmp = path.relative(TMP_ROOT, absPath);
  validatePathInDir(TMP_ROOT, relToTmp);
  return absPath;
}

/**
 * Read a file as UTF-8 text with parent-chain symlink protection and
 * TOCTOU-tight stat-to-read ordering via file-descriptor pinning.
 *
 * @param {string} filePath - Absolute or relative path to read
 * @returns {string} File contents as UTF-8 string
 * @throws {Error} If the path or any ancestor is a symlink, the target is
 *                 not a regular file, or the read fails.
 */
function safeReadText(filePath) {
  // Containment: resolve and enforce PROJECT_ROOT boundary before any I/O.
  const absPath = resolveWithinProject(filePath);
  // 1. Parent-chain guard — throws if any ancestor is a symlink.
  refuseSymlinkWithParents(absPath);

  // 2. Open the final path. With O_NOFOLLOW (Unix), this throws ELOOP if the
  //    final path is a symlink at open time, closing the race between the
  //    parent-chain check above and the open. On Windows (O_NOFOLLOW === 0),
  //    the open follows links; the fstat + isFile check below catches obvious
  //    non-file targets and the parent-chain guard still rejects the most
  //    realistic attack vector (planting a symlink in a parent directory).
  let fd;
  try {
    fd = fs.openSync(absPath, fs.constants.O_RDONLY | O_NOFOLLOW);
  } catch (err) {
    // ELOOP means O_NOFOLLOW detected a symlink at the final path. Surface
    // a clear error rather than leaking the raw ELOOP code to callers.
    if (err && /** @type {NodeJS.ErrnoException} */ (err).code === "ELOOP") {
      throw new Error("Refusing to read symlinked path: " + path.basename(absPath));
    }
    throw err;
  }

  try {
    // 3. Stat through the pinned fd — the inode is held by the fd, so this
    //    and the subsequent readFileSync(fd) see the same file.
    const st = fs.fstatSync(fd);
    if (!st.isFile()) {
      throw new Error("Not a regular file: " + path.basename(absPath));
    }
    return fs.readFileSync(fd, "utf8");
  } finally {
    try {
      fs.closeSync(fd);
    } catch {
      // Best-effort close — the read already completed or failed and we
      // do not want to mask the original error.
    }
  }
}

/**
 * Read and JSON-parse a file with the same guarantees as safeReadText.
 *
 * @param {string} filePath - Path to JSON file
 * @returns {unknown} Parsed JSON value
 * @throws {Error} Same as safeReadText, plus SyntaxError on parse failure
 */
function safeReadJson(filePath) {
  const text = safeReadText(filePath);
  try {
    return JSON.parse(text);
  } catch (err) {
    // Preserve SyntaxError type so callers can `instanceof SyntaxError` —
    // JSON.parse always throws SyntaxError, so reconstructing it here keeps
    // type-based error handling working while still adding file context.
    const detail = err instanceof Error ? err.message : String(err);
    throw new SyntaxError(`Failed to parse JSON in ${path.basename(filePath)}: ${detail}`);
  }
}

/**
 * Pretty-print a value as JSON and write it through safeWriteFileSync
 * (which itself refuses symlinked paths via isSafeToWrite).
 *
 * @param {string} filePath - Path to write
 * @param {unknown} data - JSON-serializable value
 */
function safeWriteJson(filePath, data) {
  safeWriteFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/**
 * Returns true iff filePath is a valid Standard-artifact file:
 *   - no parent-chain symlinks,
 *   - the final path exists,
 *   - the final path is a regular file (not a directory, socket, symlink),
 *   - size > 0 (rejects empty placeholders).
 *
 * Never throws — returns false on any exception. Intended for counting loops
 * where directories and empty placeholders must NOT be counted as valid
 * artifacts (see PR #505 Qodo "weak Standard artifact detection" finding).
 *
 * @param {string} filePath - Candidate artifact path
 * @returns {boolean}
 */
function isValidArtifactFile(filePath) {
  let fd;
  try {
    // Containment: resolve and enforce PROJECT_ROOT boundary first.
    const absPath = resolveWithinProject(filePath);
    refuseSymlinkWithParents(absPath);
    fd = fs.openSync(absPath, fs.constants.O_RDONLY | O_NOFOLLOW);
    const st = fs.fstatSync(fd);
    if (!st.isFile()) return false;
    if (st.size === 0) return false;
    return true;
  } catch {
    return false;
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {
        // best-effort close
      }
    }
  }
}

/**
 * Validate a candidate record against the canonical Zod candidateSchema.
 * Returns a list of human-readable problem descriptions (empty = valid).
 *
 * Used by backfill-candidates.js (journal → analysis.candidates) and by
 * promote-firecrawl-to-journal.js (value-map → journal) before writing to
 * canonical files.
 *
 * NOTE: empty-string `description` is VALID per the schema (z.string() allows
 * ""). The prior manual check in backfill-candidates.js incorrectly rejected
 * it. See PR #505 Qodo suggestion "Avoid false validation failures".
 *
 * @param {unknown} candidate - Record to validate
 * @returns {string[]} Array of problem messages (empty array = valid)
 */
function validateCandidate(candidate) {
  const result = candidateSchema.safeParse(candidate);
  if (result.success) return [];
  return result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
}

module.exports = {
  safeReadText,
  safeReadJson,
  safeWriteJson,
  isValidArtifactFile,
  validateCandidate,
};
