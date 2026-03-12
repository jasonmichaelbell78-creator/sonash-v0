/**
 * read-jsonl.js — Shared JSONL parser for planning scripts.
 *
 * Handles:
 * - Comment lines (// at any indent level)
 * - Empty lines
 * - CRLF line endings
 * - Parse error warnings (non-fatal)
 * - Fatal read errors (process.exit)
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Read and parse a JSONL file from the planning directory.
 *
 * @param {string} planningDir - Absolute path to the planning directory
 * @param {string} filename - JSONL filename relative to planningDir
 * @returns {object[]} Parsed JSON objects
 */
export function readJsonl(planningDir, filename) {
  const filepath = join(planningDir, filename);
  try {
    const entries = readFileSync(filepath, "utf-8")
      .split("\n")
      .map((line, i) => ({ line, lineNum: i + 1 }))
      .filter(({ line }) => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith("//");
      });
    const results = [];
    for (const { line, lineNum } of entries) {
      try {
        results.push(JSON.parse(line.trim()));
      } catch (err) {
        console.warn(
          `WARNING: ${filename} line ${lineNum}: parse error — ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
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
