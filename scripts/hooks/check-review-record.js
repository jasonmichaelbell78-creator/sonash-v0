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
const ROOT = path.resolve(__dirname, "../..");
const REVIEWS_JSONL = path.join(ROOT, ".claude", "state", "reviews.jsonl");

function parseReviewFixCommit(message) {
  const match = /PR #(\d+)\s+R(\d+)/i.exec(message);
  if (!match) return null;
  return { pr: parseInt(match[1], 10), round: parseInt(match[2], 10) };
}

function hasReviewRecord(pr, round) {
  let content;
  try {
    content = fs.readFileSync(REVIEWS_JSONL, "utf8");
  } catch {
    return false;
  }
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      const rec = JSON.parse(line);
      if (rec.pr === pr && rec.round === round) return true;
      if (rec.pr === pr && rec.title) {
        const roundMatch = /R(\d+)/i.exec(rec.title);
        if (roundMatch && parseInt(roundMatch[1], 10) === round) return true;
      }
    } catch {
      // Skip unparseable lines
    }
  }
  return false;
}

function main() {
  let message;
  try {
    // execFileSync with hardcoded args — safe, no shell interpolation
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

main();
