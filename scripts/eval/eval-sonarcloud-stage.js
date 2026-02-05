#!/usr/bin/env node
/**
 * eval-sonarcloud-stage.js - Validate a single stage for SonarCloud evaluation
 *
 * Usage:
 *   node scripts/eval/eval-sonarcloud-stage.js <session-path> <stage> [options]
 *
 * Stages:
 *   E1 - API Fetch: Validates SonarCloud API connectivity and data retrieval
 *   E2 - Deduplication: Validates dedup logic accuracy
 *   E3 - Resolve Logic: Validates stale item resolution
 *   E4 - View Regeneration: Validates view files were updated
 *   E5 - Report Generation: Validates detailed report was created
 *   E6 - Schema Integrity: Validates MASTER_DEBT.jsonl structure
 *
 * Writes result to: <session-path>/eval/stage-results.jsonl (appends)
 */

/* global __dirname */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const DEBT_DIR = path.join(ROOT, "docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const VIEWS_DIR = path.join(DEBT_DIR, "views");
const LOGS_DIR = path.join(DEBT_DIR, "logs");
const REPORT_FILE = path.join(ROOT, "docs/audits/sonarcloud-issues-detailed.md");

/**
 * Validate that a user-provided path is contained within the project root.
 * Prevents path traversal attacks (CWE-22).
 */
function validateSessionPath(sessionPath) {
  const projectRoot = ROOT;
  const resolved = path.resolve(sessionPath);
  const relative = path.relative(projectRoot, resolved);
  if (relative === "" || /^\.\.(?:[\\/]|$)/.test(relative) || path.isAbsolute(relative)) {
    console.error(`Error: session path "${sessionPath}" resolves outside the project root.`);
    process.exit(1);
  }
  return resolved;
}

function loadSnapshot(sessionPath, mode) {
  const snapshotFile = path.join(sessionPath, "eval", `${mode}-snapshot.json`);
  if (!fs.existsSync(snapshotFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(snapshotFile, "utf8"));
  } catch {
    return null;
  }
}

function loadJsonlFile(filePath) {
  if (!fs.existsSync(filePath)) return { items: [], errors: 0 };
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return { items: [], errors: 1 };
  }
  const lines = content.split("\n").filter((l) => l.trim());
  const items = [];
  let errors = 0;
  for (const line of lines) {
    try {
      items.push(JSON.parse(line));
    } catch {
      errors++;
    }
  }
  return { items, errors };
}

function appendResult(sessionPath, result) {
  const evalDir = path.join(sessionPath, "eval");
  try {
    if (!fs.existsSync(evalDir)) {
      fs.mkdirSync(evalDir, { recursive: true });
    }
    const resultsFile = path.join(evalDir, "stage-results.jsonl");
    fs.appendFileSync(resultsFile, JSON.stringify(result) + "\n");
  } catch (err) {
    console.error(
      `Failed to write stage result: ${err instanceof Error ? err.message : String(err)}`
    );
    // Continue execution - result logging is non-critical
  }
}

function getLatestLogEntry(logFile, actionFilter) {
  if (!fs.existsSync(logFile)) return null;
  try {
    const content = fs.readFileSync(logFile, "utf8");
    const lines = content.split("\n").filter((l) => l.trim());
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        if (!actionFilter || entry.action === actionFilter) {
          return entry;
        }
      } catch {
        // Skip invalid lines
      }
    }
  } catch {
    return null;
  }
  return null;
}

