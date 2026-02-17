#!/usr/bin/env node
/* global __dirname */

/**
 * validate-templates.js - Template compliance validator
 *
 * Validates multi-AI audit templates against AUDIT_STANDARDS.md Section 6 requirements.
 * Checks each template for required sections, structure, and canonical category alignment.
 *
 * Usage:
 *   node scripts/audit/validate-templates.js          # Human-readable report
 *   node scripts/audit/validate-templates.js --json    # Machine-readable JSON output
 *
 * Exit codes:
 *   0 - All templates >= 70% compliance
 *   1 - One or more templates below 70% compliance
 */

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const TEMPLATES_DIR = path.join(REPO_ROOT, "docs", "audits", "multi-ai", "templates");

// Files to exclude from validation (not category audit templates)
const EXCLUDED_FILES = new Set(["SHARED_TEMPLATE_BASE.md", "AGGREGATOR.md"]);

// Map from filename token to canonical category
const FILENAME_TO_CATEGORY = {
  CODE_REVIEW: "code-quality",
  SECURITY: "security",
  PERFORMANCE: "performance",
  REFACTORING: "refactoring",
  DOCUMENTATION: "documentation",
  PROCESS: "process",
  ENGINEERING_PRODUCTIVITY: "engineering-productivity",
  ENHANCEMENT: "enhancements",
  AI_OPTIMIZATION: "ai-optimization",
};

/**
 * Read a file safely, returning its content or null on error.
 * @param {string} filePath - Absolute path to the file
 * @returns {{ content: string|null, error: string|null }}
 */
function safeReadFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return { content, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: null, error: message };
  }
}

/**
 * List template files in the templates directory, excluding non-category files.
 * @returns {{ files: string[], error: string|null }}
 */
