/* global __dirname */
/**
 * check-roadmap-hygiene.js
 *
 * Validates ROADMAP.md hygiene:
 *  1. Completed items ([x]) should be archived to ROADMAP_LOG.md (DEBT-2839)
 *  2. SESSION_CONTEXT.md priorities should reflect ROADMAP.md (DEBT-2840)
 *  3. Reports items that git log suggests are complete (DEBT-2837)
 *  4. Lists completed items ready for archival (DEBT-2838)
 *
 * Usage:
 *   node scripts/check-roadmap-hygiene.js [--json] [--verbose]
 *
 * Exit codes: 0 = clean, 1 = issues found, 2 = error
 */

const { readFileSync } = require("fs");
const { execFileSync } = require("child_process");
const { resolve } = require("path");

const ROOT = resolve(__dirname, "..");
const args = process.argv.slice(2);
const jsonOutput = args.includes("--json");
const verbose = args.includes("--verbose");

function readFile(relPath) {
  try {
    return readFileSync(resolve(ROOT, relPath), "utf-8");
  } catch {
    return null;
  }
}

function log(msg) {
  if (!jsonOutput) console.log(msg);
}

function vlog(msg) {
  if (verbose && !jsonOutput) console.log(`  [verbose] ${msg}`);
}

// ── 1. Parse ROADMAP.md for completed items ─────────────────────────────────
function findCompletedItems(roadmapContent) {
  const completed = [];
  const lines = roadmapContent.split("\n");
  let currentTrack = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trackMatch = line.match(/^###\s+(.+)/);
    if (trackMatch) {
      currentTrack = trackMatch[1].trim();
      continue;
    }
    const itemMatch = line.match(/^-\s+\[x\]\s+\*\*(.+?)\*\*[:\s]*(.*)/i);
    if (itemMatch) {
      completed.push({
        id: itemMatch[1].trim(),
        description: itemMatch[2].trim().slice(0, 80),
        track: currentTrack,
        line: i + 1,
      });
    }
  }
  return completed;
}

// ── 2. Parse ROADMAP.md for open items ──────────────────────────────────────
function findOpenItems(roadmapContent) {
  const open = [];
  const lines = roadmapContent.split("\n");
  let currentTrack = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trackMatch = line.match(/^###\s+(.+)/);
    if (trackMatch) {
      currentTrack = trackMatch[1].trim();
      continue;
    }
    const itemMatch = line.match(/^-\s+\[\s\]\s+\*\*(.+?)\*\*[:\s]*(.*)/);
    if (itemMatch) {
      open.push({
        id: itemMatch[1].trim(),
        description: itemMatch[2].trim().slice(0, 80),
        track: currentTrack,
        line: i + 1,
      });
    }
  }
  return open;
}

// ── 3. Check if completed items exist in ROADMAP_LOG.md ─────────────────────
function checkArchived(completedItems, logContent) {
  const unarchived = [];
  for (const item of completedItems) {
    // Check if item ID appears in ROADMAP_LOG.md
    if (!logContent.includes(item.id)) {
      unarchived.push(item);
    }
  }
  return unarchived;
}

// ── 4. Check SESSION_CONTEXT.md reflects ROADMAP active sprint ──────────────
function checkSessionContextSync(roadmapContent, sessionContent) {
  const issues = [];

  // Extract sprint tracks section from ROADMAP (various heading formats)
  const sprintMatch = roadmapContent.match(
    /###?\s+Sprint Tracks[^\n]*\n([\s\S]*?)(?=\n## [^#]|\n---\n|$)/
  );
  if (!sprintMatch) {
    issues.push("Cannot find Active Sprint section in ROADMAP.md");
    return issues;
  }

  // Extract track names from Active Sprint
  const trackNames = [];
  const trackRegex = /###\s+(Track\s+\w[^\n]*)/g;
  let match;
  while ((match = trackRegex.exec(sprintMatch[1])) !== null) {
    trackNames.push(match[1].trim());
  }

  // Check if SESSION_CONTEXT.md mentions any active tracks
  if (trackNames.length > 0) {
    const mentionedTracks = trackNames.filter((t) => {
      const shortName = t.split("-")[0].trim();
      return sessionContent.includes(shortName);
    });
    if (mentionedTracks.length === 0) {
      issues.push(
        `SESSION_CONTEXT.md doesn't mention any active ROADMAP tracks (${trackNames.length} tracks active)`
      );
    }
  }

  return issues;
}