// ────────────────────────────────────────────
// E1: API Fetch Validation
// ────────────────────────────────────────────
function checkE1(sessionPath) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  const preSnapshot = loadSnapshot(sessionPath, "pre");
  if (!preSnapshot) {
    return {
      stage: "E1",
      name: "API Fetch",
      passed: false,
      score: 0,
      issues: ["pre-snapshot.json not found - run pre-snapshot first"],
      recommendations: ["Run: node scripts/eval/eval-sonarcloud-snapshot.js pre <session>"],
      metadata: {},
    };
  }

  // Check intake log for sync operation
  const intakeLog = path.join(LOGS_DIR, "intake-log.jsonl");
  const syncEntry = getLatestLogEntry(intakeLog, "sync-sonarcloud");

  if (!syncEntry) {
    issues.push("No sync-sonarcloud entry found in intake-log.jsonl");
    score -= 50;
    recommendations.push("sync-sonarcloud.js may not have run or failed before logging");
  } else {
    // Check if fetch was successful
    if (syncEntry.outcome === "failure") {
      issues.push(`Sync failed: ${syncEntry.error || "unknown error"}`);
      score -= 40;
      recommendations.push("Check SONAR_TOKEN validity and API connectivity");
    }

    if (syncEntry.items_fetched === 0) {
      issues.push("API returned 0 items - project may have no issues or wrong project key");
      score -= 20;
      recommendations.push("Verify project key in sonar-project.properties matches SonarCloud");
    }

    // Check for API errors
    if (syncEntry.api_errors && syncEntry.api_errors > 0) {
      issues.push(`${syncEntry.api_errors} API errors during fetch`);
      score -= syncEntry.api_errors * 10;
    }
  }

  // Check MASTER_DEBT was modified
  const { items: currentItems } = loadJsonlFile(MASTER_FILE);
  const itemsAdded = currentItems.length - preSnapshot.master_debt.item_count;

  if (syncEntry && syncEntry.items_added !== undefined) {
    if (syncEntry.items_added !== itemsAdded) {
      issues.push(
        `Log claims ${syncEntry.items_added} items added but MASTER_DEBT shows ${itemsAdded} delta`
      );
      score -= 15;
    }
  }

  return {
    stage: "E1",
    name: "API Fetch",
    passed: score >= 70,
    score: Math.max(0, score),
    issues,
    recommendations,
    metadata: {
      sync_entry_found: !!syncEntry,
      items_fetched: syncEntry?.items_fetched || 0,
      items_added: syncEntry?.items_added || 0,
      already_tracked: syncEntry?.already_tracked || 0,
      content_duplicates: syncEntry?.content_duplicates || 0,
      outcome: syncEntry?.outcome || "not_found",
      pre_count: preSnapshot.master_debt.item_count,
      current_count: currentItems.length,
      delta: itemsAdded,
    },
  };
}

