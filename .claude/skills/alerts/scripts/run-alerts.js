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

/**
 * Ensure a category always appears in output — adds "No issues" if empty
 */
function ensureCategory(category, label) {
  if (!results.categories[category]) {
    addAlert(category, "info", `${label}: No issues found`, null, null);
  }
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
// DEBT METRICS (Limited mode, Actionable)
// ============================================================================

function checkDebtMetrics() {
  console.error("  Checking debt metrics...");

  const metricsPath = path.join(ROOT_DIR, "docs", "technical-debt", "metrics.json");
  let metrics;
  try {
    metrics = JSON.parse(fs.readFileSync(metricsPath, "utf8"));
  } catch {
    return; // File missing — skip silently
  }

  const s0 = metrics.alerts?.s0_count || 0;
  const s1 = metrics.alerts?.s1_count || 0;
  const total = metrics.summary?.total || 0;
  const open = metrics.summary?.open || 0;
  const resolved = metrics.summary?.resolved || 0;
  const resRate = metrics.summary?.resolution_rate_pct || 0;

  if (s0 > 0) {
    const ids = (metrics.alerts?.s0_items || []).map((i) => i.id).join(", ");
    addAlert(
      "debt-metrics",
      "error",
      `${s0} S0 critical debt item(s) need attention`,
      ids ? `IDs: ${ids}` : null,
      "Run /task-next or fix the S0 items directly"
    );
  }

  const S1_THRESHOLD = 10;
  if (s1 > S1_THRESHOLD) {
    addAlert(
      "debt-metrics",
      "warning",
      `${s1} S1 high-priority items (threshold: ${S1_THRESHOLD})`,
      null,
      "Review MASTER_DEBT.jsonl for S1 items"
    );
  }

  // Trend from metrics-log.jsonl
  const logPath = path.join(ROOT_DIR, "docs", "technical-debt", "logs", "metrics-log.jsonl");
  try {
    const lines = fs.readFileSync(logPath, "utf8").trim().split("\n").filter(Boolean);
    if (lines.length >= 2) {
      const prev = JSON.parse(lines[lines.length - 2]);
      const curr = JSON.parse(lines[lines.length - 1]);
      if (curr.open > prev.open) {
        addAlert(
          "debt-metrics",
          "warning",
          `Debt growing: ${prev.open} → ${curr.open} open items`,
          null,
          "Resolve more items than you create"
        );
      }
    }
  } catch {
    // Log missing — skip trend
  }

  addAlert(
    "debt-metrics",
    "info",
    `Debt summary: ${total} total, ${open} open, ${resRate}% resolved`,
    null,
    null
  );
}

// ============================================================================
// LEARNING EFFECTIVENESS (Limited mode, Actionable)
// ============================================================================

function checkLearningEffectiveness() {
  console.error("  Checking learning effectiveness...");

  const metricsPath = path.join(ROOT_DIR, "docs", "LEARNING_METRICS.md");
  let content;
  try {
    content = fs.readFileSync(metricsPath, "utf8");
  } catch {
    return; // File missing — skip
  }

  // Parse metrics table
  const effectivenessMatch = content.match(/Learning Effectiveness\s*\|\s*([\d.]+)%/);
  const failingMatch = content.match(/Patterns Failing\s*\|\s*(\d+)/);
  const automationMatch = content.match(/Automation Coverage\s*\|\s*([\d.]+)%/);

  const effectiveness = effectivenessMatch ? parseFloat(effectivenessMatch[1]) : null;
  const failing = failingMatch ? parseInt(failingMatch[1], 10) : 0;
  const automationCoverage = automationMatch ? parseFloat(automationMatch[1]) : null;

  if (failing > 0) {
    // Extract top 3 recommended actions
    const actionLines = [];
    const actionRegex = /\*\*\[Automation\]\*\*\s+Automate\s+"([^"]+)"/g;
    let m;
    while ((m = actionRegex.exec(content)) !== null && actionLines.length < 3) {
      actionLines.push(m[1]);
    }
    const topNames = actionLines.length > 0 ? actionLines.join(", ") : "see LEARNING_METRICS.md";
    addAlert(
      "learning",
      "warning",
      `${failing} patterns failing to be learned (3+ recurrences)`,
      null,
      `Automate top patterns: ${topNames}. Add to check-pattern-compliance.js`
    );
  }

  if (effectiveness !== null && effectiveness < 70) {
    addAlert(
      "learning",
      "warning",
      `Learning effectiveness at ${effectiveness}% — below 70% threshold`,
      null,
      "Review documentation clarity in CODE_PATTERNS.md"
    );
  }

  if (automationCoverage !== null && automationCoverage < 20) {
    addAlert(
      "learning",
      "info",
      `Only ${automationCoverage}% of patterns automated`,
      null,
      "Run consolidation to generate automation suggestions"
    );
  }
}

