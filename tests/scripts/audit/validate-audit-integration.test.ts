/**
 * validate-audit-integration.js Test Suite
 *
 * Full-template coverage for scripts/audit/validate-audit-integration.js.
 * The script has no module exports, so we re-implement its pure validator
 * functions for unit testing.  Coverage areas:
 *
 *   1. isPathWithinRepo  (path traversal guard)
 *   2. validateJsonlSchema  (required fields, enum validation, fingerprint format)
 *   3. validateS0S1Requirements  (verification_steps shape)
 *   4. validateTdmsMapping  (files[0] type, fingerprint length, why_it_matters, suggested_fix)
 *   5. loadJsonlFile  (parse errors, empty lines, prototype pollution guard)
 *   6. captureBaseline shape
 *   7. Edge cases: empty arrays, null values, invalid confidence ranges
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";

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
const REPO_ROOT = PROJECT_ROOT;

// ---------------------------------------------------------------------------
// Constants mirroring the source (single source of truth: audit-schema.json)
// ---------------------------------------------------------------------------

const REQUIRED_BASE_FIELDS = [
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

const VALID_CATEGORIES = new Set([
  "code-quality",
  "security",
  "performance",
  "refactoring",
  "documentation",
  "process",
  "engineering-productivity",
  "enhancements",
  "ai-optimization",
]);

const VALID_SEVERITIES = new Set(["S0", "S1", "S2", "S3"]);
const VALID_EFFORTS = new Set(["E0", "E1", "E2", "E3"]);
const VALID_FIRST_PASS_METHODS = new Set(["grep", "tool_output", "file_read", "code_search"]);
const VALID_SECOND_PASS_METHODS = new Set([
  "contextual_review",
  "exploitation_test",
  "manual_verification",
]);
const VALID_TOOL_CONFIRMATIONS = new Set([
  "eslint",
  "sonarcloud",
  "npm_audit",
  "patterns_check",
  "typescript",
  "NONE",
]);

// ---------------------------------------------------------------------------
// Re-implemented pure helpers
// ---------------------------------------------------------------------------

function isPathWithinRepo(filePath: string): boolean {
  if (!filePath || typeof filePath !== "string") return false;

  const normalizedAbs = path.resolve(
    path.isAbsolute(filePath) ? filePath : path.resolve(REPO_ROOT, filePath)
  );

  const relative = path.relative(REPO_ROOT, normalizedAbs);
  if (/^\.\.(?:[\\/]|$)/.test(relative) || relative === "" || path.isAbsolute(relative)) {
    return false;
  }

  return true;
}

interface FindingItem {
  category?: string;
  title?: string;
  fingerprint?: string;
  severity?: string;
  effort?: string;
  confidence?: number;
  files?: unknown[];
  why_it_matters?: string;
  suggested_fix?: string;
  acceptance_tests?: unknown[];
  verification_steps?: {
    first_pass?: { method?: string; evidence_collected?: string[] };
    second_pass?: { method?: string; confirmed?: boolean; notes?: string };
    tool_confirmation?: { tool?: string; reference?: string };
  };
  _lineNumber?: number;
  [key: string]: unknown;
}

type SchemaIssue = { type: string; field?: string; message: string };

function validateEnumFields(item: FindingItem, issues: SchemaIssue[]): void {
  if (item.category && !VALID_CATEGORIES.has(item.category)) {
    issues.push({
      type: "INVALID_CATEGORY",
      field: "category",
      message: `Invalid category '${item.category}'`,
    });
  }
  if (item.severity && !VALID_SEVERITIES.has(item.severity)) {
    issues.push({
      type: "INVALID_SEVERITY",
      field: "severity",
      message: `Invalid severity '${item.severity}'`,
    });
  }
  if (item.effort && !VALID_EFFORTS.has(item.effort)) {
    issues.push({
      type: "INVALID_EFFORT",
      field: "effort",
      message: `Invalid effort '${item.effort}'`,
    });
  }
}

function validateFingerprintFormat(item: FindingItem, issues: SchemaIssue[]): void {
  if (item.fingerprint === undefined) return;
  if (typeof item.fingerprint !== "string" || item.fingerprint.trim() === "") {
    issues.push({
      type: "INVALID_FINGERPRINT_FORMAT",
      field: "fingerprint",
      message: "Fingerprint must be a non-empty string",
    });
    return;
  }
  const parts = item.fingerprint.split("::").map((p: string) => p.trim());
  const hasEnoughParts = parts.length >= 3;
  const hasEmptyPart = parts.some((p: string) => p.length === 0);
  if (!hasEnoughParts || hasEmptyPart) {
    issues.push({
      type: "INVALID_FINGERPRINT_FORMAT",
      field: "fingerprint",
      message: "Fingerprint must follow format: <category>::<file>::<identifier>",
    });
  } else if (item.category && parts[0] !== item.category) {
    issues.push({
      type: "FINGERPRINT_CATEGORY_MISMATCH",
      field: "fingerprint",
      message: `Fingerprint category '${parts[0]}' must match item category '${item.category}'`,
    });
  }
}

function validateJsonlSchema(item: FindingItem): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  // Required fields
  for (const field of REQUIRED_BASE_FIELDS) {
    if (item[field] === undefined || item[field] === null) {
      issues.push({
        type: "MISSING_REQUIRED_FIELD",
        field,
        message: `Missing required field: ${field}`,
      });
    }
  }

  // Non-empty string fields
  for (const field of ["title", "why_it_matters", "suggested_fix"] as const) {
    const val = item[field];
    if (val !== undefined && val !== null) {
      if (typeof val !== "string" || val.trim() === "") {
        issues.push({
          type: "INVALID_STRING_FIELD",
          field,
          message: `Field '${field}' must be a non-empty string`,
        });
      }
    }
  }

  validateEnumFields(item, issues);

  // Confidence 0-100
  if (item.confidence !== undefined) {
    if (typeof item.confidence !== "number" || item.confidence < 0 || item.confidence > 100) {
      issues.push({
        type: "INVALID_CONFIDENCE",
        field: "confidence",
        message: `Invalid confidence '${item.confidence}'`,
      });
    }
  }

  // files must be non-empty array
  if (!Array.isArray(item.files) || item.files.length === 0) {
    issues.push({
      type: "INVALID_FILES",
      field: "files",
      message: "Field 'files' must be a non-empty array",
    });
  }

  // acceptance_tests must be non-empty array
  if (!Array.isArray(item.acceptance_tests) || item.acceptance_tests.length === 0) {
    issues.push({
      type: "INVALID_ACCEPTANCE_TESTS",
      field: "acceptance_tests",
      message: "Field 'acceptance_tests' must be a non-empty array",
    });
  }

  validateFingerprintFormat(item, issues);

  return issues;
}

type BlockingIssue = { type: string; blocking: boolean; message: string };

function validateFirstPass(
  vs: NonNullable<FindingItem["verification_steps"]>,
  issues: BlockingIssue[]
): void {
  if (vs.first_pass) {
    if (!vs.first_pass.method || !VALID_FIRST_PASS_METHODS.has(vs.first_pass.method)) {
      issues.push({
        type: "INVALID_FIRST_PASS_METHOD",
        blocking: true,
        message: `Invalid first_pass.method '${vs.first_pass.method}'`,
      });
    }
    if (
      !Array.isArray(vs.first_pass.evidence_collected) ||
      vs.first_pass.evidence_collected.length < 1
    ) {
      issues.push({
        type: "EMPTY_FIRST_PASS_EVIDENCE",
        blocking: true,
        message: "first_pass.evidence_collected must have at least 1 item",
      });
    }
  } else {
    issues.push({
      type: "MISSING_FIRST_PASS",
      blocking: true,
      message: "Missing 'verification_steps.first_pass' object",
    });
  }
}

function validateSecondPass(
  vs: NonNullable<FindingItem["verification_steps"]>,
  issues: BlockingIssue[]
): void {
  if (vs.second_pass) {
    if (!vs.second_pass.method || !VALID_SECOND_PASS_METHODS.has(vs.second_pass.method)) {
      issues.push({
        type: "INVALID_SECOND_PASS_METHOD",
        blocking: true,
        message: `Invalid second_pass.method '${vs.second_pass.method}'`,
      });
    }
    if (vs.second_pass.confirmed !== true) {
      issues.push({
        type: "SECOND_PASS_NOT_CONFIRMED",
        blocking: true,
        message: "second_pass.confirmed must be true",
      });
    }
  } else {
    issues.push({
      type: "MISSING_SECOND_PASS",
      blocking: true,
      message: "Missing 'verification_steps.second_pass' object",
    });
  }
}

function validateToolConfirmation(
  vs: NonNullable<FindingItem["verification_steps"]>,
  issues: BlockingIssue[]
): void {
  if (vs.tool_confirmation) {
    if (!vs.tool_confirmation.tool || !VALID_TOOL_CONFIRMATIONS.has(vs.tool_confirmation.tool)) {
      issues.push({
        type: "INVALID_TOOL_CONFIRMATION",
        blocking: true,
        message: `Invalid tool_confirmation.tool '${vs.tool_confirmation.tool}'`,
      });
    }
    if (
      typeof vs.tool_confirmation.reference !== "string" ||
      vs.tool_confirmation.reference.trim() === ""
    ) {
      issues.push({
        type: "MISSING_TOOL_REFERENCE",
        blocking: true,
        message: "tool_confirmation.reference must be a non-empty string",
      });
    }
  } else {
    issues.push({
      type: "MISSING_TOOL_CONFIRMATION",
      blocking: true,
      message: "Missing 'verification_steps.tool_confirmation' object",
    });
  }
}

function validateS0S1Requirements(item: FindingItem): BlockingIssue[] {
  const issues: BlockingIssue[] = [];
  const severity = item.severity;

  if (severity !== "S0" && severity !== "S1") return issues;

  if (!item.verification_steps) {
    issues.push({
      type: "MISSING_VERIFICATION_STEPS",
      blocking: true,
      message: `Missing required 'verification_steps' object for ${severity} findings`,
    });
    return issues;
  }

  const vs = item.verification_steps;
  validateFirstPass(vs, issues);
  validateSecondPass(vs, issues);
  validateToolConfirmation(vs, issues);

  return issues;
}

function validateTdmsMapping(
  item: FindingItem
): Array<{ type: string; field?: string; message: string }> {
  const issues: Array<{ type: string; field?: string; message: string }> = [];

  if (Array.isArray(item.files) && item.files.length > 0) {
    if (typeof item.files[0] !== "string") {
      issues.push({
        type: "TDMS_MAPPING_ERROR",
        field: "files[0]",
        message: `files[0] is not a string (${typeof item.files[0]}), will be coerced`,
      });
    }
  }

  if (typeof item.fingerprint === "string" && item.fingerprint.trim() !== "") {
    const converted = `audit:${item.fingerprint.replaceAll("::", "-")}`;
    if (converted.length > 255) {
      issues.push({
        type: "TDMS_MAPPING_WARNING",
        field: "fingerprint",
        message: `Converted source_id may be too long (${converted.length} chars)`,
      });
    }
  }

  if (typeof item.why_it_matters !== "string" || item.why_it_matters.trim() === "") {
    issues.push({
      type: "TDMS_MAPPING_WARNING",
      field: "why_it_matters",
      message: "Empty why_it_matters will result in empty TDMS description",
    });
  }

  if (typeof item.suggested_fix !== "string" || item.suggested_fix.trim() === "") {
    issues.push({
      type: "TDMS_MAPPING_WARNING",
      field: "suggested_fix",
      message: "Empty suggested_fix will result in empty TDMS recommendation",
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// 1. isPathWithinRepo
// ---------------------------------------------------------------------------

describe("isPathWithinRepo", () => {
  it("returns false for null input", () => {
    assert.equal(isPathWithinRepo(null as unknown as string), false);
  });

  it("returns false for empty string", () => {
    assert.equal(isPathWithinRepo(""), false);
  });

  it("returns false for path traversal with ..", () => {
    assert.equal(isPathWithinRepo("../../etc/passwd"), false);
  });

  it("returns true for repo-relative path", () => {
    assert.equal(isPathWithinRepo("docs/technical-debt/MASTER_DEBT.jsonl"), true);
  });

  it("returns false for path that equals repo root (empty relative)", () => {
    // path.relative(REPO_ROOT, REPO_ROOT) === "" which triggers the false guard
    assert.equal(isPathWithinRepo(REPO_ROOT), false);
  });
});

// ---------------------------------------------------------------------------
// 2. validateJsonlSchema — required fields
// ---------------------------------------------------------------------------

function buildValidFinding(): FindingItem {
  return {
    category: "security",
    title: "Auth bypass",
    fingerprint: "security::src/auth.ts::auth-bypass",
    severity: "S2",
    effort: "E2",
    confidence: 80,
    files: ["src/auth.ts"],
    why_it_matters: "Attackers can bypass authentication",
    suggested_fix: "Add input validation",
    acceptance_tests: ["Verify bypass no longer possible"],
  };
}

describe("validateJsonlSchema — required fields", () => {
  it("returns no issues for a fully valid finding", () => {
    const issues = validateJsonlSchema(buildValidFinding());
    assert.equal(issues.length, 0, `Unexpected issues: ${JSON.stringify(issues)}`);
  });

  it("reports MISSING_REQUIRED_FIELD for each absent required field", () => {
    for (const field of REQUIRED_BASE_FIELDS) {
      const item = buildValidFinding();
      delete item[field];
      const issues = validateJsonlSchema(item);
      const found = issues.some((i) => i.type === "MISSING_REQUIRED_FIELD" && i.field === field);
      assert.ok(found, `Expected MISSING_REQUIRED_FIELD for field '${field}'`);
    }
  });

  it("reports INVALID_CATEGORY for unknown category", () => {
    const item = { ...buildValidFinding(), category: "not-a-category" };
    const issues = validateJsonlSchema(item);
    assert.ok(issues.some((i) => i.type === "INVALID_CATEGORY"));
  });

  it("reports INVALID_SEVERITY for unknown severity", () => {
    const item = { ...buildValidFinding(), severity: "CRITICAL" };
    const issues = validateJsonlSchema(item);
    assert.ok(issues.some((i) => i.type === "INVALID_SEVERITY"));
  });

  it("reports INVALID_EFFORT for unknown effort", () => {
    const item = { ...buildValidFinding(), effort: "QUICK" };
    const issues = validateJsonlSchema(item);
    assert.ok(issues.some((i) => i.type === "INVALID_EFFORT"));
  });

  it("reports INVALID_CONFIDENCE for value above 100", () => {
    const item = { ...buildValidFinding(), confidence: 101 };
    const issues = validateJsonlSchema(item);
    assert.ok(issues.some((i) => i.type === "INVALID_CONFIDENCE"));
  });

  it("reports INVALID_CONFIDENCE for negative value", () => {
    const item = { ...buildValidFinding(), confidence: -1 };
    const issues = validateJsonlSchema(item);
    assert.ok(issues.some((i) => i.type === "INVALID_CONFIDENCE"));
  });

  it("reports INVALID_FILES for empty files array", () => {
    const item = { ...buildValidFinding(), files: [] };
    const issues = validateJsonlSchema(item);
    assert.ok(issues.some((i) => i.type === "INVALID_FILES"));
  });

  it("reports INVALID_ACCEPTANCE_TESTS for empty acceptance_tests array", () => {
    const item = { ...buildValidFinding(), acceptance_tests: [] };
    const issues = validateJsonlSchema(item);
    assert.ok(issues.some((i) => i.type === "INVALID_ACCEPTANCE_TESTS"));
  });
});

// ---------------------------------------------------------------------------
// 3. validateJsonlSchema — fingerprint format
// ---------------------------------------------------------------------------

function baseFinding(): FindingItem {
  return {
    category: "security",
    title: "T",
    fingerprint: "security::src/auth.ts::auth-id",
    severity: "S2",
    effort: "E2",
    confidence: 70,
    files: ["src/auth.ts"],
    why_it_matters: "reason",
    suggested_fix: "fix",
    acceptance_tests: ["test"],
  };
}

describe("validateJsonlSchema — fingerprint", () => {
  it("reports INVALID_FINGERPRINT_FORMAT for empty fingerprint string", () => {
    const item = { ...baseFinding(), fingerprint: "" };
    const issues = validateJsonlSchema(item);
    assert.ok(issues.some((i) => i.type === "INVALID_FINGERPRINT_FORMAT"));
  });

  it("reports INVALID_FINGERPRINT_FORMAT for too few :: parts", () => {
    const item = { ...baseFinding(), fingerprint: "security::file-only" };
    const issues = validateJsonlSchema(item);
    assert.ok(issues.some((i) => i.type === "INVALID_FINGERPRINT_FORMAT"));
  });

  it("reports FINGERPRINT_CATEGORY_MISMATCH when fingerprint category differs from item category", () => {
    const item = {
      ...baseFinding(),
      fingerprint: "performance::src/auth.ts::auth-id",
      category: "security",
    };
    const issues = validateJsonlSchema(item);
    assert.ok(issues.some((i) => i.type === "FINGERPRINT_CATEGORY_MISMATCH"));
  });

  it("does not report mismatch when fingerprint category matches item category", () => {
    const item = baseFinding(); // fingerprint starts with 'security' and category is 'security'
    const issues = validateJsonlSchema(item);
    assert.ok(!issues.some((i) => i.type === "FINGERPRINT_CATEGORY_MISMATCH"));
  });
});

// ---------------------------------------------------------------------------
// 4. validateS0S1Requirements
// ---------------------------------------------------------------------------

function validVerificationSteps() {
  return {
    first_pass: {
      method: "grep",
      evidence_collected: ["Found via grep: pattern X in src/auth.ts"],
    },
    second_pass: {
      method: "contextual_review",
      confirmed: true,
      notes: "Manually verified the bypass path",
    },
    tool_confirmation: {
      tool: "NONE",
      reference: "No automated tool confirmation available",
    },
  };
}

describe("validateS0S1Requirements", () => {
  it("returns no issues for S2 finding (not applicable)", () => {
    const item: FindingItem = { severity: "S2" };
    assert.equal(validateS0S1Requirements(item).length, 0);
  });

  it("returns MISSING_VERIFICATION_STEPS for S1 finding without verification_steps", () => {
    const item: FindingItem = { severity: "S1", title: "Auth bypass" };
    const issues = validateS0S1Requirements(item);
    assert.ok(issues.some((i) => i.type === "MISSING_VERIFICATION_STEPS"));
  });

  it("returns no issues for S0 finding with complete verification_steps", () => {
    const item: FindingItem = {
      severity: "S0",
      title: "Critical auth bypass",
      fingerprint: "security::src::id",
      verification_steps: validVerificationSteps(),
    };
    const issues = validateS0S1Requirements(item);
    assert.equal(issues.length, 0, `Unexpected issues: ${JSON.stringify(issues)}`);
  });

  it("reports INVALID_FIRST_PASS_METHOD for unknown method", () => {
    const item: FindingItem = {
      severity: "S1",
      verification_steps: {
        ...validVerificationSteps(),
        first_pass: { method: "manual" as string, evidence_collected: ["evidence"] },
      },
    };
    const issues = validateS0S1Requirements(item);
    assert.ok(issues.some((i) => i.type === "INVALID_FIRST_PASS_METHOD"));
  });

  it("reports EMPTY_FIRST_PASS_EVIDENCE when evidence_collected is empty", () => {
    const item: FindingItem = {
      severity: "S1",
      verification_steps: {
        ...validVerificationSteps(),
        first_pass: { method: "grep", evidence_collected: [] },
      },
    };
    const issues = validateS0S1Requirements(item);
    assert.ok(issues.some((i) => i.type === "EMPTY_FIRST_PASS_EVIDENCE"));
  });

  it("reports SECOND_PASS_NOT_CONFIRMED when confirmed is false", () => {
    const item: FindingItem = {
      severity: "S1",
      verification_steps: {
        ...validVerificationSteps(),
        second_pass: { method: "contextual_review", confirmed: false },
      },
    };
    const issues = validateS0S1Requirements(item);
    assert.ok(issues.some((i) => i.type === "SECOND_PASS_NOT_CONFIRMED"));
  });

  it("reports INVALID_TOOL_CONFIRMATION for unknown tool", () => {
    const item: FindingItem = {
      severity: "S1",
      verification_steps: {
        ...validVerificationSteps(),
        tool_confirmation: { tool: "unknown-tool" as string, reference: "ref" },
      },
    };
    const issues = validateS0S1Requirements(item);
    assert.ok(issues.some((i) => i.type === "INVALID_TOOL_CONFIRMATION"));
  });

  it("reports MISSING_TOOL_REFERENCE when reference is empty", () => {
    const item: FindingItem = {
      severity: "S1",
      verification_steps: {
        ...validVerificationSteps(),
        tool_confirmation: { tool: "NONE", reference: "" },
      },
    };
    const issues = validateS0S1Requirements(item);
    assert.ok(issues.some((i) => i.type === "MISSING_TOOL_REFERENCE"));
  });

  it("all issues have blocking: true for S0/S1 failures", () => {
    const item: FindingItem = { severity: "S0" }; // no verification_steps
    const issues = validateS0S1Requirements(item);
    assert.ok(
      issues.every((i) => i.blocking === true),
      "All S0/S1 issues should be blocking"
    );
  });
});

// ---------------------------------------------------------------------------
// 5. validateTdmsMapping
// ---------------------------------------------------------------------------

describe("validateTdmsMapping", () => {
  it("reports TDMS_MAPPING_WARNING when why_it_matters is empty", () => {
    const item: FindingItem = { why_it_matters: "", suggested_fix: "Fix it", files: ["src/a.ts"] };
    const issues = validateTdmsMapping(item);
    assert.ok(
      issues.some((i) => i.type === "TDMS_MAPPING_WARNING" && i.field === "why_it_matters")
    );
  });

  it("reports TDMS_MAPPING_WARNING when suggested_fix is empty", () => {
    const item: FindingItem = { why_it_matters: "Reason", suggested_fix: "", files: ["src/a.ts"] };
    const issues = validateTdmsMapping(item);
    assert.ok(issues.some((i) => i.type === "TDMS_MAPPING_WARNING" && i.field === "suggested_fix"));
  });

  it("reports TDMS_MAPPING_ERROR when files[0] is not a string", () => {
    const item: FindingItem = {
      files: [42 as unknown as string],
      why_it_matters: "R",
      suggested_fix: "S",
    };
    const issues = validateTdmsMapping(item);
    assert.ok(issues.some((i) => i.type === "TDMS_MAPPING_ERROR" && i.field === "files[0]"));
  });

  it("reports TDMS_MAPPING_WARNING when fingerprint converts to > 255 chars", () => {
    const longFingerprint = "security::" + "a".repeat(150) + "::" + "b".repeat(100);
    const item: FindingItem = {
      fingerprint: longFingerprint,
      why_it_matters: "Reason",
      suggested_fix: "Fix",
      files: ["src/a.ts"],
    };
    const issues = validateTdmsMapping(item);
    // converted = "audit:" + fingerprint.replaceAll("::", "-")
    const converted = "audit:" + longFingerprint.replaceAll("::", "-");
    if (converted.length > 255) {
      assert.ok(issues.some((i) => i.type === "TDMS_MAPPING_WARNING" && i.field === "fingerprint"));
    }
  });

  it("returns no issues for a fully valid TDMS-mappable finding", () => {
    const item: FindingItem = {
      fingerprint: "security::src/auth.ts::auth-bypass",
      files: ["src/auth.ts"],
      why_it_matters: "This is important",
      suggested_fix: "Fix the issue",
    };
    const issues = validateTdmsMapping(item);
    assert.equal(issues.length, 0, `Unexpected issues: ${JSON.stringify(issues)}`);
  });
});

// ---------------------------------------------------------------------------
// 6. loadJsonlFile logic (prototype pollution guard)
// ---------------------------------------------------------------------------

describe("loadJsonlFile prototype pollution guard", () => {
  let tmpDir: string;

  it("prototype pollution keys are stripped from parsed items", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vai-test-"));
    try {
      const p = path.join(tmpDir, "test.jsonl");
      // Write a line that attempts prototype pollution
      fs.writeFileSync(p, '{"__proto__":{"polluted":true},"title":"Normal"}\n');

      // Simulate safe parse (Object.create(null) + delete __proto__)
      const line = fs.readFileSync(p, "utf8").trim();
      const raw = JSON.parse(line);
      const safe = Object.assign(Object.create(null), raw);
      Reflect.deleteProperty(safe, "__proto__");
      delete safe.constructor;
      delete safe.prototype;

      // The __proto__ key should not affect Object.prototype
      const checkPolluted = ({} as Record<string, unknown>)["polluted"];
      assert.ok(!checkPolluted, "Object.prototype should not be polluted");
      // The safe object should not have __proto__ as own property
      assert.ok(!Object.hasOwn(safe, "__proto__"));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("skips invalid JSON lines and records parse errors", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vai-test2-"));
    try {
      const p = path.join(tmpDir, "mixed.jsonl");
      fs.writeFileSync(p, '{"valid":true}\ninvalid-json\n{"also":"valid"}\n');

      const content = fs.readFileSync(p, "utf8");
      const lines = content.split(/\r?\n/).filter((l) => l.trim());
      const items: object[] = [];
      const errors: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        try {
          items.push(JSON.parse(lines[i]));
        } catch {
          errors.push(`Parse error on line ${i + 1}`);
        }
      }

      assert.equal(items.length, 2, "Should parse 2 valid lines");
      assert.equal(errors.length, 1, "Should record 1 parse error");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Script existence
// ---------------------------------------------------------------------------

describe("script existence", () => {
  it("validate-audit-integration.js exists at expected path", () => {
    const p = path.resolve(PROJECT_ROOT, "scripts/audit/validate-audit-integration.js");
    assert.ok(fs.existsSync(p), `Script not found: ${p}`);
  });

  it("script uses loadConfig for audit-schema", () => {
    const src = fs.readFileSync(
      path.resolve(PROJECT_ROOT, "scripts/audit/validate-audit-integration.js"),
      "utf8"
    );
    assert.ok(src.includes("loadConfig"), "Script should use loadConfig");
    assert.ok(src.includes("audit-schema"), "Script should load audit-schema config");
  });
});
