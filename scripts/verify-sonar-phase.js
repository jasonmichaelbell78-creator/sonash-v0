#!/usr/bin/env node

/**
 * SonarCloud Phase Verification Script
 *
 * Simple comparison between issues in the report vs what's been addressed.
 * Each issue must be either:
 * - FIXED: Documented in sonarcloud-fixes.md or sonarcloud-dismissals.md
 * - DISMISSED: Documented in sonarcloud-dismissals.md with justification
 *
 * This does NOT auto-detect changes - it requires explicit tracking.
 * Final verification happens when SonarCloud re-analyzes at end of sprint.
 *
 * Usage:
 *   node scripts/verify-sonar-phase.js --phase=1
 *   node scripts/verify-sonar-phase.js --phase=1 --summary    # Summary only
 *   node scripts/verify-sonar-phase.js --phase=2 --extract-learnings
 */

import * as fs from "node:fs";
import * as path from "node:path";

const PROJECT_ROOT = process.cwd();
const DETAILED_REPORT = path.join(PROJECT_ROOT, "docs/audits/sonarcloud-issues-detailed.md");
const DISMISSALS_FILE = path.join(PROJECT_ROOT, "docs/audits/sonarcloud-dismissals.md");
const FIXES_FILE = path.join(PROJECT_ROOT, "docs/audits/sonarcloud-fixes.md");
const _LEARNINGS_FILE = path.join(PROJECT_ROOT, "docs/agent_docs/AI_LESSONS_LOG.md");

// Parse command line arguments
const args = process.argv.slice(2);
const phaseArg = args.find((a) => a.startsWith("--phase="));
const extractLearnings = args.includes("--extract-learnings");
const summaryOnly = args.includes("--summary");
const phase = phaseArg ? parseInt(phaseArg.split("=")[1], 10) : null;

if (!phase || phase < 1 || phase > 5) {
  console.error(
    "Usage: node scripts/verify-sonar-phase.js --phase=<1-5> [--extract-learnings] [--summary]"
  );
  console.error("");
  console.error("Phases:");
  console.error("  1 - Mechanical Fixes (node imports, shell scripts)");
  console.error("  2 - Critical Issues (complexity, blockers)");
  console.error("  3 - Major Code Quality (ternaries, React)");
  console.error("  4 - Medium/Minor Priority (string methods, modern JS)");
  console.error("  5 - Security Hotspots");
  console.error("");
  console.error("Options:");
  console.error("  --summary          Show summary counts only (no details)");
  console.error("  --extract-learnings  Extract patterns for AI learnings log");
  process.exit(1);
}

// Define rules for each phase
const PHASE_RULES = {
  1: {
    name: "Mechanical Fixes",
    rules: [
      "javascript:S7772",
      "typescript:S7772",
      "shelldre:S7688",
      "shelldre:S7682",
      "shelldre:S7677",
      "shelldre:S1192",
      "shelldre:S7679",
      "shelldre:S131",
    ],
    description: "Node protocol imports and shell script best practices",
  },
  2: {
    name: "Critical Issues",
    rules: [
      "javascript:S3776",
      "typescript:S3776",
      "typescript:S3735",
      "typescript:S2004",
      "typescript:S2871",
      "typescript:S6861",
    ],
    description: "Cognitive complexity, void operator, nested functions, sort comparisons",
  },
  3: {
    name: "Major Code Quality",
    rules: [
      "typescript:S3358",
      "javascript:S3358",
      "typescript:S6853",
      "typescript:S6479",
      "typescript:S6819",
      "typescript:S6848",
      "typescript:S6772",
      "typescript:S6481",
      "typescript:S7785",
      "javascript:S7785",
      "javascript:S5843",
    ],
    description: "Nested ternaries, React accessibility, regex complexity",
  },
  4: {
    name: "Medium/Minor Priority",
    rules: [
      "javascript:S7781",
      "typescript:S7781",
      "javascript:S7778",
      "typescript:S7778",
      "javascript:S7780",
      "typescript:S7764",
      "typescript:S7773",
      "javascript:S7773",
      "typescript:S6759",
      "typescript:S1874",
      "typescript:S1082",
    ],
    description: "String methods, modern JS patterns, React props",
    catchAll: true,
  },
  5: {
    name: "Security Hotspots",
    rules: [],
    isSecurityPhase: true,
    description: "All security hotspots requiring review",
  },
};

