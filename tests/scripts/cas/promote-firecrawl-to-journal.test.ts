/**
 * promote-firecrawl-to-journal.js Test Suite
 *
 * Tests the pure helpers exported by scripts/cas/promote-firecrawl-to-journal.js:
 * - mapCandidate — value-map candidate → journal entry shape
 * - validateJournalEntries — Zod-backed validation via safe-cas-io
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

const scriptPath = path.resolve(PROJECT_ROOT, "scripts/cas/promote-firecrawl-to-journal.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require(scriptPath) as {
  mapCandidate: (vm: Record<string, unknown>) => Record<string, unknown>;
  validateJournalEntries: (entries: Array<Record<string, unknown>>) => {
    ok: boolean;
    reason?: string;
  };
  SOURCE: string;
  SOURCE_TYPE: string;
  DECISION_DATE: string;
};

const { mapCandidate, validateJournalEntries, SOURCE, SOURCE_TYPE, DECISION_DATE } = mod;

function vmCandidate(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: "Example pattern",
    type: "pattern",
    description: "A sample candidate description",
    novelty: "medium",
    effort: "E1",
    relevance: "high",
    tags: ["sample", "pattern"],
    ...overrides,
  };
}

describe("module constants", () => {
  test("SOURCE is the canonical firecrawl source", () => {
    assert.equal(SOURCE, "mendableai/firecrawl");
  });

  test("SOURCE_TYPE is repo", () => {
    assert.equal(SOURCE_TYPE, "repo");
  });

  test("DECISION_DATE is a valid ISO date string", () => {
    assert.match(DECISION_DATE, /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("mapCandidate", () => {
  test("maps value-map candidate to v2.0 journal entry", () => {
    const entry = mapCandidate(vmCandidate()) as Record<string, unknown>;
    assert.equal(entry.schema_version, "2.0");
    assert.equal(entry.source_type, SOURCE_TYPE);
    assert.equal(entry.source, SOURCE);
    assert.equal(entry.candidate, "Example pattern");
    assert.equal(entry.type, "pattern");
    assert.equal(entry.decision, "defer");
    assert.equal(entry.decision_date, DECISION_DATE);
    assert.equal(entry.extracted_to, null);
    assert.equal(entry.extracted_at, null);
    assert.equal(entry.notes, "A sample candidate description");
  });

  test("preserves novelty / effort / relevance", () => {
    const entry = mapCandidate(
      vmCandidate({ novelty: "low", effort: "E2", relevance: "medium" })
    ) as Record<string, unknown>;
    assert.equal(entry.novelty, "low");
    assert.equal(entry.effort, "E2");
    assert.equal(entry.relevance, "medium");
  });

  test("empty description becomes empty notes (not undefined)", () => {
    const entry = mapCandidate(vmCandidate({ description: "" })) as Record<string, unknown>;
    assert.equal(entry.notes, "");
  });

  test("non-array tags becomes empty array", () => {
    const entry = mapCandidate(vmCandidate({ tags: null })) as Record<string, unknown>;
    assert.deepEqual(entry.tags, []);
  });
});

describe("validateJournalEntries", () => {
  test("accepts a list of valid mapped entries", () => {
    const entries = [
      mapCandidate(vmCandidate()),
      mapCandidate(vmCandidate({ name: "Second", type: "knowledge" })),
    ];
    const result = validateJournalEntries(entries);
    assert.equal(result.ok, true, `expected ok but got reason: ${result.reason}`);
  });

  test("accepts empty description (Zod schema allows empty string)", () => {
    // Regression for PR #505 Qodo "empty description false-failure" pattern —
    // this is the same fix class applied to promote-firecrawl-to-journal.
    const entries = [mapCandidate(vmCandidate({ description: "" }))];
    const result = validateJournalEntries(entries);
    assert.equal(result.ok, true);
  });

  test("rejects entry with missing name", () => {
    const entries = [mapCandidate(vmCandidate({ name: null }))];
    const result = validateJournalEntries(entries);
    assert.equal(result.ok, false);
    assert.match(result.reason || "", /entry 0/);
  });

  test("rejects entry with invalid effort value", () => {
    const entries = [mapCandidate(vmCandidate({ effort: "E9" }))];
    const result = validateJournalEntries(entries);
    assert.equal(result.ok, false);
    assert.match(result.reason || "", /effort/);
  });

  test("rejects entry with invalid type enum", () => {
    const entries = [mapCandidate(vmCandidate({ type: "bogus-type" }))];
    const result = validateJournalEntries(entries);
    assert.equal(result.ok, false);
    assert.match(result.reason || "", /type/);
  });

  test("reports the first invalid entry by index", () => {
    const entries = [
      mapCandidate(vmCandidate()),
      mapCandidate(vmCandidate({ novelty: "stratospheric" })),
    ];
    const result = validateJournalEntries(entries);
    assert.equal(result.ok, false);
    assert.match(result.reason || "", /entry 1/);
  });
});
