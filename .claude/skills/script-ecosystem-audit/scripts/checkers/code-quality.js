/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

/**
 * D4 Checker: Code Quality
 *
 * Categories:
 *   12. documentation_headers  (SIA-400..409)
 *   13. consistent_patterns    (SIA-410..419)
 *   14. dead_code              (SIA-420..429)
 *   15. complexity             (SIA-430..439)
 */

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[code-quality] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "code_quality";
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
          if (!content) continue;
          const relPath = path.relative(baseDir, full).replace(/\\/g, "/");
          const dirRel = path.relative(baseDir, dir).replace(/\\/g, "/") || ".";
          results.push({ name: entry, filePath: full, content, relPath, dir: dirRel });
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
// CATEGORY 12: Documentation Headers
// ============================================================================

function checkDocumentationHeaders(scriptFiles) {
  const findings = [];

  let totalScripts = 0;
  let documentedScripts = 0;

  // A documentation header is a JSDoc or block comment near the top of the file
  // (within the first 15 lines, after any shebang/eslint-disable/use strict)
  const docPatterns = [
    /\/\*\*[\s\S]*?\*\//, // JSDoc block /** ... */
    /\/\*[\s\S]*?\*\//, // Block comment /* ... */
    /^\/\/\s+\w+.*\n\/\/\s+\w+/m, // Multiple consecutive line comments
  ];

  let docHeaderFindingCount = 0;
  for (const sf of scriptFiles) {
    // Skip test files
    if (sf.relPath.includes("__tests__") || sf.name.endsWith(".test.js")) continue;

    totalScripts++;

    // Get the first 20 lines (skipping shebang, eslint-disable, "use strict")
    const lines = sf.content.split("\n");
    let headerEnd = Math.min(20, lines.length);
    const headerContent = lines.slice(0, headerEnd).join("\n");

    let hasDoc = false;
    for (const pattern of docPatterns) {
      if (pattern.test(headerContent)) {
        // Verify it's a meaningful comment (at least 10 chars of actual content)
        const match = headerContent.match(pattern);
        if (match && match[0].replace(/[/*\s]/g, "").length >= 10) {
          hasDoc = true;
          break;
        }
      }
    }

    if (hasDoc) {
      documentedScripts++;
    } else {
      findings.push({
        id: `SIA-400-${++docHeaderFindingCount}`,
        category: "documentation_headers",
        domain: DOMAIN,
        severity: "info",
        message: `Missing documentation header in ${sf.name}`,
        details: `scripts/${sf.relPath} lacks a JSDoc or block comment describing its purpose`,
        impactScore: 20,
        frequency: 1,
        blastRadius: 1,
        patchType: "add_documentation",
        patchTarget: sf.filePath,
        patchContent: `Add JSDoc header: /** Purpose, usage, dependencies */`,
        patchImpact: "Improves script discoverability and maintainability",
      });
    }
  }

  const documentedPct =
    totalScripts > 0 ? Math.round((documentedScripts / totalScripts) * 100) : 100;

  const bm = BENCHMARKS.documentation_headers;
  const result = scoreMetric(documentedPct, bm.documented_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_scripts: totalScripts,
        documented_scripts: documentedScripts,
        documented_pct: documentedPct,
      },
    },
  };
}

// ============================================================================
// CATEGORY 13: Consistent Patterns
// ============================================================================

function checkConsistentPatterns(scriptFiles) {
  const findings = [];

  // Group files by directory
  const dirMap = new Map();
  for (const sf of scriptFiles) {
    if (sf.relPath.includes("__tests__") || sf.name.endsWith(".test.js")) continue;
    if (!dirMap.has(sf.dir)) dirMap.set(sf.dir, []);
    dirMap.get(sf.dir).push(sf);
  }

  let totalDirs = 0;
  let consistentDirs = 0;

  for (const [dir, files] of dirMap) {
    if (files.length < 2) {
      totalDirs++;
      consistentDirs++;
      continue;
    }

    totalDirs++;

    // Check consistency signals
    let hasUseStrict = 0;
    let hasModuleExports = 0;
    let hasErrorHandling = 0;

    for (const sf of files) {
      if (/["']use strict["']/.test(sf.content)) hasUseStrict++;
      if (/\bmodule\.exports\b/.test(sf.content)) hasModuleExports++;
      if (/\btry\s*\{/.test(sf.content)) hasErrorHandling++;
    }

    const total = files.length;
    // total is always >= 2 (single-file dirs are skipped above), but guard for safety
    const strictRatio = total > 0 ? hasUseStrict / total : 0;
    const exportsRatio = total > 0 ? hasModuleExports / total : 0;
    const errorRatio = total > 0 ? hasErrorHandling / total : 0;

    // A directory is consistent if patterns are either all-present or all-absent
    // (ratio is > 0.8 or < 0.2 for each pattern)
    let inconsistencies = 0;
    if (strictRatio > 0.2 && strictRatio < 0.8) inconsistencies++;
    if (exportsRatio > 0.2 && exportsRatio < 0.8) inconsistencies++;
    if (errorRatio > 0.2 && errorRatio < 0.8) inconsistencies++;

    if (inconsistencies === 0) {
      consistentDirs++;
    } else {
      findings.push({
        id: "SIA-410",
        category: "consistent_patterns",
        domain: DOMAIN,
        severity: "info",
        message: `Inconsistent patterns in directory: ${dir}`,
        details: `scripts/${dir}/ has ${inconsistencies} inconsistent pattern(s): ${[
          strictRatio > 0.2 && strictRatio < 0.8 && `"use strict" (${hasUseStrict}/${total})`,
          exportsRatio > 0.2 &&
            exportsRatio < 0.8 &&
            `module.exports (${hasModuleExports}/${total})`,
          errorRatio > 0.2 && errorRatio < 0.8 && `try/catch (${hasErrorHandling}/${total})`,
        ]
          .filter(Boolean)
          .join(", ")}`,
        impactScore: 25,
        frequency: 1,
        blastRadius: 1,
      });
    }
  }

  const consistencyPct = totalDirs > 0 ? Math.round((consistentDirs / totalDirs) * 100) : 100;

  const bm = BENCHMARKS.consistent_patterns;
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
// CATEGORY 14: Dead Code
// ============================================================================

function checkDeadCode(scriptFiles) {
  const findings = [];

  // Find all module.exports
  const exportedFunctions = new Map(); // funcName -> { file, relPath }
  const moduleExportsPattern = /module\.exports\s*=\s*\{([^}]+)\}/g;
  const namedExportPattern = /exports\.(\w+)\s*=/g;

  for (const sf of scriptFiles) {
    if (sf.relPath.includes("__tests__") || sf.name.endsWith(".test.js")) continue;

    // Extract from module.exports = { ... }
    for (const match of sf.content.matchAll(moduleExportsPattern)) {
      const names = match[1]
        .split(",")
        .map((n) => n.trim().split(/\s*:/)[0].trim())
        .filter(Boolean);
      for (const name of names) {
        if (name && /^\w+$/.test(name)) {
          exportedFunctions.set(`${sf.relPath}:${name}`, {
            file: sf.name,
            relPath: sf.relPath,
            name,
          });
        }
      }
    }

    // Extract from exports.foo = ...
    for (const match of sf.content.matchAll(namedExportPattern)) {
      const name = match[1];
      exportedFunctions.set(`${sf.relPath}:${name}`, { file: sf.name, relPath: sf.relPath, name });
    }
  }

  // Check if each export is used somewhere else
  let totalExports = exportedFunctions.size;
  let usedExports = 0;

  for (const [key, exp] of exportedFunctions) {
    const escaped = exp.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const usagePattern = new RegExp(`\\b${escaped}\\b`);
    let foundUsage = false;

    for (const sf of scriptFiles) {
      if (sf.relPath === exp.relPath) continue; // Don't count self-references
      if (usagePattern.test(sf.content)) {
        foundUsage = true;
        break;
      }
    }

    if (foundUsage) {
      usedExports++;
    } else {
      findings.push({
        id: "SIA-420",
        category: "dead_code",
        domain: DOMAIN,
        severity: "info",
        message: `Potentially unused export '${exp.name}' in ${exp.file}`,
        details: `scripts/${exp.relPath} exports '${exp.name}' but no other script imports it`,
        impactScore: 15,
        frequency: 1,
        blastRadius: 1,
      });
    }
  }

  const usedPct = totalExports > 0 ? Math.round((usedExports / totalExports) * 100) : 100;

  const bm = BENCHMARKS.dead_code;
  const result = scoreMetric(usedPct, bm.used_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_exports: totalExports,
        used_exports: usedExports,
        used_pct: usedPct,
      },
    },
  };
}

// ============================================================================
// CATEGORY 15: Complexity
// ============================================================================

function checkComplexity(scriptFiles) {
  const findings = [];

  let totalScripts = 0;
  let acceptableScripts = 0;

  const functionDefPattern =
    /\bfunction\s+\w+\s*\(|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?function|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;

  for (const sf of scriptFiles) {
    if (sf.relPath.includes("__tests__") || sf.name.endsWith(".test.js")) continue;

    totalScripts++;

    const lineCount = sf.content.split("\n").length;

    if (lineCount <= 300) {
      acceptableScripts++;
      continue;
    }

    // For long files, check if they have adequate function decomposition
    const funcMatches = sf.content.match(functionDefPattern);
    const funcCount = funcMatches ? funcMatches.length : 0;

    if (funcCount >= 3) {
      acceptableScripts++;
    } else {
      findings.push({
        id: "SIA-430",
        category: "complexity",
        domain: DOMAIN,
        severity: "warning",
        message: `High complexity in ${sf.name}: ${lineCount} lines with ${funcCount} function(s)`,
        details: `scripts/${sf.relPath} is ${lineCount} lines but only has ${funcCount} function definition(s) — consider decomposing`,
        impactScore: 40,
        frequency: 1,
        blastRadius: 2,
      });
    }
  }

  const acceptablePct =
    totalScripts > 0 ? Math.round((acceptableScripts / totalScripts) * 100) : 100;

  const bm = BENCHMARKS.complexity;
  const result = scoreMetric(acceptablePct, bm.acceptable_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_scripts: totalScripts,
        acceptable_scripts: acceptableScripts,
        acceptable_pct: acceptablePct,
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

  // Category 12: Documentation Headers
  const cat12 = checkDocumentationHeaders(scriptFiles);
  findings.push(...cat12.findings);
  scores.documentation_headers = cat12.score;

  // Category 13: Consistent Patterns
  const cat13 = checkConsistentPatterns(scriptFiles);
  findings.push(...cat13.findings);
  scores.consistent_patterns = cat13.score;

  // Category 14: Dead Code
  const cat14 = checkDeadCode(scriptFiles);
  findings.push(...cat14.findings);
  scores.dead_code = cat14.score;

  // Category 15: Complexity
  const cat15 = checkComplexity(scriptFiles);
  findings.push(...cat15.findings);
  scores.complexity = cat15.score;

  return { domain: DOMAIN, findings, scores };
}

module.exports = { run, DOMAIN };
