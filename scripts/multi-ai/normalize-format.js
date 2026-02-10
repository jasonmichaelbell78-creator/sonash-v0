#!/usr/bin/env node
/**
 * Multi-AI Format Normalizer
 *
 * Converts ANY input format to normalized JSONL array.
 * Handles: JSONL, JSON arrays, markdown tables, headed sections,
 * numbered lists, fenced code blocks, and plain text.
 *
 * @example
 *   import { normalizeFormat, detectFormat } from './normalize-format.js';
 *   const { findings, report } = normalizeFormat(rawInput, 'security');
 */

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, resolve, relative, isAbsolute, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");

/**
 * Validate that a user-provided file path is contained within the project root.
 * Uses path.relative() instead of startsWith() for cross-platform correctness.
 * Prevents path traversal attacks (CWE-22, OWASP A01:2021 Broken Access Control).
 * @param {string} inputPath - User-provided file path from CLI args
 * @param {string} root - Project root to validate against
 * @returns {string} - Resolved absolute path (safe to use)
 */
function validateContainedPath(inputPath, root) {
  const resolved = resolve(inputPath);
  const rel = relative(root, resolved);
  // Reject if: relative path escapes root (..), is empty (equals root), or is absolute (different drive on Windows)
  if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || isAbsolute(rel)) {
    console.error(`Error: path "${inputPath}" resolves outside the project root.`);
    console.error(`  Resolved: ${resolved}`);
    console.error(`  Project root: ${root}`);
    process.exit(1);
  }
  return resolved;
}

// Format type constants
const FORMAT_TYPES = {
  JSONL: "jsonl",
  JSON_ARRAY: "json_array",
  FENCED_JSON: "fenced_json",
  FENCED_JSONL: "fenced_jsonl",
  MARKDOWN_TABLE: "markdown_table",
  NUMBERED_LIST: "numbered_list",
  HEADED_SECTIONS: "headed_sections",
  PLAIN_TEXT: "plain_text",
};

// Column name variations for markdown table parsing
const COLUMN_MAPPINGS = {
  // Title variations
  title: ["title", "finding", "issue", "name", "problem", "description"],
  // Severity variations
  severity: ["severity", "risk", "priority", "level", "sev", "criticality"],
  // Effort variations
  effort: ["effort", "time", "estimate", "hours", "work", "cost"],
  // Files variations
  files: ["file", "files", "path", "location", "paths", "affected"],
  // Description variations
  why_it_matters: ["description", "details", "issue", "problem", "impact", "why", "reason"],
  // Fix variations
  suggested_fix: ["fix", "solution", "recommendation", "action", "remediation", "how"],
  // Confidence variations
  confidence: ["confidence", "score", "certainty", "probability"],
  // Category variations
  category: ["category", "type", "area", "domain", "subcategory"],
  // Fingerprint/ID variations
  fingerprint: ["id", "fingerprint", "finding_id", "canonical_id", "ref"],
};

// Severity value mappings
const SEVERITY_MAPPINGS = {
  // Standard
  S0: "S0",
  S1: "S1",
  S2: "S2",
  S3: "S3",
  // Alternative labels
  critical: "S0",
  high: "S1",
  medium: "S2",
  med: "S2",
  low: "S3",
  info: "S3",
  // Numeric
  0: "S0",
  1: "S1",
  2: "S2",
  3: "S3",
};

// Effort value mappings
const EFFORT_MAPPINGS = {
  // Standard
  E0: "E0",
  E1: "E1",
  E2: "E2",
  E3: "E3",
  // Alternative labels
  minutes: "E0",
  trivial: "E0",
  quick: "E0",
  hours: "E1",
  hour: "E1",
  day: "E2",
  days: "E2",
  week: "E3",
  weeks: "E3",
  // Size labels
  xs: "E0",
  s: "E1",
  m: "E2",
  l: "E3",
  xl: "E3",
};

/**
 * Detect the format of input text
 * @param {string} input - Raw input text
 * @returns {string} - Format type constant
 */
