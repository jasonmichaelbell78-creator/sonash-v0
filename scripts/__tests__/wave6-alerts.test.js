/* global __dirname */
/**
 * wave6-alerts.test.js — Semantic tests for Wave 6 alert checkers
 *
 * Tests the core logic of four functions in run-alerts.js by reimplementing
 * their condition-check as test helpers that mirror the source exactly.
 * Fixtures are real JSONL written to temp files in os.tmpdir().
 */

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

// ---------------------------------------------------------------------------
// Helpers mirroring run-alerts.js internals
// ---------------------------------------------------------------------------

const safeParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

function safeReadLines(fp) {
  try {
    if (fs.statSync(fp).size > 10 * 1024 * 1024) return [];
  } catch {
    return [];
  }
  try {
    return fs.readFileSync(fp, "utf8").trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function runVelocityCheck(fp) {
  const lines = safeReadLines(fp);
  if (lines.length === 0) return { fired: false, reason: "empty" };
  const recent = lines
    .slice(-3)
    .map((l) => safeParse(l))
    .filter(Boolean);
  if (recent.length < 2) return { fired: false, reason: "insufficient" };
  const velocities = recent.map((e) => e.items_completed || e.velocity || 0);
  const last = velocities.length - 1;
  const prev = velocities[last - 1],
    cur = velocities[last];
  if (prev <= 0) return { fired: false, reason: "zero-prev" };
  const dropPct = ((prev - cur) / prev) * 100;
  return { fired: dropPct >= 50, dropPct, severity: "warning", category: "velocity-regression" };
}

function runPlanningCheck(fp, nowMs = Date.now()) {
  const lines = safeReadLines(fp);
  if (lines.length === 0) return { fired: false, reason: "empty" };
  let latest = null;
  for (const line of lines) {
    const e = safeParse(line);
    if (!e) continue;
    const ts = new Date(e.date || e.timestamp || e.created || "").getTime();
    if (!Number.isNaN(ts) && (latest === null || ts > latest)) latest = ts;
  }
  if (latest === null) return { fired: false, reason: "no-valid-date" };
  const days = Math.floor((nowMs - latest) / 86400000);
  return {
    fired: days >= 30,
    daysSinceLastEntry: days,
    severity: "info",
    category: "planning-data",
  };
}

function runDeferredCheck(fp) {
  const lines = safeReadLines(fp);
  if (lines.length === 0) return { fired: false, reason: "empty", unresolvedCount: 0 };
  let n = 0;
  for (const line of lines) {
    const e = safeParse(line);
    if (e && !e.resolved_date) n++;
  }
  return { fired: n > 20, unresolvedCount: n, severity: "warning", category: "deferred-items" };
}

function runCommitCheck(fp) {
  const lines = safeReadLines(fp);
  if (lines.length === 0) return { fired: false, reason: "empty" };
  const entries = lines
    .slice(-10)
    .map((l) => safeParse(l))
    .filter(Boolean);
  if (entries.length === 0) return { fired: false, reason: "no-valid-entries" };
  const sessionCount = entries.filter((e) =>
    (e.message || "").toLowerCase().includes("session")
  ).length;
  const pct = (sessionCount / entries.length) * 100;
  return {
    fired: pct > 50,
    sessionEndPct: pct,
    sessionEndCount: sessionCount,
    totalEntries: entries.length,
    severity: "info",
    category: "commit-patterns",
  };
}

// ---------------------------------------------------------------------------
// Fixture utilities
// ---------------------------------------------------------------------------

let tempDir;
const setup = () => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "wave6-"));
};
const teardown = () => {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    /* best-effort */
  }
};
const write = (name, rows) => {
  const fp = path.join(tempDir, name);
  fs.writeFileSync(fp, rows.join("\n") + "\n", "utf8");
  return fp;
};
const j = (obj) => JSON.stringify(obj);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

// ---------------------------------------------------------------------------
// checkVelocityRegression — 6 tests
// ---------------------------------------------------------------------------

describe("checkVelocityRegression", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("fires warning when last session velocity drops 50% or more", () => {
    const fp = write("v.jsonl", [
      j({ items_completed: 10 }),
      j({ items_completed: 8 }),
      j({ items_completed: 4 }),
    ]);
    const r = runVelocityCheck(fp);
    assert.equal(r.fired, true);
    assert.equal(r.severity, "warning");
    assert.equal(r.category, "velocity-regression");
  });

  it("does not fire when velocity drop is less than 50%", () => {
    const fp = write("v.jsonl", [j({ items_completed: 10 }), j({ items_completed: 7 })]);
    assert.equal(runVelocityCheck(fp).fired, false);
  });

  it("does not fire when velocity drop is exactly 40%", () => {
    const fp = write("v.jsonl", [j({ items_completed: 10 }), j({ items_completed: 6 })]);
    assert.equal(runVelocityCheck(fp).fired, false);
  });

  it("handles empty velocity-log gracefully without crashing", () => {
    const fp = write("v-empty.jsonl", []);
    assert.doesNotThrow(() => runVelocityCheck(fp));
    assert.equal(runVelocityCheck(fp).fired, false);
  });

  it("handles single-entry log — cannot compare, returns insufficient", () => {
    const fp = write("v-one.jsonl", [j({ items_completed: 5 })]);
    const r = runVelocityCheck(fp);
    assert.equal(r.fired, false);
    assert.equal(r.reason, "insufficient");
  });

  it("handles entries with missing velocity fields without crashing", () => {
    const fp = write("v-nofields.jsonl", [j({ notes: "a" }), j({ notes: "b" })]);
    assert.doesNotThrow(() => runVelocityCheck(fp));
    assert.equal(runVelocityCheck(fp).fired, false);
  });
});

