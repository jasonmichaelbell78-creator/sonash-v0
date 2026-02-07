#!/usr/bin/env node
/* eslint-disable security/detect-object-injection */
/**
 * check-session-gaps.js - Session-begin gap detector (Layer D)
 *
 * Reads .claude/state/commit-log.jsonl and SESSION_CONTEXT.md to detect
 * commits that aren't covered by any documented session summary.
 *
 * Reports:
 *   - Commits with no matching session documentation
 *   - Session numbers that appear in commits but not in SESSION_CONTEXT.md
 *   - Suggested reconstruction data for missing sessions
 *
 * Usage: node scripts/check-session-gaps.js [--fix]
 *   --fix: Generate a suggested session summary to stderr (for AI to use)
 *
 * Session #138: Part of compaction-resilient state persistence (Layer D)
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const projectDir = path.resolve(process.cwd());
const COMMIT_LOG = path.join(projectDir, ".claude", "state", "commit-log.jsonl");
const SESSION_CONTEXT = path.join(projectDir, "SESSION_CONTEXT.md");

const fixMode = process.argv.includes("--fix");

/**
 * Read commit log entries
 */
function readCommitLog() {
  try {
    const content = fs.readFileSync(COMMIT_LOG, "utf8").trim();
    if (!content) return [];
    return content
      .split("\n")
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Extract documented session numbers from SESSION_CONTEXT.md
 * Looks for patterns like "Session #NNN Summary"
 */
function getDocumentedSessions() {
  try {
    const content = fs.readFileSync(SESSION_CONTEXT, "utf8");
    const matches = content.match(/\*\*Session #(\d+) Summary\*\*/g) || [];
    return matches
      .map((m) => {
        const num = m.match(/#(\d+)/);
        return num ? parseInt(num[1], 10) : null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Get current session counter
 */
function getCurrentSessionCounter() {
  try {
    const content = fs.readFileSync(SESSION_CONTEXT, "utf8");
    const match = content.match(/\*\*Current Session Count\*\*:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

/**
 * Fall back to git log if commit-log.jsonl doesn't exist yet
 */
function getRecentCommitsFromGit(count) {
  try {
    const safeCount = String(Math.max(1, Math.min(parseInt(count, 10) || 50, 500)));
    const output = execFileSync(
      "git",
      ["log", `--format=%H\x1f%h\x1f%s\x1f%ad`, "--date=iso-strict", `-${safeCount}`],
      {
        cwd: projectDir,
        encoding: "utf8",
        timeout: 5000,
      }
    ).trim();
    return output
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, shortHash, message, date] = line.split("\x1f");
        return { hash, shortHash, message, authorDate: date, timestamp: date };
      });
  } catch {
    return [];
  }
}

/**
 * Group commits by session number
 */
function groupBySession(commits) {
  const groups = Object.create(null);
  for (const commit of commits) {
    const session = commit.session || "unknown";
    if (!groups[session]) {
      groups[session] = [];
    }
    groups[session].push(commit);
  }
  return groups;
}

/**
 * Categorize commit messages for summary generation
 */
function categorizeCommits(commits) {
  const categories = {
    audits: [],
    fixes: [],
    features: [],
    chores: [],
    reviews: [],
  };

  for (const c of commits) {
    const msg = c.message || "";
    if (/^audit/i.test(msg) || /aggregate.*sources/i.test(msg)) {
      categories.audits.push(msg);
    } else if (/^fix/i.test(msg) || /address review/i.test(msg)) {
      categories.fixes.push(msg);
    } else if (/^feat/i.test(msg)) {
      categories.features.push(msg);
    } else if (/review #\d+/i.test(msg) || /PR review/i.test(msg)) {
      categories.reviews.push(msg);
    } else {
      categories.chores.push(msg);
    }
  }

  return categories;
}

/**
 * Generate a suggested session summary from commits
 */
function generateSummary(sessionNum, commits) {
  const cats = categorizeCommits(commits);
  const lines = [];
  lines.push(`**Session #${sessionNum} Summary** (RECONSTRUCTED FROM COMMIT LOG):\n`);
  lines.push("- **Reconstructed in later session** — state went stale due to compaction");

  if (cats.reviews.length > 0) {
    const reviewNums = [];
    for (const msg of cats.reviews) {
      const match = msg.match(/#(\d+)/g);
      if (match) reviewNums.push(...match);
    }
    if (reviewNums.length > 0) {
      lines.push(`- PR Reviews ${reviewNums.join(", ")}: ${cats.reviews.length} rounds of fixes`);
    }
  }

  if (cats.audits.length > 0) {
    lines.push(`- ${cats.audits.length} audit commits:`);
    for (const msg of cats.audits.slice(0, 10)) {
      lines.push(`  - ${msg.slice(0, 80)}`);
    }
  }

  if (cats.fixes.length > 0) {
    lines.push(`- ${cats.fixes.length} fix commits`);
  }

  if (cats.features.length > 0) {
    lines.push(`- ${cats.features.length} feature commits`);
  }

  lines.push(`- Total: ${commits.length} commits`);
  lines.push(`- Note: Session-end did not run; reconstructed from commit log`);
  return lines.join("\n");
}

/**
 * Main
 */
function main() {
  // Read commit log (or fall back to git log)
  let commits = readCommitLog();
  let source = "commit-log.jsonl";

  if (commits.length === 0) {
    // No commit log yet — fall back to git log for initial analysis
    commits = getRecentCommitsFromGit(50);
    source = "git log (commit-log.jsonl not yet populated)";
  }

  if (commits.length === 0) {
    console.log("No commits found to analyze");
    process.exit(0);
  }

  // Get documented sessions
  const documentedSessions = getDocumentedSessions();
  const currentSession = getCurrentSessionCounter();

  // Group commits by session
  const sessionGroups = groupBySession(commits);
  const loggedSessions = Object.keys(sessionGroups)
    .map((s) => (s === "unknown" || s === "null" ? null : parseInt(s, 10)))
    .filter(Boolean);

  // Find gaps: sessions that appear in commit log but not in SESSION_CONTEXT.md
  const gaps = [];
  for (const session of loggedSessions) {
    if (session === currentSession) continue; // Current session is in progress
    if (!documentedSessions.includes(session)) {
      gaps.push({
        session: session,
        commits: sessionGroups[String(session)] || [],
      });
    }
  }

  // Separate unattributed commits (seeded/historical vs unknown)
  const unattributedCommits = [
    ...(sessionGroups["unknown"] || []),
    ...(sessionGroups["null"] || []),
  ];
  const seededCount = unattributedCommits.filter((c) => c.seeded).length;
  const unknownCount = unattributedCommits.length - seededCount;

  // Report
  console.log(`Source: ${source}`);
  console.log(`Total commits in log: ${commits.length}`);
  console.log(`Documented sessions in SESSION_CONTEXT.md: ${documentedSessions.length}`);
  console.log(`Current session: #${currentSession || "?"}`);

  if (gaps.length === 0 && unknownCount === 0) {
    console.log("\n\u2705 No session gaps detected");
    if (seededCount > 0) {
      console.log(
        `   (${seededCount} historical/seeded commits without session attribution — expected)`
      );
    }
    process.exit(0);
  }

  if (gaps.length > 0) {
    console.log(`\n\u26A0\uFE0F  ${gaps.length} undocumented session(s) found:`);
    for (const gap of gaps) {
      console.log(`\n  Session #${gap.session}: ${gap.commits.length} commits`);
      for (const c of gap.commits.slice(0, 5)) {
        console.log(`    ${c.shortHash || "?"} ${(c.message || "").slice(0, 70)}`);
      }
      if (gap.commits.length > 5) {
        console.log(`    ... and ${gap.commits.length - 5} more`);
      }
    }
  }

  if (unknownCount > 0) {
    console.log(
      `\n  \u2753 ${unknownCount} recent commits with no session number (hook may not have been active)`
    );
  }

  if (seededCount > 0) {
    console.log(
      `   (${seededCount} historical/seeded commits without session attribution — expected)`
    );
  }

  // In fix mode, generate suggested summaries
  if (fixMode && gaps.length > 0) {
    console.error("\n--- SUGGESTED SESSION SUMMARIES ---\n");
    for (const gap of gaps) {
      console.error(generateSummary(gap.session, gap.commits));
      console.error("");
    }
    console.error("--- END SUGGESTIONS ---");
  }

  process.exit(gaps.length > 0 ? 1 : 0);
}

main();
