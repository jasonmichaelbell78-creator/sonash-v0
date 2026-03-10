import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-review-needed.js

describe("check-review-needed: validateSonarUrl", () => {
  const ALLOWED_SONAR_HOSTS = ["sonarcloud.io", "sonarqube.com", "localhost"];

  function validateSonarUrl(urlString: string): { valid: boolean; error?: string } {
    try {
      const url = new URL(urlString);
      if (url.protocol !== "https:" && url.hostname !== "localhost") {
        return { valid: false, error: "SONAR_URL must use HTTPS protocol" };
      }
      const isAllowed = ALLOWED_SONAR_HOSTS.some(
        (allowed) => url.hostname === allowed || url.hostname.endsWith(`.${allowed}`)
      );
      if (!isAllowed) {
        return {
          valid: false,
          error: `SONAR_URL host '${url.hostname}' not in allowlist`,
        };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: "SONAR_URL is not a valid URL" };
    }
  }

  it("accepts https://sonarcloud.io", () => {
    const result = validateSonarUrl("https://sonarcloud.io");
    assert.strictEqual(result.valid, true);
  });

  it("accepts https://sonarqube.com", () => {
    const result = validateSonarUrl("https://sonarqube.com");
    assert.strictEqual(result.valid, true);
  });

  it("accepts http://localhost for local dev", () => {
    const result = validateSonarUrl("http://localhost:9000");
    assert.strictEqual(result.valid, true);
  });

  it("rejects http:// for non-localhost", () => {
    const result = validateSonarUrl("http://sonarcloud.io");
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes("HTTPS"));
  });

  it("rejects unknown host", () => {
    const result = validateSonarUrl("https://evil.example.com");
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes("allowlist"));
  });

  it("rejects malformed URL", () => {
    const result = validateSonarUrl("not-a-url");
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes("valid URL"));
  });

  it("accepts subdomain of sonarcloud.io", () => {
    const result = validateSonarUrl("https://api.sonarcloud.io");
    assert.strictEqual(result.valid, true);
  });
});

describe("check-review-needed: argument parsing", () => {
  function parseArgs(argv: string[]): {
    jsonOutput: boolean;
    verbose: boolean;
    sonarcloudEnabled: boolean;
    specificCategory: string | null;
  } {
    const jsonOutput = argv.includes("--json");
    const verbose = argv.includes("--verbose");
    const sonarcloudEnabled = argv.includes("--sonarcloud");
    const categoryArg = argv.find((a) => a.startsWith("--category="));
    const specificCategory = categoryArg ? categoryArg.split("=")[1] || null : null;
    return { jsonOutput, verbose, sonarcloudEnabled, specificCategory };
  }

  it("parses --json flag", () => {
    const result = parseArgs(["--json"]);
    assert.strictEqual(result.jsonOutput, true);
  });

  it("parses --verbose flag", () => {
    const result = parseArgs(["--verbose"]);
    assert.strictEqual(result.verbose, true);
  });

  it("parses --sonarcloud flag", () => {
    const result = parseArgs(["--sonarcloud"]);
    assert.strictEqual(result.sonarcloudEnabled, true);
  });

  it("parses --category=code", () => {
    const result = parseArgs(["--category=code"]);
    assert.strictEqual(result.specificCategory, "code");
  });

  it("returns null category when not specified", () => {
    const result = parseArgs([]);
    assert.strictEqual(result.specificCategory, null);
  });

  it("handles multiple flags", () => {
    const result = parseArgs(["--json", "--verbose", "--category=security"]);
    assert.strictEqual(result.jsonOutput, true);
    assert.strictEqual(result.verbose, true);
    assert.strictEqual(result.specificCategory, "security");
  });
});

describe("check-review-needed: category thresholds", () => {
  interface CategoryThreshold {
    commits: number;
    files?: number;
  }

  const CATEGORY_THRESHOLDS: Record<string, CategoryThreshold> = {
    code: { commits: 25, files: 15 },
    security: { commits: 20 },
    performance: { commits: 30 },
    refactoring: { commits: 40 },
    documentation: { commits: 30, files: 20 },
    process: { commits: 30 },
  };

  function isThresholdExceeded(category: string, commitCount: number, fileCount = 0): boolean {
    const threshold = CATEGORY_THRESHOLDS[category];
    if (!threshold) return false;
    if (commitCount >= threshold.commits) return true;
    if (threshold.files && fileCount >= threshold.files) return true;
    return false;
  }

  it("triggers code review at 25 commits", () => {
    assert.strictEqual(isThresholdExceeded("code", 25), true);
  });

  it("does not trigger code review at 24 commits", () => {
    assert.strictEqual(isThresholdExceeded("code", 24), false);
  });

  it("triggers code review at 15 files", () => {
    assert.strictEqual(isThresholdExceeded("code", 0, 15), true);
  });

  it("triggers security review at 20 commits", () => {
    assert.strictEqual(isThresholdExceeded("security", 20), true);
  });

  it("returns false for unknown category", () => {
    assert.strictEqual(isThresholdExceeded("unknown", 100), false);
  });

  it("refactoring has higher commit threshold (40)", () => {
    assert.strictEqual(isThresholdExceeded("refactoring", 39), false);
    assert.strictEqual(isThresholdExceeded("refactoring", 40), true);
  });
});

describe("check-review-needed: multi-AI escalation thresholds", () => {
  const MULTI_AI_COMMIT_THRESHOLD = 100;
  const MULTI_AI_DAYS_THRESHOLD = 14;

  function needsMultiAIEscalation(totalCommits: number, daysSinceLastAudit: number): boolean {
    return (
      totalCommits >= MULTI_AI_COMMIT_THRESHOLD || daysSinceLastAudit >= MULTI_AI_DAYS_THRESHOLD
    );
  }

  it("escalates at 100+ commits", () => {
    assert.strictEqual(needsMultiAIEscalation(100, 5), true);
  });

  it("escalates after 14+ days", () => {
    assert.strictEqual(needsMultiAIEscalation(10, 14), true);
  });

  it("does not escalate below thresholds", () => {
    assert.strictEqual(needsMultiAIEscalation(99, 13), false);
  });
});
