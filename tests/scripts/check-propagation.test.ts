import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";

const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "../../..");

const SCRIPT_PATH = path.resolve(PROJECT_ROOT, "scripts/check-propagation.js");

function runScript(
  args: string[] = [],
  options: { env?: Record<string, string> } = {}
): { stdout: string; stderr: string; exitCode: number } {
  const result = spawnSync("node", [SCRIPT_PATH, ...args], {
    cwd: PROJECT_ROOT,
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

describe("check-propagation.js", () => {
  describe("script loads and runs", () => {
    it("exits 0 when no changes detected", () => {
      const result = runScript(["--staged"]);
      assert.equal(result.exitCode, 0);
    });
  });

  describe("SKIP_PROPAGATION env var", () => {
    it("exits 0 when SKIP_PROPAGATION is set", () => {
      const result = runScript([], { env: { SKIP_PROPAGATION: "1" } });
      assert.equal(result.exitCode, 0);
      const combined = result.stdout + result.stderr;
      assert.ok(
        combined.toLowerCase().includes("skip"),
        `Expected skip message, got: ${combined.slice(0, 200)}`
      );
    });
  });

  describe("--json output", () => {
    it("produces valid JSON with required fields", () => {
      const result = runScript(["--staged", "--json"]);
      const json = JSON.parse(result.stdout);
      assert.ok(json.modeA !== undefined, "Expected modeA field");
      assert.ok(json.modeB !== undefined, "Expected modeB field");
      assert.equal(typeof json.blocked, "boolean");
      assert.equal(typeof json.duration_ms, "number");
    });
  });

  describe("registry integration", () => {
    it("registry file exists and is valid JSON", () => {
      const registryPath = path.join(PROJECT_ROOT, "scripts/config/propagation-patterns.json");
      assert.ok(fs.existsSync(registryPath));
      const content = fs.readFileSync(registryPath, "utf8");
      const parsed = JSON.parse(content);
      assert.ok(Array.isArray(parsed.patterns));
      assert.ok(
        parsed.patterns.length >= 10,
        `Expected >= 10 patterns, got ${parsed.patterns.length}`
      );
    });

    it("baseline file exists and is valid JSON", () => {
      const baselinePath = path.join(
        PROJECT_ROOT,
        "scripts/config/known-propagation-baseline.json"
      );
      assert.ok(fs.existsSync(baselinePath));
      const content = fs.readFileSync(baselinePath, "utf8");
      const parsed = JSON.parse(content);
      assert.ok(Array.isArray(parsed.entries));
    });
  });

  describe("shared loader module", () => {
    it("loads registry with all expected patterns", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { loadRegistry } = require(
        path.join(PROJECT_ROOT, "scripts/lib/load-propagation-registry.js")
      );
      const patterns = loadRegistry({ verbose: true });
      assert.ok(patterns.length >= 10);
      const ids = patterns.map((p: { id: string }) => p.id);
      assert.ok(ids.includes("sanitize-error"));
      assert.ok(ids.includes("safe-to-write"));
      assert.ok(ids.includes("lstat-symlink"));
      assert.ok(ids.includes("path-traversal"));
    });

    it("matchPatterns finds patterns in diff lines", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { loadRegistry, matchPatterns } = require(
        path.join(PROJECT_ROOT, "scripts/lib/load-propagation-registry.js")
      );
      const registry = loadRegistry();
      const lines = ["+  const result = sanitizeError(err);"];
      const triggered = matchPatterns(lines, registry);
      assert.ok(triggered.includes("sanitize-error"));
    });

    it("matchPatterns returns empty for unrelated diff", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { loadRegistry, matchPatterns } = require(
        path.join(PROJECT_ROOT, "scripts/lib/load-propagation-registry.js")
      );
      const registry = loadRegistry();
      const lines = ["+  const x = 42;"];
      const triggered = matchPatterns(lines, registry);
      assert.deepEqual(triggered, []);
    });

    it("loadBaseline returns array", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { loadBaseline } = require(
        path.join(PROJECT_ROOT, "scripts/lib/load-propagation-registry.js")
      );
      const baseline = loadBaseline();
      assert.ok(Array.isArray(baseline));
    });
  });
});
