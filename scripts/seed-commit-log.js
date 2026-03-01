#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * seed-commit-log.js - Backfill commit-log.jsonl from git history
 *
 * Called by check-session-gaps.js when commit-log.jsonl is missing or empty.
 * Seeds recent commits so the gap detector has data to work with.
 *
 * Usage: node scripts/seed-commit-log.js [count]
 *         node scripts/seed-commit-log.js --sync
 *   count: Number of recent commits to seed (default: 50, max: 500)
 *   --sync: Incremental mode — append commits newer than the latest in the log
 *
 * Output format matches commit-tracker.js entries in .claude/state/commit-log.jsonl
 */

// Core Node.js modules (try/catch satisfies pattern-compliance require guard)
let fs, path, execFileSync;
try {
  fs = require("node:fs");
  path = require("node:path");
  ({ execFileSync } = require("node:child_process"));
} catch (err) {
  console.error("Failed to load core modules:", err instanceof Error ? err.message : String(err));
  process.exit(1);
}

// Resolve repo root via git rev-parse (falls back to cwd)
function getRepoRoot() {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: 5000,
    }).trim();
  } catch {
    return path.resolve(process.cwd());
  }
}

const projectDir = getRepoRoot();
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

const isSync = process.argv.includes("--sync");
const count = isSync ? 500 : Math.max(1, Math.min(Number.parseInt(process.argv[2], 10) || 50, 500));

/**
 * Get session counter from SESSION_CONTEXT.md
 */