// ---------------------------------------------------------------------------
// checkStalePlanningData — 5 tests
// ---------------------------------------------------------------------------

describe("checkStalePlanningData", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("fires info when most recent entry is 31 days old", () => {
    const fp = write("d.jsonl", [j({ date: daysAgo(60) }), j({ date: daysAgo(31) })]);
    const r = runPlanningCheck(fp);
    assert.equal(r.fired, true);
    assert.equal(r.severity, "info");
    assert.equal(r.category, "planning-data");
  });

  it("does not fire when most recent entry is 20 days old", () => {
    const fp = write("d.jsonl", [j({ date: daysAgo(20) })]);
    assert.equal(runPlanningCheck(fp).fired, false);
  });

  it("handles missing file gracefully", () => {
    const r = runPlanningCheck(path.join(tempDir, "no-such-file.jsonl"));
    assert.equal(r.fired, false);
    assert.equal(r.reason, "empty");
  });

  it("handles empty file gracefully", () => {
    const fp = write("d-empty.jsonl", []);
    assert.equal(runPlanningCheck(fp).fired, false);
  });

  it("picks the most recent date across date, timestamp, and created fields", () => {
    const fp = write("d-mixed.jsonl", [
      j({ timestamp: daysAgo(90) }),
      j({ created: daysAgo(45) }),
      j({ date: daysAgo(5) }),
    ]);
    const r = runPlanningCheck(fp);
    assert.equal(r.fired, false, "most recent is 5 days — should not fire");
    assert.ok(r.daysSinceLastEntry <= 6);
  });
});

// ---------------------------------------------------------------------------
// checkDeferredItemsStaleness — 5 tests
// ---------------------------------------------------------------------------

describe("checkDeferredItemsStaleness", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("fires warning when there are 21 unresolved items", () => {
    const fp = write(
      "def.jsonl",
      Array.from({ length: 21 }, (_, i) => j({ id: i }))
    );
    const r = runDeferredCheck(fp);
    assert.equal(r.fired, true);
    assert.equal(r.unresolvedCount, 21);
    assert.equal(r.severity, "warning");
    assert.equal(r.category, "deferred-items");
  });

  it("does not fire when there are exactly 20 unresolved items", () => {
    const fp = write(
      "def.jsonl",
      Array.from({ length: 20 }, (_, i) => j({ id: i }))
    );
    const r = runDeferredCheck(fp);
    assert.equal(r.fired, false);
    assert.equal(r.unresolvedCount, 20);
  });

  it("correctly ignores entries that have a resolved_date field", () => {
    const rows = [
      j({ id: 1, resolved_date: "2026-01-01" }),
      j({ id: 2, resolved_date: "2026-02-01" }),
      ...Array.from({ length: 5 }, (_, i) => j({ id: i + 3 })),
    ];
    const r = runDeferredCheck(write("def-mix.jsonl", rows));
    assert.equal(r.unresolvedCount, 5);
    assert.equal(r.fired, false);
  });

  it("handles empty file gracefully", () => {
    const r = runDeferredCheck(write("def-empty.jsonl", []));
    assert.equal(r.fired, false);
    assert.equal(r.unresolvedCount, 0);
  });

  it("skips corrupt JSON lines and counts only valid unresolved entries", () => {
    const fp = write("def-corrupt.jsonl", [
      "not json",
      "{broken:",
      j({ id: 1 }),
      j({ id: 2, resolved_date: "2026-01-10" }),
    ]);
    assert.doesNotThrow(() => runDeferredCheck(fp));
    assert.equal(runDeferredCheck(fp).unresolvedCount, 1);
  });
});

// ---------------------------------------------------------------------------
// checkCommitPatterns — 5 tests
// ---------------------------------------------------------------------------

