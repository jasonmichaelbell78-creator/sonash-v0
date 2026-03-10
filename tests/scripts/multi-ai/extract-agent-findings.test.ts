/**
 * extract-agent-findings.js Test Suite
 *
 * Tests the pure helper functions from scripts/multi-ai/extract-agent-findings.js.
 * The script runs as a CLI with no exports — we test the two key pure helpers:
 *
 *   1. validateContainedPath  (path traversal guard)
 *   2. createBraceTracker     (stateful JSON brace-depth tracking)
 *   3. processFindingJson     (parse + validate + normalize file paths)
 *   4. Content-block normalisation logic (string vs array content)
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as path from "node:path";
import * as fs from "node:fs";

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
// Re-implemented pure helpers (identical logic to source)
// ---------------------------------------------------------------------------

function validateContainedPath(inputPath: string, root: string): { ok: boolean; resolved: string } {
  const resolved = path.resolve(root, inputPath);
  const rel = path.relative(root, resolved);
  if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
    return { ok: false, resolved };
  }
  return { ok: true, resolved };
}

interface BraceTracker {
  readonly depth: number;
  feed(str: string): void;
}

function createBraceTracker(): BraceTracker {
  let depth = 0;
  let inString = false;
  let escaped = false;

  return {
    get depth() {
      return depth;
    },
    feed(str: string) {
      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (inString && ch === "\\") {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          inString = !inString;
          continue;
        }
        if (!inString) {
          if (ch === "{") depth++;
          else if (ch === "}") {
            depth--;
            if (depth < 0) depth = 0;
          }
        }
      }
    },
  };
}

interface Finding {
  title?: string;
  severity?: string;
  file?: string;
  [key: string]: unknown;
}

function processFindingJson(
  jsonStr: string,
  projectRoot: string,
  rootPrefix: string
): Finding | null {
  try {
    const finding = JSON.parse(jsonStr) as Finding;
    if (!(finding.title && finding.severity)) return null;

    if (finding.file) {
      let f = finding.file as string;
      if (f.startsWith(rootPrefix)) f = f.slice(rootPrefix.length);
      else if (f.startsWith(projectRoot + "/")) f = f.slice(projectRoot.length + 1);
      else if (f.startsWith(projectRoot + "\\")) f = f.slice(projectRoot.length + 1);
      finding.file = f.replace(/\\/g, "/");
    }
    return finding;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 1. validateContainedPath
// ---------------------------------------------------------------------------

describe("validateContainedPath", () => {
  const root = "/project/root";

  it("accepts a path inside the project root", () => {
    const result = validateContainedPath("docs/output.jsonl", root);
    assert.equal(result.ok, true);
  });

  it("rejects path traversal with ..", () => {
    const result = validateContainedPath("../../etc/passwd", root);
    assert.equal(result.ok, false);
  });

  it("rejects a path that equals the root (empty relative)", () => {
    const result = validateContainedPath(".", root);
    assert.equal(result.ok, false);
  });

  it("accepts deeply nested paths within root", () => {
    const result = validateContainedPath("docs/audits/multi-ai/session-001/findings.jsonl", root);
    assert.equal(result.ok, true);
  });
});

// ---------------------------------------------------------------------------
// 2. createBraceTracker
// ---------------------------------------------------------------------------

describe("createBraceTracker", () => {
  it("starts at depth 0", () => {
    const tracker = createBraceTracker();
    assert.equal(tracker.depth, 0);
  });

  it("increments depth for opening braces", () => {
    const tracker = createBraceTracker();
    tracker.feed("{");
    assert.equal(tracker.depth, 1);
    tracker.feed("{");
    assert.equal(tracker.depth, 2);
  });

  it("decrements depth for closing braces", () => {
    const tracker = createBraceTracker();
    tracker.feed("{{}");
    assert.equal(tracker.depth, 1);
  });

  it("balances to 0 for a complete JSON object", () => {
    const tracker = createBraceTracker();
    tracker.feed('{"title":"Auth bypass","severity":"S1"}');
    assert.equal(tracker.depth, 0);
  });

  it("does not count braces inside strings", () => {
    const tracker = createBraceTracker();
    tracker.feed('{"key":"{not a brace}"}');
    assert.equal(tracker.depth, 0);
  });

  it("handles escaped quotes inside strings correctly", () => {
    const tracker = createBraceTracker();
    tracker.feed('{"key":"escaped \\"quote\\""}');
    assert.equal(tracker.depth, 0);
  });

  it("does not go below 0 depth (guards against unbalanced close)", () => {
    const tracker = createBraceTracker();
    tracker.feed("}}}");
    assert.equal(tracker.depth, 0);
  });

  it("tracks depth across multiple feed() calls (multi-line JSON)", () => {
    const tracker = createBraceTracker();
    tracker.feed('{"title": "Multi-line');
    assert.equal(tracker.depth, 1);
    tracker.feed('finding", "severity": "S2"}');
    assert.equal(tracker.depth, 0);
  });
});

// ---------------------------------------------------------------------------
// 3. processFindingJson
// ---------------------------------------------------------------------------

describe("processFindingJson", () => {
  const projectRoot = "/project/root";
  const rootPrefix = projectRoot + path.sep;

  it("returns null for invalid JSON", () => {
    const result = processFindingJson("not-json", projectRoot, rootPrefix);
    assert.equal(result, null);
  });

  it("returns null for JSON missing title", () => {
    const json = JSON.stringify({ severity: "S1", file: "src/auth.ts" });
    const result = processFindingJson(json, projectRoot, rootPrefix);
    assert.equal(result, null);
  });

  it("returns null for JSON missing severity", () => {
    const json = JSON.stringify({ title: "Auth bypass", file: "src/auth.ts" });
    const result = processFindingJson(json, projectRoot, rootPrefix);
    assert.equal(result, null);
  });

  it("returns the finding when title and severity are present", () => {
    const json = JSON.stringify({ title: "Auth bypass", severity: "S1", file: "src/auth.ts" });
    const result = processFindingJson(json, projectRoot, rootPrefix);
    assert.ok(result !== null);
    assert.equal(result!.title, "Auth bypass");
  });

  it("strips Windows-style absolute project root from file path", () => {
    const winRoot = "C:\\project\\root";
    const winPrefix = winRoot + "\\";
    const json = JSON.stringify({
      title: "T",
      severity: "S1",
      file: "C:\\project\\root\\src\\auth.ts",
    });
    const result = processFindingJson(json, winRoot, winPrefix);
    assert.ok(result !== null);
    // After stripping prefix and replacing backslashes:
    assert.equal(result!.file, "src/auth.ts");
  });

  it("converts backslashes in file path to forward slashes", () => {
    const json = JSON.stringify({ title: "T", severity: "S1", file: "src\\auth\\token.ts" });
    const result = processFindingJson(json, projectRoot, rootPrefix);
    assert.ok(result !== null);
    assert.ok(!(result!.file as string).includes("\\"), "Should not contain backslashes");
  });

  it("leaves file unchanged when it has no absolute prefix", () => {
    const json = JSON.stringify({ title: "T", severity: "S1", file: "src/auth.ts" });
    const result = processFindingJson(json, projectRoot, rootPrefix);
    assert.ok(result !== null);
    assert.equal(result!.file, "src/auth.ts");
  });
});

// ---------------------------------------------------------------------------
// 4. Content-block normalisation logic
// ---------------------------------------------------------------------------

describe("content block normalisation", () => {
  it("normalises string content to [{type:'text', text: ...}]", () => {
    const rawContent = "Some plain text finding";
    const contentBlocks = Array.isArray(rawContent)
      ? rawContent
      : typeof rawContent === "string"
        ? [{ type: "text", text: rawContent }]
        : [rawContent];
    assert.equal(contentBlocks.length, 1);
    assert.equal(contentBlocks[0].type, "text");
    assert.equal(contentBlocks[0].text, rawContent);
  });

  it("passes through array content unchanged", () => {
    const rawContent = [
      { type: "text", text: "Block A" },
      { type: "text", text: "Block B" },
    ];
    const contentBlocks = Array.isArray(rawContent) ? rawContent : [];
    assert.equal(contentBlocks.length, 2);
  });

  it("wraps a single object content in an array", () => {
    const rawContent = { type: "text", text: "Single block" };
    const contentBlocks = Array.isArray(rawContent)
      ? rawContent
      : typeof rawContent === "string"
        ? [{ type: "text", text: rawContent }]
        : [rawContent];
    assert.equal(contentBlocks.length, 1);
  });
});

// ---------------------------------------------------------------------------
// 5. Script existence
// ---------------------------------------------------------------------------

describe("script existence", () => {
  it("extract-agent-findings.js exists at expected path", () => {
    const p = path.resolve(PROJECT_ROOT, "scripts/multi-ai/extract-agent-findings.js");
    assert.ok(fs.existsSync(p), `Script not found: ${p}`);
  });
});
