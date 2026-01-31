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
  // Cross-reference sources for NET NEW detection (Session #116)
  roadmapPath: join(REPO_ROOT, "ROADMAP.md"),
  techDebtPath: join(REPO_ROOT, "docs/TECHNICAL_DEBT_MASTER.md"),
  comprehensiveAuditDir: join(REPO_ROOT, "docs/audits/comprehensive"),
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

// ID prefix to category mapping (S3776 complexity reduction)
// Takes precedence over item.category for consistent categorization
const ID_PREFIX_CATEGORY_MAP = {
  "SEC-": "security",
  "PERF-": "performance",
  "CODE-": "code",
  "PROC-": "process",
  "REF-": "refactoring",
  "DOC-": "documentation",
  "EFFP-": "engineering-productivity",
};

/**
 * Get category from ID prefix using lookup map (S3776 complexity reduction)
 */
function getCategoryFromIdPrefix(id) {
  if (!id) return null;
  for (const [prefix, category] of Object.entries(ID_PREFIX_CATEGORY_MAP)) {
    if (id.startsWith(prefix)) return category;
  }
  return null;
}

// Synonym mapping for semantic deduplication (Session #116)
// Each key maps to an array of related terms that should match
const SYNONYM_GROUPS = {
  // Tracing/Logging related
  correlation: ["tracing", "trace", "request-id", "requestid", "tracking"],
  tracing: ["correlation", "trace", "request-id", "tracking", "observability"],
  logger: ["logging", "logs", "observability", "telemetry"],

  // Offline/Sync related
  offline: ["sync", "persistence", "cache", "queue", "buffer"],
  persistence: ["offline", "cache", "storage", "indexeddb"],
  queue: ["buffer", "offline", "pending", "sync"],

  // Component size related
  monolithic: ["large", "god-object", "bloated", "oversized"],
  "god-object": ["monolithic", "large", "bloated", "oversized", "god"],

  // Security related
  authentication: ["auth", "login", "session", "credential"],
  authorization: ["permissions", "access", "roles", "claims"],
  validation: ["sanitization", "input", "escape", "xss"],

  // Performance related
  optimization: ["performance", "speed", "fast", "efficient"],
  caching: ["cache", "memoization", "memo", "usememo"],
  rendering: ["render", "rerender", "paint", "layout"],

  // Architecture related
  refactoring: ["refactor", "restructure", "reorganize", "extract"],
  duplication: ["duplicate", "duplicated", "copy", "repeated", "dry"],
  separation: ["extract", "split", "decouple", "modularize"],
};

/**
 * Pre-compute synonym lookup map for O(1) access (Qodo Review #218)
 */
function createSynonymLookup() {
  const lookup = new Map();
  for (const [key, values] of Object.entries(SYNONYM_GROUPS)) {
    const normalizedGroup = new Set();
    // Add the key itself (lowercase for consistent matching)
    normalizedGroup.add(key.toLowerCase().replace(/[-_]/g, ""));
    // Add all values (lowercase for consistent matching)
    for (const v of values) {
      normalizedGroup.add(v.toLowerCase().replace(/[-_]/g, ""));
    }
    // Map each term to the full group
    for (const term of normalizedGroup) {
      lookup.set(term, normalizedGroup);
    }
  }
  return lookup;
}

// Pre-compute at module load for fast lookup
const SYNONYM_LOOKUP = createSynonymLookup();

/**
 * Expand a word with its synonyms for matching (Session #116)
 * Optimized with pre-computed lookup map (Qodo Review #218)
 */
