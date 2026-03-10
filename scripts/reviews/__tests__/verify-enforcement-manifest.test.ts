/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Unit tests for scripts/reviews/verify-enforcement-manifest.ts
 *
 * Tests readManifest(), getActualRegexRules(), getActualEslintRules(), and
 * getActualSemgrepRules() using temp directories and inline content.
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
const distPath = path.resolve(PROJECT_ROOT, "scripts/reviews/dist/verify-enforcement-manifest.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readManifest, getActualRegexRules, getActualEslintRules, getActualSemgrepRules } = require(
  distPath
) as {
  readManifest: (filePath: string) => Array<{
    pattern_id: string;
    pattern_name: string;
    priority: string;
    category: string;
    mechanisms: Record<string, string>;
    coverage: string;
    status: string;
    last_verified: string;
  }>;
  getActualRegexRules: (projectRoot: string) => Set<string>;
  getActualEslintRules: (projectRoot: string) => Set<string>;
  getActualSemgrepRules: (projectRoot: string) => Set<string>;
};

// =========================================================
// Helpers
// =========================================================

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "verify-manifest-test-"));
});

afterEach(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
});

function writeFile(relPath: string, content: string): string {
  const rel = relPath.replace(/\\/g, "/");
  if (/^\.\.(?:[/\\]|$)/.test(rel)) throw new Error("Path traversal detected");
  const full = path.join(tmpDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf-8");
  return full;
}

function makeValidRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    pattern_id: "error-sanitization",
    pattern_name: "Error Sanitization",
    priority: "critical",
    category: "Security",
    mechanisms: {
      regex: "active:unsanitized-error-response",
      eslint: "none",
      semgrep: "none",
      cross_doc: "none",
      hooks: "pre-commit",
      ai: "claude-md",
      manual: "code-review",
    },
    coverage: "automated",
    status: "active",
    last_verified: "2026-03-01",
    ...overrides,
  };
}

// =========================================================
// 1. readManifest
// =========================================================

describe("readManifest", () => {
  test("reads and parses valid JSONL records", () => {
    const record = makeValidRecord();
    const filePath = writeFile("manifest.jsonl", JSON.stringify(record) + "\n");

    const records = readManifest(filePath);
    assert.equal(records.length, 1);
    assert.equal(records[0].pattern_id, "error-sanitization");
  });

  test("parses multiple JSONL records from one file", () => {
    const r1 = makeValidRecord({ pattern_id: "p1", pattern_name: "P1" });
    const r2 = makeValidRecord({ pattern_id: "p2", pattern_name: "P2" });
    const filePath = writeFile(
      "manifest.jsonl",
      JSON.stringify(r1) + "\n" + JSON.stringify(r2) + "\n"
    );

    const records = readManifest(filePath);
    assert.equal(records.length, 2);
    assert.equal(records[0].pattern_id, "p1");
    assert.equal(records[1].pattern_id, "p2");
  });

  test("skips blank lines silently", () => {
    const record = makeValidRecord();
    const filePath = writeFile("manifest.jsonl", "\n" + JSON.stringify(record) + "\n\n");

    const records = readManifest(filePath);
    assert.equal(records.length, 1);
  });

  test("skips invalid JSONL lines (schema mismatch) with a warning", () => {
    const bad = JSON.stringify({ pattern_id: "incomplete" });
    const good = JSON.stringify(makeValidRecord({ pattern_id: "good-one" }));
    const filePath = writeFile("manifest.jsonl", bad + "\n" + good + "\n");

    const records = readManifest(filePath);
    // Bad record is skipped; good record is returned
    assert.equal(records.length, 1);
    assert.equal(records[0].pattern_id, "good-one");
  });

  test("throws when the file does not exist", () => {
    const missing = path.join(tmpDir, "nonexistent.jsonl");
    assert.throws(() => readManifest(missing), /Failed to read manifest/);
  });

  test("returns empty array for an empty file", () => {
    const filePath = writeFile("empty.jsonl", "");
    const records = readManifest(filePath);
    assert.deepEqual(records, []);
  });
});

