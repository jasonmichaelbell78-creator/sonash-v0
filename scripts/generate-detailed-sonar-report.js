#!/usr/bin/env node

/**
 * Generate a comprehensive SonarCloud issues report with code snippets
 * Fetches fresh data from SonarCloud API and reads local source files for snippets
 */

import * as fs from "node:fs";
import * as path from "node:path";

const PROJECT_ROOT = process.cwd();
const OUTPUT_FILE = path.join(PROJECT_ROOT, "docs/audits/sonarcloud-issues-detailed.md");

// Load all issue pages from configurable paths (default: .sonar/ directory)
const SONAR_DIR = process.env.SONAR_DATA_DIR || path.join(PROJECT_ROOT, ".sonar");
const issueFiles = [
  process.env.SONAR_PAGE_1 || path.join(SONAR_DIR, "sonar_all_p1.json"),
  process.env.SONAR_PAGE_2 || path.join(SONAR_DIR, "sonar_all_p2.json"),
  process.env.SONAR_PAGE_3 || path.join(SONAR_DIR, "sonar_all_p3.json"),
  process.env.SONAR_PAGE_4 || path.join(SONAR_DIR, "sonar_all_p4.json"),
];

// De-duplicate issues across pages using Map with unique key
const issuesByKey = new Map();
for (const file of issueFiles) {
  if (fs.existsSync(file)) {
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));
      const issues = data.issues || [];
      for (const issue of issues) {
        // Use issue.key if available, otherwise construct from rule/component/line/message
        const dedupeKey =
          issue.key ||
          `${issue.rule || "unknown"}|${issue.component || "unknown"}|${issue.line || "N/A"}|${issue.message || ""}`;
        if (!issuesByKey.has(dedupeKey)) {
          issuesByKey.set(dedupeKey, issue);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Warning: Failed to parse ${file}: ${message}`);
    }
  }
}
const allIssues = [...issuesByKey.values()];

console.log(`Loaded ${allIssues.length} issues`);

// Load hotspots from configurable path
const hotspotsFile = process.env.SONAR_HOTSPOTS || path.join(SONAR_DIR, "sonar_hotspots.json");
let hotspots = [];
if (fs.existsSync(hotspotsFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(hotspotsFile, "utf-8"));
    hotspots = data.hotspots || [];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Warning: Failed to parse hotspots file: ${message}`);
  }
}
console.log(`Loaded ${hotspots.length} security hotspots`);

// Extract file path from component
function getFilePath(component) {
  // Guard against missing or invalid component values from malformed JSON
  if (typeof component !== "string" || component.length === 0) return "unknown";
  // Component format: "owner_repo:path/to/file.js"
  const parts = component.split(":");
  return parts.length > 1 ? parts.slice(1).join(":") : component;
}

// Read code snippet from local file (with path containment check)
function getCodeSnippet(filePath, line, textRange, contextLines = 3) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  const resolved = path.resolve(fullPath);
  const relative = path.relative(PROJECT_ROOT, resolved);
  // Use regex for robust ".." detection (handles edge cases like "..hidden.md")
  if (/^\.\.(?:[\\/]|$)/.test(relative) || relative === "" || path.isAbsolute(relative)) {
    return { found: false, snippet: `[Path outside project: ${filePath}]` };
  }

  if (!fs.existsSync(resolved)) {
    return { found: false, snippet: `[File not found: ${filePath}]` };
  }

  try {
    const content = fs.readFileSync(resolved, "utf-8");
    const lines = content.split("\n");

    const startLine = Math.max(0, line - 1 - contextLines);
    const endLine = Math.min(lines.length, line + contextLines);

    const snippetLines = [];
    for (let i = startLine; i < endLine; i++) {
      const lineNum = i + 1;
      const marker = lineNum === line ? ">>>" : "   ";
      const lineContent = lines[i] || "";
      snippetLines.push(`${marker} ${String(lineNum).padStart(4, " ")} | ${lineContent}`);
    }

    return { found: true, snippet: snippetLines.join("\n") };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { found: false, snippet: `[Error reading file: ${message}]` };
  }
}

