/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Content Quality & Compliance Checker — Domain 3 (D3)
 *
 * 8.  Header & Frontmatter Compliance
 * 9.  Formatting Consistency
 * 10. Content Freshness
 */

"use strict";

/* eslint-disable no-unused-vars -- safeRequire is a safety wrapper */
function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[content-quality] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { execFileSync } = safeRequire("node:child_process");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "content_quality";

/** Max file size for safe reads (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Run all content quality checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  // Collect doc files for analysis
  const docFiles = collectDocFiles(rootDir);

  // ── Category 8: Header & Frontmatter Compliance ─────────────────────────
  scores.header_frontmatter_compliance = checkHeaderCompliance(rootDir, docFiles, findings);

  // ── Category 9: Formatting Consistency ──────────────────────────────────
  scores.formatting_consistency = checkFormattingConsistency(rootDir, docFiles, findings);

  // ── Category 10: Content Freshness ──────────────────────────────────────
  scores.content_freshness = checkContentFreshness(rootDir, docFiles, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category 8: Header & Frontmatter Compliance ──────────────────────────

function checkHeaderCompliance(rootDir, docFiles, findings) {
  const bench = BENCHMARKS.header_frontmatter_compliance;

  let checked = 0;
  let compliant = 0;
  const nonCompliant = [];

  for (const docPath of docFiles) {
    // Only check docs/ and root .md files, skip generated/archived
    if (docPath.includes("/archive/") || docPath.includes("/archived/")) continue;
    if (docPath.includes("node_modules")) continue;

    const fullPath = path.join(rootDir, docPath);
    const content = safeReadFile(fullPath);
    if (!content) continue;

    checked++;
    const issues = [];

    // Check 1: Must have a title heading (# Title)
    const hasTitle = /^#\s+.+$/m.test(content);
    if (!hasTitle) {
      issues.push("missing title heading");
    }

    // Check 2: For docs/ files, check for Purpose section or frontmatter
    if (docPath.startsWith("docs/") && !docPath.includes("/audits/")) {
      const hasPurpose = /^##\s+Purpose/m.test(content);
      const hasFrontmatter = /^---\s*\n[\s\S]*?\n---/m.test(content);
      const hasDescription = /^description:/m.test(content);
      if (!hasPurpose && !hasFrontmatter && !hasDescription) {
        // Only flag if it's a significant doc (>10 lines)
        const lineCount = content.split("\n").length;
        if (lineCount > 10) {
          issues.push("missing Purpose section or frontmatter");
        }
      }
    }

    // Check 3: For docs/ files, check for Version History
    if (
      docPath.startsWith("docs/") &&
      !docPath.includes("/audits/") &&
      !docPath.includes("/templates/")
    ) {
      const hasVersionHistory = /^##\s+Version History/m.test(content);
      const hasChangelog = /^##\s+Changelog/m.test(content);
      if (!hasVersionHistory && !hasChangelog) {
        const lineCount = content.split("\n").length;
        if (lineCount > 20) {
          issues.push("missing Version History section");
        }
      }
    }

    if (issues.length === 0) {
      compliant++;
    } else {
      nonCompliant.push({ path: docPath, issues });
    }
  }

  const compliantPct = checked > 0 ? Math.round((compliant / checked) * 100) : 100;
  const result = scoreMetric(compliantPct, bench.compliant_pct, "higher-is-better");

  if (nonCompliant.length > 0) {
    const sample = nonCompliant
      .slice(0, 5)
      .map((n) => `${n.path}: ${n.issues.join(", ")}`)
      .join("; ");
    const extra = nonCompliant.length > 5 ? ` (+${nonCompliant.length - 5} more)` : "";
    findings.push({
      id: "DEA-300",
      category: "header_frontmatter_compliance",
      domain: DOMAIN,
      severity: nonCompliant.length > 10 ? "warning" : "info",
      message: `${nonCompliant.length} document(s) missing required header elements`,
      details: `Non-compliant: ${sample}${extra}`,
      impactScore: nonCompliant.length > 10 ? 50 : 30,
      frequency: nonCompliant.length,
      blastRadius: 2,
      patchType: "add_header",
      patchTarget: "Multiple files",
      patchContent: "Add missing title, Purpose, or Version History sections",
      patchImpact: "Improve documentation consistency and discoverability",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: { compliantPct, checked, compliant, nonCompliant: nonCompliant.length },
  };
}

// ── Category 9: Formatting Consistency ────────────────────────────────────

function checkFormattingConsistency(rootDir, docFiles, findings) {
  const bench = BENCHMARKS.formatting_consistency;

  let checked = 0;
  let consistent = 0;
  const inconsistent = [];

  for (const docPath of docFiles) {
    if (docPath.includes("/archive/") || docPath.includes("/archived/")) continue;

    const fullPath = path.join(rootDir, docPath);
    const content = safeReadFile(fullPath);
    if (!content || content.split("\n").length < 5) continue;

    checked++;
    const issues = [];

    // Check 1: Heading level jumps (e.g., # to ### without ##)
    const headings = content.match(/^#{1,6}\s/gm) || [];
    let prevLevel = 0;
    for (const h of headings) {
      const level = h.trim().length;
      if (prevLevel > 0 && level > prevLevel + 1) {
        issues.push("heading level jump");
        break;
      }
      prevLevel = level;
    }

    // Check 2: Code blocks without language tags
    const codeBlocks = content.match(/^```\s*$/gm);
    if (codeBlocks && codeBlocks.length > 1) {
      const untaggedCount = Math.ceil(codeBlocks.length / 2);
      issues.push(`${untaggedCount} code block(s) without language tag`);
    }

    // Check 3: Inconsistent list markers (mixing - and * in same section)
    const hasDashLists = /^[\t ]*-\s/m.test(content);
    const hasStarLists = /^[\t ]*\*\s/m.test(content);
    if (hasDashLists && hasStarLists) {
      issues.push("mixed list markers (- and *)");
    }

    if (issues.length === 0) {
      consistent++;
    } else {
      inconsistent.push({ path: docPath, issues });
    }
  }

  const consistentPct = checked > 0 ? Math.round((consistent / checked) * 100) : 100;
  const result = scoreMetric(consistentPct, bench.consistent_pct, "higher-is-better");

  if (inconsistent.length > 0) {
    const sample = inconsistent
      .slice(0, 5)
      .map((n) => `${n.path}: ${n.issues.join(", ")}`)
      .join("; ");
    const extra = inconsistent.length > 5 ? ` (+${inconsistent.length - 5} more)` : "";
    findings.push({
      id: "DEA-310",
      category: "formatting_consistency",
      domain: DOMAIN,
      severity: "info",
      message: `${inconsistent.length} document(s) with formatting inconsistencies`,
      details: `Inconsistent: ${sample}${extra}`,
      impactScore: 25,
      frequency: inconsistent.length,
      blastRadius: 1,
      patchType: "fix_formatting",
      patchTarget: "Multiple files",
      patchContent:
        "Fix heading levels, add language tags to code blocks, standardize list markers",
      patchImpact: "Improve documentation readability and consistency",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: { consistentPct, checked, consistent, inconsistent: inconsistent.length },
  };
}

// ── Category 10: Content Freshness ────────────────────────────────────────

function checkContentFreshness(rootDir, docFiles, findings) {
  const bench = BENCHMARKS.content_freshness;

  let checked = 0;
  let fresh = 0;
  const stale = [];

  // Get current date for comparison
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  for (const docPath of docFiles) {
    // Only check main docs, skip archived/audit output
    if (!docPath.startsWith("docs/") && !docPath.endsWith(".md")) continue;
    if (docPath.includes("/archive/") || docPath.includes("/archived/")) continue;
    if (docPath.includes("/audits/")) continue;

    const fullPath = path.join(rootDir, docPath);
    const content = safeReadFile(fullPath);
    if (!content || content.split("\n").length < 10) continue;

    checked++;

    // Get doc's last modified date via git
    const docDate = getGitLastModified(rootDir, docPath);
    if (!docDate) {
      fresh++; // Can't determine, benefit of doubt
      continue;
    }

    // Check if doc references code files
    const codeRefs = extractCodeReferences(content);
    if (codeRefs.length === 0) {
      fresh++; // No code references, can't be stale relative to code
      continue;
    }

    // Find the most recent code file modification
    let newestCodeDate = 0;
    let newestCodeFile = "";
    for (const codeRef of codeRefs) {
      const absRef = path.resolve(rootDir, codeRef);
      const relRef = path.relative(rootDir, absRef).replace(/\\/g, "/");

      // Only allow references within repo root
      if (/^\.\.(?:\/|$)/.test(relRef) || relRef === "") continue;

      const codeDate = getGitLastModified(rootDir, relRef);
      if (codeDate && codeDate > newestCodeDate) {
        newestCodeDate = codeDate;
        newestCodeFile = codeRef;
      }
    }

    if (newestCodeDate === 0) {
      fresh++; // Referenced code files not found
      continue;
    }

    // Is the doc older than its referenced code by >30 days?
    if (newestCodeDate - docDate > thirtyDaysMs) {
      stale.push({
        doc: docPath,
        docAge: Math.round((now - docDate) / (24 * 60 * 60 * 1000)),
        codeFile: newestCodeFile,
        codeAge: Math.round((now - newestCodeDate) / (24 * 60 * 60 * 1000)),
      });
    } else {
      fresh++;
    }
  }

  const freshPct = checked > 0 ? Math.round((fresh / checked) * 100) : 100;
  const result = scoreMetric(freshPct, bench.fresh_pct, "higher-is-better");

  if (stale.length > 0) {
    const sample = stale
      .slice(0, 3)
      .map((s) => `${s.doc} (${s.docAge}d old, code ${s.codeFile} is ${s.codeAge}d old)`)
      .join("; ");
    const extra = stale.length > 3 ? ` (+${stale.length - 3} more)` : "";
    findings.push({
      id: "DEA-320",
      category: "content_freshness",
      domain: DOMAIN,
      severity: stale.length > 5 ? "warning" : "info",
      message: `${stale.length} document(s) are >30 days behind their referenced code`,
      details: `Stale: ${sample}${extra}`,
      impactScore: stale.length > 5 ? 55 : 35,
      frequency: stale.length,
      blastRadius: 2,
      patchType: "update_content",
      patchTarget: "Multiple files",
      patchContent: "Review and update documentation to match current code",
      patchImpact: "Keep documentation in sync with codebase",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: { freshPct, checked, fresh, stale: stale.length },
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
 * Collect doc files from docs/ and root.
 */