/**
 * Safely read file content or exit with error
 */
function readFileOrExit(filePath, errorPrefix) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: ${errorPrefix} not found at ${filePath}`);
    process.exit(1);
  }
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error reading ${errorPrefix}: ${message}`);
    process.exit(1);
  }
}

/**
 * Extract rule from subsequent lines after an issue header
 */
function extractRuleFromLines(lines, startIndex) {
  for (let j = startIndex; j < lines.length; j++) {
    const nextLine = lines[j];
    // Stop if we hit the next issue or file section
    if (nextLine.startsWith("#### ") || nextLine.startsWith("### 📁 `")) {
      break;
    }
    const ruleMatch = nextLine.match(/- \*\*Rule\*\*: `([^`]+)`/);
    if (ruleMatch) return ruleMatch[1];
  }
  return null;
}

// Load and parse the detailed report to extract issues
function loadIssuesFromReport() {
  const content = readFileOrExit(DETAILED_REPORT, "Detailed report");
  const issues = [];
  const hotspots = [];

  let currentFile = null;
  const lines = content.split("\n");
  let inSecuritySection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect section transitions
    if (line.startsWith("## 🔒 Security Hotspots")) {
      inSecuritySection = true;
      continue;
    }
    if (line.startsWith("## 📂 All Issues by File")) {
      inSecuritySection = false;
      continue;
    }

    // Check for file header
    const fileMatch = line.match(/### 📁 `([^`]+)`/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      continue;
    }

    // Check for issue header
    const issueMatch = line.match(/^#### .{0,500}? Line (\d+|N\/A):\s{0,50}(.{0,500})$/u);
    if (issueMatch && currentFile) {
      const lineNum = issueMatch[1] === "N/A" ? null : parseInt(issueMatch[1], 10);
      const message = issueMatch[2];
      const extractedRule = extractRuleFromLines(lines, i + 1);
      // Skip entries without a valid rule to prevent incorrect failures (Review #184 - Qodo)
      if (!extractedRule) continue;

      const target = inSecuritySection ? hotspots : issues;
      target.push({ file: currentFile, line: lineNum, message, rule: extractedRule });
    }
  }

  return { issues, hotspots };
}

/**
 * Parse tracking entries from file content
 */
function parseTrackingFile(filePath, type, entries, conflicts) {
  if (!fs.existsSync(filePath)) return;

  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Warning: Failed to read ${type} file: ${message}`);
    return;
  }

  // Review #190: Normalize CRLF/CR line endings for cross-platform handling
  const normalizedContent = content.replace(/\r\n?/g, "\n");

  // Review #194: Use last-colon parsing to handle Windows paths with drive letters (C:\...)
  // First capture full "location" part; then split out ":line" using last-colon parsing
  const regex = /^### \[([^\]]+)\] - (.+)$/gm;
  let match;
  while ((match = regex.exec(normalizedContent)) !== null) {
    const rule = match[1];
    const locationRaw = match[2].trim();

    // Review #194: Parse line number from last colon to handle Windows drive letters
    let filePart = locationRaw;
    let rawLine = "N/A";

    const lastColon = locationRaw.lastIndexOf(":");
    if (lastColon !== -1) {
      const maybeLine = locationRaw.slice(lastColon + 1);
      if (/^(?:\d+|N\/A|BATCH)$/.test(maybeLine)) {
        filePart = locationRaw.slice(0, lastColon);
        rawLine = maybeLine;
      }
    }

    // Review #190: Normalize backslashes to forward slashes for Windows paths
    // Review #195: Further normalize paths - trim, collapse multiple slashes, remove leading ./
    const file = filePart
      .trim()
      .replace(/\\/g, "/")
      .replace(/\/{2,}/g, "/")
      .replace(/^\.\//, "");

    // Review #196: Reject unsafe tracked file paths (absolute or repo-escaping)
    // Review #197: Use regex instead of startsWith() to avoid pattern compliance false positive
    // Review #197: Check for ".." anywhere in path, not just at the start
    const segments = file.split("/").filter(Boolean);
    if (
      /^\//.test(file) || // unix absolute / UNC-like
      /^[A-Za-z]:\//.test(file) || // windows drive absolute
      segments.includes("..") // repo-escaping anywhere in path
    ) {
      console.warn(`Warning: Skipping unsafe tracked path: ${filePart}`);
      continue;
    }

    const line = rawLine === "BATCH" ? "N/A" : rawLine;
    const key = `${rule}|${file}|${line}`;

    const existing = entries.get(key);
    if (existing && existing.type !== type) {
      conflicts.push({ key, existing, entry: { type, rule, file, line } });
    } else {
      entries.set(key, { type, rule, file, line });
    }
  }

  // Check for bulk fix markers (only in fixes file)
  if (type === "FIXED") {
    const bulkRegex = /#### Rule `([^`]+)` - FIXED/g;
    while ((match = bulkRegex.exec(normalizedContent)) !== null) {
      const bulkRule = match[1];
      const bulkKey = `BULK|${bulkRule}`;

      // Review #190: Check for conflicts with dismissed entries for this rule
      // A bulk fix conflicts with any dismissal for the same rule
      for (const [existingKey, existingEntry] of entries.entries()) {
        if (existingEntry.type === "DISMISSED" && existingEntry.rule === bulkRule) {
          conflicts.push({
            key: existingKey,
            existing: existingEntry,
            entry: { type: "BULK_FIXED", rule: bulkRule, file: "*", line: "N/A" },
          });
        }
      }

      // Review #189: Include placeholder file/line for consistent entry structure
      entries.set(bulkKey, {
        type: "BULK_FIXED",
        rule: bulkRule,
        file: "*",
        line: "N/A",
      });
    }
  }
}

/**
 * Report tracking conflicts and exit if any found
 */
function reportConflictsAndExit(conflicts) {
  if (conflicts.length === 0) return;

  console.error("Error: Conflicting tracking entries found (FIXED vs DISMISSED):");
  for (const c of conflicts.slice(0, 20)) {
    console.error(`  - ${c.key}`);
  }
  if (conflicts.length > 20) {
    console.error(`  ... and ${conflicts.length - 20} more`);
  }
  process.exit(1);
}

// Load tracking entries (both fixes and dismissals)
function loadTrackingEntries() {
  const entries = new Map();
  const conflicts = [];

  parseTrackingFile(DISMISSALS_FILE, "DISMISSED", entries, conflicts);
  parseTrackingFile(FIXES_FILE, "FIXED", entries, conflicts);
  reportConflictsAndExit(conflicts);

  return entries;
}

// Filter issues for the current phase
function getPhaseIssues(issues, hotspots, phaseNum) {
  const phaseConfig = PHASE_RULES[phaseNum];

  if (phaseConfig.isSecurityPhase) {
    return { issues: [], hotspots };
  }

  const phaseIssues = issues.filter((issue) => {
    if (phaseConfig.catchAll) {
      const allOtherRules = [
        ...PHASE_RULES[1].rules,
        ...PHASE_RULES[2].rules,
        ...PHASE_RULES[3].rules,
      ];
      return !allOtherRules.includes(issue.rule);
    }
    return phaseConfig.rules.includes(issue.rule);
  });

  return { issues: phaseIssues, hotspots: [] };
}

// Check if an issue is tracked (fixed or dismissed)
function isIssueTracked(issue, entries) {
  // Check exact match
  const key = `${issue.rule}|${issue.file}|${issue.line || "N/A"}`;
  if (entries.has(key)) {
    return entries.get(key);
  }

  // Check file-level match (for batch fixes)
  const fileKey = `${issue.rule}|${issue.file}|N/A`;
  if (entries.has(fileKey)) {
    return entries.get(fileKey);
  }

  // Check bulk rule fix
  const bulkKey = `BULK|${issue.rule}`;
  if (entries.has(bulkKey)) {
    return entries.get(bulkKey);
  }

  return null;
}

// Generate learnings from the phase
function extractPhaseLearnings(phaseNum, issues, hotspots) {
  const _phaseConfig = PHASE_RULES[phaseNum];
  const learnings = [];

  // Group by rule
  const byRule = {};
  for (const issue of issues) {
    if (!byRule[issue.rule]) {
      byRule[issue.rule] = [];
    }
    byRule[issue.rule].push(issue);
  }

  for (const [rule, ruleIssues] of Object.entries(byRule)) {
    if (ruleIssues.length >= 5) {
      learnings.push({
        category: "Code Pattern",
        rule,
        count: ruleIssues.length,
        lesson: `Rule ${rule} appeared ${ruleIssues.length} times. Consider adding a lint rule or code review checklist item.`,
        files: [...new Set(ruleIssues.map((i) => i.file))].slice(0, 5),
      });
    }
  }

  if (hotspots.length > 0) {
    learnings.push({
      category: "Security",
      rule: "security-hotspots",
      count: hotspots.length,
      lesson: `${hotspots.length} security hotspots found. Review security practices.`,
      files: [...new Set(hotspots.map((h) => h.file))].slice(0, 5),
    });
  }

  return learnings;
}

// Format learnings for output
function formatLearningsForLog(phaseNum, learnings) {
  const date = new Date().toISOString().split("T")[0];
  const phaseConfig = PHASE_RULES[phaseNum];

  let output = `\n## SonarCloud Phase ${phaseNum} Learnings (${date})\n\n`;
  output += `**Phase**: ${phaseConfig.name}\n`;
  output += `**Description**: ${phaseConfig.description}\n\n`;

  if (learnings.length === 0) {
    output += "No significant patterns detected.\n";
    return output;
  }

  output += "### Patterns Identified\n\n";
  for (const learning of learnings) {
    output += `#### ${learning.rule} (${learning.count} occurrences)\n\n`;
    output += `**Lesson**: ${learning.lesson}\n\n`;
    output += `**Sample Files**:\n`;
    for (const file of learning.files) {
      output += `- \`${file}\`\n`;
    }
    output += "\n";
  }

  output += "### Action Items\n\n";
  output += "- [ ] Review if any patterns can be caught by ESLint rules\n";
  output += "- [ ] Update CODE_PATTERNS.md if new anti-patterns identified\n";
  output += "- [ ] Consider adding pre-commit hooks for common issues\n";

  return output;
}

// Main verification
console.log(`\n🔍 SonarCloud Phase ${phase} Verification`);
console.log(`   Phase: ${PHASE_RULES[phase].name}`);
console.log(`   Description: ${PHASE_RULES[phase].description}`);
console.log("━".repeat(60) + "\n");

const { issues, hotspots } = loadIssuesFromReport();
const entries = loadTrackingEntries();
const { issues: phaseIssues, hotspots: phaseHotspots } = getPhaseIssues(issues, hotspots, phase);

// Categorize issues
const stats = {
  fixed: [],
  dismissed: [],
  pending: [],
};

for (const issue of phaseIssues) {
  const tracked = isIssueTracked(issue, entries);
  if (tracked) {
    if (tracked.type === "FIXED" || tracked.type === "BULK_FIXED") {
      stats.fixed.push(issue);
    } else {
      stats.dismissed.push(issue);
    }
  } else {
    stats.pending.push(issue);
  }
}

for (const hotspot of phaseHotspots) {
  const tracked = isIssueTracked(hotspot, entries);
  if (tracked) {
    if (tracked.type === "FIXED" || tracked.type === "BULK_FIXED") {
      stats.fixed.push(hotspot);
    } else {
      stats.dismissed.push(hotspot);
    }
  } else {
    stats.pending.push(hotspot);
  }
}

const total = phaseIssues.length + phaseHotspots.length;

// Output summary
console.log(`📊 Phase Statistics:`);
console.log(`   Total issues in report: ${total}`);
console.log("");
console.log(`📋 Tracking Status:`);
console.log(`   ✅ Fixed: ${stats.fixed.length}`);
console.log(`   📝 Dismissed: ${stats.dismissed.length}`);
console.log(`   ⏳ Pending: ${stats.pending.length}`);
console.log("");

// Show by-rule breakdown
if (!summaryOnly) {
  const byRule = {};
  for (const issue of [...phaseIssues, ...phaseHotspots]) {
    if (!byRule[issue.rule]) {
      byRule[issue.rule] = { fixed: 0, dismissed: 0, pending: 0 };
    }
    const tracked = isIssueTracked(issue, entries);
    if (tracked) {
      if (tracked.type === "FIXED" || tracked.type === "BULK_FIXED") {
        byRule[issue.rule].fixed++;
      } else {
        byRule[issue.rule].dismissed++;
      }
    } else {
      byRule[issue.rule].pending++;
    }
  }

  console.log("📊 By Rule:");
  for (const [rule, counts] of Object.entries(byRule)) {
    const status = counts.pending === 0 ? "✅" : "⏳";
    console.log(
      `   ${status} ${rule}: ${counts.fixed} fixed, ${counts.dismissed} dismissed, ${counts.pending} pending`
    );
  }
  console.log("");
}

// Show pending details
if (stats.pending.length > 0 && !summaryOnly) {
  console.log(`⏳ Pending Issues (${stats.pending.length}):\n`);

  const byRule = {};
  for (const issue of stats.pending) {
    if (!byRule[issue.rule]) {
      byRule[issue.rule] = [];
    }
    byRule[issue.rule].push(issue);
  }

  for (const [rule, ruleIssues] of Object.entries(byRule)) {
    console.log(`   ${rule} (${ruleIssues.length}):`);
    for (const issue of ruleIssues.slice(0, 5)) {
      console.log(`     - ${issue.file}:${issue.line || "N/A"}`);
    }
    if (ruleIssues.length > 5) {
      console.log(`     ... and ${ruleIssues.length - 5} more`);
    }
  }
  console.log("");
}

// Final status
if (stats.pending.length === 0) {
  console.log("✅ PHASE COMPLETE");
  console.log(`   All ${total} issues are tracked (fixed or dismissed).`);
  console.log("   Final verification: SonarCloud re-analysis at end of sprint.");
} else {
  console.log("📋 PHASE IN PROGRESS");
  console.log(`   ${stats.pending.length} of ${total} issues need tracking.`);
  console.log("");
  console.log("To track fixes, add to docs/audits/sonarcloud-fixes.md:");
  console.log("  ### [rule] - file:line");
  console.log("  **Commit**: [hash]");
  console.log("  **Fix**: [description]");
  console.log("");
  console.log("Or for bulk rule fixes:");
  console.log("  #### Rule `rule:SXXXX` - FIXED");
  console.log("  **Commit**: [hash]");
  console.log("  **Files**: [count] files");
}

// Extract learnings if requested
if (extractLearnings) {
  console.log("\n📚 Extracting learnings...\n");

  const learnings = extractPhaseLearnings(phase, phaseIssues, phaseHotspots);
  const formattedLearnings = formatLearningsForLog(phase, learnings);

  console.log(formattedLearnings);

  console.log("\n💡 To add to AI_LESSONS_LOG.md:");
  console.log(
    "   node scripts/verify-sonar-phase.js --phase=" +
      phase +
      " --extract-learnings >> docs/agent_docs/AI_LESSONS_LOG.md"
  );
}

console.log("\n" + "━".repeat(60));
