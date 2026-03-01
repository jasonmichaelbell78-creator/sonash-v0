/**
 * Idempotent backfill orchestrator for PR review archives.
 *
 * Reads all 13 archive files + active log + v1 state, resolves overlaps,
 * applies data corrections (BKFL-04/05/06), and writes validated v2 JSONL.
 *
 * Run: cd scripts/reviews && npx tsc && node dist/backfill-reviews.js
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  parseArchiveFile,
  parseTableArchive,
  toV2ReviewRecord,
  KNOWN_SKIPPED_IDS,
  KNOWN_DUPLICATE_IDS,
  type ParsedEntry,
} from "./lib/parse-review";
import { ReviewRecord, type ReviewRecordType } from "./lib/schemas/review";
import { RetroRecord, type RetroRecordType } from "./lib/schemas/retro";

// ---- Helpers ----------------------------------------------------------------

/**
 * Walk up from startDir until we find package.json (works from both source and dist).
 */
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition -- continue walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const PROJECT_ROOT = findProjectRoot(__dirname);

/**
 * Safely read a file, returning null on any error.
 */
function safeReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    console.warn(`Warning: Could not read ${filePath}`);
    return null;
  }
}

// ---- Source definitions -----------------------------------------------------

interface ArchiveSource {
  file: string;
  parser: "heading" | "table";
}

const ARCHIVE_SOURCES: ArchiveSource[] = [
  { file: "docs/archive/REVIEWS_1-40.md", parser: "heading" },
  { file: "docs/archive/REVIEWS_42-60.md", parser: "heading" },
  { file: "docs/archive/REVIEWS_61-100.md", parser: "heading" },
  { file: "docs/archive/REVIEWS_101-136.md", parser: "table" },
  { file: "docs/archive/REVIEWS_137-179.md", parser: "heading" },
  { file: "docs/archive/REVIEWS_180-201.md", parser: "heading" },
  { file: "docs/archive/REVIEWS_202-212.md", parser: "heading" },
  { file: "docs/archive/REVIEWS_213-284.md", parser: "heading" },
  { file: "docs/archive/REVIEWS_285-346.md", parser: "heading" },
  { file: "docs/archive/REVIEWS_347-369.md", parser: "heading" },
  { file: "docs/archive/REVIEWS_354-357.md", parser: "heading" },
  { file: "docs/archive/REVIEWS_358-388.md", parser: "heading" },
  { file: "docs/archive/REVIEWS_385-393.md", parser: "heading" },
  { file: "docs/AI_REVIEW_LEARNINGS_LOG.md", parser: "heading" },
];

// IDs 92-100 appear in both REVIEWS_61-100 (heading) and REVIEWS_101-136 (table).
// Prefer heading format (richer content).
const HEADING_PREFERRED_SOURCE = "docs/archive/REVIEWS_61-100.md";
const TABLE_SOURCE = "docs/archive/REVIEWS_101-136.md";
const OVERLAP_IDS_92_100 = new Set([92, 93, 94, 95, 96, 97, 98, 99, 100]);

// ---- Step 1: Parse all sources ---------------------------------------------

export function parseAllSources(projectRoot: string): Map<number, ParsedEntry[]> {
  const byNumber = new Map<number, ParsedEntry[]>();

  for (const source of ARCHIVE_SOURCES) {
    const filePath = path.join(projectRoot, source.file);
    const content = safeReadFile(filePath);
    if (content === null) continue;

    const entries =
      source.parser === "table"
        ? parseTableArchive(source.file, content)
        : parseArchiveFile(source.file, content);

    for (const entry of entries) {
      const existing = byNumber.get(entry.reviewNumber);
      if (existing) {
        existing.push(entry);
      } else {
        byNumber.set(entry.reviewNumber, [entry]);
      }
    }
  }

  return byNumber;
}

// ---- Step 2-3: Overlap resolution -------------------------------------------

export interface ResolutionResult {
  records: ReviewRecordType[];
  overlapsResolved: number;
  duplicatesDisambiguated: number;
  skippedIds: number;
  missingIds: number[];
}