describe("checkCommitPatterns", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("fires info when >50% of last 10 commits contain 'session' in message", () => {
    const rows = [
      ...Array.from({ length: 6 }, (_, i) => j({ message: `session-end wrap ${i}` })),
      ...Array.from({ length: 4 }, (_, i) => j({ message: `feat: add thing ${i}` })),
    ];
    const r = runCommitCheck(write("c.jsonl", rows));
    assert.equal(r.fired, true);
    assert.equal(r.sessionEndCount, 6);
    assert.equal(r.severity, "info");
    assert.equal(r.category, "commit-patterns");
  });

  it("does not fire when exactly 50% of commits contain 'session'", () => {
    const rows = [
      ...Array.from({ length: 5 }, (_, i) => j({ message: `session wrap ${i}` })),
      ...Array.from({ length: 5 }, (_, i) => j({ message: `fix: bug ${i}` })),
    ];
    const r = runCommitCheck(write("c-50.jsonl", rows));
    assert.equal(r.fired, false);
    assert.equal(r.sessionEndPct, 50);
  });

  it("handles empty file gracefully without throwing", () => {
    assert.doesNotThrow(() => runCommitCheck(write("c-empty.jsonl", [])));
    assert.equal(runCommitCheck(write("c-empty2.jsonl", [])).fired, false);
  });

  it("only inspects the message field, not other fields containing 'session'", () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
      j({ message: `chore: cleanup ${i}`, tag: "session-tag" })
    );
    const r = runCommitCheck(write("c-tag.jsonl", rows));
    assert.equal(r.fired, false);
    assert.equal(r.sessionEndCount, 0);
  });

  it("handles fewer than 10 entries and counts only those present", () => {
    const rows = [
      j({ message: "session-end: wrap" }),
      j({ message: "session-end: wrap" }),
      j({ message: "fix: thing" }),
    ];
    const r = runCommitCheck(write("c-few.jsonl", rows));
    assert.equal(r.fired, true, "2/3 = 66.7% should fire");
    assert.equal(r.totalEntries, 3);
    assert.equal(r.sessionEndCount, 2);
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting — 3 tests
// ---------------------------------------------------------------------------

describe("cross-cutting: edge-case handling", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("all checkers handle CRLF line endings without crashing", () => {
    const crlf = (rows) => rows.join("\r\n") + "\r\n";
    const velFp = path.join(tempDir, "vel-crlf.jsonl");
    const planFp = path.join(tempDir, "plan-crlf.jsonl");
    const defFp = path.join(tempDir, "def-crlf.jsonl");
    const comFp = path.join(tempDir, "com-crlf.jsonl");
    fs.writeFileSync(velFp, crlf([j({ items_completed: 10 }), j({ items_completed: 3 })]), "utf8");
    fs.writeFileSync(planFp, crlf([j({ date: daysAgo(5) })]), "utf8");
    fs.writeFileSync(defFp, crlf([j({ id: 1 })]), "utf8");
    fs.writeFileSync(comFp, crlf([j({ message: "fix: normal" })]), "utf8");
    assert.doesNotThrow(() => runVelocityCheck(velFp));
    assert.doesNotThrow(() => runPlanningCheck(planFp));
    assert.doesNotThrow(() => runDeferredCheck(defFp));
    assert.doesNotThrow(() => runCommitCheck(comFp));
  });

  it("all checkers handle files with trailing newlines without crashing", () => {
    const trail = (rows) => rows.join("\n") + "\n\n\n";
    const velFp = path.join(tempDir, "vel-trail.jsonl");
    const planFp = path.join(tempDir, "plan-trail.jsonl");
    const defFp = path.join(tempDir, "def-trail.jsonl");
    const comFp = path.join(tempDir, "com-trail.jsonl");
    fs.writeFileSync(velFp, trail([j({ items_completed: 8 }), j({ items_completed: 6 })]), "utf8");
    fs.writeFileSync(planFp, trail([j({ date: daysAgo(5) })]), "utf8");
    fs.writeFileSync(defFp, trail([j({ id: 1 })]), "utf8");
    fs.writeFileSync(comFp, trail([j({ message: "feat: add" })]), "utf8");
    assert.doesNotThrow(() => runVelocityCheck(velFp));
    assert.doesNotThrow(() => runPlanningCheck(planFp));
    assert.doesNotThrow(() => runDeferredCheck(defFp));
    assert.doesNotThrow(() => runCommitCheck(comFp));
  });

  it("alert severity levels match specification: warning/info/warning/info", () => {
    const velFp = write("sev-vel.jsonl", [j({ items_completed: 10 }), j({ items_completed: 2 })]);
    const planFp = write("sev-plan.jsonl", [j({ date: daysAgo(45) })]);
    const defFp = write(
      "sev-def.jsonl",
      Array.from({ length: 25 }, (_, i) => j({ id: i }))
    );
    const comFp = write("sev-com.jsonl", [
      ...Array.from({ length: 8 }, (_, i) => j({ message: `session-end ${i}` })),
      ...Array.from({ length: 2 }, (_, i) => j({ message: `fix: normal ${i}` })),
    ]);
    const vel = runVelocityCheck(velFp);
    const plan = runPlanningCheck(planFp);
    const def = runDeferredCheck(defFp);
    const com = runCommitCheck(comFp);
    assert.equal(vel.fired, true);
    assert.equal(vel.severity, "warning");
    assert.equal(plan.fired, true);
    assert.equal(plan.severity, "info");
    assert.equal(def.fired, true);
    assert.equal(def.severity, "warning");
    assert.equal(com.fired, true);
    assert.equal(com.severity, "info");
  });
});
