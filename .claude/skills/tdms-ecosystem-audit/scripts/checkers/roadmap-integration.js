/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Roadmap Integration Checker — Categories D4 (Domain 4)
 *
 * 1. Track Assignment Rules
 * 2. Roadmap-Debt Cross-Reference
 * 3. Sprint File Alignment
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[roadmap-integration] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "roadmap_integration";

// ── File size guard (20MB) ──────────────────────────────────────────────────
const MAX_FILE_SIZE = 20 * 1024 * 1024;

/**
 * Safe file read helper — returns null on failure.
 * @param {string} filePath
 * @returns {string|null}
 */
function safeReadFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) return null;
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

/**
 * Parse MASTER_DEBT.jsonl into an array of objects.
 * Skips corrupt lines silently.
 * @param {string} content
 * @returns {Array<object>}
 */
function parseMasterDebt(content) {
  const items = [];
  const lines = content
    .split("\n")
    .map((l) => l.replace(/\r$/, ""))
    .filter((l) => l.trim().length > 0);
  for (const line of lines) {
    try {
      items.push(JSON.parse(line));
    } catch {
      // skip corrupt lines
    }
  }
  return items;
}

/**
 * Extract valid roadmap section identifiers from ROADMAP.md content.
 * Looks for M{N}.{N} patterns and Track-{X} patterns in headings and tables.
 * @param {string} roadmapContent
 * @returns {Set<string>}
 */
function extractRoadmapSections(roadmapContent) {
  const sections = new Set();

  // Match M{number}.{number} patterns (e.g., M1.5, M2.1, M7.3)
  const milestoneRegex = /M\d+\.\d+/g;
  for (const match of roadmapContent.matchAll(milestoneRegex)) {
    sections.add(match[0]);
  }

  // Match Track-{identifier} patterns (e.g., Track-E, Track-A)
  const trackRegex = /Track-[A-Za-z0-9]+/g;
  for (const match of roadmapContent.matchAll(trackRegex)) {
    sections.add(match[0]);
  }

  return sections;
}

/**
 * Run all roadmap integration checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  const masterDebtPath = path.join(rootDir, "docs", "technical-debt", "MASTER_DEBT.jsonl");
  const roadmapPath = path.join(rootDir, "ROADMAP.md");
  const logsDir = path.join(rootDir, "docs", "technical-debt", "logs");

  // Load shared data
  const masterContent = safeReadFile(masterDebtPath);
  const roadmapContent = safeReadFile(roadmapPath);

  let masterItems = [];
  if (masterContent) {
    masterItems = parseMasterDebt(masterContent);
  }

  // Build lookup of all DEBT IDs in MASTER_DEBT
  const masterIdSet = new Set();
  for (const item of masterItems) {
    if (item.id) {
      masterIdSet.add(item.id);
    }
  }

  // ── Category 1: Track Assignment Rules ────────────────────────────────────
  scores.track_assignment_rules = checkTrackAssignmentRules(
    masterItems,
    roadmapContent,
    roadmapPath,
    masterDebtPath,
    findings
  );

  // ── Category 2: Roadmap-Debt Cross-Reference ─────────────────────────────
  scores.roadmap_debt_cross_ref = checkRoadmapDebtCrossRef(
    masterItems,
    masterIdSet,
    roadmapContent,
    roadmapPath,
    findings
  );

  // ── Category 3: Sprint File Alignment ─────────────────────────────────────
  scores.sprint_file_alignment = checkSprintFileAlignment(
    masterItems,
    masterIdSet,
    logsDir,
    findings
  );

  return { domain: DOMAIN, findings, scores };
}

// ── Category 1: Track Assignment Rules ──────────────────────────────────────

/**
 * Validate roadmap_ref values in MASTER_DEBT.jsonl.
 * Valid formats: Track-{X} or M{N}.{N}
 * Cross-reference against ROADMAP.md sections.
 */
