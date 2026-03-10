import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

// Re-implements core logic from scripts/generate-detailed-sonar-report.js (medium template)

const PROJECT_ROOT = "/project/root";

function resolveProjectPath(relativeFilePath: string, projectRoot: string): string {
  if (relativeFilePath.includes("\0")) {
    throw new Error("Refusing to read path with null byte");
  }
  const abs = path.resolve(projectRoot, relativeFilePath);
  const rel = path.relative(projectRoot, abs);
  if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
    throw new Error(`Refusing to read outside project root: ${relativeFilePath}`);
  }
  return abs;
}

function parseSonarProperties(content: string): { org: string | null; project: string | null } {
  const result: { org: string | null; project: string | null } = { org: null, project: null };
  const props: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    props[key.trim()] = rest.join("=").trim();
  }
  result.org = props["sonar.organization"] ?? null;
  const projectKey = props["sonar.projectKey"];
  if (projectKey && result.org && projectKey.startsWith(result.org + "_")) {
    result.project = projectKey.substring(result.org.length + 1);
  } else if (projectKey) {
    result.project = projectKey;
  }
  return result;
}

function isPathTraversal(rel: string): boolean {
  return rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel);
}

describe("generate-detailed-sonar-report: resolveProjectPath", () => {
  it("resolves path within project root", () => {
    const result = resolveProjectPath("src/app.ts", PROJECT_ROOT);
    assert.ok(result.includes("app.ts"));
  });

  it("rejects path with null byte", () => {
    assert.throws(() => resolveProjectPath("src/\0malicious", PROJECT_ROOT), /null byte/);
  });

  it("rejects path escaping project root", () => {
    assert.throws(
      () => resolveProjectPath("../../etc/passwd", PROJECT_ROOT),
      /Refusing to read outside project root/
    );
  });
});

describe("generate-detailed-sonar-report: readSonarProperties", () => {
  it("parses organization and project key", () => {
    const content = "sonar.organization=myorg\nsonar.projectKey=myorg_myproject";
    const result = parseSonarProperties(content);
    assert.strictEqual(result.org, "myorg");
    assert.strictEqual(result.project, "myproject");
  });

  it("handles missing organization", () => {
    const content = "sonar.projectKey=myproject";
    const result = parseSonarProperties(content);
    assert.strictEqual(result.org, null);
    assert.strictEqual(result.project, "myproject");
  });

  it("ignores comment lines", () => {
    const content = "# This is a comment\nsonar.organization=myorg";
    const result = parseSonarProperties(content);
    assert.strictEqual(result.org, "myorg");
  });

  it("handles empty content", () => {
    const result = parseSonarProperties("");
    assert.strictEqual(result.org, null);
    assert.strictEqual(result.project, null);
  });
});

describe("generate-detailed-sonar-report: path containment regex", () => {
  it("flags project root itself (empty rel)", () => {
    assert.strictEqual(isPathTraversal(""), true);
  });

  it("flags ../escape", () => {
    assert.strictEqual(isPathTraversal("../etc"), true);
  });

  it("flags absolute paths", () => {
    assert.strictEqual(isPathTraversal("/etc/passwd"), true);
  });

  it("allows normal relative path", () => {
    assert.strictEqual(isPathTraversal("src/app.ts"), false);
  });
});
