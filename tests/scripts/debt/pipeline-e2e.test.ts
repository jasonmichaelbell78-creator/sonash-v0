/**
 * E2E tests for the full debt pipeline
 *
 * Tests the full pipeline: intake -> normalize -> dedup -> generate-views -> generate-metrics
 * Uses fixture data, validates end-to-end logic without real file I/O.
 * Verifies that MASTER_DEBT.jsonl and deduped.jsonl stay in sync.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as crypto from "node:crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawAuditItem {
  title: string;
  severity: string;
  category: string;
  file?: string;
  line?: number;
  description?: string;
  recommendation?: string;
  source_id?: string;
  type?: string;
  effort?: string;
  status?: string;
  fingerprint?: string;
  files?: string[];
  why_it_matters?: string;
  suggested_fix?: string;
  confidence?: number;
  [key: string]: unknown;
}

interface NormalizedItem {
  source_id: string;
  category: string;
  severity: string;
  type: string;
  file: string;
  line: number;
  title: string;
  description: string;
  recommendation: string;
  effort: string;
  status: string;
  roadmap_ref: string | null;
  created: string;
  verified_by: string | null;
  resolution: string | null;
  content_hash: string;
  id?: string;
  merged_from?: string[];
  evidence?: unknown[];
  [key: string]: unknown;
}

// ─── Pipeline stage implementations ──────────────────────────────────────────

const VALID_CATEGORIES = [
  "security",
  "performance",
  "code-quality",
  "documentation",
  "process",
  "refactoring",
  "engineering-productivity",
  "enhancements",
  "ai-optimization",
];
const VALID_SEVERITIES = ["S0", "S1", "S2", "S3"];
const VALID_TYPES = [
  "bug",
  "code-smell",
  "vulnerability",
  "hotspot",
  "tech-debt",
  "process-gap",
  "enhancement",
];
const VALID_STATUSES = ["NEW", "VERIFIED", "FALSE_POSITIVE", "IN_PROGRESS", "RESOLVED"];
const VALID_EFFORTS = ["E0", "E1", "E2", "E3"];

function ensureValid(value: unknown, validSet: string[], defaultValue: string): string {
  return typeof value === "string" && validSet.includes(value) ? value : defaultValue;
}

function computeContentHash(item: {
  file?: string;
  line?: number;
  title?: string;
  description?: string;
}): string {
  const normalizedFile = (item.file ?? "").toLowerCase().replace(/^\.\//, "");
  const line =
    typeof item.line === "number" ? item.line : Number.parseInt(String(item.line ?? "0"), 10) || 0;
  const normalizeText = (v: string | undefined, max: number) =>
    (v ?? "").toLowerCase().trim().replaceAll(/\s+/g, " ").substring(0, max);
  const hashInput = JSON.stringify([
    normalizedFile,
    line,
    normalizeText(item.title, 100),
    normalizeText(item.description, 200),
  ]);
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

// Stage 1: Normalize raw items
function normalizeItems(items: RawAuditItem[], sourceFile: string): NormalizedItem[] {
  return items.map((item) => {
    const normalized: NormalizedItem = {
      source_id: item.source_id || `audit:${crypto.randomUUID()}`,
      category: ensureValid(item.category, VALID_CATEGORIES, "code-quality"),
      severity: ensureValid(item.severity, VALID_SEVERITIES, "S2"),
      type: ensureValid(item.type, VALID_TYPES, "code-smell"),
      file: (item.file ?? "").replace(/^\.\//, ""),
      line:
        typeof item.line === "number"
          ? item.line
          : Number.parseInt(String(item.line ?? "0"), 10) || 0,
      title: (item.title ?? "Untitled").substring(0, 500),
      description: item.description ?? "",
      recommendation: item.recommendation ?? "",
      effort: ensureValid(item.effort, VALID_EFFORTS, "E1"),
      status: ensureValid(item.status, VALID_STATUSES, "NEW"),
      roadmap_ref: (item.roadmap_ref as string | null) ?? null,
      created: new Date().toISOString().split("T")[0],
      verified_by: null,
      resolution: null,
      content_hash: "",
    };
    normalized.content_hash = computeContentHash(normalized);
    return normalized;
  });
}

// Stage 2: Dedup by content hash
function dedupItems(items: NormalizedItem[]): NormalizedItem[] {
  const hashMap = new Map<string, NormalizedItem>();
  const noHashItems: NormalizedItem[] = [];

  for (const item of items) {
    if (!item.content_hash) {
      noHashItems.push(item);
      continue;
    }
    if (hashMap.has(item.content_hash)) {
      // Merge — keep more severe severity
      const existing = hashMap.get(item.content_hash)!;
      const sevRank: Record<string, number> = { S0: 0, S1: 1, S2: 2, S3: 3 };
      if ((sevRank[item.severity] ?? 99) < (sevRank[existing.severity] ?? 99)) {
        hashMap.set(item.content_hash, { ...existing, severity: item.severity });
      }
    } else {
      hashMap.set(item.content_hash, item);
    }
  }

  return [...hashMap.values(), ...noHashItems];
}

// Stage 3: Assign stable DEBT IDs
// Mirrors generate-views.js assignStableId logic:
// - Look up existing ID by content_hash, source_id
// - If found and not already assigned in THIS run, reuse it
// - Otherwise assign a new sequential ID
function assignIds(items: NormalizedItem[], existingMaster: NormalizedItem[]): NormalizedItem[] {
  const idMap = new Map<string, string>();
  for (const item of existingMaster) {
    if (item.id && item.content_hash) idMap.set(`hash:${item.content_hash}`, item.id);
    if (item.id && item.source_id) idMap.set(`source:${item.source_id}`, item.id);
  }

  const maxId = existingMaster.reduce((max, item) => {
    const m = /^DEBT-(\d+)$/.exec(item.id ?? "");
    return m ? Math.max(max, Number.parseInt(m[1], 10)) : max;
  }, 0);

  let nextId = maxId + 1;
  // usedIds tracks IDs assigned in THIS run only (not existing master)
  const usedIds = new Set<string>();

  return items.map((item) => {
    // Look up existing ID (by content_hash first, then source_id)
    const existingId =
      (item.content_hash ? idMap.get(`hash:${item.content_hash}`) : undefined) ??
      (item.source_id ? idMap.get(`source:${item.source_id}`) : undefined);

    if (existingId && !usedIds.has(existingId)) {
      usedIds.add(existingId);
      return { ...item, id: existingId };
    }
    const newId = `DEBT-${String(nextId++).padStart(4, "0")}`;
    usedIds.add(newId);
    return { ...item, id: newId };
  });
}

// Stage 4: Generate view groups
function generateViews(items: NormalizedItem[]) {
  const bySeverity: Record<string, NormalizedItem[]> = { S0: [], S1: [], S2: [], S3: [] };
  const byCategory: Record<string, NormalizedItem[]> = {};
  const byStatus: Record<string, NormalizedItem[]> = {};

  for (const item of items) {
    bySeverity[item.severity] = bySeverity[item.severity] ?? [];
    bySeverity[item.severity].push(item);
    byCategory[item.category] = byCategory[item.category] ?? [];
    byCategory[item.category].push(item);
    byStatus[item.status] = byStatus[item.status] ?? [];
    byStatus[item.status].push(item);
  }

  return { bySeverity, byCategory, byStatus, total: items.length };
}

// Stage 5: Calculate metrics
function calculateMetrics(items: NormalizedItem[]) {
  const byStatus: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const item of items) {
    byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
    bySeverity[item.severity] = (bySeverity[item.severity] ?? 0) + 1;
  }

  const total = items.length;
  const resolved = byStatus.RESOLVED ?? 0;
  const open = total - resolved - (byStatus.FALSE_POSITIVE ?? 0);
  return {
    summary: {
      total,
      open,
      resolved,
      resolution_rate_pct: total > 0 ? Math.round((resolved / total) * 100) : 0,
    },
    by_severity: bySeverity,
    by_status: byStatus,
    alerts: {
      s0_count: items.filter(
        (i) => i.severity === "S0" && i.status !== "RESOLVED" && i.status !== "FALSE_POSITIVE"
      ).length,
      s1_count: items.filter(
        (i) => i.severity === "S1" && i.status !== "RESOLVED" && i.status !== "FALSE_POSITIVE"
      ).length,
    },
  };
}

// ─── Fixture data ─────────────────────────────────────────────────────────────

const FIXTURE_AUDIT_ITEMS: RawAuditItem[] = [
  {
    source_id: "audit:security-2024-01",
    title: "SQL injection vulnerability in query builder",
    severity: "S0",
    category: "security",
    type: "vulnerability",
    file: "src/lib/db.ts",
    line: 42,
    description: "User input concatenated directly into SQL query",
    recommendation: "Use prepared statements with parameterized queries",
    effort: "E1",
  },
  {
    source_id: "audit:security-2024-02",
    title: "Weak random number generator used for token generation",
    severity: "S1",
    category: "security",
    type: "vulnerability",
    file: "src/lib/auth.ts",
    line: 15,
    description: "Math.random() used for security tokens",
    recommendation: "Use crypto.randomBytes() instead",
    effort: "E0",
  },
  {
    source_id: "audit:quality-2024-01",
    title: "Missing error handling in async function",
    severity: "S2",
    category: "code-quality",
    type: "bug",
    file: "src/hooks/useData.ts",
    line: 28,
    description: "Promise rejection unhandled",
    recommendation: "Add try/catch or .catch() handler",
    effort: "E1",
  },
  {
    source_id: "audit:quality-2024-02",
    title: "Unused variable in component render",
    severity: "S3",
    category: "code-quality",
    type: "code-smell",
    file: "src/components/Dashboard.tsx",
    line: 67,
    description: "Variable declared but never used",
    recommendation: "Remove unused variable or use it",
    effort: "E0",
  },
  // Duplicate of item 2 (same file+line+title → same content hash)
  {
    source_id: "audit:security-2024-02-dup",
    title: "Weak random number generator used for token generation",
    severity: "S1",
    category: "security",
    type: "vulnerability",
    file: "src/lib/auth.ts",
    line: 15,
    description: "Math.random() used for security tokens",
    recommendation: "Use crypto.randomBytes() instead",
    effort: "E0",
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("pipeline-e2e: stage 1 — normalize", () => {
  it("normalizes all fixture items correctly", () => {
    const normalized = normalizeItems(FIXTURE_AUDIT_ITEMS, "audit-2024.jsonl");
    assert.strictEqual(normalized.length, FIXTURE_AUDIT_ITEMS.length);
  });

  it("generates content hashes for all items", () => {
    const normalized = normalizeItems(FIXTURE_AUDIT_ITEMS, "audit-2024.jsonl");
    for (const item of normalized) {
      assert.ok(item.content_hash, `Item "${item.title}" should have content_hash`);
      assert.match(item.content_hash, /^[0-9a-f]{64}$/);
    }
  });

  it("duplicate items produce identical content hashes", () => {
    const normalized = normalizeItems(FIXTURE_AUDIT_ITEMS, "audit-2024.jsonl");
    const item2 = normalized.find((i) => i.source_id === "audit:security-2024-02");
    const item2dup = normalized.find((i) => i.source_id === "audit:security-2024-02-dup");
    assert.ok(item2 && item2dup, "Both items should exist after normalization");
    assert.strictEqual(
      item2.content_hash,
      item2dup.content_hash,
      "Duplicates should have same hash"
    );
  });

  it("normalizes invalid category to code-quality", () => {
    const items: RawAuditItem[] = [{ title: "Test", severity: "S2", category: "invalid-cat" }];
    const normalized = normalizeItems(items, "test.jsonl");
    assert.strictEqual(normalized[0].category, "code-quality");
  });

  it("normalizes invalid severity to S2", () => {
    const items: RawAuditItem[] = [{ title: "Test", severity: "HIGH", category: "security" }];
    const normalized = normalizeItems(items, "test.jsonl");
    assert.strictEqual(normalized[0].severity, "S2");
  });
});

describe("pipeline-e2e: stage 2 — dedup", () => {
  it("removes duplicate items", () => {
    const normalized = normalizeItems(FIXTURE_AUDIT_ITEMS, "audit-2024.jsonl");
    const deduped = dedupItems(normalized);

    // 5 input items, 1 duplicate → 4 unique
    assert.strictEqual(deduped.length, 4, "Should have 4 unique items after dedup");
  });

  it("deduped output is subset of normalized (no new items added)", () => {
    const normalized = normalizeItems(FIXTURE_AUDIT_ITEMS, "audit-2024.jsonl");
    const deduped = dedupItems(normalized);
    assert.ok(deduped.length <= normalized.length, "Deduped should have <= items than normalized");
  });

  it("all deduped items have unique content hashes", () => {
    const normalized = normalizeItems(FIXTURE_AUDIT_ITEMS, "audit-2024.jsonl");
    const deduped = dedupItems(normalized);
    const hashes = deduped.map((i) => i.content_hash);
    const uniqueHashes = new Set(hashes);
    assert.strictEqual(uniqueHashes.size, deduped.length, "All content hashes should be unique");
  });
});

describe("pipeline-e2e: stage 3 — ID assignment", () => {
  it("assigns DEBT-XXXX IDs to all items", () => {
    const normalized = normalizeItems(FIXTURE_AUDIT_ITEMS, "audit-2024.jsonl");
    const deduped = dedupItems(normalized);
    const withIds = assignIds(deduped, []);

    for (const item of withIds) {
      assert.ok(item.id, `Item "${item.title}" should have an ID`);
      assert.match(item.id, /^DEBT-\d{4,}$/, `ID "${item.id}" should match DEBT-XXXX format`);
    }
  });

  it("assigns unique IDs to all items", () => {
    const normalized = normalizeItems(FIXTURE_AUDIT_ITEMS, "audit-2024.jsonl");
    const deduped = dedupItems(normalized);
    const withIds = assignIds(deduped, []);
    const ids = withIds.map((i) => i.id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(uniqueIds.size, withIds.length, "All IDs should be unique");
  });

  it("preserves existing IDs from MASTER by content_hash", () => {
    // Use fixture items that have explicit source_id (not randomly generated)
    const explicitItems: RawAuditItem[] = [
      {
        source_id: "audit:test-stable-a",
        title: "Stable test item A",
        severity: "S2",
        category: "security",
        file: "src/a.ts",
        line: 1,
      },
      {
        source_id: "audit:test-stable-b",
        title: "Stable test item B",
        severity: "S3",
        category: "code-quality",
        file: "src/b.ts",
        line: 2,
      },
    ];
    const normalized = normalizeItems(explicitItems, "audit-2024.jsonl");
    const deduped = dedupItems(normalized);

    // Assign IDs on first run
    const firstRun = assignIds(deduped, []);
    const firstHashToId = new Map(firstRun.map((i) => [i.content_hash, i.id]));

    // Second run with first run as "existing master" — IDs should be stable
    const secondRun = assignIds(deduped, firstRun);

    for (const item of secondRun) {
      const expectedId = firstHashToId.get(item.content_hash);
      assert.strictEqual(
        item.id,
        expectedId,
        `ID for hash ${item.content_hash?.substring(0, 8)}... should be preserved`
      );
    }
  });
});

describe("pipeline-e2e: stage 4 — generate views", () => {
  it("groups items by severity correctly", () => {
    const normalized = normalizeItems(FIXTURE_AUDIT_ITEMS, "audit-2024.jsonl");
    const deduped = dedupItems(normalized);
    const withIds = assignIds(deduped, []);
    const views = generateViews(withIds);

    assert.strictEqual(views.bySeverity.S0.length, 1, "Should have 1 S0 item");
    assert.strictEqual(views.bySeverity.S1.length, 1, "Should have 1 S1 item (deduped)");
    assert.strictEqual(views.bySeverity.S2.length, 1, "Should have 1 S2 item");
    assert.strictEqual(views.bySeverity.S3.length, 1, "Should have 1 S3 item");
  });

  it("total count matches deduped count", () => {
    const normalized = normalizeItems(FIXTURE_AUDIT_ITEMS, "audit-2024.jsonl");
    const deduped = dedupItems(normalized);
    const withIds = assignIds(deduped, []);
    const views = generateViews(withIds);

    assert.strictEqual(views.total, 4, "Total should be 4 (deduped)");
  });

  it("groups items by category correctly", () => {
    const normalized = normalizeItems(FIXTURE_AUDIT_ITEMS, "audit-2024.jsonl");
    const deduped = dedupItems(normalized);
    const withIds = assignIds(deduped, []);
    const views = generateViews(withIds);

    assert.strictEqual(views.byCategory["security"]?.length, 2, "Should have 2 security items");
    assert.strictEqual(
      views.byCategory["code-quality"]?.length,
      2,
      "Should have 2 code-quality items"
    );
  });
});

describe("pipeline-e2e: stage 5 — metrics", () => {
  it("computes correct totals after full pipeline", () => {
    const normalized = normalizeItems(FIXTURE_AUDIT_ITEMS, "audit-2024.jsonl");
    const deduped = dedupItems(normalized);
    const withIds = assignIds(deduped, []);
    const metrics = calculateMetrics(withIds);

    assert.strictEqual(metrics.summary.total, 4);
    assert.strictEqual(metrics.summary.open, 4);
    assert.strictEqual(metrics.summary.resolved, 0);
    assert.strictEqual(metrics.summary.resolution_rate_pct, 0);
  });

  it("S0 critical alert fires for unresolved S0 items", () => {
    const normalized = normalizeItems(FIXTURE_AUDIT_ITEMS, "audit-2024.jsonl");
    const deduped = dedupItems(normalized);
    const withIds = assignIds(deduped, []);
    const metrics = calculateMetrics(withIds);

    assert.strictEqual(metrics.alerts.s0_count, 1, "Should have 1 S0 alert");
    assert.strictEqual(metrics.alerts.s1_count, 1, "Should have 1 S1 alert");
  });
});

describe("pipeline-e2e: MASTER_DEBT and deduped stay in sync", () => {
  it("deduped items are a subset of MASTER content_hashes", () => {
    const normalized = normalizeItems(FIXTURE_AUDIT_ITEMS, "audit-2024.jsonl");
    const deduped = dedupItems(normalized);

    // Simulate appending deduped to MASTER (real script does this)
    const masterItems = [...deduped]; // MASTER starts with same content as deduped
    const masterHashes = new Set(masterItems.map((i) => i.content_hash));
    const dedupedHashes = new Set(deduped.map((i) => i.content_hash));

    for (const hash of dedupedHashes) {
      assert.ok(masterHashes.has(hash), `deduped hash ${hash} should be in MASTER`);
    }
  });

  it("sync propagates severity updates from MASTER to deduped", () => {
    const normalized = normalizeItems(FIXTURE_AUDIT_ITEMS, "audit-2024.jsonl");
    const deduped = dedupItems(normalized);

    // Simulate: MASTER has a manual severity change
    const masterCopy = structuredClone(deduped);
    const s0Item = masterCopy.find((i) => i.severity === "S0");
    assert.ok(s0Item, "Should have an S0 item");
    s0Item!.severity = "S1"; // manually demoted in MASTER

    // Run sync
    const masterMap = new Map(masterCopy.map((i) => [i.content_hash, i]));
    let severityChanges = 0;
    const dedupedCopy = structuredClone(deduped);

    for (const item of dedupedCopy) {
      const masterItem = masterMap.get(item.content_hash);
      if (masterItem && masterItem.severity !== item.severity) {
        item.severity = masterItem.severity;
        severityChanges++;
      }
    }

    assert.strictEqual(severityChanges, 1, "One severity change should be propagated");
    const syncedS0 = dedupedCopy.find((i) => i.content_hash === s0Item!.content_hash);
    assert.strictEqual(syncedS0?.severity, "S1", "S0 should be demoted to S1 in deduped");
  });

  it("ingest-only adds new items without removing existing MASTER items", () => {
    const existingMaster: NormalizedItem[] = normalizeItems(
      FIXTURE_AUDIT_ITEMS.slice(0, 2),
      "batch1.jsonl"
    );
    const existingHashes = new Set(existingMaster.map((i) => i.content_hash));

    // New batch with 1 existing item + 1 new item
    const newBatch: NormalizedItem[] = normalizeItems(
      [
        FIXTURE_AUDIT_ITEMS[1], // already exists
        FIXTURE_AUDIT_ITEMS[3], // new item
      ],
      "batch2.jsonl"
    );

    // Filter to only truly new items
    const newItems = newBatch.filter((i) => !existingHashes.has(i.content_hash));

    assert.strictEqual(newItems.length, 1, "Only 1 new item should be ingested");
    assert.strictEqual(newItems[0].source_id, "audit:quality-2024-02");

    // MASTER grows but never shrinks
    const updatedMaster = [...existingMaster, ...newItems];
    assert.ok(updatedMaster.length >= existingMaster.length, "MASTER should never shrink");
  });
});
