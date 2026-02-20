#!/usr/bin/env node
/* global __dirname */
/**
 * Extract actionable findings from Dec 2025 audit reports into TDMS-format JSONL.
 *
 * Part of Technical Debt Resolution Step 0b.
 *
 * Parses 17 markdown reports in docs/archive/2025-dec-reports/ and extracts
 * actionable items (things that need fixing/improving/changing). Skips
 * informational content, completed items, and items already in MASTER_DEBT.
 *
 * Usage: node scripts/debt/extract-audit-reports.js [options]
 *
 * Options:
 *   --dry-run    Show what would be extracted without writing (default)
 *   --write      Actually append to scattered-intake.jsonl
 *   --verbose    Show all matches including skipped items
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const REPORTS_DIR = path.join(PROJECT_ROOT, "docs/archive/2025-dec-reports");
const DEBT_DIR = path.join(PROJECT_ROOT, "docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const OUTPUT_FILE = path.join(DEBT_DIR, "raw/scattered-intake.jsonl");

// --- Report metadata: maps filename to default category and extraction hints ---

const REPORT_CONFIG = {
  "ARCHITECTURE_IMPROVEMENT_PLAN.md": {
    category: "refactoring",
    type: "tech-debt",
    description: "Architecture quality improvement plan",
  },
  "CODE_ANALYSIS_REPORT.md": {
    category: "code-quality",
    type: "code-smell",
    description: "Multi-category code analysis",
  },
  "REFACTORING_ACTION_PLAN.md": {
    category: "refactoring",
    type: "tech-debt",
    description: "Refactoring action plan",
  },
  "LIBRARY_ANALYSIS.md": {
    category: "code-quality",
    type: "tech-debt",
    description: "Library/dependency analysis",
    lowYield: true, // mostly informational
  },
  "XSS_PROTECTION_VERIFICATION.md": {
    category: "security",
    type: "vulnerability",
    description: "XSS protection verification",
  },
  "ESLINT_WARNINGS_PLAN.md": {
    category: "code-quality",
    type: "code-smell",
    description: "ESLint warnings remediation",
  },
  "AGGREGATED_6MODEL_REPORT.md": {
    category: "security",
    type: "vulnerability",
    description: "6-model aggregated analysis",
  },
  "APP_CHECK_DIAGNOSIS.md": {
    category: "security",
    type: "tech-debt",
    description: "Firebase App Check diagnosis",
  },
  "ARCHITECTURAL_REFACTOR.md": {
    category: "refactoring",
    type: "tech-debt",
    description: "Architectural refactoring",
  },
  "BILLING_ALERTS_SETUP.md": {
    category: "process",
    type: "process-gap",
    description: "Billing alerts setup",
    lowYield: true, // operational, not code debt
  },
  "CONSOLIDATED_CODE_ANALYSIS.md": {
    category: "code-quality",
    type: "code-smell",
    description: "Consolidated code analysis",
  },
  "DEPENDENCY_ANALYSIS.md": {
    category: "code-quality",
    type: "tech-debt",
    description: "Dependency risk analysis",
  },
  "JOURNAL_SYSTEM_UPDATE.md": {
    category: "documentation",
    type: "tech-debt",
    description: "Journal system update",
    skip: true, // fully completed feature doc
  },
  "REFACTOR_SUMMARY.md": {
    category: "refactoring",
    type: "tech-debt",
    description: "Refactoring summary",
  },
  "ROADMAP_COMPARISON_ANALYSIS.md": {
    category: "process",
    type: "process-gap",
    description: "Roadmap comparison analysis",
    lowYield: true, // product planning, not direct code debt
  },
  "ROADMAP_INTEGRATION_SUMMARY.md": {
    category: "process",
    type: "process-gap",
    description: "Roadmap integration summary",
    lowYield: true, // planning doc
  },
  "ULTRA_THINKING_REVIEW.md": {
    category: "code-quality",
    type: "code-smell",
    description: "Deep thinking code review",
  },
};

// --- Shared utilities (from extract-scattered-debt.js) ---

function generateContentHash(item) {
  const normalizedFile = (item.file || "").replace(/^\.\//, "").replace(/^\//, "").toLowerCase();
  const hashInput = [
    normalizedFile,
    item.line || 0,
    (item.title || "").toLowerCase().substring(0, 100),
    (item.description || "").toLowerCase().substring(0, 200),
  ].join("|");
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

function loadExistingHashes() {
  const hashes = new Set();
  if (!fs.existsSync(MASTER_FILE)) return hashes;
  let content;
  try {
    content = fs.readFileSync(MASTER_FILE, "utf8").replaceAll("\uFEFF", "");
  } catch {
    return hashes;
  }
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line);
      if (item.content_hash) hashes.add(item.content_hash);
    } catch {
      // skip
    }
  }
  return hashes;
}

function loadExistingIntakeIds() {
  const ids = new Set();
  if (!fs.existsSync(OUTPUT_FILE)) return ids;
  let content;
  try {
    content = fs.readFileSync(OUTPUT_FILE, "utf8").replaceAll("\uFEFF", "");
  } catch {
    return ids;
  }
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line);
      if (item.id) ids.add(item.id);
    } catch {
      // skip
    }
  }
  return ids;
}

function loadExistingOutputHashes() {
  const hashes = new Set();
  if (!fs.existsSync(OUTPUT_FILE)) return hashes;
  let content;
  try {
    content = fs.readFileSync(OUTPUT_FILE, "utf8").replaceAll("\uFEFF", "");
  } catch {
    return hashes;
  }
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line);
      if (item.content_hash) hashes.add(item.content_hash);
    } catch {
      // skip
    }
  }
  return hashes;
}

// --- Severity detection from markdown context ---

function detectSeverity(text, sectionContext) {
  const combined = `${sectionContext} ${text}`.toLowerCase();

  // Prefer explicit severity markers (e.g., "(S2)", "- S1")
  const explicit = combined.match(/(?:^|[\s(,-])s([0-3])(?:[\s),.-]|$)/);
  if (explicit) return `S${explicit[1]}`;

  // Emoji/keyword-based severity
  if (/🔴|critical|severity:\s*critical/.test(combined)) return "S0";
  if (/🟡|⚠️|high|severity:\s*high/.test(combined)) return "S1";
  if (/🟢|🔵|medium|low/.test(combined)) return "S3";
  // Language-based fallback
  if (/\b(crash|data.?loss|security.?vuln|exploit|bypass)\b/.test(combined)) return "S0";
  if (/\b(memory.?leak|race.?condition|inconsistent|missing)\b/.test(combined)) return "S1";
  return "S3";
}

// --- Category override from content ---

function detectCategory(text, defaultCategory) {
  const lower = text.toLowerCase();
  if (/\b(xss|csrf|injection|vulnerab|auth\w*bypass|security)\b/.test(lower)) return "security";
  if (/\b(optimi[sz]|perf|cache|latency|slow|bundle.?size|re-?render)\b/.test(lower))
    return "performance";
  if (/\b(refactor|decompos|extract|split|simplif|complex)\b/.test(lower)) return "refactoring";
  if (/\b(eslint|lint|unused|import|type.?safety|any.?type)\b/.test(lower)) return "code-quality";
  if (/\b(test|coverage|spec|assert)\b/.test(lower)) return "code-quality";
  if (/\b(document|readme|comment|jsdoc)\b/.test(lower)) return "documentation";
  return defaultCategory;
}

// --- Completion detection ---

function isCompleted(text) {
  // Check for completed markers
  if (/^\s*-\s*\[x\]/i.test(text)) return true;
  if (/^#{1,4}\s*✅\s*(completed|resolved|done|fixed)/i.test(text)) return true;
  if (/\*\*status\*\*:?\s*✅\s*(completed|resolved|done|fixed|safe|verified)/i.test(text))
    return true;
  if (/^\s*✅\s*(completed|resolved|done|fixed)/i.test(text)) return true;
  // Catch ✅ anywhere in the text indicating completion
  if (
    /✅/.test(text) &&
    /\b(completed|resolved|done|fixed|safe|verified|integrated|merged)\b/i.test(text)
  )
    return true;
  // Items ending with ✅ (e.g., "Refactor #1: ... ✅")
  if (/✅\s*$/.test(text.trim())) return true;
  // "RESOLVED" status markers
  if (/\bresolved\b/i.test(text) && /\bstatus\b/i.test(text)) return true;
  return false;
}

// --- Non-actionable heading detection ---

function isNonActionableHeading(text) {
  const lower = text.toLowerCase().replace(/[*#`]/g, "").trim();

  // Structural/meta headings that aren't concrete work items
  const nonActionablePatterns = [
    /^(executive\s+)?summary$/,
    /^overview$/,
    /^background$/,
    /^(key\s+)?findings$/,
    /^conclusion/,
    /^(how|what|why)\s+(to|it|this|react|we)/,
    /^strengths/,
    /^current\s+(architecture|state|status)/,
    /^appendix/,
    /^reference/,
    /^glossary/,
    /^table\s+of\s+contents/,
    /^step\s+\d+/i, // "STEP 1:", "Step 2:"
    /^(pre-?|post-?)deployment/,
    /^(success|quality|quantitative|qualitative)\s+metrics/,
    /^(risk|impact)\s+(assessment|summary|analysis)/,
    /^(decision|change)\s+log/,
    /^open\s+questions/,
    /^(implementation|execution|remediation)\s+(timeline|strategy|plan|order)$/,
    /^testing\s+(strategy|recommendations)/,
    /^(deployment|migration)\s+checklist$/,
    /^(cost-?benefit|backward\s+compat)/,
    /^key\s+(learnings|deliverables|documents)/,
    /^(?:immediate|long.?term)\s*(?:actions?|next\s+steps?)?$/,
    /^(?:short|medium).?term\s*(?:actions?|next\s+steps?)?$/,
    /^(week|phase|sprint)\s+\d/,
    /^(before|after)\s+(refactoring|phase|this)/,
    /^for\s+each\s+fix/,
    /^(code\s+quality|performance|security)\s+(improvements?|enhancements?|metrics)$/,
    /^(duplicate|comparison|contradiction)\s+analysis/,
    /^(feature\s+)?comparison\s+matrix/,
    /^recommended\s+(next\s+)?steps/,
    /^(prioritized\s+)?action\s+(items?|plan)/,
    /^(strong|perfect)\s+alignment/,
    /^no\s+(major\s+)?contradictions/,
    /^overall\s+assessment/,
    /^(external|internal)\s+links/,
    /^(core|ui|backend|utility|developer)\s+(framework\s+)?libraries$/,
    /^(validation|forms|data)\s+&/,
    /^(library\s+)?(id\s+)?index$/,
    /^(fetching|context7)\s/,
    /^(architecture|roadmap\s+phasing|business|compliance|accessibility|data\s+model|ui\/ux|quality)\s+(comparison|analysis|recommendations?)$/,
    /^not\s+in\s+(technical\s+)?roadmap/,
    /^(already|existing)\s+(in\s+roadmap|quality)/,
    /^(documentation\s+)?(created|updated|added)/,
    /^(code\s+)?changes\s+\(already/,
    /^parallel\s+execution/,
    /^no\s+conflicts/,
    /^\d+\.\d+/, // version numbers like "16.0.7"
    /^(questions|next\s+steps)\s*(&|$)/,
  ];

  for (const pattern of nonActionablePatterns) {
    if (pattern.test(lower)) return true;
  }

  // Skip pure library/tool names (e.g., "Next.js 16.0.7", "React 19.2.0", "Firebase 12.6.0")
  if (/^[A-Z][a-zA-Z.\s]+ \d+\.\d+/.test(text.replace(/[*#`]/g, "").trim())) return true;

  // Skip very short headings (likely organizational)
  if (lower.length < 12 && !/\b(fix|add|remove|update|split|extract|implement)\b/.test(lower))
    return true;

  return false;
}

// --- File path extraction from text ---

function extractFilePath(text) {
  // Match patterns like: `file.tsx`, **File**: `file.tsx`, file.tsx:123
  const patterns = [
    /`([a-zA-Z0-9_/-]+\.[a-zA-Z]{1,5}(?::\d+)?)`/,
    /\*\*File\*\*:?\s*`?([a-z0-9_/-]+\.[a-z]{1,5})`?/i,
    /\*\*Location\*\*:?\s*`?([a-z0-9_/-]+\.[a-z]{1,5})`?/i,
    /\b((?:src|app|components|lib|hooks|scripts|functions)\/[a-zA-Z0-9_/-]+\.[a-zA-Z]{1,5})/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const filePath = match[1].split(":")[0]; // remove :lineNum
      // Validate it looks like a real file path
      if (/\.[a-zA-Z]{1,5}$/.test(filePath) && !filePath.includes(" ")) {
        return filePath;
      }
    }
  }
  return "";
}

// --- Line number extraction ---

function extractLineNumber(text) {
  const patterns = [
    /:(\d+)(?:-\d+)?(?:[`\s)]|$)/,
    /\bline\s+(\d+)/i,
    /\bLine\s+(\d+)/i,
    /\(line\s+(\d+)\)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number.parseInt(match[1], 10);
  }
  return 0;
}

// --- Section-based extraction strategies ---

/**
 * Detect whether a table header row contains actionable columns.
 */
