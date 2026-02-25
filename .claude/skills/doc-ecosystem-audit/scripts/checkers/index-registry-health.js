/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Index & Registry Health Checker — Domain 1 (D1)
 *
 * 1. Index-Filesystem Sync
 * 2. Index Metadata Accuracy
 * 3. Orphaned Documents
 */

"use strict";

/* eslint-disable no-unused-vars -- safeRequire is a safety wrapper */
function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[index-registry-health] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "index_registry_health";

/** Max file size for safe reads (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Run all index & registry health checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  // Load DOCUMENTATION_INDEX.md
  const indexPath = path.join(rootDir, "DOCUMENTATION_INDEX.md");
  const indexContent = safeReadFile(indexPath);

  // ── Category 1: Index-Filesystem Sync ───────────────────────────────────
  scores.index_filesystem_sync = checkIndexFilesystemSync(rootDir, indexContent, findings);

  // ── Category 2: Index Metadata Accuracy ─────────────────────────────────
  scores.index_metadata_accuracy = checkIndexMetadataAccuracy(rootDir, indexContent, findings);

  // ── Category 3: Orphaned Documents ──────────────────────────────────────
  scores.orphaned_documents = checkOrphanedDocuments(rootDir, indexContent, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category 1: Index-Filesystem Sync ─────────────────────────────────────

function checkIndexFilesystemSync(rootDir, indexContent, findings) {
  const bench = BENCHMARKS.index_filesystem_sync;

  if (!indexContent) {
    findings.push({
      id: "DEA-100",
      category: "index_filesystem_sync",
      domain: DOMAIN,
      severity: "error",
      message: "DOCUMENTATION_INDEX.md not found or empty",
      details: "The documentation index file is missing. Cannot verify filesystem sync.",
      impactScore: 95,
      frequency: 1,
      blastRadius: 5,
      patchType: "command",
      patchContent: "npm run docs:index",
      patchImpact: "Regenerate the documentation index",
    });
    return { score: 0, rating: "poor", metrics: { syncPct: 0, indexedCount: 0, onDiskCount: 0 } };
  }

  // Extract file paths from index (markdown links like [title](path))
  const indexedPaths = extractIndexedPaths(indexContent);

  // Scan docs/ for all .md files
  const docsOnDisk = scanDocsDirectory(rootDir);

  // Also include root-level .md files referenced in the index
  const rootMdFiles = scanRootMdFiles(rootDir);
  const allOnDisk = new Set([...docsOnDisk, ...rootMdFiles]);

  // Check forward: indexed paths that don't exist on disk
  const missingOnDisk = [];
  for (const indexedPath of indexedPaths) {
    const fullPath = path.join(rootDir, indexedPath);
    try {
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) {
        missingOnDisk.push(indexedPath);
      }
    } catch {
      missingOnDisk.push(indexedPath);
    }
  }

  // Check reverse: .md files on disk not in index
  const indexedSet = new Set(indexedPaths.map((p) => p.replace(/\\/g, "/")));
  const notInIndex = [];
  for (const diskFile of allOnDisk) {
    const normalized = diskFile.replace(/\\/g, "/");
    if (!indexedSet.has(normalized)) {
      notInIndex.push(normalized);
    }
  }

  // Calculate sync percentage
  const allUnique = new Set([
    ...indexedPaths.map((p) => p.replace(/\\/g, "/")),
    ...Array.from(allOnDisk).map((p) => p.replace(/\\/g, "/")),
  ]);
  const total = allUnique.size;
  const synced = total - missingOnDisk.length - notInIndex.length;
  const syncPct = total > 0 ? Math.round((Math.max(0, synced) / total) * 100) : 100;

  const result = scoreMetric(syncPct, bench.sync_pct, "higher-is-better");

  if (missingOnDisk.length > 0) {
    const sample = missingOnDisk.slice(0, 5).join(", ");
    const extra = missingOnDisk.length > 5 ? ` (+${missingOnDisk.length - 5} more)` : "";
    findings.push({
      id: "DEA-101",
      category: "index_filesystem_sync",
      domain: DOMAIN,
      severity: "warning",
      message: `${missingOnDisk.length} path(s) listed in index but file not found on disk`,
      details: `Missing: ${sample}${extra}. These index entries point to nonexistent files.`,
      impactScore: 60,
      frequency: missingOnDisk.length,
      blastRadius: 3,
      patchType: "command",
      patchTarget: "DOCUMENTATION_INDEX.md",
      patchContent: "npm run docs:index",
      patchImpact: "Regenerate index to remove stale entries",
    });
  }

  if (notInIndex.length > 0) {
    const sample = notInIndex.slice(0, 5).join(", ");
    const extra = notInIndex.length > 5 ? ` (+${notInIndex.length - 5} more)` : "";
    findings.push({
      id: "DEA-102",
      category: "index_filesystem_sync",
      domain: DOMAIN,
      severity: "info",
      message: `${notInIndex.length} .md file(s) on disk not listed in documentation index`,
      details: `Unlisted: ${sample}${extra}. These files exist but are not tracked in the index.`,
      impactScore: 30,
      frequency: notInIndex.length,
      blastRadius: 2,
      patchType: "command",
      patchTarget: "DOCUMENTATION_INDEX.md",
      patchContent: "npm run docs:index",
      patchImpact: "Regenerate index to include new files",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      syncPct,
      indexedCount: indexedPaths.length,
      onDiskCount: allOnDisk.size,
      missingOnDisk: missingOnDisk.length,
      notInIndex: notInIndex.length,
    },
  };
}

// ── Category 2: Index Metadata Accuracy ────────────────────────────────────

function checkIndexMetadataAccuracy(rootDir, indexContent, findings) {
  const bench = BENCHMARKS.index_metadata_accuracy;

  if (!indexContent) {
    return { score: 0, rating: "poor", metrics: { accuracyPct: 0, checked: 0, accurate: 0 } };
  }

  // Extract entries with descriptions from index tables
  const entries = extractIndexEntries(indexContent);
  let checked = 0;
  let accurate = 0;
  const mismatches = [];

  for (const entry of entries) {
    if (!entry.path || !entry.description) continue;

    const fullPath = path.join(rootDir, entry.path);
    const fileContent = safeReadFile(fullPath);
    if (!fileContent) continue;

    checked++;

    // Extract first heading from file
    const headingMatch = fileContent.match(/^#\s+(.+)$/m);
    const fileTitle = headingMatch ? headingMatch[1].trim() : "";

    // Compare: title in index should roughly match file's first heading
    if (fileTitle && entry.title) {
      const similarity = computeSimilarity(entry.title, fileTitle);
      if (similarity > 0.3) {
        accurate++;
      } else {
        mismatches.push({ path: entry.path, indexTitle: entry.title, fileTitle });
      }
    } else {
      // If we can't compare titles, count as accurate (benefit of doubt)
      accurate++;
    }
  }

  const accuracyPct = checked > 0 ? Math.round((accurate / checked) * 100) : 100;
  const result = scoreMetric(accuracyPct, bench.accuracy_pct, "higher-is-better");

  if (mismatches.length > 0) {
    const sample = mismatches
      .slice(0, 3)
      .map((m) => `${m.path}: index="${m.indexTitle}" file="${m.fileTitle}"`)
      .join("; ");
    findings.push({
      id: "DEA-110",
      category: "index_metadata_accuracy",
      domain: DOMAIN,
      severity: "warning",
      message: `${mismatches.length} index entry title(s) don't match the file's actual heading`,
      details: `Mismatches: ${sample}${mismatches.length > 3 ? ` (+${mismatches.length - 3} more)` : ""}`,
      impactScore: 40,
      frequency: mismatches.length,
      blastRadius: 2,
      patchType: "command",
      patchTarget: "DOCUMENTATION_INDEX.md",
      patchContent: "npm run docs:index",
      patchImpact: "Regenerate index to fix title mismatches",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: { accuracyPct, checked, accurate, mismatches: mismatches.length },
  };
}

// ── Category 3: Orphaned Documents ────────────────────────────────────────

function checkOrphanedDocuments(rootDir, indexContent, findings) {
  const bench = BENCHMARKS.orphaned_documents;

  // Collect all .md files in docs/
  const docsOnDisk = scanDocsDirectory(rootDir);

  if (docsOnDisk.size === 0) {
    return { score: 100, rating: "good", metrics: { referencedPct: 100, total: 0, orphaned: 0 } };
  }

  // Build a set of all referenced paths from various sources
  const referencedPaths = new Set();

  // 1. From DOCUMENTATION_INDEX.md
  if (indexContent) {
    const indexPaths = extractIndexedPaths(indexContent);
    for (const p of indexPaths) {
      referencedPaths.add(p.replace(/\\/g, "/"));
    }
  }

  // 2. From CLAUDE.md
  const claudeMd = safeReadFile(path.join(rootDir, "CLAUDE.md"));
  if (claudeMd) {
    const refs = extractMarkdownLinks(claudeMd);
    for (const ref of refs) {
      referencedPaths.add(ref.replace(/\\/g, "/"));
    }
  }

  // 3. From AI_WORKFLOW.md
  const workflowMd = safeReadFile(path.join(rootDir, "AI_WORKFLOW.md"));
  if (workflowMd) {
    const refs = extractMarkdownLinks(workflowMd);
    for (const ref of refs) {
      referencedPaths.add(ref.replace(/\\/g, "/"));
    }
  }

  // 4. From all docs/ .md files (cross-references)
  for (const docPath of docsOnDisk) {
    const content = safeReadFile(path.join(rootDir, docPath));
    if (content) {
      const refs = extractMarkdownLinks(content);
      for (const ref of refs) {
        // Resolve relative paths
        const resolved = resolveRelativePath(docPath, ref);
        if (resolved) {
          referencedPaths.add(resolved.replace(/\\/g, "/"));
        }
      }
    }
  }

  // Check which docs are orphaned
  const orphaned = [];
  for (const docPath of docsOnDisk) {
    const normalized = docPath.replace(/\\/g, "/");
    if (!referencedPaths.has(normalized)) {
      orphaned.push(normalized);
    }
  }

  const total = docsOnDisk.size;
  const referenced = total - orphaned.length;
  const referencedPct = total > 0 ? Math.round((referenced / total) * 100) : 100;

  const result = scoreMetric(referencedPct, bench.referenced_pct, "higher-is-better");

  if (orphaned.length > 0) {
    const sample = orphaned.slice(0, 5).join(", ");
    const extra = orphaned.length > 5 ? ` (+${orphaned.length - 5} more)` : "";
    findings.push({
      id: "DEA-120",
      category: "orphaned_documents",
      domain: DOMAIN,
      severity: orphaned.length > 10 ? "warning" : "info",
      message: `${orphaned.length} document(s) in docs/ not referenced by any other file`,
      details: `Orphaned: ${sample}${extra}. These files may be unused or need cross-references.`,
      impactScore: orphaned.length > 10 ? 45 : 25,
      frequency: orphaned.length,
      blastRadius: 2,
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: { referencedPct, total, referenced, orphaned: orphaned.length },
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
 * Extract file paths from DOCUMENTATION_INDEX.md markdown table links.
 * Matches patterns like [title](path/to/file.md)
 */
