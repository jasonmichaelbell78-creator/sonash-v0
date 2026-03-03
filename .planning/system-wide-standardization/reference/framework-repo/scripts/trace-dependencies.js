#!/usr/bin/env node
/**
 * trace-dependencies.js
 *
 * Scans all project files and traces require/import dependencies.
 *
 * Focuses on:
 *   - .claude/hooks/*.js and .claude/hooks/lib/*.js
 *   - .claude/skills/*\/  (all skill directories)
 *   - .claude/agents/*.md
 *   - scripts/config/*.js and scripts/config/*.json
 *   - scripts/debt/*.js
 *   - scripts/*.js (doc ecosystem scripts)
 *   - scripts/lib/*.js
 *
 * Outputs a JSON dependency graph to stdout.
 *
 * Usage: node scripts/trace-dependencies.js [--source <path>] [--pretty]
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const prettyFlag = args.includes('--pretty');
const sourceIdx = args.indexOf('--source');
const SOURCE_ROOT =
  sourceIdx !== -1 && args[sourceIdx + 1]
    ? path.resolve(args[sourceIdx + 1])
    : path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Normalise a Windows/Unix path to forward-slash form for consistent keys. */
function normalise(p) {
  return p.replace(/\\/g, '/');
}

/** Read a file safely; return null on error. */
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

/** Check whether a path exists. */
function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

/** Recursively collect files matching an extension under a directory. */
function collectFiles(dir, ext, results = []) {
  if (!exists(dir)) return results;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, ext, results);
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

