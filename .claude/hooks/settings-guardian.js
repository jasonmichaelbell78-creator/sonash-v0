#!/usr/bin/env node
/* global require, process, console, __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * settings-guardian.js - PreToolUse hook (Write/Edit)
 *
 * Blocks Write/Edit to .claude/settings.json if the proposed content
 * would corrupt the hook infrastructure. For Write operations, validates
 * full JSON structure and checks for critical hooks. For Edit operations,
 * warns if the edit explicitly removes critical hook names.
 *
 * Exit 0 = allow, exit 2 = block with message.
 *
 * Respects SKIP_GATES=1 environment variable (per D20).
 * Appends to hook-warnings-log.jsonl on block (per D13).
 *
 * Session #245: Step 8 — settings.json integrity guardian.
 */

const { execFileSync } = require("node:child_process");
const path = require("node:path");
const { sanitizeError } = require("../../scripts/lib/sanitize-error.cjs");

// --- Constants ---

/** Critical hooks that must remain present in settings.json */
const CRITICAL_HOOKS = [
  "block-push-to-main.js",
  "pre-commit-agent-compliance.js",
  "settings-guardian.js",
];

// --- Kill Switch (D20) ---

if (process.env.SKIP_GATES === "1") {
  process.exit(0);
}

// --- Helpers ---

/**
 * Append a warning to hook-warnings-log.jsonl via the canonical append script.
 * Best-effort — never block on warning write failure.
 *
 * @param {string} message - Warning message
 */
function appendWarning(message) {
  try {
    const scriptPath = path.resolve(__dirname, "..", "..", "scripts", "append-hook-warning.js");
    execFileSync(
      process.execPath,
      [
        scriptPath,
        "--hook=pre-tool",
        "--type=settings-guardian",
        "--severity=error",
        `--message=${message}`,
      ],
      {
        timeout: 5000,
        stdio: "ignore",
      }
    );
  } catch {
    // Best-effort — never block the gate on warning write failure
  }
}

/**
 * Block the operation with a message on stderr and exit 2.
 *
 * @param {string} message - Reason for blocking
 */
function block(message) {
  process.stderr.write(`[settings-guardian] BLOCKED: ${message}\n`);
  appendWarning(message);
  process.exit(2);
}

/**
 * Deep-search a parsed settings object for references to a hook filename.
 * Walks all string values in the entire JSON tree.
 *
 * @param {unknown} obj - Parsed JSON value to search
 * @param {string} hookName - Hook filename to look for (e.g. "block-push-to-main.js")
 * @returns {boolean} true if hookName appears in any string value
 */
function containsHookReference(obj, hookName) {
  if (typeof obj === "string") {
    return obj.includes(hookName);
  }
  if (Array.isArray(obj)) {
    return obj.some((item) => containsHookReference(item, hookName));
  }
  if (obj && typeof obj === "object") {
    return Object.values(obj).some((val) => containsHookReference(val, hookName));
  }
  return false;
}

/**
 * Validate a Write operation (full content available).
 * Checks JSON validity and presence of critical hooks.
 *
 * @param {string} content - Proposed file content
 */
function validateWrite(content) {
  // Parse JSON
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    block("Invalid JSON in settings.json");
    return; // unreachable, but helps static analysis
  }

  // Check for critical hooks
  const missing = [];
  for (const hookName of CRITICAL_HOOKS) {
    if (!containsHookReference(parsed, hookName)) {
      missing.push(hookName);
    }
  }

  if (missing.length > 0) {
    block(`Critical hooks would be removed: ${missing.join(", ")}`);
  }
}

/**
 * Validate an Edit operation (partial content — new_string only).
 * Cannot validate full JSON structure. Only warn if the edit explicitly
 * removes a critical hook name via the old_string containing it while
 * new_string does not.
 *
 * @param {Record<string, unknown>} toolInput - The tool_input object
 */
function validateEdit(toolInput) {
  const oldStr = typeof toolInput.old_string === "string" ? toolInput.old_string : "";
  const newStr = typeof toolInput.new_string === "string" ? toolInput.new_string : "";

  for (const hookName of CRITICAL_HOOKS) {
    if (oldStr.includes(hookName) && !newStr.includes(hookName)) {
      block(`Edit would remove critical hook reference: ${hookName}`);
    }
  }
}

// --- Main: stdin reader ---

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("error", () => {
  // Transport errors should not block work — allow through
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
  try {
    const data = JSON.parse(input);
    const toolName = (data.tool_name || "").toLowerCase();
    const toolInput = data.tool_input || {};

    if (toolName === "write") {
      const content = typeof toolInput.content === "string" ? toolInput.content : "";
      validateWrite(content);
    } else if (toolName === "edit") {
      validateEdit(toolInput);
    }

    // All checks passed
    process.exit(0);
  } catch (err) {
    // Parse errors should not block work — allow through
    const safeErr = String(sanitizeError(err))
      .replaceAll(/\p{C}+/gu, " ")
      .slice(0, 500);
    process.stderr.write(`settings-guardian: unexpected error (${safeErr}), allowing\n`);
    process.exit(0);
  }
});
