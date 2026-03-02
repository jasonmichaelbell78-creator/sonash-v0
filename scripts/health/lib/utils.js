/* eslint-disable no-undef */

/**
 * Shared utilities for health check scripts
 */

"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

/** Max file size for readFileSync+split operations (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Find project root (where package.json is)
 */
function findProjectRoot() {
  let dir = __dirname;
  const fsRoot = path.parse(dir).root;

  while (dir && dir !== fsRoot) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    const next = path.dirname(dir);
    if (next === dir) break;
    dir = next;
  }

  return process.cwd();
}

const ROOT_DIR = findProjectRoot();

/**
 * Run a command safely using execFileSync (no shell injection)
 * @param {string} bin - Executable name or path
 * @param {string[]} args - Array of arguments
 * @param {object} options - Options (timeout, cwd, etc.)
 * @returns {{ success: boolean, output: string, stderr: string, code: number }}
 */
function runCommandSafe(bin, args = [], options = {}) {
  try {
    const safeOptions = {
      encoding: options.encoding || "utf8",
      timeout: options.timeout || 60000,
      maxBuffer: options.maxBuffer || 10 * 1024 * 1024,
      cwd: options.cwd || ROOT_DIR,
      env: options.env,
      stdio: ["pipe", "pipe", "pipe"],
    };
    const isWin = process.platform === "win32";
    const isWinCmd = bin === "npm" || bin === "npx" || bin === "gh";
    const resolvedBin = isWin && isWinCmd ? `${bin}.cmd` : bin;
    let output;
    try {
      output = execFileSync(resolvedBin, args, safeOptions);
    } catch (e) {
      const errCode = e?.code ?? e?.cause?.code;
      if (isWin && isWinCmd && errCode === "ENOENT") {
        output = execFileSync(bin, args, safeOptions);
      } else {
        throw e;
      }
    }
    return { success: true, output: String(output ?? "").trim(), stderr: "", code: 0 };
  } catch (error) {
    const stdoutStr = error?.stdout == null ? "" : String(error.stdout);
    const stderrStr = error?.stderr == null ? "" : String(error.stderr);
    return {
      success: false,
      output: stdoutStr.trim(),
      stderr: stderrStr.trim(),
      code: typeof error?.status === "number" ? error.status : 1,
    };
  }
}

/**
 * Safe JSON.parse wrapper
 */
function safeParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Safely read a file and split into lines with size guard.
 */
function safeReadLines(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) return [];
  } catch {
    return [];
  }
  try {
    return fs.readFileSync(filePath, "utf8").trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

module.exports = { ROOT_DIR, runCommandSafe, safeParse, safeReadLines, findProjectRoot };