// ============================================================================
// AGENT COMPLIANCE (Limited mode, Actionable)
// ============================================================================

function checkAgentCompliance() {
  console.error("  Checking agent compliance...");

  // Primary: agent-invocations.jsonl (richer, has timestamps + results)
  // Fallback: .session-agents.json
  let invoked = [];
  const invocationsPath = path.join(ROOT_DIR, ".claude", "state", "agent-invocations.jsonl");
  const sessionAgentsPath = path.join(ROOT_DIR, ".claude", "hooks", ".session-agents.json");

  try {
    const lines = fs.readFileSync(invocationsPath, "utf8").trim().split("\n").filter(Boolean);
    invoked = lines
      .map((l) => {
        try {
          const e = JSON.parse(l);
          return e.agent || e.name || "";
        } catch {
          return "";
        }
      })
      .filter(Boolean);
  } catch {
    // Fallback to session-agents
    try {
      const agents = JSON.parse(fs.readFileSync(sessionAgentsPath, "utf8"));
      invoked = Array.isArray(agents) ? agents.map((a) => a.name || a) : Object.keys(agents);
    } catch {
      // Neither file exists
    }
  }

  if (invoked.length === 0) {
    addAlert("agent-compliance", "info", "No agent invocation data yet", null, null);
  }

  // Check last commit for code/security file changes
  const lastCommitResult = runCommand("git diff --name-only HEAD~1 HEAD", { timeout: 10000 });
  if (!lastCommitResult.success) return;

  const changedFiles = lastCommitResult.output.split("\n").filter(Boolean);
  const codeFiles = changedFiles.filter(
    (f) =>
      /\.(tsx?|jsx?|mjs|cjs)$/.test(f) && !f.startsWith("scripts/") && !f.startsWith(".claude/")
  );
  const securityFiles = changedFiles.filter((f) =>
    /security|auth|\.env|firebase\.json|firestore\.rules/i.test(f)
  );

  const hasCodeReviewer = invoked.some((n) => /code.?review/i.test(n));
  const hasSecurityAuditor = invoked.some((n) => /security.?audit/i.test(n));

  if (codeFiles.length > 0 && !hasCodeReviewer) {
    addAlert(
      "agent-compliance",
      "warning",
      `${codeFiles.length} code file(s) changed without code-reviewer`,
      codeFiles.slice(0, 5).join(", "),
      "Run /code-reviewer before merging"
    );
  }

  if (securityFiles.length > 0 && !hasSecurityAuditor) {
    addAlert(
      "agent-compliance",
      "warning",
      `${securityFiles.length} security-related file(s) changed without security-auditor`,
      securityFiles.slice(0, 5).join(", "),
      "Run security-auditor agent"
    );
  }
}

// ============================================================================
// HOOK WARNINGS (Limited mode, Actionable)
// ============================================================================