// Strip HTML tags from code (SonarCloud returns HTML-formatted code)
function stripHtml(html) {
  return html
    .replace(/<[^>]{1,1000}>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Group issues by severity
const bySeverity = {};
for (const issue of allIssues) {
  const severity = issue.severity || "UNKNOWN";
  if (!bySeverity[severity]) {
    bySeverity[severity] = [];
  }
  bySeverity[severity].push(issue);
}

// Group issues by file for easier fixing
const byFile = {};
for (const issue of allIssues) {
  const filePath = getFilePath(issue.component);
  if (!byFile[filePath]) {
    byFile[filePath] = [];
  }
  byFile[filePath].push(issue);
}

// Sort files by issue count (descending)
const sortedFiles = Object.entries(byFile).sort((a, b) => b[1].length - a[1].length);

// Group by rule for summary
const byRule = {};
for (const issue of allIssues) {
  const rule = issue.rule;
  if (!byRule[rule]) {
    byRule[rule] = { count: 0, message: issue.message, severity: issue.severity, type: issue.type };
  }
  byRule[rule].count++;
}
const sortedRules = Object.entries(byRule).sort((a, b) => b[1].count - a[1].count);

// Generate the report
const generatedDate = new Date().toISOString().split("T")[0];
let report = `# SonarCloud Issues - Detailed Report with Code Snippets

**Generated**: ${generatedDate}
**Project**: jasonmichaelbell78-creator_sonash-v0
**Total Issues**: ${allIssues.length}
**Security Hotspots**: ${hotspots.length}

---

## Executive Summary

This report contains **${allIssues.length} code issues** and **${hotspots.length} security hotspots** from SonarCloud analysis.

### Issues by Severity

| Severity | Count | Percentage |
|----------|-------|------------|
`;

const severityOrder = ["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "INFO"];
const severityEmoji = {
  BLOCKER: "🔴",
  CRITICAL: "🟠",
  MAJOR: "🟡",
  MINOR: "🔵",
  INFO: "⚪",
};

for (const sev of severityOrder) {
  const count = bySeverity[sev]?.length || 0;
  if (count > 0) {
    // Guard against zero division when allIssues is empty
    const pct = allIssues.length > 0 ? ((count / allIssues.length) * 100).toFixed(1) : "0.0";
    report += `| ${severityEmoji[sev]} ${sev} | ${count} | ${pct}% |\n`;
  }
}

// Issues by type
const byType = {};
for (const issue of allIssues) {
  const type = issue.type || "UNKNOWN";
  byType[type] = (byType[type] || 0) + 1;
}

report += `
### Issues by Type

| Type | Count |
|------|-------|
`;
for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  report += `| ${type} | ${count} |\n`;
}

report += `
### Files with Most Issues (Top 20)

| File | Issues |
|------|--------|
`;
for (const [filePath, issues] of sortedFiles.slice(0, 20)) {
  report += `| \`${filePath}\` | ${issues.length} |\n`;
}

report += `
---

## Rule Reference

| Rule | Description | Severity | Count |
|------|-------------|----------|-------|
`;

for (const [rule, info] of sortedRules) {
  const shortMsg = info.message.length > 50 ? info.message.substring(0, 50) + "..." : info.message;
  report += `| \`${rule}\` | ${shortMsg} | ${info.severity} | ${info.count} |\n`;
}

// ============================================
// BLOCKER and CRITICAL issues section (priority)
// ============================================
report += `
---

## 🚨 PRIORITY: BLOCKER & CRITICAL Issues (${(bySeverity["BLOCKER"]?.length || 0) + (bySeverity["CRITICAL"]?.length || 0)} total)

These issues should be fixed first as they represent the most severe problems.

`;

const priorityIssues = [...(bySeverity["BLOCKER"] || []), ...(bySeverity["CRITICAL"] || [])];
const priorityByFile = {};
for (const issue of priorityIssues) {
  const filePath = getFilePath(issue.component);
  if (!priorityByFile[filePath]) {
    priorityByFile[filePath] = [];
  }
  priorityByFile[filePath].push(issue);
}

for (const [filePath, issues] of Object.entries(priorityByFile)) {
  issues.sort((a, b) => (a.line || 0) - (b.line || 0));

  report += `### 📁 \`${filePath}\`\n\n`;

  for (const issue of issues) {
    const line = issue.line || "N/A";
    const severity = issue.severity || "UNKNOWN";
    const rule = issue.rule || "unknown";
    const message = issue.message || "No message";
    const type = issue.type || "CODE_SMELL";

    report += `#### ${severityEmoji[severity]} Line ${line}: ${message}\n\n`;
    report += `- **Rule**: \`${rule}\`\n`;
    report += `- **Type**: ${type}\n`;
    report += `- **Severity**: ${severity}\n`;
    report += `- **Effort**: ${issue.effort || "Unknown"}\n`;

    if (issue.line) {
      const { found, snippet } = getCodeSnippet(filePath, issue.line, issue.textRange);
      const ext = filePath.split(".").pop() || "text";
      report += `\n\`\`\`${ext}\n${snippet}\n\`\`\`\n`;
    }

    report += "\n---\n\n";
  }
}

// ============================================
// Security Hotspots section
// ============================================
if (hotspots.length > 0) {
  report += `
---

## 🔒 Security Hotspots (${hotspots.length} total)

Security hotspots require manual review to determine if they represent actual vulnerabilities.

`;

  const hotspotsByFile = {};
  for (const hotspot of hotspots) {
    const filePath = getFilePath(hotspot.component);
    if (!hotspotsByFile[filePath]) {
      hotspotsByFile[filePath] = [];
    }
    hotspotsByFile[filePath].push(hotspot);
  }

  for (const [filePath, hspots] of Object.entries(hotspotsByFile)) {
    hspots.sort((a, b) => (a.line || 0) - (b.line || 0));

    report += `### 📁 \`${filePath}\`\n\n`;

    for (const hotspot of hspots) {
      const line = hotspot.line || "N/A";
      const message = hotspot.message || "No message";
      const category = hotspot.securityCategory || "unknown";
      const probability = hotspot.vulnerabilityProbability || "MEDIUM";

      const probEmoji =
        {
          HIGH: "🔴",
          MEDIUM: "🟠",
          LOW: "🟡",
        }[probability] || "⚪";

      report += `#### ${probEmoji} Line ${line}: ${message}\n\n`;
      report += `- **Category**: ${category}\n`;
      report += `- **Vulnerability Probability**: ${probability}\n`;
      report += `- **Rule**: \`${hotspot.ruleKey || "unknown"}\`\n`;

      if (hotspot.line) {
        const { found, snippet } = getCodeSnippet(filePath, hotspot.line);
        const ext = filePath.split(".").pop() || "text";
        report += `\n\`\`\`${ext}\n${snippet}\n\`\`\`\n`;
      }

      report += "\n---\n\n";
    }
  }
}

// ============================================
// All Issues by File section
// ============================================
report += `
---

## 📂 All Issues by File

`;

for (const [filePath, issues] of sortedFiles) {
  issues.sort((a, b) => (a.line || 0) - (b.line || 0));

  report += `### 📁 \`${filePath}\` (${issues.length} issues)\n\n`;

  for (const issue of issues) {
    const line = issue.line || "N/A";
    const severity = issue.severity || "UNKNOWN";
    const rule = issue.rule || "unknown";
    const message = issue.message || "No message";
    const type = issue.type || "CODE_SMELL";

    report += `#### ${severityEmoji[severity] || "⚫"} Line ${line}: ${message}\n\n`;
    report += `- **Rule**: \`${rule}\`\n`;
    report += `- **Type**: ${type}\n`;
    report += `- **Severity**: ${severity}\n`;
    report += `- **Effort**: ${issue.effort || "Unknown"}\n`;

    if (issue.line) {
      const { found, snippet } = getCodeSnippet(filePath, issue.line, issue.textRange);
      const ext = filePath.split(".").pop() || "text";
      report += `\n\`\`\`${ext}\n${snippet}\n\`\`\`\n`;
    }

    report += "\n---\n\n";
  }
}

// Write the report (ensure directory exists and handle errors gracefully)
try {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, report);
  console.log(`\nReport written to: ${OUTPUT_FILE}`);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Error: Failed to write report to ${OUTPUT_FILE}: ${message}`);
  process.exit(1);
}
console.log(`Total issues documented: ${allIssues.length}`);
console.log(`Security hotspots documented: ${hotspots.length}`);
console.log(`Files with issues: ${sortedFiles.length}`);

// Also output stats
console.log("\n=== Summary ===");
for (const sev of severityOrder) {
  const count = bySeverity[sev]?.length || 0;
  if (count > 0) {
    console.log(`${sev}: ${count}`);
  }
}
