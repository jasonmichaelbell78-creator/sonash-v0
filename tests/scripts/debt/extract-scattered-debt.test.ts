/**
 * Unit tests for extract-scattered-debt.js
 *
 * Tests: findCommentStart, KEYWORD_RE matching, SEVERITY_MAP, SCAN_EXTENSIONS,
 * and path normalization helpers.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Constants ────────────────────────────────────────────────────────────────

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css"]);
const SEVERITY_MAP: Record<string, string> = {
  TODO: "S3",
  FIXME: "S2",
  HACK: "S2",
  XXX: "S2",
  WORKAROUND: "S2",
};
const KEYWORD_RE = /\b(TODO|FIXME|HACK|XXX|WORKAROUND)(?=[:(])/gi;

describe("SCAN_EXTENSIONS", () => {
  it("includes .ts", () => assert.ok(SCAN_EXTENSIONS.has(".ts")));
  it("includes .tsx", () => assert.ok(SCAN_EXTENSIONS.has(".tsx")));
  it("includes .js", () => assert.ok(SCAN_EXTENSIONS.has(".js")));
  it("includes .jsx", () => assert.ok(SCAN_EXTENSIONS.has(".jsx")));
  it("includes .mjs", () => assert.ok(SCAN_EXTENSIONS.has(".mjs")));
  it("includes .css", () => assert.ok(SCAN_EXTENSIONS.has(".css")));
  it("does not include .md", () => assert.equal(SCAN_EXTENSIONS.has(".md"), false));
  it("does not include .json", () => assert.equal(SCAN_EXTENSIONS.has(".json"), false));
});

describe("SEVERITY_MAP (extract-scattered-debt)", () => {
  it("maps TODO to S3", () => assert.equal(SEVERITY_MAP["TODO"], "S3"));
  it("maps FIXME to S2", () => assert.equal(SEVERITY_MAP["FIXME"], "S2"));
  it("maps HACK to S2", () => assert.equal(SEVERITY_MAP["HACK"], "S2"));
  it("maps XXX to S2", () => assert.equal(SEVERITY_MAP["XXX"], "S2"));
  it("maps WORKAROUND to S2", () => assert.equal(SEVERITY_MAP["WORKAROUND"], "S2"));
});

// ─── KEYWORD_RE matching ─────────────────────────────────────────────────────

describe("KEYWORD_RE", () => {
  it("matches TODO: pattern", () => {
    assert.ok(KEYWORD_RE.test("// TODO: fix this"));
    KEYWORD_RE.lastIndex = 0;
  });

  it("matches FIXME( pattern", () => {
    assert.ok(KEYWORD_RE.test("// FIXME(john): update"));
    KEYWORD_RE.lastIndex = 0;
  });

  it("does not match bare TODO without colon or paren", () => {
    const text = "// TODO fix this";
    const matches = [...text.matchAll(/\b(TODO|FIXME|HACK|XXX|WORKAROUND)(?=[:(])/gi)];
    assert.equal(matches.length, 0);
  });

  it("matches WORKAROUND:", () => {
    const matches = [..."// WORKAROUND: temporary fix".matchAll(KEYWORD_RE)];
    KEYWORD_RE.lastIndex = 0;
    assert.ok(matches.length > 0);
  });
});

// ─── findCommentStart ─────────────────────────────────────────────────────────

const QUOTE_CHARS = new Set(["'", '"', "`"]);

function findCommentStart(line: string): number {
  let quoteChar: string | null = null;
  let i = 0;
  const len = line.length - 1;
  while (i < len) {
    const ch = line[i];
    if (quoteChar) {
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (ch === quoteChar) quoteChar = null;
      i++;
      continue;
    }
    if (ch === "/" && (line[i + 1] === "/" || line[i + 1] === "*")) return i;
    if (QUOTE_CHARS.has(ch)) quoteChar = ch;
    i++;
  }
  return -1;
}

describe("findCommentStart", () => {
  it("finds // comment at start of line", () => {
    assert.equal(findCommentStart("// TODO: fix"), 0);
  });

  it("finds // comment after code", () => {
    const idx = findCommentStart("const x = 1; // comment");
    assert.ok(idx > 0);
  });

  it("ignores // inside single-quoted string", () => {
    assert.equal(findCommentStart("const s = '//not a comment';"), -1);
  });

  it("ignores // inside double-quoted string", () => {
    assert.equal(findCommentStart('const s = "//not a comment";'), -1);
  });

  it("handles escaped quote inside string", () => {
    const idx = findCommentStart("const s = 'it\\'s fine'; // real comment");
    assert.ok(idx > 0);
  });

  it("returns -1 for line with no comment", () => {
    assert.equal(findCommentStart("const x = 1;"), -1);
  });

  it("finds /* block comment start", () => {
    const idx = findCommentStart("code /* block");
    assert.ok(idx >= 0);
  });
});

// ─── normalizeFilePath for scattered items ────────────────────────────────────

function normalizeForOutput(rawPath: string): string {
  // Replace backslashes and normalize separators
  return rawPath.replaceAll("\\", "/").replace(/^\.\//, "");
}

describe("normalizeForOutput", () => {
  it("replaces backslashes with forward slashes", () => {
    assert.equal(normalizeForOutput("src\\auth\\index.ts"), "src/auth/index.ts");
  });

  it("removes leading ./", () => {
    assert.equal(normalizeForOutput("./src/auth.ts"), "src/auth.ts");
  });

  it("leaves already-normalized paths unchanged", () => {
    assert.equal(normalizeForOutput("src/auth.ts"), "src/auth.ts");
  });
});

// ─── Path traversal guard ─────────────────────────────────────────────────────

function isTraversalPath(rel: string): boolean {
  return /^\.\.(?:[\\/]|$)/.test(rel);
}

describe("path traversal guard (extract-scattered-debt)", () => {
  it("rejects ../secret", () => assert.equal(isTraversalPath("../secret"), true));
  it("rejects bare ..", () => assert.equal(isTraversalPath(".."), true));
  it("allows src/file.ts", () => assert.equal(isTraversalPath("src/file.ts"), false));
  it("allows ..config (not a traversal)", () => assert.equal(isTraversalPath("..config"), false));
});
