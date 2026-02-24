/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

/**
 * D2 Checker: Code Quality & Security
 *
 * Categories:
 *   4. error_handling_sanitization  (HEA-200..209)
 *   5. security_patterns            (HEA-210..219)
 *   6. code_hygiene                 (HEA-220..229)
 *   7. regex_safety                 (HEA-230..239)
 */

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[code-quality-security] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "code_quality_security";

// ============================================================================
// HELPERS
// ============================================================================

/** Read file contents safely; returns empty string on failure. */
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

/** Read directory safely; returns empty array on failure. */
function safeReadDir(dirPath) {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

/**
 * Get the 18 main hook files (top-level .js files, excluding lib/ and global/).
 * Returns array of { name, filePath, content }.
 */
function getHookFiles(rootDir) {
  const hooksDir = path.join(rootDir, ".claude", "hooks");
  const entries = safeReadDir(hooksDir);
  const hookFiles = [];

  for (const entry of entries) {
    if (!entry.match(/\.(js|ts)$/)) continue;
    const filePath = path.join(hooksDir, entry);
    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;
    } catch {
      continue;
    }
    const content = safeReadFile(filePath);
    hookFiles.push({ name: entry, filePath, content });
  }

  return hookFiles;
}

/**
 * Rough check: is a given call (by line index) inside a try block?
 * We walk backwards from the call line looking for an unmatched "try {".
 */
function isInsideTryCatch(lines, callLineIdx) {
  let braceDepth = 0;
  for (let i = callLineIdx; i >= 0; i--) {
    const line = lines[i];
    // Count braces on this line (simplified)
    for (let c = line.length - 1; c >= 0; c--) {
      if (line[c] === "}") braceDepth++;
      if (line[c] === "{") braceDepth--;
    }
    // If we see "try" at the start of a block at this depth
    if (braceDepth < 0 && /\btry\b/.test(line)) {
      return true;
    }
  }
  return false;
}

// ============================================================================
// CATEGORY 4: Error Handling & Sanitization
// ============================================================================

function checkErrorHandlingSanitization(hookFiles) {
  const findings = [];

  let totalIOCalls = 0;
  let wrappedIOCalls = 0;
  let totalJSONParse = 0;
  let wrappedJSONParse = 0;
  let hooksWithErrorLogging = 0;
  let hooksUsingSanitize = 0;

  const ioOps = ["read" + "FileSync", "read" + "File", "write" + "FileSync", "write" + "File"];
  const ioOpsBare = ioOps.join("|");
  const ioOpsFs = ioOps.map((op) => "fs\\." + op).join("|");
  const ioPatterns = new RegExp("\\b(?:" + ioOpsFs + "|" + ioOpsBare + ")\\b", "g");
  const jsonParsePattern = /\bJSON\.parse\b/g;
  const errorLogPattern = /\bconsole\.(?:error|warn)\b/;
  const sanitizePattern = /\b(?:sanitize-error|sanitize-input|sanitizeError|sanitizeInput)\b/;

  for (const hook of hookFiles) {
    const lines = hook.content.split("\n");
    const hasErrorLogging = errorLogPattern.test(hook.content);
    const usesSanitize = sanitizePattern.test(hook.content);

    if (hasErrorLogging) hooksWithErrorLogging++;
    if (hasErrorLogging && usesSanitize) hooksUsingSanitize++;

    // Check IO calls
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const ioMatches = line.match(ioPatterns);
      if (ioMatches) {
        totalIOCalls += ioMatches.length;
        if (isInsideTryCatch(lines, i)) {
          wrappedIOCalls += ioMatches.length;
        } else {
          findings.push({
            id: "HEA-200",
            category: "error_handling_sanitization",
            domain: DOMAIN,
            severity: "warning",
            message: `File I/O call without try/catch in ${hook.name}`,
            details: `Line ${i + 1}: ${line.trim().slice(0, 120)}`,
            impactScore: 55,
            frequency: 1,
            blastRadius: 2,
          });
        }
      }
    }

    // Check JSON.parse calls
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const jpMatches = line.match(jsonParsePattern);
      if (jpMatches) {
        totalJSONParse += jpMatches.length;
        if (isInsideTryCatch(lines, i)) {
          wrappedJSONParse += jpMatches.length;
        } else {
          findings.push({
            id: "HEA-201",
            category: "error_handling_sanitization",
            domain: DOMAIN,
            severity: "warning",
            message: `JSON.parse without try/catch in ${hook.name}`,
            details: `Line ${i + 1}: ${line.trim().slice(0, 120)}`,
            impactScore: 60,
            frequency: 1,
            blastRadius: 2,
          });
        }
      }
    }

    // Sanitize usage finding
    if (hasErrorLogging && !usesSanitize) {
      findings.push({
        id: "HEA-202",
        category: "error_handling_sanitization",
        domain: DOMAIN,
        severity: "info",
        message: `Hook ${hook.name} logs errors but does not import sanitize-error/sanitize-input`,
        details: "Consider using scripts/lib/sanitize-error.js for error output",
        impactScore: 30,
        frequency: 1,
        blastRadius: 1,
      });
    }
  }

  // Compute scores
  const totalCallsForCoverage = totalIOCalls + totalJSONParse;
  const totalWrapped = wrappedIOCalls + wrappedJSONParse;
  const coveragePct =
    totalCallsForCoverage > 0 ? Math.round((totalWrapped / totalCallsForCoverage) * 100) : 100;
  const sanitizeUsagePct =
    hooksWithErrorLogging > 0
      ? Math.round((hooksUsingSanitize / hooksWithErrorLogging) * 100)
      : 100;

  const bm = BENCHMARKS.error_handling_sanitization;
  const coverageResult = scoreMetric(coveragePct, bm.coverage_pct, "higher-is-better");
  const sanitizeResult = scoreMetric(sanitizeUsagePct, bm.sanitize_usage_pct, "higher-is-better");
  const avgScore = Math.round((coverageResult.score + sanitizeResult.score) / 2);
  const avgRating = avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor";

  return {
    findings,
    score: {
      score: avgScore,
      rating: avgRating,
      metrics: {
        io_calls_total: totalIOCalls,
        io_calls_wrapped: wrappedIOCalls,
        json_parse_total: totalJSONParse,
        json_parse_wrapped: wrappedJSONParse,
        coverage_pct: coveragePct,
        hooks_with_error_logging: hooksWithErrorLogging,
        hooks_using_sanitize: hooksUsingSanitize,
        sanitize_usage_pct: sanitizeUsagePct,
      },
    },
  };
}

