import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/validate-phase-completion.js

function extractPhaseContent(content: string, phase: string): string | null {
  const header = `## 📋 ${phase}`;
  const phaseStart = content.indexOf(header);
  if (phaseStart === -1) return null;

  const searchStart = phaseStart + header.length;
  const nextPhaseMatch = /\n## 📋 PHASE/.exec(content.slice(searchStart));
  const phaseEnd = nextPhaseMatch ? searchStart + nextPhaseMatch.index : content.length;
  return content.slice(phaseStart, phaseEnd);
}

function validateSinglePhase(phaseContent: string, phase: string, issues: string[]): boolean {
  let valid = true;

  const hasAccomplished = /### 📊 What Was Accomplished/.test(phaseContent);
  if (!hasAccomplished) {
    issues.push(`${phase}: Missing "What Was Accomplished" section`);
    valid = false;
  }

  const criteriaChecked = (phaseContent.match(/- \[x\]/g) ?? []).length;
  const criteriaTotal = (phaseContent.match(/- \[[ x]\]/g) ?? []).length;

  if (criteriaTotal > 0 && criteriaChecked === 0) {
    issues.push(`${phase}: No acceptance criteria checked`);
    valid = false;
  }

  return valid;
}

describe("validate-phase-completion: extractPhaseContent", () => {
  it("extracts content for named phase", () => {
    const content = "## 📋 PHASE 1\ncontent here\n## 📋 PHASE 2\nother";
    const result = extractPhaseContent(content, "PHASE 1");
    assert.ok(result?.includes("content here"));
    assert.ok(!result?.includes("other"));
  });

  it("returns null when phase not found", () => {
    assert.strictEqual(extractPhaseContent("# No phases", "PHASE X"), null);
  });

  it("extracts last phase (no next phase boundary)", () => {
    const content = "## 📋 PHASE 2\nlast content";
    const result = extractPhaseContent(content, "PHASE 2");
    assert.ok(result?.includes("last content"));
  });
});

describe("validate-phase-completion: validateSinglePhase", () => {
  it("passes phase with accomplished section and checked criteria", () => {
    const content = "### 📊 What Was Accomplished\n- [x] Did thing A\n- [x] Did thing B";
    const issues: string[] = [];
    assert.strictEqual(validateSinglePhase(content, "PHASE 1", issues), true);
    assert.strictEqual(issues.length, 0);
  });

  it("fails phase without accomplished section", () => {
    const content = "- [x] Did thing A";
    const issues: string[] = [];
    const valid = validateSinglePhase(content, "PHASE 1", issues);
    assert.strictEqual(valid, false);
    assert.ok(issues.some((i) => i.includes("What Was Accomplished")));
  });

  it("fails phase with all criteria unchecked", () => {
    const content = "### 📊 What Was Accomplished\n- [ ] Thing A\n- [ ] Thing B";
    const issues: string[] = [];
    validateSinglePhase(content, "PHASE 1", issues);
    assert.ok(issues.some((i) => i.includes("acceptance criteria")));
  });

  it("passes phase with no criteria (optional)", () => {
    const content = "### 📊 What Was Accomplished\nAll done.";
    const issues: string[] = [];
    assert.strictEqual(validateSinglePhase(content, "PHASE 1", issues), true);
  });
});
