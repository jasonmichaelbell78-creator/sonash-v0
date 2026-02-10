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
  let end;
  if (endLF === -1) {
    end = endCRLF;
  } else if (endCRLF === -1) {
    end = endLF;
  } else {
    end = Math.min(endLF, endCRLF);
  }
  if (end === -1) return null;

  const fm = content.slice(3, end);
  const result = {};
  for (const line of fm.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---") continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const rawValue = trimmed.slice(colonIdx + 1).trim();
    // Ignore YAML block scalar indicators (|, >, >-); fallback description handles these
    const value =
      rawValue === "|" || rawValue === ">" || rawValue === ">-" || rawValue === "" ? "" : rawValue;
    if (key && value) {
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
          // Reject symlinks to prevent unintended file reads (Review #269)
          const stat = fs.lstatSync(skillMd);
          if (stat.isSymbolicLink()) {
            console.warn(`  Warning: skipping symlink SKILL.md in ${item.name}`);
            entries.push(entry);
            continue;
          }
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
              if (
                !trimmed ||
                trimmed === "---" ||
                trimmed === "|" ||
                trimmed === ">" ||
                trimmed === ">-" ||
                /^name:\s*/i.test(trimmed) ||
                /^description:\s*$/i.test(trimmed)
              ) {
                continue;
              }
              entry.description = trimmed.length > 120 ? trimmed.slice(0, 117) + "..." : trimmed;
              break;
            }
          }
        }
      } catch (skillErr) {
        const msg = skillErr instanceof Error ? skillErr.message : String(skillErr);
        console.warn(`  Warning: failed to read SKILL.md in ${item.name}: ${msg}`);
      }
      entries.push(entry);
    }
  } catch (dirErr) {
    const msg = dirErr instanceof Error ? dirErr.message : String(dirErr);
    console.warn(`Warning: failed to scan skills directory ${dir}: ${msg}`);
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

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
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
