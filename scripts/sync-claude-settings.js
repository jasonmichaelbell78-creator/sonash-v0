#!/usr/bin/env node
/* global __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Claude Code Settings Sync Utility
 *
 * Syncs Claude Code global settings between local environment (~/.claude/)
 * and repository (.claude/) for cross-platform portability.
 *
 * Usage:
 *   node scripts/sync-claude-settings.js --export   # Copy local → repo
 *   node scripts/sync-claude-settings.js --import   # Copy repo → local
 *   node scripts/sync-claude-settings.js --diff     # Show differences
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

// Paths
const HOME = os.homedir();
const PROJECT_DIR = path.resolve(__dirname, "..");

const LOCAL_PATHS = {
  settings: path.join(HOME, ".claude", "settings.json"),
  mcp: path.join(HOME, ".claude", "mcp.json"),
  hooks: path.join(HOME, ".claude", "hooks"),
  agents: path.join(HOME, ".claude", "agents"),
};

const REPO_PATHS = {
  settings: path.join(PROJECT_DIR, ".claude", "settings.global-template.json"),
  mcp: path.join(PROJECT_DIR, ".claude", "mcp.global-template.json"),
  hooks: path.join(PROJECT_DIR, ".claude", "hooks", "global"),
  agents: path.join(PROJECT_DIR, ".claude", "agents", "global"),
};

// Files to sync
const HOOKS_TO_SYNC = ["gsd-check-update.js", "statusline.js"];
const AGENTS_PATTERN = /^gsd-.*\.md$/;

// Review #224: Helper for path containment validation
function isPathContained(basePath, filePath) {
  const resolved = path.resolve(basePath, filePath);
  const rel = path.relative(basePath, resolved);
  // Reject if: empty, starts with .., or is absolute
  return rel !== "" && !/^\.\.(?:[\\/]|$)/.test(rel) && !path.isAbsolute(rel);
}

// Keys to exclude from settings sync (sensitive or machine-specific)
const EXCLUDED_SETTINGS_KEYS = ["env", "permissions"];

// Parse arguments
const args = process.argv.slice(2);
const command = args[0];

function printUsage() {
  console.log(`
Claude Code Settings Sync Utility

Usage:
  node scripts/sync-claude-settings.js --export   Export local settings to repo
  node scripts/sync-claude-settings.js --import   Import repo settings to local
  node scripts/sync-claude-settings.js --diff     Show differences

Options:
  --export    Copy global settings from ~/.claude/ to repo .claude/
  --import    Merge repo settings into ~/.claude/
  --diff      Show what would change without making changes
  --help      Show this help message
`);
}

function fileExists(filepath) {
  try {
    return fs.existsSync(filepath);
  } catch {
    return false;
  }
}

function readJson(filepath) {
  try {
    const content = fs.readFileSync(filepath, "utf8");
    return JSON.parse(content);
  } catch (e) {
    // Review #224: Safe error message access
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error(`Error reading ${filepath}:`, errMsg);
    return null;
  }
}

function writeJson(filepath, data) {
  try {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + "\n");
    return true;
  } catch (e) {
    console.error(`Error writing ${filepath}:`, e.message);
    return false;
  }
}

function copyFile(src, dest) {
  try {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    return true;
  } catch (e) {
    console.error(`Error copying ${src} → ${dest}:`, e.message);
    return false;
  }
}

function filterSettings(settings, exclude = EXCLUDED_SETTINGS_KEYS) {
  const filtered = { ...settings };
  for (const key of exclude) {
    delete filtered[key];
  }
  return filtered;
}

// Qodo R13: Helper to safely get object for spreading
function safeObj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function mergeSettings(local, repo) {
  // Deep merge with repo taking precedence for enabledPlugins
  const merged = { ...local };

  // Qodo R13: Guard against null/undefined/array before spreading
  if (repo.enabledPlugins) {
    merged.enabledPlugins = { ...safeObj(local.enabledPlugins), ...safeObj(repo.enabledPlugins) };
  }

  if (repo.hooks) {
    merged.hooks = { ...safeObj(local.hooks), ...safeObj(repo.hooks) };
  }

  if (repo.statusLine) {
    merged.statusLine = repo.statusLine;
  }

  if (repo.model) {
    merged.model = repo.model;
  }

  if (repo.alwaysThinkingEnabled !== undefined) {
    merged.alwaysThinkingEnabled = repo.alwaysThinkingEnabled;
  }

  return merged;
}

function diffObjects(a, b, path = "") {
  const diffs = [];
  // Review #224 Qodo R1: Guard against null - Object.keys(null) throws
  const aObj = a && typeof a === "object" && !Array.isArray(a) ? a : {};
  const bObj = b && typeof b === "object" && !Array.isArray(b) ? b : {};
  const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);

  for (const key of allKeys) {
    const fullPath = path ? `${path}.${key}` : key;
    const aVal = aObj[key];
    const bVal = bObj[key];

    if (aVal === undefined && bVal !== undefined) {
      diffs.push({ path: fullPath, local: undefined, repo: bVal, type: "added" });
    } else if (aVal !== undefined && bVal === undefined) {
      diffs.push({ path: fullPath, local: aVal, repo: undefined, type: "removed" });
    } else if (typeof aVal === "object" && typeof bVal === "object" && !Array.isArray(aVal)) {
      diffs.push(...diffObjects(aVal, bVal, fullPath));
    } else if (JSON.stringify(aVal) !== JSON.stringify(bVal)) {
      diffs.push({ path: fullPath, local: aVal, repo: bVal, type: "changed" });
    }
  }

  return diffs;
}

// Commands

function exportCommand() {
  console.log("Exporting local settings to repo...\n");

  // Export settings
  if (fileExists(LOCAL_PATHS.settings)) {
    const local = readJson(LOCAL_PATHS.settings);
    if (local) {
      const filtered = filterSettings(local);
      // Add template metadata
      filtered.$schema = "https://json.schemastore.org/claude-code-settings";
      filtered._comment =
        "Global Claude Code settings template. To use: copy or merge into ~/.claude/settings.json";

      if (writeJson(REPO_PATHS.settings, filtered)) {
        console.log(`✓ Settings exported to ${REPO_PATHS.settings}`);
      }
    }
  } else {
    console.log(`⚠ Local settings not found at ${LOCAL_PATHS.settings}`);
  }

  // Export MCP config
  if (fileExists(LOCAL_PATHS.mcp)) {
    const local = readJson(LOCAL_PATHS.mcp);
    if (local) {
      local.$schema = "https://json.schemastore.org/mcp-servers";
      local._comment = "Global MCP server template. To use: copy or merge into ~/.claude/mcp.json";

      if (writeJson(REPO_PATHS.mcp, local)) {
        console.log(`✓ MCP config exported to ${REPO_PATHS.mcp}`);
      }
    }
  } else {
    console.log(`⚠ Local MCP config not found at ${LOCAL_PATHS.mcp}`);
  }

  // Export hooks
  for (const hook of HOOKS_TO_SYNC) {
    const src = path.join(LOCAL_PATHS.hooks, hook);
    const dest = path.join(REPO_PATHS.hooks, hook);

    if (fileExists(src)) {
      if (copyFile(src, dest)) {
        console.log(`✓ Hook exported: ${hook}`);
      }
    } else {
      console.log(`⚠ Hook not found: ${src}`);
    }
  }

  // Export agents
  if (fileExists(LOCAL_PATHS.agents)) {
    const files = fs.readdirSync(LOCAL_PATHS.agents).filter((f) => AGENTS_PATTERN.test(f));
    let exportedCount = 0;
    for (const file of files) {
      // Review #224: Path containment validation
      if (!isPathContained(LOCAL_PATHS.agents, file) || !isPathContained(REPO_PATHS.agents, file)) {
        console.warn(`⚠ Skipping agent with invalid path: ${file}`);
        continue;
      }
      const src = path.join(LOCAL_PATHS.agents, file);
      const dest = path.join(REPO_PATHS.agents, file);

      if (copyFile(src, dest)) {
        console.log(`✓ Agent exported: ${file}`);
        exportedCount++;
      }
    }
    console.log(`✓ ${exportedCount} agents exported`);
  }

  console.log("\nExport complete!");
}

function importCommand() {
  console.log("Importing repo settings to local...\n");

  // Import settings (merge with existing)
  if (fileExists(REPO_PATHS.settings)) {
    const repo = readJson(REPO_PATHS.settings);
    let local = {};

    if (fileExists(LOCAL_PATHS.settings)) {
      local = readJson(LOCAL_PATHS.settings) || {};
    }

    if (repo) {
      // Remove template metadata
      delete repo.$schema;
      delete repo._comment;
      delete repo._usage;

      const merged = mergeSettings(local, repo);

      if (writeJson(LOCAL_PATHS.settings, merged)) {
        console.log(`✓ Settings merged into ${LOCAL_PATHS.settings}`);
      }
    }
  } else {
    console.log(`⚠ Repo settings not found at ${REPO_PATHS.settings}`);
  }

  // Import MCP config (merge with existing)
  if (fileExists(REPO_PATHS.mcp)) {
    const repo = readJson(REPO_PATHS.mcp);
    let local = { mcpServers: {} };

    if (fileExists(LOCAL_PATHS.mcp)) {
      local = readJson(LOCAL_PATHS.mcp) || { mcpServers: {} };
    }

    if (repo) {
      // Remove template metadata
      delete repo.$schema;
      delete repo._comment;

      // Merge MCP servers (Review #224: Handle missing/invalid mcpServers)
      const localServers =
        local && typeof local.mcpServers === "object" && !Array.isArray(local.mcpServers)
          ? local.mcpServers
          : {};
      const repoServers =
        repo && typeof repo.mcpServers === "object" && !Array.isArray(repo.mcpServers)
          ? repo.mcpServers
          : {};
      local.mcpServers = { ...localServers, ...repoServers };

      if (writeJson(LOCAL_PATHS.mcp, local)) {
        console.log(`✓ MCP config merged into ${LOCAL_PATHS.mcp}`);
      }
    }
  } else {
    console.log(`⚠ Repo MCP config not found at ${REPO_PATHS.mcp}`);
  }

  // Import hooks
  if (fileExists(REPO_PATHS.hooks)) {
    for (const hook of HOOKS_TO_SYNC) {
      const src = path.join(REPO_PATHS.hooks, hook);
      const dest = path.join(LOCAL_PATHS.hooks, hook);

      if (fileExists(src)) {
        if (copyFile(src, dest)) {
          console.log(`✓ Hook imported: ${hook}`);
        }
      }
    }
  }

  // Import agents
  if (fileExists(REPO_PATHS.agents)) {
    const files = fs.readdirSync(REPO_PATHS.agents).filter((f) => AGENTS_PATTERN.test(f));
    let importedCount = 0;
    for (const file of files) {
      // Review #224: Path containment validation
      if (!isPathContained(REPO_PATHS.agents, file) || !isPathContained(LOCAL_PATHS.agents, file)) {
        console.warn(`⚠ Skipping agent with invalid path: ${file}`);
        continue;
      }
      const src = path.join(REPO_PATHS.agents, file);
      const dest = path.join(LOCAL_PATHS.agents, file);

      if (copyFile(src, dest)) {
        console.log(`✓ Agent imported: ${file}`);
        importedCount++;
      }
    }
    console.log(`✓ ${importedCount} agents imported`);
  }

  console.log("\nImport complete!");
}

function diffCommand() {
  console.log("Comparing local and repo settings...\n");

  let hasDiffs = false;

  // Diff settings
  if (fileExists(LOCAL_PATHS.settings) && fileExists(REPO_PATHS.settings)) {
    const local = filterSettings(readJson(LOCAL_PATHS.settings) || {});
    const repo = readJson(REPO_PATHS.settings) || {};

    // Remove template metadata for comparison
    delete repo.$schema;
    delete repo._comment;
    delete repo._usage;

    const diffs = diffObjects(local, repo);

    if (diffs.length > 0) {
      hasDiffs = true;
      console.log("Settings differences:");
      for (const d of diffs) {
        const symbol = d.type === "added" ? "+" : d.type === "removed" ? "-" : "~";
        console.log(`  ${symbol} ${d.path}`);
        // Qodo R12: Don't log full values - may contain secrets/tokens
        if (d.type === "changed") {
          const localType = typeof d.local;
          const repoType = typeof d.repo;
          console.log(`      local: (${localType}) repo: (${repoType})`);
        }
      }
      console.log();
    }
  }

  // Diff hooks
  console.log("Hooks:");
  for (const hook of HOOKS_TO_SYNC) {
    const localPath = path.join(LOCAL_PATHS.hooks, hook);
    const repoPath = path.join(REPO_PATHS.hooks, hook);

    const localExists = fileExists(localPath);
    const repoExists = fileExists(repoPath);

    if (localExists && repoExists) {
      // Review #224: Wrap file reads in try/catch
      try {
        const localContent = fs.readFileSync(localPath, "utf8");
        const repoContent = fs.readFileSync(repoPath, "utf8");

        if (localContent !== repoContent) {
          hasDiffs = true;
          console.log(`  ~ ${hook} (content differs)`);
        } else {
          console.log(`  = ${hook} (in sync)`);
        }
      } catch (e) {
        hasDiffs = true;
        console.log(`  ? ${hook} (read error)`);
      }
    } else if (localExists) {
      hasDiffs = true;
      console.log(`  - ${hook} (only in local)`);
    } else if (repoExists) {
      hasDiffs = true;
      console.log(`  + ${hook} (only in repo)`);
    }
  }
  console.log();

  // Diff agents
  console.log("Agents:");
  const localAgents = fileExists(LOCAL_PATHS.agents)
    ? fs.readdirSync(LOCAL_PATHS.agents).filter((f) => AGENTS_PATTERN.test(f))
    : [];
  const repoAgents = fileExists(REPO_PATHS.agents)
    ? fs.readdirSync(REPO_PATHS.agents).filter((f) => AGENTS_PATTERN.test(f))
    : [];

  const allAgents = new Set([...localAgents, ...repoAgents]);

  for (const agent of allAgents) {
    const inLocal = localAgents.includes(agent);
    const inRepo = repoAgents.includes(agent);

    if (inLocal && inRepo) {
      // Review #224: Compare file contents, not just filenames
      const localPath = path.join(LOCAL_PATHS.agents, agent);
      const repoPath = path.join(REPO_PATHS.agents, agent);

      try {
        const localContent = fs.readFileSync(localPath, "utf8");
        const repoContent = fs.readFileSync(repoPath, "utf8");

        if (localContent !== repoContent) {
          hasDiffs = true;
          console.log(`  ~ ${agent} (content differs)`);
        } else {
          console.log(`  = ${agent} (in sync)`);
        }
      } catch (_e) {
        hasDiffs = true;
        console.log(`  ? ${agent} (read error)`);
      }
    } else if (inLocal) {
      hasDiffs = true;
      console.log(`  - ${agent} (only in local)`);
    } else {
      hasDiffs = true;
      console.log(`  + ${agent} (only in repo)`);
    }
  }

  if (!hasDiffs) {
    console.log("\nAll settings are in sync!");
  }
}

// Main
switch (command) {
  case "--export":
    exportCommand();
    break;
  case "--import":
    importCommand();
    break;
  case "--diff":
    diffCommand();
    break;
  case "--help":
  case "-h":
  case undefined:
    printUsage();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}
