#!/usr/bin/env node
/* eslint-disable no-undef */
// @ts-check
"use strict";

/**
 * Generate test registry — scans for all 8 validation source types
 * and outputs data/ecosystem-v2/test-registry.jsonl
 *
 * Source types:
 *   test_file        — .test.js/.test.ts/.property.test.js files
 *   audit_checker    — ecosystem audit checker scripts
 *   test_protocol    — .protocol.json files for UI test suites
 *   skill_command    — skill SKILL.md files (invocable skills)
 *   npm_validator    — npm scripts that validate/check/lint
 *   gate_check       — CI workflow steps that enforce quality
 *   ci_step          — CI workflow steps (all)
 *   health_checker   — health monitoring checker scripts
 *
 * Usage: node scripts/generate-test-registry.js
 */

const fs = require("node:fs");
const path = require("node:path");

let sanitizeError;
try {
  ({ sanitizeError } = require("./lib/sanitize-error"));
} catch {
  sanitizeError = (err) => (err instanceof Error ? err.message : String(err)).slice(0, 200);
}

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "data", "ecosystem-v2", "test-registry.jsonl");

/** @typedef {{ path: string, source_type: string, type: string, owner: string, target: string, description: string }} RegistryEntry */

/** @returns {RegistryEntry[]} */
function scanTestFiles() {
  const entries = [];
  const patterns = [
    { dir: "scripts/health/checkers/__tests__", owner: "health", type: "unit" },
    { dir: "scripts/health/lib/__tests__", owner: "health", type: "unit" },
    { dir: "tests/hooks", owner: "hooks", type: "unit" },
    { dir: "tests/hooks/lib", owner: "hooks", type: "unit" },
    { dir: "tests/hooks/global", owner: "hooks", type: "unit" },
    { dir: "tests/scripts/debt", owner: "debt", type: "unit" },
    { dir: "tests/scripts/lib", owner: "shared-lib", type: "unit" },
    { dir: "tests/scripts/audit", owner: "audit", type: "unit" },
    { dir: "tests/scripts/multi-ai", owner: "multi-ai", type: "unit" },
    { dir: "tests/scripts/planning", owner: "planning", type: "unit" },
    { dir: "tests/scripts/velocity", owner: "velocity", type: "unit" },
    { dir: "tests/scripts/secrets", owner: "secrets", type: "unit" },
    { dir: "tests/scripts/config", owner: "config", type: "unit" },
    { dir: "tests/scripts/tasks", owner: "tasks", type: "unit" },
    { dir: "tests/scripts/metrics", owner: "metrics", type: "unit" },
    { dir: "tests/scripts/health", owner: "health", type: "unit" },
    { dir: "tests/integration", owner: "integration", type: "integration" },
    { dir: "tests/e2e", owner: "e2e", type: "e2e" },
  ];

  for (const { dir, owner, type } of patterns) {
    const absDir = path.join(ROOT, dir);
    if (!fs.existsSync(absDir)) continue;
    try {
      const files = readdirRecursive(absDir);
      for (const file of files) {
        if (!isTestFile(file)) continue;
        const relPath = path.relative(ROOT, file).replace(/\\/g, "/");
        const testType = relPath.includes(".property.test.")
          ? "property"
          : relPath.includes(".integration.test.")
            ? "integration"
            : relPath.includes(".e2e.test.")
              ? "e2e"
              : type;
        const baseName = path
          .basename(file)
          .replace(/\.(test|property\.test|integration\.test)\.(js|ts|mjs)$/, "");
        entries.push({
          path: relPath,
          source_type: "test_file",
          type: testType,
          owner,
          target: baseName,
          description: `${testType} test for ${baseName}`,
        });
      }
    } catch {
      // Directory not readable, skip
    }
  }

  // Scan ecosystem audit test files
  const skillsDir = path.join(ROOT, ".claude", "skills");
  if (fs.existsSync(skillsDir)) {
    try {
      const skills = fs.readdirSync(skillsDir, { withFileTypes: true });
      for (const skill of skills) {
        if (!skill.isDirectory()) continue;
        const testsDir = path.join(skillsDir, skill.name, "scripts", "__tests__");
        if (!fs.existsSync(testsDir)) continue;
        try {
          const files = readdirRecursive(testsDir);
          for (const file of files) {
            if (!isTestFile(file)) continue;
            const relPath = path.relative(ROOT, file).replace(/\\/g, "/");
            const baseName = path.basename(file).replace(/\.test\.(js|ts|mjs)$/, "");
            entries.push({
              path: relPath,
              source_type: "test_file",
              type: "unit",
              owner: skill.name,
              target: baseName,
              description: `${skill.name} test: ${baseName}`,
            });
          }
        } catch {
          // Skip unreadable
        }
      }
    } catch {
      // Skills dir not readable
    }
  }

  return entries;
}

/** @returns {RegistryEntry[]} */
function scanAuditCheckers() {
  const entries = [];
  const skillsDir = path.join(ROOT, ".claude", "skills");
  if (!fs.existsSync(skillsDir)) return entries;

  try {
    const skills = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const skill of skills) {
      if (!skill.isDirectory() || !skill.name.includes("ecosystem-audit")) continue;
      const checkersDir = path.join(skillsDir, skill.name, "scripts", "checkers");
      if (!fs.existsSync(checkersDir)) continue;
      try {
        const files = fs.readdirSync(checkersDir).filter((f) => f.endsWith(".js"));
        for (const file of files) {
          const relPath = `.claude/skills/${skill.name}/scripts/checkers/${file}`;
          entries.push({
            path: relPath,
            source_type: "audit_checker",
            type: "checker",
            owner: skill.name,
            target: file.replace(".js", ""),
            description: `${skill.name} domain checker: ${file.replace(".js", "")}`,
          });
        }
      } catch {
        // Skip
      }
    }
  } catch {
    // Skip
  }

  return entries;
}

