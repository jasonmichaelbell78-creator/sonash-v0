import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";

// Get project root (works both in source and compiled contexts)
const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "../../..");

const SCRIPT_PATH = path.resolve(PROJECT_ROOT, "scripts/check-propagation-staged.js");

/**
 * Helper to run the propagation-staged script with given args
 */
function runScript(
  args: string[] = [],
  options: { cwd?: string; env?: Record<string, string> } = {}
): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  const cwd = options.cwd || PROJECT_ROOT;
  const result = spawnSync("node", [SCRIPT_PATH, ...args], {
    cwd,
    encoding: "utf-8",
    timeout: 30000,
    maxBuffer: 5 * 1024 * 1024,
    env: { ...process.env, ...options.env, NODE_ENV: "test" },
  });

  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    exitCode: result.status ?? 1,
  };
}

describe("check-propagation-staged.js", () => {
  describe("script loads and runs", () => {
    it("exits 0 when no staged files", () => {
      // Provide empty staged files to avoid git dependency
      const result = runScript(["--staged-files", ""]);
      assert.equal(result.exitCode, 0);
      assert.ok(
        result.stdout.includes("No JS/TS files staged") || result.stdout.includes("skipping"),
        `Expected skip message, got: ${result.stdout}`
      );
    });

    it("exits 0 when only non-JS files staged", () => {
      const result = runScript(["--staged-files", "README.md docs/foo.txt"]);
      assert.equal(result.exitCode, 0);
    });
  });

  describe("propagation detection with temp directory", () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(PROJECT_ROOT, ".temp-prop-test-"));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it("detects propagation miss when sibling has same security pattern", () => {
      // Create two files both containing sanitizeError
      const fileA = path.join(tempDir, "scriptA.js");
      const fileB = path.join(tempDir, "scriptB.js");

      fs.writeFileSync(
        fileA,
        `const { sanitizeError } = require('./lib/sanitize-error');
function doStuff(err) {
  return sanitizeError(err);
}
module.exports = { doStuff };
`
      );

      fs.writeFileSync(
        fileB,
        `const { sanitizeError } = require('./lib/sanitize-error');
function doOtherStuff(err) {
  return sanitizeError(err);
}
module.exports = { doOtherStuff };
`
      );

      // Compute repo-relative path for staged file A (file B is the unstaged sibling)
      const relA = path.relative(PROJECT_ROOT, fileA).replaceAll("\\", "/");

      const result = runScript(["--staged-files", relA, "--verbose"]);

      // Should detect that scriptB.js also has sanitizeError but isn't staged
      assert.ok(
        result.stdout.includes("propagation miss") || result.stdout.includes("Propagation miss"),
        `Expected propagation miss warning, got: ${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("scriptB.js"),
        `Expected scriptB.js in output, got: ${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("sanitizeError"),
        `Expected sanitizeError pattern name in output, got: ${result.stdout}`
      );
    });

    it("does not warn when both siblings are staged", () => {
      const fileA = path.join(tempDir, "both-staged-a.js");
      const fileB = path.join(tempDir, "both-staged-b.js");

      fs.writeFileSync(
        fileA,
        `const { sanitizeError } = require('./lib/sanitize-error');
module.exports = { fix: (e) => sanitizeError(e) };
`
      );

      fs.writeFileSync(
        fileB,
        `const { sanitizeError } = require('./lib/sanitize-error');
module.exports = { fix: (e) => sanitizeError(e) };
`
      );

      const relA = path.relative(PROJECT_ROOT, fileA).replaceAll("\\", "/");
      const relB = path.relative(PROJECT_ROOT, fileB).replaceAll("\\", "/");

      // Stage both files
      const result = runScript(["--staged-files", `${relA} ${relB}`]);

      assert.ok(
        !result.stdout.includes("Propagation miss:"),
        `Should not warn when both files staged, got: ${result.stdout}`
      );
      assert.equal(result.exitCode, 0);
    });

    it("does not warn when sibling does not contain the pattern", () => {
      const fileA = path.join(tempDir, "has-pattern.js");
      const fileB = path.join(tempDir, "no-pattern.js");

      fs.writeFileSync(
        fileA,
        `const { sanitizeError } = require('./lib/sanitize-error');
module.exports = { fix: (e) => sanitizeError(e) };
`
      );

      fs.writeFileSync(
        fileB,
        `// This file has no security patterns
function plainFunction() { return 42; }
module.exports = { plainFunction };
`
      );

      const relA = path.relative(PROJECT_ROOT, fileA).replaceAll("\\", "/");

      const result = runScript(["--staged-files", relA]);

      assert.ok(
        !result.stdout.includes("Propagation miss:"),
        `Should not warn when sibling lacks the pattern, got: ${result.stdout}`
      );
      assert.equal(result.exitCode, 0);
    });

    it("detects isSafeToWrite pattern propagation miss", () => {
      const fileA = path.join(tempDir, "writerA.js");
      const fileB = path.join(tempDir, "writerB.js");

      fs.writeFileSync(
        fileA,
        `const { isSafeToWrite } = require('./lib/safe-fs');
if (isSafeToWrite(path)) { fs.writeFileSync(path, data); }
`
      );

      fs.writeFileSync(
        fileB,
        `const { isSafeToWrite } = require('./lib/safe-fs');
if (isSafeToWrite(target)) { fs.writeFileSync(target, content); }
`
      );

      const relA = path.relative(PROJECT_ROOT, fileA).replaceAll("\\", "/");

      const result = runScript(["--staged-files", relA]);

      assert.ok(
        result.stdout.includes("propagation miss") || result.stdout.includes("Propagation miss"),
        `Expected isSafeToWrite propagation miss, got: ${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("isSafeToWrite"),
        `Expected isSafeToWrite in output, got: ${result.stdout}`
      );
    });

    it("exits 1 in blocking mode when misses found", () => {
      const fileA = path.join(tempDir, "blockA.js");
      const fileB = path.join(tempDir, "blockB.js");

      fs.writeFileSync(
        fileA,
        `function x() { return sanitizeError(new Error("test")); }
`
      );

      fs.writeFileSync(
        fileB,
        `function y() { return sanitizeError(new Error("other")); }
`
      );

      const relA = path.relative(PROJECT_ROOT, fileA).replaceAll("\\", "/");

      const result = runScript(["--staged-files", relA, "--blocking"]);

      assert.equal(result.exitCode, 1, `Expected exit 1 in blocking mode, got: ${result.exitCode}`);
      assert.ok(
        result.stdout.includes("BLOCKING"),
        `Expected BLOCKING message, got: ${result.stdout}`
      );
    });

    it("exits 0 in non-blocking mode when misses found", () => {
      const fileA = path.join(tempDir, "warnA.js");
      const fileB = path.join(tempDir, "warnB.js");

      fs.writeFileSync(
        fileA,
        `function x() { return sanitizeError(new Error("test")); }
`
      );

      fs.writeFileSync(
        fileB,
        `function y() { return sanitizeError(new Error("other")); }
`
      );

      const relA = path.relative(PROJECT_ROOT, fileA).replaceAll("\\", "/");

      const result = runScript(["--staged-files", relA]);

      assert.equal(
        result.exitCode,
        0,
        `Expected exit 0 in non-blocking mode, got: ${result.exitCode}`
      );
      assert.ok(
        result.stdout.includes("WARNING"),
        `Expected WARNING message, got: ${result.stdout}`
      );
    });

    it("skips non-JS sibling files", () => {
      const fileA = path.join(tempDir, "jsfile.js");
      const fileB = path.join(tempDir, "readme.md");

      fs.writeFileSync(
        fileA,
        `function x() { return sanitizeError(new Error("test")); }
`
      );

      // Write a markdown file with the pattern text (should be ignored)
      fs.writeFileSync(fileB, `# Docs\nUse sanitizeError( for all error handling.\n`);

      const relA = path.relative(PROJECT_ROOT, fileA).replaceAll("\\", "/");

      const result = runScript(["--staged-files", relA]);

      // Should not warn because readme.md is not a JS/TS file
      assert.ok(
        !result.stdout.includes("Propagation miss:"),
        `Should skip non-JS siblings, got: ${result.stdout}`
      );
    });
  });

  describe("module exports", () => {
    it("exports runCheck function", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(SCRIPT_PATH);
      assert.ok(typeof mod.runCheck === "function", "Should export runCheck");
      assert.ok(typeof mod.fileContainsPattern === "function", "Should export fileContainsPattern");
      assert.ok(typeof mod.getSiblingFiles === "function", "Should export getSiblingFiles");
      assert.ok(Array.isArray(mod.SECURITY_PATTERNS), "Should export SECURITY_PATTERNS array");
    });

    it("SECURITY_PATTERNS includes expected patterns", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { SECURITY_PATTERNS } = require(SCRIPT_PATH);
      const ids = new Set(SECURITY_PATTERNS.map((p: { id: string }) => p.id));
      assert.ok(ids.has("sanitize-error"), "Should include sanitize-error pattern");
      assert.ok(ids.has("safe-write"), "Should include safe-write pattern");
      assert.ok(ids.has("symlink-guard"), "Should include symlink-guard pattern");
      assert.ok(ids.has("lstat-guard"), "Should include lstat-guard pattern");
      assert.ok(ids.has("path-containment"), "Should include path-containment pattern");
    });
  });
});
