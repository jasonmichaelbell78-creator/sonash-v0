/**
 * Enforcement test for learning route 3689cfd62f77
 * Pattern: "Audit Findings: Storage: unbounded, no rotation"
 * Verifies that audit findings paths are covered by rotation-policy.json
 */

const { describe, test, before } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROTATION_POLICY_PATH = path.resolve(__dirname, "../../config/rotation-policy.json");

const AUDIT_FINDINGS_PATHS = [
  ".claude/state/audit-findings.jsonl",
  ".claude/state/audit-findings-history.jsonl",
];

describe("3689cfd62f77: Audit findings rotation coverage", () => {
  let policy;

  before(() => {
    try {
      const raw = fs.readFileSync(ROTATION_POLICY_PATH, "utf8");
      policy = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Failed to load rotation policy: ${err.message}`);
    }
  });

  test("rotation-policy.json exists and is valid JSON", () => {
    assert.ok(policy, "policy should be defined");
    assert.ok(policy.tiers, "policy.tiers should be defined");
  });

  test("audit findings paths are listed in a rotation tier", () => {
    const allRotatedFiles = new Set(
      Object.values(policy.tiers).flatMap((tier) => tier.files || [])
    );

    for (const auditPath of AUDIT_FINDINGS_PATHS) {
      assert.ok(allRotatedFiles.has(auditPath), `Expected ${auditPath} to be in rotation policy`);
    }
  });

  test("audit findings tier has maxAgeDays <= 90", () => {
    let found = false;
    for (const [, tier] of Object.entries(policy.tiers)) {
      const hasAuditFiles = AUDIT_FINDINGS_PATHS.some((p) => (tier.files || []).includes(p));
      if (hasAuditFiles) {
        assert.ok(tier.maxAgeDays <= 90, `maxAgeDays should be <= 90, got ${tier.maxAgeDays}`);
        found = true;
        break;
      }
    }
    assert.ok(found, "No rotation tier contains audit findings paths");
  });
});
