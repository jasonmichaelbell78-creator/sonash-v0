#!/usr/bin/env node
/**
 * route-enforcement-gaps.js - Route CLAUDE.md enforcement gaps through learning-router
 *
 * Reads CLAUDE.md, extracts rules annotated with [BEHAVIORAL: no automated enforcement],
 * and routes each gap through the learning-router to scaffold enforcement.
 *
 * Part of Data Effectiveness Audit (Wave 4.2)
 *
 * Usage:
 *   node scripts/route-enforcement-gaps.js [--dry-run] [--json]
 */

/* global __dirname */
const path = require("node:path");
const fs = require("node:fs");

let sanitizeError;
try {
  ({ sanitizeError } = require(path.join(__dirname, "lib", "security-helpers.js")));
} catch {
  sanitizeError = (e) =>
    (e instanceof Error ? e.message : String(e))
      // Regex patterns with character classes — replaceAll requires string literals, not regex
      .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replace(/\/home\/[^/\s]+/gi, "[HOME]");
}

const PROJECT_ROOT = path.resolve(__dirname, "..");
const CLAUDE_MD_PATH = path.join(PROJECT_ROOT, "CLAUDE.md");

// ---------------------------------------------------------------------------
// Parse CLAUDE.md for enforcement gaps
// ---------------------------------------------------------------------------

/**
 * Try to extract rule text from a single line using known markdown patterns.
 * Returns the matched text or null if no pattern matches.
 */
function matchRuleLine(trimmedLine) {
  // Match numbered list: "1. **Rule text**..."
  const numberedMatch = trimmedLine.match(/^\d+\.\s+\*\*(.+?)\*\*/);
  if (numberedMatch) return numberedMatch[1].trim();

  // Match bulleted list: "- **Rule text**..."
  const bulletMatch = trimmedLine.match(/^-\s+\*\*(.+?)\*\*/);
  if (bulletMatch) return bulletMatch[1].trim();

  // S5852: safe — lazy quantifier bounded by literal lookahead
  const headingAnnotated = trimmedLine.match(/^###\s+(.+?)(?:\s*`\[)/);
  if (headingAnnotated) return headingAnnotated[1].trim();

  // Fallback: heading without annotation
  const bareHeading = trimmedLine.match(/^###\s+(.+)/);
  if (bareHeading) return bareHeading[1].replace(/`\[.*\]`/, "").trim();

  return null;
}

/**
 * Search backwards from annotationLineIndex to find the rule text
 * that the enforcement annotation refers to.
 */
function findRuleText(lines, annotationLineIndex) {
  for (let j = annotationLineIndex; j >= Math.max(0, annotationLineIndex - 10); j--) {
    const result = matchRuleLine(lines[j].trim());
    if (result) return result;
  }
  return null;
}

/**
 * Try to extract rule text from an inline heading on the annotation line itself.
 */
function extractInlineRule(line) {
  const trimmed = line.trim();
  // S5852: safe — lazy quantifier bounded by literal lookahead
  const inlineHeading = trimmed.match(/^###\s+(.+?)(?:\s*`\[)/);
  return inlineHeading ? inlineHeading[1].trim() : null;
}

/**
 * Parse a section heading line (## N. Title) and return the section label,
 * or null if the line is not a section heading.
 */
function parseSectionHeading(line) {
  const headingMatch = line.match(/^##\s+(\d+)\.\s+(.*)/);
  return headingMatch ? `Section ${headingMatch[1]}: ${headingMatch[2]}` : null;
}

function extractGaps(content) {
  const gaps = [];
  const lines = content.split(/\r?\n/);

  let currentSection = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track section headings
    const section = parseSectionHeading(line);
    if (section) {
      currentSection = section;
      continue;
    }

    // Find [BEHAVIORAL: no automated enforcement] annotations
    if (!line.includes("[BEHAVIORAL: no automated enforcement]")) continue;

    let ruleText = findRuleText(lines, i);

    // Check if the annotation is on the same line as a heading
    if (!ruleText) {
      ruleText = extractInlineRule(line);
    }

    if (!ruleText) {
      ruleText = line.replace(/`\[BEHAVIORAL:.*\]`/, "").trim() || `(line ${i + 1})`;
    }

    gaps.push({
      section: currentSection,
      rule: ruleText,
      line: i + 1,
    });
  }

  return gaps;
}

// ---------------------------------------------------------------------------
// Route gaps through learning-router
// ---------------------------------------------------------------------------

function routeGaps(gaps, options = {}) {
  const { route } = require(path.join(__dirname, "lib", "learning-router.js"));
  const dryRun = options.dryRun || false;

  const results = [];

  for (const gap of gaps) {
    const learning = {
      type: "behavioral",
      pattern: gap.rule,
      source: `CLAUDE.md:${gap.line} (${gap.section})`,
      severity: "medium",
      evidence: {
        notes: ["No automated enforcement found in CLAUDE.md annotation"],
      },
    };

    if (dryRun) {
      results.push({
        gap,
        learning,
        route: "behavioral → claudemd-annotation",
        action: "Would scaffold enforcement via learning-router",
      });
      continue;
    }

    try {
      const result = route(learning, { track: true });
      results.push({ gap, learning, result, status: "routed" });
    } catch (error) {
      results.push({
        gap,
        learning,
        error: sanitizeError(error),
        status: "error",
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function run(options = {}) {
  let content;
  try {
    content = fs.readFileSync(CLAUDE_MD_PATH, "utf-8");
  } catch (error) {
    console.error(`Failed to read CLAUDE.md: ${sanitizeError(error)}`);
    process.exitCode = 1;
    return { success: false, gaps: [], results: [] };
  }

  const gaps = extractGaps(content);

  if (gaps.length === 0) {
    console.log("No enforcement gaps found in CLAUDE.md.");
    return { success: true, gaps: [], results: [] };
  }

  console.log(`Found ${gaps.length} enforcement gap(s) in CLAUDE.md:\n`);
  for (const gap of gaps) {
    console.log(`  - [${gap.section}] ${gap.rule} (line ${gap.line})`);
  }
  console.log();

  const results = routeGaps(gaps, options);

  const routed = results.filter((r) => r.status === "routed").length;
  const errors = results.filter((r) => r.status === "error").length;
  const dryRunCount = results.filter((r) => !r.status).length;

  if (options.dryRun) {
    console.log(`Dry run: ${dryRunCount} gap(s) would be routed.`);
  } else {
    console.log(`Routed: ${routed} | Errors: ${errors}`);
  }

  if (options.json) {
    console.log(JSON.stringify({ gaps, results }, null, 2));
  }

  return { success: errors === 0, gaps, results };
}

// CLI entry point
if (require.main === module) {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const json = args.has("--json");

  const result = run({ dryRun, json });
  if (!result.success) {
    process.exitCode = 1;
  }
}

module.exports = { run, extractGaps, routeGaps };
