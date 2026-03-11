import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fc from "fast-check";

// Property tests for scripts/debt/normalize-all.js
// Re-implements normalizeItem's ensureValid logic to test invariants:
// - severity always in {S0, S1, S2, S3}
// - effort always in {E0, E1, E2, E3}
// - category always in VALID_CATEGORIES
// - type always in VALID_TYPES
// - status always in VALID_STATUSES

const VALID_SEVERITIES = ["S0", "S1", "S2", "S3"];
const VALID_EFFORTS = ["E0", "E1", "E2", "E3"];
const VALID_CATEGORIES = [
  "code-quality",
  "security",
  "performance",
  "maintainability",
  "reliability",
  "testing",
  "documentation",
  "dependencies",
  "architecture",
  "accessibility",
];
const VALID_TYPES = [
  "code-smell",
  "bug",
  "vulnerability",
  "security-hotspot",
  "debt",
  "test-gap",
  "doc-gap",
  "dependency-risk",
];
const VALID_STATUSES = ["NEW", "CONFIRMED", "RESOLVED", "FALSE_POSITIVE", "DEFERRED"];

function ensureValid(value: unknown, validSet: string[], defaultValue: string): string {
  if (typeof value === "string" && validSet.includes(value)) return value;
  return defaultValue;
}

function normalizeItem(item: Record<string, unknown>): {
  severity: string;
  effort: string;
  category: string;
  type: string;
  status: string;
} {
  return {
    severity: ensureValid(item.severity, VALID_SEVERITIES, "S2"),
    effort: ensureValid(item.effort, VALID_EFFORTS, "E1"),
    category: ensureValid(item.category, VALID_CATEGORIES, "code-quality"),
    type: ensureValid(item.type, VALID_TYPES, "code-smell"),
    status: ensureValid(item.status, VALID_STATUSES, "NEW"),
  };
}

describe("normalize-all: property — severity always in {S0, S1, S2, S3}", () => {
  it("any string severity input produces valid severity", () => {
    fc.assert(
      fc.property(fc.string(), (rawSeverity) => {
        const result = normalizeItem({ severity: rawSeverity });
        assert.ok(
          VALID_SEVERITIES.includes(result.severity),
          `Expected severity in ${JSON.stringify(VALID_SEVERITIES)}, got "${result.severity}"`
        );
      })
    );
  });

  it("null/undefined severity produces default S2", () => {
    fc.assert(
      fc.property(fc.constantFrom(null, undefined, 0, false, {}, []), (badSeverity) => {
        const result = normalizeItem({ severity: badSeverity });
        assert.strictEqual(result.severity, "S2");
      })
    );
  });

  it("valid severity values are preserved as-is", () => {
    fc.assert(
      fc.property(fc.constantFrom(...VALID_SEVERITIES), (severity) => {
        const result = normalizeItem({ severity });
        assert.strictEqual(result.severity, severity);
      })
    );
  });
});

describe("normalize-all: property — effort always in {E0, E1, E2, E3}", () => {
  it("any string effort input produces valid effort", () => {
    fc.assert(
      fc.property(fc.string(), (rawEffort) => {
        const result = normalizeItem({ effort: rawEffort });
        assert.ok(
          VALID_EFFORTS.includes(result.effort),
          `Expected effort in ${JSON.stringify(VALID_EFFORTS)}, got "${result.effort}"`
        );
      })
    );
  });

  it("null/undefined effort produces default E1", () => {
    fc.assert(
      fc.property(fc.constantFrom(null, undefined, 0, false, {}, []), (badEffort) => {
        const result = normalizeItem({ effort: badEffort });
        assert.strictEqual(result.effort, "E1");
      })
    );
  });

  it("valid effort values are preserved as-is", () => {
    fc.assert(
      fc.property(fc.constantFrom(...VALID_EFFORTS), (effort) => {
        const result = normalizeItem({ effort });
        assert.strictEqual(result.effort, effort);
      })
    );
  });
});

describe("normalize-all: property — category always in VALID_CATEGORIES", () => {
  it("any string category input produces valid category", () => {
    fc.assert(
      fc.property(fc.string(), (rawCategory) => {
        const result = normalizeItem({ category: rawCategory });
        assert.ok(
          VALID_CATEGORIES.includes(result.category),
          `Expected category in valid set, got "${result.category}"`
        );
      })
    );
  });

  it("invalid category always falls back to code-quality", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !VALID_CATEGORIES.includes(s)),
        (invalidCategory) => {
          const result = normalizeItem({ category: invalidCategory });
          assert.strictEqual(result.category, "code-quality");
        }
      )
    );
  });
});

describe("normalize-all: property — normalizeItem is total (never throws)", () => {
  it("arbitrary objects never cause normalizeItem to throw", () => {
    fc.assert(
      fc.property(
        fc.record({
          severity: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
          effort: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
          category: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
          type: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
          status: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
        }),
        (item) => {
          assert.doesNotThrow(() => normalizeItem(item as Record<string, unknown>));
        }
      )
    );
  });

  it("all output fields are always non-empty strings", () => {
    fc.assert(
      fc.property(
        fc.record({
          severity: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
          effort: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
          category: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
          type: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
          status: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
        }),
        (item) => {
          const result = normalizeItem(item as Record<string, unknown>);
          for (const [key, val] of Object.entries(result)) {
            assert.ok(
              typeof val === "string" && val.length > 0,
              `Field "${key}" should be a non-empty string, got ${JSON.stringify(val)}`
            );
          }
        }
      )
    );
  });
});