function isActionableTable(headers) {
  return headers.some((h) =>
    /file|location|action|fix|issue|finding|rule|variable|warning|problem|impact/.test(h)
  );
}

/**
 * Locate relevant column indexes within a parsed table header.
 */
function findTableColumnIndexes(headers) {
  return {
    fileColIdx: headers.findIndex((h) => /file|location|path/.test(h)),
    lineColIdx: headers.findIndex((h) => /^line$/.test(h)),
    actionColIdx: headers.findIndex((h) => /action|fix|recommendation|strategy/.test(h)),
    issueColIdx: headers.findIndex((h) => /issue|finding|problem|variable|warning/.test(h)),
  };
}

/**
 * Extract a column value by index if index is valid, otherwise fall back.
 */
function colValueOrFallback(cols, idx, fallbackText, extractor) {
  if (idx >= 0 && idx < cols.length) {
    return extractor(cols[idx]) || extractor(fallbackText);
  }
  return extractor(fallbackText);
}

/**
 * Safely get a column value by index, returning fallback if index is out of range.
 */
function safeCol(cols, idx, fallback) {
  if (idx >= 0 && idx < cols.length) return cols[idx];
  return fallback;
}

/**
 * Extract file path and line number from table columns using column indexes.
 */
function extractTableLocation(cols, rowLine, colIndexes) {
  const filePath = colValueOrFallback(cols, colIndexes.fileColIdx, rowLine, extractFilePath);
  const rawLineVal = safeCol(cols, colIndexes.lineColIdx, "");
  const lineNum = rawLineVal ? Number.parseInt(rawLineVal, 10) || 0 : extractLineNumber(rowLine);
  return { filePath, lineNum };
}

