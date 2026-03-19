/**
 * Integration test: verifies that all review pipeline scripts agree on file paths.
 *
 * Catches the split-brain bug where write-review-record.ts wrote to ecosystem-v2
 * but render-reviews-to-md.ts and review-lifecycle.js read from .claude/state/.
 *
 * Purpose: Prevent review pipeline path divergence.
 * Version History:
 *   v1.0 2026-03-18 — Created after split-brain discovery
 */

"use strict";

const assert = require("node:assert/strict");
const { describe, test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

function findProjectRoot(startDir) {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const ROOT = findProjectRoot(__dirname);
const CANONICAL_REVIEWS = path.join(".claude", "state", "reviews.jsonl");
const CANONICAL_RETROS = path.join(".claude", "state", "retros.jsonl");

/**
 * Checks whether a non-comment line references an ecosystem-v2 JSONL path.
 * Returns the trimmed line if it does, or null if not.
 */
function findActiveEcosystemV2Reference(line) {
  const hasRef =
    line.includes("ecosystem-v2/reviews.jsonl") || line.includes("ecosystem-v2/retros.jsonl");
  if (!hasRef) return null;

  const trimmed = line.trim();
  if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*") || trimmed.startsWith("*/")) return null;

  return trimmed;
}

describe("Review pipeline path consistency", () => {
  test("write-review-record.ts writes to canonical reviews path", () => {
    const content = fs.readFileSync(
      path.join(ROOT, "scripts/reviews/write-review-record.ts"),
      "utf8"
    );

    assert.ok(
      content.includes('".claude", "state", "reviews.jsonl"') ||
      content.includes(".claude/state/reviews.jsonl"),
      "write-review-record.ts must write to .claude/state/reviews.jsonl"
    );

    assert.ok(
      !content.includes("ecosystem-v2/reviews.jsonl"),
      "write-review-record.ts must NOT reference ecosystem-v2/reviews.jsonl"
    );
  });

  test("write-retro-record.ts writes to canonical retros path", () => {
    const content = fs.readFileSync(
      path.join(ROOT, "scripts/reviews/write-retro-record.ts"),
      "utf8"
    );

    assert.ok(
      content.includes(".claude/state/retros.jsonl"),
      "write-retro-record.ts must write to .claude/state/retros.jsonl"
    );

    assert.ok(
      !content.includes("ecosystem-v2/retros.jsonl"),
      "write-retro-record.ts must NOT reference ecosystem-v2/retros.jsonl"
    );
  });

  test("review-lifecycle.js reads from canonical reviews path", () => {
    const content = fs.readFileSync(
      path.join(ROOT, "scripts/review-lifecycle.js"),
      "utf8"
    );

    assert.ok(
      content.includes('".claude", "state", "reviews.jsonl"') ||
      content.includes(".claude/state/reviews.jsonl") ||
      content.includes('"reviews.jsonl"'),
      "review-lifecycle.js must read from .claude/state/reviews.jsonl"
    );
  });

  test("render-reviews-to-md.ts reads from canonical reviews path", () => {
    const content = fs.readFileSync(
      path.join(ROOT, "scripts/reviews/render-reviews-to-md.ts"),
      "utf8"
    );

    assert.ok(
      content.includes('".claude", "state", "reviews.jsonl"') ||
      content.includes(".claude/state/reviews.jsonl"),
      "render-reviews-to-md.ts must read from .claude/state/reviews.jsonl"
    );

    assert.ok(
      !content.includes("ecosystem-v2/reviews.jsonl"),
      "render-reviews-to-md.ts must NOT reference ecosystem-v2/reviews.jsonl"
    );
  });

  test("compute-changelog-metrics.js reads from canonical paths", () => {
    const content = fs.readFileSync(
      path.join(ROOT, "scripts/reviews/compute-changelog-metrics.js"),
      "utf8"
    );

    assert.ok(
      !content.includes("ecosystem-v2/reviews.jsonl"),
      "compute-changelog-metrics.js must NOT reference ecosystem-v2/reviews.jsonl"
    );

    assert.ok(
      !content.includes("ecosystem-v2/retros.jsonl"),
      "compute-changelog-metrics.js must NOT reference ecosystem-v2/retros.jsonl"
    );
  });

  test("rotation-policy.json references canonical paths", () => {
    const policy = JSON.parse(
      fs.readFileSync(path.join(ROOT, "config/rotation-policy.json"), "utf8")
    );

    const historicalFiles = policy.tiers.historical.files;
    assert.ok(
      historicalFiles.includes(".claude/state/reviews.jsonl"),
      "rotation-policy must include .claude/state/reviews.jsonl"
    );
    assert.ok(
      historicalFiles.includes(".claude/state/retros.jsonl"),
      "rotation-policy must include .claude/state/retros.jsonl"
    );
  });

  test("no active scripts reference ecosystem-v2/reviews.jsonl as write target", () => {
    // Scan all .ts and .js files in scripts/reviews/ (excluding archive, tests, migration)
    const reviewDir = path.join(ROOT, "scripts/reviews");
    const files = fs.readdirSync(reviewDir).filter(
      (f) => (f.endsWith(".ts") || f.endsWith(".js")) &&
             !f.includes("backfill") &&
             !f.includes("migrate-ecosystem") &&
             !f.startsWith(".")
    );

    for (const file of files) {
      const content = fs.readFileSync(path.join(reviewDir, file), "utf8");
      const activeRef = content.split("\n").map(findActiveEcosystemV2Reference).find(Boolean);
      if (activeRef) {
        assert.fail(
          `${file} still references ecosystem-v2 JSONL in active code: ${activeRef}`
        );
      }
    }
  });
});
