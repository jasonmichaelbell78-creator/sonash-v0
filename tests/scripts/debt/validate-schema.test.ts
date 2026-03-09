/**
 * Unit tests for validate-schema.js
 *
 * Tests the validateItem function and parseArgs logic extracted from the script.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Schema constants (mirrors scripts/config/audit-schema.json) ─────────────

const VALID_CATEGORIES = [
  "security",
  "performance",
  "code-quality",
  "documentation",
  "process",
  "refactoring",
  "engineering-productivity",
  "enhancements",
  "ai-optimization",
];
const VALID_SEVERITIES = ["S0", "S1", "S2", "S3"];
const VALID_TYPES = [
  "bug",
  "code-smell",
  "vulnerability",
  "hotspot",
  "tech-debt",
  "process-gap",
  "enhancement",
];
const VALID_STATUSES = ["NEW", "VERIFIED", "FALSE_POSITIVE", "IN_PROGRESS", "RESOLVED"];
const VALID_EFFORTS = ["E0", "E1", "E2", "E3"];
const REQUIRED_FIELDS = ["id", "source_id", "title", "severity", "category", "status"];

// ─── Re-implementation of validateItem (pure function, no fs) ─────────────────

interface DebtItem {
  id?: string;
  source_id?: string;
  title?: string;
  severity?: string;
  category?: string;
  status?: string;
  type?: string;
  effort?: string;
  file?: string;
  line?: unknown;
  created?: string;
  content_hash?: string;
  verification_steps?: unknown;
  counter_argument?: string;
  confidence?: number;
  subcategory?: unknown;
  impact?: string;
  [key: string]: unknown;
}

function validateItem(item: DebtItem, lineNum: number): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (item[field] === undefined || item[field] === null || item[field] === "") {
      errors.push(`Line ${lineNum}: Missing required field: ${field}`);
    }
  }

  // ID format
  if (item.id && !/^DEBT-\d{4,}$/.test(item.id)) {
    errors.push(`Line ${lineNum}: Invalid ID format: "${item.id}" (expected DEBT-XXXX)`);
  }

  // source_id format
  if (item.source_id) {
    const validSourceIdPattern = /^(?:audit:|sonarcloud:|manual:|review:|CANON-)/;
    if (!validSourceIdPattern.test(item.source_id)) {
      warnings.push(`Line ${lineNum}: Non-standard source_id format: "${item.source_id}"`);
    }
  }

  // category
  if (item.category && !VALID_CATEGORIES.includes(item.category)) {
    errors.push(`Line ${lineNum}: Invalid category: "${item.category}"`);
  }

  // severity
  if (item.severity && !VALID_SEVERITIES.includes(item.severity)) {
    errors.push(`Line ${lineNum}: Invalid severity: "${item.severity}"`);
  }

  // type
  if (item.type && !VALID_TYPES.includes(item.type)) {
    errors.push(`Line ${lineNum}: Invalid type: "${item.type}"`);
  }

  // status
  if (item.status && !VALID_STATUSES.includes(item.status)) {
    errors.push(`Line ${lineNum}: Invalid status: "${item.status}"`);
  }

  // effort
  if (item.effort && !VALID_EFFORTS.includes(item.effort)) {
    warnings.push(`Line ${lineNum}: Invalid effort: "${item.effort}"`);
  }

  // content_hash format
  if (item.content_hash && !/^[a-f0-9]{64}$/.test(item.content_hash)) {
    warnings.push(`Line ${lineNum}: Invalid content_hash format (expected 64 hex chars)`);
  }

  // file path
  if (item.file) {
    const f = String(item.file).trim();
    const isNumericOnly = /^\d[\d-]*$/.test(f);
    const isPlaceholder = ["multiple", "various", "several", "unknown", "n/a", "tbd"].includes(
      f.toLowerCase()
    );
    const hasPathChars = f.includes(".") || f.includes("/") || f.includes("\\");
    if (isNumericOnly || isPlaceholder || !hasPathChars) {
      warnings.push(`Line ${lineNum}: Invalid file path: "${f}"`);
    }
  }

  // line number
  if (item.line !== undefined && (typeof item.line !== "number" || (item.line as number) < 0)) {
    warnings.push(`Line ${lineNum}: Invalid line number: ${item.line}`);
  }

  // created date
  if (item.created && !/^\d{4}-\d{2}-\d{2}$/.test(item.created)) {
    warnings.push(`Line ${lineNum}: Invalid created date format: "${item.created}"`);
  }

  // enhancement type validations
  if (item.type === "enhancement") {
    if (item.counter_argument !== undefined && !item.counter_argument) {
      warnings.push(`Line ${lineNum}: Enhancement has empty counter_argument (honesty guard)`);
    }
    if (item.confidence !== undefined) {
      if (typeof item.confidence !== "number" || item.confidence < 0 || item.confidence > 100) {
        warnings.push(
          `Line ${lineNum}: Enhancement confidence must be 0-100, got: ${item.confidence}`
        );
      } else if (item.confidence < 70) {
        warnings.push(
          `Line ${lineNum}: Enhancement confidence below threshold (${item.confidence} < 70)`
        );
      }
    }
    if (item.impact !== undefined && !/^I[0-3]$/.test(item.impact)) {
      warnings.push(`Line ${lineNum}: Enhancement impact must be I0-I3, got: "${item.impact}"`);
    }
  }

  // S0/S1 verification_steps
  if ((item.severity === "S0" || item.severity === "S1") && !item.verification_steps) {
    warnings.push(`Line ${lineNum}: S0/S1 finding "${item.id}" missing verification_steps`);
  }

  // content_hash presence
  if (!item.content_hash) {
    warnings.push(`Line ${lineNum}: Missing content_hash (needed for deduplication)`);
  }

  return { errors, warnings };
}

// ─── Re-implementation of parseArgs ─────────────────────────────────────────

function parseArgs(args: string[]): {
  strict: boolean;
  quiet: boolean;
  stagedOnly: boolean;
  file?: string;
} {
  const parsed: { strict: boolean; quiet: boolean; stagedOnly: boolean; file?: string } = {
    strict: false,
    quiet: false,
    stagedOnly: false,
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--strict") {
      parsed.strict = true;
    } else if (arg === "--quiet") {
      parsed.quiet = true;
    } else if (arg === "--staged-only") {
      parsed.stagedOnly = true;
    } else if (arg === "--file" && args[i + 1]) {
      parsed.file = args[++i];
    } else if (!arg.startsWith("--")) {
      parsed.file = arg;
    }
  }
  return parsed;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("validate-schema: validateItem happy path", () => {
  const validItem: DebtItem = {
    id: "DEBT-0001",
    source_id: "audit:security-2024-01-01",
    title: "Use parameterized queries",
    severity: "S1",
    category: "security",
    status: "NEW",
    type: "vulnerability",
    effort: "E2",
    file: "src/lib/db.ts",
    line: 42,
    created: "2024-01-15",
    content_hash: "a".repeat(64),
  };

  it("valid item has no errors", () => {
    const { errors } = validateItem(validItem, 1);
    assert.strictEqual(errors.length, 0);
  });

  it("valid item has only expected warnings (missing verification_steps for S1)", () => {
    const { warnings } = validateItem(validItem, 1);
    // Only warning should be the S1 verification_steps warning
    assert.ok(warnings.every((w) => w.includes("verification_steps")));
  });
});

describe("validate-schema: validateItem required fields", () => {
  it("detects missing id", () => {
    const item: DebtItem = {
      source_id: "audit:x",
      title: "T",
      severity: "S2",
      category: "security",
      status: "NEW",
    };
    const { errors } = validateItem(item, 1);
    assert.ok(errors.some((e) => e.includes("Missing required field: id")));
  });

  it("detects missing title", () => {
    const item: DebtItem = {
      id: "DEBT-0001",
      source_id: "audit:x",
      severity: "S2",
      category: "security",
      status: "NEW",
    };
    const { errors } = validateItem(item, 1);
    assert.ok(errors.some((e) => e.includes("Missing required field: title")));
  });

  it("detects all 6 missing required fields on empty object", () => {
    const { errors } = validateItem({}, 1);
    assert.ok(errors.length >= REQUIRED_FIELDS.length);
  });
});

describe("validate-schema: validateItem ID format", () => {
  it("accepts DEBT-0001 format", () => {
    const item: DebtItem = {
      id: "DEBT-0001",
      source_id: "audit:x",
      title: "T",
      severity: "S2",
      category: "security",
      status: "NEW",
      content_hash: "a".repeat(64),
    };
    const { errors } = validateItem(item, 1);
    assert.ok(!errors.some((e) => e.includes("Invalid ID format")));
  });

  it("rejects lowercase id format", () => {
    const item: DebtItem = {
      id: "debt-001",
      source_id: "audit:x",
      title: "T",
      severity: "S2",
      category: "security",
      status: "NEW",
    };
    const { errors } = validateItem(item, 1);
    assert.ok(errors.some((e) => e.includes("Invalid ID format")));
  });

  it("rejects non-padded id format", () => {
    const item: DebtItem = {
      id: "DEBT-1",
      source_id: "audit:x",
      title: "T",
      severity: "S2",
      category: "security",
      status: "NEW",
    };
    const { errors } = validateItem(item, 1);
    assert.ok(errors.some((e) => e.includes("Invalid ID format")));
  });
});

describe("validate-schema: validateItem severity", () => {
  it("accepts valid severities S0-S3", () => {
    for (const sev of VALID_SEVERITIES) {
      const item: DebtItem = {
        id: "DEBT-0001",
        source_id: "audit:x",
        title: "T",
        severity: sev,
        category: "security",
        status: "NEW",
        content_hash: "a".repeat(64),
      };
      const { errors } = validateItem(item, 1);
      assert.ok(!errors.some((e) => e.includes("Invalid severity")), `${sev} should be valid`);
    }
  });

  it("rejects invalid severity", () => {
    const item: DebtItem = {
      id: "DEBT-0001",
      source_id: "audit:x",
      title: "T",
      severity: "CRITICAL",
      category: "security",
      status: "NEW",
    };
    const { errors } = validateItem(item, 1);
    assert.ok(errors.some((e) => e.includes("Invalid severity")));
  });
});

describe("validate-schema: validateItem category", () => {
  it("accepts all valid categories", () => {
    for (const cat of VALID_CATEGORIES) {
      const item: DebtItem = {
        id: "DEBT-0001",
        source_id: "audit:x",
        title: "T",
        severity: "S2",
        category: cat,
        status: "NEW",
        content_hash: "a".repeat(64),
      };
      const { errors } = validateItem(item, 1);
      assert.ok(!errors.some((e) => e.includes("Invalid category")), `${cat} should be valid`);
    }
  });

  it("rejects invalid category", () => {
    const item: DebtItem = {
      id: "DEBT-0001",
      source_id: "audit:x",
      title: "T",
      severity: "S2",
      category: "not-a-category",
      status: "NEW",
    };
    const { errors } = validateItem(item, 1);
    assert.ok(errors.some((e) => e.includes("Invalid category")));
  });
});

describe("validate-schema: validateItem file path", () => {
  it("rejects numeric-only file paths", () => {
    const item: DebtItem = {
      id: "DEBT-0001",
      source_id: "audit:x",
      title: "T",
      severity: "S2",
      category: "security",
      status: "NEW",
      file: "42",
      content_hash: "a".repeat(64),
    };
    const { warnings } = validateItem(item, 1);
    assert.ok(warnings.some((w) => w.includes("Invalid file path")));
  });

  it("rejects placeholder file paths", () => {
    const placeholders = ["multiple", "various", "unknown", "n/a", "tbd"];
    for (const placeholder of placeholders) {
      const item: DebtItem = {
        id: "DEBT-0001",
        source_id: "audit:x",
        title: "T",
        severity: "S2",
        category: "security",
        status: "NEW",
        file: placeholder,
        content_hash: "a".repeat(64),
      };
      const { warnings } = validateItem(item, 1);
      assert.ok(
        warnings.some((w) => w.includes("Invalid file path")),
        `"${placeholder}" should trigger invalid file path warning`
      );
    }
  });

  it("accepts valid file paths", () => {
    const item: DebtItem = {
      id: "DEBT-0001",
      source_id: "audit:x",
      title: "T",
      severity: "S2",
      category: "security",
      status: "NEW",
      file: "src/lib/auth.ts",
      content_hash: "a".repeat(64),
    };
    const { warnings } = validateItem(item, 1);
    assert.ok(!warnings.some((w) => w.includes("Invalid file path")));
  });
});

describe("validate-schema: validateItem content_hash", () => {
  it("warns when content_hash is missing", () => {
    const item: DebtItem = {
      id: "DEBT-0001",
      source_id: "audit:x",
      title: "T",
      severity: "S2",
      category: "security",
      status: "NEW",
    };
    const { warnings } = validateItem(item, 1);
    assert.ok(warnings.some((w) => w.includes("Missing content_hash")));
  });

  it("warns when content_hash is not 64 hex chars", () => {
    const item: DebtItem = {
      id: "DEBT-0001",
      source_id: "audit:x",
      title: "T",
      severity: "S2",
      category: "security",
      status: "NEW",
      content_hash: "abc123",
    };
    const { warnings } = validateItem(item, 1);
    assert.ok(warnings.some((w) => w.includes("Invalid content_hash format")));
  });

  it("accepts valid 64-char hex content_hash", () => {
    const item: DebtItem = {
      id: "DEBT-0001",
      source_id: "audit:x",
      title: "T",
      severity: "S2",
      category: "security",
      status: "NEW",
      content_hash: "a".repeat(64),
    };
    const { warnings } = validateItem(item, 1);
    assert.ok(!warnings.some((w) => w.includes("Invalid content_hash format")));
  });
});

describe("validate-schema: validateItem enhancement type", () => {
  it("warns on low confidence for enhancement type", () => {
    const item: DebtItem = {
      id: "DEBT-0001",
      source_id: "audit:x",
      title: "T",
      severity: "S2",
      category: "enhancements",
      status: "NEW",
      type: "enhancement",
      content_hash: "a".repeat(64),
      confidence: 60,
    };
    const { warnings } = validateItem(item, 1);
    assert.ok(warnings.some((w) => w.includes("confidence below threshold")));
  });

  it("warns on empty counter_argument for enhancement", () => {
    const item: DebtItem = {
      id: "DEBT-0001",
      source_id: "audit:x",
      title: "T",
      severity: "S2",
      category: "enhancements",
      status: "NEW",
      type: "enhancement",
      content_hash: "a".repeat(64),
      counter_argument: "",
    };
    const { warnings } = validateItem(item, 1);
    assert.ok(warnings.some((w) => w.includes("empty counter_argument")));
  });

  it("warns on invalid impact for enhancement", () => {
    const item: DebtItem = {
      id: "DEBT-0001",
      source_id: "audit:x",
      title: "T",
      severity: "S2",
      category: "enhancements",
      status: "NEW",
      type: "enhancement",
      content_hash: "a".repeat(64),
      impact: "HIGH",
    };
    const { warnings } = validateItem(item, 1);
    assert.ok(warnings.some((w) => w.includes("impact must be I0-I3")));
  });

  it("accepts valid impact I0-I3", () => {
    for (const impact of ["I0", "I1", "I2", "I3"]) {
      const item: DebtItem = {
        id: "DEBT-0001",
        source_id: "audit:x",
        title: "T",
        severity: "S2",
        category: "enhancements",
        status: "NEW",
        type: "enhancement",
        content_hash: "a".repeat(64),
        impact,
      };
      const { warnings } = validateItem(item, 1);
      assert.ok(
        !warnings.some((w) => w.includes("impact must be I0-I3")),
        `${impact} should be valid`
      );
    }
  });
});

describe("validate-schema: validateItem S0/S1 verification_steps", () => {
  it("warns when S0 item is missing verification_steps", () => {
    const item: DebtItem = {
      id: "DEBT-0001",
      source_id: "audit:x",
      title: "T",
      severity: "S0",
      category: "security",
      status: "NEW",
      content_hash: "a".repeat(64),
    };
    const { warnings } = validateItem(item, 1);
    assert.ok(warnings.some((w) => w.includes("verification_steps")));
  });

  it("does not warn for S2 without verification_steps", () => {
    const item: DebtItem = {
      id: "DEBT-0001",
      source_id: "audit:x",
      title: "T",
      severity: "S2",
      category: "security",
      status: "NEW",
      content_hash: "a".repeat(64),
    };
    const { warnings } = validateItem(item, 1);
    assert.ok(!warnings.some((w) => w.includes("verification_steps")));
  });
});

describe("validate-schema: parseArgs", () => {
  it("defaults: strict=false, quiet=false, stagedOnly=false", () => {
    const result = parseArgs([]);
    assert.strictEqual(result.strict, false);
    assert.strictEqual(result.quiet, false);
    assert.strictEqual(result.stagedOnly, false);
    assert.strictEqual(result.file, undefined);
  });

  it("--strict enables strict mode", () => {
    const result = parseArgs(["--strict"]);
    assert.strictEqual(result.strict, true);
  });

  it("--quiet enables quiet mode", () => {
    const result = parseArgs(["--quiet"]);
    assert.strictEqual(result.quiet, true);
  });

  it("--staged-only enables staged mode", () => {
    const result = parseArgs(["--staged-only"]);
    assert.strictEqual(result.stagedOnly, true);
  });

  it("--file sets the file path", () => {
    const result = parseArgs(["--file", "/path/to/file.jsonl"]);
    assert.strictEqual(result.file, "/path/to/file.jsonl");
  });

  it("positional argument sets file path", () => {
    const result = parseArgs(["my-file.jsonl"]);
    assert.strictEqual(result.file, "my-file.jsonl");
  });

  it("combines multiple flags", () => {
    const result = parseArgs(["--strict", "--quiet", "--file", "foo.jsonl"]);
    assert.strictEqual(result.strict, true);
    assert.strictEqual(result.quiet, true);
    assert.strictEqual(result.file, "foo.jsonl");
  });
});

describe("validate-schema: duplicate detection", () => {
  it("detects duplicate IDs in a JSONL file simulation", () => {
    const lines = [
      JSON.stringify({
        id: "DEBT-0001",
        source_id: "audit:a",
        title: "T1",
        severity: "S2",
        category: "security",
        status: "NEW",
        content_hash: "a".repeat(64),
      }),
      JSON.stringify({
        id: "DEBT-0002",
        source_id: "audit:b",
        title: "T2",
        severity: "S2",
        category: "security",
        status: "NEW",
        content_hash: "b".repeat(64),
      }),
      JSON.stringify({
        id: "DEBT-0001",
        source_id: "audit:c",
        title: "T3",
        severity: "S2",
        category: "security",
        status: "NEW",
        content_hash: "c".repeat(64),
      }),
    ];

    const seenIds = new Set<string>();
    const duplicateIds: { id: string; line: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const item = JSON.parse(lines[i]) as DebtItem;
      if (item.id) {
        if (seenIds.has(item.id)) {
          duplicateIds.push({ id: item.id, line: i + 1 });
        }
        seenIds.add(item.id);
      }
    }

    assert.strictEqual(duplicateIds.length, 1);
    assert.strictEqual(duplicateIds[0].id, "DEBT-0001");
    assert.strictEqual(duplicateIds[0].line, 3);
  });

  it("detects duplicate content_hashes", () => {
    const hash = "a".repeat(64);
    const lines = [
      JSON.stringify({
        id: "DEBT-0001",
        source_id: "audit:a",
        title: "T1",
        severity: "S2",
        category: "security",
        status: "NEW",
        content_hash: hash,
      }),
      JSON.stringify({
        id: "DEBT-0002",
        source_id: "audit:b",
        title: "T2",
        severity: "S2",
        category: "security",
        status: "NEW",
        content_hash: hash,
      }),
    ];

    const seenHashes = new Set<string>();
    const duplicateHashes: { hash: string; line: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const item = JSON.parse(lines[i]) as DebtItem;
      if (item.content_hash) {
        if (seenHashes.has(item.content_hash)) {
          duplicateHashes.push({ hash: item.content_hash.substring(0, 8), line: i + 1 });
        }
        seenHashes.add(item.content_hash);
      }
    }

    assert.strictEqual(duplicateHashes.length, 1);
  });
});
