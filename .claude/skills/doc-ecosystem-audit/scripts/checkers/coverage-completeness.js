/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Coverage & Completeness Checker — Domain 5 (D5)
 *
 * 14. Documentation Coverage
 * 15. Agent Doc References
 * 16. README & Onboarding
 */

"use strict";

/* eslint-disable no-unused-vars -- safeRequire is a safety wrapper */
function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[coverage-completeness] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "coverage_completeness";

/** Max file size for safe reads (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Run all coverage & completeness checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  // ── Category 14: Documentation Coverage ─────────────────────────────────
  scores.documentation_coverage = checkDocumentationCoverage(rootDir, findings);

  // ── Category 15: Agent Doc References ───────────────────────────────────
  scores.agent_doc_references = checkAgentDocReferences(rootDir, findings);

  // ── Category 16: README & Onboarding ────────────────────────────────────
  scores.readme_onboarding = checkReadmeOnboarding(rootDir, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category 14: Documentation Coverage ───────────────────────────────────

function checkDocumentationCoverage(rootDir, findings) {
  const bench = BENCHMARKS.documentation_coverage;

  // Identify major systems from package.json scripts and directory structure
  const systems = identifyMajorSystems(rootDir);

  if (systems.length === 0) {
    return { score: 100, rating: "good", metrics: { coveragePct: 100, total: 0, covered: 0 } };
  }

  let covered = 0;
  const uncovered = [];

  // Collect all doc content for searching
  const allDocContent = collectAllDocContent(rootDir);

  for (const system of systems) {
    // Check if any documentation mentions this system
    const found = system.searchTerms.some((term) => {
      const t = String(term || "").toLowerCase();
      return t ? allDocContent.includes(t) : false;
    });
    if (found) {
      covered++;
    } else {
      uncovered.push(system);
    }
  }

  const coveragePct = systems.length > 0 ? Math.round((covered / systems.length) * 100) : 100;
  const result = scoreMetric(coveragePct, bench.coverage_pct, "higher-is-better");

  if (uncovered.length > 0) {
    const sample = uncovered
      .slice(0, 5)
      .map((s) => s.name)
      .join(", ");
    const extra = uncovered.length > 5 ? ` (+${uncovered.length - 5} more)` : "";
    findings.push({
      id: "DEA-500",
      category: "documentation_coverage",
      domain: DOMAIN,
      severity: uncovered.length > 3 ? "warning" : "info",
      message: `${uncovered.length} major system(s) lack documentation`,
      details: `Undocumented: ${sample}${extra}. These systems should have corresponding documentation.`,
      impactScore: uncovered.length > 3 ? 50 : 30,
      frequency: uncovered.length,
      blastRadius: 2,
      patchType: "add_documentation",
      patchTarget: "docs/",
      patchContent: `Create documentation for: ${sample}`,
      patchImpact: "Improve project documentation coverage",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: { coveragePct, total: systems.length, covered, uncovered: uncovered.length },
  };
}

// ── Category 15: Agent Doc References ─────────────────────────────────────

function checkAgentDocReferences(rootDir, findings) {
  const bench = BENCHMARKS.agent_doc_references;

  const claudeMdPath = path.join(rootDir, "CLAUDE.md");
  const claudeContent = safeReadFile(claudeMdPath);

  if (!claudeContent) {
    findings.push({
      id: "DEA-510",
      category: "agent_doc_references",
      domain: DOMAIN,
      severity: "error",
      message: "CLAUDE.md not found",
      details: "The main AI configuration file is missing. Cannot verify doc references.",
      impactScore: 90,
      frequency: 1,
      blastRadius: 5,
    });
    return { score: 0, rating: "poor", metrics: { validPct: 0, total: 0, valid: 0 } };
  }

  // Extract all document references from CLAUDE.md
  const linkPattern = /\[([^\]]*)\]\(([^)]+\.md[^)]*)\)/g;
  const refs = [];

  for (const match of claudeContent.matchAll(linkPattern)) {
    const linkPath = match[2].split("#")[0];
    if (linkPath.startsWith("http://") || linkPath.startsWith("https://")) continue;
    refs.push({ title: match[1], path: linkPath });
  }

  let valid = 0;
  const invalid = [];

  for (const ref of refs) {
    if (path.isAbsolute(ref.path)) {
      invalid.push(ref);
      continue;
    }

    const rootAbs = path.resolve(rootDir);
    const fullPath = path.resolve(rootAbs, ref.path);

    // Path containment guard
    const relToRoot = path.relative(rootAbs, fullPath);
    if (/^\.\.(?:[\\/]|$)/.test(relToRoot) || relToRoot === "") {
      invalid.push(ref);
      continue;
    }

    try {
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && stat.size > 0) {
        valid++;
      } else {
        invalid.push(ref);
      }
    } catch {
      invalid.push(ref);
    }
  }

  const total = refs.length;
  const validPct = total > 0 ? Math.round((valid / total) * 100) : 100;
  const result = scoreMetric(validPct, bench.valid_pct, "higher-is-better");

  if (invalid.length > 0) {
    const sample = invalid
      .slice(0, 5)
      .map((r) => `${r.title} -> ${r.path}`)
      .join("; ");
    const extra = invalid.length > 5 ? ` (+${invalid.length - 5} more)` : "";
    findings.push({
      id: "DEA-511",
      category: "agent_doc_references",
      domain: DOMAIN,
      severity: "error",
      message: `${invalid.length} broken doc reference(s) in CLAUDE.md`,
      details: `Broken: ${sample}${extra}. These referenced files are missing or empty.`,
      impactScore: 80,
      frequency: invalid.length,
      blastRadius: 4,
      patchType: "fix_link",
      patchTarget: "CLAUDE.md",
      patchContent: "Fix or remove broken document references",
      patchImpact: "Ensure AI agent can access all referenced documentation",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: { validPct, total, valid, invalid: invalid.length },
  };
}

// ── Category 16: README & Onboarding ──────────────────────────────────────

function checkReadmeOnboarding(rootDir, findings) {
  const bench = BENCHMARKS.readme_onboarding;

  let completenessChecks = 0;
  let completenessPassing = 0;
  const issues = [];

  // Check 1: README.md exists and has substance
  completenessChecks++;
  const readmePath = path.join(rootDir, "README.md");
  const readmeContent = safeReadFile(readmePath);
  if (readmeContent && readmeContent.length > 200) {
    completenessPassing++;
  } else {
    issues.push("README.md missing or too short");
    findings.push({
      id: "DEA-520",
      category: "readme_onboarding",
      domain: DOMAIN,
      severity: "error",
      message: "README.md is missing or too short for effective onboarding",
      details:
        "The root README should provide project overview, setup instructions, and key references.",
      impactScore: 70,
      frequency: 1,
      blastRadius: 4,
    });
  }

  // Check 2: CLAUDE.md exists
  completenessChecks++;
  const claudePath = path.join(rootDir, "CLAUDE.md");
  const claudeContent = safeReadFile(claudePath);
  if (claudeContent && claudeContent.length > 200) {
    completenessPassing++;
  } else {
    issues.push("CLAUDE.md missing or too short");
  }

  // Check 3: AI_WORKFLOW.md exists
  completenessChecks++;
  const workflowPath = path.join(rootDir, "AI_WORKFLOW.md");
  const workflowContent = safeReadFile(workflowPath);
  if (workflowContent && workflowContent.length > 100) {
    completenessPassing++;
  } else {
    issues.push("AI_WORKFLOW.md missing or too short");
    findings.push({
      id: "DEA-521",
      category: "readme_onboarding",
      domain: DOMAIN,
      severity: "warning",
      message: "AI_WORKFLOW.md missing or insufficient",
      details:
        "The AI workflow document should describe session startup, navigation, and context loading.",
      impactScore: 45,
      frequency: 1,
      blastRadius: 3,
    });
  }

  // Check 4: No contradictions between key docs (basic consistency check)
  completenessChecks++;
  let consistencyOk = true;
  if (readmeContent && claudeContent) {
    // Check if README mentions different stack versions than CLAUDE.md
    // This is a lightweight check - just verify both reference similar stack
    const readmeHasNext = /next\.?js/i.test(readmeContent);
    const claudeHasNext = /next\.?js/i.test(claudeContent);
    const readmeHasReact = /react/i.test(readmeContent);
    const claudeHasReact = /react/i.test(claudeContent);

    // Both should agree on major stack components
    if (readmeHasNext !== claudeHasNext || readmeHasReact !== claudeHasReact) {
      consistencyOk = false;
    }
  }
  if (consistencyOk) {
    completenessPassing++;
  } else {
    issues.push("Potential inconsistency between README.md and CLAUDE.md");
  }

  // Check 5: Getting started / setup section exists
  completenessChecks++;
  if (readmeContent) {
    const hasSetup = /getting started|setup|installation|quick start/i.test(readmeContent);
    if (hasSetup) {
      completenessPassing++;
    } else {
      issues.push("README.md missing getting started/setup section");
      findings.push({
        id: "DEA-522",
        category: "readme_onboarding",
        domain: DOMAIN,
        severity: "info",
        message: "README.md is missing a Getting Started or Setup section",
        details: "New contributors need clear setup instructions.",
        impactScore: 30,
        frequency: 1,
        blastRadius: 2,
      });
    }
  }

  const completenessPct =
    completenessChecks > 0 ? Math.round((completenessPassing / completenessChecks) * 100) : 0;
  const result = scoreMetric(completenessPct, bench.completeness_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { completenessPct, completenessChecks, completenessPassing, issues: issues.length },
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

/**
 * Identify major systems from package.json and directory structure.
 */
