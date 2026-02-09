#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * Generate Skill Registry
 *
 * Scans .claude/skills/ and .agents/skills/ directories, parses SKILL.md
 * frontmatter, and writes a structured JSON registry to scripts/config/skill-registry.json.
 *
 * Usage: node scripts/generate-skill-registry.js
 * npm script: npm run skills:registry
 *
 * Exit codes:
 *   0 - Registry generated successfully
 *   2 - Error during generation
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const OUTPUT = path.join(__dirname, "config", "skill-registry.json");
const SKILLS_DIRS = [path.join(ROOT, ".claude", "skills"), path.join(ROOT, ".agents", "skills")];

/**
 * Parse SKILL.md frontmatter (YAML-like) without regex backtracking.
 * @param {string} content - File content
 * @returns {object|null} Parsed frontmatter fields
 */
function parseFrontmatter(content) {
  if (!content.startsWith("---")) return null;
  const endLF = content.indexOf("\n---", 3);
  const endCRLF = content.indexOf("\r\n---", 3);
  const end = endLF === -1 ? endCRLF : endCRLF === -1 ? endLF : Math.min(endLF, endCRLF);
  if (end === -1) return null;

  const fm = content.slice(0, end);
  const result = {};
  for (const line of fm.split(/\r?\n/)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (key && value && key !== "---") {
      result[key] = value;
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Scan a skills directory and collect registry entries.
 * @param {string} dir - Skills directory path
 * @param {string} source - Source label (e.g., ".claude/skills")
 * @returns {object[]} Array of skill entries
 */
function scanSkillsDir(dir, source) {
  const entries = [];
  try {
    if (!fs.existsSync(dir)) return entries;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (!item.isDirectory()) continue;
      const skillDir = path.join(dir, item.name);
      const skillMd = path.join(skillDir, "SKILL.md");

      const entry = { name: item.name, source };
      try {
        if (fs.existsSync(skillMd)) {
          const content = fs.readFileSync(skillMd, "utf8");
          const fm = parseFrontmatter(content);
          if (fm) {
            if (fm.description) entry.description = fm.description;
            if (fm.name) entry.displayName = fm.name;
            if (fm.version) entry.version = fm.version;
          }
          // Fallback: use first non-header, non-frontmatter line as description
          if (!entry.description) {
            const lines = content.split(/\r?\n/);
            for (const line of lines) {
              const trimmed = line.replace(/^#+\s*/, "").trim();
              if (trimmed && !trimmed.startsWith("---") && !trimmed.startsWith("name:")) {
                entry.description = trimmed.length > 120 ? trimmed.slice(0, 117) + "..." : trimmed;
                break;
              }
            }
          }
        }
      } catch {
        // Skip unreadable SKILL.md
      }
      entries.push(entry);
    }
  } catch {
    // Skip unreadable directory
  }
  return entries;
}

function main() {
  const skills = [];
  const seen = new Set();

  for (const dir of SKILLS_DIRS) {
    const source = path.relative(ROOT, dir).replace(/\\/g, "/");
    const entries = scanSkillsDir(dir, source);
    for (const entry of entries) {
      if (seen.has(entry.name)) continue;
      seen.add(entry.name);
      skills.push(entry);
    }
  }

  skills.sort((a, b) => a.name.localeCompare(b.name));

  const registry = {
    generatedAt: new Date().toISOString(),
    skillCount: skills.length,
    skills,
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(registry, null, 2) + "\n", "utf8");
  console.log(`Generated skill registry: ${skills.length} skills → ${path.relative(ROOT, OUTPUT)}`);
}

try {
  main();
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Error generating skill registry: ${msg}`);
  process.exit(2);
}
