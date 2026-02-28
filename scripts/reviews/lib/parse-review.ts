/**
 * Markdown-to-v2-record parser for review archives.
 *
 * Handles all observed archive formats:
 * - Heading-based: #### Review #N: Title (YYYY-MM-DD)
 * - Em-dash variant: #### Review #N -- Title (YYYY-MM-DD)
 * - Table-only: | #N | date | title | (REVIEWS_101-136.md)
 *
 * Exports: parseArchiveFile, parseTableArchive, toV2ReviewRecord,
 *          KNOWN_SKIPPED_IDS, KNOWN_DUPLICATE_IDS
 */

import { ReviewRecord, type ReviewRecordType } from "./schemas/review";
import type { CompletenessTierType } from "./schemas/shared";

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface ParsedEntry {
  reviewNumber: number;
  date: string | null;
  title: string;
  rawLines: string[];
  sourceFile: string;
}

// ─── Known IDs ─────────────────────────────────────────────────────────────────

/**
 * Review IDs that were never assigned (numbering skips, batch consolidations).
 * 64 total. Verified via git log -S "#### Review #N".
 * Source: scripts/check-review-archive.js
 */
export const KNOWN_SKIPPED_IDS = new Set<number>([
  41, 64, 65, 66, 67, 68, 69, 70, 71, 80, 83, 84, 85, 86, 90, 91, 117, 118, 119, 120, 157, 158, 159,
  160, 166, 167, 168, 169, 170, 172, 173, 174, 175, 176, 177, 178, 185, 203, 205, 206, 207, 208,
  209, 210, 220, 228, 229, 230, 231, 232, 233, 234, 240, 241, 242, 243, 244, 245, 246, 247, 248,
  323, 335, 349,
]);

/**
 * Review IDs that legitimately appear in two archive files with different content.
 * PR #383 R5-R8 originally assigned these IDs, then different reviews for
 * PRs #384/#389/#394 were also assigned the same numbers.
 */
export const KNOWN_DUPLICATE_IDS = new Set<number>([366, 367, 368, 369]);

// ─── Heading-based parser ──────────────────────────────────────────────────────

/**
 * Parse heading-based review entries from a markdown archive file.
 *
 * Matches headers like:
 *   #### Review #42: Title (2026-01-15)
 *   ### Review #42 -- Title (2026-01-15)
 *   ## Review #42: Title
 *
 * Tracks code fences to avoid matching inside code blocks.
 * Deduplicates within-file by reviewNumber, keeping the entry with the most rawLines.
 */
export function parseArchiveFile(filePath: string, content: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  const lines = content.split("\n");
  let current: ParsedEntry | null = null;
  let inFence = false;

  for (const line of lines) {
    // Track code fences to avoid matching inside code blocks
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      if (current) current.rawLines.push(line);
      continue;
    }
    if (inFence) {
      if (current) current.rawLines.push(line);
      continue;
    }

    // Match review headers: #{2,4} Review #N[:] Title [(YYYY-MM-DD)]
    // Also handles em-dash variant: #### Review #N -- Title
    const headerMatch = line.match(/^#{2,4}\s+Review\s+#(\d+)(?::|\s+--)\s*(.*)/);
    if (headerMatch) {
      if (current) entries.push(current);

      const reviewNumber = Number.parseInt(headerMatch[1], 10);
      const titleAndDate = headerMatch[2].trim();

      // Extract date from end of title: (YYYY-MM-DD)
      const dateMatch = titleAndDate.match(/\((\d{4}-\d{2}-\d{2})\)\s*$/);
      const date = dateMatch ? dateMatch[1] : null;
      const title = dateMatch
        ? titleAndDate.slice(0, titleAndDate.lastIndexOf("(")).trim()
        : titleAndDate;

      // Clean trailing em-dash or colon artifacts from title
      const cleanTitle = title.replace(/\s*--\s*$/, "").replace(/:\s*$/, "");

      current = {
        reviewNumber,
        date,
        title: cleanTitle,
        rawLines: [],
        sourceFile: filePath,
      };
      continue;
    }

    if (current) current.rawLines.push(line);
  }
  if (current) entries.push(current);

  // Deduplicate within-file: keep the entry with the most rawLines content
  return deduplicateEntries(entries);
}

/**
 * Deduplicate entries by reviewNumber, keeping the one with the most content.
 */
