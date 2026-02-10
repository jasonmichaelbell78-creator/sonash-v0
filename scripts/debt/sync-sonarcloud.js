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
 *   --resolve           Detect and mark RESOLVED items no longer in SonarCloud
 *   --full              Sync new items AND resolve old items in one pass
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

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const readline = require("node:readline");
const os = require("node:os");

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
const RESOLUTION_LOG = path.join(LOG_DIR, "resolution-log.jsonl");

const SONARCLOUD_API = "https://sonarcloud.io/api";

// Get pseudonymous operator identifier for audit logs.
// In CI: "ci". Otherwise: SHA-256 hash prefix of local username (12 chars).
// Set LOG_OPERATOR_PII=true to log raw username instead.
function getOperatorId() {
  let raw;
  try {
    raw = os.userInfo().username || process.env.USER || process.env.USERNAME || "unknown";
  } catch {
    raw = process.env.USER || process.env.USERNAME || "unknown";
  }
  if (process.env.CI) return "ci";
  if (process.env.LOG_OPERATOR_PII === "true") return raw;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 12);
}

// Read defaults from sonar-project.properties if available
function readSonarProperties() {
  const propsFile = path.join(__dirname, "../../sonar-project.properties");
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
    // sonar-project.properties not found or unreadable, use other defaults
  }
  return result;
}

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
    } else if (arg === "--resolve") {
      parsed.resolve = true;
    } else if (arg === "--full") {
      parsed.full = true;
    } else if (arg.startsWith("--")) {
      const key = arg.substring(2);
      const value = args[i + 1];
      if (value && !value.startsWith("--")) {
        parsed[key] = args[++i];
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
        const num = Number.parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    }
  }
  return maxId + 1;
}

// Load existing items from MASTER_DEBT.jsonl with safe parsing
function loadMasterDebt() {
  if (!fs.existsSync(MASTER_FILE)) {
    return [];
  }

  let content;
  try {
    content = fs.readFileSync(MASTER_FILE, "utf8");
  } catch (err) {
    console.error(
      `⚠️ Warning: Could not read ${MASTER_FILE}: ${err instanceof Error ? err.message : String(err)}`
    );
    return [];
  }
  const lines = content.split("\n").filter((line) => line.trim());

  const items = [];
  const badLines = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      items.push(JSON.parse(lines[i]));
    } catch (err) {
      badLines.push({ line: i + 1, message: err instanceof Error ? err.message : String(err) });
    }
  }

  if (badLines.length > 0) {
    console.error(`⚠️ Warning: ${badLines.length} invalid JSON line(s) in ${MASTER_FILE}`);
    for (const b of badLines.slice(0, 5)) {
      console.error(`   Line ${b.line}: ${b.message}`);
    }
    if (badLines.length > 5) {
      console.error(`   ... and ${badLines.length - 5} more`);
    }
  }

  return items;
}

// Log intake activity with actor context
function logIntake(activity) {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  const logEntry = {
    timestamp: new Date().toISOString(),
    actor: process.env.USER || process.env.USERNAME || "system",
    actor_type: "cli-script",
    outcome: activity.error ? "failure" : "success",
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

// Fetch issues from SonarCloud API (with pagination)
async function fetchSonarCloudIssues(options) {
  const { token, org, project, severities, types, statuses } = options;

  console.log(`  📡 Fetching from SonarCloud API...`);
  console.log(`     Project: ${org}_${project}`);

  const allIssues = [];
  const pageSize = 500;
  let page = 1;
  let total = null;

  while (total === null || allIssues.length < total) {
    const params = new URLSearchParams({
      componentKeys: `${org}_${project}`,
      ps: String(pageSize),
      p: String(page),
      resolved: "false",
    });

    if (severities) params.append("severities", severities);
    if (types) params.append("types", types);
    if (statuses) params.append("statuses", statuses);

    const url = `${SONARCLOUD_API}/issues/search?${params}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(token + ":").toString("base64")}`,
      },
    });

    if (!response.ok) {
      // Sanitize error text to avoid exposing sensitive API details
      const rawError = await response.text();
      const sanitizedError = rawError.substring(0, 200).replace(/token|key|secret/gi, "[REDACTED]");
      throw new Error(`SonarCloud API error (${response.status}): ${sanitizedError}`);
    }

    const data = await response.json();
    total = data.total;

    allIssues.push(...(data.issues || []));

    if (!data.issues || data.issues.length === 0) break;

    if (page === 1) {
      console.log(`     Total issues: ${total}`);
    }
    page++;

    // Safety limit to prevent infinite loops (SonarCloud max is 10,000)
    if (page > 20) {
      console.warn(`     ⚠️ Pagination limit reached (${allIssues.length} of ${total} fetched)`);
      break;
    }
  }

  console.log(`     Fetched ${allIssues.length} issues total`);

  return allIssues;
}