// =========================================================
// 2. getActualRegexRules
// =========================================================

describe("getActualRegexRules", () => {
  test("extracts rule IDs from check-pattern-compliance.js", () => {
    const content = [
      "const ANTI_PATTERNS = [",
      '  { id: "unsanitized-error", pattern: /msg/, message: "Desc" },',
      '  { id: "path-traversal", pattern: /startsWith/, message: "Desc" },',
      "];",
    ].join("\n");
    writeFile("scripts/check-pattern-compliance.js", content);

    const rules = getActualRegexRules(tmpDir);
    assert.ok(rules.has("unsanitized-error"));
    assert.ok(rules.has("path-traversal"));
  });

  test("returns empty Set when file does not exist", () => {
    const rules = getActualRegexRules(tmpDir);
    assert.equal(rules.size, 0);
  });

  test("deduplicates IDs appearing multiple times", () => {
    const content = 'id: "dup"\n  id: "dup"\n';
    writeFile("scripts/check-pattern-compliance.js", content);
    const rules = getActualRegexRules(tmpDir);
    assert.equal(rules.size, 1);
  });
});

// =========================================================
// 3. getActualEslintRules
// =========================================================

describe("getActualEslintRules", () => {
  test("extracts ESLint rule names from eslint-plugin-sonash/index.js", () => {
    const content = [
      "module.exports = {",
      "  rules: {",
      '    "no-unsafe-error-access": ruleA,',
      '    "require-safe-write": ruleB,',
      "  }",
      "};",
    ].join("\n");
    writeFile("eslint-plugin-sonash/index.js", content);

    const rules = getActualEslintRules(tmpDir);
    assert.ok(rules.has("no-unsafe-error-access"));
    assert.ok(rules.has("require-safe-write"));
  });

  test("returns empty Set when file does not exist", () => {
    const rules = getActualEslintRules(tmpDir);
    assert.equal(rules.size, 0);
  });
});

// =========================================================
// 4. getActualSemgrepRules
// =========================================================

describe("getActualSemgrepRules", () => {
  test("extracts rule IDs from YAML files in .semgrep/rules/", () => {
    const yaml = "rules:\n- id: sonash.security.no-unsanitized-error\n  pattern: $X.message\n";
    writeFile(".semgrep/rules/security.yml", yaml);

    const rules = getActualSemgrepRules(tmpDir);
    assert.ok(rules.has("sonash.security.no-unsanitized-error"));
  });

  test("scans subdirectories recursively", () => {
    const yaml = "rules:\n- id: sonash.nested.rule\n  pattern: $X\n";
    writeFile(".semgrep/rules/sub/nested.yml", yaml);

    const rules = getActualSemgrepRules(tmpDir);
    assert.ok(rules.has("sonash.nested.rule"));
  });

  test("handles both .yml and .yaml extensions", () => {
    writeFile(".semgrep/rules/rule-a.yml", "rules:\n- id: rule-yml\n  pattern: $X\n");
    writeFile(".semgrep/rules/rule-b.yaml", "rules:\n- id: rule-yaml\n  pattern: $X\n");

    const rules = getActualSemgrepRules(tmpDir);
    assert.ok(rules.has("rule-yml"));
    assert.ok(rules.has("rule-yaml"));
  });

  test("returns empty Set when .semgrep/rules directory does not exist", () => {
    const rules = getActualSemgrepRules(tmpDir);
    assert.equal(rules.size, 0);
  });

  test("skips files with no rule ID gracefully", () => {
    writeFile(".semgrep/rules/no-id.yml", "rules:\n- pattern: $X\n  message: no id here\n");
    // Should not throw
    const rules = getActualSemgrepRules(tmpDir);
    assert.ok(rules instanceof Set);
  });
});
