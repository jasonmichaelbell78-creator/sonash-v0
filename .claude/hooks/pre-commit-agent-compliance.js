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
const { execSync } = require("node:child_process");

const ROOT = join(__dirname, "../..");

// File patterns that require agent review
const CODE_PATTERNS = /\.(ts|tsx|js|jsx)$/;
const SECURITY_PATTERNS =
  /(firestore\.rules|middleware\.ts|functions\/src\/.*\.(ts|js)$|lib\/auth[/-]|security-wrapper)/;
const EXCLUDE_PATTERNS = /\.(test|spec)\.(ts|tsx|js|jsx)$|__tests__|node_modules|\.claude\//;

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("error", () => process.exit(0));
process.stdin.on("data", (chunk) => {
  input += chunk;
  if (input.length > 1024 * 1024) process.exit(0);
});
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const command = (data.tool_input && data.tool_input.command) || "";

    // Only inspect git commit commands
    if (!/\bgit\b/i.test(command) || !/\bcommit\b/i.test(command)) {
      process.exit(0);
    }

    // Skip if --no-verify is used (user explicitly bypassing)
    if (/--no-verify/.test(command)) {
      process.exit(0);
    }

    // Get staged files
    let stagedFiles = [];
    try {
      const output = execSync("git diff --cached --name-only --diff-filter=ACM", {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 15000,
      });
      stagedFiles = output.trim().split("\n").filter(Boolean);
    } catch {
      process.exit(0); // Can't determine staged files — allow
    }

    // Check what types of files are staged
    const hasCodeFiles = stagedFiles.some(
      (f) => CODE_PATTERNS.test(f) && !EXCLUDE_PATTERNS.test(f)
    );
    const hasSecurityFiles = stagedFiles.some(
      (f) => SECURITY_PATTERNS.test(f) && !EXCLUDE_PATTERNS.test(f)
    );

    if (!hasCodeFiles && !hasSecurityFiles) {
      process.exit(0); // No files requiring agent review
    }

    // Read session agents
    const statePath = join(ROOT, ".claude/hooks/.session-agents.json");
    if (!existsSync(statePath)) {
      process.exit(0); // No tracking data — allow (first commit of session)
    }

    let invokedAgents = [];
    try {
      const state = JSON.parse(readFileSync(statePath, "utf8"));
      invokedAgents = Array.isArray(state.agentsInvoked)
        ? state.agentsInvoked
            .map((a) => (a && typeof a.agent === "string" ? a.agent : null))
            .filter(Boolean)
        : [];
    } catch {
      process.exit(0); // Can't read state — allow
    }

    // Check compliance
    const issues = [];

    if (hasCodeFiles && !invokedAgents.includes("code-reviewer")) {
      issues.push("Code files staged but code-reviewer not invoked this session");
    }

    if (hasSecurityFiles && !invokedAgents.includes("security-auditor")) {
      issues.push("Security-sensitive files staged but security-auditor not invoked");
    }

    if (issues.length === 0) {
      process.exit(0);
    }

    // Block the commit
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
  } catch {
    // Parse errors or unexpected issues — fail open
    process.exit(0);
  }
});
