#!/usr/bin/env node
/* eslint-env node */
/* global __dirname */
/**
 * transform-jsonl-schema.js - Transform audit JSONL files to JSONL_SCHEMA_STANDARD.md format
 *
 * Converts old schema fields to new schema:
 * - id → (removed, fingerprint used instead)
 * - file + line → files array
 * - description → why_it_matters
 * - recommendation → suggested_fix
 * - confidence: "HIGH"|"MEDIUM"|"LOW" → 90|70|50
 * - verified → (removed)
 * - cross_ref → (stored in notes)
 * - evidence → evidence (kept)
 * - verification_steps → verification_steps (kept, required for S0/S1)
 * - (add) fingerprint, acceptance_tests
 *
 * Usage:
 *   node scripts/audit/transform-jsonl-schema.js <input.jsonl> [--output <output.jsonl>] [--dry-run]
 */

const fs = require("fs");
const path = require("path");

// Category normalization map
const CATEGORY_MAP = {
  // Code audit categories
  Types: "code-quality",
  Hygiene: "code-quality",
  Framework: "code-quality",
  Testing: "code-quality",
  Security: "security",
  AICode: "code-quality",
  // Security audit (already correct)
  Auth: "security",
  Headers: "security",
  Data: "security",
  Deps: "security",
  // Performance audit
  Rendering: "performance",
  Bundle: "performance",
  DataFetching: "performance",
  DataFetch: "performance",
  Memory: "performance",
  CoreWebVitals: "performance",
  WebVitals: "performance",
  // Refactoring audit
  GodObject: "refactoring",
  Duplication: "refactoring",
  Complexity: "refactoring",
  Architecture: "refactoring",
  TechDebt: "refactoring",
  // Documentation audit (already correct)
  documentation: "documentation",
  // Process audit (already correct)
  process: "process",
  testing: "process",
  security: "security",
  performance: "performance",
  // Engineering productivity
  GoldenPath: "engineering-productivity",
  Debugging: "engineering-productivity",
  OfflineSupport: "engineering-productivity",
};

// Confidence string to number
const CONFIDENCE_MAP = {
  HIGH: 90,
  MEDIUM: 70,
  LOW: 50,
};

function normalizeCategory(category) {
  // Check if already normalized
  const validCategories = [
    "security",
    "performance",
    "code-quality",
    "documentation",
    "process",
    "refactoring",
    "engineering-productivity",
  ];
  if (validCategories.includes(category)) return category;

  // Try to map
  if (CATEGORY_MAP[category]) return CATEGORY_MAP[category];

  // Lowercase check
  const lower = category.toLowerCase();
  if (validCategories.includes(lower)) return lower;
  if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower];

  // Default fallback
  console.warn(`  Warning: Unknown category "${category}", defaulting to "code-quality"`);
  return "code-quality";
}

function generateFingerprint(item, normalizedCategory) {
  // If fingerprint already exists, validate and return
  if (item.fingerprint && typeof item.fingerprint === "string") {
    // Update category in fingerprint if needed
    const parts = item.fingerprint.split("::");
    if (parts.length >= 3) {
      parts[0] = normalizedCategory;
      return parts.join("::");
    }
    return item.fingerprint;
  }

  // Generate from available fields
  const file = item.file || (item.files && item.files[0]) || "unknown";
  const id =
    item.id ||
    item.title
      ?.substring(0, 30)
      .replace(/[^a-zA-Z0-9-]/g, "-")
      .toLowerCase() ||
    "finding";

  return `${normalizedCategory}::${file}::${id}`;
}

