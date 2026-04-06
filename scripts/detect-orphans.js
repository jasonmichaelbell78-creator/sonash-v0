#!/usr/bin/env node
/**
 * Orphan Detection Scanner
 *
 * Builds a cross-format reference graph (JS imports, Markdown links, JSON configs,
 * YAML workflows) and identifies files with zero incoming references across 9 categories.
 *
 * Usage: node scripts/detect-orphans.js [--category=NAME] [--verbose]
 *
 * Output: .planning/orphan-detection/findings.jsonl + summary to stdout
 *
 * See: .planning/orphan-detection/DECISIONS.md for design rationale
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { buildGraph, walkDir, resolveAsFilePath, ROOT } = require("./lib/reference-graph.js");
const { sanitizeError } = require("./lib/sanitize-error.js");
const { validatePathInDir } = require("./lib/security-helpers.js");
const { safeWriteFileSync } = require("./lib/safe-fs.js");

const FINDINGS_PATH = path.join(ROOT, ".planning", "orphan-detection", "findings.jsonl");
const TODOS_PATH = path.join(ROOT, ".planning", "todos.jsonl");

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const categoryFilter = args.find((a) => a.startsWith("--category="))?.split("=")[1] || null;

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Orphan Detection Scanner ===\n");

  const graph = buildGraph();
  const findings = [];

  const scanners = [
    { name: "scripts", fn: scanScripts },
    { name: "workflows", fn: scanWorkflows },
    { name: "hooks", fn: scanHooks },
    { name: "state-files", fn: scanStateFiles },
    { name: "agents", fn: scanAgents },
    { name: "skills", fn: scanSkills },
    { name: "docs", fn: scanDocs },
    { name: "planning", fn: scanPlanning },
    { name: "research", fn: scanResearch },
  ];

  for (const { name, fn } of scanners) {
    if (categoryFilter && name !== categoryFilter) continue;
    console.log(`\nScanning: ${name}...`);
    try {
      const results = fn(graph);
      // Add git recency to each finding
      for (const r of results) {
        Object.assign(r, getGitRecency(r.file));
        adjustConfidenceByRecency(r);
      }
      findings.push(...results);
      console.log(`  Found ${results.length} orphan candidates`);
    } catch (err) {
      console.error(`  ERROR in ${name}: ${sanitizeError(err)}`);
    }
  }

  // Incremental diff
  const diffStats = applyDiff(findings);

  // Write findings
  writeFindingsJsonl(findings);

  // Summary
  console.log("\n=== Summary ===");
  console.log(`Total findings: ${findings.length}`);
  const byCategory = {};
  const byConfidence = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const f of findings) {
    byCategory[f.category] = (byCategory[f.category] || 0) + 1;
    byConfidence[f.confidence] = (byConfidence[f.confidence] || 0) + 1;
  }
  console.log("By category:", JSON.stringify(byCategory));
  console.log("By confidence:", JSON.stringify(byConfidence));
  if (diffStats) {
    console.log(
      `Diff: ${diffStats.new} new, ${diffStats.resolved} resolved, ${diffStats.unchanged} unchanged`
    );
  }
  console.log(`\nFindings written to: ${path.relative(ROOT, FINDINGS_PATH)}`);
  console.log("Run 'npm run orphans:report' to generate Markdown report.");
}

// ── Category Scanners ────────────────────────────────────────────────────────

function scanScripts(graph) {
  const findings = [];
  const scriptsDir = path.join(ROOT, "scripts");
  const allFiles = walkDir(scriptsDir, ".js");

  // Load package.json scripts for cross-check
  const pkgScriptRefs = getPkgScriptReferencedFiles();

  for (const file of allFiles) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    // Skip test files for orphan detection (tests reference source, not vice versa)
    if (rel.includes("__tests__/") || rel.includes("/test/") || rel.endsWith(".test.js")) continue;
    // Skip dist directories
    if (rel.includes("/dist/")) continue;

    const incomingEdges = graph.get(file);
    const inPkgScripts = pkgScriptRefs.has(file);
    const inHookConfig = isInHookConfig(rel);

    if (incomingEdges?.size > 0 || inPkgScripts || inHookConfig) continue;

    // This file has no incoming references
    const isArchive = rel.includes("/archive/");
    let confidence = isArchive ? "HIGH" : "MEDIUM";
    const proposedAction = isArchive ? "delete" : "review";
    const reason = isArchive
      ? "In archive/ with no references"
      : "No incoming references from other scripts, package.json, or hooks";

    findings.push({
      file: rel,
      category: "scripts",
      confidence,
      proposedAction,
      reason,
      references: [],
    });
  }

  // Sub-check: dead npm scripts (reference files that don't exist)
  const deadNpmScripts = findDeadNpmScripts();
  for (const { name, target } of deadNpmScripts) {
    findings.push({
      file: target,
      category: "scripts",
      confidence: "HIGH",
      proposedAction: "wire-up",
      reason: `npm script "${name}" references non-existent file`,
      references: ["package.json"],
    });
  }

  return findings;
}

function scanWorkflows(graph) {
  const findings = [];
  const wfDir = path.join(ROOT, ".github", "workflows");
  let files;
  try {
    files = fs.readdirSync(wfDir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
  } catch {
    return findings;
  }

  for (const file of files) {
    const safeFile = validatePathInDir(wfDir, file); // containment check
    const absFile = path.join(wfDir, safeFile);
    const rel = `.github/workflows/${safeFile}`;
    let content;
    try {
      content = fs.readFileSync(absFile, "utf8");
    } catch {
      continue;
    }

    // Check for dead script references in run: steps
    const scriptRe = /(?:node|npx)\s+(scripts\/[^\s;|&"']+)/g;
    let m;
    while ((m = scriptRe.exec(content)) !== null) {
      const scriptPath = m[1].trim();
      const absScript = path.resolve(ROOT, scriptPath);
      try {
        if (!fs.existsSync(absScript)) {
          findings.push({
            file: scriptPath,
            category: "workflows",
            confidence: "HIGH",
            proposedAction: "wire-up",
            reason: `Referenced in ${rel} but file does not exist`,
            references: [rel],
          });
        }
      } catch {
        // existsSync race — skip
      }
    }

    // Check if workflow has no triggers (disabled)
    if (!content.includes("on:")) {
      findings.push({
        file: rel,
        category: "workflows",
        confidence: "MEDIUM",
        proposedAction: "review",
        reason: "Workflow has no trigger events",
        references: [],
      });
    }
  }

  return findings;
}

function scanHooks(graph) {
  const findings = [];
  const hooksDir = path.join(ROOT, ".claude", "hooks");
  let allHandlers;
  try {
    allHandlers = fs.readdirSync(hooksDir).filter((f) => f.endsWith(".js"));
  } catch {
    return findings;
  }

  // Get registered hooks from settings.json
  const registeredHandlers = getRegisteredHookHandlers();

  for (const handler of allHandlers) {
    const rel = `.claude/hooks/${handler}`;
    const isRegistered = registeredHandlers.has(handler);

    if (isRegistered) continue;

    // Check if imported by any registered handler
    const absFile = path.join(hooksDir, handler);
    const incomingEdges = graph.get(absFile);
    if (incomingEdges?.size > 0) continue;

    findings.push({
      file: rel,
      category: "hooks",
      confidence: "MEDIUM",
      proposedAction: "review",
      reason:
        "Hook handler not registered in settings.json and not imported by any registered handler",
      references: [],
    });
  }

  // Also check lib/ and backup/ subdirectories
  for (const subdir of ["lib", "backup"]) {
    const subdirPath = path.join(hooksDir, subdir);
    let subFiles;
    try {
      subFiles = fs.readdirSync(subdirPath).filter((f) => f.endsWith(".js"));
    } catch {
      continue;
    }
    for (const file of subFiles) {
      const safeFile = validatePathInDir(subdirPath, file); // containment check
      const rel = `.claude/hooks/${subdir}/${safeFile}`;
      const absFile = path.join(subdirPath, safeFile);
      const incomingEdges = graph.get(absFile);
      if (incomingEdges?.size > 0) continue;

      const isBackup = subdir === "backup";
      findings.push({
        file: rel,
        category: "hooks",
        confidence: isBackup ? "HIGH" : "MEDIUM",
        proposedAction: isBackup ? "delete" : "review",
        reason: isBackup
          ? "Backup hook file with no references"
          : "Hook lib utility not imported by any handler",
        references: [],
      });
    }
  }

  return findings;
}

function scanStateFiles(graph) {
  const findings = [];
  const stateDir = path.join(ROOT, ".claude", "state");
  let files;
  try {
    files = fs.readdirSync(stateDir, { withFileTypes: true });
  } catch {
    return findings;
  }

  // Well-known operational files that are always active
  const wellKnown = new Set([
    "reviews.jsonl",
    "consolidation.json",
    "learning-routes.jsonl",
    "review-metrics.jsonl",
    "commit-log.jsonl",
    "hook-runs.jsonl",
    "hook-warnings-log.jsonl",
    "agent-invocations.jsonl",
  ]);

  // Scan all scripts for state file basename references
  const scriptsDir = path.join(ROOT, "scripts");
  const allScripts = walkDir(scriptsDir, ".js");
  const hooksScripts = walkDir(path.join(ROOT, ".claude", "hooks"), ".js");
  const allScannable = [...allScripts, ...hooksScripts];

  const referencedBasenames = new Set();
  for (const scriptFile of allScannable) {
    let content;
    try {
      content = fs.readFileSync(scriptFile, "utf8");
    } catch {
      continue;
    }
    for (const entry of files) {
      if (entry.isDirectory()) continue;
      if (content.includes(entry.name)) {
        referencedBasenames.add(entry.name);
      }
    }
  }

  // Also check skill .md files for state file references
  const skillMds = walkDir(path.join(ROOT, ".claude", "skills"), ".md");
  for (const mdFile of skillMds) {
    let content;
    try {
      content = fs.readFileSync(mdFile, "utf8");
    } catch {
      continue;
    }
    for (const entry of files) {
      if (entry.isDirectory()) continue;
      if (content.includes(entry.name)) {
        referencedBasenames.add(entry.name);
      }
    }
  }

  for (const entry of files) {
    if (entry.isDirectory()) continue;
    const name = entry.name;
    const rel = `.claude/state/${name}`;

    if (wellKnown.has(name)) continue;
    if (referencedBasenames.has(name)) continue;

    // Check if it's a session state file (deep-plan, brainstorm, etc.)
    const isSessionState =
      name.startsWith("deep-plan.") ||
      name.startsWith("deep-research.") ||
      name.startsWith("brainstorm.");

    findings.push({
      file: rel,
      category: "state-files",
      confidence: "MEDIUM",
      proposedAction: isSessionState ? "delete" : "review",
      reason: isSessionState
        ? "Session state file not referenced by any script or skill"
        : "State file not referenced by any script, hook, or skill",
      references: [],
    });
  }

  return findings;
}

function scanAgents(graph) {
  const findings = [];
  const agentDirs = [
    path.join(ROOT, ".claude", "agents"),
    path.join(ROOT, ".claude", "agents", "global"),
  ];

  for (const agentDir of agentDirs) {
    let files;
    try {
      files = fs.readdirSync(agentDir).filter((f) => f.endsWith(".md"));
    } catch {
      continue;
    }

    for (const file of files) {
      const absFile = path.join(agentDir, file);
      const rel = path.relative(ROOT, absFile).replace(/\\/g, "/");
      const agentName = file.replace(/\.md$/, "");

      // Check for references: file path references + name-based references
      const fileRefs = graph.get(absFile);
      const nameRefs = graph.get(`ref:${agentName}`);
      const hasFileRef = fileRefs?.size > 0;
      const hasNameRef = nameRefs?.size > 0;

      if (hasFileRef || hasNameRef) continue;

      // Also check CLAUDE.md directly for agent name
      let claudeMd = "";
      try {
        claudeMd = fs.readFileSync(path.join(ROOT, "CLAUDE.md"), "utf8");
      } catch {
        // skip
      }
      if (claudeMd.includes(agentName)) continue;

      findings.push({
        file: rel,
        category: "agents",
        confidence: "MEDIUM",
        proposedAction: "review",
        reason: "Agent not referenced by any skill, other agent, or CLAUDE.md",
        references: [],
      });
    }
  }

  return findings;
}

function scanSkills(graph) {
  const findings = [];
  const skillsDir = path.join(ROOT, ".claude", "skills");
  let dirs;
  try {
    dirs = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  } catch {
    return findings;
  }

  const ignoreDirs = new Set(["_shared", "_templates"]);

  // Read CLAUDE.md once
  let claudeMd = "";
  try {
    claudeMd = fs.readFileSync(path.join(ROOT, "CLAUDE.md"), "utf8");
  } catch {
    // skip
  }

  for (const dir of dirs) {
    if (ignoreDirs.has(dir.name)) continue;
    const skillName = dir.name;
    const rel = `.claude/skills/${skillName}/`;

    // Check for slash-command references: /skill-name
    const slashRef = graph.get(`ref:${skillName}`);
    if (slashRef?.size > 0) continue;

    // Check CLAUDE.md
    if (claudeMd.includes(skillName)) continue;

    // Check if any other skill references this one via file path
    const skillMdPath = path.join(skillsDir, skillName, "SKILL.md");
    const fileRefs = graph.get(path.resolve(skillMdPath));
    if (fileRefs?.size > 0) continue;

    findings.push({
      file: rel,
      category: "skills",
      confidence: "MEDIUM",
      proposedAction: "review",
      reason: "Skill not referenced by other skills, agents, or CLAUDE.md",
      references: [],
    });
  }

  return findings;
}

function scanDocs(graph) {
  const findings = [];
  const docsDir = path.join(ROOT, "docs");
  const allFiles = walkDir(docsDir, ".md");

  for (const file of allFiles) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");

    // Check for incoming references (markdown links, skill refs, CLAUDE.md)
    const fileRefs = graph.get(file);
    if (fileRefs?.size > 0) continue;

    // Check if basename is referenced anywhere
    const basename = path.basename(file);
    const basenameRef = graph.get(`ref:${basename}`);
    if (basenameRef?.size > 0) continue;

    findings.push({
      file: rel,
      category: "docs",
      confidence: "MEDIUM",
      proposedAction: "review",
      reason: "Document not referenced by any other file",
      references: [],
    });
  }

  return findings;
}

function scanPlanning(graph) {
  const findings = [];
  const planDir = path.join(ROOT, ".planning");
  let dirs;
  try {
    dirs = fs.readdirSync(planDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  } catch {
    return findings;
  }

  const todos = loadTodos();

  for (const dir of dirs) {
    const dirName = dir.name;
    const rel = `.planning/${dirName}/`;

    const matchingTodo = todos.find(
      (t) =>
        t.title?.toLowerCase().includes(dirName.replace(/-/g, " ")) ||
        t.description?.toLowerCase().includes(dirName.replace(/-/g, " "))
    );

    const todoCompleted =
      matchingTodo?.status === "completed" || matchingTodo?.status === "archived";
    const todoAbsent = !matchingTodo;

    if (!todoCompleted && !todoAbsent) continue; // Active todo — not orphaned

    // Check if any active skill or plan references this directory
    const dirRef = graph.get(`ref:${rel}`) || graph.get(`ref:.planning/${dirName}`);
    if (dirRef?.size > 0) continue;

    findings.push({
      file: rel,
      category: "planning",
      confidence: todoCompleted ? "MEDIUM" : "LOW",
      proposedAction: todoCompleted ? "archive" : "review",
      reason: todoCompleted
        ? "Planning directory for completed todo, no active references"
        : "Planning directory with no matching todo and no active references",
      references: matchingTodo ? [`todo:${matchingTodo.id}`] : [],
    });
  }

  return findings;
}

function scanResearch(graph) {
  const findings = [];
  const researchDir = path.join(ROOT, ".research");
  let dirs;
  try {
    dirs = fs.readdirSync(researchDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  } catch {
    return findings;
  }

  const todos = loadTodos();

  for (const dir of dirs) {
    const dirName = dir.name;
    const rel = `.research/${dirName}/`;

    const matchingTodo = todos.find(
      (t) =>
        t.title?.toLowerCase().includes(dirName.replace(/-/g, " ")) ||
        t.description?.toLowerCase().includes(dirName.replace(/-/g, " "))
    );

    const todoCompleted =
      matchingTodo?.status === "completed" || matchingTodo?.status === "archived";
    const todoAbsent = !matchingTodo;

    if (!todoCompleted && !todoAbsent) continue;

    const dirRef = graph.get(`ref:${rel}`) || graph.get(`ref:.research/${dirName}`);
    if (dirRef?.size > 0) continue;

    findings.push({
      file: rel,
      category: "research",
      confidence: todoCompleted ? "MEDIUM" : "LOW",
      proposedAction: todoCompleted ? "archive" : "review",
      reason: todoCompleted
        ? "Research directory for completed initiative, no active references"
        : "Research directory with no matching todo and no active references",
      references: matchingTodo ? [`todo:${matchingTodo.id}`] : [],
    });
  }

  return findings;
}

// ── Git Recency ──────────────────────────────────────────────────────────────

function getGitRecency(filePath) {
  try {
    const stdout = execFileSync("git", ["log", "-1", "--format=%aI", "--", filePath], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 5000,
    }).trim();
    if (!stdout) return { lastModified: null, daysSinceModified: null };
    const lastDate = new Date(stdout);
    const days = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return { lastModified: stdout, daysSinceModified: days };
  } catch {
    return { lastModified: null, daysSinceModified: null };
  }
}

function adjustConfidenceByRecency(finding) {
  const days = finding.daysSinceModified;
  if (days === null) return;
  if (days > 90 && finding.confidence === "MEDIUM") {
    finding.confidence = "HIGH";
    finding.reason += " (no git activity in 90+ days)";
  } else if (days < 30 && finding.confidence === "HIGH") {
    finding.confidence = "MEDIUM";
    finding.reason += " (recent git activity)";
  }
}

// ── Incremental Diff ─────────────────────────────────────────────────────────

function applyDiff(findings) {
  let previousFindings;
  try {
    const raw = fs.readFileSync(FINDINGS_PATH, "utf8");
    previousFindings = raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l));
  } catch {
    for (const f of findings) f.diffStatus = "NEW";
    return null;
  }

  const prevSet = new Set(previousFindings.map((f) => f.file));
  const currSet = new Set(findings.map((f) => f.file));

  let newCount = 0;
  let unchanged = 0;
  for (const f of findings) {
    if (prevSet.has(f.file)) {
      f.diffStatus = "UNCHANGED";
      unchanged++;
    } else {
      f.diffStatus = "NEW";
      newCount++;
    }
  }

  const resolved = previousFindings.filter((f) => !currSet.has(f.file)).length;
  return { new: newCount, resolved, unchanged };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getPkgScriptReferencedFiles() {
  const referenced = new Set();
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    const scripts = pkg.scripts || {};
    const scriptPathRe = /(?:node|npx)\s+(scripts\/[^\s;|&"']+)/g;
    for (const val of Object.values(scripts)) {
      let m;
      scriptPathRe.lastIndex = 0;
      while ((m = scriptPathRe.exec(val)) !== null) {
        const abs = path.resolve(ROOT, m[1]);
        referenced.add(abs);
      }
    }
  } catch {
    // skip
  }
  return referenced;
}

function findDeadNpmScripts() {
  const dead = [];
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    const scripts = pkg.scripts || {};
    const scriptPathRe = /(?:node|npx)\s+(scripts\/[^\s;|&"']+)/g;
    for (const [name, val] of Object.entries(scripts)) {
      let m;
      scriptPathRe.lastIndex = 0;
      while ((m = scriptPathRe.exec(val)) !== null) {
        const target = m[1];
        const abs = path.resolve(ROOT, target);
        try {
          if (!fs.existsSync(abs)) {
            dead.push({ name, target });
          }
        } catch {
          // existsSync race — skip
        }
      }
    }
  } catch {
    // skip
  }
  return dead;
}

function isInHookConfig(relPath) {
  try {
    const settings = JSON.parse(
      fs.readFileSync(path.join(ROOT, ".claude", "settings.json"), "utf8")
    );
    const str = JSON.stringify(settings);
    return str.includes(relPath) || str.includes(path.basename(relPath));
  } catch {
    return false;
  }
}

function getRegisteredHookHandlers() {
  const handlers = new Set();
  try {
    const settings = JSON.parse(
      fs.readFileSync(path.join(ROOT, ".claude", "settings.json"), "utf8")
    );
    const str = JSON.stringify(settings);
    const re = /\.claude\/hooks\/([^"'\s]+\.js)/g;
    let m;
    while ((m = re.exec(str)) !== null) {
      handlers.add(path.basename(m[1]));
    }
  } catch {
    // skip
  }
  return handlers;
}

function loadTodos() {
  try {
    const raw = fs.readFileSync(TODOS_PATH, "utf8");
    return raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function writeFindingsJsonl(findings) {
  const dir = path.dirname(FINDINGS_PATH);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // exists
  }
  const lines = findings.map((f) => JSON.stringify(f)).join("\n");
  safeWriteFileSync(FINDINGS_PATH, lines + "\n", { allowOverwrite: true });
}

main().catch((err) => {
  console.error(`Fatal: ${sanitizeError(err)}`);
  process.exit(2);
});
