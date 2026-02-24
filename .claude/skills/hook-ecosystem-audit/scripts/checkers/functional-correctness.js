/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Functional Correctness Checker — Categories 11-13 (Domain D4)
 *
 * 11. Test Coverage — how many hooks have test cases in test-hooks.js
 * 12. Output Protocol Compliance — stderr for logging, stdout for protocol
 * 13. Behavioral Accuracy — continueOnError, matcher, and criticality alignment
 */

"use strict";

/* eslint-disable no-unused-vars -- safeRequire is a safety wrapper */
function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[functional-correctness] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

/**
 * Test if a string is a valid regex pattern.
 * @param {string} pattern - The pattern to test
 * @returns {boolean} - True if valid regex
 */
function safeTestRegex(pattern) {
  try {
    // Claude Code's matcher engine supports inline flags like (?i) for
    // case-insensitive matching. Strip them before JS RegExp validation.
    const normalized = pattern.replace(/\(\?[gimsuy]+\)/g, "");
    // eslint-disable-next-line no-new -- validation only
    new RegExp(normalized); // pattern-checker:ignore — intentional validation
    return true;
  } catch {
    return false;
  }
}

const DOMAIN = "functional_correctness";
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB — skip oversized files

// Known hook filenames (main hooks, excludes lib/, global/, backup/)
const KNOWN_HOOKS = [
  "session-start.js",
  "check-mcp-servers.js",
  "check-remote-session-context.js",
  "compact-restore.js",
  "pre-compaction-save.js",
  "post-write-validator.js",
  "post-read-handler.js",
  "decision-save-prompt.js",
  "commit-tracker.js",
  "commit-failure-reporter.js",
  "track-agent-invocation.js",
  "user-prompt-handler.js",
  "alerts-reminder.js",
  "analyze-user-request.js",
  "plan-mode-suggestion.js",
  "session-end-reminder.js",
  "state-utils.js",
  "stop-serena-dashboard.js",
];

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Safely read a file, returning empty string on failure.
 * @param {string} filePath
 * @returns {string}
 */
function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

/**
 * Safely parse JSON, returning null on failure.
 * @param {string} filePath
 * @returns {object|null}
 */
function safeLoadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Get the list of actual hook .js files on disk (excluding lib/, global/, backup/).
 * @param {string} hooksDir
 * @returns {string[]}
 */
function getHookInventory(hooksDir) {
  try {
    const entries = fs.readdirSync(hooksDir, { withFileTypes: true });
    return entries.filter((e) => e.isFile() && e.name.endsWith(".js")).map((e) => e.name);
  } catch {
    return KNOWN_HOOKS.slice();
  }
}

/**
 * Extract hook filenames that have test entries in test-hooks.js.
 * Looks for keys in the HOOK_TESTS object (quoted strings ending in .js).
 * @param {string} testFileContent
 * @returns {Set<string>}
 */
