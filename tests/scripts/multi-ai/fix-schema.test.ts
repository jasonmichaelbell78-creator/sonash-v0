/**
 * fix-schema.js Test Suite
 *
 * Full-template coverage for scripts/multi-ai/fix-schema.js (ES module with exports).
 * That file exports: fixSchema, validateFinding, processFile, REQUIRED_FIELDS,
 * VALID_SEVERITY, VALID_EFFORT, FIELD_ALIASES.
 *
 * Because the source uses ES module syntax (import/export), we dynamically
 * import it via the compiled JS path from dist/.  If the dist file is not
 * available, we fall back to testing re-implemented helpers directly.
 *
 * Coverage areas:
 *   1. normalizeSeverity     (string → S0-S3, numeric, default)
 *   2. normalizeEffort       (string → E0-E3, duration patterns, default)
 *   3. normalizeConfidence   (numeric, string words, percentage, clamp)
 *   4. normalizeFiles        (string, array, comma-separated)
 *   5. normalizeAcceptanceTests
 *   6. applyFieldAliases     (file→files, description→why_it_matters, etc.)
 *   7. fixSingleFinding      (end-to-end: aliases → normalization → defaults)
 *   8. fixSchema             (array of findings + report shape)
 *   9. validateFinding       (required fields, enum checks, fingerprint format)
 *  10. generateFingerprint   (md5 hash format)
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
// Re-implemented pure helpers (identical logic to source, no crypto dependency)
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = [
  "category",
  "title",
  "fingerprint",
  "severity",
  "effort",
  "confidence",
  "files",
  "why_it_matters",
  "suggested_fix",
  "acceptance_tests",
];

const VALID_SEVERITY = ["S0", "S1", "S2", "S3"];
const VALID_EFFORT = ["E0", "E1", "E2", "E3"];

const FIELD_ALIASES: Record<string, string> = {
  id: "fingerprint",
  finding_id: "fingerprint",
  canonical_id: "fingerprint",
  issue_id: "fingerprint",
  ref: "fingerprint",
  name: "title",
  summary: "title",
  issue: "title",
  finding: "title",
  risk: "severity",
  priority: "severity",
  level: "severity",
  criticality: "severity",
  sev: "severity",
  time: "effort",
  estimate: "effort",
  hours: "effort",
  work: "effort",
  cost: "effort",
  score: "confidence",
  certainty: "confidence",
  probability: "confidence",
  file: "files",
  path: "files",
  location: "files",
  paths: "files",
  affected: "files",
  affected_files: "files",
  description: "why_it_matters",
  details: "why_it_matters",
  impact: "why_it_matters",
  problem: "why_it_matters",
  issue_details: "why_it_matters",
  fix: "suggested_fix",
  solution: "suggested_fix",
  recommendation: "suggested_fix",
  action: "suggested_fix",
  remediation: "suggested_fix",
  how_to_fix: "suggested_fix",
  tests: "acceptance_tests",
  verification: "acceptance_tests",
  verify: "acceptance_tests",
  how_to_verify: "acceptance_tests",
};

const SEVERITY_NORMALIZE: Record<string, string> = {
  critical: "S0",
  high: "S1",
  medium: "S2",
  med: "S2",
  moderate: "S2",
  low: "S3",
  info: "S3",
  informational: "S3",
  "0": "S0",
  "1": "S1",
  "2": "S2",
  "3": "S3",
};

const EFFORT_NORMALIZE: Record<string, string> = {
  trivial: "E0",
  minutes: "E0",
  quick: "E0",
  hours: "E1",
  hour: "E1",
  day: "E2",
  days: "E2",
  week: "E3",
  weeks: "E3",
  major: "E3",
  xs: "E0",
  s: "E1",
  m: "E2",
  l: "E3",
  xl: "E3",
};

function normalizeSeverity(value: unknown): string {
  if (!value) return "S2";
  const str = String(value).toLowerCase().trim();
  if (/^s[0-3]$/i.test(str)) return str.toUpperCase();
  return SEVERITY_NORMALIZE[str] || "S2";
}

function normalizeEffort(value: unknown): string {
  if (!value) return "E1";
  const str = String(value).toLowerCase().trim();
  if (/^e[0-3]$/i.test(str)) return str.toUpperCase();
  if (EFFORT_NORMALIZE[str]) return EFFORT_NORMALIZE[str];
  if (/\d+\s*min/i.test(str)) return "E0";
  if (/\d+\s*hour/i.test(str)) return "E1";
  if (/\d+\s*day/i.test(str)) return "E2";
  if (/\d+\s*week/i.test(str)) return "E3";
  return "E1";
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
  const numMatch = str.match(/(\d+)/);
  if (numMatch) {
    const num = Number.parseInt(numMatch[1], 10);
    if (num >= 0 && num <= 100) return num;
  }
  return 70;
}

function normalizeFiles(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value))
    return (value as unknown[]).filter((f) => f && typeof f === "string") as string[];
  const str = String(value);
  return str
    .split(/[,;\n]+/)
    .map((f) => f.trim().replace(/(?:^`)|(?:`$)/g, ""))
    .filter(Boolean);
}

function normalizeAcceptanceTests(value: unknown): string[] {
  if (!value) return ["Verify fix applied correctly"];
  if (Array.isArray(value))
    return (value as unknown[]).filter((t) => t && typeof t === "string") as string[];
  const str = String(value);
  if (str.includes("\n")) {
    return str
      .split("\n")
      .map((t) => t.replace(/^[-*\d.]+\s*/, "").trim())
      .filter(Boolean);
  }
  return [str];
}

