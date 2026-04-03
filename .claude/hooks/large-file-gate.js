#!/usr/bin/env node
/* global require, process, console, __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * large-file-gate.js - PreToolUse gate (Read)
 *
 * Checks file size before Read operations on common large file types
 * (.jsonl, .log, .csv, .ndjson). Blocks reads of files >5MB and warns
 * on files >500KB to reduce context waste.
 *
 * Exit 0 = allow (optionally with stderr warning)
 * Exit 2 = block with message
 *
 * Per D20: SKIP_GATES=1 bypasses all checks.
 * Per D13: Appends to hook-warnings-log.jsonl on block.
 *
 * Hook if-implementation Plan, Step 15.
 */

const path = require("node:path");
const fs = require("node:fs");
const { sanitizeError } = require(
  path.join(__dirname, "..", "..", "scripts", "lib", "sanitize-error.cjs")
);

// Safe-fs wrappers (symlink guard + EXDEV fallback)
let safeAppendFileSync, isSafeToWrite;
try {
  ({ safeAppendFileSync, isSafeToWrite } = require(
    path.join(__dirname, "..", "..", "scripts", "lib", "safe-fs")
  ));
} catch {
  // Fallback: fail-open on missing safe-fs (don't block work)
  safeAppendFileSync = (fp, data) => fs.appendFileSync(fp, data);
  isSafeToWrite = () => true;
}

// --- Constants ---

const BLOCK_THRESHOLD = 5 * 1024 * 1024; // 5MB
const WARN_THRESHOLD = 500 * 1024; // 500KB (~512000 bytes)

// --- Kill Switch (D20) ---

if (process.env.SKIP_GATES === "1") {
  process.exit(0);
}

// --- Helpers ---

/**
 * Append a warning entry to hook-warnings-log.jsonl (per D13).
 * Best-effort -- never block the gate on warning write failure.
 *
 * @param {string} message - Warning message
 * @param {string} severity - "error" for blocks, "warning" for warnings
 * @param {string} filePath - The file path being read
 * @param {number} sizeBytes - File size in bytes
 */
function appendWarningJsonl(message, severity, filePath, sizeBytes) {
  try {
    const stateDir = path.join(__dirname, "..", "state");
    const logPath = path.join(stateDir, "hook-warnings-log.jsonl");

    try {
      fs.mkdirSync(stateDir, { recursive: true });
    } catch {
      /* best-effort */
    }
    if (!isSafeToWrite(logPath)) return;

    const entry = {
      timestamp: new Date().toISOString(),
      hook: "pre-tool",
      type: "large-file-gate",
      severity,
      message,
      filePath: path.basename(filePath),
      sizeBytes,
      actor: "hook-system",
      outcome: severity === "error" ? "blocked" : "warned",
    };
    safeAppendFileSync(logPath, JSON.stringify(entry) + "\n");
  } catch {
    // Best-effort -- never block hooks on log failure
  }
}

/**
 * Format bytes into a human-readable size string.
 *
 * @param {number} bytes - Size in bytes
 * @returns {string} e.g. "2.4MB" or "650KB"
 */
function formatSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + "MB";
  }
  return (bytes / 1024).toFixed(0) + "KB";
}

// --- Main: stdin reader ---

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("error", () => {
  // Transport errors should not block work -- allow through
  process.exit(0);
});
process.stdin.on("data", (chunk) => {
  input += chunk;
  // Fail-open on unexpectedly large payloads
  if (input.length > 1024 * 1024) {
    process.exit(0);
  }
});
process.stdin.on("end", () => {
  if (!input.trim()) {
    console.log("ok");
    process.exit(0);
  }
  try {
    const data = JSON.parse(input);
    const toolInput = data.tool_input || {};
    const filePath = toolInput.file_path || "";

    if (!filePath) {
      // No file path -- allow through
      process.exit(0);
    }

    // Resolve to absolute path
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(projectDir, filePath);

    // Resolve symlinks before traversal check
    let realPath = absPath;
    try {
      realPath = fs.realpathSync(absPath);
    } catch {
      /* fail-open */
    }

    // Security: path traversal guard
    const rel = path.relative(projectDir, realPath);
    if (/^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
      process.exit(0);
    }

    // Check file existence -- if missing, let Read tool handle the error
    let stat;
    try {
      // TOCTOU note: symlinks are resolved via realPath above; size-check the target
      const statTarget = fs.lstatSync(absPath).isSymbolicLink() ? realPath : absPath;
      stat = fs.statSync(statTarget);
    } catch {
      // File doesn't exist or can't be accessed -- allow through
      process.exit(0);
    }

    const sizeBytes = stat.size;

    if (sizeBytes > BLOCK_THRESHOLD) {
      // >5MB: BLOCK
      const sizeStr = formatSize(sizeBytes);
      const msg = `File is ${sizeStr}. Use limit/offset parameters to read specific sections instead of the full file.`;
      process.stderr.write(`[large-file-gate] BLOCKED: ${msg}\n`);
      appendWarningJsonl(msg, "error", absPath, sizeBytes);
      process.exit(2);
    }

    if (sizeBytes > WARN_THRESHOLD) {
      // >500KB: WARN (stderr only, exit 0)
      const sizeStr = formatSize(sizeBytes);
      const msg = `Large file (${sizeStr}). Consider using limit/offset to reduce context usage.`;
      process.stderr.write(`[large-file-gate] WARNING: ${msg}\n`);
      appendWarningJsonl(msg, "warning", absPath, sizeBytes);
      process.exit(0);
    }

    // <500KB: pass silently
    process.exit(0);
  } catch (err) {
    // Parse/logic errors should not block work -- allow through
    const safeErr = String(sanitizeError(err))
      .replaceAll(/\p{C}+/gu, " ")
      .slice(0, 500);
    process.stderr.write(`[large-file-gate] Internal error (allowing through): ${safeErr}\n`);
    process.exit(0);
  }
});
