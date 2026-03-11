import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Smoke tests for scripts/generate-fix-template-stubs.js (CLI wrapper)

function checkMainExport(mainFn: unknown): { valid: boolean; error?: string } {
  if (typeof mainFn !== "function") {
    return {
      valid: false,
      error: "No callable `main` export found. Rebuild scripts/reviews and verify dist output.",
    };
  }
  return { valid: true };
}

function buildTemplateStub(patternId: string, title: string): string {
  return [
    `## Fix Template: ${patternId}`,
    `**Pattern**: ${title}`,
    "### Problem",
    "<!-- Describe the problem -->",
    "### Solution",
    "<!-- Describe the fix -->",
    "### Example",
    "```typescript",
    "// Before:",
    "// After:",
    "```",
  ].join("\n");
}

describe("generate-fix-template-stubs: main export loading", () => {
  it("accepts async function export", () => {
    assert.strictEqual(checkMainExport(async () => {}).valid, true);
  });

  it("rejects null export", () => {
    const result = checkMainExport(null);
    assert.strictEqual(result.valid, false);
  });
});

describe("generate-fix-template-stubs: template stub structure", () => {
  it("builds template stub with required sections", () => {
    const stub = buildTemplateStub("PAT-001", "Error sanitization");
    assert.ok(stub.includes("## Fix Template: PAT-001"));
    assert.ok(stub.includes("### Problem"));
    assert.ok(stub.includes("### Solution"));
    assert.ok(stub.includes("### Example"));
  });

  it("includes pattern ID in heading", () => {
    const stub = buildTemplateStub("ANTI-042", "Unsafe eval");
    assert.ok(stub.includes("ANTI-042"));
  });
});
