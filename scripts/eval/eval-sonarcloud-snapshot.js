#!/usr/bin/env node
/**
 * eval-sonarcloud-snapshot.js - Capture pre/post state for SonarCloud evaluation
 *
 * Usage:
 *   node scripts/eval/eval-sonarcloud-snapshot.js pre <session-path>
 *   node scripts/eval/eval-sonarcloud-snapshot.js post <session-path>
 *
 * Captures:
 *   - MASTER_DEBT.jsonl item counts, last ID, severity/status breakdown
 *   - Log file sizes (intake-log, resolution-log)
 *   - View file timestamps and hashes
 *   - SonarCloud-specific metrics (sonar_key counts, source_file counts)
 *
 * Output: <session-path>/eval/pre-snapshot.json or post-snapshot.json
 */

/* global __dirname */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "../..");
const DEBT_DIR = path.join(ROOT, "docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const VIEWS_DIR = path.join(DEBT_DIR, "views");
const LOGS_DIR = path.join(DEBT_DIR, "logs");
const REPORT_FILE = path.join(ROOT, "docs/audits/sonarcloud-issues-detailed.md");

/**
 * Validate that a user-provided path is contained within the project root.
 * Prevents path traversal attacks (CWE-22, OWASP A01:2021 Broken Access Control).
 * @param {string} sessionPath - User-provided session path from CLI args
 * @returns {string} - Resolved absolute path (safe to use)
 */
function validateSessionPath(sessionPath) {
  const projectRoot = ROOT;
  const resolved = path.resolve(sessionPath);
  const relative = path.relative(projectRoot, resolved);
  if (relative === "" || /^\.\.(?:[\\/]|$)/.test(relative) || path.isAbsolute(relative)) {
    console.error(`Error: session path "${sessionPath}" resolves outside the project root.`);
    console.error(`  Resolved: ${resolved}`);
    console.error(`  Project root: ${projectRoot}`);
    process.exit(1);
  }
  return resolved;
}

function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return crypto.createHash("sha256").update(content).digest("hex").substring(0, 16);
  } catch {
    return null;
  }
}

function getFileMtime(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return fs.statSync(filePath).mtime.toISOString();
  } catch {
    return null;
  }
}

function getFileSize(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function countLogLines(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.split("\n").filter((l) => l.trim()).length;
  } catch {
    return 0;
  }
}

function analyzeMasterDebt() {
  if (!fs.existsSync(MASTER_FILE)) {
    return {
      count: 0,
      lastId: null,
      maxIdNum: 0,
      severityCounts: { S0: 0, S1: 0, S2: 0, S3: 0 },
      statusCounts: {},
      sonarKeyCounts: 0,
      sonarSyncItems: 0,
      contentHashes: new Set(),
    };
  }

  let content;
  try {
    content = fs.readFileSync(MASTER_FILE, "utf8");
  } catch {
    return {
      count: 0,
      lastId: null,
      maxIdNum: 0,
      severityCounts: { S0: 0, S1: 0, S2: 0, S3: 0 },
      statusCounts: {},
      sonarKeyCounts: 0,
      sonarSyncItems: 0,
      contentHashes: new Set(),
    };
  }

  const lines = content.split("\n").filter((l) => l.trim());
  let lastId = null;
  let maxIdNum = 0;
  const severityCounts = { S0: 0, S1: 0, S2: 0, S3: 0 };
  const statusCounts = {};
  let sonarKeyCounts = 0;
  let sonarSyncItems = 0;
  const contentHashes = new Set();

  for (const line of lines) {
    try {
      const item = JSON.parse(line);
      if (item.id) {
        const match = item.id.match(/DEBT-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxIdNum) {
            maxIdNum = num;
            lastId = item.id;
          }
        }
      }
      if (item.severity && severityCounts[item.severity] !== undefined) {
        severityCounts[item.severity]++;
      }
      if (item.status) {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      }
      if (item.sonar_key) {
        sonarKeyCounts++;
      }
      if (item.source_file === "sonarcloud-sync") {
        sonarSyncItems++;
      }
      if (item.content_hash) {
        contentHashes.add(item.content_hash);
      }
    } catch {
      // Skip invalid lines
    }
  }

  return {
    count: lines.length,
    lastId,
    maxIdNum,
    severityCounts,
    statusCounts,
    sonarKeyCounts,
    sonarSyncItems,
    contentHashCount: contentHashes.size,
  };
}