function checkHookWarnings() {
  console.error("  Checking hook warnings...");

  const warningsPath = path.join(ROOT_DIR, ".claude", "hook-warnings.json");
  let data;
  try {
    data = JSON.parse(fs.readFileSync(warningsPath, "utf8"));
  } catch {
    return; // File missing — skip
  }

  const warnings = data.warnings || [];
  if (warnings.length === 0) return;

  // Deduplicate by message (hooks fire repeatedly), keep most recent
  const byMessage = new Map();
  for (const w of warnings) {
    const key = `${w.hook}:${w.type}:${w.message}`;
    const existing = byMessage.get(key);
    if (!existing || new Date(w.timestamp) > new Date(existing.timestamp)) {
      byMessage.set(key, w);
    }
  }

  const deduped = [...byMessage.values()];
  const errors = deduped.filter((w) => w.severity === "error");
  const warns = deduped.filter((w) => w.severity === "warning");

  for (const w of errors) {
    addAlert(
      "hook-warnings",
      "error",
      `[${w.hook}] ${w.message}`,
      null,
      w.action || "Check pre-commit/pre-push output"
    );
  }

  for (const w of warns) {
    addAlert(
      "hook-warnings",
      "warning",
      `[${w.hook}] ${w.message}`,
      null,
      w.action || "Check pre-commit/pre-push output"
    );
  }

  // Summarize info-level (don't spam)
  const infos = deduped.filter((w) => w.severity === "info" || !w.severity);
  if (infos.length > 0) {
    addAlert(
      "hook-warnings",
      "info",
      `${infos.length} informational hook notification(s)`,
      null,
      null
    );
  }

  // Age check — oldest unresolved warning
  const oldest = deduped.reduce((min, w) => {
    const d = new Date(w.timestamp);
    return d < min ? d : min;
  }, new Date());
  const ageDays = Math.floor((Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24));
  if (ageDays > 3) {
    addAlert(
      "hook-warnings",
      "warning",
      `Oldest hook warning is ${ageDays} days old — may need attention`,
      null,
      "Review .claude/hook-warnings.json and resolve or clear stale entries"
    );
  }
}

// ============================================================================
// TEST RESULTS (Limited mode, Actionable)
// ============================================================================

function checkTestResults() {
  console.error("  Checking test results...");

  const resultsDir = path.join(ROOT_DIR, ".claude", "test-results");
  let files;
  try {
    files = fs
      .readdirSync(resultsDir)
      .filter((f) => f.endsWith(".jsonl"))
      .sort()
      .reverse();
  } catch {
    return; // Directory missing — skip
  }

  if (files.length === 0) return;

  // Read the most recent test run
  const latestFile = files[0];
  let lines;
  try {
    lines = fs
      .readFileSync(path.join(resultsDir, latestFile), "utf8")
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return;
  }

  const results_parsed = lines
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (results_parsed.length === 0) return;

  const passed = results_parsed.filter((r) => r.status === "pass").length;
  const failed = results_parsed.filter((r) => r.status === "fail").length;
  const errored = results_parsed.filter((r) => r.status === "error").length;
  const total = results_parsed.length;

  // Check test run age
  const latestTimestamp = results_parsed.reduce((max, r) => {
    const t = new Date(r.timestamp);
    return t > max ? t : max;
  }, new Date(0));
  const ageDays = Math.floor((Date.now() - latestTimestamp.getTime()) / (1000 * 60 * 60 * 24));

  if (failed > 0) {
    const failNames = results_parsed
      .filter((r) => r.status === "fail")
      .map((r) => r.test_id || r.name)
      .slice(0, 5)
      .join(", ");
    addAlert(
      "test-results",
      "error",
      `${failed} test(s) failing in latest run (${latestFile})`,
      failNames,
      "Run /test-suite to re-run and fix failures"
    );
  }

  if (errored > 0) {
    const errNames = results_parsed
      .filter((r) => r.status === "error")
      .map((r) => r.test_id || r.name)
      .slice(0, 5)
      .join(", ");
    addAlert(
      "test-results",
      "warning",
      `${errored} test(s) errored in latest run (${latestFile})`,
      errNames,
      "Run /test-suite — errors may indicate environment issues"
    );
  }

  if (ageDays > 7) {
    addAlert(
      "test-results",
      "warning",
      `Latest test run is ${ageDays} days old (${latestFile})`,
      null,
      "Run /test-suite --smoke to get fresh results"
    );
  }

  addAlert(
    "test-results",
    "info",
    `Last test run: ${passed}/${total} passed (${latestFile}, ${ageDays}d ago)`,
    null,
    null
  );
}

