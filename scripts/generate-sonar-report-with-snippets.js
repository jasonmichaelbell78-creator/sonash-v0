#!/usr/bin/env node

/**
 * Generate a comprehensive SonarCloud issues report with code snippets
 * Reads from the JSON export and fetches actual source code for each issue
 */

import * as fs from "node:fs";
import * as path from "node:path";

const PROJECT_ROOT = process.cwd();
const JSON_FILE = path.join(PROJECT_ROOT, "docs/analysis/sonarqube-all-issues-complete.json");
const OUTPUT_FILE = path.join(PROJECT_ROOT, "docs/audits/sonarcloud-issues-detailed.md");

// Read the JSON data with proper error handling
let data;
try {
  data = JSON.parse(fs.readFileSync(JSON_FILE, "utf-8"));
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Fatal: Failed to read issues file: ${message}`);
  process.exit(1);
}

// Combine all issues
const allIssues = [...(data.issues?.reliability || []), ...(data.issues?.maintainability || [])];

console.log(`Processing ${allIssues.length} issues...`);

// Extract file path from component
function getFilePath(component) {
  // Guard against missing or invalid component values from malformed JSON
  if (typeof component !== "string" || component.length === 0) return "unknown";
  // Component format: "owner_repo:path/to/file.js"
  const parts = component.split(":");
  return parts.length > 1 ? parts.slice(1).join(":") : component;
}

// Read code snippet from file (with path containment check)
function getCodeSnippet(filePath, line, contextLines = 2) {
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
      snippetLines.push(`${marker} ${String(lineNum).padStart(4, " ")} | ${lines[i]}`);
    }

    return { found: true, snippet: snippetLines.join("\n") };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { found: false, snippet: `[Error reading file: ${message}]` };
  }
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

// Sort files by issue count
const sortedFiles = Object.entries(byFile).sort((a, b) => b[1].length - a[1].length);

// Generate the report
let report = `# SonarCloud Issues - Detailed Report with Code Snippets

**Generated**: ${new Date().toISOString().split("T")[0]}
**Project**: ${data.projectKey || "jasonmichaelbell78-creator_sonash-v0"}
**Total Issues**: ${allIssues.length}

---

## Summary by Severity

| Severity | Count |
|----------|-------|
`;

const severityOrder = ["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "INFO"];
for (const sev of severityOrder) {
  const count = bySeverity[sev]?.length || 0;
  if (count > 0) {
    report += `| ${sev} | ${count} |\n`;
  }
}

report += `
---

## Quick Reference: Rule Descriptions

| Rule | Description | Count |
|------|-------------|-------|
`;

// Group by rule for summary
const byRule = {};
for (const issue of allIssues) {
  const rule = issue.rule;
  if (!byRule[rule]) {
    byRule[rule] = { count: 0, message: issue.message, severity: issue.severity };
  }
  byRule[rule].count++;
}

const sortedRules = Object.entries(byRule).sort((a, b) => b[1].count - a[1].count);

for (const [rule, info] of sortedRules) {
  report += `| \`${rule}\` | ${info.message.substring(0, 60)}${info.message.length > 60 ? "..." : ""} | ${info.count} |\n`;
}

report += `
---

## All Issues by File (with Code Snippets)

`;

// Generate detailed issues by file
for (const [filePath, issues] of sortedFiles) {
  // Sort issues by line number within each file
  issues.sort((a, b) => (a.line || 0) - (b.line || 0));

  report += `### 📁 \`${filePath}\` (${issues.length} issues)\n\n`;

  for (const issue of issues) {
    const line = issue.line || "N/A";
    const severity = issue.severity || "UNKNOWN";
    const rule = issue.rule || "unknown";
    const message = issue.message || "No message";

    // Severity emoji
    const sevEmoji =
      {
        BLOCKER: "🔴",
        CRITICAL: "🟠",
        MAJOR: "🟡",
        MINOR: "🔵",
        INFO: "⚪",
      }[severity] || "⚫";

    report += `#### ${sevEmoji} Line ${line}: ${message}\n`;
    report += `- **Rule**: \`${rule}\`\n`;
    report += `- **Severity**: ${severity}\n`;
    report += `- **Effort**: ${issue.effort || "Unknown"}\n`;

    if (issue.line) {
      const { found, snippet } = getCodeSnippet(filePath, issue.line);
      report += `\n\`\`\`${filePath.split(".").pop() || "text"}\n${snippet}\n\`\`\`\n`;
    }

    report += "\n---\n\n";
  }
}

// Write the report (ensure directory exists and handle errors gracefully)
try {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, report);
  console.log(`Report written to: ${OUTPUT_FILE}`);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Error: Failed to write report to ${OUTPUT_FILE}: ${message}`);
  process.exit(1);
}
console.log(`Total issues documented: ${allIssues.length}`);
console.log(`Files with issues: ${sortedFiles.length}`);