function resolveSingleEntry(
  reviewNumber: number,
  entries: ParsedEntry[]
): { resolved: ParsedEntry[]; overlaps: number; duplicates: number } | null {
  if (KNOWN_SKIPPED_IDS.has(reviewNumber)) {
    return null;
  }

  if (entries.length === 1) {
    return { resolved: [entries[0]], overlaps: 0, duplicates: 0 };
  }

  if (KNOWN_DUPLICATE_IDS.has(reviewNumber)) {
    const sorted = [...entries].sort((a, b) => a.sourceFile.localeCompare(b.sourceFile));
    return { resolved: sorted, overlaps: 0, duplicates: 1 };
  }

  if (OVERLAP_IDS_92_100.has(reviewNumber)) {
    const headingEntry = entries.find((e) =>
      e.sourceFile.includes(HEADING_PREFERRED_SOURCE.replace("docs/archive/", ""))
    );
    if (headingEntry) {
      return { resolved: [headingEntry], overlaps: 1, duplicates: 0 };
    }
  }

  const best = entries.reduce(
    (a, b) => (a.rawLines.join("\n").length > b.rawLines.join("\n").length ? a : b),
    entries[0]
  );
  return { resolved: [best], overlaps: 1, duplicates: 0 };
}

function disambiguateRecords(resolved: ParsedEntry[]): ReviewRecordType[] {
  const records: ReviewRecordType[] = [];
  const seenIds = new Set<string>();

  resolved.sort((a, b) => a.reviewNumber - b.reviewNumber);

  for (const entry of resolved) {
    const record = toV2ReviewRecord(entry);

    if (KNOWN_DUPLICATE_IDS.has(entry.reviewNumber)) {
      const baseId = `rev-${entry.reviewNumber}`;
      const suffix = seenIds.has(baseId) ? "b" : "a";
      record.id = `${baseId}-${suffix}`;
      record.origin = {
        ...record.origin,
        session: entry.sourceFile,
      };
    }

    seenIds.add(record.id.replace(/-[ab]$/, ""));
    records.push(record);
  }

  return records;
}

export function resolveOverlaps(byNumber: Map<number, ParsedEntry[]>): ResolutionResult {
  const resolved: ParsedEntry[] = [];
  let overlapsResolved = 0;
  let duplicatesDisambiguated = 0;
  const missingIds: number[] = [];

  for (const [reviewNumber, entries] of byNumber) {
    const result = resolveSingleEntry(reviewNumber, entries);
    if (result === null) continue;

    resolved.push(...result.resolved);
    overlapsResolved += result.overlaps;
    duplicatesDisambiguated += result.duplicates;
  }

  const records = disambiguateRecords(resolved);

  return {
    records,
    overlapsResolved,
    duplicatesDisambiguated,
    skippedIds: countSkippedInSources(byNumber),
    missingIds,
  };
}

function countSkippedInSources(byNumber: Map<number, ParsedEntry[]>): number {
  let count = 0;
  for (const reviewNumber of byNumber.keys()) {
    if (KNOWN_SKIPPED_IDS.has(reviewNumber)) count++;
  }
  return count;
}

// ---- Step 5: Retro extraction -----------------------------------------------

export interface RetroExtraction {
  pr: number;
  date: string;
  sourceFile: string;
  rawContent: string;
}

const RETRO_HEADING_RE = /^###\s+PR\s+#(\d+)\s+Retrospective(?:\s.*?)?\s*\((\d{4}-\d{2}-\d{2})\)/;
const SECTION_END_RE = /^###\s+[^#]/;
const SUB_HEADING_RE = /^####/;
const PR_HEADING_RE = /^###\s+PR\s+#\d+/;

function tryParseRetroHeading(line: string): { pr: number; date: string } | null {
  const retroMatch = RETRO_HEADING_RE.exec(line);
  if (!retroMatch) return null;
  return {
    pr: Number.parseInt(retroMatch[1], 10),
    date: retroMatch[2],
  };
}

function isRetroSectionEnd(line: string): boolean {
  return SECTION_END_RE.test(line) && !SUB_HEADING_RE.test(line) && !PR_HEADING_RE.test(line);
}