// ────────────────────────────────────────────
// E2: Deduplication Validation
// ────────────────────────────────────────────
function checkE2(sessionPath) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  const preSnapshot = loadSnapshot(sessionPath, "pre");

  // Check for duplicate content hashes in MASTER_DEBT
  const { items, errors } = loadJsonlFile(MASTER_FILE);

  if (errors > 0) {
    issues.push(`${errors} JSON parse errors in MASTER_DEBT.jsonl`);
    score -= errors * 5;
  }

  // Check content hash uniqueness
  const hashToIds = new Map();
  let duplicateHashes = 0;
  const duplicateDetails = [];

  for (const item of items) {
    if (item.content_hash) {
      if (hashToIds.has(item.content_hash)) {
        duplicateHashes++;
        if (duplicateDetails.length < 5) {
          duplicateDetails.push({
            hash: item.content_hash.substring(0, 8),
            id1: hashToIds.get(item.content_hash),
            id2: item.id,
          });
        }
      } else {
        hashToIds.set(item.content_hash, item.id);
      }
    }
  }

  if (duplicateHashes > 0) {
    issues.push(`${duplicateHashes} duplicate content_hash values found`);
    score -= duplicateHashes * 10;
    recommendations.push("Dedup logic in sync-sonarcloud.js may have a race condition or bug");
  }

  // Check sonar_key uniqueness for sonarcloud-sync items
  const sonarKeyToIds = new Map();
  let duplicateSonarKeys = 0;

  for (const item of items) {
    if (item.sonar_key && item.source_file === "sonarcloud-sync") {
      if (sonarKeyToIds.has(item.sonar_key)) {
        duplicateSonarKeys++;
      } else {
        sonarKeyToIds.set(item.sonar_key, item.id);
      }
    }
  }

  if (duplicateSonarKeys > 0) {
    issues.push(`${duplicateSonarKeys} duplicate sonar_key values for sonarcloud-sync items`);
    score -= duplicateSonarKeys * 15;
    recommendations.push(
      "sonar_key dedup check failed - should prevent re-adding same SonarCloud issue"
    );
  }

  // Check intake log for dedup stats
  const intakeLog = path.join(LOGS_DIR, "intake-log.jsonl");
  const syncEntry = getLatestLogEntry(intakeLog, "sync-sonarcloud");

  if (syncEntry) {
    const totalSkipped = (syncEntry.already_tracked || 0) + (syncEntry.content_duplicates || 0);
    const dedupRate =
      syncEntry.items_fetched > 0 ? Math.round((totalSkipped / syncEntry.items_fetched) * 100) : 0;

    // High dedup rate is normal for incremental syncs
    if (dedupRate > 95 && syncEntry.items_added === 0) {
      // This is fine - means we're caught up
    } else if (syncEntry.items_fetched > 0 && syncEntry.items_added === syncEntry.items_fetched) {
      // No dedup occurred - might be first run or dedup not working
      if (preSnapshot && preSnapshot.master_debt.sonar_sync_items > 0) {
        issues.push("No deduplication occurred despite existing SonarCloud items");
        score -= 10;
        recommendations.push("Check that dedup logic is comparing against existing items");
      }
    }
  }

  return {
    stage: "E2",
    name: "Deduplication",
    passed: score >= 70,
    score: Math.max(0, score),
    issues,
    recommendations,
    metadata: {
      total_items: items.length,
      json_errors: errors,
      duplicate_content_hashes: duplicateHashes,
      duplicate_sonar_keys: duplicateSonarKeys,
      unique_content_hashes: hashToIds.size,
      duplicate_examples: duplicateDetails,
    },
  };
}

// ────────────────────────────────────────────
// E3: Resolve Logic Validation
// ────────────────────────────────────────────
function checkE3(sessionPath) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  const preSnapshot = loadSnapshot(sessionPath, "pre");

  // Load items once for all checks (avoid duplicate file read)
  const { items, errors } = loadJsonlFile(MASTER_FILE);

  // Surface JSONL parse errors if any
  if (errors > 0) {
    issues.push(`${errors} JSON parse error(s) in MASTER_DEBT.jsonl`);
    score -= Math.min(30, errors * 5);
    recommendations.push("Fix malformed JSON lines in MASTER_DEBT.jsonl before evaluating");
  }

  // Check resolution log for resolve operation
  const resolutionLog = path.join(LOGS_DIR, "resolution-log.jsonl");
  const resolveEntry = getLatestLogEntry(resolutionLog, "resolve-sonarcloud-stale");

  if (!resolveEntry) {
    // Resolve may not have been run (sync-only mode)
    issues.push("No resolve-sonarcloud-stale entry found - resolve phase may not have run");
    score -= 20;
    recommendations.push("Run sync-sonarcloud.js with --resolve or --full flag");
  } else {
    if (resolveEntry.outcome === "failure") {
      issues.push(`Resolve failed: ${resolveEntry.error || "unknown error"}`);
      score -= 30;
    }

    // Check that resolved items were actually updated
    const resolvedItems = items.filter(
      (i) => i.source_file === "sonarcloud-sync" && i.status === "RESOLVED"
    );

    // If log says items were resolved, verify they exist
    if (resolveEntry.items_resolved > 0) {
      // Count items resolved after pre-snapshot time
      const preTime = new Date(preSnapshot?.timestamp || 0);
      const recentlyResolved = resolvedItems.filter((i) => {
        if (!i.resolved_date) return false;
        return new Date(i.resolved_date) >= preTime;
      });

      if (recentlyResolved.length < resolveEntry.items_resolved) {
        issues.push(
          `Log claims ${resolveEntry.items_resolved} resolved but only ${recentlyResolved.length} have recent resolved_date`
        );
        score -= 10;
      }
    }
  }

  // Check that active sonarcloud items still have status NEW or VERIFIED
  const sonarItems = items.filter((i) => i.source_file === "sonarcloud-sync");
  const statusBreakdown = {};
  for (const item of sonarItems) {
    statusBreakdown[item.status] = (statusBreakdown[item.status] || 0) + 1;
  }

  return {
    stage: "E3",
    name: "Resolve Logic",
    passed: score >= 70,
    score: Math.max(0, score),
    issues,
    recommendations,
    metadata: {
      resolve_entry_found: !!resolveEntry,
      items_checked: resolveEntry?.items_checked || 0,
      items_resolved: resolveEntry?.items_resolved || 0,
      outcome: resolveEntry?.outcome || "not_run",
      sonar_items_total: sonarItems.length,
      status_breakdown: statusBreakdown,
    },
  };
}

