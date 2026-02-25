/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Generation Pipeline Health Checker — Domain 4 (D4)
 *
 * 11. Docs Index Correctness
 * 12. Doc Optimizer Pipeline
 * 13. Pre-commit Doc Checks
 */

"use strict";

/* eslint-disable no-unused-vars -- safeRequire is a safety wrapper */
function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[generation-pipeline] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "generation_pipeline";

/** Max file size for safe reads (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Run all generation pipeline checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  // ── Category 11: Docs Index Correctness ─────────────────────────────────
  scores.docs_index_correctness = checkDocsIndexCorrectness(rootDir, findings);

  // ── Category 12: Doc Optimizer Pipeline ─────────────────────────────────
  scores.doc_optimizer_pipeline = checkDocOptimizerPipeline(rootDir, findings);

  // ── Category 13: Pre-commit Doc Checks ──────────────────────────────────
  scores.precommit_doc_checks = checkPrecommitDocChecks(rootDir, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category 11: Docs Index Correctness ───────────────────────────────────

function checkDocsIndexCorrectness(rootDir, findings) {
  const bench = BENCHMARKS.docs_index_correctness;

  let healthChecks = 0;
  let healthPassing = 0;
  const issues = [];

  // Check 1: docs:index script exists in package.json
  healthChecks++;
  const pkgPath = path.join(rootDir, "package.json");
  const pkgContent = safeReadFile(pkgPath);
  let hasDocsIndexScript = false;
  let docsIndexScriptValue = "";

  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      if (pkg.scripts && pkg.scripts["docs:index"]) {
        hasDocsIndexScript = true;
        docsIndexScriptValue = pkg.scripts["docs:index"];
        healthPassing++;
      }
    } catch {
      issues.push("package.json is not valid JSON");
    }
  } else {
    issues.push("package.json not found");
  }

  if (!hasDocsIndexScript) {
    findings.push({
      id: "DEA-400",
      category: "docs_index_correctness",
      domain: DOMAIN,
      severity: "error",
      message: "npm script 'docs:index' not found in package.json",
      details: "The docs:index script is needed to regenerate DOCUMENTATION_INDEX.md",
      impactScore: 80,
      frequency: 1,
      blastRadius: 4,
      patchType: "fix_pipeline",
      patchTarget: "package.json",
      patchContent: 'Add "docs:index": "node scripts/generate-doc-index.js" to scripts',
      patchImpact: "Enable documentation index regeneration",
    });
  }

  // Check 2: The script file referenced by docs:index exists
  healthChecks++;
  if (hasDocsIndexScript && docsIndexScriptValue) {
    // Extract the JS file from the script command
    const scriptMatch = docsIndexScriptValue.match(/node\s+([^\s]+\.js)/);
    if (scriptMatch) {
      const scriptFile = scriptMatch[1];
      const scriptPath = path.join(rootDir, scriptFile);
      try {
        const stat = fs.statSync(scriptPath);
        if (stat.isFile()) {
          healthPassing++;
        } else {
          issues.push(`Script file ${scriptFile} is not a regular file`);
        }
      } catch {
        issues.push(`Script file ${scriptFile} not found on disk`);
        findings.push({
          id: "DEA-401",
          category: "docs_index_correctness",
          domain: DOMAIN,
          severity: "error",
          message: `docs:index script file not found: ${scriptFile}`,
          details: `The npm script references ${scriptFile} but the file doesn't exist.`,
          impactScore: 75,
          frequency: 1,
          blastRadius: 4,
          patchType: "fix_pipeline",
          patchTarget: scriptFile,
          patchContent: "Create or fix the documentation index generator script",
          patchImpact: "Restore docs:index pipeline functionality",
        });
      }
    } else {
      healthPassing++; // Non-standard command format, assume ok
    }
  }

  // Check 3: DOCUMENTATION_INDEX.md exists and is not empty
  healthChecks++;
  const indexPath = path.join(rootDir, "DOCUMENTATION_INDEX.md");
  const indexContent = safeReadFile(indexPath);
  if (indexContent && indexContent.length > 100) {
    healthPassing++;
  } else {
    issues.push("DOCUMENTATION_INDEX.md missing or too small");
    findings.push({
      id: "DEA-402",
      category: "docs_index_correctness",
      domain: DOMAIN,
      severity: "warning",
      message: "DOCUMENTATION_INDEX.md is missing or appears incomplete",
      details: "The index file should contain a comprehensive listing of all project documents.",
      impactScore: 55,
      frequency: 1,
      blastRadius: 3,
      patchType: "command",
      patchContent: "npm run docs:index",
      patchImpact: "Regenerate the documentation index",
    });
  }

  const healthPct = healthChecks > 0 ? Math.round((healthPassing / healthChecks) * 100) : 0;
  const result = scoreMetric(healthPct, bench.health_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { healthPct, healthChecks, healthPassing, issues: issues.length },
  };
}

// ── Category 12: Doc Optimizer Pipeline ───────────────────────────────────

function checkDocOptimizerPipeline(rootDir, findings) {
  const bench = BENCHMARKS.doc_optimizer_pipeline;

  let integrityChecks = 0;
  let integrityPassing = 0;
  const issues = [];

  // Check 1: doc-optimizer skill directory exists
  integrityChecks++;
  const skillDir = path.join(rootDir, ".claude", "skills", "doc-optimizer");
  let skillExists = false;
  try {
    const stat = fs.statSync(skillDir);
    skillExists = stat.isDirectory();
  } catch {
    skillExists = false;
  }

  if (skillExists) {
    integrityPassing++;
  } else {
    issues.push("doc-optimizer skill directory not found");
    findings.push({
      id: "DEA-410",
      category: "doc_optimizer_pipeline",
      domain: DOMAIN,
      severity: "info",
      message: "Doc-optimizer skill not found at .claude/skills/doc-optimizer/",
      details: "The doc-optimizer skill is optional but recommended for documentation maintenance.",
      impactScore: 20,
      frequency: 1,
      blastRadius: 1,
    });
  }

  // Check 2: SKILL.md exists in doc-optimizer
  integrityChecks++;
  if (skillExists) {
    const skillMdPath = path.join(skillDir, "SKILL.md");
    const skillContent = safeReadFile(skillMdPath);
    if (skillContent && skillContent.length > 50) {
      integrityPassing++;
    } else {
      issues.push("doc-optimizer SKILL.md missing or empty");
    }
  }

  // Check 3: State files are valid (if they exist)
  integrityChecks++;
  const stateDir = path.join(rootDir, ".claude", "state", "doc-optimizer");
  let stateValid = true;
  try {
    if (fs.existsSync(stateDir)) {
      const stateFiles = fs.readdirSync(stateDir);
      for (const file of stateFiles) {
        if (file.endsWith(".json")) {
          // Path containment: reject directory-traversal filenames
          const resolved = path.resolve(stateDir, file);
          const rel = path.relative(stateDir, resolved);
          if (/^\.\.(?:[\\/]|$)/.test(rel) || rel === "") continue;
          const content = safeReadFile(resolved);
          if (content) {
            try {
              JSON.parse(content);
            } catch {
              stateValid = false;
              issues.push(`Invalid JSON in state file: ${file}`);
            }
          }
        }
      }
    }
  } catch {
    // State dir not accessible, that's ok
  }

  if (stateValid) {
    integrityPassing++;
  } else {
    findings.push({
      id: "DEA-411",
      category: "doc_optimizer_pipeline",
      domain: DOMAIN,
      severity: "warning",
      message: "Doc-optimizer state files contain invalid JSON",
      details: `Issues: ${issues.join("; ")}`,
      impactScore: 40,
      frequency: 1,
      blastRadius: 2,
    });
  }

  const integrityPct =
    integrityChecks > 0 ? Math.round((integrityPassing / integrityChecks) * 100) : 0;
  const result = scoreMetric(integrityPct, bench.integrity_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      integrityPct,
      integrityChecks,
      integrityPassing,
      skillExists,
      issues: issues.length,
    },
  };
}

// ── Category 13: Pre-commit Doc Checks ────────────────────────────────────

function checkPrecommitDocChecks(rootDir, findings) {
  const bench = BENCHMARKS.precommit_doc_checks;

  const preCommitPath = path.join(rootDir, ".husky", "pre-commit");
  const preCommitContent = safeReadFile(preCommitPath);

  if (!preCommitContent) {
    findings.push({
      id: "DEA-420",
      category: "precommit_doc_checks",
      domain: DOMAIN,
      severity: "warning",
      message: "Pre-commit hook file not found at .husky/pre-commit",
      details: "Cannot verify documentation-related pre-commit checks.",
      impactScore: 60,
      frequency: 1,
      blastRadius: 4,
    });
    return {
      score: 0,
      rating: "poor",
      metrics: { presentPct: 0, expectedChecks: 0, foundChecks: 0 },
    };
  }

  // Expected doc-related checks in pre-commit
  const expectedChecks = [
    {
      name: "doc-header",
      pattern: /doc.header|check-doc-headers/i,
      label: "Document header validation",
    },
    {
      name: "cross-doc",
      pattern: /cross.doc|check-cross-doc-deps/i,
      label: "Cross-document dependency check",
    },
    {
      name: "doc-index",
      pattern: /doc.index|docs:index|DOCUMENTATION_INDEX/i,
      label: "Documentation index update",
    },
  ];

  let foundCount = 0;
  const missing = [];

  for (const check of expectedChecks) {
    if (check.pattern.test(preCommitContent)) {
      foundCount++;
    } else {
      missing.push(check);
    }
  }

  const presentPct =
    expectedChecks.length > 0 ? Math.round((foundCount / expectedChecks.length) * 100) : 100;
  const result = scoreMetric(presentPct, bench.present_pct, "higher-is-better");

  if (missing.length > 0) {
    const labels = missing.map((m) => m.label).join(", ");
    findings.push({
      id: "DEA-421",
      category: "precommit_doc_checks",
      domain: DOMAIN,
      severity: "warning",
      message: `${missing.length} expected doc check(s) missing from pre-commit hook`,
      details: `Missing: ${labels}. These checks help maintain documentation quality on every commit.`,
      impactScore: 50,
      frequency: missing.length,
      blastRadius: 3,
      patchType: "fix_pipeline",
      patchTarget: ".husky/pre-commit",
      patchContent: `Add missing doc checks: ${labels}`,
      patchImpact: "Ensure documentation quality gates are in the commit pipeline",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      presentPct,
      expectedChecks: expectedChecks.length,
      foundChecks: foundCount,
      missing: missing.length,
    },
  };
}

// ── Utilities ──────────────────────────────────────────────────────────────

function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

module.exports = { run, DOMAIN };
