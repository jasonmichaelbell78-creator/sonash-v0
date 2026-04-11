"use strict";

/**
 * parse-jsonl-line.js — shared helper for safely parsing a single JSONL line.
 * See scripts/lib/parse-jsonl-line.js for full rationale (T39).
 *
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

// eslint-disable-next-line no-undef
module.exports = { safeParseLine };
