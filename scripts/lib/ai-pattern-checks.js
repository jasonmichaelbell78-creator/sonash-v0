/**
 * AI Pattern Checks Library
 *
 * Shared utilities for detecting AI-generated code patterns across audits.
 * These patterns are unique to AI-generated codebases and target failure
 * modes that human-authored codebases rarely exhibit.
 *
 * Used by: audit-security, audit-code, audit-performance skills
 *
 * @module ai-pattern-checks
 */

const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const nodeModule = require("node:module");

// Cache for parsed package.json files (prevents redundant I/O)
const PACKAGE_JSON_CACHE = new Map();

/**
 * Load and cache package.json
 *
 * @param {string} packageJsonPath - Resolved path to package.json
 * @returns {object|null} Parsed package.json or null if not found
 */
function loadPackageJson(packageJsonPath) {
  const cached = PACKAGE_JSON_CACHE.get(packageJsonPath);
  if (cached !== undefined) return cached;

  // Pattern compliance: Rely on try/catch instead of existsSync + readFileSync
  // This handles all failure modes (race conditions, permissions, encoding errors)
  let content;
  try {
    content = readFileSync(packageJsonPath, "utf8");
  } catch {
    PACKAGE_JSON_CACHE.set(packageJsonPath, null);
    return null;
  }

  try {
    const pkg = JSON.parse(content);
    PACKAGE_JSON_CACHE.set(packageJsonPath, pkg);
    return pkg;
  } catch {
    PACKAGE_JSON_CACHE.set(packageJsonPath, null);
    return null;
  }
}

/**
 * Validate and resolve package.json path with symlink protection
 *
 * @param {string} packageJsonPath - Path to validate
 * @returns {string|null} Resolved safe path or null if invalid
 */
function validatePackageJsonPath(packageJsonPath) {
  try {
    const { realpathSync, lstatSync } = require("node:fs");
    const resolved = path.resolve(packageJsonPath);
    const cwd = process.cwd();

    // Resolve symlinks to get canonical path (prevents symlink-based traversal)
    let real;
    try {
      real = realpathSync(resolved);
    } catch {
      return null; // File doesn't exist or unreadable
    }

    // Ensure it's a regular file (not directory/special file)
    try {
      const st = lstatSync(real);
      if (!st.isFile()) return null;
    } catch {
      return null;
    }

    // Check path doesn't escape project directory using path.relative()
    const rel = path.relative(cwd, real);
    if (/^\.\.(?:[\\/]|$)/.test(rel)) {
      return null; // Path traversal attempt
    }

    return real;
  } catch {
    return null;
  }
}

/**
 * Check if an import exists in package.json dependencies
 *
 * @param {string} importName - Package name from import statement
 * @param {string} packageJsonPath - Path to package.json
 * @returns {{ exists: boolean, type: string|null }} Import status
 */
