#!/usr/bin/env node
/* global __dirname */
/**
 * Sync technical debt from SonarCloud
 *
 * Usage: node scripts/debt/sync-sonarcloud.js [options]
 *
 * Options:
 *   --project <key>     SonarCloud project key (default: from env or sonash)
 *   --org <name>        SonarCloud organization (default: from env)
 *   --severity <list>   Filter by severity (comma-separated: BLOCKER,CRITICAL,MAJOR,MINOR,INFO)
 *   --type <list>       Filter by type (comma-separated: BUG,VULNERABILITY,CODE_SMELL)
 *   --status <list>     Filter by status (default: OPEN,CONFIRMED,REOPENED)
 *   --dry-run           Preview changes without writing
 *   --force             Skip confirmation prompt
 *
 * Environment variables:
 *   SONAR_TOKEN         SonarCloud API token (required)
 *   SONAR_ORG           SonarCloud organization
 *   SONAR_PROJECT       SonarCloud project key
 *
 * Example:
 *   node scripts/debt/sync-sonarcloud.js --dry-run
 *   node scripts/debt/sync-sonarcloud.js --severity BLOCKER,CRITICAL --force
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");
const readline = require("readline");

// Try to load dotenv if available
try {
  require("dotenv").config({ path: path.join(__dirname, "../../.env.local") });
} catch {
  // dotenv not available, use environment variables directly
}

const DEBT_DIR = path.join(__dirname, "../../docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const LOG_DIR = path.join(DEBT_DIR, "logs");
const LOG_FILE = path.join(LOG_DIR, "intake-log.jsonl");

const SONARCLOUD_API = "https://sonarcloud.io/api";

// Severity mapping from SonarCloud to TDMS
const SEVERITY_MAP = {
  BLOCKER: "S0",
  CRITICAL: "S0",
  MAJOR: "S1",
  MINOR: "S2",
  INFO: "S3",
};

// Type mapping from SonarCloud to TDMS
const TYPE_MAP = {
  BUG: "bug",
  VULNERABILITY: "vulnerability",
  CODE_SMELL: "code-smell",
  SECURITY_HOTSPOT: "hotspot",
};

// Category mapping based on SonarCloud tags/rules
function mapCategory(issue) {
  const rule = issue.rule || "";
  const tags = issue.tags || [];

  if (tags.includes("security") || rule.includes("security")) return "security";
  if (tags.includes("performance") || rule.includes("performance")) return "performance";
  if (tags.includes("documentation")) return "documentation";
  return "code-quality";
}

// Parse command line arguments
function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--force") {
      parsed.force = true;
    } else if (arg.startsWith("--")) {
      const key = arg.substring(2);
      const value = args[i + 1];
      if (value && !value.startsWith("--")) {
        parsed[key] = value;
        i++;
      }
    }
  }
  return parsed;
}

// Generate content hash for deduplication
function generateContentHash(item) {
  const normalizedFile = (item.file || "").replace(/^\.\//, "").replace(/^\//, "").toLowerCase();
  const hashInput = [
    normalizedFile,
    item.line || 0,
    (item.title || "").toLowerCase().substring(0, 100),
    (item.description || "").toLowerCase().substring(0, 200),
  ].join("|");
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

// Normalize file path from SonarCloud format
function normalizeFilePath(component) {
  if (!component) return "";
  // SonarCloud uses format: org:project:path/to/file
  const parts = component.split(":");
  return parts[parts.length - 1] || "";
}

// Get next DEBT ID
function getNextDebtId(existingItems) {
  let maxId = 0;
  for (const item of existingItems) {
    if (item.id) {
      const match = item.id.match(/DEBT-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    }
  }
  return maxId + 1;
}

// Load existing items from MASTER_DEBT.jsonl
function loadMasterDebt() {
  if (!fs.existsSync(MASTER_FILE)) {
    return [];
  }
  const content = fs.readFileSync(MASTER_FILE, "utf8");
  const lines = content.split("\n").filter((line) => line.trim());
  return lines.map((line) => JSON.parse(line));
}

// Log intake activity
function logIntake(activity) {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...activity,
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + "\n");
}

// Prompt for confirmation
async function confirm(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

// Fetch issues from SonarCloud API
async function fetchSonarCloudIssues(options) {
  const { token, org, project, severities, types, statuses } = options;

  const params = new URLSearchParams({
    componentKeys: `${org}_${project}`,
    ps: "500", // Page size
    p: "1", // Page number
    resolved: "false",
  });

  if (severities) params.append("severities", severities);
  if (types) params.append("types", types);
  if (statuses) params.append("statuses", statuses);

  const url = `${SONARCLOUD_API}/issues/search?${params}`;

  console.log(`  📡 Fetching from SonarCloud API...`);
  console.log(`     Project: ${org}_${project}`);

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${token}:`).toString("base64")}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SonarCloud API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  console.log(`     Found ${data.total} issues (returning first ${data.issues.length})`);

  return data.issues;
}

// Convert SonarCloud issue to TDMS format
function convertIssue(issue) {
  return {
    source_id: `sonarcloud:${issue.key}`,
    source_file: "sonarcloud-sync",
    category: mapCategory(issue),
    severity: SEVERITY_MAP[issue.severity] || "S2",
    type: TYPE_MAP[issue.type] || "code-smell",
    file: normalizeFilePath(issue.component),
    line: issue.line || 0,
    title: issue.message?.substring(0, 500) || "Untitled",
    description: `Rule: ${issue.rule}. ${issue.message || ""}`,
    recommendation: "",
    effort: "E0", // SonarCloud provides effort, could map this
    status: "NEW",
    roadmap_ref: null,
    created: new Date().toISOString().split("T")[0],
    verified_by: null,
    resolution: null,
    rule: issue.rule,
    sonar_key: issue.key,
  };
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    console.log(`
Usage: node scripts/debt/sync-sonarcloud.js [options]

Options:
  --project <key>     SonarCloud project key (default: sonash)
  --org <name>        SonarCloud organization
  --severity <list>   Filter by severity (BLOCKER,CRITICAL,MAJOR,MINOR,INFO)
  --type <list>       Filter by type (BUG,VULNERABILITY,CODE_SMELL)
  --status <list>     Filter by status (default: OPEN,CONFIRMED,REOPENED)
  --dry-run           Preview changes without writing
  --force             Skip confirmation prompt

Environment variables:
  SONAR_TOKEN         SonarCloud API token (required)
  SONAR_ORG           SonarCloud organization
  SONAR_PROJECT       SonarCloud project key
`);
    process.exit(0);
  }

  const parsed = parseArgs(args);

  // Get configuration
  const token = process.env.SONAR_TOKEN;
  const org = parsed.org || process.env.SONAR_ORG;
  const project = parsed.project || process.env.SONAR_PROJECT || "sonash";

  if (!token) {
    console.error("Error: SONAR_TOKEN environment variable is required");
    console.error("  Set it in .env.local or export SONAR_TOKEN=your_token");
    process.exit(1);
  }

  if (!org) {
    console.error("Error: SonarCloud organization is required");
    console.error("  Use --org flag or set SONAR_ORG environment variable");
    process.exit(1);
  }

  console.log("🔄 Sync: Fetching from SonarCloud...\n");

  // Fetch issues from SonarCloud
  let issues;
  try {
    issues = await fetchSonarCloudIssues({
      token,
      org,
      project,
      severities: parsed.severity,
      types: parsed.type,
      statuses: parsed.status || "OPEN,CONFIRMED,REOPENED",
    });
  } catch (err) {
    console.error(`Error fetching from SonarCloud: ${err.message}`);
    process.exit(1);
  }

  if (issues.length === 0) {
    console.log("  ✅ No issues found matching criteria. Nothing to sync.");
    process.exit(0);
  }

  // Load existing items
  const existingItems = loadMasterDebt();
  const existingSonarKeys = new Set(
    existingItems.filter((item) => item.sonar_key).map((item) => item.sonar_key)
  );
  const existingHashes = new Set(existingItems.map((item) => item.content_hash));

  // Convert and check for duplicates
  const newItems = [];
  const alreadyTracked = [];
  const contentDuplicates = [];
  let nextId = getNextDebtId(existingItems);

  for (const issue of issues) {
    // Check if already tracked by SonarCloud key
    if (existingSonarKeys.has(issue.key)) {
      alreadyTracked.push(issue.key);
      continue;
    }

    const converted = convertIssue(issue);
    converted.content_hash = generateContentHash(converted);

    // Check for content duplicate
    if (existingHashes.has(converted.content_hash)) {
      contentDuplicates.push(converted.title.substring(0, 40));
      continue;
    }

    // Assign DEBT ID
    converted.id = `DEBT-${String(nextId).padStart(4, "0")}`;
    nextId++;

    newItems.push(converted);
    existingHashes.add(converted.content_hash);
  }

  // Report results
  console.log("\n📊 Sync Results:\n");
  console.log(`  📥 SonarCloud issues fetched: ${issues.length}`);
  console.log(`  ⏭️  Already tracked (by key):  ${alreadyTracked.length}`);
  console.log(`  ⏭️  Content duplicates:        ${contentDuplicates.length}`);
  console.log(`  ✅ New items to add:          ${newItems.length}`);

  if (newItems.length === 0) {
    console.log("\n✅ No new items to add. MASTER_DEBT.jsonl unchanged.");
    process.exit(0);
  }

  // Show sample of new items
  console.log("\n  Sample of new items:");
  for (const item of newItems.slice(0, 5)) {
    console.log(`    - ${item.id}: ${item.severity} ${item.title.substring(0, 50)}...`);
  }
  if (newItems.length > 5) {
    console.log(`    ... and ${newItems.length - 5} more items`);
  }

  if (parsed.dryRun) {
    console.log("\n🔍 DRY RUN: No changes written.");
    process.exit(0);
  }

  // Confirm before writing
  if (!parsed.force) {
    const confirmed = await confirm(`\nAdd ${newItems.length} new items to MASTER_DEBT.jsonl?`);
    if (!confirmed) {
      console.log("Cancelled.");
      process.exit(0);
    }
  }

  // Write to MASTER_DEBT.jsonl
  console.log("\n📝 Writing new items to MASTER_DEBT.jsonl...");
  const newLines = newItems.map((item) => JSON.stringify(item));
  fs.appendFileSync(MASTER_FILE, newLines.join("\n") + "\n");

  // Log intake activity
  logIntake({
    action: "sync-sonarcloud",
    project: `${org}_${project}`,
    items_fetched: issues.length,
    items_added: newItems.length,
    already_tracked: alreadyTracked.length,
    content_duplicates: contentDuplicates.length,
    first_id: newItems[0]?.id,
    last_id: newItems[newItems.length - 1]?.id,
  });

  // Regenerate views
  console.log("🔄 Regenerating views...");
  try {
    execSync("node scripts/debt/generate-views.js", { stdio: "inherit" });
  } catch {
    console.warn(
      "  ⚠️ Failed to regenerate views. Run manually: node scripts/debt/generate-views.js"
    );
  }

  // Summary
  console.log("\n✅ Sync complete!");
  console.log(
    `  📈 Added ${newItems.length} new items (${newItems[0]?.id} - ${newItems[newItems.length - 1]?.id})`
  );
  console.log(`  📊 New MASTER_DEBT.jsonl total: ${existingItems.length + newItems.length} items`);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
