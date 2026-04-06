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

function isSkippableScript(rel) {
  return (
    rel.includes("__tests__/") ||
    rel.includes("/test/") ||
    rel.endsWith(".test.js") ||
    rel.includes("/dist/")
  );
}

function scanScripts(graph) {
  const findings = [];
  const allFiles = walkDir(path.join(ROOT, "scripts"), [".js", ".mjs", ".cjs"]);
  const pkgScriptRefs = getPkgScriptReferencedFiles();

  for (const file of allFiles) {
    const rel = path.relative(ROOT, file).replaceAll("\\", "/");
    if (isSkippableScript(rel)) continue;
    if (graph.get(file)?.size > 0 || pkgScriptRefs.has(file) || isInHookConfig(rel)) continue;

    const isArchive = rel.includes("/archive/");
    findings.push({
      file: rel,
      category: "scripts",
      confidence: isArchive ? "HIGH" : "MEDIUM",
      proposedAction: isArchive ? "delete" : "review",
      reason: isArchive
        ? "In archive/ with no references"
        : "No incoming references from other scripts, package.json, or hooks",
      references: [],
    });
  }

  for (const { name, target } of findDeadNpmScripts()) {
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

function isContainedPath(scriptPath) {
  try {
    validatePathInDir(ROOT, scriptPath);
    return true;
  } catch {
    return false;
  }
}

function findDeadWorkflowRefs(content, workflowRel) {
  const findings = [];
  const scriptRe = /(?:node|npx)\s+(scripts\/[^\s;|&"']+)/g;
  let m;
  while ((m = scriptRe.exec(content)) !== null) {
    const scriptPath = m[1].trim();
    if (!isContainedPath(scriptPath)) continue;
    try {
      fs.statSync(path.resolve(ROOT, scriptPath));
    } catch {
      findings.push({
        file: scriptPath,
        category: "workflows",
        confidence: "HIGH",
        proposedAction: "wire-up",
        reason: `Referenced in ${workflowRel} but file does not exist`,
        references: [workflowRel],
      });
    }
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
    const safeFile = validatePathInDir(wfDir, file);
    const absFile = path.join(wfDir, safeFile);
    const rel = `.github/workflows/${safeFile}`;
    let content;
    try {
      content = fs.readFileSync(absFile, "utf8");
    } catch {
      continue;
    }

    findings.push(...findDeadWorkflowRefs(content, rel));

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

function scanHookSubdir(graph, hooksDir, subdir) {
  const findings = [];
  const subdirPath = path.join(hooksDir, subdir);
  let subFiles;
  try {
    subFiles = fs.readdirSync(subdirPath).filter((f) => f.endsWith(".js"));
  } catch {
    return findings;
  }
  const isBackup = subdir === "backup";
  for (const file of subFiles) {
    const safeFile = validatePathInDir(subdirPath, file);
    const absFile = path.join(subdirPath, safeFile);
    if (graph.get(absFile)?.size > 0) continue;

    findings.push({
      file: `.claude/hooks/${subdir}/${safeFile}`,
      category: "hooks",
      confidence: isBackup ? "HIGH" : "MEDIUM",
      proposedAction: isBackup ? "delete" : "review",
      reason: isBackup
        ? "Backup hook file with no references"
        : "Hook lib utility not imported by any handler",
      references: [],
    });
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

  const registeredHandlers = getRegisteredHookHandlers();

  for (const handler of allHandlers) {
    if (registeredHandlers.has(handler)) continue;
    const absFile = path.join(hooksDir, handler);
    if (graph.get(absFile)?.size > 0) continue;

    findings.push({
      file: `.claude/hooks/${handler}`,
      category: "hooks",
      confidence: "MEDIUM",
      proposedAction: "review",
      reason:
        "Hook handler not registered in settings.json and not imported by any registered handler",
      references: [],
    });
  }

  for (const subdir of ["lib", "backup"]) {
    findings.push(...scanHookSubdir(graph, hooksDir, subdir));
  }

  return findings;
}

function collectBasenameRefs(searchDirs, entries) {
  const found = new Set();
  const fileEntries = entries.filter((e) => !e.isDirectory());
  for (const dir of searchDirs) {
    const files = walkDir(dir, [".js", ".mjs", ".md"]);
    for (const file of files) {
      let content;
      try {
        content = fs.readFileSync(file, "utf8");
      } catch {
        continue;
      }
      for (const entry of fileEntries) {
        if (content.includes(entry.name)) found.add(entry.name);
      }
    }
  }
  return found;
}

const STATE_WELL_KNOWN = new Set([
  "reviews.jsonl",
  "consolidation.json",
  "learning-routes.jsonl",
  "review-metrics.jsonl",
  "commit-log.jsonl",
  "hook-runs.jsonl",
  "hook-warnings-log.jsonl",
  "agent-invocations.jsonl",
]);

const SESSION_STATE_PREFIXES = ["deep-plan.", "deep-research.", "brainstorm."];

function scanStateFiles() {
  const findings = [];
  const stateDir = path.join(ROOT, ".claude", "state");
  let files;
  try {
    files = fs.readdirSync(stateDir, { withFileTypes: true });
  } catch {
    return findings;
  }

  const referencedBasenames = collectBasenameRefs(
    [
      path.join(ROOT, "scripts"),
      path.join(ROOT, ".claude", "hooks"),
      path.join(ROOT, ".claude", "skills"),
    ],
    files
  );

  for (const entry of files) {
    if (entry.isDirectory()) continue;
    const name = entry.name;
    if (STATE_WELL_KNOWN.has(name) || referencedBasenames.has(name)) continue;

    const isSessionState = SESSION_STATE_PREFIXES.some((p) => name.startsWith(p));
    findings.push({
      file: `.claude/state/${name}`,
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
      const rel = path.relative(ROOT, absFile).replaceAll("\\", "/");
      const agentName = file.replace(".md", "");

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
    const rel = path.relative(ROOT, file).replaceAll("\\", "/");

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

function findTodoMatch(todos, dirName) {
  const term = dirName.replaceAll("-", " ");
  return todos.find(
    (t) => t.title?.toLowerCase().includes(term) || t.description?.toLowerCase().includes(term)
  );
}

function isTodoCompleted(todo) {
  return todo?.status === "completed" || todo?.status === "archived";
}

function hasGraphRef(graph, baseDir, dirName) {
  return (
    graph.get(`ref:${baseDir}/${dirName}/`)?.size > 0 ||
    graph.get(`ref:${baseDir}/${dirName}`)?.size > 0
  );
}

function scanDirWithTodos(graph, baseDir, category, completedReason, defaultReason) {
  let dirs;
  try {
    dirs = fs
      .readdirSync(path.join(ROOT, baseDir), { withFileTypes: true })
      .filter((d) => d.isDirectory());
  } catch {
    return [];
  }

  const todos = loadTodos();
  const findings = [];
  for (const dir of dirs) {
    const todo = findTodoMatch(todos, dir.name);
    if (todo && !isTodoCompleted(todo)) continue;
    if (hasGraphRef(graph, baseDir, dir.name)) continue;

    const completed = isTodoCompleted(todo);
    findings.push({
      file: `${baseDir}/${dir.name}/`,
      category,
      confidence: completed ? "MEDIUM" : "LOW",
      proposedAction: completed ? "archive" : "review",
      reason: completed ? completedReason : defaultReason,
      references: todo ? [`todo:${todo.id}`] : [],
    });
  }
  return findings;
}

function scanPlanning(graph) {
  return scanDirWithTodos(
    graph,
    ".planning",
    "planning",
    "Planning directory for completed todo, no active references",
    "Planning directory with no matching todo and no active references"
  );
}

function scanResearch(graph) {
  return scanDirWithTodos(
    graph,
    ".research",
    "research",
    "Research directory for completed initiative, no active references",
    "Research directory with no matching todo and no active references"
  );
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

  const diffKey = (f) => `${f.category}:${f.file}`;
  const prevSet = new Set(previousFindings.map(diffKey));
  const currSet = new Set(findings.map(diffKey));

  let newCount = 0;
  let unchanged = 0;
  for (const f of findings) {
    if (prevSet.has(diffKey(f))) {
      f.diffStatus = "UNCHANGED";
      unchanged++;
    } else {
      f.diffStatus = "NEW";
      newCount++;
    }
  }

  const resolved = previousFindings.filter((f) => !currSet.has(diffKey(f))).length;
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
          fs.statSync(abs);
        } catch {
          dead.push({ name, target });
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