function deduplicateEntries(entries: ParsedEntry[]): ParsedEntry[] {
  const byNumber = new Map<number, ParsedEntry[]>();
  for (const entry of entries) {
    const existing = byNumber.get(entry.reviewNumber);
    if (existing) {
      existing.push(entry);
    } else {
      byNumber.set(entry.reviewNumber, [entry]);
    }
  }

  const result: ParsedEntry[] = [];
  for (const copies of byNumber.values()) {
    if (copies.length === 1) {
      result.push(copies[0]);
    } else {
      // Keep the entry with the most content (rawLines joined length)
      const best = copies.reduce((a, b) =>
        a.rawLines.join("\n").length > b.rawLines.join("\n").length ? a : b
      );
      result.push(best);
    }
  }
  return result;
}

// ─── Table-based parser ────────────────────────────────────────────────────────

/**
 * Parse table-format review entries (e.g., REVIEWS_101-136.md).
 *
 * Matches rows like: | #105 | 2026-01-20 | Security review |
 * Produces minimal ParsedEntry objects (stub-tier candidates).
 */
export function parseTableArchive(filePath: string, content: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;

    // Match table rows with review IDs: | #N | or | N |
    const idMatch = trimmed.match(/\|\s*#?(\d+)\s*\|/);
    if (!idMatch) continue;

    const reviewNumber = Number.parseInt(idMatch[1], 10);

    // Skip separator rows and header rows
    const cells = trimmed
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length < 2) continue;
    if (cells[0].startsWith("---") || cells[0].startsWith("ID")) continue;

    // Try to extract date from second column
    let date: string | null = null;
    if (cells.length >= 2) {
      const dateMatch = cells[1].match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) date = dateMatch[1];
    }

    // Try to extract title from third column
    let title = "";
    if (cells.length >= 3) {
      title = cells[2].trim();
    }

    entries.push({
      reviewNumber,
      date,
      title,
      rawLines: [],
      sourceFile: filePath,
    });
  }

  return entries;
}

// ─── Field extractors ──────────────────────────────────────────────────────────

/**
 * Extract PR number from raw markdown content.
 * Looks for: **PR:** #N, PR #N, pr/N
 * Returns null for branch names (non-numeric).
 */
export function extractPR(raw: string): number | null {
  // **PR:** #389
  const boldPR = raw.match(/\*\*PR:?\*\*:?\s*#(\d+)/);
  if (boldPR) return Number.parseInt(boldPR[1], 10);

  // PR #42
  const inlinePR = raw.match(/PR\s*#(\d+)/);
  if (inlinePR) return Number.parseInt(inlinePR[1], 10);

  // pr/42
  const slashPR = raw.match(/pr\/(\d+)/i);
  if (slashPR) return Number.parseInt(slashPR[1], 10);

  return null;
}

/**
 * Extract total item count from raw markdown content.
 * Looks for: **Total:** N, **Items:** N, N total, N items
 */
export function extractTotal(raw: string): number | null {
  // **Total:** 12 or **Items:** 5
  const boldTotal = raw.match(/\*\*(?:Total|Items):?\*\*:?\s*~?(\d+)/i);
  if (boldTotal) return Number.parseInt(boldTotal[1], 10);

  // N total (word boundary to avoid false positives)
  const nTotal = raw.match(/(\d+)\s+total\b/i);
  if (nTotal) return Number.parseInt(nTotal[1], 10);

  // N items
  const nItems = raw.match(/(\d+)\s+items\b/i);
  if (nItems) return Number.parseInt(nItems[1], 10);

  return null;
}

/**
 * Extract a labeled count (fixed, deferred, rejected) from raw markdown.
 * Looks for: **Label:** N, Label: N, Label N
 */
export function extractCount(raw: string, label: string): number | null {
  // **Fixed:** 3 or Fixed: 3
  const boldPattern = new RegExp(`\\*\\*${label}:?\\*\\*:?\\s*~?(\\d+)`, "i");
  const boldMatch = raw.match(boldPattern);
  if (boldMatch) return Number.parseInt(boldMatch[1], 10);

  // Label: N (without bold)
  const colonPattern = new RegExp(`${label}:\\s*~?(\\d+)`, "i");
  const colonMatch = raw.match(colonPattern);
  if (colonMatch) return Number.parseInt(colonMatch[1], 10);

  return null;
}

/**
 * Extract pattern names from bullet lists under **Patterns** or **Key Patterns** sections.
 */
export function extractPatterns(raw: string): string[] {
  const patterns: string[] = [];
  const lines = raw.split("\n");
  let inPatternSection = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detect pattern section headers
    if (
      lower.includes("**patterns**") ||
      lower.includes("**key patterns**") ||
      lower.includes("**patterns:**") ||
      lower.includes("**key patterns:**")
    ) {
      inPatternSection = true;
      // Check for inline patterns after the header (e.g., **Patterns:** foo; bar)
      const inlineMatch = line.match(/\*\*(?:Key\s+)?Patterns?:?\*\*:?\s+(.+)/i);
      if (inlineMatch) {
        const parts = inlineMatch[1]
          .split(/[;,]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        for (const part of parts) {
          if (!patterns.includes(part)) patterns.push(part);
        }
      }
      continue;
    }

    // End pattern section on new section header or horizontal rule
    if (inPatternSection) {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("**") && !trimmed.toLowerCase().includes("pattern")) {
        inPatternSection = false;
        continue;
      }
      if (trimmed.startsWith("---") || /^#{2,4}\s/.test(trimmed)) {
        inPatternSection = false;
        continue;
      }

      // Extract bullet items
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const text = trimmed.replace(/^[-*]\s+/, "").trim();
        if (text.length > 0 && !patterns.includes(text)) {
          patterns.push(text);
        }
      }
    }
  }

  return patterns;
}

