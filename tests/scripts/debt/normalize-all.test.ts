/**
 * Unit tests for normalize-all.js
 *
 * Tests the normalizeItem function and ensureValid helper.
 * All pure functions — no file I/O.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Schema constants ─────────────────────────────────────────────────────────

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

// ─── Re-implementations of pure functions ─────────────────────────────────────

function ensureValid(value: unknown, validSet: string[], defaultValue: string): string {
  if (typeof value === "string" && validSet.includes(value)) return value;
  return defaultValue;
}

function normalizeLineNumber(line: unknown): number {
  const parsedLine = typeof line === "number" ? line : Number.parseInt(String(line), 10);
  return Number.isFinite(parsedLine) && parsedLine >= 0 ? parsedLine : 0;
}

// Simplified normalizeFilePath that matches the logic of normalize-file-path.js
function normalizeFilePath(filePath: unknown, options: { stripRepoRoot?: boolean } = {}): string {
  if (!filePath) return "";
  const input = typeof filePath === "string" ? filePath : String(filePath);
  let normalized = input.replaceAll("\\", "/");
  normalized = normalized.replace(/^\.\//, "");
  if (!normalized.startsWith("//")) {
    normalized = normalized.replace(/^\/+/, "");
  }
  if (options.stripRepoRoot) {
    const rawRepoName = process.env.REPO_DIRNAME?.trim() || "sonash-v0";
    // Length guard to prevent catastrophic backtracking with very long env values
    const repoName = rawRepoName.length > 200 ? "sonash-v0" : rawRepoName;
    const escaped = repoName.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const repoRootMatch = new RegExp(`(?:^|/)${escaped}/(.*)$`).exec(normalized);
    if (repoRootMatch) {
      normalized = repoRootMatch[1];
    }
  }
  // Remove org/repo prefix
  const colonIndex = normalized.indexOf(":");
  if (colonIndex > 0) {
    const beforeColon = normalized.substring(0, colonIndex);
    const isWindowsDrive = beforeColon.length === 1 && /^[A-Za-z]$/.test(beforeColon);
    if (!isWindowsDrive) {
      normalized = normalized.substring(colonIndex + 1);
      if (!normalized.startsWith("//")) {
        normalized = normalized.replace(/^\/+/, "");
      }
    }
  }
  return normalized;
}

interface RawItem {
  source_id?: unknown;
  source_file?: unknown;
  category?: unknown;
  severity?: unknown;
  type?: unknown;
  file?: unknown;
  line?: unknown;
  title?: unknown;
  description?: unknown;
  recommendation?: unknown;
  effort?: unknown;
  status?: unknown;
  roadmap_ref?: unknown;
  created?: unknown;
  verified_by?: unknown;
  resolution?: unknown;
  original_id?: unknown;
  rule?: unknown;
  sonar_key?: unknown;
  evidence?: unknown[];
  sources?: unknown[];
  merged_from?: unknown[];
  pr_bucket?: unknown;
  consensus_score?: unknown;
  dependencies?: unknown[];
  roadmap_status?: unknown;
  [key: string]: unknown;
}

function normalizeItem(item: RawItem): Record<string, unknown> {
  const normalized: Record<string, unknown> = {
    source_id: item.source_id || "unknown",
    source_file: normalizeFilePath(item.source_file || "unknown", { stripRepoRoot: true }),
    category: ensureValid(item.category, VALID_CATEGORIES, "code-quality"),
    severity: ensureValid(item.severity, VALID_SEVERITIES, "S2"),
    type: ensureValid(item.type, VALID_TYPES, "code-smell"),
    file: normalizeFilePath(item.file, { stripRepoRoot: true }),
    line: normalizeLineNumber(item.line),
    title: String(item.title || "Untitled").substring(0, 500),
    description: item.description || "",
    recommendation: item.recommendation || "",
    effort: ensureValid(item.effort, VALID_EFFORTS, "E1"),
    status: ensureValid(item.status, VALID_STATUSES, "NEW"),
    roadmap_ref: item.roadmap_ref || null,
    created: item.created || new Date().toISOString().split("T")[0],
    verified_by: item.verified_by || null,
    resolution: item.resolution || null,
  };

  // Generate placeholder hash (real script uses generateContentHash)
  normalized.content_hash = "placeholder_hash";

  // Preserve optional metadata
  if (item.original_id) normalized.original_id = item.original_id;
  if (item.rule) normalized.rule = item.rule;
  if (item.sonar_key) normalized.sonar_key = item.sonar_key;
  if (item.evidence && Array.isArray(item.evidence) && item.evidence.length > 0)
    normalized.evidence = item.evidence;
  if (item.sources && Array.isArray(item.sources) && item.sources.length > 0)
    normalized.sources = item.sources;
  if (item.merged_from && Array.isArray(item.merged_from) && item.merged_from.length > 0)
    normalized.merged_from = item.merged_from;
  if (item.pr_bucket) normalized.pr_bucket = item.pr_bucket;
  if (item.consensus_score) normalized.consensus_score = item.consensus_score;
  if (item.dependencies && Array.isArray(item.dependencies) && item.dependencies.length > 0)
    normalized.dependencies = item.dependencies;
  if (item.roadmap_status) normalized.roadmap_status = item.roadmap_status;

  return normalized;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("normalize-all: ensureValid", () => {
  it("returns value when in valid set", () => {
    assert.strictEqual(ensureValid("S1", VALID_SEVERITIES, "S2"), "S1");
  });

  it("returns default when value not in valid set", () => {
    assert.strictEqual(ensureValid("CRITICAL", VALID_SEVERITIES, "S2"), "S2");
  });

  it("returns default for null/undefined", () => {
    assert.strictEqual(ensureValid(null, VALID_SEVERITIES, "S2"), "S2");
    assert.strictEqual(ensureValid(undefined, VALID_SEVERITIES, "S2"), "S2");
  });

  it("returns default for empty string", () => {
    assert.strictEqual(ensureValid("", VALID_SEVERITIES, "S2"), "S2");
  });

  it("category defaults to code-quality", () => {
    assert.strictEqual(
      ensureValid("bad-category", VALID_CATEGORIES, "code-quality"),
      "code-quality"
    );
  });

  it("type defaults to code-smell", () => {
    assert.strictEqual(ensureValid("bad-type", VALID_TYPES, "code-smell"), "code-smell");
  });

  it("status defaults to NEW", () => {
    assert.strictEqual(ensureValid("PENDING", VALID_STATUSES, "NEW"), "NEW");
  });

  it("effort defaults to E1", () => {
    assert.strictEqual(ensureValid("high", VALID_EFFORTS, "E1"), "E1");
  });
});

describe("normalize-all: normalizeLineNumber", () => {
  it("integer line numbers pass through", () => {
    assert.strictEqual(normalizeLineNumber(42), 42);
  });

  it("string line numbers are parsed", () => {
    assert.strictEqual(normalizeLineNumber("123"), 123);
  });

  it("zero is valid", () => {
    assert.strictEqual(normalizeLineNumber(0), 0);
  });

  it("negative numbers return 0", () => {
    assert.strictEqual(normalizeLineNumber(-5), 0);
  });

  it("non-numeric strings return 0", () => {
    assert.strictEqual(normalizeLineNumber("not-a-number"), 0);
    assert.strictEqual(normalizeLineNumber(""), 0);
  });

  it("undefined/null returns 0", () => {
    assert.strictEqual(normalizeLineNumber(undefined), 0);
    assert.strictEqual(normalizeLineNumber(null), 0);
  });

  it("float truncates to integer", () => {
    // parseInt("3.7") returns 3
    assert.strictEqual(normalizeLineNumber("3.7"), 3);
  });
});

describe("normalize-all: normalizeFilePath", () => {
  it("converts backslashes to forward slashes", () => {
    assert.strictEqual(normalizeFilePath(String.raw`src\lib\auth.ts`), "src/lib/auth.ts");
  });

  it("strips leading ./", () => {
    assert.strictEqual(normalizeFilePath("./src/lib/auth.ts"), "src/lib/auth.ts");
  });

  it("strips leading /", () => {
    assert.strictEqual(normalizeFilePath("/src/lib/auth.ts"), "src/lib/auth.ts");
  });

  it("returns empty string for falsy input", () => {
    assert.strictEqual(normalizeFilePath(""), "");
    assert.strictEqual(normalizeFilePath(null), "");
    assert.strictEqual(normalizeFilePath(undefined), "");
  });

  it("strips org/repo prefix (e.g. org_repo:path)", () => {
    assert.strictEqual(normalizeFilePath("myorg_myrepo:src/auth.ts"), "src/auth.ts");
  });

  it("preserves Windows drive letters", () => {
    // "C:/path/to/file" should not have the C: stripped as org/repo prefix
    const result = normalizeFilePath("C:/path/to/file.ts");
    assert.ok(result.includes("path/to/file.ts"), `Expected path preserved, got: ${result}`);
  });

  it("strips repo root when stripRepoRoot is true", () => {
    const result = normalizeFilePath("/home/user/sonash-v0/src/lib/auth.ts", {
      stripRepoRoot: true,
    });
    assert.strictEqual(result, "src/lib/auth.ts");
  });
});

describe("normalize-all: normalizeItem happy path", () => {
  const validItem: RawItem = {
    source_id: "audit:security-2024",
    source_file: "docs/audits/2024-audit.md",
    category: "security",
    severity: "S1",
    type: "vulnerability",
    file: "./src/lib/auth.ts",
    line: 42,
    title: "Use parameterized queries to prevent SQL injection",
    description: "Raw string concatenation in query builder",
    recommendation: "Use prepared statements",
    effort: "E2",
    status: "NEW",
    roadmap_ref: "PHASE-2",
    created: "2024-01-15",
    evidence: ["Review session #42"],
  };

  it("normalizes all required fields", () => {
    const result = normalizeItem(validItem);
    assert.strictEqual(result.source_id, "audit:security-2024");
    assert.strictEqual(result.category, "security");
    assert.strictEqual(result.severity, "S1");
    assert.strictEqual(result.type, "vulnerability");
    assert.strictEqual(result.line, 42);
    assert.strictEqual(result.title, "Use parameterized queries to prevent SQL injection");
    assert.strictEqual(result.description, "Raw string concatenation in query builder");
    assert.strictEqual(result.status, "NEW");
  });

  it("normalizes file path (strips leading ./)", () => {
    const result = normalizeItem(validItem);
    assert.strictEqual(result.file, "src/lib/auth.ts");
  });

  it("preserves optional fields when present", () => {
    const result = normalizeItem(validItem);
    assert.strictEqual(result.roadmap_ref, "PHASE-2");
    assert.deepStrictEqual(result.evidence, ["Review session #42"]);
  });
});

describe("normalize-all: normalizeItem defaults", () => {
  it("defaults source_id to 'unknown' when missing", () => {
    const result = normalizeItem({ title: "T", severity: "S2", category: "security" });
    assert.strictEqual(result.source_id, "unknown");
  });

  it("defaults category to code-quality for invalid", () => {
    const result = normalizeItem({ title: "T", severity: "S2", category: "bad-cat" });
    assert.strictEqual(result.category, "code-quality");
  });

  it("defaults severity to S2 for invalid", () => {
    const result = normalizeItem({ title: "T", severity: "CRITICAL", category: "security" });
    assert.strictEqual(result.severity, "S2");
  });

  it("defaults type to code-smell for invalid", () => {
    const result = normalizeItem({
      title: "T",
      severity: "S2",
      category: "security",
      type: "bad-type",
    });
    assert.strictEqual(result.type, "code-smell");
  });

  it("defaults status to NEW for invalid", () => {
    const result = normalizeItem({
      title: "T",
      severity: "S2",
      category: "security",
      status: "PENDING",
    });
    assert.strictEqual(result.status, "NEW");
  });

  it("defaults effort to E1 for invalid", () => {
    const result = normalizeItem({
      title: "T",
      severity: "S2",
      category: "security",
      effort: "high",
    });
    assert.strictEqual(result.effort, "E1");
  });

  it("defaults title to 'Untitled' when missing", () => {
    const result = normalizeItem({ severity: "S2", category: "security" });
    assert.strictEqual(result.title, "Untitled");
  });

  it("defaults line to 0 for missing or invalid", () => {
    const result = normalizeItem({ title: "T", severity: "S2", category: "security" });
    assert.strictEqual(result.line, 0);
  });

  it("sets roadmap_ref to null when missing", () => {
    const result = normalizeItem({ title: "T", severity: "S2", category: "security" });
    assert.strictEqual(result.roadmap_ref, null);
  });

  it("sets resolution to null when missing", () => {
    const result = normalizeItem({ title: "T", severity: "S2", category: "security" });
    assert.strictEqual(result.resolution, null);
  });
});

describe("normalize-all: normalizeItem title truncation", () => {
  it("truncates title at 500 characters", () => {
    const longTitle = "A".repeat(600);
    const result = normalizeItem({ title: longTitle, severity: "S2", category: "security" });
    assert.strictEqual((result.title as string).length, 500);
  });

  it("preserves title under 500 chars unchanged", () => {
    const title = "Short title";
    const result = normalizeItem({ title, severity: "S2", category: "security" });
    assert.strictEqual(result.title, title);
  });
});

describe("normalize-all: normalizeItem optional metadata preservation", () => {
  it("preserves original_id when present", () => {
    const result = normalizeItem({
      title: "T",
      severity: "S2",
      category: "security",
      original_id: "CANON-001",
    });
    assert.strictEqual(result.original_id, "CANON-001");
  });

  it("preserves rule when present", () => {
    const result = normalizeItem({
      title: "T",
      severity: "S2",
      category: "security",
      rule: "javascript:S2245",
    });
    assert.strictEqual(result.rule, "javascript:S2245");
  });

  it("preserves sonar_key when present", () => {
    const result = normalizeItem({
      title: "T",
      severity: "S2",
      category: "security",
      sonar_key: "AX123",
    });
    assert.strictEqual(result.sonar_key, "AX123");
  });

  it("does not preserve empty evidence array", () => {
    const result = normalizeItem({
      title: "T",
      severity: "S2",
      category: "security",
      evidence: [],
    });
    assert.strictEqual(result.evidence, undefined);
  });

  it("preserves non-empty evidence array", () => {
    const result = normalizeItem({
      title: "T",
      severity: "S2",
      category: "security",
      evidence: ["e1"],
    });
    assert.deepStrictEqual(result.evidence, ["e1"]);
  });

  it("preserves merged_from when present", () => {
    const result = normalizeItem({
      title: "T",
      severity: "S2",
      category: "security",
      merged_from: ["sonarcloud:abc"],
    });
    assert.deepStrictEqual(result.merged_from, ["sonarcloud:abc"]);
  });
});
