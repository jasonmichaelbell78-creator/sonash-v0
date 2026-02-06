#!/usr/bin/env node
/**
 * eval-check-stage.js - Validate a single stage's output for the evaluation wrapper
 *
 * Usage:
 *   node scripts/multi-ai/eval-check-stage.js <session-path> <stage> [options]
 *
 * Stages: E1 (init), E2 (template), E3 (normalize), E4 (schema),
 *         E5 (aggregate), E6 (unify), E7 (intake), E8 (roadmap)
 *
 * Writes result to: <session-path>/eval/stage-results.jsonl (appends)
 *
 * Each stage check:
 *   - Validates expected outputs exist
 *   - Checks data quality (valid JSON, required fields, counts)
 *   - Computes a quality score (0-100)
 *   - Records issues found
 *   - Generates improvement recommendations
 */

/* global __dirname */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const MASTER_FILE = path.join(ROOT, "docs/technical-debt/MASTER_DEBT.jsonl");
const TEMPLATE_DIR = path.join(ROOT, "docs/multi-ai-audit/templates");

/**
 * Validate that a user-provided path is contained within the project root.
 * Prevents path traversal attacks (CWE-22, OWASP A01:2021 Broken Access Control).
 * @param {string} sessionPath - User-provided session path from CLI args
 * @returns {string} - Resolved absolute path (safe to use)
 */
function validateSessionPath(sessionPath) {
  const projectRoot = ROOT;
  const resolved = path.resolve(sessionPath);
  const relative = path.relative(projectRoot, resolved);
  // Reject if: relative path escapes root (..), is empty (equals root), or is absolute (different drive on Windows)
  if (relative === "" || /^\.\.(?:[\\/]|$)/.test(relative) || path.isAbsolute(relative)) {
    console.error(`Error: session path "${sessionPath}" resolves outside the project root.`);
    console.error(`  Resolved: ${resolved}`);
    console.error(`  Project root: ${projectRoot}`);
    process.exit(1);
  }
  return resolved;
}

// Category → template file mapping
const TEMPLATE_MAP = {
  code: "CODE_REVIEW_PLAN.md",
  security: "SECURITY_AUDIT_PLAN.md",
  performance: "PERFORMANCE_AUDIT_PLAN.md",
  refactoring: "REFACTOR_PLAN.md",
  documentation: "DOCUMENTATION_AUDIT.md",
  process: "PROCESS_AUDIT.md",
  "engineering-productivity": "ENGINEERING_PRODUCTIVITY_AUDIT.md",
};

function loadJsonlFile(filePath) {
  if (!fs.existsSync(filePath)) return { items: [], errors: 0 };
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    // Expected for missing/inaccessible files
    const msg = err instanceof Error ? err.message : String(err);
    if (process.env.VERBOSE) console.warn(`  Skipped ${filePath}: ${msg}`);
    return { items: [], errors: 1 };
  }
  const lines = content.split("\n").filter((l) => l.trim());
  const items = [];
  let errors = 0;
  for (const line of lines) {
    try {
      items.push(JSON.parse(line));
    } catch (err) {
      // Skip malformed JSONL lines - log for debugging
      if (process.env.VERBOSE)
        console.warn(`Warning: ${err instanceof Error ? err.message : String(err)}`);
      errors++;
    }
  }
  return { items, errors };
}

function appendResult(sessionPath, result) {
  const evalDir = path.join(sessionPath, "eval");
  if (!fs.existsSync(evalDir)) {
    fs.mkdirSync(evalDir, { recursive: true });
  }
  const resultsFile = path.join(evalDir, "stage-results.jsonl");
  fs.appendFileSync(resultsFile, JSON.stringify(result) + "\n");
}

