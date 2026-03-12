/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Checker Infrastructure & Reliability — Domain 1 (D1)
 *
 * 5 categories:
 *   1. command_execution_robustness — Timeouts, fallbacks, tool detection
 *   2. file_io_safety — Race conditions, missing files, encoding, size guards
 *   3. benchmark_configuration — Hardcoded thresholds, validation, drift
 *   4. edge_case_handling — Empty output, malformed JSON, NaN, bounds
 *   5. error_propagation — Silent failures vs explicit errors
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    let m;
    if (e instanceof Error) {
      m = e.message;
    } else {
      m = String(e);
    }
    throw new Error(`[checker-infrastructure] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "checker_infrastructure";
const MAX_FILE_SIZE = 1 * 1024 * 1024;

function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function safeReadDir(dirPath) {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

/**
 * Get all health checker and lib source files.
 */
function getHealthFiles(rootDir) {
  const healthDir = path.join(rootDir, "scripts", "health");
  const files = [];

  // Checker files
  const checkersDir = path.join(healthDir, "checkers");
  for (const name of safeReadDir(checkersDir)) {
    if (name.endsWith(".js") && !name.includes("__tests__")) {
      const rel = path.relative(checkersDir, path.join(checkersDir, name));
      if (/^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) continue;
      const filePath = path.join(checkersDir, name);
      const content = safeReadFile(filePath);
      if (content) files.push({ name, filePath, content, type: "checker" });
    }
  }

  // Lib files
  const libDir = path.join(healthDir, "lib");
  for (const name of safeReadDir(libDir)) {
    if (name.endsWith(".js") && !name.includes("__tests__")) {
      const rel = path.relative(libDir, path.join(libDir, name));
      if (/^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) continue;
      const filePath = path.join(libDir, name);
      const content = safeReadFile(filePath);
      if (content) files.push({ name, filePath, content, type: "lib" });
    }
  }

  // Runner
  const runnerPath = path.join(healthDir, "run-health-check.js");
  const runnerContent = safeReadFile(runnerPath);
  if (runnerContent) {
    files.push({
      name: "run-health-check.js",
      filePath: runnerPath,
      content: runnerContent,
      type: "runner",
    });
  }

  return files;
}

function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};
  const healthFiles = getHealthFiles(rootDir);

  if (healthFiles.length === 0) {
    findings.push({
      id: "HMS-100",
      category: "command_execution_robustness",
      domain: DOMAIN,
      severity: "error",
      message: "No health monitoring files found in scripts/health/",
      details: "The health monitoring system directory is missing or empty.",
      impactScore: 95,
      frequency: 1,
      blastRadius: 5,
    });
    scores.command_execution_robustness = { score: 0, rating: "poor", metrics: {} };
    scores.file_io_safety = { score: 0, rating: "poor", metrics: {} };
    scores.benchmark_configuration = { score: 0, rating: "poor", metrics: {} };
    scores.edge_case_handling = { score: 0, rating: "poor", metrics: {} };
    scores.error_propagation = { score: 0, rating: "poor", metrics: {} };
    return { domain: DOMAIN, findings, scores };
  }

  scores.command_execution_robustness = checkCommandExecution(healthFiles, findings);
  scores.file_io_safety = checkFileIoSafety(healthFiles, findings);
  scores.benchmark_configuration = checkBenchmarkConfig(rootDir, healthFiles, findings);
  scores.edge_case_handling = checkEdgeCases(healthFiles, findings);
  scores.error_propagation = checkErrorPropagation(healthFiles, findings);

  return { domain: DOMAIN, findings, scores };
}

// -- Category 1: Command Execution Robustness --------------------------------

function checkCommandExecution(healthFiles, findings) {
  const bench = BENCHMARKS.command_execution_robustness;
  let totalExecCalls = 0;
  let withTimeout = 0;
  let withFallback = 0;

  const execPattern = /\b(?:execSync|execFileSync|exec|execFile|spawnSync|spawn)\b/g;
  const timeoutPattern = /timeout\s*[:=]/;
  const fallbackPattern = /\bcatch\b|\bfallback\b|\bdefault\b/i;

  for (const file of healthFiles) {
    const matches = file.content.match(execPattern);
    if (!matches) continue;

    totalExecCalls += matches.length;
    const lines = file.content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      // Reset lastIndex BEFORE .test() to avoid /g sticky position bug
      execPattern.lastIndex = 0;
      if (execPattern.test(lines[i])) {
        const context = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 10)).join("\n");

        if (timeoutPattern.test(context)) {
          withTimeout++;
        } else {
          findings.push({
            id: "HMS-101",
            category: "command_execution_robustness",
            domain: DOMAIN,
            severity: "warning",
            message: `Command execution without timeout in ${file.name}`,
            details: `Line ${i + 1}: exec call without timeout option. May hang indefinitely.`,
            impactScore: 60,
            frequency: 1,
            blastRadius: 3,
            patchType: "add_timeout",
            patchTarget: file.filePath,
            patchContent: "Add { timeout: 10000 } option to exec call",
          });
        }

        if (fallbackPattern.test(context)) {
          withFallback++;
        }
      }
    }
  }

  const timeoutPct = totalExecCalls > 0 ? Math.round((withTimeout / totalExecCalls) * 100) : 100;
  const fallbackPct = totalExecCalls > 0 ? Math.round((withFallback / totalExecCalls) * 100) : 100;

  const timeoutResult = scoreMetric(timeoutPct, bench.timeout_coverage_pct, "higher-is-better");
  const fallbackResult = scoreMetric(fallbackPct, bench.fallback_coverage_pct, "higher-is-better");
  const avgScore = Math.round((timeoutResult.score + fallbackResult.score) / 2);

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: { totalExecCalls, withTimeout, withFallback, timeoutPct, fallbackPct },
  };
}

// -- Category 2: File I/O Safety ---------------------------------------------

function checkFileIoSafety(healthFiles, findings) {
  const bench = BENCHMARKS.file_io_safety;
  let totalIoCalls = 0;
  let guardedCalls = 0;

  const ioOps = [
    "readFileSync",
    "readFile",
    "writeFileSync",
    "writeFile",
    "appendFileSync",
    "appendFile",
    "existsSync",
  ];
  const ioPattern = new RegExp("\\b(?:" + ioOps.join("|") + ")\\b", "g");
  const tryCatchPattern = /\btry\s*\{/;
  const sizeGuardPattern = /stat\.size|MAX_FILE_SIZE|file\.size|\.size\s*>/;

  for (const file of healthFiles) {
    const lines = file.content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const matches = lines[i].match(ioPattern);
      if (!matches) continue;

      totalIoCalls += matches.length;
      const contextBefore = lines.slice(Math.max(0, i - 10), i + 1).join("\n");

      if (tryCatchPattern.test(contextBefore)) {
        guardedCalls += matches.length;
      } else {
        findings.push({
          id: "HMS-110",
          category: "file_io_safety",
          domain: DOMAIN,
          severity: "warning",
          message: `File I/O without try/catch in ${file.name}`,
          details: `Line ${i + 1}: ${lines[i].trim().slice(0, 120)}`,
          impactScore: 55,
          frequency: 1,
          blastRadius: 2,
          patchType: "add_try_catch",
          patchTarget: file.filePath,
        });
      }
    }

    // Check for file size guards on read operations
    const hasReadOps = /readFileSync|readFile/.test(file.content);
    const hasSizeGuard = sizeGuardPattern.test(file.content);

    if (hasReadOps && !hasSizeGuard && file.type === "checker") {
      findings.push({
        id: "HMS-111",
        category: "file_io_safety",
        domain: DOMAIN,
        severity: "info",
        message: `No file size guard in checker ${file.name}`,
        details: "Checker reads files without checking size. Large files could cause OOM.",
        impactScore: 40,
        frequency: 1,
        blastRadius: 2,
      });
    }
  }

  const guardedPct = totalIoCalls > 0 ? Math.round((guardedCalls / totalIoCalls) * 100) : 100;
  const result = scoreMetric(guardedPct, bench.guarded_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalIoCalls, guardedCalls, guardedPct },
  };
}

// -- Category 3: Benchmark Configuration -------------------------------------

function checkBenchmarkConfig(rootDir, healthFiles, findings) {
  const bench = BENCHMARKS.benchmark_configuration;
  let driftCount = 0;

  // Check for hardcoded thresholds in checker files (should use lib/scoring.js benchmarks)
  const hardcodedPattern = /(?:good|average|poor|threshold)\s*[:=]\s*\d+/g;

  for (const file of healthFiles) {
    if (file.type !== "checker") continue;

    const matches = file.content.match(hardcodedPattern);
    if (matches && matches.length > 0) {
      // Only flag if the file does NOT import from a benchmark/scoring module
      const usesBenchmarks = /require.*(?:scoring|benchmark|composite)/.test(file.content);
      if (!usesBenchmarks) {
        driftCount++;
        findings.push({
          id: "HMS-120",
          category: "benchmark_configuration",
          domain: DOMAIN,
          severity: "info",
          message: `Hardcoded thresholds in ${file.name} without benchmark import`,
          details: `Found ${matches.length} threshold-like patterns. Consider centralizing in scoring/benchmark module.`,
          impactScore: 30,
          frequency: matches.length,
          blastRadius: 1,
        });
      }
    }
  }

  // Check composite.js weights sum to ~1.0
  const compositePath = path.join(rootDir, "scripts", "health", "lib", "composite.js");
  const compositeContent = safeReadFile(compositePath);
  if (compositeContent) {
    const weightMatch = compositeContent.match(/CATEGORY_WEIGHTS\s*=\s*\{([^}]+)\}/s);
    if (weightMatch) {
      const nums = weightMatch[1].match(/:\s*(0\.\d+)/g);
      if (nums) {
        const sum = nums.reduce((acc, n) => acc + parseFloat(n.replace(/^:\s*/, "")), 0);
        if (Math.abs(sum - 1.0) > 0.02) {
          driftCount++;
          findings.push({
            id: "HMS-121",
            category: "benchmark_configuration",
            domain: DOMAIN,
            severity: "error",
            message: `Category weights in composite.js sum to ${sum.toFixed(3)} (expected ~1.0)`,
            details: "Weight sum drift causes inaccurate composite scores.",
            impactScore: 80,
            frequency: 1,
            blastRadius: 4,
            patchType: "fix_weight",
            patchTarget: compositePath,
          });
        }
      }
    }
  }

  const result = scoreMetric(driftCount, bench.drift_count, "lower-is-better");
  return {
    score: result.score,
    rating: result.rating,
    metrics: { driftCount },
  };
}

// -- Category 4: Edge Case Handling ------------------------------------------

function checkEdgeCases(healthFiles, findings) {
  const bench = BENCHMARKS.edge_case_handling;
  let totalChecks = 0;
  let handledChecks = 0;

  for (const file of healthFiles) {
    if (file.type !== "checker") continue;

    // Check: JSON.parse with catch
    const jsonParses = (file.content.match(/JSON\.parse/g) || []).length;
    const jsonInTry = (file.content.match(/try\s*\{[^}]*JSON\.parse/g) || []).length;
    totalChecks += jsonParses;
    handledChecks += Math.min(jsonInTry, jsonParses);

    if (jsonParses > jsonInTry) {
      findings.push({
        id: "HMS-130",
        category: "edge_case_handling",
        domain: DOMAIN,
        severity: "warning",
        message: `Unguarded JSON.parse in ${file.name}`,
        details: `${jsonParses - jsonInTry} JSON.parse call(s) without try/catch. Malformed input will crash checker.`,
        impactScore: 60,
        frequency: jsonParses - jsonInTry,
        blastRadius: 3,
      });
    }

    // Check: NaN propagation guards
    const numericOps = (
      file.content.match(/Math\.round|Math\.min|Math\.max|toFixed|parseInt|parseFloat/g) || []
    ).length;
    const nanChecks = (file.content.match(/isNaN|Number\.isNaN|Number\.isFinite/g) || []).length;
    if (numericOps > 3 && nanChecks === 0) {
      totalChecks++;
      findings.push({
        id: "HMS-131",
        category: "edge_case_handling",
        domain: DOMAIN,
        severity: "info",
        message: `No NaN guards in ${file.name} (${numericOps} numeric operations)`,
        details:
          "Numeric operations without NaN checks. Division by zero or bad input will propagate NaN.",
        impactScore: 35,
        frequency: 1,
        blastRadius: 2,
      });
    } else if (numericOps > 0) {
      totalChecks++;
      if (nanChecks > 0) handledChecks++;
    }

    // Check: empty array / empty result handling
    const arrayOps = (file.content.match(/\.length\s*[=><!]/g) || []).length;
    if (arrayOps > 0) {
      totalChecks++;
      handledChecks++;
    }
  }

  const handledPct = totalChecks > 0 ? Math.round((handledChecks / totalChecks) * 100) : 100;
  const result = scoreMetric(handledPct, bench.handled_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalChecks, handledChecks, handledPct },
  };
}

// -- Category 5: Error Propagation -------------------------------------------

function checkErrorPropagation(healthFiles, findings) {
  const bench = BENCHMARKS.error_propagation;
  let totalChecks = 0;
  let explicitChecks = 0;

  for (const file of healthFiles) {
    if (file.type !== "checker") continue;

    // Check: does checker return no_data vs 0 score appropriately?
    const returnsNoData = /no_data\s*[:=]\s*true/.test(file.content);
    const returnsZeroScore = /score\s*[:=]\s*0/.test(file.content);
    const hasCatchBlocks = (file.content.match(/\bcatch\b/g) || []).length;
    const silentCatches = (
      file.content.match(/catch\s*(?:\([^)]*\)\s*)?\{\s*(?:\/\/[^\n]*\n\s*)*\}/g) || []
    ).length;

    totalChecks += hasCatchBlocks;
    explicitChecks += hasCatchBlocks - silentCatches;

    if (silentCatches > 1) {
      findings.push({
        id: "HMS-140",
        category: "error_propagation",
        domain: DOMAIN,
        severity: "warning",
        message: `${silentCatches} silent catch blocks in ${file.name}`,
        details:
          "Empty catch blocks swallow errors. Consumers cannot distinguish error from empty result.",
        impactScore: 55,
        frequency: silentCatches,
        blastRadius: 3,
      });
    }

    // Check: does export function distinguish no_data from zero score?
    if (returnsZeroScore && !returnsNoData) {
      totalChecks++;
      findings.push({
        id: "HMS-141",
        category: "error_propagation",
        domain: DOMAIN,
        severity: "info",
        message: `${file.name} returns score 0 without no_data flag`,
        details: "Consumers cannot distinguish 'checker failed' from 'genuinely zero score'.",
        impactScore: 30,
        frequency: 1,
        blastRadius: 2,
      });
    } else if (returnsNoData) {
      totalChecks++;
      explicitChecks++;
    }
  }

  const explicitPct = totalChecks > 0 ? Math.round((explicitChecks / totalChecks) * 100) : 100;
  const result = scoreMetric(explicitPct, bench.explicit_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalChecks, explicitChecks, explicitPct },
  };
}

module.exports = { run, DOMAIN };
