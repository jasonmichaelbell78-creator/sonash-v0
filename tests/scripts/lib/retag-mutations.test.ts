/**
 * retag-mutations.js Test Suite
 *
 * Unit tests for the pure mutation logic powering scripts/cas/retag.js:
 * - entryKey (composite keying)
 * - validateBatchShape (batch file validation)
 * - addNewVocabulary (vocab additions with collision checks)
 * - classifyTags (synonym resolution + forbidden/unknown detection)
 * - semanticCount (non-taxonomic tag counting)
 * - applyBatch (journal retag with unmatched tracking)
 * - recomputeCounts (count recomputation from journal)
 * - assertRegression (invariant guards)
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../../package.json"))
  ? path.resolve(__dirname, "../../..")
  : path.resolve(__dirname, "../../../..");

const scriptPath = path.resolve(PROJECT_ROOT, "scripts/lib/retag-mutations.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require(scriptPath) as {
  VALID_CATEGORIES: string[];
  entryKey: (e: { source: string; candidate: string; type: string }) => string;
  validateBatchShape: (batch: unknown) => { valid: boolean; errors: string[] };
  addNewVocabulary: (
    vocab: VocabShape,
    newVocabList: Array<{ tag: string; category: string; definition: string }>
  ) => { vocab: VocabShape; errors: string[] };
  classifyTags: (
    tags: unknown[],
    vocab: VocabShape
  ) => {
    canonicalTags: string[];
    invalid: Array<{ tag: string }>;
    forbidden: Array<{ tag: string }>;
    synonymsApplied: Record<string, string>;
  };
  semanticCount: (tags: string[], vocab: VocabShape) => number;
  applyBatch: (
    journalEntries: Array<Record<string, unknown>>,
    batch: BatchShape,
    vocab: VocabShape
  ) => {
    entryUpdates: Map<string, string[]>;
    journalEntries: Array<Record<string, unknown>>;
    retagged: string[];
    unmatched: string[];
  };
  recomputeCounts: (vocab: VocabShape, journalEntries: Array<{ tags?: string[] }>) => VocabShape;
  assertRegression: (
    rawLinesBefore: Array<{ entry: { source: string; candidate: string; type: string } | null }>,
    rawLinesAfter: Array<{ entry: { source: string; candidate: string; type: string } | null }>,
    batch: BatchShape,
    applyRes: { retagged: string[] }
  ) => void;
};

type VocabShape = {
  tags: Record<string, { category: string; definition?: string; count?: number }>;
  synonyms?: Record<string, string>;
  forbidden?: Record<string, string[]>;
  categories?: Record<string, unknown>;
  last_updated?: string;
};
type BatchShape = {
  batch_id: string;
  entries: Array<{ source: string; candidate: string; type: string; tags: string[] }>;
  new_vocabulary?: Array<{ tag: string; category: string; definition: string }>;
};

const {
  VALID_CATEGORIES,
  entryKey,
  validateBatchShape,
  addNewVocabulary,
  classifyTags,
  semanticCount,
  applyBatch,
  recomputeCounts,
  assertRegression,
} = mod;

function makeVocab(overrides: Partial<VocabShape> = {}): VocabShape {
  return {
    tags: {
      architecture: { category: "domain", count: 0 },
      plugin: { category: "pattern", count: 0 },
      repo: { category: "taxonomic", count: 0 },
      ...(overrides.tags || {}),
    },
    synonyms: { plugins: "plugin", ...(overrides.synonyms || {}) },
    forbidden: { deprecated: ["todo", "wip"], ...(overrides.forbidden || {}) },
    categories: {
      domain: {},
      pattern: {},
      taxonomic: {},
      ...(overrides.categories || {}),
    },
  };
}

describe("entryKey", () => {
  test("combines source|candidate|type", () => {
    assert.equal(
      entryKey({ source: "github.com/foo/bar", candidate: "plugin pattern", type: "pattern" }),
      "github.com/foo/bar|plugin pattern|pattern"
    );
  });

  test("preserves empty fields as empty segments", () => {
    assert.equal(entryKey({ source: "s", candidate: "", type: "t" }), "s||t");
  });
});

describe("VALID_CATEGORIES", () => {
  test("includes expected categories", () => {
    assert.ok(VALID_CATEGORIES.includes("domain"));
    assert.ok(VALID_CATEGORIES.includes("pattern"));
    assert.ok(VALID_CATEGORIES.includes("taxonomic"));
  });
});

describe("validateBatchShape", () => {
  test("accepts a valid minimal batch", () => {
    const batch: BatchShape = {
      batch_id: "b1",
      entries: [{ source: "s", candidate: "c", type: "t", tags: ["architecture"] }],
    };
    const res = validateBatchShape(batch);
    assert.equal(res.valid, true);
    assert.deepEqual(res.errors, []);
  });

  test("rejects non-object batch", () => {
    assert.equal(validateBatchShape(null).valid, false);
    assert.equal(validateBatchShape("string").valid, false);
    assert.equal(validateBatchShape(42 as unknown).valid, false);
  });

  test("rejects missing or empty batch_id", () => {
    const res = validateBatchShape({ batch_id: "", entries: [] });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes("batch_id")));
  });

  test("rejects non-array entries", () => {
    const res = validateBatchShape({ batch_id: "b1", entries: "not-array" });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes("entries")));
  });

  test("reports missing source/candidate/type per entry", () => {
    const res = validateBatchShape({
      batch_id: "b1",
      entries: [{ source: "", candidate: "", type: "", tags: [] }],
    });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes("source")));
    assert.ok(res.errors.some((e) => e.includes("candidate")));
    assert.ok(res.errors.some((e) => e.includes("type")));
  });

  test("rejects non-array tags on entry", () => {
    const res = validateBatchShape({
      batch_id: "b1",
      entries: [{ source: "s", candidate: "c", type: "t", tags: "nope" }],
    });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes("tags")));
  });

  test("rejects new_vocabulary that is not an array", () => {
    const res = validateBatchShape({
      batch_id: "b1",
      entries: [],
      new_vocabulary: { tag: "x" },
    });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes("new_vocabulary")));
  });

  test("rejects new_vocabulary item with invalid category", () => {
    const res = validateBatchShape({
      batch_id: "b1",
      entries: [],
      new_vocabulary: [{ tag: "x", category: "NOT_A_CATEGORY", definition: "definition-here" }],
    });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes("category")));
  });

  test("rejects new_vocabulary item with too-short definition", () => {
    const res = validateBatchShape({
      batch_id: "b1",
      entries: [],
      new_vocabulary: [{ tag: "x", category: "domain", definition: "short" }],
    });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes("definition")));
  });

  test("accepts batch without new_vocabulary", () => {
    const res = validateBatchShape({
      batch_id: "b1",
      entries: [{ source: "s", candidate: "c", type: "t", tags: [] }],
    });
    assert.equal(res.valid, true);
  });
});

describe("addNewVocabulary", () => {
  test("adds a new tag and does not mutate input", () => {
    const vocab = makeVocab();
    const snapshotBefore = JSON.stringify(vocab);
    const res = addNewVocabulary(vocab, [
      { tag: "observability", category: "domain", definition: "monitoring concerns" },
    ]);
    assert.deepEqual(res.errors, []);
    assert.ok(res.vocab.tags.observability);
    assert.equal(res.vocab.tags.observability.category, "domain");
    assert.equal(JSON.stringify(vocab), snapshotBefore);
  });

  test("rejects tag that already exists", () => {
    const vocab = makeVocab();
    const res = addNewVocabulary(vocab, [
      { tag: "architecture", category: "domain", definition: "already exists" },
    ]);
    assert.ok(res.errors.some((e) => e.includes("already exists")));
  });

  test("rejects tag that is already a synonym", () => {
    const vocab = makeVocab();
    const res = addNewVocabulary(vocab, [
      { tag: "plugins", category: "pattern", definition: "a synonym for plugin" },
    ]);
    assert.ok(res.errors.some((e) => e.includes("synonym")));
  });

  test("rejects tag that is in the forbidden list", () => {
    const vocab = makeVocab();
    const res = addNewVocabulary(vocab, [
      { tag: "todo", category: "pattern", definition: "this is forbidden" },
    ]);
    assert.ok(res.errors.some((e) => e.includes("forbidden")));
  });

  test("trims definition whitespace", () => {
    const vocab = makeVocab();
    const res = addNewVocabulary(vocab, [
      { tag: "caching", category: "pattern", definition: "   cache pattern   " },
    ]);
    assert.equal(res.errors.length, 0);
    assert.equal(res.vocab.tags.caching.definition, "cache pattern");
  });

  test("initializes count to 0 and stamps added_at date", () => {
    const vocab = makeVocab();
    const res = addNewVocabulary(vocab, [
      { tag: "caching", category: "pattern", definition: "cache pattern" },
    ]);
    assert.equal(res.vocab.tags.caching.count, 0);
    const added = (res.vocab.tags.caching as { added_at?: string }).added_at;
    assert.ok(typeof added === "string" && /^\d{4}-\d{2}-\d{2}$/.test(added));
  });
});

describe("classifyTags", () => {
  test("passes through a known tag as canonical", () => {
    const vocab = makeVocab();
    const res = classifyTags(["architecture"], vocab);
    assert.deepEqual(res.canonicalTags, ["architecture"]);
    assert.deepEqual(res.invalid, []);
    assert.deepEqual(res.forbidden, []);
    assert.deepEqual(res.synonymsApplied, {});
  });

  test("resolves synonym to canonical tag", () => {
    const vocab = makeVocab();
    const res = classifyTags(["plugins"], vocab);
    assert.deepEqual(res.canonicalTags, ["plugin"]);
    assert.equal(res.synonymsApplied.plugins, "plugin");
  });

  test("routes forbidden tag to forbidden list", () => {
    const vocab = makeVocab();
    const res = classifyTags(["todo"], vocab);
    assert.deepEqual(res.forbidden, [{ tag: "todo" }]);
    assert.deepEqual(res.canonicalTags, []);
  });

  test("routes unknown tag to invalid list", () => {
    const vocab = makeVocab();
    const res = classifyTags(["neverseenbefore"], vocab);
    assert.deepEqual(res.invalid, [{ tag: "neverseenbefore" }]);
    assert.deepEqual(res.canonicalTags, []);
  });

  test("deduplicates canonical tags", () => {
    const vocab = makeVocab();
    const res = classifyTags(["architecture", "architecture", "plugins", "plugin"], vocab);
    assert.deepEqual(
      res.canonicalTags.toSorted((a, b) => a.localeCompare(b)),
      ["architecture", "plugin"]
    );
  });

  test("skips empty and whitespace-only strings", () => {
    const vocab = makeVocab();
    const res = classifyTags(["", "   ", "architecture"], vocab);
    assert.deepEqual(res.canonicalTags, ["architecture"]);
  });

  test("trims whitespace before classification", () => {
    const vocab = makeVocab();
    const res = classifyTags(["  architecture  "], vocab);
    assert.deepEqual(res.canonicalTags, ["architecture"]);
  });

  test("returns empty result when vocab is null", () => {
    const res = classifyTags(["architecture", "plugin"], null as unknown as VocabShape);
    assert.deepEqual(res.canonicalTags, []);
    assert.deepEqual(res.invalid, []);
    assert.deepEqual(res.forbidden, []);
    assert.deepEqual(res.synonymsApplied, {});
  });

  test("returns empty result when vocab.tags is missing", () => {
    const res = classifyTags(["architecture"], {} as unknown as VocabShape);
    assert.deepEqual(res.canonicalTags, []);
  });
});

describe("semanticCount", () => {
  test("counts only non-taxonomic tags", () => {
    const vocab = makeVocab();
    assert.equal(semanticCount(["architecture", "plugin", "repo"], vocab), 2);
  });

  test("ignores tags not in vocab", () => {
    const vocab = makeVocab();
    assert.equal(semanticCount(["architecture", "nonexistent"], vocab), 1);
  });

  test("returns 0 for empty input", () => {
    const vocab = makeVocab();
    assert.equal(semanticCount([], vocab), 0);
  });
});

describe("applyBatch", () => {
  function journal(): Array<Record<string, unknown>> {
    return [
      { source: "s1", candidate: "c1", type: "pattern", tags: ["oldtag"] },
      { source: "s2", candidate: "c2", type: "pattern", tags: ["oldtag"] },
    ];
  }

  test("retags matched entries with canonical tags", () => {
    const vocab = makeVocab();
    const batch: BatchShape = {
      batch_id: "b1",
      entries: [
        { source: "s1", candidate: "c1", type: "pattern", tags: ["architecture", "plugin"] },
      ],
    };
    const res = applyBatch(journal(), batch, vocab);
    assert.deepEqual(res.retagged, ["s1|c1|pattern"]);
    assert.deepEqual(res.unmatched, []);
    const updated = res.journalEntries.find((e) => e.source === "s1");
    assert.deepEqual(updated!.tags, ["architecture", "plugin"]);
  });

  test("records unmatched composite keys", () => {
    const vocab = makeVocab();
    const batch: BatchShape = {
      batch_id: "b1",
      entries: [
        { source: "missing", candidate: "missing", type: "pattern", tags: ["architecture"] },
      ],
    };
    const res = applyBatch(journal(), batch, vocab);
    assert.deepEqual(res.retagged, []);
    assert.deepEqual(res.unmatched, ["missing|missing|pattern"]);
  });

  test("leaves non-matched journal entries unchanged", () => {
    const vocab = makeVocab();
    const batch: BatchShape = {
      batch_id: "b1",
      entries: [{ source: "s1", candidate: "c1", type: "pattern", tags: ["architecture"] }],
    };
    const res = applyBatch(journal(), batch, vocab);
    const s2 = res.journalEntries.find((e) => e.source === "s2");
    assert.deepEqual(s2!.tags, ["oldtag"]);
  });

  test("applies synonym resolution to entries", () => {
    const vocab = makeVocab();
    const batch: BatchShape = {
      batch_id: "b1",
      entries: [{ source: "s1", candidate: "c1", type: "pattern", tags: ["plugins"] }],
    };
    const res = applyBatch(journal(), batch, vocab);
    const updated = res.journalEntries.find((e) => e.source === "s1");
    assert.deepEqual(updated!.tags, ["plugin"]);
  });
});

describe("recomputeCounts", () => {
  test("recomputes counts from journal entries", () => {
    const vocab = makeVocab();
    const journal = [
      { tags: ["architecture", "plugin"] },
      { tags: ["architecture"] },
      { tags: ["repo"] },
    ];
    const out = recomputeCounts(vocab, journal);
    assert.equal(out.tags.architecture.count, 2);
    assert.equal(out.tags.plugin.count, 1);
    assert.equal(out.tags.repo.count, 1);
  });

  test("ignores tags not in vocab", () => {
    const vocab = makeVocab();
    const out = recomputeCounts(vocab, [{ tags: ["nonexistent", "architecture"] }]);
    assert.equal(out.tags.architecture.count, 1);
    // Ensure nonexistent was not silently added
    assert.equal(out.tags.nonexistent, undefined);
  });

  test("zeroes out counts before recomputing", () => {
    const vocab = makeVocab({
      tags: {
        architecture: { category: "domain", count: 99 },
        plugin: { category: "pattern", count: 0 },
        repo: { category: "taxonomic", count: 0 },
      },
    });
    const out = recomputeCounts(vocab, [{ tags: ["plugin"] }]);
    assert.equal(out.tags.architecture.count, 0);
    assert.equal(out.tags.plugin.count, 1);
  });

  test("stamps last_updated with an ISO date", () => {
    const vocab = makeVocab();
    const out = recomputeCounts(vocab, []);
    assert.ok(typeof out.last_updated === "string");
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(out.last_updated!));
  });

  test("does not mutate input vocab", () => {
    const vocab = makeVocab();
    const snapshot = JSON.stringify(vocab);
    recomputeCounts(vocab, [{ tags: ["architecture"] }]);
    assert.equal(JSON.stringify(vocab), snapshot);
  });
});

describe("assertRegression", () => {
  function mkLine(key: { source: string; candidate: string; type: string } | null) {
    return { entry: key };
  }

  test("passes when line count is same and all keys preserved", () => {
    const before = [
      mkLine({ source: "s1", candidate: "c1", type: "pattern" }),
      mkLine(null), // blank line
    ];
    const after = [mkLine({ source: "s1", candidate: "c1", type: "pattern" }), mkLine(null)];
    const applyRes = { retagged: [] };
    assert.doesNotThrow(() =>
      assertRegression(before, after, { batch_id: "b", entries: [] }, applyRes)
    );
  });

  test("throws when line count changed", () => {
    const before = [mkLine({ source: "s1", candidate: "c1", type: "pattern" })];
    const after = [
      mkLine({ source: "s1", candidate: "c1", type: "pattern" }),
      mkLine({ source: "s2", candidate: "c2", type: "pattern" }),
    ];
    assert.throws(
      () => assertRegression(before, after, { batch_id: "b", entries: [] }, { retagged: [] }),
      /line count changed/
    );
  });

  test("throws when an existing entry key is lost", () => {
    const before = [
      mkLine({ source: "s1", candidate: "c1", type: "pattern" }),
      mkLine({ source: "s2", candidate: "c2", type: "pattern" }),
    ];
    const after = [
      mkLine({ source: "s1", candidate: "c1", type: "pattern" }),
      mkLine({ source: "s-NEW", candidate: "c2", type: "pattern" }),
    ];
    assert.throws(
      () => assertRegression(before, after, { batch_id: "b", entries: [] }, { retagged: [] }),
      /lost during apply/
    );
  });

  test("throws when retagged key is not present post-apply", () => {
    const before = [mkLine({ source: "s1", candidate: "c1", type: "pattern" })];
    const after = [mkLine({ source: "s1", candidate: "c1", type: "pattern" })];
    assert.throws(
      () =>
        assertRegression(
          before,
          after,
          { batch_id: "b", entries: [] },
          {
            retagged: ["s-GONE|c-GONE|pattern"],
          }
        ),
      /not present post-apply/
    );
  });
});