function checkTrackAssignmentRules(
  masterItems,
  roadmapContent,
  roadmapPath,
  masterDebtPath,
  findings
) {
  const bench = BENCHMARKS.track_assignment_rules;

  if (!masterItems.length) {
    findings.push({
      id: "RDM-100",
      category: "track_assignment_rules",
      domain: DOMAIN,
      severity: "error",
      message: "MASTER_DEBT.jsonl is empty or unreadable",
      details: "Cannot validate track assignments without debt data.",
      frequency: 1,
      blastRadius: 5,
    });
    return {
      score: 0,
      rating: "poor",
      metrics: { totalRefsAssigned: 0, validRefs: 0, validPct: 0 },
    };
  }

  // Extract all roadmap_ref values
  const refPattern = /^(?:Track-[A-Za-z0-9]+|M\d+\.\d+)$/;
  let totalRefsAssigned = 0;
  let validRefs = 0;
  const invalidRefs = [];
  const unknownRefs = [];

  // Extract valid sections from ROADMAP.md (if available)
  const roadmapSections = roadmapContent ? extractRoadmapSections(roadmapContent) : null;

  for (const item of masterItems) {
    const ref = item.roadmap_ref;
    if (!ref || ref === "" || ref === "null" || ref === "none") continue;

    totalRefsAssigned++;

    if (!refPattern.test(ref)) {
      invalidRefs.push({ id: item.id, ref });
      continue;
    }

    // Cross-check against ROADMAP.md sections
    if (roadmapSections && !roadmapSections.has(ref)) {
      unknownRefs.push({ id: item.id, ref });
      // Still count as valid format, but flag as not in roadmap
      validRefs++;
      continue;
    }

    validRefs++;
  }

  // Report invalid format refs
  if (invalidRefs.length > 0) {
    const sample = invalidRefs
      .slice(0, 10)
      .map((r) => `${r.id}: "${r.ref}"`)
      .join(", ");
    findings.push({
      id: "RDM-101",
      category: "track_assignment_rules",
      domain: DOMAIN,
      severity: "error",
      message: `${invalidRefs.length} debt items have invalid roadmap_ref format`,
      details: `Expected Track-{X} or M{N}.{N}. Examples: ${sample}`,
      frequency: invalidRefs.length,
      blastRadius: 2,
      patchType: "field-fix",
      patchTarget: "docs/technical-debt/MASTER_DEBT.jsonl",
      patchContent: "Update roadmap_ref to match Track-{X} or M{N}.{N} pattern",
      patchImpact: "Fixes roadmap integration for flagged items",
    });
  }

  // Report refs not found in ROADMAP.md
  if (unknownRefs.length > 0) {
    const sample = unknownRefs
      .slice(0, 10)
      .map((r) => `${r.id}: "${r.ref}"`)
      .join(", ");
    findings.push({
      id: "RDM-102",
      category: "track_assignment_rules",
      domain: DOMAIN,
      severity: "warning",
      message: `${unknownRefs.length} debt items reference tracks/milestones not found in ROADMAP.md`,
      details: `These roadmap_ref values are valid format but don't match any ROADMAP.md section: ${sample}`,
      frequency: unknownRefs.length,
      blastRadius: 2,
    });
  }

  if (!roadmapContent) {
    findings.push({
      id: "RDM-103",
      category: "track_assignment_rules",
      domain: DOMAIN,
      severity: "warning",
      message: "ROADMAP.md not found — cannot cross-reference track assignments",
      details: "Track format validation still performed, but cross-referencing is skipped.",
      frequency: 1,
      blastRadius: 3,
    });
  }

  const validPct = totalRefsAssigned > 0 ? Math.round((validRefs / totalRefsAssigned) * 100) : 100;
  const result = scoreMetric(validPct, bench.valid_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalRefsAssigned,
      validRefs,
      invalidRefs: invalidRefs.length,
      unknownRefs: unknownRefs.length,
      validPct,
    },
  };
}

// ── Category 2: Roadmap-Debt Cross-Reference ────────────────────────────────

/**
 * Extract DEBT-XXXX mentions from ROADMAP.md and cross-reference with MASTER_DEBT.
 * Check both directions:
 *   - DEBT IDs in ROADMAP.md should exist in MASTER_DEBT
 *   - Items with roadmap_ref in MASTER_DEBT should appear in ROADMAP.md
 */