// ── 5. Scan recent commits for potential completions (DEBT-2837) ────────────
function scanCommitsForCompletions(openItems) {
  const candidates = [];

  let gitLog;
  try {
    gitLog = execFileSync("git", ["log", "--oneline", "-50", "--format=%s"], {
      cwd: ROOT,
      encoding: "utf-8",
      maxBuffer: 5 * 1024 * 1024,
    });
  } catch {
    return candidates;
  }

  const commits = gitLog.trim().split("\n").filter(Boolean);

  for (const item of openItems) {
    // Check if any commit message references this item's ID
    const id = item.id.replace(/[*:]/g, "");
    const idLower = id.toLowerCase();
    for (const commit of commits) {
      if (commit.toLowerCase().includes(idLower)) {
        candidates.push({
          ...item,
          commitMessage: commit.slice(0, 80),
          reason: `Commit references "${id}"`,
        });
        break;
      }
    }
  }
  return candidates;
}

// ── Main ────────────────────────────────────────────────────────────────────
function main() {
  const roadmap = readFile("ROADMAP.md");
  const roadmapLog = readFile("ROADMAP_LOG.md");
  const sessionContext = readFile("SESSION_CONTEXT.md");

  if (!roadmap) {
    console.error("Error: ROADMAP.md not found");
    process.exit(2);
  }

  const results = {
    unarchivedCompleted: [],
    syncIssues: [],
    completionCandidates: [],
    totalCompleted: 0,
    totalOpen: 0,
  };

  // Find completed and open items
  const completed = findCompletedItems(roadmap);
  const open = findOpenItems(roadmap);
  results.totalCompleted = completed.length;
  results.totalOpen = open.length;

  log("ROADMAP Hygiene Check");
  log("=====================");
  log(`  Completed items: ${completed.length}`);
  log(`  Open items: ${open.length}`);
  log("");

  // DEBT-2839: Check unarchived completed items
  if (roadmapLog) {
    results.unarchivedCompleted = checkArchived(completed, roadmapLog);
    if (results.unarchivedCompleted.length > 0) {
      log(`⚠️  ${results.unarchivedCompleted.length} completed items NOT in ROADMAP_LOG.md:`);
      for (const item of results.unarchivedCompleted) {
        log(`  - ${item.id} (${item.track}, line ${item.line})`);
        vlog(`    ${item.description}`);
      }
    } else {
      log("✅ All completed items archived to ROADMAP_LOG.md");
    }
  } else {
    log("⚠️  ROADMAP_LOG.md not found — cannot check archival status");
  }
  log("");

  // DEBT-2840: Check SESSION_CONTEXT sync
  if (sessionContext) {
    results.syncIssues = checkSessionContextSync(roadmap, sessionContext);
    if (results.syncIssues.length > 0) {
      log("⚠️  SESSION_CONTEXT.md sync issues:");
      for (const issue of results.syncIssues) {
        log(`  - ${issue}`);
      }
    } else {
      log("✅ SESSION_CONTEXT.md references active ROADMAP tracks");
    }
  } else {
    log("⚠️  SESSION_CONTEXT.md not found");
  }
  log("");

  // DEBT-2837: Scan commits for potential completions
  results.completionCandidates = scanCommitsForCompletions(open);
  if (results.completionCandidates.length > 0) {
    log(
      `📋 ${results.completionCandidates.length} open items may be complete (referenced in recent commits):`
    );
    for (const c of results.completionCandidates) {
      log(`  - ${c.id}: "${c.commitMessage}"`);
    }
  } else {
    log("✅ No open items detected as potentially complete");
  }

  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
  }

  // Exit code: 1 if issues found
  const hasIssues =
    results.unarchivedCompleted.length > 0 ||
    results.syncIssues.length > 0 ||
    results.completionCandidates.length > 0;

  process.exit(hasIssues ? 1 : 0);
}

main();