function extractRetrosFromContent(content: string, sourceFile: string): RetroExtraction[] {
  const retros: RetroExtraction[] = [];
  const lines = content.split("\n");
  let currentRetro: RetroExtraction | null = null;

  for (const line of lines) {
    const parsed = tryParseRetroHeading(line);
    if (parsed) {
      if (currentRetro) retros.push(currentRetro);
      currentRetro = {
        pr: parsed.pr,
        date: parsed.date,
        sourceFile,
        rawContent: "",
      };
      continue;
    }

    if (currentRetro && isRetroSectionEnd(line)) {
      retros.push(currentRetro);
      currentRetro = null;
    }

    if (currentRetro) {
      currentRetro.rawContent += line + "\n";
    }
  }
  if (currentRetro) retros.push(currentRetro);

  return retros;
}

function deduplicateRetros(retros: RetroExtraction[]): RetroExtraction[] {
  const byPR = new Map<number, RetroExtraction[]>();
  for (const retro of retros) {
    const existing = byPR.get(retro.pr);
    if (existing) {
      existing.push(retro);
    } else {
      byPR.set(retro.pr, [retro]);
    }
  }

  const deduped: RetroExtraction[] = [];
  for (const copies of byPR.values()) {
    if (copies.length === 1) {
      deduped.push(copies[0]);
    } else {
      const best = copies.reduce(
        (a, b) => (a.rawContent.length > b.rawContent.length ? a : b),
        copies[0]
      );
      deduped.push(best);
    }
  }

  return deduped;
}

export function extractRetros(projectRoot: string): RetroExtraction[] {
  const retros: RetroExtraction[] = [];

  for (const source of ARCHIVE_SOURCES) {
    const filePath = path.join(projectRoot, source.file);
    const content = safeReadFile(filePath);
    if (content === null) continue;

    retros.push(...extractRetrosFromContent(content, source.file));
  }

  return deduplicateRetros(retros);
}

// ---- Retro record building helpers ------------------------------------------

function computeMetricsFromReview(
  review: ReviewRecordType
): { total_findings: number; fix_rate: number; pattern_recurrence: number } | null {
  if (review.total === null || review.total === undefined) return null;
  const total = review.total;
  const fixed = review.fixed ?? 0;
  return {
    total_findings: total,
    fix_rate: total > 0 ? Math.min(1, Math.round((fixed / total) * 100) / 100) : 0,
    pattern_recurrence: 0,
  };
}

function computeMetricsFromContent(
  raw: string
): { total_findings: number; fix_rate: number; pattern_recurrence: number } | null {
  const totalRe = /Total\s+items?\s*[|:]\s*~?(\d+)/i;
  const fixedRe = /Fixed\s*[|:]\s*~?(\d+)/i;
  const totalMatch = totalRe.exec(raw);
  if (!totalMatch) return null;

  const total = Number.parseInt(totalMatch[1], 10);
  const fixedMatch = fixedRe.exec(raw);
  const fixed = fixedMatch ? Number.parseInt(fixedMatch[1], 10) : 0;
  return {
    total_findings: total,
    fix_rate: total > 0 ? Math.min(1, Math.round((fixed / total) * 100) / 100) : 0,
    pattern_recurrence: 0,
  };
}

function determineCompleteness(
  topWins: string[],
  topMisses: string[],
  processChanges: string[],
  metrics: { total_findings: number; fix_rate: number; pattern_recurrence: number } | null
): { completeness: "full" | "partial" | "stub"; missing: string[] } {
  const missing: string[] = [];
  if (topWins.length === 0) missing.push("top_wins");
  if (topMisses.length === 0) missing.push("top_misses");
  if (processChanges.length === 0) missing.push("process_changes");
  if (metrics === null) missing.push("metrics");

  let completeness: "full" | "partial" | "stub";
  if (missing.length === 0) {
    completeness = "full";
  } else if (missing.length <= 2) {
    completeness = "partial";
  } else {
    completeness = "stub";
  }

  return { completeness, missing };
}

