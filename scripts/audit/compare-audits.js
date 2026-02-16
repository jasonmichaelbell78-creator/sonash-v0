#!/usr/bin/env node
/* global __dirname */
/**
 * compare-audits.js - Trend/diff tracker for comparing audit runs
 *
 * Compares two audit runs for the same category to show trends:
 * new findings, resolved findings, severity changes, recurring patterns.
 *
 * Usage:
 *   node scripts/audit/compare-audits.js <category> <date1> <date2> [--json]
 *
 * Examples:
 *   node scripts/audit/compare-audits.js security 2026-01-15 2026-02-13
 *   node scripts/audit/compare-audits.js code-quality 2026-01-01 2026-02-01 --json
 *
 * @version 1.0.0
 */

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SINGLE_SESSION_DIR = path.join(REPO_ROOT, "docs", "audits", "single-session");

// Canonical categories and their directory mappings
const CANONICAL_CATEGORIES = [
  "code-quality",
  "security",
  "performance",
  "refactoring",
  "documentation",
  "process",
  "engineering-productivity",
  "enhancements",
  "ai-optimization",
];

const CATEGORY_DIR_MAPPING = {
  "code-quality": "code",
  security: "security",
  performance: "performance",
  refactoring: "refactoring",
  documentation: "documentation",
  process: "process",
  "engineering-productivity": "engineering-productivity",
  enhancements: "enhancements",
  "ai-optimization": "ai-optimization",
};

// Severity levels in order of criticality
const SEVERITY_LEVELS = ["S0", "S1", "S2", "S3"];

/**
 * Parse command-line arguments
 * @returns {{ category: string, date1: string, date2: string, jsonOutput: boolean } | null}
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h") || args.length < 3) {
    printUsage();
    return null;
  }

  const positional = args.filter((a) => !a.startsWith("--"));
  const jsonOutput = args.includes("--json");

  if (positional.length < 3) {
    console.error("Error: Expected 3 positional arguments: <category> <date1> <date2>");
    printUsage();
    return null;
  }

  const [category, date1, date2] = positional;

  // Validate category
  if (!CANONICAL_CATEGORIES.includes(category)) {
    console.error(`Error: Invalid category "${category}".`);
    console.error(`Valid categories: ${CANONICAL_CATEGORIES.join(", ")}`);
    return null;
  }

  // Validate date format
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(date1)) {
    console.error(`Error: Invalid date format "${date1}". Expected YYYY-MM-DD.`);
    return null;
  }
  if (!datePattern.test(date2)) {
    console.error(`Error: Invalid date format "${date2}". Expected YYYY-MM-DD.`);
    return null;
  }

  return { category, date1, date2, jsonOutput };
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
Usage: node scripts/audit/compare-audits.js <category> <date1> <date2> [--json]

Arguments:
  category   One of: ${CANONICAL_CATEGORIES.join(", ")}
  date1      Earlier audit date (YYYY-MM-DD)
  date2      Later audit date (YYYY-MM-DD)

Options:
  --json     Output machine-readable JSON instead of markdown
  --help     Show this help message

Examples:
  node scripts/audit/compare-audits.js security 2026-01-15 2026-02-13
  node scripts/audit/compare-audits.js code-quality 2026-01-01 2026-02-01 --json
`);
}

/**
 * Resolve the JSONL file path for a category and date
 * @param {string} category - Canonical category name
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {string} Absolute path to the findings.jsonl file
 */
function resolveJsonlPath(category, date) {
  const dirName = CATEGORY_DIR_MAPPING[category];
  return path.join(SINGLE_SESSION_DIR, dirName, `audit-${date}`, "findings.jsonl");
}

/**
 * Load and parse a JSONL file
 * @param {string} filePath - Absolute path to JSONL file
 * @returns {Object[]} Array of parsed finding objects
 * @throws {Error} If file does not exist or cannot be parsed
 */
function loadJsonlFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to read file: ${msg}`);
  }

  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  const items = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      const parsed = JSON.parse(lines[i]);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        console.error(
          `Warning: Skipping non-object on line ${i + 1} in ${path.basename(filePath)}`
        );
        continue;
      }
      items.push(parsed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Warning: Invalid JSON on line ${i + 1} in ${path.basename(filePath)}: ${msg}`);
    }
  }

  return items;
}

/**
 * Generate a stable matching key for a finding.
 * Prefers source_id if available, falls back to file + title composite.
 * @param {Object} finding - A parsed finding object
 * @returns {string} A stable key for matching across runs
 */
function findingKey(finding) {
  if (finding.source_id && typeof finding.source_id === "string") {
    return `source_id::${finding.source_id}`;
  }

  // Normalize file: use finding.file or first element of finding.files
  const file = finding.file || (Array.isArray(finding.files) && finding.files[0]) || "unknown";
  const title = (finding.title || "untitled").trim().toLowerCase();

  return `file+title::${file}::${title}`;
}

/**
 * Get the primary file reference from a finding
 * @param {Object} finding - A parsed finding object
 * @returns {string} The primary file path
 */
function getFile(finding) {
  return finding.file || (Array.isArray(finding.files) && finding.files[0]) || "unknown";
}

/**
 * Get a line reference from a finding (if available)
 * @param {Object} finding - A parsed finding object
 * @returns {string} File with optional line number
 */
function getFileRef(finding) {
  const file = getFile(finding);
  if (finding.line) {
    return `${file}:${finding.line}`;
  }
  // Check if file already has :line suffix
  if (Array.isArray(finding.files) && finding.files[0] && finding.files[0].includes(":")) {
    return finding.files[0];
  }
  return file;
}

/**
 * Count findings by severity
 * @param {Object[]} findings - Array of finding objects
 * @returns {Object} Map of severity to count
 */
function countBySeverity(findings) {
  const counts = {};
  for (const sev of SEVERITY_LEVELS) {
    counts[sev] = 0;
  }
  for (const finding of findings) {
    const sev = finding.severity;
    if (sev && counts[sev] !== undefined) {
      counts[sev]++;
    }
  }
  return counts;
}

/**
 * Compare two sets of audit findings
 * @param {Object[]} findings1 - Findings from date1
 * @param {Object[]} findings2 - Findings from date2
 * @returns {Object} Comparison result with new, resolved, changed, recurring
 */
function compareFindings(findings1, findings2) {
  // Index findings by key
  const map1 = new Map();
  for (const f of findings1) {
    const key = findingKey(f);
    map1.set(key, f);
  }

  const map2 = new Map();
  for (const f of findings2) {
    const key = findingKey(f);
    map2.set(key, f);
  }

  const newFindings = [];
  const resolvedFindings = [];
  const severityChanges = [];
  const recurring = [];

  // Find new findings and severity changes
  for (const [key, f2] of map2) {
    if (map1.has(key)) {
      const f1 = map1.get(key);
      // Check for severity change
      if (f1.severity !== f2.severity) {
        severityChanges.push({
          title: f2.title || f1.title || "Untitled",
          file: getFileRef(f2),
          oldSeverity: f1.severity,
          newSeverity: f2.severity,
          finding1: f1,
          finding2: f2,
        });
      }
      // It is recurring (present in both)
      recurring.push({
        title: f2.title || f1.title || "Untitled",
        file: getFileRef(f2),
        severity: f2.severity,
        finding1: f1,
        finding2: f2,
      });
    } else {
      // New in date2
      newFindings.push(f2);
    }
  }

  // Find resolved findings (in date1 but not in date2)
  for (const [key, f1] of map1) {
    if (!map2.has(key)) {
      resolvedFindings.push(f1);
    }
  }

  // Detect recurring patterns: files or similar titles that appear across both runs
  const filePatterns = detectFilePatterns(findings1, findings2);
  const titlePatterns = detectTitlePatterns(findings1, findings2);

  return {
    newFindings,
    resolvedFindings,
    severityChanges,
    recurring,
    filePatterns,
    titlePatterns,
  };
}

