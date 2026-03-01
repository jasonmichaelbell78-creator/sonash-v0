/**
 * Tests for the enforcement manifest system.
 *
 * Tests schema validation, classifyCoverage(), isStale(),
 * builder parsing, and verifier drift detection.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as path from "node:path";
import * as fs from "node:fs";

// Walk up from __dirname until we find package.json
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition -- continue walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const PROJECT_ROOT = findProjectRoot(__dirname);
const distPath = path.resolve(PROJECT_ROOT, "scripts/reviews/dist");

// Import compiled modules
/* eslint-disable @typescript-eslint/no-require-imports */
const { EnforcementRecordSchema, classifyCoverage, isStale } = require(
  path.join(distPath, "lib/enforcement-manifest.js")
) as {
  EnforcementRecordSchema: {
    parse: (data: unknown) => unknown;
    safeParse: (data: unknown) => { success: boolean };
  };
  classifyCoverage: (mechanisms: Record<string, string>) => string;
  isStale: (record: Record<string, unknown>) => boolean;
};

const { slugify } = require(path.join(distPath, "build-enforcement-manifest.js")) as {
  slugify: (name: string) => string;
};
/* eslint-enable @typescript-eslint/no-require-imports */

// --- Schema Validation ---

describe("EnforcementRecordSchema", () => {
  const validRecord = {
    pattern_id: "error-sanitization",
    pattern_name: "Error Sanitization",
    priority: "critical",
    category: "Critical Patterns",
    mechanisms: {
      regex: "active:unsanitized-error-response",
      eslint: "active:no-unsafe-error-access",
      semgrep: "active:sonash.security.no-unsanitized-error-response",
      cross_doc: "none",
      hooks: "pre-commit",
      ai: "claude-md",
      manual: "code-review",
    },
    coverage: "automated",
    status: "active",
    last_verified: "2026-03-01",
  };

  test("validates a complete valid record", () => {
    const result = EnforcementRecordSchema.safeParse(validRecord);
    assert.equal(result.success, true);
  });

  test("rejects record with missing required fields", () => {
    const incomplete = { pattern_id: "test" };
    const result = EnforcementRecordSchema.safeParse(incomplete);
    assert.equal(result.success, false);
  });

  test("rejects record with invalid priority", () => {
    const invalid = { ...validRecord, priority: "unknown" };
    const result = EnforcementRecordSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });

  test("rejects record with invalid status", () => {
    const invalid = { ...validRecord, status: "unknown" };
    const result = EnforcementRecordSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });

  test("rejects record with invalid mechanism value", () => {
    const invalid = {
      ...validRecord,
      mechanisms: { ...validRecord.mechanisms, hooks: "invalid" },
    };
    const result = EnforcementRecordSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });

  test("accepts migrated regex mechanism", () => {
    const migrated = {
      ...validRecord,
      mechanisms: { ...validRecord.mechanisms, regex: "migrated:eslint" },
    };
    const result = EnforcementRecordSchema.safeParse(migrated);
    assert.equal(result.success, true);
  });

  test("rejects invalid date format", () => {
    const invalid = { ...validRecord, last_verified: "not-a-date" };
    const result = EnforcementRecordSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });
});

// --- classifyCoverage ---

describe("classifyCoverage", () => {
  const baseMechanisms = {
    regex: "none",
    eslint: "none",
    semgrep: "none",
    cross_doc: "none",
    hooks: "none",
    ai: "none",
    manual: "none",
  };

  test("returns 'automated' when regex is active", () => {
    const m = { ...baseMechanisms, regex: "active:some-rule" };
    assert.equal(classifyCoverage(m), "automated");
  });

  test("returns 'automated' when eslint is active", () => {
    const m = { ...baseMechanisms, eslint: "active:no-unsafe-error-access" };
    assert.equal(classifyCoverage(m), "automated");
  });

  test("returns 'automated' when semgrep is active", () => {
    const m = { ...baseMechanisms, semgrep: "active:sonash.security.rule" };
    assert.equal(classifyCoverage(m), "automated");
  });

  test("returns 'automated' when hooks is pre-commit", () => {
    const m = { ...baseMechanisms, hooks: "pre-commit" };
    assert.equal(classifyCoverage(m), "automated");
  });

  test("returns 'ai-assisted' when only ai is active", () => {
    const m = { ...baseMechanisms, ai: "claude-md" };
    assert.equal(classifyCoverage(m), "ai-assisted");
  });

  test("returns 'manual-only' when only manual is active", () => {
    const m = { ...baseMechanisms, manual: "code-review" };
    assert.equal(classifyCoverage(m), "manual-only");
  });

  test("returns 'none' when all mechanisms are none", () => {
    assert.equal(classifyCoverage(baseMechanisms), "none");
  });

  test("prefers automated over ai-assisted", () => {
    const m = { ...baseMechanisms, regex: "active:rule", ai: "claude-md" };
    assert.equal(classifyCoverage(m), "automated");
  });
});

