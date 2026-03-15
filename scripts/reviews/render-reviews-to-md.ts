/**
 * JSONL-to-markdown renderer for review records.
 *
 * Reads .claude/state/reviews.jsonl (canonical source) and regenerates the
 * review entries section of docs/AI_REVIEW_LEARNINGS_LOG.md.
 *
 * PRESERVES: Header, Version History, consolidation sections, retrospectives,
 * Key Patterns, and any other non-review sections from the existing file.
 * REGENERATES: The "Active Reviews" section from JSONL data.
 *
 * Usage:
 *   npx tsx render-reviews-to-md.ts              # write to default output
 *   npx tsx render-reviews-to-md.ts --stdout      # stdout only
 *   npx tsx render-reviews-to-md.ts --filter-pr 399
 *   npx tsx render-reviews-to-md.ts --last 5
 */

import * as fs from "node:fs";
import * as path from "node:path";

// Import safe-fs (CJS) for atomic writes
// eslint-disable-next-line @typescript-eslint/no-require-imports
const safeFsPath = path.resolve(__dirname, "..", "lib", "safe-fs.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { safeAtomicWriteSync, isSafeToWrite } = require(safeFsPath) as {
  safeAtomicWriteSync: (filePath: string, data: string, options?: object) => void;
  isSafeToWrite: (filePath: string) => boolean;
};

// Import sanitize-error (ESM with CJS compat)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sanitizeErrorPath = path.resolve(__dirname, "..", "lib", "sanitize-error.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sanitizeErrorMod = require(sanitizeErrorPath) as {
  sanitizeError: (error: unknown) => string;
  default?: { sanitizeError: (error: unknown) => string };
};
const sanitizeError: (error: unknown) => string =
  sanitizeErrorMod.sanitizeError ??
  sanitizeErrorMod.default?.sanitizeError ??
  ((err: unknown) => (err instanceof Error ? err.message : String(err)));

// Import read-jsonl (CJS)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const readJsonlPath = path.resolve(__dirname, "..", "lib", "read-jsonl.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const readJsonl = require(readJsonlPath) as (
  filePath: string,
  options?: { safe?: boolean; quiet?: boolean }
) => Record<string, unknown>[];

// ─── Project root resolution ─────────────────────────────────────────────

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

// ─── Lenient record types ────────────────────────────────────────────────
// The canonical .claude/state/reviews.jsonl uses a pre-migration format
// without schema_version/completeness/origin. We parse leniently.

export interface RenderableReview {
  id: string | number;
  date: string;
  title?: string | null;
  type?: string | null;
  pr?: number | null;
  source?: string | null;
  total?: number | null;
  fixed?: number | null;
  deferred?: number | null;
  rejected?: number | null;
  critical?: number | null;
  major?: number | null;
  minor?: number | null;
  trivial?: number | null;
  patterns?: string[] | null;
  learnings?: string[] | null;
  completeness?: string | null;
  completeness_missing?: string[] | null;
  severity_breakdown?: {
    critical: number;
    major: number;
    minor: number;
    trivial: number;
  } | null;
  // Retrospective-specific fields
  rounds?: number | null;
  totalItems?: number | null;
  skillsToUpdate?: string[] | null;
  processImprovements?: string[] | null;
}

/**
 * Parse raw JSONL objects into renderable review records.
 * Accepts both old-format (flat severity) and new-format (nested severity_breakdown).
 * Skips records missing required id/date fields.
 */
function parseRecords(rawRecords: Record<string, unknown>[]): RenderableReview[] {
  const results: RenderableReview[] = [];
  for (const raw of rawRecords) {
    const id = raw.id;
    const date = raw.date;
    if (id == null || date == null) continue;
    if (typeof date !== "string") continue;

    results.push(raw as unknown as RenderableReview);
  }
  return results;
}

// ─── Rendering helpers ───────────────────────────────────────────────────

