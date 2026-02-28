/**
 * Contract: Promotion -> Auto-Generated Enforcement Rules
 *
 * Validates that auto-generated rules have the required structure
 * for enforcement mechanisms (semgrep, eslint, regex).
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { z } from "zod";

/**
 * Inline EnforcementRule shape -- will be formalized in Phase 5.
 * Represents an auto-generated rule derived from recurring patterns.
 */
const EnforcementRule = z.object({
  pattern_id: z.string().min(1),
  rule_type: z.enum(["semgrep", "eslint", "regex"]),
  rule_content: z.string().min(1),
  auto_generated: z.boolean(),
  source_promotion: z.string().optional(),
  created_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  description: z.string().optional(),
  severity: z.enum(["error", "warning", "info"]).optional(),
});

describe("Contract: Promotion -> Enforcement Rules", () => {
  test("valid semgrep rule can be constructed", () => {
    const rule = EnforcementRule.parse({
      pattern_id: "error-sanitization",
      rule_type: "semgrep",
      rule_content: "pattern: console.log($ERR.message)",
      auto_generated: true,
      source_promotion: "promo-2025-0601-001",
      created_date: "2025-06-01",
      description: "Prevent logging raw error messages",
      severity: "error",
    });

    assert.equal(rule.pattern_id, "error-sanitization");
    assert.equal(rule.rule_type, "semgrep");
    assert.equal(rule.auto_generated, true);
  });

  test("valid eslint rule can be constructed", () => {
    const rule = EnforcementRule.parse({
      pattern_id: "missing-try-catch",
      rule_type: "eslint",
      rule_content: JSON.stringify({ rules: { "no-floating-promises": "error" } }),
      auto_generated: true,
    });

    assert.equal(rule.rule_type, "eslint");
    assert.ok(rule.rule_content.length > 0);
  });

  test("valid regex rule can be constructed", () => {
    const rule = EnforcementRule.parse({
      pattern_id: "path-traversal-check",
      rule_type: "regex",
      rule_content: "startsWith\\('\\.\\.'\\)",
      auto_generated: true,
      description: "Detect insecure path traversal checks",
      severity: "warning",
    });

    assert.equal(rule.rule_type, "regex");
  });

  test("rule_type enum rejects invalid mechanisms", () => {
    assert.throws(() =>
      EnforcementRule.parse({
        pattern_id: "test",
        rule_type: "custom-checker",
        rule_content: "test",
        auto_generated: true,
      })
    );
  });

  test("auto_generated must be boolean", () => {
    assert.throws(() =>
      EnforcementRule.parse({
        pattern_id: "test",
        rule_type: "eslint",
        rule_content: "test",
        auto_generated: "yes",
      })
    );
  });

  test("rule with only required fields is valid", () => {
    const rule = EnforcementRule.parse({
      pattern_id: "minimal-rule",
      rule_type: "regex",
      rule_content: "TODO|FIXME",
      auto_generated: false,
    });

    assert.equal(rule.source_promotion, undefined);
    assert.equal(rule.created_date, undefined);
    assert.equal(rule.description, undefined);
    assert.equal(rule.severity, undefined);
  });

  test("severity enum only allows valid levels", () => {
    for (const sev of ["error", "warning", "info"]) {
      assert.doesNotThrow(() =>
        EnforcementRule.parse({
          pattern_id: "test",
          rule_type: "eslint",
          rule_content: "test",
          auto_generated: true,
          severity: sev,
        })
      );
    }

    assert.throws(() =>
      EnforcementRule.parse({
        pattern_id: "test",
        rule_type: "eslint",
        rule_content: "test",
        auto_generated: true,
        severity: "critical",
      })
    );
  });
});
