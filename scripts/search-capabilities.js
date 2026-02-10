#!/usr/bin/env node

/**
 * Unified Skill/Plugin Discovery
 *
 * Searches both the skills.sh ecosystem and Claude Code plugin marketplaces
 * for capabilities matching a keyword query.
 *
 * Usage: node scripts/search-capabilities.js [query...]
 * npm script: npm run capabilities:search -- [query...]
 *
 * @module search-capabilities
 */

const { execFileSync } = require("node:child_process");
const { readdirSync, readFileSync, existsSync } = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { sanitizeError } = require("./lib/sanitize-error");

const { loadConfig } = require("./config/load-config");

const CLAUDE_DIR = path.join(os.homedir(), ".claude");
const MARKETPLACES_DIR = path.join(CLAUDE_DIR, "plugins", "marketplaces");
const LOCAL_SKILLS_DIRS = [
  path.join(process.cwd(), ".claude", "skills"),
  path.join(process.cwd(), ".agents", "skills"),
];

/**
 * Read first non-empty line from a file as a description.
 * @param {string} filePath
 * @returns {string}
 */
function readFirstLine(filePath) {
  try {
    if (!existsSync(filePath)) return "";
    let content;
    try {
      content = readFileSync(filePath, "utf8");
    } catch {
      return "";
    }
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.replace(/^#+\s*/, "").trim();
      if (trimmed && !trimmed.startsWith("---") && !trimmed.startsWith("name:")) {
        return trimmed.length > 80 ? trimmed.slice(0, 77) + "..." : trimmed;
      }
    }
    return "";
  } catch {
    return "";
  }
}

/**
 * Read the description from a SKILL.md frontmatter.
 * @param {string} filePath
 * @returns {string}
 */
function readSkillDescription(filePath) {
  try {
    if (!existsSync(filePath)) return "";
    let content;
    try {
      content = readFileSync(filePath, "utf8");
    } catch {
      return "";
    }

    // Parse frontmatter without backtracking regex (ReDoS-safe)
    if (content.startsWith("---")) {
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
      if (end !== -1) {
        const fm = content.slice(0, end);
        const descLine = fm
          .split(/\r?\n/)
          .find((l) => l.trim().toLowerCase().startsWith("description:"));
        if (descLine) {
          const desc = descLine.split(":").slice(1).join(":").trim();
          return desc.length > 80 ? desc.slice(0, 77) + "..." : desc;
        }
      }
    }

    return readFirstLine(filePath);
  } catch {
    return "";
  }
}

/**
 * Check if keywords match a name (fuzzy: all keywords must appear).
 * @param {string[]} keywords
 * @param {string} name
 * @returns {boolean}
 */
function fuzzyMatch(keywords, name) {
  const normalized = name.toLowerCase().replace(/[-_]/g, " ");
  return keywords.every((kw) => normalized.includes(kw.replace(/[-_]/g, " ")));
}

/**
 * Gather installed plugins via `claude plugin list`.
 * @returns {Set<string>} Set of "name@marketplace" strings
 */
