/* eslint-disable no-undef */
"use strict";

/**
 * Tests for checkers/security.js (CJS)
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const CHECKER_PATH = path.join(__dirname, "..", "security.js");
const UTILS_PATH = require.resolve(path.join(__dirname, "..", "..", "lib", "utils.js"));

const origUtils = require.cache[UTILS_PATH];

function makeSuccess(output = "", stderr = "") {
  return { success: true, output, stderr, code: 0 };
}
function makeFail(output = "", stderr = "") {
  return { success: false, output, stderr, code: 1 };
}

function makeAuditJson(critical = 0, high = 0) {
  return JSON.stringify({
    metadata: { vulnerabilities: { critical, high, moderate: 0, low: 0 } },
  });
}

function loadChecker(runCommandSafeFn) {
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
      runCommandSafe: runCommandSafeFn || (() => makeSuccess("")),
      findProjectRoot: () => "/fake/root",
    },
  };
  delete require.cache[CHECKER_PATH];
  const checker = require(CHECKER_PATH);
  if (origUtils) require.cache[UTILS_PATH] = origUtils;
  else delete require.cache[UTILS_PATH];
  return checker;
}

describe("checkSecurity", () => {
  it("returns no_data=false always", () => {
    const { checkSecurity } = loadChecker(() => makeSuccess(makeAuditJson(0, 0)));
    assert.equal(checkSecurity().no_data, false);
  });

  it("includes all 4 expected metric keys", () => {
    const { checkSecurity } = loadChecker(() => makeSuccess(makeAuditJson(0, 0)));
    const r = checkSecurity();
    for (const key of ["critical_vulns", "high_vulns", "audit_status", "secret_exposure"]) {
      assert.ok(key in r.metrics, `missing key: ${key}`);
    }
  });

  it("returns 0 vulnerabilities when audit is clean", () => {
    const { checkSecurity } = loadChecker((bin, args) => {
      if (args[0] === "audit") return makeSuccess(makeAuditJson(0, 0));
      return makeSuccess("");
    });
    const r = checkSecurity();
    assert.equal(r.metrics.critical_vulns.value, 0);
    assert.equal(r.metrics.high_vulns.value, 0);
  });

  it("parses critical and high counts from audit JSON in stdout", () => {
    const { checkSecurity } = loadChecker((bin, args) => {
      if (args[0] === "audit") return makeFail(makeAuditJson(2, 5));
      return makeSuccess("");
    });
    const r = checkSecurity();
    assert.equal(r.metrics.critical_vulns.value, 2);
    assert.equal(r.metrics.high_vulns.value, 5);
  });

  it("parses audit JSON from stderr when stdout is empty", () => {
    const { checkSecurity } = loadChecker((bin, args) => {
      if (args[0] === "audit") return makeFail("", makeAuditJson(1, 3));
      return makeSuccess("");
    });
    const r = checkSecurity();
    assert.equal(r.metrics.critical_vulns.value, 1);
    assert.equal(r.metrics.high_vulns.value, 3);
  });

  it("sets audit_status=100 when no vulnerabilities", () => {
    const { checkSecurity } = loadChecker((bin, args) => {
      if (args[0] === "audit") return makeSuccess(makeAuditJson(0, 0));
      return makeSuccess("");
    });
    assert.equal(checkSecurity().metrics.audit_status.value, 100);
  });

  it("sets audit_status=60 when vulnerabilities exist but audit ran", () => {
    const { checkSecurity } = loadChecker((bin, args) => {
      if (args[0] === "audit") return makeFail(makeAuditJson(0, 2));
      return makeSuccess("");
    });
    assert.equal(checkSecurity().metrics.audit_status.value, 60);
  });

  it("sets audit_status=0 when audit command completely fails with no JSON", () => {
    const { checkSecurity } = loadChecker((bin, args) => {
      if (args[0] === "audit") return makeFail("Error running audit", "network error");
      return makeSuccess("");
    });
    assert.equal(checkSecurity().metrics.audit_status.value, 0);
  });

  it("sets secret_exposure=1 when security:check fails with secret keyword", () => {
    const { checkSecurity } = loadChecker((bin, args) => {
      if (args[0] === "audit") return makeSuccess(makeAuditJson(0, 0));
      if (args[1] === "security:check") return makeFail("Potential secret found in env.js");
      return makeSuccess("");
    });
    assert.equal(checkSecurity().metrics.secret_exposure.value, 1);
  });

  it("sets secret_exposure=0 when security:check passes", () => {
    const { checkSecurity } = loadChecker((bin, args) => {
      if (args[0] === "audit") return makeSuccess(makeAuditJson(0, 0));
      if (args[1] === "security:check") return makeSuccess("No secrets found");
      return makeSuccess("");
    });
    assert.equal(checkSecurity().metrics.secret_exposure.value, 0);
  });

  it("all metric scores are in [0, 100]", () => {
    const { checkSecurity } = loadChecker((bin, args) => {
      if (args[0] === "audit") return makeFail(makeAuditJson(3, 10));
      if (args[1] === "security:check") return makeFail("credential leak detected");
      return makeSuccess("");
    });
    const r = checkSecurity();
    for (const [key, metric] of Object.entries(r.metrics)) {
      assert.ok(
        metric.score >= 0 && metric.score <= 100,
        `"${key}" score ${metric.score} out of [0,100]`
      );
    }
  });

  it("handles malformed audit JSON gracefully without throwing", () => {
    const { checkSecurity } = loadChecker((bin, args) => {
      if (args[0] === "audit") return makeFail("not json at all {{{}", "");
      return makeSuccess("");
    });
    assert.doesNotThrow(() => checkSecurity());
  });
});