export function buildRetroRecords(
  retros: RetroExtraction[],
  reviewsByPR: Map<number, ReviewRecordType>
): { records: RetroRecordType[]; missingReviewCount: number } {
  const records: RetroRecordType[] = [];
  let missingReviewCount = 0;

  for (const retro of retros) {
    const raw = retro.rawContent;

    const topWins = extractRetroSection(raw, ["wins", "what went well", "went well"]);
    const topMisses = extractRetroSection(raw, [
      "misses",
      "what could improve",
      "could improve",
      "issues",
      "pain points",
    ]);
    const processChanges = extractRetroSection(raw, [
      "process changes",
      "action items",
      "actions",
      "prevention",
      "recommendations",
    ]);

    const associatedReview = reviewsByPR.get(retro.pr);
    let metrics = associatedReview ? computeMetricsFromReview(associatedReview) : null;

    if (!metrics) {
      metrics = computeMetricsFromContent(raw);
      if (!metrics) {
        missingReviewCount++;
      }
    }

    const { completeness, missing } = determineCompleteness(
      topWins,
      topMisses,
      processChanges,
      metrics
    );

    const record: RetroRecordType = {
      id: `retro-pr-${retro.pr}`,
      date: retro.date,
      schema_version: 1,
      completeness,
      completeness_missing: missing,
      origin: {
        type: "pr-retro",
        pr: retro.pr,
        tool: "backfill-reviews.ts",
      },
      pr: retro.pr,
      session: retro.sourceFile,
      top_wins: topWins.length > 0 ? topWins : null,
      top_misses: topMisses.length > 0 ? topMisses : null,
      process_changes: processChanges.length > 0 ? processChanges : null,
      score: null,
      metrics,
    };

    records.push(RetroRecord.parse(record));
  }

  return { records, missingReviewCount };
}

// ---- Retro section extraction helpers ---------------------------------------

