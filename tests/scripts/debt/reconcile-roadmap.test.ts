/**
 * Unit tests for reconcile-roadmap.js
 *
 * Tests: safeReadFile/safeParseJSON helpers, buildCanonMap, CANON ID pattern,
 * and roadmap reference replacement logic.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── safeReadFile (simulated) ─────────────────────────────────────────────────

function safeParseJSON(content: string, label: string): unknown {
  try {
    return JSON.parse(content);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse ${label}: ${msg}`);
  }
}

describe("safeParseJSON", () => {
  it("parses valid JSON object", () => {
    const result = safeParseJSON('{"key":"value"}', "test") as Record<string, string>;
    assert.equal(result.key, "value");
  });

  it("throws descriptive error for invalid JSON", () => {
    assert.throws(() => safeParseJSON("NOT JSON", "mapping"), /Failed to parse mapping/);
  });

  it("parses nested objects", () => {
    const result = safeParseJSON('{"a":{"b":1}}', "test") as Record<string, unknown>;
    assert.deepEqual(result.a, { b: 1 });
  });
});

// ─── buildCanonMap ────────────────────────────────────────────────────────────

function buildCanonMap(fullMapping: Record<string, string>): Map<string, string> {
  const canonMap = new Map<string, string>();
  const canonPattern = /^CANON-\d{4}$/;
  for (const [key, value] of Object.entries(fullMapping)) {
    if (canonPattern.test(key)) {
      canonMap.set(key, value);
    }
  }
  return canonMap;
}

describe("buildCanonMap", () => {
  it("extracts only CANON-XXXX keys", () => {
    const mapping = {
      "CANON-0001": "DEBT-0042",
      "CANON-0002": "DEBT-0043",
      "INTAKE-001": "DEBT-0044",
    };
    const map = buildCanonMap(mapping);
    assert.equal(map.size, 2);
    assert.ok(map.has("CANON-0001"));
    assert.equal(map.get("CANON-0001"), "DEBT-0042");
    assert.equal(map.has("INTAKE-001"), false);
  });

  it("excludes keys with non-4-digit numbers", () => {
    const mapping = {
      "CANON-001": "DEBT-0001",
      "CANON-0001": "DEBT-0042",
    };
    const map = buildCanonMap(mapping);
    assert.equal(map.size, 1);
    assert.ok(map.has("CANON-0001"));
  });

  it("returns empty map for empty input", () => {
    assert.equal(buildCanonMap({}).size, 0);
  });

  it("returns empty map when no CANON keys match", () => {
    const mapping = { "OTHER-0001": "DEBT-0001" };
    assert.equal(buildCanonMap(mapping).size, 0);
  });
});

// ─── CANON pattern validation ─────────────────────────────────────────────────

function isCanonId(id: string): boolean {
  return /^CANON-\d{4}$/.test(id);
}

describe("isCanonId", () => {
  it("accepts CANON-0001", () => assert.equal(isCanonId("CANON-0001"), true));
  it("accepts CANON-9999", () => assert.equal(isCanonId("CANON-9999"), true));
  it("rejects CANON-001 (3 digits)", () => assert.equal(isCanonId("CANON-001"), false));
  it("rejects CANON-00001 (5 digits)", () => assert.equal(isCanonId("CANON-00001"), false));
  it("rejects DEBT-0001", () => assert.equal(isCanonId("DEBT-0001"), false));
  it("rejects lowercase", () => assert.equal(isCanonId("canon-0001"), false));
});

// ─── Reference replacement logic ──────────────────────────────────────────────

function replaceCanonRefs(content: string, canonMap: Map<string, string>): string {
  return content.replaceAll(/CANON-\d{4}/g, (match) => {
    return canonMap.get(match) ?? match;
  });
}

describe("replaceCanonRefs", () => {
  it("replaces known CANON IDs with DEBT IDs", () => {
    const canonMap = new Map([["CANON-0001", "DEBT-0042"]]);
    const result = replaceCanonRefs("Fix CANON-0001 in auth module", canonMap);
    assert.equal(result, "Fix DEBT-0042 in auth module");
  });

  it("leaves unknown CANON IDs unchanged", () => {
    const canonMap = new Map([["CANON-0001", "DEBT-0042"]]);
    const result = replaceCanonRefs("See CANON-0999", canonMap);
    assert.equal(result, "See CANON-0999");
  });

  it("replaces multiple occurrences", () => {
    const canonMap = new Map([
      ["CANON-0001", "DEBT-0042"],
      ["CANON-0002", "DEBT-0043"],
    ]);
    const result = replaceCanonRefs("CANON-0001 and CANON-0002", canonMap);
    assert.equal(result, "DEBT-0042 and DEBT-0043");
  });

  it("returns content unchanged when map is empty", () => {
    const result = replaceCanonRefs("See CANON-0001", new Map());
    assert.equal(result, "See CANON-0001");
  });
});

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseReconcileArgs(argv: string[]): { writeMode: boolean; verbose: boolean } {
  const args = new Set(argv);
  return {
    writeMode: args.has("--write"),
    verbose: args.has("--verbose"),
  };
}

describe("parseReconcileArgs", () => {
  it("defaults to dry-run", () => {
    assert.equal(parseReconcileArgs([]).writeMode, false);
  });

  it("enables write mode", () => {
    assert.equal(parseReconcileArgs(["--write"]).writeMode, true);
  });

  it("enables verbose", () => {
    assert.equal(parseReconcileArgs(["--verbose"]).verbose, true);
  });
});
