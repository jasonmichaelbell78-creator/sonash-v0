#!/usr/bin/env node
/**
 * Multi-AI Category Aggregator
 *
 * Aggregates findings from multiple sources for a single category:
 * - Loads all raw/<category>-*.jsonl files
 * - Deduplicates by fingerprint → file+line → title similarity
 * - Calculates consensus scores
 * - Verifies file existence (if repo access)
 * - Assigns CANON-XXXX IDs
 *
 * Output: canon/CANON-<CATEGORY>.jsonl
 *
 * @example
 *   import { aggregateCategory } from './aggregate-category.js';
 *   const { findings, report } = await aggregateCategory(sessionPath, 'security');
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");

// Similarity threshold for title-based deduplication
const TITLE_SIMILARITY_THRESHOLD = 0.8;

// Maximum string length for Levenshtein to prevent O(n²) blowup
const MAX_LEVENSHTEIN_LENGTH = 200;

/**
 * Calculate Levenshtein distance (for title similarity)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance
 */
function levenshteinDistance(str1, str2) {
  let s1 = str1.length > MAX_LEVENSHTEIN_LENGTH ? str1.slice(0, MAX_LEVENSHTEIN_LENGTH) : str1;
  let s2 = str2.length > MAX_LEVENSHTEIN_LENGTH ? str2.slice(0, MAX_LEVENSHTEIN_LENGTH) : str2;
  if (s1.length < s2.length) [s1, s2] = [s2, s1];
  const m = s1.length;
  const n = s2.length;
  let prevRow = Array.from({ length: n + 1 }, (_, i) => i);
  let currentRow = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    currentRow[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(currentRow[j - 1] + 1, prevRow[j] + 1, prevRow[j - 1] + cost);
    }
    prevRow = [...currentRow];
  }
  return prevRow[n];
}

/**
 * Calculate similarity score between two strings (0-1)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  // Normalize strings
  const normalized1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const normalized2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, "");

  const maxLen = Math.max(normalized1.length, normalized2.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(normalized1, normalized2);
  return 1 - distance / maxLen;
}

/**
 * Extract file:line key for deduplication
 * @param {object} finding - Finding object
 * @returns {string|null} - File:line key or null
 */
function getFileLineKey(finding) {
  if (!finding.files || finding.files.length === 0) return null;

  const file = finding.files[0];

  // Extract line number if present (file.ts:123)
  const match = file.match(/^(.+?):(\d+)$/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }

  // Also check for line field
  if (finding.line) {
    return `${file}:${finding.line}`;
  }

  // Return just the file path
  return file;
}

/**
 * Generate a normalized title key for fuzzy matching
 * @param {string} title - Title string
 * @returns {string} - Normalized key
 */
