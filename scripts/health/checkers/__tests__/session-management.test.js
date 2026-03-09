/* eslint-disable no-undef */
"use strict";

/**
 * Tests for checkers/session-management.js (CJS)
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const realFs = require("node:fs");

const CHECKER_PATH = path.join(__dirname, "..", "session-management.js");
const UTILS_PATH = require.resolve(path.join(__dirname, "..", "..", "lib", "utils.js"));

const origUtils = require.cache[UTILS_PATH];
const origReadFileSync = realFs.readFileSync;

function makeSuccess(output = "") {
  return { success: true, output, stderr: "", code: 0 };
}
function makeFail(output = "", stderr = "") {
  return { success: false, output, stderr, code: 1 };
}

function daysAgoISO(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}
function hoursAgoISO(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

// Load checker once; route through mutable refs
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
const { checkSessionManagement } = require(CHECKER_PATH);
if (origUtils) require.cache[UTILS_PATH] = origUtils;
else delete require.cache[UTILS_PATH];

function reset() {
  realFs.readFileSync = origReadFileSync;
  runCommandSafeFn = () => makeSuccess("");
}

describe("checkSessionManagement", () => {
  it("returns no_data=false always", () => {
    try {
      assert.equal(checkSessionManagement().no_data, false);
    } finally {
      reset();
    }
  });

  it("includes all 3 expected metric keys", () => {
    try {
      const r = checkSessionManagement();
      for (const key of ["uncommitted_files", "stale_branch_days", "session_gap_hours"]) {
        assert.ok(key in r.metrics, `missing key: ${key}`);
      }
    } finally {
      reset();
    }
  });

  it("returns uncommitted_files=0 when git status is empty", () => {
    runCommandSafeFn = (bin, args) => {
      if (bin === "git" && args[0] === "status") return makeSuccess("");
      return makeSuccess("");
    };
    try {
      assert.equal(checkSessionManagement().metrics.uncommitted_files.value, 0);
    } finally {
      reset();
    }
  });

  it("counts uncommitted files from git status --porcelain lines", () => {
    const statusOutput = " M src/a.ts\n?? src/b.ts\nA  src/c.ts";
    runCommandSafeFn = (bin, args) => {
      if (bin === "git" && args[0] === "status") return makeSuccess(statusOutput);
      return makeSuccess("");
    };
    try {
      assert.equal(checkSessionManagement().metrics.uncommitted_files.value, 3);
    } finally {
      reset();
    }
  });

  it("computes stale_branch_days from last commit date", () => {
    const fiveDaysAgo = daysAgoISO(5);
    runCommandSafeFn = (bin, args) => {
      if (bin === "git" && args[0] === "log") return makeSuccess(fiveDaysAgo);
      return makeSuccess("");
    };
    try {
      const r = checkSessionManagement();
      assert.ok(
        r.metrics.stale_branch_days.value >= 4 && r.metrics.stale_branch_days.value <= 6,
        `stale_branch_days ${r.metrics.stale_branch_days.value} not near 5`
      );
    } finally {
      reset();
    }
  });

  it("returns stale_branch_days=0 when git log fails", () => {
    runCommandSafeFn = (bin, args) => {
      if (bin === "git" && args[0] === "log") return makeFail("fatal: no commits");
      return makeSuccess("");
    };
    try {
      assert.equal(checkSessionManagement().metrics.stale_branch_days.value, 0);
    } finally {
      reset();
    }
  });

  it("returns stale_branch_days=0 for invalid date output from git log", () => {
    runCommandSafeFn = (bin, args) => {
      if (bin === "git" && args[0] === "log") return makeSuccess("not-a-valid-date");
      return makeSuccess("");
    };
    try {
      assert.equal(checkSessionManagement().metrics.stale_branch_days.value, 0);
    } finally {
      reset();
    }
  });

  it("returns session_gap_hours=0 when session state file is missing", () => {
    realFs.readFileSync = () => {
      throw new Error("ENOENT");
    };
    try {
      assert.equal(checkSessionManagement().metrics.session_gap_hours.value, 0);
    } finally {
      reset();
    }
  });

  it("computes session_gap_hours from lastBegin when lastEnd is absent", () => {
    const sixHoursAgo = hoursAgoISO(6);
    realFs.readFileSync = () => JSON.stringify({ lastBegin: sixHoursAgo });
    try {
      const r = checkSessionManagement();
      assert.ok(
        r.metrics.session_gap_hours.value >= 5 && r.metrics.session_gap_hours.value <= 7,
        `session_gap_hours ${r.metrics.session_gap_hours.value} not near 6`
      );
    } finally {
      reset();
    }
  });

  it("returns session_gap_hours=0 when lastEnd is present (session closed)", () => {
    realFs.readFileSync = () =>
      JSON.stringify({ lastBegin: hoursAgoISO(8), lastEnd: hoursAgoISO(1) });
    try {
      assert.equal(checkSessionManagement().metrics.session_gap_hours.value, 0);
    } finally {
      reset();
    }
  });

  it("all metric scores are in [0, 100]", () => {
    const statusOutput = Array.from({ length: 20 }, (_, i) => ` M file${i}.ts`).join("\n");
    realFs.readFileSync = () => JSON.stringify({ lastBegin: hoursAgoISO(20) });
    runCommandSafeFn = (bin, args) => {
      if (bin === "git" && args[0] === "status") return makeSuccess(statusOutput);
      if (bin === "git" && args[0] === "log") return makeSuccess(daysAgoISO(30));
      return makeSuccess("");
    };
    try {
      const r = checkSessionManagement();
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