// ============================================================================
// REVIEW QUALITY (Full mode, Actionable)
// ============================================================================

function checkReviewQuality() {
  console.error("  Checking review quality...");

  const metricsPath = path.join(ROOT_DIR, ".claude", "state", "review-metrics.jsonl");
  let lines;
  try {
    lines = fs.readFileSync(metricsPath, "utf8").trim().split("\n").filter(Boolean);
  } catch {
    addAlert("review-quality", "info", "No review metrics data yet", null, null);
    return;
  }

  const recent = lines
    .slice(-5)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (recent.length === 0) return;

  // Check for high-churn PRs
  for (const entry of recent) {
    const rounds = entry.review_rounds || entry.rounds || 0;
    const pr = entry.pr || entry.pr_number || "?";
    if (rounds >= 5) {
      addAlert(
        "review-quality",
        "warning",
        `PR #${pr} took ${rounds} review rounds`,
        null,
        `Run /pr-retro ${pr} to analyze churn`
      );
    }
  }

  // Average fix ratio
  const ratios = recent.map((e) => e.fix_ratio).filter((r) => typeof r === "number");
  if (ratios.length > 0) {
    const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    if (avg > 0.3) {
      addAlert(
        "review-quality",
        "warning",
        `Average fix ratio ${(avg * 100).toFixed(0)}% (target: <25%)`,
        null,
        "Check if review scope is consistent between rounds"
      );
    }
  }
}

// ============================================================================
// CONSOLIDATION STATUS (Full mode, Actionable)
// ============================================================================

