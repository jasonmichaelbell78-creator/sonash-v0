/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * CI/CD Pipeline Checker — Domain 6 (D6)
 *
 * 17. Workflow Script Alignment
 * 18. Bot Configuration Freshness
 * 19. CI Cache Effectiveness
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[cicd-pipeline] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "cicd_pipeline";

/**
 * Run all CI/CD pipeline health checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  // Category 17: Workflow Script Alignment
  const cat17 = checkWorkflowScriptAlignment(rootDir, findings);
  scores.workflow_script_alignment = cat17;

  // Category 18: Bot Configuration Freshness
  const cat18 = checkBotConfigFreshness(rootDir, findings);
  scores.bot_config_freshness = cat18;

  // Category 19: CI Cache Effectiveness
  const cat19 = checkCiCacheEffectiveness(rootDir, findings);
  scores.ci_cache_effectiveness = cat19;

  return { domain: DOMAIN, findings, scores };
}

// ── Category 17: Workflow Script Alignment ──────────────────────────────────

/**
 * Read all workflow .yml files from .github/workflows/.
 * @param {string} rootDir
 * @returns {Array<{ name: string, content: string }>}
 */
function readWorkflowFiles(rootDir) {
  const workflowDir = path.join(rootDir, ".github", "workflows");
  const files = [];
  try {
    const entries = fs.readdirSync(workflowDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith(".yml") || entry.name.endsWith(".yaml"))) {
        const content = safeReadFile(path.join(workflowDir, entry.name));
        if (content) {
          files.push({ name: entry.name, content });
        }
      }
    }
  } catch {
    // .github/workflows/ not accessible
  }
  return files;
}

/**
 * Extract npm script names and node commands from workflow run: steps.
 * Uses line-by-line parsing (no YAML library).
 * @param {string} content - Workflow YAML content
 * @returns {Array<{ line: number, command: string, scriptRef: string }>}
 */
function extractRunStepRefs(content) {
  const refs = [];
  const lines = content.split("\n");

  let inRun = false;
  let runBuffer = "";
  let runStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect "run:" or "run: |" lines
    if (/^run:\s*\|?\s*$/.test(trimmed) || /^run:\s+[^|]/.test(trimmed)) {
      if (inRun && runBuffer) {
        // Process previous run buffer
        extractRefsFromCommand(runBuffer, runStartLine, refs);
      }

      inRun = false;
      runBuffer = "";
      runStartLine = i + 1;

      // Inline run: command (not multiline)
      const inlineMatch = trimmed.match(/^run:\s+(.+)$/);
      if (inlineMatch && !trimmed.endsWith("|")) {
        extractRefsFromCommand(inlineMatch[1], runStartLine, refs);
      } else if (trimmed.endsWith("|")) {
        // Multiline run block
        inRun = true;
        runStartLine = i + 1;
      }
    } else if (inRun) {
      // Inside a multiline run: block — check indentation
      if (trimmed === "" || line.match(/^\s{6,}/)) {
        runBuffer += trimmed + "\n";
      } else {
        // Indentation decreased — end of multiline block
        extractRefsFromCommand(runBuffer, runStartLine, refs);
        inRun = false;
        runBuffer = "";
      }
    }
  }

  // Flush remaining buffer
  if (inRun && runBuffer) {
    extractRefsFromCommand(runBuffer, runStartLine, refs);
  }

  return refs;
}

/**
 * Extract npm/node references from a run command string.
 * @param {string} command
 * @param {number} line
 * @param {Array} refs
 */
function extractRefsFromCommand(command, line, refs) {
  // Match npm run <script>, npm run <script> --, npx <command>
  const npmRunPattern = /npm run ([\w:_-]+)/g;
  let match;
  while ((match = npmRunPattern.exec(command)) !== null) {
    refs.push({ line, command: command.trim(), scriptRef: match[1] });
  }

  // Match npx <tool> (common: npx vitest, npx tsc)
  const npxPattern = /npx ([\w_-]+)/g;
  while ((match = npxPattern.exec(command)) !== null) {
    refs.push({ line, command: command.trim(), scriptRef: `npx:${match[1]}` });
  }

  // Match direct node <script> calls
  const nodePattern = /node ([\w./_-]+\.js)/g;
  while ((match = nodePattern.exec(command)) !== null) {
    refs.push({ line, command: command.trim(), scriptRef: `node:${match[1]}` });
  }
}