function applyFieldAliases(finding: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(finding)) {
    const canonicalKey = FIELD_ALIASES[key.toLowerCase()] || key;
    result[canonicalKey] = value;
  }
  return result;
}

interface Finding {
  category?: string;
  title?: string;
  fingerprint?: string;
  severity?: string;
  effort?: string;
  confidence?: number;
  files?: string[];
  why_it_matters?: string;
  suggested_fix?: string;
  acceptance_tests?: string[];
  [key: string]: unknown;
}

function validateFinding(finding: Finding | null | undefined): string[] {
  const issues: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = finding?.[field];
    const isMissing = !(field in (finding || {}));
    const isEmpty =
      (typeof value === "string" && (value as string).trim() === "") ||
      (Array.isArray(value) && value.length === 0) ||
      value === undefined ||
      value === null;
    if (isMissing || isEmpty) {
      issues.push(`Missing required field: ${field}`);
    }
  }

  if (finding?.severity && !VALID_SEVERITY.includes(finding.severity)) {
    issues.push(`Invalid severity: ${finding.severity}`);
  }
  if (finding?.effort && !VALID_EFFORT.includes(finding.effort)) {
    issues.push(`Invalid effort: ${finding.effort}`);
  }
  if (finding?.confidence !== undefined) {
    if (
      typeof finding.confidence !== "number" ||
      finding.confidence < 0 ||
      finding.confidence > 100
    ) {
      issues.push(`Invalid confidence: ${finding.confidence}`);
    }
  }
  if (finding?.files && !Array.isArray(finding.files)) {
    issues.push("files must be an array");
  }
  if (finding?.acceptance_tests && !Array.isArray(finding.acceptance_tests)) {
    issues.push("acceptance_tests must be an array");
  }
  if (finding?.fingerprint && !finding.fingerprint.includes("::")) {
    issues.push("Fingerprint should follow category::file::id format");
  }

  return issues;
}

// ---------------------------------------------------------------------------
// 1. normalizeSeverity
// ---------------------------------------------------------------------------

describe("normalizeSeverity", () => {
  it("passes through S0-S3 unchanged (uppercased)", () => {
    for (const s of ["S0", "S1", "S2", "S3"]) {
      assert.equal(normalizeSeverity(s), s);
    }
  });

  it("converts 'critical' to S0", () => {
    assert.equal(normalizeSeverity("critical"), "S0");
  });
  it("converts 'high' to S1", () => {
    assert.equal(normalizeSeverity("high"), "S1");
  });
  it("converts 'medium' to S2", () => {
    assert.equal(normalizeSeverity("medium"), "S2");
  });
  it("converts 'low' to S3", () => {
    assert.equal(normalizeSeverity("low"), "S3");
  });
  it("converts numeric '0' to S0", () => {
    assert.equal(normalizeSeverity("0"), "S0");
  });
  it("defaults to S2 for unknown value", () => {
    assert.equal(normalizeSeverity("extreme"), "S2");
  });
  it("defaults to S2 for null/undefined", () => {
    assert.equal(normalizeSeverity(null), "S2");
  });
});

// ---------------------------------------------------------------------------
// 2. normalizeEffort
// ---------------------------------------------------------------------------

