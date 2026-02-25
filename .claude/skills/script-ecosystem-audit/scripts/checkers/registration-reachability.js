/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

/**
 * D3 Checker: Registration & Reachability
 *
 * Categories:
 *   9.  package_json_coverage      (SIA-300..309)
 *   10. cross_script_dependencies  (SIA-310..319)
 *   11. shared_lib_utilization     (SIA-320..329)
 */

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[registration-reachability] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "registration_reachability";
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

// ============================================================================
// CATEGORY 9: Package.json Coverage
// ============================================================================

function checkPackageJsonCoverage(rootDir, scriptFiles) {
  const findings = [];

  // Read package.json scripts
  let pkgScripts = {};
  try {
    const pkgContent = safeReadFile(path.join(rootDir, "package.json"));
    if (pkgContent) {
      const pkg = JSON.parse(pkgContent);
      pkgScripts = pkg.scripts || {};
    }
  } catch {
    // parse error
  }

  // Collect all file references from npm scripts
  const referencedFiles = new Set();
  const nodeRunPattern = /\bnode\s+([^\s;|&"']+\.js)/g;
  const npmRunPattern = /npm\s+run\s+(\w[\w:-]*)/g;

  for (const [, cmd] of Object.entries(pkgScripts)) {
    const cmdStr = String(cmd);
    for (const match of cmdStr.matchAll(nodeRunPattern)) {
      referencedFiles.add(match[1].replace(/\\/g, "/"));
    }
  }

  // Also check require/import references between scripts
  const internalRefs = new Set();
  const requirePattern = /require\s*\(\s*['"](\.\/[^'"]+)['"]\s*\)/g;
  const importPattern = /from\s+['"](\.\/[^'"]+)['"]/g;

  for (const sf of scriptFiles) {
    for (const match of sf.content.matchAll(requirePattern)) {
      let refPath = match[1];
      if (!refPath.endsWith(".js")) refPath += ".js";
      // Resolve relative to the script's directory
      const scriptsRoot = path.join(rootDir, "scripts");
      const absResolved = path.resolve(path.dirname(sf.filePath), refPath);
      const relToScripts = path.relative(scriptsRoot, absResolved).replace(/\\/g, "/");
      if (!/^\.\.(?:\/|$)/.test(relToScripts) && relToScripts !== "") {
        internalRefs.add(relToScripts);
      }
    }
    for (const match of sf.content.matchAll(importPattern)) {
      let refPath = match[1];
      if (!refPath.endsWith(".js")) refPath += ".js";
      const scriptsRoot = path.join(rootDir, "scripts");
      const absResolved = path.resolve(path.dirname(sf.filePath), refPath);
      const relToScripts = path.relative(scriptsRoot, absResolved).replace(/\\/g, "/");
      if (!/^\.\.(?:\/|$)/.test(relToScripts) && relToScripts !== "") {
        internalRefs.add(relToScripts);
      }
    }
  }

  // Normalize referenced files to be relative to scripts/
  const normalizedRefs = new Set();
  for (const ref of referencedFiles) {
    const norm = ref.startsWith("scripts/") ? ref.slice(8) : ref;
    normalizedRefs.add(norm);
  }

  // Check which scripts are reachable
  let totalScripts = 0;
  let reachableScripts = 0;

  for (const sf of scriptFiles) {
    // Skip test files and __tests__ directories
    if (sf.relPath.includes("__tests__") || sf.name.endsWith(".test.js")) continue;

    totalScripts++;

    const isReferencedByNpm =
      normalizedRefs.has(sf.relPath) || referencedFiles.has(`scripts/${sf.relPath}`);
    const isReferencedByScript = internalRefs.has(sf.relPath);
    // lib/ files are inherently reachable (they're shared utilities)
    const isLib = sf.relPath.startsWith("lib/") || sf.relPath.includes("/lib/");

    if (isReferencedByNpm || isReferencedByScript || isLib) {
      reachableScripts++;
    } else {
      findings.push({
        id: "SIA-300",
        category: "package_json_coverage",
        domain: DOMAIN,
        severity: "info",
        message: `Unreachable script: ${sf.relPath}`,
        details: `scripts/${sf.relPath} is not referenced by any npm script or other script`,
        impactScore: 25,
        frequency: 1,
        blastRadius: 1,
      });
    }
  }

  const reachablePct = totalScripts > 0 ? Math.round((reachableScripts / totalScripts) * 100) : 100;

  const bm = BENCHMARKS.package_json_coverage;
  const result = scoreMetric(reachablePct, bm.reachable_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_scripts: totalScripts,
        reachable_scripts: reachableScripts,
        reachable_pct: reachablePct,
        npm_referenced: normalizedRefs.size,
        internally_referenced: internalRefs.size,
      },
    },
  };
}

// ============================================================================
// CATEGORY 10: Cross-Script Dependencies
// ============================================================================