/**
 * Detect files that have findings in both audit runs
 * @param {Object[]} findings1
 * @param {Object[]} findings2
 * @returns {Object[]} Array of { file, count1, count2 }
 */
function detectFilePatterns(findings1, findings2) {
  const fileCounts1 = new Map();
  const fileCounts2 = new Map();

  for (const f of findings1) {
    const file = getFile(f);
    fileCounts1.set(file, (fileCounts1.get(file) || 0) + 1);
  }

  for (const f of findings2) {
    const file = getFile(f);
    fileCounts2.set(file, (fileCounts2.get(file) || 0) + 1);
  }

  const patterns = [];
  const allFiles = new Set([...fileCounts1.keys(), ...fileCounts2.keys()]);

  for (const file of allFiles) {
    const count1 = fileCounts1.get(file) || 0;
    const count2 = fileCounts2.get(file) || 0;
    if (count1 > 0 && count2 > 0) {
      patterns.push({ file, count1, count2 });
    }
  }

  // Sort by total findings descending
  patterns.sort((a, b) => b.count1 + b.count2 - (a.count1 + a.count2));

  return patterns;
}

/**
 * Detect similar titles across audit runs (based on shared significant words)
 * @param {Object[]} findings1
 * @param {Object[]} findings2
 * @returns {Object[]} Array of { title1, title2, similarity }
 */
function detectTitlePatterns(findings1, findings2) {
  const patterns = [];
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "and",
    "or",
    "not",
    "no",
    "but",
    "if",
    "this",
    "that",
  ]);

  /**
   * Extract significant words from a title
   * @param {string} title
   * @returns {Set<string>}
   */
  function significantWords(title) {
    return new Set(
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w))
    );
  }

  // Only look at new findings from date2 vs. resolved findings from date1
  // to detect findings that might have been "renamed" but address the same issue
  const newKeys = new Set();
  const resolvedKeys = new Set();

  const map1 = new Map();
  for (const f of findings1) {
    map1.set(findingKey(f), f);
  }
  const map2 = new Map();
  for (const f of findings2) {
    map2.set(findingKey(f), f);
  }

  for (const [key] of map2) {
    if (!map1.has(key)) {
      newKeys.add(key);
    }
  }
  for (const [key] of map1) {
    if (!map2.has(key)) {
      resolvedKeys.add(key);
    }
  }

  const newFindings = findings2.filter((f) => newKeys.has(findingKey(f)));
  const resolvedFindings = findings1.filter((f) => resolvedKeys.has(findingKey(f)));

  for (const nf of newFindings) {
    const nfWords = significantWords(nf.title || "");
    if (nfWords.size === 0) continue;

    for (const rf of resolvedFindings) {
      const rfWords = significantWords(rf.title || "");
      if (rfWords.size === 0) continue;

      // Jaccard similarity
      const intersection = new Set([...nfWords].filter((w) => rfWords.has(w)));
      const union = new Set([...nfWords, ...rfWords]);
      const similarity = intersection.size / union.size;

      if (similarity >= 0.4) {
        patterns.push({
          title1: rf.title,
          title2: nf.title,
          similarity: Math.round(similarity * 100),
          file1: getFileRef(rf),
          file2: getFileRef(nf),
        });
      }
    }
  }

  // Sort by similarity descending
  patterns.sort((a, b) => b.similarity - a.similarity);

  return patterns;
}

/**
 * Format a signed change number
 * @param {number} n
 * @returns {string}
 */
function formatChange(n) {
  if (n > 0) return `+${n}`;
  if (n < 0) return `${n}`;
  return "0";
}

/**
 * Generate a markdown diff report
 * @param {string} category
 * @param {string} date1
 * @param {string} date2
 * @param {Object[]} findings1
 * @param {Object[]} findings2
 * @param {Object} comparison - Result from compareFindings
 * @returns {string} Markdown content
 */