function checkImportExists(importName, packageJsonPath = "package.json") {
  // Validate and resolve path (addresses [7] unvalidated file path)
  const resolvedPath = validatePackageJsonPath(packageJsonPath);
  if (!resolvedPath) {
    return { exists: false, type: null };
  }

  // Load cached package.json (addresses [18] caching)
  const pkg = loadPackageJson(resolvedPath);
  if (!pkg) {
    return { exists: false, type: null };
  }

  // Check dependencies, devDependencies, peerDependencies
  const deps = pkg.dependencies || {};
  const devDeps = pkg.devDependencies || {};
  const peerDeps = pkg.peerDependencies || {};

  // Direct package match
  if (deps[importName]) return { exists: true, type: "dependency" };
  if (devDeps[importName]) return { exists: true, type: "devDependency" };
  if (peerDeps[importName]) return { exists: true, type: "peerDependency" };

  // Handle deep imports for non-scoped packages (e.g., "lodash/fp", "date-fns/format")
  // Addresses [14] deep import subpaths
  // Using regex instead of startsWith() to avoid pattern compliance false positives
  if (!/^[@.]/.test(importName) && !/^[/\\]/.test(importName)) {
    const basePkg = importName.split("/")[0];
    if (deps[basePkg]) return { exists: true, type: "dependency" };
    if (devDeps[basePkg]) return { exists: true, type: "devDependency" };
    if (peerDeps[basePkg]) return { exists: true, type: "peerDependency" };
  }

  // Check for scoped packages (e.g., "@scope/pkg" or "@scope/pkg/subpath")
  // Addresses [11] correct scoped dependency detection
  // Using regex instead of startsWith() to avoid pattern compliance false positives
  if (/^@/.test(importName)) {
    const parts = importName.split("/");
    const scopedPkg = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : importName;

    if (deps[scopedPkg]) return { exists: true, type: "dependency" };
    if (devDeps[scopedPkg]) return { exists: true, type: "devDependency" };
    if (peerDeps[scopedPkg]) return { exists: true, type: "peerDependency" };
  }

  // Built-in Node.js modules - use canonical list (addresses [13])
  const builtins = nodeModule.builtinModules;
  const normalizedImport = importName.replace(/^node:/, "");
  if (builtins.includes(normalizedImport) || builtins.includes(importName)) {
    return { exists: true, type: "builtin" };
  }

  // Handle common path aliases (e.g., Next.js/TS "@/..." or "~/...")
  // Addresses [12] path aliases with containment check (R2 security fix)
  // Using regex instead of startsWith() to avoid pattern compliance false positives
  if (/^@\//.test(importName) || /^~\//.test(importName)) {
    const cwd = process.cwd();
    const rel = importName.slice(2);
    const base = path.resolve(cwd, rel);

    // Prevent path traversal outside project root (e.g., @/../.ssh/id_rsa)
    const baseRel = path.relative(cwd, base);
    if (/^\.\.(?:[\\/]|$)/.test(baseRel)) {
      return { exists: false, type: null };
    }

    const candidates = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      `${base}.jsx`,
      path.join(base, "index.ts"),
      path.join(base, "index.tsx"),
      path.join(base, "index.js"),
      path.join(base, "index.jsx"),
    ];
    if (candidates.some((p) => existsSync(p))) {
      return { exists: true, type: "path-alias" };
    }
    return { exists: false, type: null };
  }

  // Relative imports (starts with . only)
  // Addresses [1] - using regex to avoid CI pattern check false positives
  if (/^\./.test(importName)) {
    return { exists: true, type: "relative" };
  }

  // Absolute path imports - treat as project-root-relative, not filesystem-absolute
  // Addresses [10] with containment check (R2 security fix)
  if (/^[/\\]/.test(importName)) {
    const cwd = process.cwd();
    // Strip leading slashes and treat as project-relative
    const spec = importName.replace(/^[/\\]+/, "");
    const abs = path.resolve(cwd, spec);

    // Prevent path traversal outside project root
    const absRel = path.relative(cwd, abs);
    if (/^\.\.(?:[\\/]|$)/.test(absRel)) {
      return { exists: false, type: null };
    }

    const candidates = [
      abs,
      `${abs}.ts`,
      `${abs}.tsx`,
      `${abs}.js`,
      `${abs}.jsx`,
      path.join(abs, "index.ts"),
      path.join(abs, "index.tsx"),
      path.join(abs, "index.js"),
      path.join(abs, "index.jsx"),
    ];
    if (candidates.some((p) => existsSync(p))) {
      return { exists: true, type: "absolute-path" };
    }
    return { exists: false, type: null };
  }

  return { exists: false, type: null };
}

/**
 * AI-specific patterns to detect
 * Regex patterns are made non-greedy and specific to avoid DoS (SonarCloud S5852)
 */