// Sanitize string for safe storage (prevent injection, limit length)
function sanitizeString(str, maxLength = 500) {
  if (typeof str !== "string") return "";
  // Validate maxLength is a safe positive number
  const safeMaxLength = Number.isFinite(maxLength) ? Math.max(0, Math.floor(maxLength)) : 500;
  // Remove control characters (ASCII 0-31) and DEL (0x7F) using character class
  return (
    str
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .substring(0, safeMaxLength)
      .trim()
  );
}

// Convert SonarCloud issue to TDMS format with input validation
function convertIssue(issue) {
  // Validate issue has required fields
  if (!issue || typeof issue !== "object") {
    throw new Error("Invalid issue object from SonarCloud");
  }

  const key = sanitizeString(issue.key, 100);
  if (!key) {
    throw new Error("Issue missing required 'key' field");
  }

  return {
    source_id: `sonarcloud:${key}`,
    source_file: "sonarcloud-sync",
    category: mapCategory(issue),
    severity: SEVERITY_MAP[issue.severity] || "S2",
    type: TYPE_MAP[issue.type] || "code-smell",
    file: sanitizeString(normalizeFilePath(issue.component), 500),
    line: Number.isFinite(issue.line) ? issue.line : 0,
    title: sanitizeString(issue.message, 500) || "Untitled",
    description: sanitizeString(`Rule: ${issue.rule || "unknown"}. ${issue.message || ""}`, 1000),
    recommendation: "",
    effort: "E0", // SonarCloud provides effort, could map this
    status: "NEW",
    roadmap_ref: null,
    created: new Date().toISOString().split("T")[0],
    verified_by: null,
    resolution: null,
    rule: sanitizeString(issue.rule, 100),
    sonar_key: key,
  };
}

