#!/usr/bin/env node
"use strict";

/**
 * check-review-record.js — Post-commit enforcement for /pr-review Step 6.
 *
 * Detects review fix commits (message matches "fix: PR #N R" or
 * "fix(pr-review): PR #N R") and warns if no corresponding JSONL record
 * exists in reviews.jsonl.
 *
 * Non-blocking (warn only — post-commit cannot reject).
 * Uses execFileSync with hardcoded args — no shell injection risk.
 *
 * Decision D8, D18 from review-data-architecture deep-plan (2026-04-17).
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

// eslint-disable-next-line no-undef -- __dirname is available in CJS scripts
const ROOT = path.resolve(__dirname, "../.."); // validatePathInDir bootstrap — constant path, all downstream fs ops use ROOT-joined paths
const REVIEWS_JSONL = path.join(ROOT, ".claude", "state", "reviews.jsonl");

// Only warn on actual fix-prefixed commits — "fix: PR #N R" and
// "fix(scope): PR #N R". Qodo R1 #6: prior regex warned on any commit whose
// subject mentioned "PR #N Rm" (merge summaries, chore commits referencing
// prior PRs, etc.), producing noise that eroded trust in the enforcement signal.
const REVIEW_FIX_PATTERN = /^fix(?:\([^)]*\))?:\s+PR #(\d+)\s+R(\d+)/i;
const CANONICAL_ID_PATTERN = /^review-pr(\d+)-r(\d+)$/i;
const TITLE_ROUND_PATTERN = /R(\d+)/i;

function parseReviewFixCommit(message) {
  const match = REVIEW_FIX_PATTERN.exec(message);
  if (!match) return null;
  return {
    pr: Number.parseInt(match[1], 10),
    round: Number.parseInt(match[2], 10),
  };
}

// Coerce a value to a finite positive integer, or return null. Handles both
// native number and legacy string-stored record fields (Qodo+Gemini R1 #9).
function toInt(v) {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
  if (typeof v === "string") {
    const n = Number.parseInt(v, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

// Narrow an id value to a safe string for pattern matching. Returns "" for
// null/undefined/objects to avoid Object's default "[object Object]" string
// leaking into regex matches (SonarCloud R2 #4). Accepts number + string.
function idToString(v) {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

// Does a single JSONL record match the target PR/round? Extracted to
// reduce hasReviewRecord cognitive complexity (SonarCloud R1 #1).
function recordMatches(rec, pr, round) {
  const idMatch = CANONICAL_ID_PATTERN.exec(idToString(rec.id));
  if (
    idMatch &&
    Number.parseInt(idMatch[1], 10) === pr &&
    Number.parseInt(idMatch[2], 10) === round
  ) {
    return true;
  }
  const recPr = toInt(rec.pr);
  const recRound = toInt(rec.round);
  if (recPr === pr && recRound === round) return true;
  if (recPr === pr && typeof rec.title === "string") {
    const roundMatch = TITLE_ROUND_PATTERN.exec(rec.title);
    if (roundMatch && Number.parseInt(roundMatch[1], 10) === round) return true;
  }
  return false;
}

function hasReviewRecord(pr, round) {
  let content;
  try {
    content = fs.readFileSync(REVIEWS_JSONL, "utf8");
  } catch {
    return false;
  }
  // Aggregate malformed-line count so parse failures surface once per run
  // rather than silently swallowed (Qodo R1 #20).
  let parseFailures = 0;
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      parseFailures++;
      continue;
    }
    if (recordMatches(rec, pr, round)) return true;
  }
  if (parseFailures > 0) {
    console.error(
      `\u26a0\ufe0f  check-review-record: skipped ${parseFailures} malformed JSONL line(s) in reviews.jsonl`
    );
  }
  return false;
}

function main() {
  let message;
  try {
    // execFileSync with hardcoded args — safe, no shell interpolation.
    // SonarCloud S4036 PATH hotspot reviewed 2026-04-18 and marked SAFE:
    // local dev post-commit hook, hardcoded binary "git", array args prevent
    // shell interpretation, PATH hijack requires prior filesystem compromise.
    message = execFileSync("git", ["log", "-1", "--format=%s"], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 5000,
    }).trim();
  } catch {
    return;
  }

  const parsed = parseReviewFixCommit(message);
  if (!parsed) return;

  if (!hasReviewRecord(parsed.pr, parsed.round)) {
    console.error(
      `\n\u26a0\ufe0f  Review fix committed but no JSONL record for PR #${parsed.pr} R${parsed.round}.` +
        `\n   Run /pr-review Step 6 to create the record before pushing.\n`
    );
  }
}

// Guard main() behind require.main check so tests can require() this module
// to exercise the pure helpers without triggering a git call (PR #517 R4 #1).
if (require.main === module) {
  main();
}

module.exports = {
  parseReviewFixCommit,
  toInt,
  idToString,
  recordMatches,
  hasReviewRecord,
  REVIEW_FIX_PATTERN,
  CANONICAL_ID_PATTERN,
  TITLE_ROUND_PATTERN,
};
