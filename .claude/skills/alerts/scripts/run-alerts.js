#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Alerts Skill v3 - Intelligent Health Dashboard
 *
 * Aggregates alerts from multiple sources, computes health scores,
 * provides benchmarks/trends/grouping, and builds session plans.
 *
 * Usage:
 *   node run-alerts.js --limited  # Quick health check (default)
 *   node run-alerts.js --full     # Comprehensive reporting
 *
 * Output: v2 JSON schema to stdout, progress to stderr.
 */

let execSync, execFileSync, fs, path;
try {
  ({ execSync, execFileSync } = require("node:child_process"));
  fs = require("node:fs");
  path = require("node:path");
} catch (err) {
  // Sanitize error: only expose error code, not full message (Review #256)
  const code = err instanceof Error && err.code ? err.code : "UNKNOWN";
  console.error(`Fatal: failed to load core Node.js modules (${code})`);
  process.exit(1);
}

// Symlink guard (Review #316-#323)
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require(
    path.join(__dirname, "..", "..", "..", "hooks", "lib", "symlink-guard")
  ));
} catch {
  isSafeToWrite = () => true; // Fallback if guard not available
}

// Find project root (where package.json is)
// Review #214: Use platform-agnostic root detection
function findProjectRoot() {
  let dir = __dirname;
  const fsRoot = path.parse(dir).root;

  while (dir && dir !== fsRoot) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    const next = path.dirname(dir);
    if (next === dir) break;
    dir = next;
  }

  return process.cwd();
}

const ROOT_DIR = findProjectRoot();
const args = process.argv.slice(2);
const isFullMode = args.includes("--full");

// ============================================================================
// BENCHMARKS
// ============================================================================

const BENCHMARKS = {
  debt: {
    s0_target: 0,
    s1_threshold: 10,
    resolution_rate: { good: 50, average: 30, poor: 10 },
    avg_age_days: { good: 30, average: 90, poor: 180 },
  },
  learning: {
    effectiveness: { good: 85, average: 75, poor: 60 },
    automation_coverage: { good: 40, average: 25, poor: 10 },
    failing_patterns: { good: 0, average: 5, poor: 10 },
  },
  velocity: {
    items_per_session: { good: 5, average: 2, poor: 0 },
    acceleration_threshold: 0.15,
  },
  review: {
    fix_ratio: { good: 0.15, average: 0.25, poor: 0.35 },
    max_rounds: { good: 2, average: 3, poor: 5 },
  },
  code: {
    ts_errors: { good: 0, average: 5, poor: 20 },
    eslint_warnings: { good: 0, average: 10, poor: 50 },
  },
  tests: {
    pass_rate: { good: 98, average: 90, poor: 80 },
    staleness_days: { good: 1, average: 3, poor: 7 },
  },
  security: {
    critical_vulns: { good: 0, average: 0, poor: 1 },
    high_vulns: { good: 0, average: 2, poor: 5 },
  },
  session: {
    gap_hours: { good: 0, average: 4, poor: 24 },
  },
  agent: {
    compliance_pct: { good: 100, average: 80, poor: 50 },
  },
  hooks: {
    warning_age_days: { good: 0, average: 3, poor: 7 },
  },
  docs: {
    staleness_days: { good: 3, average: 7, poor: 14 },
  },
  consolidation: {
    reviews_pending: { good: 0, average: 5, poor: 10 },
  },
  roadmap: {
    blocked_items: { good: 0, average: 2, poor: 5 },
  },
  commits: {
    hours_since_last: { good: 2, average: 8, poor: 24 },
  },
  skip_abuse: {
    overrides_24h: { good: 0, average: 1, poor: 3 },
    overrides_7d: { good: 0, average: 3, poor: 6 },
    no_reason_pct: { good: 0, average: 1, poor: 5 },
  },
  // New checkers (W2)
  session_state: {
    uncommitted_files: { good: 0, average: 5, poor: 15 },
    stale_branch_days: { good: 0, average: 3, poor: 7 },
  },
  pattern_hotspots: {
    repeat_offenders: { good: 0, average: 3, poor: 8 },
  },
  context_usage: {
    files_read: { good: 10, average: 20, poor: 40 },
  },
  debt_intake: {
    intake_30d: { good: 5, average: 15, poor: 30 },
    s0_intake_rate: { good: 0, average: 0.1, poor: 0.3 },
  },
  debt_resolution: {
    resolved_30d: { good: 10, average: 5, poor: 0 },
  },
  roadmap_hygiene: {
    issues: { good: 0, average: 2, poor: 5 },
  },
  trigger_compliance: {
    failures: { good: 0, average: 2, poor: 5 },
  },
  pattern_sync: {
    outdated: { good: 0, average: 3, poor: 5 },
  },
  doc_placement: {
    misplaced: { good: 0, average: 2, poor: 5 },
  },
  external_links: {
    broken: { good: 0, average: 3, poor: 10 },
  },
  unused_deps: {
    unused: { good: 0, average: 5, poor: 15 },
  },
  review_churn: {
    churn_pct: { good: 10, average: 20, poor: 35 },
  },
  backlog_health: {
    issues: { good: 0, average: 3, poor: 8 },
  },
  github_actions: {
    failures: { good: 0, average: 1, poor: 3 },
  },
  sonarcloud: {
    failed_conditions: { good: 0, average: 1, poor: 3 },
  },
};

// ============================================================================
// v2 RESULTS OBJECT
// ============================================================================

const results = {
  version: 2,
  mode: isFullMode ? "full" : "limited",
  timestamp: new Date().toISOString(),
  healthScore: null,
  categories: {},
  summary: { errors: 0, warnings: 0, info: 0 },
  sessionPlan: [],
};

// ============================================================================
// CORE HELPERS
// ============================================================================

/**
 * Safely extract an error message without risking a secondary throw
 */
function safeErrorMsg(err) {
  try {
    return (err && err.message) || String(err);
  } catch {
    return "[unknown error]";
  }
}

/** Max file size for readFileSync+split operations (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Safe JSON.parse wrapper - returns fallback on malformed input
 */
function safeParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Safely read a file and split into lines with size guard.
 * Returns empty array if file missing, too large, or unreadable.
 */
function safeReadLines(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) {
      console.error(
        `  [warn] File too large (${stat.size} bytes), skipping: ${path.basename(filePath)}`
      );
      return [];
    }
  } catch {
    return [];
  }
  try {
    return fs.readFileSync(filePath, "utf8").trim().split("\n").filter(Boolean); // MAX_LINES guarded by statSync above
  } catch {
    return [];
  }
}

/**
 * Run a command and capture output
 * @deprecated Use runCommandSafe() for new code — avoids shell injection risks
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
 * Run a command safely using execFileSync (no shell injection)
 * @param {string} bin - Executable name or path
 * @param {string[]} args - Array of arguments
 * @param {object} options - Options (timeout, cwd, etc.)
 * @returns {{ success: boolean, output: string, stderr: string, code: number }}
 */
function runCommandSafe(bin, args = [], options = {}) {
  try {
    const safeOptions = {
      encoding: options.encoding || "utf8",
      timeout: options.timeout || 60000,
      maxBuffer: options.maxBuffer || 10 * 1024 * 1024,
      cwd: options.cwd || ROOT_DIR,
      env: options.env,
      stdio: ["pipe", "pipe", "pipe"],
    };
    const output = execFileSync(bin, args, safeOptions);
    return { success: true, output: String(output ?? "").trim(), stderr: "", code: 0 };
  } catch (error) {
    const stdoutStr = error?.stdout == null ? "" : String(error.stdout);
    const stderrStr = error?.stderr == null ? "" : String(error.stderr);
    return {
      success: false,
      output: stdoutStr.trim(),
      stderr: stderrStr.trim(),
      code: error.status || 1,
    };
  }
}

/**
 * Add an alert to results (v2 schema: categories have {alerts:[], context:{}})
 */
function addAlert(category, severity, message, details = null, action = null) {
  if (!results.categories[category]) {
    results.categories[category] = { alerts: [], context: {} };
  }
  results.categories[category].alerts.push({
    severity,
    message,
    details,
    action,
  });
  const key = severity === "error" ? "errors" : severity === "warning" ? "warnings" : "info";
  results.summary[key]++;
}

/**
 * Add context data to a category
 */
function addContext(category, contextData) {
  if (!results.categories[category]) {
    results.categories[category] = { alerts: [], context: {} };
  }
  Object.assign(results.categories[category].context, contextData);
}

/**
 * Ensure a category always appears in output
 */
