/**
 * Enforcement test for learning route 3689cfd62f77
 * Pattern: "Audit Findings: Storage: unbounded, no rotation"
 * Verifies that audit findings paths are covered by rotation-policy.json
 */

/* global describe, beforeAll, test, expect */
const fs = require("fs");
const path = require("path");

const ROTATION_POLICY_PATH = path.resolve(__dirname, "../../config/rotation-policy.json");

const AUDIT_FINDINGS_PATHS = [
  ".claude/state/audit-findings.jsonl",
  ".claude/state/audit-findings-history.jsonl",
];

describe("3689cfd62f77: Audit findings rotation coverage", () => {
  let policy;

  beforeAll(() => {
    const raw = fs.readFileSync(ROTATION_POLICY_PATH, "utf8");
    policy = JSON.parse(raw);
  });

  test("rotation-policy.json exists and is valid JSON", () => {
    expect(policy).toBeDefined();
    expect(policy.tiers).toBeDefined();
  });

  test("audit findings paths are listed in a rotation tier", () => {
    // Collect all files from all tiers
    const allRotatedFiles = Object.values(policy.tiers).flatMap((tier) => tier.files || []);

    for (const auditPath of AUDIT_FINDINGS_PATHS) {
      expect(allRotatedFiles).toContain(auditPath);
    }
  });

  test("audit findings tier has maxAgeDays <= 90", () => {
    // Find which tier contains the audit findings
    for (const [tierName, tier] of Object.entries(policy.tiers)) {
      const hasAuditFiles = AUDIT_FINDINGS_PATHS.some((p) => (tier.files || []).includes(p));
      if (hasAuditFiles) {
        expect(tier.maxAgeDays).toBeLessThanOrEqual(90);
        return;
      }
    }
    // If we reach here, no tier contains audit findings
    throw new Error("No rotation tier contains audit findings paths");
  });
});
