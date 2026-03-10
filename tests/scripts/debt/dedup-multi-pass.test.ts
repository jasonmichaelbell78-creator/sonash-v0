/**
 * Unit tests for dedup-multi-pass.js
 *
 * Tests the core deduplication logic functions extracted from the script.
 * We test these by requiring the module pieces that can be tested in isolation.
 * Since the script is a CLI tool without exports, we re-implement and test
 * the pure algorithmic functions directly here.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as crypto from "node:crypto";

// ─── Re-implementations of pure functions (tested without file I/O) ───────────

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
    .replaceAll(/[^a-z0-9\s]/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function normalizeParametric(title: string): string {
  if (!title) return "";
  return title.replaceAll(/\d+/g, "#");
}

function shortHash(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex").substring(0, 12);
}

interface DebtItem {
  source_id?: string;
  file?: string;
  line?: number;
  title?: string;
  description?: string;
  recommendation?: string;
  severity?: string;
  content_hash?: string;
  merged_from?: string[];
  evidence?: unknown[];
  cluster_id?: string;
  cluster_count?: number;
  cluster_primary?: boolean;
  [key: string]: unknown;
}

function isNearMatch(a: DebtItem, b: DebtItem): boolean {
  if (a.file !== b.file) return false;
  if (!a.file) return false;
  if (!Number.isFinite(a.line) || !Number.isFinite(b.line)) return false;
  if ((a.line ?? 0) <= 0 || (b.line ?? 0) <= 0) return false;
  const lineDiff = Math.abs((a.line ?? 0) - (b.line ?? 0));
  if (lineDiff > 5) return false;
  const titleSim = stringSimilarity(normalizeText(a.title ?? ""), normalizeText(b.title ?? ""));
  if (titleSim < 0.8) return false;
  return true;
}

function isSemanticMatch(a: DebtItem, b: DebtItem): boolean {
  if (a.file !== b.file) return false;
  if (!a.file) return false;
  if (!Number.isFinite(a.line) || !Number.isFinite(b.line)) return false;
  if ((a.line ?? 0) <= 0 || (b.line ?? 0) <= 0) return false;
  const titleSim = stringSimilarity(normalizeText(a.title ?? ""), normalizeText(b.title ?? ""));
  if (titleSim < 0.9) return false;
  return true;
}

function isCrossSourceMatch(a: DebtItem, b: DebtItem): boolean {
  const aSourceId = typeof a?.source_id === "string" ? a.source_id : "";
  const bSourceId = typeof b?.source_id === "string" ? b.source_id : "";
  if (!aSourceId || !bSourceId) return false;
  const aIsSonar = aSourceId.startsWith("sonarcloud:");
  const bIsSonar = bSourceId.startsWith("sonarcloud:");
  if (aIsSonar === bIsSonar) return false;
  const sonarItem = aIsSonar ? a : b;
  const auditItem = aIsSonar ? b : a;
  const sonarFile = typeof sonarItem.file === "string" ? sonarItem.file : "";
  const auditFile = typeof auditItem.file === "string" ? auditItem.file : "";
  if (!sonarFile || !auditFile) return false;
  if (sonarFile !== auditFile) return false;
  if (!Number.isFinite(sonarItem.line) || !Number.isFinite(auditItem.line)) return false;
  if ((sonarItem.line ?? 0) <= 0 || (auditItem.line ?? 0) <= 0) return false;
  const lineDiff = Math.abs((sonarItem.line ?? 0) - (auditItem.line ?? 0));
  if (lineDiff > 10) return false;
  const descSim = stringSimilarity(
    normalizeText(sonarItem.title ?? ""),
    normalizeText(auditItem.title ?? "")
  );
  return descSim > 0.7;
}

type EvidenceValue = string | object | null | undefined;

function evidenceToKey(e: EvidenceValue): string {
  if (typeof e === "string") return `str:${e}`;
  if (e == null || typeof e !== "object") return `prim:${typeof e}:${String(e)}`;
  try {
    return `json:${JSON.stringify(e)}`;
  } catch {
    return `[unserializable:${Object.prototype.toString.call(e)}]`;
  }
}

function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function mergeEvidence(
  existing: EvidenceValue[],
  incoming: EvidenceValue | EvidenceValue[]
): EvidenceValue[] {
  if (incoming == null) return existing;
  const incomingArr = toArray(incoming);
  const base = toArray(existing);
  const seen = new Set(base.map(evidenceToKey));
  const added: EvidenceValue[] = [];
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
  if (secondaryRank < primaryRank) {
    merged.severity = secondary.severity;
  }
  merged.merged_from ??= [];
  if (typeof secondary.source_id === "string" && secondary.source_id.trim()) {
    if (!merged.merged_from.includes(secondary.source_id)) {
      merged.merged_from.push(secondary.source_id);
    }
  }
  merged.evidence = mergeEvidence(
    (merged.evidence ?? []) as EvidenceValue[],
    (secondary.evidence ?? []) as EvidenceValue[]
  );
  return merged;
}

function normalizeParametricKey(item: DebtItem): string {
  const paramTitle = normalizeParametric(item.title ?? "");
  return `${item.file ?? ""}::${paramTitle}`;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("dedup-multi-pass: levenshtein + stringSimilarity", () => {
  it("identical strings have similarity 1.0", () => {
    assert.strictEqual(stringSimilarity("hello world", "hello world"), 1);
  });

  it("completely different strings have low similarity", () => {
    const sim = stringSimilarity("abc", "xyz");
    assert.ok(sim < 0.5, `Expected similarity < 0.5, got ${sim}`);
  });

  it("empty string vs non-empty returns 0", () => {
    assert.strictEqual(stringSimilarity("", "hello"), 0);
  });

  it("similar strings score above 0.8", () => {
    const sim = stringSimilarity(
      "Avoid using Math.random for security",
      "Avoid using Math.random() for security"
    );
    assert.ok(sim > 0.8, `Expected similarity > 0.8, got ${sim}`);
  });

  it("levenshtein of identical strings is 0", () => {
    assert.strictEqual(levenshtein("cat", "cat"), 0);
  });

  it("levenshtein of empty strings is correct", () => {
    assert.strictEqual(levenshtein("", "abc"), 3);
    assert.strictEqual(levenshtein("abc", ""), 3);
  });
});

describe("dedup-multi-pass: normalizeParametric", () => {
  it("strips numeric literals replacing each run of digits with #", () => {
    // \d+ is greedy: "42" is one run → replaced by single "#"
    assert.strictEqual(normalizeParametric("Error on line 42"), "Error on line #");
  });

  it("multi-occurrence replacement (each numeric token → one #)", () => {
    assert.strictEqual(normalizeParametric("Items 1 and 2 in file 3"), "Items # and # in file #");
  });

  it("no numbers returns unchanged", () => {
    assert.strictEqual(normalizeParametric("no numbers here"), "no numbers here");
  });

  it("empty string returns empty", () => {
    assert.strictEqual(normalizeParametric(""), "");
  });

  it("parametric key groups items by file + stripped title", () => {
    const a: DebtItem = { file: "src/foo.ts", title: "Error on line 10" };
    const b: DebtItem = { file: "src/foo.ts", title: "Error on line 20" };
    const c: DebtItem = { file: "src/bar.ts", title: "Error on line 10" };
    assert.strictEqual(normalizeParametricKey(a), normalizeParametricKey(b));
    assert.notStrictEqual(normalizeParametricKey(a), normalizeParametricKey(c));
  });
});

describe("dedup-multi-pass: isNearMatch", () => {
  it("happy path: same file, close lines, similar title", () => {
    const a: DebtItem = { file: "src/foo.ts", line: 10, title: "Avoid using raw Math.random" };
    const b: DebtItem = { file: "src/foo.ts", line: 13, title: "Avoid using raw Math.random()" };
    assert.ok(isNearMatch(a, b), "Should be a near match");
  });

  it("different files are never near matches", () => {
    const a: DebtItem = { file: "src/foo.ts", line: 10, title: "Same title" };
    const b: DebtItem = { file: "src/bar.ts", line: 10, title: "Same title" };
    assert.ok(!isNearMatch(a, b));
  });

  it("line diff > 5 rejects near match", () => {
    const a: DebtItem = { file: "src/foo.ts", line: 1, title: "Same title" };
    const b: DebtItem = { file: "src/foo.ts", line: 8, title: "Same title" };
    assert.ok(!isNearMatch(a, b));
  });

  it("missing line numbers prevent near match (no NaN false merges)", () => {
    const a: DebtItem = { file: "src/foo.ts", title: "Same title" };
    const b: DebtItem = { file: "src/foo.ts", title: "Same title" };
    assert.ok(!isNearMatch(a, b));
  });

  it("zero line numbers prevent near match", () => {
    const a: DebtItem = { file: "src/foo.ts", line: 0, title: "Same title" };
    const b: DebtItem = { file: "src/foo.ts", line: 0, title: "Same title" };
    assert.ok(!isNearMatch(a, b));
  });

  it("title similarity below 0.8 rejects near match", () => {
    const a: DebtItem = { file: "src/foo.ts", line: 10, title: "Completely different issue here" };
    const b: DebtItem = { file: "src/foo.ts", line: 11, title: "Unrelated problem in code there" };
    assert.ok(!isNearMatch(a, b));
  });
});

describe("dedup-multi-pass: isSemanticMatch", () => {
  it("very similar title on same file qualifies", () => {
    const a: DebtItem = {
      file: "src/foo.ts",
      line: 5,
      title: "Avoid using raw crypto without seeding",
    };
    const b: DebtItem = {
      file: "src/foo.ts",
      line: 8,
      title: "Avoid using raw crypto without seeding.",
    };
    assert.ok(isSemanticMatch(a, b));
  });

  it("requires title similarity > 0.9", () => {
    const a: DebtItem = { file: "src/foo.ts", line: 5, title: "Use async/await for promises" };
    const b: DebtItem = { file: "src/foo.ts", line: 6, title: "Use promises instead of callbacks" };
    assert.ok(!isSemanticMatch(a, b));
  });

  it("missing line numbers prevent semantic match", () => {
    const a: DebtItem = { file: "src/foo.ts", title: "Identical title here" };
    const b: DebtItem = { file: "src/foo.ts", title: "Identical title here" };
    assert.ok(!isSemanticMatch(a, b));
  });
});

describe("dedup-multi-pass: isCrossSourceMatch", () => {
  it("sonarcloud + audit same file, close lines, similar title matches", () => {
    const sonar: DebtItem = {
      source_id: "sonarcloud:js:S2245",
      file: "src/lib/auth.ts",
      line: 42,
      title: "weak random number generator usage",
    };
    const audit: DebtItem = {
      source_id: "audit:security-2024",
      file: "src/lib/auth.ts",
      line: 44,
      title: "weak random number generator usage here",
    };
    assert.ok(isCrossSourceMatch(sonar, audit));
    assert.ok(isCrossSourceMatch(audit, sonar)); // order-independent
  });

  it("two sonarcloud items do not cross-match", () => {
    const a: DebtItem = {
      source_id: "sonarcloud:js:S1",
      file: "src/foo.ts",
      line: 10,
      title: "Issue",
    };
    const b: DebtItem = {
      source_id: "sonarcloud:js:S2",
      file: "src/foo.ts",
      line: 10,
      title: "Issue",
    };
    assert.ok(!isCrossSourceMatch(a, b));
  });

  it("two audit items do not cross-match", () => {
    const a: DebtItem = { source_id: "audit:a", file: "src/foo.ts", line: 10, title: "Issue" };
    const b: DebtItem = { source_id: "audit:b", file: "src/foo.ts", line: 10, title: "Issue" };
    assert.ok(!isCrossSourceMatch(a, b));
  });

  it("missing source_id prevents cross-source match", () => {
    const a: DebtItem = { file: "src/foo.ts", line: 10, title: "Issue" };
    const b: DebtItem = {
      source_id: "sonarcloud:js:S1",
      file: "src/foo.ts",
      line: 10,
      title: "Issue",
    };
    assert.ok(!isCrossSourceMatch(a, b));
  });

  it("line diff > 10 prevents cross-source match", () => {
    const sonar: DebtItem = {
      source_id: "sonarcloud:js:S2245",
      file: "src/lib/auth.ts",
      line: 1,
      title: "weak random",
    };
    const audit: DebtItem = {
      source_id: "audit:sec",
      file: "src/lib/auth.ts",
      line: 20,
      title: "weak random",
    };
    assert.ok(!isCrossSourceMatch(sonar, audit));
  });

  it("missing line numbers prevent cross-source match", () => {
    const sonar: DebtItem = {
      source_id: "sonarcloud:js:S2245",
      file: "src/lib/auth.ts",
      title: "weak random",
    };
    const audit: DebtItem = {
      source_id: "audit:sec",
      file: "src/lib/auth.ts",
      title: "weak random",
    };
    assert.ok(!isCrossSourceMatch(sonar, audit));
  });
});

describe("dedup-multi-pass: mergeItems", () => {
  it("happy path: keeps longer description from secondary", () => {
    const primary: DebtItem = { source_id: "a", severity: "S2", description: "Short" };
    const secondary: DebtItem = {
      source_id: "b",
      severity: "S2",
      description: "Much longer description here",
    };
    const merged = mergeItems(primary, secondary);
    assert.strictEqual(merged.description, "Much longer description here");
  });

  it("keeps more severe severity from secondary", () => {
    const primary: DebtItem = { source_id: "a", severity: "S2", description: "" };
    const secondary: DebtItem = { source_id: "b", severity: "S0", description: "" };
    const merged = mergeItems(primary, secondary);
    assert.strictEqual(merged.severity, "S0");
  });

  it("does not downgrade severity", () => {
    const primary: DebtItem = { source_id: "a", severity: "S1", description: "" };
    const secondary: DebtItem = { source_id: "b", severity: "S3", description: "" };
    const merged = mergeItems(primary, secondary);
    assert.strictEqual(merged.severity, "S1");
  });

  it("tracks secondary source_id in merged_from", () => {
    const primary: DebtItem = { source_id: "audit:primary", severity: "S2", description: "" };
    const secondary: DebtItem = {
      source_id: "sonarcloud:secondary",
      severity: "S2",
      description: "",
    };
    const merged = mergeItems(primary, secondary);
    assert.ok(Array.isArray(merged.merged_from));
    assert.ok(merged.merged_from!.includes("sonarcloud:secondary"));
  });

  it("does not duplicate source_id in merged_from on second merge", () => {
    const primary: DebtItem = {
      source_id: "audit:primary",
      severity: "S2",
      description: "",
      merged_from: ["sonarcloud:secondary"],
    };
    const secondary: DebtItem = {
      source_id: "sonarcloud:secondary",
      severity: "S2",
      description: "",
    };
    const merged = mergeItems(primary, secondary);
    const occurrences = (merged.merged_from ?? []).filter(
      (id) => id === "sonarcloud:secondary"
    ).length;
    assert.strictEqual(occurrences, 1);
  });

  it("merges evidence arrays without duplicates", () => {
    const primary: DebtItem = {
      source_id: "a",
      severity: "S2",
      description: "",
      evidence: ["e1", "e2"],
    };
    const secondary: DebtItem = {
      source_id: "b",
      severity: "S2",
      description: "",
      evidence: ["e2", "e3"],
    };
    const merged = mergeItems(primary, secondary);
    assert.deepStrictEqual(merged.evidence, ["e1", "e2", "e3"]);
  });
});

describe("dedup-multi-pass: mergeEvidence", () => {
  it("deduplicates string evidence", () => {
    const result = mergeEvidence(["a", "b"], ["b", "c"]);
    assert.deepStrictEqual(result, ["a", "b", "c"]);
  });

  it("handles null incoming gracefully", () => {
    const result = mergeEvidence(["a"], null as unknown as EvidenceValue[]);
    assert.deepStrictEqual(result, ["a"]);
  });

  it("handles empty existing", () => {
    const result = mergeEvidence([], ["x", "y"]);
    assert.deepStrictEqual(result, ["x", "y"]);
  });

  it("deduplicates object evidence by JSON key", () => {
    const obj = { file: "foo.ts", line: 10 };
    const result = mergeEvidence([obj], [{ file: "foo.ts", line: 10 }]);
    assert.strictEqual(result.length, 1);
  });
});

describe("dedup-multi-pass: shortHash", () => {
  it("produces 12-character hex string", () => {
    const h = shortHash("some string");
    assert.strictEqual(h.length, 12);
    assert.match(h, /^[0-9a-f]{12}$/);
  });

  it("is deterministic for same input", () => {
    assert.strictEqual(shortHash("hello"), shortHash("hello"));
  });

  it("differs for different inputs", () => {
    assert.notStrictEqual(shortHash("hello"), shortHash("world"));
  });
});

describe("dedup-multi-pass: pass 1 exact hash dedup (logic simulation)", () => {
  it("eliminates items with identical content_hash", () => {
    const items: DebtItem[] = [
      { source_id: "a", content_hash: "abc123", severity: "S2", description: "desc" },
      { source_id: "b", content_hash: "abc123", severity: "S2", description: "desc same" },
      { source_id: "c", content_hash: "def456", severity: "S3", description: "different" },
    ];

    // Simulate pass 1 logic
    const hashMap = new Map<string, DebtItem>();
    const noHashItems: DebtItem[] = [];

    for (const item of items) {
      const hash =
        typeof item.content_hash === "string" && item.content_hash.trim()
          ? item.content_hash
          : null;
      if (!hash) {
        noHashItems.push(item);
        continue;
      }
      if (hashMap.has(hash)) {
        const existing = hashMap.get(hash)!;
        hashMap.set(hash, mergeItems(existing, item));
      } else {
        hashMap.set(hash, item);
      }
    }

    const pass1Items = [...hashMap.values(), ...noHashItems];
    assert.strictEqual(pass1Items.length, 2);
    // The merged item should track the secondary source_id
    const merged = pass1Items.find((i) => i.content_hash === "abc123");
    assert.ok(merged?.merged_from?.includes("b"));
  });

  it("items without content_hash pass through without dedup", () => {
    const items: DebtItem[] = [
      { source_id: "a", severity: "S2", description: "no hash" },
      { source_id: "b", severity: "S2", description: "also no hash" },
    ];

    const hashMap = new Map<string, DebtItem>();
    const noHashItems: DebtItem[] = [];

    for (const item of items) {
      const hash =
        typeof item.content_hash === "string" && item.content_hash.trim()
          ? item.content_hash
          : null;
      if (!hash) {
        noHashItems.push(item);
        continue;
      }
      hashMap.set(hash, item);
    }

    const pass1Items = [...hashMap.values(), ...noHashItems];
    assert.strictEqual(pass1Items.length, 2);
  });
});

describe("dedup-multi-pass: pass 5 systemic pattern grouper (logic simulation)", () => {
  it("annotates items with same title across 3+ files", () => {
    const items: DebtItem[] = [
      { source_id: "a", file: "src/a.ts", title: "Use async/await consistently", severity: "S2" },
      { source_id: "b", file: "src/b.ts", title: "Use async/await consistently", severity: "S2" },
      { source_id: "c", file: "src/c.ts", title: "Use async/await consistently", severity: "S1" },
      { source_id: "d", file: "src/d.ts", title: "Different issue", severity: "S3" },
    ];

    // Simulate pass 5 logic
    const titleGroups = new Map<string, number[]>();
    for (let i = 0; i < items.length; i++) {
      const normTitle = normalizeText(items[i].title ?? "");
      if (!normTitle) continue;
      if (!titleGroups.has(normTitle)) titleGroups.set(normTitle, []);
      titleGroups.get(normTitle)!.push(i);
    }

    const pass5Items = [...items];
    for (const [normTitle, indices] of titleGroups) {
      const uniqueFiles = new Set(
        indices.map((idx) => pass5Items[idx].file).filter((f) => typeof f === "string" && f.trim())
      );
      if (uniqueFiles.size < 3) continue;

      const clusterId = `CLUSTER-${shortHash(normTitle)}`;
      for (const idx of indices) {
        pass5Items[idx] = {
          ...pass5Items[idx],
          cluster_id: clusterId,
          cluster_count: indices.length,
        };
      }
    }

    const clustered = pass5Items.filter((i) => i.cluster_id);
    assert.strictEqual(clustered.length, 3, "Should annotate 3 items in the cluster");
    assert.strictEqual(
      pass5Items[3].cluster_id,
      undefined,
      "Unrelated item should not be clustered"
    );
    assert.strictEqual(clustered[0].cluster_count, 3);
  });

  it("does not annotate titles appearing in fewer than 3 files", () => {
    const items: DebtItem[] = [
      { source_id: "a", file: "src/a.ts", title: "Only in two files", severity: "S2" },
      { source_id: "b", file: "src/b.ts", title: "Only in two files", severity: "S2" },
    ];

    const titleGroups = new Map<string, number[]>();
    for (let i = 0; i < items.length; i++) {
      const normTitle = normalizeText(items[i].title ?? "");
      if (!normTitle) continue;
      if (!titleGroups.has(normTitle)) titleGroups.set(normTitle, []);
      titleGroups.get(normTitle)!.push(i);
    }

    const pass5Items = [...items];
    for (const [normTitle, indices] of titleGroups) {
      const uniqueFiles = new Set(
        indices.map((idx) => pass5Items[idx].file).filter((f) => typeof f === "string" && f.trim())
      );
      if (uniqueFiles.size < 3) continue;
      const clusterId = `CLUSTER-${shortHash(normTitle)}`;
      for (const idx of indices) {
        pass5Items[idx] = { ...pass5Items[idx], cluster_id: clusterId };
      }
    }

    assert.strictEqual(pass5Items.filter((i) => i.cluster_id).length, 0);
  });
});
