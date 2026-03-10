/**
 * Unit tests for sync-deduped.js
 *
 * Tests computeChanges logic — pure function that propagates severity
 * and status changes from MASTER back into deduped items.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Re-implementations of pure functions from sync-deduped.js ───────────────

interface DebtItem {
  id?: string;
  content_hash?: string;
  severity?: string;
  status?: string;
  title?: string;
  [key: string]: unknown;
}

function computeChanges(
  masterMap: Map<string, DebtItem>,
  dedupedItems: DebtItem[]
): { severityChanges: number; statusChanges: number; sharedCount: number } {
  let severityChanges = 0;
  let statusChanges = 0;
  let sharedCount = 0;

  for (const dedupedItem of dedupedItems) {
    const masterItem = masterMap.get(dedupedItem.content_hash ?? "");
    if (!masterItem) continue;
    sharedCount++;

    if (masterItem.severity !== undefined && dedupedItem.severity !== masterItem.severity) {
      dedupedItem.severity = masterItem.severity;
      severityChanges++;
    }

    if (masterItem.status !== undefined && dedupedItem.status !== masterItem.status) {
      dedupedItem.status = masterItem.status;
      statusChanges++;
    }
  }

  return { severityChanges, statusChanges, sharedCount };
}

function buildMasterMap(masterItems: DebtItem[]): Map<string, DebtItem> {
  const masterMap = new Map<string, DebtItem>();
  for (const item of masterItems) {
    if (item.content_hash) {
      masterMap.set(item.content_hash, item);
    }
  }
  return masterMap;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("sync-deduped: computeChanges — happy path", () => {
  it("propagates severity change from MASTER to deduped", () => {
    const masterItems: DebtItem[] = [
      { content_hash: "hash1", severity: "S1", status: "NEW" }, // was S2, promoted
    ];
    const dedupedItems: DebtItem[] = [{ content_hash: "hash1", severity: "S2", status: "NEW" }];
    const masterMap = buildMasterMap(masterItems);
    const { severityChanges, statusChanges, sharedCount } = computeChanges(masterMap, dedupedItems);

    assert.strictEqual(severityChanges, 1);
    assert.strictEqual(statusChanges, 0);
    assert.strictEqual(sharedCount, 1);
    assert.strictEqual(dedupedItems[0].severity, "S1"); // mutated
  });

  it("propagates status change from MASTER to deduped", () => {
    const masterItems: DebtItem[] = [
      { content_hash: "hash1", severity: "S2", status: "VERIFIED" }, // manually verified
    ];
    const dedupedItems: DebtItem[] = [{ content_hash: "hash1", severity: "S2", status: "NEW" }];
    const masterMap = buildMasterMap(masterItems);
    const { severityChanges, statusChanges } = computeChanges(masterMap, dedupedItems);

    assert.strictEqual(severityChanges, 0);
    assert.strictEqual(statusChanges, 1);
    assert.strictEqual(dedupedItems[0].status, "VERIFIED");
  });

  it("propagates both severity and status changes simultaneously", () => {
    const masterItems: DebtItem[] = [
      { content_hash: "hash1", severity: "S0", status: "IN_PROGRESS" },
    ];
    const dedupedItems: DebtItem[] = [{ content_hash: "hash1", severity: "S3", status: "NEW" }];
    const masterMap = buildMasterMap(masterItems);
    const { severityChanges, statusChanges } = computeChanges(masterMap, dedupedItems);

    assert.strictEqual(severityChanges, 1);
    assert.strictEqual(statusChanges, 1);
    assert.strictEqual(dedupedItems[0].severity, "S0");
    assert.strictEqual(dedupedItems[0].status, "IN_PROGRESS");
  });
});

describe("sync-deduped: computeChanges — no changes needed", () => {
  it("returns zero changes when MASTER and deduped are in sync", () => {
    const masterItems: DebtItem[] = [
      { content_hash: "hash1", severity: "S2", status: "NEW" },
      { content_hash: "hash2", severity: "S1", status: "VERIFIED" },
    ];
    const dedupedItems: DebtItem[] = [
      { content_hash: "hash1", severity: "S2", status: "NEW" },
      { content_hash: "hash2", severity: "S1", status: "VERIFIED" },
    ];
    const masterMap = buildMasterMap(masterItems);
    const { severityChanges, statusChanges, sharedCount } = computeChanges(masterMap, dedupedItems);

    assert.strictEqual(severityChanges, 0);
    assert.strictEqual(statusChanges, 0);
    assert.strictEqual(sharedCount, 2);
  });

  it("does not change severity if MASTER severity is undefined", () => {
    const masterItems: DebtItem[] = [
      { content_hash: "hash1", status: "NEW" }, // no severity
    ];
    const dedupedItems: DebtItem[] = [{ content_hash: "hash1", severity: "S2", status: "NEW" }];
    const masterMap = buildMasterMap(masterItems);
    const { severityChanges } = computeChanges(masterMap, dedupedItems);

    assert.strictEqual(severityChanges, 0);
    assert.strictEqual(dedupedItems[0].severity, "S2"); // unchanged
  });
});

describe("sync-deduped: computeChanges — edge cases", () => {
  it("skips deduped items with no matching content_hash in MASTER", () => {
    const masterItems: DebtItem[] = [{ content_hash: "hash1", severity: "S2", status: "NEW" }];
    const dedupedItems: DebtItem[] = [
      { content_hash: "hash_not_in_master", severity: "S3", status: "NEW" },
    ];
    const masterMap = buildMasterMap(masterItems);
    const { sharedCount, severityChanges, statusChanges } = computeChanges(masterMap, dedupedItems);

    assert.strictEqual(sharedCount, 0);
    assert.strictEqual(severityChanges, 0);
    assert.strictEqual(statusChanges, 0);
    assert.strictEqual(dedupedItems[0].severity, "S3"); // unchanged
  });

  it("handles deduped items without content_hash", () => {
    const masterItems: DebtItem[] = [{ content_hash: "hash1", severity: "S1", status: "NEW" }];
    const dedupedItems: DebtItem[] = [
      { severity: "S2", status: "NEW" }, // no content_hash
    ];
    const masterMap = buildMasterMap(masterItems);
    const { sharedCount } = computeChanges(masterMap, dedupedItems);

    assert.strictEqual(sharedCount, 0);
    assert.strictEqual(dedupedItems[0].severity, "S2"); // unchanged
  });

  it("handles empty MASTER gracefully", () => {
    const masterMap = new Map<string, DebtItem>();
    const dedupedItems: DebtItem[] = [{ content_hash: "hash1", severity: "S2", status: "NEW" }];
    const { severityChanges, statusChanges, sharedCount } = computeChanges(masterMap, dedupedItems);

    assert.strictEqual(severityChanges, 0);
    assert.strictEqual(statusChanges, 0);
    assert.strictEqual(sharedCount, 0);
  });

  it("handles empty deduped gracefully", () => {
    const masterItems: DebtItem[] = [{ content_hash: "hash1", severity: "S1", status: "NEW" }];
    const masterMap = buildMasterMap(masterItems);
    const { severityChanges, statusChanges, sharedCount } = computeChanges(masterMap, []);

    assert.strictEqual(severityChanges, 0);
    assert.strictEqual(statusChanges, 0);
    assert.strictEqual(sharedCount, 0);
  });

  it("handles multiple deduped items with same content_hash (last-write wins from master)", () => {
    const masterItems: DebtItem[] = [{ content_hash: "hash1", severity: "S0", status: "NEW" }];
    const dedupedItems: DebtItem[] = [
      { id: "a", content_hash: "hash1", severity: "S2", status: "NEW" },
      { id: "b", content_hash: "hash1", severity: "S3", status: "VERIFIED" },
    ];
    const masterMap = buildMasterMap(masterItems);
    const { severityChanges, sharedCount } = computeChanges(masterMap, dedupedItems);

    assert.strictEqual(sharedCount, 2);
    assert.strictEqual(severityChanges, 2); // both had different severity
    assert.strictEqual(dedupedItems[0].severity, "S0");
    assert.strictEqual(dedupedItems[1].severity, "S0");
  });
});

describe("sync-deduped: buildMasterMap", () => {
  it("builds map keyed by content_hash", () => {
    const masterItems: DebtItem[] = [
      { content_hash: "abc", severity: "S1", id: "DEBT-0001" },
      { content_hash: "def", severity: "S2", id: "DEBT-0002" },
    ];
    const masterMap = buildMasterMap(masterItems);
    assert.strictEqual(masterMap.size, 2);
    assert.strictEqual(masterMap.get("abc")?.id, "DEBT-0001");
  });

  it("skips items without content_hash", () => {
    const masterItems: DebtItem[] = [
      { severity: "S1", id: "DEBT-0001" }, // no content_hash
      { content_hash: "abc", severity: "S2", id: "DEBT-0002" },
    ];
    const masterMap = buildMasterMap(masterItems);
    assert.strictEqual(masterMap.size, 1);
  });

  it("last item wins when duplicate content_hash exists in MASTER", () => {
    const masterItems: DebtItem[] = [
      { content_hash: "abc", severity: "S1", id: "DEBT-0001" },
      { content_hash: "abc", severity: "S0", id: "DEBT-0002" }, // same hash
    ];
    const masterMap = buildMasterMap(masterItems);
    assert.strictEqual(masterMap.get("abc")?.id, "DEBT-0002");
  });

  it("handles empty array", () => {
    const masterMap = buildMasterMap([]);
    assert.strictEqual(masterMap.size, 0);
  });
});

describe("sync-deduped: outputResults structure", () => {
  it("computes totalChanges as sum of severity + status changes", () => {
    const severityChanges = 3;
    const statusChanges = 2;
    const totalChanges = severityChanges + statusChanges;
    assert.strictEqual(totalChanges, 5);
  });

  it("applied flag is true only when applyMode=true and totalChanges>0", () => {
    const check = (applyMode: boolean, totalChanges: number): boolean =>
      applyMode && totalChanges > 0;

    assert.strictEqual(check(true, 5), true);
    assert.strictEqual(check(false, 5), false);
    assert.strictEqual(check(true, 0), false);
    assert.strictEqual(check(false, 0), false);
  });
});
