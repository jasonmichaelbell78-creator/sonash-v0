#!/usr/bin/env node
/**
 * Event-Based Trigger Checker
 *
 * Checks for conditions that trigger required actions before push.
 * Replaces time-based triggers with event-based triggers.
 *
 * Triggers:
 *   - security_audit: Security-sensitive files modified
 *   - consolidation: Review count threshold exceeded
 *   - skill_validation: Skill files modified
 *
 * Usage:
 *   node scripts/check-triggers.js [--blocking-only]
 *
 * Exit codes:
 *   0 - No blocking triggers, safe to proceed
 *   1 - Blocking triggers detected, action required
 *   2 - Script error
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const TRIGGERS = {
  security_audit: {
    severity: "blocking",
    description: "Security-sensitive files modified",
    patterns: [
      /auth/i,
      /token/i,
      /credential/i,
      /secret/i,
      /password/i,
      /apikey/i,
      /api-key/i,
      /jwt/i,
      /oauth/i,
      // Note: /session/i removed - too broad (matches session-start.sh, SESSION_CONTEXT.md, etc.)
      // Session-related security concerns are covered by /auth/i and /token/i
      /encrypt/i,
      /crypto/i,
    ],
    action: "Run: npm run audit-security OR use security-auditor agent",
  },
  consolidation: {
    severity: "warning",
    description: "Review consolidation may be needed",
    threshold: 8, // Warn when 2 away from 10 threshold
    action: "Check: npm run consolidation:check",
  },
  skill_validation: {
    severity: "warning",
    description: "Skill/agent files modified",
    paths: [".claude/skills/", ".claude/commands/"],
    action: "Validate skill structure and test invocation",
  },
};

// Get staged files for push
function getStagedFiles() {
  try {
    // Use git merge-base for reliable branch divergence detection
    // This finds the common ancestor between HEAD and origin/main
    const mergeBase = execSync("git merge-base HEAD origin/main 2>/dev/null", {
      encoding: "utf-8",
    }).trim();

    const output = execSync(`git diff --name-only ${mergeBase}..HEAD`, {
      encoding: "utf-8",
    });
    return output.split("\n").filter((f) => f.trim());
  } catch {
    // Fallback 1: try simple diff against origin/main
    try {
      const output = execSync("git diff --name-only origin/main..HEAD 2>/dev/null", {
        encoding: "utf-8",
      });
      return output.split("\n").filter((f) => f.trim());
    } catch {
      // Fallback 2: get files in last commit
      try {
        const output = execSync("git diff --name-only HEAD~1", { encoding: "utf-8" });
        return output.split("\n").filter((f) => f.trim());
      } catch {
        return [];
      }
    }
  }
}

// Check security trigger
function checkSecurityTrigger(files) {
  const trigger = TRIGGERS.security_audit;
  const matches = [];

  // Only check code files, not docs/audits/configs
  const codeExtensions = /\.(ts|tsx|js|jsx|py|sh|go|rs|rb|php|java|kt|swift)$/i;
  const excludePaths = [
    /^docs\//i,
    /^\.claude\/commands\//i,
    /^\.claude\/skills\//i,
    /^\.claude\/hooks\//i,
    /^\.husky\//i,
    /^scripts\//i, // Scripts are infrastructure, not app code
    /node_modules\//i,
    /\.md$/i,
    /\.jsonl$/i,
  ];

  for (const file of files) {
    // Skip non-code files and excluded paths
    if (!codeExtensions.test(file)) continue;
    if (excludePaths.some((p) => p.test(file))) continue;

    const fileLower = file.toLowerCase();
    for (const pattern of trigger.patterns) {
      if (pattern.test(fileLower)) {
        matches.push({ file, pattern: pattern.toString() });
        break; // One match per file is enough
      }
    }
  }

  if (matches.length > 0) {
    return {
      triggered: true,
      name: "security_audit",
      severity: trigger.severity,
      description: trigger.description,
      action: trigger.action,
      details: matches.map((m) => `  - ${m.file}`).join("\n"),
    };
  }

  return { triggered: false, name: "security_audit" };
}

// Check consolidation trigger
function checkConsolidationTrigger() {
  const trigger = TRIGGERS.consolidation;

  try {
    // Run consolidation check and parse output
    const output = execSync("npm run consolidation:check 2>&1", { encoding: "utf-8" });

    // Look for "X reviews until next consolidation"
    const match = output.match(/(\d+) reviews? until next consolidation/);
    if (match) {
      const remaining = parseInt(match[1], 10);
      if (remaining <= trigger.threshold) {
        return {
          triggered: true,
          name: "consolidation",
          severity: trigger.severity,
          description: trigger.description,
          action: trigger.action,
          details: `  - ${remaining} reviews until consolidation threshold`,
        };
      }
    }

    return { triggered: false, name: "consolidation" };
  } catch {
    // If check fails, don't block
    return { triggered: false, name: "consolidation" };
  }
}

// Check skill validation trigger
function checkSkillValidationTrigger(files) {
  const trigger = TRIGGERS.skill_validation;
  const matches = [];

  for (const file of files) {
    for (const pathPrefix of trigger.paths) {
      if (file.startsWith(pathPrefix)) {
        matches.push(file);
        break;
      }
    }
  }

  if (matches.length > 0) {
    return {
      triggered: true,
      name: "skill_validation",
      severity: trigger.severity,
      description: trigger.description,
      action: trigger.action,
      details: matches.map((f) => `  - ${f}`).join("\n"),
    };
  }

  return { triggered: false, name: "skill_validation" };
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const blockingOnly = args.includes("--blocking-only");

  // Check for SKIP_TRIGGERS override (documented in SKILL_AGENT_POLICY.md)
  if (process.env.SKIP_TRIGGERS === "1") {
    console.log("⚠️  SKIP_TRIGGERS=1 detected - skipping trigger checks");
    console.log("   (Override logged for audit trail)\n");

    // Log the override for accountability
    try {
      const { execSync } = require("child_process");
      const reason = process.env.SKIP_REASON || "";
      execSync(
        `node scripts/log-override.js --check=triggers --reason="${reason.replace(/"/g, '\\"')}"`,
        {
          encoding: "utf-8",
          stdio: "inherit",
        }
      );
    } catch {
      // Non-fatal - continue even if logging fails
      console.log("   (Note: Override logging failed, but continuing)\n");
    }

    process.exit(0);
  }

  console.log("🔍 Checking event-based triggers...\n");

  const files = getStagedFiles();
  if (files.length === 0) {
    console.log("   No files to check.\n");
    process.exit(0);
  }

  const results = [];

  // Run all trigger checks
  results.push(checkSecurityTrigger(files));
  results.push(checkConsolidationTrigger());
  results.push(checkSkillValidationTrigger(files));

  // Filter and display results
  const triggered = results.filter((r) => r.triggered);
  const blocking = triggered.filter((r) => r.severity === "blocking");
  const warnings = triggered.filter((r) => r.severity === "warning");

  if (triggered.length === 0) {
    console.log("   ✅ No triggers activated\n");
    process.exit(0);
  }

  // Display blocking triggers
  if (blocking.length > 0) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚫 BLOCKING TRIGGERS (action required before push):");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    for (const trigger of blocking) {
      console.log(`❌ ${trigger.description}`);
      console.log(`   Action: ${trigger.action}`);
      if (trigger.details) {
        console.log(`   Files:\n${trigger.details}`);
      }
      console.log("");
    }
  }

  // Display warning triggers
  if (warnings.length > 0 && !blockingOnly) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚠️  WARNING TRIGGERS (recommended actions):");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    for (const trigger of warnings) {
      console.log(`⚠️  ${trigger.description}`);
      console.log(`   Action: ${trigger.action}`);
      if (trigger.details) {
        console.log(`   Details:\n${trigger.details}`);
      }
      console.log("");
    }
  }

  // Exit with appropriate code
  if (blocking.length > 0) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Push blocked. Complete required actions or use SKIP_TRIGGERS=1 to override.");
    console.log("(Overrides are logged for audit trail)");
    process.exit(1);
  }

  process.exit(0);
}

main();
