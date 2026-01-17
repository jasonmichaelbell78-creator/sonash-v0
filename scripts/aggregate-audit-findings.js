#!/usr/bin/env node
/**
 * Master Issue Aggregation Script
 *
 * Aggregates all audit findings from:
 * - Single-session audits (7 categories)
 * - CANON files (6 categories)
 * - REFACTOR_BACKLOG.md
 * - AUDIT_FINDINGS_BACKLOG.md
 *
 * Produces:
 * - raw-findings.jsonl
 * - normalized-findings.jsonl
 * - dedup-log.jsonl
 * - unique-findings.jsonl
 * - MASTER_ISSUE_LIST.jsonl
 * - MASTER_ISSUE_LIST.md
 * - IMPLEMENTATION_PLAN.md
 */

import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ES module equivalent of __dirname (ESLint config expects this pattern)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve paths relative to repo root (Qodo Review #175)
const REPO_ROOT = resolve(__dirname, "..");

// Configuration - all paths relative to REPO_ROOT for cwd independence
const CONFIG = {
  outputDir: join(REPO_ROOT, "docs/aggregation"),
  singleSessionDir: join(REPO_ROOT, "docs/audits/single-session"),
  canonDir: join(REPO_ROOT, "docs/reviews/2026-Q1/canonical"),
  refactorBacklog: join(
    REPO_ROOT,
    "docs/reviews/2026-Q1/canonical/tier2-output/REFACTOR_BACKLOG.md"
  ),
  auditBacklog: join(REPO_ROOT, "docs/AUDIT_FINDINGS_BACKLOG.md"),
};

// Severity and effort weights for priority calculation
const SEVERITY_WEIGHTS = { S0: 4, S1: 3, S2: 2, S3: 1 };
const EFFORT_WEIGHTS = { E0: 4, E1: 3, E2: 2, E3: 1 };
const ROI_WEIGHTS = { HIGH: 3, CRITICAL: 4, MEDIUM: 2, LOW: 1 };

// Category mapping
const CATEGORY_MAP = {
  code: "code",
  security: "security",
  performance: "performance",
  process: "process",
  refactoring: "refactoring",
  documentation: "documentation",
  "engineering-productivity": "dx",
  offline: "offline",
  Testing: "code",
  Hygiene: "code",
  Framework: "code",
  Debugging: "code",
  Types: "code",
  Headers: "security",
  Firebase: "security",
  Crypto: "security",
  Auth: "security",
  Input: "security",
  Deps: "security",
  Data: "security",
  AgentSecurity: "security",
  SECURITY: "security",
  Bundle: "performance",
  Rendering: "performance",
  Memory: "performance",
  DataFetch: "performance",
  WebVitals: "performance",
  "Memory Management": "performance",
  "Rendering Performance": "performance",
  "Bundle Size & Loading": "performance",
  "Core Web Vitals": "performance",
  "Data Fetching & Caching": "performance",
  "Observability & Monitoring": "performance",
  CI: "process",
  GitHooks: "process",
  ClaudeHooks: "process",
  Scripts: "process",
  Triggers: "process",
  ProcessDocs: "process",
  "CI/CD": "process",
  "Workflow Docs": "process",
  Hooks: "process",
  "Pattern Checker": "process",
  GodObject: "refactoring",
  Duplication: "refactoring",
  Architecture: "refactoring",
  TechDebt: "refactoring",
  REFACTOR: "refactoring",
  "Architecture/Boundaries": "refactoring",
  "Security Hardening": "security",
  "Hygiene/Duplication": "refactoring",
  "Types/Correctness": "code",
  "Next/React Boundaries": "refactoring",
  Links: "documentation",
  Sync: "documentation",
  Frontmatter: "documentation",
  Stale: "documentation",
  Quality: "documentation",
  Coverage: "documentation",
  "Cross-Reference": "documentation",
  "Coverage Gaps": "documentation",
  "Tier Compliance": "documentation",
  Staleness: "documentation",
  GoldenPath: "dx",
  Offline: "offline",
};

// PR bucket suggestions based on category
const PR_BUCKET_MAP = {
  security: "security-hardening",
  performance: "performance-optimization",
  dx: "dx-improvements",
  "engineering-productivity": "dx-improvements", // EFFP-* items (Qodo Review #176)
  offline: "offline-support",
  code: "code-quality",
  refactoring: "code-quality",
  documentation: "documentation-sync",
  process: "process-automation",
};

/**
 * Escape a string for safe inclusion in markdown table cells (Qodo Review #175 - markdown injection)
 * Prevents pipe characters from breaking table structure and newlines from corrupting format
 */
function safeCell(value) {
  if (value === undefined || value === null) return "";
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ").replace(/\r/g, "");
}

/**
 * Parse a JSONL file with robust error handling (Qodo Review #175)
 */
function parseJsonlFile(filePath) {
  if (!existsSync(filePath)) {
    console.warn(`Warning: File not found: ${filePath}`);
    return [];
  }

  let content;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (readError) {
    // Race condition, permission, or encoding error after existsSync
    const errType = readError instanceof Error ? readError.constructor.name : "Error";
    console.warn(`Warning: ${errType} reading file ${filePath}`);
    return [];
  }

  const lines = content.split("\n").filter((line) => line.trim());
  const items = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      // .trim() handles CRLF line endings on Windows (Qodo Review #176)
      items.push(JSON.parse(lines[i].trim()));
    } catch (error_) {
      // S2486: Exception handled by logging and continuing to next line
      // We intentionally skip invalid JSON lines rather than failing the entire parse
      const errType = error_ instanceof SyntaxError ? "SyntaxError" : "Error";
      console.warn(`Warning: ${errType} parsing JSON at line ${i + 1} in ${filePath}`);
    }
  }

  return items;
}