/**
 * Extract learnings from bullet lists under **Learnings** or **Key Learnings** sections.
 */
export function extractLearnings(raw: string): string[] {
  const learnings: string[] = [];
  const lines = raw.split("\n");
  let inLearningSection = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detect learning section headers
    if (
      lower.includes("**learnings**") ||
      lower.includes("**key learnings**") ||
      lower.includes("**learnings:**") ||
      lower.includes("**key learnings:**")
    ) {
      inLearningSection = true;
      continue;
    }

    // End section on new section header or horizontal rule
    if (inLearningSection) {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("**") && !trimmed.toLowerCase().includes("learning")) {
        inLearningSection = false;
        continue;
      }
      if (trimmed.startsWith("---") || /^#{2,4}\s/.test(trimmed)) {
        inLearningSection = false;
        continue;
      }

      // Extract bullet items
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const text = trimmed.replace(/^[-*]\s+/, "").trim();
        if (text.length > 0 && !learnings.includes(text)) {
          learnings.push(text);
        }
      }
    }
  }

  return learnings;
}

/**
 * Extract severity breakdown from raw markdown content.
 * Handles both "N LABEL" format (e.g., "2 Critical") and "Label: N" format.
 * Uses string-based parsing to avoid regex backtracking issues.
 */
export function extractSeverity(
  raw: string
): { critical: number; major: number; minor: number; trivial: number } | null {
  const critical = parseSeverityCount(raw, "critical");
  const major = parseSeverityCount(raw, "major");
  const minor = parseSeverityCount(raw, "minor");
  const trivial = parseSeverityCount(raw, "trivial");

  // Return null if no severity data found
  if (critical === 0 && major === 0 && minor === 0 && trivial === 0) {
    return null;
  }

  return { critical, major, minor, trivial };
}

/**
 * Parse a severity count from text using string operations.
 * Supports both "N LABEL" and "Label: N" formats, case-insensitive.
 * Adapted from sync-reviews-to-jsonl.js parseSeverityCount.
 */
function parseSeverityCount(text: string, label: string): number {
  const lowerText = text.toLowerCase();
  const lowerLabel = label.toLowerCase();
  let idx = 0;

  while (idx < lowerText.length) {
    const pos = lowerText.indexOf(lowerLabel, idx);
    if (pos === -1) break;

    // Try "Label: N" format
    const colonResult = tryLabelColonNumber(text, pos + lowerLabel.length);
    if (colonResult >= 0) return colonResult;

    // Try "N Label" format
    const prefixResult = tryNumberBeforeLabel(text, pos - 1);
    if (prefixResult >= 0) return prefixResult;

    idx = pos + 1;
  }

  return 0;
}

/**
 * Try to extract a number in "Label: N" format starting at the character after the label.
 */
