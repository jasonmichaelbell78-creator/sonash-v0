/**
 * Deduplicate review-sourced entries in MASTER_DEBT.jsonl by content_hash.
 *
 * - Entries with identical content_hash are collapsed to the one with the lowest DEBT-NNNN ID.
 * - Non-review-sourced entries pass through untouched.
 * - Entries without content_hash are always kept.
 * - After writing MASTER_DEBT.jsonl, copies to raw/deduped.jsonl (MEMORY.md sync rule).
 * - Idempotent: running on already-deduped data produces identical output.
 */

import * as fs from "fs";
import * as path from "path";

// =========================================================
// Types
// =========================================================

export interface DebtItem {
  id: string;
  content_hash?: string;
  source?: string;
  title?: string;
  [key: string]: unknown;
}

export interface DedupResult {
  kept: DebtItem[];
  removed: DebtItem[];
  flagged: DebtItem[];
}

// =========================================================
// Review source detection
// =========================================================

const REVIEW_SOURCES = new Set(["review", "pr-review", "pr-review-366-r2", "pr-deferred"]);

function isReviewSourced(item: DebtItem): boolean {
  if (!item.source) return false;
  return REVIEW_SOURCES.has(item.source);
}

// =========================================================
// ID parsing
// =========================================================

function parseDebtId(id: string): number {
  const match = /^DEBT-(\d+)$/.exec(id);
  if (!match) return Infinity;
  return parseInt(match[1], 10);
}

// =========================================================
// Core dedup logic (pure function, testable)
// =========================================================

export function dedupReviewSourced(items: DebtItem[]): DedupResult {
  const reviewItems: DebtItem[] = [];
  const nonReviewItems: DebtItem[] = [];

  // Separate by source
  for (const item of items) {
    if (isReviewSourced(item)) {
      reviewItems.push(item);
    } else {
      nonReviewItems.push(item);
    }
  }

  // Dedup review-sourced by content_hash
  const hashGroups = new Map<string, DebtItem[]>();
  const noHashItems: DebtItem[] = [];

  for (const item of reviewItems) {
    if (!item.content_hash) {
      noHashItems.push(item);
      continue;
    }
    const group = hashGroups.get(item.content_hash);
    if (group) {
      group.push(item);
    } else {
      hashGroups.set(item.content_hash, [item]);
    }
  }

  const kept: DebtItem[] = [];
  const removed: DebtItem[] = [];

  for (const [hash, group] of hashGroups) {
    // Sort by DEBT-NNNN ID ascending, keep lowest
    group.sort((a, b) => parseDebtId(a.id) - parseDebtId(b.id));
    kept.push(group[0]);
    for (let i = 1; i < group.length; i++) {
      removed.push(group[i]);
      console.log(
        `Dedup: keeping ${group[0].id}, removing ${group[i].id} (same content_hash: ${hash.slice(0, 12)})`
      );
    }
  }

  // Items without content_hash are always kept
  kept.push(...noHashItems);

  // Secondary pass: flag title+source near-duplicates (do NOT remove)
  const flagged: DebtItem[] = [];
  const titleSourceMap = new Map<string, DebtItem[]>();

  for (const item of kept) {
    if (!item.title || !item.source) continue;
    const key = `${item.title}|||${item.source}`;
    const group = titleSourceMap.get(key);
    if (group) {
      group.push(item);
    } else {
      titleSourceMap.set(key, [item]);
    }
  }

  for (const [_key, group] of titleSourceMap) {
    if (group.length > 1) {
      // Flag all entries in the group (but don't remove)
      for (const item of group) {
        flagged.push(item);
      }
      console.log(
        `Potential title-based duplicates (not removed): ${group.map((i) => i.id).join(", ")} -- "${group[0].title?.slice(0, 60)}"`
      );
    }
  }

  // Reassemble: non-review (untouched) + deduplicated review entries
  const allKept = [...nonReviewItems, ...kept];

  // Sort by DEBT-NNNN ID for consistent ordering
  allKept.sort((a, b) => parseDebtId(a.id) - parseDebtId(b.id));

  return { kept: allKept, removed, flagged };
}

// =========================================================
// File I/O
// =========================================================

function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

function main(): void {
  const projectRoot = findProjectRoot(__dirname);
  const masterPath = path.join(projectRoot, "docs", "technical-debt", "MASTER_DEBT.jsonl");
  const dedupedPath = path.join(projectRoot, "docs", "technical-debt", "raw", "deduped.jsonl");

  // Read MASTER_DEBT.jsonl
  let rawContent: string;
  try {
    rawContent = fs.readFileSync(masterPath, "utf8");
  } catch (err) {
    console.error("Failed to read MASTER_DEBT.jsonl");
    process.exit(1);
  }

  const lines = rawContent.trim().split("\n");
  const items: DebtItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      items.push(JSON.parse(line) as DebtItem);
    } catch {
      console.warn(`Warning: malformed JSON at line ${i + 1}, skipping`);
    }
  }

  const totalBefore = items.length;
  const result = dedupReviewSourced(items);
  const totalAfter = result.kept.length;

  // Write MASTER_DEBT.jsonl atomically (write to temp then rename)
  const tmpPath = masterPath + ".tmp";
  try {
    const output = result.kept.map((item) => JSON.stringify(item)).join("\n") + "\n";
    fs.writeFileSync(tmpPath, output, "utf8");
    fs.renameSync(tmpPath, masterPath);
  } catch (err) {
    console.error("Failed to write MASTER_DEBT.jsonl");
    // Clean up temp file
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // ignore cleanup failure
    }
    process.exit(1);
  }

  // CRITICAL: Sync to raw/deduped.jsonl (per MEMORY.md)
  try {
    fs.mkdirSync(path.dirname(dedupedPath), { recursive: true });
    fs.copyFileSync(masterPath, dedupedPath);
  } catch (err) {
    console.error("Failed to sync raw/deduped.jsonl");
    process.exit(1);
  }

  // Summary
  console.log("\n=== Dedup Summary ===");
  console.log(`Total entries before: ${totalBefore}`);
  console.log(`Duplicates removed:   ${result.removed.length}`);
  console.log(`Total entries after:  ${totalAfter}`);
  console.log(`Title-based flags:    ${result.flagged.length}`);

  if (result.removed.length === 0) {
    console.log("\nNo duplicates found -- data is already clean.");
  }
}

// Only run main when executed directly (not when imported for testing)
if (require.main === module) {
  main();
}
