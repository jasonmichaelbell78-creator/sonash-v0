/**
 * Idempotency tests for the debt pipeline
 *
 * Tests that running key pipeline operations twice produces identical results.
 * These tests exercise the pure logic (no real file I/O).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as crypto from "node:crypto";

// ─── Shared types ─────────────────────────────────────────────────────────────

interface DebtItem {
  source_id?: string;
  content_hash?: string;
  severity?: string;
  status?: string;
  category?: string;
  file?: string;
  line?: number;
  title?: string;
  description?: string;
  recommendation?: string;
  merged_from?: string[];
  evidence?: unknown[];
  cluster_id?: string;
  cluster_count?: number;
  cluster_primary?: boolean;
  [key: string]: unknown;
}

// ─── Dedup logic (from dedup-multi-pass.js) ──────────────────────────────────

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeParametric(title: string): string {
  if (!title) return "";
  return title.replace(/\d+/g, "#");
}

function toLineNumber(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function evidenceToKey(e: unknown): string {
  if (typeof e === "string") return `str:${e}`;
  if (e == null || typeof e !== "object") return `prim:${typeof e}:${String(e)}`;
  try {
    return `json:${JSON.stringify(e)}`;
  } catch {
    return `[unserializable]`;
  }
}

function mergeEvidence(existing: unknown[], incoming: unknown[]): unknown[] {
  const base = Array.isArray(existing) ? existing : [];
  const incomingArr = Array.isArray(incoming) ? incoming : [];
  const seen = new Set(base.map(evidenceToKey));
  const added: unknown[] = [];
  for (const e of incomingArr) {
    const k = evidenceToKey(e);
    if (seen.has(k)) continue;
    seen.add(k);
    added.push(e);
  }
  return [...base, ...added];
}

function mergeItems(primary: DebtItem, secondary: DebtItem): DebtItem {
  const merged: DebtItem = { ...primary };
  if (secondary.description && secondary.description.length > (primary.description ?? "").length) {
    merged.description = secondary.description;
  }
  if (
    secondary.recommendation &&
    secondary.recommendation.length > (primary.recommendation ?? "").length
  ) {
    merged.recommendation = secondary.recommendation;
  }
  const sevRank: Record<string, number> = { S0: 0, S1: 1, S2: 2, S3: 3 };
  const primaryRank = sevRank[primary.severity ?? ""] ?? 99;
  const secondaryRank = sevRank[secondary.severity ?? ""] ?? 99;
  if (secondaryRank < primaryRank) merged.severity = secondary.severity;
  if (!merged.merged_from) merged.merged_from = [];
  if (typeof secondary.source_id === "string" && secondary.source_id.trim()) {
    if (!merged.merged_from.includes(secondary.source_id)) {
      merged.merged_from.push(secondary.source_id);
    }
  }
  merged.evidence = mergeEvidence(merged.evidence ?? [], secondary.evidence ?? []) as unknown[];
  return merged;
}

function runPass1ExactHash(items: DebtItem[]): DebtItem[] {
  const hashMap = new Map<string, DebtItem>();
  const noHashItems: DebtItem[] = [];

  for (const item of items) {
    const hash =
      typeof item.content_hash === "string" && item.content_hash.trim() ? item.content_hash : null;
    if (!hash) {
      noHashItems.push(item);
      continue;
    }
    if (hashMap.has(hash)) {
      hashMap.set(hash, mergeItems(hashMap.get(hash)!, item));
    } else {
      hashMap.set(hash, item);
    }
  }

  return [...hashMap.values(), ...noHashItems];
}

function isNearMatch(a: DebtItem, b: DebtItem): boolean {
  if (a.file !== b.file || !a.file) return false;
  if (!Number.isFinite(a.line) || !Number.isFinite(b.line)) return false;
  if ((a.line ?? 0) <= 0 || (b.line ?? 0) <= 0) return false;
  if (Math.abs((a.line ?? 0) - (b.line ?? 0)) > 5) return false;
  return stringSimilarity(normalizeText(a.title ?? ""), normalizeText(b.title ?? "")) >= 0.8;
}

function runPass2NearMatch(items: DebtItem[]): DebtItem[] {
  const output: DebtItem[] = [];
  const removed = new Set<number>();
  for (let i = 0; i < items.length; i++) {
    if (removed.has(i)) continue;
    let current = items[i];
    for (let j = i + 1; j < items.length; j++) {
      if (removed.has(j)) continue;
      if (isNearMatch(current, items[j])) {
        current = mergeItems(current, items[j]);
        removed.add(j);
      }
    }
    output.push(current);
  }
  return output;
}

function runPass0Parametric(items: DebtItem[]): DebtItem[] {
  const parametricGroups = new Map<string, DebtItem[]>();
  for (const item of items) {
    const paramTitle = normalizeParametric(item.title ?? "");
    const key = `${item.file ?? ""}::${paramTitle}`;
    if (!parametricGroups.has(key)) parametricGroups.set(key, []);
    parametricGroups.get(key)!.push(item);
  }

  const result: DebtItem[] = [];
  for (const [, group] of parametricGroups) {
    if (group.length <= 1) {
      result.push(...group);
      continue;
    }
    const uniqueLines = new Set(group.map((g) => toLineNumber(g.line)));
    uniqueLines.delete(null);
    if (uniqueLines.size <= 1) {
      result.push(...group);
      continue;
    }
    const hasHighSeverity = group.some((g) => g.severity === "S0" || g.severity === "S1");
    if (hasHighSeverity) {
      result.push(...group);
      continue;
    }
    const sorted = [...group].sort(
      (a, b) => (toLineNumber(a.line) ?? Infinity) - (toLineNumber(b.line) ?? Infinity)
    );
    let primary = sorted[0];
    for (let k = 1; k < sorted.length; k++) {
      primary = mergeItems(primary, sorted[k]);
    }
    result.push(primary);
  }
  return result;
}

// Simulate a full dedup run
function runFullDedup(items: DebtItem[]): DebtItem[] {
  const pass0 = runPass0Parametric(items);
  const pass1 = runPass1ExactHash(pass0);
  const pass2 = runPass2NearMatch(pass1);
  return pass2;
}

// Compute hash for an item (simpler than the real one, for test purposes)
function computeTestHash(item: DebtItem): string {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify([
        (item.file ?? "").toLowerCase(),
        item.line ?? 0,
        (item.title ?? "").toLowerCase().substring(0, 100),
        (item.description ?? "").toLowerCase().substring(0, 200),
      ])
    )
    .digest("hex");
}

// Sync deduped logic (from sync-deduped.js)
function computeSync(
  masterMap: Map<string, DebtItem>,
  dedupedItems: DebtItem[]
): { severityChanges: number; statusChanges: number } {
  let severityChanges = 0;
  let statusChanges = 0;
  for (const dedupedItem of dedupedItems) {
    const masterItem = masterMap.get(dedupedItem.content_hash ?? "");
    if (!masterItem) continue;
    if (masterItem.severity !== undefined && dedupedItem.severity !== masterItem.severity) {
      dedupedItem.severity = masterItem.severity;
      severityChanges++;
    }
    if (masterItem.status !== undefined && dedupedItem.status !== masterItem.status) {
      dedupedItem.status = masterItem.status;
      statusChanges++;
    }
  }
  return { severityChanges, statusChanges };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("idempotency: dedup-multi-pass run twice produces identical output", () => {
  it("running exact-hash dedup twice on pre-deduped input produces same result", () => {
    const items: DebtItem[] = [
      { source_id: "a", content_hash: "hash1", severity: "S2", title: "Issue A" },
      { source_id: "b", content_hash: "hash2", severity: "S1", title: "Issue B" },
      { source_id: "c", content_hash: "hash3", severity: "S3", title: "Issue C" },
    ];

    // First run
    const firstRun = runPass1ExactHash(JSON.parse(JSON.stringify(items)) as DebtItem[]);
    // Second run on the output of the first
    const secondRun = runPass1ExactHash(JSON.parse(JSON.stringify(firstRun)) as DebtItem[]);

    assert.strictEqual(firstRun.length, secondRun.length, "Item count should be identical");
    assert.deepStrictEqual(
      firstRun.map((i) => i.content_hash).sort(),
      secondRun.map((i) => i.content_hash).sort(),
      "Content hashes should be identical"
    );
  });

  it("running full dedup twice on known duplicates gives zero new removals on second run", () => {
    // Create items with known duplicates (same content_hash)
    const items: DebtItem[] = [
      {
        source_id: "a",
        content_hash: "hash1",
        severity: "S2",
        title: "Duplicate issue",
        file: "src/a.ts",
        line: 10,
      },
      {
        source_id: "b",
        content_hash: "hash1",
        severity: "S2",
        title: "Duplicate issue",
        file: "src/a.ts",
        line: 10,
      }, // exact dup
      {
        source_id: "c",
        content_hash: "hash2",
        severity: "S1",
        title: "Unique issue",
        file: "src/b.ts",
        line: 5,
      },
    ];

    // First run — should reduce 3 → 2
    const firstRun = runFullDedup(JSON.parse(JSON.stringify(items)) as DebtItem[]);
    const firstCount = firstRun.length;

    // Second run — should remain at 2 (no new dedup)
    const secondRun = runFullDedup(JSON.parse(JSON.stringify(firstRun)) as DebtItem[]);
    const secondCount = secondRun.length;

    assert.strictEqual(
      secondCount,
      firstCount,
      "Second dedup run should not remove any more items"
    );
    assert.ok(secondCount < items.length, "First run should have deduped");
  });

  it("running near-match dedup twice produces no additional merges on second run", () => {
    // Near-match items that will merge on first run
    const items: DebtItem[] = [
      {
        source_id: "a",
        content_hash: "h1",
        file: "src/a.ts",
        line: 10,
        title: "Avoid using raw Math.random in code",
      },
      {
        source_id: "b",
        content_hash: "h2",
        file: "src/a.ts",
        line: 12,
        title: "Avoid using raw Math.random() in code",
      }, // near match
      {
        source_id: "c",
        content_hash: "h3",
        file: "src/b.ts",
        line: 5,
        title: "Completely different issue here",
      },
    ];

    const firstRun = runPass2NearMatch(JSON.parse(JSON.stringify(items)) as DebtItem[]);
    const firstCount = firstRun.length;

    // Assign hashes to merged items (simulate what dedup does)
    firstRun.forEach((item, i) => {
      item.content_hash = computeTestHash(item) || `merged-hash-${i}`;
    });

    const secondRun = runPass2NearMatch(JSON.parse(JSON.stringify(firstRun)) as DebtItem[]);
    const secondCount = secondRun.length;

    assert.strictEqual(secondCount, firstCount, "Near-match dedup should be idempotent");
  });

  it("parametric dedup is idempotent", () => {
    const items: DebtItem[] = [
      { source_id: "a", file: "src/a.ts", line: 10, title: "Error on line 10", severity: "S2" },
      { source_id: "b", file: "src/a.ts", line: 20, title: "Error on line 20", severity: "S2" }, // parametric match
      { source_id: "c", file: "src/b.ts", line: 5, title: "Different file", severity: "S3" },
    ];

    const firstRun = runPass0Parametric(JSON.parse(JSON.stringify(items)) as DebtItem[]);
    const firstCount = firstRun.length;

    // Run again on output
    const secondRun = runPass0Parametric(JSON.parse(JSON.stringify(firstRun)) as DebtItem[]);
    const secondCount = secondRun.length;

    assert.strictEqual(secondCount, firstCount, "Parametric dedup should be idempotent");
  });
});

describe("idempotency: sync-deduped run twice produces no changes on second run", () => {
  it("after applying sync, running sync again reports zero changes", () => {
    const masterItems: DebtItem[] = [
      { content_hash: "hash1", severity: "S0", status: "IN_PROGRESS" }, // updated in MASTER
      { content_hash: "hash2", severity: "S2", status: "NEW" },
    ];
    const dedupedItems: DebtItem[] = [
      { content_hash: "hash1", severity: "S3", status: "NEW" }, // out of sync
      { content_hash: "hash2", severity: "S2", status: "NEW" }, // in sync
    ];

    const masterMap = new Map(masterItems.map((i) => [i.content_hash!, i]));

    // First sync run — should find changes
    const { severityChanges: sc1, statusChanges: stc1 } = computeSync(masterMap, dedupedItems);
    assert.ok(sc1 > 0 || stc1 > 0, "First run should find changes");

    // Second sync run on the now-updated dedupedItems — should be zero
    const { severityChanges: sc2, statusChanges: stc2 } = computeSync(masterMap, dedupedItems);
    assert.strictEqual(sc2, 0, "Second sync run should find no severity changes");
    assert.strictEqual(stc2, 0, "Second sync run should find no status changes");
  });

  it("sync with no initial differences remains at zero on repeated runs", () => {
    const masterItems: DebtItem[] = [{ content_hash: "hash1", severity: "S2", status: "NEW" }];
    const dedupedItems: DebtItem[] = [{ content_hash: "hash1", severity: "S2", status: "NEW" }];

    const masterMap = new Map(masterItems.map((i) => [i.content_hash!, i]));

    const { severityChanges: sc1, statusChanges: stc1 } = computeSync(masterMap, [...dedupedItems]);
    assert.strictEqual(sc1, 0);
    assert.strictEqual(stc1, 0);

    const { severityChanges: sc2, statusChanges: stc2 } = computeSync(masterMap, [...dedupedItems]);
    assert.strictEqual(sc2, 0);
    assert.strictEqual(stc2, 0);
  });
});

describe("idempotency: generate-views stable ID assignment", () => {
  function generateDebtId(index: number): string {
    return `DEBT-${String(index).padStart(4, "0")}`;
  }

  function assignStableId(
    item: DebtItem,
    idMap: Map<string, string>,
    usedIds: Set<string>,
    nextId: number
  ): { id: string; isNew: boolean } {
    let existingId: string | undefined;
    if (item.content_hash) existingId = idMap.get(`hash:${item.content_hash}`);
    if (!existingId && item.source_id) existingId = idMap.get(`source:${item.source_id}`);
    if (existingId && !usedIds.has(existingId)) return { id: existingId, isNew: false };
    return { id: generateDebtId(nextId), isNew: true };
  }

  it("running ID assignment twice on same items preserves existing IDs", () => {
    const items: DebtItem[] = [
      { source_id: "audit:a", content_hash: "hash1", title: "Item A" },
      { source_id: "audit:b", content_hash: "hash2", title: "Item B" },
    ];

    // First run — assign fresh IDs
    const idMapRun1 = new Map<string, string>();
    const usedIdsRun1 = new Set<string>();
    const firstRunIds: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const result = assignStableId(items[i], idMapRun1, usedIdsRun1, i + 1);
      firstRunIds.push(result.id);
      usedIdsRun1.add(result.id);
      // Register in map for future lookups
      idMapRun1.set(`hash:${items[i].content_hash}`, result.id);
      idMapRun1.set(`source:${items[i].source_id}`, result.id);
    }

    // Second run — should reuse same IDs (using the idMap from run 1 as "existing MASTER" state)
    const usedIdsRun2 = new Set<string>();
    const secondRunIds: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const result = assignStableId(items[i], idMapRun1, usedIdsRun2, i + 10); // different nextId
      secondRunIds.push(result.id);
      usedIdsRun2.add(result.id);
    }

    assert.deepStrictEqual(firstRunIds, secondRunIds, "IDs should be stable across runs");
  });
});

describe("idempotency: normalize-all produces consistent content hashes", () => {
  it("normalizing same input twice produces identical content", () => {
    const rawItem = {
      source_id: "audit:test-001",
      category: "security",
      severity: "S1",
      file: "./src/lib/auth.ts",
      line: 42,
      title: "Use parameterized queries",
      description: "SQL injection risk",
    };

    // Simulate normalizeItem (the pure function)
    const normalize = (item: typeof rawItem) => ({
      source_id: item.source_id,
      category: item.category,
      severity: item.severity,
      file: item.file.replace(/^\.\//, ""),
      line: item.line,
      title: item.title.substring(0, 500),
      description: item.description,
    });

    const firstNorm = normalize(rawItem);
    const secondNorm = normalize(rawItem);

    assert.deepStrictEqual(firstNorm, secondNorm, "Normalization should be deterministic");
  });

  it("content hash is deterministic for same input", () => {
    const item: DebtItem = {
      file: "src/lib/auth.ts",
      line: 42,
      title: "Use parameterized queries",
      description: "SQL injection risk",
    };

    const hash1 = computeTestHash(item);
    const hash2 = computeTestHash(item);
    assert.strictEqual(hash1, hash2, "Content hash should be deterministic");
  });

  it("content hash differs for different titles", () => {
    const item1: DebtItem = { file: "src/a.ts", line: 1, title: "Issue A", description: "" };
    const item2: DebtItem = { file: "src/a.ts", line: 1, title: "Issue B", description: "" };
    assert.notStrictEqual(computeTestHash(item1), computeTestHash(item2));
  });
});
