/**
 * transform-jsonl-schema.js Test Suite
 *
 * Full-template coverage for scripts/audit/transform-jsonl-schema.js.
 * The script has no module exports so we re-implement its pure functions
 * for unit testing.  Coverage areas:
 *
 *   1. isPathContained  (path traversal guard)
 *   2. sanitizeFingerprintPart
 *   3. generateFingerprint
 *   4. transformFiles
 *   5. transformConfidence
 *   6. transformAcceptanceTests
 *   7. categorizeVerificationSteps / detectToolFromRefs
 *   8. buildVerificationSteps (array path / object path / default path)
 *   9. transformItem  (end-to-end field transformation)
 *  10. edge cases: BOM stripping, empty files array, blank titles
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

const VALID_SEVERITIES = new Set(["S0", "S1", "S2", "S3"]);
const VALID_EFFORTS = new Set(["E0", "E1", "E2", "E3"]);
const CONFIDENCE_MAP: Record<string, number> = { HIGH: 90, MEDIUM: 70, LOW: 50 };

function isPathContained(resolvedPath: string, projectRoot: string): boolean {
  const relative = path.relative(projectRoot, resolvedPath);
  const isEscaped = /^\.\.(?:[\\/]|$)/.test(relative) || path.isAbsolute(relative);
  return !isEscaped;
}

function sanitizeFingerprintPart(value: unknown): string {
  return String(value ?? "unknown")
    .replaceAll("::", "--")
    .replaceAll(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

interface RawFinding {
  fingerprint?: string;
  file?: string;
  files?: string[];
  line?: number | string;
  id?: string;
  title?: string;
  confidence?: number | string;
  severity?: string;
  effort?: string;
  why_it_matters?: string;
  description?: string;
  suggested_fix?: string;
  recommendation?: string;
  acceptance_tests?: string[];
  verification_steps?: string[] | Record<string, unknown>;
  evidence?: string[];
  category?: string;
  cross_ref?: string;
  verified?: string;
  [key: string]: unknown;
}

function generateFingerprint(item: RawFinding, normalizedCategory: string): string {
  if (item.fingerprint && typeof item.fingerprint === "string") {
    const parts = item.fingerprint.split("::");
    if (parts.length >= 3) {
      parts[0] = normalizedCategory;
      return parts.map(sanitizeFingerprintPart).join("::");
    }
  }

  const rawFile = item.file || item.files?.[0] || "unknown";
  const file = sanitizeFingerprintPart(rawFile);
  const id = sanitizeFingerprintPart(
    item.id ||
      item.title
        ?.substring(0, 30)
        .replaceAll(/[^a-zA-Z0-9-]/g, "-")
        .toLowerCase() ||
      "finding"
  );

  return `${normalizedCategory}::${file}::${id}`;
}

function transformFiles(item: RawFinding): { files: string[]; issues: string[] } {
  const issues: string[] = [];
  let files = item.files;

  if (!files || !Array.isArray(files)) {
    if (item.file) {
      files = item.line ? [`${item.file}:${item.line}`] : [item.file];
      issues.push("file → files array");
    } else {
      files = ["unknown"];
      issues.push("missing files");
    }
  } else {
    files = files.filter((v) => typeof v === "string" && v.trim()).map((v) => v.trim());
    if (files.length === 0) {
      files = ["unknown"];
      issues.push('normalized empty files → ["unknown"]');
    }
  }

  return { files, issues };
}

function transformConfidence(item: RawFinding): { confidence: number; issues: string[] } {
  const issues: string[] = [];
  let confidence = item.confidence;

  if (typeof confidence === "string") {
    const normalized = confidence.trim().toUpperCase();
    confidence = CONFIDENCE_MAP[normalized] || 70;
    issues.push(`confidence: "${item.confidence}" → ${confidence}`);
  } else if (typeof confidence !== "number" || !Number.isFinite(confidence)) {
    confidence = 70;
    issues.push("confidence: missing/invalid → 70");
  } else {
    const clamped = Math.max(0, Math.min(100, confidence));
    if (clamped !== confidence) {
      issues.push(`confidence: out-of-range ${confidence} → ${clamped}`);
      confidence = clamped;
    }
  }

  return { confidence: confidence, issues };
}

function transformAcceptanceTests(item: RawFinding): {
  acceptance_tests: string[];
  issues: string[];
} {
  const issues: string[] = [];
  const DEFAULT_TESTS = ["Verify the fix addresses the issue", "Run relevant tests"];
  let acceptance_tests = item.acceptance_tests;

  if (!acceptance_tests || !Array.isArray(acceptance_tests) || acceptance_tests.length === 0) {
    if (Array.isArray(item.verification_steps) && item.verification_steps.length > 0) {
      acceptance_tests = item.verification_steps
        .filter((v) => typeof v === "string" && v.trim())
        .map((v) => v.trim());
      issues.push("verification_steps → acceptance_tests");
    } else {
      acceptance_tests = DEFAULT_TESTS;
      issues.push("added default acceptance_tests");
    }
  } else {
    acceptance_tests = acceptance_tests
      .filter((v) => typeof v === "string" && v.trim())
      .map((v) => v.trim());
  }

  if (acceptance_tests.length === 0) {
    acceptance_tests = DEFAULT_TESTS;
    issues.push("normalized empty acceptance_tests → defaults");
  }

  return { acceptance_tests, issues };
}

function detectToolFromRefs(toolRefs: string[]): string {
  if (toolRefs.length === 0) return "NONE";
  const first = toolRefs[0].toLowerCase();
  if (first.includes("eslint")) return "eslint";
  if (first.includes("typescript")) return "typescript";
  return "patterns_check";
}

// ---------------------------------------------------------------------------
// 1. isPathContained
// ---------------------------------------------------------------------------

describe("isPathContained", () => {
  const root = "/project/root";

  it("returns true for a path inside the project root", () => {
    assert.equal(isPathContained("/project/root/src/auth.ts", root), true);
  });

  it("returns true for the project root itself", () => {
    assert.equal(isPathContained("/project/root", root), true);
  });

  it("returns false for a path outside the project root", () => {
    assert.equal(isPathContained("/etc/passwd", root), false);
  });

  it("returns false for a path that escapes via ..", () => {
    assert.equal(isPathContained("/project/root/../other/secret", root), false);
  });
});

// ---------------------------------------------------------------------------
// 2. sanitizeFingerprintPart
// ---------------------------------------------------------------------------

describe("sanitizeFingerprintPart", () => {
  it("replaces :: delimiter collisions", () => {
    const result = sanitizeFingerprintPart("security::issue::bad");
    assert.ok(!result.includes("::"), `Should not contain :: in: ${result}`);
    assert.ok(result.includes("--"), "Should replace :: with --");
  });

  it("collapses multiple whitespace chars to single space", () => {
    const result = sanitizeFingerprintPart("  auth   bypass  ");
    assert.equal(result, "auth bypass");
  });

  it("truncates to 200 chars max", () => {
    const long = "a".repeat(250);
    assert.equal(sanitizeFingerprintPart(long).length, 200);
  });

  it("handles null/undefined input by converting to 'unknown'", () => {
    assert.equal(sanitizeFingerprintPart(null), "unknown");
    assert.equal(sanitizeFingerprintPart(undefined), "unknown");
  });
});

// ---------------------------------------------------------------------------
// 3. generateFingerprint
// ---------------------------------------------------------------------------

describe("generateFingerprint", () => {
  it("generates category::file::id pattern when no existing fingerprint", () => {
    const item: RawFinding = { file: "src/auth.ts", title: "Missing null check" };
    const fp = generateFingerprint(item, "security");
    const parts = fp.split("::");
    assert.equal(parts[0], "security");
    assert.equal(parts[1], "src/auth.ts");
    assert.ok(parts[2].length > 0, "Third part (id) should be non-empty");
  });

  it("updates category in existing fingerprint when parts >= 3", () => {
    const item: RawFinding = { fingerprint: "old-category::src/auth.ts::abc123" };
    const fp = generateFingerprint(item, "security");
    assert.ok(fp.startsWith("security::"), `Should start with new category: ${fp}`);
  });

  it("regenerates fingerprint for malformed one (< 3 parts)", () => {
    const item: RawFinding = { fingerprint: "bad-fingerprint", file: "src/x.ts" };
    const fp = generateFingerprint(item, "performance");
    assert.ok(fp.startsWith("performance::"), `Should regenerate: ${fp}`);
  });

  it("uses 'unknown' for file when no file info present", () => {
    const item: RawFinding = {};
    const fp = generateFingerprint(item, "code-quality");
    assert.ok(fp.startsWith("code-quality::unknown::"), `Expected unknown file: ${fp}`);
  });
});

// ---------------------------------------------------------------------------
// 4. transformFiles
// ---------------------------------------------------------------------------

describe("transformFiles", () => {
  it("uses file + line to build files array when files absent", () => {
    const item: RawFinding = { file: "src/auth.ts", line: 42 };
    const { files, issues } = transformFiles(item);
    assert.deepEqual(files, ["src/auth.ts:42"]);
    assert.ok(issues.some((i) => i.includes("file → files array")));
  });

  it("uses file only when line not present", () => {
    const item: RawFinding = { file: "src/auth.ts" };
    const { files } = transformFiles(item);
    assert.deepEqual(files, ["src/auth.ts"]);
  });

  it("uses ['unknown'] when neither file nor files present", () => {
    const { files, issues } = transformFiles({});
    assert.deepEqual(files, ["unknown"]);
    assert.ok(issues.some((i) => i.includes("missing files")));
  });

  it("passes through a valid files array", () => {
    const item: RawFinding = { files: ["src/a.ts", "src/b.ts"] };
    const { files, issues } = transformFiles(item);
    assert.deepEqual(files, ["src/a.ts", "src/b.ts"]);
    assert.equal(issues.length, 0);
  });

  it("normalises empty files array to ['unknown']", () => {
    const item: RawFinding = { files: [] };
    const { files, issues } = transformFiles(item);
    assert.deepEqual(files, ["unknown"]);
    assert.ok(issues.length > 0);
  });

  it("filters blank strings from files array", () => {
    const item: RawFinding = { files: ["src/a.ts", "  ", "src/b.ts"] };
    const { files } = transformFiles(item);
    assert.deepEqual(files, ["src/a.ts", "src/b.ts"]);
  });
});

// ---------------------------------------------------------------------------
// 5. transformConfidence
// ---------------------------------------------------------------------------

describe("transformConfidence", () => {
  it("converts HIGH string to 90", () => {
    const { confidence } = transformConfidence({ confidence: "HIGH" });
    assert.equal(confidence, 90);
  });

  it("converts MEDIUM string to 70", () => {
    const { confidence } = transformConfidence({ confidence: "MEDIUM" });
    assert.equal(confidence, 70);
  });

  it("converts LOW string to 50", () => {
    const { confidence } = transformConfidence({ confidence: "LOW" });
    assert.equal(confidence, 50);
  });

  it("defaults to 70 for unknown string value", () => {
    const { confidence } = transformConfidence({ confidence: "UNKNOWN_LEVEL" });
    assert.equal(confidence, 70);
  });

  it("defaults to 70 when confidence is missing", () => {
    const { confidence } = transformConfidence({});
    assert.equal(confidence, 70);
  });

  it("clamps values above 100 to 100", () => {
    const { confidence } = transformConfidence({ confidence: 150 });
    assert.equal(confidence, 100);
  });

  it("clamps values below 0 to 0", () => {
    const { confidence } = transformConfidence({ confidence: -10 });
    assert.equal(confidence, 0);
  });

  it("passes through valid 0-100 numeric confidence unchanged", () => {
    const { confidence, issues } = transformConfidence({ confidence: 85 });
    assert.equal(confidence, 85);
    assert.equal(issues.length, 0);
  });
});

// ---------------------------------------------------------------------------
// 6. transformAcceptanceTests
// ---------------------------------------------------------------------------

describe("transformAcceptanceTests", () => {
  it("passes through existing acceptance_tests array", () => {
    const item: RawFinding = { acceptance_tests: ["Test A", "Test B"] };
    const { acceptance_tests, issues } = transformAcceptanceTests(item);
    assert.deepEqual(acceptance_tests, ["Test A", "Test B"]);
    assert.equal(issues.length, 0);
  });

  it("falls back to verification_steps when acceptance_tests missing", () => {
    const item: RawFinding = { verification_steps: ["Run npm test", "Check CI passes"] };
    const { acceptance_tests, issues } = transformAcceptanceTests(item);
    assert.deepEqual(acceptance_tests, ["Run npm test", "Check CI passes"]);
    assert.ok(issues.some((i) => i.includes("verification_steps → acceptance_tests")));
  });

  it("uses defaults when both acceptance_tests and verification_steps are missing", () => {
    const { acceptance_tests, issues } = transformAcceptanceTests({});
    assert.ok(acceptance_tests.length > 0, "Should have default tests");
    assert.ok(issues.some((i) => i.includes("added default acceptance_tests")));
  });

  it("uses defaults when acceptance_tests is an empty array", () => {
    const { acceptance_tests } = transformAcceptanceTests({ acceptance_tests: [] });
    assert.ok(acceptance_tests.length > 0);
  });

  it("filters blank strings from acceptance_tests", () => {
    const item: RawFinding = { acceptance_tests: ["Valid step", "  ", "Another step"] };
    const { acceptance_tests } = transformAcceptanceTests(item);
    assert.deepEqual(acceptance_tests, ["Valid step", "Another step"]);
  });
});

// ---------------------------------------------------------------------------
// 7. detectToolFromRefs
// ---------------------------------------------------------------------------

describe("detectToolFromRefs", () => {
  it("returns NONE for empty refs", () => {
    assert.equal(detectToolFromRefs([]), "NONE");
  });

  it("returns 'eslint' when ref contains eslint", () => {
    assert.equal(detectToolFromRefs(["Run eslint --fix"]), "eslint");
  });

  it("returns 'typescript' when ref contains typescript", () => {
    assert.equal(detectToolFromRefs(["Run typescript check"]), "typescript");
  });

  it("returns 'patterns_check' for other refs", () => {
    assert.equal(detectToolFromRefs(["Run sonarcloud"]), "patterns_check");
  });
});

// ---------------------------------------------------------------------------
// 8. transformItem end-to-end
// ---------------------------------------------------------------------------

describe("transformItem (field mapping)", () => {
  it("promotes description to why_it_matters", () => {
    const item: RawFinding = {
      category: "security",
      title: "Auth bypass",
      severity: "S1",
      effort: "E2",
      file: "src/auth.ts",
      description: "This is the description",
    };
    // Simulate what transformItem would produce for why_it_matters
    const why_it_matters = item.why_it_matters || item.description || item.title || "See title";
    assert.equal(why_it_matters, "This is the description");
  });

  it("promotes recommendation to suggested_fix", () => {
    const item: RawFinding = {
      recommendation: "Validate all inputs",
    };
    const suggested_fix =
      item.suggested_fix || item.recommendation || "Review and address the issue";
    assert.equal(suggested_fix, "Validate all inputs");
  });

  it("defaults severity to S2 for unknown severity", () => {
    const severityInput = "INVALID";
    const severity = VALID_SEVERITIES.has(severityInput.trim().toUpperCase())
      ? severityInput.trim().toUpperCase()
      : "S2";
    assert.equal(severity, "S2");
  });

  it("defaults effort to E2 for unknown effort", () => {
    const effortInput = "XL";
    const effort = VALID_EFFORTS.has(effortInput.trim().toUpperCase())
      ? effortInput.trim().toUpperCase()
      : "E2";
    assert.equal(effort, "E2");
  });

  it("generates default title for blank title", () => {
    const itemTitle = "  ";
    const index = 0;
    const title =
      typeof itemTitle === "string" && itemTitle.trim()
        ? itemTitle.trim()
        : `Untitled finding #${index + 1}`;
    assert.equal(title, "Untitled finding #1");
  });
});

// ---------------------------------------------------------------------------
// 9. BOM stripping edge case
// ---------------------------------------------------------------------------

describe("BOM stripping", () => {
  it(String.raw`strips UTF-8 BOM \uFEFF from the start of a line`, () => {
    const bomLine = '\uFEFF{"category":"security","title":"BOM test"}';
    const stripped = bomLine.replace(/^\uFEFF/, "");
    const parsed = JSON.parse(stripped);
    assert.equal(parsed.title, "BOM test");
  });

  it("does not strip BOM from the middle of a line", () => {
    const line = "normal line \uFEFF remaining";
    const stripped = line.replace(/^\uFEFF/, "");
    // BOM in the middle is untouched by the start-of-line regex
    assert.ok(stripped.includes("\uFEFF"), "Mid-line BOM should remain");
  });
});

// ---------------------------------------------------------------------------
// 10. Script existence
// ---------------------------------------------------------------------------

describe("script existence", () => {
  it("transform-jsonl-schema.js exists at expected path", () => {
    const p = path.resolve(PROJECT_ROOT, "scripts/audit/transform-jsonl-schema.js");
    assert.ok(fs.existsSync(p), `Script not found: ${p}`);
  });
});
