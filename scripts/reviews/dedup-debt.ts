/**
 * Deduplicate review-sourced entries in MASTER_DEBT.jsonl by content_hash.
 *
 * - Entries with identical content_hash are collapsed to the one with the lowest DEBT-NNNN ID.
 * - Non-review-sourced entries pass through untouched.
 * - Entries without content_hash are always kept.
 * - After writing MASTER_DEBT.jsonl, copies to raw/deduped.jsonl (MEMORY.md sync rule).
 * - Idempotent: running on already-deduped data produces identical output.
 */

import * as fs from "node:fs";
import * as path from "node:path";

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

const REVIEW_SOURCES = new Set(["review", "pr-review", "pr-deferred"]);

function isReviewSourced(item: DebtItem): boolean {
  if (!item.source) return false;
  if (REVIEW_SOURCES.has(item.source)) return true;
  // Treat session-tagged PR review sources as review-sourced (e.g., "pr-review-366-r2")
  if (item.source.startsWith("pr-review-")) return true;
  if (item.source.startsWith("pr-deferred-")) return true;
  return false;
}

// =========================================================
// ID parsing
// =========================================================

function parseDebtId(id: string): number {
  const match = /^DEBT-(\d+)$/.exec(id);
  if (!match) return Infinity;
  return Number.parseInt(match[1], 10);
}

// =========================================================
// Core dedup logic (pure function, testable)
// =========================================================

/** Separate items into review-sourced and non-review-sourced. */
function partitionBySource(items: DebtItem[]): {
  reviewItems: DebtItem[];
  nonReviewItems: DebtItem[];
} {
  const reviewItems: DebtItem[] = [];
  const nonReviewItems: DebtItem[] = [];
  for (const item of items) {
    if (isReviewSourced(item)) {
      reviewItems.push(item);
    } else {
      nonReviewItems.push(item);
    }
  }
  return { reviewItems, nonReviewItems };
}

/** Group review items by content_hash, separating items without a hash. */
function groupByContentHash(reviewItems: DebtItem[]): {
  hashGroups: Map<string, DebtItem[]>;
  noHashItems: DebtItem[];
} {
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
  return { hashGroups, noHashItems };
}

/** Collapse hash groups, keeping the entry with the lowest DEBT-NNNN ID. */
function collapseHashGroups(
  hashGroups: Map<string, DebtItem[]>,
  logger: (msg: string) => void = console.log
): {
  kept: DebtItem[];
  removed: DebtItem[];
} {
  const kept: DebtItem[] = [];
  const removed: DebtItem[] = [];
  for (const [hash, group] of hashGroups) {
    group.sort((a, b) => {
      const ai = parseDebtId(a.id);
      const bi = parseDebtId(b.id);
      if (ai !== bi) return ai - bi;
      return a.id.localeCompare(b.id);
    });
    kept.push(group[0]);
    for (let i = 1; i < group.length; i++) {
      removed.push(group[i]);
      logger(
        `Dedup: keeping ${group[0].id}, removing ${group[i].id} (same content_hash: ${hash.slice(0, 12)})`
      );
    }
  }
  return { kept, removed };
}

/** Flag title+source near-duplicates (does NOT remove them). */
function flagTitleSourceDuplicates(
  items: DebtItem[],
  logger: (msg: string) => void = console.log
): DebtItem[] {
  const flagged: DebtItem[] = [];
  const titleSourceMap = new Map<string, DebtItem[]>();

  for (const item of items) {
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
      for (const item of group) {
        flagged.push(item);
      }
      logger(
        `Potential title-based duplicates (not removed): ${group.map((i) => i.id).join(", ")} -- "${group[0].title?.slice(0, 60)}"`
      );
    }
  }

  return flagged;
}

