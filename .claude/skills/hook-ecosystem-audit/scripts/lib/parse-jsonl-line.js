"use strict";

/**
 * parse-jsonl-line.js — shared helpers for safely parsing a single JSONL line.
 *
 * Why this exists (T39): pre-commit pattern-compliance detector (Reviews 353,
 * 357, 358 — multi-line JSON reassembly) flags every `split("\n") + JSON.parse(line)`
 * loop in scripts/ unless the JSON.parse is wrapped in a try/catch whose exact
 * shape matches `try { JSON.parse(line) } catch` or `try { return JSON.parse(line) } catch`.
 * An intermediate assignment (`try { x = JSON.parse(line) } catch`) does NOT
 * match the detector's regex.
 *
 * Every JSONL consumer in scripts/ and .claude/hooks/ should use one of these
 * helpers instead of inlining try/catch at the call site. Both helper bodies
 * satisfy the detectors (multi-line reassembly + JSON-parse-without-try-catch).
 *
 * ## Which helper to use
 *
 * - `safeParseLine(line)` — simple skip-on-error cases (returns object|null).
 *   Use when callers discard malformed lines silently (e.g., read-and-filter
 *   consumers that don't need to report bad-line positions).
 *
 * - `safeParseLineWithError(line)` — error-preserving variant (T39 D1c).
 *   Use when callers need to report WHICH line was malformed and WHY
 *   (e.g., validators, intake scripts, dedup checkers that build a
 *   `parseErrors[]` array).
 */

/**
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

/**
 * Error-preserving variant for parsers that report bad-line positions.
 *
 * Return shape:
 * - `{ value: obj, error: null }` on successful parse
 * - `{ value: null, error: null }` for blank/non-string lines (skip silently)
 * - `{ value: null, error: Error }` for malformed JSON (caller logs/reports)
 *
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

module.exports = { safeParseLine, safeParseLineWithError };
