/**
 * Unit tests for scripts/reviews/lib/enforcement-manifest.ts
 *
 * Tests MechanismsSchema, EnforcementRecordSchema, classifyCoverage(), and
 * isStale() via the compiled dist. Focuses on unit behaviour of each export
 * in isolation. End-to-end manifest file integrity lives in
 * tests/enforcement-manifest.test.ts.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

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
const distPath = path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/enforcement-manifest.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MechanismsSchema, EnforcementRecordSchema, classifyCoverage, isStale } = require(
  distPath
) as {
  MechanismsSchema: {
    parse: (v: unknown) => unknown;
    safeParse: (v: unknown) => { success: boolean; error?: unknown };
  };
  EnforcementRecordSchema: {
    parse: (v: unknown) => unknown;
    safeParse: (v: unknown) => { success: boolean };
  };
  classifyCoverage: (mechanisms: Record<string, string>) => string;
  isStale: (record: Record<string, unknown>) => boolean;
};

// =========================================================
// Helpers
// =========================================================

function validMechanisms(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    regex: "none",
    eslint: "none",
    semgrep: "none",
    cross_doc: "none",
    hooks: "none",
    ai: "none",
    manual: "code-review",
    ...overrides,
  };
}

function validRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    pattern_id: "error-sanitization",
    pattern_name: "Error Sanitization",
    priority: "critical",
    category: "Security",
    mechanisms: validMechanisms(),
    coverage: "manual-only",
    status: "active",
    last_verified: "2026-03-01",
    ...overrides,
  };
}

// =========================================================
// 1. MechanismsSchema
// =========================================================

describe("MechanismsSchema", () => {
  test("accepts valid all-none mechanisms", () => {
    const result = MechanismsSchema.safeParse(validMechanisms());
    assert.equal(result.success, true);
  });

  test("accepts active:rule-id for regex", () => {
    const result = MechanismsSchema.safeParse(validMechanisms({ regex: "active:my-rule" }));
    assert.equal(result.success, true);
  });

  test("accepts migrated:rule-id for regex", () => {
    const result = MechanismsSchema.safeParse(validMechanisms({ regex: "migrated:old-rule" }));
    assert.equal(result.success, true);
  });

  test("rejects bare rule-id for regex (no prefix)", () => {
    const result = MechanismsSchema.safeParse(validMechanisms({ regex: "my-rule" }));
    assert.equal(result.success, false);
  });

  test("accepts pre-commit and pre-push for hooks", () => {
    assert.equal(
      MechanismsSchema.safeParse(validMechanisms({ hooks: "pre-commit" })).success,
      true
    );
    assert.equal(MechanismsSchema.safeParse(validMechanisms({ hooks: "pre-push" })).success, true);
  });

  test("rejects invalid hooks value", () => {
    const result = MechanismsSchema.safeParse(validMechanisms({ hooks: "post-commit" }));
    assert.equal(result.success, false);
  });

  test("accepts claude-md and code-reviewer for ai", () => {
    assert.equal(MechanismsSchema.safeParse(validMechanisms({ ai: "claude-md" })).success, true);
    assert.equal(
      MechanismsSchema.safeParse(validMechanisms({ ai: "code-reviewer" })).success,
      true
    );
  });

  test("accepts linked for cross_doc", () => {
    const result = MechanismsSchema.safeParse(validMechanisms({ cross_doc: "linked" }));
    assert.equal(result.success, true);
  });

  test("rejects unknown cross_doc value", () => {
    const result = MechanismsSchema.safeParse(validMechanisms({ cross_doc: "maybe" }));
    assert.equal(result.success, false);
  });

  test("accepts code-review and documented-only for manual", () => {
    assert.equal(
      MechanismsSchema.safeParse(validMechanisms({ manual: "code-review" })).success,
      true
    );
    assert.equal(
      MechanismsSchema.safeParse(validMechanisms({ manual: "documented-only" })).success,
      true
    );
  });

  test("rejects missing fields", () => {
    const result = MechanismsSchema.safeParse({ regex: "none" });
    assert.equal(result.success, false);
  });
});

// =========================================================
// 2. EnforcementRecordSchema
// =========================================================

describe("EnforcementRecordSchema", () => {
  test("accepts a fully valid record", () => {
    const result = EnforcementRecordSchema.safeParse(validRecord());
    assert.equal(result.success, true);
  });

  test("rejects missing pattern_id", () => {
    const data = validRecord();
    delete data.pattern_id;
    assert.equal(EnforcementRecordSchema.safeParse(data).success, false);
  });

  test("rejects empty pattern_id", () => {
    const result = EnforcementRecordSchema.safeParse(validRecord({ pattern_id: "" }));
    assert.equal(result.success, false);
  });

  test("accepts all valid priority values", () => {
    for (const priority of ["critical", "important", "edge"] as const) {
      assert.equal(EnforcementRecordSchema.safeParse(validRecord({ priority })).success, true);
    }
  });

  test("rejects unknown priority", () => {
    assert.equal(
      EnforcementRecordSchema.safeParse(validRecord({ priority: "urgent" })).success,
      false
    );
  });

  test("accepts all valid coverage values", () => {
    for (const coverage of ["automated", "ai-assisted", "manual-only", "none"] as const) {
      assert.equal(EnforcementRecordSchema.safeParse(validRecord({ coverage })).success, true);
    }
  });

  test("rejects invalid coverage", () => {
    assert.equal(
      EnforcementRecordSchema.safeParse(validRecord({ coverage: "partial" })).success,
      false
    );
  });

  test("accepts all valid status values", () => {
    for (const status of ["active", "stale", "deprecated"] as const) {
      assert.equal(EnforcementRecordSchema.safeParse(validRecord({ status })).success, true);
    }
  });

  test("rejects invalid status", () => {
    assert.equal(
      EnforcementRecordSchema.safeParse(validRecord({ status: "unknown" })).success,
      false
    );
  });

  test("rejects malformed last_verified date", () => {
    assert.equal(
      EnforcementRecordSchema.safeParse(validRecord({ last_verified: "03-01-2026" })).success,
      false
    );
    assert.equal(
      EnforcementRecordSchema.safeParse(validRecord({ last_verified: "2026/03/01" })).success,
      false
    );
  });

  test("accepts a valid YYYY-MM-DD date", () => {
    assert.equal(
      EnforcementRecordSchema.safeParse(validRecord({ last_verified: "2026-01-15" })).success,
      true
    );
  });
});

// =========================================================
// 3. classifyCoverage
// =========================================================

describe("classifyCoverage", () => {
  const base = validMechanisms({ manual: "none" });

  test("returns automated for active regex", () => {
    assert.equal(classifyCoverage({ ...base, regex: "active:rule" }), "automated");
  });

  test("returns automated for active eslint", () => {
    assert.equal(classifyCoverage({ ...base, eslint: "active:no-unsafe" }), "automated");
  });

  test("returns automated for active semgrep", () => {
    assert.equal(classifyCoverage({ ...base, semgrep: "active:sonash.rule" }), "automated");
  });

  test("returns automated for pre-commit hooks", () => {
    assert.equal(classifyCoverage({ ...base, hooks: "pre-commit" }), "automated");
  });

  test("returns automated for pre-push hooks", () => {
    assert.equal(classifyCoverage({ ...base, hooks: "pre-push" }), "automated");
  });

  test("returns ai-assisted when only ai is set", () => {
    assert.equal(classifyCoverage({ ...base, ai: "claude-md" }), "ai-assisted");
  });

  test("returns manual-only when only manual is set", () => {
    assert.equal(classifyCoverage({ ...base, manual: "code-review" }), "manual-only");
  });

  test("returns none when all are none", () => {
    assert.equal(classifyCoverage(base), "none");
  });

  test("automated takes priority over ai-assisted and manual", () => {
    assert.equal(
      classifyCoverage({ ...base, regex: "active:rule", ai: "claude-md", manual: "code-review" }),
      "automated"
    );
  });

  test("ai-assisted takes priority over manual-only", () => {
    assert.equal(
      classifyCoverage({ ...base, ai: "claude-md", manual: "code-review" }),
      "ai-assisted"
    );
  });

  test("migrated regex does NOT count as automated (starts with 'migrated:' not 'active:')", () => {
    const result = classifyCoverage({ ...base, regex: "migrated:old-rule" });
    // migrated does not start with "active:", so not automated
    assert.notEqual(result, "automated");
  });
});

// =========================================================
// 4. isStale
// =========================================================

function makeStaleRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    pattern_id: "test",
    pattern_name: "Test",
    priority: "edge",
    category: "General",
    mechanisms: validMechanisms({ manual: "none" }),
    coverage: "none",
    status: "active",
    last_verified: "2026-03-01",
    ...overrides,
  };
}

describe("isStale", () => {
  test("returns true when all mechanisms are none and status is active", () => {
    assert.equal(isStale(makeStaleRecord()), true);
  });

  test("returns false when status is deprecated (even with all-none mechanisms)", () => {
    assert.equal(isStale(makeStaleRecord({ status: "deprecated" })), false);
  });

  test("returns false when manual is code-review", () => {
    assert.equal(
      isStale(makeStaleRecord({ mechanisms: validMechanisms({ manual: "code-review" }) })),
      false
    );
  });

  test("returns false when regex is active", () => {
    assert.equal(
      isStale(
        makeStaleRecord({ mechanisms: validMechanisms({ regex: "active:rule", manual: "none" }) })
      ),
      false
    );
  });

  test("returns false when ai is claude-md", () => {
    assert.equal(
      isStale(
        makeStaleRecord({ mechanisms: validMechanisms({ ai: "claude-md", manual: "none" }) })
      ),
      false
    );
  });

  test("returns false when hooks is pre-commit", () => {
    assert.equal(
      isStale(
        makeStaleRecord({ mechanisms: validMechanisms({ hooks: "pre-commit", manual: "none" }) })
      ),
      false
    );
  });

  test("returns false when cross_doc is linked", () => {
    assert.equal(
      isStale(
        makeStaleRecord({ mechanisms: validMechanisms({ cross_doc: "linked", manual: "none" }) })
      ),
      false
    );
  });
});