export function dedupReviewSourced(
  items: DebtItem[],
  logger: (msg: string) => void = console.log
): DedupResult {
  const { reviewItems, nonReviewItems } = partitionBySource(items);
  const { hashGroups, noHashItems } = groupByContentHash(reviewItems);
  const { kept, removed } = collapseHashGroups(hashGroups, logger);

  // Items without content_hash are always kept
  kept.push(...noHashItems);

  // Secondary pass: flag title+source near-duplicates (do NOT remove)
  const flagged = flagTitleSourceDuplicates(kept, logger);

  // Reassemble: non-review (untouched) + deduplicated review entries
  const allKept = [...nonReviewItems, ...kept];

  // Sort by DEBT-NNNN ID for consistent ordering
  allKept.sort((a, b) => {
    const ai = parseDebtId(a.id);
    const bi = parseDebtId(b.id);
    if (ai !== bi) return ai - bi;
    return a.id.localeCompare(b.id);
  });

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

/** Read and parse MASTER_DEBT.jsonl into DebtItem array. */
function readDebtItems(masterPath: string): DebtItem[] {
  let rawContent: string;
  try {
    rawContent = fs.readFileSync(masterPath, "utf8");
  } catch (err) {
    console.error(
      "Failed to read MASTER_DEBT.jsonl:",
      err instanceof Error ? err.message : String(err)
    );
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
  return items;
}

function guardAgainstSymlinks(paths: string[]): void {
  for (const p of paths) {
    if (!fs.existsSync(p)) continue;
    try {
      if (fs.lstatSync(p).isSymbolicLink()) {
        console.error(`Refusing to write: ${path.basename(p)} is a symlink`);
        process.exit(1);
      }
    } catch {
      console.error(`Refusing to write: could not stat ${path.basename(p)}`);
      process.exit(1);
    }
  }
}

function atomicWriteWithFallback(tmpPath: string, destPath: string): void {
  try {
    fs.renameSync(tmpPath, destPath);
  } catch {
    // Cross-device fallback (re-check safety before non-atomic write)
    if (fs.existsSync(destPath)) {
      const st = fs.lstatSync(destPath);
      if (st.isSymbolicLink()) {
        throw new Error(`Refusing to write: ${path.basename(destPath)} became a symlink`);
      }
      if (!st.isFile()) {
        throw new Error(`Refusing to write: ${path.basename(destPath)} is not a regular file`);
      }
      fs.copyFileSync(tmpPath, destPath);
    } else {
      // Destination doesn't exist: use create-only flag to avoid clobbering via race
      const data = fs.readFileSync(tmpPath);
      const fd = fs.openSync(destPath, "wx", 0o644);
      try {
        fs.writeFileSync(fd, data);
      } finally {
        fs.closeSync(fd);
      }
    }
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // Intentionally swallowed: best-effort cleanup of tmp file after cross-device copy
    }
  }
}

/** Write dedup result to MASTER_DEBT.jsonl atomically and sync to raw/deduped.jsonl. */
function writeDebtOutput(masterPath: string, dedupedPath: string, result: DedupResult): void {
  guardAgainstSymlinks([masterPath, dedupedPath]);
  const tmpPath = `${masterPath}.tmp-${process.pid}-${Date.now()}`;
  try {
    const output = result.kept.map((item) => JSON.stringify(item)).join("\n") + "\n";
    fs.writeFileSync(tmpPath, output, "utf8");
    atomicWriteWithFallback(tmpPath, masterPath);
  } catch (err) {
    console.error(
      "Failed to write MASTER_DEBT.jsonl:",
      err instanceof Error ? err.message : String(err)
    );
    process.exit(1);
  } finally {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {
      // Intentionally swallowed: best-effort cleanup of temp file; failure is non-fatal
    }
  }

  // CRITICAL: Sync to raw/deduped.jsonl (per MEMORY.md)
  try {
    fs.mkdirSync(path.dirname(dedupedPath), { recursive: true });
    fs.copyFileSync(masterPath, dedupedPath);
  } catch (err) {
    console.error(
      "Failed to sync raw/deduped.jsonl:",
      err instanceof Error ? err.message : String(err)
    );
    process.exit(1);
  }
}

function main(): void {
  const projectRoot = findProjectRoot(__dirname);
  const masterPath = path.join(projectRoot, "docs", "technical-debt", "MASTER_DEBT.jsonl");
  const dedupedPath = path.join(projectRoot, "docs", "technical-debt", "raw", "deduped.jsonl");

  const items = readDebtItems(masterPath);
  const totalBefore = items.length;
  const result = dedupReviewSourced(items);

  writeDebtOutput(masterPath, dedupedPath, result);

  console.log("\n=== Dedup Summary ===");
  console.log(`Total entries before: ${totalBefore}`);
  console.log(`Duplicates removed:   ${result.removed.length}`);
  console.log(`Total entries after:  ${result.kept.length}`);
  console.log(`Title-based flags:    ${result.flagged.length}`);

  if (result.removed.length === 0) {
    console.log("\nNo duplicates found -- data is already clean.");
  }
}

// Only run main when executed directly (not when imported for testing)
if (require.main === module) {
  main();
}