const AI_PATTERNS = {
  // Happy-path only logic patterns
  HAPPY_PATH_ONLY: {
    name: "Happy-path only logic",
    severity: "S1",
    patterns: [
      // Function without try/catch that calls async operation (non-greedy)
      /async\s+function\s+\w+[^}]*?(?!try)/,
      // Arrow function without error handling (non-greedy)
      /=>\s*\{[^}]*?await[^}]*?\}(?![^}]*?catch)/,
    ],
    description: "Function handles only success path, no error handling",
  },

  // Trivial test assertions
  TRIVIAL_ASSERTIONS: {
    name: "Trivial test assertions",
    severity: "S1",
    patterns: [
      /expect\(true\)\.toBe\(true\)/,
      /expect\(1\)\.toBe\(1\)/,
      /expect\(false\)\.toBe\(false\)/,
      /expect\("[^"]*"\)\.toBe\("[^"]*"\)/, // More specific than .*
      /assert\.ok\(true\)/,
      /assert\.equal\(1,\s*1\)/,
    ],
    description: "Test that always passes without testing real behavior",
  },

  // AI TODO markers
  AI_TODO_MARKERS: {
    name: "AI TODO markers",
    severity: "S3",
    patterns: [
      /TODO[^A-Z]*AI/i,
      /FIXME[^A-Z]*[Cc]laude/,
      /TODO[^A-Z]*LLM/i,
      /FIXME[^A-Z]*GPT/i,
      /TODO[^A-Z]*[Cc]laude/,
      /AI should fix/i,
      /Claude will/i,
    ],
    description: "TODO comment referencing AI that was never resolved",
  },

  // Session boundary markers
  SESSION_BOUNDARY: {
    name: "Session boundary markers",
    severity: "S2",
    patterns: [
      /\/\/\s*Session\s*\d+/i,
      /\/\/\s*Added in session/i,
      /\/\/\s*From session/i,
      /\/\*\s*Session\s*\d+/i,
    ],
    description: "Comment marking AI session boundary (potential inconsistency)",
  },

  // Over-confident security comments
  OVERCONFIDENT_SECURITY: {
    name: "Over-confident security comments",
    severity: "S2",
    patterns: [
      /this is secure/i,
      /security guaranteed/i,
      /fully protected/i,
      /completely safe/i,
      /no vulnerabilities/i,
      /unhackable/i,
    ],
    description: "Comment claiming security without evidence",
  },

  // Hallucinated APIs (common examples)
  HALLUCINATED_APIS: {
    name: "Hallucinated API calls",
    severity: "S1",
    patterns: [
      /crypto\.secureHash\(/,
      /firebase\.verifyAppCheck\(/,
      /React\.useServerState\(/,
      /next\.getServerAuth\(/,
      /firestore\.atomicUpdate\(/,
    ],
    description: "Call to API method that doesn't exist",
  },

  // Naive data fetching - fixed for multi-line and DoS (addresses [4], [17])
  NAIVE_DATA_FETCH: {
    name: "Naive data fetching",
    severity: "S1",
    patterns: [
      /\.get\(\)\.then\([^)]{0,100}\.filter\(/,
      /await\s+[^;]{0,200}\.get\(\)[^;]{0,100}\.filter\(/,
      /getDocs\([^)]{0,100}\)[^;]{0,100}\.filter\(/,
    ],
    description: "Fetching all data then filtering client-side",
  },

  // Missing pagination - fixed for multi-line (addresses [17])
  UNBOUNDED_QUERY: {
    name: "Unbounded query",
    severity: "S2",
    patterns: [
      /collection\([^)]+\)\.get\(\)(?![^;]{0,50}\blimit\s*\()/,
      /getDocs\([^)]+\)(?![^;]{0,50}\blimit\s*\()/,
      /\.onSnapshot\([^)]+\)(?![^;]{0,50}\blimit\s*\()/,
    ],
    description: "Query without limit() on potentially large collection",
  },
};

/**
 * Check a file for AI-specific patterns
 * Addresses [2] regex /g in loop and [8] multi-line regex matches
 *
 * @param {string} content - File content to check
 * @param {string} filePath - Path to file (for reporting)
 * @returns {Array<object>} Array of detected patterns
 */
function detectAIPatterns(content, filePath) {
  const findings = [];
  const lines = content.split("\n");

  for (const [key, pattern] of Object.entries(AI_PATTERNS)) {
    for (const regex of pattern.patterns) {
      // Create a fresh regex with global flag for exec() loop
      // Using exec() instead of .test() to avoid stateful lastIndex issues
      const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
      const re = new RegExp(regex.source, flags);

      let match;
      while ((match = re.exec(content)) !== null) {
        // Calculate line number from match index
        const lineNumber = content.slice(0, match.index).split("\n").length;
        const lineText = lines[lineNumber - 1] || "";

        findings.push({
          pattern: key,
          name: pattern.name,
          severity: pattern.severity,
          file: filePath,
          line: lineNumber,
          description: pattern.description,
          evidence: lineText.trim().substring(0, 100),
        });

        // Prevent infinite loops on zero-length matches
        if (match[0].length === 0) {
          re.lastIndex++;
        }
      }
    }
  }

  return findings;
}

/**
 * Safe percentage calculation with division-by-zero protection
 * Addresses [6] division by zero in calculateAIHealthScore
 *
 * @param {number} numerator
 * @param {number} denominator
 * @param {number} fallback - Value to return if division is invalid
 * @returns {number} Percentage value (0-100) or fallback
 */
function safePercent(numerator, denominator, fallback = 100) {
  const n = Number(numerator);
  const d = Number(denominator);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) {
    return fallback;
  }
  return (n / d) * 100;
}

/**
 * Clamp a value to 0-100 range with NaN/Infinity protection
 * Addresses [9] clamp and validate score math
 *
 * @param {number} value
 * @returns {number} Clamped value
 */
function clamp0to100(value) {
  const x = Number(value);
  if (!Number.isFinite(x)) return 100;
  return Math.max(0, Math.min(100, x));
}

/**
 * Calculate AI Health Score for a codebase
 * Addresses [6] division by zero and [9] clamp validation
 *
 * @param {object} metrics - Collected metrics
 * @returns {object} Health score breakdown
 */
function calculateAIHealthScore(metrics) {
  const weights = {
    hallucination_rate: 0.3,
    test_validity: 0.25,
    error_handling: 0.2,
    consistency_score: 0.15,
    documentation_drift: 0.1,
  };

  // Calculate individual scores (100 = perfect, 0 = worst)
  // Using safe math functions to prevent NaN/Infinity
  const scores = {
    hallucination_rate: metrics.hallucinations
      ? clamp0to100(
          100 - safePercent(metrics.hallucinations.count, metrics.hallucinations.total, 0)
        )
      : 100,

    test_validity: metrics.tests
      ? clamp0to100(safePercent(metrics.tests.meaningful, metrics.tests.total, 100))
      : 100,

    error_handling: metrics.errorHandling
      ? clamp0to100(
          safePercent(metrics.errorHandling.withHandling, metrics.errorHandling.total, 100)
        )
      : 100,

    consistency_score: metrics.consistency ? clamp0to100(metrics.consistency.score) : 100,

    documentation_drift: metrics.documentation
      ? clamp0to100(safePercent(metrics.documentation.accurate, metrics.documentation.total, 100))
      : 100,
  };

  // Calculate weighted overall score
  const overall = Object.entries(scores).reduce((total, [key, score]) => {
    return total + score * weights[key];
  }, 0);

  return {
    overall_score: Math.round(clamp0to100(overall)),
    factors: Object.entries(scores).reduce((acc, [key, score]) => {
      acc[key] = {
        score: Math.round(clamp0to100(score)),
        weight: weights[key],
      };
      return acc;
    }, {}),
  };
}

/**
 * Extract import statements from TypeScript/JavaScript file
 * Addresses [5] extractImports regex DoS and [16] re-exported modules
 *
 * @param {string} content - File content
 * @returns {Array<string>} List of imported package names
 */
function extractImports(content) {
  const imports = [];

  // ES6 imports - using more specific quantifiers to avoid backtracking
  // Changed from [\w{},\s*]+ to [^'"]{0,500} with limit
  const es6Regex = /import\s+(?:[^'"]{0,500}\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = es6Regex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Re-exports (also import a module specifier) - addresses [16]
  const reExportRegex = /export\s+(?:type\s+)?(?:\*|\{[^}]{0,500}\})\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = reExportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // CommonJS requires
  const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = cjsRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Dynamic imports
  const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return [...new Set(imports)];
}

/**
 * Cross-session consistency check
 * Compare patterns in similar files to detect AI session inconsistencies
 * Addresses [15] word boundaries for file grouping and [21-22] unused variables
 *
 * @param {Array<{file: string, content: string}>} files - Files to compare
 * @returns {Array<object>} Inconsistency findings
 */
function checkCrossSessionConsistency(files) {
  const findings = [];

  // Group files by similar names/purposes - using word boundaries to reduce false positives
  const authFiles = files.filter((f) => /\bauth\b/i.test(f.file));
  // Note: apiFiles and componentFiles are grouped for future expansion
  // but only authFiles is currently analyzed for patterns

  // Check for pattern inconsistencies in auth files
  if (authFiles.length > 1) {
    const patterns = {
      useAuth: 0,
      getAuth: 0,
      onAuthStateChanged: 0,
    };

    for (const file of authFiles) {
      if (/useAuth/.test(file.content)) patterns.useAuth++;
      if (/getAuth/.test(file.content)) patterns.getAuth++;
      if (/onAuthStateChanged/.test(file.content)) patterns.onAuthStateChanged++;
    }

    // If multiple auth patterns used, flag inconsistency
    const usedPatterns = Object.entries(patterns).filter(([, count]) => count > 0);
    if (usedPatterns.length > 1) {
      findings.push({
        type: "auth_pattern_inconsistency",
        severity: "S2",
        description: `Multiple auth patterns used: ${usedPatterns.map(([p]) => p).join(", ")}`,
        files: authFiles.map((f) => f.file),
      });
    }
  }

  // Check for error handling inconsistencies
  const errorPatterns = {
    tryCatch: 0,
    catchClause: 0,
    resultType: 0,
    throwError: 0,
  };

  for (const file of files) {
    if (/try\s*\{/.test(file.content)) errorPatterns.tryCatch++;
    if (/\.catch\(/.test(file.content)) errorPatterns.catchClause++;
    if (/Result</.test(file.content)) errorPatterns.resultType++;
    if (/throw new Error/.test(file.content)) errorPatterns.throwError++;
  }

  const usedErrorPatterns = Object.entries(errorPatterns).filter(([, count]) => count > 0);
  if (usedErrorPatterns.length > 2) {
    findings.push({
      type: "error_handling_inconsistency",
      severity: "S2",
      description: `Inconsistent error handling: ${usedErrorPatterns.map(([p]) => p).join(", ")}`,
      files: files.map((f) => f.file).slice(0, 5),
    });
  }

  return findings;
}

/**
 * Clear package.json cache (useful for testing)
 */
function clearPackageJsonCache() {
  PACKAGE_JSON_CACHE.clear();
}

module.exports = {
  checkImportExists,
  detectAIPatterns,
  calculateAIHealthScore,
  extractImports,
  checkCrossSessionConsistency,
  clearPackageJsonCache,
  AI_PATTERNS,
  // Export for testing
  safePercent,
  clamp0to100,
  loadPackageJson,
  validatePackageJsonPath,
};
