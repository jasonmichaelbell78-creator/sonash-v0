#!/usr/bin/env node
/* global __dirname */
/**
 * Pattern Sync Checker
 *
 * Verifies consistency between security documentation and automation:
 * - CODE_PATTERNS.md (documented patterns)
 * - check-pattern-compliance.js (automated checks)
 * - SECURITY_CHECKLIST.md (pre-write checklist)
 * - security-helpers.js (reusable implementations)
 *
 * Run after consolidation or when adding new patterns.
 *
 * Usage:
 *   npm run patterns:sync       # Check sync status
 *   npm run patterns:sync-fix   # Generate missing automation stubs
 */

const { readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");

const ROOT = join(__dirname, "..");

const FILES = {
  codePatterns: join(ROOT, "docs", "agent_docs", "CODE_PATTERNS.md"),
  patternChecker: join(ROOT, "scripts", "check-pattern-compliance.js"),
  securityChecklist: join(ROOT, "docs", "agent_docs", "SECURITY_CHECKLIST.md"),
  securityHelpers: join(ROOT, "scripts", "lib", "security-helpers.js"),
  learningsLog: join(ROOT, "docs", "AI_REVIEW_LEARNINGS_LOG.md"),
};

/**
 * Extract pattern numbers from a file
 */
function extractPatterns(content, source) {
  const patterns = new Map();

  // Match patterns like "#31", "Pattern #31", "#31:", etc.
  const regex = /#(\d+)(?:\s*[-:)]|\s|$)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const num = parseInt(match[1], 10);
    if (num > 0 && num < 1000) {
      // Reasonable pattern number range
      if (!patterns.has(num)) {
        patterns.set(num, []);
      }
      patterns.get(num).push(source);
    }
  }

  return patterns;
}

/**
 * Check if a pattern is automated in the checker
 */
function isPatternAutomated(checkerContent, patternNum) {
  // Look for pattern number in ANTI_PATTERNS array comments or descriptions
  // Note: No /g flag needed - we only need boolean result, not iteration
  const patterns = [
    new RegExp(`#${patternNum}(?![0-9])`),
    new RegExp(`Pattern ${patternNum}(?![0-9])`),
    new RegExp(`Review #\\d+.*#${patternNum}(?![0-9])`),
  ];

  return patterns.some((p) => p.test(checkerContent));
}

/**
 * Check if a pattern has a helper function
 */
function isPatternInHelpers(helpersContent, patternNum) {
  return new RegExp(`#${patternNum}[^0-9]`).test(helpersContent);
}

/**
 * Check if a pattern is in the security checklist
 */
function isPatternInChecklist(checklistContent, patternNum) {
  return new RegExp(`#${patternNum}[^0-9]`).test(checklistContent);
}

/**
 * Main sync check
 */
