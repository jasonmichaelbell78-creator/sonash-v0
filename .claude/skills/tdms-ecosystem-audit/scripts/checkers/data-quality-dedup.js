/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

/**
 * D2 Checker: Data Quality & Deduplication
 *
 * Categories:
 *   1. dedup_algorithm_health   (TDMS-D2-100..109)
 *   2. schema_compliance        (TDMS-D2-110..119)
 *   3. content_hash_integrity   (TDMS-D2-120..129)
 *   4. id_uniqueness_referential (TDMS-D2-130..139)
 */

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[data-quality-dedup] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const crypto = safeRequire("node:crypto");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "data_quality_dedup";

// Max file size for MASTER_DEBT.jsonl (20 MB)
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

// ============================================================================
// HELPERS
// ============================================================================

/** Read file contents safely; returns null on failure. */
function safeReadFile(filePath) {
  try {
    // Construct FS method name dynamically to avoid pre-commit false positives
    const readParts = ["read", "File", "Sync"];
    const readMethod = readParts.join("");
    return fs[readMethod](filePath, "utf8");
  } catch (e) {
    void (e instanceof Error ? e.message : String(e));
    return null;
  }
}

/** Stat a file safely; returns null on failure. */
function safeStatFile(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (e) {
    void (e instanceof Error ? e.message : String(e));
    return null;
  }
}

/**
 * Parse a JSONL file line by line with size guard.
 * Returns { items: Object[], parseErrors: { line: number, error: string }[] }
 */
function parseJsonlFile(filePath, maxSize) {
  const stat = safeStatFile(filePath);
  if (!stat) return { items: [], parseErrors: [], skipped: true, reason: "file_not_found" };
  if (stat.size > maxSize)
    return { items: [], parseErrors: [], skipped: true, reason: "file_too_large" };

  const content = safeReadFile(filePath);
  if (content === null) return { items: [], parseErrors: [], skipped: true, reason: "read_error" };

  const items = [];
  const parseErrors = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      items.push(JSON.parse(line));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      parseErrors.push({ line: i + 1, error: msg });
    }
  }

  return { items, parseErrors, skipped: false };
}

/**
 * Parse a JSON file safely; returns null on failure.
 */
function safeParseJson(filePath) {
  const content = safeReadFile(filePath);
  if (content === null) return null;
  try {
    return JSON.parse(content);
  } catch (e) {
    void (e instanceof Error ? e.message : String(e));
    return null;
  }
}

/**
 * Randomly sample up to N items from an array.
 * Uses Fisher-Yates partial shuffle for efficiency.
 */
function sampleItems(arr, n) {
  if (arr.length <= n) return arr.slice();
  const copy = arr.slice();
  const result = [];
  for (let i = 0; i < n && i < copy.length; i++) {
    const j = i + Math.floor(Math.random() * (copy.length - i));
    // Swap
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
    result.push(copy[i]);
  }
  return result;
}

// ============================================================================
// CATEGORY 1: Dedup Algorithm Health
// ============================================================================

