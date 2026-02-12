#!/usr/bin/env node
/* global __dirname */
/**
 * run-consolidation.js
 *
 * Performs pattern consolidation from AI_REVIEW_LEARNINGS_LOG.md to CODE_PATTERNS.md.
 * This script:
 *   1. Reads review entries since last consolidation
 *   2. Extracts patterns mentioned across reviews
 *   3. Identifies recurring patterns (3+ mentions)
 *   4. Generates suggested updates for CODE_PATTERNS.md
 *   5. Resets the consolidation counter when --apply is used
 *
 * Usage:
 *   npm run consolidation:run              # Preview consolidation (dry run)
 *   npm run consolidation:run -- --apply   # Apply consolidation (update files)
 *   npm run consolidation:run -- --auto    # Auto-apply if needed (quiet, for hooks)
 *   npm run consolidation:run -- --verbose # Show detailed analysis
 *
 * Exit codes:
 *   0 = Success (or no consolidation needed)
 *   1 = Consolidation needed but not applied
 *   2 = Error
 *
 * Created: Session #69 (2026-01-16)
 */

// Use CommonJS for consistency with other scripts in scripts/ (Review #158)
const { existsSync, readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const { execSync, execFileSync } = require("node:child_process");

/**
 * Simple error sanitizer (Review #200 - prevent internal detail leakage)
 */
function sanitizeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
    .replace(/\/home\/[^/\s]+/gi, "[HOME]")
    .replace(/\/Users\/[^/\s]+/gi, "[HOME]");
}

// File paths
const LOG_FILE = join(__dirname, "..", "docs", "AI_REVIEW_LEARNINGS_LOG.md");
// Reserved for future automatic updates (currently manual)
const _PATTERNS_FILE = join(__dirname, "..", "docs", "agent_docs", "CODE_PATTERNS.md");
const _CLAUDE_MD = join(__dirname, "..", "claude.md");

// Configuration
const CONSOLIDATION_THRESHOLD = 10;
const MIN_PATTERN_OCCURRENCES = 3;

// Parse arguments
const args = process.argv.slice(2);
const autoMode = args.includes("--auto");
const applyChanges = args.includes("--apply") || autoMode;
const verbose = args.includes("--verbose");
const quiet = args.includes("--quiet") || autoMode;

// Colors for terminal output (TTY-aware - Review #159)
const useColors = process.stdout.isTTY;
const colors = {
  red: useColors ? "\x1b[31m" : "",
  green: useColors ? "\x1b[32m" : "",
  yellow: useColors ? "\x1b[33m" : "",
  blue: useColors ? "\x1b[34m" : "",
  cyan: useColors ? "\x1b[36m" : "",
  reset: useColors ? "\x1b[0m" : "",
  bold: useColors ? "\x1b[1m" : "",
};

function log(message, color = "") {
  if (quiet) return;
  console.log(color ? `${color}${message}${colors.reset}` : message);
}

function logVerbose(message) {
  if (verbose) {
    log(`  [verbose] ${message}`, colors.cyan);
  }
}

/**
 * Escape special regex characters in a string (Review #158)
 * Prevents ReDoS and unexpected behavior when building dynamic RegExp
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parse version history to find the highest review number
 * Session #114: Compute-based tracking instead of trusting manual counter
 */
function getHighestReviewNumber(content) {
  const versionRegex =
    /\|\s{0,5}\d+\.\d+\s{0,5}\|\s{0,5}\d{4}-\d{2}-\d{2}\s{0,5}\|\s{0,5}Review #(\d{1,4}):/g;
  let match;
  let highest = 0;

  while ((match = versionRegex.exec(content)) !== null) {
    const reviewNum = Number.parseInt(match[1], 10);
    if (reviewNum > highest) {
      highest = reviewNum;
    }
  }

  return highest;
}

/**
 * Parse "Last Consolidation" section to find last consolidated review number
 * Session #114: Look for "Reviews consolidated: #X-#Y" pattern
 */
