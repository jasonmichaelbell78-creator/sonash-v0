#!/usr/bin/env node
/**
 * Skill Usage Verifier
 *
 * Verifies that expected skills/agents were used based on session activity.
 * Uses session activity log to determine what work was done and checks
 * if appropriate skills were invoked.
 *
 * Rules:
 *   - code-reviewer: Should be used after writing code files
 *   - systematic-debugging: Should be used when fixing bugs
 *   - security-auditor: Should be used when modifying auth/security code
 *   - test-engineer: Should be used after adding tests
 *
 * Usage:
 *   node scripts/verify-skill-usage.js
 *   node scripts/verify-skill-usage.js --strict  # Return exit code 1 if violations
 *
 * Exit codes:
 *   0 - All expected skills used (or warnings only in non-strict mode)
 *   1 - Missing expected skills (strict mode)
 *   2 - Script error
 */

const fs = require("fs");
const path = require("path");

// Configuration
const SESSION_LOG = path.join(process.cwd(), ".claude", "session-activity.jsonl");

// Skill usage rules
const USAGE_RULES = [
  {
    name: "code-reviewer",
    trigger: (events) => {
      const codeExts = /\.(ts|tsx|js|jsx)$/i;
      const fileEvents = events.filter((e) => e.event === "file_write" || e.event === "file_edit");
      return fileEvents.some((e) => e.file && codeExts.test(e.file) && !e.file.includes("test"));
    },
    description: "Code files were modified",
    recommendation: "Run code-reviewer agent before committing",
    severity: "warning",
  },
  {
    name: "security-auditor",
    trigger: (events) => {
      const securityKeywords = /auth|token|credential|secret|password|jwt|session/i;
      const fileEvents = events.filter((e) => e.event === "file_write" || e.event === "file_edit");
      return fileEvents.some((e) => e.file && securityKeywords.test(e.file));
    },
    description: "Security-sensitive files were modified",
    recommendation: "Run security-auditor agent before committing",
    severity: "blocking",
  },
  {
    name: "test-engineer",
    trigger: (events) => {
      const testPattern = /\.(test|spec)\.(ts|tsx|js|jsx)$/i;
      const fileEvents = events.filter((e) => e.event === "file_write" || e.event === "file_edit");
      return fileEvents.some((e) => e.file && testPattern.test(e.file));
    },
    description: "Test files were added or modified",
    recommendation: "Consider running test-engineer agent to validate test strategy",
    severity: "suggestion",
  },
];

// Read session activity log
function readSessionLog() {
  if (!fs.existsSync(SESSION_LOG)) {
    return [];
  }

  const content = fs.readFileSync(SESSION_LOG, "utf-8");
  return content
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// Get current session events (since last session_start)
function getCurrentSessionEvents(events) {
  let sessionStartIndex = -1;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].event === "session_start") {
      sessionStartIndex = i;
      break;
    }
  }

  if (sessionStartIndex === -1) {
    return events;
  }

  return events.slice(sessionStartIndex);
}

// Check skill usage
function verifySkillUsage(events) {
  const results = [];

  // Get skills that were invoked
  const invokedSkills = new Set(
    events.filter((e) => e.event === "skill_invoke" && e.skill).map((e) => e.skill.toLowerCase())
  );

  // Check each rule
  for (const rule of USAGE_RULES) {
    if (rule.trigger(events)) {
      const wasInvoked = invokedSkills.has(rule.name.toLowerCase());

      if (!wasInvoked) {
        results.push({
          skill: rule.name,
          description: rule.description,
          recommendation: rule.recommendation,
          severity: rule.severity,
          missing: true,
        });
      }
    }
  }

  return results;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict");
  const quiet = args.includes("--quiet");

  // Read session log
  const allEvents = readSessionLog();
  const sessionEvents = getCurrentSessionEvents(allEvents);

  if (sessionEvents.length === 0) {
    if (!quiet) {
      console.log("📊 No session activity logged yet.\n");
    }
    process.exit(0);
  }

  // Verify skill usage
  const violations = verifySkillUsage(sessionEvents);

  if (violations.length === 0) {
    if (!quiet) {
      console.log("✅ All expected skills were used appropriately.\n");
    }
    process.exit(0);
  }

  // Group by severity
  const blocking = violations.filter((v) => v.severity === "blocking");
  const warnings = violations.filter((v) => v.severity === "warning");
  const suggestions = violations.filter((v) => v.severity === "suggestion");

  if (!quiet) {
    console.log("📊 SKILL USAGE VERIFICATION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    if (blocking.length > 0) {
      console.log("🚫 REQUIRED SKILLS NOT USED:");
      for (const v of blocking) {
        console.log(`   ❌ ${v.skill}`);
        console.log(`      Reason: ${v.description}`);
        console.log(`      Action: ${v.recommendation}\n`);
      }
    }

    if (warnings.length > 0) {
      console.log("⚠️  RECOMMENDED SKILLS NOT USED:");
      for (const v of warnings) {
        console.log(`   ⚠️  ${v.skill}`);
        console.log(`      Reason: ${v.description}`);
        console.log(`      Action: ${v.recommendation}\n`);
      }
    }

    if (suggestions.length > 0) {
      console.log("💡 SUGGESTED SKILLS:");
      for (const v of suggestions) {
        console.log(`   💡 ${v.skill}`);
        console.log(`      Reason: ${v.description}`);
        console.log(`      Action: ${v.recommendation}\n`);
      }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
      `Summary: ${blocking.length} required, ${warnings.length} recommended, ${suggestions.length} suggested\n`
    );
  }

  // Exit code depends on mode and severity
  if (strict && (blocking.length > 0 || warnings.length > 0)) {
    process.exit(1);
  }

  if (blocking.length > 0) {
    process.exit(1);
  }

  process.exit(0);
}

main();
