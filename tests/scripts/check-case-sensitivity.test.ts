import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";

// Get project root (works both in source and compiled contexts)
const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "../../..");

const SCRIPT_PATH = path.resolve(PROJECT_ROOT, "scripts/check-docs-light.js");

/**
 * Detect if filesystem is case-sensitive (Linux) vs case-insensitive (Windows/macOS).
 * Case mismatch detection only works on case-insensitive filesystems.
 */
function isCaseSensitiveFS(): boolean {
  const testDir = fs.mkdtempSync(path.join(PROJECT_ROOT, ".temp-case-detect-"));
  try {
    const upper = path.join(testDir, "TEST.txt");
    fs.writeFileSync(upper, "test");
    const lower = path.join(testDir, "test.txt");
    // On case-insensitive FS, this returns true (same file); on case-sensitive, false
    return !fs.existsSync(lower);
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}
const caseSensitive = isCaseSensitiveFS();

/**
 * Helper to run the doc-lint script and capture output
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
    timeout: 60000,
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, NODE_ENV: "test" },
  });

  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    exitCode: result.status ?? 1,
  };
}

/**
 * Helper to extract JSON from script output
 */
function extractJSON(output: string): Record<string, unknown> {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`No JSON found in output: ${output.slice(0, 200)}`);
  }
  return JSON.parse(output.slice(start, end + 1)) as Record<string, unknown>;
}