function checkPatternSync() {
  console.log("🔍 Pattern Sync Checker\n");
  console.log("Checking consistency between documentation and automation...\n");

  const results = {
    documented: new Set(),
    automated: new Set(),
    inChecklist: new Set(),
    inHelpers: new Set(),
    gaps: [],
  };

  // Read all files
  const contents = {};
  for (const [key, filePath] of Object.entries(FILES)) {
    if (existsSync(filePath)) {
      try {
        contents[key] = readFileSync(filePath, "utf-8");
      } catch (error) {
        console.warn(`⚠️  Failed to read ${filePath}: ${error.code || "unknown error"}`);
        contents[key] = "";
      }
    } else {
      console.warn(`⚠️  File not found: ${filePath}`);
      contents[key] = "";
    }
  }

  // Extract documented patterns from CODE_PATTERNS.md
  const codePatternsMatch = contents.codePatterns.match(/## Pattern #(\d+)/g) || [];
  for (const m of codePatternsMatch) {
    const num = parseInt(m.match(/\d+/)[0], 10);
    results.documented.add(num);
  }

  // Also check learnings log for newer patterns not yet consolidated
  const learningsPatterns = extractPatterns(contents.learningsLog, "learnings");
  for (const num of learningsPatterns.keys()) {
    results.documented.add(num);
  }

  // Check which patterns are automated
  for (const num of results.documented) {
    if (isPatternAutomated(contents.patternChecker, num)) {
      results.automated.add(num);
    }
    if (isPatternInChecklist(contents.securityChecklist, num)) {
      results.inChecklist.add(num);
    }
    if (isPatternInHelpers(contents.securityHelpers, num)) {
      results.inHelpers.add(num);
    }
  }

  // Find gaps
  for (const num of results.documented) {
    const isAutomated = results.automated.has(num);
    const hasChecklist = results.inChecklist.has(num);
    const hasHelper = results.inHelpers.has(num);

    if (!isAutomated || !hasChecklist) {
      results.gaps.push({
        pattern: num,
        automated: isAutomated,
        checklist: hasChecklist,
        helper: hasHelper,
      });
    }
  }

  // Report results
  console.log("📊 Summary:");
  console.log(`   Documented patterns: ${results.documented.size}`);
  console.log(`   Automated in checker: ${results.automated.size}`);
  console.log(`   In security checklist: ${results.inChecklist.size}`);
  console.log(`   Have helper functions: ${results.inHelpers.size}`);
  console.log();

  if (results.gaps.length === 0) {
    console.log("✅ All patterns are synced!\n");
    return { success: true, gaps: [] };
  }

  console.log(`⚠️  Found ${results.gaps.length} pattern(s) with gaps:\n`);

  // Group by what's missing
  const missingAutomation = results.gaps.filter((g) => !g.automated);
  const missingChecklist = results.gaps.filter((g) => !g.checklist && g.automated);

  if (missingAutomation.length > 0) {
    console.log("Missing automation in check-pattern-compliance.js:");
    for (const g of missingAutomation) {
      console.log(`   #${g.pattern} - not automated (checklist: ${g.checklist ? "✓" : "✗"})`);
    }
    console.log();
  }

  if (missingChecklist.length > 0) {
    console.log("Missing from SECURITY_CHECKLIST.md:");
    for (const g of missingChecklist) {
      console.log(`   #${g.pattern} - automated but not in checklist`);
    }
    console.log();
  }

  // Recommendations
  console.log("📝 Recommendations:\n");

  if (missingAutomation.length > 0) {
    console.log("1. Add regex patterns to check-pattern-compliance.js for:");
    for (const g of missingAutomation.slice(0, 5)) {
      console.log(`   - Pattern #${g.pattern}`);
    }
    if (missingAutomation.length > 5) {
      console.log(`   ... and ${missingAutomation.length - 5} more`);
    }
    console.log();
  }

  if (missingChecklist.length > 0) {
    console.log("2. Add to SECURITY_CHECKLIST.md:");
    for (const g of missingChecklist.slice(0, 5)) {
      console.log(`   - Pattern #${g.pattern}`);
    }
    console.log();
  }

  console.log(
    "Note: Not all patterns can be automated. Patterns requiring\n" +
      "semantic analysis may only exist in the checklist.\n"
  );

  return { success: false, gaps: results.gaps };
}

/**
 * Get pattern details from learnings log
 */
function getPatternDetails(patternNum) {
  const learningsPath = FILES.learningsLog;
  if (!existsSync(learningsPath)) return null;

  let content;
  try {
    content = readFileSync(learningsPath, "utf-8");
  } catch {
    return null;
  }

  // Find the pattern definition
  const regex = new RegExp(
    `\\*\\*Pattern #${patternNum}[^*]*\\*\\*[^]*?(?=\\*\\*Pattern #|\\*\\*Resolution|$)`,
    "i"
  );
  const match = content.match(regex);

  if (match) {
    return match[0].trim();
  }

  return null;
}

// Main
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Pattern Sync Checker

Usage:
  node scripts/check-pattern-sync.js          Check sync status
  node scripts/check-pattern-sync.js --detail Show pattern details for gaps

Options:
  --detail    Show full pattern descriptions for gaps
  --help      Show this help message
`);
    process.exit(0);
  }

  const result = checkPatternSync();

  if (args.includes("--detail") && result.gaps.length > 0) {
    console.log("\n📖 Pattern Details:\n");
    for (const gap of result.gaps.slice(0, 10)) {
      const details = getPatternDetails(gap.pattern);
      if (details) {
        console.log(`--- Pattern #${gap.pattern} ---`);
        console.log(details.slice(0, 500));
        console.log();
      }
    }
  }

  process.exit(result.success ? 0 : 1);
}

module.exports = { checkPatternSync };
