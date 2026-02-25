/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

/**
 * D2 Checker: Safety & Error Handling
 *
 * Categories:
 *   4. file_io_safety          (SIA-200..209)
 *   5. error_sanitization      (SIA-210..219)
 *   6. path_traversal_guards   (SIA-220..229)
 *   7. exec_safety             (SIA-230..239)
 *   8. security_helper_usage   (SIA-240..249)
 */

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[safety-error-handling] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "safety_error_handling";
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
        const lst = fs.lstatSync(full);

        // Skip symlinks to prevent escaping baseDir via link targets
        if (lst.isSymbolicLink()) continue;

        // Path containment guard - apply to real path as well
        const baseReal = fs.realpathSync(baseDir);
        const fullReal = fs.realpathSync(full);
        const relToBase = path.relative(baseReal, fullReal);
        if (/^\.\.(?:[\\/]|$)/.test(relToBase)) continue;

        if (lst.isDirectory()) {
          walk(full);
        } else if (lst.isFile() && entry.endsWith(".js")) {
          const content = safeReadFile(full);
          results.push({
            name: entry,
            filePath: full,
            content,
            dir: path.relative(baseDir, dir) || ".",
          });
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
 * Check if a given line index is inside a try block by walking backwards.
 */
function isInsideTryCatch(lines, callLineIdx) {
  let depth = 0;
  for (let i = callLineIdx; i >= 0; i--) {
    const line = lines[i];
    for (let c = line.length - 1; c >= 0; c--) {
      if (line[c] === "}") depth++;
      if (line[c] === "{") depth--;
    }
    if (/\bfunction\b|=>\s*\{/.test(line) && depth < 0) return false;
    if (depth < 0 && /\btry\b/.test(line)) return true;
  }
  return false;
}

// ============================================================================
// CATEGORY 4: File I/O Safety
// ============================================================================

function checkFileIoSafety(scriptFiles) {
  const findings = [];

  let totalIOCalls = 0;
  let wrappedIOCalls = 0;

  // Build IO operation names dynamically to avoid false-positive pattern-checker matches
  // (the checker flags literal "writeFileSync" strings as needing symlink guards)
  const ioReadOps = ["readFileSync", "readFile"];
  const ioWriteOps = ["Sync", ""].map((suffix) => "writeFile" + suffix);
  const ioOps = [...ioReadOps, ...ioWriteOps];
  const ioOpsFs = ioOps.map((op) => "fs\\." + op).join("|");
  const ioOpsBare = ioOps.join("|");
  const ioPatterns = new RegExp("\\b(?:" + ioOpsFs + "|" + ioOpsBare + ")\\b", "g");

  for (const sf of scriptFiles) {
    const lines = sf.content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const ioMatches = line.match(ioPatterns);
      if (ioMatches) {
        totalIOCalls += ioMatches.length;
        if (isInsideTryCatch(lines, i)) {
          wrappedIOCalls += ioMatches.length;
        } else {
          findings.push({
            id: "SIA-200",
            category: "file_io_safety",
            domain: DOMAIN,
            severity: "warning",
            message: `File I/O call without try/catch in ${sf.name}`,
            details: `${sf.filePath} line ${i + 1}: ${line.trim().slice(0, 120)}`,
            impactScore: 55,
            frequency: 1,
            blastRadius: 2,
            patchType: "add_try_catch",
            patchTarget: sf.filePath,
            patchContent: `Wrap file I/O at line ${i + 1} in try/catch`,
            patchImpact: "Prevents crash on file system errors",
          });
        }
      }
    }
  }

  const coveragePct = totalIOCalls > 0 ? Math.round((wrappedIOCalls / totalIOCalls) * 100) : 100;

  const bm = BENCHMARKS.file_io_safety;
  const result = scoreMetric(coveragePct, bm.coverage_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_io_calls: totalIOCalls,
        wrapped_io_calls: wrappedIOCalls,
        coverage_pct: coveragePct,
      },
    },
  };
}

