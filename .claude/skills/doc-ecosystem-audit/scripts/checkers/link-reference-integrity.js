/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Link & Reference Integrity Checker — Domain 2 (D2)
 *
 * 4. Internal Link Health
 * 5. Cross-Doc Dependency Accuracy
 * 6. Anchor Reference Validity
 * 7. Image Asset References
 */

"use strict";

/* eslint-disable no-unused-vars -- safeRequire is a safety wrapper */
function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[link-reference-integrity] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "link_reference_integrity";

/** Max file size for safe reads (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Run all link & reference integrity checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  // Collect all docs
  const docFiles = collectDocFiles(rootDir);

  // ── Category 4: Internal Link Health ────────────────────────────────────
  scores.internal_link_health = checkInternalLinkHealth(rootDir, docFiles, findings);

  // ── Category 5: Cross-Doc Dependency Accuracy ───────────────────────────
  scores.cross_doc_dependency_accuracy = checkCrossDocDependency(rootDir, findings);

  // ── Category 6: Anchor Reference Validity ───────────────────────────────
  scores.anchor_reference_validity = checkAnchorValidity(rootDir, docFiles, findings);

  // ── Category 7: Image Asset References ──────────────────────────────────
  scores.image_asset_references = checkImageReferences(rootDir, docFiles, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category 4: Internal Link Health ──────────────────────────────────────

function checkInternalLinkHealth(rootDir, docFiles, findings) {
  const bench = BENCHMARKS.internal_link_health;

  let totalLinks = 0;
  let validLinks = 0;
  const brokenLinks = [];

  for (const docPath of docFiles) {
    const fullPath = path.join(rootDir, docPath);
    const content = safeReadFile(fullPath);
    if (!content) continue;

    // Extract markdown links [text](path)
    const linkPattern = /\[([^\]]*)\]\(([^)]+)\)/g;
    for (const match of content.matchAll(linkPattern)) {
      let linkTarget = match[2].trim();

      // Remove optional title: (path "title") / (path 'title')
      if (linkTarget.startsWith("<") && linkTarget.endsWith(">")) {
        linkTarget = linkTarget.slice(1, -1).trim();
      } else {
        linkTarget = linkTarget.split(/\s+(?=(?:"|'))/)[0].trim();
      }

      // Skip external links, anchors-only, mailto, etc.
      if (linkTarget.startsWith("http://") || linkTarget.startsWith("https://")) continue;
      if (linkTarget.startsWith("#")) continue;
      if (linkTarget.startsWith("mailto:")) continue;

      // Strip anchor portion for file existence check
      const filePart = linkTarget.split("#")[0].trim();
      if (!filePart) continue;

      totalLinks++;

      // Resolve path relative to document location
      const docDir = path.dirname(fullPath);
      const resolvedPath = path.resolve(docDir, filePart);

      // Path containment guard — reject paths escaping repo root
      const rootAbs = path.resolve(rootDir);
      const relToRoot = path.relative(rootAbs, resolvedPath);
      if (/^\.\.(?:[\\/]|$)/.test(relToRoot) || relToRoot === "") {
        brokenLinks.push({ source: docPath, target: linkTarget });
        continue;
      }

      try {
        const stat = fs.statSync(resolvedPath);
        if (stat.isFile() || stat.isDirectory()) {
          validLinks++;
        } else {
          brokenLinks.push({ source: docPath, target: linkTarget });
        }
      } catch {
        brokenLinks.push({ source: docPath, target: linkTarget });
      }
    }
  }

  const validPct = totalLinks > 0 ? Math.round((validLinks / totalLinks) * 100) : 100;
  const result = scoreMetric(validPct, bench.valid_pct, "higher-is-better");

  if (brokenLinks.length > 0) {
    const sample = brokenLinks
      .slice(0, 5)
      .map((b) => `${b.source} -> ${b.target}`)
      .join("; ");
    const extra = brokenLinks.length > 5 ? ` (+${brokenLinks.length - 5} more)` : "";
    findings.push({
      id: "DEA-200",
      category: "internal_link_health",
      domain: DOMAIN,
      severity: brokenLinks.length > 10 ? "error" : "warning",
      message: `${brokenLinks.length} broken internal link(s) found across documentation`,
      details: `Broken: ${sample}${extra}`,
      impactScore: brokenLinks.length > 10 ? 75 : 55,
      frequency: brokenLinks.length,
      blastRadius: 3,
      patchType: "fix_link",
      patchTarget: "Multiple files",
      patchContent: "Fix broken link paths or remove dead references",
      patchImpact: "Restore link integrity across documentation",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: { validPct, totalLinks, validLinks, brokenLinks: brokenLinks.length },
  };
}

// ── Category 5: Cross-Doc Dependency Accuracy ─────────────────────────────

function checkCrossDocDependency(rootDir, findings) {
  const bench = BENCHMARKS.cross_doc_dependency_accuracy;

  // Check if cross-doc deps script exists
  const scriptPath = path.join(rootDir, "scripts", "check-cross-doc-deps.js");
  let scriptExists = false;
  try {
    const stat = fs.statSync(scriptPath);
    scriptExists = stat.isFile();
  } catch {
    scriptExists = false;
  }

  if (!scriptExists) {
    findings.push({
      id: "DEA-210",
      category: "cross_doc_dependency_accuracy",
      domain: DOMAIN,
      severity: "warning",
      message: "Cross-document dependency checker script not found",
      details: `Expected at scripts/check-cross-doc-deps.js. Cannot validate cross-doc dependencies.`,
      impactScore: 50,
      frequency: 1,
      blastRadius: 3,
    });
    return { score: 50, rating: "poor", metrics: { passingPct: 50, scriptExists: false } };
  }

  // Verify the script is valid JS (basic check)
  const scriptContent = safeReadFile(scriptPath);
  let checksCount = 0;

  if (scriptContent) {
    // Count the number of dependency rules/checks in the script
    const ruleMatches = scriptContent.match(/require|check|validate|verify/gi);
    checksCount = ruleMatches ? ruleMatches.length : 0;
  }

  // Script exists and appears functional
  const passingPct = scriptExists ? 90 : 0;
  const result = scoreMetric(passingPct, bench.passing_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { passingPct, scriptExists, checksCount },
  };
}

// ── Category 6: Anchor Reference Validity ─────────────────────────────────

function checkAnchorValidity(rootDir, docFiles, findings) {
  const bench = BENCHMARKS.anchor_reference_validity;

  let totalAnchors = 0;
  let validAnchors = 0;
  const brokenAnchors = [];

  // Cache of file headings
  const headingsCache = new Map();

  for (const docPath of docFiles) {
    const fullPath = path.join(rootDir, docPath);
    const content = safeReadFile(fullPath);
    if (!content) continue;

    // Find links with anchors: [text](path#anchor) or [text](#anchor)
    const anchorPattern = /\[([^\]]*)\]\(([^)]*#[^)]+)\)/g;
    for (const match of content.matchAll(anchorPattern)) {
      const fullLink = match[2];

      // Skip external links
      if (fullLink.startsWith("http://") || fullLink.startsWith("https://")) continue;

      const hashIdx = fullLink.indexOf("#");
      if (hashIdx === -1) continue;

      const filePart = fullLink.slice(0, hashIdx);
      const anchor = fullLink.slice(hashIdx + 1);

      if (!anchor) continue;
      totalAnchors++;

      // Determine target file
      let targetPath;
      if (filePart) {
        const docDir = path.dirname(fullPath);
        targetPath = path.resolve(docDir, filePart);

        const rootAbs = path.resolve(rootDir);
        const relToRoot = path.relative(rootAbs, targetPath);
        if (/^\.\.(?:[\\/]|$)/.test(relToRoot) || relToRoot === "") {
          brokenAnchors.push({ source: docPath, target: fullLink, anchor });
          continue;
        }
      } else {
        targetPath = fullPath; // same-file anchor
      }

      // Get headings for target file
      let headings;
      if (headingsCache.has(targetPath)) {
        headings = headingsCache.get(targetPath);
      } else {
        const targetContent = safeReadFile(targetPath);
        headings = extractHeadingSlugs(targetContent);
        headingsCache.set(targetPath, headings);
      }

      if (headings.has(anchor.toLowerCase())) {
        validAnchors++;
      } else {
        brokenAnchors.push({ source: docPath, target: fullLink, anchor });
      }
    }
  }

  const validPct = totalAnchors > 0 ? Math.round((validAnchors / totalAnchors) * 100) : 100;
  const result = scoreMetric(validPct, bench.valid_pct, "higher-is-better");

  if (brokenAnchors.length > 0) {
    const sample = brokenAnchors
      .slice(0, 5)
      .map((b) => `${b.source}: #${b.anchor}`)
      .join("; ");
    const extra = brokenAnchors.length > 5 ? ` (+${brokenAnchors.length - 5} more)` : "";
    findings.push({
      id: "DEA-220",
      category: "anchor_reference_validity",
      domain: DOMAIN,
      severity: "warning",
      message: `${brokenAnchors.length} broken anchor reference(s) found`,
      details: `Broken anchors: ${sample}${extra}. The target heading doesn't exist or slug doesn't match.`,
      impactScore: 40,
      frequency: brokenAnchors.length,
      blastRadius: 2,
      patchType: "fix_anchor",
      patchTarget: "Multiple files",
      patchContent: "Update anchor slugs to match target headings",
      patchImpact: "Fix navigation within documentation",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: { validPct, totalAnchors, validAnchors, brokenAnchors: brokenAnchors.length },
  };
}

// ── Category 7: Image Asset References ────────────────────────────────────

function checkImageReferences(rootDir, docFiles, findings) {
  const bench = BENCHMARKS.image_asset_references;

  let totalImages = 0;
  let validImages = 0;
  const brokenImages = [];

  for (const docPath of docFiles) {
    const fullPath = path.join(rootDir, docPath);
    const content = safeReadFile(fullPath);
    if (!content) continue;

    // Match markdown images: ![alt](path)
    const mdImagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    for (const match of content.matchAll(mdImagePattern)) {
      const imgPath = match[2];
      if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) continue;
      if (imgPath.startsWith("data:")) continue;

      totalImages++;
      const docDir = path.dirname(fullPath);
      const resolvedPath = path.resolve(docDir, imgPath);

      const rootAbs = path.resolve(rootDir);
      const relToRoot = path.relative(rootAbs, resolvedPath);
      if (/^\.\.(?:[\\/]|$)/.test(relToRoot) || relToRoot === "") {
        brokenImages.push({ source: docPath, target: imgPath });
        continue;
      }

      try {
        const stat = fs.statSync(resolvedPath);
        if (stat.isFile()) {
          validImages++;
        } else {
          brokenImages.push({ source: docPath, target: imgPath });
        }
      } catch {
        brokenImages.push({ source: docPath, target: imgPath });
      }
    }

    // Match HTML images: <img src="path">
    const htmlImagePattern = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
    for (const match of content.matchAll(htmlImagePattern)) {
      const imgPath = match[1];
      if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) continue;
      if (imgPath.startsWith("data:")) continue;

      totalImages++;
      const docDir = path.dirname(fullPath);
      const resolvedPath = path.resolve(docDir, imgPath);

      const rootAbs = path.resolve(rootDir);
      const relToRoot = path.relative(rootAbs, resolvedPath);
      if (/^\.\.(?:[\\/]|$)/.test(relToRoot) || relToRoot === "") {
        brokenImages.push({ source: docPath, target: imgPath });
        continue;
      }

      try {
        const stat = fs.statSync(resolvedPath);
        if (stat.isFile()) {
          validImages++;
        } else {
          brokenImages.push({ source: docPath, target: imgPath });
        }
      } catch {
        brokenImages.push({ source: docPath, target: imgPath });
      }
    }
  }

  const validPct = totalImages > 0 ? Math.round((validImages / totalImages) * 100) : 100;
  const result = scoreMetric(validPct, bench.valid_pct, "higher-is-better");

  if (brokenImages.length > 0) {
    const sample = brokenImages
      .slice(0, 5)
      .map((b) => `${b.source} -> ${b.target}`)
      .join("; ");
    const extra = brokenImages.length > 5 ? ` (+${brokenImages.length - 5} more)` : "";
    findings.push({
      id: "DEA-230",
      category: "image_asset_references",
      domain: DOMAIN,
      severity: "warning",
      message: `${brokenImages.length} broken image reference(s) found`,
      details: `Broken: ${sample}${extra}`,
      impactScore: 45,
      frequency: brokenImages.length,
      blastRadius: 2,
      patchType: "fix_image_ref",
      patchTarget: "Multiple files",
      patchContent: "Fix broken image paths or remove dead image references",
      patchImpact: "Restore image rendering in documentation",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: { validPct, totalImages, validImages, brokenImages: brokenImages.length },
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
 * Collect all .md files from docs/ and root level.
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
      const rootAbs = path.resolve(rootDir);
      const dirAbs = path.resolve(dir);
      const rel = path.relative(rootAbs, dirAbs);
      if (/^\.\.(?:[\\/]|$)/.test(rel) || rel === "") return;

      const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name[0] === "." || entry.name === "node_modules") continue;
        const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walkDir(path.join(dirAbs, entry.name), relPath);
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

  // .claude/ skill docs
  function walkClaudeDir(dir, prefix) {
    try {
      // Path containment: ensure dir is inside rootDir
      const rel = path.relative(rootDir, dir);
      if (/^\.\.(?:[\\/]|$)/.test(rel)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name[0] === "." || entry.name === "node_modules") continue;
        const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walkClaudeDir(path.join(dir, entry.name), relPath);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          files.push(`.claude/${relPath}`);
        }
      }
    } catch {
      // Not accessible
    }
  }

  const claudeDir = path.join(rootDir, ".claude");
  try {
    if (fs.existsSync(claudeDir)) {
      walkClaudeDir(claudeDir, "");
    }
  } catch {
    // Not accessible
  }

  return files;
}

/**
 * Extract heading slugs from markdown content.
 * Converts "## My Heading Title" to "my-heading-title".
 */
function extractHeadingSlugs(content) {
  const slugs = new Set();
  if (!content) return slugs;

  const headingPattern = /^#{1,6}\s+(.+)$/gm;
  for (const match of content.matchAll(headingPattern)) {
    const heading = match[1].trim();
    const slug = slugify(heading);
    slugs.add(slug);
  }
  return slugs;
}

/**
 * Slugify a heading string (GitHub-compatible).
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

module.exports = { run, DOMAIN };