function tryLabelColonNumber(text: string, afterLabel: number): number {
  let cursor = afterLabel;
  while (cursor < text.length && (text[cursor] === " " || text[cursor] === "\t")) cursor++;
  if (cursor >= text.length || text[cursor] !== ":") return -1;
  cursor++; // skip colon
  while (cursor < text.length && (text[cursor] === " " || text[cursor] === "\t")) cursor++;
  const numStart = cursor;
  while (cursor < text.length && text[cursor] >= "0" && text[cursor] <= "9") cursor++;
  if (cursor > numStart) return Number.parseInt(text.slice(numStart, cursor), 10);
  return -1;
}

/**
 * Try to extract a number in "N LABEL" format by scanning backwards from just before the label.
 */
function tryNumberBeforeLabel(text: string, beforePos: number): number {
  let cursor = beforePos;
  while (cursor >= 0 && (text[cursor] === " " || text[cursor] === "\t")) cursor--;
  if (cursor < 0 || text[cursor] < "0" || text[cursor] > "9") return -1;
  const numEnd = cursor + 1;
  while (cursor >= 0 && text[cursor] >= "0" && text[cursor] <= "9") cursor--;
  return Number.parseInt(text.slice(cursor + 1, numEnd), 10);
}

// ─── V2 record builder ─────────────────────────────────────────────────────────

/**
 * Convert a ParsedEntry to a validated v2 ReviewRecord.
 *
 * - ID format: rev-{reviewNumber} (stable, idempotent)
 * - Completeness: full/partial/stub based on extracted fields
 * - Validates output against ReviewRecord Zod schema
 */
export function toV2ReviewRecord(entry: ParsedEntry): ReviewRecordType {
  const raw = entry.rawLines.join("\n");
  const missing: string[] = [];

  // Extract structured fields
  const pr = extractPR(raw);
  const total = extractTotal(raw);
  const fixed = extractCount(raw, "fixed");
  const deferred = extractCount(raw, "deferred");
  const rejected = extractCount(raw, "rejected");
  const patterns = extractPatterns(raw);
  const learnings = extractLearnings(raw);
  const severity = extractSeverity(raw);

  // Track missing fields for completeness assessment
  if (!entry.title) missing.push("title");
  if (pr === null) missing.push("pr");
  if (total === null) missing.push("total");
  if (fixed === null) missing.push("fixed");
  if (deferred === null) missing.push("deferred");
  if (rejected === null) missing.push("rejected");
  if (patterns.length === 0) missing.push("patterns");
  if (learnings.length === 0) missing.push("learnings");
  if (severity === null) missing.push("severity_breakdown");

  // Assign completeness tier
  const completeness = assignCompleteness(entry, pr, total, fixed, deferred);

  const record: ReviewRecordType = {
    id: `rev-${entry.reviewNumber}`,
    date: entry.date ?? "1970-01-01",
    schema_version: 1,
    completeness,
    completeness_missing: missing,
    origin: {
      type: "backfill",
      tool: "backfill-reviews.ts",
    },
    title: entry.title || null,
    pr: pr ?? null,
    source: entry.sourceFile,
    total: total ?? null,
    fixed: fixed ?? null,
    deferred: deferred ?? null,
    rejected: rejected ?? null,
    patterns: patterns.length > 0 ? patterns : null,
    learnings: learnings.length > 0 ? learnings : null,
    severity_breakdown: severity ?? null,
    per_round_detail: null,
    rejection_analysis: null,
    ping_pong_chains: null,
  };

  // Validate against Zod schema -- catches schema violations immediately
  return ReviewRecord.parse(record);
}

/**
 * Assign completeness tier based on extracted fields.
 *
 * full: has title + pr + total + at least one of fixed/deferred
 * partial: has title + at least total or pr
 * stub: only id/date
 */
function assignCompleteness(
  entry: ParsedEntry,
  pr: number | null,
  total: number | null,
  fixed: number | null,
  deferred: number | null
): CompletenessTierType {
  const hasTitle = Boolean(entry.title);
  const hasPr = pr !== null;
  const hasTotal = total !== null;
  const hasResolution = fixed !== null || deferred !== null;

  if (hasTitle && hasPr && hasTotal && hasResolution) {
    return "full";
  }
  if (hasTitle && (hasTotal || hasPr)) {
    return "partial";
  }
  return "stub";
}
