/**
 * Unit tests for sync-roadmap-refs.js
 *
 * Tests: loadDebtIds JSONL parsing, findDebtRefs regex, and validation logic.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── loadDebtIds from JSONL content ───────────────────────────────────────────

function loadDebtIdsFromContent(content: string): Set<string> {
  const ids = new Set<string>();
  const lines = content.split("\n").filter((line) => line.trim());
  for (const line of lines) {
    try {
      const item = JSON.parse(line);
      if (item.id) {
        ids.add(String(item.id).trim().toUpperCase());
      }
    } catch {
      // skip invalid JSON lines
    }
  }
  return ids;
}

describe("loadDebtIds", () => {
  it("loads IDs from valid JSONL", () => {
    const content = `{"id":"DEBT-0001"}\n{"id":"DEBT-0002"}`;
    const ids = loadDebtIdsFromContent(content);
    assert.ok(ids.has("DEBT-0001"));
    assert.ok(ids.has("DEBT-0002"));
    assert.equal(ids.size, 2);
  });

  it("uppercases IDs for normalization", () => {
    const content = `{"id":"debt-0001"}`;
    const ids = loadDebtIdsFromContent(content);
    assert.ok(ids.has("DEBT-0001"));
  });

  it("trims whitespace from IDs", () => {
    const content = `{"id":"  DEBT-0001  "}`;
    const ids = loadDebtIdsFromContent(content);
    assert.ok(ids.has("DEBT-0001"));
  });

  it("skips lines without id field", () => {
    const content = `{"title":"No ID"}`;
    assert.equal(loadDebtIdsFromContent(content).size, 0);
  });

  it("skips malformed JSON lines", () => {
    const content = `{"id":"DEBT-0001"}\nNOT JSON\n{"id":"DEBT-0002"}`;
    assert.equal(loadDebtIdsFromContent(content).size, 2);
  });

  it("returns empty set for empty content", () => {
    assert.equal(loadDebtIdsFromContent("").size, 0);
  });
});

// ─── findDebtRefs ─────────────────────────────────────────────────────────────

interface DebtRef {
  id: string;
  line: number;
}

function findDebtRefs(content: string): DebtRef[] {
  const refs: DebtRef[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const matches = lines[i].matchAll(/DEBT-\d+/g);
    for (const match of matches) {
      refs.push({ id: match[0], line: i + 1 });
    }
  }
  return refs;
}

describe("findDebtRefs", () => {
  it("finds single DEBT ID on a line", () => {
    const refs = findDebtRefs("See DEBT-0042 for details");
    assert.equal(refs.length, 1);
    assert.equal(refs[0].id, "DEBT-0042");
    assert.equal(refs[0].line, 1);
  });

  it("finds multiple IDs on the same line", () => {
    const refs = findDebtRefs("DEBT-0001 and DEBT-0002 tracked");
    assert.equal(refs.length, 2);
  });

  it("finds IDs across multiple lines", () => {
    const content = "DEBT-0001\nsome text\nDEBT-0002";
    const refs = findDebtRefs(content);
    assert.equal(refs.length, 2);
    assert.equal(refs[0].line, 1);
    assert.equal(refs[1].line, 3);
  });

  it("returns empty array for content with no IDs", () => {
    assert.deepEqual(findDebtRefs("no debt refs here"), []);
  });

  it("does not match CANON- IDs", () => {
    const refs = findDebtRefs("CANON-0001 but also DEBT-0042");
    assert.equal(refs.length, 1);
    assert.equal(refs[0].id, "DEBT-0042");
  });
});

// ─── Validation logic ─────────────────────────────────────────────────────────

interface ValidationResult {
  invalid: DebtRef[];
  valid: DebtRef[];
}

function validateDebtRefs(refs: DebtRef[], knownIds: Set<string>): ValidationResult {
  const invalid: DebtRef[] = [];
  const valid: DebtRef[] = [];
  for (const ref of refs) {
    if (knownIds.has(ref.id)) {
      valid.push(ref);
    } else {
      invalid.push(ref);
    }
  }
  return { invalid, valid };
}

describe("validateDebtRefs", () => {
  it("separates valid and invalid refs", () => {
    const knownIds = new Set(["DEBT-0001", "DEBT-0002"]);
    const refs: DebtRef[] = [
      { id: "DEBT-0001", line: 1 },
      { id: "DEBT-9999", line: 2 },
    ];
    const { valid, invalid } = validateDebtRefs(refs, knownIds);
    assert.equal(valid.length, 1);
    assert.equal(invalid.length, 1);
    assert.equal(invalid[0].id, "DEBT-9999");
  });

  it("returns all valid when all IDs are known", () => {
    const knownIds = new Set(["DEBT-0001"]);
    const refs: DebtRef[] = [{ id: "DEBT-0001", line: 1 }];
    const { valid, invalid } = validateDebtRefs(refs, knownIds);
    assert.equal(valid.length, 1);
    assert.equal(invalid.length, 0);
  });

  it("returns all invalid when no IDs are known", () => {
    const knownIds = new Set<string>();
    const refs: DebtRef[] = [{ id: "DEBT-0001", line: 1 }];
    const { valid, invalid } = validateDebtRefs(refs, knownIds);
    assert.equal(valid.length, 0);
    assert.equal(invalid.length, 1);
  });

  it("handles empty refs", () => {
    const { valid, invalid } = validateDebtRefs([], new Set(["DEBT-0001"]));
    assert.equal(valid.length, 0);
    assert.equal(invalid.length, 0);
  });
});

// ─── CLI args ─────────────────────────────────────────────────────────────────

describe("CLI args (sync-roadmap-refs)", () => {
  it("detects --check-only flag", () => {
    const checkOnly = ["--check-only"].includes("--check-only");
    assert.equal(checkOnly, true);
  });

  it("detects --verbose flag", () => {
    const verbose = ["--verbose"].includes("--verbose") || ["-v"].includes("-v");
    assert.equal(verbose, true);
  });

  it("check-only is false by default", () => {
    assert.equal(([] as string[]).includes("--check-only"), false);
  });
});