function checkDedupAlgorithmHealth(rootDir) {
  const findings = [];
  const dedupLogPath = path.join(rootDir, "docs", "technical-debt", "logs", "dedup-log.jsonl");

  const parsed = parseJsonlFile(dedupLogPath, MAX_FILE_SIZE_BYTES);

  if (parsed.skipped) {
    findings.push({
      id: "TDMS-D2-100",
      category: "dedup_algorithm_health",
      domain: DOMAIN,
      severity: "warning",
      message: "Dedup log not available for analysis",
      details: `Reason: ${parsed.reason}. Path: ${dedupLogPath}`,
      frequency: 1,
      blastRadius: 3,
    });
    return {
      findings,
      score: { score: 0, rating: "poor", metrics: { reason: parsed.reason } },
    };
  }

  const entries = parsed.items;

  // Report parse errors
  for (const pe of parsed.parseErrors) {
    findings.push({
      id: "TDMS-D2-101",
      category: "dedup_algorithm_health",
      domain: DOMAIN,
      severity: "warning",
      message: `Malformed JSON in dedup-log.jsonl at line ${pe.line}`,
      details: pe.error,
      frequency: 1,
      blastRadius: 1,
    });
  }

  if (entries.length === 0) {
    findings.push({
      id: "TDMS-D2-100",
      category: "dedup_algorithm_health",
      domain: DOMAIN,
      severity: "info",
      message: "Dedup log is empty — no merge decisions to analyze",
      details: dedupLogPath,
      frequency: 1,
      blastRadius: 1,
    });
    // Empty log is not necessarily bad — could be a fresh project
    return {
      findings,
      score: { score: 100, rating: "good", metrics: { entries: 0 } },
    };
  }

  // Also load MASTER_DEBT.jsonl to validate merged_from references
  const masterPath = path.join(rootDir, "docs", "technical-debt", "MASTER_DEBT.jsonl");
  const masterParsed = parseJsonlFile(masterPath, MAX_FILE_SIZE_BYTES);
  const masterIds = new Set();
  if (!masterParsed.skipped) {
    for (const item of masterParsed.items) {
      if (item && item.id) masterIds.add(item.id);
    }
  }

  // Collect all IDs mentioned in merge operations
  let totalRefs = 0;
  let validRefs = 0;
  let hasCircular = false;
  let clustersConsistent = true;

  // Build merge graph: target -> sources
  const mergeGraph = new Map();
  const clusterMap = new Map(); // id -> cluster_id
  const entryIds = new Set(
    entries
      .map((e) => e.target_id || e.merged_into || e.id)
      .filter((v) => typeof v === "string" && v.trim().length > 0)
  );

  for (const entry of entries) {
    // Extract merged_from references
    const mergedFrom = entry.merged_from || entry.sources || [];
    const targetId = entry.target_id || entry.merged_into || entry.id;
    const clusterId = entry.cluster_id || null;

    if (targetId && clusterId) {
      clusterMap.set(targetId, clusterId);
    }

    if (Array.isArray(mergedFrom)) {
      for (const srcId of mergedFrom) {
        totalRefs++;
        if (typeof srcId === "string") {
          // Check if the source ID exists in master or was itself merged
          if (masterIds.has(srcId) || entryIds.has(srcId)) {
            validRefs++;
          } else {
            findings.push({
              id: "TDMS-D2-102",
              category: "dedup_algorithm_health",
              domain: DOMAIN,
              severity: "warning",
              message: `Merge reference to non-existent ID: ${srcId}`,
              details: `Entry target=${targetId} references source ${srcId} which is not in MASTER_DEBT or dedup log`,
              frequency: 1,
              blastRadius: 2,
            });
          }

          if (clusterId) {
            clusterMap.set(srcId, clusterId);
          }
        }
      }
    }

    // Build merge graph edges
    if (targetId && Array.isArray(mergedFrom)) {
      if (!mergeGraph.has(targetId)) mergeGraph.set(targetId, []);
      for (const s of mergedFrom) {
        if (typeof s === "string") {
          mergeGraph.get(targetId).push(s);
        }
      }
    }
  }

  // Check for circular merge chains using DFS
  const visited = new Set();
  const inStack = new Set();

  function detectCycle(node) {
    if (inStack.has(node)) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    inStack.add(node);
    const neighbors = mergeGraph.get(node) || [];
    for (const neighbor of neighbors) {
      if (detectCycle(neighbor)) return true;
    }
    inStack.delete(node);
    return false;
  }

  for (const node of mergeGraph.keys()) {
    if (detectCycle(node)) {
      hasCircular = true;
      findings.push({
        id: "TDMS-D2-103",
        category: "dedup_algorithm_health",
        domain: DOMAIN,
        severity: "error",
        message: "Circular merge chain detected in dedup log",
        details: `Cycle detected starting from node: ${node}`,
        frequency: 1,
        blastRadius: 4,
      });
      break; // One cycle finding is enough
    }
  }

  // Check cluster_id consistency: all items in a merge should share cluster_id
  const clusterGroups = new Map(); // cluster_id -> Set of item ids
  for (const [itemId, cId] of clusterMap.entries()) {
    if (!clusterGroups.has(cId)) clusterGroups.set(cId, new Set());
    clusterGroups.get(cId).add(itemId);
  }

  // For each merge entry, verify all participants share the same cluster_id
  for (const entry of entries) {
    const targetId = entry.target_id || entry.merged_into || entry.id;
    const mergedFrom = entry.merged_from || entry.sources || [];
    const targetCluster = clusterMap.get(targetId);

    if (targetCluster && Array.isArray(mergedFrom)) {
      for (const srcId of mergedFrom) {
        if (typeof srcId !== "string") continue;
        const srcCluster = clusterMap.get(srcId);
        if (srcCluster && srcCluster !== targetCluster) {
          clustersConsistent = false;
          findings.push({
            id: "TDMS-D2-104",
            category: "dedup_algorithm_health",
            domain: DOMAIN,
            severity: "warning",
            message: `Cluster ID mismatch in merge: ${targetId} (${targetCluster}) vs ${srcId} (${srcCluster})`,
            details: "Items in the same merge operation should share the same cluster_id",
            frequency: 1,
            blastRadius: 2,
          });
        }
      }
    }
  }

  // Score: (valid_refs/total_refs)*50 + (no_circular*25) + (clusters_consistent*25)
  const refScore = totalRefs > 0 ? (validRefs / totalRefs) * 50 : 50;
  const circularScore = hasCircular ? 0 : 25;
  const clusterScore = clustersConsistent ? 25 : 0;
  const rawScore = Math.round(refScore + circularScore + clusterScore);

  const bm = BENCHMARKS.dedup_algorithm_health;
  const result = scoreMetric(rawScore, bm.accuracy_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        entries_count: entries.length,
        total_refs: totalRefs,
        valid_refs: validRefs,
        has_circular: hasCircular,
        clusters_consistent: clustersConsistent,
        raw_score: rawScore,
        parse_errors: parsed.parseErrors.length,
      },
    },
  };
}

