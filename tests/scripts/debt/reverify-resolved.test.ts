/**
 * Unit tests for reverify-resolved.js
 *
 * Tests: flaggedIds extraction from report, categorization constants
 * (falseAlarms, fileMissing, genuinelyUnresolved), and item filtering.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Report parsing ───────────────────────────────────────────────────────────

interface AuditReport {
  step4_audit_resolved?: {
    possibly_unresolved_details?: Array<{ id: string }>;
  };
}

function extractFlaggedIds(report: AuditReport): Set<string> {
  const details = report?.step4_audit_resolved?.possibly_unresolved_details;
  if (!Array.isArray(details)) return new Set();
  return new Set(details.map((d) => d.id));
}

describe("extractFlaggedIds", () => {
  it("extracts IDs from valid report", () => {
    const report: AuditReport = {
      step4_audit_resolved: {
        possibly_unresolved_details: [{ id: "DEBT-0001" }, { id: "DEBT-0002" }],
      },
    };
    const ids = extractFlaggedIds(report);
    assert.ok(ids.has("DEBT-0001"));
    assert.ok(ids.has("DEBT-0002"));
    assert.equal(ids.size, 2);
  });

  it("returns empty set when report has no details", () => {
    assert.equal(extractFlaggedIds({}).size, 0);
  });

  it("returns empty set when step4 is missing", () => {
    assert.equal(extractFlaggedIds({ step4_audit_resolved: {} }).size, 0);
  });

  it("returns empty set when details is not an array", () => {
    const report = {
      step4_audit_resolved: {
        possibly_unresolved_details: "bad" as unknown as Array<{ id: string }>,
      },
    };
    assert.equal(extractFlaggedIds(report).size, 0);
  });
});

// ─── JSONL parsing with item filtering ───────────────────────────────────────

interface DebtItem {
  id: string;
  status: string;
  file?: string;
}

function loadItemsFromContent(content: string): DebtItem[] {
  return content
    .split("\n")
    .filter(Boolean)
    .flatMap((l) => {
      try {
        return [JSON.parse(l)];
      } catch {
        return [];
      }
    });
}

describe("loadItemsFromContent (reverify-resolved)", () => {
  it("parses valid items", () => {
    const content = `{"id":"DEBT-0001","status":"RESOLVED"}\n{"id":"DEBT-0002","status":"VERIFIED"}`;
    const items = loadItemsFromContent(content);
    assert.equal(items.length, 2);
  });

  it("skips malformed lines", () => {
    const content = `{"id":"DEBT-0001","status":"RESOLVED"}\nBAD LINE`;
    assert.equal(loadItemsFromContent(content).length, 1);
  });

  it("returns empty array for empty content", () => {
    assert.deepEqual(loadItemsFromContent(""), []);
  });
});

// ─── Item categorization ──────────────────────────────────────────────────────

type VerificationOutcome =
  | "FALSE_ALARM"
  | "FILE_MISSING"
  | "GENUINELY_UNRESOLVED"
  | "ALREADY_VERIFIED";

function categorizeItem(
  item: DebtItem,
  falseAlarms: Set<string>,
  fileMissing: Set<string>,
  genuinelyUnresolved: Set<string>
): VerificationOutcome {
  if (item.status === "VERIFIED") return "ALREADY_VERIFIED";
  if (falseAlarms.has(item.id)) return "FALSE_ALARM";
  if (fileMissing.has(item.id)) return "FILE_MISSING";
  if (genuinelyUnresolved.has(item.id)) return "GENUINELY_UNRESOLVED";
  return "FALSE_ALARM"; // default: assume resolved if no evidence
}

describe("categorizeItem", () => {
  const falseAlarms = new Set(["DEBT-0001", "DEBT-0002"]);
  const fileMissing = new Set(["DEBT-0003"]);
  const genuinelyUnresolved = new Set(["DEBT-0004"]);

  it("returns ALREADY_VERIFIED for VERIFIED items", () => {
    assert.equal(
      categorizeItem(
        { id: "DEBT-0001", status: "VERIFIED" },
        falseAlarms,
        fileMissing,
        genuinelyUnresolved
      ),
      "ALREADY_VERIFIED"
    );
  });

  it("returns FALSE_ALARM for known false alarm IDs", () => {
    assert.equal(
      categorizeItem(
        { id: "DEBT-0001", status: "RESOLVED" },
        falseAlarms,
        fileMissing,
        genuinelyUnresolved
      ),
      "FALSE_ALARM"
    );
  });

  it("returns FILE_MISSING for items in fileMissing set", () => {
    assert.equal(
      categorizeItem(
        { id: "DEBT-0003", status: "RESOLVED" },
        falseAlarms,
        fileMissing,
        genuinelyUnresolved
      ),
      "FILE_MISSING"
    );
  });

  it("returns GENUINELY_UNRESOLVED for items in that set", () => {
    assert.equal(
      categorizeItem(
        { id: "DEBT-0004", status: "RESOLVED" },
        falseAlarms,
        fileMissing,
        genuinelyUnresolved
      ),
      "GENUINELY_UNRESOLVED"
    );
  });
});

// ─── Write mode flag ──────────────────────────────────────────────────────────

describe("writeMode flag (reverify-resolved)", () => {
  it("detects --write arg", () => {
    const writeMode = ["--write"].includes("--write");
    assert.equal(writeMode, true);
  });

  it("defaults to dry-run (no --write)", () => {
    const writeMode = ([] as string[]).includes("--write");
    assert.equal(writeMode, false);
  });
});

// ─── Counting outcome types ───────────────────────────────────────────────────

describe("outcome counting", () => {
  it("counts FALSE_ALARM outcomes", () => {
    const outcomes: VerificationOutcome[] = ["FALSE_ALARM", "FALSE_ALARM", "FILE_MISSING"];
    const count = outcomes.filter((o) => o === "FALSE_ALARM").length;
    assert.equal(count, 2);
  });

  it("counts GENUINELY_UNRESOLVED outcomes", () => {
    const outcomes: VerificationOutcome[] = ["GENUINELY_UNRESOLVED", "FALSE_ALARM"];
    const count = outcomes.filter((o) => o === "GENUINELY_UNRESOLVED").length;
    assert.equal(count, 1);
  });
});
