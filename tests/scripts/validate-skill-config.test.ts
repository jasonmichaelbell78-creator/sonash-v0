import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/validate-skill-config.js

describe("validate-skill-config: required fields validation", () => {
  const REQUIRED_SKILL_FIELDS = ["name", "description", "trigger", "version"];

  function validateSkillConfig(config: Record<string, unknown>): string[] {
    return REQUIRED_SKILL_FIELDS.filter((field) => !config[field]);
  }

  it("passes when all required fields present", () => {
    const config = {
      name: "deep-plan",
      description: "Planning skill",
      trigger: "thorough planning",
      version: "1.0",
    };
    assert.strictEqual(validateSkillConfig(config).length, 0);
  });

  it("reports missing name field", () => {
    const config = { description: "Planning skill", trigger: "thorough planning", version: "1.0" };
    assert.ok(validateSkillConfig(config).includes("name"));
  });

  it("reports multiple missing fields", () => {
    const missing = validateSkillConfig({});
    assert.ok(missing.includes("name"));
    assert.ok(missing.includes("description"));
  });
});

describe("validate-skill-config: version format", () => {
  function isValidVersion(version: string): boolean {
    return /^\d+\.\d+(\.\d+)?$/.test(version);
  }

  it("accepts x.y.z format", () => {
    assert.strictEqual(isValidVersion("1.2.3"), true);
  });

  it("accepts x.y format", () => {
    assert.strictEqual(isValidVersion("2.0"), true);
  });

  it("rejects non-version strings", () => {
    assert.strictEqual(isValidVersion("v1.0"), false);
    assert.strictEqual(isValidVersion("latest"), false);
  });
});

describe("validate-skill-config: skill name format", () => {
  function isValidSkillName(name: string): boolean {
    return /^[a-z][a-z0-9-]*$/.test(name);
  }

  it("accepts kebab-case names", () => {
    assert.strictEqual(isValidSkillName("deep-plan"), true);
    assert.strictEqual(isValidSkillName("security-auditor"), true);
  });

  it("rejects names with uppercase", () => {
    assert.strictEqual(isValidSkillName("DeepPlan"), false);
  });

  it("rejects names starting with digit", () => {
    assert.strictEqual(isValidSkillName("1skill"), false);
  });

  it("rejects names with spaces", () => {
    assert.strictEqual(isValidSkillName("my skill"), false);
  });
});

describe("validate-skill-config: config file discovery", () => {
  function isSkillDirectory(dirName: string): boolean {
    return !dirName.startsWith(".") && !dirName.startsWith("_");
  }

  it("accepts normal skill directory names", () => {
    assert.strictEqual(isSkillDirectory("deep-plan"), true);
  });

  it("skips hidden directories", () => {
    assert.strictEqual(isSkillDirectory(".git"), false);
  });

  it("skips private directories", () => {
    assert.strictEqual(isSkillDirectory("_internal"), false);
  });
});
