/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

/**
 * D5 Checker: Testing & Reliability
 *
 * Categories:
 *   16. test_coverage       (SIA-500..509)
 *   17. test_freshness      (SIA-510..519)
 *   18. error_path_testing  (SIA-520..529)
 */

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[testing-reliability] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { execFileSync } = safeRequire("node:child_process");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "testing_reliability";
const MAX_FILE_SIZE = 1 * 1024 * 1024;

// ============================================================================
// HELPERS
// ============================================================================

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

function collectScriptFiles(baseDir) {
  const results = [];
  function walk(dir) {
    const entries = safeReadDir(dir);
    for (const entry of entries) {
      if (entry === "node_modules" || entry === ".git" || entry === "dist" || entry === "build")
        continue;
      const full = path.join(dir, entry);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          walk(full);
        } else if (stat.isFile() && entry.endsWith(".js")) {
          const content = safeReadFile(full);
          const relPath = path.relative(baseDir, full).replace(/\\/g, "/");
          results.push({ name: entry, filePath: full, content, relPath });
        }
      } catch {
        // skip
      }
    }
  }
  walk(baseDir);
  return results;
}

function collectTestFiles(baseDir) {
  const results = [];
  function walk(dir) {
    const entries = safeReadDir(dir);
    for (const entry of entries) {
      if (entry === "node_modules" || entry === ".git") continue;
      const full = path.join(dir, entry);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          walk(full);
        } else if (stat.isFile() && (entry.endsWith(".test.js") || entry.endsWith(".spec.js"))) {
          const content = safeReadFile(full);
          const relPath = path.relative(baseDir, full).replace(/\\/g, "/");
          results.push({ name: entry, filePath: full, content, relPath });
        }
      } catch {
        // skip
      }
    }
  }
  walk(baseDir);
  return results;
}

/**
 * Get git last-modified date for a file.
 * @param {string} filePath
 * @param {string} rootDir
 * @returns {Date|null}
 */
function getGitLastModified(filePath, rootDir) {
  try {
    const relFile = path.relative(rootDir, filePath).replace(/\\/g, "/");
    const result = execFileSync("git", ["log", "-1", "--format=%cI", "--", relFile], {
      cwd: rootDir,
      encoding: "utf8",
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const dateStr = result.trim();
    if (dateStr) return new Date(dateStr);
  } catch {
    // git not available or file not tracked
  }
  return null;
}

// ============================================================================
// CATEGORY 16: Test Coverage
// ============================================================================

function checkTestCoverage(baseDir, scriptFiles, testFiles) {
  const findings = [];

  // Build a map of test files by the source they cover
  const testMap = new Map();
  for (const tf of testFiles) {
    // test file name patterns: foo.test.js covers foo.js
    const baseName = tf.name.replace(/\.test\.js$/, ".js").replace(/\.spec\.js$/, ".js");
    testMap.set(baseName, tf);
  }

  let totalScripts = 0;
  let coveredScripts = 0;

  for (const sf of scriptFiles) {
    // Skip test files themselves and lib files (tested via integration)
    if (
      sf.relPath.includes("__tests__") ||
      sf.name.endsWith(".test.js") ||
      sf.name.endsWith(".spec.js")
    ) {
      continue;
    }

    totalScripts++;

    // Check for corresponding test
    const hasTest = testMap.has(sf.name);

    // Also check if the script is referenced in any test file
    let referencedInTest = false;
    if (!hasTest) {
      const scriptBaseName = sf.name.replace(".js", "");
      for (const tf of testFiles) {
        if (tf.content.includes(scriptBaseName) || tf.content.includes(sf.name)) {
          referencedInTest = true;
          break;
        }
      }
    }

    if (hasTest || referencedInTest) {
      coveredScripts++;
    } else {
      findings.push({
        id: "SIA-500",
        category: "test_coverage",
        domain: DOMAIN,
        severity: "info",
        message: `No test found for ${sf.name}`,
        details: `scripts/${sf.relPath} has no corresponding test file`,
        impactScore: 25,
        frequency: 1,
        blastRadius: 1,
        patchType: "add_test",
        patchTarget: sf.filePath.replace(".js", ".test.js"),
        patchContent: `Create test file for ${sf.name}`,
        patchImpact: "Increases test coverage for script infrastructure",
      });
    }
  }

  const coveragePct = totalScripts > 0 ? Math.round((coveredScripts / totalScripts) * 100) : 100;

  const bm = BENCHMARKS.test_coverage;
  const result = scoreMetric(coveragePct, bm.coverage_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_scripts: totalScripts,
        covered_scripts: coveredScripts,
        test_files: testFiles.length,
        coverage_pct: coveragePct,
      },
    },
  };
}

// ============================================================================
// CATEGORY 17: Test Freshness
// ============================================================================

