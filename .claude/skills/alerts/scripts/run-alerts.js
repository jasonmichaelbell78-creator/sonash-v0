#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Alerts Skill - System Health Reporter
 *
 * Aggregates alerts from multiple sources and outputs JSON results.
 *
 * Usage:
 *   node run-alerts.js --limited  # Quick health check (default)
 *   node run-alerts.js --full     # Comprehensive reporting
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// Find project root (where package.json is)
// Review #214: Use platform-agnostic root detection
function findProjectRoot() {
  let dir = __dirname;
  const fsRoot = path.parse(dir).root; // Platform-agnostic (handles Windows drives)

  while (dir && dir !== fsRoot) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    const next = path.dirname(dir);
    if (next === dir) break; // Prevent infinite loop
    dir = next;
  }

  return process.cwd();
}

const ROOT_DIR = findProjectRoot();
const args = process.argv.slice(2);
const isFullMode = args.includes("--full");

// Results collector
const results = {
  mode: isFullMode ? "full" : "limited",
  timestamp: new Date().toISOString(),
  categories: {},
  summary: { errors: 0, warnings: 0, info: 0 },
};

/**
 * Run a command and capture output
 */
function runCommand(cmd, options = {}) {
  try {
    const output = execSync(cmd, {
      cwd: ROOT_DIR,
      encoding: "utf8",
      timeout: options.timeout || 60000,
      stdio: ["pipe", "pipe", "pipe"],
      ...options,
    });
    return { success: true, output: output.trim(), code: 0 };
  } catch (error) {
    return {
      success: false,
      output: error.stdout?.trim() || "",
      stderr: error.stderr?.trim() || "",
      code: error.status || 1,
    };
  }
}

/**
 * Add an alert to results
 */
function addAlert(category, severity, message, details = null, action = null) {
  if (!results.categories[category]) {
    results.categories[category] = [];
  }
  results.categories[category].push({
    severity,
    message,
    details,
    action,
  });
  // Map severity to summary key
  const key = severity === "error" ? "errors" : severity === "warning" ? "warnings" : "info";
  results.summary[key]++;
}

// ============================================================================
// CODE HEALTH CHECKS
// ============================================================================

function checkCodeHealth() {
  console.error("  Checking code health...");

  // TypeScript errors (try tsc directly if no npm script)
  // Review #322 Round 3: Remove 2>&1 - use combined output for checks
  let tsResult = runCommand("npm run type-check", { timeout: 120000 });

  // If script doesn't exist, try tsc directly
  const tsCombinedOutput = `${tsResult.output || ""}\n${tsResult.stderr || ""}`;
  if (tsCombinedOutput.includes("Missing script")) {
    tsResult = runCommand("npx tsc --noEmit", { timeout: 120000 });
  }

  // Review #214: Always report type-check failures, even if count can't be parsed
  const tsFullOutput = `${tsResult.output || ""}\n${tsResult.stderr || ""}`;
  if (!tsResult.success && !tsFullOutput.includes("Missing script")) {
    const errorMatch = tsFullOutput.match(/Found (\d+) error/i);
    const errorCount = errorMatch ? parseInt(errorMatch[1], 10) : null;

    addAlert(
      "code",
      "error",
      errorCount ? `${errorCount} TypeScript error(s)` : "TypeScript type-check failed",
      tsFullOutput.split("\n").slice(0, 10),
      "Run: npx tsc --noEmit"
    );
  }

  // ESLint warnings
  const lintResult = runCommand("npm run lint", { timeout: 120000 });
  const lintFullOutput = `${lintResult.output || ""}\n${lintResult.stderr || ""}`;
  if (!lintResult.success) {
    const warnMatch = lintFullOutput.match(/(\d+) warning/);
    const errMatch = lintFullOutput.match(/(\d+) error/);
    const warnCount = warnMatch ? parseInt(warnMatch[1], 10) : 0;
    const errCount = errMatch ? parseInt(errMatch[1], 10) : 0;

    if (errCount > 0) {
      addAlert("code", "error", `${errCount} ESLint error(s)`, null, "Run: npm run lint");
    }
    if (warnCount > 0) {
      addAlert("code", "warning", `${warnCount} ESLint warning(s)`, null, "Run: npm run lint");
    }
  }

  // Pattern violations
  const patternsResult = runCommand("npm run patterns:check", { timeout: 60000 });
  const patternsFullOutput = `${patternsResult.output || ""}\n${patternsResult.stderr || ""}`;
  if (!patternsResult.success && patternsFullOutput.includes("violation")) {
    addAlert("code", "warning", "Pattern violations found", null, "Run: npm run patterns:check");
  }

  // Circular dependencies
  // Session #128: Fixed script name (deps:circular, not check:circular)
  // Session #128: Success is determined by exit code 0, not output text
  // (madge outputs "No circular dependency found!" to TTY, not captured stdout)
  const circularResult = runCommand("npm run deps:circular", { timeout: 60000 });
  const circularFullOutput = `${circularResult.output || ""}\n${circularResult.stderr || ""}`;
  const missingScript = /Missing script/i.test(circularFullOutput);

  if (missingScript) {
    // Script doesn't exist - alert to prompt setup (PR #332 Review #235)
    addAlert(
      "code",
      "info",
      "Circular dependency script not configured",
      null,
      "Add deps:circular script to package.json for dependency analysis"
    );
  } else if (!circularResult.success) {
    // Non-zero exit code means circular deps were found (or script error)
    // Check if it processed files successfully (script ran but found issues)
    const hasResults = /Processed \d+ files/i.test(circularFullOutput);
    if (hasResults) {
      addAlert(
        "code",
        "warning",
        "Circular dependencies detected",
        null,
        "Run: npm run deps:circular"
      );
    } else {
      // Script failed to run
      addAlert(
        "code",
        "warning",
        "Circular dependency check failed to run",
        (circularResult.output || circularResult.stderr || "").split("\n").slice(0, 10),
        "Run: npm run deps:circular"
      );
    }
  }
  // If circularResult.success is true (exit code 0), no circular deps - no alert needed
}

