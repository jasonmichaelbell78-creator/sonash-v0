/* eslint-disable */
/**
 * Shared JSON state persistence utilities for hooks.
 * Extracted from post-read-handler.js, pre-compaction-save.js
 *
 * Features:
 *   - Atomic write with tmp+backup strategy
 *   - Symlink guard integration (optional, used when available)
 *   - Cross-drive fallback (Windows)
 */
const fs = require("node:fs");
const path = require("node:path");

let isSafeToWrite;
try {
  ({ isSafeToWrite } = require("./symlink-guard"));
} catch {
  // Fallback: allow all writes if symlink guard not available
  isSafeToWrite = () => true;
}

/**
 * Load and parse a JSON file. Returns null on any error.
 * @param {string} filePath
 * @returns {any|null}
 */
function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

/** Remove file silently (best-effort). */
function silentRm(p) {
  try {
    fs.rmSync(p, { force: true });
  } catch {
    /* ignore */
  }
}

/** Atomic backup-swap: move existing dest to .bak, rename tmp to dest. */
function backupSwap(filePath, tmpPath, bakPath) {
  silentRm(bakPath);
  try {
    if (fs.existsSync(filePath)) fs.renameSync(filePath, bakPath);
  } catch {
    silentRm(filePath);
  }
  fs.renameSync(tmpPath, filePath);
  silentRm(bakPath);
}

/**
 * Save data as JSON with atomic write (tmp+backup strategy).
 * @param {string} filePath
 * @param {any} data
 * @returns {boolean} true on success
 */
function saveJson(filePath, data) {
  const tmpPath = `${filePath}.tmp`;
  const bakPath = `${filePath}.bak`;
  try {
    if (!isSafeToWrite(filePath) || !isSafeToWrite(tmpPath) || !isSafeToWrite(bakPath))
      return false;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
    backupSwap(filePath, tmpPath, bakPath);
    return true;
  } catch {
    // Rollback: restore backup if dest was moved but tmp rename failed
    try {
      if (fs.existsSync(bakPath) && !fs.existsSync(filePath)) {
        fs.renameSync(bakPath, filePath);
      }
    } catch {
      /* ignore */
    }
    // Fallback: direct write if rename fails (Windows cross-drive)
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      silentRm(tmpPath);
      silentRm(bakPath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = { loadJson, saveJson };