function listTemplateFiles() {
  try {
    const entries = fs.readdirSync(TEMPLATES_DIR);
    const mdFiles = entries.filter((f) => f.endsWith(".md") && !EXCLUDED_FILES.has(f));
    return { files: mdFiles, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { files: [], error: message };
  }
}

/**
 * Check whether a markdown file contains a heading (any level) matching a pattern.
 * Performs a case-insensitive search across all headings.
 * @param {string} content - File content
 * @param {string[]} keywords - Keywords to look for in headings (any match = pass)
 * @returns {boolean}
 */
function hasHeadingWithKeywords(content, keywords) {
  // Match any markdown heading line (# through ######)
  const headingLines = content.split("\n").filter((line) => /^#{1,6}\s+/.test(line));
  const lowerKeywords = keywords.map((k) => k.toLowerCase());

  for (const heading of headingLines) {
    const lowerHeading = heading.toLowerCase();
    for (const keyword of lowerKeywords) {
      if (lowerHeading.includes(keyword)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Extract the canonical category from a template filename.
 * @param {string} filename - e.g. "CODE_REVIEW_AUDIT.md"
 * @returns {string|null} The matched canonical category or null
 */
function extractCategoryFromFilename(filename) {
  // Remove trailing _AUDIT.md (case-insensitive)
  const stem = filename.replace(/\.md$/i, "").replace(/_AUDIT$/i, "");

  // Try direct lookup
  if (FILENAME_TO_CATEGORY[stem]) {
    return FILENAME_TO_CATEGORY[stem];
  }

  // Try matching against all known tokens
  for (const [token, category] of Object.entries(FILENAME_TO_CATEGORY)) {
    if (stem.toUpperCase() === token) {
      return category;
    }
  }

  return null;
}

/**
 * Validate a single template file against all required checks.
 * @param {string} filename - Template filename
 * @param {string} content - Template file content
 * @returns {{ filename: string, checks: Array<{name: string, passed: boolean, detail: string}>, score: number, percentage: number }}
 */
function validateTemplate(filename, content) {
  const lines = content.split("\n");
  const lineCount = lines.length;
  const checks = [];

  // Total number of checks
  const TOTAL_CHECKS = 10;

  // Check 1: Has a markdown heading level 1
  const hasH1 = lines.some((line) => /^#\s+/.test(line));
  checks.push({
    name: "H1 heading",
    passed: hasH1,
    detail: hasH1 ? "Found top-level heading" : "MISSING",
  });

  // Check 2: Category name in filename matches a canonical category
  const category = extractCategoryFromFilename(filename);
  checks.push({
    name: "Canonical category",
    passed: category !== null,
    detail:
      category === null
        ? "MISSING - filename does not match any canonical category"
        : `Matches "${category}"`,
  });

  // Check 3: File is not empty and has more than 20 lines
  const hasMinLines = lineCount > 20;
  checks.push({
    name: "Minimum length (>20 lines)",
    passed: hasMinLines,
    detail: hasMinLines ? `${lineCount} lines` : `MISSING - only ${lineCount} lines`,
  });

  // Check 4: Purpose or Scope heading
  const hasPurpose = hasHeadingWithKeywords(content, ["purpose", "scope"]);
  checks.push({
    name: "Purpose/Scope section",
    passed: hasPurpose,
    detail: hasPurpose ? "Found" : "MISSING",
  });

  // Check 5: Prompt or Instructions heading
  const hasPrompt = hasHeadingWithKeywords(content, ["prompt", "instructions"]);
  checks.push({
    name: "Prompt/Instructions section",
    passed: hasPrompt,
    detail: hasPrompt ? "Found" : "MISSING",
  });

  // Check 6: Sub-Categories or Focus Areas heading
  const hasSubCategories = hasHeadingWithKeywords(content, [
    "sub-categories",
    "sub categories",
    "subcategories",
    "focus areas",
    "focus area",
    "review scope",
    "audit scope",
    "review categories",
    "audit categories",
    "review domains",
    "audit domains",
  ]);
  checks.push({
    name: "Sub-categories/Focus areas section",
    passed: hasSubCategories,
    detail: hasSubCategories ? "Found" : "MISSING",
  });

  // Check 7: Output Format heading
  const hasOutputFormat = hasHeadingWithKeywords(content, ["output format", "output"]);
  checks.push({
    name: "Output format section",
    passed: hasOutputFormat,
    detail: hasOutputFormat ? "Found" : "MISSING",
  });

  // Check 8: Quality Guardrails heading
  const hasGuardrails = hasHeadingWithKeywords(content, [
    "quality guardrails",
    "guardrails",
    "quality checks",
    "quality gates",
  ]);
  checks.push({
    name: "Quality guardrails section",
    passed: hasGuardrails,
    detail: hasGuardrails ? "Found" : "MISSING",
  });

  // Check 9: TDMS Integration heading (or "intake" or "technical debt")
  const hasTdms = hasHeadingWithKeywords(content, [
    "tdms integration",
    "tdms",
    "intake",
    "technical debt",
  ]);
  checks.push({
    name: "TDMS integration section",
    passed: hasTdms,
    detail: hasTdms ? "Found" : "MISSING",
  });

  // Check 10: JSONL output example or schema reference
  const hasJsonlExample = content.includes("```json") || content.includes("JSONL_SCHEMA");
  checks.push({
    name: "JSONL example/schema reference",
    passed: hasJsonlExample,
    detail: hasJsonlExample ? "Found" : "MISSING",
  });

  const passed = checks.filter((c) => c.passed).length;
  const percentage = Math.round((passed / TOTAL_CHECKS) * 100);

  return {
    filename,
    checks,
    score: passed,
    total: TOTAL_CHECKS,
    percentage,
    category,
  };
}

/**
 * Format a human-readable compliance report.
 * @param {Array} results - Array of validation results
 * @returns {string}
 */
function formatHumanReport(results) {
  const lines = [];

  lines.push("Template Compliance Report", "\u2550".repeat(27), "");

  for (const result of results) {
    // Filename with dotted leader and score
    const label = result.filename;
    const scoreText = `${result.percentage}% (${result.score}/${result.total})`;
    const dotsNeeded = Math.max(2, 50 - label.length - scoreText.length);
    const dots = " " + ".".repeat(dotsNeeded) + " ";
    lines.push(`${label}${dots}${scoreText}`);

    // Individual check results
    for (const check of result.checks) {
      const icon = check.passed ? "\u2705" : "\u274C";
      const suffix = check.passed ? "" : ` (${check.detail})`;
      lines.push(`  ${icon} ${check.name}${suffix}`);
    }
    lines.push("");
  }

  // Overall summary
  const passingCount = results.filter((r) => r.percentage >= 80).length;
  const totalTemplates = results.length;
  const averageScore =
    totalTemplates > 0
      ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / totalTemplates)
      : 0;

  lines.push(
    `Overall: ${passingCount}/${totalTemplates} templates at 80%+ compliance`,
    `Average score: ${averageScore}%`
  );

  // Warn about any below threshold
  const belowThreshold = results.filter((r) => r.percentage < 70);
  if (belowThreshold.length > 0) {
    lines.push("");
    lines.push(`WARNING: ${belowThreshold.length} template(s) below 70% compliance threshold:`);
    for (const r of belowThreshold) {
      lines.push(`  - ${r.filename}: ${r.percentage}%`);
    }
  }

  return lines.join("\n");
}

/**
 * Format machine-readable JSON output.
 * @param {Array} results - Array of validation results
 * @returns {object}
 */
function formatJsonReport(results) {
  const totalTemplates = results.length;
  const averageScore =
    totalTemplates > 0
      ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / totalTemplates)
      : 0;
  const passingAt80 = results.filter((r) => r.percentage >= 80).length;
  const belowThreshold = results.filter((r) => r.percentage < 70);

  return {
    summary: {
      totalTemplates,
      passingAt80Percent: passingAt80,
      averageScore,
      belowThresholdCount: belowThreshold.length,
      allAboveThreshold: belowThreshold.length === 0,
    },
    templates: results.map((r) => ({
      filename: r.filename,
      category: r.category,
      score: r.score,
      total: r.total,
      percentage: r.percentage,
      checks: r.checks.map((c) => ({
        name: c.name,
        passed: c.passed,
        detail: c.detail,
      })),
    })),
  };
}

/**
 * Exit with a fatal error, formatting output per mode.
 * @param {boolean} jsonMode - Whether to output JSON
 * @param {object} jsonPayload - JSON object to output in JSON mode
 * @param {string} humanMessage - Message to output in human mode
 */
function exitWithError(jsonMode, jsonPayload, humanMessage) {
  if (jsonMode) {
    console.log(JSON.stringify(jsonPayload, null, 2));
  } else {
    console.error(humanMessage);
  }
  process.exit(1);
}

/**
 * Build an empty/error result placeholder for a template that could not be validated.
 * @param {string} filename - Template filename
 * @param {string} error - Error description
 * @returns {object}
 */
function emptyResult(filename, error) {
  return { filename, checks: [], score: 0, total: 10, percentage: 0, category: null, error };
}

/**
 * Validate all template files and collect results.
 * @param {string[]} files - Sorted list of template filenames
 * @param {boolean} jsonMode - Whether to output JSON (affects error-only entries)
 * @returns {Array} Validation results
 */
function validateAllTemplates(files, jsonMode) {
  const results = [];
  for (const filename of files) {
    const filePath = path.join(TEMPLATES_DIR, filename);
    const { content, error: readError } = safeReadFile(filePath);

    if (readError) {
      if (jsonMode) results.push(emptyResult(filename, readError));
      else console.error(`Warning: Could not read ${filename}: ${readError}`);
      continue;
    }

    if (!content || content.trim() === "") {
      results.push(emptyResult(filename, "File is empty"));
      continue;
    }

    results.push(validateTemplate(filename, content));
  }
  return results;
}

/**
 * Main entry point.
 */
function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes("--json");

  const { files, error: listError } = listTemplateFiles();
  if (listError) {
    exitWithError(
      jsonMode,
      { error: `Failed to list templates: ${listError}` },
      `Error: Failed to list templates in ${TEMPLATES_DIR}: ${listError}`
    );
  }

  if (files.length === 0) {
    exitWithError(
      jsonMode,
      { error: "No template files found", templates: [] },
      `Error: No .md template files found in ${TEMPLATES_DIR}`
    );
  }

  files.sort();
  const results = validateAllTemplates(files, jsonMode);

  if (jsonMode) {
    console.log(JSON.stringify(formatJsonReport(results), null, 2));
  } else {
    console.log(formatHumanReport(results));
  }

  const anyBelowThreshold = results.some((r) => r.percentage < 70);
  process.exit(anyBelowThreshold ? 1 : 0);
}

main();