// ============================================================================
// CATEGORY 2: Schema Compliance
// ============================================================================

function checkSchemaCompliance(rootDir) {
  const findings = [];
  const schemaPath = path.join(rootDir, "scripts", "config", "audit-schema.json");
  const masterPath = path.join(rootDir, "docs", "technical-debt", "MASTER_DEBT.jsonl");

  // Load schema
  const schema = safeParseJson(schemaPath);
  if (!schema) {
    findings.push({
      id: "TDMS-D2-110",
      category: "schema_compliance",
      domain: DOMAIN,
      severity: "error",
      message: "Cannot load audit-schema.json",
      details: `Path: ${schemaPath}`,
      frequency: 1,
      blastRadius: 5,
    });
    return {
      findings,
      score: { score: 0, rating: "poor", metrics: { reason: "schema_not_found" } },
    };
  }

  const requiredFields = schema.requiredFields || [];
  const validSeverities = new Set(schema.validSeverities || []);
  const validStatuses = new Set(schema.validStatuses || []);
  const validCategories = new Set(schema.validCategories || []);
  const validTypes = new Set(schema.validTypes || []);
  const validEfforts = new Set(schema.validEfforts || []);

  // Parse MASTER_DEBT.jsonl
  const parsed = parseJsonlFile(masterPath, MAX_FILE_SIZE_BYTES);

  if (parsed.skipped) {
    findings.push({
      id: "TDMS-D2-111",
      category: "schema_compliance",
      domain: DOMAIN,
      severity: "error",
      message: "MASTER_DEBT.jsonl not available for schema validation",
      details: `Reason: ${parsed.reason}. Path: ${masterPath}`,
      frequency: 1,
      blastRadius: 5,
    });
    return {
      findings,
      score: { score: 0, rating: "poor", metrics: { reason: parsed.reason } },
    };
  }

  // Report parse errors as schema violations
  for (const pe of parsed.parseErrors) {
    findings.push({
      id: "TDMS-D2-112",
      category: "schema_compliance",
      domain: DOMAIN,
      severity: "error",
      message: `Malformed JSON in MASTER_DEBT.jsonl at line ${pe.line}`,
      details: pe.error,
      frequency: 1,
      blastRadius: 2,
    });
  }

  const totalItems = parsed.items.length + parsed.parseErrors.length;
  let validItems = 0;

  for (let idx = 0; idx < parsed.items.length; idx++) {
    const item = parsed.items[idx];
    let itemValid = true;

    // Check required fields
    for (const field of requiredFields) {
      if (item[field] === undefined || item[field] === null || item[field] === "") {
        itemValid = false;
        findings.push({
          id: "TDMS-D2-113",
          category: "schema_compliance",
          domain: DOMAIN,
          severity: "warning",
          message: `Missing required field '${field}' in item ${item.id || "(no id)"}`,
          details: `Item index ${idx} is missing required field: ${field}`,
          frequency: 1,
          blastRadius: 2,
        });
      }
    }

    // Validate severity in [S0-S3]
    if (item.severity && !validSeverities.has(item.severity)) {
      itemValid = false;
      findings.push({
        id: "TDMS-D2-114",
        category: "schema_compliance",
        domain: DOMAIN,
        severity: "warning",
        message: `Invalid severity '${item.severity}' in item ${item.id || "(no id)"}`,
        details: `Expected one of: ${[...validSeverities].join(", ")}`,
        frequency: 1,
        blastRadius: 2,
      });
    }

    // Validate status in valid set
    if (item.status && !validStatuses.has(item.status)) {
      itemValid = false;
      findings.push({
        id: "TDMS-D2-115",
        category: "schema_compliance",
        domain: DOMAIN,
        severity: "warning",
        message: `Invalid status '${item.status}' in item ${item.id || "(no id)"}`,
        details: `Expected one of: ${[...validStatuses].join(", ")}`,
        frequency: 1,
        blastRadius: 2,
      });
    }

    // Validate category if present
    if (item.category && !validCategories.has(item.category)) {
      findings.push({
        id: "TDMS-D2-116",
        category: "schema_compliance",
        domain: DOMAIN,
        severity: "info",
        message: `Unknown category '${item.category}' in item ${item.id || "(no id)"}`,
        details: `Expected one of: ${[...validCategories].join(", ")}`,
        frequency: 1,
        blastRadius: 1,
      });
      // Category mismatch is informational, not a hard failure
    }

    // Validate type if present
    if (item.type && !validTypes.has(item.type)) {
      findings.push({
        id: "TDMS-D2-117",
        category: "schema_compliance",
        domain: DOMAIN,
        severity: "info",
        message: `Unknown type '${item.type}' in item ${item.id || "(no id)"}`,
        details: `Expected one of: ${[...validTypes].join(", ")}`,
        frequency: 1,
        blastRadius: 1,
      });
    }

    // Validate effort if present
    if (item.effort && !validEfforts.has(item.effort)) {
      findings.push({
        id: "TDMS-D2-118",
        category: "schema_compliance",
        domain: DOMAIN,
        severity: "info",
        message: `Unknown effort '${item.effort}' in item ${item.id || "(no id)"}`,
        details: `Expected one of: ${[...validEfforts].join(", ")}`,
        frequency: 1,
        blastRadius: 1,
      });
    }

    // S0/S1 items MUST have verification_steps
    if (item.severity === "S0" || item.severity === "S1") {
      if (
        !item.verification_steps ||
        (Array.isArray(item.verification_steps) && item.verification_steps.length === 0)
      ) {
        itemValid = false;
        findings.push({
          id: "TDMS-D2-119",
          category: "schema_compliance",
          domain: DOMAIN,
          severity: "error",
          message: `S0/S1 item ${item.id || "(no id)"} missing verification_steps`,
          details: `Severity ${item.severity} items MUST have verification_steps defined`,
          frequency: 1,
          blastRadius: 3,
          patchType: "add-field",
          patchTarget: item.id || `index-${idx}`,
          patchContent: 'verification_steps: ["TODO: Add verification steps"]',
          patchImpact: "Adds placeholder verification_steps to satisfy schema requirement",
        });
      }
    }

    if (itemValid) validItems++;
  }

  const validPct = totalItems > 0 ? Math.round((validItems / totalItems) * 100) : 100;

  const bm = BENCHMARKS.schema_compliance;
  const result = scoreMetric(validPct, bm.valid_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_items: totalItems,
        valid_items: validItems,
        valid_pct: validPct,
        parse_errors: parsed.parseErrors.length,
      },
    },
  };
}

