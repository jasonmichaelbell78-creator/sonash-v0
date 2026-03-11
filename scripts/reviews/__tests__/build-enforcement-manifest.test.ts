/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Unit tests for build-enforcement-manifest.ts
 *
 * Tests the exported pure functions: slugify, parseCodePatterns (via inline
 * content), scanRegexRules, scanEslintRules, scanSemgrepRules, and
 * buildMechanisms. File I/O is exercised through temp directories.
 */

import assert from "node:assert/strict";
import { describe, test, beforeEach, afterEach } from "node:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// Walk up from __dirname until we find package.json
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition -- continue walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const PROJECT_ROOT = findProjectRoot(__dirname);
const distPath = path.resolve(PROJECT_ROOT, "scripts/reviews/dist");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  slugify,
  parseCodePatterns,
  scanRegexRules,
  scanEslintRules,
  scanSemgrepRules,
  buildMechanisms,
} = require(path.join(distPath, "build-enforcement-manifest.js")) as {
  slugify: (name: string) => string;
  parseCodePatterns: (filePath: string) => Array<{
    id: string;
    name: string;
    priority: "critical" | "important" | "edge";
    category: string;
  }>;
  scanRegexRules: (projectRoot: string) => Set<string>;
  scanEslintRules: (projectRoot: string) => Set<string>;
  scanSemgrepRules: (projectRoot: string) => Map<string, string>;
  buildMechanisms: (
    pattern: { id: string; name: string; priority: string; category: string },
    sources: {
      regexRules: Set<string>;
      eslintRules: Set<string>;
      semgrepRules: Map<string, string>;
      claudeMdPatterns: Set<string>;
    }
  ) => Record<string, string>;
};

// =========================================================
// Temp directory helpers
// =========================================================

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bef-manifest-test-"));
});

afterEach(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
});