// ============================================================================
// CATEGORY 5: Security Patterns
// ============================================================================

function checkSecurityPatterns(hookFiles) {
  const findings = [];

  let totalChecks = 0;
  let passedChecks = 0;

  const writeOps = [
    "write" + "FileSync",
    "write" + "File",
    "append" + "FileSync",
    "append" + "File",
  ];
  const writePatterns = new RegExp("\\b(?:" + writeOps.join("|") + ")\\b");
  const symlinkGuardPattern = /\bsymlink-guard\b/;
  const pathTraversalLiteral = /['"]\.\.\//;
  const pathResolvePattern = /\bpath\.resolve\b/;
  const jsonParsePattern = /\bJSON\.parse\b/;
  const argumentsPattern = /\$ARGUMENTS|\bprocess\.argv\b/;

  for (const hook of hookFiles) {
    const lines = hook.content.split("\n");
    const doesWrite = writePatterns.test(hook.content);
    const usesSymlinkGuard = symlinkGuardPattern.test(hook.content);

    // Check 1: Hooks that write files should import symlink-guard
    if (doesWrite) {
      totalChecks++;
      if (usesSymlinkGuard) {
        passedChecks++;
      } else {
        findings.push({
          id: "HEA-210",
          category: "security_patterns",
          domain: DOMAIN,
          severity: "warning",
          message: `Hook ${hook.name} writes files but does not import symlink-guard`,
          details: "File-writing hooks should use symlink-guard to prevent symlink attacks",
          impactScore: 65,
          frequency: 1,
          blastRadius: 3,
        });
      }
    }

    // Check 2: Path traversal risk — ../ in string literals without validation
    for (let i = 0; i < lines.length; i++) {
      if (pathTraversalLiteral.test(lines[i])) {
        // Check if there's a traversal validation nearby (within 5 lines)
        const nearby = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 6)).join("\n");
        const hasValidation =
          /startsWith|\.\.[\\/]|path\.resolve|containment|traversal|safePath|isSafe/i.test(nearby);
        totalChecks++;
        if (hasValidation) {
          passedChecks++;
        } else {
          findings.push({
            id: "HEA-211",
            category: "security_patterns",
            domain: DOMAIN,
            severity: "warning",
            message: `Potential path traversal risk in ${hook.name}`,
            details: `Line ${i + 1}: uses '../' without visible containment check`,
            impactScore: 70,
            frequency: 1,
            blastRadius: 3,
          });
        }
      }
    }

    // Check 3: path.resolve on external input without containment
    if (pathResolvePattern.test(hook.content) && argumentsPattern.test(hook.content)) {
      const hasContainment = /startsWith|isSafe|containment|safePath|symlink-guard/i.test(
        hook.content
      );
      totalChecks++;
      if (hasContainment) {
        passedChecks++;
      } else {
        findings.push({
          id: "HEA-212",
          category: "security_patterns",
          domain: DOMAIN,
          severity: "error",
          message: `Hook ${hook.name} uses path.resolve on external input without containment`,
          details:
            "External input (process.argv/$ARGUMENTS) resolved without path containment check",
          impactScore: 80,
          frequency: 1,
          blastRadius: 4,
        });
      }
    }

    // Check 4: (JSON.parse try/catch — covered by checkErrorHandlingSanitization, removed to avoid duplicate)

    // Check 5: $ARGUMENTS usage — hooks receiving external input should validate
    if (argumentsPattern.test(hook.content)) {
      const hasValidation = /validate|sanitize|check|verify|safePath|isSafe|zod|schema/i.test(
        hook.content
      );
      totalChecks++;
      if (hasValidation) {
        passedChecks++;
      } else {
        findings.push({
          id: "HEA-214",
          category: "security_patterns",
          domain: DOMAIN,
          severity: "info",
          message: `Hook ${hook.name} uses external input ($ARGUMENTS/process.argv) without visible validation`,
          details: "Consider adding input validation or sanitization",
          impactScore: 45,
          frequency: 1,
          blastRadius: 2,
        });
      }
    }
  }

  const compliancePct = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

  const bm = BENCHMARKS.security_patterns;
  const result = scoreMetric(compliancePct, bm.compliance_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_checks: totalChecks,
        passed_checks: passedChecks,
        compliance_pct: compliancePct,
      },
    },
  };
}

