#!/usr/bin/env node
/* global __dirname */
/**
 * Extract SonarCloud issues to TDMS raw format
 *
 * Reads: docs/analysis/sonarqube-all-issues-complete.json
 * Outputs: docs/technical-debt/raw/sonarcloud.jsonl
 *
 * Transforms SonarCloud format to normalized debt schema
 */

const fs = require("fs");
const path = require("path");

const INPUT_FILE = path.join(__dirname, "../../docs/analysis/sonarqube-all-issues-complete.json");
const OUTPUT_FILE = path.join(__dirname, "../../docs/technical-debt/raw/sonarcloud.jsonl");

// SonarCloud severity -> TDMS severity mapping
const SEVERITY_MAP = {
  BLOCKER: "S0",
  CRITICAL: "S1",
  MAJOR: "S2",
  MINOR: "S3",
  INFO: "S3",
};

// SonarCloud type -> TDMS type mapping
const TYPE_MAP = {
  BUG: "bug",
  CODE_SMELL: "code-smell",
  VULNERABILITY: "vulnerability",
  SECURITY_HOTSPOT: "hotspot",
};

// SonarCloud softwareQuality -> TDMS category mapping
const CATEGORY_MAP = {
  SECURITY: "security",
  RELIABILITY: "code-quality",
  MAINTAINABILITY: "code-quality",
};

// Effort string -> E-scale mapping (5min = E0, 1h = E1, 4h = E2, 8h+ = E3)
function parseEffort(effortStr) {
  if (!effortStr) return "E1";
  const match = effortStr.match(/(\d+)(min|h|d)/);
  if (!match) return "E1";

  const value = parseInt(match[1], 10);
  const unit = match[2];

  let minutes = value;
  if (unit === "h") minutes = value * 60;
  if (unit === "d") minutes = value * 480;

  if (minutes <= 15) return "E0";
  if (minutes <= 60) return "E1";
  if (minutes <= 240) return "E2";
  return "E3";
}

// Extract file path from SonarCloud component string
function extractFilePath(component) {
  if (!component) return "";
  // Format: "org_repo:path/to/file.ts"
  const colonIndex = component.indexOf(":");
  if (colonIndex === -1) return component;
  return component.substring(colonIndex + 1);
}

// Determine category from impacts array
function getCategoryFromImpacts(impacts) {
  if (!impacts || impacts.length === 0) return "code-quality";

  for (const impact of impacts) {
    if (impact.softwareQuality === "SECURITY") return "security";
    if (impact.softwareQuality === "RELIABILITY") return "code-quality";
  }
  return "code-quality";
}

// Determine severity from impacts array (prefer impact severity over issue severity)
function getSeverityFromImpacts(impacts, issueSeverity) {
  if (!impacts || impacts.length === 0) {
    return SEVERITY_MAP[issueSeverity] || "S2";
  }

  // Map impact severity
  const impactSeverityMap = {
    BLOCKER: "S0",
    HIGH: "S1",
    MEDIUM: "S2",
    LOW: "S3",
  };

  // Find highest severity from impacts
  let highestSeverity = "S3";
  const severityRank = { S0: 0, S1: 1, S2: 2, S3: 3 };

  for (const impact of impacts) {
    const mappedSev = impactSeverityMap[impact.severity] || "S2";
    if (severityRank[mappedSev] < severityRank[highestSeverity]) {
      highestSeverity = mappedSev;
    }
  }

  return highestSeverity;
}

function processIssue(issue, sourceCategory) {
  const filePath = extractFilePath(issue.component);
  const severity = getSeverityFromImpacts(issue.impacts, issue.severity);
  const category = getCategoryFromImpacts(issue.impacts);

  return {
    source_id: `sonarcloud:${issue.key}`,
    source_file: "docs/analysis/sonarqube-all-issues-complete.json",
    source_category: sourceCategory,
    category: category,
    severity: severity,
    type: TYPE_MAP[issue.type] || "code-smell",
    file: filePath,
    line: issue.line || 0,
    title: issue.message || "Untitled issue",
    description: `Rule: ${issue.rule}. ${issue.message || ""}`,
    effort: parseEffort(issue.effort || issue.debt),
    rule: issue.rule,
    sonar_key: issue.key,
    status: "NEW",
    roadmap_ref: null,
    created: new Date().toISOString().split("T")[0],
    verified_by: null,
    resolution: null,
  };
}

function main() {
  console.log("🔍 Extracting SonarCloud issues...\n");

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(INPUT_FILE, "utf8");
  const data = JSON.parse(rawData);

  const items = [];

  // Process reliability issues
  if (data.issues?.reliability) {
    console.log(`  📊 Processing ${data.issues.reliability.length} reliability issues...`);
    for (const issue of data.issues.reliability) {
      items.push(processIssue(issue, "reliability"));
    }
  }

  // Process maintainability issues
  if (data.issues?.maintainability) {
    console.log(`  📊 Processing ${data.issues.maintainability.length} maintainability issues...`);
    for (const issue of data.issues.maintainability) {
      items.push(processIssue(issue, "maintainability"));
    }
  }

  // Process security issues
  if (data.issues?.security) {
    console.log(`  📊 Processing ${data.issues.security.length} security issues...`);
    for (const issue of data.issues.security) {
      items.push(processIssue(issue, "security"));
    }
  }

  // Process security hotspots if present
  if (data.issues?.securityHotspots) {
    console.log(`  📊 Processing ${data.issues.securityHotspots.length} security hotspots...`);
    for (const issue of data.issues.securityHotspots) {
      const item = processIssue(issue, "security");
      item.type = "hotspot";
      items.push(item);
    }
  }

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write JSONL output
  const lines = items.map((item) => JSON.stringify(item));
  fs.writeFileSync(OUTPUT_FILE, lines.join("\n") + "\n");

  console.log(`\n✅ Extracted ${items.length} items to ${OUTPUT_FILE}`);

  // Summary by severity
  const bySeverity = {};
  for (const item of items) {
    bySeverity[item.severity] = (bySeverity[item.severity] || 0) + 1;
  }
  console.log("\n📈 Summary by severity:");
  for (const sev of ["S0", "S1", "S2", "S3"]) {
    if (bySeverity[sev]) {
      console.log(`   ${sev}: ${bySeverity[sev]}`);
    }
  }
}

main();