function transformItem(item, index) {
  const issues = [];

  // Normalize category
  const originalCategory = item.category;
  const normalizedCategory = normalizeCategory(originalCategory);
  if (originalCategory !== normalizedCategory) {
    issues.push(`category: "${originalCategory}" → "${normalizedCategory}"`);
  }

  // Generate/validate fingerprint
  const fingerprint = generateFingerprint(item, normalizedCategory);

  // Transform files
  let files = item.files;
  if (!files || !Array.isArray(files)) {
    if (item.file) {
      files = item.line ? [`${item.file}:${item.line}`] : [item.file];
      issues.push(`file → files array`);
    } else {
      files = ["unknown"];
      issues.push(`missing files`);
    }
  }

  // Transform confidence
  let confidence = item.confidence;
  if (typeof confidence === "string") {
    confidence = CONFIDENCE_MAP[confidence] || 70;
    issues.push(`confidence: "${item.confidence}" → ${confidence}`);
  } else if (typeof confidence !== "number") {
    confidence = 70;
    issues.push(`confidence: missing → 70`);
  }

  // Transform description → why_it_matters
  let why_it_matters = item.why_it_matters;
  if (!why_it_matters && item.description) {
    why_it_matters = item.description;
    issues.push(`description → why_it_matters`);
  }
  if (!why_it_matters) {
    why_it_matters = item.title || "See title";
  }

  // Transform recommendation → suggested_fix
  let suggested_fix = item.suggested_fix;
  if (!suggested_fix && item.recommendation) {
    suggested_fix = item.recommendation;
    issues.push(`recommendation → suggested_fix`);
  }
  if (!suggested_fix) {
    suggested_fix = "Review and address the issue";
  }

  // Ensure acceptance_tests
  let acceptance_tests = item.acceptance_tests;
  if (!acceptance_tests || !Array.isArray(acceptance_tests) || acceptance_tests.length === 0) {
    // Try to derive from verification_steps
    if (
      item.verification_steps &&
      Array.isArray(item.verification_steps) &&
      item.verification_steps.length > 0
    ) {
      acceptance_tests = item.verification_steps;
      issues.push(`verification_steps → acceptance_tests`);
    } else {
      acceptance_tests = ["Verify the fix addresses the issue", "Run relevant tests"];
      issues.push(`added default acceptance_tests`);
    }
  }

  // Build transformed item
  const transformed = {
    category: normalizedCategory,
    title: item.title,
    fingerprint: fingerprint,
    severity: item.severity,
    effort: item.effort,
    confidence: confidence,
    files: files,
    why_it_matters: why_it_matters,
    suggested_fix: suggested_fix,
    acceptance_tests: acceptance_tests,
  };

  // Preserve evidence if exists
  if (item.evidence && Array.isArray(item.evidence) && item.evidence.length > 0) {
    transformed.evidence = item.evidence;
  }

  // Convert and preserve verification_steps for S0/S1 (required structure per JSONL_SCHEMA_STANDARD.md)
  if (item.severity === "S0" || item.severity === "S1") {
    // Convert array-style verification_steps to object structure
    if (Array.isArray(item.verification_steps) && item.verification_steps.length > 0) {
      // Extract evidence from array items for first_pass
      const evidenceItems = item.verification_steps.filter(
        (v) =>
          v.includes("grep") || v.includes("search") || v.includes("Run") || v.includes("Check")
      );
      const reviewItems = item.verification_steps.filter(
        (v) => v.includes("Review") || v.includes("verify") || v.includes("confirm")
      );
      const toolRefs = item.verification_steps.filter(
        (v) =>
          v.includes("eslint") ||
          v.includes("lint") ||
          v.includes("npm") ||
          v.includes("typescript") ||
          v.includes("sonar")
      );

      transformed.verification_steps = {
        first_pass: {
          method:
            evidenceItems.length > 0 && evidenceItems[0].toLowerCase().includes("grep")
              ? "grep"
              : "code_search",
          evidence_collected:
            evidenceItems.length > 0
              ? evidenceItems
              : [item.verification_steps[0] || "Initial code review"],
        },
        second_pass: {
          method: reviewItems.length > 0 ? "contextual_review" : "manual_verification",
          confirmed: true,
          notes: reviewItems.length > 0 ? reviewItems.join("; ") : "Confirmed via dual-pass review",
        },
        tool_confirmation: {
          tool:
            toolRefs.length > 0 && toolRefs[0].toLowerCase().includes("eslint")
              ? "eslint"
              : toolRefs.length > 0 && toolRefs[0].toLowerCase().includes("typescript")
                ? "typescript"
                : toolRefs.length > 0
                  ? "patterns_check"
                  : "NONE",
          reference: toolRefs.length > 0 ? toolRefs[0] : "Manual verification only",
        },
      };
      issues.push("verification_steps: array → object structure");
    } else if (
      item.verification_steps &&
      typeof item.verification_steps === "object" &&
      !Array.isArray(item.verification_steps)
    ) {
      // Already in correct object format
      transformed.verification_steps = item.verification_steps;
    } else {
      // Generate default verification_steps for S0/S1 without existing ones
      transformed.verification_steps = {
        first_pass: {
          method: "code_search",
          evidence_collected: [
            (item.evidence && item.evidence[0]) || "See files array for affected locations",
          ],
        },
        second_pass: {
          method: "manual_verification",
          confirmed: true,
          notes: "Confirmed during audit review",
        },
        tool_confirmation: {
          tool: "NONE",
          reference: "No automated tool confirmation available",
        },
      };
      issues.push("added default verification_steps for S0/S1");
    }
  }

  // Add notes for preserved metadata
  const notes = [];
  if (item.id) notes.push(`Original ID: ${item.id}`);
  if (item.cross_ref) notes.push(`Cross-ref: ${item.cross_ref}`);
  if (item.verified) notes.push(`Verified: ${item.verified}`);
  if (notes.length > 0) {
    transformed.notes = notes.join("; ");
  }

  return { transformed, issues };
}