function ensureCategory(category, label) {
  if (!results.categories[category]) {
    results.categories[category] = { alerts: [], context: { no_data: true, label } };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Rate a value where higher is better (e.g., pass rate, effectiveness)
 */
function rateHigherBetter(value, benchmark) {
  if (value >= benchmark.good) return "good";
  if (value >= benchmark.average) return "average";
  return "poor";
}

/**
 * Rate a value where lower is better (e.g., error count, staleness)
 */
function rateLowerBetter(value, benchmark) {
  if (value <= benchmark.good) return "good";
  if (value <= benchmark.average) return "average";
  return "poor";
}

/**
 * Load MASTER_DEBT.jsonl and return parsed items
 */
function loadMasterDebt() {
  const debtPath = path.join(ROOT_DIR, "docs", "technical-debt", "MASTER_DEBT.jsonl");
  const lines = safeReadLines(debtPath);
  if (lines.length === 0) return [];
  return lines.map((l) => safeParse(l)).filter(Boolean);
}

/**
 * Compute trend from a JSONL log file
 * @param {string} logPath - Path to JSONL file
 * @param {string} valueField - Field name to extract values from
 * @param {number} windowSize - Number of recent entries to consider
 * @returns {{ direction: string, values: number[], delta: number, deltaPercent: number } | null}
 */
function computeTrend(logPath, valueField, windowSize = 5) {
  try {
    const lines = safeReadLines(logPath);
    const entries = lines.map((l) => safeParse(l)).filter(Boolean);

    const recent = entries.slice(-windowSize);
    if (recent.length < 2) return null;

    const values = recent
      .map((e) => valueField.split(".").reduce((obj, key) => obj?.[key], e))
      .filter((v) => typeof v === "number" && !isNaN(v));

    if (values.length < 2) return null;

    const first = values[0];
    const last = values[values.length - 1];
    const delta = last - first;
    const deltaPercent =
      first !== 0 ? Math.round((delta / first) * 100) : delta !== 0 ? (delta > 0 ? 100 : -100) : 0;

    let direction;
    if (Math.abs(deltaPercent) < 5) {
      direction = "stable";
    } else if (delta > 0) {
      direction = "increasing";
    } else {
      direction = "decreasing";
    }

    return { direction, values, delta, deltaPercent };
  } catch (err) {
    console.error(`  [warn] Failed to compute trend from ${logPath}: ${safeErrorMsg(err)}`);
    return null;
  }
}

/**
 * Group items by a field and return sorted groups with top 3 examples
 * @param {Array} items - Array of objects
 * @param {string} field - Field name to group by
 * @returns {Array<{name: string, count: number, items: Array}>}
 */
function groupByField(items, field) {
  const groups = new Map();
  for (const item of items) {
    const key = item[field] || "unknown";
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  }

  return [...groups.entries()]
    .map(([name, groupItems]) => ({
      name,
      count: groupItems.length,
      items: groupItems.slice(0, 3).map((i) => ({
        id: i.id || i.canonical_id || "",
        title: i.title || i.description || i.message || "",
        file: i.file || i.location || "",
        effort: i.effort || "",
        severity: i.severity || "",
      })),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Generate sparkline string from values array
 */
function sparkline(values) {
  if (!values || values.length === 0) return "";
  const min = values.reduce((a, b) => (b < a ? b : a), values[0] ?? 0);
  const max = values.reduce((a, b) => (b > a ? b : a), values[0] ?? 0);
  const range = max - min || 1;
  const chars = "\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588";
  return values.map((v) => chars[Math.min(7, Math.floor(((v - min) / range) * 7))]).join("");
}

// ============================================================================
// DELTA TRACKING
// ============================================================================

const BASELINE_PATH = path.join(ROOT_DIR, ".claude", "state", "alerts-baseline.json");

/**
 * Load baseline from first run in this session
 */
function loadBaseline() {
  try {
    const content = fs.readFileSync(BASELINE_PATH, "utf8");
    const baseline = safeParse(content);
    if (!baseline) return null;
    // Only use if from today (same session day)
    const baselineDateObj = new Date(baseline.timestamp);
    if (Number.isNaN(baselineDateObj.getTime())) return null;
    const baselineDate = baselineDateObj.toDateString();
    const today = new Date().toDateString();
    if (baselineDate === today) {
      return baseline;
    }
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`  [warn] Failed to load baseline: ${safeErrorMsg(err)}`);
    }
  }
  return null;
}

/**
 * Save current results as baseline (only if no baseline exists for today)
 */
function saveBaseline() {
  const existing = loadBaseline();
  if (existing) return; // Don't overwrite — keep first run as baseline

  const baseline = {
    timestamp: results.timestamp,
    healthScore: results.healthScore,
    summary: { ...results.summary },
    categoryScores: {},
  };

  // Save per-category alert counts
  for (const [cat, data] of Object.entries(results.categories)) {
    const alerts = data.alerts || [];
    baseline.categoryScores[cat] = {
      errors: alerts.filter((a) => a.severity === "error").length,
      warnings: alerts.filter((a) => a.severity === "warning").length,
      info: alerts.filter((a) => a.severity === "info").length,
    };
  }

  try {
    const stateDir = path.dirname(BASELINE_PATH);
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    const tmpPath = `${BASELINE_PATH}.tmp`;
    if (!isSafeToWrite(BASELINE_PATH) || !isSafeToWrite(tmpPath)) return;
    const data = JSON.stringify(baseline, null, 2);
    fs.writeFileSync(tmpPath, data, "utf-8"); // atomic: write .tmp then renameSync below
    if (fs.existsSync(BASELINE_PATH)) fs.rmSync(BASELINE_PATH, { force: true });
    fs.renameSync(tmpPath, BASELINE_PATH);
  } catch (err) {
    console.error(`  [warn] Failed to save baseline: ${safeErrorMsg(err)}`);
  }
}

/**
 * Compute delta from baseline
 */
function computeDelta() {
  const baseline = loadBaseline();
  if (!baseline || !baseline.healthScore) return null;
  if (!results.healthScore) return null;

  // Validate baseline shape: score must be a number, grade a string
  const bs = baseline.healthScore;
  if (typeof bs.score !== "number" || typeof bs.grade !== "string") return null;

  const delta = {
    scoreBefore: bs.score,
    gradeBefore: bs.grade,
    scoreAfter: results.healthScore.score,
    gradeAfter: results.healthScore.grade,
    scoreDelta: results.healthScore.score - bs.score,
    summaryBefore: baseline.summary,
    summaryAfter: results.summary,
    categoryChanges: {},
  };

  // Per-category changes
  for (const [cat, data] of Object.entries(results.categories)) {
    const alerts = data.alerts || [];
    const nowErrors = alerts.filter((a) => a.severity === "error").length;
    const nowWarnings = alerts.filter((a) => a.severity === "warning").length;
    const before = baseline.categoryScores?.[cat] || { errors: 0, warnings: 0, info: 0 };

    if (nowErrors !== before.errors || nowWarnings !== before.warnings) {
      delta.categoryChanges[cat] = {
        errorsBefore: before.errors,
        errorsAfter: nowErrors,
        warningsBefore: before.warnings,
        warningsAfter: nowWarnings,
      };
    }
  }

  return Object.keys(delta.categoryChanges).length > 0 ? delta : null;
}

// ============================================================================
// CODE HEALTH CHECKS
// ============================================================================

function checkCodeHealth() {
  console.error("  Checking code health...");

  let tsErrorCount = 0;
  let eslintWarnCount = 0;
  let eslintErrCount = 0;

  // TypeScript errors
  let tsResult = runCommandSafe("npm", ["run", "type-check"], { timeout: 120000 });
  const tsCombinedOutput = `${tsResult.output || ""}\n${tsResult.stderr || ""}`;
  if (tsCombinedOutput.includes("Missing script")) {
    tsResult = runCommandSafe("npx", ["tsc", "--noEmit"], { timeout: 120000 });
  }

  const tsFullOutput = `${tsResult.output || ""}\n${tsResult.stderr || ""}`;
  if (!tsResult.success && !tsFullOutput.includes("Missing script")) {
    const errorMatch = tsFullOutput.match(/Found (\d+) error/i);
    tsErrorCount = errorMatch ? Number.parseInt(errorMatch[1], 10) : 1;

    addAlert(
      "code",
      "error",
      tsErrorCount > 0 ? `${tsErrorCount} TypeScript error(s)` : "TypeScript type-check failed",
      tsFullOutput.split("\n").slice(0, 10),
      "Run: npx tsc --noEmit"
    );
  }

  // ESLint warnings
  const lintResult = runCommandSafe("npm", ["run", "lint"], { timeout: 120000 });
  const lintFullOutput = `${lintResult.output || ""}\n${lintResult.stderr || ""}`;
  if (!lintResult.success) {
    const warnMatch = lintFullOutput.match(/(\d+) warning/);
    const errMatch = lintFullOutput.match(/(\d+) error/);
    eslintWarnCount = warnMatch ? Number.parseInt(warnMatch[1], 10) : 0;
    eslintErrCount = errMatch ? Number.parseInt(errMatch[1], 10) : 0;

    if (eslintErrCount > 0) {
      addAlert("code", "error", `${eslintErrCount} ESLint error(s)`, null, "Run: npm run lint");
    }
    if (eslintWarnCount > 0) {
      addAlert(
        "code",
        "warning",
        `${eslintWarnCount} ESLint warning(s)`,
        null,
        "Run: npm run lint"
      );
    }
  }

  // Pattern violations
  const patternsResult = runCommandSafe("npm", ["run", "patterns:check"], { timeout: 60000 });
  const patternsFullOutput = `${patternsResult.output || ""}\n${patternsResult.stderr || ""}`;
  if (!patternsResult.success && patternsFullOutput.includes("violation")) {
    addAlert("code", "warning", "Pattern violations found", null, "Run: npm run patterns:check");
  }

  // Circular dependencies
  const circularResult = runCommandSafe("npm", ["run", "deps:circular"], { timeout: 60000 });
  const circularFullOutput = `${circularResult.output || ""}\n${circularResult.stderr || ""}`;
  const missingScript = /Missing script/i.test(circularFullOutput);

  if (missingScript) {
    addAlert(
      "code",
      "info",
      "Circular dependency script not configured",
      null,
      "Add deps:circular script to package.json for dependency analysis"
    );
  } else if (!circularResult.success) {
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
      addAlert(
        "code",
        "warning",
        "Circular dependency check failed to run",
        (circularResult.output || circularResult.stderr || "").split("\n").slice(0, 10),
        "Run: npm run deps:circular"
      );
    }
  }

  // Add context with benchmarks and ratings
  const tsRating = rateLowerBetter(tsErrorCount, BENCHMARKS.code.ts_errors);
  const eslintRating = rateLowerBetter(eslintWarnCount, BENCHMARKS.code.eslint_warnings);

  addContext("code", {
    benchmarks: {
      ts_errors: BENCHMARKS.code.ts_errors,
      eslint_warnings: BENCHMARKS.code.eslint_warnings,
    },
    ratings: {
      ts_errors: tsRating,
      eslint_warnings: eslintRating,
    },
    totals: {
      ts_errors: tsErrorCount,
      eslint_errors: eslintErrCount,
      eslint_warnings: eslintWarnCount,
    },
  });
}

// ============================================================================
// SECURITY CHECKS
// ============================================================================

function checkSecurity() {
  console.error("  Checking security...");

  let criticalCount = null;
  let highCount = null;
  let auditCountsKnown = false;

  // npm audit
  const auditResult = runCommandSafe("npm", ["audit", "--json"], { timeout: 60000 });
  try {
    const out = (auditResult.output || "").trim();
    const err = (auditResult.stderr || "").trim();
    const rawJson = out.startsWith("{") ? out : err.startsWith("{") ? err : "{}";
    const audit = safeParse(rawJson, {});

    const hasVulnMetadata = !!audit?.metadata?.vulnerabilities;
    if (!auditResult.success && !hasVulnMetadata) {
      addAlert(
        "security",
        "error",
        "npm audit failed to run",
        (auditResult.output || auditResult.stderr || "").split("\n").slice(0, 10),
        "Run: npm audit"
      );
    } else if (hasVulnMetadata) {
      highCount = audit.metadata?.vulnerabilities?.high ?? 0;
      criticalCount = audit.metadata?.vulnerabilities?.critical ?? 0;
      auditCountsKnown = true;

      if (criticalCount > 0) {
        addAlert(
          "security",
          "error",
          `${criticalCount} critical vulnerabilit${criticalCount === 1 ? "y" : "ies"}`,
          null,
          "Run: npm audit"
        );
      }
      if (highCount > 0) {
        addAlert(
          "security",
          "warning",
          `${highCount} high-severity vulnerabilit${highCount === 1 ? "y" : "ies"}`,
          null,
          "Run: npm audit"
        );
      }
    }
  } catch {
    addAlert(
      "security",
      auditResult.success ? "warning" : "error",
      auditResult.success ? "npm audit output was not valid JSON" : "npm audit failed to run",
      (auditResult.output || auditResult.stderr || "").split("\n").slice(0, 10),
      "Run: npm audit"
    );
  }

  // Encrypted secrets check
  const encryptedPath = path.join(ROOT_DIR, ".env.local.encrypted");
  const envLocalPath = path.join(ROOT_DIR, ".env.local");

  if (fs.existsSync(encryptedPath)) {
    let hasValidTokens = false;
    try {
      const envContent = fs.readFileSync(envLocalPath, "utf8");
      hasValidTokens =
        /SONARCLOUD_TOKEN=(?!your-|placeholder|xxx)[^\s]+/.test(envContent) ||
        /GITHUB_TOKEN=(?!your-|placeholder|xxx)[^\s]+/.test(envContent);
    } catch {
      // Not decrypted
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
  const securityResult = runCommandSafe("npm", ["run", "security:check"], { timeout: 60000 });
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

  // Context
  const criticalRating =
    auditCountsKnown && criticalCount !== null
      ? rateLowerBetter(criticalCount, BENCHMARKS.security.critical_vulns)
      : "unknown";
  const highRating =
    auditCountsKnown && highCount !== null
      ? rateLowerBetter(highCount, BENCHMARKS.security.high_vulns)
      : "unknown";

  addContext("security", {
    benchmarks: {
      critical_vulns: BENCHMARKS.security.critical_vulns,
      high_vulns: BENCHMARKS.security.high_vulns,
    },
    ratings: {
      critical_vulns: criticalRating,
      high_vulns: highRating,
    },
    totals: {
      critical: criticalCount,
      high: highCount,
    },
  });
}

// ============================================================================
// SESSION CONTEXT CHECKS
// ============================================================================

function checkSessionContext() {
  console.error("  Checking session context...");

  const sessionStatePath = path.join(ROOT_DIR, ".claude", "hooks", ".session-state.json");
  let gapHours = 0;

  try {
    const content = fs.readFileSync(sessionStatePath, "utf8");
    const state = safeParse(content);
    if (state && state.lastBegin && !state.lastEnd) {
      const beginTime = new Date(state.lastBegin).getTime();
      if (!Number.isNaN(beginTime)) {
        gapHours = Math.max(0, Math.floor((Date.now() - beginTime) / (1000 * 60 * 60)));
        addAlert(
          "session",
          "warning",
          "Previous session did not run /session-end",
          null,
          "Run: /session-end at end of sessions"
        );
      }
    }
  } catch {
    // File doesn't exist or can't be read
  }

  const gapRating = rateLowerBetter(gapHours, BENCHMARKS.session.gap_hours);

  addContext("session", {
    benchmarks: { gap_hours: BENCHMARKS.session.gap_hours },
    ratings: { gap_hours: gapRating },
    totals: { gap_hours: gapHours },
  });
}

// checkCurrentAlerts() removed — orphaned pending-alerts.json eliminated (Overhaul W1.4)

// ============================================================================
// DOCUMENTATION HEALTH (FULL MODE)
// ============================================================================

function checkDocumentationHealth() {
  console.error("  Checking documentation health...");

  // CANON validation
  const canonResult = runCommandSafe("npm", ["run", "validate:canon"], { timeout: 60000 });
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
  const crossdocResult = runCommandSafe("npm", ["run", "crossdoc:check"], { timeout: 60000 });
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
  const sessionContextPath = path.join(ROOT_DIR, "docs", "SESSION_CONTEXT.md");
  let stalenessDays = 0;
  try {
    const stats = fs.statSync(sessionContextPath);
    stalenessDays = Math.floor((Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24));
    if (stalenessDays > 7) {
      addAlert(
        "docs",
        "warning",
        `SESSION_CONTEXT.md is ${stalenessDays} days old`,
        null,
        "Update docs/SESSION_CONTEXT.md with current status"
      );
    }
  } catch {
    // File doesn't exist
  }

  const stalenessRating = rateLowerBetter(stalenessDays, BENCHMARKS.docs.staleness_days);

  addContext("docs", {
    benchmarks: { staleness_days: BENCHMARKS.docs.staleness_days },
    ratings: { staleness_days: stalenessRating },
    totals: { staleness_days: stalenessDays },
  });
}

// ============================================================================
// ROADMAP/PLANNING (FULL MODE)
// ============================================================================

function checkRoadmapPlanning() {
  console.error("  Checking roadmap/planning...");

  const roadmapPath = path.join(ROOT_DIR, "ROADMAP.md");
  let blockedCount = 0;

  try {
    const content = fs.readFileSync(roadmapPath, "utf8");

    const blockedMatches = content.match(/\[BLOCKED\]/gi);
    if (blockedMatches && blockedMatches.length > 0) {
      blockedCount = blockedMatches.length;
      addAlert(
        "roadmap",
        "warning",
        `${blockedCount} blocked item(s) in ROADMAP.md`,
        null,
        "Review ROADMAP.md for blocked items"
      );
    }

    const datePattern = /\b(202[4-9])-([01]\d)-([0-3]\d)\b/g;
    const today = new Date();
    let overdueCount = 0;

    for (const match of content.matchAll(datePattern)) {
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
    // File doesn't exist
  }

  const blockedRating = rateLowerBetter(blockedCount, BENCHMARKS.roadmap.blocked_items);

  addContext("roadmap", {
    benchmarks: { blocked_items: BENCHMARKS.roadmap.blocked_items },
    ratings: { blocked_items: blockedRating },
    totals: { blocked: blockedCount },
  });
}

// ============================================================================
// DEBT METRICS (Limited mode, Actionable)
// ============================================================================

function checkDebtMetrics() {
  console.error("  Checking debt metrics...");

  const metricsPath = path.join(ROOT_DIR, "docs", "technical-debt", "metrics.json");
  let metrics;
  try {
    metrics = safeParse(fs.readFileSync(metricsPath, "utf8"));
    if (!metrics) return;
  } catch {
    return;
  }

  const s0 = metrics.alerts?.s0_count || 0;
  const s1 = metrics.alerts?.s1_count || 0;
  const s2 = metrics.summary?.by_severity?.S2 || 0;
  const s3 = metrics.summary?.by_severity?.S3 || 0;
  const total = metrics.summary?.total || 0;
  const open = metrics.summary?.open || 0;
  const resolved = metrics.summary?.resolved || 0;
  const resRate = metrics.summary?.resolution_rate_pct || 0;

  // Load master debt for rich grouping
  const allDebt = loadMasterDebt();
  const openDebt = allDebt.filter((d) => d.status !== "resolved" && d.status !== "closed");
  const rawS0Items = Array.isArray(metrics.alerts?.s0_items) ? metrics.alerts.s0_items : [];

  // Enrich S0 items from MASTER_DEBT.jsonl (metrics.json only has id/title/file/line)
  const debtById = new Map(allDebt.filter((d) => d && d.id).map((d) => [d.id, d]));
  const s0Items = rawS0Items
    .filter((item) => item && typeof item === "object" && item.id)
    .map((item) => {
      const full = debtById.get(item.id);
      return {
        id: item.id,
        title: full?.title ?? item.title ?? "",
        file: full?.file ?? item.file ?? "",
        line: full?.line ?? item.line ?? 0,
        effort: full?.effort ?? item.effort ?? "",
        category: full?.category ?? item.category ?? "",
        description: full?.description ?? item.description ?? "",
        severity: "S0",
      };
    });

  if (s0 > 0) {
    // Group S0 by category for richer message
    const s0Groups = groupByField(s0Items, "category");
    const groupSummary = s0Groups.map((g) => `${g.name} (${g.count})`).join(" \u00b7 ");

    // Build per-item listing for details
    const itemListing = s0Items
      .map(
        (i) =>
          `${i.id}: ${i.title.substring(0, 60)} [${i.file}${i.line ? ":" + i.line : ""}] (${i.effort || "?"})`
      )
      .join("\n");

    addAlert(
      "debt-metrics",
      "error",
      `${s0} S0 critical debt item(s) need attention`,
      `${groupSummary}\n${itemListing}`,
      "Run /task-next or fix the S0 items directly"
    );
  }

  const S1_THRESHOLD = BENCHMARKS.debt.s1_threshold;
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
  const openTrend = computeTrend(logPath, "open");
  const s0Trend = computeTrend(logPath, "s0_count");

  if (openTrend && openTrend.direction === "increasing") {
    const first = openTrend.values[0];
    const last = openTrend.values[openTrend.values.length - 1];
    addAlert(
      "debt-metrics",
      "warning",
      `Debt growing: ${first} \u2192 ${last} open items (+${openTrend.deltaPercent}%)`,
      null,
      "Resolve more items than you create"
    );
  }

  addAlert(
    "debt-metrics",
    "info",
    `Debt summary: ${total} total, ${open} open, ${resRate}% resolved`,
    null,
    null
  );

  // Rate against benchmarks
  const resRateRating = rateHigherBetter(resRate, BENCHMARKS.debt.resolution_rate);

  // Group debt by category and effort
  const byCategory = groupByField(openDebt, "category");
  const byEffort = groupByField(openDebt, "effort");

  // S0 items by category
  const s0ByCategory = groupByField(s0Items, "category");

  addContext("debt-metrics", {
    benchmarks: {
      s0_target: BENCHMARKS.debt.s0_target,
      s1_threshold: BENCHMARKS.debt.s1_threshold,
      resolution_rate: BENCHMARKS.debt.resolution_rate,
    },
    ratings: {
      resolution_rate: resRateRating,
    },
    trend: {
      open: openTrend,
      s0: s0Trend,
    },
    sparklines: {
      open: openTrend ? sparkline(openTrend.values) : "",
      s0: s0Trend ? sparkline(s0Trend.values) : "",
    },
    groups: {
      by_category: byCategory,
      by_effort: byEffort,
      s0_by_category: s0ByCategory,
    },
    topItems: {
      s0: s0Items.slice(0, 5).map((i) => ({
        id: i.id || "",
        title: i.title || i.description || "",
        file: i.file || i.location || "",
        effort: i.effort || "",
      })),
    },
    totals: {
      total,
      open,
      resolved,
      s0,
      s1,
      resRate,
    },
    by_severity: {
      S0: s0,
      S1: s1,
      S2: s2,
      S3: s3,
    },
  });
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
    return;
  }

  const effectivenessMatch = content.match(/Learning Effectiveness\s*\|\s*([\d.]+)%/);
  const failingMatch = content.match(/Patterns Failing\s*\|\s*(\d+)/);
  const automationMatch = content.match(/Automation Coverage\s*\|\s*([\d.]+)%/);
  const learnedMatch = content.match(/Patterns Learned\s*\|\s*(\d+)/);
  const automatedMatch = content.match(/Patterns Automated\s*\|\s*(\d+)/);
  const criticalMatch = content.match(/Critical Pattern Success\s*\|\s*([\d.]+)%/);

  const effectiveness = effectivenessMatch ? parseFloat(effectivenessMatch[1]) : null;
  const failing = failingMatch ? Number.parseInt(failingMatch[1], 10) : 0;
  const automationCoverage = automationMatch ? parseFloat(automationMatch[1]) : null;
  const learned = learnedMatch ? Number.parseInt(learnedMatch[1], 10) : 0;
  const automated = automatedMatch ? Number.parseInt(automatedMatch[1], 10) : 0;
  const criticalSuccess = criticalMatch ? parseFloat(criticalMatch[1]) : null;

  // Rate against benchmarks
  const effectivenessRating =
    effectiveness !== null
      ? rateHigherBetter(effectiveness, BENCHMARKS.learning.effectiveness)
      : null;
  const failingRating = rateLowerBetter(failing, BENCHMARKS.learning.failing_patterns);
  const automationRating =
    automationCoverage !== null
      ? rateHigherBetter(automationCoverage, BENCHMARKS.learning.automation_coverage)
      : null;

  if (failing > 0) {
    const actionLines = [];
    const actionRegex = /\*\*\[Automation\]\*\*\s+Automate\s+"([^"]+)"/g;
    for (const m of content.matchAll(actionRegex)) {
      if (actionLines.length >= 3) break;
      actionLines.push(m[1]);
    }
    const topNames = actionLines.length > 0 ? actionLines.join(", ") : "see LEARNING_METRICS.md";

    const ratingLabel = failingRating ? ` (${failingRating})` : "";
    addAlert(
      "learning",
      "warning",
      `${failing} patterns failing to be learned${ratingLabel}`,
      null,
      `Automate top patterns: ${topNames}. Add to check-pattern-compliance.js`
    );
  }

  if (effectiveness !== null && effectiveness < BENCHMARKS.learning.effectiveness.average) {
    addAlert(
      "learning",
      "warning",
      `Learning effectiveness at ${effectiveness}% — ${effectivenessRating} (target: ${BENCHMARKS.learning.effectiveness.good}%+)`,
      null,
      "Review documentation clarity in CODE_PATTERNS.md"
    );
  }

  if (
    automationCoverage !== null &&
    automationCoverage < BENCHMARKS.learning.automation_coverage.average
  ) {
    addAlert(
      "learning",
      "info",
      `Only ${automationCoverage}% of patterns automated (${automationRating})`,
      null,
      "Run consolidation to generate automation suggestions"
    );
  }

  addContext("learning", {
    benchmarks: {
      effectiveness: BENCHMARKS.learning.effectiveness,
      automation_coverage: BENCHMARKS.learning.automation_coverage,
      failing_patterns: BENCHMARKS.learning.failing_patterns,
    },
    ratings: {
      effectiveness: effectivenessRating,
      automation_coverage: automationRating,
      failing_patterns: failingRating,
    },
    totals: {
      effectiveness,
      failing,
      automation_coverage: automationCoverage,
      learned,
      automated,
      critical_success: criticalSuccess,
    },
  });
}

// ============================================================================
// AGENT COMPLIANCE (Limited mode, Actionable)
// ============================================================================

function checkAgentCompliance() {
  console.error("  Checking agent compliance...");

  let invoked = [];
  const invocationsPath = path.join(ROOT_DIR, ".claude", "state", "agent-invocations.jsonl");
  const sessionAgentsPath = path.join(ROOT_DIR, ".claude", "hooks", ".session-agents.json");

  const invocationLines = safeReadLines(invocationsPath);
  if (invocationLines.length > 0) {
    invoked = invocationLines
      .map((l) => {
        const e = safeParse(l);
        return e ? e.agent || e.name || "" : "";
      })
      .filter(Boolean);
  } else {
    try {
      const agents = safeParse(fs.readFileSync(sessionAgentsPath, "utf8"));
      if (agents) {
        invoked = Array.isArray(agents) ? agents.map((a) => a.name || a) : Object.keys(agents);
      }
    } catch {
      // Neither file exists
    }
  }

  if (invoked.length === 0) {
    addAlert("agent-compliance", "info", "No agent invocation data yet", null, null);
  }

  let changedFiles = [];
  const lastCommitResult = runCommandSafe(
    "git",
    ["diff", "--name-only", "--diff-filter=ACM", "HEAD~1", "HEAD"],
    {
      timeout: 10000,
    }
  );
  if (lastCommitResult.success) {
    changedFiles = lastCommitResult.output
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);
  } else {
    // Fallback for initial commit: diff against empty tree
    const initialResult = runCommandSafe(
      "git",
      [
        "diff",
        "--name-only",
        "--diff-filter=ACM",
        "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
        "HEAD",
      ],
      { timeout: 10000 }
    );
    if (initialResult.success) {
      changedFiles = initialResult.output
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);
    } else {
      addContext("agent-compliance", {
        benchmarks: { compliance_pct: BENCHMARKS.agent.compliance_pct },
        ratings: { compliance: "unknown" },
        totals: { invocations: invoked.length },
      });
      return;
    }
  }
  const codeFiles = changedFiles.filter(
    (f) =>
      /\.(tsx?|jsx?|mjs|cjs)$/.test(f) && !f.startsWith("scripts/") && !f.startsWith(".claude/")
  );
  const securityFiles = changedFiles.filter((f) =>
    /security|auth|\.env|firebase\.json|firestore\.rules/i.test(f)
  );

  const hasCodeReviewer = invoked.some((n) => /code.?review/i.test(n));
  const hasSecurityAuditor = invoked.some((n) => /security.?audit/i.test(n));

  let required = 0;
  let met = 0;

  if (codeFiles.length > 0) {
    required++;
    if (hasCodeReviewer) {
      met++;
    } else {
      addAlert(
        "agent-compliance",
        "warning",
        `${codeFiles.length} code file(s) changed without code-reviewer`,
        codeFiles.slice(0, 5).join(", "),
        "Run /code-reviewer before merging"
      );
    }
  }

  if (securityFiles.length > 0) {
    required++;
    if (hasSecurityAuditor) {
      met++;
    } else {
      addAlert(
        "agent-compliance",
        "warning",
        `${securityFiles.length} security-related file(s) changed without security-auditor`,
        securityFiles.slice(0, 5).join(", "),
        "Run security-auditor agent"
      );
    }
  }

  const compliancePct = required > 0 ? Math.round((met / required) * 100) : 100;
  const complianceRating = rateHigherBetter(compliancePct, BENCHMARKS.agent.compliance_pct);

  addContext("agent-compliance", {
    benchmarks: { compliance_pct: BENCHMARKS.agent.compliance_pct },
    ratings: { compliance: complianceRating },
    totals: {
      invocations: invoked.length,
      required,
      met,
      compliance_pct: compliancePct,
    },
  });
}

// ============================================================================
// HOOK WARNINGS (Limited mode, Actionable)
// ============================================================================

function checkHookWarnings() {
  console.error("  Checking hook warnings...");

  const warningsPath = path.join(ROOT_DIR, ".claude", "hook-warnings.json");
  let data;
  try {
    data = safeParse(fs.readFileSync(warningsPath, "utf8"));
  } catch {
    addContext("hook-warnings", {
      benchmarks: { warning_age_days: BENCHMARKS.hooks.warning_age_days },
      ratings: { age: "good" },
      totals: { count: 0, age_days: 0 },
    });
    return;
  }

  const warnings = data.warnings || [];
  if (warnings.length === 0) {
    addContext("hook-warnings", {
      benchmarks: { warning_age_days: BENCHMARKS.hooks.warning_age_days },
      ratings: { age: "good" },
      totals: { count: 0, age_days: 0 },
    });
    return;
  }

  // Deduplicate by message
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

  // Age check — filter out entries with invalid/missing timestamps
  const validDates = deduped.map((w) => new Date(w.timestamp)).filter((d) => !isNaN(d.getTime()));
  const oldest =
    validDates.length > 0
      ? validDates.reduce((min, d) => (d < min ? d : min), validDates[0])
      : null;
  const ageDays = oldest ? Math.floor((Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  if (ageDays > 3) {
    addAlert(
      "hook-warnings",
      "warning",
      `Oldest hook warning is ${ageDays} days old \u2014 may need attention`,
      null,
      "Review .claude/hook-warnings.json and resolve or clear stale entries"
    );
  }

  const ageRating = rateLowerBetter(ageDays, BENCHMARKS.hooks.warning_age_days);

  addContext("hook-warnings", {
    benchmarks: { warning_age_days: BENCHMARKS.hooks.warning_age_days },
    ratings: { age: ageRating },
    totals: {
      count: deduped.length,
      errors: errors.length,
      warnings: warns.length,
      age_days: ageDays,
    },
  });
}

// ============================================================================
// SKIP ABUSE (Limited mode — audit trail for SKIP_ overrides)
// ============================================================================

function checkSkipAbuse() {
  console.error("  Checking skip abuse...");

  const logPath = path.join(ROOT_DIR, ".claude", "override-log.jsonl");
  const lines = safeReadLines(logPath);

  if (lines.length === 0) {
    addContext("skip-abuse", {
      benchmarks: BENCHMARKS.skip_abuse,
      ratings: { overrides_24h: "good", overrides_7d: "good", no_reason_pct: "good" },
      totals: { count_24h: 0, count_7d: 0, no_reason_count: 0, no_reason_pct: 0 },
    });
    return;
  }

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const entries = [];

  for (const line of lines) {
    const entry = safeParse(line);
    if (!entry || !entry.timestamp) continue;
    entries.push(entry);
  }

  const cutoff24h = now - DAY_MS;
  const cutoff7d = now - 7 * DAY_MS;

  const last24h = entries.filter((e) => {
    const t = new Date(e.timestamp).getTime();
    return !isNaN(t) && t > cutoff24h;
  });
  const last7d = entries.filter((e) => {
    const t = new Date(e.timestamp).getTime();
    return !isNaN(t) && t > cutoff7d;
  });

  const noReasonEntries = last7d.filter(
    (e) => !e.reason || e.reason === "No reason" || e.reason === "No reason provided"
  );
  const noReasonPct =
    last7d.length > 0 ? Math.round((noReasonEntries.length / last7d.length) * 100) : 0;

  // Group by check type for details (both windows for accurate reporting)
  const byType7d = Object.create(null);
  for (const e of last7d) {
    const key = String(e.check || "unknown");
    byType7d[key] = (byType7d[key] || 0) + 1;
  }
  const byType24h = Object.create(null);
  for (const e of last24h) {
    const key = String(e.check || "unknown");
    byType24h[key] = (byType24h[key] || 0) + 1;
  }

  // Rate against benchmarks
  const rate24h = rateLowerBetter(last24h.length, BENCHMARKS.skip_abuse.overrides_24h);
  const rate7d = rateLowerBetter(last7d.length, BENCHMARKS.skip_abuse.overrides_7d);
  const rateNoReason = rateLowerBetter(noReasonPct, BENCHMARKS.skip_abuse.no_reason_pct);

  // Generate alerts
  if (last24h.length >= BENCHMARKS.skip_abuse.overrides_24h.poor) {
    const typeStr = Object.entries(byType24h)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k} (${v}x)`)
      .join(", ");
    addAlert(
      "skip-abuse",
      "error",
      `${last24h.length} checks overridden in last 24h (threshold: ${BENCHMARKS.skip_abuse.overrides_24h.average})`,
      `By type (24h): ${typeStr}. Without reason (7d): ${noReasonEntries.length} of ${last7d.length} (${noReasonPct}%)`,
      "Run: node scripts/log-override.js --list"
    );
  } else if (last24h.length >= BENCHMARKS.skip_abuse.overrides_24h.average) {
    addAlert(
      "skip-abuse",
      "warning",
      `${last24h.length} check override(s) in last 24h`,
      null,
      "Run: node scripts/log-override.js --list"
    );
  }

  if (noReasonPct >= BENCHMARKS.skip_abuse.no_reason_pct.poor) {
    addAlert(
      "skip-abuse",
      "warning",
      `${noReasonPct}% of overrides in last 7d have no reason (${noReasonEntries.length}/${last7d.length})`,
      null,
      "Always provide SKIP_REASON when overriding checks"
    );
  }

  // Trend tracking: bucket entries into 5 time windows (W1.5)
  const WINDOW_COUNT = 5;
  const WINDOW_SIZE = (7 * DAY_MS) / WINDOW_COUNT; // ~1.4 days per window
  const windowCounts = Array(WINDOW_COUNT).fill(0);
  for (const e of last7d) {
    const t = new Date(e.timestamp).getTime();
    if (isNaN(t)) continue;
    const ageMs = now - t;
    if (ageMs < 0 || ageMs > 7 * DAY_MS) continue;
    const windowIdx = Math.min(WINDOW_COUNT - 1, Math.max(0, Math.floor(ageMs / WINDOW_SIZE)));
    windowCounts[WINDOW_COUNT - 1 - windowIdx]++; // oldest first
  }
  const windowValues = windowCounts;
  let trendDirection = "stable";
  if (windowValues.length >= 2) {
    const first = windowValues[0];
    const last = windowValues[windowValues.length - 1];
    const delta = last - first;
    const pct = first !== 0 ? Math.round((delta / first) * 100) : delta !== 0 ? 100 : 0;
    if (Math.abs(pct) >= 5) {
      trendDirection = delta > 0 ? "increasing" : "decreasing";
    }
  }

  addContext("skip-abuse", {
    benchmarks: BENCHMARKS.skip_abuse,
    ratings: { overrides_24h: rate24h, overrides_7d: rate7d, no_reason_pct: rateNoReason },
    trend: { direction: trendDirection, values: windowCounts },
    totals: {
      count_24h: last24h.length,
      count_7d: last7d.length,
      no_reason_count: noReasonEntries.length,
      no_reason_pct: noReasonPct,
      by_type_24h: byType24h,
      by_type_7d: byType7d,
    },
  });
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
    return;
  }

  if (files.length === 0) return;

  const latestFile = files[0];
  const lines = safeReadLines(path.join(resultsDir, latestFile));
  if (lines.length === 0) return;

  const resultsParsed = lines.map((l) => safeParse(l)).filter(Boolean);

  if (resultsParsed.length === 0) return;

  const passed = resultsParsed.filter((r) => r.status === "pass").length;
  const failed = resultsParsed.filter((r) => r.status === "fail").length;
  const errored = resultsParsed.filter((r) => r.status === "error").length;
  const total = resultsParsed.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  // Filter out entries with invalid/missing timestamps before computing age
  const validTestDates = resultsParsed
    .map((r) => new Date(r.timestamp))
    .filter((d) => !isNaN(d.getTime()));
  const latestTimestamp =
    validTestDates.length > 0
      ? validTestDates.reduce((max, d) => (d > max ? d : max), validTestDates[0])
      : null;
  const ageDays = latestTimestamp
    ? Math.floor((Date.now() - latestTimestamp.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (failed > 0) {
    const failNames = resultsParsed
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
    const errNames = resultsParsed
      .filter((r) => r.status === "error")
      .map((r) => r.test_id || r.name)
      .slice(0, 5)
      .join(", ");
    addAlert(
      "test-results",
      "warning",
      `${errored} test(s) errored in latest run (${latestFile})`,
      errNames,
      "Run /test-suite \u2014 errors may indicate environment issues"
    );
  }

  if (ageDays !== null && ageDays > 7) {
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
    `Last test run: ${passed}/${total} passed (${latestFile}, ${ageDays !== null ? ageDays + "d ago" : "age unknown"})`,
    null,
    null
  );

  // Rate against benchmarks
  const passRateRating = rateHigherBetter(passRate, BENCHMARKS.tests.pass_rate);
  const stalenessRating =
    ageDays !== null ? rateLowerBetter(ageDays, BENCHMARKS.tests.staleness_days) : null;

  addContext("test-results", {
    benchmarks: {
      pass_rate: BENCHMARKS.tests.pass_rate,
      staleness_days: BENCHMARKS.tests.staleness_days,
    },
    ratings: {
      pass_rate: passRateRating,
      staleness: stalenessRating,
    },
    totals: {
      passed,
      failed,
      errored,
      total,
      pass_rate: passRate,
      age_days: ageDays,
      file: latestFile,
    },
  });
}

// ============================================================================
// REVIEW QUALITY (Full mode, Actionable)
// ============================================================================

function checkReviewQuality() {
  console.error("  Checking review quality...");

  const metricsPath = path.join(ROOT_DIR, ".claude", "state", "review-metrics.jsonl");
  const lines = safeReadLines(metricsPath);
  if (lines.length === 0) {
    addAlert("review-quality", "info", "No review metrics data yet", null, null);
    return;
  }

  const recent = lines
    .slice(-5)
    .map((l) => safeParse(l))
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
  let avgFixRatio = 0;
  if (ratios.length > 0) {
    avgFixRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    if (avgFixRatio > 0.3) {
      addAlert(
        "review-quality",
        "warning",
        `Average fix ratio ${(avgFixRatio * 100).toFixed(0)}% (target: <25%)`,
        null,
        "Check if review scope is consistent between rounds"
      );
    }
  }

  // Average rounds
  const roundsList = recent.map((e) => e.review_rounds || e.rounds || 0).filter((r) => r > 0);
  const avgRounds =
    roundsList.length > 0 ? roundsList.reduce((a, b) => a + b, 0) / roundsList.length : 0;

  const fixRatioRating = rateLowerBetter(avgFixRatio, BENCHMARKS.review.fix_ratio);
  const roundsRating = rateLowerBetter(avgRounds, BENCHMARKS.review.max_rounds);

  addContext("review-quality", {
    benchmarks: {
      fix_ratio: BENCHMARKS.review.fix_ratio,
      max_rounds: BENCHMARKS.review.max_rounds,
    },
    ratings: {
      fix_ratio: fixRatioRating,
      rounds: roundsRating,
    },
    totals: {
      avg_fix_ratio: Math.round(avgFixRatio * 100),
      avg_rounds: Math.round(avgRounds * 10) / 10,
      recent_count: recent.length,
    },
  });
}

// ============================================================================
// CONSOLIDATION STATUS (Full mode, Actionable)
// ============================================================================

function checkConsolidation() {
  console.error("  Checking consolidation status...");

  let reviewsPending = 0;

  // Read from JSONL state files (single source of truth — Session #156)
  const statePath = path.join(ROOT_DIR, ".claude", "state", "consolidation.json");
  const reviewsPath = path.join(ROOT_DIR, ".claude", "state", "reviews.jsonl");
  try {
    const state = safeParse(fs.readFileSync(statePath, "utf8"));
    if (!state) throw new Error("Invalid consolidation state");
    const lastConsolidated =
      typeof state.lastConsolidatedReview === "number" ? state.lastConsolidatedReview : 0;
    const lines = safeReadLines(reviewsPath);
    reviewsPending = lines.reduce((count, line) => {
      const r = safeParse(line);
      return r && typeof r.id === "number" && r.id > lastConsolidated ? count + 1 : count;
    }, 0);
    if (reviewsPending >= 10) {
      addAlert(
        "consolidation",
        "warning",
        `${reviewsPending} reviews since last consolidation (threshold: 10)`,
        null,
        "Consolidation will auto-run at next session-start"
      );
    }
  } catch {
    // State files missing — first run or not yet initialized
  }

  // Check suggested rules
  let suggestedCount = 0;
  const suggestedPath = path.join(ROOT_DIR, "consolidation-output", "suggested-rules.md");
  try {
    const content = fs.readFileSync(suggestedPath, "utf8");
    const headers = content.match(/^## /gm);
    suggestedCount = headers ? headers.length : 0;
    if (suggestedCount > 0) {
      addAlert(
        "consolidation",
        "info",
        `${suggestedCount} suggested automation rule(s) pending review`,
        null,
        "Review consolidation-output/suggested-rules.md and add to check-pattern-compliance.js"
      );
    }
  } catch {
    // File missing
  }

  const pendingRating = rateLowerBetter(reviewsPending, BENCHMARKS.consolidation.reviews_pending);

  addContext("consolidation", {
    benchmarks: { reviews_pending: BENCHMARKS.consolidation.reviews_pending },
    ratings: { pending: pendingRating },
    totals: { reviews_pending: reviewsPending, suggested_rules: suggestedCount },
  });
}

// ============================================================================
// VELOCITY (Full mode, Informational)
// ============================================================================

function checkVelocity() {
  console.error("  Checking velocity...");

  const logPath = path.join(ROOT_DIR, ".claude", "state", "velocity-log.jsonl");
  const lines = safeReadLines(logPath);
  if (lines.length === 0) return;

  const recent = lines
    .slice(-5)
    .map((l) => safeParse(l))
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

  // Trend
  const velocityTrend = computeTrend(logPath, "items_completed");

  // Detect acceleration/deceleration
  let acceleration = null;
  if (completed.length >= 3) {
    const firstHalf = completed.slice(0, Math.floor(completed.length / 2));
    const secondHalf = completed.slice(Math.floor(completed.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (firstAvg > 0) {
      const change = (secondAvg - firstAvg) / firstAvg;
      if (Math.abs(change) > BENCHMARKS.velocity.acceleration_threshold) {
        acceleration = change > 0 ? "accelerating" : "decelerating";
      }
    }
  }

  const avgRating = rateHigherBetter(avg, BENCHMARKS.velocity.items_per_session);

  addContext("velocity", {
    benchmarks: { items_per_session: BENCHMARKS.velocity.items_per_session },
    ratings: { items_per_session: avgRating },
    trend: velocityTrend,
    sparkline: velocityTrend ? sparkline(velocityTrend.values) : "",
    acceleration,
    totals: {
      avg_items_per_session: Math.round(avg * 10) / 10,
      recent_sessions: recent.length,
    },
  });
}

// ============================================================================
// SESSION ACTIVITY (Full mode, Informational)
// ============================================================================

function checkSessionActivity() {
  console.error("  Checking session activity...");

  const activityPath = path.join(ROOT_DIR, ".claude", "session-activity.jsonl");
  const lines = safeReadLines(activityPath);
  if (lines.length === 0) return;

  let lastStartIdx = -1;
  const entries = [];
  for (let i = 0; i < lines.length; i++) {
    const entry = safeParse(lines[i]);
    if (!entry) continue;
    entries.push(entry);
    if (entry.type === "session_start" || entry.event === "session_start") {
      lastStartIdx = i;
    }
  }

  if (lastStartIdx >= 0) {
    const sessionEvents = entries.slice(lastStartIdx);
    const filesModified = sessionEvents.filter(
      (e) => e.type === "file_modified" || e.event === "file_modified"
    ).length;
    const commitCount = sessionEvents.filter(
      (e) => e.type === "commit" || e.event === "commit"
    ).length;
    const skillCount = sessionEvents.filter(
      (e) => e.type === "skill_invoked" || e.event === "skill_invoked"
    ).length;

    addAlert(
      "session-activity",
      "info",
      `Last session: ${filesModified} files modified, ${commitCount} commits, ${skillCount} skills invoked`,
      null,
      null
    );

    const hasEnd = sessionEvents.some((e) => e.type === "session_end" || e.event === "session_end");
    if (!hasEnd && entries.length > 1) {
      addAlert("session-activity", "info", "Previous session did not run /session-end", null, null);
    }

    addContext("session-activity", {
      totals: {
        files_modified: filesModified,
        commits: commitCount,
        skills_invoked: skillCount,
        has_session_end: hasEnd,
      },
    });
  }
}

// ============================================================================
// COMMIT ACTIVITY (Full mode, Informational)
// ============================================================================

function checkCommitActivity() {
  console.error("  Checking commit activity...");

  const logPath = path.join(ROOT_DIR, ".claude", "state", "commit-log.jsonl");
  const lines = safeReadLines(logPath);
  if (lines.length === 0) return;

  const entries = lines.map((l) => safeParse(l)).filter(Boolean);

  if (entries.length === 0) return;

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentCommits = entries.filter((e) => new Date(e.timestamp).getTime() > oneDayAgo);
  const unattributed = entries.filter((e) => !e.session && !e.seeded);

  addAlert(
    "commit-activity",
    "info",
    `${recentCommits.length} commit(s) in last 24h, ${entries.length} total in log`,
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

  const commitsWithTime = entries
    .map((e) => ({ e, t: new Date(e.timestamp).getTime() }))
    .filter((x) => !isNaN(x.t));

  const latest = commitsWithTime.length
    ? commitsWithTime.reduce((max, x) => (x.t > max.t ? x : max), commitsWithTime[0]).e
    : null;

  let hoursSinceCommit = null;
  if (latest) {
    const lastCommitAge = Date.now() - new Date(latest.timestamp).getTime();
    hoursSinceCommit = Math.floor(lastCommitAge / (1000 * 60 * 60));
    if (hoursSinceCommit > 4) {
      addAlert(
        "commit-activity",
        "info",
        `Last commit was ${hoursSinceCommit}h ago (${latest.shortHash ?? "unknown"}: ${(latest.message || "").substring(0, 60)})`,
        null,
        null
      );
    }
  }

  const hoursRating =
    hoursSinceCommit !== null
      ? rateLowerBetter(hoursSinceCommit, BENCHMARKS.commits.hours_since_last)
      : null;

  addContext("commit-activity", {
    benchmarks: { hours_since_last: BENCHMARKS.commits.hours_since_last },
    ratings: { hours_since_last: hoursRating },
    totals: {
      recent_24h: recentCommits.length,
      total: entries.length,
      unattributed: unattributed.length,
      hours_since_last: hoursSinceCommit,
    },
  });
}

// ============================================================================
// ROADMAP VALIDATION (Full mode, Actionable)
// ============================================================================

function checkRoadmapValidation() {
  console.error("  Checking roadmap validation...");

  const result = runCommandSafe("npm", ["run", "roadmap:validate"], { timeout: 30000 });
  const output = `${result.output || ""}\n${result.stderr || ""}`;

  const warningMatch = output.match(/(\d+)\s+Warning/i);
  const errorMatch = output.match(/(\d+)\s+Error/i);

  const warningCount = warningMatch ? Number.parseInt(warningMatch[1], 10) : 0;
  const errorCount = errorMatch ? Number.parseInt(errorMatch[1], 10) : 0;

  if (errorCount > 0) {
    const bulletLines = output.match(/^\s+[•·]\s+.+$/gm) || [];
    const details = bulletLines
      .slice(0, 5)
      .map((l) => l.trim())
      .join("; ");
    addAlert(
      "roadmap-health",
      "error",
      `${errorCount} roadmap validation error(s)`,
      details || null,
      "Run: npm run roadmap:validate"
    );
  }

  if (warningCount > 0) {
    const bulletLines = output.match(/^\s+[•·]\s+.+$/gm) || [];
    const details = bulletLines
      .slice(0, 5)
      .map((l) => l.trim())
      .join("; ");
    addAlert(
      "roadmap-health",
      "warning",
      `${warningCount} roadmap validation warning(s)`,
      details || null,
      "Run: npm run roadmap:validate"
    );
  }

  addContext("roadmap-health", {
    totals: { errors: errorCount, warnings: warningCount },
  });
}

// ============================================================================
// HOOK HEALTH (Full mode, Informational)
// ============================================================================

function checkHookHealth() {
  console.error("  Checking hook health...");

  const result = runCommandSafe("npm", ["run", "hooks:health"], { timeout: 30000 });
  const output = `${result.output || ""}\n${result.stderr || ""}`;

  const hookCountMatch = output.match(/All (\d+) hooks valid/i);
  const hookCount = hookCountMatch ? Number.parseInt(hookCountMatch[1], 10) : null;

  const sessionsStarted = output.match(/Total sessions started:\s*(\d+)/i);
  const sessionsCompleted = output.match(/Sessions completed:\s*(\d+)/i);
  const started = sessionsStarted ? Number.parseInt(sessionsStarted[1], 10) : 0;
  const completed = sessionsCompleted ? Number.parseInt(sessionsCompleted[1], 10) : 0;

  if (hookCount) {
    addAlert("hook-health", "info", `${hookCount} hooks registered and valid`, null, null);
  }

  let completionRate = 0;
  if (started > 0) {
    completionRate = completed > 0 ? Math.round((completed / started) * 100) : 0;
    addAlert(
      "hook-health",
      "info",
      `Session completion rate: ${completionRate}% (${completed}/${started} sessions completed)`,
      null,
      completionRate < 50 ? "Run /session-end consistently to improve completion rate" : null
    );
  }

  if (output.includes("invalid") || output.includes("ERROR")) {
    addAlert(
      "hook-health",
      "warning",
      "Hook health check found issues",
      null,
      "Run: npm run hooks:health"
    );
  }

  addContext("hook-health", {
    totals: {
      hook_count: hookCount,
      sessions_started: started,
      sessions_completed: completed,
      completion_rate: completionRate,
    },
  });
}

// ============================================================================
// NEW CHECKERS — Category A: State File Checkers (W2)
// ============================================================================

/**
 * A1: Session State — uncommitted files, stale branches (Limited mode)
 */
function checkSessionState() {
  console.error("  Checking session state...");

  const handoffPath = path.join(ROOT_DIR, ".claude", "state", "handoff.json");
  let handoff = null;
  try {
    handoff = JSON.parse(fs.readFileSync(handoffPath, "utf8"));
  } catch {
    addContext("session-state", { no_data: true, label: "Session State" });
    return;
  }

  const uncommitted = handoff.uncommittedFiles || handoff.uncommitted_files || 0;
  const untracked = handoff.untrackedCount || handoff.untracked_count || 0;
  const branch = handoff.branch || handoff.currentBranch || "unknown";

  // Check for stale branch (days since last commit on branch)
  let staleDays = 0;
  const lastCommitDate = handoff.lastCommitDate || handoff.last_commit_date;
  if (lastCommitDate) {
    const lastTs = new Date(lastCommitDate).getTime();
    if (!Number.isNaN(lastTs)) {
      const ageMs = Date.now() - lastTs;
      staleDays = ageMs > 0 ? Math.floor(ageMs / (24 * 60 * 60 * 1000)) : 0;
    }
  }

  const totalUncommitted =
    (typeof uncommitted === "number" ? uncommitted : 0) +
    (typeof untracked === "number" ? untracked : 0);

  if (totalUncommitted > BENCHMARKS.session_state.uncommitted_files.poor) {
    addAlert(
      "session-state",
      "error",
      `${totalUncommitted} uncommitted/untracked files on branch '${branch}'`,
      null,
      "Review and commit or stash changes"
    );
  } else if (totalUncommitted > BENCHMARKS.session_state.uncommitted_files.average) {
    addAlert(
      "session-state",
      "warning",
      `${totalUncommitted} uncommitted/untracked files`,
      null,
      "Review working tree"
    );
  }

  if (staleDays > BENCHMARKS.session_state.stale_branch_days.poor) {
    addAlert(
      "session-state",
      "warning",
      `Branch '${branch}' last commit ${staleDays} days ago`,
      null,
      "Consider merging or rebasing"
    );
  }

  addContext("session-state", { uncommitted: totalUncommitted, untracked, branch, staleDays });
}

/**
 * A2: Pattern Hotspots — repeat-offender files (Limited mode)
 */
function checkPatternHotspots() {
  console.error("  Checking pattern hotspots...");

  const warnedPath = path.join(ROOT_DIR, ".claude", "state", "warned-files.json");
  let data = null;
  try {
    data = JSON.parse(fs.readFileSync(warnedPath, "utf8"));
  } catch {
    addContext("pattern-hotspots", { no_data: true, label: "Pattern Hotspots" });
    return;
  }

  const files = data.files || data;
  if (!files || typeof files !== "object") {
    addContext("pattern-hotspots", { no_data: true, label: "Pattern Hotspots" });
    return;
  }

  // Count files with 3+ violations
  const entries = Object.entries(files);
  const hotspots = entries.filter(
    ([, count]) => (typeof count === "number" ? count : count?.count || 0) >= 3
  );

  if (hotspots.length > BENCHMARKS.pattern_hotspots.repeat_offenders.poor) {
    addAlert(
      "pattern-hotspots",
      "error",
      `${hotspots.length} files with 3+ pattern violations`,
      hotspots
        .slice(0, 5)
        .map(([f]) => path.basename(f))
        .join(", "),
      "Run: npm run patterns:check-all"
    );
  } else if (hotspots.length > BENCHMARKS.pattern_hotspots.repeat_offenders.average) {
    addAlert(
      "pattern-hotspots",
      "warning",
      `${hotspots.length} repeat-offender files`,
      hotspots
        .slice(0, 3)
        .map(([f]) => path.basename(f))
        .join(", "),
      "Run: npm run patterns:check"
    );
  } else if (hotspots.length > 0) {
    addAlert(
      "pattern-hotspots",
      "info",
      `${hotspots.length} file(s) with multiple violations`,
      null,
      null
    );
  }

  addContext("pattern-hotspots", {
    totalFiles: entries.length,
    hotspotCount: hotspots.length,
    topHotspots: hotspots.slice(0, 5).map(([f, c]) => ({
      file: path.basename(f),
      count: typeof c === "number" ? c : c?.count || 0,
    })),
  });
}

/**
 * A3: Debt Intake — 30-day intake velocity (Full mode)
 */
function checkDebtIntake() {
  console.error("  Checking debt intake...");

  const logPath = path.join(ROOT_DIR, "docs", "technical-debt", "logs", "intake-log.jsonl");
  const lines = safeReadLines(logPath);
  if (lines.length === 0) {
    addContext("debt-intake", { no_data: true, label: "Debt Intake" });
    return;
  }

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let intake30d = 0;
  let s0Intake = 0;
  const sources = {};

  for (const line of lines) {
    const entry = safeParse(line);
    if (!entry) continue;
    const ts = new Date(entry.timestamp || entry.date || "").getTime();
    if (isNaN(ts)) continue;
    if (ts >= thirtyDaysAgo) {
      intake30d++;
      if (entry.severity === "S0") s0Intake++;
      const src = entry.source || "unknown";
      sources[src] = (sources[src] || 0) + 1;
    }
  }

  const s0Rate = intake30d > 0 ? s0Intake / intake30d : 0;

  if (intake30d > BENCHMARKS.debt_intake.intake_30d.poor) {
    addAlert(
      "debt-intake",
      "warning",
      `${intake30d} new debt items in 30 days (high intake)`,
      `S0 rate: ${(s0Rate * 100).toFixed(0)}%`,
      "Review intake sources"
    );
  } else if (intake30d > BENCHMARKS.debt_intake.intake_30d.average) {
    addAlert("debt-intake", "info", `${intake30d} new debt items in 30 days`, null, null);
  }

  if (s0Rate > BENCHMARKS.debt_intake.s0_intake_rate.poor) {
    addAlert(
      "debt-intake",
      "error",
      `S0 intake rate ${(s0Rate * 100).toFixed(0)}% — too many critical items`,
      null,
      "Prioritize S0 resolution"
    );
  }

  addContext("debt-intake", {
    intake30d,
    s0Intake,
    s0Rate,
    topSources: Object.entries(sources)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
  });
}

/**
 * A4: Debt Resolution — resolution velocity (Full mode)
 */
function checkDebtResolution() {
  console.error("  Checking debt resolution...");

  const logPath = path.join(ROOT_DIR, "docs", "technical-debt", "logs", "resolution-log.jsonl");
  const lines = safeReadLines(logPath);
  if (lines.length === 0) {
    addContext("debt-resolution", { no_data: true, label: "Debt Resolution" });
    return;
  }

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let resolved30d = 0;

  for (const line of lines) {
    const entry = safeParse(line);
    if (!entry) continue;
    const ts = new Date(entry.timestamp || entry.date || "").getTime();
    if (isNaN(ts)) continue;
    if (ts >= thirtyDaysAgo) resolved30d++;
  }

  if (resolved30d <= BENCHMARKS.debt_resolution.resolved_30d.poor) {
    addAlert(
      "debt-resolution",
      "warning",
      `Only ${resolved30d} debt items resolved in 30 days`,
      null,
      "Prioritize tech debt resolution"
    );
  } else if (resolved30d < BENCHMARKS.debt_resolution.resolved_30d.average) {
    addAlert("debt-resolution", "info", `${resolved30d} items resolved in 30 days`, null, null);
  }

  addContext("debt-resolution", { resolved30d, totalResolutions: lines.length });
}

/**
 * A5: Context Usage — files read count (Limited mode)
 */
function checkContextUsage() {
  console.error("  Checking context usage...");

  const trackingPath = path.join(ROOT_DIR, ".claude", "hooks", ".context-tracking-state.json");
  let data = null;
  try {
    data = JSON.parse(fs.readFileSync(trackingPath, "utf8"));
  } catch {
    addContext("context-usage", { no_data: true, label: "Context Usage" });
    return;
  }

  const filesRead = data.filesRead?.length || data.files_read || 0;

  if (filesRead > BENCHMARKS.context_usage.files_read.poor) {
    addAlert(
      "context-usage",
      "warning",
      `${filesRead} files read — high context usage`,
      null,
      "Consider saving context to MCP memory"
    );
  } else if (filesRead > BENCHMARKS.context_usage.files_read.average) {
    addAlert("context-usage", "info", `${filesRead} files read this session`, null, null);
  }

  addContext("context-usage", { filesRead });
}

// ============================================================================
// NEW CHECKERS — Category B: npm Script Checkers (W2, Full mode)
// ============================================================================

/**
 * Generic npm script checker — runs a script and parses output for issues
 */
function checkNpmScript(category, label, scriptArgs, parseOutput) {
  console.error(`  Checking ${label}...`);

  const result = runCommandSafe("npm", ["run", ...scriptArgs], { timeout: 30000 });
  const output = `${result.output || ""}\n${result.stderr || ""}`;

  try {
    parseOutput(output, result);
  } catch (err) {
    addAlert(
      category,
      "info",
      `${label} check completed with parse error`,
      safeErrorMsg(err),
      null
    );
  }
}

/**
 * B1: Roadmap Hygiene (Full mode)
 */
function checkRoadmapHygiene() {
  checkNpmScript("roadmap-hygiene", "Roadmap Hygiene", ["roadmap:hygiene"], (output, result) => {
    const issueMatch = output.match(/(\d+)\s+issue/i);
    const issues = issueMatch ? Number.parseInt(issueMatch[1], 10) : result.success ? 0 : 1;

    if (issues > BENCHMARKS.roadmap_hygiene.issues.poor) {
      addAlert(
        "roadmap-hygiene",
        "error",
        `${issues} roadmap hygiene issues`,
        null,
        "Run: npm run roadmap:hygiene"
      );
    } else if (issues > BENCHMARKS.roadmap_hygiene.issues.average) {
      addAlert(
        "roadmap-hygiene",
        "warning",
        `${issues} roadmap hygiene issues`,
        null,
        "Run: npm run roadmap:hygiene"
      );
    }

    addContext("roadmap-hygiene", { issues });
  });
}

/**
 * B2: Trigger Compliance (Full mode)
 */
function checkTriggerCompliance() {
  checkNpmScript(
    "trigger-compliance",
    "Trigger Compliance",
    ["triggers:check"],
    (output, result) => {
      const failMatch = output.match(/(\d+)\s+fail/i);
      const failures = failMatch ? Number.parseInt(failMatch[1], 10) : result.success ? 0 : 1;

      if (failures > BENCHMARKS.trigger_compliance.failures.poor) {
        addAlert(
          "trigger-compliance",
          "error",
          `${failures} trigger compliance failures`,
          null,
          "Run: npm run triggers:check"
        );
      } else if (failures > BENCHMARKS.trigger_compliance.failures.average) {
        addAlert(
          "trigger-compliance",
          "warning",
          `${failures} trigger compliance issues`,
          null,
          "Run: npm run triggers:check"
        );
      }

      addContext("trigger-compliance", { failures });
    }
  );
}

/**
 * B3: Pattern Sync (Full mode)
 */
function checkPatternSync() {
  checkNpmScript("pattern-sync", "Pattern Sync", ["patterns:sync"], (output, result) => {
    const outdatedMatch = output.match(/(\d+)\s+(?:outdated|out.of.sync|stale)/i);
    const outdated = outdatedMatch ? Number.parseInt(outdatedMatch[1], 10) : result.success ? 0 : 1;

    if (outdated > BENCHMARKS.pattern_sync.outdated.poor) {
      addAlert(
        "pattern-sync",
        "warning",
        `${outdated} patterns out of sync`,
        null,
        "Run: npm run patterns:sync"
      );
    } else if (outdated > BENCHMARKS.pattern_sync.outdated.average) {
      addAlert("pattern-sync", "info", `${outdated} patterns need sync`, null, null);
    }

    addContext("pattern-sync", { outdated });
  });
}

/**
 * B4: Doc Placement (Full mode)
 */
function checkDocPlacement() {
  checkNpmScript("doc-placement", "Doc Placement", ["docs:placement"], (output, result) => {
    const misplacedMatch = output.match(/(\d+)\s+misplaced/i);
    const misplaced = misplacedMatch
      ? Number.parseInt(misplacedMatch[1], 10)
      : result.success
        ? 0
        : 1;

    if (misplaced > BENCHMARKS.doc_placement.misplaced.poor) {
      addAlert(
        "doc-placement",
        "warning",
        `${misplaced} misplaced documents`,
        null,
        "Run: npm run docs:placement"
      );
    } else if (misplaced > BENCHMARKS.doc_placement.misplaced.average) {
      addAlert("doc-placement", "info", `${misplaced} docs may be misplaced`, null, null);
    }

    addContext("doc-placement", { misplaced });
  });
}

/**
 * B5: External Links (Full mode)
 */
function checkExternalLinks() {
  checkNpmScript("external-links", "External Links", ["docs:external-links"], (output, result) => {
    const brokenMatch = output.match(/(\d+)\s+broken/i);
    const broken = brokenMatch ? Number.parseInt(brokenMatch[1], 10) : result.success ? 0 : 1;

    if (broken > BENCHMARKS.external_links.broken.poor) {
      addAlert(
        "external-links",
        "error",
        `${broken} broken external links`,
        null,
        "Run: npm run docs:external-links"
      );
    } else if (broken > BENCHMARKS.external_links.broken.average) {
      addAlert(
        "external-links",
        "warning",
        `${broken} broken links found`,
        null,
        "Run: npm run docs:external-links"
      );
    }

    addContext("external-links", { broken });
  });
}

/**
 * B6: Unused Dependencies (Full mode)
 */
function checkUnusedDeps() {
  checkNpmScript("unused-deps", "Unused Dependencies", ["deps:unused"], (output, result) => {
    const unusedMatch = output.match(/(\d+)\s+unused/i);
    const fileMatches = output.match(/^✖\s+/gm);
    // Also count lines starting with package-like names (e.g., "  packageName")
    const lineMatches = output.split("\n").filter((l) => l.trim() && /^[\s*-]*[a-z@]/.test(l));
    const unused = unusedMatch
      ? Number.parseInt(unusedMatch[1], 10)
      : fileMatches
        ? fileMatches.length
        : lineMatches.length > 0
          ? lineMatches.length
          : result.success
            ? 0
            : 0;

    if (unused > BENCHMARKS.unused_deps.unused.poor) {
      addAlert(
        "unused-deps",
        "warning",
        `${unused} unused dependencies detected`,
        null,
        "Run: npm run deps:unused"
      );
    } else if (unused > BENCHMARKS.unused_deps.unused.average) {
      addAlert("unused-deps", "info", `${unused} potentially unused deps`, null, null);
    }

    addContext("unused-deps", { unused });
  });
}

/**
 * B7: Review Churn (Full mode)
 */
function checkReviewChurn() {
  checkNpmScript("review-churn", "Review Churn", ["review:churn"], (output, result) => {
    const churnMatch = output.match(/churn[:\s]+(\d+(?:\.\d+)?)\s*%/i);
    const churnPct = churnMatch ? parseFloat(churnMatch[1]) : result.success ? 0 : null;

    if (churnPct === null) {
      addContext("review-churn", { no_data: true, label: "Review Churn" });
      return;
    }

    if (churnPct > BENCHMARKS.review_churn.churn_pct.poor) {
      addAlert(
        "review-churn",
        "warning",
        `Review churn at ${churnPct.toFixed(1)}%`,
        null,
        "High churn indicates repeated fixes"
      );
    } else if (churnPct > BENCHMARKS.review_churn.churn_pct.average) {
      addAlert("review-churn", "info", `Review churn: ${churnPct.toFixed(1)}%`, null, null);
    }

    addContext("review-churn", { churnPct });
  });
}

/**
 * B8: Backlog Health (Full mode)
 */
function checkBacklogHealth() {
  checkNpmScript("backlog-health", "Backlog Health", ["backlog:check"], (output, result) => {
    const issueMatch = output.match(/(\d+)\s+(?:issue|problem|warning)/i);
    const issues = issueMatch ? Number.parseInt(issueMatch[1], 10) : result.success ? 0 : 1;

    if (issues > BENCHMARKS.backlog_health.issues.poor) {
      addAlert(
        "backlog-health",
        "warning",
        `${issues} backlog health issues`,
        null,
        "Run: npm run backlog:check"
      );
    } else if (issues > BENCHMARKS.backlog_health.issues.average) {
      addAlert("backlog-health", "info", `${issues} backlog issues`, null, null);
    }

    addContext("backlog-health", { issues });
  });
}

// ============================================================================
// NEW CHECKERS — Category C: CI/CD Checkers (W2, Full mode)
// ============================================================================

/**
 * C1: GitHub Actions — recent workflow run status (Full mode)
 */
function checkGitHubActions() {
  console.error("  Checking GitHub Actions...");

  const result = runCommandSafe(
    "gh",
    ["run", "list", "--limit", "5", "--json", "status,conclusion,name"],
    { timeout: 15000 }
  );
  if (!result.success || !result.output) {
    addContext("github-actions", { no_data: true, label: "GitHub Actions" });
    return;
  }

  const runs = safeParse(result.output, []);
  if (!Array.isArray(runs) || runs.length === 0) {
    addContext("github-actions", { no_data: true, label: "GitHub Actions" });
    return;
  }

  const failures = runs.filter((r) => r.conclusion === "failure");
  const inProgress = runs.filter((r) => r.status === "in_progress");

  if (failures.length > BENCHMARKS.github_actions.failures.poor) {
    addAlert(
      "github-actions",
      "error",
      `${failures.length}/${runs.length} recent CI runs failed`,
      failures.map((r) => r.name).join(", "),
      "Check: gh run list"
    );
  } else if (failures.length > BENCHMARKS.github_actions.failures.average) {
    addAlert(
      "github-actions",
      "warning",
      `${failures.length} CI failure(s) in last ${runs.length} runs`,
      null,
      "Check: gh run list"
    );
  }

  if (inProgress.length > 0) {
    addAlert("github-actions", "info", `${inProgress.length} CI run(s) in progress`, null, null);
  }

  addContext("github-actions", {
    totalRuns: runs.length,
    failures: failures.length,
    inProgress: inProgress.length,
  });
}

/**
 * C2: SonarCloud — quality gate status (Full mode)
 */
function checkSonarCloud() {
  console.error("  Checking SonarCloud...");

  // Try local cache first
  const cachePath = path.join(ROOT_DIR, ".claude", "state", "sonarcloud-cache.json");
  let data = null;
  try {
    const raw = fs.readFileSync(cachePath, "utf8");
    data = JSON.parse(raw);
    // Cache valid for 1 hour
    const cacheTs = new Date(data.timestamp || "").getTime();
    const cacheAge = isNaN(cacheTs) ? Infinity : Date.now() - cacheTs;
    if (cacheAge > 60 * 60 * 1000) data = null;
  } catch {
    data = null;
  }

  if (!data) {
    // Try gh-based fetch as fallback (sonarcloud MCP may not be available)
    addContext("sonarcloud", { no_data: true, label: "SonarCloud", reason: "No recent cache" });
    return;
  }

  const status = data.qualityGate || data.status || "UNKNOWN";
  const failedConditions = data.failedConditions || [];

  if (
    status === "ERROR" ||
    failedConditions.length > BENCHMARKS.sonarcloud.failed_conditions.poor
  ) {
    addAlert(
      "sonarcloud",
      "error",
      `SonarCloud quality gate: ${status}`,
      failedConditions.map((c) => c.metricKey || c).join(", "),
      "Review SonarCloud dashboard"
    );
  } else if (failedConditions.length > BENCHMARKS.sonarcloud.failed_conditions.average) {
    addAlert(
      "sonarcloud",
      "warning",
      `${failedConditions.length} SonarCloud condition(s) failing`,
      null,
      "Review SonarCloud dashboard"
    );
  }

  addContext("sonarcloud", { status, failedConditions: failedConditions.length });
}

// ============================================================================
// SUPPRESSION FILTER (W3)
// ============================================================================

/**
 * Filter out suppressed alerts based on .claude/state/alert-suppressions.json
 * Runs after all checkers, before computeHealthScore()
 */
function filterSuppressedAlerts() {
  const suppressPath = path.join(ROOT_DIR, ".claude", "state", "alert-suppressions.json");
  let suppressions = [];
  try {
    const data = JSON.parse(fs.readFileSync(suppressPath, "utf8"));
    suppressions = data.suppressions || [];
  } catch {
    return; // No suppressions file
  }

  if (suppressions.length === 0) return;

  const now = Date.now();
  const activeSups = suppressions.filter((s) => {
    if (s.expiresAt) {
      const expiryTs = new Date(s.expiresAt).getTime();
      if (isNaN(expiryTs)) return false; // Invalid date = treat as expired
      return expiryTs > now;
    }
    return true;
  });

  if (activeSups.length === 0) return;

  let filteredCount = 0;

  for (const [cat, catData] of Object.entries(results.categories)) {
    if (!catData.alerts || catData.alerts.length === 0) continue;

    const before = catData.alerts.length;
    catData.alerts = catData.alerts.filter((alert) => {
      return !activeSups.some((sup) => {
        if (sup.category && sup.category !== cat) return false;
        // If no message pattern, suppress entire category
        const pattern = typeof sup.messagePattern === "string" ? sup.messagePattern.trim() : "";
        if (pattern === "") return true;
        // Use case-insensitive string matching (safe — no regex injection)
        const msg = typeof alert.message === "string" ? alert.message : String(alert.message ?? "");
        return msg.toLowerCase().includes(pattern.toLowerCase());
      });
    });
    filteredCount += before - catData.alerts.length;
  }

  // Recalculate summary counts
  if (filteredCount > 0) {
    results.summary = { errors: 0, warnings: 0, info: 0 };
    for (const catData of Object.values(results.categories)) {
      for (const alert of catData.alerts || []) {
        const key =
          alert.severity === "error"
            ? "errors"
            : alert.severity === "warning"
              ? "warnings"
              : "info";
        results.summary[key]++;
      }
    }
  }
}

// ============================================================================
// HEALTH SCORE LOG (W1.2)
// ============================================================================

/**
 * Append health score to history log
 */
function appendHealthScoreLog() {
  const logPath = path.join(ROOT_DIR, ".claude", "state", "health-score-log.jsonl");
  if (!isSafeToWrite(logPath)) return;
  try {
    const stateDir = path.dirname(logPath);
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    const categoryScores = {};
    if (results.healthScore?.breakdown) {
      for (const [cat, info] of Object.entries(results.healthScore.breakdown)) {
        categoryScores[cat] = info.score;
      }
    }

    const entry = JSON.stringify({
      timestamp: results.timestamp,
      mode: results.mode,
      grade: results.healthScore?.grade,
      score: results.healthScore?.score,
      summary: results.summary,
      categoryScores,
    });
    fs.appendFileSync(logPath, entry + "\n");
  } catch (err) {
    console.error(`  [warn] Failed to append health score log: ${safeErrorMsg(err)}`);
  }
}

// ============================================================================
// HEALTH SCORE COMPUTATION
// ============================================================================

function computeHealthScore() {
  // Core (70%)
  const weights = {
    code: 0.15,
    security: 0.15,
    "debt-metrics": 0.11,
    "test-results": 0.1,
    learning: 0.07,
    "skip-abuse": 0.03,
    session: 0.03,
    "agent-compliance": 0.04,
    // New state (8%)
    "session-state": 0.03,
    "pattern-hotspots": 0.03,
    "context-usage": 0.02,
    // Existing adjusted (9%)
    velocity: 0.03,
    "review-quality": 0.03,
    docs: 0.03,
    // Full-mode only (contribute when measured)
    "debt-intake": 0.02,
    "roadmap-hygiene": 0.02,
    "trigger-compliance": 0.01,
    "pattern-sync": 0.01,
    "doc-placement": 0.01,
    "external-links": 0.01,
    "unused-deps": 0.01,
    "review-churn": 0.01,
    "backlog-health": 0.01,
    "github-actions": 0.02,
    sonarcloud: 0.02,
  };

  const breakdown = {};
  let totalScore = 0;
  let measuredWeight = 0;

  for (const [cat, weight] of Object.entries(weights)) {
    const catData = results.categories[cat];

    if (!catData || catData.context?.no_data || !Array.isArray(catData?.alerts)) {
      breakdown[cat] = { score: null, weight, measured: false };
      continue;
    }

    const alerts = catData.alerts;
    const errorCount = alerts.filter((a) => a.severity === "error").length;
    const warningCount = alerts.filter((a) => a.severity === "warning").length;
    const score = Math.max(0, Math.min(100, 100 - errorCount * 30 - warningCount * 10));

    breakdown[cat] = { score, weight, measured: true };
    totalScore += score * weight;
    measuredWeight += weight;
  }

  const finalScore = measuredWeight > 0 ? Math.round(totalScore / measuredWeight) : 50;
  const grade =
    finalScore >= 90
      ? "A"
      : finalScore >= 80
        ? "B"
        : finalScore >= 70
          ? "C"
          : finalScore >= 60
            ? "D"
            : "F";

  results.healthScore = { grade, score: finalScore, breakdown };
}

// ============================================================================
// SESSION PLAN BUILDER
// ============================================================================

function buildSessionPlan() {
  const plan = [];

  for (const [cat, catData] of Object.entries(results.categories)) {
    for (const alert of catData.alerts || []) {
      if (alert.action && alert.severity !== "info") {
        plan.push({
          priority: alert.severity === "error" ? 1 : 2,
          category: cat,
          action: alert.action,
          message: alert.message,
          impact: alert.severity === "error" ? "high" : "medium",
        });
      }
    }
  }

  // Sort: errors first, then warnings
  plan.sort((a, b) => a.priority - b.priority);

  // Dynamic sizing: all errors + top warnings to fill ~5 total
  const errors = plan.filter((p) => p.priority === 1);
  const warnings = plan.filter((p) => p.priority === 2);
  const remaining = Math.max(0, 5 - errors.length);

  results.sessionPlan = [...errors, ...warnings.slice(0, remaining)];
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.error(`\n\u{1F50D} Running ${isFullMode ? "FULL" : "LIMITED"} alerts check...\n`);

  // Always run (Limited mode — 12 categories)
  checkCodeHealth();
  checkSecurity();
  checkSessionContext();
  checkDebtMetrics();
  checkLearningEffectiveness();
  checkAgentCompliance();
  checkHookWarnings();
  checkSkipAbuse();
  checkTestResults();
  // New limited-mode checkers (A1, A2, A5)
  checkSessionState();
  checkPatternHotspots();
  checkContextUsage();

  // Full mode only (additional 17 categories)
  if (isFullMode) {
    checkDocumentationHealth();
    checkRoadmapPlanning();
    checkReviewQuality();
    checkConsolidation();
    checkVelocity();
    checkSessionActivity();
    checkCommitActivity();
    checkRoadmapValidation();
    checkHookHealth();
    // New full-mode checkers (A3, A4, B1-B8, C1, C2)
    checkDebtIntake();
    checkDebtResolution();
    checkRoadmapHygiene();
    checkTriggerCompliance();
    checkPatternSync();
    checkDocPlacement();
    checkExternalLinks();
    checkUnusedDeps();
    checkReviewChurn();
    checkBacklogHealth();
    checkGitHubActions();
    checkSonarCloud();
  }

  // Ensure every limited-mode category appears
  ensureCategory("code", "Code Health");
  ensureCategory("security", "Security");
  ensureCategory("session", "Session Context");
  ensureCategory("debt-metrics", "Debt Health");
  ensureCategory("learning", "Learning Health");
  ensureCategory("agent-compliance", "Agent Compliance");
  ensureCategory("hook-warnings", "Hook Warnings");
  ensureCategory("skip-abuse", "Skip Abuse");
  ensureCategory("test-results", "Test Results");
  ensureCategory("session-state", "Session State");
  ensureCategory("pattern-hotspots", "Pattern Hotspots");
  ensureCategory("context-usage", "Context Usage");

  if (isFullMode) {
    ensureCategory("docs", "Documentation Health");
    ensureCategory("roadmap", "Roadmap/Planning");
    ensureCategory("review-quality", "Review Quality");
    ensureCategory("consolidation", "Consolidation Status");
    ensureCategory("velocity", "Velocity");
    ensureCategory("session-activity", "Session Activity");
    ensureCategory("commit-activity", "Commit Activity");
    ensureCategory("roadmap-health", "Roadmap Validation");
    ensureCategory("hook-health", "Hook Health");
    ensureCategory("debt-intake", "Debt Intake");
    ensureCategory("debt-resolution", "Debt Resolution");
    ensureCategory("roadmap-hygiene", "Roadmap Hygiene");
    ensureCategory("trigger-compliance", "Trigger Compliance");
    ensureCategory("pattern-sync", "Pattern Sync");
    ensureCategory("doc-placement", "Doc Placement");
    ensureCategory("external-links", "External Links");
    ensureCategory("unused-deps", "Unused Dependencies");
    ensureCategory("review-churn", "Review Churn");
    ensureCategory("backlog-health", "Backlog Health");
    ensureCategory("github-actions", "GitHub Actions");
    ensureCategory("sonarcloud", "SonarCloud");
  }

  // Filter suppressed alerts (W3)
  filterSuppressedAlerts();

  // Compute health score and session plan
  computeHealthScore();
  buildSessionPlan();

  // Compute delta from baseline
  const delta = computeDelta();
  if (delta) {
    results.delta = delta;
  }

  // Save baseline (first run only)
  saveBaseline();

  // Append health score to history log (W1.2)
  appendHealthScoreLog();

  // Output JSON to stdout
  console.log(JSON.stringify(results, null, 2));

  // Summary to stderr
  console.error(`\n\u2705 Health: ${results.healthScore.grade} (${results.healthScore.score}/100)`);
  console.error(
    `   Errors: ${results.summary.errors}  Warnings: ${results.summary.warnings}  Info: ${results.summary.info}`
  );
  if (delta) {
    const arrow = delta.scoreDelta > 0 ? "\u2191" : delta.scoreDelta < 0 ? "\u2193" : "\u2192";
    console.error(
      `   Delta: ${delta.gradeBefore} (${delta.scoreBefore}) ${arrow} ${delta.gradeAfter} (${delta.scoreAfter}) [${delta.scoreDelta > 0 ? "+" : ""}${delta.scoreDelta}]`
    );
  }
  console.error("");

  // Exit code based on errors
  process.exit(results.summary.errors > 0 ? 1 : 0);
}

main();