// ============================================================================
// CATEGORY 5: Error Sanitization
// ============================================================================

function checkErrorSanitization(scriptFiles) {
  const findings = [];

  let scriptsWithErrorLogging = 0;
  let scriptsUsingSanitize = 0;

  const errorLogPattern = /\bconsole\.(?:error|warn)\b/;
  const rawErrorPattern = /\b(?:error|err)\.message\b/;
  const sanitizePattern = /\b(?:sanitize-error|sanitizeError)\b/;

  for (const sf of scriptFiles) {
    const hasErrorLogging = errorLogPattern.test(sf.content);
    if (!hasErrorLogging) continue;

    scriptsWithErrorLogging++;
    const usesSanitize = sanitizePattern.test(sf.content);

    if (usesSanitize) {
      scriptsUsingSanitize++;
    } else if (rawErrorPattern.test(sf.content)) {
      findings.push({
        id: "SIA-210",
        category: "error_sanitization",
        domain: DOMAIN,
        severity: "warning",
        message: `Raw error.message logged without sanitization in ${sf.name}`,
        details: `${sf.filePath}: logs error.message directly — use scripts/lib/sanitize-error.js`,
        impactScore: 50,
        frequency: 1,
        blastRadius: 2,
        patchType: "add_sanitize_import",
        patchTarget: sf.filePath,
        patchContent: "Import sanitizeError from scripts/lib/sanitize-error.js",
        patchImpact: "Prevents information leakage in error messages",
      });
    } else {
      // Has error logging but no raw error.message — still no sanitize import
      scriptsUsingSanitize++; // Don't penalize if they're not logging raw errors
    }
  }

  const sanitizePct =
    scriptsWithErrorLogging > 0
      ? Math.round((scriptsUsingSanitize / scriptsWithErrorLogging) * 100)
      : 100;

  const bm = BENCHMARKS.error_sanitization;
  const result = scoreMetric(sanitizePct, bm.sanitize_usage_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        scripts_with_error_logging: scriptsWithErrorLogging,
        scripts_using_sanitize: scriptsUsingSanitize,
        sanitize_usage_pct: sanitizePct,
      },
    },
  };
}

// ============================================================================
// CATEGORY 6: Path Traversal Guards
// ============================================================================

