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

// ─── Regex patterns ─────────────────────────────────────────────────────────────

const HEADER_RE = /^#{2,4}\s+Review\s+#(\d+)(?::|\s+--|\s+\u2014)\s*(.*)/;
const DATE_RE = /\((\d{4}-\d{2}-\d{2})\)\s*$/;
const TABLE_ID_RE = /\|\s*#?(\d+)\s*\|/;
const DATE_CELL_RE = /(\d{4}-\d{2}-\d{2})/;
const BOLD_PR_RE = /\*\*PR:?\*\*:?\s*#(\d+)/;
const INLINE_PR_RE = /PR\s*#(\d+)/;
const SLASH_PR_RE = /pr\/(\d+)/i;
const BOLD_TOTAL_RE = /\*\*(?:Total|Items):?\*\*:?\s*~?(\d+)/i;
const N_TOTAL_RE = /(\d+)\s+total\b/i;
const N_ITEMS_RE = /(\d+)\s+items\b/i;
const INLINE_PATTERN_RE = /\*\*(?:Key\s+)?Patterns?:?\*\*:?\s+(.+)/i;
const SECTION_HEADING_RE = /^#{2,4}\s/;

// ─── Heading-based parser ──────────────────────────────────────────────────────

function parseHeaderLine(
  line: string
): { reviewNumber: number; date: string | null; title: string } | null {
  const headerMatch = HEADER_RE.exec(line);
  if (!headerMatch) return null;

  const reviewNumber = Number.parseInt(headerMatch[1], 10);
  const titleAndDate = headerMatch[2].trim();

  const dateMatch = DATE_RE.exec(titleAndDate);
  const date = dateMatch ? dateMatch[1] : null;
  const title =
    dateMatch?.index == null ? titleAndDate : titleAndDate.slice(0, dateMatch.index).trim();

  const cleanTitle = title.replace(/\s*--\s*$/, "").replace(/:\s*$/, "");

  return { reviewNumber, date, title: cleanTitle };
}

interface ArchiveParseState {
  current: ParsedEntry | null;
  inFence: boolean;
  fenceMarker: string | null;
  entries: ParsedEntry[];
}

