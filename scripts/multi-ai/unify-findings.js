#!/usr/bin/env node
/**
 * Multi-AI Cross-Category Unifier
 *
 * Unifies findings across all categories:
 * - Loads all canon/CANON-*.jsonl files
 * - Detects cross-cutting issues (same file in multiple categories)
 * - Merges related findings
 * - Identifies dependency chains
 * - Generates final priority ranking
 *
 * Output: final/UNIFIED-FINDINGS.jsonl + final/SUMMARY.md
 *
 * @example
 *   import { unifyFindings } from './unify-findings.js';
 *   const { findings, summary } = await unifyFindings(sessionPath);
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");

// Severity and effort weights for priority scoring
const SEVERITY_WEIGHTS = { S0: 100, S1: 50, S2: 20, S3: 5 };
const EFFORT_WEIGHTS = { E0: 0.5, E1: 1.0, E2: 2.0, E3: 4.0 };

// Cross-cutting multiplier (increases priority for multi-category findings)
const CROSS_CUTTING_MULTIPLIER_PER_CATEGORY = 0.5;

/**
 * Parse JSONL file and return findings array
 * @param {string} filePath - Path to JSONL file
 * @returns {object[]} - Array of findings
 */
function parseJsonlFile(filePath) {
  if (!existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());
  const findings = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      findings.push(JSON.parse(lines[i].trim()));
    } catch (error) {
      console.warn(`${basename(filePath)} line ${i + 1}: Invalid JSON`);
    }
  }

  return findings;
}

/**
 * Extract normalized file paths from finding
 * @param {object} finding - Finding object
 * @returns {string[]} - Normalized file paths (without line numbers)
 */
function extractNormalizedFiles(finding) {
  if (!finding.files || !Array.isArray(finding.files)) {
    return [];
  }

  return finding.files
    .map((f) => f.replace(/:+\d+$/, "").trim()) // Remove line numbers
    .filter((f) => f);
}

/**
 * Calculate priority score for a finding
 * Formula: (severityWeight × crossDomainMultiplier × confidenceWeight) / effortWeight
 * @param {object} finding - Finding object with categories array
 * @returns {number} - Priority score
 */
function calculatePriorityScore(finding) {
  const severityWeight = SEVERITY_WEIGHTS[finding.severity] || 20;
  const effortWeight = EFFORT_WEIGHTS[finding.effort] || 1.0;

  // Cross-cutting multiplier based on number of categories
  const categoryCount = finding.categories?.length || 1;
  const crossCuttingMultiplier = 1 + (categoryCount - 1) * CROSS_CUTTING_MULTIPLIER_PER_CATEGORY;

  // Confidence weight (0.5 - 1.0)
  const confidence = finding.confidence || 70;
  const confidenceWeight = 0.5 + confidence / 200;

  // Consensus bonus
  const consensusBonus = (finding.consensus_score || 1) * 5;

  const score =
    (severityWeight * crossCuttingMultiplier * confidenceWeight) / effortWeight + consensusBonus;

  return Math.round(score * 10) / 10;
}

/**
 * Detect cross-cutting findings (same file appears in multiple categories)
 * @param {object[]} allFindings - All findings from all categories
 * @returns {{ crossCutting: object[], fileMap: Map }}
 */
function detectCrossCuttingFindings(allFindings) {
  // Build file → findings map
  const fileMap = new Map();

  for (const finding of allFindings) {
    const files = extractNormalizedFiles(finding);
    for (const file of files) {
      if (!fileMap.has(file)) {
        fileMap.set(file, []);
      }
      fileMap.get(file).push(finding);
    }
  }

  // Find files that appear in 2+ categories
  const crossCutting = [];

  for (const [file, findings] of fileMap) {
    const categories = new Set(findings.map((f) => f.category));
    if (categories.size >= 2) {
      crossCutting.push({
        file,
        categories: Array.from(categories),
        findings: findings.map((f) => ({
          id: f.canonical_id,
          category: f.category,
          severity: f.severity,
          title: f.title?.substring(0, 50),
        })),
        total_findings: findings.length,
      });
    }
  }

  // Sort by number of categories (most cross-cutting first)
  crossCutting.sort(
    (a, b) => b.categories.length - a.categories.length || b.total_findings - a.total_findings
  );

  return { crossCutting, fileMap };
}