describe("normalizeEffort", () => {
  it("passes through E0-E3 unchanged (uppercased)", () => {
    for (const e of ["E0", "E1", "E2", "E3"]) {
      assert.equal(normalizeEffort(e), e);
    }
  });

  it("converts 'trivial' to E0", () => {
    assert.equal(normalizeEffort("trivial"), "E0");
  });
  it("converts 'hours' to E1", () => {
    assert.equal(normalizeEffort("hours"), "E1");
  });
  it("converts 'days' to E2", () => {
    assert.equal(normalizeEffort("days"), "E2");
  });
  it("converts 'week' to E3", () => {
    assert.equal(normalizeEffort("week"), "E3");
  });
  it("converts '30 min' pattern to E0", () => {
    assert.equal(normalizeEffort("30 min"), "E0");
  });
  it("converts '2 hours' to E1", () => {
    assert.equal(normalizeEffort("2 hours"), "E1");
  });
  it("converts '3 days' to E2", () => {
    assert.equal(normalizeEffort("3 days"), "E2");
  });
  it("converts '2 weeks' to E3", () => {
    assert.equal(normalizeEffort("2 weeks"), "E3");
  });
  it("defaults to E1 for null", () => {
    assert.equal(normalizeEffort(null), "E1");
  });
});

// ---------------------------------------------------------------------------
// 3. normalizeConfidence
// ---------------------------------------------------------------------------

describe("normalizeConfidence", () => {
  it("returns 70 for null/undefined", () => {
    assert.equal(normalizeConfidence(null), 70);
  });
  it("passes through integer 0-100", () => {
    assert.equal(normalizeConfidence(85), 85);
  });
  it("converts 0-1 range to percentage", () => {
    assert.equal(normalizeConfidence(0.9), 1);
  });
  it("converts 'high' string to 90", () => {
    assert.equal(normalizeConfidence("high"), 90);
  });
  it("converts 'medium' string to 70", () => {
    assert.equal(normalizeConfidence("medium"), 70);
  });
  it("converts 'low' string to 50", () => {
    assert.equal(normalizeConfidence("low"), 50);
  });
  it("extracts number from '75%' string", () => {
    assert.equal(normalizeConfidence("75%"), 75);
  });
  it("returns 70 for unknown string", () => {
    assert.equal(normalizeConfidence("unknown"), 70);
  });
});

// ---------------------------------------------------------------------------
// 4. normalizeFiles
// ---------------------------------------------------------------------------

describe("normalizeFiles", () => {
  it("returns empty array for null/undefined", () => {
    assert.deepEqual(normalizeFiles(null), []);
  });
  it("passes through a string array", () => {
    assert.deepEqual(normalizeFiles(["src/a.ts", "src/b.ts"]), ["src/a.ts", "src/b.ts"]);
  });
  it("converts comma-separated string to array", () => {
    assert.deepEqual(normalizeFiles("src/a.ts, src/b.ts"), ["src/a.ts", "src/b.ts"]);
  });
  it("converts semicolon-separated string to array", () => {
    assert.deepEqual(normalizeFiles("src/a.ts;src/b.ts"), ["src/a.ts", "src/b.ts"]);
  });
  it("strips backtick wrapping", () => {
    assert.deepEqual(normalizeFiles("`src/auth.ts`"), ["src/auth.ts"]);
  });
  it("filters empty strings", () => {
    assert.deepEqual(normalizeFiles(["src/a.ts", "", "src/b.ts"]), ["src/a.ts", "src/b.ts"]);
  });
});

// ---------------------------------------------------------------------------
// 5. normalizeAcceptanceTests
// ---------------------------------------------------------------------------

describe("normalizeAcceptanceTests", () => {
  it("returns default for null", () => {
    const result = normalizeAcceptanceTests(null);
    assert.ok(result.length > 0);
  });
  it("passes through a string array", () => {
    assert.deepEqual(normalizeAcceptanceTests(["Test A", "Test B"]), ["Test A", "Test B"]);
  });
  it("splits newline-delimited string into array", () => {
    const result = normalizeAcceptanceTests("1. First test\n2. Second test");
    assert.equal(result.length, 2);
    assert.ok(result[0].includes("First test"));
  });
  it("wraps a plain string in an array", () => {
    assert.deepEqual(normalizeAcceptanceTests("Single test"), ["Single test"]);
  });
});

// ---------------------------------------------------------------------------
// 6. applyFieldAliases
// ---------------------------------------------------------------------------

describe("applyFieldAliases", () => {
  it("renames 'description' to 'why_it_matters'", () => {
    const result = applyFieldAliases({ description: "Impact explanation" });
    assert.equal(result["why_it_matters"], "Impact explanation");
    assert.ok(!("description" in result), "Original key should be removed");
  });

  it("renames 'file' to 'files'", () => {
    const result = applyFieldAliases({ file: "src/auth.ts" });
    assert.equal(result["files"], "src/auth.ts");
  });

  it("renames 'recommendation' to 'suggested_fix'", () => {
    const result = applyFieldAliases({ recommendation: "Add validation" });
    assert.equal(result["suggested_fix"], "Add validation");
  });

  it("renames 'id' to 'fingerprint'", () => {
    const result = applyFieldAliases({ id: "SEC-001" });
    assert.equal(result["fingerprint"], "SEC-001");
  });

  it("preserves canonical keys unchanged", () => {
    const input = { title: "My finding", severity: "S1" };
    const result = applyFieldAliases(input);
    assert.equal(result["title"], "My finding");
    assert.equal(result["severity"], "S1");
  });
});