// ────────────────────────────────────────────
// E4: View Regeneration Validation
// ────────────────────────────────────────────
function checkE4(sessionPath) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  const preSnapshot = loadSnapshot(sessionPath, "pre");
  if (!preSnapshot) {
    return {
      stage: "E4",
      name: "View Regeneration",
      passed: false,
      score: 0,
      issues: ["pre-snapshot.json not found"],
      recommendations: [],
      metadata: {},
    };
  }

  // Check that view files exist and were updated
  const expectedViews = [
    "by-severity.md",
    "by-category.md",
    "by-status.md",
    "verification-queue.md",
  ];
  const viewResults = {};
  let updatedCount = 0;

  for (const viewFile of expectedViews) {
    const viewPath = path.join(VIEWS_DIR, viewFile);
    const exists = fs.existsSync(viewPath);

    if (!exists) {
      issues.push(`Missing view file: ${viewFile}`);
      score -= 15;
      viewResults[viewFile] = { exists: false, updated: false };
      continue;
    }

    const currentMtime = fs.statSync(viewPath).mtime.toISOString();
    const preMtime = preSnapshot.views[viewFile]?.mtime;
    const wasUpdated = preMtime ? currentMtime > preMtime : true;

    viewResults[viewFile] = {
      exists: true,
      updated: wasUpdated,
      pre_mtime: preMtime,
      current_mtime: currentMtime,
    };

    if (wasUpdated) {
      updatedCount++;
    }
  }

  // If items were added, views should have been updated
  const { items } = loadJsonlFile(MASTER_FILE);
  const itemsAdded = items.length - preSnapshot.master_debt.item_count;

  if (itemsAdded > 0 && updatedCount === 0) {
    issues.push(`${itemsAdded} items added but no views were updated`);
    score -= 30;
    recommendations.push("generate-views.js should run after sync - check integration");
  }

  // Validate view content (basic structure check)
  for (const viewFile of expectedViews) {
    const viewPath = path.join(VIEWS_DIR, viewFile);
    if (!fs.existsSync(viewPath)) continue;

    try {
      const content = fs.readFileSync(viewPath, "utf8");
      // Check for basic markdown table structure
      if (!content.includes("|") || !content.includes("---")) {
        issues.push(`${viewFile}: missing expected markdown table structure`);
        score -= 5;
      }
      // Check for DEBT-XXXX references
      if (items.length > 0 && !content.match(/DEBT-\d{4,}/)) {
        issues.push(`${viewFile}: no DEBT-XXXX references found`);
        score -= 5;
      }
    } catch {
      issues.push(`${viewFile}: could not read file`);
      score -= 10;
    }
  }

  return {
    stage: "E4",
    name: "View Regeneration",
    passed: score >= 70,
    score: Math.max(0, score),
    issues,
    recommendations,
    metadata: {
      views_checked: expectedViews.length,
      views_updated: updatedCount,
      items_added: itemsAdded,
      view_results: viewResults,
    },
  };
}