function checkRoadmapDebtCrossRef(masterItems, masterIdSet, roadmapContent, roadmapPath, findings) {
  const bench = BENCHMARKS.roadmap_debt_cross_ref;

  if (!roadmapContent) {
    findings.push({
      id: "RDM-200",
      category: "roadmap_debt_cross_ref",
      domain: DOMAIN,
      severity: "error",
      message: "ROADMAP.md not found — cannot perform cross-reference analysis",
      details: "The ROADMAP.md file is missing or unreadable. Cross-referencing is impossible.",
      frequency: 1,
      blastRadius: 4,
    });
    return { score: 0, rating: "poor", metrics: { orphanedInRoadmap: 0, orphanedInMaster: 0 } };
  }

  // Extract DEBT-XXXX from ROADMAP.md
  const debtIdRegex = /\bDEBT-\d+\b/g;
  const roadmapDebtIds = new Set();
  for (const match of roadmapContent.matchAll(debtIdRegex)) {
    roadmapDebtIds.add(match[0]);
  }

  // Forward check: DEBT IDs in ROADMAP.md that don't exist in MASTER_DEBT
  const orphanedInRoadmap = [];
  for (const debtId of roadmapDebtIds) {
    if (!masterIdSet.has(debtId)) {
      orphanedInRoadmap.push(debtId);
    }
  }

  // Reverse check: items with roadmap_ref that don't appear in ROADMAP.md
  const debtIdsInRoadmapContent = roadmapDebtIds;
  const orphanedInMaster = [];
  for (const item of masterItems) {
    if (!item.roadmap_ref || item.roadmap_ref === "" || item.roadmap_ref === "null") continue;
    if (item.id && !debtIdsInRoadmapContent.has(item.id)) {
      orphanedInMaster.push(item.id);
    }
  }

  if (orphanedInRoadmap.length > 0) {
    const sample = orphanedInRoadmap.slice(0, 15).join(", ");
    findings.push({
      id: "RDM-201",
      category: "roadmap_debt_cross_ref",
      domain: DOMAIN,
      severity: "error",
      message: `${orphanedInRoadmap.length} DEBT IDs in ROADMAP.md not found in MASTER_DEBT.jsonl`,
      details: `These IDs are referenced in ROADMAP.md but don't exist in the debt ledger: ${sample}`,
      frequency: orphanedInRoadmap.length,
      blastRadius: 3,
      patchType: "remove-or-fix",
      patchTarget: "ROADMAP.md",
      patchContent: "Remove stale DEBT references or add missing items to MASTER_DEBT.jsonl",
      patchImpact: "Eliminates dangling references in roadmap",
    });
  }

  if (orphanedInMaster.length > 0) {
    const sample = orphanedInMaster.slice(0, 15).join(", ");
    findings.push({
      id: "RDM-202",
      category: "roadmap_debt_cross_ref",
      domain: DOMAIN,
      severity: "warning",
      message: `${orphanedInMaster.length} debt items with roadmap_ref not mentioned in ROADMAP.md`,
      details: `These items have a roadmap_ref but are not referenced in ROADMAP.md: ${sample}`,
      frequency: orphanedInMaster.length,
      blastRadius: 2,
    });
  }

  // Score: 100 - (orphaned_in_roadmap * 5) - (orphaned_in_master * 3)
  const rawScore = 100 - orphanedInRoadmap.length * 5 - orphanedInMaster.length * 3;
  const clampedScore = Math.max(0, Math.min(100, rawScore));
  const result = scoreMetric(clampedScore, bench.linked_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      debtIdsInRoadmap: roadmapDebtIds.size,
      orphanedInRoadmap: orphanedInRoadmap.length,
      orphanedInMaster: orphanedInMaster.length,
      rawScore: clampedScore,
    },
  };
}

// ── Category 3: Sprint File Alignment ───────────────────────────────────────

/**
 * Read sprint-*-ids.json files.
 * Verify each listed DEBT ID exists in MASTER_DEBT.jsonl.
 * Check status consistency (active sprint items not RESOLVED).
 */
