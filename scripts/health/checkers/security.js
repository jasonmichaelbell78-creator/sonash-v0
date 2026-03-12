/**
 * Security Health Checker
 *
 * Metrics: critical_vulns, high_vulns, audit_status, secret_exposure
 */

"use strict";

const { scoreMetric } = require("../lib/scoring");
const { runCommandSafe, safeParse } = require("../lib/utils");

const BENCHMARKS = {
  critical_vulns: { good: 0, average: 0, poor: 1 },
  high_vulns: { good: 0, average: 2, poor: 5 },
  audit_status: { good: 100, average: 80, poor: 50 },
  secret_exposure: { good: 0, average: 0, poor: 1 },
};

function checkSecurity() {
  const metrics = {};

  // npm audit
  let criticalCount = 0;
  let highCount = 0;
  let auditOk = true;

  const auditResult = runCommandSafe("npm", ["audit", "--json"], { timeout: 60000 });
  try {
    const out = (auditResult.output || "").trim();
    const err = (auditResult.stderr || "").trim();
    let rawJson = "{}";
    if (out.startsWith("{")) rawJson = out;
    else if (err.startsWith("{")) rawJson = err;
    const audit = safeParse(rawJson, {});

    if (audit?.metadata?.vulnerabilities) {
      criticalCount = audit.metadata.vulnerabilities.critical ?? 0;
      highCount = audit.metadata.vulnerabilities.high ?? 0;
    } else if (!auditResult.success) {
      auditOk = false;
    }
  } catch {
    auditOk = false;
  }

  const critScore = scoreMetric(criticalCount, BENCHMARKS.critical_vulns);
  metrics.critical_vulns = {
    value: criticalCount,
    ...critScore,
    benchmark: BENCHMARKS.critical_vulns,
  };

  const highScore = scoreMetric(highCount, BENCHMARKS.high_vulns);
  metrics.high_vulns = { value: highCount, ...highScore, benchmark: BENCHMARKS.high_vulns };

  // Audit status (100 if clean, 0 if failed to run)
  let auditStatusVal;
  if (!auditOk) auditStatusVal = 0;
  else if (criticalCount === 0 && highCount === 0) auditStatusVal = 100;
  else auditStatusVal = 60;
  const auditStatusScore = scoreMetric(auditStatusVal, BENCHMARKS.audit_status, "higher-is-better");
  metrics.audit_status = {
    value: auditStatusVal,
    ...auditStatusScore,
    benchmark: BENCHMARKS.audit_status,
  };

  // Secret exposure check
  let secretExposure = 0;
  const secResult = runCommandSafe("npm", ["run", "security:check"], { timeout: 60000 });
  const secOutput = `${secResult.output || ""}\n${secResult.stderr || ""}`;
  if (!secResult.success && /secret|credential|leak/i.test(secOutput)) {
    secretExposure = 1;
  }
  const secretScore = scoreMetric(secretExposure, BENCHMARKS.secret_exposure);
  metrics.secret_exposure = {
    value: secretExposure,
    ...secretScore,
    benchmark: BENCHMARKS.secret_exposure,
  };

  return { metrics, no_data: false };
}

module.exports = { checkSecurity };