/**
 * Detect dependency chains between findings
 * @param {object[]} findings - All findings
 * @returns {object[]} - Dependency chains
 */
function detectDependencyChains(findings) {
  const chains = [];
  const idMap = new Map(findings.map((f) => [f.canonical_id, f]));

  // Look for explicit dependencies
  for (const finding of findings) {
    if (finding.dependencies && finding.dependencies.length > 0) {
      const deps = finding.dependencies
        .map((depId) => {
          const depFinding = idMap.get(depId);
          if (depFinding) {
            return {
              id: depId,
              title: depFinding.title?.substring(0, 40),
              severity: depFinding.severity,
            };
          }
          return null;
        })
        .filter(Boolean);

      if (deps.length > 0) {
        chains.push({
          finding_id: finding.canonical_id,
          finding_title: finding.title?.substring(0, 40),
          depends_on: deps,
        });
      }
    }
  }

  // Look for implicit dependencies (same file, different severity)
  const fileGroups = new Map();
  for (const finding of findings) {
    for (const file of extractNormalizedFiles(finding)) {
      if (!fileGroups.has(file)) {
        fileGroups.set(file, []);
      }
      fileGroups.get(file).push(finding);
    }
  }

  for (const [file, fileFindings] of fileGroups) {
    if (fileFindings.length < 2) continue;

    // Sort by severity (S0 first)
    const sorted = [...fileFindings].sort((a, b) => {
      const sevRank = { S0: 0, S1: 1, S2: 2, S3: 3 };
      return (sevRank[a.severity] || 2) - (sevRank[b.severity] || 2);
    });

    // S0/S1 findings might block S2/S3 in same file
    const critical = sorted.filter((f) => f.severity === "S0" || f.severity === "S1");
    const lower = sorted.filter((f) => f.severity === "S2" || f.severity === "S3");

    if (critical.length > 0 && lower.length > 0) {
      chains.push({
        type: "implicit",
        file,
        blockers: critical.map((f) => ({
          id: f.canonical_id,
          severity: f.severity,
          title: f.title?.substring(0, 30),
        })),
        blocked: lower.map((f) => ({
          id: f.canonical_id,
          severity: f.severity,
          title: f.title?.substring(0, 30),
        })),
      });
    }
  }

  return chains;
}

/**
 * Merge related findings that span multiple categories
 * @param {object[]} allFindings - All findings
 * @param {Map} fileMap - File to findings map
 * @returns {{ merged: object[], mergeLog: object[] }}
 */
