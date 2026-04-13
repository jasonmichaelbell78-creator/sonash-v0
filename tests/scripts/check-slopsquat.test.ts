/**
 * check-slopsquat.js Test Suite
 *
 * Tests the exported helpers:
 * - parseArgs (CLI parser with --json and --private-ok flags)
 * - extractDeps (package.json parsing with graceful error reporting)
 * - classifyVerdict (HTTP status → verdict label)
 * - verdictTag (verdict → human-readable tag)
 * - printFlaggedReport (console output)
 * - CLI smoke: --private-ok gate enforcement
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { test, describe, afterEach } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { spawnSync } from "node:child_process";

const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "../../..");

const scriptPath = path.resolve(PROJECT_ROOT, "scripts/check-slopsquat.js");

function runSlopsquat(argv: string[]) {
  return spawnSync(process.execPath, [scriptPath, ...argv], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    timeout: 15000,
  });
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require(scriptPath) as {
  parseArgs: (argv: string[]) => { json: boolean; privateOk: boolean };
  extractDeps: (pkgPath: string) => Set<string>;
  classifyVerdict: (status: number) => string;
  verdictTag: (verdict: string) => string;
  PRIVATE_OK_MESSAGE: string;
};

const { parseArgs, extractDeps, classifyVerdict, verdictTag, PRIVATE_OK_MESSAGE } = mod;

const tempDirs: string[] = [];
afterEach(() => {
  while (tempDirs.length > 0) {
    const d = tempDirs.pop();
    if (d) fs.rmSync(d, { recursive: true, force: true });
  }
});

function tmpDir(prefix = "slopsquat-test-"): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(d);
  return d;
}

describe("check-slopsquat.js", () => {
  describe("parseArgs", () => {
    test("defaults both flags to false", () => {
      const flags = parseArgs(["node", "script"]);
      assert.equal(flags.json, false);
      assert.equal(flags.privateOk, false);
    });

    test("recognizes --json flag", () => {
      const flags = parseArgs(["node", "script", "--json"]);
      assert.equal(flags.json, true);
      assert.equal(flags.privateOk, false);
    });

    test("recognizes --private-ok flag", () => {
      const flags = parseArgs(["node", "script", "--private-ok"]);
      assert.equal(flags.json, false);
      assert.equal(flags.privateOk, true);
    });

    test("handles both flags together", () => {
      const flags = parseArgs(["node", "script", "--json", "--private-ok"]);
      assert.equal(flags.json, true);
      assert.equal(flags.privateOk, true);
    });

    test("ignores unknown flags", () => {
      const flags = parseArgs(["node", "script", "--bogus"]);
      assert.equal(flags.json, false);
      assert.equal(flags.privateOk, false);
    });
  });

  describe("classifyVerdict", () => {
    test("200 → ok", () => {
      assert.equal(classifyVerdict(200), "ok");
    });

    test("404 → not-found", () => {
      assert.equal(classifyVerdict(404), "not-found");
    });

    test("500 → http-500", () => {
      assert.equal(classifyVerdict(500), "http-500");
    });

    test("429 → http-429", () => {
      assert.equal(classifyVerdict(429), "http-429");
    });
  });

  describe("verdictTag", () => {
    test("not-found → NOT FOUND", () => {
      assert.equal(verdictTag("not-found"), "NOT FOUND");
    });

    test("error → NETWORK ERROR", () => {
      assert.equal(verdictTag("error"), "NETWORK ERROR");
    });

    test("ok → OK", () => {
      assert.equal(verdictTag("ok"), "OK");
    });

    test("http-500 → HTTP-500", () => {
      assert.equal(verdictTag("http-500"), "HTTP-500");
    });
  });

  describe("extractDeps", () => {
    test("returns Set of all dep-key entries from valid package.json", () => {
      const dir = tmpDir();
      const pkgPath = path.join(dir, "package.json");
      fs.writeFileSync(
        pkgPath,
        JSON.stringify({
          dependencies: { foo: "^1.0.0", bar: "^2.0.0" },
          devDependencies: { baz: "^3.0.0" },
          peerDependencies: { qux: "^4.0.0" },
          optionalDependencies: { opt: "^5.0.0" },
        })
      );
      const result = extractDeps(pkgPath);
      assert.deepEqual(
        [...result].sort((a, b) => a.localeCompare(b)),
        ["bar", "baz", "foo", "opt", "qux"]
      );
    });

    test("returns empty Set when no dep keys present", () => {
      const dir = tmpDir();
      const pkgPath = path.join(dir, "package.json");
      fs.writeFileSync(pkgPath, JSON.stringify({ name: "x", version: "1.0.0" }));
      const result = extractDeps(pkgPath);
      assert.equal(result.size, 0);
    });

    test("returns empty Set and logs warning on unreadable file (ENOENT)", () => {
      const dir = tmpDir();
      const pkgPath = path.join(dir, "missing.json");
      const originalWarn = console.warn;
      const warnings: string[] = [];
      console.warn = (msg: string) => warnings.push(msg);
      try {
        const result = extractDeps(pkgPath);
        assert.equal(result.size, 0);
        assert.equal(warnings.length, 1);
        assert.match(warnings[0], /could not read/i);
      } finally {
        console.warn = originalWarn;
      }
    });

    test("returns empty Set and logs warning on malformed JSON (no silent swallow)", () => {
      const dir = tmpDir();
      const pkgPath = path.join(dir, "package.json");
      fs.writeFileSync(pkgPath, "{ not-valid-json");
      const originalWarn = console.warn;
      const warnings: string[] = [];
      console.warn = (msg: string) => warnings.push(msg);
      try {
        const result = extractDeps(pkgPath);
        assert.equal(result.size, 0);
        assert.equal(warnings.length, 1);
        assert.match(warnings[0], /could not parse.*JSON/i);
      } finally {
        console.warn = originalWarn;
      }
    });

    test("skips non-object dep values (defensive)", () => {
      const dir = tmpDir();
      const pkgPath = path.join(dir, "package.json");
      fs.writeFileSync(
        pkgPath,
        JSON.stringify({
          dependencies: null,
          devDependencies: "not-an-object",
          peerDependencies: { real: "^1.0.0" },
        })
      );
      const result = extractDeps(pkgPath);
      assert.deepEqual([...result], ["real"]);
    });
  });

  describe("PRIVATE_OK_MESSAGE constant", () => {
    test("mentions npm registry URL", () => {
      assert.match(PRIVATE_OK_MESSAGE, /registry\.npmjs\.org/);
    });

    test("mentions the --private-ok flag name", () => {
      assert.match(PRIVATE_OK_MESSAGE, /--private-ok/);
    });
  });

  describe("CLI smoke: --private-ok gate", () => {
    test("refuses to run without --private-ok (exit 2)", () => {
      const result = runSlopsquat([]);
      assert.equal(result.status, 2, `stderr: ${result.stderr}`);
      assert.match(result.stderr, /--private-ok/);
    });

    test("refuses with --json but no --private-ok (exit 2, JSON output)", () => {
      const result = runSlopsquat(["--json"]);
      assert.equal(result.status, 2);
      const parsed = JSON.parse(result.stdout);
      assert.equal(parsed.error, "private-ok-required");
      assert.match(parsed.message, /--private-ok/);
    });
  });
});
