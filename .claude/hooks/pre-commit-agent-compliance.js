#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
/* global process, console, require, __dirname */
/**
 * pre-commit-agent-compliance.js - PreToolUse hook (Bash)
 *
 * Fires before git commit commands. Checks that required agents
 * (code-reviewer for code files, security-auditor for auth files)
 * were invoked during this session before allowing the commit.
 *
 * Exit 0 = allow, exit 2 = block with message.
 *
 * Session #226: Decision #27 — strict mode for POST-TASK triggers.
 */

const { readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const { execFileSync } = require("node:child_process");
const { projectDir } = require("./lib/git-utils");

const ROOT = projectDir;

// File patterns that require agent review
const CODE_PATTERNS = /\.(ts|tsx|js|jsx)$/;
const SECURITY_PATTERNS =
  /(firestore\.rules|middleware\.ts|functions\/src\/.*\.(ts|js)$|lib\/auth[/-]|security-wrapper)/;
const EXCLUDE_PATTERNS = /\.(test|spec)\.(ts|tsx|js|jsx)$|__tests__|node_modules|\.claude\//;

function getStagedFiles() {
  try {
    const output = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "--diff-filter=ACM", "--"],
      {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 15000,
      }
    );
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return null; // Can't determine — caller should allow
  }
}

function getInvokedAgents() {
  const statePath = join(ROOT, ".claude/hooks/.session-agents.json");
  if (!existsSync(statePath)) return [];
  try {
    const state = JSON.parse(readFileSync(statePath, "utf8"));
    if (!Array.isArray(state.agentsInvoked)) return [];
    return state.agentsInvoked
      .map((a) => (a && typeof a.agent === "string" ? a.agent : null))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function checkCompliance(stagedFiles, invokedAgents) {
  const issues = [];
  const hasCodeFiles = stagedFiles.some((f) => CODE_PATTERNS.test(f) && !EXCLUDE_PATTERNS.test(f));
  const hasSecurityFiles = stagedFiles.some(
    (f) => SECURITY_PATTERNS.test(f) && !EXCLUDE_PATTERNS.test(f)
  );

  if (hasCodeFiles && !invokedAgents.includes("code-reviewer")) {
    issues.push("Code files staged but code-reviewer not invoked this session");
  }
  if (hasSecurityFiles && !invokedAgents.includes("security-auditor")) {
    issues.push("Security-sensitive files staged but security-auditor not invoked");
  }
  return issues;
}

function reportAndBlock(issues) {
  console.error("");
  console.error("⛔ AGENT COMPLIANCE: Required agents not invoked");
  console.error("━".repeat(50));
  for (const issue of issues) {
    console.error("  - " + issue);
  }
  console.error("");
  console.error("Run the required agents before committing, or use --no-verify to bypass.");
  console.error("");
  process.exit(2);
}

// --- Main: stdin reader ---
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("error", (err) => {
  process.stderr.write(`agent-compliance: stdin error (${err.message}), allowing\n`);
  process.exit(0);
});
const stdinTimeout = setTimeout(() => {
  process.stderr.write("agent-compliance: stdin timeout, allowing\n");
  process.exit(0);
}, 3000);
const overallTimeout = setTimeout(() => {
  process.stderr.write("agent-compliance: overall timeout, allowing\n");
  process.exit(0);
}, 15000);
process.stdin.on("data", (chunk) => {
  clearTimeout(stdinTimeout);
  input += chunk;
  if (input.length > 1024 * 1024) {
    process.stderr.write("agent-compliance: stdin size limit exceeded, allowing\n");
    process.exit(0);
  }
});
process.stdin.on("end", () => {
  clearTimeout(stdinTimeout);
  clearTimeout(overallTimeout);
  try {
    const data = JSON.parse(input);
    const command = (data.tool_input && data.tool_input.command) || "";

    if (!/\bgit\b/i.test(command) || !/\bcommit\b/i.test(command)) process.exit(0);
    if (/--no-verify/.test(command)) process.exit(0);

    const stagedFiles = getStagedFiles();
    if (!stagedFiles) process.exit(0);

    const invokedAgents = getInvokedAgents();

    const issues = checkCompliance(stagedFiles, invokedAgents);
    if (issues.length === 0) process.exit(0);

    reportAndBlock(issues);
  } catch (err) {
    process.stderr.write(
      `agent-compliance: unexpected error (${err instanceof Error ? err.message : String(err)}), allowing\n`
    );
    process.exit(0);
  }
});
