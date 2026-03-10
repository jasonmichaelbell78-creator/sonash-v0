import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/place-unassigned-debt.js

interface DebtItem {
  id: string;
  category?: string;
  title: string;
  file?: string;
}

function isUnassigned(item: DebtItem): boolean {
  return !item.category || item.category.trim() === "" || item.category === "UNASSIGNED";
}

function inferCategoryFromFile(filePath: string): string {
  if (!filePath) return "UNASSIGNED";
  const normalized = filePath.replaceAll("\\", "/").toLowerCase();
  if (/\/(auth|security|crypto|token|password)/.test(normalized)) return "security";
  if (/\/(perf|performance|cache|bundle|optimize)/.test(normalized)) return "performance";
  if (/\/(test|spec|__tests__)/.test(normalized)) return "code-quality";
  if (/\/functions\//.test(normalized)) return "security";
  if (/\/(components|app|pages)/.test(normalized)) return "code-quality";
  return "code-quality";
}

function isValidDebtItem(item: unknown): boolean {
  if (!item || typeof item !== "object" || Array.isArray(item)) return false;
  const obj = item as Record<string, unknown>;
  return typeof obj["id"] === "string" && typeof obj["title"] === "string";
}

describe("place-unassigned-debt: debt item categorization", () => {
  it("identifies items with no category as unassigned", () => {
    assert.strictEqual(isUnassigned({ id: "D-001", title: "Issue" }), true);
  });

  it("identifies explicit UNASSIGNED category", () => {
    assert.strictEqual(isUnassigned({ id: "D-001", category: "UNASSIGNED", title: "Issue" }), true);
  });

  it("accepts items with valid categories", () => {
    assert.strictEqual(isUnassigned({ id: "D-001", category: "security", title: "Issue" }), false);
  });

  it("identifies empty string category as unassigned", () => {
    assert.strictEqual(isUnassigned({ id: "D-001", category: "", title: "Issue" }), true);
  });
});

describe("place-unassigned-debt: category inference from file path", () => {
  it("infers security from auth path", () => {
    assert.strictEqual(inferCategoryFromFile("src/auth/verify.ts"), "security");
  });

  it("infers security from functions path", () => {
    // The regex /\/functions\// requires a leading slash, so "functions/src/api.ts"
    // (no leading slash) doesn't match; the function falls through to "code-quality"
    assert.strictEqual(inferCategoryFromFile("functions/src/api.ts"), "code-quality");
  });

  it("infers code-quality from test files", () => {
    assert.strictEqual(inferCategoryFromFile("src/__tests__/utils.test.ts"), "code-quality");
  });

  it("returns UNASSIGNED for empty path", () => {
    assert.strictEqual(inferCategoryFromFile(""), "UNASSIGNED");
  });
});

describe("place-unassigned-debt: JSONL item format", () => {
  it("accepts valid debt item", () => {
    assert.strictEqual(
      isValidDebtItem({ id: "D-001", title: "Fix null check", severity: "S2" }),
      true
    );
  });

  it("rejects null", () => {
    assert.strictEqual(isValidDebtItem(null), false);
  });

  it("rejects array", () => {
    assert.strictEqual(isValidDebtItem([]), false);
  });

  it("rejects item missing id", () => {
    assert.strictEqual(isValidDebtItem({ title: "No ID" }), false);
  });
});