// --- isStale ---

describe("isStale", () => {
  test("returns true when all mechanisms are none and status is active", () => {
    const record = {
      pattern_id: "test",
      pattern_name: "Test",
      priority: "important",
      category: "General",
      mechanisms: {
        regex: "none",
        eslint: "none",
        semgrep: "none",
        cross_doc: "none",
        hooks: "none",
        ai: "none",
        manual: "none",
      },
      coverage: "none",
      status: "active",
      last_verified: "2026-03-01",
    };
    assert.equal(isStale(record), true);
  });

  test("returns false when status is deprecated", () => {
    const record = {
      pattern_id: "test",
      pattern_name: "Test",
      priority: "important",
      category: "General",
      mechanisms: {
        regex: "none",
        eslint: "none",
        semgrep: "none",
        cross_doc: "none",
        hooks: "none",
        ai: "none",
        manual: "none",
      },
      coverage: "none",
      status: "deprecated",
      last_verified: "2026-03-01",
    };
    assert.equal(isStale(record), false);
  });

  test("returns false when manual is code-review", () => {
    const record = {
      pattern_id: "test",
      pattern_name: "Test",
      priority: "important",
      category: "General",
      mechanisms: {
        regex: "none",
        eslint: "none",
        semgrep: "none",
        cross_doc: "none",
        hooks: "none",
        ai: "none",
        manual: "code-review",
      },
      coverage: "manual-only",
      status: "active",
      last_verified: "2026-03-01",
    };
    assert.equal(isStale(record), false);
  });
});

// --- slugify ---

describe("slugify", () => {
  test("converts pattern names to slug format", () => {
    assert.equal(slugify("Error Sanitization"), "error-sanitization");
  });

  test("handles special characters", () => {
    assert.equal(slugify("exec() Loops with /g Flag"), "exec-loops-with-g-flag");
  });

  test("strips leading/trailing hyphens", () => {
    assert.equal(slugify("  Test  "), "test");
  });
});

// --- Manifest Integrity ---

describe("Manifest Integrity", () => {
  const manifestPath = path.join(PROJECT_ROOT, "data/ecosystem-v2/enforcement-manifest.jsonl");

  test("manifest file exists", () => {
    assert.equal(fs.existsSync(manifestPath), true);
  });

  test("all manifest records validate against schema", () => {
    const content = fs.readFileSync(manifestPath, "utf-8");
    const lines = content.split(/\r?\n/).filter((l: string) => l.trim());
    let validCount = 0;
    for (const line of lines) {
      const parsed = JSON.parse(line);
      const result = EnforcementRecordSchema.safeParse(parsed);
      if (result.success) validCount++;
    }
    assert.equal(validCount, lines.length);
    assert.ok(validCount > 0, "Expected at least one valid record");
  });

  test("automated coverage exceeds 55%", () => {
    const content = fs.readFileSync(manifestPath, "utf-8");
    const lines = content.split(/\r?\n/).filter((l: string) => l.trim());
    const records = lines.map((l: string) => JSON.parse(l));
    const automated = records.filter(
      (r: Record<string, string>) => r.coverage === "automated"
    ).length;
    const pct = (automated / records.length) * 100;
    assert.ok(pct >= 55, `Automated coverage ${pct.toFixed(1)}% is below 55% target`);
  });

  test("no stale patterns remain", () => {
    const content = fs.readFileSync(manifestPath, "utf-8");
    const lines = content.split(/\r?\n/).filter((l: string) => l.trim());
    const records = lines.map((l: string) => JSON.parse(l));
    const stale = records.filter((r: Record<string, string>) => r.status === "stale");
    assert.equal(stale.length, 0, `Found ${stale.length} stale patterns`);
  });
});