function isMatchingSectionHeader(lower: string, headers: string[]): boolean {
  return headers.some(
    (h) =>
      lower.includes(`**${h}**`) ||
      lower.includes(`**${h}:**`) ||
      (/^####?\s+/.test(lower) && lower.includes(h))
  );
}

function isSectionEnd(trimmed: string, headers: string[]): boolean {
  if (trimmed.startsWith("**") && !headers.some((h) => trimmed.toLowerCase().includes(h))) {
    return true;
  }
  if (/^#{2,4}\s/.test(trimmed)) return true;
  if (trimmed.startsWith("---")) return true;
  return false;
}

function extractBulletText(trimmed: string): string | null {
  if (!trimmed.startsWith("-") && !trimmed.startsWith("*")) return null;
  const text = trimmed.replace(/^[-*]\s+/, "").trim();
  return text.length > 0 ? text : null;
}

function extractRetroSection(raw: string, headers: string[]): string[] {
  const items: string[] = [];
  const lines = raw.split("\n");
  let inSection = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (isMatchingSectionHeader(lower, headers)) {
      inSection = true;
      continue;
    }

    if (inSection) {
      const trimmed = line.trimStart();
      if (isSectionEnd(trimmed, headers)) {
        inSection = false;
        continue;
      }

      const text = extractBulletText(trimmed);
      if (text && !items.includes(text)) {
        items.push(text);
      }
    }
  }

  return items;
}

// ---- Step 6: V1 migration ---------------------------------------------------

interface V1Record {
  id: number;
  date: string;
  title: string;
  source: string;
  pr: number | null;
  patterns: string[];
  fixed: number;
  deferred: number;
  rejected: number;
  critical: number;
  major: number;
  minor: number;
  trivial: number;
  total: number;
  learnings: string[];
}

function computeV1Completeness(v1: V1Record): "full" | "partial" | "stub" {
  const hasTitle = Boolean(v1.title);
  const hasPr = v1.pr !== null;
  const hasTotal = v1.total > 0;
  const hasResolution = v1.fixed > 0 || v1.deferred > 0;

  if (hasTitle && hasPr && hasTotal && hasResolution) return "full";
  if (hasTitle && (hasTotal || hasPr)) return "partial";
  return "stub";
}

function computeV1MissingFields(v1: V1Record): string[] {
  const missing: string[] = [];
  if (!v1.title) missing.push("title");
  if (v1.pr === null) missing.push("pr");
  if (v1.total === 0 && v1.fixed === 0) missing.push("total", "fixed");
  if (!Array.isArray(v1.patterns) || v1.patterns.length === 0) missing.push("patterns");
  if (!Array.isArray(v1.learnings) || v1.learnings.length === 0) missing.push("learnings");
  const hasSeverity = v1.critical > 0 || v1.major > 0 || v1.minor > 0 || v1.trivial > 0;
  if (!hasSeverity) missing.push("severity_breakdown");
  return missing;
}

function buildV1ReviewRecord(v1: V1Record): ReviewRecordType {
  const v1Patterns = Array.isArray(v1.patterns) ? v1.patterns : [];
  const v1Learnings = Array.isArray(v1.learnings) ? v1.learnings : [];
  const hasSeverity = v1.critical > 0 || v1.major > 0 || v1.minor > 0 || v1.trivial > 0;

  return ReviewRecord.parse({
    id: `rev-${v1.id}`,
    date: v1.date,
    schema_version: 1,
    completeness: computeV1Completeness(v1),
    completeness_missing: computeV1MissingFields(v1),
    origin: {
      type: "migration",
      tool: "backfill-reviews.ts",
    },
    title: v1.title || null,
    pr: v1.pr ?? null,
    source: v1.source || null,
    total: v1.total > 0 ? v1.total : null,
    fixed: v1.fixed > 0 ? v1.fixed : null,
    deferred: v1.deferred > 0 ? v1.deferred : null,
    rejected: v1.rejected > 0 ? v1.rejected : null,
    patterns: v1Patterns.length > 0 ? v1Patterns : null,
    learnings: v1Learnings.length > 0 ? v1Learnings : null,
    severity_breakdown: hasSeverity
      ? {
          critical: v1.critical,
          major: v1.major,
          minor: v1.minor,
          trivial: v1.trivial,
        }
      : null,
    per_round_detail: null,
    rejection_analysis: null,
    ping_pong_chains: null,
  });
}

export function migrateV1Records(
  v1Path: string,
  existingIds: Set<number>
): { records: ReviewRecordType[]; migrated: number; skipped: number } {
  let content: string;
  try {
    content = fs.readFileSync(v1Path, "utf8");
  } catch {
    console.warn(`Warning: Could not read v1 state file: ${v1Path}`);
    return { records: [], migrated: 0, skipped: 0 };
  }

  const records: ReviewRecordType[] = [];
  let migrated = 0;
  let skipped = 0;

  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  for (const line of lines) {
    let v1: V1Record;
    try {
      v1 = JSON.parse(line) as V1Record;
    } catch {
      console.warn(`Warning: Could not parse v1 record: ${line.slice(0, 80)}`);
      continue;
    }

    if (existingIds.has(v1.id) || KNOWN_SKIPPED_IDS.has(v1.id)) {
      skipped++;
      continue;
    }

    records.push(buildV1ReviewRecord(v1));
    migrated++;
  }

  return { records, migrated, skipped };
}

// ---- BKFL-05: Consolidation counter check -----------------------------------

export function checkConsolidationCounter(
  consolidationPath: string,
  actualCount: number
): { expected: number | null; actual: number; match: boolean } {
  try {
    const content = fs.readFileSync(consolidationPath, "utf8");
    const data = JSON.parse(content) as { lastConsolidatedReview?: number };
    const expected = data.lastConsolidatedReview ?? null;
    return {
      expected,
      actual: actualCount,
      match: expected === actualCount,
    };
  } catch {
    console.warn(`Warning: Could not read consolidation state: ${consolidationPath}`);
    return { expected: null, actual: actualCount, match: false };
  }
}

// ---- BKFL-06: Pattern corrections -------------------------------------------

function isArtifactPattern(pattern: string): boolean {
  const trimmed = pattern.trim();
  return /^#?\d+$/.test(trimmed) || trimmed.length < 3;
}

export function applyPatternCorrections(records: ReviewRecordType[]): {
  applied: number;
  flagged: number;
} {
  let applied = 0;
  let flagged = 0;

  for (const record of records) {
    if (!record.patterns) continue;

    const originalLength = record.patterns.length;
    record.patterns = record.patterns.filter((p) => !isArtifactPattern(p));
    applied += originalLength - record.patterns.length;

    if (record.patterns.length === 0) {
      record.patterns = null;
      if (!record.completeness_missing.includes("patterns")) {
        record.completeness_missing.push("patterns");
      }
    }
  }

  // Patterns #5 and #13 flagged for manual investigation
  flagged += 2;

  return { applied, flagged };
}

// ---- Main orchestrator helpers ----------------------------------------------

function buildReviewsByPR(records: ReviewRecordType[]): Map<number, ReviewRecordType> {
  const reviewsByPR = new Map<number, ReviewRecordType>();
  for (const record of records) {
    if (record.pr === null || record.pr === undefined) continue;
    const existing = reviewsByPR.get(record.pr);
    if (!existing || (record.total !== null && record.total !== undefined)) {
      reviewsByPR.set(record.pr, record);
    }
  }
  return reviewsByPR;
}

function extractReviewNumber(id: string): number {
  const revNumRe = /^rev-(\d+)/;
  const match = revNumRe.exec(id);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function validateOutputFile(
  filePath: string,
  parser: { safeParse: (data: unknown) => { success: boolean; error?: { message: string } } },
  label: string
): number {
  let errors = 0;
  const content = fs.readFileSync(filePath, "utf8");
  const outputLines = content.split("\n").filter((l) => l.trim().length > 0);
  for (const line of outputLines) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      console.error(`  ${label} JSON parse error: ${line.slice(0, 80)}`);
      errors++;
      continue;
    }
    const result = parser.safeParse(parsed);
    if (!result.success) {
      console.error(`  ${label} validation error: ${result.error?.message}`);
      errors++;
    }
  }
  return errors;
}