/**
 * Parse markdown backlog to extract items with robust error handling (Qodo Review #175)
 */
function parseMarkdownBacklog(filePath) {
  if (!existsSync(filePath)) {
    console.warn(`Warning: File not found: ${filePath}`);
    return [];
  }

  let content;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (readError) {
    const errType = readError instanceof Error ? readError.constructor.name : "Error";
    console.warn(`Warning: ${errType} reading file ${filePath}`);
    return [];
  }

  const items = [];

  // Extract items from markdown tables
  // Pattern: | ID | Title | Effort | Deps | PR |
  // Note: Using bounded whitespace ` {0,10}` instead of `\s*` to prevent ReDoS (S5852)

  // Track which category we're in
  let currentCategory = "unknown";
  let currentSeverity = "S2";

  const lines = content.split("\n");
  for (const line of lines) {
    // Detect category headers
    if (line.match(/^## Category: (.+)/)) {
      currentCategory = line.match(/^## Category: (.+)/)[1].trim();
    }
    // Detect severity headers
    if (line.match(/^### S(\d) /)) {
      currentSeverity = "S" + line.match(/^### S(\d) /)[1];
    }

    // Match table rows using simpler two-step parsing (S5843 complexity reduction)
    // Step 1: Quick check if line contains a valid ID pattern
    const idMatch = line.match(/(?:DEDUP|CANON|LEGACY)-\d+/);
    if (!idMatch || !line.startsWith("|")) continue;

    // Step 2: Split by | and extract fields - handle pipe chars in title (Qodo Review #176)
    // Use fixed positions from end for effort/deps/pr, join middle parts for title
    const parts = line.split("|").map((p) => p.trim());
    // Expected: ['', 'ID', 'Title...', 'Effort', 'Deps', 'PR', '']
    if (parts.length >= 6) {
      const id = parts[1];
      const effort = parts[parts.length - 4];
      const deps = parts[parts.length - 3];
      const pr = parts[parts.length - 2];
      // Title may contain pipe chars - join middle parts
      const title = parts
        .slice(2, parts.length - 4)
        .join(" | ")
        .trim();

      if (/^E\d$/.test(effort)) {
        items.push({
          id,
          title,
          effort,
          deps,
          pr,
          category: currentCategory,
          severity: currentSeverity,
          source: "backlog",
        });
      }
    }
  }

  return items;
}

/**
 * Parse AUDIT_FINDINGS_BACKLOG.md for individual items
 * Uses section-based parsing to avoid missing items with long content (Qodo Review #173, #175)
 */
function parseAuditFindingsBacklog(filePath) {
  if (!existsSync(filePath)) {
    console.warn(`Warning: File not found: ${filePath}`);
    return [];
  }

  let content;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (readError) {
    const errType = readError instanceof Error ? readError.constructor.name : "Error";
    console.warn(`Warning: ${errType} reading file ${filePath}`);
    return [];
  }

  const items = [];

  // Section-based parsing: split by ### headers first, then parse each section
  // This prevents missing items when content between fields exceeds bounded match limits
  const sections = content.split(/(?=^### \[)/m);

  for (const section of sections) {
    // Match header: ### [Category] Title
    const headerMatch = section.match(/^### \[([^\]]+)\] ([^\n]+)/);
    if (!headerMatch) continue;

    const category = headerMatch[1];
    const title = headerMatch[2].trim();

    // Extract fields from within this section (no length limit needed now)
    const canonIdMatch = section.match(/\*\*CANON-ID\*\*:\s*(CANON-\d+|LEGACY-\d+)/);
    const severityMatch = section.match(/\*\*Severity\*\*:\s*(S\d)/);
    const effortMatch = section.match(/\*\*Effort\*\*:\s*(E\d)/);

    // Only add if we have the required fields
    if (canonIdMatch && severityMatch && effortMatch) {
      items.push({
        id: canonIdMatch[1],
        title: title,
        category: category,
        severity: severityMatch[1],
        effort: effortMatch[1],
        source: "audit-backlog",
      });
    }
  }

  return items;
}

/**
 * Normalize confidence to string format (Qodo Review #173)
 */
function normalizeConfidence(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") return value >= 0.9 ? "high" : value >= 0.7 ? "medium" : "low";
  return String(value).toLowerCase();
}

/**
 * Normalize a single-session audit finding to master schema
 * ID prefix takes precedence for category (SEC-* → security, PERF-* → performance, etc.)
 * Fixes category mismatch like SEC-010 with category "Framework" → should be "security" (Qodo Review #175)
 */
function normalizeSingleSession(item, sourceCategory, date) {
  // ID prefix mapping takes precedence over item.category (e.g., SEC-010 with "Framework" category → security)
  // EFFP-* maps to "engineering-productivity" not "dx" for consistency with source (Qodo Review #176)
  const idPrefixCategory = item.id?.startsWith("SEC-")
    ? "security"
    : item.id?.startsWith("PERF-")
      ? "performance"
      : item.id?.startsWith("CODE-")
        ? "code"
        : item.id?.startsWith("PROC-")
          ? "process"
          : item.id?.startsWith("REF-")
            ? "refactoring"
            : item.id?.startsWith("DOC-")
              ? "documentation"
              : item.id?.startsWith("EFFP-")
                ? "engineering-productivity"
                : null;
  const normalizedCategory =
    idPrefixCategory || CATEGORY_MAP[item.category] || CATEGORY_MAP[sourceCategory] || "code";

  return {
    original_id: item.id,
    title: item.title,
    category: normalizedCategory,
    severity: item.severity,
    effort: item.effort,
    confidence: normalizeConfidence(item.confidence),
    verified: item.verified,
    file: item.file,
    line: item.line,
    description: item.description,
    recommendation: item.recommendation,
    evidence: item.evidence,
    cross_ref: item.cross_ref,
    owasp: item.owasp,
    // Omit empty optional fields like cwe (Qodo Review #176)
    ...(item.cwe ? { cwe: item.cwe } : {}),
    metrics: item.metrics,
    affected_metric: item.affected_metric,
    estimated_improvement: item.estimated_improvement,
    roi: item.roi,
    sources: [
      {
        type: "single-session",
        id: item.id,
        date: date,
        category: sourceCategory,
      },
    ],
  };
}

/**
 * Normalize a CANON finding to master schema
 */
function normalizeCanon(item, sourceFile) {
  const normalizedCategory = CATEGORY_MAP[item.category] || "code";

  return {
    original_id: item.canonical_id,
    title: item.title,
    category: normalizedCategory,
    severity: item.severity,
    effort: item.effort,
    confidence: normalizeConfidence(item.confidence || item.final_confidence),
    file: item.files ? item.files[0] : undefined,
    files: item.files,
    symbols: item.symbols,
    description: item.why_it_matters || item.description || item.issue_details?.description,
    recommendation:
      item.suggested_fix || item.optimization?.description || item.remediation?.steps?.join("; "),
    evidence: item.evidence,
    pr_bucket_suggestion: item.pr_bucket_suggestion || item.pr_bucket,
    // Filter out self-dependencies to prevent infinite loops (Qodo Review #176)
    dependencies: item.dependencies?.filter((dep) => dep !== item.canonical_id) || [],
    status: item.status,
    consensus_score: item.consensus_score || item.consensus,
    models_agreeing: item.models_agreeing,
    sources: [
      {
        type: "canon",
        id: item.canonical_id,
        file: sourceFile,
      },
    ],
  };
}

/**
 * Normalize a backlog item to master schema
 */
function normalizeBacklog(item) {
  const normalizedCategory = CATEGORY_MAP[item.category] || "code";

  return {
    original_id: item.id,
    title: item.title,
    category: normalizedCategory,
    severity: item.severity,
    effort: item.effort,
    dependencies: item.deps
      ? item.deps
          .split(",")
          .map((d) => d.trim())
          .filter((d) => d && d !== "None")
      : [],
    pr_bucket_suggestion: item.pr,
    sources: [
      {
        type: "backlog",
        id: item.id,
        source: item.source,
      },
    ],
  };
}

// Maximum string length for Levenshtein to prevent O(n²) DoS
const MAX_LEVENSHTEIN_LENGTH = 500;

/**
 * Calculate Levenshtein distance for fuzzy matching
 * Truncates strings > MAX_LEVENSHTEIN_LENGTH to prevent DoS
 */
function levenshteinDistance(str1, str2) {
  // Truncate long strings to prevent O(n²) DoS
  const s1 = str1.length > MAX_LEVENSHTEIN_LENGTH ? str1.slice(0, MAX_LEVENSHTEIN_LENGTH) : str1;
  const s2 = str2.length > MAX_LEVENSHTEIN_LENGTH ? str2.slice(0, MAX_LEVENSHTEIN_LENGTH) : str2;

  const m = s1.length;
  const n = s2.length;
  const dp = new Array(m + 1).fill(null).map(() => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity score between two strings (0-100)
 */
function similarityScore(str1, str2) {
  if (!str1 || !str2) return 0;
  // S7781: Use replaceAll() for regex with global flag
  const normalized1 = str1.toLowerCase().replaceAll(/[^a-z0-9\s]/g, "");
  const normalized2 = str2.toLowerCase().replaceAll(/[^a-z0-9\s]/g, "");

  const maxLen = Math.max(normalized1.length, normalized2.length);
  if (maxLen === 0) return 100;

  const distance = levenshteinDistance(normalized1, normalized2);
  return Math.round((1 - distance / maxLen) * 100);
}

/**
 * Check for explicit DEDUP->CANON dependency between findings
 * (Extracted to reduce cognitive complexity)
 */
function checkDedupCanonDependency(canonFinding, dedupFinding) {
  if (!canonFinding.original_id?.startsWith("CANON-")) return null;
  if (!dedupFinding.original_id?.startsWith("DEDUP-")) return null;
  if (!dedupFinding.dependencies?.includes(canonFinding.original_id)) return null;
  return "explicit DEDUP->CANON dependency";
}

/**
 * Check file + title similarity merge criteria
 * (Extracted to reduce cognitive complexity)
 */
function checkFileTitleSimilarity(finding1, finding2) {
  if (!finding1.file || !finding2.file) return null;
  if (finding1.file !== finding2.file) return null;
  const titleSimilarity = similarityScore(finding1.title, finding2.title);
  if (titleSimilarity < 80) return null;
  return `same file + similar title (${titleSimilarity}%)`;
}

/**
 * Check category + title similarity merge criteria
 * (Extracted to reduce cognitive complexity)
 */
function checkCategoryTitleSimilarity(finding1, finding2) {
  if (finding1.category !== finding2.category) return null;
  const titleSimilarity = similarityScore(finding1.title, finding2.title);
  if (titleSimilarity < 90) return null;
  return `same category + very similar title (${titleSimilarity}%)`;
}

/**
 * Check if two findings should be merged
 */
function shouldMerge(finding1, finding2, dedupLog) {
  const reasons = [];

  // Check explicit cross-references (both directions)
  const canonDep1 = checkDedupCanonDependency(finding1, finding2);
  const canonDep2 = checkDedupCanonDependency(finding2, finding1);
  if (canonDep1) reasons.push(canonDep1);
  if (canonDep2) reasons.push(canonDep2);

  // Same file + similar symbol/title
  const fileTitleMatch = checkFileTitleSimilarity(finding1, finding2);
  if (fileTitleMatch) reasons.push(fileTitleMatch);

  // Same category + very similar title
  const categoryTitleMatch = checkCategoryTitleSimilarity(finding1, finding2);
  if (categoryTitleMatch) reasons.push(categoryTitleMatch);

  if (reasons.length === 0) return false;

  dedupLog.push({
    action: "merge",
    finding1_id: finding1.original_id,
    finding2_id: finding2.original_id,
    reasons,
    timestamp: new Date().toISOString(),
  });
  return true;
}

/**
 * Merge two findings, keeping the highest severity
 * Preserves full merge ancestry when merging already-merged items (Qodo Review #173)
 */
function mergeFindings(finding1, finding2) {
  const severityRank = { S0: 0, S1: 1, S2: 2, S3: 3 };
  const keepFirst = severityRank[finding1.severity] <= severityRank[finding2.severity];
  const primary = keepFirst ? finding1 : finding2;
  const secondary = keepFirst ? finding2 : finding1;

  // Preserve full merge ancestry: flatten previous merged_from arrays
  const mergedFrom = [
    ...(primary.merged_from || [primary.original_id]),
    ...(secondary.merged_from || [secondary.original_id]),
  ].filter((id, idx, arr) => arr.indexOf(id) === idx); // dedupe

  return {
    ...primary,
    sources: [...(primary.sources || []), ...(secondary.sources || [])],
    evidence: [...(primary.evidence || []), ...(secondary.evidence || [])].filter(
      (v, i, a) => a.indexOf(v) === i
    ),
    files: [...new Set([...(primary.files || []), ...(secondary.files || [])])].filter(Boolean),
    merged_from: mergedFrom,
  };
}

/**
 * Normalize ROI to uppercase for consistent lookup (Qodo Review #174, #175)
 * Treats blank/whitespace-only values as undefined
 */
function normalizeRoi(value) {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim().toUpperCase();
  return normalized ? normalized : undefined;
}

/**
 * Calculate priority score for a finding
 */
function calculatePriorityScore(finding) {
  const severityWeight = SEVERITY_WEIGHTS[finding.severity] || 1;
  const effortWeight = EFFORT_WEIGHTS[finding.effort] || 1;
  const roiKey = normalizeRoi(finding.roi);
  const roiMultiplier = ROI_WEIGHTS[roiKey] || ROI_WEIGHTS.MEDIUM;

  // Persistence boost if found in multiple sources
  const persistenceBoost = finding.sources?.length > 1 ? 10 : 0;

  const score = severityWeight * 25 + effortWeight * 15 + roiMultiplier * 10 + persistenceBoost;

  return Math.min(100, score);
}

/**
 * Determine PR bucket based on category and severity
 */
function determinePrBucket(finding) {
  if (finding.pr_bucket_suggestion && finding.pr_bucket_suggestion !== "-") {
    return finding.pr_bucket_suggestion;
  }
  return PR_BUCKET_MAP[finding.category] || "code-quality";
}

/**
 * Parse all single-session audit files
 * (Extracted to reduce cognitive complexity)
 */
function parseSingleSessionAudits(allFindings, stats) {
  const singleSessionCategories = [
    "code",
    "security",
    "documentation",
    "performance",
    "process",
    "refactoring",
    "engineering-productivity",
  ];

  for (const category of singleSessionCategories) {
    const filePath = join(CONFIG.singleSessionDir, category, "audit-2026-01-17.jsonl");
    const items = parseJsonlFile(filePath);
    console.log(`  - ${category}: ${items.length} items`);

    for (const item of items) {
      allFindings.push(normalizeSingleSession(item, category, "2026-01-17"));
      stats.singleSession++;
    }
  }
}

/**
 * Parse all CANON JSONL files
 * (Extracted to reduce cognitive complexity)
 */
function parseCanonFiles(allFindings, stats) {
  const canonFiles = [
    "CANON-CODE.jsonl",
    "CANON-SECURITY.jsonl",
    "CANON-PERF.jsonl",
    "CANON-REFACTOR.jsonl",
    "CANON-DOCS.jsonl",
    "CANON-PROCESS.jsonl",
  ];

  for (const canonFile of canonFiles) {
    const filePath = join(CONFIG.canonDir, canonFile);
    const items = parseJsonlFile(filePath);
    console.log(`  - ${canonFile}: ${items.length} items`);

    for (const item of items) {
      allFindings.push(normalizeCanon(item, canonFile));
      stats.canon++;
    }
  }
}

/**
 * Deduplicate findings using multi-pass merge with pre-bucketing (Qodo Review #173, #174)
 * - Multi-pass iteration until fixpoint (no more merges possible)
 * - Pre-buckets by file/category to reduce comparisons
 * - Uses ID index for O(1) DEDUP->CANON dependency lookup
 */
function deduplicateFindings(allFindings) {
  const dedupLog = [];
  let current = [...allFindings];
  let didMerge = true;
  let passCount = 0;
  const MAX_PASSES = 10; // Safety limit to prevent infinite loops

  while (didMerge && passCount < MAX_PASSES) {
    didMerge = false;
    passCount++;
    const processed = new Set();

    // Pre-bucket by file path and category for efficient comparison
    const fileIndex = new Map(); // file -> [indices]
    const categoryIndex = new Map(); // category -> [indices]
    const idToIndex = new Map(); // original_id -> index (for O(1) dependency lookup)

    for (let i = 0; i < current.length; i++) {
      const f = current[i];
      // Index by all files (including merged files array)
      const files = f.files?.length ? f.files : f.file ? [f.file] : [];
      for (const file of files) {
        if (!file) continue;
        if (!fileIndex.has(file)) fileIndex.set(file, []);
        fileIndex.get(file).push(i);
      }
      if (f.category) {
        if (!categoryIndex.has(f.category)) categoryIndex.set(f.category, []);
        categoryIndex.get(f.category).push(i);
      }
      if (f.original_id) {
        idToIndex.set(f.original_id, i);
      }
      // Also index merged_from IDs for stable dependency lookups (Qodo Review #175)
      if (f.merged_from?.length) {
        for (const mergedId of f.merged_from) {
          if (mergedId && !idToIndex.has(mergedId)) {
            idToIndex.set(mergedId, i);
          }
        }
      }
    }

    // Process merges directly from buckets (avoid materializing candidatePairs Set)
    const mergeGroups = new Map(); // canonical index -> merged finding

    function tryMergePair(i, j) {
      if (processed.has(i) || processed.has(j)) return;
      const finding1 = mergeGroups.get(i) || current[i];
      const finding2 = current[j];
      if (shouldMerge(finding1, finding2, dedupLog)) {
        const merged = mergeFindings(finding1, finding2);
        mergeGroups.set(i, merged);
        processed.add(j);
        didMerge = true;
      }
    }

    // Same-file pairs
    for (const indices of fileIndex.values()) {
      for (let a = 0; a < indices.length; a++) {
        for (let b = a + 1; b < indices.length; b++) {
          tryMergePair(indices[a], indices[b]);
        }
      }
    }

    // Same-category pairs (for title similarity matching)
    // Cap bucket size to prevent O(n²) blowup with large categories (Qodo Review #175)
    const MAX_CATEGORY_BUCKET = 250;
    for (const [category, indices] of categoryIndex.entries()) {
      if (indices.length > MAX_CATEGORY_BUCKET) {
        console.warn(
          `Warning: Skipping category '${category}' bucket (${indices.length} items > ${MAX_CATEGORY_BUCKET} cap)`
        );
        continue;
      }
      for (let a = 0; a < indices.length; a++) {
        for (let b = a + 1; b < indices.length; b++) {
          tryMergePair(indices[a], indices[b]);
        }
      }
    }

    // DEDUP->CANON dependencies using O(1) ID lookup
    for (let i = 0; i < current.length; i++) {
      const f = current[i];
      if (f.original_id?.startsWith("DEDUP-") && f.dependencies?.length) {
        for (const depId of f.dependencies) {
          const j = idToIndex.get(depId);
          if (j === undefined || i === j) continue;
          tryMergePair(i, j);
        }
      }
    }

    // Collect results for next pass
    const next = [];
    for (let i = 0; i < current.length; i++) {
      if (processed.has(i)) continue;
      next.push(mergeGroups.get(i) || current[i]);
    }
    current = next;
  }

  if (passCount >= MAX_PASSES) {
    console.warn(`Warning: Deduplication hit max passes (${MAX_PASSES}), may not be at fixpoint`);
  }

  return { uniqueFindings: current, dedupLog };
}

/**
 * Print final summary statistics
 * (Extracted to reduce cognitive complexity)
 */
function printSummary(stats, masterList, severityCounts, bucketCounts) {
  console.log("\n=== Aggregation Complete ===");
  console.log(`\nSource Summary:`);
  console.log(`  Single-session audits: ${stats.singleSession}`);
  console.log(`  CANON files: ${stats.canon}`);
  console.log(`  REFACTOR_BACKLOG: ${stats.backlog}`);
  console.log(`  AUDIT_FINDINGS_BACKLOG: ${stats.auditBacklog}`);
  console.log(`  Total raw: ${stats.total}`);
  console.log(`  After dedup: ${masterList.length}`);

  console.log(`\nSeverity Distribution:`);
  console.log(`  S0 Critical: ${severityCounts.S0}`);
  console.log(`  S1 High: ${severityCounts.S1}`);
  console.log(`  S2 Medium: ${severityCounts.S2}`);
  console.log(`  S3 Low: ${severityCounts.S3}`);

  console.log(`\nPR Bucket Summary:`);
  for (const [bucket, count] of Object.entries(bucketCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${bucket}: ${count}`);
  }

  // Quick wins (E0/E1 + S1/S2)
  const quickWins = masterList.filter(
    (m) => ["E0", "E1"].includes(m.effort) && ["S1", "S2"].includes(m.severity)
  );
  console.log(`\nQuick Wins (E0/E1 + S1/S2): ${quickWins.length}`);
}

/**
 * Main aggregation function
 */
function aggregate() {
  console.log("=== Master Issue Aggregation ===\n");

  const allFindings = [];
  const stats = {
    singleSession: 0,
    canon: 0,
    backlog: 0,
    auditBacklog: 0,
    total: 0,
  };

  // Phase 1: Parse all sources
  console.log("Phase 1: Parsing all sources...");

  parseSingleSessionAudits(allFindings, stats);
  parseCanonFiles(allFindings, stats);

  // Parse REFACTOR_BACKLOG.md
  const backlogItems = parseMarkdownBacklog(CONFIG.refactorBacklog);
  console.log(`  - REFACTOR_BACKLOG.md: ${backlogItems.length} items`);
  for (const item of backlogItems) {
    allFindings.push(normalizeBacklog(item));
    stats.backlog++;
  }

  // Parse AUDIT_FINDINGS_BACKLOG.md
  const auditBacklogItems = parseAuditFindingsBacklog(CONFIG.auditBacklog);
  console.log(`  - AUDIT_FINDINGS_BACKLOG.md: ${auditBacklogItems.length} items`);
  for (const item of auditBacklogItems) {
    allFindings.push(normalizeBacklog(item));
    stats.auditBacklog++;
  }

  stats.total = allFindings.length;
  console.log(`\nTotal raw findings: ${stats.total}`);

  // Ensure output directory exists before writing files
  if (!existsSync(CONFIG.outputDir)) {
    mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`  Created output directory: ${CONFIG.outputDir}`);
  }

  // Write raw findings
  const rawFindingsPath = join(CONFIG.outputDir, "raw-findings.jsonl");
  writeFileSync(rawFindingsPath, allFindings.map((f) => JSON.stringify(f)).join("\n"));
  console.log(`  Wrote: ${rawFindingsPath}`);

  // Phase 2: Already normalized during parsing
  console.log("\nPhase 2: Schema normalization complete (done during parsing)");
  const normalizedPath = join(CONFIG.outputDir, "normalized-findings.jsonl");
  writeFileSync(normalizedPath, allFindings.map((f) => JSON.stringify(f)).join("\n"));
  console.log(`  Wrote: ${normalizedPath}`);

  // Phase 3: Deduplication
  console.log("\nPhase 3: Deduplicating findings...");
  const { uniqueFindings, dedupLog } = deduplicateFindings(allFindings);
  console.log(
    `  Deduplicated: ${stats.total} -> ${uniqueFindings.length} (${Math.round((1 - uniqueFindings.length / stats.total) * 100)}% reduction)`
  );

  // Write dedup log
  const dedupLogPath = join(CONFIG.outputDir, "dedup-log.jsonl");
  writeFileSync(dedupLogPath, dedupLog.map((l) => JSON.stringify(l)).join("\n"));
  console.log(`  Wrote: ${dedupLogPath} (${dedupLog.length} merge decisions)`);

  // Write unique findings
  const uniquePath = join(CONFIG.outputDir, "unique-findings.jsonl");
  writeFileSync(uniquePath, uniqueFindings.map((f) => JSON.stringify(f)).join("\n"));
  console.log(`  Wrote: ${uniquePath}`);

  // Phase 4: Prioritize and categorize
  console.log("\nPhase 4: Prioritizing and categorizing...");

  let masterId = 1;
  const masterList = uniqueFindings.map((finding) => {
    const priorityScore = calculatePriorityScore(finding);
    const prBucket = determinePrBucket(finding);

    return {
      master_id: `MASTER-${String(masterId++).padStart(4, "0")}`,
      title: finding.title,
      category: finding.category,
      severity: finding.severity,
      effort: finding.effort,
      priority_score: priorityScore,
      sources: finding.sources,
      files: finding.files || (finding.file ? [finding.file] : []),
      status: finding.status || "open",
      description: finding.description,
      recommendation: finding.recommendation,
      dependencies: finding.dependencies || [],
      pr_bucket: prBucket,
      original_id: finding.original_id,
      merged_from: finding.merged_from,
    };
  });

  // Sort by priority score descending
  masterList.sort((a, b) => b.priority_score - a.priority_score);

  // Write master list
  const masterListPath = join(CONFIG.outputDir, "MASTER_ISSUE_LIST.jsonl");
  writeFileSync(masterListPath, masterList.map((m) => JSON.stringify(m)).join("\n"));
  console.log(`  Wrote: ${masterListPath}`);

  // Phase 5: Generate reports
  console.log("\nPhase 5: Generating markdown reports...");

  // Generate summary statistics
  const severityCounts = { S0: 0, S1: 0, S2: 0, S3: 0 };
  const categoryCounts = {};
  const bucketCounts = {};

  for (const item of masterList) {
    severityCounts[item.severity] = (severityCounts[item.severity] || 0) + 1;
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    bucketCounts[item.pr_bucket] = (bucketCounts[item.pr_bucket] || 0) + 1;
  }

  // Generate MASTER_ISSUE_LIST.md
  const masterMd = generateMasterIssueMd(
    masterList,
    severityCounts,
    categoryCounts,
    bucketCounts,
    stats
  );
  const masterMdPath = join(CONFIG.outputDir, "MASTER_ISSUE_LIST.md");
  writeFileSync(masterMdPath, masterMd);
  console.log(`  Wrote: ${masterMdPath}`);

  // Generate IMPLEMENTATION_PLAN.md
  const implPlan = generateImplementationPlan(masterList, bucketCounts);
  const implPlanPath = join(CONFIG.outputDir, "IMPLEMENTATION_PLAN.md");
  writeFileSync(implPlanPath, implPlan);
  console.log(`  Wrote: ${implPlanPath}`);

  // Print summary
  printSummary(stats, masterList, severityCounts, bucketCounts);

  return { masterList, stats, severityCounts, categoryCounts, bucketCounts };
}

/**
 * Generate MASTER_ISSUE_LIST.md
 */
function generateMasterIssueMd(masterList, severityCounts, categoryCounts, bucketCounts, stats) {
  let md = `# Master Issue List

**Generated:** ${new Date().toISOString().split("T")[0]}
**Source:** Aggregated from single-session audits, CANON files, and backlogs
**Total Items:** ${masterList.length} (deduplicated from ${stats.total} raw findings)

---

## Summary Statistics

### By Severity

| Severity | Count | Description |
|----------|-------|-------------|
| S0 | ${severityCounts.S0} | Critical - implement immediately |
| S1 | ${severityCounts.S1} | High - implement this sprint |
| S2 | ${severityCounts.S2} | Medium - implement next sprint |
| S3 | ${severityCounts.S3} | Low - backlog |

### By Category

| Category | Count |
|----------|-------|
${Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([cat, count]) => `| ${safeCell(cat)} | ${count} |`)
  .join("\n")}

### By PR Bucket

| PR Bucket | Count |
|-----------|-------|
${Object.entries(bucketCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([bucket, count]) => `| ${safeCell(bucket)} | ${count} |`)
  .join("\n")}

---

## Critical Items (S0)

${masterList
  .filter((m) => m.severity === "S0")
  .map(
    (m) => `
### ${m.master_id}: ${m.title}

- **Category:** ${m.category}
- **Effort:** ${m.effort}
- **Priority Score:** ${m.priority_score}
- **PR Bucket:** ${m.pr_bucket}
- **Files:** ${m.files?.join(", ") || "N/A"}
- **Sources:** ${m.sources?.map((s) => s.id).join(", ")}

${m.description || ""}

${m.recommendation ? `**Recommendation:** ${m.recommendation}` : ""}
`
  )
  .join("\n")}

---

## High Priority Items (S1)

${masterList
  .filter((m) => m.severity === "S1")
  .slice(0, 30)
  .map(
    (m) => `
### ${m.master_id}: ${m.title}

- **Category:** ${m.category}
- **Effort:** ${m.effort}
- **Priority Score:** ${m.priority_score}
- **PR Bucket:** ${m.pr_bucket}
- **Sources:** ${m.sources?.map((s) => s.id).join(", ")}
`
  )
  .join("\n")}

${masterList.filter((m) => m.severity === "S1").length > 30 ? `\n_...and ${masterList.filter((m) => m.severity === "S1").length - 30} more S1 items_\n` : ""}

---

## Quick Wins (E0/E1 + S1/S2)

| ID | Title | Severity | Effort | Category | PR Bucket |
|----|-------|----------|--------|----------|-----------|
${masterList
  .filter((m) => ["E0", "E1"].includes(m.effort) && ["S1", "S2"].includes(m.severity))
  .slice(0, 40)
  .map(
    (m) =>
      `| ${safeCell(m.master_id)} | ${safeCell(m.title?.substring(0, 50))}${m.title?.length > 50 ? "..." : ""} | ${safeCell(m.severity)} | ${safeCell(m.effort)} | ${safeCell(m.category)} | ${safeCell(m.pr_bucket)} |`
  )
  .join("\n")}

---

## Full List by Priority Score

| Rank | ID | Title | Sev | Effort | Score | Category |
|------|-----|-------|-----|--------|-------|----------|
${masterList
  .slice(0, 100)
  .map(
    (m, i) =>
      `| ${i + 1} | ${safeCell(m.master_id)} | ${safeCell(m.title?.substring(0, 40))}${m.title?.length > 40 ? "..." : ""} | ${safeCell(m.severity)} | ${safeCell(m.effort)} | ${safeCell(m.priority_score)} | ${safeCell(m.category)} |`
  )
  .join("\n")}

${masterList.length > 100 ? `\n_...and ${masterList.length - 100} more items (see MASTER_ISSUE_LIST.jsonl for full list)_\n` : ""}

---

## Notes

- Priority scores range from 0-100
- Score formula: (severity_weight * 25) + (effort_inverse * 15) + (roi_multiplier * 10) + persistence_boost
- Items found in multiple sources get +10 persistence boost
- See IMPLEMENTATION_PLAN.md for grouped execution plan

---

**Document Version:** 1.0
**Last Updated:** ${new Date().toISOString().split("T")[0]}
`;

  return md;
}

/**
 * Generate IMPLEMENTATION_PLAN.md
 */
function generateImplementationPlan(masterList, bucketCounts) {
  const buckets = {};
  for (const item of masterList) {
    if (!buckets[item.pr_bucket]) {
      buckets[item.pr_bucket] = [];
    }
    buckets[item.pr_bucket].push(item);
  }

  let md = `# Implementation Plan

**Generated:** ${new Date().toISOString().split("T")[0]}
**Total Items:** ${masterList.length}
**PR Buckets:** ${Object.keys(buckets).length}

---

## Overview

This plan organizes the deduplicated findings into PR buckets for systematic implementation.

### PR Bucket Summary

| Bucket | Items | S0 | S1 | S2 | S3 |
|--------|-------|-----|-----|-----|-----|
${Object.entries(buckets)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([bucket, items]) => {
    const s0 = items.filter((i) => i.severity === "S0").length;
    const s1 = items.filter((i) => i.severity === "S1").length;
    const s2 = items.filter((i) => i.severity === "S2").length;
    const s3 = items.filter((i) => i.severity === "S3").length;
    return `| ${safeCell(bucket)} | ${items.length} | ${s0} | ${s1} | ${s2} | ${s3} |`;
  })
  .join("\n")}

---

## Phase 1: Critical (S0) - Immediate Action

${masterList
  .filter((m) => m.severity === "S0")
  .map(
    (m) => `
- [ ] **${m.master_id}**: ${m.title}
  - Effort: ${m.effort} | Bucket: ${m.pr_bucket}
  - Sources: ${m.sources?.map((s) => s.id).join(", ")}
`
  )
  .join("")}

---

## Phase 2: High Priority (S1) - This Sprint

${Object.entries(buckets)
  .filter(([_, items]) => items.some((i) => i.severity === "S1"))
  .map(
    ([bucket, items]) => `
### ${bucket}

${items
  .filter((i) => i.severity === "S1")
  .map((m) => `- [ ] **${m.master_id}**: ${m.title} (${m.effort})`)
  .join("\n")}
`
  )
  .join("\n")}

---

## Phase 3: Medium Priority (S2) - Next Sprint

${Object.entries(buckets)
  .filter(([_, items]) => items.some((i) => i.severity === "S2"))
  .map(
    ([bucket, items]) => `
### ${bucket}

${items
  .filter((i) => i.severity === "S2")
  .map((m) => `- [ ] **${m.master_id}**: ${m.title} (${m.effort})`)
  .join("\n")}
`
  )
  .join("\n")}

---

## Phase 4: Low Priority (S3) - Backlog

${Object.entries(buckets)
  .filter(([_, items]) => items.some((i) => i.severity === "S3"))
  .map(
    ([bucket, items]) => `
### ${bucket}

${items
  .filter((i) => i.severity === "S3")
  .map((m) => `- [ ] **${m.master_id}**: ${m.title} (${m.effort})`)
  .join("\n")}
`
  )
  .join("\n")}

---

## Dependency Chain

Items with dependencies should be implemented in order:

${
  masterList
    .filter((m) => m.dependencies?.length > 0)
    .map((m) => `- ${m.master_id} depends on: ${m.dependencies.join(", ")}`)
    .join("\n") || "_No explicit dependencies found_"
}

---

## Suggested PR Sequence

Based on severity, effort, and dependencies:

1. **Security Hardening PR** - All S0/S1 security items
2. **Performance Critical PR** - S0/S1 performance items
3. **Quick Wins PR** - E0 items across all categories
4. **Code Quality PR** - S2 code and refactoring items
5. **Documentation Sync PR** - All documentation items
6. **Process Automation PR** - CI/CD and process items

---

**Document Version:** 1.0
**Last Updated:** ${new Date().toISOString().split("T")[0]}
`;

  return md;
}

// Run aggregation
try {
  aggregate();
} catch (error) {
  // Sanitize error output - log type and truncated message only, no stack trace
  const errorType = error instanceof Error ? error.constructor.name : "Error";
  const errorMsg =
    error instanceof Error
      ? error.message.slice(0, 200) // Truncate to prevent sensitive data leakage
      : String(error).slice(0, 200);
  console.error(`Aggregation failed [${errorType}]: ${errorMsg}`);
  process.exit(1);
}
