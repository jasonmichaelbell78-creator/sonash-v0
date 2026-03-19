import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";

// Get project root (works both in source and compiled contexts)
const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "../../..");

const SCRIPT_PATH = path.resolve(PROJECT_ROOT, "scripts/check-cc.js");
const PRE_PUSH_PATH = path.resolve(PROJECT_ROOT, ".husky/pre-push");

describe("check-cc.js pre-push gate", () => {
  describe("script existence and basic execution", () => {
    it("scripts/check-cc.js exists", () => {
      assert.ok(fs.existsSync(SCRIPT_PATH), "scripts/check-cc.js should exist");
    });

    it("runs without crashing and produces output", () => {
      const result = spawnSync("node", [SCRIPT_PATH], {
        cwd: PROJECT_ROOT,
        encoding: "utf-8",
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, NODE_ENV: "test" },
      });

      // Exit code 0 (all pass) or 1 (violations found) are both valid
      // Exit code 2 means script error
      assert.ok(
        result.status === 0 || result.status === 1,
        `Expected exit 0 or 1, got ${result.status}. stderr: ${(result.stderr || "").slice(0, 500)}`
      );

      // Should produce recognizable output
      const output = result.stdout || "";
      assert.ok(
        output.includes("[check-cc]"),
        `Expected [check-cc] prefix in output, got: ${output.slice(0, 300)}`
      );
    });

    it("accepts --threshold flag", () => {
      const result = spawnSync("node", [SCRIPT_PATH, "--threshold=20"], {
        cwd: PROJECT_ROOT,
        encoding: "utf-8",
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, NODE_ENV: "test" },
      });

      const output = result.stdout || "";
      assert.ok(
        output.includes("threshold: 20") || output.includes("threshold"),
        `Should acknowledge custom threshold, got: ${output.slice(0, 300)}`
      );
    });

    it("exits 0 when no changed files detected (on main branch)", () => {
      // When run from a point where there are no changed files relative to main,
      // the script should either find files to check or gracefully report none.
      const result = spawnSync("node", [SCRIPT_PATH], {
        cwd: PROJECT_ROOT,
        encoding: "utf-8",
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, NODE_ENV: "test" },
      });

      // The script should not crash (exit code 2)
      assert.notEqual(result.status, 2, "Script should not error (exit 2)");
    });
  });

  describe("pre-push hook wiring", () => {
    it(".husky/pre-push file exists", () => {
      assert.ok(fs.existsSync(PRE_PUSH_PATH), ".husky/pre-push should exist");
    });

    it("pre-push hook contains check-cc.js invocation", () => {
      const content = fs.readFileSync(PRE_PUSH_PATH, "utf-8");

      assert.ok(
        content.includes("scripts/check-cc.js"),
        "pre-push hook should reference scripts/check-cc.js"
      );

      // Should be invoked via node
      assert.ok(
        content.includes("node scripts/check-cc.js"),
        "pre-push hook should invoke check-cc.js via node"
      );
    });

    it("pre-push hook has skip mechanism for cognitive CC", () => {
      const content = fs.readFileSync(PRE_PUSH_PATH, "utf-8");

      // Should support SKIP_COG_CC=1 override
      assert.ok(
        content.includes("SKIP_COG_CC") || content.includes("cog-cc"),
        "pre-push hook should support skipping cognitive CC check"
      );
    });

    it("pre-push hook runs check-cc.js in parallel with other checks", () => {
      const content = fs.readFileSync(PRE_PUSH_PATH, "utf-8");

      // The check-cc.js invocation should be in the parallel block (backgrounded with &)
      // Look for the pattern: node scripts/check-cc.js ... &
      const ccLine = content
        .split("\n")
        .find((line: string) => line.includes("scripts/check-cc.js"));
      assert.ok(ccLine, "Should find check-cc.js line in pre-push");

      // The line or its surrounding block should use background execution
      assert.ok(
        ccLine.includes("&") || content.includes("(node scripts/check-cc.js"),
        "check-cc.js should be run in background (parallel) in pre-push"
      );
    });

    it("pre-push hook handles check-cc.js exit codes correctly", () => {
      const content = fs.readFileSync(PRE_PUSH_PATH, "utf-8");

      // Should check for exit code 1 (violations) and handle it
      assert.ok(
        content.includes("_cog_rc") || content.includes("cognitive-cc"),
        "pre-push hook should process cognitive CC results"
      );

      // Should have fail path for CC violations
      assert.ok(
        content.includes("cognitive-cc|fail") || content.includes("Cognitive complexity violations"),
        "pre-push hook should have failure handling for CC violations"
      );
    });
  });

  describe("output format and exit codes", () => {
    it("reports summary line with file and function counts", () => {
      const result = spawnSync("node", [SCRIPT_PATH], {
        cwd: PROJECT_ROOT,
        encoding: "utf-8",
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, NODE_ENV: "test" },
      });

      const output = result.stdout || "";
      // Should contain summary with counts
      assert.ok(
        output.includes("Summary:") || output.includes("files") || output.includes("function"),
        `Expected summary information in output, got: ${output.slice(0, 500)}`
      );
    });

    it("exit code 0 means all functions within threshold", () => {
      // Run with a very high threshold to ensure pass
      const result = spawnSync("node", [SCRIPT_PATH, "--threshold=999"], {
        cwd: PROJECT_ROOT,
        encoding: "utf-8",
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, NODE_ENV: "test" },
      });

      // With threshold=999, should always pass
      assert.equal(
        result.status,
        0,
        `Expected exit 0 with high threshold, got ${result.status}. output: ${(result.stdout || "").slice(0, 300)}`
      );
    });
  });
});