/** @returns {RegistryEntry[]} */
function scanTestProtocols() {
  const entries = [];
  const protocolGlobs = ["tests/**/*.protocol.json", ".claude/skills/**/*.protocol.json"];
  for (const pattern of protocolGlobs) {
    const dir = path.join(ROOT, pattern.split("*")[0]);
    if (!fs.existsSync(dir)) continue;
    try {
      const files = readdirRecursive(dir);
      for (const file of files) {
        if (!file.endsWith(".protocol.json")) continue;
        const relPath = path.relative(ROOT, file).replace(/\\/g, "/");
        const baseName = path.basename(file).replace(".protocol.json", "");
        entries.push({
          path: relPath,
          source_type: "test_protocol",
          type: "protocol",
          owner: "ui-testing",
          target: baseName,
          description: `UI test protocol: ${baseName}`,
        });
      }
    } catch {
      // Skip
    }
  }
  return entries;
}

/** @returns {RegistryEntry[]} */
function scanSkillCommands() {
  const entries = [];
  const skillsDir = path.join(ROOT, ".claude", "skills");
  if (!fs.existsSync(skillsDir)) return entries;

  try {
    const skills = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const skill of skills) {
      if (!skill.isDirectory()) continue;
      const skillMd = path.join(skillsDir, skill.name, "SKILL.md");
      if (!fs.existsSync(skillMd)) continue;
      entries.push({
        path: `.claude/skills/${skill.name}/SKILL.md`,
        source_type: "skill_command",
        type: "skill",
        owner: skill.name,
        target: skill.name,
        description: `Skill: ${skill.name}`,
      });
    }
  } catch {
    // Skip
  }

  return entries;
}

/** @returns {RegistryEntry[]} */
function scanNpmValidators() {
  const entries = [];
  const pkgPath = path.join(ROOT, "package.json");
  if (!fs.existsSync(pkgPath)) return entries;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const scripts = pkg.scripts || {};
    const validatorPatterns =
      /^(test|lint|check|validate|verify|audit|format|security|patterns|review|crossdoc|backlog|agents|hooks:test|docs:|roadmap:|skills:)/;
    for (const [name, cmd] of Object.entries(scripts)) {
      if (!validatorPatterns.test(name)) continue;
      entries.push({
        path: "package.json",
        source_type: "npm_validator",
        type: "npm-script",
        owner: "npm",
        target: name,
        description: `npm run ${name}`,
      });
    }
  } catch {
    // Skip
  }

  return entries;
}

/** @returns {RegistryEntry[]} */
function scanCiSteps() {
  const entries = [];
  const ciPath = path.join(ROOT, ".github", "workflows", "ci.yml");
  if (!fs.existsSync(ciPath)) return entries;

  try {
    const content = fs.readFileSync(ciPath, "utf8");
    const stepRegex = /- name:\s*(.+)/g;
    let match;
    const gatePatterns =
      /check|lint|test|validate|coverage|audit|format|pattern|compliance|verify/i;
    while ((match = stepRegex.exec(content)) !== null) {
      const name = match[1].trim();
      const isGate = gatePatterns.test(name);
      entries.push({
        path: ".github/workflows/ci.yml",
        source_type: isGate ? "gate_check" : "ci_step",
        type: isGate ? "gate" : "ci",
        owner: "ci",
        target: name,
        description: `CI step: ${name}`,
      });
    }
  } catch {
    // Skip
  }

  return entries;
}

/** @returns {RegistryEntry[]} */
function scanHealthCheckers() {
  const entries = [];
  const checkersDir = path.join(ROOT, "scripts", "health", "checkers");
  if (!fs.existsSync(checkersDir)) return entries;

  try {
    const files = fs.readdirSync(checkersDir).filter((f) => f.endsWith(".js"));
    for (const file of files) {
      const relPath = `scripts/health/checkers/${file}`;
      entries.push({
        path: relPath,
        source_type: "health_checker",
        type: "checker",
        owner: "health",
        target: file.replace(".js", ""),
        description: `Health checker: ${file.replace(".js", "")}`,
      });
    }
  } catch {
    // Skip
  }

  return entries;
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function readdirRecursive(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "fixtures") {
        results.push(...readdirRecursive(fullPath));
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  } catch {
    // Skip unreadable directories
  }
  return results;
}

/**
 * @param {string} filePath
 * @returns {boolean}
 */
function isTestFile(filePath) {
  const name = path.basename(filePath);
  return /\.(test|property\.test|integration\.test|e2e\.test)\.(js|ts|mjs)$/.test(name);
}

function main() {
  try {
    const allEntries = [
      ...scanTestFiles(),
      ...scanAuditCheckers(),
      ...scanTestProtocols(),
      ...scanSkillCommands(),
      ...scanNpmValidators(),
      ...scanCiSteps(),
      ...scanHealthCheckers(),
    ];

    // Ensure output directory exists
    const outDir = path.dirname(OUTPUT);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Write JSONL
    const jsonl = allEntries.map((e) => JSON.stringify(e)).join("\n") + "\n";
    fs.writeFileSync(OUTPUT, jsonl, "utf8");

    // Summary
    const byType = {};
    for (const e of allEntries) {
      byType[e.source_type] = (byType[e.source_type] || 0) + 1;
    }

    console.log(`Test registry generated: ${path.relative(ROOT, OUTPUT)}`);
    console.log(`Total entries: ${allEntries.length}`);
    console.log("By source type:");
    for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type}: ${count}`);
    }
  } catch (err) {
    console.error(`[generate-test-registry] ${sanitizeError(err)}`);
    process.exit(1);
  }
}

main();