function getInstalledPlugins() {
  const installed = new Set();
  try {
    const output = execFileSync("claude", ["plugin", "list"], {
      encoding: "utf8",
      timeout: 15000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const re = /❯\s+(\S+)/g;
    let m;
    while ((m = re.exec(output)) !== null) {
      installed.add(m[1].toLowerCase());
    }
  } catch {
    // claude CLI not available or errored — continue without installed info
  }
  return installed;
}

/**
 * List directories in a path (safe, returns empty array on error).
 * @param {string} dirPath
 * @returns {string[]}
 */
function listDirs(dirPath) {
  try {
    if (!existsSync(dirPath)) return [];
    return readdirSync(dirPath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }
}

/**
 * Search marketplace plugins and their nested skills.
 * @param {string[]} keywords
 * @returns {{ plugins: object[], skills: object[] }}
 */
function searchMarketplaces(keywords) {
  const plugins = [];
  const skills = [];
  const marketplaces = listDirs(MARKETPLACES_DIR);

  for (const mp of marketplaces) {
    const pluginsDir = path.join(MARKETPLACES_DIR, mp, "plugins");
    const pluginNames = listDirs(pluginsDir);

    for (const pName of pluginNames) {
      const pluginDir = path.join(pluginsDir, pName);

      if (fuzzyMatch(keywords, pName)) {
        const readme = path.join(pluginDir, "README.md");
        plugins.push({
          name: pName,
          marketplace: mp,
          description: readFirstLine(readme),
          installId: `${pName}@${mp}`,
        });
      }

      // Also search nested skills
      const skillsDir = path.join(pluginDir, "skills");
      const skillNames = listDirs(skillsDir);
      for (const sName of skillNames) {
        if (fuzzyMatch(keywords, sName)) {
          const skillMd = path.join(skillsDir, sName, "SKILL.md");
          skills.push({
            name: `${pName}:${sName}`,
            marketplace: mp,
            plugin: pName,
            description: readSkillDescription(skillMd),
            installId: `${pName}@${mp}`,
          });
        }
      }
    }
  }

  return { plugins, skills };
}

/**
 * Search local skills using registry (fast) with fallback to directory scan.
 * Registry: scripts/config/skill-registry.json (generated by generate-skill-registry.js)
 * @param {string[]} keywords
 * @returns {object[]}
 */
function searchLocalSkills(keywords) {
  // Try registry first (fast path)
  try {
    const registry = loadConfig("skill-registry");
    if (registry && Array.isArray(registry.skills)) {
      return registry.skills
        .filter(
          (s) =>
            fuzzyMatch(keywords, s.name) || (s.description && fuzzyMatch(keywords, s.description))
        )
        .map((s) => ({ name: s.name, source: s.source, description: s.description || "" }));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Warning: failed to load skill registry (falling back to scan): ${msg}`);
  }

  // Fallback: scan directories directly
  const results = [];
  for (const dir of LOCAL_SKILLS_DIRS) {
    const names = listDirs(dir);
    for (const name of names) {
      if (fuzzyMatch(keywords, name)) {
        const skillMd = path.join(dir, name, "SKILL.md");
        results.push({
          name,
          source: path.relative(process.cwd(), dir),
          description: readSkillDescription(skillMd),
        });
      }
    }
  }
  // Deduplicate by name (symlinks between .claude/skills and .agents/skills)
  const seen = new Set();
  return results.filter((r) => {
    if (seen.has(r.name)) return false;
    seen.add(r.name);
    return true;
  });
}

/**
 * Search skills.sh via `npx skills find`.
 * @param {string[]} queryArgs - Arguments to pass to skills find
 * @returns {string[]} Raw output lines
 */
function searchSkillsSh(queryArgs) {
  try {
    const output = execFileSync("npx", ["-y", "skills", "find", "--", ...queryArgs], {
      encoding: "utf8",
      timeout: 30000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return output
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  } catch {
    return [];
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("Usage: node scripts/search-capabilities.js <query...>");
    console.log("Example: node scripts/search-capabilities.js testing react");
    process.exit(1);
  }

  const keywords = args.map((a) => a.toLowerCase());
  const queryStr = args.join(" ");

  console.log(`\nSearching for: "${queryStr}"\n`);

  // 1. Get installed plugins for cross-reference
  const installed = getInstalledPlugins();

  // 2. Local skills
  const localSkills = searchLocalSkills(keywords);

  // 3. Marketplace search
  const { plugins: mpPlugins, skills: mpSkills } = searchMarketplaces(keywords);

  // Separate marketplace results into installed vs available
  const installedPlugins = mpPlugins.filter((p) => installed.has(p.installId.toLowerCase()));
  const availablePlugins = mpPlugins.filter((p) => !installed.has(p.installId.toLowerCase()));
  const installedMpSkills = mpSkills.filter((s) => installed.has(s.installId.toLowerCase()));
  const availableMpSkills = mpSkills.filter((s) => !installed.has(s.installId.toLowerCase()));

  // 4. skills.sh search (slower, do last)
  const skillsShResults = searchSkillsSh(args);

  // --- Output ---

  console.log("INSTALLED:");
  let installedCount = 0;

  for (const s of localSkills) {
    console.log(`  - ${s.name} (local skill, ${s.source})`);
    if (s.description) console.log(`    ${s.description}`);
    installedCount++;
  }
  for (const p of installedPlugins) {
    console.log(`  - ${p.name} (plugin, ${p.marketplace})`);
    if (p.description) console.log(`    ${p.description}`);
    installedCount++;
  }
  for (const s of installedMpSkills) {
    console.log(`  - ${s.name} (skill in plugin, ${s.marketplace})`);
    if (s.description) console.log(`    ${s.description}`);
    installedCount++;
  }
  if (installedCount === 0) {
    console.log("  (none found)");
  }

  console.log("\nAVAILABLE IN MARKETPLACES:");
  const availCount = availablePlugins.length + availableMpSkills.length;
  if (availCount === 0) {
    console.log("  (none found)");
  } else {
    for (const p of availablePlugins) {
      console.log(`  - ${p.name} (${p.marketplace}) — not installed`);
      if (p.description) console.log(`    ${p.description}`);
    }
    for (const s of availableMpSkills) {
      console.log(`  - ${s.name} (${s.marketplace}) — not installed`);
      if (s.description) console.log(`    ${s.description}`);
    }
    console.log("  Install: claude plugin install <name>@<marketplace>");
  }

  console.log("\nAVAILABLE ON SKILLS.SH:");
  if (skillsShResults.length === 0) {
    console.log("  (none found)");
  } else {
    for (const line of skillsShResults) {
      console.log(`  ${line}`);
    }
    console.log("  Install: npx skills add <owner/repo@skill> -g -y");
  }

  console.log("");
}

try {
  main();
} catch (err) {
  console.error("Error:", sanitizeError(err));
  process.exit(1);
}
