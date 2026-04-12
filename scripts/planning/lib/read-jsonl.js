/**
 * read-jsonl.js — Shared JSONL parser for planning scripts.
 *
 * Handles:
 * - Comment lines (// at any indent level)
 * - Empty lines
 * - CRLF line endings
 * - Parse error warnings (non-fatal)
 * - Fatal read errors (process.exit)
 *
 * Uses a synchronous chunk-streaming helper so this library caller can tolerate
 * arbitrary input size without a 2 MiB whole-file ceiling.
 */

import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { streamLinesSync } = require("../../lib/safe-fs");

/**
 * Read and parse a JSONL file from the planning directory.
 *
 * @param {string} planningDir - Absolute path to the planning directory
 * @param {string} filename - JSONL filename relative to planningDir
 * @returns {object[]} Parsed JSON objects
 */
export function readJsonl(planningDir, filename) {
  const filepath = join(planningDir, filename);
  const results = [];
  let lineNum = 0;
  try {
    streamLinesSync(filepath, (rawLine) => {
      lineNum++;
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed.startsWith("//")) return;
      try {
        results.push(JSON.parse(trimmed));
      } catch (err) {
        console.warn(
          `WARNING: ${filename} line ${lineNum}: parse error — ${err instanceof Error ? err.message : String(err)}`
        );
      }
    });
    return results;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`FATAL: Cannot read ${filename}: ${message}`);
    process.exit(1);
  }
}

/**
 * Escape a string for use in a Markdown table cell.
 * Escapes backslashes first, then pipes, then normalizes newlines.
 *
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for MD table cells
 */
export function escapeCell(str) {
  if (str == null) return "";
  return String(str)
    .replaceAll("\\", "\\\\")
    .replaceAll("|", String.raw`\|`)
    .replaceAll("\r", "")
    .replaceAll("\n", " ");
}
