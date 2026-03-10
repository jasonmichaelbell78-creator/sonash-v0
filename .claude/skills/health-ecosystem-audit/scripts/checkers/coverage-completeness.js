/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Coverage & Completeness — Domain 5 (D5)
 *
 * 4 categories:
 *   1. checker_success_aggregation — How many checkers actually completed?
 *   2. external_tool_availability — npm, gh, tsc tool availability
 *   3. test_coverage_verification — RUNS LIVE TESTS (D#15, D#39)
 *   4. test_registry_completeness — All test sources registered
 *
 * D5 runs `npm test` live when not skipped (D#39, D#49).
 * Per-checker timeout: 30s+ for this domain (D#41).
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[coverage-completeness] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { execSync } = safeRequire("node:child_process");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "coverage_completeness";
const MAX_FILE_SIZE = 2 * 1024 * 1024;

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
 * Load test registry (D#40).
 * Uses context.registry if provided, otherwise loads from file.
 * @param {object} ctx
 * @returns {Array}
 */
function loadRegistry(ctx) {
  if (ctx.registry) return ctx.registry;

  const registryPath = path.join(ctx.rootDir, "data", "ecosystem-v2", "test-registry.jsonl");
  try {
    const content = fs.readFileSync(registryPath, "utf8");
    const entries = content
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    return entries;
  } catch {
    return [];
  }
}

function run(ctx) {
  const { rootDir } = ctx;
  const skipLiveTests = ctx.skipLiveTests || false;
  const findings = [];
  const scores = {};

  scores.checker_success_aggregation = checkCheckerSuccess(rootDir, findings);
  scores.external_tool_availability = checkToolAvailability(rootDir, findings);
  scores.test_coverage_verification = checkTestCoverage(rootDir, skipLiveTests, findings);
  scores.test_registry_completeness = checkRegistryCompleteness(ctx, findings);

  return { domain: DOMAIN, findings, scores };
}

// -- Category 1: Checker Success Aggregation ---------------------------------

function checkCheckerSuccess(rootDir, findings) {
  const bench = BENCHMARKS.checker_success_aggregation;
  const checkersDir = path.join(rootDir, "scripts", "health", "checkers");
  let totalCheckers = 0;
  let successfulCheckers = 0;

  try {
    const files = fs
      .readdirSync(checkersDir)
      .filter((f) => f.endsWith(".js") && !f.includes("__tests__") && !f.includes(".test."));
    totalCheckers = files.length;

    for (const file of files) {
      const resolved = path.join(checkersDir, file);
      const rel = path.relative(checkersDir, resolved);
      if (/^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) continue;
      const content = safeReadFile(resolved);
      if (!content) continue;

      // Check that checker exports a function and has expected structure
      const exportsFunction =
        /module\.exports|exports\.\w+\s*=/.test(content) ||
        /export\s+(?:function|const|default)/.test(content);
      const hasMetrics = /metrics/.test(content);
      const hasReturn = /return\s*\{/.test(content);

      if (exportsFunction && hasMetrics && hasReturn) {
        successfulCheckers++;
      } else {
        findings.push({
          id: "HMS-500",
          category: "checker_success_aggregation",
          domain: DOMAIN,
          severity: "warning",
          message: `Checker ${file} may have incomplete exports`,
          details: `Missing: ${!exportsFunction ? "exports " : ""}${!hasMetrics ? "metrics " : ""}${!hasReturn ? "return " : ""}`,
          impactScore: 50,
          frequency: 1,
          blastRadius: 2,
        });
      }
    }
  } catch {
    // dir not accessible
  }

  const successPct =
    totalCheckers > 0 ? Math.round((successfulCheckers / totalCheckers) * 100) : 100;
  const result = scoreMetric(successPct, bench.success_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalCheckers, successfulCheckers, successPct },
  };
}

// -- Category 2: External Tool Availability ----------------------------------

function checkToolAvailability(rootDir, findings) {
  const bench = BENCHMARKS.external_tool_availability;
  let totalTools = 0;
  let declaredTools = 0;

  // Scan health checker files for external tool usage
  const checkersDir = path.join(rootDir, "scripts", "health", "checkers");
  const tools = new Map(); // tool -> { used: bool, declared: bool }

  try {
    const files = fs
      .readdirSync(checkersDir)
      .filter((f) => f.endsWith(".js") && !f.includes("__tests__"));

    for (const file of files) {
      const resolved = path.join(checkersDir, file);
      const rel = path.relative(checkersDir, resolved);
      if (/^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) continue;
      const content = safeReadFile(resolved);
      if (!content) continue;

      // Detect tool usage
      const toolPatterns = {
        npm: /\bnpm\s|npm\b|execSync.*npm/,
        gh: /\bgh\s|gh\b|execSync.*gh/,
        tsc: /\btsc\s|tsc\b|execSync.*tsc/,
        eslint: /\beslint\b|execSync.*eslint/,
        git: /\bgit\s|git\b|execSync.*git/,
      };

      for (const [tool, pattern] of Object.entries(toolPatterns)) {
        if (pattern.test(content)) {
          if (!tools.has(tool)) tools.set(tool, { used: true, declared: false });
          else tools.get(tool).used = true;

          // Check if tool availability is tested before use
          const availabilityCheck = new RegExp(
            `which\\s+${tool}|command\\s+-v\\s+${tool}|try.*${tool}.*catch|${tool}.*available|${tool}.*found`,
            "i"
          );
          if (availabilityCheck.test(content)) {
            tools.get(tool).declared = true;
          }
        }
      }
    }
  } catch {
    // dir not accessible
  }

  for (const [tool, info] of tools) {
    totalTools++;
    if (info.declared) {
      declaredTools++;
    } else {
      findings.push({
        id: "HMS-510",
        category: "external_tool_availability",
        domain: DOMAIN,
        severity: "info",
        message: `External tool "${tool}" used without availability check`,
        details: `Checker uses ${tool} but does not verify it exists. Will fail silently if tool is missing.`,
        impactScore: 35,
        frequency: 1,
        blastRadius: 2,
      });
    }
  }

  const declaredPct = totalTools > 0 ? Math.round((declaredTools / totalTools) * 100) : 100;
  const result = scoreMetric(declaredPct, bench.declared_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalTools, declaredTools, declaredPct, tools: Object.fromEntries(tools) },
  };
}

// -- Category 3: Test Coverage Verification (RUNS LIVE TESTS) ----------------

function checkTestCoverage(rootDir, skipLiveTests, findings) {
  const bench = BENCHMARKS.test_coverage_verification;

  if (skipLiveTests) {
    findings.push({
      id: "HMS-520",
      category: "test_coverage_verification",
      domain: DOMAIN,
      severity: "info",
      message: "Live test execution skipped (--skip-live-tests)",
      details: "Test coverage based on file analysis only. Run without flag for live test results.",
      impactScore: 20,
      frequency: 1,
      blastRadius: 1,
    });

    // File-based analysis only
    return checkTestCoverageStatic(rootDir, findings);
  }

  // Run npm test live (D#15, D#39)
  let testOutput = "";
  let testExitCode = 0;
  let passRate = 0;
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  try {
    testOutput = execSync("npm test", {
      cwd: rootDir,
      encoding: "utf8",
      timeout: 120000, // 2 min timeout for live tests
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    testExitCode = err.status || 1;
    testOutput = String(err.stdout || "") + "\n" + String(err.stderr || "");
  }

  // Parse test results from output
  // node:test output format: "# tests N" "# pass N" "# fail N"
  const testsMatch = testOutput.match(/# tests\s+(\d+)/);
  const passMatch = testOutput.match(/# pass\s+(\d+)/);
  const failMatch = testOutput.match(/# fail\s+(\d+)/);

  if (testsMatch) totalTests = parseInt(testsMatch[1], 10);
  if (passMatch) passedTests = parseInt(passMatch[1], 10);
  if (failMatch) failedTests = parseInt(failMatch[1], 10);

  // Fallback: try TAP format "ok N" / "not ok N" counting
  if (totalTests === 0) {
    const okCount = (testOutput.match(/^ok\s+\d+/gm) || []).length;
    const notOkCount = (testOutput.match(/^not ok\s+\d+/gm) || []).length;
    if (okCount + notOkCount > 0) {
      passedTests = okCount;
      failedTests = notOkCount;
      totalTests = okCount + notOkCount;
    }
  }

  passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  // Generate findings for failures (D#50: one ERROR per failing test file)
  if (failedTests > 0) {
    // Extract failing test file names
    const failingFiles = new Set();
    const failPattern = /(?:not ok|FAIL|FAILED)\s.*?(\S+\.test\.\w+)/g;
    for (const match of testOutput.matchAll(failPattern)) {
      failingFiles.add(match[1]);
    }

    if (failingFiles.size > 0) {
      for (const file of failingFiles) {
        findings.push({
          id: "HMS-521",
          category: "test_coverage_verification",
          domain: DOMAIN,
          severity: "error",
          message: `Test file failing: ${file}`,
          details: `Live test execution detected failures in ${file}. Review test output for details.`,
          impactScore: 75,
          frequency: 1,
          blastRadius: 3,
        });
      }
    } else {
      findings.push({
        id: "HMS-522",
        category: "test_coverage_verification",
        domain: DOMAIN,
        severity: "error",
        message: `${failedTests} test(s) failing`,
        details: `Live test execution: ${passedTests}/${totalTests} passed. Exit code: ${testExitCode}`,
        impactScore: 75,
        frequency: failedTests,
        blastRadius: 3,
      });
    }
  }

  // D#51: Graduated coverage severity
  const coverageThreshold = 65; // CI floor from D#12
  if (passRate < coverageThreshold - 10) {
    findings.push({
      id: "HMS-523",
      category: "test_coverage_verification",
      domain: DOMAIN,
      severity: "error",
      message: `Test pass rate ${passRate}% is >10% below ${coverageThreshold}% threshold`,
      details: `Critical coverage gap: ${totalTests} total, ${passedTests} passing.`,
      impactScore: 85,
      frequency: 1,
      blastRadius: 4,
    });
  } else if (passRate < coverageThreshold) {
    findings.push({
      id: "HMS-524",
      category: "test_coverage_verification",
      domain: DOMAIN,
      severity: "warning",
      message: `Test pass rate ${passRate}% is below ${coverageThreshold}% threshold`,
      details: `Near threshold: ${totalTests} total, ${passedTests} passing.`,
      impactScore: 55,
      frequency: 1,
      blastRadius: 2,
    });
  }

  const passRateResult = scoreMetric(passRate, bench.pass_rate_pct, "higher-is-better");

  return {
    score: passRateResult.score,
    rating: passRateResult.rating,
    metrics: { totalTests, passedTests, failedTests, passRate, testExitCode, liveTestRun: true },
  };
}

function checkTestCoverageStatic(rootDir, findings) {
  const bench = BENCHMARKS.test_coverage_verification;

  // Count test files for health checkers
  const checkersTestDir = path.join(rootDir, "scripts", "health", "checkers", "__tests__");
  const libTestDir = path.join(rootDir, "scripts", "health", "lib", "__tests__");

  let totalCheckers = 0;
  let testedCheckers = 0;

  try {
    const checkerFiles = fs
      .readdirSync(path.join(rootDir, "scripts", "health", "checkers"))
      .filter((f) => f.endsWith(".js") && !f.includes("__tests__") && !f.includes(".test."));
    totalCheckers = checkerFiles.length;

    const testFiles = new Set();
    try {
      for (const f of fs.readdirSync(checkersTestDir)) {
        if (f.endsWith(".test.js")) testFiles.add(f.replace(".test.js", ".js"));
      }
    } catch {
      // no test dir
    }

    for (const checker of checkerFiles) {
      if (testFiles.has(checker)) testedCheckers++;
    }
  } catch {
    // dir not accessible
  }

  const coveragePct = totalCheckers > 0 ? Math.round((testedCheckers / totalCheckers) * 100) : 100;
  const result = scoreMetric(coveragePct, bench.coverage_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalCheckers, testedCheckers, coveragePct, liveTestRun: false },
  };
}

// -- Category 4: Test Registry Completeness ----------------------------------

function checkRegistryCompleteness(ctx, findings) {
  const bench = BENCHMARKS.test_registry_completeness;
  const registry = loadRegistry(ctx);

  if (registry.length === 0) {
    findings.push({
      id: "HMS-530",
      category: "test_registry_completeness",
      domain: DOMAIN,
      severity: "warning",
      message: "Test registry is empty or not found",
      details: "Cannot verify test registration without registry data.",
      impactScore: 50,
      frequency: 1,
      blastRadius: 2,
    });
    return { score: 0, rating: "poor", metrics: { registryEntries: 0, registeredPct: 0 } };
  }

  // Count health-related entries
  const healthEntries = registry.filter(
    (e) => e.owner === "health" || (e.path && e.path.includes("health"))
  );

  // Check: are there test_file entries for each health checker?
  const testFileEntries = registry.filter((e) => e.source_type === "test_file");
  const healthCheckerEntries = registry.filter((e) => e.source_type === "health_checker");

  // Count expected test sources
  let expectedSources = 0;
  let registeredSources = 0;

  // Health checkers should all have test_file entries
  try {
    const checkersDir = path.join(ctx.rootDir, "scripts", "health", "checkers");
    const checkerFiles = fs
      .readdirSync(checkersDir)
      .filter((f) => f.endsWith(".js") && !f.includes("__tests__") && !f.includes(".test."));
    expectedSources += checkerFiles.length;

    for (const checker of checkerFiles) {
      const hasEntry = testFileEntries.some(
        (e) => e.path && e.path.includes(checker.replace(".js", ""))
      );
      if (hasEntry) registeredSources++;
    }
  } catch {
    // dir not accessible
  }

  // Health checkers should be registered as health_checker source_type
  // Dynamically count checker files instead of hardcoding
  try {
    const auditCheckersDir = path.join(
      ctx.rootDir,
      ".claude",
      "skills",
      "health-ecosystem-audit",
      "scripts",
      "checkers"
    );
    const auditCheckerFiles = fs
      .readdirSync(auditCheckersDir)
      .filter((f) => f.endsWith(".js") && !f.includes("__tests__") && !f.includes(".test."));
    expectedSources += auditCheckerFiles.length;
  } catch {
    expectedSources += healthCheckerEntries.length; // fallback: count what we have
  }
  registeredSources += healthCheckerEntries.length;

  const registeredPct =
    expectedSources > 0 ? Math.round((registeredSources / expectedSources) * 100) : 100;
  const result = scoreMetric(registeredPct, bench.registered_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      registryEntries: registry.length,
      healthEntries: healthEntries.length,
      testFileEntries: testFileEntries.length,
      healthCheckerEntries: healthCheckerEntries.length,
      expectedSources,
      registeredSources,
      registeredPct,
    },
  };
}

module.exports = { run, DOMAIN, loadRegistry };