export function detectFormat(input) {
  if (!input || typeof input !== "string") {
    return FORMAT_TYPES.PLAIN_TEXT;
  }

  const trimmed = input.trim();

  // Check for fenced code blocks first
  if (/```jsonl?\s*\n/i.test(trimmed)) {
    const match = trimmed.match(/```(json|jsonl)\s*\n([\s\S]*?)```/i);
    if (match) {
      const content = match[2].trim();
      // Check if content inside is JSONL or JSON array
      if (content.startsWith("[")) {
        return FORMAT_TYPES.FENCED_JSON;
      }
      return FORMAT_TYPES.FENCED_JSONL;
    }
  }

  // Check for JSON array (starts with [)
  if (trimmed.startsWith("[")) {
    try {
      JSON.parse(trimmed);
      return FORMAT_TYPES.JSON_ARRAY;
    } catch (err) {
      // Not valid JSON array, continue checking other formats
      if (process.env.VERBOSE)
        console.warn(`Warning: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Check for JSONL (each non-empty line is valid JSON object, or wrapped JSON objects)
  const lines = trimmed.split("\n").filter((l) => l.trim());
  if (lines.length > 0 && lines[0].trim().startsWith("{")) {
    const validJsonLines = lines.filter((line) => {
      try {
        const parsed = JSON.parse(line.trim());
        return typeof parsed === "object" && !Array.isArray(parsed);
      } catch (err) {
        // Expected for non-JSON lines during format detection
        if (process.env.VERBOSE)
          console.warn(`Warning: ${err instanceof Error ? err.message : String(err)}`);
        return false;
      }
    });
    // If >50% are valid JSON objects, treat as JSONL
    if (validJsonLines.length / lines.length > 0.5) {
      return FORMAT_TYPES.JSONL;
    }

    // Check for wrapped JSONL: lines that start with { but don't individually
    // parse. Use stateful brace-depth tracking (handles strings spanning lines)
    // to see if objects reconstruct properly.
    if (validJsonLines.length === 0 || validJsonLines.length / lines.length <= 0.5) {
      const reconstructed = countReconstructableObjects(lines);
      // If we can reconstruct 2+ objects, treat as wrapped JSONL
      if (reconstructed >= 2) {
        return FORMAT_TYPES.JSONL;
      }
    }
  }

  // Check for markdown table (has | and header separator ---)
  if (trimmed.includes("|")) {
    const tableMatch = trimmed.match(/\|[^\n]+\|\s*\n\|[-:\s|]+\|\s*\n/);
    if (tableMatch) {
      return FORMAT_TYPES.MARKDOWN_TABLE;
    }
  }

  // Check for headed sections (### or ## headers)
  if (/^#{2,4}\s+/m.test(trimmed)) {
    // Must have multiple sections with structured content
    const sectionCount = (trimmed.match(/^#{2,4}\s+/gm) || []).length;
    if (sectionCount >= 2) {
      return FORMAT_TYPES.HEADED_SECTIONS;
    }
  }

  // Check for numbered list
  if (/^\d+\.\s+/m.test(trimmed)) {
    const numberedItems = (trimmed.match(/^\d+\.\s+/gm) || []).length;
    if (numberedItems >= 2) {
      return FORMAT_TYPES.NUMBERED_LIST;
    }
  }

  return FORMAT_TYPES.PLAIN_TEXT;
}

/**
 * Parse JSONL format, including paragraph-wrapped JSON objects.
 *
 * External AIs sometimes output JSON objects that span multiple lines
 * due to markdown rendering or line-wrapping. This parser handles both
 * clean one-per-line JSONL and wrapped objects by tracking brace depth
 * AND string-escape state across lines.
 *
 * @param {string} input - JSONL content (possibly wrapped)
 * @returns {{ findings: object[], errors: string[] }}
 */
function parseJsonl(input) {
  const findings = [];
  const errors = [];

  const lines = input.split("\n");

  let accumulator = "";
  let accStartLine = -1;
  // Stateful brace tracker — persists across lines within one object
  let tracker = createBraceTracker();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("//") || line.startsWith("#")) continue;

    // Skip markdown code fences (common in AI-generated output)
    if (line.startsWith("```")) continue;

    // Fast path: try parsing the line as a complete JSON object
    if (!accumulator && line.startsWith("{")) {
      try {
        const parsed = JSON.parse(line);
        if (typeof parsed === "object" && !Array.isArray(parsed)) {
          findings.push(parsed);
          continue;
        }
      } catch (_) {
        // Not a complete JSON object on this line — fall through to accumulator
      }
    }

    // Accumulate wrapped lines by tracking brace depth with string state
    if (!accumulator && line.startsWith("{")) {
      accumulator = line;
      accStartLine = i + 1;
      tracker = createBraceTracker();
      tracker.feed(line);
    } else if (accumulator) {
      accumulator += " " + line;
      tracker.feed(line);
    } else {
      // Non-JSON line outside an accumulation — skip
      continue;
    }

    // When braces balance (outside strings), try to parse
    if (tracker.depth === 0) {
      try {
        const parsed = JSON.parse(accumulator);
        if (typeof parsed === "object" && !Array.isArray(parsed)) {
          findings.push(parsed);
        } else {
          errors.push(`Lines ${accStartLine}-${i + 1}: Not a JSON object`);
        }
      } catch (error) {
        errors.push(
          `Lines ${accStartLine}-${i + 1}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      accumulator = "";
      accStartLine = -1;
      tracker = createBraceTracker();
    }
  }

  // Handle unterminated accumulation
  if (accumulator) {
    errors.push(`Lines ${accStartLine}+: Unterminated JSON object (unbalanced braces)`);
  }

  return { findings, errors };
}

/**
 * Create a stateful brace-depth tracker that correctly handles JSON strings
 * spanning multiple lines. Call feed() for each line — state persists across calls.
 *
 * @returns {{ feed: (str: string) => void, depth: number }}
 */
function createBraceTracker() {
  let depth = 0;
  let inString = false;
  let escaped = false;

  return {
    get depth() {
      return depth;
    },
    feed(str) {
      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (inString && ch === "\\") {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          inString = !inString;
          continue;
        }
        if (!inString) {
          if (ch === "{") depth++;
          else if (ch === "}") {
            depth--;
            if (depth < 0) depth = 0;
          }
        }
      }
    },
  };
}

/**
 * Count reconstructable JSON objects using stateful brace tracking.
 * Used by detectFormat() to identify wrapped JSONL.
 * @param {string[]} lines - Non-empty trimmed lines
 * @returns {number} - Number of complete JSON objects found
 */
function countReconstructableObjects(lines) {
  let reconstructed = 0;
  let inObj = false;
  let tracker = createBraceTracker();

  for (const line of lines) {
    const t = line.trim();
    if (!inObj && t.startsWith("{")) {
      inObj = true;
      tracker = createBraceTracker();
      tracker.feed(t);
    } else if (inObj) {
      tracker.feed(t);
    }
    if (inObj && tracker.depth === 0) {
      reconstructed++;
      inObj = false;
    }
  }
  return reconstructed;
}

/**
 * Parse JSON array format
 * @param {string} input - JSON array content
 * @returns {{ findings: object[], errors: string[] }}
 */
function parseJsonArray(input) {
  const errors = [];

  try {
    const parsed = JSON.parse(input.trim());
    if (!Array.isArray(parsed)) {
      return { findings: [], errors: ["Input is not a JSON array"] };
    }

    const findings = parsed.filter((item, i) => {
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        return true;
      }
      errors.push(`Item ${i}: Not a valid finding object`);
      return false;
    });

    return { findings, errors };
  } catch (error) {
    return {
      findings: [],
      errors: [`JSON parse error: ${error instanceof Error ? error.message : String(error)}`],
    };
  }
}

/**
 * Parse fenced code block (extract and recurse)
 * @param {string} input - Content with fenced code blocks
 * @param {string} category - Category for findings
 * @returns {{ findings: object[], errors: string[] }}
 */
function parseFencedBlock(input, category) {
  // Extract content from code fences
  const match = input.match(/```(?:json|jsonl)?\s*\n([\s\S]*?)```/i);
  if (!match) {
    return { findings: [], errors: ["No fenced code block found"] };
  }

  const content = match[1].trim();

  // Detect inner format and parse
  const innerFormat = detectFormat(content);

  switch (innerFormat) {
    case FORMAT_TYPES.JSON_ARRAY:
      return parseJsonArray(content);
    case FORMAT_TYPES.JSONL:
      return parseJsonl(content);
    default: {
      // Try both
      const jsonResult = parseJsonArray(content);
      if (jsonResult.findings.length > 0) return jsonResult;
      return parseJsonl(content);
    }
  }
}

/**
 * Map a column header to a canonical field name
 * @param {string} header - Column header text
 * @returns {string|null} - Canonical field name or null
 */
function mapColumnToField(header) {
  const normalized = header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");

  for (const [field, variations] of Object.entries(COLUMN_MAPPINGS)) {
    for (const variant of variations) {
      if (normalized === variant || normalized.includes(variant)) {
        return field;
      }
    }
  }

  return null;
}

/**
 * Parse markdown table format
 * @param {string} input - Markdown table content
 * @param {string} category - Category for findings
 * @returns {{ findings: object[], errors: string[] }}
 */
function parseMarkdownTable(input, category) {
  const findings = [];
  const errors = [];

  // Split into lines
  const lines = input.split("\n");

  // Find table start (header row)
  let headerIndex = -1;
  let headers = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("|") && line.endsWith("|")) {
      // Check if next line is separator
      const nextLine = lines[i + 1]?.trim() || "";
      if (/^\|[-:\s|]+\|$/.test(nextLine)) {
        headerIndex = i;
        // Parse headers
        headers = line
          .split("|")
          .slice(1, -1) // Remove empty first/last from split
          .map((h) => h.trim());
        break;
      }
    }
  }

  if (headerIndex === -1) {
    return { findings: [], errors: ["No valid markdown table found"] };
  }

  // Map headers to fields
  const fieldMap = headers.map((h) => mapColumnToField(h));

  // Parse data rows (skip header and separator)
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) continue;
    if (line.includes("---")) continue; // Skip separator lines

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());

    if (cells.length < 2) continue;

    const finding = { category };

    // Map cells to fields
    for (let j = 0; j < cells.length && j < fieldMap.length; j++) {
      const field = fieldMap[j];
      const value = cells[j];

      if (!field || !value || value === "-" || value === "N/A") continue;

      // Handle special fields
      if (field === "files") {
        finding.files = parseFileList(value);
      } else if (field === "severity") {
        finding.severity = normalizeSeverity(value);
      } else if (field === "effort") {
        finding.effort = normalizeEffort(value);
      } else if (field === "confidence") {
        finding.confidence = normalizeConfidence(value);
      } else {
        finding[field] = value;
      }
    }

    // Only add if we have at least a title
    if (finding.title) {
      findings.push(finding);
    } else if (finding.why_it_matters) {
      // Use description as title if no explicit title
      finding.title = finding.why_it_matters.substring(0, 100);
      findings.push(finding);
    } else {
      errors.push(`Row ${i + 1}: No title or description found`);
    }
  }

  return { findings, errors };
}

/**
 * Parse headed sections format (### Finding Title)
 * @param {string} input - Content with headed sections
 * @param {string} category - Category for findings
 * @returns {{ findings: object[], errors: string[] }}
 */
function parseHeadedSections(input, category) {
  const findings = [];
  const errors = [];

  // Split by section headers
  const sections = input.split(/(?=^#{2,4}\s+)/m).filter((s) => s.trim());

  for (const section of sections) {
    // Extract header
    const headerMatch = section.match(/^#{2,4}\s+(.+?)(?:\n|$)/);
    if (!headerMatch) continue;

    const headerText = headerMatch[1].trim();
    const body = section.substring(headerMatch[0].length).trim();

    // Parse header for ID and title
    // Formats: "### SEC-001: Title" or "### Title" or "### [Category] Title"
    let id = null;
    let title = headerText;

    const idMatch = headerText.match(/^([A-Z]+-\d+)\s*[:.-]\s*(.+)/);
    if (idMatch) {
      id = idMatch[1];
      title = idMatch[2].trim();
    }

    const categoryMatch = headerText.match(/^\[([^\]]+)\]\s*(.+)/);
    if (categoryMatch) {
      // Use extracted category if present
      title = categoryMatch[2].trim();
    }

    const finding = {
      title,
      category,
    };

    if (id) finding.fingerprint = id;

    // Extract fields from body using **Field:** pattern
    const fieldPatterns = [
      { pattern: /\*\*Severity\*\*:\s*(\S+)/i, field: "severity", normalize: normalizeSeverity },
      { pattern: /\*\*Effort\*\*:\s*(\S+)/i, field: "effort", normalize: normalizeEffort },
      {
        pattern: /\*\*Confidence\*\*:\s*(\S+)/i,
        field: "confidence",
        normalize: normalizeConfidence,
      },
      { pattern: /\*\*File(?:s)?\*\*:\s*(.+?)(?:\n|$)/i, field: "files", normalize: parseFileList },
      {
        pattern: /\*\*(?:Description|Details|Issue)\*\*:\s*(.+?)(?:\n\*\*|\n#{2,}|$)/is,
        field: "why_it_matters",
      },
      {
        pattern: /\*\*(?:Fix|Solution|Recommendation|Action)\*\*:\s*(.+?)(?:\n\*\*|\n#{2,}|$)/is,
        field: "suggested_fix",
      },
      { pattern: /\*\*Category\*\*:\s*(.+?)(?:\n|$)/i, field: "subcategory" },
      { pattern: /\*\*CANON-ID\*\*:\s*(CANON-\d+|LEGACY-\d+)/i, field: "fingerprint" },
    ];

    for (const { pattern, field, normalize } of fieldPatterns) {
      const match = body.match(pattern);
      if (match) {
        const value = match[1].trim();
        finding[field] = normalize ? normalize(value) : value;
      }
    }

    // If no explicit description, use remaining body text
    if (!finding.why_it_matters) {
      // Get text that's not in a field
      const cleanBody = body
        .replace(/\*\*[^*]+\*\*:\s*[^\n]+/g, "")
        .replace(/^[-*]\s+/gm, "")
        .trim();

      if (cleanBody) {
        finding.why_it_matters = cleanBody.substring(0, 500);
      }
    }

    if (finding.title) {
      findings.push(finding);
    } else {
      errors.push(`Section: Missing title`);
    }
  }

  return { findings, errors };
}

/**
 * Parse numbered list format
 * @param {string} input - Numbered list content
 * @param {string} category - Category for findings
 * @returns {{ findings: object[], errors: string[] }}
 */
function parseNumberedList(input, category) {
  const findings = [];
  const errors = [];

  // Split by numbered items
  const items = input.split(/(?=^\d+\.\s+)/m).filter((s) => s.trim());

  for (const item of items) {
    const match = item.match(/^\d+\.\s+(.+)/s);
    if (!match) continue;

    const content = match[1].trim();

    // Extract title (bold text or first sentence)
    let title = "";
    let description = content;

    const boldMatch = content.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      title = boldMatch[1].trim();
      description = content.substring(boldMatch[0].length).trim();
    } else {
      // First sentence as title
      const sentenceMatch = content.match(/^([^.!?]+[.!?])/);
      if (sentenceMatch) {
        title = sentenceMatch[1].trim();
        description = content.substring(sentenceMatch[0].length).trim();
      } else {
        title = content.substring(0, 80);
      }
    }

    const finding = {
      title: title.replace(/[*_`]/g, ""), // Clean markdown
      category,
    };

    // Extract severity/effort from parentheses: (S1, E1) or (High, 2 hours)
    const parenMatch = content.match(/\(([^)]+)\)/);
    if (parenMatch) {
      const parenContent = parenMatch[1];

      // Look for severity
      const sevMatch = parenContent.match(/\b(S[0-3]|critical|high|medium|low)\b/i);
      if (sevMatch) {
        finding.severity = normalizeSeverity(sevMatch[1]);
      }

      // Look for effort
      const effMatch = parenContent.match(/\b(E[0-3]|\d+\s*(?:hour|day|week|minute)s?)\b/i);
      if (effMatch) {
        finding.effort = normalizeEffort(effMatch[1]);
      }
    }

    // Extract file reference: - file.ts:23 or `file.ts:23`
    const fileMatch = content.match(/[-–]\s*`?([^\s`]+\.[a-z]+(?::\d+)?)`?/i);
    if (fileMatch) {
      finding.files = parseFileList(fileMatch[1]);
    }

    // Use remaining description
    if (description) {
      finding.why_it_matters = description
        .replace(/\([^)]*\)/g, "") // Remove parentheticals already parsed
        .replace(/[-–]\s*`?[^\s`]+\.[a-z]+(?::\d+)?`?/gi, "") // Remove file refs
        .trim()
        .substring(0, 500);
    }

    if (finding.title) {
      findings.push(finding);
    }
  }

  return { findings, errors };
}