/**
 * Build a title from action/issue columns or all columns joined.
 */
function buildTableTitle(cols, colIndexes) {
  const actionText = safeCol(cols, colIndexes.actionColIdx, "");
  const issueText = safeCol(cols, colIndexes.issueColIdx, "");
  return (actionText || issueText || cols.join(" — ")).replaceAll("`", "").trim();
}

/**
 * Clean a file path by removing backticks and bold markers.
 */
function cleanFilePath(filePath) {
  if (!filePath) return "";
  return filePath.replace(/^`/g, "").replace(/`$/g, "").replace(/^\*\*/g, "").replace(/\*\*$/g, "");
}

/**
 * Parse a single table data row into a finding (or null if not actionable).
 */
function parseTableRow(rowLine, colIndexes) {
  const cols = rowLine
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

  if (cols.length < 2) return null;

  const { filePath, lineNum } = extractTableLocation(cols, rowLine, colIndexes);
  const title = buildTableTitle(cols, colIndexes);

  if (!title || title.length <= 5 || isCompleted(rowLine)) return null;

  return {
    title: title.substring(0, 200),
    file: cleanFilePath(filePath),
    line: lineNum || 0,
    rawText: rowLine,
  };
}

/**
 * Detect whether the current line is a table header with a separator on the next line.
 */