function expandWithSynonyms(word) {
  const normalized = word.toLowerCase().replace(/[-_]/g, "");
  const synonymGroup = SYNONYM_LOOKUP.get(normalized);

  if (synonymGroup) {
    return Array.from(synonymGroup);
  }

  return [normalized];
}

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
 * Parse ROADMAP.md to extract tracked items for cross-reference (Session #116)
 * Extracts: checkbox items with IDs (A1, B2, etc.), file references, completion status
 */
function parseRoadmapItems(filePath) {
  if (!existsSync(filePath)) {
    console.warn(`Warning: ROADMAP.md not found: ${filePath}`);
    return [];
  }

  let content;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (readError) {
    const errType = readError instanceof Error ? readError.constructor.name : "Error";
    console.warn(`Warning: ${errType} reading ROADMAP.md: ${filePath}`);
    return [];
  }

  const items = [];
  const lines = content.split("\n");

  // Track current section context
  let currentTrack = "";
  let currentSection = "";

  for (const line of lines) {
    // Detect track headers (### Track A, ### Track B, etc.)
    const trackMatch = line.match(/^###\s+Track\s+([A-Z])\s*[-–—]?\s*(.+)?/i);
    if (trackMatch) {
      currentTrack = trackMatch[1];
      currentSection = trackMatch[2]?.trim() || "";
      continue;
    }

    // Detect section headers (#### Sentry Integration, etc.)
    const sectionMatch = line.match(/^####\s+(.+)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      continue;
    }

    // Match checkbox items: - [x] **A1:** Description or - [ ] **A1:** Description
    // Extended to match multi-char IDs like EFF-006, BOT-001, etc.
    const checkboxMatch = line.match(/^[-*]\s*\[([ xX])\]\s*\*\*([A-Z][A-Z0-9-]*\d+):\*\*\s*(.+)/);
    if (checkboxMatch) {
      const isComplete = checkboxMatch[1].toLowerCase() === "x";
      const itemId = checkboxMatch[2];
      const description = checkboxMatch[3].trim();

      // Extract file references with optional line numbers (e.g., `file.tsx:123` or `file.tsx`)
      const fileLineMatches = description.matchAll(
        /`([^`]+\.(tsx?|jsx?|mjs|cjs|json|md))(?::(\d+))?`/g
      );
      const files = [];
      const fileLines = []; // {file, line} pairs for precise matching
      for (const match of fileLineMatches) {
        files.push(match[1]);
        if (match[3]) {
          fileLines.push({ file: match[1], line: parseInt(match[3], 10) });
        }
      }

      items.push({
        id: itemId,
        track: currentTrack,
        section: currentSection,
        description: description.replace(/[\u2705\u{1F504}\u{1F4CB}\u23F3]/gu, "").trim(),
        status: isComplete ? "complete" : "pending",
        files,
        fileLines,
        source: "roadmap",
      });
    }

    // Match emoji-prefixed items: - ⏳ **EFF-006: Description** or - ⏳ **EFF-006:** Description
    // Handles formats like: - ⏳ **EFF-006: Add Correlation IDs to Logger** (M effort)
    // Note: Using alternation instead of character class to avoid no-misleading-character-class error
    const emojiMatch = line.match(
      /^[-*]\s*(?:\u2705|\u{1F504}|\u{1F4CB}|\u23F3|\u26A0)+\s*\*\*([A-Z][A-Z0-9-]*\d+):?\*?\*?\s*(.+)/u
    );
    if (emojiMatch && !checkboxMatch) {
      const itemId = emojiMatch[1];
      let description = emojiMatch[2].trim();
      // Clean up trailing asterisks and effort markers
      description = description
        .replace(/\*\*$/, "")
        .replace(/\s*\([SMLE]\s*effort\)\s*$/i, "")
        .trim();

      // Detect completion status from emoji
      const isComplete = line.includes("\u2705"); // ✅

      // Extract file references with optional line numbers
      const fileLineMatches = description.matchAll(
        /`([^`]+\.(tsx?|jsx?|mjs|cjs|json|md))(?::(\d+))?`/g
      );
      const files = [];
      const fileLines = [];
      for (const match of fileLineMatches) {
        files.push(match[1]);
        if (match[3]) {
          fileLines.push({ file: match[1], line: parseInt(match[3], 10) });
        }
      }

      // Avoid duplicates
      if (!items.some((i) => i.id === itemId)) {
        items.push({
          id: itemId,
          track: currentTrack,
          section: currentSection,
          description: description.replace(/[\u2705\u{1F504}\u{1F4CB}\u23F3]/gu, "").trim(),
          status: isComplete ? "complete" : "pending",
          files,
          fileLines,
          source: "roadmap",
        });
      }
    }

    // Also match table rows with IDs: | REACT-001 | Description | file.tsx | ...
    // Extended pattern to match: ARCH-002, M2.3-REF-001, CANON-0072, T7.1, etc.
    const tableMatch = line.match(/^\|\s*([\w.-]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
    // Flexible ID pattern: starts with letter, contains alphanumerics/dots/hyphens, ends with digit
    if (tableMatch && /^[A-Z][A-Z0-9.-]*\d+$/i.test(tableMatch[1].trim())) {
      const itemId = tableMatch[1].trim();
      const col2 = tableMatch[2].trim();
      const col3 = tableMatch[3].trim();

      // Detect if column 2 is a file path (contains / or ends with file extension)
      const col2IsFilePath = /[/\\]|\.(?:tsx?|jsx?|mjs|cjs|json|md)$/i.test(col2);

      // If col2 is a file path, use it as the file and col3 as description
      const description = col2IsFilePath ? col3 : col2;
      const files = [];
      const fileLines = [];

      // Helper to extract file and optional line number
      const extractFileLine = (path) => {
        const lineMatch = path.match(/^(.+):(\d+)$/);
        if (lineMatch) {
          files.push(lineMatch[1]);
          fileLines.push({ file: lineMatch[1], line: parseInt(lineMatch[2], 10) });
        } else {
          files.push(path);
        }
      };

      if (col2IsFilePath) {
        extractFileLine(col2);
      } else if (/\.(?:tsx?|jsx?|mjs|cjs|json|md)$/i.test(col3)) {
        extractFileLine(col3);
      }

      // Check if already added (avoid duplicates)
      if (!items.some((i) => i.id === itemId)) {
        items.push({
          id: itemId,
          track: currentTrack,
          section: currentSection,
          description,
          status: line.includes("✅") ? "complete" : "pending",
          files,
          fileLines,
          source: "roadmap",
        });
      }
    }
  }

  return items;
}

/**
 * Parse TECHNICAL_DEBT_MASTER.md for tracked debt items (Session #116)
 */
function parseTechDebtItems(filePath) {
  if (!existsSync(filePath)) {
    console.warn(`Warning: TECHNICAL_DEBT_MASTER.md not found: ${filePath}`);
    return [];
  }

  let content;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (readError) {
    const errType = readError instanceof Error ? readError.constructor.name : "Error";
    console.warn(`Warning: ${errType} reading TECHNICAL_DEBT_MASTER.md: ${filePath}`);
    return [];
  }

  const items = [];
  const lines = content.split("\n");

  // Parse table rows: | **ID** | Title | Status | Effort | File(s) |
  for (const line of lines) {
    // Match table rows with IDs like PERF-001, SEC-003, etc.
    const tableMatch = line.match(
      /^\|\s*\*?\*?([\w-]+)\*?\*?\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/
    );
    if (tableMatch && /^[A-Z]+-\d+$/.test(tableMatch[1].trim())) {
      const itemId = tableMatch[1].trim();
      const title = tableMatch[2].trim();
      const status = tableMatch[3].trim();

      // Skip header rows and false positive markers
      if (title.toLowerCase() === "title" || status.includes("FALSE POSITIVE")) {
        continue;
      }

      items.push({
        id: itemId,
        title,
        status: status.includes("✅") ? "complete" : "pending",
        source: "tech-debt",
      });
    }
  }

  return items;
}

/**
 * Cross-reference findings against ROADMAP and TECHNICAL_DEBT items (Session #116)
 * Returns findings with roadmap_status field: "already_tracked" or "net_new"
 * Enhanced with file:line matching and synonym expansion (Session #116)
 */
function crossReferenceWithTrackedItems(findings, roadmapItems, techDebtItems) {
  // Build lookup indices for fast matching
  const roadmapById = new Map(); // Direct ID lookup
  const roadmapByFile = new Map();
  const roadmapByFileLine = new Map(); // For file:line exact matching
  const roadmapByDescription = new Map();
  const techDebtById = new Map();
  const techDebtByTitle = new Map();

  // Line proximity threshold for matching (findings within N lines of tracked item)
  const LINE_PROXIMITY_THRESHOLD = 15;

  for (const item of roadmapItems) {
    // Index by ID for direct lookup
    if (item.id) {
      roadmapById.set(item.id, item);
    }
    // Index by files (basename)
    for (const file of item.files || []) {
      const normalizedFile = file.replace(/^.*\//, ""); // basename only
      if (!roadmapByFile.has(normalizedFile)) {
        roadmapByFile.set(normalizedFile, []);
      }
      roadmapByFile.get(normalizedFile).push(item);
    }

    // Index by file:line for precise matching
    for (const fileLine of item.fileLines || []) {
      const key = `${fileLine.file.replace(/^.*\//, "")}:${fileLine.line}`;
      if (!roadmapByFileLine.has(key)) {
        roadmapByFileLine.set(key, []);
      }
      roadmapByFileLine.get(key).push({ ...item, matchedLine: fileLine.line });
    }

    // Index by description words with synonym expansion
    const descWords = item.description
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4);
    for (const word of descWords) {
      // Expand each word with its synonyms
      const expandedWords = expandWithSynonyms(word);
      for (const expandedWord of expandedWords) {
        if (!roadmapByDescription.has(expandedWord)) {
          roadmapByDescription.set(expandedWord, []);
        }
        // Avoid duplicate entries
        if (!roadmapByDescription.get(expandedWord).some((i) => i.id === item.id)) {
          roadmapByDescription.get(expandedWord).push(item);
        }
      }
    }
  }

  for (const item of techDebtItems) {
    techDebtById.set(item.id, item);
    // Index by title words with synonym expansion
    const titleWords = item.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4);
    for (const word of titleWords) {
      const expandedWords = expandWithSynonyms(word);
      for (const expandedWord of expandedWords) {
        if (!techDebtByTitle.has(expandedWord)) {
          techDebtByTitle.set(expandedWord, []);
        }
        if (!techDebtByTitle.get(expandedWord).some((i) => i.id === item.id)) {
          techDebtByTitle.get(expandedWord).push(item);
        }
      }
    }
  }

  const crossRefLog = [];
  let alreadyTrackedCount = 0;
  let netNewCount = 0;

  const processedFindings = findings.map((finding) => {
    let matchedRoadmapItem = null;
    let matchedTechDebtItem = null;
    let matchReason = null;

    // Check 1: Direct ID match with tech debt
    if (finding.original_id && techDebtById.has(finding.original_id)) {
      matchedTechDebtItem = techDebtById.get(finding.original_id);
      matchReason = "direct ID match";
    }

    // Check 1.1: Direct ID match with roadmap items
    if (!matchedRoadmapItem && finding.original_id && roadmapById.has(finding.original_id)) {
      matchedRoadmapItem = roadmapById.get(finding.original_id);
      matchReason = "direct roadmap ID match";
    }

    // Normalize line number (0 is valid, but NaN or undefined is not)
    const findingLine = Number.isFinite(finding.line)
      ? finding.line
      : parseInt(String(finding.line || ""), 10);
    const hasValidLine = Number.isFinite(findingLine);

    // Check 1.5: File:line exact match (highest precision)
    if (!matchedRoadmapItem && finding.file && hasValidLine) {
      const basename = finding.file.replace(/^.*\//, "");
      const exactKey = `${basename}:${findingLine}`;
      const exactMatches = roadmapByFileLine.get(exactKey) || [];
      if (exactMatches.length > 0) {
        matchedRoadmapItem = exactMatches[0];
        matchReason = `file:line exact match: ${exactKey}`;
      }
    }

    // Check 1.6: File:line proximity match (within N lines)
    if (!matchedRoadmapItem && finding.file && hasValidLine) {
      const basename = finding.file.replace(/^.*\//, "");
      // Check all roadmap items with file:line references
      for (const [key, items] of roadmapByFileLine) {
        if (key.startsWith(basename + ":")) {
          const roadmapLine = parseInt(key.split(":")[1], 10);
          if (
            Number.isFinite(roadmapLine) &&
            Math.abs(findingLine - roadmapLine) <= LINE_PROXIMITY_THRESHOLD
          ) {
            matchedRoadmapItem = items[0];
            matchReason = `file:line proximity (within ${LINE_PROXIMITY_THRESHOLD} lines): ${basename}:${roadmapLine}`;
            break;
          }
        }
      }
    }

    // Check 2: File-based match with roadmap (fallback to basename only)
    if (!matchedRoadmapItem && finding.file) {
      const basename = finding.file.replace(/^.*\//, "");
      const roadmapMatches = roadmapByFile.get(basename) || [];
      if (roadmapMatches.length > 0) {
        matchedRoadmapItem = roadmapMatches[0];
        matchReason = `file match: ${basename}`;
      }
    }

    // Check 3: Title similarity with tech debt (with synonym expansion)
    if (!matchedTechDebtItem && finding.title) {
      const titleWords = finding.title
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4);
      const candidates = new Map();
      for (const word of titleWords) {
        // Expand with synonyms for better matching
        const expandedWords = expandWithSynonyms(word);
        for (const expandedWord of expandedWords) {
          for (const item of techDebtByTitle.get(expandedWord) || []) {
            candidates.set(item.id, (candidates.get(item.id) || 0) + 1);
          }
        }
      }
      // Require at least 2 matching words for title match
      for (const [id, count] of candidates) {
        if (count >= 2) {
          matchedTechDebtItem = techDebtById.get(id);
          matchReason = `title similarity (${count} words, with synonyms)`;
          break;
        }
      }
    }

    // Check 4: Description similarity with roadmap (with synonym expansion)
    if (!matchedRoadmapItem && finding.title) {
      const titleWords = finding.title
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4);
      const candidates = new Map();
      for (const word of titleWords) {
        // Expand with synonyms for better matching
        const expandedWords = expandWithSynonyms(word);
        for (const expandedWord of expandedWords) {
          for (const item of roadmapByDescription.get(expandedWord) || []) {
            candidates.set(item.id, (candidates.get(item.id) || 0) + 1);
          }
        }
      }
      // Require at least 2 matching words
      for (const [id, count] of candidates) {
        if (count >= 2) {
          // Use O(1) Map lookup instead of O(n) find()
          matchedRoadmapItem = roadmapById.get(id) || null;
          matchReason = `description similarity (${count} words, with synonyms)`;
          break;
        }
      }
    }

    // Determine status
    const isAlreadyTracked = matchedRoadmapItem || matchedTechDebtItem;
    if (isAlreadyTracked) {
      alreadyTrackedCount++;
      crossRefLog.push({
        finding_id: finding.original_id,
        finding_title: finding.title?.substring(0, 60),
        roadmap_status: "already_tracked",
        matched_roadmap_item: matchedRoadmapItem?.id || null,
        matched_tech_debt_item: matchedTechDebtItem?.id || null,
        match_reason: matchReason,
      });
    } else {
      netNewCount++;
    }

    return {
      ...finding,
      roadmap_status: isAlreadyTracked ? "already_tracked" : "net_new",
      matched_roadmap_item: matchedRoadmapItem?.id || null,
      matched_tech_debt_item: matchedTechDebtItem?.id || null,
    };
  });

  return {
    findings: processedFindings,
    crossRefLog,
    stats: {
      total: findings.length,
      alreadyTracked: alreadyTrackedCount,
      netNew: netNewCount,
    },
  };
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
  // Uses extracted helper for S3776 complexity reduction
  const idPrefixCategory = getCategoryFromIdPrefix(item.id);
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
 * Extract description from CANON item (multiple possible fields)
 */
function extractCanonDescription(item) {
  return item.why_it_matters || item.description || item.issue_details?.description;
}

/**
 * Extract recommendation from CANON item (multiple possible fields)
 */
function extractCanonRecommendation(item) {
  if (item.suggested_fix) return item.suggested_fix;
  if (item.optimization?.description) return item.optimization.description;
  if (item.remediation?.steps?.length) return item.remediation.steps.join("; ");
  return undefined;
}

/**
 * Filter dependencies to prevent self-references
 */
function filterSelfDependencies(dependencies, selfId) {
  if (!dependencies?.length) return [];
  return dependencies.filter((dep) => dep !== selfId);
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
    file: item.files?.[0],
    files: item.files,
    symbols: item.symbols,
    description: extractCanonDescription(item),
    recommendation: extractCanonRecommendation(item),
    evidence: item.evidence,
    pr_bucket_suggestion: item.pr_bucket_suggestion || item.pr_bucket,
    dependencies: filterSelfDependencies(item.dependencies, item.canonical_id),
    status: item.status,
    consensus_score: item.consensus_score || item.consensus,
    models_agreeing: item.models_agreeing,
    sources: [{ type: "canon", id: item.canonical_id, file: sourceFile }],
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

// ============================================================================
// Deduplication Helpers (S3776 complexity reduction)
// ============================================================================

/**
 * Add a value to a Map<key, Set> index for true deduplication
 * Review #188: Use Set instead of array for reliable uniqueness
 * Review #191: Defensive check to ensure bucket is a Set before adding
 * Review #192: Self-heal corrupted buckets, allow empty string keys
 * Review #193: Preserve existing values when recovering corrupted buckets
 */
function addToMapIndex(map, key, value) {
  // Only reject null/undefined, allow empty string keys
  if (key === null || key === undefined) return;
  if (!map.has(key)) map.set(key, new Set());

  const bucket = map.get(key);
  // Self-heal if the map was corrupted, preserving existing values if iterable
  if (!(bucket instanceof Set)) {
    const recovered =
      bucket && typeof bucket[Symbol.iterator] === "function" ? new Set(bucket) : new Set();
    map.set(key, recovered);
  }
  map.get(key).add(value);
}

/**
 * Get all files from a finding (handles both .files array and single .file)
 */
function getFilesFromFinding(finding) {
  if (finding.files?.length) return finding.files;
  if (finding.file) return [finding.file];
  return [];
}

/**
 * Build lookup indices for findings deduplication.
 * Returns fileIndex, categoryIndex, and idToIndex maps for O(1) lookups.
 */
function buildFindingIndices(findings) {
  const fileIndex = new Map(); // file -> [indices]
  const categoryIndex = new Map(); // category -> [indices]
  const idToIndex = new Map(); // original_id -> index

  for (let i = 0; i < findings.length; i++) {
    const f = findings[i];

    // Index by all files (including merged files array)
    for (const file of getFilesFromFinding(f)) {
      addToMapIndex(fileIndex, file, i);
    }

    // Index by category
    addToMapIndex(categoryIndex, f.category, i);

    // Index by original_id
    if (f.original_id) idToIndex.set(f.original_id, i);

    // Also index merged_from IDs for stable dependency lookups (Qodo Review #175)
    for (const mergedId of f.merged_from || []) {
      if (mergedId && !idToIndex.has(mergedId)) idToIndex.set(mergedId, i);
    }
  }

  return { fileIndex, categoryIndex, idToIndex };
}

/**
 * Process all pairs within bucket indices, calling tryMergePair for each.
 * Skips buckets exceeding maxSize to prevent O(n²) blowup.
 * Review #189: Convert Set to Array for numerical indexing
 */
function processBucketPairs(bucketMap, tryMergePair, maxSize = Infinity, bucketType = "bucket") {
  for (const [key, indicesSet] of bucketMap.entries()) {
    // Review #189: Convert Set to Array for iteration with numerical indices
    // Review #190: Sort indices for deterministic merge order across runs
    const indices = Array.from(indicesSet).sort((a, b) => a - b);
    if (indices.length > maxSize) {
      console.warn(
        `Warning: Skipping ${bucketType} '${key}' (${indices.length} items > ${maxSize} cap)`
      );
      continue;
    }
    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        tryMergePair(indices[a], indices[b]);
      }
    }
  }
}

/**
 * Deduplicate findings using multi-pass merge with pre-bucketing (Qodo Review #173, #174)
 *
 * Multi-pass approach rationale (vs Disjoint Set Union):
 * - DSU would require upfront equivalence determination, but merge criteria depend on
 *   accumulated evidence from previous merges (e.g., merged_from arrays, combined files)
 * - Multi-pass allows iterative refinement: early merges create new merge opportunities
 * - Fixpoint iteration handles transitive merges naturally (A+B, then AB+C)
 * - Pre-bucketing provides O(n) grouping before O(k²) pair comparison within buckets
 *
 * Implementation notes:
 * - Multi-pass iteration until fixpoint (no more merges possible)
 * - Pre-buckets by file/category to reduce comparisons
 * - Uses ID index for O(1) DEDUP->CANON dependency lookup
 * - Size caps prevent O(n²) blowup on large buckets
 */
function deduplicateFindings(allFindings) {
  const dedupLog = [];
  let current = [...allFindings];
  let didMerge = true;
  let passCount = 0;
  const MAX_PASSES = 10; // Safety limit to prevent infinite loops
  const MAX_FILE_BUCKET = 250; // Cap file bucket processing to prevent quadratic blowup
  const MAX_CATEGORY_BUCKET = 250;

  while (didMerge && passCount < MAX_PASSES) {
    didMerge = false;
    passCount++;
    const processed = new Set();
    const mergeGroups = new Map(); // canonical index -> merged finding

    // Build indices using extracted helper (S3776)
    const { fileIndex, categoryIndex, idToIndex } = buildFindingIndices(current);

    // Merge helper that tracks state via closure
    const tryMergePair = (i, j) => {
      if (processed.has(i) || processed.has(j)) return;
      const finding1 = mergeGroups.get(i) || current[i];
      const finding2 = current[j];
      if (shouldMerge(finding1, finding2, dedupLog)) {
        mergeGroups.set(i, mergeFindings(finding1, finding2));
        processed.add(j);
        didMerge = true;
      }
    };

    // Process same-file pairs with size cap to prevent quadratic blowup
    processBucketPairs(fileIndex, tryMergePair, MAX_FILE_BUCKET, "file");

    // Process same-category pairs with size cap
    processBucketPairs(categoryIndex, tryMergePair, MAX_CATEGORY_BUCKET, "category");

    // DEDUP->CANON dependencies using O(1) ID lookup
    for (let i = 0; i < current.length; i++) {
      const f = current[i];
      if (f.original_id?.startsWith("DEDUP-") && f.dependencies?.length) {
        for (const depId of f.dependencies) {
          const j = idToIndex.get(depId);
          if (j !== undefined && i !== j) tryMergePair(i, j);
        }
      }
    }

    // Collect results for next pass
    current = current
      .map((item, i) => (processed.has(i) ? null : mergeGroups.get(i) || item))
      .filter(Boolean);
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
function printSummary(stats, masterList, severityCounts, bucketCounts, crossRefStats) {
  console.log("\n=== Aggregation Complete ===");
  console.log(`\nSource Summary:`);
  console.log(`  Single-session audits: ${stats.singleSession}`);
  console.log(`  CANON files: ${stats.canon}`);
  console.log(`  REFACTOR_BACKLOG: ${stats.backlog}`);
  console.log(`  AUDIT_FINDINGS_BACKLOG: ${stats.auditBacklog}`);
  console.log(`  Total raw: ${stats.total}`);
  console.log(`  After dedup: ${masterList.length}`);

  // Cross-reference summary (Session #116)
  if (crossRefStats) {
    console.log(`\n🎯 NET NEW Analysis:`);
    console.log(`  Already in ROADMAP/Tech Debt: ${crossRefStats.alreadyTracked}`);
    console.log(`  NET NEW (truly new findings): ${crossRefStats.netNew}`);
  }

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

  // Phase 3.5: Cross-reference with ROADMAP and TECHNICAL_DEBT (Session #116)
  console.log("\nPhase 3.5: Cross-referencing with ROADMAP and TECHNICAL_DEBT...");
  const roadmapItems = parseRoadmapItems(CONFIG.roadmapPath);
  const techDebtItems = parseTechDebtItems(CONFIG.techDebtPath);
  console.log(`  - ROADMAP.md: ${roadmapItems.length} tracked items`);
  console.log(`  - TECHNICAL_DEBT_MASTER.md: ${techDebtItems.length} tracked items`);

  const {
    findings: crossReferencedFindings,
    crossRefLog,
    stats: crossRefStats,
  } = crossReferenceWithTrackedItems(uniqueFindings, roadmapItems, techDebtItems);

  console.log(`  Cross-reference results:`);
  console.log(`    Total unique: ${crossRefStats.total}`);
  console.log(`    Already tracked: ${crossRefStats.alreadyTracked}`);
  console.log(`    NET NEW: ${crossRefStats.netNew}`);

  // Write cross-reference log
  const crossRefLogPath = join(CONFIG.outputDir, "crossref-log.jsonl");
  writeFileSync(crossRefLogPath, crossRefLog.map((l) => JSON.stringify(l)).join("\n"));
  console.log(`  Wrote: ${crossRefLogPath} (${crossRefLog.length} matches)`);

  // Write NET NEW findings only
  const netNewFindings = crossReferencedFindings.filter((f) => f.roadmap_status === "net_new");
  const netNewPath = join(CONFIG.outputDir, "net-new-findings.jsonl");
  writeFileSync(netNewPath, netNewFindings.map((f) => JSON.stringify(f)).join("\n"));
  console.log(`  Wrote: ${netNewPath} (${netNewFindings.length} NET NEW items)`);

  // Phase 4: Prioritize and categorize
  console.log("\nPhase 4: Prioritizing and categorizing...");

  let masterId = 1;
  const masterList = crossReferencedFindings.map((finding) => {
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
      // Cross-reference fields (Session #116)
      roadmap_status: finding.roadmap_status,
      matched_roadmap_item: finding.matched_roadmap_item,
      matched_tech_debt_item: finding.matched_tech_debt_item,
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
    stats,
    crossRefStats
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
  printSummary(stats, masterList, severityCounts, bucketCounts, crossRefStats);

  return { masterList, stats, severityCounts, categoryCounts, bucketCounts, crossRefStats };
}

/**
 * Generate MASTER_ISSUE_LIST.md
 */
function generateMasterIssueMd(
  masterList,
  severityCounts,
  categoryCounts,
  bucketCounts,
  stats,
  crossRefStats
) {
  const netNewCount = crossRefStats?.netNew || masterList.length;
  const alreadyTrackedCount = crossRefStats?.alreadyTracked || 0;

  let md = `# Master Issue List

**Generated:** ${new Date().toISOString().split("T")[0]}
**Source:** Aggregated from single-session audits, CANON files, and backlogs
**Total Items:** ${masterList.length} (deduplicated from ${stats.total} raw findings)
${crossRefStats ? `**NET NEW:** ${netNewCount} (${alreadyTrackedCount} already in ROADMAP/Tech Debt)` : ""}

---

## Summary Statistics

### 🎯 NET NEW Analysis

| Metric | Count |
|--------|-------|
| Total Unique Findings | ${masterList.length} |
| Already in ROADMAP | ${alreadyTrackedCount} |
| **NET NEW** | **${netNewCount}** |

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