/**
 * Parse plain text (last resort - extract what we can)
 * @param {string} input - Plain text content
 * @param {string} category - Category for findings
 * @returns {{ findings: object[], errors: string[] }}
 */
function parsePlainText(input, category) {
  const findings = [];
  const errors = ["Plain text detected - extraction may be incomplete"];

  // Try to find any structured patterns
  const lines = input.split("\n").filter((l) => l.trim());

  // Look for lines that might be findings
  for (const line of lines) {
    const trimmed = line.trim();

    // Skip very short lines
    if (trimmed.length < 20) continue;

    // Look for patterns like "Issue: X" or "Finding: X"
    const issueMatch = trimmed.match(/^(?:issue|finding|problem|bug|vuln\w*)\s*[:.-]\s*(.+)/i);
    if (issueMatch) {
      findings.push({
        title: issueMatch[1].substring(0, 100),
        category,
        confidence: 40, // Low confidence for plain text extraction
      });
    }
  }

  // If we found nothing, create a single finding with all content
  if (findings.length === 0 && input.length > 50) {
    findings.push({
      title: "Extracted finding (review needed)",
      why_it_matters: input.substring(0, 1000),
      category,
      confidence: 30,
      extraction_method: "plain-text-fallback",
    });
    errors.push("Could not parse structure - created single finding for review");
  }

  return { findings, errors };
}