/**
 * Check if a node: script ref is contained within rootDir.
 */
function isNodeRefContained(rootDir, nodeRef) {
  const rootAbs = path.resolve(rootDir);
  const resolved = path.resolve(rootAbs, nodeRef);
  const rel = path.relative(rootAbs, resolved);
  return !(/^\.\.(?:[\\/]|$)/.test(rel) || rel === "");
}

/**
 * Validate a single workflow script reference.
 * Returns "valid" or an invalid-ref descriptor object.
 */
function validateWorkflowRef(rootDir, ref, workflowName, pkgScripts, canVerifyPkgScripts) {
  if (ref.scriptRef.startsWith("npx:")) return "valid";

  if (ref.scriptRef.startsWith("node:")) {
    const nodeRef = ref.scriptRef.slice(5);
    if (path.isAbsolute(nodeRef) || !isNodeRefContained(rootDir, nodeRef)) {
      return { workflow: workflowName, line: ref.line, ref: nodeRef, type: "path_escape" };
    }
    const filePath = path.resolve(rootDir, nodeRef);
    if (fs.existsSync(filePath)) return "valid";
    return { workflow: workflowName, line: ref.line, ref: nodeRef, type: "missing_file" };
  }

  // npm run <script>
  if (!canVerifyPkgScripts) return "valid";
  if (pkgScripts[ref.scriptRef]) return "valid";
  return { workflow: workflowName, line: ref.line, ref: ref.scriptRef, type: "missing_script" };
}

