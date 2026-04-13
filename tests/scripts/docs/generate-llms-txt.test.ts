/**
 * generate-llms-txt.js Test Suite
 *
 * Tests the exported pure helpers:
 * - extractFrontmatter (indexOf-based YAML frontmatter parser — ReDoS-safe
 *   replacement for the R1-flagged S5852 regex)
 * - extractSummary (CLAUDE.md purpose-section extractor)
 * - extractSkillDescription (SKILL.md frontmatter or fallback paragraph)
 * - getSkillName (frontmatter name → H1 body → dir-basename fallback)
 * - cleanDesc (whitespace collapse + quote strip + 240-char cap)
 * - CLI smoke: script runs and writes llms.txt
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";

const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../../package.json"))
  ? path.resolve(__dirname, "../../..")
  : path.resolve(__dirname, "../../../..");

const scriptPath = path.resolve(PROJECT_ROOT, "scripts/docs/generate-llms-txt.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require(scriptPath) as {
  extractSummary: (claudeMd: string) => string;
  extractFrontmatter: (text: string) => Record<string, string> | null;
  extractSkillDescription: (skillMd: string) => string;
  getSkillName: (skillDir: string, skillMd: string) => string;
  cleanDesc: (s: string) => string;
};

const { extractSummary, extractFrontmatter, extractSkillDescription, getSkillName, cleanDesc } =
  mod;

describe("generate-llms-txt.js", () => {
  describe("extractFrontmatter (ReDoS-safe indexOf parser)", () => {
    test("returns null when text lacks leading ---", () => {
      assert.equal(extractFrontmatter("# Heading\n\nBody"), null);
    });

    test("returns null when closing --- is missing", () => {
      assert.equal(extractFrontmatter("---\nname: foo\n"), null);
    });

    test("parses simple scalar key/value pairs", () => {
      const text = "---\nname: foo\ndescription: Short desc\n---\n# Heading";
      const fm = extractFrontmatter(text);
      assert.deepEqual(fm, { name: "foo", description: "Short desc" });
    });

    test("handles CRLF line endings", () => {
      const text = "---\r\nname: foo\r\ndescription: Bar\r\n---\r\n# Heading";
      const fm = extractFrontmatter(text);
      assert.deepEqual(fm, { name: "foo", description: "Bar" });
    });

    test("parses folded scalar (>-)", () => {
      const text = "---\ndescription: >-\n  first line\n  second line\n---\n";
      const fm = extractFrontmatter(text);
      assert.deepEqual(fm, { description: "first line second line" });
    });

    test("parses literal scalar (|) preserving newlines", () => {
      const text = "---\ndescription: |\n  line one\n  line two\n---\n";
      const fm = extractFrontmatter(text);
      assert.ok(fm);
      assert.equal(fm!.description, "line one\nline two");
    });

    test("skips lines that are not key/value pairs", () => {
      const text = "---\nname: foo\n# A comment\ndescription: bar\n---\n";
      const fm = extractFrontmatter(text);
      assert.deepEqual(fm, { name: "foo", description: "bar" });
    });

    test("does not loop on input that could trigger ReDoS in the original regex", () => {
      // Pathological input: many dashes without proper delimiter. A catastrophic
      // backtracking regex would hang; the indexOf-based parser must terminate.
      const pathological = "---\n" + "-".repeat(10000) + "\n";
      const start = Date.now();
      const fm = extractFrontmatter(pathological);
      const elapsed = Date.now() - start;
      // Should return null (no closing delimiter) or a partial parse, but must
      // complete quickly (< 100ms even on slow CI).
      assert.ok(elapsed < 500, `extractFrontmatter took ${elapsed}ms on pathological input`);
      assert.ok(fm === null || typeof fm === "object");
    });
  });

  describe("extractSummary", () => {
    test("collects lines after ## Purpose heading", () => {
      const md = "# Title\n\n## Purpose\n\nFirst summary line.\nSecond line.\n\n## Next";
      const summary = extractSummary(md);
      assert.equal(summary, "First summary line. Second line.");
    });

    test("falls back to first paragraph when no Purpose section", () => {
      const md = "# Title\n\nThis is the first paragraph.\n\n## Next\n";
      const summary = extractSummary(md);
      assert.equal(summary, "This is the first paragraph.");
    });

    test("skips HTML comments and blockquotes in Purpose section", () => {
      const md = "## Purpose\n\n<!-- meta -->\n> note\nReal summary.\n";
      const summary = extractSummary(md);
      assert.equal(summary, "Real summary.");
    });

    test("returns empty string for empty input", () => {
      assert.equal(extractSummary(""), "");
    });
  });

  describe("cleanDesc", () => {
    test("collapses whitespace runs", () => {
      assert.equal(cleanDesc("foo    bar\n\nbaz"), "foo bar baz");
    });

    test("strips surrounding single and double quotes", () => {
      assert.equal(cleanDesc('"quoted"'), "quoted");
      assert.equal(cleanDesc("'quoted'"), "quoted");
    });

    test("caps at 240 characters", () => {
      const long = "a".repeat(500);
      assert.equal(cleanDesc(long).length, 240);
    });

    test("handles non-string input via String() coercion", () => {
      assert.equal(cleanDesc(null as unknown as string), "null");
    });
  });

  describe("getSkillName", () => {
    test("returns frontmatter name when present", () => {
      const md = "---\nname: awesome-skill\n---\n# Heading\n";
      assert.equal(getSkillName("unused-dir", md), "awesome-skill");
    });

    test("falls back to first H1 when frontmatter missing", () => {
      const md = "# My First Skill\n\nBody";
      assert.equal(getSkillName("unused-dir", md), "My First Skill");
    });

    test("strips leading slash from H1 name", () => {
      const md = "# /slashed\n";
      assert.equal(getSkillName("unused-dir", md), "slashed");
    });

    test("falls back to dir basename when neither frontmatter nor H1 is parseable", () => {
      const md = "No heading, no frontmatter.\n";
      assert.equal(getSkillName("my-dir", md), "my-dir");
    });
  });

  describe("extractSkillDescription", () => {
    test("uses frontmatter description when present", () => {
      const md = '---\nname: x\ndescription: "Short and sweet."\n---\n# Heading\n';
      assert.equal(extractSkillDescription(md), "Short and sweet.");
    });

    test("falls back to first non-skip line after H1", () => {
      const md = "# Heading\n\n<!-- comment -->\n> note\nReal body text.\n";
      assert.equal(extractSkillDescription(md), "Real body text.");
    });

    test("returns empty string if only headings/skips follow H1", () => {
      const md = "# Heading\n\n## Sub\n";
      assert.equal(extractSkillDescription(md), "");
    });
  });

  describe("CLI smoke", () => {
    test("script executes without throwing and writes llms.txt", () => {
      const result = spawnSync(process.execPath, [scriptPath], {
        cwd: PROJECT_ROOT,
        encoding: "utf8",
        timeout: 20000,
      });
      assert.equal(result.status, 0, `stderr: ${result.stderr}`);
      assert.match(result.stdout, /Wrote .*llms\.txt/);
      const llmsPath = path.resolve(PROJECT_ROOT, "llms.txt");
      assert.ok(fs.existsSync(llmsPath));
      const content = fs.readFileSync(llmsPath, "utf8");
      assert.match(content, /^# SoNash/);
      assert.match(content, /## Skills \(\d+\)/);
    });
  });
});