/**
 * Normalize severity value to S0-S3
 * @param {string} value - Raw severity value
 * @returns {string} - Normalized severity
 */
function normalizeSeverity(value) {
  if (!value) return "S2";

  const normalized = String(value).toLowerCase().trim();

  // Check direct mappings
  for (const [key, mapped] of Object.entries(SEVERITY_MAPPINGS)) {
    if (normalized === String(key).toLowerCase()) {
      return mapped;
    }
  }

  // Check if already in correct format
  if (/^S[0-3]$/i.test(normalized)) {
    return normalized.toUpperCase();
  }

  return "S2"; // Default
}

/**
 * Normalize effort value to E0-E3
 * @param {string} value - Raw effort value
 * @returns {string} - Normalized effort
 */
function normalizeEffort(value) {
  if (!value) return "E1";

  const normalized = String(value).toLowerCase().trim();

  // Check direct mappings
  for (const [key, mapped] of Object.entries(EFFORT_MAPPINGS)) {
    if (
      normalized === String(key).toLowerCase() ||
      normalized.includes(String(key).toLowerCase())
    ) {
      return mapped;
    }
  }

  // Check if already in correct format
  if (/^E[0-3]$/i.test(normalized)) {
    return normalized.toUpperCase();
  }

  return "E1"; // Default
}