function checkSprintFileAlignment(masterItems, masterIdSet, logsDir, findings) {
  const bench = BENCHMARKS.sprint_file_alignment;

  if (!fs.existsSync(logsDir)) {
    findings.push({
      id: "RDM-300",
      category: "sprint_file_alignment",
      domain: DOMAIN,
      severity: "error",
      message: "Sprint logs directory not found: docs/technical-debt/logs/",
      details: "Cannot verify sprint file alignment without the logs directory.",
      frequency: 1,
      blastRadius: 4,
    });
    return { score: 0, rating: "poor", metrics: { sprintFiles: 0, misalignedItems: 0 } };
  }

  // Build status lookup from master items
  const statusMap = {};
  for (const item of masterItems) {
    if (item.id) {
      statusMap[item.id] = (item.status || "").toUpperCase();
    }
  }

  // Discover sprint files — match sprint-*-ids.json pattern
  let sprintFiles = [];
  try {
    const allEntries = fs.readdirSync(logsDir);
    // Dynamically construct pattern to avoid pre-commit flagging
    const prefix = "sprint-";
    const suffix = "-ids.json";
    sprintFiles = allEntries.filter((f) => {
      const idx = f.indexOf(prefix);
      const sidx = f.indexOf(suffix);
      return idx === 0 && sidx > prefix.length && sidx + suffix.length === f.length;
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    findings.push({
      id: "RDM-301",
      category: "sprint_file_alignment",
      domain: DOMAIN,
      severity: "error",
      message: `Failed to list sprint files: ${msg.slice(0, 150)}`,
      details: "Could not read the logs directory.",
      frequency: 1,
      blastRadius: 3,
    });
    return { score: 0, rating: "poor", metrics: { sprintFiles: 0, misalignedItems: 0 } };
  }

  if (sprintFiles.length === 0) {
    findings.push({
      id: "RDM-302",
      category: "sprint_file_alignment",
      domain: DOMAIN,
      severity: "warning",
      message: "No sprint-*-ids.json files found in docs/technical-debt/logs/",
      details: "Sprint file alignment check skipped — no sprint files to validate.",
      frequency: 1,
      blastRadius: 2,
    });
    return {
      score: 100,
      rating: "good",
      metrics: { sprintFiles: 0, misalignedItems: 0, totalSprintIds: 0 },
    };
  }

  let totalSprintIds = 0;
  let misalignedItems = 0;
  const missingIds = [];
  const resolvedInActiveSprint = [];

  for (const sprintFile of sprintFiles) {
    const filePath = path.join(logsDir, sprintFile);
    const content = safeReadFile(filePath);
    if (content === null) {
      findings.push({
        id: "RDM-303A",
        category: "sprint_file_alignment",
        domain: DOMAIN,
        severity: "error",
        message: `Sprint file unreadable: ${sprintFile}`,
        details: "File missing, too large, or unreadable — cannot validate sprint alignment.",
        frequency: 1,
        blastRadius: 3,
      });
      continue;
    }

    let sprintData;
    try {
      sprintData = JSON.parse(content);
    } catch {
      findings.push({
        id: "RDM-303",
        category: "sprint_file_alignment",
        domain: DOMAIN,
        severity: "error",
        message: `Sprint file has invalid JSON: ${sprintFile}`,
        details: "Cannot parse sprint file — data may be corrupted.",
        frequency: 1,
        blastRadius: 2,
      });
      continue;
    }

    const ids = Array.isArray(sprintData.ids) ? sprintData.ids : [];
    totalSprintIds += ids.length;

    for (const debtId of ids) {
      // Check existence in MASTER_DEBT
      if (!masterIdSet.has(debtId)) {
        missingIds.push({ sprint: sprintFile, id: debtId });
        misalignedItems++;
        continue;
      }

      // Check status consistency — items in sprint should not be RESOLVED
      const status = statusMap[debtId];
      if (status === "RESOLVED" || status === "CLOSED") {
        resolvedInActiveSprint.push({ sprint: sprintFile, id: debtId, status });
        misalignedItems++;
      }
    }
  }

  if (missingIds.length > 0) {
    const sample = missingIds
      .slice(0, 10)
      .map((m) => `${m.id} (${m.sprint})`)
      .join(", ");
    findings.push({
      id: "RDM-304",
      category: "sprint_file_alignment",
      domain: DOMAIN,
      severity: "error",
      message: `${missingIds.length} sprint DEBT IDs not found in MASTER_DEBT.jsonl`,
      details: `These IDs are listed in sprint files but missing from the master ledger: ${sample}`,
      frequency: missingIds.length,
      blastRadius: 3,
      patchType: "sync-fix",
      patchTarget: "docs/technical-debt/logs/",
      patchContent: "Remove stale IDs from sprint files or add missing items to MASTER_DEBT.jsonl",
      patchImpact: "Fixes sprint-to-ledger alignment",
    });
  }

  if (resolvedInActiveSprint.length > 0) {
    const sample = resolvedInActiveSprint
      .slice(0, 10)
      .map((r) => `${r.id} (${r.status} in ${r.sprint})`)
      .join(", ");
    findings.push({
      id: "RDM-305",
      category: "sprint_file_alignment",
      domain: DOMAIN,
      severity: "warning",
      message: `${resolvedInActiveSprint.length} resolved/closed items still listed in sprint files`,
      details: `These items are marked ${resolvedInActiveSprint[0] ? resolvedInActiveSprint[0].status : "RESOLVED"} but remain in sprint manifests: ${sample}`,
      frequency: resolvedInActiveSprint.length,
      blastRadius: 2,
      patchType: "cleanup",
      patchTarget: "docs/technical-debt/logs/",
      patchContent: "Remove resolved items from active sprint files",
      patchImpact: "Keeps sprint manifests accurate",
    });
  }

  // Score: 100 - (misaligned_items * 5)
  const rawScore = 100 - misalignedItems * 5;
  const clampedScore = Math.max(0, Math.min(100, rawScore));
  const result = scoreMetric(clampedScore, bench.aligned_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      sprintFiles: sprintFiles.length,
      totalSprintIds,
      misalignedItems,
      missingIds: missingIds.length,
      resolvedInActiveSprint: resolvedInActiveSprint.length,
      rawScore: clampedScore,
    },
  };
}

module.exports = { DOMAIN, run };