// ============================================================================
// SECURITY CHECKS
// ============================================================================

function checkSecurity() {
  console.error("  Checking security...");

  // npm audit
  // Review #322 Round 3: Remove 2>&1 to prevent stderr corrupting JSON output
  const auditResult = runCommand("npm audit --json", { timeout: 60000 });
  try {
    const audit = JSON.parse(auditResult.output);
    const high = audit.metadata?.vulnerabilities?.high || 0;
    const critical = audit.metadata?.vulnerabilities?.critical || 0;

    if (critical > 0) {
      addAlert(
        "security",
        "error",
        `${critical} critical vulnerabilit${critical === 1 ? "y" : "ies"}`,
        null,
        "Run: npm audit"
      );
    }
    if (high > 0) {
      addAlert(
        "security",
        "warning",
        `${high} high-severity vulnerabilit${high === 1 ? "y" : "ies"}`,
        null,
        "Run: npm audit"
      );
    }
  } catch {
    // Review #322: Surface audit execution failures instead of silently skipping
    // Review #322 Round 3: Upgrade to error when audit fails to run
    addAlert(
      "security",
      auditResult.success ? "warning" : "error",
      auditResult.success ? "npm audit output was not valid JSON" : "npm audit failed to run",
      (auditResult.output || auditResult.stderr || "").split("\n").slice(0, 10),
      "Run: npm audit"
    );
  }

  // Encrypted secrets check
  // Review #214: Pattern #70 - use try/catch, improved regex validation
  const encryptedPath = path.join(ROOT_DIR, ".env.local.encrypted");
  const envLocalPath = path.join(ROOT_DIR, ".env.local");

  if (fs.existsSync(encryptedPath)) {
    let hasValidTokens = false;

    try {
      const envContent = fs.readFileSync(envLocalPath, "utf8");
      // Check for actual token values (not placeholders)
      hasValidTokens =
        /SONARCLOUD_TOKEN=(?!your-|placeholder|xxx)[^\s]+/.test(envContent) ||
        /GITHUB_TOKEN=(?!your-|placeholder|xxx)[^\s]+/.test(envContent);
    } catch {
      // File doesn't exist or can't be read - treat as not decrypted
    }

    if (!hasValidTokens) {
      addAlert(
        "security",
        "warning",
        "Encrypted secrets found but not decrypted",
        null,
        "Run: node scripts/secrets/decrypt-secrets.js"
      );
    }
  }

  // Security patterns check
  const securityResult = runCommand("npm run security:check", { timeout: 60000 });
  const securityFullOutput = `${securityResult.output || ""}\n${securityResult.stderr || ""}`;
  if (!securityResult.success && securityFullOutput.includes("warning")) {
    addAlert(
      "security",
      "warning",
      "Security pattern warnings",
      null,
      "Run: npm run security:check"
    );
  }
}

// ============================================================================
// SESSION CONTEXT CHECKS
// ============================================================================

function checkSessionContext() {
  console.error("  Checking session context...");

  // Cross-session warning
  // Review #214: Fixed path to match session-start.js location
  const sessionStatePath = path.join(ROOT_DIR, ".claude", "hooks", ".session-state.json");
  // Pattern #70: Skip existsSync, use try/catch alone
  try {
    const content = fs.readFileSync(sessionStatePath, "utf8");
    const state = JSON.parse(content);
    if (state.lastBegin && !state.lastEnd) {
      addAlert(
        "session",
        "warning",
        "Previous session did not run /session-end",
        null,
        "Run: /session-end at end of sessions"
      );
    }
  } catch {
    // File doesn't exist or can't be read - skip
  }

  // Session #128: Removed MCP memory check
  // Episodic Memory (automatic) handles conversation archival
  // Serena Memory (explicit) can be used via mcp__serena__write_memory/read_memory if needed
}

// ============================================================================
// CURRENT ALERTS (FULL MODE)
// ============================================================================

