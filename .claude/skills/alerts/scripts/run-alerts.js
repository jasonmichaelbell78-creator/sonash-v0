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
function findProjectRoot() {
  let dir = __dirname;
  while (dir !== "/") {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    dir = path.dirname(dir);
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
  let tsResult = runCommand("npm run type-check 2>&1", { timeout: 120000 });

  // If script doesn't exist, try tsc directly
  if (tsResult.output.includes("Missing script")) {
    tsResult = runCommand("npx tsc --noEmit 2>&1", { timeout: 120000 });
  }

  if (!tsResult.success && !tsResult.output.includes("Missing script")) {
    const errorMatch = tsResult.output.match(/Found (\d+) error/);
    const errorCount = errorMatch ? parseInt(errorMatch[1], 10) : null;
    if (errorCount) {
      addAlert(
        "code",
        "error",
        `${errorCount} TypeScript error(s)`,
        tsResult.output.split("\n").slice(0, 10),
        "Run: npx tsc --noEmit"
      );
    }
  }

  // ESLint warnings
  const lintResult = runCommand("npm run lint 2>&1", { timeout: 120000 });
  if (!lintResult.success) {
    const warnMatch = lintResult.output.match(/(\d+) warning/);
    const errMatch = lintResult.output.match(/(\d+) error/);
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
  const patternsResult = runCommand("npm run patterns:check 2>&1", { timeout: 60000 });
  if (!patternsResult.success && patternsResult.output.includes("violation")) {
    addAlert("code", "warning", "Pattern violations found", null, "Run: npm run patterns:check");
  }

  // Circular dependencies
  const circularResult = runCommand("npm run check:circular 2>&1", { timeout: 60000 });
  if (!circularResult.success || circularResult.output.includes("circular")) {
    addAlert(
      "code",
      "warning",
      "Circular dependencies detected",
      null,
      "Run: npm run check:circular"
    );
  }
}

// ============================================================================
// SECURITY CHECKS
// ============================================================================

function checkSecurity() {
  console.error("  Checking security...");

  // npm audit
  const auditResult = runCommand("npm audit --json 2>&1", { timeout: 60000 });
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
    // JSON parse failed, skip
  }

  // Encrypted secrets check
  const encryptedPath = path.join(ROOT_DIR, ".env.local.encrypted");
  const envLocalPath = path.join(ROOT_DIR, ".env.local");

  if (fs.existsSync(encryptedPath)) {
    // Check if env.local exists and has content
    if (!fs.existsSync(envLocalPath)) {
      addAlert(
        "security",
        "warning",
        "Encrypted secrets found but not decrypted",
        null,
        "Run: node scripts/secrets/decrypt-secrets.js"
      );
    } else {
      const envContent = fs.readFileSync(envLocalPath, "utf8");
      if (!envContent.includes("SONARCLOUD") && !envContent.includes("MCP")) {
        addAlert(
          "security",
          "warning",
          "Encrypted secrets may not be fully decrypted",
          null,
          "Run: node scripts/secrets/decrypt-secrets.js"
        );
      }
    }
  }

  // Security patterns check
  const securityResult = runCommand("npm run security:check 2>&1", { timeout: 60000 });
  if (!securityResult.success && securityResult.output.includes("warning")) {
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
  const sessionStatePath = path.join(ROOT_DIR, ".claude", "session-state.json");
  if (fs.existsSync(sessionStatePath)) {
    try {
      const state = JSON.parse(fs.readFileSync(sessionStatePath, "utf8"));
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
      // JSON parse failed, skip
    }
  }

  // MCP memory status (informational)
  addAlert(
    "session",
    "info",
    "MCP memory should be checked",
    null,
    "Run: mcp__memory__read_graph() to check for persisted context"
  );
}

// ============================================================================
// CURRENT ALERTS (FULL MODE)
// ============================================================================

function checkCurrentAlerts() {
  console.error("  Checking current alerts...");

  // Read pending-alerts.json if it exists
  const alertsPath = path.join(ROOT_DIR, ".claude", "pending-alerts.json");
  if (fs.existsSync(alertsPath)) {
    try {
      const alerts = JSON.parse(fs.readFileSync(alertsPath, "utf8"));
      for (const alert of alerts.alerts || []) {
        const severity =
          alert.severity === "error" ? "error" : alert.severity === "warning" ? "warning" : "info";
        addAlert("alerts", severity, alert.message, alert.details, alert.action);
      }
    } catch {
      // JSON parse failed, skip
    }
  } else {
    // Generate alerts
    const genResult = runCommand("node scripts/generate-pending-alerts.js 2>&1");
    if (genResult.success && fs.existsSync(alertsPath)) {
      try {
        const alerts = JSON.parse(fs.readFileSync(alertsPath, "utf8"));
        for (const alert of alerts.alerts || []) {
          const severity =
            alert.severity === "error"
              ? "error"
              : alert.severity === "warning"
                ? "warning"
                : "info";
          addAlert("alerts", severity, alert.message, alert.details, alert.action);
        }
      } catch {
        // JSON parse failed, skip
      }
    }
  }
}

// ============================================================================
// DOCUMENTATION HEALTH (FULL MODE)
// ============================================================================

function checkDocumentationHealth() {
  console.error("  Checking documentation health...");

  // CANON validation
  const canonResult = runCommand("npm run validate:canon 2>&1", { timeout: 60000 });
  if (!canonResult.success) {
    const issueMatch = canonResult.output.match(/(\d+)\s+issue/i);
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
  const crossdocResult = runCommand("npm run crossdoc:check 2>&1", { timeout: 60000 });
  if (!crossdocResult.success && crossdocResult.output.includes("Missing")) {
    addAlert(
      "docs",
      "warning",
      "Cross-document dependency violations",
      null,
      "Run: npm run crossdoc:check"
    );
  }

  // Check for stale SESSION_CONTEXT.md
  const sessionContextPath = path.join(ROOT_DIR, "SESSION_CONTEXT.md");
  if (fs.existsSync(sessionContextPath)) {
    const stats = fs.statSync(sessionContextPath);
    const daysSinceUpdate = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 7) {
      addAlert(
        "docs",
        "warning",
        `SESSION_CONTEXT.md is ${Math.floor(daysSinceUpdate)} days old`,
        null,
        "Update SESSION_CONTEXT.md with current status"
      );
    }
  }
}

// ============================================================================
// ROADMAP/PLANNING (FULL MODE)
// ============================================================================

function checkRoadmapPlanning() {
  console.error("  Checking roadmap/planning...");

  // Check ROADMAP.md for blocked items
  const roadmapPath = path.join(ROOT_DIR, "ROADMAP.md");
  if (fs.existsSync(roadmapPath)) {
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
