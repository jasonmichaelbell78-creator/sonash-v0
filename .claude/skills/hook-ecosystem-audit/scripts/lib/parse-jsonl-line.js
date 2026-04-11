"use strict";

/**
 * parse-jsonl-line.js — shared helpers for safely parsing a single JSONL line.
 * See scripts/lib/parse-jsonl-line.js for full rationale (T39).
 *
 * Two variants:
 *   - safeParseLine(line)            → object|null (simple skip-on-error)
 *   - safeParseLineWithError(line)   → { value, error } (preserves error context)
 */

/**
 * @param {string} line - A single JSONL line
 * @returns {object|null} Parsed JSON object, or null if blank/malformed
 */
function safeParseLine(line) {
  if (typeof line !== "string") return null;
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

/**
 * Error-preserving variant for parsers that report bad-line positions.
 * @param {string} line - A single JSONL line
 * @returns {{ value: object|null, error: Error|null }}
 */
function safeParseLineWithError(line) {
  if (typeof line !== "string") return { value: null, error: null };
  const trimmed = line.trim();
  if (!trimmed) return { value: null, error: null };
  try {
    return { value: JSON.parse(trimmed), error: null };
  } catch (err) {
    return {
      value: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

// eslint-disable-next-line no-undef
module.exports = { safeParseLine, safeParseLineWithError };