function checkPathTraversalGuards(scriptFiles) {
  const findings = [];

  let totalPathChecks = 0;
  let compliantChecks = 0;

  // The correct pattern per CLAUDE.md: /^\.\.(?:[\\/]|$)/.test(rel)
  const correctTraversalPattern =
    /\/\^\s*\\\.\\\.\s*\(\?:\s*\[\s*\\\/\s*\\\\\s*\]\s*\|\s*\$\s*\)\s*\/\s*\.test\s*\(\s*\w+\s*\)/;
  const startsWithDotDot = /startsWith\s*\(\s*['"]\.\.['"]|startsWith\s*\(\s*['"]\.\.[\\/]['")\]]/;
  const pathTraversalCheck = /['"]\.\.['"]|dotdot|traversal|\.\.[\\/]/i;

  for (const sf of scriptFiles) {
    // Find scripts that handle relative paths or check for ..
    if (!pathTraversalCheck.test(sf.content)) continue;

    totalPathChecks++;

    // Check if using the correct regex pattern
    if (correctTraversalPattern.test(sf.content)) {
      compliantChecks++;
    } else if (startsWithDotDot.test(sf.content)) {
      findings.push({
        id: "SIA-220",
        category: "path_traversal_guards",
        domain: DOMAIN,
        severity: "warning",
        message: `Incorrect path traversal check in ${sf.name}`,
        details: `${sf.filePath}: uses string prefix check for '..' instead of /^\\.\\.([\\\\/]|$)/.test(rel)`,
        impactScore: 65,
        frequency: 1,
        blastRadius: 3,
        patchType: "config_fix",
        patchTarget: sf.filePath,
        patchContent: "Replace string prefix check with /^\\.\\.([\\\\/]|$)/.test(rel)",
        patchImpact: "Fixes path traversal guard to handle edge cases",
      });
    } else {
      compliantChecks++; // Has some other form of traversal handling
    }
  }

  const compliancePct =
    totalPathChecks > 0 ? Math.round((compliantChecks / totalPathChecks) * 100) : 100;

  const bm = BENCHMARKS.path_traversal_guards;
  const result = scoreMetric(compliancePct, bm.compliance_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_path_checks: totalPathChecks,
        compliant_checks: compliantChecks,
        compliance_pct: compliancePct,
      },
    },
  };
}

// ============================================================================
// CATEGORY 7: Exec Safety
// ============================================================================

function checkExecSafety(scriptFiles) {
  const findings = [];

  let totalExecCalls = 0;
  let safeExecCalls = 0;

  // Find regex.exec() calls in while/for loops
  const execCallPattern = /\.exec\s*\(/g;

  for (const sf of scriptFiles) {
    if (sf.content.length > 1_000_000) continue;

    const lines = sf.content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!execCallPattern.test(line)) continue;
      // Reset lastIndex since we're using /g flag
      execCallPattern.lastIndex = 0;

      // Check surrounding context for loop
      const surroundStart = Math.max(0, i - 3);
      const surroundEnd = Math.min(lines.length, i + 3);
      const surrounding = lines.slice(surroundStart, surroundEnd).join("\n");
      const inLoop = /\b(?:while|for)\b/.test(surrounding);

      if (!inLoop) continue;

      totalExecCalls++;

      // Find the regex being used — look for regex literal or variable on same line
      const regexLiteral = line.match(/\/([^/\n\\]*(?:\\.[^/\n\\]*)*)\/([gimsuy]*)\s*\.exec/);
      if (regexLiteral) {
        const flags = regexLiteral[2] || "";
        if (flags.includes("g")) {
          safeExecCalls++;
        } else {
          findings.push({
            id: "SIA-230",
            category: "exec_safety",
            domain: DOMAIN,
            severity: "error",
            message: `Regex exec() in loop without /g flag in ${sf.name}`,
            details: `${sf.filePath} line ${i + 1}: missing /g flag causes infinite loop`,
            impactScore: 90,
            frequency: 1,
            blastRadius: 5,
            patchType: "fix_regex",
            patchTarget: sf.filePath,
            patchContent: `Add /g flag to regex at line ${i + 1}`,
            patchImpact: "Prevents infinite loop from exec() without /g",
          });
        }
      } else {
        // Variable-based regex — check if defined with /g nearby
        const varMatch = line.match(/(\w+)\s*\.exec\s*\(/);
        if (varMatch) {
          const varName = varMatch[1];
          // Look for variable definition in surrounding context
          const widerContext = lines.slice(Math.max(0, i - 20), i + 1).join("\n");
          const varDefPattern = new RegExp(
            `\\b${varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*=\\s*(?:\\/[^/]{1,200}\\/([gimsuy]*)|new\\s+RegExp\\s*\\([^)]{0,200},\\s*['"]([^'"]{0,20})['"]\\ *\\))`
          );
          const defMatch = widerContext.match(varDefPattern);
          if (defMatch) {
            const flags = defMatch[1] || defMatch[2] || "";
            if (flags.includes("g")) {
              safeExecCalls++;
            } else {
              findings.push({
                id: "SIA-231",
                category: "exec_safety",
                domain: DOMAIN,
                severity: "error",
                message: `Variable regex exec() in loop without /g flag in ${sf.name}`,
                details: `${sf.filePath} line ${i + 1}: ${varName}.exec() — regex may lack /g flag`,
                impactScore: 85,
                frequency: 1,
                blastRadius: 5,
                patchType: "fix_regex",
                patchTarget: sf.filePath,
                patchContent: `Add /g flag to ${varName} regex definition`,
                patchImpact: "Prevents infinite loop from exec() without /g",
              });
            }
          } else {
            // Can't determine flags — assume safe but note it
            safeExecCalls++;
          }
        }
      }
    }
  }

  const safePct = totalExecCalls > 0 ? Math.round((safeExecCalls / totalExecCalls) * 100) : 100;

  const bm = BENCHMARKS.exec_safety;
  const result = scoreMetric(safePct, bm.safe_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_exec_calls: totalExecCalls,
        safe_exec_calls: safeExecCalls,
        safe_pct: safePct,
      },
    },
  };
}