function isTableHeaderLine(lines, i) {
  return (
    lines[i].includes("|") &&
    i + 1 < lines.length &&
    /^\s*\|?[\s-:|]+\|?\s*$/.test(lines[i + 1])
  );
}

/**
 * Parse the header row into lowercase trimmed column names.
 */
function parseTableHeaders(line) {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((h) => h.trim().toLowerCase());
}

/**
 * Consume consecutive table data rows starting at index i, returning findings and new index.
 */
function consumeTableDataRows(lines, startIdx, colIndexes) {
  const findings = [];
  let i = startIdx;
  while (i < lines.length && lines[i].includes("|") && !/^#{1,6}\s/.test(lines[i].trim())) {
    const trimmed = lines[i].trim();
    if (!trimmed) break;
    const finding = parseTableRow(lines[i], colIndexes);
    if (finding) findings.push(finding);
    i++;
  }
  return { findings, nextIdx: i };
}

/**
 * Strategy 1: Extract from markdown tables
 * Looks for tables with File/Line/Action columns
 */
function extractFromTables(lines, reportConfig) {
  const findings = [];
  let i = 0;

  while (i < lines.length) {
    if (!isTableHeaderLine(lines, i)) {
      i++;
      continue;
    }

    const headers = parseTableHeaders(lines[i]);

    if (!isActionableTable(headers)) {
      i++;
      continue;
    }

    const colIndexes = findTableColumnIndexes(headers);
    const result = consumeTableDataRows(lines, i + 2, colIndexes);
    findings.push(...result.findings);
    i = result.nextIdx;
  }
  return findings;
}

