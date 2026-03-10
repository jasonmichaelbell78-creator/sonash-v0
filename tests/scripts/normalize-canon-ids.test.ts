import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/normalize-canon-ids.js

describe("normalize-canon-ids: SEVERITY_ORDER and EFFORT_ORDER", () => {
  const SEVERITY_ORDER: Record<string, number> = { S0: 0, S1: 1, S2: 2, S3: 3 };
  const EFFORT_ORDER: Record<string, number> = { E0: 0, E1: 1, E2: 2, E3: 3 };

  it("S0 has lowest ordinal (highest priority)", () => {
    assert.strictEqual(SEVERITY_ORDER["S0"], 0);
  });

  it("S3 has highest ordinal (lowest priority)", () => {
    assert.strictEqual(SEVERITY_ORDER["S3"], 3);
  });

  it("E0 has lowest effort ordinal", () => {
    assert.strictEqual(EFFORT_ORDER["E0"], 0);
  });
});

describe("normalize-canon-ids: getCategoryFromFilename", () => {
  function getCategoryFromFilename(filename: string): string {
    if (filename.includes("CODE")) return "CODE";
    if (filename.includes("SECURITY")) return "SECURITY";
    if (filename.includes("PERF")) return "PERF";
    if (filename.includes("REFACTOR")) return "REFACTOR";
    if (filename.includes("DOCS")) return "DOCS";
    if (filename.includes("PROCESS")) return "PROCESS";
    return "UNKNOWN";
  }

  it("extracts CODE category", () => {
    assert.strictEqual(getCategoryFromFilename("CANON-CODE.jsonl"), "CODE");
  });

  it("extracts SECURITY category", () => {
    assert.strictEqual(getCategoryFromFilename("CANON-SECURITY.jsonl"), "SECURITY");
  });

  it("returns UNKNOWN for unrecognized filename", () => {
    assert.strictEqual(getCategoryFromFilename("SOME-OTHER.jsonl"), "UNKNOWN");
  });

  it("extracts PERF category", () => {
    assert.strictEqual(getCategoryFromFilename("CANON-PERF.jsonl"), "PERF");
  });
});

describe("normalize-canon-ids: ID format generation", () => {
  function formatCanonId(counter: number): string {
    return `CANON-${String(counter).padStart(4, "0")}`;
  }

  it("pads single digit to 4 chars", () => {
    assert.strictEqual(formatCanonId(1), "CANON-0001");
  });

  it("pads double digit to 4 chars", () => {
    assert.strictEqual(formatCanonId(42), "CANON-0042");
  });

  it("handles 4-digit numbers", () => {
    assert.strictEqual(formatCanonId(9999), "CANON-9999");
  });

  it("handles 100", () => {
    assert.strictEqual(formatCanonId(100), "CANON-0100");
  });
});

describe("normalize-canon-ids: getConfidence", () => {
  function getConfidence(finding: Record<string, unknown>): number {
    const raw = finding["confidence"] ?? finding["final_confidence"] ?? 50;
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) ? n : 50;
  }

  it("uses confidence field", () => {
    assert.strictEqual(getConfidence({ confidence: 80 }), 80);
  });

  it("falls back to final_confidence", () => {
    assert.strictEqual(getConfidence({ final_confidence: 70 }), 70);
  });

  it("defaults to 50 when missing", () => {
    assert.strictEqual(getConfidence({}), 50);
  });

  it("handles non-finite values", () => {
    assert.strictEqual(getConfidence({ confidence: NaN }), 50);
  });
});

describe("normalize-canon-ids: rewriteIdReferences", () => {
  function rewriteIdReferences(
    finding: { dependencies?: string[]; [key: string]: unknown },
    idMap: Map<string, string>
  ): typeof finding {
    if (Array.isArray(finding.dependencies)) {
      finding.dependencies = finding.dependencies.map((dep) => idMap.get(dep) ?? dep);
    }
    return finding;
  }

  it("rewrites dependency IDs", () => {
    const idMap = new Map([["CANON-0001", "CANON-0010"]]);
    const finding = { dependencies: ["CANON-0001", "CANON-0002"] };
    const result = rewriteIdReferences(finding, idMap);
    assert.strictEqual(result.dependencies![0], "CANON-0010");
    assert.strictEqual(result.dependencies![1], "CANON-0002"); // unchanged
  });

  it("handles findings without dependencies", () => {
    const idMap = new Map<string, string>();
    const finding = { title: "Issue" };
    const result = rewriteIdReferences(finding, idMap);
    assert.ok(!result.dependencies);
  });
});