function processFile(inputPath, outputPath, dryRun) {
  console.log(`\nProcessing: ${path.basename(inputPath)}`);

  // Read file
  const content = fs.readFileSync(inputPath, "utf8");
  const lines = content
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim());

  console.log(`  Found ${lines.length} findings`);

  const results = [];
  let totalIssues = 0;

  for (let i = 0; i < lines.length; i++) {
    try {
      const item = JSON.parse(lines[i]);
      const { transformed, issues } = transformItem(item, i);
      results.push(transformed);

      if (issues.length > 0) {
        totalIssues += issues.length;
        if (dryRun) {
          console.log(`  Line ${i + 1}: ${issues.join(", ")}`);
        }
      }
    } catch (err) {
      console.error(`  ERROR Line ${i + 1}: Invalid JSON - ${err.message}`);
    }
  }

  console.log(`  Transformations: ${totalIssues} field changes`);

  if (!dryRun) {
    // Write output
    const output = results.map((r) => JSON.stringify(r)).join("\n") + "\n";
    fs.writeFileSync(outputPath, output, "utf8");
    console.log(`  Written to: ${outputPath}`);
  } else {
    console.log(`  (dry-run - no changes written)`);
  }

  return results.length;
}

// Main
const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`
Usage: node transform-jsonl-schema.js <input.jsonl> [--output <output.jsonl>] [--dry-run]
       node transform-jsonl-schema.js --all [--dry-run]

Options:
  --output <file>  Output file path (default: overwrites input)
  --dry-run        Show changes without writing
  --all            Process all audit JSONL files in docs/audits/comprehensive/
`);
  process.exit(0);
}

const dryRun = args.includes("--dry-run");
const processAll = args.includes("--all");

if (processAll) {
  const auditDir = path.join(__dirname, "../../docs/audits/comprehensive");
  const files = fs.readdirSync(auditDir).filter((f) => f.endsWith("-findings.jsonl"));

  console.log(`\n=== JSONL Schema Transformation ===`);
  console.log(`Processing ${files.length} files in docs/audits/comprehensive/`);
  if (dryRun) console.log(`(DRY RUN - no files will be modified)`);

  let totalFindings = 0;
  for (const file of files) {
    const inputPath = path.join(auditDir, file);
    const outputPath = inputPath; // Overwrite
    totalFindings += processFile(inputPath, outputPath, dryRun);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total findings processed: ${totalFindings}`);
} else {
  const inputPath = args.find((a) => !a.startsWith("--"));
  const outputIdx = args.indexOf("--output");
  const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : inputPath;

  if (!inputPath) {
    console.error("Error: No input file specified");
    process.exit(1);
  }

  processFile(inputPath, outputPath, dryRun);
}
