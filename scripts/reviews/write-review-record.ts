/**
 * CLI and programmatic interface for writing validated ReviewRecords to reviews.jsonl.
 *
 * Usage:
 *   npx tsc && node dist/write-review-record.js --data '{"pr":399,...}'
 *
 * Validates input against ReviewRecord schema, auto-assigns ID if missing,
 * and appends to data/ecosystem-v2/reviews.jsonl.
 */

import * as fs from "fs";
import * as path from "path";
import { ReviewRecord } from "./lib/schemas/review";
import { appendRecord } from "./lib/write-jsonl";

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
 * Read reviews.jsonl and determine the next auto-assigned review ID.
 * Returns "rev-1" if the file is empty or missing.
 */
export function getNextReviewId(projectRoot: string): string {
  const filePath = path.join(projectRoot, "data", "ecosystem-v2", "reviews.jsonl");
  let maxNum = 0;

  try {
    const content = fs.readFileSync(filePath, "utf8").trim();
    if (!content) return "rev-1";

    const lines = content.split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const record = JSON.parse(line) as { id?: string };
        if (record.id) {
          const match = /^rev-(\d+)$/.exec(record.id);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }
      } catch {
        // Skip malformed lines
      }
    }
  } catch {
    // File doesn't exist or can't be read -- start at 1
    return "rev-1";
  }

  return `rev-${maxNum + 1}`;
}

/**
 * Write a validated ReviewRecord to reviews.jsonl.
 *
 * If data has no `id` field, auto-assigns the next rev-N ID.
 * Validates against ReviewRecord schema before writing.
 * Throws ZodError on validation failure.
 *
 * @param projectRoot - Absolute path to project root
 * @param data - Record data (id optional -- will be auto-assigned)
 * @returns The validated record that was written
 */
export function writeReviewRecord(
  projectRoot: string,
  data: Record<string, unknown>
): ReturnType<typeof ReviewRecord.parse> {
  const filePath = path.join(projectRoot, "data", "ecosystem-v2", "reviews.jsonl");

  // Auto-assign ID if not provided
  if (!data.id) {
    data.id = getNextReviewId(projectRoot);
  }

  // Validate -- throws ZodError if invalid
  const validated = ReviewRecord.parse(data);

  // Append to JSONL file
  appendRecord(filePath, validated, ReviewRecord);

  return validated;
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const dataIdx = args.indexOf("--data");

  if (dataIdx === -1 || dataIdx + 1 >= args.length) {
    console.error("Usage: write-review-record.js --data '{\"pr\":399,...}'");
    process.exit(1);
  }

  const rawJson = args[dataIdx + 1];

  try {
    const data = JSON.parse(rawJson) as Record<string, unknown>;
    const projectRoot = findProjectRoot(__dirname);
    const record = writeReviewRecord(projectRoot, data);
    console.log(`Wrote review ${record.id} to reviews.jsonl`);
  } catch (err: unknown) {
    if (err instanceof SyntaxError) {
      console.error(`Invalid JSON: ${err.message}`);
    } else if (err instanceof Error && err.name === "ZodError") {
      console.error(`Validation error:\n${err.message}`);
    } else if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
    } else {
      console.error("Unknown error");
    }
    process.exit(1);
  }
}
