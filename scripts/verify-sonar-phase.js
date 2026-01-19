#!/usr/bin/env node

/**
 * SonarCloud Phase Verification Script
 *
 * Verifies that all issues for a specific PR phase have been addressed:
 * - FIXED: The code at the issue location has changed
 * - DISMISSED: Documented in sonarcloud-dismissals.md with justification
 *
 * Also extracts learnings for the AI learnings log after each phase.
 *
 * Usage:
 *   node scripts/verify-sonar-phase.js --phase=1
 *   node scripts/verify-sonar-phase.js --phase=2 --extract-learnings
 */

import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const DETAILED_REPORT = path.join(PROJECT_ROOT, "docs/audits/sonarcloud-issues-detailed.md");
const DISMISSALS_FILE = path.join(PROJECT_ROOT, "docs/audits/sonarcloud-dismissals.md");
const _LEARNINGS_FILE = path.join(PROJECT_ROOT, "docs/agent_docs/AI_LESSONS_LOG.md");

// Parse command line arguments
const args = process.argv.slice(2);
const phaseArg = args.find((a) => a.startsWith("--phase="));
const extractLearnings = args.includes("--extract-learnings");
const phase = phaseArg ? parseInt(phaseArg.split("=")[1], 10) : null;

if (!phase || phase < 1 || phase > 5) {
  console.error("Usage: node scripts/verify-sonar-phase.js --phase=<1-5> [--extract-learnings]");
  console.error("");
  console.error("Phases:");
  console.error("  1 - Mechanical Fixes (node imports, shell scripts)");
  console.error("  2 - Critical Issues (complexity, blockers)");
  console.error("  3 - Major Code Quality (ternaries, React)");
  console.error("  4 - Medium/Minor Priority (string methods, modern JS)");
  console.error("  5 - Security Hotspots");
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
      // Plus all remaining MINOR/INFO rules not in other phases
    ],
    description: "String methods, modern JS patterns, React props",
    catchAll: true, // This phase catches remaining MINOR/INFO
  },
  5: {
    name: "Security Hotspots",
    rules: [], // Security hotspots are separate from code issues
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

  const content = fs.readFileSync(DETAILED_REPORT, "utf-8");
  const issues = [];
  const hotspots = [];

  // Parse issues from the "All Issues by File" section
  // Note: Using character codes for emojis to avoid regex surrogate pair issues
  const _issueRegex = /#### .+ Line (\d+|N\/A): (.+)\n\n- \*\*Rule\*\*: `([^`]+)`/gu;
  const _fileRegex = /### .+ `([^`]+)`/gu;

  let currentFile = null;
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for file header
    const fileMatch = line.match(/### 📁 `([^`]+)`/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      continue;
    }

    // Check for issue header (using . instead of emoji chars to avoid surrogate pair issues)
    const issueMatch = line.match(/#### .+ Line (\d+|N\/A): (.+)/u);
    if (issueMatch && currentFile) {
      const lineNum = issueMatch[1] === "N/A" ? null : parseInt(issueMatch[1], 10);
      const message = issueMatch[2];

      // Look for rule in next few lines
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const ruleMatch = lines[j].match(/- \*\*Rule\*\*: `([^`]+)`/);
        if (ruleMatch) {
          const rule = ruleMatch[1];

          // Check if it's in the security hotspots section
          const inSecuritySection = content
            .substring(0, content.indexOf(line))
            .includes("## 🔒 Security Hotspots");

          if (inSecuritySection) {
            hotspots.push({
              file: currentFile,
              line: lineNum,
              message,
              rule,
            });
          } else {
            issues.push({
              file: currentFile,
              line: lineNum,
              message,
              rule,
            });
          }
          break;
        }
      }
    }
  }

  return { issues, hotspots };
}

// Load dismissals from the dismissals file
function loadDismissals() {
  if (!fs.existsSync(DISMISSALS_FILE)) {
    return new Map();
  }

  const content = fs.readFileSync(DISMISSALS_FILE, "utf-8");
  const dismissals = new Map();

  // Parse dismissals: ### [Rule] - File:Line
  const dismissalRegex = /### \[([^\]]+)\] - ([^:]+):(\d+|N\/A)/g;
  let match;
  while ((match = dismissalRegex.exec(content)) !== null) {
    const key = `${match[1]}|${match[2]}|${match[3]}`;
    dismissals.set(key, true);
  }

  return dismissals;
}

// Check if a file/line has been modified (issue potentially fixed)
function checkIfFixed(file, line) {
  const fullPath = path.join(PROJECT_ROOT, file);
  if (!fs.existsSync(fullPath)) {
    return { exists: false, fixed: "FILE_DELETED" };
  }

  if (!line) {
    return { exists: true, fixed: "NO_LINE" };
  }

  // Read the file and check if the line still exists
  // This is a basic check - the real verification comes from re-running SonarCloud
  const content = fs.readFileSync(fullPath, "utf-8");
  const lines = content.split("\n");

  if (line > lines.length) {
    return { exists: true, fixed: "LINE_CHANGED" };
  }

  return { exists: true, fixed: "UNKNOWN" };
}

// Filter issues for the current phase
function getPhaseIssues(issues, hotspots, phaseNum) {
  const phaseConfig = PHASE_RULES[phaseNum];

  if (phaseConfig.isSecurityPhase) {
    return { issues: [], hotspots };
  }

  const phaseIssues = issues.filter((issue) => {
    if (phaseConfig.catchAll) {
      // Phase 4 catches all remaining issues not in phases 1-3
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

// Generate learnings from the phase
function extractPhaseLearnings(phaseNum, issues, hotspots) {
  const _phaseConfig = PHASE_RULES[phaseNum];
  const learnings = [];

  // Group by rule to identify patterns
  const byRule = {};
  for (const issue of issues) {
    if (!byRule[issue.rule]) {
      byRule[issue.rule] = [];
    }
    byRule[issue.rule].push(issue);
  }

  // Generate learnings based on common patterns
  for (const [rule, ruleIssues] of Object.entries(byRule)) {
    if (ruleIssues.length >= 5) {
      learnings.push({
        category: "Code Pattern",
        rule,
        count: ruleIssues.length,
        lesson: `Rule ${rule} appeared ${ruleIssues.length} times. Consider adding a lint rule or code review checklist item to catch this pattern earlier.`,
        files: [...new Set(ruleIssues.map((i) => i.file))].slice(0, 5),
      });
    }
  }

  // Add security learnings
  if (hotspots.length > 0) {
    learnings.push({
      category: "Security",
      rule: "security-hotspots",
      count: hotspots.length,
      lesson: `${hotspots.length} security hotspots found. Review security practices and consider security-focused code review checklists.`,
      files: [...new Set(hotspots.map((h) => h.file))].slice(0, 5),
    });
  }

  return learnings;
}

// Format learnings for the AI learnings log
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
const dismissals = loadDismissals();
const { issues: phaseIssues, hotspots: phaseHotspots } = getPhaseIssues(issues, hotspots, phase);

console.log(`📊 Phase Statistics:`);
console.log(`   Total issues in phase: ${phaseIssues.length}`);
console.log(`   Security hotspots: ${phaseHotspots.length}`);
console.log("");

// Verify each issue
let fixed = 0;
let dismissed = 0;
let pending = 0;
const pendingIssues = [];

for (const issue of phaseIssues) {
  const dismissKey = `${issue.rule}|${issue.file}|${issue.line || "N/A"}`;

  if (dismissals.has(dismissKey)) {
    dismissed++;
  } else {
    const status = checkIfFixed(issue.file, issue.line);
    if (status.fixed === "FILE_DELETED" || status.fixed === "LINE_CHANGED") {
      fixed++;
    } else {
      pending++;
      pendingIssues.push(issue);
    }
  }
}

// Same for hotspots
for (const hotspot of phaseHotspots) {
  const dismissKey = `${hotspot.rule}|${hotspot.file}|${hotspot.line || "N/A"}`;
  if (dismissals.has(dismissKey)) {
    dismissed++;
  } else {
    pending++;
    pendingIssues.push(hotspot);
  }
}

const total = phaseIssues.length + phaseHotspots.length;

console.log(`📋 Verification Results:`);
console.log(`   ✅ Fixed (code changed): ${fixed}`);
console.log(`   📝 Dismissed (documented): ${dismissed}`);
console.log(`   ⏳ Pending (needs action): ${pending}`);
console.log("");

if (pending > 0) {
  console.log(`⚠️  ${pending} issues require attention:\n`);

  // Group pending by rule for better readability
  const byRule = {};
  for (const issue of pendingIssues.slice(0, 20)) {
    if (!byRule[issue.rule]) {
      byRule[issue.rule] = [];
    }
    byRule[issue.rule].push(issue);
  }

  for (const [rule, ruleIssues] of Object.entries(byRule)) {
    console.log(`   ${rule}:`);
    for (const issue of ruleIssues.slice(0, 3)) {
      console.log(`     - ${issue.file}:${issue.line || "N/A"}`);
    }
    if (ruleIssues.length > 3) {
      console.log(`     ... and ${ruleIssues.length - 3} more`);
    }
  }

  if (pendingIssues.length > 20) {
    console.log(`\n   ... and ${pendingIssues.length - 20} more issues`);
  }

  console.log("\n❌ VERIFICATION FAILED");
  console.log("\nTo resolve:");
  console.log("  1. Fix the remaining issues in code");
  console.log("  2. Or document dismissals in docs/audits/sonarcloud-dismissals.md");
  console.log("\nDismissal format:");
  console.log("  ### [rule] - file:line");
  console.log("  **Reason**: [False positive | Acceptable risk | By design]");
  console.log("  **Justification**: [Explanation]");

  process.exit(1);
} else {
  console.log("✅ VERIFICATION PASSED");
  console.log(`   All ${total} issues in Phase ${phase} are addressed.`);
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