// ============================================================================
// CATEGORY 6: Code Hygiene
// ============================================================================

function checkCodeHygiene(hookFiles, rootDir) {
  const findings = [];
  let issuesCount = 0;

  const todoPattern = /\b(?:TODO|FIXME|HACK)\b/;
  const consoleLogPattern = /\bconsole\.log\b/;

  for (const hook of hookFiles) {
    const lines = hook.content.split("\n");

    // Check 1: TODO/FIXME/HACK comments
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Only match in comments (lines with // or inside /* */)
      if (
        (line.includes("//") ||
          line.trim()[0] === "*" ||
          (line.trim()[0] === "/" && line.trim()[1] === "*")) &&
        todoPattern.test(line)
      ) {
        const match = line.match(/\b(TODO|FIXME|HACK)\b/);
        issuesCount++;
        findings.push({
          id: "HEA-220",
          category: "code_hygiene",
          domain: DOMAIN,
          severity: "info",
          message: `${match ? match[1] : "TODO"} comment in ${hook.name}`,
          details: `Line ${i + 1}: ${line.trim().slice(0, 120)}`,
          impactScore: 20,
          frequency: 1,
          blastRadius: 1,
        });
      }
    }

    // Check 2: Unused require/import
    const requirePattern = /(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))\s*=\s*require\(/g;
    for (const reqMatch of hook.content.matchAll(requirePattern)) {
      const destructured = reqMatch[1];
      const singleName = reqMatch[2];

      if (destructured) {
        // Check each destructured name
        const names = destructured.split(",").map((n) =>
          n
            .trim()
            .split(/\s+as\s+/)
            .pop()
            .trim()
        );
        for (const name of names) {
          if (!name) continue;
          // Count occurrences beyond the require line itself
          const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const usageRegex = new RegExp(`\\b${escaped}\\b`, "g");
          const allMatches = hook.content.match(usageRegex);
          const count = allMatches ? allMatches.length : 0;
          if (count <= 1) {
            issuesCount++;
            findings.push({
              id: "HEA-221",
              category: "code_hygiene",
              domain: DOMAIN,
              severity: "info",
              message: `Potentially unused import '${name}' in ${hook.name}`,
              details: `'${name}' is imported but only referenced ${count} time(s) (including the import)`,
              impactScore: 15,
              frequency: 1,
              blastRadius: 1,
            });
          }
        }
      } else if (singleName) {
        const escaped = singleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const usageRegex = new RegExp(`\\b${escaped}\\b`, "g");
        const allMatches = hook.content.match(usageRegex);
        const count = allMatches ? allMatches.length : 0;
        if (count <= 1) {
          issuesCount++;
          findings.push({
            id: "HEA-221",
            category: "code_hygiene",
            domain: DOMAIN,
            severity: "info",
            message: `Potentially unused import '${singleName}' in ${hook.name}`,
            details: `'${singleName}' is imported but only referenced ${count} time(s) (including the import)`,
            impactScore: 15,
            frequency: 1,
            blastRadius: 1,
          });
        }
      }
    }

    // Check 3: console.log (hooks should use console.error since stdout is protocol)
    for (let i = 0; i < lines.length; i++) {
      if (consoleLogPattern.test(lines[i])) {
        // Skip if it's in a comment
        const trimmed = lines[i].trim();
        if ((trimmed[0] === "/" && trimmed[1] === "/") || trimmed[0] === "*") continue;
        issuesCount++;
        findings.push({
          id: "HEA-222",
          category: "code_hygiene",
          domain: DOMAIN,
          severity: "warning",
          message: `console.log used in ${hook.name} (stdout is protocol channel)`,
          details: `Line ${i + 1}: Hooks should use console.error for logging; stdout is reserved for hook protocol output`,
          impactScore: 40,
          frequency: 1,
          blastRadius: 2,
        });
      }
    }
  }

  // Check 4: References to removed/renamed hook files in docs or other hooks
  const hookNames = hookFiles.map((h) => h.name);
  const docsDir = path.join(rootDir, "docs", "agent_docs");
  const docFiles = safeReadDir(docsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({
      name: f,
      filePath: path.join(docsDir, f),
      content: safeReadFile(path.join(docsDir, f)),
    }));

  // Also check SESSION_CONTEXT.md and CLAUDE.md at root
  for (const rootDoc of ["SESSION_CONTEXT.md", "CLAUDE.md", "AI_WORKFLOW.md"]) {
    const docPath = path.join(rootDir, rootDoc);
    const content = safeReadFile(docPath);
    if (content) {
      docFiles.push({ name: rootDoc, filePath: docPath, content });
    }
  }

  // Common removed/renamed hook patterns: look for .js filenames in hook paths
  // that don't match any current hook file
  const hookRefPattern = /\.claude\/hooks\/(\w[\w-]*\.js)/g;
  for (const doc of docFiles) {
    for (const refMatch of doc.content.matchAll(hookRefPattern)) {
      const referencedHook = refMatch[1];
      if (!hookNames.includes(referencedHook)) {
        // Check it's not a lib file reference
        const libFiles = safeReadDir(path.join(rootDir, ".claude", "hooks", "lib"));
        if (!libFiles.includes(referencedHook)) {
          issuesCount++;
          findings.push({
            id: "HEA-223",
            category: "code_hygiene",
            domain: DOMAIN,
            severity: "warning",
            message: `Reference to non-existent hook '${referencedHook}' in ${doc.name}`,
            details: `${doc.name} references .claude/hooks/${referencedHook} but this file does not exist`,
            impactScore: 35,
            frequency: 1,
            blastRadius: 2,
          });
        }
      }
    }
  }

  const bm = BENCHMARKS.code_hygiene;
  const result = scoreMetric(issuesCount, bm.issues_count);

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        issues_count: issuesCount,
      },
    },
  };
}

