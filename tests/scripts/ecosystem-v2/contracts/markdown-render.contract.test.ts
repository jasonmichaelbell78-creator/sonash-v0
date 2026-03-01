/**
 * Contract: reviews.jsonl -> Markdown Renderer
 *
 * Validates that JSONL review records can be rendered to markdown.
 * Full records produce complete output, partial/stub records degrade gracefully.
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

function findProjectRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}
const PROJECT_ROOT = findProjectRoot(__dirname);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const schemas = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/schemas/index.js")
) as {
  ReviewRecord: { parse: (v: unknown) => Record<string, unknown> };
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const completenessLib = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/completeness.js")
) as {
  hasField: (record: { completeness_missing?: string[] }, field: string) => boolean;
};

const { ReviewRecord } = schemas;
const { hasField } = completenessLib;

function loadFixture(name: string): Record<string, unknown> {
  const filePath = path.join(PROJECT_ROOT, "test/fixtures/ecosystem-v2", name);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
}

/**
 * Simple markdown render simulation -- demonstrates contract compliance.
 * The real renderer will be built in Phase 6, but this proves the data shape works.
 */
function renderReviewMarkdown(record: Record<string, unknown>): string {
  const typed = record as { completeness_missing?: string[] };
  const lines: string[] = [];

  lines.push(`# Review: ${record.id}`, `**Date:** ${record.date}`);

  if (hasField(typed, "title") && record.title) {
    lines.push(`**Title:** ${record.title as string}`);
  } else {
    lines.push("**Title:** [data not available]");
  }

  if (hasField(typed, "pr") && record.pr !== undefined && record.pr !== null) {
    lines.push(`**PR:** #${record.pr as number}`);
  }

  if (hasField(typed, "total") && record.total !== undefined && record.total !== null) {
    lines.push(`**Findings:** ${record.total as number} total, ${Number(record.fixed ?? 0)} fixed`);
  } else {
    lines.push("**Findings:** [data not available]");
  }

  if (hasField(typed, "patterns") && Array.isArray(record.patterns)) {
    lines.push(`**Patterns:** ${(record.patterns as string[]).join(", ")}`);
  } else {
    lines.push("**Patterns:** [data not available]");
  }

  if (hasField(typed, "severity_breakdown") && record.severity_breakdown) {
    const sb = record.severity_breakdown as {
      critical: number;
      major: number;
      minor: number;
      trivial: number;
    };
    lines.push(`**Severity:** C:${sb.critical} M:${sb.major} m:${sb.minor} t:${sb.trivial}`);
  }

  return lines.join("\n");
}

describe("Contract: reviews.jsonl -> Markdown Renderer", () => {
  const fullReview = ReviewRecord.parse(loadFixture("review-full.json"));
  const partialReview = ReviewRecord.parse(loadFixture("review-partial.json"));
  const stubReview = ReviewRecord.parse(loadFixture("review-stub.json"));

  test("full review has all fields needed for complete markdown render", () => {
    const md = renderReviewMarkdown(fullReview);
    assert.ok(md.includes("Firebase Auth Migration Review"));
    assert.ok(md.includes("#389"));
    assert.ok(md.includes("8 total"));
    assert.ok(md.includes("error-sanitization"));
    assert.ok(md.includes("C:1 M:3"));
    assert.ok(!md.includes("[data not available]"));
  });

  test("partial review produces markdown with placeholders for missing data", () => {
    const md = renderReviewMarkdown(partialReview);
    assert.ok(md.includes("Tailwind Config Cleanup"));
    assert.ok(md.includes("#412"));
    assert.ok(md.includes("5 total"));
    // severity_breakdown is in completeness_missing, so no severity line
    assert.ok(!md.includes("C:"));
  });

  test("stub review produces minimal valid markdown (just date + id)", () => {
    const md = renderReviewMarkdown(stubReview);
    assert.ok(md.includes("rev-2025-0520-pr430"));
    assert.ok(md.includes("2025-05-20"));
    assert.ok(md.includes("[data not available]"));
    // Should still be valid markdown, not crash or produce garbage
    assert.ok(md.startsWith("# Review:"));
  });

  test("all tiers produce non-empty markdown", () => {
    for (const review of [fullReview, partialReview, stubReview]) {
      const md = renderReviewMarkdown(review);
      assert.ok(md.length > 0);
      assert.ok(md.includes("# Review:"));
      assert.ok(md.includes("**Date:**"));
    }
  });

  test("render does not throw for any tier", () => {
    assert.doesNotThrow(() => renderReviewMarkdown(fullReview));
    assert.doesNotThrow(() => renderReviewMarkdown(partialReview));
    assert.doesNotThrow(() => renderReviewMarkdown(stubReview));
  });
});
