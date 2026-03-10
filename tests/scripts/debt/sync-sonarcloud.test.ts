/**
 * Unit tests for sync-sonarcloud.js
 *
 * Tests: operator ID generation, sonar properties parsing, severity/type
 * mapping, file path normalization, arg parsing, DEBT ID sequencing,
 * API auth headers, and response pagination logic re-implemented inline.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

// ─── getOperatorId logic ─────────────────────────────────────────────────────

function getOperatorId(username: string, isCI: boolean, logPii: boolean): string {
  if (isCI) return "ci";
  if (logPii) return username;
  return crypto.createHash("sha256").update(username).digest("hex").slice(0, 12);
}

describe("getOperatorId", () => {
  it("returns 'ci' when in CI environment", () => {
    assert.equal(getOperatorId("alice", true, false), "ci");
  });

  it("returns raw username when LOG_OPERATOR_PII is true", () => {
    assert.equal(getOperatorId("alice", false, true), "alice");
  });

  it("returns 12-char SHA-256 hash prefix for normal user", () => {
    const result = getOperatorId("alice", false, false);
    assert.equal(result.length, 12);
    assert.match(result, /^[0-9a-f]+$/);
  });

  it("produces consistent hash for same input", () => {
    const a = getOperatorId("bob", false, false);
    const b = getOperatorId("bob", false, false);
    assert.equal(a, b);
  });

  it("produces different hashes for different users", () => {
    const a = getOperatorId("alice", false, false);
    const b = getOperatorId("bob", false, false);
    assert.notEqual(a, b);
  });
});

// ─── readSonarProperties logic ────────────────────────────────────────────────

function parseSonarProperties(content: string): { org: string | null; project: string | null } {
  const result: { org: string | null; project: string | null } = { org: null, project: null };
  const props: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    props[key.trim()] = rest.join("=").trim();
  }
  result.org = props["sonar.organization"] || null;
  const projectKey = props["sonar.projectKey"];
  if (projectKey && result.org && projectKey.startsWith(result.org + "_")) {
    result.project = projectKey.substring(result.org.length + 1);
  } else if (projectKey) {
    result.project = projectKey;
  }
  return result;
}

describe("parseSonarProperties", () => {
  it("extracts org and project from standard properties file", () => {
    const content = `sonar.organization=myorg\nsonar.projectKey=myorg_myproject\n`;
    const result = parseSonarProperties(content);
    assert.equal(result.org, "myorg");
    assert.equal(result.project, "myproject");
  });

  it("ignores comment lines starting with #", () => {
    const content = `# This is a comment\nsonar.organization=acme\nsonar.projectKey=acme_app\n`;
    const result = parseSonarProperties(content);
    assert.equal(result.org, "acme");
    assert.equal(result.project, "app");
  });

  it("uses full projectKey when org prefix not found", () => {
    const content = `sonar.organization=acme\nsonar.projectKey=other-key\n`;
    const result = parseSonarProperties(content);
    assert.equal(result.project, "other-key");
  });

  it("returns nulls for empty content", () => {
    const result = parseSonarProperties("");
    assert.equal(result.org, null);
    assert.equal(result.project, null);
  });

  it("handles lines with multiple = signs", () => {
    const content = `sonar.organization=my=org\nsonar.projectKey=my=org_proj\n`;
    const result = parseSonarProperties(content);
    assert.equal(result.org, "my=org");
  });
});

// ─── Severity mapping ─────────────────────────────────────────────────────────

const SEVERITY_MAP: Record<string, string> = {
  BLOCKER: "S0",
  CRITICAL: "S0",
  MAJOR: "S1",
  MINOR: "S2",
  INFO: "S3",
};

describe("SEVERITY_MAP", () => {
  it("maps BLOCKER to S0", () => assert.equal(SEVERITY_MAP["BLOCKER"], "S0"));
  it("maps CRITICAL to S0", () => assert.equal(SEVERITY_MAP["CRITICAL"], "S0"));
  it("maps MAJOR to S1", () => assert.equal(SEVERITY_MAP["MAJOR"], "S1"));
  it("maps MINOR to S2", () => assert.equal(SEVERITY_MAP["MINOR"], "S2"));
  it("maps INFO to S3", () => assert.equal(SEVERITY_MAP["INFO"], "S3"));
  it("returns undefined for unknown severity", () =>
    assert.equal(SEVERITY_MAP["UNKNOWN"], undefined));
});

// ─── Type mapping ─────────────────────────────────────────────────────────────

const TYPE_MAP: Record<string, string> = {
  BUG: "bug",
  VULNERABILITY: "vulnerability",
  CODE_SMELL: "code-smell",
  SECURITY_HOTSPOT: "hotspot",
};

describe("TYPE_MAP", () => {
  it("maps BUG to bug", () => assert.equal(TYPE_MAP["BUG"], "bug"));
  it("maps VULNERABILITY to vulnerability", () =>
    assert.equal(TYPE_MAP["VULNERABILITY"], "vulnerability"));
  it("maps CODE_SMELL to code-smell", () => assert.equal(TYPE_MAP["CODE_SMELL"], "code-smell"));
  it("maps SECURITY_HOTSPOT to hotspot", () =>
    assert.equal(TYPE_MAP["SECURITY_HOTSPOT"], "hotspot"));
});

// ─── mapCategory ─────────────────────────────────────────────────────────────

function mapCategory(issue: { rule?: string; tags?: string[] }): string {
  const rule = issue.rule || "";
  const tags = issue.tags || [];
  if (tags.includes("security") || rule.includes("security")) return "security";
  if (tags.includes("performance") || rule.includes("performance")) return "performance";
  if (tags.includes("documentation")) return "documentation";
  return "code-quality";
}

describe("mapCategory", () => {
  it("returns 'security' for security tag", () => {
    assert.equal(mapCategory({ tags: ["security"] }), "security");
  });

  it("returns 'security' for security in rule", () => {
    assert.equal(mapCategory({ rule: "squid:security-check" }), "security");
  });

  it("returns 'performance' for performance tag", () => {
    assert.equal(mapCategory({ tags: ["performance"] }), "performance");
  });

  it("returns 'documentation' for documentation tag", () => {
    assert.equal(mapCategory({ tags: ["documentation"] }), "documentation");
  });

  it("defaults to 'code-quality' for no matching tags", () => {
    assert.equal(mapCategory({}), "code-quality");
  });

  it("prefers security over performance when both present", () => {
    assert.equal(mapCategory({ tags: ["security", "performance"] }), "security");
  });
});

// ─── normalizeFilePath (SonarCloud component path) ────────────────────────────

function normalizeFilePath(component: string): string {
  if (!component) return "";
  const parts = component.split(":");
  return parts[parts.length - 1] || "";
}

describe("normalizeFilePath (sonarcloud component)", () => {
  it("extracts last segment after colons", () => {
    assert.equal(normalizeFilePath("org:project:src/api/users.ts"), "src/api/users.ts");
  });

  it("handles single segment with no colons", () => {
    assert.equal(normalizeFilePath("src/file.ts"), "src/file.ts");
  });

  it("returns empty string for empty input", () => {
    assert.equal(normalizeFilePath(""), "");
  });

  it("handles trailing colon", () => {
    assert.equal(normalizeFilePath("org:project:"), "");
  });
});

// ─── getNextDebtId ────────────────────────────────────────────────────────────

function getNextDebtId(existingItems: Array<{ id?: string }>): number {
  let maxId = 0;
  for (const item of existingItems) {
    if (item.id) {
      const match = item.id.match(/DEBT-(\d+)/);
      if (match) {
        const num = Number.parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    }
  }
  return maxId + 1;
}

describe("getNextDebtId", () => {
  it("returns 1 for empty list", () => {
    assert.equal(getNextDebtId([]), 1);
  });

  it("returns max+1 from existing items", () => {
    assert.equal(getNextDebtId([{ id: "DEBT-0005" }, { id: "DEBT-0012" }]), 13);
  });

  it("ignores items without DEBT- format", () => {
    assert.equal(getNextDebtId([{ id: "CANON-0001" }, { id: "DEBT-0003" }]), 4);
  });

  it("handles items with no id field", () => {
    assert.equal(getNextDebtId([{}, { id: "DEBT-0002" }]), 3);
  });
});

// ─── parseArgs ────────────────────────────────────────────────────────────────

function parseArgs(args: string[]): Record<string, string | boolean> {
  const parsed: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--force") {
      parsed.force = true;
    } else if (arg === "--resolve") {
      parsed.resolve = true;
    } else if (arg === "--full") {
      parsed.full = true;
    } else if (arg.startsWith("--")) {
      const key = arg.substring(2);
      const value = args[i + 1];
      if (value && !value.startsWith("--")) {
        parsed[key] = args[++i];
      }
    }
  }
  return parsed;
}

describe("parseArgs (sync-sonarcloud)", () => {
  it("sets dryRun flag", () => {
    assert.equal(parseArgs(["--dry-run"]).dryRun, true);
  });

  it("sets force flag", () => {
    assert.equal(parseArgs(["--force"]).force, true);
  });

  it("sets resolve flag", () => {
    assert.equal(parseArgs(["--resolve"]).resolve, true);
  });

  it("sets full flag", () => {
    assert.equal(parseArgs(["--full"]).full, true);
  });

  it("captures --severity value", () => {
    assert.equal(parseArgs(["--severity", "BLOCKER,CRITICAL"]).severity, "BLOCKER,CRITICAL");
  });

  it("captures --project value", () => {
    assert.equal(parseArgs(["--project", "myproject"]).project, "myproject");
  });

  it("does not capture dangling flag values", () => {
    const result = parseArgs(["--severity", "--dry-run"]);
    assert.equal(result.dryRun, true);
    assert.equal(result.severity, undefined);
  });

  it("handles combined flags", () => {
    const result = parseArgs(["--dry-run", "--severity", "MAJOR", "--force"]);
    assert.equal(result.dryRun, true);
    assert.equal(result.severity, "MAJOR");
    assert.equal(result.force, true);
  });
});

// ─── buildAuthHeaders ─────────────────────────────────────────────────────────

function buildAuthHeaders(token: string): { Authorization: string } {
  if (typeof token !== "string" || token.trim() === "") {
    throw new Error("Missing SonarCloud token");
  }
  return { Authorization: `Basic ${Buffer.from(token + ":").toString("base64")}` };
}

describe("buildAuthHeaders", () => {
  it("produces Basic auth header from token", () => {
    const headers = buildAuthHeaders("mytoken");
    assert.match(headers.Authorization, /^Basic /);
    const decoded = Buffer.from(headers.Authorization.slice(6), "base64").toString("utf8");
    assert.equal(decoded, "mytoken:");
  });

  it("throws for empty string token", () => {
    assert.throws(() => buildAuthHeaders(""), /Missing SonarCloud token/);
  });

  it("throws for whitespace-only token", () => {
    assert.throws(() => buildAuthHeaders("   "), /Missing SonarCloud token/);
  });

  it("different tokens produce different headers", () => {
    const h1 = buildAuthHeaders("tokenA");
    const h2 = buildAuthHeaders("tokenB");
    assert.notEqual(h1.Authorization, h2.Authorization);
  });
});

// ─── JSONL parsing safety ─────────────────────────────────────────────────────

function parseMasterDebt(content: string): Array<Record<string, unknown>> {
  const lines = content.split("\n").filter((l) => l.trim());
  const items: Array<Record<string, unknown>> = [];
  for (const line of lines) {
    try {
      items.push(JSON.parse(line));
    } catch {
      // skip
    }
  }
  return items;
}

describe("parseMasterDebt (JSONL parsing)", () => {
  it("parses valid JSONL lines", () => {
    const content = `{"id":"DEBT-0001","title":"A"}\n{"id":"DEBT-0002","title":"B"}`;
    const items = parseMasterDebt(content);
    assert.equal(items.length, 2);
    assert.equal(items[0].id, "DEBT-0001");
  });

  it("skips malformed lines without throwing", () => {
    const content = `{"id":"DEBT-0001"}\nNOT JSON\n{"id":"DEBT-0002"}`;
    const items = parseMasterDebt(content);
    assert.equal(items.length, 2);
  });

  it("handles empty content", () => {
    assert.deepEqual(parseMasterDebt(""), []);
  });

  it("handles trailing newlines", () => {
    const content = `{"id":"DEBT-0001"}\n\n\n`;
    const items = parseMasterDebt(content);
    assert.equal(items.length, 1);
  });
});