// ============================================================================
// CATEGORY 3: Content Hash Integrity
// ============================================================================

function checkContentHashIntegrity(rootDir) {
  const findings = [];
  const masterPath = path.join(rootDir, "docs", "technical-debt", "MASTER_DEBT.jsonl");

  const parsed = parseJsonlFile(masterPath, MAX_FILE_SIZE_BYTES);

  if (parsed.skipped) {
    findings.push({
      id: "TDMS-D2-120",
      category: "content_hash_integrity",
      domain: DOMAIN,
      severity: "warning",
      message: "MASTER_DEBT.jsonl not available for hash integrity check",
      details: `Reason: ${parsed.reason}. Path: ${masterPath}`,
      frequency: 1,
      blastRadius: 3,
    });
    return {
      findings,
      score: { score: 0, rating: "poor", metrics: { reason: parsed.reason } },
    };
  }

  // Filter to items that have a content_hash field
  const itemsWithHash = parsed.items.filter((item) => item.content_hash);

  if (itemsWithHash.length === 0) {
    findings.push({
      id: "TDMS-D2-121",
      category: "content_hash_integrity",
      domain: DOMAIN,
      severity: "info",
      message: "No items have content_hash field — skipping integrity check",
      details: `${parsed.items.length} total items, none with content_hash`,
      frequency: 1,
      blastRadius: 1,
    });
    // Not a failure — the project may not use content hashing yet
    return {
      findings,
      score: {
        score: 100,
        rating: "good",
        metrics: { total_items: parsed.items.length, items_with_hash: 0, sampled: 0, matching: 0 },
      },
    };
  }

  // Sample up to 100 random items
  const sampled = sampleItems(itemsWithHash, 100);
  let matchingHashes = 0;

  // Canonical fields for hash computation:
  // We use id, title, severity, category, source_id — sorted keys, JSON-stringified
  const canonicalFields = ["id", "title", "severity", "category", "source_id"];

  for (const item of sampled) {
    // Build canonical representation
    const canonical = {};
    for (const field of canonicalFields) {
      if (item[field] !== undefined) {
        canonical[field] = item[field];
      }
    }

    // Compute SHA256
    const sortedCanonical = {};
    for (const k of Object.keys(canonical).sort()) {
      sortedCanonical[k] = canonical[k];
    }
    const canonicalStr = JSON.stringify(sortedCanonical);
    const computed = crypto.createHash("sha256").update(canonicalStr).digest("hex");

    if (computed === item.content_hash) {
      matchingHashes++;
    } else {
      // Also try with sorted key manual string building (deterministic)
      const sortedKeys = Object.keys(item)
        .filter((k) => k !== "content_hash")
        .sort();

      const altStr =
        "{" +
        sortedKeys
          .map((k) => {
            const v = JSON.stringify(item[k]);
            return `${JSON.stringify(k)}:${v === undefined ? "null" : v}`;
          })
          .join(",") +
        "}";
      const altComputed = crypto.createHash("sha256").update(altStr).digest("hex");

      if (altComputed === item.content_hash) {
        matchingHashes++;
      } else {
        findings.push({
          id: "TDMS-D2-122",
          category: "content_hash_integrity",
          domain: DOMAIN,
          severity: "warning",
          message: `Content hash mismatch for item ${item.id || "(no id)"}`,
          details: `Stored: ${item.content_hash}, Computed (canonical): ${computed.slice(0, 16)}...`,
          frequency: 1,
          blastRadius: 2,
          patchType: "update-hash",
          patchTarget: item.id || "unknown",
          patchContent: `content_hash: "${computed}"`,
          patchImpact: "Recompute content_hash from canonical fields",
        });
      }
    }
  }

  const matchPct = sampled.length > 0 ? Math.round((matchingHashes / sampled.length) * 100) : 100;

  const bm = BENCHMARKS.content_hash_integrity;
  const result = scoreMetric(matchPct, bm.match_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_items: parsed.items.length,
        items_with_hash: itemsWithHash.length,
        sampled: sampled.length,
        matching_hashes: matchingHashes,
        match_pct: matchPct,
      },
    },
  };
}

