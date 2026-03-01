/**
 * CLI and library for auto-creating DeferredItemRecords from review findings.
 *
 * Library: createDeferredItems(projectRoot, reviewId, items, date)
 * CLI: node dist/write-deferred-items.js --review-id rev-N --date YYYY-MM-DD --items '[...]'
 */

import * as path from "node:path";
import * as fs from "node:fs";
import { DeferredItemRecord, type DeferredItemRecordType } from "./lib/schemas/deferred-item";
import { appendRecord } from "./lib/write-jsonl";

// Walk up from startDir until we find package.json (works from both source and dist)
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

/** Input shape for each deferred item */
export interface DeferredItemInput {
  finding: string;
  reason?: string;
  severity?: string;
}

/**
 * Create DeferredItemRecords from review findings and append to deferred-items.jsonl.
 *
 * Each item gets a unique ID derived from the parent review ID: `{reviewId}-deferred-{N}`.
 *
 * @param projectRoot - Absolute path to project root
 * @param reviewId - Parent review ID (e.g., "rev-399")
 * @param items - Array of deferred findings
 * @param date - Date string in YYYY-MM-DD format
 * @returns Array of validated records that were written
 */
export function createDeferredItems(
  projectRoot: string,
  reviewId: string,
  items: DeferredItemInput[],
  date: string
): DeferredItemRecordType[] {
  if (items.length === 0) return [];

  if (!/^rev-\d+(?:-[a-z0-9]+)?$/.test(reviewId)) {
    throw new Error(`Invalid reviewId format: ${reviewId}`);
  }

  const filePath = path.resolve(projectRoot, "data/ecosystem-v2/deferred-items.jsonl");
  const created: DeferredItemRecordType[] = [];

  // Scan existing items to prevent duplicate IDs on reruns
  let startIndex = 1;
  try {
    const existing = fs.readFileSync(filePath, "utf8");
    let maxExisting = 0;
    for (const line of existing.split("\n")) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line) as { id?: unknown };
        const id = typeof parsed.id === "string" ? parsed.id : "";
        const escapedId = reviewId.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
        const m = new RegExp("^" + escapedId + String.raw`-deferred-(\d+)$`).exec(id);
        if (m) {
          const n = Number.parseInt(m[1], 10);
          if (n > maxExisting) maxExisting = n;
        }
      } catch {
        // ignore malformed lines
      }
    }
    startIndex = maxExisting + 1;
  } catch {
    // file doesn't exist yet — start at 1
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const record = {
      id: `${reviewId}-deferred-${startIndex + i}`,
      date,
      schema_version: 1,
      completeness: "full" as const,
      completeness_missing: [],
      origin: {
        type: "pr-review" as const,
        tool: "write-deferred-items.ts",
      },
      review_id: reviewId,
      finding: item.finding,
      reason: item.reason ?? null,
      severity: item.severity ?? null,
      status: "open" as const,
      defer_count: 1,
      promoted_to_debt: false,
    };

    // Validate with Zod -- throws ZodError on failure
    const validated = DeferredItemRecord.parse(record);

    // Write using appendRecord (handles locking, symlink guard, mkdir)
    appendRecord(filePath, validated, DeferredItemRecord);

    created.push(validated);
  }

  return created;
}

// ---- CLI entry point --------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);

  const reviewIdIdx = args.indexOf("--review-id");
  const dateIdx = args.indexOf("--date");
  const itemsIdx = args.indexOf("--items");

  if (
    reviewIdIdx === -1 ||
    reviewIdIdx + 1 >= args.length ||
    dateIdx === -1 ||
    dateIdx + 1 >= args.length ||
    itemsIdx === -1 ||
    itemsIdx + 1 >= args.length
  ) {
    console.error(
      "Usage: write-deferred-items --review-id rev-N --date YYYY-MM-DD --items '[...]'"
    );
    process.exit(1);
  }

  const reviewId = args[reviewIdIdx + 1];
  const date = args[dateIdx + 1];

  let items: DeferredItemInput[];
  try {
    const parsed: unknown = JSON.parse(args[itemsIdx + 1]);
    if (!Array.isArray(parsed)) {
      console.error("Error: --items must be a valid JSON array");
      process.exit(1);
    }
    items = parsed as DeferredItemInput[];
  } catch {
    console.error("Error: --items must be valid JSON array");
    process.exit(1);
  }

  const projectRoot = findProjectRoot(__dirname);

  try {
    const records = createDeferredItems(projectRoot, reviewId, items, date);
    console.log(
      `Created ${records.length} deferred item(s) for ${reviewId} in deferred-items.jsonl`
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Validation error: ${err.message}`);
    } else {
      console.error("Unknown error");
    }
    process.exit(1);
  }
}

// Only run CLI when executed directly (not imported)
if (require.main === module) {
  main();
}
