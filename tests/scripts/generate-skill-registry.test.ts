import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/generate-skill-registry.js

function findFrontmatterEnd(content: string): number {
  const endLF = content.indexOf("\n---", 3);
  const endCRLF = content.indexOf("\r\n---", 3);
  if (endLF === -1) return endCRLF;
  if (endCRLF === -1) return endLF;
  return Math.min(endLF, endCRLF);
}

function parseFrontmatter(content: string): Record<string, string> | null {
  if (!content.startsWith("---")) return null;
  const end = findFrontmatterEnd(content);
  if (end === -1) return null;

  const fm = content.slice(3, end);
  const result: Record<string, string> = {};
  for (const line of fm.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---") continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const rawValue = trimmed.slice(colonIdx + 1).trim();
    const value =
      rawValue === "|" || rawValue === ">" || rawValue === ">-" || rawValue === "" ? "" : rawValue;
    if (key && value) result[key] = value;
  }
  return Object.keys(result).length > 0 ? result : null;
}

function buildSkillEntry(
  name: string,
  source: string,
  frontmatter: Record<string, string> | null
): object {
  const base: Record<string, string> = { name, source };
  if (frontmatter) {
    Object.assign(base, frontmatter);
  }
  return base;
}

describe("generate-skill-registry: parseFrontmatter", () => {
  it("parses basic frontmatter", () => {
    const content = "---\nname: deep-plan\nversion: 1.0\n---\n# Content";
    const fm = parseFrontmatter(content);
    assert.ok(fm !== null);
    assert.strictEqual(fm["name"], "deep-plan");
    assert.strictEqual(fm["version"], "1.0");
  });

  it("returns null when no frontmatter", () => {
    assert.strictEqual(parseFrontmatter("# No frontmatter"), null);
  });

  it("returns null when frontmatter not closed", () => {
    assert.strictEqual(parseFrontmatter("---\nname: test\n"), null);
  });

  it("ignores YAML block scalars (| and >)", () => {
    const content = "---\nname: test\ndescription: |\n---\n";
    const fm = parseFrontmatter(content);
    // description value is block scalar indicator - not stored
    assert.ok(!fm?.["description"]);
  });

  it("handles CRLF line endings", () => {
    const content = "---\r\nname: test\r\nversion: 2.0\r\n---\r\n";
    const fm = parseFrontmatter(content);
    assert.ok(fm !== null);
    assert.strictEqual(fm["name"], "test");
  });
});

describe("generate-skill-registry: skill entry structure", () => {
  it("builds entry with frontmatter fields", () => {
    const entry = buildSkillEntry("deep-plan", ".claude/skills", {
      version: "1.0",
      trigger: "planning",
    }) as Record<string, unknown>;
    assert.strictEqual(entry["name"], "deep-plan");
    assert.strictEqual(entry["source"], ".claude/skills");
    assert.strictEqual(entry["version"], "1.0");
  });

  it("builds entry without frontmatter", () => {
    const entry = buildSkillEntry("my-skill", ".claude/skills", null) as Record<string, unknown>;
    assert.strictEqual(entry["name"], "my-skill");
    assert.ok(!entry["version"]);
  });
});
