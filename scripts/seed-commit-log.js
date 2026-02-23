#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * seed-commit-log.js - Backfill commit-log.jsonl from git history
 *
 * Called by check-session-gaps.js when commit-log.jsonl is missing or empty.
 * Seeds recent commits so the gap detector has data to work with.
 *
 * Usage: node scripts/seed-commit-log.js [count]
 *   count: Number of recent commits to seed (default: 50, max: 500)
 *
 * Output format matches commit-tracker.js entries in .claude/state/commit-log.jsonl
 */

// pattern-compliance: fs/path imports guarded by isSafeToWrite (loaded below)
let fs, path, execFileSync;
try {
  fs = require("node:fs");
  path = require("node:path");
  ({ execFileSync } = require("node:child_process"));
} catch (err) {
  console.error("Failed to load core modules:", err instanceof Error ? err.message : String(err));
  process.exit(1);
}

const projectDir = path.resolve(process.cwd());
const COMMIT_LOG = path.join(projectDir, ".claude", "state", "commit-log.jsonl");
const SESSION_CONTEXT = path.join(projectDir, "SESSION_CONTEXT.md");

// Symlink guard (Review #316-#323)
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require(path.join(projectDir, ".claude", "hooks", "lib", "symlink-guard")));
} catch {
  console.error("symlink-guard unavailable; disabling writes");
  isSafeToWrite = () => false;
}

const count = Math.max(1, Math.min(Number.parseInt(process.argv[2], 10) || 50, 500));

/**
 * Get session counter from SESSION_CONTEXT.md
 */
function getSessionCounter() {
  try {
    const content = fs.readFileSync(SESSION_CONTEXT, "utf8");
    const match = content.match(/\*{0,2}Current Session Count(?:er)?\*{0,2}\s*:?\s*(\d+)/i);
    return match ? Number.parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

/**
 * Get recent commits from git history
 */
function getRecentCommits() {
  try {
    const output = execFileSync(
      "git",
      ["log", `--format=%H%x00%h%x00%s%x00%an%x00%ad%x00%D`, "--date=iso-strict", `-${count}`],
      { cwd: projectDir, encoding: "utf8", timeout: 15000 }
    ).trim();

    if (!output) return [];
    return output.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function main() {
  // Don't overwrite existing log
  try {
    const existing = fs.readFileSync(COMMIT_LOG, "utf8").trim();
    if (existing.length > 0) {
      console.log(
        `commit-log.jsonl already has data (${existing.split("\n").length} entries). Skipping seed.`
      );
      process.exit(0);
    }
  } catch {
    // File doesn't exist — proceed with seeding
  }

  const lines = getRecentCommits();
  if (lines.length === 0) {
    console.log("No commits found in git history");
    process.exit(1);
  }

  const sessionCounter = getSessionCounter();
  const entries = [];

  for (const line of lines) {
    const parts = line.split("\0");
    if (parts.length < 4) continue;

    entries.push({
      timestamp: parts[4] || new Date().toISOString(),
      hash: parts[0],
      shortHash: parts[1],
      message: parts[2],
      author: parts[3],
      authorDate: parts[4] || "",
      branch: "seeded",
      filesChanged: 0,
      filesList: [],
      session: sessionCounter,
      seeded: true,
    });
  }

  if (entries.length === 0) {
    console.log("No valid commits parsed");
    process.exit(1);
  }

  // Write oldest-first so log is chronological (atomic write pattern)
  entries.reverse();

  const dir = path.dirname(COMMIT_LOG);
  fs.mkdirSync(dir, { recursive: true });
  const content = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
  const tmpPath = COMMIT_LOG + ".tmp";
  if (!isSafeToWrite(tmpPath)) {
    console.error("Symlink guard blocked write to commit-log.jsonl.tmp");
    process.exit(1);
  }
  if (!isSafeToWrite(COMMIT_LOG)) {
    console.error("Symlink guard blocked write to commit-log.jsonl");
    process.exit(1);
  }
  fs.writeFileSync(tmpPath, content, "utf-8");
  fs.renameSync(tmpPath, COMMIT_LOG);

  console.log(`Seeded ${entries.length} commits to commit-log.jsonl`);
}

main();
