/* eslint-disable @typescript-eslint/no-require-imports, no-undef, security/detect-non-literal-fs-filename */

/**
 * Shared symlink guard for hook state file writes.
 *
 * Checks whether a file path or any ancestor directory is a symlink.
 * Use before every atomic write to prevent symlink-based file clobbering.
 */

const fs = require("node:fs");
const path = require("node:path");

/**
 * Returns true if it is safe to write to the given file path.
 * Returns false if the file or any ancestor directory is a symlink,
 * or if the check itself fails (fail-closed).
 *
 * @param {string} filePath - Absolute path to check
 * @returns {boolean}
 */
function isSafeToWrite(filePath) {
  try {
    // Check the file itself
    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isSymbolicLink()) {
      return false;
    }
    // Walk ancestor directories up to the root
    let dirPath = path.dirname(filePath);
    while (true) {
      if (fs.existsSync(dirPath) && fs.lstatSync(dirPath).isSymbolicLink()) {
        return false;
      }
      const parent = path.dirname(dirPath);
      if (parent === dirPath) break;
      dirPath = parent;
    }
  } catch {
    return false; // Fail closed
  }
  return true;
}

module.exports = { isSafeToWrite };
