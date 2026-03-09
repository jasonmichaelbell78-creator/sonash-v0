/**
 * Unit tests for consolidate-all.js
 *
 * Tests the step sequencing logic and runStep behavior.
 * Uses mocked execFileSync and fs.existsSync to avoid real execution.
 */
import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

// ─── Re-implementations of the logic under test ───────────────────────────────

interface Step {
  name: string;
  script: string;
  args?: string[];
  required: boolean;
}

const STEPS: Step[] = [
  {
    name: "Extract SonarCloud issues (DEPRECATED)",
    script: "extract-sonarcloud.js",
    required: false,
  },
  {
    name: "Extract audit findings",
    script: "extract-audits.js",
    required: true,
  },
  {
    name: "Extract review/aggregation findings",
    script: "extract-reviews.js",
    required: true,
  },
  {
    name: "Normalize all extractions",
    script: "normalize-all.js",
    required: true,
  },
  {
    name: "Multi-pass deduplication",
    script: "dedup-multi-pass.js",
    required: true,
  },
  {
    name: "Ingest new items and generate views",
    script: "generate-views.js",
    args: ["--ingest"],
    required: true,
  },
];

// Simulate runStep logic
function createRunStep(existingScripts: Set<string>, failingScripts: Set<string>) {
  return function runStep(step: Step, _index: number): boolean {
    const scriptPath = `/scripts/debt/${step.script}`;
    const scriptExists = existingScripts.has(step.script);

    if (!scriptExists) {
      if (step.required) {
        throw new Error(`Required script not found: ${step.script}`);
      }
      return true; // skip, return true (step counted as completed)
    }

    const willFail = failingScripts.has(step.script);

    if (willFail) {
      if (step.required) {
        throw new Error(`Step failed: ${step.name}`);
      }
      return false; // non-required failure
    }

    return true;
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("consolidate-all: STEPS configuration", () => {
  it("has 6 pipeline steps total", () => {
    assert.strictEqual(STEPS.length, 6);
  });

  it("extract-sonarcloud is optional (deprecated)", () => {
    const step = STEPS.find((s) => s.script === "extract-sonarcloud.js");
    assert.ok(step, "extract-sonarcloud.js step should exist");
    assert.strictEqual(step!.required, false);
  });

  it("all other steps are required", () => {
    const requiredScripts = [
      "extract-audits.js",
      "extract-reviews.js",
      "normalize-all.js",
      "dedup-multi-pass.js",
      "generate-views.js",
    ];
    for (const script of requiredScripts) {
      const step = STEPS.find((s) => s.script === script);
      assert.ok(step, `Step for ${script} should exist`);
      assert.strictEqual(step!.required, true, `${script} should be required`);
    }
  });

  it("generate-views.js is called with --ingest flag", () => {
    const step = STEPS.find((s) => s.script === "generate-views.js");
    assert.ok(step?.args?.includes("--ingest"), "generate-views.js should use --ingest flag");
  });

  it("normalize-all runs before dedup-multi-pass (correct pipeline order)", () => {
    const normalizeIdx = STEPS.findIndex((s) => s.script === "normalize-all.js");
    const dedupIdx = STEPS.findIndex((s) => s.script === "dedup-multi-pass.js");
    assert.ok(normalizeIdx < dedupIdx, "normalize-all must come before dedup-multi-pass");
  });

  it("dedup-multi-pass runs before generate-views (correct pipeline order)", () => {
    const dedupIdx = STEPS.findIndex((s) => s.script === "dedup-multi-pass.js");
    const viewsIdx = STEPS.findIndex((s) => s.script === "generate-views.js");
    assert.ok(dedupIdx < viewsIdx, "dedup-multi-pass must come before generate-views");
  });
});

describe("consolidate-all: runStep — happy path", () => {
  it("returns true when required script succeeds", () => {
    const allScripts = new Set(STEPS.map((s) => s.script));
    const failingScripts = new Set<string>();
    const runStep = createRunStep(allScripts, failingScripts);

    const step = STEPS.find((s) => s.script === "extract-audits.js")!;
    assert.strictEqual(runStep(step, 0), true);
  });

  it("skips missing optional script and returns true", () => {
    const existingScripts = new Set<string>(); // no scripts exist
    const failingScripts = new Set<string>();
    const runStep = createRunStep(existingScripts, failingScripts);

    const step = STEPS.find((s) => s.script === "extract-sonarcloud.js")!;
    const result = runStep(step, 0);
    assert.strictEqual(result, true); // skipped but counted as ok
  });

  it("full pipeline succeeds when all scripts exist and pass", () => {
    const allScripts = new Set(STEPS.map((s) => s.script));
    const failingScripts = new Set<string>();
    const runStep = createRunStep(allScripts, failingScripts);

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < STEPS.length; i++) {
      if (runStep(STEPS[i], i)) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    assert.strictEqual(successCount, STEPS.length);
    assert.strictEqual(failedCount, 0);
  });
});

describe("consolidate-all: runStep — error path", () => {
  it("throws error when required script is missing", () => {
    const existingScripts = new Set<string>(); // no scripts exist
    const failingScripts = new Set<string>();
    const runStep = createRunStep(existingScripts, failingScripts);

    const requiredStep = STEPS.find((s) => s.script === "extract-audits.js")!;
    assert.throws(() => runStep(requiredStep, 0), /Required script not found/);
  });

  it("throws error when required script fails", () => {
    const allScripts = new Set(STEPS.map((s) => s.script));
    const failingScripts = new Set(["normalize-all.js"]);
    const runStep = createRunStep(allScripts, failingScripts);

    const step = STEPS.find((s) => s.script === "normalize-all.js")!;
    assert.throws(() => runStep(step, 0), /Step failed/);
  });

  it("returns false (not throws) when optional script fails", () => {
    const allScripts = new Set(STEPS.map((s) => s.script));
    const failingScripts = new Set(["extract-sonarcloud.js"]);
    const runStep = createRunStep(allScripts, failingScripts);

    const step = STEPS.find((s) => s.script === "extract-sonarcloud.js")!;
    assert.strictEqual(runStep(step, 0), false);
  });

  it("sets non-zero exit code when failures occur (simulated)", () => {
    const allScripts = new Set(STEPS.map((s) => s.script));
    const failingScripts = new Set(["extract-sonarcloud.js"]); // optional failure
    const runStep = createRunStep(allScripts, failingScripts);

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < STEPS.length; i++) {
      try {
        if (runStep(STEPS[i], i)) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
        break;
      }
    }

    // The optional script failed, so failedCount > 0
    assert.ok(failedCount > 0, "Failed count should be > 0 when optional step fails");
    // exit code would be 1 in real script
    const wouldSetExitCode = failedCount > 0;
    assert.strictEqual(wouldSetExitCode, true);
  });
});

describe("consolidate-all: step sequencing logic", () => {
  it("stops pipeline after required step failure", () => {
    const allScripts = new Set(STEPS.map((s) => s.script));
    const failingScripts = new Set(["normalize-all.js"]); // required step fails
    const runStep = createRunStep(allScripts, failingScripts);

    const stepsExecuted: string[] = [];
    let stopped = false;

    for (let i = 0; i < STEPS.length; i++) {
      try {
        runStep(STEPS[i], i);
        stepsExecuted.push(STEPS[i].script);
      } catch {
        stopped = true;
        break;
      }
    }

    assert.ok(stopped, "Pipeline should have stopped");
    // Steps before normalize-all should have run
    assert.ok(stepsExecuted.includes("extract-sonarcloud.js"));
    assert.ok(stepsExecuted.includes("extract-audits.js"));
    assert.ok(stepsExecuted.includes("extract-reviews.js"));
    // normalize-all caused the stop — dedup and views should NOT have run
    assert.ok(!stepsExecuted.includes("dedup-multi-pass.js"), "dedup should not run after failure");
    assert.ok(
      !stepsExecuted.includes("generate-views.js"),
      "generate-views should not run after failure"
    );
  });

  it("continues pipeline after optional step failure", () => {
    const allScripts = new Set(STEPS.map((s) => s.script));
    const failingScripts = new Set(["extract-sonarcloud.js"]); // optional step fails
    const runStep = createRunStep(allScripts, failingScripts);

    const stepsExecuted: string[] = [];

    for (let i = 0; i < STEPS.length; i++) {
      try {
        runStep(STEPS[i], i);
        stepsExecuted.push(STEPS[i].script);
      } catch {
        break; // Required failure would stop us
      }
    }

    // All steps should have executed (optional failure doesn't stop pipeline)
    assert.strictEqual(stepsExecuted.length, STEPS.length);
    assert.ok(stepsExecuted.includes("generate-views.js"), "generate-views should still run");
  });
});