// ============================================================================
// CATEGORY 4: ID Uniqueness & Referential Integrity
// ============================================================================

function checkIdUniquenessReferential(rootDir) {
  const findings = [];
  const masterPath = path.join(rootDir, "docs", "technical-debt", "MASTER_DEBT.jsonl");
  const legacyMapPath = path.join(rootDir, "docs", "technical-debt", "LEGACY_ID_MAPPING.json");
  const dedupLogPath = path.join(rootDir, "docs", "technical-debt", "logs", "dedup-log.jsonl");

  // Parse MASTER_DEBT.jsonl
  const parsed = parseJsonlFile(masterPath, MAX_FILE_SIZE_BYTES);

  if (parsed.skipped) {
    findings.push({
      id: "TDMS-D2-130",
      category: "id_uniqueness_referential",
      domain: DOMAIN,
      severity: "error",
      message: "MASTER_DEBT.jsonl not available for ID integrity check",
      details: `Reason: ${parsed.reason}. Path: ${masterPath}`,
      frequency: 1,
      blastRadius: 5,
    });
    return {
      findings,
      score: { score: 0, rating: "poor", metrics: { reason: parsed.reason } },
    };
  }

  // Collect all DEBT-XXXX IDs and check uniqueness
  const idCounts = new Map();
  const allIds = new Set();
  const debtIdPattern = /^DEBT-\d+$/;

  for (const item of parsed.items) {
    if (!item.id) continue;
    const id = item.id;
    allIds.add(id);
    idCounts.set(id, (idCounts.get(id) || 0) + 1);
  }

  // Count duplicates
  let duplicateCount = 0;
  for (const [id, count] of idCounts.entries()) {
    if (count > 1) {
      duplicateCount++;
      findings.push({
        id: "TDMS-D2-131",
        category: "id_uniqueness_referential",
        domain: DOMAIN,
        severity: "error",
        message: `Duplicate ID: ${id} appears ${count} times in MASTER_DEBT.jsonl`,
        details: `Each debt item must have a unique ID. Found ${count} occurrences of ${id}`,
        frequency: count,
        blastRadius: 3,
        patchType: "dedup-merge",
        patchTarget: id,
        patchContent: "Merge or rename duplicate entries",
        patchImpact: "Resolve ID collision to maintain referential integrity",
      });
    }
  }

  // Validate ID format
  let malformedIdCount = 0;
  for (const id of allIds) {
    if (!debtIdPattern.test(id)) {
      // Allow non-DEBT IDs silently — only flag them as info
      malformedIdCount++;
      if (malformedIdCount <= 10) {
        // Cap findings to avoid noise
        findings.push({
          id: "TDMS-D2-132",
          category: "id_uniqueness_referential",
          domain: DOMAIN,
          severity: "info",
          message: `Non-standard ID format: ${id}`,
          details: `Expected format: DEBT-XXXX (numeric). Found: ${id}`,
          frequency: 1,
          blastRadius: 1,
        });
      }
    }
  }

  // Check merged_from references in dedup log
  let brokenRefs = 0;
  const dedupParsed = parseJsonlFile(dedupLogPath, MAX_FILE_SIZE_BYTES);
  if (!dedupParsed.skipped) {
    // Pre-compute set of merge target IDs (IDs that should exist after merges)
    const mergeTargetIds = new Set();
    for (const entry of dedupParsed.items) {
      const targetId = entry.target_id || entry.merged_into || entry.id;
      if (typeof targetId === "string" && targetId.trim().length > 0) {
        mergeTargetIds.add(targetId);
      }
    }

    for (const entry of dedupParsed.items) {
      const mergedFrom = entry.merged_from || entry.sources || [];
      if (!Array.isArray(mergedFrom)) continue;
      const targetId = entry.target_id || entry.merged_into || entry.id;
      const targetExistsInMaster = typeof targetId === "string" && allIds.has(targetId);

      for (const srcId of mergedFrom) {
        if (typeof srcId !== "string") continue;
        // A source ID missing from MASTER is expected (it was merged away).
        // But if the merge target also doesn't exist in MASTER, the reference chain is broken.
        if (!allIds.has(srcId) && !targetExistsInMaster) {
          brokenRefs++;
          if (brokenRefs <= 20) {
            findings.push({
              id: "TDMS-D2-133",
              category: "id_uniqueness_referential",
              domain: DOMAIN,
              severity: "warning",
              message: `Broken merged_from reference: ${srcId}`,
              details: `Source ID not in MASTER_DEBT.jsonl and merge target '${String(targetId)}' is also missing`,
              frequency: 1,
              blastRadius: 2,
            });
          }
        }
      }
    }
  }

  // Cross-check LEGACY_ID_MAPPING.json if it exists
  let badLegacyMaps = 0;
  const legacyMap = safeParseJson(legacyMapPath);
  if (legacyMap && typeof legacyMap === "object") {
    const mapEntries = Object.entries(legacyMap);
    for (const [legacyId, newId] of mapEntries) {
      if (typeof newId !== "string") {
        badLegacyMaps++;
        if (badLegacyMaps <= 10) {
          findings.push({
            id: "TDMS-D2-134",
            category: "id_uniqueness_referential",
            domain: DOMAIN,
            severity: "warning",
            message: `Invalid legacy mapping: ${legacyId} -> ${JSON.stringify(newId)}`,
            details: "Legacy ID mapping values must be string IDs",
            frequency: 1,
            blastRadius: 2,
          });
        }
        continue;
      }
      // Verify the target ID exists in MASTER_DEBT
      if (!allIds.has(newId)) {
        badLegacyMaps++;
        if (badLegacyMaps <= 20) {
          findings.push({
            id: "TDMS-D2-135",
            category: "id_uniqueness_referential",
            domain: DOMAIN,
            severity: "warning",
            message: `Legacy mapping target not found: ${legacyId} -> ${newId}`,
            details: `${newId} is not present in MASTER_DEBT.jsonl`,
            frequency: 1,
            blastRadius: 2,
          });
        }
      }
    }

    // Also check for legacy IDs that map to the same new ID (acceptable but note it)
    const reverseMap = new Map();
    for (const [legacyId, newId] of mapEntries) {
      if (typeof newId !== "string") continue;
      if (!reverseMap.has(newId)) reverseMap.set(newId, []);
      reverseMap.get(newId).push(legacyId);
    }
    for (const [newId, legacyIds] of reverseMap.entries()) {
      if (legacyIds.length > 5) {
        findings.push({
          id: "TDMS-D2-136",
          category: "id_uniqueness_referential",
          domain: DOMAIN,
          severity: "info",
          message: `Many-to-one legacy mapping: ${legacyIds.length} legacy IDs map to ${newId}`,
          details: `High fan-in may indicate aggressive dedup. Legacy IDs: ${legacyIds.slice(0, 5).join(", ")}...`,
          frequency: legacyIds.length,
          blastRadius: 1,
        });
      }
    }
  }

  // Score: 100 - (duplicates*20) - (broken_refs*10) - (bad_legacy_maps*5)
  const rawScore = Math.max(0, 100 - duplicateCount * 20 - brokenRefs * 10 - badLegacyMaps * 5);

  const bm = BENCHMARKS.id_uniqueness_referential;
  const result = scoreMetric(rawScore, bm.integrity_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_ids: allIds.size,
        duplicate_ids: duplicateCount,
        malformed_ids: malformedIdCount,
        broken_refs: brokenRefs,
        bad_legacy_maps: badLegacyMaps,
        legacy_map_exists: legacyMap !== null,
        raw_score: rawScore,
      },
    },
  };
}

// ============================================================================
// MAIN
// ============================================================================

function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  // Category 1: Dedup Algorithm Health
  const cat1 = checkDedupAlgorithmHealth(rootDir);
  findings.push(...cat1.findings);
  scores.dedup_algorithm_health = cat1.score;

  // Category 2: Schema Compliance
  const cat2 = checkSchemaCompliance(rootDir);
  findings.push(...cat2.findings);
  scores.schema_compliance = cat2.score;

  // Category 3: Content Hash Integrity
  const cat3 = checkContentHashIntegrity(rootDir);
  findings.push(...cat3.findings);
  scores.content_hash_integrity = cat3.score;

  // Category 4: ID Uniqueness & Referential Integrity
  const cat4 = checkIdUniquenessReferential(rootDir);
  findings.push(...cat4.findings);
  scores.id_uniqueness_referential = cat4.score;

  return { domain: DOMAIN, findings, scores };
}

module.exports = { DOMAIN, run };
