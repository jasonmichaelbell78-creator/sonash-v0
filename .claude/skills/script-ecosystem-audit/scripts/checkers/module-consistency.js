/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

/**
 * D1 Checker: Module System & Consistency
 *
 * Categories:
 *   1. cjs_esm_consistency     (SIA-100..109)
 *   2. shebang_entry_point     (SIA-110..119)
 *   3. nodejs_api_compatibility (SIA-120..129)
 */

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[module-consistency] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "module_consistency";
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

/**
 * Recursively collect all .js files under a directory.
 * Returns array of { name, filePath, content, dir }.
 */
function collectScriptFiles(baseDir) {
  const results = [];

  function walk(dir) {
    const entries = safeReadDir(dir);
    for (const entry of entries) {
      if (entry === "node_modules" || entry === ".git" || entry === "dist" || entry === "build") {
        continue;
      }
      const full = path.join(dir, entry);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          walk(full);
        } else if (stat.isFile() && entry.endsWith(".js")) {
          const content = safeReadFile(full);
          results.push({
            name: entry,
            filePath: full,
            content,
            dir: path.relative(baseDir, dir) || ".",
          });
        }
      } catch {
        // skip inaccessible
      }
    }
  }

  walk(baseDir);
  return results;
}

// ============================================================================
// CATEGORY 1: CJS/ESM Consistency
// ============================================================================

function checkCjsEsmConsistency(scriptFiles) {
  const findings = [];

  // Group files by directory
  const dirMap = new Map();
  for (const sf of scriptFiles) {
    if (!dirMap.has(sf.dir)) dirMap.set(sf.dir, []);
    dirMap.get(sf.dir).push(sf);
  }

  const requirePattern = /\brequire\s*\(/;
  const importPattern = /\bimport\s+(?:\{[^}]*\}|[\w*]+|\*\s+as\s+\w+)\s+from\s+['"]/;
  const exportDefaultPattern = /\bexport\s+(?:default|const|function|class)\b/;

  let totalDirs = 0;
  let consistentDirs = 0;

  for (const [dir, files] of dirMap) {
    if (files.length < 2) {
      // Single-file dirs are trivially consistent
      totalDirs++;
      consistentDirs++;
      continue;
    }

    totalDirs++;
    let cjsCount = 0;
    let esmCount = 0;

    for (const sf of files) {
      const usesCjs = requirePattern.test(sf.content) || /\bmodule\.exports\b/.test(sf.content);
      const usesEsm = importPattern.test(sf.content) || exportDefaultPattern.test(sf.content);

      if (usesCjs && !usesEsm) cjsCount++;
      else if (usesEsm && !usesCjs) esmCount++;
      else if (usesCjs && usesEsm) {
        // Mixed in a single file
        findings.push({
          id: "SIA-100",
          category: "cjs_esm_consistency",
          domain: DOMAIN,
          severity: "warning",
          message: `Mixed CJS/ESM in single file: ${sf.name}`,
          details: `${sf.filePath} uses both require() and import/export statements`,
          impactScore: 55,
          frequency: 1,
          blastRadius: 2,
          patchType: "fix_module_system",
          patchTarget: sf.filePath,
          patchContent: "Convert to consistent module system (CJS or ESM)",
          patchImpact: "Eliminates module system ambiguity",
        });
      }
    }

    // Check directory-level consistency
    if (cjsCount > 0 && esmCount > 0) {
      findings.push({
        id: "SIA-101",
        category: "cjs_esm_consistency",
        domain: DOMAIN,
        severity: "info",
        message: `Mixed module systems in directory: ${dir}`,
        details: `${dir}/ has ${cjsCount} CJS files and ${esmCount} ESM files`,
        impactScore: 35,
        frequency: 1,
        blastRadius: 2,
      });
    } else {
      consistentDirs++;
    }
  }

  const consistencyPct = totalDirs > 0 ? Math.round((consistentDirs / totalDirs) * 100) : 100;

  const bm = BENCHMARKS.cjs_esm_consistency;
  const result = scoreMetric(consistencyPct, bm.consistency_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_directories: totalDirs,
        consistent_directories: consistentDirs,
        consistency_pct: consistencyPct,
      },
    },
  };
}

// ============================================================================
// CATEGORY 2: Shebang & Entry Point Validation
// ============================================================================

