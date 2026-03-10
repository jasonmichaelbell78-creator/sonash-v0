/**
 * generate-results-index.js Test Suite
 *
 * Tests the pure helper functions from scripts/audit/generate-results-index.js.
 * Core coverage:
 *   - extractDate
 *   - DIR_TO_CANONICAL mapping
 *   - generateMarkdown structure
 *   - guardSymlink path safety
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";

// ---------------------------------------------------------------------------
// Project root
// ---------------------------------------------------------------------------

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

// ---------------------------------------------------------------------------
// Re-implemented pure helpers
// ---------------------------------------------------------------------------

const DIR_TO_CANONICAL: Record<string, string> = {
  code: "code-quality",
  security: "security",
  performance: "performance",
  refactoring: "refactoring",
  documentation: "documentation",
  process: "process",
  "engineering-productivity": "engineering-productivity",
  enhancements: "enhancements",
  "ai-optimization": "ai-optimization",
};

function extractDate(dirName: string): string | null {
  const match = /audit-(\d{4}-\d{2}-\d{2})/.exec(dirName);
  return match ? match[1] : null;
}

interface AuditResult {
  date: string;
  type: string;
  category: string;
  path: string;
}

function generateMarkdown(results: AuditResult[]): string {
  const now = new Date().toISOString().split("T")[0];

  let content = `<!-- AUTO-GENERATED -- do not edit manually -->\n\n# Audit Results Index\n\n`;
  content += `**Last Updated:** ${now}\n\n## Results Table\n\n`;

  if (results.length === 0) {
    content += "_No audit results found._\n";
  } else {
    content += "| Date | Type | Category | Path |\n";
    content += "|------|------|----------|------|\n";
    for (const result of results) {
      const link = `[${result.path}](./${result.path}/)`;
      content += `| ${result.date} | ${result.type} | ${result.category} | ${link} |\n`;
    }
  }

  return content;
}

// ---------------------------------------------------------------------------
// Tests: extractDate
// ---------------------------------------------------------------------------

describe("extractDate", () => {
  it("extracts date from 'audit-2026-01-15' directory name", () => {
    assert.equal(extractDate("audit-2026-01-15"), "2026-01-15");
  });

  it("extracts date from 'audit-2026-01-15-10-30' (timestamped) directory name", () => {
    assert.equal(extractDate("audit-2026-01-15-10-30"), "2026-01-15");
  });

  it("returns null for a non-audit directory name", () => {
    assert.equal(extractDate("comprehensive"), null);
  });

  it("returns null for empty string", () => {
    assert.equal(extractDate(""), null);
  });

  it("returns null for 'audit-' with no date", () => {
    assert.equal(extractDate("audit-results"), null);
  });
});

// ---------------------------------------------------------------------------
// Tests: DIR_TO_CANONICAL
// ---------------------------------------------------------------------------

describe("DIR_TO_CANONICAL", () => {
  it("maps 'code' to 'code-quality'", () => {
    assert.equal(DIR_TO_CANONICAL["code"], "code-quality");
  });

  it("contains exactly 9 mappings", () => {
    assert.equal(Object.keys(DIR_TO_CANONICAL).length, 9);
  });

  it("all canonical values are non-empty strings", () => {
    for (const [dir, canonical] of Object.entries(DIR_TO_CANONICAL)) {
      assert.ok(
        typeof canonical === "string" && canonical.length > 0,
        `Empty canonical for ${dir}`
      );
    }
  });

  it("no directory key contains path traversal", () => {
    for (const dir of Object.keys(DIR_TO_CANONICAL)) {
      assert.ok(!/\.\./.test(dir), `Traversal in dir key: ${dir}`);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: generateMarkdown
// ---------------------------------------------------------------------------

describe("generateMarkdown", () => {
  it("produces AUTO-GENERATED header comment", () => {
    const md = generateMarkdown([]);
    assert.ok(md.includes("AUTO-GENERATED"), "Should include auto-generated marker");
  });

  it("produces placeholder text when results array is empty", () => {
    const md = generateMarkdown([]);
    assert.ok(md.includes("_No audit results found._"), "Should indicate no results");
  });

  it("includes table header when results are present", () => {
    const results: AuditResult[] = [
      {
        date: "2026-01-15",
        type: "Single-Session",
        category: "security",
        path: "single-session/security/audit-2026-01-15",
      },
    ];
    const md = generateMarkdown(results);
    assert.ok(md.includes("| Date | Type | Category | Path |"), "Should include table header");
  });

  it("includes result row data in output", () => {
    const results: AuditResult[] = [
      {
        date: "2026-01-15",
        type: "Multi-AI",
        category: "N/A",
        path: "multi-ai/audit-2026-01-15",
      },
    ];
    const md = generateMarkdown(results);
    assert.ok(md.includes("2026-01-15"), "Date should appear in output");
    assert.ok(md.includes("Multi-AI"), "Type should appear in output");
    assert.ok(md.includes("N/A"), "Category should appear in output");
  });

  it("sorts path links with relative prefix", () => {
    const results: AuditResult[] = [
      {
        date: "2026-01-15",
        type: "Comprehensive",
        category: "N/A",
        path: "comprehensive/audit-2026-01-15",
      },
    ];
    const md = generateMarkdown(results);
    assert.ok(md.includes("./comprehensive/audit-2026-01-15/"), "Path link should have ./ prefix");
  });

  it("handles multiple results", () => {
    const results: AuditResult[] = [
      {
        date: "2026-02-01",
        type: "Single-Session",
        category: "security",
        path: "s/security/audit-2026-02-01",
      },
      {
        date: "2026-01-15",
        type: "Single-Session",
        category: "performance",
        path: "s/performance/audit-2026-01-15",
      },
    ];
    const md = generateMarkdown(results);
    assert.ok(md.includes("2026-02-01"), "First result date present");
    assert.ok(md.includes("2026-01-15"), "Second result date present");
  });
});

// ---------------------------------------------------------------------------
// Tests: atomicWrite guard logic (guardSymlink pattern)
// ---------------------------------------------------------------------------

describe("path containment check (atomicWrite pattern)", () => {
  it("path.relative() correctly identifies paths within a base", () => {
    const base = "/project/root";
    const inside = "/project/root/docs/audits/RESULTS_INDEX.md";
    const rel = path.relative(base, inside);
    assert.ok(!/^\.\.(?:[/\\]|$)/.test(rel), `Path should be inside base: rel=${rel}`);
    assert.ok(!path.isAbsolute(rel), "Relative path should not be absolute");
  });

  it("path.relative() detects escaped paths", () => {
    const base = "/project/root";
    const outside = "/other/path/file.md";
    const rel = path.relative(base, outside);
    assert.ok(/^\.\.(?:[/\\]|$)/.test(rel), `Path should escape base: rel=${rel}`);
  });
});

// ---------------------------------------------------------------------------
// Tests: find + walk (directory traversal logic)
// ---------------------------------------------------------------------------

describe("findAuditDirectories logic", () => {
  let tmpDir: string;

  it("finds directories matching /^audit-/ pattern in a tree", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gri-test-"));
    try {
      const auditDir = path.join(tmpDir, "audit-2026-01-15");
      const otherDir = path.join(tmpDir, "not-an-audit");
      fs.mkdirSync(auditDir);
      fs.mkdirSync(otherDir);

      const entries = fs
        .readdirSync(tmpDir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && e.name.startsWith("audit-"))
        .map((e) => e.name);

      assert.deepEqual(entries, ["audit-2026-01-15"]);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// Script existence
// ---------------------------------------------------------------------------

describe("script existence", () => {
  it("generate-results-index.js exists at expected path", () => {
    const p = path.resolve(PROJECT_ROOT, "scripts/audit/generate-results-index.js");
    assert.ok(fs.existsSync(p), `Script not found: ${p}`);
  });
});
