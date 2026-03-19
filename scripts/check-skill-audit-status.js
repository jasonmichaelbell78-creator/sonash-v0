#!/usr/bin/env node
/* global __dirname */
/**
 * Skill Audit Status Checker
 *
 * Lists all skills and their audit status:
 *   - State file existence
 *   - SKILL.md version history audit entry
 *   - Last audit date and days since audit
 *
 * Usage:
 *   node scripts/check-skill-audit-status.js
 *
 * Exit codes:
 *   0 - Report generated successfully
 *   2 - Script error
 */

const fs = require("node:fs");
const path = require("node:path");
const { sanitizeError } = require("./lib/sanitize-error");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const SKILLS_DIR = path.join(PROJECT_ROOT, ".claude", "skills");
const STATE_DIR = path.join(PROJECT_ROOT, ".claude", "state");

/**
 * Get all skill directory names.
 * @returns {string[]} Sorted array of skill names
 */
function getSkillNames() {
  try {
    const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("_") && !e.name.startsWith("."))
      .map((e) => e.name)
      .sort();
  } catch (err) {
    console.error(`Error reading skills directory: ${sanitizeError(err)}`);
    process.exit(2);
  }
}

/**
 * Check if a state file exists for a skill and extract audit date + decisions.
 * @param {string} skillName
 * @returns {{ exists: boolean, date: string|null, decisions: number|null, score: number|null }}
 */
function checkStateFile(skillName) {
  const statePath = path.join(STATE_DIR, `task-skill-audit-${skillName}.state.json`);
  try {
    if (!fs.existsSync(statePath)) {
      return { exists: false, date: null, decisions: null, score: null };
    }
    const raw = fs.readFileSync(statePath, "utf8");
    const data = JSON.parse(raw);
    const date = data.audit_date || (data.updated ? data.updated.slice(0, 10) : null);
    const decisions = typeof data.total_decisions === "number" ? data.total_decisions : null;
    const score = typeof data.overall_score === "number" ? data.overall_score : null;
    return { exists: true, date, decisions, score };
  } catch {
    return { exists: false, date: null, decisions: null, score: null };
  }
}

/**
 * Search SKILL.md version history for audit entries.
 * @param {string} skillName
 * @returns {{ found: boolean, date: string|null, description: string|null }}
 */
function checkVersionHistory(skillName) {
  const skillPath = path.join(SKILLS_DIR, skillName, "SKILL.md");
  try {
    if (!fs.existsSync(skillPath)) {
      return { found: false, date: null, description: null };
    }
    const content = fs.readFileSync(skillPath, "utf8");

    // Find Version History section
    const vhMatch = content.match(/## Version History[\s\S]*?\|[\s\S]*?\|/);
    if (!vhMatch) {
      return { found: false, date: null, description: null };
    }

    const vhSection = content.slice(content.indexOf("## Version History"));

    // Match table rows and find audit entries (case-insensitive)
    const auditPattern =
      /\|\s*[\d.]+\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.*?[Ss]kill[- ]?audit.*?)\s*\|/gi;
    let match;
    let latestDate = null;
    let latestDesc = null;

    // Reset lastIndex for safety with /g flag
    auditPattern.lastIndex = 0;
    while ((match = auditPattern.exec(vhSection)) !== null) {
      const date = match[1];
      const desc = match[2].trim();
      if (!latestDate || date > latestDate) {
        latestDate = date;
        latestDesc = desc;
      }
    }

    // Also check for entries with just "audit" keyword (broader match)
    if (!latestDate) {
      const broadPattern = /\|\s*[\d.]+\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.*?\baudit\b.*?)\s*\|/gi;
      broadPattern.lastIndex = 0;
      while ((match = broadPattern.exec(vhSection)) !== null) {
        const date = match[1];
        const desc = match[2].trim();
        // Skip entries that are about "audit-" prefixed features or self-audit phases
        if (/\bself[- ]audit\b/i.test(desc) && !/skill[- ]?audit/i.test(desc)) {
          continue;
        }
        if (/\baudit checkpoint/i.test(desc) && !/skill[- ]?audit/i.test(desc)) {
          continue;
        }
        if (!latestDate || date > latestDate) {
          latestDate = date;
          latestDesc = desc;
        }
      }
    }

    if (latestDate) {
      return { found: true, date: latestDate, description: latestDesc };
    }
    return { found: false, date: null, description: null };
  } catch {
    return { found: false, date: null, description: null };
  }
}

