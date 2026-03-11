import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/suggest-pattern-automation.js

describe("suggest-pattern-automation: EXTRACTABLE_PATTERNS", () => {
  const EXTRACTABLE_PATTERNS = [
    {
      regex: /(?:Wrong|Bad|INCORRECT|Anti-pattern):\s*`([^`]+)`/gi,
      type: "wrong_code",
    },
    {
      regex: /Example:\s*`([^`]+)`(?=[\s\S]*?(?:fails|breaks|crashes|bug|issue|problem))/gi,
      type: "example_negative",
    },
  ];

  it("extracts Wrong: code examples", () => {
    const content = "Wrong: `const x = eval(input)`";
    const regex = new RegExp(EXTRACTABLE_PATTERNS[0].regex.source, "gi");
    const match = regex.exec(content);
    assert.ok(match !== null);
    assert.ok(match[1].includes("eval"));
  });

  it("extracts Bad: code examples", () => {
    const content = "Bad: `process.exit(1)`";
    const regex = new RegExp(EXTRACTABLE_PATTERNS[0].regex.source, "gi");
    const match = regex.exec(content);
    assert.ok(match !== null);
  });

  it("does not extract correct code examples", () => {
    const content = "Correct: `const x = sanitize(input)`";
    const regex = new RegExp(EXTRACTABLE_PATTERNS[0].regex.source, "gi");
    const match = regex.exec(content);
    assert.strictEqual(match, null);
  });
});

describe("suggest-pattern-automation: AUTOMATABLE_CATEGORIES", () => {
  const AUTOMATABLE_CATEGORIES = {
    shell: {
      indicators: ["bash", "shell", "sh"],
      fileTypes: [".sh", ".yml", ".yaml"],
    },
    javascript: {
      indicators: ["catch", "error.message", "instanceof"],
      fileTypes: [".js", ".ts", ".tsx", ".jsx"],
    },
    security: {
      indicators: ["path", "traversal", "injection", "sanitize"],
      fileTypes: [".js", ".ts", ".sh"],
    },
  };

  it("shell category targets sh and yaml files", () => {
    assert.ok(AUTOMATABLE_CATEGORIES.shell.fileTypes.includes(".sh"));
    assert.ok(AUTOMATABLE_CATEGORIES.shell.fileTypes.includes(".yml"));
  });

  it("javascript category targets TypeScript files", () => {
    assert.ok(AUTOMATABLE_CATEGORIES.javascript.fileTypes.includes(".ts"));
    assert.ok(AUTOMATABLE_CATEGORIES.javascript.fileTypes.includes(".tsx"));
  });

  it("security category includes traversal indicator", () => {
    assert.ok(AUTOMATABLE_CATEGORIES.security.indicators.includes("traversal"));
  });
});

function deduplicatePatterns(patterns: string[]): string[] {
  return [...new Set(patterns)];
}

describe("suggest-pattern-automation: pattern deduplication", () => {
  it("removes duplicate patterns", () => {
    const result = deduplicatePatterns(["error-handling", "path-traversal", "error-handling"]);
    assert.strictEqual(result.length, 2);
  });

  it("preserves order of first occurrence", () => {
    const result = deduplicatePatterns(["a", "b", "a", "c"]);
    assert.deepStrictEqual(result, ["a", "b", "c"]);
  });
});
