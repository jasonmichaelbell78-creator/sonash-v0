#!/usr/bin/env node
/**
 * check-agent-compliance.js - Pre-commit verification of agent usage
 *
 * Checks if code files are being committed and verifies that appropriate
 * agents were invoked during the session.
 *
 * Session #101: Part of agent/skill compliance enforcement system
 *
 * Exit codes:
 *   0 = OK (no issues or agents were used)
 *   1 = Warning (agents recommended but not used) - non-blocking by default
 *
 * Options:
 *   --strict    Exit with code 1 if agents weren't used (blocking)
 *   --quiet     Suppress output
 */

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// Parse args
const args = process.argv.slice(2);
const STRICT = args.includes("--strict");
const QUIET = args.includes("--quiet");

// File patterns that require agent review
const CODE_PATTERNS = /\.(ts|tsx|js|jsx)$/;
const SECURITY_PATTERNS = /(firestore\.rules|middleware\.ts|functions\/src\/)/;
const EXCLUDE_PATTERNS = /\.(test|spec)\.(ts|tsx|js|jsx)$|__tests__|node_modules|\.claude\//;

// Expected agents for file types
const AGENT_EXPECTATIONS = {
  code: {
    pattern: CODE_PATTERNS,
    exclude: EXCLUDE_PATTERNS,
    agent: "code-reviewer",
    message: "Code files modified - code-reviewer agent recommended",
  },
  security: {
    pattern: SECURITY_PATTERNS,
    exclude: /\.test\.|\.spec\./,
    agent: "security-auditor",
    message: "Security-sensitive files modified - security-auditor agent recommended",
  },
};

/**
 * Get staged files
 */
function getStagedFiles() {
  try {
    const output = execSync("git diff --cached --name-only", {
      cwd: ROOT,
      encoding: "utf8",
    });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Read session agents state
 */
function getInvokedAgents() {
  const statePath = join(ROOT, ".claude/hooks/.session-agents.json");
  try {
    if (!existsSync(statePath)) return [];
    const state = JSON.parse(readFileSync(statePath, "utf8"));
    return (state.agentsInvoked || []).map((a) => a.agent);
  } catch {
    return [];
  }
}

/**
 * Check agent compliance
 */
function checkCompliance() {
  const stagedFiles = getStagedFiles();
  const invokedAgents = getInvokedAgents();
  const issues = [];

  // Check each expectation
  for (const [type, expectation] of Object.entries(AGENT_EXPECTATIONS)) {
    const matchingFiles = stagedFiles.filter((file) => {
      if (!expectation.pattern.test(file)) return false;
      if (expectation.exclude && expectation.exclude.test(file)) return false;
      return true;
    });

    if (matchingFiles.length > 0) {
      const agentUsed = invokedAgents.includes(expectation.agent);
      if (!agentUsed) {
        issues.push({
          type,
          agent: expectation.agent,
          message: expectation.message,
          files: matchingFiles.slice(0, 5), // Show first 5
          fileCount: matchingFiles.length,
        });
      }
    }
  }

  return issues;
}

// Main
function main() {
  const issues = checkCompliance();

  if (issues.length === 0) {
    if (!QUIET) {
      console.log("✅ Agent compliance check passed");
    }
    process.exit(0);
  }

  // Report issues
  if (!QUIET) {
    console.log("");
    console.log("⚠️  AGENT COMPLIANCE CHECK");
    console.log("━".repeat(40));

    for (const issue of issues) {
      console.log(`\n📋 ${issue.type.toUpperCase()}: ${issue.message}`);
      console.log(`   Expected agent: ${issue.agent}`);
      console.log(`   Files (${issue.fileCount}):`);
      for (const file of issue.files) {
        console.log(`     - ${file}`);
      }
      if (issue.fileCount > 5) {
        console.log(`     ... and ${issue.fileCount - 5} more`);
      }
    }

    console.log("\n━".repeat(40));

    if (STRICT) {
      console.log("❌ BLOCKING: Run the recommended agents before committing");
      console.log("   Or use --no-verify to bypass (not recommended)");
    } else {
      console.log("⚠️  WARNING: Consider running the recommended agents");
      console.log("   This is currently non-blocking (Phase 1)");
    }

    console.log("");
  }

  process.exit(STRICT ? 1 : 0);
}

main();