// Log resolution activity (non-fatal - logging failure should not crash script)
function logResolution(activity) {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    const logEntry = {
      timestamp: new Date().toISOString(),
      actor: process.env.USER || process.env.USERNAME || "system",
      actor_type: "cli-script",
      outcome: activity.error ? "failure" : "success",
      ...activity,
    };
    fs.appendFileSync(RESOLUTION_LOG, JSON.stringify(logEntry) + "\n");
  } catch (err) {
    console.warn(
      `  ⚠️ Failed to write resolution log: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// Resolve items no longer present in SonarCloud
async function resolveStaleItems(options) {
  const { token, org, project, dryRun, force } = options;

  console.log("🔍 Resolve: Checking for stale SonarCloud items...\n");

  // Fetch all open issues from SonarCloud
  let activeIssues;
  try {
    activeIssues = await fetchSonarCloudIssues({
      token,
      org,
      project,
      statuses: "OPEN,CONFIRMED,REOPENED",
    });
  } catch (err) {
    console.error(
      `Error fetching from SonarCloud: ${err instanceof Error ? err.message : String(err)}`
    );
    return { resolved: 0 };
  }

  const activeKeys = new Set(activeIssues.map((issue) => issue.key));
  console.log(`  📡 Active SonarCloud issues: ${activeKeys.size}`);

  // Load existing items
  const existingItems = loadMasterDebt();
  const sonarItems = existingItems.filter(
    (item) => item.source_file === "sonarcloud-sync" && item.status === "NEW" && item.sonar_key
  );

  console.log(`  📋 Tracked SonarCloud items (NEW status): ${sonarItems.length}`);

  // Find items whose sonar_key is no longer active
  const staleItems = sonarItems.filter((item) => !activeKeys.has(item.sonar_key));

  console.log(`\n📊 Resolution Results:\n`);
  console.log(`  ✅ Still active in SonarCloud: ${sonarItems.length - staleItems.length}`);
  console.log(`  🗑️  No longer in SonarCloud:   ${staleItems.length}`);

  if (staleItems.length === 0) {
    console.log("\n✅ No stale items found. Nothing to resolve.");
    logResolution({
      action: "resolve-sonarcloud-stale",
      project: `${org}_${project}`,
      items_checked: sonarItems.length,
      items_resolved: 0,
      operator: getOperatorId(),
    });
    return { resolved: 0 };
  }

  // Show sample of stale items
  console.log("\n  Stale items (will be marked RESOLVED):");
  for (const item of staleItems.slice(0, 5)) {
    const title = typeof item.title === "string" ? item.title : "(no title)";
    const preview = title.length > 50 ? `${title.slice(0, 50)}...` : title;
    console.log(`    - ${item.id}: ${preview}`);
  }
  if (staleItems.length > 5) {
    console.log(`    ... and ${staleItems.length - 5} more items`);
  }

  if (dryRun) {
    console.log("\n🔍 DRY RUN: No changes written.");
    return { resolved: 0 };
  }

  if (!force) {
    const confirmed = await confirm(`\nMark ${staleItems.length} items as RESOLVED?`);
    if (!confirmed) {
      console.log("Cancelled.");
      return { resolved: 0 };
    }
  }

  // Update items in MASTER_DEBT.jsonl
  const staleIds = new Set(staleItems.map((item) => item.id));
  const today = new Date().toISOString().split("T")[0];
  let resolvedCount = 0;

  const updatedLines = existingItems.map((item) => {
    if (staleIds.has(item.id)) {
      item.status = "RESOLVED";
      item.resolution = "Fixed in SonarCloud (no longer reported)";
      item.resolved_date = today;
      resolvedCount++;
    }
    return JSON.stringify(item);
  });

  console.log("\n📝 Updating MASTER_DEBT.jsonl...");
  const updatedContent = updatedLines.join("\n") + "\n";
  const tmpMaster = `${MASTER_FILE}.tmp`;
  fs.writeFileSync(tmpMaster, updatedContent);
  fs.renameSync(tmpMaster, MASTER_FILE);

  // Also update raw/deduped.jsonl to stay in sync
  const DEDUPED_FILE = path.join(DEBT_DIR, "raw/deduped.jsonl");
  fs.mkdirSync(path.dirname(DEDUPED_FILE), { recursive: true });
  console.log("📝 Updating raw/deduped.jsonl...");
  const tmpDeduped = `${DEDUPED_FILE}.tmp`;
  fs.writeFileSync(tmpDeduped, updatedContent);
  try {
    fs.renameSync(tmpDeduped, DEDUPED_FILE);
  } catch {
    // Windows may fail rename if dest exists; fallback to rm + rename
    try {
      fs.rmSync(DEDUPED_FILE, { force: true });
      fs.renameSync(tmpDeduped, DEDUPED_FILE);
    } catch (fallbackErr) {
      try {
        fs.unlinkSync(tmpDeduped);
      } catch {
        // ignore cleanup errors
      }
      throw fallbackErr;
    }
  }

  // Log resolutions
  logResolution({
    action: "resolve-sonarcloud-stale",
    project: `${org}_${project}`,
    items_checked: sonarItems.length,
    items_resolved: resolvedCount,
    first_id: staleItems[0]?.id,
    last_id: staleItems[staleItems.length - 1]?.id,
    operator: getOperatorId(),
  });

  console.log(`\n✅ Resolved ${resolvedCount} stale items.`);
  return { resolved: resolvedCount };
}

// Resolve configuration from CLI args, env vars, and sonar-project.properties
function resolveConfig(parsed) {
  const sonarProps = readSonarProperties();
  const token = process.env.SONAR_TOKEN;
  const org = parsed.org || process.env.SONAR_ORG || sonarProps.org;

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

  const projectInput =
    parsed.project || process.env.SONAR_PROJECT || sonarProps.project || "sonash";
  const project = projectInput.startsWith(`${org}_`)
    ? projectInput.slice(org.length + 1)
    : projectInput;

  return { token, org, project };
}

// Regenerate views (shared helper)
function regenerateViews(label = "") {
  console.log(`🔄 Regenerating views${label}...`);
  try {
    execFileSync(process.execPath, [path.join(__dirname, "generate-views.js")], {
      stdio: "inherit",
    });
  } catch {
    console.warn(
      "  ⚠️ Failed to regenerate views. Run manually: node scripts/debt/generate-views.js"
    );
  }
}

// Deduplicate fetched issues against existing items, assign IDs
function deduplicateAndAssignIds(issues, existingItems) {
  const existingSonarKeys = new Set(
    existingItems.filter((item) => item.sonar_key).map((item) => item.sonar_key)
  );
  const existingHashes = new Set(existingItems.map((item) => item.content_hash));

  const newItems = [];
  const alreadyTracked = [];
  const contentDuplicates = [];
  let nextId = getNextDebtId(existingItems);

  for (const issue of issues) {
    if (existingSonarKeys.has(issue.key)) {
      alreadyTracked.push(issue.key);
      continue;
    }

    const converted = convertIssue(issue);
    converted.content_hash = generateContentHash(converted);

    if (existingHashes.has(converted.content_hash)) {
      contentDuplicates.push((converted.title || "").substring(0, 40));
      continue;
    }

    converted.id = `DEBT-${String(nextId).padStart(4, "0")}`;
    nextId++;
    newItems.push(converted);
    existingHashes.add(converted.content_hash);
  }

  return { newItems, alreadyTracked, contentDuplicates };
}

// Write new items to both deduped and master files
function writeNewItems(newItems) {
  const DEDUPED_FILE = path.join(DEBT_DIR, "raw/deduped.jsonl");
  console.log("\n📝 Writing new items to raw/deduped.jsonl...");
  const newLinesStr = newItems.map((item) => JSON.stringify(item)).join("\n") + "\n";
  fs.mkdirSync(path.dirname(DEDUPED_FILE), { recursive: true });

  // Capture file size before appending for efficient rollback
  let dedupedSizeBeforeAppend = 0;
  try {
    const stats = fs.statSync(DEDUPED_FILE);
    dedupedSizeBeforeAppend = stats.size;
  } catch {
    // File doesn't exist yet, size = 0
  }

  try {
    fs.appendFileSync(DEDUPED_FILE, newLinesStr);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to write to deduped.jsonl: ${msg}`);
    process.exit(1);
  }

  console.log("📝 Writing new items to MASTER_DEBT.jsonl...");
  try {
    fs.appendFileSync(MASTER_FILE, newLinesStr);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to write to MASTER_DEBT.jsonl: ${msg}`);
    try {
      fs.truncateSync(DEDUPED_FILE, dedupedSizeBeforeAppend);
      console.warn("  ⚠️ Rolled back deduped.jsonl to maintain consistency");
    } catch {
      // best-effort rollback only
    }
    process.exit(1);
  }
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
  --resolve           Detect and mark RESOLVED items no longer in SonarCloud
  --full              Sync new items AND resolve old items in one pass
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
  const { token, org, project } = resolveConfig(parsed);

  const resolveOnly = parsed.resolve && !parsed.full;
  const doResolve = parsed.resolve || parsed.full;

  // Handle resolve-only mode
  if (resolveOnly) {
    const result = await resolveStaleItems({
      token,
      org,
      project,
      dryRun: parsed.dryRun,
      force: parsed.force,
    });
    if (result.resolved > 0 && !parsed.dryRun) regenerateViews();
    process.exit(0);
  }

  console.log("🔄 Sync: Fetching from SonarCloud...\n");

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
    console.error(
      `Error fetching from SonarCloud: ${err instanceof Error ? err.message : String(err)}`
    );
    process.exit(1);
  }

  if (issues.length === 0) {
    console.log("  ✅ No issues found matching criteria. Nothing to sync.");
    process.exit(0);
  }

  const existingItems = loadMasterDebt();
  const { newItems, alreadyTracked, contentDuplicates } = deduplicateAndAssignIds(
    issues,
    existingItems
  );

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

  if (!parsed.force) {
    const confirmed = await confirm(`\nAdd ${newItems.length} new items to MASTER_DEBT.jsonl?`);
    if (!confirmed) {
      console.log("Cancelled.");
      process.exit(0);
    }
  }

  writeNewItems(newItems);

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

  regenerateViews();

  console.log("\n✅ Sync complete!");
  console.log(
    `  📈 Added ${newItems.length} new items (${newItems[0]?.id} - ${newItems[newItems.length - 1]?.id})`
  );
  console.log(`  📊 New MASTER_DEBT.jsonl total: ${existingItems.length + newItems.length} items`);

  // Handle --full mode: also resolve stale items
  if (doResolve) {
    console.log("\n" + "═".repeat(60));
    const result = await resolveStaleItems({
      token,
      org,
      project,
      dryRun: parsed.dryRun,
      force: parsed.force,
    });
    if (result.resolved > 0 && !parsed.dryRun) regenerateViews(" (post-resolve)");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