function checkCurrentAlerts() {
  console.error("  Checking current alerts...");

  // Read pending-alerts.json if it exists
  // Pattern #70: Skip existsSync, use try/catch alone
  const alertsPath = path.join(ROOT_DIR, ".claude", "pending-alerts.json");
  let alertsData = null;

  try {
    const content = fs.readFileSync(alertsPath, "utf8");
    alertsData = JSON.parse(content);
  } catch {
    // File doesn't exist - try to generate
  }

  if (!alertsData) {
    // Generate alerts
    const genResult = runCommand("node scripts/generate-pending-alerts.js");
    if (genResult.success) {
      try {
        const content = fs.readFileSync(alertsPath, "utf8");
        alertsData = JSON.parse(content);
      } catch {
        // Still can't read - skip
      }
    }
  }

  if (alertsData) {
    for (const alert of alertsData.alerts || []) {
      const severity =
        alert.severity === "error" ? "error" : alert.severity === "warning" ? "warning" : "info";
      addAlert("alerts", severity, alert.message, alert.details, alert.action);
    }
  }
}

// ============================================================================
// DOCUMENTATION HEALTH (FULL MODE)
// ============================================================================

function checkDocumentationHealth() {
  console.error("  Checking documentation health...");

  // CANON validation
  const canonResult = runCommand("npm run validate:canon", { timeout: 60000 });
  const canonFullOutput = `${canonResult.output || ""}\n${canonResult.stderr || ""}`;
  if (!canonResult.success) {
    const issueMatch = canonFullOutput.match(/(\d+)\s+issue/i);
    const issueCount = issueMatch ? issueMatch[1] : "some";
    addAlert(
      "docs",
      "warning",
      `${issueCount} CANON validation issue(s)`,
      null,
      "Run: npm run validate:canon"
    );
  }

  // Cross-doc dependencies
  const crossdocResult = runCommand("npm run crossdoc:check", { timeout: 60000 });
  const crossdocFullOutput = `${crossdocResult.output || ""}\n${crossdocResult.stderr || ""}`;
  if (!crossdocResult.success && crossdocFullOutput.includes("Missing")) {
    addAlert(
      "docs",
      "warning",
      "Cross-document dependency violations",
      null,
      "Run: npm run crossdoc:check"
    );
  }

  // Check for stale SESSION_CONTEXT.md
  // Review #214: Fixed path to docs/ directory
  const sessionContextPath = path.join(ROOT_DIR, "docs", "SESSION_CONTEXT.md");
  try {
    const stats = fs.statSync(sessionContextPath);
    const daysSinceUpdate = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 7) {
      addAlert(
        "docs",
        "warning",
        `SESSION_CONTEXT.md is ${Math.floor(daysSinceUpdate)} days old`,
        null,
        "Update docs/SESSION_CONTEXT.md with current status"
      );
    }
  } catch {
    // File doesn't exist or can't be accessed - skip
  }
}

// ============================================================================
// ROADMAP/PLANNING (FULL MODE)
// ============================================================================

function checkRoadmapPlanning() {
  console.error("  Checking roadmap/planning...");

  // Check ROADMAP.md for blocked items
  // Pattern #70: Skip existsSync, use try/catch alone
  const roadmapPath = path.join(ROOT_DIR, "ROADMAP.md");
  try {
    const content = fs.readFileSync(roadmapPath, "utf8");

    // Look for blocked markers
    const blockedMatches = content.match(/\[BLOCKED\]/gi);
    if (blockedMatches && blockedMatches.length > 0) {
      addAlert(
        "roadmap",
        "warning",
        `${blockedMatches.length} blocked item(s) in ROADMAP.md`,
        null,
        "Review ROADMAP.md for blocked items"
      );
    }

    // Look for overdue items (dates in the past)
    const datePattern = /\b(202[4-9])-([01]\d)-([0-3]\d)\b/g;
    const today = new Date();
    let match;
    let overdueCount = 0;

    while ((match = datePattern.exec(content)) !== null) {
      const itemDate = new Date(`${match[1]}-${match[2]}-${match[3]}`);
      if (itemDate < today) {
        overdueCount++;
      }
    }

    if (overdueCount > 0) {
      addAlert(
        "roadmap",
        "info",
        `${overdueCount} date(s) in ROADMAP.md may be overdue`,
        null,
        "Review ROADMAP.md for outdated target dates"
      );
    }
  } catch {
    // File doesn't exist or can't be read - skip
  }
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.error(`\n🔍 Running ${isFullMode ? "FULL" : "LIMITED"} alerts check...\n`);

  // Always run (Limited mode)
  checkCodeHealth();
  checkSecurity();
  checkSessionContext();

  // Full mode only
  if (isFullMode) {
    checkCurrentAlerts();
    checkDocumentationHealth();
    checkRoadmapPlanning();
  }

  // Output JSON to stdout
  console.log(JSON.stringify(results, null, 2));

  // Summary to stderr
  console.error(`\n✅ Check complete:`);
  console.error(`   Errors:   ${results.summary.errors}`);
  console.error(`   Warnings: ${results.summary.warnings}`);
  console.error(`   Info:     ${results.summary.info}\n`);

  // Exit code based on errors
  process.exit(results.summary.errors > 0 ? 1 : 0);
}

main();