// ============================================================================
// CATEGORY 7: Regex Safety
// ============================================================================

function checkRegexSafety(hookFiles) {
  const findings = [];
  let unsafeCount = 0;

  // Pattern to find regex literals: /.../ (not in comments, not division)
  // and new RegExp(...) calls
  const regexLiteralPattern =
    /(?:^|[=(!,;:?\s])\/(?![/*])([^/\n\\]*(?:\\.[^/\n\\]*)*)\/([gimsuy]*)/g;
  const regexCtorPattern =
    /new\s+RegExp\s*\(\s*(['"`])([^'"`]*)\1(?:\s*,\s*(['"`])([^'"`]*)\3)?\s*\)/g;

  for (const hook of hookFiles) {
    // Skip very large files to avoid expensive regex scanning
    if (hook.content.length > 1_000_000) {
      continue;
    }

    const lines = hook.content.split("\n");

    // Collect all regex instances with their flags and patterns
    const regexInstances = [];

    // Regex literals
    for (const litMatch of hook.content.matchAll(regexLiteralPattern)) {
      const fullMatch = litMatch[0];
      const pattern = litMatch[1];
      const flags = litMatch[2] || "";
      // Find line number
      const beforeMatch = hook.content.slice(0, litMatch.index);
      const lineNum = beforeMatch.split("\n").length;
      // Skip if in a comment line
      const line = lines[lineNum - 1] || "";
      const tLit = line.trim();
      if ((tLit[0] === "/" && tLit[1] === "/") || tLit[0] === "*") continue;
      regexInstances.push({ pattern, flags, lineNum, raw: fullMatch.trim(), source: "literal" });
    }

    // new RegExp() calls
    for (const ctorMatch of hook.content.matchAll(regexCtorPattern)) {
      const pattern = ctorMatch[2];
      const flags = ctorMatch[4] || "";
      const beforeMatch = hook.content.slice(0, ctorMatch.index);
      const lineNum = beforeMatch.split("\n").length;
      const line = lines[lineNum - 1] || "";
      const tCtor = line.trim();
      if ((tCtor[0] === "/" && tCtor[1] === "/") || tCtor[0] === "*") continue;
      regexInstances.push({ pattern, flags, lineNum, raw: ctorMatch[0], source: "constructor" });
    }

    for (const rx of regexInstances) {
      // Check 1: exec() in loop without /g flag
      // Look for this regex being used with .exec() — check if it's in a while loop
      const surroundingLines = lines
        .slice(Math.max(0, rx.lineNum - 3), Math.min(lines.length, rx.lineNum + 5))
        .join("\n");
      const usedInExecLoop =
        /\.exec\s*\(/.test(surroundingLines) && /\b(?:while|for)\b/.test(surroundingLines);

      if (usedInExecLoop && !rx.flags.includes("g")) {
        unsafeCount++;
        findings.push({
          id: "HEA-230",
          category: "regex_safety",
          domain: DOMAIN,
          severity: "error",
          message: `Regex used with exec() in loop without /g flag in ${hook.name}`,
          details: `Line ${rx.lineNum}: ${rx.raw.slice(0, 80)} — missing /g flag causes infinite loop`,
          impactScore: 90,
          frequency: 1,
          blastRadius: 5,
          patchType: "regex-add-global-flag",
        });
      }

      // Check 2: Nested quantifiers (catastrophic backtracking risk)
      // Patterns like (a+)+, (a*)*,  (a+)*, etc.
      const nestedQuantifier = /\([^)]*[+*][^)]*\)[+*]|\([^)]*\{[^}]*\}[^)]*\)[+*{]/;
      if (nestedQuantifier.test(rx.pattern)) {
        unsafeCount++;
        findings.push({
          id: "HEA-231",
          category: "regex_safety",
          domain: DOMAIN,
          severity: "error",
          message: `Potentially catastrophic regex in ${hook.name} (nested quantifiers)`,
          details: `Line ${rx.lineNum}: pattern has nested quantifiers which can cause exponential backtracking`,
          impactScore: 85,
          frequency: 1,
          blastRadius: 4,
        });
      }

      // Check 3: Backreferences in quantified groups
      const backrefInQuantified = /\([^)]*\\[1-9][^)]*\)[+*{]/;
      if (backrefInQuantified.test(rx.pattern)) {
        unsafeCount++;
        findings.push({
          id: "HEA-232",
          category: "regex_safety",
          domain: DOMAIN,
          severity: "warning",
          message: `Backreference in quantified group in ${hook.name}`,
          details: `Line ${rx.lineNum}: backreferences inside quantified groups can cause ReDoS`,
          impactScore: 70,
          frequency: 1,
          blastRadius: 3,
        });
      }
    }
  }

  const bm = BENCHMARKS.regex_safety;
  const result = scoreMetric(unsafeCount, bm.unsafe_count);

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        unsafe_count: unsafeCount,
        total_findings: findings.length,
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

  const hookFiles = getHookFiles(rootDir);

  // Category 4: Error Handling & Sanitization
  const cat4 = checkErrorHandlingSanitization(hookFiles);
  findings.push(...cat4.findings);
  scores.error_handling_sanitization = cat4.score;

  // Category 5: Security Patterns
  const cat5 = checkSecurityPatterns(hookFiles);
  findings.push(...cat5.findings);
  scores.security_patterns = cat5.score;

  // Category 6: Code Hygiene
  const cat6 = checkCodeHygiene(hookFiles, rootDir);
  findings.push(...cat6.findings);
  scores.code_hygiene = cat6.score;

  // Category 7: Regex Safety
  const cat7 = checkRegexSafety(hookFiles);
  findings.push(...cat7.findings);
  scores.regex_safety = cat7.score;

  return { domain: DOMAIN, findings, scores };
}

module.exports = { run, DOMAIN };