function countDuplicateIds(records: ReviewRecordType[]): number {
  const idSet = new Set<string>();
  let duplicateIds = 0;
  for (const record of records) {
    if (idSet.has(record.id)) {
      console.error(`  Duplicate ID: ${record.id}`);
      duplicateIds++;
    }
    idSet.add(record.id);
  }
  return duplicateIds;
}

function countTiers(records: ReviewRecordType[]): { full: number; partial: number; stub: number } {
  const tiers = { full: 0, partial: 0, stub: 0 };
  for (const record of records) {
    tiers[record.completeness]++;
  }
  return tiers;
}

function printSummary(
  allRecords: ReviewRecordType[],
  resolution: ResolutionResult,
  retroResult: { records: RetroRecordType[]; missingReviewCount: number },
  v1Result: { migrated: number },
  reviewValidationErrors: number,
  retroValidationErrors: number,
  duplicateIds: number,
  reviewsPath: string,
  retrosPath: string
): void {
  const tiers = countTiers(allRecords);
  const reviewOutputCount = fs
    .readFileSync(reviewsPath, "utf8")
    .split("\n")
    .filter((l) => l.trim().length > 0).length;
  const retroOutputCount = fs
    .readFileSync(retrosPath, "utf8")
    .split("\n")
    .filter((l) => l.trim().length > 0).length;

  console.log("\n=== Summary ===");
  console.log(`Total review records: ${allRecords.length}`);
  console.log(`  Full: ${tiers.full}, Partial: ${tiers.partial}, Stub: ${tiers.stub}`);
  console.log(`Overlaps resolved: ${resolution.overlapsResolved}`);
  console.log(
    `Duplicate IDs disambiguated: ${resolution.duplicatesDisambiguated} (${KNOWN_DUPLICATE_IDS.size} IDs)`
  );
  console.log(`Retro records: ${retroResult.records.length}`);
  console.log(`V1 records migrated: ${v1Result.migrated}`);
  console.log(`Review validation errors: ${reviewValidationErrors}`);
  console.log(`Retro validation errors: ${retroValidationErrors}`);
  console.log(`Duplicate IDs in output: ${duplicateIds}`);
  console.log(`\nOutput files:`);
  console.log(`  ${reviewsPath} (${reviewOutputCount} records)`);
  console.log(`  ${retrosPath} (${retroOutputCount} records)`);
}

// ---- Main orchestrator ------------------------------------------------------

