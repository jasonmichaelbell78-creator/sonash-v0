/* eslint-disable no-undef */
"use strict";

/**
 * Tests for checkers/learning-effectiveness.js (CJS)
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const realFs = require("node:fs");

const CHECKER_PATH = path.join(__dirname, "..", "learning-effectiveness.js");
const UTILS_PATH = require.resolve(path.join(__dirname, "..", "..", "lib", "utils.js"));

const origUtils = require.cache[UTILS_PATH];
const origReadFileSync = realFs.readFileSync;

// Load checker once with faked utils
require.cache[UTILS_PATH] = {
  id: UTILS_PATH,
  filename: UTILS_PATH,
  loaded: true,
  exports: {
    ROOT_DIR: "/fake/root",
    safeParse: (s, fb = null) => {
      try {
        return JSON.parse(s);
      } catch {
        return fb;
      }
    },
    safeReadLines: () => [],
    runCommandSafe: () => ({ success: true, output: "", stderr: "", code: 0 }),
    findProjectRoot: () => "/fake/root",
  },
};
delete require.cache[CHECKER_PATH];
const { checkLearningEffectiveness } = require(CHECKER_PATH);
if (origUtils) require.cache[UTILS_PATH] = origUtils;
else delete require.cache[UTILS_PATH];

function makeContent(overrides = {}) {
  const f = {
    effectiveness: 88.5,
    automation: 32.0,
    failing: 3,
    learned: 15,
    critical: 92.0,
    ...overrides,
  };
  return [
    `| Learning Effectiveness | ${f.effectiveness}% |`,
    `| Automation Coverage | ${f.automation}% |`,
    `| Patterns Failing | ${f.failing} |`,
    `| Patterns Learned | ${f.learned} |`,
    `| Critical Pattern Success | ${f.critical}% |`,
  ].join("\n");
}

describe("checkLearningEffectiveness", () => {
  it("returns no_data=true when LEARNING_METRICS.md is missing", () => {
    realFs.readFileSync = () => {
      throw new Error("ENOENT");
    };
    try {
      const r = checkLearningEffectiveness();
      assert.equal(r.no_data, true);
      assert.deepEqual(r.metrics, {});
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("returns no_data=false when file is present (failing_patterns and learned_count always included)", () => {
    realFs.readFileSync = () => "# Nothing useful here\n\nJust text.";
    try {
      const r = checkLearningEffectiveness();
      assert.equal(r.no_data, false);
      assert.ok("failing_patterns" in r.metrics);
      assert.ok("learned_count" in r.metrics);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("returns no_data=false when at least one field is found", () => {
    realFs.readFileSync = () => "| Patterns Failing | 2 |";
    try {
      assert.equal(checkLearningEffectiveness().no_data, false);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("parses effectiveness correctly", () => {
    realFs.readFileSync = () => makeContent({ effectiveness: 91.5 });
    try {
      const r = checkLearningEffectiveness();
      assert.ok("effectiveness" in r.metrics);
      assert.equal(r.metrics.effectiveness.value, 91.5);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("parses automation_coverage correctly", () => {
    realFs.readFileSync = () => makeContent({ automation: 28.5 });
    try {
      const r = checkLearningEffectiveness();
      assert.ok("automation_coverage" in r.metrics);
      assert.equal(r.metrics.automation_coverage.value, 28.5);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("parses failing_patterns correctly", () => {
    realFs.readFileSync = () => makeContent({ failing: 7 });
    try {
      assert.equal(checkLearningEffectiveness().metrics.failing_patterns.value, 7);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("parses learned_count correctly", () => {
    realFs.readFileSync = () => makeContent({ learned: 22 });
    try {
      assert.equal(checkLearningEffectiveness().metrics.learned_count.value, 22);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("parses critical_success correctly", () => {
    realFs.readFileSync = () => makeContent({ critical: 96.0 });
    try {
      const r = checkLearningEffectiveness();
      assert.ok("critical_success" in r.metrics);
      assert.equal(r.metrics.critical_success.value, 96.0);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("omits effectiveness key when not present in file", () => {
    realFs.readFileSync = () => "| Patterns Failing | 1 |\n| Patterns Learned | 10 |";
    try {
      const r = checkLearningEffectiveness();
      assert.ok(!("effectiveness" in r.metrics));
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("all metric scores are in [0, 100]", () => {
    realFs.readFileSync = () =>
      makeContent({
        effectiveness: 50.0,
        automation: 5.0,
        failing: 15,
        learned: 2,
        critical: 55.0,
      });
    try {
      const r = checkLearningEffectiveness();
      for (const [key, metric] of Object.entries(r.metrics)) {
        assert.ok(
          metric.score >= 0 && metric.score <= 100,
          `"${key}" score ${metric.score} out of [0,100]`
        );
      }
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("failing_patterns is always present with value 0 when not in file", () => {
    realFs.readFileSync = () => "| Learning Effectiveness | 85.0% |";
    try {
      assert.equal(checkLearningEffectiveness().metrics.failing_patterns.value, 0);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });
});