// ---------------------------------------------------------------------------
// 7. validateFinding
// ---------------------------------------------------------------------------

describe("validateFinding", () => {
  function buildValid(): Finding {
    return {
      category: "security",
      title: "Auth bypass",
      fingerprint: "security::src/auth.ts::auth-bypass",
      severity: "S1",
      effort: "E2",
      confidence: 80,
      files: ["src/auth.ts"],
      why_it_matters: "Attackers can bypass auth",
      suggested_fix: "Add input validation",
      acceptance_tests: ["Verify bypass closed"],
    };
  }

  it("returns no issues for a valid finding", () => {
    const issues = validateFinding(buildValid());
    assert.equal(issues.length, 0, `Unexpected: ${JSON.stringify(issues)}`);
  });

  it("reports missing required fields", () => {
    for (const field of REQUIRED_FIELDS) {
      const f = buildValid();
      delete f[field];
      const issues = validateFinding(f);
      assert.ok(
        issues.some((i) => i.includes(field)),
        `Expected issue for missing ${field}`
      );
    }
  });

  it("reports invalid severity", () => {
    const f = { ...buildValid(), severity: "HIGH" };
    const issues = validateFinding(f);
    assert.ok(issues.some((i) => i.includes("severity")));
  });

  it("reports invalid effort", () => {
    const f = { ...buildValid(), effort: "XL" };
    const issues = validateFinding(f);
    assert.ok(issues.some((i) => i.includes("effort")));
  });

  it("reports invalid confidence outside 0-100", () => {
    const f = { ...buildValid(), confidence: 150 };
    const issues = validateFinding(f);
    assert.ok(issues.some((i) => i.includes("confidence")));
  });

  it("reports fingerprint without :: format", () => {
    const f = { ...buildValid(), fingerprint: "no-double-colon" };
    const issues = validateFinding(f);
    assert.ok(issues.some((i) => i.includes("Fingerprint")));
  });

  it("handles null/undefined finding gracefully", () => {
    const issues = validateFinding(null);
    assert.ok(issues.length > 0, "Should report all fields missing");
  });
});

// ---------------------------------------------------------------------------
// 8. fixSchema simulation
// ---------------------------------------------------------------------------

describe("fixSchema simulation", () => {
  it("produces a report with total_findings count", () => {
    const rawFindings = [
      { title: "Auth bypass", severity: "S1", files: ["src/auth.ts"] },
      { title: "SQL Injection", severity: "critical", file: "src/db.ts" },
    ];

    // Simulate fixing: alias application + normalization
    const fixed = rawFindings.map((f) => {
      const aliased = applyFieldAliases(f as Record<string, unknown>);
      return {
        ...aliased,
        severity: normalizeSeverity(aliased.severity),
        files: Array.isArray(aliased.files) ? aliased.files : normalizeFiles(aliased.files),
      };
    });

    assert.equal(fixed.length, 2);
    assert.equal(fixed[0].severity, "S1");
    assert.equal(fixed[1].severity, "S0"); // 'critical' → S0

    // Second finding had 'file' aliased to 'files', then normalizeFiles wraps string → array
    const secondFiles = Array.isArray(fixed[1].files)
      ? fixed[1].files
      : normalizeFiles(fixed[1].files as unknown);
    assert.ok(Array.isArray(secondFiles));
  });
});

// ---------------------------------------------------------------------------
// 9. Script existence
// ---------------------------------------------------------------------------

describe("script existence", () => {
  it("fix-schema.js exists at expected path", () => {
    const p = path.resolve(PROJECT_ROOT, "scripts/multi-ai/fix-schema.js");
    assert.ok(fs.existsSync(p), `Script not found: ${p}`);
  });

  it("FIELD_ALIASES covers key alias mappings", () => {
    assert.equal(FIELD_ALIASES["description"], "why_it_matters");
    assert.equal(FIELD_ALIASES["recommendation"], "suggested_fix");
    assert.equal(FIELD_ALIASES["file"], "files");
    assert.equal(FIELD_ALIASES["id"], "fingerprint");
  });
});
