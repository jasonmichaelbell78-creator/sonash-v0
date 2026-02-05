#!/usr/bin/env node
/**
 * eval-snapshot.js - Capture pre/post audit state for evaluation
 *
 * Usage:
 *   node scripts/multi-ai/eval-snapshot.js pre <session-path>
 *   node scripts/multi-ai/eval-snapshot.js post <session-path>
 *
 * Captures:
 *   - MASTER_DEBT.jsonl item count and last DEBT ID
 *   - Views file timestamps
 *   - Metrics file timestamp and content hash
 *   - Roadmap DEBT-XXXX reference count
 *   - Session state (if exists)
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
const METRICS_FILE = path.join(DEBT_DIR, "METRICS.md");
const ROADMAP_FILE = path.join(ROOT, "ROADMAP.md");

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

function countMasterDebtItems() {
  if (!fs.existsSync(MASTER_FILE)) return { count: 0, lastId: null, severityCounts: {} };

  let content;
  try {
    content = fs.readFileSync(MASTER_FILE, "utf8");
  } catch {
    return { count: 0, lastId: null, severityCounts: {} };
  }

  const lines = content.split("\n").filter((l) => l.trim());
  let lastId = null;
  let maxIdNum = 0;
  const severityCounts = { S0: 0, S1: 0, S2: 0, S3: 0 };
  const categoryCounts = {};
  const statusCounts = {};

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
      if (item.category) {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      }
      if (item.status) {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      }
    } catch {
      // Skip invalid lines
    }
  }

  return { count: lines.length, lastId, maxIdNum, severityCounts, categoryCounts, statusCounts };
}

function countRoadmapDebtRefs() {
  if (!fs.existsSync(ROADMAP_FILE)) return 0;
  try {
    const content = fs.readFileSync(ROADMAP_FILE, "utf8");
    const matches = content.match(/DEBT-\d{4,}/g);
    return matches ? new Set(matches).size : 0;
  } catch {
    return 0;
  }
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
      };
    }
  } catch {
    // Views dir read failed
  }
  return views;
}

function getSessionState(sessionPath) {
  const stateFile = path.join(sessionPath, "state.json");
  if (!fs.existsSync(stateFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf8"));
  } catch {
    return null;
  }
}

function main() {
  const args = process.argv.slice(2);
  const mode = args[0]; // "pre" or "post"
  const sessionPath = args[1];

  if (!mode || !sessionPath) {
    console.error("Usage: node scripts/multi-ai/eval-snapshot.js <pre|post> <session-path>");
    process.exit(1);
  }

  if (!["pre", "post"].includes(mode)) {
    console.error('Error: mode must be "pre" or "post"');
    process.exit(1);
  }

  // Ensure eval directory exists
  const evalDir = path.join(sessionPath, "eval");
  if (!fs.existsSync(evalDir)) {
    fs.mkdirSync(evalDir, { recursive: true });
  }

  const masterDebt = countMasterDebtItems();
  const snapshot = {
    mode,
    timestamp: new Date().toISOString(),
    session_path: sessionPath,
    master_debt: {
      item_count: masterDebt.count,
      last_id: masterDebt.lastId,
      max_id_num: masterDebt.maxIdNum,
      severity_counts: masterDebt.severityCounts,
      category_counts: masterDebt.categoryCounts,
      status_counts: masterDebt.statusCounts,
      file_hash: getFileHash(MASTER_FILE),
    },
    roadmap: {
      debt_ref_count: countRoadmapDebtRefs(),
      file_hash: getFileHash(ROADMAP_FILE),
    },
    metrics: {
      mtime: getFileMtime(METRICS_FILE),
      hash: getFileHash(METRICS_FILE),
    },
    views: getViewsState(),
    session_state: getSessionState(sessionPath),
    // Capture which dirs exist in the session
    session_dirs: {
      raw: fs.existsSync(path.join(sessionPath, "raw")),
      canon: fs.existsSync(path.join(sessionPath, "canon")),
      final: fs.existsSync(path.join(sessionPath, "final")),
      eval: true,
    },
  };

  const outputFile = path.join(evalDir, `${mode}-snapshot.json`);
  fs.writeFileSync(outputFile, JSON.stringify(snapshot, null, 2) + "\n");

  console.log(`📸 ${mode === "pre" ? "Pre" : "Post"}-audit snapshot captured`);
  console.log(
    `   MASTER_DEBT.jsonl: ${masterDebt.count} items (last: ${masterDebt.lastId || "none"})`
  );
  console.log(`   Roadmap DEBT refs: ${snapshot.roadmap.debt_ref_count}`);
  console.log(`   Views: ${Object.keys(snapshot.views).length} files`);
  console.log(`   Output: ${outputFile}`);
}

main();