/**
 * Normalize confidence to 0-100 number
 * @param {string|number} value - Raw confidence value
 * @returns {number} - Normalized confidence
 */
function normalizeConfidence(value) {
  if (value === undefined || value === null) return 70;

  // Already a number in range
  if (typeof value === "number") {
    if (value >= 0 && value <= 100) return Math.round(value);
    if (value >= 0 && value <= 1) return Math.round(value * 100);
  }

  const str = String(value).toLowerCase().trim();

  // Word values
  if (str === "high" || str === "certain") return 90;
  if (str === "medium" || str === "moderate") return 70;
  if (str === "low" || str === "uncertain") return 50;

  // Percentage string
  const pctMatch = str.match(/(\d+)%?/);
  if (pctMatch) {
    const num = Number.parseInt(pctMatch[1], 10);
    if (num >= 0 && num <= 100) return num;
  }

  return 70; // Default
}

/**
 * Parse file list from string
 * @param {string} value - File reference string
 * @returns {string[]} - Array of file paths
 */
function parseFileList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  const str = String(value);

  // Split by common separators
  const parts = str.split(/[,;\n]+/).map((p) => p.trim().replace(/^`|`$/g, ""));

  // Filter to valid-looking file paths
  return parts.filter((p) => {
    if (!p) return false;
    return p.includes("/") || p.includes("\\") || /^[a-zA-Z]:\\/.test(p) || /\.\w+/.test(p);
  });
}

