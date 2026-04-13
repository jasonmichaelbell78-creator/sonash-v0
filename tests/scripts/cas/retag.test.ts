/**
 * retag.js Test Suite
 *
 * Tests the exported helpers of scripts/cas/retag.js:
 * - parseCliArgs (pure CLI parser)
 * - rewriteRawLines (pure journal line rewriter)
 * - serializeRawLines (pure line joiner)
 * - CLI smoke: apply subcommand validation + exit codes
 * - CLI smoke: validate subcommand
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { test, describe, afterEach } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { spawnSync } from "node:child_process";

const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../../package.json"))
  ? path.resolve(__dirname, "../../..")
  : path.resolve(__dirname, "../../../..");

const scriptPath = path.resolve(PROJECT_ROOT, "scripts/cas/retag.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require(scriptPath) as {
  parseCliArgs: (argv: string[]) => {
    _: string[];
    dryRun: boolean;
    strict: boolean;
    verbose: boolean;
    batchFile?: string;
  };
  rewriteRawLines: (
    rawLines: Array<{ raw: string; entry: Record<string, unknown> | null }>,
    entryUpdatesByKey: Map<string, string[]>
  ) => Array<{ raw: string; entry: Record<string, unknown> | null }>;
  serializeRawLines: (
    rawLines: Array<{ raw: string; entry: Record<string, unknown> | null }>
  ) => string;
  JOURNAL_PATH: string;
  VOCAB_PATH: string;
};

const { parseCliArgs, rewriteRawLines, serializeRawLines, JOURNAL_PATH, VOCAB_PATH } = mod;

const tempDirs: string[] = [];
function tmpDir(prefix = "retag-test-"): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(d);
  return d;
}
afterEach(() => {
  while (tempDirs.length > 0) {
    const d = tempDirs.pop();
    if (d) {
      try {
        fs.rmSync(d, { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    }
  }
});

describe("parseCliArgs", () => {
  test("returns defaults for empty argv", () => {
    const args = parseCliArgs([]);
    assert.deepEqual(args._, []);
    assert.equal(args.dryRun, false);
    assert.equal(args.strict, false);
    assert.equal(args.verbose, false);
    assert.equal(args.batchFile, undefined);
  });

  test("parses --dry-run boolean flag", () => {
    const args = parseCliArgs(["--dry-run"]);
    assert.equal(args.dryRun, true);
  });

  test("parses --strict boolean flag", () => {
    const args = parseCliArgs(["--strict"]);
    assert.equal(args.strict, true);
  });

  test("parses --verbose boolean flag", () => {
    const args = parseCliArgs(["--verbose"]);
    assert.equal(args.verbose, true);
  });

  test("parses --batch-file with value", () => {
    const args = parseCliArgs(["--batch-file", "/tmp/b.json"]);
    assert.equal(args.batchFile, "/tmp/b.json");
  });

  test("throws on unknown flag", () => {
    assert.throws(() => parseCliArgs(["--not-a-flag"]), /unknown flag/);
  });

  test("collects positional args", () => {
    const args = parseCliArgs(["foo", "bar"]);
    assert.deepEqual(args._, ["foo", "bar"]);
  });

  test("mixed flags and positional args", () => {
    const args = parseCliArgs(["--dry-run", "apply", "--batch-file", "/tmp/x.json"]);
    assert.equal(args.dryRun, true);
    assert.equal(args.batchFile, "/tmp/x.json");
    assert.deepEqual(args._, ["apply"]);
  });
});

describe("rewriteRawLines", () => {
  test("updates tags for matched keys only", () => {
    const rawLines = [
      {
        raw: JSON.stringify({ source: "s1", candidate: "c1", type: "t", tags: ["old"] }),
        entry: { source: "s1", candidate: "c1", type: "t", tags: ["old"] },
      },
      {
        raw: JSON.stringify({ source: "s2", candidate: "c2", type: "t", tags: ["keep"] }),
        entry: { source: "s2", candidate: "c2", type: "t", tags: ["keep"] },
      },
    ];
    const updates = new Map([["s1|c1|t", ["new1", "new2"]]]);
    const out = rewriteRawLines(rawLines, updates);

    const first = JSON.parse(out[0].raw);
    assert.deepEqual(first.tags, ["new1", "new2"]);
    const second = JSON.parse(out[1].raw);
    assert.deepEqual(second.tags, ["keep"]);
  });

  test("preserves raw lines with no entry (blank lines)", () => {
    const rawLines = [
      { raw: "", entry: null },
      {
        raw: JSON.stringify({ source: "s", candidate: "c", type: "t", tags: [] }),
        entry: { source: "s", candidate: "c", type: "t", tags: [] },
      },
    ];
    const updates = new Map<string, string[]>();
    const out = rewriteRawLines(rawLines, updates);
    assert.equal(out[0].raw, "");
    assert.equal(out[0].entry, null);
  });

  test("leaves entries untouched when update map is empty", () => {
    const rawLines = [
      {
        raw: JSON.stringify({ source: "s", candidate: "c", type: "t", tags: ["x"] }),
        entry: { source: "s", candidate: "c", type: "t", tags: ["x"] },
      },
    ];
    const out = rewriteRawLines(rawLines, new Map());
    assert.equal(out[0].raw, rawLines[0].raw);
  });
});

describe("serializeRawLines", () => {
  test("joins raw fields with newlines", () => {
    const rawLines = [
      { raw: '{"a":1}', entry: null },
      { raw: '{"b":2}', entry: null },
      { raw: "", entry: null },
    ];
    assert.equal(serializeRawLines(rawLines), '{"a":1}\n{"b":2}\n');
  });

  test("returns empty string for empty list", () => {
    assert.equal(serializeRawLines([]), "");
  });
});

describe("exported paths", () => {
  test("JOURNAL_PATH points to .research/extraction-journal.jsonl", () => {
    assert.ok(JOURNAL_PATH.endsWith(path.join(".research", "extraction-journal.jsonl")));
  });

  test("VOCAB_PATH points to .research/tag-vocabulary.json", () => {
    assert.ok(VOCAB_PATH.endsWith(path.join(".research", "tag-vocabulary.json")));
  });
});

describe("CLI smoke tests", () => {
  function runRetag(argv: string[], cwd?: string) {
    return spawnSync("node", [scriptPath, ...argv], {
      cwd: cwd ?? PROJECT_ROOT,
      encoding: "utf8",
      timeout: 15000,
    });
  }

  test("exits 1 with usage when no subcommand provided", () => {
    const res = runRetag([]);
    assert.equal(res.status, 1);
    assert.match(res.stderr, /usage/);
  });

  test("exits 1 for unknown subcommand", () => {
    const res = runRetag(["not-a-subcommand"]);
    assert.equal(res.status, 1);
    assert.match(res.stderr, /unknown subcommand/);
  });

  test("apply without --batch-file exits 1 with error", () => {
    const res = runRetag(["apply"]);
    assert.equal(res.status, 1);
    assert.match(res.stderr, /--batch-file/);
  });

  test("apply with missing batch file exits 1 or 2 with error", () => {
    const d = tmpDir();
    const missing = path.join(d, "does-not-exist.json");
    const res = runRetag(["apply", "--batch-file", missing]);
    // Accept either explicit exit(1) from precheck OR exit(2) from ENOENT bubble-up;
    // both are safe failure modes, and this test only enforces non-success.
    assert.notEqual(res.status, 0);
    assert.ok(res.stderr.length > 0, "expected an error message on stderr");
  });
});
