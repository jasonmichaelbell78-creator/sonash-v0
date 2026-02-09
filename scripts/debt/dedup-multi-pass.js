#!/usr/bin/env node
/* global __dirname */
/**
 * Multi-Pass Deduplication for TDMS
 *
 * Reads: docs/technical-debt/raw/normalized-all.jsonl
 * Outputs:
 *   - docs/technical-debt/raw/deduped.jsonl (unique items)
 *   - docs/technical-debt/logs/dedup-log.jsonl (merge history)
 *   - docs/technical-debt/raw/review-needed.jsonl (uncertain matches)
 *
 * Deduplication passes:
 * 0. Parametric match: Same file + title differing only in numeric literals
 * 1. Exact match: Same content_hash
 * 2. Near match: Same file + line ±5 + message similarity >80%
 * 3. Semantic match: Same file + very similar title
 * 4. Cross-source match: SonarCloud rule → audit finding correlation
 * 5. Systemic pattern grouper: Annotate items with same title across >=3 files
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const INPUT_FILE = path.join(__dirname, "../../docs/technical-debt/raw/normalized-all.jsonl");
const OUTPUT_FILE = path.join(__dirname, "../../docs/technical-debt/raw/deduped.jsonl");
const LOG_FILE = path.join(__dirname, "../../docs/technical-debt/logs/dedup-log.jsonl");
const REVIEW_FILE = path.join(__dirname, "../../docs/technical-debt/raw/review-needed.jsonl");

// Levenshtein distance for string similarity
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate string similarity (0-1)
function stringSimilarity(a, b) {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// Normalize text for comparison
function normalizeText(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Strip numeric literals from title for parametric comparison
function normalizeParametric(title) {
  if (!title) return "";
  return title.replace(/\d+/g, "#");
}

// Generate a stable short hash for cluster IDs
function shortHash(str) {
  return crypto.createHash("sha256").update(str).digest("hex").substring(0, 12);
}

// Check if items are near matches
function isNearMatch(a, b) {
  // Must be same file
  if (a.file !== b.file) return false;
  if (!a.file) return false;

  // CRITICAL: Require valid positive line numbers to avoid NaN-based false merges
  if (!Number.isFinite(a.line) || !Number.isFinite(b.line)) return false;
  if (a.line <= 0 || b.line <= 0) return false;

  // Line numbers within ±5
  const lineDiff = Math.abs(a.line - b.line);
  if (lineDiff > 5) return false;

  // Title similarity > 80%
  const titleSim = stringSimilarity(normalizeText(a.title), normalizeText(b.title));
  if (titleSim < 0.8) return false;

  return true;
}

// Check for semantic match (same file, very similar titles)
function isSemanticMatch(a, b) {
  // Must be same file
  if (a.file !== b.file) return false;
  if (!a.file) return false;

  // CRITICAL: Require valid positive line numbers to avoid over-merging large files
  if (!Number.isFinite(a.line) || !Number.isFinite(b.line)) return false;
  if (a.line <= 0 || b.line <= 0) return false;

  // Title similarity > 90%
  const titleSim = stringSimilarity(normalizeText(a.title), normalizeText(b.title));
  if (titleSim < 0.9) return false;

  return true;
}

// Cross-source matching rules
const SONAR_TO_CATEGORY = {
  "javascript:S1854": "code-quality", // useless assignment
  "typescript:S1854": "code-quality", // useless assignment
  "javascript:S3776": "code-quality", // cognitive complexity
  "typescript:S3776": "code-quality", // cognitive complexity
  "javascript:S2245": "security", // weak random
  "typescript:S2245": "security", // weak random
  "javascript:S4830": "security", // certificate validation
  "typescript:S4830": "security", // certificate validation
};

function isCrossSourceMatch(a, b) {
  // Defensive: ensure both items have valid source_id
  const aSourceId = typeof a?.source_id === "string" ? a.source_id : "";
  const bSourceId = typeof b?.source_id === "string" ? b.source_id : "";

  if (!aSourceId || !bSourceId) return false;

  // One must be SonarCloud, other must be audit
  const aIsSonar = aSourceId.startsWith("sonarcloud:");
  const bIsSonar = bSourceId.startsWith("sonarcloud:");

  if (aIsSonar === bIsSonar) return false;

  const sonarItem = aIsSonar ? a : b;
  const auditItem = aIsSonar ? b : a;

  if (!sonarItem || !auditItem) return false;

  // Defensive: validate file fields
  const sonarFile = typeof sonarItem.file === "string" ? sonarItem.file : "";
  const auditFile = typeof auditItem.file === "string" ? auditItem.file : "";
  if (!sonarFile || !auditFile) return false;

  // Same file
  if (sonarFile !== auditFile) return false;

  // CRITICAL: Don't treat missing lines as "0" (causes false merges)
  if (!Number.isFinite(sonarItem.line) || !Number.isFinite(auditItem.line)) return false;
  if (sonarItem.line <= 0 || auditItem.line <= 0) return false;

  // Close line numbers
  const lineDiff = Math.abs(sonarItem.line - auditItem.line);
  if (lineDiff > 10) return false;

  // Similar titles
  const descSim = stringSimilarity(normalizeText(sonarItem.title), normalizeText(auditItem.title));
  return descSim > 0.7;
}

// Merge two items, preferring more detailed one
function mergeItems(primary, secondary) {
  const merged = { ...primary };

  // Keep longer description
  if (secondary.description && secondary.description.length > (primary.description || "").length) {
    merged.description = secondary.description;
  }

  // Keep longer recommendation
  if (
    secondary.recommendation &&
    secondary.recommendation.length > (primary.recommendation || "").length
  ) {
    merged.recommendation = secondary.recommendation;
  }

  // Keep more severe severity (unknown severities should not win)
  const sevRank = { S0: 0, S1: 1, S2: 2, S3: 3 };
  const primaryRank = sevRank[primary.severity] ?? 99;
  const secondaryRank = sevRank[secondary.severity] ?? 99;
  if (secondaryRank < primaryRank) {
    merged.severity = secondary.severity;
  }

  // Track merge sources (only add valid source_id strings, prevent duplicates)
  if (!merged.merged_from) merged.merged_from = [];
  if (typeof secondary.source_id === "string" && secondary.source_id.trim()) {
    if (!merged.merged_from.includes(secondary.source_id)) {
      merged.merged_from.push(secondary.source_id);
    }
  }

  // Merge evidence arrays
  if (secondary.evidence) {
    merged.evidence = [
      ...(merged.evidence || []),
      ...secondary.evidence.filter((e) => !(merged.evidence || []).includes(e)),
    ];
  }

  return merged;
}

function main() {
  console.log("🔄 Running multi-pass deduplication...\n");

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    console.error("   Run normalize-all.js first.");
    process.exit(1);
  }

  // Read normalized items with safe JSON parsing
  let content;
  try {
    content = fs.readFileSync(INPUT_FILE, "utf8");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Failed to read input file: ${errMsg}`);
    process.exit(1);
  }
  const lines = content.split("\n").filter((line) => line.trim());

  let items = [];
  const parseErrors = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      items.push(JSON.parse(lines[i]));
    } catch (err) {
      parseErrors.push({ line: i + 1, message: err instanceof Error ? err.message : String(err) });
    }
  }

  if (parseErrors.length > 0) {
    console.error(`⚠️ Warning: ${parseErrors.length} invalid JSON line(s) in input file`);
    for (const e of parseErrors.slice(0, 5)) {
      console.error(`   Line ${e.line}: ${e.message}`);
    }
    if (parseErrors.length > 5) {
      console.error(`   ... and ${parseErrors.length - 5} more`);
    }
    console.log();
  }

  console.log(`  📊 Starting with ${items.length} normalized items\n`);

  const dedupLog = [];
  const reviewNeeded = [];

  // Pass 0: Parametric dedup — same file, title differing only in numeric literals
  console.log("  Pass 0: Parametric dedup (file + title with numbers stripped)...");
  const parametricGroups = new Map();

  for (const item of items) {
    const paramTitle = normalizeParametric(item.title || "");
    const key = `${item.file || ""}::${paramTitle}`;
    if (!parametricGroups.has(key)) {
      parametricGroups.set(key, []);
    }
    parametricGroups.get(key).push(item);
  }

  const pass0Items = [];
  let pass0Merged = 0;

  for (const [, group] of parametricGroups) {
    if (group.length <= 1) {
      pass0Items.push(...group);
      continue;
    }

    // Check if items in the group have different line numbers (same rule, different locations)
    const toLineNumber = (v) => {
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const uniqueLines = new Set(group.map((g) => toLineNumber(g.line)));
    uniqueLines.delete(null);
    if (uniqueLines.size <= 1) {
      // All same (or unknown) line — not a parametric pattern, pass through
      pass0Items.push(...group);
      continue;
    }

    // Safety guard: never auto-merge S0/S1 — flag for review instead
    const hasHighSeverity = group.some((g) => g.severity === "S0" || g.severity === "S1");
    if (hasHighSeverity) {
      // Pass all items through unmerged, but flag for review
      pass0Items.push(...group);
      for (let k = 1; k < group.length; k++) {
        reviewNeeded.push({
          reason: "parametric_s0s1_review",
          item_a: group[0],
          item_b: group[k],
          note: "Parametric match on S0/S1 items requires manual review",
        });
        dedupLog.push({
          pass: 0,
          type: "parametric_match",
          kept: group[0].source_id,
          flagged: group[k].source_id,
          reason: "parametric match skipped for S0/S1 — flagged for review",
        });
      }
      continue;
    }

    // Merge: keep the item with the lowest line number as primary
    const sorted = [...group].sort((a, b) => {
      const aLine = toLineNumber(a.line) ?? Infinity;
      const bLine = toLineNumber(b.line) ?? Infinity;
      return aLine - bLine;
    });

    let primary = sorted[0];
    for (let k = 1; k < sorted.length; k++) {
      const secondary = sorted[k];
      primary = mergeItems(primary, secondary);
      // Track merged_from with detailed line info (remove simple source_id to avoid duplication)
      if (!Array.isArray(primary.merged_from)) primary.merged_from = [];
      const secondaryId = secondary.source_id || "unknown";
      const simpleIdx = primary.merged_from.indexOf(secondaryId);
      if (simpleIdx > -1) primary.merged_from.splice(simpleIdx, 1);
      const secondaryRef = `${secondaryId}@line:${secondary.line}`;
      if (!primary.merged_from.includes(secondaryRef)) {
        primary.merged_from.push(secondaryRef);
      }
      dedupLog.push({
        pass: 0,
        type: "parametric_match",
        kept: primary.source_id,
        removed: sorted[k].source_id,
        reason: `parametric title match (numbers stripped), lines: ${sorted[0].line} vs ${sorted[k].line}`,
      });
      pass0Merged++;
    }

    pass0Items.push(primary);
  }

  console.log(
    `    Reduced ${items.length} → ${pass0Items.length} (${pass0Merged} parametric matches)`
  );

  // Pass 1: Exact hash match
  console.log("  Pass 1: Exact content hash match...");
  const hashMap = new Map();
  const pass1Items = [];
  let noHashCount = 0;

  for (const item of pass0Items) {
    const hash =
      typeof item.content_hash === "string" && item.content_hash.trim() ? item.content_hash : null;

    // CRITICAL: Never merge items without valid content_hash together
    // Items without hash are passed through individually and flagged for review
    if (!hash) {
      pass1Items.push(item);
      noHashCount++;
      reviewNeeded.push({
        reason: "missing_content_hash",
        item_a: item,
        item_b: null,
        note: "Item has no content_hash - cannot deduplicate safely",
      });
      continue;
    }

    if (hashMap.has(hash)) {
      const existing = hashMap.get(hash);
      const merged = mergeItems(existing, item);
      hashMap.set(hash, merged);
      dedupLog.push({
        pass: 1,
        type: "exact_match",
        kept: existing.source_id,
        removed: item.source_id,
        reason: "identical content hash",
      });
    } else {
      hashMap.set(hash, item);
    }
  }

  pass1Items.push(...hashMap.values());
  if (noHashCount > 0) {
    console.log(`    ⚠️ ${noHashCount} items skipped (missing content_hash)`);
  }
  console.log(
    `    Reduced ${pass0Items.length} → ${pass1Items.length} (${pass0Items.length - pass1Items.length} exact duplicates)`
  );

  // Pass 2: Near match (same file, close line, similar title)
  console.log("  Pass 2: Near match (file + line ±5 + title >80%)...");
  const pass2Items = [];
  const pass2Removed = new Set();

  for (let i = 0; i < pass1Items.length; i++) {
    if (pass2Removed.has(i)) continue;

    let current = pass1Items[i];

    for (let j = i + 1; j < pass1Items.length; j++) {
      if (pass2Removed.has(j)) continue;

      if (isNearMatch(current, pass1Items[j])) {
        current = mergeItems(current, pass1Items[j]);
        pass2Removed.add(j);
        dedupLog.push({
          pass: 2,
          type: "near_match",
          kept: current.source_id,
          removed: pass1Items[j].source_id,
          reason: `same file, line diff ≤5, title similarity >80%`,
        });
      }
    }

    pass2Items.push(current);
  }

  console.log(
    `    Reduced ${pass1Items.length} → ${pass2Items.length} (${pass2Removed.size} near matches)`
  );

  // Pass 3: Semantic match (same file, very similar title)
  console.log("  Pass 3: Semantic match (file + title >90%)...");
  const pass3Items = [];
  const pass3Removed = new Set();

  for (let i = 0; i < pass2Items.length; i++) {
    if (pass3Removed.has(i)) continue;

    let current = pass2Items[i];

    for (let j = i + 1; j < pass2Items.length; j++) {
      if (pass3Removed.has(j)) continue;

      if (isSemanticMatch(current, pass2Items[j])) {
        // Flag for review instead of auto-merging
        reviewNeeded.push({
          reason: "semantic_match",
          item_a: current,
          item_b: pass2Items[j],
          similarity: stringSimilarity(
            normalizeText(current.title),
            normalizeText(pass2Items[j].title)
          ).toFixed(2),
        });
        // Still merge but log
        current = mergeItems(current, pass2Items[j]);
        pass3Removed.add(j);
        dedupLog.push({
          pass: 3,
          type: "semantic_match",
          kept: current.source_id,
          removed: pass2Items[j].source_id,
          reason: `same file, title similarity >90%`,
          flagged_for_review: true,
        });
      }
    }

    pass3Items.push(current);
  }

  console.log(
    `    Reduced ${pass2Items.length} → ${pass3Items.length} (${pass3Removed.size} semantic matches)`
  );

  // Pass 4: Cross-source match (SonarCloud ↔ audit)
  console.log("  Pass 4: Cross-source match (SonarCloud ↔ audit)...");
  const pass4Items = [];
  const pass4Removed = new Set();

  for (let i = 0; i < pass3Items.length; i++) {
    if (pass4Removed.has(i)) continue;

    let current = pass3Items[i];

    for (let j = i + 1; j < pass3Items.length; j++) {
      if (pass4Removed.has(j)) continue;

      if (isCrossSourceMatch(current, pass3Items[j])) {
        // Prefer audit findings over SonarCloud (more context)
        // Guard against non-string source_id to prevent crash
        const currentSourceId = typeof current.source_id === "string" ? current.source_id : "";
        const isSonar = currentSourceId.startsWith("sonarcloud:");
        if (isSonar) {
          current = mergeItems(pass3Items[j], current);
        } else {
          current = mergeItems(current, pass3Items[j]);
        }
        pass4Removed.add(j);
        dedupLog.push({
          pass: 4,
          type: "cross_source_match",
          kept: current.source_id,
          removed: pass3Items[j].source_id,
          reason: "SonarCloud ↔ audit correlation",
        });
      }
    }

    pass4Items.push(current);
  }

  console.log(
    `    Reduced ${pass3Items.length} → ${pass4Items.length} (${pass4Removed.size} cross-source matches)`
  );

  // Pass 5: Systemic pattern grouper — annotate items with same title across >=3 files
  console.log("  Pass 5: Systemic pattern grouper (same title across >=3 files)...");
  const titleGroups = new Map();

  for (let i = 0; i < pass4Items.length; i++) {
    const normTitle = normalizeText(pass4Items[i].title);
    if (!normTitle) continue;
    if (!titleGroups.has(normTitle)) {
      titleGroups.set(normTitle, []);
    }
    titleGroups.get(normTitle).push(i);
  }

  let pass5Clustered = 0;
  const sevRankForCluster = { S0: 0, S1: 1, S2: 2, S3: 3 };
  const pass5Items = [...pass4Items]; // Copy — we annotate in place, no removals

  for (const [normTitle, indices] of titleGroups) {
    // Collect unique files in this group
    const uniqueFiles = new Set(indices.map((idx) => pass5Items[idx].file));
    if (uniqueFiles.size < 3) continue;

    // This is a systemic pattern
    const clusterId = `CLUSTER-${shortHash(normTitle)}`;
    const clusterCount = indices.length;

    // Find the item with worst severity (lowest rank number)
    let primaryIdx = indices[0];
    let primaryRank = sevRankForCluster[pass5Items[primaryIdx].severity] ?? 99;

    for (const idx of indices) {
      const rank = sevRankForCluster[pass5Items[idx].severity] ?? 99;
      if (rank < primaryRank) {
        primaryRank = rank;
        primaryIdx = idx;
      }
    }

    // Annotate all items in the cluster
    for (const idx of indices) {
      pass5Items[idx] = {
        ...pass5Items[idx],
        cluster_id: clusterId,
        cluster_count: clusterCount,
      };
      if (idx === primaryIdx) {
        pass5Items[idx].cluster_primary = true;
      }

      dedupLog.push({
        pass: 5,
        type: "systemic_pattern",
        source_id: pass5Items[idx].source_id,
        cluster_id: clusterId,
        cluster_count: clusterCount,
        is_primary: idx === primaryIdx,
        reason: `title appears in ${uniqueFiles.size} different files`,
      });
    }

    pass5Clustered++;
  }

  console.log(`    Identified ${pass5Clustered} systemic patterns (items annotated, none removed)`);

  // Ensure output directories exist
  const outputDir = path.dirname(OUTPUT_FILE);
  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Write deduped items
  const outputLines = pass5Items.map((item) => JSON.stringify(item));
  fs.writeFileSync(OUTPUT_FILE, outputLines.join("\n") + "\n");

  // Write dedup log
  const logLines = dedupLog.map((entry) => JSON.stringify(entry));
  fs.writeFileSync(LOG_FILE, logLines.join("\n") + "\n");

  // Write review needed
  if (reviewNeeded.length > 0) {
    const reviewLines = reviewNeeded.map((entry) => JSON.stringify(entry));
    fs.writeFileSync(REVIEW_FILE, reviewLines.join("\n") + "\n");
  }

  // Summary
  const totalRemoved = items.length - pass5Items.length;
  console.log(`\n✅ Deduplication complete: ${items.length} → ${pass5Items.length}`);
  console.log(
    `   Removed ${totalRemoved} duplicates (${((totalRemoved / items.length) * 100).toFixed(1)}%)`
  );
  console.log(`\n📊 Per-pass breakdown:`);
  console.log(
    `   Pass 0 (parametric):    ${items.length} → ${pass0Items.length} (${pass0Merged} merged)`
  );
  console.log(
    `   Pass 1 (exact hash):    ${pass0Items.length} → ${pass1Items.length} (${pass0Items.length - pass1Items.length} merged)`
  );
  console.log(
    `   Pass 2 (near match):    ${pass1Items.length} → ${pass2Items.length} (${pass2Removed.size} merged)`
  );
  console.log(
    `   Pass 3 (semantic):      ${pass2Items.length} → ${pass3Items.length} (${pass3Removed.size} merged)`
  );
  console.log(
    `   Pass 4 (cross-source):  ${pass3Items.length} → ${pass4Items.length} (${pass4Removed.size} merged)`
  );
  console.log(`   Pass 5 (systemic):      ${pass5Clustered} patterns annotated (0 removed)`);
  console.log(`\n📄 Output files:`);
  console.log(`   ${OUTPUT_FILE}`);
  console.log(`   ${LOG_FILE} (${dedupLog.length} merge records)`);
  if (reviewNeeded.length > 0) {
    console.log(`   ${REVIEW_FILE} (${reviewNeeded.length} items for review)`);
  }

  // Final summary by severity
  const bySeverity = {};
  for (const item of pass5Items) {
    bySeverity[item.severity] = (bySeverity[item.severity] || 0) + 1;
  }
  console.log("\n📈 Final counts by severity:");
  for (const sev of ["S0", "S1", "S2", "S3"]) {
    if (bySeverity[sev]) {
      console.log(`   ${sev}: ${bySeverity[sev]}`);
    }
  }
}

main();
