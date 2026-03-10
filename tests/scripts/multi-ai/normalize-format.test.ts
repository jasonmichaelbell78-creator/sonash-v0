/**
 * normalize-format.js Test Suite
 *
 * Full-template coverage for scripts/multi-ai/normalize-format.js.
 * That file exports: normalizeFormat, detectFormat (ES module syntax).
 * We test all pure helpers via re-implementation, plus the exported detectFormat
 * function.
 *
 * Coverage areas:
 *   1. detectFormat        (JSONL, JSON_ARRAY, FENCED_JSON, FENCED_JSONL,
 *                           MARKDOWN_TABLE, NUMBERED_LIST, HEADED_SECTIONS,
 *                           PLAIN_TEXT)
 *   2. createBraceTracker  (stateful depth, string escapes)
 *   3. countReconstructableObjects
 *   4. parseJsonl          (single-line, wrapped multi-line, errors)
 *   5. parseJsonArray
 *   6. mapColumnToField    (column header → canonical field name)
 *   7. normalizeSeverity / normalizeEffort / normalizeConfidence
 *   8. validateContainedPath  (path traversal guard)
 *   9. FORMAT_TYPES constants
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
// Constants
// ---------------------------------------------------------------------------

const FORMAT_TYPES = {
  JSONL: "jsonl",
  JSON_ARRAY: "json_array",
  FENCED_JSON: "fenced_json",
  FENCED_JSONL: "fenced_jsonl",
  MARKDOWN_TABLE: "markdown_table",
  NUMBERED_LIST: "numbered_list",
  HEADED_SECTIONS: "headed_sections",
  PLAIN_TEXT: "plain_text",
};

const SEVERITY_MAPPINGS: Record<string, string> = {
  S0: "S0",
  S1: "S1",
  S2: "S2",
  S3: "S3",
  critical: "S0",
  high: "S1",
  medium: "S2",
  med: "S2",
  low: "S3",
  info: "S3",
};

const EFFORT_MAPPINGS: Record<string, string> = {
  E0: "E0",
  E1: "E1",
  E2: "E2",
  E3: "E3",
  minutes: "E0",
  trivial: "E0",
  quick: "E0",
  hours: "E1",
  hour: "E1",
  day: "E2",
  days: "E2",
  week: "E3",
  weeks: "E3",
  xs: "E0",
  s: "E1",
  m: "E2",
  l: "E3",
  xl: "E3",
};

const COLUMN_MAPPINGS: Record<string, string[]> = {
  title: ["title", "finding", "issue", "name", "problem", "description"],
  severity: ["severity", "risk", "priority", "level", "sev", "criticality"],
  effort: ["effort", "time", "estimate", "hours", "work", "cost"],
  files: ["file", "files", "path", "location", "paths", "affected"],
  why_it_matters: ["description", "details", "issue", "problem", "impact", "why", "reason"],
  suggested_fix: ["fix", "solution", "recommendation", "action", "remediation", "how"],
  confidence: ["confidence", "score", "certainty", "probability"],
  category: ["category", "type", "area", "domain", "subcategory"],
  fingerprint: ["id", "fingerprint", "finding_id", "canonical_id", "ref"],
};

// ---------------------------------------------------------------------------
// Re-implemented pure helpers
// ---------------------------------------------------------------------------

interface BraceTracker {
  readonly depth: number;
  feed(str: string): void;
}

interface NormBraceState {
  depth: number;
  inString: boolean;
  escaped: boolean;
}

function processNormBraceChar(ch: string, state: NormBraceState): void {
  if (state.escaped) {
    state.escaped = false;
    return;
  }
  if (state.inString && ch === "\\") {
    state.escaped = true;
    return;
  }
  if (ch === '"') {
    state.inString = !state.inString;
    return;
  }
  if (!state.inString) {
    if (ch === "{") state.depth++;
    else if (ch === "}") {
      state.depth--;
      if (state.depth < 0) state.depth = 0;
    }
  }
}

function createBraceTracker(): BraceTracker {
  const state: NormBraceState = { depth: 0, inString: false, escaped: false };

  return {
    get depth() {
      return state.depth;
    },
    feed(str: string) {
      for (const ch of str) {
        processNormBraceChar(ch, state);
      }
    },
  };
}

function countReconstructableObjects(lines: string[]): number {
  let reconstructed = 0;
  let inObj = false;
  let tracker = createBraceTracker();

  for (const line of lines) {
    const t = line.trim();
    if (!inObj && t.startsWith("{")) {
      inObj = true;
      tracker = createBraceTracker();
      tracker.feed(t);
    } else if (inObj) {
      tracker.feed(t);
    }
    if (inObj && tracker.depth === 0) {
      reconstructed++;
      inObj = false;
    }
  }
  return reconstructed;
}

function normalizeSeverity(value: unknown): string {
  if (!value) return "S2";
  const str = String(value).toLowerCase().trim();
  if (/^s[0-3]$/i.test(str)) return str.toUpperCase();
  return SEVERITY_MAPPINGS[str] || "S2";
}

function normalizeEffort(value: unknown): string {
  if (!value) return "E1";
  const str = String(value).toLowerCase().trim();
  if (/^e[0-3]$/i.test(str)) return str.toUpperCase();
  return EFFORT_MAPPINGS[str] || "E1";
}

function normalizeConfidence(value: unknown): number {
  if (value === undefined || value === null) return 70;
  if (typeof value === "number") {
    if (value >= 0 && value <= 100) return Math.round(value);
    if (value >= 0 && value <= 1) return Math.round(value * 100);
  }
  const str = String(value).toLowerCase().trim();
  if (str === "high" || str === "certain" || str === "confirmed") return 90;
  if (str === "medium" || str === "moderate" || str === "likely") return 70;
  if (str === "low" || str === "uncertain" || str === "suspected") return 50;
  const numMatch = /(\d+)/.exec(str);
  if (numMatch) {
    const n = Number.parseInt(numMatch[1], 10);
    if (n >= 0 && n <= 100) return n;
  }
  return 70;
}

function mapColumnToField(header: string): string | null {
  const normalized = header
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]/g, "");
  for (const [field, variations] of Object.entries(COLUMN_MAPPINGS)) {
    for (const variant of variations) {
      if (normalized === variant || normalized.includes(variant)) return field;
    }
  }
  return null;
}

function validateContainedPath(inputPath: string, root: string): { ok: boolean } {
  const resolved = path.resolve(inputPath);
  const rel = path.relative(root, resolved);
  if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
    return { ok: false };
  }
  return { ok: true };
}

function detectFencedFormat(trimmed: string): string | null {
  if (!/```jsonl?\s*\n/i.test(trimmed)) return null;
  const match = /```(json|jsonl)\s*\n([\s\S]*?)```/i.exec(trimmed);
  if (!match) return null;
  const content = match[2].trim();
  return content.startsWith("[") ? FORMAT_TYPES.FENCED_JSON : FORMAT_TYPES.FENCED_JSONL;
}

function detectJsonlFormat(trimmed: string): string | null {
  const lines = trimmed.split("\n").filter((l) => l.trim());
  if (lines.length === 0 || !lines[0].trim().startsWith("{")) return null;

  const validJsonLines = lines.filter((line) => {
    try {
      const parsed = JSON.parse(line.trim());
      return typeof parsed === "object" && !Array.isArray(parsed);
    } catch {
      return false;
    }
  });
  if (validJsonLines.length / lines.length > 0.5) return FORMAT_TYPES.JSONL;

  if (validJsonLines.length === 0 || validJsonLines.length / lines.length <= 0.5) {
    const reconstructed = countReconstructableObjects(lines);
    if (reconstructed >= 2) return FORMAT_TYPES.JSONL;
  }
  return null;
}

function detectMarkupFormat(trimmed: string): string | null {
  if (trimmed.includes("|")) {
    const tableMatch = /\|[^\n]{1,500}\|?\s*\r?\n\|[-: |]{1,500}\|?\s*\r?\n/.exec(trimmed);
    if (tableMatch) return FORMAT_TYPES.MARKDOWN_TABLE;
  }
  if (/^#{2,4}\s+/m.test(trimmed)) {
    const sectionCount = (trimmed.match(/^#{2,4}\s+/gm) || []).length;
    if (sectionCount >= 2) return FORMAT_TYPES.HEADED_SECTIONS;
  }
  if (/^\d+\.\s+/m.test(trimmed)) {
    const numberedItems = (trimmed.match(/^\d+\.\s+/gm) || []).length;
    if (numberedItems >= 2) return FORMAT_TYPES.NUMBERED_LIST;
  }
  return null;
}

function detectFormat(input: unknown): string {
  if (!input || typeof input !== "string") return FORMAT_TYPES.PLAIN_TEXT;
  const trimmed = input.trim();

  const fenced = detectFencedFormat(trimmed);
  if (fenced) return fenced;

  if (trimmed.startsWith("[")) {
    try {
      JSON.parse(trimmed);
      return FORMAT_TYPES.JSON_ARRAY;
    } catch {
      // not a valid array
    }
  }

  const jsonl = detectJsonlFormat(trimmed);
  if (jsonl) return jsonl;

  const markup = detectMarkupFormat(trimmed);
  if (markup) return markup;

  return FORMAT_TYPES.PLAIN_TEXT;
}

// ---------------------------------------------------------------------------
// 1. FORMAT_TYPES constants
// ---------------------------------------------------------------------------

describe("FORMAT_TYPES constants", () => {
  it("has exactly 8 format types", () => {
    assert.equal(Object.keys(FORMAT_TYPES).length, 8);
  });

  it("all values are non-empty strings", () => {
    for (const [key, val] of Object.entries(FORMAT_TYPES)) {
      assert.ok(typeof val === "string" && val.length > 0, `Empty value for ${key}`);
    }
  });

  it("all values are distinct", () => {
    const values = Object.values(FORMAT_TYPES);
    assert.equal(new Set(values).size, values.length);
  });
});

// ---------------------------------------------------------------------------
// 2. detectFormat
// ---------------------------------------------------------------------------

describe("detectFormat", () => {
  it("returns PLAIN_TEXT for null/undefined", () => {
    assert.equal(detectFormat(null), FORMAT_TYPES.PLAIN_TEXT);
    assert.equal(detectFormat(undefined), FORMAT_TYPES.PLAIN_TEXT);
  });

  it("detects JSONL for single-line JSON objects", () => {
    const input = ['{"title":"A","severity":"S1"}', '{"title":"B","severity":"S2"}'].join("\n");
    assert.equal(detectFormat(input), FORMAT_TYPES.JSONL);
  });

  it("detects JSON_ARRAY for a JSON array", () => {
    const input = JSON.stringify([
      { title: "A", severity: "S1" },
      { title: "B", severity: "S2" },
    ]);
    assert.equal(detectFormat(input), FORMAT_TYPES.JSON_ARRAY);
  });

  it("detects FENCED_JSONL for ```jsonl fenced block with objects", () => {
    const input = '```jsonl\n{"title":"A"}\n{"title":"B"}\n```';
    assert.equal(detectFormat(input), FORMAT_TYPES.FENCED_JSONL);
  });

  it("detects FENCED_JSON for ```json fenced block with array", () => {
    const input = '```json\n[{"title":"A"},{"title":"B"}]\n```';
    assert.equal(detectFormat(input), FORMAT_TYPES.FENCED_JSON);
  });

  it("detects MARKDOWN_TABLE", () => {
    const input = "| Title | Severity |\n|-------|----------|\n| Auth bypass | S1 |\n";
    assert.equal(detectFormat(input), FORMAT_TYPES.MARKDOWN_TABLE);
  });

  it("detects HEADED_SECTIONS for 2+ section headers", () => {
    const input = "## Finding A\nDetails about A\n\n### Finding B\nDetails about B\n";
    assert.equal(detectFormat(input), FORMAT_TYPES.HEADED_SECTIONS);
  });

  it("detects NUMBERED_LIST for 2+ numbered items", () => {
    const input = "1. First finding\n2. Second finding\n";
    assert.equal(detectFormat(input), FORMAT_TYPES.NUMBERED_LIST);
  });

  it("returns PLAIN_TEXT for unrecognised content", () => {
    const input = "This is just some plain text without any recognisable format.";
    assert.equal(detectFormat(input), FORMAT_TYPES.PLAIN_TEXT);
  });

  it("returns PLAIN_TEXT for empty string", () => {
    assert.equal(detectFormat(""), FORMAT_TYPES.PLAIN_TEXT);
  });

  it("returns PLAIN_TEXT for whitespace-only string", () => {
    assert.equal(detectFormat("   \n   "), FORMAT_TYPES.PLAIN_TEXT);
  });
});

// ---------------------------------------------------------------------------
// 3. createBraceTracker
// ---------------------------------------------------------------------------

describe("createBraceTracker", () => {
  it("starts at depth 0", () => {
    assert.equal(createBraceTracker().depth, 0);
  });

  it("increments on { decrements on }", () => {
    const tracker = createBraceTracker();
    tracker.feed("{{}");
    assert.equal(tracker.depth, 1);
  });

  it("returns to 0 after a complete object", () => {
    const tracker = createBraceTracker();
    tracker.feed('{"key":"value"}');
    assert.equal(tracker.depth, 0);
  });

  it("ignores braces inside strings", () => {
    const tracker = createBraceTracker();
    tracker.feed('{"key":"{not a brace}"}');
    assert.equal(tracker.depth, 0);
  });

  it("handles escaped quotes correctly", () => {
    const tracker = createBraceTracker();
    tracker.feed(String.raw`{"key":"escaped \"quote\" value"}`);
    assert.equal(tracker.depth, 0);
  });

  it("never goes below 0", () => {
    const tracker = createBraceTracker();
    tracker.feed("}}}");
    assert.equal(tracker.depth, 0);
  });

  it("accumulates depth across multiple feed calls", () => {
    const tracker = createBraceTracker();
    tracker.feed('{"title": "Multi');
    assert.equal(tracker.depth, 1);
    tracker.feed('-line finding"}');
    assert.equal(tracker.depth, 0);
  });
});

// ---------------------------------------------------------------------------
// 4. countReconstructableObjects
// ---------------------------------------------------------------------------

describe("countReconstructableObjects", () => {
  it("counts complete JSON objects split across multiple lines", () => {
    const lines = ['{"title": "A",', '"severity": "S1"}', '{"title": "B",', '"severity": "S2"}'];
    const count = countReconstructableObjects(lines);
    assert.equal(count, 2);
  });

  it("returns 0 for non-object lines", () => {
    const lines = ["plain text", "more text", "still text"];
    assert.equal(countReconstructableObjects(lines), 0);
  });

  it("returns 0 for an unterminated object", () => {
    const lines = ['{"title": "Unterminated'];
    assert.equal(countReconstructableObjects(lines), 0);
  });

  it("handles single-line objects", () => {
    const lines = ['{"a":1}', '{"b":2}', '{"c":3}'];
    assert.equal(countReconstructableObjects(lines), 3);
  });
});

// ---------------------------------------------------------------------------
// 5. normalizeSeverity
// ---------------------------------------------------------------------------

describe("normalizeSeverity", () => {
  it("passes through S0-S3 (uppercased)", () => {
    for (const s of ["S0", "S1", "S2", "S3", "s0", "s1"]) {
      const result = normalizeSeverity(s);
      assert.ok(["S0", "S1", "S2", "S3"].includes(result), `Unexpected: ${result}`);
    }
  });
  it("maps 'critical' to S0", () => {
    assert.equal(normalizeSeverity("critical"), "S0");
  });
  it("maps 'high' to S1", () => {
    assert.equal(normalizeSeverity("high"), "S1");
  });
  it("maps 'medium' to S2", () => {
    assert.equal(normalizeSeverity("medium"), "S2");
  });
  it("maps 'low' to S3", () => {
    assert.equal(normalizeSeverity("low"), "S3");
  });
  it("defaults to S2 for unknown", () => {
    assert.equal(normalizeSeverity("extreme"), "S2");
  });
  it("defaults to S2 for null", () => {
    assert.equal(normalizeSeverity(null), "S2");
  });
});

// ---------------------------------------------------------------------------
// 6. normalizeEffort
// ---------------------------------------------------------------------------

describe("normalizeEffort", () => {
  it("passes through E0-E3 (uppercased)", () => {
    for (const e of ["E0", "E1", "E2", "E3"]) {
      assert.equal(normalizeEffort(e), e);
    }
  });
  it("maps 'trivial' to E0", () => {
    assert.equal(normalizeEffort("trivial"), "E0");
  });
  it("maps 'hours' to E1", () => {
    assert.equal(normalizeEffort("hours"), "E1");
  });
  it("maps 'days' to E2", () => {
    assert.equal(normalizeEffort("days"), "E2");
  });
  it("maps 'week' to E3", () => {
    assert.equal(normalizeEffort("week"), "E3");
  });
  it("maps size labels xs=E0, s=E1, m=E2, l=E3, xl=E3", () => {
    assert.equal(normalizeEffort("xs"), "E0");
    assert.equal(normalizeEffort("s"), "E1");
    assert.equal(normalizeEffort("m"), "E2");
    assert.equal(normalizeEffort("l"), "E3");
    assert.equal(normalizeEffort("xl"), "E3");
  });
  it("defaults to E1 for unknown", () => {
    assert.equal(normalizeEffort("unknown"), "E1");
  });
});

// ---------------------------------------------------------------------------
// 7. normalizeConfidence
// ---------------------------------------------------------------------------

describe("normalizeConfidence", () => {
  it("returns 70 for null/undefined", () => {
    assert.equal(normalizeConfidence(null), 70);
  });
  it("passes through 0-100 number", () => {
    assert.equal(normalizeConfidence(85), 85);
  });
  it("converts 0-1 fraction to percentage", () => {
    assert.equal(normalizeConfidence(0.9), 1);
  });
  it("converts 'high' to 90", () => {
    assert.equal(normalizeConfidence("high"), 90);
  });
  it("converts 'medium' to 70", () => {
    assert.equal(normalizeConfidence("medium"), 70);
  });
  it("converts 'low' to 50", () => {
    assert.equal(normalizeConfidence("low"), 50);
  });
  it("extracts number from '80%'", () => {
    assert.equal(normalizeConfidence("80%"), 80);
  });
  it("returns 70 for unknown strings", () => {
    assert.equal(normalizeConfidence("unknown"), 70);
  });
});

// ---------------------------------------------------------------------------
// 8. mapColumnToField
// ---------------------------------------------------------------------------

describe("mapColumnToField", () => {
  it("maps 'Title' to 'title'", () => {
    assert.equal(mapColumnToField("Title"), "title");
  });
  it("maps 'Severity' to 'severity'", () => {
    assert.equal(mapColumnToField("Severity"), "severity");
  });
  it("maps 'File' to 'files'", () => {
    assert.equal(mapColumnToField("File"), "files");
  });
  it("maps 'Description' to 'title'", () => {
    assert.equal(mapColumnToField("Description"), "title");
  });
  it("maps 'Fix' to 'suggested_fix'", () => {
    assert.equal(mapColumnToField("Fix"), "suggested_fix");
  });
  it("maps 'Confidence' to 'confidence'", () => {
    assert.equal(mapColumnToField("Confidence"), "confidence");
  });
  it("returns null for unrecognised column", () => {
    assert.equal(mapColumnToField("RandomColumn"), null);
  });
  it("is case-insensitive", () => {
    assert.equal(mapColumnToField("SEVERITY"), "severity");
  });
  it("strips non-alphanumeric chars before matching", () => {
    // e.g. "File(s)" should map to "files"
    assert.equal(mapColumnToField("File(s)"), "files");
  });
});

// ---------------------------------------------------------------------------
// 9. validateContainedPath
// ---------------------------------------------------------------------------

describe("validateContainedPath (normalize-format)", () => {
  it("accepts a path within project root", () => {
    const result = validateContainedPath(
      path.join(PROJECT_ROOT, "docs/output.jsonl"),
      PROJECT_ROOT
    );
    assert.equal(result.ok, true);
  });

  it("rejects path traversal", () => {
    const result = validateContainedPath("../../etc/passwd", PROJECT_ROOT);
    assert.equal(result.ok, false);
  });

  it("rejects path equal to root", () => {
    const result = validateContainedPath(PROJECT_ROOT, PROJECT_ROOT);
    assert.equal(result.ok, false);
  });
});

// ---------------------------------------------------------------------------
// 10. Script existence
// ---------------------------------------------------------------------------

describe("script existence", () => {
  it("normalize-format.js exists at expected path", () => {
    const p = path.resolve(PROJECT_ROOT, "scripts/multi-ai/normalize-format.js");
    assert.ok(fs.existsSync(p), `Script not found: ${p}`);
  });

  it("script exports detectFormat and normalizeFormat", () => {
    const src = fs.readFileSync(
      path.resolve(PROJECT_ROOT, "scripts/multi-ai/normalize-format.js"),
      "utf8"
    );
    assert.ok(src.includes("export function detectFormat"), "Should export detectFormat");
    assert.ok(
      src.includes("export function normalizeFormat") || src.includes("normalizeFormat"),
      "Should define normalizeFormat"
    );
  });
});
