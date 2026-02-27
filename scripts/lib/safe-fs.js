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
 * - Advisory file locking for concurrent-write coordination
 * - Central MASTER_DEBT writer (dual-write to MASTER + deduped)
 *
 * Created: Session #192 (ESLint + Pattern Compliance Fix Plan)
 * Updated: Deep Plan — Automation & File Overwrite Fixes (Findings 2, 6, 7, 10)
 */

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

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
  // No-op if source and destination are the same (prevents self-deletion)
  if (absSrc === absDest) return;
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

// =========================================================
// Advisory file locking
// =========================================================

const LOCK_STALE_MS = 60_000; // 60s — force-break stale locks (single-user CLI)
const LOCK_SPIN_MS = 100; // polling interval
const LOCK_TIMEOUT_MS = 5_000; // default timeout

// Synchronous sleep using Atomics.wait (avoids busy-spin)
const _sleepBuf = new SharedArrayBuffer(4);
const _sleepArr = new Int32Array(_sleepBuf);
function sleepSync(ms) {
  Atomics.wait(_sleepArr, 0, 0, ms);
}

/**
 * Break a stale lock at `lockPath` after verifying it is not a symlink.
 * Logs a warning if the path is a symlink (skips removal in that case).
 * Swallows removal errors — the outer retry loop handles any resulting EEXIST.
 *
 * @param {string} lockPath - Absolute path to the lock file
 */
function breakStaleLock(lockPath) {
  try {
    if (fs.lstatSync(lockPath).isSymbolicLink()) {
      process.stderr.write(
        `[safe-fs] WARNING: lock path is a symlink, refusing to remove: ${lockPath}\n`
      );
      return;
    }
  } catch {
    // lstat failed (e.g. already gone) — nothing to remove
    return;
  }
  fs.rmSync(lockPath, { force: true });
}

/**
 * Acquire an advisory lock on `filePath`.
 * Creates `${filePath}.lock` containing `{ pid, timestamp, hostname }`.
 * Spins up to `timeoutMs` waiting for an existing lock to clear.
 * Stale locks (> 60s old) are automatically broken.
 *
 * @param {string} filePath - Path to lock (lock file = `${filePath}.lock`)
 * @param {number} [timeoutMs=5000] - Max time to wait for lock
 * @returns {string} Lock file path (for manual release if needed)
 * @throws {Error} If lock cannot be acquired within timeout
 */
function acquireLock(filePath, timeoutMs) {
  const timeout = timeoutMs || LOCK_TIMEOUT_MS;
  const lockPath = `${path.resolve(filePath)}.lock`;
  const lockData = JSON.stringify({
    pid: process.pid,
    timestamp: Date.now(),
    hostname: os.hostname(),
  });

  const deadline = Date.now() + timeout;

  while (true) {
    // Guard: refuse to write if lockPath is already a symlink
    try {
      if (fs.lstatSync(lockPath).isSymbolicLink()) {
        throw new Error(`Refusing to create lock over symlink: ${lockPath}`);
      }
    } catch (statErr) {
      if (statErr.code !== "ENOENT") throw statErr;
      // ENOENT is fine — the lock file does not exist yet
    }

    try {
      // O_EXCL: fail if file already exists (atomic create)
      fs.writeFileSync(lockPath, lockData, { flag: "wx" });
      return lockPath;
    } catch (err) {
      if (err.code !== "EEXIST") throw err;

      // Lock exists — check if stale
      try {
        const existing = JSON.parse(fs.readFileSync(lockPath, "utf8"));
        if (Date.now() - existing.timestamp > LOCK_STALE_MS) {
          // Stale lock — force-break it (symlink-safe)
          breakStaleLock(lockPath);
          continue; // retry immediately
        }
      } catch (readErr) {
        // Can't read/parse lock file — log and attempt removal
        process.stderr.write(
          `[safe-fs] WARNING: unreadable lock file (${readErr.code || readErr.message}), removing: ${lockPath}\n`
        );
        breakStaleLock(lockPath);
        continue;
      }

      if (Date.now() >= deadline) {
        throw new Error(
          `Lock timeout: could not acquire lock on ${path.basename(filePath)} within ${timeout}ms`
        );
      }

      // Sleep without busy-spin
      sleepSync(LOCK_SPIN_MS);
    }
  }
}