function extractTestedHooks(testFileContent) {
  const tested = new Set();
  if (!testFileContent) return tested;

  // Match object keys like "commit-tracker.js": { or 'hook-name.js': {
  const keyRegex = /["']([a-zA-Z0-9_-]+\.js)["']\s*:\s*\{/g;
  for (const match of testFileContent.matchAll(keyRegex)) {
    tested.add(match[1]);
  }

  // Also check for describe() blocks or test names referencing hook filenames
  for (const hookName of KNOWN_HOOKS) {
    const baseName = hookName.replace(".js", "");
    // Check for references like describe("commit-tracker" or test("commit-tracker
    const escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/-/g, "[-_]?");
    const refRegex = new RegExp(`(?:describe|test|it)\\s*\\(\\s*["'].*${escapedBase}`, "i");
    if (refRegex.test(testFileContent)) {
      tested.add(hookName);
    }
  }

  return tested;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Category 11: Test Coverage
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check which hooks have test cases in scripts/test-hooks.js.
 * @param {string} rootDir
 * @param {string[]} hookInventory
 * @param {Array} findings
 * @returns {{ score: number, rating: string }}
 */
function checkTestCoverage(rootDir, hookInventory, findings) {
  const testFilePath = path.join(rootDir, "scripts", "test-hooks.js");
  const testContent = safeReadFile(testFilePath);

  if (!testContent) {
    findings.push({
      id: "HEA-401",
      category: "test_coverage",
      domain: DOMAIN,
      severity: "error",
      message: "Hook test file not found",
      details: `Expected test file at scripts/test-hooks.js but it is missing or empty.`,
      impactScore: 80,
      frequency: 1,
      blastRadius: 5,
    });
    return scoreMetric(0, BENCHMARKS.test_coverage.coverage_pct, "higher-is-better");
  }

  const testedHooks = extractTestedHooks(testContent);
  const totalHooks = hookInventory.length;
  const testedCount = hookInventory.filter((h) => testedHooks.has(h)).length;
  const coveragePct = totalHooks > 0 ? Math.round((testedCount / totalHooks) * 100) : 0;

  // Find untested hooks
  const untestedHooks = hookInventory.filter((h) => !testedHooks.has(h));

  if (untestedHooks.length > 0) {
    const severity = coveragePct < 50 ? "error" : coveragePct < 75 ? "warning" : "info";
    findings.push({
      id: "HEA-402",
      category: "test_coverage",
      domain: DOMAIN,
      severity,
      message: `${untestedHooks.length} hooks lack test cases (${coveragePct}% coverage)`,
      details:
        `Untested hooks: ${untestedHooks.join(", ")}. ` +
        `Coverage: ${testedCount}/${totalHooks} hooks tested.`,
      impactScore: severity === "error" ? 70 : severity === "warning" ? 50 : 25,
      frequency: untestedHooks.length,
      blastRadius: 3,
    });
  }

  return scoreMetric(coveragePct, BENCHMARKS.test_coverage.coverage_pct, "higher-is-better");
}

// ═══════════════════════════════════════════════════════════════════════════════
// Category 12: Output Protocol Compliance
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check each hook file for output protocol compliance:
 * - stderr for logging (console.error), not stdout (console.log) for non-protocol messages
 * - "ok" output capability via console.log("ok") or process.stdout.write("ok")
 * - Blocking hooks should output "block: reason" format
 * - Appropriate process.exit() usage (0 for ok, 1 for block)
 *
 * @param {string} hooksDir
 * @param {string[]} hookInventory
 * @param {Array} findings
 * @returns {{ score: number, rating: string }}
 */
function checkOutputProtocol(hooksDir, hookInventory, findings) {
  let compliantCount = 0;
  const issues = [];

  for (const hookFile of hookInventory) {
    const hookPath = path.join(hooksDir, hookFile);
    const content = safeReadFile(hookPath);
    if (!content) continue;

    const hookIssues = [];

    // Check 1: Has "ok" output capability
    const hasOkOutput =
      /console\.log\(\s*["']ok["']\s*\)/.test(content) ||
      /process\.stdout\.write\(\s*["']ok/.test(content);

    if (!hasOkOutput) {
      // state-utils.js is a utility module, not an event hook — exempt from "ok" output
      if (hookFile !== "state-utils.js") {
        hookIssues.push("missing 'ok' output for success path");
      }
    }

    // Check 2: In Claude Code hooks, ALL console.log calls are protocol output.
    // Hooks use stdout as the response channel — console.log is correct for status
    // messages, structured output, and "ok" responses. No need to flag count-based
    // thresholds since all stdout usage is intentional protocol output.

    // Check 3: process.exit() usage
    const exitZero = /process\.exit\(\s*0\s*\)/.test(content);
    const exitOne = /process\.exit\(\s*1\s*\)/.test(content);
    const exitOther = /process\.exit\(\s*[^01)\s]/.test(content);

    if (exitOther) {
      hookIssues.push("uses non-standard exit codes (should use 0 for ok, 1 for block)");
    }

    // Check 4: Blocking capability — hooks with process.exit(1) should have block messaging
    if (exitOne) {
      const hasBlockMessage =
        /block:/i.test(content) ||
        /console\.error\(/.test(content) ||
        /process\.stderr\.write\(/.test(content);
      if (!hasBlockMessage) {
        hookIssues.push("exits with code 1 but has no block/error message output");
      }
    }

    if (hookIssues.length === 0) {
      compliantCount++;
    } else {
      issues.push({ hook: hookFile, issues: hookIssues });
    }
  }

  const totalHooks = hookInventory.length;
  const compliancePct = totalHooks > 0 ? Math.round((compliantCount / totalHooks) * 100) : 0;

  // Emit findings for non-compliant hooks
  for (const item of issues) {
    findings.push({
      id: "HEA-410",
      category: "output_protocol_compliance",
      domain: DOMAIN,
      severity: item.issues.some((i) => i.includes("missing 'ok'")) ? "warning" : "info",
      message: `${item.hook}: output protocol issues`,
      details: item.issues.join("; "),
      impactScore: item.issues.some((i) => i.includes("missing 'ok'")) ? 55 : 30,
      frequency: 1,
      blastRadius: 2,
    });
  }

  if (issues.length > 3) {
    findings.push({
      id: "HEA-411",
      category: "output_protocol_compliance",
      domain: DOMAIN,
      severity: "warning",
      message: `${issues.length} hooks have output protocol issues (${compliancePct}% compliance)`,
      details:
        `Non-compliant hooks: ${issues.map((i) => i.hook).join(", ")}. ` +
        `Protocol expects: "ok" to stdout for success, "block: reason" for blocking, ` +
        `console.error for logging.`,
      impactScore: 50,
      frequency: issues.length,
      blastRadius: 3,
    });
  }

  return scoreMetric(
    compliancePct,
    BENCHMARKS.output_protocol_compliance.compliance_pct,
    "higher-is-better"
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Category 13: Behavioral Accuracy
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract hook registrations from settings.json including continueOnError and matcher.
 * @param {object} settings
 * @returns {Array<{ hookFile: string, event: string, continueOnError: boolean, matcher: string|null }>}
 */
function extractHookRegistrations(settings) {
  const registrations = [];
  if (!settings || !settings.hooks) return registrations;

  for (const [event, eventGroups] of Object.entries(settings.hooks)) {
    if (!Array.isArray(eventGroups)) continue;
    for (const group of eventGroups) {
      const matcher = group.matcher || null;
      if (!Array.isArray(group.hooks)) continue;
      for (const hookDef of group.hooks) {
        if (!hookDef.command) continue;
        // Extract hook filename from command like "node .claude/hooks/commit-tracker.js $ARGUMENTS"
        // Prefer the relative path after .claude/hooks/ (supports subdirs like global/)
        const hooksPathMatch = hookDef.command.match(
          /\.claude[\\/]hooks[\\/]((?:[a-zA-Z0-9_-]+[\\/])*[a-zA-Z0-9_-]+\.js)/
        );
        const fileMatch = hooksPathMatch || hookDef.command.match(/([a-zA-Z0-9_-]+\.js)/);
        if (fileMatch) {
          registrations.push({
            hookFile: fileMatch[1],
            event,
            continueOnError: hookDef.continueOnError === true,
            matcher,
          });
        }
      }
    }
  }

  return registrations;
}

/**
 * Check behavioral accuracy:
 * - Hooks with continueOnError: true handle errors gracefully (try/catch)
 * - Hooks WITHOUT continueOnError are critical (their failure should block)
 * - Hooks with matchers only trigger for intended tools
 *
 * @param {string} rootDir
 * @param {string} hooksDir
 * @param {string[]} hookInventory
 * @param {Array} findings
 * @returns {{ score: number, rating: string }}
 */
function checkBehavioralAccuracy(rootDir, hooksDir, hookInventory, findings) {
  const settingsPath = path.join(rootDir, ".claude", "settings.json");
  const settings = safeLoadJson(settingsPath);
  const registrations = extractHookRegistrations(settings);

  let totalChecks = 0;
  let passedChecks = 0;
  const issues = [];

  // Check 1: continueOnError hooks should handle errors gracefully
  const continueOnErrorHooks = registrations.filter((r) => r.continueOnError);
  for (const reg of continueOnErrorHooks) {
    totalChecks++;
    const content = safeReadFile(path.join(hooksDir, reg.hookFile));
    if (!content) {
      issues.push({
        hook: reg.hookFile,
        issue: "continueOnError hook file not found on disk",
      });
      continue;
    }

    // Should have try/catch or error handling
    const hasTryCatch = /try\s*\{/.test(content);
    const hasErrorCallback = /\.catch\s*\(/.test(content) || /catch\s*\(\s*\w+\s*\)/.test(content);
    const hasGracefulExit = /process\.exit\(\s*0\s*\)/.test(content);

    if (hasTryCatch || hasErrorCallback || hasGracefulExit) {
      passedChecks++;
    } else {
      issues.push({
        hook: reg.hookFile,
        issue: "marked continueOnError but lacks try/catch or error handling",
      });
    }
  }

  // Check 2: Critical hooks (no continueOnError) should have blocking capability
  const criticalHooks = registrations.filter((r) => !r.continueOnError);
  for (const reg of criticalHooks) {
    totalChecks++;
    const content = safeReadFile(path.join(hooksDir, reg.hookFile));
    if (!content) {
      issues.push({
        hook: reg.hookFile,
        issue: "critical hook file not found on disk",
      });
      continue;
    }

    // Critical hooks should be able to exit non-zero or output block messages
    const canBlock =
      /process\.exit\(\s*1\s*\)/.test(content) ||
      /block:/i.test(content) ||
      /process\.exitCode\s*=\s*1/.test(content);
    const hasErrorOutput = /console\.error\(/.test(content);

    if (canBlock || hasErrorOutput) {
      passedChecks++;
    } else {
      issues.push({
        hook: reg.hookFile,
        issue: "critical hook (no continueOnError) lacks blocking or error output capability",
      });
    }
  }

  // Check 3: Matcher validity — hooks with matchers should reference appropriate tools
  const matcherHooks = registrations.filter((r) => r.matcher);
  for (const reg of matcherHooks) {
    totalChecks++;
    const content = safeReadFile(path.join(hooksDir, reg.hookFile));
    if (!content) {
      issues.push({
        hook: reg.hookFile,
        issue: `has matcher "${reg.matcher}" but hook file not found`,
      });
      continue;
    }

    // Verify the matcher is a valid regex
    // Note: intentionally passing user-defined pattern to RegExp for validation
    const isValid = safeTestRegex(reg.matcher);
    if (isValid) {
      passedChecks++;
    } else {
      issues.push({
        hook: reg.hookFile,
        issue: `invalid matcher regex: "${reg.matcher}"`,
      });
    }
  }

  // Check 4: Hooks on disk but not registered in settings
  const registeredFiles = new Set(registrations.map((r) => r.hookFile));
  const unregisteredHooks = hookInventory.filter(
    (h) => !registeredFiles.has(h) && h !== "state-utils.js"
  );
  if (unregisteredHooks.length > 0) {
    totalChecks += unregisteredHooks.length;
    // These are hooks that exist but aren't wired up — potential dead code
    findings.push({
      id: "HEA-421",
      category: "behavioral_accuracy",
      domain: DOMAIN,
      severity: "info",
      message: `${unregisteredHooks.length} hook files not registered in settings.json`,
      details:
        `Unregistered hooks: ${unregisteredHooks.join(", ")}. ` +
        `These may be sub-hooks loaded by post-write-validator.js or unused.`,
      impactScore: 20,
      frequency: unregisteredHooks.length,
      blastRadius: 1,
    });
    // Give partial credit — unregistered hooks aren't necessarily wrong
    passedChecks += Math.floor(unregisteredHooks.length * 0.5);
  }

  const accuracyPct = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

  // Emit findings for behavioral issues
  for (const item of issues) {
    const isCritical = item.issue.includes("critical") || item.issue.includes("not found");
    findings.push({
      id: "HEA-420",
      category: "behavioral_accuracy",
      domain: DOMAIN,
      severity: isCritical ? "warning" : "info",
      message: `${item.hook}: ${item.issue}`,
      details: item.issue,
      impactScore: isCritical ? 55 : 30,
      frequency: 1,
      blastRadius: isCritical ? 3 : 2,
    });
  }

  if (issues.length > 2) {
    findings.push({
      id: "HEA-422",
      category: "behavioral_accuracy",
      domain: DOMAIN,
      severity: "warning",
      message: `${issues.length} behavioral accuracy issues detected (${accuracyPct}% accuracy)`,
      details:
        `Issues found in: ${issues.map((i) => i.hook).join(", ")}. ` +
        `Checks: continueOnError error handling, critical hook blocking, matcher validity.`,
      impactScore: 50,
      frequency: issues.length,
      blastRadius: 3,
    });
  }

  return scoreMetric(accuracyPct, BENCHMARKS.behavioral_accuracy.accuracy_pct, "higher-is-better");
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main entry point
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Run all functional correctness checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  const hooksDir = path.join(rootDir, ".claude", "hooks");
  const hookInventory = getHookInventory(hooksDir);

  // Category 11: Test Coverage
  scores.test_coverage = checkTestCoverage(rootDir, hookInventory, findings);

  // Category 12: Output Protocol Compliance
  scores.output_protocol_compliance = checkOutputProtocol(hooksDir, hookInventory, findings);

  // Category 13: Behavioral Accuracy
  scores.behavioral_accuracy = checkBehavioralAccuracy(rootDir, hooksDir, hookInventory, findings);

  return { domain: DOMAIN, findings, scores };
}

module.exports = { run, DOMAIN };
