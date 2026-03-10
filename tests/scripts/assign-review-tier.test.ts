import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/assign-review-tier.js

function sanitizePath(filePath: string): string {
  return String(filePath)
    .replace(/\/home\/[^/\s]+/g, "[HOME]")
    .replace(/\/Users\/[^/\s]+/g, "[HOME]")
    .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]");
}

function normalizePath(filePath: string): string {
  return String(filePath).replaceAll("\\", "/");
}

function buildTierResult(tier: number, reason: string, escalations: string[]): object {
  return { tier, reason, escalations };
}

describe("assign-review-tier: sanitizePath", () => {
  it("masks Unix home paths", () => {
    const result = sanitizePath("/home/jbell/project/file.ts");
    assert.ok(result.includes("[HOME]"));
  });

  it("masks macOS Users paths", () => {
    const result = sanitizePath("/Users/jbell/project/file.ts");
    assert.ok(result.includes("[HOME]"));
  });

  it("masks Windows drive paths", () => {
    const result = sanitizePath("C:\\Users\\jbell\\project\\file.ts");
    assert.ok(result.includes("[HOME]"));
  });

  it("leaves safe paths unchanged", () => {
    assert.strictEqual(sanitizePath("src/lib/utils.ts"), "src/lib/utils.ts");
  });
});

describe("assign-review-tier: normalizePath", () => {
  it("converts Windows backslashes to forward slashes", () => {
    assert.strictEqual(normalizePath("src\\lib\\utils.ts"), "src/lib/utils.ts");
  });

  it("leaves forward slashes unchanged", () => {
    assert.strictEqual(normalizePath("src/lib/utils.ts"), "src/lib/utils.ts");
  });
});

describe("assign-review-tier: TIER_RULES matching", () => {
  const TIER_RULES = {
    tier_0: {
      patterns: [/^docs\/archive\//, /\.log$/, /^\.vscode\//],
    },
    tier_1: {
      patterns: [
        /^docs\/(?!ROADMAP|README|DOCUMENTATION_STANDARDS).*\.md$/,
        /\.test\.(ts|tsx)$/,
        /^styles\/.*\.css$/,
      ],
    },
    tier_2: {
      patterns: [/^app\/.*\.(ts|tsx)$/, /^components\/.*\.tsx$/, /^lib\/.*\.ts$/],
    },
    tier_3: {
      patterns: [
        /^functions\/src\/auth\/.*\.ts$/,
        /^lib\/firebase-config\.ts$/,
        /^lib\/rate-limiter\.ts$/,
      ],
    },
  };

  function assignTier(filePath: string): number {
    const normalized = filePath.replaceAll("\\", "/");
    if (TIER_RULES.tier_0.patterns.some((p) => p.test(normalized))) return 0;
    if (TIER_RULES.tier_3.patterns.some((p) => p.test(normalized))) return 3;
    if (TIER_RULES.tier_2.patterns.some((p) => p.test(normalized))) return 2;
    if (TIER_RULES.tier_1.patterns.some((p) => p.test(normalized))) return 1;
    return 2; // default
  }

  it("assigns tier 0 to archive docs", () => {
    assert.strictEqual(assignTier("docs/archive/old-plan.md"), 0);
  });

  it("assigns tier 0 to log files", () => {
    assert.strictEqual(assignTier("debug.log"), 0);
  });

  it("assigns tier 1 to test files", () => {
    assert.strictEqual(assignTier("src/component.test.ts"), 1);
  });

  it("assigns tier 1 to non-canonical docs", () => {
    assert.strictEqual(assignTier("docs/some-guide.md"), 1);
  });

  it("assigns tier 2 to app components", () => {
    assert.strictEqual(assignTier("app/dashboard/page.tsx"), 2);
  });

  it("assigns tier 3 to auth functions", () => {
    assert.strictEqual(assignTier("functions/src/auth/verify.ts"), 3);
  });
});

describe("assign-review-tier: result structure", () => {
  it("produces correct result structure", () => {
    const result = buildTierResult(2, "App component changed", ["security-sensitive"]) as Record<
      string,
      unknown
    >;
    assert.strictEqual(result["tier"], 2);
    assert.strictEqual(result["reason"], "App component changed");
    assert.deepStrictEqual(result["escalations"], ["security-sensitive"]);
  });

  it("accepts empty escalations array", () => {
    const result = buildTierResult(1, "Doc update", []) as Record<string, unknown>;
    assert.deepStrictEqual(result["escalations"], []);
  });
});
