/* eslint-disable no-undef */
"use strict";

/**
 * Tests for checkers/pattern-enforcement.js (CJS)
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const realFs = require("node:fs");

const CHECKER_PATH = path.join(__dirname, "..", "pattern-enforcement.js");
const UTILS_PATH = require.resolve(path.join(__dirname, "..", "..", "lib", "utils.js"));

const origUtils = require.cache[UTILS_PATH];
const origReadFileSync = realFs.readFileSync;

function makeSuccess(output = "") {
  return { success: true, output, stderr: "", code: 0 };
}
function makeFail(output = "", stderr = "") {
  return { success: false, output, stderr, code: 1 };
}

// Load checker once; route runCommandSafe through a mutable ref
let runCommandSafeFn = () => makeSuccess("");

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
    runCommandSafe: (...args) => runCommandSafeFn(...args),
    findProjectRoot: () => "/fake/root",
  },
};
delete require.cache[CHECKER_PATH];
const { checkPatternEnforcement } = require(CHECKER_PATH);
if (origUtils) require.cache[UTILS_PATH] = origUtils;
else delete require.cache[UTILS_PATH];

function reset() {
  realFs.readFileSync = origReadFileSync;
  runCommandSafeFn = () => makeSuccess("");
}

describe("checkPatternEnforcement", () => {
  it("returns no_data=false always", () => {
    try {
      assert.equal(checkPatternEnforcement().no_data, false);
    } finally {
      reset();
    }
  });

  it("includes all 4 expected metric keys", () => {
    try {
      const r = checkPatternEnforcement();
      for (const key of ["repeat_offenders", "outdated_patterns", "hotspot_files", "sync_issues"]) {
        assert.ok(key in r.metrics, `missing key: ${key}`);
      }
    } finally {
      reset();
    }
  });

  it("returns hotspot_files=0 and repeat_offenders=0 when warned-files.json is missing", () => {
    realFs.readFileSync = () => {
      throw new Error("ENOENT");
    };
    try {
      const r = checkPatternEnforcement();
      assert.equal(r.metrics.hotspot_files.value, 0);
      assert.equal(r.metrics.repeat_offenders.value, 0);
    } finally {
      reset();
    }
  });

  it("counts hotspots from warned-files.json (numeric format)", () => {
    realFs.readFileSync = () =>
      JSON.stringify({ files: { "src/a.ts": 5, "src/b.ts": 2, "src/c.ts": 1 } });
    try {
      assert.equal(checkPatternEnforcement().metrics.hotspot_files.value, 3);
    } finally {
      reset();
    }
  });

  it("counts repeat offenders as files with count >= 3 (numeric)", () => {
    realFs.readFileSync = () =>
      JSON.stringify({ files: { "src/a.ts": 5, "src/b.ts": 3, "src/c.ts": 2 } });
    try {
      // a.ts (5>=3) and b.ts (3>=3) = 2
      assert.equal(checkPatternEnforcement().metrics.repeat_offenders.value, 2);
    } finally {
      reset();
    }
  });

  it("counts repeat offenders from object format with count field", () => {
    realFs.readFileSync = () =>
      JSON.stringify({ files: { "src/a.ts": { count: 4 }, "src/b.ts": { count: 1 } } });
    try {
      assert.equal(checkPatternEnforcement().metrics.repeat_offenders.value, 1);
    } finally {
      reset();
    }
  });

  it("parses outdated count from patterns:sync output", () => {
    runCommandSafeFn = (bin, args) => {
      if (args[1] === "patterns:sync") return makeSuccess("3 outdated patterns found");
      return makeSuccess("");
    };
    try {
      assert.equal(checkPatternEnforcement().metrics.outdated_patterns.value, 3);
    } finally {
      reset();
    }
  });

  it("sets outdated_patterns=1 when patterns:sync fails with non-Missing error", () => {
    runCommandSafeFn = (bin, args) => {
      if (args[1] === "patterns:sync") return makeFail("Error occurred", "error");
      return makeSuccess("");
    };
    try {
      assert.equal(checkPatternEnforcement().metrics.outdated_patterns.value, 1);
    } finally {
      reset();
    }
  });

  it("keeps outdated_patterns=0 when patterns:sync returns Missing script", () => {
    runCommandSafeFn = (bin, args) => {
      if (args[1] === "patterns:sync")
        return makeFail("Missing script: patterns:sync", "Missing script");
      return makeSuccess("");
    };
    try {
      assert.equal(checkPatternEnforcement().metrics.outdated_patterns.value, 0);
    } finally {
      reset();
    }
  });

  it("parses sync_issues from patterns:check violation output", () => {
    runCommandSafeFn = (bin, args) => {
      if (args[1] === "patterns:check") return makeFail("7 violations detected");
      return makeSuccess("");
    };
    try {
      assert.equal(checkPatternEnforcement().metrics.sync_issues.value, 7);
    } finally {
      reset();
    }
  });

  it("all metric scores are in [0, 100]", () => {
    realFs.readFileSync = () =>
      JSON.stringify({ files: { "a.ts": 10, "b.ts": 5, "c.ts": 3, "d.ts": 1 } });
    runCommandSafeFn = (bin, args) => {
      if (args[1] === "patterns:sync") return makeFail("5 out-of-sync patterns");
      if (args[1] === "patterns:check") return makeFail("10 violations");
      return makeSuccess("");
    };
    try {
      const r = checkPatternEnforcement();
      for (const [key, metric] of Object.entries(r.metrics)) {
        assert.ok(
          metric.score >= 0 && metric.score <= 100,
          `"${key}" score ${metric.score} out of [0,100]`
        );
      }
    } finally {
      reset();
    }
  });
});