function extractIndexedPaths(indexContent) {
  const paths = [];
  const linkPattern = /\[([^\]]*)\]\(([^)]+\.md)\)/g;
  for (const match of indexContent.matchAll(linkPattern)) {
    const linkPath = match[2];
    // Skip external links
    if (linkPath.startsWith("http://") || linkPath.startsWith("https://")) continue;
    // Skip anchors
    if (linkPath.startsWith("#")) continue;
    // Strip anchors from path
    const cleanPath = linkPath.split("#")[0];
    if (cleanPath) {
      paths.push(cleanPath);
    }
  }
  return [...new Set(paths)];
}

/**
 * Extract index entries with title, path, and description from table rows.
 */
function extractIndexEntries(indexContent) {
  const entries = [];
  const tableRowPattern = /\|\s*\[([^\]]*)\]\(([^)]+\.md)\)\s*\|\s*([^|]*)\|/g;
  for (const match of indexContent.matchAll(tableRowPattern)) {
    entries.push({
      title: match[1].trim(),
      path: match[2].trim().split("#")[0],
      description: match[3].trim(),
    });
  }
  return entries;
}

/**
 * Extract all markdown link paths from content.
 */
function extractMarkdownLinks(content) {
  const links = [];
  const linkPattern = /\[([^\]]*)\]\(([^)]+)\)/g;
  for (const match of content.matchAll(linkPattern)) {
    const linkPath = match[2];
    if (linkPath.startsWith("http://") || linkPath.startsWith("https://")) continue;
    if (linkPath.startsWith("#")) continue;
    const cleanPath = linkPath.split("#")[0];
    if (cleanPath) {
      links.push(cleanPath);
    }
  }
  return links;
}

