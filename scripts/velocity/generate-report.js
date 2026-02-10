#!/usr/bin/env node
/* eslint-disable no-redeclare, no-undef */
/**
 * generate-report.js - Generates velocity report from session history
 *
 * Usage:
 *   node scripts/velocity/generate-report.js              # Summary to stdout
 *   node scripts/velocity/generate-report.js --full       # Detailed report
 *   node scripts/velocity/generate-report.js --json       # Machine-readable
 *
 * Reads .claude/state/velocity-log.jsonl and produces:
 * - Average velocity (items/session over last 10 sessions)
 * - Trend (accelerating, steady, decelerating)
 * - Sprint burn-down estimate
 * - Per-track breakdown
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const VELOCITY_LOG = path.join(PROJECT_ROOT, ".claude/state/velocity-log.jsonl");
const ROADMAP_PATH = path.join(PROJECT_ROOT, "ROADMAP.md");

function loadEntries() {
  if (!fs.existsSync(VELOCITY_LOG)) {
    return [];
  }

  let raw;
  try {
    raw = fs.readFileSync(VELOCITY_LOG, "utf8");
  } catch (err) {
    process.stderr.write(
      `Warning: Could not read velocity log: ${err instanceof Error ? err.message : String(err)}\n`
    );
    return [];
  }

  return raw
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function countRemainingItems() {
  // Count unchecked items in ROADMAP.md active sprint area
  try {
    const roadmap = fs.readFileSync(ROADMAP_PATH, "utf8");
    const unchecked = roadmap.match(/^[ \t]*- \[ \]/gm);
    const checked = roadmap.match(/^[ \t]*- \[x\]/gm);
    return {
      remaining: unchecked ? unchecked.length : 0,
      completed: checked ? checked.length : 0,
    };
  } catch (err) {
    process.stderr.write(
      `Warning: Could not read ROADMAP.md: ${err instanceof Error ? err.message : String(err)}\n`
    );
    return { remaining: 0, completed: 0 };
  }
}

function calculateVelocity(entries) {
  if (entries.length === 0) {
    return {
      totalSessions: 0,
      totalItems: 0,
      averageVelocity: 0,
      trend: "insufficient data",
      recentEntries: [],
      trackBreakdown: {},
    };
  }

  const recent = entries.slice(-10);
  const totalItems = recent.reduce((sum, e) => sum + (e.items_completed || 0), 0);
  const averageVelocity = recent.length > 0 ? totalItems / recent.length : 0;

  // Trend detection (compare first half vs second half)
  let trend = "steady";
  if (recent.length >= 4) {
    const mid = Math.floor(recent.length / 2);
    const firstHalf = recent.slice(0, mid);
    const secondHalf = recent.slice(mid);
    const firstAvg = firstHalf.reduce((s, e) => s + (e.items_completed || 0), 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((s, e) => s + (e.items_completed || 0), 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.15) {
      trend = "accelerating";
    } else if (secondAvg < firstAvg * 0.85) {
      trend = "decelerating";
    }
  } else {
    trend = "insufficient data";
  }

  // Track breakdown
  const trackBreakdown = {};
  for (const entry of entries) {
    for (const track of entry.tracks || []) {
      if (!trackBreakdown[track]) {
        trackBreakdown[track] = { sessions: 0, items: 0 };
      }
      trackBreakdown[track].sessions++;
      trackBreakdown[track].items += entry.items_completed || 0;
    }
  }

  return {
    totalSessions: entries.length,
    totalItems: entries.reduce((sum, e) => sum + (e.items_completed || 0), 0),
    averageVelocity: Math.round(averageVelocity * 10) / 10,
    trend,
    recentEntries: recent,
    trackBreakdown,
  };
}

function printSummary(velocity, remaining) {
  console.log("=== Velocity Report ===\n");

  if (velocity.totalSessions === 0) {
    console.log("No velocity data yet. Run /session-end to start tracking.");
    return;
  }

  console.log(`Sessions tracked: ${velocity.totalSessions}`);
  console.log(`Total items completed: ${velocity.totalItems}`);
  console.log(
    `Average velocity: ${velocity.averageVelocity} items/session (last ${Math.min(velocity.totalSessions, 10)} sessions)`
  );
  console.log(`Trend: ${velocity.trend}`);

  if (remaining.remaining > 0) {
    const sessionsRemaining =
      velocity.averageVelocity > 0
        ? Math.ceil(remaining.remaining / velocity.averageVelocity)
        : "unknown";
    console.log(
      `\nSprint: ${remaining.completed}/${remaining.completed + remaining.remaining} items done (${Math.round((remaining.completed / (remaining.completed + remaining.remaining)) * 100)}%)`
    );
    console.log(`Remaining: ${remaining.remaining} items`);
    console.log(`Est. sessions to complete: ~${sessionsRemaining}`);
  }

  if (Object.keys(velocity.trackBreakdown).length > 0) {
    console.log("\nPer-track breakdown:");
    for (const [track, data] of Object.entries(velocity.trackBreakdown).sort(
      (a, b) => b[1].items - a[1].items
    )) {
      console.log(`  Track ${track}: ${data.items} items across ${data.sessions} sessions`);
    }
  }
}

function printFull(velocity, remaining) {
  printSummary(velocity, remaining);

  if (velocity.recentEntries.length > 0) {
    console.log("\nRecent sessions:");
    for (const entry of velocity.recentEntries) {
      const items = entry.item_ids ? entry.item_ids.join(", ") : `${entry.items_completed} items`;
      console.log(`  Session #${entry.session || "?"} (${entry.date}): ${items}`);
    }
  }
}

function run() {
  const entries = loadEntries();
  const velocity = calculateVelocity(entries);
  const remaining = countRemainingItems();

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ velocity, sprint: remaining }, null, 2));
  } else if (process.argv.includes("--full")) {
    printFull(velocity, remaining);
  } else {
    printSummary(velocity, remaining);
  }
}

run();
