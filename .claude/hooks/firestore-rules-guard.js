#!/usr/bin/env node
/* global require, process, console, __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * firestore-rules-guard.js - PreToolUse gate (Write/Edit)
 *
 * Blocks removal of `allow create, update: if false` write-block patterns
 * from firestore.rules on protected collections. These patterns enforce
 * that all writes go through Cloud Functions (Security Rule #1).
 *
 * Protected collections: journal, daily_logs, inventoryEntries
 *
 * Exit 0 = allow, exit 2 = block with message.
 *
 * Per D10: ALLOW_RULES_EDIT=1 bypasses all checks.
 * Per D20: SKIP_GATES=1 bypasses all checks.
 * Per D13: Appends to hook-warnings-log.jsonl on block.
 *
 * Hook if-implementation Plan, Step 10.
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

/**
 * Protected collections that MUST retain `allow create, update: if false`.
 * Each entry maps a human-readable name to the collection name used in the
 * Firestore rules match path.
 */
const PROTECTED_COLLECTIONS = [
  { name: "journal", matchPath: "journal/{entryId}" },
  { name: "daily_logs", matchPath: "daily_logs/{dateId}" },
  { name: "inventoryEntries", matchPath: "inventoryEntries/{entryId}" },
];

/**
 * Check whether the given firestore.rules content has a write-block pattern
 * (`allow create, update: if false`) within the match block for the given
 * collection.
 *
 * @param {string} content - Full firestore.rules file content
 * @param {{ name: string, matchPath: string }} collectionInfo
 * @returns {boolean} true if the write-block pattern is present
 */
function hasWriteBlock(content, collectionInfo) {
  const escapedName = collectionInfo.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Find the match block for this collection
  const matchRegex = new RegExp(`match\\s+/users/\\{userId\\}/${escapedName}/\\{\\w+\\}`);
  const matchResult = matchRegex.exec(content);
  if (!matchResult) {
    // Collection match block not found at all
    return false;
  }

  // Skip past the match path (which contains braces like {userId}, {entryId})
  // Start scanning for the rule block's opening { AFTER the regex match
  const afterMatchPath = content
    .slice(matchResult.index + matchResult[0].length)
    .replace(/\/\/.*$/gm, "");

  // Find the rule block: first { after the match path opens it
  let depth = 0;
  let blockStart = -1;
  let blockEnd = -1;
  for (let i = 0; i < afterMatchPath.length; i++) {
    if (afterMatchPath[i] === "{") {
      if (depth === 0) blockStart = i;
      depth++;
    } else if (afterMatchPath[i] === "}") {
      depth--;
      if (depth === 0) {
        blockEnd = i;
        break;
      }
    }
  }

  if (blockStart === -1 || blockEnd === -1) return false;

  const blockContent = afterMatchPath.slice(blockStart, blockEnd + 1);

  // Check for the write-block pattern within this block
  const writeBlockPattern = /allow\s+create,\s*update:\s*if\s+false/;
  return writeBlockPattern.test(blockContent);
}

// --- JSONL Warning ---

/**
 * Append a warning entry to hook-warnings-log.jsonl (per D13).
 *
 * @param {string} message - Warning message
 * @param {string[]} collections - Names of affected collections
 */
function appendWarningJsonl(message, collections) {
  try {
    const stateDir = path.join(__dirname, "..", "state");
    const logPath = path.join(stateDir, "hook-warnings-log.jsonl");

    try {
      fs.mkdirSync(stateDir, { recursive: true });
    } catch {
      // directory may already exist or be non-creatable; best-effort
    }
    if (!isSafeToWrite(logPath)) return;

    const entry = {
      timestamp: new Date().toISOString(),
      hook: "pre-tool",
      type: "firestore-rules-guard",
      severity: "error",
      message,
      collections,
      actor: "hook-system",
      outcome: "blocked",
    };
    safeAppendFileSync(logPath, JSON.stringify(entry) + "\n");
  } catch {
    // Best-effort -- never block hooks on log failure
  }
}