/**
 * Detect severity context from a section heading string.
 */
function detectSeverityContext(sectionHeading) {
  if (/🔴|critical/i.test(sectionHeading)) return "critical";
  if (/🟡|⚠️|high|optimization/i.test(sectionHeading)) return "high";
  if (/🔵|🟢|medium|low|style/i.test(sectionHeading)) return "low";
  return "";
}

/**
 * Look ahead from a heading line to gather file path, line number, and description.
 */
function lookAheadForDetails(lines, startIdx) {
  let filePath = "";
  let lineNum = 0;
  let description = "";

  const limit = Math.min(startIdx + 10, lines.length);
  for (let j = startIdx; j < limit; j++) {
    const nextLine = lines[j].trim();
    if (/^#{1,5}\s/.test(nextLine)) break; // next section

    if (!filePath) filePath = extractFilePath(nextLine);
    if (!lineNum) lineNum = extractLineNumber(nextLine);

    if (!description) {
      const descMatch = nextLine.match(
        /\*\*(?:Issue|Problem|Impact|Description|Reason|Risk)\*\*:?\s*(.+)/i
      );
      if (descMatch) description = descMatch[1].trim();
    }
  }

  return { filePath, lineNum, description };
}

/**
 * Determine whether a heading line should be skipped (non-actionable or completed).
 */
function shouldSkipHeading(trimmedLine, heading) {
  if (isNonActionableHeading(heading)) return true;
  if (isCompleted(trimmedLine)) return true;
  if (/✅/.test(trimmedLine)) return true; // any ✅ in heading = likely completed
  return false;
}

/**
 * Match a numbered/lettered finding heading pattern in a trimmed line.
 * Returns the matched heading text or null.
 */
function matchNumberedHeading(trimmed) {
  // TWO-STRIKES: replaced regex with string parsing (SonarCloud S5852 + complexity 31>20)
  if (!trimmed.startsWith("#")) return null;

  // Strip leading ##-##### and whitespace
  let rest = trimmed.replace(/^#{2,5}\s*/, "");
  if (!rest) return null;

  // Strip optional number prefix like "1. " or "A1: "
  rest = rest.replace(/^\d+\.?\s+/, "").replace(/^[A-F]\d*[.:]\s+/, "");

  // Strip optional emoji prefix
  rest = rest.replace(/^(?:🔴|🟡|🔵|⚠️)\s*/, "");

  // Strip optional bold markers
  rest = rest.replace(/^\*\*/, "").replace(/\*\*$/, "");

  const heading = rest.replaceAll("**", "").trim();

  if (shouldSkipHeading(trimmed, heading)) return null;
  if (heading.length <= 10 || !/[a-z]/i.test(heading)) return null;

  return heading;
}

/**
 * Build a section finding object from a matched heading and line context.
 */
function buildSectionFinding(heading, lines, lineIdx, severityContext) {
  const { filePath, lineNum, description } = lookAheadForDetails(lines, lineIdx + 1);
  return {
    title: heading.substring(0, 200),
    description: description || "",
    file: filePath,
    line: lineNum,
    severityContext,
    rawText: lines[lineIdx].trim(),
  };
}

/**
 * Strategy 2: Extract from numbered/lettered sections with severity markers
 * Patterns: "### 1.", "#### A.", "🔴 CRITICAL:", etc.
 */
function extractFromSections(lines, reportConfig) {
  const findings = [];
  let currentSeverityContext = "";

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Track section headers for context
    if (/^#{1,4}\s/.test(trimmed)) {
      const section = trimmed.replace(/^#+\s*/, "");
      currentSeverityContext = detectSeverityContext(section);
    }

    const heading = matchNumberedHeading(trimmed);
    if (!heading) continue;

    findings.push(buildSectionFinding(heading, lines, i, currentSeverityContext));
  }
  return findings;
}

/**
 * Strategy 3: Extract from bullet points with actionable language
 * Patterns: "- Fix ...", "- Add ...", "- Remove ...", etc.
 */
const ACTION_WORDS = new Set([
  "fix", "add", "remove", "refactor", "implement", "create", "update", "replace",
  "migrate", "extract", "split", "optimize", "reduce", "eliminate", "address",
  "resolve", "handle", "validate", "enforce", "prevent", "secure", "enable",
  "disable", "deprecate", "cleanup", "simplify", "improve"
]);

function isActionableBullet(trimmed) {
  const bulletMatch = trimmed.match(/^\s*[-*+]\s+(?:\[ \]\s+)?(\S+)/);
  if (!bulletMatch) return false;
  return ACTION_WORDS.has(bulletMatch[1].toLowerCase());
}

function extractFromBullets(lines, reportConfig) {
  const findings = [];

  let currentSection = "";
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track code blocks to skip them
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Track section context
    if (/^#{1,4}\s/.test(trimmed)) {
      currentSection = trimmed.replace(/^#+\s*/, "");
    }

    // Skip completed items
    if (isCompleted(trimmed)) continue;

    // Match actionable bullets
    if (isActionableBullet(trimmed)) {
      const text = trimmed
        .replace(/^\s*[-*+]\s+(?:\[ \]\s+)?/, "")
        .replaceAll("`", "")
        .trim();

      if (text.length > 15) {
        let filePath = extractFilePath(trimmed);
        const nextLine = lines[i + 1] || "";
        if (!filePath && nextLine && !/^\s*[-*+#]/.test(nextLine)) {
          filePath = extractFilePath(nextLine);
        }
        const lineNum = extractLineNumber(trimmed);

        findings.push({
          title: text.substring(0, 200),
          file: filePath,
          line: lineNum,
          sectionContext: currentSection,
          rawText: trimmed,
        });
      }
    }
  }
  return findings;
}

// --- Main extraction for a single report ---

function extractReport(reportPath, reportName, config, seq, today) {
  let content;
  try {
    content = fs.readFileSync(reportPath, "utf8").replaceAll("\uFEFF", "");
  } catch {
    return { findings: [], seq };
  }

  const lines = content.split(/\r?\n/);
  const rawFindings = [];

  // Run all three strategies
  const tableFindings = extractFromTables(lines, config);
  const sectionFindings = extractFromSections(lines, config);
  const bulletFindings = extractFromBullets(lines, config);

  // Merge with dedup by title similarity
  const seenTitles = new Set();

  function addFinding(finding) {
    const normalizedTitle = finding.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 60);
    const normalizedFile = (finding.file || "").replace(/^\.\//, "").replace(/^\//, "").toLowerCase();
    const key = `${normalizedTitle}|${normalizedFile}|${finding.line || 0}`;
    if (seenTitles.has(key)) return;
    seenTitles.add(key);
    rawFindings.push(finding);
  }

  // Tables first (most structured), then sections, then bullets
  for (const f of tableFindings) addFinding(f);
  for (const f of sectionFindings) addFinding(f);
  for (const f of bulletFindings) addFinding(f);

  // Build TDMS items
  const findings = [];
  for (const raw of rawFindings) {
    const category = detectCategory(raw.title + " " + (raw.description || ""), config.category);
    const severity = detectSeverity(
      raw.title + " " + (raw.description || ""),
      raw.severityContext || raw.sectionContext || ""
    );

    const item = {
      id: `INTAKE-REPORT-${String(seq).padStart(4, "0")}`,
      source_id: `dec-2025-report:${reportName}:${seq}`,
      source_file: `docs/archive/2025-dec-reports/${reportName}`,
      category,
      severity,
      type: config.type || "tech-debt",
      file: raw.file || "",
      line: raw.line || 0,
      title: raw.title,
      description:
        raw.description || `Finding from ${config.description}: ${raw.title.substring(0, 100)}`,
      recommendation: `Review and address finding from ${reportName}.`,
      effort: "E1",
      status: "NEW",
      roadmap_ref: null,
      created: today,
      verified_by: null,
      resolution: null,
    };
    item.content_hash = generateContentHash(item);
    findings.push(item);
    seq++;
  }

  return { findings, seq };
}

// --- Report processing helpers ---

/**
 * Check if a report config should be skipped and log the reason.
 * Returns true if the report should not be processed.
 */
function shouldSkipReport(reportName, config) {
  if (!config) {
    console.log(`   ⏭  ${reportName} — no config, skipping`);
    return true;
  }
  if (config.skip) {
    console.log(`   ⏭  ${reportName} — marked skip (${config.description})`);
    return true;
  }
  if (config.lowYield) {
    console.log(`   📄 ${reportName.padEnd(42)} skipped (low-yield: ${config.description})`);
    return true;
  }
  return false;
}

/**
 * Process a single report: extract, dedup, log, and return results.
 */
function processReport(reportName, config, nextSeq, today, existingHashes, verbose) {
  const reportPath = path.join(REPORTS_DIR, reportName);
  const { findings, seq: newSeq } = extractReport(reportPath, reportName, config, nextSeq, today);

  const newFindings = findings.filter((f) => !existingHashes.has(f.content_hash));
  const dupCount = findings.length - newFindings.length;

  console.log(
    `   📋 ${reportName.padEnd(42)} extracted: ${String(findings.length).padStart(3)}  new: ${String(newFindings.length).padStart(3)}  dups: ${String(dupCount).padStart(3)}`
  );

  if (verbose) {
    logVerboseFindings(newFindings);
  }

  return { newFindings, dupCount, newSeq };
}

/**
 * Log detailed information about extracted findings.
 */
function logVerboseFindings(findings) {
  for (const item of findings) {
    console.log(`      ${item.id}: [${item.severity}] ${item.title.substring(0, 80)}`);
    if (item.file) console.log(`        → ${item.file}:${item.line}`);
  }
}

/**
 * Count occurrences of a field value across an array of objects.
 */
function countByField(items, field) {
  const counts = {};
  for (const item of items) {
    counts[item[field]] = (counts[item[field]] || 0) + 1;
  }
  return counts;
}

/**
 * Print summary statistics: totals, category breakdown, severity breakdown.
 */
function printSummary(allFindings, totalSkipped) {
  console.log("\n   ─────────────────────────────────────────");
  console.log(`   Total extracted:    ${allFindings.length + totalSkipped}`);
  console.log(`   Already in MASTER:  ${totalSkipped}`);
  console.log(`   New to ingest:      ${allFindings.length}`);

  const catCounts = countByField(allFindings, "category");
  if (Object.keys(catCounts).length > 0) {
    console.log("\n   By category:");
    for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`     ${cat.padEnd(25)} ${count}`);
    }
  }

  const sevCounts = countByField(allFindings, "severity");
  if (Object.keys(sevCounts).length > 0) {
    console.log("\n   By severity:");
    for (const sev of ["S0", "S1", "S2", "S3"]) {
      if (sevCounts[sev]) console.log(`     ${sev}: ${sevCounts[sev]}`);
    }
  }
}

/**
 * Read all markdown report files from the reports directory.
 */
function readReportFiles() {
  try {
    return fs
      .readdirSync(REPORTS_DIR)
      .filter((f) => f.endsWith(".md"))
      .sort();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`   Error reading reports directory: ${msg}`);
    process.exit(1);
  }
}