function checkWorkflowScriptAlignment(rootDir, findings) {
  const bench = BENCHMARKS.workflow_script_alignment;
  const workflows = readWorkflowFiles(rootDir);

  if (workflows.length === 0) {
    findings.push({
      id: "HEA-600",
      category: "workflow_script_alignment",
      domain: DOMAIN,
      severity: "warning",
      message: "No workflow files found in .github/workflows/",
      details: "Cannot verify workflow-to-script alignment without workflow files.",
      impactScore: 40,
      frequency: 1,
      blastRadius: 2,
    });
    return { score: 50, rating: "poor", metrics: { workflowCount: 0, totalRefs: 0, validRefs: 0 } };
  }

  // Load package.json scripts
  const pkgPath = path.join(rootDir, "package.json");
  const pkgRaw = safeReadFile(pkgPath);
  let pkgScripts = {};
  let canVerifyPkgScripts = false;
  if (pkgRaw) {
    try {
      const pkg = JSON.parse(pkgRaw);
      pkgScripts = pkg.scripts || {};
      canVerifyPkgScripts = true;
    } catch {
      // Invalid package.json (can't verify scripts)
    }
  }

  let totalRefs = 0;
  let validRefs = 0;
  const invalidRefs = [];

  for (const workflow of workflows) {
    const refs = extractRunStepRefs(workflow.content);
    for (const ref of refs) {
      totalRefs++;
      const result = validateWorkflowRef(
        rootDir,
        ref,
        workflow.name,
        pkgScripts,
        canVerifyPkgScripts
      );
      if (result === "valid") {
        validRefs++;
      } else {
        invalidRefs.push(result);
      }
    }
  }

  const validPct = totalRefs > 0 ? Math.round((validRefs / totalRefs) * 100) : 100;
  const result = scoreMetric(validPct, bench.valid_refs_pct, "higher-is-better");

  if (invalidRefs.length > 0) {
    const details = invalidRefs
      .slice(0, 10)
      .map(
        (r) => `${r.workflow}:L${r.line} — ${r.type === "missing_script" ? "npm run " : ""}${r.ref}`
      )
      .join("; ");
    findings.push({
      id: "HEA-601",
      category: "workflow_script_alignment",
      domain: DOMAIN,
      severity: invalidRefs.length >= 3 ? "error" : "warning",
      message: `${invalidRefs.length} workflow step(s) reference missing scripts or files`,
      details: `Invalid references: ${details}`,
      impactScore: invalidRefs.length >= 3 ? 75 : 55,
      frequency: invalidRefs.length,
      blastRadius: 3,
      patchType: "config_fix",
      patchTarget: "package.json or .github/workflows/",
      patchContent: "Add missing scripts to package.json or fix workflow references",
      patchImpact: "Prevent CI workflow failures from missing script references",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      workflowCount: workflows.length,
      totalRefs,
      validRefs,
      invalidRefs: invalidRefs.length,
      validPct,
    },
  };
}

// ── Category 18: Bot Configuration Freshness ────────────────────────────────

/** Known bot config file patterns. */
const BOT_CONFIG_PATTERNS = [
  {
    name: "Qodo",
    patterns: [
      ".qodo",
      ".qodo.yml",
      ".qodo.yaml",
      "qodo.yml",
      "qodo.yaml",
      "qodoai.yml",
      "qodoai.yaml",
      ".qodoai.yml",
    ],
  },
  {
    name: "Gemini",
    patterns: [".gemini", ".gemini.yml", ".gemini.yaml", "gemini.yml", "gemini.yaml"],
  },
  {
    name: "Renovate",
    patterns: [".renovaterc", ".renovaterc.json", "renovate.json", "renovate.json5"],
  },
  { name: "Dependabot", patterns: [".github/dependabot.yml", ".github/dependabot.yaml"] },
];

function checkBotConfigFreshness(rootDir, findings) {
  const bench = BENCHMARKS.bot_config_freshness;

  let configsFound = 0;
  let configsHealthy = 0;
  const missingBots = [];
  const staleConfigs = [];

  for (const bot of BOT_CONFIG_PATTERNS) {
    let found = false;
    let configPath = null;
    let configContent = null;

    for (const pattern of bot.patterns) {
      const fullPath = path.join(rootDir, pattern);
      const content = safeReadFile(fullPath);
      if (content) {
        found = true;
        configPath = fullPath;
        configContent = content;
        break;
      }
    }

    if (found) {
      configsFound++;

      // Check freshness: verify config references patterns that exist in project
      const healthIssues = checkBotConfigHealth(rootDir, bot.name, configContent);
      if (healthIssues.length === 0) {
        configsHealthy++;
      } else {
        staleConfigs.push({ bot: bot.name, path: configPath, issues: healthIssues });
      }
    } else {
      missingBots.push(bot.name);
    }
  }

  // Score: existence (50%) + health (50%)
  const totalBots = BOT_CONFIG_PATTERNS.length;
  const existencePct = Math.round((configsFound / totalBots) * 100);
  const healthPct = configsFound > 0 ? Math.round((configsHealthy / configsFound) * 100) : 0;
  const configScore = Math.round(existencePct * 0.5 + healthPct * 0.5);

  const result = scoreMetric(configScore, bench.config_score, "higher-is-better");

  if (missingBots.length > 0) {
    findings.push({
      id: "HEA-610",
      category: "bot_config_freshness",
      domain: DOMAIN,
      severity: "info",
      message: `${missingBots.length} review bot config(s) not found: ${missingBots.join(", ")}`,
      details: "Consider adding bot configurations for automated code review coverage.",
      impactScore: 25,
      frequency: missingBots.length,
      blastRadius: 1,
    });
  }

  if (staleConfigs.length > 0) {
    const details = staleConfigs.map((c) => `${c.bot}: ${c.issues.join(", ")}`).join("; ");
    findings.push({
      id: "HEA-611",
      category: "bot_config_freshness",
      domain: DOMAIN,
      severity: "warning",
      message: `${staleConfigs.length} bot config(s) have health issues`,
      details: `Stale or misconfigured: ${details}`,
      impactScore: 45,
      frequency: staleConfigs.length,
      blastRadius: 2,
      patchType: "config_fix",
      patchTarget: staleConfigs.map((c) => c.path).join(", "),
      patchContent: "Update bot configurations to reference current project structure",
      patchImpact: "Ensure review bots analyze the correct files",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalBots,
      configsFound,
      configsHealthy,
      missingBots: missingBots.length,
      staleConfigs: staleConfigs.length,
      configScore,
    },
  };
}

/**
 * Check a bot config for health issues (stale references, etc.).
 * @param {string} rootDir
 * @param {string} botName
 * @param {string} content
 * @returns {string[]} List of issues found
 */
function checkBotConfigHealth(rootDir, botName, content) {
  const issues = [];

  // Check if config references file patterns that don't match any files
  // Look for common glob/path patterns in config content
  const pathPatterns = content.match(/["']([*]{2}\/\*\.[a-zA-Z]+)["']/g);
  if (pathPatterns) {
    for (const pattern of pathPatterns) {
      const clean = pattern.replace(/["']/g, "");
      // Check for very unusual extensions that likely don't exist
      const ext = clean.split(".").pop();
      if (
        ext &&
        !["js", "ts", "tsx", "jsx", "json", "yml", "yaml", "md", "css", "html", "sh"].includes(ext)
      ) {
        issues.push(`References uncommon extension: .${ext}`);
      }
    }
  }

  // Check if config file is essentially empty (< 10 bytes of real content)
  const stripped = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("#"))
    .join("");
  if (stripped.length < 10) {
    issues.push("Config appears empty or contains only comments");
  }

  return issues;
}

// ── Category 19: CI Cache Effectiveness ─────────────────────────────────────

function checkCiCacheEffectiveness(rootDir, findings) {
  const bench = BENCHMARKS.ci_cache_effectiveness;
  const workflows = readWorkflowFiles(rootDir);

  if (workflows.length === 0) {
    return { score: 50, rating: "poor", metrics: { workflowCount: 0, cacheSteps: 0 } };
  }

  let totalCacheSteps = 0;
  let effectiveCacheSteps = 0;
  const cacheIssues = [];

  for (const workflow of workflows) {
    const lines = workflow.content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect actions/cache usage
      if (line.startsWith("uses:") && line.includes("actions/cache")) {
        totalCacheSteps++;
        const issues = analyzeCacheBlock(lines, i, rootDir);
        if (issues.length === 0) {
          effectiveCacheSteps++;
        } else {
          cacheIssues.push({ workflow: workflow.name, line: i + 1, issues });
        }
      }

      // Detect setup-node with cache
      if (line.startsWith("uses:") && line.includes("actions/setup-node")) {
        // Look for cache: "npm" in the with: block below
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine.startsWith("cache:")) {
            totalCacheSteps++;
            effectiveCacheSteps++; // setup-node cache is generally well-configured
            break;
          }
          // Stop if we hit another step
          if (nextLine.startsWith("- name:") || nextLine.startsWith("uses:")) break;
        }
      }
    }
  }

  // Check if lock file exists (cache keys should reference it)
  const hasLockFile = fs.existsSync(path.join(rootDir, "package-lock.json"));
  const hasYarnLock = fs.existsSync(path.join(rootDir, "yarn.lock"));
  const hasPnpmLock = fs.existsSync(path.join(rootDir, "pnpm-lock.yaml"));

  // Score calculation
  let effectivenessPct;
  if (totalCacheSteps === 0) {
    // No caching at all is a moderate concern
    effectivenessPct = 40;
    findings.push({
      id: "HEA-620",
      category: "ci_cache_effectiveness",
      domain: DOMAIN,
      severity: "warning",
      message: "No explicit cache configuration found in CI workflows",
      details:
        "Adding cache steps (actions/cache or setup-node cache) can significantly speed up CI runs.",
      impactScore: 50,
      frequency: 1,
      blastRadius: 3,
      patchType: "config_fix",
      patchTarget: ".github/workflows/",
      patchContent: "Add cache configuration for npm/node_modules",
      patchImpact: "Reduce CI run times by caching dependencies",
    });
  } else {
    effectivenessPct = Math.round((effectiveCacheSteps / totalCacheSteps) * 100);
  }

  if (cacheIssues.length > 0) {
    const details = cacheIssues
      .slice(0, 5)
      .map((c) => `${c.workflow}:L${c.line} — ${c.issues.join(", ")}`)
      .join("; ");
    findings.push({
      id: "HEA-621",
      category: "ci_cache_effectiveness",
      domain: DOMAIN,
      severity: "warning",
      message: `${cacheIssues.length} cache step(s) have configuration issues`,
      details: `Issues: ${details}`,
      impactScore: 45,
      frequency: cacheIssues.length,
      blastRadius: 2,
      patchType: "config_fix",
      patchTarget: ".github/workflows/",
      patchContent: "Fix cache key patterns to use hash-based keys referencing current lock files",
      patchImpact: "Improve cache hit rates and reduce stale cache usage",
    });
  }

  const result = scoreMetric(effectivenessPct, bench.effectiveness_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      workflowCount: workflows.length,
      totalCacheSteps,
      effectiveCacheSteps,
      cacheIssues: cacheIssues.length,
      effectivenessPct,
      hasLockFile,
      hasYarnLock,
      hasPnpmLock,
    },
  };
}

/**
 * Validate a single cache key value for common issues.
 * @param {string} keyValue - The cache key string
 * @param {string} rootDir
 * @param {string[]} issues - Mutated: issues are appended here
 */
function validateCacheKey(keyValue, rootDir, issues) {
  // Check for hash-based keys (good practice)
  if (!keyValue.includes("hashFiles") && !keyValue.includes("hash")) {
    issues.push("Cache key does not use hashFiles() — may have stale hits");
  }

  // Check for hardcoded version strings in cache key
  if (/v\d+/.test(keyValue) && !keyValue.includes("hashFiles")) {
    issues.push("Cache key uses hardcoded version without file hash");
  }

  // Check if key references a lock file that doesn't exist
  // Using literal paths (not variables) to satisfy path-containment pattern check
  if (
    keyValue.includes("package-lock.json") &&
    !fs.existsSync(path.join(rootDir, "package-lock.json"))
  ) {
    issues.push("Cache key references package-lock.json but file does not exist");
  }
  if (keyValue.includes("yarn.lock") && !fs.existsSync(path.join(rootDir, "yarn.lock"))) {
    issues.push("Cache key references yarn.lock but file does not exist");
  }
  if (keyValue.includes("pnpm-lock.yaml") && !fs.existsSync(path.join(rootDir, "pnpm-lock.yaml"))) {
    issues.push("Cache key references pnpm-lock.yaml but file does not exist");
  }
}

/**
 * Analyze a cache block starting at an actions/cache usage line.
 * Look for key: patterns in the with: block below.
 * @param {string[]} lines
 * @param {number} startIdx
 * @param {string} rootDir
 * @returns {string[]} List of issues
 */
function analyzeCacheBlock(lines, startIdx, rootDir) {
  const issues = [];

  // Scan the with: block for key: lines
  let foundKey = false;
  for (let j = startIdx + 1; j < Math.min(startIdx + 20, lines.length); j++) {
    const line = lines[j].trim();

    // Stop at next step
    if (line.startsWith("- name:") || (line.startsWith("uses:") && j > startIdx + 1)) break;

    if (line.startsWith("key:")) {
      foundKey = true;
      validateCacheKey(line.slice(4).trim(), rootDir, issues);
    }
  }

  if (!foundKey) {
    issues.push("No cache key found in actions/cache configuration");
  }

  return issues;
}

// ── Utilities ──────────────────────────────────────────────────────────────

function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 10 * 1024 * 1024) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

module.exports = { run, DOMAIN };