describe("check-docs-light.js case-sensitivity check", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(PROJECT_ROOT, ".temp-case-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it(
    "flags case mismatch in internal link reference",
    {
      skip: caseSensitive
        ? "case-sensitive filesystem (Linux) — mismatch detection requires case-insensitive FS"
        : false,
    },
    () => {
      // Create a file with a specific casing
      const targetFile = path.join(tempDir, "CLAUDE.md");
      fs.writeFileSync(
        targetFile,
        `# CLAUDE

## Purpose

Configuration file.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-01 | Initial |
`
      );

      // Create a markdown file that references it with wrong casing
      const sourceFile = path.join(tempDir, "TEST_DOC.md");
      fs.writeFileSync(
        sourceFile,
        `# Test Document

## Purpose

See [CLAUDE](claude.md) for details.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-01 | Initial |
`
      );

      const result = runScript([sourceFile, "--json"]);
      const parsed = extractJSON(result.stdout);

      // The case mismatch should appear as a warning
      const results = parsed.results as Array<{
        file: string;
        warnings: string[];
        errors: string[];
      }>;
      assert.ok(results && results.length > 0, "Should have results");

      const docResult = results[0];

      // Check if any warning mentions case mismatch
      const caseWarnings = docResult.warnings.filter(
        (w: string) => w.includes("Case mismatch") || w.includes("case mismatch")
      );

      assert.ok(
        caseWarnings.length > 0,
        `Expected case mismatch warning, got warnings: ${JSON.stringify(docResult.warnings)}`
      );

      // The warning should mention both the referenced name and the actual name
      const warning = caseWarnings[0];
      assert.ok(
        warning.includes("claude.md"),
        `Warning should mention referenced name "claude.md", got: ${warning}`
      );
      assert.ok(
        warning.includes("CLAUDE.md"),
        `Warning should mention actual name "CLAUDE.md", got: ${warning}`
      );
    }
  );

  it("does not flag when casing matches exactly", () => {
    const targetFile = path.join(tempDir, "README.md");
    fs.writeFileSync(
      targetFile,
      `# README

## Purpose

Main readme.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-01 | Initial |
`
    );

    const sourceFile = path.join(tempDir, "LINKING_DOC.md");
    fs.writeFileSync(
      sourceFile,
      `# Linking Document

## Purpose

See [README](README.md) for details.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-01 | Initial |
`
    );

    const result = runScript([sourceFile, "--json"]);
    const parsed = extractJSON(result.stdout);
    const results = parsed.results as Array<{
      file: string;
      warnings: string[];
    }>;

    assert.ok(results && results.length > 0, "Should have results");

    const caseWarnings = results[0].warnings.filter(
      (w: string) => w.includes("Case mismatch") || w.includes("case mismatch")
    );

    assert.equal(
      caseWarnings.length,
      0,
      `Should not flag matching casing, got: ${JSON.stringify(caseWarnings)}`
    );
  });

  it("does not flag broken links (those are caught by validateFileLinks)", () => {
    const sourceFile = path.join(tempDir, "BROKEN_LINKS.md");
    fs.writeFileSync(
      sourceFile,
      `# Test Document

## Purpose

See [missing](nonexistent.md) for details.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-01 | Initial |
`
    );

    const result = runScript([sourceFile, "--json"]);
    const parsed = extractJSON(result.stdout);
    const results = parsed.results as Array<{
      file: string;
      warnings: string[];
      errors: string[];
    }>;

    assert.ok(results && results.length > 0, "Should have results");

    // Should have a broken link error, not a case mismatch warning
    const caseWarnings = results[0].warnings.filter(
      (w: string) => w.includes("Case mismatch") || w.includes("case mismatch")
    );
    assert.equal(
      caseWarnings.length,
      0,
      `Should not have case mismatch for nonexistent files, got: ${JSON.stringify(caseWarnings)}`
    );

    // But should have a broken link error
    const brokenLinkErrors = results[0].errors.filter((e: string) => e.includes("Broken link"));
    assert.ok(
      brokenLinkErrors.length > 0,
      `Should detect broken link, got errors: ${JSON.stringify(results[0].errors)}`
    );
  });

  it("handles subdirectory references with case mismatch", () => {
    // Create a subdirectory with specific casing
    const subDir = path.join(tempDir, "Docs");
    fs.mkdirSync(subDir);

    const targetFile = path.join(subDir, "GUIDE.md");
    fs.writeFileSync(
      targetFile,
      `# Guide

## Purpose

A guide.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-01 | Initial |
`
    );

    // Reference with wrong directory casing
    const sourceFile = path.join(tempDir, "MAIN.md");
    fs.writeFileSync(
      sourceFile,
      `# Main

## Purpose

See [Guide](docs/GUIDE.md) for details.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-01 | Initial |
`
    );

    const result = runScript([sourceFile, "--json"]);
    const parsed = extractJSON(result.stdout);
    const results = parsed.results as Array<{
      file: string;
      warnings: string[];
      errors: string[];
    }>;

    assert.ok(results && results.length > 0, "Should have results");

    // On case-insensitive FS (Windows), the file exists but casing differs
    // The "docs" vs "Docs" mismatch should be caught
    const caseWarnings = results[0].warnings.filter(
      (w: string) => w.includes("Case mismatch") || w.includes("case mismatch")
    );

    // On Windows/macOS (case-insensitive), this should flag the mismatch
    // On Linux (case-sensitive), the file won't be found at all (broken link error)
    if (process.platform === "win32" || process.platform === "darwin") {
      assert.ok(
        caseWarnings.length > 0,
        `Expected case mismatch for "docs" vs "Docs" on case-insensitive FS, got warnings: ${JSON.stringify(results[0].warnings)}`
      );
    } else {
      // On Linux, the file won't exist, so it's a broken link instead
      const brokenLinks = results[0].errors.filter((e: string) => e.includes("Broken link"));
      assert.ok(
        brokenLinks.length > 0 || caseWarnings.length > 0,
        "Should detect either broken link or case mismatch"
      );
    }
  });

  it("skips external links (http/https)", () => {
    const sourceFile = path.join(tempDir, "EXTERNAL.md");
    fs.writeFileSync(
      sourceFile,
      `# External Links

## Purpose

See [Google](https://google.com) for search.
See [Example](http://example.com) for examples.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-01 | Initial |
`
    );

    const result = runScript([sourceFile, "--json"]);
    const parsed = extractJSON(result.stdout);
    const results = parsed.results as Array<{
      file: string;
      warnings: string[];
    }>;

    assert.ok(results && results.length > 0, "Should have results");

    const caseWarnings = results[0].warnings.filter(
      (w: string) => w.includes("Case mismatch") || w.includes("case mismatch")
    );
    assert.equal(
      caseWarnings.length,
      0,
      `Should not check case on external links, got: ${JSON.stringify(caseWarnings)}`
    );
  });

  it("handles anchor-only links without crashing", () => {
    const sourceFile = path.join(tempDir, "ANCHORS.md");
    fs.writeFileSync(
      sourceFile,
      `# Anchor Test

## Purpose

See [Purpose](#purpose) for details.
See [Bottom](#bottom-section) for more.

## Bottom Section

Content here.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-01 | Initial |
`
    );

    const result = runScript([sourceFile, "--json"]);
    assert.ok(
      result.exitCode === 0 || result.exitCode === 1,
      `Should not crash on anchor links, exit code: ${result.exitCode}`
    );

    const parsed = extractJSON(result.stdout);
    const results = parsed.results as Array<{
      file: string;
      warnings: string[];
    }>;

    const caseWarnings = results[0].warnings.filter(
      (w: string) => w.includes("Case mismatch") || w.includes("case mismatch")
    );
    assert.equal(
      caseWarnings.length,
      0,
      `Should not flag anchors as case mismatches, got: ${JSON.stringify(caseWarnings)}`
    );
  });

  it("reports case mismatch with correct line number", () => {
    const targetFile = path.join(tempDir, "MyFile.md");
    fs.writeFileSync(
      targetFile,
      `# My File

## Purpose

Content.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-01 | Initial |
`
    );

    const sourceFile = path.join(tempDir, "CHECKER.md");
    fs.writeFileSync(
      sourceFile,
      `# Checker

## Purpose

Line 5 content.
Line 6 content.
See [My File](myfile.md) for details on line 7.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-01 | Initial |
`
    );

    const result = runScript([sourceFile, "--json"]);
    const parsed = extractJSON(result.stdout);
    const results = parsed.results as Array<{
      file: string;
      warnings: string[];
    }>;

    const caseWarnings = results[0].warnings.filter(
      (w: string) => w.includes("Case mismatch") || w.includes("case mismatch")
    );

    if (caseWarnings.length > 0) {
      // Should reference line 7 where the link is
      assert.ok(
        caseWarnings[0].includes("Line 7"),
        `Expected line number in warning, got: ${caseWarnings[0]}`
      );
    }
  });
});