function getSessionCounter() {
  try {
    const content = fs.readFileSync(SESSION_CONTEXT, "utf8");
    // Pure string parsing — no regex (SonarCloud S5852 two-strikes)
    for (const line of content.split("\n")) {
      const lower = line.toLowerCase();
      if (!lower.includes("current session count")) continue;
      // Walk backwards from end to find trailing digits
      const trimmed = line.trimEnd();
      let end = trimmed.length;
      while (end > 0 && trimmed[end - 1] >= "0" && trimmed[end - 1] <= "9") end--;
      if (end < trimmed.length) {
        return Number.parseInt(trimmed.slice(end), 10);
      }
    }
    return null;
  } catch (err) {
    console.warn(
      "Could not read session counter:",
      err instanceof Error ? err.message : String(err)
    );
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
      [
        "log",
        `--max-count=${count}`,
        "--format=%H%x00%h%x00%s%x00%an%x00%ad%x00%D",
        "--date=iso-strict",
      ],
      { cwd: projectDir, encoding: "utf8", timeout: 15000 }
    ).trim();

    if (!output) return [];
    return output.split("\n").filter(Boolean);
  } catch (err) {
    console.warn("Could not read git history:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * Parse git log output lines into entry objects
 */
function parseCommitLines(lines, sessionCounter) {
  const entries = [];
  for (const line of lines) {
    const parts = line.split("\0");
    // Format has 6 fields: hash, shortHash, subject, author, date, refs
    if (parts.length < 6) continue;
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
  return entries;
}

/**
 * Atomically write entries to commit-log.jsonl
 */
function writeEntries(entries) {
  const dir = path.dirname(COMMIT_LOG);
  fs.mkdirSync(dir, { recursive: true });
  const content = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
  // Concurrency-safe tmp filename (Review #370 R2)
  const tmpPath = `${COMMIT_LOG}.tmp.${process.pid}.${Date.now()}`;
  if (!isSafeToWrite(tmpPath)) {
    console.error("Symlink guard blocked write to commit-log.jsonl.tmp");
    process.exit(1);
  }
  if (!isSafeToWrite(COMMIT_LOG)) {
    console.error("Symlink guard blocked write to commit-log.jsonl");
    process.exit(1);
  }
  try {
    fs.writeFileSync(tmpPath, content, "utf8");
    // Remove destination first for Windows compat (Review #224)
    if (fs.existsSync(COMMIT_LOG)) fs.rmSync(COMMIT_LOG, { force: true });
    try {
      fs.renameSync(tmpPath, COMMIT_LOG);
    } catch {
      // Cross-drive fallback: copy + unlink (Review #265)
      fs.copyFileSync(tmpPath, COMMIT_LOG);
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* best-effort */
      }
    }
  } catch (err) {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* best-effort cleanup */
    }
    console.error(
      "Failed to seed commit-log.jsonl:",
      err instanceof Error ? err.message : String(err)
    );
    process.exit(1);
  }
}

/**
 * Get the latest hash from the existing commit log
 */
function getLatestLogHash() {
  try {
    const content = fs.readFileSync(COMMIT_LOG, "utf8").trim();
    if (!content) return null;
    const lines = content.split("\n").filter(Boolean);
    // Walk backwards to find last valid entry
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!lines[i].startsWith("{")) continue;
      try {
        const entry = JSON.parse(lines[i]);
        if (entry.hash) return entry.hash;
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get commits after a specific hash
 */
function getCommitsAfter(sinceHash) {
  // Validate sinceHash is a hex commit hash to prevent git arg injection
  if (!/^[\da-f]{7,40}$/i.test(sinceHash)) {
    console.warn(
      `Warning: invalid sinceHash "${sinceHash.slice(0, 20)}", skipping incremental sync`
    );
    return [];
  }
  try {
    const output = execFileSync(
      "git",
      [
        "log",
        `${sinceHash}..HEAD`,
        "--format=%H%x00%h%x00%s%x00%an%x00%ad%x00%D",
        "--date=iso-strict",
      ],
      { cwd: projectDir, encoding: "utf8", timeout: 15000 }
    ).trim();
    if (!output) return [];
    return output.split("\n").filter(Boolean);
  } catch (err) {
    console.warn(`Warning: git log failed: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

/**
 * Append entries to existing commit log (incremental sync)
 */
function appendEntries(entries) {
  if (entries.length === 0) return;
  const dir = path.dirname(COMMIT_LOG);
  fs.mkdirSync(dir, { recursive: true });
  if (!isSafeToWrite(COMMIT_LOG)) {
    console.error("Symlink guard blocked append to commit-log.jsonl");
    process.exit(1);
  }
  // Dedup: skip entries whose hash already exists in the tail of the log
  const existingHashes = new Set();
  try {
    const tail = fs.readFileSync(COMMIT_LOG, "utf8").split("\n").slice(-200);
    for (const line of tail) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("{")) continue;
      try {
        const obj = JSON.parse(trimmed);
        if (obj?.hash) existingHashes.add(obj.hash);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* file may not exist */
  }
  const filtered = entries.filter((e) => !existingHashes.has(e.hash));
  if (filtered.length === 0) return;
  // Ensure file ends with newline before appending to prevent JSONL corruption
  let prefix = "";
  try {
    if (fs.existsSync(COMMIT_LOG)) {
      const fd = fs.openSync(COMMIT_LOG, "r");
      try {
        const stat = fs.fstatSync(fd);
        if (stat.size > 0) {
          const buf = Buffer.alloc(1);
          fs.readSync(fd, buf, 0, 1, stat.size - 1);
          if (buf[0] !== 0x0a) prefix = "\n";
        }
      } finally {
        fs.closeSync(fd);
      }
    }
  } catch {
    // Non-fatal; proceed without prefix
  }
  const content = prefix + filtered.map((e) => JSON.stringify(e)).join("\n") + "\n";
  // isSafeToWrite guard already checked at function entry; re-check before write
  if (!isSafeToWrite(COMMIT_LOG)) return;
  fs.appendFileSync(COMMIT_LOG, content, "utf8");
}

/**
 * Update commit-tracker state so the hook tracks from current HEAD
 */
function updateTrackerState() {
  const TRACKER_STATE = path.join(projectDir, ".claude", "hooks", ".commit-tracker-state.json");
  try {
    const head = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: projectDir,
      encoding: "utf8",
      timeout: 5000,
    }).trim();
    if (!head) return;
    if (!isSafeToWrite(TRACKER_STATE)) return;
    fs.writeFileSync(
      TRACKER_STATE,
      JSON.stringify({ lastHead: head, updatedAt: new Date().toISOString() })
    );
  } catch {
    // Non-critical
  }
}

/**
 * Sync mode: append commits newer than the latest in the log
 */
function syncMode() {
  const latestHash = getLatestLogHash();
  if (!latestHash) {
    // No existing data — fall through to full seed
    return false;
  }

  // Verify the hash still exists in git history
  try {
    execFileSync("git", ["cat-file", "-t", latestHash], {
      cwd: projectDir,
      encoding: "utf8",
      timeout: 5000,
    });
  } catch {
    console.warn(
      `Latest log hash ${latestHash.slice(0, 7)} not found in git — falling back to full seed`
    );
    return false;
  }

  const lines = getCommitsAfter(latestHash);
  if (lines.length === 0) {
    console.log("commit-log.jsonl is up to date");
    updateTrackerState();
    return true;
  }

  const entries = parseCommitLines(lines, getSessionCounter());
  // Reverse to oldest-first (git log returns newest-first)
  entries.reverse();
  appendEntries(entries);
  updateTrackerState();
  console.log(`Synced ${entries.length} new commits to commit-log.jsonl`);
  return true;
}

function main() {
  // --sync mode: incremental append
  if (isSync) {
    if (syncMode()) {
      process.exit(0);
    } else {
      // Fall through to full seed if sync couldn't find a baseline
      console.log("No baseline found — performing full seed");
    }
  }

  // Don't overwrite existing log (seed mode only)
  if (!isSync) {
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
  }

  const lines = getRecentCommits();
  if (lines.length === 0) {
    console.log("No commits found in git history");
    process.exit(1);
  }

  const entries = parseCommitLines(lines, getSessionCounter());
  if (entries.length === 0) {
    console.log("No valid commits parsed");
    process.exit(1);
  }

  // Write oldest-first so log is chronological
  entries.reverse();
  writeEntries(entries);
  updateTrackerState();
  console.log(`Seeded ${entries.length} commits to commit-log.jsonl`);
}

main();
