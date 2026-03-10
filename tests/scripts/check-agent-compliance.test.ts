import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-agent-compliance.js

describe("check-agent-compliance: agent trigger detection", () => {
  const AGENT_TRIGGERS = [
    { pattern: /thorough planning/i, required: "deep-plan" },
    { pattern: /bug|error|unexpected behavior/i, required: "systematic-debugging" },
    { pattern: /unfamiliar code/i, required: "Explore" },
    { pattern: /security|auth/i, required: "security-auditor" },
    { pattern: /new documentation/i, required: "documentation-expert" },
  ];

  function checkCompliance(prompt: string): string[] {
    return AGENT_TRIGGERS.filter((t) => t.pattern.test(prompt)).map((t) => t.required);
  }

  it("requires systematic-debugging for bug reports", () => {
    const required = checkCompliance("There is a bug in the payment module");
    assert.ok(required.includes("systematic-debugging"));
  });

  it("requires security-auditor for auth changes", () => {
    const required = checkCompliance("Update authentication flow");
    assert.ok(required.includes("security-auditor"));
  });

  it("requires deep-plan for thorough planning", () => {
    const required = checkCompliance("Thorough planning requested for refactor");
    assert.ok(required.includes("deep-plan"));
  });

  it("returns empty for non-trigger prompts", () => {
    const required = checkCompliance("Fix typo in README");
    assert.strictEqual(required.length, 0);
  });
});

describe("check-agent-compliance: compliance report structure", () => {
  function buildComplianceReport(
    violations: Array<{ trigger: string; required: string; found: boolean }>
  ): { compliant: boolean; violations: typeof violations } {
    return {
      compliant: violations.every((v) => v.found),
      violations,
    };
  }

  it("marks compliant when all agents found", () => {
    const violations = [{ trigger: "bug", required: "systematic-debugging", found: true }];
    const report = buildComplianceReport(violations);
    assert.strictEqual(report.compliant, true);
  });

  it("marks non-compliant when agent missing", () => {
    const violations = [{ trigger: "bug", required: "systematic-debugging", found: false }];
    const report = buildComplianceReport(violations);
    assert.strictEqual(report.compliant, false);
  });
});