function generateMarkdownReport(category, date1, date2, findings1, findings2, comparison) {
  const sev1 = countBySeverity(findings1);
  const sev2 = countBySeverity(findings2);
  const totalChange = findings2.length - findings1.length;

  const lines = [];

  lines.push(`# Audit Comparison: ${category}`);
  lines.push(`## ${date1} → ${date2}`);
  lines.push("");

  // Summary table
  lines.push("### Summary");
  lines.push("");
  lines.push("| Metric | " + date1 + " | " + date2 + " | Change |");
  lines.push("|--------|-------|-------|--------|");
  lines.push(
    `| Total findings | ${findings1.length} | ${findings2.length} | ${formatChange(totalChange)} |`
  );

  for (const sev of SEVERITY_LEVELS) {
    const label =
      sev === "S0"
        ? "S0 Critical"
        : sev === "S1"
          ? "S1 High"
          : sev === "S2"
            ? "S2 Medium"
            : "S3 Low";
    const change = sev2[sev] - sev1[sev];
    lines.push(`| ${label} | ${sev1[sev]} | ${sev2[sev]} | ${formatChange(change)} |`);
  }

  lines.push("");

  // New findings
  lines.push(`### New Findings (${comparison.newFindings.length})`);
  lines.push("");
  if (comparison.newFindings.length === 0) {
    lines.push("_No new findings._");
  } else {
    for (const f of comparison.newFindings) {
      const sev = f.severity || "??";
      const title = f.title || "Untitled";
      const fileRef = getFileRef(f);
      lines.push(`- [${sev}] ${title} (${fileRef})`);
    }
  }
  lines.push("");

  // Resolved findings
  lines.push(`### Resolved Findings (${comparison.resolvedFindings.length})`);
  lines.push("");
  if (comparison.resolvedFindings.length === 0) {
    lines.push("_No resolved findings._");
  } else {
    for (const f of comparison.resolvedFindings) {
      const sev = f.severity || "??";
      const title = f.title || "Untitled";
      const fileRef = getFileRef(f);
      lines.push(`- [${sev}] ${title} (${fileRef})`);
    }
  }
  lines.push("");

  // Severity changes
  lines.push(`### Severity Changes (${comparison.severityChanges.length})`);
  lines.push("");
  if (comparison.severityChanges.length === 0) {
    lines.push("_No severity changes._");
  } else {
    for (const sc of comparison.severityChanges) {
      lines.push(`- ${sc.title}: ${sc.oldSeverity} → ${sc.newSeverity} (${sc.file})`);
    }
  }
  lines.push("");

  // Recurring patterns - files
  if (comparison.filePatterns.length > 0) {
    lines.push(`### Recurring File Patterns (${comparison.filePatterns.length})`);
    lines.push("");
    lines.push("Files with findings in both audit runs:");
    lines.push("");
    lines.push("| File | " + date1 + " | " + date2 + " |");
    lines.push("|------|-------|-------|");
    for (const fp of comparison.filePatterns.slice(0, 20)) {
      lines.push(`| ${fp.file} | ${fp.count1} | ${fp.count2} |`);
    }
    if (comparison.filePatterns.length > 20) {
      lines.push(`| _...and ${comparison.filePatterns.length - 20} more_ | | |`);
    }
    lines.push("");
  }

  // Recurring patterns - similar titles
  if (comparison.titlePatterns.length > 0) {
    lines.push(`### Similar Title Patterns (${comparison.titlePatterns.length})`);
    lines.push("");
    lines.push("Findings with similar titles across runs (possible renames or related issues):");
    lines.push("");
    for (const tp of comparison.titlePatterns.slice(0, 15)) {
      lines.push(`- **${tp.similarity}% similar**`);
      lines.push(`  - ${date1}: ${tp.title1} (${tp.file1})`);
      lines.push(`  - ${date2}: ${tp.title2} (${tp.file2})`);
    }
    if (comparison.titlePatterns.length > 15) {
      lines.push(`- _...and ${comparison.titlePatterns.length - 15} more_`);
    }
    lines.push("");
  }

  // Overall trend
  lines.push("### Trend");
  lines.push("");
  if (totalChange < 0) {
    lines.push(
      `Overall improvement: ${Math.abs(totalChange)} fewer finding(s) in ${date2} compared to ${date1}.`
    );
  } else if (totalChange > 0) {
    lines.push(
      `Overall regression: ${totalChange} more finding(s) in ${date2} compared to ${date1}.`
    );
  } else {
    lines.push(`Finding count unchanged between ${date1} and ${date2}.`);
  }

  if (comparison.resolvedFindings.length > 0 && comparison.newFindings.length > 0) {
    lines.push(
      `${comparison.resolvedFindings.length} resolved, ${comparison.newFindings.length} new.`
    );
  }

  lines.push("");

  return lines.join("\n");
}

