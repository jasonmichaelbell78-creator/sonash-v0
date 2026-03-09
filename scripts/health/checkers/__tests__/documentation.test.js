/* eslint-disable no-undef */
"use strict";

/**
 * Tests for checkers/documentation.js (CJS)
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const realFs = require("node:fs");

const CHECKER_PATH = path.join(__dirname, "..", "documentation.js");
const UTILS_PATH = require.resolve(path.join(__dirname, "..", "..", "lib", "utils.js"));

const origUtils = require.cache[UTILS_PATH];
const origStatSync = realFs.statSync;
const origReaddirSync = realFs.readdirSync;

function makeSuccess(output = "") {
  return { success: true, output, stderr: "", code: 0 };
}
function makeFail(output = "", stderr = "") {
  return { success: false, output, stderr, code: 1 };
}

// Load checker once; runCommandSafe routed through mutable ref
let runCommandSafeFn = (_cmd) => makeSuccess("");

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
const { checkDocumentation } = require(CHECKER_PATH);
if (origUtils) require.cache[UTILS_PATH] = origUtils;
else delete require.cache[UTILS_PATH];

function reset() {
  realFs.statSync = origStatSync;
  realFs.readdirSync = origReaddirSync;
  runCommandSafeFn = (_cmd) => makeSuccess("");
}

describe("checkDocumentation", () => {
  it("returns no_data=false always", () => {
    try {
      assert.equal(checkDocumentation().no_data, false);
    } finally {
      reset();
    }
  });

  it("includes all 8 expected metric keys", () => {
    try {
      const r = checkDocumentation();
      for (const key of [
        "staleness_days",
        "misplaced_docs",
        "broken_links",
        "crossdoc_issues",
        "canon_issues",
        "doc_count",
        "freshness_score",
        "coverage_estimate",
      ]) {
        assert.ok(key in r.metrics, `missing key: ${key}`);
      }
    } finally {
      reset();
    }
  });

  it("uses staleness fallback of 30 days when SESSION_CONTEXT.md is missing", () => {
    realFs.statSync = () => {
      throw new Error("ENOENT");
    };
    try {
      assert.equal(checkDocumentation().metrics.staleness_days.value, 30);
    } finally {
      reset();
    }
  });

  it("computes staleness_days from file mtime", () => {
    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
    realFs.statSync = () => ({ mtimeMs: fiveDaysAgo });
    try {
      assert.equal(checkDocumentation().metrics.staleness_days.value, 5);
    } finally {
      reset();
    }
  });

  it("computes freshness_score=100 when staleness_days=0", () => {
    realFs.statSync = () => ({ mtimeMs: Date.now() });
    try {
      assert.equal(checkDocumentation().metrics.freshness_score.value, 100);
    } finally {
      reset();
    }
  });

  it("computes freshness_score=0 when staleness_days >= 20", () => {
    realFs.statSync = () => ({ mtimeMs: Date.now() - 20 * 24 * 60 * 60 * 1000 });
    try {
      // max(0, 100 - 20*5) = 0
      assert.equal(checkDocumentation().metrics.freshness_score.value, 0);
    } finally {
      reset();
    }
  });

  it("counts .md files in docs directory", () => {
    realFs.statSync = () => {
      throw new Error("ENOENT");
    };
    realFs.readdirSync = (dir, opts) => {
      if (opts?.withFileTypes) {
        return [
          { name: "file1.md", isFile: () => true, isDirectory: () => false },
          { name: "file2.md", isFile: () => true, isDirectory: () => false },
          { name: "notes.txt", isFile: () => true, isDirectory: () => false },
        ];
      }
      return [];
    };
    try {
      const r = checkDocumentation();
      assert.ok(r.metrics.doc_count.value >= 2, `doc_count should be >= 2`);
    } finally {
      reset();
    }
  });

  it("parses canon_issues from validate:canon output", () => {
    runCommandSafeFn = (bin, args) => {
      if (args[1] === "validate:canon") return makeFail("3 issues found");
      return makeSuccess("");
    };
    try {
      assert.equal(checkDocumentation().metrics.canon_issues.value, 3);
    } finally {
      reset();
    }
  });

  it("all metric scores are in [0, 100]", () => {
    realFs.statSync = () => ({ mtimeMs: Date.now() - 20 * 24 * 60 * 60 * 1000 });
    runCommandSafeFn = (bin, args) => {
      if (args[1] === "validate:canon") return makeFail("5 issues found");
      if (args[1] === "crossdoc:check") return makeFail("3 Missing items");
      if (args[1] === "docs:external-links") return makeFail("8 broken links");
      return makeSuccess("");
    };
    try {
      const r = checkDocumentation();
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

  it("coverage_estimate is capped at 100", () => {
    realFs.statSync = () => {
      throw new Error("ENOENT");
    };
    realFs.readdirSync = (dir, opts) => {
      if (opts?.withFileTypes) {
        return Array.from({ length: 100 }, (_, i) => ({
          name: `f${i}.md`,
          isFile: () => true,
          isDirectory: () => false,
        }));
      }
      return [];
    };
    try {
      assert.ok(checkDocumentation().metrics.coverage_estimate.value <= 100);
    } finally {
      reset();
    }
  });

  it("parses crossdoc_issues when Missing keyword in output", () => {
    runCommandSafeFn = (bin, args) => {
      if (args[1] === "crossdoc:check") return makeFail("2 Missing references found");
      return makeSuccess("");
    };
    try {
      assert.equal(checkDocumentation().metrics.crossdoc_issues.value, 2);
    } finally {
      reset();
    }
  });
});
