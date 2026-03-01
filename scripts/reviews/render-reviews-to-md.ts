/**
 * JSONL-to-markdown renderer for review records.
 *
 * Reads data/ecosystem-v2/reviews.jsonl and produces human-readable markdown.
 *
 * Usage:
 *   node dist/render-reviews-to-md.js              # stdout
 *   node dist/render-reviews-to-md.js --output f   # write to file
 *   node dist/render-reviews-to-md.js --filter-pr 399
 *   node dist/render-reviews-to-md.js --last 5
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { ReviewRecord, type ReviewRecordType } from "./lib/schemas/review";
import { readValidatedJsonl } from "./lib/read-jsonl";

// Walk up from startDir until we find package.json
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

/**
 * Render a single ReviewRecord as a markdown section.
 *
 * Handles partial/stub records gracefully: renders available fields,
 * skips null fields, notes completeness tier if not "full".
 */
export function renderReviewRecord(record: ReviewRecordType): string {
  const lines: string[] = [];

  // Heading
  const title = record.title ?? "(untitled)";
  lines.push(`### Review ${record.id}: ${title}`, "");

  // Completeness note for non-full records
  if (record.completeness !== "full") {
    renderCompletenessNote(lines, record);
  }

  // Metadata line
  renderMetadata(lines, record);

  // Stats table (only if we have total)
  if (record.total != null) {
    lines.push(
      "| Total | Fixed | Deferred | Rejected |",
      "|-------|-------|----------|----------|",
      `| ${record.total} | ${record.fixed ?? "-"} | ${record.deferred ?? "-"} | ${record.rejected ?? "-"} |`,
      ""
    );
  }

  // Severity breakdown
  if (record.severity_breakdown != null) {
    renderSeverityBreakdown(lines, record.severity_breakdown);
  }

  // Patterns
  if (record.patterns != null && record.patterns.length > 0) {
    lines.push("**Patterns:**", "");
    for (const pattern of record.patterns) {
      lines.push(`- ${pattern}`);
    }
    lines.push("");
  }

  // Learnings
  if (record.learnings != null && record.learnings.length > 0) {
    lines.push("**Learnings:**", "");
    for (const learning of record.learnings) {
      lines.push(`- ${learning}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/** Render completeness note for non-full records. */
function renderCompletenessNote(lines: string[], record: ReviewRecordType): void {
  lines.push(`> **Completeness:** ${record.completeness}`);
  if (record.completeness_missing && record.completeness_missing.length > 0) {
    lines.push(`> **Missing fields:** ${record.completeness_missing.join(", ")}`);
  }
  lines.push("");
}

/** Render metadata line (date, PR, source). */
function renderMetadata(lines: string[], record: ReviewRecordType): void {
  const metaParts: string[] = [];
  metaParts.push(`**Date:** ${record.date}`);
  if (record.pr != null) {
    metaParts.push(`**PR:** #${record.pr}`);
  }
  if (record.source != null) {
    metaParts.push(`**Source:** ${record.source}`);
  }
  lines.push(metaParts.join(" | "), "");
}

/** Render severity breakdown table. */
function renderSeverityBreakdown(
  lines: string[],
  sb: NonNullable<ReviewRecordType["severity_breakdown"]>
): void {
  lines.push(
    "**Severity Breakdown:**",
    "",
    "| Critical | Major | Minor | Trivial |",
    "|----------|-------|-------|---------|",
    `| ${sb.critical} | ${sb.major} | ${sb.minor} | ${sb.trivial} |`,
    ""
  );
}

/**
 * Render multiple ReviewRecords as a single markdown document.
 */
export function renderReviewsToMarkdown(records: ReviewRecordType[]): string {
  if (records.length === 0) {
    return "No reviews found.\n";
  }

  const sections = records.map((r) => renderReviewRecord(r));
  return sections.join("\n---\n\n") + "\n";
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const projectRoot = findProjectRoot(__dirname);
  const filePath = path.join(projectRoot, "data", "ecosystem-v2", "reviews.jsonl");

  // Parse CLI flags
  let outputPath: string | null = null;
  let filterPr: number | null = null;
  let lastN: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--output" && i + 1 < args.length) {
      outputPath = args[i + 1];
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

  // Read and validate records
  const { valid: records, warnings } = readValidatedJsonl(filePath, ReviewRecord, { quiet: true });

  if (warnings.length > 0) {
    console.error(`Warning: ${warnings.length} invalid record(s) skipped`);
  }

  // Apply filters
  let filtered = records;

  if (filterPr !== null) {
    filtered = filtered.filter((r) => r.pr === filterPr);
  }

  if (lastN !== null) {
    filtered = filtered.slice(-lastN);
  }

  // Render
  const markdown = renderReviewsToMarkdown(filtered);

  // Output
  if (outputPath) {
    const resolvedOut = path.resolve(projectRoot, outputPath);
    const projectRootReal = fs.realpathSync(projectRoot);

    const rel = path.relative(projectRootReal, resolvedOut);
    if (/^\.\.(?:[\\/]|$)/.test(rel)) {
      console.error("--output must be within the project root");
      process.exit(1);
    }

    const outDir = path.dirname(resolvedOut);
    fs.mkdirSync(outDir, { recursive: true });

    const outDirReal = fs.realpathSync(outDir);
    const dirRel = path.relative(projectRootReal, outDirReal);
    if (/^\.\.(?:[\\/]|$)/.test(dirRel)) {
      console.error("--output must be within the project root (symlink escape detected)");
      process.exit(1);
    }

    if (fs.existsSync(resolvedOut)) {
      const st = fs.lstatSync(resolvedOut);
      if (st.isSymbolicLink()) {
        console.error("--output must not be a symlink");
        process.exit(1);
      }
      if (!st.isFile()) {
        console.error("--output must be a file path (not a directory or special file)");
        process.exit(1);
      }
      const outReal = fs.realpathSync(resolvedOut);
      const outRel = path.relative(projectRootReal, outReal);
      if (/^\.\.(?:[\\/]|$)/.test(outRel)) {
        console.error("--output must be within the project root (symlink escape detected)");
        process.exit(1);
      }
    }

    const tmpPath = `${resolvedOut}.tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(tmpPath, markdown, "utf8");
    try {
      fs.renameSync(tmpPath, resolvedOut);
    } catch {
      // Cross-device fallback
      fs.copyFileSync(tmpPath, resolvedOut);
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* best-effort */
      }
    }
    console.log(`Wrote ${filtered.length} review(s) to ${outputPath}`);
  } else {
    process.stdout.write(markdown);
  }
}