function processFenceLine(trimmed: string, state: ArchiveParseState): void {
  const match = /^(?<marker>`{3,}|~{3,})/.exec(trimmed);
  if (!match?.groups?.marker) return;
  const fence = match.groups.marker;
  if (state.inFence) {
    // Only close when the same fence marker (type + length) is used
    if (state.fenceMarker === fence) {
      state.inFence = false;
      state.fenceMarker = null;
    }
  } else {
    state.inFence = true;
    state.fenceMarker = fence;
  }
}

function processArchiveLine(line: string, state: ArchiveParseState, filePath: string): void {
  const trimmed = line.trim();
  if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
    processFenceLine(trimmed, state);
    if (state.current) state.current.rawLines.push(line);
    return;
  }
  if (state.inFence) {
    if (state.current) state.current.rawLines.push(line);
    return;
  }

  const header = parseHeaderLine(line);
  if (header) {
    if (state.current) state.entries.push(state.current);
    state.current = {
      reviewNumber: header.reviewNumber,
      date: header.date,
      title: header.title,
      rawLines: [],
      sourceFile: filePath,
    };
    return;
  }

  if (state.current) state.current.rawLines.push(line);
}

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
  const state: ArchiveParseState = {
    current: null,
    inFence: false,
    fenceMarker: null,
    entries: [],
  };
  for (const line of content.split("\n")) {
    processArchiveLine(line, state, filePath);
  }
  if (state.current) state.entries.push(state.current);
  return deduplicateEntries(state.entries);
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
      const best = copies.reduce(
        (a, b) => (a.rawLines.join("\n").length > b.rawLines.join("\n").length ? a : b),
        copies[0]
      );
      result.push(best);
    }
  }
  return result;
}

// ─── Table-based parser ────────────────────────────────────────────────────────

function parseTableCells(trimmed: string): string[] {
  const cells = trimmed.split("|").map((c) => c.trim());
  // Remove leading/trailing empty cells from pipe-delimited format
  if (cells.length >= 2 && cells[0] === "") cells.shift();
  if (cells.length >= 2 && cells.at(-1) === "") cells.pop();
  return cells;
}

function isSkippableRow(cells: string[]): boolean {
  const first = (cells[0] ?? "").trim().toLowerCase();
  return cells.length < 2 || first.startsWith("---") || first === "id";
}

function extractTableEntry(trimmed: string, filePath: string): ParsedEntry | null {
  const idMatch = TABLE_ID_RE.exec(trimmed);
  if (!idMatch) return null;

  const cells = parseTableCells(trimmed);
  if (isSkippableRow(cells)) return null;

  const reviewNumber = Number.parseInt(idMatch[1], 10);

  let date: string | null = null;
  if (cells.length >= 2) {
    const dateMatch = DATE_CELL_RE.exec(cells[1]);
    if (dateMatch) date = dateMatch[1];
  }

  const title = cells.length >= 3 ? cells[2].trim() : "";

  return { reviewNumber, date, title, rawLines: [], sourceFile: filePath };
}

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

    const entry = extractTableEntry(trimmed, filePath);
    if (entry) entries.push(entry);
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
  const boldPR = BOLD_PR_RE.exec(raw);
  if (boldPR) return Number.parseInt(boldPR[1], 10);

  const inlinePR = INLINE_PR_RE.exec(raw);
  if (inlinePR) return Number.parseInt(inlinePR[1], 10);

  const slashPR = SLASH_PR_RE.exec(raw);
  if (slashPR) return Number.parseInt(slashPR[1], 10);

  return null;
}

/**
 * Extract total item count from raw markdown content.
 * Looks for: **Total:** N, **Items:** N, N total, N items
 */
export function extractTotal(raw: string): number | null {
  const boldTotal = BOLD_TOTAL_RE.exec(raw);
  if (boldTotal) return Number.parseInt(boldTotal[1], 10);

  const nTotal = N_TOTAL_RE.exec(raw);
  if (nTotal) return Number.parseInt(nTotal[1], 10);

  const nItems = N_ITEMS_RE.exec(raw);
  if (nItems) return Number.parseInt(nItems[1], 10);

  return null;
}

/**
 * Extract a labeled count (fixed, deferred, rejected) from raw markdown.
 * Looks for: **Label:** N, Label: N, Label N
 */
export function extractCount(raw: string, label: string): number | null {
  const escapedLabel = label.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const boldPattern = new RegExp(String.raw`\*\*${escapedLabel}:?\*\*:?\s*~?(\d+)`, "i");
  const boldMatch = boldPattern.exec(raw);
  if (boldMatch) return Number.parseInt(boldMatch[1], 10);

  const colonPattern = new RegExp(String.raw`(?:^|[^a-z])${escapedLabel}:\s*~?(\d+)`, "i");
  const colonMatch = colonPattern.exec(raw);
  if (colonMatch) return Number.parseInt(colonMatch[1], 10);

  // Fallback: "Label N" (no colon), e.g. "Fixed 8" / "Rejected ~3"
  const spacePattern = new RegExp(
    String.raw`(?:^|[^a-z])${escapedLabel}\s+~?(\d+)(?:$|[^0-9])`,
    "i"
  );
  const spaceMatch = spacePattern.exec(raw);
  if (spaceMatch) return Number.parseInt(spaceMatch[1], 10);

  return null;
}

// ─── Section extraction helpers ─────────────────────────────────────────────────

function isSectionHeader(lower: string, keywords: string[]): boolean {
  return keywords.some((kw) => lower.includes(kw));
}

function isEndOfSection(trimmed: string, sectionKeyword: string): boolean {
  // Only treat bold "Label:" lines as section boundaries, not arbitrary bold prose
  const isBoldLabelLine = /^\*\*[^*]+:\*\*/.test(trimmed);
  if (isBoldLabelLine && !trimmed.toLowerCase().includes(sectionKeyword)) {
    return true;
  }
  return trimmed.startsWith("---") || SECTION_HEADING_RE.test(trimmed);
}

function extractBulletText(trimmed: string): string | null {
  if (!trimmed.startsWith("-") && !trimmed.startsWith("*")) return null;
  const text = trimmed.replace(/^[-*]\s+/, "").trim();
  return text.length > 0 ? text : null;
}

function extractInlinePatterns(line: string): string[] {
  const inlineMatch = INLINE_PATTERN_RE.exec(line);
  if (!inlineMatch) return [];
  return inlineMatch[1]
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function collectInlinePatterns(line: string, items: string[]): void {
  for (const part of extractInlinePatterns(line)) {
    if (!items.includes(part)) items.push(part);
  }
}

function extractSectionItems(
  raw: string,
  sectionHeaders: string[],
  sectionKeyword: string,
  includeInlinePatterns: boolean
): string[] {
  const items: string[] = [];
  const lines = raw.split("\n");
  let inSection = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (isSectionHeader(lower, sectionHeaders)) {
      inSection = true;
      if (includeInlinePatterns) collectInlinePatterns(line, items);
      continue;
    }

    if (!inSection) continue;

    const trimmed = line.trimStart();
    if (isEndOfSection(trimmed, sectionKeyword)) {
      inSection = false;
      continue;
    }

    const text = extractBulletText(trimmed);
    if (text && !items.includes(text)) {
      items.push(text);
    }
  }

  return items;
}

/**
 * Extract pattern names from bullet lists under **Patterns** or **Key Patterns** sections.
 */
export function extractPatterns(raw: string): string[] {
  return extractSectionItems(
    raw,
    ["**patterns**", "**key patterns**", "**patterns:**", "**key patterns:**"],
    "pattern",
    true
  );
}

/**
 * Extract learnings from bullet lists under **Learnings** or **Key Learnings** sections.
 */
export function extractLearnings(raw: string): string[] {
  return extractSectionItems(
    raw,
    ["**learnings**", "**key learnings**", "**learnings:**", "**key learnings:**"],
    "learning",
    false
  );
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

  // Prioritize the more explicit "Label: N" format first.
  let idx = 0;
  while (idx < lowerText.length) {
    const pos = lowerText.indexOf(lowerLabel, idx);
    if (pos === -1) break;
    const colonResult = tryLabelColonNumber(text, pos + lowerLabel.length);
    if (colonResult >= 0) return colonResult;
    idx = pos + 1;
  }

  // Fall back to "N Label" format
  idx = 0;
  while (idx < lowerText.length) {
    const pos = lowerText.indexOf(lowerLabel, idx);
    if (pos === -1) break;
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

  const pr = extractPR(raw);
  const total = extractTotal(raw);
  const fixed = extractCount(raw, "fixed");
  const deferred = extractCount(raw, "deferred");
  const rejected = extractCount(raw, "rejected");
  const patterns = extractPatterns(raw);
  const learnings = extractLearnings(raw);
  const severity = extractSeverity(raw);

  if (!entry.title) missing.push("title");
  if (pr === null) missing.push("pr");
  if (total === null) missing.push("total");
  if (fixed === null) missing.push("fixed");
  if (deferred === null) missing.push("deferred");
  if (rejected === null) missing.push("rejected");
  if (patterns.length === 0) missing.push("patterns");
  if (learnings.length === 0) missing.push("learnings");
  if (severity === null) missing.push("severity_breakdown");

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