function getLastConsolidatedReview(content) {
  // Preferred: "Last Consolidation" section
  const sectionMatch = content.match(
    /### Last Consolidation[\s\S]{0,500}?\*\*Reviews consolidated:\*\*\s*#?\d+-#?(\d+)/i
  );
  if (sectionMatch) {
    return Number.parseInt(sectionMatch[1], 10);
  }

  // Fallback: "Consolidation Trigger" section (this is where the script updates the range)
  // Review #215: Align read location with write location
  const triggerStart = content.indexOf("## 🔔 Consolidation Trigger");
  if (triggerStart !== -1) {
    const triggerEnd = content.indexOf("\n## ", triggerStart + 1);
    const endIndex = triggerEnd === -1 ? content.length : triggerEnd;
    const triggerSection = content.slice(triggerStart, endIndex);

    const triggerMatch = triggerSection.match(/\*\*Reviews consolidated:\*\*\s*#?\d+-#?(\d+)/i);
    if (triggerMatch) {
      return Number.parseInt(triggerMatch[1], 10);
    }
  }

  // Fallback: "Active reviews now #X-Y" indicates reviews up to X-1 were consolidated
  const activeMatch = content.match(/Active reviews(?:\s+now)?\s+#(\d+)-/i);
  if (activeMatch) {
    return Number.parseInt(activeMatch[1], 10) - 1;
  }

  return 0;
}

/**
 * Extract consolidation status from the log
 * Session #114: Now COMPUTES actual count and cross-validates against manual counter
 * Scoped to "Consolidation Trigger" section for robustness (Review #160)
 */
function getConsolidationStatus(content) {
  // COMPUTED: count actual #### Review #N entries > last consolidated (gap-safe)
  // Fixed: was using version-table regex which doesn't match review headers
  let lastConsolidated = getLastConsolidatedReview(content);

  // Review #308: Extract cross-validation to reduce cognitive complexity
  lastConsolidated = crossValidateLastConsolidated(lastConsolidated);

  const reviewHeaderRegex = /^#### Review #(\d+)/gm;
  const allNums = Array.from(content.matchAll(reviewHeaderRegex), (m) => Number.parseInt(m[1], 10));
  const uniqueNums = new Set(allNums.filter((n) => Number.isFinite(n) && n > lastConsolidated));

  // Review #216: Use reduce to avoid -Infinity and stack overflow on large arrays
  const highestReview = allNums.reduce((max, n) => (Number.isFinite(n) && n > max ? n : max), 0);
  const computedCount = uniqueNums.size;

  // Scope parsing to Consolidation Trigger section only (Review #160)
  const triggerStatus = parseTriggerSection(content, computedCount);

  return {
    reviewCount: computedCount,
    manualCount: triggerStatus.manualCount,
    lastConsolidation: triggerStatus.lastConsolidation,
    lastReviewNum: lastConsolidated,
    highestReview,
  };
}

/**
 * Cross-validate lastConsolidated against CODE_PATTERNS.md version history
 * Review #308: Extracted to reduce cognitive complexity and apply mismatch fix
 */
function crossValidateLastConsolidated(lastConsolidated) {
  const codePatternsPath = join(__dirname, "..", "docs", "agent_docs", "CODE_PATTERNS.md");
  if (!existsSync(codePatternsPath)) return lastConsolidated;

  try {
    const cpContent = readFileSync(codePatternsPath, "utf8");
    const consolidationRegex = /CONSOLIDATION #(\d+):\s*Reviews #(\d+)-(\d+)/g;
    let cpMaxConsolidation = 0;
    let cpLastReview = 0;
    for (const m of cpContent.matchAll(consolidationRegex)) {
      const cNum = Number.parseInt(m[1], 10);
      const endReview = Number.parseInt(m[3], 10);
      if (cNum > cpMaxConsolidation) {
        cpMaxConsolidation = cNum;
        cpLastReview = endReview;
      }
    }
    if (cpLastReview > 0 && cpLastReview !== lastConsolidated) {
      if (!quiet) {
        console.log(
          `${colors.yellow}⚠️  CROSS-VALIDATION: Log says last consolidated=#${lastConsolidated}, ` +
            `CODE_PATTERNS.md says #${cpLastReview} (Consolidation #${cpMaxConsolidation})${colors.reset}`
        );
        console.log(`   → CODE_PATTERNS.md is the source of truth\n`);
      }
      return cpLastReview;
    }
  } catch (err) {
    if (verbose) {
      console.warn(
        `  ⚠️  Cross-validation skipped: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  return lastConsolidated;
}

/**
 * Parse the Consolidation Trigger section for manual count and date
 * Review #308: Extracted to reduce cognitive complexity of getConsolidationStatus
 */
function parseTriggerSection(content, computedCount) {
  const sectionStart = content.indexOf("## 🔔 Consolidation Trigger");
  if (sectionStart === -1) {
    throw new Error("Could not locate 'Consolidation Trigger' section in log file.");
  }

  const sectionEnd = content.indexOf("\n## ", sectionStart + 1);
  const endIndex = sectionEnd === -1 ? content.length : sectionEnd;
  const section = content.slice(sectionStart, endIndex);

  const counterMatch = section.match(/\*\*Reviews since last consolidation:\*\*\s+(\d+)/);
  const manualCount = counterMatch ? Number.parseInt(counterMatch[1], 10) || 0 : 0;

  if (manualCount !== computedCount && !quiet) {
    console.log(
      `${colors.yellow}⚠️  COUNTER DRIFT: Manual=${manualCount}, Computed=${computedCount}${colors.reset}`
    );
    console.log(`   Using COMPUTED value for threshold check.\n`);
  }

  const lastConsolidationMatch = section.match(/\*\*Date:\*\*\s+([^\n]+)/);
  const lastConsolidation = lastConsolidationMatch ? lastConsolidationMatch[1].trim() : "Unknown";

  return { manualCount, lastConsolidation };
}

/**
 * Extract review entries since last consolidation
 */
function extractRecentReviews(content, lastReviewNum) {
  const reviews = [];

  // Match review entries as #### Review #NNN: Description (actual format in learnings log)
  // Fixed: was using version-table regex which doesn't exist in the learnings log
  const reviewRegex = /^#### Review #(\d{1,4}):\s*(.{1,500})/gm;
  let match;

  while ((match = reviewRegex.exec(content)) !== null) {
    const reviewNum = Number.parseInt(match[1], 10);
    const description = match[2].trim();

    if (reviewNum > lastReviewNum) {
      reviews.push({
        number: reviewNum,
        description,
      });
    }
  }

  return reviews.sort((a, b) => a.number - b.number);
}

/**
 * Extract patterns from review descriptions
 */
function extractPatterns(reviews) {
  const patterns = new Map();

  // Common pattern keywords to look for
  const patternKeywords = [
    // Security
    /command injection/gi,
    /path traversal/gi,
    /ReDoS/gi,
    /prototype pollution/gi,
    /SSRF/gi,
    /XSS/gi,
    /injection/gi,
    /sanitiz/gi,
    /validation/gi,
    /escape/gi,
    /security/gi,

    // Code quality
    /cognitive complexity/gi,
    /dead code/gi,
    /unused/gi,
    /duplicate/gi,
    /refactor/gi,
    /performance/gi,

    // Error handling
    /error handling/gi,
    /try[/-]catch/gi,
    /fail-closed/gi,
    /fail-fast/gi,

    // TypeScript/JavaScript
    /type inference/gi,
    /nullable/gi,
    /TypeScript/gi,
    /ESLint/gi,

    // Shell/Bash
    /shell/gi,
    /bash/gi,
    /portability/gi,
    /cross-platform/gi,

    // CI/Automation
    /CI/gi,
    /GitHub Actions/gi,
    /pre-commit/gi,
    /pre-push/gi,

    // Documentation
    /documentation/gi,
    /broken link/gi,
    /markdown/gi,
  ];

  for (const review of reviews) {
    const desc = review.description.toLowerCase();

    for (const keyword of patternKeywords) {
      const matches = desc.match(keyword);
      if (matches) {
        for (const match of matches) {
          const normalizedPattern = match.toLowerCase().trim();
          if (!patterns.has(normalizedPattern)) {
            patterns.set(normalizedPattern, {
              pattern: normalizedPattern,
              count: 0,
              reviews: [],
              examples: [],
            });
          }
          const entry = patterns.get(normalizedPattern);
          entry.count++;
          if (!entry.reviews.includes(review.number)) {
            entry.reviews.push(review.number);
          }
          // Extract context around pattern mention
          // Escape special characters in match to prevent regex errors (Review #158)
          const escapedMatch = escapeRegex(match);
          const contextMatch = review.description.match(
            new RegExp(`.{0,50}${escapedMatch}.{0,50}`, "i")
          );
          if (contextMatch && !entry.examples.includes(contextMatch[0])) {
            entry.examples.push(contextMatch[0].trim());
          }
        }
      }
    }

    // Also extract "New pattern:" mentions
    const newPatternMatch = review.description.match(/New pattern[s]?:\s*([^.]+)/i);
    if (newPatternMatch) {
      const patternDesc = newPatternMatch[1].trim().toLowerCase();
      if (!patterns.has(patternDesc)) {
        patterns.set(patternDesc, {
          pattern: patternDesc,
          count: 0,
          reviews: [],
          examples: [],
          isExplicitPattern: true,
        });
      }
      const entry = patterns.get(patternDesc);
      entry.count++;
      if (!entry.reviews.includes(review.number)) {
        entry.reviews.push(review.number);
      }
    }
  }

  return patterns;
}

/**
 * Categorize patterns for CODE_PATTERNS.md
 */
function categorizePatterns(patterns) {
  const categories = {
    Security: [],
    "JavaScript/TypeScript": [],
    "Bash/Shell": [],
    "CI/Automation": [],
    Documentation: [],
    General: [],
  };

  for (const [, data] of patterns) {
    const pattern = data.pattern.toLowerCase();

    if (
      /security|injection|ssrf|xss|traversal|redos|sanitiz|escape|prototype pollution/.test(pattern)
    ) {
      categories["Security"].push(data);
    } else if (/typescript|eslint|type|nullable/.test(pattern)) {
      categories["JavaScript/TypeScript"].push(data);
    } else if (/shell|bash|portability|cross-platform/.test(pattern)) {
      categories["Bash/Shell"].push(data);
    } else if (/ci|github actions|pre-commit|pre-push|automation/.test(pattern)) {
      categories["CI/Automation"].push(data);
    } else if (/documentation|markdown|link/.test(pattern)) {
      categories["Documentation"].push(data);
    } else {
      categories["General"].push(data);
    }
  }

  return categories;
}

/**
 * Generate consolidation report
 */
function generateReport(reviews, patterns, categories) {
  const recurringPatterns = Array.from(patterns.values())
    .filter((p) => p.count >= MIN_PATTERN_OCCURRENCES || p.isExplicitPattern)
    .sort((a, b) => b.count - a.count);

  let report = "";
  report += `\n${colors.bold}📊 Consolidation Analysis Report${colors.reset}\n`;
  report += "═".repeat(50) + "\n\n";

  report += `${colors.bold}Reviews analyzed:${colors.reset} ${reviews.length}\n`;
  report += `Reviews: #${reviews[0]?.number || "?"} - #${reviews[reviews.length - 1]?.number || "?"}\n\n`;

  report += `${colors.bold}Recurring patterns (${MIN_PATTERN_OCCURRENCES}+ mentions):${colors.reset}\n`;

  if (recurringPatterns.length === 0) {
    report += "  No recurring patterns found.\n";
  } else {
    for (const p of recurringPatterns) {
      const marker = p.isExplicitPattern ? "📌" : "🔄";
      report += `  ${marker} ${p.pattern} (${p.count}x in Reviews ${p.reviews.join(", ")})\n`;
      if (verbose && p.examples.length > 0) {
        report += `     Example: "${p.examples[0]}"\n`;
      }
    }
  }

  report += `\n${colors.bold}Patterns by category:${colors.reset}\n`;
  for (const [category, items] of Object.entries(categories)) {
    const significant = items.filter(
      (p) => p.count >= MIN_PATTERN_OCCURRENCES || p.isExplicitPattern
    );
    if (significant.length > 0) {
      report += `  ${category}: ${significant.length} pattern(s)\n`;
    }
  }

  return { report, recurringPatterns };
}

/**
 * Update the consolidation counter in the log file
 * Session #114: Also updates "Last Consolidation" section with review range
 */
function updateConsolidationCounter(content, newCount, nextReview, consolidatedRange) {
  // Scope replacements to "Consolidation Trigger" section only (Review #158)
  // This prevents accidental modifications to other parts of the document
  const sectionStart = content.indexOf("## 🔔 Consolidation Trigger");
  const sectionEnd = content.indexOf("\n## ", sectionStart + 1);

  if (sectionStart === -1) {
    throw new Error("Could not locate 'Consolidation Trigger' section in log file.");
  }

  // Extract the section (or rest of file if no next section)
  const endIndex = sectionEnd === -1 ? content.length : sectionEnd;
  let section = content.slice(sectionStart, endIndex);

  // Update "Reviews since last consolidation" counter
  section = section.replace(
    /\*\*Reviews since last consolidation:\*\*\s+\d+/,
    `**Reviews since last consolidation:** ${newCount}`
  );

  // Update "Next consolidation due" text
  section = section.replace(
    /\*\*Next consolidation due:\*\*\s+After Review #\d+/,
    `**Next consolidation due:** After Review #${nextReview}`
  );

  // Update status
  section = section.replace(
    /\*\*Status:\*\*\s+[^\n]+/,
    `**Status:** ✅ Current **Next consolidation due:** After Review #${nextReview}`
  );

  // Update last consolidation date and session
  const today = new Date().toISOString().split("T")[0];
  section = section.replace(/\*\*Date:\*\*\s+[^\n]+/, `**Date:** ${today} (Session #114+)`);

  // Update "Reviews consolidated" with actual range
  if (consolidatedRange) {
    section = section.replace(
      /\*\*Reviews consolidated:\*\*\s+#?\d+-#?\d+[^\n]*/,
      `**Reviews consolidated:** #${consolidatedRange.start}-#${consolidatedRange.end} (${consolidatedRange.count} reviews)`
    );
  }

  // Reconstruct the full content
  return content.slice(0, sectionStart) + section + content.slice(endIndex);
}

/**
 * Generate suggested CODE_PATTERNS.md additions
 */
function generatePatternSuggestions(recurringPatterns, categories) {
  let suggestions = "";
  suggestions += `\n${colors.bold}📝 Suggested CODE_PATTERNS.md additions:${colors.reset}\n`;
  suggestions += "─".repeat(50) + "\n";

  for (const [category, items] of Object.entries(categories)) {
    const significant = items.filter(
      (p) => p.count >= MIN_PATTERN_OCCURRENCES || p.isExplicitPattern
    );
    if (significant.length === 0) continue;

    suggestions += `\n## ${category}\n\n`;
    suggestions += "| Pattern | Rule | Why |\n";
    suggestions += "| ------- | ---- | --- |\n";

    for (const p of significant) {
      // Example available at p.examples[0] for future use
      suggestions += `| ${p.pattern} | (add rule) | Reviews #${p.reviews.join(", ")} |\n`;
    }
  }

  return suggestions;
}

/**
 * Output consolidation analysis results
 */
function outputAnalysisResults(report, recurringPatterns, categories) {
  if (!quiet || verbose) {
    console.log(report);
  }

  if (recurringPatterns.length > 0 && (!quiet || verbose)) {
    console.log(generatePatternSuggestions(recurringPatterns, categories));
  }
}

/**
 * Apply consolidation changes to files
 * Review #192: Return boolean success status instead of throwing on empty input
 * @returns {boolean} True if consolidation was applied, false if rejected
 */
function applyConsolidationChanges(content, reviews, recurringPatterns) {
  log(`\n${colors.bold}Applying consolidation...${colors.reset}`, colors.green);

  // Guard against empty reviews array to prevent -Infinity from Math.max
  // Review #192: Use controlled error path instead of throwing
  if (reviews.length === 0) {
    log("❌ No reviews found to consolidate; refusing to reset consolidation counter.", colors.red);
    process.exitCode = 2;
    return false;
  }

  // Calculate next review number and range
  // Review #216: Use reduce to avoid stack overflow on large review batches
  const { minReviewNum, maxReviewNum } = reviews.reduce(
    (acc, r) => ({
      minReviewNum: Math.min(r.number, acc.minReviewNum),
      maxReviewNum: Math.max(r.number, acc.maxReviewNum),
    }),
    { minReviewNum: Infinity, maxReviewNum: 0 }
  );
  const nextConsolidationReview = maxReviewNum + CONSOLIDATION_THRESHOLD;
  const consolidatedRange = {
    start: minReviewNum,
    end: maxReviewNum,
    count: reviews.length,
  };

  // Update log file
  const updatedContent = updateConsolidationCounter(
    content,
    0,
    nextConsolidationReview,
    consolidatedRange
  );
  writeFileSync(LOG_FILE, updatedContent, "utf8");
  log(`  ✅ Reset consolidation counter in AI_REVIEW_LEARNINGS_LOG.md`, colors.green);
  log(
    `  ✅ Consolidated reviews #${minReviewNum}-#${maxReviewNum} (${reviews.length} reviews)`,
    colors.green
  );
  log(`  ✅ Next consolidation due after Review #${nextConsolidationReview}`, colors.green);

  // Generate suggested compliance checker rules for recurring patterns
  generateRuleSuggestions(recurringPatterns, consolidatedRange);

  // Output summary based on mode
  if (autoMode) {
    console.log(
      `   ✓ Auto-consolidated ${reviews.length} reviews (patterns: ${recurringPatterns.length})`
    );
  } else {
    outputManualSteps();
  }

  return true;
}

/**
 * Output manual steps for non-auto mode
 */
function outputManualSteps() {
  log("");
  log(`${colors.bold}📋 Manual steps required:${colors.reset}`);
  log("  1. Review the suggested patterns above");
  log("  2. Add relevant patterns to docs/agent_docs/CODE_PATTERNS.md");
  log("  3. Add critical patterns (top 5) to claude.md Section 4");
  log("  4. Run: npm run patterns:suggest (for automatable patterns)");
  log("  5. Commit with message: 'chore: consolidate Reviews #X-#Y patterns'");
  log("");
}

/**
 * Generate suggested compliance checker rules for recurring patterns
 * Writes to consolidation-output/suggested-rules.md for human/AI review
 */
function generateRuleSuggestions(recurringPatterns, consolidatedRange) {
  if (recurringPatterns.length === 0) return;

  const outputDir = join(__dirname, "..", "consolidation-output");
  const outputFile = join(outputDir, "suggested-rules.md");

  try {
    if (!existsSync(outputDir)) {
      const { mkdirSync } = require("node:fs");
      mkdirSync(outputDir, { recursive: true });
    }

    const now = new Date().toISOString().split("T")[0];
    let content = `# Suggested Compliance Checker Rules\n\n`;
    content += `**Generated:** ${now}\n`;
    content += `**Source:** Consolidation #${consolidatedRange.start}-#${consolidatedRange.end}\n`;
    content += `**Status:** Pending review - add to check-pattern-compliance.js as appropriate\n\n`;
    content += `---\n\n`;

    for (const p of recurringPatterns) {
      // Review #308: Use replaceAll, group regex alternation for precedence
      const id = (p.pattern || "")
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/(?:^-|-$)/g, "")
        .slice(0, 40);

      content += `## ${p.pattern}\n\n`;
      content += `- **Mentions:** ${p.count} (Reviews: #${p.reviews.join(", #")})\n`;
      content += `- **Suggested ID:** \`${id || "unnamed-pattern"}\`\n`;
      content += `- **Enforceability:** [REGEX] / [AST] / [SEMANTIC] ← classify manually\n`;
      content += `- **Template:**\n\n`;
      content += "```javascript\n";
      content += `{\n`;
      content += `  id: ${JSON.stringify(id || "unnamed-pattern")},\n`;
      content += `  pattern: /TODO_REGEX/g,\n`;
      content += `  message: ${JSON.stringify(p.pattern || "")},\n`;
      content += `  fix: "TODO: describe the correct pattern",\n`;
      content += `  review: "#${p.reviews.join(", #")}",\n`;
      content += `  fileTypes: [".js", ".ts"],\n`;
      content += `}\n`;
      content += "```\n\n";
    }

    writeFileSync(outputFile, content, "utf8");
    log(
      `  ✅ Rule suggestions written to consolidation-output/suggested-rules.md (${recurringPatterns.length} patterns)`,
      colors.green
    );
  } catch (error_) {
    // Non-fatal: don't fail consolidation if rule suggestions can't be written
    if (verbose) {
      log(`  ⚠️  Failed to write rule suggestions: ${sanitizeError(error_)}`, colors.yellow);
    }
  }
}

/**
 * Output dry run message
 */
function outputDryRunMessage() {
  log("");
  log(
    `${colors.yellow}Dry run complete. Use --apply to reset counter and begin consolidation.${colors.reset}`
  );
  log(`  npm run consolidation:run -- --apply`);
  log("");
}

/**
 * Check archive health: warn if active reviews exceed threshold
 */
function checkArchiveHealth() {
  try {
    const logContent = readFileSync(LOG_FILE, "utf8").replaceAll("\r\n", "\n");
    const reviewHeaders = logContent.match(/^#### Review #\d+/gm) || [];
    const activeCount = reviewHeaders.length;
    const lineCount = logContent.split("\n").length;

    if (activeCount > 20 || lineCount > 1500) {
      log("");
      log(
        `${colors.yellow}📦 ARCHIVE RECOMMENDED: ${activeCount} active reviews (threshold: 20), ${lineCount} lines (threshold: 1500)${colors.reset}`
      );
      log(`   Run: npm run docs:archive`);
    }
  } catch {
    // Non-fatal: skip if file unreadable
  }
}

/**
 * Read and validate log file
 */
function readLogFile() {
  if (!existsSync(LOG_FILE)) {
    log("❌ AI_REVIEW_LEARNINGS_LOG.md not found", colors.red);
    return null;
  }

  try {
    return readFileSync(LOG_FILE, "utf8").replaceAll("\r\n", "\n"); // S7781: Use string literal
  } catch (readError) {
    const message = readError instanceof Error ? readError.message : String(readError);
    log(`❌ Failed to read AI_REVIEW_LEARNINGS_LOG.md: ${message}`, colors.red);
    return null;
  }
}

/**
 * Output current consolidation status
 * Session #114: Show both computed and manual counts
 */
function outputConsolidationStatus(status) {
  log(`Current status:`);
  log(`  Highest review: #${status.highestReview}`);
  log(`  Last consolidated: #${status.lastReviewNum}`);
  log(`  Reviews pending (computed): ${status.reviewCount}`);
  if (status.manualCount !== status.reviewCount) {
    log(`  Reviews pending (manual): ${status.manualCount} ← OUT OF SYNC`);
  }
  log(`  Threshold: ${CONSOLIDATION_THRESHOLD}`);
  log(`  Last consolidation: ${status.lastConsolidation}`);
  log("");
}

/**
 * Check if consolidation is needed
 * Returns true if consolidation should proceed
 */
function checkConsolidationNeeded(status) {
  if (status.reviewCount < CONSOLIDATION_THRESHOLD) {
    if (!autoMode) {
      log(
        `✅ No consolidation needed (${CONSOLIDATION_THRESHOLD - status.reviewCount} reviews until next)`,
        colors.green
      );
    }
    return false;
  }

  log(`⚠️  Consolidation triggered: ${status.reviewCount} reviews pending`, colors.yellow);
  log("");
  return true;
}

/**
 * Main consolidation function
 */
function main() {
  try {
    log(`\n${colors.bold}🔄 Pattern Consolidation Tool${colors.reset}\n`);

    // Read log file
    const content = readLogFile();
    if (!content) {
      process.exitCode = 2;
      return;
    }

    // Get and output status
    const status = getConsolidationStatus(content);
    outputConsolidationStatus(status);

    // Check if consolidation is needed
    if (!checkConsolidationNeeded(status)) {
      process.exitCode = 0;
      return;
    }

    // Extract reviews since last consolidation
    const reviews = extractRecentReviews(content, status.lastReviewNum);
    logVerbose(`Found ${reviews.length} reviews to analyze`);

    if (reviews.length === 0) {
      log("❌ No reviews found to consolidate. Check log format.", colors.red);
      process.exitCode = 2;
      return;
    }

    // Extract and analyze patterns
    const patterns = extractPatterns(reviews);
    const categories = categorizePatterns(patterns);
    const { report, recurringPatterns } = generateReport(reviews, patterns, categories);

    // Output analysis results
    outputAnalysisResults(report, recurringPatterns, categories);

    // Apply changes if requested, otherwise show dry run message
    if (applyChanges) {
      // Review #193: Preserve failure exit code set by applyConsolidationChanges
      // Review #194: Make failure path explicit with return
      const applied = applyConsolidationChanges(content, reviews, recurringPatterns);
      if (applied) {
        // Run learning effectiveness analysis after consolidation
        log("\n📊 Running learning effectiveness analysis...", colors.blue);
        try {
          // Review #200: Use execFileSync instead of execSync to avoid shell invocation
          execFileSync("node", ["scripts/analyze-learning-effectiveness.js", "--auto"], {
            stdio: "inherit",
            cwd: join(__dirname, ".."),
          });
        } catch (error_) {
          // Non-blocking: Don't fail consolidation if analysis fails
          log("⚠️  Learning analysis failed (non-blocking)", colors.yellow);
          if (verbose) {
            // Review #200: Sanitize error message to prevent internal detail leakage
            log(`   ${sanitizeError(error_)}`, colors.yellow);
          }
        }

        // Post-consolidation: check if archiving is needed
        checkArchiveHealth();

        process.exitCode = 0;
        return;
      }
      // Review #195: Preserve exitCode set by applyConsolidationChanges (default to 2 if unset)
      process.exitCode ??= 2;
      return;
    } else {
      outputDryRunMessage();

      // Also check archive health in dry-run mode (informational)
      checkArchiveHealth();

      process.exitCode = 1;
    }
  } catch (err) {
    log(`❌ Error: ${err instanceof Error ? err.message : String(err)}`, colors.red);
    if (verbose && err instanceof Error) {
      console.error(err.stack);
    }
    process.exitCode = 2;
  }
}

main();
