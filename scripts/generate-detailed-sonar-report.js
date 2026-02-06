#!/usr/bin/env node
/* global __dirname */

/**
 * Generate a comprehensive SonarCloud issues report with code snippets
 * Fetches fresh data from SonarCloud API and reads local source files for snippets
 *
 * Usage: node scripts/generate-detailed-sonar-report.js
 *
 * Configuration (in priority order):
 *   1. Environment variables: SONAR_TOKEN, SONAR_ORG, SONAR_PROJECT
 *   2. sonar-project.properties: sonar.organization, sonar.projectKey
 *   3. .env.local: SONAR_TOKEN
 */

const fs = require("fs");
const path = require("path");

// Try to load dotenv if available
try {
  require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
} catch {
  // dotenv not available, use environment variables directly
}

const PROJECT_ROOT = path.join(__dirname, "..");
const OUTPUT_FILE = path.join(PROJECT_ROOT, "docs/audits/sonarcloud-issues-detailed.md");
const SONARCLOUD_API = "https://sonarcloud.io/api";

// Validate that a file path stays within PROJECT_ROOT (prevents path traversal)
function resolveProjectPath(relativeFilePath) {
  if (relativeFilePath.includes("\0")) {
    throw new Error("Refusing to read path with null byte");
  }
  const abs = path.resolve(PROJECT_ROOT, relativeFilePath);
  const rel = path.relative(PROJECT_ROOT, abs);
  // Reject: project root itself, any ".." escape, or absolute rel (Windows drives)
  if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
    throw new Error(`Refusing to read outside project root: ${relativeFilePath}`);
  }
  return abs;
}

// Read defaults from sonar-project.properties if available
function readSonarProperties() {
  const propsFile = path.join(PROJECT_ROOT, "sonar-project.properties");
  const result = { org: null, project: null };
  try {
    const content = fs.readFileSync(propsFile, "utf8");
    // First pass: collect all key=value pairs (order-independent)
    const props = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...rest] = trimmed.split("=");
      props[key.trim()] = rest.join("=").trim();
    }
    // Extract org and derive project from projectKey
    result.org = props["sonar.organization"] || null;
    const projectKey = props["sonar.projectKey"];
    if (projectKey && result.org && projectKey.startsWith(result.org + "_")) {
      // projectKey format: "org_project" — extract project suffix
      result.project = projectKey.substring(result.org.length + 1);
    } else if (projectKey) {
      result.project = projectKey;
    }
  } catch {
    // sonar-project.properties not found or unreadable
  }
  return result;
}