function identifyMajorSystems(rootDir) {
  const systems = [];

  // From package.json scripts
  const pkgPath = path.join(rootDir, "package.json");
  const pkgContent = safeReadFile(pkgPath);
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      const scripts = pkg.scripts || {};

      // Group script prefixes as systems
      const prefixes = new Map();
      for (const scriptName of Object.keys(scripts)) {
        const prefix = scriptName.split(":")[0];
        if (!prefixes.has(prefix)) {
          prefixes.set(prefix, []);
        }
        prefixes.get(prefix).push(scriptName);
      }

      // Systems with 2+ scripts are "major"
      for (const [prefix, scriptNames] of prefixes) {
        if (scriptNames.length >= 2 && prefix !== "pre" && prefix !== "post") {
          systems.push({
            name: `${prefix} scripts`,
            searchTerms: [prefix, ...scriptNames],
          });
        }
      }
    } catch {
      // Invalid JSON
    }
  }

  // From major directories
  const majorDirs = [
    { dir: "src", name: "Application source", searchTerms: ["src/", "source code", "app/"] },
    {
      dir: "functions",
      name: "Cloud Functions",
      searchTerms: ["functions/", "cloud function", "httpsCallable"],
    },
    { dir: "scripts", name: "Build scripts", searchTerms: ["scripts/", "build script", "npm run"] },
    { dir: ".husky", name: "Git hooks (Husky)", searchTerms: [".husky", "pre-commit", "husky"] },
    {
      dir: ".claude",
      name: "Claude AI config",
      searchTerms: [".claude/", "claude code", "hooks/"],
    },
  ];

  for (const majorDir of majorDirs) {
    try {
      const dirPath = path.join(rootDir, majorDir.dir);
      const stat = fs.statSync(dirPath);
      if (stat.isDirectory()) {
        systems.push(majorDir);
      }
    } catch {
      // Directory doesn't exist
    }
  }

  return systems;
}

/**
 * Collect all doc content into a single searchable string (lowercase).
 */
function collectAllDocContent(rootDir) {
  const chunks = [];

  // Root .md files
  try {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const content = safeReadFile(path.join(rootDir, entry.name));
        if (content) chunks.push(content.toLowerCase());
      }
    }
  } catch {
    // Not accessible
  }

  // docs/ recursive
  function walkDir(dir) {
    try {
      // Path containment: ensure dir is inside rootDir
      const rel = path.relative(rootDir, dir);
      if (/^\.\.(?:[\\/]|$)/.test(rel)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name[0] === "." || entry.name === "node_modules") continue;
        if (entry.isDirectory()) {
          walkDir(path.join(dir, entry.name));
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          const content = safeReadFile(path.join(dir, entry.name));
          if (content) chunks.push(content.toLowerCase());
        }
      }
    } catch {
      // Not accessible
    }
  }

  const docsDir = path.join(rootDir, "docs");
  try {
    if (fs.existsSync(docsDir)) {
      walkDir(docsDir);
    }
  } catch {
    // Not accessible
  }

  return chunks.join("\n");
}

module.exports = { run, DOMAIN };
