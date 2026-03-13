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
      .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replace(/\/home\/[^/\s]+/gi, "[HOME]");
}

const PROJECT_ROOT = path.resolve(__dirname, "..");
const CLAUDE_MD_PATH = path.join(PROJECT_ROOT, "CLAUDE.md");

// ---------------------------------------------------------------------------
// Parse CLAUDE.md for enforcement gaps
// ---------------------------------------------------------------------------

function extractGaps(content) {
  const gaps = [];
  const lines = content.split(/\r?\n/);

  let currentSection = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track section headings
    const headingMatch = line.match(/^##\s+(\d+)\.\s+(.*)/);
    if (headingMatch) {
      currentSection = `Section ${headingMatch[1]}: ${headingMatch[2]}`;
      continue;
    }

    // Find [BEHAVIORAL: no automated enforcement] annotations
    if (line.includes("[BEHAVIORAL: no automated enforcement]")) {
      // Look backwards for the rule text (numbered list item or heading)
      let ruleText = "";
      for (let j = i; j >= Math.max(0, i - 10); j--) {
        const rLine = lines[j].trim();
        // Match numbered list: "1. **Rule text**..."
        const numberedMatch = rLine.match(/^\d+\.\s+\*\*(.+?)\*\*/);
        if (numberedMatch) {
          ruleText = numberedMatch[1].trim();
          break;
        }
        // Match bulleted list: "- **Rule text**..."
        const bulletMatch = rLine.match(/^-\s+\*\*(.+?)\*\*/);
        if (bulletMatch) {
          ruleText = bulletMatch[1].trim();
          break;
        }
        // Match heading with annotation: "### PRE-TASK..."
        const headingMatch = rLine.match(/^###\s+(.+?)(?:\s*`\[)/);
        if (headingMatch) {
          ruleText = headingMatch[1].trim();
          break;
        }
        // Fallback: heading without annotation
        const bareHeading = rLine.match(/^###\s+(.+)/);
        if (bareHeading) {
          ruleText = bareHeading[1].replace(/`\[.*\]`/, "").trim();
          break;
        }
      }

      // Check if the annotation is on the same line as a heading
      if (!ruleText) {
        const sameLine = line.trim();
        const inlineHeading = sameLine.match(/^###\s+(.+?)(?:\s*`\[)/);
        if (inlineHeading) {
          ruleText = inlineHeading[1].trim();
        }
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
      evidence: [`No automated enforcement found in CLAUDE.md annotation`],
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
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const json = args.includes("--json");

  const result = run({ dryRun, json });
  if (!result.success) {
    process.exitCode = 1;
  }
}

module.exports = { run, extractGaps, routeGaps };