function normalizeTitle(title) {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

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

  let content;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Cannot read file: ${filePath}`);
    if (process.env.VERBOSE) console.warn(`  Reason: ${msg}`);
    return [];
  }
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
 * Verify if a file exists in the repository
 * @param {string} filePath - File path to verify
 * @returns {boolean} - True if file exists
 */
function verifyFileExists(filePath) {
  if (!filePath) return false;

  // Clean up the path (remove line numbers, normalize)
  const cleanPath = filePath.replace(/:+\d+$/, "").trim();

  // Try different possible locations
  const possiblePaths = [
    join(REPO_ROOT, cleanPath),
    join(REPO_ROOT, "src", cleanPath),
    join(REPO_ROOT, "app", cleanPath),
    join(REPO_ROOT, "lib", cleanPath),
    join(REPO_ROOT, "components", cleanPath),
    join(REPO_ROOT, "functions", cleanPath),
    join(REPO_ROOT, "functions/src", cleanPath),
  ];

  return possiblePaths.some((p) => existsSync(p));
}

/**
 * Merge two findings, combining their sources and evidence
 * @param {object} primary - Primary finding (kept)
 * @param {object} secondary - Secondary finding (merged in)
 * @returns {object} - Merged finding
 */
function mergeFindings(primary, secondary) {
  // Combine sources
  const sources = [...(primary.sources || [])];
  for (const src of secondary.sources || []) {
    if (!sources.some((s) => s.source === src.source)) {
      sources.push(src);
    }
  }

  // Combine evidence
  const evidence = [
    ...(Array.isArray(primary.evidence)
      ? primary.evidence
      : primary.evidence
        ? [primary.evidence]
        : []),
    ...(Array.isArray(secondary.evidence)
      ? secondary.evidence
      : secondary.evidence
        ? [secondary.evidence]
        : []),
  ].filter((e, i, arr) => arr.indexOf(e) === i);

  // Combine files
  const files = [...new Set([...(primary.files || []), ...(secondary.files || [])])];

  // Take worst severity
  const severityRank = { S0: 0, S1: 1, S2: 2, S3: 3 };
  const severity =
    (severityRank[primary.severity] || 2) <= (severityRank[secondary.severity] || 2)
      ? primary.severity
      : secondary.severity;

  // Take highest effort
  const effortRank = { E0: 0, E1: 1, E2: 2, E3: 3 };
  const effort =
    (effortRank[primary.effort] || 1) >= (effortRank[secondary.effort] || 1)
      ? primary.effort
      : secondary.effort;

  // Average confidence
  const pConf = Number.isFinite(primary.confidence) ? primary.confidence : 70;
  const sConf = Number.isFinite(secondary.confidence) ? secondary.confidence : 70;
  const confidence = Math.round((pConf + sConf) / 2);

  return {
    ...primary,
    sources,
    evidence: evidence.length > 0 ? evidence : undefined,
    files,
    severity,
    effort,
    confidence,
    merged_from: [...(primary.merged_from || [primary.fingerprint]), secondary.fingerprint],
  };
}

/**
 * Deduplicate findings using multi-tier strategy
 * @param {object[]} findings - Array of findings with source info
 * @returns {{ unique: object[], dedupLog: object[] }}
 */
function deduplicateFindings(findings) {
  const dedupLog = [];
  const unique = [];

  // Index structures for efficient lookup
  const fingerprintIndex = new Map(); // fingerprint → finding index
  const fileLineIndex = new Map(); // file:line → finding indices
  const titleIndex = new Map(); // normalized title → finding indices

  for (let i = 0; i < findings.length; i++) {
    const finding = findings[i];
    let merged = false;

    // Tier 1: Exact fingerprint match
    if (finding.fingerprint && fingerprintIndex.has(finding.fingerprint)) {
      const existingIdx = fingerprintIndex.get(finding.fingerprint);
      unique[existingIdx] = mergeFindings(unique[existingIdx], finding);
      dedupLog.push({
        action: "merged",
        reason: "fingerprint_match",
        finding1: unique[existingIdx].fingerprint,
        finding2: finding.fingerprint,
      });
      merged = true;
    }

    // Tier 2: File:line match
    if (!merged) {
      const fileLineKey = getFileLineKey(finding);
      if (fileLineKey && fileLineIndex.has(fileLineKey)) {
        const candidates = fileLineIndex.get(fileLineKey);
        for (const candidateIdx of candidates) {
          const candidate = unique[candidateIdx];
          // Additional check: title similarity should be reasonable
          const similarity = calculateSimilarity(finding.title, candidate.title);
          if (similarity > 0.5) {
            unique[candidateIdx] = mergeFindings(candidate, finding);
            dedupLog.push({
              action: "merged",
              reason: "file_line_match",
              key: fileLineKey,
              similarity,
            });
            merged = true;
            break;
          }
        }
      }
    }

    // Tier 3: Title similarity match (same category only)
    if (!merged) {
      const normalizedTitle = normalizeTitle(finding.title);
      if (normalizedTitle && titleIndex.has(normalizedTitle)) {
        // Exact normalized title match
        const existingIdx = titleIndex.get(normalizedTitle);
        unique[existingIdx] = mergeFindings(unique[existingIdx], finding);
        dedupLog.push({
          action: "merged",
          reason: "title_exact_match",
          title: finding.title?.substring(0, 50),
        });
        merged = true;
      } else if (normalizedTitle) {
        // Check for similar titles
        for (const [existingTitle, existingIdx] of titleIndex) {
          const similarity = calculateSimilarity(normalizedTitle, existingTitle);
          if (similarity >= TITLE_SIMILARITY_THRESHOLD) {
            // Also verify same category
            if (finding.category === unique[existingIdx].category) {
              unique[existingIdx] = mergeFindings(unique[existingIdx], finding);
              dedupLog.push({
                action: "merged",
                reason: "title_similarity",
                similarity,
                title1: finding.title?.substring(0, 50),
                title2: unique[existingIdx].title?.substring(0, 50),
              });
              merged = true;
              break;
            }
          }
        }
      }
    }

    // Not merged - add as new unique finding
    if (!merged) {
      const idx = unique.length;
      unique.push(finding);

      // Update indices
      if (finding.fingerprint) {
        fingerprintIndex.set(finding.fingerprint, idx);
      }

      const fileLineKey = getFileLineKey(finding);
      if (fileLineKey) {
        if (!fileLineIndex.has(fileLineKey)) {
          fileLineIndex.set(fileLineKey, []);
        }
        fileLineIndex.get(fileLineKey).push(idx);
      }

      const normalizedTitle = normalizeTitle(finding.title);
      if (normalizedTitle) {
        titleIndex.set(normalizedTitle, idx);
      }
    }
  }

  return { unique, dedupLog };
}

/**
 * Calculate consensus score based on sources
 * @param {object} finding - Finding with sources array
 * @returns {number} - Consensus score (0-5+)
 */
function calculateConsensusScore(finding) {
  if (!finding.sources || !Array.isArray(finding.sources)) {
    return 1;
  }

  // Base score = number of unique sources
  const uniqueSources = new Set(finding.sources.map((s) => s.source));
  let score = uniqueSources.size;

  // Bonus for high confidence
  if (finding.confidence >= 80) {
    score += 0.5;
  }

  // Bonus for file verification
  if (finding.verified) {
    score += 0.5;
  }

  return Math.round(score * 10) / 10;
}

/**
 * Aggregate findings for a category
 * @param {string} sessionPath - Path to session directory
 * @param {string} category - Category name
 * @returns {{ findings: object[], report: object }}
 */
export async function aggregateCategory(sessionPath, category) {
  const rawDir = join(sessionPath, "raw");

  if (!existsSync(rawDir)) {
    return {
      findings: [],
      report: { error: `Raw directory not found: ${rawDir}` },
    };
  }

  // Find all source files for this category
  // Exclude intermediate pipeline files (.normalized.jsonl, .fixed.jsonl)
  const files = readdirSync(rawDir).filter(
    (f) =>
      f.startsWith(`${category}-`) &&
      f.endsWith(".jsonl") &&
      !f.includes(".normalized.") &&
      !f.includes(".fixed.")
  );

  if (files.length === 0) {
    return {
      findings: [],
      report: { error: `No source files found for category: ${category}` },
    };
  }

  // Load all findings with source tracking
  const allFindings = [];
  const sourceStats = {};

  for (const file of files) {
    const sourceName = file.replace(`${category}-`, "").replaceAll(".jsonl", "");
    const findings = parseJsonlFile(join(rawDir, file));

    sourceStats[sourceName] = findings.length;

    for (const finding of findings) {
      // Add source tracking
      finding.sources = [
        {
          source: sourceName,
          file,
          original_fingerprint: finding.fingerprint,
        },
      ];
      allFindings.push(finding);
    }
  }

  console.log(`Loaded ${allFindings.length} findings from ${files.length} sources`);

  // Deduplicate
  const { unique, dedupLog } = deduplicateFindings(allFindings);
  console.log(`After deduplication: ${unique.length} unique findings`);

  // Verify files and calculate consensus
  let verifiedCount = 0;
  let unverifiedCount = 0;

  for (const finding of unique) {
    // Verify file existence
    if (finding.files && finding.files.length > 0) {
      const verified = finding.files.some((f) => verifyFileExists(f));
      finding.verified = verified;
      if (verified) {
        verifiedCount++;
      } else {
        unverifiedCount++;
        // Reduce confidence for unverified files
        finding.confidence = Math.max(40, finding.confidence - 15);
      }
    }

    // Calculate consensus score
    finding.consensus_score = calculateConsensusScore(finding);
  }

  // Assign CANON IDs and sort by severity/consensus
  const severityRank = { S0: 0, S1: 1, S2: 2, S3: 3 };
  unique.sort((a, b) => {
    // Sort by severity first
    const sevDiff = (severityRank[a.severity] || 2) - (severityRank[b.severity] || 2);
    if (sevDiff !== 0) return sevDiff;

    // Then by consensus score
    return (b.consensus_score || 0) - (a.consensus_score || 0);
  });

  // Assign canonical IDs
  const canonFindings = unique.map((finding, idx) => ({
    ...finding,
    canonical_id: `CANON-${String(idx + 1).padStart(4, "0")}`,
    category: finding.category || category,
    status: finding.consensus_score >= 2 ? "CONFIRMED" : "SUSPECTED",
  }));

  // Count severities
  const severityCounts = { S0: 0, S1: 0, S2: 0, S3: 0 };
  for (const f of canonFindings) {
    if (f.severity in severityCounts) {
      severityCounts[f.severity]++;
    }
  }

  // Write output
  const outputPath = join(sessionPath, "canon", `CANON-${category.toUpperCase()}.jsonl`);
  const jsonl = canonFindings.map((f) => JSON.stringify(f)).join("\n");
  writeFileSync(outputPath, jsonl);

  const report = {
    category,
    sources: sourceStats,
    source_count: files.length,
    raw_findings: allFindings.length,
    unique_findings: canonFindings.length,
    dedup_merges: dedupLog.filter((l) => l.action === "merged").length,
    verified: verifiedCount,
    unverified: unverifiedCount,
    severities: severityCounts,
    output_path: outputPath,
  };

  console.log(`\n=== Category Aggregation: ${category.toUpperCase()} ===`);
  console.log(`Sources: ${Object.keys(sourceStats).join(", ")}`);
  console.log(`Raw: ${allFindings.length} → Unique: ${canonFindings.length}`);
  console.log(`Verified: ${verifiedCount}, Unverified: ${unverifiedCount}`);
  console.log(
    `Severities: S0=${severityCounts.S0}, S1=${severityCounts.S1}, S2=${severityCounts.S2}, S3=${severityCounts.S3}`
  );
  console.log(`Output: ${outputPath}`);

  return { findings: canonFindings, report };
}

/**
 * Get summary of raw files for a category
 * @param {string} sessionPath - Session directory path
 * @param {string} category - Category name
 * @returns {object} - Summary of available sources
 */
export function getCategorySources(sessionPath, category) {
  const rawDir = join(sessionPath, "raw");

  if (!existsSync(rawDir)) {
    return { sources: [], total_findings: 0 };
  }

  // Exclude intermediate pipeline files (.normalized.jsonl, .fixed.jsonl)
  const files = readdirSync(rawDir).filter(
    (f) =>
      f.startsWith(`${category}-`) &&
      f.endsWith(".jsonl") &&
      !f.includes(".normalized.") &&
      !f.includes(".fixed.")
  );

  const sources = [];
  let totalFindings = 0;

  for (const file of files) {
    const sourceName = file.replace(`${category}-`, "").replaceAll(".jsonl", "");
    let content;
    try {
      content = readFileSync(join(rawDir, file), "utf-8");
    } catch (err) {
      // Expected for missing/inaccessible source files
      const msg = err instanceof Error ? err.message : String(err);
      if (process.env.VERBOSE) console.warn(`  Skipped: ${msg}`);
      sources.push({ name: sourceName, file, count: 0 });
      continue;
    }
    const count = content.split("\n").filter((l) => l.trim()).length;

    sources.push({ name: sourceName, file, count });
    totalFindings += count;
  }

  return { sources, total_findings: totalFindings };
}

// CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Usage: node aggregate-category.js <session-path> <category>");
    console.log("");
    console.log("Aggregates findings for a single category from multiple sources.");
    console.log("Reads from: <session>/raw/<category>-*.jsonl");
    console.log("Writes to: <session>/canon/CANON-<CATEGORY>.jsonl");
    console.log("");
    console.log("Example:");
    console.log("  node aggregate-category.js docs/audits/multi-ai/maa-2026-02-04-abc123 security");
    process.exit(1);
  }

  const [sessionPath, category] = args;

  if (!existsSync(sessionPath)) {
    console.error(`Session path not found: ${sessionPath}`);
    process.exit(1);
  }

  aggregateCategory(sessionPath, category).then(({ findings, report }) => {
    if (report.error) {
      console.error(`Error: ${report.error}`);
      process.exit(1);
    }
    console.log(`\nAggregation complete: ${findings.length} canonical findings`);
  });
}
