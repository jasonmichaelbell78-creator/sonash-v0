import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/audit-s0-promotions.js

describe("audit-s0-promotions: DEMOTE_PATTERNS", () => {
  const DEMOTE_PATTERNS = {
    cognitiveComplexity: {
      titlePatterns: [/cognitive complexity/i, /reduce its cognitive complexity/i],
      rulePatterns: [/S3776/],
      demoteTo: "S1",
    },
    codeDuplication: {
      titlePatterns: [/duplicat/i, /identical sub-expression/i],
      rulePatterns: [/S1871/, /S3923/],
      demoteTo: "S1",
    },
    nestingDepth: {
      titlePatterns: [/not nest functions more than/i, /nesting.*deep/i],
      rulePatterns: [/S2004/],
      demoteTo: "S1",
    },
  };

  it("cognitive complexity matches rule S3776", () => {
    const rule = DEMOTE_PATTERNS.cognitiveComplexity;
    assert.ok(rule.rulePatterns.some((p) => p.test("S3776")));
  });

  it("cognitive complexity demotes to S1", () => {
    assert.strictEqual(DEMOTE_PATTERNS.cognitiveComplexity.demoteTo, "S1");
  });

  it("code duplication matches 'duplicat' pattern", () => {
    const rule = DEMOTE_PATTERNS.codeDuplication;
    assert.ok(rule.titlePatterns.some((p) => p.test("Code duplication found")));
  });

  it("nesting depth matches rule S2004", () => {
    assert.ok(DEMOTE_PATTERNS.nestingDepth.rulePatterns.some((p) => p.test("S2004")));
  });
});

describe("audit-s0-promotions: shouldDemote logic", () => {
  const DEMOTE_PATTERNS = {
    cognitiveComplexity: {
      titlePatterns: [/cognitive complexity/i],
      rulePatterns: [/S3776/],
      demoteTo: "S1",
    },
    codeDuplication: {
      titlePatterns: [/duplicat/i],
      rulePatterns: [/S1871/],
      demoteTo: "S1",
    },
  };

  function shouldDemote(
    title: string,
    rule: string | undefined,
    patterns: typeof DEMOTE_PATTERNS
  ): { demote: boolean; to?: string; reason?: string } {
    for (const [category, def] of Object.entries(patterns)) {
      const titleMatch = def.titlePatterns.some((p) => p.test(title));
      const ruleMatch = rule ? def.rulePatterns.some((p) => p.test(rule)) : false;
      if (titleMatch || ruleMatch) {
        return { demote: true, to: def.demoteTo, reason: category };
      }
    }
    return { demote: false };
  }

  it("demotes cognitive complexity issues", () => {
    const result = shouldDemote("Cognitive complexity is too high", undefined, DEMOTE_PATTERNS);
    assert.strictEqual(result.demote, true);
    assert.strictEqual(result.to, "S1");
  });

  it("demotes code duplication issues by rule", () => {
    const result = shouldDemote("Some title", "S1871", DEMOTE_PATTERNS);
    assert.strictEqual(result.demote, true);
    assert.strictEqual(result.to, "S1");
  });

  it("does not demote security issues", () => {
    const result = shouldDemote("SQL injection vulnerability", "S3649", DEMOTE_PATTERNS);
    assert.strictEqual(result.demote, false);
  });
});

function parseJsonlContent(content: string): unknown[] {
  return content
    .trim()
    .split("\n")
    .filter(Boolean)
    .flatMap((line, idx) => {
      try {
        return [JSON.parse(line)];
      } catch {
        console.warn(`WARN: malformed JSON at line ${idx + 1} — skipping`);
        return [];
      }
    });
}

describe("audit-s0-promotions: JSONL reading", () => {
  it("parses valid JSONL lines", () => {
    const content = '{"id":"S0-001","severity":"S0"}\n{"id":"S0-002","severity":"S0"}';
    assert.strictEqual(parseJsonlContent(content).length, 2);
  });

  it("skips malformed lines", () => {
    const content = '{"id":"S0-001"}\nBAD_JSON\n{"id":"S0-003"}';
    assert.strictEqual(parseJsonlContent(content).length, 2);
  });

  it("handles empty content", () => {
    assert.strictEqual(parseJsonlContent("").length, 0);
  });
});
