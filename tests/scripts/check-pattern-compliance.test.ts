import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-pattern-compliance.js

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isExpired(timestamp: string, now: number): boolean {
  const ts = new Date(timestamp).getTime();
  if (!Number.isFinite(ts)) return true;
  return now - ts > TTL_MS;
}

function validateWarnedFilesData(data: unknown): boolean {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  return true;
}

function safeReadWarnedFiles(mockReader: () => unknown): unknown {
  try {
    return mockReader();
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err ? (err as { code: string }).code : null;
    if (code === "ENOENT") return {};
    return null;
  }
}

function buildFpKey(filePath: string, patternId: string): string {
  return `${filePath}::${patternId}`;
}

function parseFpKey(key: string): { file: string; pattern: string } | null {
  const idx = key.indexOf("::");
  if (idx === -1) return null;
  return { file: key.slice(0, idx), pattern: key.slice(idx + 2) };
}

describe("check-pattern-compliance: loadWarnedFiles TTL logic", () => {
  it("identifies old entries as expired", () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    assert.strictEqual(isExpired(eightDaysAgo, Date.now()), true);
  });

  it("identifies fresh entries as not expired", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    assert.strictEqual(isExpired(oneHourAgo, Date.now()), false);
  });

  it("treats invalid timestamps as expired", () => {
    assert.strictEqual(isExpired("not-a-date", Date.now()), true);
  });

  it("treats 7-day boundary correctly (just over)", () => {
    const justOver = new Date(Date.now() - TTL_MS - 1000).toISOString();
    assert.strictEqual(isExpired(justOver, Date.now()), true);
  });
});

describe("check-pattern-compliance: warned-files data validation", () => {
  it("rejects null", () => {
    assert.strictEqual(validateWarnedFilesData(null), false);
  });

  it("rejects array", () => {
    assert.strictEqual(validateWarnedFilesData([]), false);
  });

  it("rejects primitive", () => {
    assert.strictEqual(validateWarnedFilesData("string"), false);
  });

  it("accepts plain object", () => {
    assert.strictEqual(validateWarnedFilesData({ key: "value" }), true);
  });

  it("accepts empty object", () => {
    assert.strictEqual(validateWarnedFilesData({}), true);
  });
});

describe("check-pattern-compliance: pattern severity tiers", () => {
  type Severity = "critical" | "high" | "medium";

  interface PatternDef {
    id: string;
    severity: Severity;
    blockInCI: boolean;
    warnInPreCommit: boolean;
  }

  function buildPattern(id: string, severity: Severity): PatternDef {
    return {
      id,
      severity,
      blockInCI: severity === "critical" || severity === "high",
      warnInPreCommit: true,
    };
  }

  it("critical patterns always block", () => {
    const p = buildPattern("SEC-001", "critical");
    assert.strictEqual(p.blockInCI, true);
  });

  it("high patterns block in CI", () => {
    const p = buildPattern("CORRECT-001", "high");
    assert.strictEqual(p.blockInCI, true);
  });

  it("medium patterns do not block in CI", () => {
    const p = buildPattern("STYLE-001", "medium");
    assert.strictEqual(p.blockInCI, false);
  });
});

describe("check-pattern-compliance: ENOENT handling", () => {
  it("returns empty object on ENOENT", () => {
    const result = safeReadWarnedFiles(() => {
      const err = Object.assign(new Error("File not found"), { code: "ENOENT" });
      throw err;
    });
    assert.deepStrictEqual(result, {});
  });

  it("returns null on non-ENOENT error", () => {
    const result = safeReadWarnedFiles(() => {
      const err = Object.assign(new Error("Permission denied"), { code: "EACCES" });
      throw err;
    });
    assert.strictEqual(result, null);
  });

  it("returns data when no error", () => {
    const data = { "src/foo.ts::pattern-1": "2026-01-01T00:00:00.000Z" };
    const result = safeReadWarnedFiles(() => data);
    assert.deepStrictEqual(result, data);
  });
});

describe("check-pattern-compliance: file extension filtering", () => {
  const RELEVANT_EXTENSIONS = new Set([".js", ".ts", ".tsx", ".jsx", ".sh", ".yml", ".yaml"]);

  function isRelevantFile(filename: string): boolean {
    const ext = filename.slice(filename.lastIndexOf("."));
    return RELEVANT_EXTENSIONS.has(ext);
  }

  it("includes TypeScript files", () => {
    assert.strictEqual(isRelevantFile("app/page.tsx"), true);
  });

  it("includes JavaScript files", () => {
    assert.strictEqual(isRelevantFile("scripts/check.js"), true);
  });

  it("includes shell scripts", () => {
    assert.strictEqual(isRelevantFile("scripts/run.sh"), true);
  });

  it("excludes markdown files", () => {
    assert.strictEqual(isRelevantFile("README.md"), false);
  });

  it("excludes JSON files", () => {
    assert.strictEqual(isRelevantFile("config.json"), false);
  });
});

describe("check-pattern-compliance: false positive key format", () => {
  it("builds correct key format", () => {
    const key = buildFpKey("src/lib/utils.ts", "SEC-001");
    assert.strictEqual(key, "src/lib/utils.ts::SEC-001");
  });

  it("parses key back to components", () => {
    const parsed = parseFpKey("src/lib/utils.ts::SEC-001");
    assert.ok(parsed !== null);
    assert.strictEqual(parsed.file, "src/lib/utils.ts");
    assert.strictEqual(parsed.pattern, "SEC-001");
  });

  it("returns null for invalid key", () => {
    assert.strictEqual(parseFpKey("no-separator-here"), null);
  });
});
