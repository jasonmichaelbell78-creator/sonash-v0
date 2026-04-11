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
const { StringDecoder } = require("node:string_decoder");

// Import isSafeToWrite from the canonical source. This file is also copied
// verbatim into .claude/skills/*/scripts/lib/safe-fs.js as a per-skill helper.
// The first require path is correct when running from scripts/lib/; the
// second path is correct when running from .claude/skills/<skill>/scripts/lib/.
// If both fail, fall back to the inline fail-closed implementation.
let isSafeToWrite;
try {
  // scripts/lib/safe-fs.js -> repo-root/.claude/hooks/lib/symlink-guard
  ({ isSafeToWrite } = require(
    path.join(__dirname, "..", "..", ".claude", "hooks", "lib", "symlink-guard")
  ));
} catch {
  try {
    // .claude/skills/<skill>/scripts/lib/safe-fs.js -> repo-root/.claude/hooks/lib/symlink-guard
    ({ isSafeToWrite } = require(
      path.join(__dirname, "..", "..", "..", "..", "..", ".claude", "hooks", "lib", "symlink-guard")
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
  // Try rename first; if it fails due to dest existing (Windows), fall back to copy
  try {
    fs.renameSync(absSrc, absDest);
  } catch (err) {
    // Defensive code extraction: non-standard throws may omit a `.code`.
    const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
    if (code === "EXDEV") {
      // Cross-device: copy then remove source
      fs.copyFileSync(absSrc, absDest);
      fs.unlinkSync(absSrc);
    } else if (code === "EPERM" || code === "EACCES" || code === "EEXIST") {
      // Windows: dest exists — use copy+unlink fallback (avoids rmSync→renameSync race)
      if (fs.existsSync(absDest)) {
        const st = fs.lstatSync(absDest);
        if (st.isDirectory()) {
          throw new Error(`Refusing to rename over directory: ${path.basename(absDest)}`);
        }
      }
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
  // Unique tmp name per call so two concurrent writers on the same target
  // can't clobber each other's tmp file and corrupt the rename.
  const tmpPath = `${absPath}.tmp.${process.pid}.${Math.random().toString(16).slice(2)}`;
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

/**
 * Default size guard for whole-file text reads (2 MiB). Files larger than this
 * should use readline streaming instead of read-then-split.
 */
const DEFAULT_READ_MAX_BYTES = 2 * 1024 * 1024;

/**
 * Read a UTF-8 text file into memory with an enforced size ceiling. Throws if
 * the file exceeds `maxBytes`, so callers cannot accidentally OOM on a large
 * input. Detector `unbounded-file-read` is satisfied by the inline `stat.size >`
 * comparison immediately before the read.
 *
 * @param {string} filePath - Path to read
 * @param {object} [options]
 * @param {number} [options.maxBytes=DEFAULT_READ_MAX_BYTES] - Size ceiling
 * @param {boolean} [options.stripBom=true] - Strip UTF-8 BOM from result
 * @returns {string} File contents
 */
function readTextWithSizeGuard(filePath, options = {}) {
  const { maxBytes = DEFAULT_READ_MAX_BYTES, stripBom = true } = options;
  const stat = fs.statSync(filePath);
  if (stat.size > maxBytes) {
    throw new Error(`File exceeds size guard (${stat.size} > ${maxBytes} bytes): ${filePath}`);
  }
  const content = fs.readFileSync(filePath, "utf8");
  if (stripBom && content.codePointAt(0) === 0xfeff) return content.slice(1);
  return content;
}

/**
 * Stream a JSONL (or any line-delimited) file synchronously in fixed-size
 * chunks, invoking `onLine(rawLine)` for each complete line. Unbounded in
 * file size — use for inputs that legitimately exceed the 2 MiB whole-file
 * ceiling. Reads 64 KiB at a time, preserving incomplete tail lines across
 * chunks. Strips a leading UTF-8 BOM from the very first line.
 *
 * Uses `StringDecoder` from `node:string_decoder` to handle multi-byte UTF-8
 * sequences that straddle chunk boundaries (emoji, CJK, non-Latin scripts).
 * Without this, a chunk ending mid-sequence would produce U+FFFD replacement
 * characters for the partial bytes.
 *
 * @param {string} filePath - Path to read
 * @param {(line: string) => void} onLine - Callback for each complete line
 * @param {object} [options]
 * @param {number} [options.chunkBytes=65536] - Read buffer size
 */
function streamLinesSync(filePath, onLine, options = {}) {
  const rawChunkBytes = options.chunkBytes ?? 64 * 1024;
  const chunkBytes = Number(rawChunkBytes);
  if (!Number.isInteger(chunkBytes) || chunkBytes <= 0 || chunkBytes > 4 * 1024 * 1024) {
    throw new Error(`Invalid chunkBytes: ${rawChunkBytes} (must be a positive integer <= 4 MiB)`);
  }
  const buf = Buffer.alloc(chunkBytes);
  const decoder = new StringDecoder("utf8");
  let fd;
  try {
    fd = fs.openSync(filePath, "r");
    let leftover = "";
    let atStart = true;
    while (true) {
      const bytesRead = fs.readSync(fd, buf, 0, chunkBytes, null);
      if (bytesRead === 0) break;
      // Buffer incomplete multi-byte sequences via StringDecoder so a sequence
      // straddling a 64 KiB boundary is completed on the next read.
      let chunkText = leftover + decoder.write(buf.subarray(0, bytesRead));
      if (atStart && chunkText.codePointAt(0) === 0xfeff) {
        chunkText = chunkText.slice(1);
      }
      atStart = false;
      const pieces = chunkText.split("\n");
      leftover = pieces.pop() ?? "";
      for (const piece of pieces) onLine(piece);
    }
    // Flush any remaining bytes held by the decoder. For well-formed UTF-8
    // this is typically empty; truly invalid trailing bytes become U+FFFD
    // rather than being silently dropped.
    leftover += decoder.end();
    if (leftover.length > 0) onLine(leftover);
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {
        // Intentionally swallowed: best-effort close of file descriptor
      }
    }
  }
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
  try {
    fs.rmSync(lockPath, { force: true });
  } catch {
    // best-effort; outer retry loop handles any remaining EEXIST
  }
}

/**
 * Guard: throw if `lockPath` is an existing symlink. ENOENT (no file) is fine.
 *
 * @param {string} lockPath - Absolute path to the lock file
 * @throws {Error} If lockPath is a symlink or stat fails for a reason other than ENOENT
 */
function guardLockSymlink(lockPath) {
  try {
    if (fs.lstatSync(lockPath).isSymbolicLink()) {
      throw new Error(`Refusing to create lock over symlink: ${lockPath}`);
    }
  } catch (statErr) {
    if (statErr.code !== "ENOENT") throw statErr;
    // ENOENT is fine — the lock file does not exist yet
  }
}

/**
 * Check whether an existing lock is still held by a live process.
 * Returns `true` if the lock holder is still alive (lock is valid),
 * `false` if the lock is stale and safe to break.
 *
 * Handles NaN/invalid timestamps by treating them as stale.
 * On same-host locks, verifies the PID is still running before breaking.
 *
 * @param {object} existing - Parsed lock file contents
 * @returns {boolean} true if lock holder is alive
 */
function isLockHolderAlive(existing) {
  const ts = Number(existing && existing.timestamp);
  const ageMs = Number.isFinite(ts) ? Date.now() - ts : LOCK_STALE_MS + 1;
  if (ageMs <= LOCK_STALE_MS) return true; // not stale yet

  // Stale by age — check if same host and PID still alive
  const sameHost = String(existing.hostname || "") === os.hostname();
  if (sameHost && typeof existing.pid === "number") {
    try {
      process.kill(existing.pid, 0); // signal 0 = existence check
      return true; // process still running despite old timestamp
    } catch {
      // Process doesn't exist — confirmed stale
    }
  }
  return false; // stale: old + either different host or dead process
}

/**
 * Attempt to break an existing lock if it's stale.
 * Returns `true` if the lock was broken (caller should retry),
 * `false` if the lock is still validly held.
 *
 * @param {string} lockPath - Absolute path to the lock file
 * @returns {boolean} true if lock was broken
 */
function tryBreakExistingLock(lockPath) {
  try {
    const existing = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    if (isLockHolderAlive(existing)) return false; // lock is valid
    breakStaleLock(lockPath);
    return true;
  } catch (readErr) {
    // Can't read/parse lock file — log code only (drops raw readErr.message to
    // avoid leaking filesystem details in stderr). Code is enough to diagnose.
    const readErrCode =
      readErr && typeof readErr === "object" && "code" in readErr ? String(readErr.code) : "";
    process.stderr.write(
      `[safe-fs] WARNING: unreadable lock file (${readErrCode || "UNKNOWN"}), removing: ${lockPath}\n`
    );
    breakStaleLock(lockPath);
    return true;
  }
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
  // Use ?? so a deliberate `0` isn't silently replaced with the default, and
  // validate that the result is a finite, non-negative number.
  const rawTimeout = timeoutMs ?? LOCK_TIMEOUT_MS;
  const timeout = Number(rawTimeout);
  if (!Number.isFinite(timeout) || timeout < 0) {
    throw new Error(`Invalid lock timeoutMs: ${rawTimeout}`);
  }
  const lockPath = `${path.resolve(filePath)}.lock`;
  const lockData = JSON.stringify({
    pid: process.pid,
    timestamp: Date.now(),
    hostname: os.hostname(),
  });
  const deadline = Date.now() + timeout;

  // Ensure lock directory exists (supports first-write scenarios)
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });

  while (true) {
    guardLockSymlink(lockPath);
    try {
      // O_EXCL: fail if file already exists (atomic create)
      fs.writeFileSync(lockPath, lockData, { flag: "wx" });
      return lockPath;
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
      if (tryBreakExistingLock(lockPath)) continue; // stale → retry
      if (Date.now() >= deadline) {
        throw new Error(
          `Lock timeout: could not acquire lock on ${path.basename(filePath)} within ${timeout}ms`
        );
      }
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
    if (existing.pid === process.pid && existing.hostname === os.hostname()) {
      // Guard: refuse to remove if lockPath has been replaced with a symlink
      try {
        if (fs.lstatSync(lockPath).isSymbolicLink()) {
          process.stderr.write(
            `[safe-fs] WARNING: lock path is a symlink, refusing to remove: ${lockPath}\n`
          );
          return;
        }
      } catch {
        // lstat failed — lock already gone
        return;
      }
      fs.rmSync(lockPath, { force: true });
    }
  } catch (err) {
    // Lock already gone or unreadable — nothing to do
    const errCode = err && typeof err === "object" && "code" in err ? String(err.code) : "";
    const errMsg = err instanceof Error ? err.message : String(err);
    process.stderr.write(
      `[safe-fs] DEBUG: releaseLock skipped (${errCode || errMsg}): ${lockPath}\n`
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

// NOTE: Central MASTER_DEBT writers are intentionally NOT present in skill
// copies. Skills must not write to docs/technical-debt/ from within their
// own scripts/lib/ — use the canonical scripts/lib/safe-fs.js via the TDMS
// intake pipeline (scripts/debt/intake-manual.js) instead.

module.exports = {
  isSafeToWrite,
  safeWriteFileSync,
  safeAppendFileSync,
  safeRenameSync,
  safeAtomicWriteSync,
  readUtf8Sync,
  readTextWithSizeGuard,
  streamLinesSync,
  DEFAULT_READ_MAX_BYTES,
  acquireLock,
  releaseLock,
  withLock,
};