/** Collect direct children matching extension (non-recursive). */
function collectFilesShallow(dir, ext, results = []) {
  if (!exists(dir)) return results;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Dependency extraction from JS source
// ---------------------------------------------------------------------------

/**
 * Strip single-line and block comments from JS source so our regexes don't
 * accidentally match specifiers that appear inside comment text.
 * Also strips string literals that are NOT part of require/import/export
 * statements to reduce false positives — we do this by a simple state machine.
 */
function stripComments(source) {
  let result = '';
  let i = 0;
  const len = source.length;

  while (i < len) {
    // Block comment
    if (source[i] === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      if (end === -1) break;
      // Preserve newlines to keep line numbers roughly intact
      const block = source.slice(i, end + 2);
      result += block.replace(/[^\n]/g, ' ');
      i = end + 2;
      continue;
    }
    // Line comment
    if (source[i] === '/' && source[i + 1] === '/') {
      const end = source.indexOf('\n', i + 2);
      if (end === -1) {
        result += ' '.repeat(len - i);
        break;
      }
      result += ' '.repeat(end - i) + '\n';
      i = end + 1;
      continue;
    }
    result += source[i];
    i++;
  }
  return result;
}

/**
 * Parse all require() and import statement specifiers from JS/TS source text.
 * Returns an array of raw specifier strings (e.g. "./lib/safe-fs", "fs", "chalk").
 *
 * Strategy:
 *   1. Strip comments so specifier-like strings in comments are ignored.
 *   2. Match require() only when preceded by typical statement starters
 *      (=, (, [, ;, newline, const/let/var/return) — NOT when it appears as
 *      an argument of another function like console.error("...require(...)").
 *   3. Match import/export from lines directly (they are top-level keywords).
 */
function extractSpecifiers(source) {
  const cleaned = stripComments(source);
  const specifiers = new Set();

  // require("...") or require('...') — only when it is the first require() on
  // a logical statement token boundary (assignment, opening paren at start,
  // const/let/var, or standalone).
  // We look for: [=([{,;\n\t] whitespace* require(  OR  start-of-line require(
  const requireRe = /(?:^|[=([{,;\n\t])\s*require\s*\(\s*(['"`])((?:(?!\1)[^$])+)\1\s*\)/gm;
  let m;
  while ((m = requireRe.exec(cleaned)) !== null) {
    specifiers.add(m[2]);
  }

  // import ... from "..."  (static import declarations)
  // Must start at beginning of logical statement — import is a keyword
  const importFromRe = /^[\s]*import\s+(?:[^"'`\n]*?from\s+)?(['"`])((?:(?!\1)[^\n$])+)\1/gm;
  while ((m = importFromRe.exec(cleaned)) !== null) {
    specifiers.add(m[2]);
  }

  // export ... from "..."
  const exportFromRe = /^[\s]*export\s+(?:[^"'`\n]*?from\s+)?(['"`])((?:(?!\1)[^\n$])+)\1/gm;
  while ((m = exportFromRe.exec(cleaned)) !== null) {
    specifiers.add(m[2]);
  }

  // Dynamic import("...") — import( is not a valid call in other contexts
  const dynamicImportRe = /\bimport\s*\(\s*(['"`])((?:(?!\1)[^$])+)\1\s*\)/g;
  while ((m = dynamicImportRe.exec(cleaned)) !== null) {
    specifiers.add(m[2]);
  }

  // Filter out template-literal interpolations and obviously invalid specifiers
  const valid = [];
  for (const s of specifiers) {
    // Skip anything containing ${, which means it was a template literal
    if (s.includes('${')) continue;
    // Skip if it contains spaces (parser noise)
    if (/\s/.test(s)) continue;
    // Skip empty strings
    if (!s) continue;
    // Skip path alias patterns like @/ which indicate bundler aliases, not npm
    // (we keep @scope/pkg which is valid npm)
    // @/ is a bundler alias
    if (s.startsWith('@/')) continue;
    valid.push(s);
  }
  return valid;
}

/**
 * Classify a raw specifier into:
 *   { kind: "builtin" | "npm" | "relative" | "absolute", raw, resolved? }
 *
 * resolved is the absolute path on disk when kind === "relative".
 */
function classifySpecifier(raw, fromFile) {
  // Built-in Node modules (with or without node: prefix)
  const builtins = new Set([
    'assert',
    'buffer',
    'child_process',
    'cluster',
    'console',
    'constants',
    'crypto',
    'dgram',
    'dns',
    'domain',
    'events',
    'fs',
    'http',
    'http2',
    'https',
    'inspector',
    'module',
    'net',
    'os',
    'path',
    'perf_hooks',
    'process',
    'punycode',
    'querystring',
    'readline',
    'repl',
    'stream',
    'string_decoder',
    'sys',
    'timers',
    'tls',
    'trace_events',
    'tty',
    'url',
    'util',
    'v8',
    'vm',
    'wasi',
    'worker_threads',
    'zlib',
  ]);

  if (raw.startsWith('node:')) {
    return { kind: 'builtin', raw, packageName: raw.replace('node:', '') };
  }
  const bareBase = raw.split('/')[0];
  if (builtins.has(bareBase)) {
    return { kind: 'builtin', raw, packageName: bareBase };
  }

  // eslint-disable-next-line framework/no-path-startswith -- safe: comparing against known constant prefix
  if (raw.startsWith('.')) {
    // Relative specifier — try to resolve to an absolute path
    const dir = path.dirname(fromFile);
    const candidates = [
      path.resolve(dir, raw),
      path.resolve(dir, raw + '.js'),
      path.resolve(dir, raw + '.ts'),
      path.resolve(dir, raw + '.mjs'),
      path.resolve(dir, raw + '.cjs'),
      path.resolve(dir, raw, 'index.js'),
    ];
    for (const c of candidates) {
      if (exists(c)) {
        return { kind: 'relative', raw, resolved: c };
      }
    }
    // Return unresolved relative
    return { kind: 'relative', raw, resolved: null };
  }

  if (path.isAbsolute(raw)) {
    return { kind: 'absolute', raw, resolved: raw };
  }

  // npm package — packageName is the bare name (handles @scope/pkg)
  const parts = raw.split('/');
  const packageName = raw.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  return { kind: 'npm', raw, packageName };
}

// ---------------------------------------------------------------------------
// File collection: all PORT targets
// ---------------------------------------------------------------------------

function collectPortTargets(root) {
  const hooksDir = path.join(root, '.claude', 'hooks');
  const hooksLibDir = path.join(root, '.claude', 'hooks', 'lib');
  const skillsDir = path.join(root, '.claude', 'skills');
  const agentsDir = path.join(root, '.claude', 'agents');
  const scriptsConfigDir = path.join(root, 'scripts', 'config');
  const scriptsDebtDir = path.join(root, 'scripts', 'debt');
  const scriptsDir = path.join(root, 'scripts');
  const scriptsLibDir = path.join(root, 'scripts', 'lib');

  const files = {
    hooks: [],
    hooksLib: [],
    skills: [],
    agents: [],
    scriptsConfig: [],
    scriptsDebt: [],
    scriptsRoot: [],
    scriptsLib: [],
  };

  // .claude/hooks/*.js (shallow — lib is separate)
  for (const f of collectFilesShallow(hooksDir, '.js')) {
    files.hooks.push(f);
  }

  // .claude/hooks/lib/*.js
  for (const f of collectFilesShallow(hooksLibDir, '.js')) {
    files.hooksLib.push(f);
  }

  // .claude/skills/*/ — gather SKILL.md and any .js inside each skill dir
  if (exists(skillsDir)) {
    let skillEntries;
    try {
      skillEntries = fs.readdirSync(skillsDir, { withFileTypes: true });
    } catch {
      skillEntries = [];
    }
    for (const entry of skillEntries) {
      if (!entry.isDirectory()) continue;
      const skillDir = path.join(skillsDir, entry.name);
      // Collect all .md files (SKILL.md etc.)
      for (const f of collectFilesShallow(skillDir, '.md')) {
        files.skills.push(f);
      }
      // Collect any .js helpers inside the skill dir
      for (const f of collectFiles(skillDir, '.js')) {
        files.skills.push(f);
      }
    }
  }

  // .claude/agents/*.md
  for (const f of collectFilesShallow(agentsDir, '.md')) {
    files.agents.push(f);
  }

  // scripts/config/*.js and *.json
  for (const f of collectFilesShallow(scriptsConfigDir, '.js')) {
    files.scriptsConfig.push(f);
  }
  for (const f of collectFilesShallow(scriptsConfigDir, '.json')) {
    files.scriptsConfig.push(f);
  }

  // scripts/debt/*.js
  for (const f of collectFilesShallow(scriptsDebtDir, '.js')) {
    files.scriptsDebt.push(f);
  }

  // scripts/lib/*.js
  for (const f of collectFilesShallow(scriptsLibDir, '.js')) {
    files.scriptsLib.push(f);
  }

  // scripts/*.js (root level only — named doc/ecosystem scripts)
  for (const f of collectFilesShallow(scriptsDir, '.js')) {
    files.scriptsRoot.push(f);
  }

  return files;
}

// ---------------------------------------------------------------------------
// Build dependency graph
// ---------------------------------------------------------------------------

// eslint-disable-next-line complexity -- buildGraph has inherent branching (complexity 18), refactoring would reduce readability
function buildGraph(sourceRoot) {
  const portTargets = collectPortTargets(sourceRoot);

  // Flatten all JS files that we will analyse
  const allJsFiles = [
    ...portTargets.hooks,
    ...portTargets.hooksLib,
    ...portTargets.skills.filter((f) => f.endsWith('.js')),
    ...portTargets.scriptsConfig.filter((f) => f.endsWith('.js')),
    ...portTargets.scriptsDebt,
    ...portTargets.scriptsRoot,
    ...portTargets.scriptsLib,
  ];

  // Key: normalised absolute path → node
  const graph = {};

  // Initialise nodes for every JS file
  for (const f of allJsFiles) {
    const key = normalise(f);
    if (!graph[key]) {
      graph[key] = {
        file: key,
        category: categorise(f, portTargets),
        requires: [], // resolved absolute paths of local deps
        npmPackages: [], // npm package names
        builtins: [], // node built-in names
        unresolvedRelative: [], // relative specifiers that couldn't be resolved
        dependents: [], // files that import THIS file
        parseError: false,
      };
    }
  }

  // Parse each JS file
  for (const f of allJsFiles) {
    const key = normalise(f);
    const source = readFileSafe(f);
    if (source === null) {
      graph[key].parseError = true;
      continue;
    }

    let specifiers;
    try {
      specifiers = extractSpecifiers(source);
    } catch {
      graph[key].parseError = true;
      continue;
    }

    for (const raw of specifiers) {
      const classified = classifySpecifier(raw, f);

      if (classified.kind === 'builtin') {
        if (!graph[key].builtins.includes(classified.packageName)) {
          graph[key].builtins.push(classified.packageName);
        }
        continue;
      }

      if (classified.kind === 'npm') {
        if (!graph[key].npmPackages.includes(classified.packageName)) {
          graph[key].npmPackages.push(classified.packageName);
        }
        continue;
      }

      if (classified.kind === 'relative' || classified.kind === 'absolute') {
        if (!classified.resolved) {
          if (!graph[key].unresolvedRelative.includes(raw)) {
            graph[key].unresolvedRelative.push(raw);
          }
          continue;
        }

        const depKey = normalise(classified.resolved);

        // Add resolved dep to requires list
        if (!graph[key].requires.includes(depKey)) {
          graph[key].requires.push(depKey);
        }

        // Ensure the dep node exists (may be outside our initial set)
        if (!graph[depKey]) {
          graph[depKey] = {
            file: depKey,
            category: categorise(classified.resolved, portTargets),
            requires: [],
            npmPackages: [],
            builtins: [],
            unresolvedRelative: [],
            dependents: [],
            parseError: false,
            external: true, // not in our primary scan set
          };
        }

        // Register reverse edge
        if (!graph[depKey].dependents.includes(key)) {
          graph[depKey].dependents.push(key);
        }
      }
    }
  }

  return { graph, portTargets };
}

/** Assign a category label to a file based on which bucket it came from. */
function categorise(filePath, portTargets) {
  const n = normalise(filePath);
  if (portTargets.hooksLib.some((f) => normalise(f) === n)) return 'hook-lib';
  if (portTargets.hooks.some((f) => normalise(f) === n)) return 'hook';
  if (portTargets.skills.some((f) => normalise(f) === n)) return 'skill';
  if (portTargets.agents.some((f) => normalise(f) === n)) return 'agent';
  if (portTargets.scriptsConfig.some((f) => normalise(f) === n)) return 'scripts-config';
  if (portTargets.scriptsDebt.some((f) => normalise(f) === n)) return 'scripts-debt';
  if (portTargets.scriptsLib.some((f) => normalise(f) === n)) return 'scripts-lib';
  if (portTargets.scriptsRoot.some((f) => normalise(f) === n)) return 'scripts-root';
  return 'transitive';
}

// ---------------------------------------------------------------------------
// Circular dependency detection (DFS)
// ---------------------------------------------------------------------------

function detectCircles(graph) {
  const visited = new Set();
  const stack = new Set();
  const circles = [];

  function dfs(node, chain) {
    if (stack.has(node)) {
      // Found cycle — extract the cycle portion of the chain
      const cycleStart = chain.indexOf(node);
      circles.push(chain.slice(cycleStart).concat(node));
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);
    chain.push(node);

    const nodeData = graph[node];
    if (nodeData) {
      for (const dep of nodeData.requires) {
        dfs(dep, chain);
      }
    }

    chain.pop();
    stack.delete(node);
  }

  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return circles;
}

// ---------------------------------------------------------------------------
// Compute summary statistics
// ---------------------------------------------------------------------------

function computeSummary(graph, portTargets, circles) {
  // Shared libraries — files that have 2+ dependents and are in lib/config buckets
  const sharedLibs = [];
  for (const [key, node] of Object.entries(graph)) {
    if (node.dependents.length >= 1) {
      const isLib =
        node.category === 'hook-lib' ||
        node.category === 'scripts-lib' ||
        node.category === 'scripts-config' ||
        key.includes('/lib/') ||
        key.includes('/config/');
      if (isLib) {
        sharedLibs.push({
          file: key,
          category: node.category,
          dependentCount: node.dependents.length,
          dependents: node.dependents,
        });
      }
    }
  }
  sharedLibs.sort((a, b) => b.dependentCount - a.dependentCount);

  // Aggregate npm packages across all files
  const npmPackageMap = {};
  for (const node of Object.values(graph)) {
    for (const pkg of node.npmPackages) {
      if (!npmPackageMap[pkg]) npmPackageMap[pkg] = { packageName: pkg, usedBy: [] };
      npmPackageMap[pkg].usedBy.push(node.file);
    }
  }
  const npmPackages = Object.values(npmPackageMap).sort(
    (a, b) => b.usedBy.length - a.usedBy.length,
  );

  // File counts per category
  const categoryCounts = {};
  for (const node of Object.values(graph)) {
    categoryCounts[node.category] = (categoryCounts[node.category] || 0) + 1;
  }

  // All files that need to be ported (non-transitive)
  const portFiles = Object.values(graph)
    .filter((n) => !n.external)
    .map((n) => ({
      file: n.file,
      category: n.category,
      dependencyCount: n.requires.length,
      dependentCount: n.dependents.length,
      npmPackages: n.npmPackages,
      unresolvedRelative: n.unresolvedRelative,
      parseError: n.parseError,
    }))
    .sort((a, b) => a.file.localeCompare(b.file));

  return {
    portFiles,
    sharedLibraries: sharedLibs,
    npmPackages,
    categoryCounts,
    circularDependencies: circles,
  };
}

// ---------------------------------------------------------------------------
// Non-JS files (agents, skill MDs, config JSONs) — just list them
// ---------------------------------------------------------------------------

function collectNonJsPortTargets(portTargets) {
  return {
    agents: portTargets.agents.map(normalise),
    skillMarkdown: portTargets.skills.filter((f) => f.endsWith('.md')).map(normalise),
    configJson: portTargets.scriptsConfig.filter((f) => f.endsWith('.json')).map(normalise),
    skillDirectories: [...new Set(portTargets.skills.map((f) => normalise(path.dirname(f))))],
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  if (!exists(SOURCE_ROOT)) {
    process.stderr.write(`ERROR: Source root not found: ${SOURCE_ROOT}\n`);
    process.exit(1);
  }

  process.stderr.write(`Scanning: ${SOURCE_ROOT}\n`);

  const { graph, portTargets } = buildGraph(SOURCE_ROOT);
  const circles = detectCircles(graph);
  const summary = computeSummary(graph, portTargets, circles);
  const nonJs = collectNonJsPortTargets(portTargets);

  const output = {
    meta: {
      sourceRoot: normalise(SOURCE_ROOT),
      generatedAt: new Date().toISOString(),
      totalJsFilesAnalysed: Object.keys(graph).length,
      circularDependencyCount: circles.length,
    },
    summary: {
      categoryCounts: summary.categoryCounts,
      totalPortFiles: summary.portFiles.length,
      totalSharedLibraries: summary.sharedLibraries.length,
      totalNpmPackages: summary.npmPackages.length,
      totalCircularDependencies: circles.length,
    },
    portFiles: summary.portFiles,
    nonJsPortTargets: nonJs,
    sharedLibraries: summary.sharedLibraries,
    npmPackages: summary.npmPackages,
    circularDependencies: summary.circularDependencies,
    fullGraph: Object.fromEntries(
      Object.entries(graph).map(([k, v]) => [
        k,
        {
          file: v.file,
          category: v.category,
          requires: v.requires,
          npmPackages: v.npmPackages,
          builtins: v.builtins,
          unresolvedRelative: v.unresolvedRelative,
          dependents: v.dependents,
          parseError: v.parseError || false,
          external: v.external || false,
        },
      ]),
    ),
  };

  const json = prettyFlag ? JSON.stringify(output, null, 2) : JSON.stringify(output);

  process.stdout.write(json + '\n');
}

main();
