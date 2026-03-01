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
    try {
      fs.renameSync(tmpPath, COMMIT_LOG);
    } catch {
      // Cross-drive fallback: copy + unlink (Review #265)
      if (!isSafeToWrite(COMMIT_LOG)) {
        throw new Error("Symlink guard blocked write to commit-log.jsonl (fallback)");
      }
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
 * Extract the last valid commit hash from JSONL lines (reverse search).
 */
function findLastHash(lines) {
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line.startsWith("{")) continue;
    try {
      const entry = JSON.parse(line);
      if (entry && typeof entry === "object" && entry.hash) return entry.hash;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Get the latest hash from the existing commit log
 */
function getLatestLogHash() {
  try {
    if (!fs.existsSync(COMMIT_LOG)) return null;
    const fd = fs.openSync(COMMIT_LOG, "r");
    try {
      const stat = fs.fstatSync(fd);
      if (stat.size === 0) return null;
      // Read only the tail to avoid loading large logs into memory
      const MAX_TAIL_BYTES = 256 * 1024;
      const start = Math.max(0, stat.size - MAX_TAIL_BYTES);
      const len = stat.size - start;
      const buf = Buffer.alloc(len);
      fs.readSync(fd, buf, 0, len, start);
      // If we started mid-file, drop the partial first line to avoid parse failures
      const nlIdx = start === 0 ? -1 : buf.indexOf(0x0a);
      if (start !== 0 && nlIdx === -1) return null;
      const alignedBuf = start === 0 ? buf : buf.subarray(nlIdx + 1);
      const text = alignedBuf.toString("utf8").trim();
      if (!text) return null;
      const lines = text.split("\n").slice(-200).filter(Boolean);
      return findLastHash(lines);
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return null;
  }
}

/**
 * Get commits after a specific hash
 */
function getCommitsAfter(sinceHash) {
  if (typeof sinceHash !== "string" || sinceHash.length === 0) {
    console.warn("Warning: missing sinceHash, skipping incremental sync");
    return [];
  }
  // Validate sinceHash is a hex commit hash to prevent git arg injection
  if (!/^[\da-f]{7,40}$/i.test(sinceHash)) {
    console.warn(
      `Warning: invalid sinceHash "${sinceHash.substring(0, 20)}", skipping incremental sync`
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
 * Read tail hashes from an existing log file for dedup.
 */
function readTailHashes(filePath) {
  const hashes = new Set();
  try {
    if (!fs.existsSync(filePath)) return hashes;
    const fd = fs.openSync(filePath, "r");
    try {
      const stat = fs.fstatSync(fd);
      if (stat.size === 0) return hashes;

      const MAX_TAIL_BYTES = 256 * 1024;
      const start = Math.max(0, stat.size - MAX_TAIL_BYTES);
      const len = stat.size - start;
      const buf = Buffer.alloc(len);
      fs.readSync(fd, buf, 0, len, start);

      // If we started mid-file, drop the partial first line
      const nlIdx = start === 0 ? -1 : buf.indexOf(0x0a);
      if (start !== 0 && nlIdx === -1) return hashes;
      const alignedBuf = start === 0 ? buf : buf.subarray(nlIdx + 1);

      const lines = alignedBuf.toString("utf8").split("\n").slice(-200);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("{")) continue;
        try {
          const obj = JSON.parse(trimmed);
          if (obj?.hash) hashes.add(obj.hash);
        } catch {
          /* ignore malformed lines */
        }
      }
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    /* file may not exist / best-effort */
  }
  return hashes;
}

/**
 * Determine if a newline prefix is needed before appending.
 */
function needsNewlinePrefix(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const fd = fs.openSync(filePath, "r");
    try {
      const stat = fs.fstatSync(fd);
      if (stat.size === 0) return false;
      const buf = Buffer.alloc(1);
      fs.readSync(fd, buf, 0, 1, stat.size - 1);
      return buf[0] !== 0x0a;
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return false;
  }
}

/**
 * Append entries to existing commit log (incremental sync)
 */
function appendEntries(entries) {
  if (entries.length === 0) return;
  const dir = path.dirname(COMMIT_LOG);
  fs.mkdirSync(dir, { recursive: true });
  const existingHashes = readTailHashes(COMMIT_LOG);
  const filtered = entries.filter((e) => !existingHashes.has(e.hash));
  if (filtered.length === 0) return;
  const prefix = needsNewlinePrefix(COMMIT_LOG) ? "\n" : "";
  const content = prefix + filtered.map((e) => JSON.stringify(e)).join("\n") + "\n";
  if (!isSafeToWrite(COMMIT_LOG)) {
    console.error("Symlink guard blocked append to commit-log.jsonl");
    process.exit(1);
  }
  let fd;
  try {
    fd = fs.openSync(COMMIT_LOG, "a", 0o644);
    const st = fs.fstatSync(fd);
    if (!st.isFile()) {
      console.error("Refusing to append: commit-log.jsonl is not a regular file");
      process.exit(1);
    }
    fs.writeFileSync(fd, content, "utf8");
  } finally {
    if (fd != null) {
      try {
        fs.closeSync(fd);
      } catch {
        /* best-effort */
      }
    }
  }
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
    const trackerDir = path.dirname(TRACKER_STATE);
    fs.mkdirSync(trackerDir, { recursive: true });
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