// Helper to write a temp file and return its path
function writeTempFile(relPath: string, content: string): string {
  const rel = relPath.replaceAll("\\", "/");
  if (/^\.\.(?:[/\\]|$)/.test(rel)) throw new Error("Path traversal detected");
  const fullPath = path.join(tmpDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf-8");
  return fullPath;
}

// =========================================================
// 1. slugify
// =========================================================

describe("slugify", () => {
  test("lowercases and replaces spaces with hyphens", () => {
    assert.equal(slugify("Error Sanitization"), "error-sanitization");
  });

  test("strips leading and trailing hyphens", () => {
    assert.equal(slugify("  Test Pattern  "), "test-pattern");
  });

  test("collapses multiple separators into one hyphen", () => {
    assert.equal(slugify("exec() Loops -- /g Flag"), "exec-loops-g-flag");
  });

  test("handles already-slug input unchanged", () => {
    assert.equal(slugify("path-traversal"), "path-traversal");
  });

  test("removes special characters", () => {
    assert.equal(slugify("No `code` #here!"), "no-code-here");
  });

  test("handles empty string", () => {
    assert.equal(slugify(""), "");
  });
});

// =========================================================
// 2. parseCodePatterns
// =========================================================

describe("parseCodePatterns", () => {
  test("parses critical patterns from ### N. Name headings", () => {
    const content = [
      "## Critical Patterns Quick Reference",
      "",
      "### 1. Error Sanitization",
      "",
      "Some description.",
      "",
      "### 2. Path Traversal",
      "",
    ].join("\n");

    const filePath = writeTempFile("CODE_PATTERNS.md", content);
    const patterns = parseCodePatterns(filePath);

    assert.equal(patterns.length, 2);
    assert.equal(patterns[0].name, "Error Sanitization");
    assert.equal(patterns[0].priority, "critical");
    assert.equal(patterns[0].category, "Critical Patterns");
    assert.equal(patterns[1].name, "Path Traversal");
  });

  test("parses table rows with priority emojis", () => {
    const content = [
      "## Security",
      "",
      "| Priority | Pattern | Rule | Why |",
      "| --- | --- | --- | --- |",
      "| \uD83D\uDD34 | Injection Risk | no-eval | Security |",
      "| \uD83D\uDFE1 | Weak Types | strict-mode | Correctness |",
      "",
    ].join("\n");

    const filePath = writeTempFile("CODE_PATTERNS.md", content);
    const patterns = parseCodePatterns(filePath);

    assert.equal(patterns.length, 2);
    assert.equal(patterns[0].name, "Injection Risk");
    assert.equal(patterns[0].priority, "critical");
    assert.equal(patterns[1].name, "Weak Types");
    assert.equal(patterns[1].priority, "important");
  });

  test("skips meta sections (Purpose, Quick Start, etc.)", () => {
    const content = [
      "## Purpose",
      "",
      "### This should be skipped",
      "",
      "## Quick Start",
      "",
      "Some quick start content.",
      "",
      "## Security",
      "",
      "| Priority | Pattern | Rule | Why |",
      "| --- | --- | --- | --- |",
      "| \uD83D\uDD34 | Real Pattern | rule | reason |",
    ].join("\n");

    const filePath = writeTempFile("CODE_PATTERNS.md", content);
    const patterns = parseCodePatterns(filePath);

    // Only "Real Pattern" should be found, not the skipped section's ### heading
    const hasSkipped = patterns.some((p) => p.name === "This should be skipped");
    assert.equal(hasSkipped, false);
    assert.ok(patterns.some((p) => p.name === "Real Pattern"));
  });

  test("throws on missing file", () => {
    const missing = path.join(tmpDir, "nonexistent.md");
    assert.throws(() => parseCodePatterns(missing), /Failed to read CODE_PATTERNS.md/);
  });

  test("assigns IDs as slugified pattern names", () => {
    const content = ["## Critical Patterns Quick Reference", "", "### 1. Error Sanitization"].join(
      "\n"
    );

    const filePath = writeTempFile("CODE_PATTERNS.md", content);
    const patterns = parseCodePatterns(filePath);

    assert.equal(patterns[0].id, "error-sanitization");
  });
});

// =========================================================
// 3. scanRegexRules
// =========================================================

describe("scanRegexRules", () => {
  test("extracts rule IDs from check-pattern-compliance.js", () => {
    const content = [
      "const ANTI_PATTERNS = [",
      '  { id: "unsanitized-error-response", pattern: /.message/, message: "..." },',
      '  { id: "path-traversal-startswith", pattern: /startsWith/, message: "..." },',
      "];",
    ].join("\n");

    fs.mkdirSync(path.join(tmpDir, "scripts"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "scripts", "check-pattern-compliance.js"), content, "utf-8");

    const rules = scanRegexRules(tmpDir);
    assert.ok(rules.has("unsanitized-error-response"));
    assert.ok(rules.has("path-traversal-startswith"));
  });

  test("returns empty Set when file does not exist", () => {
    const rules = scanRegexRules(tmpDir);
    assert.equal(rules.size, 0);
  });

  test("deduplicates IDs", () => {
    const content = 'id: "dup-rule"\n  id: "dup-rule"\n';
    fs.mkdirSync(path.join(tmpDir, "scripts"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "scripts", "check-pattern-compliance.js"), content, "utf-8");

    const rules = scanRegexRules(tmpDir);
    assert.equal(rules.size, 1);
  });
});

// =========================================================
// 4. scanEslintRules
// =========================================================

describe("scanEslintRules", () => {
  test("extracts rule names from eslint-plugin-sonash/index.js", () => {
    const content = [
      "module.exports = {",
      "  rules: {",
      '    "no-unsafe-error-access": ruleA,',
      '    "require-safe-fs-write": ruleB,',
      "  }",
      "};",
    ].join("\n");

    fs.mkdirSync(path.join(tmpDir, "eslint-plugin-sonash"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "eslint-plugin-sonash", "index.js"), content, "utf-8");

    const rules = scanEslintRules(tmpDir);
    assert.ok(rules.has("no-unsafe-error-access"));
    assert.ok(rules.has("require-safe-fs-write"));
  });

  test("returns empty Set when file does not exist", () => {
    const rules = scanEslintRules(tmpDir);
    assert.equal(rules.size, 0);
  });
});

// =========================================================
// 5. scanSemgrepRules
// =========================================================

describe("scanSemgrepRules", () => {
  test("extracts rule refs from YAML files", () => {
    const yaml = [
      "rules:",
      "- id: sonash.security.no-unsanitized-error",
      "  metadata:",
      '    code-pattern-ref: "Error Sanitization"',
    ].join("\n");

    const rulesDir = path.join(tmpDir, ".semgrep", "rules");
    fs.mkdirSync(rulesDir, { recursive: true });
    fs.writeFileSync(path.join(rulesDir, "security.yml"), yaml, "utf-8");

    const refMap = scanSemgrepRules(tmpDir);
    assert.ok(refMap.has("Error Sanitization"));
    assert.equal(refMap.get("Error Sanitization"), "sonash.security.no-unsanitized-error");
  });

  test("returns empty Map when rules directory does not exist", () => {
    const refMap = scanSemgrepRules(tmpDir);
    assert.equal(refMap.size, 0);
  });

  test("concatenates multiple rules for the same ref", () => {
    const yaml1 = 'rules:\n- id: rule-a\n  metadata:\n    code-pattern-ref: "Shared Pattern"\n';
    const yaml2 = 'rules:\n- id: rule-b\n  metadata:\n    code-pattern-ref: "Shared Pattern"\n';

    const rulesDir = path.join(tmpDir, ".semgrep", "rules");
    fs.mkdirSync(rulesDir, { recursive: true });
    fs.writeFileSync(path.join(rulesDir, "a.yml"), yaml1, "utf-8");
    fs.writeFileSync(path.join(rulesDir, "b.yml"), yaml2, "utf-8");

    const refMap = scanSemgrepRules(tmpDir);
    const val = refMap.get("Shared Pattern") ?? "";
    assert.ok(val.includes("rule-a"));
    assert.ok(val.includes("rule-b"));
  });
});

// =========================================================
// 6. buildMechanisms
// =========================================================

describe("buildMechanisms", () => {
  const emptySources = {
    regexRules: new Set<string>(),
    eslintRules: new Set<string>(),
    semgrepRules: new Map<string, string>(),
    claudeMdPatterns: new Set<string>(),
  };

  test("returns all-none when no sources match", () => {
    const pattern = {
      id: "obscure-pattern",
      name: "Obscure Pattern",
      priority: "edge",
      category: "General",
    };
    const mechanisms = buildMechanisms(pattern, emptySources);
    assert.equal(mechanisms.regex, "none");
    assert.equal(mechanisms.eslint, "none");
    assert.equal(mechanisms.semgrep, "none");
    assert.equal(mechanisms.hooks, "none");
    assert.equal(mechanisms.ai, "none");
    assert.equal(mechanisms.manual, "code-review");
  });

  test("sets regex when a rule ID fuzzy-matches the pattern slug", () => {
    const pattern = {
      id: "error-sanitization",
      name: "Error Sanitization",
      priority: "critical",
      category: "Security",
    };
    const sources = {
      ...emptySources,
      regexRules: new Set(["error-sanitization-check"]),
    };
    const mechanisms = buildMechanisms(pattern, sources);
    assert.ok(mechanisms.regex.startsWith("active:"));
  });

  test("sets eslint when a rule name fuzzy-matches the pattern slug", () => {
    const pattern = {
      id: "path-traversal",
      name: "Path Traversal",
      priority: "critical",
      category: "Security",
    };
    const sources = {
      ...emptySources,
      eslintRules: new Set(["no-path-traversal"]),
    };
    const mechanisms = buildMechanisms(pattern, sources);
    assert.ok(mechanisms.eslint.startsWith("active:"));
  });

  test("sets hooks to pre-commit when regex is active", () => {
    const pattern = {
      id: "error-sanitization",
      name: "Error Sanitization",
      priority: "critical",
      category: "Security",
    };
    const sources = {
      ...emptySources,
      regexRules: new Set(["error-sanitization-check"]),
    };
    const mechanisms = buildMechanisms(pattern, sources);
    assert.equal(mechanisms.hooks, "pre-commit");
  });

  test("sets ai when CLAUDE.md patterns match", () => {
    const pattern = {
      id: "error-sanitization",
      name: "Error Sanitization",
      priority: "critical",
      category: "Security",
    };
    const sources = {
      ...emptySources,
      claudeMdPatterns: new Set(["error sanitization"]),
    };
    const mechanisms = buildMechanisms(pattern, sources);
    assert.equal(mechanisms.ai, "claude-md");
  });

  test("semgrep requires exact slug match (no fuzzy)", () => {
    const pattern = {
      id: "error-sanitization",
      name: "Error Sanitization",
      priority: "critical",
      category: "Security",
    };
    const sources = {
      ...emptySources,
      // Ref slug is "error-sanitiz" -- not an exact slug match
      semgrepRules: new Map([["Error Sanitiz", "some-rule"]]),
    };
    const mechanisms = buildMechanisms(pattern, sources);
    assert.equal(mechanisms.semgrep, "none");
  });

  test("semgrep matches when ref slugifies exactly to pattern slug", () => {
    const pattern = {
      id: "error-sanitization",
      name: "Error Sanitization",
      priority: "critical",
      category: "Security",
    };
    const sources = {
      ...emptySources,
      semgrepRules: new Map([["Error Sanitization", "sonash.sec.error-san"]]),
    };
    const mechanisms = buildMechanisms(pattern, sources);
    assert.ok(mechanisms.semgrep.startsWith("active:"));
  });
});