/**
 * Main normalization function
 * @param {string} input - Raw input text (any format)
 * @param {string} category - Category for findings
 * @returns {{ findings: object[], report: object }}
 */
export function normalizeFormat(input, category = "general") {
  const startTime = Date.now();
  const format = detectFormat(input);

  let result;

  switch (format) {
    case FORMAT_TYPES.JSONL:
      result = parseJsonl(input);
      break;
    case FORMAT_TYPES.JSON_ARRAY:
      result = parseJsonArray(input);
      break;
    case FORMAT_TYPES.FENCED_JSON:
    case FORMAT_TYPES.FENCED_JSONL:
      result = parseFencedBlock(input, category);
      break;
    case FORMAT_TYPES.MARKDOWN_TABLE:
      result = parseMarkdownTable(input, category);
      break;
    case FORMAT_TYPES.HEADED_SECTIONS:
      result = parseHeadedSections(input, category);
      break;
    case FORMAT_TYPES.NUMBERED_LIST:
      result = parseNumberedList(input, category);
      break;
    case FORMAT_TYPES.PLAIN_TEXT:
    default:
      result = parsePlainText(input, category);
  }

  // Ensure all findings have category
  for (const finding of result.findings) {
    if (!finding.category) {
      finding.category = category;
    }
  }

  const report = {
    format_detected: format,
    input_length: input.length,
    findings_count: result.findings.length,
    errors_count: result.errors.length,
    errors: result.errors,
    processing_time_ms: Date.now() - startTime,
  };

  return {
    findings: result.findings,
    report,
  };
}

