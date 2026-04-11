"use strict";

/**
 * parse-jsonl-line.js — shared helper for safely parsing a single JSONL line.
 *
 * Why this exists (T39): pre-commit pattern-compliance detector (Reviews 353,
 * 357, 358 — multi-line JSON reassembly) flags every `split("\n") + JSON.parse(line)`
 * loop in scripts/ unless the JSON.parse is wrapped in a try/catch whose exact
 * shape matches `try { JSON.parse(line) } catch` or `try { return JSON.parse(line) } catch`.
 * An intermediate assignment (`try { x = JSON.parse(line) } catch`) does NOT
 * match the detector's regex.
 *
 * Every JSONL consumer in scripts/ and .claude/hooks/ should use this helper
 * instead of inlining try/catch at the call site. The helper body satisfies
 * both detectors (multi-line reassembly + JSON-parse-without-try-catch).
 *
 * @param {string} line - A single JSONL line (may be blank or malformed)
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

module.exports = { safeParseLine };
