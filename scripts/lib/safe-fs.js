#!/usr/bin/env node
/* global __dirname */
/**
 * safe-fs.js - Safe filesystem operation wrappers
 *
 * Consolidates security patterns for file writes:
 * - Symlink guards (isSafeToWrite) before all write operations
 * - EXDEV fallback for renameSync (cross-drive moves)
 * - Pre-rename rmSync (Windows destination-exists failure)
 * - BOM stripping for UTF-8 reads
 *
 * Created: Session #192 (ESLint + Pattern Compliance Fix Plan)
 */

const fs = require("node:fs");
const path = require("node:path");

// Import isSafeToWrite from the canonical source
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require(
    path.join(__dirname, "..", "..", ".claude", "hooks", "lib", "symlink-guard")
  ));
} catch {
  // Fallback: inline implementation (fail-closed)
  isSafeToWrite = (filePath) => {
    try {
      if (!path.isAbsolute(filePath)) return false;
      if (fs.existsSync(filePath) && fs.lstatSync(filePath).isSymbolicLink()) {
        return false;
      }
      let dirPath = path.dirname(filePath);
      while (true) {
        if (fs.existsSync(dirPath) && fs.lstatSync(dirPath).isSymbolicLink()) {
          return false;
        }
        const parent = path.dirname(dirPath);
        if (parent === dirPath) break;
        dirPath = parent;
      }
      return true;
    } catch {
      return false; // fail-closed
    }
  };
}

/**
 * Safe writeFileSync with symlink guard.
 * Rejects writes to symlinked paths or paths with symlinked ancestors.
 *
 * @param {string} filePath - Absolute path to write to
 * @param {string|Buffer} data - Data to write
 * @param {import('fs').WriteFileOptions} [options] - writeFileSync options
 * @throws {Error} If path is a symlink or write fails
 */
function safeWriteFileSync(filePath, data, options) {
  const absPath = path.resolve(filePath);
  if (!isSafeToWrite(absPath)) {
    throw new Error(`Refusing to write to symlinked path: ${path.basename(absPath)}`);
  }
  fs.writeFileSync(absPath, data, options);
}

/**
 * Safe appendFileSync with symlink guard.
 *
 * @param {string} filePath - Absolute path to append to
 * @param {string|Buffer} data - Data to append
 * @param {import('fs').WriteFileOptions} [options] - appendFileSync options
 * @throws {Error} If path is a symlink or append fails
 */
function safeAppendFileSync(filePath, data, options) {
  const absPath = path.resolve(filePath);
  if (!isSafeToWrite(absPath)) {
    throw new Error(`Refusing to append to symlinked path: ${path.basename(absPath)}`);
  }
  fs.appendFileSync(absPath, data, options);
}

/**
 * Safe renameSync with:
 * - Symlink guard on destination
 * - Pre-rename rmSync (Windows compat)
 * - EXDEV fallback (cross-drive copy+unlink)
 *
 * @param {string} src - Source path
 * @param {string} dest - Destination path
 */
function safeRenameSync(src, dest) {
  const absSrc = path.resolve(src);
  const absDest = path.resolve(dest);
  if (!isSafeToWrite(absSrc)) {
    throw new Error(`Refusing to rename from symlinked source: ${path.basename(absSrc)}`);
  }
  if (!isSafeToWrite(absDest)) {
    throw new Error(`Refusing to rename to symlinked path: ${path.basename(absDest)}`);
  }
  // Remove destination first (Windows fails if dest exists), but never clobber directories
  if (fs.existsSync(absDest)) {
    const st = fs.lstatSync(absDest);
    if (st.isDirectory()) {
      throw new Error(`Refusing to rename over directory: ${path.basename(absDest)}`);
    }
    fs.rmSync(absDest, { force: true });
  }
  try {
    fs.renameSync(absSrc, absDest);
  } catch (err) {
    if (err.code === "EXDEV") {
      // Cross-device: copy then remove source
      fs.copyFileSync(absSrc, absDest);
      fs.unlinkSync(absSrc);
    } else {
      throw err;
    }
  }
}

/**
 * Safe atomic write: write to tmp, then rename to final.
 * Guards both tmp and final paths against symlinks.
 *
 * @param {string} filePath - Final destination path
 * @param {string|Buffer} data - Data to write
 * @param {import('fs').WriteFileOptions} [options] - writeFileSync options
 */
function safeAtomicWriteSync(filePath, data, options) {
  const absPath = path.resolve(filePath);
  const tmpPath = `${absPath}.tmp`;
  if (!isSafeToWrite(absPath)) {
    throw new Error(`Refusing atomic write to symlinked path: ${path.basename(absPath)}`);
  }
  if (!isSafeToWrite(tmpPath)) {
    throw new Error(`Refusing atomic write via symlinked tmp path: ${path.basename(tmpPath)}`);
  }
  try {
    fs.writeFileSync(tmpPath, data, options);
    safeRenameSync(tmpPath, absPath);
  } catch (err) {
    if (fs.existsSync(tmpPath)) fs.rmSync(tmpPath, { force: true });
    throw err;
  }
}

/**
 * Read a UTF-8 file with BOM stripping.
 *
 * @param {string} filePath - Path to read
 * @returns {string} File contents with BOM stripped
 */
function readUtf8Sync(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  // Strip UTF-8 BOM if present
  return content.codePointAt(0) === 0xfeff ? content.slice(1) : content;
}

module.exports = {
  isSafeToWrite,
  safeWriteFileSync,
  safeAppendFileSync,
  safeRenameSync,
  safeAtomicWriteSync,
  readUtf8Sync,
};