function mergeRelatedFindings(allFindings, fileMap) {
  const merged = [];
  const processed = new Set();
  const mergeLog = [];

  // Process each unique file
  for (const [file, fileFindings] of fileMap) {
    // Get unique categories for this file
    const categories = new Set(fileFindings.map((f) => f.category));

    if (categories.size >= 2) {
      // This is a cross-cutting file - merge findings
      const representativeFindings = [];

      // Group by category
      const byCategory = new Map();
      for (const f of fileFindings) {
        if (!byCategory.has(f.category)) {
          byCategory.set(f.category, []);
        }
        byCategory.get(f.category).push(f);
      }

      // Take best finding from each category
      for (const [category, catFindings] of byCategory) {
        // Sort by severity then consensus
        catFindings.sort((a, b) => {
          const sevRank = { S0: 0, S1: 1, S2: 2, S3: 3 };
          const sevDiff = (sevRank[a.severity] || 2) - (sevRank[b.severity] || 2);
          if (sevDiff !== 0) return sevDiff;
          return (b.consensus_score || 0) - (a.consensus_score || 0);
        });

        representativeFindings.push(catFindings[0]);

        // Mark all as processed
        for (const f of catFindings) {
          processed.add(f.canonical_id);
        }
      }

      // Create cross-cutting finding
      const primaryFinding = representativeFindings.reduce((best, curr) => {
        const sevRank = { S0: 0, S1: 1, S2: 2, S3: 3 };
        return (sevRank[curr.severity] || 2) < (sevRank[best.severity] || 2) ? curr : best;
      });

      const crossCuttingFinding = {
        ...primaryFinding,
        cross_cutting: true,
        categories: Array.from(categories),
        related_findings: representativeFindings.map((f) => ({
          id: f.canonical_id,
          category: f.category,
          title: f.title?.substring(0, 50),
        })),
        file_hotspot: file,
      };

      merged.push(crossCuttingFinding);

      mergeLog.push({
        action: "cross_cutting_merge",
        file,
        categories: Array.from(categories),
        findings_merged: representativeFindings.length,
      });
    }
  }

  // Add non-merged findings
  for (const finding of allFindings) {
    if (!processed.has(finding.canonical_id)) {
      merged.push({
        ...finding,
        cross_cutting: false,
        categories: [finding.category],
      });
    }
  }

  return { merged, mergeLog };
}

/**
 * Generate summary markdown
 * @param {object} data - Unification data
 * @returns {string} - Markdown content
 */
function generateSummaryMarkdown(data) {
  const {
    session_id,
    totalSources,
    rawFindings,
    uniqueFindings,
    crossCuttingFindings,
    categoryStats,
    severityStats,
    topFindings,
    crossCuttingFiles,
    dependencyChains,
  } = data;

  const md = `# Multi-AI Audit Summary

**Session:** ${session_id}
**Generated:** ${new Date().toISOString().split("T")[0]}

---

## Overview

| Metric | Value |
|--------|-------|
| Total AI Sources | ${totalSources} |
| Raw Findings | ${rawFindings} |
| Unique After Unification | ${uniqueFindings} |
| Cross-Cutting Findings | ${crossCuttingFindings} |

---

## Category Breakdown

| Category | Findings | S0 | S1 | S2 | S3 |
|----------|----------|----:|----:|----:|----:|
${Object.entries(categoryStats)
  .map(
    ([cat, stats]) =>
      `| ${cat} | ${stats.total} | ${stats.S0 || 0} | ${stats.S1 || 0} | ${stats.S2 || 0} | ${stats.S3 || 0} |`
  )
  .join("\n")}

---

## Severity Distribution

| Severity | Count | % |
|----------|------:|--:|
| S0 Critical | ${severityStats.S0} | ${Math.round((severityStats.S0 / uniqueFindings) * 100)}% |
| S1 High | ${severityStats.S1} | ${Math.round((severityStats.S1 / uniqueFindings) * 100)}% |
| S2 Medium | ${severityStats.S2} | ${Math.round((severityStats.S2 / uniqueFindings) * 100)}% |
| S3 Low | ${severityStats.S3} | ${Math.round((severityStats.S3 / uniqueFindings) * 100)}% |

---

## Top 20 Priority Findings

| Rank | ID | Severity | Categories | Score | Title |
|-----:|:---|:--------:|:----------:|------:|:------|
${topFindings
  .slice(0, 20)
  .map(
    (f, i) =>
      `| ${i + 1} | ${f.canonical_id} | ${f.severity} | ${f.categories?.length || 1} | ${f.priority_score} | ${f.title?.substring(0, 40)}${f.title?.length > 40 ? "..." : ""} |`
  )
  .join("\n")}

---

## Cross-Cutting Files (Hotspots)

These files appear in 2+ audit categories and may need comprehensive attention:

${
  crossCuttingFiles.length > 0
    ? crossCuttingFiles
        .slice(0, 10)
        .map(
          (f) => `### ${f.file}
- **Categories:** ${f.categories.join(", ")}
- **Total Findings:** ${f.total_findings}
${f.findings.map((finding) => `  - \`${finding.id}\` (${finding.severity}): ${finding.title}`).join("\n")}
`
        )
        .join("\n")
    : "_No cross-cutting files detected_"
}

---

## Dependency Chains

${
  dependencyChains.length > 0
    ? dependencyChains
        .slice(0, 10)
        .map((chain) => {
          if (chain.type === "implicit") {
            return `- **${chain.file}**: ${chain.blockers.length} critical findings may block ${chain.blocked.length} lower-severity fixes`;
          }
          return `- **${chain.finding_id}** depends on: ${chain.depends_on.map((d) => d.id).join(", ")}`;
        })
        .join("\n")
    : "_No dependency chains detected_"
}

---

## Recommended Action Plan

### Phase 1: Critical (S0) - Immediate

${
  topFindings
    .filter((f) => f.severity === "S0")
    .map((f) => `- [ ] **${f.canonical_id}**: ${f.title?.substring(0, 60)}`)
    .join("\n") || "_No S0 findings_"
}

### Phase 2: High Priority (S1) - This Sprint

${
  topFindings
    .filter((f) => f.severity === "S1")
    .slice(0, 10)
    .map((f) => `- [ ] **${f.canonical_id}**: ${f.title?.substring(0, 60)}`)
    .join("\n") || "_No S1 findings_"
}

### Phase 3: Cross-Cutting Files

${
  crossCuttingFiles
    .slice(0, 5)
    .map(
      (f) => `- [ ] **${f.file}** (${f.categories.length} categories, ${f.total_findings} findings)`
    )
    .join("\n") || "_No cross-cutting files_"
}

---

## Next Steps

1. **Review** this summary and the UNIFIED-FINDINGS.jsonl file
2. **Ingest** to TDMS: \`node scripts/debt/intake-audit.js <path-to-unified>\`
3. **Track** progress in ROADMAP.md or your issue tracker
4. **Archive** the session when complete

---

**Generated by Multi-AI Audit Orchestrator**
`;

  return md;
}