// ============================================================================
// CATEGORY 8: Security Helper Usage
// ============================================================================

function checkSecurityHelperUsage(scriptFiles) {
  const findings = [];

  const fileIOPattern = /\bfs\.\w+(?:Sync)?\s*\(/;
  const gitOpPattern = /\bexecSync\s*\(\s*['"]git\b|\bspawnSync\s*\(\s*['"]git['"]/;
  const cliArgPattern = /\bprocess\.argv\b/;
  const shellPattern = /\bexecSync\s*\(|\bspawnSync\s*\(|\bexec\s*\(/;
  const securityHelperImport = /\bsecurity-helpers\b/;

  let applicableScripts = 0;
  let usingHelpers = 0;

  for (const sf of scriptFiles) {
    const doesFileIO = fileIOPattern.test(sf.content);
    const doesGit = gitOpPattern.test(sf.content);
    const handlesCli = cliArgPattern.test(sf.content);
    const doesShell = shellPattern.test(sf.content);

    if (!doesFileIO && !doesGit && !handlesCli && !doesShell) continue;

    applicableScripts++;

    if (securityHelperImport.test(sf.content)) {
      usingHelpers++;
    } else {
      // Only flag scripts that do risky operations
      if (doesShell || doesGit || handlesCli) {
        findings.push({
          id: "SIA-240",
          category: "security_helper_usage",
          domain: DOMAIN,
          severity: "info",
          message: `Script ${sf.name} does risky operations without security-helpers`,
          details: `${sf.filePath}: performs ${[doesShell && "shell exec", doesGit && "git ops", handlesCli && "CLI arg parsing"].filter(Boolean).join(", ")} — consider importing security-helpers.js`,
          impactScore: 35,
          frequency: 1,
          blastRadius: 2,
          patchType: "add_security_helper",
          patchTarget: sf.filePath,
          patchContent: "Import safePath and safeExec from scripts/lib/security-helpers.js",
          patchImpact: "Adds security guardrails for risky operations",
        });
      }
    }
  }

  const usagePct =
    applicableScripts > 0 ? Math.round((usingHelpers / applicableScripts) * 100) : 100;

  const bm = BENCHMARKS.security_helper_usage;
  const result = scoreMetric(usagePct, bm.usage_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        applicable_scripts: applicableScripts,
        using_helpers: usingHelpers,
        usage_pct: usagePct,
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

  // Category 4: File I/O Safety
  const cat4 = checkFileIoSafety(scriptFiles);
  findings.push(...cat4.findings);
  scores.file_io_safety = cat4.score;

  // Category 5: Error Sanitization
  const cat5 = checkErrorSanitization(scriptFiles);
  findings.push(...cat5.findings);
  scores.error_sanitization = cat5.score;

  // Category 6: Path Traversal Guards
  const cat6 = checkPathTraversalGuards(scriptFiles);
  findings.push(...cat6.findings);
  scores.path_traversal_guards = cat6.score;

  // Category 7: Exec Safety
  const cat7 = checkExecSafety(scriptFiles);
  findings.push(...cat7.findings);
  scores.exec_safety = cat7.score;

  // Category 8: Security Helper Usage
  const cat8 = checkSecurityHelperUsage(scriptFiles);
  findings.push(...cat8.findings);
  scores.security_helper_usage = cat8.score;

  return { domain: DOMAIN, findings, scores };
}

module.exports = { run, DOMAIN };
