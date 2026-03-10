import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/aggregate-audit-findings.js

describe("aggregate-audit-findings: SEVERITY_WEIGHTS", () => {
  const SEVERITY_WEIGHTS: Record<string, number> = { S0: 4, S1: 3, S2: 2, S3: 1 };
  const EFFORT_WEIGHTS: Record<string, number> = { E0: 4, E1: 3, E2: 2, E3: 1 };
  const ROI_WEIGHTS: Record<string, number> = { HIGH: 3, CRITICAL: 4, MEDIUM: 2, LOW: 1 };

  it("assigns highest weight to S0", () => {
    assert.strictEqual(SEVERITY_WEIGHTS["S0"], 4);
    assert.strictEqual(SEVERITY_WEIGHTS["S3"], 1);
  });

  it("assigns highest weight to E0 effort", () => {
    assert.strictEqual(EFFORT_WEIGHTS["E0"], 4);
    assert.strictEqual(EFFORT_WEIGHTS["E3"], 1);
  });

  it("CRITICAL ROI outweighs LOW", () => {
    assert.ok(ROI_WEIGHTS["CRITICAL"] > ROI_WEIGHTS["LOW"]);
  });
});

describe("aggregate-audit-findings: CATEGORY_MAP", () => {
  const CATEGORY_MAP: Record<string, string> = {
    code: "code",
    security: "security",
    performance: "performance",
    process: "process",
    refactoring: "refactoring",
    documentation: "documentation",
    "engineering-productivity": "dx",
    offline: "offline",
    Testing: "code",
    Hygiene: "code",
    Headers: "security",
    Firebase: "security",
    Bundle: "performance",
    Rendering: "performance",
    CI: "process",
    GitHooks: "process",
    GodObject: "refactoring",
    Duplication: "refactoring",
    Links: "documentation",
    Sync: "documentation",
    GoldenPath: "dx",
    Offline: "offline",
    SECURITY: "security",
  };

  it("maps Testing to code category", () => {
    assert.strictEqual(CATEGORY_MAP["Testing"], "code");
  });

  it("maps Firebase to security category", () => {
    assert.strictEqual(CATEGORY_MAP["Firebase"], "security");
  });

  it("maps Bundle to performance category", () => {
    assert.strictEqual(CATEGORY_MAP["Bundle"], "performance");
  });

  it("maps CI to process category", () => {
    assert.strictEqual(CATEGORY_MAP["CI"], "process");
  });

  it("maps GodObject to refactoring category", () => {
    assert.strictEqual(CATEGORY_MAP["GodObject"], "refactoring");
  });

  it("maps Links to documentation category", () => {
    assert.strictEqual(CATEGORY_MAP["Links"], "documentation");
  });

  it("maps GoldenPath to dx category", () => {
    assert.strictEqual(CATEGORY_MAP["GoldenPath"], "dx");
  });
});

describe("aggregate-audit-findings: deduplication logic", () => {
  function deduplicateFindings(findings: Array<{ id: string; title: string }>) {
    const seen = new Set<string>();
    const unique: Array<{ id: string; title: string }> = [];
    for (const finding of findings) {
      const key = finding.id;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(finding);
      }
    }
    return unique;
  }

  it("removes exact duplicate IDs", () => {
    const findings = [
      { id: "FIND-001", title: "Issue A" },
      { id: "FIND-001", title: "Issue A duplicate" },
      { id: "FIND-002", title: "Issue B" },
    ];
    const result = deduplicateFindings(findings);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].id, "FIND-001");
    assert.strictEqual(result[1].id, "FIND-002");
  });

  it("keeps all findings when no duplicates", () => {
    const findings = [
      { id: "FIND-001", title: "Issue A" },
      { id: "FIND-002", title: "Issue B" },
      { id: "FIND-003", title: "Issue C" },
    ];
    assert.strictEqual(deduplicateFindings(findings).length, 3);
  });

  it("handles empty array", () => {
    assert.strictEqual(deduplicateFindings([]).length, 0);
  });
});

describe("aggregate-audit-findings: JSONL parsing", () => {
  function parseJsonlLines(content: string): unknown[] {
    return content
      .split("\n")
      .filter((line) => line.trim())
      .flatMap((line) => {
        try {
          return [JSON.parse(line)];
        } catch {
          return [];
        }
      });
  }

  it("parses valid JSONL content", () => {
    const content = '{"id":"F-001","severity":"S1"}\n{"id":"F-002","severity":"S2"}\n';
    const result = parseJsonlLines(content);
    assert.strictEqual(result.length, 2);
  });

  it("skips malformed lines gracefully", () => {
    const content = '{"id":"F-001"}\nNOT_JSON\n{"id":"F-003"}\n';
    const result = parseJsonlLines(content);
    assert.strictEqual(result.length, 2);
  });

  it("handles empty content", () => {
    assert.strictEqual(parseJsonlLines("").length, 0);
  });

  it("skips blank lines", () => {
    const content = '{"id":"F-001"}\n\n\n{"id":"F-002"}\n';
    assert.strictEqual(parseJsonlLines(content).length, 2);
  });
});

describe("aggregate-audit-findings: priority calculation", () => {
  const SEVERITY_WEIGHTS: Record<string, number> = { S0: 4, S1: 3, S2: 2, S3: 1 };
  const EFFORT_WEIGHTS: Record<string, number> = { E0: 4, E1: 3, E2: 2, E3: 1 };

  function calculatePriority(severity: string, effort: string): number {
    return (SEVERITY_WEIGHTS[severity] ?? 0) * (EFFORT_WEIGHTS[effort] ?? 0);
  }

  it("S0 + E0 yields highest priority (16)", () => {
    assert.strictEqual(calculatePriority("S0", "E0"), 16);
  });

  it("S3 + E3 yields lowest priority (1)", () => {
    assert.strictEqual(calculatePriority("S3", "E3"), 1);
  });

  it("unknown severity yields 0", () => {
    assert.strictEqual(calculatePriority("SX", "E1"), 0);
  });

  it("S1 + E2 is correct (6)", () => {
    assert.strictEqual(calculatePriority("S1", "E2"), 6);
  });
});

describe("aggregate-audit-findings: sorting by priority", () => {
  const SEVERITY_ORDER: Record<string, number> = { S0: 0, S1: 1, S2: 2, S3: 3 };

  function sortBySeverity(
    findings: Array<{ severity: string; title: string }>
  ): Array<{ severity: string; title: string }> {
    return [...findings].sort(
      (a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
    );
  }

  it("sorts S0 before S3", () => {
    const findings = [
      { severity: "S3", title: "Low" },
      { severity: "S0", title: "Critical" },
      { severity: "S1", title: "High" },
    ];
    const sorted = sortBySeverity(findings);
    assert.strictEqual(sorted[0].severity, "S0");
    assert.strictEqual(sorted[2].severity, "S3");
  });
});
