/* global __dirname */
"use strict";

/**
 * /website-analysis — Self-Audit (per-skill wrapper)
 *
 * Runs the shared CAS handler-output-contract check as a FLOOR, then adds
 * website-analysis specific checks:
 *   - meta.json exists
 *   - analysis.json.source_type === "website"
 *   - compliance status recorded (HARD_BLOCK / WARN / PROCEED)
 *
 * Usage:    node scripts/skills/website-analysis/self-audit.js --slug=<slug>
 * Pattern:  .claude/skills/_shared/SELF_AUDIT_PATTERN.md
 * Floor:    scripts/cas/self-audit.js (CONVENTIONS §13 contract)
 */

const path = require("node:path");
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
const { sanitizeError, validatePathInDir } = require("../../lib/security-helpers.js");
const { safeReadText, safeReadJson } = require("../../lib/safe-cas-io.js");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "analysis");
const CAS_AUDIT = path.join(PROJECT_ROOT, "scripts", "cas", "self-audit.js");

function parseArgs(argv) {
  let slug = null;
  let json = false;
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--slug=")) slug = arg.slice(7);
    else if (arg === "--json") json = true;
  }
  return { slug, json };
}

function runFloor(slug) {
  const res = spawnSync("node", [CAS_AUDIT, `--slug=${slug}`], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
  });
  return {
    status: res.status === 0 ? "PASS" : "FAIL",
    exit: res.status,
    stdout: res.stdout || "",
    stderr: res.stderr || "",
  };
}

function checkMetaJson(slug) {
  try {
    validatePathInDir(ANALYSIS_DIR, slug);
    const metaPath = path.join(ANALYSIS_DIR, slug, "meta.json");
    if (!fs.existsSync(metaPath)) {
      return { status: "FAIL", details: "meta.json missing — required for website handler" };
    }
    const meta = safeReadJson(metaPath);
    if (!meta) return { status: "FAIL", details: "meta.json present but unreadable" };
    if (!meta.title && !meta.url) {
      return { status: "WARN", details: "meta.json present but missing title/url fields" };
    }
    return { status: "PASS", details: `meta.json: ${Object.keys(meta).length} fields` };
  } catch (err) {
    return { status: "FAIL", details: `meta check: ${sanitizeError(err)}` };
  }
}

function checkSourceTypeAndCompliance(slug) {
  try {
    validatePathInDir(ANALYSIS_DIR, slug);
    const jsonPath = path.join(ANALYSIS_DIR, slug, "analysis.json");
    if (!fs.existsSync(jsonPath)) return { status: "FAIL", details: "analysis.json missing" };
    const json = safeReadJson(jsonPath);
    if (!json) return { status: "FAIL", details: "analysis.json unreadable" };
    if (json.source_type !== "website") {
      return {
        status: "FAIL",
        details: `source_type is '${json.source_type}', expected 'website'`,
      };
    }
    const compliance = json.compliance_status || json.compliance?.status;
    if (!compliance) {
      return {
        status: "WARN",
        details: "compliance status not recorded (expected HARD_BLOCK / WARN / PROCEED)",
      };
    }
    const valid = ["HARD_BLOCK", "WARN", "PROCEED"];
    if (!valid.includes(compliance)) {
      return {
        status: "FAIL",
        details: `compliance status '${compliance}' not in ${valid.join("|")}`,
      };
    }
    return { status: "PASS", details: `source_type: website, compliance: ${compliance}` };
  } catch (err) {
    return { status: "FAIL", details: `source_type/compliance check: ${sanitizeError(err)}` };
  }
}

function main() {
  const { slug, json } = parseArgs(process.argv);
  if (!slug) {
    console.error(
      "Usage: node scripts/skills/website-analysis/self-audit.js --slug=<slug> [--json]"
    );
    process.exit(2);
  }

  const floor = runFloor(slug);
  if (!json) {
    process.stdout.write(floor.stdout);
    if (floor.stderr) process.stderr.write(floor.stderr);
  }

  const results = {
    "cas-floor": { status: floor.status, details: `exit=${floor.exit}` },
    meta_json: checkMetaJson(slug),
    source_type_and_compliance: checkSourceTypeAndCompliance(slug),
  };

  const mustFailed = Object.entries(results)
    .filter(([, v]) => v.status === "FAIL")
    .map(([k]) => k);
  const warned = Object.entries(results)
    .filter(([, v]) => v.status === "WARN")
    .map(([k]) => k);
  const overall = mustFailed.length === 0 ? "PASS" : "FAIL";

  const summary = {
    skill: "website-analysis",
    target: slug,
    dimensions: results,
    overall,
    must_failed: mustFailed,
    should_warned: warned,
    timestamp: new Date().toISOString(),
  };

  if (!json) {
    for (const [name, r] of Object.entries(results)) {
      console.log(`[${name}] ${r.status}: ${r.details}`);
    }
    console.log("\n---SUMMARY---");
  }
  console.log(JSON.stringify(summary, null, 2));
  if (!json) console.log("---END---");

  process.exit(overall === "PASS" ? 0 : 1);
}

main();