// --- Main ---

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("error", () => {
  // Transport errors should not block work -- allow through
  process.exit(0);
});
process.stdin.on("data", (chunk) => {
  input += chunk;
  // Fail-open on unexpectedly large payloads
  if (input.length > 5 * 1024 * 1024) {
    process.exit(0);
  }
});
process.stdin.on("end", () => {
  try {
    // --- Kill switches ---
    if (process.env.SKIP_GATES === "1" || process.env.ALLOW_RULES_EDIT === "1") {
      process.exit(0);
    }

    const data = JSON.parse(input);
    const toolName = (data.tool_name || "").toLowerCase();
    const toolInput = data.tool_input || {};

    // Determine the file being targeted
    const filePath = toolInput.file_path || "";
    if (!filePath.endsWith("firestore.rules")) {
      // Not targeting firestore.rules -- allow through
      process.exit(0);
    }

    if (toolName === "write") {
      // Full file replacement -- verify ALL protected patterns are present
      checkWriteContent(toolInput.content || "");
    } else if (toolName === "edit") {
      // Partial edit -- check if a write-block pattern is being removed
      checkEditOperation(toolInput);
    } else {
      // Unknown tool -- allow through
      process.exit(0);
    }
  } catch (err) {
    // Parse/logic errors should not block work -- allow through
    process.stderr.write(
      `[firestore-rules-guard] Internal error (allowing through): ${sanitizeError(err)}\n`
    );
    process.exit(0);
  }
});

/**
 * Check a Write operation's full content for all protected patterns.
 *
 * @param {string} content - Proposed firestore.rules content
 */
function checkWriteContent(content) {
  const missing = [];

  for (const collection of PROTECTED_COLLECTIONS) {
    if (!hasWriteBlock(content, collection)) {
      missing.push(collection.name);
    }
  }

  if (missing.length > 0) {
    const msg =
      `[firestore-rules-guard] BLOCKED: Write to firestore.rules would remove ` +
      `write-block protection from: ${missing.join(", ")}. ` +
      `These collections MUST retain 'allow create, update: if false' -- ` +
      `all writes go through Cloud Functions. ` +
      `Set ALLOW_RULES_EDIT=1 to override.`;
    process.stderr.write(msg + "\n");
    appendWarningJsonl(msg, missing);
    process.exit(2);
  }

  // All patterns present -- allow
  process.exit(0);
}

/**
 * Check an Edit operation for removal of write-block patterns.
 *
 * @param {{ old_string?: string, new_string?: string }} toolInput
 */
function checkEditOperation(toolInput) {
  const oldString = toolInput.old_string || "";
  const newString = toolInput.new_string || "";

  // Check if the edit is removing a write-block pattern
  const writeBlockPattern = /allow\s+create,\s*update:\s*if\s+false/;

  if (writeBlockPattern.test(oldString) && !writeBlockPattern.test(newString)) {
    // Determine which collection is affected by checking the old_string context
    const affected = [];
    for (const collection of PROTECTED_COLLECTIONS) {
      if (oldString.includes(collection.name)) {
        affected.push(collection.name);
      }
    }

    // If we can't determine the specific collection, still block
    const collectionList =
      affected.length > 0 ? affected.join(", ") : "unknown (pattern removed from old_string)";

    const msg =
      `[firestore-rules-guard] BLOCKED: Edit to firestore.rules removes ` +
      `'allow create, update: if false' pattern. ` +
      `Affected collection(s): ${collectionList}. ` +
      `These collections MUST retain write-block protection -- ` +
      `all writes go through Cloud Functions. ` +
      `Set ALLOW_RULES_EDIT=1 to override.`;
    process.stderr.write(msg + "\n");
    appendWarningJsonl(msg, affected.length > 0 ? affected : ["unknown"]);
    process.exit(2);
  }

  // Edit doesn't remove a write-block pattern -- allow
  process.exit(0);
}