function collectDocFiles(rootDir) {
  const files = [];

  // Root .md files
  try {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(entry.name);
      }
    }
  } catch {
    // Not accessible
  }

  // docs/ recursive
  function walkDir(dir, prefix) {
    try {
      // Path containment: ensure dir is inside rootDir
      const rel = path.relative(rootDir, dir);
      if (/^\.\.(?:[\\/]|$)/.test(rel)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name[0] === "." || entry.name === "node_modules") continue;
        const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walkDir(path.join(dir, entry.name), relPath);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          files.push(`docs/${relPath}`);
        }
      }
    } catch {
      // Not accessible
    }
  }

  const docsDir = path.join(rootDir, "docs");
  try {
    if (fs.existsSync(docsDir)) {
      walkDir(docsDir, "");
    }
  } catch {
    // Not accessible
  }

  return files;
}

/**
 * Get last git commit date for a file (returns timestamp or null).
 */
function getGitLastModified(rootDir, filePath) {
  try {
    const result = execFileSync("git", ["log", "-1", "--format=%ct", "--", filePath], {
      cwd: rootDir,
      encoding: "utf8",
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    if (result) {
      return parseInt(result, 10) * 1000;
    }
  } catch {
    // Git command failed
  }
  return null;
}

/**
 * Extract code file references from doc content.
 * Looks for file paths in backticks, code blocks, and link targets.
 */
function extractCodeReferences(content) {
  const refs = new Set();

  // Match file paths in backticks: `src/something.ts`, `scripts/foo.js`
  const backtickPattern = /`([^`]*\.(ts|tsx|js|jsx|json|mjs|cjs))`/g;
  for (const match of content.matchAll(backtickPattern)) {
    const ref = match[1];
    if (!ref.startsWith("http") && !ref.includes(" ") && ref.length < 200) {
      refs.add(ref);
    }
  }

  // Match link targets pointing to code: [text](path.ts)
  const linkPattern = /\[([^\]]*)\]\(([^)]+\.(ts|tsx|js|jsx|json))\)/g;
  for (const match of content.matchAll(linkPattern)) {
    const ref = match[2];
    if (!ref.startsWith("http")) {
      refs.add(ref.split("#")[0]);
    }
  }

  return [...refs];
}

module.exports = { run, DOMAIN };
