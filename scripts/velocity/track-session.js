#!/usr/bin/env node
/* eslint-disable no-redeclare, no-undef */
/**
 * track-session.js - Captures velocity metrics at session end
 *
 * Reads ROADMAP.md git diff to count items checked off during the current
 * session and appends a velocity entry to .claude/state/velocity-log.jsonl.
 *
 * Usage: node scripts/velocity/track-session.js [--session N]
 *
 * The script:
 * 1. Runs `git diff HEAD~1 -- ROADMAP.md` to find newly checked items
 * 2. Counts items changed from `- [ ]` to `- [x]`
 * 3. Extracts track identifiers (B3, D1, etc.)
 * 4. Appends a JSONL entry with session number, date, items completed
 * 5. Prints a summary to stdout
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const VELOCITY_LOG = path.join(PROJECT_ROOT, ".claude/state/velocity-log.jsonl");
const ROADMAP_PATH = path.join(PROJECT_ROOT, "ROADMAP.md");

function getSessionNumber() {
  // Check CLI args
  const sessionIdx = process.argv.indexOf("--session");
  if (sessionIdx !== -1 && process.argv[sessionIdx + 1]) {
    return parseInt(process.argv[sessionIdx + 1], 10);
  }

  // Try to read from SESSION_CONTEXT.md
  try {
    const sessionCtx = fs.readFileSync(path.join(PROJECT_ROOT, "SESSION_CONTEXT.md"), "utf8");
    const match = sessionCtx.match(/\*\*Current Session Count\*\*:\s*(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
  } catch {
    // Fall through
  }

  return null;
}

function getCompletedItems() {
  // Get the diff of ROADMAP.md to find newly checked items
  // Compare against the last commit that touched ROADMAP.md
  let diff;
  try {
    diff = execSync("git diff HEAD~1 -- ROADMAP.md", {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      timeout: 10000,
    });
  } catch {
    // If HEAD~1 doesn't exist or diff fails, try against staged
    try {
      diff = execSync("git diff --cached -- ROADMAP.md", {
        cwd: PROJECT_ROOT,
        encoding: "utf8",
        timeout: 10000,
      });
    } catch {
      return { items: [], tracks: [] };
    }
  }

  if (!diff) {
    return { items: [], tracks: [] };
  }

  const items = [];
  const tracks = new Set();
  const lines = diff.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Look for added lines that contain checked checkboxes
    if (line.startsWith("+") && !line.startsWith("+++")) {
      // Match patterns like: + - [x] **B3:** or + - [x] **CANON-0011:**
      const checkMatch = line.match(/^\+\s*-\s*\[x\]\s*\*\*([A-Z][A-Z0-9]*(?:-\d+)?):?\*\*/i);
      if (checkMatch) {
        const itemId = checkMatch[1];
        items.push(itemId);
        // Extract track letter (B from B3, D from D1, etc.)
        const trackMatch = itemId.match(/^([A-Z]+)/);
        if (trackMatch) {
          tracks.add(trackMatch[1]);
        }
      }
    }
  }

  return { items, tracks: [...tracks] };
}

function getSprintName() {
  // Try to determine current sprint from ROADMAP.md
  try {
    const roadmap = fs.readFileSync(ROADMAP_PATH, "utf8");
    const sprintMatch = roadmap.match(/##\s+(?:Active Sprint|Current Sprint)[:\s-]*(.+)/i);
    if (sprintMatch) {
      return sprintMatch[1].trim();
    }
    // Fallback: look for milestone reference
    const milestoneMatch = roadmap.match(/M1[.\d]*\s*[-–]\s*(.+)/);
    if (milestoneMatch) {
      return milestoneMatch[0].trim();
    }
  } catch {
    // Fall through
  }
  return "unknown";
}

function run() {
  const sessionNumber = getSessionNumber();
  const { items, tracks } = getCompletedItems();
  const sprint = getSprintName();
  const date = new Date().toISOString().split("T")[0];

  const entry = {
    session: sessionNumber,
    date,
    items_completed: items.length,
    item_ids: items,
    tracks,
    sprint,
  };

  // Ensure state directory exists
  const stateDir = path.dirname(VELOCITY_LOG);
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }

  // Append to JSONL
  fs.appendFileSync(VELOCITY_LOG, JSON.stringify(entry) + "\n", "utf8");

  // Print summary
  if (items.length === 0) {
    console.log("Velocity: No ROADMAP items completed this session.");
  } else {
    console.log(`Velocity: ${items.length} item(s) completed — ${items.join(", ")}`);
    console.log(`  Tracks: ${tracks.join(", ")}`);
    console.log(`  Sprint: ${sprint}`);
  }

  // Also print rolling average if we have history
  printRollingAverage();
}

function printRollingAverage() {
  if (!fs.existsSync(VELOCITY_LOG)) {
    return;
  }

  try {
    const lines = fs.readFileSync(VELOCITY_LOG, "utf8").trim().split("\n").filter(Boolean);
    const entries = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (entries.length < 2) {
      return;
    }

    // Last 10 sessions
    const recent = entries.slice(-10);
    const total = recent.reduce((sum, e) => sum + (e.items_completed || 0), 0);
    const avg = (total / recent.length).toFixed(1);

    // Trend detection
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    const firstAvg = firstHalf.reduce((s, e) => s + (e.items_completed || 0), 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((s, e) => s + (e.items_completed || 0), 0) / secondHalf.length;

    let trend = "steady";
    if (secondAvg > firstAvg * 1.15) {
      trend = "accelerating";
    } else if (secondAvg < firstAvg * 0.85) {
      trend = "decelerating";
    }

    console.log(`  Rolling avg: ${avg} items/session (last ${recent.length} sessions, ${trend})`);
  } catch {
    // Silently skip if log is corrupted
  }
}

run();
