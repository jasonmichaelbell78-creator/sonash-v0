/**
 * todos-mutations.js Tests
 *
 * Covers the pure mutation helpers used by scripts/planning/todos-cli.js.
 * The CLI itself is a thin dispatcher; the testable surface is here.
 *
 * Critical coverage targets:
 * - Regression guard refuses silent drops, lingering removals, missing adds
 * - Validation rejects malformed records and non-monotonic id sequences
 * - All 7 mutation ops produce expectations consistent with their actual changes
 * - Strict parser surfaces line numbers on bad input
 *
 * Run: npm run test:build && node --test dist-tests/tests/scripts/lib/todos-mutations.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);
const MODULE_PATH = path.resolve(PROJECT_ROOT, "scripts/lib/todos-mutations.js");

interface TodoRecord {
  id: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  progress?: string;
  tags?: string[];
  context?: { branch: string; files: string[] };
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
}

interface MutationResult {
  after: TodoRecord[];
  expectations: {
    priorIds: Set<string>;
    removedIds: string[];
    addedIds: string[];
    expectedDelta: number;
  };
  summary: string;
}

interface MutationsModule {
  parseIdNumber: (id: unknown) => number;
  nextId: (records: TodoRecord[]) => string;
  validateRecordShape: (
    rec: Partial<TodoRecord> | Record<string, unknown>,
    opts?: { partial: boolean }
  ) => string[];
  validateIntegrity: (records: TodoRecord[]) => string[];
  assertRegressionGuard: (
    expectations: {
      priorIds: Set<string>;
      removedIds: string[];
      addedIds: string[];
      expectedDelta: number;
    },
    before: TodoRecord[],
    after: TodoRecord[]
  ) => void;
  parseStrictJsonl: (raw: string) => TodoRecord[];
  serializeJsonl: (records: TodoRecord[]) => string;
  opAdd: (before: TodoRecord[], payload: Record<string, unknown>) => MutationResult;
  opEdit: (before: TodoRecord[], id: string, patch: Record<string, unknown>) => MutationResult;
  opComplete: (before: TodoRecord[], id: string) => MutationResult;
  opProgress: (before: TodoRecord[], id: string, text: string) => MutationResult;
  opDelete: (before: TodoRecord[], id: string) => MutationResult;
  opReprioritize: (before: TodoRecord[], id: string, priority: string) => MutationResult;
  opArchive: (
    before: TodoRecord[],
    opts: { id?: string; ids?: string[]; completed?: boolean }
  ) => MutationResult;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require(MODULE_PATH) as MutationsModule;

// ---- Fixtures ----

function makeRec(id: string, overrides: Partial<TodoRecord> = {}): TodoRecord {
  return {
    id,
    title: `Test ${id}`,
    description: "",
    priority: "P2",
    status: "pending",
    progress: "",
    tags: [],
    context: { branch: "test", files: [] },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    completedAt: null,
    ...overrides,
  };
}

const FIXTURE: TodoRecord[] = [
  makeRec("T1", { title: "First", priority: "P0" }),
  makeRec("T2", { title: "Second", priority: "P1", status: "in-progress" }),
  makeRec("T3", { title: "Third", priority: "P2", status: "completed" }),
];

// ---- parseIdNumber ----

describe("parseIdNumber", () => {
  it("parses T1 → 1", () => assert.equal(mod.parseIdNumber("T1"), 1));
  it("parses T29 → 29", () => assert.equal(mod.parseIdNumber("T29"), 29));
  it("parses T999 → 999", () => assert.equal(mod.parseIdNumber("T999"), 999));
  it("returns NaN for malformed id", () => assert.ok(Number.isNaN(mod.parseIdNumber("X1"))));
  it("returns NaN for null", () => assert.ok(Number.isNaN(mod.parseIdNumber(null))));
  it("returns NaN for empty string", () => assert.ok(Number.isNaN(mod.parseIdNumber(""))));
  it("returns NaN for non-string", () => assert.ok(Number.isNaN(mod.parseIdNumber(42))));
});

// ---- nextId ----

describe("nextId", () => {
  it("returns T1 for empty input", () => assert.equal(mod.nextId([]), "T1"));
  it("returns max + 1", () => assert.equal(mod.nextId(FIXTURE), "T4"));
  it("handles gaps", () => {
    const withGap = [makeRec("T1"), makeRec("T5"), makeRec("T9")];
    assert.equal(mod.nextId(withGap), "T10");
  });
  it("ignores malformed ids when computing max", () => {
    const mixed = [makeRec("T1"), { ...makeRec("X9"), id: "X9" }, makeRec("T3")];
    assert.equal(mod.nextId(mixed), "T4");
  });
});

// ---- validateRecordShape ----

describe("validateRecordShape", () => {
  it("accepts a complete valid record", () => {
    assert.deepEqual(mod.validateRecordShape(makeRec("T1")), []);
  });
  it("rejects missing title (full mode)", () => {
    const rec = { id: "T1" } as Record<string, unknown>;
    const errs = mod.validateRecordShape(rec);
    assert.ok(errs.some((e) => e.includes("title required")));
  });
  it("accepts partial record (no id, no title)", () => {
    assert.deepEqual(mod.validateRecordShape({ priority: "P1" }, { partial: true }), []);
  });
  it("rejects bad priority", () => {
    const errs = mod.validateRecordShape({ priority: "P9" }, { partial: true });
    assert.ok(errs.some((e) => e.includes("priority must be")));
  });
  it("rejects bad status", () => {
    const errs = mod.validateRecordShape({ status: "wat" }, { partial: true });
    assert.ok(errs.some((e) => e.includes("status must be")));
  });
  it("rejects non-array tags", () => {
    const errs = mod.validateRecordShape({ tags: "not-array" } as Record<string, unknown>, {
      partial: true,
    });
    assert.ok(errs.some((e) => e.includes("tags must be an array")));
  });
});

// ---- validateIntegrity ----

describe("validateIntegrity", () => {
  it("accepts a clean monotonic fixture", () => {
    assert.deepEqual(mod.validateIntegrity(FIXTURE), []);
  });
  it("flags duplicates", () => {
    const dup = [...FIXTURE, makeRec("T2")];
    const errs = mod.validateIntegrity(dup);
    assert.ok(errs.some((e) => e.includes("duplicate id: T2")));
  });
  it("flags non-monotonic ids (T2 after T3)", () => {
    const out = [makeRec("T1"), makeRec("T3"), makeRec("T2")];
    const errs = mod.validateIntegrity(out);
    assert.ok(errs.some((e) => e.includes("non-monotonic id: T2")));
  });
  it("allows id gaps (T1, T5, T9)", () => {
    const gapped = [makeRec("T1"), makeRec("T5"), makeRec("T9")];
    assert.deepEqual(mod.validateIntegrity(gapped), []);
  });
  it("flags malformed id", () => {
    const bad = [{ ...makeRec("T1"), id: "BAD" }];
    const errs = mod.validateIntegrity(bad);
    assert.ok(errs.some((e) => e.includes("malformed id: BAD")));
  });
});

// ---- assertRegressionGuard ----

describe("assertRegressionGuard", () => {
  it("passes for a clean add (delta +1, addedId present)", () => {
    const before = FIXTURE;
    const after = [...before, makeRec("T4")];
    mod.assertRegressionGuard(
      {
        priorIds: new Set(before.map((r) => r.id)),
        removedIds: [],
        addedIds: ["T4"],
        expectedDelta: 1,
      },
      before,
      after
    );
  });

  it("passes for a clean edit (delta 0, ids unchanged)", () => {
    const before = FIXTURE;
    const after = before.map((r) => (r.id === "T1" ? { ...r, priority: "P0" } : r)) as TodoRecord[];
    mod.assertRegressionGuard(
      {
        priorIds: new Set(before.map((r) => r.id)),
        removedIds: [],
        addedIds: [],
        expectedDelta: 0,
      },
      before,
      after
    );
  });

  it("passes for a clean delete (delta -1, removedId gone)", () => {
    const before = FIXTURE;
    const after = before.filter((r) => r.id !== "T2");
    mod.assertRegressionGuard(
      {
        priorIds: new Set(before.map((r) => r.id)),
        removedIds: ["T2"],
        addedIds: [],
        expectedDelta: -1,
      },
      before,
      after
    );
  });

  it("THROWS when an unrelated id silently disappears (the bug we are fixing)", () => {
    const before = FIXTURE;
    // Simulate the bug: caller intended to "edit T2" but the in-memory copy
    // was missing T3 entirely. Result: T3 silently dropped.
    const corrupted = [makeRec("T1"), { ...makeRec("T2"), priority: "P0" }];
    assert.throws(
      () =>
        mod.assertRegressionGuard(
          {
            priorIds: new Set(before.map((r) => r.id)),
            removedIds: [],
            addedIds: [],
            expectedDelta: 0,
          },
          before,
          corrupted
        ),
      /regression guard/
    );
  });

  it("THROWS when expected delta does not match actual", () => {
    const before = FIXTURE;
    const after = [...before, makeRec("T4"), makeRec("T5")];
    assert.throws(
      () =>
        mod.assertRegressionGuard(
          {
            priorIds: new Set(before.map((r) => r.id)),
            removedIds: [],
            addedIds: ["T4"],
            expectedDelta: 1,
          },
          before,
          after
        ),
      /expected line count delta 1, got 2/
    );
  });

  it("THROWS when removedId is still present (delta matches but wrong id removed)", () => {
    const before = FIXTURE;
    // delta = -1 ✓ but T1 was removed instead of the expected T2
    const after = before.filter((r) => r.id !== "T1");
    assert.throws(
      () =>
        mod.assertRegressionGuard(
          {
            priorIds: new Set(before.map((r) => r.id)),
            removedIds: ["T2"],
            addedIds: [],
            expectedDelta: -1,
          },
          before,
          after
        ),
      /T1 was present before mutation but missing after/
    );
  });

  it("THROWS when addedId is missing (delta matches but wrong id added)", () => {
    const before = FIXTURE;
    // delta = +1 ✓ but T5 was added instead of the expected T4
    const after = [...before, makeRec("T5")];
    assert.throws(
      () =>
        mod.assertRegressionGuard(
          {
            priorIds: new Set(before.map((r) => r.id)),
            removedIds: [],
            addedIds: ["T4"],
            expectedDelta: 1,
          },
          before,
          after
        ),
      /T4 should have been added but is missing/
    );
  });
});

// ---- parseStrictJsonl ----

describe("parseStrictJsonl", () => {
  it("parses clean JSONL", () => {
    const raw = '{"id":"T1","title":"a"}\n{"id":"T2","title":"b"}\n';
    const out = mod.parseStrictJsonl(raw);
    assert.equal(out.length, 2);
    assert.equal(out[0].id, "T1");
  });
  it("skips empty lines and // comments", () => {
    const raw = '{"id":"T1","title":"a"}\n\n// a comment\n{"id":"T2","title":"b"}\n';
    const out = mod.parseStrictJsonl(raw);
    assert.equal(out.length, 2);
  });
  it("THROWS on malformed JSON with line number", () => {
    const raw = '{"id":"T1","title":"a"}\n{not valid json}\n';
    assert.throws(() => mod.parseStrictJsonl(raw), /parse error at line 2/);
  });
});

// ---- serializeJsonl round-trip ----

describe("serializeJsonl", () => {
  it("round-trips through parseStrictJsonl", () => {
    const out = mod.serializeJsonl(FIXTURE);
    const parsed = mod.parseStrictJsonl(out);
    assert.equal(parsed.length, FIXTURE.length);
    assert.equal(parsed[0].id, "T1");
    assert.equal(parsed[2].priority, "P2");
  });
  it("ends with a trailing newline", () => {
    const out = mod.serializeJsonl(FIXTURE);
    assert.ok(out.endsWith("\n"));
  });
});

// ---- opAdd ----

describe("opAdd", () => {
  it("assigns next sequential id", () => {
    const result = mod.opAdd(FIXTURE, { title: "New todo" });
    assert.equal(result.after.length, 4);
    assert.equal(result.after[3].id, "T4");
    assert.equal(result.expectations.expectedDelta, 1);
    assert.deepEqual(result.expectations.addedIds, ["T4"]);
  });
  it("applies defaults for missing fields", () => {
    const result = mod.opAdd([], { title: "Solo" });
    assert.equal(result.after[0].priority, "P2");
    assert.equal(result.after[0].status, "pending");
    assert.deepEqual(result.after[0].tags, []);
    assert.equal(result.after[0].completedAt, null);
  });
  it("THROWS without title", () => {
    assert.throws(() => mod.opAdd([], { priority: "P1" }), /title/);
  });
  it("THROWS for non-object payload", () => {
    assert.throws(
      () => mod.opAdd([], "not an object" as unknown as Record<string, unknown>),
      /JSON object/
    );
  });
});

// ---- opEdit ----

describe("opEdit", () => {
  it("applies field updates", () => {
    const result = mod.opEdit(FIXTURE, "T1", { priority: "P1" });
    assert.equal(result.after[0].priority, "P1");
    assert.equal(result.expectations.expectedDelta, 0);
  });
  it("THROWS for unknown id", () => {
    assert.throws(() => mod.opEdit(FIXTURE, "T999", { priority: "P1" }), /no todo with id T999/);
  });
  it("THROWS when patch tries to change id", () => {
    assert.throws(() => mod.opEdit(FIXTURE, "T1", { id: "T99" }), /cannot change id/);
  });
  it("preserves untouched fields", () => {
    const result = mod.opEdit(FIXTURE, "T1", { priority: "P3" });
    assert.equal(result.after[0].title, "First");
    assert.equal(result.after[0].status, "pending");
  });
});

// ---- opComplete ----

describe("opComplete", () => {
  it("sets status=completed and completedAt", () => {
    const result = mod.opComplete(FIXTURE, "T1");
    assert.equal(result.after[0].status, "completed");
    assert.ok(result.after[0].completedAt);
  });
  it("THROWS for unknown id", () => {
    assert.throws(() => mod.opComplete(FIXTURE, "T999"), /no todo with id T999/);
  });
});

// ---- opProgress ----

describe("opProgress", () => {
  it("updates the progress field", () => {
    const result = mod.opProgress(FIXTURE, "T2", "halfway done");
    assert.equal(result.after[1].progress, "halfway done");
  });
  it("THROWS without text", () => {
    assert.throws(
      () => mod.opProgress(FIXTURE, "T2", undefined as unknown as string),
      /requires text/
    );
  });
});

// ---- opDelete ----

describe("opDelete", () => {
  it("removes the matching record and reports the removal", () => {
    const result = mod.opDelete(FIXTURE, "T2");
    assert.equal(result.after.length, 2);
    assert.ok(!result.after.some((r) => r.id === "T2"));
    assert.deepEqual(result.expectations.removedIds, ["T2"]);
    assert.equal(result.expectations.expectedDelta, -1);
  });
  it("THROWS for unknown id", () => {
    assert.throws(() => mod.opDelete(FIXTURE, "T999"), /no todo with id T999/);
  });
});

// ---- opReprioritize ----

describe("opReprioritize", () => {
  it("updates priority", () => {
    const result = mod.opReprioritize(FIXTURE, "T2", "P0");
    assert.equal(result.after[1].priority, "P0");
  });
  it("THROWS for invalid priority", () => {
    assert.throws(() => mod.opReprioritize(FIXTURE, "T2", "P9"), /priority must be/);
  });
});

// ---- opArchive ----

describe("opArchive", () => {
  it("archives a single id", () => {
    const result = mod.opArchive(FIXTURE, { id: "T1" });
    assert.equal(result.after[0].status, "archived");
  });
  it("archives multiple ids via bulk", () => {
    const result = mod.opArchive(FIXTURE, { ids: ["T1", "T2"] });
    assert.equal(result.after[0].status, "archived");
    assert.equal(result.after[1].status, "archived");
    assert.equal(result.after[2].status, "completed"); // unchanged
  });
  it("archives all completed via --completed", () => {
    const result = mod.opArchive(FIXTURE, { completed: true });
    assert.equal(result.after[0].status, "pending"); // unchanged
    assert.equal(result.after[2].status, "archived"); // was completed
  });
  it("THROWS when --completed has no completed todos", () => {
    const noCompleted = FIXTURE.filter((r) => r.status !== "completed");
    assert.throws(() => mod.opArchive(noCompleted, { completed: true }), /no completed/);
  });
  it("THROWS for unknown id", () => {
    assert.throws(() => mod.opArchive(FIXTURE, { id: "T999" }), /no todo with id T999/);
  });
  it("THROWS when no opts provided", () => {
    assert.throws(() => mod.opArchive(FIXTURE, {}), /archive requires/);
  });
});