/** Collapse multiline text to single safe inline string. */
const safeInline = (s: string): string =>
  s
    .replaceAll(/\r?\n/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();

/**
 * Render a single review record as a markdown section.
 * Handles partial/stub records gracefully.
 */
export function renderReviewRecord(record: RenderableReview): string {
  const lines: string[] = [];

  const title = safeInline(String(record.title ?? "(untitled)"));
  const dateStr = record.date;
  lines.push(`### Review ${record.id}: ${title} (${dateStr})`, "");

  // Completeness note for non-full records (only if field exists)
  if (record.completeness != null && record.completeness !== "full") {
    lines.push(`> **Completeness:** ${record.completeness}`);
    if (record.completeness_missing && record.completeness_missing.length > 0) {
      lines.push(`> **Missing fields:** ${record.completeness_missing.join(", ")}`);
    }
    lines.push("");
  }

  // Metadata line
  const metaParts: string[] = [];
  metaParts.push(`**Date:** ${dateStr}`);
  if (record.pr != null) {
    metaParts.push(`**PR:** #${record.pr}`);
  }
  if (record.source != null) {
    metaParts.push(`**Source:** ${record.source}`);
  }
  lines.push(metaParts.join(" | "), "");

  // Stats table
  if (record.total != null) {
    lines.push(
      "| Total | Fixed | Deferred | Rejected |",
      "|-------|-------|----------|----------|",
      `| ${record.total} | ${record.fixed ?? "-"} | ${record.deferred ?? "-"} | ${record.rejected ?? "-"} |`,
      ""
    );
  }

  // Severity breakdown — handle both nested and flat formats
  const sb = record.severity_breakdown;
  const flatCrit = record.critical;
  const flatMajor = record.major;
  const flatMinor = record.minor;
  const flatTrivial = record.trivial;

  if (sb != null) {
    lines.push(
      "**Severity Breakdown:**",
      "",
      "| Critical | Major | Minor | Trivial |",
      "|----------|-------|-------|---------|",
      `| ${sb.critical} | ${sb.major} | ${sb.minor} | ${sb.trivial} |`,
      ""
    );
  } else if (
    flatCrit != null ||
    flatMajor != null ||
    flatMinor != null ||
    flatTrivial != null
  ) {
    lines.push(
      "**Severity Breakdown:**",
      "",
      "| Critical | Major | Minor | Trivial |",
      "|----------|-------|-------|---------|",
      `| ${flatCrit ?? "-"} | ${flatMajor ?? "-"} | ${flatMinor ?? "-"} | ${flatTrivial ?? "-"} |`,
      ""
    );
  }

  // Patterns
  if (record.patterns != null && record.patterns.length > 0) {
    lines.push("**Patterns:**", "");
    for (const pattern of record.patterns) {
      lines.push(`- ${safeInline(String(pattern))}`);
    }
    lines.push("");
  }

  // Learnings
  if (record.learnings != null && record.learnings.length > 0) {
    lines.push("**Learnings:**", "");
    for (const learning of record.learnings) {
      lines.push(`- ${safeInline(String(learning))}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Render a retrospective record as a markdown section.
 */
export function renderRetroRecord(record: RenderableReview): string {
  const lines: string[] = [];

  const title = `PR #${record.pr ?? "?"} Retrospective`;
  lines.push(`### Retro ${record.id}: ${title} (${record.date})`, "");

  const metaParts: string[] = [];
  metaParts.push(`**Date:** ${record.date}`);
  if (record.pr != null) metaParts.push(`**PR:** #${record.pr}`);
  if (record.rounds != null) metaParts.push(`**Rounds:** ${record.rounds}`);
  if (record.totalItems != null) metaParts.push(`**Total Items:** ${record.totalItems}`);
  lines.push(metaParts.join(" | "), "");

  // Stats
  if (record.fixed != null || record.rejected != null || record.deferred != null) {
    lines.push(
      "| Fixed | Rejected | Deferred |",
      "|-------|----------|----------|",
      `| ${record.fixed ?? "-"} | ${record.rejected ?? "-"} | ${record.deferred ?? "-"} |`,
      ""
    );
  }

  // Process improvements
  if (record.processImprovements != null && record.processImprovements.length > 0) {
    lines.push("**Process Improvements:**", "");
    for (const item of record.processImprovements) {
      lines.push(`- ${safeInline(String(item))}`);
    }
    lines.push("");
  }

  // Skills to update
  if (record.skillsToUpdate != null && record.skillsToUpdate.length > 0) {
    lines.push("**Skills to Update:**", "");
    for (const item of record.skillsToUpdate) {
      lines.push(`- ${safeInline(String(item))}`);
    }
    lines.push("");
  }

  // Learnings
  if (record.learnings != null && record.learnings.length > 0) {
    lines.push("**Learnings:**", "");
    for (const learning of record.learnings) {
      lines.push(`- ${safeInline(String(learning))}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Render all records into the review entries markdown section.
 * Separates reviews and retrospectives.
 */
export function renderAllRecords(records: RenderableReview[]): string {
  if (records.length === 0) {
    return "## Active Reviews\n\n_No reviews found._\n";
  }

  const reviews = records.filter((r) => r.type !== "retrospective");
  const retros = records.filter((r) => r.type === "retrospective");

  const parts: string[] = [];

  // Retrospectives section
  if (retros.length > 0) {
    const retroSections = retros.map((r) => renderRetroRecord(r));
    parts.push("## Retrospectives\n", retroSections.join("\n---\n\n"), "\n");
  }

  // Active Reviews section
  parts.push("## Active Reviews\n");
  if (reviews.length > 0) {
    const reviewSections = reviews.map((r) => renderReviewRecord(r));
    parts.push(reviewSections.join("\n---\n\n"));
  } else {
    parts.push("_No reviews found._");
  }
  parts.push("\n");

  return parts.join("\n");
}

// ─── Preserved section extraction ────────────────────────────────────────

/**
 * Marker headings that delimit the "preserved" vs "regenerated" regions.
 * Everything from the start of the file up to (but not including) "## Retrospectives"
 * or "## Active Reviews" is the header. Everything from "## Key Patterns" onward
 * is the footer. Both are preserved verbatim.
 */
const REVIEW_START_MARKERS = ["## Retrospectives", "## Active Reviews"];
const FOOTER_MARKERS = ["## Key Patterns"];

interface PreservedSections {
  header: string;
  footer: string;
}

/**
 * Extract the preserved header and footer from the existing markdown file.
 * Returns empty strings if the file doesn't exist or markers aren't found.
 */
function extractPreservedSections(filePath: string): PreservedSections {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return { header: "", footer: "" };
  }

  // Find where the regenerated section starts (first review-start marker)
  let headerEnd = content.length;
  for (const marker of REVIEW_START_MARKERS) {
    const idx = content.indexOf(`\n${marker}`);
    if (idx !== -1 && idx < headerEnd) {
      headerEnd = idx;
    }
  }
  const header = content.slice(0, headerEnd).trimEnd();

  // Find where the footer starts (Key Patterns section)
  let footerStart = -1;
  for (const marker of FOOTER_MARKERS) {
    const idx = content.indexOf(`\n${marker}`);
    if (idx !== -1) {
      footerStart = idx;
      break;
    }
  }
  const footer = footerStart === -1 ? "" : content.slice(footerStart).trimStart();

  return { header, footer };
}

/**
 * Assemble the full markdown document from preserved sections and regenerated entries.
 */
function assembleDocument(
  preserved: PreservedSections,
  renderedEntries: string
): string {
  const parts: string[] = [];

  if (preserved.header) {
    parts.push(preserved.header, ""); // blank line separator
  }

  parts.push(renderedEntries.trim());

  if (preserved.footer) {
    parts.push("", preserved.footer); // blank line separator
  }

  return parts.join("\n") + "\n";
}

// ─── Public API for orchestrator ─────────────────────────────────────────

export interface RenderResult {
  success: boolean;
  recordCount: number;
  outputPath: string | null;
  error?: string;
}

/**
 * Render reviews from JSONL to markdown.
 * Called by the orchestrator (Step 4) or standalone via CLI.
 *
 * @param projectRoot - Absolute path to project root
 * @param options - Optional overrides
 * @returns Result object with success status
 */
export function renderReviews(
  projectRoot: string,
  options?: {
    inputPath?: string;
    outputPath?: string;
    filterPr?: number;
    lastN?: number;
    stdout?: boolean;
  }
): RenderResult {
  // Path traversal guard for API callers (CLI has its own guard)
  if (options?.inputPath) {
    const relInput = path.relative(projectRoot, path.resolve(projectRoot, options.inputPath));
    if (/^\.\.(?:[\\/]|$)/.test(relInput)) {
      return { success: false, recordCount: 0, outputPath: null, error: "Input path outside project root" };
    }
  }
  if (options?.outputPath) {
    const relOutput = path.relative(projectRoot, path.resolve(projectRoot, options.outputPath));
    if (/^\.\.(?:[\\/]|$)/.test(relOutput)) {
      return { success: false, recordCount: 0, outputPath: null, error: "Output path outside project root" };
    }
  }

  const inputPath =
    options?.inputPath ??
    path.join(projectRoot, ".claude", "state", "reviews.jsonl");
  const outputPath =
    options?.outputPath ??
    path.join(projectRoot, "docs", "AI_REVIEW_LEARNINGS_LOG.md");

  // Read raw JSONL (lenient — no schema validation, accepts pre-migration records)
  const rawRecords = readJsonl(inputPath, { safe: true, quiet: true });
  let records = parseRecords(rawRecords);

  // Apply filters
  if (options?.filterPr != null) {
    records = records.filter((r) => r.pr === options.filterPr);
  }
  if (options?.lastN != null) {
    records = records.slice(-options.lastN);
  }

  // Render entries
  const renderedEntries = renderAllRecords(records);

  if (options?.stdout) {
    process.stdout.write(renderedEntries);
    return { success: true, recordCount: records.length, outputPath: null };
  }

  // Security check before reading or writing the output path
  const absOutputPath = path.resolve(outputPath);
  if (!isSafeToWrite(absOutputPath)) {
    const errMsg = "Refusing to write to symlinked path";
    console.error(`[render-reviews-to-md] ${errMsg}`);
    return { success: false, recordCount: records.length, outputPath: absOutputPath, error: errMsg };
  }

  // Extract preserved sections from existing file
  const preserved = extractPreservedSections(outputPath);

  // Assemble full document
  const fullDocument = assembleDocument(preserved, renderedEntries);

  // Ensure output directory exists
  const outDir = path.dirname(absOutputPath);
  fs.mkdirSync(outDir, { recursive: true });

  // Atomic write via safe-fs
  try {
    safeAtomicWriteSync(absOutputPath, fullDocument, { encoding: "utf8" });
  } catch (err: unknown) {
    const errMsg = sanitizeError(err);
    console.error(`[render-reviews-to-md] Write failed: ${errMsg}`);
    return { success: false, recordCount: records.length, outputPath: absOutputPath, error: errMsg };
  }

  return { success: true, recordCount: records.length, outputPath: absOutputPath };
}

// ─── CLI entry point ─────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const projectRoot = findProjectRoot(__dirname);

  // Parse CLI flags
  let filterPr: number | undefined;
  let lastN: number | undefined;
  let stdout = false;
  let inputPath: string | undefined;
  let outputPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--stdout") {
      stdout = true;
    } else if (args[i] === "--input" && i + 1 < args.length) {
      const resolvedInput = path.resolve(projectRoot, args[i + 1]);
      const relInput = path.relative(projectRoot, resolvedInput);
      if (/^\.\.(?:[\\/]|$)/.test(relInput)) {
        console.error("--input must be within the project root");
        process.exit(1);
      }
      inputPath = resolvedInput;
      i++;
    } else if (args[i] === "--output" && i + 1 < args.length) {
      const resolvedOutput = path.resolve(projectRoot, args[i + 1]);
      const relOutput = path.relative(projectRoot, resolvedOutput);
      if (/^\.\.(?:[\\/]|$)/.test(relOutput)) {
        console.error("--output must be within the project root");
        process.exit(1);
      }
      outputPath = resolvedOutput;
      i++;
    } else if (args[i] === "--filter-pr" && i + 1 < args.length) {
      filterPr = Number.parseInt(args[i + 1], 10);
      if (Number.isNaN(filterPr)) {
        console.error("--filter-pr requires a number");
        process.exit(1);
      }
      i++;
    } else if (args[i] === "--last" && i + 1 < args.length) {
      lastN = Number.parseInt(args[i + 1], 10);
      if (Number.isNaN(lastN) || lastN < 1) {
        console.error("--last requires a positive number");
        process.exit(1);
      }
      i++;
    }
  }

  try {
    const result = renderReviews(projectRoot, {
      inputPath,
      outputPath,
      filterPr,
      lastN,
      stdout,
    });

    if (!result.success) {
      console.error(`[render-reviews-to-md] Failed: ${result.error ?? "unknown error"}`);
      process.exit(1);
    }

    if (!stdout && result.outputPath) {
      console.log(
        `[render-reviews-to-md] Wrote ${result.recordCount} record(s) to ${path.relative(projectRoot, result.outputPath)}`
      );
    }
  } catch (err: unknown) {
    console.error(`[render-reviews-to-md] ${sanitizeError(err)}`);
    process.exit(1);
  }
}
