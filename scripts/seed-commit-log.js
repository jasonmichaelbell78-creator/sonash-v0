#!/usr/bin/env node
/* seed-commit-log - one-time backfill utility */
/**
 * seed-commit-log.js - One-time script to backfill commit-log.jsonl
 *
 * Reads git log and creates initial entries for the commit tracker.
 * Only needs to run once when first setting up the commit tracking system.
 *
 * Usage: node scripts/seed-commit-log.js [count]
 *   count: number of recent commits to seed (default: 50)
 *
 * Session #138: Part of compaction-resilient state persistence setup
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const projectDir = path.resolve(process.cwd());
const COMMIT_LOG = path.join(projectDir, ".claude", "state", "commit-log.jsonl");
const count = parseInt(process.argv[2], 10) || 50;

function gitExec(cmd) {
  try {
    return execSync(cmd, { cwd: projectDir, encoding: "utf8", timeout: 10000 }).trim();
  } catch {
    return "";
  }
}

function main() {
  // Check if log already has entries
  try {
    const existing = fs.readFileSync(COMMIT_LOG, "utf8").trim();
    if (existing.split("\n").length > 5) {
      console.log(
        `commit-log.jsonl already has entries (${existing.split("\n").length} lines). Use --force to overwrite.`
      );
      if (!process.argv.includes("--force")) {
        process.exit(0);
      }
    }
  } catch {
    // File doesn't exist, proceed
  }

  const branch = gitExec("git rev-parse --abbrev-ref HEAD");

  // Get commits with detailed info
  const output = gitExec(`git log --format="%H|%h|%s|%an|%ad" --date=iso-strict -${count}`);

  if (!output) {
    console.log("No commits found");
    process.exit(1);
  }

  const lines = output.split("\n").filter(Boolean);
  const entries = [];

  for (const line of lines) {
    const [hash, shortHash, message, author, authorDate] = line.split("|");

    // Get files changed for this commit
    const filesOutput = gitExec(`git diff-tree --no-commit-id --name-only -r ${hash}`);
    const filesList = filesOutput.split("\n").filter(Boolean);

    entries.push(
      JSON.stringify({
        timestamp: authorDate,
        hash,
        shortHash,
        message,
        author,
        authorDate,
        branch,
        filesChanged: filesList.length,
        filesList: filesList.slice(0, 30),
        session: null, // Unknown for historical commits
        seeded: true,
      })
    );
  }

  // Write in chronological order (oldest first)
  entries.reverse();

  const dir = path.dirname(COMMIT_LOG);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(COMMIT_LOG, entries.join("\n") + "\n");

  console.log(`Seeded ${entries.length} commits to commit-log.jsonl`);
  console.log(`Branch: ${branch}`);
  console.log(`Oldest: ${lines[lines.length - 1]?.split("|")[2] || "?"}`);
  console.log(`Newest: ${lines[0]?.split("|")[2] || "?"}`);
}

main();
