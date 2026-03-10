import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/search-capabilities.js

describe("search-capabilities: keyword matching", () => {
  function matchesQuery(content: string, query: string): boolean {
    return content.toLowerCase().includes(query.toLowerCase());
  }

  it("finds keyword in content", () => {
    assert.strictEqual(matchesQuery("Authentication and Authorization", "auth"), true);
  });

  it("is case-insensitive", () => {
    assert.strictEqual(matchesQuery("FIRESTORE_WRITE", "firestore"), true);
  });

  it("returns false when keyword not found", () => {
    assert.strictEqual(matchesQuery("Redux state management", "firebase"), false);
  });
});

describe("search-capabilities: capability extraction from markdown", () => {
  function extractCapabilities(content: string): string[] {
    const capabilities: string[] = [];
    const lines = content.split("\n");
    for (const line of lines) {
      const match = line.match(/^#+\s+(.+)$/);
      if (match) {
        capabilities.push(match[1].trim());
      }
    }
    return capabilities;
  }

  it("extracts headings as capabilities", () => {
    const content = "# Authentication\n## Token Management\n### JWT Validation";
    const caps = extractCapabilities(content);
    assert.ok(caps.includes("Authentication"));
    assert.ok(caps.includes("Token Management"));
  });

  it("returns empty for content without headings", () => {
    assert.deepStrictEqual(extractCapabilities("plain paragraph text"), []);
  });
});

describe("search-capabilities: result ranking", () => {
  interface SearchResult {
    title: string;
    score: number;
  }

  function rankResults(results: SearchResult[]): SearchResult[] {
    return [...results].sort((a, b) => b.score - a.score);
  }

  it("ranks higher score first", () => {
    const results: SearchResult[] = [
      { title: "Low match", score: 0.3 },
      { title: "High match", score: 0.9 },
      { title: "Medium match", score: 0.6 },
    ];
    const ranked = rankResults(results);
    assert.strictEqual(ranked[0].title, "High match");
  });

  it("handles empty results", () => {
    assert.deepStrictEqual(rankResults([]), []);
  });
});
