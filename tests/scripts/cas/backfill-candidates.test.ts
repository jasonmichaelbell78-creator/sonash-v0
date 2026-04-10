/**
 * backfill-candidates.js Test Suite
 *
 * Tests the pure helpers exported by scripts/cas/backfill-candidates.js:
 * - journalEntryToCandidate (mapping)
 * - indexJournalBySource (grouping)
 * - mapAndValidateCandidates (validation, with empty-description fix)
 * - loadAnalysisJson (symlink-safe read via safe-cas-io)
 * - backfillOne (end-to-end via fixture tempdir)
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { test, describe, afterEach } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// Get project root (works both in source and compiled contexts)
const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../../package.json"))
  ? path.resolve(__dirname, "../../..")
  : path.resolve(__dirname, "../../../..");

const scriptPath = path.resolve(PROJECT_ROOT, "scripts/cas/backfill-candidates.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require(scriptPath) as {
  journalEntryToCandidate: (entry: Record<string, unknown>) => Record<string, unknown>;
  indexJournalBySource: (journal: Array<Record<string, unknown>>) => Map<string, unknown[]>;
  mapAndValidateCandidates: (entries: Array<Record<string, unknown>>) => {
    ok: boolean;
    candidates?: unknown[];
    reason?: string;
  };
  loadAnalysisJson: (filePath: string) => { status: string; data?: unknown; reason?: string };
  persistAnalysisJson: (filePath: string, data: unknown) => { ok: boolean; reason?: string };
};

const {
  journalEntryToCandidate,
  indexJournalBySource,
  mapAndValidateCandidates,
  loadAnalysisJson,
  persistAnalysisJson,
} = mod;

const tempDirs: string[] = [];
function tmpDir(prefix = "backfill-cand-test-"): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(d);
  return d;
}
afterEach(() => {
  while (tempDirs.length > 0) {
    const d = tempDirs.pop();
    if (d) {
      try {
        fs.rmSync(d, { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    }
  }
});

// Minimum valid candidate shape per analysis-schema.js candidateSchema.
function validJournalEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema_version: "2.0",
    source_type: "repo",
    source: "owner/repo",
    candidate: "Example pattern",
    type: "pattern",
    decision: "defer",
    decision_date: "2026-04-10",
    extracted_to: null,
    extracted_at: null,
    notes: "A short note",
    novelty: "medium",
    effort: "E1",
    relevance: "high",
    tags: ["example", "pattern"],
    ...overrides,
  };
}

describe("journalEntryToCandidate", () => {
  test("maps candidate → name and notes → description", () => {
    const entry = validJournalEntry({ candidate: "X", notes: "Y" });
    const cand = journalEntryToCandidate(entry);
    assert.equal(cand.name, "X");
    assert.equal(cand.description, "Y");
  });

  test("empty notes becomes empty description (not undefined)", () => {
    const entry = validJournalEntry({ notes: undefined });
    const cand = journalEntryToCandidate(entry);
    assert.equal(cand.description, "");
  });

  test("non-array tags becomes empty array", () => {
    const entry = validJournalEntry({ tags: null });
    const cand = journalEntryToCandidate(entry);
    assert.deepEqual(cand.tags, []);
  });

  test("preserves novelty / effort / relevance verbatim", () => {
    const entry = validJournalEntry({ novelty: "low", effort: "E3", relevance: "medium" });
    const cand = journalEntryToCandidate(entry);
    assert.equal(cand.novelty, "low");
    assert.equal(cand.effort, "E3");
    assert.equal(cand.relevance, "medium");
  });
});

describe("indexJournalBySource", () => {
  test("groups entries by source field", () => {
    const journal = [
      validJournalEntry({ source: "a/b", candidate: "1" }),
      validJournalEntry({ source: "a/b", candidate: "2" }),
      validJournalEntry({ source: "c/d", candidate: "3" }),
    ];
    const index = indexJournalBySource(journal);
    assert.equal(index.size, 2);
    assert.equal((index.get("a/b") as unknown[]).length, 2);
    assert.equal((index.get("c/d") as unknown[]).length, 1);
  });

  test("skips entries with no source field", () => {
    const journal = [
      validJournalEntry({ source: "a/b" }),
      { ...validJournalEntry(), source: undefined },
    ];
    const index = indexJournalBySource(journal);
    assert.equal(index.size, 1);
    assert.ok(index.has("a/b"));
  });
});

describe("mapAndValidateCandidates", () => {
  test("accepts valid journal entries", () => {
    const entries = [validJournalEntry(), validJournalEntry({ candidate: "Two" })];
    const result = mapAndValidateCandidates(entries);
    assert.equal(result.ok, true);
    assert.equal(result.candidates?.length, 2);
  });

  test("accepts empty-string description (PR #505 fix)", () => {
    // This is the key regression case: empty notes must NOT be treated as missing.
    const entries = [validJournalEntry({ notes: "" })];
    const result = mapAndValidateCandidates(entries);
    assert.equal(result.ok, true, `expected ok but got reason: ${result.reason}`);
  });

  test("rejects entry missing required name field", () => {
    const entries = [validJournalEntry({ candidate: null })];
    const result = mapAndValidateCandidates(entries);
    assert.equal(result.ok, false);
    assert.match(result.reason || "", /candidate 0/);
  });

  test("rejects invalid novelty enum value", () => {
    const entries = [validJournalEntry({ novelty: "unknown" })];
    const result = mapAndValidateCandidates(entries);
    assert.equal(result.ok, false);
    assert.match(result.reason || "", /novelty/);
  });

  test("rejects invalid effort enum value", () => {
    const entries = [validJournalEntry({ effort: "E9" })];
    const result = mapAndValidateCandidates(entries);
    assert.equal(result.ok, false);
    assert.match(result.reason || "", /effort/);
  });

  test("reports first invalid entry by index", () => {
    const entries = [
      validJournalEntry(),
      validJournalEntry(),
      validJournalEntry({ relevance: "bogus" }),
    ];
    const result = mapAndValidateCandidates(entries);
    assert.equal(result.ok, false);
    assert.match(result.reason || "", /candidate 2/);
  });
});

describe("loadAnalysisJson", () => {
  test("returns MISSING for non-existent file", () => {
    const dir = tmpDir();
    const ap = path.join(dir, "missing.json");
    const result = loadAnalysisJson(ap);
    assert.equal(result.status, "MISSING");
  });

  test("returns OK with data for valid JSON", () => {
    const dir = tmpDir();
    const ap = path.join(dir, "analysis.json");
    const payload = { depth: "standard", source: "x/y" };
    fs.writeFileSync(ap, JSON.stringify(payload));
    const result = loadAnalysisJson(ap);
    assert.equal(result.status, "OK");
    assert.deepEqual(result.data, payload);
  });

  test("returns ERROR for unparseable JSON", () => {
    const dir = tmpDir();
    const ap = path.join(dir, "analysis.json");
    fs.writeFileSync(ap, "{ not valid json");
    const result = loadAnalysisJson(ap);
    assert.equal(result.status, "ERROR");
    assert.match(result.reason || "", /read\/parse/);
  });
});

describe("persistAnalysisJson", () => {
  test("writes JSON to a safe path", () => {
    const dir = tmpDir();
    const ap = path.join(dir, "out.json");
    const result = persistAnalysisJson(ap, { depth: "standard" });
    assert.equal(result.ok, true);
    assert.ok(fs.existsSync(ap));
    const content = JSON.parse(fs.readFileSync(ap, "utf8"));
    assert.equal(content.depth, "standard");
  });

  test("produces trailing newline", () => {
    const dir = tmpDir();
    const ap = path.join(dir, "out.json");
    persistAnalysisJson(ap, { k: "v" });
    const raw = fs.readFileSync(ap, "utf8");
    assert.ok(raw.endsWith("\n"));
  });
});