/**
 * Calculate days between a date string and today.
 * @param {string} dateStr YYYY-MM-DD
 * @returns {number}
 */
function daysSince(dateStr) {
  const then = new Date(dateStr + "T00:00:00Z");
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Pad or truncate a string to a fixed width.
 * @param {string} str
 * @param {number} width
 * @returns {string}
 */
function pad(str, width) {
  if (str.length >= width) return str.slice(0, width);
  return str + " ".repeat(width - str.length);
}

/**
 * Right-align a string to a fixed width.
 * @param {string} str
 * @param {number} width
 * @returns {string}
 */
function rpad(str, width) {
  if (str.length >= width) return str.slice(0, width);
  return " ".repeat(width - str.length) + str;
}

// ---- Main ----
function main() {
  const skills = getSkillNames();
  const rows = [];

  let audited = 0;
  let withState = 0;
  let withHistory = 0;

  for (const name of skills) {
    const state = checkStateFile(name);
    const history = checkVersionHistory(name);

    const lastDate = state.date || history.date || null;
    const days = lastDate ? daysSince(lastDate) : null;
    const hasAudit = state.exists || history.found;

    if (hasAudit) audited++;
    if (state.exists) withState++;
    if (history.found) withHistory++;

    rows.push({
      name,
      lastDate: lastDate || "-",
      days: days !== null ? String(days) : "-",
      stateFile: state.exists ? "YES" : "NO",
      versionHistory: history.found ? "YES" : "NO",
      decisions: state.decisions !== null ? String(state.decisions) : "-",
      score: state.score !== null ? String(state.score) : "-",
    });
  }

  // Print header
  const nameW = 32;
  const dateW = 12;
  const daysW = 6;
  const stateW = 6;
  const vhW = 8;
  const decW = 5;
  const scoreW = 5;

  console.log("");
  console.log("Skill Audit Status Report");
  console.log("=".repeat(nameW + dateW + daysW + stateW + vhW + decW + scoreW + 18));
  console.log(
    `${pad("Skill", nameW)} | ${pad("Last Audit", dateW)} | ${rpad("Days", daysW)} | ${pad("State", stateW)} | ${pad("History", vhW)} | ${rpad("Dec", decW)} | ${rpad("Score", scoreW)}`
  );
  console.log(
    `${"-".repeat(nameW)} | ${"-".repeat(dateW)} | ${"-".repeat(daysW)} | ${"-".repeat(stateW)} | ${"-".repeat(vhW)} | ${"-".repeat(decW)} | ${"-".repeat(scoreW)}`
  );

  for (const row of rows) {
    console.log(
      `${pad(row.name, nameW)} | ${pad(row.lastDate, dateW)} | ${rpad(row.days, daysW)} | ${pad(row.stateFile, stateW)} | ${pad(row.versionHistory, vhW)} | ${rpad(row.decisions, decW)} | ${rpad(row.score, scoreW)}`
    );
  }

  console.log(
    `${"-".repeat(nameW)} | ${"-".repeat(dateW)} | ${"-".repeat(daysW)} | ${"-".repeat(stateW)} | ${"-".repeat(vhW)} | ${"-".repeat(decW)} | ${"-".repeat(scoreW)}`
  );

  // Summary
  console.log("");
  console.log(`Total skills: ${skills.length}`);
  console.log(
    `Audited: ${audited} | With state file: ${withState} | With version history entry: ${withHistory}`
  );
  console.log(`Not audited: ${skills.length - audited}`);

  // Flag skills needing audit (>30 days or never)
  const stale = rows.filter((r) => r.days === "-" || Number(r.days) > 30);
  if (stale.length > 0) {
    console.log("");
    console.log(`Skills needing audit (>30 days or never): ${stale.length}`);
    for (const s of stale) {
      const reason = s.days === "-" ? "never audited" : `${s.days} days ago`;
      console.log(`  - ${s.name} (${reason})`);
    }
  }

  console.log("");
}

main();