/**
 * Unify findings across all categories
 * @param {string} sessionPath - Path to session directory
 * @returns {{ findings: object[], summary: object }}
 */
export async function unifyFindings(sessionPath) {
  const canonDir = join(sessionPath, "canon");
  const finalDir = join(sessionPath, "final");

  if (!existsSync(canonDir)) {
    return {
      findings: [],
      summary: { error: `Canon directory not found: ${canonDir}` },
    };
  }

  // Ensure final directory exists
  if (!existsSync(finalDir)) {
    mkdirSync(finalDir, { recursive: true });
  }

  // Find all CANON files
  const canonFiles = readdirSync(canonDir).filter(
    (f) => f.startsWith("CANON-") && f.endsWith(".jsonl")
  );

  if (canonFiles.length === 0) {
    return {
      findings: [],
      summary: { error: "No CANON files found" },
    };
  }

  // Load all findings
  const allFindings = [];
  const categoryStats = {};

  for (const file of canonFiles) {
    const category = file.replace("CANON-", "").replace(".jsonl", "").toLowerCase();
    const findings = parseJsonlFile(join(canonDir, file));

    categoryStats[category] = {
      total: findings.length,
      S0: 0,
      S1: 0,
      S2: 0,
      S3: 0,
    };

    for (const finding of findings) {
      finding.category = category;
      allFindings.push(finding);

      if (finding.severity in categoryStats[category]) {
        categoryStats[category][finding.severity]++;
      }
    }

    console.log(`Loaded ${findings.length} findings from ${file}`);
  }

  const rawFindingsCount = allFindings.length;
  console.log(`\nTotal findings loaded: ${rawFindingsCount}`);

  // Detect cross-cutting issues
  const { crossCutting, fileMap } = detectCrossCuttingFindings(allFindings);
  console.log(`Cross-cutting files detected: ${crossCutting.length}`);

  // Merge related findings
  const { merged, mergeLog } = mergeRelatedFindings(allFindings, fileMap);
  console.log(`After merging: ${merged.length} unified findings`);

  // Detect dependency chains
  const dependencyChains = detectDependencyChains(merged);
  console.log(`Dependency chains detected: ${dependencyChains.length}`);

  // Calculate priority scores
  for (const finding of merged) {
    finding.priority_score = calculatePriorityScore(finding);
  }

  // Sort by priority score
  merged.sort((a, b) => b.priority_score - a.priority_score);

  // Assign unified IDs
  const unifiedFindings = merged.map((finding, idx) => ({
    ...finding,
    unified_id: `UNIFIED-${String(idx + 1).padStart(4, "0")}`,
  }));

  // Calculate severity stats
  const severityStats = { S0: 0, S1: 0, S2: 0, S3: 0 };
  for (const f of unifiedFindings) {
    if (f.severity in severityStats) {
      severityStats[f.severity]++;
    }
  }

  // Count total sources
  let totalSources = 0;
  for (const f of unifiedFindings) {
    totalSources += f.sources?.length || 0;
  }

  // Extract session ID from path
  const sessionId = basename(sessionPath);

  // Write unified findings
  const outputPath = join(finalDir, "UNIFIED-FINDINGS.jsonl");
  const jsonl = unifiedFindings.map((f) => JSON.stringify(f)).join("\n");
  writeFileSync(outputPath, jsonl);

  // Generate and write summary
  const summaryData = {
    session_id: sessionId,
    totalSources,
    rawFindings: rawFindingsCount,
    uniqueFindings: unifiedFindings.length,
    crossCuttingFindings: crossCutting.length,
    categoryStats,
    severityStats,
    topFindings: unifiedFindings.slice(0, 30),
    crossCuttingFiles: crossCutting,
    dependencyChains,
  };

  const summaryMd = generateSummaryMarkdown(summaryData);
  const summaryPath = join(finalDir, "SUMMARY.md");
  writeFileSync(summaryPath, summaryMd);

  const summary = {
    session_id: sessionId,
    categories_processed: canonFiles.length,
    raw_findings: rawFindingsCount,
    unified_findings: unifiedFindings.length,
    cross_cutting_files: crossCutting.length,
    dependency_chains: dependencyChains.length,
    severity_breakdown: severityStats,
    output_files: {
      findings: outputPath,
      summary: summaryPath,
    },
  };

  console.log(`\n=== Unification Complete ===`);
  console.log(`Session: ${sessionId}`);
  console.log(`Categories: ${canonFiles.length}`);
  console.log(`Raw → Unified: ${rawFindingsCount} → ${unifiedFindings.length}`);
  console.log(`Cross-cutting: ${crossCutting.length} files`);
  console.log(
    `Severities: S0=${severityStats.S0}, S1=${severityStats.S1}, S2=${severityStats.S2}, S3=${severityStats.S3}`
  );
  console.log(`\nOutput:`);
  console.log(`  Findings: ${outputPath}`);
  console.log(`  Summary: ${summaryPath}`);

  return { findings: unifiedFindings, summary };
}

// CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log("Usage: node unify-findings.js <session-path>");
    console.log("");
    console.log("Unifies findings across all categories into a single prioritized list.");
    console.log("Reads from: <session>/canon/CANON-*.jsonl");
    console.log("Writes to: <session>/final/UNIFIED-FINDINGS.jsonl");
    console.log("           <session>/final/SUMMARY.md");
    console.log("");
    console.log("Example:");
    console.log("  node unify-findings.js docs/audits/multi-ai/maa-2026-02-04-abc123");
    process.exit(1);
  }

  const [sessionPath] = args;

  if (!existsSync(sessionPath)) {
    console.error(`Session path not found: ${sessionPath}`);
    process.exit(1);
  }

  unifyFindings(sessionPath).then(({ findings, summary }) => {
    if (summary.error) {
      console.error(`Error: ${summary.error}`);
      process.exit(1);
    }
    console.log(`\nUnification complete: ${findings.length} unified findings`);
  });
}
