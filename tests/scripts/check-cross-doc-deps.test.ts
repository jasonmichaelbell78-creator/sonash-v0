import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-cross-doc-deps.js

function extractMarkdownLinks(content: string): Array<{ text: string; href: string }> {
  const regex = /\[([^\]]*)\]\(([^)]+)\)/g;
  return Array.from(content.matchAll(regex), (m) => ({ text: m[1], href: m[2] }));
}

function isInternalLink(href: string): boolean {
  if (!href) return false;
  if (href.startsWith("http://") || href.startsWith("https://")) return false;
  if (href.startsWith("mailto:")) return false;
  if (href.startsWith("#")) return false;
  return true;
}

function buildDependencyGraph(
  files: Array<{ path: string; links: string[] }>
): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  for (const file of files) {
    graph.set(file.path, file.links);
  }
  return graph;
}

describe("check-cross-doc-deps: link extraction", () => {
  it("extracts all links from content", () => {
    const content = "See [ROADMAP](ROADMAP.md) and [README](README.md)";
    const links = extractMarkdownLinks(content);
    assert.strictEqual(links.length, 2);
    assert.strictEqual(links[0].href, "ROADMAP.md");
  });

  it("handles links with anchors", () => {
    const content = "[Section](docs/file.md#section)";
    const links = extractMarkdownLinks(content);
    assert.strictEqual(links[0].href, "docs/file.md#section");
  });

  it("returns empty array for no links", () => {
    assert.deepStrictEqual(extractMarkdownLinks("plain text"), []);
  });
});

describe("check-cross-doc-deps: external link filtering", () => {
  it("identifies relative path as internal", () => {
    assert.strictEqual(isInternalLink("docs/README.md"), true);
  });

  it("identifies https URL as external", () => {
    assert.strictEqual(isInternalLink("https://example.com"), false);
  });

  it("identifies anchor as non-internal", () => {
    assert.strictEqual(isInternalLink("#section"), false);
  });

  it("handles empty href", () => {
    assert.strictEqual(isInternalLink(""), false);
  });
});

describe("check-cross-doc-deps: dependency graph building", () => {
  it("builds correct dependency graph", () => {
    const files = [
      { path: "docs/A.md", links: ["docs/B.md", "docs/C.md"] },
      { path: "docs/B.md", links: ["docs/C.md"] },
    ];
    const graph = buildDependencyGraph(files);
    assert.deepStrictEqual(graph.get("docs/A.md"), ["docs/B.md", "docs/C.md"]);
    assert.deepStrictEqual(graph.get("docs/B.md"), ["docs/C.md"]);
  });

  it("handles files with no dependencies", () => {
    const files = [{ path: "docs/standalone.md", links: [] }];
    const graph = buildDependencyGraph(files);
    assert.deepStrictEqual(graph.get("docs/standalone.md"), []);
  });
});
