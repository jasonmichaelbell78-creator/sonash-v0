import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-content-accuracy.js

function extractVersionMentions(content: string, packageName: string): string[] {
  const pattern = new RegExp(String.raw`${packageName}[\s@]*([\d]+\.[\d]+\.[\d]+)`, "gi");
  const versions: string[] = [];
  let match;
  while ((match = pattern.exec(content)) !== null) {
    versions.push(match[1]);
  }
  return versions;
}

function scriptExists(scripts: Record<string, string>, scriptName: string): boolean {
  return Object.hasOwn(scripts, scriptName);
}

function isMarkdownFile(filename: string): boolean {
  return filename.endsWith(".md") || filename.endsWith(".mdx");
}

function shouldSkipDirectory(entry: string): boolean {
  return entry.startsWith(".") || entry === "node_modules" || entry === "__pycache__";
}

describe("check-content-accuracy: version extraction from markdown", () => {
  it("extracts version from package mention", () => {
    const content = "Uses react 19.2.3 for rendering";
    const versions = extractVersionMentions(content, "react");
    assert.ok(versions.includes("19.2.3"));
  });

  it("returns empty array when no version found", () => {
    const versions = extractVersionMentions("No react version here", "react");
    assert.strictEqual(versions.length, 0);
  });
});

describe("check-content-accuracy: npm script existence check", () => {
  it("confirms existing script", () => {
    const scripts = { test: "jest", build: "tsc" };
    assert.strictEqual(scriptExists(scripts, "test"), true);
  });

  it("reports missing script", () => {
    const scripts = { test: "jest" };
    assert.strictEqual(scriptExists(scripts, "lint"), false);
  });
});

describe("check-content-accuracy: markdown file discovery filter", () => {
  it("identifies .md files", () => {
    assert.strictEqual(isMarkdownFile("README.md"), true);
  });

  it("identifies .mdx files", () => {
    assert.strictEqual(isMarkdownFile("guide.mdx"), true);
  });

  it("skips non-markdown files", () => {
    assert.strictEqual(isMarkdownFile("script.js"), false);
  });

  it("skips hidden directories", () => {
    assert.strictEqual(shouldSkipDirectory(".git"), true);
  });

  it("skips node_modules", () => {
    assert.strictEqual(shouldSkipDirectory("node_modules"), true);
  });

  it("does not skip normal directories", () => {
    assert.strictEqual(shouldSkipDirectory("docs"), false);
  });
});