/**
 * Release an advisory lock. Only removes if current process owns it.
 *
 * @param {string} filePath - Path whose lock to release
 */
function releaseLock(filePath) {
  const lockPath = `${path.resolve(filePath)}.lock`;
  try {
    const existing = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    if (existing.pid === process.pid) {
      fs.rmSync(lockPath, { force: true });
    }
  } catch (err) {
    // Lock already gone or unreadable — nothing to do
    process.stderr.write(
      `[safe-fs] DEBUG: releaseLock skipped (${err.code || err.message}): ${lockPath}\n`
    );
  }
}

/**
 * Execute `fn` while holding an advisory lock on `filePath`.
 * Automatically releases on success or error (try/finally).
 *
 * @param {string} filePath - Path to lock
 * @param {Function} fn - Function to execute under lock
 * @param {number} [timeoutMs] - Lock acquisition timeout
 * @returns {*} Return value of `fn`
 */
function withLock(filePath, fn, timeoutMs) {
  acquireLock(filePath, timeoutMs);
  try {
    return fn();
  } finally {
    releaseLock(filePath);
  }
}

// =========================================================
// Central MASTER_DEBT writers (Findings 2 + 10)
// =========================================================

// Default paths — derived from this file's location
const DEBT_DIR = path.join(__dirname, "..", "..", "docs", "technical-debt");
const DEFAULT_MASTER_PATH = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const DEFAULT_DEDUPED_PATH = path.join(DEBT_DIR, "raw", "deduped.jsonl");

/**
 * Central MASTER_DEBT full-rewrite writer.
 * Always writes to BOTH MASTER_DEBT.jsonl and deduped.jsonl.
 * Uses file locking to prevent concurrent writes.
 *
 * @param {object[]} items - Full array of debt items
 * @param {object} [options]
 * @param {string} [options.masterPath] - Override MASTER_DEBT.jsonl path
 * @param {string} [options.dedupedPath] - Override deduped.jsonl path
 */
function writeMasterDebtSync(items, options) {
  const masterPath = options?.masterPath || DEFAULT_MASTER_PATH;
  const dedupedPath = options?.dedupedPath || DEFAULT_DEDUPED_PATH;
  const content = items.map((item) => JSON.stringify(item)).join("\n") + "\n";

  withLock(masterPath, () => {
    // Atomic write to MASTER
    const tmpPath = `${masterPath}.tmp.${process.pid}`;
    try {
      safeWriteFileSync(tmpPath, content);
      safeRenameSync(tmpPath, masterPath);
    } catch (err) {
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* cleanup */
      }
      throw err;
    }

    // Sync deduped.jsonl to match (full rewrite)
    const dedupTmp = `${dedupedPath}.tmp.${process.pid}`;
    try {
      safeWriteFileSync(dedupTmp, content);
      safeRenameSync(dedupTmp, dedupedPath);
    } catch (err) {
      try {
        fs.unlinkSync(dedupTmp);
      } catch {
        /* cleanup */
      }
      throw err;
    }
  });
}

/**
 * Append items to MASTER_DEBT.jsonl AND deduped.jsonl atomically.
 * Uses file locking to prevent concurrent writes.
 *
 * @param {object[]} newItems - Items to append
 * @param {object} [options]
 * @param {string} [options.masterPath] - Override MASTER_DEBT.jsonl path
 * @param {string} [options.dedupedPath] - Override deduped.jsonl path
 */
function appendMasterDebtSync(newItems, options) {
  if (!newItems || newItems.length === 0) return;
  const masterPath = options?.masterPath || DEFAULT_MASTER_PATH;
  const dedupedPath = options?.dedupedPath || DEFAULT_DEDUPED_PATH;
  const content = newItems.map((item) => JSON.stringify(item)).join("\n") + "\n";

  withLock(masterPath, () => {
    safeAppendFileSync(masterPath, content);
    safeAppendFileSync(dedupedPath, content);
  });
}

module.exports = {
  isSafeToWrite,
  safeWriteFileSync,
  safeAppendFileSync,
  safeRenameSync,
  safeAtomicWriteSync,
  readUtf8Sync,
  acquireLock,
  releaseLock,
  withLock,
  writeMasterDebtSync,
  appendMasterDebtSync,
};