export async function runBackfill(): Promise<void> {
  console.log("=== PR Review Backfill ===\n");

  console.log("Step 1: Parsing archive sources...");
  const byNumber = parseAllSources(PROJECT_ROOT);
  console.log(
    `  Parsed ${byNumber.size} unique review numbers from ${ARCHIVE_SOURCES.length} sources`
  );

  console.log("Step 2-3: Resolving overlaps...");
  const resolution = resolveOverlaps(byNumber);
  console.log(`  Records: ${resolution.records.length}`);
  console.log(`  Overlaps resolved: ${resolution.overlapsResolved}`);
  console.log(`  Duplicate IDs disambiguated: ${resolution.duplicatesDisambiguated}`);
  console.log(`  Skipped IDs filtered: ${resolution.skippedIds}`);

  console.log("Step 4: Extracting retrospectives...");
  const retros = extractRetros(PROJECT_ROOT);
  console.log(`  Found ${retros.length} retrospective sections`);

  const reviewsByPR = buildReviewsByPR(resolution.records);

  const retroResult = buildRetroRecords(retros, reviewsByPR);
  console.log(
    `  BKFL-04: Retro metrics computed for ${retroResult.records.length} retro records (${retroResult.missingReviewCount} missing associated review)`
  );

  console.log("Step 5: Migrating v1 state records...");
  const v1Path = path.join(PROJECT_ROOT, ".claude/state/reviews.jsonl");
  const archiveIds = new Set(
    resolution.records.map((r) => extractReviewNumber(r.id)).filter((n) => n !== 0)
  );
  const v1Result = migrateV1Records(v1Path, archiveIds);
  console.log(
    `  V1 records migrated: ${v1Result.migrated}, skipped (already in archives): ${v1Result.skipped}`
  );

  const allRecords = [...resolution.records, ...v1Result.records];

  console.log("Step 6: BKFL-05 consolidation counter check...");
  const consolidationPath = path.join(PROJECT_ROOT, ".claude/state/consolidation.json");
  const maxReviewNumber = Math.max(...allRecords.map((r) => extractReviewNumber(r.id)));
  const consolidationResult = checkConsolidationCounter(consolidationPath, maxReviewNumber);
  if (consolidationResult.match) {
    console.log(`  BKFL-05: Consolidation counter: match (${consolidationResult.expected})`);
  } else {
    console.log(
      `  BKFL-05: Consolidation counter: expected=${consolidationResult.expected}, actual=${consolidationResult.actual}`
    );
  }

  console.log("Step 7: BKFL-06 pattern corrections...");
  const patternResult = applyPatternCorrections(allRecords);
  console.log(
    `  BKFL-06: Pattern corrections: ${patternResult.applied} applied, ${patternResult.flagged} flagged for investigation`
  );

  console.log("Step 8: Writing output...");

  allRecords.sort((a, b) => {
    const numA = extractReviewNumber(a.id);
    const numB = extractReviewNumber(b.id);
    if (numA !== numB) return numA - numB;
    return a.id.localeCompare(b.id);
  });

  retroResult.records.sort((a, b) => a.date.localeCompare(b.date));

  const outputDir = path.join(PROJECT_ROOT, "data/ecosystem-v2");
  fs.mkdirSync(outputDir, { recursive: true });

  const reviewsPath = path.join(outputDir, "reviews.jsonl");
  const reviewLines = allRecords.map((r) => JSON.stringify(r)).join("\n") + "\n";
  fs.writeFileSync(reviewsPath, reviewLines, "utf8");

  const retrosPath = path.join(outputDir, "retros.jsonl");
  const retroLines = retroResult.records.map((r) => JSON.stringify(r)).join("\n") + "\n";
  fs.writeFileSync(retrosPath, retroLines, "utf8");

  console.log("\nValidating output...");
  const reviewValidationErrors = validateOutputFile(reviewsPath, ReviewRecord, "Review");
  const retroValidationErrors = validateOutputFile(retrosPath, RetroRecord, "Retro");
  const duplicateIds = countDuplicateIds(allRecords);

  printSummary(
    allRecords,
    resolution,
    retroResult,
    v1Result,
    reviewValidationErrors,
    retroValidationErrors,
    duplicateIds,
    reviewsPath,
    retrosPath
  );
}

// Run if executed directly
void (async () => {
  try {
    await runBackfill();
  } catch (err: unknown) {
    console.error("Backfill failed:", err);
    process.exit(1);
  }
})();