// ────────────────────────────────────────────
// E5: Report Generation Validation
// ────────────────────────────────────────────
function checkE5(sessionPath) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  const preSnapshot = loadSnapshot(sessionPath, "pre");

  // Check if report file exists and was updated
  const reportExists = fs.existsSync(REPORT_FILE);

  if (!reportExists) {
    // Report generation is optional (requires --report flag)
    issues.push("sonarcloud-issues-detailed.md not found");
    score -= 20;
    recommendations.push("Run generate-detailed-sonar-report.js to create detailed report");
  } else {
    const currentMtime = fs.statSync(REPORT_FILE).mtime.toISOString();
    const preMtime = preSnapshot?.report?.mtime;
    const wasUpdated = preMtime ? currentMtime > preMtime : true;

    if (!wasUpdated && preSnapshot) {
      issues.push("Report exists but was not updated during this run");
      score -= 10;
    }

    // Validate report content
    try {
      const content = fs.readFileSync(REPORT_FILE, "utf8");
      const fileSize = content.length;

      if (fileSize < 1000) {
        issues.push(`Report file too small (${fileSize} bytes) - may be incomplete`);
        score -= 20;
      }

      // Check for expected sections
      const expectedSections = ["Executive Summary", "Severity", "BLOCKER", "CRITICAL"];

      for (const section of expectedSections) {
        if (!content.includes(section)) {
          issues.push(`Report missing expected section: ${section}`);
          score -= 5;
        }
      }

      // Check for code snippets (should have fenced code blocks)
      const codeBlockCount = (content.match(/```/g) || []).length / 2;
      if (codeBlockCount < 1) {
        recommendations.push("Report has no code snippets - code context improves actionability");
      }
    } catch {
      issues.push("Could not read report file");
      score -= 15;
    }
  }

  return {
    stage: "E5",
    name: "Report Generation",
    passed: score >= 70,
    score: Math.max(0, score),
    issues,
    recommendations,
    metadata: {
      report_exists: reportExists,
      report_path: REPORT_FILE,
      report_size: reportExists ? fs.statSync(REPORT_FILE).size : 0,
    },
  };
}

// ────────────────────────────────────────────
// E6: Schema Integrity Validation
// ────────────────────────────────────────────
function checkE6() {
  const issues = [];
  const recommendations = [];
  let score = 100;

  const { items, errors } = loadJsonlFile(MASTER_FILE);

  if (errors > 0) {
    issues.push(`${errors} lines failed JSON parsing in MASTER_DEBT.jsonl`);
    score -= errors * 5;
    recommendations.push("Fix malformed JSON lines or remove corrupted entries");
  }

  // Required fields for all items
  const REQUIRED_FIELDS = ["id", "title", "severity", "category", "status"];
  // Required fields for sonarcloud items
  const SONAR_REQUIRED = ["source_id", "source_file", "content_hash"];

  let missingRequired = 0;
  let missingSonarFields = 0;
  let invalidSeverity = 0;
  let invalidStatus = 0;
  let invalidId = 0;

  const VALID_SEVERITIES = ["S0", "S1", "S2", "S3"];
  const VALID_STATUSES = ["NEW", "VERIFIED", "IN_PROGRESS", "RESOLVED", "WONT_FIX", "DEFERRED"];

  for (const item of items) {
    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!item[field]) {
        missingRequired++;
        break;
      }
    }

    // Check ID format
    if (item.id && !/^DEBT-\d{4,}$/.test(item.id)) {
      invalidId++;
    }

    // Check severity
    if (item.severity && !VALID_SEVERITIES.includes(item.severity)) {
      invalidSeverity++;
    }

    // Check status
    if (item.status && !VALID_STATUSES.includes(item.status)) {
      invalidStatus++;
    }

    // Check sonarcloud-specific fields
    if (item.source_file === "sonarcloud-sync") {
      for (const field of SONAR_REQUIRED) {
        if (!item[field]) {
          missingSonarFields++;
          break;
        }
      }
    }
  }

  if (missingRequired > 0) {
    issues.push(`${missingRequired} items missing required fields`);
    score -= Math.min(30, missingRequired * 2);
  }

  if (invalidId > 0) {
    issues.push(`${invalidId} items have invalid ID format (expected DEBT-XXXX)`);
    score -= Math.min(20, invalidId * 2);
  }

  if (invalidSeverity > 0) {
    issues.push(`${invalidSeverity} items have invalid severity (expected S0-S3)`);
    score -= Math.min(15, invalidSeverity * 2);
  }

  if (invalidStatus > 0) {
    issues.push(`${invalidStatus} items have invalid status`);
    score -= Math.min(15, invalidStatus * 2);
  }

  if (missingSonarFields > 0) {
    issues.push(`${missingSonarFields} sonarcloud-sync items missing required sonar fields`);
    score -= Math.min(20, missingSonarFields * 2);
    recommendations.push("sync-sonarcloud.js should set source_id, source_file, content_hash");
  }

  // Check for orphaned resolved items (resolved but no resolution reason)
  const resolvedNoReason = items.filter((i) => i.status === "RESOLVED" && !i.resolution).length;

  if (resolvedNoReason > 5) {
    issues.push(`${resolvedNoReason} RESOLVED items have no resolution reason`);
    score -= 5;
    recommendations.push("Set resolution field when marking items RESOLVED");
  }

  return {
    stage: "E6",
    name: "Schema Integrity",
    passed: score >= 70,
    score: Math.max(0, score),
    issues,
    recommendations,
    metadata: {
      total_items: items.length,
      json_errors: errors,
      missing_required_fields: missingRequired,
      missing_sonar_fields: missingSonarFields,
      invalid_id_format: invalidId,
      invalid_severity: invalidSeverity,
      invalid_status: invalidStatus,
      resolved_no_reason: resolvedNoReason,
    },
  };
}

// ────────────────────────────────────────────
// Main
// ────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const sessionPath = args[0];
  const stage = args[1];

  if (!sessionPath || !stage) {
    console.error("Usage: node scripts/eval/eval-sonarcloud-stage.js <session-path> <stage>");
    console.error("Stages: E1, E2, E3, E4, E5, E6, all");
    process.exit(1);
  }

  const safeSessionPath = validateSessionPath(sessionPath);

  const stageMap = {
    E1: () => checkE1(safeSessionPath),
    E2: () => checkE2(safeSessionPath),
    E3: () => checkE3(safeSessionPath),
    E4: () => checkE4(safeSessionPath),
    E5: () => checkE5(safeSessionPath),
    E6: () => checkE6(),
  };

  const stagesToRun = stage === "all" ? Object.keys(stageMap) : [stage.toUpperCase()];

  for (const s of stagesToRun) {
    if (!stageMap[s]) {
      console.error(`Unknown stage: ${s}`);
      process.exit(1);
    }

    const result = stageMap[s]();
    result.checked_at = new Date().toISOString();
    appendResult(safeSessionPath, result);

    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} ${result.stage}: ${result.name} — Score: ${result.score}/100`);
    if (result.issues.length > 0) {
      for (const issue of result.issues) {
        console.log(`   ⚠️  ${issue}`);
      }
    }
    if (result.recommendations.length > 0) {
      console.log(`   💡 ${result.recommendations.length} recommendation(s)`);
    }
  }
}

main();