function getViewsState() {
  const views = {};
  if (!fs.existsSync(VIEWS_DIR)) return views;

  try {
    const files = fs.readdirSync(VIEWS_DIR).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const filePath = path.join(VIEWS_DIR, file);
      views[file] = {
        mtime: getFileMtime(filePath),
        hash: getFileHash(filePath),
        size: getFileSize(filePath),
      };
    }
  } catch {
    // Views dir read failed
  }
  return views;
}

function getLogsState() {
  const intakeLog = path.join(LOGS_DIR, "intake-log.jsonl");
  const resolutionLog = path.join(LOGS_DIR, "resolution-log.jsonl");

  return {
    intake: {
      exists: fs.existsSync(intakeLog),
      size: getFileSize(intakeLog),
      lines: countLogLines(intakeLog),
      mtime: getFileMtime(intakeLog),
    },
    resolution: {
      exists: fs.existsSync(resolutionLog),
      size: getFileSize(resolutionLog),
      lines: countLogLines(resolutionLog),
      mtime: getFileMtime(resolutionLog),
    },
  };
}

function main() {
  const args = process.argv.slice(2);
  const mode = args[0]; // "pre" or "post"
  const sessionPath = args[1];

  if (!mode || !sessionPath) {
    console.error("Usage: node scripts/eval/eval-sonarcloud-snapshot.js <pre|post> <session-path>");
    process.exit(1);
  }

  if (!["pre", "post"].includes(mode)) {
    console.error('Error: mode must be "pre" or "post"');
    process.exit(1);
  }

  // Validate session path stays within project root (CWE-22)
  const safeSessionPath = validateSessionPath(sessionPath);

  // Ensure eval directory exists
  const evalDir = path.join(safeSessionPath, "eval");
  if (!fs.existsSync(evalDir)) {
    fs.mkdirSync(evalDir, { recursive: true });
  }

  const masterDebt = analyzeMasterDebt();
  const snapshot = {
    mode,
    timestamp: new Date().toISOString(),
    session_path: safeSessionPath,
    master_debt: {
      item_count: masterDebt.count,
      last_id: masterDebt.lastId,
      max_id_num: masterDebt.maxIdNum,
      severity_counts: masterDebt.severityCounts,
      status_counts: masterDebt.statusCounts,
      sonar_key_count: masterDebt.sonarKeyCounts,
      sonar_sync_items: masterDebt.sonarSyncItems,
      content_hash_count: masterDebt.contentHashCount,
      file_hash: getFileHash(MASTER_FILE),
      file_size: getFileSize(MASTER_FILE),
    },
    views: getViewsState(),
    logs: getLogsState(),
    report: {
      exists: fs.existsSync(REPORT_FILE),
      mtime: getFileMtime(REPORT_FILE),
      size: getFileSize(REPORT_FILE),
      hash: getFileHash(REPORT_FILE),
    },
  };

  const outputFile = path.join(evalDir, `${mode}-snapshot.json`);
  fs.writeFileSync(outputFile, JSON.stringify(snapshot, null, 2) + "\n");

  console.log(`📸 ${mode === "pre" ? "Pre" : "Post"}-SonarCloud snapshot captured`);
  console.log(
    `   MASTER_DEBT.jsonl: ${masterDebt.count} items (last: ${masterDebt.lastId || "none"})`
  );
  console.log(
    `   SonarCloud items: ${masterDebt.sonarSyncItems} (with sonar_key: ${masterDebt.sonarKeyCounts})`
  );
  console.log(`   Views: ${Object.keys(snapshot.views).length} files`);
  console.log(
    `   Logs: intake=${snapshot.logs.intake.lines} lines, resolution=${snapshot.logs.resolution.lines} lines`
  );
  console.log(`   Output: ${outputFile}`);
}

main();