function checkTestFreshness(rootDir, scriptFiles, testFiles) {
  const findings = [];

  // Build test-to-source mapping
  const testSourcePairs = [];
  const testMap = new Map();

  for (const tf of testFiles) {
    const baseName = tf.name.replace(/\.test\.js$/, ".js").replace(/\.spec\.js$/, ".js");
    testMap.set(baseName, tf);
  }

  for (const sf of scriptFiles) {
    if (sf.relPath.includes("__tests__") || sf.name.endsWith(".test.js")) continue;
    const testFile = testMap.get(sf.name);
    if (testFile) {
      testSourcePairs.push({ source: sf, test: testFile });
    }
  }

  if (testSourcePairs.length === 0) {
    // No test-source pairs — score as 100% (nothing to measure)
    const bm = BENCHMARKS.test_freshness;
    const result = scoreMetric(100, bm.fresh_pct, "higher-is-better");
    return {
      findings,
      score: {
        score: result.score,
        rating: result.rating,
        metrics: { total_pairs: 0, fresh_pairs: 0, fresh_pct: 100 },
      },
    };
  }

  let freshPairs = 0;
  const STALE_THRESHOLD_DAYS = 30;

  for (const pair of testSourcePairs) {
    const sourceDate = getGitLastModified(pair.source.filePath, rootDir);
    const testDate = getGitLastModified(pair.test.filePath, rootDir);

    if (!sourceDate || !testDate) {
      freshPairs++; // Can't determine — don't penalize
      continue;
    }

    const diffMs = sourceDate.getTime() - testDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays <= STALE_THRESHOLD_DAYS) {
      freshPairs++;
    } else {
      findings.push({
        id: "SIA-510",
        category: "test_freshness",
        domain: DOMAIN,
        severity: "info",
        message: `Stale test for ${pair.source.name}`,
        details: `Source modified ${sourceDate.toISOString().slice(0, 10)}, test last modified ${testDate.toISOString().slice(0, 10)} (${Math.round(diffDays)} days behind)`,
        impactScore: 30,
        frequency: 1,
        blastRadius: 1,
      });
    }
  }

  const freshPct =
    testSourcePairs.length > 0 ? Math.round((freshPairs / testSourcePairs.length) * 100) : 100;

  const bm = BENCHMARKS.test_freshness;
  const result = scoreMetric(freshPct, bm.fresh_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_pairs: testSourcePairs.length,
        fresh_pairs: freshPairs,
        stale_threshold_days: STALE_THRESHOLD_DAYS,
        fresh_pct: freshPct,
      },
    },
  };
}

// ============================================================================
// CATEGORY 18: Error Path Testing
// ============================================================================

function checkErrorPathTesting(testFiles) {
  const findings = [];

  let totalTestFiles = testFiles.length;
  let testFilesWithErrorPaths = 0;

  // Patterns that indicate error path testing
  const errorTestPatterns = [
    /\.toThrow\s*\(/,
    /\.rejects\b/,
    /\.toThrowError\s*\(/,
    /expect\s*\([^)]*\)\s*\.rejects/,
    /\.toHaveBeenCalledWith\s*\([^)]*[Ee]rror/,
    /catch\s*\(/,
    /mock.*[Ee]rror|[Ee]rror.*mock/i,
    /jest\.fn\(\)\.mockRejectedValue/,
    /jest\.fn\(\)\.mockImplementation\(\s*\(\)\s*=>\s*\{\s*throw/,
    /\.toBe\s*\(\s*(?:false|null|undefined)\s*\)/,
    /invalid|error|fail|reject|throw/i,
  ];

  for (const tf of testFiles) {
    let hasErrorPath = false;
    for (const pattern of errorTestPatterns) {
      if (pattern.test(tf.content)) {
        hasErrorPath = true;
        break;
      }
    }

    if (hasErrorPath) {
      testFilesWithErrorPaths++;
    } else {
      findings.push({
        id: "SIA-520",
        category: "error_path_testing",
        domain: DOMAIN,
        severity: "info",
        message: `No error path testing in ${tf.name}`,
        details: `${tf.relPath} does not appear to test error scenarios (no toThrow, rejects, error mocking)`,
        impactScore: 30,
        frequency: 1,
        blastRadius: 1,
      });
    }
  }

  const errorTestPct =
    totalTestFiles > 0 ? Math.round((testFilesWithErrorPaths / totalTestFiles) * 100) : 100;

  const bm = BENCHMARKS.error_path_testing;
  const result = scoreMetric(errorTestPct, bm.error_test_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_test_files: totalTestFiles,
        test_files_with_error_paths: testFilesWithErrorPaths,
        error_test_pct: errorTestPct,
      },
    },
  };
}

// ============================================================================
// MAIN
// ============================================================================

function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  const scriptsDir = path.join(rootDir, "scripts");
  const scriptFiles = collectScriptFiles(scriptsDir);
  const testFiles = collectTestFiles(scriptsDir);

  // Category 16: Test Coverage
  const cat16 = checkTestCoverage(scriptsDir, scriptFiles, testFiles);
  findings.push(...cat16.findings);
  scores.test_coverage = cat16.score;

  // Category 17: Test Freshness
  const cat17 = checkTestFreshness(rootDir, scriptFiles, testFiles);
  findings.push(...cat17.findings);
  scores.test_freshness = cat17.score;

  // Category 18: Error Path Testing
  const cat18 = checkErrorPathTesting(testFiles);
  findings.push(...cat18.findings);
  scores.error_path_testing = cat18.score;

  return { domain: DOMAIN, findings, scores };
}

module.exports = { run, DOMAIN };