/**
 * Process input from file or stdin
 * @param {string} inputPath - Path to input file
 * @param {string} outputPath - Path to output JSONL file
 * @param {string} category - Category for findings
 */
export function processFile(inputPath, outputPath, category) {
  let input;
  try {
    input = readFileSync(inputPath, "utf-8");
  } catch (error) {
    console.error(`Error reading input: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  const { findings, report } = normalizeFormat(input, category);

  // Write output
  const jsonl = findings.map((f) => JSON.stringify(f)).join("\n");
  writeFileSync(outputPath, jsonl);

  // Print report
  console.log(`\n=== Format Normalization Report ===`);
  console.log(`Format detected: ${report.format_detected}`);
  console.log(`Input size: ${report.input_length} chars`);
  console.log(`Findings extracted: ${report.findings_count}`);
  if (report.errors_count > 0) {
    console.log(`Errors: ${report.errors_count}`);
    for (const err of report.errors.slice(0, 5)) {
      console.log(`  - ${err}`);
    }
    if (report.errors.length > 5) {
      console.log(`  ... and ${report.errors.length - 5} more`);
    }
  }
  console.log(`Output: ${outputPath}`);
  console.log(`Processing time: ${report.processing_time_ms}ms`);
}

// Export format types for external use
export { FORMAT_TYPES };

// CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Usage: node normalize-format.js <input-file> <output-file> [category]");
    console.log("");
    console.log("Normalizes any input format to JSONL.");
    console.log(
      "Supported formats: JSONL, JSON array, markdown table, numbered list, headed sections"
    );
    console.log("");
    console.log("Example:");
    console.log("  node normalize-format.js raw-findings.txt normalized.jsonl security");
    process.exit(1);
  }

  const [inputPath, outputPath, category = "general"] = args;

  // Validate both paths stay within project root (CWE-22 path traversal prevention)
  const safeInputPath = validateContainedPath(inputPath, REPO_ROOT);
  const safeOutputPath = validateContainedPath(outputPath, REPO_ROOT);

  if (!existsSync(safeInputPath)) {
    console.error(`Input file not found: ${safeInputPath}`);
    process.exit(1);
  }

  processFile(safeInputPath, safeOutputPath, category);
}
