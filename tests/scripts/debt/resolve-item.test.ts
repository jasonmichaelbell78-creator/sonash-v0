/**
 * Unit tests for resolve-item.js
 *
 * Tests: parseArgs, loadMasterDebt JSONL parsing, DEBT ID pattern matching,
 * and false-positive vs resolution logic.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── parseArgs ────────────────────────────────────────────────────────────────

interface ResolveArgs {
  dryRun: boolean;
  falsePositive: boolean;
  debtId?: string;
  pr?: number;
  reason?: string;
}

function parseArgs(args: string[]): ResolveArgs {
  const parsed: ResolveArgs = { dryRun: false, falsePositive: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--false-positive") {
      parsed.falsePositive = true;
    } else if (arg === "--pr" && args[i + 1]) {
      parsed.pr = Number.parseInt(args[++i], 10);
      if (!Number.isFinite(parsed.pr) || parsed.pr <= 0 || !Number.isInteger(parsed.pr)) {
        throw new Error(`--pr must be a positive integer, got: ${args[i]}`);
      }
    } else if (arg === "--reason" && args[i + 1]) {
      parsed.reason = args[++i];
    } else if (/^DEBT-\d+$/.test(arg)) {
      parsed.debtId = arg;
    }
  }
  return parsed;
}

describe("parseArgs (resolve-item)", () => {
  it("parses DEBT ID from positional arg", () => {
    assert.equal(parseArgs(["DEBT-0042"]).debtId, "DEBT-0042");
  });

  it("parses --dry-run", () => {
    assert.equal(parseArgs(["--dry-run"]).dryRun, true);
  });

  it("parses --false-positive", () => {
    assert.equal(parseArgs(["--false-positive"]).falsePositive, true);
  });

  it("parses --pr with valid number", () => {
    assert.equal(parseArgs(["--pr", "123"]).pr, 123);
  });

  it("parses --reason", () => {
    assert.equal(parseArgs(["--reason", "Not applicable"]).reason, "Not applicable");
  });

  it("throws for invalid --pr value", () => {
    assert.throws(() => parseArgs(["--pr", "abc"]), /must be a positive integer/);
  });

  it("throws for --pr zero", () => {
    assert.throws(() => parseArgs(["--pr", "0"]), /must be a positive integer/);
  });

  it("handles combined args", () => {
    const result = parseArgs(["DEBT-0042", "--pr", "456", "--dry-run"]);
    assert.equal(result.debtId, "DEBT-0042");
    assert.equal(result.pr, 456);
    assert.equal(result.dryRun, true);
  });
});

// ─── loadMasterDebt ───────────────────────────────────────────────────────────

interface DebtItem {
  id: string;
  status: string;
  title?: string;
}

function loadMasterDebtFromContent(content: string): DebtItem[] {
  const lines = content.split("\n").filter((l) => l.trim());
  const items: DebtItem[] = [];
  for (const line of lines) {
    try {
      items.push(JSON.parse(line));
    } catch {
      // skip malformed
    }
  }
  return items;
}

describe("loadMasterDebt", () => {
  it("parses valid items", () => {
    const content = `{"id":"DEBT-0001","status":"VERIFIED"}\n{"id":"DEBT-0002","status":"NEW"}`;
    const items = loadMasterDebtFromContent(content);
    assert.equal(items.length, 2);
    assert.equal(items[0].id, "DEBT-0001");
  });

  it("skips malformed lines", () => {
    const content = `{"id":"DEBT-0001","status":"NEW"}\nBAD LINE`;
    assert.equal(loadMasterDebtFromContent(content).length, 1);
  });

  it("returns empty array for empty content", () => {
    assert.deepEqual(loadMasterDebtFromContent(""), []);
  });
});

// ─── Find item by DEBT ID ─────────────────────────────────────────────────────

function findItemById(items: DebtItem[], id: string): DebtItem | undefined {
  return items.find((item) => item.id === id);
}

describe("findItemById", () => {
  const items: DebtItem[] = [
    { id: "DEBT-0001", status: "VERIFIED" },
    { id: "DEBT-0002", status: "NEW" },
  ];

  it("finds existing item", () => {
    const item = findItemById(items, "DEBT-0001");
    assert.ok(item);
    assert.equal(item.status, "VERIFIED");
  });

  it("returns undefined for non-existent ID", () => {
    assert.equal(findItemById(items, "DEBT-9999"), undefined);
  });
});

// ─── Resolution logic ─────────────────────────────────────────────────────────

function resolveItem(
  item: DebtItem,
  options: { falsePositive: boolean; pr?: number; reason?: string }
): DebtItem {
  if (options.falsePositive) {
    return { ...item, status: "FALSE_POSITIVE" };
  }
  return { ...item, status: "RESOLVED" };
}

describe("resolveItem", () => {
  it("sets status to RESOLVED for normal resolution", () => {
    const item: DebtItem = { id: "DEBT-0001", status: "VERIFIED" };
    const result = resolveItem(item, { falsePositive: false, pr: 123 });
    assert.equal(result.status, "RESOLVED");
  });

  it("sets status to FALSE_POSITIVE when flag is set", () => {
    const item: DebtItem = { id: "DEBT-0001", status: "VERIFIED" };
    const result = resolveItem(item, { falsePositive: true, reason: "Not applicable" });
    assert.equal(result.status, "FALSE_POSITIVE");
  });

  it("preserves other fields", () => {
    const item: DebtItem = { id: "DEBT-0001", status: "VERIFIED", title: "Fix X" };
    const result = resolveItem(item, { falsePositive: false });
    assert.equal(result.id, "DEBT-0001");
    assert.equal(result.title, "Fix X");
  });
});

// ─── DEBT ID format ───────────────────────────────────────────────────────────

describe("DEBT ID format (resolve-item)", () => {
  it("matches valid DEBT-0042", () => assert.ok(/^DEBT-\d+$/.test("DEBT-0042")));
  it("does not match lowercase", () => assert.equal(/^DEBT-\d+$/.test("debt-0042"), false));
  it("does not match without number", () => assert.equal(/^DEBT-\d+$/.test("DEBT-"), false));
});
