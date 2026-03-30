import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";

const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "../../..");

const SCRIPT_PATH = path.resolve(PROJECT_ROOT, "scripts/check-propagation-staged.js");

function runScript(
  args: string[] = [],
  options: { cwd?: string; env?: Record<string, string> } = {}
): { stdout: string; stderr: string; exitCode: number } {
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
      const result = runScript(["--staged-files", ""]);
      assert.equal(result.exitCode, 0);
    });

    it("exits 0 when only non-JS files staged", () => {
      const result = runScript(["--staged-files", "README.md docs/foo.txt"]);
      assert.equal(result.exitCode, 0);
    });
  });

  describe("SKIP_PROPAGATION_STAGED env var", () => {
    it("exits 0 when SKIP_PROPAGATION_STAGED is set", () => {
      const result = runScript([], { env: { SKIP_PROPAGATION_STAGED: "1" } });
      assert.equal(result.exitCode, 0);
      assert.ok(result.stdout.includes("Skipped") || result.stdout.includes("skipped"));
    });
  });

  describe("--json output format", () => {
    it("produces valid JSON with required fields", () => {
      const result = runScript(["--staged-files", "", "--json"]);
      const json = JSON.parse(result.stdout);
      assert.ok(Array.isArray(json.triggered));
      assert.ok(Array.isArray(json.misses));
      assert.equal(typeof json.blocked, "boolean");
      assert.equal(typeof json.duration_ms, "number");
    });

    it("empty result when no JS files staged", () => {
      const result = runScript(["--staged-files", "", "--json"]);
      assert.equal(result.exitCode, 0);
      const json = JSON.parse(result.stdout);
      assert.deepEqual(json.triggered, []);
      assert.deepEqual(json.misses, []);
      assert.equal(json.blocked, false);
    });
  });

  describe("module exports", () => {
    it("exports runCheck function", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(SCRIPT_PATH);
      assert.equal(typeof mod.runCheck, "function");
      assert.equal(typeof mod.fileContainsPattern, "function");
      assert.equal(typeof mod.getSiblingFiles, "function");
      assert.ok(Array.isArray(mod.SECURITY_PATTERNS));
    });

    it("SECURITY_PATTERNS loaded from registry includes expected patterns", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { SECURITY_PATTERNS } = require(SCRIPT_PATH);
      const ids = new Set(SECURITY_PATTERNS.map((p: { id: string }) => p.id));
      assert.ok(ids.has("sanitize-error"));
      assert.ok(ids.has("safe-to-write"));
      assert.ok(ids.has("lstat-symlink"));
      assert.ok(ids.has("validate-path"));
      assert.ok(ids.has("escape-cell"));
    });

    it("SECURITY_PATTERNS entries have severity field", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { SECURITY_PATTERNS } = require(SCRIPT_PATH);
      for (const pattern of SECURITY_PATTERNS) {
        assert.ok(
          pattern.severity === "BLOCK" || pattern.severity === "WARN",
          `Pattern ${pattern.id} should have BLOCK or WARN severity`
        );
      }
    });

    it("runCheck returns result shape with triggered and misses", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { runCheck } = require(SCRIPT_PATH);
      const result = runCheck({ stagedFiles: [] });
      assert.ok(Array.isArray(result.warnings));
      assert.equal(typeof result.stagedCount, "number");
      assert.ok(Array.isArray(result.triggered));
      assert.ok(Array.isArray(result.misses));
      assert.equal(typeof result.blocked, "boolean");
      assert.equal(typeof result.duration_ms, "number");
    });
  });
});
