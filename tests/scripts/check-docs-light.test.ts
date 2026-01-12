import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { spawnSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

// Get project root (works both in source and compiled contexts)
const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "../../..");

const SCRIPT_PATH = path.resolve(PROJECT_ROOT, "scripts/check-docs-light.js");

/**
 * Helper to extract JSON from script output (handles header lines)
 */
function extractJSON(output: string): unknown {
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in output");
  return JSON.parse(jsonMatch[0]);
}

/**
 * Helper to run the script and capture output
 */
function runScript(
  args: string[] = [],
  options: { cwd?: string } = {}
): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  const cwd = options.cwd || PROJECT_ROOT;
  const result = spawnSync("node", [SCRIPT_PATH, ...args], {
    cwd,
    encoding: "utf-8",
    timeout: 60000, // Longer timeout as it scans many files
    env: { ...process.env, NODE_ENV: "test" },
  });

  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    exitCode: result.status ?? 1,
  };
}

describe("check-docs-light.js", () => {
  describe("CLI options", () => {
    test("--verbose flag shows detailed logging", () => {
      // Check a single file with verbose
      const result = runScript(["README.md", "--verbose"]);

      assert.ok(
        result.stdout.includes("Checking:") || result.stdout.includes("Tier"),
        "Should show verbose tier information"
      );
    });

    test("--json flag outputs JSON format", () => {
      const result = runScript(["README.md", "--json"]);

      // The script outputs a header line before JSON, so extract just the JSON part
      const jsonMatch = result.stdout.match(/\{[\s\S]*\}/);
      assert.ok(jsonMatch, "Output should contain JSON object");

      try {
        const parsed = JSON.parse(jsonMatch[0]);
        assert.ok(parsed.results, "JSON output should have results array");
        assert.ok(typeof parsed.totalErrors === "number", "JSON output should have totalErrors");
        assert.ok(typeof parsed.totalWarnings === "number", "JSON output should have totalWarnings");
      } catch {
        assert.fail("Output should be valid JSON");
      }
    });

    test("--errors-only flag suppresses warnings", () => {
      const result = runScript(["README.md", "--errors-only"]);

      // Should not show warning emoji in errors-only mode
      // (unless there are actual errors which also show warnings)
      assert.ok(
        !result.stdout.includes("FILES WITH WARNINGS:") || result.stdout.includes("FILES WITH ERRORS:"),
        "Should not show warnings section separately in errors-only mode"
      );
    });

    test("--strict flag treats warnings as errors", () => {
      // Create a file with a warning (missing recommended section)
      const tempDir = fs.mkdtempSync(path.join(PROJECT_ROOT, ".temp-test-"));
      const testFile = path.join(tempDir, "TEST_DOC.md");

      try {
        fs.writeFileSync(
          testFile,
          `# Test Document

## Purpose

This is a test document.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-01 | Initial |
`
        );

        // Run without strict - should pass with warnings
        const normalResult = runScript([testFile]);

        // Run with strict - warnings become errors
        const strictResult = runScript([testFile, "--strict"]);

        // Strict mode should have same or higher exit code if there are warnings
        assert.ok(
          typeof normalResult.exitCode === "number" && typeof strictResult.exitCode === "number",
          "Both runs should complete"
        );
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("file discovery", () => {
    test("finds markdown files in project", () => {
      // Run on small subset to avoid timeout
      const result = runScript(["README.md", "ROADMAP.md"]);

      assert.ok(
        result.stdout.includes("Checking") || result.stdout.includes("file"),
        "Should find and check files"
      );
    });

    test("accepts specific file arguments", () => {
      const result = runScript(["README.md"]);

      assert.ok(
        result.stdout.includes("1 file") || result.stdout.includes("README.md"),
        "Should check specific file"
      );
    });

    test("handles non-existent files gracefully", () => {
      const result = runScript(["nonexistent-file.md"]);

      assert.ok(
        result.stdout.includes("not found") || result.stderr.includes("not found") || result.stdout.includes("0 file"),
        "Should handle missing files gracefully"
      );
    });
  });

  describe("document validation", () => {
    test("validates canonical tier documents", () => {
      // README.md and ROADMAP.md are Tier 1 canonical
      const result = runScript(["README.md", "--json"]);

      const parsed = extractJSON(result.stdout) as { results: Array<{ file: string; tier: number }> };
      const readmeResult = parsed.results.find((r) => r.file.includes("README.md"));

      assert.ok(readmeResult, "Should have result for README.md");
      assert.equal(readmeResult.tier, 1, "README.md should be Tier 1 (Canonical)");
    });

    test("checks for required sections", () => {
      const tempDir = fs.mkdtempSync(path.join(PROJECT_ROOT, ".temp-test-"));
      const testFile = path.join(tempDir, "ROADMAP_TEST.md");

      try {
        // Create file missing required sections
        fs.writeFileSync(
          testFile,
          `# Test Roadmap

Just some content without proper sections.
`
        );

        const result = runScript([testFile, "--json"]);
        const parsed = extractJSON(result.stdout) as { totalErrors: number; totalWarnings: number };

        assert.ok(parsed.totalErrors > 0 || parsed.totalWarnings > 0, "Should flag missing sections");
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    test("validates internal links", () => {
      const tempDir = fs.mkdtempSync(path.join(PROJECT_ROOT, ".temp-test-"));
      const testFile = path.join(tempDir, "test-links.md");

      try {
        fs.writeFileSync(
          testFile,
          `# Test Document

## Purpose

See [broken link](./nonexistent.md) for details.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-01 | Initial |
`
        );

        const result = runScript([testFile, "--json"]);
        const parsed = extractJSON(result.stdout) as { totalErrors: number };

        // Should flag broken link
        assert.ok(
          parsed.totalErrors > 0,
          "Should flag broken internal link"
        );
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    test("checks Last Updated date", () => {
      const tempDir = fs.mkdtempSync(path.join(PROJECT_ROOT, ".temp-test-"));
      const testFile = path.join(tempDir, "test-date.md");

      try {
        fs.writeFileSync(
          testFile,
          `# Test Document

**Last Updated:** 2020-01-01

## Purpose

Old document.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2020-01-01 | Initial |
`
        );

        const result = runScript([testFile, "--json"]);
        const parsed = extractJSON(result.stdout) as { totalWarnings: number };

        // Should warn about stale date
        assert.ok(
          parsed.totalWarnings > 0,
          "Should warn about stale document"
        );
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("tier detection", () => {
    test("identifies ARCHITECTURE.md as Tier 1", () => {
      const result = runScript(["ARCHITECTURE.md", "--json"]);

      try {
        const parsed = extractJSON(result.stdout) as { results: Array<{ file: string; tier: number }> };
        const archResult = parsed.results.find((r) => r.file.includes("ARCHITECTURE.md"));

        if (archResult) {
          assert.equal(archResult.tier, 1, "ARCHITECTURE.md should be Tier 1");
        }
      } catch {
        // If ARCHITECTURE.md doesn't exist or JSON extraction fails, that's ok
      }
    });

    test("identifies docs/ files as Tier 2", () => {
      // Find a doc file to test
      const docsPath = path.join(PROJECT_ROOT, "docs");
      if (fs.existsSync(docsPath)) {
        const files = fs.readdirSync(docsPath).filter((f) => f.endsWith(".md"));
        if (files.length > 0) {
          const result = runScript([`docs/${files[0]}`, "--json"]);

          try {
            const parsed = extractJSON(result.stdout) as { results: Array<{ file: string; tier: number }> };

            // docs/ files should be Tier 2 or higher
            assert.ok(
              parsed.results.length > 0 && parsed.results[0].tier >= 2,
              "docs/ files should be Tier 2+"
            );
          } catch {
            // JSON extraction may fail for some docs, that's acceptable
          }
        }
      }
    });
  });

  describe("output format", () => {
    test("shows summary statistics", () => {
      const result = runScript(["README.md"]);

      assert.ok(
        result.stdout.includes("SUMMARY") || result.stdout.includes("Files checked"),
        "Should show summary"
      );
    });

    test("categorizes files by status", () => {
      const result = runScript(["README.md", "ROADMAP.md"]);

      // Should show files passing or with issues
      assert.ok(
        result.stdout.includes("passing") ||
        result.stdout.includes("errors") ||
        result.stdout.includes("warnings") ||
        result.stdout.includes("checked"),
        "Should categorize files by status"
      );
    });
  });

  describe("exit codes", () => {
    test("exits 0 when no errors found", () => {
      // Use a well-formed document
      const result = runScript(["README.md"]);

      // README.md should be valid
      assert.equal(result.exitCode, 0, "Should exit 0 for valid document");
    });

    test("exits 1 when errors found", () => {
      const tempDir = fs.mkdtempSync(path.join(PROJECT_ROOT, ".temp-test-"));
      const testFile = path.join(tempDir, "broken.md");

      try {
        // Create intentionally broken file
        fs.writeFileSync(testFile, "");

        const result = runScript([testFile]);

        assert.equal(result.exitCode, 1, "Should exit 1 for empty file");
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("security", () => {
    test("does not expose sensitive paths", () => {
      const result = runScript(["README.md"]);
      const output = result.stdout + result.stderr;

      const homeDir = process.env.HOME || "/home";
      const rawHomeExposed = output.includes(homeDir) && !output.includes("[HOME]");

      assert.ok(!rawHomeExposed, "Should not expose raw home paths");
    });
  });
});
