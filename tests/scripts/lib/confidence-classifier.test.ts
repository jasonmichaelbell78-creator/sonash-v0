/**
 * confidence-classifier.js Tests
 *
 * Verifies classification rules (priority order):
 * 1. code + "unbounded"/"no rotation" → high (add-to-rotation)
 * 2. code + matches verified-pattern → high (update-verified-pattern)
 * 3. behavioral → always low
 * 4. process + known consumer → high (extend-consumer)
 * 5. process otherwise → low
 *
 * Run: npm run test:build && node --test dist-tests/tests/scripts/lib/confidence-classifier.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

const MODULE_PATH = path.resolve(PROJECT_ROOT, "scripts/lib/confidence-classifier.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { classify } = require(MODULE_PATH) as {
  classify: (entry: unknown) => {
    confidence: "high" | "low";
    reason: string;
    action: Record<string, unknown>;
  };
};

describe("confidence-classifier", () => {
  // Rule 1: code + "unbounded" or "no rotation" → high
  it("classifies code type with 'unbounded' pattern as high confidence", () => {
    const entry = {
      learning: {
        type: "code",
        pattern: "Audit Findings: Storage: unbounded, no rotation",
      },
      route: "verified-pattern",
    };
    const result = classify(entry);
    assert.equal(result.confidence, "high");
    assert.equal(result.action.type, "add-to-rotation");
  });

  it("classifies code type with 'no rotation' pattern as high confidence", () => {
    const entry = {
      learning: {
        type: "code",
        pattern: "Aggregation Data: no rotation policy",
      },
      route: "verified-pattern",
    };
    const result = classify(entry);
    assert.equal(result.confidence, "high");
    assert.equal(result.action.type, "add-to-rotation");
  });

  // Rule 3: behavioral → always low
  it("classifies behavioral type as low confidence", () => {
    const entry = {
      learning: { type: "behavioral", pattern: "Stop and ask is a hard stop" },
      route: "claude-md-annotation",
    };
    const result = classify(entry);
    assert.equal(result.confidence, "low");
    assert.match(result.reason, /behavioral/);
  });

  // Rule 4: process + known consumer → high
  it("classifies process type with known consumer as high confidence", () => {
    const entry = {
      learning: {
        type: "process",
        pattern: "hook-warnings not surfaced in health-scores dashboard",
      },
      route: "hook-gate",
    };
    const result = classify(entry);
    assert.equal(result.confidence, "high");
    assert.equal(result.action.type, "extend-consumer");
  });

  // Rule 5: process without known consumer → low
  it("classifies process type without known consumer as low confidence", () => {
    const entry = {
      learning: {
        type: "process",
        pattern: "Planning Data: write-only, no consumer",
      },
      route: "hook-gate",
    };
    const result = classify(entry);
    assert.equal(result.confidence, "low");
    assert.match(result.reason, /ambiguous/);
  });

  // Edge cases
  it("handles entry with missing learning field", () => {
    const entry = { route: "hook-gate" };
    const result = classify(entry);
    assert.equal(result.confidence, "low");
    assert.match(result.reason, /missing/);
  });

  it("handles entry with null", () => {
    const result = classify(null);
    assert.equal(result.confidence, "low");
    assert.match(result.reason, /missing/);
  });

  it("handles entry with unknown type", () => {
    const entry = {
      learning: { type: "unknown", pattern: "test" },
      route: "hook-gate",
    };
    const result = classify(entry);
    assert.equal(result.confidence, "low");
    assert.match(result.reason, /unknown/);
  });

  // Rule 2: code + matches verified-pattern — test by using a pattern substring that
  // matches an existing anti_pattern in verified-patterns.json
  it("classifies code type matching a verified-pattern as high confidence", () => {
    // "existsSync before readFileSync" is anti_pattern for toctou-race
    const entry = {
      learning: {
        type: "code",
        pattern: "existsSync before readFileSync causes TOCTOU race",
      },
      route: "verified-pattern",
    };
    const result = classify(entry);
    assert.equal(result.confidence, "high");
    assert.equal(result.action.type, "update-verified-pattern");
  });

  // code type with no rotation AND no verified-pattern match → still high via Rule 1
  it("rule 1 takes priority over rule 2 for rotation gap", () => {
    const entry = {
      learning: {
        type: "code",
        pattern: "unbounded query with no rotation",
      },
      route: "verified-pattern",
    };
    const result = classify(entry);
    assert.equal(result.confidence, "high");
    assert.equal(result.action.type, "add-to-rotation");
  });

  // code type with no match and no rotation → low
  it("classifies code type with no match and no rotation gap as low", () => {
    const entry = {
      learning: {
        type: "code",
        pattern: "Some totally novel code pattern with no prior reference",
      },
      route: "verified-pattern",
    };
    const result = classify(entry);
    assert.equal(result.confidence, "low");
    assert.match(result.reason, /no matching verified-pattern/);
  });
});
