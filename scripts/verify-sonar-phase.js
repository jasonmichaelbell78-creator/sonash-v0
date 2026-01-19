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

// Load and parse the detailed report to extract issues
function loadIssuesFromReport() {
  if (!fs.existsSync(DETAILED_REPORT)) {
    console.error(`Error: Detailed report not found at ${DETAILED_REPORT}`);
    console.error("Run: node scripts/generate-detailed-sonar-report.js");
    process.exit(1);
  }

  let content;
  try {
    content = fs.readFileSync(DETAILED_REPORT, "utf-8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error reading detailed report: ${message}`);
    process.exit(1);
  }
  const issues = [];
  const hotspots = [];

  let currentFile = null;
  const lines = content.split("\n");

  // State machine approach: track section by detecting headers (more reliable than indexOf)
  let inSecuritySection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect section transitions (state machine)
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

    // Check for issue header (anchored, non-greedy for reliable parsing)
    const issueMatch = line.match(/^#### .*? Line (\d+|N\/A):\s*(.*)$/u);
    if (issueMatch && currentFile) {
      const lineNum = issueMatch[1] === "N/A" ? null : parseInt(issueMatch[1], 10);
      const message = issueMatch[2];

      // Look for rule in next few lines
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const ruleMatch = lines[j].match(/- \*\*Rule\*\*: `([^`]+)`/);
        if (ruleMatch) {
          const rule = ruleMatch[1];

          if (inSecuritySection) {
            hotspots.push({ file: currentFile, line: lineNum, message, rule });
          } else {
            issues.push({ file: currentFile, line: lineNum, message, rule });
          }
          break;
        }
      }
    }
  }

  return { issues, hotspots };
}

// Load tracking entries (both fixes and dismissals)
function loadTrackingEntries() {
  const entries = new Map();
  const conflicts = [];

  // Helper to add entry with conflict detection
  function addEntry(key, entry) {
    const existing = entries.get(key);
    if (existing && existing.type !== entry.type) {
      conflicts.push({ key, existing, entry });
      return;
    }
    entries.set(key, entry);
  }

  // Load dismissals
  if (fs.existsSync(DISMISSALS_FILE)) {
    try {
      const content = fs.readFileSync(DISMISSALS_FILE, "utf-8");
      // Match: ### [rule] - file:line or ### [rule] - file
      const regex = /### \[([^\]]+)\] - ([^:\n]+)(?::(\d+|N\/A))?/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const rule = match[1];
        const file = match[2].trim();
        const line = match[3] || "N/A";
        const key = `${rule}|${file}|${line}`;
        addEntry(key, { type: "DISMISSED", rule, file, line });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`Warning: Failed to read dismissals file: ${message}`);
    }
  }

  // Load fixes
  if (fs.existsSync(FIXES_FILE)) {
    try {
      const content = fs.readFileSync(FIXES_FILE, "utf-8");
      // Match: ### [rule] - file:line or ### [rule] - file (batch fix)
      const regex = /### \[([^\]]+)\] - ([^:\n]+)(?::(\d+|N\/A|BATCH))?/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const rule = match[1];
        const file = match[2].trim();
        const line = match[3] || "N/A";
        const key = `${rule}|${file}|${line}`;
        addEntry(key, { type: "FIXED", rule, file, line });
      }

      // Also check for bulk fix markers: #### Rule [rule] - FIXED (X files)
      const bulkRegex = /#### Rule `([^`]+)` - FIXED/g;
      while ((match = bulkRegex.exec(content)) !== null) {
        const rule = match[1];
        addEntry(`BULK|${rule}`, { type: "BULK_FIXED", rule });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`Warning: Failed to read fixes file: ${message}`);
    }
  }

  // Report conflicts (issue marked both FIXED and DISMISSED is data integrity error)
  if (conflicts.length > 0) {
    console.error("Error: Conflicting tracking entries found (FIXED vs DISMISSED):");
    for (const c of conflicts.slice(0, 20)) {
      console.error(`  - ${c.key}`);
    }
    if (conflicts.length > 20) {
      console.error(`  ... and ${conflicts.length - 20} more`);
    }
    process.exit(1);
  }

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
