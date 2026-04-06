/* global __dirname */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { sanitizeError } = require("./sanitize-error.js");
const { validatePathInDir } = require("./security-helpers.js");

const ROOT = path.join(__dirname, "..", "..");

/**
 * Collect JS require/import references from .js files in a directory (recursive).
 * Returns Map<absoluteSourceFile, Set<resolvedTargetPath>>
 */
function extractJsImports(file, content) {
  const requireRe = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  const importRe = /(?:import|from)\s+['"]([^'"]+)['"]/g;
  const outgoing = new Set();
  for (const re of [requireRe, importRe]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content)) !== null) {
      if (m[1].startsWith(".")) {
        const resolved = resolveRelative(file, m[1]);
        if (resolved) outgoing.add(resolved);
      }
    }
  }
  return outgoing;
}

function collectJsReferences(dir) {
  const refs = new Map();
  const files = walkDir(path.join(ROOT, dir), [".js", ".mjs", ".cjs"]);
  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch (err) {
      console.warn(`  warn: cannot read ${path.relative(ROOT, file)}: ${sanitizeError(err)}`);
      continue;
    }
    refs.set(file, extractJsImports(file, content));
  }
  return refs;
}

/**
 * Collect references from Markdown files — slash-commands, backtick commands,
 * agent names, markdown links, quoted paths.
 * Returns Map<absoluteSourceFile, Set<string>> where values are reference strings
 * (not necessarily resolved paths — caller classifies them).
 */
function collectMdReferences(dir) {
  const refs = new Map();
  const absDir = path.join(ROOT, dir);
  const files = walkDir(absDir, ".md");

  // Patterns for different reference types
  const patterns = [
    // Markdown links: [text](relative/path)
    /\[(?:[^\]]*)\]\(([^)]+)\)/g,
    // Backtick commands: `node scripts/path.js` — capture first token only (strip args)
    /`(?:node|npx)\s+([^\s`]+)/g,
    // Quoted paths: "scripts/foo.js" or '.claude/hooks/bar.js' (with or without ./ prefix)
    /["'](?:\.\/)?((scripts|\.claude|\.github|docs|\.planning|\.research)\/[^"'\s]+)["']/g,
    // Slash-commands: /skill-name (word boundary, not in URLs)
    /(?:^|\s)\/([a-z][\w-]*(?::[a-z][\w-]*)?)(?:\s|$|[.,;)])/gm,
    // Agent subagent_type references: subagent_type=name or subagent_type="name"
    /subagent_type\s*[=:]\s*["']?([A-Za-z][\w-]*)["']?/g,
    // Spawn agent references: spawn/launch/use X agent
    /(?:spawn|launch|use)\s+(?:the\s+)?[`"']?([a-z][\w-]+)[`"']?\s+agent/gi,
  ];

  for (const file of files) {
    const found = new Set();
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch (err) {
      console.warn(`  warn: cannot read ${path.relative(ROOT, file)}: ${sanitizeError(err)}`);
      continue;
    }

    for (const re of patterns) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(content)) !== null) {
        const ref = m[1].trim();
        if (ref && ref.length > 1) found.add(ref);
      }
    }
    refs.set(file, found);
  }
  return refs;
}

/**
 * Collect references from JSON config files (settings.json, package.json).
 * Returns Map<absoluteSourceFile, Set<string>>
 */
function collectJsonReferences(filePath) {
  const refs = new Map();
  let safePath;
  try {
    safePath = validatePathInDir(ROOT, filePath);
  } catch {
    return refs;
  }
  const absPath = path.join(ROOT, safePath);
  let content;
  try {
    content = fs.readFileSync(absPath, "utf8");
  } catch (err) {
    console.warn(`  warn: cannot read ${filePath}: ${sanitizeError(err)}`);
    return refs;
  }

  try {
    const found = new Set();
    // Extract all string values that look like file paths or commands
    const pathRe = /["']((?:scripts|\.claude|\.github)\/[^"'\s]+)["']/g;
    let m;
    while ((m = pathRe.exec(content)) !== null) {
      found.add(m[1].trim());
    }
    refs.set(absPath, found);
  } catch (err) {
    console.warn(`  warn: cannot parse ${filePath}: ${sanitizeError(err)}`);
  }
  return refs;
}

/**
 * Collect references from YAML workflow files.
 * Returns Map<absoluteSourceFile, Set<string>>
 */