function checkCrossScriptDependencies(rootDir, scriptFiles) {
  const findings = [];

  const requirePattern = /require\s*\(\s*['"](\.\.?\/[^'"]+)['"]\s*\)/g;
  const importPattern = /from\s+['"](\.\.?\/[^'"]+)['"]/g;

  let totalDeps = 0;
  let validDeps = 0;

  for (const sf of scriptFiles) {
    const allRefs = [...sf.content.matchAll(requirePattern), ...sf.content.matchAll(importPattern)];

    for (const match of allRefs) {
      let refPath = match[1];
      totalDeps++;

      // Skip node: and package references (non-relative imports)
      const isNodeBuiltin = refPath.slice(0, 5) === "node:";
      const isRelative = refPath[0] === ".";
      if (isNodeBuiltin || !isRelative) {
        validDeps++;
        continue;
      }

      // Resolve the path
      const resolvedBase = path.resolve(path.dirname(sf.filePath), refPath);
      const candidates = [
        resolvedBase,
        resolvedBase + ".js",
        resolvedBase + ".json",
        path.join(resolvedBase, "index.js"),
      ];

      let found = false;
      for (const candidate of candidates) {
        try {
          const stat = fs.statSync(candidate);
          if (stat.isFile()) {
            found = true;
            break;
          }
        } catch {
          // not found
        }
      }

      if (found) {
        validDeps++;
      } else {
        findings.push({
          id: "SIA-310",
          category: "cross_script_dependencies",
          domain: DOMAIN,
          severity: "warning",
          message: `Broken dependency in ${sf.name}: ${refPath}`,
          details: `${sf.filePath} requires "${refPath}" but file not found`,
          impactScore: 60,
          frequency: 1,
          blastRadius: 3,
        });
      }
    }
  }

  const validPct = totalDeps > 0 ? Math.round((validDeps / totalDeps) * 100) : 100;

  const bm = BENCHMARKS.cross_script_dependencies;
  const result = scoreMetric(validPct, bm.valid_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_dependencies: totalDeps,
        valid_dependencies: validDeps,
        valid_pct: validPct,
      },
    },
  };
}

// ============================================================================
// CATEGORY 11: Shared Lib Utilization
// ============================================================================

function checkSharedLibUtilization(rootDir, scriptFiles) {
  const findings = [];

  // Identify shared libs
  const libDir = path.join(rootDir, "scripts", "lib");
  const libFiles = safeReadDir(libDir).filter((f) => f.endsWith(".js"));

  // Patterns that indicate functionality available in shared libs
  const libPatterns = [
    {
      lib: "sanitize-error.js",
      pattern: /\berr(?:or)?\.message\b/,
      desc: "error message handling",
    },
    {
      lib: "security-helpers.js",
      pattern: /\bexecSync\s*\(|\bpath\.resolve\b.*\bprocess\.argv\b/,
      desc: "secure execution/path handling",
    },
  ];

  let applicableScripts = 0;
  let utilizingScripts = 0;

  for (const sf of scriptFiles) {
    // Skip lib/ files themselves
    if (sf.relPath.startsWith("lib/") || sf.relPath.includes("/lib/")) continue;

    let couldUseLib = false;
    let usesLib = false;

    for (const lp of libPatterns) {
      if (lp.pattern.test(sf.content)) {
        couldUseLib = true;
        // Check if already importing the lib
        if (sf.content.includes(lp.lib.replace(".js", ""))) {
          usesLib = true;
        }
      }
    }

    // Also check for any require from lib/
    if (
      /require\s*\(\s*['"][^'"]*\/lib\//.test(sf.content) ||
      /from\s+['"][^'"]*\/lib\//.test(sf.content)
    ) {
      usesLib = true;
    }

    if (couldUseLib) {
      applicableScripts++;
      if (usesLib) {
        utilizingScripts++;
      } else {
        findings.push({
          id: "SIA-320",
          category: "shared_lib_utilization",
          domain: DOMAIN,
          severity: "info",
          message: `Script ${sf.name} could use shared lib utilities`,
          details: `${sf.filePath} implements patterns available in scripts/lib/ — consider importing shared utilities`,
          impactScore: 20,
          frequency: 1,
          blastRadius: 1,
        });
      }
    }
  }

  const utilizationPct =
    applicableScripts > 0 ? Math.round((utilizingScripts / applicableScripts) * 100) : 100;

  const bm = BENCHMARKS.shared_lib_utilization;
  const result = scoreMetric(utilizationPct, bm.utilization_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        lib_files_available: libFiles.length,
        applicable_scripts: applicableScripts,
        utilizing_scripts: utilizingScripts,
        utilization_pct: utilizationPct,
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

  // Category 9: Package.json Coverage
  const cat9 = checkPackageJsonCoverage(rootDir, scriptFiles);
  findings.push(...cat9.findings);
  scores.package_json_coverage = cat9.score;

  // Category 10: Cross-Script Dependencies
  const cat10 = checkCrossScriptDependencies(rootDir, scriptFiles);
  findings.push(...cat10.findings);
  scores.cross_script_dependencies = cat10.score;

  // Category 11: Shared Lib Utilization
  const cat11 = checkSharedLibUtilization(rootDir, scriptFiles);
  findings.push(...cat11.findings);
  scores.shared_lib_utilization = cat11.score;

  return { domain: DOMAIN, findings, scores };
}

module.exports = { run, DOMAIN };
