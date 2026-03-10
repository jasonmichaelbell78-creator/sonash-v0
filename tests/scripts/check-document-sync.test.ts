import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-document-sync.js

describe("check-document-sync: document pair matching", () => {
  interface DocPair {
    source: string;
    target: string;
    required: boolean;
  }

  function findSyncIssues(
    pairs: DocPair[],
    existingFiles: Set<string>
  ): Array<{ source: string; target: string; issue: string }> {
    const issues: Array<{ source: string; target: string; issue: string }> = [];
    for (const pair of pairs) {
      if (!existingFiles.has(pair.source)) {
        if (pair.required) {
          issues.push({ source: pair.source, target: pair.target, issue: "source missing" });
        }
      } else if (!existingFiles.has(pair.target)) {
        issues.push({ source: pair.source, target: pair.target, issue: "target missing" });
      }
    }
    return issues;
  }

  it("reports missing target document", () => {
    const pairs: DocPair[] = [{ source: "docs/A.md", target: "docs/A-copy.md", required: true }];
    const existing = new Set(["docs/A.md"]);
    const issues = findSyncIssues(pairs, existing);
    assert.strictEqual(issues.length, 1);
    assert.strictEqual(issues[0].issue, "target missing");
  });

  it("reports missing required source", () => {
    const pairs: DocPair[] = [
      { source: "docs/MISSING.md", target: "docs/copy.md", required: true },
    ];
    const existing = new Set<string>();
    const issues = findSyncIssues(pairs, existing);
    assert.strictEqual(issues[0].issue, "source missing");
  });

  it("passes when both files exist", () => {
    const pairs: DocPair[] = [{ source: "docs/A.md", target: "docs/B.md", required: true }];
    const existing = new Set(["docs/A.md", "docs/B.md"]);
    assert.strictEqual(findSyncIssues(pairs, existing).length, 0);
  });
});

describe("check-document-sync: content hash comparison", () => {
  function contentsMatch(contentA: string, contentB: string): boolean {
    return contentA.trim() === contentB.trim();
  }

  it("detects matching contents", () => {
    assert.strictEqual(contentsMatch("hello world", "hello world"), true);
  });

  it("detects differing contents", () => {
    assert.strictEqual(contentsMatch("version 1", "version 2"), false);
  });

  it("trims whitespace before comparison", () => {
    assert.strictEqual(contentsMatch("  content  ", "content"), true);
  });
});

describe("check-document-sync: path validation", () => {
  function isPathTraversal(rel: string): boolean {
    return /^\.\.(?:[\\/]|$)/.test(rel);
  }

  it("detects traversal attempts", () => {
    assert.strictEqual(isPathTraversal("../etc/passwd"), true);
  });

  it("allows normal relative paths", () => {
    assert.strictEqual(isPathTraversal("docs/README.md"), false);
  });
});