function collectYamlReferences(dir) {
  const refs = new Map();
  const absDir = path.join(ROOT, dir);
  let files;
  try {
    files = fs.readdirSync(absDir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
  } catch {
    return refs;
  }

  const scriptRe = /(?:node|npx)\s+(scripts\/[^\s;|&]+)/g;
  const npmRunRe = /npm\s+run\s+([\w:.-]+)/g;

  for (const file of files) {
    const safeFile = validatePathInDir(absDir, file); // containment check
    const absFile = path.join(absDir, safeFile);
    const found = new Set();
    let content;
    try {
      content = fs.readFileSync(absFile, "utf8");
    } catch (err) {
      console.warn(`  warn: cannot read ${file}: ${sanitizeError(err)}`);
      continue;
    }

    // Extract script paths from run: blocks
    scriptRe.lastIndex = 0;
    let m;
    while ((m = scriptRe.exec(content)) !== null) {
      found.add(m[1].trim());
    }

    // Extract npm run commands
    npmRunRe.lastIndex = 0;
    while ((m = npmRunRe.exec(content)) !== null) {
      found.add(`npm:${m[1].trim()}`);
    }

    refs.set(absFile, found);
  }
  return refs;
}

/**
 * Add a single edge to the incoming-edge map.
 */
function addEdge(incoming, target, source) {
  if (!incoming.has(target)) incoming.set(target, new Set());
  incoming.get(target).add(source);
}

/**
 * Merge direct edges (JS require/import) into the graph.
 */
function mergeDirectEdges(incoming, refs) {
  for (const [source, targets] of refs) {
    for (const target of targets) {
      addEdge(incoming, target, source);
    }
  }
}

/**
 * Merge refs that need path resolution + raw-key storage into the graph.
 */
function mergeResolvedEdges(incoming, refs) {
  for (const [source, targets] of refs) {
    for (const ref of targets) {
      const resolved = resolveAsFilePath(ref);
      if (resolved) addEdge(incoming, resolved, source);
      addEdge(incoming, `ref:${ref}`, source);
    }
  }
}

/**
 * Build a unified incoming-edge graph: Map<targetFile, Set<sourceFile>>
 * A target with zero incoming edges is an orphan candidate.
 */
function buildGraph() {
  console.log("Building cross-format reference graph...");

  const incoming = new Map();

  // 1. JS references (scripts, hooks)
  for (const dir of ["scripts", ".claude/hooks"]) {
    mergeDirectEdges(incoming, collectJsReferences(dir));
  }

  // 2. Markdown references (skills, agents, docs)
  for (const dir of [".claude/skills", ".claude/agents", "docs"]) {
    mergeResolvedEdges(incoming, collectMdReferences(dir));
  }

  // 3. JSON config references
  for (const file of [".claude/settings.json", "package.json"]) {
    mergeResolvedEdges(incoming, collectJsonReferences(file));
  }

  // 4. YAML workflow references
  mergeResolvedEdges(incoming, collectYamlReferences(".github/workflows"));

  console.log(`  Graph built: ${incoming.size} nodes with incoming edges`);
  return incoming;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Walk a directory recursively, collecting files with the given extension.
 */
function walkDir(dir, ext) {
  const exts = Array.isArray(ext) ? ext : [ext];
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "dist-tests")
        continue;
      results.push(...walkDir(full, exts));
    } else if (exts.some((e) => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Resolve a relative require/import specifier to an absolute path.
 */
function resolveRelative(fromFile, spec) {
  const dir = path.dirname(fromFile);
  const candidates = [
    path.join(dir, spec),
    path.join(dir, spec + ".js"),
    path.join(dir, spec + ".cjs"),
    path.join(dir, spec + ".mjs"),
    path.join(dir, spec, "index.js"),
  ];
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isFile()) return c;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Try to resolve a string reference as a file path relative to ROOT.
 */
function resolveAsFilePath(ref) {
  if (!ref || typeof ref !== "string") return null;
  // Strip leading ./ if present
  const cleaned = ref.replace(/^\.\//, "");
  // Skip URLs, anchors, mailto
  if (/^https?:\/\//.test(cleaned) || cleaned.startsWith("#") || cleaned.startsWith("mailto:"))
    return null;
  // Strip anchor fragments from markdown links
  const noAnchor = cleaned.split("#")[0];
  if (!noAnchor) return null;

  // Path containment check (CODE_PATTERNS.md)
  try {
    validatePathInDir(ROOT, noAnchor);
  } catch {
    return null;
  }

  const abs = path.join(ROOT, noAnchor);
  try {
    fs.statSync(abs);
    return abs;
  } catch {
    // file does not exist
  }
  return null;
}

module.exports = {
  buildGraph,
  collectJsReferences,
  collectMdReferences,
  collectJsonReferences,
  collectYamlReferences,
  walkDir,
  resolveAsFilePath,
  ROOT,
};
