import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/validate-audit.js

const REQUIRED_FIELDS_BY_SEVERITY: Record<string, string[]> = {
  S0: [
    "id",
    "category",
    "severity",
    "file",
    "line",
    "title",
    "description",
    "recommendation",
    "evidence",
    "confidence",
  ],
  S1: [
    "id",
    "category",
    "severity",
    "file",
    "line",
    "title",
    "description",
    "recommendation",
    "evidence",
    "confidence",
  ],
  S2: ["id", "category", "severity", "file", "line", "title", "description", "recommendation"],
  S3: ["id", "category", "severity", "title", "description"],
};

const VALID_CONFIDENCES = new Set(["HIGH", "MEDIUM", "LOW"]);

const VALID_TOOL_CONFIRMATIONS = new Set([
  "eslint",
  "sonarcloud",
  "npm_audit",
  "patterns_check",
  "typescript",
  "NONE",
]);

function validateRequiredFields(finding: Record<string, unknown>): string[] {
  const severity = finding["severity"] as string;
  const required = REQUIRED_FIELDS_BY_SEVERITY[severity] ?? REQUIRED_FIELDS_BY_SEVERITY["S3"];
  return required.filter((field) => !finding[field] && finding[field] !== 0);
}

function parseAuditJsonl(content: string): Array<{ _lineNumber: number; [key: string]: unknown }> {
  return content
    .split("\n")
    .filter((line) => line.trim())
    .map((line, index) => {
      try {
        return { ...JSON.parse(line), _lineNumber: index + 1 };
      } catch (err) {
        return {
          _parseError: err instanceof Error ? err.message : String(err),
          _lineNumber: index + 1,
          _raw: line,
        };
      }
    });
}

interface FalsePositive {
  id: string;
  file: string;
  rule?: string;
}

interface Finding {
  id: string;
  file: string;
}

function isFalsePositive(finding: Finding, falsePositives: FalsePositive[]): boolean {
  return falsePositives.some((fp) => fp.id === finding.id && fp.file === finding.file);
}

describe("validate-audit: REQUIRED_FIELDS_BY_SEVERITY", () => {
  it("S0 requires evidence and confidence", () => {
    assert.ok(REQUIRED_FIELDS_BY_SEVERITY["S0"].includes("evidence"));
    assert.ok(REQUIRED_FIELDS_BY_SEVERITY["S0"].includes("confidence"));
  });

  it("S3 does not require file or line", () => {
    assert.ok(!REQUIRED_FIELDS_BY_SEVERITY["S3"].includes("file"));
    assert.ok(!REQUIRED_FIELDS_BY_SEVERITY["S3"].includes("line"));
  });

  it("S2 requires file and line", () => {
    assert.ok(REQUIRED_FIELDS_BY_SEVERITY["S2"].includes("file"));
    assert.ok(REQUIRED_FIELDS_BY_SEVERITY["S2"].includes("line"));
  });

  it("S1 requires same fields as S0", () => {
    assert.deepStrictEqual(REQUIRED_FIELDS_BY_SEVERITY["S0"], REQUIRED_FIELDS_BY_SEVERITY["S1"]);
  });
});

describe("validate-audit: VALID_CONFIDENCES", () => {
  it("accepts HIGH confidence", () => {
    assert.ok(VALID_CONFIDENCES.has("HIGH"));
  });

  it("rejects VERY_HIGH confidence", () => {
    assert.ok(!VALID_CONFIDENCES.has("VERY_HIGH"));
  });

  it("rejects lowercase confidence values", () => {
    assert.ok(!VALID_CONFIDENCES.has("high"));
  });
});

describe("validate-audit: VALID_TOOL_CONFIRMATIONS", () => {
  it("accepts eslint as valid tool", () => {
    assert.ok(VALID_TOOL_CONFIRMATIONS.has("eslint"));
  });

  it("accepts NONE as valid", () => {
    assert.ok(VALID_TOOL_CONFIRMATIONS.has("NONE"));
  });

  it("rejects unknown tool names", () => {
    assert.ok(!VALID_TOOL_CONFIRMATIONS.has("jest"));
  });
});

describe("validate-audit: field validation logic", () => {
  it("returns no missing fields for complete S0 finding", () => {
    const finding = {
      id: "FIND-001",
      category: "security",
      severity: "S0",
      file: "src/auth.ts",
      line: 42,
      title: "SQL Injection",
      description: "Unsanitized input",
      recommendation: "Use parameterized queries",
      evidence: "code snippet",
      confidence: "HIGH",
    };
    assert.strictEqual(validateRequiredFields(finding).length, 0);
  });

  it("reports missing evidence for S0 finding", () => {
    const finding = {
      id: "FIND-001",
      category: "security",
      severity: "S0",
      file: "src/auth.ts",
      line: 42,
      title: "SQL Injection",
      description: "Unsanitized input",
      recommendation: "Use parameterized queries",
      confidence: "HIGH",
    };
    const missing = validateRequiredFields(finding);
    assert.ok(missing.includes("evidence"));
  });

  it("accepts S3 finding without file/line", () => {
    const finding = {
      id: "FIND-003",
      category: "documentation",
      severity: "S3",
      title: "Missing docs",
      description: "Doc gap",
    };
    assert.strictEqual(validateRequiredFields(finding).length, 0);
  });
});

describe("validate-audit: JSONL loading", () => {
  it("parses valid JSONL with line numbers", () => {
    const content = '{"id":"F-001","severity":"S1"}\n{"id":"F-002","severity":"S2"}';
    const results = parseAuditJsonl(content);
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0]._lineNumber, 1);
    assert.strictEqual(results[1]._lineNumber, 2);
  });

  it("marks malformed lines with _parseError", () => {
    const content = '{"id":"F-001"}\nINVALID\n{"id":"F-003"}';
    const results = parseAuditJsonl(content);
    assert.ok("_parseError" in results[1]);
  });
});

describe("validate-audit: false positive matching", () => {
  it("matches known false positive", () => {
    const fp: FalsePositive = { id: "FIND-001", file: "src/legacy.ts" };
    const finding: Finding = { id: "FIND-001", file: "src/legacy.ts" };
    assert.strictEqual(isFalsePositive(finding, [fp]), true);
  });

  it("does not match different file", () => {
    const fp: FalsePositive = { id: "FIND-001", file: "src/legacy.ts" };
    const finding: Finding = { id: "FIND-001", file: "src/other.ts" };
    assert.strictEqual(isFalsePositive(finding, [fp]), false);
  });

  it("returns false when no false positives loaded", () => {
    const finding: Finding = { id: "FIND-001", file: "src/auth.ts" };
    assert.strictEqual(isFalsePositive(finding, []), false);
  });
});