/**
 * Scan docs/ directory recursively for .md files.
 * Returns relative paths from project root.
 */
function scanDocsDirectory(rootDir) {
  const files = new Set();
  const docsDir = path.join(rootDir, "docs");

  function walkDir(dir, prefix) {
    try {
      // Path containment: ensure dir is inside rootDir
      const rel = path.relative(rootDir, dir);
      if (/^\.\.(?:[\\/]|$)/.test(rel)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        // Skip node_modules, .git, and hidden dirs
        if (entry.name[0] === "." || entry.name === "node_modules") continue;
        const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walkDir(path.join(dir, entry.name), relPath);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          files.add(`docs/${relPath}`);
        }
      }
    } catch {
      // Directory not accessible
    }
  }

  try {
    if (fs.existsSync(docsDir)) {
      walkDir(docsDir, "");
    }
  } catch {
    // docs/ not accessible
  }

  return files;
}

/**
 * Scan root directory for .md files (non-recursive).
 */
function scanRootMdFiles(rootDir) {
  const files = new Set();
  try {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.add(entry.name);
      }
    }
  } catch {
    // Not accessible
  }
  return files;
}

/**
 * Resolve a relative path from a source file's location.
 */
function resolveRelativePath(sourcePath, relativePath) {
  try {
    if (path.isAbsolute(relativePath)) return relativePath.replace(/^[\\/]+/, "");
    const sourceDir = path.dirname(sourcePath);
    const resolved = path.normalize(path.join(sourceDir, relativePath)).replace(/\\/g, "/");
    // Path containment: reject if resolved escapes project root
    if (/^\.\.(?:[\\/]|$)/.test(resolved)) return null;
    return resolved;
  } catch {
    return null;
  }
}

/**
 * Simple word-overlap similarity between two strings (0-1).
 */
function computeSimilarity(str1, str2) {
  const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(Boolean));
  const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(Boolean));
  if (words1.size === 0 || words2.size === 0) return 0;
  let overlap = 0;
  for (const w of words1) {
    if (words2.has(w)) overlap++;
  }
  return overlap / Math.max(words1.size, words2.size);
}

module.exports = { run, DOMAIN };