// Fetch issues from SonarCloud API (with pagination)
async function fetchSonarCloudIssues(token, componentKey) {
  console.log(`  Fetching issues from SonarCloud API...`);
  console.log(`  Project: ${componentKey}`);

  const allIssues = [];
  const pageSize = 500;
  let page = 1;
  let total = null;

  while (total === null || allIssues.length < total) {
    const params = new URLSearchParams({
      componentKeys: componentKey,
      ps: String(pageSize),
      p: String(page),
      resolved: "false",
    });

    const url = `${SONARCLOUD_API}/issues/search?${params}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Authorization: `Basic ${Buffer.from(`${token}:`).toString("base64")}`,
      },
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const rawError = await response.text();
      const sanitizedError = rawError.substring(0, 200).replace(/token|key|secret/gi, "[REDACTED]");
      throw new Error(`SonarCloud API error (${response.status}): ${sanitizedError}`);
    }

    const data = await response.json();
    const nextTotal = Number(data.total);
    total = Number.isFinite(nextTotal) ? nextTotal : allIssues.length;
    allIssues.push(...(data.issues || []));

    if (!data.issues || data.issues.length === 0) break;
    if (page === 1) {
      console.log(`  Total issues: ${total}`);
    }
    page++;

    // Safety limit (SonarCloud max is 10,000)
    if (page > 20) {
      console.warn(`  Warning: Pagination limit reached (${allIssues.length} of ${total} fetched)`);
      break;
    }
  }

  console.log(`  Fetched ${allIssues.length} issues`);
  return allIssues;
}

// Fetch security hotspots from SonarCloud API (with pagination)
async function fetchSonarCloudHotspots(token, componentKey) {
  console.log(`  Fetching security hotspots from SonarCloud API...`);

  const allHotspots = [];
  const pageSize = 500;
  let page = 1;
  let total = null;

  while (total === null || allHotspots.length < total) {
    const params = new URLSearchParams({
      projectKey: componentKey,
      ps: String(pageSize),
      p: String(page),
    });

    const url = `${SONARCLOUD_API}/hotspots/search?${params}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Authorization: `Basic ${Buffer.from(`${token}:`).toString("base64")}`,
      },
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const rawError = await response.text();
      const sanitizedError = rawError.substring(0, 200).replace(/token|key|secret/gi, "[REDACTED]");
      throw new Error(`SonarCloud API error (${response.status}): ${sanitizedError}`);
    }

    const data = await response.json();
    const nextTotal = Number(data.paging?.total);
    const pageItems = data.hotspots || [];
    total = Number.isFinite(nextTotal) ? nextTotal : allHotspots.length + pageItems.length;
    allHotspots.push(...pageItems);

    if (!pageItems || pageItems.length === 0) break;
    if (page === 1) {
      console.log(`  Total hotspots: ${total}`);
    }
    page++;

    if (page > 20) {
      console.warn(
        `  Warning: Hotspot pagination limit reached (${allHotspots.length} of ${total} fetched)`
      );
      break;
    }
  }

  console.log(`  Fetched ${allHotspots.length} hotspots`);
  return allHotspots;
}

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
  let resolved;
  try {
    resolved = resolveProjectPath(filePath);
  } catch (err) {
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

// Main function
async function main() {
  // Get configuration
  const sonarProps = readSonarProperties();
  const token = process.env.SONAR_TOKEN;
  const org = process.env.SONAR_ORG || sonarProps.org;
  const project = process.env.SONAR_PROJECT || sonarProps.project || "sonash";

  if (!token) {
    console.error("Error: SONAR_TOKEN environment variable is required");
    console.error("  Set it in .env.local or export SONAR_TOKEN=your_token");
    process.exit(1);
  }

  if (!org) {
    console.error("Error: SonarCloud organization is required");
    console.error("  Use SONAR_ORG env var or configure sonar-project.properties");
    process.exit(1);
  }

  const componentKey = project.startsWith(`${org}_`) ? project : `${org}_${project}`;
  console.log(`\nGenerating SonarCloud detailed report for ${componentKey}...\n`);

  // Fetch fresh data from SonarCloud API
  const allIssues = await fetchSonarCloudIssues(token, componentKey);
  const hotspots = await fetchSonarCloudHotspots(token, componentKey);

  console.log(`\nLoaded ${allIssues.length} issues`);
  console.log(`Loaded ${hotspots.length} security hotspots`);

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
      byRule[rule] = {
        count: 0,
        message: typeof issue.message === "string" ? issue.message : "No message",
        severity: issue.severity,
        type: issue.type,
      };
    }
    byRule[rule].count++;
  }
  const sortedRules = Object.entries(byRule).sort((a, b) => b[1].count - a[1].count);

  // Generate the report
  const generatedDate = new Date().toISOString().split("T")[0];
  let report = `# SonarCloud Issues - Detailed Report with Code Snippets

**Generated**: ${generatedDate}
**Project**: ${componentKey}
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
    const shortMsg =
      info.message.length > 50 ? info.message.substring(0, 50) + "..." : info.message;
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
        const { snippet } = getCodeSnippet(filePath, issue.line, issue.textRange);
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
          const { snippet } = getCodeSnippet(filePath, hotspot.line);
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
        const { snippet } = getCodeSnippet(filePath, issue.line, issue.textRange);
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
}

main().catch((err) => {
  console.error("Fatal error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