// ────────────────────────────────────────────
// E1: Session Initialization
// ────────────────────────────────────────────
function checkE1(sessionPath) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  // Check session directory structure
  const requiredDirs = ["raw", "canon", "final"];
  for (const dir of requiredDirs) {
    if (!fs.existsSync(path.join(sessionPath, dir))) {
      issues.push(`Missing directory: ${dir}/`);
      score -= 25;
    }
  }

  // Check state files
  const primaryState = path.join(ROOT, ".claude/multi-ai-audit/session-state.json");
  const backupState = path.join(sessionPath, "state.json");

  if (!fs.existsSync(primaryState) && !fs.existsSync(backupState)) {
    issues.push("No state file found (primary or backup)");
    score -= 30;
    recommendations.push("State file missing — session cannot survive context compaction");
  }

  // Validate state file schema if it exists
  const stateFile = fs.existsSync(primaryState) ? primaryState : backupState;
  if (stateFile && fs.existsSync(stateFile)) {
    try {
      const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
      const requiredFields = ["session_id", "created", "status", "categories"];
      for (const field of requiredFields) {
        if (!(field in state)) {
          issues.push(`State file missing required field: ${field}`);
          score -= 10;
        }
      }
    } catch (e) {
      issues.push(`State file is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
      score -= 30;
    }
  }

  return {
    stage: "E1",
    name: "Session Initialization",
    passed: score >= 70,
    score: Math.max(0, score),
    issues,
    recommendations,
    metadata: {
      dirs_found: requiredDirs.filter((d) => fs.existsSync(path.join(sessionPath, d))),
      state_file: stateFile && fs.existsSync(stateFile) ? stateFile : null,
    },
  };
}

// ────────────────────────────────────────────
// E2: Template Output
// ────────────────────────────────────────────
function checkE2() {
  const issues = [];
  const recommendations = [];
  let score = 100;
  const templateResults = {};

  const categories = Object.keys(TEMPLATE_MAP);
  for (const category of categories) {
    const templateFile = path.join(TEMPLATE_DIR, TEMPLATE_MAP[category]);
    if (!fs.existsSync(templateFile)) {
      issues.push(`Missing template: ${TEMPLATE_MAP[category]}`);
      score -= Math.floor(100 / categories.length);
      templateResults[category] = { exists: false, promptLength: 0 };
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(templateFile, "utf8");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (process.env.VERBOSE) console.warn(`  Skipped template ${TEMPLATE_MAP[category]}: ${msg}`);
      issues.push(`Cannot read template: ${TEMPLATE_MAP[category]}`);
      score -= Math.floor(100 / categories.length);
      templateResults[category] = { exists: true, readable: false, promptLength: 0 };
      continue;
    }

    // Check for extractable prompt section
    // Templates use varied headers: "## 📝 Review Prompt (...)", "## Security Audit Prompt (...)",
    // "## Main Prompt", "## Engineering Productivity Audit Prompt", etc.
    const promptMatch = content.match(/## .*Prompt[\s\S]*?(?=\r?\n## |\r?\n---|$)/);
    const promptLength = promptMatch ? promptMatch[0].length : 0;

    if (promptLength < 100) {
      issues.push(`Template ${category}: prompt section too short (${promptLength} chars)`);
      score -= 5;
      recommendations.push(
        `Template ${TEMPLATE_MAP[category]} has a weak prompt section — consider expanding`
      );
    }

    templateResults[category] = { exists: true, readable: true, promptLength };
  }

  return {
    stage: "E2",
    name: "Template Output",
    passed: score >= 70,
    score: Math.max(0, score),
    issues,
    recommendations,
    metadata: { templates: templateResults },
  };
}

// ────────────────────────────────────────────
// E3: Format Normalization
// ────────────────────────────────────────────
function checkE3(sessionPath) {
  const issues = [];
  const recommendations = [];
  let score = 100;
  const rawDir = path.join(sessionPath, "raw");

  if (!fs.existsSync(rawDir)) {
    return {
      stage: "E3",
      name: "Format Normalization",
      passed: false,
      score: 0,
      issues: ["raw/ directory does not exist — no findings processed"],
      recommendations: ["Run the audit collection phase before checking E3"],
      metadata: {},
    };
  }

  let rawFiles;
  try {
    rawFiles = fs
      .readdirSync(rawDir)
      .filter((f) => f.endsWith(".jsonl") && !f.includes(".original"));
  } catch (err) {
    // Expected if directory is inaccessible
    const msg = err instanceof Error ? err.message : String(err);
    if (process.env.VERBOSE) console.warn(`  Skipped reading rawDir: ${msg}`);
    rawFiles = [];
  }
  const originalFiles = (() => {
    try {
      return fs.readdirSync(rawDir).filter((f) => f.endsWith(".original.txt"));
    } catch (err) {
      // Expected if directory is inaccessible
      if (process.env.VERBOSE)
        console.warn(
          `  Skipped reading rawDir originals: ${err instanceof Error ? err.message : String(err)}`
        );
      return [];
    }
  })();

  if (rawFiles.length === 0) {
    issues.push("No normalized JSONL files in raw/");
    score = 0;
  }

  let totalFindings = 0;
  let totalErrors = 0;
  let totalMissingFields = 0;
  const perFile = {};

  for (const file of rawFiles) {
    const { items, errors } = loadJsonlFile(path.join(rawDir, file));
    totalFindings += items.length;
    totalErrors += errors;

    // Check field completeness
    let missingFields = 0;
    for (const item of items) {
      if (!item.title) missingFields++;
      if (!item.severity) missingFields++;
      if (!item.category) missingFields++;
    }
    totalMissingFields += missingFields;

    perFile[file] = {
      findings: items.length,
      json_errors: errors,
      missing_required_fields: missingFields,
    };

    if (errors > 0) {
      issues.push(`${file}: ${errors} JSON parse errors`);
      score -= errors * 5;
    }

    // Check if original was preserved
    const baseName = file.replace(".jsonl", "");
    const hasOriginal = originalFiles.some((f) => f.startsWith(baseName));
    if (!hasOriginal) {
      issues.push(`${file}: no .original.txt backup found`);
      score -= 3;
      recommendations.push(`Original input for ${file} not preserved — debugging will be harder`);
    }
  }

  // Calculate extraction rate
  const extractionQuality =
    totalFindings > 0 ? Math.round(((totalFindings - totalErrors) / totalFindings) * 100) : 0;
  if (extractionQuality < 80) {
    recommendations.push(
      `Extraction quality at ${extractionQuality}% — normalize-format.js may need format-specific improvements`
    );
  }

  if (totalMissingFields > 0) {
    recommendations.push(
      `${totalMissingFields} required fields missing after normalization — fix-schema.js should fill these`
    );
  }

  return {
    stage: "E3",
    name: "Format Normalization",
    passed: score >= 70 && totalFindings > 0,
    score: Math.max(0, Math.min(100, score)),
    issues,
    recommendations,
    metadata: {
      raw_files: rawFiles.length,
      original_files: originalFiles.length,
      total_findings: totalFindings,
      total_errors: totalErrors,
      total_missing_fields: totalMissingFields,
      extraction_quality_pct: extractionQuality,
      per_file: perFile,
    },
  };
}

// ────────────────────────────────────────────
// E4: Schema Fixing
// ────────────────────────────────────────────
function checkE4(sessionPath) {
  const issues = [];
  const recommendations = [];
  let score = 100;
  const rawDir = path.join(sessionPath, "raw");

  if (!fs.existsSync(rawDir)) {
    return {
      stage: "E4",
      name: "Schema Fixing",
      passed: false,
      score: 0,
      issues: ["raw/ directory does not exist"],
      recommendations: [],
      metadata: {},
    };
  }

  let rawFiles;
  try {
    rawFiles = fs
      .readdirSync(rawDir)
      .filter((f) => f.endsWith(".jsonl") && !f.includes(".original"));
  } catch (err) {
    // Expected if directory is inaccessible
    const msg = err instanceof Error ? err.message : String(err);
    if (process.env.VERBOSE) console.warn(`  Skipped reading rawDir: ${msg}`);
    rawFiles = [];
  }

  const REQUIRED_FIELDS = ["title", "severity", "category"];
  const VALID_SEVERITIES = ["S0", "S1", "S2", "S3"];
  const VALID_CATEGORIES = [
    "security",
    "performance",
    "code-quality",
    "documentation",
    "process",
    "refactoring",
  ];
  let totalItems = 0;
  let completeItems = 0;
  let validSeverity = 0;
  let validCategory = 0;
  let lowConfidence = 0;

  for (const file of rawFiles) {
    const { items } = loadJsonlFile(path.join(rawDir, file));
    for (const item of items) {
      totalItems++;
      const hasAllRequired = REQUIRED_FIELDS.every((f) => item[f]);
      if (hasAllRequired) completeItems++;
      if (VALID_SEVERITIES.includes(item.severity)) validSeverity++;
      if (VALID_CATEGORIES.includes(item.category)) validCategory++;
      if (item.confidence !== undefined && item.confidence < 50) lowConfidence++;
    }
  }

  if (totalItems === 0) {
    return {
      stage: "E4",
      name: "Schema Fixing",
      passed: false,
      score: 0,
      issues: ["No items found in raw files"],
      recommendations: [],
      metadata: {},
    };
  }

  const completenessRate = Math.round((completeItems / totalItems) * 100);
  const severityRate = Math.round((validSeverity / totalItems) * 100);
  const categoryRate = Math.round((validCategory / totalItems) * 100);

  if (completenessRate < 100) {
    const missing = totalItems - completeItems;
    issues.push(`${missing}/${totalItems} items missing required fields after schema fix`);
    score -= 100 - completenessRate;
    recommendations.push(
      "fix-schema.js should ensure 100% field completeness — check default assignment logic"
    );
  }

  if (severityRate < 100) {
    issues.push(`${totalItems - validSeverity} items have invalid severity values`);
    score -= Math.round((100 - severityRate) / 2);
  }

  if (categoryRate < 100) {
    issues.push(`${totalItems - validCategory} items have invalid/unmapped category values`);
    score -= Math.round((100 - categoryRate) / 2);
    recommendations.push(
      "Category mapping in fix-schema.js may need new aliases for unmapped categories"
    );
  }

  if (lowConfidence > totalItems * 0.3) {
    issues.push(
      `${lowConfidence}/${totalItems} items (${Math.round((lowConfidence / totalItems) * 100)}%) have low confidence (<50)`
    );
    recommendations.push(
      "High rate of low-confidence items — input format may need better parsing rules"
    );
  }

  return {
    stage: "E4",
    name: "Schema Fixing",
    passed: score >= 70,
    score: Math.max(0, Math.min(100, score)),
    issues,
    recommendations,
    metadata: {
      total_items: totalItems,
      complete_items: completeItems,
      completeness_pct: completenessRate,
      valid_severity_pct: severityRate,
      valid_category_pct: categoryRate,
      low_confidence_count: lowConfidence,
    },
  };
}

// ────────────────────────────────────────────
// E5: Category Aggregation
// ────────────────────────────────────────────
function checkE5(sessionPath) {
  const issues = [];
  const recommendations = [];
  let score = 100;
  const canonDir = path.join(sessionPath, "canon");
  const rawDir = path.join(sessionPath, "raw");

  if (!fs.existsSync(canonDir)) {
    return {
      stage: "E5",
      name: "Category Aggregation",
      passed: false,
      score: 0,
      issues: ["canon/ directory does not exist"],
      recommendations: [],
      metadata: {},
    };
  }

  let canonFiles;
  try {
    canonFiles = fs
      .readdirSync(canonDir)
      .filter((f) => f.startsWith("CANON-") && f.endsWith(".jsonl"));
  } catch (err) {
    // Expected if directory is inaccessible
    const msg = err instanceof Error ? err.message : String(err);
    if (process.env.VERBOSE) console.warn(`  Skipped reading canonDir: ${msg}`);
    canonFiles = [];
  }

  if (canonFiles.length === 0) {
    return {
      stage: "E5",
      name: "Category Aggregation",
      passed: false,
      score: 0,
      issues: ["No CANON files found in canon/"],
      recommendations: [],
      metadata: {},
    };
  }

  // Count raw findings per category for dedup ratio
  let totalRaw = 0;
  let totalCanon = 0;
  const perCategory = {};

  for (const canonFile of canonFiles) {
    const category = canonFile.replace("CANON-", "").replace(".jsonl", "").toLowerCase();
    const { items: canonItems, errors: canonErrors } = loadJsonlFile(
      path.join(canonDir, canonFile)
    );
    totalCanon += canonItems.length;

    if (canonErrors > 0) {
      issues.push(`${canonFile}: ${canonErrors} JSON parse errors`);
      score -= canonErrors * 5;
    }

    // Count raw sources for this category
    let rawCount = 0;
    let sourceCount = 0;
    if (fs.existsSync(rawDir)) {
      let rawFiles;
      try {
        rawFiles = fs
          .readdirSync(rawDir)
          .filter(
            (f) => f.startsWith(category + "-") && f.endsWith(".jsonl") && !f.includes(".original")
          );
      } catch (err) {
        // Expected if directory is inaccessible
        if (process.env.VERBOSE)
          console.warn(
            `  Skipped reading rawDir for ${category}: ${err instanceof Error ? err.message : String(err)}`
          );
        rawFiles = [];
      }
      sourceCount = rawFiles.length;
      for (const rf of rawFiles) {
        const { items } = loadJsonlFile(path.join(rawDir, rf));
        rawCount += items.length;
      }
    }
    totalRaw += rawCount;

    // Check CANON ID format
    let validCanonIds = 0;
    let verifiedCount = 0;
    for (const item of canonItems) {
      const canonId = item.canonical_id ?? item.canon_id;
      if (canonId && /^CANON-\d{4}$/.test(canonId)) validCanonIds++;
      if (item.verified_at || item.file_exists !== undefined) verifiedCount++;
    }

    const dedupRatio =
      rawCount > 0 ? Math.round(((rawCount - canonItems.length) / rawCount) * 100) : 0;

    perCategory[category] = {
      sources: sourceCount,
      raw_count: rawCount,
      canon_count: canonItems.length,
      dedup_ratio_pct: dedupRatio,
      valid_canon_ids: validCanonIds,
      verified: verifiedCount,
    };

    if (sourceCount === 1) {
      issues.push(`${category}: only 1 source — consensus scoring has no value`);
      score -= 5;
      recommendations.push(
        `Category '${category}' had only 1 AI source — multi-AI consensus needs 2+ sources to be meaningful`
      );
    }

    if (validCanonIds < canonItems.length) {
      issues.push(`${category}: ${canonItems.length - validCanonIds} items missing valid CANON ID`);
      score -= 5;
    }
  }

  const overallDedupRatio =
    totalRaw > 0 ? Math.round(((totalRaw - totalCanon) / totalRaw) * 100) : 0;

  if (overallDedupRatio === 0 && totalRaw > 0) {
    issues.push(
      "Zero deduplication occurred — either no overlapping findings or dedup logic not triggered"
    );
    recommendations.push(
      "If multiple AIs audited the same code, 0% dedup suggests format normalization may be losing identifying info (file paths, line numbers)"
    );
  }

  return {
    stage: "E5",
    name: "Category Aggregation",
    passed: score >= 70,
    score: Math.max(0, Math.min(100, score)),
    issues,
    recommendations,
    metadata: {
      canon_files: canonFiles.length,
      total_raw: totalRaw,
      total_canon: totalCanon,
      overall_dedup_ratio_pct: overallDedupRatio,
      per_category: perCategory,
    },
  };
}

// ────────────────────────────────────────────
// E6: Cross-Category Unification
// ────────────────────────────────────────────
function checkE6(sessionPath) {
  const issues = [];
  const recommendations = [];
  let score = 100;
  const finalDir = path.join(sessionPath, "final");

  if (!fs.existsSync(finalDir)) {
    return {
      stage: "E6",
      name: "Cross-Category Unification",
      passed: false,
      score: 0,
      issues: ["final/ directory does not exist"],
      recommendations: [],
      metadata: {},
    };
  }

  const unifiedFile = path.join(finalDir, "UNIFIED-FINDINGS.jsonl");
  const summaryFile = path.join(finalDir, "SUMMARY.md");

  if (!fs.existsSync(unifiedFile)) {
    issues.push("UNIFIED-FINDINGS.jsonl not found");
    score -= 50;
  }

  if (!fs.existsSync(summaryFile)) {
    issues.push("SUMMARY.md not found");
    score -= 10;
    recommendations.push("SUMMARY.md generation may have failed — check unify-findings.js");
  }

  // Validate unified findings
  const { items, errors } = loadJsonlFile(unifiedFile);

  if (errors > 0) {
    issues.push(`UNIFIED-FINDINGS.jsonl: ${errors} JSON parse errors`);
    score -= errors * 5;
  }

  if (items.length === 0 && fs.existsSync(unifiedFile)) {
    issues.push("UNIFIED-FINDINGS.jsonl exists but is empty");
    score -= 30;
  }

  // Check for priority scores and cross-cutting detection
  let hasPriority = 0;
  let hasCrossCutting = 0;
  const severityCounts = { S0: 0, S1: 0, S2: 0, S3: 0 };
  const fileCounts = {};

  for (const item of items) {
    if (item.priority_score !== undefined) hasPriority++;
    if (item.cross_cutting) hasCrossCutting++;
    if (item.severity && severityCounts[item.severity] !== undefined) {
      severityCounts[item.severity]++;
    }
    if (item.file) {
      fileCounts[item.file] = (fileCounts[item.file] || 0) + 1;
    }
  }

  // Files appearing in 2+ findings (cross-cutting potential)
  const crossCuttingFiles = Object.entries(fileCounts).filter(([, count]) => count >= 2);

  if (items.length > 0 && hasPriority === 0) {
    issues.push("No items have priority_score — priority scoring may not be implemented");
    score -= 10;
    recommendations.push(
      "unify-findings.js should assign priority_score based on severity + consensus + cross-cutting"
    );
  }

  return {
    stage: "E6",
    name: "Cross-Category Unification",
    passed: score >= 70 && items.length > 0,
    score: Math.max(0, Math.min(100, score)),
    issues,
    recommendations,
    metadata: {
      unified_count: items.length,
      json_errors: errors,
      has_priority_score: hasPriority,
      has_cross_cutting_flag: hasCrossCutting,
      cross_cutting_files: crossCuttingFiles.length,
      severity_counts: severityCounts,
      summary_exists: fs.existsSync(summaryFile),
    },
  };
}

// ────────────────────────────────────────────
// E7: TDMS Intake
// ────────────────────────────────────────────
function checkE7(sessionPath) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  // Load pre-snapshot for comparison
  const preSnapshotFile = path.join(sessionPath, "eval/pre-snapshot.json");
  if (!fs.existsSync(preSnapshotFile)) {
    issues.push("pre-snapshot.json not found — cannot compare pre/post state");
    score -= 20;
  }

  let preSnapshot = null;
  if (fs.existsSync(preSnapshotFile)) {
    try {
      preSnapshot = JSON.parse(fs.readFileSync(preSnapshotFile, "utf8"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (process.env.VERBOSE) console.warn(`  Skipped pre-snapshot: ${msg}`);
      issues.push("pre-snapshot.json is not valid JSON");
      score -= 20;
    }
  }

  // Check current MASTER_DEBT state
  if (!fs.existsSync(MASTER_FILE)) {
    return {
      stage: "E7",
      name: "TDMS Intake",
      passed: false,
      score: 0,
      issues: ["MASTER_DEBT.jsonl does not exist"],
      recommendations: ["intake-audit.js should create the file if missing"],
      metadata: {},
    };
  }

  const { items: currentItems } = loadJsonlFile(MASTER_FILE);
  const preCount =
    typeof preSnapshot?.master_debt?.item_count === "number"
      ? preSnapshot.master_debt.item_count
      : 0;
  const newItems = Math.max(0, currentItems.length - preCount);

  // Load unified findings to compare expected vs actual intake
  const unifiedFile = path.join(sessionPath, "final/UNIFIED-FINDINGS.jsonl");
  const { items: unifiedItems } = loadJsonlFile(unifiedFile);

  if (newItems === 0 && unifiedItems.length > 0) {
    issues.push(
      `${unifiedItems.length} unified findings but 0 new MASTER_DEBT items — intake may have failed or all were duplicates`
    );
    score -= 30;
    recommendations.push(
      "If all were duplicates, the audit may be re-running on previously-ingested findings. Check content hashes."
    );
  }

  // Check for duplicate content hashes
  const hashes = new Map();
  let duplicateHashes = 0;
  for (const item of currentItems) {
    if (item.content_hash) {
      if (hashes.has(item.content_hash)) {
        duplicateHashes++;
      }
      hashes.set(item.content_hash, item.id);
    }
  }

  if (duplicateHashes > 0) {
    issues.push(`${duplicateHashes} duplicate content_hash values in MASTER_DEBT.jsonl`);
    score -= duplicateHashes * 10;
    recommendations.push(
      "Duplicate hashes indicate intake-audit.js dedup check failed — investigate hash collision or race condition"
    );
  }

  // Check intake log for this session
  const intakeLogFile = path.join(ROOT, "docs/technical-debt/logs/intake-log.jsonl");
  let intakeLogEntry = null;
  if (fs.existsSync(intakeLogFile)) {
    try {
      const logContent = fs.readFileSync(intakeLogFile, "utf8");
      const logLines = logContent.split("\n").filter((l) => l.trim());
      // Find the most recent intake entry
      for (let i = logLines.length - 1; i >= 0; i--) {
        try {
          const entry = JSON.parse(logLines[i]);
          if (
            entry.action === "intake-audit" &&
            entry.input_file &&
            entry.input_file.includes(path.basename(sessionPath))
          ) {
            intakeLogEntry = entry;
            break;
          }
        } catch (err) {
          // Skip invalid log lines - log for debugging
          if (process.env.VERBOSE)
            console.warn(`Warning: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      // Log file read failed
      if (process.env.VERBOSE)
        console.warn(`  Skipped intake log: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (!intakeLogEntry) {
    issues.push("No intake-log entry found for this session");
    score -= 10;
  }

  // Check views were regenerated
  const viewsDir = path.join(ROOT, "docs/technical-debt/views");
  let viewsUpdated = false;
  if (preSnapshot && fs.existsSync(viewsDir)) {
    try {
      const viewFiles = fs.readdirSync(viewsDir).filter((f) => f.endsWith(".md"));
      for (const vf of viewFiles) {
        const currentMtime = fs.statSync(path.join(viewsDir, vf)).mtime.toISOString();
        const preMtime = preSnapshot.views[vf] ? preSnapshot.views[vf].mtime : null;
        if (preMtime && currentMtime > preMtime) {
          viewsUpdated = true;
          break;
        }
      }
    } catch (err) {
      // Views check failed
      if (process.env.VERBOSE)
        console.warn(`  Skipped views check: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (newItems > 0 && !viewsUpdated && preSnapshot) {
    issues.push("Items were added but views were not regenerated");
    score -= 10;
    recommendations.push(
      "generate-views.js should run automatically after intake — check intake-audit.js integration"
    );
  }

  // Check for items that fell through without proper data
  let itemsWithoutFile = 0;
  let itemsWithoutDescription = 0;
  const newDebtItems = preSnapshot ? currentItems.slice(preSnapshot.master_debt.item_count) : [];
  for (const item of newDebtItems) {
    if (!item.file || item.file === "") itemsWithoutFile++;
    if (!item.description || item.description === "") itemsWithoutDescription++;
  }

  if (itemsWithoutFile > 0) {
    issues.push(`${itemsWithoutFile} new items have no file path — harder to act on`);
    recommendations.push(
      "Items without file paths likely came from prose-format findings — improve normalize-format.js file extraction"
    );
  }

  if (itemsWithoutDescription > 0) {
    issues.push(`${itemsWithoutDescription} new items have no description`);
    recommendations.push(
      "Items without descriptions reduce actionability — fix-schema.js should populate from title if empty"
    );
  }

  return {
    stage: "E7",
    name: "TDMS Intake",
    passed: score >= 70,
    score: Math.max(0, Math.min(100, score)),
    issues,
    recommendations,
    metadata: {
      pre_count: preCount,
      post_count: currentItems.length,
      new_items: newItems,
      expected_from_unified: unifiedItems.length,
      duplicate_hashes: duplicateHashes,
      intake_log_found: !!intakeLogEntry,
      views_updated: viewsUpdated,
      items_without_file: itemsWithoutFile,
      items_without_description: itemsWithoutDescription,
    },
  };
}

// ────────────────────────────────────────────
// E8: Roadmap Integration
// ────────────────────────────────────────────
function checkE8(sessionPath) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  const preSnapshotFile = path.join(sessionPath, "eval/pre-snapshot.json");
  let preSnapshot = null;
  if (fs.existsSync(preSnapshotFile)) {
    try {
      preSnapshot = JSON.parse(fs.readFileSync(preSnapshotFile, "utf8"));
    } catch (err) {
      // Expected for missing/malformed snapshot files
      if (process.env.VERBOSE)
        console.warn(`  Skipped pre-snapshot: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Check that new items have roadmap_ref assigned
  const { items: allItems } = loadJsonlFile(MASTER_FILE);
  const preCount = preSnapshot ? preSnapshot.master_debt.item_count : 0;
  const newItems = allItems.slice(preCount);

  let withRoadmapRef = 0;
  let defaultFallbackCount = 0;
  const trackDistribution = {};

  for (const item of newItems) {
    if (item.roadmap_ref) {
      withRoadmapRef++;
      trackDistribution[item.roadmap_ref] = (trackDistribution[item.roadmap_ref] || 0) + 1;
      // Detect default fallback
      if (item.roadmap_ref === "M2.1" && item.category !== "code-quality") {
        defaultFallbackCount++;
      }
    }
  }

  const assignmentRate =
    newItems.length > 0 ? Math.round((withRoadmapRef / newItems.length) * 100) : 100;

  if (assignmentRate < 100) {
    const unassigned = newItems.length - withRoadmapRef;
    issues.push(`${unassigned}/${newItems.length} new items have no roadmap_ref`);
    score -= 100 - assignmentRate;
    recommendations.push(
      "assign-roadmap-refs.js should assign 100% of items — check for items it's skipping"
    );
  }

  if (defaultFallbackCount > 0) {
    issues.push(`${defaultFallbackCount} non-code-quality items fell through to M2.1 default`);
    score -= defaultFallbackCount * 3;
    recommendations.push(
      `${defaultFallbackCount} items hit the default M2.1 fallback — add mapping rules for their categories in assign-roadmap-refs.js`
    );
  }

  // Check metrics regenerated
  const metricsFile = path.join(ROOT, "docs/technical-debt/METRICS.md");
  let metricsUpdated = false;
  if (preSnapshot && fs.existsSync(metricsFile)) {
    try {
      const currentMtime = fs.statSync(metricsFile).mtime.toISOString();
      metricsUpdated = preSnapshot.metrics.mtime ? currentMtime > preSnapshot.metrics.mtime : true;
    } catch (err) {
      // Expected if metrics file is inaccessible
      if (process.env.VERBOSE)
        console.warn(
          `  Skipped metrics check: ${err instanceof Error ? err.message : String(err)}`
        );
    }
  }

  if (!metricsUpdated && newItems.length > 0 && preSnapshot) {
    issues.push("Metrics not regenerated after intake");
    score -= 5;
    recommendations.push("Run generate-metrics.js as part of the Phase 7 pipeline");
  }

  // Check roadmap assignment report exists
  const reportFile = path.join(ROOT, "docs/technical-debt/roadmap-assignment-report.md");
  const reportExists = fs.existsSync(reportFile);
  if (!reportExists) {
    issues.push("roadmap-assignment-report.md not generated");
    score -= 5;
  }

  return {
    stage: "E8",
    name: "Roadmap Integration",
    passed: score >= 70,
    score: Math.max(0, Math.min(100, score)),
    issues,
    recommendations,
    metadata: {
      new_items: newItems.length,
      with_roadmap_ref: withRoadmapRef,
      assignment_rate_pct: assignmentRate,
      default_fallback_count: defaultFallbackCount,
      track_distribution: trackDistribution,
      metrics_updated: metricsUpdated,
      report_exists: reportExists,
    },
  };
}

// ────────────────────────────────────────────
// Main
// ────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const sessionPath = args[0];
  const stage = args[1];

  if (!sessionPath || !stage) {
    console.error("Usage: node scripts/multi-ai/eval-check-stage.js <session-path> <stage>");
    console.error("Stages: E1, E2, E3, E4, E5, E6, E7, E8, all");
    process.exit(1);
  }

  // Validate session path stays within project root (CWE-22 path traversal prevention)
  const safeSessionPath = validateSessionPath(sessionPath);

  const stageMap = {
    E1: () => checkE1(safeSessionPath),
    E2: () => checkE2(),
    E3: () => checkE3(safeSessionPath),
    E4: () => checkE4(safeSessionPath),
    E5: () => checkE5(safeSessionPath),
    E6: () => checkE6(safeSessionPath),
    E7: () => checkE7(safeSessionPath),
    E8: () => checkE8(safeSessionPath),
  };

  const stagesToRun = stage === "all" ? Object.keys(stageMap) : [stage.toUpperCase()];

  for (const s of stagesToRun) {
    if (!stageMap[s]) {
      console.error(`Unknown stage: ${s}`);
      process.exit(1);
    }

    const result = stageMap[s]();
    result.checked_at = new Date().toISOString();
    appendResult(safeSessionPath, result);

    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} ${result.stage}: ${result.name} — Score: ${result.score}/100`);
    if (result.issues.length > 0) {
      for (const issue of result.issues) {
        console.log(`   ⚠️  ${issue}`);
      }
    }
    if (result.recommendations.length > 0) {
      console.log(`   💡 ${result.recommendations.length} recommendation(s)`);
    }
  }
}

main();
