/**
 * Unit tests for resolve-bulk.js
 *
 * Tests: validateOutputJsonPath, validatePrNumber, parseArgs, ELIGIBLE_STATUSES
 * filtering, DEBT ID pattern matching, and batch resolution logic.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

// ─── ELIGIBLE_STATUSES ────────────────────────────────────────────────────────

const ELIGIBLE_STATUSES = new Set(["VERIFIED", "IN_PROGRESS", "TRIAGED"]);

describe("ELIGIBLE_STATUSES", () => {
  it("includes VERIFIED", () => assert.ok(ELIGIBLE_STATUSES.has("VERIFIED")));
  it("includes IN_PROGRESS", () => assert.ok(ELIGIBLE_STATUSES.has("IN_PROGRESS")));
  it("includes TRIAGED", () => assert.ok(ELIGIBLE_STATUSES.has("TRIAGED")));
  it("does not include NEW", () => assert.equal(ELIGIBLE_STATUSES.has("NEW"), false));
  it("does not include RESOLVED", () => assert.equal(ELIGIBLE_STATUSES.has("RESOLVED"), false));
  it("does not include FALSE_POSITIVE", () =>
    assert.equal(ELIGIBLE_STATUSES.has("FALSE_POSITIVE"), false));
});

// ─── validatePrNumber ─────────────────────────────────────────────────────────

function validatePrNumber(value: string | undefined): number {
  if (!value || value.startsWith("--")) {
    throw new Error("Error: Missing value for --pr <number>");
  }
  const num = Number.parseInt(value, 10);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error("Error: Invalid value for --pr <number>");
  }
  return num;
}

describe("validatePrNumber", () => {
  it("parses valid positive integer", () => {
    assert.equal(validatePrNumber("123"), 123);
  });

  it("throws for missing value", () => {
    assert.throws(() => validatePrNumber(undefined), /Missing value/);
  });

  it("throws when value is another flag", () => {
    assert.throws(() => validatePrNumber("--dry-run"), /Missing value/);
  });

  it("throws for zero", () => {
    assert.throws(() => validatePrNumber("0"), /Invalid value/);
  });

  it("throws for negative number", () => {
    assert.throws(() => validatePrNumber("-5"), /Invalid value/);
  });

  it("throws for non-numeric string", () => {
    assert.throws(() => validatePrNumber("abc"), /Invalid value/);
  });

  it("parses large PR number", () => {
    assert.equal(validatePrNumber("99999"), 99999);
  });
});

// ─── validateOutputJsonPath ───────────────────────────────────────────────────

function validateOutputJsonPath(value: string | undefined): void {
  if (!value || value.startsWith("--")) {
    throw new Error("Error: Missing value for --output-json <path>");
  }
  if (value.trim().length === 0 || value.endsWith(path.sep) || value === "." || value === "./") {
    throw new Error("Error: Invalid value for --output-json <path>");
  }
}

describe("validateOutputJsonPath", () => {
  it("accepts valid file path", () => {
    assert.doesNotThrow(() => validateOutputJsonPath("output/results.json"));
  });

  it("throws for undefined", () => {
    assert.throws(() => validateOutputJsonPath(undefined), /Missing value/);
  });

  it("throws when value is a flag", () => {
    assert.throws(() => validateOutputJsonPath("--dry-run"), /Missing value/);
  });

  it("throws for '.'", () => {
    assert.throws(() => validateOutputJsonPath("."), /Invalid value/);
  });

  it("throws for './'", () => {
    assert.throws(() => validateOutputJsonPath("./"), /Invalid value/);
  });
});

// ─── parseArgs (resolve-bulk) ─────────────────────────────────────────────────

interface ResolveBulkArgs {
  dryRun: boolean;
  eligibleOnly: boolean;
  debtIds: string[];
  pr?: number;
  outputJson?: string;
  file?: string;
}

function parseArgsBulk(args: string[]): ResolveBulkArgs {
  const parsed: ResolveBulkArgs = { dryRun: false, eligibleOnly: false, debtIds: [] };
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--eligible-only") {
      parsed.eligibleOnly = true;
    } else if (arg === "--output-json") {
      i += 1;
      parsed.outputJson = args[i];
    } else if (arg === "--pr") {
      i += 1;
      parsed.pr = validatePrNumber(args[i]);
    } else if (arg === "--file") {
      i += 1;
      parsed.file = args[i];
    } else if (/^DEBT-\d+$/.test(arg)) {
      parsed.debtIds.push(arg);
    }
    i++;
  }
  return parsed;
}

describe("parseArgs (resolve-bulk)", () => {
  it("parses --dry-run flag", () => {
    assert.equal(parseArgsBulk(["--dry-run"]).dryRun, true);
  });

  it("parses --eligible-only flag", () => {
    assert.equal(parseArgsBulk(["--eligible-only"]).eligibleOnly, true);
  });

  it("parses DEBT IDs from positional args", () => {
    const result = parseArgsBulk(["DEBT-0001", "DEBT-0002"]);
    assert.deepEqual(result.debtIds, ["DEBT-0001", "DEBT-0002"]);
  });

  it("parses --pr with valid number", () => {
    assert.equal(parseArgsBulk(["--pr", "456"]).pr, 456);
  });

  it("parses --file value", () => {
    assert.equal(parseArgsBulk(["--file", "ids.txt"]).file, "ids.txt");
  });

  it("parses --output-json value", () => {
    assert.equal(parseArgsBulk(["--output-json", "out.json"]).outputJson, "out.json");
  });

  it("handles combined args", () => {
    const result = parseArgsBulk(["--pr", "100", "--dry-run", "DEBT-0001"]);
    assert.equal(result.pr, 100);
    assert.equal(result.dryRun, true);
    assert.deepEqual(result.debtIds, ["DEBT-0001"]);
  });
});

// ─── DEBT ID pattern validation ───────────────────────────────────────────────

function isValidDebtId(id: string): boolean {
  return /^DEBT-\d+$/.test(id);
}

describe("isValidDebtId", () => {
  it("accepts DEBT-0001", () => assert.equal(isValidDebtId("DEBT-0001"), true));
  it("accepts DEBT-9999", () => assert.equal(isValidDebtId("DEBT-9999"), true));
  it("rejects lowercase", () => assert.equal(isValidDebtId("debt-0001"), false));
  it("rejects CANON-0001", () => assert.equal(isValidDebtId("CANON-0001"), false));
  it("rejects no number", () => assert.equal(isValidDebtId("DEBT-"), false));
  it("rejects empty string", () => assert.equal(isValidDebtId(""), false));
});

// ─── filterEligibleItems ─────────────────────────────────────────────────────

interface DebtItem {
  id: string;
  status: string;
}

function filterEligibleItems(
  items: DebtItem[],
  ids: string[],
  eligibleOnly: boolean
): {
  eligible: DebtItem[];
  skipped: string[];
} {
  const itemMap = new Map(items.map((i) => [i.id, i]));
  const eligible: DebtItem[] = [];
  const skipped: string[] = [];

  for (const id of ids) {
    const item = itemMap.get(id);
    if (!item) {
      skipped.push(id);
      continue;
    }
    if (eligibleOnly && !ELIGIBLE_STATUSES.has(item.status)) {
      skipped.push(id);
      continue;
    }
    eligible.push(item);
  }
  return { eligible, skipped };
}

describe("filterEligibleItems", () => {
  const items: DebtItem[] = [
    { id: "DEBT-0001", status: "VERIFIED" },
    { id: "DEBT-0002", status: "NEW" },
    { id: "DEBT-0003", status: "IN_PROGRESS" },
  ];

  it("returns all matching items when eligibleOnly=false", () => {
    const { eligible, skipped } = filterEligibleItems(items, ["DEBT-0001", "DEBT-0002"], false);
    assert.equal(eligible.length, 2);
    assert.equal(skipped.length, 0);
  });

  it("filters non-eligible statuses when eligibleOnly=true", () => {
    const { eligible, skipped } = filterEligibleItems(items, ["DEBT-0001", "DEBT-0002"], true);
    assert.equal(eligible.length, 1);
    assert.equal(eligible[0].id, "DEBT-0001");
    assert.equal(skipped.length, 1);
    assert.equal(skipped[0], "DEBT-0002");
  });

  it("skips IDs not found in items", () => {
    const { skipped } = filterEligibleItems(items, ["DEBT-9999"], false);
    assert.equal(skipped.length, 1);
    assert.equal(skipped[0], "DEBT-9999");
  });

  it("handles empty IDs list", () => {
    const { eligible, skipped } = filterEligibleItems(items, [], false);
    assert.equal(eligible.length, 0);
    assert.equal(skipped.length, 0);
  });
});

// ─── Path containment guard ───────────────────────────────────────────────────

function isTraversalPath(rel: string): boolean {
  return /^\.\.(?:[\\/]|$)/.test(rel);
}

describe("path traversal guard (resolve-bulk)", () => {
  it("detects '../etc/passwd'", () => assert.equal(isTraversalPath("../etc/passwd"), true));
  it("allows 'output/results.json'", () =>
    assert.equal(isTraversalPath("output/results.json"), false));
  it("detects bare '..'", () => assert.equal(isTraversalPath(".."), true));
  it("allows '..file'", () => assert.equal(isTraversalPath("..file"), false));
});
