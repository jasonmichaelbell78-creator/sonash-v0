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

/** No-result constant for version history lookups */
const NO_HISTORY_RESULT = { found: false, date: null, description: null };

/**
 * Find the latest match in a section using a regex pattern.
 * @param {string} section - Text to search
 * @param {RegExp} pattern - Must have /g flag; groups: [1]=date, [2]=description
 * @returns {{ date: string|null, desc: string|null }}
 */
function findLatestMatch(section, pattern) {
  pattern.lastIndex = 0;
  let match;
  let latestDate = null;
  let latestDesc = null;

  while ((match = pattern.exec(section)) !== null) {
    const date = match[1];
    const desc = match[2].trim();
    if (!latestDate || date > latestDate) {
      latestDate = date;
      latestDesc = desc;
    }
  }
  return { date: latestDate, desc: latestDesc };
}

/**
 * Check if a broad audit match should be skipped (self-audit or checkpoint without skill-audit).
 * @param {string} desc - The description text
 * @returns {boolean}
 */
function isBroadAuditFalsePositive(desc) {
  const isSkillAudit = /skill[- ]?audit/i.test(desc);
  if (/\bself[- ]audit\b/i.test(desc) && !isSkillAudit) return true;
  if (/\baudit checkpoint/i.test(desc) && !isSkillAudit) return true;
  return false;
}

/**
 * Find the latest broad "audit" match, filtering false positives.
 * @param {string} section
 * @returns {{ date: string|null, desc: string|null }}
 */
function findLatestBroadAudit(section) {
  // SonarCloud S5852: bounded input from markdown table rows (<500 chars), no ReDoS risk
  const broadPattern = /\|\s*[\d.]+\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.*?\baudit\b.*?)\s*\|/gi;
  broadPattern.lastIndex = 0;
  let match;
  let latestDate = null;
  let latestDesc = null;

  while ((match = broadPattern.exec(section)) !== null) {
    const desc = match[2].trim();
    if (isBroadAuditFalsePositive(desc)) continue;
    const date = match[1];
    if (!latestDate || date > latestDate) {
      latestDate = date;
      latestDesc = desc;
    }
  }
  return { date: latestDate, desc: latestDesc };
}

/**
 * Search SKILL.md version history for audit entries.
 * @param {string} skillName
 * @returns {{ found: boolean, date: string|null, description: string|null }}
 */
function checkVersionHistory(skillName) {
  const skillPath = path.join(SKILLS_DIR, skillName, "SKILL.md");
  try {
    if (!fs.existsSync(skillPath)) return NO_HISTORY_RESULT;
    const content = fs.readFileSync(skillPath, "utf8");

    const vhMatch = content.match(/## Version History[\s\S]*?\|[\s\S]*?\|/);
    if (!vhMatch) return NO_HISTORY_RESULT;

    const vhSection = content.slice(content.indexOf("## Version History"));

    // SonarCloud S5852: bounded input from markdown table rows (<500 chars), no ReDoS risk
    const auditPattern =
      /\|\s*[\d.]+\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.*?skill[- ]?audit.*?)\s*\|/gi;
    let { date: latestDate, desc: latestDesc } = findLatestMatch(vhSection, auditPattern);

    // Fall back to broader "audit" keyword match
    if (!latestDate) {
      ({ date: latestDate, desc: latestDesc } = findLatestBroadAudit(vhSection));
    }

    if (latestDate) return { found: true, date: latestDate, description: latestDesc };
    return NO_HISTORY_RESULT;
  } catch {
    return NO_HISTORY_RESULT;
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

// ---- Table formatting ----
const COL_WIDTHS = { name: 32, date: 12, days: 6, state: 6, vh: 8, dec: 5, score: 5 };

/**
 * Format a table row from column values.
 */
function formatRow(row) {
  return `${pad(row.name, COL_WIDTHS.name)} | ${pad(row.lastDate, COL_WIDTHS.date)} | ${rpad(row.days, COL_WIDTHS.days)} | ${pad(row.stateFile, COL_WIDTHS.state)} | ${pad(row.versionHistory, COL_WIDTHS.vh)} | ${rpad(row.decisions, COL_WIDTHS.dec)} | ${rpad(row.score, COL_WIDTHS.score)}`;
}

/**
 * Build a separator line.
 */
function separatorLine() {
  return `${"-".repeat(COL_WIDTHS.name)} | ${"-".repeat(COL_WIDTHS.date)} | ${"-".repeat(COL_WIDTHS.days)} | ${"-".repeat(COL_WIDTHS.state)} | ${"-".repeat(COL_WIDTHS.vh)} | ${"-".repeat(COL_WIDTHS.dec)} | ${"-".repeat(COL_WIDTHS.score)}`;
}

/**
 * Build a row object from skill audit data.
 */
function buildRow(name, state, history) {
  const lastDate = state.date || history.date || null;
  const days = lastDate ? daysSince(lastDate) : null;
  return {
    name,
    lastDate: lastDate || "-",
    days: days === null ? "-" : String(days),
    stateFile: state.exists ? "YES" : "NO",
    versionHistory: history.found ? "YES" : "NO",
    decisions: state.decisions === null ? "-" : String(state.decisions),
    score: state.score === null ? "-" : String(state.score),
    hasAudit: state.exists || history.found,
  };
}

/**
 * Print the table and summary.
 */
function printReport(rows, skills, audited, withState, withHistory) {
  const totalW = Object.values(COL_WIDTHS).reduce((a, b) => a + b, 0) + 18;
  console.log("");
  console.log("Skill Audit Status Report");
  console.log("=".repeat(totalW));
  console.log(
    formatRow({
      name: "Skill",
      lastDate: "Last Audit",
      days: "Days",
      stateFile: "State",
      versionHistory: "History",
      decisions: "Dec",
      score: "Score",
    })
  );
  console.log(separatorLine());

  for (const row of rows) {
    console.log(formatRow(row));
  }

  console.log(separatorLine());
  console.log("");
  console.log(`Total skills: ${skills.length}`);
  console.log(
    `Audited: ${audited} | With state file: ${withState} | With version history entry: ${withHistory}`
  );
  console.log(`Not audited: ${skills.length - audited}`);

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
    const row = buildRow(name, state, history);

    if (row.hasAudit) audited++;
    if (state.exists) withState++;
    if (history.found) withHistory++;
    rows.push(row);
  }

  printReport(rows, skills, audited, withState, withHistory);
}

main();
