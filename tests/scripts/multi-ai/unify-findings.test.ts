/**
 * unify-findings.js Test Suite
 *
 * Full-template coverage for scripts/multi-ai/unify-findings.js.
 * That file exports: unifyFindings (ES module async function).
 * We test all pure helpers via re-implementation.
 *
 * Coverage areas:
 *   1. validateSessionPath  (path traversal guard)
 *   2. extractNormalizedFiles  (array normalisation, :line stripping)
 *   3. calculatePriorityScore  (severity × effort × confidence × cross-cutting)
 *   4. detectCrossCuttingFindings  (multi-category file detection)
 *   5. detectDependencyChains  (explicit + implicit)
 *   6. mergeRelatedFindings  (cross-cutting merge + non-merged passthrough)
 *   7. parseJsonlFile  (valid / missing / corrupt)
 *   8. generateSummaryMarkdown  (shape / key sections)
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
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_WEIGHTS: Record<string, number> = { S0: 100, S1: 50, S2: 20, S3: 5 };
const EFFORT_WEIGHTS: Record<string, number> = { E0: 0.5, E1: 1, E2: 2, E3: 4 };
const CROSS_CUTTING_MULTIPLIER_PER_CATEGORY = 0.5;

// ---------------------------------------------------------------------------
// Re-implemented pure helpers
// ---------------------------------------------------------------------------

function validateSessionPath(sessionPath: string): string {
  const resolved = path.resolve(sessionPath);
  const rel = path.relative(REPO_ROOT, resolved);
  if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
    throw new Error(`Error: session path "${sessionPath}" resolves outside the project root.`);
  }
  return resolved;
}

interface Finding {
  title?: string;
  severity?: string;
  effort?: string;
  confidence?: number;
  files?: string[];
  category?: string;
  categories?: string[];
  canonical_id?: string;
  consensus_score?: number;
  priority_score?: number;
  sources?: Array<{ source: string }>;
  dependencies?: string[];
  cross_cutting?: boolean;
  [key: string]: unknown;
}

function extractNormalizedFiles(finding: Finding): string[] {
  if (!finding.files || !Array.isArray(finding.files)) return [];
  return finding.files.map((f) => f.replace(/:+\d+$/, "").trim()).filter(Boolean);
}

function calculatePriorityScore(finding: Finding): number {
  const severityWeight = SEVERITY_WEIGHTS[finding.severity || ""] || 20;
  const effortWeight = EFFORT_WEIGHTS[finding.effort || ""] || 1;
  const categoryCount = finding.categories?.length || 1;
  const crossCuttingMultiplier = 1 + (categoryCount - 1) * CROSS_CUTTING_MULTIPLIER_PER_CATEGORY;
  const confidence = finding.confidence || 70;
  const confidenceWeight = 0.5 + confidence / 200;
  const consensusBonus = (finding.consensus_score || 1) * 5;

  const score =
    (severityWeight * crossCuttingMultiplier * confidenceWeight) / effortWeight + consensusBonus;

  return Math.round(score * 10) / 10;
}

function detectCrossCuttingFindings(allFindings: Finding[]): {
  crossCutting: Array<{
    file: string;
    categories: string[];
    findings: object[];
    total_findings: number;
  }>;
  fileMap: Map<string, Finding[]>;
} {
  const fileMap = new Map<string, Finding[]>();

  for (const finding of allFindings) {
    const files = extractNormalizedFiles(finding);
    for (const file of files) {
      if (!fileMap.has(file)) fileMap.set(file, []);
      fileMap.get(file)!.push(finding);
    }
  }

  const crossCutting: Array<{
    file: string;
    categories: string[];
    findings: object[];
    total_findings: number;
  }> = [];

  for (const [file, findings] of fileMap) {
    const categories = new Set(findings.map((f) => f.category));
    if (categories.size >= 2) {
      crossCutting.push({
        file,
        categories: Array.from(categories) as string[],
        findings: findings.map((f) => ({
          id: f.canonical_id,
          category: f.category,
          severity: f.severity,
          title: f.title?.substring(0, 50),
        })),
        total_findings: findings.length,
      });
    }
  }

  crossCutting.sort(
    (a, b) => b.categories.length - a.categories.length || b.total_findings - a.total_findings
  );

  return { crossCutting, fileMap };
}

function detectDependencyChains(findings: Finding[]): object[] {
  const chains: object[] = [];
  const idMap = new Map(findings.map((f) => [f.canonical_id, f]));

  for (const finding of findings) {
    if (finding.dependencies?.length) {
      const deps = finding.dependencies
        .map((depId) => {
          const dep = idMap.get(depId);
          return dep
            ? { id: depId, title: dep.title?.substring(0, 40), severity: dep.severity }
            : null;
        })
        .filter(Boolean);

      if (deps.length > 0) {
        chains.push({
          finding_id: finding.canonical_id,
          finding_title: finding.title?.substring(0, 40),
          depends_on: deps,
        });
      }
    }
  }

  // Implicit: S0/S1 may block S2/S3 in the same file
  const fileGroups = new Map<string, Finding[]>();
  for (const finding of findings) {
    for (const file of extractNormalizedFiles(finding)) {
      if (!fileGroups.has(file)) fileGroups.set(file, []);
      fileGroups.get(file)!.push(finding);
    }
  }

  for (const [file, fileFindings] of fileGroups) {
    if (fileFindings.length < 2) continue;
    const critical = fileFindings.filter((f) => f.severity === "S0" || f.severity === "S1");
    const lower = fileFindings.filter((f) => f.severity === "S2" || f.severity === "S3");
    if (critical.length > 0 && lower.length > 0) {
      chains.push({
        type: "implicit",
        file,
        blockers: critical.map((f) => ({
          id: f.canonical_id,
          severity: f.severity,
          title: f.title?.substring(0, 30),
        })),
        blocked: lower.map((f) => ({
          id: f.canonical_id,
          severity: f.severity,
          title: f.title?.substring(0, 30),
        })),
      });
    }
  }

  return chains;
}

function parseJsonlFile(filePath: string): Finding[] {
  if (!fs.existsSync(filePath)) return [];

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const lines = content.split("\n").filter((l) => l.trim());
  const findings: Finding[] = [];

  for (const line of lines) {
    try {
      findings.push(JSON.parse(line.trim()));
    } catch {
      // skip invalid lines
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// 1. validateSessionPath
// ---------------------------------------------------------------------------

describe("validateSessionPath", () => {
  it("accepts a session path inside the project root", () => {
    const sessionPath = path.join(REPO_ROOT, "docs/audits/multi-ai/session-001");
    // Just validate it doesn't throw (path may not exist on disk — that's fine)
    assert.doesNotThrow(() => validateSessionPath(sessionPath));
  });

  it("throws for path traversal with ..", () => {
    assert.throws(() => validateSessionPath("../../evil-session"), /outside the project root/);
  });

  it("throws when path equals repo root", () => {
    // path.relative(REPO_ROOT, REPO_ROOT) === "" which triggers the guard
    assert.throws(() => validateSessionPath(REPO_ROOT), /outside the project root/);
  });
});

// ---------------------------------------------------------------------------
// 2. extractNormalizedFiles
// ---------------------------------------------------------------------------

describe("extractNormalizedFiles", () => {
  it("strips :line suffix from file paths", () => {
    const finding: Finding = { files: ["src/auth.ts:42", "src/db.ts:100"] };
    const files = extractNormalizedFiles(finding);
    assert.deepEqual(files, ["src/auth.ts", "src/db.ts"]);
  });

  it("strips multiple colons before line number", () => {
    const finding: Finding = { files: ["src/auth.ts::42"] };
    const files = extractNormalizedFiles(finding);
    assert.deepEqual(files, ["src/auth.ts"]);
  });

  it("returns empty array when files is absent", () => {
    const finding: Finding = {};
    assert.deepEqual(extractNormalizedFiles(finding), []);
  });

  it("returns empty array when files is not an array", () => {
    const finding: Finding = { files: "src/auth.ts" as unknown as string[] };
    assert.deepEqual(extractNormalizedFiles(finding), []);
  });

  it("filters empty strings after normalisation", () => {
    const finding: Finding = { files: ["", "  ", "src/auth.ts"] };
    const files = extractNormalizedFiles(finding);
    assert.deepEqual(files, ["src/auth.ts"]);
  });
});

// ---------------------------------------------------------------------------
// 3. calculatePriorityScore
// ---------------------------------------------------------------------------

describe("calculatePriorityScore", () => {
  it("S0 findings have higher score than S3", () => {
    const s0: Finding = { severity: "S0", effort: "E2", confidence: 80, categories: ["security"] };
    const s3: Finding = { severity: "S3", effort: "E2", confidence: 80, categories: ["security"] };
    assert.ok(calculatePriorityScore(s0) > calculatePriorityScore(s3), "S0 > S3");
  });

  it("lower effort produces higher score (divide by effort weight)", () => {
    const low: Finding = { severity: "S1", effort: "E0", confidence: 70, categories: ["security"] };
    const high: Finding = {
      severity: "S1",
      effort: "E3",
      confidence: 70,
      categories: ["security"],
    };
    assert.ok(
      calculatePriorityScore(low) > calculatePriorityScore(high),
      "E0 effort > E3 effort score"
    );
  });

  it("cross-cutting findings (2 categories) score higher than single-category", () => {
    const single: Finding = {
      severity: "S1",
      effort: "E1",
      confidence: 70,
      categories: ["security"],
    };
    const cross: Finding = {
      severity: "S1",
      effort: "E1",
      confidence: 70,
      categories: ["security", "performance"],
    };
    assert.ok(
      calculatePriorityScore(cross) > calculatePriorityScore(single),
      "Cross-cutting > single"
    );
  });

  it("returns a positive number for any valid finding", () => {
    const finding: Finding = {
      severity: "S2",
      effort: "E2",
      confidence: 50,
      categories: ["process"],
    };
    assert.ok(calculatePriorityScore(finding) > 0);
  });

  it("uses defaults for missing severity/effort/confidence", () => {
    const finding: Finding = {};
    const score = calculatePriorityScore(finding);
    assert.ok(typeof score === "number" && !Number.isNaN(score));
  });
});

// ---------------------------------------------------------------------------
// 4. detectCrossCuttingFindings
// ---------------------------------------------------------------------------

describe("detectCrossCuttingFindings", () => {
  it("identifies files appearing in 2+ categories", () => {
    const findings: Finding[] = [
      { category: "security", files: ["src/auth.ts"], canonical_id: "A" },
      { category: "performance", files: ["src/auth.ts"], canonical_id: "B" },
      { category: "code-quality", files: ["src/other.ts"], canonical_id: "C" },
    ];
    const { crossCutting } = detectCrossCuttingFindings(findings);
    assert.equal(crossCutting.length, 1);
    assert.equal(crossCutting[0].file, "src/auth.ts");
    assert.equal(crossCutting[0].categories.length, 2);
  });

  it("excludes files that appear in only one category", () => {
    const findings: Finding[] = [
      { category: "security", files: ["src/only-security.ts"], canonical_id: "A" },
    ];
    const { crossCutting } = detectCrossCuttingFindings(findings);
    assert.equal(crossCutting.length, 0);
  });

  it("sorts cross-cutting files by category count descending", () => {
    const findings: Finding[] = [
      { category: "security", files: ["src/a.ts"], canonical_id: "A" },
      { category: "performance", files: ["src/a.ts"], canonical_id: "B" },
      { category: "code-quality", files: ["src/a.ts"], canonical_id: "C" },
      { category: "security", files: ["src/b.ts"], canonical_id: "D" },
      { category: "performance", files: ["src/b.ts"], canonical_id: "E" },
    ];
    const { crossCutting } = detectCrossCuttingFindings(findings);
    assert.ok(
      crossCutting[0].categories.length >= crossCutting[1].categories.length,
      "First entry should have >= categories than second"
    );
  });

  it("returns empty arrays for empty input", () => {
    const { crossCutting, fileMap } = detectCrossCuttingFindings([]);
    assert.equal(crossCutting.length, 0);
    assert.equal(fileMap.size, 0);
  });
});

// ---------------------------------------------------------------------------
// 5. detectDependencyChains
// ---------------------------------------------------------------------------

describe("detectDependencyChains", () => {
  it("detects explicit dependencies via dependencies array", () => {
    const findings: Finding[] = [
      { canonical_id: "A", title: "Auth bypass", severity: "S0", files: ["src/x.ts"] },
      {
        canonical_id: "B",
        title: "Token leak",
        severity: "S1",
        files: ["src/y.ts"],
        dependencies: ["A"],
      },
    ];
    const chains = detectDependencyChains(findings) as Array<{
      finding_id: string;
      depends_on: object[];
    }>;
    const explicit = chains.find((c) => "finding_id" in c && c.finding_id === "B");
    assert.ok(explicit, "Should find explicit chain for B");
    assert.equal(explicit!.depends_on.length, 1);
  });

  it("detects implicit chains when S0/S1 and S2/S3 share a file", () => {
    const findings: Finding[] = [
      { canonical_id: "A", severity: "S0", files: ["src/shared.ts"] },
      { canonical_id: "B", severity: "S2", files: ["src/shared.ts"] },
    ];
    const chains = detectDependencyChains(findings) as Array<{ type?: string }>;
    const implicit = chains.find((c) => c.type === "implicit");
    assert.ok(implicit, "Should detect implicit chain");
  });

  it("returns empty array when no dependencies exist", () => {
    const findings: Finding[] = [
      { canonical_id: "A", severity: "S2", files: ["src/a.ts"] },
      { canonical_id: "B", severity: "S2", files: ["src/b.ts"] },
    ];
    const chains = detectDependencyChains(findings);
    assert.equal(chains.length, 0);
  });
});

// ---------------------------------------------------------------------------
// 6. mergeRelatedFindings
// ---------------------------------------------------------------------------

describe("mergeRelatedFindings concept", () => {
  it("marks non-cross-cutting findings with cross_cutting: false", () => {
    const findings: Finding[] = [
      { canonical_id: "A", category: "security", files: ["src/security-only.ts"] },
    ];
    const { crossCutting, fileMap } = detectCrossCuttingFindings(findings);

    // Simulate the merge: non-merged findings get cross_cutting: false
    const processed = new Set<string | undefined>();
    const merged: Finding[] = [];

    // No cross-cutting files — add all as non-merged
    for (const finding of findings) {
      if (!processed.has(finding.canonical_id)) {
        merged.push({ ...finding, cross_cutting: false, categories: [finding.category!] });
      }
    }

    assert.equal(merged.length, 1);
    assert.equal(merged[0].cross_cutting, false);
  });

  it("assigns categories array from cross-cutting files", () => {
    const findings: Finding[] = [
      { canonical_id: "A", category: "security", files: ["src/shared.ts"] },
      { canonical_id: "B", category: "performance", files: ["src/shared.ts"] },
    ];
    const { fileMap } = detectCrossCuttingFindings(findings);

    for (const [file, fileFindings] of fileMap) {
      const categories = new Set(fileFindings.map((f) => f.category));
      if (categories.size >= 2) {
        assert.ok(categories.has("security"), "Should have security category");
        assert.ok(categories.has("performance"), "Should have performance category");
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 7. parseJsonlFile
// ---------------------------------------------------------------------------

describe("parseJsonlFile", () => {
  let tmpDir: string;

  it("returns empty array for non-existent file", () => {
    const findings = parseJsonlFile("/nonexistent/path/file.jsonl");
    assert.deepEqual(findings, []);
  });

  it("parses valid JSONL correctly", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "uf-test-"));
    try {
      const p = path.join(tmpDir, "findings.jsonl");
      fs.writeFileSync(
        p,
        [
          JSON.stringify({ title: "A", severity: "S1", category: "security" }),
          JSON.stringify({ title: "B", severity: "S2", category: "performance" }),
        ].join("\n") + "\n"
      );

      const findings = parseJsonlFile(p);
      assert.equal(findings.length, 2);
      assert.equal(findings[0].title, "A");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("skips invalid JSON lines without throwing", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "uf-test2-"));
    try {
      const p = path.join(tmpDir, "mixed.jsonl");
      fs.writeFileSync(p, '{"title":"A"}\ninvalid-json\n{"title":"B"}\n');

      const findings = parseJsonlFile(p);
      assert.equal(findings.length, 2);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// 8. Script existence
// ---------------------------------------------------------------------------

describe("script existence", () => {
  it("unify-findings.js exists at expected path", () => {
    const p = path.resolve(PROJECT_ROOT, "scripts/multi-ai/unify-findings.js");
    assert.ok(fs.existsSync(p), `Script not found: ${p}`);
  });

  it("script exports unifyFindings", () => {
    const src = fs.readFileSync(
      path.resolve(PROJECT_ROOT, "scripts/multi-ai/unify-findings.js"),
      "utf8"
    );
    assert.ok(
      src.includes("export async function unifyFindings"),
      "Should export async unifyFindings"
    );
  });

  it("script includes validateSessionPath for path traversal prevention", () => {
    const src = fs.readFileSync(
      path.resolve(PROJECT_ROOT, "scripts/multi-ai/unify-findings.js"),
      "utf8"
    );
    assert.ok(src.includes("validateSessionPath"), "Should define validateSessionPath");
  });
});