/**
 * Compute the next sequence number from existing intake IDs.
 */
function computeNextSeq(existingIntakeIds, prefix) {
  let nextSeq = 1;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const id of existingIntakeIds) {
    const match = id.match(new RegExp(`${escapedPrefix}(\\d+)`));
    if (match) nextSeq = Math.max(nextSeq, Number.parseInt(match[1], 10) + 1);
  }
  return nextSeq;
}

// --- Report loop and output helpers ---

/**
 * Iterate over all report files, extract findings, and accumulate results.
 */
function processAllReports(reportFiles, existingHashes, existingIntakeIds, verbose) {
  let nextSeq = computeNextSeq(existingIntakeIds, "INTAKE-REPORT-");
  const today = new Date().toISOString().split("T")[0];
  const allFindings = [];
  let totalSkipped = 0;

  for (const reportName of reportFiles) {
    const config = REPORT_CONFIG[reportName];
    if (shouldSkipReport(reportName, config)) continue;

    const result = processReport(reportName, config, nextSeq, today, existingHashes, verbose);
    nextSeq = result.newSeq;
    totalSkipped += result.dupCount;
    allFindings.push(...result.newFindings);
  }

  return { allFindings, totalSkipped };
}

/**
 * Write findings to the output JSONL file.
 */
function writeFindings(findings) {
  const jsonlContent = findings.map((f) => JSON.stringify(f)).join("\n") + "\n";
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.appendFileSync(OUTPUT_FILE, jsonlContent, "utf-8");
  console.log(
    `\n   Appended ${findings.length} items to ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`
  );
}

// --- Main ---

function main() {
  const args = new Set(process.argv.slice(2));
  const writeMode = args.has("--write");
  const verbose = args.has("--verbose");
  const dryRun = !writeMode;

  console.log("\nExtract Dec 2025 Audit Report Findings (Step 0b)");
  console.log(`   Mode: ${dryRun ? "DRY RUN (use --write to save)" : "WRITE"}`);

  // Load existing data for dedup
  const existingHashes = loadExistingHashes();
  const existingOutputHashes = loadExistingOutputHashes();
  for (const h of existingOutputHashes) existingHashes.add(h);
  const existingIntakeIds = loadExistingIntakeIds();
  console.log(`   Existing MASTER_DEBT hashes: ${existingHashes.size}`);
  console.log(`   Existing intake items: ${existingIntakeIds.size}`);

  const reportFiles = readReportFiles();
  console.log(`\n   Processing ${reportFiles.length} reports...\n`);

  const { allFindings, totalSkipped } = processAllReports(reportFiles, existingHashes, existingIntakeIds, verbose);

  printSummary(allFindings, totalSkipped);

  if (dryRun) {
    console.log(
      `\n   DRY RUN complete. Use --write to append to ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`
    );
    return;
  }

  writeFindings(allFindings);
}

main();