function checkShebangEntryPoint(rootDir, scriptFiles) {
  const findings = [];

  // Read package.json scripts section
  let pkgScripts = {};
  try {
    const pkgPath = path.join(rootDir, "package.json");
    const pkgContent = safeReadFile(pkgPath);
    if (pkgContent) {
      const pkg = JSON.parse(pkgContent);
      pkgScripts = pkg.scripts || {};
    }
  } catch {
    // package.json parse error — will score zero
  }

  // Extract file paths from npm script commands
  const scriptFileRefs = new Set();
  const nodeRunPattern = /\bnode\s+([^\s;|&"']+\.js)/g;

  for (const [, cmd] of Object.entries(pkgScripts)) {
    for (const match of String(cmd).matchAll(nodeRunPattern)) {
      scriptFileRefs.add(match[1]);
    }
  }

  let totalEntryPoints = 0;
  let validEntryPoints = 0;

  for (const ref of scriptFileRefs) {
    totalEntryPoints++;
    const refPath = path.join(rootDir, ref);

    // Check file exists
    try {
      const stat = fs.statSync(refPath);
      if (!stat.isFile()) {
        findings.push({
          id: "SIA-110",
          category: "shebang_entry_point",
          domain: DOMAIN,
          severity: "error",
          message: `npm script references non-file: ${ref}`,
          details: `${ref} exists but is not a regular file`,
          impactScore: 75,
          frequency: 1,
          blastRadius: 3,
        });
        continue;
      }
    } catch {
      findings.push({
        id: "SIA-111",
        category: "shebang_entry_point",
        domain: DOMAIN,
        severity: "error",
        message: `npm script references missing file: ${ref}`,
        details: `${ref} referenced in package.json scripts but file does not exist`,
        impactScore: 80,
        frequency: 1,
        blastRadius: 3,
      });
      continue;
    }

    validEntryPoints++;
  }

  // Check for scripts with shebang that might be run directly
  for (const sf of scriptFiles) {
    if (sf.content.startsWith("#!/")) {
      // Valid shebang — check if it's correct
      const firstLine = sf.content.split("\n")[0].replace(/\r$/, "");
      if (!/^(?:#!\/usr\/bin\/env\s+node|#!\/usr\/bin\/node)\b/.test(firstLine)) {
        findings.push({
          id: "SIA-112",
          category: "shebang_entry_point",
          domain: DOMAIN,
          severity: "info",
          message: `Non-standard shebang in ${sf.name}`,
          details: `${sf.filePath}: "${firstLine}" — consider using #!/usr/bin/env node`,
          impactScore: 20,
          frequency: 1,
          blastRadius: 1,
        });
      }
    }
  }

  const validPct =
    totalEntryPoints > 0 ? Math.round((validEntryPoints / totalEntryPoints) * 100) : 100;

  const bm = BENCHMARKS.shebang_entry_point;
  const result = scoreMetric(validPct, bm.valid_entry_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_entry_points: totalEntryPoints,
        valid_entry_points: validEntryPoints,
        valid_pct: validPct,
      },
    },
  };
}

// ============================================================================
// CATEGORY 3: Node.js API Compatibility
// ============================================================================

function checkNodejsApiCompatibility(scriptFiles) {
  const findings = [];

  const deprecatedApis = [
    {
      pattern: /\bfs\.exists\s*\(/,
      name: "fs.exists()",
      replacement: "fs.existsSync() or fs.access()",
    },
    {
      pattern: /\burl\.parse\s*\([^,)]+\)(?!\s*,)/,
      name: "url.parse() without 2nd arg",
      replacement: "new URL()",
    },
    {
      pattern: /\bnew\s+Buffer\s*\(/,
      name: "new Buffer()",
      replacement: "Buffer.from() or Buffer.alloc()",
    },
    {
      pattern: /\brequire\s*\(\s*['"]sys['"]\s*\)/,
      name: "sys module import",
      replacement: "util module import",
    },
    {
      pattern: /\bfs\.existsSync\s*\([^)]*\)\s*&&\s*fs\./,
      name: "existsSync race condition",
      replacement: "try/catch with fs operation",
    },
    { pattern: /\bpath\.existsSync\b/, name: "path.existsSync()", replacement: "fs.existsSync()" },
    { pattern: /\butil\.pump\b/, name: "util.pump()", replacement: "stream.pipeline()" },
    {
      pattern: /\bdomain\.create\b/,
      name: "domain.create()",
      replacement: "async/await with try/catch",
    },
  ];

  let totalScripts = scriptFiles.length;
  let cleanScripts = 0;

  for (const sf of scriptFiles) {
    let hasDeprecated = false;

    for (const api of deprecatedApis) {
      if (api.pattern.test(sf.content)) {
        hasDeprecated = true;
        findings.push({
          id: "SIA-120",
          category: "nodejs_api_compatibility",
          domain: DOMAIN,
          severity: "warning",
          message: `Deprecated API ${api.name} in ${sf.name}`,
          details: `${sf.filePath}: Use ${api.replacement} instead`,
          impactScore: 45,
          frequency: 1,
          blastRadius: 2,
          patchType: "fix_deprecated_api",
          patchTarget: sf.filePath,
          patchContent: `Replace ${api.name} with ${api.replacement}`,
          patchImpact: "Removes deprecated API usage for future Node.js compatibility",
        });
      }
    }

    if (!hasDeprecated) cleanScripts++;
  }

  const cleanPct = totalScripts > 0 ? Math.round((cleanScripts / totalScripts) * 100) : 100;

  const bm = BENCHMARKS.nodejs_api_compatibility;
  const result = scoreMetric(cleanPct, bm.clean_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_scripts: totalScripts,
        clean_scripts: cleanScripts,
        clean_pct: cleanPct,
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

  // Category 1: CJS/ESM Consistency
  const cat1 = checkCjsEsmConsistency(scriptFiles);
  findings.push(...cat1.findings);
  scores.cjs_esm_consistency = cat1.score;

  // Category 2: Shebang & Entry Point
  const cat2 = checkShebangEntryPoint(rootDir, scriptFiles);
  findings.push(...cat2.findings);
  scores.shebang_entry_point = cat2.score;

  // Category 3: Node.js API Compatibility
  const cat3 = checkNodejsApiCompatibility(scriptFiles);
  findings.push(...cat3.findings);
  scores.nodejs_api_compatibility = cat3.score;

  return { domain: DOMAIN, findings, scores };
}

module.exports = { run, DOMAIN };