function checkConsolidation() {
  console.error("  Checking consolidation status...");

  // Parse consolidation trigger from learnings log
  const logPath = path.join(ROOT_DIR, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
  try {
    const content = fs.readFileSync(logPath, "utf8");
    const counterMatch = content.match(/Reviews since last consolidation:\*?\*?\s*(\d+)/i);
    if (counterMatch) {
      const count = parseInt(counterMatch[1], 10);
      if (count >= 10) {
        addAlert(
          "consolidation",
          "warning",
          `${count} reviews since last consolidation (threshold: 10)`,
          null,
          "Consolidation will auto-run at next session-start"
        );
      }
    }
  } catch {
    // File missing — skip
  }

  // Check suggested rules
  const suggestedPath = path.join(ROOT_DIR, "consolidation-output", "suggested-rules.md");
  try {
    const content = fs.readFileSync(suggestedPath, "utf8");
    const headers = content.match(/^## /gm);
    const count = headers ? headers.length : 0;
    if (count > 0) {
      addAlert(
        "consolidation",
        "info",
        `${count} suggested automation rule(s) pending review`,
        null,
        "Review consolidation-output/suggested-rules.md and add to check-pattern-compliance.js"
      );
    }
  } catch {
    // File missing — skip
  }
}

// ============================================================================
// VELOCITY (Full mode, Informational)
// ============================================================================

function checkVelocity() {
  console.error("  Checking velocity...");

  const logPath = path.join(ROOT_DIR, ".claude", "state", "velocity-log.jsonl");
  let lines;
  try {
    lines = fs.readFileSync(logPath, "utf8").trim().split("\n").filter(Boolean);
  } catch {
    return; // File missing — skip silently
  }

  const recent = lines
    .slice(-5)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (recent.length === 0) return;

  const completed = recent.map((e) => e.items_completed || 0);
  const avg = completed.reduce((a, b) => a + b, 0) / completed.length;

  addAlert(
    "velocity",
    "info",
    `Velocity: avg ${avg.toFixed(1)} items/session over last ${recent.length} sessions`,
    null,
    null
  );

  // Check for zero-velocity streak
  const lastThree = completed.slice(-3);
  if (lastThree.length >= 3 && lastThree.every((c) => c === 0)) {
    addAlert("velocity", "info", "No debt items resolved in last 3 sessions", null, null);
  }
}

// ============================================================================
// SESSION ACTIVITY (Full mode, Informational)
// ============================================================================

function checkSessionActivity() {
  console.error("  Checking session activity...");

  const activityPath = path.join(ROOT_DIR, ".claude", "session-activity.jsonl");
  let lines;
  try {
    lines = fs.readFileSync(activityPath, "utf8").trim().split("\n").filter(Boolean);
  } catch {
    return; // File missing — skip silently
  }

  // Find events since last session_start
  let lastStartIdx = -1;
  const entries = [];
  for (let i = 0; i < lines.length; i++) {
    try {
      const entry = JSON.parse(lines[i]);
      entries.push(entry);
      if (entry.type === "session_start" || entry.event === "session_start") {
        lastStartIdx = i;
      }
    } catch {
      // skip malformed lines
    }
  }

  if (lastStartIdx >= 0) {
    const sessionEvents = entries.slice(lastStartIdx);
    const files = sessionEvents.filter(
      (e) => e.type === "file_modified" || e.event === "file_modified"
    ).length;
    const commits = sessionEvents.filter((e) => e.type === "commit" || e.event === "commit").length;
    const skills = sessionEvents.filter(
      (e) => e.type === "skill_invoked" || e.event === "skill_invoked"
    ).length;

    addAlert(
      "session-activity",
      "info",
      `Last session: ${files} files modified, ${commits} commits, ${skills} skills invoked`,
      null,
      null
    );

    // Check for missing session-end
    const hasEnd = sessionEvents.some((e) => e.type === "session_end" || e.event === "session_end");
    if (!hasEnd && entries.length > 1) {
      addAlert("session-activity", "info", "Previous session did not run /session-end", null, null);
    }
  }
}

// ============================================================================
// COMMIT ACTIVITY (Full mode, Informational)
// ============================================================================

function checkCommitActivity() {
  console.error("  Checking commit activity...");

  const logPath = path.join(ROOT_DIR, ".claude", "state", "commit-log.jsonl");
  let lines;
  try {
    lines = fs.readFileSync(logPath, "utf8").trim().split("\n").filter(Boolean);
  } catch {
    return; // File missing — skip
  }

  const entries = lines
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (entries.length === 0) return;

  // Commits in last 24h
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recent = entries.filter((e) => new Date(e.timestamp).getTime() > oneDayAgo);

  // Commits without session attribution
  const unattributed = entries.filter((e) => !e.session && !e.seeded);

  addAlert(
    "commit-activity",
    "info",
    `${recent.length} commit(s) in last 24h, ${entries.length} total in log`,
    null,
    null
  );

  if (unattributed.length > 0) {
    addAlert(
      "commit-activity",
      "info",
      `${unattributed.length} commit(s) without session attribution`,
      null,
      "Run /session-end to attribute commits to sessions"
    );
  }

  // Check for uncommitted work age (time since last commit)
  const lastCommit = entries[entries.length - 1];
  const lastCommitAge = Date.now() - new Date(lastCommit.timestamp).getTime();
  const hoursSinceCommit = Math.floor(lastCommitAge / (1000 * 60 * 60));
  if (hoursSinceCommit > 4) {
    addAlert(
      "commit-activity",
      "info",
      `Last commit was ${hoursSinceCommit}h ago (${lastCommit.shortHash}: ${(lastCommit.message || "").substring(0, 60)})`,
      null,
      null
    );
  }
}

// ============================================================================
// ROADMAP VALIDATION (Full mode, Actionable)
// ============================================================================

function checkRoadmapValidation() {
  console.error("  Checking roadmap validation...");

  const result = runCommand("npm run roadmap:validate", { timeout: 30000 });
  const output = `${result.output || ""}\n${result.stderr || ""}`;

  // Parse warnings
  const warningMatch = output.match(/(\d+)\s+Warning/i);
  const errorMatch = output.match(/(\d+)\s+Error/i);

  const warnings = warningMatch ? parseInt(warningMatch[1], 10) : 0;
  const errors = errorMatch ? parseInt(errorMatch[1], 10) : 0;

  if (errors > 0) {
    // Extract specific error messages
    const bulletLines = output.match(/^\s+[•·]\s+.+$/gm) || [];
    const details = bulletLines
      .slice(0, 5)
      .map((l) => l.trim())
      .join("; ");
    addAlert(
      "roadmap-health",
      "error",
      `${errors} roadmap validation error(s)`,
      details || null,
      "Run: npm run roadmap:validate"
    );
  }

  if (warnings > 0) {
    const bulletLines = output.match(/^\s+[•·]\s+.+$/gm) || [];
    const details = bulletLines
      .slice(0, 5)
      .map((l) => l.trim())
      .join("; ");
    addAlert(
      "roadmap-health",
      "warning",
      `${warnings} roadmap validation warning(s)`,
      details || null,
      "Run: npm run roadmap:validate"
    );
  }
}

// ============================================================================
// HOOK HEALTH (Full mode, Informational)
// ============================================================================

function checkHookHealth() {
  console.error("  Checking hook health...");

  const result = runCommand("npm run hooks:health", { timeout: 30000 });
  const output = `${result.output || ""}\n${result.stderr || ""}`;

  // Parse hook count
  const hookCountMatch = output.match(/All (\d+) hooks valid/i);
  const hookCount = hookCountMatch ? parseInt(hookCountMatch[1], 10) : null;

  // Parse session stats
  const sessionsStarted = output.match(/Total sessions started:\s*(\d+)/i);
  const sessionsCompleted = output.match(/Sessions completed:\s*(\d+)/i);
  const started = sessionsStarted ? parseInt(sessionsStarted[1], 10) : 0;
  const completed = sessionsCompleted ? parseInt(sessionsCompleted[1], 10) : 0;

  if (hookCount) {
    addAlert("hook-health", "info", `${hookCount} hooks registered and valid`, null, null);
  }

  if (started > 0) {
    const completionRate = completed > 0 ? Math.round((completed / started) * 100) : 0;
    addAlert(
      "hook-health",
      "info",
      `Session completion rate: ${completionRate}% (${completed}/${started} sessions completed)`,
      null,
      completionRate < 50 ? "Run /session-end consistently to improve completion rate" : null
    );
  }

  // Check for hook errors
  if (output.includes("invalid") || output.includes("ERROR")) {
    addAlert(
      "hook-health",
      "warning",
      "Hook health check found issues",
      null,
      "Run: npm run hooks:health"
    );
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
  checkDebtMetrics();
  checkLearningEffectiveness();
  checkAgentCompliance();
  checkHookWarnings();
  checkTestResults();

  // Full mode only
  if (isFullMode) {
    checkCurrentAlerts();
    checkDocumentationHealth();
    checkRoadmapPlanning();
    checkReviewQuality();
    checkConsolidation();
    checkVelocity();
    checkSessionActivity();
    checkCommitActivity();
    checkRoadmapValidation();
    checkHookHealth();
  }

  // Ensure every category appears in output (adds "No issues" if check ran clean)
  ensureCategory("code", "Code Health");
  ensureCategory("security", "Security");
  ensureCategory("session", "Session Context");
  ensureCategory("debt-metrics", "Debt Health");
  ensureCategory("learning", "Learning Health");
  ensureCategory("agent-compliance", "Agent Compliance");
  ensureCategory("hook-warnings", "Hook Warnings");
  ensureCategory("test-results", "Test Results");

  if (isFullMode) {
    ensureCategory("alerts", "Current Alerts");
    ensureCategory("docs", "Documentation Health");
    ensureCategory("roadmap", "Roadmap/Planning");
    ensureCategory("review-quality", "Review Quality");
    ensureCategory("consolidation", "Consolidation Status");
    ensureCategory("velocity", "Velocity");
    ensureCategory("session-activity", "Session Activity");
    ensureCategory("commit-activity", "Commit Activity");
    ensureCategory("roadmap-health", "Roadmap Validation");
    ensureCategory("hook-health", "Hook Health");
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