/**
 * Generate a machine-readable JSON report
 * @param {string} category
 * @param {string} date1
 * @param {string} date2
 * @param {Object[]} findings1
 * @param {Object[]} findings2
 * @param {Object} comparison - Result from compareFindings
 * @returns {Object} JSON report object
 */
function generateJsonReport(category, date1, date2, findings1, findings2, comparison) {
  const sev1 = countBySeverity(findings1);
  const sev2 = countBySeverity(findings2);

  return {
    category,
    date1,
    date2,
    summary: {
      date1TotalFindings: findings1.length,
      date2TotalFindings: findings2.length,
      totalChange: findings2.length - findings1.length,
      date1BySeverity: sev1,
      date2BySeverity: sev2,
      severityChanges: Object.fromEntries(
        SEVERITY_LEVELS.map((sev) => [sev, sev2[sev] - sev1[sev]])
      ),
    },
    newFindings: comparison.newFindings.map((f) => ({
      title: f.title,
      severity: f.severity,
      file: getFileRef(f),
      id: f.id || f.source_id || f.fingerprint || null,
    })),
    resolvedFindings: comparison.resolvedFindings.map((f) => ({
      title: f.title,
      severity: f.severity,
      file: getFileRef(f),
      id: f.id || f.source_id || f.fingerprint || null,
    })),
    severityChanges: comparison.severityChanges.map((sc) => ({
      title: sc.title,
      file: sc.file,
      oldSeverity: sc.oldSeverity,
      newSeverity: sc.newSeverity,
    })),
    recurringCount: comparison.recurring.length,
    filePatterns: comparison.filePatterns,
    titlePatterns: comparison.titlePatterns.map((tp) => ({
      title1: tp.title1,
      title2: tp.title2,
      similarity: tp.similarity,
      file1: tp.file1,
      file2: tp.file2,
    })),
  };
}

/**
 * Main entry point
 */
function main() {
  const parsed = parseArgs();
  if (!parsed) {
    process.exit(1);
  }

  const { category, date1, date2, jsonOutput } = parsed;

  // Resolve file paths
  const file1 = resolveJsonlPath(category, date1);
  const file2 = resolveJsonlPath(category, date2);

  // Load findings from both runs
  let findings1;
  try {
    findings1 = loadJsonlFile(file1);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error loading ${date1} audit: ${msg}`);
    process.exit(1);
  }

  let findings2;
  try {
    findings2 = loadJsonlFile(file2);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error loading ${date2} audit: ${msg}`);
    process.exit(1);
  }

  // Compare
  const comparison = compareFindings(findings1, findings2);

  // Output
  if (jsonOutput) {
    const report = generateJsonReport(category, date1, date2, findings1, findings2, comparison);
    console.log(JSON.stringify(report, null, 2));
  } else {
    const report = generateMarkdownReport(category, date1, date2, findings1, findings2, comparison);
    console.log(report);
  }

  process.exit(0);
}

main();
